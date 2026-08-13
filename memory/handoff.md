# 会话交接

> 最后更新：2026-08-13

## 最新完成

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

**M02-F04-01 数据权限（DataScope）完整落地——前置探索阶段（2026-08-13，规划层推荐经用户认可）**：
- 探索任务已下发 `search_task/datascope-implementation-survey.md`（11 问：DataScope 枚举/角色表字段/拦截器基建/纳管范围盘点/清单口径/若依先例倾向），等执行层回执 `search_fallback/datascope-implementation-survey.md` 后写需求方向文档。
- 选定理由：审计遗留的最后一个安全类缺口（角色数据范围配置完全不生效），横切面随新查询增长越晚越贵；第一批排除仅为不混轮。

**流程基线（D74，已生效并首跑验证）**：system.md §3.3 第10项——每轮需求收尾必须由执行层做知识库全量同步（功能清单.md+current-status+features+known-issues，回执报告清单变更明细+触碰文件清单），规划层验收逐项核对。

## 当前基线

- 后端：项目级 **435 tests**（源码口径，CONFIRMED 2026-08-13 全量 exit 0 / 0 failures；运行口径 436 含 1 个 V26 临时冒烟已删源）
- 前端：**63 spec files / 552 tests**，typecheck/lint/build 全绿（CONFIRMED 2026-08-13 四连）
- 功能清单：**✅10 / 🟦37 / ⬜42**（2026-08-13 同步）
- 已完成功能：14 个（features.md 口径，含 checklist-gap-hardening）

## 下一动作

等执行层完成 `search_task/datascope-implementation-survey.md` 探索并写回执 → 规划层据实写 DataScope 需求方向文档 → 下发执行层自主闭环。

后续候选（DataScope 之后，按风险/价值排序参考）：
1. M02-F04-01 数据权限完整落地（DataScope 五档，横切大功能，已从第一批明确排除）
2. M01/M02 其余虚高要素补齐（关联/筛选，I31-I44 余项；I33/I43/I44 已修复）
3. M07 补全：F01 前端管理页、F02-02 Prompt 配置、F02-04 运行日志页+单步调试、F04-02 Token 统计
4. M07-F03/F04 新功能：助手配置/知识库RAG（选型未定）/对话窗口SSE（均零代码）
5. IoT / OpenAPI 模块落地（仅骨架）
6. 小项池：I47 修复（bpm/h2 V8 partial index→真全链迁移测试）、停用即时生效（JWT 过滤器层 status 校验）、sw-bootstrap 测试基建决策、I26 SysRole 列名不一致

## 新会话启动提示词

```
你是 Smart-WorkFlow 根目录规划代理。请按 system.md §10 执行新会话恢复。

最新状态：
- 进行中：M02-F04-01 数据权限（DataScope）完整落地——前置探索阶段，探索任务 search_task/datascope-implementation-survey.md 已下发，等回执后写方向文档
- checklist-gap-hardening 第一批 PASSED（D74-D76，2026-08-13）：I33 停用登录/refresh 拦截 + I43/I44 V29 生产菜单 seed + §3.3 第10项知识库同步首跑合格；遗留4项见 D76
- 流程基线：system.md §3.3 第10项（每轮收尾知识库全量同步）已固化并首跑验证（D74）
- feature-checklist-sync Step5 PASSED（D72/D73）；M07-F01+F02 全部完结（Step1-12，D53-D71）
- 基线：后端 435 tests（源码口径）/ 前端 63f/552t 四连全绿；清单 ✅10/🟦37/⬜42

审计详情：search_fallback/feature-checklist-full-audit.md；最新归档：product/checklist-gap-hardening/passed/ + receipts/
```
