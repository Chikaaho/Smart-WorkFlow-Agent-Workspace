# Step 9 执行方案：M07-F02 图设计器前端对接

**状态**：Ready — 待执行
**前置**：Step7（图定义 CRUD+发布骨架，PASSED D63）+ Step8（图解释执行引擎，PASSED D64）后端能力齐备（7 端点：CRUD 4 + 发布 + 执行 + 详情），385 tests 基线
**推荐执行模型**：`deepseek/deepseek-v4-pro`（跨前后端契约映射 + 无仓库内可逐行照抄的"opaque graph model ↔ 具体画布库"转换先例，建议保留 pro；成本优化可换 flash，风险自评）
**回执位置**：`product/agent-model-orchestration/receipts/step-9-{execution,test}.md`

---

## §1 背景与目标

M07-F02 后端三段（能画能存=Step7、能跑=Step8）已完结。Step9 是本 Feature 最后一段：让用户在浏览器里**创建图→拖拽编辑节点/边→保存草稿→发布→输入文本执行测试**，闭环打通。

范围严格限定为**对接现有后端契约**，不新增/修改任何后端端点、DB 迁移（agent 路径）、权限语义。

## §2 前置调研关键发现（本次现场核验，均给出路径/行号依据）

| 发现 | 影响 |
|---|---|
| `modules/agent/` 现状仅 `AgentHome.vue` 占位页（`BlankPage`），`adapters/flow-graph/` 零消费方（`grep -rln "adapters/flow-graph" src/modules/` 零命中）；6 导出符号契约稳定：`mountFlowGraph` + `FlowGraphNode/Edge/Data/Events/Instance`（`adapters/flow-graph/index.ts` 全文 151 行） | 本 Step 是 `flow-graph` adapter 的**第一个真实消费方**；只准调用其导出契约，禁止绕过防腐层直接 import `@vue-flow/core` |
| **真实 `sys_menu` 表当前无任何 agent 相关行**（`grep -rn agent db/migration/{,system/}{h2,postgresql}/*.sql` 全部零命中）——`src/foundation/mock/seeds.ts` 里的"智能体"菜单（`permission: 'agent:view'`）**只是前端 mock 兜底数据，非真实种子**，与后端实际权限码（`agent:model:*`/`agent:tool:*`）不一致，真实部署下该菜单不存在，AgentHome 页面当前不可达 | Step9 必须补一条**真实菜单迁移**才能让功能可从菜单点入，否则做完designer也无入口；mock seeds 不动（脱离真实菜单体系，仅测试兜底用途） |
| Flyway 迁移是**跨目录共享同一张 `flyway_schema_history`**（`sw-bootstrap/application.yml` 单一 `spring.flyway.locations` 列出 root + bpm/notify/form/storage/job/agent 共 7 个目录，版本号全局唯一），root 路径（`sys_menu` 所在，`V15__system_mgmt_menu.sql` 为该路径最后一版）历史最大号 V18，但 agent 路径已用到 **V25** → 全局下一个可用版本是 **V26**（与 `memory/state.md` "V26+ 空闲" 结论一致） | 菜单迁移新文件放 `sw-bootstrap/.../db/migration/{h2,postgresql}/V26__agent_graph_menu_seed.sql`（root 路径，不进 agent 子目录——`sys_menu`/`sys_menu_permission` 等表由 root 路径管理，agent 子目录职责仅业务表） |
| 路由分两类：菜单驱动动态路由（`router/guard.ts` 登录后按 `loadMenu()` 结果 `addRoute`，页面 `component` 字段值即 `sys_menu.component`，如 `'workflow/views/ProcessInstanceList'`）vs 参数化直达路由（`router/index.ts` 静态子路由，如 `form/form-designer/:id?`，注释原文："参数化的低代码表单页作为静态子路由挂在根布局下，直达 URL 可进，受 authGuard 保护，无需纳入后端菜单树"） | 图定义**列表页**走菜单驱动路由（`sys_menu` 新行）；图**设计器**画布页仿 `form-designer` 走参数化静态路由 `agent/graph-designer/:id`（从列表页按钮跳转进入，不单独占菜单节点） |
| 后端 7 端点确认（现场读 `AgentGraphDefController.java` 全文）：`POST /agent/graph-defs`（create）、`PUT /agent/graph-defs/{id}/graph`（saveDraftGraph）、`POST /agent/graph-defs/{id}/publish`、`GET /agent/graph-defs/{id}`（getGraph→ProcessGraph）、`GET /agent/graph-defs`（pageDefs）、`DELETE /agent/graph-defs/{id}`、`POST /agent/graph-defs/{id}/execute`；权限沿用 `agent:model:view`（查询二枚 GET）/`agent:model:manage`（其余五枚，含 execute） | 前端 api 层 7 个函数一一对应，无需新增权限判断逻辑之外的适配 |
| 关联端点确认：`GET /agent/models`（模型配置分页，供 LLM 节点下拉）、`GET /agent/tool/internal` + `GET /agent/tool/external`（工具分页，各自独立列表，供 TOOL 节点下拉，需前端合并展示并标记来源） | 设计器节点属性面板的下拉数据源，非新增端点，直接复用 |
| `ProcessGraph{graphKey,name,version,elements,canvas}` / `GraphElement{id,kind('node'\|'edge'),type,source,target,config,style}`——config/style 均为**后端不透明 Map**（后端仅解释 id/kind/type/source/target），节点坐标/画布样式完全由前端自定义，无预留字段 | 前端在 `style` 内自定义画布坐标 key（如 `{x,y}`），是本 Step 的**实现裁定**（非后端契约），需在 adapter 转换层文档化 |
| `flow-graph` adapter 的 `FlowGraphData{nodes:FlowGraphNode[],edges:FlowGraphEdge[]}` 是"节点边分离"模型，与后端 `ProcessGraph.elements`（`kind` 区分的统一列表）结构不同，两者字段名也不同（`FlowGraphNode.position{x,y}` vs 后端无预留位置字段；`FlowGraphNode.data` vs 后端 `config`） | 需要一层**双向转换函数**（`elementsToFlowGraphData` / `flowGraphDataToElements`），职责单一放在 `modules/agent` 内（不进 adapter 本身，adapter 保持 `@vue-flow/core` 防腐层职责不变） |
| 现有前端 api 模式确认（`modules/workflow/api/index.ts`）：`request<T>()` 封装 + 后端分页形状 `{records,total,pageNum,pageSize}` 需经 `adaptPage()` 转 `PageResult<T>{list,total,pageNum,pageSize}`；`contracts/*.ts` 放跨模块类型；组件测试用 `*.spec.ts` 同目录 | `modules/agent/api/index.ts` + `contracts/agent.ts` 严格照此模式新建，`pageDefs` 响应同样需 `adaptPage` |

## §3 范围裁定

### 本 Step 包含

1. **菜单迁移**（2 文件）：`sw-bootstrap/.../db/migration/{h2,postgresql}/V26__agent_graph_menu_seed.sql`——在 `sys_menu` 补"智能体"目录（若已有同名 mock 占位对应的真实目录则复用同一层级结构） + 二级"图定义管理"菜单项（`component: 'agent/views/GraphDefList'`，`permission: 'agent:model:view'`），**不新增权限码**（沿用 Step1/Step7/Step8 既有 `agent:model:view/manage`），按钮级权限（新建/发布/删除）复用同一份 `manage` 码。
2. **contracts**（1 文件）：`Smart-WorkFlow-Web/src/contracts/agent.ts`——`AgentGraphDef`/`GraphElement`/`ProcessGraph`/`AgentModelConfigOption`/`AgentToolOption`/执行请求响应类型，字段与后端 DTO 严格对齐（现场核对，非训练记忆）。
3. **api 层**（1 文件）：`modules/agent/api/index.ts`——7 个图定义函数（create/saveDraftGraph/publish/getGraph/pageDefs/deleteGraphDef/execute）+ 2 个只读辅助函数（`listModelOptions`/`listToolOptions`，各自调用既有 `/agent/models`、`/agent/tool/internal`+`/agent/tool/external` 取全量下拉数据，非分页展示场景可一次性拉取合并）。
4. **图元素转换层**（1 文件）：`modules/agent/utils/graphAdapter.ts`——`elementsToFlowGraphData(elements): FlowGraphData` / `flowGraphDataToElements(data, nodeConfigs): GraphElement[]`，节点坐标存 `style.x/style.y`，节点类型存 `FlowGraphNode.type`（复用后端 `type` 字段值 START/END/LLM/TOOL/CONDITION），节点业务配置（`agentModelConfigId`/`toolName`）存 `FlowGraphNode.data` ↔ 回填 `GraphElement.config`；边的 `config.keyword` 存 `FlowGraphEdge.label`（画布上直接可见关键词，无需额外 data 结构）。
5. **图定义列表页**（1 文件 + 1 测试）：`modules/agent/views/GraphDefList.vue`——分页表格（复用 `pageDefs`）+ 新建（`create`，成功后跳转设计器）+ 发布（`publish`，二次确认）+ 删除（`delete`，二次确认）+ "编辑"按钮跳设计器（`router.push('/agent/graph-designer/' + id)`），零 graph_json 大字段展示（对齐后端 DTO 本就不含该字段）。
6. **图设计器页**（1 文件 + 1 测试）：`modules/agent/views/GraphDesigner.vue`——挂载于参数化静态路由 `agent/graph-designer/:id`：
   - 加载：`getGraph(id)` → `elementsToFlowGraphData` → `mountFlowGraph(container, data, events)`
   - 编辑：`onGraphChange` 回调持有最新 `FlowGraphData`；节点点击（`onNodeClick`）打开属性面板——START/END 无可编辑项；LLM 显示模型配置下拉（`listModelOptions`）写入 `data.agentModelConfigId`；TOOL 显示工具下拉（`listToolOptions`，选项标注 internal/external）写入 `data.toolName`；CONDITION 节点本身无配置，选中其**出边**时显示关键词输入框写入 `edge.label`
   - 保存草稿：`flowGraphDataToElements` → `saveDraftGraph(id, {graphKey, name, version, elements, canvas:{}})`
   - 发布：`publish(id)`，成功后禁用画布编辑（发布态只读展示，符合 Step7 §9 语义："发布后图仍可再次编辑保存"——**不强制只读**，此处按 Step7 实际语义修正为可继续编辑保存草稿，发布只是生成新版本快照，不锁编辑）
   - 执行测试面板：输入框 + "运行"按钮 → `execute(id, input)` → 展示 `success`/`output`/`errorMessage`/`latencyMs`（不落库，纯前端会话内展示，刷新页面即丢失，对齐 Step8 §11"执行不落库"限制）
7. **路由注册**（`router/index.ts` 追加 1 条参数化静态路由 `agent/graph-designer/:id`，`meta.title: '图设计器'`，对齐 `form-designer` 写法）。
8. **测试**：`GraphDefList.spec.ts`（列表渲染/新建跳转/发布确认/删除确认，mock api 层）、`GraphDesigner.spec.ts`（mock `mountFlowGraph`/api 层，验证加载回显、属性面板按节点类型切换、保存草稿调用参数、执行调用与结果展示）、`graphAdapter.spec.ts`（双向转换往返一致性，含 config/style 透传不丢字段）。

### 本 Step 不包含（明确排除，防静默扩权）

- 并行/循环节点的画布交互与属性面板（Step6/8 已排除，节点类型集合仍为 START/END/LLM/TOOL/CONDITION）
- 单步调试/执行过程可视化（当前 execute 是同步一次性返回最终结果，无中间步骤回传）
- 执行历史列表/持久化 UI（Step8 未落库，前端不能凭空造历史）
- 撤回发布/版本回滚 UI（后端未提供该能力）
- 节点/边的正则条件配置项（条件分支仅关键词子串匹配，UI 不得暴露正则输入框误导用户）
- 新增权限码、新增后端端点、修改 agent 路径任何既有迁移脚本
- `adapters/flow-graph/index.ts` 本身的修改（防腐层契约不变，若发现契约不足以支撑设计器需求，须回到本方案层面裁定后另开 Step，不得现场扩展 adapter 导出面）

## §4 关键实现约束

- **图元素坐标存储位置是本 Step 裁定，不是后端契约**：`style.x`/`style.y`，需在 `graphAdapter.ts` 顶部注释写明，避免后续 Step 误以为是后端强制字段。
- **条件边关键词展示**：直接用 `FlowGraphEdge.label` 承载（画布原生渲染边标签），不引入 adapter 契约之外的字段。
- **工具下拉合并**：internal/external 两个来源合并为一个下拉，选项 `value` 必须是后端 `toolName` 精确值（Step8 解释器按 `getToolDefinition().name()` 精确匹配），避免前端拼接导致运行时"工具不存在"。
- **发布态可继续编辑**：与 Step7 published+repeat-publish（版本递增）语义一致，UI 不做发布后锁定。
- **execute 结果不持久化**：页面刷新/离开即丢失，UI 需有轻量提示（不做成"执行历史"的错觉）。

## §5 新增/修改文件清单

**新建（9）**：
```
Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/h2/V26__agent_graph_menu_seed.sql
Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/postgresql/V26__agent_graph_menu_seed.sql
Smart-WorkFlow-Web/src/contracts/agent.ts
Smart-WorkFlow-Web/src/modules/agent/api/index.ts
Smart-WorkFlow-Web/src/modules/agent/utils/graphAdapter.ts
Smart-WorkFlow-Web/src/modules/agent/utils/graphAdapter.spec.ts
Smart-WorkFlow-Web/src/modules/agent/views/GraphDefList.vue
Smart-WorkFlow-Web/src/modules/agent/views/GraphDefList.spec.ts
Smart-WorkFlow-Web/src/modules/agent/views/GraphDesigner.vue
Smart-WorkFlow-Web/src/modules/agent/views/GraphDesigner.spec.ts
```

**修改（1）**：`Smart-WorkFlow-Web/src/router/index.ts`（追加参数化静态路由）

**零修改**：agent 后端任何文件（Step7/Step8 生产代码/迁移）、`adapters/flow-graph/index.ts`、`foundation/mock/seeds.ts`、任何权限码定义。

## §6 测试要求

- `graphAdapter.spec.ts`：elements→FlowGraphData→elements 往返一致（含 config.agentModelConfigId/toolName、edge.config.keyword、style.x/y 不丢失）；空图/仅 START+END 边界；未知节点类型（预留扩展）不崩溃。
- `GraphDefList.spec.ts`：分页渲染、新建后跳转设计器路由、发布二次确认调用 `publish`、删除二次确认调用 `delete`，api 层全 mock（不依赖真实网络）。
- `GraphDesigner.spec.ts`：`mountFlowGraph` mock（不依赖真实 `@vue-flow/core` 渲染）；按节点类型（LLM/TOOL/CONDITION 出边）切换属性面板正确渲染对应输入项；保存草稿组装的 `ProcessGraph` 参数正确；执行成功/失败两种 `execute` mock 响应下 UI 正确展示 `output`/`errorMessage`。
- 全量前端测试门（当前基线 60 spec files / 521 tests）需保持全绿，新增 spec 数量以实际编写为准，不设下限硬指标（对齐 Step7/8 后端"不凑数不缩水"原则）。

## §7 禁止范围（执行时静态检查）

- `git diff --stat` 确认零改动：`Smart-WorkFlow/sw-basic/sw-basic-agent/**`（后端 Step7/8 全部文件）、`Smart-WorkFlow/sw-bootstrap/.../db/migration/agent/**`、`Smart-WorkFlow-Web/src/adapters/flow-graph/**`、`Smart-WorkFlow-Web/src/foundation/mock/seeds.ts`
- `grep` 权限码：确认前端新增代码中仅出现 `agent:model:view`/`agent:model:manage`，未出现新权限码字符串

## §8 验收标准

1. V26 双 dialect 迁移现场执行通过，`sys_menu` 新增行可查（含图定义管理菜单 + 权限关联，若权限-菜单为独立关联表需现场确认表结构后对齐，不得凑造）
2. 图定义列表页可分页/新建/发布/删除，均走真实 api mock 验证参数正确性
3. 图设计器可加载既有图、编辑节点属性（LLM/TOOL/CONDITION 三类）、保存草稿、发布
4. 执行测试面板可提交输入并展示 success/output/errorMessage
5. `graphAdapter` 双向转换往返测试覆盖 config/style 不透明字段不丢失
6. 前端全量测试门全绿，新增 spec 真实执行（无凑造）
7. 禁止范围静态检查全部通过（§7）
8. 权限码零新增（现场 grep 确认）

## §9 展望

- 并行/循环节点、单步调试、执行历史持久化留待后续批次（todo 池，`memory/state.md` 已记录）
- 若发现 `flow-graph` adapter 导出契约不足以支撑更复杂的节点自定义渲染（如按节点类型显示不同图标/颜色），需回到规划层单独评估是否扩展 adapter 契约，不在本 Step 内现场扩权
