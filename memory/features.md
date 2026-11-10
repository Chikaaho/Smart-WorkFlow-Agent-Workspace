# 功能摘要

2026-11-10｜Executor｜Server 0.4.1 + Web 0.3.8 补丁发布并部署 UAT（不新增功能数，待阶段 7）。

- 0.4.1/0.3.8：**W-c 会签意见摘要与部门、W-a2 画布连线/缩放、W-b2 长表单复测、W-e 列表时间**：Server 任务详情补 `opinionFields`/`assigneeDept`（共享 enricher），Web 会签弹窗同源渲染；画布左右接点、fit 0.617 下节点/连线 12.34px；UAT `YJ-20261108-009` 表单 1218px/面板 447px；列表 `yyyy-MM-dd HH:mm`。Server tag `0.4.1`=`09549a49`、Web tag `0.3.8`=`6e9b7313`。回执 `execution-041-02.md`。

- 0.4.0：**P66 多数据库兼容（`COMPLETED`，第 52 个正式功能）**：PG、H2、MySQL 5.7/8.0、MariaDB、Oracle、SQL Server、openGauss 实测；DM8、KingbaseES 由 Owner 实库验证。Server tag `0.4.0`=`a4f6c278`；复核 `product/multi-database-compat/receipts/planning-final-review-p66-completed.md`。

- 0.4.0：**P66 多数据库兼容（`COMPLETED`，第 52 个正式功能）**：PG、H2、MySQL 5.7/8.0、MariaDB、Oracle、SQL Server、openGauss 实测；DM8、KingbaseES 由 Owner 实库验证。Server tag `0.4.0`=`a4f6c278`；复核 `product/multi-database-compat/receipts/planning-final-review-p66-completed.md`。

- 0.3.1—0.3.6：**三示例流程返修（`COMPLETED`，审查07；功能数保持 51，不登记新功能）**。
  - 机制：意见写入变量并驱动分支/处理人，会签聚合与触发器注入；结构化意见展示与 JSON 中文映射。最终证据 A1/A2/B1—B3/C1—C2 全部通过。
  - 发布：Web tag `0.3.6`=`c3f1d6e`（Release `438126185`）；Server 维持 `0.3.2`=`de8ec017`；UAT Web `index-CKdiXkhU.js`。
  - 详见 `knowledge/features/0.3.2-opinion-display.md`（最终交付登记）、回执 `terminal-sync-036-01.md`。

- 0.3.5—0.3.0：0.3.3—0.3.5 H6/H7（审查06）；0.3.2 意见展示返修（H1—H5）；0.3.1 意见驱动流转机制（意见→变量→分支/参与人）；0.3.0 初版被 Owner 退回后返修。详见各功能文件。

- 0.2.0—0.2.4：均 `COMPLETED`（七阶段 7/0/0，已发布并部署 UAT）。0.2.4=第 **51** 个正式功能（README 示例二/三）；0.2.2=第 50 个；0.2.3=Agent graph 增强（功能数保持 50）；0.2.1=29 项缺陷列车。

缺陷修复不增加正式业务功能数，不核销 P 编号。
