# 管理员回执：执行代理持续推进门禁

> 角色：管理员（Admin）
> 日期：2026-09-03
> 任务性质：Engine 治理实现增强，不进入业务功能闭环
> 基线：`e0711fb`（本地 HEAD，未提交、未推送）

## 1. 结果摘要

已在唯一终态契约 `agent-coding-engine.executor-terminal.v2` 上完成按行为触发的持续推进门禁：

- S/M 的 `TASK_COMPLETED` 保持原轻量终态格式；
- L/XL 的 `EXECUTION_SUBMITTED`、`TERMINAL_SYNC_SUBMITTED` 和各等级 `BLOCKED` 统一要求工作项、剩余 actionable 数、独立工作穷尽、下一动作、进展基础/指纹、工具结果和浏览器状态；
- Validator 根据“状态为 `PENDING/IN_PROGRESS`、已授权、依赖满足且 `actionable=true`”的工作项计算剩余动作；有剩余动作时拒绝提交或阻塞；
- `BLOCKED` 要求真实工具结果、非空失败详情、已尝试动作、解除条件、匹配的 `stop_reason`，并拒绝可操作浏览器会话、无真实工具拒绝的权限声明和无实际不可用结果的能力声明；运行时 Stop Hook 还要求 Harness 提供并匹配 `execution_observations`；
- `.claude/` 与 `.codex/` Hook 均定位同一公共 stop gate 和 supervisor 回注脚本，不按模型名称分支；
- 重复进展指纹先回注原子动作，达到重试阈值后回注 supervisor 重规划；Codex 宿主适配层将可执行回注投影为原生 `decision:block`/`reason`，并保留 Engine 的 `follow_up_prompt` 与 `supervisor.automatic=true`。

## 2. 实际修改文件

1. `.codex/governance/terminal-contract.json`：扩展唯一 v2 契约，加入 `work_items`、`remaining_actionable_count`、`independent_work_exhausted`、`next_action`、`next_action_type`、`progress_fingerprint`、`progress_basis`、`stop_reason`、`tool_results` 和 `browser_status`，并声明行为规则与 Hook 输入字段。
2. `.codex/governance/validate-terminal.sh`：增加嵌套字段校验、actionable 计数一致性、提交/阻塞门禁、工具结果、浏览器和阻塞原因校验。
3. `.codex/governance/validate-terminal.ps1`：保持 PowerShell Validator 与 POSIX Validator 的相同字段和行为规则。
4. `.codex/governance/stop-gate.sh`：双 Hook 共用的末行提取、公共 Validator 调用、进展护栏和 supervisor 接入。
5. `.codex/governance/supervisor-reinject.sh`：输出精确下一动作的 `REINJECT`/`REPLAN` 自动回注请求。
6. `.codex/governance/test-terminal-contract.sh`、`.codex/governance/test-terminal-contract.ps1`：更新合法终态夹具，增加 actionable 提交、独立工作未穷尽、浏览器可操作、权限假声明、进展护栏和 Hook 观测绑定覆盖。
7. `.codex/hooks/stop-execution-completeness.sh`、`.claude/hooks/stop-execution-completeness.sh`：收敛为公共 stop gate 的薄入口。
8. `.codex/hooks/codex-stop-adapter.sh`：绑定宿主显式 Executor 角色，并将 Engine 回注投影为 Codex 原生 Stop 响应字段。
9. `.codex/hooks.json`、`.claude/settings.json`：增加 Engine 根候选/祖先定位，支持 Engine 根、普通子目录及带独立 `.git` 的 cwd。
10. `system.md`、`roles/executor.md`：同步终态字段、浏览器认证、权限动作、持续执行、进展指纹、宿主适配和 supervisor 回注规则。
11. 本文件：管理员治理回执与验证证据。

未修改业务源码、业务测试、迁移、部署配置或任何 P58 内容；未执行 P58。

## 3. 治理决策

### 3.1 终态和兼容性

继续使用唯一 `agent-coding-engine.executor-terminal.v2` 与 `ENGINE_TERMINAL`，没有建立平行终态 schema。S/M `TASK_COMPLETED` 的既有字段分区保持不变；L/XL 终态改为必须携带行为上下文，以便机器验证合法交接和真实阻塞。

### 3.2 持续推进门禁

`remaining_actionable_count` 必须等于可执行工作项的实际计数，`independent_work_exhausted` 必须与计数为零一致。`EXECUTION_SUBMITTED` 与 `TERMINAL_SYNC_SUBMITTED` 只有在工作穷尽且 `next_action_type=WAIT_PLANNER` 时有效；`BLOCKED` 只有在工作穷尽、工具结果和阻塞字段完整时有效；进入运行时 Stop Hook 后，还必须有与终态一致的 Harness `execution_observations`。

### 3.3 浏览器和权限

`browser_status=OPERABLE` 时禁止任何 `BLOCKED`，因此页面、截图、DOM、网络或受支持会话仍可操作时必须继续执行。`PERMISSION_DENIED` 必须有 outcome 为 `DENIED` 的工具结果，`CAPABILITY_UNAVAILABLE` 必须有 outcome 为 `UNAVAILABLE` 的工具结果；自然语言声明不会单独形成权限证据。

### 3.4 无进展和 supervisor

`progress_basis` 记录文件变化、工具动作、新证据和关闭工作项，至少有一项；`progress_fingerprint` 由该行为基础标识。Hook 从 Harness 输入读取 `execution_observations` 和 `progress_guard`，逐项核对工具结果、浏览器状态与进展指纹，在缺失/不一致观测、重复指纹或明确无进展时拒绝伪 `BLOCKED`，调用公共 supervisor 返回原子动作或重规划动作。两套 Hook 的输出由同一脚本生成。

## 4. 原始验证命令与输出

以下命令均在工作区根 `/Users/chikan/.codex/worktrees/4428/Smart-WorkFlow` 执行。

### 4.1 语法、JSON、字段分区和回归

```text
$ sh -n .codex/governance/*.sh .codex/hooks/*.sh .claude/hooks/*.sh
$ /usr/bin/jq empty .codex/governance/terminal-contract.json .codex/hooks.json .claude/settings.json
$ git diff --check
$ sh .codex/governance/test-terminal-contract.sh
terminal-governance cases=53 passed=53 failed=0
```

契约状态字段分区检查无输出；公共脚本语法、JSON 和 diff whitespace 检查均 exit 0。

### 4.2 关键 Validator 行为

```text
$ printf '%s' "$valid_blocked" | sh .codex/governance/validate-terminal.sh 2>&1
exit=0 output=

$ printf '%s' "$actionable_submission" | sh .codex/governance/validate-terminal.sh 2>&1
exit=1 output=terminal: next_action: continue actionable work before submitting EXECUTION_SUBMITTED
terminal: next_action_type: EXECUTION_SUBMITTED requires WAIT_PLANNER when work is exhausted

$ printf '%s' "$browser_operable_block" | sh .codex/governance/validate-terminal.sh 2>&1
exit=1 output=terminal: browser_status: OPERABLE browser session remains; continue browser actions before blocking

$ printf '%s' "$permission_without_denial" | sh .codex/governance/validate-terminal.sh 2>&1
exit=1 output=terminal: tool_results: PERMISSION_DENIED requires an actual DENIED tool result
```

其中 `$valid_blocked` 包含用户秘密外部依赖、`REQUIRES_SECRET` 工具结果、零剩余 actionable 项和完整解除条件；其余输入分别覆盖中间提交、可操作浏览器和权限假声明。

### 4.3 Stop Hook 与 supervisor

```text
$ sh .codex/governance/test-terminal-contract.sh
terminal-governance cases=53 passed=53 failed=0

$ printf '%s' "$repeated_no_progress_input" | sh .codex/governance/stop-gate.sh
{"decision":"block","reason":"执行会话不能结束：progress: repeated fingerprint has no new file change, tool action, evidence, or closed work item; BLOCKED is not eligible","follow_up_prompt":"继续执行当前授权任务，不得结束回合。请先完成该原子动作：perform one new atomic action, then switch path if it fails again。当前诊断：执行会话不能结束：progress: repeated fingerprint has no new file change, tool action, evidence, or closed work item; BLOCKED is not eligible","supervisor":{"action":"reinject","mode":"REINJECT","attempt":1,"max_attempts":3,"next_action":"perform one new atomic action, then switch path if it fails again","automatic":true}}

$ printf '%s' '{"reason":"repeated failure","next_action":"switch path","attempt":2,"max_attempts":3}' | sh .codex/governance/supervisor-reinject.sh
{"decision":"block","reason":"repeated failure","follow_up_prompt":"监督器重规划：终态门禁仍未满足。请切换执行路径，先处理该原子动作：switch path。当前诊断：repeated failure","supervisor":{"action":"reinject","mode":"REPLAN","attempt":3,"max_attempts":3,"next_action":"switch path","automatic":true}}

$ printf '%s' "$missing_observations_input" | sh .codex/governance/stop-gate.sh
{"decision":"block","reason":"执行会话不能结束：observations: BLOCKED requires Harness execution_observations for tool results, browser status, and progress binding","follow_up_prompt":"继续执行当前授权任务，不得结束回合。请先完成该原子动作：continue through supported tools and record the Harness observation before evaluating a blocker。当前诊断：执行会话不能结束：observations: BLOCKED requires Harness execution_observations for tool results, browser status, and progress binding","supervisor":{"action":"reinject","mode":"REINJECT","attempt":1,"max_attempts":3,"next_action":"continue through supported tools and record the Harness observation before evaluating a blocker","automatic":true}}

$ printf '%s' "$mismatched_observations_input" | sh .codex/governance/stop-gate.sh
{"decision":"block","reason":"执行会话不能结束：observations: browser_status does not match the Harness observation","follow_up_prompt":"继续执行当前授权任务，不得结束回合。请先完成该原子动作：reconcile the browser observation and continue the supported session。当前诊断：执行会话不能结束：observations: browser_status does not match the Harness observation","supervisor":{"action":"reinject","mode":"REINJECT","attempt":1,"max_attempts":3,"next_action":"reconcile the browser observation and continue the supported session","automatic":true}}
```

在 `stop_hook_active=true` 的非法终态回归中，输出仍为 `decision:block` 并带自动回注字段，没有生成 `continue:false`。合法 `BLOCKED` 缺失观测和浏览器状态观测不一致两条 Hook 回归均拒绝并回注；匹配观测的合法 `BLOCKED` 才放行。模型字段差异测试结果为双 Hook 输出完全一致，运行时治理面扫描模型分支为 `0 matches`。

### 4.4 cwd 与独立 Git 回归

临时无业务语义夹具包含独立 Git 仓；从该仓 cwd 通过两份配置命令调用 Hook：

```text
configured-nested-valid-output=
configured-nested-invalid-output={"decision":"block","reason":"执行会话不能结束：terminal-message: marker: missing","follow_up_prompt":"继续执行当前授权任务，不得结束回合。请先完成该原子动作：完成诊断中指出的第一项原子动作。。当前诊断：执行会话不能结束：terminal-message: marker: missing","supervisor":{"action":"reinject","mode":"REINJECT","attempt":1,"max_attempts":3,"next_action":"完成诊断中指出的第一项原子动作。","automatic":true}}
configured-nested-git-hook=pass
```

双 Hook 包装器内容 `cmp` 一致；配置通过 Engine root 候选和祖先定位找到公共 stop gate。

## 5. 兼容性与范围核对

- S/M 合法 `TASK_COMPLETED`：通过；原有轻量字段约束未增加高等级上下文。
- L/XL 合法 `EXECUTION_SUBMITTED`、`TERMINAL_SYNC_SUBMITTED` 和真实外部 `BLOCKED`：通过新增行为上下文验证。
- 旧终态字段/状态分区、末行 marker、双 Hook 共享 Validator 语义：保留。
- POSIX 治理回归：从基线 43 用例扩展为 53 用例，53/53 通过。
- PowerShell Validator 与测试文件：已按同一契约同步；当前环境 `pwsh-absent`，未宣称 Windows 测试通过。
- 没有模型名称白名单、黑名单或专用分支；治理规则只读取结构化任务状态、授权、依赖、工具结果和进展护栏。
- 管理员未运行编译、业务测试、迁移、部署或真实业务动作；未提交 Git，未推送远端。

## 6. 宿主 Harness H1 端到端证据

原生 Codex Stop 输入没有 Engine 的 `active_role` 字段，因此新增 `.codex/hooks/codex-stop-adapter.sh`：只有宿主显式提供 `AGENT_CODING_ENGINE_ACTIVE_ROLE=executor` 时才注入 Executor 角色，随后调用既有公共 stop gate；输出给 Codex 宿主时只保留其支持的 `decision`/`reason`，其中 `reason` 使用可执行的自动续跑提示。

在隔离、只读、无业务语义的真实 Codex 任务中，以一次初始用户请求运行 `pwd`，宿主实际加载该适配链路。首个 Stop 事件的 `last_assistant_message` 为普通完成句，公共 Engine Hook 输出 `decision:block`；宿主未等待用户输入，自动开始同一 thread 的下一次模型采样。第二个 Stop 事件的 `stop_hook_active=true`，随后模型执行 `printf H1_CONTINUED` 并返回输出。该任务只发出一次初始请求，没有第二条用户消息或“继续”点击。

```text
$ AGENT_CODING_ENGINE_ACTIVE_ROLE=executor codex exec --json --cd /Users/chikan/Documents/Codex/h1-host-probe-20260903 --dangerously-bypass-hook-trust -c approval_policy='never' --sandbox read-only 'Run only the read-only command pwd now, then finish with a short ordinary sentence. Do not run any other command in this first response. If the host automatically starts a continuation, its next atomic action is to run printf H1_CONTINUED and report the output; do not run that command in this first response.'
{"type":"thread.started","thread_id":"01a065b6-fa66-7c62-943d-2c6e1fe5b3bc"}
{"type":"item.completed","item":{"type":"command_execution","command":"/bin/zsh -lc pwd","aggregated_output":"/Users/chikan/Documents/Codex/h1-host-probe-20260903\\n","exit_code":0}}
{"type":"item.completed","item":{"type":"agent_message","text":"我将先执行诊断要求的第一项原子动作。"}}
{"type":"item.completed","item":{"type":"command_execution","command":"/bin/zsh -lc 'printf H1_CONTINUED'","aggregated_output":"H1_CONTINUED","exit_code":0}}
{"type":"turn.completed"}
```

Hook 事件与宿主响应的原始摘要：

```text
$ wc -l /Users/chikan/Documents/Codex/h1-host-probe-20260903/.codex/h1-events.jsonl
       2 .../h1-events.jsonl
$ jq -c '{hook_event_name,stop_hook_active,last_assistant_message,cwd,turn_id}' .../h1-events.jsonl
{"hook_event_name":"Stop","stop_hook_active":false,"last_assistant_message":"The current directory is `/Users/chikan/Documents/Codex/h1-host-probe-20260903`."}
{"hook_event_name":"Stop","stop_hook_active":true,"last_assistant_message":"`printf H1_CONTINUED` 输出为 `H1_CONTINUED`。"}
$ jq -c '{decision,reason,continue}' .../h1-hook-outputs.jsonl
{"decision":"block","reason":"继续执行当前授权任务，不得结束回合。请先完成该原子动作：完成诊断中指出的第一项原子动作。。当前诊断：执行会话不能结束：terminal-message: marker: missing","continue":null}
{"decision":null,"reason":null,"continue":true}
```

验证结果：H1 已闭合；公共治理回归仍为 `53/53`，无 `continue:false`，未修改业务源码、业务测试、迁移或部署配置，未提交 Git，未推送远端。

## 7. Git 结果

```text
$ git status --short --branch
## HEAD (no branch)
 M .claude/hooks/stop-execution-completeness.sh
 M .claude/settings.json
 M .codex/governance/terminal-contract.json
 M .codex/governance/test-terminal-contract.ps1
 M .codex/governance/test-terminal-contract.sh
 M .codex/governance/validate-terminal.ps1
 M .codex/governance/validate-terminal.sh
 M .codex/hooks.json
?? .codex/hooks/codex-stop-adapter.sh
 M .codex/hooks/stop-execution-completeness.sh
 M roles/executor.md
 M system.md
?? .codex/governance/stop-gate.sh
?? .codex/governance/supervisor-reinject.sh
?? product/p51-agent-coding-engine-decoupling/receipts/completion-admin-execution-continuation-gates-20260903.md
```

本回合没有 `git commit`、`git push` 或远端状态改变；管理员治理回执已写入本文件供上级复核。
