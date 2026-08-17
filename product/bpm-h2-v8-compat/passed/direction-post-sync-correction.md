# P10 / I47：最终验收后知识同步收尾修正

## 当前状态

**PASSED** — 执行层已完成 9 个指定文件的全量同步与全文复核，规划层于 2026-08-18 对照六项验收方向复验通过；业务实现与 D88 `PASSED` 判定保持不变。

## 功能目标

将 bpm-h2-v8-compat（P10 / I47）最终验收后的真实终态一次性同步到完整知识库、需求池、功能追踪、完成回执和压缩记忆，消除“顶部已更新、中下部残留”，使所有当前状态入口一致反映 `PASSED / 543 tests / H2 全链 30 / 已完成功能 19 / P10、P12 核销`。

## 规划裁定

1. P10/I47 的业务实现、测试结果、D87/D88 最终验收和既有 Git 提交保持有效；本任务只修正阶段三知识同步，不重新实现、不重新验收业务代码。
2. 审计回执 `search_fallback/p10-post-sync-consistency-audit.md` 是本次修正范围的直接依据；其中“必须修正”项应逐项闭合。
3. 当前状态统一口径：无进行中业务功能；P10/I47 `PASSED/已关闭/已核销`；后端 543/0/0；H2 真实全链 30；已完成功能 19；方向归档路径为 `product/bpm-h2-v8-compat/passed/direction-bpm-h2-v8-compat.md`。
4. P12“sw-bootstrap 缺少永久迁移测试基建”的前提已由本轮 `junit-jupiter` 与 `FlywayFullChainH2Test` 消除，应按需求池规则核销；不得保留为当前待决策事项。
5. 历史叙述中带明确日期、轮次或“当时基线”的旧数字可以保留；任何被当前状态、当前基线、下一动作或启动提示词消费的旧值必须修正。

## 必须同步范围

- `knowledge/current-status.md`：全文件检查并同步当前功能状态、完成数量、后端测试基线、H2 迁移基线、最新完成和候选池。
- `knowledge/session-handoff.md`：全文件检查并同步最新完成、进行中、基线、未关闭问题、后续候选、启动提示词和页脚日期/口径。
- `knowledge/known-issues.md`：回补 I26/P13 与 I47/P10 的最终闭环描述，所有当前路径改为 `passed/`；保留合法历史叙述。
- `knowledge/features/bpm-h2-v8-compat.md`：状态更新为最终 `PASSED/已归档`，登记 D87/D88，删除等待规划层验收的当前态表述。
- `todo/requirement-pool.md`：P10 最终核销；P12 因永久迁移测试基建已经建立而核销，并保证无其他 P10/I47 当前待排期引用。
- `product/bpm-h2-v8-compat/receipts/bpm-h2-v8-compat-completion.md`：方向路径改为 `passed/`，补记规划层 D88 最终验收，删除“保持未 PASSED/等待验收”的当前态表述；原始执行证据不得改写。
- `memory/state.md`：修正最后更新时间/最新完成功能、V27-V30 占用事实和最新测试基线标题；保留带轮次的历史轨迹。
- `memory/features.md`：功能追踪文件数量改为实际口径，并明确是否包含 `_template`。
- `memory/handoff.md`：清除当前候选、启动提示词和最新快照中对 I47、P12、527/28/旧最新功能的残留。

## 非目标

- 不修改后端或前端业务代码、测试代码、迁移文件、工程依赖和配置。
- 不运行 Maven、pnpm/npm、部署、数据库迁移或应用启动。
- 不改变 P10/I47 的实现方案、测试结论或最终验收判定。
- 不顺带规划新功能，不修改与本轮无关的历史决策。
- 不把合法的历史演进数字机械改成当前值。

## 验收方向

同步回执必须提供证据证明：

1. 审计回执列出的 9 个“必须修正”文件全部完成逐项闭合，没有遗漏。
2. 对相关文件执行全文搜索后，所有仍命中的 `527`、`28`、`16 个功能`、`I47 待排期`、`P10 待最终验收`、`ready/direction-bpm-h2-v8-compat.md` 均被分类为合法历史叙述或已经清除；不得只检查文件顶部。
3. 当前状态入口统一为 543 tests、H2 全链 30、已完成 19、无进行中业务功能、P10/P12 已核销。
4. `knowledge/features/bpm-h2-v8-compat.md` 与完成回执明确记录 D87/D88 和最终 `PASSED`，归档路径真实存在。
5. 后端功能清单状态列保持 ✅12/🟦37/⬜41，不因底层缺陷修复误改功能状态。
6. 回执列明逐文件修改摘要、全文复核命中分类、未修改范围、Git diff 摘要以及仍存的合法历史引用。

## 风险方向

- **局部更新风险**：必须检查全节/全文，禁止再次只改顶部。
- **历史失真风险**：历史轮次中的 527/28 等事实应保留并带清楚语境，不得批量替换。
- **状态口径风险**：业务 `PASSED` 与“知识同步修正 READY”是两个层次，不得把业务功能重新标为失败或进行中。
- **范围蔓延风险**：只处理审计列出的同步残留，不修改业务实现和其他候选需求。

## 探索依据

- `search_task/p10-post-sync-consistency-audit.md`
- `search_fallback/p10-post-sync-consistency-audit.md`
- `product/bpm-h2-v8-compat/passed/direction-bpm-h2-v8-compat.md`
- `product/bpm-h2-v8-compat/receipts/bpm-h2-v8-compat-completion.md`
- `product/bpm-h2-v8-compat/receipts/bpm-h2-v8-compat-test.md`

## 执行交付要求

执行角色依据本方向完成纯文档同步与全文件复核，不拆出业务实现任务。完成后将知识同步回执写入：

`product/bpm-h2-v8-compat/receipts/post-sync-correction.md`

规划层最终复验已通过；本文档归档至 `passed/`。
