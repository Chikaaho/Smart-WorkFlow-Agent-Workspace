# 0.2.2 第 3 阶段 规划审查（第 2 次）

日期：2026-11-05。审查角色：规划。

审查对象：
- `close-sync-022-02.md`，含第五节续段；
- 日志 `assets/close-022-gates-server-r2.log`；
- 根仓 `c374cf0a`、`373020da`。

上次审查：`planning-review-close-022-01.md`。

## 结论

`VERIFYING`。上轮的 4 个测试类已修好，C022-G1 锁定。

CI 打开 PG 后，又有两个测试失败。这两个在本版修，修好后 CI 才能全绿，第 4 阶段才能开始。

另外，回执续段里有三件事超出了“先报告再做”的边界，要先补齐事实：
1. 推送到 main；
2. 产出 Release；
3. 在 UAT 上的操作。

UAT 现在健康检查是 DOWN，这一项最先处理。

## 本次锁定

- **C022-G1：**
  - Server `8004fb17` 只改了 4 个测试类；
  - 全工程 `mvn test` exit=0，14 个模块合计 2353 / 0 / 0 / 32 跳过；
  - 日志里没有 Failures 或 Errors 非零的汇总行，`sw-bootstrap` 之后的模块也都跑了；
  - `F1ProviderModelMigrationPostgresTest` 在 PG 上第一次 4/4 通过；
  - 终点断言改成从类路径读取最新迁移，不再写死版本号。
- **CI 的 PG 服务容器：**
  - 端口用 55432，避开 H7 测试对 5432 的探测；
  - `AC_G4_PG_URL` 用完整 JDBC URL；
  - 这两点都有实测依据，可以保留。

## 新发现的两例，本版修

| 测试 | 现象 | 规划判断 |
|---|---|---|
| `ApplicationCenterRecoveryDrillPostgresTest` | Flyway validate 报“本地找不到已执行的 0.1.7”；断言写死“只执行 V0.1.8～0.1.10，终点 0.1.10” | 和 P62/P64 是同一个问题。0.2.0 做种子压缩以后，这个测试的起点就失效了，只是一直被跳过，没有暴露。修法：起点改成当前在役基线 0.2.0，终点从类路径读取最新迁移。演练的步骤和断言意图（备份、升级、恢复后数据还在）不变 |
| `P62UpgradeGatePgTest.upgradeConsumesLegacyTypesKeepsHistory` | “命令未被领取” | 已在 `todo/p62-upgrade-gate-test-claim-race.md` 登记，是测试装置的时序问题，CI 开了 PG 后真的触发了。按那份待办的口径修：解决测试认领和后台调度器之间的相互干扰，用有界的等待或隔离，不放宽业务规则，不跳过测试。分析下来如果是业务竞态，就停下来报告 |

## 要先补齐的事实

1. **main 与 Release。** 回执写了 CI run 在 main 的 `6b045da5` 上，PG 配置留在 main 的 `1679f877`，run #1（`a9fe8efa`）已经产出 Release `bootstrap.jar`（`build.version=0.2.2`）。按方向，合并顺序是 bundle → develop → main，Release 在第 5 阶段才做。需要回传：
   - Server 的 main、develop、`feature/0.2.2-bundle` 当前 SHA，以及它们之间的包含关系；
   - main 上是否已经有 0.2.2 的功能代码；
   - 是否已经存在 tag `0.2.2` 或名为 0.2.2 的 Release，有哪些资产；
   - Web 仓有没有同样的情况。

   现有的 Release 和 tag 先不删、不覆盖。等事实回来后，规划和 Owner 一起定怎么处理。
2. **UAT。** UAT 现在健康检查是 DOWN（仍是 0.2.1），回执认为原因是磁盘写满。第一件事是复查 health。回执要写明：
   - 清理后的可用空间；
   - health 状态；
   - 如果还是 DOWN，具体是哪个健康指标不通过。

   UAT 不能升级到 0.2.2，等第 5 阶段再做。

   pgvector 用 `dpkg --force-breaks` 装上，以及删除 0.2.0 备份 jar、npm 缓存、部署遗留文件，这些已经做了，不要求回退。以后在 UAT 上强制安装或删文件，要先报告。`/data/reasonix` 和 frp、ngrok 等 Owner 的东西继续不动。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "0.2.2",
  "revision": 15,
  "previous_revision": 14,
  "decision": "CONTINUE",
  "source_receipt": "product/0.2.2/receipts/close-sync-022-02.md",
  "items": [
    {
      "origin_id": "C022-G1",
      "subject": "整版回归服务端全量测试",
      "criterion": "整版方向第 3 阶段：Server 按工程宪法跑合并前要求的测试范围并通过",
      "status": "RESOLVED",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/close-sync-022-02.md 一～三", "product/0.2.2/receipts/assets/close-022-gates-server-r2.log"],
      "scope": {
        "targets": ["P62NonEmptyUpgradePgTest", "P64AppendMigrationUpgradePostgresTest", "P64RollbackBoundaryPostgresTest", "F1ProviderModelMigrationPostgresTest"],
        "allowed_actions": ["修改上述测试类", "全工程 mvn test"],
        "forbidden_actions": ["修改产品代码", "修改或新增迁移脚本", "跳过、禁用或删除测试", "把终点改成另一个写死的版本号", "降低断言意图"],
        "constraints": {"分支": "Server feature/0.2.2-bundle", "日志": "完整存 receipts/assets/close-022-gates-server-r2.log"}
      },
      "acceptance": ["已锁定"]
    },
    {
      "origin_id": "C022-G2",
      "subject": "恢复演练测试在 CI 实跑通过",
      "criterion": "整版方向第 4 阶段：ApplicationCenterRecoveryDrillPostgresTest 在 CI 上必须实际跑通",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/close-sync-022-02.md 五"],
      "diagnosis": {
        "location": "Server sw-bootstrap：ApplicationCenterRecoveryDrillPostgresTest",
        "observed": "CI run 41931095709 中 Flyway validate 报 applied migration not resolved locally: 0.1.7；断言写死只执行 V0.1.8/0.1.9/0.1.10、终点 0.1.10",
        "expected": "演练从当前在役基线 0.2.0 出发，升级到类路径上实际最新的版本化迁移，备份、升级、恢复后数据仍在的断言意图不变，CI 实跑通过且 Skipped 0",
        "cause": "该测试自 0.1.7 期建立，0.2.0 种子压缩后起点失效，本地缺 pg_dump、CI 缺 PG 一直跳过未暴露",
        "next_action": "只改该测试类：起点改为在役基线 0.2.0，终点取类路径最新版本化迁移，复用 P62/P64 已有的 helper"
      },
      "scope": {
        "targets": ["ApplicationCenterRecoveryDrillPostgresTest"],
        "allowed_actions": ["修改上述测试类", "CI 实跑"],
        "forbidden_actions": ["修改产品代码", "修改或新增迁移脚本", "跳过、禁用或删除测试", "写死任何终点版本号", "降低演练断言意图"],
        "constraints": {"分支": "Server feature/0.2.2-bundle", "CI 结果": "回执写明 run 号与该测试的 Tests/Failures/Errors/Skipped"}
      },
      "acceptance": ["该测试在 CI 上 Skipped 0、Failures 0、Errors 0", "起点为在役基线 0.2.0，终点不含写死版本号", "改动只在该测试类内"]
    },
    {
      "origin_id": "C022-G3",
      "subject": "升级门测试领取竞态",
      "criterion": "整版方向第 4 阶段：合并前 CI 全绿；todo/p62-upgrade-gate-test-claim-race.md：不得以放宽业务规则或跳过测试消除失败",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/close-sync-022-02.md 五", "todo/p62-upgrade-gate-test-claim-race.md"],
      "diagnosis": {
        "location": "Server sw-bootstrap：P62UpgradeGatePgTest.upgradeConsumesLegacyTypesKeepsHistory",
        "observed": "CI 开启 PG 服务后断言“命令未被领取”失败；0.1.7 期 CI 曾同样失败，同提交本地通过",
        "expected": "测试认领与后台调度器互不干扰，CI 连续两次实跑该类全部通过",
        "cause": "测试装置时序：测试认领与共享 PG 实例上的后台 command-dispatcher 竞争，待执行方复现确认",
        "next_action": "复现并区分业务竞态与测试装置时序；属测试装置时只在该测试类内改善隔离或用有界等待；属业务竞态时停下报告规划"
      },
      "scope": {
        "targets": ["P62UpgradeGatePgTest"],
        "allowed_actions": ["修改上述测试类", "CI 实跑"],
        "forbidden_actions": ["修改产品代码", "放宽业务规则", "跳过、禁用或删除测试", "CI 失败自动重试", "无上限等待"],
        "constraints": {"分支": "Server feature/0.2.2-bundle", "验证": "CI 连续两次实跑该类通过，回执写明两个 run 号"}
      },
      "acceptance": ["回执写明根因属测试装置时序的依据", "CI 连续两次实跑该类全部通过", "改动只在该测试类内"]
    }
  ],
  "history_summary": {"revision": 14, "review": "product/0.2.2/receipts/planning-review-close-022-01.md", "retained_count": 22, "status_counts": {"RESOLVED": 22}}
}
```
