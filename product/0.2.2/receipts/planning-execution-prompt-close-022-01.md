# 0.2.2 第 3 阶段 补充执行提示（第 1 次）

日期：2026-11-05。下发角色：规划；承接角色：执行（Executor）。

依据：`planning-review-close-022-01.md`。方向：`ready/direction-022-close-release.md`。

冒烟、操作说明和同步已经锁定，不重做。本轮只修服务端 4 个测试类，修好后接着推进第 4—6 阶段，中间不用停下来等规划。

## 要做的事

在 Server `feature/0.2.2-bundle` 上：

1. **升级门测试的终点断言。** 涉及 `P62NonEmptyUpgradePgTest`（3 例）、`P64AppendMigrationUpgradePostgresTest`（1 例）、`P64RollbackBoundaryPostgresTest`（1 例）。
   - 期望值要改成“当前类路径上实际最新的版本化迁移”。
   - 如果仓库里已经有获取最新迁移版本的工具方法，直接复用；没有的话，在测试侧读取迁移资源得出。
   - 不得换成另一个写死的版本号。第 4 阶段如果做种子压缩，终点还会变，到时这些测试不用再改。
2. **F1 迁移测试的读法。** `F1ProviderModelMigrationPostgresTest` 里的 `enabled` 是 PG boolean 列，要按 boolean 读取和断言。断言的意图不变：OpenAI 那一行启用，其他行停用。
3. **全量重跑。** 整个工程重跑一次 `MAVEN_OPTS=-Xmx2g mvn -q test`，确认包括排在 `sw-bootstrap` 之后的所有模块都实际跑过。日志完整存到 `receipts/assets/close-022-gates-server-r2.log`。
4. **提交。** 提交并推送，回执写明提交号。

## 禁止

- 修改产品代码；
- 修改或新增迁移脚本；
- 跳过、禁用或删除测试；
- 降低断言意图。

如果修完还有别的测试失败，先判断它和本轮改动有没有关系，再报告规划，不要自行扩大范围。

## 完成条件

- 全工程 `mvn test` exit=0，汇总里 Failures 0、Errors 0；
- 5 例终点断言不再包含写死的版本号；
- `F1ProviderModelMigrationPostgresTest` 在 PG 上 4/4 通过；
- 改动只在这 4 个测试类里。

## 回执

1. 本轮写 `receipts/close-sync-022-02.md`，内容包括：
   - 改动摘要；
   - 全量测试的汇总行；
   - 各模块的通过数；
   - 日志位置。
2. 写完回执后，直接按方向推进第 4—6 阶段（合并 → 发布 0.2.2 → 发布后同步）。第 4 阶段的 CI 结果写进同一份回执或 `release-sync-022-01.md`。

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
