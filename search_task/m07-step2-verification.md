# 探索任务：M07 Step2 编排执行引擎——独立代码级校验

**任务目标**：Anthropic（规划层）已通过阅读方案文件（`product/agent-model-orchestration/passed/step-2-orchestration-engine.md`）与两份回执（`product/agent-model-orchestration/receipts/step-2-{execution,test}.md`）做了"纸面核验"（回执自述 vs 方案原文逐条对照），判定 PASSED。但规划层受硬约束限制，不得直接读取实际代码或以"验证方案细节"为由查看代码，因此这次纸面核验只能确认"回执的文字描述是否符合方案要求"，无法确认"回执描述的内容是否真实发生在代码里"。本任务要求独立进入仓库实际代码，核实回执中的具体技术性断言是否与仓库实际代码/实际运行结果一致，而不是仅信任回执自身的文字描述——即检查回执本身是否存在夸大、遗漏或凑造。

**需要回答的问题**：

1. 执行回执 §4 声称新建 11 个文件 + 修改 1 个文件（清单见下方"搜索范围"）。逐一确认这 12 个文件真实存在于仓库对应路径，且内容与回执 §5"每个文件的修改摘要"描述的关键实现点一致（不需要贴出完整源码，只需确认关键结构点是否真实存在）：
   - `ChatModelFactory.java` 是否真的有协议白名单 `Set.of("openai","ollama")` + switch 三分支（含 default 防御分支）？非法协议是否真的抛 `IllegalArgumentException`？
   - `AgentGraphFactory.java` 是否真的有自定义 `SparseStateSerializer`（嵌套类）+ 静态 `ThreadLocal`（`CHAT_MODEL_BINDING`）+ `bindChatModel`/`clearChatModel` 静态方法配对？`AgentState::new` 是否真的作为 `AgentStateFactory` 方法引用直接使用？
   - `AgentOrchestrationServiceImpl.java` 是否真的在 `invoke` 前后有 `bindChatModel`/`clearChatModel` 的 try/finally 配对？解密后的明文 Key 变量是否真的在 finally 中置 null？
   - `AgentOrchestrationController.java` 权限注解是否真的是 `@PreAuthorize("@ss.hasPermi('agent:orchestration:run')")`（回执称这是仓库实际写法，非方案推测的 `hasAuthority`）？
2. 独立重新运行 `mvn -pl sw-basic/sw-basic-agent,sw-bootstrap -am compile` 和全量 `mvn test`，确认：编译是否真的零错误；测试总数是否真的是 494（480 基线 + 14 新增）、0 失败 0 错误 0 跳过——不得信任回执数字，必须给出本次独立运行的原始输出数字。
3. 独立重新运行方案 §13.1 的静态检查（对应回执 §7"静态检查"一节声称的结果）：
   - 全仓库 grep 工具调用相关类（`@Tool`/`ToolCallback`/`MethodToolCallback`/`ToolCallingManager`/`org.springframework.ai.tool.*`）是否真的 0 命中
   - grep checkpoint 相关类（`CompileConfig`/`BaseCheckpointSaver`/`FileSystemSaver`）是否真的 0 命中
   - grep `Channels.appender` 是否真的 0 命中
   - `git diff --stat` 对 Step1 产出文件（`AgentModelConfig.java`/`AgentModelConfigMapper.java`/`AgentModelConfigServiceImpl.java`/`AgentModelController.java`/`AgentModelAutoConfiguration.java`）是否真的无输出（即未被本 Step 修改）
   - `git status` 确认 Flyway migration 目录下是否真的没有新增脚本（只有 Step1 遗留的 V19）
   - grep controller/dto 源码中是否真的没有明文 Key 泄漏迹象（`plainApiKey`/裸 `getApiKey()` 调用等）
   - grep 权限码格式，确认 `agent:orchestration:run` 是否真的只出现 1 次（不与其他权限码冲突重叠）
4. 执行回执 §8 偏差表的关键技术断言逐条核实（这些是回执声称"实测/javap 确认"的内容，需要独立验证其真实性）：
   - `OpenAiApi.Builder.build()` 是否真的强制 `apiKey` 非空（可用 javap 反编译 `~/.m2/repository/org/springframework/ai/spring-ai-openai/1.0.4/spring-ai-openai-1.0.4.jar` 中 `OpenAiApi$Builder.build()` 字节码核实，或直接查该版本源码）
   - `OllamaOptions` 是否真的没有 `maxTokens` setter（是否确实用 `numPredict(Integer)` 代替）
   - `CompiledGraph.invoke()` 节点抛异常时的真实传播行为——检查 `AgentGraphFactoryTest.java` 中用例 3（`nodeException_shouldPropagateFromInvoke`）的实际断言代码，确认它是否真的验证了"原样抛出、cause 链含原始异常、不返回空 Optional"，而不是一个凑造但看起来合理的断言
5. `ChatModelFactoryTest.java` 中 retryCount 验证用例（`retryCount_shouldAllowThreeAttempts`/`retryCountZero_shouldAttemptOnce`）——检查代码，确认"本地 HttpServer mock 前 N 次返回 500、第 N+1 次返回 200，用请求计数器断言尝试次数"这一实现是否真实存在，而非回执凑造的描述
6. `AgentOrchestrationServiceImplTest.java` 用例 3 与 `AgentOrchestrationControllerTest.java` 用例 2 中"errorMessage 不含明文 Key"的断言（回执称用了 `doesNotContain("sk-")`）是否真实存在于测试代码中
7. 独立核实回执 §11/风险 2 与测试回执 §11 共同披露的已知缺口："`sw.agent.enabled=true` 的真实 Spring 自动配置路径（即真实 `AgentGraphAutoConfiguration` 类里的 `@Bean` 方法通过 Spring 容器装配）没有任何测试覆盖，两个 `@SpringBootTest` 都用 TestConfig 手动 new 等价 Bean 代替"——检查 `AgentOrchestrationServiceImplTest.java`/`AgentOrchestrationControllerTest.java` 的 `@SpringBootTest`/`@Import`/`@TestConfiguration` 配置，确认这个披露是否真实准确（而不是回执为了显得"诚实"而随口一提，实际情况可能更好或更差）
8. 全仓库 `git status`，确认 `Smart-WorkFlow-Web/` 下是否真的没有任何改动（回执声称"零前端改动"）；确认是否新增了任何 Maven 依赖（对比 `pom.xml` 的 git diff，回执声称"零新增依赖"）

**搜索范围**：
- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/ChatModelFactory.java`
- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/AgentGraphFactory.java`
- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/config/AgentGraphAutoConfiguration.java`
- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/AgentOrchestrationService.java` + `service/impl/AgentOrchestrationServiceImpl.java`
- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/controller/AgentOrchestrationController.java`
- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/AgentOrchestrationRunReqDTO.java` + `AgentOrchestrationRunRespDTO.java`
- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/orchestration/AgentGraphFactoryTest.java` + `ChatModelFactoryTest.java`
- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/service/impl/AgentOrchestrationServiceImplTest.java`
- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/controller/AgentOrchestrationControllerTest.java`
- 实际运行 `mvn -pl sw-basic/sw-basic-agent,sw-bootstrap -am compile` 与全量 `mvn test`（允许后台执行，等待完成）
- 实际运行方案 §13.1 对应的 grep/git 静态检查命令（清单见"需要回答的问题"第 3 条）
- 若需要，javap 反编译 `~/.m2/repository/org/springframework/ai/spring-ai-openai/1.0.4/spring-ai-openai-1.0.4.jar`
- `Smart-WorkFlow/sw-basic/sw-basic-agent/pom.xml` 的 `git diff`

**禁止范围**：
- 不得修改任何生产代码/测试代码文件（本任务仅只读校验 + 运行既有测试/编译/grep/git 命令，不允许为了让某项"校验通过"而改代码）
- 不得因发现代码与回执描述不一致就自行"修正"代码或测试——只需如实报告不一致之处，修不修由规划层和用户后续决定
- 不得对方案或回执的技术选型做优劣评判或提出改进建议，本任务只做事实核对（一致/不一致），不做建议
- 不得删除、移动、重命名任何文件
- 不得运行会产生外部网络请求的命令（真实第三方 API 调用），本 Step 的测试设计本身就是全部用本地 mock，不需要外网

**预期证据**：
- 对上述 8 个问题逐条给出明确的"一致/不一致/部分一致"判定
- 每个判定都要有可追溯证据：具体文件路径 + 行号引用（关键代码片段可直接摘录，不需要贴全文），或命令的实际原始输出片段（不得转述成"结果符合预期"这种无法验证的话）
- `mvn test` 的实际测试总数/失败数/错误数/跳过数原始数字（哪怕与回执一致，也要给出本次独立运行的原始数字，不能只写"与回执一致"）
- 若发现任何回执断言与实际代码/实际运行结果不一致，必须具体指出差异点（回执说的是什么，实际是什么），不得笼统说"基本一致"

**完成标准**：以上 8 个问题均有明确判定，且每个判定都有可追溯证据（文件路径+行号，或命令原始输出）。

**执行模型**：`deepseek/deepseek-v4-pro`（本任务需要理解 LangGraph4j/Spring AI 具体 API 语义才能判断"代码实现是否真的达到回执描述的效果"，属于语义判断类校验而非纯字符串比对，用 pro）

**失败处理**：若发现任何不一致（无论大小），必须在回执中如实记录，不得为了让本次校验"顺利通过"而弱化描述、省略或选择性忽略。若某一项确实无法独立验证（例如需要访问真实第三方 API 服务），如实标注"无法独立验证"及具体原因，不得编造验证过程。

**回执位置**：`search_fallback/m07-step2-verification.md`
