# 工作区根治理一致性修复方向

> 下发角色：规划（Planner）
> 指定执行角色：管理员（Admin）
> 方向状态：READY
> 日期：2026-08-29
> 性质：Owner 已要求对只读审计发现实施治理修复
> 权威输入：`../receipts/receipt-admin-workspace-governance-consistency-audit-20260829.md` 与 `../receipts/planning-review-admin-workspace-governance-consistency-audit-20260829.md`

## 一、目标

修复管理员审计确认的根工作区治理冲突，使以下规则重新满足“单一权威、角色权限闭合、状态机可执行、不同 Harness 行为一致、入口引用当前有效”：

- 唯一行为宪法与三角色定义；
- Executor terminal 契约、Validator 与 Claude/Codex Hook；
- 三阶段状态机、product 生命周期与重复失败协议；
- 两端工程宪法中的授权、安全和资源硬约束；
- README、knowledge 参考文档与权威治理入口之间的职责边界；
- 章节、路径、索引和动态状态引用的当前性。

本方向授权 Admin 修复治理规则和 Governance Implementation，但不授权修改业务功能值、业务代码、业务测试、迁移或正式测试基线。

## 二、修复范围与目标结果

### A. 机器终态门禁：GOV-AUDIT-06～09

必须实现以下统一结果：

1. Claude/Codex Hook 只接受物理末行唯一一条、严格以 `SWF_TERMINAL ` 开头的 marker；marker 后有文本、零条或多条 marker 均拒绝；
2. Hook 只负责提取、位置/数量校验和 Harness 协议映射，JSON 字段语义全部交公共 Validator；
3. terminal contract 对每个 state 明确 required、allowed、forbidden 字段及允许的 `feature_status`；状态不适用字段必须拒绝；
4. `BLOCKED` 不得携带完成态语义，`EXECUTION_SUBMITTED` 不得混入阻塞专属字段；
5. Validator 对对象、数组、字符串、数字、布尔和 null 给出稳定、统一、非 jq 泄漏的诊断与退出码；
6. Claude/Codex 对首次非法终态、重试后的非法终态采用同一有限重试/停止语义，仅做字段映射差异；
7. 扩展治理契约测试，覆盖合法分支、状态专属字段、非对象、重复 marker、marker 非末行、双 Harness 同输入等价结果。

机器契约的合法 Executor states 不因本次修复随意扩张；如现有三个 state 足以表达当前协议，保持其名称不变。

### B. 权限表与状态机闭合：GOV-AUDIT-02～05

必须统一 `system.md` 与三份角色定义：

1. 重建 memory/search/product/todo 权限表，列结构固定、方向正确；`search_task` 为 Planner 写/Executor 读，`search_fallback` 为 Executor 写/Planner 读；
2. Planner 明确可读取并维护 `todo/`；
3. Executor 明确只在规划终态值清单或执行方向授权下写 `todo/requirement-pool.md`，并在阶段三按清单压缩 memory；
4. 删除 Planner Step 级审查、Step PASSED 更新和双回执旧协议；当前流程只保留 Executor 自主 Step 闭环 + 功能级 completion receipt + 追加补证；
5. `receipts/` 永远保存历史回执，只有方向文档流转到 `passed/`；
6. 解决 `PASSED` 与 knowledge-first 权限空洞时，不授予 Planner 读取或写入 knowledge：Planner 的 `PASSED` 裁决以 product 规划审查记录为权威，并可同步 memory 摘要；knowledge 当前值由后续已授权的 Executor 终态同步一次落为清单指定值。将“knowledge-first”限定为 Executor/持久状态同步内部顺序，不要求 Planner 越权写 knowledge；
7. Planner memory 冲突规则改为：发现冲突必须通过执行层核对 `knowledge/current-status.md`，最终按唯一权威修正摘要；压缩时允许重写当前摘要，历史进入 `knowledge/history/`。

不得为解决权限空洞而把 Admin 变成业务状态写入者，也不得让 Executor自行裁决 `PASSED`。

### C. 工程入口与硬约束：GOV-AUDIT-10～12

1. 删除前端工程宪法独立的 90% 澄清/执行授权门，只短引根角色门禁；
2. 前端 `superAdmin` 当前语义统一为角色 code 含 `superadmin`，删除当前正文中的 `userId==1` 规则；历史如需保留只链接历史决策；
3. `roles/executor.md`、两端工程宪法和仍保留命令的参考文档中，所有可复制 Maven/pnpm/npm/node 命令都必须带对应 2G 环境变量；重型命令前明确短引编译互斥检查；
4. 工程宪法只保留各仓“怎么干”的专属约束，不再定义会话授权、角色终态或根工作流。

### D. 单一来源与当前性：GOV-AUDIT-01、14～16及 GOV-AUDIT-13 的 Admin 部分

1. `README.md` 只保留项目介绍、快速开始和权威导航；移除会漂移的当前状态数字、完整角色权限、停止门禁和治理正文；
2. `knowledge/model-registry.md`、`knowledge/development-workflow.md`、`knowledge/shared-constraints.md` 删除角色、授权、terminal、回执生命周期的第二定义，只保留各自主题内容和精确权威链接；
3. `knowledge/governance-authority-matrix.md` 更新为当前文件职责，明确哪些参考文档不得复制治理正文；
4. `system.md` 删除易漂移模块完成度值，改为指向 `knowledge/current-status.md` / 功能清单；补全 todo 目录说明；
5. 修正审计 R-01～R-08、R-10～R-12 的失效路径、章节、数量快照和索引；删除不应固化的文件/功能计数，不用另一个易漂移数字替换；
6. `roles/planner.md` 的“8 项/9 项”等编号与实际列表一致；`roles/executor.md` 的 product 路径与当前 `ready/receipts/passed` 一致；
7. GOV-AUDIT-13 中 README 的第二状态源由 Admin 删除；但 `knowledge/current-status.md` 的业务状态、下一动作和目录值不得由 Admin 修改，必须在回执中保留为唯一待 Planner 下发的 Executor 机械同步项。

## 三、允许修改文件

仅允许在修复直接需要时修改以下治理/非业务文件：

- `system.md`；
- `roles/planner.md`、`roles/executor.md`、`roles/admin.md`；
- 根 `README.md`、`AGENTS.md`、`CLAUDE.md`（后两者仅在确有入口差异时）；
- `.codex/governance/terminal-contract.json`、Validator、治理契约测试；
- `.claude/hooks/`、`.codex/hooks/` 的终态 Hook 与对应非业务配置；
- 两端 `AGENTS.md` 和 `docs/governance/engineering-constitution.md`；
- `knowledge/governance-authority-matrix.md`、`knowledge/model-registry.md`、`knowledge/development-workflow.md`、`knowledge/shared-constraints.md`；
- 为本方向追加的管理员修复回执。

没有实际差异的允许文件不得为了“统一改一遍”而触碰。禁止修改 `knowledge/current-status.md`、`memory/`、`todo/`、业务功能追踪、业务清单和两端任何业务实现/测试/迁移。

## 四、禁止事项

- 不修改任何业务状态值、正式功能数、清单、P/I 编号、测试或迁移基线；
- 不读取或修改业务源码、业务测试、数据库迁移和业务配置；
- 不运行 Maven、pnpm、npm、Node、Java、数据库、服务、部署或浏览器；
- 不提交、不推送、不发布，不清理或回退用户现有工作区修改；
- 不把旧治理正文移动到另一个非权威文件继续保留为当前规则；
- 不新增第四种角色、自造 terminal state 或把 Admin/Planner 纳入 Executor terminal；
- 不顺手修复 GOV-AUDIT-13 的业务状态值。

## 五、验证要求

Admin 修复后必须执行并保存原始结果：

1. 所有修改 shell 脚本 `sh -n`；terminal contract JSON 解析；
2. 公共 terminal contract 全量测试，包含新增正反例；
3. Claude/Codex Hook 同输入矩阵，证明合法输入等价放行、非法输入等价拒绝/停止；
4. 根治理关键路径、Markdown 相对链接和章节引用存在性；
5. 全文残留检索：旧 90% 门、`userId==1` 当前规则、Step 双回执、`receipts → passed`、旧 product 路径、无 2G 的可复制重型命令、旧模块进度值、角色/terminal 第二定义正文；
6. 三角色读写闭合矩阵和状态机/terminal 对照矩阵重新计算；
7. 审计 GOV-AUDIT-01～16 逐项回归，其中 Admin 可修项必须为 `CLOSED`；GOV-AUDIT-13 只允许标记“Admin 部分关闭，业务状态同步待 Executor”，不得伪称全部关闭；
8. 三仓 Git 范围检查，证明只修改本方向允许文件。

## 六、回执要求

追加回执：

`product/workspace-governance-consistency-audit/receipts/receipt-admin-workspace-governance-remediation-20260829.md`

回执必须包含：

- 修改前后权威关系摘要；
- 实际修改文件及每个文件对应关闭的问题编号；
- GOV-AUDIT-01～16 关闭矩阵；
- terminal/Hook 正反例原始结果和计数；
- 权限闭合、状态机和引用残留检查；
- 未修改业务值、未运行业务命令、未提交推送的证明；
- GOV-AUDIT-13 剩余 Executor 机械同步所需的精确差异，供 Planner 下发，不得自行处理；
- 是否仍存在 HIGH/MEDIUM 治理问题的明确结论。

Admin 不追加或自造 `SWF_TERMINAL`；按管理员角色提交普通治理回执。

## 七、验收标准

- **PASSED**：所有 Admin 可修的 HIGH/MEDIUM 问题关闭；terminal/Hook 全部新增正反例通过；角色权限与状态机闭合；第二定义源和过期引用清理；仅 GOV-AUDIT-13 的业务状态机械同步可作为明确的非 Admin 剩余项；
- **VERIFYING**：修复已实施但任一问题缺少实际回归证据；
- **BLOCKED**：某项修复需要 Owner 改变核心治理语义或需要越过 Admin 权限，必须列出唯一冲突，不得自行选择；
- 发现无法安全修复的规则时保持原文并报告，不得用近似措辞掩盖冲突。

本方向通过只表示 Admin 治理修复完成；GOV-AUDIT-13 的业务状态同步仍需规划另行下发 Executor 机械同步并复核后，才能宣告本轮治理一致性整体闭环。

