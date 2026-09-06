# P4 OA子集阶段三终态同步方向

2026-09-07；Planner；L（机械终态同步）；COMPLETED（规划已确认，2026-09-07）。历史执行入口，依据receipts/planning-review-p4-09-passed.md。功能实现已PASSED；本任务只同步持久状态、索引、基线和交接，完成后由Planner全文复核确认COMPLETED。

## 唯一终态值清单

| 字段 | 唯一授权值 |
|---|---|
| 功能标识/名称 | p4-oa-personal-center-dual-dispatch / P4 OA个人中心与流程双通道（本轮子集） |
| 功能状态 | COMPLETED（同步目标；Planner最终确认前不得声称已获最终确认） |
| 完成日期 | 2026-09-07 |
| 已完成业务功能数 | 42（41+本轮子集1，不另建P编号） |
| 清单计数 | 90条，✅34 / 🟦28 / ⬜28（34+28+28=90，零行升降级） |
| P4总项 | 开放、部分实现，未整体核销；本轮子集完成 |
| 明细/里程碑 | M04-F05-01仍🟦；其余90条原明细状态全部原值不变；整体OA里程碑不因本子集标全完成 |
| 后端正式基线 | 174份报告 / 1128 tests / 0 failures / 0 errors / 0 skipped；MVN_EXIT=0 |
| 前端正式基线 | 121 files passed + 1 skipped / 1153 tests passed + 3 skipped；VITEST_EXIT=0，ESLINT/TSC/BUILD_EXIT=0；lint验证范围按已锁原件注明，不扩称全仓零警告 |
| 迁移正式基线 | H2 V55（55条）；PostgreSQL V55（54条）；本轮真实全量日志支持 |
| 当前活动功能 | 无（已完成条目不同时列作活动功能） |
| 当前唯一下一动作 | 等待Owner选择下一需求 |
| 主方向目录 | product/p4-oa-personal-center-dual-dispatch/passed/direction-p4-oa-personal-center-dual-dispatch.md |
| 配套方向目录 | product/p4-oa-personal-center-dual-dispatch/passed/flow-platform-capability-boundary.md |
| 终态同步方向目录 | product/p4-oa-personal-center-dual-dispatch/ready/direction-p4-terminal-sync.md（仅Planner复核通过后移passed） |

验收基线集合仅后端、前端、双方言迁移上述三组；证据：receipts/evidence/p0-result-query/p4-p0result-per-report.txt及p4-full-test-run7.log（迁移13493/13690、退出25163行），前端沿receipts/planning-review-p4-07.md L27引用原件。不得使用1121/1126或旧前端计数覆盖当前值。业务子集计入42与P4总项仍开放并不矛盾：一个交付功能完成不等于需求池聚合项全核销。

## 允许同步与执行边界

Executor按system.md和执行角色规则先核权威状态，机械同步knowledge当前状态/功能索引/清单对账/历史，再同步项目memory摘要、todo需求池和必要交接/引用。包括表单可见范围、普通表单发起、草稿免必填保存、提交校验、四入口、普通可靠异步及MQ替换边界、P0单次同步/超时结果flowStart语义；流程中心分类/双视角、抄送/催办等继续待办。

项目memory每个短文件<5KB、总量<20KB，保留当前摘要和权威指针，历史放knowledge/history；此授权不涉及用户全局Codex记忆。修正当前入口的ready旧路径和“补证/执行提示08/回执09待实现”等已结束下一动作；历史审查原文保留。配套契约引用统一指向passed。

不修改业务/测试实现、不重跑已锁工程测试、不新增功能需求、不执行Git提交推送或部署。不自行移动终态同步方向。若权威当前数值出现本清单以外的新变更冲突，提供精确对账差异，不自行选择另一个终态值。

## 回执与复核

追加receipts/terminal-sync-p4-01.md，提供唯一值清单→实际文件位置→写入值逐项映射、所有修改的当前入口全文可读副本（放receipts/evidence/terminal-sync/，供Planner不越界复核knowledge/工程清单）、工具生成哈希及回读结果、项目memory压缩前后字节数/总量/移除摘要。保持历史与当前结论分开。

提交前验证功能数42一致、清单和P4/明细语义一致、三组基线一致、活动项及下一动作无旧任务残留、归档位置正确、实际写入与回执一致、摘要大小达标。按现有终态契约提交同步回执，等待Planner最终复核；不把Executor同步提交当作规划已确认完成。


最终复核：`../receipts/planning-final-review-terminal-sync-p4-02-passed.md`；阶段三已完成，唯一值清单保留为历史授权事实。
