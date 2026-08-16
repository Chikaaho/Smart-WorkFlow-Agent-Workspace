# 探索任务：D85 信息分层铁律同步到 knowledge 侧与子项目规范

> 派发：规划层，2026-08-16。执行角色自主执行，产出唯一回执。

**任务目标**：将 D85 铁律（knowledge=完整权威、memory=最少信息摘要、执行角色触碰状态文件必须同步 knowledge 全量）同步到 knowledge/ 侧规范文件与两个子项目的 system.md，与根 system.md §0.4 铁律块一致。

**需要回答的问题（逐项执行）**：

1. `knowledge/shared-constraints.md` 新增/追加「信息分层铁律（D85）」条款（含：①knowledge=唯一完整权威信息源；②memory=最少信息摘要，冲突以 knowledge 为准并立即修正 memory；③触碰状态文件必须同步 knowledge 全量文件——禁止顶部新、中下部残留；④清单 🟦/⬜ 缺口同步进 `todo/requirement-pool.md` P 编号）
2. `knowledge/development-workflow.md` 同步同一铁律（若已有 §3.3 对应描述则强化到与根 system.md 第10项一致：同步范围覆盖文件全量）
3. 两个子项目 `Smart-WorkFlow/system.md`、`Smart-WorkFlow-Web/system.md` 的对应规范段落同步该铁律（若子项目 system.md 无知识库章节，则在末尾追加简短条款并注明「与根 system.md §0.4 一致」）
4. `knowledge/README.md`（如存在）或 knowledge/ 目录说明中补一句：knowledge=完整权威、memory=摘要（与 D85 表述一致）

**搜索范围**：`knowledge/shared-constraints.md`、`knowledge/development-workflow.md`、`Smart-WorkFlow/system.md`、`Smart-WorkFlow-Web/system.md`、`knowledge/` 下可能的 README/索引文件。

**禁止范围**：不修改 memory/、todo/、两端业务代码；不执行编译/测试命令；不改动根 system.md（规划层已改）。

**预期证据**：逐文件改动摘要（文件|位置|改前→改后 摘要）+ 触碰文件清单。

**完成标准**：5 项完成（或逐项说明未适用的原因）+ 回执按 §0.5.5 格式写入指定位置。

**失败处理**：某项无对应位置则说明即可（如子项目 system.md 无知识库章节时按第 3 项末尾追加处理）。

**回执位置**：`search_fallback/rule-sync-d85.md`
