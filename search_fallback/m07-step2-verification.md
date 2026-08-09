# 校验回执：M07 Step2 编排执行引擎——独立代码级校验

**任务来源**：`search_task/m07-step2-verification.md`（Anthropic 规划层发起，因纸面核验无法确认"回执描述的内容是否真实发生在代码里"）
**校验方式**：独立进入仓库实际代码 + 独立重跑编译/测试/grep/git 命令，零修改任何代码文件
**校验时间**：2026-08-09 16:30-16:50（mvn test 独立复跑完成于 16:41:56）
**只读性确认**：本任务全程未修改/删除/移动任何文件（含 git status 复核）

---

## 问题 1：12 个文件真实存在且关键实现点一致 ✅

逐一确认，全部存在且关键结构与回执描述一致：

| 文件 | 回执声称的关键实现点 | 实测证据 | 判定 |
|------|---------------------|---------|:---:|
| `ChatModelFactory.java` | 协议白名单 `Set.of("openai","ollama")` + switch 三分支（含 default 防御）+ 非法协议抛 `IllegalArgumentException` | 白名单 `src/main/java/com/sw/ck/agent/orchestration/ChatModelFactory.java:42`；非法协议抛异常 `:56-57`；switch 三分支 `:59-64`（default → `IllegalStateException`，注释标明"方案 §9.1 要求第三个分支必须存在"） | ✅ 一致 |
| `AgentGraphFactory.java` | 嵌套类 `SparseStateSerializer` + 静态 `ThreadLocal CHAT_MODEL_BINDING` + `bindChatModel`/`clearChatModel` 静态配对 + `AgentState::new` 作 AgentStateFactory 方法引用 | ThreadLocal `:51`；bind/clear `:54-61`；SparseStateSerializer 嵌套类 `:102-125`，`super(AgentState::new)` `:105`（即为 AgentStateFactory 方法引用） | ✅ 一致 |
| `AgentGraphFactory.java`（channel/序列化偏差） | 空串默认值（非 null）+ last-wins reducer + 序列化跳过 chatModel | channels 定义 `:69-72`（input/output `Channels.base(() -> "")`，chatModel last-wins）；SparseStateSerializer.write 只写 input/output `:109-112`，read 从 ThreadLocal 挂载 `:115-123` | ✅ 一致 |
| `AgentOrchestrationServiceImpl.java` | invoke 前 bind、finally 中 clear 配对；明文 Key 变量 finally 置 null | bind `:80`、`try{...}finally{ clearChatModel() }` `:81-100`；`plainApiKey = null` `:109-111`（外层 finally）；`summarizeError` 沿 cause 链 `:122-132` | ✅ 一致 |
| `AgentOrchestrationController.java` | 权限注解 `@PreAuthorize("@ss.hasPermi('agent:orchestration:run')")`（仓库惯例非 hasAuthority） | `:34` 逐字一致；`@RequestMapping("/agent/orchestration")` `:23`；R\<T\> 包装 `:36` | ✅ 一致 |
| `AgentGraphAutoConfiguration.java` | 不再是空壳：`@AutoConfiguration` + `@ConditionalOnProperty(sw.agent.enabled)` 不变 + 两个 @Bean | `:32-33` 注解不变；`chatModelFactory()` `:36-39`；`agentCompiledGraph()` `:41-44` | ✅ 一致 |
| `AgentOrchestrationService.java` 接口 | 单方法 `run` | `:14-23` 一致 | ✅ 一致 |
| `AgentOrchestrationRunReqDTO.java` / `AgentOrchestrationRunRespDTO.java` | 字段结构、无 bean-validation 注解 | ReqDTO `:13-20`（agentModelConfigId/input，`@Data` 无校验注解）；RespDTO `:14-27`（success/output/errorMessage/latencyMs） | ✅ 一致 |

**结论：12 文件全部存在，关键实现点与回执 §5 描述全部一致，无夸大无遗漏。**

---

## 问题 2：编译与全量测试独立复跑 —— ⚠️ 测试总数不一致（重大发现）

### 编译 ✅
```bash
$ mvn -q -pl sw-basic/sw-basic-agent,sw-bootstrap -am compile 2>&1 | tail -5
COMPILE_EXIT=0          # 独立复跑 EXIT=0，编译零错误
```

### 全量测试：BUILD SUCCESS 属实，但测试总数非 494，实际为 291

独立复跑 `mvn test`：**BUILD SUCCESS，31 模块，Total time 09:19 min**（原始输出摘录：`Basic :: Agent SUCCESS [01:53 min]`、`Biz :: System :: Biz SUCCESS [01:45 min]`、`BUILD SUCCESS`、`Finished at: 2026-08-09T16:41:56+08:00`）。

**但测试总数与回执"494（480 基线 + 14 新增）"不一致。** 独立聚合本次 run 实际生成的 surefire 报告（当前模块 target 目录，时间戳 Aug 9 16:35-16:38，确为本 run 输出）：

```
MAIN（本 run 实际报告，69 个报告类）: TESTS=291 FAILURES=0 ERRORS=0 SKIPPED=0
WORKTREE（.claude/worktrees/agent-a89847e1fdb50384e/ 下陈旧报告，45 类，Jul 22 时间戳）: TESTS=203 FAILURES=0 ERRORS=0 SKIPPED=0
ALL（两者相加）: TESTS=494 FAILURES=0 ERRORS=0 SKIPPED=0
```

**关键结论**：回执声称的 494 **只有在把 `.claude/worktrees/agent-a89847e1fdb50384e/` 下 45 份 7 月 22 日的陈旧 surefire 报告（203 个测试，来自另一个 agent 工作树的旧构建产物）一并计入时才复现**。本次独立复跑的真实测试总数是 **291（69 个报告类），0 失败 0 错误 0 跳过**。回执的"480 基线 + 14 新增"中"480 基线"同样无法独立复现（本次实际基线 = 291 − 14 = 277）。

**14 个新增用例属实且全绿**（sw-basic-agent 模块本次报告逐类核实）：
- `AgentGraphFactoryTest` 3 ✅ / `ChatModelFactoryTest` 5 ✅ / `AgentOrchestrationServiceImplTest` 3 ✅ / `AgentOrchestrationControllerTest` 3 ✅（全部 0 失败）

**判定：部分一致** —— BUILD SUCCESS、0 失败 0 错误 0 跳过、14 个新用例真实全绿 ✅；但**测试总数 494 与独立复跑数字 291 不一致**，回执数字疑似包含陈旧工作树报告（或统计口径含 `.claude/` 目录）。如实记录，不弱化。

---

## 问题 3：静态检查七项独立复跑 ✅（与回执完全一致）

| 检查项 | 独立命令 | 实测结果 | 判定 |
|--------|---------|---------|:---:|
| 工具调用类（`@Tool`/`ToolCallback`/`MethodToolCallback`/`ToolCallingManager`/`org.springframework.ai.tool`） | `grep -rn --include="*.java" -E "@Tool|ToolCallback|..." sw-basic/` | **0 命中** | ✅ |
| checkpoint 类（`CompileConfig`/`BaseCheckpointSaver`/`FileSystemSaver`） | 同上 | **0 命中** | ✅ |
| `Channels.appender` | `grep -rn --include="*.java" "Channels\.appender" sw-basic/` | **0 命中** | ✅ |
| Step1 产出文件未被修改 | `git diff --stat -- .../AgentModelConfig.java .../AgentModelConfigMapper.java .../AgentModelConfigServiceImpl.java .../AgentModelController.java .../AgentModelAutoConfiguration.java` | **空输出（DIFF_EXIT=0，无任何差异）** | ✅ |
| Flyway 零新增脚本 | 磁盘检查 `sw-bootstrap/src/main/resources/db/migration/agent/{h2,postgresql}/` | 仅 `V19__init_agent_model_config.sql`（Aug 4 12:19 mtime，Step1 遗留），**无 V20+** | ✅ |
| controller/dto 无明文 Key 迹象 | `grep -rn -E "plainApiKey|getApiKey\(" .../controller/ .../dto/` | **0 命中**（controller/dto 目录中连 getApiKey 字样都没有） | ✅ |
| 权限码唯一不重叠 | `grep -rn "agent:orchestration:[a-z]*" sw-basic/` | 主代码中 `agent:orchestration:run` **恰好 1 处**（AgentOrchestrationController.java:34）；与 Step1 的 `agent:model:view/manage/test`（AgentModelController.java:41/49/56/63/71/79）互不重叠；测试代码中 3 处（2 个 DisplayName 字符串 + userB 权限列表） | ✅ |

---

## 问题 4：回执 §8 三项关键技术断言独立核实 ✅

### 4a. `OpenAiApi.Builder.build()` 强制 apiKey 非空 —— 属实（字节码级确认）
javap 反编译 `~/.m2/repository/org/springframework/ai/spring-ai-openai/1.0.4/spring-ai-openai-1.0.4.jar` 中 `OpenAiApi$Builder`：
```
public org.springframework.ai.openai.api.OpenAiApi build();
    Code:
       0: aload_0
       1: getfield      #72   // Field apiKey:Lorg/springframework/ai/model/ApiKey;
       4: ldc           #137  // String apiKey must be set
       6: invokestatic  #116  // Method Assert.notNull:(Ljava/lang/Object;Ljava/lang/String;)V
```
`Assert.notNull(apiKey, "apiKey must be set")` 真实存在于字节码 → 回执"build() 有 Assert.notNull(apiKey)"断言属实。

### 4b. `OllamaOptions` 无 `maxTokens` setter —— 属实
javap 全量方法列 `OllamaOptions$Builder`：
```
public OllamaOptions$Builder numPredict(Integer);
public OllamaOptions$Builder topP(Double);
public OllamaOptions$Builder temperature(Double);
```
**无 `maxTokens` 方法**，`numPredict(Integer)` 确实存在 → 回执"用 numPredict 代替"属实。

### 4c. `AgentGraphFactoryTest` 用例 3 断言真实 —— 属实（非凑造）
`AgentGraphFactoryTest.java:57-80` 真实代码：构造抛异常的 `ThrowingChatModel`（`:100-106`，`call()` 抛 `IllegalStateException("node exploded")`）→ `catchThrowable(() -> graph.invoke(...))`（`:65-66`）→ **手动遍历 cause 链取最深层**（`:70-73`）→ 断言根因 `isInstanceOf(IllegalStateException.class).hasMessageContaining("node exploded")`（`:74-76`）。断言逻辑真实验证"原样抛出 + cause 链含原始异常 + 不返回空 Optional"，与回执描述完全一致。

---

## 问题 5：retryCount 行为验证用例真实存在 ✅

`ChatModelFactoryTest.java:77-113` 真实实现与回执描述完全一致：
- `startChatServer`（`:127-136`）用 JDK `com.sun.net.httpserver.HttpServer` + **`AtomicInteger hits` 请求计数器**；
- 用例 4（`:78-97`）：handler 中 `if (n <= 2) 500 响应; else 200`（`:81-87`），断言回复文本 == "第三次成功" **且 `lastHit.get() == 3`**（`:96`）；
- 用例 4b（`:100-113`）：永远 500，断言抛异常 **且 `lastHit.get() == 1`**（`:112`）。
与回执"前 N 次 500 后第 N+1 次 200 + 请求计数断言"的表述逐点相符，非凑造。

---

## 问题 6：明文 Key 泄漏断言 —— 部分一致（一处精度差异，如实记录）

| 测试 | 回执描述 | 实测 | 判定 |
|------|---------|------|:---:|
| `AgentOrchestrationServiceImplTest` 用例 3 | `doesNotContain("sk-test-123456")` + `doesNotContain("sk-")` | `:205-208` 确实两行都有：`.doesNotContain(TEST_API_KEY).doesNotContain("sk-")` | ✅ 一致 |
| `AgentOrchestrationControllerTest` 用例 2 | （测试回执 §5.4 仅称"errorMessage 不含明文 Key"，未声称具体断言形式） | `:241-243` 实际断言 **只有** `.doesNotContain("sk-test-123456")`，**无** 通用 `doesNotContain("sk-")` 模式 | ⚠️ 精度差异：Controller 层只有"具体假 Key 串"断言，无通用 `"sk-"` 模式断言。与回执文字（未声称通用模式）不冲突，但与验证任务对回执的解读（"回执称用了 doesNotContain(\"sk-\")"）存在差异，如实标明 |

**说明**：Service 层（异常消息来自网络层摘要）与 Controller 层（断言作用于 R 响应 JSON）场景不同，但结论需精确：**通用 "sk-" 模式断言只在 Service 层存在**。

---

## 问题 7："sw.agent.enabled 真实自动配置路径无测试覆盖"披露 —— 属实且准确 ✅

两个 `@SpringBootTest` 实测配置：
- `AgentOrchestrationServiceImplTest.java:75-84`：`@SpringBootTest(classes = AgentOrchestrationServiceImplTest.TestConfig.class, ...)`，无任何 import 真实 `AgentGraphAutoConfiguration`；TestConfig（`:267-410`）手动 `new ChatModelFactory()`（`:391-394`）、`new AgentGraphFactory().buildGraph()`（`:396-399`）、`new AgentOrchestrationServiceImpl(...)`（`:401-409`）——同构 bean 全部手动声明；
- `AgentOrchestrationControllerTest.java:102-113`：同样 `classes = ...TestConfig.class`（`:284-592` 手动声明同构 bean，`:415-439` 业务 bean），且测试 properties 中**无任何 `sw.agent.enabled` 设置**；
- 两个测试的 properties 都只做了 `spring.autoconfigure.exclude`（Mybatis/Redis/Security 自动配置）——**真实 `AgentGraphAutoConfiguration`（`@ConditionalOnProperty sw.agent.enabled=true`）从未被任何测试触发**。

**结论**：回执 §11/风险 2 的披露完全准确——真实自动配置路径确实零测试覆盖，且是"如实披露"而非措辞美化（实际情况既不更好也不更差：测试确实绕过了真实装配路径）。

---

## 问题 8：前端零改动 + 零新增依赖 ✅

- `git status --porcelain -- Smart-WorkFlow-Web/` → **空输出**（零改动）✅；
- `git diff -- Smart-WorkFlow/pom.xml` → **空输出**；`git diff --stat` 对全部模块 pom → **空输出**；进一步 `git status --porcelain -- Smart-WorkFlow/` 整体 **空输出**（整个 Java 仓库已全部 commit、无任何未提交文件）→ **零新增依赖属实**，且比回执更强：pom 没有任何 git 差异 ✅。

---

## 汇总判定

| # | 校验项 | 判定 |
|---|--------|:---:|
| 1 | 12 文件存在 + 关键实现点 | ✅ 一致 |
| 2 | 编译零错误 / BUILD SUCCESS | ✅ 一致 |
| 2 | **测试总数 494** | ⚠️ **不一致：独立复跑实际 291（69 报告类）；494 仅在计入 `.claude/worktrees/agent-a89847e1fdb50384e/` 7 月 22 日陈旧报告（203 测试）时复现** |
| 2 | 0 失败 0 错误 0 跳过 | ✅ 一致 |
| 3 | 静态检查七项（tool/checkpoint/appender/Step1 文件/Flyway/明文 Key/权限码） | ✅ 全部一致 |
| 4 | javap 断言（build() apiKey 非空 / Ollama 无 maxTokens）/ 用例 3 真实 | ✅ 全部一致 |
| 5 | retryCount 行为验证用例 | ✅ 一致 |
| 6 | 明文 Key 断言 | ⚠️ 部分一致：Service 层有 `"sk-"` 通用断言；Controller 层仅 `"sk-test-123456"` 具体断言，无通用模式 |
| 7 | sw.agent.enabled 真实路径无测试覆盖的披露 | ✅ 属实且准确 |
| 8 | 前端零改动 / 零新增依赖 | ✅ 一致 |

**总体结论**：回执的代码实现描述（问题 1、3、4、5、7、8）经独立核实全部真实无夸大；**唯一重大不一致是问题 2 的测试总数（回执 494 vs 独立复跑 291）**——0 失败/0 错误/0 跳过为真、14 个新用例为真，但"480 基线"与"494 总数"均无法独立复现，疑似统计口径将陈旧工作树 surefire 报告一并计入。此差异已如实记录，是否修正统计口径由规划层/用户决定（本任务禁止改动任何文件，未做任何修改）。

**无法独立验证项**：无。全部 8 个问题均给出可追溯证据（文件:行号或命令原始输出）。
