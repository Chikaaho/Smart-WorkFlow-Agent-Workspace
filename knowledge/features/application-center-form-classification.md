# 功能追踪：应用中心与表单分类统一（应用中心与应用管理）

> 工作区统一知识库 — 单功能追踪；当前状态 **VERIFYING（首轮验收未过，补充执行回执 execution-02 已交，2026-10-15）**。
> 可信度标记：CONFIRMED / REPORTED / ASSUMED / SUPERSEDED

---

## 1. 功能信息

| 字段 | 值 |
|------|-----|
| 功能编号 | 未分配正式 P 编号（方向明示；不计入正式功能数、不核销编号） |
| 功能名称 | 应用中心与表单分类统一（应用中心与应用管理） |
| 功能目标 | 后台应用管理（应用=表单一级分类，应用内二级目录与表单，表单内提供表单设计/流程设计入口）；用户端应用中心（可见应用→目录/表单导航，表单进入受权限约束的数据列表）；复用既有授权并保持存量兼容 |
| 创建日期 | 2026-10-15（Owner 需求 → Planner 定稿 READY → 执行承接） |
| 当前状态 | **VERIFYING（2026-10-15 首轮验收未过 → 补充执行回执 execution-02 已交，待规划复验）**：总4阶段（现状探索、方向定稿、实施与验收、终态同步）= **2/1/1**；两仓开发分支 `feature/application-center`；首轮回执 `execution-01.md`、补充回执 `execution-02.md`（G1—G4 与原件交接见其 §） |
| 等级 / 优先级 | L |
| 涉及模块 | Server（应用/目录归属、授权与迁移兼容，实施中）；Web（后台应用管理、用户端应用中心、表单数据列表） |
| 方向与回执 | `product/application-center-form-classification/ready/direction-application-center.md`；承接与覆盖回执 `product/application-center-form-classification/receipts/execution-intake-01.md`；执行回执 `product/application-center-form-classification/receipts/execution-01.md`（含 AC01—AC07 逐项对照与证据位置） |
| 计数归属 | 未验收前不增加功能数、不核销 P 编号；正式计数在验收后终态清单统一决定 |

---

## 2. 说明

- 验收标准 AC01—AC07 见方向 §5；证据格式与边界以方向为准（正式浏览器证据须为可见会话、headless=false）。
- 存量歧义（跨分类共用表单、多归属、孤立引用、跨租户异常）按方向 §4 形成逐对象冲突清单；需改变业务归属的歧义先交 Planner 裁决。
- 定稿记录 `product/application-center-form-classification/receipts/planning-readiness-review-01.md`；探索回执 `search_fallback/application-center-form-classification-readiness-20261015.md`。
- 实施摘要（执行回执 execution-01）：Server 应用/目录/用户三表 + 表单归属列 + 存量承接迁移（分类→应用、唯一分类/未分类归属、多归属歧义不自动转换保持 NULL）+ `/form/app/manage`（form:app:manage）与 `/form/app/center`；Web 后台应用管理/应用工作区/表单上下文与用户端应用中心/数据列表；FormDefList 分类树改为应用/目录唯一归属。过程发现并修复：新建表单未落空 definition（设计器不可打开）。限制：本地 PG 为 0.1.2 前旧链未迁移，承接行为由 H2/PG 全链与承接迁移测试承载；UAT 存量分布待获授权环境清点。
