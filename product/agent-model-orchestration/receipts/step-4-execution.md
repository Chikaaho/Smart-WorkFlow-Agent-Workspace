# 执行回执

## 1. Step 编号和名称

**M07 Step 4：F04 对话交互（多轮会话持久化）**

- 功能：agent-model-orchestration（F04 对话交互——会话主表 + 消息明细 + 工具调用日志 + 多轮历史注入 + 持久化 + 两个只读查询端点）
- 方案文件：`product/agent-model-orchestration/ready/step-4-f04-conversation.md`（§1-§14 全部 14 节，唯一权威任务定义）
- 任务来源：执行层任务指令（先 §5 现场验证 → V21/V22/V23 SQL → Entity/Mapper → POJO → 工厂改造 → ServiceImpl 改造 → DTO → 查询端点 → 全量测试 → 回执）
- 前置调研：`search_fallback/m07-f04-conversation-precedent.md`（jar 级/行号级证据）
- 上一步回执：`product/agent-model-orchestration/receipts/step-3-execution.md` + `step-3-test.md`（回执格式与验收惯例参照）
- 测试基线口径：`search_fallback/m07-baseline-recount.md`（Step3 后基线 307 tests，主树新鲜报告口径，排除 .claude/worktrees/ 陈旧报告）
- **执行时间**：2026-08-09（§5 现场验证 19:55-20:00；编码 20:00-20:40；模块测试 20:40-20:44；全量测试 20:44 启动）
- **改动文件清单（实际）**：新建 22 个（6 SQL + 12 生产 + 4 测试）+ 修改 9 个（5 生产 + 4 测试）+ 本回执

## 2. 使用模型

- 执行模型：deepseek-v4-flash（本会话实际执行；方案推荐 v4-pro，执行层按用户成本优化选择 flash）
- 现场验证 §5 五项全部真实执行（javap / grep / 文件读取 / Flyway 直连 spike），无一项以训练记忆补填

## 3. 现场验证结果（方案 §5 五项，全部真实执行）

### §3.1 V1：`Prompt` 构造函数（`org.springframework.ai.chat.prompt.Prompt`）

解压 `~/.m2/repository/org/springframework/ai/spring-ai-model/1.0.4/spring-ai-model-1.0.4.jar`
后 `javap -p` 原始输出（构造器部分）：

```
public class org.springframework.ai.chat.prompt.Prompt implements org.springframework.ai.model.ModelRequest<java.util.List<org.springframework.ai.chat.messages.Message>> {
  public org.springframework.ai.chat.prompt.Prompt(java.lang.String);
  public org.springframework.ai.chat.prompt.Prompt(org.springframework.ai.chat.messages.Message);
  public org.springframework.ai.chat.prompt.Prompt(java.util.List<org.springframework.ai.chat.messages.Message>);
  public org.springframework.ai.chat.prompt.Prompt(org.springframework.ai.chat.messages.Message...);
  public org.springframework.ai.chat.prompt.Prompt(java.lang.String, org.springframework.ai.chat.prompt.ChatOptions);
  public org.springframework.ai.chat.prompt.Prompt(org.springframework.ai.chat.messages.Message, org.springframework.ai.chat.prompt.ChatOptions);
  public org.springframework.ai.chat.prompt.Prompt(java.util.List<org.springframework.ai.chat.messages.Message>, org.springframework.ai.chat.prompt.ChatOptions);
  ...
  public java.util.List<org.springframework.ai.chat.messages.Message> getInstructions();
  public org.springframework.ai.chat.prompt.ChatOptions getOptions();
```

**实测结论（与方案 §4.A 伪代码一致，无出入）**：`Prompt(List<Message>)`（第 3 个构造器）
与 `Prompt(List<Message>, ChatOptions)`（第 7 个构造器）均存在——callModel 节点按方案
直接使用 `new Prompt(messages)` / `new Prompt(messages, options)`。`getInstructions()` /
`getOptions()` 为测试断言提供读取路径。

### §3.2 V2：`UserMessage` / `AssistantMessage` 构造函数（`org.springframework.ai.chat.messages` 包）

同 jar `javap -p` 原始输出（构造器部分）：

```
public class org.springframework.ai.chat.messages.UserMessage extends ... {
  public org.springframework.ai.chat.messages.UserMessage(java.lang.String);
  public org.springframework.ai.chat.messages.UserMessage(org.springframework.core.io.Resource);
  ...
}
public class org.springframework.ai.chat.messages.AssistantMessage extends ... {
  public org.springframework.ai.chat.messages.AssistantMessage(java.lang.String);
  public org.springframework.ai.chat.messages.AssistantMessage(java.lang.String, java.util.Map<java.lang.String, java.lang.Object>);
  public org.springframework.ai.chat.messages.AssistantMessage(java.lang.String, java.util.Map<java.lang.String, java.lang.Object>, java.util.List<org.springframework.ai.chat.messages.AssistantMessage$ToolCall>);
  ...
}
```

**实测结论**：`UserMessage(String)` 与 `AssistantMessage(String)` 均为 public 构造器——
历史消息转换（USER→UserMessage、ASSISTANT→AssistantMessage）直接用单参构造即可。

### §3.3 V3：agent 模块 MyBatis 注解先例检查

```
$ grep -rn "@Select\|@Insert\|@Update\|@Delete" sw-basic-agent/src/main/java/ --include="*.java"
（仅命中 Controller 的 Spring @DeleteMapping，无任何 MyBatis 注解）
$ grep -rln "@Select(" --include="*.java" . | grep -v .claude | grep -v target
sw-bootstrap/src/main/java/com/sw/ck/bootstrap/verify/VerifyMapper.java   ← 仅 bootstrap 自用验证 Mapper
$ find . -name "*.xml" -path "*mapper*" | grep -v .claude | grep -v target
（空输出——全仓库零 XML mapper）
```

**实测结论（与方案 V3 预案的偏差，如实记录）**：agent 模块（及除 bootstrap VerifyMapper
外的全仓库业务模块）无 MyBatis `@Select`/`@Insert` 注解先例，且全仓库零 XML mapper
（无 mapper-locations 基础设施）。按方案预案"若无注解先例则改用 XML mapper"需新建
XML 基础设施，反而违背模块惯例（`BaseServiceImpl` Javadoc 明确：简单 CRUD 直接
`lambdaQuery()` 链式调用，不手写 SQL）。**实际采用**：三个 Mapper 保持空接口
`extends BaseMapper`，会话/消息/日志查询在 Service 层用 MyBatis-Plus Wrappers 链式
构造（租户拦截器对 Wrappers 生成的 SQL 自动追加 tenant_id，与模块全部查询同路径）。
`selectBySessionId` 语义（按 session_id + msg_order ASC）由 Service 层
`loadHistoryMessages` 实现（AgentOrchestrationServiceImpl L214-219）。

### §3.4 V4：`FunctionToolCallback` builder lambda 类型

`AgentToolCallbackFactory.java` 行号证据：

```
128:        return FunctionToolCallback.builder(config.getName(), (String jsonArgs) -> {
169:        return FunctionToolCallback.builder(config.getName(), (String jsonArgs) -> {
```

**实测结论**：两个调用点 lambda 均为 `String → String`（`I=String, O=String`），与 Step3
回执 §3.4 spike（`builder("test", (String s)->s).inputType(String.class)` 可构造）一致。
Step4 lambda 包装保持同签名：内部工具包装 `invokeInternal(...)`，外部工具包装
`restClient...retrieve().body(String.class)`，均返回 String。

### §3.5 V5：`SparseStateSerializer.read()` 与 historyMessages ThreadLocal

读取 `AgentGraphFactory.java` 的 SparseStateSerializer（改造前后均只序列化
input/output，read 只从 `CHAT_MODEL_BINDING` 重新挂载 chatModel）：

```
static class SparseStateSerializer extends StateSerializer<AgentState> {
    @Override
    public void write(AgentState object, ObjectOutput out) {
        out.writeObject(object.value("input").orElse(""));
        out.writeObject(object.value("output").orElse(""));
    }
    @Override
    public AgentState read(ObjectInput in) ... {
        data.put("input", ...); data.put("output", ...);
        ChatModel bound = CHAT_MODEL_BINDING.get();
        if (bound != null) { data.put("chatModel", bound); }
        return stateOf(data);
    }
}
```

**实测结论**：`read()` 只恢复 input/output/chatModel，**不触碰也不清空任何 ThreadLocal**
（与 TOOL_CALLBACKS_BINDING 同款：工具不进 state，read 不回填）——historyMessages 的
bind/clear 生命周期完全由 ServiceImpl finally 管理，read 不会覆盖或清除它。零改动。

### §3.6 补充验证：Flyway 真实迁移链（V19→V23）

用 flyway-core 11.3.4 直连 H2（MODE=PostgreSQL，baseline-on-migrate + validate-on-migrate
对齐 application.yml 配置）对 `db/migration/agent/h2/` 全量执行：

```
Successfully validated 5 migrations
Migrating schema "PUBLIC" to version "19 - init agent model config"
Migrating schema "PUBLIC" to version "20 - init agent tool config"
Migrating schema "PUBLIC" to version "21 - init agent session"
Migrating schema "PUBLIC" to version "22 - init agent message"
Migrating schema "PUBLIC" to version "23 - init agent tool call log"
Successfully applied 5 migrations to schema "PUBLIC", now at version v23
tables: SW_AGENT_MESSAGE SW_AGENT_MODEL_CONFIG SW_AGENT_SESSION SW_AGENT_TOOL_CALL_LOG
        SW_AGENT_TOOL_EXTERNAL SW_AGENT_TOOL_INTERNAL flyway_schema_history
```

另用 H2 直连（SqlCheck spike）对 h2 + postgresql 各 3 个新脚本逐语句执行 + 三表插入
冒烟，全部 OK（PG 版 COMMENT ON 被 H2 PG 模式接受，同 Step3 §4.1 结论）。

## 4. 实际修改的文件

**新建（22 个 = 6 SQL + 12 生产 + 4 测试）**（另：`AgentToolConfigServiceImpl.java` 的 4 处
enabled 条件为 §7 问题 4 的缺陷修复，属修改清单内追加项）：

| # | 文件 | 说明 |
|---|------|------|
| 1-3 | `sw-bootstrap/.../db/migration/agent/h2/V21__init_agent_session.sql` / `V22__init_agent_message.sql` / `V23__init_agent_tool_call_log.sql` | §7.2-7.4：会话主表 / 消息明细 / 工具调用日志（H2=CLOB） |
| 4-6 | `sw-bootstrap/.../db/migration/agent/postgresql/` 同三文件 | 同构（TEXT + COMMENT ON，参照 V19/V20 PG 风格） |
| 7 | `sw-basic-agent/.../entity/AgentSession.java` | entity（@TableName + BaseEntity，风格对齐 AgentModelConfig） |
| 8 | `sw-basic-agent/.../entity/AgentMessage.java` | entity（role/content/msgOrder） |
| 9 | `sw-basic-agent/.../entity/AgentToolCallLog.java` | entity（toolName/args/result/latencyMs） |
| 10-12 | `sw-basic-agent/.../mapper/AgentSessionMapper.java` / `AgentMessageMapper.java` / `AgentToolCallLogMapper.java` | 空接口 extends BaseMapper（V3 结论：查询走 Wrappers） |
| 13 | `sw-basic-agent/.../orchestration/ToolCallRecord.java` | 轻量 POJO（toolName/args/result/latencyMs，不入库，ThreadLocal 载体） |
| 14 | `sw-basic-agent/.../service/AgentConversationService.java` | 接口（listConversations / listMessages） |
| 15 | `sw-basic-agent/.../service/impl/AgentConversationServiceImpl.java` | 实现（当前用户 + 租户拦截器隔离；消息查询先校验会话存在） |
| 16 | `sw-basic-agent/.../controller/AgentConversationController.java` | `GET /agent/conversations` + `GET /agent/conversations/{sessionId}/messages`，权限码 `agent:model:view` |
| 17-18 | `sw-basic-agent/.../dto/AgentConversationDTO.java` / `AgentConversationMessageDTO.java` | 只读端点响应结构（方案 §10.1 所需，§6 清单之外的补足，同 Step3 补 DTO 先例） |
| 19-22 | 测试 ×4：`AgentSessionMapperTest`(3) / `AgentMessageMapperTest`(3) / `AgentToolCallLogMapperTest`(2) / `AgentConversationControllerTest`(4) | H2 集成 + mock Service 权限链 |

**修改（9 个）**：

| 文件 | 修改点 |
|------|--------|
| `orchestration/AgentGraphFactory.java` | +`HISTORY_MESSAGES_BINDING`（private ThreadLocal）+`TOOL_CALL_RECORDS_BINDING`（package-private，供同包工厂写入）+ 6 个 bind/clear/get 静态方法；callModel 节点：读历史 → messages 列表（历史 + 新 UserMessage）→ `new Prompt(messages[, options])`；SparseStateSerializer 零改动 |
| `orchestration/AgentToolCallbackFactory.java` | 内部/外部工具 lambda 包装为计时版本（start→invoke→recordToolCall）；新增 `invokeInternal`（原 try/catch 逻辑内聚）+ `recordToolCall`（TOOL_CALL_RECORDS_BINDING null 安全）；enabled 查询条件 Boolean 参数 → 数字字面量 1（§7 问题 4 类型缺陷修复） |
| `service/impl/AgentToolConfigServiceImpl.java` | 分页 + listEnabled 共 4 处 enabled 查询条件 Boolean 参数 → 数字字面量（§7 问题 4 类型缺陷修复，零行为变化） |
| `service/impl/AgentOrchestrationServiceImpl.java` | +3 个 mapper 字段注入（@Autowired，保留 4 参直构）；run()：session load-or-create → 历史加载 → bind 2 个新 ThreadLocal → invoke → 成功路径持久化 USER/ASSISTANT 消息 + 工具日志 + resp.sessionId；finally 清 4 个 ThreadLocal；catch 顶部新增 `BaseException` rethrow（会话不存在保持 404 语义） |
| `dto/AgentOrchestrationRunReqDTO.java` | +`sessionId`（Long，nullable = 新建会话） |
| `dto/AgentOrchestrationRunRespDTO.java` | +`sessionId`（Long，成功时返回本次会话） |
| `test/.../AgentGraphFactoryTest.java` | +3 用例（带历史/无历史回退/历史+工具） |
| `test/.../AgentToolCallbackFactoryTest.java` | +1 用例（记录捕获 + 未绑定兼容） |
| `test/.../AgentOrchestrationServiceImplTest.java` | +5 用例（创建会话/复用会话/消息持久化/ThreadLocal 清理/端到端 tool_calls 落库）+ @BeforeAll 补 V20-V23 表 DDL + TestConfig 注册 AgentToolCallbackFactory + EchoToolBean |
| `test/.../AgentToolConfigServiceImplTest.java` | 用例 7 端到端 run() 现需写会话表：@BeforeAll 补 V21-V23 表 DDL（仅测试基建，逻辑零改动） |

**新建文件数与方案 §6 的差异（如实汇报）**：方案 §6 清单为 16 个新文件（6 SQL + 3
Entity + 3 Mapper + 1 POJO + 3 Service/Controller）；实际 +2 个响应 DTO（AgentConversationDTO /
AgentConversationMessageDTO，方案 §10.1 明确定义了响应结构，直接返回 entity 会暴露
tenantId/deleted/version 等内部字段）+ 4 个测试文件。未触碰清单外任何生产文件（仅读取）。

## 5. 每个文件的修改摘要

- **V21/V22/V23 双脚本**：严格按方案 §7 表规格；H2=CLOB / PG=TEXT（V19/V20 惯例）；
  `create_time TIMESTAMP NOT NULL` 无默认值（Java 层 MetaObjectHandler 赋值）；
  `status VARCHAR(20) DEFAULT 'ACTIVE'`（对齐 sw_bpm_instance）；索引
  `idx_sw_agent_session_user/cfg`、`idx_sw_agent_msg_session`、`idx_sw_agent_tcl_session`。
- **Entity ×3**：`@Data @EqualsAndHashCode(callSuper=true) @TableName` + BaseEntity（id 雪花
  ASSIGN_ID + 审计字段 + tenantId + 逻辑删除 + 乐观锁自动处理），与 AgentModelConfig 同款风格。
- **Mapper ×3**：空接口 extends BaseMapper（V3 结论，见 §3.3）。
- **AgentGraphFactory**：两个新 ThreadLocal 与 chatModel/tools 完全对称（bind 前置 +
  finally clear）；`TOOL_CALL_RECORDS_BINDING` 为 package-private（仅同包
  AgentToolCallbackFactory 在 lambda 包装点写入）；callModel 在历史为空/null 时
  messages 仅含新 UserMessage——与 Step2/3 的 `new Prompt(input)` 语义等价
  （Prompt(String) 内部即 new Prompt(UserMessage(input))），向后兼容；
  无工具时 options=null 不变（Step3 泄漏断言依赖点）。
- **AgentToolCallbackFactory**：lambda 包装仅记录**成功**调用（工具抛异常时异常经
  Spring AI ToolExecutionExceptionProcessor 回喂 LLM，不落日志）；未绑定记录载体时
  跳过（Step3 测试路径零影响）；args 为 arguments（JSON 字符串字面量）反序列化后的
  纯字符串（实测，见 §3.2/回执 §7 问题 2）。
- **AgentOrchestrationServiceImpl**：session 创建在 `chatModelFactory.build` 之后
  （配置非法不落脏数据）；sessionId 非 null 时 selectById 校验（租户拦截器隔离，
  跨租户/不存在 → BaseException NOT_FOUND 上抛，catch 中 rethrow 保持 404 语义不吞为
  success=false）；msg_order = 已有消息数（0-based）；持久化仅成功路径
  （失败不写 USER 行，避免无 ASSISTANT 的残缺对话）；resp.sessionId 仅成功时设置；
  持久化非事务（方案 §4.C 时序同款，HTTP 调用不占事务连接）。
- **AgentConversationService(+Impl)**：listConversations 按 `create_by = 当前用户
  （字符串比较，VARCHAR(64) 列）+ agentModelConfigId 可选过滤 + create_time DESC`；
  无登录态返回空列表（不泄漏）；listMessages 先 selectById 校验会话存在
  （404 语义）再按 msg_order ASC 查询。
- **AgentConversationController**：`@PreAuthorize("@ss.hasPermi('agent:model:view')")`
  只读端点复用 model view 权限码（方案 §10.1），R\<T\> 包装。

## 6. 实际执行的命令

```bash
# §5 现场验证（只读 + /tmp spike）
unzip -o spring-ai-model-1.0.4.jar 中的 Prompt/UserMessage/AssistantMessage.class → javap -p
grep -rn "@Select|@Insert|@Update|@Delete" sw-basic-agent/src/main/java
grep -rln "@Select(" / grep XML mapper 全仓库普查
grep -n "FunctionToolCallback.builder" AgentToolCallbackFactory.java   # V4 行号证据
（V5 直接读取 AgentGraphFactory.java SparseStateSerializer）
javac+java /tmp/sqlcheck/SqlCheck.java    # 6 个 V21-V23 脚本 H2 MODE=PostgreSQL 逐语句执行 + 插入冒烟
javac+java /tmp/flywaycheck/FlywayCheck.java  # flyway-core 11.3.4 真实迁移 V19→V23
# 编码期校验门
mvn -q -pl sw-basic/sw-basic-agent,sw-bootstrap -am compile -o        # EXIT=0
mvn -pl sw-basic/sw-basic-agent test -o                               # 66 tests 全绿（含新增 21）
git stash / stash pop + 基线对照实验（SMALLINT/BOOLEAN 偶发问题定位，见 §7）
# 全量验收
mvn test    # 启动时刻 2026-08-09 20:44:33（后台），详见 §8
# 禁止范围核查
grep ChatClient/Advisor/Memory / String.format / System.out 等（见 §7）
```

## 7. 禁止范围核查（方案 §12，grep 证据）

| # | 禁止项 | 核查命令 | 结果 |
|---|--------|---------|------|
| 1 | 零 ChatClient / MessageChatMemoryAdvisor / ChatMemoryRepository | `grep -rn "ChatClient\|MessageChatMemoryAdvisor\|ChatMemoryRepository\|ChatMemory" .../main/java \| wc -l` | **0**（历史消息走 ThreadLocal 注入，不经 Advisor 路径） |
| 2 | 图拓扑不变 | `grep -n "Channels.base\|addNode\|addEdge" AgentGraphFactory.java` | channels 仍 input/output/chatModel 3 个；节点仍 START→callModel→END（零 ToolNode/条件边） |
| 3 | V19/V20 零改动 | `git diff --stat HEAD -- sw-bootstrap/.../db/migration/` | **空**（仅新增 V21-V23 文件） |
| 4 | 零 String.format / System.out.println 调试残留 | `grep -rn "String.format\|System.out.println" .../main/java \| wc -l` | **0** |
| 5 | 明文 API Key 不进日志/异常/响应 | summarizeError 只取 cause 链 message（沿用 Step3）；明文 Key 仅局部变量、finally 置 null | ✅（Step3 同款惯例，安全断言测试沿用） |
| 6 | session/message 查询带租户隔离 | 全部经 MP Wrappers + 租户拦截器（同模块全部查询路径）；会话列表另显式按当前用户过滤 | ✅（AgentSessionMapperTest 用例 2 实测跨租户不可见） |
| 7 | 零 @Tool 注解 / 零自写 agentic loop / 零新增 pom 依赖 | grep + git diff pom | 与 Step3 相同口径，本 Step 未触碰 pom（零 diff） |

## 8. 全量测试报告

**全量 `mvn test`（Smart-WorkFlow/ 根目录，31 模块）**：`BUILD SUCCESS`，Total time 08:57 min，
Finished at **2026-08-09T21:52:09+08:00**（启动时刻 **21:42:58**，启动前记录——新鲜性边界）。

主树逐模块 surefire 报告（`find . -path '*/.claude*' -prune -o -type d -name "surefire-reports" -print`，
只统计启动时刻后生成的新鲜报告，口径同 `search_fallback/m07-baseline-recount.md`）：

| 模块 | 新鲜报告数 | 测试数 | 失败/错误/跳过 | 报告时间戳范围 |
|------|:---:|:---:|:---:|---|
| `sw-framework/sw-common` | 1 | 4 | 0/0/0 | 21:43:41 |
| `sw-framework/sw-security` | 1 | 4 | 0/0/0 | 21:44:01 |
| `sw-basic/sw-basic-storage/sw-basic-storage-biz` | 1 | 12 | 0/0/0 | 21:44:26 |
| `sw-basic/sw-basic-notify/sw-basic-notify-biz` | 2 | 7 | 0/0/0 | 21:44:52 ~ 21:44:54 |
| `sw-basic/sw-basic-job/sw-basic-job-biz` | 15 | 37 | 0/0/0 | 21:45:09 ~ 21:45:13 |
| `sw-basic/sw-basic-agent` | **13** | **66** | 0/0/0 | 21:45:31 ~ 21:47:29 |
| `sw-biz/sw-biz-system/sw-biz-system-biz` | 11 | 65 | 0/0/0 | 21:48:21 ~ 21:49:02 |
| `sw-biz/sw-biz-form/sw-biz-form-biz` | 9 | 76 | 0/0/0 | 21:49:27 ~ 21:50:09 |
| `sw-biz/sw-bpm/sw-bpm-engine` | 7 | 18 | 0/0/0 | 21:50:21 ~ 21:51:03 |
| `sw-biz/sw-bpm/sw-bpm-process` | 16 | 39 | 0/0/0 | 21:51:22 ~ 21:52:05 |
| **合计** | **76** | **328** | **0/0/0** | 21:43:41 ~ 21:52:05 |

**主树新鲜报告总数 = 328 tests / 0 failures / 0 errors / 0 skipped（76 报告文件）**。

- 较 Step3 基线 **307 新增 +21**（验收标准 ≥325 命中）；sw-basic-agent 报告数 9 → **13**
  （+4，对应 4 个新测试文件），测试数 45 → 66（+21：Factory 1 + ServiceImpl 5 + Mapper
  测试 8 + ConversationController 4 + GraphFactory 3）。
- 其余模块报告数与基线完全一致（common 1/security 1/storage 1/notify 2/job 15/system
  11/form 9/bpm-engine 7/bpm-process 16，与 baseline-recount 口径一致）。
- `.claude/worktrees/` 单独列示：本 Step 运行后 0 个新鲜报告（无陈旧混入，历史 45 文件
  203 测试仍为 2026-07-22 陈旧产物，未合并统计）。

## 8.1 与方案 §13 验收表 14 项逐项对照

| # | 验收项 | 结果 | 证据 |
|---|--------|:---:|------|
| 1 | V21/V22/V23 Flyway 双模式无报错 | ✅ | §3.6 Flyway 11.3.4 真实迁移链 V19→V23 全部 applied + SqlCheck 对 6 文件逐语句执行 + 插入冒烟（H2 MODE=PostgreSQL）；全量 BUILD SUCCESS 无 FlywayException |
| 2 | sessionId=null 自动创建会话并返回 | ✅ | 用例 4：resp.sessionId 非空 + DB 查回（status=ACTIVE） |
| 3 | 已有 sessionId 复用不新建 | ✅ | 用例 5：selectCount=1（不新建）+ 消息追加 2 行 |
| 4 | 每轮 2 行 USER/ASSISTANT，msg_order 单调 | ✅ | 用例 6：两轮 4 行，顺序 0-3，角色精确 |
| 5 | 有工具调用时日志落库（args/result 非空） | ✅ | 用例 8：端到端 tool_calls → 真实执行 → sw_agent_tool_call_log 1 行（args="你好"、result="echo:你好"、latencyMs≥0） |
| 6 | callModel 历史注入（instructions size > 1） | ✅ | GraphFactoryTest 用例 4：3 条消息（2 历史 + 1 新 UserMessage），顺序精确 |
| 7 | 无历史时回退 Step2/3 行为 | ✅ | GraphFactoryTest 用例 5：instructions=1 + options=null，不 NPE |
| 8 | invoke 异常后 ThreadLocal 全清 | ✅ | 用例 7：模型不可达后直接 invoke 图，instructions=1 + options=null（history/tools 无泄漏） |
| 9 | GET /agent/conversations 200 + 结构 | ✅ | AgentConversationControllerTest 用例 2 |
| 10 | GET /{id}/messages 200 + msg_order ASC | ✅ | AgentConversationControllerTest 用例 3 |
| 11 | 跨租户隔离 | ✅ | AgentSessionMapperTest 用例 2：租户 200 查不到租户 100 的会话（拦截器）；会话列表另按当前用户过滤 |
| 12 | 权限码 agent:model:view 未授权 403 | ✅ | AgentConversationControllerTest 用例 1（403 + code=403） |
| 13 | §5 现场验证五项全部呈现 | ✅ | 本回执 §3.1-§3.5 全部含 javap/grep 原始输出；§3.6 另附 Flyway spike |
| 14 | 全量 ≥325 tests 0 failures | ✅ | **328 / 0/0/0**（76 报告，§8 表） |

## 9. 遇到的问题

1. **AgentToolConfigServiceImplTest 用例 7 回归（真实回归，已修复）**：run() 新增会话
   写入后，该测试类 TestConfig 未建 V21-V23 表 → BadSqlGrammar → success=false。
   修复：@BeforeAll 补三表 DDL（仅测试基建）。修复后全绿。
2. **断言修正（lambda 入参形态实测）**：初版断言 `record.getArgs()` 应为 JSON 字符串
   字面量 `"hello"`，实测 FunctionToolCallback 传给 lambda 的是**反序列化后的纯字符串**
   `hello`（与 Step3 回执 §3.4 `call("\"hello\"") → echo:hello` 输出吻合，echo 后无引号）。
   修正两处断言（工厂测试 + 端到端 tool_calls 测试），代码逻辑不变。
3. **AgentOrchestrationServiceImplTest 用例 2-8 首次全跑失败（已修复）**：TestConfig 注册
   AgentToolCallbackFactory 后，run() 会查 sw_agent_tool_external 表——该测试类此前未建
   该表 → 工厂查询 BadSqlGrammar → success=false。修复：@BeforeAll 补 V20 外部表 DDL。
4. **SMALLINT/BOOLEAN 比较缺陷（既有 Step3 代码的真实类型问题，已定位并修复）**：
   全量回归两次失败（AgentToolConfigServiceImplTest 用例 6 一次、本 Step 端到端用例 8
   一次），错误均为 `Values of types "SMALLINT" and "BOOLEAN" are not comparable`
   （SQL 均为 `WHERE ... enabled = ?`）。经断言附带的 errorMessage 定位根因：Step3
   既有查询（AgentToolCallbackFactory.buildToolCallbacks + AgentToolConfigServiceImpl
   分页/listEnabled，共 6 处）用 `.eq(enabled, true)` 绑定 **Boolean 参数**与 V20 表
   SMALLINT 列比较——H2 下不稳定（90110，跨连接语句缓存导致偶发），PG 下同样报
   `operator does not exist: smallint = boolean`（生产隐患）。**修复**：6 处查询条件
   统一改为数字字面量 `1`/`0`（与表 DEFAULT 1 语义一致，零行为变化）。修复后模块
   全量 ×2 + 组合跑 ×3 均全绿。git stash 基线对照期间该问题未出现属概率性未触发，
   非"环境偶发"。
5. **方案 §9.1 `@Resource` 与实现的差异（如实记录）**：仓库零 `javax/jakarta.annotation`
   使用先例且无显式依赖声明，改用 `@Autowired` 字段注入（与既有
   `agentToolCallbackFactory` 字段同款，按类型注入三个 mapper 无歧义，语义等价）。
6. **方案 §9.3 伪代码 `AgentToolCallbackFactory.getToolCallRecordsThreadLocal()` 与
   §8.1 定义不一致**：按 §8.1（定义章节）将 TOOL_CALL_RECORDS_BINDING 置于
   AgentGraphFactory，ServiceImpl 经新增 public `getToolCallRecords()` 读取。
7. **V3 无注解先例的落地偏差（记录于 §3.3）**：未引入 XML mapper（仓库零 XML
   基础设施），按模块惯例用 MP Wrappers 实现 selectBySessionId 语义。

## 10. 未完成内容

无。方案 §13 验收表 14 项全部满足（逐项证据见 §8.1 回填）。

## 11. 风险和注意事项

1. **args 落库形态**：sw_agent_tool_call_log.tool_call_args 存的是 arguments 反序列化
   后的纯字符串（实测），若需原始 JSON 字符串字面量须在 lambda 内记录原始入参——
   当前形态便于人类阅读与调试，后续有需要可调整。
2. **持久化非事务**：user 消息、assistant 消息、工具日志三条写入非事务（方案 §4.C
   同款），极端情况下（写入中途 DB 故障）可能产生部分行；HTTP 调用不占事务连接的
   收益优先。回执 §5 已注明。
3. **失败路径不落消息**：invoke 失败时仅可能残留空会话（session 行），不写残缺
   USER 消息；空会话可在后续迭代由清理任务处理（方案 §3 已排除会话管理）。
4. **ThreadLocal 绑定契约扩展**：编排执行现依赖 chatModel + tools + historyMessages +
   toolCallRecords 四个绑定，AgentGraphFactory Javadoc 说明 bind/clear 必须成对
   （ServiceImpl finally 保证 4 个全清）。
5. **会话列表按 create_by 过滤**：create_by 为 VARCHAR(64)（V19/V20 惯例），查询按
   字符串比较；与 MetaObjectHandler 填充的 Long userId 一致（测试已验证）。

## 12. Git diff 摘要

- 新建 22 文件（6 SQL + 12 生产 + 4 测试），修改 9 文件（5 生产 + 4 测试）
- 关键变更：V21/V22/V23 双脚本（三表）；会话/消息/工具日志 Entity+Mapper；
  AgentGraphFactory 双 ThreadLocal + callModel 多轮消息构造；工具 lambda 计时包装；
  编排 ServiceImpl 会话生命周期 + 持久化；两个只读查询端点（权限码 agent:model:view）
- 零新增依赖、零图拓扑改动、零 ChatClient/Advisor、零 V19/V20 改动、未 commit/push
