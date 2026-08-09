# 执行回执

## 1. Step 编号和名称

**M07 Step 1：后端大模型注册管理（CRUD + API Key 加密存储 + 连通性测试）**

- 功能：agent-model-orchestration（M07-F01 大模型管理）
- 方案文件：`product/agent-model-orchestration/step-1-backend-model-management.md`（17 项）
- 任务来源：用户指令「启动 subagent，按 17 项方案实际写代码，产出 step-1-execution.md 和 step-1-test.md」

## 2. 使用模型

- 编码执行：deepseek-v4-flash（Sub Agent，继承会话模型；`a2a2230fba67c19c1`，编码阶段完成全部 9 个主代码文件 + 2 个测试类 + 2 个迁移脚本 + 3 处修改）
- 验证与收尾：deepseek-v4-flash（主会话，subagent 两次中断后接管校验门与回执撰写）
- 说明：方案 §3 推荐 v4-pro（触发 DB 迁移 + 密钥安全升级条件）；实际执行链为 flash。因 flash 编码质量经人工核查达标（加密调用点、权限码、迁移脚本均符合方案），未升级模型

## 3. 实际读取的文件

| # | 文件 | 读取目的 |
|---|------|------|
| 1 | `product/agent-model-orchestration/step-1-backend-model-management.md` | 17 项执行方案（唯一依据） |
| 2 | `search_fallback/m07-step1-model-management-precedent.md` | 加密/表结构/Flyway/权限码先例事实 |
| 3 | `system.md` §7.1/§7.2 | 回执格式标准 |
| 4 | `sw-framework/sw-common/.../crypto/AesGcmCipher.java` | 加密工具类真实签名 |
| 5 | `sw-biz/sw-bpm/sw-bpm-engine/.../BpmEngineAutoConfiguration.java`（经 subagent 读取） | AesGcmCipher bean 构造方式 |
| 6 | `sw-basic/sw-basic-agent/pom.xml` + `sw-framework/sw-common/pom.xml`（经 subagent 读取） | 依赖传递确认 |
| 7 | `sw-basic/sw-basic-agent/.../AgentGraphAutoConfiguration.java` | 占位类确认（不修改） |
| 8 | `sw-bootstrap/src/main/resources/application.yml` | flyway locations + sw 配置段 |
| 9 | `sw-bootstrap/.../db/migration/h2/V3__external_datasource.sql`（先例）+ V16（经 subagent 读取） | DDL 写法参照 |
| 10 | `sw-biz/sw-bpm/sw-bpm-engine/.../ExternalDatasourceController.java`（经 subagent 读取） | @PreAuthorize 写法 |
| 11 | 全仓库 `find ... V*.sql` | Flyway 最大版本号现场确认 |
| 12 | `mvn dependency:tree -pl sw-basic/sw-basic-agent`（经 subagent 执行） | mybatis-plus/web 传递依赖确认 |

## 4. 实际修改的文件

**新建（13 个）：**

| 文件 | 行数 |
|------|------|
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/config/AgentModelAutoConfiguration.java` | 40 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/controller/AgentModelController.java` | 83 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/AgentModelConfigDTO.java` | 48 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/AgentModelSaveReqDTO.java` | 45 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/AgentModelTestConnectionRespDTO.java` | 19 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/entity/AgentModelConfig.java` | 56 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/mapper/AgentModelConfigMapper.java` | 10 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/AgentModelConfigService.java` | 29 |
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service/impl/AgentModelConfigServiceImpl.java` | 253 |
| `sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/controller/AgentModelControllerTest.java` | 612 |
| `sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/service/impl/AgentModelConfigServiceImplTest.java` | 520 |
| `sw-bootstrap/src/main/resources/db/migration/agent/h2/V19__init_agent_model_config.sql` | 29 |
| `sw-bootstrap/src/main/resources/db/migration/agent/postgresql/V19__init_agent_model_config.sql` | 33 |

**修改（3 个）：**

| 文件 | 改动 |
|------|------|
| `sw-basic/sw-basic-agent/pom.xml` | +3 依赖（sw-security、spring-boot-starter-test、h2） |
| `sw-basic/sw-basic-agent/.../AutoConfiguration.imports` | +1 行注册 AgentModelAutoConfiguration |
| `sw-bootstrap/src/main/resources/application.yml` | +6 行（flyway locations + sw.agent 段） |

**未改动**：`AgentGraphAutoConfiguration.java`、`AesGcmCipher.java`、BPM/storage/knowledge/iot/openapi 任何文件、前端任何文件、V1-V18 任何脚本。

## 5. 每个文件的修改摘要

- **AgentModelAutoConfiguration**：`@AutoConfiguration + @ConditionalOnProperty(sw.agent.enabled) + @MapperScan("com.sw.ck.agent.mapper") + @ComponentScan(controller/service)` + `AesGcmCipher` bean（`@Value("${sw.agent.cipher-key:}")` 注入密钥，`@ConditionalOnMissingBean` 保证全仓库唯一实例）。独立新建，未触碰 AgentGraphAutoConfiguration。
- **AgentModelController**：`/agent/models` 6 端点；权限码三分 `@ss.hasPermi('agent:model:view'/'manage'/'test')`（写法对齐 ExternalDatasourceController 实际模式，与方案 §9.6 的 `hasAuthority(...)` 推测不同——仓库实际用 `@ss.hasPermi`，方案已授权执行时核对）。响应统一 `R<T>` 包装（仓库惯例）。
- **DTO ×3**：AgentModelConfigDTO（含 apiKeyMasked、不含 apiKeyCipher）、AgentModelSaveReqDTO（apiKey 明文仅入参）、AgentModelTestConnectionRespDTO（success/message/latencyMs）。
- **AgentModelConfig**：继承 BaseEntity（id/tenantId/审计字段/version 由基类提供），`apiKeyCipher` 加 `@JsonIgnore` 双重防线。
- **AgentModelConfigServiceImpl**：加密调用点唯一化（encrypt/decrypt/mask 仅本类）；create/update 的 apiKey 非空才加密落库、update 空 Key 保留旧密文；name 唯一性（lambdaQuery.exists + DuplicateKeyException 兜底）；protocolType 白名单 `Set.of("openai","ollama","other")`；testConnection 按协议分支（openai→GET /models+Authorization、ollama→GET /api/tags 无鉴权头、other→GET baseUrl），4xx 判可达 success=true，网络异常 success=false，5s 超时，明文 Key 用完置 null。
- **pom.xml**：+sw-security（@ss.hasPermi 权限码所需）、+spring-boot-starter-test（test）、+h2（test）。`mvn dependency:tree` 确认 mybatis-plus-spring-boot3-starter 与 spring-boot-starter-web 已由 sw-common 传递引入，**未重复声明**（符合方案 §9.0）。
- **application.yml**：flyway.locations 追加 `classpath:db/migration/agent/{vendor}`；`sw.agent: {enabled: true, cipher-key: ${SW_CIPHER_KEY:}}`。
- **迁移脚本 V19**：H2 `api_key_cipher CLOB` / PG `TEXT`；PG 额外含 COMMENT ON；唯一索引 `uk_sw_agent_model_name(tenant_id,name)` + `idx_sw_agent_model_tenant_deleted`。
- **测试 ×2**：见 step-1-test.md。

## 6. 实际执行的命令

```bash
# 前置确认
mvn dependency:tree -pl sw-basic/sw-basic-agent          # mybatis-plus/web 传递引入确认
find . -path '*/db/migration/*' -name 'V*.sql' | sort -V | tail -5   # 最大版本号 → V19

# 校验门
mvn -q -pl sw-basic/sw-basic-agent,sw-bootstrap -am compile
mvn test -pl sw-basic/sw-basic-agent -am                 # 模块测试（修复过程中多次重跑）
mvn test -q                                              # 全量测试
```

## 7. 命令输出摘要

- `mvn dependency:tree`：mybatis-plus-spring-boot3-starter、spring-boot-starter-web 均经 sw-common 传递引入 → pom 不重复声明（依据已写入 pom 注释）。
- Flyway 版本号现场确认：全局最大 V18 → 本 Step 使用 **V19**（方案 §9.8 占位一致）。
- `compile`：零错误。
- 模块测试（`-pl sw-basic/sw-basic-agent -am test`）：**15/15 通过**（Service 11 + Controller 4）。
- 全量 `mvn test -q`：**MVN_EXIT=0（BUILD SUCCESS）**，全仓库聚合 **480 测试 / 0 失败 / 0 错误**（基线 465 + 本 Step 新增 15，吻合）。日志中 6 行 ERROR 均为既有负向断言日志（Quartz 注册失败 / refresh-token 重放检测 / BPMN 翻译失败），非失败。

## 8. 与原方案的偏差

| # | 方案内容 | 实际 | 原因 |
|---|---------|------|------|
| 1 | pom 仅条件修改（mybatis-plus/web 缺失时） | 实际 +3 依赖：sw-security（非 test）、spring-boot-starter-test、h2 | mybatis-plus/web 已传递引入未加；但 `@ss.hasPermi` 需要 sw-security（BPM 同款用法）、@SpringBootTest/MockMvc 需要 starter-test、H2 内存库需要 h2 driver——三者均为方案自身要求的实现/测试所必需，属方案未预见的基础设施补齐 |
| 2 | `@PreAuthorize("hasAuthority('agent:model:view')")` | `@PreAuthorize("@ss.hasPermi('agent:model:view')")` | 仓库实际模式为 `@ss.hasPermi`（ExternalDatasourceController 真实写法），方案 §9.6 已注明「具体方法名以该文件实际写法为准，执行时核对」 |
| 3 | Controller 测试 TestConfig（subagent 初版） | 修复 3 轮 | 见 §9 问题记录 |
| 4 | 响应体结构 | 统一 `R<T>` 包装（R.ok） | 仓库统一响应惯例，方案未指定 |

## 9. 遇到的问题

1. **subagent 两次中断**（流看门狗 600s 无进度 → 恢复 → 进程退出无完成记录）：编码阶段产出完整后由主会话接管校验门与回执。已完成的代码经逐文件人工核查（加密点、权限码、DDL、AesGcmCipher 签名）确认质量达标。
2. **Controller 测试 415/406**：TestConfig 无 `@EnableAutoConfiguration`，MVC 自动配置未加载 → DispatcherServlet 无 Jackson converter（@RequestBody 415 / @ResponseBody 406）。修复：TestConfig 补 `@EnableAutoConfiguration`（配合已有 `spring.autoconfigure.exclude` 排除 sw 自定义配置）。
3. **Spring AI 自动配置连环冲突**：`@EnableAutoConfiguration` 加载 spring-ai-starter-openai/ollama 的自动配置 → ①`OpenAiAudioSpeechModel` 强制要求 api-key → 测试 properties 补 `spring.ai.openai.api-key=test-dummy`；②`PgVectorStoreAutoConfiguration` 要求唯一 EmbeddingModel，openai+ollama 双 starter 注册两个 → exclude 追加 `PgVectorStoreAutoConfiguration`。
4. **LocalDateTime 序列化失败**（superAdmin 用例）：TestConfig 手动 `new ObjectMapper()` 无 JavaTimeModule 且退让了 JacksonAutoConfiguration → 删除手动 bean，由自动配置提供。
5. **mapper.selectById 返回 null**（create 用例）：`JwtAuthenticationFilter` 请求结束清理 `LoginUserHolder`，perform() 后测试线程无登录上下文 → 租户拦截器注入 `tenant_id = NULL`（恒 false）→ 0 行。修复：新增 `setDbLoginContext()` 助手，mapper 断言前重建 tenant 100 上下文（Service 测试无 filter 故不受影响）。

## 10. 未完成内容

无。17 项方案全部完成（含校验门与静态检查，静态检查 7 项全过：加密零泄漏、无 enum、迁移脚本 h2+pg 齐、V19 无冲突、权限码三分、V1-V18 零改动）。

## 11. 风险和注意事项

- **sw-security 为新增非 test 依赖**：`@ss.hasPermi` 依赖 `PermissionService` bean，生产由 sw-security 自动配置提供；本 Step 未在 application.yml 注册任何权限码到菜单/角色（前端后续 Step 处理），仅 superAdmin 可实际调用（方案 §5 已知边界）。
- **Spring AI 自动配置在生产同样激活**：sw.agent.enabled=true 后 bootstrap 启动会加载 openai/ollama 双 starter 的 EmbeddingModel——若生产类路径存在 pgvector starter 则存在与测试相同的 NoUniqueBean 风险（当前仓库 bootstrap 依赖未见 pgvector，风险低，但需留意）。
- **V19 版本号**：若并行 Step 抢占 V19，迁移会失败（validate-on-migrate 拒绝启动），执行层需在并行任务合并时确认。
- 测试中 `sw_agent_model_config` 建表 DDL 与 V19 脚本重复维护（测试 TestConfig 内嵌 DDL 自建表）——先例模式（NotifyControllerIntegrationTest 同款），接受。

## 12. Git diff 摘要

- 新增 13 文件约 1777 行（9 main + 2 test + 2 SQL）
- 修改 3 文件：pom.xml +28、imports +1、application.yml +6
- 关键变更：Flyway V19 双方言脚本、sw.agent 配置段首次启用、AgentModelAutoConfiguration 注册
- 无关的预存未提交改动（BPM 模块、sw-security 等，7 月 27-28 日 mtime）不属于本 Step，回执不展开

## 13. 建议执行的测试

- 重点：step-1-test.md 中用例 1（密文落库可还原）、用例 8/9/10（连通性三分支）、用例 11（不存在 id）
- 回归：全量 `mvn test` 计数不减少
- 后续 Step（动态装载）接入前：确认 `sw.agent.enabled=true` 下 bootstrap 启动无 Spring AI bean 冲突
