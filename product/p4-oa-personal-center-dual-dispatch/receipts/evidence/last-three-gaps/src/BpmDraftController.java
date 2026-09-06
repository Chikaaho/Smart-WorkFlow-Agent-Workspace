package com.sw.ck.bpm.process.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sw.ck.bpm.process.dto.CommandAcceptRespDTO;
import com.sw.ck.bpm.process.entity.BpmDraft;
import com.sw.ck.bpm.process.entity.CommandChannelEnum;
import com.sw.ck.bpm.process.entity.DraftStatusEnum;
import com.sw.ck.bpm.process.service.BpmDraftService;
import com.sw.ck.bpm.process.service.CommandSyncWaiter;
import com.sw.ck.bpm.process.service.DraftSubmitService;
import com.sw.ck.common.exception.BaseException;
import com.sw.ck.common.exception.CommonErrorCode;
import com.sw.ck.common.page.PageParam;
import com.sw.ck.common.page.PageResult;
import com.sw.ck.common.response.R;
import com.sw.ck.form.api.dto.FormDefDTO;
import com.sw.ck.security.support.PermissionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/**
 * 我的草稿控制器（业务发起草稿，与表单设计/流程定义草稿无关）。
 * <p>
 * 身份约束：全部按当前登录用户（create_by）+ 当前租户过滤，不信任客户端传入的
 * 查询人身份。保存不触发实例或审批；提交走统一命令边界（DRAFT_SUBMIT），
 * 受理中快照冻结，重复提交返回同一受理结果。
 * <p>
 * 事务边界（G5）：提交受理在 {@link DraftSubmitService} 事务内提交后，
 * P0 有界等待才在控制器层发生——等待期间受理对消费者可见。
 * </p>
 */
@RestController
@RequestMapping("/workflow/drafts")
public class BpmDraftController {

    private static final Logger log = LoggerFactory.getLogger(BpmDraftController.class);

    private final BpmDraftService draftService;
    private final DraftSubmitService draftSubmitService;
    private final ObjectMapper objectMapper;
    private final CommandSyncWaiter syncWaiter;
    private final PermissionService permissionService;

    public BpmDraftController(BpmDraftService draftService,
                              DraftSubmitService draftSubmitService,
                              ObjectMapper objectMapper,
                              CommandSyncWaiter syncWaiter,
                              PermissionService permissionService) {
        this.draftService = draftService;
        this.draftSubmitService = draftSubmitService;
        this.objectMapper = objectMapper;
        this.syncWaiter = syncWaiter;
        this.permissionService = permissionService;
    }

    /** 我的草稿分页列表。 */
    @GetMapping
    public R<PageResult<BpmDraft>> list(PageParam pageParam) {
        var loginUser = com.sw.ck.security.holder.LoginUserHolder.get();
        long total = draftService.lambdaQuery()
                .eq(BpmDraft::getCreateBy, loginUser.getUserId())
                .count();
        List<BpmDraft> records = draftService.lambdaQuery()
                .eq(BpmDraft::getCreateBy, loginUser.getUserId())
                .orderByDesc(BpmDraft::getUpdateTime)
                .last("LIMIT " + pageParam.getPageSize()
                        + " OFFSET " + (pageParam.getPageNum() - 1) * pageParam.getPageSize())
                .list();
        PageResult<BpmDraft> page = new PageResult<>();
        page.setRecords(records);
        page.setTotal(total);
        page.setPageNum(pageParam.getPageNum());
        page.setPageSize(pageParam.getPageSize());
        return R.ok(page);
    }

    /** 新建草稿（formKey 必须为已发布表单；保存不触发流程）。 */
    @PostMapping
    @Transactional
    public R<BpmDraft> create(@RequestBody Map<String, Object> body) {
        var loginUser = com.sw.ck.security.holder.LoginUserHolder.get();
        String formKey = str(body.get("formKey"));
        FormDefDTO formDef = draftSubmitService.requirePublishedForm(formKey);

        BpmDraft draft = new BpmDraft();
        draft.setTitle(str(body.get("title")));
        draft.setFormKey(formKey);
        draft.setFormVersion(formDef.getFormVersion() == null ? null
                : Long.valueOf(formDef.getFormVersion()));
        // 流程由系统按表单绑定解析；客户端 processDefKey 不能成为真源。
        draft.setProcessDefKey(resolveDraftProcessDefKey(formKey));
        draft.setPayload(toJson(body.get("payload")));
        draft.setStatus(DraftStatusEnum.EDITING.getCode());
        draft.setSubmitSeq(0);
        draftService.save(draft);
        log.info("草稿已创建: id={}, formKey={}, owner={}", draft.getId(), formKey, loginUser.getUserId());
        return R.ok(draft);
    }

    /** 草稿详情（仅本人）。 */
    @GetMapping("/{id}")
    public R<BpmDraft> get(@PathVariable Long id) {
        return R.ok(draftSubmitService.loadOwned(id));
    }

    /** 更新草稿（仅本人；SUBMITTING/SUBMITTED 冻结，FAILED 可修正）。 */
    @PutMapping("/{id}")
    @Transactional
    public R<BpmDraft> update(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        BpmDraft draft = draftSubmitService.loadOwned(id);
        requireEditable(draft);
        if (body.containsKey("title")) {
            draft.setTitle(str(body.get("title")));
        }
        // 不接受客户端重绑流程。流程关系由管理员维护，用户只从表单发起。
        if (body.containsKey("payload")) {
            draft.setPayload(toJson(body.get("payload")));
        }
        // D3/A9：发起范围撤销后，已有草稿不可继续保存（内容保留、不可发起）。
        if (body.containsKey("payload")) {
            draftSubmitService.requirePublishedForm(draft.getFormKey());
        }
        // D3：用户显式重绑表单版本（refreshFormVersion=true）时刷新快照版本与绑定；
        // 不随发布静默变化；无法保留的数据由前端在重绑时提示核对。
        if (Boolean.TRUE.equals(body.get("refreshFormVersion"))) {
            FormDefDTO formDef = draftSubmitService.requirePublishedForm(draft.getFormKey());
            draft.setFormVersion(formDef.getFormVersion() == null ? null
                    : Long.valueOf(formDef.getFormVersion()));
            draft.setProcessDefKey(draftSubmitService.resolveUniqueActiveProcessDefKey(draft.getFormKey()));
        }
        if (DraftStatusEnum.FAILED.getCode().equals(draft.getStatus())) {
            draft.setStatus(DraftStatusEnum.EDITING.getCode());
            draft.setLastError(null);
        }
        draftService.updateById(draft);
        return R.ok(draft);
    }

    /** 删除草稿（仅本人；受理中不可删）。 */
    @DeleteMapping("/{id}")
    public R<Void> delete(@PathVariable Long id) {
        BpmDraft draft = draftSubmitService.loadOwned(id);
        if (DraftStatusEnum.SUBMITTING.getCode().equals(draft.getStatus())) {
            throw new BaseException(CommonErrorCode.PARAM_ERROR.getCode(), "草稿提交受理中，不能删除");
        }
        draftService.removeById(id);
        return R.ok();
    }

    /**
     * 正式提交草稿（统一命令边界，普通异步通道）。
     */
    @PostMapping("/{id}/submit")
    public R<CommandAcceptRespDTO> submit(@PathVariable Long id) {
        return R.ok(draftSubmitService.submit(id, CommandChannelEnum.NORMAL));
    }

    /**
     * 正式提交草稿（通道可选）。channel=P0 为同步优先通道（需
     * {@code workflow:p0:dispatch} 专用权限）：受理事务先提交，P0 车道调度 +
     * 有界等待在事务外，超时返回受理标识（可回查），不重复提交。
     */
    @PostMapping(value = "/{id}/submit", params = {"channel"})
    public R<CommandAcceptRespDTO> submit(@PathVariable Long id,
                                          @RequestParam String channel) {
        boolean p0 = "P0".equalsIgnoreCase(channel);
        if (!p0 && !"NORMAL".equalsIgnoreCase(channel)) {
            throw new BaseException(CommonErrorCode.PARAM_ERROR.getCode(), "未知通道: " + channel);
        }
        if (p0 && !permissionService.hasPermi("workflow:p0:dispatch")) {
            throw new BaseException(CommonErrorCode.FORBIDDEN.getCode(),
                    "缺少 P0 调用专用权限: workflow:p0:dispatch");
        }
        CommandAcceptRespDTO accepted = draftSubmitService.submit(id,
                p0 ? CommandChannelEnum.P0 : CommandChannelEnum.NORMAL);
        if (!p0) {
            return R.ok(accepted);
        }
        // B1：同步业务发起结果以"实际启动"为准——P0 等待父命令完成后继续等
        // FLOW_START 子命令终态；预算到期返回受理态（可按 commandId 回查），
        // 不把尚未执行的启动倒算成同步返回时已完成。
        CommandSyncWaiter.WaitResult wait = syncWaiter.waitSyncResult(accepted.getCommandId());
        accepted.setStatus(switch (wait.outcome()) {
            case COMPLETED -> "COMPLETED";
            case FAILED -> "FAILED";
            case TIMEOUT -> CommandAcceptRespDTO.STATUS_ACCEPTED;
        });
        return R.ok(accepted);
    }

    // ==================== 内部方法 ====================

    private void requireEditable(BpmDraft draft) {
        if (!DraftStatusEnum.EDITING.getCode().equals(draft.getStatus())
                && !DraftStatusEnum.FAILED.getCode().equals(draft.getStatus())) {
            throw new BaseException(CommonErrorCode.PARAM_ERROR.getCode(),
                    "草稿当前状态 " + draft.getStatus() + " 不可编辑");
        }
    }

    private String resolveDraftProcessDefKey(String formKey) {
        try {
            return draftSubmitService.resolveUniqueActiveProcessDefKey(formKey);
        } catch (BaseException ex) {
            // 没有有效绑定时仍允许保存未完成草稿；正式提交会再次明确拒绝。
            if (ex.getCode() == CommonErrorCode.PARAM_ERROR.getCode()
                    && ex.getMessage() != null
                    && ex.getMessage().contains("尚未关联")) {
                return null;
            }
            throw ex;
        }
    }

    private String toJson(Object value) {
        try {
            if (value == null) {
                return "{}";
            }
            // 前端以字符串提交的 payload 视为已序列化 JSON，原样存储（避免双重编码）
            if (value instanceof String text) {
                if (text.isBlank()) {
                    return "{}";
                }
                objectMapper.readTree(text);
                return text;
            }
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new IllegalStateException("序列化草稿数据失败", e);
        }
    }

    private String str(Object value) {
        return value == null ? null : String.valueOf(value);
    }
}
