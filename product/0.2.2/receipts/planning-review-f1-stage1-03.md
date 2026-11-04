# F1 阶段 1 规划审查（第 3 次）

日期：2026-11-04。审查角色：规划。对象：`f1-stage1-4.md`（Server `feature/0.2.2-agent` @ `12001c4f`，Web `df2200e`）、截图 `assets/f1-stage1-4-g2-*.png`、原始日志 `assets/f1-stage1-4-g3-*.log`。上次审查：`planning-review-f1-stage1-02.md`。

## 结论

剩余两项通过，F1 阶段 1 **通过**。阶段 1 全部完成断言与 G1～G6 锁定。下一步执行方向 `product/0.2.2/ready/direction-022-f1-agent.md` 阶段 2，回执 `f1-stage2-1.md`。

## 本次通过

| ID | 依据 |
|---|---|
| F1S1-G2 弹窗标题 | 三张可见浏览器截图逐一核对：成功为"测试结果：服务可达"；401 为"测试结果：鉴权失败（HTTP 401）"，与消息一致；端口无监听为"测试结果：网络不可达"。修复只动 `ModelList.vue` 标题判定，另有 3 条单测；截图无明文密钥 |
| F1S1-G3 迁移门禁 | 修复前日志实测 4 个测试类因 V0.2.2 失败（条数 20→21、主链衔接 0→1），与上次判断一致；修复后日志核对 7 个类：Tests run 47，Failures 0，Errors 0，Skipped 1，BUILD SUCCESS。`I6G7UpgradeDrillH2Test` 新增 D022-03 搬运断言（先迁到 0.2.0 写旧三行，再迁满后断言 ollama→OPENAI_CHAT 补 `/v1`、other 停用、旧 id 原样可解析）。本轮未改 pom。Web 有改动，四项门禁一并回归通过 |

## 接受的限制

- `ApplicationCenterRecoveryDrillPostgresTest` 因本机缺 `pg_dump`/`pg_restore` 按前置跳过。它是备份恢复演练，不在 D022-03 断言范围；PG 迁移本体由 `FlywayFullChainPostgresTest` 与 `I6G7bOldBaselineUpgradePostgresTest` 覆盖。合并阶段 CI 需跑通此类，届时如仍跳过须说明。
- D022-03 搬运断言只写在 H2 演练测试中。PG 上的搬运结果已在 G1 用真实 PG 验证库回读并锁定，不再要求补 PG 版断言。
- 截图和日志按仓库 `.gitignore` 只在本地保留，规划已在本地核对原文。
- Server 全量模块回归不在阶段 1 要求内，留到"验收与同步"阶段的整版门禁和 CI。

## 带入阶段 2 的事项

1. 模型列表里供应商已停用但模型行显示"启用"（第 2 次审查记录的观察）。阶段 2 第 2 步做 LLM 节点"只列出启用中的模型"时，供应商停用的模型同样不可选；列表需要能看出它因供应商停用而不可用。
2. 标题现在取后端消息冒号前的文字。后续若调整连通性测试消息格式，需同步保持标题与消息一致。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "0.2.2",
  "revision": 3,
  "previous_revision": 2,
  "decision": "FINISH",
  "source_receipt": "product/0.2.2/receipts/f1-stage1-4.md",
  "items": [
    {
      "origin_id": "F1S1-G2",
      "subject": "前端供应商与模型两级管理",
      "criterion": "方向阶段 1 第 6 步：两级管理页可新建供应商、增模型、测连通，密钥脱敏且留空保留",
      "status": "RESOLVED",
      "failed_rounds": 2,
      "evidence": ["product/0.2.2/receipts/f1-stage1-4.md F1S1-G2", "product/0.2.2/receipts/assets/f1-stage1-4-g2-success.png", "product/0.2.2/receipts/assets/f1-stage1-4-g2-auth-401.png", "product/0.2.2/receipts/assets/f1-stage1-4-g2-unreachable.png"],
      "scope": {
        "targets": ["模型管理"],
        "allowed_actions": ["浏览器验证", "修复该页面缺陷"],
        "forbidden_actions": ["headless 结果冒充正式证据", "截图中出现明文密钥", "使用真实 API Key"],
        "constraints": {"浏览器": "headless=false", "复验三态": "成功、HTTP 401、端口无监听", "修复位置": "仅连通性测试结果弹窗标题判定"}
      },
      "acceptance": ["已锁定"]
    },
    {
      "origin_id": "F1S1-G3",
      "subject": "阶段 1 门禁",
      "criterion": "证据清单第 2 项：Server 受影响模块测试与 H2/PG 双库迁移；Web typecheck、lint、单测、build",
      "status": "RESOLVED",
      "failed_rounds": 2,
      "evidence": ["product/0.2.2/receipts/f1-stage1-4.md F1S1-G3", "product/0.2.2/receipts/assets/f1-stage1-4-g3-before.log", "product/0.2.2/receipts/assets/f1-stage1-4-g3-after.log"],
      "scope": {
        "targets": ["V0.2.2 迁移"],
        "allowed_actions": ["运行门禁", "修复门禁失败"],
        "forbidden_actions": ["跳过失败测试", "推算计数", "删除原始测试输出"],
        "constraints": {"迁移": "H2 与 PG", "门禁所在模块": "sw-bootstrap", "修复门禁失败含": "更新迁移条数断言、新增 D022-03 搬运断言", "必含测试": "Flyway 全链 H2、Flyway 全链 PG、升级演练", "搬运断言": "ollama→OPENAI_CHAT 且补 /v1、other 停用、旧 id 原样"}
      },
      "acceptance": ["已锁定"]
    }
  ],
  "history_summary": {"revision": 2, "review": "product/0.2.2/receipts/planning-review-f1-stage1-02.md", "retained_count": 8, "status_counts": {"RESOLVED": 8}}
}
```
