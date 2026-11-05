# 0.2.2 第 3 阶段 规划审查（第 3 次）

日期：2026-11-05。审查角色：规划。

审查对象：`close-sync-022-03.md`（Server `feature/0.2.2-bundle` @ `3818d0c4`，CI run 41960372793）。

上次审查：`planning-review-close-022-02.md`。

## 结论

`VERIFYING`，还剩一处要改。

- **P62 领取竞态（C022-G3）：** 锁定。
- **分支与发布事实：** 已经清楚，可以定下合并方式。
- **UAT：** Owner 授权清理旧会话。
- **恢复演练测试（C022-G2）：** 菜单断言被改弱了，要补回来。

这一处只改一个断言，改完后不用停下等规划，直接连续推进第 4—6 阶段。

## 锁定

- **C022-G3：**
  - 后台调度器在本类里停掉，认领改为有界等待（≤5s）；
  - 命令被后台领走时会如实报错，业务规则没有动；
  - CI run 41960372793 中该类 2/2 通过；
  - 回执给出的根因依据（测试自己领取并直接消费命令，会和上下文里的后台调度器抢同一条命令）成立；
  - “连续两次”这一条由本轮 feature 和第 4 阶段 develop、main 上的 CI 自然完成。如果其中任何一次这个类失败，按新反证重开。
- **恢复演练的其余修复保留：**
  - 补执行 0.2.0 收敛脚本，使 0.1.7 的库能续升；
  - 终点改为动态取得，并增加再次升级的幂等断言；
  - CI 容器与 runner 的 pg_dump/pg_restore 统一到 18.x；
  - CI 实跑 Skipped 0。
- **CI 触发：**
  - feature、develop、main 都会跑测试；
  - 只有 main 产出 Release。

## 规划自检（C022-G2）

上轮提示只写了“不得降低演练断言意图”，没有说明升级脚本按设计新增菜单后，菜单断言该怎么写。执行方于是把“总行数不变”改成了“无重复 id”。这样就丢了“升级和恢复后菜单一条都不少”这层保护，是规划口径没写清。

本轮写成可判定的条件：
- 升级前的每个菜单 id 都还在；
- 没有重复 id；
- 总数 = 升级前 + 升级脚本新增数。新增数从执行结果得出，不写死 3。

## 分支与 Release 的裁定

- **两仓 main 已含 0.2.2 代码：** 这是上轮提前推送造成的，不回退。第 4 阶段照常把 `feature/0.2.2-bundle` 合入 develop 再合入 main，两个测试修复和 CI 触发改造会随之进入，不需要强推。
- **`build-<sha>` 自动产物：** Server 6 个、Web 1 个，都是既有 CI 惯例生成的单次构建制品，不是语义版本，保留。语义 tag 和 Release `0.2.2` 仍在第 5 阶段创建。

## UAT（Owner 2026-11-05 授权）

- **授权范围：** 删除 `/data/reasonix/.reasonix-sessions` 中较早的会话文件，从最旧的开始删，腾出至少 3G。
- **不能动的：** reasonix 程序和配置、最近的会话、frp、ngrok 及其他 Owner 工具。
- **回读：** 清理后回读可用空间和 health。0.2.1 恢复 UP 以后，再按第 5 阶段升级。

## 记录

`AgentToolConfigServiceImplTest` 在 CI 上抖动过一次，记入需求池，作为测试稳定性候选，本版不处理。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "0.2.2",
  "revision": 16,
  "previous_revision": 15,
  "decision": "CONTINUE",
  "source_receipt": "product/0.2.2/receipts/close-sync-022-03.md",
  "items": [
    {
      "origin_id": "C022-G2",
      "subject": "恢复演练测试在 CI 实跑通过",
      "criterion": "整版方向第 4 阶段：ApplicationCenterRecoveryDrillPostgresTest 在 CI 上必须实际跑通",
      "status": "REWORK",
      "failed_rounds": 2,
      "planner_self_audit": "上轮提示只禁止“降低演练断言意图”，没有写明升级脚本按设计新增菜单后，菜单断言应该怎么写，执行方只好自己选，选了只查“无重复 id”。这样一来，原断言里“升级和恢复后菜单一条都不少”的保护就没了。本轮把菜单断言写成可判定的条件；其他已修内容（补执行 0.2.0 收敛脚本、终点动态化、幂等再升级、PG18 工具链对齐）保留，不重做。",
      "evidence": [
        "product/0.2.2/receipts/close-sync-022-03.md 三、六.4"
      ],
      "diagnosis": {
        "location": "Server ApplicationCenterRecoveryDrillPostgresTest 菜单断言",
        "observed": "菜单断言由“总行数不变”改为“无重复 id”；升级脚本按设计补入 3 个菜单行；CI run 41960372793 实跑 1/1 通过",
        "expected": "升级、恢复后：升级前的每个菜单 id 都还在，没有重复 id，总数等于升级前的数量加上升级脚本新增的数量",
        "cause": "压缩后的升级流会新增菜单行，执行方为适配改了计数口径，同时去掉了不丢失的校验",
        "next_action": "只改该测试类的菜单断言，补上“升级前 id 全部保留”和“总数 = 升级前 + 新增”两条，其余已修内容不动"
      },
      "scope": {
        "targets": [
          "ApplicationCenterRecoveryDrillPostgresTest"
        ],
        "allowed_actions": [
          "修改上述测试类",
          "CI 实跑"
        ],
        "forbidden_actions": [
          "修改产品代码",
          "修改或新增迁移脚本",
          "跳过、禁用或删除测试",
          "写死任何终点版本号",
          "降低演练断言意图",
          "只校验无重复 id"
        ],
        "constraints": {
          "分支": "Server feature/0.2.2-bundle",
          "CI 结果": "回执写明 run 号与该测试的 Tests/Failures/Errors/Skipped",
          "菜单断言": "升级前 id 全部保留、无重复 id、总数 = 升级前 + 升级脚本新增数（新增数从脚本执行结果或新增 id 集合得出，不写死 3）"
        }
      },
      "acceptance": [
        "菜单断言同时校验升级前 id 全部保留、无重复、总数 = 升级前 + 新增",
        "该测试在 CI 上 Skipped 0、Failures 0、Errors 0",
        "改动只在该测试类内"
      ]
    },
    {
      "origin_id": "C022-G3",
      "subject": "升级门测试领取竞态",
      "criterion": "整版方向第 4 阶段：合并前 CI 全绿；todo/p62-upgrade-gate-test-claim-race.md：不得以放宽业务规则或跳过测试消除失败",
      "status": "RESOLVED",
      "failed_rounds": 1,
      "evidence": [
        "product/0.2.2/receipts/close-sync-022-03.md 三"
      ],
      "scope": {
        "targets": [
          "P62UpgradeGatePgTest"
        ],
        "allowed_actions": [
          "修改上述测试类",
          "CI 实跑"
        ],
        "forbidden_actions": [
          "修改产品代码",
          "放宽业务规则",
          "跳过、禁用或删除测试",
          "CI 失败自动重试",
          "无上限等待"
        ],
        "constraints": {
          "分支": "Server feature/0.2.2-bundle",
          "验证": "CI 连续两次实跑该类通过，回执写明两个 run 号"
        }
      },
      "acceptance": [
        "已锁定"
      ]
    }
  ],
  "history_summary": {
    "revision": 15,
    "review": "product/0.2.2/receipts/planning-review-close-022-02.md",
    "retained_count": 23,
    "status_counts": {
      "RESOLVED": 23
    }
  }
}
```
