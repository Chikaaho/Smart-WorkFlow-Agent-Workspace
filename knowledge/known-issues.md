# 已知问题和限制

> 工作区统一知识库 — 已知问题、技术债务和当前限制。
> 记录已发现但尚未解决的问题，供功能规划和风险评估参考。
>
> 可信度：CONFIRMED = 问题已复现确认 · REPORTED = 回执中报告 · ASSUMED = 推测

---

## 问题索引

| # | 发现日期 | 问题 | 严重程度 | 状态 |
|---|----------|------|:---:|:---:|
| I1 | — | 功能清单状态与代码实际进度脱节 | 中 | ✅ 已修复（2026-07-24：feature-checklist-sync 4 Steps 全部 PASSED） |
| I2 | — | refresh token seam 未实现 | 低 | ✅ 已修复（2026-07-22：auth-seam-completion 7 Steps 全部 PASSED，/auth/refresh + /auth/logout 前后端闭环） |
| I3 | — | BPMN/Vue Flow adapter 未实现 | 中 | 部分修复（Vue Flow ✅ 2026-07-25 [[vue-flow-adapter]] COMPLETED；BPMN 查看器 ✅ 2026-07-25 [[bpmn-adapter]] Step 0/1/2 PASSED——前端查看器防腐层 + 后端 BPMN XML 端点均已实现；设计器/Modeler 能力明确不在范围内；UI 查看入口（Step 3）、M04-F06 流程监控（Step 4）仍待后续） |
| I4 | — | 前端多页签功能未实现 | 低 | 待开发 |
| I5 | — | 测试基线通过率未独立验证 | 中 | ✅ 已修复（2026-07-14 验证：后端 111 tests ✅，前端 331 tests ✅） |
| I6 | — | 间接依赖存在已知安全漏洞 | 低 | 已评估 |
| I7 | 2026-07-15 | 通知模块前端占位 | 中 | ✅ 已修复（通知列表页 + 标记已读交互已实现） |
| I8 | — | 定时任务集群升级路径预留但未实现 | 低 | 设计预留 |
| I22 | 2026-07-21 | @vueuse/core INVALID_ANNOTATION 警告（Rolldown v8 兼容性） | 极低 | 第三方依赖 |
| I23 | 2026-07-21 | 前端 system.md §8 禁止 element-plus 显式 import，但实际代码中有 ElMessage/ElMessageBox import | 低 | 文档与代码不一致 |
| I9 | 2026-07-15 | Element Plus API 调用组件 CSS 自动导入不完整 | 低 | ✅ 已绕过（全量 CSS 导入） |
| I10 | 2026-06-30 | 动态宽表裸 SQL 隔离/软删手写易漏 | 高 | 已固化为红线，须测试兜底 |
| I11 | 2026-06-30 | 发布冻结不可逆 — 字段定义错误成本高 | 中 | 需在设计器层强校验 |
| I12 | 2026-06-30 | 定时任务单节点 — 集群化前 FLOW 幂等是关键防线 | 中 | 已预留升级接缝 |
| I13 | 2026-06-30 | M07 AI 调度图执行引擎/工具沙箱/RAG 选型未定 | 中 | ◐ 部分收敛（2026-08-11 Step8 落地：执行引擎架构已裁定并实现、条件分支求值已拍板；RAG/联动点仍未决，见下文） |
| I14 | 2026-06-30 | M08 IoT 腾讯接入路径待补全 | 中 | ⚠ 待专项产品设计 |
| I15 | 2026-06-30 | M09 开放接口授权粒度/配额计费口径待定 | 低 | ⚠ 排在最后，待前序模块稳定 |
| I16 | 2026-06-30 | 跨环境迁移（表单/应用/流程导入导出）未设计 | 中 | ⚠ 后续设计 |
| I17 | 2026-06-30 | RICH_TEXT 富文本编辑器未集成 | 低 | 当前降级为 textarea |
| I18 | 2026-07-16 | 子项目 system.md 可能与 zip 最新版本不同步 | 中 | zip 中 CLAUDE-java.md / CLAUDE-vue.md 为最新工程宪法 |
| I19 | 2026-07-20 | storage mock 模式下载不可用 | 低 | 已知限制 |
| I20 | 2026-07-20 | storage 筛选 UI 占位 — 后端无 originalName 参数 | 低 | 已知限制 |
| I21 | 2026-07-20 | B4 测试覆盖不足 | 低 | 已知偏差 |
| I24 | 2026-07-22 | 后端"406 tests"与静态 @Test 计数（203）不一致，且非参数化展开所致（0 参数化），运行期数未独立复验 | 中 | ✅ 已修复（2026-07-22 kb-verification VB1 复验：运行期真值 203，与静态吻合；原 406 为回执误报，SUPERSEDED） |
| I25 | 2026-07-22 | 前端"471 tests"与静态 it/test 计数（463）小幅不一致，且"四连全绿/BUILD SUCCESS"未由规划层独立复验 | 低 | ✅ 已修复（2026-07-22 kb-verification VF1 复验：运行期真值 471 全绿，差值 +8 定位为 tokens.spec.ts 循环展开） |
| I26 | 2026-07-22 | SysRole 实体列名与 V5 Flyway 迁移列重命名不一致 | 中 | 已确认（回执 REPORTED） |
| I28 | 2026-07-23 | 后端工程宪法缺少「仓库范围硬约束」章节，前后端不对称 | 高 | ✅ 已修复（2026-07-23，用户授权规划层一次性越权补齐 §0.1，见 D34） |
| I29 | 2026-07-25 | bpmn-adapter Step 2 执行/测试回执自报测试计数与独立核实结果不符（三处矛盾），自报 PASSED 未予采信 | 中 | ✅ 已修复（2026-07-25：修正补充回执已收到并独立复核通过——基线 19→26 更正为 26→36，净增 +7→+10，项目级 231→241，Git 删行澄清为零删除。Step 2 最终 PASSED） |



---

## 问题详情

### I1：功能清单状态与代码实际进度脱节（✅ 已修复）

- **发现日期**：2026-07-13（工作区审计时发现）
- **严重程度**：中
- **可信度**：CONFIRMED（已修复）
- **描述**：`Smart-WorkFlow/功能清单.md` 中 54 个功能、89 个明细（原记为 88，已更正）全部标记为 `⬜ 待开发`，但代码实际已完成：登录认证、RBAC 管理、表单设计器+渲染器、字典管理、通知后端等。功能清单与实际进度严重不一致。
- **修复日期**：2026-07-24
- **修复方式**：feature-checklist-sync 功能 4 Steps（Step1 后端核实/Step2 前端核实/Step3 规划层综合裁决/Step4 机械应用）全部 PASSED。范围裁定：M07/M08/M09（合计35条）后端骨架+前端占位，规划层直判保留 `⬜`；余下 M01/M02/M03/M04/M05/M06/M10（合计54条）逐条委派后端/前端核实，按 [[decisions]] D35 MIN 规则（`merged=min(后端,前端)`）合并裁决。最终 `功能清单.md` 89 条明细状态更新为 **✅17 / 🟦12 / ⬜60**，独立子代理核查确认：改动仅限状态列、终态计数吻合、10 条抽查一致、全表无重复无缺失。执行回执 §5 摘要表存在 1 处计数笔误（报 28 行变更，实际 29 行），已定位为回执内部汇总算错，不影响文件实际内容，详见 [[feature-checklist-sync]] §4.3。
- **相关功能**：[[feature-checklist-sync]]
- **关联决策**：[[decisions]] D35

### I2：refresh token seam 未实现（✅ 已修复）

- **发现日期**：项目初期
- **严重程度**：低
- **可信度**：CONFIRMED（已修复）
- **描述**：`POST /auth/refresh` 和 `POST /auth/logout` 端点原未实现，JWT token 过期后需重新登录。前端 `foundation/auth` 曾标注 `// TODO(skeleton)`。
- **修复日期**：2026-07-22
- **修复方式**：auth-seam-completion 功能 7 Steps（V1/B1/B2/B3/B4/F1/F2）全部 PASSED。后端：新建 `sys_refresh_token` 表（Flyway V18）+ RefreshTokenService（SHA-256 hash 存储 + 轮换 + 重放检测家族撤销）+ CookieUtils（httpOnly + Secure + SameSite）+ /auth/refresh + /auth/logout 端点。前端：双 token 管线（access 内存 + refresh cookie）+ 单飞并发去重 + 冷启动续登 + mock 双 token handler。462 backend tests / 491 frontend tests，零回归。
- **相关功能**：[[auth-seam-completion]]
- **关联决策**：[[decisions]] D26/D27

### I3：BPMN/Vue Flow adapter 未实现（Vue Flow 部分 ✅ 已修复）

- **发现日期**：前端项目初始化阶段
- **严重程度**：中
- **可信度**：CONFIRMED（BPMN 部分仍待开发）/ CONFIRMED（Vue Flow 部分已修复）
- **描述**：前端 `adapters/bpmn/` 和 `adapters/flow-graph/` 原仅有接口壳（`throw new Error('not implemented')`），BPMN 流程设计器和流程图可视化尚未集成。
- **修复（Vue Flow 部分，2026-07-25）**：[[vue-flow-adapter]] 功能 COMPLETED——`adapters/flow-graph/index.ts` 已重写为完整防腐层（mount/export/destroy + 事件回调），6 测试 / 497 tests 四连全绿。M07 AI 调度图业务模块仍未就位（预期状态，adapter 可独立先行）。
- **修复（BPMN 部分，2026-07-25）**：[[bpmn-adapter]] Step 0/1/2 均已 PASSED——前端 `adapters/bpmn/` 查看器防腐层（mountBpmnViewer/highlight/fitViewport/destroy + 事件回调）+ 后端 `GET /workflow/defs/{id}/bpmn-xml` 只读端点（`R<String>`，项目级 241 tests BUILD SUCCESS）。UI 查看入口（Step 3）和 M04-F06 流程监控页面（Step 4）仍待后续。
- **影响**：BPMN 查看器防腐层已就绪、XML 数据源端点已就绪；UI 入口和流程监控页面仍待 Step 3/4；设计器（Modeler）能力明确不在范围内
- **临时方案**：BPMN 依赖已安装（bpmn-js 18），待开发
- **建议**：BPMN adapter 在 BPM 前后端联通任务中实现；Vue Flow adapter ✅ 已独立完成

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

### I23：前端 system.md §8 禁止 element-plus 显式 import，但实际代码中有 ElMessage/ElMessageBox import

- **发现日期**：2026-07-21（F2 验收时发现）
- **严重程度**：低
- **可信度**：CONFIRMED
- **描述**：`Smart-WorkFlow-Web/.claude/system.md` §8 规定「Element Plus 经按需自动导入…modules/* 里不出现 element-plus 的显式 import 语句」。但实际代码中 StorageList.vue（L14）、NotifyHome.vue（L9）、JobList.vue 均有 `import { ElMessage, ElMessageBox } from 'element-plus'`。这是必要的 API 级 import（ElMessage/ElMessageBox 需要通过 import 获取函数引用），非组件 import。
- **影响**：system.md 规范与既有实践不一致，新开发者可能困惑
- **临时方案**：已在 F2 验收时确认为既有模式，不阻塞功能
- **建议**：澄清 system.md §8 的语言——区分「组件 import」（已由 unplugin-vue-components 自动处理，禁止手动 import）和「API 函数 import」（ElMessage/ElMessageBox/ElNotification 需显式 import，允许）

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
- **状态更新（2026-08-11）**：「执行引擎落地形态」经产品设计澄清（`product/agent-model-orchestration/passed/step-6-f02-design-clarification.md`）已部分收敛——MVP 节点类型（LLM/工具/条件分支）已定，工具节点改为独立图节点。**Step7（2026-08-11）已落地**：图定义 CRUD+版本+发布骨架（`sw_agent_graph_def` 表 V25 + ProcessGraph/GraphElement 图模型 + DRAFT/PUBLISHED + def_version 递增 + graph_key 冻结），`graph_json` 节点 config/style 不透明透传。**Step8（2026-08-11）已落地**：执行引擎架构**已裁定并落地**——放弃 LangGraph4j `StateGraph`（无 JSON 反序列化能力），自建纯 Java `AgentGraphInterpreter`（`passed/step-8-graph-interpreter-engine.md`），`AgentGraphFactory`/LangGraph4j 保留服务 F01，两条执行路径并存互不干扰；条件分支求值**已拍板**为关键词子串匹配（边 `config.keyword`，`String.contains` 按 elements 顺序取第一个命中，未命中走唯一默认边，无默认边运行时报错，不支持正则、无新依赖）；execution context 极简为单一 currentText；执行历史不落库。「不在此模块投入编码资源」的限制对 F02 图定义 CRUD（Step7）与执行引擎骨架（Step8）已解除。**仍未收敛**：并行/循环节点语义（推入 todo）、RAG 向量库选型、流程表单联动点——三项继续适用该限制。

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

### I18：子项目 system.md 可能与 zip 最新版本不同步

- **发现日期**：2026-07-16
- **严重程度**：中
- **可信度**：CONFIRMED
- **描述**：`SmartWorkFlow_files.zip` 中的 `CLAUDE-java.md`（20,278 字节）和 `CLAUDE-vue.md`（14,560 字节）是最新版本的工程宪法。子项目中的 `Smart-WorkFlow/.claude/system.md`（22,440 字节）和 `Smart-WorkFlow-Web/.claude/system.md`（17,323 字节）可能与 zip 版本存在差异。
- **影响**：执行代理可能依据过时的工程宪法进行开发
- **建议**：对比 zip 版本与子项目版本，将差异同步到子项目 `.claude/system.md`

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

### I28：后端工程宪法缺少「仓库范围硬约束」章节，前后端不对称

- **发现日期**：2026-07-23（用户反馈"后端执行时经常越界"，规划层直读两份子项目 system.md 对比确认）
- **严重程度**：高
- **可信度**：CONFIRMED（直接对比两份文件原文得出，非推测）
- **描述**：直读对比 `Smart-WorkFlow-Web/.claude/system.md` 与 `Smart-WorkFlow/.claude/system.md` 发现结构性不对称：
  - 前端宪法 §0.0 之后有独立的 **§0.1「本仓库范围（硬约束）」**，明确写了 4 条：❌ 禁止读取/修改/构建/运行/分析后端代码、❌ 禁止执行后端命令（`mvn`/`gradle` 等）、❌ 禁止向后端仓库提交或推送、✅ 只在前端目录执行 `pnpm` 系命令。
  - 后端宪法 §0.0 没有对应章节，唯一相关的一句是「❌ 禁止修改前端代码（`Smart-WorkFlow-Web/`）」——**只锁了"改代码"，没有锁"读文件"和"跑命令"**，缺少"禁止读取/构建/运行前端代码""禁止执行 pnpm/npm/vite/vitest""只在后端目录执行 mvn 系命令"等显式条款。
  - 两份文件在「禁止诱导用户规划」「禁止预告下一 Step」两条硬约束上是**完全对称、都很完善**的，唯独"仓库范围边界"这一层后端缺项。
  - 根目录 `knowledge/shared-constraints.md` §9（[[decisions]] D29，2026-07-22）已经写了对应的硬约束（"禁止后端执行代理运行前端命令或读写前端文件"），但**该约束只回填进了根目录知识库，未回填进 `Smart-WorkFlow/.claude/system.md` 自身**；后端执行代理实际工作时读的是自己项目内的宪法文件，不会主动去读根目录 `shared-constraints.md`。
- **影响**：后端执行代理在无显式禁令的情况下，可能读取前端文件或执行 `pnpm`/`npm` 命令（例如"顺手验证前后端联动"），这正是用户反馈的"新会话会一起执行前后端任务"越界现象的最直接可归因原因。
- **关联问题**：与 [[known-issues]] I18（子项目 system.md 可能与 zip 版本不同步）同源——都是子项目 `.claude/system.md` 未与最新硬约束同步。
- **修复日期**：2026-07-23
- **修复方式**：用户明确授权规划层本次一次性越权（该文件不在 `system.md` §1.3 常规写入范围内），已在 `Smart-WorkFlow/.claude/system.md` §0.0 之后补齐 §0.1「本仓库范围（硬约束）」，内容镜像前端 §0.1 结构：禁止读取/修改/构建/运行/分析前端代码、禁止执行 `pnpm`/`npm`/`vite`/`vitest`、禁止向前端仓库提交推送、只在后端目录执行 `mvn` 系命令。此授权为一次性例外，不代表 §1.3 写入范围常态化扩大
- **口径澄清（同次核实）**：用户反馈中"把自己当作执行层"经确认实指"后端会话误把自己当作规划层"。核对后端/前端两份宪法在「禁止诱导用户规划」「禁止预告下一 Step」两条上写得完全对称、内容详尽，未发现文本缺口——这类越权若仍发生属执行层未遵守既有条款的实践问题，非宪法文本问题，不通过编辑文本解决
- **关联决策**：[[decisions]] D34

### I30：mock BPMN XML 过于简化——所有已发布流程返回同一份 StartEvent→EndEvent 最简模板

- **发现日期**：2026-07-26（Step 3 手工验收时确认）
- **严重程度**：低
- **可信度**：CONFIRMED
- **描述**：`handlers.ts` 中 `GET /api/workflow/defs/:id/bpmn-xml` 的 mock handler 始终返回一份固定最简 XML，只含 StartEvent + sequenceFlow + EndEvent，无论点击哪个流程定义（请假/报销/采购审批）都看到完全相同的图。不影响查看器功能验收，但不符合业务预期。
- **影响**：`dev:mock` 模式下查看流程图体验重复，无法区分不同流程的拓扑
- **临时方案**：用户已确认暂不处理，当前 mock 满足功能验收需要
- **建议**：后续为每个 mock 流程定义配不同的 BPMN XML（含 UserTask、Gateway 等），按 `def.processKey` 分发

> 新发现问题请按格式追加到此文件，并在 `current-status.md` 中同步更新阻塞状态。
