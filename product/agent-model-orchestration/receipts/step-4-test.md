# 测试回执

## 1. Step 编号和名称

**M07 Step 4：F04 对话交互（多轮会话持久化）** — 测试验收

## 2. 测试环境

| 项 | 值 |
|----|----|
| OS | Linux 5.15.0-181-generic |
| Java | 21.x |
| Maven | 3.9.x（仓库根 pom 管理） |
| 数据库 | H2 内存库（MODE=PostgreSQL，测试 TestConfig 内嵌 DDL 自建 V21/V22/V23 表，Step1 同款手法） |
| Spring Boot | 3.4.4 |
| LangGraph4j | 1.5.14（`langgraph4j-core`） |
| Spring AI | 1.0.4（openai + ollama starter） |
| 网络 | 无外网依赖——mock 全部使用 JDK 内置 `com.sun.net.httpserver.HttpServer`（localhost 随机端口） |

## 3. 测试前置条件

- 编码完成：22 新建 + 9 修改（见 step-4-execution.md §4）
- §5 现场验证 5 项完成（javap/grep/Flyway spike，见 step-4-execution.md §3）
- V21/V22/V23 双脚本经 Flyway 11.3.4 真实迁移链验证（V19→V23 全部 applied，见 execution 回执 §3.6）
- 测试假 Key：`sk-test-123456`（安全断言对象，非真实 Key）

## 4. 实际执行的测试命令

```bash
# 1. 编译校验门
mvn -q -pl sw-basic/sw-basic-agent,sw-bootstrap -am compile -o        # EXIT=0
# 2. 模块测试（多次迭代）
mvn -pl sw-basic/sw-basic-agent test -o                               # 66 tests 全绿
# 3. 全量测试（后台执行，见 §7）
mvn test
# 4. 基线对照实验（偶发问题定位，见 execution 回执 §7 问题 4）
git stash push → mvn -pl sw-basic/sw-basic-agent test -o（基线 57 tests 全绿）→ git stash pop
```

## 5. 各测试项结果

### 5.1 AgentSessionMapperTest（H2 集成，3 用例）

| # | 用例 | 预期 | 实际 | 通过 |
|---|------|------|------|:---:|
| 1 | `insert_thenSelectById_shouldRoundTrip` | 雪花 ID 写入后可查回；createBy/tenantId/deleted/version 由 MetaObjectHandler 填充 | 字段全部一致 | ✅ |
| 2 | `crossTenant_shouldBeInvisible` | 租户 100 的会话在租户 200 登录下 selectById 不可见（租户拦截器） | null（跨租户隔离生效） | ✅ |
| 3 | `selectList_byUserAndConfig_shouldFilter` | 按 createBy + agentModelConfigId 过滤（listConversations 同款条件）；其他用户空列表 | 过滤正确 | ✅ |

### 5.2 AgentMessageMapperTest（H2 集成，3 用例）

| # | 用例 | 预期 | 实际 | 通过 |
|---|------|------|------|:---:|
| 1 | `insert_thenSelectBySessionId_shouldOrderAndMatchRoles` | USER/ASSISTANT 两轮写入后按 msg_order 升序、角色与内容精确 | 4 行顺序 0-3，角色/内容逐项一致 | ✅ |
| 2 | `msgOrder_shouldBeMonotonic` | 第 N 轮 msg_order = 已有消息数（0-based 单调递增），回读顺序即多轮上下文顺序 | 6 行有序 | ✅ |
| 3 | `emptySession_shouldReturnEmptyList` | 空会话返回空列表（首轮无历史） | 空列表 | ✅ |

### 5.3 AgentToolCallLogMapperTest（H2 集成，2 用例）

| # | 用例 | 预期 | 实际 | 通过 |
|---|------|------|------|:---:|
| 1 | `insert_thenReadBackBigClob` | >1KB JSON 的 args/result 写入后原样读回（CLOB 字段） | 原样读回 | ✅ |
| 2 | `selectList_bySessionId_shouldFilter` | 按 sessionId 查询仅返回该会话日志 | 过滤正确 | ✅ |

### 5.4 AgentGraphFactoryTest（纯 JUnit，新增 3 用例，共 6）

| # | 用例 | 预期 | 实际 | 通过 |
|---|------|------|------|:---:|
| 4 | `invoke_withHistoryBound_shouldIncludeHistoryInPrompt` | 绑定历史后 callModel 的 Prompt instructions = 历史数 + 1，历史在前新 UserMessage 在尾部，options=null | 3 条消息，顺序/文本精确 | ✅ |
| 5 | `invoke_withoutHistoryBound_shouldFallBackToSingleMessage` | 未绑定历史（首轮）行为与 Step2/3 一致——仅 1 条 UserMessage，不 NPE | 1 条消息 + options=null | ✅ |
| 6 | `invoke_withHistoryAndTools_shouldCarryOptionsAndHistory` | 历史+工具同时绑定：options instanceof ToolCallingChatOptions 且含工具名，instructions 含历史 | 3 条消息 + 工具名匹配 | ✅ |

### 5.5 AgentToolCallbackFactoryTest（新增 1 用例，共 6）

| # | 用例 | 预期 | 实际 | 通过 |
|---|------|------|------|:---:|
| 6 | `toolCallRecord_shouldBeCapturedWhenBound` | 绑定 TOOL_CALL_RECORDS_BINDING 后调用回调，ToolCallRecord（name/args/result/latencyMs）被捕获；未绑定时调用不抛异常 | 记录捕获（args 为反序列化后纯字符串，实测）；未绑定零副作用 | ✅ |

### 5.6 AgentOrchestrationServiceImplTest（新增 5 用例，共 8）

| # | 用例 | 预期 | 实际 | 通过 |
|---|------|------|------|:---:|
| 4 | `run_withoutSessionId_shouldCreateSession` | sessionId=null 自动创建会话，resp.sessionId 非空且 DB 可查回（status=ACTIVE） | 创建成功 | ✅ |
| 5 | `run_withExistingSession_shouldReuse` | 携带已有 sessionId 不新建会话（selectCount=1），消息追加到现有会话（2 行） | 复用 + 追加正确 | ✅ |
| 6 | `run_shouldPersistUserAndAssistantMessages` | 每轮 2 行（USER/ASSISTANT），msg_order 0/1，第二轮追加 2/3（单调递增） | 4 行顺序/角色精确 | ✅ |
| 7 | `run_failure_shouldClearThreadLocals` | 模型不可达（invoke 抛异常）后直接 invoke 图：instructions=1 且 options=null（history/tools ThreadLocal 无泄漏） | 无泄漏 | ✅ |
| 8 | `run_withToolCalls_shouldPersistToolCallLog` | LLM 返回 tool_calls → 内部工具真实执行 → sw_agent_tool_call_log 1 行（args/result 非空），最终回复为第二轮回包 | 端到端全链路通过（mock server 按请求内容判定，见 execution §7 问题 3） | ✅ |

### 5.7 AgentConversationControllerTest（mock Service + 真实安全链，4 用例）

| # | 用例 | 预期 | 实际 | 通过 |
|---|------|------|------|:---:|
| 1 | `list_withoutViewPermission_shouldReturn403` | 无 agent:model:view 权限 GET /agent/conversations → 403 | 403 + code=403 | ✅ |
| 2 | `list_withViewPermission_shouldReturn200` | 有 view 权限 → 200，data 列表含 id/agentModelConfigId/status/createTime | 结构断言通过 | ✅ |
| 3 | `messages_withViewPermission_shouldReturn200InOrder` | 消息端点 200，msg_order 升序 0/1/2，role/content 正确 | 顺序断言通过 | ✅ |
| 4 | `superAdmin_shouldBypassAllPermissions` | superAdmin 绕过权限，两个端点均 200 | 200/200 | ✅ |

## 6. 各测试类用例数汇总

| 测试类 | 用例数 | 结果 |
|--------|:---:|:---:|
| ChatModelFactoryTest（既有） | 5 | 全绿 |
| AgentGraphFactoryTest（既有 3 + 新增 3） | 6 | 全绿 |
| AgentToolCallbackFactoryTest（既有 5 + 新增 1） | 6 | 全绿 |
| AgentModelControllerTest（既有） | 4 | 全绿 |
| AgentToolConfigControllerTest（既有） | 4 | 全绿 |
| AgentConversationControllerTest（新增） | 4 | 全绿 |
| AgentOrchestrationControllerTest（既有） | 3 | 全绿 |
| AgentSessionMapperTest（新增） | 3 | 全绿 |
| AgentMessageMapperTest（新增） | 3 | 全绿 |
| AgentToolCallLogMapperTest（新增） | 2 | 全绿 |
| AgentOrchestrationServiceImplTest（既有 3 + 新增 5） | 8 | 全绿 |
| AgentToolConfigServiceImplTest（既有） | 7 | 全绿 |
| AgentModelConfigServiceImplTest（既有） | 11 | 全绿 |
| **sw-basic-agent 合计** | **66** | **0 失败 0 错误**（基线 45 + 新增 21） |

## 7. 全量测试报告

**全量 `mvn test`**：`BUILD SUCCESS`，Total time 08:57 min，Finished at 2026-08-09T21:52:09+08:00
（启动 21:42:58，新鲜性边界，口径同 `m07-baseline-recount.md`，排除 `.claude/worktrees/`）。

| 模块 | 报告数 | 测试数 | 失败/错误/跳过 |
|------|:---:|:---:|:---:|
| sw-framework/sw-common | 1 | 4 | 0/0/0 |
| sw-framework/sw-security | 1 | 4 | 0/0/0 |
| sw-basic/sw-basic-storage/sw-basic-storage-biz | 1 | 12 | 0/0/0 |
| sw-basic/sw-basic-notify/sw-basic-notify-biz | 2 | 7 | 0/0/0 |
| sw-basic/sw-basic-job/sw-basic-job-biz | 15 | 37 | 0/0/0 |
| sw-basic/sw-basic-agent | **13** | **66** | 0/0/0 |
| sw-biz/sw-biz-system/sw-biz-system-biz | 11 | 65 | 0/0/0 |
| sw-biz/sw-biz-form/sw-biz-form-biz | 9 | 76 | 0/0/0 |
| sw-biz/sw-bpm/sw-bpm-engine | 7 | 18 | 0/0/0 |
| sw-biz/sw-bpm/sw-bpm-process | 16 | 39 | 0/0/0 |
| **合计** | **76** | **328** | **0/0/0** |

**全量 328 tests / 0 failures / 0 errors / 0 skipped**（Step3 基线 307 + 新增 21；
sw-basic-agent 报告 9 → 13，测试 45 → 66）。`.claude/worktrees/` 无新鲜报告（0 个），
历史陈旧报告（45 文件 203 测试）未混入统计。

## 8. 遇到的问题

1. **AgentToolConfigServiceImplTest 用例 7 回归（真实回归，已修复）**：run() 新增会话写入
   后，该测试类 TestConfig 未建 V21-V23 表 → BadSqlGrammar。修复：@BeforeAll 补三表 DDL。
2. **AgentOrchestrationServiceImplTest 用例 2-8 首次全跑失败（已修复）**：TestConfig 注册
   AgentToolCallbackFactory 后 run() 会查 sw_agent_tool_external 表（此前未建）→ 工厂查询
   BadSqlGrammar。修复：@BeforeAll 补 V20 外部表 DDL。
3. **SMALLINT/BOOLEAN 比较缺陷（根因定位并修复，见 execution 回执 §7 问题 4）**：
   全量回归两次失败（既有用例 6 一次、本 Step 端到端用例 8 一次），错误均为
   `Values of types "SMALLINT" and "BOOLEAN" are not comparable`（SQL 均为
   `WHERE ... enabled = ?`）。经用例 8 断言附带的 errorMessage 定位：Step3 既有查询
   6 处用 Boolean 参数比较 SMALLINT 列（H2 90110 偶发、PG 同报错）。已修复为数字
   字面量比较，并同步将用例 8 的 mock server 加固为按请求内容判定（含 role=tool
   消息 → 返回文本，否则返回 tool_calls），消除计数竞态。修复后模块全量 ×2 +
   组合跑 ×3 全绿。
