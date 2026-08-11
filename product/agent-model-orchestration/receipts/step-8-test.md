# 测试回执

## 1. Step 编号和名称

**M07 Step 8（后端）：图解释执行引擎第一版** — 测试回执

基线：D63 after-Step7 **362 tests**（memory/state.md）。本 Step 新增 **23** 个用例，全量 **385**。

## 2. 测试环境

- 数据库：H2 内存库（MODE=PostgreSQL，`jdbc:h2:mem:*`，每测试类独立库名：agentgraphexec 等），生产 PG 兼容（建表 DDL 与 V19/V20/V21/V25 H2 脚本逐列对齐）
- Java：JDK 17（项目构建环境），Maven 3.9.x，offline 模式（`-o`）
- 操作系统：Linux 5.15.0-181-generic
- 依赖服务：无（无 Redis/模型服务；ChatModelFactory/AgentToolCallbackFactory 为 mock，AesGcmCipher 为真实实例）

## 3. 测试前置条件

- `AgentGraphInterpreterTest`：纯 Java，无 Spring 上下文，mock `ChatModelFactory`/`AgentToolCallbackFactory` + 真实 `AesGcmCipher`（测试密钥 base64 32 字节）
- `AgentGraphExecutionServiceImplTest`：@SpringBootTest + TestConfig 组合装配（复制 Step7 模式），4 张表 DDL（sw_agent_graph_def / sw_agent_model_config / sw_agent_tool_internal / sw_agent_tool_external）@BeforeAll 建表；@Transactional 每用例回滚；登录上下文 tenant 100
- `AgentGraphDefControllerTest`：MOCK 环境 + 真实 JwtAuthenticationFilter/SecurityFilterChain/@EnableMethodSecurity；用户 1=无权限、2=仅 manage、3=superAdmin；局部 advice 处理 BaseException（Step7 偏差 B 模式）

## 4. 实际执行的测试命令

```
mvn -pl sw-basic/sw-basic-agent -am test -Dtest=AgentGraphInterpreterTest -Dsurefire.failIfNoSpecifiedTests=false -o
mvn -pl sw-basic/sw-basic-agent -am test -o
mvn test -o
```

## 5. 各测试项结果

**`AgentGraphInterpreterTest`（7 用例，全绿）**：

| 用例 | 预期 | 实际 | 通过 |
|---|---|---|---|
| llmNode_shouldOverwriteTextWithModelOutput | LLM 单跳：输出被模型回复覆盖，build 收到解密后 Key | success 且 verify 解密 Key | ✅ |
| toolNode_shouldOverwriteTextWithToolResult | TOOL 单跳：按名定位回调调用，返回解码后覆盖 | output=echo:你好 | ✅ |
| condition_shouldTakeFirstKeywordEdgeInElementsOrder | 条件命中：按 elements 顺序取第一个命中边 | 文本同含两关键词时走先出现边 | ✅ |
| condition_shouldTakeDefaultEdgeWhenNoKeywordMatches | 未命中走唯一默认边 | 默认路输出 | ✅ |
| condition_noMatchAndNoDefault_shouldThrow | 无匹配且无默认边抛 GraphExecutionException | 异常消息含"条件分支无匹配且无默认边" | ✅ |
| cycle_shouldStopAtStepLimit | 自环步数超限终止 | 异常消息含"执行步数超限" | ✅ |
| sequentialChain_shouldExecuteInOrderWithOverwrite | START→LLM→LLM→END 顺序链路 + 覆盖语义 | 第二跳收到第一跳输出 | ✅ |

**`AgentGraphExecutionServiceImplTest`（12 用例，全绿）**：

| 用例 | 预期 | 实际 | 通过 |
|---|---|---|---|
| execute_publishedLlmGraph_shouldSucceed | 已发布 LLM 图执行成功 | success=true + 输出 + latencyMs 非负 | ✅ |
| execute_draftGraph_shouldThrowParamError | DRAFT 图 PARAM_ERROR"图未发布" | code=400 | ✅ |
| execute_unknownId_shouldThrowNotFound | 不存在 id NOT_FOUND | code=404 | ✅ |
| execute_llmRefMissingModelConfig_shouldThrowParamError | LLM 引用不存在配置执行前 PARAM_ERROR | code=400 | ✅ |
| execute_toolRefMissingTool_shouldThrowParamError | TOOL 引用不存在/未启用工具 PARAM_ERROR（两路径） | code=400 | ✅ |
| execute_crossTenant_shouldThrowNotFound | 跨租户 NOT_FOUND | code=404 | ✅ |
| execute_twoStarts_shouldThrowParamError | START 不唯一 PARAM_ERROR | code=400 | ✅ |
| execute_endUnreachable_shouldThrowParamError | END 不可达 PARAM_ERROR | code=400 | ✅ |
| execute_conditionDefaultEdgesNotUnique_shouldThrowParamError | 默认边不唯一 PARAM_ERROR | code=400 | ✅ |
| execute_toolNode_shouldSucceed | TOOL 节点执行成功 | success=true + echo:你好 | ✅ |
| execute_conditionNoMatchNoDefault_shouldReturnFailure | 运行时条件无匹配无默认边 success=false | errorMessage 含原因，不上抛 | ✅ |
| execute_llmCallThrows_shouldReturnFailure | 模型调用抛异常 success=false + 摘要 | errorMessage 含 model exploded | ✅ |

**`AgentGraphDefControllerTest`（12 用例 = 既有 8 + 新增 4，全绿）**：

| 新增用例 | 预期 | 实际 | 通过 |
|---|---|---|---|
| execute_publishedGraph_shouldSucceed | manage 执行已发布 START→END 图 200+code=0+success=true+output=input | 全中 | ✅ |
| execute_withoutPermission_shouldReturn403 | 无权限 403（执行归 manage） | HTTP 403 | ✅ |
| execute_draftGraph_shouldReturnParamErrorCode | DRAFT 图 HTTP 200 + body.code=400 | code=400 | ✅ |
| execute_unknownId_shouldReturnNotFoundCode | 不存在 id HTTP 200 + body.code=404 | code=404 | ✅ |

（既有 8 用例断言零改动，全绿：分页/创建/草稿/发布/详情/列表/删除后 404/权限互不越权）

## 6. 通过项

全部 23 个新增用例 + 既有 362 个用例通过。surefire 原文摘录（新类）：

```
Tests run: 7,  Failures: 0, Errors: 0, Skipped: 0 -- AgentGraphInterpreterTest          （新建）
Tests run: 12, Failures: 0, Errors: 0, Skipped: 0 -- AgentGraphExecutionServiceImplTest （新建）
Tests run: 12, Failures: 0, Errors: 0, Skipped: 0 -- AgentGraphDefControllerTest        （8 既有 + 4 新增）
```

## 7. 失败项

无（最终构建 0 failures 0 errors）。过程中 3 次失败均为测试/代码自纠迭代（非遗留问题）：
1. `toolNode` 用例 FunctionToolCallback JSON 入参契约（→ 偏差 4，解释器 JsonParser.toJson）
2. `toolNode` 用例返回值 JSON 编码（→ 偏差 4，解码还原）
3. `execute_conditionNoMatchNoDefault` 用例图内模型配置 id 硬编码与雪花 id 不匹配（→ 用例改用插入返回 id）

## 8. 跳过项及原因

无跳过。LLM 节点真实模型调用验证按方案 §9 验收 2 允许的 mock 边界方式降级（执行环境无可用模型服务），降级方式已写入执行回执 §10。

## 9. 关键日志或错误信息

无遗留错误。过程中关键失败片段（已修复，供追溯）：

```
[ERROR] AgentGraphInterpreterTest.toolNode_shouldOverwriteTextWithToolResult:85 » IllegalState Conversion from JSON to java.lang.String failed
expected: "echo:你好"  but was: ""echo:你好""
[ERROR] com.sw.ck.common.exception.BaseException: LLM 节点引用的模型配置不存在: 1
```

## 10. 是否满足验收标准（方案 §9 全部 11 项）

| # | 验收项 | 结果 | 证据 |
|---|---|---|---|
| 1 | AgentGraphFactory/LangGraph4j 相关 4 文件零改动（git diff 空），F01 既有 362 测试零回归 | ✅ | git diff --stat 为空（4 文件 + AutoConfiguration）；既有 362 全绿（F01 编排 14 用例/工厂 6 用例/工具 6 用例无变化） |
| 2 | LLM 节点执行：解密 Key→build→单跳调用→文本覆盖，全链路真实跑通 | ✅（mock 边界降级） | 解释器用例 1/7 + ServiceImpl 用例 1：真实 AesGcmCipher 解密→mock build→桩 ChatModel 单跳→覆盖断言；真实模型网络侧受环境限制，降级说明见执行回执 §10 |
| 3 | 工具节点执行：按 toolName 精确匹配白名单→单个 ToolCallback→调用→文本覆盖 | ✅ | 解释器用例 2 + ServiceImpl 用例 10（白名单行 enabled=1 + 按名匹配回调 + echo 覆盖） |
| 4 | 条件分支：关键词命中/未命中默认边/无默认边报错，三路径全覆盖 | ✅ | 解释器用例 3/4/5 + ServiceImpl 用例 9/11 |
| 5 | 执行前校验 §2-D 五项全部实现且有对应测试 | ✅ | ServiceImpl 用例 1（PUBLISHED）/7（START 唯一）/8（END 可达）/4（LLM 配置）/5（TOOL 白名单）/9（默认边唯一） |
| 6 | 步数上限防死循环，人为构造环路图验证终止 | ✅ | 解释器用例 6（LLM 自环，maxSteps=4 超限终止） |
| 7 | 执行仅接受 PUBLISHED 图，DRAFT 图执行报错 | ✅ | ServiceImpl 用例 2 + Controller 用例 11（code=400"图未发布"） |
| 8 | 跨租户隔离（沿用 Step7 租户拦截器机制） | ✅ | ServiceImpl 用例 6（租户 200 执行租户 100 图 → NOT_FOUND，经真实 TenantLineInnerInterceptor） |
| 9 | Controller 新端点 200/403 语义 | ✅ | Controller 用例 9（200+success）/10（403）/11（400）/12（404） |
| 10 | 全量 mvn test ≥ 362，0 failures 0 errors | ✅ | **385 = 362 + 23，0/0/0**（见 §2 环境表模块汇总） |
| 11 | 禁止范围静态检查（§8 各项 git diff/grep） | ✅ | 执行回执 §7 静态检查证据（4 文件 git diff 空、V19-V25 未动、pom 未动、权限码未新增、前端零改动） |

## 11. 回归风险

- 零修改 F01 既有生产文件（AgentGraphFactory/ChatModelFactory/AgentToolCallbackFactory/AgentOrchestrationServiceImpl git diff 空），F01 79 用例零接触
- 修改面仅 2 文件：Controller（追加端点+构造器加参，既有 6 端点行为不变）与 Controller 测试（装配适配，断言零改动）
- V19-V25 无改动、无新 Flyway 版本；pom.xml 无改动
- 新测试类独立 H2 内存库（agentgraphexec 等），与其他测试类数据隔离
- 全仓库 385 tests 0 failures 0 errors（common/security/storage/notify/job/agent/system/form/bpm-engine/bpm-process 十模块全绿）

## 12. 最终结论

**PASSED**
