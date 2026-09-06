package com.sw.ck.bpm.engine.facade;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sw.ck.bpm.api.dto.BpmTaskDTO;
import com.sw.ck.bpm.api.facade.BpmTaskFacade;
import com.sw.ck.bpm.api.exception.BpmErrorCode;
import com.sw.ck.common.exception.BaseException;
import org.flowable.engine.HistoryService;
import org.flowable.engine.RepositoryService;
import org.flowable.engine.RuntimeService;
import org.flowable.engine.TaskService;
import org.flowable.bpmn.model.BpmnModel;
import org.flowable.bpmn.model.FlowElement;
import org.flowable.bpmn.model.UserTask;
import org.flowable.task.api.history.HistoricTaskInstance;
import org.flowable.engine.repository.ProcessDefinition;
import org.flowable.engine.runtime.ProcessInstance;
import org.flowable.task.api.Task;
import org.flowable.common.engine.api.FlowableOptimisticLockingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.Collection;
import java.util.stream.Collectors;
import java.util.concurrent.ConcurrentHashMap;

/**
 * BPM 任务门面实现 —— 封装 Flowable {@link TaskService} + {@link RuntimeService} + {@link RepositoryService} 查询。
 */
@Service
public class BpmTaskFacadeImpl implements BpmTaskFacade {

    private static final Logger log = LoggerFactory.getLogger(BpmTaskFacadeImpl.class);

    private final TaskService taskService;
    private final RuntimeService runtimeService;
    private final RepositoryService repositoryService;
    private final HistoryService historyService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private static final String FLOWABLE_NS = "http://flowable.org/bpmn";
    private static final ConcurrentHashMap<String, Object> ACTION_LOCKS = new ConcurrentHashMap<>();

    public BpmTaskFacadeImpl(TaskService taskService, RuntimeService runtimeService,
                             RepositoryService repositoryService, HistoryService historyService) {
        this.taskService = taskService;
        this.runtimeService = runtimeService;
        this.repositoryService = repositoryService;
        this.historyService = historyService;
    }

    @Override
    public List<BpmTaskDTO> queryTodo(String tenantId, String assignee) {
        List<Task> tasks = taskService.createTaskQuery()
                .taskTenantId(tenantId)
                .taskCandidateOrAssigned(assignee)
                .list();

        return tasks.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public List<BpmTaskDTO> queryByProcessInstance(String processInstanceId) {
        List<Task> tasks = taskService.createTaskQuery()
                .processInstanceId(processInstanceId)
                .list();
        return tasks.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public BpmTaskDTO getTask(String taskId) {
        Task task = taskService.createTaskQuery().taskId(taskId).singleResult();
        if (task == null) {
            return null;
        }
        return toDto(task);
    }

    @Override
    public void complete(String taskId, Map<String, Object> variables) {
        Task snapshot = taskService.createTaskQuery().taskId(taskId).singleResult();
        String lockKey = snapshot == null ? "task:" + taskId
                : "process:" + snapshot.getProcessInstanceId();
        synchronized (ACTION_LOCKS.computeIfAbsent(lockKey, key -> new Object())) {
            if (taskService.createTaskQuery().taskId(taskId).singleResult() == null) {
                throw new BaseException(BpmErrorCode.APPROVAL_ALREADY_HANDLED.getCode(),
                        "任务不存在或已被处理");
            }
            completeWithOptimisticRetry(taskId, variables);
        }
        log.info("BPM task completed: taskId={}", taskId);
    }

    @Override
    public boolean canHandle(String taskId, String userId) {
        return taskId != null && userId != null
                && taskService.createTaskQuery().taskId(taskId)
                .taskCandidateOrAssigned(userId).singleResult() != null;
    }

    @Override
    public void completeAsUser(String taskId, String userId, Map<String, Object> variables) {
        Task snapshot = taskService.createTaskQuery().taskId(taskId).singleResult();
        String lockKey = snapshot == null ? "task:" + taskId
                : "process:" + snapshot.getProcessInstanceId();
        synchronized (ACTION_LOCKS.computeIfAbsent(lockKey, key -> new Object())) {
            Task task = taskService.createTaskQuery().taskId(taskId)
                    .taskCandidateOrAssigned(userId).singleResult();
            if (task == null) {
                throw new BaseException(BpmErrorCode.APPROVAL_ALREADY_HANDLED.getCode(),
                        "任务不存在、已被处理或当前用户无权处理");
            }
            if (task.getAssignee() == null) taskService.claim(taskId, userId);
            completeWithOptimisticRetry(taskId, variables);
        }
    }

    /**
     * 并发会签任务可能同时更新同一 Flowable execution。第一次提交发生乐观锁竞争时，
     * 重新读取任务并只重试一次；若竞争者已经处理该任务，则转换为可预期的 2305，
     * 不把正常的幂等竞争暴露成 HTTP 500。
     */
    private void completeWithOptimisticRetry(String taskId, Map<String, Object> variables) {
        try {
            completeWithoutRetry(taskId, variables);
            return;
        } catch (FlowableOptimisticLockingException first) {
            if (taskService.createTaskQuery().taskId(taskId).singleResult() == null) {
                throw alreadyHandled(taskId);
            }
            log.info("BPM task optimistic lock conflict, retrying once: taskId={}", taskId);
        }

        try {
            completeWithoutRetry(taskId, variables);
        } catch (FlowableOptimisticLockingException second) {
            if (taskService.createTaskQuery().taskId(taskId).singleResult() == null) {
                throw alreadyHandled(taskId);
            }
            throw second;
        }
    }

    private void completeWithoutRetry(String taskId, Map<String, Object> variables) {
        if (variables != null && !variables.isEmpty()) {
            taskService.complete(taskId, variables);
        } else {
            taskService.complete(taskId);
        }
    }

    private BaseException alreadyHandled(String taskId) {
        return new BaseException(BpmErrorCode.APPROVAL_ALREADY_HANDLED.getCode(),
                "任务不存在或已被处理: " + taskId);
    }

    @Override
    public void terminateProcess(String processInstanceId, String reason) {
        if (processInstanceId == null || processInstanceId.isBlank()) {
            throw new BaseException(com.sw.ck.common.exception.CommonErrorCode.PARAM_ERROR,
                    "流程实例标识不能为空");
        }
        synchronized (ACTION_LOCKS.computeIfAbsent("process:" + processInstanceId, key -> new Object())) {
            if (runtimeService.createProcessInstanceQuery().processInstanceId(processInstanceId).singleResult() != null) {
                runtimeService.deleteProcessInstance(processInstanceId,
                        reason == null || reason.isBlank() ? "REJECTED" : reason);
            }
        }
        log.info("BPM process terminated: processInstanceId={}, reason={}", processInstanceId, reason);
    }

    @Override
    public void returnTask(String taskId, String targetNodeId) {
        Task snapshot = taskService.createTaskQuery().taskId(taskId).singleResult();
        String lockKey = snapshot == null ? "task:" + taskId
                : "process:" + snapshot.getProcessInstanceId();
        synchronized (ACTION_LOCKS.computeIfAbsent(lockKey, key -> new Object())) {
            Task task = taskService.createTaskQuery().taskId(taskId).singleResult();
            if (task == null || targetNodeId == null || targetNodeId.isBlank()) {
                throw new BaseException(BpmErrorCode.APPROVAL_RETURN_TARGET_INVALID);
            }
            BpmnModel model = repositoryService.getBpmnModel(task.getProcessDefinitionId());
            FlowElement target = model == null ? null : model.getFlowElement(targetNodeId);
            if (!(target instanceof UserTask)
                    || historyService.createHistoricTaskInstanceQuery()
                    .processInstanceId(task.getProcessInstanceId())
                    .taskDefinitionKey(targetNodeId)
                    .finished().count() == 0
                    || !isAllowedReturnTarget(task, targetNodeId)) {
                throw new BaseException(BpmErrorCode.APPROVAL_RETURN_TARGET_INVALID);
            }
            runtimeService.createChangeActivityStateBuilder()
                    .processInstanceId(task.getProcessInstanceId())
                    .moveActivityIdTo(task.getTaskDefinitionKey(), targetNodeId)
                    .changeState();
        }
    }

    /**
     * 当发布配置声明 returnTargets 时严格按声明限制；旧图未声明时以“已经过的人工节点”为兼容边界。
     */
    private boolean isAllowedReturnTarget(Task task, String targetNodeId) {
        try {
            BpmnModel model = repositoryService.getBpmnModel(task.getProcessDefinitionId());
            FlowElement current = model == null ? null : model.getFlowElement(task.getTaskDefinitionKey());
            String json = current == null ? null : current.getAttributeValue(FLOWABLE_NS, "nodeConfig");
            if (json == null || json.isBlank()) return true;
            Map<String, Object> config = objectMapper.readValue(json,
                    new TypeReference<Map<String, Object>>() { });
            Object targets = config.get("returnTargets");
            if (!(targets instanceof Collection<?> collection)) return true;
            if (collection.isEmpty()) return false;
            return collection.stream().map(String::valueOf).anyMatch(targetNodeId::equals);
        } catch (Exception e) {
            throw new BaseException(BpmErrorCode.APPROVAL_RETURN_TARGET_INVALID);
        }
    }

    @Override
    public List<BpmTaskDTO> queryTodoPage(String tenantId, String assignee, int offset, int limit) {
        List<Task> tasks = taskService.createTaskQuery()
                .taskTenantId(tenantId)
                .taskCandidateOrAssigned(assignee)
                .orderByTaskCreateTime().desc()
                .listPage(offset, limit);

        return tasks.stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    @Override
    public long countTodo(String tenantId, String assignee) {
        return taskService.createTaskQuery()
                .taskTenantId(tenantId)
                .taskCandidateOrAssigned(assignee)
                .count();
    }

    @Override
    public Map<String, Object> getVariables(String processInstanceId) {
        return runtimeService.getVariables(processInstanceId);
    }

    @Override
    public List<BpmTaskDTO> queryProcessedPage(String tenantId, String assignee, int offset, int limit) {
        // taskWithoutDeleteReason：finished 历史同时包含正常完成与被取消/删除的任务
        //（后者 endTime 亦有值但 deleteReason 非空）。已办兼容来源只承认本人实际
        // 完成的任务，取消/删除记录不得混为已办（D4）。
        List<HistoricTaskInstance> tasks = historyService.createHistoricTaskInstanceQuery()
                .taskTenantId(tenantId)
                .taskAssignee(assignee)
                .finished()
                .taskWithoutDeleteReason()
                .orderByHistoricTaskInstanceEndTime().desc()
                .listPage(offset, limit);

        return tasks.stream()
                .map(this::toDtoFromHistory)
                .collect(Collectors.toList());
    }

    @Override
    public long countProcessed(String tenantId, String assignee) {
        return historyService.createHistoricTaskInstanceQuery()
                .taskTenantId(tenantId)
                .taskAssignee(assignee)
                .finished()
                .taskWithoutDeleteReason()
                .count();
    }

    @Override
    public List<BpmTaskDTO> queryHistoryByProcessInstance(String processInstanceId) {
        List<HistoricTaskInstance> tasks = historyService.createHistoricTaskInstanceQuery()
                .processInstanceId(processInstanceId)
                .finished()
                .orderByHistoricTaskInstanceEndTime().desc()
                .list();

        // 兜底：本引擎版本在 create 监听器内 setAssignee 不落 HI_TASKINST.ASSIGNEE_，
        // 用历史流程变量 approver（DESIGNATED 指定审批人，v1 单审批人语义下与实际 assignee
        // 一致）补齐，否则审批历史审批人显示 "-"（R-04 缺口）。
        String approverFallback = resolveApproverVariable(processInstanceId);

        return tasks.stream()
                .map(this::toDtoFromHistory)
                .peek(dto -> {
                    if ((dto.getAssignee() == null || dto.getAssignee().isBlank())
                            && approverFallback != null) {
                        dto.setAssignee(approverFallback);
                    }
                })
                .collect(Collectors.toList());
    }

    /**
     * 读取历史流程变量 approver（DESIGNATED 审批人配置，String 或 List 取首元素）。
     * 查询失败返回 null，不阻断审批历史查询。
     */
    private String resolveApproverVariable(String processInstanceId) {
        try {
            org.flowable.variable.api.history.HistoricVariableInstance var = historyService
                    .createHistoricVariableInstanceQuery()
                    .processInstanceId(processInstanceId)
                    .variableName("approver")
                    .singleResult();
            if (var == null || var.getValue() == null) {
                return null;
            }
            Object v = var.getValue();
            if (v instanceof java.util.Collection<?> col) {
                return col.isEmpty() ? null : String.valueOf(col.iterator().next());
            }
            return String.valueOf(v);
        } catch (Exception e) {
            return null;
        }
    }

    @Override
    public boolean isProcessActive(String processInstanceId) {
        long count = runtimeService.createProcessInstanceQuery()
                .processInstanceId(processInstanceId)
                .count();
        return count > 0;
    }

    @Override
    public String getVariable(String processInstanceId, String name) {
        try {
            Object val = runtimeService.getVariable(processInstanceId, name);
            if (val != null) {
                return val.toString();
            }
        } catch (org.flowable.common.engine.api.FlowableObjectNotFoundException e) {
            // 流程已结束：运行时实例被清空，回落历史变量（已办任务列表需要读取结束实例的 formKey）
        }
        org.flowable.variable.api.history.HistoricVariableInstance hv = historyService
                .createHistoricVariableInstanceQuery()
                .processInstanceId(processInstanceId)
                .variableName(name)
                .singleResult();
        return hv != null && hv.getValue() != null ? hv.getValue().toString() : null;
    }

    @Override
    public String getBusinessKey(String processInstanceId) {
        ProcessInstance pi = runtimeService.createProcessInstanceQuery()
                .processInstanceId(processInstanceId)
                .singleResult();
        if (pi != null) {
            return pi.getBusinessKey();
        }
        // 流程已结束（无活动实例）：运行时实例被清空，回落历史实例的 businessKey
        // （已办任务列表需要展示结束实例的业务单号）
        org.flowable.engine.history.HistoricProcessInstance hpi = historyService
                .createHistoricProcessInstanceQuery()
                .processInstanceId(processInstanceId)
                .singleResult();
        return hpi != null ? hpi.getBusinessKey() : null;
    }

    // ==================== 内部方法 ====================

    private BpmTaskDTO toDto(Task task) {
        BpmTaskDTO dto = new BpmTaskDTO();
        dto.setTaskId(task.getId());
        dto.setName(task.getName());
        dto.setTaskDefinitionKey(task.getTaskDefinitionKey());
        dto.setProcessInstanceId(task.getProcessInstanceId());
        dto.setProcessDefinitionKey(getProcessDefinitionKey(task));
        dto.setAssignee(task.getAssignee());
        dto.setCandidateUserIds(taskService.getIdentityLinksForTask(task.getId()).stream()
                .filter(link -> "candidate".equalsIgnoreCase(link.getType())
                        && link.getUserId() != null && !link.getUserId().isBlank())
                .map(org.flowable.identitylink.api.IdentityLink::getUserId)
                .distinct()
                .toList());
        dto.setCreateTime(task.getCreateTime());

        // businessKey 从 ProcessInstance 获取
        ProcessInstance pi = runtimeService.createProcessInstanceQuery()
                .processInstanceId(task.getProcessInstanceId())
                .singleResult();
        if (pi != null) {
            dto.setBusinessKey(pi.getBusinessKey());
        }

        return dto;
    }

    /**
     * 从 Task 的 processDefinitionId 解析 process definition key。
     * <p>
     * Flowable Task 接口未直接暴露 processDefinitionKey，
     * 需通过 RepositoryService 查询 ProcessDefinition 获取。
     * </p>
     */
    private String getProcessDefinitionKey(Task task) {
        return getProcessDefinitionKeyFromId(task.getProcessDefinitionId());
    }

    /**
     * 从 processDefinitionId 解析 process definition key。
     * <p>
     * 提取为公共方法，供 {@link #toDto(Task)} 和 {@link #toDtoFromHistory(HistoricTaskInstance)} 共用。
     * </p>
     */
    private String getProcessDefinitionKeyFromId(String processDefinitionId) {
        if (processDefinitionId == null) {
            return null;
        }
        ProcessDefinition pd = repositoryService.createProcessDefinitionQuery()
                .processDefinitionId(processDefinitionId)
                .singleResult();
        return pd != null ? pd.getKey() : null;
    }

    /**
     * 将 Flowable HistoricTaskInstance 转为 BpmTaskDTO。
     * <p>
     * 与 {@link #toDto(Task)} 的区别：增加 endTime 字段。
     * </p>
     */
    private BpmTaskDTO toDtoFromHistory(HistoricTaskInstance task) {
        BpmTaskDTO dto = new BpmTaskDTO();
        dto.setTaskId(task.getId());
        dto.setName(task.getName());
        dto.setTaskDefinitionKey(task.getTaskDefinitionKey());
        dto.setProcessInstanceId(task.getProcessInstanceId());
        dto.setProcessDefinitionKey(getProcessDefinitionKeyFromId(task.getProcessDefinitionId()));
        dto.setAssignee(task.getAssignee());
        dto.setCreateTime(task.getCreateTime());
        dto.setEndTime(task.getEndTime());
        return dto;
    }
}
