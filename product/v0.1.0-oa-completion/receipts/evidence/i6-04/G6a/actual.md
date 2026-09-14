# G6a 实际结果（event-matrix.txt + 各 raw log）

## 正向（同业务链 T100、i6g1a_form_t100b 定义族，逐事件真实通知）
- TODO_CREATED（提交/退回新轮次）、PROCESS_APPROVED、PROCESS_REJECTED、PROCESS_DISAPPROVED、
  PROCESS_RETURNED、PROCESS_DISCARDED、TASK_TRANSFERRED(→10003)、TASK_DELEGATED(→10003)、
  TASK_COMMUNICATED(receivers=[10003])、TASK_SIGN_REQUESTED(participants=[10003])、
  TASK_URGE(发起人催办→10002，冷却批次 occurrence 2982306)、TASK_DEADLINE_ALERT(dueMinutes=1 调度器真实触发→10002)、
  抄送（COPY 节点：NotifyFacade 直发 10003/10001 IN_APP SUCCESS + sw_bpm_copy_record 审计 2 行 SUCCESS）
- 重复/并发单效果：通知统一走 NotifyFacade 稳定身份幂等（G3e-I 直发幂等 1 行；G1a duplicated:true）

## 反向
- 新轮次不误杀：退回后重建任务 6fa9bb07 生成新 TODO_CREATED（occurrence 独立，boot4.log:183 修复后行为）
- 单节点流程 RETURN 退回 startEvent → 2306「退回目标节点不合法」（真实语义拒绝）

## 修复登记（对象变更）
- Server 缺陷：退回后重建任务无 TODO_CREATED 通知（仅起点发布）。已在
  TaskActionService#execute RETURN 分支补 publishReturnedRoundTodoCreated（受众=assignee/candidates，
  新 taskId 身份），模块 install + 重启后取证（boot4.log:183）→ 受影响锁定项复验范围=G6a/G9b
- 对象变更登记：流程定义族 bpm_8d9e83755d2f430e(抄送链 v2)、bpm_86ecea7aeed741d5(双节点退回链)、
  bpm_2dbcc1de937248a7(时限链)；sw_bpm_form_binding 手工切换（对象铺设，账本规则）；G1a 实例集合不变

## 覆盖边界
- 抄送投递仅 IN_APP（CopyNodeDelegate 契约=站内信+审计）；模板版本字段为空（模板直发/规则链不经过）
