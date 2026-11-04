# F1 阶段 3 规划审查（第 2 次）

日期：2026-11-04。审查角色：规划。对象：`f1-stage3-2.md`（Server `feature/0.2.2-agent` @ `897983e0`，Web `c83a479`，远端回读一致）、截图 `assets/f1-stage3-2-*.png`、数据库回读、OpenRouter 核实记录与测试原始日志。上次审查：`planning-review-f1-stage3-01.md`。

## 结论

剩余四项全部通过，F1 阶段 3 **通过**。F1 三个阶段全部完成：阶段 1、2、3 的完成断言与各轮缺口都已锁定。F1 进入“验收与同步”前的待合并状态，下一步由规划写 F2 方向。

## 本次通过

| ID | 依据 |
|---|---|
| F1S3-G1 真实 Embedding | OpenRouter `openai/text-embedding-3-small`（1536 维）。4 份文档的知识库，阈值 0.2：问蓝鲸计划，blue-whale 0.758 排第一；问火星基地，mars-base 0.613 排第一；问北京天气，截图显示“没有命中分片”（最高 0.106）。最终提交上的真实 RAG 执行输出“蓝鲸计划的项目代号是蓝鲸七号。”，快照 v2，Token 213/42/255。V0.2.5 的后续改动已说明：改为按扩展存在与否条件建列，包含在 `37ee9bae`；本轮证据都在最终提交上重做 |
| F1S3-G2 PDF 与 Word | 页面上传 `pdf-probe.pdf`、`word-probe.docx`，均“可检索”、分片 1；问白鹭计划，PDF 0.700 排第一；问海豚计划，Word 0.679 排第一，截图中命中正文就是文件里的专属事实 |
| F1S3-G3 维度与部署顺序 | 同一向量列里同时存有 64 维和 1536 维两个知识库，两者都能检索。在干净的 PG 17 上实测：无扩展时升级成功、不建向量列，并给出 WARN；安装扩展、重启后自动补建向量列，写入后能计算 cosine。回执给出 UAT 部署顺序和回读 SQL |
| F1S3-G4 空状态 | 无知识库时提示“还没有知识库，点击右上角‘新建知识库’开始”；有知识库但未选中时提示“请选择知识库”，不再出现“左侧” |
| 门禁 | `sw-basic-agent` 337/337，`sw-basic-knowledge` 14/14（含补列 3 例），迁移 7 类 47 run / 0 fail / 1 skipped；Web vitest 2012 passed / 3 skipped，typecheck、lint、build 通过 |

## 不作缺口的观察

- 向量列不带维度，所以不同维度的模型可以并存，但 pgvector 没法在这一列上建 HNSW/IVFFlat 近似索引，检索走全表计算。当前单租户规模下可以接受；数据量大了以后需要按模型维度分列或建分区索引，已登记到需求池。
- PDF、Word 探测文档是本地生成的最小文件，扫描件、复杂版式不在本版验证范围内。

## 带入后续阶段

- **验收与同步：** F1 在 F2 完成后一起进入整版验收；届时按 F1 三阶段的锁定项做一次回归，不重新逐项验收。
- **合并：** `ApplicationCenterRecoveryDrillPostgresTest` 在 CI 跑通。
- **发布：** UAT 先安装 pgvector（`CREATE EXTENSION IF NOT EXISTS vector`）再升级；如果顺序反了，装完扩展后重启应用。之后按回执中的 SQL 回读扩展版本和 `embedding` 列。无法安装时由 Owner 决定是否延期 RAG。
- **Key：** 本地验证库保存着 Command Code 与 OpenRouter 两把 Key 的密文。发布到 UAT 时由 Owner 在页面上自行录入，不从本地库迁移。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "0.2.2",
  "revision": 8,
  "previous_revision": 7,
  "decision": "FINISH",
  "source_receipt": "product/0.2.2/receipts/f1-stage3-2.md",
  "items": [
    {
      "origin_id": "F1S3-G1",
      "subject": "真实 Embedding 下的检索与 RAG",
      "criterion": "阶段 3 完成断言：检索测试命中文档具体内容；知识检索 → LLM graph 在真实模型下答出文档独有事实",
      "status": "RESOLVED",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/f1-stage3-2.md 一", "product/0.2.2/receipts/assets/f1-stage3-2-retrieval-unrelated.png", "product/0.2.2/receipts/assets/f1-stage3-2-rag-execution.png"],
      "scope": {
        "targets": ["知识库检索", "RAG graph"],
        "allowed_actions": ["核实 OpenRouter Embeddings", "页面录入供应商与模型", "上传文档并检索", "真实执行 graph", "修复检索缺陷"],
        "forbidden_actions": ["自行更换 Owner 未指定的供应商", "Key 写入文件或截图", "用模拟向量冒充真实结果"],
        "constraints": {"Embedding 供应商": "OpenRouter", "文档数": "至少 2 份内容不同", "复验代码": "最终提交"}
      },
      "acceptance": ["已锁定"]
    },
    {
      "origin_id": "F1S3-G2",
      "subject": "PDF 与 Word 页面上传",
      "criterion": "方向阶段 3 第 1 步：上传文档至少支持 PDF、Word、TXT、Markdown",
      "status": "RESOLVED",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/f1-stage3-2.md 二", "product/0.2.2/receipts/assets/f1-stage3-2-retrieval-word.png", "product/0.2.2/receipts/assets/f1-stage3-2-retrieval-pdf.png"],
      "scope": {
        "targets": ["文档上传"],
        "allowed_actions": ["浏览器上传", "修复上传或解析缺陷"],
        "forbidden_actions": ["headless 结果冒充正式证据"],
        "constraints": {"浏览器": "headless=false", "格式": "PDF、Word 各一份"}
      },
      "acceptance": ["已锁定"]
    },
    {
      "origin_id": "F1S3-G3",
      "subject": "pgvector 向量列与部署顺序",
      "criterion": "D022-07：pgvector 存储向量、按租户隔离；UAT 扩展可用性在阶段 3 期间核实并报告",
      "status": "RESOLVED",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/f1-stage3-2.md 三", "product/0.2.2/receipts/assets/f1-stage3-2-pgvector-dimensions.txt"],
      "scope": {
        "targets": ["向量列", "部署顺序"],
        "allowed_actions": ["本地实测", "修复向量列补建", "写部署顺序"],
        "forbidden_actions": ["连接或修改 UAT", "静默降级为无向量检索"],
        "constraints": {"维度": "OpenRouter 模型与本地模拟服务各一", "无扩展库": "临时库，验证后删除"}
      },
      "acceptance": ["已锁定"]
    },
    {
      "origin_id": "F1S3-G4",
      "subject": "知识库页空状态提示",
      "criterion": "知识库管理页提示与页面布局一致",
      "status": "RESOLVED",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/assets/f1-stage3-2-empty-no-kb.png", "product/0.2.2/receipts/assets/f1-stage3-2-empty-has-kb.png"],
      "scope": {
        "targets": ["知识库页空状态"],
        "allowed_actions": ["修改提示文案", "浏览器验证"],
        "forbidden_actions": ["改动知识库页布局"],
        "constraints": {"浏览器": "headless=false", "状态": "无知识库、有知识库未选中"}
      },
      "acceptance": ["已锁定"]
    }
  ],
  "history_summary": {"revision": 7, "review": "product/0.2.2/receipts/planning-review-f1-stage3-01.md", "retained_count": 14, "status_counts": {"RESOLVED": 14}}
}
```
