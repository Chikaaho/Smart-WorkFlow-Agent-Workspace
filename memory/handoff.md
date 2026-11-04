# 0.2.2 整版交付交接

## 1. 功能名称

0.2.2 整版交付（F1 Agent 完善 XL 三阶段＋F2 应用导入导出 L；D022-16 整版登记为第 50 个正式功能）。

## 2. 功能目标

F1、F2 验收通过后，完成整版回归、操作说明与状态同步，随后合并、发布 0.2.2、发布后同步。

## 3. 当前状态

功能级 `PASSED`（第 3 阶段同步完成，2026-11-05，回执 `product/0.2.2/receipts/close-sync-022-01.md`）。总 7 阶段：已完成 3，未开始 4（合并、发布、发布后同步、结束）。方向 `product/0.2.2/ready/direction-022-close-release.md`（revision 13，FINISH）。

## 4. 已完成内容

门禁：Web 四项绿（日志 `receipts/assets/close-022-gates-web.log`）；Server 全工程 compile 绿、test exit=1——**7 例 sw-bootstrap 测试侧确定性失败（回归上报，待规划处置）**：P62NonEmptyUpgradePgTest×3＋P64×2 断言写死基线终点 0.2.0（F1/F2 追加 0.2.2～0.2.6 迁移后过期）、F1ProviderModelMigrationPostgresTest×2 PG boolean 列按 int 读取（自 F1 起 PG 上从未绿、0.2.1 后无 CI 全量未暴露）；其余模块同轮全绿；产品迁移链经 f1v4b 0.2.5→v0.2.6 冒烟证明正常（日志 `receipts/assets/close-022-gates-server.log`）。冒烟：F1 已发布 graph 执行真实输出+快照 v2；F2 导出→导入预检→确认→报告正常（截图 `receipts/assets/close-022-*.png`）。操作说明：Web 仓 `docs/user-guide/operation-manual.md` 增「应用导入导出」节。同步：knowledge 权威状态/功能注册/索引（49→50）、memory、requirement-pool 均更新。

## 5. 实际工程结果

回归起点：Server `feature/0.2.2-bundle` @ `d61dceca`、Web @ `c8a2eb1`。迁移终点 V0.2.6（f1v4b 实测）。功能数 50、清单 46/22/22＝90、ADV64/问题57、P 编号不核销、基线新增 []。

## 6. 验收规则

F1、F2 已通过验收项全部锁定；整版回归不重做各项断言，只确认合并前同一提交上功能合跑正常。

## 7. 当前系统基线

0.2.1 已发布并部署 UAT（正式/部署版本 0.2.1；开发版本 Server `0.2.1-SNAPSHOT`、Web `0.2.1`）。0.2.2 未合并未发布；本地 `smart_workflow_f1v4b` 已升 v0.2.6（保留不清库）。

## 8. 未完成内容

**前置依赖：7 例 sw-bootstrap 门禁失败的处置（规划裁决：本版修/延期/口径改法——与第 4 阶段「种子压缩」要求联动）。** 之后：第 4 阶段合并（bundle→develop→版本收敛 0.2.2/发布配置→main；CI 实跑 `ApplicationCenterRecoveryDrillPostgresTest`）、第 5 阶段发布与 UAT（pgvector 先装后升级）、第 6 阶段发布后同步（`receipts/release-sync-022-01.md`）。

## 9. 已知风险

CI build-release.yml 断言 develop 默认版本 `0.2.1-SNAPSHOT`，版本收敛须同步改；UAT 系统盘历史满水位（发布前复核）；`vite.config.ts` 在途改动不得入提交；密钥不入文件/回执/截图，UAT 模型 Key 由 Owner 页面录入。

## 10. 唯一下一动作

Executor 按方向连续推进第 4—6 阶段；第 7 阶段规划复核归档后 `COMPLETED`。

## 11. 下一轮完成标准

两仓 main 携 0.2.2、tag/Release/CI/制品/部署版本回读一致、UAT health UP 且 Flyway 终点 V0.2.6、发布后同步回执覆盖完整，规划复核通过。

## 12. 必须读取

`system.md`、`roles/executor.md`、方向 `ready/direction-022-close-release.md`、`decision-records-022.md`、两份同步回执、两端工程宪法。

## 13. 常规决定

D022-01～16（`product/0.2.2/decision-records-022.md`）；真实 Embedding 用 OpenRouter（D022-09）；UAT 顺序 pgvector 先装后升级（D022-07/09）。
