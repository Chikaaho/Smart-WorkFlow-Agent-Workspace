# 执行回执

## 1. Step 编号和名称

**M07 Step 2：后端编排执行引擎（LangGraph4j 最小图 + 动态模型客户端）**

- 功能：agent-model-orchestration（M07-F01 动态装载 + M07-F02 编排执行引擎最小实现）
- 方案文件：`product/agent-model-orchestration/ready/step-2-orchestration-engine.md`
- 任务来源：用户指令「新执行任务准备好了，开始使用subagent执行任务」；执行后按 §15 写本回执
- 前置调研：`search_fallback/m07-step2-orchestration-engine-precedent.md`（D54，本方案全部技术依据）

## 2. 使用模型

- 编码执行：deepseek-v4-flash（Sub Agent `a946509b24ba778fb`，一次完成 10 新建 + 1 修改共 12 个文件约 1800 行，含 spike 实测验证；96 次工具调用未中断）
- §9.0 前置确认与校验门：deepseek-v4-flash（主会话，javap 反编译 + mvn 编译/全量测试 + 静态检查）
- 说明：方案 §3 推荐 v4-pro（核心架构 + 解密 Key 出站调用）。实际执行链为 flash（Sub Agent 继承会话模型）。flash 执行质量经主会话核验达标（2 个重大技术偏差均有 spike 实测依据、全部禁止事项零违反、编译与 494 测试全绿），未升级模型

## 3. 实际读取的文件

| # | 文件 | 读取目的 |
|---|------|------|
| 1 | `product/agent-model-orchestration/ready/step-2-orchestration-engine.md` | 17 项执行方案（唯一依据） |
| 2 | `product/agent-model-orchestration/receipts/step-1-execution.md` | Step1 实际落地细节（权限码写法、AesGcmCipher 用法、R\<T\> 包装惯例） |
| 3 | `sw-basic/sw-basic-agent/.../config/AgentGraphAutoConfiguration.java` | 空壳现状（本 Step 唯一修改的已有文件） |
| 4 | `sw-basic/sw-basic-agent/.../config/AgentModelAutoConfiguration.java` | @ComponentScan 范围确认（controller/service 已覆盖，无需修改） |
| 5 | `sw-basic/sw-basic-agent/.../entity/AgentModelConfig.java` | 字段类型（temperature/topP=BigDecimal，maxTokens/timeoutSeconds/retryCount=Integer） |
| 6 | `sw-basic/sw-basic-agent/.../controller/AgentModelController.java` | @ss.hasPermi 写法、R\<T\> 包装惯例 |
| 7 | `sw-basic/sw-basic-agent/.../service/impl/AgentModelConfigServiceImpl.java` | 明文 Key 生命周期惯例 |
| 8 | `sw-basic/sw-basic-agent/src/test/.../AgentModelConfigServiceImplTest.java` + `AgentModelControllerTest.java` | HttpServer mock / @SpringBootTest / superAdmin 手法 |
| 9 | `~/.m2/.../langgraph4j-core-1.5.14.jar`（javap 反编译） | §9.0 现场确认项 1/2/3 |
| 10 | `~/.m2/.../spring-ai-openai-1.0.4.jar`、`spring-ai-ollama-1.0.4.jar`（javap 反编译） | §9.0 现场确认项 4 + Options setter 名 |
| 11 | `memory/constraints.md` | superAdmin 绕过、API Key 不落明文日志/异常/DTO 硬约束 |
| 12 | `sw-basic/sw-basic-agent/pom.xml` + `mvn dependency:tree` | spring-ai-model/langgraph4j 传递依赖确认 |

## 4. 实际修改的文件

**新建（10 个）：**

| 文件 | 行数 |
|------|------|
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/ChatModelFactory.java` | 132 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/AgentGraphFactory.java` | 126 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/AgentOrchestrationRunReqDTO.java` | ~20 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/AgentOrchestrationRunRespDTO.java` | ~25 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/AgentOrchestrationService.java` | ~20 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentOrchestrationServiceImpl.java` | 133 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/controller/AgentOrchestrationController.java` | 38 |
| `sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/orchestration/AgentGraphFactoryTest.java` | ~75 |
| `sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/orchestration/ChatModelFactoryTest.java` | ~160 |
| `sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/service/impl/AgentOrchestrationServiceImplTest.java` | ~400 |
| `sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/controller/AgentOrchestrationControllerTest.java` | ~500 |

（实际新建 11 个，方案 §7 列 10 个——Controller 测试文件方案列表有遗漏但 §13.2 测试矩阵包含，按矩阵执行）

**修改（1 个）：**

| 文件 | 改动 |
|------|------|
| `sw-basic/sw-basic-agent/.../config/AgentGraphAutoConfiguration.java` | 填充空壳：保留 `@AutoConfiguration + @ConditionalOnProperty(sw.agent.enabled)` 不变，新增 `@Bean ChatModelFactory chatModelFactory()` + `@Bean CompiledGraph<AgentState> agentCompiledGraph()`（throws GraphStateException），Javadoc 更新为非空壳说明 |

**未改动**：AgentModelAutoConfiguration、AgentModelConfig(Entity/Mapper/Service/Controller)、V19 Flyway 脚本、pom.xml（未新增任何依赖）、前端任何文件、BPM/storage/knowledge/iot/openapi 任何文件。

## 5. 每个文件的修改摘要

- **ChatModelFactory**：协议白名单 `Set.of("openai","ollama")` + switch 三分支（default 抛 IllegalStateException 防御）；非法协议抛 `IllegalArgumentException(协议名)`（方案 §10 约束 1：不静默返回 null）；openai/ollama 分支均真实接入 `restClientBuilder`（SimpleClientHttpRequestFactory 超时）+ `retryTemplate`（attempts = max(0,retryCount)+1）；BigDecimal→Double 用 `doubleValue()`（null 不设置）；Ollama 分支 maxTokens 落到 `numPredict`（OllamaOptions 无 maxTokens setter）。
- **AgentGraphFactory**：单节点图 `START→callModel→END`；channels = input/output（`Channels.base(() -> "")` 空串默认）+ chatModel（last-wins reducer `(prev,next) -> next` 无默认值）；`AgentState::new` 直接作为 `AgentStateFactory` 方法引用；`SparseStateSerializer` 嵌套类（write 只写 input/output，read 从静态 ThreadLocal `CHAT_MODEL_BINDING` 重新挂载 chatModel）+ `bindChatModel`/`clearChatModel` 静态方法（方案最大偏差，见 §8 偏差 2）。
- **DTO ×2**：Req = `agentModelConfigId(Long)` + `input(String)`（**未加 bean-validation 注解**——jakarta.validation-api 不在 agent 模块编译类路径且禁加依赖，按 Step1 惯例 Service 层手动校验，见 §8 偏差 7）；Resp = `success/output/errorMessage/latencyMs`。
- **AgentOrchestrationServiceImpl**：手动参数校验（PARAM_ERROR）→ `mapper.selectById` 不存在抛 NOT_FOUND（404 语义）→ `apiKeyCipher` 非空才 `cipher.decrypt` → `chatModelFactory.build`（IllegalArgumentException 转 success=false）→ `bindChatModel` + `invoke(Map.of("input",...,"chatModel",...))` + finally `clearChatModel`（配对）→ 双保险异常处理（catch 异常 + 空 Optional + 缺 output 均转 success=false）→ `summarizeError()` 沿 cause 链取最深层非空 message（CompletionException→ExecutionException→真实原因）→ 明文 Key finally 置 null。
- **AgentOrchestrationController**：`POST /agent/orchestration/run`；权限 `@PreAuthorize("@ss.hasPermi('agent:orchestration:run')")`（仓库实际写法，非方案推测的 hasAuthority）；响应 `R<AgentOrchestrationRunRespDTO>` 包装（仓库惯例）。
- **测试 ×4**：见 step-2-test.md。

## 6. 实际执行的命令

```bash
# §9.0 前置确认（主会话，只读）
jar tf / javap -cp ~/.m2/.../langgraph4j-core-1.5.14.jar org.bsc.langgraph4j.state.AgentStateFactory   # 签名确认
javap -cp <jar> org.bsc.langgraph4j.StateGraph / CompiledGraph / OpenAiChatOptions$Builder / OpenAiApi$Builder / OllamaOptions$Builder / OllamaChatModel$Builder
javap -c -cp <jar> 'OpenAiApi$Builder'   # 默认 completionsPath 常量值
mvn dependency:tree -pl sw-basic/sw-basic-agent   # 传递依赖确认

# 校验门（主会话）
mvn -q -pl sw-basic/sw-basic-agent,sw-bootstrap -am compile   # 零错误
mvn test   # 全量回归（后台，9:17）
```

## 7. 命令输出摘要

- **javap §9.0 现场确认（全部落定，无一未确认）**：
  - `AgentStateFactory<State> extends Function<Map<String,Object>, State>`（`org.bsc.langgraph4j.state` 包）→ `AgentState::new` 方法引用兼容
  - `StateGraph` 无 `setEntryPoint`/等价方法 → 入口写法就是 `addEdge(StateGraph.START, "callModel")`；`START`/`END` 为 static String 常量
  - `CompiledGraph.invoke(Map)` 返回 `Optional<State>` 且无 throws 声明 → 异常传播行为 javap 无法确定，由 spike 实测（见 §8 偏差 3）
  - `OpenAiChatOptions$Builder`：`model(String)/temperature(Double)/maxTokens(Integer)/topP(Double)` 全确认
  - `OpenAiApi$Builder`：`baseUrl/apiKey(String)/completionsPath/restClientBuilder`；**默认 completionsPath = `/v1/chat/completions`**（反编译 Builder 构造器 ldc 常量）
  - `OllamaChatModel$Builder`：`ollamaApi(OllamaApi)/defaultOptions(OllamaOptions)/retryTemplate(RetryTemplate)`（注意 defaultOptions 参数是 `api.OllamaOptions`，`OllamaChatOptions` 类不存在）
  - `OllamaOptions$Builder`：`model(String)/temperature(Double)/topP(Double)`；**无 maxTokens**（对应 `numPredict(Integer)`）
- **dependency:tree**：`spring-ai-model` 经 `spring-ai-starter-model-openai → spring-ai-openai` 传递引入 ✓；`spring-retry:2.0.11` 经 `spring-ai-retry` ✓；`langgraph4j-core:1.5.14` 与 `spring-ai-starter-model-ollama` 直接声明 ✓——**零新增依赖**（方案 §8 约束达成）
- **compile**：零错误（`EXIT=0`）
- **全量 `mvn test`**：`BUILD SUCCESS`（31 模块，9:17），**494 测试 / 0 失败 / 0 错误 / 0 跳过**（Step1 基线 480 + 本 Step 新增 14，与预期完全吻合）
- **静态检查（§13.1 七项）**：工具调用相关类 0 命中 / checkpoint 相关类 0 命中 / appender 0 命中 / Step1 产出文件 git diff 无输出 / Flyway 无新增（migration/agent 仅 Step1 遗留的 V19 双脚本，8 月 4 日 mtime）/ controller+dto 无 `plainApiKey`/`getApiKey()` 命中 / 权限码恰好 1 个 `agent:orchestration:run`

## 8. 与原方案的偏差

| # | 方案内容 | 实际 | 原因/依据 |
|---|---------|------|------|
| 1 | channels 默认值 `Channels.base(() -> null)` | input/output 用 `Channels.base(() -> "")`，chatModel 用 last-wins reducer `Channels.base((Object prev,Object next) -> next)` | **实测**：`getInitialStateFromSchema` 用 `Collectors.toMap` 收集默认值，null 值直接 NPE——方案 §9.2 原样代码无法运行，即使 invoke 入参提供该 key 也一样 |
| 2 | ChatModel 放图 state（`Map.of("input",…,"chatModel",…)`） | **方案最大偏差**：ChatModel 不可进图——LangGraph4j 首节点执行前对 state 深拷贝（默认 ObjectStreamStateSerializer 走 Java 序列化），实测直接 `NotSerializableException`。改为自定义 `SparseStateSerializer`（write 只写 input/output，read 从静态 ThreadLocal 重新挂载）+ Service 在 invoke 前 `AgentGraphFactory.bindChatModel()`、finally `clearChatModel()`。invoke 入参形态保留不变 | spike 实测（Sub Agent 用同版本 jar 离线验证 NotSerializableException → 设计序列化器 → Spike5 验证通过） |
| 3 | `invoke()` 异常传播待实测 | 实测：节点动作抛异常时 `invoke()` **原样抛出** `CompletionException`（链：CompletionException → ExecutionException → 原始异常），**不返回空 Optional** | AgentGraphFactoryTest 用例 3 断言；Service 仍保留空 Optional + 缺 output 两个兜底分支（双保险，符合方案 §9.5 第 5 步「不得两种情况都不处理」） |
| 4 | openai 分支明文 Key 为空时不调用 `.apiKey()` | 改为传空串 `""` | **javap 反编译确认** `OpenAiApi$Builder.build()` 含 `Assert.notNull(apiKey)`——不调用会 NPE。传空串满足构造，请求头退化为 "Bearer "（Ollama 无鉴权分支不受影响） |
| 5 | timeoutSeconds 生效方式「以现场确认为准，可能标注已知限制」 | **真实接入成功**：`OpenAiApi.Builder`/`OllamaApi.Builder` 均有 `restClientBuilder(RestClient.Builder)`，注入 `SimpleClientHttpRequestFactory.setConnectTimeout/setReadTimeout(Duration)`；Spike7 实测慢服务 + 500ms 超时 → 594ms 抛 SocketTimeoutException。默认 30s 与 V19 表 DEFAULT 一致 | 非已知限制，五字段全部真实生效 |
| 6 | `GraphStateException` 包路径 | 实际在 `org.bsc.langgraph4j` 根包（非 `.state.`） | javap |
| 7 | DTO 用 `@Validated` 校验注解 | DTO **不加** bean-validation 注解，`@Validated` 仅保留在 Controller 参数上（spring-context 类，无 validator 时 no-op 编译安全）；参数校验在 Service 层手动完成（PARAM_ERROR） | jakarta.validation-api 不在 sw-basic-agent 编译类路径（validation starter 仅 BPM/system/bootstrap 声明），禁加依赖 |
| 8 | `@PreAuthorize("hasAuthority(...)")` + 裸 DTO 响应 | `@PreAuthorize("@ss.hasPermi('agent:orchestration:run')")` + `R<T>` 包装 | 与 Step1 实际落地一致（方案 §9.6 已授权执行时核对） |
| 9 | `ChatResponse` 文本提取「训练常识，以编译报错为准」 | 实测 `response.getResult().getOutput().getText()`（Generation → AssistantMessage）编译通过且运行正确 | 节点内代码 |
| 10 | `AgentOrchestrationServiceImplTest`/`AgentOrchestrationControllerTest` TestConfig | 手动声明同构 bean（`chatModelFactory()`/`agentCompiledGraph()`）而非走 `sw.agent.enabled=true` 自动配置 | 与 Step1 测试同款手法（自动配置被 exclude 部分排除，避免 Spring AI 双 starter bean 冲突）；见 §11 风险 2 |

## 9. 遇到的问题

1. **方案 §9.2 原样代码无法运行（Channels null 默认值 NPE）**：Sub Agent 组装同版本 jar 类路径先离线编译+运行 spike 发现（非 mvn 命令），改空串默认值 + last-wins reducer 解决。
2. **ChatModel 不可序列化（NotSerializableException）**：方案未预见的最深技术坑。Sub Agent 三次 spike 迭代（确认序列化时机 → 设计 SparseStateSerializer → ThreadLocal 挂载验证）解决，Service 侧 bind/clear 配对 + finally 保证无泄漏。
3. **OpenAiApi.Builder 强制 apiKey 非空**：javap 反编译 `build()` 字节码发现 `Assert.notNull`，改传空串。
4. **OllamaOptions 无 maxTokens**：javap 全量 setter 列表确认，落到 `numPredict`（语义对应 Ollama API 的 num_predict，方案未预见的协议差异）。
5. **jakarta.validation-api 缺失**：查 pom 传递链确认不在编译类路径，不引入依赖（方案禁加），Service 层手动校验兜底。
6. 无 subagent 中断（对比 Step1 的两次中断），一次完成。

## 10. 未完成内容

无。方案全部 14 项验收标准满足（逐条证据见 step-2-test.md §10）。`timeoutSeconds` 真实接入（非已知限制）。

## 11. 风险和注意事项

1. **ThreadLocal 绑定是图执行的外部契约**：`AgentGraphFactory.bindChatModel/clearChatModel` 必须在 invoke 前绑定、finally 清除（ServiceImpl 已配对）；若未来有其他调用方直接调 `agentCompiledGraph.invoke()` 而不绑定 chatModel，节点内 `state.value("chatModel")` 为空 → IllegalStateException「初始状态缺少 chatModel」。文档已写在 AgentGraphFactory Javadoc。
2. **`sw.agent.enabled=true` 的真实自动配置路径无测试覆盖**：方案 §13.3 假设「全量 mvn test 启动 Spring 上下文时自动装配」——实际 `sw.agent.enabled` 全仓库零配置（默认关闭，Step1 已知边界），两个 @SpringBootTest 均走 TestConfig 手动同构 bean（装配与执行链路等效验证）。真实自动配置路径（含 Spring AI 双 starter 的 EmbeddingModel 二义风险，与 Step1 §11 相同）在运行期开启开关时生效，回执如实记录，不虚报「自动装配已测」。
3. **明文 Key 安全**：仅存在于 ServiceImpl 局部变量，finally 置 null；`summarizeError` 只取 message 不取堆栈（防异常信息带出请求头）；测试断言 errorMessage 不含 `sk-` 前缀（用例 3）。
4. **OllamaOptions 无 maxTokens**：ollama 分支 maxTokens 落到 numPredict，语义映射已在代码注释说明。
5. **V19 版本号抢占**：若并行 Step 抢占 V19，迁移会失败（Step1 §11 同款既有风险，非本 Step 新增）。
6. 预存未提交改动（BPM/sw-security 等 7 月底遗留、Step1 的 pom/imports/application.yml/migration/agent 未提交）不属于本 Step，回执不展开。

## 12. Git diff 摘要

- 新增 11 文件约 1700 行（7 main + 4 test）
- 修改 1 文件：`AgentGraphAutoConfiguration.java`（+~30 行：2 个 @Bean + Javadoc）
- 关键变更：AgentGraphAutoConfiguration 从空壳到真实编排引擎 Bean；新建 orchestration 包（ChatModelFactory/AgentGraphFactory）；Service/Controller/DTO 权限链路；4 个测试类
- 零新增依赖、零新增 Flyway、零前端改动、零其他模块改动

## 13. 建议执行的测试

- 重点：step-2-test.md 中用例 AgentGraphFactoryTest 3（invoke 异常传播实测行为）、ChatModelFactoryTest 4/4b（retryCount 生效）、Service 用例 2（端到端成功 + mock 请求路径）、Service 用例 3（安全断言）
- 回归：全量 `mvn test` 计数不减少（494）
- 后续 Step（工具沙箱 Step 3 / 对话交互 M07-F04）：注意 ThreadLocal 绑定契约是图执行外部依赖；`sw_agent_` 表归属在规划层裁定后建表时，编排引擎已可消费
