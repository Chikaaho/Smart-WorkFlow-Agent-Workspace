# agent-model-management-frontend：大模型管理前端闭环（P5 / M07-F01-01～05）

## 当前状态

**COMPLETED ✅（2026-08-19）**：D105 方向（`product/agent-model-management-frontend/ready/direction-agent-model-management-frontend.md`，11 项验收标准）下发后，执行层从工作区根以执行角色自主拆分闭环：后端菜单可达性审计 + V33 最小权限 seed + 全量验证（提交 `d4d7dc3`）→ 前端契约/API/Mock/菜单/页面 + 专项测试（提交 `e26e5f0`）→ 知识库全量同步 + 回执。完成回执与测试回执已提交至 `product/agent-model-management-frontend/receipts/`，**待规划层最终验收**（验收通过后核销 P5 终态；清单五行 🟦→✅ 已按方向 §4「只有五项页面闭环全部满足才可提升」达标后先行同步）。

## 范围（方向 §1-§3）

- **目标**：为既有大模型配置后端能力补齐可达、可授权、可验证的前端管理闭环——管理员通过页面完成模型接入、参数配置、密钥维护、多 Key 状态查看和连通性测试。
- **非目标**：不修改后端模型 CRUD、AES 加密存储、动态 ChatModel 构造、多 Key 轮询、额度锁定或连通性探测的业务语义；不新增显式加载/卸载 API；不纳入 F02 Prompt 配置/运行日志/单步调试、工具管理页、Token 统计、助手配置、RAG 或 SSE 对话窗口；不调整图设计器模型下拉契约；不默认扩大普通角色权限；不为本功能改业务表结构。
- **产品语义要点**：API Key 只展示脱敏值、编辑留空保持旧密钥、明文仅存在于当次提交输入；`lockedUntil` 等运行态只读；动态装载沿用「配置变更后下次调用即时生效」既有语义（无虚假加载/卸载按钮）；连通性测试结果至少呈现成功/失败、后端消息与耗时，不擅自改判 4xx 可达语义；Mock 与真实接口在列表/保存/删除/脱敏/空 Key 保留/权限/连通性结果结构上保持一致。

## 交付物

### 后端（零 Java 业务改动，仅迁移 seed + 测试）

- 菜单可达性审计结论：生产菜单缺「大模型管理」入口与 `agent:model:manage`/`agent:model:test` 按钮权限（V6/V10/V15/V26/V29/V31 全量 grep，id=7 下仅 V26 id=15「图定义管理」）；后端 `AgentModelController` 权限契约 view/manage/test 三类与 seed 一一闭合。
- **V33 菜单/按钮权限 seed**（H2+PG 双方言逐字节一致，`db/migration/{h2,postgresql}/V33__agent_model_menu_seed.sql`）：
  - 菜单 id=209（parent=7 智能体、menu_type=1、permission=`agent:model:view`）「大模型管理」，path=`model`、component=`agent/views/ModelList`、icon=`Cpu`、sort=20（图定义管理 sort=10 之后）。
  - 按钮 id=210（`agent:model:manage`，新建/编辑/删除）、id=211（`agent:model:test`，连通性测试），仿 V31（id=200-208）按钮行先例，path/component 空串。
  - id 分配现场核实：1-14=V6/V10/V15、15=V26、16-19=V29、200-208=V31，**209-211 为空闲最小值**。
  - 幂等：按钮行 `INSERT ... SELECT ... WHERE NOT EXISTS`（V31 先例）；**不 seed sys_role_menu**（V6/V26 决策沿用：普通 admin 是否授按钮权限由菜单管理页面配置，菜单/按钮对 superadmin 旁路可见可用）。
- 验证：`MAVEN_OPTS="-Xmx2g" mvn test` 项目级 **584 tests / 0 failures / 0 errors**（验收下限 ≥582 达标；FlywayFullChainH2Test 11→12）；H2 新库全链 **33 条迁移** migrate+validate 通过 + 新增永久测试 `upgradeChain_V32_to_V33_shouldPass`（V32→V33 升级链 + 209/210/211 产物断言 + `sys_role_menu` 零关联断言）；PG 真实库（127.0.0.1 共享开发库，`flyway_schema_history` 不存在）以一次性临时 JUnit（`PgV33VerificationTest`，验证后删除）在**独立临时 schema** 上 `baseline=32`、`target=33` 执行：迁移 1 条、二次 migrate 0 条（幂等）、产物断言全部通过、V26 既有行原样保留、public schema 零改动。

### 前端（提交 `e26e5f0`）

- 契约/API/Mock/菜单/路由/页面全闭环：ModelList 分页 + 名称关键字查询 + 协议/模型/启停/多 Key 分组/优先级/额度锁定状态展示（列表不含明文或密文 Key）；新增/编辑表单覆盖既有契约字段（名称、协议 openai/ollama/other、API 地址、模型名称、API Key、temperature、maxTokens、topP、超时、重试、启停、备注 + 多 Key 分组/排序/额度冷却配置）；删除、启停、单条连通性测试（成功/失败 + 后端消息 + 耗时）。
- 密钥安全边界：仅展示后端返回的脱敏值；编辑不填新 Key 保持旧密钥；前端不还原/缓存/回显明文（自动化证据证明响应、页面、日志、URL、本地/会话存储与测试快照均不含明文或 `apiKeyCipher`）。
- 菜单/路由接入：生产菜单可达（V33 id=209），刷新/直达路由行为一致；按钮级显隐按 `agent:model:manage`/`agent:model:test` 权限；GraphDesigner 模型下拉兼容回归。

## 验证证据

- 后端：**584 tests / 0 failures / 0 errors**（582+2，BUILD SUCCESS；29 模块）；H2 全链 33 迁移 + V32→V33 升级链 migrate+validate；PG 真实库临时 schema V33 幂等执行通过（public 零改动）。
- 前端：**69 spec files / 628 tests / 0 failures**（66f/602t → +3f/+26t）2G 上限四连（typecheck/lint/test/build）退出码全 0；含列表、表单、密钥脱敏/空 Key 保留、权限、连通性、Mock 一致性专项证据。
- 执行约束：前后端编译严格串行，每次执行前保留互斥检查证据（pgrep 无 pnpm/vite/vitest 进程）。
- 提交：后端 `d4d7dc3`（V33 seed + 全链测试断言），前端 `e26e5f0`（前端闭环）。

## 清单与问题同步

- 功能清单 M07-F01-01～05 五行 🟦→✅（M07-F02/F03/F04 及其他模块零触碰），终态 **✅21/🟦28/⬜41 共 90 行**。
- P5 核销（`todo/requirement-pool.md` 状态 READY → ✅ 已核销）。
- I45（M07/M04/M05/M06/M09/M10 虚低 15 条汇总）中 M07-F01-01～05 前端缺口关闭（I45 汇总条目本身维持开放，其余 10 条缺口不受本轮影响）。
- 新登记 I52（PG V13:58 2BP01 缺陷，非本轮引入，建议 V34 修复迁移）。

## 遗留事项

| 问题 | 严重程度 | 计划处理 |
|------|:---:|------|
| 既有 PG `postgresql/V13__logical_delete_unique_constraints.sql:58` 对 inline UNIQUE 隐式索引 `sw_form_def_form_key_key` 执行 `DROP INDEX`，PG 报 2BP01（约束创建的索引须 DROP CONSTRAINT）——**PG 侧全链 V1→V33 无法在真实库直跑**（H2 全链不受影响，测试全绿） | 中 | 已登记 I52，建议规划层决策另立修复迁移（如 V34 将 `sw_form_def` 的 UNIQUE 约束改建于显式索引）；PG 共享库 `flyway_schema_history` 不存在，若后续启用正式 Flyway 需先解决此项 |
| 规划层最终验收尚未完成（回执已提交，待 D 编号裁定） | — | 规划层验收后核销 P5 终态 |

## 相关链接

- 方向：`product/agent-model-management-frontend/ready/direction-agent-model-management-frontend.md`（D105，2026-08-19，11 项验收标准）
- 回执：`product/agent-model-management-frontend/receipts/`（backend-seed-and-verify-execution.md 已提交；完成/测试回执由执行层提交）
- 前置：[[agent-model-orchestration]]（M07-F01 Steps 1-5 后端全量已实现：模型 CRUD/AES 加密/连通性测试/多 Key 轮询额度限流/动态装载语义；F01 前端管理页为此轮唯一缺口）
