# 探索回执：D85 信息分层铁律同步（rule-sync-d85）

> 探索任务：`search_task/rule-sync-d85.md`，2026-08-16 执行角色完成。

## 探索结论

D85 信息分层铁律已按任务书 5 项全部处理完毕（4 项落地 + 1 项说明），语义与根 system.md §0.4 一致：

1. `knowledge/shared-constraints.md` — 新增 §10「信息分层铁律（D85）」5 条（①knowledge=唯一完整权威信息源 ②memory=最少信息摘要 ③冲突以 knowledge 为准并立即修正 memory ④触碰状态文件必须同步 knowledge 全量文件——禁止"顶部新、中下部残留" ⑤清单 🟦/⬜ 缺口同步进 `todo/requirement-pool.md` P 编号登记）
2. `knowledge/development-workflow.md` — §6.2 之后新增 §6.3「信息分层铁律（D85）」4 条（含文件全量同步强化与 P 编号登记；该文件无 §3.3 结构，与"第 10 项知识库全量同步"最接近的 §6.2 维护原则紧随其后引用）
3. `Smart-WorkFlow/docs/governance/engineering-constitution.md`（后端工程宪法）— 末尾追加 §13「信息分层铁律（与根 system.md §0.4 一致）」4 条 + 注记
4. `Smart-WorkFlow-Web/docs/governance/engineering-constitution.md`（前端工程宪法）— 末尾追加 §15「信息分层铁律（与根 system.md §0.4 一致）」4 条 + 注记
5. `knowledge/README.md` — **不存在**；knowledge/ 内无目录说明区（各文件头部仅为"工作区统一知识库 — XX分册"单文件定位，非目录索引）→ 按任务书"说明即可"处理；"knowledge=完整权威、memory=摘要"表述已由上述新增 D85 条款原样承载

## 检查范围

- 读取：根 `system.md`（§0.4 铁律块 + §3.3 第10项）、`knowledge/shared-constraints.md`、`knowledge/development-workflow.md`、`knowledge/` 全部文件头部（README 存在性检查）、`Smart-WorkFlow/docs/governance/engineering-constitution.md`、`Smart-WorkFlow-Web/docs/governance/engineering-constitution.md`、根 `README.md`、任务书 `search_task/rule-sync-d85.md`
- 修改：`knowledge/shared-constraints.md`、`knowledge/development-workflow.md`、`Smart-WorkFlow/docs/governance/engineering-constitution.md`、`Smart-WorkFlow-Web/docs/governance/engineering-constitution.md`（四处均仅追加，未动既有内容）

## 关键证据

- 根 system.md §0.4「信息分层铁律（D85，2026-08-16 用户定）」：4 条（knowledge=唯一完整权威信息源 / memory=最少信息摘要 / 冲突以 knowledge 为准立即修正 memory / 触碰状态文件必须同步 knowledge 全量对应文件——禁止"只更新文件首部/只更新 memory"造成中下部残留）
- 根 system.md §3.3 第10项「知识库全量同步（强制项）」（D74/D85）：🟦/⬜ 行缺口同步进 `todo/requirement-pool.md`（P 编号登记，防"清单独有"）；同步范围覆盖文件全量（全节/全文），禁止"顶部更新、中下部残留"（D83 曾发现 17 处欠账）
- 四处新增内容均含"与根 system.md §0.4 一致"标注，冲突时以根 system.md 为准

## 已确定事实

- 任务书 5 项中 4 项已完成文件落地，1 项（knowledge/README.md）判定无对应位置
- 三仓库（knowledge 仓库 / 后端仓库 / 前端仓库）均无编译/测试操作，未触碰 memory/、todo/、两端业务代码、根 system.md
- 后端仓库 `功能清单.md` 存在他人（规划层 D85 配套工作）未提交改动（P36-P50 缺口登记），本次未触碰该文件

## 分析推测

无。

## 未确认事项

- 若规划层希望"knowledge=完整权威、memory=摘要"以独立一句话出现在目录级说明处，候选位置为根 `README.md` 目录结构区的 `knowledge/` 行（超出本任务搜索范围，未改动）；knowledge/ 目录本身无 README 也无目录说明区

## 冲突信息

无。

## 是否需要继续探索

否。

## 建议返回规划层的最小结论

D85 铁律 4 处规范同步完成（shared-constraints §10 / development-workflow §6.3 / 后端宪法 §13 / 前端宪法 §15），与根 system.md §0.4 表述一致；knowledge/README.md 不存在，无目录说明区可补，该句由新增 D85 条款承载；如需目录级独立一句话可考虑根 README.md（未在本次范围）。
