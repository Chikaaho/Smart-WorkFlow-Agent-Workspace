# F1 阶段 3（RAG）执行回执 · 第 1 轮

- 执行入口：`product/0.2.2/ready/direction-022-f1-agent.md` 阶段 3
- 代码状态：server `feature/0.2.2-agent` @ `37ee9bae`；web `feature/0.2.2-agent` @ `93cb6ee`
- 远端回读（`git ls-remote origin`）：
  - Server：`37ee9bae9a718d54f099385d11b2f9c8e059196a`
  - Web：`93cb6ee5974f0aa633bf7177420811fcbfed7713`
- 验证环境：本地 PG 18（`smart_workflow_f1v4b`，已安装 pgvector 0.8.7）、server 8080（local profile）、vite 5174、本地 OpenAI 兼容桩 9998（Chat + Embeddings）；真实 LLM 使用本地库已有的 Command Code `deepseek/deepseek-v4.1-flash`（`verify-real-m`）。可见浏览器（ZCode 应用内浏览器，headless=false，1440×900）。
- Key 处理：真实 Key 仍只以 AES-GCM 密文存于本地 `sw_agent_provider`；本轮未读取、未输出、未写入任何文件/回执/日志/截图，所有真实模型调用经后端既有加密装配完成。

## 一、变更摘要

### 数据与迁移（V0.2.5，PG/H2）

- `sw_knowledge_base`：知识库（名称、描述、embedding_model_id、chunk_size、chunk_overlap，租户隔离）。
- `sw_knowledge_document`：文档（抽取文本、原始文件名/类型/大小、PENDING/PROCESSING/READY/FAILED、错误、分片数）。
- `sw_knowledge_chunk`：分片元数据；PG 在 pgvector 可用时增加 `embedding vector` 列（维度由所选模型决定），H2 为 CLOB 占位并使用内存向量实现。
- PG 迁移对扩展缺失环境不阻断建表，但 `PgKnowledgeVectorStore` 首次向量写入/检索会校验 embedding 列并给出明确错误（不静默降级）；本地 PG 已 `CREATE EXTENSION vector`（0.8.7），列已创建。
- 迁移计数 24 条（V0.2.0 + V0.2.2/0.2.3/0.2.4/0.2.5 + 19 R__）。

### 后端

- `sw-basic-knowledge`：知识库/文档/分片实体与 Mapper、KB/文档/检索服务、Controller（`/agent/knowledge-bases`）、Tika 文档解析、字符切分器、pgvector 与内存两套向量存储、Embedding SPI。
- `sw-basic-agent`：
  - `AgentModelRuntimeService` 增加 EMBEDDING 模型单例装配/修订失效/批量向量化；新增 `AgentEmbeddingModelAssembler`（OpenAI Chat/Responses 走 `/embeddings`；Anthropic 明确不支持）。
  - `AgentKnowledgeEmbeddingClient` 实现 knowledge 的 SPI（knowledge 不反向依赖 agent）。
  - 图解释器/单步调试新增 `KNOWLEDGE` 节点：读取 `knowledgeBaseId/topK/similarityThreshold`，检索结果按“文档 + 相似度 + 正文”写入 `outputVar`；轨迹记录真实输入/输出；新增错误分类 `KNOWLEDGE_RETRIEVAL_FAILED`。
  - 图执行/调试执行前校验 `KNOWLEDGE` 节点配置（知识库必填、topK 1~20、阈值 0~1）。

### 前端

- `/agent/knowledge` 由占位页改为知识库管理：新建知识库（仅列 EMBEDDING 模型、切分块大小/重叠可配）、文档上传（PDF/Word/TXT/Markdown，≤5MB）、状态与分片数、删除文档/知识库、检索测试（topK/阈值/命中片段与相似度）。
- 图设计器新增“知识检索”节点与属性面板（知识库、topK、阈值、输入/输出变量）；节点类型/枚举/i18n 同步。
- 长整型 id 全程保留字符串（避免雪花 id 精度丢失导致 404）。

## 二、阶段 3 完成断言逐条结果

### 1. 上传文档后完成切分和向量化，检索测试命中文档具体内容 ✅

- 浏览器创建 `rag-demo-kb`（`verify-embed-m`，chunk 800/overlap 100），上传 `blue-whale.md`，状态“可检索”、分片数 1（截图 `assets/f1-stage3-1-doc-uploaded.png`）。
- 检索“蓝鲸计划的项目代号是什么？”命中 `blue-whale.md` 分片，相似度 36.5%，正文含“蓝鲸七号”（截图 `assets/f1-stage3-1-retrieval.png`）。
- 解析能力：Tika 覆盖 PDF（既有 PDFBox→Tika 真实解析测试）、Word（新增最小 DOCX 解析测试）、TXT/Markdown（解析测试 + 页面真实上传）。

### 2. “知识检索 → LLM”graph 在真实模型下回答出文档独有事实 ✅

- 图 `rag-verify-graph`（id `2117888847034507266`，发布 v2）：START → KNOWLEDGE（kb `2117888401737834498`，topK 3）→ LLM（`deepseek/deepseek-v4.1-flash`）→ END。
- 真实执行 `2117893398131232770`：`SUCCESS`，耗时 2604ms，输入 133 / 输出 56 tokens，输出 **“蓝鲸计划的项目代号是蓝鲸七号。”**（该事实只存在于上传文档）。
- 截图：`assets/f1-stage3-1-rag-answer.png`（设计器执行成功）、`assets/f1-stage3-1-rag-trace.png`（执行详情节点轨迹：KNOWLEDGE 输出检索片段，LLM 输出最终回答）。
- 数据库回读：`assets/f1-stage3-1-db-evidence.txt`（执行、节点输入/输出、KB/文档/分片、pgvector 扩展与列）。

### 3. 另一租户看不到、也检索不到该知识库 ✅

- 以租户 9001 管理员 `demo_a_hq_1` 登录（本地库临时重置为既有测试口令，仅本地验证）：
  - `GET /agent/knowledge-bases` → `code=0`，`total=0`；
  - `GET /agent/knowledge-bases/2117888401737834498` → `code=404`；
  - `POST .../retrieve` → `code=404`。
- 浏览器截图：`assets/f1-stage3-1-tenant-isolation.png`（张伟账号下知识库数量 0）。
- 隔离由 MyBatis 租户拦截器 + pgvector SQL 显式 `tenant_id` 条件共同保证。

### 4. 删除文档后检索不到该文档内容 ✅

- `DELETE /agent/knowledge-bases/{kb}/documents/{doc}` → `code=0`；随后检索 `code=0`、命中 0 条。
- 数据库：`sw_knowledge_chunk` 该 KB 分片数 0（物理删除，向量不残留），文档 `deleted=1`。见 `assets/f1-stage3-1-deletion-evidence.txt`。
- 同时验证删除知识库：再次上传文档（READY）→ 删除 KB → `GET` 返回 404，分片 0、文档 0、KB `deleted=1`。

## 三、Embedding 真实供应商核实（按方向要求）

- Command Code `GET /provider/v1/models`：HTTP 200，全部模型 `supported_endpoints` 仅 `/chat/completions`、`/responses`、`/messages`，无 embedding 模型/端点。
- Command Code `POST /provider/v1/embeddings`：`text-embedding-3-small` 与 `deepseek/deepseek-v4.1-flash` 均返回 **404 “not a registered API route”**。
- 结论：Command Code 当前不提供 OpenAI 兼容 Embeddings。阶段 3 其余功能按方向继续；Embedding 使用本地 OpenAI 兼容桩（确定性 64 维向量）完成功能验证，真实 Embedding 供应商待 Owner/规划另行提供。核实记录：`assets/f1-stage3-1-embedding-probe.txt`。

## 四、门禁结果

| 项 | 结果 | 原始输出 |
|---|---|---|
| sw-basic-agent 全量测试 | **337/337 通过**，BUILD SUCCESS | `assets/f1-stage3-1-agent-tests.log` |
| sw-basic-knowledge 全量测试 | **11/11 通过**（Tika PDF、DOCX、TXT/MD、切分、KB/文档/检索服务） | 同上（reactor 日志） |
| sw-bootstrap 迁移/升级演练（7 类） | **47 run / 0 fail / 0 error / 1 skipped**（缺 pg_dump/pg_restore 前置跳过），BUILD SUCCESS | `assets/f1-stage3-1-migration-tests.log` |
| Web typecheck | 0 错误 | — |
| Web lint | 0 错误 | — |
| Web vitest | **2012 passed + 3 skipped**（231 文件通过/1 跳过） | `assets/f1-stage3-1-web-vitest.log` |
| Web build | ✓ built in 4.28s | — |

迁移计数 24 条；H2/PG 全链、I6G7 升级演练、应用中心衔接演练均通过。PG 全链测试使用的 zonky embedded PG 无 pgvector，V0.2.5 按条件建表通过；生产/本地 PG 要求扩展存在（本地 0.8.7 已验证）。

## 五、限制与偏差

- **UAT pgvector 未核实**：未取得 UAT（chikaho.cn，PG 5433）的主机/数据库凭据，无法远程确认扩展可用；按方向要求报告，发布前需 Owner/运维核实并在无法安装时决策（不静默降级）。
- **Embedding 真实供应商缺失**：Command Code 无 Embeddings 接口；本轮用本地桩完成检索/图/租户/删除验证，真实 Embedding 质量与供应商兼容性待 Owner 提供后再验。
- 文档处理为同步执行（上传请求内完成切分/向量化），状态字段已覆盖 PENDING/PROCESSING/READY/FAILED；大文件受 5MB 上传上限与 2000 分片保护。
- 知识库权限沿用 Agent 既有 `agent:model:view/manage`，未新增菜单权限码。
- 升级前本地验证数据在重建 V0.2.5 校验和时清理；本轮证据截图与数据库回读均在清理前采集。

## 六、证据与清理

- 截图：`f1-stage3-1-kb-created.png`、`f1-stage3-1-doc-uploaded.png`、`f1-stage3-1-retrieval.png`、`f1-stage3-1-rag-answer.png`、`f1-stage3-1-rag-trace.png`、`f1-stage3-1-tenant-isolation.png`。
- 日志：`f1-stage3-1-agent-tests.log`、`f1-stage3-1-migration-tests.log`、`f1-stage3-1-web-vitest.log`。
- 数据：`f1-stage3-1-db-evidence.txt`、`f1-stage3-1-deletion-evidence.txt`、`f1-stage3-1-embedding-probe.txt`。
- 本地验证库 `smart_workflow_f1v4b` 保留（V0.2.5 已应用、pgvector 0.8.7、知识库表已建）；真实 Key 密文保留；验证用 8080/5174/9998 进程已停止，临时目录已删除。
