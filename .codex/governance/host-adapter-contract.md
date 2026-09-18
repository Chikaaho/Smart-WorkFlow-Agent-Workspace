# Host Adapter 最小契约

Host Adapter 不裁决任务终止，只向宿主外 Supervisor 报告事件并投递其批准的回注。

## 事件信封

所有事件使用 `agent-coding-engine.supervisor-event.v1`，必填：

- `event_type`：`TASK_STARTED`、`TURN_ENDED`、`HEARTBEAT`、`USER_PAUSED`、`USER_RESUMED`、`USER_CANCELLED`；
- `event_id`：宿主内稳定且不复用的事件标识；
- `task_id`、`host`、`workspace`、`thread_id`、`active_role`；
- `TASK_STARTED`、`TURN_ENDED` 还需非负整数 `contract_revision`；
- `terminal_payload` 只允许承载 `.codex/governance/terminal-contract.json` 的既有字段，不另建终态字段；
- `execution_observations` 可承载 `browser_status`、`browser_evidence`、`tool_results`、`progress_fingerprint` 的宿主实测值。

Supervisor 返回 `agent-coding-engine.supervisor-decision.v1`。只有 `decision` 为 `reinject` 或 `replan` 且 `send_required=true` 时适配器才可发送 `follow_up_prompt`。发送目标必须与返回的 `target.host/workspace/thread_id` 完全一致，发送后必须回读目标；无法证明时 fail closed。

幂等键由 host、规范化 workspace、thread、task、contract revision 和 event identity 共同计算。相同事件重放只返回原决定，不产生第二次回注。

## 运行入口

```powershell
# 长驻服务，仅监听 loopback；token 保存在未跟踪的 runtime 目录
powershell -NoProfile -File .codex/governance/supervisor.ps1 serve --port 8765

# 直接裁决（测试/恢复模式）
Get-Content event.json -Raw | powershell -NoProfile -File .codex/governance/supervisor.ps1 event

# 查看脱敏状态
powershell -NoProfile -File .codex/governance/supervisor.ps1 status --task-id TASK_ID
```

长驻服务只接受带本地 bearer token 的 `/v1/events`，不监听外网地址。审计记录不保存 prompt、完整 terminal payload、工具详情或秘密。
