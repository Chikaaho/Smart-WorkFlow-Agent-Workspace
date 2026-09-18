# ZCode hook 门禁失效取证与接入实施回执（2026-09-17）

> 实施角色：管理员（Admin）
> 触发：Owner 报告近期不下 20 次“中间态汇报 / 自定任务清单未完成就结束 / 不输出机器契约 / 以‘坦诚未完成’结束”未被 hook 拦截
> 结论：**这些回合从未经过任何门禁**——ZCode 宿主里根本没有注册 Stop hook。已定位三处独立断点并完成接入实施与验证；工作区 hook 的宿主信任评审需 Owner 在界面完成，之后才真正生效。

## 1. 取证结论（为什么 20+ 次都没被拦截）

| # | 断点 | 证据 |
|---|---|---|
| 1 | **ZCode 宿主零注册**。ZCode 只从 `~/.zcode/cli/config.json`（用户级）与 `<repo>/.zcode/config.json`（项目级，兼容 `<repo>/zcode.json`）读取 hooks；本工作区 `.zcode/config.json` 当时只有 `mcp.servers`，用户级配置同样没有 `hooks` 段。`.codex/hooks.json` 只服务 Codex CLI，`.claude/settings.json` 只服务 Claude Code。 | `grep -c stop-gate.sh ~/.zcode/v2/logs/*.log ~/.zcode/cli/log/*.jsonl` 全为 0；`hookInvocation`、`workspace_hook.*`、`workspace_hooks_*` 在所有日志中零命中；`~/.zcode/security/` 不存在（工作区 hook 信任库从未建立）。ZCode 0.16.5 运行时的配置默认值即 `hooks.enabled=false`。 |
| 2 | **角色绑定在 ZCode 永远不可能满足**。`stop-gate.sh` 第 11 行要求 `active_role == "executor"` 才启用门禁，而角色来自 hook 载荷字段；ZCode 运行时里 `active_role` 出现 0 次（`grep -c active_role zcode.cjs` → 0），其 Stop 载荷字段为 `agentName/cwd/session_id/toolCallCount/stop_hook_active/responseText/last_assistant_message/transcript_path/mode/traceId/turnId`。回退变量 `AGENT_CODING_ENGINE_ACTIVE_ROLE` 只由受治理 Codex 启动入口设置，Desktop 会话不会设置。即使注册了 hook，也会在第一行静默 `exit 0`。 | ZCode 运行时 bundle `F:\soft\zcode\resources\glm\zcode.cjs` 的 Stop 事件构造与 `active_role` 计数。 |
| 3 | **本机没有 jq，POSIX 门禁静默放行**。`stop-gate.sh`、`validate-terminal.sh`、`supervisor-turn-ended.sh`、`supervisor-reinject.sh`、`codex-stop-adapter.sh` 全部硬编码 `/usr/bin/jq`，而每次调用都用 `\|\| printf ''` 兜底。本机 `/usr/bin/jq` 不存在（PATH 上也没有，`find ~ -name jq.exe` 无结果）→ 角色读取为空 → `exit 0`。2026-09-16 的实施回执已记录“Git Bash 缺少 `/usr/bin/jq`”，但当时按测试环境问题处理，脚本里的 fail-open 一直保留。 | `ls /usr/bin/jq` → 不存在；实测 `echo '{"active_role":"executor"}' \| sh .codex/governance/stop-gate.sh` 在补丁前无输出、exit 0。 |

补充事实：ZCode Stop 载荷不含 `background_tasks`、`progress_guard`、`execution_observations`，因此旧门禁里的“后台任务未回收”“BLOCKED 观察核对”“进展指纹重复”分支在 ZCode 永远不成立（计数恒为 0，观察恒缺失）。唯一有牙齿的链路（Supervisor + `session/send` 跨回合回注）仍被 `session/send=-32031`（新 app-server 无可用 provider）阻塞，见 2026-09-16 回执。

真实样本（宿主持久库只读读取，非模型自述）：P53 执行会话 `sess_4d365493-6143-44fc-85e0-4645fa871470` 的自定清单为 `completed=5 / in_progress=1 / pending=3`，即该会话在 4 项未完成时结束——正是 Owner 描述的第二类问题。

## 2. 已实施

**2.1 新增 ZCode 宿主入口（规则不复制，调用同一公共 Validator）**

| 文件 | 作用 |
|---|---|
| `.codex/governance/stop-gate.ps1` | ZCode Stop 门禁入口：会话角色绑定、终态 marker 提取（唯一、物理末行）、调用 `validate-terminal.ps1` 裁决、宿主观察核对、把裁决投影为 ZCode 支持的 `{"decision":"block","reason":...}`、脱敏审计与无进展升级（原子动作→切换路径→重规划） |
| `.codex/governance/session-role.ps1` | `UserPromptSubmit` 入口：按 system.md §0.2 的锚定模式归一化用户提示词里的显式角色声明，写入会话角色记录；未声明执行角色的会话不启用门禁 |
| `.codex/governance/zcode-gate-common.ps1` | 宿主接入公共辅助：载荷读取（含 15s 上限，避免挂死）、engine root 定位、会话键、审计与状态读写 |
| `.codex/governance/session-observation.py` | 只读宿主观察读取器：从会话库 `todo` 表读取自定任务清单未完成项（`mode=ro`，允许读 WAL；失败降级为 `available=false`） |
| `.codex/governance/hook-selfcheck.ps1` | 自检：声明、入口文件、观察读取器、信任库、审计台账与已绑定会话 |
| `.codex/governance/test-stop-gate.ps1` | 26 条接入契约测试（见 §3） |

门禁判定顺序：角色不是 `executor` → 不介入；回合无工具动作且自定清单已收敛 → 视为非执行回合放行；否则要求唯一物理末行终态契约并通过公共 Validator；契约成立但自定清单仍有未完成项 → 拒绝；拒绝时把诊断与**精确 `next_action`** 合并为 reason 回注。

**2.2 宿主声明**（`.zcode/config.json`，工作区级）

`hooks.enabled: true` + `UserPromptSubmit` → `session-role.ps1` + `Stop` → `stop-gate.ps1`，均为 `type: "process"`（argv 直启 `powershell.exe`，不依赖 shell、PATH 里的 jq 或 Git Bash）。声明只固定入口路径，规则改动不需要改声明。

**2.3 修复 POSIX 路径 fail-open**

上述 5 个 shell 脚本改为解析可用 jq（`AGENT_CODING_ENGINE_JQ` → PATH → `/usr/bin/jq` → `/usr/local/bin/jq` → `/opt/homebrew/bin/jq`）；解析不到时，已声明受治理身份（`AGENT_CODING_ENGINE_ACTIVE_ROLE=executor` / task / thread）或 `GATE_REQUIRE_JQ=1` 的会话**显式输出“门禁无法裁决”的 block 并自动回注**，普通会话仍静默退出。`validate-terminal.sh` 在无 jq 时以诊断 + exit 1 拒绝，而不是放行。

## 3. 验证

| 验证 | 命令 | 结果 |
|---|---|---|
| 接入契约测试 | `powershell -File .codex/governance/test-stop-gate.ps1` | `stop-gate-windows cases=26 passed=26 failed=0` |
| 终态契约回归 | `powershell -File .codex/governance/test-terminal-contract.ps1` | `terminal-governance-windows cases=49 passed=49 failed=0` |
| 宿主真实 spawn 路径（argv + 环境覆盖 + stdin 载荷） | node 复现宿主 `mode:"argv"` 启动 | `powershell.exe` 直接解析成功；管理员会话无输出；执行会话输出 `{"decision":"block","reason":...}` 且键恰为 `decision,reason` |
| 输出编码（宿主按 UTF-8 解码） | 字节级严格 UTF-8 解码断言 | 通过（修复前 PowerShell 5.1 按 OEM 代码页输出，中文 reason 会乱码） |
| 真实清单观察链路 | 临时会话库 + 真实读取器 | 终态成立但清单有 2 项未完成 → `{"decision":"block","reason":"...自定任务清单仍有 2 项未完成（in_progress：EV-02b…）..."}` |
| 真实会话库只读读取 | `session-observation.py --session-id sess_4d365493-…` | 返回 `open=4`，未修改宿主数据 |
| POSIX fail-closed | `AGENT_CODING_ENGINE_ACTIVE_ROLE=executor sh stop-gate.sh`（无 jq） | 输出“门禁无法裁决”block；无身份时静默退出；`validate-terminal.sh` 无 jq 时 exit 1 |

覆盖的拦截类别：中间态汇报（无终态行）、多终态行/非末行、终态 JSON 非法、契约字段被 Validator 拒绝（含 L/XL 仍有 actionable 项）、**自定清单未收敛**、零工具回合但清单未收敛、无进展重复（三级升级）、载荷非法 fail closed、管理员/规划/未声明角色不介入、UTF-8 输出。

## 4. 未通过与开放风险

1. **工作区 hook 信任评审未完成（Owner 动作）**：ZCode 对工作区 hook 有一次性信任评审（`workspace-hook-trust-v1.json`，按声明摘要授权）。在 Owner 于宿主界面批准前，hook 处于 `pending_trust`、不会执行。管理员不能代持信任。判断是否生效用 `.codex/governance/hook-selfcheck.ps1`：`live=true` 且审计台账出现记录即为生效；配置在、台账空即说明未获信任或未派发。若本版本界面没有提供工作区 hook 信任评审，备选是把同一声明放到用户级 `~/.zcode/cli/config.json`（用户级配置 hook 不受工作区信任层约束，但声明就离开仓库、需要在每台机器上单独维护）。
2. **每回合续行上限三次**：ZCode 对 Stop 续行有硬上限（`stopHookContinuationCount < 3`）。达到上限后回合仍会结束；跨回合无上限自动续行仍依赖 Supervisor + `session/send`，该链路仍被 provider 缺口阻塞。因此本回执不宣称“跨回合自动续行”已闭环。
3. **清单观察依赖 Python 读取器**：读取器不可用（无 Python / 库不可读）时该检查降级，契约校验仍生效；审计以 `observation=<原因>` 保留降级事实。读取器只读 `todo` 表，若宿主改表结构会降级而非误判。
4. **零工具回合的适用边界**：无工具动作且自定清单已收敛的回合视为非执行回合，不强制终态契约（避免纯问答回合被强推终态）；清单未收敛时同样纳入门禁。
5. **未回归的宿主面**：`.codex/hooks.json`（Codex CLI）与 `.claude/settings.json`（Claude Code）的声明未在真实会话中回归；POSIX 入口本机无 jq，只能验证 fail-closed 行为。
6. **本次未做**：没有修改任何业务仓库代码，没有写入 `knowledge/`、`memory/` 或功能终态，没有提交。

## 4.1 追加取证与修复（2026-09-18）

Owner 报告“明显清单 10 几项只完成了两项还是结束了”，追加取证结论：

1. **门禁确实运行过并被信任**：`~/.zcode/security/workspace-hook-trust-v1.json` 有 2 条记录（两条 hook 均已批准），审计台账有角色绑定与一次 `block`（`MARKER_MISSING`，tool_call_count=454，todo_open=10，2026-09-17T18:31:40Z）。
2. **门禁在关键时刻静默失效**：宿主运行时日志 `~/.zcode/cli/log/zcode-*.jsonl` 记录 `hook.run.failed`（`module=core.hooks`，`source=project.workspace-hook-0-Stop-0-0`）多次，时长 150–250ms；对照 Windows PowerShell 事件日志，失败时刻**没有任何 PowerShell 进程启动**（成功时刻有完整 600/400/403 序列）。结论：失败发生在宿主命令解析/派生阶段，运行时按非阻塞处理，等价于门禁缺失 → 回合直接结束。
3. **可复现性**：用会话库中该条消息原文与 `turn_usage` 工具计数回放，门禁本身稳定给出正确 block（本地连续 10 次调用 10/10 通过），失败与载荷无关，只与环境派生有关（宿主按 PATH 解析 `powershell.exe`）。

对应修复：

- 声明改用绝对路径 `C:\Windows\System32\WindowsPowerShell\v1.0\powershell.exe`，消除 PATH 解析依赖（**声明变化会使信任失效，需 Owner 在界面重新评审一次**）。
- 门禁增加 `trap`：任何未捕获异常都以 exit 2 + 诊断 fail closed，并写审计 `decision=error`（此前异常会退化为 hook 失败 → 静默放行）。角色绑定入口同样记录 `ROLE_BIND_INTERNAL_ERROR`（不阻断提示词）。
- `hook-selfcheck.ps1` 增加宿主派发失败台账：扫描运行时日志的近两次 `hook.run.failed`，报告事件、来源、会话、时长与近 24 小时计数；`live` 判定要求近 24 小时零失败。

### 4.2 “上下文已满”类无证据收尾（2026-09-18）

Owner 报告模型偶发自称上下文耗尽并拒绝继续，实测窗口占用约 58%，且宿主具备自动压缩。宿主数据（只读）：最近一条 assistant 消息 `tokens.total=584256`、`modelId=GLM-5.3-Flash`、provider 配置 `limit.context=1000000` → 实测 58.4%；`turn_usage.context_exceeded=0`，即宿主从未报告上下文超限。

对应实现：

- `session-observation.py` 增加 `context` 观察：`tokens`、`limit`、`percent`、`model`、`context_exceeded`，全部来自宿主库与 provider 配置，不读模型自述。
- Stop Gate 新增 `CONTEXT_CLAIM_UNSUPPORTED`：**任何**以上下文/窗口为由的收尾都被拒绝并回注宿主实测数值与清单缺口（不设占用率门槛——压缩是宿主职责，接近上限自动压缩、provider 溢出时自动 compact 并重试请求）。该规则同时把无工具动作的此类回合纳入门禁范围。唯一的例外是被公共 Validator 接受、且携带真实工具证据的 `BLOCKED` 终态。
- 回注改为一次给全所有证据（上下文实测、终态契约诊断、清单未收敛项），避免模型分多轮试错。

## 4.3 追加取证与修复（2026-09-18 21:53 事件）

Owner 报告执行会话再次以上下文为由收尾（实测 49.6%）。取证结论：

1. **门禁已按新声明获得信任并在运行**：信任库 4 条记录（含 04:15Z 两条绝对路径声明），审计台账有该会话的角色绑定与一次真实拦截（`sess_d6033e49`，2026-09-18T13:26:23Z，`MARKER_MISSING`，tool_call_count=339，todo_open=9，context_percent=44.2，escalation=0）。
2. **失败发生在宿主派发层，且绝对路径未解决**：运行时日志记录该会话 13:53:57（Stop）与 13:54:47（UserPromptSubmit）两次 `hook.run.failed`，时长 171ms/160ms；近 24 小时累计 9 次。对照 Windows PowerShell 事件日志，失败时刻没有完整引擎启动序列，且时长与"进程创建后在引擎初始化前被终止"一致。宿主按非阻塞处理失败，等价于该次门禁不存在。
3. **模型行为**：该会话在被拦一次后继续工作约 27 分钟，随后仍以"本轮上下文已达物理极限"收尾，恰好落在派发失败的那一次 Stop 上，因此未被拦下。

对应修复（本轮）：

- **宿主入口改为 command 通道 + 兜底包装**：新增 `.codex/hooks/zcode-stop-gate.cmd` 与 `.codex/hooks/zcode-role-bind.cmd`，声明改为 `type: "command"`（走宿主对普通 shell 命令的稳定通道）。包装层：捕获 PowerShell stdout 到临时文件、仅在退出码 0/2 时回显（缺失脚本时的错误横幅不会污染宿主可见 stdout）、失败重试一次、两次失败写入口失败台账并输出 fail-closed 结论。三条路径已用宿主式 spawn（Node `shell: true`）逐条验证：正常 block、缺失脚本兜底 block、载荷非法 exit 2 传播。
- **入口失败可见化**：`hook-selfcheck.ps1` 新增入口失败台账（`.codex/governance/runtime/zcode/entry-failures.log`）与近 24 小时宿主派发失败计数，`live` 要求两者均为零；`command_ok` 校验改为匹配 cmd 入口。
- **观察读取器修正**：跳过 token 为 0 的占位 assistant 消息，避免把 `0.0%` 当作实测值回注。
- **测试**：门禁用例 35/35（新增包装层正常/兜底两条），终态契约回归 49/49。

## 4.4 信任层反复失效与声明迁移到用户级（2026-09-18 22:40 事件）

Owner 报告执行会话"什么理由都没有就中途停止"。取证结论：

1. **信任批过又被宿主自己撤销**：信任库在 14:30:04/14:30:05 记下两条 `.cmd` 声明的授权，但运行时日志在 **14:37:58 再次输出两条 `config.project_hooks.pending_trust`**（`configPath=E:\code\Smart-WorkFlow-Agent-Workspace\.zcode\config.json`，`diagnosticMessage=Project hooks are pending workspace trust and remain blocked`）。此时声明文件与入口脚本均未再改动，即工作区信任层会在批准后自行回到待信任状态并**静默禁用**两条 hook。
2. **静默停止正好落在这个窗口**：该次会话停止发生在 14:40Z 前后，门禁当时处于"被宿主禁用"状态，因此既没有拦截、也没有给出理由。

对应修复（本轮）：

- **声明迁移到用户级** `~/.zcode/cli/config.json`（该层不受工作区信任层约束），命令形式为
  `if exist "${ZCODE_PROJECT_DIR}\.codex\hooks\zcode-stop-gate.cmd" "${ZCODE_PROJECT_DIR}\.codex\hooks\zcode-stop-gate.cmd"`，
  非受治理工作区自动无操作，不再需要任何信任评审，也不再出现"批准后失效"。
- `.zcode/config.json` 只保留 `mcp`（移除 hooks 段），避免继续触发工作区评审流程。
- `hook-selfcheck.ps1` 声明检查改为用户级优先并报告 `scope`；`command_ok` 接受 cmd 入口命令。
- 验证（宿主式 shell spawn）：受治理工作区 → 正确输出 block；其它工作区 → 静默无操作（无噪音、无副作用）。门禁用例 35/35，终态契约回归 49/49。

影响与边界：声明不再随仓库版本化（属于机器级工程配置，符合管理员职责范围），仓库内仍是唯一规则与实现来源；换机器时需要在新机器上补一次用户级声明（内容即上表命令）。

## 4.5 声明入库与安装器（2026-09-18，按 Owner 要求可跟踪）

Owner 要求配置必须入库、可跟踪。本轮把声明做成"仓库唯一来源 + 机器级生效副本"：

- **仓库来源**：`.codex/governance/zcode-hooks-declaration.json`（带 `schema`、来源说明与两条 cmd 入口声明，随仓库版本化、可评审、可复制到新机器）。
- **安装器**：`.codex/governance/install-zcode-hooks.ps1`
  - 默认：读取仓库声明，写入用户级 `~/.zcode/cli/config.json` 的 `hooks` 段（保留其它键），写入前自动备份 `config.json.bak-<ts>`；
  - `-Check`：只报漂移，漂移时 exit 3（便于自检与自动化）；
  - 输出 JSON 摘要（`status`/`effective_scope`/`user_config`/`drift`/`applied`/`backup`）。
- **自检**：`hook-selfcheck.ps1` 声明段改为"仓库来源 + 安装器漂移检查"，报告 `source`/`present`/`command_ok`/`events`/`effective_scope`/`user_config`/`drift`；`live` 同时要求 `drift=false`。
- **验证**：注入漂移（删除 Stop 声明）→ `-Check` 报 `drift: true`、exit 3；修复安装 → `applied: true` 且生成备份；复检 `in-sync`、exit 0；用户配置其它键（mcp servers）保持不变。

已知边界：生效副本在机器级，换机器需执行一次 `install-zcode-hooks.ps1`（这一步已写入管理员角色定义的维护范围）；工作区级声明继续留空，避免与用户级声明重复触发。

## 5. 后续（待 Owner 决定）

- 本轮声明改为 `.codex/hooks/*.cmd` cmd 入口（第三次也是最后一次声明变更）：请在 ZCode 界面重新评审一次（`Stop` 与 `UserPromptSubmit` 两条），然后用 `hook-selfcheck.ps1` 确认 `live=true`、`host_hook_failures.recent_count=0` 且 `entry_failures.present=false`。
- 若 `.cmd` 入口仍然出现宿主派发失败，说明失败与命令形态无关（宿主进程侧资源/终止行为），届时需要在宿主外 Supervisor + `session/send` 回注链路上补齐跨回合强制续行。
- 若要恢复跨回合无上限自动续行，需要按 2026-09-16 能力矩阵的最小条件解决 ZCode provider 暴露问题；否则门禁能力上限就是“每回合三次自动续行 + 每次用户回合重新收口”。
