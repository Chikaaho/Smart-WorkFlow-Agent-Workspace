# 会话交接

> 最后更新：2026-08-16

## 最新完成

**bpm-plugin-architecture（M04-F08-01 BPM 可插拔机制）：执行层闭环（D81，2026-08-16）✅ 待规划层最终验收**
- 方向 D80（2026-08-15）下发，执行层自主拆 6 Step（前后端双会话，一个 Step 不跨前后端）：
  - 后端 B1-B3（提交 `7dacc3f`/`dd59896`/`b9adaba`）：NodeTypeRegistry 扩充完整注册骨架（CONDITION/EXCLUSIVE_GATEWAY/PARALLEL_GATEWAY/JOIN_GATEWAY 预留位，START/END/APPROVAL 不动）→ GraphToBpmnTranslator switch→注册表翻译（`NodeTypeTranslator` SPI + `Map<String,NodeTypeTranslator>` 分发，落点裁定：签名引 Flowable 故置 engine 内部不污染 sw-bpm-api）+ 可插拔性证明（TEST_NODE→ServiceTask 测试注册零改动即翻译）；B3 adapter 审视结论：外部数据源执行/通知子系统属独立子系统/事件总线模式，注册表化属过度抽象不纳入
  - 前端 F1-F3（提交 `a56c5eb`/`ba144ce`/`3d6fa51`）：DynamicField 8 类控件渲染链 registry 化（9 控件组件 + `dynamic-field-registry.ts`，主链/子表共用注册表）→ GraphDesigner 属性面板注册表化（8 面板组件 + `node-panel-registry.ts` `<component :is>` 动态挂载）→ 可插拔性证明（EMAIL 控件/PROBE 面板测试注册零改动即渲染）
- 测试门：后端 **527/0/0**（521+6，mvn BUILD SUCCESS 12:07min）；前端 **66f/569t** 四连全绿（63f/552t +3f/+17t；typecheck/build 一次性 1024M 例外——512M 下基线 HEAD 同样 OOM 属本机 1.6G 内存环境问题，非代码回归）；**Flyway 零迁移**（符合方向预期）。
- 知识库同步合格（§3.3 第10项）：清单 M04-F08-01 ⬜→✅（终态 **✅12/🟦37/⬜41 共90行**）、features 更新、**I47/I48 正式登记**（悬空引用清理：I47=bpm/h2 V8 partial index 中·待排期；I48=flow-graph adapter 限制 低·绕行生效）、current-status/session-handoff 同步。
- 执行约束（本轮新增，后续沿用）：本机物理内存 1.6G——**mvn 与 pnpm/npm 编译严格串行**，禁并行编译。
- 归档：`product/bpm-plugin-architecture/passed/direction-bpm-plugin-architecture.md` + `receipts/bpm-plugin-architecture-completion.md`（含 5 项验收标准逐项对照，供规划层最终验收）

**data-scope-enforcement（M02-F04-01 数据权限完整落地）：PASSED（D77/D79，2026-08-15）✅**
- 范围（D77）：五档数据权限端到端落地——①装配去硬编码（`UserDetailsProviderImpl` 读 SysRole.dataScope，多角色取最宽 ALL>DEPT_AND_CHILD>CUSTOM>DEPT>SELF，CUSTOM 取关联部门并集，无角色兜底 ALL 沿历史行为）；②`DeptScopeProviderImpl` Java 递归实现（不加 ancestors 列；@Lazy 破生产级拦截器依赖环）；③Flyway **V30** `sys_role_dept` h2/pg 双份+角色 CRUD 读写关联；④7 表纳管（sys_user 唯一可 @DataScope 直标——Handler 实测仅支持 dept_id/create_by 硬编码列；余 6 表自定义 Mapper 等效条件+`DataScopeFilter.resolve` 传参；不纳 6 表各有理由）；⑤前端 RoleList.vue 五档下拉+CUSTOM 部门树多选+回填。
- 测试门：后端 **521/0/0**（435+86，逐模块加总自洽）；前端四连全绿 63f/552t 持平（typecheck/build 一次性 1024M 内存例外已披露，512M 硬约束不变）；V30 冒烟 **28 迁移**（口径修正：历史"27"漏计 form V12）；前后端枚举 ordinal 0-4 对账一致。
- 知识库同步合格：清单 M02-F04-01 ⬜→✅（终态 **✅11/🟦37/⬜42 共90行**）、I37 修复记录、**I46 新登记**（手写SQL通道限制，与 I10 同源）、current-status/features 更新。
- **编号冲突裁定（D79）**：执行层 I46 与 memory 预留 I46 撞号——注册表为权威，memory 侧 flow-graph adapter 条目改号 **I48**；I47 正式登记仍悬空。
- **遗留 8 项（回执§8）要点**：job/storage 纳管仅 Mockito 传参测试、等效条件 SQL 对 PG 生产库最终验证依赖联调；部门档子查询未过滤 deleted（沿 RuoYi 系行为）；job 非分页入口（listEnabled 等）未纳管；前端 dev mock 未改（联调后自然消失）；sw-bootstrap 测试基建待决策。
- 归档：`product/data-scope-enforcement/passed/direction-datascope-full-implementation.md` + `receipts/data-scope-enforcement-completion.md`

**checklist-gap-hardening 第一批「安全+可达性」：PASSED（D74-D76，2026-08-13）✅**
- 范围（D75）：①I33 停用用户仍可登录——`AuthController` 登录+refresh 双入口拦截 `SysUser.status`（停用/锁定区分提示，refresh 停用则撤销新 token+清 cookie+401，轮换/重放与双 token 架构未动）；②I43/I44 M10 生产菜单——Flyway **V29** h2/pg 双份 4 行（id16 文件管理、id17 定时任务目录、id18 任务管理、id19 执行日志），与 seeds.ts/V26 先例对齐。前端零改动。
- 测试门：后端 **435/0**（426 基线含 1 个已删源 V26 临时冒烟→源码口径 435=425+10 新增，静态计数逐模块自洽）；前端 63f/552t 四连全绿；V29 冒烟 27 迁移+逐列断言通过。
- **§3.3 第10项知识库全量同步首跑合格**：清单 3 行 🟦→✅（终态 **✅10/🟦37/⬜42**）、I33/I43/I44 修复记录、current-status 计数同步（含此前遗留的 7/40/42 待同步项）、`knowledge/features/checklist-gap-hardening.md` 新建。
- **遗留 4 项（D76 登记，后续排期参考）**：①I47（bpm/h2 V8 partial index）修复后补真全链迁移测试；②停用前已签发 access token 900s 窗口内仍有效（如需即时生效需在 JWT 过滤器层单独排期）；③sw-bootstrap 无测试基建，永久迁移测试需先决策加依赖；④435 源码/436 运行双口径已记 current-status。
- 归档：`product/checklist-gap-hardening/passed/direction-batch1-security-reachability.md` + `receipts/checklist-gap-hardening-batch1-completion.md`

**feature-checklist-sync Step5「清单二次核实与同步」：PASSED（D72/D73，2026-08-12）✅**
- 触发：用户指令"探索现状，对照 PRD 和需求文档，更新 todo"。全量审计 `search_fallback/feature-checklist-full-audit.md`（89/89 条核对，4 subagent 并行+汇总层复核）发现 **34 条清单标记与代码不一致**，known-issues **I1 复发**（距 2026-07-24 首轮同步仅约3周）。
- 落地：`Smart-WorkFlow/功能清单.md` 34 处状态列同步（13条✅→🟦 / 1条🟦→⬜ / 3条→✅ / 17条⬜→🟦），终态 **✅7/🟦40/⬜42**（前基线 ✅17/🟦12/⬜60，规划层独立复算自洽）；`knowledge/known-issues.md` +168行（I1复发补记 + I31-I44虚高14条逐条 + I45虚低15条汇总）；todo/README.md 未动。
- 关键裁定（D72）：M10菜单可达性口径（代码完整但生产菜单未seed=🟦非✅）；known-issues粒度（虚高逐条/虚低汇总）；I1原编号补记复发。
- **审计暴露的重要事实**（后续规划参考）：①M02-F04-01数据权限实为硬编码`DataScope.ALL`完全未生效（I 记录中标高风险：I33 停用用户仍可登录）；②M10定时任务/文件存储生产菜单树未seed（V6/V10/V15/V26无job/storage行），仅mock可达；③M07仅缺前端管理页（F01全5条）/Prompt配置字段（F02-02）/运行日志页+单步调试（F02-04）/Token统计（F04-02）；④M07-F03-01助手配置、F03-03知识库RAG、F04-01对话窗口（SSE）零代码。
- 遗留观察：`knowledge/current-status.md` 清单计数待下次执行层触碰时同步为 7/40/42；清单维护机制是否固化进 §3.3 收尾流程（防 I1 第三次复发）待用户决策。
- 归档：`product/feature-checklist-sync/passed/step-5-recheck-sync.md` + `receipts/step-5-recheck-sync-execution.md`

**agent-model-orchestration (M07-F01/F02/F04)：F01 + F02 全部完结（含 Step11 并行/循环节点）✅**
- F01「大模型管理」（Step1-5）：模型 CRUD+AES 加密、LangGraph4j 编排引擎、工具沙箱、多轮会话持久化(F04)、多Key轮询/限流。PASSED（D53/D55/D57/D59/D61/D62）
- F02「图设计器」（Step6-9）：设计澄清 → 图定义 CRUD+发布骨架 → 图解释执行引擎（`AgentGraphInterpreter`）→ 前端图设计器对接（V26 菜单迁移+`graphAdapter.ts`+`GraphDefList.vue`+`GraphDesigner.vue`）。PASSED（D63/D64/D65）
- **Step10「多变量执行上下文」前后端完结（D66/D67）**：`config.inputVar`/`config.outputVar` 契约键 + 默认变量 `input` 零迁移锚点；14 新测（385→392→...→63f/546t）
- **Step11「并行/循环节点」前后端完结（D68/D69，2026-08-12）**：新增 LOOP（循环头，config.maxIterations 缺省10）/FORK（扇出≥2出边）/JOIN（汇合≥2入边）节点类型；`AgentGraphInterpreter` 执行模型由单指针 while 改为多活跃执行点集合（逻辑并发交错推进，非线程级并行）；步数预算公式改为 `2×节点数+ΣmaxIterations×节点数`（无LOOP退化回归安全）；变量冲突=最后写入覆盖（用户决策 D68，测试用例16显式断言）；零Flyway/DDL/contracts/flow-graph adapter改动，F01零触碰。后端12新测（392→405，提交 `f42c0ac`）、前端6新测（63f/546t→63f/552t，提交 `a3cdf29`）。方向文档+回执归档 `passed/step-11-parallel-loop-nodes.md`
- **Step12「执行历史持久化」后端完结（D70/D71，2026-08-12）**：新增 V27 `sw_agent_graph_execution`（执行记录）+ V28 `sw_agent_graph_execution_node`（节点明细）双表（h2/postgresql双份）；`AgentGraphInterpreter` 新增 `NodeExecutionTrace` 纯Java轨迹采集（nodeSeq/branchId/nodeType/耗时/变量快照，经 getTraces() 返回值传递零 Mapper 依赖）；分支标识=branchId 路径字符串（FORK按出边顺序追加下标"0-0"/"0-1"，JOIN挂起到达也留痕）；`GraphExecutionException` 新增 `category` 字段 8 类分类，18个抛出点+第三方异常包装点全部携带；`AgentGraphExecutionServiceImpl` 执行前后包夹落库，成功/失败路径统一覆盖（区别于F04只写成功分支）；新增查询端点（列表分页/详情/节点明细，复用 agent:model:view 权限）；实现细节：`output` 列名为SQL保留字改名 `result_text`（对外DTO字段不变）。本轮未做前端（方向文档允许）。后端21新测（405→426，提交 `bb71047`）。方向文档+回执归档 `passed/step-12-execution-history-persistence.md`
- 全流程闭环：浏览器创建图→拖拽编辑节点/边（含循环回边/并行扇出汇合）→保存草稿→发布→输入文本执行测试→执行历史可查询（列表/详情/节点轨迹）
- 详情见 `product/agent-model-orchestration/passed/step-{1..12}-*.md`（Step6 起）

## 进行中

**bpm-plugin-architecture（M04-F08-01 BPM 可插拔机制，D78 方向裁定 + D80 下发，2026-08-15）**：
- 方向已下发（D80）：`product/bpm-plugin-architecture/ready/direction-bpm-plugin-architecture.md`——前端节点组件注册表（仿 FIELD_TYPE_REGISTRY + `<component :is>`）、DynamicField.vue 渲染链 registry 化、后端 translator switch→按类型注册翻译器（仿 NodeApproverResolver Map 分发）、NodeTypeRegistry 扩充、BPM adapter 抽象 SPI。非目标：设计器本体/新节点控件/热插拔/flow-graph adapter 扩展。纯重构轮，行为零变化，Flyway 预期零。
- **§3.3 知识库同步时执行层正式登记 I47/I48 两条**（悬空引用清理，已写入验收标准⑤）。
- 待执行层（后端 Smart-WorkFlow/ + 前端 Smart-WorkFlow-Web/ 双会话）自主拆 Step 闭环，完成后提交功能级回执，规划层最终验收。

**流程基线（D74，已生效并首跑验证）**：system.md §3.3 第10项——每轮需求收尾必须由执行层做知识库全量同步（功能清单.md+current-status+features+known-issues，回执报告清单变更明细+触碰文件清单），规划层验收逐项核对。

## 当前基线

- 后端：项目级 **521 tests**（源码口径，CONFIRMED 2026-08-15 全量 exit 0 / 0 failures，逐模块加总自洽）
- 前端：**66 spec files / 569 tests**，四连全绿（CONFIRMED 2026-08-16；typecheck/build 一次性 1024M 例外——512M 下基线同样 OOM 属本机 1.6G 内存环境问题；512M 硬约束不变）
- 功能清单：**✅12 / 🟦37 / ⬜41，共 90 行**（2026-08-16 同步）
- Flyway：root 路径 V30 已占用；迁移链冒烟口径 **28**（含 form V12）
- 已完成功能：16 个（features.md 口径，含 bpm-plugin-architecture）
- 执行约束：**本机物理内存 1.6G——mvn 与 pnpm/npm 编译严格串行**（先后端后前端），禁并行编译

## 下一动作

**bpm-plugin-architecture 执行层闭环完成，待规划层最终验收**：回执 `product/bpm-plugin-architecture/receipts/bpm-plugin-architecture-completion.md`（5 项验收标准逐项对照：①节点面板注册表②DynamicField 注册表驱动③translator 注册表翻译④NodeTypeRegistry 扩充⑤adapter SPI 按现状裁定——外部数据源/通知子系统不注册表化已披露，规划层可复核）。

后续候选（按风险/价值排序参考）：
1. M01/M02 其余虚高要素补齐（关联/筛选，I31-I44 余项；I33/I43/I44/I37 已修复）
2. M07 补全：F01 前端管理页、F02-02 Prompt 配置、F02-04 运行日志页+单步调试、F04-02 Token 统计
3. M07-F03/F04 新功能：助手配置/知识库RAG（选型未定）/对话窗口SSE（均零代码）
4. IoT / OpenAPI 模块落地（仅骨架）
5. 小项池：I47 修复（bpm/h2 V8 partial index→真全链迁移测试，现已正式登记）、停用即时生效（JWT 过滤器层）、sw-bootstrap 测试基建决策、I26 SysRole 列名不一致、数据权限遗留（部门档子查询 deleted 过滤、job 非分页入口纳管、PG 联调验证）

## 新会话启动提示词

```
你是 Smart-WorkFlow 根目录规划代理。请按 system.md §10 执行新会话恢复。

最新状态：
- bpm-plugin-architecture（M04-F08-01，D80）执行层闭环（D81，2026-08-16）——6 Step（后端 B1-B3 translator/registry 注册化+可插拔性证明；前端 F1-F3 DynamicField/GraphDesigner 注册表化+EMAIL/PROBE 证明），回执已归档 product/bpm-plugin-architecture/receipts/，待规划层最终验收（5 项验收标准逐项对照）
- data-scope-enforcement PASSED（D77/D79，2026-08-15）：五档数据权限端到端落地，后端435→521；I46 登记；编号裁定 flow-graph adapter 改号 I48
- checklist-gap-hardening 第一批 PASSED（D74-D76，2026-08-13）：I33/I43/I44
- 流程基线：system.md §3.3 第10项知识库全量同步（D74）+ 三角色制宪法（D78）
- 基线：后端 527 tests / 前端 66f/569t 四连全绿；清单 ✅12/🟦37/⬜41 共90行；Flyway V30 已占用、迁移冒烟口径28；I47/I48 已正式登记（悬空引用清理完成）
- 执行约束：本机物理内存 1.6G——mvn 与 pnpm/npm 编译严格串行，禁并行编译

最新归档：product/bpm-plugin-architecture/passed/ + receipts/；最新下发：无（回执待规划层验收）
```
