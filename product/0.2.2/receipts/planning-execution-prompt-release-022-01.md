# 0.2.2 补充执行提示：发布后分支同步

日期：2026-11-05。下发角色：规划；承接角色：执行（Executor）。

依据：`planning-review-release-022-01.md`。

合并、发布、UAT 升级都已锁定，不重做。本轮只做分支同步。

## 要做的事

1. **合并回 develop。** Server、Web 两仓，各自把 `main` 普通合并回 `develop`，让 develop 包含 README 发布回读提交（Server `3c4942f0`、Web `9dd7e7b0`）。
   - 合并前报告 ahead/behind；
   - 不强推，不移动或重建 tag `0.2.2`，不改 Release。
2. **回读。** 用 `git ls-remote` 回读两仓的 `main`、`develop`、`refs/tags/0.2.2`。develop 推送会触发 CI，写明结果。
3. **同步入口。** 先在 knowledge 里更新当前 main、develop 提交号，再同步 `memory/`（state、handoff、features）和 `todo/requirement-pool.md`。tag 指向的提交和部署的版本照原样写，不要和 main 的最新提交混在一起。

## 完成条件

- 两仓 develop 包含 main，回读结果写进回执；
- 当前入口里的 main、develop 提交号与回读一致；
- tag `0.2.2` 的指向不变。

## 回执

写到 `receipts/release-sync-022-02.md`，附覆盖矩阵（入口、写入内容、回读结果）。写完后停下，由规划做第 7 阶段终态复核。

## 边界

- 不改代码，不操作 UAT；
- 任何 Key 都不得进入文件、提交、回执或日志。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "0.2.2",
  "revision": 17,
  "previous_revision": 16,
  "decision": "CONTINUE",
  "source_receipt": "product/0.2.2/receipts/release-sync-022-01.md",
  "items": [
    {
      "origin_id": "C022-G2",
      "subject": "恢复演练测试在 CI 实跑通过",
      "criterion": "整版方向第 4 阶段：ApplicationCenterRecoveryDrillPostgresTest 在 CI 上必须实际跑通",
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
      "status": "RESOLVED",
      "failed_rounds": 2,
      "evidence": [
        "product/0.2.2/receipts/close-sync-022-04.md 一"
      ],
      "acceptance": [
        "已锁定"
      ]
    },
    {
      "origin_id": "C022-S1",
      "subject": "发布后分支与提交同步",
      "criterion": "整版方向第 6 阶段：按发布事实更新分支与提交；system.md §0.4.2：当前入口之间无未解决矛盾",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": [
        "product/0.2.2/receipts/release-sync-022-01.md 五、七",
        "memory/state.md"
      ],
      "diagnosis": {
        "location": "两仓 develop 与 main；knowledge/memory/todo 中的 main 提交号",
        "observed": "打完 tag 后，README 发布回读提交 Server 3c4942f0、Web 9dd7e7b0 直接推到 main；当前入口仍写 main 0bf4c938/3bcd7c2；回执没写这两个提交是否回到 develop",
        "expected": "两仓 develop 包含 main 的全部提交；knowledge、memory、todo 写明当前 main、develop 提交号，与远端回读一致；tag 0.2.2 仍指向 0bf4c938/3bcd7c2",
        "cause": "第 6 阶段的文档提交发生在覆盖矩阵定稿之后，分支状态没有再回读",
        "next_action": "两仓把 main 普通合并回 develop（不强推、不移动 tag），回读远端 SHA，更新 knowledge 后同步 memory 与 todo"
      },
      "scope": {
        "targets": [
          "两仓 develop",
          "当前入口的分支与提交号"
        ],
        "allowed_actions": [
          "main 普通合并回 develop",
          "更新 knowledge、memory、todo 的分支与提交号"
        ],
        "forbidden_actions": [
          "强推",
          "移动或重建 tag 0.2.2",
          "修改 Release",
          "修改代码",
          "操作 UAT"
        ],
        "constraints": {
          "回读": "git ls-remote 两仓 main、develop、tag 0.2.2",
          "CI": "develop 推送触发的 CI 结果写进回执"
        }
      },
      "acceptance": [
        "两仓 develop 包含 main，ls-remote 回读写进回执",
        "knowledge、memory、todo 的 main、develop 提交号与回读一致",
        "tag 0.2.2 指向不变"
      ]
    }
  ],
  "history_summary": {
    "revision": 16,
    "review": "product/0.2.2/receipts/planning-review-close-022-03.md",
    "retained_count": 24,
    "status_counts": {
      "RESOLVED": 24
    }
  }
}
```
