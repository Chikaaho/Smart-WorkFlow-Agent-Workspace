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
| 数据库 | PostgreSQL（生产）/ H2（开发），Flyway 管理 schema，V1–V32；H2 全新库与 V31→V32 升级链 migrate+validate 已通过，PostgreSQL 运行期验证受当前环境无 PG/Docker 阻塞（2026-08-18） |
| 核心路径 | Walking Skeleton：登录 → 表单 → 审批 → 通知 ✅ 四环全部闭合 |
| 功能清单 | 10 模块，55 功能，90 明细；D102 终态按实际代码闭环为 **✅16/🟦33/⬜41**（`Smart-WorkFlow/功能清单.md` 权威清单；M01-F01-04 由 🟦→✅，I31 关闭；I36 用户普通角色子集不扩大整行）。 |
| 测试基线 | department-query-filtering 当前后端全量 **582 tests / 0 failures / 0 errors / 0 skipped（BUILD SUCCESS，31/31 模块）**；前端 **66 spec files / 602 tests / 0 failures**，typecheck/lint/test/build 四连退出码均为 0，均按 2G 约束串行执行、每次执行前保留互斥检查证据。 |

### 最近完成（D104，2026-08-18）

`department-query-filtering`（M01-F01-04 / I31）已由 D103 复验通过、D104 规划层最终验收 **COMPLETED**：后端 582/0/0、前端 66f/602t、Flyway 零迁移；D103 仅终态同步 FAILED 已由执行层全文修正并复验通过。方向归档 `product/department-query-filtering/passed/`，最终复验 `receipts/planning-final-review-d104.md`。前次：`user-org-association-query` 已由 D101 规划层验收 **PASSED**，阶段三同步完成并标记 `COMPLETED`。环境待办保留：PostgreSQL 运行期 migrate+validate、系统恢复后互斥快照。
| 前次验证 | 2026-08-17 bpm-h2-v8-compat 闭环（P10/I47 后端修复轮）：后端 `MAVEN_OPTS="-Xmx2g" mvn test` BUILD SUCCESS 31/31 模块，**543 tests / 0 failures / 0 errors**（527 基线 +16；surefire 时间窗 97 个 XML 聚合，无 flaky）；**Flyway 全链 H2 冒烟口径 28 → 30**——永久真全链测试 `FlywayFullChainH2Test`（sw-bootstrap）7 目录（root/bpm/notify/form/storage/job/agent）migrate + validate 通过，bpm V8/V14 纳入，不再有排除口径；h2/V8 partial index → 生成列 `active_key` + 唯一索引等价实现（pg/V8、V13、V14 零改动）。此前 2026-08-17 sysrole-v5-column-alignment 闭环（P13/I26，已 PASSED 归档）：后端 527/0/0 持平，SysRole 实体与全部触达 `sys_role` 的测试 DDL 已对齐 V5 链尾 `built_in`/`remark`，MP 生成 SQL 原文证据闭合。此前 2026-08-17 status-semantics-alignment 闭环：前端四连全绿 typecheck ✅、lint ✅、test **66 files / 576 tests** ✅（569 → +7）、build ✅；全部退出码 0。构建仅出现已登记的 `@vueuse/core INVALID_ANNOTATION` 第三方警告，不影响退出码或产物。后端零修改、未构建、未测试。此前 2026-08-16 bpm-plugin-architecture 闭环：后端 527/0/0、前端 66f/569t、Flyway 零迁移、清单 ✅12/🟦37/⬜41。 |

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
| sw-basic-agent | ✅ 完整 | CONFIRMED | 模型管理/编排/工具沙箱/会话/图定义/图执行全链（178 @Test，2026-08-16 D83 静态复核）；前端 GraphDefList + GraphDesigner 已消费 Vue Flow adapter |
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
| Agent | 🔲 占位 | CONFIRMED | 路由/菜单已注册，无业务页面 |
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

---

## 4. 进行中的功能

**department-query-filtering（M01-F01-04 / I31）已于 2026-08-18 完成前后端闭环并经 D103 复验 / D104 最终验收 COMPLETED**：后端 `GET /system/dept/tree` 扩展 name/status 可选条件 + 祖先补全树形结果（非法状态显式 400 不退化全量，无条件调用零变化）；前端 DeptList 名称/状态筛选、查询/重置、筛选空态，Mock 与真实接口语义对齐。后端 **582/0/0**（563+19）、前端 **66f/602t**（577+25）四连全绿，Flyway 零迁移。D103 仅终态同步缺口（memory/handoff.md 中下部旧口径）已全文修正复验通过。方向归档：`product/department-query-filtering/passed/`；最终复验：`receipts/planning-final-review-d104.md`。

**admin-role-governance（P24/I49）已于 D96 规划层最终验收 PASSED（2026-08-18）**：D94/D95 修正闭合 V31 冲突显式失败、角色/菜单/绑定行为、普通 admin 允许/撤权拒绝与 superadmin 旁路、job/storage 请求级 200/403/401、前后端编译互斥及清单零变化核对。后端全量 551/0/0，前端 66 spec/576 tests 四连全绿，Flyway V31/H2 全链 31 条 migrate+validate 通过；主方向已归档至 `product/admin-role-governance/passed/`，P24/I49 关闭条件满足。最终证据见 `product/admin-role-governance/receipts/planning-final-review-d96.md` 与阶段三回执。

> 最后更新：2026-08-18

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

> 最后更新：2026-08-18（22 个功能；本轮补录 D96/D101 两行历史欠账并新增 D102 行，D85 全量同步口径延续）

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

全部 **22** 个功能已完成闭环：

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
22. ✅ department-query-filtering（M01-F01-04/I31 部门名称/状态条件查询闭环：树形祖先补全 + 前端筛选）（2026-08-18，D103 复验 + D104 最终验收 PASSED）← **最新完成**

后续候选（2026-08-18 D102 更新，按风险/价值排序参考）：

1. **M01/M02 其余虚高要素补齐（关联/筛选）** — I36 用户组绑定/I40 待修复项（按钮权限配置入口等；部门条件筛选 I31 已由 department-query-filtering 关闭）
2. **M07 补全** — F01 前端管理页、F02-02 Prompt 配置、F02-04 运行日志页+单步调试、F04-02 Token 统计（缺口逐一已由 D83 回执确认）
3. **M07-F03/F04 新功能** — 助手配置/知识库 RAG/对话窗口 SSE（均零代码）
4. **IoT / OpenAPI 模块落地** — 仅骨架（D83 复核确认 M08/M09 全 ⬜ 无虚低）
5. **M04-F06-01 后续批次（耗时分析 + 流程干预）** — process-monitoring 首批已完成，剩余 2/4 子能力延后
6. **小项池** — 数据权限遗留（部门档 deleted 过滤/job 非分页入口/PG 联调）、停用即时生效（JWT 过滤器层）（I51 已于 2026-08-17 status-semantics-alignment 修复关闭；I26/I47 已于 2026-08-17 分别由 sysrole-v5-column-alignment 与 bpm-h2-v8-compat 修复核销；I49 已由 admin-role-governance D96 关闭）

---

## 9. 测试基线

| 项目 | 校验命令 | 当前状态 |
|------|----------|----------|
| 后端 | `mvn -q compile && mvn -q test` | **CONFIRMED**（2026-08-18 department-query-filtering D102）：`MAVEN_OPTS="-Xmx2g" mvn test` 全量 BUILD SUCCESS 31/31、**582 tests / 0 failures / 0 errors / 0 skipped**（563 基线 +19：DeptControllerTest +2、SysDeptQueryIntegrationTest +17）。演进：465（2026-07-28 process-monitoring Step 2 独立验收，surefire XML 跨模块合计）→ 426（M07 阶段）→ 435（2026-08-13）→ 521（2026-08-15）→ 527（2026-08-16）→ 543（2026-08-17）→ 551（2026-08-18 admin-role-governance D96）→ **563（2026-08-18 user-org-association-query D101）→ 582（2026-08-18 department-query-filtering D102）**。**Flyway 冒烟口径**：28（历史 6 目录链）→ **30（2026-08-17 起 7 目录全链）**；admin-role-governance root H2 全链为 **31 条迁移**；本功能零迁移。 |
| 前端 | `pnpm typecheck && pnpm lint && pnpm test && pnpm build` | **CONFIRMED**（2026-08-18 department-query-filtering D102，`NODE_OPTIONS="--max-old-space-size=2048"`）：四连退出码全 0，Vitest **66 files / 602 tests** 全通过（576→577 D101→**602**：D102 新增 25 测试——api/dept +6、DeptList +10、mock index +9），build 成功。 |

### 前端测试覆盖详情（参考快照，2026-07-15 基线 ~350 tests）

> 以下为 Walking Skeleton 闭环时的详细覆盖分布。当前最新基线为 **66 files / 602 tests**（2026-08-18 department-query-filtering 四连全绿，运行口径；577 D101 → 602 = +25：api/dept +6、DeptList +10、mock index +9）。

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
