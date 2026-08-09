# Step 1：后端大模型注册管理（CRUD + API Key 加密存储 + 连通性测试）

## 1. 当前状态

- **功能**：agent-model-orchestration（M07-F01 大模型管理，M07-F02/F03/F04 及前端图设计器均不在本 Step 范围）
- **整体进度**：I13 产品设计决策已通过 D47/D48/D49 解决（见 `memory/decisions.md`），Step 1 方案 READY，尚无 Step 进入执行
- **前置调研**：
  - `search_fallback/m07-agent-kickoff.md`（骨架现状 + PRD 明细 + I13 全文）
  - `search_fallback/m07-step1-model-management-precedent.md`（凭证加密/表结构/模块分层/权限码先例，本方案的事实依据）
- **本 Step 定位**：产出可独立编译测试的后端管理层（Entity/Mapper/Service/Controller/DTO/Flyway），**不涉及**模型的实际调用（LangGraph4j 编排消费模型配置留给 Step 2）、**不涉及**前端页面（留给后续 Step）。

## 2. Step 目标

在 `sw-basic-agent` 模块落地大模型接入配置的 CRUD 管理能力：新增/编辑/删除/查询/分页大模型接入配置，API Key 使用 AES-GCM 加密落库，提供连通性测试端点。交付后 M07-F01 的 5 条 PRD 明细中「模型接入」「密钥管理（加密存储部分）」「连通性测试」达成，「动态装载」「多 Key 轮询/额度限流」明确推迟（见 §3.1 非目标）。

## 3. 推荐模型

推荐模型：deepseek-v4-pro
选择理由：涉及 Flyway 数据库迁移（新表 + 新增 locations 配置）、凭证加密安全实现（复用 `AesGcmCipher`，密钥管理错误会导致明文泄露）、`sw.agent.enabled` 功能开关的首次真实启用（影响 bootstrap 启动装配）。触发 system.md §2.3 升级条件「DB schema/迁移」+「权限/安全/密钥管理」。
是否触发升级条件：是 — DB schema 迁移 + 凭证加密安全实现 + 功能开关首次启用

## 4. 模型选择理由

（同 §3，此处补充）本 Step 是 `sw-basic-agent` 模块从"空壳骨架"到"首个真实功能"的第一次落地，需要正确处理：新表加入 Flyway 全局版本序列（避免与并行开发的其他 Step 版本号冲突）、复用已有加密基础设施而不是重新发明、模块分层决策需与骨架现状（扁平模块）保持一致。Flash 模型在单文件 CRUD 场景下可胜任，但本 Step 是新模块首次接入 Flyway + 安全加密两条高风险线，需要 Pro 模型的架构判断力。

## 5. 已知上下文

- **`sw-basic-agent` 现状**（`search_fallback/m07-agent-kickoff.md` §1）：扁平单模块（无 `-api`/`-biz` 拆分），已有文件仅 `pom.xml` + `AgentGraphAutoConfiguration.java`（空占位，`@ConditionalOnProperty(prefix="sw.agent", name="enabled", havingValue="true")`，默认关闭）+ `AutoConfiguration.imports` + 空迁移目录 `.../db/migration/agent/.gitkeep`
  - pom 现有依赖：`sw-common`、`sw-basic-knowledge`、`spring-ai-starter-model-openai`、`spring-ai-starter-model-ollama`、`langgraph4j-core`、`lombok`。**未见 `mybatis-plus-boot-starter` / `spring-boot-starter-web` 的显式声明**——需在执行前确认这两者是否经 `sw-common` 传递引入（见 §6 第 1/2 项、§9.0）
  - `sw-dependencies/pom.xml` 已钉死版本：`spring-ai.version=1.0.4`、`langgraph4j.version=1.5.14`
- **加密先例**（`search_fallback/m07-step1-model-management-precedent.md` §1）：`com.sw.ck.common.crypto.AesGcmCipher`（`sw-framework/sw-common`），`encrypt(String)`/`decrypt(String)`/`mask(String)`（静态），AES-256-GCM，密钥来自环境变量 `SW_CIPHER_KEY`（Base64，自动补零至 256-bit）。现有消费方 `ExternalDatasourceServiceImpl` 通过 `BpmEngineAutoConfiguration` 构造 bean 注入——**`sw-basic-agent` 不依赖 `sw-bpm-engine`，不能复用该 bean，必须在 `sw-basic-agent` 自己的 AutoConfiguration 里新建一个 `AesGcmCipher` bean**，指向同一个环境变量（`sw.agent.cipher-key: ${SW_CIPHER_KEY:}`，与 `sw.external-datasource.cipher-key: ${SW_CIPHER_KEY:}` 同构、共享同一把基础设施密钥）
- **表结构先例**（precedent §2）：`sw_bpm_ext_datasource`，密文列 **H2 用 `clob`、PG 用 `text`**（two-dialect diff，非"无类型差异"——precedent §10.4 已修正先前回执的错误陈述），本 Step 允许为 `null`（因 Ollama 协议可能不需要 Key）
- **"多类型"字段先例**（precedent §3）：仓库惯例是 **varchar + Java String**，无 CHECK 约束、无 enum 类（与最初任务预设不同，已按实际调整）。`protocol_type` 字段用 varchar(32) 存 `"openai"`/`"ollama"`/`"other"`，Java 侧用 `String`，不建 enum 类
- **连通性测试无先例**（precedent §4，明确"未找到"）：本 Step 需自行设计，设计已在 §9.5 给出明确方案，不使用"自行处理"类模糊表达
- **模块分层先例**（precedent §5）：`sw-basic-storage` 是 `-api`/`-biz` 拆分（为未来微服务化预留），`sw-basic-agent` 是扁平模块——**本 Step 维持扁平**，新代码放 `com.sw.ck.agent.{config,controller,entity,mapper,service,service.impl,dto}` 子包，不引入 `-api`/`-biz` 拆分
- **审计字段/ORM 基类**（precedent §6）：MyBatis-Plus；`com.sw.ck.common.entity.BaseEntity`（含 `tenantId`，继承 `BaseEntityNoTenant`：`id`/`createTime`/`createBy`/`updateTime`/`updateBy`/`deleted`/`version`）——本表继承 `BaseEntity`（需要租户隔离）
- **Flyway 规范**（precedent §7）：版本号全局共享递增，命名 `V{N}__snake_case.sql`；已知序列至 **V18**（refresh-token）——**执行时必须先 grep 全部 `db/migration/*/{h2,postgresql}/V*.sql` 文件名重新确认当前最大版本号，若确认仍是 V18 则本 Step 使用 `V19`，若发现有更新版本则使用「确认到的最大版本号 + 1」**，不得凑造。脚本放置位置：`sw-basic-agent` 已预留 `.../src/main/resources/db/migration/agent/`（模块自身 resources 方式，与 notify/form/bpm 同构），locations 需在 `sw-bootstrap/application.yml` 新增一行 `classpath:db/migration/agent/{vendor}`。**PG/H2 差异有两处**：①PG 版本额外含 `COMMENT ON TABLE/COLUMN`，H2 版本不含；②大文本列类型不同——H2 用 `CLOB`，PG 用 `TEXT`（`api_key_cipher` 列适用，precedent §10.4 修正）
- **功能开关先例**（precedent §8）：8 个模块统一模式 `@AutoConfiguration + @ConditionalOnProperty(prefix="sw.xxx", name="enabled", havingValue="true") + @EnableConfigurationProperties + @MapperScan + @ComponentScan`。`application.yml` 当前**无 `sw.agent:` 配置段**——本 Step 需新增该段并设 `enabled: true`（首次真正启用该模块）
- **权限码规范**（precedent §9）：格式 `模块:实体:动作`（冒号分层小写）。已注册 `agent:view`（菜单）。本 Step 新增：`agent:model:view`（查询类）、`agent:model:manage`（增/改/删）、`agent:model:test`（连通性测试，因涉及出站网络调用，风险高于普通查询，独立授权）
- **风险提示**：新增权限码目前**没有任何 `sys_menu`/前端按钮绑定这些权限码**（前端管理页面留给后续 Step）。在按钮 UI 上线前，仅 superAdmin（角色 code 绕过权限校验，见 `memory/constraints.md`）可实际调用这些端点；这是本 Step 的已知边界，不是缺陷

## 6. 执行前必须读取的文件

| # | 文件路径（相对于 `Smart-WorkFlow/`） | 读取目的 |
|---|------|------|
| 1 | `sw-basic/sw-basic-agent/pom.xml` | 确认现有依赖，判断是否已传递引入 `mybatis-plus-boot-starter`/`spring-boot-starter-web`（用 `mvn dependency:tree -pl sw-basic/sw-basic-agent` 辅助确认） |
| 2 | `sw-framework/sw-common/pom.xml` | 确认 `sw-common` 是否声明了 mybatis-plus/spring-web，作为传递依赖来源 |
| 3 | `sw-framework/sw-common/src/main/java/com/sw/ck/common/crypto/AesGcmCipher.java` | 确认加密工具类完整方法签名（构造函数是否需要 key 参数，还是有静态方法） |
| 4 | `sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/facade/BpmEngineAutoConfiguration.java` | 参照 `AesGcmCipher` bean 的构造方式（key 从哪个 property 读取、如何传入构造函数） |
| 5 | `sw-biz/sw-bpm/sw-bpm-engine/.../service/impl/ExternalDatasourceServiceImpl.java` | 参照加密/解密/脱敏调用点的写法（`cipher.encrypt()`/`mask()` 的调用时机） |
| 6 | `sw-framework/sw-common/.../entity/BaseEntity.java` + `BaseEntityNoTenant.java` | 确认基类字段和 MyBatis-Plus 注解写法，本表实体继承用 |
| 7 | `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/config/AgentGraphAutoConfiguration.java` | 确认现有占位配置类内容，决定新配置类与它的关系（不修改它，新建独立配置类） |
| 8 | `sw-basic/sw-basic-agent/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` | 确认现有注册格式，追加新配置类 |
| 9 | `sw-basic/sw-basic-storage/sw-basic-storage-biz/.../config/StorageAutoConfiguration.java`（或实际路径） | 参照功能开关 AutoConfiguration 的完整写法（`@EnableConfigurationProperties`/`@MapperScan`/`@ComponentScan` 具体写法） |
| 10 | `sw-bootstrap/src/main/resources/application.yml` | 确认 `sw:` 顶层配置段现有结构（第 51-160 行附近）、Flyway `locations` 列表现状，确定新增位置 |
| 11 | `sw-bootstrap/src/main/resources/db/migration/h2/V16__init_storage_file.sql` + PG 同名文件 | 参照 varchar 类型字段（`provider_type`）+ 审计字段列定义的 DDL 写法，PG/H2 差异点 |
| 12 | `sw-bootstrap/src/main/resources/db/migration/h2/V3__external_datasource.sql` + PG 同名文件 | 参照 `password_cipher clob` 列定义 + 唯一索引写法 |
| 13 | `sw-biz/sw-bpm/sw-bpm-engine/.../controller/ExternalDatasourceController.java` | 参照 `@PreAuthorize` 权限码用法、Controller 分页/CRUD 端点写法模式 |
| 14 | `sw-framework/sw-common/.../page/PageResult.java` + `PageParam.java` | 确认分页 DTO 结构，本 Step 分页查询复用 |
| 15 | 全仓库执行 `find . -path '*/db/migration/*' -name 'V*.sql'` | 重新确认当前 Flyway 最大版本号（不得直接采信本方案 §5 中"已知至 V18"的陈述，必须现场核实） |

## 7. 允许修改的文件范围

| 文件路径（相对于 `Smart-WorkFlow/`） | 修改类型 | 说明 |
|------|:---:|------|
| `sw-basic/sw-basic-agent/pom.xml` | **条件修改** | 仅当 §6 第 1/2 项确认 `mybatis-plus-boot-starter` 和/或 `spring-boot-starter-web` 未被传递引入时才添加对应依赖；若已传递引入则本文件不改动。执行回执必须注明依据（`mvn dependency:tree` 输出片段） |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/config/AgentModelAutoConfiguration.java` | **新建** | 新增独立 AutoConfiguration：`@ConditionalOnProperty(prefix="sw.agent", name="enabled", havingValue="true")` + `@MapperScan("com.sw.ck.agent.mapper")` + `@ComponentScan` agent 的 controller/service/service.impl + `AesGcmCipher` bean 定义 |
| `sw-basic/sw-basic-agent/src/main/resources/META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` | 修改 | 追加一行注册 `AgentModelAutoConfiguration` |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/entity/AgentModelConfig.java` | **新建** | 大模型接入配置实体，继承 `BaseEntity` |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/mapper/AgentModelConfigMapper.java` | **新建** | `extends BaseMapper<AgentModelConfig>` |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/AgentModelConfigService.java` | **新建** | Service 接口：CRUD + 分页 + 连通性测试 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentModelConfigServiceImpl.java` | **新建** | Service 实现：加密/解密调用、连通性测试逻辑 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/controller/AgentModelController.java` | **新建** | REST 端点，`@PreAuthorize` 权限码 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/AgentModelConfigDTO.java` | **新建** | 查询响应 DTO（apiKey 脱敏） |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/AgentModelSaveReqDTO.java` | **新建** | 新增/编辑请求 DTO（apiKey 明文，仅入参） |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/AgentModelTestConnectionRespDTO.java` | **新建** | 连通性测试响应 DTO |
| `sw-bootstrap/src/main/resources/db/migration/agent/h2/V{N}__init_agent_model_config.sql` | **新建** | H2 建表脚本（N 按 §6 第 15 项现场确认） |
| `sw-bootstrap/src/main/resources/db/migration/agent/postgresql/V{N}__init_agent_model_config.sql` | **新建** | PG 建表脚本，同版本号，含 `COMMENT ON` |
| `sw-bootstrap/src/main/resources/application.yml` | 修改 | ①`flyway.locations` 追加 `classpath:db/migration/agent/{vendor}`；②新增 `sw.agent:` 配置段（`enabled: true`、`cipher-key: ${SW_CIPHER_KEY:}`） |
| `sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/service/impl/AgentModelConfigServiceImplTest.java` | **新建** | Service 层单元测试 |
| `sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/controller/AgentModelControllerTest.java` | **新建** | Controller 层测试（含权限校验） |

## 8. 禁止修改的范围

- ❌ **禁止**修改 `AgentGraphAutoConfiguration.java`（LangGraph4j 编排占位，留给 Step 2）
- ❌ **禁止**创建任何 LangGraph4j 相关的图编排代码（节点/边/执行引擎），本 Step 只做模型配置管理
- ❌ **禁止**实现"动态装载"（运行期切换生效）、"多 Key 轮询"、"额度限流"——三者均推迟到后续 Step（见 §3.1 非目标已在功能清单原文标注但本 Step 明确不做）
- ❌ **禁止**修改 `sw-framework/sw-common/.../crypto/AesGcmCipher.java`（直接复用，不改工具类本身）
- ❌ **禁止**修改 `BpmEngineAutoConfiguration` / `ExternalDatasourceServiceImpl` 等 BPM 模块文件
- ❌ **禁止**修改 `sw-basic-storage`、`sw-basic-knowledge`、`sw-basic-iot`、`sw-basic-openapi` 任何文件
- ❌ **禁止**修改前端 `Smart-WorkFlow-Web/` 任何文件（包括 `seeds.ts` 菜单/权限种子——本 Step 不新增任何前端可见入口）
- ❌ **禁止**修改已有 Flyway 脚本（V1-V18 任何文件），只能新增
- ❌ **禁止**引入 `mybatis-plus-boot-starter`/`spring-boot-starter-web` 之外的任何新 Maven 依赖（不得为图编排/RAG 预先引入 LangGraph4j 具体 API 调用、向量库客户端等）
- ❌ **禁止**在 Java 代码中硬编码任何密钥、Key 或密码明文（包括测试代码——测试用的 fake key 也要走加密流程，不得断言明文落库）

## 9. 详细执行方案

### 9.0 前置确认（不产出代码，仅确认事实）

执行前先跑 `mvn dependency:tree -pl sw-basic/sw-basic-agent` 确认 `mybatis-plus-boot-starter`、`spring-boot-starter-web` 是否已在依赖树中（多半通过 `sw-common` 传递引入，因为 `BaseEntity` 用了 MyBatis-Plus 注解且其他 `sw-basic-*` 模块无需重复声明即可用 Controller）。若确认已存在，**跳过 pom.xml 修改**；若确认缺失，在 `sw-basic-agent/pom.xml` 补充对应 starter（版本由 `sw-dependencies` BOM 管理，不手写版本号）。

同时执行 `find . -path '*/db/migration/*' -name 'V*.sql' | sort -V | tail -5` 确认当前最大版本号，据此确定本 Step 使用的版本号 `N`（下文以 `V19` 占位，若现场确认结果不同以现场结果为准，并在执行回执中说明实际使用的版本号）。

### 9.1 新建实体：`AgentModelConfig`

**文件**：`sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/entity/AgentModelConfig.java`（新建）

```java
package com.sw.ck.agent.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.sw.ck.common.entity.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sw_agent_model_config")
public class AgentModelConfig extends BaseEntity {

    /** 显示名称，租户内唯一 */
    private String name;

    /** 协议类型：openai / ollama / other（varchar，无 enum，与仓库惯例一致） */
    private String protocolType;

    /** 模型服务地址 */
    private String baseUrl;

    /** 模型标识（如 gpt-4o / llama3） */
    private String modelName;

    /** API Key 密文（AesGcmCipher 加密结果，Base64），Ollama 等可为 null */
    private String apiKeyCipher;

    private java.math.BigDecimal temperature;

    private Integer maxTokens;

    private java.math.BigDecimal topP;

    private Integer timeoutSeconds;

    private Integer retryCount;

    /** 1=启用 0=停用 */
    private Boolean enabled;

    private String remark;
}
```

**注意**：`BaseEntity` 已提供 `id`/`tenantId`/`createTime`/`createBy`/`updateTime`/`updateBy`/`deleted`/`version`，不重复声明。`enabled` 用 `Boolean`（MyBatis-Plus 自动映射到 `SMALLINT`，与 `read_only`/`enabled` 先例一致）。

### 9.2 新建 Mapper：`AgentModelConfigMapper`

```java
package com.sw.ck.agent.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.sw.ck.agent.entity.AgentModelConfig;

public interface AgentModelConfigMapper extends BaseMapper<AgentModelConfig> {
}
```

### 9.3 新建 DTO 三件

- `AgentModelConfigDTO`（响应）：`id, name, protocolType, baseUrl, modelName, apiKeyMasked, temperature, maxTokens, topP, timeoutSeconds, retryCount, enabled, remark, createTime, updateTime` —— **不含 `apiKeyCipher`**，`apiKeyMasked` 由 `AesGcmCipher.mask(明文)` 生成（Service 层解密后立即脱敏，脱敏结果才放入 DTO，解密出的明文变量不得持有超过一行代码）
- `AgentModelSaveReqDTO`（新增/编辑请求）：`name, protocolType, baseUrl, modelName, apiKey(明文，可为空), temperature, maxTokens, topP, timeoutSeconds, retryCount, enabled, remark`
- `AgentModelTestConnectionRespDTO`（连通性测试响应）：`success(boolean), message(String), latencyMs(long)`

三者均用 `@Data`（`sw-basic-agent` 已依赖 lombok，不同于 `sw-bpm-api` 的手写限制）。

### 9.4 新建 Service：`AgentModelConfigService` + Impl

接口方法：

```java
PageResult<AgentModelConfigDTO> pageModels(PageParam pageParam, String nameKeyword);
AgentModelConfigDTO getById(Long id);
Long create(AgentModelSaveReqDTO req);
void update(Long id, AgentModelSaveReqDTO req);
void delete(Long id);
AgentModelTestConnectionRespDTO testConnection(Long id);
```

实现要点：
- `create`/`update`：`req.getApiKey()` 非空时调用 `aesGcmCipher.encrypt(apiKey)` 存入 `apiKeyCipher`；`req.getApiKey()` 为 null 或空字符串时，`update` 场景保留原 `apiKeyCipher` 不变（不覆盖为 null），`create` 场景 `apiKeyCipher` 存 null
- `name` 唯一性：`create`/`update` 前 `lambdaQuery().eq(AgentModelConfig::getName, name).ne(id != null, AgentModelConfig::getId, id).exists()` 校验，冲突抛 `CommonErrorCode` 对应的业务异常（复用已有通用错误码，不新增 Agent 专属错误码枚举——本 Step 无自定义错误码文件）
- `getById`/`pageModels` 返回 DTO 前：`apiKeyCipher` 非空则 `aesGcmCipher.decrypt()` 得到明文，立即 `AesGcmCipher.mask()` 得到脱敏串塞入 DTO 的 `apiKeyMasked`，解密出的明文局部变量不赋值给任何字段、不打日志、不进异常信息
- `testConnection`：见 §9.5

### 9.5 连通性测试设计（无仓库先例，本节为明确设计，非"自行处理"）

**端点**：`POST /agent/models/{id}/test-connection`

**逻辑**（`AgentModelConfigServiceImpl.testConnection`）：
1. 按 `id`+租户加载配置，`apiKeyCipher` 非空则解密得到明文 Key（用完立即释放引用，不保留字段）
2. 用 JDK/Spring 提供的 `org.springframework.web.client.RestClient`（Spring Boot 3.2+ 内置，Spring AI 1.0.4 要求 Boot ≥3.3，可直接使用，不算新依赖）构造一次性请求，超时用 `ClientHttpRequestFactorySettings`/`SimpleClientHttpRequestFactory` 设置 connectTimeout=5000ms、readTimeout=5000ms
3. 按 `protocolType` 分支：
   - `"openai"`：`GET {baseUrl}/models`，header `Authorization: Bearer {apiKey}`（apiKey 为空则不加该 header）
   - `"ollama"`：`GET {baseUrl}/api/tags`（无需 Authorization）
   - `"other"`（或未识别值）：`GET {baseUrl}`，仅探测网络可达性，不校验响应体
4. 收到 2xx-4xx（含 4xx，说明服务端可达只是鉴权/路径问题）记 `success=true`；捕获连接超时/拒绝/DNS 失败等网络异常记 `success=false`，`message` 填异常简要信息（不含 apiKey 明文）；记录耗时 `latencyMs`
5. 本方法**不缓存**结果，不修改 `AgentModelConfig.enabled`（连通性测试不影响启用状态，是纯只读探测）

### 9.6 新建 Controller：`AgentModelController`

```java
package com.sw.ck.agent.controller;

@RestController
@RequestMapping("/agent/models")
public class AgentModelController {

    @GetMapping
    @PreAuthorize("hasAuthority('agent:model:view')")
    public PageResult<AgentModelConfigDTO> page(PageParam pageParam,
            @RequestParam(required = false) String nameKeyword) { ... }

    @GetMapping("/{id}")
    @PreAuthorize("hasAuthority('agent:model:view')")
    public AgentModelConfigDTO get(@PathVariable Long id) { ... }

    @PostMapping
    @PreAuthorize("hasAuthority('agent:model:manage')")
    public Long create(@RequestBody @Validated AgentModelSaveReqDTO req) { ... }

    @PutMapping("/{id}")
    @PreAuthorize("hasAuthority('agent:model:manage')")
    public void update(@PathVariable Long id, @RequestBody @Validated AgentModelSaveReqDTO req) { ... }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAuthority('agent:model:manage')")
    public void delete(@PathVariable Long id) { ... }

    @PostMapping("/{id}/test-connection")
    @PreAuthorize("hasAuthority('agent:model:test')")
    public AgentModelTestConnectionRespDTO testConnection(@PathVariable Long id) { ... }
}
```

`@PreAuthorize` 用法与写法对齐 §6 第 13 项 `ExternalDatasourceController` 的既有模式（`hasAuthority(...)`，具体方法名以该文件实际写法为准，执行时核对）。

### 9.7 新建 `AgentModelAutoConfiguration`

```java
package com.sw.ck.agent.config;

@AutoConfiguration
@ConditionalOnProperty(prefix = "sw.agent", name = "enabled", havingValue = "true")
@MapperScan("com.sw.ck.agent.mapper")
@ComponentScan(basePackages = {
    "com.sw.ck.agent.controller",
    "com.sw.ck.agent.service"
})
public class AgentModelAutoConfiguration {

    @Bean
    public AesGcmCipher agentAesGcmCipher(
            @Value("${sw.agent.cipher-key:}") String cipherKey) {
        return new AesGcmCipher(cipherKey);
    }
}
```

**注意**：`AesGcmCipher` 的实际构造函数签名以 §6 第 3/4 项现场确认结果为准（若是静态工具类而非可注入实例，则改为按 `ExternalDatasourceServiceImpl`/`BpmEngineAutoConfiguration` 的真实用法调整，不得凑造签名）。

### 9.8 Flyway 迁移脚本

**H2**：`sw-bootstrap/src/main/resources/db/migration/agent/h2/V19__init_agent_model_config.sql`（版本号以 §9.0 现场确认结果为准）

```sql
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

**PostgreSQL**：`sw-bootstrap/.../db/migration/agent/postgresql/V19__init_agent_model_config.sql`，建表语句与 H2 版一致，**但 `api_key_cipher` 列类型改为 `TEXT`（PG 无 `CLOB` 类型，precedent §10.4 修正：H2 用 CLOB、PG 用 TEXT）**：

```sql
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

除 `api_key_cipher` 列类型（H2 `CLOB` / PG `TEXT`）与 `COMMENT ON` 语句外，两版结构一致。

### 9.9 `application.yml` 修改

在 Flyway `locations` 列表现有 6 行之后追加：
```yaml
- classpath:db/migration/agent/{vendor}
```

在 `sw:` 顶层配置段新增（参照 `sw.storage`/`sw.job` 的缩进层级）：
```yaml
sw:
  agent:
    enabled: true
    cipher-key: ${SW_CIPHER_KEY:}
```

### 9.10 校验门

```bash
mvn -q -pl sw-basic/sw-basic-agent,sw-bootstrap -am compile
mvn -q test
```

**预期结果**：编译零错误；`mvn test` BUILD SUCCESS，测试计数在基线 465 之上新增（Service 测试 + Controller 测试，见 §13.2），已有测试不退化。

## 10. 关键实现约束

1. **加密调用点唯一化**：只在 `AgentModelConfigServiceImpl` 内调用 `encrypt`/`decrypt`/`mask`，Controller/DTO 层不出现明文 Key
2. **明文 Key 生命周期最短化**：解密出的明文变量只用于当次脱敏或当次连通性测试请求头，方法返回前不得以任何形式（日志/异常消息/DTO 字段）泄漏
3. **`protocolType` 是 String，不建 enum**：与仓库惯例保持一致（precedent §3 已确认无 enum 先例），校验值范围放在 Service 层做白名单检查（`Set.of("openai","ollama","other")`），非法值抛业务异常，不用 enum 反序列化报错
4. **`update` 时 API Key 为空不覆盖旧值**：这是本 Step 唯一允许的"部分更新"字段，其余字段全量覆盖
5. **`sw.agent.enabled` 从「默认关闭」变为本 Step 后「配置为 true」**：这是模块首次真正启用，执行前必须确认这不会导致 `AgentGraphAutoConfiguration`（同样受此开关控制的占位类）产生任何副作用（该类目前是空实现，预期无副作用，执行时需二次确认）
6. **连通性测试不做重试**：`retryCount`/`timeoutSeconds` 字段目前只落库存储，不在本 Step 的 `testConnection` 逻辑中生效（生效逻辑属于"动态装载"，推迟到 Step 2），避免本 Step 范围蔓延
7. **权限码三分**：`agent:model:view`（查询）/`agent:model:manage`（增改删）/`agent:model:test`（连通性测试），不得合并为一个粗粒度权限码
8. **不新增 Agent 专属错误码枚举文件**：复用 `CommonErrorCode`（如 `NOT_FOUND`、`PARAM_INVALID`），本 Step 规模不足以支撑专属错误码体系

## 11. 边界情况

| 场景 | 处理方式 |
|------|------|
| `apiKey` 为空字符串或 null（如纯 Ollama 本地部署无需鉴权） | `apiKeyCipher` 存 null，`testConnection` 请求不加 `Authorization` header |
| `name` 与租户内已有记录重复（含大小写完全一致） | 抛业务异常，HTTP 层返回 4xx，不落库 |
| `protocolType` 传入未知值（非 openai/ollama/other） | Service 层白名单校验拒绝，不落库 |
| `testConnection` 目标地址不可达（DNS 失败/连接拒绝/超时） | 捕获异常，返回 `success=false` + 简要 `message`，不抛 500 |
| `testConnection` 目标返回 4xx（如 401 鉴权失败） | 判定 `success=true`（服务端可达，鉴权问题不代表网络不通——见 §9.5 第 4 步设计） |
| 删除一条记录后立即调用其 `testConnection` | 先查不到记录，返回 404/业务异常，不做级联清理（本表无其他表引用它，Step 2 才会引入引用关系） |
| 分页查询 `nameKeyword` 为空 | 不加过滤条件，返回全量分页 |
| 并发创建同名记录（竞态） | 依赖 §9.8 的唯一索引 `uk_sw_agent_model_name (tenant_id, name)` 兜底，唯一索引冲突转换为业务异常（Service 层捕获 `DuplicateKeyException`） |

## 12. 风险和回滚方案

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|:---:|------|------|
| `mybatis-plus-boot-starter`/`spring-boot-starter-web` 实际未被传递引入，需新增依赖但引发版本冲突 | 低 | 中 | §9.0 先用 `mvn dependency:tree` 确认，新增时严格走 `sw-dependencies` BOM 管理版本，不手写版本号 |
| Flyway 版本号与其他并行 Step/功能的迁移脚本冲突（版本号被抢占） | 低 | 高（迁移失败，`validate-on-migrate: true` 会直接拒绝启动） | 执行前现场 grep 确认最大版本号（§9.0），执行后立即 `mvn test` 验证 Flyway 校验通过 |
| `sw.agent.enabled=true` 触发 `AgentGraphAutoConfiguration` 产生未知副作用 | 低 | 中 | 该类当前为空实现（已读源码确认），执行后 `mvn test` 全量跑通即可排除 |
| 加密 bean 构造方式与 `AesGcmCipher` 实际签名不符（本方案 §9.7 为推测写法） | 中 | 中 | 执行前必须读取 §6 第 3/4 项真实源码，按实际签名调整，不得凑造 |
| 连通性测试对不可控外部地址发起真实网络请求，测试环境可能无网络出口 | 中 | 中（单元测试不稳定） | §13.2 测试用 JDK 内置 `com.sun.net.httpserver.HttpServer` 起本地假服务，不依赖真实外网 |
| API Key 明文意外落入日志（如异常栈打印整个 DTO） | 低 | 高（安全事故） | §10 约束 2 + Controller/Service 异常处理统一走已有全局异常处理器，不打印请求体全量 |

**回滚方案**：`git checkout --` 还原/`git rm` 新增文件；Flyway 脚本一旦执行过 `mvn test`（H2 会真实跑迁移）需额外确认本地 H2 测试库状态可重建（H2 为内存库，重启测试进程即重置，无需手动清库）。若已推送到有持久化 PG 环境，需追加一条 `DROP TABLE sw_agent_model_config;` 的回滚脚本（本 Step 不预先创建，仅在真正需要回滚时按需生成）。

**回滚验证**：`mvn -q compile && mvn -q test` BUILD SUCCESS，测试计数回落到基线 465，`sw.agent.enabled` 恢复移除（或保持 true 但因代码已回滚，`AgentModelAutoConfiguration` 不存在，实际不装配任何新 Bean）。

## 13. 测试方案

### 13.1 静态检查

| 检查项 | 命令 | 预期结果 |
|------|------|------|
| 编译验证 | `mvn -q -pl sw-basic/sw-basic-agent,sw-bootstrap -am compile` | 零错误 |
| 加密调用未泄漏到 Controller/DTO | `grep -rn "aesGcmCipher\|AesGcmCipher" sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/controller/` | 零命中 |
| `protocolType` 无 enum 类 | `find sw-basic/sw-basic-agent -iname "*ProtocolType*"` | 零命中（确认未违反 §10 约束 3） |
| 新表在迁移脚本中 | `grep -l "sw_agent_model_config" sw-bootstrap/src/main/resources/db/migration/agent/*/V*.sql` | H2 + PG 各 1 个文件 |
| Flyway 版本号无冲突 | `find . -path '*/db/migration/*' -name "V19__*"` (或现场确认的实际版本号) | 仅本 Step 新增的 2 个文件（h2+pg），无重名冲突 |
| 权限码三分且未合并 | `grep -o "agent:model:[a-z]*" sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/controller/AgentModelController.java \| sort -u` | 恰好 3 个：`agent:model:view`/`agent:model:manage`/`agent:model:test` |
| 全量测试 | `mvn -q test` | BUILD SUCCESS，无失败/错误 |

### 13.2 单元测试

#### AgentModelConfigServiceImplTest（新建）

| # | 测试用例 | 覆盖场景 |
|---|------|------|
| 1 | `create` 后 `apiKeyCipher` 非明文落库 | 断言数据库中 `api_key_cipher` 列值 ≠ 传入明文，且能被 `decrypt()` 还原为原值 |
| 2 | `create` 时 `apiKey` 为空 | `apiKeyCipher` 落库为 null |
| 3 | `update` 时 `apiKey` 为空不覆盖旧密文 | 先 create 带 Key，再 update 传空 Key，断言密文不变 |
| 4 | `getById` 返回的 DTO `apiKeyMasked` 格式正确 | 断言脱敏格式（前2后2+`****`），且 DTO 不含 `apiKeyCipher` 字段 |
| 5 | `name` 重复校验 | 同租户重复 name 抛业务异常；跨租户同名允许（若测试环境支持多租户切换） |
| 6 | `protocolType` 非法值拒绝 | 传入 `"foo"`，断言抛业务异常，不落库 |
| 7 | `pageModels` 分页 + `nameKeyword` 过滤 | 至少 3 条数据，按关键字过滤验证 |
| 8 | `testConnection` 成功场景（openai 协议） | 用 `HttpServer` 起本地假服务返回 200，`protocolType="openai"`，断言 `success=true` |
| 9 | `testConnection` 成功场景（ollama 协议，无 Authorization header） | 假服务校验请求头不含 `Authorization`，仍返回 200，断言 `success=true` |
| 10 | `testConnection` 失败场景（连接拒绝） | `baseUrl` 指向未监听端口，断言 `success=false`，`message` 非空，`latencyMs` ≥ 0 |
| 11 | `testConnection` 目标不存在的 id | 抛 404/业务异常 |

**测试策略**：`@SpringBootTest` + H2 + `@Transactional`（回滚）。第 8-10 项使用 JDK 内置 `com.sun.net.httpserver.HttpServer` 绑定 `localhost:0`（随机可用端口），测试内启动/关闭，不依赖真实外网、不引入 WireMock 等新依赖。

#### AgentModelControllerTest（新建）

| # | 测试用例 | 覆盖场景 |
|---|------|------|
| 1 | 无 `agent:model:view` 权限访问 `GET /agent/models` | 返回 403 |
| 2 | 具备 `agent:model:manage` 权限调用 `POST /agent/models` | 返回创建成功 + id |
| 3 | 不具备 `agent:model:test` 权限调用 `POST /agent/models/{id}/test-connection` | 返回 403（即使具备 `manage` 权限也不行——验证三权限码互不越权） |
| 4 | superAdmin 角色绕过权限校验 | 直接可调用全部端点（对齐 `memory/constraints.md` 的 superAdmin 规则） |

**测试策略**：`@SpringBootTest` + `@AutoConfigureMockMvc`，用 mock 认证上下文模拟不同权限组合（参照仓库现有 Controller 测试中权限校验测试的既有写法，执行时先读一个现成的 `*ControllerTest` 确认 mock 认证的标准写法）。

### 13.3 集成测试

Flyway 迁移脚本的正确性通过 `mvn test` 启动 Spring 上下文时的真实 H2 迁移执行来验证（`validate-on-migrate: true`，迁移失败则整个测试套件无法启动，天然是集成验证）。不再单独写 Flyway-only 集成测试类。

### 13.4 手工验证

无需手工验证——纯后端 API，自动化测试覆盖 CRUD + 加密 + 连通性测试全部路径。若需人工抽查，可用 `curl` 携带 superAdmin token 调用 `POST /agent/models` + `GET /agent/models/{id}` 确认响应体 `apiKeyMasked` 格式正确，非必需步骤。

### 13.5 回归检查

| 检查项 | 预期结果 |
|------|------|
| 已有测试通过数不减少 | `mvn test` 全部已有测试仍通过（基线 465 + 本 Step 新增 ≥15） |
| `sw.agent.enabled=true` 不影响其他模块装配 | 全量 `mvn test` 通过即视为无副作用 |
| Flyway 已有迁移脚本未被修改 | `git diff --stat` 不含 V1-V18 任何文件 |
| BPM 外部数据源加密逻辑不受影响 | `ExternalDatasourceServiceImplTest`（如有）不退化 |

## 14. 验收标准

| # | 验收标准 | 验证方式 |
|---|------|------|
| 1 | `sw_agent_model_config` 表建成，字段与 §9.8 一致，含唯一索引 + 租户索引 | grep 迁移脚本 + `mvn test` 迁移成功 |
| 2 | `AgentModelConfig` 继承 `BaseEntity`，字段与实体设计一致 | 代码审查 |
| 3 | API Key 落库为密文，可用 `AesGcmCipher.decrypt()` 还原 | 单元测试 1 |
| 4 | `update` 时空 Key 不覆盖旧密文 | 单元测试 3 |
| 5 | 查询接口返回的 DTO 不含 `apiKeyCipher` 原始密文字段，只含脱敏 `apiKeyMasked` | 代码审查 + 单元测试 4 |
| 6 | `protocolType` 白名单校验（openai/ollama/other），非法值拒绝 | 单元测试 6 |
| 7 | CRUD + 分页 5 个端点全部实现，权限码三分（view/manage/test）且互不越权 | Controller 测试 1-3 |
| 8 | 连通性测试端点对 openai/ollama 协议分别处理鉴权头，对不可达地址返回 `success=false` 而非抛异常 | 单元测试 8-10 |
| 9 | superAdmin 绕过权限校验 | Controller 测试 4 |
| 10 | `mvn -q compile` 零错误，`mvn -q test` BUILD SUCCESS，新增测试 ≥15，已有测试不退化 | 命令输出 |
| 11 | 不修改 `AgentGraphAutoConfiguration`、不引入 LangGraph4j 图编排代码 | `git diff --stat` 确认 |
| 12 | 不修改前端任何文件 | `git diff --stat` 确认 |
| 13 | Flyway 版本号无冲突，H2/PG 双方言脚本内容对齐（差异仅限 COMMENT 语句 + `api_key_cipher` 列类型 H2/CLOB 对 PG/TEXT） | 现场 grep + diff 两个脚本内容 |

## 15. 执行回执格式

按 system.md §7.1 标准 13 项结构产出执行回执，写入 `product/agent-model-orchestration/receipts/step-1-execution.md`。

特别注意回执中需包含：
- §9.0 前置确认的实际结果（pom.xml 是否改动、实际使用的 Flyway 版本号）
- `AesGcmCipher` 真实构造方式与本方案 §9.7 推测写法的实际差异（如有调整需说明原因）
- 新增/修改文件的完整清单和行数统计
- `application.yml` 具体改动的 diff 片段

## 16. 测试回执格式

按 system.md §7.2 标准 12 项结构产出测试回执，写入 `product/agent-model-orchestration/receipts/step-1-test.md`。

特别注意回执中需包含：
- 逐条对照 §14 全部 13 项验收标准
- Service 测试 11 个 @Test + Controller 测试 4 个 @Test 的输出摘要
- 全量 `mvn test` 测试计数确认（基线 465 → 新基线）
- 连通性测试相关 3 个用例（成功/无鉴权头/失败）的详细断言结果

## 17. 明确禁止事项

- ❌ **禁止**实现 LangGraph4j 图编排、图设计器、调试运行等 M07-F02 范围内容
- ❌ **禁止**实现"动态装载"、"多 Key 轮询"、"额度限流"（M07-F01 剩余明细，明确推迟）
- ❌ **禁止**为 `protocolType` 创建 Java enum 类（仓库惯例是 varchar+String，见 precedent §3）
- ❌ **禁止**在任何日志、异常消息、DTO 字段中输出 API Key 明文
- ❌ **禁止**修改 `AesGcmCipher.java` 工具类本身
- ❌ **禁止**修改已有 V1-V18 任何 Flyway 脚本
- ❌ **禁止**新增 `mybatis-plus-boot-starter`/`spring-boot-starter-web` 之外的任何 Maven 依赖
- ❌ **禁止**修改前端任何文件（含 `seeds.ts` 菜单/权限种子）
- ❌ **禁止**将三个权限码合并为一个粗粒度权限码
- ❌ **禁止**用 WireMock 等新测试依赖模拟 HTTP——用 JDK 内置 `com.sun.net.httpserver.HttpServer`
