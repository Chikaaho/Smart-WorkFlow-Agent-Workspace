# 探索回执：M07-Step1「大模型注册管理」后端实现前置调研

**执行模型**：deepseek-v4-flash（本会话）
**执行日期**：2026-08-04
**任务来源**：`search_task/m07-step1-model-management-precedent.md`
**任务状态**：✅ 9 问均有明确答案（其中 2 处与任务预期不符 + 1 处新线索修正，已如实标注，见 §10）
**未确认事项**：见 §10

---

## 1. 凭证加密工具类（Q1）

**storage-multi-provider 本身不使用任何加密工具**——凭证以明文经 YAML + 环境变量注入（`application.yml:104-122` `sw.storage.providers.*.access-key/secret-key: ${MINIO_ACCESS_KEY:}` 等；`StorageProperties` 为普通 `@Data` 配置类，grep 确认 storage 模块对 crypto/encrypt 零引用）。

**仓库中真实的「凭证加密存储」先例是 BPM 外部数据源（ExternalDatasource）**，工具类：

- **完整类名**：`com.sw.ck.common.crypto.AesGcmCipher`
- **所在模块**：`sw-framework/sw-common`（`sw-framework/sw-common/src/main/java/com/sw/ck/common/crypto/AesGcmCipher.java`）
- **关键方法签名**（已逐行核实）：
  - `public String encrypt(String plainText)` → 返回 `base64(12-byte IV || ciphertext-with-128-bit-tag)`，每次随机 IV
  - `public String decrypt(String cipherText)`
  - `public static String mask(String password)`（脱敏：保留前 2 后 2，`****` 中缀）
- **算法**：`AES/GCM/NoPadding`（AES-256-GCM）
- **密钥来源**：构造参数 `String base64Key`（16/24/32 字节，不足 32 自动补零至 256-bit）；由 `ExternalDatasourceProperties.getCipherKey()` 注入，yml 配置位 `sw.external-datasource.cipher-key: ${SW_CIPHER_KEY:}`（`application.yml:135-136`），由 `BpmEngineAutoConfiguration` 构造 `@Bean AesGcmCipher`（第 54-59 行）
- **真实消费者**（grep 全仓库 4 处）：
  - `sw-biz/sw-bpm/sw-bpm-engine/.../service/impl/ExternalDatasourceServiceImpl.java`：save/update 时 `cipher.encrypt(明文)` → `entity.setPasswordCipher()`，日志用 `AesGcmCipher.mask()`，`decryptPassword()` 仅内部执行 SQL 用
  - `sw-biz/sw-bpm/sw-bpm-engine/.../datasource/ExternalDatasourceManager.java`：`buildConfig()` 中 `config.setPassword(cipher.decrypt(entity.getPasswordCipher()))`
  - `sw-biz/sw-biz-form/sw-biz-form-biz/.../service/FormSubmitService.java`：以 `Optional<AesGcmCipher>` 可选注入，加密提交 IP（未配置时明文降级，第 360-369 行）
  - `BpmEngineAutoConfiguration`（Bean 装配）

## 2. 凭证存储表结构（Q2）

**storage 无凭证表**（`sw_storage_file` 仅为文件元数据表，见 §3；provider 配置全部走 YAML v1，`sw_storage_config` 动态配置表为「深度后续」未实现——`knowledge/features/storage-multi-provider.md` 第 40-50 行 YAML v1 决策与范围外清单）。

**真实先例 `sw_bpm_ext_datasource`**（`sw-bootstrap/src/main/resources/db/migration/h2/V3__external_datasource.sql:6-24`，PG 同路径同版）：

| 列 | 类型（H2 / PG） | 说明 |
|----|------|------|
| `id` | bigint PK | |
| `name` | varchar(100) not null | 唯一索引 `uk_sw_bpm_ext_ds_name` |
| `type` | varchar(50) not null | 数据源类型 |
| `jdbc_url` / `driver_class` | varchar(500)/(200) not null | |
| `username` | varchar(100) not null | |
| **`password_cipher`** | **clob（H2）/ text（PG）not null** | 密文列（AesGcmCipher 加密结果）；Java 侧 `@JsonIgnore` 屏蔽 |
| `read_only` / `enabled` | smallint not null default 1 | 布尔位 |
| + 审计字段 | create_time/create_by/update_time/update_by/deleted/tenant_id/version | |

配套表 `sw_bpm_ext_sql_execution_audit`（SQL 执行审计，非本任务重点）。

## 3. 「多提供商类型」字段表示（Q3）

**惯例：varchar 列 + Java String 字段，无 CHECK 约束、无 Java enum 类。**

- **表结构**：`sw_storage_file.provider_type VARCHAR(32) NOT NULL DEFAULT 'local'`（`V16__init_storage_file.sql` 第 12 行，H2/PG 同型；无 CHECK）
- **Java 侧**：`StorageFile extends BaseEntity`，`private String providerType`（`sw-basic-storage-biz/.../entity/StorageFile.java:52`）；`StorageProvider` 接口 `String getType()`，4 个实现类（Local/Minio/Cos/Qiniu）各自写死返回 `"local"`/`"minio"`/`"cos"`/`"qiniu"`，无 enum 类、无常量类（`StorageProviderRegistry` 按 getType 注册去重）
- **BPM 同构参照**：`sw_bpm_ext_datasource.type varchar(50)` + `ExternalDatasource` 实体 `@TableField("type") private String type`（无 enum）

→ Agent「协议类型」（OpenAI 兼容/Ollama/其他）字段与上述模式同构：varchar + String。

## 4. 连通性测试端点（Q4）

**HTTP 连通性测试端点：未找到任何先例。** 全仓库 Controller 层无 test/connect/ping 端点：

- `StorageController`（`sw-basic-storage-biz/.../controller/StorageController.java`）5 端点：`POST /storage/files/upload`、`GET /storage/files`（分页）、`GET /storage/files/{storageKey}`、`DELETE /storage/files/{storageKey}`、`GET /storage/files/{storageKey}/download`——无连通性测试
- `ExternalDatasourceController`（`sw-bpm-engine/.../controller/ExternalDatasourceController.java`）5 端点：`POST /api/workflow/external-datasource/execute`、`POST`（create）、`PUT /{id}`、`DELETE /{id}`、`GET /{id}`——无独立 test-connection

**但存在 Manager 层连通性测试能力（非 HTTP）**：`ExternalDatasourceManager.testConnection(ExternalDatasource entity)`（`ExternalDatasourceManager.java:55-67`）——用最小连接池（max 1）建 HikariDataSource 执行 `SELECT 1` 探活。注意：该方法**不在 Service 接口中、无任何调用方**（grep 仅命中定义处），「连通性验证」实际以 `execute` 端点执行 SQL 失败隐式实现。

→ M07-F01-05 连通性测试 HTTP 端点无仓库先例；Manager 层 `testConnection`（SELECT 1 探活）是最近的内部能力先例。设计决策留给规划层。

## 5. 模块目录分层对比（Q5）

| 维度 | `sw-basic-storage` | `sw-basic-agent` |
|------|------|------|
| 结构 | **-api/-biz 拆分**：`sw-basic-storage-api`（StorageFacade、StorageUploadResult）+ `sw-basic-storage-biz` | **扁平单模块**（直接含 `src/`，仅 `config/AgentGraphAutoConfiguration.java` 一个类） |
| biz 包结构 | `com.sw.ck.storage.{config,controller,entity,impl,mapper,provider,service(.impl)}` | `com.sw.ck.agent.config` |
| Facade | `-api` 定义、`-biz` 实现（`StorageFacadeImpl` 在 biz） | 无 |

→ Agent 新增 Service/Controller/Entity/Mapper 若维持扁平结构，应放 `com.sw.ck.agent.{config,controller,entity,mapper,service(.impl)}` 子包（参照 iot/knowledge 同形扁平模块）。

## 6. 审计字段与 ORM 基类（Q6）

**ORM：MyBatis-Plus**（`@TableName`/`@TableId`/`@TableLogic`/`@Version` + `BaseMapper` + MP `Page`）。

**基类**（`sw-framework/sw-common/.../entity/`）：
- `BaseEntityNoTenant`：`id`（`@TableId(type=IdType.ASSIGN_ID)`）、`createTime`/`createBy`（`@TableField(fill=FieldFill.INSERT)`）、`updateTime`/`updateBy`（`fill=INSERT_UPDATE`）、`deleted`（`@TableLogic`，Integer）、`version`（`@Version`，插入填充 0）
- `BaseEntity extends BaseEntityNoTenant`：追加 `tenantId`（`fill=INSERT`）

**SQL 审计字段集合**（与 V3/V16 脚本一致）：`id/create_time/create_by/update_time/update_by/deleted SMALLINT DEFAULT 0/tenant_id BIGINT DEFAULT 0/version BIGINT`。索引惯例：`idx_{table}_tenant_deleted (tenant_id, deleted)`（V16 第 25 行）。

## 7. Flyway 迁移脚本规范（Q7）

**locations**（`sw-bootstrap/application.yml:53-59`）使用 `{vendor}` 占位符 + 模块子目录：

```yaml
- classpath:db/migration/{vendor}          # 基础：V1-V6、V10、V11、V13、V15、V18
- classpath:db/migration/bpm/{vendor}      # V8、V14
- classpath:db/migration/notify/{vendor}   # V9
- classpath:db/migration/form/{vendor}     # V7、V12
- classpath:db/migration/storage/{vendor}  # V16
- classpath:db/migration/job/{vendor}      # V17
```

（`validate-on-migrate: true`、`out-of-order: false`、`table: flyway_schema_history`；`mysql/`、`oracle/` 目录仅含 README 占位）

**版本号：全局共享递增**（非模块隔离），命名 `V{N}__snake_case.sql`。

**脚本放置位置：两种方式并存**（靠 classpath 汇总加载，同一 locations 配置）：
- (a) **bootstrap 直接放置**：storage（V16）、job（V17）→ `sw-bootstrap/src/main/resources/db/migration/{storage,job}/{h2,postgresql}/`
- (b) **模块自身 resources**：notify（V9）、form（V7/V12）、bpm（V8/V14）
- **agent 已预留**：`sw-basic-agent/src/main/resources/db/migration/agent/.gitkeep`（空目录，方式 b 的现成位置；`application.yml` locations 尚无 `agent` 条目，需新增）

**PG 与 H2 差异点**：结构相同（同为 BIGINT/TIMESTAMP/SMALLINT/VARCHAR），差异为 ① PG 版含 `COMMENT ON TABLE/COLUMN` 语句，H2 版无；② 大文本列 H2 用 `clob`、PG 用 `text`（`password_cipher`、`sql_text`、`error_message`）。

## 8. 「功能开关」模式参照（Q8）

**全仓库统一模式，`sw.agent.enabled` 非孤例**——8 个模块同构（grep 全仓库）：

| 模块 | 配置类 | 开关 |
|------|------|------|
| storage | `StorageAutoConfiguration`（`sw-basic-storage-biz`） | `sw.storage.enabled=true` |
| job | `JobAutoConfiguration` | `sw.job.enabled=true` |
| notify | `NotifyAutoConfiguration` | `sw.notify.enabled=true` |
| iot | `IotAutoConfiguration` | `sw.iot.enabled=true` |
| knowledge | `KnowledgeAutoConfiguration` | `sw.knowledge.enabled=true` |
| bpm | `BpmEngineAutoConfiguration`/`BpmProcessAutoConfiguration`/`BpmDeployRunner` | `sw.bpm.enabled=true` |
| form | `FormAutoConfiguration` | `sw.form.enabled=true` |
| agent | `AgentGraphAutoConfiguration` | `sw.agent.enabled=true`（**yml 中无配置段**，默认关闭） |

**完整版参照（storage）**：`@AutoConfiguration + @ConditionalOnProperty(prefix="sw.storage", name="enabled", havingValue="true") + @EnableConfigurationProperties(StorageProperties.class) + @MapperScan("com.sw.ck.storage.mapper") + @ComponentScan({provider,controller,service,impl})`（`StorageAutoConfiguration.java:15-20`）。agent 的 `AgentGraphAutoConfiguration` 为空壳（仅开关注解）。

**yml 位置**：`application.yml` 顶层 `sw:` 段按模块分节（99-160 行）：`storage`（含 4 提供商明文凭证段）、`job`、`tenant`、`external-datasource`、`security`；已开启 `storage.enabled: true`、`job.enabled: true`。**无 `sw.agent` 段**（grep 零命中）——启用 agent 需新增该段。

**Spring AI 配置已在 bootstrap 预留**（`application.yml:78-89`）：`spring.ai.openai.api-key: ${OPENAI_API_KEY:}` + `model: gpt-4o`、`spring.ai.ollama.base-url: http://localhost:11434` + `model: llama3`——与 sw-basic-agent pom 双 starter（`spring-ai-starter-model-openai` + `spring-ai-starter-model-ollama` + `langgraph4j-core`）呼应，是 Agent 模型接入的现成配置位。

## 9. 权限码命名规范（Q9）

**格式：`模块:实体:动作`（冒号分层小写）**。实例：

- **后端 `@PreAuthorize` 完整实例**（`ExternalDatasourceController.java`）：
  - `workflow:datasource:manage`（create/update/delete/getById，第 62/71/81/89 行）
  - `workflow:datasource:execute`（SQL 执行，第 45 行）
- **前端 seed 完整实例**（`Smart-WorkFlow-Web/src/foundation/mock/seeds.ts`）：权限列表（第 24-37 行）`system:view`、`form:view`、`form:form:view`、`workflow:view`、`notify:view`、`system:user:list`、`system:role:list`、`system:dept:list`、`system:post:list`、`storage:view`、`job:view`、`job:list`、`job:log`；菜单行内权限如 `system:dict:view`（第 68 行）、`form:design:view`（第 135 行）；**`agent:view` 已注册**（菜单 id=5，第 213 行）
- 动作词库：`view`（菜单）/`list`/`manage`/`execute`/`log`/`design` 等

→ 推测的 `agent:model:add`/`agent:model:edit` 格式与仓库惯例（`模块:实体:动作`）吻合，但**无 CRUD 逐动作拆分的现成先例**——现有模块多用 `view`/`list` 或 `manage` 聚合（storage 仅 `storage:view`，datasource 用 `manage`+`execute` 两档）。

---

## 10. 未确认事项（与任务预期的偏差，如实标注）

1. **storage 凭证加密假设不成立**（任务背景与 Q1/Q2 预期）：storage-multi-provider **没有**实现凭证加密存储——AccessKey/SecretKey 以明文 YAML + 环境变量注入（`StorageProperties` 无加密逻辑，storage 模块零 crypto 引用）。仓库中真正实现「凭证加密存储」的是 **BPM 外部数据源（`sw_bpm_ext_datasource.password_cipher` + AesGcmCipher）**，本回执 Q1/Q2 已给出其完整事实作为替代先例。
2. **连通性测试 HTTP 端点无先例**（Q4）：storage 与 external-datasource 均无 test/connect/ping REST 端点，明确标注「未找到」；但 BPM `ExternalDatasourceManager.testConnection()`（SELECT 1 探活）是 Manager 层能力先例，无调用方、未暴露为端点。
3. **无 Java enum 类型字段先例**（Q3）：仓库惯例为 varchar + String（无 CHECK、无 enum），与任务提问预设的「enum 列 + CHECK 约束」不符，按实际汇报。
4. **PG/H2 差异补充**（Q2/Q7 修正先前回执）：除 PG 含 `COMMENT ON` 外，大文本列 H2 用 `clob`、PG 用 `text`（`password_cipher` 等）。
5. **新线索**（Q7）：`sw-basic-agent` 已存在 `src/main/resources/db/migration/agent/.gitkeep` 预留目录（模块自身 resources 方式 b），但 `application.yml` flyway locations 尚无 `agent` 条目。

---

## 附：证据路径索引

- 加密工具：`Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/crypto/AesGcmCipher.java`
- 加密使用方：`Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/service/impl/ExternalDatasourceServiceImpl.java`、`.../datasource/ExternalDatasourceManager.java`（含 testConnection 第 55 行）、`.../config/BpmEngineAutoConfiguration.java`（第 54-59 行）、`Smart-WorkFlow/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormSubmitService.java`（第 360-369 行）
- 密文表：`Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/{h2,postgresql}/V3__external_datasource.sql`（H2 `password_cipher clob` 第 20 行 / PG `text`）
- 存储元数据表：`Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/{h2,postgresql}/storage/V16__init_storage_file.sql`（`provider_type VARCHAR(32)` 第 12 行，PG 版含 COMMENT ON）
- 实体：`.../sw-basic-storage-biz/.../entity/StorageFile.java`（第 16-52 行）、`.../provider/StorageProvider.java` + 4 实现类、`.../sw-bpm-engine/.../entity/ExternalDatasource.java`（type String + passwordCipher @JsonIgnore）
- 基类：`Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/entity/BaseEntityNoTenant.java` + `BaseEntity.java`
- 分层：`Smart-WorkFlow/sw-basic/sw-basic-storage/`（sw-basic-storage-api + sw-basic-storage-biz）vs `Smart-WorkFlow/sw-basic/sw-basic-agent/`（扁平，仅 config 包）
- Flyway：`Smart-WorkFlow/sw-bootstrap/src/main/resources/application.yml:51-63`（locations）、`db/migration/{h2,postgresql,storage,job,mysql,oracle}` 目录树、agent 预留 `sw-basic-agent/src/main/resources/db/migration/agent/.gitkeep`
- 开关：`StorageAutoConfiguration.java` 等 8 模块 `@ConditionalOnProperty`（grep 证据）
- Spring AI 配置位：`Smart-WorkFlow/sw-bootstrap/src/main/resources/application.yml:78-89`；`sw-basic-agent/pom.xml`（openai+ollama starter + langgraph4j-core）
- 权限码：`.../sw-bpm-engine/.../controller/ExternalDatasourceController.java:45,62,71,81,89` + `Smart-WorkFlow-Web/src/foundation/mock/seeds.ts:24-37,68,135,213`
- 知识库佐证：`/data/reasonix/files/knowledge/features/storage-multi-provider.md`（第 40-50 行：YAML v1 决策、`sw_storage_config` 范围外）
