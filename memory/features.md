# 功能摘要

2026-11-08｜Planner（审查05）｜0.3.2 PASSED。

- 0.3.2：**意见展示与真实业务数据返修（H1—H5，审查05 `PASSED`）**。流转记录意见摘要、审批详情抽屉逐项字段（姓名/本地时间）、会签人各自意见；旧 HTML 富文本、部门名称回读、单选横排、重复标签修复；发布后同版本覆盖修复意见详情数组字段重复。UAT 7 条真实路径全 APPROVED；发布 tag `0.3.2`（Server `de8ec017`/Web `3b0043f`），UAT build.version=0.3.2；功能数保持 **51**。详见 `knowledge/features/0.3.2-opinion-display.md`、回执 `receipts/execution-final-05.md`。

- 0.3.1：意见→流程变量、条件分支/参与人/脚本/预约按意见流转（机制锁定）；审查04 因展示与数据不通过，由 0.3.2 返修替代。详见 `knowledge/features/0.3.1-approval-driven-flow.md`。

- 0.3.0：三示例流程初版（3 表单 3 流程 6 字典，Agent 研判建单），Owner 退回后由 0.3.1/0.3.2 返修。详见 `knowledge/features/0.3.0-three-sample-processes.md`。

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
