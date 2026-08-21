# 完成回执：agent-graph-prompt-configuration（M07-F02-02，D150 → D153 补证，D154 规划层最终验收 PASSED（功能级）/ D155/D156 阶段三 FAILED（当前态同步回执已提交，待 D157 复验））

> **执行终态**：FAILED → D153 补证已完成 → **D154 规划层最终验收 PASSED（功能级）/ D155/D156 阶段三 FAILED**（D150 自验 PASSED → D151 FAILED 4项 → D151 补证 → D152 FAILED 2项 → D152 补证 → D153 FAILED 2项 → D153 补证已完成 → **D154 PASSED（功能级）** 2026-08-21；**D155 阶段三 FAILED**（提前宣告规划层 COMPLETED / 提前归档阶段三方向 / handoff 全文未收敛），纠正已提交；**D156 阶段三复验 FAILED**（仅提交后当前态未同步），当前态同步回执已提交，待 D157 复验）
> **方向文档**：`product/agent-graph-prompt-configuration/passed/direction-agent-graph-prompt-configuration.md`（D154 后归档）
> **阶段三方向保持 `ready/`**：`product/agent-graph-prompt-configuration/ready/direction-post-d154-terminal-sync.md`（**不得提前归档**）
> **D155 纠正方向**：`product/agent-graph-prompt-configuration/ready/direction-post-d155-terminal-state-correction.md`
> **审查记录**：`product/agent-graph-prompt-configuration/receipts/planning-review-d151.md` + `receipts/planning-rereview-d152.md` + `receipts/planning-rereview-d153.md` + `receipts/planning-final-review-d154.md` + `receipts/planning-stage3-review-d155.md` + `receipts/planning-stage3-review-d156.md`
> **阶段三同步回执**：`product/agent-graph-prompt-configuration/receipts/post-d154-terminal-sync.md`（含 D155/D156 状态说明）；**D155 纠正回执**：`receipts/post-d155-terminal-state-correction.md`；**D156 当前态同步回执**：`receipts/post-d156-current-state-sync.md`
>
> **状态说明（2026-08-21，D155 阶段三 FAILED 后更新）**：本回执下方关于"阶段三 COMPLETED"、"第 28 个已完成功能"、"清单 24/26/40"、"功能数 28"、"P6 已核销"、"M07-F02-02 ✅"等叙述为执行层候选终态，**D155 规划层复验未通过**（提前宣告规划层 COMPLETED / 提前归档阶段三方向 / handoff 全文未收敛）。**规划确认当前口径**：功能数 27、清单 ✅23/🟦27/⬜40、M07-F02-02 仍 🟦、P6 待确认。测试基线 723/agent234、79f/775t、V34 零迁移**规划确认有效**。本回执原测试事实不改。
> **D156 复验状态（2026-08-21）**：D155 纠正回执已提交；D156 阶段三复验 FAILED（仅提交后当前态未同步）；D156 当前态同步回执 `post-d156-current-state-sync.md` 已提交，待 D157 复验。审查 `receipts/planning-stage3-review-d156.md`。
> **原始回执日期**：2026-08-21
> **D151 补证日期**：2026-08-21
> **D152 补证日期**：2026-08-21
> **D153 补证日期**：2026-08-21
> **D154 规划层最终验收**：2026-08-21
> **阶段三终态同步**：2026-08-21

## 0. 总体摘要

LLM 节点系统 Prompt + 用户 Prompt 模板一次性纯字符串插值端到端闭环。空白回退 `inputVar` 原文、缺失变量调用前失败、历史图零迁移兼容。零 Flyway。前后端编译严格串行、2G 内存上限、同轮互斥证据完备。D150 主体实现保留，D151 补证闭合标准5 真实 Service 失败落库链，D152 补证闭合标准1 Controller/Security 真实请求链身份授权，D153 补证闭合标准11 互斥快照（开始前三次 ps 前端零快照 + 重新验证后端 723/agent234 与 D152 报告一致）与标准12 knowledge 权威入口全文核对（扩展零命中关键词覆盖，修正 current-status/session-handoff/features/功能清单残留）。项目级测试 698（D150）→ 703（D151）→ 723（D152/D153 同数一致，D153 重新验证）。

## 1. 验收标准逐项对照

### 标准 1：有权用户可在图设计器 LLM 节点中分别配置系统 Prompt 和用户 Prompt 模板；节点切换、保存、重新打开、发布及重新加载后内容保持一致
**PASSED（D152 补证后通过）**。
- `LlmPanel.vue` 新增 2 个 textarea（系统 Prompt / 用户 Prompt 模板），分别绑定 `NODE_CONFIG_KEY_SYSTEM_PROMPT` / `NODE_CONFIG_KEY_USER_PROMPT_TEMPLATE`
- 配置通过 `node.data` → graphAdapter 整包透传 → `el.config` → 后端 `GraphElement.config` 链路保存/加载
- D150 证据：`GraphDesigner.spec.ts` 「保存草稿往返含 prompt」用例 PASSED
- **D151 补证（真实 Service 层行为链）**：
  - `AgentGraphExecutionServiceImplTest` 用例31：create → saveDraft（含 prompt 配置）→ publish → getGraph（重载）→ 验证 systemPrompt/userPromptTemplate 完整保留
  - `AgentGraphExecutionServiceImplTest` 用例32：发布后 saveDraft 覆盖 graph_json → 重载 → 验证更新后的 prompt 配置被读取（编辑/重载行为链）
  - `AgentGraphExecutionServiceImplTest` 用例35：未发布图执行被门控（PARAM_ERROR）；发布后执行成功且 prompt 配置生效
  - 发布/重载行为链有真实 Service 层自动化证据
- **D152 补证（真实 Controller/Security 请求链身份授权证据）**：
  - `AgentGraphDefSecurityIntegrationTest` 20 用例，覆盖 5 端点 × 4 类权限映射（授权/撤权/未认证/superadmin豁免）：
    - `POST /agent/graph-defs`（创建）：有 manage 权限 → 200，无权限 → 403，无 token → 401，superadmin → 200
    - `PUT /agent/graph-defs/{id}/graph`（保存草稿含 Prompt）：有 manage 权限 → 200，无权限 → 403，无 token → 401，superadmin → 200
    - `POST /agent/graph-defs/{id}/publish`（发布）：有 manage 权限 → 200 + status=PUBLISHED，无权限 → 403，无 token → 401，superadmin → 200
    - `GET /agent/graph-defs/{id}`（重载/详情）：有 view 权限 → 200 + Prompt 配置完整保留（systemPrompt="你是专业翻译。" + userPromptTemplate="请翻译：{{input}}"），无权限 → 403，无 token → 401，superadmin → 200
    - `POST /agent/graph-defs/{id}/execute`（执行）：有 manage 权限 → 200（鉴权通过，业务失败为 DRAFT 图门控），无权限 → 403，无 token → 401，superadmin → 200
  - 请求经真实 Spring Method Security（`@PreAuthorize` + `@ss.hasPermi`）、真实 `AgentGraphDefController`、真实 `PermissionService`（`"ss"` Bean）与 H2 数据库
  - 四类测试用户：user_none（无权限，验证 403）/ user_manage（agent:model:manage）/ super_admin（超管旁路）/ user_view（agent:model:view）
  - 证明：**有权身份可完成保存/发布/重载/执行 Prompt 配置，未认证身份一律 401，撤权身份一律 403，superadmin 旁路放行**——不得把"图已发布"解释为"用户已授权"
  - 项目级测试 703→**723**（sw-basic-agent 214→234，+20）

### 标准 2：用户 Prompt 模板按 `{{variableName}}` 从既有命名变量表完成纯字符串插值；覆盖单变量、多变量、重复变量、非 ASCII、变量值含占位符样式但不二次展开
**PASSED**。
- 后端 `AgentGraphInterpreter.interpolateTemplate` 实现正则 `\{\{([A-Za-z_][A-Za-z0-9_]*)}}`，一次性替换
- 测试证据（`AgentGraphInterpreterTest.java` 12 个新测，全部 PASSED）：
  - `llmNodeWithUserPromptTemplateSingleVar`：单变量
  - `llmNodeWithUserPromptTemplateMultipleVars`：多变量
  - `llmNodeWithUserPromptTemplateRepeatedVar`：重复变量
  - `llmNodeWithUserPromptTemplateNonAscii`：非 ASCII（中文/emoji）
  - `llmNodeWithTemplateValueContainingBracesNoSecondPass`：变量值含 `{{x}}` 不二次解析
  - `llmNodeWithTemplateContainingUnknownSyntaxLeftIntact`：非法占位符原文保留

### 标准 3：模板未配置、空字符串或纯空白时，真实执行保持历史行为：以 `inputVar` 指向变量的原始值作为用户消息；历史图无需迁移即可继续执行
**PASSED**。
- 后端：`userPromptTemplate == null || isBlank()` 时直接使用 `text`（即 `readInput` 读出的 inputVar 值）
- 测试证据：
  - `llmNodeWithoutPromptConfigBackwardCompatible`：历史图无 prompt 配置，行为与旧版一致
  - `llmNodeWithBlankUserPromptTemplateFallsBackToInputVar`：空白模板退化为 inputVar 原文
- Mock 证据：`graph-defs-handlers.spec.ts` 「execute 1001（无 prompt）input='hello' → output='hello'」PASSED

### 标准 4：系统 Prompt 非空时以系统消息语义参与模型调用，空白时不注入；用户消息与系统消息不得角色互换或简单拼成无法区分的单一字符串
**PASSED**。
- 后端：`systemPrompt != null && !isBlank()` 时构造 `SystemMessage`，添加到消息列表首位；`UserMessage` 独立添加
- 测试证据：
  - `llmNodeWithSystemPromptInjected`：消息列表含 SystemMessage + UserMessage，角色不互换
  - `llmNodeWithBlankSystemPromptNotInjected`：空白 systemPrompt 仅 UserMessage
  - `llmNodeWithTemplateAndSystemPromptCombined`：两者都配置，消息列表顺序：SystemMessage 在前，UserMessage 在后

### 标准 5：模板引用未定义变量时，在模型调用前按既有未定义变量错误语义失败；不调用模型、不发送原始占位符、不静默置空，并进入既有失败执行与历史记录链路
**PASSED（D151 补证后通过）**。
- 后端：`interpolateTemplate` 内部检测到变量未定义时抛 `GraphExecutionException`，category=`UNDEFINED_VARIABLE`，复用现有错误分类
- D150 证据：
  - `AgentGraphInterpreterTest.llmNodeWithTemplateUndefinedVariableFails`：抛 UNDEFINED_VARIABLE，mock ChatModel 验证 `verify(never)` 模型未被调用
  - Mock 证据：`graph-defs-handlers.spec.ts` 「execute 1004」PASSED
- **D151 补证（真实 `AgentGraphExecutionServiceImpl` 全落库链）**：
  - `AgentGraphExecutionServiceImplTest` 用例33：`userPromptTemplate="Hello, {{missing}}!"` 经真实 Service 执行 → ①响应 `success=false` + errorMessage 含 "missing"；②落库 `status=FAILED` + `errorCategory=UNDEFINED_VARIABLE` + errorMessage 含 "missing"；③`verify(mockModel, never()).call(any(Prompt.class))` 证明模型未被调用
  - `AgentGraphExecutionServiceImplTest` 用例34：同一失败执行可查询 → `pageExecutions` 列表返回 `status=FAILED/errorCategory=UNDEFINED_VARIABLE`；`getExecution` 详情返回完整 errorMessage/input
  - 全链路证据：解释器抛异常 → Service catch → classifyError 提取 UNDEFINED_VARIABLE → executionMapper.updateById 写 FAILED 记录 → persistNodeTraces 写节点明细 → 列表/详情端点可查

### 标准 6：所有实际消费图定义 LLM 节点的生产执行入口对新配置键、插值、回退和失败规则保持一致；若某既有 F01 路径与图定义无关，回执须提供不纳入的代码事实
**PASSED**。
- 后端唯一生产执行入口：`AgentGraphInterpreter.callLlmNode` —— 本轮已改造，所有通过该入口的 LLM 节点调用均遵循新契约
- F01 路径（`AgentGraphFactory.callModel`）事实：
  - F01 处理的是「单节点图 + 历史消息 + 工具」场景，与图定义解释执行无关
  - F01 不消费 `GraphElement.config` 的 `systemPrompt` / `userPromptTemplate` 键——其历史消息由 `AgentConversationService` 提供，工具由 `AgentGraphFactory.buildToolCallbacks` 提供
  - F01 路径本轮零改动（方向明确排除）
- 测试证据：F01 相关测试（`AgentGraphFactoryTest.java`）零回归

### 标准 7：`modelId`、`inputVar`、`outputVar`、变量写回、CONDITION/END、LOOP/FORK/JOIN、错误分类和执行历史查询均无回归；本轮不改变图调度或状态机
**PASSED**。
- 后端项目级全量测试：685 → 698（+13），**0 failures / 0 errors / 0 skipped**
- 现有 24 个 `AgentGraphInterpreterTest` 用例全部 PASSED（含 LOOP/FORK/JOIN/CONDITION/END/错误分类全覆盖）
- `GraphExecutionException` 8 类 category 体系零改动
- `AgentGraphExecutionServiceImpl` 执行历史落库零改动
- Flyway 零改动（V34 维持）

### 标准 8：前端配置键与后端契约精确一致，空白配置不制造歧义数据；界面明确展示模板语法、默认回退及未定义变量失败提示，不使用 `v-html` 或动态代码执行
**PASSED**。
- 前端常量 `NODE_CONFIG_KEY_SYSTEM_PROMPT = 'systemPrompt'` / `NODE_CONFIG_KEY_USER_PROMPT_TEMPLATE = 'userPromptTemplate'` 与后端 `CONFIG_KEY_*` 精确一致
- `GraphDesigner.updateNodeData` 扩展：`value === undefined` 时 delete 键，空白不落键
- `LlmPanel.vue` hint 文案使用 `<code v-text="VAR_SYNTAX_EXAMPLE" />` 静态渲染，不使用 `v-html`
- 测试证据：`GraphDesigner.spec.ts` 「清空 systemPrompt 删键」PASSED

### 标准 9：Mock 覆盖配置保存/回显、默认回退、成功插值和未定义变量失败，并与真实接口字段及执行语义一致
**PASSED**。
- Mock handlers 补齐：
  - `GET /agent/graph-defs/:id`：返回含 prompt 配置的图定义
  - `PUT /agent/graph-defs/:id/graph`：保存草稿，内存更新
  - `POST /agent/graph-defs/:id/execute`：极简解释器（START→LLM→END），实现 `{{variableName}}` 插值 + 未定义变量失败
- seeds.ts 新增 4 个图定义 fixture（1001 无 prompt / 1002 systemPrompt / 1003 userPromptTemplate / 1004 未定义变量）
- 测试证据（`graph-defs-handlers.spec.ts` 9 个测试，全部 PASSED）：
  - GET 详情含 systemPrompt 键 / 404
  - execute 默认回退（1001）/ execute 插值（1003 调整）/ execute 未定义变量失败（1004）
  - 响应字段与 `AgentGraphExecuteResp` 契约 5 字段精确匹配
  - 模板值含花括号不二次插值
  - PUT 保存后 GET 回读确认

### 标准 10：Flyway 与数据库结构零改动；回执须提供迁移范围核对证据
**PASSED**。
- `git diff --name-only` 未包含任何 Flyway 迁移脚本路径
- 后端未新增 `V*.sql` 文件
- 数据库结构零改动：未修改 `GraphElement` 表、未修改执行历史表、未修改模型配置表
- `GraphElement.config` 仍为 `Map<String, Object>` 不透明 Map，新键以 JSON 形式序列化存储，无 schema 变更

### 标准 11：后端受影响测试与项目级回归、前端 `typecheck`、`lint`、`test`、`build` 均在 2G 上限下通过，测试数量不得低于当前基线后端 685/0/0/0、前端 78 files / 760 tests；前后端编译测试严格串行并提供同轮互斥证据
**PASSED（D151 补证：精确时间戳 + 进程互斥快照；D153 补证：重新验证后端 + 三次前端零快照 + 不重跑前端统一说明）**。
- 后端：项目级全量 **723 tests / 0 failures / 0 errors / 0 skipped**（≥ 685 基线；D150 的 698 + D151 补证 5 个 ServiceImpl 新测 + D152 补证 20 个 Controller/Security 集成测试）
- sw-basic-agent 模块：**234 tests**（D150 的 209 + D151 的 5 + D152 的 20）
- 前端：**79 spec files / 775 tests / 0 failures**（≥ 78f/760t 基线），四门退出 0（D152/D153 补证未改前端代码，D151 四门证据保留，两份回执统一说明）
- 编译互斥：前后端严格串行，`MAVEN_OPTS="-Xmx2g"` / `NODE_OPTIONS="--max-old-space-size=2048"` 强制 2G 上限
- **D151 补证 — 同轮精确时间戳与进程快照**：
  - 后端测试开始：`2026-08-21 11:24:03`，结束：`11:24:44`（41s）
    - 开始前进程快照：`ps -ef | grep -E 'pnpm|npm|node.*vite|vitest'` → 无前端进程
  - 前端门禁开始：`2026-08-21 11:25:18`，结束：`11:26:01`（43s）
    - 开始前进程快照：`ps -ef | grep -E 'mvn|java.*surefire'` → 无后端进程
  - 间隔：后端结束 11:24:44 → 前端开始 11:25:18，间隔 34 秒，零重叠
  - 前端四门精确时间：typecheck 11:25:18-11:25:24 → lint 11:25:24-11:25:33 → test 11:25:33-11:25:54 → build 11:25:54-11:26:01
- **D152 补证 — 项目级测试晋级**：
  - 后端 11:52:23-11:53:04 全量测试（`MAVEN_OPTS="-Xmx2g" mvn test`），项目级 723/0/0/0，BUILD SUCCESS
  - sw-basic-agent 模块 234 tests（2026-08-21 11:52:16-11:52:19 模块测试，20 用例 3.335s 全 PASSED）
  - 前端代码未变，D151 的四门证据保留
- **D153 补证 — 互斥快照重新验证 + 不重跑前端统一说明**：
  - D153 裁定：D152 的 11:52 Maven 轮缺开始前前端进程零快照，不能沿用 D151 的 11:24 旧轮；完成/测试回执对是否重跑前端表述冲突
  - D153 修正：
    - 前端三次 ps 零快照：`12:09:21` / `12:10:03` / `12:10:51`（grep -iE 'vite|pnpm|npm (run|install)|node .*build|node .*test' 全部零命中）
    - 后端门禁重新执行：`12:10:51-12:11:33`（项目级）+ `12:11:40-12:11:56`（agent 模块专项），项目级 723/0/0/0 + agent 234/0/0/0，与 D152 报告数字一致（代码未变）
    - **D153 不重跑前端**（D153 裁定明确"除取得标准11证据外，不要求无意义重跑前端"；D152 代码零改动，D151 四门证据保留）
    - **两份回执统一说明**：D151 四门证据保留（11:25:18-11:26:01 精确时间戳 + ps 进程快照），D152/D153 不重跑前端
- 详见 `test-receipt.md` D153 补证节

### 标准 12：完成 §3.3 第10项知识库全量同步：M07-F02-02、current-status、功能追踪、known-issues、session-handoff、需求池与功能清单全文口径一致；无关清单行零漂移，并在回执中报告清单变更明细与知识库触碰文件清单
**PASSED（D153 补证后扩展零命中关键词覆盖，全文核对完成）**。
- D151 退回问题：completion.md 前次写 `✅24 / 🟦26 / ⬜40` 与 `🟦→✅`，与规划确认的 `✅23 / 🟦27 / ⬜40` 不符；memory 入口曾因自验 PASSED 提前声明 28/COMPLETED，与 FAILED 终态冲突。D151 已修正。
- D152 退回问题：knowledge 权威入口（current-status/session-handoff/known-issues）未全文核对；功能清单有 D150 自验错误残留。D152 已修正。
- D153 退回问题：零命中关键词覆盖不足（D152 只查"第 28 个已完成/✅24🟦26"，未覆盖 703/214、D151待复验、D152补证待提交、D152补证进行中 等本轮实际发现的旧基线和旧动作）；memory/issues 未反映补证已提交待规划复验。D153 已修正。
- **D154 阶段三终态同步报告（D155 FAILED / D156 复验 FAILED（仅提交后当前态未同步），当前态同步回执已提交待 D157 复验；规划确认口径仍 27/23-27-40/🟦）**：
  - 已完成功能数：**D154 功能级 PASSED / D155/D156 阶段三 FAILED / 待 D157 复验确认**（规划确认口径 27；执行层拟同步 28 待 D157 复验）
  - M07-F02-02 状态：**D154 功能级 PASSED / D155/D156 阶段三 FAILED / 待 D157 复验确认**（规划确认 🟦；执行层拟升 ✅ 待 D157 复验）
  - 清单终态：**✅24 / 🟦26 / ⬜40，共 90 行**（执行层拟同步，M07-F02-02 🟦→✅ 待 D157 复验；规划确认口径 23/27/40）
- **D151/D152/D153 历史裁定保留**（作为带日期的历史记录，不代表当前状态）：
  - D151 裁定：规划确认基线 703/214，M07-F02-02 保持 🟦
  - D152 裁定：规划确认基线 703/214，M07-F02-02 保持 🟦
  - D153 裁定：规划确认基线 703/214（723/234 待 D154 复验），M07-F02-02 保持 🟦，D153 补证已完成待 D154 复验
- 知识库触碰文件清单（D153 补证轮全文核对，覆盖 D151/D152/D153 三轮）：
  - `knowledge/current-status.md`：§1 整体概览表格更新测试基线（703→723，含 D153 重新验证时间戳）；§1「当前进行」节标题与内容更新为 D153 状态；§1「功能清单」行更新 D151→D153；§4「进行中功能」节更新为 D153 状态；底部最后更新时间戳；§1 测试基线行更新 D152→D153（含 D153 三次 ps 快照 + 不重跑前端说明）
  - `knowledge/session-handoff.md`：§0 标题更新为 D153 状态；内容补 D153 裁定结果（标准1通过，标准11回退，标准12仍失败）；审查链添加 planning-rereview-d153.md
  - `knowledge/features/agent-graph-prompt-configuration.md`：头部状态更新为 D153；审查记录添加 planning-rereview-d153.md
  - `knowledge/known-issues.md`：I45 更新反映 D153 状态
  - `Smart-WorkFlow/功能清单.md`：M07-F02-02 保持 🟦，D153 状态反映
  - `memory/state.md`：当前进行功能节更新为 D153 状态
  - `memory/features.md`：M07-F02-02 行更新为 FAILED/D153 补证已完成，待 D154 规划层复验
  - `memory/handoff.md`：当前进行功能节更新为 D153 状态；当前基线/下一动作/新会话提示更新
  - `memory/issues.md`：最后更新日期更新为 2026-08-21，I45 状态反映 D153
  - `todo/requirement-pool.md`：未改动
- 清单变更明细：D150 自验错误声明的 `🟦→✅` 在 D151 已撤回；D152/D153 再次验证功能清单中 M07-F02-02 保持 🟦；**D154 阶段三终态同步** M07-F02-02 🟦→✅，其他 89 行零漂移
- **终态（D154 阶段三终态同步后）**：**✅24 / 🟦26 / ⬜40，共 90 行**（执行层候选终态；规划确认口径仍 ✅23/🟦27/⬜40，待 D157 复验；**非**与 D154 规划确认一致——D154 规划确认口径为 23/27/40）
- **扩展零命中证明**（D153 审查要求，覆盖本轮实际发现的旧基线和旧动作）：
  - `第 28 个已完成\|第28个已完成` 零命中
  - `✅24.*🟦26\|✅ 24.*🟦 26` 零命中
  - `D151待复验\|待D151复验` 零命中（排除 memory/state.md:7 中 D153 审查记录引用）
  - `D152 补证进行中\|D152补证进行中\|D152 待第二次补证` 零命中（D153 本轮新发现）
  - `D152待复验\|待D152复验` 零命中
  - `M07-F02-02上调\|M07-F02-02.*上调` 零命中
  - `尚缺授权\|尚缺knowledge` 零命中
  - `D152只有10/12\|D152只有.*10.*12` 零命中

## 2. 实际修改文件清单

### 后端（4 文件）
| 文件 | 摘要 |
|------|------|
| `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/AgentGraphInterpreter.java` | D150：新增 2 config 键常量 + PLACEHOLDER_PATTERN + 修改 callLlmNode 签名与消息组装 + 新增 configString / interpolateTemplate 辅助方法 + 4 个新 import |
| `sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/orchestration/AgentGraphInterpreterTest.java` | D150：新增 12 个测试方法 + 2 个新 import |
| `sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/service/impl/AgentGraphExecutionServiceImplTest.java` | **D151 补证**：新增 5 个 ServiceImpl 层测试（用例31-35：发布/重载/授权行为链 + userPromptTemplate 未定义变量真实落库链 + 可查询性 + 模型未调用 verify）+ 4 个新 import（verify/never/SystemMessage/UserMessage/ArgumentCaptor） |
| `sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/controller/AgentGraphDefSecurityIntegrationTest.java` | **D152 补证**：新建 20 用例 Controller/Security 集成测试，覆盖 5 端点 × 4 类权限映射（授权/撤权/未认证/superadmin豁免），证明真实请求链下有权身份完成保存/发布/重载/执行 Prompt 配置、未认证/撤权身份被拒绝 |

### 前端（8 文件，+762/-24）
| 文件 | 行数变化 | 摘要 |
|------|---------|------|
| `src/modules/agent/utils/graphAdapter.ts` | +2 | 新增 NODE_CONFIG_KEY_SYSTEM_PROMPT / NODE_CONFIG_KEY_USER_PROMPT_TEMPLATE 常量 |
| `src/modules/agent/views/panels/LlmPanel.vue` | +67 | 新增 2 textarea + hint 文案 |
| `src/modules/agent/views/GraphDesigner.vue` | +14 | updateNodeData 处理 undefined 删除键 |
| `src/modules/agent/utils/graphAdapter.spec.ts` | +43 | 新增 2 测试 |
| `src/modules/agent/views/GraphDesigner.spec.ts` | +151/-24 | el-input stub 扩展 + 4 测试 |
| `src/foundation/mock/seeds.ts` | +159 | MOCK_GRAPH_DEFS + MockGraphDefEntry |
| `src/foundation/mock/handlers.ts` | +169 | executeGraphMock + 3 个 handler |
| `src/foundation/mock/graph-defs-handlers.spec.ts` | +157（新建） | 9 个测试 |

### 数据库
- **Flyway 零改动**：无新增迁移脚本
- **数据库结构零改动**：未修改任何表定义

## 3. 关键设计决策

1. **systemPrompt 不做变量插值**：用于角色/规则/背景，与变量无关
2. **userPromptTemplate 空白退化为 inputVar 原文**：历史行为保持，旧图零迁移
3. **占位符正则**：`\{\{([A-Za-z_][A-Za-z0-9_]*)}}`，仅匹配合法 JS 标识符
4. **变量值按普通文本一次性替换**：不二次解析，使用函数式 `replace` 避免 `$` 特殊字符问题
5. **未定义变量抛 UNDEFINED_VARIABLE**：复用现有错误分类，模型不会被调用
6. **前端空白不落键**：避免空字符串制造歧义数据
7. **Mock 极简解释器**：仅支持 START→LLM→END 单链

## 4. 已知限制

- **Mock 解释器能力有限**：仅支持 START→LLM→END 单链，不实现 LOOP/FORK/JOIN/CONDITION
- **图定义 CRUD MSW handler 仅内存存储**：mock 重启丢失
- **systemPrompt 不支持变量插值**：设计决策，非技术限制

## 5. 测试回执

详见 `test-receipt.md`。

## 6. 与方向偏差

**无偏差**。严格执行方向文档全部要求，未扩大范围、未触碰非目标（助手/RAG/SSE、Token 统计、单步调试、模板引擎、数据库迁移）。

## 7. 待规划层确认

- 规划层对照 12 项验收标准逐项确认
- 通过则归档 `product/agent-graph-prompt-configuration/passed/`
- 不通过则 FAILED/BLOCKED 退回执行层

---

**执行层签名**：执行代理（执行角色）
**日期**：2026-08-21
