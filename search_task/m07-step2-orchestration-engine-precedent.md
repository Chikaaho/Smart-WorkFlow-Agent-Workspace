# 探索任务：M07-Step2「调度图编排执行引擎 + 工具沙箱」前置调研

**任务目标**：M07 Agent 模块 Step 1（大模型注册管理）已 PASSED。Step 2 计划落地 LangGraph4j 编排执行引擎（消费 Step1 的 `AgentModelConfig`）+ 工具沙箱雏形（D48：内部白名单方法调用 + 外部白名单 HTTP 调用）。仓库内 LangGraph4j/Spring AI 编程式调用**零使用记录**（`AgentGraphAutoConfiguration` 是空壳），本任务需摸清依赖库的真实 API 形态和仓库内可参照的"白名单机制"先例，为规划层写 Step 2 执行方案提供事实依据，避免凑造 API 签名。

**背景**：
- pom 已钉死版本：`spring-ai.version=1.0.4`（openai+ollama 双 starter）、`langgraph4j.version=1.5.14`（`langgraph4j-core`）
- Step1 已产出 `AgentModelConfig` 实体（`sw_agent_model_config` 表，含 `protocolType`/`baseUrl`/`modelName`/`apiKeyCipher`/`temperature`/`maxTokens`/`topP`/`timeoutSeconds`/`retryCount`），Step2 需要"按某条配置动态构建可调用的大模型客户端"，而非走 Spring Boot 静态自动配置（因为一个租户可注册多条模型配置，不是全局唯一 ChatModel）
- D48（已定）：工具沙箱支持两类调用，且必须数据配置而非代码配置（禁止 RCE）
- `sw_agent_` 表前缀预留了会话/消息/工具调用相关表（`search_fallback/m07-agent-kickoff.md` §1），但不确定这些表属于 Step2 还是更后面的 M07-F04

**需要回答的问题**：

1. **LangGraph4j 1.5.14 真实 API 形态**：核心类（如 `StateGraph`/`Node`/`Edge`/`CompiledGraph`/`AgentState` 等，具体类名以实际库为准）的完整包路径、关键方法签名（如何添加节点、如何定义边/条件分支、如何编译并执行一次调用）。若本地 Maven 仓库（`~/.m2`）能找到 `langgraph4j-core-1.5.14.jar`（含或不含 sources jar），请解压/查看类结构确认，不得凭训练记忆凑造签名；若确实无法获取真实签名（无 sources jar 且无法反编译），明确标注"未确认"并说明已尝试的手段。
2. **Spring AI 1.0.4 是否支持编程式（非 Spring 自动装配）构造 ChatModel**：`OpenAiChatModel`/`OllamaChatModel`（或等价类）是否有公开构造函数/Builder，允许运行时传入 `baseUrl`+`apiKey`+`model` 创建一次性实例（而不是依赖 `application.yml` 的全局单例）？请给出真实构造函数或 Builder 方法签名。这是 Step2 让"一条 AgentModelConfig 记录 → 一个可调用的模型客户端"落地的关键前提。
3. **Spring AI 1.0.4 工具调用（Function/Tool Calling）编程接口**：是否有 `@Tool` 注解、`ToolCallback` 接口或 `FunctionCallback` 类？完整包路径和关键方法签名是什么？仓库内是否已有任何引用（大概率没有，需确认）。
4. **仓库内"白名单机制"先例**：是否存在类似"业务白名单校验后才允许调用某个方法/发起某个请求"的既有实现模式，可参照用于 D48 的工具沙箱设计？重点检查：
   - `job-scheduler`（M10）的 Quartz `JobHandler` 注册/查找机制（是否是按 bean 名称白名单查找，拒绝任意类名）
   - BPM `ExternalDatasourceManager`/`ExternalDatasourceServiceImpl` 的 SQL 执行是否有白名单/黑名单校验（如禁止 DDL、只允许 SELECT 等）
   - 其他模块是否有"配置驱动的动态调用"模式（如 storage 的 `StorageProviderRegistry` 按 type 注册查找）
5. **`sw_agent_` 表前缀规划**：`knowledge/architecture.md` 或其他知识库文档中，对"会话/消息/工具调用"表以及"图定义（节点/边）"表是否有更具体的字段级规划？这些表哪些应归为 Step2（编排引擎持久化），哪些应归为后续 Step（M07-F04 对话交互）？如果知识库中没有更细的记录，明确标注"仅表前缀预留，无字段级规划"。
6. **图定义的输入形态**：基于问题 1 的 API 确认结果，LangGraph4j 的 `StateGraph` 是否要求以 Java 代码显式声明节点和边（纯程序构造），还是支持从某种可序列化的数据结构（JSON/YAML）反序列化构建？这直接决定 Step2 是否需要新增"图定义 CRUD + 持久化表"，还是可以先用内存中/硬编码的最小图验证引擎跑通，图的可视化 CRUD 留给后续 Step。

**搜索范围**：
- `Smart-WorkFlow/sw-basic/sw-basic-agent/`（现有骨架，含 pom.xml 依赖版本）
- 本机 Maven 本地仓库中的 `langgraph4j-core-1.5.14.jar`、`spring-ai-openai-1.0.4.jar`（或对应 starter jar）、`spring-ai-ollama-1.0.4.jar`、`spring-ai-model-1.0.4.jar` 等相关 jar（路径通常在 `~/.m2/repository/...`），允许解压查看类清单（`unzip -l`/`jar tf`）或用 `javap`/反编译辅助确认签名
- `Smart-WorkFlow/sw-basic/sw-basic-job/`（或实际存放 job-scheduler 代码的模块）—— JobHandler 注册机制
- `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-engine/`—— ExternalDatasource SQL 执行校验逻辑
- `Smart-WorkFlow/sw-basic/sw-basic-storage/`—— StorageProviderRegistry 动态注册模式
- `knowledge/architecture.md`、`knowledge/known-issues.md`（I13 相关记录）
- `product/agent-model-orchestration/passed/step-1-backend-model-management.md`（已落地的 AgentModelConfig 结构，作为 Step2 消费方的输入契约参照）

**禁止范围**：
- 不得修改任何文件
- 不得运行 `mvn compile`/`mvn test` 等会触发编译的命令（可以用 `find`/`unzip -l`/`jar tf`/`javap` 等只读检查手段查看依赖 jar）
- 不得对 Step2 的图持久化方案/工具沙箱具体实现方式做设计建议，只需汇报"库真实支持什么、仓库已有什么可参照的机制"，设计决策留给规划层
- 若 LangGraph4j/Spring AI 的编程式 API 确实无法在本地环境确认真实签名，不得凭训练记忆编造，必须明确标注"未确认"并说明原因（如无 sources jar、反编译工具不可用等）

**预期证据**：
- 每个问题对应的具体文件路径/jar 路径 + 关键类名/方法签名/字段名摘录
- 若某问题确实找不到先例或无法确认真实签名，明确标注"未找到"/"未确认"，不得编造

**完成标准**：以上 6 个问题均有明确答案或明确标注"未找到/未确认"（含具体原因），且证据可追溯到具体文件/jar 路径。

**执行模型**：`deepseek/deepseek-v4-pro`（涉及未知三方库真实 API 确认，比 Step1 的纯仓库内precedent调研更依赖模型的耐心检索能力，不建议用 flash）

**失败处理**：若发现 LangGraph4j 1.5.14 的实际 API 与"典型图编排框架"的预期严重不符（例如根本不支持条件分支，或要求的图构造方式极其笨重），如实标注在"未确认事项"并给出实际情况，不得为了让方案看起来可行而误报。

**回执位置**：`search_fallback/m07-step2-orchestration-engine-precedent.md`
