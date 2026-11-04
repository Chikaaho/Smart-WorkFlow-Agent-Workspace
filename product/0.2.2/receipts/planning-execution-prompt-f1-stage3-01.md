# F1 阶段 3 补充执行提示（第 1 次）

日期：2026-11-04。下发角色：规划；承接角色：执行。依据：`planning-review-f1-stage3-01.md`。本提示是 F1 阶段 3 的唯一当前执行入口；方向 `product/0.2.2/ready/direction-022-f1-agent.md` 不变。

## 锁定项（不得重验）

阶段 1、2 全部；阶段 3 的租户隔离、删除文档与删除知识库、知识检索节点与轨迹、Command Code Embedding 核实。只有本轮改动触及这些路径时才复验受影响项，并写明依据。

## Owner 决定

- 真实 Embedding 用 **OpenRouter**，选便宜的 Embedding 模型（先核实 OpenRouter 的 OpenAI 兼容 `/embeddings` 是否可用、所选模型维度）。Key 由 Owner 直接交给执行会话，只经页面写入本地库（密文），不写进任何文件、提交、回执、日志或截图。若 OpenRouter 不提供可用的 Embeddings，停下来报告，不自行换供应商。
- UAT pgvector 在发布阶段部署时安装，本轮不连 UAT。

## 剩余四项

| ID | 只做这些 | 完成条件 | 证据 |
|---|---|---|---|
| F1S3-G1 | 用 OpenRouter Embedding 新建知识库，上传至少 2 份内容不同的文档（含 `blue-whale.md`），重做检索与 RAG 断言 | 问“蓝鲸计划的项目代号”时 `blue-whale.md` 排第一；问另一份文档的内容时那份排第一；问与两份都无关的问题时，在写明的阈值下不命中或相似度明显更低；真实“知识检索 → LLM”graph 答出“蓝鲸七号” | 截图（检索两次、无关问题一次、执行详情一张）；相似度数值；数据库回读；证据对应的最终提交 SHA；V0.2.5 在上一轮证据采集后的改动说明 |
| F1S3-G2 | 在页面上传 PDF、Word 各一份 | 两份均变为可检索，分片数大于 0，检索各命中其中一句具体内容 | 截图（文档列表、两次检索）；数据库回读分片数 |
| F1S3-G3 | 核实 pgvector 向量列对不同维度模型的处理，以及“先升级、后装扩展”时向量列如何补齐 | 两个知识库分别用 OpenRouter 模型与本地模拟服务（维度不同），都能入库并检索；写明 UAT 部署顺序（何时装扩展、何时升级、如何回读）；如需代码修复（例如启动时补建向量列），在阶段 3 内完成 | 两个知识库的检索截图或接口回读；一次“无扩展库升级 → 安装扩展 → 向量写入”的本地实测记录；部署顺序说明 |
| F1S3-G4 | 修正知识库页空状态提示 | 无知识库时提示新建；有知识库但未选中时提示选择，不出现“左侧” | 截图两张 |

## 边界

- 不扩到 F2；不连接 UAT；外部调用保持最少次数。
- 本地验证库沿用 `smart_workflow_f1v4b`；G3 的“无扩展库”用另建的临时库，验证后删除。
- 门禁：受影响模块测试、迁移 7 类（若改迁移）、Web 四项；提交推送并写远端回读 SHA。
- 回执 `product/0.2.2/receipts/f1-stage3-2.md`。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "0.2.2",
  "revision": 7,
  "previous_revision": 6,
  "decision": "CONTINUE",
  "source_receipt": "product/0.2.2/receipts/f1-stage3-1.md",
  "items": [
    {
      "origin_id": "F1S3-G1",
      "subject": "真实 Embedding 下的检索与 RAG",
      "criterion": "阶段 3 完成断言：检索测试命中文档具体内容；知识检索 → LLM graph 在真实模型下答出文档独有事实",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/f1-stage3-1.md 二.1、二.2、三", "product/0.2.2/receipts/assets/f1-stage3-1-retrieval.png", "product/0.2.2/receipts/assets/f1-stage3-1-embedding-probe.txt"],
      "diagnosis": {
        "location": "知识库检索与 RAG graph",
        "observed": "向量来自本地模拟服务；知识库仅 1 个分片、阈值 0，任何问题都命中该分片",
        "expected": "真实 Embedding 下多文档检索排序正确，无关问题不误命中，RAG 答出文档独有事实",
        "cause": "Command Code 无 Embeddings 接口，Owner 此前未指定替代供应商",
        "next_action": "接入 OpenRouter Embedding，用至少 2 份文档在最终提交上重做两条断言"
      },
      "scope": {
        "targets": ["知识库检索", "RAG graph"],
        "allowed_actions": ["核实 OpenRouter Embeddings", "页面录入供应商与模型", "上传文档并检索", "真实执行 graph", "修复检索缺陷"],
        "forbidden_actions": ["自行更换 Owner 未指定的供应商", "Key 写入文件或截图", "用模拟向量冒充真实结果"],
        "constraints": {"Embedding 供应商": "OpenRouter", "文档数": "至少 2 份内容不同", "复验代码": "最终提交"}
      },
      "acceptance": ["正确文档排第一（两次）", "无关问题在写明阈值下不命中或明显更低", "真实 graph 答出蓝鲸七号", "写明证据提交与 V0.2.5 后续改动"]
    },
    {
      "origin_id": "F1S3-G2",
      "subject": "PDF 与 Word 页面上传",
      "criterion": "方向阶段 3 第 1 步：上传文档至少支持 PDF、Word、TXT、Markdown",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/f1-stage3-1.md 二.1"],
      "diagnosis": {
        "location": "知识库文档上传",
        "observed": "页面只上传过 Markdown，PDF 与 Word 仅有解析单测",
        "expected": "页面上传 PDF、Word 后可检索并命中其内容",
        "cause": "回执未做端到端上传",
        "next_action": "页面各上传一份 PDF、Word 并检索"
      },
      "scope": {
        "targets": ["文档上传"],
        "allowed_actions": ["浏览器上传", "修复上传或解析缺陷"],
        "forbidden_actions": ["headless 结果冒充正式证据"],
        "constraints": {"浏览器": "headless=false", "格式": "PDF、Word 各一份"}
      },
      "acceptance": ["两份文档可检索且分片数大于 0", "检索各命中一句具体内容"]
    },
    {
      "origin_id": "F1S3-G3",
      "subject": "pgvector 向量列与部署顺序",
      "criterion": "D022-07：pgvector 存储向量、按租户隔离；UAT 扩展可用性在阶段 3 期间核实并报告",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/f1-stage3-1.md 一、五"],
      "diagnosis": {
        "location": "V0.2.5 向量列与 PgKnowledgeVectorStore",
        "observed": "未说明不同维度模型能否并存，未说明扩展晚于升级安装时向量列如何补齐",
        "expected": "不同维度的两个知识库都能入库检索；给出先装扩展或补建向量列的可执行部署顺序",
        "cause": "本地库扩展先于迁移安装，未覆盖其他顺序；只用一种维度验证",
        "next_action": "用两种维度实测，并在临时无扩展库上实测升级后装扩展的路径"
      },
      "scope": {
        "targets": ["向量列", "部署顺序"],
        "allowed_actions": ["本地实测", "修复向量列补建", "写部署顺序"],
        "forbidden_actions": ["连接或修改 UAT", "静默降级为无向量检索"],
        "constraints": {"维度": "OpenRouter 模型与本地模拟服务各一", "无扩展库": "临时库，验证后删除"}
      },
      "acceptance": ["两种维度知识库均可入库检索", "升级后装扩展路径实测可用或已修复", "部署顺序写明"]
    },
    {
      "origin_id": "F1S3-G4",
      "subject": "知识库页空状态提示",
      "criterion": "知识库管理页提示与页面布局一致",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/assets/f1-stage3-1-tenant-isolation.png"],
      "diagnosis": {
        "location": "/agent/knowledge 空状态",
        "observed": "页面无左侧栏，空状态提示“请选择左侧知识库”",
        "expected": "无知识库时提示新建，有知识库未选中时提示选择，不提“左侧”",
        "cause": "空状态文案与上下布局不符",
        "next_action": "修正文案并截图两种状态"
      },
      "scope": {
        "targets": ["知识库页空状态"],
        "allowed_actions": ["修改提示文案", "浏览器验证"],
        "forbidden_actions": ["改动知识库页布局"],
        "constraints": {"浏览器": "headless=false", "状态": "无知识库、有知识库未选中"}
      },
      "acceptance": ["两种状态提示正确且不出现左侧"]
    }
  ],
  "history_summary": {"revision": 6, "review": "product/0.2.2/receipts/planning-review-f1-stage2-03.md", "retained_count": 14, "status_counts": {"RESOLVED": 14}}
}
```
