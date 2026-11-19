# 功能摘要

2026-11-19｜规划｜最新：1.1.3 补丁立项（不计功能数，正式功能数 58）。

- 1.1.3：**超时恢复与取消显示补丁（阶段 3 PASSED，七阶段 3/1/3，合并中）**：B1=P72、B2=P73、B3 发生时间、B4 执行历史入口 ID 精度，另修 E2 父跳子详情不刷新；两仓发 `1.1.3`。方向 `product/v1.1.3-patch/ready/direction-v1.1.3.md`。
- 1.1.2：**取消与显示补丁（`COMPLETED`，P70/P71 核销）**：Server、Web tag `1.1.2`=`c3724e52`/`abfe1339`，UAT 已部署。终审 `product/v1.1.2-patch/receipts/planning-review-112-06.md`。
- 1.1.0：**Graph 设计器列车（`COMPLETED`，功能 56—58）**：Server tag `1.1.0`=`6d6bd666`；Web `1.1.1`=`3cc05844`（Owner 追认）。终审 `product/v1.1.0-graph-designer/receipts/planning-review-110-07.md`。
- 1.0.0：`COMPLETED`，见 `product/v1.0.0-release/`。

- 0.4.1/0.3.8：**W-c 会签意见摘要与部门、W-a2 画布连线/缩放、W-b2 长表单复测、W-e 列表时间**：Server 任务详情补 `opinionFields`/`assigneeDept`（共享 enricher），Web 会签弹窗同源渲染；画布左右接点、fit 0.617 下节点/连线 12.34px；UAT `YJ-20261108-009` 表单 1218px/面板 447px；列表 `yyyy-MM-dd HH:mm`。Server tag `0.4.1`=`09549a49`、Web tag `0.3.8`=`6e9b7313`。回执 `execution-041-02.md`。

- 0.4.0：**P66 多数据库兼容（`COMPLETED`，第 52 个正式功能）**：PG、H2、MySQL 5.7/8.0、MariaDB、Oracle、SQL Server、openGauss 实测；DM8、KingbaseES 由 Owner 实库验证。Server tag `0.4.0`=`a4f6c278`；复核 `product/multi-database-compat/receipts/planning-final-review-p66-completed.md`。

- 0.3.0—0.3.6：三示例流程返修（`COMPLETED`，功能数保持 51）；Web tag `0.3.6`=`c3f1d6e`，Server `0.3.2`=`de8ec017`。详见 `knowledge/features/0.3.2-opinion-display.md`、回执 `terminal-sync-036-01.md`。

- 0.2.0—0.2.4：均 `COMPLETED`（七阶段 7/0/0，已发布并部署 UAT）。0.2.4=第 **51** 个正式功能（README 示例二/三）；0.2.2=第 50 个；0.2.3=Agent graph 增强（功能数保持 50）；0.2.1=29 项缺陷列车。

缺陷修复不增加正式业务功能数，不核销 P 编号。
