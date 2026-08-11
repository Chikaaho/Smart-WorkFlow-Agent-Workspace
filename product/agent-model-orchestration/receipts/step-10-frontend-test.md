# 测试回执

## 1. Step 编号和名称

**M07-F02 多变量执行上下文（前端属性面板）** — 需求方向文档驱动的执行层自主闭环最终校验（自拆 3 个 Step 全部完成后功能级验收）

- 功能：图设计器属性面板为 LLM/TOOL 节点新增"输入变量名/输出变量名"输入项，对接后端 `config.inputVar`/`config.outputVar` 契约键
- 执行回执：`product/agent-model-orchestration/receipts/step-10-frontend-execution.md`
- 测试基线口径：63 spec files / 539 tests（前端全量，Step9 after 基线）

## 2. 测试环境

- Node v24.18.0；vitest 4.1.9（jsdom 29 环境）；Vue 3.5 + Vue Test Utils 2.4；TypeScript vue-tsc；ESLint 10（含 prettier 插件）
- 操作系统：Linux 5.15（x86_64）；无数据库/无服务依赖（纯前端单测，全部 mock）

## 3. 测试前置条件

- `@/adapters/flow-graph`、`@/modules/agent/api`、`vue-router`、`element-plus` 按 spec 既有模式 vi.mock
- 新增 `mockVarGraph`（带 inputVar/outputVar 契约键的图）与 `mountLoadedWith(graph)` 辅助；`el-input` stub 声明 `emits: ['change']`（修复 fallthrough，见执行回执 §9.1）
- 无数据准备、无外部服务

## 4. 实际执行的测试命令

| # | 命令 | 结果 |
|---|---|---|
| 1 | `pnpm test`（基线确认，改动前） | 63 files / 539 tests 全绿 |
| 2 | `npx vitest run src/modules/agent/utils/graphAdapter.spec.ts`（Step1 定向） | 8/8 通过 |
| 3 | `npx vitest run src/modules/agent/views/GraphDesigner.spec.ts`（Step2 定向） | 修复 stub 后 11/11 通过 |
| 4 | `npx vitest run src/modules/agent/utils/graphAdapter.spec.ts src/modules/agent/views/GraphDesigner.spec.ts`（prettier 格式化后复跑） | 2 files / 19 tests 通过 |
| 5 | `pnpm typecheck` | EXIT=0 |
| 6 | `pnpm lint`（`lint --fix` 后复跑） | EXIT=0（0 errors 0 warnings） |
| 7 | `pnpm test`（全量回归） | **63 files / 546 tests 全绿** |
| 8 | `pnpm build` | EXIT=0（vue-tsc + vite build，10.44s） |

## 5. 各测试项结果

| # | 测试项 | 预期 | 实际 | 通过 |
|---|---|---|---|---|
| 1 | graphAdapter 变量键常量与后端契约精确一致（'inputVar'/'outputVar'/'input'） | 常量值断言 | 与断言一致 | ✅ |
| 2 | graphAdapter：LLM/TOOL config 含 inputVar/outputVar → elements → data → elements 往返精确保留 | 整包展开通道保留全部键 | 两节点 config 往返逐键相等 | ✅ |
| 3 | graphAdapter：data 无变量键（留空=默认变量）往返不产生 inputVar/outputVar 键 | config 无变量键 | 键集合不含两键 | ✅ |
| 4 | GraphDesigner：LLM 属性面板渲染两个变量名输入框，回填 data 既有值（raw/summary），placeholder"留空 = 默认变量 input" | 2 个 el-input + 值 + placeholder | 与预期一致 | ✅ |
| 5 | GraphDesigner：TOOL 属性面板渲染两个输入框，仅 inputVar 回填、outputVar 留空 | ['summary', ''] | 与预期一致 | ✅ |
| 6 | GraphDesigner：LLM 输入变量名 change 事件 → data.inputVar/outputVar 落键，合并写不丢 agentModelConfigId | data 三键并存 | toEqual({agentModelConfigId:7, inputVar:'raw', outputVar:'summary'}) | ✅ |
| 7 | GraphDesigner：变量名留空/空白串 → data 键被移除 | 键删除、不落 config | inputVar 键从 data 消失，outputVar 保持无键 | ✅ |
| 8 | GraphDesigner：TOOL 写回 + 保存草稿 → graph.elements 的 config 含精确契约键 | config = {toolName, inputVar, outputVar} | 与预期一致 | ✅ |
| 9 | 既有用例回归：GraphDesigner.spec 原 7 用例（加载/面板切换/CONDITION/保存/执行×2/卸载） | 全通过 | 全通过 | ✅ |
| 10 | 既有用例回归：graphAdapter.spec 原 5 用例（往返/空图/初始图/未知类型/keywordOf） | 全通过 | 全通过 | ✅ |
| 11 | 全量回归：63 spec files / 546 tests | 基线 539 不减少 | 546 全绿（+7 无回归） | ✅ |
| 12 | typecheck / lint / build | 全绿 | 全绿（lint 0 problems） | ✅ |

## 6. 通过项

- 定向：graphAdapter.spec 8/8、GraphDesigner.spec 11/11（含新增 7 用例全部通过）
- 全量：`Test Files 63 passed (63)` / `Tests 546 passed (546)`（基线 539 → 546，+7 全部可精确对应新增 spec 用例：graphAdapter.spec +3、GraphDesigner.spec +4）
- 四连校验门：typecheck EXIT=0；lint EXIT=0（0 errors 0 warnings）；test EXIT=0；build EXIT=0（`✓ built in 10.44s`）

## 7. 失败项

无遗留失败。过程中失败仅一次迭代自纠：GraphDesigner.spec 首次运行 3 个新用例失败（`"inputVar": "[object Event]"`）——el-input stub 未声明 emits 导致 @change fallthrough 为原生事件监听；声明 `emits: ['change']` 后 11/11 通过（详见执行回执 §9.1）。

## 8. 跳过项及原因

无。

## 9. 关键日志或错误信息

- 迭代自纠期失败断言（修复后消失）：

```
-   "inputVar": "final",
-   "outputVar": "final_out",
+   "inputVar": "[object Event]",
+   "outputVar": "[object Event]",
    "toolName": "http_echo",
```
（根因：stub 组件未声明 emits，父级 @change 收到原生 Event 而非 $emit 参数——已修复并复跑全绿。）

- 全量回归期仅见既有 jsdom 提示 `Not implemented: navigation to another Document`（既有环境提示，非本次引入，不影响结果）

## 10. 是否满足验收标准

| 验收标准（规划层复核项） | 满足 | 证据 |
|---|---|---|
| LLM/TOOL 属性面板各出现"输入变量名/输出变量名"两个输入项，值经 `updateNodeData` 写入 `data.inputVar`/`data.outputVar`，经 graphAdapter 整包往返落 `GraphElement.config`（与后端契约键精确一致） | ✅ | GraphDesigner.vue LLM/TOOL 分支各 2 个 el-input（执行回执 §5.2）；handleVarNameChange 非空路径调 updateNodeData；测试项 6/8 实证 data 落键 + 保存草稿 config 往返含 'inputVar'/'outputVar' 精确键 |
| 新增键常量导出于 graphAdapter.ts（命名对齐 `NODE_CONFIG_KEY_INPUT_VAR`/`NODE_CONFIG_KEY_OUTPUT_VAR`，与后端常量名对应） | ✅ | graphAdapter.ts 常量 + 测试项 1 断言键值 'inputVar'/'outputVar'/'input' 与后端 CONFIG_KEY_*/DEFAULT_VARIABLE_NAME 精确一致 |
| 留空输入框 → 不写入键 → 行为回退默认变量，零迁移 UI 语义正确；placeholder 提示"留空 = 默认变量 input" | ✅ | handleVarNameChange 空白删键路径；测试项 3（adapter 无键不产生键）+ 7（空白串删键）+ 4/5（placeholder 断言"留空 = 默认变量 input"） |
| 前端基线 63f/539t 不回归，新增 spec 覆盖输入项渲染与 config 往返 | ✅ | 63f/539t → 63f/546t（+7 全对应新增用例）；测试项 1-8 覆盖渲染（4/5）、写回（6/8）、留空（3/7）、config 往返（2/8） |
| typecheck / lint / build 全绿 | ✅ | §4 命令 5/6/8 均 EXIT=0 |

## 11. 回归风险

- 低。生产改动仅 2 文件：graphAdapter.ts 纯新增常量与注释（既有导出零改动，往返逻辑零改动）；GraphDesigner.vue 仅在 LLM/TOOL 分支追加输入项与 1 个新函数（既有 updateNodeData/属性面板/执行面板零改动）。CONDITION/START/END 分支与执行测试面板未触碰。
- spec 改动：`el-input` stub 新增 `emits` 声明（对齐真实组件行为，既有断言不依赖 fallthrough）；`mountLoaded` 重构为委托 `mountLoadedWith`（行为等价，原 7 用例断言逐字未变）。
- 全量 546 tests 零回归；契约注释改动（contracts/agent.ts）不参与类型求值（config 类型保持不透明）。

## 12. 最终结论

**PASSED**

## 13. 记忆更新草稿（仅供规划层核对后落盘，不构成最终判定）

### state.md 追加行

M07-F02 Step10 多变量执行上下文前端（本轮执行层自主闭环）：图设计器属性面板 LLM/TOOL 节点新增输入变量名/输出变量名输入项——graphAdapter 新增 NODE_CONFIG_KEY_INPUT_VAR/OUTPUT_VAR 键常量与后端契约键精确对齐，data↔config 整包往返零 adapter 逻辑改动；空白=默认变量 input 删键不落 config；前端 63f/539t→63f/546t（+7 无回归）。（判定占位：PASSED（待编号））

### decisions.md 新增条目

D_TBD | 2026-08-11 | M07-F02 Step10 前端核验判定：PASSED。63f/539t→63f/546t。①键常量 NODE_CONFIG_KEY_INPUT_VAR/OUTPUT_VAR='inputVar'/'outputVar'、DEFAULT_VARIABLE_NAME='input'，与后端 CONFIG_KEY_* 精确对齐；②非空经 updateNodeData 写入 data，空白=默认变量删键不落 config；③placeholder"留空 = 默认变量 input"兼作 input 同物 UI 提示 | Active

### issues.md 新增条目

无新增

### features.md 状态变更

无变化（M07-F02 后端 Step10 PASSED（D66，392 tests）+ 前端 Step10 执行完成（63f/546t），功能整体状态待规划层按回执验收后更新）
