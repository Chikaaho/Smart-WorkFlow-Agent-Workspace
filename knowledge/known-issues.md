# 已知问题和限制

> 工作区统一知识库 — 已知问题、技术债务和当前限制。
> 记录已发现但尚未解决的问题，供功能规划和风险评估参考。
>
> 可信度：CONFIRMED = 问题已复现确认 · REPORTED = 回执中报告 · ASSUMED = 推测

---

## 问题索引

| # | 发现日期 | 问题 | 严重程度 | 状态 |
|---|----------|------|:---:|:---:|
| I1 | — | 功能清单状态与代码实际进度脱节 | 中 | ✅ 已修复（首轮 2026-07-24：feature-checklist-sync 4 Steps 全部 PASSED；第二轮 2026-08-12：Step5 二次核实与同步，34 行状态列已同步；详见 I31-I45） |
| I2 | — | refresh token seam 未实现 | 低 | ✅ 已修复（2026-07-22：auth-seam-completion 7 Steps 全部 PASSED，/auth/refresh + /auth/logout 前后端闭环） |
| I3 | — | BPMN/Vue Flow adapter 未实现 | 中 | 部分修复（Vue Flow ✅ 2026-07-25 [[vue-flow-adapter]] COMPLETED；BPMN 查看器 ✅ 2026-07-25 [[bpmn-adapter]] Step 0/1/2/3 PASSED——前端查看器防腐层 + 后端 BPMN XML 端点 + ProcessDefList「查看流程图」入口均已实现；设计器/Modeler 能力明确不在范围内；仅 M04-F06 流程监控（Step 4）未做，由 [[process-monitoring]] 承接，2026-08-16 D83 复核确认） |
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
| I13 | 2026-06-30 | M07 AI 调度图执行引擎/工具沙箱/RAG 选型未定 | 中 | ◐ 部分收敛（2026-08-11 Step9 落地：执行引擎/图定义/前端设计器全链已落地；RAG/联动点仍未决，见下文） |
| I14 | 2026-06-30 | M08 IoT 腾讯接入路径待补全 | 中 | ⚠ 待专项产品设计 |
| I15 | 2026-06-30 | M09 开放接口授权粒度/配额计费口径待定 | 低 | ⚠ 排在最后，待前序模块稳定 |
| I16 | 2026-06-30 | 跨环境迁移（表单/应用/流程导入导出）未设计 | 中 | ⚠ 后续设计 |
| I17 | 2026-06-30 | RICH_TEXT 富文本编辑器未集成 | 低 | 当前降级为 textarea |
| I18 | 2026-07-16 | 子项目 system.md 可能与 zip 最新版本不同步 | 中 | ✅ 已关闭（2026-08-16 D84 裁定：工作区已无 zip（find *.zip=0）；子项目 system.md 已更新至 27,071/27,861 字节与根 system.md 同步，无同步对象） |
| I19 | 2026-07-20 | storage mock 模式下载不可用 | 低 | 已知限制 |
| I20 | 2026-07-20 | storage 筛选 UI 占位 — 后端无 originalName 参数 | 低 | 已知限制 |
| I21 | 2026-07-20 | B4 测试覆盖不足 | 低 | 已知偏差 |
| I24 | 2026-07-22 | 后端"406 tests"与静态 @Test 计数（203）不一致，且非参数化展开所致（0 参数化），运行期数未独立复验 | 中 | ✅ 已修复（2026-07-22 kb-verification VB1 复验：运行期真值 203，与静态吻合；原 406 为回执误报，SUPERSEDED） |
| I25 | 2026-07-22 | 前端"471 tests"与静态 it/test 计数（463）小幅不一致，且"四连全绿/BUILD SUCCESS"未由规划层独立复验 | 低 | ✅ 已修复（2026-07-22 kb-verification VF1 复验：运行期真值 471 全绿，差值 +8 定位为 tokens.spec.ts 循环展开） |
| I26 | 2026-07-22 | SysRole 实体列名与 V5 Flyway 迁移列重命名不一致 | 高 | ✅ 已修复（2026-08-17，P13 修复轮：实体/测试 DDL 全部对齐 V5 链尾 `built_in`/`remark`，后端全量 527 tests 全绿） |
| I28 | 2026-07-23 | 后端工程宪法缺少「仓库范围硬约束」章节，前后端不对称 | 高 | ✅ 已修复（2026-07-23，用户授权规划层一次性越权补齐 §0.1，见 D34） |
| I29 | 2026-07-25 | bpmn-adapter Step 2 执行/测试回执自报测试计数与独立核实结果不符（三处矛盾），自报 PASSED 未予采信 | 中 | ✅ 已修复（2026-07-25：修正补充回执已收到并独立复核通过——基线 19→26 更正为 26→36，净增 +7→+10，项目级 231→241，Git 删行澄清为零删除。Step 2 最终 PASSED） |
| I30 | 2026-07-26 | mock BPMN XML 过于简化——所有流程返回同一份 StartEvent→EndEvent 最简模板 | 低 | ✅ 已满足（2026-08-16 D83 复核：handlers.ts L738-769 已按 def.processKey 参数化 + 3 个 userTask + activityId 对齐实例，可关闭） |
| I31 | 2026-08-12 | M01-F01-04 部门查询虚高：清单标 ✅，实际仅全量树查询、无条件筛选 | 低 | ✅ 已修复（2026-08-18，department-query-filtering：GET /system/dept/tree 支持 name/status 条件 + 祖先补全树形结果，详见下节） |
| I32 | 2026-08-12 | M01-F02-01 人员新增虚高：岗位/角色关联与统一事务曾缺失 | 低 | ✅ 已修复（2026-08-18，user-org-association-query） |
| I33 | 2026-08-12 | M01-F02-02 人员修改虚高：清单标 ✅，实际账号启用/停用不生效，停用用户仍可登录 | 高 | ✅ 已修复（2026-08-13 checklist-gap-hardening 第一批：AuthController 登录/刷新双入口 status 校验，停用/锁定账号拒绝登录与 token 续期） |
| I34 | 2026-08-12 | M01-F02-04 人员查询虚高：组合条件查询曾未接入后端 | 低 | ✅ 已修复（2026-08-18，user-org-association-query） |
| I35 | 2026-08-12 | M01-F03-01 岗位管理虚高：人员岗位关联曾未实现 | 低 | ✅ 已修复（2026-08-18，user-org-association-query） |
| I36 | 2026-08-12 | M02-F01-01 角色管理虚高：用户组绑定仍未实现 | 低 | ✅ 已修复（2026-08-19，user-group-membership D117 PASSED + 阶段三同步 COMPLETED：用户组维护与成员绑定闭环，M01-F04-01 🟦；关闭的是剩余用户组绑定缺口，不扩大为流程/权限消费端已完成） |
| I37 | 2026-08-12 | M02-F04-01 数据权限虚高：清单标 🟦，实际仅枚举/字段占位、全无过滤逻辑 | 中 | ✅ 已修复（2026-08-15 data-scope-enforcement 完整落地，见修复记录） |
| I38 | 2026-08-12 | M03-F01-02 控件库虚高：清单标 ✅，实际仅 8/17 类可用（enum 17 成员，9 disabled 占位） | 中 | 待修复 |
| I39 | 2026-08-12 | M03-F02-01 表单管理虚高：清单标 ✅，实际删除未实现、版本仅存快照 | 中 | 待修复 |
| I40 | 2026-08-12 | M03-F04-01 数据管理虚高：清单标 ✅，实际列表/查询条件配置仅自动派生 | 低 | 待修复 |
| I41 | 2026-08-12 | M05-F01-02 消息接收虚高：清单标 ✅，实际缺删除 | 中 | ✅ 已关闭（2026-08-25 M05 通知管理缺口闭环：DELETE 端点 + 前端删除按钮 + 确认对话框 + 10 个集成测试） |
| I42 | 2026-08-12 | M05-F01-03 消息查询虚高：清单标 ✅，实际无状态/关键字过滤 | 中 | ✅ 已关闭（2026-08-25 M05 通知管理缺口闭环：GET 支持 ?read/keyword 过滤 + 前端过滤栏 + 10 个集成测试） |
| I43 | 2026-08-12 | M10-F03-01 定时任务虚高：清单标 ✅，实际功能完整但生产菜单不可达 | 中 | ✅ 已修复（2026-08-13 checklist-gap-hardening 第一批：Flyway V29 菜单 seed，任务管理/执行日志生产菜单可达） |
| I44 | 2026-08-12 | M10-F06-01 文件存储虚高：清单标 ✅，实际功能完整但生产菜单不可达 | 中 | ✅ 已修复（2026-08-13 checklist-gap-hardening 第一批：Flyway V29 菜单 seed，文件管理生产菜单可达） |
| I45 | 2026-08-12 | M07/M04/M05/M06/M09/M10 功能清单"虚低"15 条汇总（部分后端骨架未达清单完整度） | 低 | ◐ 部分关闭（2026-08-22：M07-F01-01～05 前端缺口已闭环（D107）；M07-F02-04 运行日志子集已闭环（D148）；M07-F02-02 Prompt 配置 COMPLETED（D154+D157）；M07-F04-02 Token 统计 D170功能级PASSED阶段三已同步（M07-F04-02升✅、P8已核销）；**M07-F02-04 单步调试已关闭（D180 规划层最终验收 15/15 PASSED，P7 核销、M07-F02-04 升✅，2026-08-23）**；剩余缺口待排期，计数以 I45 详细条目为准） |
| I46 | 2026-08-15 | 手写 SQL 通道无数据权限：动态宽表 JdbcTemplate 裸 SQL 与 bpm 外部数据源 SqlExecutor 绕过数据权限拦截器链，本轮明确不纳管（与 I10 同源） | 高 | 已知限制（明确不纳管，沿用 I10 红线：代码审查 + 测试兜底） |
| I47 | 2026-08-16 | bpm/h2 迁移链 V8 含 PG 独有 partial index 语法（`WHERE active=true`），H2 不支持——全链 H2 Flyway 迁移从未可跑，模块测试均绕过 Flyway 直建 DDL（V30 冒烟 6 目录链仍排除 bpm） | 中 | ✅ 已修复（2026-08-17 bpm-h2-v8-compat：h2/V8 partial index → 生成列 active_key + 唯一索引等价实现，仅 h2/V8 改动；永久真全链测试 30 条迁移通过；项目级 543/0/0） |
| I48 | 2026-08-16 | `flow-graph` adapter 契约无边点击事件、无命令式数据更新通道：M07 图设计器绕行方案可用但受限（若未来节点自定义渲染/直接点边编辑需求增多，需回规划层评估扩展 adapter 导出面） | 低 | 绕行方案已生效，扩展待评估 |
| I49 | 2026-08-16 | V29 菜单 seed 未 seed sys_role_menu（超管旁路）：正式环境 job/storage 菜单仅超管可达，I43/I44「生产菜单可达」口径仅对超管成立 | 中 | ✅ 已关闭（P24/admin-role-governance，D96 PASSED；方向归档 `product/admin-role-governance/passed/`） |
| I50 | 2026-08-16 | AuthController.login 状态校验位于密码匹配之后（L88→L92）：停用账号仍消耗一次 BCrypt+用户查询，时序/资源问题，无安全漏洞 | 低 | 待修复（D83 登记） |
| I51 | 2026-08-16 | 前端 status 语义与后端相反（UserList/DeptList 正常=1/停用=0 vs 后端 0=正常 1=停用 2=锁定）：UI 新建用户无法登录、UI 停用不阻断登录，I33 修复在 UI 路径被抵消 | 高 | ✅ 已修复（2026-08-17 status-semantics-alignment：UserList/DeptList 按后端口径修正默认值/选择项/筛选/展示，新增 7 测试，前端 66f/576t 四连全绿，后端零修改） |
| I52 | 2026-08-19 | PG 侧全链迁移无法直跑：`postgresql/V13__logical_delete_unique_constraints.sql:58` 对 inline UNIQUE 隐式索引 `sw_form_def_form_key_key` 执行 `DROP INDEX`，PG 报 2BP01（约束创建的索引须 DROP CONSTRAINT）——M07-F01 前端闭环 PG 验证时发现，非本轮引入 | 中 | ✅ **已关闭（2026-08-19，D110 功能级最终验收 PASSED + 阶段三终态同步）**：PG 侧 V13 第 7 项改 `ALTER TABLE sw_form_def DROP CONSTRAINT`（H2 侧零改动、不新增 V34）；PG 新库全链 33 条 migrate+validate + 既有库升级夹具 + 原 V13 checksum 显式失败守卫 + 语义正反例，项目级 600/0/0；功能 COMPLETED，方向归档 `product/pg-v13-migration-chain-repair/passed/` |
| I53 | 2026-08-19 | 方法级鉴权拒绝被 GlobalExceptionHandler 兜底为 HTTP 500（403 契约失真） | 中 | ✅ 已修复（2026-08-20 role-menu-permission-parity D122 退回修正：新增 AuthorizationDeniedException 分支返回 403，移除测试专用处理器覆盖，sw-common 单测 2 用例，项目级 674/0/0/0） |
| I54 | 2026-08-19 | 角色停用（status=0）后菜单/按钮权限仍按绑定装配（停用不能有效撤权） | 高 | ✅ 已修复（2026-08-20 role-menu-permission-parity D122 退回修正：菜单树与权限装配对称按 status=1 过滤，AuthMenus A4/A9 用例改为撤权生效断言，项目级 674/0/0/0） |
| I55 | 2026-08-20 | M07-F02-04 运行日志前端缺口（列表页/详情页/节点轨迹子视图） | 中 | ✅ **已关闭（2026-08-20 agent-graph-execution-observability D148 功能级 PASSED）**：ExecutionList.vue（分页列表、graphDefId 过滤）、ExecutionDetail.vue（详情展示、安全渲染）、NodeTrajectory.vue（节点轨迹、branchId 由后端真实返回）全链闭环；后端零改动复用 Step12(D70-D71) 三类端点；清单 M07-F02-04 保持 🟦（运行日志查看 ✅ + 单步调试🟦，单步调试继续待排期）。后端 685/0/0/0、前端 78f/760t、Flyway V34。方向归档 `product/agent-graph-execution-observability/passed/`。 |



---

## 问题详情

### I1：功能清单状态与代码实际进度脱节（✅ 已修复）

- **发现日期**：2026-07-13（工作区审计时发现）
- **严重程度**：中
- **可信度**：CONFIRMED（已修复）
- **描述**：`Smart-WorkFlow/功能清单.md` 中 54 个功能、89 个明细（原记为 88，已更正）全部标记为 `⬜ 待开发`，但代码实际已完成：登录认证、RBAC 管理、表单设计器+渲染器、字典管理、通知后端等。功能清单与实际进度严重不一致。
- **修复日期**：2026-07-24
- **修复方式**：feature-checklist-sync 功能 4 Steps（Step1 后端核实/Step2 前端核实/Step3 规划层综合裁决/Step4 机械应用）全部 PASSED。范围裁定：M07/M08/M09（合计35条）后端骨架+前端占位，规划层直判保留 `⬜`；余下 M01/M02/M03/M04/M05/M06/M10（合计54条）逐条委派后端/前端核实，按 [[decisions]] D35 MIN 规则（`merged=min(后端,前端)`）合并裁决。最终 `功能清单.md` 89 条明细状态更新为 **✅17 / 🟦12 / ⬜60**，独立子代理核查确认：改动仅限状态列、终态计数吻合、10 条抽查一致、全表无重复无缺失。执行回执 §5 摘要表存在 1 处计数笔误（报 28 行变更，实际 29 行），已定位为回执内部汇总算错，不影响文件实际内容，详见 [[feature-checklist-sync]] §4.3。
- **复发与第二轮修复（2026-08-12）**：距首轮同步约 3 周（2026-07-24 → 2026-08-12），全量审计（`search_fallback/feature-checklist-full-audit.md`，89/89 条逐条核实）发现清单再次过期：89 条中 34 条状态标记与代码不符，M07 全部 14 条仍标 ⬜（其中 M07-F02-01 图设计器、M07-F02-03 图管理已前后端全链完成）。第二轮修复方式（feature-checklist-sync Step5，2026-08-12）：`功能清单.md` 状态列同步 34 行（✅→🟦 13 条、🟦→⬜ 1 条、⬜→✅ 3 条、⬜→🟦 15 条，含 I3 已覆盖仅同步状态列的 M04-F01-01/M04-F06-01）；清单虚高 14 条（标 ✅/🟦 但未达标）逐条记录为 I31-I44，虚低 15 条（标 ⬜ 但已有部分后端骨架）合并汇总记录为 I45。复发说明：清单在功能持续交付中会快速漂移，"功能完结后手动同步"这一模式本身不可持续；维护机制问题（是否把清单状态同步固化为每个功能收尾的强制检查项）待规划层决策，见 Step5 方案「待确认问题」。
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
- **修复（BPMN 部分，2026-07-25）**：[[bpmn-adapter]] Step 0/1/2 均已 PASSED——前端 `adapters/bpmn/` 查看器防腐层（mountBpmnViewer/highlight/fitViewport/destroy + 事件回调）+ 后端 `GET /workflow/defs/{id}/bpmn-xml` 只读端点（`R<String>`，项目级 241 tests BUILD SUCCESS）。
- **状态更新（2026-08-16，D83 复核）**：Step 3（UI 查看入口）已于 2026-07-26 完成——ProcessDefList「查看流程图」入口（`ProcessDefList.vue:15/93` mountBpmnViewer/openViewer），I3 的 BPMN 部分已全部修复；仅 M04-F06 流程监控页面（Step 4）未做，由 [[process-monitoring]] 承接（首批已 COMPLETED：流程图高亮+流转记录；耗时分析+流程干预延后）
- **影响**：BPMN 查看器防腐层 + XML 数据源端点 + 前端查看入口均已就绪；流程监控页首批已交付；设计器（Modeler）能力明确不在范围内
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
- **描述**：`Smart-WorkFlow-Web/docs/governance/engineering-constitution.md` §8 规定「Element Plus 经按需自动导入…modules/* 里不出现 element-plus 的显式 import 语句」。但实际代码中 StorageList.vue（L14）、NotifyHome.vue（L9）、JobList.vue 均有 `import { ElMessage, ElMessageBox } from 'element-plus'`。这是必要的 API 级 import（ElMessage/ElMessageBox 需要通过 import 获取函数引用），非组件 import。
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
- **关联**：与 I46 关联——数据权限落地（2026-08-15）明确不纳管此类手写 SQL 通道（动态宽表 JdbcTemplate + bpm 外部数据源 SqlExecutor），继续适用本条红线的代码审查 + 测试兜底

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
- **状态更新（2026-08-11）**：「执行引擎落地形态」经产品设计澄清（`product/agent-model-orchestration/passed/step-6-f02-design-clarification.md`）已部分收敛——MVP 节点类型（LLM/工具/条件分支）已定，工具节点改为独立图节点。**Step7（2026-08-11）已落地**：图定义 CRUD+版本+发布骨架（`sw_agent_graph_def` 表 V25 + ProcessGraph/GraphElement 图模型 + DRAFT/PUBLISHED + def_version 递增 + graph_key 冻结），`graph_json` 节点 config/style 不透明透传。**Step8（2026-08-11）已落地**：执行引擎架构**已裁定并落地**——放弃 LangGraph4j `StateGraph`（无 JSON 反序列化能力），自建纯 Java `AgentGraphInterpreter`（`passed/step-8-graph-interpreter-engine.md`），`AgentGraphFactory`/LangGraph4j 保留服务 F01，两条执行路径并存互不干扰；条件分支求值**已拍板**为关键词子串匹配（边 `config.keyword`，`String.contains` 按 elements 顺序取第一个命中，未命中走唯一默认边，无默认边运行时报错，不支持正则、无新依赖）；execution context 极简为单一 currentText；执行历史不落库。**Step9（2026-08-11）已落地**：前端图设计器全链（`passed/step-9-graph-designer-frontend.md`）——V26 菜单迁移（root 路径；现场核验修正了"真实 sys_menu 无 agent 行"的调研结论——V6 早已 seed「智能体」id=7，按方案 §3.1 既有层级复用分支仿 V11 先例矫正为目录 + 挂「图定义管理」二级菜单）+ `graphAdapter.ts` 转换层（elements↔FlowGraphData，坐标存 style.x/y 为前端裁定非后端契约）+ GraphDefList/GraphDesigner 两页面 + 参数化静态路由；前端 63f/539t。「不在此模块投入编码资源」的限制对 F02 图定义/执行/前端设计器（Step7-9）已解除。**仍未收敛**：并行/循环节点语义（推入 todo）、RAG 向量库选型、流程表单联动点——三项继续适用该限制。

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
- **描述**：`SmartWorkFlow_files.zip` 中的 `CLAUDE-java.md`（20,278 字节）和 `CLAUDE-vue.md`（14,560 字节）是最新版本的工程宪法。子项目中的 `Smart-WorkFlow/docs/governance/engineering-constitution.md`（22,440 字节）和 `Smart-WorkFlow-Web/docs/governance/engineering-constitution.md`（17,323 字节）可能与 zip 版本存在差异。
- **状态更新（2026-08-16，D83 复核）**：前提已过时——工作区已无 zip 文件（全仓 `find *.zip` = 0）；子项目 `Smart-WorkFlow/docs/governance/engineering-constitution.md` 已更新至 **27,071 字节**、`Smart-WorkFlow-Web/docs/governance/engineering-constitution.md` 已更新至 **27,861 字节**（均大于原记录值），该条已无同步对象
- **关闭记录（2026-08-16，D84 裁定）**：✅ **已关闭**——前提消失（工作区已无 zip，`find *.zip`=0；子项目 system.md 已更新至 27,071/27,861 字节，与根 system.md 同步，无同步对象）。若未来重新引入 zip 分发或出现新的宪法版本差异源，可重新登记
- **影响**：执行代理可能依据过时的工程宪法进行开发（已随子项目 system.md 持续维护而缓解）
- **后续处理**：不适用；该问题已关闭，当前只维护两个子项目正式治理路径中的工程宪法

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
- **严重程度**：高（2026-08-16 D83 影响面上调）
- **可信度**：CONFIRMED
- **描述**：`SysRole` 实体中 `@TableField("is_builtin")` 和 `@TableField("description")`，但 V5 Flyway 迁移 `V5__m_seam_rbac.sql` 将列 `is_builtin` 重命名为 `built_in`、`description` 重命名为 `remark`。若生产环境已应用 V5 迁移，MyBatis-Plus 使用 `SysRole` 实体查询时会报错 `Column "IS_BUILTIN" not found`。
- **影响**：**任何全链 Flyway 环境（含开发 H2）V5 均执行列改名，`SysRole` 的 MP 查询（`IS_BUILTIN` 列不存在）都会失败**——测试全绿只因测试 DDL（`schema-datascope-h2.sql` L42-43，2026-08-17 P13 探索回执更正：原「`schema-h2.sql` L43-44」位置有误，该文件仅 dict 两表）绕过 Flyway 匹配实体（2026-08-16 D83 复核：原「开发 H2 环境不受影响」描述错误）；D79 之后 Role CRUD 读写 dataScope 同样命中该失配列，实际影响面≥原描述。
- **临时方案**：当前 auth-seam-completion V1 的集成测试使用匹配实体列名的 DDL 规避；生产环境需确认 Flyway 迁移状态与实体注解的匹配性。
- **建议**：修复 `SysRole` 实体注解（`is_builtin`→`built_in`、`description`→`remark`）或补充兼容性迁移对齐 V5；修复后补全链迁移测试（可与 I47 修复轮合并排期）。
- **状态更新（2026-08-17，P13 修复轮，✅ 已修复）**：规划层裁定以 V5 链尾契约为权威（不恢复旧列、不追加兼容迁移）；执行层完成——`SysRole.java:47,51` 两处 `@TableField` 改为 `built_in`/`remark`（字段名/JSON 键不变）；测试契约同步对齐 V5 链尾（`schema-datascope-h2.sql` 列名/类型/唯一索引含 V13 deleted 形态 + 头注释失真口径修正；`AuthFlowIntegrationTest.java` 内建表/索引/INSERT/注释对齐）；全仓 grep `is_builtin` 主代码/测试零残留（仅历史迁移脚本 V1/V2/V5 允许存在）。验证：sw-biz-system-biz 模块 111/0/0（RoleDataScopeTest 7、RoleControllerTest 6、UserDetailsProviderDataScopeTest 12、AuthFlowIntegrationTest 8、AuthMeControllerTest 5 全 PASSED），项目级全量 **527 tests / 0 failures / 0 errors** 与基线持平（MAVEN_OPTS=-Xmx2g 下 mvn test BUILD SUCCESS 31/31 模块）；MP 实际生成 SQL 原文已含 `built_in`/`remark AS description`，与测试 DDL 双向闭合于 V5 链尾。规划层最终验收 **PASSED**（D86）并归档 `product/sysrole-v5-column-alignment/passed/`。遗留回补（2026-08-18）：H2 真全链验证已由 bpm-h2-v8-compat（P10/I47，D88 PASSED）闭环——30 条全链通过；P12 前提（sw-bootstrap 无测试基建）已由本轮 junit-jupiter + `FlywayFullChainH2Test` 消除并核销。

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
- **描述**：直读对比 `Smart-WorkFlow-Web/docs/governance/engineering-constitution.md` 与 `Smart-WorkFlow/docs/governance/engineering-constitution.md` 发现结构性不对称：
  - 前端宪法 §0.0 之后有独立的 **§0.1「本仓库范围（硬约束）」**，明确写了 4 条：❌ 禁止读取/修改/构建/运行/分析后端代码、❌ 禁止执行后端命令（`mvn`/`gradle` 等）、❌ 禁止向后端仓库提交或推送、✅ 只在前端目录执行 `pnpm` 系命令。
  - 后端宪法 §0.0 没有对应章节，唯一相关的一句是「❌ 禁止修改前端代码（`Smart-WorkFlow-Web/`）」——**只锁了"改代码"，没有锁"读文件"和"跑命令"**，缺少"禁止读取/构建/运行前端代码""禁止执行 pnpm/npm/vite/vitest""只在后端目录执行 mvn 系命令"等显式条款。
  - 两份文件在「禁止诱导用户规划」「禁止预告下一 Step」两条硬约束上是**完全对称、都很完善**的，唯独"仓库范围边界"这一层后端缺项。
  - 根目录 `knowledge/shared-constraints.md` §9（[[decisions]] D29，2026-07-22）已经写了对应的硬约束（"禁止后端执行代理运行前端命令或读写前端文件"），但**该约束只回填进了根目录知识库，未回填进 `Smart-WorkFlow/docs/governance/engineering-constitution.md` 自身**；后端执行代理实际工作时读的是自己项目内的宪法文件，不会主动去读根目录 `shared-constraints.md`。
- **影响**：后端执行代理在无显式禁令的情况下，可能读取前端文件或执行 `pnpm`/`npm` 命令（例如"顺手验证前后端联动"），这正是用户反馈的"新会话会一起执行前后端任务"越界现象的最直接可归因原因。
- **关联问题**：与 [[known-issues]] I18（子项目 system.md 可能与 zip 版本不同步）同源——都是子项目 `docs/governance/engineering-constitution.md` 未与最新硬约束同步。
- **修复日期**：2026-07-23
- **修复方式**：用户明确授权规划层本次一次性越权（该文件不在 `system.md` §1.3 常规写入范围内），已在 `Smart-WorkFlow/docs/governance/engineering-constitution.md` §0.0 之后补齐 §0.1「本仓库范围（硬约束）」，内容镜像前端 §0.1 结构：禁止读取/修改/构建/运行/分析前端代码、禁止执行 `pnpm`/`npm`/`vite`/`vitest`、禁止向前端仓库提交推送、只在后端目录执行 `mvn` 系命令。此授权为一次性例外，不代表 §1.3 写入范围常态化扩大
- **口径澄清（同次核实）**：用户反馈中"把自己当作执行层"经确认实指"后端会话误把自己当作规划层"。核对后端/前端两份宪法在「禁止诱导用户规划」「禁止预告下一 Step」两条上写得完全对称、内容详尽，未发现文本缺口——这类越权若仍发生属执行层未遵守既有条款的实践问题，非宪法文本问题，不通过编辑文本解决
- **关联决策**：[[decisions]] D34

### I30：mock BPMN XML 过于简化——所有已发布流程返回同一份 StartEvent→EndEvent 最简模板

- **发现日期**：2026-07-26（Step 3 手工验收时确认）
- **严重程度**：低
- **可信度**：CONFIRMED
- **描述**：`handlers.ts` 中 `GET /api/workflow/defs/:id/bpmn-xml` 的 mock handler 始终返回一份固定最简 XML，只含 StartEvent + sequenceFlow + EndEvent，无论点击哪个流程定义（请假/报销/采购审批）都看到完全相同的图。不影响查看器功能验收，但不符合业务预期。
- **影响**：`dev:mock` 模式下查看流程图体验重复，无法区分不同流程的拓扑
- **状态更新（2026-08-16，D83 复核）**：✅ **已满足，可关闭**——`handlers.ts` L738-769 的 mock bpmn-xml 已按 `def.processKey` 参数化分发，含 3 个 userTask 节点，activityId 对齐实例，原「所有流程同一份最简模板」问题不再成立
- **临时方案**：用户已确认暂不处理，当前 mock 满足功能验收需要
- **建议**：后续为每个 mock 流程定义配不同的 BPMN XML（含 UserTask、Gateway 等），按 `def.processKey` 分发（2026-08-16 复核已实现）

### I31：M01-F01-04 部门查询（清单标 ✅，实际仅全量树查询、无条件筛选）

- **发现日期**：2026-08-12
- **严重程度**：低（缺条件筛选）
- **可信度**：CONFIRMED（2026-08-12 审计现场核实）
- **描述**：`功能清单.md` 原标 ✅ 已完成，实际部门查询仅有全量树查询，无任何条件筛选参数。
- **现状证据**：`DeptController.java` 仅 `GET /system/dept/tree`；`SysDeptServiceImpl.listTree()` 无筛选参数（审计回执 `search_fallback/feature-checklist-full-audit.md` 问题 1 差异表 M01-F01-04）。
- **影响**：此前会让后续会话误判"已完成"，风险高；部门查询缺少条件筛选能力。
- **修复记录（2026-08-18，department-query-filtering，D102 执行层闭环）**：✅ **已关闭**——`GET /system/dept/tree` 扩展可选参数 `name`（trim 后非空生效的包含匹配）与 `status`（仅 0=正常/1=停用，非法值显式 400 不退化全量）；结果=直接命中集合 + 授权范围内祖先补全（同一 lambdaQuery 通道，租户/逻辑删除/可见范围拦截器自然生效），去重并按 sort+id 稳定排序；无条件调用与旧行为完全一致。前端 DeptList 增加名称/状态筛选、查询/重置、筛选空态，Mock 与真实接口语义对齐。后端 582/0/0（563+19）、前端 66f/602t（577+25）四连全绿；Flyway 零迁移。清单 M01-F01-04 🟦→✅。P1 其余组织关系（用户组绑定等）仍待后续规划。
- **建议**（历史保留）：本轮仅关闭角色菜单/按钮配置及最小用户-普通角色绑定读写子集；状态列继续为 🟦，P1 其余组织关系（用户组绑定、岗位/人员关联等）仍待后续规划，不得据此整项关闭 I36。
- **修复记录（2026-08-18，admin-role-governance，D96 PASSED）**：✅ 已关闭本轮子集——RoleController 提供菜单读取/写入，UserController 提供用户角色读取/写入与清空回填，前端 RoleList/UserList 提供对应入口；自动化测试覆盖读写/清空及请求级鉴权。角色管理整体仍保留 🟦，因为用户组及其他组织关系不在本轮范围。

### I32：M01-F02-01 人员新增（清单标 ✅，实际岗位/角色关联未实现）

> 当前修正（2026-08-18，user-org-association-query）：历史审计结论已被当前实现取代。用户主记录、部门、岗位、普通角色由统一事务服务保存并支持替换/清空/回填；关系失败回滚由 H2 集成测试证明。旧段落保留为历史记录。

- **发现日期**：2026-08-12
- **严重程度**：低（缺岗位/角色关联）
- **可信度**：CONFIRMED（2026-08-12 审计现场核实）
- **描述**：`功能清单.md` 原标 ✅ 已完成，实际人员新增仅关联部门，岗位/角色关联未实现。
- **现状证据**：`UserController.UserFormRequest` 仅 deptId/username/realName/email/phone/sex/status/plainPassword；全仓无 sys_user_post 关联表与接口（审计回执问题 1 差异表 M01-F02-01）。
- **影响**：此前会让后续会话误判"已完成"，风险高；人员与岗位/角色关联能力缺失。
- **建议**：状态列已按审计回执同步降级为 🟦；缺口修复方向详见审计回执，规划方向由规划层定。

### I33：M01-F02-02 人员修改（清单标 ✅，实际账号启用/停用不生效，安全缺口）

- **发现日期**：2026-08-12
- **严重程度**：高（停用用户仍可登录）
- **可信度**：CONFIRMED（2026-08-12 审计现场核实）
- **描述**：`功能清单.md` 原标 ✅ 已完成，实际"账号启用/停用"不生效——登录链路不校验 `SysUser.status`，停用用户仍可登录并签发 token。
- **现状证据**：`AuthController.login()` → `UserDetailsProviderImpl.loadByUsername/toLoginUser()`（L55-123）不校验 `SysUser.status`（审计汇总层已现场复核，见审计回执问题 1 差异表 M01-F02-02）。
- **影响**：此前会让后续会话误判"已完成"，风险高；停用账号无法阻止登录，属安全相关缺口。
- **建议**：状态列已按审计回执同步降级为 🟦；缺口修复方向详见审计回执，规划方向由规划层定。
- **修复记录（2026-08-13，checklist-gap-hardening 第一批）**：✅ 已修复。改动文件：`sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/AuthController.java`（登录 + 刷新双入口 status 校验：status=1 停用 / 2 锁定 / null 与未知值一律拒绝，登录不签发 access/refresh token，刷新拒绝续期，401 返回语义区分"账号已停用/账号已锁定"）+ 两个 auth 测试文件（`AuthControllerTest.java`、`AuthFlowIntegrationTest.java`）。新增测试 10 个，后端全量 **435 tests / 0 failures** 全绿。功能清单 M01-F02-02 已回升 ✅。遗留说明：停用前已签发且未过期的 access token 至自然过期仍可用，属方向文档范围外（后续批次可评估）。

### I34：M01-F02-04 人员查询（清单标 ✅，实际条件查询未实现、仅分页）

> 当前修正（2026-08-18）：关键字、状态、部门含下级、岗位、角色筛选已接入后端并支持组合；DISTINCT/EXISTS 保证无重复，H2 双租户、数据权限、逻辑删除、停用和删除关联项结果集已验证。旧段落保留为历史记录。

- **发现日期**：2026-08-12
- **严重程度**：低（查询条件不生效）
- **可信度**：CONFIRMED（2026-08-12 审计现场核实）
- **描述**：`功能清单.md` 原标 ✅ 已完成，实际人员条件查询未实现，仅分页；前端筛选参数发出但不生效。
- **现状证据**：`SysUserServiceImpl.page()` 返回 selectPage 忽略查询条件；前端 `UserList.vue` username/status 筛选发出但不生效（审计回执问题 1 差异表 M01-F02-04）。
- **影响**：此前会让后续会话误判"已完成"，风险高；人员列表无法按条件筛选。
- **建议**：状态列已按审计回执同步降级为 🟦；缺口修复方向详见审计回执，规划方向由规划层定。

### I35：M01-F03-01 岗位管理（清单标 ✅，实际人员与岗位关联未实现）

> 当前修正（2026-08-18）：用户-岗位多选关系、读写端点、Mock/fixture 和测试已闭合，支持替换、清空、回填及查询过滤。旧段落保留为历史记录。

- **发现日期**：2026-08-12
- **严重程度**：低（缺人员关联）
- **可信度**：CONFIRMED（2026-08-12 审计现场核实）
- **描述**：`功能清单.md` 原标 ✅ 已完成，实际岗位 CRUD 完整，但"人员与岗位关联"未实现。
- **现状证据**：`PostController` + `PostControllerTest`(6)；无用户-岗位关联表/接口，`UserList.vue` 表单无岗位字段（审计回执问题 1 差异表 M01-F03-01）。
- **影响**：此前会让后续会话误判"已完成"，风险高；岗位-人员关联能力缺失。
- **建议**：状态列已按审计回执同步降级为 🟦；缺口修复方向详见审计回执，规划方向由规划层定。

### I36：M02-F01-01 角色管理（清单标 ✅，实际角色与人员/用户组绑定未实现）

> 当前修正（2026-08-19，user-group-membership D117 PASSED + 阶段三 COMPLETED）：用户组维护与成员绑定闭环已闭合——`sys_user_group`/`sys_user_group_member` 双表（V34 双方言）、组 CRUD/启停/逻辑删除、成员保存/替换/清空/移除/回填、数据范围与租户隔离、非 superadmin 零隐式授权、请求级鉴权；M01-F04-01 ⬜→🟦（终态确认）。**I36 正式关闭**（关闭的是剩余用户组绑定缺口），**P28 核销**；「供流程与权限引用」消费端未接，M01-F04-01 不得升 ✅。旧失败过程（D113-D116）见历史审查回执，不残留在当前态。
> 历史修正（2026-08-18）：用户-普通角色绑定读写、替换/清空/回填及非 superadmin 保护已闭合；用户组绑定当时不在 D98 范围，不能据此关闭 I36 整项。旧段落保留为历史记录。

- **发现日期**：2026-08-12
- **严重程度**：低（缺人员绑定）
- **可信度**：CONFIRMED（2026-08-12 审计现场核实）
- **描述**：`功能清单.md` 原标 ✅ 已完成，实际角色 CRUD 完整，但"角色与人员/用户组绑定"未实现。
- **现状证据**：`RoleController` + `RoleControllerTest`(6)；`RoleList.vue` 仅 CRUD 弹窗无绑定入口；sys_user_role 无写入端点（仅 `UserDetailsProviderImpl`/`SysMenuServiceImpl` 读取）（审计回执问题 1 差异表 M02-F01-01）。
- **影响**：此前会让后续会话误判"已完成"，风险高；角色-人员绑定无写入入口。
- **建议**：状态列已按审计回执同步降级为 🟦；缺口修复方向详见审计回执，规划方向由规划层定。

### I37：M02-F04-01 数据权限（清单标 🟦，实际仅枚举/字段占位、实质未实现）

- **发现日期**：2026-08-12
- **严重程度**：中（数据权限全不生效）
- **可信度**：CONFIRMED（2026-08-12 审计现场核实）
- **描述**：`功能清单.md` 原标 🟦 部分实现，实际数据权限仅枚举/字段占位，全仓无数据范围过滤逻辑，前端无配置页。
- **现状证据**：`DataScope` 枚举 + `LoginUser.dataScope` 字段存在，但 `UserDetailsProviderImpl` L111 硬编码 `setDataScope(DataScope.ALL)`（审计汇总层已现场复核）；`SysRole.dataScope` 注释"S7 预留，当前不生效"（审计回执问题 1 差异表 M02-F04-01）。
- **影响**：此前会让后续会话误判"部分完成"，风险高；数据权限不生效，跨角色数据隔离无保障。
- **建议**：状态列已按审计回执同步降级为 ⬜；缺口修复方向详见审计回执，规划方向由规划层定。
- **修复记录（2026-08-15，data-scope-enforcement，D77）**：✅ 已修复——M02-F04-01 数据权限完整落地：
  - **装配去硬编码**：登录装配读取用户全部角色 `SysRole.dataScope`，多角色取最宽档（并集语义，档序 ALL > DEPT_AND_CHILD > CUSTOM > DEPT > SELF）；CUSTOM 档装配 customDeptIds（该用户 CUSTOM 角色关联部门的并集）
  - **五档引擎**：`DeptScopeProviderImpl` 实现 DEPT_AND_CHILD（sys_dept 无 ancestors 列 → 递归查询，`@Lazy` 注入破循环依赖）；新建 `sys_role_dept` 表（Flyway V30，h2/postgresql 双份逐字一致）+ Role CRUD 读写 dataScope/deptIds
  - **7 表查询纳管**：sys_user 分页五档 `@DataScope` 直标；6 表等效条件纳管（sw_bpm_instance / sw_agent_graph_execution / sw_agent_model_config / sw_job_info / sw_job_log / sw_storage_file 列表查询）；本就按当前用户过滤的查询（notify recipient、agent session）不重复纳管
  - **前端**：RoleList 五档下拉 + CUSTOM 部门树多选（listTree）+ 编辑回填
  - **验证**：后端全量 **521 tests / 0 failures / 0 errors**（基线 435 → +86）；前端 63f/552t 四连全绿（typecheck/build 为一次性 1024M 内存例外，详见回执披露）；Flyway 冒烟 6 目录链（I47 排除 bpm）28 迁移按序应用 + validate 通过（迁移数口径 27→28 修正：form/h2 `V12__upgrade_form_config_to_per_table.sql` 此前漏计）
  - **遗留**：手写 SQL 通道不纳管（见 I46，与 I10 同源）；dataScope 登录时快照、非实时生效

### I38：M03-F01-02 控件库（清单标 ✅，实际仅 8/17 类可用）

- **发现日期**：2026-08-12
- **严重程度**：中（半数控件未实现）
- **可信度**：CONFIRMED（2026-08-12 审计现场核实）
- **描述**：`功能清单.md` 原标 ✅ 已完成，实际控件库仅 8/17 类可用（enum 现 17 成员），多选/附件/图片/说明文字等未实现。
- **现状证据**：`FieldType.java` 仅 TEXT/RICH_TEXT/NUMBER/DATE/BOOL/DICT/REFERENCE/TABLE enabled=true，其余 **9** 类 enabled=false；前端 palette `field-types.ts` 仅 8 项（审计回执问题 1 差异表 M03-F01-02；2026-08-16 D83 复核：数字 8/16→8/17，enum 17 成员 9 disabled）。
- **影响**：此前会让后续会话误判"已完成"，风险高；表单可选用控件仅半数。
- **建议**：状态列已按审计回执同步降级为 🟦；缺口修复方向详见审计回执，规划方向由规划层定。

### I39：M03-F02-01 表单管理（清单标 ✅，实际删除未实现、版本仅存快照）

- **发现日期**：2026-08-12
- **严重程度**：中（缺删除与版本回滚）
- **可信度**：CONFIRMED（2026-08-12 审计现场核实）
- **描述**：`功能清单.md` 原标 ✅ 已完成，实际新增/修改/查询/发布完整，但"删除"未实现、版本仅存快照无历史列表/回滚。
- **现状证据**：`FormDefinitionController.java` 9 个端点无 `@DeleteMapping`；`form-def.ts` 无删除 API，`FormDefList.vue` 无删除；版本=发布时写 `FormSnapshotEntity` 快照，无历史列表/回滚端点（审计回执问题 1 差异表 M03-F02-01）。
- **影响**：此前会让后续会话误判"已完成"，风险高；表单删除与版本回滚能力缺失。
- **建议**：状态列已按审计回执同步降级为 🟦；缺口修复方向详见审计回执，规划方向由规划层定。

### I40：M03-F04-01 数据管理（清单标 ✅，实际列表/查询条件配置仅自动派生）

- **发现日期**：2026-08-12
- **严重程度**：低（配置仅自动派生）
- **可信度**：CONFIRMED（2026-08-12 审计现场核实）
- **描述**：`功能清单.md` 原标 ✅ 已完成，实际增删改查闭环完整，但"列表配置、查询条件配置"仅自动派生，无持久化/手动配置 UI。
- **现状证据**：`/api/form/data/{formKey}` submit/query/GET/PUT/DELETE 齐全 + `FormData.vue`；列与筛选条件由 `derive-list-config.ts` 从 schema 自动派生，无持久化/手动配置 UI（审计回执问题 1 差异表 M03-F04-01）。
- **影响**：此前会让后续会话误判"已完成"，风险高；列表/查询配置不可定制。
- **建议**：状态列已按审计回执同步降级为 🟦；缺口修复方向详见审计回执，规划方向由规划层定。

### I41：M05-F01-02 消息接收（清单标 ✅，实际缺删除）

- **发现日期**：2026-08-12
- **严重程度**：中（缺删除操作）
- **可信度**：CONFIRMED（2026-08-12 审计现场核实）
- **描述**：`功能清单.md` 原标 ✅ 已完成，实际消息接收（列表+已读）已实现，但缺"删除"。
- **现状证据**：`NotifyController` `GET /notify/messages` + `POST /notify/messages/{id}/read`（越权校验）+ `NotifyHome.vue`（已读/未读）；无删除端点与删除按钮（审计回执问题 1 差异表 M05-F01-02）。
- **影响**：此前会让后续会话误判"已完成"，风险高；消息无法删除。
- **建议**：状态列已按审计回执同步降级为 🟦；缺口修复方向详见审计回执，规划方向由规划层定。
- **修复记录（2026-08-25，M05 通知管理缺口闭环）**：✅ 已关闭。DELETE /notify/messages/{id} 端点已实现（recipient 归属校验 + 逻辑删除），前端删除按钮 + 确认对话框已实现，10 个集成测试全部通过。M05-F01-02 已升 ✅。

### I42：M05-F01-03 消息查询（清单标 ✅，实际无状态/关键字过滤）

- **发现日期**：2026-08-12
- **严重程度**：中（缺过滤查询）
- **可信度**：CONFIRMED（2026-08-12 审计现场核实）
- **描述**：`功能清单.md` 原标 ✅ 已完成，实际消息查询仅按接收人全量倒序，无状态/关键字过滤。
- **现状证据**：`NotifyMessageServiceImpl.findByRecipient()` 仅按 recipientId 全量倒序；前端 `queryNotifyMessages()` 无过滤参数，页面无查询条件 UI（审计回执问题 1 差异表 M05-F01-03）。
- **影响**：此前会让后续会话误判"已完成"，风险高；消息查询不可按状态/关键字过滤。
- **建议**：状态列已按审计回执同步降级为 🟦；缺口修复方向详见审计回执，规划方向由规划层定。
- **修复记录（2026-08-25，M05 通知管理缺口闭环）**：✅ 已关闭。GET /notify/messages 已支持 ?read=true/false 和 ?keyword= 查询参数，前端过滤栏（状态下拉 + 关键词搜索）已实现，10 个集成测试全部通过。M05-F01-03 已升 ✅。

### I43：M10-F03-01 定时任务（清单标 ✅，实际功能完整但生产菜单不可达）

- **发现日期**：2026-08-12
- **严重程度**：中（生产菜单不可达）
- **可信度**：CONFIRMED（2026-08-12 审计现场核实）
- **描述**：`功能清单.md` 原标 ✅ 已完成，实际功能代码完整（任务 CRUD/启停/触发 + 前端页面），但生产菜单树未 seed，仅 dev:mock 可达。
- **现状证据**：后端 `JobInfoController`（/job/info page/get/post/put/delete/pause/resume/trigger）+ `JobLogController` + `QuartzSchedulerService` + 测试 + V17 建表；前端 `JobList.vue`/`JobLog.vue`+spec；菜单仅 seeds.ts mock 注册，后端菜单 SQL（V6/V10/V15/V26）无 job 菜单行（审计汇总层已现场复核，见审计回执问题 1 差异表 M10-F03-01）。
- **影响**：此前会让后续会话误判"已完成"，风险高；生产环境用户无法从菜单进入定时任务功能。
- **建议**：状态列已按审计回执同步降级为 🟦；缺口性质为"补菜单 seed 或接受 mock-only"，规划方向由规划层定（见审计回执"判定口径说明"）。
- **修复记录（2026-08-13，checklist-gap-hardening 第一批）**：✅ 已修复。Flyway **V29 菜单 seed**，h2/postgresql 双份迁移文件：`sw-bootstrap/src/main/resources/db/migration/h2/V29__job_storage_menu_seed.sql`、`sw-bootstrap/src/main/resources/db/migration/postgresql/V29__job_storage_menu_seed.sql`。4 行菜单：id17 定时任务（顶级目录 menu_type=0、component=NULL，仿 V6「低代码」目录先例）→ id18 任务管理（job/list，component=job/views/JobList，permission=job:list）、id19 执行日志（job/log，component=job/views/JobLog，permission=job:log）二级菜单（仿 V10/V15/V26 子菜单先例）；id16 文件管理见 I44。冒烟测试验证 27 个迁移按序应用无 validate 失败 + 4 行菜单逐列断言通过；前端零改动。功能清单 M10-F03-01 已回升 ✅。

### I44：M10-F06-01 文件存储（清单标 ✅，实际功能完整但生产菜单不可达）

- **发现日期**：2026-08-12
- **严重程度**：中（生产菜单不可达）
- **可信度**：CONFIRMED（2026-08-12 审计现场核实）
- **描述**：`功能清单.md` 原标 ✅ 已完成，实际功能代码完整（上传/下载/列表/删除 + 4 个真实 provider），但生产菜单树未 seed，仅 dev:mock 可达。
- **现状证据**：后端 `StorageController`（/storage/files 上传/下载/列表/删除）+ MinIO/Local/COS/七牛 4 个真实 provider + 测试 + V16 建表；前端 `StorageList.vue`+spec；后端菜单 SQL 无 storage 菜单行（审计汇总层已现场复核，见审计回执问题 1 差异表 M10-F06-01）。
- **影响**：此前会让后续会话误判"已完成"，风险高；生产环境用户无法从菜单进入文件存储功能。
- **建议**：状态列已按审计回执同步降级为 🟦；缺口性质为"补菜单 seed 或接受 mock-only"，规划方向由规划层定（见审计回执"判定口径说明"）。
- **修复记录（2026-08-13，checklist-gap-hardening 第一批）**：✅ 已修复。同 I43：Flyway **V29 菜单 seed**（h2/postgresql 双份，文件同上），id16 文件管理（顶级叶子菜单 menu_type=1、parent_id=0，path=storage，component=storage/views/StorageList，permission=storage:view，仿 V6 顶级叶子菜单先例）。冒烟测试逐列断言通过；前端零改动。功能清单 M10-F06-01 已回升 ✅。

### I45：M07/M04/M05/M06/M09/M10 功能清单"虚低"15 条汇总（部分后端骨架未达清单完整度）

- **发现日期**：2026-08-12
- **严重程度**：低
- **可信度**：CONFIRMED（2026-08-12 审计现场核实）
- **描述**：以下 15 条清单标 ⬜ 待开发，代码实际已有部分后端骨架（大多缺前端页面），未达清单描述的完整度：M04-F01-02、M05-F01-01、M06-F04-01、M07-F01-01~05、M07-F02-02、M07-F02-04、M07-F03-02、M07-F04-02、M09-F06-01、M10-F01-01、M10-F08-01（M04-F01-01、M04-F06-01 已由 I3 覆盖，不重复列入）。状态列已按审计回执同步升为 🟦（部分实现）。
- **现状证据**：逐条差异与证据见审计回执 `search_fallback/feature-checklist-full-audit.md` 问题 1 差异表（M04/M05/M06/M07/M09/M10 各模块）。
- **影响**：清单完成度被低估，可能低估已有后端资产；不改变"待开发"方向判断，风险低。
- **建议**：不逐条展开；已知明确的缺口要素（如 M07-F02-04 单步调试未做、M07-F01 系列前端管理页已闭环、M07-F02-02 Prompt 配置已由 D154 闭环）是否投入修复，待规划层方向确认（见 Step5 方案「待确认问题」）。
- **部分关闭记录（2026-08-19，agent-model-management-frontend）**：✅ **M07-F01-01～05 前端缺口已闭环**（P5 / D105 方向）——后端 V33 菜单/按钮权限 seed（菜单 id=209 `agent:model:view`、按钮 id=210 `agent:model:manage`、id=211 `agent:model:test`，不 seed sys_role_menu）+ 前端契约/API/Mock/菜单/页面全闭环（ModelList 分页/名称查询/多 Key 状态/脱敏密钥/编辑空 Key 保留/启停/连通性测试）；后端 584/0/0（582+2）、前端 69f/628t（66f/602t +3f/+26t）四连全绿；清单 M07-F01-01～05 五行 🟦→✅（终态 ✅21/🟦28/⬜41）；P5 核销。**状态注记（2026-08-19，D106 规划层验收 FAILED）**：以上五行上调与 P5 核销为**执行层候选终态，D106 复验通过前不构成规划层最终确认**（审查 `product/agent-model-management-frontend/receipts/planning-review-d106.md`；执行层补证中：后端 +7 用例 591/0/0 已跑通、前端 Mock 语义修正进行中）。**其余 10 条缺口（M04-F01-02、M05-F01-01、M06-F04-01、M07-F02-02、M07-F02-04、M07-F03-02、M07-F04-02、M09-F06-01、M10-F01-01、M10-F08-01）仍待排期**，I45 汇总条目维持开放。
- **部分关闭记录（2026-08-21，agent-graph-prompt-configuration，COMPLETED D157）**：✅ **M07-F02-02 Prompt 配置 COMPLETED（D154功能级PASSED + D157阶段三最终复验PASSED）**——D150主体实现+ D151/D152/D153补证迭代+ D154 12项业务标准全部通过；D155/D156阶段三问题已由 D157 纠正闭合。后端723/0/0/0（sw-basic-agent234）、前端79f/775t四门全绿、Flyway V34零本轮迁移，清单✅24/🟦26/⬜40、功能数28、P6核销。**其余 9 条缺口（M04-F01-02、M05-F01-01、M06-F04-01、M07-F02-04、M07-F03-02、M07-F04-02、M09-F06-01、M10-F01-01、M10-F08-01）当时仍待排期**，I45 汇总条目维持开放。
- **部分关闭记录（2026-08-23，agent-graph-step-debugging，D180 最终验收 PASSED）**：✅ **M07-F02-04 单步调试子集已关闭（D180 规划层最终验收 15/15 PASSED，P7 正式核销、M07-F02-04 升 ✅、清单 ✅26/🟦24/⬜40、功能数 30、基线 827/Agent338、86f/850t、V36）**——D175—D180 全链闭环（调试会话/断点/步进/引擎/安全/既有入口闭环）；G14 计数 `755+72=827` 严格勾稽（71 调试测试 + 1 V36 PG）、完整工具族实际互斥零快照 + 2G 串行门禁（后端 827/0/0/0、前端 86f/850t、V36 36 条）；G15 阶段三实际落盘 + D180 纯终态同步完成。**其余 8 条缺口（M04-F01-02、M05-F01-01、M06-F04-01、M07-F03-02、M07-F04-02、M09-F06-01、M10-F01-01、M10-F08-01）仍待排期**，I45 汇总条目维持开放。
- **部分关闭记录（2026-08-22，agent-token-usage-observability，D170功能级PASSED阶段三已同步）**：🟦→✅ **M07-F04-02 Token 统计阶段三已同步（D170功能级PASSED，12/13，P8已核销）**——标准1—12全部通过；功能级基线后端755/0/0/0（agent267）、前端82f/815t、V35；清单M07-F04-02升✅（25/25/40）、P8核销。**其余 8 条缺口（M04-F01-02、M05-F01-01、M06-F04-01、M07-F03-02、M09-F06-01、M10-F01-01、M10-F08-01、M07-F03-03等）仍待排期**，I45 汇总条目维持开放。

### I52：PG 侧全链迁移无法直跑（V13:58 DROP INDEX 报 2BP01）

- **发现日期**：2026-08-19（agent-model-management-frontend PG 真实库验证时发现）
- **严重程度**：中
- **可信度**：CONFIRMED（真实 PG 库执行现场核实）
- **描述**：`db/migration/postgresql/V13__logical_delete_unique_constraints.sql:58` 对 inline UNIQUE 约束的隐式索引 `sw_form_def_form_key_key` 执行 `DROP INDEX`，PG 报 **2BP01**（`cannot drop index ... because constraint ... requires it`——约束创建的索引须 `DROP CONSTRAINT` 而非 DROP INDEX）。导致 **PG 侧全链 V1→V33 无法在真实库直跑**；**H2 全链不受影响**（测试全绿，FlywayFullChainH2Test 33 条通过）。
- **与本次改动的关系**：非本轮引入（V13 为既有迁移，按硬约束未改 V19-V32 任何脚本）；M07-F01 前端闭环在 PG 真实库（127.0.0.1）验证 V33 时触发，已改走目标验证法（独立临时 schema + baseline=32 + target=33）完成 V33 幂等验证。
- **影响**：PG 生产库无法一次性从零跑通 Flyway 全链；共享库（127.0.0.1）`flyway_schema_history` 不存在，若后续在该库启用正式 Flyway 需先解决此项。
- **✅ 修复记录（2026-08-19，pg-v13-migration-chain-repair，D108 执行层闭环）**：执行层裁定**修改 PG 侧 V13 第 7 项**而非新增 V34——根因是 form/V7 `sw_form_def.form_key ... UNIQUE`（inline UNIQUE）在 PG 创建约束背书的隐式索引 `sw_form_def_form_key_key`，`DROP INDEX` 必 2BP01；PG 侧不存在已成功应用 V13 的既有库（V13 必失败）故修改无既有校验和风险，V14-V33 零引用该索引无下游断裂，而新增 V34 在新库场景永远不可达（V13 执行时即失败）。落地：`ALTER TABLE sw_form_def DROP CONSTRAINT IF EXISTS sw_form_def_form_key_key;` 替代 `DROP INDEX IF EXISTS ...`（随后 `CREATE UNIQUE INDEX uk_sw_form_def_form_key ON sw_form_def (form_key, deleted);` 与注释同步更新）；**仅 PG 侧 V13 一处 SQL，H2 侧 V13 零改动**（H2 允许直接 DROP INDEX，双方言各按自身能力实现同一语义）。验证：新永久测试 `FlywayFullChainPostgresTest`（sw-bootstrap，zonky embedded-postgres 17.5 真实 PG 二进制，Maven test 依赖 `io.zonky.test:embedded-postgres:2.1.0` + `embedded-postgres-binaries-darwin-arm64v8:17.5.0`）——修复前先红复现 2BP01 原文（`cannot drop index sw_form_def_form_key_key because constraint sw_form_def_form_key_key on table sw_form_def requires it`，SQL State 2BP01，V13:58），修复后 **PG 新库全链 33 条 migrate+validate 通过**；既有库升级夹具（独立库 target=32 → 全量只执行 V33 共 33）migrate+validate 通过；逻辑删除唯一性语义正反例（sys_user/sys_tenant 软删重建共存正例 + 23505 反例 + 重复软删 23505 边界）；sw-bootstrap 8 用例全绿（12→20）。项目级全量 **599 tests / 0 failures / 0 errors / 0 skipped**（591+8，MAVEN_OPTS="-Xmx2g" 串行）；H2 全链 33 条回归通过。**语义事实修正（真实 PG 引擎证伪）**：V13 复合唯一 `(key, deleted)` 设计下，同一业务键最多一条 deleted=1 历史——「两条 deleted=1 共存」在 H2/PG 均不可满足（23505），已固化为回归守卫；若要多条软删历史共存需 partial 索引设计（如 bpm binding `WHERE active=true`），属 V13 设计方案层面事项，超出本轮授权。回执：`product/pg-v13-migration-chain-repair/receipts/`。
- **✅ 关闭记录（2026-08-19，D110 规划层最终验收 PASSED + 阶段三终态同步）**：D109 两项补证闭合——①原 V13 checksum 既有环境：git 审计（V13 引入时 V7 inline UNIQUE 已存在，原 V13 自创建起 PG 必失败；失败迁移不落 checksum；无 tag/release/CI 发布通道）证明该类环境不存在，且新增永久守卫用例证明「若登记原 checksum」会显式 checksum mismatch 失败而非静默破坏；②跨平台可移植性：pom 改 `embedded-postgres-binaries-bom:17.5.0` 统一全平台二进制版本（dependency:tree 证据），移除平台 exclusions。补证后 PG 全链测试 9 用例（含 legacy checksum 守卫）、H2 11 用例、项目级 **600/0/0/0**（591→599→600）。功能 **COMPLETED**，方向归档 `product/pg-v13-migration-chain-repair/passed/`；D109 FAILED 为合法历史保留。

### I46：手写 SQL 通道无数据权限（动态宽表/外部数据源 SqlExecutor 绕拦截器链）

- **发现日期**：2026-08-15（data-scope-enforcement 收尾登记）
- **严重程度**：高
- **可信度**：CONFIRMED（方向文档非目标条款 + 探索 Q7 确认）
- **描述**：数据权限拦截器仅对 MyBatis-Plus 通道生效。手写 SQL 通道完全绕过：动态宽表（FormDataQueryService 等 `JdbcTemplate` 裸 SQL，`@TableLogic`/`TenantLineHandler`/数据权限拦截器均失效）与 bpm 外部数据源 `SqlExecutor`。data-scope-enforcement 方向文档（D77）明确将两者列为**不纳管**（非目标条款）。
- **与 I10 关联**：同源——I10 已固化"裸 SQL 必须手写 `deleted` + `tenant_id` 条件"红线（工程宪法 `CLAUDE-java.md` §5.1）；本轮数据权限同样不适用于这些通道，风险面一致。
- **影响**：动态宽表数据与 bpm 外部数据源查询无数据权限过滤；当前按"最小强制集"口径（宽表/外部数据源不在强制集）接受，清单 M02-F04-01 标 ✅ 不受影响
- **临时方案**：明确不纳管；继续依赖代码审查 + 测试双重兜底（同 I10 红线）；若未来纳管，需在 SQL 构建层统一注入数据范围条件（与 I10 建议的 SQL 构建器同方向）

### I47：bpm/h2 迁移链 V8 partial index 语法不兼容（全链 H2 Flyway 从未可跑）

- **发现日期**：2026-08-16（bpm-plugin-architecture 知识库同步正式登记，原临时编号 I32）
- **严重程度**：中
- **可信度**：CONFIRMED（D75 起多次验证门确认）
- **描述**：bpm 模块 H2 迁移链 V8 含 PG 独有 partial index 语法（`WHERE active=true`），H2 不支持——bpm 全链 H2 Flyway 迁移从未可跑，模块测试均绕过 Flyway 直建 DDL（V30 冒烟 6 目录链仍排除 bpm）。
- **影响**：bpm 表结构与索引的真实迁移链无法在 H2 冒烟验证，schema 变更回归风险靠模块测试直建 DDL 兜底（不完整）
- **修复建议**：将 V8 中 partial index 拆为 H2/PG 双方言兼容写法（或 h2 目录用等价普通索引），修复后补真全链迁移测试（已排入候选池；本登记仅为清理 knowledge 注册表悬空引用，非本轮修复）
- **状态更新（2026-08-17，P10 修复轮，✅ 已修复）**：规划层裁定以「PG 保留 partial index 语义 + H2 等价可执行约束」为目标（方向 `product/bpm-h2-v8-compat/passed/direction-bpm-h2-v8-compat.md`，D87 下发）。执行层裁定并落地：H2 2.3.232 不支持 partial index 任何模式，采用**生成列等价实现**——`sw_bpm_form_binding` 新增生成列 `active_key varchar(265) generated always as (case when active then (cast(tenant_id as varchar(64)) || ':' || form_key) end)`（active=true→非空唯一、active=false→NULL 可共存），唯一索引改建于 `active_key`（索引名 `uk_sw_bpm_binding_active` 不变）；仅修改 h2/V8 一个生产迁移文件（该文件从未在任何 H2 库执行成功，无校验和/升级路径风险），pg/V8、V13、V14 零改动。验证：永久真全链测试 `FlywayFullChainH2Test`（sw-bootstrap，junit-jupiter test 依赖）7 目录 **30 条迁移** migrate + validate 通过（28→30，BPM V8/V14 纳入，不再有排除口径）；绑定语义正反例双证（sw-bpm-process `BpmFormBindingServiceImplTest` 8 用例 + 全链 JDBC 断言，唯一冲突 SQLState=23505，含非 active 共存/启停切换/租户隔离）；项目级全量 **543 tests / 0 failures / 0 errors**（527 +16：bpm 71→79 +8、bootstrap 0→8 +8，MAVEN_OPTS=-Xmx2g BUILD SUCCESS 31/31）。规划层最终验收 **PASSED**（D88）并归档 `product/bpm-h2-v8-compat/passed/`。遗留：PG 侧 partial index 运行期语义验证依赖 PG 本地库（规划层授权后可补）。回执：`product/bpm-h2-v8-compat/receipts/`。

### I48：flow-graph adapter 契约限制（无边点击事件/无命令式数据更新通道）

- **发现日期**：2026-08-16（bpm-plugin-architecture 知识库同步正式登记，原临时编号 I31→I46 占用后改 I48，D79 裁定）
- **严重程度**：低
- **可信度**：CONFIRMED（M07 Step9 现场发现，D65 偏差 2/3）
- **描述**：`flow-graph` adapter 契约无边点击事件、无命令式数据更新通道。M07 图设计器绕行方案（GraphDesigner.vue 经 graphAdapter.ts 对接）可用但受限——若未来节点自定义渲染/直接点边编辑需求增多，需回规划层评估扩展 adapter 导出面。
- **影响**：bpm-plugin-architecture 轮明确不扩展 flow-graph adapter（D80 非目标，I48 绕行方案维持现状）；GraphDesigner 属性面板注册表化（Step2）已在不触碰 adapter 契约的前提下完成
- **临时方案**：绕行方案已生效，扩展待评估

### I49：V29 菜单 seed 未 seed sys_role_menu（job/storage 菜单仅超管可达）

- **发现日期**：2026-08-16（D83 known-issues 复核登记）
- **严重程度**：中
- **可信度**：CONFIRMED（D83 复核现场核实）
- **描述**：`V29__job_storage_menu_seed.sql:20`（h2/pg 双份）注释明言「不 seed sys_role_menu（超管旁路，V6 决策沿用）」——正式环境 job/storage 菜单仅超管（superadmin 角色旁路）可达，普通角色即使有 `job:list`/`storage:view` 等 permission 也无菜单授权入口。
- **影响**：I43/I44 修复记录「生产菜单可达」口径仅对超管成立；普通角色在正式环境无法从菜单进入定时任务/文件存储功能。
- **建议**：如需普通角色可达，需为 job/storage 菜单补 sys_role_menu 授权 seed 或提供角色菜单绑定入口（后者同时服务 M02-F02-01 角色菜单配置）。
- **✅ 修复记录（2026-08-18，admin-role-governance，D96 PASSED）**：V31 为普通 `admin` seed 现有菜单及 200–208 job/storage 按钮权限；角色菜单读写入口、job/storage 方法级鉴权及 MockMvc 请求级 200/403/401 证据闭合。方向已归档至 `product/admin-role-governance/passed/`，I49 关闭。
- **后续证据（2026-08-19，role-menu-permission-parity D121 功能级 PASSED，补充不重写）**：在 I49 修复基础上完成角色菜单/按钮权限契约一致性收口——真实 API（`GET/PUT /system/role/{id}/menus`）—Mock（handler 真实状态更新 + superadmin 400）—页面（RoleList 权限树加载/保存/清空/回填/半选）—安全回归（superadmin 双层保护、非超管授权链：已授权菜单可见正面/撤权不可达/按钮显隐/接口允许拒绝/未认证 401）—租户隔离逐项一致；后端 670/0/0/0、前端 73f/678t、生产代码与 Flyway 零修改；清单 M02-F02-01/F03-01 🟦→✅（✅23/🟦27/⬜40）、P1 核销。回执：`product/role-menu-permission-parity/receipts/`。
- **修正注记（2026-08-20，role-menu-permission-parity D122 退回修正，补充不重写）**：D122 规划终验发现四项偏差（生产 403 契约 / 停用角色授权 / Mock 双角色身份 / 阶段三问题登记），2026-08-20 执行层全部修正——`GlobalExceptionHandler` 新增 `AuthorizationDeniedException` 分支（HTTP 403 + body 403）、菜单/权限装配对称按 `sys_role.status=1` 过滤（停用角色有效撤权）、Mock 超管/普通 admin 双角色身份分离（见 I53/I54）；后端 **674/0/0/0**、前端 **73f/681t**，零 Flyway。修正回执：`product/role-menu-permission-parity/receipts/d122-fix-receipt.md`。

### I50：AuthController.login 状态校验位于密码匹配之后（时序/资源问题）

- **发现日期**：2026-08-16（D83 known-issues 复核登记）
- **严重程度**：低
- **可信度**：CONFIRMED（D83 复核现场核实）
- **描述**：`AuthController.login` 状态校验（L92-97 statusDenyMessage）位于密码匹配（L88 BCrypt）之后——停用/锁定账号仍消耗一次 BCrypt 校验与一次用户查询后才被拒绝。
- **影响**：仅时序/资源问题，无安全漏洞（最终仍拒绝签发 token，与 I33 修复不冲突）。
- **建议**：低优先级，可随 I51 修复轮顺带调整校验顺序（先状态后密码）。

### I51：前端 status 语义与后端相反（UI 新建用户无法登录、停用不阻断登录）

- **发现日期**：2026-08-16（D83 checklist 复核发现，high 价值）
- **严重程度**：高
- **可信度**：CONFIRMED（D83 复核现场核实）
- **描述**：前端 `UserList.vue:337-341`/`DeptList.vue:314-317` 映射「正常=1/停用=0」（默认值 L104/L72=1），而后端 `SysUser.java:41` 为「0=正常 1=停用 2=锁定」、`AuthController.java:189-194` 仅 status=0 放行、`SysDept.java:33` 为「0=正常 1=停用」。后果：①UI 新建用户默认 status=1 → 后端判为停用，**UI 创建用户无法登录**；②UI 选「停用」(0) → 后端视为正常，**停用不阻断登录**——I33 的后端修复（D76 已 PASSED）在 UI 路径被反转抵消；③部门新建默认 1 亦被后端视为停用。
- **对照**：SysRole/SysPost 后端注释恰为「1=启用 0=停用」，前端映射与角色/岗位一致、与用户/部门相反——**属前端值映射错误而非注释漂移**。
- **建议**：按后端口径（0=正常 1=停用 2=锁定）修正 UserList/DeptList 的 status 映射与默认值（含 spec 断言同步）。
- **✅ 修复记录（2026-08-17 status-semantics-alignment）**：前端单项目修复轮（方向 `product/status-semantics-alignment/ready/`）。①后端契约核实（只读）：SysUser=0/1/2（实体注释 + AuthController 登录/refresh 校验 + AuthFlowIntegrationTest + sys_user_status 字典四重证据）、SysDept=0/1（实体注释 + sys_common_status 字典）、SysRole/SysPost=1=启用/0=停用（前端现状与其一致，方向 §4 指示未修改）；②前端修正：UserList/DeptList 新建默认与 resetForm 改 `status=0`（正常）、选择项/筛选/展示按契约（用户三态含锁定=2，tag 三分支 success/info/warning；部门两态）、新增 `src/modules/system/constants.ts` 集中常量（SYS_USER_STATUS/SYS_DEPT_STATUS + 选项与 tag 纯函数，仅服务用户/部门页，未扩散为全局字典重构）；③Mock 与测试同步：seeds.ts 用户/部门种子、handlers.ts create 默认 `?? 1→?? 0`（role/post 部分未动）、user/dept API spec 夹具按新语义、UserList.spec +5 / DeptList.spec +2 覆盖正常/停用（含锁定）提交与回填；④验证：前端四连全绿 **66f/576t**（569+7），typecheck/lint/build 退出码 0；后端零修改。⑤角色/岗位/字典页未触碰（字典页不在方向 §4 范围，回执报告）。

> 新发现问题请按格式追加到此文件，并在 `current-status.md` 中同步更新阻塞状态。

### I53：方法级鉴权拒绝被 GlobalExceptionHandler 兜底为 HTTP 500（403 契约失真）

- **发现日期**：2026-08-19（role-menu-permission-parity D121 step1 现场发现并披露）
- **严重程度**：中
- **可信度**：CONFIRMED（请求级实证：`@PreAuthorize("@ss.hasPermi(...)")` 拒绝时实际返回 HTTP 500 + body code=500）
- **描述**：Spring Security 6 方法安全抛出的 `AuthorizationDeniedException` 是运行时异常，穿透 `ExceptionHandlerInterceptor` 直达 `DispatcherServlet`，被 `GlobalExceptionHandler.handleException` 通用兜底捕获 → HTTP 500 + body code=500。拒绝语义虽成立（数据未修改），但「已认证无权限 → 403」的契约失真，前端与 Mock 的 403 语义无法在生产链路获得真实证据。
- **影响**：已认证无权限请求返回 500 而非 403；D121 验收 1/5/7 的请求级 403 证据只能通过测试专用处理器改写链路获得，非生产链路。
- **✅ 修复记录（2026-08-20，role-menu-permission-parity D122 退回修正）**：`GlobalExceptionHandler` 新增 `AuthorizationDeniedException` 专用分支（`@ResponseStatus(HttpStatus.FORBIDDEN)` + body code=403，与 `RestAccessDeniedHandler` 语义一致）；sw-common 补 `spring-security-core` 编译期依赖（版本由 spring-boot-dependencies BOM 管理）；移除测试类中改写链路的专用 `GlobalExceptionHandler` 覆盖（`RoleMenusContractAndSecurityTest` 恢复真实生产链路）。新增 `GlobalExceptionHandlerTest`（sw-common 2 用例：403 分支 + 500 兜底不变）。验证：sw-biz-system-biz 13/13 全过、项目级全量 **674/0/0/0**、生产响应链路 `access denied → HTTP 403 + body 403` 实证（日志 `access denied: Access Denied`）。

### I54：角色停用（status=0）后菜单/按钮权限仍按绑定装配（停用不能有效撤权）

- **发现日期**：2026-08-19（role-menu-permission-parity D121 step3b 请求级实证，D122 退回要求纳入权威问题注册）
- **严重程度**：高
- **可信度**：CONFIRMED（请求级 + Service 级 + 真实装配三路径实证）
- **描述**：`SysMenuServiceImpl.loadMenuIdsByUserId`（菜单树）与 `UserDetailsProviderImpl.loadPermissions`（按钮 permission）直接经 `sys_user_role → sys_role_menu` 装配全部绑定角色，不按 `sys_role.status` 过滤；而 `toLoginUser` 的 roles 装配按 `status=1` 过滤——两处不对称。后果：角色停用后该角色绑定的菜单仍可见、按钮 permission 仍装配，用户仍可通过相应 permission 调用接口，**停用不能作为有效撤权手段**。
- **影响**：停用角色仍持续授予菜单与按钮权限，直接影响普通角色授权边界（D121 验收 4/5）。
- **✅ 修复记录（2026-08-20，role-menu-permission-parity D122 退回修正）**：①`SysMenuServiceImpl.loadMenuIdsByUserId` 装配链插入启用角色过滤（`sys_role.status=1`，与权限装配对称）；②`UserDetailsProviderImpl.loadPermissions` 同步按启用角色过滤（roles/菜单/权限三侧统一）。测试更新：`AuthMenusContractAndSecurityTest` A4 用例由「如实记录旧行为」改为「撤权生效」断言（请求级空树 + service 级空树），A9 真实装配用例改为「停用角色 permissions 不再装配」；测试类 12/12 全过。项目级全量 **674/0/0/0**。
