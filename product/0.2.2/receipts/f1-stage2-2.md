# F1 阶段 2 补充执行回执（第 2 轮）

- 执行入口：`product/0.2.2/receipts/planning-execution-prompt-f1-stage2-01.md`
- 代码状态：server `feature/0.2.2-agent` @ `6aa674d9`；web `feature/0.2.2-agent` @ `7b81917`
- 远端回读（`git ls-remote origin`）：
  - Server：`6aa674d935ce2ccbeaf2a0d8fe8d97eea8548411`
  - Web：`7b819174cbec4138b4733282f89d8aab7254a429`
- 验证环境：本地 PG 18（`smart_workflow_f1v4b`，沿用保留库）、server 8080（local profile）、vite 5174、本地模型桩 9998（OpenAI 兼容，返回固定文本）；可见浏览器（ZCode 应用内浏览器，headless=false，1440×900）。
- 本轮边界：只处理 G1/G2/G3，未调用真实模型；锁定项未逐条重验，仅在改动触及执行轨迹/节点 DTO 的路径上跑全量回归。

## 一、F1S2-G1 执行详情 LLM 节点卡片 ✅

### 原因（后端未返回，非前端字段映射错位）

- 后端 `AgentGraphExecutionNodeDTO` 只有 `nodeSeq/branchId/nodeId/nodeType/nodeLatencyMs/variableSnapshot/inputTokens/outputTokens/toolCalls`，**从未返回** `input`、`output`、`startTime`、`endTime`、`status`、`errorMessage`。
- 前端 `NodeTrajectory.vue` 按契约读取 `node.input`、`node.output`、`node.startTime`、`node.endTime`，因此两栏恒为空。
- 前端 `formatTimestamp` 用 `new Date('-')` 得到 Invalid Date，`toLocaleString()` 不会抛异常，`try/catch` 捕获不到，最终显示 `Invalid Date`。

### 修复

- 解释器节点轨迹新增：`inputText`（LLM=模板插值后的真实用户消息；TOOL=工具入参）、`outputText`（LLM=工具循环后的模型最终回答；TOOL=工具返回）、`startTime`（出队时点）、`endTime`（本步完成时点）、`status`（SUCCESS/FAILED）、`errorMessage`。
- V0.2.4 迁移（PG/H2）为 `sw_agent_graph_execution_node` 增加 `input_text/output_text/start_time/end_time/status/error_message`；执行服务落库并在节点 DTO 返回（DTO 字段名对齐前端契约 `input/output`）。
- 前端 `formatTimestamp` 对缺失/非法值返回占位 `-`；节点名称缺失时回退为节点类型中文名（如“LLM 调用”），不再出现空白标题。

### 验证（本地桩，未调用真实模型）

- 图 `verify-tool-graph`（id `2117845851056472066`，已发布 v3，模型 `verify-main-m`，本地桩）。
- 执行记录 `2117867587139309570`：`SUCCESS`，绑定快照 v3，耗时 183ms。
- 节点 `#2 LLM` 卡片显示：
  - 输入变量：`请处理`（该图 `userPromptTemplate` 的真实解析结果）
  - 输出结果：`节点卡片最终回答`（桩模型最终回答）
  - 开始/结束时间：`2026/11/04 14:32:35`（真实值，非 Invalid Date）
  - 状态“成功”，Token 输入 12 / 输出 8
- 截图：`assets/f1-stage2-2-g1-llm-node.png`（节点卡片输入/输出）、`assets/f1-stage2-2-g1-llm-node-time.png`（时间信息）。
- 数据库回读：`assets/f1-stage2-2-db-evidence.txt`（节点 `input_text=请处理`、`output_text=节点卡片最终回答`、起止时间非空）。
- 历史执行（升级前落库）新列为 NULL，前端显示占位 `-`，不会出现 `Invalid Date`；无法重建历史节点的真实输入输出，未做回填。

## 二、F1S2-G2 工作台 6 个快捷入口 ✅

从 `/agent` 工作台逐一点击，均打开对应页面并截图：

| 入口 | 打开地址 | 截图 |
|---|---|---|
| 大模型管理 | `/agent/model` | `assets/f1-stage2-2-g2-model.png` |
| 图定义管理 | `/agent/graph-def` | `assets/f1-stage2-2-g2-graph.png` |
| 工具管理 | `/agent/tool` | `assets/f1-stage2-2-g2-tool.png` |
| 执行历史记录 | `/agent/executions/list` | `assets/f1-stage2-2-g2-executions.png` |
| 会话历史 | `/agent/conversations/list` | `assets/f1-stage2-2-g2-conversations.png` |
| 知识库 | `/agent/knowledge` | `assets/f1-stage2-2-g2-knowledge.png` |

## 三、F1S2-G3 单步调试快照版本 ✅

- 对已发布图 `verify-tool-graph`（当前发布版本 v3）点击“更多 → 调试”，输入 `G3 调试输入` 创建调试会话 `2117868131480276993`。
- 调试页头部显示 **快照版本：v3**；点击“单步”后 `trace 1`，下一节点 `node_llm`，会话状态 `PAUSED`。
- 截图：`assets/f1-stage2-2-g3-debug-session.png`（创建后 v3/trace 0）、`assets/f1-stage2-2-g3-debug-step.png`（单步后 v3/trace 1）。
- 数据库回读：调试会话 `graph_def_version=3`，图定义 `def_version=3`，一致；`state_json.traceSeq=1`、`activePoints=[node_llm]`。见 `assets/f1-stage2-2-db-evidence.txt`。

## 四、门禁结果

| 项 | 结果 | 原始输出 |
|---|---|---|
| sw-basic-agent 全量测试 | **335/335 通过**，BUILD SUCCESS | 本地 Maven 输出 |
| sw-bootstrap 迁移/升级演练（7 类） | **47 run / 0 fail / 0 error / 1 skipped**（缺 pg_dump/pg_restore 前置跳过），BUILD SUCCESS | `assets/f1-stage2-2-migration-tests.log` |
| Web typecheck | 0 错误 | — |
| Web lint | 0 错误 | — |
| Web vitest | **2005 passed + 3 skipped**（230 文件通过/1 跳过） | `assets/f1-stage2-2-web-vitest.log` |
| Web build | ✓ built in 3.98s | — |

迁移计数随 V0.2.4 更新为 23 条（V0.2.0 + V0.2.2 + V0.2.3 + V0.2.4 + 19 R__）；H2/PG 全链、I6G7 升级演练、应用中心衔接演练均通过。

## 五、Key 与本地库

- 本轮使用本地桩模型，未调用真实 Command Code 模型，未读取或输出任何 Key。
- 本地验证库 `smart_workflow_f1v4b` 保留；`verify-real-cc` 的 Key 仍只以 AES-GCM 密文存于 `sw_agent_provider.api_key_cipher`，未进入 git、种子、迁移、回执、日志或截图。

## 六、限制

- 历史执行节点无 `input_text/output_text/start_time/end_time`（升级前未采集），页面显示占位 `-`；不回填，避免伪造历史数据。
- 节点“名称”仍取节点类型中文名（设计器未持久化自定义名称），本轮通过前端回退显示，未新增名称字段。
- 调试页复用 `NodeTrajectory`，其输入列仍展示调试变量快照（既有调试语义），本轮未改调试节点 DTO。
