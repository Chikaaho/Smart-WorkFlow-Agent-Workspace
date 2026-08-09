# 探索回执：M07 Agent 模块落地前置调研

**执行模型**：deepseek/deepseek-v4-flash（本会话）
**执行日期**：2026-08-04
**任务来源**：`search_task/m07-agent-kickoff.md`
**任务状态**：✅ 全部 7 问均有明确答案，无重大超范围发现，无需继续探索
**未确认事项**：无（仅 1 处低优先级疑点见 §8，不影响 Step 拆分）

---

## 1. 后端 `sw-biz` 下是否存在 agent 骨架

**结论：`sw-biz/` 下不存在，但 `sw-basic/sw-basic-agent/` 存在最小骨架**（注意：M07 模块落在 `sw-basic-*` 层而非 `sw-biz-*` 层，与 D1「-api/-biz 拆分」模式不同——agent/knowledge/iot/job/notify/storage 均为 sw-basic 层模块）。

`sw-biz/` 实际模块：`sw-biz-form`、`sw-biz-openapi`、`sw-biz-system`、`sw-bpm`（无 agent）。

`sw-basic-agent` 现有文件（共 4 个源文件 + 1 个空迁移目录）：

| 文件 | 内容 |
|------|------|
| `Smart-WorkFlow/sw-basic/sw-basic-agent/pom.xml` | 依赖：`sw-common`、`sw-basic-knowledge`、`spring-ai-starter-model-openai`、`spring-ai-starter-model-ollama`、`langgraph4j-core`、lombok。描述：AI 智能助手模块：大模型管理/调度图编排（LangGraph4j）/助手/对话 |
| `.../src/main/java/com/sw/ck/agent/config/AgentGraphAutoConfiguration.java` | **空 AutoConfiguration 占位**（14 行）：`@ConditionalOnProperty(prefix="sw.agent", name="enabled", havingValue="true")`，默认关闭，注释注明「LangGraph4j 调度图编排」 |
| `.../src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` | 注册上述配置类 |
| `.../src/main/resources/db/migration/agent/.gitkeep` | 空 Flyway 迁移目录（表前缀预留 `sw_agent_`：会话、消息、工具调用，见 `knowledge/architecture.md`） |
| `target/` | 有已编译产物（jar），说明骨架曾被构建过 |

关联事实：
- `sw-bootstrap/pom.xml:72` 已引用 `sw-basic-agent`（随 bootstrap 启动加载）
- `sw-dependencies/pom.xml` 已管理版本：`spring-ai.version=1.0.4`（BOM 导入）、`langgraph4j.version=1.5.14`（langgraph4j-core）
- `knowledge/architecture.md:287`：「AI Agent | Spring AI + LangGraph4j」
- 无任何 application.yml 中的 `sw.agent` 配置项（`sw-bootstrap` 配置中搜索零命中）
- 无 Entity/Service/Controller/API 实现，无 SQL 脚本

## 2. 前端 `src/modules/agent/` 现状

**结论：占位骨架，仅 1 个空页面组件。**

- `Smart-WorkFlow-Web/src/modules/agent/views/AgentHome.vue`（8 行）：仅渲染 `<BlankPage />`
- 路由/菜单已注册：`Smart-WorkFlow-Web/src/foundation/mock/seeds.ts:203-214`（菜单 id=5，name=`agent`，title=`智能体`，path=`agent`，component=`agent/views/AgentHome`，icon=`MagicStick`，permission=`agent:view`）
- `modules/agent/` 下无 stores/api/contracts 等其他文件
- 与 feature-checklist-sync 回执记载一致：「modules/agent、modules/iot、modules/openapi 已有路由和菜单注册但页面为空白占位」

## 3. Vue Flow adapter 对外 API / 零消费方 / 接入限制

**文件**：`Smart-WorkFlow-Web/src/adapters/flow-graph/index.ts`（147 行，已实现，Step 1 PASSED）

**对外导出（6 个符号，业务层只认这些契约，`@vue-flow/core` 原生 API 禁出防腐层）**：

```ts
// 类型
interface FlowGraphNode { id; type?; label?; position: {x,y}; data?: Record<string, unknown> }
interface FlowGraphEdge { id; source; target; label? }
interface FlowGraphData { nodes: FlowGraphNode[]; edges: FlowGraphEdge[] }
interface FlowGraphEvents { onNodeClick?; onEdgeCreate?; onGraphChange? }  // 均为回调
interface FlowGraphInstance { exportGraph(): FlowGraphData; destroy(): void }
// 函数
mountFlowGraph(container: HTMLElement, initialData?: FlowGraphData, events?: FlowGraphEvents): FlowGraphInstance
```

**零消费方含义**（CONFIRMED `product/vue-flow-adapter/step-0-exploration-summary.md:45`）：当前仓库中没有任何文件 import `adapters/flow-graph/`。即新消费页面接入时没有任何现成接线可复用，需自建挂载点 + 数据进出 + 事件处理。

**接入时需要知道的限制/坑**（`knowledge/features/vue-flow-adapter.md` §2.2/§2.4/§8 + 源码）：

| 限制 | 说明 |
|------|------|
| 仅裸包 | 只安装了 `@vue-flow/core@^1.48.2`；无 `@vue-flow/background`/`controls`/`minimap` 等视觉配套子包，需要时需另行评估安装 |
| 无编辑工具栏 | adapter 只做数据进出与事件转发，增删节点按钮等 UI 控件需消费方自建；节点拖拽/连线交互为 Vue Flow 默认能力 |
| 无路由/菜单/演示页 | 消费方需自行注册路由与菜单 |
| 样式 | `@vue-flow/core/dist/style.css` 已在 index.ts 内显式引入（漏引则白屏） |
| 生命周期 | 内部 `createApp`+`defineComponent`+`h()` 命令式挂载，必须调 `destroy()` 防内存泄漏（幂等） |
| 事件模型 | `onUpdate:nodes/edges` 以全量数组同步 ref 并触发 `onGraphChange`；`onEdgeCreate` 的 edge id 由内部生成（`vf-{source}-{target}-{ts}`），消费方若要持久化需注意 |
| 非目标 | 本功能明确不含与 `modules/agent/` 联动——`sw-basic-agent` 后端骨架未就位，adapter 独立先行属预期状态 |

测试基线：6 个新增测试，前端全量基线 57 spec files / 497 tests 全绿（CONFIRMED 2026-07-25）。

## 4. I13 完整原始记录

来源：`knowledge/known-issues.md:195-202`，全文引用如下：

> ### I13：M07 AI 调度图执行引擎/工具沙箱/RAG 选型未定
> - **发现日期**：2026-06-30（PRD v0.1）
> - **严重程度**：中
> - **可信度**：ASSUMED（需求级，待细化）
> - **描述**：AI 智能助手模块（M07）的调度图执行引擎落地形态、工具沙箱边界、RAG 向量库选型、与流程/表单的联动点均待专项产品设计
> - **影响**：M07 模块无法进入实质性开发
> - **建议**：在 M07 专项产品设计完成前，不在此模块投入编码资源

**既往讨论/候选方案/排除项**：I13 条目本身无。但仓库内存在**事实性选型痕迹**（非产品决策，属已落地的依赖管理）：
- pom 依赖已选定 **Spring AI 1.0.4（OpenAI 兼容 + Ollama 双 starter）+ LangGraph4j 1.5.14**（`sw-dependencies/pom.xml:22,35,77,139`）
- `knowledge/architecture.md:287` 同口径：「AI Agent | Spring AI + LangGraph4j」
- 功能清单 M07-F01-01 提及协议类型「OpenAI 兼容/Ollama/其他」——与 pom 双 starter 呼应
- 未发现 RAG 向量库、工具沙箱、执行引擎形态的任何候选方案或排除记录

## 5. model-registry.md 与 Agent/AI 引擎相关注册信息

**结论：无任何与产品内 LLM provider / API key 管理相关的信息。**

`knowledge/model-registry.md` 登记的是**工作区开发流程所用模型**（deepseek-v4-pro/flash、claude-opus-4.8、claude-sonnet-5 等 OpenRouter ID，用于规划层/执行层调度），与 M07 产品功能（spring-ai 接入的模型）完全无关。产品侧 LLM 相关要求只在功能清单 M07-F01 明细（API Key 加密存储、多 Key 轮询、额度/限流管理 = M07-F01-04）与 pom 依赖层面。

## 6. decisions.md 中与 M07/Agent/AI 相关的历史决策

全量扫描 D1–D46。相关仅 2 条（均 CONFIRMED）：

- **D39（2026-07-25）**：Vue Flow 场景归属裁定为 **M07 AI 调度图**（AI agent 任务编排/流程图可视化），更正知识库中「表单设计器可视化集成」的错误标签；同步更正 I3 建议字段（Vue Flow adapter 与 BPM 无关，独立功能推进）。— 直接确立 M07 前端可视化技术路线 = flow-graph adapter。
- **D42（2026-07-25）**：禁止用 Agent 工具派子代理替代 Step 0 探索——子代理未真正切换模型族，DeepSeek 系探索需整体退出 Claude Code 走独立 base API。— 与本探索任务的「文件化下发 + 切换模型执行」机制直接相关（即本次任务的产生原因）。

其余 D1–D46 与 M07/Agent/AI 调度图无关（D1-D9 架构、D10-D18 工作区机制、D19-D38 表单/BPM/认证/存储/流程监控等、D40-D41 BPMN/违规事件、D43-D46 process-monitoring）。无被否决或搁置的 Agent 方案。

## 7. 用户提出但未落地的 Agent 功能需求描述

**结论：无独立的需求描述文档**（`product/` 16 个功能目录均与 Agent 无关；`todo/` 无相关条目）。Agent 需求源头唯一为 **PRD v0.1 M07 模块**，固化在 `Smart-WorkFlow/功能清单.md:134-155`，共 **14 条明细，全部 ⬜ 未开始**：

- **M07-F01 大模型管理**（5 条）：模型接入（API 地址/API Key/模型名称/协议类型）、动态装载、参数配置（temperature/max_tokens/top_p/超时/重试）、密钥管理（加密存储/多 Key 轮询/额度限流）、连通性测试
- **M07-F02 调度图编排**（4 条）：图设计器（可视化拖拽：LLM 节点/工具节点/条件分支/并行/循环）、节点配置（Prompt/变量映射/上下文传递）、图管理（CRUD/发布/版本管理）、调试运行（单步调试/运行日志）
- **M07-F03 智能助手**（3 条）：助手配置（绑定调度图/模型/角色 Prompt/开场白）、工具/函数调用（Function Calling）、知识库（上传/向量化/RAG 检索配置）
- **M07-F04 对话交互**（2 条）：对话窗口（SSE 流式/上下文记忆）、会话管理（历史会话/Token 统计/调用日志审计）

落地口径（`knowledge/current-status.md:193`、`session-handoff.md:184`）：「M07 AI 调度图业务模块 — `sw-basic-agent` 后端骨架落地 + 前端消费 `adapters/flow-graph/`，等待后端引擎/工具沙箱/RAG 产品设计明确」。功能清单复核口径（feature-checklist-sync）：M07 共 4 功能 14 明细，0/14 完成，前后端一致，标记「⚠ 需求级，待细化」。

---

## 8. 附注：低优先级疑点（不阻塞）

- `Smart-WorkFlow/.claude/worktrees/agent-a89847e1fdb50384e/` 存在一个完整 Smart-WorkFlow 副本工作树，未见知识库记录其用途——疑为历史遗留，规划层可顺手核实，与 M07 功能拆分无关。
- `sw-basic-agent/target/` 下有已编译 jar（骨架曾被构建），不影响结论。

## 9. 给规划层的 Step 拆分提示（仅事实，不做选型建议）

- 前端可视化：`flow-graph` adapter 已就绪（Q3 契约如上），M07-F02-01 图设计器可直接消费，但需自行补齐配套子包评估、编辑工具栏、路由菜单。
- 后端：`sw-basic-agent` 为空壳，`sw.agent.enabled=true` 开关已预留，`sw_agent_` 表前缀已预留，Spring AI + LangGraph4j 依赖版本已钉死（1.0.4 / 1.5.14）。
- 硬约束：I13 要求「M07 专项产品设计完成前不投入编码资源」——首个功能 Step 需先解决产品设计缺口（引擎形态/工具沙箱/RAG 选型未定，均无既往记录）。
- 执行机制：Step 0 探索须按 D42 以文件化任务下发 + DeepSeek 系模型执行（本任务即实例）；Step 1+ 方案按 system.md §6 17 项结构产出。
