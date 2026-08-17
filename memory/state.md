# 当前状态

> 最后更新：2026-08-17（sysrole-v5-column-alignment 最终验收 PASSED）

## 进行中功能

**（无进行中功能）**：sysrole-v5-column-alignment（P13 / I26）已于 2026-08-17 最终验收 `PASSED` 并归档。

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
- Flyway：agent 路径 V19-V25 已占（V25=图定义表）；root 路径 V26 已占（Step9 菜单迁移）；V27+ 空闲
- 大字段：H2=CLOB / PG=TEXT；agent 模块 create_by=VARCHAR(64)（偏离 bigint 惯例）；status=VARCHAR(20)；create_time=TIMESTAMP 无默认值（MetaObjectHandler 填充）

**M07-F01「大模型管理」+ F02「图设计器」（含 Step11 并行/循环节点 + Step12 执行历史持久化）全部完结**，详情均在对应 `passed/step-N-*.md`，不在此重复摘录——关键架构结论：①F01（LangGraph4j）与 F02（自建 `AgentGraphInterpreter`）两条执行路径并存互不干扰；②条件分支=关键词子串匹配（不支持正则）；③execution context 自 Step10 起为命名变量表（`config.inputVar`/`outputVar`，默认变量 `input` 零迁移）；④Step11 起支持 LOOP（回边+迭代计数）/FORK/JOIN（多活跃执行点逻辑并发，非线程级），变量冲突=最后写入覆盖（D68）；⑤**Step12 起执行历史落库**：V27 `sw_agent_graph_execution`（执行记录）+ V28 `sw_agent_graph_execution_node`（节点明细）双表，分支标识=branchId 路径字符串（FORK按出边顺序追加下标），错误分类=`GraphExecutionException.category` 8类，成功/失败路径统一由 Service 包夹落库（D70/D71）；查询端点复用 `agent:model:view` 权限，本轮未做前端展示。**下一步（todo 池）**：单步调试、图节点级多Key轮询、F03知识库RAG；扩展 `flow-graph` adapter 契约需回规划层评估。

---

process-monitoring (M04-F06-01)：COMPLETED（详情见 `knowledge/`，2026-07-30 收尾）。

## 测试基线

最新完成：**sysrole-v5-column-alignment（P13 / I26）PASSED（2026-08-17）**——SysRole 与 V5 链尾 `built_in`/`remark` 契约对齐；模块 111/0/0、项目级 527/0/0；I26 已核销，功能清单状态列无变化。回执：`product/sysrole-v5-column-alignment/receipts/`。

- 后端：项目级 **527 tests**（源码口径，CONFIRMED 2026-08-16 D82 mvn 全量 BUILD SUCCESS 0 failures，521+6）
- 前端：**66 spec files / 576 tests（运行口径；569→576，I51 新增 7 测试）**，四连全绿（CONFIRMED 2026-08-17；2G 上限下 typecheck/lint/test/build 全部退出 0）
- 功能清单：**✅12/🟦37/⬜41 共 90 行**（2026-08-16 D82 同步）
- Flyway：root 路径 V30 已占；迁移链冒烟口径 28（含 form V12）
- 已完成功能：17 个
- 需求池：`todo/requirement-pool.md`（2026-08-16 新建，已开发未满足+候选，规划层维护）

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
