# Step 5 执行方案：M07-F01 多Key轮询/额度限流

**状态**：Ready — 待执行
**前置**：Step4 PASSED（D61），基线 328 tests（D61，after-Step4）
**范围依据**：`memory/state.md` 已确认下一步——`sw_agent_model_config` 扩展优先级字段 + 轮询状态；`ChatModelFactory` 相关改造；key 达到配额限流时按优先级自动切换
**前置调研**：`search_fallback/m07-step5-multikey-quota-precedent.md`（8 问全部有 jar 级/行号级/git 提交级证据，无训练记忆补填）
**推荐执行模型**：`deepseek/deepseek-v4-pro`（跨 4 层改造：DB 迁移 + 实体 + Mapper 查询 + ServiceImpl 重试循环；异常分类逻辑需要语义判断且必须现场 spike 验证，不能凑造）
**回执位置**：`product/agent-model-orchestration/receipts/step-5-{execution,test}.md`

---

## §1 背景与目标

当前 `sw_agent_model_config` 每一行代表**单条模型 + 单个 Key** 的完整配置；`AgentOrchestrationServiceImpl.run()`（283 行，Step4 现状）按单一 `agentModelConfigId` 加载、解密、构造 `ChatModel` 后直接调用——一旦这个 Key 遇到额度超限/限流（HTTP 429），当前实现只会把异常吞为 `success=false`（`catch (Exception e)` 分支，第 192-205 行区间），无法自动切换到另一个可用 Key。

Step5 落地：

1. **候选分组**：允许多条 `sw_agent_model_config` 行通过一个共同的 `group_key` 归为同一逻辑模型的候选池（例如"GPT-4o 三个渠道 Key"）。
2. **优先级排序**：组内每行有 `sort`（数字越小优先级越高，沿用仓库 `sort` 字段先例）。
3. **限流识别 + 临时锁定**：识别到 HTTP 429/额度超限时，把当前行标记 `locked_until`（冷却期，秒数可配），并按 `sort` 升序切换到组内下一个未锁定、已启用的候选行重试。
4. **无候选可切换时**：与 Step2-4 行为完全一致地失败（`success=false` + 摘要错误信息），不抛 500，不无限重试。
5. **单条配置（`group_key` 为 null）行为不变**：完全向后兼容，Step1-4 已建的所有配置默认 `group_key=null`，遇到限流直接失败，不受本 Step 影响。

---

## §2 前置调研关键发现（方案依据）

以下结论均来自 `search_fallback/m07-step5-multikey-quota-precedent.md` 的 jar 级/行号级/git 证据：

| 发现 | 影响 |
|---|---|
| V19 表现存 20 列，`enabled` 列为 `SMALLINT`，实体字段为 `Boolean`；表内**无**任何优先级/分组/锁定字段 | 需新增 4 列，V24（全仓库当前最大版本号已实测确认为 V23） |
| 提交 `74fc415` 已在 AgentTool 路径修复"`.eq(x, true)` 对比 SMALLINT 列在 PG 下必炸"的缺陷，改用数字字面量 1；`AgentModelConfigServiceImpl` 当前**从未**写过任何 `enabled` 等值查询条件 | **本 Step 是 AgentModelConfig 实体第一次引入 `enabled` 查询条件**——必须直接采用已验证过的"数字字面量"写法，不能重蹈 boolean 参数比对 SMALLINT 列的覆辙 |
| `ChatModelFactory.build(AgentModelConfig, String)` 是唯一公开入口、无重载，`buildRestClientBuilder` 为 `private`（Step3 未真正复用，仅 javadoc 引用同款写法）；main 代码唯一消费点是 `AgentOrchestrationServiceImpl.java:125` | **`ChatModelFactory.java` 本身不需要改动**——它只负责"给定一条配置构造 ChatModel"，与"选哪一条配置重试"是正交关注点。原 `memory/state.md` 表述的"ChatModelFactory 改造"经代码现状核实后修正为：轮询/切换逻辑落在 `AgentOrchestrationServiceImpl`，`ChatModelFactory` 保持不变（见 §4 明确记录此偏差） |
| `AgentOrchestrationRunReqDTO` 现为 3 字段（`agentModelConfigId`+`input`+`sessionId`，Step4 新增），`run()` 异常处理结构：内层 try 覆盖 build→invoke 全段，外层 `catch(IllegalArgumentException)`/`catch(BaseException) 上抛`/`catch(Exception)` 三分支，均在 `summarizeError()` 前转 `success=false` | 限流识别与切换重试逻辑必须插在**外层 `catch(Exception e)` 分支之前或之内**，且要用循环包裹现有的"build→bind→invoke→clear"整段（不能只包一层 catch，需要能重新执行 build+invoke） |
| Spring AI `TransientAiException`/`NonTransientAiException` **不携带任何状态码/响应体字段**；默认错误处理器把 429（4xx）归为 NonTransient（不重试）；`HttpClientErrorException.TooManyRequests` 存在但构造器 private；`RestClientResponseException.getStatusCode()`/`getRawStatusCode()`/`getResponseBodyAsString()` 均为 public，且在任何 4xx/5xx 异常实例上可调 | **限流识别不走异常子类型判断，走状态码判断**：沿 cause 链找到任意一个 `RestClientResponseException` 实例，调 `getStatusCode().value() == 429`。不依赖 `TooManyRequests` 具体子类（可能因 statusCode 非标准枚举实例而不生成） |
| 实际到达 ServiceImpl catch 块的异常类型链（`CompletionException`→`ExecutionException`→真实原因，Step2 实测）+ Spring AI RetryTemplate 可能已重新包装——均**未经真实 429 响应实测确认** | **必须现场 spike**：搭建返回 429 的 mock HTTP 服务器，走真实 `ChatModelFactory.build()`→`chatModel.call()` 全链路，打印/断言异常类的完整类名链，以此为准编写 `isQuotaExceededException()`，不得凑造（见 §5 V1） |
| 仓库排序字段唯一先例：裸名 `sort`（`INTEGER NOT NULL DEFAULT 0`，sys_menu/sys_role/sys_dept/sys_post/sys_dict_data 共 5 表） | 优先级字段命名为 `sort`，类型 `INT NOT NULL DEFAULT 0`，与仓库唯一先例保持一致，不用 `priority`/`order_num` 等训练记忆常见命名 |
| 仓库无锁定字段先例；仅有到期语义字段 `expire_time`（sys_tenant，nullable）/`expires_at`（sys_refresh_token，NOT NULL）；`sw-security` 的 `LoginLockoutStrategy` 只是无实现的 SPI 接口，无字段级先例 | 无强制先例可循，规划层自定命名为 `locked_until`（TIMESTAMP，nullable，语义清晰且与 `expire_time`/`expires_at` 的"时间点到期"风格一致） |
| 仓库无分组/候选池字段先例（`group_key`/`pool_key` 等 grep 零命中，`knowledge/` 下也无 agent 模块设计文档） | 规划层自定命名为 `group_key`（VARCHAR(100)，nullable = 不参与轮询，独立配置，向后兼容） |
| Flyway 全仓库真实最大版本号为 **V23**（`agent/{h2,postgresql}/V23__init_agent_tool_call_log.sql`，需排除 `sort -V` 按路径字符串排序的字母序陷阱与 `.claude/worktrees/` 陈旧内容） | 本 Step 使用 **V24**，执行前须现场重新 `find` 确认（同 D57 先例教训，不采信本方案写的数字） |

---

## §3 范围裁定

### 本 Step 包含

1. **DB 迁移 V24**：对 `sw_agent_model_config` 追加 4 列（`group_key`/`sort`/`locked_until`/`quota_cooldown_seconds`）+ 1 个复合索引，H2 + PostgreSQL 各一个脚本（ALTER TABLE，无需重建表）
2. **实体扩展**：`AgentModelConfig.java` 新增 4 字段
3. **DTO 扩展**：
   - `AgentModelSaveReqDTO` 新增 `groupKey`/`sort`/`quotaCooldownSeconds`（用户可配置，`lockedUntil` 不对外暴露为可写字段——系统运行态，不由用户直接设置）
   - `AgentModelConfigDTO` 新增 `groupKey`/`sort`/`lockedUntil`/`quotaCooldownSeconds`（只读展示，便于运营侧观察哪个 Key 当前被锁定）
   - `AgentOrchestrationRunRespDTO` 新增 `usedModelConfigId`（Long，返回实际服务本次请求的配置 id——轮询切换后可能与请求携带的 `agentModelConfigId` 不同，便于排查/审计）
4. **AgentOrchestrationServiceImpl 改造**（唯一核心逻辑改动点）：
   - 新增 `isQuotaExceededException(Throwable)` 私有方法（沿 cause 链找 `RestClientResponseException` 且状态码 429）
   - 新增 `findNextCandidate(String groupKey, Set<Long> triedIds, LocalDateTime now)` 私有方法（Mapper 查询：同 groupKey、enabled、未锁定、未试过，按 sort 升序取第一条）
   - `run()` 方法内把"build ChatModel → bind → invoke → clear"整段包成重试循环：遇到限流异常 → 锁定当前配置（`locked_until = now + quotaCooldownSeconds`，`mapper.updateById`）→ 查找下一候选 → 有则重试，无则（或 `groupKey` 为 null）按原有行为失败
5. **测试**：覆盖候选查询、限流识别、切换重试、锁定写入、组内耗尽失败、向后兼容（无 groupKey 时行为不变）

### 本 Step 不包含

- **`ChatModelFactory.java` 不做任何修改**（见 §2 发现表，原 `memory/state.md` 范围描述的"ChatModelFactory 改造"经代码现状核实修正，见 §4 偏差说明）
- 手动解锁端点（管理员提前清除 `locked_until`）——本 Step 只做被动过期（下次查询时 `locked_until <= now` 即视为可用，不设主动清理任务），主动解锁留后续迭代
- 分布式锁/并发请求争用同一 Key 的严格串行化——并发请求各自独立判定与更新，允许极少数并发场景下短暂重复选中同一刚超限的 Key（本 Step 接受此已知限制，不引入分布式锁基础设施）
- 组内候选的运营看板/告警（哪些 Key 频繁被锁定）——留后续
- 跨模型协议的候选（如 openai 和 ollama 混组）——本 Step 不限制协议类型必须一致，但不做特殊处理，规划层不推荐运营侧混协议分组（不在代码层强制校验，属于配置侧的自由度，如需强制在后续迭代加校验）

---

## §4 架构决策与偏差说明

### A. 轮询/切换逻辑归属：`AgentOrchestrationServiceImpl`，不改 `ChatModelFactory`

**与 `memory/state.md` 原表述的偏差**：原表述"`ChatModelFactory` 改造"是在前置调研之前的粗粒度设想。前置调研核实 `ChatModelFactory.build()` 是纯粹的"给定一条配置构造 ChatModel"的无状态工厂方法，不持有任何候选池/重试状态，也没有其他消费点会受影响（唯一消费点就是 ServiceImpl）。把候选选择与重试循环放进 `ChatModelFactory` 会让它从无状态工厂变成有状态编排逻辑，职责不清；而 `AgentOrchestrationServiceImpl` 本身已经持有 `mapper`（可查询候选）、已经是 try/catch/finally 的编排位置（Step2-4 的 session/历史/工具日志逻辑都在这里插入）。**决策：`ChatModelFactory.java` 保持 132 行原样不动，本 Step 全部逻辑改动在 `AgentOrchestrationServiceImpl`。**

### B. 限流识别：状态码判断，不依赖异常子类型

```java
private boolean isQuotaExceededException(Throwable t) {
    Throwable cur = t;
    while (cur != null) {
        if (cur instanceof org.springframework.web.client.RestClientResponseException rcre
                && rcre.getStatusCode().value() == 429) {
            return true;
        }
        cur = cur.getCause();
    }
    return false;
}
```

依据：`RestClientResponseException.getStatusCode()` 为 public（§2 发现表，`RestClientResponseException` 是 `HttpClientErrorException`/`HttpClientErrorException.TooManyRequests` 的共同祖先），沿 cause 链查找与 `summarizeError()` 同款模式（对称，避免遗漏 `CompletionException`→`ExecutionException`→真实原因的包装层）。**该方法的正确性完全依赖 §5 V1 现场 spike 结果——若 429 响应实际到达 ServiceImpl 时的异常类型链与预期不符（例如被 Spring AI RetryTemplate 转换成不含 `RestClientResponseException` 的其他类型），执行层必须如实调整实现并在回执中记录，不得强行凑造匹配。**

### C. 重试循环结构（伪代码，仅方案说明，执行层按 spike 实测调整）

```java
Set<Long> triedIds = new HashSet<>();
AgentModelConfig currentConfig = entity;   // 初始为 mapper.selectById 加载的那条
String plainApiKey = ...;                  // 每次切换重新解密对应配置的 apiKeyCipher
LocalDateTime now;

while (true) {
    triedIds.add(currentConfig.getId());
    try {
        ChatModel chatModel = chatModelFactory.build(currentConfig, plainApiKey);
        // ... 现有 session/历史/工具/bind 逻辑不变 ...
        try {
            Optional<AgentState> result = agentCompiledGraph.invoke(...);
            // ... 成功路径：setUsedModelConfigId(currentConfig.getId())，break 出循环 ...
        } finally {
            // clear ThreadLocal（每次尝试对称清理）
        }
        break;
    } catch (IllegalArgumentException e) {
        resp.setSuccess(false); resp.setErrorMessage(summarizeError(e)); break;   // 配置非法，不属于限流，不切换
    } catch (BaseException e) {
        throw e;   // 业务异常照常上抛，不吞
    } catch (Exception e) {
        if (isQuotaExceededException(e) && currentConfig.getGroupKey() != null) {
            now = LocalDateTime.now();
            currentConfig.setLockedUntil(now.plusSeconds(currentConfig.getQuotaCooldownSeconds()));
            mapper.updateById(currentConfig);   // 锁定当前 Key
            AgentModelConfig next = findNextCandidate(currentConfig.getGroupKey(), triedIds, now);
            if (next != null) {
                currentConfig = next;
                plainApiKey = decrypt(next);   // 重新解密下一候选的 Key
                continue;   // 回到循环顶部重试
            }
        }
        // 非限流异常，或限流但无候选可切（含 groupKey 为 null）：按原有行为失败
        resp.setSuccess(false);
        resp.setErrorMessage(summarizeError(e));
        break;
    }
}
```

**终止性保证**：`triedIds` 保证每条候选配置最多被尝试一次（组内成员有限，不会无限循环）；`findNextCandidate` 排除已试过的 id，耗尽后返回 null 即终止重试。

**`findNextCandidate` 查询逻辑**（Mapper 层，MyBatis-Plus lambdaQuery，注意 enabled 用数字字面量，见 §2 发现表 74fc415 先例）：

```java
private AgentModelConfig findNextCandidate(String groupKey, Set<Long> excludeIds, LocalDateTime now) {
    List<AgentModelConfig> candidates = mapper.selectList(
        Wrappers.<AgentModelConfig>lambdaQuery()
            .eq(AgentModelConfig::getGroupKey, groupKey)
            .eq(AgentModelConfig::getEnabled, 1)          // 数字字面量，非 true——74fc415 先例
            .notIn(!excludeIds.isEmpty(), AgentModelConfig::getId, excludeIds)
            .and(w -> w.isNull(AgentModelConfig::getLockedUntil)
                       .or().le(AgentModelConfig::getLockedUntil, now))
            .orderByAsc(AgentModelConfig::getSort)
            .orderByAsc(AgentModelConfig::getId));         // 相同 sort 时按 id 保证确定性
    return candidates.isEmpty() ? null : candidates.get(0);
}
```

**注意**：`.eq(AgentModelConfig::getEnabled, 1)` 中 `1` 是否能被 MyBatis-Plus 正确映射到 `Boolean` 类型属性上生成正确 SQL，需执行层现场验证（§5 V3）——如果 lambda 查询的类型系统不允许对 `Boolean` 属性传入 `int` 字面量（编译期类型不匹配），需改用 `Wrappers.lambdaQuery().apply("enabled = 1")` 原生片段方式，同样要现场确认后落地，不得直接假设编译通过。

---

## §5 现场验证要求（禁止凑造，必须 spike/javap/grep 实证）

| # | 验证项 | 方法 | 若与预期不符则 |
|---|---|---|---|
| V1 | **HTTP 429 响应到达 ServiceImpl catch 块时的真实异常类型链** | 搭建本地 mock HTTP 服务器（同 Step1 `AgentModelConfigServiceImplTest` 连通性测试的 mock 手法）返回 429 响应体，走 `chatModelFactory.build()` 构造真实 `OpenAiChatModel`（`baseUrl` 指向 mock 服务器）→ `chatModel.call(prompt)`，用测试断言打印/记录完整 `getClass().getName()` + cause 链，确认 `isQuotaExceededException()` 的判断逻辑能命中 | 若实际异常链中不含任何 `RestClientResponseException` 实例（例如被 Spring AI 内部转换/吞掉状态码），如实记录并调整判断方法为可行的备选方案（如字符串匹配响应体/消息中的 "429"/"Too Many Requests"，须在回执标注为降级方案），不得强行断言凑造通过 |
| V2 | Spring AI `RetryTemplate`（`ChatModelFactory.buildRetryTemplate`，`retryCount` 决定 attempts）是否会在 429 场景下消耗掉重试次数导致延迟放大 | 复用 V1 的 mock 场景，观察 429 响应下 `chatModel.call()` 的实际请求次数（mock 服务器请求计数），对照 `retryCount` 配置值 | 若确认 429 会被 RetryTemplate 重试消耗（与"NonTransient 不重试"预期不符），如实记录该行为，评估是否需要在 `ChatModelFactory` 层为 429 场景单独设置 attempts=1（若需要调整会构成对 §4-A"ChatModelFactory 不动"决策的例外，须在回执中明确报告并说明理由，不得静默修改） |
| V3 | `Wrappers.<AgentModelConfig>lambdaQuery().eq(AgentModelConfig::getEnabled, 1)`（`int` 字面量对 `Boolean` 属性）编译期/运行期是否合法，H2 和 PG 下是否生成正确 SQL 且不抛 SMALLINT/BOOLEAN 比较异常 | 单测直接调用该查询，对 H2 内存库实测；若模块测试环境可覆盖 PG dialect 差异说明同样验证，否则至少给出 H2 实测结果 + 基于 74fc415 SQL 语义的书面推断 | 若编译不通过或运行报错，改用 `.apply("enabled = {0}", 1)` 原生 SQL 片段方式，须现场验证该写法本身编译通过且语义正确 |
| V4 | `mapper.updateById(currentConfig)` 在只改 `lockedUntil` 字段后，是否会因为 `@Version` 乐观锁字段联动导致 `version` 冲突或把其他未加载字段覆盖为 null（MyBatis-Plus `updateById` 默认全字段更新语义） | 读取 `AgentModelConfigServiceImpl.java` 现有 update 方法的实际写法（Step1 已有先例：update 时如何处理未变更字段），复用同款局部更新手法（如 `UpdateWrapper` 只设置 `locked_until` 列，或确认整行 `currentConfig` 对象字段完整不会误清空其他列） | 若存在覆盖风险，改用 `mapper.update(null, Wrappers.<AgentModelConfig>lambdaUpdate().eq(getId,...).set(getLockedUntil,...))` 只更新目标列，须现场验证该写法编译通过 |
| V5 | V24 迁移脚本（`ALTER TABLE` 追加列）在 H2 和 PostgreSQL 两种 dialect 下语法是否一致、`quota_cooldown_seconds INT NOT NULL DEFAULT 60` 对已有历史行（Step1-4 已插入的测试数据/种子数据）追加 `NOT NULL DEFAULT` 列是否需要额外处理 | 现场确认两种数据库的 `ALTER TABLE ... ADD COLUMN ... NOT NULL DEFAULT ...` 语法（H2/PG 均支持对已有表追加带默认值的 NOT NULL 列，回填已有行为默认值，属标准行为，但仍需现场用 `mvn test` 启动 Spring 上下文验证 Flyway 迁移无报错） | 若某一 dialect 不支持一步到位（须分两步：先加可空列回填再加 NOT NULL 约束），如实调整脚本并记录 |

---

## §6 新建/改造文件清单

### 数据库迁移（2 文件，ALTER TABLE，非新表）

```
Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/agent/
  h2/
    V24__alter_agent_model_config_multikey.sql
  postgresql/
    V24__alter_agent_model_config_multikey.sql
```

（**执行前须现场重新确认全仓库最大版本号仍为 V23**，若并行 Step 已占用 V24，顺延取下一个空闲版本号，同 D57/既有风险先例）

### 改造文件（4 文件，无新建 Java 主代码文件）

```
Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/
  entity/
    AgentModelConfig.java                          （+4 字段：groupKey/sort/lockedUntil/quotaCooldownSeconds）
  dto/
    AgentModelSaveReqDTO.java                      （+3 字段：groupKey/sort/quotaCooldownSeconds）
    AgentModelConfigDTO.java                        （+4 字段：groupKey/sort/lockedUntil/quotaCooldownSeconds）
    AgentOrchestrationRunRespDTO.java               （+1 字段：usedModelConfigId）
  service/impl/
    AgentOrchestrationServiceImpl.java              （核心改动：重试循环 + isQuotaExceededException + findNextCandidate）
```

**未改动**：`ChatModelFactory.java`（§4-A 决策，明确不动）、`AgentGraphFactory.java`、`AgentModelConfigServiceImpl.java`（CRUD 逻辑本身不变，只是 DTO 透传新字段，若 toEntity/toDTO 用显式字段映射需补充映射行，非结构性改动）、V19-V23 任何已有脚本、`AgentOrchestrationRunReqDTO.java`（本 Step 请求入参不变，仍是 agentModelConfigId+input+sessionId——切换是服务端内部行为，调用方无需感知）、前端任何文件。

---

## §7 DB 方案

### §7.1 V24 — H2

```sql
-- ===================================================================
-- Smart-WorkFlow :: V24: sw_agent_model_config 扩展多Key轮询/额度限流字段 (H2)
-- M07-F01：group_key 归组 + sort 优先级 + locked_until 临时锁定 + quota_cooldown_seconds 冷却期
-- 向后兼容：group_key 默认 null（不参与轮询，行为与 Step1-4 完全一致）
-- ===================================================================
ALTER TABLE sw_agent_model_config ADD COLUMN group_key VARCHAR(100);
ALTER TABLE sw_agent_model_config ADD COLUMN sort INT NOT NULL DEFAULT 0;
ALTER TABLE sw_agent_model_config ADD COLUMN locked_until TIMESTAMP;
ALTER TABLE sw_agent_model_config ADD COLUMN quota_cooldown_seconds INT NOT NULL DEFAULT 60;

CREATE INDEX idx_sw_agent_model_group ON sw_agent_model_config (tenant_id, group_key, sort);
```

### §7.2 V24 — PostgreSQL

```sql
-- ===================================================================
-- Smart-WorkFlow :: V24: sw_agent_model_config 扩展多Key轮询/额度限流字段 (PostgreSQL)
-- M07-F01：group_key 归组 + sort 优先级 + locked_until 临时锁定 + quota_cooldown_seconds 冷却期
-- ===================================================================
ALTER TABLE sw_agent_model_config ADD COLUMN group_key VARCHAR(100);
ALTER TABLE sw_agent_model_config ADD COLUMN sort INT NOT NULL DEFAULT 0;
ALTER TABLE sw_agent_model_config ADD COLUMN locked_until TIMESTAMP;
ALTER TABLE sw_agent_model_config ADD COLUMN quota_cooldown_seconds INT NOT NULL DEFAULT 60;

CREATE INDEX idx_sw_agent_model_group ON sw_agent_model_config (tenant_id, group_key, sort);

COMMENT ON COLUMN sw_agent_model_config.group_key IS '多Key轮询候选分组标识，null=独立配置不参与轮询';
COMMENT ON COLUMN sw_agent_model_config.sort IS '组内优先级，数值越小优先级越高';
COMMENT ON COLUMN sw_agent_model_config.locked_until IS '限流临时锁定至该时间点，null或已过期=可用';
COMMENT ON COLUMN sw_agent_model_config.quota_cooldown_seconds IS '触发限流后的锁定冷却时长（秒），默认60';
```

**字段类型选择依据**：`sort` 用裸名 + `INT NOT NULL DEFAULT 0`（仓库唯一排序字段先例，sys_menu 等 5 表同款）；`locked_until` 用 `TIMESTAMP` 可空（风格对齐 `expire_time`/`expires_at` 但语义为"锁定期"而非"账户到期"，取名区分）；两列均无仓库直接先例，按 §2 结论由规划层自定命名，已在回执中如实标注依据。

---

## §8 边界情况

| 场景 | 预期行为 |
|---|---|
| `group_key` 为 null（Step1-4 已有全部配置的默认状态） | 遇限流直接失败（`success=false`），与 Step2-4 行为完全一致，零回归 |
| 组内只有 1 条配置，遇限流 | `findNextCandidate` 排除自身 id 后查无候选（同组仅此一条）→ 按原有行为失败 |
| 组内多条配置，全部已被锁定（`locked_until > now`） | 全部尝试过一轮后 `triedIds` 覆盖所有候选 → 查无未试过的可用候选 → 失败，返回摘要错误信息（建议信息含"组内候选均不可用"，具体文案执行层可自定，不强制） |
| 组内配置 A 被锁定，锁定期已过（`locked_until <= now`） | 视为可用候选，正常参与下一轮选择（惰性过期判断，不设主动清理任务，同 `expire_time`/`expires_at` 先例风格） |
| 组内配置 A 遇到限流切到 B，B 也遇到限流 | 继续切到 C（若存在），`triedIds` 持续累积防止死循环，直到候选耗尽 |
| 非 429 异常（网络超时、鉴权失败、协议不支持等） | `isQuotaExceededException` 返回 false，不触发切换，直接按原有行为失败（不引入"所有异常都重试"的风险） |
| `IllegalArgumentException`（`ChatModelFactory` 拒绝构造，如 `protocolType` 非法） | 不属于限流场景，不切换候选（切到下一个 Key 也可能是同样的配置问题类别，但更合理的是：不同配置理论上可能协议不同，是否切换值得讨论——**本 Step 决策：`IllegalArgumentException` 不触发切换**，因为这通常反映配置本身的静态错误而非运行时可恢复的限流状态，切换意义不大且会掩盖配置问题） |
| 并发请求同时选中同一即将超限的 Key | 接受已知限制（§3 不包含项已声明），不引入分布式锁 |
| 请求携带的 `agentModelConfigId` 本身不存在/跨租户 | 与现有行为一致，`mapper.selectById` 返回 null → `NOT_FOUND`（此逻辑在候选切换循环之前，不受影响） |

---

## §9 测试要求

### §9.1 单测（JUnit + Mockito + mock HTTP 服务器，新增目标 ~16-18 个）

| 测试类 | 测试方法（示例） | 要点 |
|---|---|---|
| `AgentModelConfigMapperTest`（新增用例或复用既有类） | `testFindNextCandidateOrderBySort` | 同组 3 条不同 sort，返回顺序正确 |
| 同上 | `testFindNextCandidateExcludesLocked` | `locked_until` 未过期的候选被排除 |
| 同上 | `testFindNextCandidateExcludesExpiredLockAsAvailable` | `locked_until` 已过期的候选**被视为可用**并返回 |
| 同上 | `testFindNextCandidateExcludesTriedIds` | 已在 `excludeIds` 中的候选不返回 |
| 同上 | `testFindNextCandidateEnabledFilterNoSqlError` | H2 实测 `.eq(enabled, 1)` 查询不抛 SMALLINT/BOOLEAN 异常（对应 §5 V3） |
| `AgentOrchestrationServiceImplTest` | `testRunSwitchesToNextKeyOnQuotaExceeded` | mock 第一次调用抛模拟限流异常，第二次调用（切换后）成功，断言 `usedModelConfigId` 为第二条配置 id |
| 同上 | `testRunLocksCurrentConfigOnQuotaExceeded` | 断言 `mapper`（或等价持久化调用）在限流后被调用以设置 `lockedUntil` |
| 同上 | `testRunFailsWhenAllCandidatesLockedOrExhausted` | 组内全部候选都返回限流异常 → 最终 `success=false`，且尝试次数等于组大小（不多不少） |
| 同上 | `testRunNoSwitchWhenGroupKeyNull` | `groupKey=null` 时遇限流直接失败，不触发任何候选查询（向后兼容断言） |
| 同上 | `testRunNoSwitchOnNonQuotaException` | 普通网络异常不触发切换 |
| 同上 | `testIsQuotaExceededExceptionDetects429` | 单独测 `isQuotaExceededException` 对构造的 `RestClientResponseException`(429) cause 链返回 true，对其他异常返回 false |
| `ChatModelFactory` 429 端到端 spike（可独立测试类或内嵌于 ServiceImplTest） | `testRealHttp429ExceptionChain` | 对应 §5 V1，mock 服务器真实返回 429，记录实际异常类型链（回执中须贴出该测试的断言/输出） |
| `AgentModelControllerTest` 或 `AgentModelConfigServiceImplTest` | `testSaveWithGroupKeyAndSort` | 保存时新字段可正确落库回读 |

### §9.2 全量回归

- 全量 `mvn test`（排除 `.claude/worktrees/`）不得 < 328（Step4 基线）
- 测试报告（surefire 摘录）须附于 execution 回执 §7/§8 或单独 test 回执

---

## §10 禁止范围

1. **禁止修改 `ChatModelFactory.java`**（§4-A 明确决策，除非 §5 V2 spike 发现必须调整 `retryTemplate` attempts 且已在回执中明确报告例外理由）
2. **禁止对 V19-V23 已有脚本做任何修改**——本 Step 只用 `ALTER TABLE` 追加列，不改既有列定义
3. **禁止引入分布式锁/消息队列等基础设施**处理并发选择争用（§3 已声明为已知限制，不在本 Step 范围）
4. **禁止在 `.eq(enabled, ...)` 查询上使用 Boolean 参数**——必须使用数字字面量（74fc415 先例，PG 下 boolean 对比 SMALLINT 必炸）
5. **禁止无限重试**——重试次数必须严格受 `triedIds` 去重约束，不得引入固定次数上限之外的无界循环
6. **禁止新增权限码**——沿用 `agent:model:manage`（配置新字段的编辑）/`agent:model:view`（只读展示），不新增第 4 个权限码
7. **禁止在 §5 现场验证项上凑造**：V1（429 真实异常链）尤其关键，若测试断言与预期不符，必须如实调整 `isQuotaExceededException` 实现并在回执中记录差异，不得为了让测试通过而构造不代表真实运行环境的异常对象
8. **禁止新增业务功能性依赖**（无需任何新 jar，`RestClientResponseException` 已在现有 spring-web 传递依赖中）

---

## §11 验收标准

| # | 验收项 | 验证方式 |
|---|---|---|
| 1 | V24 迁移在 H2 和 PG 双模式下均无报错（ALTER TABLE 追加 4 列 + 1 索引） | `mvn test` Spring 上下文启动 |
| 2 | `AgentModelConfig` 新增 4 字段可正确落库回读（含默认值：`sort`=0，`quotaCooldownSeconds`=60） | Mapper 单测 |
| 3 | `groupKey=null` 的配置遇到限流异常时行为与 Step4 完全一致（直接失败，不触发任何候选查询） | 单测 testRunNoSwitchWhenGroupKeyNull |
| 4 | 同组多条配置，当前 Key 遇 429 时按 `sort` 升序切换到下一个已启用、未锁定、未试过的候选，重试成功后 `resp.usedModelConfigId` 为实际服务的配置 id | 单测 testRunSwitchesToNextKeyOnQuotaExceeded |
| 5 | 限流触发后当前配置的 `lockedUntil` 被设置为 `now + quotaCooldownSeconds` 并持久化 | 单测 testRunLocksCurrentConfigOnQuotaExceeded |
| 6 | `lockedUntil` 已过期的候选被重新视为可用（惰性判断，无需清理任务） | Mapper 单测 testFindNextCandidateExpiredLockAsAvailable |
| 7 | 组内候选耗尽（全部锁定或已试过）时最终 `success=false`，且总尝试次数精确等于组内候选数（无多余重试，无遗漏） | 单测 testRunFailsWhenAllCandidatesLockedOrExhausted |
| 8 | 非 429 异常（如网络超时、协议非法）不触发候选切换，行为与 Step2-4 完全一致 | 单测 testRunNoSwitchOnNonQuotaException |
| 9 | `.eq(AgentModelConfig::getEnabled, 1)`（或等价数字字面量写法）查询在 H2 下不抛 SMALLINT/BOOLEAN 比较异常 | Mapper 单测 + §5 V3 spike 结果附于回执 |
| 10 | §5 五项现场验证均已在回执中给出 spike 结果（异常类型链原始输出/mock 服务器请求计数/SQL 兼容性结论），不得空白，尤其 V1 必须附真实异常类名链 | 回执 §3 标注"现场验证结果" |
| 11 | `ChatModelFactory.java` 文件内容与 Step4 结束时完全一致（git diff 为空） | 静态检查（git diff 命令输出） |
| 12 | 全量 `mvn test` ≥ 328 + 新增数（预计 ~16-18）0 failures 0 errors | surefire 报告摘录附于回执 |
| 13 | 权限码仍为既有 3 枚（`agent:model:view`/`manage`/`test`），未新增第 4 个 | 静态检查（grep 权限码字符串出现次数） |
| 14 | V19-V23 脚本文件 git diff 为空（未被本 Step 触碰） | 静态检查 |

---

## §12 执行顺序

1. **§5 V1/V2 spike 优先**：搭建 mock 429 服务器，走真实 `chatModelFactory.build()`→`chatModel.call()`，确认异常类型链与 RetryTemplate 行为，据此最终确定 `isQuotaExceededException()` 实现与是否需要对 §4-A 决策提出例外
2. **执行前重新确认 Flyway 最大版本号**（现场 `find`，排除 `.claude/worktrees/`，排除字母序陷阱，同 D57 教训）
3. **V24 脚本**（2 文件）→ 验证 Spring 上下文启动无 Flyway 报错
4. **`AgentModelConfig` 实体扩展**（4 字段）
5. **§5 V3/V4 spike**：`enabled` 数字字面量查询写法 + `updateById` 局部更新安全性，确定 `findNextCandidate`/锁定写入的最终实现
6. **`AgentOrchestrationServiceImpl` 改造**：`isQuotaExceededException` + `findNextCandidate` + 重试循环包装现有 build→bind→invoke→clear 段
7. **DTO 扩展**（`AgentModelSaveReqDTO`/`AgentModelConfigDTO`/`AgentOrchestrationRunRespDTO`，3 文件）
8. **单测**：Mapper 候选查询用例 → ServiceImpl 切换/锁定/耗尽/向后兼容用例 → 429 端到端 spike 用例固化为正式测试
9. **全量 `mvn test`**，确认 ≥ 328 + 新增数，0 failures
10. **静态检查**：`ChatModelFactory.java`/V19-V23 git diff 为空，权限码计数不变
11. **回执写入**：`product/agent-model-orchestration/receipts/step-5-execution.md` + `step-5-test.md`（或内嵌于 execution 回执）
