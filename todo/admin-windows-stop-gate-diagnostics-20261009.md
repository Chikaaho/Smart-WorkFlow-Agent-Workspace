# Windows Stop Gate修复：全部通过，已结案

当前状态（2026-10-09）：Owner明确裁决“先按全部通过,后面有问题会再报”，本次治理修复全部通过、已结案。当前入口：[Owner通过与结案记录](../product/workspace-governance-consistency-audit/receipts/receipt-owner-windows-stop-gate-acceptance-20261009.md)。正式9文件修复已安装并推送1906fd19；契约49/49、诊断14/14、Stop Gate接线38/38及正式进程链5/5通过，用户级声明drift=false，默认解释器实际探测可用。

本次历史结案保持；2026-10-09 Owner反馈约21:50 ZCode/Codex新Hook失败另见[续办任务](admin-zcode-codex-hook-failures-20261009.md)。2026-10-10[复核02](../product/workspace-governance-consistency-audit/receipts/planning-review-zcode-codex-hook-followup-02-20261010.md)确认ZCode本次核查/诊断增强通过，间歇派发根因未定；Codex Hook事项按Owner要求挂起，原Admin已获停止续办通知。本条历史实测与派发取证边界保留，不增加业务计数。

## 前期诊断与交接（历史）


当前状态（2026-10-09）：Admin诊断核实已完成；9文件修复候选已生成可应用补丁，公共契约49/49、新增诊断/重试14/14、组件聚焦9项及原生argv形状链路8项通过，`git apply --check`通过。正式治理目录、用户级声明和Git元数据当前处于会话写权限范围外，尚未安装/同步/提交/推送；治理修复事项保持未关闭。当前管理员入口为[修复候选回执](../product/workspace-governance-consistency-audit/receipts/receipt-admin-windows-stop-gate-repair-candidate-20261009.md)与[修复补丁](../product/workspace-governance-consistency-audit/repairs/windows-stop-gate-20261009.patch)；[原诊断回执](../product/workspace-governance-consistency-audit/receipts/receipt-admin-windows-stop-gate-diagnostics-20261009.md)与[规划复核](../product/workspace-governance-consistency-audit/receipts/planning-review-admin-windows-stop-gate-diagnostics-20261009.md)保留核实边界。

已确认：受控组件静默非零退出可产生空诊断；PowerShell Write-Error能够捕获。原会话前两次拒绝具体根因未证实，第三次实际记录为hook.run.failed；指定解释器隔离回放通过不等于原宿主通过。执行侧WindowsApps存根9009为候选复现，不能替代历史缺失输入/输出事实。

管理员下一动作：在具有治理目录及用户配置写能力的环境中重新检查并安装同一补丁，重跑治理检查，同步用户级声明并回读drift=false；随后验证真实ZCode回合派发、同一session的三阶段Validator审计和结束投影，完成本批次Git提交推送与远端SHA回读。候选的原生进程链测试不替代宿主真实派发验收；保持同一公共Validator与fail closed。P64业务独立按[一级执行提示](../product/p64-mes-advanced-orchestration/receipts/planning-execution-prompt-p64-phase1-01.md)补证。本条不增加业务功能/P/问题计数，规划不代运行治理或Git。

## 初始交接（历史判断）

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

## Executor 追加实测（2026-10-09，回执03 轮；决定性对照）

同一份终态载荷（EXECUTION_SUBMITTED 与 BLOCKED 两版）在两条解释器解析路径下的结果：

- 宿主环境直接跑 `powershell -NoProfile -NonInteractive -File .codex/governance/validate-terminal.ps1 < payload.json` → **exit 49、stdout/stderr 均空**（`validate-terminal.ps1` 第 97 行 `Get-Command python3, python` 命中 WindowsApps 应用执行别名存根，python 组件未执行），门禁因此报“终态契约未通过公共 Validator：”且诊断为空。
- 同一载荷加 `AGENT_CODING_ENGINE_PYTHON=C:/Users/hjxch/AppData/Local/Programs/Python/Python312/python.exe` 重跑 → **exit 0**（载荷本身合法，BLOCKED 版另需 `browser_status` 非 OPERABLE，已按契约改为 NOT_APPLICABLE 后 exit 0）。

结论：当前宿主进程环境块缺少 `AGENT_CODING_ENGINE_PYTHON`（用户级 setx 只对新进程树生效），公共 Validator 无法执行 → 任何终态都会被判 CONTRACT_REJECTED。解除条件：宿主重启/新进程树继承该变量，或管理员在 `validate-terminal.ps1` 的 python 解析链上加入真实解释器候选（如 `%LOCALAPPDATA%\Programs\Python\Python312\python.exe` 或 `.cache/codex-runtimes/...`）。本工作区业务侧交付与三仓推送不受影响（见 `product/p64-mes-advanced-orchestration/receipts/phase-1-completion-receipt-03.md`）。
