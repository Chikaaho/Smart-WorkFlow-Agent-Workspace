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
| 数据库 | PostgreSQL（生产）/ H2（开发），Flyway 管理 schema，V1–V17 连续无缺号（CONFIRMED 2026-07-22 代码直读：V12=form 升级、V14=bpm process 均存在；V16=storage、V17=job-scheduler；无 V18/无 auth 脚本。脚本分散各模块 `db/migration/{module}/{postgresql,h2}`，双方言齐全） |
| 核心路径 | Walking Skeleton：登录 → 表单 → 审批 → 通知 ✅ 四环全部闭合 |
| 功能清单 | 10 模块，55 功能，**90** 明细（CONFIRMED 2026-07-23，此前记为 88，M10 差 1 条已更正——见 [[shared-constraints]] §5）；`Smart-WorkFlow/功能清单.md` 为权威清单，状态标记已与代码实际进度对齐：✅17/🟦12/⬜60（2026-07-24 [[feature-checklist-sync]]，I1 修复）→ ✅7/🟦40/⬜42（2026-08-12 Step5 二次核实与同步）→ **✅10/🟦37/⬜42**（2026-08-13 checklist-gap-hardening 第一批：I33/I43/I44 修复后回升 3 行） |
| 测试基线 | 后端：项目级 **435 tests / 0 failures / 0 errors**（CONFIRMED 2026-08-13 checklist-gap-hardening 第一批验证：426 基线 + I33 新增 10 = 436 运行口径，其中 1 个 V26 临时冒烟测试不在源码 → 435 源码口径）。演进：465（2026-07-28 process-monitoring Step 2 独立验收，surefire XML 跨模块合计，0 failures/0 errors；Step 1 收据「256」为误报——实际为子集计数，全量基线此前即 ≥459；新增 Step 1 +15 + Step 2 +6）→ 426（M07 阶段）→ 435（2026-08-13）。前端：**63 spec files / 552 tests**（CONFIRMED 2026-08-13 checklist-gap-hardening 验证：四连 typecheck/lint/test/build 全绿，含 2 个高负载超时 flaky 重跑通过，零失败）。演进：60f/521t（2026-07-28 process-monitoring Step 3 独立验收：60 passed / 521 tests / 0 failures；57f/497t → bpmn-adapter Step 1 +1f/+10t → 58f/507t → bpmn-adapter Step 3 +1f/+10t → 59f/517t → process-monitoring Step 3 +1f/+4t → 60f/521t）→ 63f/552t（2026-08-13）。四连校验门 CONFIRMED 全绿 |
| 前次验证 | 2026-08-13 checklist-gap-hardening 第一批验收：后端 435 tests / 0 failures（mvn test BUILD SUCCESS）+ 前端 63 files / 552 tests 四连全绿（含 2 个高负载超时 flaky 重跑通过）+ V29 冒烟测试（27 迁移按序应用无 validate 失败、4 行菜单逐列断言通过），均由执行代理运行、规划层核对证据。此前：2026-07-22 kb-verification VB1/VF1 后端 BUILD SUCCESS · 前端四连全绿 |

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
| sw-basic-agent | ⬜ 骨架 | CONFIRMED | AutoConfiguration 占位 |
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
| Vue Flow | ✅ adapter 就绪 | CONFIRMED | @vue-flow/core 1.48 已安装，`adapters/flow-graph/` 防腐层已实现（mount/export/destroy + 事件回调），零消费方（预期状态——M07 AI 调度图业务模块未就位，adapter 可独立先行）。场景为 AI 调度图（M07），非表单设计器（SUPERSEDED：此前「表单设计器可视化集成」标签为知识库漂移，2026-07-25 [[vue-flow-adapter]] 完成更正） |

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

> 最后更新：2026-07-25

| 功能 | 状态 | 当前 Step | 说明 |
|------|:---:|:---:|------|
| [[bpm-plugin-architecture]] | **PLANNING** | 方向已登记（2026-08-14） | M04-F08-01 BPM 节点/表单组件与后端 adapter 可插拔机制。方向裁定（2026-08-14 规划角色）：①前端建"节点类型→属性面板组件"注册表（仿 `FIELD_TYPE_REGISTRY`），替换设计器 v-if 硬编码；②`DynamicField.vue` 8 类控件渲染链 registry 化；③后端 `GraphToBpmnTranslator` switch 改为按类型注册的翻译器（仿 `NodeApproverResolver` Map 分发）；④`NodeTypeRegistry` 扩充为完整注册骨架；⑤后端 BPM adapter 抽象为可插拔 SPI。非目标：不做设计器本体、不新增具体节点/控件、不做运行时热插拔。方向文档待下发 `product/bpm-plugin-architecture/ready/` |
| [[bpmn-adapter]] | **COMPLETED** ✅ | Steps 0-3 PASSED，Step 4 SUPERSEDED | BPMN adapter 查看器实现（对应 [[known-issues]] I3 剩余 BPMN 部分）。Step 0（探索）/Step 1（前端查看器防腐层）/Step 2（后端 BPMN XML 只读端点）/Step 3（前端 ProcessDefList「查看流程图」入口）全部 PASSED 并归档。Step 4（M04-F06 流程监控）由新功能 [[process-monitoring]] 独立承接 |

| [[process-monitoring]] | **COMPLETED** ✅ | Steps 0-3 PASSED | M04-F06-01 流程监控首批能力（流程图高亮 + 流转记录）。Step 0 探索（范围裁定）+ Step 1 后端 Facade + Service 层（15 @Test）+ Step 2 后端 Controller（6 @Test）+ Step 3 前端 ProcessInstanceList 监控页面（4 @Test）。后端 465 tests + 前端 60f/521t。阶段三收尾完成（2026-07-30）。耗时分析 + 流程干预延后至后续批次 |

---

## 5. 已完成的功能

> 最后更新：2026-07-24

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
| checklist-gap-hardening | 清单缺口加固第一批（I33 登录停用校验 + I43/I44 生产菜单 seed） | **COMPLETED** ✅ | 2026-08-13 | 两项交付并测试通过：AuthController 登录/刷新双入口 status 校验（停用/锁定拒绝登录与 token 续期，10 个新测试）+ Flyway V29 菜单 seed（h2/postgresql 双份，4 行菜单：id16 文件管理/17 定时任务目录/18 任务管理/19 执行日志）。后端 435 tests/0 failures + 前端 63f/552t 四连全绿（2 个高负载超时 flaky 重跑通过）；V29 冒烟测试验证 27 迁移按序应用无 validate 失败 + 4 行菜单逐列断言通过（bpm 目录受既有 known-issues I47 阻断，非本批引入）。清单 M01-F02-02/M10-F03-01/M10-F06-01 回升 ✅，全表 ✅10/🟦37/⬜42 |

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

全部 **12** 个功能已完成闭环：

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
12. ✅ checklist-gap-hardening（清单缺口加固第一批：I33 登录停用校验 + I43/I44 菜单 seed）← **最新完成**（2026-08-13）

后续候选：

1. **M04-F06-01 后续批次（耗时分析 + 流程干预）** — process-monitoring 首批（流程图高亮+流转记录）已完成，剩余 2/4 子能力延后
2. **IoT / Agent / OpenAPI 模块落地** — 从占位推进到实际业务
3. **M07 AI 调度图业务模块** — `sw-basic-agent` 后端骨架落地 + 前端消费 `adapters/flow-graph/`（adapter 防腐层已就绪，等待后端引擎/工具沙箱/RAG 产品设计明确）
4. **Git commit of process-monitoring changes** — 10 个文件 untracked/uncommitted（8 后端 + 2 前端）
5. **M04-F08-01 BPM 节点/表单组件与后端 adapter 可插拔** — 新功能（2026-08-14 登记）：建议在 M04-F01 流程设计器开发前落地，避免设计器写死 v-if 后返工

---

## 9. 测试基线

| 项目 | 校验命令 | 当前状态 |
|------|----------|----------|
| 后端 | `mvn -q compile && mvn -q test` | **CONFIRMED**（2026-08-13 checklist-gap-hardening 第一批验证）：`mvn test` BUILD SUCCESS，**435 tests / 0 failures / 0 errors**（426 基线 + I33 新增 10 = 436 运行口径，−1 个 V26 临时冒烟测试不在源码 = 435 源码口径）。演进：465（2026-07-28 process-monitoring Step 2 独立验收，surefire XML 跨模块合计，含 Step 1 +15 + Step 2 +6；Step 1 收据「256」为子集误报 SUPERSEDED，全量基线此前即 ≥459）→ 426（M07 阶段）→ 435（2026-08-13）。原「462」「241」「203」均为更早历史基线（SUPERSEDED） |
| 前端 | `pnpm typecheck && pnpm lint && pnpm test && pnpm build` | **CONFIRMED**（2026-08-13 checklist-gap-hardening 第一批验证）：四连全绿，Vitest 汇总 **63 files / 552 tests** 全部通过（含 2 个高负载超时 flaky 重跑通过，零失败）。演进：60f/521t（2026-07-28 process-monitoring Step 3 测试回执 + 独立验收：57f/497t（2026-07-25 vue-flow-adapter Step 1）→ bpmn-adapter Step 1（+1f/+10t）→ 58f/507t → bpmn-adapter Step 3（+1f/+10t）→ 59f/517t → process-monitoring Step 3（+1f/+4t）→ 60f/521t，计数一致，零退化）→ 63f/552t（2026-08-13） |

### 前端测试覆盖详情（参考快照，2026-07-15 基线 ~350 tests）

> 以下为 Walking Skeleton 闭环时的详细覆盖分布。当前最新基线为 54 files / 471 tests（2026-07-21 F3 验收确认），新增覆盖包括 storage（8 测试）、job（34 测试）等模块的 API/视图测试。

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
| 后端工程宪法 | `Smart-WorkFlow/.claude/system.md` | `SmartWorkFlow_files.zip` → `CLAUDE-java.md` |
| 前端工作宪法 | `Smart-WorkFlow-Web/.claude/system.md` | `SmartWorkFlow_files.zip` → `CLAUDE-vue.md` |
| 功能清单（54 功能/89 明细） | `Smart-WorkFlow/功能清单.md` | `SmartWorkFlow_files.zip` → `功能清单.md` |
| 产品需求文档（PRD） | `SmartWorkFlow_files.zip` → `Smart-WorkFlow-PRD.md` | 需求基线 |
| 前端架构与现状知识库 | `SmartWorkFlow_files.zip` → `Smart-WorkFlow-前端架构与现状-知识库.md` | 前端单一现状源 |
| 页型规范（设计系统可视化） | `SmartWorkFlow_files.zip` → `Smart-WorkFlow 页型规范.html` | 两页型像素级原型 |

> 以上文件均来自 2026-07-16 的 `SmartWorkFlow_files.zip`。zip 中 `CLAUDE-java.md` / `CLAUDE-vue.md` 为最新版本工程宪法，如与子项目 `.claude/system.md` 存在差异，以 zip 版本为准并应同步更新子项目文件。
