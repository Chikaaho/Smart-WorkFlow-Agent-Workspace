# ZCode Hook修复后台账回读补证（HK-Z）

2026-10-10 08:05（+08:00），Admin；仅HK-Z。依据[双宿主规划复核](planning-review-zcode-codex-hook-failures-20261010.md)与[续办任务](../../../todo/admin-zcode-codex-hook-failures-20261009.md)当前剩余：只读提取修复提交`bce10e45`之后的自然派发台账，以及已有真实Executor合法拒绝与同session自动续行记录。未重跑49/14/38，未删历史失败，未新造长任务，未修改任何会话状态。历史回执与既有结论保留原始时点。

## 修复后自然派发原件（只读台账）

**一、本管理员会话（`sess_5ca9dce0`，admin）2026-10-09 23:23:58—59本地（15:23:58—59Z）**，回合结束真实宿主Stop完整链路：

| 阶段 | 台账 |
|---|---|
| launcher首语句回执 | `15:23:58Z launcher-invoked` |
| gate入口 | `15:23:59Z invoked` |
| 载荷 | `15:23:59Z payload-read session=sess_5ca9dce0 bytes=7100` |
| 角色边界 | 角色=admin非executor → 门禁静默通过（不写裁决审计，符合原角色边界设计） |
| 宿主结果 | 同回合`turn.completed`于`15:23:59.477Z`正常结束；此后全部宿主日志无任何`hook.run.failed`；`entry-failures.log`无新增 |

**二、受治理Executor会话（`sess_ebe8d1f2`，executor）2026-10-10 00:13:45—47本地（16:13:45—47Z）**：`launcher-invoked`→`invoked`→`payload-read`（bytes=18830）→三阶段Validator全部exit0→`decision=pass`、`TERMINAL_ACCEPTED`、`terminal_state=EXECUTION_SUBMITTED`（tool_call_count=115、context_percent=21）；宿主`turn.completed`于`16:13:47.269Z`；当日宿主日志（`zcode-2026-10-10.jsonl`）`hook.run.failed`计数为0。

两项均为修复提交后的**自然宿主派发原件**（非受控测试）：launcher脚本体与首语句回执实际执行，表明修复未破坏真实派发链路；admin静默通过与原角色边界一致。

## 已有真实Executor合法拒绝与同session自动续行（压缩提取）

- **主记录（`sess_ebe8d1f2`，2026-10-09 12:24Z）**：`12:24:00Z` Stop裁决`block`、`CONTRACT_REJECTED`（终态行未通过公共Validator：`HOST_LIFECYCLE exit0`、`TERMINAL exit1`，诊断归一`terminal:browser_evidence.object`；`continuation=false`为turn内首次停止）→宿主按Stop block原生续行→`12:24:15Z`同一会话再次派发Stop且`continuation=true`（`stop_hook_active=true`，宿主自动续行中的派发）→三阶段全部exit0、`decision=pass`、`TERMINAL_ACCEPTED`。两次派发之间宿主输入表无任何用户输入（最近用户输入12:21:32，其后为13:00:35）→**续行为宿主自动，非用户点击继续**；拒绝与接受时`tool_call_count`均为19（未新增工具动作，模型仅修正终态行）。
- **次级记录（`sess_78dc7a83`，2026-10-09 02:26—05:05Z）**：同一会话连续`EXECUTION_LIFECYCLE_REJECTED`拒绝，其中`04:58:16Z`、`05:04:42Z`、`05:05:35Z`三条`continuation=true`且`tool_call_count`单调递增（449→468→469）——真实执行会话在“拒绝→自动续行→再提交”链上的完整投影，同期无用户输入参与。
- **时间边界**：以上均为修复提交`bce10e45`之前的原始会话事件（历史回合）。修复后截至本次回读**尚未出现新的自然拒绝事件**（受治理会话今日仅有的Stop为合法结束通过，其本日上午回合仍在进行），故“修复后拒绝→自动续行”原件仍待自然触达时提取；不据此宣称修复后拒绝路径已再验证，也不以手动点击继续替代自动回注。

## 证据、边界与清理

- 全部只读：`invocations.log`、`audit.jsonl`、宿主日志（`zcode-2026-10-09/10-10.jsonl`）、宿主db（`session_input`，只读打开）；未运行测试、未修改信任/声明/会话状态、未触发执行会话。
- 最小结果JSON：[zcode-hook-readback-20261010.json](zcode-hook-readback-20261010.json)；原始日志与台账保留原位，不入Git。
- 宿主遥测边界保持：process型hook失败无退出码/stderr可供回读；空`${ZCODE_PROJECT_DIR}`展开仍为候选机制（未最终证实）；hook-selfcheck仍如实`live=false`（历史失败台账保留，不删）。

## Git

本批次含本回执、最小JSON、[规划复核](planning-review-zcode-codex-hook-failures-20261010.md)与[续办任务](../../../todo/admin-zcode-codex-hook-failures-20261009.md)当前补充段，按`system.md` §0.8.1向`origin/develop-sw`普通提交推送；精确排除并行业务文档、gitlink与原始日志。本批次提交`539adcc2c2d5bb34876f1d703ab2a96b2a67801c`，推送结果`2ba37f03..539adcc2 develop-sw -> develop-sw`，远端回读`git ls-remote origin refs/heads/develop-sw`=同一完整SHA（回读存档`evidence/hook-failures-20261009-2150/git-closeout-hk-z-readback.json`）。本段为批次推送后的文档补记，代码与证据口径不变。
