# Host Adapter 最小契约

Host Adapter 不裁决任务终止，只向宿主外 Supervisor 报告事件并投递其批准的回注。

## 事件信封

所有事件使用 `agent-coding-engine.supervisor-event.v1`，必填：

- `event_type`：`TASK_STARTED`、`TURN_ENDED`、`HEARTBEAT`、`USER_PAUSED`、`USER_RESUMED`、`USER_CANCELLED`；
- `event_id`：宿主内稳定且不复用的事件标识；
- `task_id`、`host`、`workspace`、`thread_id`、`active_role`；
- `TASK_STARTED`、`TURN_ENDED` 还需非负整数 `contract_revision`；
- `terminal_payload` 只允许承载 `.codex/governance/terminal-contract.json` 的既有字段，不另建终态字段；
- `execution_observations` 可承载 `browser_status`、`browser_evidence`、`tool_results`、`progress_fingerprint`、`execution_tasks` 的宿主实测值；`background_tasks` 保留宿主已知任务（含宿主自动转入后台者），只能排除宿主确认为 `owner=USER` 的既有服务。

Supervisor 返回 `agent-coding-engine.supervisor-decision.v1`。只有 `decision` 为 `reinject` 或 `replan` 且 `send_required=true` 时适配器才可发送 `follow_up_prompt`。发送目标必须与返回的 `target.host/workspace/thread_id` 完全一致，发送后必须回读目标；无法证明时 fail closed。

幂等键由 host、规范化 workspace、thread、task、contract revision 和 event identity 共同计算。相同事件重放只返回原决定，不产生第二次回注。

## 执行生命周期接入

生命周期 schema 与可判定字段唯一来源为 `terminal-contract.json` 的 `properties.execution_tasks` 和 `behavioralRules.executionLifecycle`；`validate-execution.py` 是同一公共 Validator 的组件，POSIX/Windows Validator 与 Supervisor 共用。不得另建并行契约。

非即时任务在启动前绑定输入、输出、完成条件、授权工作项、稳定 ID/句柄、最小充分工作量、任务特定时限、取消/清理动作及结果位置；宿主在 `TASK_STARTED` / `HEARTBEAT` / `TURN_ENDED` 报告真实快照。Supervisor 保存上一快照，同一授权工作项的工作量预算累计计入已结束任务，拆成多个句柄不能重置预算；拒绝无实际变化的序号/时间增长、任务失踪、换身份/扩工作量/延长期限、完成后重启，以及活任务终态。失败、超时或观察缺失的回注只要求核对自身身份并按 `CANCEL_AND_SAVE` 清理保存；同一诊断重复时停止自动投递并报告清理缺口，不无限回注。

原生结果通知和有界结果获取只适用于已合规任务，不允许 sleep、定时器、延时轮询、nohup 或脱离进程。时限按具体任务设置，任何固定时长以内都不自动获准。控制入口 `governed-task.ps1` 的 `ObservationFile` / `BackgroundTasksFile` 只接收 Harness 实测，不能用模型自述替代。取消租约会关闭自动续行，但不等于工具已清理；`status.cleanup_pending_task_ids` 保留缺口直到回读最终观察。终态必须有结果、退出状态和清理完成观察。用户既有服务不得被纳入代理清理目标。

现有 Stop 接入只读取宿主载荷，不能在任意工具启动前拦截，也不能从无遥测推断“没有任务”。ZCode 原生载荷缺少生命周期观察时，自检显示 `host_observation_source=hook_payload`、`prelaunch_interception=false`；已知后台任务或声明的生命周期缺少真实观察必须拒绝。支持任务的启动入口应在发起前调用 Supervisor 的启动事件，观察能力不足则拒绝非即时任务；不得声称已有全工具启动拦截。Watchdog 的分离续行入口拒绝启动并记录受控投递能力缺口，终态 marker 只标为未验证。此限制不改动用户已有服务或宿主配置。

## 运行入口

```powershell
# 用户管理的服务入口，仅监听 loopback；token 保存在未跟踪的 runtime 目录
powershell -NoProfile -File .codex/governance/supervisor.ps1 serve --port 8765

# 直接裁决（测试/恢复模式）
Get-Content event.json -Raw | powershell -NoProfile -File .codex/governance/supervisor.ps1 event

# 查看脱敏状态
powershell -NoProfile -File .codex/governance/supervisor.ps1 status --task-id TASK_ID
```

上述服务由用户管理；代理治理检查优先使用立即返回的 `event` / `status`，不能用后台启动服务取得长任务许可。服务只接受带本地 bearer token 的 `/v1/events`，不监听外网地址。审计记录不保存 prompt、完整 terminal payload、工具详情或秘密。
