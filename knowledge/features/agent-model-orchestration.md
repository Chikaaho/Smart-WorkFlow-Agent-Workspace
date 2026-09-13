# 功能追踪：agent-model-orchestration（第 15 个正式功能；M07-F01 / M07-F02 / M07-F04 骨架）

> 工作区统一知识库 — 单功能规划与追踪。
> 可信度标记：CONFIRMED / REPORTED / ASSUMED / SUPERSEDED
>
> ⚠️ **登记补录说明（2026-09-13）**：本文件原缺失，主索引 §5 已登记该缺失（「`session-handoff` 旧必读清单中的该链接指向不存在文件；已改指本索引；不重建已缺失正文」）。本文件按 `product/agent-model-orchestration/passed/`、`receipts/` 与主索引既有记录**只复述可追溯历史事实**补齐，不重跑验收、不重写历史结论、不新增或变更任何功能状态与编号。
> ⚠️ 文件中的「推荐模型/执行模型」字段（如有）为当时执行事实，仅作历史存档；当前权限按会话角色划分，与模型无关（见根目录 `system.md` §0.2）。

---

## 1. 功能信息

| 字段 | 值 |
|------|------|
| 功能编号 | M07-F01（大模型管理）、M07-F02（调度图编排）、M07-F04（对话交互）骨架交付；正式功能链**第 15 个** |
| 功能名称 | AI 调度图编排与大模型管理（骨架交付） |
| 功能目标 | 在 `sw-basic-agent` 落地大模型接入配置管理与调度图编排的执行骨架：模型注册 CRUD／密钥加密存储／连通性测试、图定义 CRUD／版本／发布、图解释执行引擎（含并行与循环节点）、多变量执行上下文与图执行历史持久化，并交付前端图设计器骨架 |
| 创建日期 | 2026-08-09（Step1—3 PASSED，提交 `b222a78`；F04 前置调研同批） |
| 历史完成状态/时点 | **COMPLETED（历史功能链）**——末步 Step12 通过规划裁决 **PASSED（D71，2026-08-12）**；全过程裁决链 D53—D71（Step1—3 D55、Step4 D59、Step5 D61、Step6 D63、Step7 D64/D65、Step8 D64、Step9 D65、Step10 D66/D67、Step11 D68—D70、Step12 D71），执行时间 2026-08-09 → 2026-08-12 |
| 涉及模块 | 后端 `sw-basic-agent`（模型/图定义/解释器/持久化）与 `sw-bootstrap` 统一迁移路径（H2 与 PostgreSQL 双份）；前端 `Smart-WorkFlow-Web` agent 模块（图设计器骨架） |
| 历史功能序号 | 第 15 个（主索引 §4 / 功能映射子表 A 组「正式功能第 15 个（早期批处理）」） |

## 2. 交付范围（按 Step 方向文件复述）

| Step | 交付内容 | 方向文件（passed/） |
|---|---|---|
| 1 | 后端大模型注册管理（CRUD + API Key 加密存储 + 连通性测试） | `step-1-backend-model-management.md` |
| 2 | 编排引擎 | `step-2-orchestration-engine.md` |
| 3 | 工具沙箱 | `step-3-toolsandbox.md` |
| 4 | F04 对话交互核验 | `step-4-f04-conversation.md` |
| 5 | 多 Key 轮询／额度限流 | `step-5-multikey-quota.md` |
| 6 | F02 设计澄清（三项决策） | `step-6-f02-design-clarification.md` |
| 7 | 图定义 CRUD + 版本 + 发布骨架 | `step-7-graph-def-crud-publish.md` |
| 8 | 图解释执行引擎第一版 | `step-8-graph-interpreter-engine.md` |
| 9 | 图设计器前端 | `step-9-graph-designer-frontend.md` |
| 10 | 多变量执行上下文 | `step-10-multivar-context-backend.md` |
| 11 | 并行／循环节点 | `step-11-parallel-loop-nodes.md` |
| 12 | 图执行历史持久化 | `step-12-execution-history-persistence.md` |

- `passed/` 共 **12** 份方向文件（Step1—Step12 全部归档）；执行/测试回执在 `receipts/step-*-{execution,test}.md`（含 step-11 前端、step-12 后端等）。
- 待澄清记录：Step6 设计澄清方向文件在主索引 §4 C 组相关说明中标注「`passed/` 待归档确认」，本登记按实际存在的 `passed/step-6-f02-design-clarification.md` 引用，不改变其归档状态。

## 3. 对应工程《功能清单》明细

| 明细 ID | 与本功能关系 |
|---|---|
| M07-F01-01～05（模型接入／动态装载／参数配置／密钥管理／连通性测试） | 骨架由本功能建立；逐项收口与前端管理页由后续功能承接（主索引 §1 记 `agent-model-management-frontend`（第 23 个）/ P5） |
| M07-F02-01（图设计器） | 主索引 §1 交付列记 **agent-model-orchestration（第 15 个）**，状态 ✅ |
| M07-F02-03（图管理） | 主索引 §1 交付列记 **agent-model-orchestration**，状态 ✅ |
| M07-F02-02（节点 Prompt 配置） | 后续 `agent-graph-prompt-configuration`（第 28 个）/ P6 |
| M07-F02-04（调试运行） | 后续 `agent-graph-execution-observability`（第 27 个）+ `agent-graph-step-debugging`（第 30 个）/ P7 |
| M07-F03-02（工具/函数调用） | 后续 `agent-tool-configuration-frontend`（第 31 个）/ P48 |
| M07-F04-01/02（对话窗口／会话管理） | 骨架由本功能建立（Step4 核验）；M07-F04-02 收口见 `agent-token-usage-observability`（第 29 个）/ P8 |

## 4. P / I 映射与编号说明

- **P 映射**：本功能自身**不占用、不新增、不核销**任何 P 编号；其明细的后续收口分别落在 P5、P6、P7、P8、P48（均为既有编号，核销状态以 `todo/requirement-pool.md` 与主索引 §2 为准）。
- **I 映射**：相关未关闭项为 **I13**（M07 AI 调度图执行引擎/工具沙箱/RAG 选型未定），现状为 **◐ 部分收敛（2026-08-11 Step9 落地：执行引擎/图定义/前端设计器全链已落地；RAG/联动点仍未决）**，权威注册见 `knowledge/known-issues.md`。本登记不关闭、不改写 I13 状态。
- **不新增当前功能数**：本功能早已计入当前权威正式功能数 **44** 中的第 15 位；本文件仅为补齐知识库登记文件，**不增加功能计数、不改变 90 项清单 ✅46/🟦22/⬜22、不改变任何 P/I 编号状态**。

## 5. 证据指针

- 方向与裁决：`product/agent-model-orchestration/passed/step-1-backend-model-management.md` … `step-12-execution-history-persistence.md`（12 份，Step12 头部明载「状态：PASSED（D71，2026-08-12）」）。
- 执行/测试回执：`product/agent-model-orchestration/receipts/step-{1..12}-{execution,test}.md`（含 `step-10-frontend-*`、`step-11-backend-reverification.md`、`step-11-frontend-*`、`step-12-*`）。
- 前置调研：`search_fallback/m07-agent-kickoff.md`、`search_fallback/m07-step{1,2,5,11,12}-*-precedent.md`、`search_fallback/m07-f02-graph-designer-precedent.md`、`search_fallback/m07-multivar-context-precedent.md`、`search_fallback/m07-f04-conversation-precedent.md`。
- 主索引定位：`knowledge/feature-reconciliation-index.md` §1（M07-F02-01/F02-03 行）、§4 与 `knowledge/feature-reconciliation-products.md` A 组第 15 项。
