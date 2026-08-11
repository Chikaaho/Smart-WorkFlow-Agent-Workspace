# 当前状态

> 最后更新：2026-08-11

## 进行中功能

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

测试基线轨迹：后端 pre-Step1=262 → Step1=277 → Step2=291 → Step3=307 → Step4=328 → Step5=341 → **Step7=362 → Step8=385 → Step9=385（持平）→ Step10=392**；前端 60f/521t → **63f/539t → 63f/546t**（主树口径，排除 `.claude/worktrees/` 陈旧报告，D57）

**当前架构要点**（派生自代码，此处仅记关键约定）：
- 图拓扑：START→callModel→END 单节点；agentic loop 在 ChatModel.call() 内建（internalCall 递归），不外显
- ThreadLocal 注入四件套：chatModel / tools / historyMessages / toolCallRecords（bind-finally-clear 对称，ServiceImpl finally 保证全清）
- Flyway：agent 路径 V19-V25 已占（V25=图定义表）；root 路径 V26 已占（Step9 菜单迁移）；V27+ 空闲
- 大字段：H2=CLOB / PG=TEXT；agent 模块 create_by=VARCHAR(64)（偏离 bigint 惯例）；status=VARCHAR(20)；create_time=TIMESTAMP 无默认值（MetaObjectHandler 填充）

**M07-F01「大模型管理」PRD 明细全部完结**（Step5 收尾 D62，详情见 `passed/step-5-multikey-quota.md`）。

**M07-F02 图设计器全部完结**（详情见 `passed/step-6-f02-design-clarification.md` + `passed/step-7-graph-def-crud-publish.md` + `passed/step-8-graph-interpreter-engine.md` + `passed/step-9-graph-designer-frontend.md`）：Step6 三项决策——①工具节点=独立图节点②MVP节点=LLM+工具+条件分支（并行/循环todo）③执行引擎=图定义驱动解释执行。**Step7 PASSED**（D63，2026-08-11）：`sw_agent_graph_def`（V25）+ 图模型 + 6端点CRUD/发布，纯存储零执行语义，362 tests。**Step8 PASSED**（D64，2026-08-11）：图解释执行引擎第一版——`AgentGraphInterpreter`（纯 Java 解释器，LLM 单跳/工具按名定位/条件分支路由 + maxSteps 步数上限）+ `AgentGraphExecutionServiceImpl`（§2-D 五项执行前校验 + 运行时 success=false）+ `POST /agent/graph-defs/{id}/execute`（权限沿用 manage）；385 tests。**Step9 PASSED**（D65，2026-08-11）：前端图设计器对接——V26 菜单迁移（root 路径，现场核验修正方案 §2 结论：`V6__m_seam_menu_seed.sql` 早已 seed「智能体」id=7 叶子菜单，按方案 §3.1"复用既有层级"分支仿 V11 先例矫正为目录 + 挂二级「图定义管理」component='agent/views/GraphDefList'，权限沿用 agent:model:view/manage 零新增，不 seed sys_role_menu 沿用超管旁路）；`contracts/agent.ts` + `modules/agent/api/index.ts`（7 端点 + 2 只读下拉辅助，DTO 现场核对）；`graphAdapter.ts`（elements↔FlowGraphData 双向转换，坐标存 style.x/y 前端裁定非后端契约，条件边关键词 edge.label 承载，未知节点类型透传不崩溃）；`GraphDefList.vue`（分页/新建/发布/删除/编辑）；`GraphDesigner.vue`（参数化静态路由 agent/graph-designer/:id，加载/节点色板/属性面板按类型切换/保存草稿/发布不锁编辑/执行测试不落库）；`router/index.ts` 追加 1 条静态路由。关键架构结论（Step8 补记）：①`AgentGraphFactory`/LangGraph4j 保留服务 F01，与 F02 自建解释器两条执行路径并存互不干扰；②条件分支求值拍板为关键词子串匹配（`String.contains`，边 config.keyword 按 elements 顺序取第一个命中，未命中走唯一默认边，无默认边运行时报错，**不支持正则**、无新依赖）；③execution context 极简为单一 `currentText`（LLM/工具输出整体覆盖，END 时即最终 output）；④执行历史不落库。前端测试基线 60f/521t → **63f/539t**，后端 385 持平。**下一步（方案 §9 + todo 池，无新 Step 规划）**：并行/循环节点、多变量执行上下文、单步调试、执行历史持久化、图节点级多Key轮询；若需扩展 `flow-graph` adapter 契约（如节点自定义渲染/边点击事件）须回规划层单独评估。

---

最新完成：**process-monitoring (M04-F06-01)：COMPLETED ✅**
- Step 0 探索：PASSED（范围裁定：首批仅流程图高亮 + 流转记录）
- Step 1 后端 Facade + Service：PASSED（15 @Test）
- Step 2 后端 BpmInstanceController：PASSED（6 @Test，14/14 验收）
- Step 3 前端 ProcessInstanceList：PASSED（4 @Test，16/16 验收）
- 阶段三收尾完成（2026-07-30）
- 耗时分析 + 流程干预延后至后续批次

## 测试基线

- 后端：项目级 **392 tests**（CONFIRMED 2026-08-11 Step10 全量，0 failures/0 errors，sw-basic-agent 130）
- 前端：**63 spec files / 546 tests**，测试/typecheck/lint/build 全绿（CONFIRMED 2026-08-11 Step10 全量，63f/539t + 7 tests）
- 已完成功能：11 个

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
