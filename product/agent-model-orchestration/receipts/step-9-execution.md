# 执行回执

## 1. Step 编号和名称

**M07 Step 9（前端）：图设计器前端对接** — M07-F02 最后一段（浏览器内 创建图→拖拽编辑→保存草稿→发布→输入文本执行测试 闭环）

- 功能：agent-model-orchestration（M07-F02 图设计器第三步——前端图定义列表 + 图设计器画布 + graphAdapter 转换层 + V26 菜单迁移，对接 Step7/Step8 后端 7 端点）
- 方案文件：`product/agent-model-orchestration/ready/step-9-graph-designer-frontend.md`（§1-§9 全部，唯一权威任务定义）
- 前置：Step7 图定义 CRUD+发布骨架（D63，362 tests）；Step8 图解释执行引擎（D64，385 tests）后端能力齐备
- 测试基线口径：D64 after-Step8 基线 **385 tests**（后端）/ **60 spec files / 521 tests**（前端，state.md 确认）
- **执行时间**：2026-08-11
- **改动文件清单（实际）**：后端新建 2（V26 双 dialect 菜单迁移）；前端新建 8（contracts + api + graphAdapter + 转换层测试 + 列表页 + 列表页测试 + 设计器页 + 设计器页测试）+ 修改 1（router/index.ts 追加参数化静态路由）+ 本回执。**零修改**后端任何生产/测试文件

## 2. 使用模型

- 执行模型：deepseek-v4-flash（本会话实际执行；方案推荐 pro 属同族替换，用户侧成本优化选型惯例，非需核验偏差——同 D54 先例）

## 3. 实际读取的文件

| 文件 | 用途 |
|---|---|
| `ready/step-9-graph-designer-frontend.md` | 本 Step 方案（§1-§9 全部） |
| `receipts/step-8-execution.md`、`step-8-test.md` | Step8 回执（结构/偏差处理模式复用） |
| `sw-basic-agent/.../controller/AgentGraphDefController.java` | 7 端点 + 权限码（view/manage）现场确认 |
| `sw-basic-agent/.../dto/AgentGraphDefDTO.java`、`dto/AgentGraphCreateReqDTO.java`、`dto/graph/ProcessGraph.java`、`dto/graph/GraphElement.java`、`dto/AgentGraphExecuteReqDTO.java`、`dto/AgentGraphExecuteRespDTO.java` | contracts 字段对齐依据 |
| `sw-basic-agent/.../controller/AgentModelController.java` + `dto/AgentModelConfigDTO.java` | `GET /agent/models` 分页响应形状（listModelOptions 数据源） |
| `sw-basic-agent/.../controller/AgentToolConfigController.java` + `dto/AgentToolInternalConfigDTO.java` / `AgentToolExternalConfigDTO.java` + 两个 Query | `GET /agent/tool/{internal,external}` 分页响应形状 + enabled/name 字段（listToolOptions 数据源） |
| `sw-basic-agent/.../orchestration/AgentGraphInterpreter.java` | config 键常量现场确认（agentModelConfigId/toolName/keyword + 节点类型常量 + keywordOf 语义） |
| `sw-basic-agent/.../service/impl/AgentGraphExecutionServiceImpl.java` | TOOL 节点 toolName 精确匹配语义（`eq(name, toolName)` + enabled=1）确认 |
| `sw-bootstrap/.../db/migration/{h2,postgresql}/V1__init_schema.sql` | sys_menu 表结构（V5 后列集） |
| `V5__m_seam_rbac.sql` | sys_menu/sys_role_menu 改造（权限-菜单独立关联表确认：uk_sys_role_menu_tenant） |
| `V6__m_seam_menu_seed.sql` | **关键**：智能体菜单 id=7 已存在（menu_type=1 叶子，`agent/views/AgentHome`，permission `agent:view`）；"不 seed sys_role_menu（超管旁路）"决策 |
| `V10__add_dict_menu.sql`、`V11__fix_system_menu_to_directory.sql`、`V15__system_mgmt_menu.sql`、`V18__init_refresh_token_table.sql` | 菜单迁移写法先例 + V11 目录矫正先例（系统管理 id=1） |
| `sw-bootstrap/.../application.yml` | flyway 7 目录 locations（跨模块共享同一 flyway_schema_history）确认 |
| `sw-bootstrap/.../config/FlywayConfiguration.java` | 主迁移 + prod-update 双链机制 |
| `sw-biz-system-biz/.../AuthMeController.java` + `AuthMenuVO.java` + `SysMenuServiceImpl.java` | 菜单树加载（超管旁路全量返回 / 非超管经 sys_role_menu）、component 为菜单行驱动路由确认 |
| 前端 `adapters/flow-graph/index.ts` | 6 导出契约全文（mountFlowGraph + FlowGraphNode/Edge/Data/Events/Instance），确认无 onEdgeClick、无命令式数据更新 |
| 前端 `modules/workflow/api/index.ts` + `api/index.spec.ts` | request<T>() + adaptPage 模式 |
| 前端 `modules/workflow/views/ProcessDefList.vue`、`ProcessInstanceList.vue` + `ProcessDefList.spec.ts` | 列表页 + spec 模式（StandardListTemplate、stub 风格） |
| 前端 `modules/form/views/FormDesigner.vue` | 参数化路由页面 + 生命周期先例 |
| 前端 `router/index.ts`、`router/guard.ts`、`foundation/menu/index.ts` | 参数化静态子路由写法 + 菜单驱动动态路由机制（component 白名单） |
| 前端 `foundation/request/index.ts` | 响应解包（code!==0 → ApiError，data 返回） |
| 前端 `foundation/permission/index.ts`、`stores/user.ts` | hasPerm/useUserStore（按钮级权限 UX 显隐） |
| 前端 `foundation/mock/seeds.ts` | 「智能体」mock 菜单（`agent:view`，仅 mock 兜底，未动） |
| 前端 `contracts/bpm.ts`、`contracts/common.ts`、`vitest.config.ts`、`package.json` | contracts 风格、分页契约、测试环境（jsdom + EP 自动注册）、scripts |

## 4. 实际修改的文件

**后端新建（2）**：
```
Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/h2/V26__agent_graph_menu_seed.sql
Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/postgresql/V26__agent_graph_menu_seed.sql
```

**前端新建（8）**：
```
Smart-WorkFlow-Web/src/contracts/agent.ts
Smart-WorkFlow-Web/src/modules/agent/api/index.ts
Smart-WorkFlow-Web/src/modules/agent/utils/graphAdapter.ts
Smart-WorkFlow-Web/src/modules/agent/utils/graphAdapter.spec.ts
Smart-WorkFlow-Web/src/modules/agent/views/GraphDefList.vue
Smart-WorkFlow-Web/src/modules/agent/views/GraphDefList.spec.ts
Smart-WorkFlow-Web/src/modules/agent/views/GraphDesigner.vue
Smart-WorkFlow-Web/src/modules/agent/views/GraphDesigner.spec.ts
```

**前端修改（1）**：`src/router/index.ts`（根布局 children 追加 `agent/graph-designer/:id` 参数化静态路由，meta.title='图设计器'，仿 form-designer 写法）

**零修改**：agent 后端任何文件（Step7/Step8 生产/测试零接触）、`sw-bootstrap/.../db/migration/agent/**`、`adapters/flow-graph/index.ts`、`foundation/mock/seeds.ts`、`modules/agent/` 内既有文件（AgentHome.vue 未动）、任何权限码定义（git diff 空，验收 §7/§8）。

## 5. 每个文件的修改摘要

| 文件 | 摘要 |
|---|---|
| `V26__agent_graph_menu_seed.sql`（h2 + postgresql，内容一致） | ①`UPDATE sys_menu SET menu_type=0, component=NULL WHERE id=7`——将 V6 已 seed 的「智能体」叶子菜单矫正为目录（仿 V11 对「系统管理」的矫正先例）；②`INSERT sys_menu (id=15, parent_id=7, name='AgentGraphDef', title='图定义管理', menu_type=1, path='graph-def', component='agent/views/GraphDefList', permission='agent:model:view', icon='Share', sort=10)`。注释写明：权限-菜单独立关联表 sys_role_menu 不 seed（V6 超管旁路决策沿用）；零新增权限码（目录沿用 V6 既有 agent:view，子菜单沿用 agent:model:view/manage）；设计器画布页不占菜单节点（参数化静态路由） |
| `contracts/agent.ts` | AgentGraphDef/GraphElement/ProcessGraph/AgentGraphCreateReq/AgentGraphExecuteReq/AgentGraphExecuteResp/AgentModelConfigOption/AgentToolOption，字段与后端 DTO 逐一对齐（含 config/style 不透明 Map 说明 + style.x/y 前端裁定注释） |
| `modules/agent/api/index.ts` | 7 个图定义函数（createGraphDef/saveDraftGraph/publishGraphDef/getGraphDef/pageGraphDefs/deleteGraphDef/executeGraph，路径与权限逐一对齐 Controller）+ 2 只读下拉辅助（listModelOptions 过滤 enabled、listToolOptions 双端点 Promise.all 合并标注 source，value=toolName 精确值）；pageGraphDefs 经 adaptPage 转 PageResult（模式照抄 workflow api） |
| `modules/agent/utils/graphAdapter.ts` | `elementsToFlowGraphData`（kind 分流；节点坐标读 style.x/y 缺省归零、config→data 拷贝；边 config.keyword→label）/ `flowGraphDataToElements`（节点 style.x/y 写回、data→config；边 label→config.keyword 仅非空写，空=默认边）/ `edgeKeyword`（与后端 keywordOf 语义一致）；顶部注释写明坐标存储为前端裁定非后端契约；节点类型常量与 AgentGraphInterpreter 对齐；只 import `@/adapters/flow-graph`，零 `@vue-flow/core` 直连 |
| `modules/agent/views/GraphDefList.vue` | 分页表格（StandardListTemplate）+ 新建（ElMessageBox.prompt 输名称→createGraphDef→push 设计器）+ 发布（confirm 二次确认→publishGraphDef→刷新，提示新版本号）+ 删除（confirm→deleteGraphDef→刷新）+ 编辑（push `/agent/graph-designer/{id}`）；新建/发布/删除按钮 hasPerm('agent:model:manage') 显隐；状态标签 DRAFT/PUBLISHED；无 graph_json 大字段展示 |
| `modules/agent/views/GraphDesigner.vue` | 挂参数化静态路由；加载 getGraphDef→elementsToFlowGraphData→mountFlowGraph（节点按类型补显示名 label，仅展示不落库）；左侧节点色板（5 类型新增节点，START 不可删）；属性面板按节点类型切换（LLM=模型下拉写 data.agentModelConfigId；TOOL=工具下拉 value=toolName 写 data.toolName；CONDITION=列出出边逐条编辑关键词写 edge.label；START/END 只读提示；删除节点按钮）；保存草稿 flowGraphDataToElements→saveDraftGraph（graphKey/name/version + canvas:{}）；发布 publishGraphDef→成功提示新版本且**不锁编辑**（Step7 语义）；执行面板 execute→展示 success/output/errorMessage/latencyMs + "不落库刷新即失"提示；卸载 destroy 画布实例 |
| `router/index.ts`（修改） | 根布局 children 追加 `agent/graph-designer/:id`（name='agent-graph-designer'，meta.title='图设计器'），与 form-designer 同款注释语义（参数化直达页，受 authGuard 保护，不入菜单树） |
| `graphAdapter.spec.ts`（7 用例） | 往返一致（config.agentModelConfigId/toolName、edge config.keyword、style.x/y 不丢）；空图；仅 START+END；未知节点类型不崩溃；keywordOf 语义（缺失/空/非字符串=默认边） |
| `GraphDefList.spec.ts`（6 用例） | mount 分页参数；新建 prompt→create→push('/agent/graph-designer/99')；发布确认→publish→刷新；发布取消不调用；删除确认→delete→刷新；编辑跳转路由；api 全 mock + element-plus ElMessageBox mock + pinia（hasPerm 依赖 useUserStore） |
| `GraphDesigner.spec.ts`（7 用例） | 加载回显（mountFlowGraph 收到转换后数据：类型/坐标/config→data/关键词→label）；属性面板按类型切换（LLM 模型下拉、TOOL 合并下拉标注来源、CONDITION 出边关键词输入框、START 只读）；保存草稿参数（elements 往返含 style/config/keyword 回填）；执行成功展示 output+耗时；执行失败 success=false 展示 errorMessage；卸载 destroy；mountFlowGraph 全 mock 不依赖真实 @vue-flow/core |

## 6. 实际执行的命令

```
mvn -q -pl sw-bootstrap -am test -o -Dtest=V26MenuMigrationSmokeTest -Dsurefire.failIfNoSpecifiedTests=false   （临时冒烟测试，迭代 5 轮）
mvn test -o -pl '!sw-bootstrap'                                                                                 （全仓库回归，最终 385 tests）
pnpm vitest run src/modules/agent                                                                               （新增 3 spec，迭代 3 轮）
pnpm vitest run                                                                                                 （前端全量，最终 63 files / 539 tests）
pnpm typecheck                                                                                                  （vue-tsc -b --noEmit，零错误）
pnpm lint / lint:fix                                                                                            （eslint 零错误，prettier 自动格式化 6 文件）
git status / git diff --stat / grep 权限码 / ls V26 双 dialect                                                （静态检查）
```

> 注：全量回归以 `-pl '!sw-bootstrap'` 排除 sw-bootstrap（该模块零测试类）。原因：离线仓库缺 `surefire-junit3:3.2.5`（surefire 对"无测试框架模块"的默认 provider，离线无法解析，纯环境缺口，与本次改动无关——已用 `git stash -u` 在纯净基线复跑 `mvn -pl sw-bootstrap test -o` 同报错证实；本 Step 对后端仅新增 2 个 SQL 文件，不触及 pom/测试）。

## 7. 命令输出摘要

- **V26 冒烟测试**（临时，验证后删除）：H2 独立 Flyway 实例按应用配置 6 个 H2 兼容链（root+notify+form+storage+job+agent）跑完整迁移链，日志含 `Migrating schema to version "26 - agent graph menu seed"`；`Tests run: 1, Failures: 0, Errors: 0`；直查断言全过：①flyway_schema_history 有 version=26 成功记录（description='agent graph menu seed'）②sys_menu id=7 已目录化（menu_type=0, component=NULL, permission=agent:view）③sys_menu id=15 图定义管理（parent_id=7, component='agent/views/GraphDefList', permission='agent:model:view', path='graph-def', title='图定义管理'）④智能体目录直接子菜单数=1。临时测试文件与临时 junit 依赖随后全部移除，最终提交零残留。
- **后端全量**：BUILD SUCCESS，**385 tests 0 failures 0 errors**（与基线持平，V26 纯 SQL 无新 Java 测试；证据见测试回执 §5）。
- **前端全量**：**63 spec files / 539 tests 全绿**（60f/521t 基线 + 3 spec + 18 tests）。
- **typecheck**：零错误；**lint**：零 error（prettier 格式 warning 经 lint:fix 处理）。
- **静态检查**：见 §8。

## 8. 与原方案的偏差

**偏差 1（关键，方案 §2 现场核验结论与实际不符——如实报告）**：方案 §2 断言「真实 sys_menu 表当前无任何 agent 相关行（grep 全部零命中）」并据此设计"V26 补'智能体'目录"。现场核实：`V6__m_seam_menu_seed.sql` 第 60 行已 seed「智能体」(id=7, menu_type=1, component='agent/views/AgentHome', permission='agent:view')——方案 grep 在错误目录执行（`db/migration/...` 相对路径在仓库根不存在，真实路径为 `sw-bootstrap/src/main/resources/db/migration/...`）。处理：按方案 §3.1 预留的「若已有同名真实目录则复用其结构层级」分支执行——仿 V11 对「系统管理」(id=1) 的目录矫正先例，V26 先将 id=7 从叶子菜单矫正为目录，再挂二级「图定义管理」。方案 §3.1 原文即双分支设计，本偏差属现场核验修正；不改方案其余任何约束（零新增权限码、不 seed sys_role_menu、设计器走参数化路由均保持）。副作用：`AgentHome.vue` 占位页不再经菜单可达（图定义管理成为智能体目录唯一子菜单），mock seeds 不动。

**偏差 2（实现裁定，方案未覆盖）**：flow-graph adapter 契约 `FlowGraphEvents` 仅 onNodeClick/onEdgeCreate/onGraphChange，**无边点击事件**，"选中其出边"交互无法实现。裁定：条件边关键词编辑放在 CONDITION 节点属性面板内——选中 CONDITION 节点时列出其全部出边逐条编辑（写 edge.label，语义与方案 §4 完全一致）。未扩展 adapter 契约（方案 §3 禁止现场扩权）。

**偏差 3（实现裁定，方案未覆盖）**：adapter 的 `FlowGraphInstance` 仅 exportGraph()/destroy()，无命令式数据更新通道，画布外数据变更（新增/删除节点、改边关键词）无法直接推送画布。裁定：destroy→重新 mountFlowGraph 重挂载（最新 graphData 经 onGraphChange 持有，重挂载不丢位置/拓扑）。未修改 adapter。

**偏差 4（实现裁定）**：方案 §1 要求"创建图→拖拽编辑节点/边"闭环，但 §3.6 未列节点新增 UI。裁定：设计器左侧补节点色板（START/END/LLM/TOOL/CONDITION 5 类型按钮新增节点；START 不可删——执行契约要求唯一 START）。属 §1 闭环的自然组成部分，不扩方案范围。

**偏差 5（方案内部计数不一致）**：方案 §5 标题"新建（9）"但清单实际列 10 个文件（含 graphAdapter.spec.ts），执行层按清单 10 个实现（D59 先例同款：方案内部不一致时以清单为准）。

**偏差 6（验证方式的方案外补充，非语义偏差）**：方案 §8-1 要求"H2 测试实例成功应用 V26 + sys_menu 新增行可查"，但仓库既有测试无一跑完整 Flyway 链（模块测试均用独立 DDL / SQL init），无现成证据源。执行层临时新建 sw-bootstrap 冒烟测试（独立 Flyway 实例 + 直查断言）验证后整体移除（含临时 junit 依赖），最终 git 工作区零残留。过程中发现既有仓库状态：`db/migration/bpm/h2/V8__init_bpm_metadata.sql` 含 PG 独有 partial index 语法（`WHERE active=true`），H2 不支持——全链 H2 迁移从未可跑（模块测试绕过 Flyway），冒烟测试按 6 个 H2 兼容链执行（V26 属 root 链，与 bpm 链无依赖）。此为既有状态，非本 Step 引入，且不在本 Step 禁止范围之外扩权修复，如实记录。

## 9. 遇到的问题

1. **VTU v4 findAllComponents 按 name 匹配失效**（前端测试期）：`findAllComponents({ name: 'el-select' })` 对 stub 组件返回空数组（实测 stub 无名）。改用 stub 模板内绑定 `data-*` 属性 + CSS class 选择器断言（`findAll('.el-option')` 读 attributes），确定性通过。
2. **属性面板断言误中执行面板输入框**：`findAll('.el-input')` 匹配到执行面板的测试输入框，改为在 `.property-panel` 作用域内查询。
3. **ElMessageBox mock 的类型摩擦**：`mockResolvedValueOnce` 参数需符合 MessageBoxData 类型，改用 `vi.hoisted` 的独立 mock 函数（promptMock/confirmMock）消除类型问题。
4. **eslint no-undef: HTMLElement**：GraphDesigner.vue 脚本内 ref<HTMLElement> 需文件头 `/* global HTMLElement */`（ProcessInstanceList.vue 同款先例）。
5. **H2 MODE=PostgreSQL 标识符大小写**（冒烟测试期，迭代 3 轮）：实测 Flyway 历史表（Flyway 自带 DDL 加引号创建）存小写需引号引用；迁移 DDL 未加引号创建的表/列存大写，未加引号引用即可命中。按实测修正查询写法（非凑造）。
6. **全链 H2 迁移不可跑**：bpm/h2 V8 partial index 语法（见偏差 6），冒烟测试排除 bpm 链并在测试注释/回执中如实记录。

## 10. 未完成内容

- 无。方案 §3.2 排除项（并行/循环节点画布交互、单步调试、执行历史 UI、撤回发布、正则条件配置、新增权限码、后端端点、adapter 契约扩展）全部未实现，符合方案范围裁定。
- LLM/工具节点执行测试面板为纯前端会话展示（不落库），真实模型调用依赖 Step8 mock 边界先例（执行环境无可用模型服务）。

## 11. 风险和注意事项

- **V26 将「智能体」叶子菜单矫正为目录**：与 V11 对「系统管理」的先例完全同构；`AgentHome.vue` 占位页失去菜单入口（前端组件仍在，未来如需可挂回菜单）。
- **边关键词编辑依赖 CONDITION 节点选中**（偏差 2）：画布边本身不可点选（adapter 契约限制），若未来需直接点边编辑，需回规划层评估扩展 adapter 契约（方案 §9 展望）。
- **重挂载画布**（偏差 3）：新增/删除节点与改关键词触发 destroy+remount，VueFlow fitViewOnInit 会重置视口缩放，MVP 可接受；数据（graphData）经 onGraphChange 保持最新，无丢失。
- **hasPerm 依赖 pinia**：GraphDefList 测试以 createPinia 插件挂载（useUserStore 默认占位态→按钮可见），真实会话下按权限集显隐（permission 模块注释：仅 UX 显隐，真实鉴权在后端 @ss.hasPermi）。
- **listModelOptions/listToolOptions 一次性拉 1000 条**：非分页展示场景的简化取全量（方案 §3-3 允许），数据量级为配置表规模，可接受。
- 三仓库提交严禁 `Co-Authored-By: Claude` 尾行（仓库惯例硬约束，本次提交已遵守）。

## 12. Git diff 摘要

- 后端改动文件数：2 新建（V26 双 dialect），0 修改；新增行约 60
- 前端改动文件数：8 新建 + 1 修改；新增行约 1500（GraphDesigner.vue 约 560 / GraphDefList.vue 约 230 / graphAdapter.ts 约 140 / api 约 145 / contracts 约 120 / 测试约 480 / router +20）
- 删除行数：0
- 关键变更点：V26（智能体目录矫正 + 图定义管理菜单）→ contracts/api（7 端点对接）→ graphAdapter（elements↔FlowGraphData 双向转换）→ GraphDefList（分页管理入口）→ GraphDesigner（画布加载/编辑/保存/发布/执行）→ router（参数化静态路由）

## 13. 建议执行的测试

- graphAdapter.spec.ts（往返一致性 + 边界）——重点回归项
- GraphDefList.spec.ts（分页/新建跳转/发布/删除确认）
- GraphDesigner.spec.ts（加载回显/属性面板切换/保存参数/执行两种结果）
- 前端全量 63 files / 539 tests
- 后端全量 385 tests 0/0/0（V26 纯 SQL 无新 Java 用例，冒烟验证证据见测试回执 §7）
