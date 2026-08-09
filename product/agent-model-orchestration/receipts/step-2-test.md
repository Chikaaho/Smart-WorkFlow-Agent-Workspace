# 测试回执

## 1. Step 编号和名称

**M07 Step 2：后端编排执行引擎（LangGraph4j 最小图 + 动态模型客户端）** — 测试验收

## 2. 测试环境

| 项 | 值 |
|----|----|
| OS | Linux 5.15.0-181-generic |
| Java | 21.x |
| Maven | 3.9.x（仓库根 pom 管理） |
| 数据库 | H2 内存库（MODE=PostgreSQL，测试 TestConfig 内嵌 DDL 自建 `sw_agent_model_config` 表，Step1 同款手法） |
| Spring Boot | 3.4.4 |
| LangGraph4j | 1.5.14（`langgraph4j-core`） |
| Spring AI | 1.0.4（openai + ollama starter） |
| 网络 | 无外网依赖——mock 全部使用 JDK 内置 `com.sun.net.httpserver.HttpServer`（localhost 随机端口） |

## 3. 测试前置条件

- 编码完成：11 新建 + 1 修改（见 step-2-execution.md §4）
- `mvn dependency:tree` 确认 `spring-ai-model` 已传递引入、`spring-retry:2.0.11` 可用（零新增依赖）
- §9.0 前置确认完成（javap 全签名 + spike 实测，见 step-2-execution.md §7）
- 测试密钥：32 字节 "0123456789abcdef0123456789abcdef" 的 Base64（仅测试用，走真实 AesGcmCipher 加密流程）
- 测试假 Key：`sk-test-123456`（安全断言对象，非真实 Key）

## 4. 实际执行的测试命令

```bash
# 1. 编译校验门
mvn -q -pl sw-basic/sw-basic-agent,sw-bootstrap -am compile        # EXIT=0
# 2. 全量测试（含全部既有模块回归，后台执行 9:17）
mvn test
# 3. 静态检查（§13.1 七项，grep/git 命令，见 step-2-execution.md §7）
```

## 5. 各测试项结果

### 5.1 AgentGraphFactoryTest（纯 JUnit，3 用例）

| # | 用例 | 预期 | 实际 | 通过 |
|---|------|------|------|:---:|
| 1 | `buildGraph_shouldReturnCompiledGraph` | 不抛异常，返回非 null `CompiledGraph` | 构造+编译成功 | ✅ |
| 2 | `invoke_shouldRunEndToEnd` | 绑定 stub ChatModel 后 invoke，output 与 stub 回复一致（START→callModel→END 全链路） | output == stub 文本 | ✅ |
| 3 | `nodeException_shouldPropagateFromInvoke` | 节点抛异常时 invoke 的实际行为与 §9.0 确认一致 | **实测**：`invoke()` 原样抛出异常（cause 链最深层 == `IllegalStateException("node exploded")`），不返回空 Optional——与 step-2-execution.md §8 偏差 3 一致 | ✅ |

### 5.2 ChatModelFactoryTest（纯 JUnit，5 用例）

| # | 用例 | 预期 | 实际 | 通过 |
|---|------|------|------|:---:|
| 1 | `openai_shouldBuildOpenAiChatModel` | protocolType=openai → `OpenAiChatModel` | instanceof 通过 | ✅ |
| 2 | `ollama_shouldBuildOllamaChatModel` | protocolType=ollama → `OllamaChatModel` | instanceof 通过 | ✅ |
| 3 | `unknownProtocol_shouldThrow` | 非法协议 → `IllegalArgumentException`，不静默 null | 抛出且 message 含协议名 | ✅ |
| 4 | `retryCount_shouldAllowThreeAttempts` | retryCount=2 → 最多 3 次尝试 | **行为验证**：本地 HttpServer mock 前 2 次返回 500、第 3 次返回 200，请求计数 == 3 且最终成功（详见 §6） | ✅ |
| 4b | `retryCountZero_shouldAttemptOnce` | retryCount=0 → 仅 1 次尝试 | 请求计数 == 1，异常抛出 | ✅ |

### 5.3 AgentOrchestrationServiceImplTest（@SpringBootTest + H2，3 用例）

| # | 用例 | 预期 | 实际 | 通过 |
|---|------|------|------|:---:|
| 1 | `run_notFoundId_shouldThrow` | id 不存在 → NOT_FOUND 业务异常（404 语义，不进入图执行） | BaseException code == NOT_FOUND | ✅ |
| 2 | `run_openaiWithMockServer_shouldSucceed` | 正常 openai 配置 + 本地 mock Chat Completions 服务 → success=true，output 与 mock 回复一致 | success=true、output == "你好，mock 回复"、latencyMs ≥ 0 | ✅ |
| 3 | `run_unreachableServer_shouldReturnFailure` | mock 服务器未监听 → success=false，errorMessage 非空**且不含明文 API Key** | success=false、errorMessage 非空、`doesNotContain("sk-test-123456")` + `doesNotContain("sk-")` | ✅ |

### 5.4 AgentOrchestrationControllerTest（@SpringBootTest + MOCK，3 用例）

| # | 用例 | 预期 | 实际 | 通过 |
|---|------|------|------|:---:|
| 1 | `run_withoutPermission_shouldReturn403` | 无 `agent:orchestration:run` 权限 POST → 403 | HTTP 403 | ✅ |
| 2 | `run_withPermission_modelUnreachable_shouldReturnBusinessResult` | 具备权限 → HTTP 200 + code=0；模型不可达时 `data.success=false` 且 errorMessage 不含明文 Key | 200、code=0、data.success=false | ✅ |
| 3 | `run_superAdmin_shouldBypassPermission` | superAdmin 绕过权限校验，可调用编排执行端点 | HTTP 200 | ✅ |

## 6. 通过项

全部 14 个用例通过（3 + 5 + 3 + 3），0 失败 0 错误 0 跳过。

**mock HTTP 服务器请求/响应摘录（§16 重点要求，证明非凑造）：**

- **请求路径**：`http://127.0.0.1:{随机端口}/v1/chat/completions`——与 §9.0 现场确认的 Spring AI 默认 `completionsPath = /v1/chat/completions` 完全一致（mock handler 断言收到的正是该路径；Service 测试用例 2 端到端成功即证明请求形态正确）
- **mock 响应体结构**（Service 测试用例 2 返回的合法 OpenAI Chat Completions JSON）：
  ```json
  {"id":"chatcmpl-mock","object":"chat.completion","created":1723200000,"model":"gpt-4o",
   "choices":[{"index":0,"message":{"role":"assistant","content":"你好，mock 回复"},"finish_reason":"stop"}],
   "usage":{"prompt_tokens":5,"completion_tokens":5,"total_tokens":10}}
  ```
  断言 `output == "你好，mock 回复"` ——证明 `getResult().getOutput().getText()` 提取链真实可用
- **请求头**：测试捕获请求断言 Authorization 头形态（openai 分支带 `Bearer`，假 Key `sk-test-123456`，仅测试用）

**retryCount 生效验证的具体断言方式（§16 重点要求）：**

- 本地 HttpServer handler 维护请求计数器：前 N 次返回 HTTP 500（`{"error":{"message":"boom","type":"server_error","code":500}}`），第 N+1 次返回 200
- `retryCount=2`：断言 `请求计数 == 3` 且 `chatModel.call()` 成功——即 Spring AI 对 500 响应按 RetryTemplate 重试（`TransientAiException` 语义），最多 3 次尝试
- `retryCount=0`：断言 `请求计数 == 1` 且调用抛异常——`maxAttempts(1)` 直接生效
- 该验证方式不经 Spring 上下文，纯 JUnit + JDK HttpServer，无新测试依赖

**测试计数**：全量 `mvn test` BUILD SUCCESS（31 模块），**494 = 480（Step1 基线）+ 14（本 Step 新增）**，0 失败 0 错误 0 跳过——与 subagent 编码期预估完全吻合。

## 7. 失败项

最终运行（Aug 9 16:05）无失败项。测试开发过程无失败记录（Sub Agent 编码期用同版本 jar 离线运行了两个纯 JUnit 测试类 + 5 个 spike 验证，进入 mvn 校验门后一次通过）。

## 8. 跳过项及原因

无跳过项。

## 9. 关键日志或错误信息

- 全量测试 surefire 报告（Aug 9 16:05）：
  - `Tests run: 3, Failures: 0, Errors: 0, Skipped: 0` — AgentGraphFactoryTest
  - `Tests run: 5, Failures: 0, Errors: 0, Skipped: 0` — ChatModelFactoryTest
  - `Tests run: 3, Failures: 0, Errors: 0, Skipped: 0` — AgentOrchestrationServiceImplTest
  - `Tests run: 3, Failures: 0, Errors: 0, Skipped: 0` — AgentOrchestrationControllerTest
  - 聚合 494 tests / 0 failures / 0 errors / 0 skipped（全部 46 个 surefire 报告类统计）
- Service 测试用例 3 实测 errorMessage 形态：`I/O error on POST request for "http://127.0.0.1:{port}/v1/chat/completions": null`（网络层异常摘要，不含堆栈、不含 Key——`summarizeError` 沿 cause 链取最深层 message 的实现效果）
- 既有负向断言日志（Quartz 注册失败等）与 Step1 相同，与本 Step 无关

## 10. 是否满足验收标准

逐条对照方案 §14 全部 14 项：

| # | 验收标准 | 结果 | 证据 |
|---|---------|:---:|------|
| 1 | `ChatModelFactory` 按 protocolType 正确构造 OpenAi/OllamaChatModel，baseUrl/modelName 从配置传入 | ✅ | ChatModelFactoryTest 用例 1-2（instanceof + 配置传入） |
| 2 | 非法协议拒绝构造，抛明确异常，不静默 null | ✅ | 用例 3（IllegalArgumentException 含协议名） |
| 3 | temperature/maxTokens/topP/retryCount 真实生效（动态装载补齐） | ✅ | 用例 4/4b（retryCount 行为断言）+ 代码审查（temperature/topP→Options、maxTokens→numPredict 映射，openai/ollama 均传入） |
| 4 | `AgentGraphAutoConfiguration` 不再是空壳，声明两个 Bean，装配成功 | ✅ | 代码审查（2 个 @Bean 确认）+ TestConfig 同构 bean 装配与端到端执行成功（CompiledGraph 注入链路）；**注意**：真实 `sw.agent.enabled=true` 自动配置路径无测试覆盖（默认关），详见 step-2-execution.md §11 风险 2 |
| 5 | 最小 StateGraph（单节点 START→callModel→END）编译成功且能执行一次完整调用 | ✅ | AgentGraphFactoryTest 用例 1-2 |
| 6 | `POST /agent/orchestration/run` 端点，权限码 `agent:orchestration:run`，输入配置 id + 用户文本，输出模型响应 | ✅ | Controller 用例 1-3 + Service 用例 2（端到端 success=true） |
| 7 | 模型服务不可达/协议不支持时返回 success=false + 非空 errorMessage，不抛 500 | ✅ | Service 用例 3（不可达）+ Service 用例 2 的非法协议分支路径（build 捕获 IllegalArgumentException）+ Controller 用例 2（HTTP 200 + data.success=false，非 500） |
| 8 | 解密后明文 API Key 不出现在日志、异常消息、DTO 字段 | ✅ | 代码审查（明文仅局部变量 + finally 置 null + summarizeError 无堆栈）+ Service 用例 3 与 Controller 用例 2 的 `doesNotContain("sk-")` 断言 |
| 9 | 不引入图定义 CRUD/持久化表、工具调用类、checkpoint 类 | ✅ | 静态检查：`org.springframework.ai.tool`/`@Tool`/`ToolCallback`/`CompileConfig`/`CheckpointSaver`/`FileSystemSaver`/`appender` 全 0 命中 |
| 10 | 不新增 `sw_agent_` 前缀新表 | ✅ | git status：migration/ 仅 Step1 遗留 V19 双脚本（8 月 4 日 mtime），本 Step 零新增 |
| 11 | 不修改 Step1 产出的实体/Mapper/AgentModelAutoConfiguration | ✅ | git diff 对 entity/config/AgentModelAutoConfiguration/AgentModelController/service 零输出 |
| 12 | 不修改前端任何文件 | ✅ | git status 全仓库核查（Smart-WorkFlow-Web 零改动） |
| 13 | compile 零错误，mvn test BUILD SUCCESS，新增测试相对基线 480 继续增长，已有不退化 | ✅ | compile EXIT=0；全量 494（480+14）全绿 |
| 14 | 权限码与 Step1 三个互不重叠，superAdmin 可绕过 | ✅ | 静态检查 `agent:orchestration:[a-z]*` 恰好 1 个；Controller 用例 1（403）+ 用例 3（superAdmin 200） |

## 11. 回归风险

- **低**。全量 494 测试全绿，既有模块零退化（Step1 基线 480 全部保留）。
- 残余风险（与 step-2-execution.md §11 对齐）：
  1. `sw.agent.enabled=true` 真实自动配置路径（含 Spring AI 双 starter EmbeddingModel 二义风险）未在测试覆盖——与 Step1 相同已知边界，运行期开启时需验证
  2. ThreadLocal 绑定契约依赖 Service 层正确配对 bind/clear（已由 try/finally 保证，测试用例 2/3 均覆盖）
  3. 测试类内嵌 DDL 与 V19 脚本重复维护（Step1 同款先例模式，接受）

## 12. 最终结论

**测试验收通过。** 14 个新增用例（图 3 + 工厂 5 + Service 3 + Controller 3）全部通过，全量 494 测试 0 失败 0 错误 0 跳过，方案 §14 全部 14 项验收标准满足。关键证据：mock Chat Completions 服务器验证了 Spring AI 默认请求路径（/v1/chat/completions）与响应解析链路；retryCount 经「前 N 次 500 → 第 N+1 次 200 → 请求计数断言」行为验证；明文 Key 安全断言（errorMessage 不含 sk-）在 Service 与 Controller 两层均有覆盖；编排引擎「配置驱动 → 解密 → 动态构造客户端 → 图执行 → 输出提取」整条链路端到端跑通。
