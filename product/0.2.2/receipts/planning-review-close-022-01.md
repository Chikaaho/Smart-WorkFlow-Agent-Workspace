# 0.2.2 第 3 阶段 规划审查（第 1 次）

日期：2026-11-05。审查角色：规划。

审查对象：
- 回执 `close-sync-022-01.md`；
- 门禁日志 `assets/close-022-gates-server.log`、`assets/close-022-gates-web.log`；
- 三张冒烟截图 `assets/close-022-*.png`；
- 根仓提交 `6130884f`、`fc6e3310`。

方向：`ready/direction-022-close-release.md`。

## 结论

`VERIFYING`：冒烟、操作说明和同步都通过，锁定。

服务端全量测试有 7 例失败，回执已按方向边界上报。规划裁定**在本版修**，修好后进入第 4 阶段。

## 本次锁定

| 项 | 依据 |
|---|---|
| F1 冒烟 | 截图：执行记录状态为“已完成”、快照版本 v2；节点轨迹为 开始 → 知识检索（1.58s）→ LLM 调用（输入 235 / 输出 66）→ 结束，全部成功；变量里能看到三份文档的真实检索片段和相似度；页面上没有 Key |
| F2 冒烟 | 预检截图：显示“目标租户已有同名应用，导入时自动加后缀”，USER 置空。报告截图：新建应用“回归冒烟应用-导入”，顶部是“字典 新建 0 · 复用 0”的双口径，置空区有 USER；列表里能看到原应用和导入的副本 |
| 迁移 | 本地库 `smart_workflow_f1v4b` 从 0.2.5 升到 v0.2.6，`flyway_schema_history` 回读一致 |
| Web 门禁 | typecheck、lint 0 错误；vitest 2017 passed / 3 skipped；build 通过 |
| 操作说明 | Web `docs/user-guide/operation-manual.md` 新增“应用导入导出”一节，六个要点齐全，其中有“同名数据源先授权” |
| 同步 | knowledge 的功能数 50、本版功能登记、memory、todo 都已写入。两仓 README 暂不改版本号，留到第 4、6 阶段，这个理由成立 |

## 7 例失败的裁定

日志汇总：`sw-bootstrap` Tests run 307，Failures 5，Errors 2，Skipped 32。

| 测试 | 现象 | 规划判断 |
|---|---|---|
| `P62NonEmptyUpgradePgTest` ×3、`P64AppendMigrationUpgradePostgresTest` ×1、`P64RollbackBoundaryPostgresTest` ×1 | 断言“终点应为最新迁移”，期望值写死为 `0.2.0`，实际是 `0.2.6` | 测试本来要比较的是“最新迁移”，写死的字面量过期了。产品行为是对的 |
| `F1ProviderModelMigrationPostgresTest` ×2 | 按 int 读取 PG 的 boolean 列 `enabled`，报“不良的类型值 int : t/f” | 测试读法写错了。这个测试在 PG 上从来没跑通过，F1 阶段 1 的验收没有发现，属于规划和执行共同的漏检 |

**为什么本版修：**
1. 第 4 阶段合并要求 CI 全绿，这 7 例不修就合不进去。
2. 修法只动测试代码，不碰产品代码和迁移，风险可控。

只把字面量改成 `0.2.6` 不行：第 4 阶段还可能做种子压缩，终点会再变，下一次照样会坏。所以这 5 例要改成比较“当前类路径上实际最新的版本化迁移”。

**全量重跑：** 回执说“其余模块同轮全绿”，但 Maven 遇到失败的模块就会停，排在 `sw-bootstrap` 之后的模块可能没有跑。修完以后要整个工程重跑一次全量测试，exit=0 才算通过。

## 记忆纠正

Executor 写的 `memory/README.md` 和 `state.md` 说“第 3 阶段已完成，连续推进第 4—6 阶段”。这和回执“处置前不启动第 4 阶段”矛盾。规划已改成：第 3 阶段剩服务端门禁一项。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "0.2.2",
  "revision": 14,
  "previous_revision": 13,
  "decision": "CONTINUE",
  "source_receipt": "product/0.2.2/receipts/close-sync-022-01.md",
  "items": [
    {
      "origin_id": "C022-G1",
      "subject": "整版回归服务端全量测试",
      "criterion": "整版方向第 3 阶段：Server 按工程宪法跑合并前要求的测试范围并通过",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/close-sync-022-01.md 一、五.1", "product/0.2.2/receipts/assets/close-022-gates-server.log"],
      "diagnosis": {
        "location": "Server sw-bootstrap：P62NonEmptyUpgradePgTest、P64AppendMigrationUpgradePostgresTest、P64RollbackBoundaryPostgresTest、F1ProviderModelMigrationPostgresTest",
        "observed": "Tests run 307，Failures 5，Errors 2：5 例期望终点写死 0.2.0 而实际 0.2.6；2 例按 int 读 PG boolean 列 enabled 报不良的类型值",
        "expected": "升级门测试比较当前实际最新的版本化迁移；F1 迁移测试按 boolean 读取 enabled；全工程 mvn test exit=0",
        "cause": "F1/F2 追加 V0.2.2～V0.2.6 后未更新写死的终点；F1 迁移测试在 PG 上的读法错误，逐轮门禁只跑模块范围未暴露",
        "next_action": "只改这 4 个测试类：终点断言改为取类路径上最新的版本化迁移，enabled 改为按 boolean 断言；全工程重跑 mvn test"
      },
      "scope": {
        "targets": ["P62NonEmptyUpgradePgTest", "P64AppendMigrationUpgradePostgresTest", "P64RollbackBoundaryPostgresTest", "F1ProviderModelMigrationPostgresTest"],
        "allowed_actions": ["修改上述测试类", "全工程 mvn test"],
        "forbidden_actions": ["修改产品代码", "修改或新增迁移脚本", "跳过、禁用或删除测试", "把终点改成另一个写死的版本号", "降低断言意图"],
        "constraints": {"分支": "Server feature/0.2.2-bundle", "日志": "完整存 receipts/assets/close-022-gates-server-r2.log"}
      },
      "acceptance": ["全工程 mvn test exit=0，汇总行 Failures 0 Errors 0", "5 例终点断言取类路径上实际最新的版本化迁移，不含写死的版本号", "F1ProviderModelMigrationPostgresTest 在 PG 上 4/4 通过", "改动只在上述 4 个测试类内"]
    }
  ],
  "history_summary": {"revision": 13, "review": "product/0.2.2/ready/direction-022-close-release.md", "retained_count": 22, "status_counts": {"RESOLVED": 22}}
}
```
