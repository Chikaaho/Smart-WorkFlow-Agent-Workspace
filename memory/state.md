# 当前状态

> 最后更新：2026-08-11

## 进行中功能

**agent-model-orchestration (M07-F01/F02/F04)：Step1-5 全部 PASSED，F01 PRD 明细全部完结**

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

测试基线轨迹：pre-Step1=262 → Step1=277 → Step2=291 → Step3=307 → Step4=328 → Step5=341 → **Step7=362 → Step8=385**（主树口径，排除 `.claude/worktrees/` 陈旧报告，D57）

**当前架构要点**（派生自代码，此处仅记关键约定）：
- 图拓扑：START→callModel→END 单节点；agentic loop 在 ChatModel.call() 内建（internalCall 递归），不外显
- ThreadLocal 注入四件套：chatModel / tools / historyMessages / toolCallRecords（bind-finally-clear 对称，ServiceImpl finally 保证全清）
- Flyway：agent 路径 V19-V25 已占（V25=图定义表）；V26+ 空闲
- 大字段：H2=CLOB / PG=TEXT；agent 模块 create_by=VARCHAR(64)（偏离 bigint 惯例）；status=VARCHAR(20)；create_time=TIMESTAMP 无默认值（MetaObjectHandler 填充）

**M07-F01「大模型管理」PRD 明细全部完结**（Step5 收尾 D62，详情见 `passed/step-5-multikey-quota.md`）。

**M07-F02 图设计器**（详情见 `passed/step-6-f02-design-clarification.md` + `passed/step-7-graph-def-crud-publish.md` + `passed/step-8-graph-interpreter-engine.md`）：Step6 三项决策——①工具节点=独立图节点②MVP节点=LLM+工具+条件分支（并行/循环todo）③执行引擎=图定义驱动解释执行。**Step7 PASSED**（D63，2026-08-11）：`sw_agent_graph_def`（V25）+ 图模型 + 6端点CRUD/发布，纯存储零执行语义，362 tests。**Step8 PASSED**（D64，2026-08-11）：图解释执行引擎第一版——`AgentGraphInterpreter`（纯 Java 解释器，LLM 单跳/工具按名定位/条件分支路由 + maxSteps 步数上限）+ `AgentGraphExecutionServiceImpl`（§2-D 五项执行前校验 + 运行时 success=false）+ `POST /agent/graph-defs/{id}/execute`（权限沿用 manage）；385 tests。关键架构结论：①`AgentGraphFactory`/LangGraph4j 保留服务 F01，与 F02 自建解释器两条执行路径并存互不干扰；②条件分支求值拍板为关键词子串匹配（`String.contains`，边 config.keyword 按 elements 顺序取第一个命中，未命中走唯一默认边，无默认边运行时报错，**不支持正则**、无新依赖）；③execution context 极简为单一 `currentText`（LLM/工具输出整体覆盖，END 时即最终 output）；④执行历史不落库（不写会话/消息/日志表）。**下一步：Step9（前端图设计器）**。

---

最新完成：**process-monitoring (M04-F06-01)：COMPLETED ✅**
- Step 0 探索：PASSED（范围裁定：首批仅流程图高亮 + 流转记录）
- Step 1 后端 Facade + Service：PASSED（15 @Test）
- Step 2 后端 BpmInstanceController：PASSED（6 @Test，14/14 验收）
- Step 3 前端 ProcessInstanceList：PASSED（4 @Test，16/16 验收）
- 阶段三收尾完成（2026-07-30）
- 耗时分析 + 流程干预延后至后续批次

## 测试基线

- 后端：项目级 **385 tests**（CONFIRMED 2026-08-11 Step8 全量，0 failures/0 errors，sw-basic-agent 100→123）
- 前端：60 spec files / **521 tests**，四连校验门全绿（CONFIRMED 2026-07-28）
- 已完成功能：11 个

## 模块完成度（简表）

**后端**：security/system/form/bpm(notify/storage/job 完成；agent 已含模型管理/编排/工具沙箱/会话/图定义管理，iot/knowledge/openapi 骨架)
**前端**：login/shell/menu/auth/form/notify/workflow/system/storage/job 完成，iot/agent/openapi 占位
- BPMN adapter：查看器防腐层完成 + 后端 XML 端点 + 两个消费方（ProcessDefList + ProcessInstanceList，60f/521t）
- Vue Flow adapter：防腐层完成（零消费方，M07 AI 调度图业务模块未就位）

## Walking Skeleton

```
登录/认证 ✅ → 表单设计/渲染 ✅ → BPM 单节点审批 ✅ → 通知列表 ✅
```
四环全部闭合。

---
> 本文件为压缩摘要。完整状态（已完成功能列表、文件计数、核心能力枚举、延后项清单）在 `knowledge/current-status.md`。
> 需要时：创建 search_task，范围 `knowledge/current-status.md`
