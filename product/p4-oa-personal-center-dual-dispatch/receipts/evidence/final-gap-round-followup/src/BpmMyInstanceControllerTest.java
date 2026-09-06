package com.sw.ck.bpm.process.controller;

import com.sw.ck.bpm.api.dto.BpmTaskDTO;
import com.sw.ck.bpm.api.facade.BpmTaskFacade;
import com.sw.ck.bpm.process.dto.ApprovalHistoryItemDTO;
import com.sw.ck.bpm.process.entity.BpmInstance;
import com.sw.ck.bpm.process.entity.BpmProcessDef;
import com.sw.ck.bpm.process.service.BpmInstanceService;
import com.sw.ck.bpm.process.service.BpmProcessDefService;
import com.sw.ck.bpm.process.service.TaskActionService;
import com.sw.ck.common.exception.BaseException;
import com.sw.ck.common.response.R;
import com.sw.ck.security.holder.LoginUser;
import com.sw.ck.security.holder.LoginUserHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Date;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * {@link BpmMyInstanceController} 单元测试（myInstanceDetail）。
 * <p>
 * 覆盖：实例不存在 404、initiator 非本人 FORBIDDEN、本人访问返回进度与流转记录。
 * </p>
 */
@DisplayName("我发起的控制器测试")
class BpmMyInstanceControllerTest {

    private final BpmInstanceService bpmInstanceService = mock(BpmInstanceService.class);
    private final BpmProcessDefService bpmProcessDefService = mock(BpmProcessDefService.class);
    private final BpmTaskFacade bpmTaskFacade = mock(BpmTaskFacade.class);
    private final TaskActionService taskActionService = mock(TaskActionService.class);
    private final com.sw.ck.bpm.process.service.ApprovalActionService approvalActionService =
            mock(com.sw.ck.bpm.process.service.ApprovalActionService.class);

    private final BpmMyInstanceController controller = new BpmMyInstanceController(
            bpmInstanceService, bpmProcessDefService, bpmTaskFacade, taskActionService);

    @BeforeEach
    void setUp() {
        LoginUser loginUser = new LoginUser();
        loginUser.setUserId(2L);
        loginUser.setTenantId(1L);
        LoginUserHolder.set(loginUser);
        when(taskActionService.resolveUserNames(any())).thenReturn(Map.of(3L, "张三"));
    }

    @AfterEach
    void tearDown() {
        LoginUserHolder.clear();
    }

    private BpmInstance instance(Long initiatorId) {
        BpmInstance instance = new BpmInstance();
        instance.setId(1L);
        instance.setInitiatorId(initiatorId);
        instance.setProcessInstanceId("pi-001");
        instance.setProcessDefKey("leave_flow");
        instance.setFormKey("leave_form");
        instance.setBusinessKey("rec-001");
        instance.setStatus("RUNNING");
        return instance;
    }

    private BpmTaskDTO task(String taskId, boolean finished) {
        BpmTaskDTO task = new BpmTaskDTO();
        task.setTaskId(taskId);
        task.setName("审批");
        task.setTaskDefinitionKey("node_approve");
        task.setAssignee("3");
        task.setProcessInstanceId("pi-001");
        task.setCreateTime(new Date());
        if (finished) {
            task.setEndTime(new Date());
        }
        return task;
    }

    @Test
    @DisplayName("实例不存在 → NOT_FOUND")
    void myInstanceDetail_shouldReturn404WhenMissing() {
        when(bpmInstanceService.getById(1L)).thenReturn(null);

        assertThatThrownBy(() -> controller.myInstanceDetail(1L))
                .isInstanceOf(BaseException.class)
                .hasMessageContaining("不存在");
    }

    @Test
    @DisplayName("initiator 非本人 → FORBIDDEN")
    void myInstanceDetail_shouldRejectNonInitiator() {
        when(bpmInstanceService.getById(1L)).thenReturn(instance(999L));

        assertThatThrownBy(() -> controller.myInstanceDetail(1L))
                .isInstanceOf(BaseException.class)
                .hasMessageContaining("无权查看");
    }

    @Test
    @DisplayName("本人访问 → 返回 instance/progress/history（含 assigneeName 富化）")
    void myInstanceDetail_shouldReturnProgressAndHistoryForOwner() {
        when(bpmInstanceService.getById(1L)).thenReturn(instance(2L));
        BpmProcessDef def = new BpmProcessDef();
        def.setName("请假流程");
        def.setProcessKey("leave_flow");
        when(bpmProcessDefService.findByProcessKey("leave_flow")).thenReturn(def);
        when(bpmTaskFacade.queryByProcessInstance("pi-001")).thenReturn(List.of(task("t1", false)));
        when(bpmTaskFacade.queryHistoryByProcessInstance("pi-001")).thenReturn(List.of(task("t2", true)));

        R<Map<String, Object>> resp = controller.myInstanceDetail(1L);

        Map<String, Object> result = resp.getData();
        assertThat(result.get("processName")).isEqualTo("请假流程");
        assertThat(result.get("formKey")).isEqualTo("leave_form");
        assertThat(result.get("businessKey")).isEqualTo("rec-001");
        assertThat(result.get("status")).isEqualTo("RUNNING");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> progress = (List<Map<String, Object>>) result.get("progress");
        assertThat(progress).hasSize(1);
        assertThat(progress.get(0)).containsEntry("taskId", "t1")
                .containsEntry("taskName", "审批")
                .containsEntry("nodeKey", "node_approve")
                .containsEntry("assignee", "3");

        @SuppressWarnings("unchecked")
        List<ApprovalHistoryItemDTO> history = (List<ApprovalHistoryItemDTO>) result.get("history");
        assertThat(history).hasSize(1);
        assertThat(history.get(0).getTaskId()).isEqualTo("t2");
        assertThat(history.get(0).getAssigneeName()).isEqualTo("张三");
        assertThat(history.get(0).getEndTime()).isNotNull();
    }

    @Test
    @DisplayName("A1/C1 详情合并动作记录：已办理节点回显真实动作/结果/意见，未办理节点不伪造动作")
    void myInstanceDetail_shouldMergeActionRecordsIntoHistory() {
        BpmMyInstanceController enriched = new BpmMyInstanceController(
                bpmInstanceService, bpmProcessDefService, bpmTaskFacade, taskActionService,
                approvalActionService, new com.fasterxml.jackson.databind.ObjectMapper());

        when(bpmInstanceService.getById(1L)).thenReturn(instance(2L));
        when(bpmProcessDefService.findByProcessKey("leave_flow")).thenReturn(null);
        when(bpmTaskFacade.queryByProcessInstance("pi-001")).thenReturn(List.of());
        // 终审节点（已完成）+ 一个无动作记录节点（如取消成员）
        when(bpmTaskFacade.queryHistoryByProcessInstance("pi-001"))
                .thenReturn(List.of(task("t-done", true), task("t-cancelled", true)));

        com.sw.ck.bpm.process.entity.ApprovalActionRecord handled =
                new com.sw.ck.bpm.process.entity.ApprovalActionRecord();
        handled.setTaskId("t-done");
        handled.setAction("APPROVE");
        handled.setSettlementStatus("APPROVED");
        handled.setOpinionData("{\"comment\":\"同意\"}");
        when(approvalActionService.findByProcessInstanceId("pi-001"))
                .thenReturn(List.of(handled));

        R<Map<String, Object>> resp = enriched.myInstanceDetail(1L);

        @SuppressWarnings("unchecked")
        List<ApprovalHistoryItemDTO> history = (List<ApprovalHistoryItemDTO>) resp.getData().get("history");
        assertThat(history).hasSize(2);
        ApprovalHistoryItemDTO done = history.stream().filter(h -> "t-done".equals(h.getTaskId()))
                .findFirst().orElseThrow();
        assertThat(done.getAction()).isEqualTo("APPROVE");
        assertThat(done.getApprovalResult()).isEqualTo("APPROVED");
        assertThat(done.getOpinionData()).containsEntry("comment", "同意");

        // 反向：无动作记录的节点不伪造动作/结果
        ApprovalHistoryItemDTO cancelled = history.stream()
                .filter(h -> "t-cancelled".equals(h.getTaskId())).findFirst().orElseThrow();
        assertThat(cancelled.getAction()).isNull();
        assertThat(cancelled.getApprovalResult()).isNull();
        assertThat(cancelled.getOpinionData()).isNull();
    }
}
