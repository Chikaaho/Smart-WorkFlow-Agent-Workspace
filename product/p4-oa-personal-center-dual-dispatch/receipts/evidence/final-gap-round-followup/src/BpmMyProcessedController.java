package com.sw.ck.bpm.process.controller;

import com.sw.ck.bpm.api.dto.BpmTaskDTO;
import com.sw.ck.bpm.api.facade.BpmTaskFacade;
import com.sw.ck.bpm.process.dto.MyProcessedItemDTO;
import com.sw.ck.bpm.process.entity.ApprovalActionRecord;
import com.sw.ck.bpm.process.entity.BpmInstance;
import com.sw.ck.bpm.process.entity.BpmProcessDef;
import com.sw.ck.bpm.process.service.ApprovalActionService;
import com.sw.ck.bpm.process.service.BpmInstanceService;
import com.sw.ck.bpm.process.service.BpmProcessDefService;
import com.sw.ck.common.page.PageParam;
import com.sw.ck.common.page.PageResult;
import com.sw.ck.common.response.R;
import com.sw.ck.security.holder.LoginUser;
import com.sw.ck.security.holder.LoginUserHolder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * 我的已办控制器（D4：以本人真实办理行为为权威）。
 * <p>
 * 权威来源 = {@code sw_bpm_approval_action}（本人动作，uk tenant+task+actor）；
 * 兼容来源 = 引擎 finished 历史且 assignee=本人（可证明的本人完成证据），
 * 标记 HISTORY_COMPAT。未经本人办理而被取消/删除的任务不出现在任一来源。
 * </p>
 */
@RestController
@RequestMapping("/workflow/my/processed")
public class BpmMyProcessedController {

    private static final Logger log = LoggerFactory.getLogger(BpmMyProcessedController.class);

    private final ApprovalActionService approvalActionService;
    private final BpmInstanceService bpmInstanceService;
    private final BpmProcessDefService bpmProcessDefService;
    private final BpmTaskFacade bpmTaskFacade;

    public BpmMyProcessedController(ApprovalActionService approvalActionService,
                                    BpmInstanceService bpmInstanceService,
                                    BpmProcessDefService bpmProcessDefService,
                                    BpmTaskFacade bpmTaskFacade) {
        this.approvalActionService = approvalActionService;
        this.bpmInstanceService = bpmInstanceService;
        this.bpmProcessDefService = bpmProcessDefService;
        this.bpmTaskFacade = bpmTaskFacade;
    }

    @GetMapping
    public R<PageResult<MyProcessedItemDTO>> myProcessed(PageParam pageParam,
                                                         @RequestParam(required = false) String source) {
        LoginUser loginUser = LoginUserHolder.get();
        long actorId = loginUser.getUserId();

        List<MyProcessedItemDTO> items = new ArrayList<>();
        Set<String> taskIdsFromActions = new HashSet<>();

        boolean includeAction = source == null || source.isBlank()
                || MyProcessedItemDTO.SOURCE_ACTION.equals(source);
        boolean includeCompat = source == null || source.isBlank()
                || MyProcessedItemDTO.SOURCE_HISTORY_COMPAT.equals(source);

        if (includeAction && includeCompat) {
            // 默认（未指定来源）= 全局合并分页（审查04：跨页不漏不重、total 精确非上界）。
            // 权威来源 = 本人全部 ACTION 记录；兼容来源 = 引擎 finished 历史（assignee=本人，
            // 被取消/删除任务不在 finished 契约内）全量分页拉取；已有 ACTION 的任务跨源去重
            // （ACTION 权威）；合并按办理时间倒序全局排序后内存切片。个人已办为用户自有记录，
            // 全量物化有界；total=合并去重后条数（精确）。
            List<ApprovalActionRecord> allActions = new ArrayList<>();
            long actionTotal = approvalActionService.countByActor(actorId);
            int pageSize = (int) pageParam.getPageSize();
            for (int off = 0; off < actionTotal; off += pageSize) {
                allActions.addAll(approvalActionService.pageByActor(actorId, off, pageSize));
            }
            Set<String> actionTaskIds = new HashSet<>();
            List<MyProcessedItemDTO> merged = new ArrayList<>();
            for (ApprovalActionRecord record : allActions) {
                actionTaskIds.add(record.getTaskId());
                merged.add(toItem(record, null));
            }
            long compatTotal = bpmTaskFacade.countProcessed(
                    String.valueOf(loginUser.getTenantId()), String.valueOf(actorId));
            for (int off = 0; off < compatTotal; off += pageSize) {
                List<BpmTaskDTO> finished = bpmTaskFacade.queryProcessedPage(
                        String.valueOf(loginUser.getTenantId()), String.valueOf(actorId), off, pageSize);
                for (BpmTaskDTO task : finished) {
                    if (actionTaskIds.contains(task.getTaskId())) {
                        continue;
                    }
                    MyProcessedItemDTO item = new MyProcessedItemDTO();
                    item.setSource(MyProcessedItemDTO.SOURCE_HISTORY_COMPAT);
                    fillFromTask(item, task);
                    merged.add(item);
                }
            }
            merged.sort(java.util.Comparator.comparing(
                    MyProcessedItemDTO::getHandleTime,
                    java.util.Comparator.nullsLast(java.util.Comparator.naturalOrder())).reversed());
            long total = merged.size();
            int from = (int) Math.min((long) (pageParam.getPageNum() - 1) * pageParam.getPageSize(), total);
            int to = (int) Math.min(from + (long) pageParam.getPageSize(), total);
            PageResult<MyProcessedItemDTO> page = new PageResult<>();
            page.setRecords(new ArrayList<>(merged.subList(from, to)));
            page.setTotal(total);
            page.setPageNum(pageParam.getPageNum());
            page.setPageSize(pageParam.getPageSize());
            return R.ok(page);
        }

        if (includeAction) {
            long total = approvalActionService.countByActor(actorId);
            long offset = Math.min((long) (pageParam.getPageNum() - 1) * pageParam.getPageSize(), total);
            List<ApprovalActionRecord> actions = approvalActionService.pageByActor(actorId,
                    (int) offset, (int) pageParam.getPageSize());
            for (ApprovalActionRecord record : actions) {
                taskIdsFromActions.add(record.getTaskId());
                items.add(toItem(record, null));
            }
            PageResult<MyProcessedItemDTO> page = new PageResult<>();
            page.setRecords(items);
            page.setTotal(total);
            page.setPageNum(pageParam.getPageNum());
            page.setPageSize(pageParam.getPageSize());
            return R.ok(page);
        }

        if (includeCompat) {
            // 兼容来源：引擎 finished 历史（assignee=本人）中无动作记录的部分。
            // 引擎查询口径：taskAssignee + finished；被取消/删除的任务不在 finished 历史。
            long offset = (long) (pageParam.getPageNum() - 1) * pageParam.getPageSize();
            List<BpmTaskDTO> finished = bpmTaskFacade.queryProcessedPage(
                    String.valueOf(loginUser.getTenantId()), String.valueOf(actorId),
                    (int) offset, (int) pageParam.getPageSize());
            long total = bpmTaskFacade.countProcessed(
                    String.valueOf(loginUser.getTenantId()), String.valueOf(actorId));
            for (BpmTaskDTO task : finished) {
                if (taskIdsFromActions.contains(task.getTaskId())) {
                    continue;
                }
                MyProcessedItemDTO item = new MyProcessedItemDTO();
                item.setSource(MyProcessedItemDTO.SOURCE_HISTORY_COMPAT);
                fillFromTask(item, task);
                items.add(item);
            }
            PageResult<MyProcessedItemDTO> page = new PageResult<>();
            page.setRecords(items);
            page.setTotal(total);
            page.setPageNum(pageParam.getPageNum());
            page.setPageSize(pageParam.getPageSize());
            return R.ok(page);
        }

        PageResult<MyProcessedItemDTO> empty = new PageResult<>();
        empty.setRecords(items);
        empty.setTotal(0);
        return R.ok(empty);
    }

    private MyProcessedItemDTO toItem(ApprovalActionRecord record, BpmTaskDTO ignored) {
        MyProcessedItemDTO item = new MyProcessedItemDTO();
        item.setSource(MyProcessedItemDTO.SOURCE_ACTION);
        item.setTaskId(record.getTaskId());
        item.setAction(record.getAction());
        item.setHandleTime(record.getCreateTime());
        item.setProcessInstanceId(record.getProcessInstanceId());
        BpmInstance instance = bpmInstanceService
                .findByProcessInstanceId(record.getProcessInstanceId()).orElse(null);
        if (instance != null) {
            item.setInstanceStatus(instance.getStatus());
            item.setFormKey(instance.getFormKey());
            item.setBusinessKey(instance.getBusinessKey());
            if (instance.getProcessDefKey() != null) {
                BpmProcessDef processDef = bpmProcessDefService.findByProcessKey(instance.getProcessDefKey());
                item.setProcessName(processDef == null ? null : processDef.getName());
            }
        }
        return item;
    }

    private void fillFromTask(MyProcessedItemDTO item, BpmTaskDTO task) {
        item.setTaskId(task.getTaskId());
        item.setTaskName(task.getName());
        item.setProcessInstanceId(task.getProcessInstanceId());
        if (task.getEndTime() != null) {
            item.setHandleTime(LocalDateTime.ofInstant(
                    task.getEndTime().toInstant(), ZoneId.systemDefault()));
        }
        BpmInstance instance = bpmInstanceService
                .findByProcessInstanceId(task.getProcessInstanceId()).orElse(null);
        if (instance != null) {
            item.setInstanceStatus(instance.getStatus());
            item.setFormKey(instance.getFormKey());
            item.setBusinessKey(instance.getBusinessKey());
            if (instance.getProcessDefKey() != null) {
                BpmProcessDef processDef = bpmProcessDefService.findByProcessKey(instance.getProcessDefKey());
                item.setProcessName(processDef == null ? null : processDef.getName());
            }
        }
    }
}
