# P10 / I47 收尾同步一致性审计

**本会话角色：规划，委派角色：执行。**

## 任务目标

只读核对 bpm-h2-v8-compat（P10 / I47）完成并经规划层最终验收后，功能需求池、后端功能清单、完整知识库、压缩记忆和 product 归档是否全部同步到同一终态；识别任何“顶部已更新、中下部残留”或计数/路径/状态漂移。

## 需要回答的问题

1. `todo/requirement-pool.md` 中 P10 是否已从“待规划层验收”更新为最终 `PASSED/已核销`，且没有其他 P10/I47 活跃引用误导为待排期？
2. `Smart-WorkFlow/功能清单.md` 是否确实无需状态变化；所有涉及 BPM 迁移、测试基线、功能计数的描述是否与本轮结果一致？请给出相关行及当前状态计数。
3. `knowledge/known-issues.md` 中 I47 是否明确关闭，并且索引、详情、状态、修复证据和日期一致；全文是否仍有“未修复/待排期/28 条排除 BPM”等过时引用？
4. `knowledge/current-status.md` 是否全文件一致反映：无进行中功能、已完成功能 19、后端 543 tests、H2 全链 30、P10/I47 已完成；检查所有章节而非只看顶部。
5. `knowledge/session-handoff.md` 是否全文件一致反映同一终态，不存在旧的 527/28、P10 待排期、I47 未修复或已完成功能数旧值。
6. `knowledge/features/bpm-h2-v8-compat.md` 是否存在且完整记录目标、实际修改、测试证据、遗留风险、知识同步与最终验收状态；是否仍停留在“待规划层验收”。
7. `memory/state.md`、`memory/handoff.md`、`memory/features.md`、`memory/issues.md`、`memory/decisions.md` 与 knowledge 是否一致。重点核对已发现的候选漂移：
   - `memory/state.md` 页首最后更新仍写 sysrole；正文“最新已完成”仍指向 sysrole；历史架构段仍写 V27+ 空闲。
   - `memory/features.md` 页脚仍写 14 个功能追踪文件。
   - `memory/handoff.md` 后续候选/旧基线段是否仍把 I47 当待办或仍写 527/28。
8. `product/bpm-h2-v8-compat/` 是否只有 `passed/` 方向文档与两份 receipts，方向文档/回执内部路径和状态是否因 ready→passed 归档而出现过时引用。
9. Git 远端同步后的两个提交（knowledge `6a66ae9`、backend `83adf77`）是否分别包含本轮承诺的全部状态/知识与实现文件；只核对提交内容，不做任何 Git 写操作。
10. 汇总所有不一致项，按“必须修正 / 历史叙述可保留 / 仅措辞优化”分类，并给出最小修正文件清单。不得直接修正。

## 搜索范围

- `knowledge/current-status.md`
- `knowledge/session-handoff.md`
- `knowledge/known-issues.md`
- `knowledge/features/bpm-h2-v8-compat.md`
- `memory/state.md`
- `memory/handoff.md`
- `memory/features.md`
- `memory/issues.md`
- `memory/decisions.md`
- `todo/requirement-pool.md`
- `product/bpm-h2-v8-compat/`
- `Smart-WorkFlow/功能清单.md`
- 两个仓库提交 `6a66ae9`、`83adf77` 的只读 `git show/status/log`

## 禁止范围

- 禁止读取或修改 `Smart-WorkFlow-Web/`。
- 禁止修改任何文件、提交、推送、运行编译或测试。
- 禁止重新实现 P10/I47，禁止生成新需求方向。
- 禁止无边界扫描其他功能代码；只允许为核对引用和计数做必要的文本搜索。

## 预期证据

- 每个问题给出明确结论（通过/不通过）及文件路径、章节或行号。
- 对数字至少给出一次独立全文搜索或计数证据。
- 对 Git 提交给出提交号、文件清单摘要以及工作树/远端跟踪状态。
- 明确区分“当前状态残留”与“历史叙述中的合法旧数字”。

## 完成标准

10 个问题全部有答案；所有发现均有可定位证据；结论能够让规划层直接判断是否需要下发知识同步修正，不需要读取原始代码或完整 knowledge。

## 失败处理

若权限、提交缺失或文件不存在导致无法完成，仍需将已核对范围、阻塞点和未确认事项写入回执，不得静默跳过。

## 回执位置

探索结果写入 `search_fallback/p10-post-sync-consistency-audit.md`，目标小于 5KB，结论优先。
