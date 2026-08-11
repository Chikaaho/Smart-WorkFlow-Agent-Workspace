# 活跃设计决策

> 最后更新：2026-08-11
> 仅保留最近 10 条活跃决策。D1-D55 为早期/已归档决策，完整内容在 `knowledge/decisions.md`（D56-D62 待下次归档迁移，暂保留于此作为过渡）。

| # | 日期 | 决策 | 状态 |
|---|------|------|------|
| D65 | 2026-08-11 | M07 Step9（前端图设计器对接）核验判定：**PASSED**。§8 全部 8 项验收标准满足；前端 60f/521t→63f/539t，后端 385 持平。关键决策：①V26 菜单迁移现场核验修正——`V6__m_seam_menu_seed.sql` 早已 seed「智能体」id=7 叶子菜单（方案 §2 grep 目录错误致误判"无 agent 行"），按方案预留分支仿 V11 先例矫正为目录+挂二级「图定义管理」；②节点坐标存 `GraphElement.style.x/y` 为前端裁定非后端契约；③条件边关键词经 `FlowGraphEdge.label` 承载；④`flow-graph` adapter 契约零扩权（无边点击事件→关键词编辑挪至节点属性面板；无命令式更新→destroy+重挂载）。方案已移至 `passed/step-9-graph-designer-frontend.md`。**M07-F02 图设计器（Step6-9）全部完结** | Active |
| D64 | 2026-08-11 | M07 Step8（图解释执行引擎）核验判定：**PASSED**。11 项验收标准满足；362→385 tests。架构决策：①F01/F02 双执行路径并存——`AgentGraphFactory`/LangGraph4j 保留服务 F01，F02 自建纯 Java `AgentGraphInterpreter`，互不修改；②条件分支=关键词子串匹配（`String.contains`，按 elements 顺序取首个命中，无默认边报错，**不支持正则**）；③execution context 单一 `currentText` 整体覆盖；④执行历史不落库。方案已移至 `passed/step-8-graph-interpreter-engine.md` | Active |
| D63 | 2026-08-11 | M07 Step7（图定义 CRUD+版本+发布骨架）核验判定：**PASSED**。14 项验收标准满足；341→362 tests。架构决策：发布状态机=form 版本递增+bpm key 冻结+允许重复发布；实体/DTO 与 sw-bpm 同名对齐（自建 dto.graph 包不依赖 sw-bpm-api）；权限沿用 agent:model:view/manage 不新增；发布门仅最小校验，完整拓扑校验留 Step8。方案已移至 `passed/step-7-graph-def-crud-publish.md` | Active |
| D62 | 2026-08-10 | M07 Step5（多Key轮询/额度限流）核验判定：**PASSED**。328→341 tests，`ChatModelFactory.java` git diff 空。实测推翻方案假设：429 到达时异常链实为 `NonTransientAiException`（非 `RestClientResponseException`），已据实调整判定逻辑；裸 `RetryTemplate` 会重试 429（无用户可见延迟放大，未改方案"不改 ChatModelFactory"决策）。方案已移至 `passed/step-5-multikey-quota.md` | Active |
| D61 | 2026-08-09 | M07 Step4（F04 对话交互）核验判定：**PASSED**。307→328 tests。架构：ThreadLocal messages 注入（非 ChatClient/Advisor，因 Advisor 对裸 `chatModel.call()` 不生效，字节码级确认）。Bonus：修复 Step3 既有 6 处 SMALLINT/BOOLEAN 比较缺陷。方案已移至 `passed/step-4-f04-conversation.md` | Active |
| D59 | 2026-08-09 | M07 Step3（工具沙箱）核验判定：**PASSED**。291→307 tests。两类工具（内部白名单方法+外部白名单 HTTP）统一走 `FunctionToolCallback` lambda 构造；LangGraph4j 图拓扑不变（无 ToolNode，agentic loop 内建于 `internalCall` 递归）。方案已移至 `passed/step-3-toolsandbox.md` | Active |
| D57 | 2026-08-09 | M07 基线复核：全仓库主树（排除 `.claude/worktrees/` 陈旧报告）真实测试总数=291（10 模块，69 报告），历史声称 465/480/494 均因误含陈旧 worktree 报告偏高，已闭合校准。真实层次：pre-Step1=262→Step1=277→Step2=291 | Active |
| D53 | 2026-08-05 | M07 Step1 验收裁定先例：方案"禁止新增依赖"条款仅约束业务功能性依赖，不约束达成验收标准所需的测试脚手架/安全框架依赖（+sw-security/+h2 等，已披露）。Step1 PASSED | Active |
| D47/D48 | 2026-08-04 | M07 架构裁定：Step1 先落地后端编排链路（模型管理+LangGraph4j），前端图设计器留后续 Step；工具沙箱=内部白名单方法+外部白名单 HTTP（用户配数据不配代码，禁 RCE） | Active |
| D42 | 2026-07-25 | 禁止 Agent 子代理替代探索——须用 search_task + 模型切换 | Active |

---
> D36-D55（含 D43-D46 process-monitoring、D49-D52 M07 早期选型、D54/D55/D56/D58/D60 M07 Step1-2 前置调研+校验）已从活跃列表压缩移出，完整内容保留在本次压缩前的 git 历史 / `product/*/passed/` 与 `receipts/` 归档中，未物理写入 `knowledge/decisions.md`（该目录非本层写入范围）——若需追溯，创建 `search_task` 委派 DeepSeek 读取归档补全。
