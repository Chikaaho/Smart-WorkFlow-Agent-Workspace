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
| 数据库 | PostgreSQL（生产）/ H2（开发），Flyway 管理 schema，V1–V15（已确认：V12、V14 不存在，最新为 V13 → V15 跳号） |
| 核心路径 | Walking Skeleton：登录 → 表单 → 审批 → 通知 ✅ 四环全部闭合 |
| 功能清单 | 10 模块，54 功能，88 明细（`Smart-WorkFlow/功能清单.md` 为权威清单，但状态标记与实际脱节 — 已知问题 I1） |
| 测试基线 | 后端：136 tests / 7 modules ✅（CONFIRMED 2026-07-16）；前端：46 spec files / 392 tests ✅（F1+F2+F3 新增 20 files / 40 tests，CONFIRMED 2026-07-16），四连校验门可用 |
| 前次验证 | 2026-07-15 独立验证：后端 BUILD SUCCESS · 前端四连全绿 |

---

## 2. 模块完成度

### 2.1 后端

| 模块 | 状态 | 证据 | 规模 |
|------|------|------|------|
| sw-common | ✅ 完整 | CONFIRMED | 30 个 Java 文件 — 公共基础设施 |
| sw-security | ✅ 完整 | CONFIRMED | 20 个 Java 文件 — 认证鉴权全链路 |
| sw-biz-system | ✅ 核心就位 | CONFIRMED | 37 个 Java 文件 — 用户/角色/菜单/部门/字典 CRUD |
| sw-biz-form | ✅ 已封版 | CONFIRMED | 40 个 Java 文件 + 6 个测试类 — 动态宽表引擎，8 字段类型 + TABLE/REFERENCE 两档关系 |
| sw-bpm | 🟦 开发中 | CONFIRMED | 58 个 Java 文件 — BPMN 转换/待办/审批/Flowable 集成（含 api/engine/process 子模块） |
| sw-basic-notify | ✅ 基础完成 | CONFIRMED | Facade + Controller + Mapper + 测试 + Flyway 建表 |
| sw-basic-storage | 🟦 模块拆分完成 | CONFIRMED | B1 验收通过：-api/-biz 拆分，sw_storage_file 表，多提供商配置绑定，V16 Flyway 就绪 |
| sw-basic-job | 🟦 开发中 | CONFIRMED | B1-B4 全部完成：模块拆分/API-BIZ/Quartz 集成/Controller+Facade/测试 37 用例 |
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
| IoT | 🔲 占位 | CONFIRMED | 路由/菜单已注册，无业务页面 |
| Agent | 🔲 占位 | CONFIRMED | 路由/菜单已注册，无业务页面 |
| OpenAPI | 🔲 占位 | CONFIRMED | 路由/菜单已注册，无业务页面 |
| BPMN 集成 | 📦 依赖就绪 | CONFIRMED | bpmn-js 18 已安装，adapter 未实现（接口壳，`throw new Error('not implemented')`） |
| Vue Flow | 📦 依赖就绪 | CONFIRMED | @vue-flow/core 1.48 已安装，adapter 未实现（接口壳） |

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

---

## 4. 进行中的功能

> 最后更新：2026-07-21

| 功能编号 | 功能名称 | 当前状态 | 当前 Step | 说明 |
|----------|----------|:--------:|:---------:|------|
| job-scheduler | 定时任务调度模块 | **IN_PROGRESS** | F1 READY | Step B1 ✅ B2 ✅ B3 ✅ B4 ✅后端全部完成（37 测试用例 + 全量 406 回归通过）。F1 方案已生成，待执行。 |

---

## 5. 已完成的功能

> 最后更新：2026-07-20

| 功能编号 | 功能名称 | 最终状态 | 完成日期 | 说明 |
|----------|----------|:--------:|:--------:|------|
| storage-multi-provider | 多向可配置文件存储 | **COMPLETED** ✅ | 2026-07-20 | 7 Steps（B1~F3）全部通过：后端模块拆分 + 4 存储提供商实现 + Service/Controller/测试 + 前端 Types/API/视图/Mock/路由闭环 |
| bpm-task-center | BPM 待办中心增强 | **COMPLETED** ✅ | 2026-07-19 | 6 Steps（B1~F3）全部通过：后端 15 文件 + 前端 9 文件，后端 308 tests / 前端 48 files / 417 tests |
| M04-F01-01 | BPM 单节点审批前后端联通 | **COMPLETED** ✅ | 2026-07-15 | Walking Skeleton 第三环：待办列表 + 审批通过 + 流程定义列表全部实现并通过验收 |
| M02-F01-01 | 通知模块前端落地 | **COMPLETED** ✅ | 2026-07-15 | Walking Skeleton 最终环：通知列表页 + 标记已读交互，前端 352 tests ✅ |
| sys-mgmt-crud | 系统管理核心 CRUD 做宽闭环 | **COMPLETED** ✅ | 2026-07-16 | 6 Steps 全部通过：后端 16 文件 + 前端 22 文件，46 spec files / 392 tests 全绿 |

---

## 6. Walking Skeleton 状态 🎉

```
登录/认证 ✅ → 表单设计/渲染 ✅ → BPM 单节点审批 ✅ → 通知列表 ✅
```

**四环全部闭合。** Walking Skeleton 里程碑达成。

---

## 7. 已知 Seam（接缝）

以下端点/能力前端已预留但后端尚未就绪：

| Seam | 位置 | 影响 |
|------|------|------|
| `POST /auth/refresh` | foundation/auth | 刷新需重登录（已知限制，非 bug） |
| `POST /auth/logout` | foundation/auth | 仅清本地态 |
| `GET /auth/info` (getInfo) | foundation/session | 返回占位会话（以登录 username 兜底） |
| 菜单树端点 | foundation/menu | 使用本地占位载荷（含嵌套，两级） |
| 权限装配 | foundation/permission | 占位权限集，暗态 gating 放行 |
| BPMN adapter | adapters/bpmn | 接口壳，未实现 |
| Vue Flow adapter | adapters/flow-graph | 接口壳，未实现 |
| 多页签 | layouts/BasicLayout | 占位，未实现 |

---

## 8. 下一优先事项

Walking Skeleton 已完整打通。系统管理 CRUD 已完整闭环。BPM 待办中心增强已全部完成。**storage-multi-provider（多向可配置文件存储）已于 2026-07-20 闭环**。

当前进行中：**job-scheduler（定时任务调度模块）** — Step B1 方案已生成。

后续候选：

1. **I1 功能清单同步** — 更新 `功能清单.md` 与实际代码进度一致
2. **BPMN adapter 实现** — 流程设计器可视化集成
3. **后端 seam 点亮** — `getInfo`/菜单接口/权限装配/`/auth/refresh`/`/auth/logout`

---

## 9. 测试基线

| 项目 | 校验命令 | 当前状态 |
|------|----------|----------|
| 后端 | `mvn -q compile && mvn -q test` | CONFIRMED：2026-07-21 B4 验收 — 全量 406 tests 通过，BUILD SUCCESS |
| 前端 | `pnpm typecheck && pnpm lint && pnpm test && pnpm build` | CONFIRMED：2026-07-20 storage F3 验收 — 50 files / 438 tests 全通过（F2 基线一致，零退化），lint 零告警，typecheck+build 全绿 |

### 前端测试覆盖详情（CONFIRMED，2026-07-15）

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
- `refresh`/`logout`/`getInfo`/菜单接口/权限装配 的真实实现（待后端）
- 各业务模块真实内容与真实接口（login/dict 之外）
- BPMN 流程设计器可视化、Vue Flow 流程图可视化
- RICH_TEXT 富文本编辑器集成
- 集群部署（定时任务暂为单节点 RAMJobStore）
- 表单/应用/流程的跨环境导入导出

---

## 11. 参考文档索引

| 文档 | 位置 | 来源 |
|------|------|------|
| 后端工程宪法 | `Smart-WorkFlow/.claude/CLAUDE.md` | `SmartWorkFlow_files.zip` → `CLAUDE-java.md` |
| 前端工作宪法 | `Smart-WorkFlow-Web/.claude/CLAUDE.md` | `SmartWorkFlow_files.zip` → `CLAUDE-vue.md` |
| 功能清单（54 功能/88 明细） | `Smart-WorkFlow/功能清单.md` | `SmartWorkFlow_files.zip` → `功能清单.md` |
| 产品需求文档（PRD） | `SmartWorkFlow_files.zip` → `Smart-WorkFlow-PRD.md` | 需求基线 |
| 前端架构与现状知识库 | `SmartWorkFlow_files.zip` → `Smart-WorkFlow-前端架构与现状-知识库.md` | 前端单一现状源 |
| 页型规范（设计系统可视化） | `SmartWorkFlow_files.zip` → `Smart-WorkFlow 页型规范.html` | 两页型像素级原型 |

> 以上文件均来自 2026-07-16 的 `SmartWorkFlow_files.zip`。zip 中 `CLAUDE-java.md` / `CLAUDE-vue.md` 为最新版本工程宪法，如与子项目 `.claude/CLAUDE.md` 存在差异，以 zip 版本为准并应同步更新子项目文件。
