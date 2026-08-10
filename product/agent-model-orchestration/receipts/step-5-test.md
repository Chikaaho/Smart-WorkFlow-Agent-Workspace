# 测试回执

## 1. 测试范围与新增用例清单

基线：D61 after-Step4 **328 tests**（memory/state.md）。本 Step 新增 **13** 个用例，全量 **341**。

### 1.1 新增测试类（2）

**`AgentModelConfigMapperTest`**（新建，候选查询语义，@SpringBootTest + H2 + TestConfig 同款装配）：

| 用例 | 验证点 | 对应验收 |
|---|---|---|
| 1. `findCandidate_ordersBySort` | 同组 3 条不同 sort → 返回 sort 最小者 | 验收 4 |
| 2. `findCandidate_excludesFutureLocked` | locked_until 未过期（now+1h）被排除 | 验收 5 |
| 3. `findCandidate_expiredLockIsAvailable` | locked_until 已过期（now-1h）重新可用（惰性过期） | 验收 6 |
| 4. `findCandidate_excludesTriedIds` | excludeIds 排除最小 sort → 返回次小；全排除 → null（终止） | 验收 7 |
| 5. `findCandidate_enabledDigitLiteral_noSqlError` | `.eq(enabled, 1)` 数字字面量 H2 无 SMALLINT/BOOLEAN 异常 + enabled=0 排除 + 同 sort 按 id 升序 | 验收 9（§5 V3） |

**`ChatModelFactory429SpikeTest`**（spike agent 新建并固化，纯 JUnit + JDK HttpServer，无 Spring 上下文）：

| 用例 | 验证点 | 对应验收 |
|---|---|---|
| `testRealHttp429ExceptionChain` | V1 真实 429 异常链（NonTransientAiException "429 - too many requests"，无 RestClientResponseException）+ V2 RetryTemplate 计数（retryCount=2 → hits=3）+ 消息含 429 判断途径 | 验收 10（§5 V1/V2） |

### 1.2 新增用例（追加至既有测试类，3 类）

**`AgentOrchestrationServiceImplTest`**（用例 8 → 14，全部走真实 mock HTTP 链路，不构造假异常对象）：

| 用例 | 验证点 | 对应验收 |
|---|---|---|
| 9. `run_switchesToNextKeyOnQuotaExceeded` | 同组 2 条：sort 0 指向恒 429 服务、sort 1 正常 → 切换成功，`usedModelConfigId` = 第二条 id，429 服务恰 1 次请求 | 验收 4 |
| 10. `run_locksCurrentConfigOnQuotaExceeded` | 限流后 DB 中 lockedUntil = now + 60s（±10s 宽容），切换候选不被锁定 | 验收 5 |
| 11. `run_failsWhenAllCandidatesExhausted` | 组内 3 条全 429 → success=false，每个服务恰 1 次请求（triedIds 去重），3 条均被锁定，usedModelConfigId=null | 验收 7 |
| 12. `run_noSwitchWhenGroupKeyNull` | groupKey=null 独立配置遇 429 → 直接失败；其他组候选 0 请求（无跨组/越权切换）；独立配置不被锁定 | 验收 3 |
| 13. `run_noSwitchOnNonQuotaException` | 连接拒绝（网络异常）→ 失败、不锁定、同组正常候选 0 请求 | 验收 8 |
| 14. `isQuotaExceededException_detects429` | 反射单测私有方法：NonTransientAiException(429)=true / 401/500=false / CompletionException 穿透=true / HttpClientErrorException.TooManyRequests 兜底=true / 500=false / null=false | 验收 10（§4.1 实现语义） |

**`AgentModelConfigServiceImplTest`**（用例 11 → 12）：

| 用例 | 验证点 | 对应验收 |
|---|---|---|
| 12. `saveAndRead_withGroupKeyFields` | create/update 携带 groupKey/sort/quotaCooldownSeconds 正确落库回读；getById DTO 只读展示（含 lockedUntil 透传）；update 空 Key 不覆盖旧密文行为保持 | 验收 2 |

### 1.3 兼容性适配（非新增用例）

实体新增 4 字段后 MyBatis-Plus `selectById` 生成显式列清单——5 个建 `sw_agent_model_config` 表的测试类（编排/模型 Service 测试 + 2 个 Controller 测试 + 工具 Service 测试）DDL 均补 4 列 + `idx_sw_agent_model_group` 索引，与 V24 对齐。既有用例全部保持通过（无回归）。

## 2. 全量测试结果（surefire 摘录）

`mvn test`（根 pom reactor，排除 `.claude/worktrees/` 无此目录）→ **BUILD SUCCESS**，模块汇总：

| 模块 | Tests run | Failures | Errors |
|---|---|---|---|
| sw-common | 4 | 0 | 0 |
| sw-security | 4 | 0 | 0 |
| sw-storage | 12 | 0 | 0 |
| sw-notify | 7 | 0 | 0 |
| sw-job | 37 | 0 | 0 |
| **sw-basic-agent** | **79** | **0** | **0** |
| sw-system | 65 | 0 | 0 |
| sw-form | 76 | 0 | 0 |
| sw-bpm | 57 | 0 | 0 |
| **合计** | **341** | **0** | **0** |

- **341 = 328 基线 + 13 新增** ✓（≥ 328 + 新增数，0 failures 0 errors，验收 12）
- sw-basic-agent 79 = 既有 67（含 spike 1）+ 新增 12（Mapper 5 + 编排 6 + 模型 1）

### sw-basic-agent 关键测试类摘录（surefire 原文）

```
Tests run: 14, Failures: 0, Errors: 0, Skipped: 0 -- AgentOrchestrationServiceImplTest   （8 既有 + 6 新增）
Tests run: 12, Failures: 0, Errors: 0, Skipped: 0 -- AgentModelConfigServiceImplTest    （11 既有 + 1 新增）
Tests run: 5,  Failures: 0, Errors: 0, Skipped: 0 -- AgentModelConfigMapperTest          （新建）
Tests run: 1,  Failures: 0, Errors: 0, Skipped: 0 -- ChatModelFactory429SpikeTest        （spike 固化）
Tests run: 3,  Failures: 0, Errors: 0, Skipped: 0 -- AgentOrchestrationControllerTest    （既有，DDL 兼容）
Tests run: 4,  Failures: 0, Errors: 0, Skipped: 0 -- AgentModelControllerTest            （既有，DDL 兼容）
Tests run: 7,  Failures: 0, Errors: 0, Skipped: 0 -- AgentToolConfigServiceImplTest      （既有，DDL 兼容）
```

## 3. 测试设计说明（防凑造声明）

- 编排用例 9-13 全部走**真实链路**：mock HttpServer 返回真实 HTTP 429/200 → `ChatModelFactory.build` 构造真实 `OpenAiChatModel` → `agentCompiledGraph.invoke` → ServiceImpl 真实 catch → 断言服务器请求计数。未构造任何假异常对象（§10 禁止 7）
- 429 识别依赖 V1 实测语义（NonTransientAiException + 消息含 "429"），spike 测试断言固化该语义，未来 Spring AI 升级行为变化时如实报错
- 用例 12/13 通过"其他候选服务请求计数为 0"证明无越权/错误切换，不依赖内部查询细节
