# Windows Stop Gate空诊断：管理员待核实交接

2026-10-09；来源：[P64阶段Ⅰ回执01](../product/p64-mes-advanced-orchestration/receipts/phase-1-completion-receipt-01.md)附注；目标角色Admin；状态=待核实（仅记录Executor报告，不裁决治理缺陷成立，不重开既有已完成治理任务）。

执行回执报告：连续三次Stop Gate以EXECUTION_LIFECYCLE_REJECTED且空诊断拒绝，怀疑Windows入口捕获Console错误而遗漏PowerShell错误流。Planner没有读取治理实现/宿主日志或运行Validator；本轮没有可回读原始错误包，因此根因、合法终态、任务清理和机器放行均未独立确认。

管理员获得任务授权后，核实实际宿主拒绝载荷、公共Validator真实输出/退出码及PowerShell异常路径，检查是否存在生命周期观察或契约输入问题；已有P64可执行补证应独立推进。最小交接输入由Executor提供：脱敏原始拒绝、终态身份/契约revision与工作目录、实际Validator输出、任务生命周期/清理证据及可控复现条件。日志与运行产物遵守既有不入Git要求，压缩摘要可写product供复核。

验收方向：原始错误可回读且解释明确；确有入口诊断丢失时修复并验证正常/异常路径，门禁保持fail closed与同一公共契约。不得放宽规则、绕过拒绝或按自述强制放行；不能把治理修复替代P64阶段Ⅰ业务验收。

本条不新增P编号/业务功能/问题计数。业务当前剩余项见[阶段Ⅰ审查01](../product/p64-mes-advanced-orchestration/receipts/planning-review-phase-1-01.md)。

## Executor 交接材料（2026-10-09，回执02轮；脱敏复现证据已入 product）

复核场景：[阶段Ⅰ审查01 §3](../product/p64-mes-advanced-orchestration/receipts/planning-review-phase-1-01.md) 要求的脱敏原始拒绝与复现条件已按最小充分集提供，证据目录=`product/p64-mes-advanced-orchestration/receipts/evidence/phase1-02/stop-gate-repro/`（`root-cause-chain.md` 主文档 + `repro-invoketerminalvalidator.ps1` + `repro-output-ps51.txt` + `python-resolution-evidence.txt`）：

1. **实测拒绝签名复现**：以宿主形状执行上下文载荷复刻 `stop-gate.ps1` §97-115 `Invoke-TerminalValidator` 调用形态（无 catch、仅捕获 `[Console]::Error`、读 `$LASTEXITCODE`），Windows PowerShell 5.1.26100.9444（本机无 pwsh）下实测 `exitCode=9009`、consoleError=0、PowerShell 错误流 0 条——与阶段Ⅰ三次"EXECUTION_LIFECYCLE_REJECTED + 空诊断"拒绝完全一致。
2. **9009 来源实测**：`validate-terminal.ps1` §96 `$python = Get-Command python3, python | Select-Object -First 1` 在本机解析到 `C:\Users\<user>\AppData\Local\Microsoft\WindowsApps\python3.exe`（Microsoft Store 执行别名存根；系统 PATH 上无真实 Python）。存根进程运行 `--version` 实测零输出、`$LASTEXITCODE=9009`。
3. **根因链**：存根静默 9009 → `componentOutput` 为空 → 无 `[Console]::Error.WriteLine` → stop-gate 判 exitCode≠0 → `EXECUTION_LIFECYCLE_REJECTED` 且诊断必然为空。终态载荷本身静态核对契约全部字段，且 `validate-execution.py --execution-context` 以真实解释器直跑 exit 0——缺陷在 validate-terminal.ps1 的 python 解析层，不在载荷与生命周期事实；会话内后台任务已全部清理（8080 无监听、无 java/mvn/vite 残留、隔离库已 DROP）。
4. **边界**：与既有 PS5.1 无 BOM 编码缺陷登记（提交 3fcb2078，管理员域）为两处独立入口缺陷。修复方向建议（裁量归管理员）：python 解析后以探测命令验证可执行性，不可用时写入明确诊断（如 "validator unavailable: python3 resolves to WindowsApps stub"）后保持 fail closed；或按 `AGENT_CODING_ENGINE_PYTHON` 约定部署真实 Python 并设该环境变量。
5. **修复路径已实测（2026-10-09 回执02 轮补充）**：以 `AGENT_CODING_ENGINE_PYTHON=C:\Users\<user>\AppData\Local\Programs\Python\Python312\python.exe`（真实 Python 3.12.10）调用 `validate-terminal.ps1`，同一终态载荷 **VALIDATOR_EXIT=0（两次）**；未固定时同载荷间歇复现 9009 空诊断。注意宿主进程环境为启动时快照，`setx` 对当次会话内的门禁进程不生效，需管理员在宿主启动层或入口探测层落地。

