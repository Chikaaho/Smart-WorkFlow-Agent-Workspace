# 探索任务：M07-Step5「多Key轮询/额度限流」前置调研

**当前模型**：anthropic/claude-sonnet-5，可承担角色：规划模型（仅规划，不探索代码）

**任务目标**：Step1-4 已 PASSED（详见 `memory/state.md`），M07-F01「大模型管理」剩余最后一项 PRD 明细——**多Key轮询/额度限流**：当前 `sw_agent_model_config` 每行是单条模型+单个 Key 的配置，`AgentOrchestrationServiceImpl.run()` 按单一 `agentModelConfigId` 加载、解密、构造 `ChatModel` 后直接调用（Step2 落地，Step3/4 声明未改动该文件核心逻辑，但 Step4 在其中插入了 session 创建）。本 Step 目标：允许为同一逻辑模型配置多个候选 Key（含各自优先级），当高优先级 Key 遇到额度超限/限流时，自动按优先级切换到下一个可用 Key。

规划层需要在起草 Step5 执行方案前摸清：①表结构和 `ChatModelFactory`/`AgentOrchestrationServiceImpl` 的**当前真实状态**（不采信历史回执声称，因为 Step3/Step4 均可能有未在回执中显式提及的细节改动）；②Spring AI/Spring 生态对"限流/429"是否有可区分的异常类型，用于判断"这是额度超限该切 Key，还是普通网络错误该直接失败"；③仓库是否已有"优先级排序字段"或"临时锁定至某时间点字段"或"多行记录归为一个逻辑分组"的命名先例，供本 Step 的表结构设计遵循仓库惯例而非凭空发明。

---

**需要回答的问题**：

### 问题 1：`sw_agent_model_config` 当前真实完整表结构

文件路径：
- `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/h2/V19__init_agent_model_config.sql`
- `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/postgresql/V19__init_agent_model_config.sql`

- 完整贴出两个脚本当前内容（不是方案原文，是磁盘上现存的真实文件内容）。
- Step3 执行回执提到"修复既有 SMALLINT/BOOLEAN 比较缺陷（`.eq(enabled, true)` 改为数字字面量 1）"——请确认这个修复改动的是哪个文件（`AgentModelConfigServiceImpl.java` 的查询条件代码，还是 V19 建表脚本本身），V19 脚本是否被这次修复触碰过。
- 现场执行 `find Smart-WorkFlow/ -path '*/.claude/worktrees/*' -prune -o -path '*/db/migration/*' -name 'V*.sql' -print | sort -V | tail -8`，确认当前全仓库 Flyway 最大版本号（须排除 `.claude/worktrees/` 陈旧内容，参照 D57 先例教训）。

### 问题 2：`AgentModelConfig` 实体当前真实完整字段清单

文件路径：`Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/entity/AgentModelConfig.java`

- 完整贴出当前文件源码。
- 是否存在任何"优先级"（priority/order/sort/seq）、"分组"（group/tag/pool）、"锁定至"（lockedUntil/disabledUntil/quotaResetAt）语义的字段？若无，明确标注"当前无此类字段"。

### 问题 3：`ChatModelFactory.java` 当前真实完整源码

文件路径：`Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/ChatModelFactory.java`

- 完整贴出当前文件源码（Step2 落地后，Step3 执行回执提到"外部工具超时……参照 ChatModelFactory.buildRestClientBuilder 模式"，需确认该方法当前的访问修饰符（private/package-private/public），以及 Step3 是否真的复用了这个方法本身，还是仅仅复制了同款写法到别的类）。
- `build(AgentModelConfig config, String plainApiKey)` 方法签名是否仍是当前唯一入口？是否有任何重载或调用方以外的其他消费点（`grep -rn "chatModelFactory\." Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/`）？

### 问题 4：`AgentOrchestrationServiceImpl.java` 当前真实完整源码

文件路径：`Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentOrchestrationServiceImpl.java`

- 完整贴出当前文件源码（Step4 执行回执提到"session 创建在 `chatModelFactory.build` 之后（配置非法不落脏数据）"，需要确认 `run()`/`invoke` 相关方法的当前完整方法体，尤其是：①单条 `mapper.selectById(agentModelConfigId)` 加载配置的代码位置；②`chatModel.call()`/`agentCompiledGraph.invoke()` 抛出的异常当前如何被捕获转换为 `success=false`（Step2 回执提到 `summarizeError()` 沿 cause 链取最深层非空 message）——请贴出 `summarizeError` 或等价异常处理方法的完整实现，本 Step 需要在这个位置插入"识别限流异常→重试下一个 Key"逻辑，必须基于真实代码结构设计，不能凑造）。
- 当前请求入参 DTO（`AgentOrchestrationRunReqDTO`）字段清单是否仍是 `agentModelConfigId + input` 两个字段（贴出当前文件源码确认）。

### 问题 5：Spring AI / Spring 生态对"限流/429/额度超限"的异常类型支持

jar 路径：
- `~/.m2/repository/org/springframework/ai/spring-ai-retry/1.0.4/spring-ai-retry-1.0.4.jar`（若路径不确切，先 `find ~/.m2/repository/org/springframework/ai -iname "*retry*"` 定位）
- `~/.m2/repository/org/springframework/spring-web/*/spring-web-*.jar`（`HttpClientErrorException` 所在 jar，用 `find ~/.m2/repository/org/springframework/spring-web -name "*.jar" | head -1` 定位具体版本目录）

- `org.springframework.ai.retry` 包下完整类清单（`jar tf` + grep "retry\|Retry\|Transient"）；若存在 `TransientAiException`/`NonTransientAiException`（或类似命名），用 `javap -p` 给出完整构造函数签名——是否携带 HTTP 状态码或原始响应体字段？
- `org.springframework.web.client.HttpClientErrorException` 是否有 `TooManyRequests` 静态内部类（javap 检查该类的嵌套类清单）；若存在，其构造函数/`getStatusCode()`/`getResponseBodyAsString()` 等方法签名（javap -p）。
- Step2 已确认 `OpenAiApi.Builder`/`OllamaApi.Builder` 均支持 `restClientBuilder(RestClient.Builder)`（用于超时设置）——`RestClient` 默认的错误处理器（`DefaultResponseErrorHandler`）遇到 HTTP 429 响应时，实测/javap 确认它是否会抛出 `HttpClientErrorException.TooManyRequests`（4xx 客户端错误统一抛 `HttpClientErrorException` 子类，还是仅抛通用父类，需具体确认 429 是否有专属子类）。
- 若上述均无法从 jar 直接确认异常类型区分度，明确标注"需在 `ChatModelFactory`/`ServiceImpl` 层手动检查 HTTP 状态码 == 429 判断限流"这一备选路径是否可行（即 `RestClient` 抛出的异常对象上能否取到状态码，哪个方法名）。

### 问题 6：仓库现有"优先级排序字段"命名先例

搜索范围：`find Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration -name "V*.sql" | xargs grep -ilE "priority|sort_order|sort_num|seq_no|order_num" 2>/dev/null`

- 列出所有命中文件，贴出对应列名 + 类型定义（如 `sys_menu` 是否有排序字段，叫什么名字，是否为 `INT`/`SMALLINT`）。
- 若无任何命中，明确标注"仓库无优先级/排序字段命名先例，需规划层自定命名"。

### 问题 7：仓库现有"临时锁定至某时间点"字段命名先例

搜索范围：
- `find Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration -name "V*.sql" | xargs grep -ilE "lock|disabled_until|expire|quota" 2>/dev/null`
- `sw-framework/sw-security` 模块下是否有登录失败锁定（账号锁定/lockout）相关代码或表结构（`grep -rln "lockout\|lockUntil\|失败次数\|锁定" Smart-WorkFlow/sw-framework/sw-security/ 2>/dev/null`）

- 若命中，贴出具体字段名/类型/相关代码逻辑摘要。
- 若无命中，明确标注"仓库无临时锁定字段先例，需规划层自定命名"。

### 问题 8：仓库现有"多行记录归为一个逻辑分组/候选池"设计先例

搜索范围：`find Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration -name "V*.sql" | xargs grep -ilE "group_key|group_code|pool_key|pool_code" 2>/dev/null`，以及规划层记忆中是否有相关记录（本项由 DeepSeek 自行判断是否需要额外查看 `knowledge/` 下的模块设计说明，若查看请注明依据文件）。

- 若命中，贴出字段名/类型/用途说明。
- 若无命中，明确标注"仓库无分组/候选池字段先例"。

---

**搜索范围**：
- `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/{h2,postgresql}/V19__init_agent_model_config.sql`
- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/entity/AgentModelConfig.java`
- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/ChatModelFactory.java`
- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentOrchestrationServiceImpl.java`
- `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/AgentOrchestrationRunReqDTO.java`
- `find Smart-WorkFlow/ -path '*/.claude/worktrees/*' -prune -o -path '*/db/migration/*' -name 'V*.sql' -print`（全仓库 Flyway 版本号现场确认，须排除陈旧 worktree）
- `~/.m2/repository/org/springframework/ai/spring-ai-retry/`（或现场 find 定位的实际路径）
- `~/.m2/repository/org/springframework/spring-web/`（`HttpClientErrorException` 所在 jar，现场 find 定位版本）
- `find Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration -name "V*.sql"`（问题 6/7/8 的关键字 grep）
- `Smart-WorkFlow/sw-framework/sw-security/`（问题 7 的账号锁定先例检查）

**禁止范围**：
- 不得修改任何文件
- 不得运行 `mvn compile`/`mvn test` 等触发编译的命令（可用 `jar tf`/`javap`/`find`/`grep`/文件读取）
- 不得对多Key轮询/额度限流的具体表结构、字段命名、`ChatModelFactory`/`ServiceImpl` 改造方式做设计建议——只汇报"当前代码真实是什么样、仓库已有什么可参照的命名先例、Spring 生态是否支持区分限流异常"，设计决策由规划层做
- 若某 jar 中确实不存在某类/方法，或仓库确实无某先例，明确标注"不存在"/"无先例"，不得以训练记忆补填

**预期证据**：
- 问题 1-4：均为文件真实现存内容的完整贴出，不得摘要替代（这几个文件是本 Step 改造的直接对象，必须是磁盘现状，不是历史方案文字）
- 问题 5：javap 原始输出片段或明确的"jar 内不存在"结论
- 问题 6-8：命中则给出文件路径+行号+字段定义原文；未命中则明确标注"无先例"

**完成标准**：8 个问题均有明确答案或明确标注"未找到/不存在/无先例"（含具体原因），证据可追溯到具体文件路径+行号或 jar 类名。

**执行模型**：`deepseek/deepseek-v4-pro`（涉及异常类型的语义判断——需要理解"限流该重试切Key"和"其他错误该直接失败"这两类异常在 Spring 生态里如何区分，属语义判断类调研；同时涉及对 4 个现有 Java 源文件的完整、准确摘录，长上下文一次性读取多个真实源码文件，用 pro 保证摘录准确不遗漏方法体细节）

**失败处理**：若 Spring AI/Spring Web 层确实没有专属的"429/限流"异常类型（问题 5 全部落空），如实说明，并明确回答"是否至少能从异常对象上拿到原始 HTTP 状态码"这个备选判断路径是否可行——这直接决定 Step5 方案是走"捕获专属异常类型"还是"手动检查状态码"。若问题 6-8 三项先例全部为空，如实标注，规划层将据此在方案中自定命名规则，不算调研失败。

**回执位置**：`search_fallback/m07-step5-multikey-quota-precedent.md`
