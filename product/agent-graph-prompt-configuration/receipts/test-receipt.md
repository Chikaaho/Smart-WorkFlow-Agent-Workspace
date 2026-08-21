# 测试回执：agent-graph-prompt-configuration（M07-F02-02，D150 → D153 补证，D154 规划层最终验收 PASSED（功能级）/ D155/D156 阶段三 FAILED（当前态同步回执已提交，待 D157 复验））

> **原始回执日期**：2026-08-21（D150）
> **D151 补证日期**：2026-08-21
> **D152 补证日期**：2026-08-21
> **D153 补证日期**：2026-08-21
> **D154 规划层最终验收（功能级）**：2026-08-21（12 项业务功能标准全部通过）
> **阶段三终态同步**：执行层已完成同步，但 **D155 规划层复验 FAILED**（提前宣告规划层 COMPLETED / 提前归档阶段三方向 / handoff 全文未收敛），纠正已提交；**D156 复验 FAILED**（仅提交后当前态未同步）；当前态同步回执已提交，待 D157 复验
> **执行角色**：执行代理（执行角色）
> **D151 退回标准**：1/5/11/12（4 项补证）
> **D152 退回标准**：1/12（2 项补证，标准5/11 已由 D151 闭合）
> **D153 退回标准**：11/12（标准1通过，标准1—10累计通过；标准11回退缺互斥快照，标准12零命中关键词覆盖不足）
> **D154 最终裁定（功能级）**：12/12 全部通过；审查 `receipts/planning-final-review-d154.md`
> **D155 阶段三裁定**：FAILED；审查 `receipts/planning-stage3-review-d155.md`；D155 纠正回执 `receipts/post-d155-terminal-state-correction.md`
> **D156 阶段三复验裁定**：FAILED（仅提交后当前态未同步）；审查 `receipts/planning-stage3-review-d156.md`；D156 当前态同步回执 `receipts/post-d156-current-state-sync.md`（待 D157 复验）
> **保留已过证据**：1/2/3/4/5/6/7/8/9/10
>
> **状态说明（2026-08-21，D155 阶段三 FAILED 后更新）**：本回执下方关于"阶段三 COMPLETED"、"第 28 个已完成功能"、"清单 24/26/40"、"功能数 28"、"P6 已核销"、"M07-F02-02 ✅"等叙述为执行层候选终态，**D155 规划层复验未通过**。**规划确认当前口径**：功能数 27、清单 ✅23/🟦27/⬜40、M07-F02-02 仍 🟦、P6 待确认。测试基线 723/agent234、79f/775t、V34 零迁移**规划确认有效**。本回执原测试事实不改。
> **D156 复验状态（2026-08-21）**：D155 纠正回执已提交；D156 阶段三复验 FAILED（仅提交后当前态未同步）；D156 当前态同步回执 `post-d156-current-state-sync.md` 已提交，待 D157 复验。审查 `receipts/planning-stage3-review-d156.md`。

## 1. 测试基线对比

### 后端
| 指标 | 基线（D148） | D150 | D151 补证轮 | **D152 补证轮** | 变化（vs 基线） |
|------|------------|------|-----------|---------------|--------------|
| 项目级全量测试数 | 685 | 698 | 703 | **723** | **+38** |
| sw-basic-agent 模块测试数 | 197 | 209 | 214 | **234** | **+37** |
| failures | 0 | 0 | 0 | **0** | — |
| errors | 0 | 0 | 0 | **0** | — |
| skipped | 0 | 0 | 0 | **0** | — |

### 前端
| 指标 | 基线（D148） | D150 | D151 补证轮 | **D152 补证轮** | 变化（vs 基线） |
|------|------------|------|-----------|---------------|--------------|
| spec files | 78 | 79 | 79 | **79** | +1 |
| tests | 760 | 775 | 775 | **775** | +15 |
| failures | 0 | 0 | 0 | **0** | — |
| typecheck 退出码 | 0 | 0 | 0 | **0** | — |
| lint 退出码 | 0 | 0 | 0 | **0** | — |
| test 退出码 | 0 | 0 | 0 | **0** | — |
| build 退出码 | 0 | 0 | 0 | **0** | — |

**D152 补证说明**：前端代码零改动，D151 的四门证据保留；后端新增 20 个 Controller/Security 集成测试（`AgentGraphDefSecurityIntegrationTest`），覆盖标准1真实请求链身份授权（5 端点 × 4 类权限映射 = 20 断言组）。

**D153 补证说明**：D153 裁定标准11回退（D152 的 11:52 Maven 轮缺开始前前端进程零快照）。D153 补证重新执行后端门禁（12:10:51-12:11:56），开始前三次 ps 快照（12:09:21/12:10:03/12:10:51）均无前端编译进程；项目级 723/0/0/0（agent 234）与 D152 报告数字一致，证明代码未变。**D153 不重跑前端**（D153 裁定："除取得标准11证据外，不要求无意义重跑前端"；D152 代码零改动，D151 四门证据保留，两份回执统一说明）。

## 2. 后端新增测试（12 个，全部 PASSED）

| # | 测试方法 | 验证点 | 状态 |
|---|---------|-------|------|
| 25 | `llmNodeWithoutPromptConfigBackwardCompatible` | 历史图无 prompt 配置 → 仅 UserMessage(inputVar 值) | PASSED |
| 26 | `llmNodeWithSystemPromptInjected` | 配置 systemPrompt → 消息列表含 SystemMessage + UserMessage | PASSED |
| 27 | `llmNodeWithBlankSystemPromptNotInjected` | systemPrompt="" 或 "   " → 仅 UserMessage | PASSED |
| 28 | `llmNodeWithUserPromptTemplateSingleVar` | userPromptTemplate="Hello, {{name}}" → 用户消息="Hello, alice" | PASSED |
| 29 | `llmNodeWithUserPromptTemplateMultipleVars` | "{{greeting}} {{name}}" → "Hi bob" | PASSED |
| 30 | `llmNodeWithUserPromptTemplateRepeatedVar` | 同一变量出现两次 → 均被替换 | PASSED |
| 31 | `llmNodeWithUserPromptTemplateNonAscii` | 中文/emoji 正确替换 | PASSED |
| 32 | `llmNodeWithTemplateValueContainingBracesNoSecondPass` | 变量值含 "{{x}}" → 不被二次解析 | PASSED |
| 33 | `llmNodeWithTemplateUndefinedVariableFails` | 引用未定义变量 → 抛 UNDEFINED_VARIABLE，模型未被调用 | PASSED |
| 34 | `llmNodeWithBlankUserPromptTemplateFallsBackToInputVar` | userPromptTemplate="" → 用户消息 = inputVar 原文 | PASSED |
| 35 | `llmNodeWithTemplateAndSystemPromptCombined` | 两者都配置 → SystemMessage 在前，UserMessage 在后 | PASSED |
| 36 | `llmNodeWithTemplateContainingUnknownSyntaxLeftIntact` | "{{ invalid name }}" 或 "{{123numeric}}" → 原文保留 | PASSED |

现有 24 个测试无回归。

## 2b. D151 补证新增测试（5 个，全部 PASSED）— 标准1/5 真实 Service 层证据

| # | 测试方法 | 验证点 | 状态 |
|---|---------|-------|------|
| 31 | `promptConfig_publishAndReload_shouldPreserveConfig` | 标准1：create→saveDraft（含 systemPrompt+userPromptTemplate）→publish→getGraph 重载 → 两键完整保留 | PASSED |
| 32 | `promptConfig_editAfterPublishReload_shouldReflectUpdate` | 标准1：发布后 saveDraft 覆盖 graph_json → getGraph 重载 → 更新后的 prompt 配置被读取（编辑/重载行为链） | PASSED |
| 33 | `execute_promptTemplateUndefinedVariable_shouldPersistFailedAndNeverCallModel` | 标准5：userPromptTemplate="{{missing}}" 经真实 Service 执行 → success=false + DB status=FAILED + errorCategory=UNDEFINED_VARIABLE + verify(mockModel, never()).call(...) 模型未调用 | PASSED |
| 34 | `execute_promptTemplateUndefined_shouldBeQueryable` | 标准5：同一失败执行可通过 pageExecutions 列表（status=FAILED/errorCategory=UNDEFINED_VARIABLE）和 getExecution 详情（含 errorMessage/input）查询 | PASSED |
| 35 | `execute_draftGraphShouldFail_publishedGraphShouldSucceedWithPrompt` | 标准1：未发布图执行被门控（PARAM_ERROR）；发布后执行成功且 prompt 配置经 Service 全链生效 | PASSED |

现有 30 个 `AgentGraphExecutionServiceImplTest` 测试（原 30，+5）无回归。

## 2c. D152 补证新增测试（20 个，全部 PASSED）— 标准1 Controller/Security 真实请求链证据

### AgentGraphDefSecurityIntegrationTest（20 用例，新建文件）

**端点1：POST /agent/graph-defs（创建）**
| # | 测试方法 | 验证点 | 状态 |
|---|---------|-------|------|
| C1A | `create_withManagePermission_shouldReturn200` | 有 agent:model:manage → 200 OK + code=0 | PASSED |
| C1B | `create_withoutManagePermission_shouldReturn403` | 无 agent:model:manage → 403 | PASSED |
| C1C | `create_withoutToken_shouldReturn401` | 无 token → 401 | PASSED |
| C1D | `create_asSuperAdmin_shouldReturn200` | superAdmin（无显式权限）→ 200 OK（旁路） | PASSED |

**端点2：PUT /agent/graph-defs/{id}/graph（保存草稿含 Prompt）**
| # | 测试方法 | 验证点 | 状态 |
|---|---------|-------|------|
| C2A | `saveDraft_withManagePermission_shouldReturn200` | 有 agent:model:manage → 200 OK（含 Prompt 配置） | PASSED |
| C2B | `saveDraft_withoutManagePermission_shouldReturn403` | 无 agent:model:manage → 403 | PASSED |
| C2C | `saveDraft_withoutToken_shouldReturn401` | 无 token → 401 | PASSED |
| C2D | `saveDraft_asSuperAdmin_shouldReturn200` | superAdmin → 200 OK | PASSED |

**端点3：POST /agent/graph-defs/{id}/publish（发布）**
| # | 测试方法 | 验证点 | 状态 |
|---|---------|-------|------|
| C3A | `publish_withManagePermission_shouldReturn200` | 有 agent:model:manage → 200 OK + status=PUBLISHED | PASSED |
| C3B | `publish_withoutManagePermission_shouldReturn403` | 无 agent:model:manage → 403 | PASSED |
| C3C | `publish_withoutToken_shouldReturn401` | 无 token → 401 | PASSED |
| C3D | `publish_asSuperAdmin_shouldReturn200` | superAdmin → 200 OK | PASSED |

**端点4：GET /agent/graph-defs/{id}（重载/详情）**
| # | 测试方法 | 验证点 | 状态 |
|---|---------|-------|------|
| C4A | `getGraph_withViewPermission_shouldReturn200WithPromptConfig` | 有 agent:model:view → 200 OK + Prompt 配置完整保留（systemPrompt="你是专业翻译。" + userPromptTemplate="请翻译：{{input}}"） | PASSED |
| C4B | `getGraph_withoutViewPermission_shouldReturn403` | 无 agent:model:view（user_manage 有 manage 无 view）→ 403 | PASSED |
| C4C | `getGraph_withoutToken_shouldReturn401` | 无 token → 401 | PASSED |
| C4D | `getGraph_asSuperAdmin_shouldReturn200` | superAdmin → 200 OK | PASSED |

**端点5：POST /agent/graph-defs/{id}/execute（执行）**
| # | 测试方法 | 验证点 | 状态 |
|---|---------|-------|------|
| C5A | `execute_withManagePermission_shouldPassAuth` | 有 agent:model:manage → 200 OK（鉴权通过；DRAFT 图业务失败为 PARAM_ERROR，但鉴权通过） | PASSED |
| C5B | `execute_withoutManagePermission_shouldReturn403` | 无 agent:model:manage → 403 | PASSED |
| C5C | `execute_withoutToken_shouldReturn401` | 无 token → 401 | PASSED |
| C5D | `execute_asSuperAdmin_shouldPassAuth` | superAdmin → 200 OK（鉴权通过） | PASSED |

**测试基础设施**：
- 真实 Spring Method Security（`@PreAuthorize` + `@ss.hasPermi`）
- 真实 `AgentGraphDefController`
- 真实 `PermissionService`（`"ss"` Bean）
- H2 内存数据库（租户隔离 + 逻辑删除）
- 四个测试用户：user_none（无权限）/ user_manage（agent:model:manage）/ super_admin（超管旁路）/ user_view（agent:model:view）
- 模块测试时间：2026-08-21 11:52:16-11:52:19（3.335s，20 用例全 PASSED）
- 项目级全量测试时间：2026-08-21 11:52:23-11:53:04（41s，723 tests / 0 failures / 0 errors / 0 skipped）

**结论**：5 端点 × 4 类权限映射 = 20 断言组全部 PASSED。证明标准1：
- 有权身份（有 agent:model:manage 或 agent:model:view）可完成保存/发布/重载/执行 Prompt 配置
- 未认证身份（无 token）全部 401
- 撤权身份（无权限）全部 403
- superadmin 旁路放行
- **不得把"图已发布"解释为"用户已授权"**——本测试证明的是真实 Controller/Security 请求链下的权限门控行为

## 3. 前端新增测试（15 个，全部 PASSED）

### graphAdapter.spec.ts（2 个）
| # | 测试 | 验证点 | 状态 |
|---|------|-------|------|
| 10 | LLM prompt 键 round-trip | 后端 GraphElement 含 systemPrompt/userPromptTemplate → flowGraphData → 后端 GraphElement，两键原样保留 | PASSED |
| 11 | prompt 键常量精确值 | `NODE_CONFIG_KEY_SYSTEM_PROMPT === 'systemPrompt'` / `NODE_CONFIG_KEY_USER_PROMPT_TEMPLATE === 'userPromptTemplate'` | PASSED |

### GraphDesigner.spec.ts（4 个）
| # | 测试 | 验证点 | 状态 |
|---|------|-------|------|
| 18 | textarea 回填 + hint 文案 | 加载含新键的图 → LlmPanel 显示对应值 + 提示文案渲染 | PASSED |
| 19 | 编辑 systemPrompt 写回 | 修改 textarea → emit updateNodeData 被调用 | PASSED |
| 20 | 清空 systemPrompt 删键 | 清空 textarea → node.data 中该键被删除 | PASSED |
| 21 | 保存草稿往返含 prompt | saveDraftGraph 请求体含 prompt 配置 | PASSED |

### graph-defs-handlers.spec.ts（9 个，新建 spec 文件）
| # | 测试 | 验证点 | 状态 |
|---|------|-------|------|
| 1 | GET /agent/graph-defs/1002 含 systemPrompt 键 | fixture 1002 LLM 节点 config 含 systemPrompt | PASSED |
| 2 | GET /agent/graph-defs/9999 → 404 | 不存在的图定义返回 404 | PASSED |
| 3 | execute 1001（无 prompt）input="hello" → output="hello" | 默认回退 | PASSED |
| 4 | execute 1002（仅 systemPrompt）→ output="hello world" | 回退穿透 | PASSED |
| 5 | execute 1004（未定义变量）→ success=false，errorMessage 含 undefinedVar + llm_1 | 未定义变量失败 | PASSED |
| 6 | execute 响应字段与 AgentGraphExecuteResp 契约 5 字段精确匹配 | 字段命名一致 | PASSED |
| 7 | execute 9999 → 404 | 不存在的图定义返回 404 | PASSED |
| 8 | 模板值含花括号不二次插值 | input="{{y}}" → output="{{y}}" | PASSED |
| 9 | PUT 保存草稿后 GET 回读确认内存更新 | 保存/回显一致 | PASSED |

## 4. 编译互斥证据（D151 补证：精确时间戳 + 进程快照）

### D151 补证轮（2026-08-21，同轮精确时间戳）

#### 后端编译测试（先执行）
| 时间点 | 事件 |
|--------|------|
| `11:24:03` | 项目级全量测试开始 |
| `11:24:03` | 进程快照：`ps -ef \| grep -E 'pnpm\|npm\|node.*vite\|vitest'` → **无前端进程** |
| `11:24:03` | `MAVEN_OPTS="-Xmx2g" mvn test` 开始 |
| `11:24:44` | 项目级全量测试结束 → **703 tests / 0 / 0 / 0**，BUILD SUCCESS |

#### 前端编译测试（后执行）
| 时间点 | 事件 |
|--------|------|
| `11:25:18` | 前端门禁开始 |
| `11:25:18` | 进程快照：`ps -ef \| grep -E 'mvn\|java.*surefire'` → **无后端进程** |
| `11:25:18-11:25:24` | `NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck` → 退出 0 |
| `11:25:24-11:25:33` | `NODE_OPTIONS="--max-old-space-size=2048" pnpm lint` → 退出 0 |
| `11:25:33-11:25:54` | `NODE_OPTIONS="--max-old-space-size=2048" pnpm test` → 退出 0（79f/775t） |
| `11:25:54-11:26:01` | `NODE_OPTIONS="--max-old-space-size=2048" pnpm build` → 退出 0 |
| `11:26:01` | 前端门禁全部结束 |

#### 互斥证明
- **后端结束 11:24:44 → 前端开始 11:25:18**：间隔 34 秒，**零重叠**
- 后端运行期间无前端进程（快照确认）
- 前端运行期间无后端进程（快照确认）
- 符合 system.md §0.3 硬约束

### 内存限制
- 后端：`MAVEN_OPTS="-Xmx2g"`（强制 2G 上限）
- 前端：`NODE_OPTIONS="--max-old-space-size=2048"`（强制 2G 上限）

## 5. Flyway 迁移范围核对

### 核对方法
- `git diff --name-only` 检查本轮改动文件列表
- 排除所有非 `src/main/resources/db/migration/` 路径的文件
- 确认无新增 `V*.sql` 文件

### 核对结果
- 后端改动 2 个文件：`AgentGraphInterpreter.java` + `AgentGraphInterpreterTest.java`（均在 `src/main/java/` 或 `src/test/java/`，非迁移目录）
- 前端改动 8 个文件：均在 `src/modules/agent/` 或 `src/foundation/mock/`（非迁移目录）
- **无 Flyway 脚本改动**

### 数据库结构核对
- `GraphElement.config` 仍为 `Map<String, Object>` 不透明 Map（未修改实体类）
- 未修改 `sw_agent_graph_def` 表（图定义表）
- 未修改 `sw_agent_graph_execution` / `sw_agent_graph_execution_node` 表（执行历史表）
- 未修改 `sw_agent_model_config` 表（模型配置表）
- 新键 `systemPrompt` / `userPromptTemplate` 以 JSON 形式序列化存储在 `config` 字段内，无 schema 变更

## 6. 测试门汇总（D153 补证轮）

| 门 | 命令 | 退出码 | 备注 |
|----|------|:------:|------|
| 后端模块测试 | `MAVEN_OPTS="-Xmx2g" mvn -pl sw-basic/sw-basic-agent -am test` | 0 | sw-basic-agent **234** tests（D153 补证 12:11:40-12:11:56） |
| 后端项目级测试 | `MAVEN_OPTS="-Xmx2g" mvn test` | 0 | 项目级 **723** tests（D153 补证 12:10:51-12:11:33） |
| 前端类型检查 | `NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck` | 0 | vue-tsc -b --noEmit（D151 11:25:18-11:25:24，D152/D153 代码未变保留） |
| 前端 lint | `NODE_OPTIONS="--max-old-space-size=2048" pnpm lint` | 0 | eslint 0 errors 0 warnings（D151 11:25:24-11:25:33，D152/D153 代码未变保留） |
| 前端单元测试 | `NODE_OPTIONS="--max-old-space-size=2048" pnpm test` | 0 | 79 files / 775 tests（D151 11:25:33-11:25:54，D152/D153 代码未变保留） |
| 前端生产构建 | `NODE_OPTIONS="--max-old-space-size=2048" pnpm build` | 0 | built in 955ms（D151 11:25:54-11:26:01，D152/D153 代码未变保留） |

**D153 前端重跑统一说明**：D153 不重跑前端四门（D153 裁定明确"除取得标准11证据外，不要求无意义重跑前端"）。D152 代码零改动，D151 四门证据（11:25:18-11:26:01 精确时间戳 + ps 进程快照）保留。两份回执（completion.md + test-receipt.md）统一说明：D151 四门证据保留，D152/D153 不重跑前端。

## 7. 测试数量对比

| 指标 | 基线（D148） | D150 | D151 补证轮 | D152 补证轮 | **D153 补证轮** | 增量（vs 基线） |
|------|------------|------|-----------|-----------|---------------|--------------|
| 后端项目级测试 | 685 | 698 | 703 | 723 | **723** | **+38** |
| sw-basic-agent 模块 | 197 | 209 | 214 | 234 | **234** | **+37** |
| 前端 spec files | 78 | 79 | 79 | 79 | 79 | +1 |
| 前端 tests | 760 | 775 | 775 | 775 | 775 | +15 |

**结论**：D153 补证轮测试数量 ≥ 基线（后端 723 vs 685，前端 775 vs 760），0 回归，0 failures / 0 errors / 0 skipped。D153 数字与 D152 一致（代码未变），但 D153 重新执行了后端门禁并提供了完整的互斥快照证据。

## 8. 最终结论

**PASSED（D153 补证后）**

- 后端 723 tests 全绿（≥ 685 基线，+38），D153 重新验证 12:10:51-12:11:56 同数一致
- sw-basic-agent 234 tests 全绿（≥ 197 基线，+37），D153 重新验证同数一致
- 前端 79f/775t 四门全绿（≥ 78f/760t 基线，+1f/+15t），D153 不重跑，D151 证据保留
- Flyway 零改动（D153 补证轮无新代码改动前端，后端仅重新执行测试）
- 编译互斥证据完备：
  - D151 补证：精确时间戳 + ps 进程快照（后端 11:24:03-11:24:44 → 前端 11:25:18-11:26:01，间隔 34s 零重叠）
  - D153 补证：三次 ps 前端零快照（12:09:21/12:10:03/12:10:51）+ 后端门禁 12:10:51-12:11:56（D153 不重跑前端，D151 证据保留）
- 12 项验收标准逐项 PASSED（详见 `completion.md` D153 补证版）

---

**执行层签名**：执行代理（执行角色）
**原始日期**：2026-08-21（D150）
**D151 补证日期**：2026-08-21
**D152 补证日期**：2026-08-21
**D153 补证日期**：2026-08-21
