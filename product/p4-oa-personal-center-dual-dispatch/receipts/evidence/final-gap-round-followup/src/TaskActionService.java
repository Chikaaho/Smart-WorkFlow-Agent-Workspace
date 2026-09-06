package com.sw.ck.bpm.process.service;

import com.sw.ck.bpm.api.dto.BpmTaskDTO;
import com.sw.ck.bpm.api.event.BpmDeviceCommandEvent;
import com.sw.ck.bpm.api.event.BpmNotifyEvent;
import com.sw.ck.bpm.api.event.BpmNotifyTrigger;
import com.sw.ck.bpm.api.facade.BpmTaskFacade;
import com.sw.ck.bpm.api.dto.GraphElement;
import com.sw.ck.bpm.api.dto.ProcessGraph;
import com.sw.ck.bpm.api.participant.ParticipantSnapshotRecorder;
import com.sw.ck.bpm.process.dto.ApprovalAction;
import com.sw.ck.bpm.process.dto.ApprovalActionRequest;
import com.sw.ck.bpm.process.entity.ApprovalActionRecord;
import com.sw.ck.bpm.process.entity.BpmInstance;
import com.sw.ck.bpm.process.entity.BpmProcessDef;
import com.sw.ck.bpm.process.entity.InstanceStatusEnum;
import com.sw.ck.bpm.process.validator.ApprovalOpinionValidator;
import com.sw.ck.common.event.DomainEventPublisher;
import com.sw.ck.common.exception.BaseException;
import com.sw.ck.common.exception.CommonErrorCode;
import com.sw.ck.security.holder.LoginUser;
import com.sw.ck.security.holder.LoginUserHolder;
import com.sw.ck.system.api.user.UserQueryFacade;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 审批动作统一业务服务（同意/驳回/退回的唯一执行核心）。
 * <p>
 * 从 {@code BpmTodoController.handleAction} 收编：同步 HTTP 入口、命令消费者
 * （TaskActionCommandHandler）与未来内部调用统一汇入本服务，保证两通道共享
 * 业务校验、越权校验、审计与幂等语义，不存在第二套审批执行路径。
 * </p>
 */
@Service
public class TaskActionService {

    private static final Logger log = LoggerFactory.getLogger(TaskActionService.class);

    private final BpmTaskFacade bpmTaskFacade;
    private final BpmInstanceService bpmInstanceService;
    private final BpmProcessDefService bpmProcessDefService;
    private final DomainEventPublisher domainEventPublisher;
    private final UserQueryFacade userQueryFacade;
    private final ApprovalActionService approvalActionService;
    private final ParticipantSnapshotRecorder participantSnapshotRecorder;
    private final com.fasterxml.jackson.databind.ObjectMapper objectMapper;

    public TaskActionService(BpmTaskFacade bpmTaskFacade,
                             BpmInstanceService bpmInstanceService,
                             BpmProcessDefService bpmProcessDefService,
                             DomainEventPublisher domainEventPublisher,
                             UserQueryFacade userQueryFacade,
                             ApprovalActionService approvalActionService,
                             com.fasterxml.jackson.databind.ObjectMapper objectMapper,
                             ParticipantSnapshotRecorder participantSnapshotRecorder) {
        this.bpmTaskFacade = bpmTaskFacade;
        this.bpmInstanceService = bpmInstanceService;
        this.bpmProcessDefService = bpmProcessDefService;
        this.domainEventPublisher = domainEventPublisher;
        this.userQueryFacade = userQueryFacade;
        this.approvalActionService = approvalActionService;
        this.objectMapper = objectMapper;
        this.participantSnapshotRecorder = participantSnapshotRecorder;
    }

    /**
     * 执行审批动作（原 handleAction 语义，行为保持不变）。
     *
     * @param taskId  Flowable task ID
     * @param request 动作请求（action 已由入口归一化）
     */
    @Transactional
    public com.sw.ck.common.response.R<Void> execute(String taskId, ApprovalActionRequest request) {
        return execute(taskId, request, null);
    }

    /**
     * 执行审批动作（命令通道入口携带 commandId）。
     * <p>
     * 幂等恢复语义（提示05 §4 断言3）：目标任务已消失但存在动作记录时——
     * 记录属于同一受理命令（command_id 匹配）= 同命令确认丢失后的重投，
     * 定位自身已提交结果并恢复一致的可回查命令结果，不产生第二次审批/通知副作用；
     * 记录属于其他命令/意图 = 已被他人处理的确定性冲突，拒绝。
     * </p>
     *
     * @param commandId 受理命令标识；同步 HTTP 入口传 null（无命令语义）
     */
    @Transactional
    public com.sw.ck.common.response.R<Void> execute(String taskId, ApprovalActionRequest request,
                                                     Long commandId) {
        LoginUser loginUser = LoginUserHolder.get();

        // 1. 查询 task（经 Facade 包装，无 Flowable 泄漏）
        BpmTaskDTO task = bpmTaskFacade.getTask(taskId);
        if (task == null) {
            ApprovalActionRecord handled = approvalActionService == null
                    ? null : approvalActionService.findByTaskId(taskId);
            if (handled != null) {
                if (commandId != null && commandId.equals(handled.getCommandId())) {
                    log.info("同命令重放恢复自身已提交结果: commandId={}, taskId={}, "
                                    + "actionRecordId={}, actor={}",
                            commandId, taskId, handled.getId(), handled.getActorId());
                    return com.sw.ck.common.response.R.ok();
                }
                log.warn("已被处理冲突（不同命令/意图）: taskId={}, 已办命令={}, 当前命令={}",
                        taskId, handled.getCommandId(), commandId);
                throw new BaseException(com.sw.ck.bpm.api.exception.BpmErrorCode.APPROVAL_ALREADY_HANDLED);
            }
            throw new BaseException(CommonErrorCode.NOT_FOUND.getCode(), "任务不存在");
        }

        // 2. 越权校验：审批人
        boolean assigned = String.valueOf(loginUser.getUserId()).equals(task.getAssignee());
        if (!assigned && !bpmTaskFacade.canHandle(taskId, String.valueOf(loginUser.getUserId()))) {
            log.warn("越权拒绝（审批人不匹配）: taskId={}, taskAssignee={}, currentUserId={}",
                    taskId, task.getAssignee(), loginUser.getUserId());
            throw new BaseException(CommonErrorCode.FORBIDDEN.getCode(), "无权处理该任务");
        }

        String processInstanceId = task.getProcessInstanceId();

        BpmInstance instance = bpmInstanceService.findByProcessInstanceId(processInstanceId).orElse(null);
        if (instance != null && InstanceStatusEnum.FAILED.getCode().equals(instance.getStatus())) {
            log.warn("失败实例拒绝继续审批: processInstanceId={}, taskId={}, userId={}",
                    processInstanceId, taskId, loginUser.getUserId());
            throw new BaseException(com.sw.ck.bpm.api.exception.BpmErrorCode.INSTANCE_FAILED);
        }

        // 2.5 流程结束前读取设备透传变量（实例结束后 Runtime 变量不可查）
        String productId = asString(bpmTaskFacade.getVariable(processInstanceId, "productId"));
        String deviceName = asString(bpmTaskFacade.getVariable(processInstanceId, "deviceName"));
        String commandKey = asString(bpmTaskFacade.getVariable(processInstanceId, "commandKey"));
        String commandType = asString(bpmTaskFacade.getVariable(processInstanceId, "commandType"));

        boolean legacyInvocation = request == null;
        ApprovalActionRequest effectiveRequest = legacyInvocation ? new ApprovalActionRequest() : request;
        ApprovalAction action = effectiveRequest.getAction() == null ? ApprovalAction.APPROVE
                : effectiveRequest.getAction();
        effectiveRequest.setAction(action);
        Map<String, Object> processVariables = bpmTaskFacade.getVariables(processInstanceId);
        ApprovalOpinionValidator.validate(effectiveRequest, resolveOpinionForm(task), processVariables);
        if (action == ApprovalAction.RETURN) {
            if (effectiveRequest.getReturnTargetNodeId() == null
                    || effectiveRequest.getReturnTargetNodeId().isBlank()) {
                throw new BaseException(com.sw.ck.bpm.api.exception.BpmErrorCode.APPROVAL_RETURN_TARGET_INVALID);
            }
            bpmTaskFacade.returnTask(taskId, effectiveRequest.getReturnTargetNodeId());
            if (participantSnapshotRecorder != null) {
                participantSnapshotRecorder.settle(processInstanceId, task.getTaskDefinitionKey(),
                        task.getTaskId(), String.valueOf(loginUser.getUserId()), action.name(),
                        loginUser.getTenantId());
            }
            recordAction(task, loginUser, effectiveRequest, action, "RETURNED", processVariables,
                    commandId);
            publishProcessEvent(processInstanceId, loginUser, BpmNotifyTrigger.PROCESS_RETURNED);
            return com.sw.ck.common.response.R.ok();
        }

        Map<String, Object> variables = legacyInvocation ? null : new java.util.HashMap<>();
        if (variables != null) {
            variables.put("outcome", action == ApprovalAction.REJECT ? "REJECTED" : "APPROVED");
        }
        try {
            if (assigned) bpmTaskFacade.complete(taskId, variables);
            else bpmTaskFacade.completeAsUser(taskId, String.valueOf(loginUser.getUserId()),
                    variables == null ? Map.of() : variables);
        } catch (RuntimeException e) {
            BaseException branchFailure = findBaseException(e,
                    com.sw.ck.bpm.api.exception.BpmErrorCode.BRANCH_EVALUATION_FAILED.getCode());
            if (branchFailure != null) {
                bpmInstanceService.updateStatus(processInstanceId, InstanceStatusEnum.FAILED.getCode());
                log.warn("分支条件求值失败，实例进入 FAILED: processInstanceId={}, taskId={}",
                        processInstanceId, taskId);
                return com.sw.ck.common.response.R.fail(branchFailure.getCode(), branchFailure.getMessage());
            }
            throw e;
        }
        // 普通审批的 REJECT 是流程终态；会签子任务的 REJECT 只是该参与人的
        // 独立意见，必须交给 CONSENSUS completionCondition 按 ANY/ALL/RATIO
        // 结算，不能被这里的通用终止分支提前截断。
        if (action == ApprovalAction.REJECT && !isConsensusTask(task)) {
            // 驳回是流程终态动作；没有显式驳回分支时不能让线性流程继续创建后续待办。
            bpmTaskFacade.terminateProcess(processInstanceId, "REJECTED");
        }
        if (participantSnapshotRecorder != null) {
            participantSnapshotRecorder.settle(processInstanceId, task.getTaskDefinitionKey(),
                    task.getTaskId(), String.valueOf(loginUser.getUserId()), action.name(),
                    loginUser.getTenantId());
        }
        recordAction(task, loginUser, effectiveRequest, action,
                action == ApprovalAction.REJECT ? "REJECTED" : "APPROVED", processVariables,
                commandId);
        log.info("审批已完成: taskId={}, processInstanceId={}, userId={}",
                taskId, processInstanceId, loginUser.getUserId());

        // 4. 检测流程是否结束（经 Facade，不直接查 RuntimeService）
        if (!bpmTaskFacade.isProcessActive(processInstanceId)) {
            String terminalStatus = action == ApprovalAction.REJECT
                    ? InstanceStatusEnum.REJECTED.getCode()
                    : InstanceStatusEnum.APPROVED.getCode();
            bpmInstanceService.updateStatus(processInstanceId, terminalStatus);
            log.info("流程已结束，实例状态更新为 {}: processInstanceId={}",
                    terminalStatus, processInstanceId);

            // — 发布审批结果通知事件 —
            publishProcessEvent(processInstanceId, loginUser,
                    action == ApprovalAction.REJECT ? BpmNotifyTrigger.PROCESS_REJECTED
                            : BpmNotifyTrigger.PROCESS_APPROVED);

            // — 审批结果驱动设备：流程变量携带 productId/deviceName/commandKey 时发布设备命令事件 —
            if (productId != null && deviceName != null && commandKey != null) {
                if (commandType == null) {
                    commandType = "PROPERTY";
                }
                domainEventPublisher.publish(new BpmDeviceCommandEvent(
                        processInstanceId, productId, deviceName,
                        commandKey, commandType,
                        loginUser.getTenantId(), loginUser.getUserId()));
                log.info("设备命令事件已发布: processInstanceId={}, productId={}, deviceName={}, commandKey={}",
                        processInstanceId, productId, deviceName, commandKey);
            }
        }

        return com.sw.ck.common.response.R.ok();
    }

    /** 按 ID 批量解析用户展示名；查不到的 ID 返回 null，不阻断查询。 */
    public Map<Long, String> resolveUserNames(java.util.Collection<Long> ids) {
        if (ids == null || ids.isEmpty()) {
            return Map.of();
        }
        try {
            return userQueryFacade.getUserDisplayNames(ids);
        } catch (Exception e) {
            log.warn("用户展示名批量查询失败，回退为 null: {}", e.getMessage());
            return Map.of();
        }
    }

    /** 解析任务节点的意见表单配置（详情与动作校验共用）。 */
    public Map<String, Object> resolveOpinionForm(BpmTaskDTO task) {
        if (bpmProcessDefService == null || objectMapper == null
                || task.getProcessDefinitionKey() == null || task.getTaskDefinitionKey() == null) {
            return Map.of();
        }
        try {
            BpmProcessDef definition = bpmProcessDefService
                    .findByProcessKey(task.getProcessDefinitionKey());
            if (definition == null || definition.getGraphJson() == null) return Map.of();
            ProcessGraph graph = objectMapper.readValue(definition.getGraphJson(), ProcessGraph.class);
            if (graph.getElements() == null) return Map.of();
            return graph.getElements().stream()
                    .filter(element -> "node".equals(element.getKind())
                            && task.getTaskDefinitionKey().equals(element.getId()))
                    .map(GraphElement::getConfig)
                    .filter(java.util.Objects::nonNull)
                    .map(config -> config.get("opinionForm"))
                    .filter(Map.class::isInstance)
                    .map(value -> (Map<String, Object>) value)
                    .findFirst().orElse(Map.of());
        } catch (Exception e) {
            throw new BaseException(com.sw.ck.bpm.api.exception.BpmErrorCode.APPROVAL_OPINION_INVALID);
        }
    }

    public boolean isConsensusTask(BpmTaskDTO task) {
        if (task == null || bpmProcessDefService == null || objectMapper == null
                || task.getProcessDefinitionKey() == null || task.getTaskDefinitionKey() == null) {
            return false;
        }
        try {
            BpmProcessDef definition = bpmProcessDefService
                    .findByProcessKey(task.getProcessDefinitionKey());
            if (definition == null || definition.getGraphJson() == null) return false;
            ProcessGraph graph = objectMapper.readValue(definition.getGraphJson(), ProcessGraph.class);
            if (graph.getElements() == null) return false;
            return graph.getElements().stream()
                    .filter(element -> "node".equals(element.getKind())
                            && task.getTaskDefinitionKey().equals(element.getId()))
                    .anyMatch(element -> "CONSENSUS".equalsIgnoreCase(element.getType()));
        } catch (Exception e) {
            return false;
        }
    }

    private void recordAction(BpmTaskDTO task, LoginUser loginUser,
                              ApprovalActionRequest request, ApprovalAction action,
                              String settlementStatus, Map<String, Object> processVariables,
                              Long commandId) {
        if (approvalActionService == null) return;
        ApprovalActionRecord record = new ApprovalActionRecord();
        record.setProcessInstanceId(task.getProcessInstanceId());
        record.setNodeKey(task.getTaskDefinitionKey() == null
                ? task.getTaskId() : task.getTaskDefinitionKey());
        record.setTaskId(task.getTaskId());
        record.setActorId(loginUser.getUserId());
        record.setAction(action.name());
        record.setCommandId(commandId);
        record.setOpinionFormId(request.getOpinionFormId());
        record.setOpinionFormVersion(request.getOpinionFormVersion());
        Map<String, Object> opinionData = request.getOpinionData() == null
                ? new java.util.LinkedHashMap<>() : new java.util.LinkedHashMap<>(request.getOpinionData());
        if (request.getComment() != null && !request.getComment().isBlank()) {
            opinionData.putIfAbsent("comment", request.getComment());
        }
        try {
            record.setOpinionData(objectMapper == null ? "{}" : objectMapper.writeValueAsString(opinionData));
            Map<String, Object> initialization = new java.util.LinkedHashMap<>();
            initialization.put("source", "processVariables.formData");
            Object formData = processVariables == null ? null : processVariables.get("formData");
            if (formData instanceof Map<?, ?> values) {
                initialization.put("sourceFields", values.keySet().stream().map(String::valueOf).toList());
            }
            record.setInitializationSummary(objectMapper == null ? "{}"
                    : objectMapper.writeValueAsString(initialization));
        } catch (Exception e) {
            throw new BaseException(com.sw.ck.bpm.api.exception.BpmErrorCode.APPROVAL_OPINION_INVALID);
        }
        record.setSettlementStatus(settlementStatus);
        record.setTenantId(loginUser.getTenantId());
        approvalActionService.save(record);
    }

    private void publishProcessEvent(String processInstanceId, LoginUser loginUser,
                                     BpmNotifyTrigger trigger) {
        BpmInstance instance = bpmInstanceService
                .findByProcessInstanceId(processInstanceId)
                .orElse(null);
        if (instance == null) {
            log.warn("流程实例记录不存在: processInstanceId={}，跳过 {} 通知",
                    processInstanceId, trigger);
            return;
        }

        BpmNotifyEvent event = new BpmNotifyEvent(
                trigger,
                instance.getInitiatorId(),
                loginUser.getTenantId(),
                loginUser.getUserId(),
                processInstanceId
        );
        domainEventPublisher.publish(event);
        log.debug("流程结果事件已发布: trigger={}, processInstanceId={}, initiatorId={}",
                trigger, processInstanceId, instance.getInitiatorId());
    }

    private String asString(Object value) {
        if (value == null) {
            return null;
        }
        String s = String.valueOf(value).trim();
        return s.isEmpty() ? null : s;
    }

    private BaseException findBaseException(Throwable error, int code) {
        Throwable current = error;
        while (current != null) {
            if (current instanceof BaseException baseException && baseException.getCode() == code) {
                return baseException;
            }
            current = current.getCause();
        }
        return null;
    }
}
