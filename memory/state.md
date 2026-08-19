# 当前状态

> 最后更新：2026-08-20（role-menu-permission-parity COMPLETED，第 26 个已完成功能）

## 最近完成功能

**role-menu-permission-parity（P1 / M02-F02-01 / M02-F03-01）COMPLETED（D123 规划层最终验收 PASSED + 阶段三终态同步，2026-08-20）✅**：D122 四类偏差全部闭合（真实生产 403 契约 / 停用角色有效撤权 / Mock 双角色身份 / I53+I54 权威登记）；后端 **674/0/0/0**、前端 **73f/681t** 四连全绿，零 Flyway。M02-F02-01/F03-01 ✅、P1 正式核销、功能数 26；主方向已归档 `product/role-menu-permission-parity/passed/`。规划复验：`product/role-menu-permission-parity/receipts/planning-final-review-d123.md`；终态同步回执：`receipts/post-d123-terminal-sync.md`。

**user-group-membership（P28 / I36 / M01-F04-01 基础子集）COMPLETED（D120最终确认，2026-08-19）✅**：业务十一项验收全部通过；后端 **647/0/0/0**、前端 **71f/646t**、V34 双方言 34 条全链确认。**I36 关闭、P28 核销、M01-F04-01 🟦 终态（✅21/🟦29/⬜40）、功能数 25**；三份方向均归档 `product/user-group-membership/passed/`，ready/ 已清空。最终验收：`product/user-group-membership/receipts/planning-stage3-review-d120.md`。

## 最新状态与最近完成

**pg-v13-migration-chain-repair（I52）COMPLETED（D110，2026-08-19）✅**：修复 PG 侧 V13 第 7 项 2BP01（`DROP INDEX`→`ALTER TABLE sw_form_def DROP CONSTRAINT`，H2 侧 V13 零改动、不新增 V34）；永久 `FlywayFullChainPostgresTest`（zonky embedded-postgres PG 17.5）先红后绿——新库全链 33 条 migrate+validate、既有库升级夹具（target32→V33）、原 V13 checksum 显式失败守卫、逻辑删除唯一性语义正反例（23505/软删重建共存/重复软删边界）；pom 改 `embedded-postgres-binaries-bom:17.5.0` 统一全平台；H2 全链 11 用例零退化；项目级 **600/0/0/0**（591→599→600）。I52 正式关闭；方向归档 `product/pg-v13-migration-chain-repair/passed/`。

**agent-model-management-frontend（P5 / M07-F01-01～05）COMPLETED（D107，2026-08-19）✅**：D106 已通过的主体实现、V33、H2 33 条与 V32→V33、前端 69f/628t 四连证据保留；补证新增 7 个后端用例，闭合 `other`、远端4xx可达、未认证401及禁用/锁定与Mock真实语义，后端项目级 **591/0/0**。P5核销、I45中M07-F01子集关闭、五条清单✅获规划确认；方向归档 `product/agent-model-management-frontend/passed/`。

**department-query-filtering（I31 / M01-F01-04）COMPLETED（D104，2026-08-18）✅**：部门名称/状态组合筛选、命中节点+必要祖先、非法状态400、租户/逻辑删除边界、前端筛选与Mock均闭合；后端582/0/0/0、前端66f/602t四连，零Flyway。D103终态同步缺口已全文修正，I31关闭、M01-F01-04确认为✅，方向归档 `product/department-query-filtering/passed/`。

**admin-role-governance（P24 / I49）COMPLETED（D93-D97，2026-08-18）✅**
- 双角色基线：不可变内置 `superadmin` + seed 可配置普通 `admin`；不新增默认用户、不迁移既有绑定。
- 普通角色菜单/按钮权限与最小用户角色绑定闭环；job/storage 请求级授权200、撤权403、未认证401。
- V31 H2/PG 双份，冲突显式失败；H2全链31，后端551/0/0/0，前端66f/576t四连全绿。
- 功能清单终态 ✅15/🟦34/⬜41 共90；I32/I34/I35 三行由 🟦→✅，I36 仍🟦且仅关闭本轮子集，P1其余缺口开放。
- 归档：`product/admin-role-governance/passed/`；最终收尾 `receipts/planning-stage3-review-d97.md`。

上一业务功能 bpm-h2-v8-compat（P10 / I47）及其阶段三知识同步收尾修正均已 `PASSED` 并归档。

**知识清理任务 PASSED（2026-08-18，D91/D92）**：执行层完成 `knowledge/features/` 18 个非模板文件 100% 扫描，修正 sysrole、status-semantics、bpm-plugin 三个已知欠账，并额外发现和修正 data-scope-enforcement；旧终态词全文零残留。功能清单、代码、测试、迁移零改动，未建立 P/I 编号。归档：`product/feature-tracking-terminal-state-cleanup/passed/`。

**阶段三收尾修正 PASSED（2026-08-18，D89/D90）**：执行层已按一致性审计修正 9 个指定文件并完成全文复核；规划层六项验收通过。同步回执：`product/bpm-h2-v8-compat/receipts/post-sync-correction.md`。另披露 3 个独立历史欠账（sysrole/status-semantics/bpm-plugin 功能追踪文件仍有待验收旧状态），不属于 P10/D89 范围，待单独清理。

## 既有完成记录

**bpm-h2-v8-compat（P10 / I47）PASSED（D87/D88，2026-08-17）✅**
- H2 V8 partial index 改为生成列 `active_key` + 唯一索引，PostgreSQL V8 零改动，双方言保持 active 条件唯一语义一致。
- 永久 `FlywayFullChainH2Test` 将 BPM V8/V14 纳入 7 目录真实全链，迁移口径 28→30，migrate + validate 全绿。
- 测试门（2G、串行）：BPM process 58/0/0、bootstrap 8/0/0、项目级 **543/0/0**。
- 归档：`product/bpm-h2-v8-compat/passed/direction-bpm-h2-v8-compat.md`。

上一完成：sysrole-v5-column-alignment（P13 / I26）已于 2026-08-17 最终验收 `PASSED` 并归档。

- 已闭环：SysRole.java:47,51 @TableField → `built_in`/`remark`（字段名/JSON 键不变）；schema-datascope-h2.sql 与 AuthFlowIntegrationTest.java 建表/索引/INSERT/注释全对齐 V5 链尾；grep `is_builtin` 主代码/测试零残留。
- 测试门（MAVEN_OPTS=-Xmx2g）：sw-biz-system-biz 模块 **111/0/0**（5 关键类全 PASSED）→ 项目级全量 **527/0/0 与基线持平**；MP 生成 SQL 原文 `built_in`/`remark AS description` 闭合。
- 边界：Flyway 零迁移、前端零改动、P10/P12 零触碰；H2 真全链验证仍受 I47（P10）阻断（如实分离）。
- 验收：六项验收方向全部满足；模块 111/0/0，项目级 527/0/0，无 Flyway/前端/P10/P12 越界。
- 归档：`product/sysrole-v5-column-alignment/passed/direction-sysrole-v5-column-alignment.md`。

---

**agent-model-orchestration (M07-F01/F02/F04)：F01 全部完结（Step1-5），F02 全部完结（Step6-9）**

已完成 Step 汇总（方案均在 `product/agent-model-orchestration/passed/`）：

| Step | 内容 | 关键产物 | 判定 |
|------|------|---------|------|
| Step1 | 模型管理 CRUD + AES 加密 + 连通性测试 | V19 sw_agent_model_config；15 新测（262→277） | PASSED（D53） |
| Step2 | 最小 LangGraph4j 编排引擎 + 动态 ChatModel + 动态装载 | AgentGraphFactory/ChatModelFactory/ServiceImpl；14 新测（277→291） | PASSED（D55/D56/D57） |
| Step3 | 工具沙箱（内部方法 + 外部 HTTP，FunctionToolCallback+lambda，DB 白名单） | V20 sw_agent_tool_internal/external；16 新测（291→307） | PASSED（D59） |
| Step4 | F04 多轮会话持久化（ThreadLocal messages 注入 + 消息持久化 + 工具日志 + 2 查询端点） | V21-V23 三表；21 新测（307→328）；AgentConversationController | PASSED（D61） |
| Step5 | 多Key轮询/额度限流（group_key 分组 + sort 优先级 + 429 识别切换 + locked_until 冷却） | V24 追加 4 列；13 新测（328→341）；ChatModelFactory 零改动 | PASSED（D62） |
| Step7 | F02 图定义 CRUD + 版本 + 发布骨架（纯存储，零执行语义） | V25 sw_agent_graph_def + ProcessGraph/GraphElement + 6 端点；21 新测（341→362） | PASSED（D63） |
| Step8 | F02 图解释执行引擎第一版（LLM/工具/条件分支节点解释执行 + 执行前校验 + 步数上限） | AgentGraphInterpreter + 执行 Service/端点；23 新测（362→385） | PASSED（D64） |
| Step9 | F02 前端图设计器对接（列表 + 画布 + graphAdapter 转换层 + V26 菜单迁移） | 前端 3 spec 18 新测（60f/521t→63f/539t）；后端 385 持平 | PASSED（D65） |
| Step10 | F02 多变量执行上下文后端地基（执行上下文单一文本→命名变量表：config.inputVar/outputVar 契约键 + 默认变量 input 零迁移锚点 + CONDITION/END 经 inputVar 指定匹配/输出变量 + 未定义变量运行时错误；DTO 仅注释同步零契约变更） | AgentGraphInterpreter 变量表改造 + 2 DTO 注释；7 新测（385→392）；无 Flyway | PASSED（D66） |
| Step10-前端 | F02 多变量执行上下文前端（图设计器属性面板 LLM/TOOL 节点新增输入变量名/输出变量名输入项） | graphAdapter 键常量 + GraphDesigner 输入项 + 2 spec；7 新测（63f/539t→63f/546t） | PASSED（D67） |
| Step11 | F02 并行/循环节点（LOOP/FORK/JOIN 节点类型 + 多活跃执行点逻辑并发执行模型 + 步数预算公式改造 `2×节点数+ΣmaxIterations×节点数` + 执行前校验增强；变量冲突=最后写入覆盖） | AgentGraphInterpreter 执行模型改造 + graphAdapter/GraphDesigner 前端色板/属性面板；后端12新测（392→405）/前端6新测（63f546t→63f552t） | PASSED（D68/D69） |
| Step12 | F02 执行历史持久化（V27/V28 执行记录+节点明细双表 + 解释器轨迹采集 NodeExecutionTrace(nodeSeq/branchId/耗时/变量快照) + 错误分类 GraphExecutionException.category 8类 + Service包夹落库覆盖成功/失败路径 + 查询端点列表/详情/节点明细；本轮未做前端） | AgentGraphInterpreter+AgentGraphExecutionServiceImpl改造 + V27/V28迁移 + AgentGraphExecutionController；后端21新测（405→426） | PASSED（D70/D71） |

测试基线轨迹：后端 pre-Step1=262 → Step1=277 → Step2=291 → Step3=307 → Step4=328 → Step5=341 → **Step7=362 → Step8=385 → Step9=385（持平）→ Step10=392 → Step11=405 → Step12=426**；前端 60f/521t → **63f/539t → 63f/546t → 63f/552t**（Step12 未做前端，持平；主树口径，排除 `.claude/worktrees/` 陈旧报告，D57）

**当前架构要点**（派生自代码，此处仅记关键约定）：
- 图拓扑：START→callModel→END 单节点；agentic loop 在 ChatModel.call() 内建（internalCall 递归），不外显
- ThreadLocal 注入四件套：chatModel / tools / historyMessages / toolCallRecords（bind-finally-clear 对称，ServiceImpl finally 保证全清）
- Flyway：agent 路径 V19-V25 已占（V25=图定义表）+ **V27/V28 已占**（Step12 执行历史双表）；root 路径 V26（Step9 菜单迁移）、V29（job/storage 菜单 seed）、V30（sys_role_dept）、**V31（admin role governance）已占**；当前最高 V31，无空闲 V 号
- 大字段：H2=CLOB / PG=TEXT；agent 模块 create_by=VARCHAR(64)（偏离 bigint 惯例）；status=VARCHAR(20)；create_time=TIMESTAMP 无默认值（MetaObjectHandler 填充）

**M07-F01「大模型管理」+ F02「图设计器」（含 Step11 并行/循环节点 + Step12 执行历史持久化）全部完结**，详情均在对应 `passed/step-N-*.md`，不在此重复摘录——关键架构结论：①F01（LangGraph4j）与 F02（自建 `AgentGraphInterpreter`）两条执行路径并存互不干扰；②条件分支=关键词子串匹配（不支持正则）；③execution context 自 Step10 起为命名变量表（`config.inputVar`/`outputVar`，默认变量 `input` 零迁移）；④Step11 起支持 LOOP（回边+迭代计数）/FORK/JOIN（多活跃执行点逻辑并发，非线程级），变量冲突=最后写入覆盖（D68）；⑤**Step12 起执行历史落库**：V27 `sw_agent_graph_execution`（执行记录）+ V28 `sw_agent_graph_execution_node`（节点明细）双表，分支标识=branchId 路径字符串（FORK按出边顺序追加下标），错误分类=`GraphExecutionException.category` 8类，成功/失败路径统一由 Service 包夹落库（D70/D71）；查询端点复用 `agent:model:view` 权限，本轮未做前端展示。**下一步（todo 池）**：单步调试、图节点级多Key轮询、F03知识库RAG；扩展 `flow-graph` adapter 契约需回规划层评估。

---

process-monitoring (M04-F06-01)：COMPLETED（详情见 `knowledge/`，2026-07-30 收尾）。

## 测试基线

当前结果：**role-menu-permission-parity（P1 / M02-F02/F03）COMPLETED（D123 规划层最终验收 PASSED + 阶段三终态同步，2026-08-20）**——后端 **674/0/0/0**（112 报告文件）、前端 **73f/681t** 四连全绿；清单 **✅23/🟦27/⬜40**、P1 正式核销、功能数 26（第 26 个已完成功能）。

- 后端：**674 tests**（surefire XML 聚合口径，112 文件，0/0/0；670 基线 +4：GlobalExceptionHandlerTest 2 + AuthMenus A4 撤权 2）；1292 为类级+模块级重复累计已弃用。
- 前端：本轮 **73 spec files / 681 tests**（D121 73f/678t → +3：auth-session.spec 双角色身份 3 用例），四门退出 0。
- 功能清单：M02-F02-01/F03-01 🟦→✅ **终态**（**✅23/🟦27/⬜40** 共 90 行）；无关行零漂移（M02-F01-01/M01-F04-01 保持 🟦、M02-F04-01 保持 ✅）。
- Flyway：root 路径 **V34 已占**（sys_user_group/sys_user_group_member，H2/PG 双份）；**PG 17.5 与 H2 新库全链均为 34 条 migrate+validate**，H2/PG V32/V33→V34 升级链通过；PG 永久测试 9 用例 + BOM 统一全平台；**I52 已关闭（D110 COMPLETED）**；本轮零 Flyway。
- 已完成功能：**26 个**（role-menu-permission-parity 为第 26 个，D123 COMPLETED）。
- 需求池：**P1 正式核销**（D123 规划层最终验收 PASSED + 终态同步）；I31/I36/F02/F03 全部子项闭合；I53/I54 已登记并修复；P28 已核销。

## 模块完成度（简表）

**后端**：security/system/form/bpm(notify/storage/job 完成；agent 已含模型管理/编排/工具沙箱/会话/图定义管理/图执行，iot/knowledge/openapi 骨架)
**前端**：login/shell/menu/auth/form/notify/workflow/system/storage/job 完成，agent 已含图定义列表+图设计器（AgentHome 占位不再经菜单可达），iot/openapi 占位
- BPMN adapter：查看器防腐层完成 + 后端 XML 端点 + 两个消费方（ProcessDefList + ProcessInstanceList）
- Vue Flow adapter：防腐层完成 + 首个消费方（GraphDesigner 经 graphAdapter 转换层调用 mountFlowGraph，63f/539t）

## Walking Skeleton

```
登录/认证 ✅ → 表单设计/渲染 ✅ → BPM 单节点审批 ✅ → 通知列表 ✅
```
四环全部闭合。

---
> 本文件为压缩摘要。完整状态（已完成功能列表、文件计数、核心能力枚举、延后项清单）在 `knowledge/current-status.md`。
> 需要时：创建 search_task，范围 `knowledge/current-status.md`
