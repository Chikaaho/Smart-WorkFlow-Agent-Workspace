# 规划终态复核：三示例流程返修 0.3.1—0.3.6 COMPLETED

2026-11-08｜规划｜依据 `receipts/terminal-sync-036-01.md`（终态同步批次 `d273fbc3`、补记 `7cf37b8f`）、memory、todo、version.json、README 当前入口｜结论：**`COMPLETED`**，整体七阶段 7/0/0

## 9 项复核

| # | 项 | 结果 |
|---|---|---|
| 1 | 单一功能状态 | state、handoff、features、README（memory）、需求池、version.json、根 README 都是 PASSED，待终态复核，没有冲突；本复核后改为 COMPLETED |
| 2 | 功能数 | 51，各入口一致（Owner 定不登记） |
| 3 | 计数、P 编号、明细 | M59/18/13、ADV1/7/56、实际 P63、问题 57，P 不核销，都一致；没有新增功能 ID。P66 为并行新需求（READY），终态时登记第 52 个功能，与本功能无关 |
| 4 | 验证基线 | 授权 []、涉及 []、回执 []，一致 |
| 5 | 活动功能 | 三示例流程线没有活动功能；并行的 P66 单独在途，不与本功能重复 |
| 6 | 下一动作与残留 | 回执写的是“Planner 终态复核”，本复核后改为“三示例流程线结束；P66 继续阶段 A”（规划已修正 memory 和需求池）。memory/README 头部的治理版本由 1.3.4 改为 1.3.6 |
| 7 | 目录 | 返修方向 `direction-approval-comment-rework-031.md`、终态同步方向 `direction-terminal-sync-036.md` 都在 `passed/`；`ready/` 已清空 |
| 8 | 写入与事实 | 覆盖矩阵 11 个入口与回读一致；version.json 发布事实（Web 0.3.6 `c3f1d6e`、Server 0.3.2 `de8ec017`、UAT `index-CKdiXkhU.js`）与审查 07 一致；develop-sw 远端与本地 HEAD 一致 |
| 9 | memory 压缩 | 每个文件 <5KB，总量 19,204 B <20KB（本复核修改后另行回读） |

knowledge 不在规划可读范围，按回执覆盖矩阵和回读声明采信。根 README、version.json 中“待 Planner 终态复核”的表述属于执行写入范围，下次同步（P66 发布后同步）时改成 COMPLETED，不单独返工。

## 发布事实（与功能状态分开写）

正式/部署：Web 0.3.6（tag `c3f1d6e`，Release `438126185`）；Server 0.3.2（tag `de8ec017`，Release `437820040`）；UAT build.version=0.3.2，Flyway V0.2.9。Web 0.3.2 tag 同版本覆盖已由 Owner 追认。0.3.3 起都按递增补丁发布，没有覆盖已发布的 tag。

## 遗留（已入需求池观察区）

- 应用包维持 `systemVersion=0.3.2`，缺独立意见表单定义、触发器脚本、Agent 图和 IoT 规则，补建方法已写入功能文件；
- 设计器映射编辑框只对 JSON 场景显示；
- 演示实例按真实节奏分时审批（Owner 需要时再安排）；
- UAT 磁盘 96%。
