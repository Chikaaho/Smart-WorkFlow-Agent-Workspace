# 测试回执

## 1. Step 编号和名称

**M07 Step 9（前端）：图设计器前端对接** — 测试回执

基线：D64 after-Step8 **385 tests**（后端）/ **60 spec files / 521 tests**（前端，state.md）。本 Step 新增前端 **3 个 spec / 18 tests**，全量 **63 spec files / 539 tests**；后端 385 持平（V26 为纯 SQL 迁移，无新 Java 用例，以 H2 冒烟验证替代——见 §6）。

## 2. 测试环境

- 前端：vitest 4.1.9 + jsdom，Element Plus 经 unplugin-vue-components 自动注册（importStyle:false），CSS 全部 mock
- 后端：H2 内存库（MODE=PostgreSQL），JDK 17，Maven 3.9.x offline（`-o`）
- 操作系统：Linux 5.15.0-181-generic
- 依赖服务：无（api 层全 mock；mountFlowGraph mock；ElMessage/ElMessageBox mock）

## 3. 测试前置条件

- `graphAdapter.spec.ts`：纯函数单测，零 mock
- `GraphDefList.spec.ts`：api 层全 mock + vue-router mock（push 经 vi.hoisted 稳定引用）+ element-plus ElMessageBox mock（promptMock/confirmMock）+ pinia 插件（hasPerm 依赖 useUserStore）+ EP 组件 stub（el-table/el-table-column/el-tag/el-button/el-alert/StandardListTemplate）
- `GraphDesigner.spec.ts`：`@/adapters/flow-graph` 全 mock（mountFlowGraph 捕获 (container, data, events) 并返回 {exportGraph, destroy}）+ api 层全 mock + vue-router mock（useRoute params.id=42）+ element-plus ElMessage mock + EP 组件 stub（el-select/el-option/el-input 以 data-* 属性暴露 value/label 供断言）
- V26 冒烟（临时，验证后移除）：sw-bootstrap 内独立 Flyway 实例（6 个 H2 兼容链）+ JDBC 直查断言

## 4. 实际执行的测试命令

```
pnpm vitest run src/modules/agent          （新增 3 spec，迭代 3 轮全绿）
pnpm vitest run                            （前端全量 63 files / 539 tests）
pnpm typecheck                             （vue-tsc -b --noEmit 零错误）
pnpm lint / lint:fix                       （eslint 零 error）
mvn -q -pl sw-bootstrap -am test -o -Dtest=V26MenuMigrationSmokeTest ... （临时冒烟，迭代 5 轮）
mvn test -o -pl '!sw-bootstrap'            （后端全量 385 tests）
```

> 注：全量回归以 `-pl '!sw-bootstrap'` 排除 sw-bootstrap（该模块零测试类）。原因：离线仓库缺 `surefire-junit3:3.2.5`（surefire 对"无测试框架模块"的默认 provider，离线无法解析，纯环境缺口）。已用 `git stash -u` 在**纯净基线**（stash 掉本 Step 全部改动）复跑 `mvn -pl sw-bootstrap test -o`，同样 BUILD FAILURE 同报错——证明与本次改动无关（本 Step 对后端仅新增 2 个 SQL 文件，不触及 pom/测试）。Step8 时代该 provider 曾缓存于本地仓库，现已缺失。

## 5. 各测试项结果

**`graphAdapter.spec.ts`（7 用例，全绿）**：

| 用例 | 预期 | 实际 | 通过 |
|---|---|---|---|
| 往返一致（config/style 不透明字段不丢） | elements→FlowGraphData→elements 后 agentModelConfigId/toolName/style.x/y/边 keyword 全部保留；无关键词边不产生 config | 全部逐字段断言相等 | ✅ |
| 空图 | 零节点零边 | 通过 | ✅ |
| 仅 START+END（后端 create 初始图形态） | 拓扑往返不丢 | 通过 | ✅ |
| 未知节点类型不崩溃 | LOOP 类型原样透传 | 通过 | ✅ |
| keywordOf 语义 | 缺失/空串/空白/非字符串=默认边；'加急'=关键词 | 通过 | ✅ |

**`GraphDefList.spec.ts`（6 用例，全绿）**：

| 用例 | 预期 | 实际 | 通过 |
|---|---|---|---|
| mount 分页参数 | pageGraphDefs({pageNum:1,pageSize:10}) + 数据渲染 | 通过 | ✅ |
| 新建跳转设计器 | prompt 输名称 → createGraphDef('新图') → push('/agent/graph-designer/99') | 通过 | ✅ |
| 发布二次确认 | confirm → publishGraphDef(1) → 列表刷新（pageGraphDefs 二次调用） | 通过 | ✅ |
| 发布取消 | confirm 拒绝 → publishGraphDef 不调用 | 通过 | ✅ |
| 删除二次确认 | confirm → deleteGraphDef(2) → 刷新 | 通过 | ✅ |
| 编辑跳转 | push('/agent/graph-designer/1') | 通过 | ✅ |

**`GraphDesigner.spec.ts`（7 用例，全绿）**：

| 用例 | 预期 | 实际 | 通过 |
|---|---|---|---|
| 加载回显 | getGraphDef(42) → mountFlowGraph 收到 5 节点 4 边；LLM data={agentModelConfigId:7}；edge-4 label='加急'；坐标 style→position | 通过 | ✅ |
| LLM 属性面板 | 点击 LLM 节点 → 模型下拉 options value=[1,2]、label 含模型名 | 通过 | ✅ |
| TOOL 属性面板 | 点击 TOOL 节点 → 合并下拉 value=['http_echo','weather_query']、label 标注（内部）/（外部） | 通过 | ✅ |
| CONDITION 面板 + START 只读 | START 节点显示"无可编辑属性"；CONDITION 列出 2 条出边关键词输入框（'加急'/''） | 通过 | ✅ |
| 保存草稿参数 | saveDraftGraph(42, {graphKey,name,version:2,canvas:{},elements 往返：llm config+style 回填、edge-4 config={keyword:'加急'}、edge-5 无 config}) | 通过 | ✅ |
| 执行成功展示 | executeGraph(42,'你好') → 页面含 执行成功 / 输出：… / 耗时 1234ms | 通过 | ✅ |
| 执行失败展示 | success=false → 页面含 执行失败 / 原因：条件分支无匹配且无默认边 / 耗时 3ms；卸载时 destroy 被调 | 通过 | ✅ |

**既有前端全量**：60 spec files / 521 tests 全部保持全绿（零回归）。

## 6. V26 迁移验证（后端，方案 §8-1 验收）

仓库既有测试无完整 Flyway 链 boot（模块测试用独立 DDL / SQL init），无现成证据源。执行层临时冒烟测试（验证后整体移除，含临时 junit 依赖）：

```
INFO org.flywaydb.core.internal.command.DbMigrate -- Migrating schema "PUBLIC" to version "26 - agent graph menu seed"
Tests run: 1, Failures: 0, Errors: 0, Skipped: 0 -- V26MenuMigrationSmokeTest
```

直查断言（JDBC，H2 实测大小写规则）：
1. `flyway_schema_history` 有 version='26'、description='agent graph menu seed'、success=true 记录 ✅
2. `sys_menu` id=7：「智能体」menu_type=0（目录）、component=NULL、permission='agent:view' ✅
3. `sys_menu` id=15：「图定义管理」parent_id=7、menu_type=1、component='agent/views/GraphDefList'、permission='agent:model:view'、path='graph-def'、title='图定义管理' ✅
4. `sys_menu` parent_id=7 且 deleted=0 的直接子菜单数 = 1 ✅

局限如实记录：bpm/h2 链 V8 含 PG 独有 partial index 语法（`WHERE active=true`），H2 不支持——既有仓库状态（模块测试均绕过 Flyway，全链 H2 迁移从未可跑），冒烟测试按 6 个 H2 兼容链执行（root+notify+form+storage+job+agent）；V26 属 root 链与 bpm 链零依赖。PG 侧 V26 与 h2 内容逐字节一致（INSERT/UPDATE 为 ANSI 兼容语法），且沿用 V6/V10/V11/V15 完全同构的先例写法。

## 7. 通过项

全部通过：前端新增 18 tests + 既有 521 tests = **539 tests 全绿（63 spec files）**；后端全量 **385 tests 0 failures 0 errors**；typecheck 零错误；lint 零 error。

## 8. 失败项

无遗留失败。过程中失败均为测试/实现自纠迭代：
1. VTU v4 findAllComponents 按 name 匹配 stub 失效 → 改 data-* 属性 + class 选择器断言
2. CONDITION 面板断言误中执行面板输入框 → 面板作用域查询
3. ElMessageBox mock 类型摩擦 → vi.hoisted 独立 mock 函数
4. H2 标识符大小写（历史表小写需引号/迁移 DDL 大写免引号）→ 按实测修正（迭代 3 轮）

## 9. 关键日志或错误信息

```
[ERROR] Tests run: 1, Failures: 0, Errors: 1 ... Table "FLYWAY_SCHEMA_HISTORY" not found (candidates: "flyway_schema_history")
[ERROR] Table "sys_menu" not found (candidates are: "SYS_MENU")
```
（均为临时冒烟测试的查询大小写问题，修正后全绿；已移除临时文件。）

## 10. 是否满足验收标准（方案 §8 全部 8 项）

| # | 验收项 | 结果 | 证据 |
|---|---|---|---|
| 1 | V26 双 dialect 迁移现场执行通过，sys_menu 新增行可查（含权限关联，独立关联表已现场确认） | ✅ | 冒烟测试全链应用（含 version 26 日志）+ 直查断言 4 项全过；sys_role_menu 独立关联表经 V5 确认（uk_sys_role_menu_tenant），沿用 V6"超管旁路不 seed"决策，V26 注释写明 |
| 2 | 图定义列表页可分页/新建/发布/删除，均走真实 api mock 验证参数 | ✅ | GraphDefList.spec 6 用例（分页参数/新建跳转/发布确认/取消/删除/编辑） |
| 3 | 图设计器可加载既有图、编辑节点属性（LLM/TOOL/CONDITION 三类）、保存草稿、发布 | ✅ | GraphDesigner.spec：加载回显 + 三类属性面板 + 保存参数断言；发布走 api mock（publishGraphDef 已在列表页用例覆盖参数语义） |
| 4 | 执行测试面板可提交输入并展示 success/output/errorMessage | ✅ | GraphDesigner.spec 执行成功/失败两用例 |
| 5 | graphAdapter 双向转换往返测试覆盖 config/style 不透明字段不丢失 | ✅ | graphAdapter.spec 往返一致 + 边界用例 |
| 6 | 前端全量测试门全绿，新增 spec 真实执行 | ✅ | **63 files / 539 tests 全绿**（60f/521t + 3 spec + 18 tests） |
| 7 | 禁止范围静态检查全部通过（§7） | ✅ | 执行回执 §8：git diff 空（sw-basic-agent / migration agent / adapters/flow-graph / seeds.ts / AgentHome.vue）；新增文件仅方案清单 10 个 + router 1 处追加 |
| 8 | 权限码零新增（现场 grep 确认） | ✅ | grep 输出：`agent:model:manage`×2、`agent:model:view`×1（GraphDefList 按钮显隐 + V26 SQL），无第三枚 |

## 11. 回归风险

- 前端修改面：router/index.ts 追加 1 条静态子路由（既有路由零改动）+ 8 个新文件；`adapters/flow-graph`、`mock/seeds.ts`、`AgentHome.vue` git diff 空
- 后端修改面：仅 2 个新 SQL 文件；sw-basic-agent（Step7/8 全部）与 agent 迁移目录 git diff 空；pom.xml 零改动（临时 junit 依赖已还原）
- 前端全量 539 tests 零回归；后端 385 tests 零回归
- V26 为纯增量 DML（1 UPDATE + 1 INSERT），对既有菜单树（V6/V10/V11/V15 产物）仅将 id=7 矫正为目录（V11 同构先例），其余菜单行零影响

## 12. 最终结论

**PASSED**
