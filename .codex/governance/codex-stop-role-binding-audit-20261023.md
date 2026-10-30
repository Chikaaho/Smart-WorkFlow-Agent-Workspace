# Codex Stop 角色绑定检查（2026-10-23）

检查范围：原生 Codex 的角色接入、公共 Validator 调用和拒绝后的自动续行提示。管理员仅处理治理实现。

## 现场与复现

- 现场会话从本工作区根目录启动；用户明确声明执行角色，并在后续提示中再次声明。
- 原始 Stop 审计时间为北京时间 2026-10-23 02:21:03，对应会话摘要 `efe4c9cc4c7634e1`。记录为 `phase=payload`、`decision=pass`、`reason_code=ROLE_NOT_EXECUTOR`。同一会话更早一次 Stop 也按该原因放行。
- Windows 适配器原先只读取自定义载荷字段或环境变量 `active_role`；原生 Stop 缺少这项自定义绑定时直接返回，没有进入公共 Validator。
- 将现场完整机器终态直接交给 `validate-terminal.ps1`，退出 1：`independent_work_exhausted: inconsistent with remaining actionable work`。现场声明独立工作尚未穷尽，工作项却只列两个完成批次，剩余可执行数为 0。
- 使用现场完整终态与已核实的 session/cwd/transcript 重建宿主载荷。修复前适配器退出 0 且输出为空；修复后同一载荷返回非空 `decision=block`，包含同一条 Validator 诊断。

## 当前行为

Windows/POSIX 适配器在没有启动角色绑定时调用 `codex-session-role.py`，从宿主指定的同一 transcript 读取用户明确角色声明。session ID 和两侧 cwd 必须与当前工作区对应；最近一次明确声明持续有效。代码块、显式引述、工作区说明、助手消息和终态角色字段不能建立绑定。身份不符、观察不可读或声明歧义时拒绝结束。

角色识别之后仍调用原有公共 Validator。Windows 审计记录有效角色及来源，并区分未绑定与已绑定的其他角色。公共门禁拒绝终态后，回注先要求处理诊断并继续授权内可执行工作，原终态的下一动作只用于核对。

宿主 hook 声明保持原样。未写入或变更用户的 hook 信任记录。

## 验证证据

- 角色与身份聚焦回归：`py -3 -X utf8 .codex/governance/test-codex-session-role.py`，15 项通过。
- Windows 完整适配器回归：`py -3 -X utf8 .codex/governance/test-codex-stop-adapter.py`，25 项通过，覆盖原生 Executor、Planner、Admin、错误 session、不可读 transcript、现场同类中间终态及原有传输失败路径。
- 现场重建载荷分别走 Windows 与 POSIX 入口回放，均返回 `block`；修正续行提示后再次回放，确认首先要求处理 Validator 拒绝原因。
- 公共契约与共享 Stop Gate：`sh .codex/governance/test-terminal-contract.sh`，70 项通过，0 失败。

原始审计位于 `.codex/governance/runtime/codex/audit.jsonl`；Validator 调用审计位于同目录 `validator.jsonl`。本次管理员直接回放也会写入适配器审计；检查当日的后续同会话摘要记录须结合调用来源区分，不能当作宿主真实派发的证明。Windows 回归详细输出保存在本机临时目录 `codex-stop-role-regression.json`，现场提示修正回放为 `codex-stop-incident-replay.json`。

## 能力边界

本次已证明现场错误能被接入 Validator 并拒绝。真实宿主在下一次 Stop 的派发与续行，应以届时审计和同线程行为为准；组件回放不替代该证明。未绑定兼容载荷仍不能用于宣称真实执行会话已完成校验。Validator 只能校验已声明的工作项，完整授权范围及真实依赖仍须由执行账本保留；本次没有自动识别全部业务剩余项，也没有改变业务状态。
