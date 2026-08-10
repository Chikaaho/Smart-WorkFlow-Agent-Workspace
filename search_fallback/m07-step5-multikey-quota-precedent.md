# 探索回执：M07-Step5「多Key轮询/额度限流」前置调研

**执行模型**：deepseek-v4-flash（本会话实际执行，4 个并行只读 subagent 分域调研后汇总）
**执行日期**：2026-08-10
**任务来源**：`search_task/m07-step5-multikey-quota-precedent.md`
**只读确认**：本任务未修改/创建/删除仓库内任何文件；未运行任何 mvn 命令；仅使用 `jar tf`、`javap`、`find`、`grep`、`git log/show`、文件读取。唯一写入为本回执文件。
**任务状态**：✅ 8 问均有明确答案（含"无先例/不存在"的明确标注与具体原因），证据全部为本次实际探查的磁盘文件全文、javap 原始输出、git 提交证据，无训练记忆补填。
**关键发现摘要**：
- V19 脚本与 AgentModelConfigServiceImpl 均**未被** SMALLINT/BOOLEAN 修复触碰——该修复真实落点是提交 `74fc415` 的 **2 个 AgentTool Java 文件共 6 处** `.eq(enabled, true)` → 数字字面量（历史回执表述张冠李戴，详见 §1.2）。
- 全仓库 Flyway 最大版本号为 **V23**（`agent/{h2,postgresql}/V23__init_agent_tool_call_log.sql`）；任务给定的 `tail -8` 命令输出有字母序解读陷阱（详见 §1.3）。
- `ChatModelFactory.build(AgentModelConfig, String)` 仍是唯一公开入口、无重载；main 代码唯一消费点 `AgentOrchestrationServiceImpl.java:125`；`buildRestClientBuilder` 为 **private**（Step3 仅 javadoc `{@link}` 引用，未复用方法本身）。
- 请求入参 DTO **不再是 2 字段**：现为 `agentModelConfigId + input + sessionId` 3 字段（Step4 新增 sessionId）。
- Spring Web 6.2.5 对标准 `HttpStatus` 枚举的 429 **会抛 `HttpClientErrorException.TooManyRequests` 专属子类**（经 `create()` 工厂 tableswitch，case 10）；Spring AI 的 `TransientAiException`/`NonTransientAiException` **不携带任何状态码/响应体字段**，且其默认错误处理器把 4xx(含 429) 归为 NonTransient（不重试）。
- 仓库命名先例：排序字段唯一先例为裸名 **`sort` (INTEGER NOT NULL DEFAULT 0)**（sys_menu 等 5 表）；时间点字段先例为 `expire_time`（sys_tenant）/`expires_at`（sys_refresh_token）；**无**优先级/锁定/分组/候选池字段先例（问题 6/7/8 中 priority、group_、pool_、lock 类命名全部落空）。

---

## 问题 1：`sw_agent_model_config` 当前真实完整表结构

### 1.1 两个 V19 脚本磁盘现状全文

**文件 1**：`Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/h2/V19__init_agent_model_config.sql`（全文 29 行）：

```sql
-- ===================================================================
-- Smart-WorkFlow :: V19: 初始化大模型接入配置表 (H2)
-- M07-F01 大模型管理：API Key 以 AesGcmCipher 密文（CLOB）落库
-- ===================================================================
CREATE TABLE sw_agent_model_config (
    id              BIGINT NOT NULL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    protocol_type   VARCHAR(32) NOT NULL,
    base_url        VARCHAR(500) NOT NULL,
    model_name      VARCHAR(100) NOT NULL,
    api_key_cipher  CLOB,
    temperature     DECIMAL(4,2),
    max_tokens      INT,
    top_p           DECIMAL(4,2),
    timeout_seconds INT NOT NULL DEFAULT 30,
    retry_count     INT NOT NULL DEFAULT 0,
    enabled         SMALLINT NOT NULL DEFAULT 1,
    remark          VARCHAR(500),
    create_time     TIMESTAMP,
    create_by       VARCHAR(64),
    update_time     TIMESTAMP,
    update_by       VARCHAR(64),
    deleted         SMALLINT NOT NULL DEFAULT 0,
    tenant_id       BIGINT NOT NULL DEFAULT 0,
    version         BIGINT NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX uk_sw_agent_model_name ON sw_agent_model_config (tenant_id, name);
CREATE INDEX idx_sw_agent_model_tenant_deleted ON sw_agent_model_config (tenant_id, deleted);
```

**文件 2**：`Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/postgresql/V19__init_agent_model_config.sql`（全文 33 行）：

```sql
-- ===================================================================
-- Smart-WorkFlow :: V19: 初始化大模型接入配置表 (PostgreSQL)
-- M07-F01 大模型管理：API Key 以 AesGcmCipher 密文（TEXT）落库
-- ===================================================================
CREATE TABLE sw_agent_model_config (
    id              BIGINT NOT NULL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    protocol_type   VARCHAR(32) NOT NULL,
    base_url        VARCHAR(500) NOT NULL,
    model_name      VARCHAR(100) NOT NULL,
    api_key_cipher  TEXT,
    temperature     DECIMAL(4,2),
    max_tokens      INT,
    top_p           DECIMAL(4,2),
    timeout_seconds INT NOT NULL DEFAULT 30,
    retry_count     INT NOT NULL DEFAULT 0,
    enabled         SMALLINT NOT NULL DEFAULT 1,
    remark          VARCHAR(500),
    create_time     TIMESTAMP,
    create_by       VARCHAR(64),
    update_time     TIMESTAMP,
    update_by       VARCHAR(64),
    deleted         SMALLINT NOT NULL DEFAULT 0,
    tenant_id       BIGINT NOT NULL DEFAULT 0,
    version         BIGINT NOT NULL DEFAULT 0
);

CREATE UNIQUE INDEX uk_sw_agent_model_name ON sw_agent_model_config (tenant_id, name);
CREATE INDEX idx_sw_agent_model_tenant_deleted ON sw_agent_model_config (tenant_id, deleted);

COMMENT ON TABLE sw_agent_model_config IS 'M07 大模型接入配置';
COMMENT ON COLUMN sw_agent_model_config.protocol_type IS '协议类型：openai/ollama/other';
COMMENT ON COLUMN sw_agent_model_config.api_key_cipher IS 'API Key 密文（AesGcmCipher）';
```

两脚本差异仅为：`api_key_cipher` 列 H2 用 `CLOB`、PG 用 `TEXT`，且 PG 版多 3 条 `COMMENT ON` 语句。**列集合完全一致，共 20 列**（id/name/protocol_type/base_url/model_name/api_key_cipher/temperature/max_tokens/top_p/timeout_seconds/retry_count/enabled/remark/create_time/create_by/update_time/update_by/deleted/tenant_id/version）。另验证：src 与 `target/classes` 下的两份 V19 副本逐字节一致（diff 实证）。

### 1.2 「SMALLINT/BOOLEAN 比较缺陷修复」的真实改动位置

**结论先行：该修复与 `AgentModelConfigServiceImpl.java` 无关，也完全未触碰任何 V19 脚本；它只改动了 2 个 AgentTool 相关 Java 文件，共 6 处 `.eq(enabled, ...)`。**

**(a) AgentModelConfigServiceImpl.java 现状：不存在任何 enabled 查询条件。**
文件：`Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentModelConfigServiceImpl.java`（253 行）。对 `enabled` 的 grep 实证仅有 2 处纯赋值：第 230 行 `entity.setEnabled(req.getEnabled());`（toEntity）、第 247 行 `dto.setEnabled(entity.getEnabled());`（toDTO）。**该文件内不存在任何 `.eq(enabled, true)` 或 `.eq(enabled, 1)` 形式的查询条件**；全仓 grep 确认 enabled 等值查询只出现在 AgentTool 系文件。

**(b) 修复的真实落点：提交 `74fc415`（develop HEAD，M07 Step4），2 个 Java 文件共 6 处。**
`git show 74fc415` 提交说明原文含：`修复 Step3 遗留缺陷：6 处 .eq(enabled, true) Boolean 参数比 SMALLINT 列改为数字字面量（PG 必炸）`；`--stat` 改动文件清单中 **不存在 `AgentModelConfigServiceImpl.java`，不存在任何 `db/migration/.../V19` 脚本**。实际 diff（关键 hunk）：

- `AgentToolCallbackFactory.java`（2 处）：`internalMapper.selectList(...)` 与 `externalMapper.selectList(...)` 中 `.eq(AgentToolInternalConfig::getEnabled, true)` / `.eq(AgentToolExternalConfig::getEnabled, true)` → `.eq(..., 1)`，新增注释说明 H2 实测 90110 "SMALLINT and BOOLEAN are not comparable"、PG "operator does not exist: smallint = boolean"。
- `AgentToolConfigServiceImpl.java`（4 处）：`listEnabledInternalTools`/`listEnabledExternalTools` 两处 `.eq(..., true)` → `.eq(..., 1)`；分页查询两处 `wrapper.eq(query.getEnabled() != null, ..., query.getEnabled())` → `Boolean.TRUE.equals(query.getEnabled()) ? 1 : 0`。

当前磁盘态 6 处全部为数字字面量：`AgentToolCallbackFactory.java` 第 90、95 行；`AgentToolConfigServiceImpl.java` 第 65-66、115、130-131、181 行。

pickaxe 佐证：`.eq(AgentToolInternalConfig::getEnabled, true)` 出现于 76c685c/8d89cc1，移除于 74fc415/bb6e6c9（后两者为同内容重放提交）；主线上仅 74fc415 在 develop 首行历史。

**(c) 两个 V19 脚本的 git 历史**：`git log --oneline -- <V19路径>` 两文件输出完全一致，仅 `76c685c feat(agent): M07 agent-model-orchestration Step1-3` —— 即 V19 脚本只有创建提交，**没有任何后续提交**，与 Step1-3 创建时一致。`AgentModelConfigServiceImpl.java` 的 git log 同样只有 76c685c。

**结论**：历史回执将修复表述关联到大模型配置路径是张冠李戴——该缺陷及修复全部位于**工具配置（AgentTool）路径**；大模型配置（AgentModel）模块从未写过 enabled 等值查询，本 Step 的多Key/限流改造不受此先例约束，但注意：若 Step5 在 AgentModel 路径新增 enabled 查询，应沿用仓库已实证的「数字字面量 1」写法而非 Boolean 参数。

### 1.3 全仓库 Flyway 最大版本号

任务命令逐字执行输出（`find Smart-WorkFlow/ -path '*/.claude/worktrees/*' -prune -o -path '*/db/migration/*' -name 'V*.sql' -print | sort -V | tail -8`）：

```
Smart-WorkFlow/sw-bootstrap/target/classes/db/migration/postgresql/V6__m_seam_menu_seed.sql
Smart-WorkFlow/sw-bootstrap/target/classes/db/migration/postgresql/V10__add_dict_menu.sql
Smart-WorkFlow/sw-bootstrap/target/classes/db/migration/postgresql/V11__fix_system_menu_to_directory.sql
Smart-WorkFlow/sw-bootstrap/target/classes/db/migration/postgresql/V13__logical_delete_unique_constraints.sql
Smart-WorkFlow/sw-bootstrap/target/classes/db/migration/postgresql/V15__system_mgmt_menu.sql
Smart-WorkFlow/sw-bootstrap/target/classes/db/migration/postgresql/V18__init_refresh_token_table.sql
Smart-WorkFlow/sw-bootstrap/target/classes/db/migration/storage/h2/V16__init_storage_file.sql
Smart-WorkFlow/sw-bootstrap/target/classes/db/migration/storage/postgresql/V16__init_storage_file.sql
```

**⚠️ 解读陷阱**：`sort -V` 按完整路径字符串排序，`db/migration/agent/...`（字母 'a'）恒排在 `postgresql`（'p'）/`storage`（'s'）之前，故 tail 只显示 postgresql/storage 目录条目，**尾行不等于最大版本**。真实最大版本号以文件名版本为准：

- src 权威迁移（排除 target/classes 与 worktrees）各目录文件：`agent/h2` 与 `agent/postgresql` 下各有 `V19__init_agent_model_config.sql`、`V20__init_agent_tool_config.sql`、`V21__init_agent_session.sql`、`V22__init_agent_message.sql`、`V23__init_agent_tool_call_log.sql`（ls 实证）；`postgresql` 目录最高 V18；`storage` 目录最高 V16。
- 全仓（含 target/classes 副本，排除 worktrees）文件名排序最大值同为 **V23__init_agent_tool_call_log.sql**。
- 被排除的 `.claude/worktrees/` 下含 72 个 V*.sql（最大 V18，陈旧快照，排除正确）。

**结论：全仓库 Flyway 最大版本号为 V23**，位于 `sw-bootstrap/src/main/resources/db/migration/agent/{h2,postgresql}/V23__init_agent_tool_call_log.sql`。

---

## 问题 2：`AgentModelConfig` 实体当前真实完整字段清单

文件：`Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/entity/AgentModelConfig.java`（全文 56 行）：

```java
package com.sw.ck.agent.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.sw.ck.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

/**
 * 大模型接入配置（M07-F01）。
 * <p>
 * 继承 {@link BaseEntity}（含 id/tenantId/createTime/createBy/updateTime/updateBy/deleted/version）。
 * API Key 仅以密文（AesGcmCipher 加密结果）落库，{@code apiKeyCipher} 由 {@code @JsonIgnore}
 * 屏蔽，禁止直接序列化输出（对外统一走 {@code AgentModelConfigDTO.apiKeyMasked}）。
 * </p>
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sw_agent_model_config")
public class AgentModelConfig extends BaseEntity {

    /** 显示名称，租户内唯一（uk_sw_agent_model_name (tenant_id, name)） */
    private String name;

    /** 协议类型：openai / ollama / other（varchar + String，仓库惯例，不建 enum 类） */
    private String protocolType;

    /** 模型服务地址 */
    private String baseUrl;

    /** 模型标识（如 gpt-4o / llama3） */
    private String modelName;

    /** API Key 密文（AesGcmCipher 加密结果，Base64），Ollama 等无需鉴权场景可为 null */
    @JsonIgnore
    private String apiKeyCipher;

    private BigDecimal temperature;

    private Integer maxTokens;

    private BigDecimal topP;

    /** 请求超时（秒），默认 30 */
    private Integer timeoutSeconds;

    /** 重试次数，默认 0 */
    private Integer retryCount;

    /** 1=启用 0=停用 */
    private Boolean enabled;

    private String remark;
}
```

**继承链字段核查**（排除父类含相关语义字段的可能）：
- `BaseEntity`（`sw-framework/sw-common/src/main/java/com/sw/ck/common/entity/BaseEntity.java`，20 行）：仅追加 `private Long tenantId;`（@TableField fill=INSERT）。
- `BaseEntityNoTenant`（同目录，46 行）：`id`（ASSIGN_ID）、`createTime`、`createBy`、`updateTime`、`updateBy`、`deleted`（@TableLogic）、`version`（@Version 乐观锁）。

**明确结论：当前无此类字段。** 实体（含继承链全部字段）不存在任何：
- "优先级"语义字段：`priority` / `order` / `sort` / `seq` —— **不存在**；
- "分组"语义字段：`group` / `tag` / `pool` —— **不存在**（表上仅有 `name` 租户内唯一、`protocol_type` 协议类型，无分组概念）；
- "锁定至"语义字段：`lockedUntil` / `disabledUntil` / `quotaResetAt` —— **不存在**。

唯一与状态相关的字段为 `enabled`（Boolean，1=启用 0=停用），且无任何时限属性。实体自有字段 13 个 + 继承 8 个，与 V19 表 20 列一一对应。

---

## 问题 3：`ChatModelFactory.java` 当前真实完整源码

文件：`Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/ChatModelFactory.java`（全文 132 行）：

```java
package com.sw.ck.agent.orchestration;

import com.sw.ck.agent.entity.AgentModelConfig;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.ollama.OllamaChatModel;
import org.springframework.ai.ollama.api.OllamaApi;
import org.springframework.ai.ollama.api.OllamaOptions;
import org.springframework.ai.openai.OpenAiChatModel;
import org.springframework.ai.openai.OpenAiChatOptions;
import org.springframework.ai.openai.api.OpenAiApi;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.retry.support.RetryTemplate;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.Set;

/**
 * 动态模型客户端工厂（M07 Step2 "动态装载"）。
 * <p>
 * 给定一条 {@link AgentModelConfig}，按 {@code protocolType} 分支构造对应 Spring AI
 * {@link ChatModel}，并把 {@code temperature}/{@code maxTokens}/{@code topP}/
 * {@code timeoutSeconds}/{@code retryCount} 真实传入构造（Step1 仅落库存储，本类首次
 * 使其生效）。
 * </p>
 * <p>
 * 非 {@code @Component}：由 {@code AgentGraphAutoConfiguration} 手动 {@code new} 后注册
 * 为 Bean。协议白名单固定 2 分支（openai/ollama），非法协议显式抛
 * {@link IllegalArgumentException}，不允许静默返回 null（方案 §10 约束 1）。
 * </p>
 * <p>
 * <b>明文 API Key 生命周期</b>：{@code plainApiKey} 仅用于本次构造（放入
 * {@code OpenAiApi.Builder}），不落任何字段、不打日志；无 Key（如本地无鉴权网关）时
 * {@code OpenAiApi.Builder.build()} 会断言 apiKey 非 null（实测），传空串满足构造，
 * 请求头退化为 {@code "Bearer "}。
 * </p>
 */
public class ChatModelFactory {

    /** 协议白名单（固定 2 分支，非可插拔注册表，理由见方案 §9.1） */
    private static final Set<String> SUPPORTED_PROTOCOLS = Set.of("openai", "ollama");

    /** timeoutSeconds 未配置时的默认值（秒），与 V19 表结构 DEFAULT 30 一致 */
    private static final int DEFAULT_TIMEOUT_SECONDS = 30;

    /**
     * 按配置构造模型客户端。
     *
     * @param config      大模型接入配置（Step1 产物，只读）
     * @param plainApiKey 解密后的明文 API Key，可为 null/空（无鉴权场景）
     * @throws IllegalArgumentException 协议类型不在白名单内
     */
    public ChatModel build(AgentModelConfig config, String plainApiKey) {
        String protocol = config.getProtocolType();
        if (protocol == null || !SUPPORTED_PROTOCOLS.contains(protocol)) {
            throw new IllegalArgumentException("不支持的协议类型，无法构造模型客户端: " + protocol);
        }
        return switch (protocol) {
            case "openai" -> buildOpenAi(config, plainApiKey);
            case "ollama" -> buildOllama(config);
            // 防御性分支：SUPPORTED_PROTOCOLS 已兜底，理论不可达（方案 §9.1 要求第三个分支必须存在）
            default -> throw new IllegalStateException("不应到达: " + protocol);
        };
    }

    private ChatModel buildOpenAi(AgentModelConfig config, String plainApiKey) {
        OpenAiApi.Builder apiBuilder = OpenAiApi.builder()
                .baseUrl(config.getBaseUrl())
                .restClientBuilder(buildRestClientBuilder(config));
        // OpenAiApi.Builder.build() 断言 apiKey 非 null（实测）；明文 Key 非空才传，空则传空串满足构造
        apiBuilder.apiKey(plainApiKey != null && !plainApiKey.isEmpty() ? plainApiKey : "");
        OpenAiChatOptions options = OpenAiChatOptions.builder()
                .model(config.getModelName())
                .temperature(toDouble(config.getTemperature()))
                .maxTokens(config.getMaxTokens())
                .topP(toDouble(config.getTopP()))
                .build();
        return OpenAiChatModel.builder()
                .openAiApi(apiBuilder.build())
                .defaultOptions(options)
                .retryTemplate(buildRetryTemplate(config.getRetryCount()))
                .build();
    }

    private ChatModel buildOllama(AgentModelConfig config) {
        OllamaApi.Builder apiBuilder = OllamaApi.builder()
                .baseUrl(config.getBaseUrl())
                .restClientBuilder(buildRestClientBuilder(config));
        OllamaOptions options = OllamaOptions.builder()
                .model(config.getModelName())
                .temperature(toDouble(config.getTemperature()))
                .topP(toDouble(config.getTopP()))
                // Ollama 无 maxTokens 字段（实测 OllamaOptions.Builder 无 maxTokens setter），
                // 对应字段为 numPredict（方案 §9.1 推测与实际 API 的偏差）
                .numPredict(config.getMaxTokens())
                .build();
        return OllamaChatModel.builder()
                .ollamaApi(apiBuilder.build())
                .defaultOptions(options)
                .retryTemplate(buildRetryTemplate(config.getRetryCount()))
                .build();
    }

    /**
     * timeoutSeconds 真实生效：通过 {@code RestClient.Builder} 注入
     * {@link SimpleClientHttpRequestFactory} 的 connect/read 超时（实测对
     * OpenAiApi/OllamaApi 均生效）。
     */
    private RestClient.Builder buildRestClientBuilder(AgentModelConfig config) {
        int timeoutSeconds = config.getTimeoutSeconds() == null
                ? DEFAULT_TIMEOUT_SECONDS
                : Math.max(1, config.getTimeoutSeconds());
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(Duration.ofSeconds(timeoutSeconds));
        requestFactory.setReadTimeout(Duration.ofSeconds(timeoutSeconds));
        return RestClient.builder().requestFactory(requestFactory);
    }

    /**
     * 重试策略：attempts = max(0, retryCount) + 1（retryCount=2 → 最多 3 次尝试）。
     */
    private RetryTemplate buildRetryTemplate(Integer retryCount) {
        int attempts = (retryCount == null ? 0 : Math.max(0, retryCount)) + 1;
        return RetryTemplate.builder().maxAttempts(attempts).build();
    }

    /** BigDecimal → Double（null 时不设置，走模型提供方默认值） */
    private Double toDouble(BigDecimal value) {
        return value == null ? null : value.doubleValue();
    }
}
```

**回答子问题**：

- **`buildRestClientBuilder` 访问修饰符：`private`**（定义于第 110 行）。全仓库 grep 仅 2 处调用（文件内第 70、89 行）与 1 处 javadoc 引用：`AgentToolCallbackFactory.java:148` 为 `{@link ChatModelFactory#buildRestClientBuilder}`（仅 javadoc 链接，不产生可调用路径）。**Step3 并没有复用该方法本身，只是复制了同款写法**（`AgentToolExternalConfig.java:36` 另有注释"参照 ChatModelFactory 模式从 DB 读"）。
- **`build(AgentModelConfig config, String plainApiKey)` 为 `public`，是类中唯一公开入口，无重载**（其余方法均为 private）。
- **main 代码唯一消费点**：`AgentOrchestrationServiceImpl.java:125` 的 `ChatModel chatModel = chatModelFactory.build(entity, plainApiKey);`。注册方式：`AgentGraphAutoConfiguration.java:37-38` `@Bean` + `new ChatModelFactory()`（非 @Component，与 javadoc 一致）；`AgentOrchestrationServiceImpl` 经构造器注入字段 `chatModelFactory`（第 57、92 行）。无静态方法、无反射调用、无子类化。
- 测试代码均为 `new ChatModelFactory()` 直构（ChatModelFactoryTest 5 处、AgentOrchestrationControllerTest:417、AgentToolConfigServiceImplTest:733、AgentOrchestrationServiceImplTest:730）。

---

## 问题 4：`AgentOrchestrationServiceImpl.java` 当前真实完整源码

文件：`Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentOrchestrationServiceImpl.java`（全文 283 行，未截断）：

```java
package com.sw.ck.agent.service.impl;

import com.baomidou.mybatisplus.core.toolkit.Wrappers;
import com.sw.ck.agent.dto.AgentOrchestrationRunReqDTO;
import com.sw.ck.agent.dto.AgentOrchestrationRunRespDTO;
import com.sw.ck.agent.entity.AgentMessage;
import com.sw.ck.agent.entity.AgentModelConfig;
import com.sw.ck.agent.entity.AgentSession;
import com.sw.ck.agent.entity.AgentToolCallLog;
import com.sw.ck.agent.mapper.AgentMessageMapper;
import com.sw.ck.agent.mapper.AgentModelConfigMapper;
import com.sw.ck.agent.mapper.AgentSessionMapper;
import com.sw.ck.agent.mapper.AgentToolCallLogMapper;
import com.sw.ck.agent.orchestration.AgentGraphFactory;
import com.sw.ck.agent.orchestration.AgentToolCallbackFactory;
import com.sw.ck.agent.orchestration.ChatModelFactory;
import com.sw.ck.agent.orchestration.ToolCallRecord;
import com.sw.ck.agent.service.AgentOrchestrationService;
import com.sw.ck.common.crypto.AesGcmCipher;
import com.sw.ck.common.exception.BaseException;
import com.sw.ck.common.exception.CommonErrorCode;
import org.bsc.langgraph4j.CompiledGraph;
import org.bsc.langgraph4j.state.AgentState;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.Message;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.ai.chat.model.ChatModel;
import org.springframework.ai.tool.ToolCallback;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * 编排执行引擎 Service 实现（M07 Step2）。
 * <p>
 * <b>明文 API Key 生命周期最短化（方案 §10 约束 2）</b>：解密出的明文 Key 仅存在于
 * 局部变量，用于当次 {@code ChatModelFactory.build}，不进日志、不进异常消息、不进
 * 响应 DTO 任何字段，方法结束前置 null 释放引用（延续 Step1 同款惯例）。
 * </p>
 * <p>
 * <b>异常处理双保险（依据 langgraph4j 1.5.14 实测）</b>：节点动作抛异常时
 * {@code CompiledGraph.invoke()} 以 {@code CompletionException}（CompletableFuture.join
 * 包装）原样抛出、不会返回空 Optional；为稳妥同时兜底"invoke 返回空 Optional /
 * 状态缺 output"两种情况，均转 {@code success=false}。模型服务不可达/超时等经
 * Spring AI RetryTemplate 重试耗尽后抛出，同样转 {@code success=false}，不抛 500。
 * </p>
 */
@Service
public class AgentOrchestrationServiceImpl implements AgentOrchestrationService {

    private final AgentModelConfigMapper mapper;
    private final AesGcmCipher cipher;
    private final ChatModelFactory chatModelFactory;
    private final CompiledGraph<AgentState> agentCompiledGraph;

    /**
     * M07 Step3 工具沙箱工厂（可选注入）。{@code required = false}：保留 Step2 的
     * 4 参直构路径（既有测试直接 new，不注入工厂时行为与 Step2 完全一致——不加载
     * 工具、不绑定、不清理）；生产环境由 Spring 注入（{@code sw.agent.enabled=true}
     * 时 {@code AgentToolCallbackFactory} 为 Bean）。
     */
    @Autowired(required = false)
    private AgentToolCallbackFactory agentToolCallbackFactory;

    /** M07 Step4 F04 会话主表 Mapper（字段注入：保留 4 参直构路径，既有测试不受影响） */
    @Autowired
    private AgentSessionMapper sessionMapper;

    /** M07 Step4 F04 会话消息明细 Mapper */
    @Autowired
    private AgentMessageMapper messageMapper;

    /** M07 Step4 F04 工具调用日志 Mapper */
    @Autowired
    private AgentToolCallLogMapper toolCallLogMapper;

    /** 会话状态常量：ACTIVE（方案 §3：状态写死，会话永久有效） */
    private static final String SESSION_STATUS_ACTIVE = "ACTIVE";

    /** 消息角色：USER（用户输入） */
    private static final String ROLE_USER = "USER";

    /** 消息角色：ASSISTANT（模型最终回复） */
    private static final String ROLE_ASSISTANT = "ASSISTANT";

    public AgentOrchestrationServiceImpl(AgentModelConfigMapper mapper,
                                         AesGcmCipher cipher,
                                         ChatModelFactory chatModelFactory,
                                         CompiledGraph<AgentState> agentCompiledGraph) {
        this.mapper = mapper;
        this.cipher = cipher;
        this.chatModelFactory = chatModelFactory;
        this.agentCompiledGraph = agentCompiledGraph;
    }

    @Override
    public AgentOrchestrationRunRespDTO run(AgentOrchestrationRunReqDTO req) {
        // 参数校验（DTO 层无 bean-validation：模块类路径无 jakarta.validation-api，
        // 沿用 Step1 Service 层手动校验惯例）
        if (req == null || req.getAgentModelConfigId() == null) {
            throw new BaseException(CommonErrorCode.PARAM_ERROR, "agentModelConfigId 不能为空");
        }
        if (req.getInput() == null || req.getInput().isBlank()) {
            throw new BaseException(CommonErrorCode.PARAM_ERROR, "input 不能为空");
        }
        // baseMapper.selectById 经租户拦截器自动过滤 tenant_id（Step1 同款）；不存在 → 404 语义
        AgentModelConfig entity = mapper.selectById(req.getAgentModelConfigId());
        if (entity == null) {
            throw new BaseException(CommonErrorCode.NOT_FOUND);
        }

        // 解密明文 Key：仅用于本次构造 ChatModel，用完置 null 释放引用
        String plainApiKey = null;
        if (entity.getApiKeyCipher() != null && !entity.getApiKeyCipher().isEmpty()) {
            plainApiKey = cipher.decrypt(entity.getApiKeyCipher());
        }

        long start = System.currentTimeMillis();
        AgentOrchestrationRunRespDTO resp = new AgentOrchestrationRunRespDTO();
        try {
            ChatModel chatModel = chatModelFactory.build(entity, plainApiKey);
            // M07 Step4 F04：会话获取/创建 + 历史消息加载（在 chatModel 构造之后：
            // 配置非法时 ChatModelFactory 抛 IllegalArgumentException，不落会话脏数据）
            Long sessionId = req.getSessionId();
            List<AgentMessage> dbMessages;
            if (sessionId == null) {
                AgentSession session = new AgentSession();
                session.setAgentModelConfigId(req.getAgentModelConfigId());
                session.setStatus(SESSION_STATUS_ACTIVE);
                // id（雪花 ASSIGN_ID）/createTime/createBy/tenantId/deleted/version
                // 由 MyBatis-Plus + CommonMetaObjectHandler 填充
                sessionMapper.insert(session);
                sessionId = session.getId();
                dbMessages = List.of();
            } else {
                // selectById 经租户拦截器自动过滤 tenant_id：跨租户/已删除/不存在会话 → null → 404 语义
                AgentSession existing = sessionMapper.selectById(sessionId);
                if (existing == null) {
                    throw new BaseException(CommonErrorCode.NOT_FOUND, "会话不存在");
                }
                dbMessages = loadHistoryMessages(sessionId);
            }
            // 历史消息经 ThreadLocal 注入 callModel 节点（与 chatModel/tools 同款绑定模式）
            AgentGraphFactory.bindHistoryMessages(toSpringAiMessages(dbMessages));
            AgentGraphFactory.bindToolCallRecords(new ArrayList<>());
            // M07 Step3：加载本租户启用的工具白名单 → 绑定到图执行线程（无工具/工厂
            // 未注入时跳过，Prompt 构造与 Step2 完全一致）；租户隔离由租户拦截器自动完成
            // （buildToolCallbacks(null) 不显式过滤，同 Step2 selectById 先例）
            List<ToolCallback> tools = agentToolCallbackFactory == null
                    ? List.of()
                    : agentToolCallbackFactory.buildToolCallbacks(null);
            AgentGraphFactory.bindChatModel(chatModel);
            if (!tools.isEmpty()) {
                AgentGraphFactory.bindTools(tools);
            }
            try {
                Optional<AgentState> result = agentCompiledGraph.invoke(
                        Map.of("input", req.getInput(), "chatModel", chatModel));
                if (result.isEmpty()) {
                    // 兜底：invoke 返回空 Optional（实测正常路径不会发生）
                    resp.setSuccess(false);
                    resp.setErrorMessage("编排引擎执行未产生结果");
                } else {
                    Optional<Object> output = result.get().value("output");
                    if (output.isEmpty()) {
                        resp.setSuccess(false);
                        resp.setErrorMessage("编排引擎执行未产生输出");
                    } else {
                        String outputText = String.valueOf(output.get());
                        resp.setSuccess(true);
                        resp.setOutput(outputText);
                        // M07 Step4 F04：持久化本轮 USER + ASSISTANT 消息（msg_order =
                        // 已有消息数，0-based 单调递增）与工具调用日志，并回传会话 id
                        int nextOrder = dbMessages.size();
                        insertMessage(sessionId, ROLE_USER, req.getInput(), nextOrder);
                        insertMessage(sessionId, ROLE_ASSISTANT, outputText, nextOrder + 1);
                        persistToolCallLogs(sessionId);
                        resp.setSessionId(sessionId);
                    }
                }
            } finally {
                // bind/clear 对称：正常完成与异常完成（invoke 抛异常）均执行清除，防 ThreadLocal 泄漏
                AgentGraphFactory.clearChatModel();
                AgentGraphFactory.clearTools();
                AgentGraphFactory.clearHistoryMessages();
                AgentGraphFactory.clearToolCallRecords();
            }
        } catch (IllegalArgumentException e) {
            // 协议不支持/配置非法：ChatModelFactory 拒绝构造 → success=false（方案 §11 边界）
            resp.setSuccess(false);
            resp.setErrorMessage(summarizeError(e));
        } catch (BaseException e) {
            // 业务异常（如会话不存在）保持上抛，由全局异常处理器转 404 语义，不吞为 success=false
            throw e;
        } catch (Exception e) {
            // 模型服务不可达/超时/节点异常等：转 success=false + 异常摘要
            resp.setSuccess(false);
            resp.setErrorMessage(summarizeError(e));
        } finally {
            plainApiKey = null;
        }
        resp.setLatencyMs(System.currentTimeMillis() - start);
        return resp;
    }

    /**
     * 加载会话历史消息（按 msg_order 升序；租户隔离由租户拦截器自动完成，
     * 与模块全部查询同路径）。
     */
    private List<AgentMessage> loadHistoryMessages(Long sessionId) {
        return messageMapper.selectList(
                Wrappers.<AgentMessage>lambdaQuery()
                        .eq(AgentMessage::getSessionId, sessionId)
                        .orderByAsc(AgentMessage::getMsgOrder));
    }

    /**
     * DB 消息 → Spring AI {@link Message} 列表（USER → {@link UserMessage}，
     * ASSISTANT → {@link AssistantMessage}；其他角色留后续迭代，跳过）。
     * 入参已按 msg_order 升序，转换后顺序保持。
     */
    private List<Message> toSpringAiMessages(List<AgentMessage> dbMessages) {
        List<Message> messages = new ArrayList<>(dbMessages.size());
        for (AgentMessage db : dbMessages) {
            if (ROLE_USER.equals(db.getRole())) {
                messages.add(new UserMessage(db.getContent()));
            } else if (ROLE_ASSISTANT.equals(db.getRole())) {
                messages.add(new AssistantMessage(db.getContent()));
            }
        }
        return messages;
    }

    /** 写入一条会话消息（msg_order 由调用方计算，0-based 单调递增） */
    private void insertMessage(Long sessionId, String role, String content, int msgOrder) {
        AgentMessage msg = new AgentMessage();
        msg.setSessionId(sessionId);
        msg.setRole(role);
        msg.setContent(content);
        msg.setMsgOrder(msgOrder);
        messageMapper.insert(msg);
    }

    /** 将本轮捕获的工具调用记录批量落库（无记录时为空操作） */
    private void persistToolCallLogs(Long sessionId) {
        List<ToolCallRecord> records = AgentGraphFactory.getToolCallRecords();
        if (records == null || records.isEmpty()) {
            return;
        }
        for (ToolCallRecord record : records) {
            AgentToolCallLog log = new AgentToolCallLog();
            log.setSessionId(sessionId);
            log.setToolName(record.getToolName());
            log.setToolCallArgs(record.getArgs());
            log.setToolCallResult(record.getResult());
            log.setLatencyMs(record.getLatencyMs());
            toolCallLogMapper.insert(log);
        }
    }

    /**
     * 异常摘要：沿 cause 链取最深层非空 message（如 CompletionException →
     * ExecutionException → IllegalStateException("...") 取节点真实原因；连接拒绝取
     * ResourceAccessException 的 I/O 描述）。只取 message，不含堆栈，杜绝明文 Key
     * 通过异常信息泄漏（方案 §12 风险表）。
     */
    private String summarizeError(Throwable t) {
        Throwable cur = t;
        String best = null;
        while (cur != null) {
            if (cur.getMessage() != null && !cur.getMessage().isBlank()) {
                best = cur.getMessage();
            }
            cur = cur.getCause();
        }
        return best != null ? best : t.getClass().getSimpleName();
    }
}
```

**回答子问题**：

**a. 单条 `mapper.selectById(agentModelConfigId)` 位置**：`run()` 方法第 111-114 行，配置加载发生在参数校验之后、解密 Key 之前：

```java
        // baseMapper.selectById 经租户拦截器自动过滤 tenant_id（Step1 同款）；不存在 → 404 语义
        AgentModelConfig entity = mapper.selectById(req.getAgentModelConfigId());
        if (entity == null) {
            throw new BaseException(CommonErrorCode.NOT_FOUND);
        }
```

全文件仅此一处 `mapper.selectById`（另有 `sessionMapper.selectById(sessionId)` 第 141 行，属会话查询，非配置加载）。

**b. 模型调用异常捕获转 success=false 的完整代码段**。事实：文件中**不存在 `chatModel.call()`**——模型执行经 `agentCompiledGraph.invoke(...)`（第 161-162 行，`chatModel` 以初始状态 Map 的 `"chatModel"` 键传入图，节点内再调用）。异常处理分两层：

内层 try（第 160-191 行）——invoke 及空结果兜底，`finally` 无条件清除 ThreadLocal 绑定（clearChatModel/clearTools/clearHistoryMessages/clearToolCallRecords）；外层 catch（第 192-205 行）：

```java
        } catch (IllegalArgumentException e) {
            // 协议不支持/配置非法：ChatModelFactory 拒绝构造 → success=false（方案 §11 边界）
            resp.setSuccess(false);
            resp.setErrorMessage(summarizeError(e));
        } catch (BaseException e) {
            // 业务异常（如会话不存在）保持上抛，由全局异常处理器转 404 语义，不吞为 success=false
            throw e;
        } catch (Exception e) {
            // 模型服务不可达/超时/节点异常等：转 success=false + 异常摘要
            resp.setSuccess(false);
            resp.setErrorMessage(summarizeError(e));
        } finally {
            plainApiKey = null;
        }
```

要点：`IllegalArgumentException`（ChatModelFactory 拒绝构造）与其余 `Exception`（含 invoke 抛出的 `CompletionException` 等）均转 `success=false`；`BaseException`（如"会话不存在"）保持上抛不吞。try 块起点第 124 行，覆盖 `chatModelFactory.build` 到 invoke 全段——**本 Step 若在"识别限流异常→重试下一个 Key"需注意：当前所有非业务异常都已被吞为 success=false，限流识别逻辑必须插在 catch(Exception) 之前或之内**（仅陈述现状结构，不做设计建议）。

**c. `summarizeError()` 完整实现**（第 271-281 行）：沿 cause 链循环，**每次覆盖非空 message**（最终保留最深层非空 message），链上全无非空 message 时回退为顶层异常类简单名。只取 message 不含堆栈（明文 Key 防泄漏）。

**d. session 创建位置**：确认在 `chatModelFactory.build(entity, plainApiKey)`（第 125 行）**之后**——第 128-146 行。`sessionId == null` 时新建（`sessionMapper.insert(session)` 第 136 行，状态 ACTIVE，id 等字段由 MyBatis-Plus 雪花 + CommonMetaObjectHandler 填充）；非 null 时 `sessionMapper.selectById` 校验存在性（不存在/跨租户 → `BaseException(NOT_FOUND, "会话不存在")` 上抛）并加载历史消息。代码注释明确："会话获取/创建 + 历史消息加载（在 chatModel 构造之后：配置非法时 ChatModelFactory 抛 IllegalArgumentException，不落会话脏数据）"。

### 4.3 请求入参 DTO：**不再是 2 个字段**

文件：`Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/AgentOrchestrationRunReqDTO.java`（全文 27 行）：

```java
package com.sw.ck.agent.dto;

import lombok.Data;

/**
 * 编排执行请求 DTO（M07 Step2）。
 * <p>
 * 参数非空校验在 Service 层手动完成（模块编译类路径无 jakarta.validation-api，
 * 且 Step1 DTO 亦无 bean-validation 注解先例，沿用仓库惯例）。
 * </p>
 */
@Data
public class AgentOrchestrationRunReqDTO {

    /** 大模型接入配置 id（必填，不存在返回 404 语义） */
    private Long agentModelConfigId;

    /** 用户输入文本（必填，非空） */
    private String input;

    /**
     * 会话 id（M07 Step4 F04，nullable = 新建会话）：null 时自动创建
     * {@code sw_agent_session} 并在响应返回新会话 id；非 null 时消息追加到现有会话，
     * 会话不存在或跨租户返回 404 语义。
     */
    private Long sessionId;
}
```

**字段清单结论：现为 3 个字段**——`agentModelConfigId`(Long) + `input`(String) + **`sessionId`(Long，Step4 F04 新增，nullable = 新建会话)**。前两者必填、Service 层手动校验（第 104-109 行）；`sessionId` 可空。

---

## 问题 5：Spring AI / Spring Web 生态对"限流/429/额度超限"的异常类型支持

**jar 定位（实测）**：
- `~/.m2/repository/org/springframework/ai/spring-ai-retry/1.0.4/spring-ai-retry-1.0.4.jar`（与预期版本一致，另有 spring-ai-autoconfigure-retry 1.0.4）
- `~/.m2/repository/org/springframework/spring-web/6.2.5/spring-web-6.2.5.jar`（spring-web 为 **6.2.5**）

### 5.1 spring-ai-retry：有 Transient/NonTransient 异常，但**不携带状态码/响应体**

`jar tf` + grep 确认包内类清单：`TransientAiException`、`NonTransientAiException`、`RetryUtils`（含匿名内部类 `RetryUtils$1/$2/$3`）。

`javap -p` 原始输出：

```
public class org.springframework.ai.retry.TransientAiException extends java.lang.RuntimeException {
  public org.springframework.ai.retry.TransientAiException(java.lang.String);
  public org.springframework.ai.retry.TransientAiException(java.lang.String, java.lang.Throwable);
}
public class org.springframework.ai.retry.NonTransientAiException extends java.lang.RuntimeException {
  public org.springframework.ai.retry.NonTransientAiException(java.lang.String);
  public org.springframework.ai.retry.NonTransientAiException(java.lang.String, java.lang.Throwable);
}
```

**关键确认：构造函数不携带 HTTP 状态码，也不携带原始响应体字段**——两个异常均仅继承 RuntimeException，只有 (String) 与 (String, Throwable) 两个构造器。

**附带关键发现**——`RetryUtils$1`（默认错误处理器匿名类）`handleError` 字节码分支：

```
58: getStatusCode().is4xxClientError()
69: ifeq 81
72: new org/springframework/ai/retry/NonTransientAiException   <- 4xx(含 429) → NonTransient（不重试）
81: new org/springframework/ai/retry/TransientAiException      <- 其他(5xx) → Transient（可重试）
```

即 **Spring AI 的默认错误处理器把 4xx（包括 429）归类为 NonTransient（不重试），仅 5xx 归类为 Transient（可重试）**。`RetryUtils$2/$3` 为 `org.springframework.retry.RetryListener` 实现。

### 5.2 spring-web 6.2.5：`HttpClientErrorException.TooManyRequests` **存在**，构造器 private

`javap -p HttpClientErrorException` 外层输出未列嵌套类（javap 对外层不可见），但 `jar tf | grep "HttpClientErrorException\$"` 确认 13 个嵌套类文件齐全，含 `TooManyRequests`、`Unauthorized`、`BadRequest`、`Forbidden`、`NotFound`、`MethodNotAllowed`、`NotAcceptable`、`Conflict`、`Gone`、`UnsupportedMediaType`、`UnprocessableEntity` 等。

`javap -p` 嵌套类原始输出：

```
public final class org.springframework.web.client.HttpClientErrorException$TooManyRequests extends org.springframework.web.client.HttpClientErrorException {
  private org.springframework.web.client.HttpClientErrorException$TooManyRequests(java.lang.String, org.springframework.http.HttpHeaders, byte[], java.nio.charset.Charset);
  private org.springframework.web.client.HttpClientErrorException$TooManyRequests(java.lang.String, java.lang.String, org.springframework.http.HttpHeaders, byte[], java.nio.charset.Charset);
}
```

**构造器是 private，只能由外层类工厂创建**。`getStatusCode()`/`getResponseBodyAsString()` 不在本类，而在祖父类 `RestClientResponseException`。

### 5.3 DefaultResponseErrorHandler 对 429 的行为：**会抛专属子类（标准 HttpStatus 枚举前提下）**

`handleError` 字节码：`is4xxClientError()` → `HttpClientErrorException.create(...)` 工厂；`is5xxServerError()` → `HttpServerErrorException.create(...)`；否则 `UnknownHttpStatusCodeException`。

对 `create` 工厂反汇编可完整确认子类选择逻辑：`statusCode instanceof HttpStatus` 守卫（非枚举实例则走 default 分支抛通用父类）→ `$SwitchMap$HttpStatus` tableswitch `case 10 → new HttpClientErrorException$TooManyRequests`，default → 通用父类；switch map 静态块确认 `HttpStatus.TOO_MANY_REQUESTS.ordinal() → 10`。

**结论（字节码层面可可靠确认）**：对标准 `HttpStatus` 枚举状态码，**HTTP 429 会抛出 `HttpClientErrorException.TooManyRequests` 专属子类**；但若 statusCode 不是 `HttpStatus` 枚举实例（自定义 `HttpStatusCode` 实现），`create` 的 instanceof 守卫落到 default 分支，抛**通用父类** `HttpClientErrorException`。该子类本身不新增任何方法/字段，状态码与响应体均在父类链上。

### 5.4 备选路径：手动检查状态码 —— **可行**

`javap -p org.springframework.web.client.RestClientResponseException` 原始输出（节选 public 方法）：

```
public org.springframework.http.HttpStatusCode getStatusCode();
public int getRawStatusCode();
public java.lang.String getStatusText();
public org.springframework.http.HttpHeaders getResponseHeaders();
public byte[] getResponseBodyAsByteArray();
public java.lang.String getResponseBodyAsString();
public java.lang.String getResponseBodyAsString(java.nio.charset.Charset);
public <E> E getResponseBodyAs(java.lang.Class<E>);
public <E> E getResponseBodyAs(org.springframework.core.ParameterizedTypeReference<E>);
```

**即使 catch 到的是通用父类 `HttpClientErrorException`，也可调 `getStatusCode()`（返回 `org.springframework.http.HttpStatusCode`）或 `getRawStatusCode()`（int），并可 `getResponseBodyAsString()` 取原始响应体**——均定义于 `RestClientResponseException`，为 public，任何 4xx/5xx 异常实例上均可调用。按状态码判断 429/额度超限**不依赖异常具体子类，路径成立**。

### 5.5 问题 5 总结（三类结论）

- **(a) Spring AI 是否有专属"限流/Transient"异常类型且携带状态码？** 有专属类型（`TransientAiException`/`NonTransientAiException`），但**不携带任何 HTTP 状态码或响应体字段**；且默认错误处理器把 429 归为 NonTransient（语义即"不重试"）。若限流切 Key 依赖此类异常，只能按类型/消息判断，拿不到状态码。
- **(b) 是否有 `HttpClientErrorException.TooManyRequests`，DefaultResponseErrorHandler 是否抛它？** 有；对标准 `HttpStatus` 枚举的 429 会抛该专属子类（前提：状态码为标准枚举实例；自定义 HttpStatusCode 实现则抛通用父类）。
- **(c) "手动检查状态码==429"备选路径是否可行？** **可行**。`getStatusCode()`/`getRawStatusCode()`/`getResponseBodyAsString()` 均 public 存在，任何 4xx/5xx 异常对象上可调用；且不依赖异常具体子类。**注意**：由于 invoke 层异常以 `CompletionException` 包装（Step2 实测），且 Spring AI RetryTemplate 可能已将异常重新包装/归类，实际到达 Service 层 catch 的异常类型链需在实现时验证（仅提示事实，不做设计建议）。

---

## 问题 6：仓库现有"优先级排序字段"命名先例

**指定命令执行结果**：`grep -ilE "priority|sort_order|sort_num|seq_no|order_num"` 在 36 个 V*.sql 文件中**无任何命中**。

**补充事实**（与任务例举的 sys_menu 直接相关）：指定 pattern 不含裸 `sort`，但仓库实际存在的排序字段名是**裸名 `sort`**，共 5 张表，全部定义于 `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/postgresql/V1__init_schema.sql`（h2 版本 `/h2/V1__init_schema.sql` 完全相同，行号一致）：

| 行号 | 表 | 定义原文 |
|---|---|---|
| L40 | sys_dept | `sort            integer         not null default 0,` |
| L59 | sys_post | `sort            integer         not null default 0,` |
| L103 | sys_role | `sort            integer         not null default 0,` |
| L128 | sys_menu | `sort            integer         not null default 0,` |
| L196 | sys_dict_data | `sort            integer         not null default 0,` |

类型统一为 `INTEGER NOT NULL DEFAULT 0`。种子数据用法：`postgresql/V6__m_seam_menu_seed.sql` L32 `sort = 10,`（UPDATE），L39/43/47/51/55/59/63/67 的 `INSERT INTO sys_menu (... icon, sort)` 列清单（h2 版本 L32 相同）。

**结论**：无 `priority`/`sort_order`/`sort_num`/`seq_no`/`order_num` 命名先例；仓库唯一排序字段先例是裸名 **`sort` (INTEGER, DEFAULT 0)**，用于 sys_menu/sys_role/sys_dept/sys_post/sys_dict_data。

---

## 问题 7：仓库现有"临时锁定至某时间点"字段命名先例

**SQL 层**：grep `lock|disabled_until|expire|quota` 命中 4 个文件，但**无任何 lock/锁定字段**；仅有两个"过期时间"字段：

1. `postgresql/V1__init_schema.sql` L22（属 sys_tenant 表，建表自 L7）：
   ```
   expire_time     timestamp,
   ```
   h2 版本 `/h2/V1__init_schema.sql` L22 相同。

2. `postgresql/V18__init_refresh_token_table.sql` L8（表 sys_refresh_token）：
   ```
   expires_at  TIMESTAMP    NOT NULL,
   ```
   L24 注释：`COMMENT ON COLUMN sys_refresh_token.expires_at  IS '过期时间';`
   h2 版本 `/h2/V18__init_refresh_token_table.sql` L8 相同。

**代码层（sw-security）**：`grep -rln "lockout|lockUntil|失败次数|锁定"` 仅命中 1 个文件：
`Smart-WorkFlow/sw-framework/sw-security/src/main/java/com/sw/ck/security/spi/LoginLockoutStrategy.java`（接口，全文 15 行）。逻辑摘要：javadoc 声明"登录失败锁定扩展点：记录失败次数、判断是否锁定、登录成功后清零。本模块不内置任何实现、不在任何地方调用，仅预留接口；具体存储（Redis/DB）与锁定策略由实现方决定"；接口方法为 `boolean isLocked(String username)` / `void onLoginFailure(String username)` / `void onLoginSuccess(String username)`。**无 lockUntil/锁定时间点字段，无任何实现类**。

**结论**：仓库无"临时锁定至某时间点"字段先例；仅有到期时间命名先例 `expire_time`（sys_tenant，timestamp，可空）与 `expires_at`（sys_refresh_token，TIMESTAMP NOT NULL）。sw-security 的锁定能力仅为无实现的 SPI 接口，无字段级先例。

---

## 问题 8：仓库现有"多行记录归为一个逻辑分组/候选池"设计先例

**指定命令执行结果**：`grep -ilE "group_key|group_code|pool_key|pool_code"` 在 36 个 V*.sql 文件中**无任何命中**。

**补充验证**：对全部 SQL 文件额外 grep `\bgroup\b|group_|pool|candidate|batch_`，同样**零命中**——迁移脚本中不存在任何分组/池化/候选相关列名或表名。

**结论**：**仓库无分组/候选池字段命名先例**。

**knowledge/ 目录核查**（本项依据任务授权自行判断后查看）：`/data/reasonix/files/knowledge/` 含 architecture.md、model-registry.md、decisions.md、features/ 等。与分组/优先级/池化相关的命中仅 3 处，均非 DB 字段设计：
- `architecture.md` L30：`### 1.2 产品原则（决策优先级）`——文档标题，与字段命名无关；
- `features/bpm-task-center.md` L87：`B3-2 | @Nested 分组含 5 个端点(...)`——JUnit 测试分组，与 DB 设计无关；
- `features/feature-checklist-sync.md` L37：提及"失败锁定"为功能清单明细项——无设计细节，与 Q7 的 LoginLockoutStrategy SPI 对应。

knowledge/ 中**未发现与模型/agent/编排相关的设计文档**（无 agent 模块设计文档存在），无分组/优先级/池化概念的相关内容可引用。

---

## 完成标准对照

| 问题 | 结论 | 证据 |
|---|---|---|
| 1 表结构 | 20 列全列出；V19 未被修复触碰（修复在 AgentTool 路径 2 文件 6 处，提交 74fc415）；Flyway 最大 V23 | 两 V19 全文 + git log/show 74fc415 + find 输出 |
| 2 实体字段 | 13+8 字段全文贴出；**无**优先级/分组/锁定字段 | AgentModelConfig.java 全文 + BaseEntity/BaseEntityNoTenant |
| 3 ChatModelFactory | 132 行全文；buildRestClientBuilder **private**（Step3 仅 javadoc 引用）；build 唯一入口无重载；main 唯一消费点 `:125` | 全文 + grep 输出 |
| 4 编排服务 | 283 行全文；selectById 位置；invoke 异常捕获结构；summarizeError 全文；session 创建在 build 后；DTO **3 字段**（新增 sessionId） | 全文 + DTO 全文 |
| 5 异常类型 | TransientAiException 无状态码字段且 429→NonTransient；`HttpClientErrorException.TooManyRequests` 存在（私有构造，工厂 tableswitch case 10 抛）；手动状态码路径可行（getStatusCode/getRawStatusCode/getResponseBodyAsString 均 public） | javap 原始输出 4 组 |
| 6 优先级先例 | 指定 5 模式 0 命中；实际先例为裸名 `sort INTEGER NOT NULL DEFAULT 0`（5 表） | V1__init_schema.sql 行号 |
| 7 锁定先例 | 无锁定字段；仅 expire_time/expires_at 到期字段；LoginLockoutStrategy 无实现 | V1 L22、V18 L8、sw-security grep |
| 8 分组先例 | group_/pool_/candidate 零命中，**无先例** | grep 输出 |

**失败处理对照**：问题 5 未落空（专属子类与状态码路径均确认可行，且明确两者边界）；问题 6-8 三项先例中仅 8 为空、6/7 有替代先例（sort / expire_time|expires_at），均已如实标注，规划层可据此决定自定命名或沿袭先例，不算调研失败。
