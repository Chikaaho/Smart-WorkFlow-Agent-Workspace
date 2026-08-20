# 当前项目状态

> 工作区统一知识库 — 当前项目整体状态（唯一可信来源）。
> 本文件反映最新已验证的项目状态，每次功能推进后更新。
>
> 可信度标记：CONFIRMED = 代码/测试确认 · REPORTED = 回执报告 · ASSUMED = 推测 · SUPERSEDED = 已替代
>
> 信息来源：`SmartWorkFlow_files.zip`（2026-07-16）中的 `Smart-WorkFlow-前端架构与现状-知识库.md`、`Smart-WorkFlow-PRD.md` 附录 A、`功能清单.md`，结合代码与测试实际验证。

---

## 1. 整体概览

| 维度 | 状态 |
|------|------|
| 后端框架 | Spring Boot 3.4.4 + Java 21，模块化单体，四层架构就位 |
| 前端框架 | Vue 3.5 + TypeScript 6.0 + Vite 8，严格分层 SPA，自有架构（不继承 vben） |
| 数据库 | PostgreSQL（生产）/ H2（开发），Flyway 管理 schema，V1–V34；**双方言新库全链均可直跑**——H2 新库全链 34 迁移与 V32/V33→V34 升级链 migrate+validate 已通过；**PG 侧全链直跑已修复（2026-08-19 pg-v13-migration-chain-repair，I52 关闭）**：PG 17.5 真实二进制（zonky embedded-postgres）新库全链 34 条 migrate+validate 通过 + 既有库升级夹具通过，永久测试 `FlywayFullChainPostgresTest`；PG 真实库（127.0.0.1）临时 schema 验证 V33 幂等执行通过（2026-08-19）。V34（2026-08-19 user-group-membership）新增 sys_user_group / sys_user_group_member（H2/PG 双份逐字一致）。 |
| 核心路径 | Walking Skeleton：登录 → 表单 → 审批 → 通知 ✅ 四环全部闭合 |
| 功能清单 | 10 模块，55 功能，90 明细；终态按实际代码闭环为 **✅23/🟦27/⬜40**（`Smart-WorkFlow/功能清单.md` 权威清单；role-menu-permission-parity D123 + agent-graph-execution-observability D148：M02-F02-01/F03-01 🟦→✅、M07-F02-04 "运行日志查看 ✅ + 单步调试🟦" 保持 🟦）。 |
| 测试基线 | agent-graph-execution-observability D148 当前后端全量 **685 tests / 0 failures / 0 errors / 0 skipped**（sw-basic-agent 197）；前端 **78 spec files / 760 tests / 0 failures** 四连全绿（typecheck/lint/test/build），均按 2G 约束串行执行。 |

### 最近完成（2026-08-20，agent-graph-execution-observability COMPLETED，第 27 个已完成功能）

`agent-graph-execution-observability`（P7 / M07-F02-04 图执行历史与运行日志前端可观测闭环）：**D148 功能级验收 PASSED（D137/D138 为失效历史，D139-D147 为补证迭代）**。后端零改动，复用 Step12(D70-D71) 已实现的三类只读端点 (`GET /agent/graph-executions`, `/{id}`, `/{id}/nodes`)；前端新增 ExecutionList.vue（分页列表、graphDefId 过滤）、ExecutionDetail.vue（详情展示、安全渲染）、NodeTrajectory.vue（节点轨迹、branchId 并行分支识别）、路由注册（`:executionId` 参数名）、API 补充。**D146/D146b 执行层补证修复标准 1/7/8/11/12**：后端 Security 集成测试 +12（197/0/0）、Mock handler 直测 +11 + 路由访问控制 +3（含 :executionId 参数名修正 + meta.authority）。清单 M07-F02-04 保持 🟦（"运行日志查看 ✅ + 单步调试🟦"，部分完成不自动升✅）。方向归档 `product/agent-graph-execution-observability/passed/`；回执 `receipts/`（completion.md, test-receipt.md, d146-supplement-summary.md, d148-functional-verification.md）。I55 已关闭（M07-F02-04 运行日志前端缺口本轮闭环）。P7 运行日志子集✅已核销，单步调试继续待排期。测试基线：**后端 685/0/0/0（sw-basic-agent 197）、前端 78f/760t 四门全绿、Flyway V34 零业务迁移**。

### 此前最近完成（2026-08-20，role-menu-permission-parity COMPLETED，第 26 个已完成功能）

`role-menu-permission-parity`（P1 / M02-F02-01 / M02-F03-01）：**D121 执行层功能级 PASSED → D122 规划终验 FAILED（四类偏差）→ 2026-08-20 退回修正完成 → D123 规划层最终验收 PASSED + 阶段三终态同步 COMPLETED**。D122 四类偏差全部修正：①**生产 403 契约**——`GlobalExceptionHandler` 新增 `AuthorizationDeniedException` 分支（HTTP 403 + body 403），移除测试专用处理器覆盖，请求级 403 走真实生产链路（sw-common +spring-security-core 编译期依赖，`GlobalExceptionHandlerTest` 2 用例）；②**停用角色有效撤权**——`SysMenuServiceImpl.loadMenuIdsByUserId` 与 `UserDetailsProviderImpl.loadPermissions` 对称按 `sys_role.status=1` 过滤（AuthMenus A4/A9 改为撤权生效断言）；③**Mock 双角色身份**——超管会话 username=superadmin/roles=['superadmin']，新增普通 `MOCK_SESSION_DATA_ADMIN`（admin 非超管、权限按绑定装配），登录三会话映射（auth-session.spec +3 用例）；④**权威问题注册**——I53/I54 登记 knowledge/known-issues.md + memory/issues.md。测试：后端全量 **674/0/0/0**（112 报告文件；670 +4）、前端 **73 spec / 681 tests / 0 failures**（+3）2G 上限四连全绿；零 Flyway。清单 M02-F02-01 / M02-F03-01 🟦→✅（终态 **✅23/🟦27/⬜40**）、**P1 正式核销**、功能数 26——**D123 规划层最终验收 PASSED + 终态同步确认**。规划复验：`receipts/planning-final-review-d123.md`；终态同步回执：`receipts/post-d123-terminal-sync.md`；历史回执：`receipts/`（planning-review-d122、d122-fix-receipt、step1/step2/step3b×2、completion、test-receipt、stage3-knowledge-sync）。

### 此前最近完成（2026-08-19，user-group-membership 功能级 PASSED（D117）+ 阶段三终态同步 COMPLETED）

`user-group-membership`（P28 / I36 用户组绑定）：**D117 功能级最终验收 PASSED，阶段三同步完成，功能 COMPLETED**。方向 `product/user-group-membership/passed/direction-user-group-membership.md`（已归档）。实现：V34 双端迁移 `sys_user_group`/`sys_user_group_member`（业务标识租户内唯一 + 逻辑删除唯一语义）；后端 SysUserGroup/Service/Controller（组 CRUD/启停/逻辑删除、成员保存/替换/清空/移除/回填、数据范围=组内成员部门 EXISTS、成员绑定校验=候选可见性同源、非 superadmin 零隐式授权）；前端 UserGroupList 页面/API/类型/Mock/菜单/权限（`system:userGroup:list`/`manage`）。测试：后端 45 专项（Controller 12 + Service 15 + 集成 12 + 授权 6）+ Flyway H2/PG 全链（34 迁移、V33→34 升级链、逻辑删除唯一语义 23505）+ 项目级 **647/0/0/0**；前端 **71 files / 646 tests / 0 failures** 四连全绿。清单 M01-F04-01 ⬜→🟦（✅21/🟦29/⬜40）；**I36 关闭（用户组绑定语义，不扩大为流程/权限消费端）**；**P28 核销**；M01-F04-01 消费端未接不得升 ✅；已完成功能 24→25。回执：`product/user-group-membership/receipts/`（D113-D117 审查链 + stage3-closeout）。

### 此前最近完成（2026-08-19，pg-v13-migration-chain-repair 功能级 PASSED + 阶段三终态同步 COMPLETED）

`pg-v13-migration-chain-repair`（I52）：**D110 规划层最终验收 PASSED，阶段三终态同步完成，功能 COMPLETED，I52 正式关闭**。方向 D108（`product/pg-v13-migration-chain-repair/passed/`，已归档）。根因：form/V7 inline UNIQUE 在 PG 创建约束背书隐式索引 `sw_form_def_form_key_key`，root/V13:58 `DROP INDEX` 触发 2BP01（H2 行为不同故 H2 全链不受影响）。策略裁定：**修改 PG 侧 V13 第 7 项**（`ALTER TABLE sw_form_def DROP CONSTRAINT IF EXISTS sw_form_def_form_key_key;`）而非新增 V34——PG 无已应用 V13 的既有库故无校验和风险、V14-V33 零下游引用、新库场景 V34 不可达；**H2 侧 V13 零改动**（双方言各按自身能力实现同一语义）。验证：永久 `FlywayFullChainPostgresTest`（zonky embedded-postgres PG 17.5 真实二进制，先红复现 2BP01 → 后绿 33 条 migrate+validate + 既有库升级夹具 target32→V33 + 语义正反例 23505 + 原 V13 checksum 显式失败守卫）；H2 `FlywayFullChainH2Test` 11 用例回归零退化；项目级全量 **600/0/0/0**（591→599→600）。**D109 补证**：既有库校验和安全（git 审计链 + 守卫用例）与跨平台可移植性（BOM 统一 17.5.0 全平台）两项闭合。**语义事实修正**：复合唯一 `(key, deleted)` 下每业务键最多一条 deleted=1 历史（真实 PG 证伪「两条 deleted=1 共存」，已固化为回归守卫）。前端零改动；清单状态列零变化（✅21/🟦28/⬜41）。回执：`product/pg-v13-migration-chain-repair/receipts/`（completion + planning-review-d109 + post-d109-supplement + planning-final-review-d110 + post-d110-terminal-sync）。

### 此前最近完成（2026-08-19，agent-model-management-frontend 执行层闭环，D106 规划层验收 FAILED → D107 复验 COMPLETED）

`agent-model-management-frontend`（P5 / M07-F01-01～05）：**执行层闭环，D106 规划层验收 FAILED（证据闭环缺口：`other` 协议与远端 4xx 可达、未认证 401、Mock 禁用/锁定连通性语义与真实后端一致性），主体实现与测试门保留，补证后 D107 复验 PASSED / COMPLETED**。审查：`product/agent-model-management-frontend/receipts/planning-review-d106.md`（§5 状态裁定）与 `receipts/planning-final-review-d107.md`（最终复验）。主体事实不变：后端零 Java 业务改动，新增 V33 菜单/按钮权限 seed（H2+PG 双方言：菜单 id=209「大模型管理」permission=`agent:model:view`、按钮 id=210=`agent:model:manage`、id=211=`agent:model:test`，不 seed sys_role_menu 沿用 V6/V26 超管旁路决策；提交 `d4d7dc3`）；前端契约/API/Mock/菜单/页面全闭环（提交 `e26e5f0`）。后端 **584/0/0**（基线 582）、H2 全链 33 迁移 + V32→V33 升级链通过、PG 真实库临时 schema V33 幂等执行通过；前端 **69 files / 628 tests / 0 failures** 四连全绿。清单 M07-F01-01～05 五行 🟦→✅（✅21/🟦28/⬜41），P5 核销，I45 的 M07-F01 前端缺口关闭——**以上终态为执行层候选终态，D106 复验通过前不构成规划层最终确认**。补证进展（执行层进行中，补充回执尚未归档）：后端连通性/权限专项 **+7 用例**（other 协议、远端 4xx 仍判可达、未认证 `/agent/models` 401、禁用/锁定连通性语义，项目级预计 591/0/0）已跑通；前端 Mock 语义修正进行中。遗留（非本轮引入）：既有 PG V13:58 2BP01 缺陷导致 PG 侧全链 V1→V33 无法在真实库直跑（H2 全链不受影响），已登记 I52，建议后续 V34 修复迁移。前次：`department-query-filtering` 已由 D103 复验通过、D104 规划层最终验收 **COMPLETED**：后端 582/0/0、前端 66f/602t、Flyway 零迁移；D103 仅终态同步 FAILED 已由执行层全文修正并复验通过。方向归档 `product/department-query-filtering/passed/`，最终复验 `receipts/planning-final-review-d104.md`。前次：`user-org-association-query` 已由 D101 规划层验收 **PASSED**，阶段三同步完成并标记 `COMPLETED`。环境待办保留：PG 侧全链直跑（受 I52 阻断，待规划层决策）、系统恢复后互斥快照。
| 前次验证 | 2026-08-18 department-query-filtering 闭环（D102/D103/D104，已 PASSED 归档）：后端 **582 tests / 0 failures / 0 errors**（563 基线 +19）、前端 66f/602t 四连全绿、Flyway 零迁移、清单 M01-F01-04 🟦→✅（✅16/🟦33/⬜41）。此前 2026-08-18 admin-role-governance 闭环（P24/I49，D96 PASSED）：V31 H2/PG 双份、后端 551/0/0、前端 66f/576t、H2 全链 31 条 migrate+validate。此前 2026-08-17 bpm-h2-v8-compat 闭环（P10/I47 后端修复轮）：后端 `MAVEN_OPTS="-Xmx2g" mvn test` BUILD SUCCESS 31/31 模块，**543 tests / 0 failures / 0 errors**（527 基线 +16；surefire 时间窗 97 个 XML 聚合，无 flaky）；**Flyway 全链 H2 冒烟口径 28 → 30**——永久真全链测试 `FlywayFullChainH2Test`（sw-bootstrap）7 目录（root/bpm/notify/form/storage/job/agent）migrate + validate 通过，bpm V8/V14 纳入，不再有排除口径；h2/V8 partial index → 生成列 `active_key` + 唯一索引等价实现（pg/V8、V13、V14 零改动）。此前 2026-08-17 sysrole-v5-column-alignment 闭环（P13/I26，已 PASSED 归档）：后端 527/0/0 持平，SysRole 实体与全部触达 `sys_role` 的测试 DDL 已对齐 V5 链尾 `built_in`/`remark`，MP 生成 SQL 原文证据闭合。此前 2026-08-17 status-semantics-alignment 闭环：前端四连全绿 typecheck ✅、lint ✅、test **66 files / 576 tests** ✅（569 → +7）、build ✅；全部退出码 0。构建仅出现已登记的 `@vueuse/core INVALID_ANNOTATION` 第三方警告，不影响退出码或产物。后端零修改、未构建、未测试。此前 2026-08-16 bpm-plugin-architecture 闭环：后端 527/0/0、前端 66f/569t、Flyway 零迁移、清单 ✅12/🟦37/⬜41。 |

---

## 2. 模块完成度

### 2.1 后端

| 模块 | 状态 | 证据 | 规模 |
|------|------|------|------|
| sw-common | ✅ 完整 | CONFIRMED | 31 个 Java 文件 — 公共基础设施（CONFIRMED 2026-07-22 重数） |
| sw-security | ✅ 完整 | CONFIRMED | 23 个 Java 文件 — 认证鉴权全链路（CONFIRMED 2026-07-22 重数） |
| sw-biz-system | ✅ 核心就位 | CONFIRMED | 49 个 Java 文件（api 3 + biz 46）— 用户/角色/菜单/部门/字典 CRUD（CONFIRMED 2026-07-22 重数） |
| sw-biz-form | ✅ 已封版 | CONFIRMED | 47 个 Java 文件（biz 33 + api 14）+ 7 个测试类 — 动态宽表引擎，8 字段类型 + TABLE/REFERENCE 两档关系（CONFIRMED 2026-07-22 重数） |
| sw-bpm | 🟦 开发中 | CONFIRMED | 78 个 Java 文件（process 30 + api 26 + engine 22）— BPMN 转换/待办/审批/Flowable 集成（CONFIRMED 2026-07-22 重数） |
| sw-basic-notify | ✅ 基础完成 | CONFIRMED | Facade + Controller + Mapper + 测试 + Flyway 建表 |
| sw-basic-storage | ✅ 完整 | CONFIRMED | B1–B4 + F1–F3 全部通过：-api/-biz 拆分 + 4 存储提供商 + Service/Controller/测试 + 前端闭环（50 files/438 tests） |
| sw-basic-job | ✅ 完整 | CONFIRMED | B1–B4 + F1–F3 全部通过：模块拆分/Quartz 集成/Controller+Facade/测试（全量后端 203 tests，CONFIRMED 2026-07-22 复验，原「406」SUPERSEDED）+ 前端 Types/API/视图/Mock/路由闭环（54 files/471 tests） |
| sw-basic-iot | ⬜ 骨架 | CONFIRMED | AutoConfiguration 占位 |
| sw-basic-knowledge | ⬜ 骨架 | CONFIRMED | AutoConfiguration 占位 |
| sw-basic-agent | ✅ 完整 | CONFIRMED | 模型管理/编排/工具沙箱/会话/图定义/图执行全链（178 @Test，2026-08-16 D83 静态复核）；前端 GraphDefList + GraphDesigner 已消费 Vue Flow adapter；ModelList 大模型管理页 2026-08-19 闭环（V33 菜单 seed 生产可达） |
| sw-biz-openapi | ⬜ 骨架 | CONFIRMED | 仅 package-info |

### 2.2 前端

| 模块 | 状态 | 证据 | 说明 |
|------|------|------|------|
| 项目骨架 | ✅ 完成 | CONFIRMED | 目录、导入边界、CSP/禁 eval/token 基线、adapters 防腐壳、7 模块占位，四连绿 |
| 登录/认证 | ✅ 真接 | CONFIRMED | `POST /auth/login` 已联通（裸 token），动态路由守卫四步 + 404-last + glob 白名单，open-redirect 防护 |
| 可视外壳 | ✅ 完成 | CONFIRMED | BasicLayout（aside+header+main）、AppLogo、侧边栏菜单单源+两级嵌套+选中态、顶栏（折叠/面包屑/用户下拉）、#7e306b 主题 |
| 菜单系统 | ✅ 动态路由 | CONFIRMED | 菜单驱动路由构建 + 侧边栏渲染，单数据源有回归测试钉死 |
| 权限系统 | ✅ 骨架就绪 | CONFIRMED | `v-perm` 指令、`hasPerm`/`hasRole` 可用，暗态 gating（空集放行） |
| 字典 | ✅ 真接 | CONFIRMED | `GET /system/dict/data/list/{type}` 联通，DictSelect/DictTag 组件 |
| 表单设计器 | ✅ 功能完整 | CONFIRMED | 8 字段类型拖拽设计、配置面板、预览、子表设计、防腐层隔离 form-create |
| 表单渲染 | ✅ 功能完整 | CONFIRMED | 运行时表单渲染、DynamicField 按类型分发控件、REFERENCE 选择器（弹窗选择引用记录） |
| 系统管理 | ✅ 完整 CRUD | CONFIRMED | 字典类型/数据管理+用户/角色/部门/岗位 CRUD 全部完成；Types/API/Vue 视图/Mock 共 22 文件，F1+F2+F3 全部通过验收 |
| 通知 | ✅ 已落地 | CONFIRMED | NotifyHome 通知列表 + 标记已读交互，StandardListTemplate 页型 B 实例；Walking Skeleton 最终环闭合 |
| 工作流 | ✅ 已联通 | CONFIRMED | TodoList 待办列表 + ProcessDefList 流程定义列表，mock 验收通过，后端 REST 端点直连 |
| 定时任务 | ✅ 完整 | CONFIRMED | JobList + JobLog 视图、合约、API、Mock、路由全部闭环；F1+F2+F3 全部通过验收 |
| IoT | 🔲 占位 | CONFIRMED | 路由/菜单已注册，无业务页面 |
| Agent | ✅ 业务就位 | CONFIRMED | 模型管理页（ModelList，2026-08-19 闭环 + V33 菜单 seed 生产可达）+ 图定义列表/图设计器（GraphDefList/GraphDesigner，已消费 Vue Flow adapter）；OpenAPI 等仍占位 |
| OpenAPI | 🔲 占位 | CONFIRMED | 路由/菜单已注册，无业务页面 |
| BPMN 集成 | 🟦 查看器已实现 + 已消费 | CONFIRMED | `adapters/bpmn/` 查看器防腐层已完成（[[bpmn-adapter]] Steps 0-3 COMPLETED）：`mountBpmnViewer`/`highlight`/`fitViewport`/`destroy` + 事件回调。两个消费方已就绪：ProcessDefList「查看流程图」+ ProcessInstanceList「流程图高亮+流转时间线」（[[process-monitoring]] COMPLETED）。设计器（Modeler）能力明确不在范围内 |
| Vue Flow | ✅ adapter 就绪 + 已消费 | CONFIRMED | @vue-flow/core 1.48 已安装，`adapters/flow-graph/` 防腐层已实现（mount/export/destroy + 事件回调），**首个消费方已就位：M07 GraphDesigner.vue 经 graphAdapter.ts 转换层调用 mountFlowGraph**（2026-08-16 D83 复核，非零消费方）。场景为 AI 调度图（M07），非表单设计器（SUPERSEDED：此前「表单设计器可视化集成」标签为知识库漂移，2026-07-25 [[vue-flow-adapter]] 完成更正） |

---

## 3. 已实现的核心能力

### 3.1 后端

- JWT 认证全链路（登录 → 令牌签发 → 过滤器校验 → 租户注入）
- RBAC 权限模型（用户/角色/菜单/部门/字典 CRUD，权限码 `module:resource:action` 体系）
- 动态宽表表单引擎（8 字段类型、TABLE/REFERENCE 两档关系原语、CASCADE/RESTRICT 删除语义、发布冻结）
- 表单版本管理（草稿→发布→快照，发布后字段不可修改）
- 通知基础设施（Facade + Controller + Mapper + Flyway 建表，`sw_notify_` 前缀）
- 多租户列级隔离（`tenant_id` 列，`TenantLineHandler` 数据源感知）
- 多数据源支持（dynamic-datasource，扩展库只读 SELECT-only）
- Flowable BPMN 工作流引擎集成
- Spring 事件跨模块通信（`@Async` + `@TransactionalEventListener(AFTER_COMMIT)`，经 `DomainEventPublisher`）
- Quartz 定时任务调度（BEAN + FLOW 双类型、Cron 动态管理、RAMJobStore 单节点、执行日志追踪）
- 多向文件存储（本地/MinIO/COS/Qiniu 四提供商、策略模式、统一上传/下载/删除 API）

### 3.2 前端

- 登录页 + 动态路由守卫（四步：公开放行 → token 检查 → 会话装配 → addRoute + 404-last + 重入）
- 低代码表单设计器（防腐层隔离 form-create，8 字段类型拖拽+配置）
- 表单运行时渲染器（DynamicField 按类型分发控件）
- REFERENCE 选择器（弹窗选择引用记录，"存 id 显示 value"）
- 两大标准页型模板（StandardFormTemplate / StandardListTemplate）
- 字典选择器和标签组件（DictSelect / DictTag）
- 安全基础设施（CSP strict、sanitize、safe-eval、SafeHtml、open-redirect 同源校验）
- MSW Mock 模式（`pnpm dev:mock` 零后端依赖肉眼验收）
- 工作流待办/流程定义前端（TodoList + ProcessDefList，StandardListTemplate 页型 B 实例）
- 通知列表页（NotifyHome，标记已读交互，页型 B 实例）
- 配置接缝层（`modules/form/utils/` 下的可替换纯函数：deriveColumns / deriveFilterFields / deriveReferenceColumns / deriveDisplayField / deriveSearchFields / resolveReferenceDisplay）
- 安全不变量常驻回归测试（sanitize 滤脚本、safeEval 隔离、token 不进 storage、redirect 同源、菜单单源、导入边界）
- 定时任务管理前端（JobList CRUD + 暂停/恢复/触发 + JobLog 只读日志 + 详情弹窗，StandardListTemplate 页型 B）
- 文件管理前端（StorageList 上传/列表/下载/删除，StandardListTemplate 页型 B，formatFileSize 工具函数）
- 大模型管理前端（ModelList 分页/名称查询/多 Key 状态 + 编辑表单基础参数与多 Key 配置 + API Key 脱敏/空值保留旧密钥 + 启停 + 连通性测试，V33 菜单生产可达；提交 `e26e5f0`，2026-08-19）

---

## 4. 进行中的功能

**（当前无进行中业务功能）**：agent-graph-execution-observability（P7 / M07-F02-04）已于 2026-08-20 **D148 功能级验收 PASSED**，功能 **COMPLETED**（第 27 个）、P7 运行日志子集✅已核销；单步调试继续待排期。D146/D146b 执行层补证修复标准 1/7/8/11/12：**后端 Security 集成测试 +12 用例（197/0/0）**、**前端 Mock handler 直测 +11 用例 + 路由访问控制 +3 用例（含 :executionId 参数修正 + meta.authority）**。测试基线：后端 685/0/0/0、前端 78f/760t 四门全绿、Flyway V34 零业务迁移。回执 `receipts/d148-functional-verification.md`。

**（此前无进行中业务功能）**：pg-v13-migration-chain-repair（I52）已于 2026-08-19 **D110 规划层最终验收 PASSED + 阶段三终态同步完成**，功能 **COMPLETED**、I52 正式关闭；方向归档 `product/pg-v13-migration-chain-repair/passed/`。

**（此前进行中，已由 D106 补证 + D107 复验关闭）**：agent-model-management-frontend（P5 / M07-F01）**COMPLETED（D107，2026-08-19）**——补证闭合 `other`/远端 4xx 可达/未认证 401/Mock 语义，后端 591/0/0、前端 69f/628t 四连；P5 核销、五行✅获规划确认。完成回执与测试回执位于 `product/agent-model-management-frontend/receipts/`，最终复验 `receipts/planning-final-review-d107.md`。

**department-query-filtering（M01-F01-04 / I31）已于 2026-08-18 完成前后端闭环并经 D103 复验 / D104 最终验收 COMPLETED**：后端 `GET /system/dept/tree` 扩展 name/status 可选条件 + 祖先补全树形结果（非法状态显式 400 不退化全量，无条件调用零变化）；前端 DeptList 名称/状态筛选、查询/重置、筛选空态，Mock 与真实接口语义对齐。后端 **582/0/0**（563+19）、前端 **66f/602t**（577+25）四连全绿，Flyway 零迁移。D103 仅终态同步缺口（memory/handoff.md 中下部旧口径）已全文修正复验通过。方向归档：`product/department-query-filtering/passed/`；最终复验：`receipts/planning-final-review-d104.md`。

**admin-role-governance（P24/I49）已于 D96 规划层最终验收 PASSED（2026-08-18）**：D94/D95 修正闭合 V31 冲突显式失败、角色/菜单/绑定行为、普通 admin 允许/撤权拒绝与 superadmin 旁路、job/storage 请求级 200/403/401、前后端编译互斥及清单零变化核对。后端全量 551/0/0，前端 66 spec/576 tests 四连全绿，Flyway V31/H2 全链 31 条 migrate+validate 通过；主方向已归档至 `product/admin-role-governance/passed/`，P24/I49 关闭条件满足。最终证据见 `product/admin-role-governance/receipts/planning-final-review-d96.md` 与阶段三回执。

> 最后更新：2026-08-21（agent-graph-execution-observability D148 规划层 PASSED + 阶段三终态同步 COMPLETED，第 27 个已完成功能；role-menu-permission-parity D123 COMPLETED）

**（无进行中业务功能）**：user-org-association-query 已于 2026-08-18 规划层最终验收 **PASSED**（D101）并完成阶段三同步；主方向归档至 `product/user-org-association-query/passed/`。

**阶段三同步**：D101 终态知识同步已完成，回执见 `product/user-org-association-query/receipts/post-acceptance-knowledge-sync.md`。

历史条目：

| 功能 | 状态 | 说明 |
|------|:---:|------|
| [[bpm-plugin-architecture]] | **COMPLETED** ✅ | M04-F08-01 BPM 可插拔机制（D81/D82 PASSED，2026-08-16）：前端节点面板/表单控件 registry 化 + 后端 NodeTypeTranslator SPI 注册表翻译 + 可插拔性证明（TEST_NODE/EMAIL/PROBE 零改消费方） |
| [[bpmn-adapter]] | **COMPLETED** ✅ | Steps 0-3 PASSED，Step 4 SUPERSEDED（由 [[process-monitoring]] 承接） |
| [[process-monitoring]] | **COMPLETED** ✅ | M04-F06-01 流程监控首批（流程图高亮 + 流转记录），耗时分析 + 流程干预延后至后续批次 |

---

## 5. 已完成的功能

> 最后更新：2026-08-21（27 个功能；agent-graph-execution-observability **COMPLETED（D148 PASSED + 阶段三终态同步，2026-08-21，第 27 个已完成功能）**；role-menu-permission-parity D123 COMPLETED（第 26 个）；user-group-membership D117 COMPLETED；pg-v13 D110 COMPLETED；agent-model-management-frontend D107 COMPLETED）

| 功能编号 | 功能名称 | 最终状态 | 完成日期 | 说明 |
|----------|----------|:--------:|:--------:|------|
| vue-flow-adapter | Vue Flow adapter 实现（M07 AI 调度图防腐层） | **COMPLETED** ✅ | 2026-07-25 | Step 0 探索 + Step 1 纯前端实现：`adapters/flow-graph/index.ts`（147 行，6 导出符号）+ `index.spec.ts`（96 行，6 测试），四连全绿，前端新基线 57 files / 497 tests。零消费方（预期状态，M07 业务模块未就位） |
| bpmn-adapter | BPMN adapter 查看器实现（I3 BPMN 部分） | **COMPLETED** ✅ | 2026-07-26 | Steps 0-3 全部 PASSED：Step 0 探索 + Step 1 前端查看器防腐层 + Step 2 后端 BPMN XML 端点 + Step 3 ProcessDefList「查看流程图」入口。59 files/517 tests 四连全绿。Step 4（M04-F06）SUPERSEDED 由 [[process-monitoring]] 承接 |
| process-monitoring | M04-F06-01 流程监控（首批：流程图高亮 + 流转记录） | **COMPLETED** ✅ | 2026-07-30 | Steps 0-3 PASSED。阶段三收尾完成。后端 465 tests + 前端 60f/521t。耗时分析 + 流程干预延后至后续批次 |
| feature-checklist-sync | 功能清单状态同步（I1） | **COMPLETED** ✅ | 2026-07-24 | 4 Steps 全部 PASSED：Step1/2 后端+前端逐条核实 54 条明细，Step3 规划层按 MIN 规则（[[decisions]] D35）综合裁决，Step4 机械应用到 `功能清单.md`。全表 89 条明细最终状态 ✅17/🟦12/⬜60，独立子代理核查确认与目标完全吻合 |
| kb-verification | 知识库对账运行期验证 | **COMPLETED** ✅ | 2026-07-22 | VB1(后端)+VF1(前端) 均 PASSED：后端运行期真值 203 tests（原「406」为回执误报，SUPERSEDED）；前端运行期真值 471 tests（与静态 463 差值 +8 定位为 tokens.spec.ts 循环展开），四连全绿 |
| auth-seam-completion | 后端 seam 收尾（双 token 认证） | **COMPLETED** ✅ | 2026-07-22 | 7 Steps（V1/B1/B2/B3/B4/F1/F2）全部 PASSED：新建 `sys_refresh_token` 表 + RefreshTokenService + /auth/refresh + /auth/logout（后端 462 tests）+ 前端双 token 管线（56 files / 491 tests），mock 模式全链路可用 |
| job-scheduler | 定时任务调度模块 | **COMPLETED** ✅ | 2026-07-21 | 7 Steps（B1~F3）全部通过：后端模块拆分+Quartz 集成+Controller+Facade+测试（全量后端 203 tests，CONFIRMED 2026-07-22 复验）+ 前端 Types/API/Vue 视图/Mock/路由闭环（54 files/471 tests） |
| storage-multi-provider | 多向可配置文件存储 | **COMPLETED** ✅ | 2026-07-20 | 7 Steps（B1~F3）全部通过：后端模块拆分 + 4 存储提供商实现 + Service/Controller/测试 + 前端 Types/API/视图/Mock/路由闭环 |
| bpm-task-center | BPM 待办中心增强 | **COMPLETED** ✅ | 2026-07-19 | 6 Steps（B1~F3）全部通过：后端 15 文件 + 前端 9 文件，后端 308 tests / 前端 48 files / 417 tests |
| M04-F01-01 | BPM 单节点审批前后端联通 | **COMPLETED** ✅ | 2026-07-15 | Walking Skeleton 第三环：待办列表 + 审批通过 + 流程定义列表全部实现并通过验收 |
| M02-F01-01 | 通知模块前端落地 | **COMPLETED** ✅ | 2026-07-15 | Walking Skeleton 最终环：通知列表页 + 标记已读交互，前端 352 tests ✅ |
| sys-mgmt-crud | 系统管理核心 CRUD 做宽闭环 | **COMPLETED** ✅ | 2026-07-16 | 6 Steps 全部通过：后端 16 文件 + 前端 22 文件，46 spec files / 392 tests 全绿 |
| checklist-gap-hardening | 清单缺口加固第一批（I33 登录停用校验 + I43/I44 生产菜单 seed） | **COMPLETED** ✅ | 2026-08-13 | 两项交付并测试通过：AuthController 登录/刷新双入口 status 校验（停用/锁定拒绝登录与 token 续期，10 个新测试）+ Flyway V29 菜单 seed（h2/postgresql 双份，4 行菜单：id16 文件管理/17 定时任务目录/18 任务管理/19 执行日志）。后端 435 tests/0 failures + 前端 63f/552t 四连全绿（2 个高负载超时 flaky 重跑通过）；V29 冒烟测试验证 27 迁移按序应用无 validate 失败 + 4 行菜单逐列断言通过（bpm 目录受既有 known-issues I47 阻断，非本批引入；注：迁移数口径后经 data-scope-enforcement 验证门修正为 28，见下条）。清单 M01-F02-02/M10-F03-01/M10-F06-01 回升 ✅，全表 ✅10/🟦37/⬜42 |
| data-scope-enforcement | M02-F04-01 数据权限完整落地（装配去硬编码 + 五档生效 + 7 表查询纳管 + 前端角色页五档配置） | **COMPLETED** ✅ | 2026-08-15 | 交付并测试通过：登录装配多角色取最宽档（并集语义 ALL>DEPT_AND_CHILD>CUSTOM>DEPT>SELF，CUSTOM 部门并集）+ `DeptScopeProviderImpl`（递归 + @Lazy 破环）+ Role CRUD dataScope/deptIds + `sys_role_dept` 表（Flyway V30 h2/pg 双份逐字一致）+ 7 表查询纳管（sys_user 五档 @DataScope 直标；6 表等效条件：bpm_instance/agent_graph_execution/agent_model_config/job_info/job_log/storage_file）+ 前端 RoleList 五档下拉 + 部门树。后端 **521 tests/0 failures/0 errors**（435 基线 +86）+ 前端 63f/552t 四连全绿（typecheck/build 为一次性 1024M 内存例外）；V30 冒烟 6 目录链 28 迁移按序应用 + validate 通过（迁移数口径 27→28 修正：form/h2 V12 此前漏计）。非目标：手写 SQL 通道不纳管（known-issues I46，与 I10 同源）；dataScope 登录时快照、非实时生效。清单 M02-F04-01 ⬜→✅，全表 ✅11/🟦37/⬜42（90 行明细） |
| agent-model-orchestration | M07-F01/F02/F04 大模型管理 + 图设计器 + 多轮会话（F01 Steps 1-5 + F02 Steps 6-12 + F04 会话持久化） | **COMPLETED** ✅ | 2026-08-12 | Steps 1-12 全部 PASSED（D53-D71）：模型管理/AES 加密/连通性测试 → LangGraph4j 编排引擎 → 工具沙箱 → 多轮会话（V21-V23）→ 多Key轮询/额度限流 → 图定义 CRUD+发布骨架 → AgentGraphInterpreter 解释执行 → 前端图设计器（V26 菜单）→ 多变量执行上下文 → 并行/循环节点（LOOP/FORK/JOIN）→ 执行历史持久化（V27/V28）。后端 262→426 tests；前端 60f/521t→63f/552t。详情 `product/agent-model-orchestration/passed/` |
| bpm-plugin-architecture | M04-F08-01 BPM 可插拔机制（节点/控件/翻译器注册表化） | **COMPLETED** ✅ | 2026-08-16 | 6 Step 闭环（D81 执行层闭环 + D82 规划层验收 PASSED）：后端 NodeTypeRegistry +4 预留位 + GraphToBpmnTranslator switch→NodeTypeTranslator SPI 注册表翻译 + TEST_NODE 可插拔性证明；前端 DynamicField 9 控件 + 8 节点面板双注册表 + EMAIL/PROBE 证明。后端 521→527、前端 63f/552t→66f/569t；Flyway 零迁移。详情 `product/bpm-plugin-architecture/passed/` |
| status-semantics-alignment | I51 前端 status 语义对齐（用户/部门页与后端契约一致） | **COMPLETED** ✅ | 2026-08-17 | 修复轮闭环（方向 `product/status-semantics-alignment/ready/`）：前端单项目。后端契约核实（用户 0=正常/1=停用/2=锁定、部门 0=正常/1=停用；角色/岗位 1=启用/0=停用 与前端现状一致故未动）。UserList/DeptList 默认值/选择项/筛选/展示按后端契约修正（新建默认 0=正常），新增集中常量 `modules/system/constants.ts`（仅服务用户/部门页），mock 种子与 create 默认值、user/dept API spec 夹具同步，新增 7 测试（提交/回填语义）。前端 66f/569t→**66f/576t** 四连全绿；后端零修改；清单状态列无变化。详情 `product/status-semantics-alignment/` |
| sysrole-v5-column-alignment | P13/I26 SysRole 与 V5 列契约对齐（实体/测试 DDL → `built_in`/`remark`） | **COMPLETED** ✅ | 2026-08-17 | 修复轮闭环（方向 `product/sysrole-v5-column-alignment/passed/`，2026-08-17 规划层最终验收 **PASSED** 并归档）：后端单功能。`SysRole.java:47,51` 两处 `@TableField` 改 `built_in`/`remark`（字段名/JSON 键不变）→ 测试契约对齐 V5 链尾：`schema-datascope-h2.sql`（列名/类型/唯一索引含 V13 deleted 形态、头注释失真口径修正）、`AuthFlowIntegrationTest.java`（内建表/索引/INSERT/注释）。全仓 grep `is_builtin` 主代码/测试零残留。验证：sw-biz-system-biz 模块 111/0/0 + 项目级全量 **527/0/0**（MAVEN_OPTS=-Xmx2g，BUILD SUCCESS 31/31 模块，与基线持平）；MP 生成 SQL 原文含 `built_in`/`remark AS description` 双向闭合。Flyway 零迁移；前端零改动；P10/P12 未触碰（H2 真全链验证当时仍受 I47 阻断，如实分离；已于 bpm-h2-v8-compat 轮闭环）。清单状态列无变化（M02-F01-01 缺口=绑定写入等，非本轮范围）。详情 `product/sysrole-v5-column-alignment/` |
| bpm-h2-v8-compat | P10/I47 BPM H2 V8 迁移链兼容性修复（h2/V8 partial index → 生成列等价实现 + 永久真全链验证） | **COMPLETED** ✅ | 2026-08-17 | 修复轮闭环（方向 `product/bpm-h2-v8-compat/passed/`，2026-08-17 规划层最终验收 **PASSED** D87/D88 并归档）：后端单功能。h2/V8 L34 partial unique index（`WHERE active=true`，H2 2.3.232 不支持任何模式）→ `sw_bpm_form_binding` 新增生成列 `active_key varchar(265) generated always as (case when active then (cast(tenant_id as varchar(64)) || ':' || form_key) end)` + 唯一索引改建于 `active_key`（索引名 `uk_sw_bpm_binding_active` 不变；active=true→非空唯一、active=false→NULL 可共存=非 active 历史共存），文件头错误断言同步修正；**仅 h2/V8 一个生产迁移文件改动**（从未在任何 H2 库执行成功，无校验和/升级路径风险），pg/V8、V13、V14 零改动。测试基建最小补充：sw-bootstrap pom +junit-jupiter(test) + 永久 `FlywayFullChainH2Test`（7 目录 30 条迁移 migrate+validate，**冒烟口径 28→30**，BPM V8/V14 纳入）；`BpmFormBindingServiceImplTest` 绑定语义正反例 8 用例（唯一冲突 SQLState=23505、非 active 共存、启停切换、租户隔离）；测试 schema-h2.sql 追加与修复后 V8 逐字一致的绑定表。验证：sw-bpm-process 58/0/0、sw-bootstrap 8/0/0、项目级 **543/0/0**（527+16，BUILD SUCCESS 31/31，MAVEN_OPTS=-Xmx2g）。前端零改动；清单状态列无变化（I47 为迁移链缺陷非清单明细行）。遗留：PG 侧 partial index 运行期语义验证依赖 PG 本地库（规划层授权后可补）。回执 `product/bpm-h2-v8-compat/receipts/` |
| admin-role-governance | P24/I49 双角色治理（不可变内置 superadmin + 可配置普通 admin + 菜单/按钮权限与最小绑定闭环） | **COMPLETED** ✅ | 2026-08-18 | 方向 `product/admin-role-governance/passed/`（D93-D97 规划层最终验收 **PASSED** D96）：V31 h2/pg 双份迁移（冲突显式失败）+ 普通角色菜单/按钮权限 + 最小用户角色绑定读写/清空回填 + job/storage 请求级 200/403/401 + 登录/refresh 拦截；后端 551/0/0、前端 66f/576t 四连全绿、H2 全链 31 条 migrate+validate；清单无整行变更（I36 仅关闭普通角色绑定子集，I49 关闭）。 |
| user-org-association-query | I32/I34/I35/I36 普通角色子集：人员组织关联与组合查询闭环（V32 + 统一事务 + 双租户/回滚/超管保护） | **COMPLETED** ✅ | 2026-08-18 | 方向 `product/user-org-association-query/passed/`（D101 规划层最终验收 **PASSED**，阶段三同步 COMPLETED）：`sys_user_post` V32 H2/PG 双份 + `createWithAssociations`/`updateWithAssociations` 统一事务（故障注入证明整体回滚）+ 关键字/状态/部门含下级/岗位/角色组合查询（EXISTS/DISTINCT）+ 普通入口禁绑 superadmin + 前端部门选择/岗位/角色多选/清空回填/Mock；后端 **563/0/0/0**、前端 66f/577t 四连全绿、H2 新库 V1→V32 与 V31→V32 migrate+validate 10 tests。PG 运行期与互斥快照为非阻塞环境待办。清单 I32/I34/I35 三行 🟦→✅，终态 ✅15/🟦34/⬜41。 |
| department-query-filtering | M01-F01-04 / I31 部门名称/状态条件查询闭环（树形祖先补全 + 前端筛选） | **COMPLETED** ✅ | 2026-08-18 | 执行层闭环 + D103 复验 + D104 最终验收 **PASSED**（方向 `product/department-query-filtering/passed/`，最终复验 `receipts/planning-final-review-d104.md`）：`GET /system/dept/tree` 扩展 name/status 可选条件（非法状态显式 400 不退化全量；无参零变化）+ 命中集合与授权范围祖先补全（同一查询通道，租户/逻辑删除/可见范围不越界）+ 去重 sort+id 稳定排序；前端 DeptList 名称/状态下拉/查询/重置/Enter/筛选空态，Mock 与真实接口语义对齐（含同 sort 按 id 升序）。后端 **582/0/0**（563+19：Controller +2、集成 +17，含两租户/已删除/受限范围隔离边界专项）、前端 **66f/602t**（577+25）四连全绿；Flyway 零迁移。清单 M01-F01-04 🟦→✅，终态 ✅16/🟦33/⬜41，I31 关闭。D103 仅终态同步 FAILED 已由 `receipts/post-d103-sync-correction.md` 全文修正复验通过。 |
| pg-v13-migration-chain-repair | I52 PostgreSQL V13 迁移链 2BP01 修复（PG 侧 V13 第 7 项 DROP INDEX→DROP CONSTRAINT + 永久 PG 全链验证） | **COMPLETED** ✅ | 2026-08-19 | 执行层闭环完成（方向 `product/pg-v13-migration-chain-repair/ready/`，完成回执 `receipts/` 待规划层验收）。根因：form/V7 inline UNIQUE → PG 约束背书隐式索引 `sw_form_def_form_key_key`，V13:58 `DROP INDEX` 2BP01。修复：PG 侧 V13 第 7 项改 `ALTER TABLE sw_form_def DROP CONSTRAINT IF EXISTS sw_form_def_form_key_key;`（H2 侧 V13 零改动）；策略依据=PG 无已应用 V13 既有库（无校验和风险）+ V14-V33 零下游引用 + 新增 V34 新库不可达。验证：永久 `FlywayFullChainPostgresTest`（zonky embedded-postgres PG 17.5）先红后绿——PG 新库全链 **33 条** migrate+validate + 既有库升级夹具（target32→V33）+ 逻辑删除唯一性语义正反例（23505/软删重建共存）；H2 `FlywayFullChainH2Test` 11 用例零退化；项目级 **599/0/0/0**（591+8）。语义事实修正：复合唯一下每业务键最多一条 deleted=1 历史（真实 PG 证伪并固化守卫）。前端零改动、清单状态列零变化。 |
| agent-model-management-frontend | P5 / M07-F01-01～05 大模型管理前端闭环（模型接入/参数配置/密钥管理/连通性测试 + 生产可达性） | **COMPLETED ✅（D107 复验）** | 2026-08-19 | 执行层闭环，D106 首轮验收 FAILED（证据缺口：`other` 协议与远端 4xx 可达、未认证 401、Mock 禁用/锁定连通性语义），**D107 补证复验 PASSED / COMPLETED**。主体事实：**后端零 Java 业务改动**，新增 V33 菜单/按钮权限 seed（H2+PG 双方言逐字节一致：菜单 id=209「大模型管理」permission=`agent:model:view`、按钮 id=210=`agent:model:manage`、id=211=`agent:model:test`，仿 V31 按钮行先例 + INSERT SELECT WHERE NOT EXISTS 幂等；**不 seed sys_role_menu** 沿用 V6/V26 超管旁路决策；提交 `d4d7dc3`）。后端 **591/0/0**（补证 +7 用例：`other` 200/404、OpenAI 401、Ollama 404、未认证 401、禁用/锁定连通性语义）、H2 新库全链 33 迁移 + V32→V33 升级链通过、PG 真实库（127.0.0.1）临时 schema V33 幂等执行通过（public 零改动）。前端（提交 `e26e5f0`）：契约/API/Mock/菜单/路由/页面全闭环——ModelList 分页+名称查询+协议/模型/启停/多 Key 状态展示、编辑表单（基础参数+多 Key 分组/排序/额度冷却）、API Key 脱敏与空值保留旧密钥、启停、连通性测试（结果含成功/失败/消息/耗时）、`lockedUntil` 只读、GraphDesigner 模型下拉兼容回归；**69 files / 628 tests / 0 failures**（66f/602t → +3f/+26t）2G 上限四连全绿。清单 M07-F01-01～05 五行 🟦→✅，终态 ✅21/🟦28/⬜41，P5 核销、I45 的 M07-F01 前端缺口关闭（D107 获规划确认）。方向归档 `product/agent-model-management-frontend/passed/`。 |
| user-group-membership | P28 / I36 / M01-F04-01 基础子集：用户组维护与成员绑定闭环 | **COMPLETED ✅** | 2026-08-19 | 业务十一项验收全部通过（D117 功能级 PASSED + D118-D120 阶段三终审链 COMPLETED）。V34 双端迁移 `sys_user_group`/`sys_user_group_member`（业务标识租户内唯一 + 逻辑删除唯一语义）；后端 SysUserGroup/Service/Controller（组 CRUD/启停/逻辑删除、成员保存/替换/清空/移除/回填、数据范围=组内成员部门 EXISTS、成员绑定校验=候选可见性同源、非 superadmin 零隐式授权）；前端 UserGroupList 页面/API/类型/Mock/菜单/权限（`system:userGroup:list`/`manage`）。测试：后端 45 专项 + Flyway H2/PG 全链（34 迁移、V33→34 升级链、逻辑删除唯一语义 23505）+ 项目级 **647/0/0/0**；前端 **71 files / 646 tests / 0 failures** 四连全绿。清单 M01-F04-01 ⬜→🟦（终态 ✅21/🟦29/⬜40）；**I36 关闭（用户组绑定语义，不扩大为流程/权限消费端）**；**P28 核销**；M01-F04-01 消费端未接不得升 ✅；已完成功能 24→25。方向归档 `product/user-group-membership/passed/`；回执 `receipts/`（D113-D120 审查链 + stage3-closeout）。 |
| role-menu-permission-parity | P1 / M02-F02-01 / M02-F03-01 角色菜单/按钮权限契约一致性收口 | **COMPLETED ✅** | 2026-08-20 | **D121 执行层功能级 PASSED → D122 规划终验 FAILED（四类偏差）→ 2026-08-20 退回修正完成 → D123 规划层最终验收 PASSED + 阶段三终态同步 COMPLETED**。D122 四类偏差全部修正：①生产 403 契约——GlobalExceptionHandler 新增 AuthorizationDeniedException 分支（HTTP 403 + body 403），移除测试专用处理器覆盖，请求级 403 走真实生产链路（sw-common +spring-security-core 编译期依赖，GlobalExceptionHandlerTest 2 用例）；②停用角色有效撤权——SysMenuServiceImpl.loadMenuIdsByUserId 与 UserDetailsProviderImpl.loadPermissions 对称按 sys_role.status=1 过滤（AuthMenus A4/A9 改为撤权生效断言）；③Mock 双角色身份——超管会话 username=superadmin/roles=['superadmin']，新增普通 MOCK_SESSION_DATA_ADMIN（admin 非超管、权限按绑定装配），登录三会话映射（auth-session.spec +3 用例）；④权威问题注册——I53/I54 登记 knowledge/known-issues.md + memory/issues.md。测试：后端 **674/0/0/0**（112 报告文件；670 +4）、前端 **73 spec / 681 tests / 0 failures**（+3）2G 上限四连全绿；零 Flyway。清单 M02-F02-01 / M02-F03-01 🟦→✅（终态 ✅23/🟦27/⬜40）；**P1 正式核销**；功能数 25→26。方向归档 `product/role-menu-permission-parity/passed/`；规划复验 `receipts/planning-final-review-d123.md`；终态同步回执 `receipts/post-d123-terminal-sync.md`；历史回执 `receipts/`（planning-review-d122、d122-fix-receipt、step1/step2/step3b×2、completion、test-receipt、stage3-knowledge-sync）。 |
| agent-graph-execution-observability | P7 / M07-F02-04 图执行历史与运行日志前端可观测闭环 | **COMPLETED ✅（D148 功能级 PASSED）** | 2026-08-20 | **D148 功能级验收 PASSED**（D137/D138 为失效历史，D139-D147 为补证迭代）。后端零改动复用 Step12(D70-D71) 三类端点；前端 ExecutionList.vue/ExecutionDetail.vue/NodeTrajectory.vue 全链闭环 + 路由注册（`:executionId` 参数名）+ API 补充。D146/D146b 补证修复标准 1/7/8/11/12：后端 Security 集成测试 +12（197/0/0）、Mock handler 直测 +11 + 路由访问控制 +3。清单 M07-F02-04 保持 🟦（"运行日志查看 ✅ + 单步调试🟦"，部分完成不自动升✅）。P7 运行日志子集✅已核销，单步调试继续待排期。测试：后端 **685/0/0/0**（sw-basic-agent 197）、前端 **78f/760t** 四门全绿、Flyway V34 零业务迁移。方向归档 `product/agent-graph-execution-observability/passed/`；回执 `receipts/`（d148-functional-verification.md, d146-supplement-summary.md 等）。 |

---

## 6. Walking Skeleton 状态 🎉

```
登录/认证 ✅ → 表单设计/渲染 ✅ → BPM 单节点审批 ✅ → 通知列表 ✅
```

**四环全部闭合。** Walking Skeleton 里程碑达成。

---

## 7. 已知 Seam（接缝）

> **重要更正（CONFIRMED 2026-07-21，代码直读裁决）**：此前本表将 `/system/auth/me`、菜单树、权限装配记为「占位/未就绪」，**与代码实际不符**。经直读 `AuthMeController.java` / `SysMenuServiceImpl.java` 与前端 `foundation/session|menu`，这三者后端前端**均已实现且字段对齐**（Flyway `V5__m_seam_rbac` / `V6__m_seam_menu_seed` 即此前一次 seam 点亮，未记入知识库——与 I1 同源漂移）。真正缺失的仅 `/auth/refresh`、`/auth/logout`。详见 [[auth-seam-completion]]。

**已实现（真实端点，非占位）：**

| 端点 | 位置 | 状态 |
|------|------|------|
| `GET /system/auth/me`（用户信息+角色+权限+superAdmin） | AuthMeController.me() ← foundation/session | ✅ 已实现，字段对齐 |
| `GET /system/auth/menus`（菜单树） | AuthMeController.menus() + SysMenuServiceImpl.getMenuTree ← foundation/menu | ✅ 已实现，menuType/permission 对齐 |
| 权限装配 | UserDetailsProviderImpl 聚合，随 /me 返回 | ✅ 已实现 |

**真正未就绪的 Seam：**

| Seam | 位置 | 影响 |
|------|------|------|
| `POST /auth/refresh` | foundation/auth | ✅ **已实现（2026-07-22）** — 后端 B2 + 前端 F1 双 token 单飞刷新管线，测试覆盖：轮换/撤销/过期/SameSite |
| `POST /auth/logout` | foundation/auth | ✅ **已实现（2026-07-22）** — 后端 B2 撤销 refresh + 清 cookie + 前端 F1 try/catch/finally 清除本地态 |
| BPMN adapter | adapters/bpmn | ✅ **查看器已实现（2026-07-25）+ 前端消费入口已就绪（2026-07-26）** — [[bpmn-adapter]] Step 1（mount/highlight/fitViewport/destroy + 事件回调防腐层）+ Step 2（后端 BPMN XML 只读端点）+ Step 3（ProcessDefList「查看流程图」入口，59 files/517 tests 四连全绿）；设计器（Modeler）能力不在范围 |
| Vue Flow adapter | adapters/flow-graph | ✅ **已实现（2026-07-25）** — [[vue-flow-adapter]]，mount/export/destroy + 事件回调防腐层，57 files/497 tests 四连全绿 |
| 多页签 | layouts/BasicLayout | 占位，未实现 |

> 口径偏差（✅ 已纠正 2026-07-22）：后端 superAdmin 判定实为 `UserDetailsProviderImpl.roleCodes.contains("superadmin")`（角色 code），非 `userId==1`（代码注释明写已替换旧硬编）。system.md §11.7、shared-constraints §1.2、decisions D6 均已同步更正为角色 code 口径。

---

## 8. 下一优先事项

全部 **27** 个功能已完成闭环（agent-graph-execution-observability 为 D148 功能级 PASSED，第 27 个）：

1. ✅ Walking Skeleton（登录→表单→审批→通知）
2. ✅ sys-mgmt-crud（系统管理核心 CRUD）
3. ✅ bpm-task-center（BPM 待办中心增强）
4. ✅ storage-multi-provider（多向可配置文件存储）
5. ✅ job-scheduler（定时任务调度模块）
6. ✅ kb-verification（知识库运行期验证）
7. ✅ auth-seam-completion（后端 seam 收尾 — 双 token 认证）
8. ✅ feature-checklist-sync（功能清单状态同步，I1）
9. ✅ vue-flow-adapter（Vue Flow adapter 实现）
10. ✅ bpmn-adapter（BPMN adapter 查看器实现）
11. ✅ process-monitoring（M04-F06-01 流程监控首批）
12. ✅ checklist-gap-hardening（清单缺口加固第一批：I33 登录停用校验 + I43/I44 菜单 seed）（2026-08-13）
13. ✅ data-scope-enforcement（M02-F04-01 数据权限完整落地）（2026-08-15）
14. ✅ notify-frontend（通知模块前端落地）（2026-07-15，Walking Skeleton 最终环）
15. ✅ agent-model-orchestration（M07-F01/F02/F04：模型管理/编排引擎/工具沙箱/会话/图设计器/并行循环/执行历史）（2026-08-12，D53-D71）
16. ✅ bpm-plugin-architecture（M04-F08-01 BPM 可插拔机制）（2026-08-16，D82 PASSED）
17. ✅ status-semantics-alignment（I51 前端 status 语义对齐：用户/部门页与后端契约一致，含 7 新测试）（2026-08-17）
18. ✅ sysrole-v5-column-alignment（P13/I26 SysRole 与 V5 列契约对齐）（2026-08-17，PASSED 归档）
19. ✅ bpm-h2-v8-compat（P10/I47 BPM H2 V8 迁移链兼容修复：生成列等价实现 + 永久全链测试 30 条）（2026-08-17，D87/D88 PASSED）
20. ✅ admin-role-governance（P24/I49 双角色治理：superadmin 不可变 + 普通 admin + 菜单/按钮权限与最小绑定）（2026-08-18，D96 PASSED）
21. ✅ user-org-association-query（I32/I34/I35/I36 普通角色子集：人员组织关联与组合查询）（2026-08-18，D101 PASSED，阶段三同步 COMPLETED）
22. ✅ department-query-filtering（M01-F01-04/I31 部门名称/状态条件查询闭环：树形祖先补全 + 前端筛选）（2026-08-18，D103 复验 + D104 最终验收 PASSED）
23. ✅ agent-model-management-frontend（P5/M07-F01-01～05 大模型管理前端闭环：模型接入/参数配置/密钥管理/多 Key/连通性测试 + V33 生产可达性 seed）（2026-08-19，D106 补证 + D107 复验 **PASSED / COMPLETED**）
24. ✅ pg-v13-migration-chain-repair（I52 PostgreSQL V13 迁移链 2BP01 修复：PG 侧 V13 DROP INDEX→DROP CONSTRAINT + 永久 PG 全链验证）（2026-08-19，D109 补证 + D110 复验 **PASSED**，阶段三终态同步 **COMPLETED**）
25. ✅ user-group-membership（P28/I36 用户组维护与成员绑定闭环：V34 双端迁移 + 组/成员 CRUD + 数据范围+成员校验）（2026-08-19，D117 PASSED + 阶段三 COMPLETED，功能数 25）
26. ✅ role-menu-permission-parity（P1/M02-F02-01/F03-01 角色菜单/按钮权限契约一致性收口：真实 API—Mock—页面—安全回归一致；后端 674/0/0/0、前端 73f/681t、零 Flyway）（D121 执行层 PASSED → D122 退回修正 → **D123 规划层最终验收 PASSED + 终态同步 COMPLETED，2026-08-20**）
27. ✅ agent-graph-execution-observability（P7/M07-F02-04 图执行历史运行日志前端可观测闭环：ExecutionList.vue/ExecutionDetail.vue/NodeTrajectory.vue 全链闭环，后端零改动复用 Step12(D70-D71)；**后端 685/0/0/0、前端 78f/760t、Flyway V34**）（**D148 功能级 PASSED，2026-08-20**）← **最新完成，第 27 个**

后续候选（2026-08-19 D121 轮后更新，按风险/价值排序参考）：

1. ~~M01/M02 其余虚高要素补齐~~ — **P1 已核销（2026-08-20，role-menu-permission-parity D123 规划层最终验收 PASSED + 终态同步：I31/I36/F02/F03 全部子项闭合）**，M02-F02-01/F03-01 已 ✅，本条不再作为候选
2. **M07 补全** — F02-02 Prompt 配置、F02-04 运行日志页+单步调试、F04-02 Token 统计（缺口逐一已由 D83 回执确认；F01 前端管理页已由 agent-model-management-frontend 闭环）
3. **M07-F03/F04 新功能** — 助手配置/知识库 RAG/对话窗口 SSE（均零代码）
4. **IoT / OpenAPI 模块落地** — 仅骨架（D83 复核确认 M08/M09 全 ⬜ 无虚低）
5. **M04-F06-01 后续批次（耗时分析 + 流程干预）** — process-monitoring 首批已完成，剩余 2/4 子能力延后
6. **小项池** — 数据权限遗留（部门档 deleted 过滤/job 非分页入口/PG 联调）、停用即时生效（JWT 过滤器层）——**PG 侧全链直跑已由 pg-v13-migration-chain-repair 修复关闭（I52，2026-08-19）**（I51 已于 2026-08-17 status-semantics-alignment 修复关闭；I26/I47 已于 2026-08-17 分别由 sysrole-v5-column-alignment 与 bpm-h2-v8-compat 修复核销；I49 已由 admin-role-governance D96 关闭）

---

## 9. 测试基线

| 项目 | 校验命令 | 当前状态 |
|------|----------|----------|
| 后端 | `mvn -q compile && mvn -q test` | **CONFIRMED**（2026-08-20 agent-graph-execution-observability D148 功能级 PASSED）：`MAVEN_OPTS="-Xmx2g" mvn test` 全量 BUILD SUCCESS。项目级基线 **685 tests / 0 failures / 0 errors / 0 skipped**（sw-basic-agent 197，含 D146 新增 `AgentGraphExecutionSecurityIntegrationTest` +12 HTTP Security 集成测试）。**双方言全链口径**：H2 全链 **34 条迁移**（7 目录，`FlywayFullChainH2Test` 永久测试 9 用例）+ V32→V34 升级链；**PG 侧全链直跑已修复（I52 关闭）**——`FlywayFullChainPostgresTest`（zonky embedded-postgres PG 17.5 真实二进制，9 用例）新库全链 **34 条** migrate+validate + 既有库升级夹具（target32→V34）+ 原 V13 checksum 显式失败守卫 + 语义正反例全绿；平台二进制由 `embedded-postgres-binaries-bom:17.5.0` 统一管理（全平台可运行）。 |
| 前端 | `pnpm typecheck && pnpm lint && pnpm test && pnpm build` | **CONFIRMED**（2026-08-20 agent-graph-execution-observability D148 功能级 PASSED，`NODE_OPTIONS="--max-old-space-size=2048"`）：四连退出码全 0。演进：73f/678t（D121）→ **78 files / 760 tests** 全通过。D146/D146b/D148 新增：Mock handler 直测 +11、路由访问控制 +3（含 :executionId 参数修正 + meta.authority）、行为测试重写 +5、NodeTrajectory +12、GraphDesigner 执行直达 +5 等。 |

### 前端测试覆盖详情（参考快照，2026-07-15 基线 ~350 tests）

> 以下为 Walking Skeleton 闭环时的详细覆盖分布。当前最新基线为 **78 files / 760 tests**（2026-08-20 agent-graph-execution-observability D148 功能级 PASSED，四连全绿；演进：73f/681t → 78f/760t）。

| 测试文件 | 用例数 | 测试内容 |
|----------|:-----:|----------|
| 路由守卫 | 4 | 不循环 / 404-last / rebuild 幂等 / session 失败→登出 |
| 菜单系统 | 3 | 单源（两消费者同一份载荷）/ 登出清除 / 侧边栏渲染·选中·折叠·嵌套 |
| 字典 | 2 | adapter code→value 映射 / 失败降级重试 |
| 权限 | 2 | 暗态 gating（空集放行）/ superAdmin 放行 |
| 安全不变量 | 4 | sanitize 滤 `<script>` / safeEval 够不到 globals / token 不进 storage / redirect 同源 |
| 导入边界 | 2 | modules 禁互引 / 禁直引危险库 |
| API 层 | 2+ | 各模块 API 函数单测 |
| 页面组件 | 6+ | NotifyHome（加载/ApiError/fallback/标记已读成功/失败/空列表）等 |

---

## 10. 明确延后项

以下功能为明确延后，非缺陷：

- 多标签页 tabs、换肤/暗色、移动端响应式适配、i18n 切换 UI
- 真实 logo 资源（当前为 `<AppLogo>` 占位，品牌色方块 mark + "Smart-WorkFlow"）
- `/auth/refresh`/`/auth/logout` 的真实实现（待后端；me/菜单/权限装配已实现，不在延后项）
- 骨架模块（IoT / Agent / OpenAPI / knowledge）的真实业务内容与接口（system/form/bpm/notify/storage/job 已真接）
- BPMN 流程设计器（Modeler，拖拽编辑能力）——按 [[decisions]] D40 明确排除在 bpmn-adapter 范围外，后端设计格式为 `ProcessGraph` JSON 而非 BPMN XML；BPMN 查看器（Viewer）已于 2026-07-25 实现（[[bpmn-adapter]] Step 1）。Vue Flow adapter 防腐层已于 2026-07-25 实现（[[vue-flow-adapter]]），服务于 M07 AI 调度图，业务模块本身延后
- RICH_TEXT 富文本编辑器集成
- 集群部署（定时任务暂为单节点 RAMJobStore）
- 表单/应用/流程的跨环境导入导出

---

## 11. 参考文档索引

| 文档 | 位置 | 来源 |
|------|------|------|
| 后端工程宪法 | `Smart-WorkFlow/docs/governance/engineering-constitution.md` | 后端项目正式治理文档 |
| 前端工作宪法 | `Smart-WorkFlow-Web/docs/governance/engineering-constitution.md` | 前端项目正式治理文档 |
| 功能清单（55 功能/90 明细） | `Smart-WorkFlow/功能清单.md` | `SmartWorkFlow_files.zip` → `功能清单.md` |
| 产品需求文档（PRD） | `SmartWorkFlow_files.zip` → `Smart-WorkFlow-PRD.md` | 需求基线 |
| 前端架构与现状知识库 | `SmartWorkFlow_files.zip` → `Smart-WorkFlow-前端架构与现状-知识库.md` | 前端单一现状源 |
| 页型规范（设计系统可视化） | `SmartWorkFlow_files.zip` → `Smart-WorkFlow 页型规范.html` | 两页型像素级原型 |

> 2026-07-16 的 `SmartWorkFlow_files.zip` 仅是部分文档的历史来源，不再构成工程宪法权威。当前工程宪法唯一权威为上表两个项目正式路径。
