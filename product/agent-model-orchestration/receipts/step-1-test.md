# 测试回执

## 1. Step 编号和名称

**M07 Step 1：后端大模型注册管理（CRUD + API Key 加密存储 + 连通性测试）** — 测试验收

## 2. 测试环境

| 项 | 值 |
|----|----|
| OS | Linux 5.15.0-181-generic |
| Java | 21.0.11 |
| Maven | 3.9.x（仓库根 pom 管理） |
| 数据库 | H2 内存库（MODE=PostgreSQL）；真实 Flyway 迁移在 sw-bootstrap 测试上下文执行（H2 方言） |
| Spring Boot | 3.4.4 |
| 网络 | 无外网依赖——连通性测试全部使用 JDK 内置 `com.sun.net.httpserver.HttpServer`（localhost 随机端口） |

## 3. 测试前置条件

- 编码完成：13 个新文件 + 3 处修改（见 step-1-execution.md §4）
- `application.yml` 已追加 `classpath:db/migration/agent/{vendor}` 与 `sw.agent.enabled: true`
- V19 迁移脚本（H2 + PG 双方言）就位
- 测试密钥：32 字节 "0123456789abcdef0123456789abcdef" 的 Base64（仅测试用，走真实 AesGcmCipher 加密流程）

## 4. 实际执行的测试命令

```bash
# 1. 模块级（Service + Controller 全量）
mvn test -pl sw-basic/sw-basic-agent -am
# 2. 全量（含 sw-bootstrap 真实 Flyway H2 迁移 + 全部既有模块回归）
mvn test -q
# 3. 单类调试（修复期间使用）
mvn test -pl sw-basic/sw-basic-agent -Dtest='AgentModelControllerTest' -Dsurefire.failIfNoSpecifiedTests=false -am
```

## 5. 各测试项结果

### 5.1 AgentModelConfigServiceImplTest（11 用例，8.267s）

| # | 用例 | 预期 | 实际 | 通过 |
|---|------|------|------|:---:|
| 1 | `create_shouldEncryptApiKey` | apiKeyCipher 非明文且 decrypt 可还原 | 密文 ≠ 明文，`AesGcmCipher.decrypt` 还原 == "sk-test-123456" | ✅ |
| 2 | `create_withoutApiKey_shouldStoreNullCipher` | apiKey 空 → 密文 null | selectById 断言 `apiKeyCipher == null` | ✅ |
| 3 | `update_withEmptyApiKey_shouldKeepOldCipher` | update 空 Key 保留旧密文 | decrypt 旧密文 == "old-key-abc" | ✅ |
| 4 | `getById_shouldReturnMaskedKey` | apiKeyMasked = "sk\*\*\*\*56"；DTO 无 apiKeyCipher 字段 | 脱敏格式精确匹配；反射断言 DTO 类无该字段 | ✅ |
| 5 | `create_duplicateName_sameTenantThrows_crossTenantAllowed` | 同租户重名抛 BaseException；跨租户（TENANT_200）允许 | 同租户抛「已存在」；跨租户创建成功且 tenant_id=200 | ✅ |
| 6 | `create_withInvalidProtocol_shouldThrow` | "foo" 拒绝且不落库 | BaseException「不支持的协议类型」；selectCount==0 | ✅ |
| 7 | `pageModels_shouldFilterByKeyword` | 关键字过滤 + 分页参数 | "model" 过滤 2/3；空关键字 3/3；pageSize=2 生效 | ✅ |
| 8 | `testConnection_openai_shouldSucceed` | openai + 假服务 200 → success=true | 断言 success=true、message 非空、latencyMs≥0 | ✅ |
| 9 | `testConnection_ollama_shouldNotSendAuthHeader` | ollama 无 Authorization 头且 200 | 假服务捕获请求头，`sawAuthHeader==false` | ✅ |
| 10 | `testConnection_unreachable_shouldReturnFailure` | 未监听端口 → success=false | success=false、message 非空、latencyMs≥0 | ✅ |
| 11 | `testConnection_unknownId_shouldThrow` | 不存在 id → NOT_FOUND | BaseException code == CommonErrorCode.NOT_FOUND | ✅ |

### 5.2 AgentModelControllerTest（4 用例，84.80s）

| # | 用例 | 预期 | 实际 | 通过 |
|---|------|------|------|:---:|
| 1 | `page_withoutViewPermission_shouldReturn403` | 无 view 权限 GET → 403 | HTTP 403，body code=403，msg 非空 | ✅ |
| 2 | `create_withManagePermission_shouldSucceed` | manage 权限 POST → 200 + id，密文落库 | code=0、id>0；selectById 密文 ≠ "sk-test-123456" | ✅ |
| 3 | `testConnection_withoutTestPermission_shouldReturn403` | 有 manage 无 test → test-connection 403 | HTTP 403（三权限码互不越权） | ✅ |
| 4 | `superAdmin_shouldBypassAllPermissions` | superAdmin 全端点可调 | GET/POST/GET 详情/POST test-connection（success=false 不抛异常）/DELETE 全 200 | ✅ |

## 6. 通过项

全部 15 个用例通过（11 Service + 4 Controller），0 失败 0 错误 0 跳过。

**连通性测试 3 用例详细断言（§16 重点要求）：**
- 用例 8（openai 成功）：假服务返回 200 → `resp.isSuccess()==true`，message="连接成功"，latencyMs≥0
- 用例 9（ollama 无鉴权头）：假服务捕获到请求，断言 `Authorization` 头**未出现**（`sawAuthHeader==false`），success=true
- 用例 10（连接拒绝）：指向 `findUnusedPort()` 预留的未监听端口 → `success=false`，message 为网络层异常信息（非空），latencyMs≥0——**返回结构而非抛 500**

## 7. 失败项

最终运行（Aug 4 22:26）无失败项。

**测试开发过程失败记录（均已修复，见 execution 回执 §9）：**
1. Controller 测试 415/406（缺 @EnableAutoConfiguration → 无 Jackson converter）→ TestConfig 补注解修复
2. Spring AI 自动配置冲突（api-key 缺失 → dummy 属性；PgVectorStore EmbeddingModel 二义 → exclude）→ 修复
3. LocalDateTime 序列化失败（手动 ObjectMapper 无 JavaTimeModule）→ 删除手动 bean，用自动配置
4. selectById 恒 null（JWT filter 清空 LoginUserHolder → 租户拦截器 WHERE tenant_id=NULL）→ `setDbLoginContext()` 重建上下文

## 8. 跳过项及原因

无跳过项。

## 9. 关键日志或错误信息

- 模块测试最终结果（surefire 报告，22:26）：
  - `Tests run: 11, Failures: 0, Errors: 0, Skipped: 0` — AgentModelConfigServiceImplTest
  - `Tests run: 4, Failures: 0, Errors: 0, Skipped: 0` — AgentModelControllerTest
- 全量测试：`MVN_EXIT=0`，聚合 480 测试 / 0 失败 / 0 错误（sw-bootstrap 真实 Flyway 迁移执行成功——validate-on-migrate: true 下 V19 通过校验，否则整个测试套件无法启动）
- 日志中 6 行 ERROR 均为既有负向断言（Quartz 注册失败、refresh-token 重放检测 ×4、BPMN 翻译失败），与本次改动无关

## 10. 是否满足验收标准

逐条对照方案 §14 全部 13 项：

| # | 验收标准 | 结果 | 证据 |
|---|---------|:---:|------|
| 1 | `sw_agent_model_config` 表建成，字段与 §9.8 一致，含唯一索引 + 租户索引 | ✅ | V19 h2/pg 脚本（静态检查 + 全量测试迁移成功） |
| 2 | AgentModelConfig 继承 BaseEntity | ✅ | 代码审查（`extends BaseEntity`，id/tenantId/审计字段由基类提供） |
| 3 | API Key 落库密文可 decrypt 还原 | ✅ | 用例 1 |
| 4 | update 空 Key 不覆盖旧密文 | ✅ | 用例 3 |
| 5 | 查询 DTO 无 apiKeyCipher，仅 apiKeyMasked | ✅ | 用例 4 + 代码审查（DTO 无字段 + Entity @JsonIgnore 双防线） |
| 6 | protocolType 白名单校验 | ✅ | 用例 6 |
| 7 | CRUD + 分页 5 端点，权限码三分互不越权 | ✅ | Controller 用例 1-3（403 验证） |
| 8 | 连通性测试 openai/ollama 鉴权头差异、不可达返回 success=false | ✅ | 用例 8/9/10 |
| 9 | superAdmin 绕过权限 | ✅ | Controller 用例 4 |
| 10 | compile 零错误，全量测试 BUILD SUCCESS，新增 ≥15，已有不退化 | ✅ | 15 个新用例；480（465 基线 + 15）全绿 |
| 11 | 不修改 AgentGraphAutoConfiguration、无 LangGraph4j 图编排代码 | ✅ | git status 核查（该文件零改动） |
| 12 | 不修改前端任何文件 | ✅ | git status 核查（Smart-WorkFlow-Web 零改动） |
| 13 | Flyway 版本号无冲突，H2/PG 差异仅限 COMMENT + api_key_cipher 类型 | ✅ | 静态检查：V19 唯一（2 文件）；脚本 diff 仅上述两处差异 |

## 11. 回归风险

- **低**。全量 480 测试全绿，无既有模块退化；V19 脚本在 sw-bootstrap 真实迁移路径执行通过（validate-on-migrate 校验）。
- 已提交的 BPM/security 等预存未提交改动（7 月底遗留）不在本 Step 范围，本次全量测试在同一工作区跑通，无交互影响。
- 残余风险：测试类内嵌 DDL 与 V19 脚本重复维护（先例模式）；sw.agent.enabled=true 后生产类路径若引入 pgvector starter 存在 EmbeddingModel 二义风险（当前 bootstrap 依赖无此风险，见 execution 回执 §11）。

## 12. 最终结论

**测试验收通过。** 15 个新增用例（Service 11 + Controller 4）全部通过，全量 480 测试 0 失败 0 错误，方案 §14 全部 13 项验收标准满足。API Key 加密落库、脱敏输出、权限码三分、连通性测试三分支、superAdmin 绕过等关键安全/权限路径均有自动化断言覆盖。
