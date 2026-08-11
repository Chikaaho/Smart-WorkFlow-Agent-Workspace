# 探索回执：M07-F02「调度图编排（图设计器）」前置调研

**执行模型**：deepseek-v4-flash（本会话单 agent 直接执行，只读）
**执行日期**：2026-08-11
**任务来源**：M07-F02 调度图编排（图设计器）前置调研任务单
**只读确认**：本任务未修改/创建/删除仓库内任何文件（唯一写入为本回执文件）；未运行 mvn/pnpm/gradle 等任何编译、测试、构建命令；仅使用 find/grep/cat/文件读取等只读操作。
**任务状态**：✅ 6 问均有明确答案（含"零命中/无先例"的明确标注），证据全部为本次实际读取的磁盘文件全文、grep/find 原始输出，无训练记忆补填。
**关键发现摘要**：
- 图拓扑自 Step2 起未变：仍是 `START → callModel → END` 单节点图；Step3 工具沙箱、Step4 多轮会话/工具调用记录、Step5 多Key轮询**全部**在单节点内部（ThreadLocal 注入）或图外（ServiceImpl 重试循环）以 Java 代码逻辑处理，**未新增任何图节点/边**。
- 图定义持久化：`sw_agent_graph`/`GraphDefinition`/`graph_def` 全仓库**零命中**；无图定义 CRUD 表/实体；agent Flyway 最大版本号 **V24**（`V24__alter_agent_model_config_multikey.sql`，h2+postgresql 各 6 个脚本），**V25+ 空闲**。
- 工具沙箱**完全平铺在 callModel 单节点内**：`FunctionToolCallback` 经 ThreadLocal（`TOOL_CALLBACKS_BINDING`）注入，无任何图节点级工具节点。
- 前端 `modules/agent` 仅 `AgentHome.vue` 占位页（BlankPage）；`adapters/flow-graph` 在 modules 中零引用，6 个导出符号契约未变。
- 仓库已有丰富"图/树结构 CRUD + 版本管理 + 发布"先例：`sw-biz-form`（DRAFT/PUBLISHED + form_version + sw_form_snapshot 每次发布存版本 JSON 快照）与 `sw-bpm`（def_version + status + graph_json 图模型存储 + 发布部署回填 + process_key 冻结检查 + GraphElement 节点/边统一图元素模型）。
- I13 **未标记任何一项解决**：执行引擎落地形态/工具沙箱边界/RAG 向量库选型/流程表单联动点四项仍整体"⚠ 待专项产品设计"。

---

## 问题 1：`AgentGraphFactory` 当前真实完整源码与图结构

**文件**：`Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/AgentGraphFactory.java`（全文 221 行，逐行贴出）：

```java
  1  package com.sw.ck.agent.orchestration;
  2
  3  import org.bsc.langgraph4j.CompiledGraph;
  4  import org.bsc.langgraph4j.GraphStateException;
  5  import org.bsc.langgraph4j.StateGraph;
  6  import org.bsc.langgraph4j.action.AsyncNodeAction;
  7  import org.bsc.langgraph4j.serializer.StateSerializer;
  8  import org.bsc.langgraph4j.state.AgentState;
  9  import org.bsc.langgraph4j.state.Channel;
 10  import org.bsc.langgraph4j.state.Channels;
 11  import org.springframework.ai.chat.messages.Message;
 12  import org.springframework.ai.chat.messages.UserMessage;
 13  import org.springframework.ai.chat.model.ChatModel;
 14  import org.springframework.ai.chat.model.ChatResponse;
 15  import org.springframework.ai.chat.prompt.Prompt;
 16  import org.springframework.ai.model.tool.ToolCallingChatOptions;
 17  import org.springframework.ai.tool.ToolCallback;
 18
 19  import java.io.IOException;
 20  import java.io.ObjectInput;
 21  import java.io.ObjectOutput;
 22  import java.util.ArrayList;
 23  import java.util.HashMap;
 24  import java.util.List;
 25  import java.util.Map;
 26
 27  /**
 28   * 最小编排图工厂（M07 Step2）：单节点 {@code StateGraph<AgentState>}，
 29   * {@code START → callModel → END}，节点内调用一次模型并提取回复文本。
 30   * <p>
 31   * 无状态实例方法 {@link #buildGraph()}，供 {@code AgentGraphAutoConfiguration} 注册
 32   * 单例 {@code CompiledGraph} Bean 与单元测试直接调用（纯 JUnit 可测，无需 Spring 上下文）。
 33   * </p>
 34   * <p>
 35   * <b>与 LangGraph4j 1.5.14 实测行为的两个偏差（详见执行回执）</b>：
 36   * </p>
 37   * <ol>
 38   *   <li>channel 默认值不能为 null：{@code Channels.base(() -> null)} 会在
 39   *       {@code getInitialStateFromSchema} 处 NPE（Collectors.toMap 拒绝 null 值），
 40   *       因此 input/output 用空串默认值；chatModel 无法给非空默认，改用 last-wins
 41   *       reducer（无默认值）</li>
 42   *   <li>节点间状态流转会对 state 做深拷贝（默认 Java 序列化），{@link ChatModel}
 43   *       不可序列化，直接放 state 会抛 {@code NotSerializableException}：本类用
 44   *       {@link SparseStateSerializer} 在序列化时跳过 chatModel，读取时从线程绑定
 45   *       （{@link #bindChatModel}/{@link #clearChatModel}）重新挂载</li>
 46   * </ol>
 47   */
 48  public class AgentGraphFactory {
 49
 50      /** 模型调用节点名 */
 51      public static final String NODE_CALL_MODEL = "callModel";
 52
 53      /**
 54       * 当前执行线程绑定的 ChatModel（graph 状态机不可序列化 ChatModel，由调用方在
 55       * {@code invoke()} 前绑定、finally 中清除；ThreadLocal 天然线程隔离，并发安全）。
 56       */
 57      private static final ThreadLocal<ChatModel> CHAT_MODEL_BINDING = new ThreadLocal<>();
 58
 59      /**
 60       * 当前执行线程绑定的工具回调列表（M07 Step3 工具沙箱）。工具不进入 graph state
 61       * （{@link SparseStateSerializer} 只序列化 input/output），与 ChatModel 同款
 62       * ThreadLocal 绑定模式：调用方 invoke 前 {@link #bindTools}、finally 中
 63       * {@link #clearTools}。未绑定时 callModel 行为与 Step2 完全一致（向后兼容）。
 64       */
 65      private static final ThreadLocal<List<ToolCallback>> TOOL_CALLBACKS_BINDING = new ThreadLocal<>();
 66
 67      /**
 68       * 当前执行线程绑定的历史消息（M07 Step4 F04 多轮会话）。callModel 节点读取后与
 69       * 本轮新 {@link UserMessage} 合并构造 Prompt，LLM 获得多轮上下文。与 ChatModel
 70       * 同款 ThreadLocal 生命周期：调用方 invoke 前 {@link #bindHistoryMessages}、
 71       * finally 中 {@link #clearHistoryMessages}。历史消息不经 graph state
 72       * （SparseStateSerializer 不序列化），与 tools ThreadLocal 同一模式。
 73       */
 74      private static final ThreadLocal<List<Message>> HISTORY_MESSAGES_BINDING = new ThreadLocal<>();
 75
 76      /**
 77       * 当前执行线程绑定的工具调用记录载体（M07 Step4 F04）。{@link AgentToolCallbackFactory}
 78       * 的工具 lambda 包装在每次实际调用后向该列表追加 {@link ToolCallRecord}（未绑定时
 78       * 跳过，不影响 Step3 行为）；编排 ServiceImpl 在 invoke 后读取并逐条落库。
 80       * package-private：仅同包 AgentToolCallbackFactory 写入（lambda 包装点）。
 81       */
 82      static final ThreadLocal<List<ToolCallRecord>> TOOL_CALL_RECORDS_BINDING = new ThreadLocal<>();
 83
 84      /** 绑定本次执行的 ChatModel（invoke 前调用） */
 85      public static void bindChatModel(ChatModel chatModel) {
 86          CHAT_MODEL_BINDING.set(chatModel);
 87      }
 88
 89      /** 清除本次执行的 ChatModel 绑定（invoke 结束后 finally 调用） */
 90      public static void clearChatModel() {
 91          CHAT_MODEL_BINDING.remove();
 92      }
 93
 94      /** 绑定本次执行的工具回调列表（invoke 前调用；空列表时无效果，行为同未绑定） */
 95      public static void bindTools(List<ToolCallback> tools) {
 96          TOOL_CALLBACKS_BINDING.set(tools);
 97      }
 98
 99      /** 清除本次执行的工具回调绑定（invoke 结束后 finally 调用，防 ThreadLocal 泄漏） */
100      public static void clearTools() {
101          TOOL_CALLBACKS_BINDING.remove();
102      }
103
104      /** 绑定本次执行的历史消息（invoke 前调用；null/空列表时 callModel 行为与 Step2/3 一致） */
105      public static void bindHistoryMessages(List<Message> messages) {
106          HISTORY_MESSAGES_BINDING.set(messages);
107      }
108
109      /** 清除本次执行的历史消息绑定（invoke 结束后 finally 调用，防 ThreadLocal 泄漏） */
110      public static void clearHistoryMessages() {
111          HISTORY_MESSAGES_BINDING.remove();
112      }
113
114      /** 绑定工具调用记录载体（invoke 前调用，由 ServiceImpl 传入空列表） */
115      public static void bindToolCallRecords(List<ToolCallRecord> records) {
116          TOOL_CALL_RECORDS_BINDING.set(records);
117      }
118
119      /** 清除工具调用记录载体（invoke 结束后 finally 调用） */
120      public static void clearToolCallRecords() {
121          TOOL_CALL_RECORDS_BINDING.remove();
122      }
123
124      /** 读取本次执行捕获的工具调用记录（ServiceImpl 在 invoke 后调用；未绑定返回 null） */
125      public static List<ToolCallRecord> getToolCallRecords() {
126          return TOOL_CALL_RECORDS_BINDING.get();
127      }
128
129      /**
130       * 构造并编译最小图。
131       *
132       * @throws GraphStateException 图构造/编译失败（节点重名、边非法等）
133       */
134      public CompiledGraph<AgentState> buildGraph() throws GraphStateException {
135          Map<String, Channel<?>> channels = Map.of(
136                  "input", Channels.base(() -> ""),
137                  "output", Channels.base(() -> ""),
138                  "chatModel", Channels.base((Object prev, Object next) -> next));
139          StateGraph<AgentState> graph = new StateGraph<>(channels, new SparseStateSerializer());
140          graph.addNode(NODE_CALL_MODEL, AsyncNodeAction.node_async(this::callModel));
141          graph.addEdge(StateGraph.START, NODE_CALL_MODEL);
142          graph.addEdge(NODE_CALL_MODEL, StateGraph.END);
143          return graph.compile();
144      }
145
146      /**
147       * 节点动作：取 chatModel 与 input → 调用一次模型 → 提取回复文本写入 output。
148       * <p>
149       * 响应文本提取链（Spring AI 公开 API 实测）：{@code ChatResponse.getResult()}
150       * → {@code Generation.getOutput()}（{@code AssistantMessage}）→ {@code getText()}。
151       * </p>
152       * <p>
153       * M07 Step3：绑定了工具回调时，Prompt 携带 {@link ToolCallingChatOptions}（工具经
154       * options 传入，Prompt 无工具重载，前置调研 §3.2 实测）；未绑定时构造与 Step2
155       * 完全相同的 {@code new Prompt(input)}（向后兼容）。tool_calls 的执行循环内建于
156       * {@code ChatModel.call()}（Spring AI internalCall 递归 + ToolCallingManager），
157       * 本节点不写自循环、不改图拓扑。
158       * </p>
159       */
160      private Map<String, Object> callModel(AgentState state) throws Exception {
161          ChatModel chatModel = (ChatModel) state.value("chatModel")
162                  .orElseThrow(() -> new IllegalStateException("初始状态缺少 chatModel"));
163          String input = (String) state.value("input")
164                  .orElseThrow(() -> new IllegalStateException("初始状态缺少 input"));
165          List<ToolCallback> tools = TOOL_CALLBACKS_BINDING.get();
166          // M07 Step4 F04：历史消息（ThreadLocal 注入） + 本轮新 UserMessage 构造完整消息列表。
167          // 历史为空/null 时 messages 仅含新 UserMessage——与 Step2/3 的 new Prompt(input)
168          // 语义等价（Prompt(String) 内部即 new Prompt(UserMessage(input))），向后兼容。
169          List<Message> history = HISTORY_MESSAGES_BINDING.get();
170          List<Message> messages = new ArrayList<>();
171          if (history != null) {
172              messages.addAll(history);
173          }
174          messages.add(new UserMessage(input));
175          Prompt prompt;
176          if (tools != null && !tools.isEmpty()) {
177              // internalToolExecutionEnabled 未显式设置时默认 true（§9.2 实测
178              // DefaultToolExecutionEligibilityPredicate + isInternalToolExecutionEnabled），
179              // tool_calls 自动执行，无需显式开启
180              ToolCallingChatOptions options = ToolCallingChatOptions.builder()
181                      .toolCallbacks(tools)
182                      .build();
183              prompt = new Prompt(messages, options);
184          } else {
185              prompt = new Prompt(messages);
186          }
187          ChatResponse response = chatModel.call(prompt);
188          String output = response.getResult().getOutput().getText();
189          return Map.of("output", output);
190      }
191
192      /**
193       * 稀疏状态序列化器：LangGraph4j 在节点间对 state 做深拷贝（StateSerializer.cloneObject），
194       * 只序列化可序列化的 input/output；chatModel 在 write 时跳过、read 时从线程绑定重新挂载，
195       * 保证节点内 {@code state.value("chatModel")} 可见且不触发 NotSerializableException。
196       */
197      static class SparseStateSerializer extends StateSerializer<AgentState> {
198
199          SparseStateSerializer() {
200              super(AgentState::new);
201          }
202
203          @Override
204          public void write(AgentState object, ObjectOutput out) throws IOException {
205              out.writeObject(object.value("input").orElse(""));
206              out.writeObject(object.value("output").orElse(""));
207          }
208
209          @Override
210          public AgentState read(ObjectInput in) throws IOException, ClassNotFoundException {
211              Map<String, Object> data = new HashMap<>();
212              data.put("input", in.readObject());
213              data.put("output", in.readObject());
214              ChatModel bound = CHAT_MODEL_BINDING.get();
215              if (bound != null) {
216                  data.put("chatModel", bound);
217              }
218              return stateOf(data);
219          }
220      }
221  }
```

**子问题回答**：

**(a) 图拓扑是否仍是「START→callModel→END 单节点」？** 是。`buildGraph()`（L134-144）仍只有 1 个 `addNode`（L140 `graph.addNode(NODE_CALL_MODEL, ...)`）+ 2 条 `addEdge`（L141-142 `START→callModel`、`callModel→END`）。全模块 `grep -rn "addNode\|StateGraph<" src/main/java` 仅命中本文件 L139-140 一处（另 `AgentGraphAutoConfiguration.java:22` 为 javadoc 描述"最小单节点 START → callModel → END"）。

**(b) Step3/Step5 落地后节点数量/边结构是否变化？** 未变化。Step3 工具调用、Step4 历史消息与工具调用记录、Step5 多Key轮询**均不在图中**：
- 工具：ThreadLocal `TOOL_CALLBACKS_BINDING`（L65），`callModel` 节点内读取（L165）并经 `ToolCallingChatOptions.toolCallbacks` 传入 Prompt（L180-183）；L157 注释明言"本节点不写自循环、不改图拓扑"。
- 历史消息：ThreadLocal `HISTORY_MESSAGES_BINDING`（L74），节点内合并（L169-174）。
- 工具调用记录：ThreadLocal `TOOL_CALL_RECORDS_BINDING`（L82）。
- Step5 多Key轮询：实现在 `AgentOrchestrationServiceImpl.run()` 的 while 重试循环（图外），图结构零接触。
- 佐证（Step3 前置调研回执 `search_fallback/m07-step3-toolsandbox-precedent.md`）：L32"LangGraph4j 框架层不内置 ToolNode，工具执行完全由开发者自己实现节点"；L52"单节点图 START → callModel → END"；L54"图构造侧可用能力仅为 addNode + addEdge/addConditionalEdges 组合……框架无任何内置判定"。

**(c) addNode/addEdge 是否 Java 硬编码、有无外部化配置迹象？** 纯 Java 硬编码，无任何外部化迹象：
- 全模块 grep `langgraph|StateGraph|agentGraph` 在 `sw-bootstrap/src/main/resources/` 与 `sw-basic/` 下（排除 target）仅命中 pom.xml（langgraph4j 依赖声明）与 Java 源码/测试文件，**无任何 yml/yaml/json 图定义配置**。
- `sw-basic-agent/src/main/resources/` 下仅有 `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` 与空目录 `db/migration/agent/.gitkeep`。
- 图 Bean 注册点 `AgentGraphAutoConfiguration.java`（全文 46 行）：`@ConditionalOnProperty(prefix="sw.agent", name="enabled", havingValue="true")`，L42-44 `@Bean public CompiledGraph<AgentState> agentCompiledGraph() { return new AgentGraphFactory().buildGraph(); }` —— 图完全由 Java 代码构造，无可配置项。

---

## 问题 2：图定义持久化现状

**(a) `grep -rln "sw_agent_graph\|GraphDefinition\|graph_def" Smart-WorkFlow/sw-basic/sw-basic-agent/src/`**：**零命中**（exit 1）。扩展至全仓库（排除 target/.claude）同样**零命中**——不存在任何图定义 CRUD 表/实体/关键字。

**(b) agent 路径 Flyway 最大版本号**：任务命令输出（src 权威迁移，已排除 target/classes 与 worktrees）：

```
Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/h2/V19__init_agent_model_config.sql
Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/h2/V20__init_agent_tool_config.sql
Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/h2/V21__init_agent_session.sql
Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/h2/V22__init_agent_message.sql
Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/h2/V23__init_agent_tool_call_log.sql
Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/h2/V24__alter_agent_model_config_multikey.sql
Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/postgresql/V19__init_agent_model_config.sql
Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/postgresql/V20__init_agent_tool_config.sql
Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/postgresql/V21__init_agent_session.sql
Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/postgresql/V22__init_agent_message.sql
Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/postgresql/V23__init_agent_tool_call_log.sql
Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/postgresql/V24__alter_agent_model_config_multikey.sql
```

**确认：V24 仍为最大版本号，V25+ 空闲**（h2 与 postgresql 各 6 个脚本，V19-V24）。现有 6 张表：`sw_agent_model_config`(V19)、`sw_agent_tool_internal`/`sw_agent_tool_external`(V20)、`sw_agent_session`(V21)、`sw_agent_message`(V22)、`sw_agent_tool_call_log`(V23)，V24 为 model_config 多Key改造（alter）。注意：`sw-basic-agent` 模块自带 `src/main/resources/db/migration/agent/` 仅为 `.gitkeep` 空目录，agent 迁移脚本全部位于 `sw-bootstrap`。

---

## 问题 3：`sw_agent_tool_internal`/`sw_agent_tool_external` 与图节点的关系

**结论先行：工具是 callModel 单节点内部的 FunctionToolCallback 注入（ThreadLocal 模式），不是图中独立节点；"工具节点"没有任何图节点级实现，完全平铺在单节点内。** 证据链：

**(a) 工具执行位置**：`AgentGraphFactory.callModel()` L165 `List<ToolCallback> tools = TOOL_CALLBACKS_BINDING.get();` → L180-183 经 `ToolCallingChatOptions` 传入 Prompt，tool_calls 执行循环内建于 `ChatModel.call()`（L156-157 注释），节点本身不写循环、不改拓扑。

**(b) 编排 ServiceImpl 工具注入相关方法体全文**。文件：`Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentOrchestrationServiceImpl.java`（本回执截取 L115-263 `run()` 与 L304-318 `persistToolCallLogs()`，其余方法为消息加载/转换等，与本问无关）：

```java
115      @Override
116      public AgentOrchestrationRunRespDTO run(AgentOrchestrationRunReqDTO req) {
117          // 参数校验（DTO 层无 bean-validation：模块类路径无 jakarta.validation-api，
118          // 沿用 Step1 Service 层手动校验惯例）
119          if (req == null || req.getAgentModelConfigId() == null) {
120              throw new BaseException(CommonErrorCode.PARAM_ERROR, "agentModelConfigId 不能为空");
121          }
122          if (req.getInput() == null || req.getInput().isBlank()) {
123              throw new BaseException(CommonErrorCode.PARAM_ERROR, "input 不能为空");
124          }
125          // baseMapper.selectById 经租户拦截器自动过滤 tenant_id（Step1 同款）；不存在 → 404 语义
126          AgentModelConfig entity = mapper.selectById(req.getAgentModelConfigId());
127          if (entity == null) {
128              throw new BaseException(CommonErrorCode.NOT_FOUND);
129          }
130
131          long start = System.currentTimeMillis();
132          AgentOrchestrationRunRespDTO resp = new AgentOrchestrationRunRespDTO();
133          // M07-Step5 多Key轮询：候选切换重试循环。triedIds 累积已试配置 id，保证组内
134          // 每条候选最多尝试一次（组内成员有限，循环必然终止，无无限重试）。
135          Set<Long> triedIds = new HashSet<>();
136          AgentModelConfig currentConfig = entity;
137          // 会话 id 在循环外解析一次：候选切换复用同一会话，不重复创建；首次尝试时若
138          // 配置非法（ChatModelFactory 抛 IllegalArgumentException）则解析尚未执行，不落脏数据
139          Long sessionId = req.getSessionId();
140          List<AgentMessage> dbMessages = null;
141          boolean sessionResolved = false;
142          String plainApiKey = null;
143          try {
144              while (true) {
145                  triedIds.add(currentConfig.getId());
146                  // 解密当前候选的明文 Key：仅用于本次构造 ChatModel，切换候选后重新解密
147                  // 对应 apiKeyCipher（解密异常直接上抛，与 Step2-4 行为一致）
148                  plainApiKey = null;
149                  if (currentConfig.getApiKeyCipher() != null && !currentConfig.getApiKeyCipher().isEmpty()) {
150                      plainApiKey = cipher.decrypt(currentConfig.getApiKeyCipher());
151                  }
152                  try {
153                      ChatModel chatModel = chatModelFactory.build(currentConfig, plainApiKey);
154                      // M07 Step4 F04：会话获取/创建 + 历史消息加载，仅首次尝试执行（在
155                      // chatModel 构造之后：配置非法时 ChatModelFactory 抛
156                      // IllegalArgumentException，不落会话脏数据）
157                      if (!sessionResolved) {
158                          if (sessionId == null) {
159                              AgentSession session = new AgentSession();
160                              session.setAgentModelConfigId(req.getAgentModelConfigId());
161                              session.setStatus(SESSION_STATUS_ACTIVE);
162                              // id（雪花 ASSIGN_ID）/createTime/createBy/tenantId/deleted/version
163                              // 由 MyBatis-Plus + CommonMetaObjectHandler 填充
164                              sessionMapper.insert(session);
165                              sessionId = session.getId();
166                              dbMessages = List.of();
167                          } else {
168                              // selectById 经租户拦截器自动过滤 tenant_id：跨租户/已删除/不存在会话 → null → 404 语义
169                              AgentSession existing = sessionMapper.selectById(sessionId);
170                              if (existing == null) {
171                                  throw new BaseException(CommonErrorCode.NOT_FOUND, "会话不存在");
172                              }
173                              dbMessages = loadHistoryMessages(sessionId);
174                          }
175                          sessionResolved = true;
176                      }
177                      // 历史消息经 ThreadLocal 注入 callModel 节点（与 chatModel/tools 同款绑定模式）
178                      AgentGraphFactory.bindHistoryMessages(toSpringAiMessages(dbMessages));
179                      AgentGraphFactory.bindToolCallRecords(new ArrayList<>());
180                      // M07 Step3：加载本租户启用的工具白名单 → 绑定到图执行线程（无工具/工厂
181                      // 未注入时跳过，Prompt 构造与 Step2 完全一致）；租户隔离由租户拦截器自动完成
182                      // （buildToolCallbacks(null) 不显式过滤，同 Step2 selectById 先例）
183                      List<ToolCallback> tools = agentToolCallbackFactory == null
184                              ? List.of()
185                              : agentToolCallbackFactory.buildToolCallbacks(null);
186                      AgentGraphFactory.bindChatModel(chatModel);
187                      if (!tools.isEmpty()) {
188                          AgentGraphFactory.bindTools(tools);
189                      }
190                      try {
191                          Optional<AgentState> result = agentCompiledGraph.invoke(
192                                  Map.of("input", req.getInput(), "chatModel", chatModel));
193                          if (result.isEmpty()) {
194                              // 兜底：invoke 返回空 Optional（实测正常路径不会发生）
195                              resp.setSuccess(false);
196                              resp.setErrorMessage("编排引擎执行未产生结果");
197                          } else {
198                              Optional<Object> output = result.get().value("output");
199                              if (output.isEmpty()) {
200                                  resp.setSuccess(false);
201                                  resp.setErrorMessage("编排引擎执行未产生输出");
202                              } else {
203                                  String outputText = String.valueOf(output.get());
204                                  resp.setSuccess(true);
205                                  resp.setOutput(outputText);
206                                  // M07-Step5：记录实际服务本次请求的配置 id（轮询切换后可能
207                                  // 与请求携带的 agentModelConfigId 不同，便于排查/审计）
208                                  resp.setUsedModelConfigId(currentConfig.getId());
209                                  // M07 Step4 F04：持久化本轮 USER + ASSISTANT 消息（msg_order =
210                                  // 已有消息数，0-based 单调递增）与工具调用日志，并回传会话 id
211                                  int nextOrder = dbMessages.size();
212                                  insertMessage(sessionId, ROLE_USER, req.getInput(), nextOrder);
213                                  insertMessage(sessionId, ROLE_ASSISTANT, outputText, nextOrder + 1);
214                                  persistToolCallLogs(sessionId);
215                                  resp.setSessionId(sessionId);
216                              }
217                          }
218                      } finally {
219                          // bind/clear 对称：正常完成与异常完成（invoke 抛异常）均执行清除，防 ThreadLocal 泄漏
220                          AgentGraphFactory.clearChatModel();
221                          AgentGraphFactory.clearTools();
222                          AgentGraphFactory.clearHistoryMessages();
223                          AgentGraphFactory.clearToolCallRecords();
224                      }
225                      // 成功路径（含 invoke 空结果兜底分支）均跳出重试循环，不再尝试其他候选
226                      break;
227                  } catch (IllegalArgumentException e) {
228                      // 协议不支持/配置非法：ChatModelFactory 拒绝构造 → success=false，不触发
229                      // 切换（配置静态错误而非运行时可恢复的限流状态，切换意义不大且会掩盖配置问题）
230                      resp.setSuccess(false);
231                      resp.setErrorMessage(summarizeError(e));
232                      break;
233                  } catch (BaseException e) {
234                      // 业务异常（如会话不存在）保持上抛，由全局异常处理器转 404 语义，不吞为 success=false
235                      throw e;
236                  } catch (Exception e) {
237                      if (isQuotaExceededException(e) && currentConfig.getGroupKey() != null) {
238                          // M07-Step5：限流 → 锁定当前配置（冷却期）→ 切换组内下一候选重试
239                          LocalDateTime now = LocalDateTime.now();
240                          int cooldownSeconds = currentConfig.getQuotaCooldownSeconds() == null
241                                  ? DEFAULT_QUOTA_COOLDOWN_SECONDS
242                                  : currentConfig.getQuotaCooldownSeconds();
243                          currentConfig.setLockedUntil(now.plusSeconds(cooldownSeconds));
244                          lockCurrentConfig(currentConfig);
245                          AgentModelConfig next = findNextCandidate(currentConfig.getGroupKey(), triedIds, now);
246                          if (next != null) {
247                              currentConfig = next;
248                              continue;   // 回到循环顶部：重建 ChatModel + 重新解密下一候选 Key
249                          }
250                      }
251                      // 非限流异常，或限流但无候选可切（含 groupKey=null 的独立配置）：
252                      // 按 Step2-4 原有行为失败（success=false + 异常摘要）
253                      resp.setSuccess(false);
254                      resp.setErrorMessage(summarizeError(e));
255                      break;
256                  }
257              }
258          } finally {
259              plainApiKey = null;
260          }
261          resp.setLatencyMs(System.currentTimeMillis() - start);
262          return resp;
263      }
```

```java
303      /** 将本轮捕获的工具调用记录批量落库（无记录时为空操作） */
304      private void persistToolCallLogs(Long sessionId) {
305          List<ToolCallRecord> records = AgentGraphFactory.getToolCallRecords();
306          if (records == null || records.isEmpty()) {
307              return;
308          }
309          for (ToolCallRecord record : records) {
310              AgentToolCallLog log = new AgentToolCallLog();
311              log.setSessionId(sessionId);
312              log.setToolName(record.getToolName());
313              log.setToolCallArgs(record.getArgs());
314              log.setToolCallResult(record.getResult());
315              log.setLatencyMs(record.getLatencyMs());
316              toolCallLogMapper.insert(log);
317          }
318      }
```

**(c) 工具白名单装载**：`AgentToolCallbackFactory.buildToolCallbacks(Long)`（`.../orchestration/AgentToolCallbackFactory.java` L84-106）：按 `enabled=1` 分别查 `sw_agent_tool_internal`（L88-92）与 `sw_agent_tool_external`（L93-97），逐条 `buildInternalCallback`（L112-144：反射调用白名单 bean 的 `String execute(String)` 约定方法，构造 `FunctionToolCallback`，lambda 内 `recordToolCall(...)` 写入 ThreadLocal 记录载体）与 `buildExternalCallback`（L150+：白名单 URL + RestClient HTTP 调用）。**白名单条目 → ToolCallback 的映射是运行时 DB 驱动，但工具执行仍发生在 callModel 节点内的 chatModel.call() 循环中，无独立图节点。**

**(d) V20 表结构**（`sw-bootstrap/src/main/resources/db/migration/agent/postgresql/V20__init_agent_tool_config.sql`，h2 同构）：`sw_agent_tool_internal`（id/name/description/input_schema/bean_name/method_name/enabled/…）与 `sw_agent_tool_external`（id/name/description/input_schema/url/http_method/timeout_seconds/enabled/…），注释原文："工具名 → (beanName, methodName) / (url, httpMethod) 映射仅存于白名单表，管理员写入，LLM/用户不可在运行时新增条目"。**表与图结构无任何关联列（无 node_id/图引用）。**

**对 F02 的判断依据（仅陈述现状）**：当前"工具节点"无图节点级实现，工具与模型调用全部平铺在唯一 callModel 节点内；后端图执行引擎是"单节点 + ThreadLocal 注入"形态，而非多节点图遍历形态。

---

## 问题 4：前端 `flow-graph` adapter 与 `modules/agent/` 接入状态

**(a) `grep -rln "adapters/flow-graph" Smart-WorkFlow-Web/src/modules/`**：**零命中**（exit 1）。全 `src/` 范围内 `flow-graph` 引用仅存在于 adapter 自身目录（index.ts / index.spec.ts）。

**(b) `modules/agent` 完整文件清单**：

```
Smart-WorkFlow-Web/src/modules/agent/views/AgentHome.vue
```

仅 1 个文件，仍为纯占位页（全文 8 行）：

```vue
<script setup lang="ts">
import BlankPage from '@/components/BlankPage.vue'
</script>

<template>
  <BlankPage />
</template>
```

`router/`、`layouts/` 下 grep `modules/agent` 亦零命中（无路由/菜单入口）。

**(c) `Smart-WorkFlow-Web/src/adapters/flow-graph/index.ts` 当前完整源码**（全文 151 行）：

```ts
  1  /**
  2   * @vue-flow/core 的防腐层。原生 API 只允许在本文件内出现，业务层只认下方导出的我方契约。
  3   */
  4  import { createApp, defineComponent, h, ref, type App as VueApp } from 'vue'
  5  import { VueFlow, type Node as VFNode, type Edge as VFEdge, type Connection } from '@vue-flow/core'
  6  import '@vue-flow/core/dist/style.css'
  7
  8  /* ------------------------------------------------------------------ */
  9  /*  对外契约：业务层只消费这些类型和函数                                  */
 10  /* ------------------------------------------------------------------ */
 11
 12  export interface FlowGraphNode {
 13    id: string
 14    type?: string
 15    label?: string
 16    position: { x: number; y: number }
 17    data?: Record<string, unknown>
 18  }
 19
 20  export interface FlowGraphEdge {
 21    id: string
 22    source: string
 23    target: string
 24    label?: string
 25  }
 26
 27  export interface FlowGraphData {
 28    nodes: FlowGraphNode[]
 29    edges: FlowGraphEdge[]
 30  }
 31
 32  export interface FlowGraphEvents {
 33    onNodeClick?: (node: FlowGraphNode) => void
 34    onEdgeCreate?: (edge: FlowGraphEdge) => void
 35    onGraphChange?: (data: FlowGraphData) => void
 36  }
 37
 38  export interface FlowGraphInstance {
 39    exportGraph(): FlowGraphData
 40    destroy(): void
 41  }
 42
 43  /* ------------------------------------------------------------------ */
 44  /*  内部类型转换：@vue-flow/core 原生类型 ← 我方契约                      */
 45  /* ------------------------------------------------------------------ */
 46
 47  function toFlowGraphNode(node: VFNode): FlowGraphNode {
 48    return {
 49      id: node.id,
 50      type: node.type,
 51      label: typeof node.label === 'string' ? node.label : undefined,
 52      position: { x: node.position.x, y: node.position.y },
 53      data: node.data as Record<string, unknown> | undefined,
 54    }
 55  }
 56
 57  function toFlowGraphEdge(edge: VFEdge): FlowGraphEdge {
 58    return {
 59      id: edge.id,
 60      source: edge.source,
 61      target: edge.target,
 62      label: typeof edge.label === 'string' ? edge.label : undefined,
 63    }
 64  }
 65
 66  /* ------------------------------------------------------------------ */
 67  /*  主入口                                                              */
 68  /* ------------------------------------------------------------------ */
 69
 70  export function mountFlowGraph(
 71    container: HTMLElement,
 72    initialData?: FlowGraphData,
 73    events?: FlowGraphEvents,
 74  ): FlowGraphInstance {
 75    const nodes = ref<FlowGraphNode[]>(initialData?.nodes ?? [])
 76    const edges = ref<FlowGraphEdge[]>(initialData?.edges ?? [])
 77    let destroyed = false
 78    let app: VueApp | null = null
 79
 80    const Wrapper = defineComponent({
 81      setup() {
 82        function handleNodeClick(event: { node: VFNode }) {
 83          events?.onNodeClick?.(toFlowGraphNode(event.node))
 84        }
 85
 86        function handleConnect(connection: Connection) {
 87          const newEdge: FlowGraphEdge = {
 88            id: `vf-${connection.source}-${connection.target}-${Date.now()}`,
 89            source: connection.source,
 90            target: connection.target,
 91          }
 92          edges.value = [...edges.value, newEdge]
 93          events?.onEdgeCreate?.(newEdge)
 94          events?.onGraphChange?.({ nodes: nodes.value, edges: edges.value })
 95        }
 96
 97        function handleUpdateNodes(newNodes: VFNode[]) {
 98          nodes.value = newNodes.map(toFlowGraphNode)
 99          events?.onGraphChange?.({ nodes: nodes.value, edges: edges.value })
100        }
101
102        function handleUpdateEdges(newEdges: VFEdge[]) {
103          edges.value = newEdges.map(toFlowGraphEdge)
104          events?.onGraphChange?.({ nodes: nodes.value, edges: edges.value })
105        }
106
107        return () =>
108          h(VueFlow, {
109            nodes: nodes.value.map((n) => ({
110              id: n.id,
111              type: n.type,
112              label: n.label,
113              position: n.position,
114              data: n.data,
115            })),
116            edges: edges.value.map((e) => ({
117              id: e.id,
118              source: e.source,
119              target: e.target,
120              label: e.label,
121            })),
122            fitViewOnInit: true,
123            onNodeClick: handleNodeClick,
124            onConnect: handleConnect,
125            'onUpdate:nodes': handleUpdateNodes,
126            'onUpdate:edges': handleUpdateEdges,
127          })
128      },
129    })
130
131    app = createApp(Wrapper)
132    app.mount(container)
133
134    return {
135      exportGraph(): FlowGraphData {
136        return {
137          nodes: nodes.value.map((n) => ({ ...n })),
138          edges: edges.value.map((e) => ({ ...e })),
139        }
140      },
141      destroy(): void {
142        if (destroyed) return
143        destroyed = true
144        if (app) {
145          app.unmount()
146          app = null
147        }
148      },
149    }
150  }
151  ```
```

**导出契约**：仍为 **6 个导出符号**——5 个 interface（`FlowGraphNode`/`FlowGraphEdge`/`FlowGraphData`/`FlowGraphEvents`/`FlowGraphInstance`）+ 1 个函数（`mountFlowGraph`），与历史契约一致（佐证：`product/vue-flow-adapter/passed/step-1-implement-flow-graph-adapter.md` §14 验收标准第 2 条："导出 mountFlowGraph、FlowGraphNode、FlowGraphEdge、FlowGraphData、FlowGraphEvents、FlowGraphInstance 六个符号"；§5："当前无任何业务模块消费 adapters/flow-graph/（CONFIRMED 全仓库 grep 零命中）……Vue Flow 定位为 M07 AI 调度图可视化，非表单设计器场景（表单设计器已由 @form-create/designer 完整覆盖）"）。`index.spec.ts` 存在（同目录，配套 6 测试点）。

---

## 问题 5：仓库现有"树状/图状结构 CRUD + 版本管理 + 发布"设计先例

**命中 2 个模块**：`sw-biz-form`（表单设计器）与 `sw-bpm`（流程定义图设计器）。二者均已有「定义表 + DRAFT/PUBLISHED 状态 + 版本号/版本快照 + 发布动作」完整闭环。`sw-basic-*` 下零命中（`sw-basic-job` 的唯一 "publish" 命中为 `DomainEventPublisher.publish(event)`，事件发布，与版本管理无关）。

### 先例 A：sw-biz-form — 表单定义版本 + 发布快照

**(A1) 表结构**（`Smart-WorkFlow/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/resources/db/migration/form/postgresql/V7__init_form_metadata.sql`，h2 同构）关键建表原文：

- `sw_form_def`：`status VARCHAR(20) NOT NULL DEFAULT 'DRAFT'`（注释"状态: DRAFT(草稿) / PUBLISHED(已发布)"）、`physical_table_name`（"发布后回填的动态宽表物理名"）、`form_version INT NOT NULL DEFAULT 1`（"表单版本号（每次发布递增）"）、`logical_table_name`、`sub_table_mapping`。
- `sw_form_config`：`definition JSONB NOT NULL`（"表单样式/控件/布局 schema"）。
- `sw_form_snapshot`：`form_id`、`form_version INT NOT NULL`（"快照版本号（与 sw_form_def.form_version 对齐）"）、`definition JSONB NOT NULL`（"该版本的完整 definition JSONB 快照"）。

**(A2) 状态枚举**（`entity/FormStatusEnum.java`，全文 47 行）：`DRAFT("DRAFT","草稿")` 注释"草稿态：只写元数据，不碰物理表"；`PUBLISHED("PUBLISHED","已发布")` 注释"发布态：动态宽表已建，表名/字段名冻结"。

**(A3) 版本快照实体**（`entity/FormSnapshotEntity.java`，全文 27 行）：`@TableName("sw_form_snapshot")`，字段 `formId`/`formVersion`（"快照版本号（与 sw_form_def.form_version 对齐）"）/`definition`（"该版本的完整 definition JSON"）。类注释："每次发布存一版 definition JSON，用于版本回溯和审核。"

**(A4) 发布流程方法体全文**（`service/impl/FormDefServiceImpl.java` L154-264 `publish(String formId)`，关键步骤）：
- Step1（L156-163）：`selectById` 校验存在 + `!FormStatusEnum.DRAFT.getCode().equals(entity.getStatus())` → 抛 `FORM_ALREADY_PUBLISHED`（"表单已发布，不能重复发布"）。
- Step2（L165-171）：加载 `sw_form_config.definition` JSON（"唯一字段真源"）→ `parseAndValidateFieldsFromDefinition`。
- Step3（L173-190）：字段名白名单校验（ColumnValidation）。
- Step4（L192-202）：`dynamicTableManager.createFormTable(...)` 建动态宽表（"DDL 不可回滚，因此校验先行"）。
- Step5（L214-220）：回填 `entity.setPhysicalTableName(...)`、`setStatus(PUBLISHED)`、`setFormVersion(entity.getFormVersion() == null ? 1 : entity.getFormVersion() + 1)`、`setSubTableMapping(...)` → `formDefMapper.updateById(entity)`。
- Step6（L249-260）：**存快照**——`FormSnapshotEntity` 写入 `formId + formVersion(=递增后版本号) + definitionJson` → `formSnapshotMapper.insert(snapshot)`。

**(A5) 实体字段**（`entity/FormDefEntity.java` L24-31）：`status`（"状态：DRAFT / PUBLISHED"）、`formVersion`（"表单版本号（每次发布递增）"）、`physicalTableName`（"发布后回填的动态宽表物理名"）。

### 先例 B：sw-bpm — 流程定义图模型存储 + 版本 + 发布部署

**(B1) 图模型 DTO**（`Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/dto/ProcessGraph.java`，全文 43 行）：字段 `processKey`（"发布后冻结"）、`name`、`formKey`、`version`（"版本号（默认 1）"）、`elements: List<GraphElement>`（"图元素列表（节点 + 边）"）、`canvas: Map`（不透明透传）。类注释："后端仅解释拓扑（id/kind/type/source/target），config 与 style 为不透明 Map 原样透传，严禁在后端解析其内部字段。"

**(B2) 图元素统一模型**（`dto/GraphElement.java`，全文 48 行）：`id`（"元素唯一标识（设计器分配）"）、`kind`（"节点或边：'node' | 'edge'"）、`type`（"节点类型（START/END/APPROVAL/…），边为 null"）、`source`/`target`（仅边使用）、`config`/`style`（不透明）。**节点与边同用一个元素类型、kind 区分——仓库现成的"图设计器节点/边统一模型"先例。**

**(B3) 定义表**（`sw-bpm-process/src/main/resources/db/migration/bpm/postgresql/V14__add_process_def.sql`，h2 同构）：`sw_bpm_process_def` 列：`process_key varchar(200) NOT NULL`（"流程业务 key（发布后冻结）"）、`name`、`form_key`、`def_version int NOT NULL DEFAULT 1`（"定义版本号（默认 1）"）、`status varchar(20) NOT NULL DEFAULT 'DRAFT'`（"状态：DRAFT（草稿）/ PUBLISHED（已发布）"）、`deployment_id`（"Flowable 部署 ID（cut B 回填）"）、`process_definition_id`、`graph_json text`（"图 JSON 文档（ProcessGraph 序列化）"）。

**(B4) 实体**（`sw-bpm-process/.../entity/BpmProcessDef.java`，全文 69 行）：与表一一对应；注释"存储流程设计器的图模型（ProcessGraph JSON），本刀（cut A）恒为 DRAFT 状态。发布/部署/Flowable 同步留给 cut B"（注：Service 层已实现发布部署，见 B5）。

**(B5) Service 发布流**（`sw-bpm-process/.../service/impl/BpmProcessDefServiceImpl.java`）：
- 创建（L70-90）：`createProcessDef` 生成 `bpm_` 前缀 UUID processKey、`setDefVersion(1)`、`setStatus(STATUS_DRAFT)`、初始图 `START → END`（`buildInitialGraph`）序列化为 `graph_json` 落库。
- 草稿保存（L94-101）：`saveDraftGraph` 直接覆盖 `graph_json`，"status 保持 DRAFT，不跑校验"。
- 校验（L103-127）：`validateGraph` → `graphValidator.validate(elements, formKey)`（GraphValidator 全规则）。
- 发布（L154-225，关键原文）：

```java
195        // 2c. process_key 冻结检查（2101）
196        // 若该 def 已有 PUBLISHED 历史，检查 process_key 是否未变
197        // 首次发布时 def.getStatus() == DRAFT，跳过此检查
198        String newProcessKey = graph.getProcessKey();
199        if (STATUS_PUBLISHED.equals(def.getStatus())) {
200            // 已发布过的定义：process_key 不可变更
201            if (!def.getProcessKey().equals(newProcessKey)) {
202                throw new BaseException(BpmErrorCode.PROCESS_KEY_FROZEN);
203            }
204        }
...
208        // ========== ③ 翻译 ==========
209        byte[] bpmnXml = bpmDeployFacade.translateToBpmn(graph);
210
211        // ========== ④ 部署 ==========
212        String deploymentName = graph.getName() != null ? graph.getName() : newProcessKey;
213        BpmDeployResult deployResult = bpmDeployFacade.deployModel(bpmnXml, deploymentName);
214
215        // ========== ⑤ 回填 + ⑥ 状态 ==========
216        def.setDeploymentId(deployResult.getDeploymentId());
217        def.setProcessDefinitionId(deployResult.getProcessDefinitionId());
218        def.setStatus(STATUS_PUBLISHED);
219        mapper.updateById(def);
```

另有发布前校验：图拓扑校验（L175-181）、绑定表单必须已发布（L183-193，`FORM_NOT_PUBLISHED`）。

**(B6) 版本管理语义总结（两先例对比，仅陈述现状）**：form 采用「单行定义 + 每次发布在 sw_form_snapshot 追加一行版本快照 + form_version 递增」；bpm 采用「单行定义 + def_version（默认 1，发布不递增）+ status 切换 + 部署 ID 回填 + process_key 冻结」。二者均无独立的"定义版本表"多行版本记录模型；bpm 的 `def_version` 目前恒为 1（B3/B4 注释"默认 1，本刀不递增"）。相关已知问题：I11（发布冻结不可逆，发布前字段定义错误成本高）。

---

## 问题 6：`knowledge/known-issues.md` 中 I13 当前状态

**索引行**（`knowledge/known-issues.md` L28）：

```
| I13 | 2026-06-30 | M07 AI 调度图执行引擎/工具沙箱/RAG 选型未定 | 中 | ⚠ 待专项产品设计 |
```

**I13 当前原文完整贴出**（L195-202）：

```markdown
### I13：M07 AI 调度图执行引擎/工具沙箱/RAG 选型未定

- **发现日期**：2026-06-30（PRD v0.1）
- **严重程度**：中
- **可信度**：ASSUMED（需求级，待细化）
- **描述**：AI 智能助手模块（M07）的调度图执行引擎落地形态、工具沙箱边界、RAG 向量库选型、与流程/表单的联动点均待专项产品设计
- **影响**：M07 模块无法进入实质性开发
- **建议**：在 M07 专项产品设计完成前，不在此模块投入编码资源
```

**确认结论**：「执行引擎落地形态」「工具沙箱边界」两项**未在文件中标记解决**——I13 全文无任何解决/部分解决标注，四项（执行引擎落地形态/工具沙箱边界/RAG 向量库选型/流程表单联动点）仍整体"⚠ 待专项产品设计"（索引行 L28 + 描述 L200 均未改动）。文件内唯一相关进展记录是 I3 条目下的修复注记（L77）："（Vue Flow 部分，2026-07-25）[[vue-flow-adapter]] 功能 COMPLETED——adapters/flow-graph/index.ts 已重写为完整防腐层……M07 AI 调度图业务模块仍未就位（预期状态，adapter 可独立先行）"——属 I3（BPMN/Vue Flow adapter）的收尾说明，不构成对 I13 任何单项的解决标记。

---

## 完成标准对照

| 问题 | 结论 | 证据 |
|---|---|---|
| 1 AgentGraphFactory | 全文 221 行贴出；拓扑仍为 START→callModel→END 单节点；Step3/4/5 全部经 ThreadLocal 或图外代码处理，零新增节点/边；addNode/addEdge 纯 Java 硬编码，无 YAML/JSON/DB 外部化 | 全文 + AgentGraphAutoConfiguration 全文 + 全模块 grep + Step3 回执 L32/52/54 |
| 2 图定义持久化 | sw_agent_graph/GraphDefinition/graph_def 全仓零命中；无图定义表/实体；agent Flyway 最大 V24（h2+PG 各 6 脚本），V25+ 空闲 | grep exit 1 + find 输出 |
| 3 工具与图节点 | 工具非独立图节点：FunctionToolCallback 经 ThreadLocal（TOOL_CALLBACKS_BINDING）注入 callModel 单节点，白名单来自 sw_agent_tool_internal/external（V20），执行内建于 ChatModel.call() 循环 | run() 全文 + persistToolCallLogs + buildToolCallbacks L84-106 + V20 表结构 |
| 4 前端接入 | modules/agent 仅 AgentHome.vue 占位页（BlankPage）；flow-graph 零消费方；index.ts 151 行全文贴出，6 导出符号契约未变 | grep + find + index.ts 全文 + product 文档 §14.2 |
| 5 版本/发布先例 | **命中 2 个**：sw-biz-form（DRAFT/PUBLISHED + form_version 递增 + sw_form_snapshot 每次发布存版本 JSON + publish() 全流程）；sw-bpm（def_version + status + graph_json 图模型 + 发布翻译部署回填 + process_key 冻结检查 + ProcessGraph/GraphElement 节点边统一模型） | V7/V14 SQL + 实体/枚举/Service 原文 |
| 6 I13 | 未标记任何一项解决；四项（执行引擎落地形态/工具沙箱边界/RAG 选型/流程表单联动点）仍整体"⚠ 待专项产品设计" | known-issues.md L28 + L195-202 原文 |

**失败处理对照**：6 问全部命中，无落空项。问题 5 为正向命中（2 个版本/发布先例），问题 2/3/4 的"零命中"判断均以 grep exit code + 明确标注作答。
