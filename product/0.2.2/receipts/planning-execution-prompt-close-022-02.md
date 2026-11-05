# 0.2.2 第 3 阶段 补充执行提示（第 2 次）

日期：2026-11-05。下发角色：规划；承接角色：执行（Executor）。

依据：`planning-review-close-022-02.md`。方向：`ready/direction-022-close-release.md`。

C022-G1 已锁定，不重做。按下面的顺序做，第 1、2 步的结果先写进回执，再做第 3 步。

## 1. UAT 健康复查（最先做）

UAT 仍是 0.2.1，健康检查为 DOWN。

1. 复查 health，回执写明：
   - 清理后的磁盘可用空间；
   - health 状态；
   - 如果仍是 DOWN，具体是哪个健康指标不通过。
2. 恢复 health 时只能清理可以重新获取的缓存或遗留文件。
3. 需要重启服务、扩容或删除别的文件时，先报告，不要直接做。
4. `/data/reasonix`、frp、ngrok 等 Owner 的东西不动。
5. 不要把 UAT 升级到 0.2.2。

## 2. 分支与发布事实（只读核实）

两个业务仓分别回传：

1. main、develop、`feature/0.2.2-bundle` 的远端 SHA，以及它们之间的包含关系（谁包含谁、ahead/behind）；
2. main 上是否已经有 0.2.2 的功能代码，是通过哪几次推送进去的；
3. 是否已经存在 tag `0.2.2` 或名为 0.2.2 的 GitHub Release，它指向哪个提交、有哪些资产；
4. 是否有其他 CI run 产出了制品。

这一步只读。已有的 tag 和 Release 不删、不覆盖，main 不回退、不强推。

## 3. 修两个测试（C022-G2、C022-G3）

在 Server `feature/0.2.2-bundle` 上做，只改这两个测试类。

**`ApplicationCenterRecoveryDrillPostgresTest`：**
- 起点改为当前在役基线 0.2.0；
- 终点从类路径读取最新的版本化迁移，复用 P62/P64 已有的 helper；
- 演练的步骤和断言意图（备份、升级、恢复后数据还在）不变；
- 不写死任何终点版本号。

**`P62UpgradeGatePgTest`：**
1. 先复现，区分是业务竞态还是测试装置时序。
2. 属于测试装置时，只在这个类里改善隔离，或者改用有界的等待。不放宽业务规则，不加 CI 自动重试，不用无上限的等待。
3. 属于业务竞态时，停下来报告规划。
4. 回执写明判断的依据。

**通用禁止：**
- 修改产品代码；
- 修改或新增迁移脚本；
- 跳过、禁用或删除测试。

**CI 配置：**
- PG 服务容器（端口 55432、完整的 `AC_G4_PG_URL`）保留；
- 临时加的诊断步骤在 CI 全绿后去掉。

**CI 怎么跑：** 让 CI 在 feature 分支或 develop 上跑。如果现有工作流只在 push main 时触发，就加一个不产出 Release 的触发方式，比如 `workflow_dispatch` 或 PR 触发。之后不要再为了跑测试而推送 main。

## 完成条件

- C022-G2：该测试在 CI 上 Skipped 0、Failures 0、Errors 0；起点是 0.2.0，终点没有写死版本号。
- C022-G3：CI 连续两次实跑该类全部通过，回执写明两个 run 号。
- 全量：feature 分支上全工程 `mvn test` exit=0；CI 全绿。
- 第 1、2 步的事实已写进回执。

## 回执

写到 `receipts/close-sync-022-03.md`。

写完后停下，等规划根据第 2 步的事实，确定合并顺序和怎么处理已有的 Release，再进入第 4 阶段。

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
