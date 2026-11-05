# 当前状态摘要

2026-11-05｜Planner｜0.2.2 第 3 阶段：冒烟、操作说明、同步、4 个测试类修复已锁定；剩 CI 两例测试和分支/发布/UAT 事实。

## 活动交付

0.2.2 整版交付（第 50 个正式功能，D022-16）功能级 `PASSED`：F1 Agent 完善（XL 三阶段）与 F2 应用导入导出（L）规划验收均通过；整版回归完成（方向 `product/0.2.2/ready/direction-022-close-release.md` revision 13，回执 `product/0.2.2/receipts/close-sync-022-01.md`）。回归起点 Server `feature/0.2.2-bundle` @ `d61dceca`、Web @ `c8a2eb1`（`vite.config.ts` 在途改动不入提交）。

- 第 3 阶段已交付：门禁（Web 四项绿 vitest 2017+3/build 5.18s；Server 全工程 compile 绿、test exit=1——**7 例 sw-bootstrap 测试侧确定性失败**：P62/P64 共 5 例断言写死基线终点 0.2.0 因 F1/F2 追加 0.2.2～0.2.6 迁移过期、F1ProviderModelMigrationPostgresTest 2 例 PG boolean 列按 int 读取（自 F1 起在 PG 从未绿、无 CI 全量未暴露）；产品链经冒烟证明正常；**按方向边界已上报规划处置，未自行修测**，日志 `receipts/assets/close-022-gates-*.log`）；f1v4b 冒烟 Flyway 0.2.5→v0.2.6，F1 graph 执行真实输出+快照 v2、F2 导出→导入→报告正常（截图 `receipts/assets/close-022-*.png`）；操作说明入 Web 仓 `docs/user-guide/operation-manual.md`（应用导入导出六要点）；knowledge/memory/todo 同步完成。
- 唯一终态值：功能数 50、清单 46/22/22＝90、ADV64/问题57、P 编号不变、基线新增 []、迁移终点 V0.2.6（f1v4b 实测回读）。

规划审查 `planning-review-close-022-01.md`（revision 14）：7 例本版修；`close-sync-022-02.md` 修好，Server `8004fb17` 全工程 2353/0/0/32，C022-G1 锁定。

规划审查 `product/0.2.2/receipts/planning-review-close-022-02.md`（revision 15 CONTINUE）：
- CI 开 PG 后新增两例本版修：恢复演练测试起点改在役基线 0.2.0（C022-G2）；`P62UpgradeGatePgTest` 领取竞态按待办口径修（C022-G3）。
- Executor 在合并前已推送 Server main（`6b045da5`、`1679f877`）并有 run 产出带 0.2.2 版本的 Release jar，需回传两仓分支、tag、Release 事实，已有 Release 不删不覆盖。
- UAT 已装 pgvector 0.8.7（`--force-breaks`），磁盘已清理，DB 已备份；**UAT health 当前 DOWN（仍 0.2.1）**，首要复查。

唯一下一动作：Executor 按 `product/0.2.2/receipts/planning-execution-prompt-close-022-02.md`：UAT health 复查 → 分支/发布事实 → 修两例测试，回执 `close-sync-022-03.md` 后停下，等规划定合并顺序与 Release 处理。

## 剩余阶段（门禁修好后连续推进）

1. 合并：bundle→develop→收敛 0.2.2 版本号与发布配置（CI 断言 0.2.1-SNAPSHOT 须改 0.2.2-SNAPSHOT）→main；`ApplicationCenterRecoveryDrillPostgresTest` 须 CI 实跑通过；vite.config.ts 不入；feature 远端分支去留按 0.2.1 惯例。
2. 发布：沿既有通道（两仓 build-release.yml，push main 触发）；UAT 先装 pgvector 再升级（D022-07/09），回读扩展、health UP、ERROR 数、Flyway 终点；Key 由 Owner 页面录入。
3. 发布后同步：knowledge 先行，回执 `receipts/release-sync-022-01.md`。

0.2.1 已 `COMPLETED`（UAT 在 0.2.1、health UP）。

## 进度

0.2.2 总 7 阶段：已完成 2（需求评估、执行），进行中 1（验收与同步：剩 CI 两例测试与事实核实），未开始 4（合并、发布、发布后同步、结束）。
