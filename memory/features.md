# 功能摘要

2026-11-07｜Executor（同步）｜`READY 1.3.4`。

- 0.3.0：三示例流程交付并发布（执行侧 6/0/1，待 Planner 验收总回执 `product/three-sample-process-uat/receipts/execution-final-01.md`）；功能数保持 **51**、P 编号不核销。内容：应用「运营与风险管理工作台」3 表单（25/20/23 字段）+3 流程（7/7/6 节点：技术委员会会签、按参与部门动态并行、抄送、条件分级、定时预约 MQTT）+3 字典；本地 12 实例与 UAT 5 实例实跑覆盖（YJ-20261107-001 两路并行/会签/命令 `2118776467725312002`，XY P1/P0，MES RAPID_RISE/>85 紧急）。修复审批人空值 NPE、应用包字典项丢弃、预约载荷二次编码、Agent 工具信封/业务键超长。发布：Server tag `0.3.0`→`b4af4c3e`、Web→`271d40c`；Release 436832133/436817268；UAT build.version=0.3.0、Flyway v0.2.9、health UP。能力见 `knowledge/features/0.3.0-three-sample-processes.md`。

- 0.2.4：`COMPLETED`（规划 2026-11-06 终态复核 `product/0.2.4/receipts/planning-final-review-024-completed.md`），七阶段 7/0/0，已发布并交付 UAT（第 **51** 个正式功能；P 编号不核销；tag Server `41511bd4`/Web `f4acc3d`，语义 Release latest=0.2.4，UAT Flyway v0.2.9、health UP、build.version=0.2.4）。README 示例二/三落地：IoT 规则启动 Agent 图、失败即升级（级别+双渠道）、Agent 内部工具、渠道凭据密文、规则页研判参数；真实 OpenRouter 搜索/LLM/163 SMTP。能力见 `knowledge/features/0.2.4-readme-examples-2-3.md`。

- 0.2.3：`COMPLETED`（规划 2026-11-06 终态复核 `product/0.2.3/receipts/planning-final-review-023-completed.md`），七阶段 7/0/0。
  - 内容：Agent graph 异步受理、三协议流式、afterSequence 续传、取消、重启恢复、两Key轮换；真实供应商实测通过。
  - 作为既有 Agent graph 增强，功能数保持 50；P20 不核销。清单 M59/18/13、ADV1/7/56、9 项 P 核销确认。
  - 发布：tag `0.2.3` 指向 `9b86ff0d` / `47106e8`，UAT 已升级（v0.2.7）。方向归档 `product/0.2.3/passed/`。

- 0.2.0：`COMPLETED`，七阶段已结束并发布；五项目标、A01—A17 和原 500 项保持关闭。
- 0.2.1 缺陷修复列车：`COMPLETED`（规划 2026-11-03 终态复核），七阶段 7/0/0；29 项 Owner 通过，已发布并部署 UAT。
- 0.2.2：`COMPLETED`（规划 2026-11-05 终态复核），七阶段 7/0/0。
  - 内容：F1 Agent 完善（XL）、F2 应用导入导出（L）。
  - 整版登记为一个功能：第 50 个正式功能（D022-16），见 `knowledge/features/0.2.2-integrated-release.md`。
  - 发布：tag `0.2.2` 指向 `0bf4c938` / `3bcd7c2`，已发语义 Release，UAT 已升级（v0.2.6）。
  - P 编号不核销。

缺陷修复不增加正式业务功能数，不核销 P 编号。
