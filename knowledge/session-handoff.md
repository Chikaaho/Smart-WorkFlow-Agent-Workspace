# 会话交接状态

> 工作区统一知识库 — 最新跨会话交接状态。
> 每个功能完成或会话结束时更新。本文件为**当前有效版本**，旧版本不保留。
>
> 新会话启动时，优先读取本文件以恢复上下文。
>
> **最新状态（2026-08-25）**：notify-management-closure（P3 / I41 / I42 / M05 通知管理缺口闭环）**D210 功能级 PASSED + 阶段三终态同步，COMPLETED（第 32 个已完成功能）**——正式基线后端 **827/0/0/0**（agent 338）、前端 **100 spec files / 988 tests（0 failed、0 skipped）** 四门严格顺序串行全绿、Flyway **V37** 双方言；清单 **✅29/🟦21/⬜40**、已完成功能 **32**、M05-F01-02/F01-03 已升✅、I41/I42 已关闭。主方向与终态同步方向均已归档 `passed/`。审查：`product/notify-management-closure/receipts/planning-final-review.md`。
>
> ⚠️ **2026-08-14 角色制上线**：本文件历史记录中的"使用模型"字段（如 deepseek-v4-pro/flash）为**当时执行事实**，仅作历史存档。当前权限按会话角色（规划/执行/管理员）划分，与模型无关（见根目录 `system.md` §0.2）。新记录不再填写模型字段。

---

## 0. 当前进行中功能（无进行中业务功能；已完成功能 32）

**agent-graph-step-debugging — P7 / M07-F02-04 图单步调试（D175下发；D180 规划层最终验收 15/15 PASSED + 终态同步，COMPLETED，第30个，2026-08-23）**

方向 `product/agent-graph-step-debugging/passed/direction-agent-graph-step-debugging.md`（D175，**已归档passed/**）执行：
- **D176—D179 迭代**：标准1—13锁定PASSED（禁止重验）；G14 计数重建真实基线（4 个新 Debug 测试类基线 0），当前 Surefire XML 逐文件核对 **827/0/0/0（119 叶文件）**，净增 72 = 71 调试测试 + 1 V36 PG，`755+72=827` 严格勾稽；完整工具族实际 `pgrep` 零快照 + 2G 串行门禁全绿（后端 16:29:39—16:30:36 / 前端 16:30:53—16:31:56，86f/850t）；G15 阶段三实际落盘。
- **D180 最终验收 PASSED（2026-08-23，15/15，锁定）+ 终态同步完成**：正式基线晋级 **827/0/0/0（agent 338）、前端 86f/850t、Flyway V36 36 条**；P7 已核销、M07-F02-04 升 ✅、清单 **✅26/🟦24/⬜40**、已完成功能 **30**。
- **归档/回执**：主方向 `passed/`；终态同步回执已提交，待规划层最终复验与归档（终态同步方向 `ready/direction-post-d180-terminal-sync.md`）；审查 `receipts/planning-final-review-d180.md`。

---

## 1. 最新完成功能

**agent-graph-step-debugging — P7 / M07-F02-04 图单步调试（D180 规划层最终验收 15/15 PASSED + 终态同步，COMPLETED，第30个，2026-08-23）**

方向 `product/agent-graph-step-debugging/passed/direction-agent-graph-step-debugging.md`（D175）执行，执行层自主闭环（D176—D179 补证迭代 + D180 最终验收 + 终态同步）：
- **功能级与阶段三（D180，15/15，锁定）**：标准1—13（调试会话/断点/步进/引擎/安全/既有入口闭环）+ 标准14（唯一计数：827=755+72，119 叶文件勾稽；完整工具族实际互斥 + 2G 串行门禁）+ 标准15（阶段三实际落盘）全部 PASSED。
- **正式基线**：后端 **827/0/0/0（agent 338）**、前端 **86 spec files / 850 tests**、Flyway **V36** 双方言36条全链。
- **终态**：P7 已核销、M07-F02-04 升 ✅、清单 **✅26/🟦24/⬜40**、已完成功能 **30**。
- **审查**：`product/agent-graph-step-debugging/receipts/planning-final-review-d180.md`；终态同步回执已提交，待规划层最终复验与归档（终态同步方向 `ready/direction-post-d180-terminal-sync.md`）。

**agent-token-usage-observability — P8 / M07-F04-02 Token 统计子集（D170+D172 PASSED，13/13；D173终态文字已同步，等待规划层零残留确认，2026-08-22，第29个已完成功能）**

方向 `product/agent-token-usage-observability/passed/direction-agent-token-usage-observability.md`（D158）执行，执行层自主闭环：
- **功能级（D170）**：标准1—12全部通过；D169闭合标准6（真实router.push+组件挂载）、标准11（723幽灵1项溯源）、标准12（不自匹配pgrep零快照+2G串行门禁）；功能级基线后端755/0/0/0（agent267）、前端82f/815t、V35双方言35条全链。
- **标准13（D172已确认PASSED，13/13）**：P8已核销、M07-F04-02✅（清单25/25/40）、功能数29；全文 knowledge/memory/todo 已一致。
- **审查**：`product/agent-token-usage-observability/receipts/planning-stage3-review-d172.md`；终态入口`ready/executor-terminal-sync-prompt-d173.md`（当前唯一入口，D171已归档至`passed/`）；阶段三双回执已提交。

**agent-graph-prompt-configuration — M07-F02-02 图节点 Prompt 配置（COMPLETED，D154功能级PASSED + D157阶段三最终复验PASSED，2026-08-21，第28个已完成功能）**

方向 `product/agent-graph-prompt-configuration/passed/direction-agent-graph-prompt-configuration.md`（D150）执行，执行层自主闭环（D150→D154 补证迭代 + D157阶段三纠正闭合）：
- **后端**：`AgentGraphInterpreter` 新增 `systemPrompt`/`userPromptTemplate` 两个 config 键；`callLlmNode` 构造 SystemMessage+UserMessage 多消息列表；`{{variableName}}` 一次性纯字符串插值；空白回退；未定义变量复用 `UNDEFINED_VARIABLE`；新增 12 个测试（D150）+ D151 +5 + D152 +20。
- **前端**：`graphAdapter.ts` 新增 2 常量；`LlmPanel.vue` 新增 2 textarea；`GraphDesigner.updateNodeData` 处理 undefined 删除键；新增 6 个测试；Mock handlers 补齐图定义 CRUD+execute 端点（79f/775t）。
- **测试门**：项目级 **723 tests / 0 failures / 0 errors / 0 skipped**（sw-basic-agent 234）、前端 **79 spec files / 775 tests / 0 failures** 四连全绿；Flyway V34 零本轮迁移（历史基线，D170已晋级至755/267/V35）。
- **清单更新**：M07-F02-02 已升✅；规划确认已完成功能 **28** 个；清单终态 **✅24 / 🟦26 / ⬜40**、P6核销。主方向及三份阶段三/纠正方向均归档`passed/`；审查`receipts/planning-stage3-review-d157.md`。

---

**agent-graph-execution-observability — P7 / M07-F02-04 图执行历史与运行日志前端可观测闭环（COMPLETED，D148 功能级验收 PASSED，2026-08-20，第 27 个已完成功能）**

方向 `product/agent-graph-execution-observability/passed/direction-agent-graph-execution-observability.md`（D126）执行，执行层自主拆 Step 闭环：
- **后端验证**：零改动，复用 Step12(D70-D71) 已实现的三类只读端点 (`GET /agent/graph-executions`, `/{id}`, `/{id}/nodes`)；数据库表 V27/V28 Flyway(H2/PG 双份) 已落地。
- **前端实现**：ExecutionList.vue(分页列表、graphDefId 过滤)、ExecutionDetail.vue(详情展示、安全渲染)、NodeTrajectory.vue(节点轨迹、branchId 由后端真实返回)、路由注册（`:executionId` 参数名）、API 补充(`pageGraphExecutionsWithVersion`, `getExecutionDetail`, `listExecutionNodes`)。
- **测试门**：后端 **685/0/0/0**（sw-basic-agent 197）、前端 **78 spec files / 760 tests / 0 failures** 四连全绿、Flyway V34 零业务迁移。
- **清单更新**：M07-F02-04 保持 🟦（"运行日志查看 ✅ + 单步调试🟦"，部分完成不自动升✅）。
- **问题关闭**：I55 已关闭（M07-F02-04 运行日志前端缺口本轮闭环）。P7 运行日志子集✅已核销，单步调试继续待排期，P7 整体不核销。
- **终态**：方向归档 `product/agent-graph-execution-observability/passed/`；回执目录 `product/agent-graph-execution-observability/receipts/`（d148-functional-verification.md, d146-supplement-summary.md 等）。

---

**role-menu-permission-parity — P1 / M02-F02-01 / M02-F03-01 角色菜单/按钮权限契约一致性收口（COMPLETED，D123 规划层最终验收 PASSED + 阶段三终态同步，2026-08-20，第 26 个已完成功能）**

方向 `product/role-menu-permission-parity/ready/direction-role-menu-permission-parity.md`（D121，保持 READY——归档动作由规划层验收后执行），执行层自主拆 Step 闭环：
- **Step 1 后端契约与安全回归**：真实 API（`GET/PUT /system/role/{id}/menus` + `updateMenuIds`/`assertMutable`）逐项实证；新增 `RoleMenusContractAndSecurityTest`（13 请求级用例：契约/去重/清空/未知角色/superadmin 拒绝/admin 可写/无权限 403/未认证 401/超管旁路/租户隔离）；后端全量 **660/0/0/0**。
- **Step 2 前端 Mock + 页面闭环**：`handlers.ts` 新增 `GET/PUT /api/system/role/:id/menus`（真实状态写入 + superadmin code=400 同文案）；`seeds.ts` id 去重（菜单树 15→18、10→20）、`dataScope 5→0` 陈旧值清除、`MOCK_ROLE_MENU_BINDINGS`；`role.ts` 防腐转换；`RoleList.vue` openEdit 回填 `form.builtIn`（1 行，修复 superadmin 保护缺口）；role.spec +4 / RoleList.spec +5（真实 el-tree）/ role-menus.spec +13；前端 **72f/668t**。
- **Step 3b 补齐（BLOCKED 解除）**：后端新增 `AuthMenusContractAndSecurityTest`（11 用例：非超管正面混合行菜单树/VO 契约（按钮 component=null）/绑定删除空树/角色停用如实行为/无绑定空树/超管对照/未认证/租户隔离）→ 全量 **670/0/0/0**（110 报告文件；647+13+11，-1 历史残留 PgV33VerificationTest 已删源码）；前端 mock `/auth/menus` 修正为按会话角色过滤（超管全量/非超管按绑定/无绑定空树/撤权空树）、`/auth/me` 非超管 permissions 同源装配，新增 auth-session.spec 10 用例 → 四连 **73 spec / 678 tests / 0 failures**。
- **生产代码与 Flyway 全程零修改**（仅新增测试类 + 前端 mock/夹具/页面最小修正，均属方向 §4 范围）；2G 上限 + 前后端编译互斥满足。
- **D122 退回修正（2026-08-20，`receipts/d122-fix-receipt.md`）**：①生产 403 契约——`GlobalExceptionHandler` 新增 `AuthorizationDeniedException` 分支（HTTP 403 + body 403），移除测试专用处理器覆盖，请求级 403 走真实生产链路（sw-common +spring-security-core 编译期依赖，`GlobalExceptionHandlerTest` 2 用例）；②停用角色有效撤权——`SysMenuServiceImpl.loadMenuIdsByUserId` 与 `UserDetailsProviderImpl.loadPermissions` 对称按 `sys_role.status=1` 过滤（AuthMenus A4/A9 改为撤权生效断言）；③Mock 双角色身份——超管会话 username=superadmin/roles=['superadmin']，新增普通 `MOCK_SESSION_DATA_ADMIN`（admin 非超管、权限按绑定装配），登录三会话映射（auth-session.spec +3 用例）；④权威问题注册——I53/I54 登记 knowledge/known-issues.md + memory/issues.md。测试：后端 **674/0/0/0**（112 报告文件）、前端 **73 spec / 681 tests / 0 failures** 四连全绿；零 Flyway。
- **终态（D123 规划层最终验收 PASSED + 阶段三终态同步 COMPLETED）**：清单 M02-F02-01 / M02-F03-01 🟦→✅（**✅23/🟦27/⬜40**）；**P1 正式核销**（全部子项 I31/I36/F02/F03 已闭合）；测试基线后端 674/0/0/0、前端 73f/681t；已完成功能 **26**（本方向为第 26 个，COMPLETED）。
- **回执**：`product/role-menu-permission-parity/receipts/`（规划复验 planning-final-review-d123 + 终态同步 post-d123-terminal-sync + 历史规划回执 planning-review-d122 + 修正回执 d122-fix-receipt + step1-backend-regression + step2-frontend-closure + step3b-backend-menu-filter-evidence + step3b-frontend-mock-menu-filter + role-menu-permission-parity-completion + test-receipt + stage3-knowledge-sync）。

**pg-v13-migration-chain-repair — I52 PostgreSQL V13 迁移链 2BP01 修复（2026-08-19，D110 规划层最终验收 PASSED + 阶段三终态同步，功能 COMPLETED，I52 正式关闭）**

方向 `product/pg-v13-migration-chain-repair/ready/direction-pg-v13-migration-chain-repair.md`（D108）执行，执行层自主闭环：现场勘察（主会话直读迁移链）→ 修复实施（1 Sub Agent）→ 项目级回归（主会话）→ 知识库全量同步 + 回执：
- **根因**：form/V7 `sw_form_def.form_key ... UNIQUE`（inline UNIQUE）在 PG 创建**约束背书隐式索引** `sw_form_def_form_key_key`；root/V13:58 `DROP INDEX IF EXISTS sw_form_def_form_key_key;` 触发 **2BP01**（`cannot drop index ... because constraint ... requires it`）。H2 允许直接 DROP INDEX，故 H2 全链 33 条一直通过、缺陷仅 PG 暴露；V13 其余 8 项均安全（独立索引/约束正确写法）。
- **策略裁定（执行层）**：**修改 PG 侧 V13 第 7 项**（`DROP INDEX` → `ALTER TABLE sw_form_def DROP CONSTRAINT IF EXISTS sw_form_def_form_key_key;`，随后 `CREATE UNIQUE INDEX uk_sw_form_def_form_key (form_key, deleted)` 不变），**不新增 V34**——①PG 无已成功应用 V13 的既有库（V13 必失败）→ 修改无既有校验和/升级路径风险；②V14-V33 零引用该索引 → 无下游断裂；③新库场景 V34 永远不可达（V13 执行时即失败）。**H2 侧 V13 零改动**（双方言各按自身能力实现同一复合唯一语义）。
- **测试基建**：sw-bootstrap pom +2 test 依赖（`io.zonky.test:embedded-postgres:2.1.0` + `embedded-postgres-binaries-darwin-arm64v8:17.5.0`，exclusions 排除默认 4 平台 binaries）+ 永久 `FlywayFullChainPostgresTest`（8 用例，与 `FlywayFullChainH2Test` 对称）。
- **验证（真实 PG 17.5）**：修复前先红复现 2BP01 原文（V13:58）→ 修复后新库全链 **33 条** migrate+validate 通过 → **既有库升级夹具**（独立库 target(32) 32 条 → 全量只执行 V33 共 33）migrate+validate 通过 → 逻辑删除唯一性语义正反例（sys_user/sys_tenant 软删重建共存正例 + 23505 反例 + 重复软删 23505 边界）。
- **语义事实修正（真实 PG 引擎证伪）**：复合唯一 `(key, deleted)` 下**每业务键最多一条 deleted=1 历史**——「两条 deleted=1 共存」在 H2/PG 均不可满足（23505），正例2 调整为 sys_tenant 软删重建 + 新增重复软删边界用例固化守卫；若未来需多条软删历史共存（ruo yi 系诉求）需 partial 索引设计，属 V13 设计方案层面，超出本轮授权。
- **D109 补证（2026-08-19）**：①既有库校验和安全——git 审计链（V13 引入时 V7 inline UNIQUE 已存在，原 V13 自创建起 PG 必失败；失败迁移不落 checksum；无 tag/release/CI 发布通道）证明「登记原 V13 checksum 的环境」不存在，且新增永久守卫用例 `legacyOriginalV13Checksum_shouldFailValidateNotSilentlyPass` 证明若存在会显式 checksum mismatch 失败而非静默破坏；②跨平台可移植性——pom 改 `embedded-postgres-binaries-bom:17.5.0` 统一全平台二进制版本（dependency:tree 证明 5 平台产物均 17.5.0），移除平台 exclusions。补证后 PG 全链测试 **9** 用例、项目级 **600/0/0/0**（599+1）。
- **测试门（`MAVEN_OPTS="-Xmx2g"` 串行，互斥检测通过）**：sw-bootstrap `FlywayFullChainPostgresTest` 9/0/0、`FlywayFullChainH2Test` 11/0/0 回归零退化；项目级全量 **600/0/0/0**（105 surefire XML；591→599→600，sw-bootstrap 12→21）。
- **边界**：前端零改动；清单状态列零变化（✅21/🟦28/⬜41，I52 非清单明细行）；无业务 Java 代码改动。
- **回执**：`product/pg-v13-migration-chain-repair/receipts/`（completion + planning-review-d109 + post-d109-supplement + planning-final-review-d110 + post-d110-terminal-sync）。方向归档 `product/pg-v13-migration-chain-repair/passed/`；本同步方向验收通过后同步归档。

**agent-model-management-frontend — P5 / M07-F01-01～05 大模型管理前端闭环（执行层闭环，2026-08-19；D106 规划层验收 FAILED，主体保留，补证复验中）**

方向 `product/agent-model-management-frontend/ready/direction-agent-model-management-frontend.md`（D105，11 项验收标准）执行，执行层从工作区根以执行角色自主拆分闭环（后端 Step → 前端 Step，严格串行、2G 上限、互斥证据齐全）：
- 后端（零 Java 业务改动，提交 `d4d7dc3`）：新增 **V33 菜单/按钮权限 seed**（H2+PG 双方言逐字节一致）——菜单 id=209「大模型管理」（parent=7、permission=`agent:model:view`、component=`agent/views/ModelList`、sort=20）、按钮 id=210（`agent:model:manage`）、id=211（`agent:model:test`），仿 V31 按钮行先例 + INSERT SELECT WHERE NOT EXISTS 幂等；**不 seed sys_role_menu**（V6/V26 超管旁路决策沿用）。
- 后端验证：项目级 **584/0/0**（582+2：FlywayFullChainH2Test 11→12）、H2 新库全链 **33 迁移** + 永久测试 `upgradeChain_V32_to_V33_shouldPass` 升级链通过、PG 真实库（127.0.0.1）临时 schema V33 幂等执行通过（public 零改动）。
- 前端（提交 `e26e5f0`）：契约/API/Mock/菜单/路由/页面全闭环（ModelList 分页+名称查询+多 Key 状态、编辑表单、API Key 脱敏与空值保留旧密钥、启停、连通性测试含消息/耗时、`lockedUntil` 只读、GraphDesigner 模型下拉兼容回归）；**69f/628t**（66f/602t → +3f/+26t）2G 上限四连全绿。
- 清单 M07-F01-01～05 五行 🟦→✅（终态 **✅21/🟦28/⬜41**），P5 核销，I45 的 M07-F01 前端缺口关闭；新登记 I52（PG V13:58 2BP01 缺陷，非本轮引入，建议 V34 修复迁移，待规划层决策）。
- 回执：`product/agent-model-management-frontend/receipts/`（backend-seed-and-verify-execution.md 已提交；完成/测试回执由执行层提交）；**D106 规划层最终验收 FAILED（2026-08-19，审查 `receipts/planning-review-d106.md`）——主体与测试门保留，缺 `other` 协议与远端 4xx 可达、未认证 401、Mock 连通性语义与真实后端一致性证据；执行层补证中（后端 +7 用例 591/0/0 已跑通，前端 Mock 语义修正进行中），待补证后规划层复验**。

**bpm-h2-v8-compat — P10/I47 BPM H2 V8 迁移链兼容性修复（后端修复轮，2026-08-17，规划层最终验收 PASSED（D87/D88）并归档 `passed/`）**

方向 `product/bpm-h2-v8-compat/passed/`（2026-08-17 下发，归档）执行，执行层自主闭环：探索（1 Explore Sub Agent，8 问全答）→ 代码修复 + 测试基建 + 模块级自测（1 Sub Agent）→ 项目级全量回归（主会话）→ 知识库全量同步 + 回执：
- 根因：bpm/h2 V8 L34 与 pg/V8 L39 逐字相同的 PG 独有 partial unique index（`WHERE active=true`）——H2 2.3.232 不支持任何模式；全链 H2 Flyway 从未可跑（死 V8），28 条冒烟口径排除 bpm 两条，绑定语义零测试覆盖
- 修复（仅 h2/V8 一个生产迁移文件，pg/V8/V13/V14 零改动）：生成列等价实现——`active_key varchar(265) generated always as (case when active then (cast(tenant_id as varchar(64)) || ':' || form_key) end)`（active=true→非空唯一、false→NULL 共存）+ 唯一索引改建 active_key（索引名 `uk_sw_bpm_binding_active` 不变）+ 文件头错误断言修正；h2/V8 从未在任何 H2 库执行成功，无校验和/升级路径风险
- 测试基建最小补充：sw-bootstrap pom +junit-jupiter(test) + 永久 `FlywayFullChainH2Test`（7 目录 30 条迁移 migrate+validate，**冒烟口径 28→30**，BPM V8/V14 纳入；关键发现：flyway-core 不解析 `{vendor}`，由 Spring Boot LocationResolver 替换，测试显式替换复刻）；`BpmFormBindingServiceImplTest` 绑定语义正反例 8 用例（SQLState 23505/非 active 共存/启停切换/租户隔离）；测试 schema-h2.sql 追加与修复后 V8 逐字一致的绑定表
- 测试门（`MAVEN_OPTS="-Xmx2g"` 串行）：sw-bpm-process **58/0/0**（50→+8）→ sw-bootstrap **8/0/0**（0→8）→ 项目级全量 **543/0/0**（527+16：bpm 71→79 +8、bootstrap 0→8 +8，BUILD SUCCESS 31/31）
- 边界：PG 侧运行期语义验证依赖 PG 本地库（遗留，规划层授权后可补）；前端零改动；清单状态列无变化（I47 非清单明细行）
- 知识库全量同步（§3.3 第10项）：I47 ✅ 已修复（表条目+详细条目）、current-status（§1/§4/§5 18→19/§9 543+口径 28→30）、features/bpm-h2-v8-compat.md 新建、session-handoff 更新、requirement-pool P10 核销
- 规划层最终验收（D88，2026-08-17）：**PASSED**——六项验收方向全部满足；PG 侧运行期联调为零改动侧低风险遗留，不阻塞。归档 `product/bpm-h2-v8-compat/passed/`
- 回执：`product/bpm-h2-v8-compat/receipts/bpm-h2-v8-compat-{completion,test}.md`；阶段三同步收尾回执 `receipts/post-sync-correction.md`（2026-08-18，知识同步修正轮）

**sysrole-v5-column-alignment — P13/I26 SysRole 与 V5 列契约对齐（后端修复轮，2026-08-17，规划层最终验收 PASSED 并归档 `passed/`）**

方向 `product/sysrole-v5-column-alignment/ready/`（2026-08-17）下发，执行层自主拆 3 Step 闭环：代码修复（1 Sub Agent）→ 测试验证（1 Sub Agent）→ 知识库全量同步 + 回执：
- 探索依据：`search_fallback/p13-sysrole-v5-column-alignment.md`（3 并行 subagent：迁移链/Java 映射/测试 DDL；关键更正：I26 引用测试 DDL 位置 `schema-h2.sql L43-44`→实际 `schema-datascope-h2.sql L42-43`；裁定证据：H2 全链实际先死 P10/V8，dev H2 档当前不可达）
- 代码修复：`SysRole.java:47,51` 两处 `@TableField` 改 `built_in`/`remark`（字段名/JSON 键不变）→ `schema-datascope-h2.sql` 列名/类型/唯一索引（含 V13 deleted 形态）对齐链尾 + 头注释失真口径修正 → `AuthFlowIntegrationTest.java` 内建表/索引/INSERT（is_builtin 1→built_in true）/注释对齐 → 全仓 grep `is_builtin` 主代码/测试零残留
- 测试门（`MAVEN_OPTS="-Xmx2g"`）：sw-biz-system-biz 模块 **111/0/0**（5 个关键测试类全 PASSED，含登录装配路径）→ 项目级全量 **527/0/0 与基线持平**（BUILD SUCCESS 31/31 模块）；MP 实际生成 SQL 原文 `built_in, remark AS description` 双向闭合 V5 链尾
- Flyway 零迁移、前端零改动、P10/P12 零触碰；H2 真全链验证仍受 I47 阻断（如实分离，非本轮证据缺失）
- 知识库全量同步（§3.3 第10项）：I26 ✅ 已修复、current-status（§1/§4/§5/§9 + 计数修正 16→18）、features/sysrole-v5-column-alignment.md 新建、session-handoff 更新、requirement-pool P13 核销
- 规划层最终验收（D86，2026-08-17）：**PASSED** 并归档 `passed/`；回执：`product/sysrole-v5-column-alignment/receipts/`

**status-semantics-alignment — I51 前端状态语义对齐（前端单项目修复轮，2026-08-17 ✅）**

方向 `product/status-semantics-alignment/ready/`（2026-08-17）下发，执行层自主拆 3 段闭环：并行探索（2 Sub Agent）→ 实现（1 Sub Agent）→ 四连质量门：
- 契约核实（后端只读，零修改）：用户 sys_user=0 正常/1 停用/2 锁定（四重证据）；部门 sys_dept=0 正常/1 停用；角色/岗位=1 启用/0 停用（与前端现状一致，方向 §4 指示未动）
- 前端修正：UserList/DeptList 新建默认与 resetForm `status 1→0`、选择项/筛选/展示按契约（用户三态含锁定，tag 三分支 success/info/warning；部门两态）；新建 `modules/system/constants.ts` 集中常量收敛散落数字；seeds/handlers 的 user/dept 部分同步（role/post 未动）；user/dept API spec 夹具按新语义
- 新增测试：UserList.spec +5、DeptList.spec +2（提交/回填语义覆盖正常/停用/锁定）
- 测试门：前端四连全绿 **66f/576t**（569+7，NODE_OPTIONS=2048 全部退出 0）；后端零修改
- 知识库全量同步：known-issues I51 关闭（✅ 已修复 + 修复记录）、current-status（§1 基线 576/§2 前次验证/§4 功能追踪行/§6 已完成清单 17 条/§8 小项池移除）、features/status-semantics-alignment.md 新建、本文件更新
- 规划层最终验收（2026-08-17）：**PASSED** 并归档 `passed/`（无独立 D 编号，验收裁定见 memory/decisions.md D85 前后轮次）；回执：`product/status-semantics-alignment/receipts/`

**bpm-plugin-architecture — M04-F08-01 BPM 可插拔机制（纯重构轮，D81/D82 PASSED ✅）**

方向 D80（2026-08-15）下发，执行层自主拆 6 Step 闭环（2026-08-16）：
- 后端 3 Step：B1 NodeTypeRegistry 扩充完整注册骨架（CONDITION/EXCLUSIVE_GATEWAY/PARALLEL_GATEWAY/JOIN_GATEWAY 预留位）；B2 GraphToBpmnTranslator switch→注册表翻译（NodeTypeTranslator SPI + Map 分发，落点裁定 engine 内部不污染 -api）；B3 可插拔性证明（TEST_NODE→ServiceTask 零改动即翻译）+ adapter 审视结论（外部数据源/通知子系统不注册表化，避免过度抽象）
- 前端 3 Step：F1 DynamicField 8 类控件渲染链 registry 化（9 控件组件 + dynamic-field-registry.ts，主链/子表共用）；F2 GraphDesigner 属性面板注册表化（8 面板组件 + node-panel-registry.ts）；F3 可插拔性证明（EMAIL 控件/PROBE 面板测试注册零改动即渲染）
- 测试门：后端 **527 tests** 全绿（mvn BUILD SUCCESS，521+6）；前端 **66f/569t** 四连全绿。2026-08-17 已在正式 2G 上限下补跑 typecheck/lint/test/build，全部退出 0，测试计数持平；历史 512M OOM/1024M 临时例外已被新约束取代。
- Flyway 零迁移；知识库全量同步完成（清单 M04-F08-01 ⬜→✅ 终态 ✅12/🟦37/⬜41、I47/I48 正式登记清悬空引用）
- 规划层最终验收 **D82 PASSED**（2026-08-16）：5 项验收标准全满足；其中历史内存例外已于 2026-08-17 通过 2G 正式上限四连补验关闭。
- 归档：`product/bpm-plugin-architecture/passed/` + `receipts/bpm-plugin-architecture-completion.md`

**D83 探索三回执 + knowledge 欠账补齐（2026-08-16）**

规划层派发 3 份探索任务，执行层 6 个 Sub Agent 并行探索后汇总回执，再按 `search_task/knowledge-sync-apply.md` 落库：
- 清单 90 行全量复核：**0 行不一致**（I1 无第三次复发）；known-issues I1-I48 复核：已修复零复发、失准 7 处修正、**新登记 I49/I50/I51**（I51=前端 status 语义反转 高；I49=V29 菜单仅超管可达 中；I50=登录校验时序 低）；基线静态复核：527/66f（569=运行口径，静态 561）/清单 12·37·41/V1-V30+28/16 功能 全数核实
- 落库：known-issues.md（登记+失准修正）、current-status.md（§1/§2/§4/§5/§8/§9/§11 补同步 17 处）、session-handoff.md（本文件 §3-15 全段重写）、todo/README.md（T1/T10 删行）
- 回执：`search_fallback/{checklist-status-full-verification,known-issues-verification,baseline-static-recount,knowledge-sync-apply}.md`

---

## 2. 进行中功能

**role-menu-permission-parity（P1 / M02-F02-01 / M02-F03-01）：COMPLETED（D123 规划层最终验收 PASSED + 阶段三终态同步，2026-08-20，第 26 个已完成功能）。** 主方向已归档 `product/role-menu-permission-parity/passed/`。D122 四类偏差全部修正（生产 403 契约 / 停用角色有效撤权 / Mock 双角色身份 / I53+I54 注册），后端 **674/0/0/0**、前端 **73f/681t** 四连全绿、零 Flyway；清单 M02-F02-01/F03-01 🟦→✅（✅23/🟦27/⬜40）、**P1 正式核销**。规划复验 `receipts/planning-final-review-d123.md`；终态同步回执 `receipts/post-d123-terminal-sync.md`；历史回执 `product/role-menu-permission-parity/receipts/`（planning-review-d122、d122-fix-receipt、step1/step2/step3b×2、completion、test-receipt、stage3-knowledge-sync）。

下一候选按 [[handoff]] 候选池（2026-08-19 D121 轮后更新）：M01/M02 虚高补齐已随 P1 核销退出候选（I31/I36/F02/F03 全部闭合）、M07 补全（F02-02 Prompt 配置/F02-04 运行日志+单步调试/F04-02 Token 统计；F01 前端管理页已闭环）、M07-F03/F04 新功能、IoT/OpenAPI 模块落地、数据权限遗留与停用即时生效——**PG 侧全链直跑已由 pg-v13-migration-chain-repair 修复关闭（I52，2026-08-19，D110 PASSED + COMPLETED）**；I49 已由 admin-role-governance D96 关闭，I31 已由 department-query-filtering 关闭，I36 已由 user-group-membership 关闭（D117 PASSED + 阶段三 COMPLETED，2026-08-19），P28 已核销。

---

## 3. 最终状态

**agent-graph-step-debugging**：**COMPLETED ✅（D180 规划层最终验收 15/15 PASSED + 终态同步，2026-08-23，第30个已完成功能）** — P7/M07-F02-04 图单步调试；D175方向 → D176—D179补证迭代（标准1—13锁定 + G14 唯一计数 `755+72=827` 严格勾稽、完整工具族实际互斥 + 2G 串行门禁 + G15 阶段三实际落盘）→ D180 15/15 最终验收。正式基线后端 **827/0/0/0（agent 338，Surefire XML 119 文件）**、前端 **86f/850t**、Flyway **V36** 双方言36条；P7 已核销、M07-F02-04 升✅、清单 **✅26/🟦24/⬜40**、功能数 **30**；主方向归档`passed/`；终态同步回执已提交，待规划层最终复验与归档（终态同步方向`ready/direction-post-d180-terminal-sync.md`）；审查`receipts/planning-final-review-d180.md`
**agent-token-usage-observability**：**COMPLETED ✅（D170功能级 + D172阶段三 + D174最终验收，13/13，2026-08-22，第29个已完成功能）** — P8/M07-F04-02 Token 统计与会话查看；功能级基线后端755/0/0/0（agent267）、前端82f/815t四门全绿、Flyway V35双方言35条全链；清单25/25/40、P8已核销、M07-F04-02✅；方向`passed/`；审查`receipts/planning-final-review-d174.md`
**agent-graph-prompt-configuration**：**COMPLETED ✅（D154功能级PASSED + D157阶段三最终复验PASSED，2026-08-21，第28个已完成功能）** — M07-F02-02 图节点 Prompt 配置；D150主体保留 + D151/D152/D153补证迭代 + D154 12项业务标准全部通过；D155/D156阶段三问题（提前宣告COMPLETED/提前归档/全文未收敛、提交后当前态残留）已由 D157 纠正闭合。后端723（agent234）/ 前端79f/775t / Flyway V34；清单✅24/🟦26/⬜40、功能数28、P6核销；主方向及三份阶段三/纠正方向均归档`passed/`；审查`receipts/planning-stage3-review-d157.md`）
**role-menu-permission-parity**：**COMPLETED** ✅ — P1/M02-F02-01/F03-01 角色菜单/按钮权限契约一致性收口（D123 规划层最终验收 PASSED + 终态同步，2026-08-20；D121 执行层 PASSED → D122 规划终验 FAILED → 退回修正：生产 403 契约 / 停用角色有效撤权 / Mock 双角色身份 / I53+I54 注册；后端 **674** / 前端 **73f/681t** / 零 Flyway；清单 M02-F02-01/F03-01 🟦→✅、P1 正式核销、功能数 26；方向归档 `product/role-menu-permission-parity/passed/`；规划复验 `planning-final-review-d123.md`、终态同步回执 `post-d123-terminal-sync.md`）
**agent-model-management-frontend**：**COMPLETED** ✅ — P5/M07-F01-01～05 大模型管理前端闭环（D107 补证复验 PASSED，2026-08-19；后端 591 / 前端 69f/628t / V33 迁移；P5 核销、I45 的 M07-F01 缺口关闭获规划确认；方向归档 `product/agent-model-management-frontend/passed/`）
**department-query-filtering**：**COMPLETED** ✅ — M01-F01-04/I31 部门名称/状态条件查询（2026-08-18，D103 复验 + D104 最终验收 PASSED；后端 582 / 前端 66f/602t / Flyway 零迁移；清单 M01-F01-04 🟦→✅，I31 关闭；方向归档 `product/department-query-filtering/passed/`）
**admin-role-governance**：**PASSED** ✅ — P24/I49 不可变超管与普通管理员治理（D96，2026-08-18，后端 551 / 前端 66f/576t / H2 全链 31；阶段三知识同步后由规划层完成最终状态收尾）
**bpm-h2-v8-compat**：**COMPLETED** ✅ — 后端修复轮 + D87/D88 规划层最终验收 PASSED（2026-08-17，后端 543 / H2 全链 30，I47/P10 核销）
**sysrole-v5-column-alignment**：**COMPLETED** ✅ — 后端修复轮 + D86 规划层最终验收 PASSED（2026-08-17，后端 527，I26 核销）
**status-semantics-alignment**：**COMPLETED** ✅ — 前端修复轮 PASSED（2026-08-17，前端 66f/576t，I51 核销）
**bpm-plugin-architecture**：**COMPLETED** ✅ — 6 Step 闭环 + D82 规划层最终验收 PASSED（2026-08-16，后端 527 / 前端 66f/569t）
**data-scope-enforcement**：**COMPLETED** ✅ — 五档数据权限端到端落地（D79 PASSED，2026-08-15，后端 521）
**checklist-gap-hardening**：**COMPLETED** ✅ — 第一批安全+可达性（D76 PASSED，2026-08-13，I33/I43/I44 修复）
**agent-model-orchestration**：**COMPLETED** ✅ — M07-F01/F02/F04（D53-D71，2026-08-12，Steps 1-12 全部 PASSED）
**feature-checklist-sync**：**COMPLETED** ✅ — 清单二次核实与同步（D72/D73 PASSED，2026-08-12）
**process-monitoring**：**COMPLETED** ✅ — M04-F06-01 首批 2/4 能力（流程图高亮 + 流转记录，2026-07-30）
**bpmn-adapter**：**COMPLETED** ✅ — Steps 0-3 PASSED，Step 4 SUPERSEDED（由 process-monitoring 承接）

---

## 4. 本轮做了什么

### bpm-plugin-architecture 闭环（2026-08-16，D81 执行层 + D82 规划层验收）
- 后端 B1-B3（提交 `7dacc3f`/`dd59896`/`b9adaba`）：NodeTypeRegistry 4 预留位 → NodeTypeTranslator SPI 注册表翻译 → TEST_NODE 可插拔性证明
- 前端 F1-F3（提交 `a56c5eb`/`ba144ce`/`3d6fa51`）：DynamicField registry 化 → 属性面板注册表化 → EMAIL/PROBE 证明
- 测试门：后端 527/0/0（+6）+ 前端 66f/569t（+3f/+17t）+ Flyway 零迁移
- 知识库同步（§3.3 第 10 项）：清单 M04-F08-01 ⬜→✅、I47/I48 正式登记、features 更新

### D83 探索三回执回收（2026-08-16）
- 规划层裁定（memory/decisions.md D83）：90/90 零不一致、基线全数核实、knowledge 欠账 17 处、新登记 I49/I50/I51、失准 7 处修正方案
- 执行层落库（本任务书）：known-issues / current-status / session-handoff / todo 四处全部同步完成

---

## 5. 各 Step 完成情况（bpm-plugin-architecture）

| Step | 内容 | 域 | 状态 | 关键证据 |
|:----:|------|:--:|:----:|----------|
| B1 | NodeTypeRegistry 扩充 4 预留位（CONDITION/EXCLUSIVE_GATEWAY/PARALLEL_GATEWAY/JOIN_GATEWAY） | 后端 | **PASSED** ✅ | 后端 521→524（+3） |
| B2 | GraphToBpmnTranslator switch→NodeTypeTranslator SPI 注册表翻译 | 后端 | **PASSED** ✅ | 后端 524→525（+1）；TEST_NODE→ServiceTask 零改动翻译 |
| B3 | 可插拔性证明 + adapter 审视（外部数据源/通知子系统不注册表化） | 后端 | **PASSED** ✅ | 后端 525→527（+2） |
| F1 | DynamicField 9 控件渲染链 registry 化（dynamic-field-registry.ts，主链/子表共用） | 前端 | **PASSED** ✅ | 63f/552t→64f/558t（+6） |
| F2 | GraphDesigner 属性面板注册表化（8 面板 + node-panel-registry.ts `<component :is>`） | 前端 | **PASSED** ✅ | 64f/558t→65f/564t（+6） |
| F3 | 可插拔性证明（EMAIL 控件/PROBE 面板测试注册即渲染）+ 四连全绿 | 前端 | **PASSED** ✅ | 65f/564t→66f/569t（+5） |

---

## 6. 实际修改范围（bpm-plugin-architecture 摘要）

| 文件 | 域 | 操作 | 摘要 |
|------|:--:|:---:|------|
| `sw-bpm-engine/.../registry/NodeTypeRegistry.java` | 后端 | 扩充 | +4 预留位 |
| `sw-bpm-engine/.../translator/NodeTypeTranslator.java` + `GraphToBpmnTranslator.java` | 后端 | 新建/改造 | switch→注册表分发（Map<String,NodeTypeTranslator>） |
| `sw-bpm-engine/.../translator/` 各节点翻译器 | 后端 | 新建 | 按节点类型注册的翻译器实现 |
| `smart-workflow-web/src/modules/form/.../dynamic-field-registry.ts` + 9 控件组件 | 前端 | 新建/改造 | 控件渲染链注册表化 |
| `smart-workflow-web/src/modules/agent/.../node-panel-registry.ts` + 8 面板组件 | 前端 | 新建/改造 | 属性面板注册表化 |
| `GraphDesigner.vue` / `DynamicField.vue` | 前端 | 改造 | `<component :is>` 动态挂载 |

---

## 7. 测试和验收结果

| 轮次 | 新增测试 | 全量基线 | 验收结论 |
|:---:|:---:|:---:|:---:|
| B1-B3 | 后端 +6 | 项目级 **527 tests / 0 failures**（mvn BUILD SUCCESS 12:07min） | **PASSED**（D81 执行层闭环） |
| F1-F3 | 前端 +17（+3 spec） | **66 files / 569 tests** 四连全绿 | **PASSED**（D81 执行层闭环） |
| 规划层最终验收 | — | 同左 | **PASSED**（D82，5/5 验收标准） |
| D83 静态复核 | — | 527 逐模块 @Test 复核 / 66f（静态 561+8 循环展开）/ V1-V30 连续 / 28 冒烟口径 | **CONFIRMED**（2026-08-16） |

---

## 8. 关键设计决策

| 决策 | 内容 | 知识库 |
|------|------|--------|
| D80 | bpm-plugin-architecture 需求方向下发（5 项验收标准；非目标：设计器本体/新节点/热插拔/flow-graph 扩展） | [[decisions]] |
| D81 | bpm-plugin-architecture 执行层闭环（6 Step 全 PASSED） | memory/decisions.md |
| D82 | bpm-plugin-architecture 最终验收 **PASSED**；批准披露偏差 2 项；新宪法条款「前后端编译互斥」入库 | memory/decisions.md |
| D83 | 三份探索回执回收裁定：90/90 零不一致、基线全数核实、I49/I50/I51 新登记、失准 7 处修正、knowledge 欠账委派补同步 | memory/decisions.md |
| D79 | data-scope-enforcement 最终验收 PASSED；编号冲突裁定（memory I46→I48） | memory/decisions.md |

---

## 9. 当前系统状态

全部 **29** 个已完成功能（规划确认，含 agent-token-usage-observability D170+D172 PASSED 13/13）：

1-8. Walking Skeleton → sys-mgmt-crud → bpm-task-center → storage-multi-provider → job-scheduler → kb-verification → auth-seam-completion → feature-checklist-sync
9. ✅ vue-flow-adapter（2026-07-25）
10. ✅ bpmn-adapter（2026-07-26）
11. ✅ process-monitoring（2026-07-30）
12. ✅ checklist-gap-hardening（2026-08-13）
13. ✅ data-scope-enforcement（2026-08-15）
14. ✅ notify-frontend（2026-07-15）
15. ✅ agent-model-orchestration（2026-08-12）
16. ✅ bpm-plugin-architecture（2026-08-16，D82 PASSED）
17. ✅ status-semantics-alignment（2026-08-17，I51）
18. ✅ sysrole-v5-column-alignment（2026-08-17，D86 PASSED，I26）
19. ✅ bpm-h2-v8-compat（2026-08-17，D87/D88 PASSED，I47/P10）
20. ✅ admin-role-governance（2026-08-18，D96 PASSED，P24/I49）
21. ✅ user-org-association-query（2026-08-18，D101 PASSED，阶段三同步 COMPLETED）
22. ✅ department-query-filtering（2026-08-18，D103 复验 + D104 最终验收 PASSED；I31 关闭，清单 M01-F01-04 🟦→✅）
23. ✅ agent-model-management-frontend（2026-08-19，D107 复验 COMPLETED；P5/M07-F01-01～05，后端 591、前端 69f/628t、V33）
24. ✅ pg-v13-migration-chain-repair（2026-08-19，D110 PASSED + 阶段三 COMPLETED；I52 关闭）
25. ✅ user-group-membership（2026-08-19，D117 PASSED + 阶段三 COMPLETED；P28/I36，功能数 25）
26. ✅ role-menu-permission-parity（COMPLETED，D123 规划层最终验收 PASSED + 终态同步，2026-08-20）（D121 执行层 PASSED → D122 规划终验 FAILED → 退回修正完成；P1/M02-F02-01/F03-01，后端 674、前端 73f/681t、零 Flyway；四类偏差：生产 403 契约 / 停用角色有效撤权 / Mock 双角色身份 / I53+I54 注册；清单 M02-F02-01/F03-01 🟦→✅、**P1 正式核销**、功能数 26；方向归档 `passed/`）
27. ✅ agent-graph-execution-observability（COMPLETED，D148 功能级 PASSED，2026-08-20，第 27 个）（P7/M07-F02-04 图执行历史与运行日志前端可观测闭环，后端零改动复用 Step12 三类端点，前端 ExecutionList/Detail/NodeTrajectory 全链闭环；后端 **685/0/0/0**（sw-basic-agent 197）、前端 **78f/760t** 四门全绿、Flyway V34 零业务迁移；清单 M07-F02-04 保持 🟦（运行日志查看✅ + 单步调试🟦）；P7 运行日志子集✅已核销，单步调试继续待排期，P7 整体不核销；方向归档 `passed/`）
28. ✅ agent-graph-prompt-configuration（COMPLETED，D154功能级PASSED + D157阶段三最终复验PASSED，2026-08-21，第28个已完成功能）（M07-F02-02 图节点 Prompt 配置；后端723/0/0/0（agent234）、前端79f/775t四门全绿、Flyway V34零本轮迁移；清单✅24/🟦26/⬜40、功能数28、P6核销；主方向及三份阶段三/纠正方向均归档`passed/`；审查`receipts/planning-stage3-review-d157.md`）
29. ✅ agent-token-usage-observability（P8 / M07-F04-02 Token 统计与会话查看；**后端 755/0/0/0（agent 267）、前端 82f/815t、Flyway V35**）（**D170+D172+D174 PASSED，13/13，第29个已完成功能**）
30. ✅ agent-graph-step-debugging（P7 / M07-F02-04 图单步调试：调试会话/断点/步进/引擎/安全/既有入口闭环；**后端 827/0/0/0（agent 338）、前端 86f/850t、Flyway V36**）（**D180 规划层最终验收 15/15 PASSED + 终态同步，P7 已核销、M07-F02-04 升 ✅、清单 ✅26/🟦24/⬜40、功能数 30，第 30 个已完成功能，2026-08-23**）

- 后端：项目级 **827 tests**（CONFIRMED 2026-08-23 agent-graph-step-debugging D180 最终验收 PASSED：sw-basic-agent 338，Surefire XML 119 叶文件，`755+72=827` 勾稽（71 调试测试 + 1 V36 PG），2G 串行门禁 16:29:39—16:30:36 完整工具族实际互斥零快照；**正式基线**）
- 前端：**86 spec files / 850 tests** 四连全绿（CONFIRMED 2026-08-23 agent-graph-step-debugging D180；演进 82f/815t → 86f/850t；**正式基线**）
- 功能清单（规划确认+阶段三已同步）：**✅26 / 🟦24 / ⬜40 共 90 行**（M07-F02-02 ✅（D157）、M07-F04-02 ✅（D170+D172）、M07-F02-04 ✅（D180））
- Flyway：V1-V36 连续（V36 已占）；**双方言真实全链口径 36 迁移**——H2（7 目录，永久测试 `FlywayFullChainH2Test`）+ V33→V36 / V34→V36 升级链；**PG 侧全链 36 条直跑已修复（I52 关闭，D110 COMPLETED）**——`FlywayFullChainPostgresTest`（zonky embedded-postgres PG 17.5）新库全链 36 条 migrate+validate + 既有库升级夹具 + 原 V13 checksum 守卫 + 语义正反例；平台二进制 `embedded-postgres-binaries-bom:17.5.0` 统一
- 已完成功能：**32 个规划确认**（notify-management-closure D210 COMPLETED 为第32个；agent-tool-configuration-frontend D203 为第31个；agent-graph-step-debugging D180 为第30个）
- 进行中业务功能：无（agent-graph-step-debugging D180 15/15 PASSED + 终态同步完成，终态同步回执已提交，待规划层最终复验与归档）【历史记录：D180 时期，2026-08-23】

---

## 10. 还有什么没做

### 候选需求池（2026-08-21 D156 复验后更新，规划层选方向用）
1. ~~M01/M02 其余虚高要素补齐~~ — **P1 已核销（2026-08-20，role-menu-permission-parity D123 规划层最终验收 PASSED + 终态同步：I31/I36/F02/F03 全部子项闭合），M02-F02-01/F03-01 已 ✅，本条不再作为候选**（I31/I32/I34/I35 已关闭，I36 已由 user-group-membership 关闭，I40 归 M03）
2. **M07 补全** — F02-02 Prompt 配置（**COMPLETED，D154+D157，第28个**）、**F02-04 单步调试（COMPLETED，D180 15/15 PASSED + 终态同步，P7 已核销、M07-F02-04 升✅、第30个，2026-08-23）**、F04-02 Token 统计（**COMPLETED，D170+D172+D174，13/13，第29个**；F01 前端管理页已由 agent-model-management-frontend 闭环）。**M07 F01—F04 全部明细已闭环**（F03 助手配置/知识库/对话窗口仍为待开发新功能）
3. **M07-F03/F04 新功能** — 助手配置/F03-03 知识库 RAG/F04-01 对话窗口 SSE（均零代码）
4. **IoT / OpenAPI 模块落地** — 仅骨架（M08 13 行 + M09 8 行全 ⬜ 无虚低，D83 复核确认）
5. **M04-F06-01 后续批次** — 耗时分析 + 流程干预（剩余 2/4 子能力）
6. **小项池** — 数据权限遗留（部门档 deleted 过滤/job 非分页入口/PG 联调验证）、停用即时生效（JWT 过滤器层）——**PG 侧全链直跑已由 pg-v13-migration-chain-repair 修复关闭（I52，2026-08-19，执行层闭环待规划层验收）**（I51 已于 2026-08-17 status-semantics-alignment 修复关闭；I26/I47 已于 2026-08-17 分别由 sysrole-v5-column-alignment 与 bpm-h2-v8-compat 修复核销；I49 已由 admin-role-governance D96 关闭）

### 已知未做事项
- 表单删除（M03-F02-01，I39）等 I31-I45 待修复项逐条见 [[known-issues]]（I31 已由 department-query-filtering 关闭；M07-F01-01～05 已由 agent-model-management-frontend 闭环（D107 COMPLETED）；M02-F02/F03 已由 role-menu-permission-parity 闭合（D123 COMPLETED）；I36 已由 user-group-membership 关闭；I41/I42 已由 notify-management-closure 闭环（D210 COMPLETED））
- 停用前已签发 access token 900s 窗口内仍有效（如需即时生效需在 JWT 过滤器层单独排期）

---

## 11. 已知问题和风险

| # | 问题 | 严重程度 | 说明 |
|---|------|:--------:|------|
| I52 | PG V13:58 DROP INDEX 报 2BP01——PG 侧全链 V1→V33 无法在真实库直跑（H2 全链不受影响） | 中 | ✅ **已关闭**（2026-08-19 pg-v13-migration-chain-repair：PG 侧 V13 第 7 项 DROP INDEX→DROP CONSTRAINT，H2 零改动；PG 新库全链 33 条 migrate+validate + 既有库升级夹具 + 原 V13 checksum 守卫 + 语义正反例；D110 PASSED + 阶段三同步 COMPLETED，项目级 600/0/0） |
| I45 | M07/M04/M05/M06/M09/M10 虚低 15 条汇总 | 低 | ◐ 部分关闭（M07-F01-01～05 前端缺口已闭环（D107）；M07-F02-02 Prompt 配置已闭环（D154+D157 COMPLETED）；M07-F02-04 运行日志+单步调试已闭环（D148+D180 COMPLETED）；M07-F04-02 Token 统计已闭环（D170+D174 COMPLETED）；M05-F01-02/F01-03 已闭环（D210 COMPLETED）；其余缺口待排期） |
| I51 | 前端 status 语义与后端相反（UI 新建用户无法登录/停用不阻断登录） | 高 | ✅ **已修复**（2026-08-17 status-semantics-alignment：用户/部门页按后端契约修正，66f/576t 四连全绿；角色/岗位未动） |
| I26 | SysRole 列名与 V5 迁移不一致（全链 Flyway 环境必崩，测试 DDL 掩盖） | 高 | ✅ **已修复**（2026-08-17 sysrole-v5-column-alignment，D86 PASSED：实体/测试 DDL 对齐 V5 链尾 `built_in`/`remark`） |
| I49 | V29 菜单未 seed sys_role_menu（job/storage 仅超管可达） | 中 | ✅ 已关闭（admin-role-governance，D96 PASSED，方向已归档） |
| I31 | M01-F01-04 部门查询虚高（仅全量树查询、无条件筛选） | 低 | ✅ **已关闭**（2026-08-18 department-query-filtering：name/status 条件 + 祖先补全树形结果，582/0/0 + 66f/602t，清单 M01-F01-04 🟦→✅） |
| I47 | bpm/h2 V8 partial index 不兼容 H2（全链迁移从未可跑） | 中 | ✅ **已修复**（2026-08-17 bpm-h2-v8-compat，D88 PASSED：生成列等价实现 + 永久全链测试 30 条） |
| I50 | 登录状态校验在密码匹配之后（时序/资源） | 低 | D83 新登记 |
| I48 | flow-graph adapter 契约限制（无边点击/无命令式通道） | 低 | 绕行生效，扩展待评估 |
| I30 | ~~mock BPMN XML 最简模板~~ | — | ✅ 已满足可关闭（D83 复核），todo T10 已删 |
| I2 | ~~refresh token seam~~ | — | ✅ 已修复（2026-07-22），todo T1 已删 |

---

## 12. 下一轮要做什么

**notify-management-closure：D210 功能级 PASSED + 阶段三终态同步，COMPLETED（2026-08-25，第32个已完成功能）**——M05-F01-02升✅、M05-F01-03升✅、M05-F01-01保持🟦（批量发送仍待排期）、I41/I42关闭；正式基线后端827/0/0/0（agent338）、前端100f/988t、V37；清单✅29/🟦21/⬜40、功能数32。主方向与终态同步方向均归档`passed/`。

**agent-tool-configuration-frontend：COMPLETED（D203功能级12/12 PASSED + D207阶段三终态8/8 PASSED，2026-08-25，第31个）**——P48已核销、M07-F03-02升✅、清单✅27/🟦23/⬜40、功能数31；正式基线后端827/Agent338、前端100f/981t（D203锁定）、V37。

**agent-graph-step-debugging：COMPLETED（D180功能15/15 + D183终态8/8，2026-08-23，第30个）**——P7已核销、M07-F02-04升✅、清单✅26/🟦24/⬜40、功能数30。

**agent-token-usage-observability：COMPLETED（D170+D172+D174，13/13，2026-08-22，第29个）**——P8已核销、M07-F04-02✅、清单✅25/🟦25/⬜40、功能数29。

---

**agent-graph-execution-observability：COMPLETED（D148 功能级 PASSED，2026-08-20，第 27 个）**——清单 M07-F02-04 保持 🟦（运行日志查看✅ + 单步调试🟦）、P7 运行日志子集✅已核销、单步调试继续待排期、P7 整体不核销；方向归档 `product/agent-graph-execution-observability/passed/`。后端基线 **685/0/0/0**、前端基线 **78f/760t**。

---

## 13. 下一轮要达到什么结果

取决于规划层选定的下一功能。按 system.md §3 三阶段流程推进：探索（search_task 委派制）→ Step 拆解 → 执行验收 → 收尾归档（§3.3 第 10 项知识库全量同步为强制项）。

---

## 14. 下一轮开始前必须读取的知识文件

```
1. system.md
2. knowledge/current-status.md
3. knowledge/session-handoff.md                     ← 本文件
4. knowledge/known-issues.md                        ← I1-I55（I41/I42已由notify-management-closure闭环（D210）；I45：M07-F01已闭环、M07-F02-02已COMPLETED（D157）、M07-F02-04已COMPLETED（D180）、M07-F04-02已COMPLETED（D174）、M05-F01-02/F01-03已COMPLETED（D210）；I52 PG V13 2BP01已修复关闭；I55 M07-F02-04运行日志已关闭）
5. knowledge/features/notify-management-closure.md    ← 最近完成功能（P3/I41/I42/M05，D210 PASSED，第32个已完成功能）
6. knowledge/features/agent-graph-prompt-configuration.md ← 上一功能（M07-F02-02，D154+D157 COMPLETED，第28个）
7. knowledge/features/role-menu-permission-parity.md ← 第 26 个完成功能（P1/M02-F02-01/F03-01，D123 COMPLETED）
8. knowledge/features/agent-model-orchestration.md  ← M07 全链（详情在 product/agent-model-orchestration/passed/）
9. memory/handoff.md                                ← 基线/候选池/启动提示词（memory 为最新权威）
10. knowledge/shared-constraints.md
```

---

## 15. 新会话启动提示词

```
你是 Smart-WorkFlow 根目录规划代理。请按 system.md §0.2 声明角色并读取 `roles/planner.md`，再按该文件 §10 执行新会话恢复。

最新状态：
- notify-management-closure（P3 / I41 / I42 / M05 通知管理缺口闭环）**COMPLETED（D210 功能级 PASSED + 阶段三终态同步，2026-08-25，第32个）**——M05-F01-02/F01-03升✅、I41/I42关闭、清单✅29/🟦21/⬜40、功能数32；正式基线后端827/0/0/0（agent338）、前端100f/988t、V37。审查`product/notify-management-closure/receipts/planning-final-review.md`
- agent-tool-configuration-frontend（P48 / M07-F03-02）**COMPLETED（D203 12/12 PASSED + D207 终态8/8 PASSED，2026-08-25，第31个）**——P48已核销、M07-F03-02✅、清单✅27/🟦23/⬜40、功能数31
- agent-graph-step-debugging（P7 / M07-F02-04）**COMPLETED（D180 15/15 + D183 终态8/8，2026-08-23，第30个）**——P7已核销、M07-F02-04✅、清单✅26/🟦24/⬜40、功能数30
- agent-token-usage-observability（P8 / M07-F04-02）**COMPLETED（D170+D172+D174，13/13，2026-08-22，第29个）**——P8已核销、M07-F04-02✅、清单✅25/🟦25/⬜40、功能数29
- 基线：后端 **827 tests**（agent338）/ 前端 **100f/988t** 四门全绿；清单 **✅29/🟦21/⬜40** 共90行；Flyway **V37**；已完成功能 **32**
- 执行约束：本机物理内存 1.6G——mvn 与 pnpm/npm 编译严格串行，禁并行编译（已入宪法）
- 候选池：**P1/P5/P6/P7/P8 已核销**、M07 补全已闭环（F02-02/F02-04/F04-02）、M05-F01-02/F01-03已闭环（D210）、M07-F03/F04新功能、IoT/OpenAPI、数据权限遗留/停用即时生效——PG侧全链直跑已由pg-v13修复关闭（I52）

当前功能：无（notify-management-closure 已完成第32个，规划层比较并选择下一唯一功能）
```

---

> 最后更新：2026-08-25
> 最新功能：**notify-management-closure** — P3 / I41 / I42 / M05 通知管理缺口闭环（**COMPLETED，D210 功能级 PASSED + 阶段三终态同步，2026-08-25，第32个**；正式基线后端827/agent338 / 前端100f/988t / Flyway V37；M05-F01-02/F01-03✅、I41/I42关闭、清单✅29/🟦21/⬜40、功能数32；主方向与终态同步方向均归档`passed/`；审查`receipts/planning-final-review.md`）
> 上一功能：**agent-tool-configuration-frontend** — P48 / M07-F03-02 工具与函数调用前端配置闭环（**COMPLETED，D203 12/12 PASSED + D207 终态8/8 PASSED，第31个**）
> 测试基线：后端 CONFIRMED 827 tests（agent 338）· 前端 CONFIRMED 100 files / 988 tests（**D210 正式基线**）
> 进行中：无（规划层比较并选择下一唯一功能）
