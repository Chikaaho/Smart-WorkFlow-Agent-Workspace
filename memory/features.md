# 功能摘要

2026-11-08｜Planner（审查04）｜0.3.1 返修不通过，H1—H5 返修中。

- 0.3.1：**审批意见/流程变量/脚本驱动流转（审查04 不通过，H1—H5 返修中，见 `product/three-sample-process-uat/receipts/planning-review-04.md`）**。意见字段写流程变量，条件分支/参与人/脚本/预约按意见流转（机制已锁定）；发布 tag `0.3.1`=`452178d8`，Web 保持 0.3.0；功能数保持 **51**。详见 `knowledge/features/0.3.1-approval-driven-flow.md`、回执 `receipts/execution-final-04.md`。

- 0.3.0：三示例流程（**Owner 2026-11-07 审核退回后由 0.3.1 返修替代**；原 `COMPLETED`/七阶段 7/0/0 已撤回，发布事实不回滚）。应用「运营与风险管理工作台」3 表单 3 流程 6 字典，B/C 由 Agent 研判建单；tag `0.3.0` 覆盖重指 Server `a0ac3a1a`/Web `420e0f9`。详见 `knowledge/features/0.3.0-three-sample-processes.md`。

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
