# Smart-WorkFlow 系统架构

> 工作区统一知识库 — 架构分册。描述 Smart-WorkFlow 平台的整体架构设计与项目间关系。
> 项目内部实现细节见各项目 `docs/governance/engineering-constitution.md`。
>
> 信息来源：`CLAUDE-java.md` · `CLAUDE-vue.md` · `Smart-WorkFlow-PRD.md` · `Smart-WorkFlow-前端架构与现状-知识库.md`（均来自 `SmartWorkFlow_files.zip`，2026-07-16）。

---

## 1. 系统定位

Smart-WorkFlow 是一个**嵌入 AI Agent 的企业级低代码 OA 平台**，核心能力为「可视化表单设计 → 数据沉淀 → 流程审批 → 多渠道通知」端到端闭环，并预留 **AI 智能助手、IoT 接入、开放接口** 三条扩展轨道。

| 项目 | 定位 | 技术主体 |
|------|------|----------|
| **Smart-WorkFlow** | 后端 API 服务 | Java 21 + Spring Boot 3.4 模块化单体 |
| **Smart-WorkFlow-Web** | 前端 SPA | Vue 3 + TypeScript + Vite |

形态为**模块化单体**（`-api`/`-biz` 拆分，支持未来按需抽取微服务）。

### 1.1 目标用户与角色

| 角色 | 描述 | 主要诉求 |
|---|---|---|
| 系统管理员 | 搭建组织/权限/字典/参数、运维 | 配置即用、权限可控、可追溯 |
| 业务管理员 / 流程设计者 | 设计表单与流程、配置规则 | 拖拽设计、零代码、发布即生效 |
| 普通员工 | 填单、审批、查阅、收消息 | 简单、移动可用、消息及时 |
| 第三方应用（系统对接方） | 经开放接口集成 | 安全鉴权、最小权限、稳定契约 |

### 1.2 产品原则（决策优先级）

当多方案冲突时，按此排序权衡：**稳定性 > 可扩展性 > 可维护性 > 性能 > 开发成本**。

---

## 2. 系统关系

```
┌──────────────────────────┐        ┌──────────────────────────┐
│   Smart-WorkFlow-Web     │  HTTP  │    Smart-WorkFlow         │
│   (前端 SPA)              │ ────→ │    (后端 API)              │
│                          │  /api  │                          │
│   Vue 3 + TS             │        │   Java 21 + Spring Boot   │
│   Port: 5173 (dev)       │        │   Port: 8080              │
│                          │        │   Context: /api           │
└──────────────────────────┘        └──────────────────────────┘
```

- 前端开发服务器代理 `/api` → `http://localhost:8080`
- Mock 模式（`pnpm dev:mock`）下前端零后端依赖，全 MSW 拦截
- 生产构建后前端静态资源独立部署，运行时调用后端 API

---

## 3. 后端架构

### 3.1 四层模块化单体

```
sw-dependencies (BOM 版本管理)
  └─ sw-framework (内核层)
       ├─ sw-common   — 公共基础设施（BaseEntity/错误码/分页/多租户）
       └─ sw-security — 认证鉴权（JWT + Spring Security）
            └─ sw-basic (基础能力层)
                 ├─ sw-basic-storage   — 文件存储（MinIO）
                 ├─ sw-basic-notify    — 通知（站内信/模板/发送记录）
                 ├─ sw-basic-job       — 定时任务（Quartz 单节点）
                 ├─ sw-basic-iot       — IoT 设备接入（MQTT）
                 ├─ sw-basic-knowledge — 知识库与 RAG
                 └─ sw-basic-agent     — AI Agent（会话/消息/工具调用）
                      └─ sw-biz (业务层)
                           ├─ sw-biz-system  — 身份/组织/RBAC/字典/参数（共享内核）
                           ├─ sw-biz-form    — 低代码表单引擎（动态宽表）
                           ├─ sw-bpm — 流程引擎（BPMN/待办/审批，依赖 form，含 api/engine/process 子模块）
                           └─ sw-biz-openapi — 开放接口层
                                └─ sw-bootstrap (唯一启动入口 + Flyway)
```

### 3.2 模块职责边界

- **system** — 身份/组织/RBAC/字典/参数（共享内核）。**拥有**字典数据（dict type / dict item / code / label / 值域），经 `DictFacade`（定义于 `sw-biz-system-api`）对外暴露。
- **form** — 仅承载**表单与控件库**。不拥有任何业务主数据。字典**控件**（下拉框：绑定哪个 dict type、单/多选、渲染）归 form；字典**数据**归 system。form 的字典控件经 `DictFacade` 消费 system 的字典数据，**禁止** form 直接访问 `sys_dict` 表。
- **bpm** — 流程引擎（engine 闭源核心/防腐）+ 流程业务（process）+ 契约（api）。外部数据源执行引擎。
- **openapi** — 开放接口层。

### 3.3 依赖铁律

- 依赖方向自上而下，**不可反向**
- 业务模块仅依赖目标模块的 `-api`（契约/DTO/SPI），**禁止**依赖 `-biz`（实现）
- `bpm` 依赖 `form`（不可反向），运行时门控：`sw.form.enabled` 非 true 则 fail-fast
- `-api` / `-biz` 拆分支持未来微服务抽取

### 3.4 跨模块通信

| 场景 | 机制 | 说明 |
|------|------|------|
| 无返回值 | Spring 事件（`@Async` + `@TransactionalEventListener(phase = AFTER_COMMIT)`） | 经 `DomainEventPublisher` 薄封装 |
| 有返回值 | Facade 接口（定义于 `-api`，实现于 `-biz`） | Spring 注入调用 |
| ❌ 禁止 | FQCN 字符串选择实现 | 破坏 `@Transactional`/AOP，引入安全风险 |

### 3.5 表命名规则

仅约束**主业务库**自建表。前缀 = 模块短名，一对一映射。唯一例外是 system 用 `sys_`。

| 前缀 | 范围 | 模块 |
|------|------|------|
| `sys_` | 身份/组织/RBAC/字典/参数（共享内核） | sw-biz-system |
| `sw_form_` | 表单元数据、动态宽表、控件库 | sw-biz-form |
| `sw_bpm_` | 自建流程业务表、外部数据源执行审计表（含 `sw_bpm_ext_` 外部数据源于域） | sw-bpm |
| `sw_openapi_` | 应用、密钥、调用日志 | sw-biz-openapi |
| `sw_job_` | 任务定义、调度日志 | sw-basic-job |
| `sw_notify_` | 站内信、模板、发送记录 | sw-basic-notify |
| `sw_storage_` | 文件元数据 | sw-basic-storage |
| `sw_iot_` | 设备、产品、属性、上下行记录 | sw-basic-iot |
| `sw_knowledge_` | 知识库、文档、向量元数据 | sw-basic-knowledge |
| `sw_agent_` | 会话、消息、工具调用 | sw-basic-agent |
| `ACT_*` | Flowable 引擎自带表 | 框架自有，原样保留 |

❌ **禁止自创前缀。** 新表前缀必须落在上表枚举内。

### 3.6 低代码表单存储模型（架构要点）

- **动态宽表**：一个表单 = 一张物理表 `sw_form_{nanoId}`，一行 = 一次提交。不用单 JSON 列，不用 EAV。
- **子表**：`sw_form_table_{nanoId}`（TABLE 关系内嵌明细行）
- **元数据表**：`sw_form_config`（全表单共用一张，form_id + table_name 唯一 key + 样式 definition jsonb）、`sw_form_snapshot`（form_id + version + definition jsonb）
- **动态宽表系统列**：`id` / `tenant_id` / `deleted` / 审计列 / `version` /（子表）`parent_record_id`
- **关系原语两档**：TABLE（CASCADE 删除，独占）vs REFERENCE（RESTRICT 删除，可多表引用）
- **草稿→发布**：草稿态只动元数据，物理表零接触；发布 = 校验名 → 建表/加列 → 冻结（表名/字段名永久不可改）
- **动态宽表不归 Flyway 管**（唯一显式例外）；固定元数据表归 Flyway

### 3.7 定时任务架构

- Quartz 单节点（RAMJobStore），预留集群升级接缝
- 任务类型：`BEAN`（bean_name + params）/ `FLOW`（flow_def_key + form_data，定时发起流程）
- FLOW 任务必须走与手动表单提交**相同的校验路径**
- job 不依赖 bpm 的 `-biz`：到点发领域事件，bpm 监听并复用同一流程发起入口

---

## 4. 前端架构

### 4.1 技术选型与理由

- **框架：Vue 3 + TypeScript(strict)**。低代码 OA 工作流场景下，Vue 在三块"硬骨头设计器"里占两块：表单设计器（form-create/VForm 系，OA 实战多）、BPMN（bpmn-js 框架无关 + Vue 封装多）；唯一偏 React 的是 AI 调度图（React Flow），用 Vue Flow 兜。
- **不继承 vben 等框架做基座**。继承大框架本身就是"改小需求像挖地基"的风险源。改为**精简、自有、可完全掌控**的 Vite 单应用。
- **不上 monorepo**。前端无后端那种微服务抽取诉求；模块隔离用目录结构 + ESLint 导入边界实现。
- **核心库**：Vite / Vue Router 5 / Pinia / Element Plus（按需自动导入）/ vue-i18n / axios（封装）/ openapi-typescript（从后端 Swagger 生成类型）/ dompurify / expr-eval-fork（受限求值）/ ESLint flat + Prettier / Vitest。

### 4.2 分层结构

```
contracts/       — 稳定类型契约（FormSchema、common、api-types）
foundation/      — 运行时横切基础设施（均为目录）
  ├─ request/    — 唯一 axios client（token 注入/错误归一/取消）
  ├─ auth/       — token 管理（token.ts 内存态）、login/refresh/logout、useAuth
  ├─ permission/ — v-perm 指令、hasPerm/hasRole
  ├─ dict/       — useDict、DictTag、code→value adapter
  ├─ session/    — loadSession() seam
  ├─ menu/       — loadMenu() seam + buildRoutesFromMenu()
  └─ mock/       — MSW handlers/seeds（dev:mock 模式，生产 tree-shake 移除）
security/        — 安全层（sanitize/SafeHtml、safe-eval、csp）
adapters/        — 易变第三方库防腐层（form-designer/bpmn/flow-graph）
modules/         — 业务模块（form/system/workflow/notify/agent/iot/openapi）
components/      — 全局组件（页型模板/DynamicField）
layouts/         — 布局壳（BasicLayout：侧边栏+顶栏+router-view）
router/          — 常量路由 + 动态路由守卫（四步守卫/404-last/glob 白名单）
stores/          — Pinia 状态管理（user/menu/app）
views/           — 静态页面（Login/Error）
styles/          — CSS 设计 token（--sw-* 变量）
locales/         — 国际化（zh-CN）
```

### 4.3 强制边界（ESLint 硬约束）

- 业务模块禁止直引：`axios`、`dompurify`、`expr-eval-fork`、`form-create`、`bpmn-js`、`@vue-flow/*`
- 模块间禁止横向 import（`modules/A` → `modules/B`）
- `v-html` 仅允许在 `security/SafeHtml.vue`
- `eval` / `new Function` 全局禁止
- Element Plus 经按需自动导入，业务模块不出现 `element-plus` 显式 import

### 4.4 架构原则

- **防腐层**：易变/危险第三方（form-create、bpmn-js、vue-flow、axios、dompurify、求值器）一律套自有薄接口，原生 API 不得泄漏到业务层。
- **横切先行**：多租户、请求层、权限、字典、安全基线在业务之前就位。
- **单一请求层**：业务层禁止直引 axios，全部走 `foundation/request`。
- **单一数据源**：同一份数据多消费者时只取一次（典型：菜单 → 路由 + 侧边栏）。
- **前端权限仅 UX，真鉴权在后端**。按钮隐藏 ≠ 接口受保护。
- **契约先行 + 前后端并行**：前端不等后端就绪，拿契约和 mock 推页面；后端 seam 点亮后零改动接真数据。

### 4.5 安全基线

- **CSP**：`script-src` 严格（禁 unsafe-inline / unsafe-eval）；`style-src` 放开 `'unsafe-inline'`（Element Plus 弹层定位的必要代价）
- **禁 `eval`/`new Function`**：表达式求值只走 `security/safe-eval`（供 M03 公式 / M04 条件预览，入库与分支判定后端重算）
- **token 不落 storage**：access token 仅内存，全仓库无 localStorage/sessionStorage 写 token
- **v-html 唯一出口**：用户产生的 HTML 必经 `sanitizeHtml`/`<SafeHtml>`
- **open-redirect 防护**：LoginPage/ErrorPage 对 `redirect` 参数做同源校验
- 安全不变量有常驻回归测试兜底

---

## 5. 模块完成度总览

| 模块 | 后端 | 前端 | 说明 |
|------|------|------|------|
| 认证/安全 | ✅ 完成 | ✅ 已联通 | 登录/JWT/动态路由/CSP/sanitize |
| 系统管理 (RBAC/字典) | ✅ 核心就位 | ✅ CRUD + DictSelect/DictTag | 用户/角色/菜单/部门/字典 |
| 表单引擎 | ✅ 已封版 | ✅ 设计器 + 渲染器 | 8 字段类型 + 动态宽表 + REFERENCE 选择器 |
| BPM/工作流 | 🟦 已交付子能力 | ✅ 已联通 | BPMN 转换/待办/审批；P57 统一节点扩展、P58 选人/会签/分支/抄送/通知已交付；转办/委托/加签/个人查询等缺口开放 |
| 通知 | ✅ 基础完成 | ✅ 已落地 | 站内信收发/模板/批量发送（M05 全✅）；通知 SPI 与隔离 Adapter 已验收（P58），厂商渠道未接入 |
| AI Agent | 🟦 已交付子能力 | ✅ 已联通 | M07 多轮交付：模型管理/图编排/调试/工具调用/会话管理已 COMPLETED；助手配置/对话窗口/知识库 RAG 未做 |
| IoT | 🟦 已交付子能力 | ✅ 部分 | minimal-business-closure 已交付腾讯 IoT 最小接入（命令队列/状态回调/审批驱动）；真实账号联调/原生 MQTT/完整设备管理开放 |
| 知识库 | ⬜ 骨架 | N/A | AutoConfiguration 占位；RAG 未立项（P19） |
| OpenAPI | ⬜ 骨架 | 🔲 占位 | 仅 package-info（api/biz 各 1）；路由/菜单已注册 |
| 存储 (Storage) | ✅ 完整 | N/A | CONFIRMED 2026-07-22：-api/-biz 拆分 + 4 提供商 + Service/Controller/测试，storage-multi-provider 已 COMPLETED |
| 定时任务 (Job) | ✅ 完整 | N/A | CONFIRMED 2026-07-22：-api/-biz 拆分 + Quartz 集成 + Controller/Facade/测试 + Flyway V17，job-scheduler 已 COMPLETED |

> 注：本表为粗粒度总览。**逐模块权威完成度与文件数以 `knowledge/current-status.md` 与 `knowledge/feature-reconciliation-index.md` 为准**（2026-09-04 知识库全量整理同步刷新；BPM/Agent/IoT 按已交付子能力描述，不将模块整体写完成）。

---

## 6. 功能模块地图（M01–M10）

| # | 模块 | 功能/明细 | 落地模块 | 成熟度 |
|---|---|---|---|---|
| 01 | 组织架构 | 5 / 13 | `sw-biz-system` | 需求明确 |
| 02 | 权限控制 | 6 / 7 | `sw-biz-system + sw-security` | 需求明确（部分已建读路径） |
| 03 | 低代码表单 | 6 / 8 | `sw-biz-form` | 规则锁定，主线开发中 |
| 04 | 流程引擎 | 8 / 10 | `sw-bpm`（依赖 form） | 需求明确 |
| 05 | 站内信 | 2 / 4 | `sw-basic-notify` | 需求明确 |
| 06 | 系统通知 | 4 / 4 | `sw-basic-notify` | 需求明确 |
| 07 | AI 智能助手 | 4 / 14 | `sw-basic-agent + sw-basic-knowledge` | ⚠ 需求级，待细化 |
| 08 | IoT | 5 / 13 | `sw-basic-iot` | ⚠ 腾讯接入路径待补全 |
| 09 | 开放接口 | 7 / 8 | `sw-biz-openapi` | ⚠ 需求级，排在最后 |
| 10 | 系统运维 | 8 / 9 | `sw-biz-system + sw-basic(storage/job)` | 需求明确 |
| — | **合计** | **55 / 90** | — | — |

完整功能明细见 `Smart-WorkFlow-Server/功能清单.md`（10 模块、**55** 功能、**90** 明细，含 Mxx-Fyy-zz ID 体系；2026-09-04 知识库全量整理复核确认，M04 为 8/10）。逐项状态与映射以 `knowledge/feature-reconciliation-index.md` 为准。

---

## 7. 实施路线

### 7.1 串行关键路径（Walking Skeleton）

```
组织/权限(M01·M02) → 低代码表单(M03) → 流程引擎(M04) → 通知(M05·M06)
```

里程碑：`登录 → 简单表单 → 单节点审批 → 通知` 端到端跑通。

### 7.2 并行轨道（关键路径稳定后）

`AI 助手(M07)` · `IoT(M08)` · `开放接口(M09)`

### 7.3 当前焦点

Walking Skeleton 四环已全部闭合 ✅。正式业务功能已确认 **41 个**（P58 为第 41 个，2026-09-04 已确认）：早期批处理（system-mgmt-crud、bpm-task-center、storage-multi-provider、job-scheduler、kb-verification 等）直至 P52—P58 系列均已闭环；完整清单见 `knowledge/current-status.md` 与 `knowledge/feature-reconciliation-index.md`。（更新 2026-09-04 知识库全量整理同步）

当前活动任务：`knowledge-full-reconciliation`（知识库全量整理与同步，VERIFYING），非业务功能。

工作区自身的元架构（规划层/执行层三方角色边界、规划层内部探索模型/规划模型分工、`product/`+`todo/`+`knowledge/` 的原始记忆/压缩记忆分层）已固化为 `system.md` §0.3/§0.4/§11.2、`roles/planner.md` §4（规划写入范围）/§8（记忆分层）与 `shared-constraints.md` §9 的硬约束，本文件只覆盖 Smart-WorkFlow **产品系统**架构，不重复记录工作区元架构。

---

## 8. 开发哲学：Walking Skeleton

优先打通一条端到端的薄切片，而非任一模块的横向铺满。

**横切先行原则**：多租户、BaseEntity、数据权限、Security 过滤链、字典服务等跨切面基础设施必须先于业务代码就位。

---

## 9. 技术栈速览

### 后端核心技术

| 类别 | 技术 |
|------|------|
| 语言 | Java 21 LTS |
| 框架 | Spring Boot 3.4.4 |
| ORM | MyBatis-Plus 3.5.9 |
| 流程引擎 | Flowable 7.1.0 |
| 数据库迁移 | Flyway（PostgreSQL + H2 双方言） |
| 数据库 | PostgreSQL（生产）/ H2（开发） |
| 多数据源 | dynamic-datasource-spring-boot3-starter |
| SQL 解析 | jsqlparser |
| 认证鉴权 | JWT + Spring Security |
| AI Agent | Spring AI + LangGraph4j |
| 定时任务 | Quartz（单节点 RAMJobStore） |
| 缓存 | Redis |
| IoT | Spring Integration MQTT + Paho v5 |
| 对象存储 | MinIO |
| 文档解析 | Apache Tika + PDFBox + Jsoup |
| 向量检索 | pgvector |
| JSON | Jackson（出入参） + fastjson2（业务内部） |
| HTTP（业务侧） | hutool HttpRequest |
| 工具 | Hutool · MapStruct · Lombok |
| API 文档 | Springdoc OpenAPI |
| 监控 | Micrometer Tracing + OpenTelemetry |

### 前端核心技术

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3.5 + TypeScript 6.0 |
| 构建 | Vite 8 |
| UI 组件库 | Element Plus 2.14 |
| 状态管理 | Pinia 3 |
| 路由 | Vue Router 5 |
| 国际化 | Vue I18n 11 |
| 安全过滤 | DOMPurify + expr-eval-fork |
| 表单设计器 | @form-create/designer 3.5 |
| 流程设计器 | bpmn-js 18（已集成：bpmn-adapter BPMN 查看器防腐层；设计器/Modeler 不在范围内） |
| 流程图 | @vue-flow/core 1.48（已集成：vue-flow-adapter） |
| 测试 | Vitest 4 + @vue/test-utils |
| 代码规范 | ESLint 10 + Prettier 3 |
| API 类型生成 | openapi-typescript 7 |
