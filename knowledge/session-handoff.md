# 会话交接状态

> 工作区统一知识库 — 最新跨会话交接状态。
> 每个功能完成或会话结束时更新。本文件为**当前有效版本**，旧版本不保留。
>
> 新会话启动时，优先读取本文件以恢复上下文。
>
> ⚠️ **2026-08-14 角色制上线**：本文件历史记录中的"使用模型"字段（如 deepseek-v4-pro/flash）为**当时执行事实**，仅作历史存档。当前权限按会话角色（规划/执行/管理员）划分，与模型无关（见根目录 `system.md` §0.2）。新记录不再填写模型字段。

---

## 1. 最新完成功能

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

**无进行中业务功能。** agent-model-management-frontend（P5 / M07-F01-01～05）已由执行层完成前后端闭环（2026-08-19），完成回执与测试回执提交至 `product/agent-model-management-frontend/receipts/`，**D106 规划层最终验收 FAILED（2026-08-19，审查 `receipts/planning-review-d106.md`）——主体与测试门保留，缺 `other` 协议与远端 4xx 可达、未认证 401、Mock 连通性语义与真实后端一致性证据；执行层补证中（后端 +7 用例 591/0/0 已跑通，前端 Mock 语义修正进行中），待补证后规划层复验**（复验通过后 P5 核销终态；P5 需求池当前状态为 FAILED/未核销）。下一需求由规划层复验后从候选池另行选定。

下一候选按 [[handoff]] 候选池（2026-08-19 更新）：M01/M02 其余虚高补齐（**I36 用户组绑定已由 user-group-membership 关闭（D117 PASSED + 阶段三 COMPLETED，2026-08-19），P28 已核销**；M02-F02/F03 权限配置入口仍为并列候选）、M07 补全（F02-02 Prompt 配置/F02-04 运行日志+单步调试/F04-02 Token 统计；F01 前端管理页已闭环）、M07-F03/F04 新功能、IoT/OpenAPI 模块落地、数据权限遗留与停用即时生效——**PG 侧全链直跑已由 pg-v13-migration-chain-repair 修复关闭（I52，2026-08-19，D110 PASSED + COMPLETED）**；I49 已由 admin-role-governance D96 关闭，I31 已由 department-query-filtering 关闭。

---

## 3. 最终状态

**agent-model-management-frontend**：执行层闭环、**D106 规划层验收 FAILED（复验中，候选终态）** — P5/M07-F01-01～05 大模型管理前端闭环（2026-08-19，后端 584 / 前端 69f/628t / V33 迁移；主体与测试门保留，缺 `other` 与远端 4xx 可达、未认证 401、Mock 连通性语义与真实后端一致性证据；清单 M07-F01-01～05 🟦→✅、P5 核销、I45 的 M07-F01 缺口关闭均为执行层候选终态；审查 `product/agent-model-management-frontend/receipts/planning-review-d106.md`，执行层补证中；遗留 I52=PG V13:58 2BP01 缺陷建议 V34 修复迁移）
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

全部 **23** 个功能已完成闭环：

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
23. 🔄 agent-model-management-frontend ← **最新完成（D106 复验中）**（2026-08-19 执行层闭环；P5/M07-F01-01～05，后端 584、前端 69f/628t、V33；**D106 规划层验收 FAILED，主体与测试门保留，执行层补证中：后端 +7 用例 591/0/0 已跑通，前端 Mock 语义修正进行中**）

- 后端：项目级 **584 tests**（CONFIRMED 2026-08-19 agent-model-management-frontend 验证：582+2，BUILD SUCCESS，0 failures/0 errors/0 skipped）
- 前端：**69 spec files / 628 tests** 四连全绿（CONFIRMED 2026-08-19 agent-model-management-frontend；66f/602t → +3f/+26t，运行口径）
- 功能清单：**✅21 / 🟦28 / ⬜41 共 90 行**（2026-08-19 同步：M07-F01-01～05 五行 🟦→✅，无关行零漂移）
- Flyway：V1-V33 连续（V33 已占）；**双方言真实全链口径 33 迁移**——H2（7 目录，永久测试 `FlywayFullChainH2Test` 11 用例）+ V32→V33 升级链；**PG 侧全链直跑已修复（I52 关闭，D110 COMPLETED）**——`FlywayFullChainPostgresTest`（zonky embedded-postgres PG 17.5，9 用例）新库全链 33 条 migrate+validate + 既有库升级夹具 + 原 V13 checksum 守卫 + 语义正反例；平台二进制 `embedded-postgres-binaries-bom:17.5.0` 统一
- 已完成功能：24 个
- 进行中业务功能：无（pg-v13-migration-chain-repair 已 COMPLETED，D110 终态同步完成）

---

## 10. 还有什么没做

### 候选需求池（2026-08-19 D105 轮后更新，规划层选方向用）
1. **M01/M02 其余虚高要素补齐** — **I36 用户组绑定已由 user-group-membership 关闭（D117 PASSED + 阶段三 COMPLETED，2026-08-19），P28 已核销**；M02-F02/F03 权限配置入口仍为并列候选（I31/I32/I34/I35 已关闭，I40 归 M03）
2. **M07 补全** — F02-02 Prompt 配置字段、F02-04 运行日志页+单步调试、F04-02 Token 统计（缺口均由 D83 回执确认；F01 前端管理页已由 agent-model-management-frontend 闭环）
3. **M07-F03/F04 新功能** — 助手配置/F03-03 知识库 RAG/F04-01 对话窗口 SSE（均零代码）
4. **IoT / OpenAPI 模块落地** — 仅骨架（M08 13 行 + M09 8 行全 ⬜ 无虚低，D83 复核确认）
5. **M04-F06-01 后续批次** — 耗时分析 + 流程干预（剩余 2/4 子能力）
6. **小项池** — 数据权限遗留（部门档 deleted 过滤/job 非分页入口/PG 联调验证）、停用即时生效（JWT 过滤器层）——**PG 侧全链直跑已由 pg-v13-migration-chain-repair 修复关闭（I52，2026-08-19，执行层闭环待规划层验收）**（I51 已于 2026-08-17 status-semantics-alignment 修复关闭；I26/I47 已于 2026-08-17 分别由 sysrole-v5-column-alignment 与 bpm-h2-v8-compat 修复核销；I49 已由 admin-role-governance D96 关闭）

### 已知未做事项
- 表单删除（M03-F02-01，I39）、消息删除（M05-F01-02，I41）等 I31-I45 待修复项逐条见 [[known-issues]]（I31 已由 department-query-filtering 关闭；M07-F01-01～05 已由 agent-model-management-frontend 执行层候选关闭，D106 复验通过前不算规划层确认）
- 停用前已签发 access token 900s 窗口内仍有效（如需即时生效需在 JWT 过滤器层单独排期）

---

## 11. 已知问题和风险

| # | 问题 | 严重程度 | 说明 |
|---|------|:--------:|------|
| I52 | PG V13:58 DROP INDEX 报 2BP01——PG 侧全链 V1→V33 无法在真实库直跑（H2 全链不受影响） | 中 | ✅ **已关闭**（2026-08-19 pg-v13-migration-chain-repair：PG 侧 V13 第 7 项 DROP INDEX→DROP CONSTRAINT，H2 零改动；PG 新库全链 33 条 migrate+validate + 既有库升级夹具 + 原 V13 checksum 守卫 + 语义正反例；D110 PASSED + 阶段三同步 COMPLETED，项目级 600/0/0） |
| I45 | M07/M04/M05/M06/M09/M10 虚低 15 条汇总 | 低 | ◐ 部分关闭（2026-08-19：M07-F01-01～05 前端缺口已闭环；其余 10 条待排期） |
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

**pg-v13-migration-chain-repair：D110 规划层最终验收 PASSED（2026-08-19）**，阶段三终态同步回执 `product/pg-v13-migration-chain-repair/receipts/post-d110-terminal-sync.md` 待规划层复验；复验通过后功能标记 **COMPLETED**（D110 已裁定 PASSED，终态同步为阶段三最后一步）。I52 正式关闭，后端基线 **600/0/0/0**，已完成功能 23→24。**agent-model-management-frontend：D107 已复验 COMPLETED**（P5 终态核销）。随后按 system.md §10 从候选池（§10 与 [[handoff]]）选定下一需求方向、写方向文档至 `product/<feature>/ready/` 下发执行层。

---

## 13. 下一轮要达到什么结果

取决于规划层选定的下一功能。按 system.md §3 三阶段流程推进：探索（search_task 委派制）→ Step 拆解 → 执行验收 → 收尾归档（§3.3 第 10 项知识库全量同步为强制项）。

---

## 14. 下一轮开始前必须读取的知识文件

```
1. system.md
2. knowledge/current-status.md
3. knowledge/session-handoff.md                     ← 本文件
4. knowledge/known-issues.md                        ← I1-I52（I45 部分关闭；I52=PG V13:58 2BP01 已修复关闭；I51/I26/I47 已分别修复关闭）
5. knowledge/features/agent-model-management-frontend.md ← 最新完成功能（P5/M07-F01-01～05，V33）
6. knowledge/features/agent-model-orchestration.md  ← M07 全链（详情在 product/agent-model-orchestration/passed/）
7. memory/handoff.md                                ← 基线/候选池/启动提示词（memory 为最新权威）
8. knowledge/shared-constraints.md
```

---

## 15. 新会话启动提示词

```
你是 Smart-WorkFlow 根目录规划代理。请按 system.md §10 执行新会话恢复。

最新状态：
- agent-model-management-frontend（P5 / M07-F01-01～05 大模型管理前端闭环）**执行层闭环（2026-08-19），D106 规划层验收 FAILED（复验中，候选终态）**——后端零 Java 业务改动 + V33 菜单/按钮权限 seed（菜单 id=209 `agent:model:view`、按钮 id=210 `agent:model:manage`、id=211 `agent:model:test`，不 seed sys_role_menu），提交 `d4d7dc3`；前端契约/API/Mock/菜单/页面全闭环，提交 `e26e5f0`；后端 584/0/0（582+2）、前端 69f/628t（66f/602t +3f/+26t）四连全绿、H2 全链 33 迁移 + V32→V33 升级链、PG 真实库临时 schema V33 幂等通过——主体与测试门保留，不要求重做；清单 M07-F01-01～05 🟦→✅（✅21/🟦28/⬜41）、P5 核销、I45 的 M07-F01 缺口关闭均为执行层候选终态（D106 复验通过前不构成规划层确认）；审查 `product/agent-model-management-frontend/receipts/planning-review-d106.md`，执行层补证中（后端 +7 用例 591/0/0 已跑通，前端 Mock 语义修正进行中）
- 新登记 I52（非本轮引入）：PG `postgresql/V13__logical_delete_unique_constraints.sql:58` DROP INDEX 报 2BP01，PG 侧全链 V1→V33 无法在真实库直跑（H2 不受影响）；建议 V34 修复迁移，待规划层决策
- department-query-filtering（M01-F01-04/I31）**COMPLETED（D104，2026-08-18）**——后端 582/0/0、前端 66f/602t、Flyway 零迁移；归档 `product/department-query-filtering/passed/`
- 基线：后端 600 tests / 前端 69f/628t 四连全绿；清单 ✅21/🟦28/⬜41 共 90 行；Flyway 最高 V33，PG/H2 全链各 33 条 migrate+validate；已完成功能 24 个
- 执行约束：本机物理内存 1.6G——mvn 与 pnpm/npm 编译严格串行，禁并行编译（已入宪法）
- 候选池：M01/M02 虚高补齐（I36/I40）、M07 补全（F02-02/F02-04/F04-02）、M07-F03/F04 新功能、IoT/OpenAPI、数据权限遗留/停用即时生效——PG 侧全链直跑已由 pg-v13-migration-chain-repair 修复关闭（I52，D110 COMPLETED）；I49 已由 admin-role-governance D96 关闭，I51/I26/I47 已分别修复关闭

最新完成：product/agent-model-management-frontend/（回执 receipts/，**D106 FAILED 执行层补证中，待规划层复验**）；最新归档：product/department-query-filtering/passed/
```

---

> 最后更新：2026-08-19
> 最新完成功能：**agent-model-management-frontend** — P5/M07-F01-01～05 大模型管理前端闭环（执行层闭环，2026-08-19；后端 584 / 前端 69f/628t / V33 迁移；清单 M07-F01-01～05 🟦→✅、P5 核销为候选终态；**D106 规划层验收 FAILED，执行层补证中，待规划层复验**；审查 `product/agent-model-management-frontend/receipts/planning-review-d106.md`）
> 上一功能：**department-query-filtering** — M01-F01-04/I31 部门条件查询（**COMPLETED** ✅，D103 复验 + D104 最终验收 PASSED）
> 测试基线：后端 CONFIRMED 584 tests · 前端 CONFIRMED 69 files / 628 tests（运行口径；四连全绿）
> 进行中：无进行中业务功能（agent-model-management-frontend 执行层闭环、**D106 FAILED 补证复验中**——主体与测试门保留，执行层补证：后端 +7 用例 591/0/0 已跑通、前端 Mock 语义修正进行中；下一需求由规划层复验后从候选池选定）
