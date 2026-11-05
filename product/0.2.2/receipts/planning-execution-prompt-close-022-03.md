# 0.2.2 补充执行提示（第 3 次）：修菜单断言，然后连续推进第 4—6 阶段

日期：2026-11-05。下发角色：规划；承接角色：执行（Executor）。

依据：`planning-review-close-022-03.md`。方向：`ready/direction-022-close-release.md`。

已锁定的内容不重做。这一轮做完第 1 步后直接往下走，不用停下来等规划；只有遇到“停止条件”里列的情况才停。

## 1. 恢复演练的菜单断言（C022-G2）

1. **改断言。** 只改 `ApplicationCenterRecoveryDrillPostgresTest`，把菜单断言改成同时检查三条：
   - 升级前的每个菜单 id 都还在；
   - 没有重复 id；
   - 总数 = 升级前 + 升级脚本新增数。新增数从执行结果或新增 id 集合得出，不写死 3。
2. **其他已修内容不动。**
3. **CI 实跑。** 在 feature 分支上跑 CI，确认该测试 Skipped 0、Failures 0、Errors 0，`P62UpgradeGatePgTest` 也通过，全工程全绿。

## 2. 第 4 阶段：合并

两仓都按 `feature/0.2.2-bundle` → `develop` → `main` 的顺序合并。main 已经含 0.2.2 代码，正常合并即可：不回退，不强推。

1. **版本与发布配置。** 合并前核实这些都是 0.2.2：
   - CI 的版本断言；
   - pom 的 revision；
   - Web 的 package version；
   - 制品命名。

   完成发布要求的种子压缩判断：如果需要做，按工程宪法做，并让上面的动态终点断言照常通过。
2. **develop 的 CI。** develop 和 main 推送后各跑一次 CI，回执写明 run 号，以及 drill 和 P62 两个测试类的结果。
3. **其他要求。**
   - `vite.config.ts` 的在途改动不入提交；
   - 每次合并前报告远程、分支、精确范围、ahead/behind；
   - 推送后回读远端 SHA；
   - feature 分支的去留按 0.2.1 惯例处理。

## 3. 第 5 阶段：发布 0.2.2

1. **Release。** 两仓在 main 上创建 tag `0.2.2` 和语义 Release。已有的 `build-<sha>` 产物保留，不删也不覆盖。
2. **UAT 清理（Owner 已授权）。** 从最旧的开始，删除 `/data/reasonix/.reasonix-sessions` 里较早的会话文件，腾出至少 3G。
   - reasonix 的程序、配置和最近的会话都不动；
   - frp、ngrok 等 Owner 工具不动；
   - 回执写明删除的范围（时间段、文件数、大小）和清理后的可用空间；
   - 0.2.1 的 health 先恢复 UP。
3. **升级 UAT。** pgvector 0.8.7 已经装好，按 `f1-stage3-2.md` 第三节的 SQL 回读。升级前确认最新的 DB 备份可用。升级后回读：
   - health UP；
   - 启动日志 ERROR 数；
   - Flyway 终点；
   - `vector` 扩展已启用；
   - 页面能访问。
4. **Key。** UAT 的模型 Key 由 Owner 在页面录入，Executor 不迁移也不代录。回执里列出 Owner 需要录入的供应商。

## 4. 第 6 阶段：发布后同步

先更新 knowledge，再更新受影响的当前入口：
- 分支与提交；
- 正式、开发、部署版本；
- 制品；
- 迁移终点；
- pgvector；
- UAT 磁盘与 health；
- 下一动作。

两仓 README 的“当前发布版本”改为 0.2.2。

## 回执

- 第 1、2 步写在 `close-sync-022-04.md`；
- 第 3、4 步写在 `release-sync-022-01.md`，含覆盖矩阵。

## 停止条件（遇到才停下报告）

- 改完菜单断言后测试失败，并且原因指向产品行为；
- 合并出现冲突，或需要强推；
- 清理 3G 后 health 仍不是 UP；
- UAT 升级失败，或 health DOWN。升级失败时按备份回到 0.2.1，并报告；
- 发现阻塞发布的真实缺陷。

## 边界

- 任何 Key 都不得进入文件、提交、回执、日志或截图；
- 不改迁移历史，不清理本地库 `smart_workflow_f1v4b`；
- 只操作本轮自己启动、身份明确的进程；
- 遵守 `system.md` §0.8.2/§0.8.3：CI 和部署的等待要有界、可观测；
- 终态契约里的 `work_items` 保留未完成的阶段。

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
