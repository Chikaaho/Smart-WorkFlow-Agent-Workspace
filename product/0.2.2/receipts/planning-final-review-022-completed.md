# 0.2.2 规划终态复核

日期：2026-11-05。复核角色：规划。

复核对象：
- `close-sync-022-01～04.md`
- `release-sync-022-01.md`、`release-sync-022-02.md`（根仓 `1ad90034`）
- Owner 2026-11-05 发来的 UAT 供应商页截图

## 裁决

0.2.2 整版交付 **`COMPLETED`**。第 1—6 阶段都有可读的证据，第 7 阶段由本记录完成。整版方向已归档到 `product/0.2.2/passed/`。

## 逐项复核

| 项 | 方向要求 | 证据 | 结论 |
|---|---|---|---|
| 功能验收 | F1（XL 三阶段）、F2（L） | `planning-review-f1-stage3-02.md`、`planning-review-f2-04.md` | 通过 |
| 计数与编号 | 功能 50（D022-16）；46/22/22＝90、ADV64/问题57、P 编号、明细 ID 不变；验证基线 [] | knowledge `feature-reconciliation-index.md` §0、`features/0.2.2-integrated-release.md`、memory | 通过 |
| 整版回归 | 门禁＋F1/F2 冒烟 | 冒烟截图三张；C022-G1/G2/G3 修复后 Server 全工程 2351 / 0 / 0 / 33；Web 四项通过 | 通过 |
| 操作说明 | 应用导入导出六个要点 | Web `docs/user-guide/operation-manual.md` | 通过 |
| 合并 | 两仓 feature → develop → main，不强推，保护 `vite.config.ts` | `close-sync-022-04.md` 二；feature 分支已删 | 通过 |
| 恢复演练 CI | 在 CI 上实际跑通 | feature、develop、main 三次都是 1/1，Skipped 0 | 通过 |
| 版本 | 发布配置与 0.2.2 一致 | CI 断言 `0.2.2-SNAPSHOT`、pom、package、制品名都对 | 通过 |
| 发布 | tag、CI、制品、部署分别核实 | tag `0.2.2` 指向 Server `0bf4c938`、Web `3bcd7c2`；语义 Release 资产实测 `build.version=0.2.2`；`releases/latest` 为语义 Release | 通过 |
| UAT | 先装 pgvector 再升级；health、ERROR、Flyway、扩展 | 旧会话清理在授权范围内；备份做过恢复演练；health UP、启动 ERROR 0、v0.2.6、vector 0.8.7、页面 200 | 通过 |
| 发布后同步 | 先 knowledge，覆盖受影响入口；分支头一致 | `release-sync-022-01.md` 五；C022-S1：两仓 main = develop（Server `3c4942f0`、Web `9dd7e7b`），tag 不变，develop CI 通过 | 通过 |
| Key | Owner 在页面录入，不迁移 | 回执没有出现 Key；Owner 已在页面新建 CommandCode、Openrouter 两个供应商 | 通过 |
| memory | 单份 <5KB、总量 <20KB | 约 18KB | 通过 |

## 不阻塞的遗留观察

- **UAT 上的 Openrouter 供应商：** 截图显示 API 格式是 Anthropic，地址是 `https://openrouter.ai/api`。按 D022-09，Embedding 走 OpenAI 兼容的 `/embeddings`，要求 OpenAI Chat 格式、地址 `https://openrouter.ai/api/v1`。现在这样配置，知识库向量化大概率不通。这是 Owner 的页面配置，不影响交付结束，已提醒 Owner。
- **模型页：** 截图只到供应商页，需要在“模型”页挂上 Chat 模型和 Embedding 模型，智能体和知识库才能用。
- **UAT 磁盘：** 剩 2.2G，reasonix 的会话还在增长，后续发布前要复核。已记入 `memory/issues.md`。
- **偶发失败测试：** P62CompatRollback、I6G1 通知 Boot、AgentToolConfigServiceImplTest 在 CI 上偶有失败，都是已登记的抖动，同提交重跑通过。已在 todo 中跟踪。

## 后续

Executor 按 `product/0.2.2/ready/direction-final-propagation-022.md` 把 `COMPLETED` 传播到 knowledge 和受影响的入口。memory 由规划先行改写，Executor 只核对。传播完成后，没有活动中的交付，等 Owner 安排下一个目标。

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
