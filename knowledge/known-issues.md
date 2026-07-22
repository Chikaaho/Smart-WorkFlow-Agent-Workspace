# 已知问题和限制

> 工作区统一知识库 — 已知问题、技术债务和当前限制。
> 记录已发现但尚未解决的问题，供功能规划和风险评估参考。
>
> 可信度：CONFIRMED = 问题已复现确认 · REPORTED = 回执中报告 · ASSUMED = 推测

---

## 问题索引

| # | 发现日期 | 问题 | 严重程度 | 状态 |
|---|----------|------|:---:|:---:|
| I1 | — | 功能清单状态与代码实际进度脱节 | 中 | 未修复 |
| I2 | — | refresh token seam 未实现 | 低 | ✅ 已修复（2026-07-22：auth-seam-completion 7 Steps 全部 PASSED，/auth/refresh + /auth/logout 前后端闭环） |
| I3 | — | BPMN/Vue Flow adapter 未实现 | 中 | 待开发 |
| I4 | — | 前端多页签功能未实现 | 低 | 待开发 |
| I5 | — | 测试基线通过率未独立验证 | 中 | ✅ 已修复（2026-07-14 验证：后端 111 tests ✅，前端 331 tests ✅） |
| I6 | — | 间接依赖存在已知安全漏洞 | 低 | 已评估 |
| I7 | 2026-07-15 | 通知模块前端占位 | 中 | ✅ 已修复（通知列表页 + 标记已读交互已实现） |
| I8 | — | 定时任务集群升级路径预留但未实现 | 低 | 设计预留 |
| I22 | 2026-07-21 | @vueuse/core INVALID_ANNOTATION 警告（Rolldown v8 兼容性） | 极低 | 第三方依赖 |
| I23 | 2026-07-21 | 前端 CLAUDE.md §8 禁止 element-plus 显式 import，但实际代码中有 ElMessage/ElMessageBox import | 低 | 文档与代码不一致 |
| I9 | 2026-07-15 | Element Plus API 调用组件 CSS 自动导入不完整 | 低 | ✅ 已绕过（全量 CSS 导入） |
| I10 | 2026-06-30 | 动态宽表裸 SQL 隔离/软删手写易漏 | 高 | 已固化为红线，须测试兜底 |
| I11 | 2026-06-30 | 发布冻结不可逆 — 字段定义错误成本高 | 中 | 需在设计器层强校验 |
| I12 | 2026-06-30 | 定时任务单节点 — 集群化前 FLOW 幂等是关键防线 | 中 | 已预留升级接缝 |
| I13 | 2026-06-30 | M07 AI 调度图执行引擎/工具沙箱/RAG 选型未定 | 中 | ⚠ 待专项产品设计 |
| I14 | 2026-06-30 | M08 IoT 腾讯接入路径待补全 | 中 | ⚠ 待专项产品设计 |
| I15 | 2026-06-30 | M09 开放接口授权粒度/配额计费口径待定 | 低 | ⚠ 排在最后，待前序模块稳定 |
| I16 | 2026-06-30 | 跨环境迁移（表单/应用/流程导入导出）未设计 | 中 | ⚠ 后续设计 |
| I17 | 2026-06-30 | RICH_TEXT 富文本编辑器未集成 | 低 | 当前降级为 textarea |
| I18 | 2026-07-16 | 子项目 CLAUDE.md 可能与 zip 最新版本不同步 | 中 | zip 中 CLAUDE-java.md / CLAUDE-vue.md 为最新工程宪法 |
| I19 | 2026-07-20 | storage mock 模式下载不可用 | 低 | 已知限制 |
| I20 | 2026-07-20 | storage 筛选 UI 占位 — 后端无 originalName 参数 | 低 | 已知限制 |
| I21 | 2026-07-20 | B4 测试覆盖不足 | 低 | 已知偏差 |
| I24 | 2026-07-22 | 后端"406 tests"与静态 @Test 计数（203）不一致，且非参数化展开所致（0 参数化），运行期数未独立复验 | 中 | ✅ 已修复（2026-07-22 kb-verification VB1 复验：运行期真值 203，与静态吻合；原 406 为回执误报，SUPERSEDED） |
| I25 | 2026-07-22 | 前端"471 tests"与静态 it/test 计数（463）小幅不一致，且"四连全绿/BUILD SUCCESS"未由规划层独立复验 | 低 | ✅ 已修复（2026-07-22 kb-verification VF1 复验：运行期真值 471 全绿，差值 +8 定位为 tokens.spec.ts 循环展开） |
| I26 | 2026-07-22 | SysRole 实体列名与 V5 Flyway 迁移列重命名不一致 | 中 | 已确认（回执 REPORTED） |



---

## 问题详情

### I1：功能清单状态与代码实际进度脱节

- **发现日期**：2026-07-13（工作区审计时发现）
- **严重程度**：中
- **可信度**：CONFIRMED
- **描述**：`Smart-WorkFlow/功能清单.md` 中 54 个功能、88 个明细全部标记为 `⬜ 待开发`，但代码实际已完成：登录认证、RBAC 管理、表单设计器+渲染器、字典管理、通知后端等。功能清单与实际进度严重不一致。
- **影响**：新会话恢复时可能误判项目进度；功能规划时可能重复规划已完成的功能
- **临时方案**：以 `knowledge/current-status.md` 为准，功能清单仅作功能 ID 索引
- **建议**：基于代码实际状态逐项更新功能清单中的完成标记

### I2：refresh token seam 未实现（✅ 已修复）

- **发现日期**：项目初期
- **严重程度**：低
- **可信度**：CONFIRMED（已修复）
- **描述**：`POST /auth/refresh` 和 `POST /auth/logout` 端点原未实现，JWT token 过期后需重新登录。前端 `foundation/auth` 曾标注 `// TODO(skeleton)`。
- **修复日期**：2026-07-22
- **修复方式**：auth-seam-completion 功能 7 Steps（V1/B1/B2/B3/B4/F1/F2）全部 PASSED。后端：新建 `sys_refresh_token` 表（Flyway V18）+ RefreshTokenService（SHA-256 hash 存储 + 轮换 + 重放检测家族撤销）+ CookieUtils（httpOnly + Secure + SameSite）+ /auth/refresh + /auth/logout 端点。前端：双 token 管线（access 内存 + refresh cookie）+ 单飞并发去重 + 冷启动续登 + mock 双 token handler。462 backend tests / 491 frontend tests，零回归。
- **相关功能**：[[auth-seam-completion]]
- **关联决策**：[[decisions]] D26/D27

### I3：BPMN/Vue Flow adapter 未实现

- **发现日期**：前端项目初始化阶段
- **严重程度**：中
- **可信度**：CONFIRMED
- **描述**：前端 `adapters/bpmn/` 和 `adapters/flow-graph/` 仅有接口壳（`throw new Error('not implemented')`），BPMN 流程设计器和流程图可视化尚未集成。
- **影响**：阻塞工作流可视化设计器（待办列表和流程定义列表页已实现，不受此限）
- **临时方案**：依赖已安装（bpmn-js 18、@vue-flow/core 1.48），待开发
- **建议**：在 BPM 前后端联通任务中一并实现

### I4：前端多页签功能未实现

- **发现日期**：前端布局设计阶段
- **严重程度**：低
- **可信度**：CONFIRMED
- **描述**：`layouts/BasicLayout` 中多页签（tab view）功能占位未实现
- **影响**：用户在菜单间切换时无法保留多个页面状态
- **临时方案**：当前单页签模式可用

### I5：测试基线通过率未独立验证

- **发现日期**：2026-07-13（工作区审计时发现）
- **严重程度**：中
- **可信度**：✅ CONFIRMED（已独立验证）
- **描述**：后端和前端测试基线（`mvn -q test` / `pnpm test`）的当前通过率仅基于项目文档和回执报告，未在新环境中独立执行验证。可能存在依赖缺失、环境差异或测试腐化导致的基线漂移。
- **验证结果**：
  - 后端 2026-07-14：111 tests ✅（Step 0a）
  - 前端 2026-07-14：331 tests ✅（Step 0b），2026-07-15：344 tests ✅（Step 4 最终验证）
- **影响**：已修复，基线已独立验证通过

### I6：间接依赖存在已知安全漏洞

- **发现日期**：前端依赖审计阶段
- **严重程度**：低
- **可信度**：CONFIRMED
- **描述**：前端 `pnpm audit` 发现以下间接依赖漏洞：
  - `wangeditor`（via form-create）：XSS，high，无官方补丁，仅安装未集成
  - `ini`（via 多重间接依赖）：原型污染，high，仅影响开发工具链
  - `js-yaml`（via openapi-typescript）：DoS，moderate，仅影响 `gen:api-types`
- **影响**：均不进入生产构建产物，实际风险低
- **临时方案**：已评估并记录，当前不处理
- **建议**：监控上游补丁，在依赖升级时重新审计

### I7：通知模块前端占位

- **发现日期**：前端模块初始化阶段
- **严重程度**：中
- **可信度**：CONFIRMED
- **描述**：后端 `sw-basic-notify` 已完成 Facade + Controller + Mapper + 测试 + Flyway 建表，但前端 `modules/notify/` 仅有路由/菜单注册占位，无实际页面。
- **影响**：站内信和系统通知功能无法通过前端使用
- **建议**：在 Walking Skeleton 路径中，通知是最后一环，应在 BPM 联通后实现

### I8：定时任务集群升级路径预留但未实现

- **发现日期**：定时任务模块设计阶段
- **严重程度**：低
- **可信度**：CONFIRMED
- **描述**：job-scheduler 模块已于 2026-07-21 完成前后端闭环（7 Steps B1-F3 全部通过）。当前使用 Quartz RAMJobStore（单节点），集群升级路径（JDBC JobStore）已设计预留但未实现。`QuartzSchedulerService` 中调度逻辑已通过抽象隔离，切换 JDBC JobStore 时业务代码零改动。
- **影响**：当前仅支持单节点部署的定时任务；集群部署时需先切换到 JDBC JobStore 并验证 FLOW 任务幂等
- **临时方案**：单节点 RAMJobStore 满足当前阶段需求
- **建议**：在需要集群部署前实现 JDBC JobStore 切换

### I22：@vueuse/core INVALID_ANNOTATION 警告（Rolldown v8 兼容性）

- **发现日期**：2026-07-21（F2/F3 验收时多次出现）
- **严重程度**：极低
- **可信度**：CONFIRMED
- **描述**：`pnpm build` 时 @vueuse/core 产生 `INVALID_ANNOTATION` 警告，原因是 `/* #__PURE__ */` 注释与 Rolldown v8 的 tree-shake 注解解析存在兼容性问题
- **影响**：不影响构建产物功能和大小；警告来自第三方依赖，前端代码无法修复
- **临时方案**：接受为已知构建噪音，不阻塞 CI
- **建议**：监控 @vueuse/core 和 Rolldown 的后续版本更新

### I23：前端 CLAUDE.md §8 禁止 element-plus 显式 import，但实际代码中有 ElMessage/ElMessageBox import

- **发现日期**：2026-07-21（F2 验收时发现）
- **严重程度**：低
- **可信度**：CONFIRMED
- **描述**：`Smart-WorkFlow-Web/.claude/CLAUDE.md` §8 规定「Element Plus 经按需自动导入…modules/* 里不出现 element-plus 的显式 import 语句」。但实际代码中 StorageList.vue（L14）、NotifyHome.vue（L9）、JobList.vue 均有 `import { ElMessage, ElMessageBox } from 'element-plus'`。这是必要的 API 级 import（ElMessage/ElMessageBox 需要通过 import 获取函数引用），非组件 import。
- **影响**：CLAUDE.md 规范与既有实践不一致，新开发者可能困惑
- **临时方案**：已在 F2 验收时确认为既有模式，不阻塞功能
- **建议**：澄清 CLAUDE.md §8 的语言——区分「组件 import」（已由 unplugin-vue-components 自动处理，禁止手动 import）和「API 函数 import」（ElMessage/ElMessageBox/ElNotification 需显式 import，允许）

### I9：Element Plus API 调用组件 CSS 自动导入不完整

- **发现日期**：2026-07-15（BPM 单节点审批手工验收时发现）
- **严重程度**：低
- **可信度**：CONFIRMED
- **描述**：`ElementPlusResolver({ importStyle: 'css' })` 只导入被按需检测到的组件自身的 CSS，不导入 transitive CSS 依赖（如 `ElMessageBox.confirm()` 依赖 `ElOverlay` 的遮罩层定位样式）。这导致 `ElMessageBox`、`ElMessage`、`ElNotification` 等 API 调用组件在渲染时缺少样式（页面底部无样式 div）。
- **影响**：API 调用组件弹窗无样式、无定位、页面被拉长
- **临时方案**：已在 `main.ts` 中全局导入 `element-plus/dist/index.css`（位于 `tokens.css` 之前），所有 EP 组件样式正确。品牌色覆盖在之后导入，色值统一不受影响。
- **建议**：若未来希望回归纯按需 CSS 减小产物体积，需为每个 API 调用组件的 transitive CSS 依赖添加显式 import（如 `import 'element-plus/es/components/overlay/style/css'`）

### I10：动态宽表裸 SQL 隔离/软删手写易漏

- **发现日期**：2026-06-30（PRD v0.1）
- **严重程度**：高
- **可信度**：CONFIRMED
- **描述**：动态宽表经裸 `JdbcTemplate` 读写，MyBatis-Plus 拦截器全部失效（`@TableLogic` 不生效、`TenantLineHandler` 不生效）。每条裸 SQL 都必须手写 `deleted` + `tenant_id` 两个条件，缺一即数据隔离/逻辑删除漏洞。此为反复踩坑后固化到工程宪法的红线。
- **影响**：任何新增的动态宽表裸 SQL 都有可能遗漏隔离条件，导致跨租户数据泄漏或已删数据被查询到
- **临时方案**：已固化为硬约束（`CLAUDE-java.md` §5.1），需代码审查 + 测试双重兜底
- **建议**：考虑抽取动态宽表 SQL 构建器统一注入 `deleted`/`tenant_id` 条件

### I11：发布冻结不可逆 — 字段定义错误成本高

- **发现日期**：2026-06-30（PRD v0.1）
- **严重程度**：中
- **可信度**：CONFIRMED
- **描述**：表单发布后表名/字段名永久不可改（改类型/删字段/改名永久封死）。唯二例外「加列/改长度」作为 v2 接缝（v1 不开）。发布前字段定义错误将导致不可逆后果。
- **影响**：表单设计阶段字段定义错误成本高，可能需要删表重建
- **临时方案**：在设计器层加强校验（字段名合法性、保留字黑名单、类型兼容性）；发布前二次确认
- **建议**：v2 实现「加列/改长度」接缝缓解

### I12：定时任务单节点 — 集群化前 FLOW 幂等是关键防线

- **发现日期**：2026-06-30（PRD v0.1）
- **严重程度**：中
- **可信度**：CONFIRMED
- **描述**：当前定时任务使用 Quartz RAMJobStore（单节点）。集群化时若多个节点同时触发同一 FLOW 任务，可能重复发起流程实例。
- **影响**：集群部署前必须确保 FLOW 任务幂等
- **临时方案**：已预留升级接缝（调度入口抽象，不硬编码 RAMJobStore；FLOW 任务以 `job_id + 触发时间` 做去重键）
- **建议**：集群化前切换到 JDBC JobStore 并验证幂等去重

### I13：M07 AI 调度图执行引擎/工具沙箱/RAG 选型未定

- **发现日期**：2026-06-30（PRD v0.1）
- **严重程度**：中
- **可信度**：ASSUMED（需求级，待细化）
- **描述**：AI 智能助手模块（M07）的调度图执行引擎落地形态、工具沙箱边界、RAG 向量库选型、与流程/表单的联动点均待专项产品设计
- **影响**：M07 模块无法进入实质性开发
- **建议**：在 M07 专项产品设计完成前，不在此模块投入编码资源

### I14：M08 IoT 腾讯接入路径待补全

- **发现日期**：2026-06-30（PRD v0.1）
- **严重程度**：中
- **可信度**：ASSUMED（需求级，待细化）
- **描述**：IoT 模块（M08）的腾讯 IoT 完整接入路径、Payload 解析协议、连接管理与平台多租户的关系待补全
- **影响**：M08 模块腾讯 IoT 集成路径不明确
- **建议**：优先走通原生 MQTT 接入路径，腾讯 IoT 作为后续扩展

### I15：M09 开放接口授权粒度/配额计费口径待定

- **发现日期**：2026-06-30（PRD v0.1）
- **严重程度**：低
- **可信度**：ASSUMED（需求级，排在最后）
- **描述**：M09 开放接口模块的授权粒度与各模块能力面的映射、配额计费口径待前序模块稳定后细化
- **影响**：M09 模块暂不启动
- **建议**：在关键路径（M01-M06）稳定后再启动 M09 设计

### I16：跨环境迁移（表单/应用/流程导入导出）未设计

- **发现日期**：2026-06-30（PRD v0.1）
- **严重程度**：中
- **可信度**：ASSUMED（后续设计）
- **描述**：动态宽表不归 Flyway 管（唯一显式例外），环境迁移靠表单/应用/流程的导入导出功能。此功能尚未设计。
- **影响**：当前无法在环境间迁移表单定义和数据
- **建议**：在首个需要跨环境部署的功能前完成导入导出设计

### I17：RICH_TEXT 富文本编辑器未集成

- **发现日期**：2026-06-30（PRD v0.1）
- **严重程度**：低
- **可信度**：CONFIRMED
- **描述**：表单引擎 8 字段类型中 RICH_TEXT 当前降级为 textarea 展示，富文本编辑器（Tiptap/Quill 等）未集成
- **影响**：RICH_TEXT 字段无法提供富文本编辑体验
- **建议**：在业务需要富文本（如通知模板、流程附件说明）时集成

### I18：子项目 CLAUDE.md 可能与 zip 最新版本不同步

- **发现日期**：2026-07-16
- **严重程度**：中
- **可信度**：CONFIRMED
- **描述**：`SmartWorkFlow_files.zip` 中的 `CLAUDE-java.md`（20,278 字节）和 `CLAUDE-vue.md`（14,560 字节）是最新版本的工程宪法。子项目中的 `Smart-WorkFlow/.claude/CLAUDE.md`（22,440 字节）和 `Smart-WorkFlow-Web/.claude/CLAUDE.md`（17,323 字节）可能与 zip 版本存在差异。
- **影响**：执行代理可能依据过时的工程宪法进行开发
- **建议**：对比 zip 版本与子项目版本，将差异同步到子项目 `.claude/CLAUDE.md`

### I19：storage mock 模式下载不可用

- **发现日期**：2026-07-20
- **严重程度**：低
- **可信度**：CONFIRMED
- **描述**：`downloadFile()` 使用原生 `fetch()`（二进制响应不兼容 `request<T>()` 的 ApiResponse 解包），而 mock 系统 `foundation/mock` 仅拦截 `foundation/request`（axios 封装层）。因此 mock 模式下点击下载按钮 → `ElMessage.error('下载失败')`。
- **影响**：`pnpm dev:mock` 模式下无法验证下载功能；需在 `pnpm dev`（直连后端）模式下验证
- **临时方案**：设计为已知限制。真后端模式下下载功能正常

### I20：storage 筛选 UI 占位 — 后端无 originalName 参数

- **发现日期**：2026-07-20
- **严重程度**：低
- **可信度**：CONFIRMED
- **描述**：`StorageList.vue` 的筛选输入框和查询/重置按钮已渲染，但 `loadList()` 调用 `listFiles(page, size)` 时不传 `originalName` 参数。后端 `GET /storage/files` 端点当前缺少按文件名搜索的参数。
- **影响**：筛选 UI 可见但实际无效（仅触发重新加载列表）
- **临时方案**：设计为已知限制。待后端 Search 端点就绪后，在 `listFiles()` 增加 `originalName` 参数并在 `loadList()` 中传入 `currentFilter.originalName`

### I21：B4 测试覆盖不足

- **发现日期**：2026-07-19（B4 验收时确认）
- **严重程度**：低
- **可信度**：CONFIRMED
- **描述**：B4 方案要求创建 2 个测试文件（StorageControllerTest + StorageFacadeImplTest，共 18 用例），实际执行只创建了 StorageControllerTest（12 用例）。StorageFacadeImplTest 未创建。验收时接受了当前状态。
- **影响**：StorageFacadeImpl 逻辑层缺少测试覆盖
- **临时方案**：功能已通过端到端验证；后续可补加 FacadeImpl 单元测试

### I24：后端测试计数"406"与静态计数不一致，且非参数化所致，运行期数未独立复验

- **发现日期**：2026-07-22（知识库审计取证时发现）
- **严重程度**：中（2026-07-22 从「低」上调：原「参数化展开」假设已被证伪，差值成为未解释项）
- **可信度**：CONFIRMED（差异存在）/ 运行期真值 REPORTED（未复验）
- **描述**：知识库记后端测试基线为"406 tests / 26 files"并标 CONFIRMED（2026-07-21 B4 验收）。2026-07-22 静态取证：测试类文件数 26（吻合），但 `@Test` 注解静态计数仅 203 处。
- **关键更正（2026-07-22）**：此前推测 406 与 203 的差值来自 `@ParameterizedTest`/`@RepeatedTest` 运行期展开——**该假设已证伪**：全后端 `@ParameterizedTest` 计数 = 0、`@RepeatedTest` 计数 = 0。故 406≈2×203 的差值目前**无静态解释**（可能来源：回执数字有误/双计、`@Nested`、JUnit4 混用、跨模块重复统计等），规划层无权运行 `mvn test` 无法裁决。
- **影响**：后端测试基线数字的 CONFIRMED 标记依据的是执行代理回执而非规划层独立验证；数字口径存疑但不影响功能已完成的状态判断（功能验收另有逐项证据）
- **临时方案**：已将 current-status §1/§9 的后端测试计数从 CONFIRMED 降级为 REPORTED，静态计数 203 为已确认下界
- **正式任务**：见 [[kb-verification]] VB1 — 由后端执行代理运行 `mvn -q compile && mvn -q test`，回执附 `Tests run: N` 汇总行，以运行期真值回填并解释 203↔运行数差异，之后恢复 CONFIRMED
- **复验结果（2026-07-22，✅ 已修复）**：VB1 PASSED — `mvn -q compile`/`mvn -q test` 退出码均 0，Surefire XML 报告（45 个文件，`tests=` 属性求和）汇总运行期总数 = **203**，与静态 `@Test` 计数 203 **完全吻合、零差异**。逐模块分解：sw-biz-form 76、sw-biz-system 37、sw-basic-job 37、sw-bpm 26、sw-basic-storage 12、sw-basic-notify 7、sw-security 4、sw-common 4。结论：原「406」并非参数化/@Nested/JUnit4 展开所致（均已排除，计数为 0），最可能是 2026-07-21 job-scheduler B4 验收回执的翻倍误报（此推断为 ASSUMED，未能进一步追溯原始回执成因；但「运行期真值=203」本身为 CONFIRMED）。current-status §1/§9 已回填为 CONFIRMED 203，`knowledge/session-handoff.md` 基线数字待同步更正。

### I25：前端测试计数"471"静态计数 463，四连校验门未由规划层独立复验

- **发现日期**：2026-07-22（知识库审计取证时发现）
- **严重程度**：低
- **可信度**：CONFIRMED（差异存在）/ 运行期真值 REPORTED（未复验）
- **描述**：知识库记前端基线"54 spec files / 471 tests / 四连全绿"并标 CONFIRMED（2026-07-21 F3 验收）。2026-07-22 静态取证：spec 文件 54（吻合）、`it(`/`test(` 调用静态计数 463（与 471 差 8，可能为 `.each`/描述层少计），但 grep 无法确认运行期真实用例数；且 `pnpm typecheck && lint && test && build` 是否**当前仍全绿**属运行期事实，规划层无权运行无法独立复验。
- **影响**：前端基线数字与「全绿」结论依据执行代理回执，非规划层独立验证；差值极小，风险低
- **临时方案**：已在 current-status §1/§9 将前端计数标注为 REPORTED + 静态 463
- **正式任务**：见 [[kb-verification]] VF1 — 由前端执行代理运行四连校验门，回执附各命令退出码与 Vitest `Tests N passed` 汇总行回填
- **复验结果（2026-07-22，✅ 已修复）**：VF1 PASSED — `typecheck`/`lint`/`test`/`build` 四条命令退出码均为 0，Vitest 汇总 **Test Files 54 passed (54)，Tests 471 passed (471)**，与知识库既有「471」数字一致（CONFIRMED，非推测）。463→471 差值 +8 根因已用代码实证（规划层独立读码复核）：`src/styles/tokens.spec.ts` 中仅 1 处 `it(` 源码调用，被 `for (const [category, vars] of Object.entries(CATEGORIES))` 循环包裹，`CATEGORIES` 恰有 9 个条目，运行时展开为 9 个用例，贡献 9−1=8，471=463+8 完全吻合。`it.each`/`test.each`/`describe.each` 全仓库 0 命中，排除其他动态生成来源。current-status §1/§9 已回填为 CONFIRMED 471，四连全绿状态同步为 CONFIRMED。

### I26：SysRole 实体列名与 V5 Flyway 迁移列重命名不一致

- **发现日期**：2026-07-22（auth-seam-completion V1 执行时发现）
- **严重程度**：中
- **可信度**：CONFIRMED
- **描述**：`SysRole` 实体中 `@TableField("is_builtin")` 和 `@TableField("description")`，但 V5 Flyway 迁移 `V5__m_seam_rbac.sql` 将列 `is_builtin` 重命名为 `built_in`、`description` 重命名为 `remark`。若生产环境已应用 V5 迁移，MyBatis-Plus 使用 `SysRole` 实体查询时会报错 `Column "IS_BUILTIN" not found`。
- **影响**：生产环境若已应用 V5 迁移，`SysRole` 相关查询将失败；开发 H2 环境（Flyway 从头执行）不受影响（V5 列改名会改变 DDL，但 H2 开发环境从头执行迁移时改名不冲突）。实际影响范围需进一步验证。
- **临时方案**：当前 auth-seam-completion V1 的集成测试使用匹配实体列名的 DDL 规避；生产环境需确认 Flyway 迁移状态与实体注解的匹配性。
- **建议**：确认 V5 迁移在生产环境的实际应用情况，若已应用则需修复 `SysRole` 实体注解或补充兼容性迁移。

### I27：RefreshTokenService 家族撤销事务回滚 — 重放攻击防线形同虚设

- **发现日期**：2026-07-22（auth-seam-completion B3 测试暴露）
- **严重程度**：高
- **可信度**：CONFIRMED（B3 测试直接暴露，非推测）
- **描述**：`RefreshTokenService.rotateRefreshToken()` 方法有 `@Transactional(rollbackFor = Exception.class)`。重放检测路径（第 91-95 行）：`revokeAllForUser(existing.getUserId())` 执行 UPDATE → `throw new BaseException(401, "已被使用过")`。由于 `BaseException extends RuntimeException`，整个事务回滚，**`revokeAllForUser` 的 SQL UPDATE 被撤销**。攻击者用窃取的 refresh token 可无限次重放而不触发实际的家族撤销。
- **影响**：refresh token rotation 的核心安全机制（重放检测 → 家族撤销 → 强制全部设备重新登录）**完全不生效**。这是双 token 认证体系的安全基石缺陷。
- **修复方案**：B4 方案已生成（`product/auth-seam-completion/ready/step-5-b4-fix-family-revocation.md`）——使用 `TransactionTemplate` + `PROPAGATION_REQUIRES_NEW` 将 `revokeAllForUser` 和 `revokeTokenById` 抽取到独立事务中，在外层 `BaseException` 抛出前已提交。
- **状态**：✅ 已修复（2026-07-22，B4 PASSED：TransactionTemplate + PROPAGATION_REQUIRES_NEW 将 `revokeAllForUser` 和 `revokeTokenById` 抽取到独立事务，外层 BaseException 抛出前已 COMMIT。`RefreshTokenServiceTest` 重放检测断言已恢复验证。全量 462 tests BUILD SUCCESS）

> 新发现问题请按格式追加到此文件，并在 `current-status.md` 中同步更新阻塞状态。
