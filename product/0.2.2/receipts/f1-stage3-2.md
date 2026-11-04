# F1 阶段 3（RAG）补充执行回执 · 第 2 轮

- 执行入口：`product/0.2.2/receipts/planning-execution-prompt-f1-stage3-01.md`（依据审查 `planning-review-f1-stage3-01.md`、D022-09）
- 代码状态（本轮最终提交）：server `feature/0.2.2-agent` @ `897983e0`；web `feature/0.2.2-agent` @ `c83a479`
- 远端回读（`git ls-remote origin`）：
  - Server：`897983e02fcf2cb91b688b0f3ab6927070a50e6e`
  - Web：`c83a4790ef9388536217d63a0008d9df6630f2d5`
- 验证环境：本地 PG 18（`smart_workflow_f1v4b`，pgvector 0.8.7）、server 8080、vite 5174、本地向量桩 9998；真实 Embedding 使用 **OpenRouter `openai/text-embedding-3-small`（1536 维）**，真实 LLM 使用 Command Code `deepseek/deepseek-v4.1-flash`。可见浏览器（ZCode 应用内浏览器，headless=false，1440×900）。
- Key：OpenRouter Key 由执行会话读取后在内存中加密，经页面上下文调用本地供应商保存接口写入 `sw_agent_provider.api_key_cipher`（AES-GCM，密文长度 136）；未写入任何文件/迁移/种子/回执/提交/日志/截图，仓库与本机证据文件扫描均无 `sk-or-v1` 明文。

## 零、证据对应提交与 V0.2.5 后续改动说明

- 本轮 G1/G2/G3/G4 证据来自 server `897983e0`、web `c83a479` 的最终工作树（G1 最终执行 `2117914543437918210` 在 `897983e0` 提交后、同一运行时代码上执行）。
- **V0.2.5 在上一轮证据采集后的改动**：上一轮首次采集证据（15:52）时 V0.2.5 为“无条件 `CREATE EXTENSION` + `embedding vector` 列”。随后 PG 全链门禁在 zonky embedded PG（无 pgvector）失败，遂将 V0.2.5 改为条件式：建表始终执行，仅当 `pg_available_extensions` 有 `vector` 时才创建扩展与向量列；该修改已包含在上一轮提交 `37ee9bae`。本轮再新增 `KnowledgeVectorColumnInitializer`（`897983e0`），覆盖“先升级、后装扩展”时启动自动补列。G1 已在本轮最终提交上重新执行，不依赖上一轮旧列状态的证据。

## 一、F1S3-G1 真实 Embedding 下的检索与 RAG ✅

### OpenRouter Embedding 核实（D022-09）

- `POST https://openrouter.ai/api/v1/embeddings` 实测：
  - `openai/text-embedding-3-small` → 200，**1536 维**（选用，最便宜档）
  - `openai/text-embedding-3-large` → 200，3072 维
  - `qwen/qwen3-embedding-8b` → 200，4096 维
  - `cohere/embed-english-v3.0` → 400（模型不存在）
- 本地库：供应商 `openrouter-embed-p`（id 920001，`https://openrouter.ai/api/v1`，OPENAI_CHAT），模型 `openrouter-embed-m`（id 920002，`openai/text-embedding-3-small`，EMBEDDING）。证据：`assets/f1-stage3-2-openrouter-embedding.txt`。

### 多文档检索（知识库 `rag-openrouter-kb`，1536 维，阈值 0.2）

| 查询 | 结果（相似度） |
|---|---|
| 蓝鲸计划的项目代号是什么？ | **blue-whale.md 0.758（第一）**；mars-base.md 0.256 |
| 火星基地的通行码是什么？ | **mars-base.md 0.613（第一）**；blue-whale.md 0.298 |
| 今天北京天气怎么样？（无关） | **0 命中**（全量相似度 mars 0.106 / blue 0.065，均低于 0.2） |

- 截图：`assets/f1-stage3-2-retrieval-blue.png`、`assets/f1-stage3-2-retrieval-mars.png`、`assets/f1-stage3-2-retrieval-unrelated.png`（界面显示阈值 0.20 与“没有命中分片”）。
- 知识库含 4 份文档（blue-whale.md、mars-base.md、pdf-probe.pdf、word-probe.docx），均 READY、各 1 分片；见 `assets/f1-stage3-2-g1-db-evidence.txt`。

### 真实 RAG graph

- 图 `rag-openrouter-graph`（id `2117909056290041858`，发布 v2）：START → KNOWLEDGE（`rag-openrouter-kb`，topK 3，阈值 0.2）→ LLM → END。
- 最终提交上的执行 `2117914543437918210`：`SUCCESS`，4131ms，输入 213 / 输出 42 tokens，输出 **“蓝鲸计划的项目代号是蓝鲸七号。”**
- 截图：`assets/f1-stage3-2-rag-execution.png`（执行详情，输出与快照 v2）、`assets/f1-stage3-2-rag-trace.png`（知识检索节点输出 blue-whale 0.758、word 0.441、pdf 0.413）。
- 数据库回读：执行记录与节点轨迹见 `assets/f1-stage3-2-g1-db-evidence.txt`。

## 二、F1S3-G2 页面上传 PDF、Word ✅

- 在 `/agent/knowledge` 页面通过文件选择事件上传：
  - `pdf-probe.pdf`（PDFBox 生成，含“PDF 专属事实：白鹭计划的验收码是青岚-88”）
  - `word-probe.docx`（最小 OOXML，含“Word 专属事实：海豚计划的序列号是碧波-19”）
- 两份均显示“可检索”、分片数 1（页面截图已在两次检索截图中同时展示文档列表与状态）。
- 检索：
  - “白鹭计划的验收码是什么？” → **pdf-probe.pdf 0.700（第一）**，blue 0.465，word 0.441（截图 `f1-stage3-2-retrieval-pdf.png`）。
  - “海豚计划的序列号是什么？” → **word-probe.docx 0.679（第一）**，blue 0.533，pdf 0.478（截图 `f1-stage3-2-retrieval-word.png`）。
- 数据库：`pdf-probe.pdf`/`word-probe.docx` 均 `READY`、`chunk_count=1`；见 `assets/f1-stage3-2-g2-db-evidence.txt`。

## 三、F1S3-G3 向量维度与部署顺序 ✅

### 不同维度并存

- 同一 `sw_knowledge_chunk.embedding vector`（无维度 typmod）列同时存有两类向量：
  - `rag-openrouter-kb`：OpenRouter `text-embedding-3-small`，**1536 维**，4 分片；
  - `rag-demo-kb`：本地模拟 Embedding，**64 维**，1 分片，检索“松果项目的编号是什么？”命中 `pinecone.md` 0.417。
- 证据：`assets/f1-stage3-2-pgvector-dimensions.txt`、`assets/f1-stage3-2-retrieval-64dim.png`。

### “先升级、后装扩展”实测

1. 干净 PG 17 容器（无 pgvector 库）：应用 V0.2.5 迁移成功，`sw_knowledge_chunk` 建表，`embedding` 列不存在；应用启动成功并输出 WARN：“pgvector 扩展未安装…安装扩展并重启后自动补建”。
2. 在容器安装 `postgresql-17-pgvector` 并 `CREATE EXTENSION vector`，重启应用；`KnowledgeVectorColumnInitializer` 输出 INFO 并自动执行 `ALTER TABLE sw_knowledge_chunk ADD COLUMN embedding vector`。
3. 回读列类型 `USER-DEFINED/vector`，写入 `[1,2,3]` 并计算 cosine=1，证明补列后可正常写入。
- 证据：`assets/f1-stage3-2-pgvector-dimensions.txt`；临时库/容器验证后已删除。

### UAT 部署顺序（写入回执）

1. 停服/备份（按现有发布流程）。
2. 在目标 PG 安装 pgvector 扩展包，并以 DBA 账号在目标库执行 `CREATE EXTENSION IF NOT EXISTS vector;`。
3. 启动/升级应用：V0.2.5 建知识库表；扩展已存在时同时创建 `embedding` 列。
4. 若先升级、后装扩展：安装扩展后**重启应用**，启动初始化器自动补建 `embedding` 列；无需手工 DDL。
5. 回读：`SELECT extversion FROM pg_extension WHERE extname='vector';` 与 `SELECT column_name, udt_name FROM information_schema.columns WHERE table_name='sw_knowledge_chunk' AND column_name='embedding';`。
6. UAT 本轮未连接（Owner 决定放发布阶段），凭据/扩展安装由发布阶段核实；无法安装时由 Owner 决定是否延期 RAG。

## 四、F1S3-G4 空状态提示 ✅

- 无知识库：显示“还没有知识库，点击右上角‘新建知识库’开始”（`assets/f1-stage3-2-empty-no-kb.png`，租户 9001）。
- 有知识库未选中：显示“请选择知识库”，不再出现“左侧”（`assets/f1-stage3-2-empty-has-kb.png`，admin 两条知识库）。

## 五、门禁结果

| 项 | 结果 | 原始输出 |
|---|---|---|
| sw-basic-agent 全量测试 | **337/337 通过**，BUILD SUCCESS | `assets/f1-stage3-2-agent-tests.log` |
| sw-basic-knowledge 全量测试 | **14/14 通过**（含向量列补建 3 例、PDF/DOCX 解析） | 同上 |
| sw-bootstrap 迁移/升级演练（7 类） | **47 run / 0 fail / 0 error / 1 skipped**，BUILD SUCCESS | `assets/f1-stage3-2-migration-tests.log` |
| Web typecheck | 0 错误 | — |
| Web lint | 0 错误 | — |
| Web vitest | **2012 passed + 3 skipped** | `assets/f1-stage3-2-web-vitest.log` |
| Web build | ✓ built in 4.09s | — |

## 六、限制

- UAT 未连接、未核实 pgvector（按 Owner 决定放发布阶段）；发布前需按上述顺序安装并回读。
- OpenRouter Key 仅本地库密文保留；未在回执/日志/截图中出现。
- PDF/Word 为本地生成的探测文档（PDFBox/最小 OOXML），用于验证解析、切分、向量与检索链路，不代表格式全覆盖。
- 本地验证库保留（含 OpenRouter 供应商/模型密文、两个知识库、4+1 份文档与执行记录）；验证进程已停止，临时容器/库/目录已清理。
