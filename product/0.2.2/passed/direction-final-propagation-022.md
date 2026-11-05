# 0.2.2 终态传播

日期：2026-11-05。下发角色：规划；承接角色：执行（Executor）。状态：`PASSED`（2026-11-05 规划读回执 `receipts/final-propagation-022-01.md` 后归档）。

依据：`product/0.2.2/receipts/planning-final-review-022-completed.md`。

本方向只传播裁决，不派实现、业务验证、合并、发布或部署，也不操作 UAT。

## 唯一终态值

| 字段 | 目标值 |
|---|---|
| 0.2.2 交付状态 | `COMPLETED`（规划 2026-11-05 终态复核） |
| 七阶段进度 | 7/0/0：需求评估、执行、验收与同步、合并、发布、发布后同步、结束全部完成 |
| 计数与编号 | 功能 50（D022-16）、46/22/22＝90、ADV64/问题57、P 编号与明细 ID 不变、验证基线 [] |
| 正式/部署版本 | Server、Web 0.2.2（tag 指向 `0bf4c938` / `3bcd7c2`），UAT 已部署，Flyway v0.2.6，pgvector 0.8.7 |
| 开发版本 | Server `0.2.2-SNAPSHOT`、Web `0.2.2` |
| 分支头 | Server main = develop = `3c4942f0`；Web main = develop = `9dd7e7b`（以传播时回读为准，有变化就如实写） |
| 方向目录 | `product/0.2.2/passed/`（规划已归档 F1、F2、范围草稿和整版方向） |
| 活动功能 | 无 |
| 唯一下一动作 | 等待 Owner 安排下一目标 |

## 动作与完成条件

1. **改状态。** 把“第 7 阶段待复核 / 待规划复核”改为上表的值。顺序：
   - 先改 `knowledge/current-status.md`、`knowledge/session-handoff.md`、`knowledge/features/0.2.2-integrated-release.md`；
   - 再改 `version.json`、根 `README.md`、`CHANGELOG.md` 里确实写有这个状态的位置；
   - 最后改 `todo/requirement-pool.md` 的 0.2.2 段。

   memory 的 state、handoff、features、README、issues 已由规划改写，Executor 只核对，有偏差再修。
2. **回读。** 回读两仓 `releases/latest`。如果后续文档提交生成的 `build-<sha>` 抢走了 latest，就把语义 Release `0.2.2` 恢复为 latest，再回读一次。
3. **提交。** 在 `develop-sw` 提交并推送本批（包括规划写的复核记录、归档移动和本方向），回读远端 SHA。
4. **回执。** 写 `product/0.2.2/receipts/final-propagation-022-01.md`，内容包括：
   - 覆盖矩阵（入口、写入值、回读结果）；
   - latest 回读结果；
   - 提交 SHA；
   - memory 字节数（单份 <5KB，总量 <20KB）。

## 边界

- 保护 Web `vite.config.ts` 的在途改动；
- 不动 UAT 和本地已有的服务；
- 不读取、不传播秘密，也不代 Owner 修改 UAT 上的供应商配置。

终态按 `.codex/governance/terminal-contract.json`。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "0.2.2",
  "revision": 18,
  "previous_revision": 17,
  "decision": "FINISH",
  "source_receipt": "product/0.2.2/receipts/release-sync-022-02.md",
  "items": [
    {
      "origin_id": "C022-S1",
      "subject": "发布后分支与提交同步",
      "criterion": "整版方向第 6 阶段：按发布事实更新分支与提交；system.md §0.4.2：当前入口之间无未解决矛盾",
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
      "status": "RESOLVED",
      "failed_rounds": 1,
      "evidence": [
        "product/0.2.2/receipts/release-sync-022-02.md 一～五"
      ],
      "acceptance": [
        "已锁定"
      ]
    }
  ],
  "history_summary": {
    "revision": 17,
    "review": "product/0.2.2/receipts/planning-review-release-022-01.md",
    "retained_count": 25,
    "status_counts": {
      "RESOLVED": 25
    }
  }
}
```
