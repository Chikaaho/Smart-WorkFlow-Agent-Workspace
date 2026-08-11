# 当前状态

> 最后更新：2026-08-10

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

测试基线轨迹：pre-Step1=262 → Step1=277 → Step2=291 → Step3=307 → Step4=328 → Step5=341 → **Step7=362**（主树口径，排除 `.claude/worktrees/` 陈旧报告，D57）

**当前架构要点**（派生自代码，此处仅记关键约定）：
- 图拓扑：START→callModel→END 单节点；agentic loop 在 ChatModel.call() 内建（internalCall 递归），不外显
- ThreadLocal 注入四件套：chatModel / tools / historyMessages / toolCallRecords（bind-finally-clear 对称，ServiceImpl finally 保证全清）
- Flyway：agent 路径 V19-V23 已占；V24+ 空闲；全库 V1-V23 精确 2 次（h2+pg）
- 大字段：H2=CLOB / PG=TEXT；agent 模块 create_by=VARCHAR(64)（偏离 bigint 惯例）；status=VARCHAR(20)；create_time=TIMESTAMP 无默认值（MetaObjectHandler 填充）

**Step5 收尾（2026-08-10，D62）**：执行+测试回执核验 PASSED。V1 实测推翻方案假设——429 到达 ServiceImpl 时异常链实为 `NonTransientAiException`（消息含"429"），不含 `RestClientResponseException`，`isQuotaExceededException` 已按实测调整（主判据 NonTransientAiException+消息含429，`RestClientResponseException` 状态码判断为兜底）；V2 实测确认 429 会被裸 RetryTemplate 重试，评估后维持"不改 ChatModelFactory"决策（无用户可见延迟放大）。方案已移至 `passed/step-5-multikey-quota.md`；测试基线 328→341。**M07-F01「大模型管理」PRD 明细全部完结**。

**M07-F02 图设计器（Step6 设计澄清 + Step7 图定义骨架落地 2026-08-11）**：设计澄清 `product/agent-model-orchestration/ready/step-6-f02-design-clarification.md` 三项关键决策：①工具节点改为独立图节点②MVP 节点范围=LLM+工具+条件分支，并行/循环推入 todo③执行引擎走图定义驱动解释执行，大概率放弃 LangGraph4j StateGraph（Step8 裁定）。**Step7（2026-08-11，D63 判定 PASSED）**：图定义 CRUD+版本+发布骨架落地——V25 `sw_agent_graph_def` 表（h2+pg 双脚本，13 列：graph_key/name/def_version/status/graph_json + 8 基列按 agent 惯例）+ `ProcessGraph`/`GraphElement` 图模型（`com.sw.ck.agent.dto.graph`，config/style 不透明禁令注释）+ `AgentGraphDefController`（/agent/graph-defs 6 端点：CRUD+草稿+发布，权限沿用 agent:model:view/manage）+ 发布状态机（form 风格版本递增 def_version+1 + bpm 风格 graph_key 冻结，允许重复发布）；纯存储零执行语义，条件分支求值方式（字符串/关键词匹配推荐值）待用户拍板、Step8 实现（方案 §9 复核小节）。21 新测（341→**362**，0/0/0）；方案 `passed/step-7-graph-def-crud-publish.md`；I13 已按 Step6 §5 文案同步（"编码资源限制"对 Step7/8 解除）。下一步：Step8 图解释执行引擎。

---

最新完成：**process-monitoring (M04-F06-01)：COMPLETED ✅**
- Step 0 探索：PASSED（范围裁定：首批仅流程图高亮 + 流转记录）
- Step 1 后端 Facade + Service：PASSED（15 @Test）
- Step 2 后端 BpmInstanceController：PASSED（6 @Test，14/14 验收）
- Step 3 前端 ProcessInstanceList：PASSED（4 @Test，16/16 验收）
- 阶段三收尾完成（2026-07-30）
- 耗时分析 + 流程干预延后至后续批次

## 测试基线

- 后端：项目级 **362 tests**（CONFIRMED 2026-08-11 Step7 全量，0 failures/0 errors，sw-basic-agent 79→100）
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
