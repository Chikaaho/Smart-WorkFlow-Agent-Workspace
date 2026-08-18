# 执行回执

## 1. Step 编号和名称

**M07-F02 多变量执行上下文（前端属性面板）** — 本轮为需求方向文档驱动的执行层自主闭环，自拆 3 个 Step 全部完成（规划层不逐 Step 收取回执，此为功能级完成回执，自拆 Step 概要见 §5）

- 功能：agent-model-orchestration（M07-F02 图设计器能力延伸——图设计器属性面板为 LLM/TOOL 节点新增"输入变量名/输出变量名"输入项，对接后端已落地的 `config.inputVar`/`config.outputVar` 契约键）
- 方向文档：`product/agent-model-orchestration/ready/step-10-multivar-context-backend.md`（目标 §2 / 非目标 §3 / 影响范围 §4，唯一权威任务定义）
- 后端执行回执（前端契约键权威来源）：`product/agent-model-orchestration/receipts/step-10-execution.md`（§9 设计决策 + §11 风险提示：变量名 `input` 与默认变量同物需 UI 提示；CONDITION/END 经 inputVar 指定——本轮不做）
- 前置调研回执：`search_fallback/m07-multivar-context-precedent.md`（Q5/Q6：graphAdapter.ts 与 GraphDesigner.vue 磁盘现状全量源码，改动面直接依据）
- 前置：后端 Step10 PASSED（D66，392 tests）；前端 Step9 图设计器 PASSED（D65，63f/539t）
- 测试基线口径：63 spec files / 539 tests（前端全量）
- **执行时间**：2026-08-11
- **改动文件清单（实际）**：修改 5（`graphAdapter.ts`、`GraphDesigner.vue`、`graphAdapter.spec.ts`、`GraphDesigner.spec.ts`、`contracts/agent.ts`）；新建 0；后端 0（禁止触碰）

## 2. 使用模型

- 执行模型：deepseek-v4-flash（本会话实际执行；方向文档与记忆确认同族模型替换属用户成本优化选型惯例，非需核验偏差）

## 3. 实际读取的文件

| 文件 | 用途 |
|---|---|
| `product/agent-model-orchestration/ready/step-10-multivar-context-backend.md` | 需求方向文档（目标/非目标/影响范围） |
| `product/agent-model-orchestration/receipts/step-10-execution.md` | 后端执行回执（§5 契约键/§9 设计决策/§11 风险——前端 UI 语义依据） |
| `search_fallback/m07-multivar-context-precedent.md` | 前置调研（Q5/Q6 前端磁盘现状全量源码，改动面直接依据） |
| `/data/reasonix/files/system.md`（§6/§7） | 17 项结构自查参考 + 回执格式（§7.1/§7.2） |
| `Smart-WorkFlow-Web/docs/governance/engineering-constitution.md` | 前端工程宪法（执行层身份边界、四连校验门） |
| `Smart-WorkFlow-Web/src/modules/agent/utils/graphAdapter.ts`（磁盘现状，与调研一致） | 改造对象（常量 + 顶部映射约定） |
| `Smart-WorkFlow-Web/src/modules/agent/views/GraphDesigner.vue`（磁盘现状，与调研一致） | 改造对象（属性面板 template + 写回函数） |
| `Smart-WorkFlow-Web/src/contracts/agent.ts` | 契约类型（config 为不透明 Record，零类型改动，仅注释同步） |
| `Smart-WorkFlow-Web/src/modules/agent/utils/graphAdapter.spec.ts` / `views/GraphDesigner.spec.ts` | 既有 spec（测试模式/桩结构/基线断言参照） |
| `product/agent-model-orchestration/receipts/step-9-test.md` / `step-10-test.md` | 同功能族回执格式参照（§13 记忆更新草稿格式） |

## 4. 实际修改的文件

**修改（5 个）**：

1. `Smart-WorkFlow-Web/src/modules/agent/utils/graphAdapter.ts`
2. `Smart-WorkFlow-Web/src/modules/agent/views/GraphDesigner.vue`
3. `Smart-WorkFlow-Web/src/modules/agent/utils/graphAdapter.spec.ts`
4. `Smart-WorkFlow-Web/src/modules/agent/views/GraphDesigner.spec.ts`
5. `Smart-WorkFlow-Web/src/contracts/agent.ts`（仅注释）

新建 0；未修改：`adapters/flow-graph`、`modules/agent/api`、mock 层、router。

## 5. 每个文件的修改摘要（含自拆 Step 概要）

### 自拆 Step 概要（执行层自主拆分，3 步）

| Step | 名称 | 验收结果 |
|---|---|---|
| 1 | graphAdapter 新增变量键常量 + 映射注释同步 + 往返 spec | graphAdapter.spec 8/8 通过（+3 用例） |
| 2 | GraphDesigner 属性面板 LLM/TOOL 变量名输入项 + 写回 + spec | GraphDesigner.spec 11/11 通过（+4 用例） |
| 3 | 契约注释同步 + 四连校验门 + 提交 + 回执 | typecheck/lint/test/build 全绿；63f/539t→63f/546t（+7 无回归）；提交 b2a9cff |

### 逐文件摘要

1. **`graphAdapter.ts`**（+7）：
   - 新增 3 个常量：`NODE_CONFIG_KEY_INPUT_VAR = 'inputVar'`、`NODE_CONFIG_KEY_OUTPUT_VAR = 'outputVar'`（键值与后端 `AgentGraphInterpreter.CONFIG_KEY_INPUT_VAR`/`CONFIG_KEY_OUTPUT_VAR` 精确一致；命名对齐既有 `NODE_CONFIG_KEY_MODEL_ID`/`NODE_CONFIG_KEY_TOOL_NAME` 模式）、`DEFAULT_VARIABLE_NAME = 'input'`（与后端 `DEFAULT_VARIABLE_NAME` 对齐，placeholder 单一数据源）
   - 顶部映射约定注释同步：LLM/TOOL 节点 config.inputVar/config.outputVar 键说明（留空/缺失 = 默认变量 input，与后端 resolveVarName 宽松语义一致）
   - **转换逻辑零改动**：`FlowGraphNode.data ↔ GraphElement.config` 为整包浅拷贝展开，新键经既有通道自动往返（调研回执 Q5 结论落实）

2. **`GraphDesigner.vue`**（+71）：
   - 文件头注释同步（LLM/TOOL 编辑语义补 inputVar/outputVar）
   - import 新增 `DEFAULT_VARIABLE_NAME`/`NODE_CONFIG_KEY_INPUT_VAR`/`NODE_CONFIG_KEY_OUTPUT_VAR`
   - 新增 `handleVarNameChange(key, value)`：trim 后非空 → 经既有泛化 `updateNodeData(key, name)` 合并写 `data[key]`（不重挂载画布）；空白 → 直接删除 data 键（留空 = 默认变量，config 不落空串，graph_json 零迁移干净）
   - LLM 分支：模型配置下拉后追加「输入变量名」「输出变量名」两个 `el-input`（`:model-value` 回读 `data?.[键] ?? ''`，`@change` 写回，placeholder = `留空 = 默认变量 input`）
   - TOOL 分支：工具下拉后同款追加两个 `el-input`
   - **不新增节点类型/不触碰 CONDITION、END、START、执行测试面板**

3. **`graphAdapter.spec.ts`**（+77，新增 3 用例）：
   - 变量键常量与后端契约精确一致（'inputVar'/'outputVar'/'input'）
   - LLM/TOOL config 含 inputVar/outputVar：elements → data → elements 往返精确保留（整包展开通道实证）
   - data 无变量键（留空=默认变量）：往返不产生 inputVar/outputVar 键

4. **`GraphDesigner.spec.ts`**（+152，新增 4 用例）：
   - 变量名输入项渲染：LLM/TOOL 属性面板各两个输入框，回填 data 既有值（mockVarGraph：LLM inputVar='raw'/outputVar='summary'；TOOL 仅 inputVar），placeholder 断言"留空 = 默认变量 input"
   - LLM 输入写回：change 事件 → data.inputVar/outputVar 落键，合并写不丢既有 agentModelConfigId
   - 留空（含空白串）：键被移除（data 无键，不落 config——零迁移语义）
   - TOOL 写回 + 保存草稿：`flowGraphDataToElements` 整包往返后 graph.elements 的 config 含精确契约键（'inputVar'/'outputVar'）
   - 辅助：`el-input` stub 声明 `emits: ['change']`（修复 fallthrough，见 §9）；新增 `mountLoadedWith(graph)` 辅助（既有 `mountLoaded` 重构为委托，断言不变）

5. **`contracts/agent.ts`**（仅注释 +4/-1）：头部契约说明补 LLM/TOOL 节点 config 键清单（agentModelConfigId/toolName/inputVar/outputVar 见 graphAdapter 常量，留空 = 默认变量 input）；`config` 类型保持不透明 `Record<string, unknown>` 零改动

## 6. 实际执行的命令

| # | 命令 | 结果 |
|---|---|---|
| 1 | `pnpm test`（全量，基线确认） | EXIT=0（63f/539t） |
| 2 | `npx vitest run src/modules/agent/utils/graphAdapter.spec.ts` | EXIT=0（Step1，8/8） |
| 3 | `npx vitest run src/modules/agent/views/GraphDesigner.spec.ts` | 首次 8/11（stub fallthrough 修复前）→ 修复后 EXIT=0（11/11） |
| 4 | `pnpm lint --fix`（prettier 5 处格式警告自动修复）+ `pnpm lint` | EXIT=0（0 problems） |
| 5 | `pnpm typecheck` | EXIT=0 |
| 6 | `pnpm test`（全量） | EXIT=0（63f/546t） |
| 7 | `pnpm build` | EXIT=0（vue-tsc + vite build，10.44s） |

## 7. 命令输出摘要

- 全量测试：63 spec files passed / 546 tests passed（基线 539 → 546，+7 全部对应新增 spec 用例）
- 定向 spec：graphAdapter.spec 8/8；GraphDesigner.spec 11/11
- typecheck：`vue-tsc -b --noEmit` 零错误；lint：0 errors 0 warnings；build：`✓ built in 10.44s`
- 提交：`b2a9cff`（develop 分支，与 M07 Step7/8/9 前端提交同分支连续）

## 8. 与原方案的偏差

无"原方案"可比对——本轮为需求方向文档驱动的自主闭环（规划层只下发方向，Step 拆分与方案设计由执行层按根 system.md §6 17 项自查完成）。与方向文档及任务约束的对照：

- ✅ 目标达成：图设计器属性面板 LLM/TOOL 节点新增"输入变量名/输出变量名"输入项，值经 `updateNodeData` 合并写 `data.inputVar`/`data.outputVar`，经 graphAdapter 整包往返落 `GraphElement.config`（与后端契约键 'inputVar'/'outputVar' 精确一致）
- ✅ 键常量导出于 graphAdapter.ts（`NODE_CONFIG_KEY_INPUT_VAR`/`NODE_CONFIG_KEY_OUTPUT_VAR`/`DEFAULT_VARIABLE_NAME`，与后端常量名对应）
- ✅ 留空语义：空白输入 → 不写入键 → 行为回退默认变量 `input`（零迁移 UI 语义）；placeholder 提示"留空 = 默认变量 input"
- ✅ 非目标未触碰：后端零改动；CONDITION/END 变量输入项未做（后端回执 §11 说明为设计语义）；并行/循环节点未做；执行测试面板零改动
- ✅ 前端调研关键约束落实：adapter 零逻辑改动（仅常量）；写回走既有泛化 `updateNodeData`（非空路径）；无重挂载画布

## 9. 遇到的问题

1. **vue-test-utils stub 事件 fallthrough（调试定位）**：`el-input` stub 未声明 `emits` 时，父组件 `@change` 被 Vue 作为 attrs fallthrough 到 stub 根元素作为原生事件监听，父级 handler 收到的是原生 Event 而非 `$emit` 参数（GOT_VALUE 为 `{"isTrusted":false,"_vts":...}`）。修复：stub 声明 `emits: ['change']`，与真实 element-plus 组件行为一致。不影响既有断言。
2. **commitlint subject-case 拦截**：提交信息以 "M07" 大写开头触发 `subject-case` 规则（前端仓库 commitlint 配置，后端仓库无此限制）。修复：subject 改中文开头（与仓库既有提交风格一致），commitlint 校验通过后提交。
3. **看门狗中断导致后台任务输出丢失**：后台运行的全量 test/build 输出文件为空（进程已被清理）。修复：前台重跑全部校验门，拿到确定退出码。

## 10. 未完成内容

无。方向文档目标/非目标范围内的内容全部完成。

## 11. 风险和注意事项

1. **变量命名冲突（后端回执 §11 风险①的 UI 侧落实）**：变量名 `input` 与默认变量同物——placeholder"留空 = 默认变量 input"显式提示；前端不拦截用户显式使用 `input` 名（与后端"有意复用"语义一致），不留非法状态。
2. **CONDITION/END 变量输入项未做**：设计语义明确（后端回执 §11.2/§11.3），本轮非目标；属性面板无对应输入项，图设计者如需该能力待后端方向文档确认后另行排队。
3. **宽松解析的静默回退**：变量名输入已限定为字符串（el-input 天然字符串），空白 = 删键 = 默认变量；与后端 resolveVarName 宽松语义一致，无类型错配路径。
4. **数据流顺序依赖**：inputVar 指向未写入变量 = 运行时 success=false（后端语义），前端不做执行前数据流静态校验（方向文档 §3 已排除）——属性面板仅提供变量名录入，不校验引用关系。

## 12. Git diff 摘要

- 提交：`b2a9cff`（develop 分支，与 M07 Step7/8/9 前端提交同分支连续）
- 改动文件数：5（全部 Smart-WorkFlow-Web 内：2 生产 + 2 测试 + 1 契约注释）
- 新增行：303；删除行：8
- 关键变更点：graphAdapter 键常量 +3、GraphDesigner 输入项 +71、spec +7 用例（graphAdapter +3 / GraphDesigner +4）、contracts 注释同步

## 13. 建议执行的测试

1. 重点验证：GraphDesigner.spec 变量名输入项用例（渲染回填 / LLM/TOOL 写回 / 留空删键 / 保存草稿 config 精确契约键往返）；graphAdapter.spec 变量键往返用例
2. 边界验证：留空与空白串（'   '）删键行为；TOOL 仅 inputVar 时 outputVar 不回填为空输入框
3. 全量回归：63f/546t 已跑通，规划层复核时可抽查两个新增 spec 文件

**验收标准对照（规划层复核用）**：
- LLM/TOOL 属性面板各出现"输入变量名/输出变量名"两个输入项，值经 `updateNodeData` 写入 `data.inputVar`/`data.outputVar`，经 graphAdapter 整包往返落 `GraphElement.config`（与后端契约键精确一致）✅（GraphDesigner.vue template + handleVarNameChange + GraphDesigner.spec 保存草稿用例）
- 新增键常量导出于 graphAdapter.ts（命名对齐 `NODE_CONFIG_KEY_INPUT_VAR`/`NODE_CONFIG_KEY_OUTPUT_VAR`，与后端常量名对应）✅
- 留空输入框 → 不写入键 → 行为回退默认变量，零迁移 UI 语义正确；placeholder 提示"留空 = 默认变量 input"✅
- 前端基线 63f/539t 不回归，新增 spec 覆盖输入项渲染与 config 往返 ✅（63f/546t，+7）
- typecheck / lint / build 全绿 ✅
