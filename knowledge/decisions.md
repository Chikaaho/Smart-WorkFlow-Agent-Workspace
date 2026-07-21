# 重要设计决策记录

> 工作区统一知识库 — 关键设计决策日志。
> 记录所有"定错即爆"的架构决策、技术选型和设计选择。
> 每条决策必须包含：时间、决策内容、原因、替代方案、影响范围。
>
> 可信度：CONFIRMED = 已落地执行 · SUPERSEDED = 已被后续决策替代

---

## 决策索引

| # | 日期 | 决策 | 状态 |
|---|------|------|------|
| D1 | — | 模块化单体 + -api/-biz 拆分 | CONFIRMED |
| D2 | — | 动态宽表：一表单一物理表 | CONFIRMED |
| D3 | — | TABLE / REFERENCE 两档关系原语 | CONFIRMED |
| D4 | — | Flyway 双方言（PG + H2） | CONFIRMED |
| D5 | — | 前端契约先行 + Mock 并行 | CONFIRMED |
| D6 | — | Token 仅内存 · superAdmin=boolean | CONFIRMED |
| D7 | — | form-create 防腐层（adapters/） | CONFIRMED |
| D8 | — | lowcode → form 重命名 | CONFIRMED |
| D9 | — | Open-core BPM（engine 闭源） | CONFIRMED |
| D10 | — | 根目录规划代理机制 | CONFIRMED |
| D11 | 2026-07-15 | Element Plus 全量 CSS 导入 | CONFIRMED |
| D12 | 2026-07-15 | 通知模块前端落地设计 | CONFIRMED |
| D13 | 项目初期 | 前端不继承 vben、不上 monorepo | CONFIRMED |
| D14 | 项目初期 | 设计系统单源 + 全局 token + 两页型模板 | CONFIRMED |
| D15 | 项目初期 | 配置接缝层（form/utils 纯函数预留） | CONFIRMED |
| D16 | 2026-06-30 | 产品原则优先级排序 | CONFIRMED |
| D17 | 项目初期 | 前端安全不变量常驻回归测试 | CONFIRMED |
| D18 | 项目初期 | Walking Skeleton 端到端薄切片策略 | CONFIRMED |
| D19 | 2026-07-19 | 存储模块策略模式 + -api/-biz 拆分 | CONFIRMED |
| D20 | 2026-07-19 | YAML 配置 v1 + 动态配置延后 | CONFIRMED |
| D21 | 2026-07-20 | Mock 模式不处理文件下载 | CONFIRMED |
| D22 | 2026-07-20 | Job Entity 放 -biz 模块（非 -api） | CONFIRMED |
| D23 | 2026-07-20 | Quartz 版本由 Spring Boot BOM 管理 | CONFIRMED |
| D24 | 2026-07-20 | Flyway V17 先建两张表（job_info + job_log） | CONFIRMED |
| D25 | 2026-07-21 | JobFacade 返回 DTO（非 Entity）以遵守模块边界 | CONFIRMED |

---

## 决策详情

### D1：模块化单体 + -api/-biz 拆分

- **日期**：项目初期
- **决策**：采用模块化单体架构，每个业务模块拆分为 `-api`（契约/DTO/SPI）和 `-biz`（实现）
- **原因**：当前阶段不需要微服务的运维复杂性，但通过接口分离为未来微服务抽取预留最小重构路径
- **替代方案**：纯单体（不拆 -api/-biz）— 拒绝，因为未来抽取成本高
- **影响**：依赖方向严格自上而下；业务模块间禁止依赖 `-biz`
- **相关文件**：`Smart-WorkFlow/.claude/CLAUDE.md` §1

### D2：动态宽表：一表单一物理表

- **日期**：表单引擎设计阶段
- **决策**：表单提交数据采用动态宽表，每个表单创建一张物理表（`sw_form_{nanoId}`），一行为一次提交
- **原因**：支持原生 SQL 查询/报表/导出/索引/流程取值，能力上限最高；不用 JSON 列或 EAV
- **替代方案**：JSONB 单列 — 拒绝，查询/索引能力受限；EAV — 拒绝，性能和维护性差
- **影响**：裸 SQL 必须手写 `deleted` + `tenant_id`；动态宽表不归 Flyway 管
- **相关文件**：`Smart-WorkFlow/.claude/CLAUDE.md` §4

### D3：TABLE / REFERENCE 两档关系原语

- **日期**：表单引擎设计阶段
- **决策**：统一"宽表 + 外键"底层原语，仅按行为分 TABLE（CASCADE 删除）和 REFERENCE（RESTRICT 删除）
- **原因**：不引入额外的关系类型枚举，底层建表逻辑完全一致，差异只在删除/渲染/命名
- **影响**：删除语义必须严格遵守 CASCADE/RESTRICT 规则
- **相关文件**：`knowledge/shared-constraints.md` §2.3, §3.1

### D4：Flyway 双方言（PG + H2）

- **日期**：项目初期
- **决策**：所有 Flyway 迁移脚本同时维护 PostgreSQL 和 H2 两个版本
- **原因**：开发期用 H2 作为 SQL 正确性代理，生产用 PostgreSQL；避免"开发能跑、生产炸"的问题
- **影响**：每条迁移必须写两份；动态宽表是唯一例外（运行时 DDL）
- **相关文件**：`Smart-WorkFlow/.claude/CLAUDE.md` §6

### D5：前端契约先行 + Mock 并行

- **日期**：前端项目初期
- **决策**：前端不等后端就绪，拿契约和 mock 把页面/交互全推起来，后端 seam 点亮后零改动接真数据
- **原因**：前后端并行开发，最大化开发效率
- **影响**：需要维护 MSW mock 数据；seam 标注 `// TODO(skeleton)`
- **相关文件**：`Smart-WorkFlow-Web/.claude/CLAUDE.md` §3

### D6：Token 仅内存 · superAdmin=boolean

- **日期**：安全设计阶段
- **决策**：Token 仅存内存（不落 localStorage/sessionStorage）；超管判断用 `userId==1` 布尔值而非通配权限串
- **原因**：减少 XSS 泄露面；与后端授权模型对齐
- **影响**：刷新需重登录（refresh seam 未实现）；前端 `v-perm` 在权限空集时放行（暗态 gating）
- **相关文件**：`knowledge/shared-constraints.md` §1.1, §1.2

### D7：form-create 防腐层（adapters/）

- **日期**：表单设计器集成阶段
- **决策**：form-create 原生 schema 不泄漏到 `modules/`，通过 `adapters/form-designer/` 隔离
- **原因**：第三方库 API 不稳定，隔离后升级/替换成本低
- **影响**：ESLint 强制模块边界；增加一层薄接口转换
- **相关文件**：`Smart-WorkFlow-Web/.claude/CLAUDE.md` §4.1

### D8：lowcode → form 重命名

- **日期**：2025 年（具体日期见 Git 历史）
- **决策**：`sw-biz-lowcode` 整体重命名为 `sw-biz-form`（模块、包名、配置、表前缀、前端目录全部对齐到 form）
- **原因**：`lowcode` 命名过于泛化，`form` 更精确反映模块职责
- **替代方案**：保留 lowcode — 拒绝
- **影响**：全局搜索 `lowcode` 应零命中；新建文件不得复活 lowcode 命名
- **状态**：CONFIRMED（已完成）
- **相关文件**：`Smart-WorkFlow/.claude/CLAUDE.md` 附录 A；`Smart-WorkFlow-Web/.claude/CLAUDE.md` §7.2

### D9：Open-core BPM（engine 闭源）

- **日期**：BPM 模块设计阶段
- **决策**：`sw-bpm-engine` 为闭源防腐层，承载引擎运行期与外部数据源执行；`sw-bpm-api` 和 `sw-bpm-process` 开源
- **原因**：核心引擎逻辑需商业保护；契约和流程业务可开源促进生态
- **影响**：engine 模块不在公开仓库
- **相关文件**：`Smart-WorkFlow/README.md`

### D10：根目录规划代理机制

- **日期**：2026-07-13
- **决策**：工作区根目录的 Claude Code 定义为**规划代理**，只负责分析/规划/拆解/验收/记录/交接，不直接执行子项目业务代码
- **原因**：
  - 分离规划与执行关注点，避免规划代理"顺手写代码"导致的设计偏差
  - 通过 Step 方案 + 回执 + 验收的闭环机制确保执行质量
  - 通过知识库实时更新和跨会话交接机制确保长期项目记忆不丢失
- **替代方案**：通用代理（规划+执行合一）— 拒绝，因为缺乏权限边界和质量闭环
- **影响**：根目录代理写入权限仅限于 `CLAUDE.md` 和 `knowledge/`；所有业务代码修改必须通过下级执行代理完成并提交回执
- **相关文件**：`CLAUDE.md`、`knowledge/current-status.md`、`knowledge/session-handoff.md`

### D11：Element Plus 全量 CSS 导入

- **日期**：2026-07-15
- **决策**：在 `main.ts` 中全局导入 `element-plus/dist/index.css`，包裹品牌色 token 覆盖层
- **原因**：`ElementPlusResolver({ importStyle: 'css' })` 只导入被按需检测到的组件自身的 CSS，不导入 transitive CSS 依赖（如 `ElMessageBox.confirm()` 依赖 `ElOverlay` 的遮罩层定位样式），导致 API 调用组件渲染为无样式的页面底部 div。全局 CSS 导入确保所有 Element Plus 组件（含 API 调用创建的）样式正确。
- **替代方案**：逐组件显式导入 transitive CSS（如 `import 'element-plus/es/components/overlay/style/css'`）— 拒绝，因为维护成本高，需追踪每个 API 组件的依赖树；且按需 CSS 的 tree-shaking 优势在 API 组件场景下无法利用。
- **影响**：
  - 构建产物增加 Element Plus 全量 CSS（~358 kB / ~48 kB gzip）
  - `tokens.css` 品牌色覆盖在 `index.css` 之后导入，色值统一不受影响
  - 后续所有 Element Plus API 调用组件（ElMessage、ElNotification 等）自动获得正确样式
- **替代方案**：保留纯按需 CSS — 拒绝，ElMessageBox 无法正常渲染
- **状态**：CONFIRMED（已落地）
- **相关文件**：`Smart-WorkFlow-Web/src/main.ts`

### D12：通知模块前端落地设计

- **日期**：2026-07-15
- **决策**：
  - 直接替换 `NotifyHome.vue` 内容（不新建 `NotifyList.vue`），通知模块只有单页面
  - 使用 el-table（StandardListTemplate 页型 B）展示通知列表，与 TodoList/ProcessDefList 一致
  - bizType 内联映射：WF_TODO→流程待办(warning) / WF_APPROVED→审批结果(success)
  - 列表不分页：后端返回平铺数组，前端 `pageSize=9999` + CSS 隐藏分页组件
  - 标记已读使用替换数组项方式触发响应式更新（`list.value.map(...)` 而非直接修改 `row.read`）
  - 防重复点击锁（`readingId` 前置检查）
- **原因**：
  - 单页面无需额外文件，保持简洁
  - 表格布局与已有页面模式一致，降低维护成本
  - 后端无字典配置，直接硬编码映射
  - 后端设计典型用户少于 100 条，无需真分页
  - el-table slot scope 中的 row 可能不是响应式代理，直接修改 `row.read` 可能不触发视图更新
- **替代方案**：新建 NotifyList.vue — 拒绝，单页面无意义增加文件数
- **影响**：通知模块前端全部就位，Walking Skeleton 四环闭环
- **相关文件**：`Smart-WorkFlow-Web/src/modules/notify/views/NotifyHome.vue`、`Smart-WorkFlow-Web/src/contracts/notify.ts`

### D13：前端不继承 vben、不上 monorepo

- **日期**：项目初期
- **决策**：
  - 不继承 vben、yudao-ui-admin-vue3 等框架做基座，改为精简、自有、可完全掌控的 Vite 单应用
  - 不上 monorepo，模块隔离用目录结构 + ESLint 导入边界实现
- **原因**：
  - 继承大框架本身就是"改小需求像挖地基"的风险源（大版本互不兼容，被迫迁移 = 挖地基）
  - 前端无后端那种微服务抽取诉求，目录提包是机械操作
  - 与后端"未 fork RuoYi、自建 sw-* 深思熟虑分层"同源
- **替代方案**：继承 vben — 拒绝（长期维护风险高）；monorepo — 拒绝（过度设计）
- **影响**：vben、yudao-ui-admin-vue3 仅作参考实现读/借，不进依赖
- **相关文件**：`Smart-WorkFlow-Web/.claude/CLAUDE.md` §0；`Smart-WorkFlow-前端架构与现状-知识库.md` §1

### D14：设计系统单源 + 全局 token + 两页型模板

- **日期**：项目初期
- **决策**：
  - 所有视觉值（颜色/字号/间距/圆角/阴影）统一为 CSS 变量 `--sw-*`，禁止逐页硬编码
  - 品牌主色唯一源：紫莓 `#7e306b`（7 级色阶）
  - 90% 页面归为两大页型：页型 A（表单填写/渲染页）+ 页型 B（数据列表页）
  - 两页型先沉淀为可复用组件（`StandardFormTemplate` / `StandardListTemplate`），再铺模块
- **原因**：确保视觉一致性，改一处全局跟随；减少重复代码
- **替代方案**：各页自行设计 — 拒绝（不一致、维护成本高）
- **影响**：所有模块页必须引用全局 token；新建页面优先匹配页型 A/B
- **相关文件**：`Smart-WorkFlow-Web/.claude/CLAUDE.md` §5-6；`knowledge/shared-constraints.md` §6-7

### D15：配置接缝层（form/utils 纯函数预留）

- **日期**：项目初期
- **决策**：凡「将来设计时可自定义」的取值逻辑（列表展示字段/可搜字段/字段排序/列宽/引用选择器展示列/引用显示字段…）一律收进 `modules/form/utils/` 下的可替换纯函数，带显式 TODO 接缝注释
- **原因**：设计器未就绪时用 definition 推导规则；将来设计器产出配置元数据时只换这层函数数据源，消费方零改
- **影响**：现有接缝函数：`deriveColumns` / `deriveFilterFields` / `deriveReferenceColumns` / `deriveDisplayField` / `deriveSearchFields` / `resolveReferenceDisplay`
- **相关文件**：`Smart-WorkFlow-Web/.claude/CLAUDE.md` §4.1

### D16：产品原则优先级排序

- **日期**：2026-06-30（PRD v0.1）
- **决策**：当多方案冲突时，按此排序权衡：**稳定性 > 可扩展性 > 可维护性 > 性能 > 开发成本**
- **原因**：企业级 OA 平台稳定性是底线；若以低优先级换高优先级，须在对应需求处显式标注权衡依据
- **影响**：所有架构决策和功能优先级排序以此为准则
- **相关文件**：`Smart-WorkFlow-PRD.md` §2.4

### D17：前端安全不变量常驻回归测试

- **日期**：项目初期
- **决策**：凡是「单一数据源」「导入边界」「接缝不串」这类不变量，都要有常驻回归测试钉死
- **原因**：防止后续改动悄悄破坏安全基线；已有的不变量（菜单单源、导入边界、token 不落 storage、redirect 同源、mock 不污染 modules）不允许在没有等价替代时删除
- **影响**：重构改名时同步改测试断言只换名、不弱化断言强度
- **相关文件**：`Smart-WorkFlow-Web/.claude/CLAUDE.md` §2.2；`Smart-WorkFlow-前端架构与现状-知识库.md` §4

### D18：Walking Skeleton 端到端薄切片策略

- **日期**：项目初期
- **决策**：优先打通一条端到端的薄切片（`登录 → 简单表单 → 单节点审批 → 通知`），而非任一模块的横向铺满；关系原语两档（TABLE + REFERENCE）各跑一条最小路径，验证 CASCADE 与 RESTRICT 两种删除语义
- **原因**：快速验证全链路技术可行性和架构决策；避免在单模块过度投入后发现集成问题
- **影响**：实施路线严格按串行关键路径排列；横切基础设施（多租户/BaseEntity/数据权限/Security/字典）必须先于业务代码就位
- **状态**：Walking Skeleton 四环已于 2026-07-15 全部闭合 ✅
- **相关文件**：`Smart-WorkFlow/.claude/CLAUDE.md` §12；`Smart-WorkFlow-PRD.md` §3.3、§7

### D19：存储模块策略模式 + -api/-biz 拆分

- **日期**：2026-07-19
- **决策**：
  - 存储提供商抽象为 `StorageProvider` 接口 + 4 种真实实现（Local/MinIO/COS/Qiniu）
  - `sw-basic-storage` 拆分为 `-api`（StorageFacade/StorageUploadResult/StorageFile Entity）和 `-biz`（StorageProvider/Service/Controller/配置）
  - 通过 `StorageProviderRegistry` 按 `type` 字符串定位提供商
- **原因**：
  - 策略模式使新增提供商零侵入，符合 OCP
  - `-api/-biz` 拆分遵循 sw-basic-notify 模式，为未来微服务抽取预留
  - Registry + `@ComponentScan` 自动注册，无需手动管理提供商列表
- **替代方案**：单实现 + if-else — 拒绝，违反 OCP，新增提供商需要修改核心逻辑
- **影响**：新增存储提供商只需实现 `StorageProvider` 接口 + 注册 Spring Bean，无需修改业务层
- **相关文件**：`knowledge/features/storage-multi-provider.md`

### D20：YAML 配置 v1 + 动态配置延后

- **日期**：2026-07-19
- **决策**：存储提供商配置（端点/密钥/桶名）走 `application.yml`，启动时加载到 `StorageProperties`，不支持运行时动态切换
- **原因**：宽度优先策略，先让多提供商功能跑通；动态配置需要 `sw_storage_config` 表 + 管理界面，属于深度后续
- **替代方案**：`sw_storage_config` 表 + DB 动态配置 — 延后（深度后续）
- **影响**：切换/新增提供商需要重启应用 + 改 YAML；不支持运行时热切换
- **相关文件**：`knowledge/features/storage-multi-provider.md`

### D21：Mock 模式不处理文件下载

- **日期**：2026-07-20
- **决策**：前端 mock 系统不实现文件下载 mock handler。`downloadFile()` 使用原生 `fetch()`（二进制响应不兼容 `request<T>()` 的 ApiResponse 解包），而 mock 系统仅拦截 `foundation/request`（axios 封装层）
- **原因**：添加 download handler 不会被调用（mock 系统不拦截原生 fetch），属于死代码
- **替代方案**：改造 mock 系统拦截 fetch() — 超出当前功能范围
- **影响**：`pnpm dev:mock` 模式下点击下载 → `ElMessage.error('下载失败')`（预期行为）。真实下载需在 `pnpm dev`（直连后端）模式下验证
- **相关文件**：`Smart-WorkFlow-Web/src/modules/storage/api/index.ts`（downloadFile 实现）、`Smart-WorkFlow-Web/src/foundation/mock/handlers.ts`（无 download handler）

### D22：Job Entity 放 -biz 模块（非 -api）

- **日期**：2026-07-20
- **决策**：`JobInfo` 和 `JobLog` Entity 放在 `sw-basic-job-biz` 模块，不在 `-api` 模块
- **原因**：-api 模块不依赖 MyBatis-Plus，Entity 需继承 `BaseEntity`（来自 MyBatis-Plus）。与 storage、notify 模块模式一致
- **替代方案**：Entity 放 -api — 拒绝，会让 -api 依赖 MyBatis-Plus，破坏模块边界
- **影响**：JobFacade 不能直接返回 Entity，需用 JobInfoDTO（见 D25）
- **相关文件**：`knowledge/features/job-scheduler.md`

### D23：Quartz 版本由 Spring Boot BOM 管理

- **日期**：2026-07-20
- **决策**：不在 `sw-dependencies/pom.xml` 中显式声明 Quartz 版本，由 `spring-boot-starter-quartz` 的 BOM 管理
- **原因**：避免版本冲突；Spring Boot 官方测试保证 Quartz 与 Spring 框架的兼容性
- **替代方案**：显式版本管理 — 拒绝，可能引入与 Spring 版本不兼容的 Quartz
- **影响**：升级 Spring Boot 版本时 Quartz 自动跟随升级
- **相关文件**：`knowledge/features/job-scheduler.md`

### D24：Flyway V17 先建两张表（job_info + job_log）

- **日期**：2026-07-20
- **决策**：V17 迁移脚本同时创建 `sw_job_info` 和 `sw_job_log` 两张表，不拆分版本
- **原因**：宽度优先策略；两张表是定时任务模块的最小核心表集合，一版建完减少 Flyway 版本数
- **替代方案**：分两版迁移 — 拒绝，增加不必要的版本管理复杂度
- **影响**：后续可能需要新增 `sw_job_config` 等配置表（新 Flyway 版本）
- **相关文件**：`knowledge/features/job-scheduler.md`

### D25：JobFacade 返回 DTO（非 Entity）

- **日期**：2026-07-21
- **决策**：`JobFacade` 接口返回 `JobInfoDTO` 而非 `JobInfo` Entity
- **原因**：-api 模块不可依赖 -biz 模块的 Entity（含 MyBatis-Plus 注解）。方案 B3 原设计返回 Entity，执行代理发现模块边界违规后新增 DTO 做契约隔离
- **替代方案**：在 -api 中定义 Entity — 拒绝（需 MyBatis-Plus 依赖）；放宽模块依赖规则 — 拒绝（破坏四层架构）
- **影响**：Controller 层需做 Entity ↔ DTO 转换；新增 `JobInfoDTO` 文件（17 字段）
- **关键教训**：方案设计时必须考虑 -api/-biz 模块边界约束
- **相关文件**：`Smart-WorkFlow/sw-basic-job/sw-basic-job-api/src/main/java/cn/reasonix/sw/basic/job/api/dto/JobInfoDTO.java`
