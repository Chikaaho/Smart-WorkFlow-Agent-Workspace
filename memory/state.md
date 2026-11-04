# 当前状态摘要

2026-11-05｜Planner｜`READY 1.3.3`。

## 活动交付

0.2.2（Owner 已确认版本号），F1、F2 均 `PASSED`，进入第 3 阶段。整版方向 `product/0.2.2/ready/direction-022-close-release.md`（覆盖第 3—7 阶段，唯一终态值：功能数 50（D022-16，整版记一个）、清单 46/22/22＝90、ADV64/问题57、P 编号不变、验证基线新增 []、迁移终点 V0.2.6）。F1、F2 主方向与范围草稿已归档到 `product/0.2.2/passed/`；决策 `product/0.2.2/decision-records-022.md`（D022-01～16）。

- F1 Agent 完善（XL）三阶段通过：`planning-review-f1-stage1-03.md` / `stage2-03.md` / `stage3-02.md`（终点 Server `897983e0` / Web `c83a479`）。真实 Embedding 用 OpenRouter（D022-09）。
- F2 应用导入导出（L）通过：`planning-review-f2-04.md`，账本 revision 12 FINISH（Server `feature/0.2.2-bundle` @ `d61dceca` / Web `c8a2eb1`）。
- Key 只以密文存在本地库 `smart_workflow_f1v4b`（保留）；UAT 由 Owner 在页面录入，不迁移。

第 3—5 阶段要点：整版回归（门禁＋F1/F2 各一次冒烟，headless=false 截图）；补应用导入导出操作说明（含“同名数据源需先给相关用户授权”）；合并时 `ApplicationCenterRecoveryDrillPostgresTest` 在 CI 跑通；UAT 先装 pgvector 再升级，装不了停下由 Owner 决定是否延期 RAG。

唯一下一动作：Executor 按 `product/0.2.2/ready/direction-022-close-release.md` 完成第 3 阶段并提交 `close-sync-022-01.md`，随后连续推进合并、发布、发布后同步。

0.2.1 已 `COMPLETED`（`product/0.2.1-bugfix/receipts/planning-final-review-021-completed.md`）。

## 已完成基线

0.2.1：台账 B021-001～029 共 29 项 Owner 全部通过（根仓 `eb5fffb9`）；Server tag `0.2.1`→`5c33eab3`、Web→`07568b57`；发布轮 CI 成功，UAT 已就地升级至 0.2.1（health UP、启动 ERROR 0）。开发版本 Server `0.2.1-SNAPSHOT`、Web `0.2.1`。

0.2.0 已完成并发布（Server `39dcedb7` / Web `f5ec5a1`），历史验收锁定。功能数 49、清单 46/22/22＝90、ADV64/问题57、P 编号与正式基线均未变。

## 进度

0.2.2 总 7 阶段：已完成 2（需求评估、执行），进行中 1（验收与同步），未开始 4（合并、发布、发布后同步、结束）。
