# 0.2.2 第 4—6 阶段 规划审查

日期：2026-11-05。审查角色：规划。

审查对象：
- `close-sync-022-04.md`
- `release-sync-022-01.md`

根仓提交：`8bf4a673`。上次审查：`planning-review-close-022-03.md`。

## 结论

合并、发布、UAT 升级都通过，锁定。

第 7 阶段还差一处分支同步，所以 0.2.2 先不写 `COMPLETED`。这一处补完、复核通过后再结束。

## 锁定

| 项 | 依据 |
|---|---|
| C022-G2 菜单断言 | 三条同时校验：升级前 id 全部保留、无重复、总数 = 升级前 + 动态新增数（取集合差，不写死）。`d3138a03`，CI run 41963780445 中 drill 1/1，Skipped 0 |
| C022-G3 连续通过 | P62 gate 在 feature、develop、main 三次 CI 中都是 2/2，满足“连续两次” |
| 合并 | 两仓都是 feature → develop → main 普通合并，无冲突、无强推；`vite.config.ts` 未入提交；feature 分支按惯例删除。Server develop `2b9482e1`、main `0bf4c938`；Web develop `c9f09f4`、main `3bcd7c2` |
| 合并后 CI | Server feature、develop、main 都是 2351 / 0 / 0 / 33；Web develop、main 都通过 |
| 版本 | CI 断言 `0.2.2-SNAPSHOT`、pom revision、Web package 0.2.2、制品名带版本号；种子压缩判断为不需要，理由成立 |
| tag 与 Release | 两仓 annotated tag `0.2.2` 分别指向 `0bf4c938`、`3bcd7c2`；语义 Release 已标为 latest；`build-<sha>` 产物全部保留 |
| UAT 清理 | 只删了 2026-10-28 及以前的会话，共 69,881 个文件、约 3.34 GiB，近期会话、程序和配置都没动；可用空间 0 → 2.6G，0.2.1 的 health 恢复 UP |
| UAT 升级 | 新做了一份 custom dump，并在临时库恢复出 178 张表，备份可用。先启用 `vector` 0.8.7 再换包。升级后：health UP（本机和经 nginx 都是）、启动段 ERROR 0、Flyway 依次执行 6 支到 v0.2.6、`embedding` 列类型为 vector、HTTPS 页面 200、可用空间 2.2G；回滚资产保留 |
| Key | 没有迁移、没有代录；回执列出两类需要 Owner 录入的供应商：Chat/LLM 和 Embedding |

## 还差一处：发布后的分支同步

**问题。** 打完 tag 以后，两仓 README 的发布回读提交（Server `3c4942f0`、Web `9dd7e7b0`）直接推到了 main。这带来两个问题：
- 当前入口里写的 main 仍是 `0bf4c938` / `3bcd7c2`；
- 回执没有说明这两个提交有没有回到 develop。

**为什么要补。** develop 落后于 main 的话，下个版本从 develop 拉分支时会缺这次的 README，合并时还可能冲突。

**补法。**
- 两仓把 main 普通合并回 develop；
- 回读远端 SHA；
- 先更新 knowledge，再更新 memory 和 todo；
- tag 0.2.2 和 Release 不动。

## 留给 Owner

UAT 上的 Agent 模型页 `/agent/model` 现在还没有供应商。要在页面上新建并录入 Key：
- Chat/LLM：OpenAI Chat 兼容端点，比如 Command Code；
- Embedding：OpenRouter，模型 `openai/text-embedding-3-small`。

没录 Key 之前，智能体和知识库在 UAT 上用不了，但这不影响 0.2.2 交付结束。

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
