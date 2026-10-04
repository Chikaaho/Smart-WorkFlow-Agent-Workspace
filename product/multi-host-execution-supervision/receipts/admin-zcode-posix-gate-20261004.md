# 管理员回执：macOS 宿主 ZCode 门禁从未注册的取证与 POSIX 入口补齐（2026-10-04）

> 实施角色：管理员（Admin）
> 触发：Owner 报告执行会话 `sess_8f3eb49f-93bc-4b9b-8028-ed14db27729e`（p62 低代码事务BPM分层）在自定清单 6 项未完成时以"下一轮继续"收尾，未被拦截；同类问题在 ZCode 上反复发生。
> 结论：**本机（macOS）上 ZCode 门禁自 2026-09-18 有日志以来一次都没有运行过**——不是"hook 失效"，而是从未注册。已完成 POSIX 宿主入口补齐并在本机安装生效。

## 1. 取证结论（为什么一直没拦）

| # | 断点 | 证据 |
|---|---|---|
| 1 | **生效配置里零 hook，runner 未启动**。用户级 `~/.zcode/cli/config.json` 仅 38 字节 `{"hooks":{"events":{}}}`，无事件、无 `hooks.enabled:true`（配置文件型 hook 默认禁用）；工作区 `.zcode/config.json` 同为空 `events`。`bootstrap.app.startup.plugins.completed` 实测 `hookCount:0`（无插件贡献 hook，runner 不自动启用）。 | 两文件 mtime 均 2026-09-26 01:07:20 |
| 2 | **宿主零派发**。`~/.zcode/cli/log/zcode-*.jsonl`（09-28 起）与 `~/.zcode/v2/logs/*.log`（09-18 起）全部 104 种事件中无任何 `hook.run.*`；`zcode-stop-gate`/`zcode-role-bind`/`stop-gate.ps1`/`powershell.exe`/`codex-stop-adapter`/`session-role.ps1` 零命中；`user_prompt_hooks` 242 回合共 19ms、`session_start_hooks` 252 回合共 30ms（空转）。唯一 hook 相关事件是 `config.project_hooks.pending_trust` ×372。 | 事件名穷举统计 |
| 3 | **平台错配**。仓库声明（`.codex/governance/zcode-hooks-declaration.json`）为 Windows 专有（`C:\Windows\...\powershell.exe` + cmd 包装）；本机 darwin 25.3.0 arm64（`~/.zcode/v2/logs` 自 09-18 起全程 `platform=darwin-aarch64`），无 pwsh/powershell，`install-zcode-hooks.ps1` 本身也无法运行。既往取证/工单（2026-09-17/09-20）均为 Windows 机器（`E:\code\…`、`F:\soft\…`）产物，其结论在本机不成立。 | 本机 `/usr/bin/python3`、`/usr/bin/jq` 存在；Windows 侧被引用会话在本机宿主库均不存在 |
| 4 | **配置覆写源**。2026-09-26 01:07:08–20 应用日志序列 `hooks.loadHooks → plugin-management.* → hooks.saveHooks OK (15.1ms)`，两个配置文件 mtime 精确落在 01:07:20——宿主设置界面用自身（空）状态回写，覆写了机器级配置；同时把治理上早已要求移除的工作区 `hooks` 空块塞回 `.zcode/config.json`，此后每次配置加载都触发 `pending_trust`。`~/.zcode/security/` 不存在（工作区 hook 信任库从未在本机建立）。 | `~/.zcode/v2/logs/2026-09-26.log:8122-8128` |

事故会话核验：`sess_8f3eb49f` 回合 3 于 2026-10-03T17:17:52Z 完成（toolCallCount=90），39 秒后 Owner 发送 19 字提示词开启回合 4。观察读取器对该会话实测：todo `open=6`、上下文 49.3%、`last_assistant.has_marker=false`——门禁若在运行必然拦截（MARKER_MISSING + TODO_OPEN_ON_TERMINATION）。

## 2. 已实施

**2.1 POSIX/ZCode 宿主入口**（与 Windows 入口同责：只绑定身份、规范化载荷、调用同一公共 Validator、投影宿主 block、写脱敏审计；不承载终态规则）

| 文件 | 作用 |
|---|---|
| `.codex/governance/zcode_gate_common.py` | 载荷读取（stdin 15s 上限）、engine root 定位、会话键、审计/状态原子写、观察读取器解析（与 `zcode-gate-common.ps1` 同构；文件名用下划线以保证可导入） |
| `.codex/governance/zcode-role-bind.py` | `UserPromptSubmit` 入口：锚定模式归一化显式角色声明、宿主首提示词回填、注入【执行门禁】状态行（角色/上膛/上次拦截/清单/上下文/上回合终态检测），与 `session-role.ps1` 同语义同文案 |
| `.codex/governance/zcode-stop-gate.py` | `Stop` 入口：派发回执前移、终态行提取（唯一、物理末行）、调用 `validate-terminal.sh` 裁决、清单收敛与上下文声明核对、无进展三级升级、`{decision,reason}` 投影，与 `stop-gate.ps1` 同判序同文案 |
| `.codex/governance/install-zcode-hooks.sh` | POSIX 安装器：同步声明 `platforms.posix.hooks` 到用户级配置（保留其它键、写前备份、`-Check` 漂移 exit 3、校验 python3 可达） |
| `.codex/governance/hook-selfcheck.sh` | POSIX 自检：声明/平台块/入口文件/解释器/漂移/审计台账/派发回执/入口失败台账，`live` 要求 `drift=false` 且台账有真实记录 |
| `.codex/governance/test-zcode-gate.py` | 29 条接入契约测试（角色模式、绑定/回填/上膛判定、终态提取、Validator 调用、观察降级、fail-closed、派发回执、安装器漂移） |

**2.2 声明按平台分派**：`zcode-hooks-declaration.json` 顶层 `hooks` 块保持 Windows 原样（该机器不受影响）；新增 `platforms.posix.hooks`——`UserPromptSubmit` 与 `Stop` 均为 `type:"process"` argv 直启 `python3` 运行仓库内入口（macOS 实测 `/usr/bin/python3` 在 launchd 最窄 PATH 下可解析，`sqlite3` 可用），并带 `enabled:true`。

**2.3 体系同步**：`system.md` §0.8 宿主入口与声明安装器改为按平台表述，记录设置界面覆写机器级配置的实测事实；`roles/admin.md` §2/§4 治理文件清单收录新入口；`.zcode/config.json` 移除空 `hooks` 块（按 2026-09-18 既有决定，止住 `pending_trust` 循环）。

## 3. 验证

| 验证 | 命令 | 结果 |
|---|---|---|
| 新入口契约测试 | `python3 .codex/governance/test-zcode-gate.py` | `Ran 29 tests … OK` |
| 既有终态契约回归（POSIX） | `sh .codex/governance/test-terminal-contract.sh` | `cases=70 passed=70 failed=0` |
| 安装 | `sh .codex/governance/install-zcode-hooks.sh` | `installed`，备份 `~/.zcode/cli/config.json.bak-20261004014334` |
| 漂移复检 | `… install-zcode-hooks.sh -Check` | `in-sync`，exit 0 |
| 角色绑定演练 | 合成 UserPromptSubmit 载荷 | 状态行 `会话角色=executor \| 门禁=已上膛`，角色文件与审计落盘 |
| 事故同型演练 | 合成 Stop 载荷（90 工具调用、无终态行、清单 6 项未完成） | `{"decision":"block","reason":"执行会话不能结束：最后回复没有契约终态行；会话自定任务清单仍有 6 项未完成（…）…`，给出精确 `next_action` |
| 自检 | `sh .codex/governance/hook-selfcheck.sh` | `status=live`、`drift=false`、审计 2 条、派发回执 2 条 |

## 4. 边界与风险（如实保留）

1. **宿主真实派发未观测**：本回执的演练是入口级回放；宿主对用户级 hook 的实际派发要等下一次提示词/回合结束才能在审计台账看到。判据：下一回合提示词出现【执行门禁】状态行、或 `hook-selfcheck.sh` 审计出现宿主会话 ID。**若下回合未见状态行，重启 ZCode 使机器级配置重新加载**。
2. **设置界面覆写风险仍在**：宿主 `hooks.saveHooks` 曾用空状态覆写机器级配置（§1.4）。若再次发生，状态行会立即显示"未上膛（机器级声明缺失/漂移）"，运行 `sh .codex/governance/install-zcode-hooks.sh` 即修复。
3. **Windows 侧零改动**：顶层 `hooks` 块、`install-zcode-hooks.ps1`、`session-role.ps1`、`stop-gate.ps1` 均未触碰；Windows 机器行为与本批无关。
4. **每回合续行上限三次**是宿主硬上限，跨回合无上限自动续行仍依赖 Supervisor + `session/send`（provider 暴露问题未解，见 2026-09-16 能力矩阵），本批不改变该结论。
5. 自检 `entry_failures` 台账沿用 `runtime/zcode/entry-failures.log` 约定；POSIX 入口自身以 process 型直启，无 cmd 包装层，故无"两次失败写台账"逻辑，宿主派发失败由 `hook.run.failed` 日志与派发回执缺失暴露。

## 5. Git

独立批次提交于 `develop-sw`（仅治理文件，不含 p62 业务回执与子模块指针），推送后回读远端 SHA 见提交记录。

## 6. 追加修复：子仓库会话的 hook 几何（2026-10-04 深夜，安装当日实测）

**现象**：安装后宿主首次真实派发即成功（工作区根会话注入【执行门禁】状态行，`门禁=已上膛`），但一个项目根为子仓库 `Smart-WorkFlow-aPaaS-server` 的会话报 `hooks_prompt_block`：python 找不到 `…/Smart-WorkFlow-aPaaS-server/.codex/governance/zcode-role-bind.py`。

**原因**：用户级 hook 全机生效，`${ZCODE_PROJECT_DIR}` 按当前会话项目根展开——子仓库是独立 git 仓库，入口文件不在其中。Windows 声明用 `if exist` 守卫实现"非受治理工作区自动无操作"，POSIX 首版声明漏掉了该守卫。

**修复**：`platforms.posix` 两条入口改为 `process` 型直启 `/bin/sh -c` 守卫脚本——从 `${ZCODE_PROJECT_DIR}`（缺省回退 `PWD`）向上最多 16 级定位仓库内入口，找到才 `exec python3` 运行，找不到静默退出（exit 0）。守卫脚本刻意用 `${ZCODE_PROJECT_DIR:-$PWD}` 默认值语法：无论宿主做不做字符串内插，都能从宿主注入的环境变量取值。载荷 `cwd` 由入口自身向上解析 engine root，因此**子仓库会话仍落到工作区根治理**（门禁不缺位）。

**验证**（契约测试 31/31，终态回归 70/70；本机重装备份 `config.json.bak-20261004212754`）：

| 场景 | 结果 |
|---|---|
| 子仓库几何（本次报错场景，`ZCODE_PROJECT_DIR=子仓库`、载荷 `cwd=子仓库`） | 角色绑定成功，状态行 `会话角色=executor \| 门禁=已上膛`（engine root 解析到工作区根） |
| 同几何 Stop 门禁（33 工具调用、无终态行） | `block`，诊断与 `next_action` 正常 |
| 无关工作区（`ZCODE_PROJECT_DIR=$HOME`） | exit 0、stdout/stderr 全空，静默无操作 |
| 新增契约测试 | 守卫脚本在无入口目录无操作；向上定位后 exec 到入口 |
