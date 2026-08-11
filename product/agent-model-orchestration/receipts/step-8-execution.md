# 执行回执

## 1. Step 编号和名称

**M07 Step 8（后端）：图解释执行引擎第一版**

- 功能：agent-model-orchestration（M07-F02 图设计器第二步——`AgentGraphInterpreter` 纯 Java 解释器 + 执行 Service/端点 + 执行前校验 + 步数上限，图从"能画能存"到"能跑"）
- 方案文件：`product/agent-model-orchestration/ready/step-8-graph-interpreter-engine.md`（§1-§11 全部 11 节，唯一权威任务定义）
- 前置：Step7 图定义 CRUD+发布骨架（D63，362 tests）；Step6 设计澄清三项决策（工具节点=独立图节点 / MVP 节点=LLM+工具+条件分支 / 执行引擎=图定义驱动解释执行）
- 测试基线口径：D63 after-Step7 基线 **362 tests**（memory/state.md 确认，sw-basic-agent 100）
- **执行时间**：2026-08-11
- **改动文件清单（实际）**：新建 7 个（5 生产 Java + 2 测试 Java）+ 修改 1 个生产文件（Controller 追加端点 + 构造器加依赖）+ 修改 1 个既有测试文件（Controller 测试适配新构造器 + 追加 4 用例）+ 本回执

## 2. 使用模型

- 执行模型：deepseek-v4-flash（本会话实际执行；方案推荐 pro 优先，用户侧成本优化选型惯例，非需核验偏差——同 D54 先例）

## 3. 实际读取的文件

| 文件 | 用途 |
|---|---|
| `ready/step-8-graph-interpreter-engine.md` | 本 Step 方案（§1-§11 全部） |
| `passed/step-7-graph-def-crud-publish.md` | Step7 方案（requireEntity/发布门/权限/测试装配语义） |
| `receipts/step-7-execution.md`、`step-7-test.md` | Step7 回执（4 项偏差处理模式复用） |
| `orchestration/AgentGraphFactory.java` | 只读（F01 执行路径 + ThreadLocal 绑定模式，零改动） |
| `orchestration/ChatModelFactory.java` | 只读（`build(AgentModelConfig, String plainApiKey)` 签名确认） |
| `orchestration/AgentToolCallbackFactory.java` | 只读（`buildToolCallbacks(Long)` 公开装载 + `buildInternal/ExternalCallback` 私有构造，零改动） |
| `service/impl/AgentOrchestrationServiceImpl.java` | 只读（F01 run() 校验/异常摘要/明文 Key 生命周期惯例） |
| `entity/AgentGraphDef.java`、`dto/graph/ProcessGraph.java`、`dto/graph/GraphElement.java` | Step7 产物（图模型 + config/style 不透明禁令注释） |
| `service/impl/AgentGraphDefServiceImpl.java`、`controller/AgentGraphDefController.java` | Step7 产物（requireEntity/parseGraph/发布语义；Controller 追加端点） |
| `entity/AgentModelConfig.java`、`entity/tool/AgentToolInternalConfig.java`、`entity/tool/AgentToolExternalConfig.java`、4 个 Mapper | 执行契约所需实体/查询面 |
| `dto/AgentOrchestrationRunRespDTO.java` | DTO 风格（success/output/errorMessage/latencyMs） |
| `sw-common` `AesGcmCipher.java`/`CommonErrorCode.java`/`R.java`/`BaseServiceImpl.java` | final 类（不 mock）、错误码、响应包裹、Service 基类 |
| Step7 两个测试类 + `AgentModelConfigServiceImplTest`/`AgentToolConfigServiceImplTest` | 测试装配模式 + 建表 DDL 复制 |
| `AgentGraphFactoryTest.java` | ChatModel 桩模式（ChatModel 仅 call(Prompt) 为抽象方法） |
| spring-ai-model-1.0.4.jar（javap） | `ToolCallback.call(String)→String`、`getToolDefinition().name()`、`JsonParser.toJson/fromJson` 签名确认 |

## 4. 实际修改的文件

**新建（7）**：
```
Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/
  orchestration/AgentGraphInterpreter.java          （核心解释器，纯 Java，含 GraphExecutionException 内部类）
  dto/AgentGraphExecuteReqDTO.java
  dto/AgentGraphExecuteRespDTO.java
  service/AgentGraphExecutionService.java
  service/impl/AgentGraphExecutionServiceImpl.java
Smart-WorkFlow/sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/
  orchestration/AgentGraphInterpreterTest.java      （7 用例）
  service/impl/AgentGraphExecutionServiceImplTest.java （12 用例）
```

**修改（2）**：
- `controller/AgentGraphDefController.java`（生产代码，唯一：追加 `POST /{id}/execute` 端点 + 构造器新增 `AgentGraphExecutionService` 依赖）
- `test/.../controller/AgentGraphDefControllerTest.java`（测试侧适配：TestConfig 装配执行 Service/mock 工厂/真实 cipher + 新构造器参数；追加 4 个 execute 端点用例）

**零修改**：`AgentGraphFactory`/`AgentGraphAutoConfiguration`/`ChatModelFactory`/`AgentToolCallbackFactory`/`AgentOrchestrationServiceImpl`/V19-V25 任何脚本/前端/pom.xml（git diff 空，验收 1/11）。

## 5. 每个文件的修改摘要

| 文件 | 摘要 |
|---|---|
| `AgentGraphInterpreter.java`（新建，约 290 行） | 纯 Java 解释器：节点类型 String 常量 START/END/LLM/TOOL/CONDITION（D52 精神非 enum）；构造器 `(ChatModelFactory, AgentToolCallbackFactory, Map<Long,AgentModelConfig> modelConfigs, AesGcmCipher, Long tenantId, int maxSteps)`；`run(graph, input)` 从唯一 START 沿 elements 遍历：LLM 节点按 `config.agentModelConfigId`（Long 必填）→ 解密 → `ChatModelFactory.build` → `new Prompt(new UserMessage(text))` 单跳（不带工具/历史）→ 输出覆盖；TOOL 节点按 `config.toolName`（String 必填）→ `buildToolCallbacks(tenantId)` 白名单装载中按 `getToolDefinition().name()` 精确匹配单个回调 → `call(JsonParser.toJson(text))` → 返回解码还原后覆盖；CONDITION 纯路由按 §2-C（elements 原始顺序逐条 `text.contains(keyword)` 取第一个命中；未命中走唯一无 keyword 默认边；无默认边→`GraphExecutionException`；默认边不唯一→异常）；非条件节点出边必须唯一；步数硬上限 `maxSteps`；`GraphExecutionException` 为嵌套 public static 类（新建文件清单未列异常类，嵌套避免超范围）；静态 `keywordOf(edge)` 供执行前校验复用 |
| `AgentGraphExecuteReqDTO.java`（新建） | `{input}` 单字段 |
| `AgentGraphExecuteRespDTO.java`（新建） | `{success, output, errorMessage, latencyMs}`，语义对齐 F01 run() |
| `AgentGraphExecutionService.java`（新建） | 接口：`AgentGraphExecuteRespDTO execute(Long graphDefId, String input)` |
| `AgentGraphExecutionServiceImpl.java`（新建，约 300 行） | 加载图定义（requireEntity，NOT_FOUND 同 Step7）→ PUBLISHED 校验（PARAM_ERROR"图未发布"）→ parseGraph（空/损坏 PARAM_ERROR）→ 执行前校验 §2-D（START 唯一 / 至少一个 END 可达（BFS）/ LLM 节点 agentModelConfigId 解析到租户内配置（selectById 经租户拦截器）/ TOOL 节点 toolName 精确匹配 enabled=1 白名单（两表 selectCount）/ CONDITION 默认边唯一）→ 组装解释器（maxSteps=节点数×2）→ 运行时异常捕获转 success=false + summarizeError（不上抛）；LLM 配置执行前一次性加载传 map（单查询无 TOCTOU，解释器保持纯 Java 无 DB）；tenantId 经 LoginContextProvider 透传工具装载 |
| `AgentGraphDefController.java`（修改） | 追加 `POST /{id}/execute`，`@PreAuthorize("@ss.hasPermi('agent:model:manage')")`（执行消耗模型调用成本归 manage，与发布同级，方案 §4）；构造器加 `AgentGraphExecutionService` |
| `AgentGraphInterpreterTest.java`（新建，7 用例） | 纯 Java，mock ChatModelFactory/AgentToolCallbackFactory + 真实 AesGcmCipher（final 类不 mock）：①LLM 单跳覆盖（含解密→build 验证）②TOOL 单跳覆盖 ③条件命中关键词边（含 elements 顺序优先级）④未命中走默认边 ⑤无匹配且无默认边抛 GraphExecutionException ⑥自环步数超限终止 ⑦START→LLM→LLM→END 顺序链路（覆盖语义逐跳断言） |
| `AgentGraphExecutionServiceImplTest.java`（新建，12 用例） | @SpringBootTest+H2+TestConfig 组合装配（复制 Step7 模式 + 3 张额外表 DDL 与 V19/V20/V21 对齐）：①已发布 LLM 图执行成功 ②DRAFT PARAM_ERROR ③不存在 id NOT_FOUND ④LLM 引用不存在配置执行前 PARAM_ERROR ⑤TOOL 引用不存在/未启用工具执行前 PARAM_ERROR ⑥跨租户 NOT_FOUND ⑦START 不唯一 PARAM_ERROR ⑧END 不可达 PARAM_ERROR ⑨CONDITION 默认边不唯一 PARAM_ERROR ⑩TOOL 节点执行成功（白名单行+mock 回调）⑪运行时条件无匹配无默认边 success=false（不上抛）⑫模型调用抛异常 success=false+摘要 |
| `AgentGraphDefControllerTest.java`（修改） | TestConfig 装配 `AgentGraphExecutionServiceImpl`（mock ChatModelFactory/AgentToolCallbackFactory + 真实 AesGcmCipher）+ Controller 构造器适配；新增 4 用例：⑨execute 已发布图 200+success=true（START→END 初始图，不触达模型工厂）⑩无权限 403 ⑪DRAFT 图 body.code=400 ⑫不存在 id body.code=404 |

## 6. 实际执行的命令

```
mvn -q -pl sw-basic/sw-basic-agent -am test -Dtest=AgentGraphInterpreterTest -Dsurefire.failIfNoSpecifiedTests=false -o   （解释器单测，迭代 3 轮）
mvn -pl sw-basic/sw-basic-agent -am test -o                                                            （模块全量，迭代 2 轮）
mvn test -o                                                                                            （全仓库回归，最终 385 tests）
find /data/reasonix/files/Smart-WorkFlow -path "*target/surefire-reports*" -name "*.txt" -newer ...      （逐模块统计）
git status / git diff --stat / grep hasPermi / ls db/migration/agent/{h2,postgresql}                    （静态检查）
```

## 7. 命令输出摘要

- 解释器单测：`Tests run: 7, Failures: 0, Errors: 0, Skipped: 0`（全绿）
- 模块全量：`Tests run: 123, Failures: 0, Errors: 0, Skipped: 0`（sw-basic-agent 100→123），BUILD SUCCESS
- 全仓库：**BUILD SUCCESS**，逐模块 surefire 汇总：common 4 / security 4 / storage 12 / notify 7 / job 37 / **agent 123** / system 65 / form 76 / bpm-engine 18 / bpm-process 39 = **385 tests，0 failures 0 errors**（362 基线 + 23 新增，验收 10）
- 静态检查：禁止范围文件 git diff 为空（`AgentGraphFactory`/`AgentGraphAutoConfiguration`/`ChatModelFactory`/`AgentToolCallbackFactory`/`AgentOrchestrationServiceImpl`/sw-bootstrap 迁移目录/pom.xml）；权限码 grep 仅既有 3 枚 + 既有 `agent:orchestration:run`/`agent:tool:*`，未新增

## 8. 与原方案的偏差

**偏差 1（如实报告，方案 §4 清单外新增 1 个测试文件修改）**：`AgentGraphDefControllerTest.java` 被修改。原因：Controller 按模块惯例（构造器注入）新增 `AgentGraphExecutionService` 依赖，Step7 既有测试的 `new AgentGraphDefController(agentGraphDefService)` 编译失败，必须同步适配其 TestConfig；且方案 §7/§9 要求的 Controller 测试（200/403 语义）没有可落位的既有文件之外的出口（新建文件清单未列 Controller 测试文件）。语义未变（8 既有用例零改动断言），仅装配适配 + 追加 4 用例。

**偏差 2（实现方式说明，非语义偏差）**：方案 §5 伪代码的解释器构造器为 `(chatModelFactory, agentToolCallbackFactory, cipher, tenantId(), maxSteps)`；实际为 `(chatModelFactory, agentToolCallbackFactory, Map<Long,AgentModelConfig> modelConfigs, cipher, tenantId, maxSteps)`——新增"执行前校验已加载的模型配置映射"。理由：§2-D-3 校验本身就要 selectById 加载 LLM 节点配置，直接传给解释器避免二次查询与校验/执行间 TOCTOU 窗口，且解释器保持纯 Java 无 DB 访问（方案 §3-1"无 Spring 依赖"的自然延伸）。方案伪代码自标注"简化示意"，执行契约（§2-B/D/E、§6）全部满足。

**偏差 3（工具回调构造路径说明，非语义偏差）**：方案 §2-A 表述"复用 AgentToolCallbackFactory 的白名单装载逻辑……按名称精确定位单个 ToolCallback"。实测 `buildInternalCallback`/`buildExternalCallback` 为 **private**，工厂仅暴露批量 `buildToolCallbacks(tenantId)`；受"工厂零改动"硬约束与"而非一次性批量注入全部"（指不注入 LLM）约束共同作用，解释器采用：白名单装载走工厂公开方法 `buildToolCallbacks(tenantId)`（查询语义与工厂完全一致：internal/external 两表 enabled=1），随后**按 `getToolDefinition().name()` 精确匹配单个**并直接调用——图拓扑决定调用哪个工具，LLM 全程不见工具列表，语义上完全等价于"按名称精确定位单个 ToolCallback"。已在解释器类注释写明与 F01 的差异。

**偏差 4（TOOL 入参/返回值 JSON 编码处理，方案未覆盖的契约细节）**：实测 FunctionToolCallback 的 `call()` 入参须为 JSON 字符串字面量（工厂回执 §3 已记录），返回值同样经 JSON 编码（`"echo:你好"` → `"\"echo:你好\""`）。解释器：入参 `JsonParser.toJson(text)` 编码后传入；返回值 `fromJson(String.class)` 解码还原为纯文本后覆盖累积文本（失败则原样保留）——图执行上下文是给下游节点/最终输出的用户可读文本，与 F01 中 LLM 直接消费编码文本的用途不同。此为方案未明示的实现裁定，已在类注释记录。

**偏差 5（测试用例数）**：方案 §7 列 ServiceImpl 6 用例 + Controller 2 用例为下限；为满足验收 5"§2-D 五项全部实现且有对应测试"，执行层补足 START 唯一/END 可达/默认边唯一 3 个校验用例与运行时 success=false 2 条路径，最终 ServiceImpl 12 + Controller 4 + 解释器 7 = 23 新增（Step7 先例同样超下限，未凑数未缩水）。

## 9. 遇到的问题

1. **FunctionToolCallback 入参 JSON 契约**（测试期暴露）：`toolNode_shouldOverwriteTextWithToolResult` 报 `IllegalState Conversion from JSON to java.lang.String failed`——工具回调 `call()` 入参必须为 JSON 字符串字面量。对照工厂测试（`cb.call("\"...\"")`）确认契约后，解释器以 `JsonParser.toJson` 编码传入（偏差 4）。
2. **FunctionToolCallback 返回值 JSON 编码**（同上用例第二次失败）：断言期望 `echo:你好` 实得 `"echo:你好"`（带引号）——返回值经 JSON 编码。以 `JsonParser.fromJson(result, String.class)` 解码还原（偏差 4）。
3. **编辑残留代码导致编译失败**：解释器 TOOL 节点一次编辑后残留旧空值检查代码块（unreachable statement），编译定位后清除（执行过程自纠，非方案问题）。
4. **用例 11 模型配置 id 不匹配**：`insertModelConfig` 生成雪花 id，而用例 11 图内硬编码 `1L`，执行前校验先拦截（报"LLM 节点引用的模型配置不存在"）。修正为使用插入返回的 id（测试自身缺陷，非生产代码问题）。
5. **Controller 构造器变更连锁**：Step7 既有 `AgentGraphDefControllerTest` 直接 `new AgentGraphDefController(...)` 编译失败——按偏差 1 适配（测试侧），生产代码未妥协（未用字段注入/重载构造器）。

## 10. 未完成内容

- **LLM 节点全链路真实模型调用验证**（方案 §9 验收 2 允许的降级边界）：执行环境无可用模型服务，LLM 节点验证采用 mock 边界方式（mock `ChatModelFactory.build` 返回桩 ChatModel，解密→构造→单跳调用→覆盖全链路在解释器内真实执行，仅网络侧 stub）——验收 2 降级验证方式，按方案 §9 声明记录。
- 并行/循环节点、多变量上下文、执行历史持久化、单步调试、正则匹配：方案 §3 明确排除，未实现（含"条件匹配子串不够用"未发生——子串匹配在全部用例中够用，未静默扩展正则）。

## 11. 风险和注意事项

- **TOOL 回调 JSON 编码契约**是本 Step 与 F01 共用的既有工具契约（工厂回执已记录），解释器的编码/解码处理有单测覆盖（用例 2/10）；若未来工具 schema 变更（如 inputType 非 String），`decodeIfJsonString` 的兜底路径（解码失败原样保留）保证不中断。
- **工具装载为即时装载**（每次 TOOL 节点执行调 `buildToolCallbacks`）：白名单配置变更即时生效（工厂文档语义），代价是多次 TOOL 节点执行多次查询——图执行单请求语义下可接受，已记录。
- **执行不落库**：无审计痕迹（方案 §3 明确本版不落库）；执行记录能力已在方案 §11 展望留后续批次。
- **`AgentToolCallbackFactory` 为可选注入**（`@Autowired(required=false)`，对齐 F01）：`sw.agent.enabled` 未开启时 TOOL 节点执行报"工具工厂未装配"转 success=false，LLM/纯路由图不受影响。
- 明文 API Key 生命周期：解释器内解密 Key 仅局部变量，finally 置 null，不进日志/异常/响应（对齐 F01 惯例）。

## 12. Git diff 摘要

- 改动文件数：7 新建 + 2 修改（1 生产 + 1 测试）
- 新增行数：约 1800（解释器 290 + ServiceImpl 300 + DTO/Service 100 + 测试 1000 + Controller 增量 40 + Controller 测试增量 130）
- 删除行数：0
- 关键变更点：`AgentGraphInterpreter`（LLM/TOOL/CONDITION 三类节点 + 步数上限 + 关键词子串匹配）→ `AgentGraphExecutionServiceImpl`（§2-D 五项执行前校验 + success=false 语义）→ `AgentGraphDefController` 追加 `POST /{id}/execute`（权限 agent:model:manage）

## 13. 建议执行的测试

- 解释器纯 Java 单测 7 用例（LLM/TOOL 覆盖、条件三分支、步数上限、顺序链路）——重点回归项
- 执行 Service 集成 12 用例（5 项执行前校验 + 运行时 2 路径 + 跨租户 + DRAFT）
- Controller execute 4 用例（200/403/400/404 语义）
- 全仓库 385 tests 0/0/0
