# Windows Stop Gate 修复候选与验证回执

2026-10-09；Admin。依据 [规划复核](planning-review-admin-windows-stop-gate-diagnostics-20261009.md)及 Owner 本会话修复指令。

**修复代码已形成可应用补丁，并完成候选环境验证；正式入口安装、用户级声明同步、真实 ZCode 派发和 Git 提交推送待完成。** 当前会话文件权限明确将工作区 `.codex/`、`.git/` 设为只读，用户级配置目录也不在可写范围内。因此本轮在可写目录构造隔离候选，保存[修复补丁](../repairs/windows-stop-gate-20261009.patch)，没有改写受保护的正式文件，没有绕过文件权限或放行历史会话。

## 实现

补丁覆盖 9 个文件（7 个治理文件及 `system.md`、`roles/admin.md` 的接入路径同步），只调用既有公共 Validator，`terminal-contract.json` 和 Python 生命周期规则保持原样：

- 新增 `windows-validator-runtime.ps1`：按显式配置、既有观察读取器缓存、bundled Python、用户安装目录、PATH 查找解释器。逐一验证 Python 3.10+ 和探测输出；排除 WindowsApps 执行别名。显式配置不可用时明确拒绝，避免静默换解释器。进程输入输出固定 UTF-8，执行有任务特定时限，异常/超时清理自身精确子进程。
- `validate-terminal.ps1`：组件非零且无输出时给出退出码与脱敏解释器身份；异常给出类型；空对象与空嵌套对象按字段规则拒绝。修复 Windows PowerShell 默认管道 ASCII 编码造成的输入失真。修改后的 PowerShell 文件使用 UTF-8 BOM，保留原行尾风格。
- `stop-gate.ps1`：捕获 Console 与 PowerShell 错误和终止异常，缺失退出状态默认拒绝；非零无诊断补兜底。三阶段分别记录 `HOST_LIFECYCLE`、`TERMINAL`、`TERMINAL_LIFECYCLE` 的退出码、脱敏解释器身份、异常类型和诊断类别。审计只保存字段/类别，不保存终态正文、工具详情、异常输入或用户秘密。解释器/组件能力故障投影为 `VALIDATOR_UNAVAILABLE`，真实生命周期规则拒绝仍为 `EXECUTION_LIFECYCLE_REJECTED`。
- 新增 `zcode-stop-launcher.ps1`：保留 Windows 已验证的 process/argv 启动方式，先读取并保留同一份 stdin，再调用门禁；捕获双流、最多重试一次，验证输出后投影为空通过或 `{decision,reason}` 拒绝；失败台账只记录退出码和类别。重试不会重新从已消耗的 stdin 读取。
- Windows 声明改为 process/argv 直启 launcher；POSIX 块保持原样。自检使用实际解释器探测结果，展示新入口和辅助文件。宪法与 Admin 定义同步该接入路径。
- 新增 `test-windows-validator-diagnostics.ps1`：覆盖诊断、异常、缺失退出状态、审计脱敏、入口通过/拒绝/异常输出、失败及同载荷重试。

## 验证结果

验证使用本机 Windows PowerShell 5.1 和可用 bundled Python；未运行业务编译、测试、迁移、部署或浏览器验收。

| 检查 | 结果与边界 |
|---|---|
| 既有公共终态契约测试 | **49/49，exit 0**；S/M/L/XL、合法阻塞、剩余工作、正式可见浏览器、权限和确认规则继续有效。 |
| 新增适配诊断/重试测试 | **14/14，exit 0**；含静默 9009、PowerShell 错误/异常、缺失退出状态、审计和解释器身份脱敏、双次失败、异常输出及同一中文载荷重试。 |
| 组件聚焦用例 | **9 项通过**：中文终态、空对象、非法 JSON、空嵌套对象、无显式解释器配置的回退、WindowsApps 排除、缺失解释器、组件静默 exit 7/9009 的明确拒绝。静默组件用例只替换隔离副本，并在 finally 恢复。 |
| 原生 argv 形状的候选链 | **8 项通过**：实际 `powershell.exe -File <entry>` + UTF-8 stdin、隔离 Executor 角色绑定；Gate/launcher 正常通过；空终态、缺生命周期观察、WindowsApps、静默 9009 拒绝；launcher 投影契约拒绝、损坏宿主载荷重试两次后拒绝。通过审计实际回读到三阶段各 exit 0 及脱敏解释器；静默组件拒绝审计回读到 exit 9009。 |
| 补丁适用性 | `git apply --check` **exit 0**；保留源文件行尾，补丁约 300 行新增，未产生全文件行尾重写。 |

原生形状测试通过不代表 ZCode 已安装新声明或真实会话已经通过。其角色、会话、工作目录和载荷均为隔离测试输入；历史任务清理与前两次拒绝根因的边界继续沿用诊断报告。

早期带诊断参数的独立启动用例发生 12 秒超时，未修改入口副本也同样超时；这些用例均取消并回收自建进程，不计通过。后续改用声明本身的 argv/stdin 形状完成上述 8 项链路验证。诊断参数方式与测试配置安装器的兼容性仍待复核，不把超时解释为历史宿主根因。真实 ZCode 派发尚未执行，机器用户配置未改写。

本机原始附件在 `receipts/evidence/stop-gate-repair-20261009/`：`contract-suite.json`、`final-adapter-diagnostics-suite.json`、`component-*.json`、`native-shape-results.json`、`native-negative-results.json`、候选 runtime 审计、构造与验证脚本、`manifest.json`。原始证据和候选树仅本地保存，补丁与本回执供 Git 跟踪。

## 安装与剩余动作

在具有治理目录和用户配置写权限的 Admin 环境中，按以下顺序完成本任务：

1. 在工作区重新运行 `git apply --check product/workspace-governance-consistency-audit/repairs/windows-stop-gate-20261009.patch`，通过后应用同一补丁。
2. 使用 Windows PowerShell 重跑 `test-terminal-contract.ps1`、`test-windows-validator-diagnostics.ps1`；保留原始结果。
3. 运行 `.codex/governance/install-zcode-hooks.ps1` 同步用户级声明，再以 `-Check` 回读 `drift=false`。本轮没有用测试配置安装器超时结果冒充此项已通过。
4. 在真实 ZCode 受治理回合中回读新的派发回执、同一 session 的三阶段 Validator 审计及结束投影；复验正常和拒绝路径。自检中的历史宿主失败记录保留，不清日志制造健康结论。
5. 只提交本批次实际治理文件、同步文档、补丁和回执；按既有 `origin/develop-sw` 授权推送并回读远端 SHA，排除业务/规划并行改动和本地证据。

收尾只读回读 Git HEAD 为 `30bc1d8c24bd29ff3a078d4f131399a87ba2f44d`，期间其他会话推进了仓库；补丁在该工作树再次通过 `git apply --check`。安装前仍须重新确认当前身份和差异，本会话未执行新增 commit/push。前一回合实际 `index.lock: Permission denied` 记录及 Owner 说明的无人值守确认超时背景保留在原诊断回执，不据此推定本轮已获文件写能力。治理修复事项保持未关闭；P64 业务补证与计数不受本候选影响。
