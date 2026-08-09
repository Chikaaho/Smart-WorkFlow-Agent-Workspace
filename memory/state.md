# 当前状态

> 最后更新：2026-08-09

## 进行中功能

**agent-model-orchestration (M07-F01/F02/F04)：Step1-4 全部 PASSED**

已完成 Step 汇总（方案均在 `product/agent-model-orchestration/passed/`）：

| Step | 内容 | 关键产物 | 判定 |
|------|------|---------|------|
| Step1 | 模型管理 CRUD + AES 加密 + 连通性测试 | V19 sw_agent_model_config；15 新测（262→277） | PASSED（D53） |
| Step2 | 最小 LangGraph4j 编排引擎 + 动态 ChatModel + 动态装载 | AgentGraphFactory/ChatModelFactory/ServiceImpl；14 新测（277→291） | PASSED（D55/D56/D57） |
| Step3 | 工具沙箱（内部方法 + 外部 HTTP，FunctionToolCallback+lambda，DB 白名单） | V20 sw_agent_tool_internal/external；16 新测（291→307） | PASSED（D59） |
| Step4 | F04 多轮会话持久化（ThreadLocal messages 注入 + 消息持久化 + 工具日志 + 2 查询端点） | V21-V23 三表；21 新测（307→328）；AgentConversationController | PASSED（D61） |

测试基线轨迹：pre-Step1=262 → Step1=277 → Step2=291 → Step3=307 → **Step4=328**（主树口径，排除 `.claude/worktrees/` 陈旧报告，D57）

**当前架构要点**（派生自代码，此处仅记关键约定）：
- 图拓扑：START→callModel→END 单节点；agentic loop 在 ChatModel.call() 内建（internalCall 递归），不外显
- ThreadLocal 注入四件套：chatModel / tools / historyMessages / toolCallRecords（bind-finally-clear 对称，ServiceImpl finally 保证全清）
- Flyway：agent 路径 V19-V23 已占；V24+ 空闲；全库 V1-V23 精确 2 次（h2+pg）
- 大字段：H2=CLOB / PG=TEXT；agent 模块 create_by=VARCHAR(64)（偏离 bigint 惯例）；status=VARCHAR(20)；create_time=TIMESTAMP 无默认值（MetaObjectHandler 填充）

**下一步（已确认）：M07-F01 多Key轮询/额度限流**
- 范围：`sw_agent_model_config` 扩展优先级字段 + 轮询状态；`ChatModelFactory` 改造；key 达到配额时按优先级切换
- 理由：范围小、运营价值直接；F02 图设计器复杂度高（需自建 DSL，LangGraph4j 无 JSON 反序列化支持），留后续

**M07-F02 图设计器（待后续批次）**：CRUD/发布/版本/调试运行，需自建 DSL，无库支持

---

最新完成：**process-monitoring (M04-F06-01)：COMPLETED ✅**
- Step 0 探索：PASSED（范围裁定：首批仅流程图高亮 + 流转记录）
- Step 1 后端 Facade + Service：PASSED（15 @Test）
- Step 2 后端 BpmInstanceController：PASSED（6 @Test，14/14 验收）
- Step 3 前端 ProcessInstanceList：PASSED（4 @Test，16/16 验收）
- 阶段三收尾完成（2026-07-30）
- 耗时分析 + 流程干预延后至后续批次

## 测试基线

- 后端：项目级 **328 tests**（CONFIRMED 2026-08-09 Step4 全量，0 failures/0 errors，76 报告）
- 前端：60 spec files / **521 tests**，四连校验门全绿（CONFIRMED 2026-07-28）
- 已完成功能：11 个

## 模块完成度（简表）

**后端**：security/system/form/bpm(notify/storage/job 完成，iot/agent/knowledge/openapi 骨架)
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
