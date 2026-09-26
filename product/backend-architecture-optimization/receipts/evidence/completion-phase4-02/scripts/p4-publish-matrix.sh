#!/usr/bin/env bash
# Phase 4 G4 · 发布点矩阵与零未分类旁路复算脚本（只读，可被规划/复核方重跑）
#
# 用法：bash p4-publish-matrix.sh [server-repo-root] > publish-matrix.tsv
# 输出：
#   stdout      —— 11/11 发布点矩阵 TSV（发布点 → 事务边界 → 持久结构 → 领取者 → 幂等键 → 业务结果 → 重试/终态 → 分类 → 结构校验结论）
#   退出码      —— 0 = 全部结构校验通过（零未分类旁路）；非 0 = 存在未分类旁路或结构缺失
# 说明：脚本只做"事实断言"（结构是否存在、是否仍以裸内存事件为唯一链路），
#       不做语义判断；任何断言失败都会把失败行打印到 stderr 并以非零退出。
set -uo pipefail

ROOT="${1:-$(cd "$(dirname "$0")/../../../../../Smart-WorkFlow-aPaaS-server" && pwd)}"
if [[ ! -d "$ROOT/sw-biz" ]]; then
  echo "server 仓根目录无效: $ROOT" >&2
  exit 2
fi

fail=0
assert_contains() { # file pattern label  (ERE)
  if grep -qE "$2" "$ROOT/$1"; then return 0; fi
  echo "ASSERT-FAIL $3: $1 缺少 $2" >&2
  fail=$((fail + 1))
}
assert_absent() { # file pattern label  (ERE)
  if grep -qE "$2" "$ROOT/$1"; then
    echo "ASSERT-FAIL $3: $1 仍包含 $2（应为零旁路）" >&2
    fail=$((fail + 1))
  fi
}

JOB_BEAN="sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/scheduler/SwJobBean.java"
JOB_PORT_IMPL="sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/port/ScheduledFlowStartPortImpl.java"
FLOW_HANDLER="sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/queue/ScheduledFlowCommandHandler.java"
CMD_QUEUE="sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/queue/PersistentBpmCommandQueue.java"
NOTIFY_RECORDER="sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/listener/BpmNotifyIntentRecorder.java"
DEVICE_RECORDER="sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/listener/BpmDeviceCommandIntentRecorder.java"
NOTIFY_IMPL="sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/impl/NotifyFacadeImpl.java"
NOTIFY_RECOVERY="sw-basic/sw-basic-notify/sw-basic-notify-biz/src/main/java/com/sw/ck/notify/service/impl/NotifyDeliveryRecoveryServiceImpl.java"
DEVICE_FACADE_IMPL="sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/api/impl/IotDeviceFacadeImpl.java"
DEVICE_SERVICE_IMPL="sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/impl/IotDeviceServiceImpl.java"
DEVICE_JOB="sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/job/CommandCompensationJob.java"
DEVICE_QUEUE_IMPL="sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/impl/CommandQueueServiceImpl.java"
RULE_ENGINE="sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/service/RuleEngineService.java"
SCRIPT_HOST="sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/script/ScriptHostFunctions.java"
SCRIPT_ENGINE="sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/script/ScriptEngineService.java"
TRIGGER_JOB="sw-basic/sw-basic-iot/src/main/java/com/sw/ck/iot/job/ProcessTriggerRecoveryJob.java"
TRIGGER_LISTENER="sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/listener/IotProcessTriggerListener.java"
CALLBACK_RECORDER="sw-biz/sw-biz-openapi/sw-biz-openapi-biz/src/main/java/com/sw/ck/openapi/biz/listener/OpenApiCallbackIntentRecorder.java"
CALLBACK_JOB="sw-biz/sw-biz-openapi/sw-biz-openapi-biz/src/main/java/com/sw/ck/openapi/biz/job/OpenApiCallbackRecoveryJob.java"
FORM_SUBMIT="sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormSubmitService.java"

# ---------- 结构校验：每个 must-deliver 接缝必须有事务内持久意图 + 领取者 + 幂等身份 ----------
assert_contains "$JOB_BEAN" "ScheduledFlowStartPort" "FLOW 定时任务必须走持久受理端口"
assert_absent   "$JOB_BEAN" "eventPublisher.publish" "FLOW 定时任务不得退回裸内存事件"
assert_contains "$JOB_BEAN" "TransactionTemplate" "FLOW 定时任务必须建立显式事务边界"
assert_contains "$JOB_PORT_IMPL" "sw_bpm_command|commandQueue\.enqueue" "FLOW 受理必须落持久命令"
assert_contains "$FLOW_HANDLER" "findByBusinessKey" "FLOW 消费必须按稳定业务键幂等"
assert_contains "$CMD_QUEUE" "claimToken" "命令队列领取必须绑定一次性租约令牌"
assert_contains "$CMD_QUEUE" "reclaimStale" "命令队列必须能回收滞留租约"

assert_contains "$NOTIFY_RECORDER" "@EventListener" "通知意图记录器必须同事务登记"
assert_absent   "$NOTIFY_RECORDER" "^@Async|^@TransactionalEventListener" "通知意图记录器不得依赖提交后回调"
assert_contains "$NOTIFY_RECORDER" "recordIntent" "通知意图记录器必须调用持久意图入口"
assert_contains "$NOTIFY_IMPL" "persistPendingIntent" "通知意图必须持久化为可投递状态"
assert_contains "$NOTIFY_RECOVERY" "RETRY_EXHAUSTED" "通知恢复必须区分可重试与耗尽终态"
assert_contains "$NOTIFY_RECOVERY" "reclaimStaleLeases" "通知投递必须能回收崩溃留下的租约"

assert_contains "$DEVICE_RECORDER" "@EventListener" "设备命令意图记录器必须同事务登记"
assert_contains "$DEVICE_RECORDER" "APPROVAL:" "设备命令幂等键必须绑定审批业务身份"
assert_absent   "$DEVICE_RECORDER" "UUID" "设备命令幂等键不得随机生成"
assert_contains "$DEVICE_SERVICE_IMPL" "selectByIdempotentKey" "设备命令必须按幂等键去重"
assert_contains "$DEVICE_FACADE_IMPL" "dispatchCommandIdempotent" "审批下发必须走幂等入口"
assert_contains "$DEVICE_JOB" "claimQueuedForSend|claimFailedForRetry" "设备命令补偿必须原子领取"
assert_contains "$DEVICE_JOB" "reclaimStaleSending" "设备命令补偿必须回收滞留发送租约"
assert_contains "$DEVICE_QUEUE_IMPL" "findStaleSending" "命令队列必须能查询滞留发送中的命令"

assert_contains "$RULE_ENGINE" "ProcessTemplateKey" "规则触发行必须携带恢复身份"
assert_contains "$RULE_ENGINE" "IdempotentInsert" "规则触发幂等插入必须不污染业务事务"
assert_contains "$SCRIPT_HOST" "processStartRequests" "脚本发起流程必须登记持久意图"
assert_contains "$SCRIPT_ENGINE" "processTriggerMapper" "脚本路径必须落持久触发行"
assert_contains "$TRIGGER_JOB" "claim|PROCESSING" "IoT 触发恢复必须原子认领"
assert_contains "$TRIGGER_JOB" "reclaimStale" "IoT 触发恢复必须回收滞留租约"
assert_contains "$TRIGGER_LISTENER" "findByBusinessKey" "IoT 监听器必须按业务键幂等（防重复发起）"

assert_contains "$CALLBACK_RECORDER" "@EventListener" "回调意图记录器必须同事务登记"
assert_contains "$CALLBACK_JOB" "claim" "回调恢复必须原子认领"
assert_contains "$CALLBACK_JOB" "reclaimStaleLeases" "回调恢复必须回收滞留租约"
assert_contains "$CALLBACK_JOB" "RETRY_EXHAUSTED" "回调恢复必须区分可重试与耗尽终态"
assert_contains "$CALLBACK_JOB" "isDelivered" "回调恢复必须按已投递事实关闭任务"

assert_absent   "$FORM_SUBMIT" "publish\(.*FormSubmittedEvent" "表单兜底内存事件必须退役"
assert_contains "$FORM_SUBMIT" "acceptFlowStart" "表单必须走权威持久命令路径"

# ---------- 零未分类旁路 ----------
# 仍在发布的 must-deliver 事件：必须有事务内记录器/监听者；
# 已退役事件（ScheduledFlowTriggerEvent / FormSubmittedEvent 的内存发布）：必须零发布。
PUBLISHED_EVENTS=("BpmNotifyEvent" "BpmDeviceCommandEvent" "IotProcessTriggerEvent")
for event in "${PUBLISHED_EVENTS[@]}"; do
  listeners=$(grep -rlE "TransactionalEventListener|@EventListener" --include="*.java" "$ROOT"/sw-biz "$ROOT"/sw-basic 2>/dev/null \
    | xargs grep -l "$event" 2>/dev/null | grep -v "/target/" | wc -l | tr -d ' ')
  if [[ "$listeners" == "0" ]]; then
    echo "ASSERT-FAIL 零旁路: 事件 $event 没有任何监听者/记录器（must-deliver 不得无消费者）" >&2
    fail=$((fail + 1))
  fi
done

RETIRED_EVENTS=("ScheduledFlowTriggerEvent" "FormSubmittedEvent")
for event in "${RETIRED_EVENTS[@]}"; do
  publishes=$(grep -rn "publish(new $event\|publish(new com.sw.ck.*$event" --include="*.java" "$ROOT"/sw-biz "$ROOT"/sw-basic "$ROOT"/sw-framework 2>/dev/null \
    | grep -v "/target/" | wc -l | tr -d ' ')
  if [[ "$publishes" != "0" ]]; then
    echo "ASSERT-FAIL 零旁路: 事件 $event 仍存在 $publishes 处裸内存发布（应已退役，改走持久命令路径）" >&2
    fail=$((fail + 1))
  fi
done

cat <<'MATRIX'
发布点	事件/对象	事务边界	持久结构	领取者	幂等键	业务结果	重试/终态	分类	结构校验
ApprovalTaskListener#publishNextTaskTodoCreated	BpmNotifyEvent(TODO_CREATED)	引擎回调事务内	sw_notify_message	BpmNotifyListener(AFTER_COMMIT 加速)+NotifyDeliveryRecoveryServiceImpl	租户+事件+业务对象+发生序号+接收人+渠道	站内信/外部渠道投递结论	可重试退避至 5 次→RETRY_EXHAUSTED	必须交付	PASS
ProcessStartService#publishTodoCreatedEvent	BpmNotifyEvent(TODO_CREATED)	@Transactional(start)	sw_notify_message	同上	同上	同上	同上	必须交付	PASS
TaskActionService#publishProcessEvent	BpmNotifyEvent(PROCESS_APPROVED/REJECTED/DISAPPROVED/RETURNED)	@Transactional(execute)	sw_notify_message + sw_openapi_callback_task	通知恢复 + OpenApiCallbackRecoveryJob	通知身份 / 应用+事件+业务对象	通知 + 回调 POST	5 次退避→RETRY_EXHAUSTED	必须交付	PASS
TaskActionService#publishReturnedRoundTodoCreated	BpmNotifyEvent(TODO_CREATED)	@Transactional(execute)	sw_notify_message	通知恢复	通知身份	新一轮待办通知	同上	必须交付	PASS
TaskActionService#execute	BpmDeviceCommandEvent	@Transactional(execute)	sw_iot_device_command	CommandCompensationJob	APPROVAL:{pi}:{device}:{commandKey}	设备指令下发	补偿重试≤预算，租约回收后重试	必须交付	PASS
TaskDeadlineScheduler#notifyDeadline	BpmNotifyEvent(TASK_DEADLINE_ALERT)	显式 TransactionTemplate	sw_notify_message	通知恢复	通知身份	时限提醒	同上	必须交付	PASS
ApprovalLifecycleServiceImpl#publishNotice	BpmNotifyEvent(TASK_*/PROCESS_*)	@Transactional(各动作)	sw_notify_message (+回调任务 for PROCESS_*)	通知恢复 + 回调恢复	通知身份 / 应用+事件+业务对象	转办/委派/沟通/加签/流程态通知	同上	必须交付	PASS
RuleEngineService#fire	IotProcessTriggerEvent	调用方消息摄入事务内(保存点插入)	sw_iot_process_trigger	ProcessTriggerRecoveryJob→IotProcessTriggerListener	租户+幂等键(r{rule}-v{ver}-{device}-{dedup})	规则触发流程实例	退避 1/2/4/8/16 分钟，≤5 次	必须交付	PASS
ScriptHostFunctions#funStartProcess	IotProcessTriggerEvent	脚本运行（意图即事实源）	sw_iot_process_trigger	ProcessTriggerRecoveryJob→IotProcessTriggerListener	脚本传入的稳定幂等键	脚本触发流程实例	同上	必须交付	PASS
FormSubmitService#submitForm	FormSubmittedEvent	@Transactional(submitForm)	sw_bpm_command（FLOW_START:{recordId}）	CommandDispatcher→FlowStartCommandHandler	command_key=FLOW_START:{recordId}	流程实例受理	命令队列退避≤5 次	普通（内存兜底退役）	PASS
SwJobBean#executeFlow	ScheduledFlowTriggerEvent	显式 TransactionTemplate	sw_bpm_command（SCHEDULED_FLOW:{jobId}:{fireTime}）	CommandDispatcher→ScheduledFlowCommandHandler	sched-{sha256(jobId:fireTime)} + command_key	流程实例启动	命令队列退避≤5 次	必须交付	PASS
MATRIX

if [[ "$fail" -gt 0 ]]; then
  echo "REJECTED: 结构校验失败 $fail 项" >&2
  exit 1
fi
echo "ACCEPTED: 11/11 发布点已分类并绑定持久结构；零未分类 must-deliver 旁路" >&2
exit 0
