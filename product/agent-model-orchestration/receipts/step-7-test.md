# 测试回执

## 1. 测试范围与新增用例清单

基线：D62 after-Step5 **341 tests**（memory/state.md）。本 Step 新增 **21** 个用例，全量 **362**。

### 1.1 新增测试类（2）

**`AgentGraphDefServiceImplTest`**（新建，13 用例，@SpringBootTest + H2 + TestConfig 同款装配 + @Transactional 每用例回滚）：

| 用例 | 验证点 | 对应验收 |
|---|---|---|
| 1. `create_shouldInitDraftGraph` | graphKey `agent_` 前缀、defVersion=1、DRAFT、初始图 3 elements（node/START、node/END、edge） | 验收 4 |
| 2. `create_blankName_shouldThrow` | name 空白 → PARAM_ERROR"图名称不能为空"，不落库 | 验收 5 |
| 3. `saveDraftGraph_shouldOverwriteAndKeepDraft` | 全量覆盖 graph_json；status 保持 DRAFT；残图（仅 1 个 LLM 节点）可存 | 验收 6 |
| 4. `saveDraftGraph_unknownId_shouldThrow` | 不存在 id → NOT_FOUND | 验收 7 |
| 5. `getGraph_shouldRoundTripOpaqueConfigAndStyle` | config（keyword/matchMode/maxRetries）与 style（color/width）保存→回读逐字段原样一致（不透明透传） | 验收 3 |
| 6. `getGraph_unknownId_shouldThrow` | 不存在 id → NOT_FOUND | 验收 7 |
| 7. `pageDefs_shouldPaginateAndStripLargeField` | 分页参数生效（2/3）；update_time 倒序；DTO 反射断言无 graphJson 字段 | 验收 8 |
| 8. `delete_shouldSoftDelete` | deleted=1（jdbcTemplate 直查，@TableLogic selectById 会过滤已删行）；删除后 getGraph → NOT_FOUND | 验收 8 |
| 9. `publish_firstTime_shouldIncrementVersion` | 首次发布 defVersion 1→2、PUBLISHED、graphKey 不变 | 验收 9 |
| 10. `publish_repeatAndFreezeCheck` | 重复发布 key 一致 2→3；图内 graphKey 篡改 → PARAM_ERROR"graphKey 已冻结" | 验收 9 |
| 11. `publish_emptyGraph_shouldThrow` | graph_json 置 null → PARAM_ERROR"图数据为空" | 验收 9 |
| 12. `publish_unknownId_shouldThrow` | 不存在 id → NOT_FOUND | 验收 7 |
| 13. `tenantIsolation_shouldHideOtherTenantGraph` | 租户 200 读/发布租户 100 的图 → NOT_FOUND；租户 B 自己的图不受影响 | 验收 10 |

**`AgentGraphDefControllerTest`**（新建，8 用例，@SpringBootTest MOCK + MockMvc + 真实 JwtAuthenticationFilter/SecurityFilterChain/@EnableMethodSecurity；用户 1=无权限、2=仅 manage、3=superAdmin；局部 advice 处理 BaseException——见执行回执 §4.2）：

| 用例 | 验证点 | 对应验收 |
|---|---|---|
| 1. `page_withoutViewPermission_shouldReturn403` | 无 view 权限 GET 列表 → 403 | 验收 11 |
| 2. `create_withManagePermission_shouldSucceed` | manage 权限 POST → 200 + id；落库 graphKey `agent_` 前缀/DRAFT/defVersion=1 | 验收 11 |
| 3. `saveDraftGraph_withManagePermission_shouldSucceed` | PUT /{id}/graph → 200；graph_json 覆盖；status 保持 DRAFT | 验收 11 |
| 4. `publish_withManagePermission_shouldSucceed` | POST /{id}/publish → 200 + defVersion=2 + PUBLISHED | 验收 11 |
| 5. `getGraph_shouldEchoGraph` | GET /{id} → 200 + elements 3 个回显（superAdmin） | 验收 11 |
| 6. `pageDefs_shouldReturnPaged` | GET 列表 → 200 + total=2；records 无 graphJson 键 | 验收 8/11 |
| 7. `delete_thenGet_shouldReturnNotFoundCode` | DELETE → 200；GET → HTTP 200 + body.code=404（仓库"业务错误 200+code"全局模式，见执行回执 §4.1） | 验收 11 |
| 8. `getGraph_withoutViewPermission_shouldReturn403` | 仅 manage 无 view → GET 详情 403（两权限码互不越权） | 验收 11 |

## 2. 全量测试结果（surefire 摘录）

`mvn test`（根 pom reactor）→ **BUILD SUCCESS**，模块汇总（surefire 报告逐模块统计，排除 `.claude/worktrees/`）：

| 模块 | Tests run | Failures | Errors |
|---|---|---|---|
| sw-common | 4 | 0 | 0 |
| sw-security | 4 | 0 | 0 |
| sw-storage | 12 | 0 | 0 |
| sw-notify | 7 | 0 | 0 |
| sw-job | 37 | 0 | 0 |
| **sw-basic-agent** | **100** | **0** | **0** |
| sw-system | 65 | 0 | 0 |
| sw-form | 76 | 0 | 0 |
| sw-bpm-engine | 18 | 0 | 0 |
| sw-bpm-process | 39 | 0 | 0 |
| **合计** | **362** | **0** | **0** |

- **362 = 341 基线 + 21 新增** ✓（≥ 341 + 新增数，0 failures 0 errors，验收 13）
- sw-basic-agent 100 = 既有 79 + 新增 21（ServiceImpl 13 + Controller 8）

### sw-basic-agent 新增测试类 surefire 原文

```
Tests run: 13, Failures: 0, Errors: 0, Skipped: 0 -- AgentGraphDefServiceImplTest   （新建）
Tests run: 8,  Failures: 0, Errors: 0, Skipped: 0 -- AgentGraphDefControllerTest     （新建）
```

### 既有类回归（sw-basic-agent 全量摘录）

```
Tests run: 14 -- AgentOrchestrationServiceImplTest      Tests run: 12 -- AgentModelConfigServiceImplTest
Tests run: 7  -- AgentToolConfigServiceImplTest         Tests run: 6  -- AgentGraphFactoryTest
Tests run: 6  -- AgentToolCallbackFactoryTest           Tests run: 5  -- ChatModelFactoryTest
Tests run: 5  -- AgentModelConfigMapperTest             Tests run: 1  -- ChatModelFactory429SpikeTest
Tests run: 4  -- AgentModelControllerTest               Tests run: 4  -- AgentToolConfigControllerTest
Tests run: 4  -- AgentConversationControllerTest        Tests run: 3  -- AgentOrchestrationControllerTest
Tests run: 3  -- AgentSessionMapperTest                 Tests run: 3  -- AgentMessageMapperTest
Tests run: 2  -- AgentToolCallLogMapperTest
```
（全部 0 failures 0 errors，既有 79 用例零回归）

## 3. 测试设计说明（防凑造声明）

- 全部 21 个新用例真实执行（surefire 报告），无凑造；断言均为行为断言（状态/版本/字段值/HTTP 状态/权限码），无 mock 假对象
- config/style 透传用例（ServiceImpl 用例 5）走真实 `graph_json` 写入→DB 存储→解析回读全链路，逐字段断言不透明 Map 原样
- 发布状态机用例（9/10/11）覆盖首次发布、重复发布、key 篡改冻结、空图四种路径，全部走真实 mapper 持久化
- 租户隔离用例（13）经真实 `TenantLineInnerInterceptor` 验证，非手动过滤
- Controller 403/404 语义经真实安全链 + 局部 advice（生产 GlobalExceptionHandler 的 BaseException 子集）验证

## 4. 回归风险

- 零修改既有文件（git diff --stat 为空）：V19-V24、编排/工厂/工具类、既有测试零接触，无回归面
- V25 为纯新增表，不触碰既有表结构；唯一索引仅约束新表
- 新增测试类各自独立 H2 内存库（agentgraphdef / agentgraphctrl），与其他测试类数据隔离
- 既有 79 个 agent 用例全绿（含 429 spike、编排 14 用例），无行为变化
