# 功能摘要

2026-11-10｜Planner（终态复核 P66）｜P66 多数据库兼容 `COMPLETED`（第 52 个功能，7/0/0）。

- 0.4.0：**P66 多数据库兼容（`COMPLETED`，第 52 个正式功能）**：PG、H2、MySQL 5.7/8.0、MariaDB、Oracle、SQL Server、openGauss 实测；DM8、KingbaseES 由 Owner 实库验证。Server tag `0.4.0`=`a4f6c278`；复核 `product/multi-database-compat/receipts/planning-final-review-p66-completed.md`。

- 0.3.1—0.3.6：**三示例流程返修（`COMPLETED`，审查07；功能数保持 51，不登记新功能）**。
  - 机制：审批意见写入流程变量（`opinion`/`opinion_<字段>`/`formData` 回写）、会签聚合 `opinionAgg_*`、触发器 `nodeOpinions` 注入；三流程意见驱动分支与处理人全部落地；意见展示（结构化字段、摘要每段“标签：值”、抽屉、会签弹窗）；只读 JSON 中文映射 `jsonDisplay` 与原文仅 `form:design:save` 可见。
  - 最终证据：A1 `YJ-20261108-008/009`、A2 `YJ-20261108-006`、B1 `XY-20261108-015`、B2 `XY-20261108-013`、B3 `XY-20261108-014`、C1 `MES-20261108-015`、C2 `MES-20261108-016`。
  - 发布：Web tag `0.3.6`=`c3f1d6e`（Release `438126185`）；Server 维持 `0.3.2`=`de8ec017`；UAT Web `index-CKdiXkhU.js`。
  - 详见 `knowledge/features/0.3.2-opinion-display.md`（最终交付登记）、回执 `terminal-sync-036-01.md`。

- 0.3.5—0.3.0：0.3.3—0.3.5 H6/H7（审查06）；0.3.2 意见展示返修（H1—H5）；0.3.1 意见驱动流转机制（意见→变量→分支/参与人）；0.3.0 初版被 Owner 退回后返修。详见各功能文件。

- 0.2.0—0.2.4：均 `COMPLETED`（七阶段 7/0/0，已发布并部署 UAT）。0.2.4=第 **51** 个正式功能（README 示例二/三）；0.2.2=第 50 个；0.2.3=Agent graph 增强（功能数保持 50）；0.2.1=29 项缺陷列车。

缺陷修复不增加正式业务功能数，不核销 P 编号。
