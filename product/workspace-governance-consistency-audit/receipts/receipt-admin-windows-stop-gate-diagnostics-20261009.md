# Windows Stop Gate 诊断核实（Admin，2026-10-09）

任务入口：[管理员交接](../../../todo/admin-windows-stop-gate-diagnostics-20261009.md)。核实基准：Workspace `aec126277fd0450f51d75faa6ec570da2f78c9f2`；本轮只读取治理实现、任务文档、宿主审计与会话终态，运行有界治理复现，不裁决 P64 业务状态。

## 核实结论

**空诊断的防御缺口成立；原会话前两次拒绝的具体根因仍未证实。** 现有入口允许 Validator 非零退出且诊断数组为空，随后拼出空的契约拒绝说明。Executor 关于“PowerShell 错误流一定被遗漏”的推断未获复现支持，不能作为确定根因。三份持久化终态在指定可用 Python 的隔离环境通过检查，不等于原宿主执行已经获准终止。

“连续三次均由生命周期门禁拒绝”与本机记录不完全一致：前两次是审计明确拒绝，第三次是宿主报告 hook 执行失败。

## 原始记录与边界

| 北京时间（2026-10-09） | 本机可回读事实 |
|---|---|
| 05:39:57 | `audit.jsonl`：`EXECUTION_LIFECYCLE_REJECTED`，`EXECUTION_SUBMITTED`，工具调用 1036，自定清单未完成数 0；有 invoked/payload-read 回执。 |
| 05:55:15 | 同一会话同样拒绝，工具调用 1055，自定清单未完成数 0；有 invoked/payload-read 回执。 |
| 06:00:16.620 | 宿主 `zcode-2026-10-09.jsonl`：`hook.run.failed`，Stop、`config.Stop.0.0`，耗时 232ms；对应时间未见门禁派发回执或裁决审计。不能归为第三次生命周期拒绝，也不能仅凭该记录确定进程失败原因。 |

来源：`.codex/governance/runtime/zcode/{audit.jsonl,invocations.log}`、宿主 CLI log、只读 SQLite `message/part` 表。原会话键和完整诊断结果仅保留于本机证据。

`hook-selfcheck.ps1` 显示用户级声明生效、`drift=false`；Windows Stop 实际为 process/argv 直启 `stop-gate.ps1`，未经过 cmd 重试包装。自检报告 `live=false`，含近期宿主失败；不应将声明无漂移解释为运行健康。当前诊断进程 PATH 找不到 Python，自检 `python_available=false`；观察读取器却缓存了可用的 bundled Python。此差异是复现环境事实，不能直接推定原宿主的 Python 选择或退出原因。

现有正常拒绝审计不保存 Validator 退出码及诊断内容，派发回执只记录长度等元数据。未找到前两次的完整原始 Stop 载荷、当时解析出的 Python 路径和实际 stdout/stderr。因此无法回放全部原宿主输入与环境，无法独立确认历史任务生命周期和清理事实。

## 有界复现

使用宿主同款 Windows PowerShell 5.1，显式指定可用 bundled Python；从原脚本 AST 提取并运行实际 `Invoke-TerminalValidator`，未重写裁决规则。每个子进程最多 12 秒，退出码、stdout/stderr 落盘；超时策略为终止并回收自身子进程。本轮全部在限时内结束。

| 用例 | 实际结果 |
|---|---|
| 从 SQLite 取回的三份 `EXECUTION_SUBMITTED` 终态 | 公共 PowerShell Validator 各自 `exitCode=0`；Python 生命周期检查各自 exit 0。 |
| 三份终态 + 重建的原生 Stop 最小载荷 + 隔离空清单观察 | Stop Gate 各自 exit 0，stdout/stderr 均空，符合宿主通过投影。重建输入没有历史生命周期观察，不能代替原始载荷。 |
| 子 Validator `[Console]::Error.WriteLine(...)` 后 exit 7 | 捕获到非空诊断与 exit 7。 |
| 子 Validator `Write-Error -ErrorAction Continue` 后 exit 7 | 捕获到格式化 PowerShell 错误与 exit 7；反证“PowerShell 错误流必然遗漏”。 |
| 子 Validator `throw` | RuntimeException 向调用方传播，未返回 `{exitCode,diagnostics}`；原入口另有外层 trap，不能将该形态直接解释为生命周期拒绝。 |
| 生命周期组件静默 exit 7 | 实际公共 Validator 调用返回 `exitCode=7, diagnostics=[]`，稳定复现空诊断缺口。该组件为受控故障替身，不证明原宿主当时发生了同一故障。 |
| 已知代理后台任务没有生命周期观察 | exit 1，并有 `known agent task lacks lifecycle observation` 诊断，保持 fail closed。 |
| 空对象终态 `{}` | 公共 PowerShell Validator 在枚举空属性集合时触发 StrictMode RuntimeException；与带字段的三份历史终态不同，为独立异常路径问题。 |

本机证据：`receipts/evidence/stop-gate-20261009/`，包括 `terminal-index.json`、三份终态、`host-hook-events.json`、`*-correct-replay.json`、`terminal-[0-2]-gate-replay.json`、`capture-{ps-throw,ps-write-error,console-error,empty-error}.json`、`silent-component-reject.json`、`lifecycle-observation-reject.json`、`invalid-terminal-reject.json` 及 `diagnose.py`。早期通过原生 argv 传 JSON 的探测发生引号传递失真，其 `*-ps.json/context-True.json` 不用于上述结论；后续复现从文件在 PowerShell 内读取 JSON，避免该探测问题。原始附件遵守项目规则，仅本地保存。

## 治理修复范围与后续复核

1. Validator 的非零退出无诊断路径必须生成明确的兜底诊断，标明组件、退出码和无输出事实；异常路径要保留脱敏异常类型和来源。裁决保持拒绝。
2. 原生命周期预检、终态校验及终态生命周期复检都应保存脱敏 Validator 退出码与诊断，避免下一次拒绝仍无法追溯。保存实际解析的解释器身份，以核实解释器发现差异。
3. 空对象等非法终态应返回契约拒绝诊断，避免 StrictMode 未处理异常。
4. 第三次宿主派发失败独立处理：先取得可回读的进程启动/退出结果，按实际 Windows 声明复验入口。声明与宪法关于 command/process 接入存在不同表述，需结合既有宿主派发取证统一；不能仅因有 cmd 文件就声称 Stop 已有重试兜底。
5. 修复后覆盖正常通过、规则拒绝、PowerShell 异常、组件无输出非零退出与宿主真实派发；原会话由实际宿主重新经过同一 Validator 裁决。管理员不能按终态自述强制放行。

本轮完成核实并提供上述可回读结果；尚未修改治理入口、机器配置或原会话状态。P64 阶段Ⅰ审查及现有可执行补证继续按原业务方向推进。

## Git 收尾

Owner 补充说明（2026-10-09）：拒绝发生在无人值守期间，Agent 发起确认时无人查看或应答，等待超时后系统自动拒绝。交接记录保留这一确认链路背景。

报告提交目标为 `origin/develop-sw`；操作前本地与跟踪分支一致。只暂存本报告时，工具返回 `.git/index.lock: Permission denied`，本轮报告未提交、未推送。现有业务/规划改动、其他未跟踪文档与本机原始证据均未暂存；报告保存在工作区供复核。
