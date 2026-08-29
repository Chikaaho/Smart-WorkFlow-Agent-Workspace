# 工作区根治理一致性审计回执

> 执行角色：管理员（Admin）
> 审计方向：`product/workspace-governance-consistency-audit/ready/direction-admin-workspace-governance-consistency-audit.md`
> 日期：2026-08-29
> 任务性质：只读治理审计；本回执是本轮唯一新增文件
> 审计交付自检：**PASSED（范围与证据完整，待 Owner/下发方复核）**
> 治理一致性结论：**不通过**；发现 `12 HIGH / 4 MEDIUM / 0 LOW / 0 BLOCKER`

## 1. 结论先行

1. `system.md` 仍是**声明上的**唯一行为宪法入口，根/两端 `AGENTS.md` 与根 `CLAUDE.md` 均正确路由到它；但当前并非“只有一个实际治理定义源”。`README.md`、`knowledge/model-registry.md`、`knowledge/development-workflow.md`、`knowledge/shared-constraints.md` 和前端工程宪法仍保留完整或局部的角色、授权、回执、终态与命令正文，其中已有实际冲突。
2. 三角色权限清单未闭合：`search_task/` 表格写反，`memory/` 表格错列；Planner 对 `todo/` 有写无读；Executor 被要求同步 `todo/requirement-pool.md`，却没有明确写权限；`PASSED` 中间态没有角色能在同时遵守“knowledge 先写”和现有权限的前提下落盘。
3. 三阶段主路径的意图可辨识，但 Planner 的 Step 级审查旧条款、Step 级双回执旧条款和 `receipts → passed` 旧流转仍与功能级最终验收冲突。
4. Executor terminal 与功能状态在命名上已经分离，11 个既有契约用例通过；但两套 Hook 都接受“marker 后仍有文本”和“重复 marker”，Validator 还接受状态不适用字段，Claude/Codex 对重试后的非法终态给出不同控制结果。
5. 重复失败收敛规则在 `system.md`、`roles/planner.md`、`roles/executor.md` 三个权威位置采用相同核心口径：同一缺口/同类型问题连续 `>=2` 次失败后启动一级提示，继续失败则二级、三级零裁量收紧；本项未发现触发次数或责任边界冲突。
6. 根 README 的数字与当前权威文件大部分相同，但把审计写成 `COMPLETED（已确认）`；`knowledge/current-status.md` 仍写“待规划终态复核”并引用已不存在的 `ready/` 路径，而实际终态同步方向已在 `passed/`。当前状态、下一动作和目录事实无法同时成立。
7. 需要 Owner 另行下发管理员修复任务。建议先修机器门禁与权限/状态机空洞，再清理镜像正文、旧确认门和失效引用；本轮未实施任何修复。

## 2. 实际读取范围与边界

### 2.1 完整读取

- `system.md`
- `roles/planner.md`
- `roles/executor.md`
- `roles/admin.md`
- 根 `AGENTS.md`、`CLAUDE.md`、`README.md`
- 根 `.claude/settings.json`
- 根 `.codex/config.toml`、`.codex/hooks.json`
- `.codex/governance/terminal-contract.json`
- `.codex/governance/validate-terminal.sh`
- `.codex/governance/test-terminal-contract.sh`
- `.claude/hooks/stop-execution-completeness.sh`
- `.codex/hooks/stop-execution-completeness.sh`
- `Smart-WorkFlow/AGENTS.md`
- `Smart-WorkFlow-Web/AGENTS.md`
- `Smart-WorkFlow/docs/governance/engineering-constitution.md`
- `Smart-WorkFlow-Web/docs/governance/engineering-constitution.md`
- `knowledge/governance-authority-matrix.md`
- `knowledge/model-registry.md`
- `knowledge/development-workflow.md`
- `knowledge/current-status.md`
- 本审计方向文档

### 2.2 定向读取/静态核对

- `knowledge/shared-constraints.md` §2.4、§9、§9.1、§10：仅核对回执、角色边界、2G/互斥、终态和信息分层镜像。
- `memory/state.md`、`memory/handoff.md`：仅检索当前同步点、状态、基线和唯一下一动作；未改动。
- `product/minimal-closure-first-acceptance/`：仅列举方向所在目录，未读取业务证据内容。
- 三仓 Git 元数据：仅执行 `git status --short`。
- 文件存在性、Markdown 文件数量和关键引用：只做 `rg --files`、`rg`、`wc`、`find` 静态检查。

### 2.3 明确未进入

- 未读取或修改 Java、Vue、TypeScript、测试源码、数据库迁移/种子、业务脚本实现。
- 未运行 Maven、pnpm、npm、Java、Node、数据库、服务、部署或浏览器命令。
- 未作业务验收、功能状态裁决、计数变更、P/I 编号变更或正式基线变更。
- `.claude/plans/async-stirring-music.md` 不被任何当前入口/Hook 配置加载，且不是本方向指定的治理实现，未读取。

## 3. 只读检查命令、退出码与原始结果摘要

| # | 命令/检查 | 退出码 | 原始结果摘要 |
|---:|---|---:|---|
| 1 | `git status --short`（根仓） | 0 | 审计开始前已有 `M memory/handoff.md`、`M memory/state.md`、`?? product/workspace-governance-consistency-audit/`；均视为用户/上游现有内容。 |
| 2 | 两端 `git status --short` | 0 | 后端、前端均无输出。 |
| 3 | `wc -l` + 分段/全文读取核心文件 | 0 | `system.md` 563 行；Planner 443 行；Executor 440 行；Admin 121 行；后端工程宪法 395 行；前端工程宪法 438 行。 |
| 4 | `rg --files .claude .codex` | 0 | 识别 9 个根 Harness/Governance/plan 文件；治理相关文件均已读取，非治理 plan 排除。 |
| 5 | `/usr/bin/jq -e . terminal-contract.json` | 0 | 契约 JSON 可解析。 |
| 6 | 对 Validator、契约测试和两套 Hook 执行 `sh -n` | 0 | 4 个脚本语法检查全部通过。 |
| 7 | `sh .codex/governance/test-terminal-contract.sh` | 0 | `terminal-contract cases=11 passed=11 failed=0`。 |
| 8 | Validator 构造：`BLOCKED + feature_status=COMPLETED` | 0 | 无诊断，非法/矛盾组合被接受。 |
| 9 | Validator 构造：`EXECUTION_SUBMITTED + block_type/attempted/release_condition` | 0 | 无诊断，状态不适用字段被接受。 |
| 10 | 两套 Hook 构造：合法 marker 后追加普通文本 | 0 | Claude/Codex 均无输出并放行。 |
| 11 | 两套 Hook 构造：首个 marker 合法、第二个 marker 非法 | 0 | Claude/Codex 均无输出并放行。 |
| 12 | 非对象 payload：`[]` / `null` / `"text"` | 5 / 2 / 5 | 数组/字符串泄漏原始 jq `Cannot check whether ... has a string key`；合法 JSON `null` 被报告为 `invalid JSON`。 |
| 13 | Hook 构造：非法终态且 `stop_hook_active=true` | 0 | Claude 输出 `continue:false`/“已停止自动续跑”；Codex 输出 `decision:block`。 |
| 14 | 23 个关键治理路径存在性检查 | 0 | `checked=23 missing=0`。 |
| 15 | `find product -type d -name done` | 0 | `deprecated_done_dirs=0`。 |
| 16 | 历史 `step-0-*` 文件计数 | 0 | `historical_step0_files=5`，均属于允许保留的历史文件。 |
| 17 | 前端宪法声明的本仓参考文件存在性 | 0 | `Smart-WorkFlow-Web/Smart-WorkFlow-前端架构与现状-知识库.md`、`Smart-WorkFlow-Web/功能清单.md` 均不存在。 |
| 18 | knowledge Markdown 数量/体积 | 0 | 根 Markdown 9 个、`knowledge/features/` 36 个、根 Markdown 合计 287202 bytes；与 Executor 索引的 7/13/~310KB 不符。 |

> 构造 Hook 用例只向脚本标准输入传入内存 JSON；未创建临时业务文件、未改变 Hook/契约。

## 4. 汇总表一：文件职责与唯一权威矩阵

| 文件/类别 | 应有职责 | 当前事实 | 判定 |
|---|---|---|---|
| `system.md` | 唯一行为宪法入口、公共协议、三阶段和状态机 | 入口声明明确，但 §0.4 表格自相矛盾，§11.6 承载易漂移进度 | 部分失守 |
| `roles/planner.md` | Planner 完整权限/验收/记忆定义 | 仍含 Step 级审查、Step PASSED 更新和错误 memory 冲突裁决 | 冲突 |
| `roles/executor.md` | Executor 完整执行/证据/终态定义 | 主闭环正确；写权限未包含 `todo/`；命令示例不带 2G 环境变量；索引过期 | 冲突 |
| `roles/admin.md` | Admin 完整治理范围 | 与本轮权限边界一致；未发现阻断性冲突 | 符合 |
| 根/两端 `AGENTS.md` | 只加载 `system.md` 并按需路由工程宪法 | 三份均为短入口，无独立角色/终态正文 | 符合 |
| 根 `CLAUDE.md` | Claude 入口加载根宪法 | 仅 `@system.md` | 符合 |
| 根 `README.md` | 项目介绍与权威导航 | 复制角色权限、门禁、状态快照和命令；状态已冲突 | 越界 |
| `knowledge/governance-authority-matrix.md` | 权威归属索引 | 权威指向基本正确，但未列出现存镜像正文，日期停留 2026-08-25 | 不完整 |
| `knowledge/model-registry.md` | 最多只作角色文件短索引 | 自称记录“完整信息”，复制三角色读写/职责并与权威冲突 | 第二定义源 |
| `knowledge/development-workflow.md` | 工程流程参考，不定义角色/终态 | 定义一次授权、任务分级、唯一完成门、Step 双回执及流转 | 第二定义源 |
| `knowledge/shared-constraints.md` | 跨项目工程约束与互斥检测细节 | §2.4、§9、§9.1 复制角色/回执/终态，且存在旧流转 | 第二定义源 |
| 两端工程宪法 | 仅定义各自“怎么干”的工程专属约束 | 后端仍镜像任务分级；前端另定义 90% 授权门、旧 superAdmin 口径和缺失真源 | 部分越界 |
| `terminal-contract.json` | Executor terminal 唯一 schema/状态组合 | 枚举集中，但未封闭每状态允许字段/marker 行规则 | 不完整 |
| `validate-terminal.sh` | 唯一 JSON 语义 Validator | 既有 11 case 通过；状态不适用字段和非对象诊断有缺口 | 不完整 |
| 两套 Stop Hook | 薄提取、调用公共 Validator、透传相同诊断 | 均调用 Validator；marker 提取过宽；重试控制分叉 | 冲突 |
| `knowledge/current-status.md` | 当前状态、计数、基线、下一动作唯一权威 | 当前状态/路径与 README、memory、实际 product 位置冲突 | 漂移 |

## 5. 汇总表二：三角色读写权限闭合矩阵

| 角色 | 权威读取范围 | 权威写入范围 | 被要求完成的任务 | 闭合判定 |
|---|---|---|---|---|
| Planner | `system.md`、`roles/planner.md`、`memory/`、`search_fallback/`、`product/` | `memory/`、`search_task/`、`product/`、`todo/` | 规划、功能验收、方向流转、memory 摘要、todo 维护 | **不闭合**：有权写 `todo/` 却无权先读；决定 `PASSED` 却无权先写 knowledge；Step 审查条款与公共协议冲突 |
| Executor（根入口） | 全目录（含两端代码） | `knowledge/`、`search_fallback/`、`product/receipts/`、两端代码；角色文件另准 memory 压缩 | 实现、行为验证、知识全量同步、memory 压缩、同步 `todo/requirement-pool.md` | **不闭合**：system 速查未列 memory；所有权威允许清单均未明确 `todo/` 写权限，但 §3.3 强制要求写 |
| Executor（子仓入口） | 对应子仓 + 根治理/知识通道 | 对应子仓、knowledge/search_fallback/receipts | 单仓实现与回执 | **部分闭合**：共享文档仍要求每 Step 写双回执，与功能级闭环冲突 |
| Admin | 三仓全部非代码内容 | 宪法、roles、架构、工程配置、Governance Implementation；状态结构仅可迁移不改值 | 治理维护/静态契约测试/Git 治理 | **闭合**；本回执写入由 Owner 本方向明确授权，不是业务回执 |

## 6. 汇总表三：状态机与终态契约对照矩阵

| 阶段/事件 | 功能状态 | Executor terminal | 权威写入者/动作 | 当前一致性 |
|---|---|---|---|---|
| 方向已下发/执行中 | `READY` / `IN_PROGRESS` | 无；不得提前停止 | Planner 流转方向；Executor 执行 | 基本一致 |
| Executor 完成功能自验并提交 | 通常 `IN_PROGRESS` / `VERIFYING` | `EXECUTION_SUBMITTED` | Executor 写 completion receipt；不得写 PASSED/COMPLETED | 契约允许两值；与功能状态分离，意图一致 |
| Planner 最终验收通过 | `PASSED` | Planner 无 terminal | Planner 归档主方向、下发终态同步方向 | **权限空洞**：knowledge-first 与 Planner 禁写 knowledge 无法同时满足 |
| Executor 落终态值 | `COMPLETED（待终态复核）` | `TERMINAL_SYNC_SUBMITTED` + memory compression | Executor 按唯一值清单同步 | 名义一致；Validator 可混入不适用字段 |
| Planner 终态复核通过 | `COMPLETED（已确认）` | Planner 无 terminal | Planner 归档终态同步方向、确认 memory | 流程意图一致；当前 live 状态文件未同步 |
| 外部/方向/环境/证据阻塞 | 功能状态由业务状态机记录 | `BLOCKED` | Executor 提交阻塞证据 | 契约允许不带 feature_status；但也错误接受 `feature_status=COMPLETED` |
| Admin/Planner 任务结束 | 非 Executor terminal 命名空间 | **无 SWF_TERMINAL 要求** | 按各自角色交付 | 一致；contract `role` 固定为 `executor` |

## 7. 汇总表四：失效/过期引用清单

| # | 位置 | 失效/过期内容 | 实际事实 |
|---:|---|---|---|
| R-01 | `Smart-WorkFlow-Web/.../engineering-constitution.md` 行 5、427 | `Smart-WorkFlow-前端架构与现状-知识库.md` | 本仓不存在该文件 |
| R-02 | 同文件行 428 | 《Smart-WorkFlow 页型规范》原型 | 无可解析路径/文件名 |
| R-03 | 同文件行 430 | 本仓 `功能清单.md` | 本仓不存在；正式清单位于 `Smart-WorkFlow/功能清单.md` |
| R-04 | 同文件行 432 | “交接摘要” | 无明确路径，无法机械定位 |
| R-05 | `knowledge/development-workflow.md` 行 73 | 前端工程宪法 §8.2 作为任务分级权威 | 前端 §8.2 是结构边界内容，任务分级在 §1.1/§13.2 |
| R-06 | `roles/executor.md` 行 394 | 7 根文件 + 13 功能追踪 + ~310KB | 实测 9 根、36 功能追踪、根文件 287202 bytes |
| R-07 | `roles/executor.md` 行 395 | `product/<name>/*.md` | 当前生命周期为 `ready/receipts/passed` 二级目录 |
| R-08 | `roles/executor.md` 行 401 | 54 功能、89 明细 | 当前权威快照为 55 功能、90 明细 |
| R-09 | `knowledge/current-status.md` 行 26 | `ready/direction-minimal-closure-first-acceptance-terminal-sync.md` | 文件实际位于 `passed/` |
| R-10 | `roles/planner.md` 行 223 | “以下 8 项” | 实际列出 9 项 |
| R-11 | `system.md` §11.2 | `todo/` 结构仅列 README | 当前阶段三强制使用 `todo/requirement-pool.md`，目录说明不完整 |
| R-12 | `system.md` §11.6 | IoT/Agent/BPM/通知等旧模块完成度 | 与根 README、当前已验收能力和最新状态链不一致，且进度不应固化在宪法 |

## 8. 详细发现

### GOV-AUDIT-01 — 当前存在多个实际治理定义源

| 字段 | 内容 |
|---|---|
| 等级 | **HIGH** |
| 位置 | `system.md` 行 139-150；`README.md` 行 117-161；`knowledge/model-registry.md` 行 3-18、37-100；`knowledge/development-workflow.md` 行 17-88、170-275；`knowledge/shared-constraints.md` §2.4、行 312-360 |
| 冲突双方 | `system.md` 要求入口/参考文件只加载或短引用权威；上述文件继续定义角色、授权、终态、回执和停止条件 |
| 当前事实 | model-registry 自称记录角色“完整信息”；development-workflow 标注“硬约束”和“唯一合法完成判据”；shared-constraints 复制完整角色矩阵与 terminal 状态；README 复制角色读写、门禁、状态和命令 |
| 权威裁决依据 | `system.md` §0.8；`knowledge/governance-authority-matrix.md` 行 5-16 |
| 影响 | 任一镜像漂移都会让不同入口或不同阅读顺序得到不同权限/流程；本次已发现多处实际漂移 |
| 建议方向 | Admin 将非权威文件收缩为目的说明 + 精确权威链接；工程专属内容留工程宪法；不再镜像角色/terminal/当前状态正文 |
| 是否阻断 | 不阻断本次审计；**阻断“治理已唯一”的结论** |

### GOV-AUDIT-02 — `system.md` §0.4 权限表写反且结构错列

| 字段 | 内容 |
|---|---|
| 等级 | **HIGH** |
| 位置 | `system.md` 行 84-90，对照行 98、113-118 和 `roles/planner.md` 行 27-29 |
| 冲突双方 | 表格把 `search_task/` 写成 Planner 读、Executor 写；后续协议和角色文件规定 Planner 写、Executor 读 |
| 当前事实 | `memory/` 行比表头多一个单元格，把“按规则更新”挤入说明列；同一张表无法可靠解析出 Executor 的 memory 写权限 |
| 权威裁决依据 | `system.md` §0.4.1；`roles/planner.md` §2/§6；`roles/executor.md` §6 |
| 影响 | 模型按速查表执行会倒置探索通道，或拒绝/越权写 memory |
| 建议方向 | Admin 重建固定列为 Planner 读/写、Executor 读/写、说明，逐项与三角色文件勾稽 |
| 是否阻断 | 不阻断审计；会阻断可靠角色门禁 |

### GOV-AUDIT-03 — `todo/` 与 memory 的读写授权不闭合

| 字段 | 内容 |
|---|---|
| 等级 | **HIGH** |
| 位置 | `system.md` 行 52-53、98-107、243；`roles/planner.md` 行 61、67-81；`roles/executor.md` 行 27-34；`knowledge/model-registry.md` 行 45、58-60 |
| 冲突双方 | Planner 被授权维护 `todo/` 但权威读清单不含 `todo/`；Executor 被 §3.3 强制写 `todo/requirement-pool.md`，但允许写清单未含 `todo/`；Executor memory 写权限在各速查处不一致 |
| 当前事实 | 非权威 model-registry/shared-constraints 私自补上 Planner 读 todo 和 Executor memory 写，反而证明权威清单未闭合；没有任何权威位置明确授予 Executor 的 todo 写权限 |
| 权威裁决依据 | `system.md` §0.2/§0.4/§3.3；三角色完整定义应闭合全部必做任务 |
| 影响 | 阶段三要么无法完成，要么必须靠读取非权威镜像扩权；Planner 写 todo 时无法安全去重/保留现有条目 |
| 建议方向 | Admin 在 system + 对应 role 中显式增加 Planner 读取 todo、Executor 仅在阶段三清单授权下写 requirement-pool、Executor memory 压缩的条件化权限 |
| 是否阻断 | 不阻断审计；可阻断阶段三合规落盘 |

### GOV-AUDIT-04 — `PASSED` 中间态存在 knowledge-first 权限空洞

| 字段 | 内容 |
|---|---|
| 等级 | **HIGH** |
| 位置 | `system.md` 行 104-107、251-264、319-321；`roles/planner.md` 行 34-36、61、82、202、275；`roles/executor.md` 行 128、145-150 |
| 冲突双方 | 任何状态变更必须先落 knowledge；Planner 唯一裁决 `PASSED` 却禁止写 knowledge；Executor 在裁决前禁止写 PASSED，裁决后的同步清单直接落 `COMPLETED` |
| 当前事实 | 状态表明确存在 `PASSED`/主方向 passed/终态方向 ready 的阶段，但没有角色能把该阶段先写进 `knowledge/current-status.md` |
| 权威裁决依据 | `system.md` §0.4 信息分层铁律、§3.4 状态表、`roles/admin.md` 禁止业务状态裁决 |
| 影响 | 三条硬规则不能同时满足；历史上只能跳过 knowledge 的 PASSED 快照或让角色越权 |
| 建议方向 | Owner 选择唯一机制：例如 Planner 裁决后另下发只记录 PASSED 的机械同步，或授予 Planner 极窄的 current-status 裁决落值权；不得让 Admin 代写业务值 |
| 是否阻断 | 不阻断审计；**阻断状态机完全可执行的结论** |

### GOV-AUDIT-05 — Planner Step 审查与 Step 双回执旧协议仍是当前硬约束

| 字段 | 内容 |
|---|---|
| 等级 | **HIGH** |
| 位置 | `system.md` 行 208-222、302；`roles/planner.md` 行 190-195、273-275；`roles/executor.md` 行 288-348；`knowledge/shared-constraints.md` §2.4；`knowledge/development-workflow.md` 行 170-275 |
| 冲突双方 | system 规定 Planner 不逐 Step 审查、只审功能级完成回执；Planner/共享文档仍要求标记 Step PASSED、更新 Step memory、每 Step 写 execution+test 两份回执 |
| 当前事实 | shared-constraints 还允许 Planner 把“已验收回执”归档到 `passed/`；system §5.5 规定 receipts 留在 `receipts/`，`passed/` 只放已确认方向 |
| 权威裁决依据 | `system.md` §3.2、§5.2、§5.5；`roles/executor.md` 行 292 的功能级回执前言 |
| 影响 | Planner 可能越权进入 Step 管理；回执被错误移动；执行代理可能每 Step 停止，破坏一次授权连续闭环 |
| 建议方向 | Admin 清除 Planner Step 审查/Step memory 当前条款；共享文档改为功能级 completion receipt + 追加补证；明确 receipts 永不移入 passed |
| 是否阻断 | 不阻断审计；会造成生命周期分叉 |

### GOV-AUDIT-06 — 两套 Hook 未执行唯一 marker 与物理末行规则

| 字段 | 内容 |
|---|---|
| 等级 | **HIGH** |
| 位置 | `system.md` 行 150；`roles/executor.md` 行 68-78；`.claude/hooks/...` 行 15-17；`.codex/hooks/...` 行 18-27 |
| 冲突双方 | 终态应作为最后回复追加的唯一结构化行；Hook 用 awk 取“第一条包含 marker 的行”后立即停止搜索 |
| 当前事实 | 构造用例证明：marker 后追加文本、第二个 marker 非法，两套 Hook 均退出 0 且无阻断输出 |
| 权威裁决依据 | `roles/executor.md` “最后回复必须追加”；方向明确要求核对物理末行；机器门禁不得接受多义终态 |
| 影响 | 未完成项或相互冲突的第二终态可藏在合法首 marker 后；Hook 无法证明物理最后一行唯一 |
| 建议方向 | Admin 在薄适配层检查 marker 总数恰为 1、该行是物理末行、前缀严格为 `SWF_TERMINAL `，再把纯 JSON 交 Validator；加入双 Harness 用例 |
| 是否阻断 | 不阻断审计；**阻断 terminal 门禁可靠性结论** |

### GOV-AUDIT-07 — terminal 状态专属字段未封闭

| 字段 | 内容 |
|---|---|
| 等级 | **HIGH** |
| 位置 | `terminal-contract.json` 行 4-21；`validate-terminal.sh` 行 31-34 |
| 冲突双方 | contract 声称封闭对象并给每状态 required/allowedFeatureStatus；Validator 只查 required 和非空 allowedFeatureStatus，不拒绝其他已知但不适用字段 |
| 当前事实 | `BLOCKED + feature_status=COMPLETED`、`EXECUTION_SUBMITTED + block_type/attempted/release_condition` 都退出 0；`BLOCKED.allowedFeatureStatus=[]` 不会触发任何禁止检查 |
| 权威裁决依据 | `roles/executor.md` 行 70：字段组合只由机器契约定义，未被接受的组合不能停止 |
| 影响 | 一个 payload 可同时表达“已完成”和“阻塞”，或把阻塞语义混入执行提交；下游无法唯一解释 |
| 建议方向 | Contract 为每状态增加 allowed/forbidden 字段集合或完整 oneOf 分支；Validator 精确执行；新增正反例 |
| 是否阻断 | 不阻断审计；阻断 schema 封闭性结论 |

### GOV-AUDIT-08 — Claude/Codex 对非法终态的重试后行为分叉

| 字段 | 内容 |
|---|---|
| 等级 | **HIGH** |
| 位置 | `.claude/hooks/...` 行 8、22-26；`.codex/hooks/...` 行 26-31 |
| 冲突双方 | Claude 在 `stop_hook_active=true` 时返回 `continue:false` 并声明停止自动续跑；Codex 对同一输入继续返回 `decision:block` |
| 当前事实 | 构造输入的两份原始输出不同；Codex Hook没有对应 retry 分支 |
| 权威裁决依据 | `system.md` §0.8 要求不同 Harness 得到相同治理结果；Validator/Hook 应透传统一诊断 |
| 影响 | 相同非法终态在 Claude 可能结束自动续跑，在 Codex 继续阻断；治理行为依 Harness 改变 |
| 建议方向 | Owner/Admin 明确统一的有限重试策略，并由共享适配逻辑或同一状态机实现；两套 Hook 只做协议字段映射 |
| 是否阻断 | 不阻断审计；阻断跨 Harness 一致性结论 |

### GOV-AUDIT-09 — Validator 非对象诊断不统一，既有测试覆盖不足

| 字段 | 内容 |
|---|---|
| 等级 | **MEDIUM** |
| 位置 | `validate-terminal.sh` 行 7-35；`test-terminal-contract.sh` 行 11-23 |
| 冲突双方 | Validator 试图先报告 `payload: expected object`，随后仍对数组/字符串调用 `has(string)`；`jq -e .` 又把合法 JSON null 当解析失败 |
| 当前事实 | `[]`/`"text"` 退出 5 并泄漏 jq 原始错误；`null` 退出 2 且误报 invalid JSON；11-case suite 未覆盖非对象、marker 位置、重复 marker、状态不适用字段、Hook 对照 |
| 权威裁决依据 | `system.md` §0.8 要求公共 Validator 和统一诊断 |
| 影响 | 阻断仍发生，但诊断码/文本不稳定，Hook 和自动化难以精确判定原因 |
| 建议方向 | 先分支验证 object，再进入字段遍历；解析与类型错误分离；扩展契约与双 Hook 回归矩阵 |
| 是否阻断 | 不阻断 |

### GOV-AUDIT-10 — 前端工程宪法保留旧 90% 澄清/执行门

| 字段 | 内容 |
|---|---|
| 等级 | **HIGH** |
| 位置 | 前端工程宪法行 17、44-49、403-407；对照 `roles/executor.md` 行 64-80 |
| 冲突双方 | 前端宪法先声明不另定义授权，后又规定无特定执行关键词必须反复澄清到 90%，仅在“执行指令+充分澄清”后执行；根规则规定给出任务/方向/审查路径即一次授权并连续闭环 |
| 当前事实 | 从前端 `AGENTS.md` 进入时会同时加载根规则和这条旧门禁，无法同时遵守 |
| 权威裁决依据 | `system.md` §0.2/§0.8；`roles/executor.md` §4 一次授权 |
| 影响 | 前端 Harness 可能多次确认、拒绝已授权任务，和根/后端行为分叉 |
| 建议方向 | Admin 删除 §13.1 授权判定正文，替换为根 `system.md`/Executor role 短引用；工程宪法只保留前端专属工程约束 |
| 是否阻断 | 不阻断审计；阻断前端入口一致性 |

### GOV-AUDIT-11 — 前端仍把 `superAdmin` 绑定 `userId==1`

| 字段 | 内容 |
|---|---|
| 等级 | **HIGH** |
| 位置 | 前端工程宪法行 110；`system.md` 行 493-495 |
| 冲突双方 | 前端：`superAdmin = boolean（对齐后端 userId==1）`；根当前硬约束：按角色 code 含 `superadmin`，`userId==1` 已 SUPERSEDED |
| 当前事实 | 旧安全口径仍位于“不可破的工程约束”当前正文，不是历史说明 |
| 权威裁决依据 | `system.md` §11.7 与 Owner 最新治理口径 |
| 影响 | 前端/后端权限判断可能按错误身份根实现或验收，形成安全与行为分叉 |
| 建议方向 | Admin 将工程宪法改为只引用共享安全约束或写当前 role-code 语义；旧 userId 口径移入历史决策而非当前正文 |
| 是否阻断 | 不阻断审计；阻断安全规则一致性 |

### GOV-AUDIT-12 — 多处可复制命令违反 2G 硬约束

| 字段 | 内容 |
|---|---|
| 等级 | **HIGH** |
| 位置 | `roles/executor.md` 行 358-383；后端工程宪法行 368-372；前端工程宪法行 62-68、231-253；`knowledge/development-workflow.md` 行 35-57、166 |
| 冲突双方 | 文字规定所有 mvn/pnpm/npm/node 命令一律带内存环境变量；紧邻命令块与“唯一校验门”均不带 |
| 当前事实 | 根 README 是唯一将每个链式子命令都带环境变量的示例；其余当前文档可直接复制出违规命令；部分示例也未呈现编译互斥检测前置 |
| 权威裁决依据 | `system.md` 行 75；`knowledge/shared-constraints.md` 行 331-338 |
| 影响 | 执行代理按正式角色/工程宪法复制命令会违反资源硬约束，且可能与另一端并发重型任务 |
| 建议方向 | Admin 统一把命令块改成可直接执行的 2G 版本，链式每段均显式携带变量；在所有 gate 前短引互斥检测，不复制完整角色正文 |
| 是否阻断 | 不阻断审计；会阻断合规构建执行 |

### GOV-AUDIT-13 — 当前状态、README、memory 与目录事实不同步

| 字段 | 内容 |
|---|---|
| 等级 | **HIGH** |
| 位置 | `knowledge/current-status.md` 行 3-17、26-30、41-47；`README.md` 行 129-138；`memory/state.md` 行 3-10；`memory/handoff.md` 行 5 |
| 冲突双方 | 当前状态权威写审计 `COMPLETED（待规划终态复核）`、下一动作仍是复核、终态方向仍在 ready；README/memory 写 `COMPLETED（已确认）`、下一动作为本管理员审计；文件实际已在 passed |
| 当前事实 | `product/minimal-closure-first-acceptance/passed/direction-minimal-closure-first-acceptance-terminal-sync.md` 存在，current-status 引用的 ready 文件不存在 |
| 权威裁决依据 | `system.md` 行 104-107、150；`knowledge/governance-authority-matrix.md` 行 11 |
| 影响 | Planner 从 memory 与 Executor/Admin 从 knowledge 得到不同“唯一下一动作”；README 对外给出第三口径 |
| 建议方向 | 这属于业务状态同步，不由本 Admin 修复：Owner/Planner 按现有裁决下发精确同步，由 Executor 全文更新 current-status 后再压缩 memory；Admin 后续移除 README 状态镜像 |
| 是否阻断 | 不阻断审计；阻断下一业务动作唯一性 |

### GOV-AUDIT-14 — Planner memory 冲突裁决和保留策略落后于唯一状态源

| 字段 | 内容 |
|---|---|
| 等级 | **MEDIUM** |
| 位置 | `roles/planner.md` 行 279-285；对照 `system.md` 行 104-107、150、243 和 `roles/executor.md` 行 150 |
| 冲突双方 | Planner 文档称 memory 是 approximate cache，冲突时以 search_fallback/新探索为准，并要求“只更新不重写、附加日期”；根规则要求 knowledge/current-status 为唯一权威，memory 只保留最小当前摘要，阶段三移除完整历史过程 |
| 当前事实 | 当前 live 状态已出现 memory 与 knowledge 冲突，Planner 规则会引导继续以非权威探索回执裁决或追加历史 |
| 权威裁决依据 | `system.md` 信息分层铁律和当前状态唯一来源 |
| 影响 | memory 可逐轮膨胀、保留旧当前态并形成第二状态源 |
| 建议方向 | Admin 将 Planner §8.4 改为“冲突必须通过执行层核对 knowledge，最终按 current-status 修正摘要”；允许为压缩重写当前摘要，历史仅进 knowledge/history |
| 是否阻断 | 不阻断 |

### GOV-AUDIT-15 — 关键引用、章节号、索引计数与路径过期

| 字段 | 内容 |
|---|---|
| 等级 | **MEDIUM** |
| 位置 | 汇总表四 R-01 至 R-11；`roles/planner.md` 行 223-233 |
| 冲突双方 | 当前治理/工程文档声称引用可定位、索引为当前值；静态存在性和计数检查显示多处不存在或过期 |
| 当前事实 | 23 个核心治理路径均存在，但前端“现状知识库/功能清单”缺失；前端任务分级章节号错误；Executor 目录/数量索引过期；Planner 8/9 项编号错误 |
| 权威裁决依据 | `system.md` §0.8/§16；方向 §D 当前性与引用完整性 |
| 影响 | 新会话无法定位前端真源，错误章节跳转和过期规模信息增加误读与审计成本 |
| 建议方向 | Admin 做一次精确引用迁移：所有跨仓路径写全工作区相对路径，删除规模快照，章节引用以当前标题/锚点重建 |
| 是否阻断 | 不阻断 |

### GOV-AUDIT-16 — 唯一宪法自身保存易漂移模块进度

| 字段 | 内容 |
|---|---|
| 等级 | **MEDIUM** |
| 位置 | `system.md` 行 474-487；`README.md` 行 11-18；`knowledge/current-status.md` 当前能力链 |
| 冲突双方 | system §11.6 把 BPM/通知/Agent/IoT 等写成 In dev/Placeholder/Skeleton；README 已写 Agent/IoT/完整流程能力，当前验收链也已变更 |
| 当前事实 | 行为宪法同时承担角色协议与模块完成度快照，后者没有同步机制且已经落后 |
| 权威裁决依据 | `system.md` 行 150：当前状态唯一在 `knowledge/current-status.md`；工程宪法也声明不记进度 |
| 影响 | 每个 Harness 启动必读 system 时都会先接收过期产品状态，可能误导规划与范围判断 |
| 建议方向 | Admin 从 system 删除模块完成度值，只保留到 current-status/功能清单的导航；README 也不保存状态副本 |
| 是否阻断 | 不阻断 |

## 9. 十个必须回答的问题

1. **是否只有一个行为宪法入口？** 声明和 Harness 入口上是；实际定义上不是。重复源见 GOV-AUDIT-01。
2. **system 与三个角色定义是否冲突？** 是。主要为 search_task/memory 表、Planner Step 审查、memory 冲突裁决和写权限缺口；Admin 主边界一致。
3. **三角色权限是否闭合？** 否。`todo/`、memory、PASSED→knowledge 存在空洞；见 GOV-AUDIT-03/04。
4. **三阶段、状态、product、终态同步是否无矛盾？** 主序列可理解，但不是完全可执行的无矛盾状态机；PASSED 无合法落值者，Step 双回执和 receipts→passed 旧规则仍在。
5. **Executor terminal、阶段三 terminal、功能状态是否一致？** 命名空间和三种 terminal 枚举基本一致；marker、状态字段封闭性和重试行为不一致。
6. **重复失败规则是否一致？** 权威三处一致：同类连续 `>=2`，随后一级→二级→三级零裁量，Planner 下发/复核，Executor 只承接最新提示并提交证据包。
7. **memory/knowledge/search/product 边界是否一致？** 否。权威原则清楚，但 memory 冲突裁决、search_task 表、Step 回执和当前 live 状态漂移。
8. **AGENTS/CLAUDE/Hook 是否分叉？** 入口文件本身合格；前端工程宪法和两套 Hook 行为分叉。
9. **README 是否只做导航？** 否。它复制角色/门禁/命令/当前状态，其中当前状态已冲突。
10. **是否存在失效链接/旧状态/旧命令？** 是；见汇总表四和 GOV-AUDIT-10/11/12/13/15/16。

## 10. 范围证明与后续结论

- 除新增本回执外，**未修改任何既有文件**；尤其未修改 `system.md`、`roles/`、README、Harness、Hook、contract、Validator、memory、knowledge 或两端工程文件。
- **未运行业务命令**；只运行文本检索、存在性/计数、Git 状态、JSON 解析、shell 语法、治理契约静态测试和内存构造用例。
- **未执行 Git add/commit/push/pull/rebase/reset/checkout**，未发布、未清理工作区。
- 审计前已有的 `memory/state.md`、`memory/handoff.md` 修改及整个未跟踪审计目录均被保留，未覆盖或回退。
- 本任务通过只表示审计交付完整，不表示治理问题已经修复，也不改变任何业务功能状态。
- **需要 Owner 下发后续管理员修复任务。** 推荐优先级：GOV-AUDIT-06/07/08/09（机器门禁）→ 02/03/04/05（角色和状态机闭合）→ 10/11/12（工程入口）→ 01/13/14/15/16（单一来源和当前性清理）。
- Admin 无 `SWF_TERMINAL`：`terminal-contract.json` 的 `role` 固定为 `executor`，本轮不是 Executor 任务，因此回执末尾不追加或自造 terminal marker。

## 11. 最终工作区复核

- 回执自检：380 行/34333 bytes（写入最终复核段前）；`GOV-AUDIT` 发现 16 项，其中 HIGH 12、MEDIUM 4；物理行首 `SWF_TERMINAL ` 为 0。
- 最终根仓 `git status --short`：仍为 `M memory/handoff.md`、`M memory/state.md`、`?? product/workspace-governance-consistency-audit/`。
- 最终根仓 `git diff --name-only`：仅 `memory/handoff.md`、`memory/state.md`，与审计开始前已有修改一致；本回执位于未跟踪审计目录中。
- 后端、前端 `git status --short`：均无输出。
- 审计目录实际文件仅两份：原方向文档与本回执。
- 未发现本回执物理 terminal marker；尾空格已清理，最终格式复核见本轮命令输出。
