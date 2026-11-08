# 三示例流程 0.3.1—0.3.6 返修：终态同步与发布后同步

2026-11-08｜规划 → 执行｜依据 `receipts/planning-review-07-passed.md`（功能 PASSED）。本文件是当前唯一执行入口，第③、⑥阶段的同步一次做完；合并和发版已经完成，不要重做。返修方向 `direction-approval-comment-rework-031.md` 已由规划移到 `passed/`。

## 1. 唯一终态值清单（执行方不得自行计算或改值）

| 字段 | 值 |
|---|---|
| 功能状态 | 三示例流程返修（0.3.1—0.3.6）`PASSED`；规划终态复核通过后为 `COMPLETED` |
| 已完成功能数 | 51，不变（Owner 定不登记） |
| 清单计数 | M59/18/13=90、ADV1/7/56=64，不变 |
| P 编号 | 本次不核销；实际 P63；P66（多数据库兼容）为并行新需求，已由规划登记，状态 READY |
| 问题数 | 57，不变 |
| 交付内容登记 | 写入 `knowledge/features/0.3.2-opinion-display.md`（或同目录的汇总文件）：审批意见写入流程变量（`opinion`、`opinion_<字段>`）、会签意见聚合 `opinionAgg_*`、触发器 `nodeOpinions` 注入；三个流程由意见驱动的分支和处理人（A 需补充、高风险加签、停机>240 加副总、调整窗口改预约时间、现场总指挥；B 误报、现场处置人、超时督办、上报范围；C 原因分类、指派维修人、偏差>3℃ 强制校准、停机走复产）；意见展示（结构化字段、摘要每段“标签：值”、意见抽屉、会签弹窗）；只读 JSON 中文映射 `jsonDisplay` 与原文权限门禁；UAT 最终证据实例 A1 `YJ-20261108-008/009`、A2 `YJ-20261108-006`、B1 `XY-20261108-015`、B2 `XY-20261108-013`、B3 `XY-20261108-014`、C1 `MES-20261108-015`、C2 `MES-20261108-016` |
| 验证基线集合 | []（正式基线不变） |
| 发布事实 | 正式/部署：Web **0.3.6**（tag `0.3.6`=`c3f1d6e`，Release `438126185`）；Server **0.3.2**（tag `0.3.2`=`de8ec017`，Release `437820040`）；UAT build.version=0.3.2，Web 入口 `index-CKdiXkhU.js`，Flyway V0.2.9。Web 0.3.2 tag 同版本覆盖已由 Owner 追认（2026-11-08，维持 `3b0043f`） |
| 应用包 | 维持 `systemVersion=0.3.2` 导出；缺项（独立意见表单定义、触发器脚本、Agent 图、IoT 规则）和补建方法写入 knowledge 功能文件 |
| 需求池观察区新增 | 设计器映射编辑框只对 JSON 场景显示；演示实例按真实节奏分时审批（Owner 需要时再安排）；UAT 磁盘水位 96% |
| 活动功能 | 三示例流程：无；并行：P66 多数据库兼容（XL，READY） |
| 当前唯一下一动作 | 同步完成后，三示例流程线为“Planner 终态复核 0.3.6”；P66 线不受影响 |
| 目录 | 返修方向 `passed/direction-approval-comment-rework-031.md`；本终态同步方向规划复核后移到 `passed/` |

## 2. 同步范围

- 先写 knowledge：`knowledge/current-status.md`（当前段改为 PASSED、待终态复核，并写明 P66 并行在途）、`knowledge/session-handoff.md`、功能文件。
- 再同步：`memory/state.md`、`handoff.md`、`features.md`；`todo/requirement-pool.md` 三示例流程当前段（改为规划验收通过的口径，P66 段保持不动）；`version.json`、README 现状段（只改受影响的部分）。
- memory：每个文件 <5KB，总量 <20KB；回执写明压缩前后的字节数。
- 不重跑测试，不碰 tag、Release、UAT 和 P66 的任何文件。

## 3. 回执

写入 `receipts/terminal-sync-036-01.md`：覆盖矩阵（入口、写入值、回读结果）、memory 字节数、提交 SHA。
