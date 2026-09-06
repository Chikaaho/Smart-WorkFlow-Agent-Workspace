# 当前项目状态

> 唯一当前快照；截至/同步点：2026-09-07，`p4-oa-personal-center-dual-dispatch`（P4 OA个人中心与流程双通道本轮子集）功能状态 **COMPLETED（2026-09-07）**（验收事件：功能级 PASSED，2026-09-07 规划复验09）；阶段三终态同步修正回执 `receipts/terminal-sync-p4-02.md` **待 Planner 复核确认**（审核信息，不替代已授权功能状态）。历史快照见 `knowledge/history/`。
> 冲突处理：本文件为当前功能状态、计数、活动功能、正式基线与唯一下一动作的权威来源。

## 当前快照

| 维度 | 当前值 |
|---|---|
| 业务功能状态 | 无活动正式业务功能；正式业务功能数 **42**（P4 OA 本轮子集为第 42 个，41＋1，功能状态 COMPLETED 2026-09-07） |
| P4 交付状态 | `p4-oa-personal-center-dual-dispatch`（P4 OA个人中心与流程双通道本轮子集）：**功能状态 COMPLETED（2026-09-07）**（验收事件：功能级 PASSED，规划复验09 `planning-review-p4-09-passed.md`）；终态同步修正回执 `receipts/terminal-sync-p4-02.md` 待 Planner 复核；**P4 总项开放、部分实现，未整体核销** |
| 已完成功能数 | **42**（41＋本轮子集 1，不另建 P 编号） |
| 功能清单 | 10 模块、55 功能、90 明细；**✅34 / 🟦28 / ⬜28**（34+28+28=90）；本轮子集**零行升降级**，M04-F05-01 仍 🟦；整体 OA 里程碑不因本子集标全完成 |
| 后端正式基线 | **174 份 Surefire 报告 / 1128 tests / 0 failures / 0 errors / 0 skipped**；MVN_EXIT=0（证据 `product/p4-oa-personal-center-dual-dispatch/receipts/evidence/p0-result-query/p4-p0result-per-report.txt`、`p4-full-test-run7.log`） |
| 前端正式基线 | **Test Files 121 passed / 1 skipped；Tests 1153 passed / 3 skipped**；VITEST_EXIT=0、ESLINT/TSC/BUILD_EXIT=0（lint 验证范围按已锁原件注明，不扩称全仓零警告；沿 `planning-review-p4-07.md` L27） |
| 迁移基线 | Flyway **H2 V55（55 migrations）/ PostgreSQL V55（54 migrations）**，本轮真实全量日志支持 |
| 验证基线变更集合 | 后端、前端、双方言迁移三组（见上）；不得使用 1121/1126 或旧前端计数覆盖当前值 |
| P 编号 | **P4 开放、部分实现，未整体核销**（本轮子集完成并计入 42，一个交付功能完成不等于需求池聚合项全核销）；其他编号不变：P58/P59 等已核销项保持；P3/P21 部分关闭未核销；P34/P35/P37/P38/P39 部分实现未核销；P1/P7 及其他已核销项不变。审计基准 P 池 57 行、唯一 56 编号（P48 总表/明细双入口同值）；I 索引 54 条、区间 I1—I55 缺 I27，本轮不增删 |
| 变更类型记录 | 本次同步为 P4 本轮子集阶段三终态同步：功能数 41→42、三组基线更新（后端/前端/迁移）、P4 状态与归档登记；清单 90 行零变化 |
| 当前活动正式功能 | 无（已完成条目不同时列作活动功能） |
| 当前活动交付任务 | 无（P4 子集功能级 PASSED，终态同步待规划复核，不作为活动任务登记） |
| 最近审查 | `product/p4-oa-personal-center-dual-dispatch/receipts/planning-review-p4-09-passed.md`（**P4 本轮子集功能级 PASSED**）\| `product/p4-oa-personal-center-dual-dispatch/receipts/planning-review-p4-08.md`（VERIFYING，仅剩超时回查，已关闭）\| `product/p59-ch-apaas-project-update/receipts/planning-final-review-p59-terminal-sync-02-passed.md`（P59 COMPLETED（规划已确认），历史） |

## 终态与方向归档事实（唯一口径）

- `p4-oa-personal-center-dual-dispatch`（P4 OA 本轮子集）：功能状态 **COMPLETED（2026-09-07）**（验收事件：功能级 PASSED，2026-09-07）；主方向与流程中台能力边界方向均已归档 `product/p4-oa-personal-center-dual-dispatch/passed/`（direction-p4-oa-personal-center-dual-dispatch.md、flow-platform-capability-boundary.md）；终态同步方向 `ready/direction-p4-terminal-sync.md`（仅 Planner 复核通过后移 passed）。任务登记：`knowledge/features/p4-oa-personal-center-dual-dispatch.md`。
- P4 本轮子集交付范围：表单可见范围、普通表单发起、草稿免必填保存、提交校验、四入口（含 0 草稿空态入口修复）、普通可靠异步及 MQ 替换边界、P0 单次同步/超时返回受理态/`flowStart` 实际启动结果回查语义、同意图幂等；命令队列租约令牌全分支原子领取权、同命令恢复、真实历史已办过滤与同时间确定性分页、跨租户读隔离、无动作节点不伪造。
- P4 修正与补证历史（追溯）：执行提示 05—08 与回执 supplement-06—09、审查 06—08 全部关闭；`receipts/evidence/final-gap-round{,-followup}/`、`receipts/evidence/last-three-gaps/`、`receipts/evidence/p0-result-query/`。
- `p59-ch-apaas-project-update` 统一交付任务：**任务状态 COMPLETED（规划已确认，2026-09-05）**；P59 已核销；主方向与终态同步方向归档 `product/p59-ch-apaas-project-update/passed/`（历史，登记 `knowledge/features/p59-ch-apaas-project-update.md`；发布时点唯一事实见该登记与 history 快照）。
- `p58-workflow-node-capabilities` 正式功能 **COMPLETED（已确认，2026-09-04）**，第 41 个（历史点，P58 时基线 1035/0/0/0、前端 117f/1110t、H2/PG V49 已被 P4 子集基线取代为当前值）。
- `knowledge-full-reconciliation` 知识库全量整理：**COMPLETED（已确认，2026-09-04）**（历史）。
- P57（第 40）、P56（第 39＋P46）、P52（第 38）、P45（第 37）及更早功能的历史终态与基线见 `knowledge/history/` 与 `knowledge/feature-reconciliation-index.md`。

## 当前唯一下一动作

**等待 Owner 选择下一需求。** P4 本轮子集功能状态 COMPLETED、终态同步待规划复核；无其他活动业务/交付任务。

## 当前未关闭项入口

- 未关闭业务问题权威注册：`knowledge/known-issues.md`（54 条，I1—I55 区间缺 I27）
- 正式功能明细与双向映射：`Smart-WorkFlow-Server/功能清单.md`（90 行）＋ `knowledge/feature-reconciliation-index.md`（90 明细/56 唯一 P/54 I/55 审计 product 目录）
- P4 交付追踪：`knowledge/features/p4-oa-personal-center-dual-dispatch.md`；方向与回执：`product/p4-oa-personal-center-dual-dispatch/`
- 历史状态与审计链：`knowledge/history/README.md`

## 新会话启动提示词

- 上轮完成：P4 OA个人中心与流程双通道本轮子集（第 42 个正式功能）**功能状态 COMPLETED（2026-09-07）**（验收事件：功能级 PASSED）；终态同步待规划复核；主方向与能力边界方向已归档 `passed/`
- 当前状态：无活动业务功能、无活动交付任务；P4 总项开放、部分实现未核销（流程中心双视角/分类/抄送查询/催办等继续后续，与 P55 协同规划）
- 完成数：清单 **34 / 28 / 28**（90，零行升降级，M04-F05-01 仍 🟦）；正式功能数 **42**
- 正式基线（2026-09-07，P4 子集验收快照）：后端 174 份报告/1128/0/0/0、前端 121 files passed + 1 skipped / 1153 tests passed + 3 skipped、Flyway H2 V55（55）/ PG V55（54）
- 当前唯一下一动作：等待 Owner 选择下一需求
- 个人中心四入口已交付：我发起的、我的草稿、我的待办、我的已办；P4 剩余：流程中心分类/双视角、抄送我的查询/催办入口
- 功能追踪：`knowledge/features/p4-oa-personal-center-dual-dispatch.md`；映射索引 `knowledge/feature-reconciliation-index.md`
- 未完成边界：P4 总项开放（流程中心分类/双视角、抄送我的查询/催办入口缺，见上条）；P3 剩余发送记录查询/失败重发/全局日志；P34/P35/P37/P38/P39 部分实现未核销；P21 部分关闭（真实腾讯账号与物理设备现场联调、原生 MQTT、完整设备管理）；P2 其余缺口继续开放；P54/P55 延续需求待规划；非零租户登录无受支持入口为认证产品边界；P59 场景 3.1—3.3 仅原始记录、未实施
