# agent-graph-prompt-configuration（M07-F02-02）

> 状态：**COMPLETED（已确认，2026-08-21，第 28 个正式功能；D157 阶段三最终复验 PASSED）** — D150 主体实现保留；D151/D152/D153 补证迭代后 12 项业务功能标准全部通过（D151 标准1/5/11/12 未通过→D152 标准1/11 闭合→D153 标准11 互斥快照 + 标准12 全文同步 + 扩展零命中→D154 规划层最终验收 PASSED（功能级））。后端 723/0/0/0（sw-basic-agent 234）、前端 79f/775t 四门全绿、Flyway V34 零本轮迁移（**测试基线规划确认有效**）；D155/D156 阶段三 FAILED 为合法历史（提前宣告/残留问题，纠正已提交），**D157 阶段三最终复验 PASSED（2026-08-21）确认终态**：M07-F02-02 🟦→✅、终态 ✅24/🟦26/⬜40、功能数 27→28、P6 核销（历史 FAILED 记录保留为历史，见下）。
> 方向文档：`product/agent-graph-prompt-configuration/passed/direction-agent-graph-prompt-configuration.md`（D154 后归档）
> 阶段三方向：已归档 `passed/`（D157 复验后归档）
> D155 纠正方向：`product/agent-graph-prompt-configuration/ready/direction-post-d155-terminal-state-correction.md`
> D156 当前态同步方向：`product/agent-graph-prompt-configuration/ready/direction-post-d156-current-state-sync.md`
> 审查记录：`product/agent-graph-prompt-configuration/receipts/planning-review-d151.md` + `planning-rereview-d152.md` + `planning-rereview-d153.md` + `planning-final-review-d154.md` + `planning-stage3-review-d155.md` + `planning-stage3-review-d156.md` + `planning-stage3-review-d157.md`（最终复验 PASSED）
> 回执：`product/agent-graph-prompt-configuration/receipts/completion.md`（D154 版 + D155/D156 状态说明）+ `test-receipt.md`（D154 版 + D155/D156 状态说明）+ `post-d154-terminal-sync.md`（阶段三同步回执 + D155/D156 状态说明）+ `post-d155-terminal-state-correction.md`（D155 纠正回执）+ `post-d156-current-state-sync.md`（D156 当前态同步回执）

## 1. 功能目标

让有权用户能够在图设计器中为 LLM 节点配置系统 Prompt 与用户 Prompt 模板，并使配置在保存、发布、重载和真实执行中保持一致、可预测且向后兼容。

## 2. 本轮做了什么

- **后端**：
  - `AgentGraphInterpreter` 新增 `systemPrompt` / `userPromptTemplate` 两个 config 键常量
  - `callLlmNode` 方法改造：读取两个新键，构造 SystemMessage + UserMessage 多消息列表
  - 新增 `interpolateTemplate` 方法：`{{variableName}}` 一次性纯字符串插值，正则 `\{\{([A-Za-z_][A-Za-z0-9_]*)}}`
  - 未定义变量复用 `UNDEFINED_VARIABLE` 错误分类与现有异常处理链路
  - 空白 `systemPrompt` 不注入 SystemMessage；空白 `userPromptTemplate` 退化为 inputVar 原文（历史行为）
  - 新增 12 个测试用例覆盖：历史图回归、系统消息注入、空白回退、单变量/多变量/重复变量/非 ASCII 插值、二次展开拒绝、未定义变量失败、组合场景、非法占位符原文保留

- **前端 Step 1**：
  - `graphAdapter.ts` 新增 `NODE_CONFIG_KEY_SYSTEM_PROMPT` / `NODE_CONFIG_KEY_USER_PROMPT_TEMPLATE` 两个常量
  - `LlmPanel.vue` 新增 2 个 textarea（系统 Prompt / 用户 Prompt 模板），含模板语法说明、空白回退提示、未定义变量失败提示
  - `GraphDesigner.updateNodeData` 扩展：`value === undefined` 时 delete 键（空白不落键，避免歧义数据）
  - 新增 6 个测试（graphAdapter round-trip + GraphDesigner 面板回填/写回/删键/保存草稿往返）

- **前端 Step 2（Mock handlers）**：
  - `seeds.ts` 新增 `MockGraphDefEntry` 接口 + 4 个图定义 fixture（1001 无 prompt / 1002 systemPrompt / 1003 userPromptTemplate / 1004 未定义变量）
  - `handlers.ts` 新增 `executeGraphMock` 极简解释器（仅支持 START→LLM→END 单链）+ 3 个 handler：GET /graph-defs/:id、PUT /graph-defs/:id/graph、POST /graph-defs/:id/execute
  - execute 端点实现纯字符串插值 + 未定义变量失败语义
  - 新建 `graph-defs-handlers.spec.ts` 含 9 个测试（GET 详情 / 404 / execute 默认回退 / execute 插值 / execute 未定义变量失败 / 契约字段精确匹配 / 二次展开拒绝 / PUT+GET 内存更新）

## 3. 测试结果

- **D150 后端**：sw-basic-agent 模块 197 → 209（+12）；项目级 685 → 698（+13），0/0/0
- **D151 补证后端**：sw-basic-agent 模块 209 → 214（+5）；项目级 698 → 703（+5），0/0/0
- **D152 补证后端**：sw-basic-agent 模块 214 → **234**（+20）；项目级 703 → **723**（+20），0/0/0
- **D153 补证后端**：D153 重新验证后端门禁（12:10:51-12:11:56），项目级 **723**（与 D152 报告一致，代码未变）/ 0/0/0；sw-basic-agent 模块 **234**（12:11:40-12:11:56）/ 0/0/0。前端三次 ps 零快照（12:09:21/12:10:03/12:10:51），D153 不重跑前端（D153 裁定"除取得标准11证据外，不要求无意义重跑前端"）
- **前端**：78f/760t → 79f/775t（+1f/+15t），D151 补证轮四门重跑退出 0（D152/D153 代码未变，D151 证据保留，两份回执统一说明）
- **编译互斥**：D151 补证轮精确时间戳 — 后端 11:24:03-11:24:44 → 前端 11:25:18-11:26:01（间隔 34s 零重叠），ps 进程快照确认；D152 补证轮项目级全量重跑 11:52:23-11:53:04；**D153 补证轮三次前端零快照（12:09:21/12:10:03/12:10:51）+ 后端门禁 12:10:51-12:11:56 重新验证**

## 4. 实际修改范围

### 后端（4 文件，D150 + D151 + D152 累计）
- `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/AgentGraphInterpreter.java`（D150 +92/-4）
  - 新增 CONFIG_KEY_SYSTEM_PROMPT / CONFIG_KEY_USER_PROMPT_TEMPLATE
  - 新增 PLACEHOLDER_PATTERN 静态常量
  - 修改 callLlmNode 方法签名：`(GraphElement, String)` → `(GraphElement, String, Map<String, String>)`
  - 修改 run() 中 LLM 分支调用点相应传 variables
  - 新增 configString / interpolateTemplate 辅助方法
  - 新增 SystemMessage / ArrayList / List / Matcher / Pattern imports
- `sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/orchestration/AgentGraphInterpreterTest.java`（D150 +369/-0）
  - 新增 12 个 @Test 方法覆盖 prompt 配置全场景
- `sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/service/impl/AgentGraphExecutionServiceImplTest.java`（D151 +5 测试方法）
  - 新增 5 个 ServiceImpl 层测试（用例31-35：发布/重载/授权行为链 + userPromptTemplate 未定义变量真实落库链 + 可查询性 + 模型未调用 verify）
- `sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/controller/AgentGraphDefSecurityIntegrationTest.java`（D152 新建，+20 测试方法）
  - 新建 20 用例 Controller/Security 集成测试，覆盖 5 端点 × 4 类权限映射（授权/撤权/未认证/superadmin豁免）

### 前端（8 文件，+762/-24）
- `src/modules/agent/utils/graphAdapter.ts`（+2）：2 个新常量
- `src/modules/agent/views/panels/LlmPanel.vue`（+67）：2 个 textarea + hint
- `src/modules/agent/views/GraphDesigner.vue`（+14）：updateNodeData 处理 undefined 删除键
- `src/modules/agent/utils/graphAdapter.spec.ts`（+43）：2 个新测试
- `src/modules/agent/views/GraphDesigner.spec.ts`（+151/-24）：el-input stub 扩展 + 4 个新测试
- `src/foundation/mock/seeds.ts`（+159）：MOCK_GRAPH_DEFS + MockGraphDefEntry
- `src/foundation/mock/handlers.ts`（+169）：executeGraphMock + 3 个 handler
- `src/foundation/mock/graph-defs-handlers.spec.ts`（+157，新建）：9 个测试

### 数据库
- **Flyway 零改动**：V34 维持，无新增迁移脚本

## 5. 关键设计决策

1. **systemPrompt 不做变量插值**：设计决策——系统 Prompt 用于角色/规则/背景，与变量无关；非空白时按原样使用
2. **userPromptTemplate 空白退化为 inputVar 原文**：历史行为保持，旧图零迁移
3. **占位符正则**：`\{\{([A-Za-z_][A-Za-z0-9_]*)}}`，仅匹配合法 JS 标识符
4. **变量值按普通文本一次性替换**：不二次解析（避免表达式注入），使用函数式 `replace(re, () => value)` 避免 `$` 特殊字符问题
5. **未定义变量抛 UNDEFINED_VARIABLE**：复用现有错误分类与异常处理链路，模型不会被调用
6. **前端空白不落键**：GraphDesigner.updateNodeData 处理 undefined 时 delete 键，避免空字符串制造歧义数据
7. **Mock 极简解释器**：仅支持 START→LLM→END 单链（不实现 LOOP/FORK/JOIN/CONDITION）；execute 端点直接返回插值后的用户文本作为 output（mock 不调真实 LLM）
8. **方法签名扩展**：callLlmNode 增加 variables 参数，与 readInput 的 inputVar 读取保持同层；模板插值语义在 LLM 节点执行内部完成

## 6. 已知限制

- **Mock 解释器能力有限**：仅支持 START→LLM→END 单链，不实现 LOOP/FORK/JOIN/CONDITION；未来扩展 mock 时需补齐
- **图定义 CRUD MSW handler 仅内存存储**：mock 重启丢失，不持久化；适合开发演示，不适合长期 fixture 维护
- **systemPrompt 不支持变量插值**：设计决策，非技术限制；如需支持需扩展 interpolateTemplate 的调用点

## 7. 验收标准对照（D154 最终复验）

详见 `product/agent-graph-prompt-configuration/receipts/completion.md` + `receipts/test-receipt.md`（D154 版）+ `receipts/planning-final-review-d154.md`（规划层最终验收）。

12 项验收标准逐项对照：
1. ✅ **D152 补证通过**：真实 Service 层 create→saveDraft→publish→getGraph 往返一致 + 发布后编辑/重载 + 未发布图门控（D151）；真实 Controller/Security 请求链 5 端点 × 4 类权限映射 = 20 断言组证明有权身份完成保存/发布/重载/执行、未认证/撤权身份被拒绝（D152 新增 `AgentGraphDefSecurityIntegrationTest` 20 用例）
2. ✅ 用户 Prompt 模板按 `{{variableName}}` 完成纯字符串插值（后端 12 个测试 + Mock 9 个测试覆盖）
3. ✅ 模板未配置/空白时保持历史行为（后端回归测试 + Mock 1001 fixture）
4. ✅ 系统 Prompt 非空时以 SystemMessage 参与调用，空白时不注入（后端注入测试）
5. ✅ **D151 补证通过**：`userPromptTemplate` 未定义变量经真实 Service 落库 FAILED + UNDEFINED_VARIABLE + 模型 verify(never) + 列表/详情可查询
6. ✅ 所有生产执行入口（AgentGraphInterpreter.callLlmNode）对新配置键保持一致（F01 路径无关代码事实）
7. ✅ 既有 modelId/inputVar/outputVar/变量表/分支/LOOP/FORK/JOIN/错误分类/执行历史零回归（项目级 723/0/0/0，D153 重新验证与 D152 报告一致）
8. ✅ 前端配置键与后端契约精确一致，空白不落键，界面明确提示（GraphDesigner + LlmPanel 测试）
9. ✅ Mock 覆盖配置保存/回显、默认回退、成功插值、未定义变量失败（graph-defs-handlers.spec.ts 9 测试）
10. ✅ Flyway 与数据库结构零改动（git status 证据：无 migration/*.sql 改动）
11. ✅ **D153 补证通过**：后端 723/0/0/0（D153 重新验证，12:10:51-12:11:56）、前端 79f/775t 四门全绿（D153 不重跑，D151 证据保留，两份回执统一说明）；三次前端 ps 零快照（12:09:21/12:10:03/12:10:51）+ 后端门禁完整时间戳，互斥证据完备
12. ✅ **D153 补证通过**：清单终态 **✅23 / 🟦27 / ⬜40**（M07-F02-02 保持 🟦）；knowledge 权威入口（current-status/session-handoff/known-issues/features）全文核对完成；扩展零命中关键词覆盖（覆盖 703/214、D151待复验、D152补证进行中 等本轮实际发现的旧基线和旧动作），无过时引用残留

## 8. D151/D152 补证新增测试（D151: 5 个 Service 层；D152: 20 个 Controller/Security 集成）

### D151 补证（5 个，ServiceImpl 层）

| # | 测试方法 | 验证点 |
|---|---------|-------|
| 31 | `promptConfig_publishAndReload_shouldPreserveConfig` | 标准1：发布→重载→systemPrompt/userPromptTemplate 完整保留 |
| 32 | `promptConfig_editAfterPublishReload_shouldReflectUpdate` | 标准1：发布后编辑→重载→反映更新 |
| 33 | `execute_promptTemplateUndefinedVariable_shouldPersistFailedAndNeverCallModel` | 标准5：Service 层 FAILED + UNDEFINED_VARIABLE + 模型未调用 |
| 34 | `execute_promptTemplateUndefined_shouldBeQueryable` | 标准5：失败执行可通过列表/详情查询 |
| 35 | `execute_draftGraphShouldFail_publishedGraphShouldSucceedWithPrompt` | 标准1：DRAFT 门控 + PUBLISHED 执行成功 |

### D152 补证（20 个，Controller/Security 集成测试 `AgentGraphDefSecurityIntegrationTest`）

覆盖 5 端点 × 4 类权限映射 = 20 断言组：

| 端点 | 授权（有权限） | 撤权（无权限） | 未认证（无token） | superadmin 旁路 |
|------|--------------|--------------|----------------|----------------|
| POST /agent/graph-defs（创建） | C1A: 200 | C1B: 403 | C1C: 401 | C1D: 200 |
| PUT /agent/graph-defs/{id}/graph（保存草稿含Prompt） | C2A: 200 | C2B: 403 | C2C: 401 | C2D: 200 |
| POST /agent/graph-defs/{id}/publish（发布） | C3A: 200+PUBLISHED | C3B: 403 | C3C: 401 | C3D: 200 |
| GET /agent/graph-defs/{id}（重载/详情） | C4A: 200+Prompt保留 | C4B: 403 | C4C: 401 | C4D: 200 |
| POST /agent/graph-defs/{id}/execute（执行） | C5A: 200 | C5B: 403 | C5C: 401 | C5D: 200 |

**标准1核心验证**：
- C4A 特别验证：`getGraph` 重载后 `systemPrompt="你是专业翻译。"` + `userPromptTemplate="请翻译：{{input}}"` 完整保留
- 四个测试用户：user_none（无权限）/ user_manage（agent:model:manage）/ super_admin（超管旁路）/ user_view（agent:model:view）
- 真实 Spring Method Security + 真实 AgentGraphDefController + 真实 PermissionService + H2 数据库

## 9. 归档

- 方向文档：`product/agent-graph-prompt-configuration/passed/direction-agent-graph-prompt-configuration.md`（D154 后归档）
- **阶段三、D155 纠正、D156 当前态同步三份方向均保持 `ready/`**：`ready/direction-post-d154-terminal-sync.md`（**不得提前归档**）、`ready/direction-post-d155-terminal-state-correction.md`、`ready/direction-post-d156-current-state-sync.md`
- 完成回执：`product/agent-graph-prompt-configuration/receipts/completion.md`（D154 版 + D155/D156 状态说明）
- 测试回执：`product/agent-graph-prompt-configuration/receipts/test-receipt.md`（D154 版 + D155/D156 状态说明）
- 阶段三同步回执：`product/agent-graph-prompt-configuration/receipts/post-d154-terminal-sync.md`（含 D155/D156 状态说明）
- D155 纠正回执：`product/agent-graph-prompt-configuration/receipts/post-d155-terminal-state-correction.md`
- D156 当前态同步回执：`product/agent-graph-prompt-configuration/receipts/post-d156-current-state-sync.md`
- 规划审查：`product/agent-graph-prompt-configuration/receipts/planning-review-d151.md` + `planning-rereview-d152.md` + `planning-rereview-d153.md` + `planning-final-review-d154.md` + `planning-stage3-review-d155.md` + `planning-stage3-review-d156.md`
