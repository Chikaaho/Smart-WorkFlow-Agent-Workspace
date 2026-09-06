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
import com.sw.ck.common.response.R;
import com.sw.ck.security.holder.LoginUser;
import com.sw.ck.security.holder.LoginUserHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link BpmMyProcessedController} 单元测试。
 * <p>
 * 覆盖：source=ACTION 本人动作记录分页与实例富化；source=HISTORY_COMPAT
 * 引擎 finished 历史兼容来源。
 * </p>
 */
@DisplayName("我的已办控制器测试")
class BpmMyProcessedControllerTest {

    private final ApprovalActionService approvalActionService = mock(ApprovalActionService.class);
    private final BpmInstanceService bpmInstanceService = mock(BpmInstanceService.class);
    private final BpmProcessDefService bpmProcessDefService = mock(BpmProcessDefService.class);
    private final BpmTaskFacade bpmTaskFacade = mock(BpmTaskFacade.class);

    private final BpmMyProcessedController controller = new BpmMyProcessedController(
            approvalActionService, bpmInstanceService, bpmProcessDefService, bpmTaskFacade);

    @BeforeEach
    void setUp() {
        LoginUser loginUser = new LoginUser();
        loginUser.setUserId(2L);
        loginUser.setTenantId(1L);
        LoginUserHolder.set(loginUser);
    }

    @AfterEach
    void tearDown() {
        LoginUserHolder.clear();
    }

    private BpmInstance instance() {
        BpmInstance instance = new BpmInstance();
        instance.setProcessInstanceId("pi-001");
        instance.setProcessDefKey("leave_flow");
        instance.setFormKey("leave_form");
        instance.setBusinessKey("rec-001");
        instance.setStatus("APPROVED");
        return instance;
    }

    @Test
    @DisplayName("source=ACTION：分页返回本人动作记录映射（action/handleTime/instanceStatus 富化）")
    void myProcessed_actionSource_shouldMapActionRecords() {
        ApprovalActionRecord record = new ApprovalActionRecord();
        record.setTaskId("t1");
        record.setAction("APPROVE");
        record.setProcessInstanceId("pi-001");
        record.setCreateTime(LocalDateTime.of(2026, 9, 1, 10, 0));
        when(approvalActionService.countByActor(2L)).thenReturn(1L);
        when(approvalActionService.pageByActor(2L, 0, 10)).thenReturn(List.of(record));
        when(bpmInstanceService.findByProcessInstanceId("pi-001")).thenReturn(Optional.of(instance()));
        BpmProcessDef def = new BpmProcessDef();
        def.setName("请假流程");
        when(bpmProcessDefService.findByProcessKey("leave_flow")).thenReturn(def);

        R<com.sw.ck.common.page.PageResult<MyProcessedItemDTO>> resp =
                controller.myProcessed(new PageParam(), MyProcessedItemDTO.SOURCE_ACTION);

        var page = resp.getData();
        assertThat(page.getTotal()).isEqualTo(1L);
        assertThat(page.getRecords()).hasSize(1);
        MyProcessedItemDTO item = page.getRecords().get(0);
        assertThat(item.getSource()).isEqualTo(MyProcessedItemDTO.SOURCE_ACTION);
        assertThat(item.getTaskId()).isEqualTo("t1");
        assertThat(item.getAction()).isEqualTo("APPROVE");
        assertThat(item.getHandleTime()).isEqualTo(LocalDateTime.of(2026, 9, 1, 10, 0));
        assertThat(item.getProcessInstanceId()).isEqualTo("pi-001");
        assertThat(item.getInstanceStatus()).isEqualTo("APPROVED");
        assertThat(item.getFormKey()).isEqualTo("leave_form");
        assertThat(item.getBusinessKey()).isEqualTo("rec-001");
        assertThat(item.getProcessName()).isEqualTo("请假流程");
    }

    @Test
    @DisplayName("source=HISTORY_COMPAT：调 queryProcessedPage/countProcessed 映射并标记来源")
    void myProcessed_historyCompatSource_shouldMapFinishedTasks() {
        BpmTaskDTO task = new BpmTaskDTO();
        task.setTaskId("t2");
        task.setName("审批");
        task.setProcessInstanceId("pi-001");
        task.setEndTime(new Date());
        when(bpmTaskFacade.queryProcessedPage("1", "2", 0, 10)).thenReturn(List.of(task));
        when(bpmTaskFacade.countProcessed("1", "2")).thenReturn(1L);
        when(bpmInstanceService.findByProcessInstanceId("pi-001")).thenReturn(Optional.of(instance()));

        R<com.sw.ck.common.page.PageResult<MyProcessedItemDTO>> resp =
                controller.myProcessed(new PageParam(), MyProcessedItemDTO.SOURCE_HISTORY_COMPAT);

        var page = resp.getData();
        assertThat(page.getTotal()).isEqualTo(1L);
        assertThat(page.getRecords()).hasSize(1);
        MyProcessedItemDTO item = page.getRecords().get(0);
        assertThat(item.getSource()).isEqualTo(MyProcessedItemDTO.SOURCE_HISTORY_COMPAT);
        assertThat(item.getTaskId()).isEqualTo("t2");
        assertThat(item.getTaskName()).isEqualTo("审批");
        assertThat(item.getHandleTime()).isNotNull();
        assertThat(item.getInstanceStatus()).isEqualTo("APPROVED");
        verify(bpmTaskFacade).queryProcessedPage("1", "2", 0, 10);
        verify(bpmTaskFacade).countProcessed("1", "2");
    }

    @Test
    @DisplayName("G3b 默认来源合并：旧历史（无 ACTION）兼容展示，已有 ACTION 的任务去重不重复")
    void myProcessed_defaultSource_dedupActionOverHistoryCompat() {
        // 旧数据夹具：t-legacy 仅存在于引擎 finished 历史（无 ACTION 记录）；
        // t-both 既有 ACTION 又出现在引擎历史（应为去重，不双列）；
        // 被取消/未本人办理的任务不进入 finished 历史（facade 契约），故不在返回中。
        ApprovalActionRecord action = new ApprovalActionRecord();
        action.setTaskId("t-both");
        action.setAction("APPROVE");
        action.setProcessInstanceId("pi-001");
        action.setCreateTime(LocalDateTime.of(2026, 9, 1, 10, 0));
        when(approvalActionService.countByActor(2L)).thenReturn(1L);
        when(approvalActionService.pageByActor(2L, 0, 10)).thenReturn(List.of(action));

        BpmTaskDTO legacy = new BpmTaskDTO();
        legacy.setTaskId("t-legacy");
        legacy.setName("旧历史审批");
        legacy.setProcessInstanceId("pi-001");
        legacy.setEndTime(new Date());
        BpmTaskDTO duplicated = new BpmTaskDTO();
        duplicated.setTaskId("t-both");
        duplicated.setName("重复历史");
        duplicated.setProcessInstanceId("pi-001");
        duplicated.setEndTime(new Date());
        when(bpmTaskFacade.queryProcessedPage("1", "2", 0, 10))
                .thenReturn(List.of(legacy, duplicated));
        when(bpmTaskFacade.countProcessed("1", "2")).thenReturn(2L);
        when(bpmInstanceService.findByProcessInstanceId("pi-001")).thenReturn(Optional.of(instance()));

        R<com.sw.ck.common.page.PageResult<MyProcessedItemDTO>> resp =
                controller.myProcessed(new PageParam(), null);

        var page = resp.getData();
        // 精确 total = 去重后条数（非两源计数上界）
        assertThat(page.getTotal()).isEqualTo(2L);
        assertThat(page.getRecords()).hasSize(2);
        // 全局按办理时间倒序：兼容项（引擎 endTime=now）新于 ACTION 记录时间 → 兼容项在前
        assertThat(page.getRecords().get(0).getSource()).isEqualTo(MyProcessedItemDTO.SOURCE_HISTORY_COMPAT);
        assertThat(page.getRecords().get(0).getTaskId()).isEqualTo("t-legacy");
        assertThat(page.getRecords().get(1).getSource()).isEqualTo(MyProcessedItemDTO.SOURCE_ACTION);
        assertThat(page.getRecords().get(1).getTaskId()).isEqualTo("t-both");
        // 引擎历史中被取消/非本人办理的任务不在 queryProcessedPage 契约内：无该类条目
        assertThat(page.getRecords()).noneMatch(item -> item.getTaskId().equals("t-cancelled"));
    }

    @Test
    @DisplayName("G3b 跨页不漏不重：pageSize=1 两页合计等于 total 且无重复 taskId")
    void myProcessed_defaultSource_crossPageNoLeakNoDup() {
        ApprovalActionRecord action = new ApprovalActionRecord();
        action.setTaskId("t-both");
        action.setAction("APPROVE");
        action.setProcessInstanceId("pi-001");
        action.setCreateTime(LocalDateTime.of(2026, 9, 1, 10, 0));
        when(approvalActionService.countByActor(2L)).thenReturn(1L);
        when(approvalActionService.pageByActor(2L, 0, 1)).thenReturn(List.of(action));

        BpmTaskDTO legacy = new BpmTaskDTO();
        legacy.setTaskId("t-legacy");
        legacy.setProcessInstanceId("pi-001");
        legacy.setEndTime(new Date());
        BpmTaskDTO duplicated = new BpmTaskDTO();
        duplicated.setTaskId("t-both");
        duplicated.setProcessInstanceId("pi-001");
        duplicated.setEndTime(new Date());
        when(bpmTaskFacade.queryProcessedPage("1", "2", 0, 1)).thenReturn(List.of(legacy, duplicated));
        when(bpmTaskFacade.countProcessed("1", "2")).thenReturn(2L);
        when(bpmInstanceService.findByProcessInstanceId("pi-001")).thenReturn(Optional.of(instance()));

        java.util.Set<String> seen = new java.util.HashSet<>();
        long collected = 0;
        for (int pageNum = 1; pageNum <= 2; pageNum++) {
            PageParam param = new PageParam();
            param.setPageNum(pageNum);
            param.setPageSize(1);
            var page = controller.myProcessed(param, null).getData();
            assertThat(page.getTotal()).isEqualTo(2L);
            for (MyProcessedItemDTO item : page.getRecords()) {
                assertThat(seen.add(item.getTaskId())).as("跨页重复: " + item.getTaskId()).isTrue();
                collected++;
            }
        }
        assertThat(collected).isEqualTo(2L);
    }
}
