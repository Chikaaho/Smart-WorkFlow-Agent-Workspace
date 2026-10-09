# Codex Stop Hook Windows故障修复回执（HK-C）

2026-10-09；Admin。Owner最新授权：“你只需要检查codex，zcode有另一个会话在检查，不需要任何确认，你直接处理完”。本回执承接[故障续办任务的HK-C](../../../todo/admin-zcode-codex-hook-failures-20261009.md)。当前状态：**Codex修复已实施，入口与本机app-server真实隔离派发验证通过；原工作区新声明的宿主信任状态为modified，尚未生效为可信声明。** 前次Windows Stop Gate的Owner通过记录保持历史结案，业务验收与计数沿原规划。

## 诊断与证据边界

本机Codex版本为`0.159.2`；原项目Stop声明被`hooks/list`识别为enabled/trusted，但只有POSIX shell命令，没有`commandWindows`。Windows PATH没有可用的`sh`、`jq`，Python命中WindowsApps别名。对应版本Hook实现支持宿主指定shell，未指定时Windows回退`COMSPEC`；本轮实际app-server选择会话PowerShell。原POSIX声明无法在该Windows执行链正常解析：以原声明启动本机app-server，真实Stop事件返回`status=failed`、`hook exited with code 1`，没有门禁入口或Validator审计，精确复现Owner截图错误签名。

原截图未显示时间。21:35—22:00窗口未获得可唯一关联的原Codex Hook事件；背景“已读取并复审。”与Planner 17:19:33完成的回合文字一致，但文字关联不足以追认截图的唯一失败时点。因此，本回执证明的是原声明在本机宿主的确定性接线故障及修复结果，保留原截图历史事件的关联边界。

官方协议确认Windows可以使用`commandWindows`；Stop通过输出空内容，规则拒绝返回`decision=block`和非空`reason`，由宿主续行；非托管声明按当前定义hash接受信任评审。[OpenAI Docs：Hooks](https://learn.chatgpt.com/docs/hooks)。本轮实际运行验证补充这些协议事实，没有用官方说明代替本机结果。

## 修改与本机有效范围

- `.codex/hooks.json`新增Windows专用命令，原POSIX命令保留。`EncodedCommand`的可读源为`.codex/hooks/codex-stop-bootstrap.ps1`，测试校验二者逐字一致；向上最多16层定位入口，不消费stdin。编码启动避免外层PowerShell提前展开变量，并关闭模块加载进度流。
- `.codex/hooks/codex-stop-adapter.ps1`保存同一份UTF-8载荷，保持原Codex显式角色绑定，探测Git shell、jq和真实Python，调用原`codex-stop-adapter.sh`及公共Validator/Supervisor。未绑定Executor、Planner、Admin无执行门禁；受治理能力故障生成稳定诊断类别与合法block输出。stdin上限15秒、Gate上限30秒；超时对本轮精确shell PID及其后代执行取消，不按进程名或端口清理。
- `stop-gate.sh`、`validate-terminal.sh`、`supervisor-turn-ended.sh`在各自短生命周期子进程内使用工作区根和ASCII相对契约路径，修复本轮实测的原生Windows jq不能打开带中文绝对路径的问题。公共POSIX Validator以`-X utf8`启动Python生命周期组件，修复直接调用时Windows默认代码页损坏中文JSON的问题。Validator记录同session摘要的`HOST_LIFECYCLE`、`TERMINAL`、`TERMINAL_LIFECYCLE`退出码、脱敏解释器身份；入口记录裁决、组件错误类别与契约SHA，写入忽略目录`runtime/codex/`。
- 新增Codex入口回归；公共POSIX契约测试改用已配置/可发现的jq，覆盖原有断言。`system.md`补齐Windows Codex薄接入路由。`terminal-contract.json`和`validate-execution.py`未改，契约SHA256为`396357977b3b3f4377c2411e22d0b948ef6998ebdc609734d91f4b867e8e8996`。
- 本机从[jq官方发行](https://jqlang.org/download/)安装`jq-1.8.2`到用户缓存`.cache/agent-coding-engine/jq-1.8.2/jq.exe`，没有修改全局PATH。下载校验官方SHA256：`a6fc67fedaf9128a3309a1e2ebb8b986aeccf70122ee46d2cb4849e423f0c627`，实际版本探测exit0。shell和Python使用已有运行时，入口每次实际探测。

## 验证

| 层级/场景 | 实际结果 |
|---|---|
| Windows入口回归 | 18项通过：角色边界、UTF-8通过、缺marker、非法终态、生命周期观察缺失、坏Python/jq/shell、缺稳定身份、根/嵌套/子仓cwd、cmd与PowerShell宿主、编码源一致性、Gate超时和非法载荷。 |
| 公共POSIX契约回归 | 原70项断言全部通过，`cases=70 passed=70 failed=0`，进程exit0；没有放宽规则或删除失败用例。 |
| 本机app-server原声明 | 一次响应，真实`hook/completed=failed`、exit1；入口与Validator记录为0。 |
| 本机app-server合法结束 | 一次响应，真实`hook/completed=completed`；入口pass，三阶段Validator均exit0，session摘要`8605eb06c89c6ef4`。 |
| 本机app-server缺终态→续行→合法结束 | 两次响应；同thread、同turn真实事件先`blocked`后`completed`；入口先block后pass，第一轮原因marker缺失，第二轮三阶段Validator均exit0，session摘要`874d6965b9c0d230`。没有新的用户提示词参与恢复。 |
| 本机app-server Admin | 一次响应，真实Stop完成；入口`ROLE_NOT_EXECUTOR`静默通过，没有运行Executor Validator，session摘要`a7a73ce7c15e1a42`。 |

真实派发使用安装的Codex app-server、隔离CODEX_HOME、带中文和空格的临时工作区、只读模型工具权限、确定性本机HTTP响应fixture；Hook执行、公共Validator和同线程续行由真实宿主完成。临时fixture只信任本轮审阅的自身声明，不修改Owner真实配置或信任记录。这里是本机宿主协议的真实隔离验证，不追认Owner原桌面会话已重新触发。

本机原始记录位于`receipts/evidence/hook-failures-20261009-2150/`：`codex-appserver-dispatch-results.json`、四份`*-appserver-events.json`与请求索引、入口/Validator审计、`codex-components-final-stdout.txt`、`codex-public-regression.json`、下载校验和`codex-native-hooks-list.json`。原图和历史记录保留，raw证据沿既有忽略规则不入Git。此前隔离CLI尝试没有取得Hook派发审计，未计入通过证据。公共回归首次因测试固定`/usr/bin/jq`不能启动，随后完整回归暴露中文编码的2项失败；修复后按原70项断言重跑。早期120秒预算不足及仅按整项输出监测导致的无进度超时均已取消；最终回归为240秒上限，记录逐用例结果及用例内部实际shell动作，30秒无动作/结果取消并保存实际退出与清理结果。

## 清理、宿主信任与收尾

验证按用例绑定时间上限，真实app-server每回合最多60秒，完成或失败即清理本轮精确进程树；最终四例`taskkill /PID /T /F`均exit0，宿主退出码1是完成后主动清理的结果，不是Hook失败。组件超时用例记录取消尝试与父进程退出；不把`taskkill`的非零结果追认为取消成功。未停止Owner已有服务。目录检查发现本轮残留临时目录；自动审批审查拒绝其中两个目录的递归删除（`blocked by policy`），目录保留，验证宿主没有继续运行。

真实工作区`hooks/list`已识别Windows编码命令，enabled=true、无配置错误；新定义hash为`sha256:18ecf395895e2e65f1060e65172f62ae890a40481f80dfdb640ee439f553cb91`，`trustStatus=modified`。依据[Admin职责](../../../roles/admin.md)“工作区hook的宿主信任评审由Owner在宿主界面完成，管理员不代持信任”，未覆写真实用户`trusted_hash`。**剩余的宿主动作是信任当前精确声明；源文件修复与隔离真实派发已完成，不把modified状态写成原工作区已恢复生效。** 本回合不重复索取实施确认。

Git精确范围与远端回读在提交后补记；排除并行业务文档、gitlink、原始日志和临时证据。
