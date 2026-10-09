# Windows Stop Gate正式安装与验证回执

当前验收状态（2026-10-09）：Owner明确裁决“先按全部通过,后面有问题会再报”，本次治理修复**全部通过、已结案**。当前口径见[Owner通过与结案记录](receipt-owner-windows-stop-gate-acceptance-20261009.md)；后续按新问题反馈处理。

## 安装验证记录（结案前历史）

2026-10-09；Admin。任务入口：[管理员待办](../../../todo/admin-windows-stop-gate-diagnostics-20261009.md)。在Owner开启完全访问后，于Workspace `65a6f8e18243ff3f9ae7986eafa3dff449d96e22` 核对工作树与候选规划复核，`git apply --check`通过后应用原9文件补丁。原补丁SHA256：`23a37c52c45a88a020f8e6dc7a5a69e7c2c0493fc7e6879db511dd04f9ef5965`。

**正式治理修复已安装，适用机器检查全部通过，用户级声明回读一致。真实ZCode会话派发验收仍待补，治理事项保持开放。**

## 安装结果

Windows公共Validator改用实际探测过的Python 3.10+，排除WindowsApps别名；UTF-8载荷直接写入子进程stdin，捕获双流，静默非零退出与异常生成明确诊断。空对象返回契约诊断。Stop Gate记录三阶段Validator退出码、脱敏解释器身份、异常类型及诊断类别；解释器能力故障投影为`VALIDATOR_UNAVAILABLE`，规则拒绝保留原类别。公共`terminal-contract.json`与`validate-execution.py`保持原文件内容。

Windows Stop声明指向process/argv入口`zcode-stop-launcher.ps1`：保存同一份stdin、捕获双流、失败重试一次，仍失败时输出合法block并保存脱敏入口失败台账。自检、宪法与Admin职责已同步。

调用正式安装器时，用户级配置已经与仓库新声明一致：`status=in-sync, applied=false, drift=false`，此次调用没有重写配置；后续独立`-Check`仍exit0、`drift=false`，直接回读Stop参数末项为`${ZCODE_PROJECT_DIR}/.codex/governance/zcode-stop-launcher.ps1`。有效范围为`user`。不能把此次一致性检查记成发生了配置写入或新增备份。

正式自检无需解释器环境覆盖即报告`python_available=true`，实际探测身份为`C:\Users\<user>\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe`；`command_ok=true`、`drift=false`。`live=false`仍保留：最近24小时宿主失败计数4，其中包括原会话06:00:16.620的派发失败。本轮没有清理历史失败记录。

## 正式文件验证

全部使用宿主同款Windows PowerShell 5.1；验证进程移除`AGENT_CODING_ENGINE_PYTHON`覆盖，实际验证默认解释器发现路径。

| 正式文件检查 | 结果 |
|---|---|
| `test-terminal-contract.ps1` | 49/49，exit0，34.172秒。 |
| `test-windows-validator-diagnostics.ps1` | 14/14，exit0；双流、异常脱敏、静默9009、无退出值、重试同载荷及异常输出拒绝。 |
| `test-stop-gate.ps1` | 38/38，exit0；角色绑定、宿主观察与正常/拒绝接线。 |
| 正式launcher→正式Gate→公共Validator原生进程链 | 5/5：正常通过、空终态契约拒绝、已知任务缺观察拒绝、显式WindowsApps能力拒绝、损坏载荷两次失败后block。 |
| 正式安装器与自检 | 安装器、`-Check`及自检各exit0；用户级声明无漂移，Python可执行。 |
| Git差异检查 | 正式源码及文档按既有CRLF行尾检查通过；原diff附件保留必需的空白上下文前缀及原SHA，反向`git apply --check`确认9文件安装内容一致。 |

5项进程链验证使用独立测试session与隔离runtime，不改原业务会话状态。正常通过实际产生`HOST_LIFECYCLE`、`TERMINAL`、`TERMINAL_LIFECYCLE`三条Validator结果，均exit0并有解释器身份；规则拒绝与能力拒绝分别回读到`CONTRACT_REJECTED`、`EXECUTION_LIFECYCLE_REJECTED`、`VALIDATOR_UNAVAILABLE`。这些是正式入口的受控进程实验，不能记为ZCode应用实际派发。

验证有明确超时：契约120秒、诊断45秒、接线180秒、安装器30秒、自检45秒、每项进程链40秒；超时只终止并回收本轮自己启动的精确进程树。本轮全部在上限内退出，没有超时清理。原始结果与runner保存在本机`receipts/evidence/stop-gate-repair-20261009/installed/`及其父目录，沿既有规则不入Git。

## 历史拒绝与剩余验收

沿[原诊断回执](receipt-admin-windows-stop-gate-diagnostics-20261009.md)保留核实边界：前两次历史空诊断拒绝的原始输入/解释器/输出缺失，不能追认唯一根因；第三次是宿主`hook.run.failed`。本轮修复了已证实的空诊断防御缺口和解释器发现问题，未强制放行原会话。

Owner补充的无人值守背景已写入原诊断回执：Agent发起确认时无人查看或应答，等待超时后系统自动拒绝。该说明记录确认链路背景，不替代Stop Gate工具证据。

本轮回读当日日志，最新Stop宿主派发记录仍为历史失败；没有安装后真实会话正常/拒绝派发记录。下一验收由真实受治理ZCode会话自然触发Stop，Admin核对宿主执行结果、同session三阶段脱敏审计与结束投影。P64业务状态、计数与授权沿原规划独立推进。

## Git批次范围

本回执随9文件正式治理修复、管理员待办、原诊断/候选回执、两份本任务Planner复核及原修复补丁一并收尾，目标为`origin/develop-sw`；操作前HEAD与跟踪分支领先/落后为0/0。本批次只包含16个明确治理路径，排除并行业务改动与本机日志。提交及远端SHA回读保存到本机`receipts/evidence/stop-gate-repair-20261009/installed/git-closeout.json`并在最终答复报告。
