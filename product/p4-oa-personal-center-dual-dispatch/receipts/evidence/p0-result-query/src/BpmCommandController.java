package com.sw.ck.bpm.process.controller;

import com.sw.ck.bpm.process.dto.ApprovalAction;
import com.sw.ck.bpm.process.dto.ApprovalActionRequest;
import com.sw.ck.bpm.process.dto.CommandAcceptRespDTO;
import com.sw.ck.bpm.process.dto.CommandStatusRespDTO;
import com.sw.ck.bpm.process.entity.BpmCommand;
import com.sw.ck.bpm.process.entity.CommandChannelEnum;
import com.sw.ck.bpm.process.entity.CommandStatusEnum;
import com.sw.ck.bpm.process.service.BpmCommandService;
import com.sw.ck.bpm.process.service.CommandAcceptService;
import com.sw.ck.bpm.process.service.CommandSyncWaiter;
import com.sw.ck.common.exception.BaseException;
import com.sw.ck.common.exception.CommonErrorCode;
import com.sw.ck.common.response.R;
import com.sw.ck.security.holder.LoginUser;
import com.sw.ck.security.holder.LoginUserHolder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 流程业务命令通道控制器。
 * <p>
 * 普通 OA 异步通道（channel=NORMAL，默认）：受理返回受理标识，结果经 GET 回查；
 * P0 同步优先通道（channel=P0）：需专用权限 {@code workflow:p0:dispatch}，
 * 受理后进入独立 P0 调度车道优先处理，并在有界时间内等待单次命令结果；
 * 超时返回受理标识与实际已知状态（超时≠失败，可按 commandId 回查，禁止重复提交）。
 * P0 权限不越过业务对象权限：消费端仍执行审批人/任务状态校验。
 * </p>
 */
@RestController
@RequestMapping("/workflow/commands")
public class BpmCommandController {

    private static final Logger log = LoggerFactory.getLogger(BpmCommandController.class);

    private final CommandAcceptService commandAcceptService;
    private final BpmCommandService bpmCommandService;
    private final CommandSyncWaiter syncWaiter;
    private final com.sw.ck.security.support.PermissionService permissionService;

    public BpmCommandController(CommandAcceptService commandAcceptService,
                                BpmCommandService bpmCommandService,
                                CommandSyncWaiter syncWaiter,
                                com.sw.ck.security.support.PermissionService permissionService) {
        this.commandAcceptService = commandAcceptService;
        this.bpmCommandService = bpmCommandService;
        this.syncWaiter = syncWaiter;
        this.permissionService = permissionService;
    }

    /**
     * 受理审批动作（channel=NORMAL 异步 / P0 同步优先）。
     * <p>
     * 事务边界：受理在 {@code CommandAcceptService} 的独立事务内持久化并提交，
     * 提交先于 P0 有界等待——等待期间受理行对消费者可见（G5）。
     * </p>
     */
    @PostMapping("/tasks/{taskId}/{action}")
    public R<CommandAcceptRespDTO> acceptTaskAction(@PathVariable String taskId,
                                                    @PathVariable String action,
                                                    @RequestBody(required = false) ApprovalActionRequest request,
                                                    @RequestParam(required = false, defaultValue = "NORMAL") String channel) {
        ApprovalAction approvalAction = resolveAction(action);
        if ("P0".equalsIgnoreCase(channel)) {
            return R.ok(acceptP0Sync(taskId, approvalAction, request));
        }
        if (!"NORMAL".equalsIgnoreCase(channel)) {
            throw new BaseException(CommonErrorCode.PARAM_ERROR.getCode(), "未知通道: " + channel);
        }
        return R.ok(commandAcceptService.acceptTaskAction(
                taskId, approvalAction, request, CommandChannelEnum.NORMAL));
    }

    /** P0 同步优先：专用权限 + 受理 + 有界等待单次命令结果。 */
    private CommandAcceptRespDTO acceptP0Sync(String taskId, ApprovalAction action,
                                              ApprovalActionRequest request) {
        // 经既有 RBAC 表达式入口判定（superAdmin 短路语义与全局一致）；
        // 权限码 workflow:p0:dispatch 仅显式授权的紧急调用方角色持有。
        if (!permissionService.hasPermi(P0_PERMISSION)) {
            LoginUser loginUser = LoginUserHolder.get();
            log.warn("P0 通道拒绝（缺专用权限）: taskId={}, user={}", taskId,
                    loginUser == null ? null : loginUser.getUserId());
            throw new BaseException(CommonErrorCode.FORBIDDEN.getCode(),
                    "缺少 P0 调用专用权限: " + P0_PERMISSION);
        }
        CommandAcceptRespDTO accepted = commandAcceptService.acceptTaskAction(
                taskId, action, request, CommandChannelEnum.P0);
        CommandSyncWaiter.WaitResult wait = syncWaiter.waitTerminal(accepted.getCommandId());
        CommandAcceptRespDTO resp = new CommandAcceptRespDTO();
        resp.setCommandId(accepted.getCommandId());
        resp.setCommandKey(accepted.getCommandKey());
        resp.setCommandType(accepted.getCommandType());
        resp.setChannel(CommandChannelEnum.P0.getCode());
        resp.setDuplicated(accepted.isDuplicated());
        resp.setStatus(switch (wait.outcome()) {
            case COMPLETED -> CommandStatusEnum.COMPLETED.getCode();
            case FAILED -> CommandStatusEnum.FAILED.getCode();
            case TIMEOUT -> CommandAcceptRespDTO.STATUS_ACCEPTED;
        });
        return resp;
    }

    /** P0 调用专用权限码。 */
    public static final String P0_PERMISSION = "workflow:p0:dispatch";

    /**
     * 命令状态回查（仅受理人本人可查）。
     */
    @GetMapping("/{commandId}")
    public R<CommandStatusRespDTO> status(@PathVariable Long commandId) {
        LoginUser loginUser = LoginUserHolder.get();
        BpmCommand command = bpmCommandService.getById(commandId);
        if (command == null) {
            throw new BaseException(CommonErrorCode.NOT_FOUND.getCode(), "命令不存在");
        }
        if (command.getInitiatorId() == null
                || !command.getInitiatorId().equals(loginUser.getUserId())) {
            log.warn("命令回查越权拒绝: commandId={}, initiator={}, currentUser={}",
                    commandId, command.getInitiatorId(), loginUser.getUserId());
            throw new BaseException(CommonErrorCode.FORBIDDEN.getCode(), "无权查看该命令");
        }
        CommandStatusRespDTO dto = new CommandStatusRespDTO();
        dto.setCommandId(command.getId());
        dto.setCommandType(command.getCommandType());
        dto.setChannel(command.getChannel());
        dto.setStatus(command.getStatus());
        dto.setResult(command.getResult());
        dto.setFailureReason(command.getFailureReason());
        dto.setRetryCount(command.getRetryCount());
        dto.setCreateTime(command.getCreateTime());
        dto.setFinishedAt(command.getFinishedAt());
        dto.setFlowStart(resolveFlowStartView(command));
        return R.ok(dto);
    }

    /**
     * 实际启动结果关联（B1，提示08）：DRAFT_SUBMIT 完成且携带 recordId 时，
     * 以受理时确定的唯一关联键 FLOW_START:{recordId} 解析本次业务发起的子命令
     * 只读视图（子命令与父命令同为受理发起人，越权边界不变、纯只读、不新建任何
     * 受理/实例）。父命令内部 COMPLETED 不因此改写；缺 recordId 或子命令不存在
     * 时返回 null——调用方据 "flowStart != STARTED" 不得解读为业务发起成功。
     */
    private CommandStatusRespDTO.FlowStartView resolveFlowStartView(BpmCommand command) {
        if (!"DRAFT_SUBMIT".equals(command.getCommandType())
                || !"COMPLETED".equals(command.getStatus())
                || command.getResult() == null) {
            return null;
        }
        String recordId;
        try {
            recordId = new com.fasterxml.jackson.databind.ObjectMapper()
                    .readTree(command.getResult()).path("recordId").asText(null);
        } catch (Exception e) {
            log.warn("启动结果关联解析失败: commandId={}", command.getId());
            return null;
        }
        if (recordId == null || recordId.isBlank()) {
            return null;
        }
        BpmCommand child = bpmCommandService.lambdaQuery()
                .eq(BpmCommand::getCommandKey, "FLOW_START:" + recordId)
                .last("LIMIT 1")
                .one();
        if (child == null) {
            return null;
        }
        CommandStatusRespDTO.FlowStartView view = new CommandStatusRespDTO.FlowStartView();
        view.setCommandId(child.getId());
        view.setStatus(child.getStatus());
        view.setResult(child.getResult());
        view.setFailureReason(child.getFailureReason());
        view.setCreateTime(child.getCreateTime());
        view.setFinishedAt(child.getFinishedAt());
        return view;
    }

    private ApprovalAction resolveAction(String action) {
        return switch (action.toUpperCase()) {
            case "COMPLETE", "APPROVE", "APPROVAL" -> ApprovalAction.APPROVE;
            case "REJECT" -> ApprovalAction.REJECT;
            case "RETURN" -> ApprovalAction.RETURN;
            default -> throw new BaseException(CommonErrorCode.PARAM_ERROR.getCode(), "未知审批动作: " + action);
        };
    }
}
