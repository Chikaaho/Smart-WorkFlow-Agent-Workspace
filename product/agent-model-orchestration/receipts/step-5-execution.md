# 执行回执

## 1. Step 编号和名称

**M07 Step 5：多Key轮询/额度限流**

- 功能：agent-model-orchestration（`sw_agent_model_config` 扩展 group_key/sort/locked_until/quota_cooldown_seconds 4 列；`AgentOrchestrationServiceImpl` 限流识别 + 候选切换重试循环；DTO 扩展含 usedModelConfigId）
- 方案文件：`product/agent-model-orchestration/ready/step-5-multikey-quota.md`（§1-§12 全部 12 节，唯一权威任务定义）
- 任务来源：执行层任务指令（先 §5 V1/V2 spike → V24 SQL → Entity → DTO → ServiceImpl 改造 → 测试 → 全量测试 → 静态检查 → 回执）
- 前置调研：`search_fallback/m07-step5-multikey-quota-precedent.md`（8 问全部 jar 级/行号级/git 提交级证据）
- 上一步回执：`product/agent-model-orchestration/receipts/step-4-execution.md` + `step-4-test.md`
- 测试基线口径：D61 after-Step4 基线 **328 tests**（memory/state.md 确认）
- **执行时间**：2026-08-10（前置侦察 + V1/V2 spike 22:20-23:00；编码 23:00-23:30；模块测试 23:30-23:40；V5 迁移验证 23:45；全量测试 23:50-00:15）
- **改动文件清单（实际）**：新建 4 个（2 SQL + 1 测试类 + 1 spike 测试）+ 修改 7 个（1 实体 + 3 DTO + 2 ServiceImpl + 1 测试）+ 本回执；`ChatModelFactory.java` **零改动**（§4-A 决策保持）

## 2. 使用模型

- 执行模型：deepseek-v4-flash（本会话实际执行；方案推荐 v4-pro，执行层按用户成本优化选择 flash）
- 现场验证 §5 五项全部真实执行（spike 实测 / H2 内存库 RunScript / surefire），无一项以训练记忆补填

## 3. 现场验证结果（方案 §5 五项，全部真实执行）

### §3.1 V1：HTTP 429 到达调用方的真实异常类型链 —— **前置调研假设不成立，已按实测调整实现**

spike 测试 `ChatModelFactory429SpikeTest.testRealHttp429ExceptionChain`（mock HttpServer 恒返 429，`ChatModelFactory.build()` → `OpenAiChatModel.call()` 全真实链路，PASSED）：

```
[0] org.springframework.ai.retry.NonTransientAiException :: 429 - too many requests
```

- 链深仅 1 层，**无 cause**；**cause 链中不存在 `RestClientResponseException`**（方案 §4 B 伪代码的 `instanceof RestClientResponseException` 判断实测不成立）
- 根因：OpenAiApi.Builder 默认把 `RetryUtils.DEFAULT_RESPONSE_ERROR_HANDLER` 注册为 RestClient defaultStatusHandler，`handleError` 对 4xx 直接 `throw new NonTransientAiException(String.format("%s - %s", statusCode, body))`——RestClient 默认错误处理器已被替换，`RestClientResponseException` 整个链路不产生
- 实测可行判断途径（spike 断言固化）：`thrown instanceof NonTransientAiException && thrown.getMessage().contains("429")`
- **实现调整（方案 §5 V1 允许的如实调整）**：`isQuotaExceededException` 沿 cause 链检查 `NonTransientAiException` + 消息含 "429"（主路径），保留 `RestClientResponseException` + statusCode 429 兜底（未来版本/非 Spring AI 路径），穿透 CompletionException 等包装层。见本回执 §4.1

### §3.2 V2：RetryTemplate 对 429 的实际行为 —— **429 会被重试（与常见假设相反），决策不改 ChatModelFactory**

- 实测：`retryCount=2 → maxAttempts=3` 时 mock 服务器收到 **3 次请求**（`hits=3`，断言 `isEqualTo(3)` 固化）
- 根因（字节码实证）：`ChatModelFactory.buildRetryTemplate` 用裸 `RetryTemplate.builder().maxAttempts(n).build()`，未配置 classifier 时回退 `BinaryExceptionClassifier.defaultClassifier()` = {Exception: true} → 任意 Exception（含 NonTransientAiException）重试至 maxAttempts 耗尽；BackOffPolicy 为 NoBackOffPolicy（无重试延迟）
- 时序实测：重试间隔 389ms/15ms（连接层开销，非 backoff）；首次请求前 ~2.6s 为 call() 一次性初始化开销（3 次运行稳定复现 2359/2569/2594ms）
- **影响评估与决策**：429 被重试的后果仅为对已限流服务多打 retryCount 次请求（服务器端计数），**无用户可见延迟放大**（NoBackOffPolicy）。**不改 ChatModelFactory**（§4-A 决策保持）：改 attempts=1 需动工厂（构成 §4-A 例外）且会波及既有 `ChatModelFactoryTest` 500 重试行为用例，收益仅服务器端省 2 次无效请求。多Key轮询切换语义不受影响——重试打满后 429 异常仍以 NonTransientAiException 原样到达 ServiceImpl catch 块（spike 实测），切换逻辑照常触发
- 测试已按实测固化断言；未来 Spring AI 升级行为变化时该测试会如实报错提示回归

### §3.3 V3：`.eq(AgentModelConfig::getEnabled, 1)` 数字字面量合法性与 SQL 语义 —— **编译通过、H2 实测无 SMALLINT/BOOLEAN 异常**

- `LambdaQueryWrapper.eq(SFunction, Object)` 第二参为 Object，`int 1` 装箱 Integer 编译合法（无需 `.apply` 原生片段）
- H2 实测（`AgentModelConfigMapperTest.findCandidate_enabledDigitLiteral_noSqlError` PASSED）：`.eq(enabled, 1)` 生成 `enabled = 1` 参数化查询，SMALLINT 列无类型比较异常；enabled=0 候选被正确排除
- 语义与 74fc415 先例一致（数字字面量，PG 下不产生 boolean vs SMALLINT 比对）

### §3.4 V4：锁定写入方式 —— **lambdaUpdate 只更新 locked_until 列**

现场侦察确认：`AgentModelConfigServiceImpl.update()` 用整实体 `updateById(entity)`，且 Service 层不触碰 version（entity.version=null 时 MP 非空策略下 version 不进 SET/WHERE，乐观锁实际未生效）。锁定写入若复用整实体 `updateById(currentConfig)` 会把 selectById 加载的全字段写回（并发场景可能覆盖其他修改）并触发 version 递增。**决策：`lockCurrentConfig` 用 `mapper.update(null, lambdaUpdate().eq(id).set(lockedUntil))` 只更新目标列**——与方案 §5 V4 的"只更新目标列"要求一致，避免整行覆盖与乐观锁干扰；租户隔离由租户拦截器自动完成。单测用例 10 实测锁定持久化通过

### §3.5 V5：V24 迁移脚本 H2/PG 双 dialect —— **双链执行成功，新列/索引就位**

sw-bootstrap 模块无测试（无 Spring 上下文启动 Flyway 的既有测试），改用 H2 内存库（MODE=PostgreSQL）RunScript 实测完整迁移链：

- **H2 链**（V19 + V24）：执行成功；information_schema 确认 4 新列存在（GROUP_KEY/LOCKED_UNTIL 可空、SORT NOT NULL DEFAULT 0、QUOTA_COOLDOWN_SECONDS NOT NULL DEFAULT 60）、`IDX_SW_AGENT_MODEL_GROUP` 索引存在
- **PG 链**（V19 + V24，H2 MODE=PostgreSQL 近似）：执行成功含 4 条 `COMMENT ON COLUMN` 语句（H2 2.3.232 PG 模式支持该语法；COMMENT 写法与 V19 PG 既有先例一致，真实 PG 可用）；4 新列就位
- 对已有历史行的 `ADD COLUMN ... NOT NULL DEFAULT` 回填默认值属标准行为，双 dialect 实测无额外处理需要

## 4. 实现说明与偏差记录（不得静默修改，均在此如实报告）

### §4.1 偏差 A：`isQuotaExceededException` 实现偏离方案 §4 B 伪代码

**原因**：§3.1 V1 实测推翻"cause 链含 RestClientResponseException(429)"假设（方案 §5 V1 明确要求"若实际异常链与预期不符，执行层必须如实调整实现并在回执中记录，不得强行凑造匹配"）。最终实现：

```java
private boolean isQuotaExceededException(Throwable t) {
    Throwable cur = t;
    while (cur != null) {
        if (cur instanceof NonTransientAiException e
                && e.getMessage() != null && e.getMessage().contains("429")) {
            return true;
        }
        if (cur instanceof RestClientResponseException rcre
                && rcre.getStatusCode().value() == 429) {
            return true;
        }
        cur = cur.getCause();
    }
    return false;
}
```

单测用例 14（`isQuotaExceededException_detects429`）覆盖：NonTransientAiException(429)=true / 401/500=false / 非 AI 异常=false / CompletionException 包装穿透=true / HttpClientErrorException.TooManyRequests 兜底=true / 非 429 RestClientResponseException=false / null=false。

### §4.2 偏差 B：重试循环中会话解析仅执行一次（方案 §4 C 伪代码的补充）

方案伪代码将"现有 session/历史/工具/bind 逻辑不变"整体置于循环体内——若照抄，候选切换重试会**重复创建新会话**（sessionId==null 场景每次尝试都 insert 一条 session，产生脏会话）。实际实现：`sessionId`/`dbMessages` 在循环外声明，`sessionResolved` 标志保证**会话获取/创建仅在首次尝试执行**（候选切换复用同一会话）；"配置非法不落脏数据"约束保持（session 解析仍在 `chatModelFactory.build` 之后，IllegalArgumentException 时解析未执行）。用例 9 切换成功后 `resp.sessionId` 为单一会话且 DB 无重复会话（隐式断言）

### §4.3 决策记录：不改 `ChatModelFactory.java`（§4-A 决策保持）

V2 实测确认 429 会被自建裸 RetryTemplate 重试，但评估结论为无需对 §4-A 决策提例外（理由见 §3.2 影响评估）。`ChatModelFactory.java` git diff 为空（验收 11）

### §4.4 新增测试 13 个（方案目标 ~16-18，未凑数）

实际覆盖全部验收点（候选查询语义 5 + 编排切换/锁定/耗尽/兼容 6 + save 落库 1 + 429 spike 1）。方案表格为"示例"性质，无验收项依赖特定用例数

## 5. 改动文件清单（实际）

### 新建（4）

```
Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/
  h2/V24__alter_agent_model_config_multikey.sql
  postgresql/V24__alter_agent_model_config_multikey.sql
Smart-WorkFlow/sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/
  mapper/AgentModelConfigMapperTest.java                    （候选查询语义 5 用例，含 V3）
  orchestration/ChatModelFactory429SpikeTest.java           （§5 V1/V2 spike，固化为正式测试）
```

### 修改（7）

```
Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/
  entity/AgentModelConfig.java                              （+4 字段：groupKey/sort/lockedUntil/quotaCooldownSeconds）
  dto/AgentModelSaveReqDTO.java                             （+3 字段：groupKey/sort/quotaCooldownSeconds，lockedUntil 不对外）
  dto/AgentModelConfigDTO.java                              （+4 字段：只读展示）
  dto/AgentOrchestrationRunRespDTO.java                     （+1 字段：usedModelConfigId）
  service/impl/AgentModelConfigServiceImpl.java             （toEntity/toDTO 补 4 映射行，CRUD 逻辑不变）
  service/impl/AgentOrchestrationServiceImpl.java           （重试循环 + isQuotaExceededException + lockCurrentConfig + findNextCandidate）
测试：
  service/impl/AgentOrchestrationServiceImplTest.java       （+6 用例，用例 8→14；+insertGroupConfig/429 服务器 helper；DDL +4 列）
  service/impl/AgentModelConfigServiceImplTest.java         （+1 用例 save 落库；DDL +4 列）
  controller/AgentModelControllerTest.java                  （DDL +4 列，selectById 显式列清单兼容）
  controller/AgentOrchestrationControllerTest.java          （DDL +4 列）
  service/impl/AgentToolConfigServiceImplTest.java          （DDL +4 列）
```

### 未改动（验收确认）

- `ChatModelFactory.java`（git diff 为空）、`AgentGraphFactory.java`、`AgentOrchestrationRunReqDTO.java`（请求入参不变）、V19-V23 任何脚本（git diff 为空）、前端文件

## 6. 验收标准对照（方案 §11 全部 14 项）

| # | 验收项 | 结果 | 证据 |
|---|---|---|---|
| 1 | V24 迁移 H2/PG 双模式无报错（4 列 + 1 索引） | ✅ | §3.5 H2/PG 双链实测（sw-bootstrap 无测试，RunScript 替代） |
| 2 | 实体 4 新字段落库回读（sort=0 / quotaCooldownSeconds=60 默认） | ✅ | ConfigServiceImplTest 用例 12 + H2 列默认值查询 |
| 3 | groupKey=null 遇限流行为与 Step4 一致（直接失败不查询候选） | ✅ | 编排测试用例 12：success=false、429 服务仅 1 次请求、其他组候选 0 请求 |
| 4 | 同组按 sort 升序切换，成功后 usedModelConfigId 为实际服务配置 id | ✅ | 编排测试用例 9 |
| 5 | 限流后 lockedUntil = now + quotaCooldownSeconds 并持久化 | ✅ | 编排测试用例 10（60s 冷却，边界断言 ±10s） |
| 6 | lockedUntil 已过期候选重新可用（惰性判断） | ✅ | Mapper 测试用例 3 |
| 7 | 组内耗尽 success=false，尝试次数精确等于组内候选数 | ✅ | 编排测试用例 11（3 条各 1 次） |
| 8 | 非 429 异常（网络超时/连接拒绝）不触发切换 | ✅ | 编排测试用例 13 |
| 9 | `.eq(enabled, 1)` 数字字面量 H2 无 SMALLINT/BOOLEAN 异常 | ✅ | Mapper 测试用例 5（V3） |
| 10 | §5 五项现场验证均给出 spike 结果，V1 附真实异常类名链 | ✅ | §3.1-§3.5 全部附原始输出 |
| 11 | `ChatModelFactory.java` 与 Step4 结束时完全一致（git diff 空） | ✅ | 静态检查 git diff --stat 为空 |
| 12 | 全量 mvn test ≥ 328 + 新增，0 failures 0 errors | ✅ | **341 = 328 + 13**，BUILD SUCCESS（见 step-5-test.md §2） |
| 13 | 权限码仍为 3 枚（view/manage/test），未新增第 4 个 | ✅ | 静态检查 grep 去重 3 枚：view×6 / manage×4 / test×2（main 源码） |
| 14 | V19-V23 脚本 git diff 为空 | ✅ | 静态检查 git diff --stat 为空 |

## 7. 已知限制（方案 §3 不包含项，如实确认）

- 无手动解锁端点（被动过期，`locked_until <= now` 即视为可用）——保持
- 无分布式锁（并发请求允许短暂重复选中同一即将超限 Key）——保持
- 组内候选运营看板/告警——保持留后续
- 跨协议混组不做代码层强制校验——保持
