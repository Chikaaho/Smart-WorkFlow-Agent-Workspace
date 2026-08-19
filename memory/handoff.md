# 会话交接

> 最后更新：2026-08-19（pg-v13-migration-chain-repair D111 PASSED / COMPLETED）

## 最新状态与最近完成

**pg-v13-migration-chain-repair（I52）：COMPLETED（D110功能验收 + D111阶段三复验，2026-08-19）✅**
- 修复 PG 侧 V13 第 7 项 2BP01：`DROP INDEX IF EXISTS sw_form_def_form_key_key;` → `ALTER TABLE sw_form_def DROP CONSTRAINT IF EXISTS sw_form_def_form_key_key;`（H2 侧 V13 零改动、不新增 V34）；根因=form/V7 inline UNIQUE 在 PG 创建约束背书隐式索引。
- 永久 `FlywayFullChainPostgresTest`（zonky embedded-postgres PG 17.5）9 用例：先红 2BP01 → 后绿新库全链 33 条 migrate+validate + 既有库升级夹具（target32→V33）+ 原 V13 checksum 显式失败守卫 + 逻辑删除唯一性语义正反例（23505/软删重建共存/重复软删边界）。
- D109 两项补证闭合：既有库校验和安全（git 审计链 + 守卫用例）、跨平台可移植性（pom 改 `embedded-postgres-binaries-bom:17.5.0` 统一全平台）。
- 测试门（2G 串行）：sw-bootstrap PG 9/0/0、H2 11/0/0、项目级 **600/0/0/0**（591→599→600）；前端零改动、清单零变化（✅21/🟦28/⬜41）。
- I52 正式关闭；方向归档 `product/pg-v13-migration-chain-repair/passed/`；回执 `receipts/`（completion + d109 + supplement + d110 + terminal-sync）。

**agent-model-management-frontend（P5 / M07-F01-01～05）：COMPLETED（D107，2026-08-19）✅**
- D106 已通过的主体实现、V33、H2 33 条与 V32→V33、前端 **69f/628t** 四连证据保留。
- 补证新增 7 个后端用例，闭合 `other`、远端4xx可达、未认证401及禁用/锁定与Mock真实语义；后端项目级 **591/0/0**。
- P5核销、I45中M07-F01子集关闭、五条清单✅获规划确认；方向归档 `product/agent-model-management-frontend/passed/`。
- 最终复验：`product/agent-model-management-frontend/receipts/planning-final-review-d107.md`。I52 为独立既有PG V13缺陷。

**bpm-h2-v8-compat（P10 / I47 BPM H2 V8 迁移链兼容）：PASSED（D87/D88，2026-08-17）✅**
- H2 V8 将不受支持的 partial unique index 替换为生成列 `active_key` + 唯一索引；active=true 时按 tenant/form 唯一，active=false 时 NULL 可多条共存。PostgreSQL V8 零改动，业务语义保持一致。
- 永久 `FlywayFullChainH2Test` 覆盖 7 个目录，BPM V8→V14 连续执行，**30/30 migrate + validate**；旧 28 条排除 BPM 口径失效。
- 测试门（`MAVEN_OPTS="-Xmx2g"`，严格串行）：BPM process 58/0/0、bootstrap 8/0/0、项目级 **543/0/0**（527+16）。
- 知识库同步合格：I47/P10 核销，current-status/features/session-handoff、需求池及迁移/测试基线已同步；功能清单状态列无变化。
- 规划层最终验收：**PASSED**。六项验收方向全部满足；PG 运行期联调为零改动侧的低风险遗留，不阻塞本轮。归档 `product/bpm-h2-v8-compat/passed/`，回执保留于 `receipts/`。

**sysrole-v5-column-alignment（P13 / I26 SysRole 与 V5 列契约对齐）：PASSED（2026-08-17）✅**
- 范围：后端单功能。`SysRole.java:47,51` @TableField 改 `built_in`/`remark`（字段名/JSON 键不变）；`schema-datascope-h2.sql` 与 `AuthFlowIntegrationTest.java` 建表/索引/INSERT/注释全对齐 V5 链尾（含 V13 deleted 索引形态）；全仓 grep `is_builtin` 主代码/测试零残留（仅历史迁移脚本 V1/V2/V5）。
- 测试门（MAVEN_OPTS="-Xmx2g"）：sw-biz-system-biz 模块 **111/0/0**（RoleDataScopeTest 7、RoleControllerTest 6、UserDetailsProviderDataScopeTest 12、AuthFlowIntegrationTest 8、AuthMeControllerTest 5 全 PASSED）→ 项目级全量 **527 tests / 0 failures / 0 errors 与基线持平**（BUILD SUCCESS 31/31 模块）；MP 生成 SQL 原文 `built_in, remark AS description` 与测试 DDL 双向闭合。
- 边界：Flyway 零迁移、前端零改动、P10/P12 零触碰；H2 真全链验证仍受 I47 阻断（如实分离）；探索回执更正 I26 测试 DDL 位置（schema-datascope-h2.sql L42-43）。
- 知识库同步（§3.3 第10项）：I26 ✅、current-status（§1/§4/§5/§9，计数修正 16→18）、features/sysrole-v5-column-alignment.md 新建、requirement-pool P13 已在最终验收后核销、session-handoff 同步。清单状态列无变化（M02-F01-01 缺口=绑定写入等非本轮范围）。
- 规划层最终验收：**PASSED**。六项验收标准全部满足；H2 真全链受 I47 阻断为已隔离非目标，不影响本轮结论。归档 `product/sysrole-v5-column-alignment/passed/`，回执 `receipts/`。

**status-semantics-alignment（I51 系统管理状态语义对齐）：PASSED（2026-08-17）✅**
- 用户/部门前端 status 语义已按后端契约纠正并收敛至模块内常量：用户 0=正常/1=停用/2=锁定，部门 0=正常/1=停用；新建默认值、提交、回填、筛选、展示与 Mock/夹具同步。
- 角色/岗位契约核对为 1=启用/0=停用，与前端现状一致，零改动；后端业务代码、迁移与契约零修改。
- 前端新增 7 测试，基线 **66f/569t→66f/576t**；2G 上限下 typecheck/lint/test/build 四连退出码 0。
- I51 已在完整知识库关闭，功能追踪与交接同步完成；功能清单无对应独立明细行，状态列不变。
- 规划层最终验收：**PASSED**。归档：`product/status-semantics-alignment/passed/direction-status-semantics-alignment.md`；回执：`receipts/status-semantics-alignment-completion.md`。

**bpm-plugin-architecture（M04-F08-01 BPM 可插拔机制）：PASSED（D81/D82，2026-08-16）✅**
- 方向 D80（2026-08-15）下发，执行层自主拆 6 Step（前后端双会话，一个 Step 不跨前后端）：
  - 后端 B1-B3（提交 `7dacc3f`/`dd59896`/`b9adaba`）：NodeTypeRegistry 扩充完整注册骨架（CONDITION/EXCLUSIVE_GATEWAY/PARALLEL_GATEWAY/JOIN_GATEWAY 预留位，START/END/APPROVAL 不动）→ GraphToBpmnTranslator switch→注册表翻译（`NodeTypeTranslator` SPI + `Map<String,NodeTypeTranslator>` 分发，落点裁定：签名引 Flowable 故置 engine 内部不污染 sw-bpm-api）+ 可插拔性证明（TEST_NODE→ServiceTask 测试注册零改动即翻译）；B3 adapter 审视结论：外部数据源执行/通知子系统属独立子系统/事件总线模式，注册表化属过度抽象不纳入
  - 前端 F1-F3（提交 `a56c5eb`/`ba144ce`/`3d6fa51`）：DynamicField 8 类控件渲染链 registry 化（9 控件组件 + `dynamic-field-registry.ts`，主链/子表共用注册表）→ GraphDesigner 属性面板注册表化（8 面板组件 + `node-panel-registry.ts` `<component :is>` 动态挂载）→ 可插拔性证明（EMAIL 控件/PROBE 面板测试注册零改动即渲染）
- 测试门：后端 **527/0/0**（521+6，mvn BUILD SUCCESS 12:07min）；前端 **66f/569t** 四连全绿（63f/552t +3f/+17t）。历史执行时使用 1024M 临时例外；2026-08-17 已由正式 2G 上限四连补验关闭。**Flyway 零迁移**（符合方向预期）。
- 知识库同步合格（§3.3 第10项）：清单 M04-F08-01 ⬜→✅（终态 **✅12/🟦37/⬜41 共90行**）、features 更新、**I47/I48 正式登记**（悬空引用清理：I47=bpm/h2 V8 partial index 中·待排期；I48=flow-graph adapter 限制 低·绕行生效）、current-status/session-handoff 同步。
- 执行约束（本轮新增，后续沿用）：本机物理内存 1.6G——**mvn 与 pnpm/npm 编译严格串行**，禁并行编译。
- 归档：`product/bpm-plugin-architecture/passed/direction-bpm-plugin-architecture.md` + `receipts/bpm-plugin-architecture-completion.md`（含 5 项验收标准逐项对照）
- **规划层最终验收（D82）：PASSED**——5 项标准全满足；adapter SPI 按现状裁定（外部数据源执行/通知子系统不注册表化=过度抽象，节点处理 adapter=翻译器注册表已落，方向精神达成）；历史 typecheck/build 内存例外已于 2026-08-17 由正式 2G 上限四连补验关闭；前后端编译互斥已入库；I47/I48 登记确认。

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

**pg-v13-migration-chain-repair（I52）COMPLETED（D110 PASSED + 阶段三终态同步完成，2026-08-19）**：D109两项补证通过；PG新库33条、原V13 checksum审计与显式失败守卫、多平台17.5.0依赖解析、H2 11项、项目级600/0/0/0证据闭合；I52正式关闭。主方向与同步方向归档 `product/pg-v13-migration-chain-repair/passed/`。验收：`receipts/planning-final-review-d110.md`。

最近完成：pg-v13-migration-chain-repair（D110）、agent-model-management-frontend（D107）与 department-query-filtering（D104）均为 `COMPLETED`。

已完成（最近）：department-query-filtering（I31 / M01-F01-04）`COMPLETED`（D104，2026-08-18）✅——业务与测试九项全部通过，D103终态同步缺口已修正，I31关闭、清单M01-F01-04为✅，归档 `product/department-query-filtering/passed/`。user-org-association-query（D101）与 admin-role-governance（D97）均保持 COMPLETED。

**历史功能追踪终态清理 PASSED（D91/D92，2026-08-18）**：`knowledge/features/` 18 个非模板文件全量核对，修正 sysrole/status-semantics/bpm-plugin/data-scope 四个旧终态，旧状态词零残留；功能清单与代码零改动。

**流程基线（D74，已生效并首跑验证）**：system.md §3.3 第10项——每轮需求收尾必须由执行层做知识库全量同步（功能清单.md+current-status+features+known-issues，回执报告清单变更明细+触碰文件清单），规划层验收逐项核对。

## 当前基线

- 后端：项目级 **600 tests**（运行口径，CONFIRMED 2026-08-19 pg-v13-migration-chain-repair D110，0 failures / 0 errors / 0 skipped；599 → +1 checksum守卫）
- 前端：**69 spec files / 628 tests**，四连全绿（CONFIRMED 2026-08-19 agent-model-management-frontend；正式 2G 上限下 typecheck/lint/test/build 全部退出 0；66f/602t → +3f/+26t）
- 功能清单文件当前为 **✅21 / 🟦28 / ⬜41，共 90 行**（M07-F01-01～05 五行上调已由 D107 确认；无关行零漂移）
- Flyway：root 路径 V33 已占用；**PG 17.5 与 H2 新库全链均为 33 条 migrate+validate**，H2 V32→V33 通过；PG 侧修复（V13 第 7 项 DROP CONSTRAINT）+ 永久 PG 测试 9 用例 + BOM 统一全平台；**I52 已关闭（D110 COMPLETED）**
- 已完成功能：24 个
- 执行约束：**本机物理内存 1.6G——mvn 与 pnpm/npm 编译严格串行**（先后端后前端），禁并行编译

## 下一动作

**下一动作**：pg-v13-migration-chain-repair 已由D111确认 `COMPLETED`，当前无进行中业务功能；由规划层另行从候选池选择下一需求方向。

**探索回执已回收并核销（2026-08-16，D83 裁定 + D84 落库核销）**：
- 清单 90/90 零不一致（I1 无第三次复发）；基线全部核实（527/66f569t——**569 为运行口径，静态 561**/V30+28/16 功能）；memory 自洽。
- **knowledge/ 落库已完成（D84 核销 7/7）**：I49/I50/I51 正式登记、I26 上调/I30 已满足/I3/I18/I38 失准修正、current-status 18 处、session-handoff 全量重写、todo T1/T10 清理、前端口径注记。回执 `search_fallback/knowledge-sync-apply.md`。
- **D84 裁定**：decisions 注册表归属——memory/decisions.md=活跃决策摘要（D85 口径），knowledge/decisions.md=D1-D46 历史档案（顶部注记+README 同步待执行层顺手补）；不补录 D47-D82；I18/I30 正式关闭。
- **D85 铁律（2026-08-16 用户定）**：knowledge=唯一完整权威信息源；memory=最少信息摘要（冲突以 knowledge 为准）；执行角色触碰状态文件必须同步 knowledge 全量（§3.3 第10项强化）；清单 🟦/⬜ 缺口同步进需求池 P 编号（防"清单独有"）。已落：system.md §0.4 铁律块 + §3.3 第10项、memory/README.md、memory/decisions.md 顶部、requirement-pool 维护规则 4。
- 需求池：`todo/requirement-pool.md`（P5/P10/P12/P13/P24 已核销；其余候选仍按池内状态维护）。
- **探索任务核销（2026-08-16 晚，3/3 完成）**：decisions-registry-note ✅（knowledge/decisions.md 顶部注记+根 README 索引同步）、checklist-pool-sync ✅（清单 25 行描述列末尾追加「缺口已登记 P26-P50」25/25、状态列 0 漂移——裁定维持描述列形态不加列）、rule-sync-d85 ✅（shared-constraints §10 / development-workflow §6.3 / 后端宪法 §13 / 前端宪法 §15 四处落地，knowledge/README 不存在按说明处理）。**D85 铁律三仓库宪法级完成**。
- **探索任务核销（2026-08-16 晚，4/4 全闭环）**：i18-close-sync ✅（I18 注册表已同步「✅ 已关闭（D84）」仿 I33/I37 先例，memory 侧核对一致）。**本轮全部委派任务已闭环，无进行中探索**。
- **当前规划裁定**（2026-08-18）：user-org-association-query D101 PASSED，阶段三同步 COMPLETED；D93-D97 双角色治理作为前置基线保持有效。

后续候选（按风险/价值排序参考，2026-08-19 D105 轮后更新）：
1. M01/M02 其余虚高要素补齐：I36 用户组绑定、M02-F02/F03 权限配置入口（I31 部门筛选已由 department-query-filtering 关闭；I32/I34/I35 已由 D101 关闭；I33/I37/I43/I44 已修复）
2. M07 后续补全（P5 之外）：F02-02 Prompt 配置、F02-04 运行日志页+单步调试、F04-02 Token 统计（F01 前端管理页已由 agent-model-management-frontend 闭环）
3. M07-F03/F04 新功能：助手配置/知识库RAG（选型未定）/对话窗口SSE（均零代码）
4. IoT / OpenAPI 模块落地（仅骨架）
5. 小项池：停用即时生效（JWT 过滤器层）、数据权限遗留（部门档子查询 deleted 过滤、job 非分页入口纳管、PG 联调验证）（I49/I51/I26/I47 已分别修复关闭；**I52 已关闭，D110 COMPLETED**）

## 新会话启动提示词

```
你是 Smart-WorkFlow 根目录代理。请先显式声明本会话角色；若为执行角色，从工作区根目录读取已下发方向并自主闭环。

最新状态：
- pg-v13-migration-chain-repair（I52 / PostgreSQL V13 迁移链修复）**COMPLETED（D110 PASSED + 阶段三终态同步，2026-08-19）**——PG 侧 V13 第 7 项 DROP INDEX→DROP CONSTRAINT（H2 零改动）；PG 新库全链 33 条 migrate+validate + 既有库升级夹具 + 原 V13 checksum 守卫 + 语义正反例，永久 PG 测试 9 项；后端 600/0/0/0；I52 正式关闭；方向归档 `product/pg-v13-migration-chain-repair/passed/`
- agent-model-management-frontend（P5 / M07-F01-01～05）**COMPLETED（D107，2026-08-19）**——补证闭合 `other`、远端4xx可达、未认证401及Mock/真实连通性语义；后端591/0/0、前端69f/628t四连；P5核销、五条清单✅确认，方向归档 `product/agent-model-management-frontend/passed/`
- department-query-filtering（M01-F01-04/I31 部门条件查询闭环）**COMPLETED（D104，2026-08-18）**——后端 582/0/0（563+19）、前端 66f/602t（577+25）四连全绿，Flyway 零迁移；清单 M01-F01-04 🟦→✅，I31 关闭；方向归档 `product/department-query-filtering/passed/`
- user-org-association-query（I32/I34/I35/I36 剩余子集）**COMPLETED（D101，2026-08-18）**——人员关联、组合查询、双租户/回滚、超管保护均闭合，阶段三同步完成；PG运行期与进程快照为非阻塞环境待办。验收与同步回执位于 `product/user-org-association-query/receipts/`。
- admin-role-governance（P24/I49）**COMPLETED（D97，2026-08-18）**——功能级与阶段三均完成，P24/I49 已核销关闭。
- 基线：后端 600 tests / 前端 69f/628t 四连全绿；清单文件 ✅21/🟦28/⬜41 共 90 行；Flyway 最高 V33，PG/H2 全链各 33 条 migrate+validate；已完成功能 24 个
- 执行约束：本机物理内存 1.6G——mvn 与 pnpm/npm 编译严格串行，禁并行编译

当前待办：pg-v13-migration-chain-repair 已由D111确认闭环；当前无进行中业务功能，下一需求由规划层另行从候选池选择。
```
