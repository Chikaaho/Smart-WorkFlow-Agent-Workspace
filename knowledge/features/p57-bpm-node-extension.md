# p57-bpm-node-extension（P57 BPM Engine 统一流程节点扩展能力）

> 正式功能；阶段三终态同步完成（2026-09-03）。
> 状态：功能级 **PASSED**（2026-09-03，规划功能级最终验收 `planning-review-p57-bpm-node-extension-05-passed.md`）→ 阶段三终态最终复核 **COMPLETED（已确认，2026-09-03）**（规划最终复核 `planning-final-review-p57-terminal-sync-02-passed.md` **PASSED**）。

## 功能目标

在 BPM Engine 内建立唯一、可发现、可校验、可供前端消费的流程节点能力来源：每个可用节点以稳定类型标识声明元数据、拓扑约束、配置能力、配置校验和运行能力；系统启动自动发现并建立统一注册结果，重复/缺失/不完整实现明确失败；设计端能力清单、保存/发布校验、模型翻译和运行分派都以同一注册结果为权威；新增节点只需实现统一契约并随项目重建重启即可进入全链，不再修改中心枚举、中心 switch 或平行注册表。

## 交付范围（已锁定，证据见回执）

- system 级节点能力契约与唯一注册权威（`BpmNodeRegistry`），覆盖设计发现、配置校验、发布翻译和运行能力检查；START、END、APPROVAL 迁入统一来源并保持既有主链、`graph_json`、DESIGNATED 审批与 skeleton 兼容入口。
- 发布链对未知、预留但未实现（CONDITION/EXCLUSIVE_GATEWAY/PARALLEL_GATEWAY/JOIN_GATEWAY）、不完整或配置非法节点的确定性拒绝，warn 后跳过/带病部署被禁止；五类真实 publish 失败均保持草稿且零部署写入。
- 前端节点能力接口与统一消费接缝：节点面板、配置入口和保存前约束来自真实能力清单；接口失败、畸形 JSON、缺必要字段均 fail-closed（禁用审批选择器与保存，无 graph 保存请求）；不保留独立静态目录作为正常回退。
- 隔离验证节点 `P57_VERIFY` 不改中心类型分支完成重启发现、前端识别、配置、保存、发布校验和可观察运行；验证 fixture 只存在于测试源集，生产 jar/class/resources 对验证类零命中。
- `ProcessStartService` 终态衔接修复（活跃→RUNNING、到 End 无活跃节点→既有 `APPROVED` 语义）与自动化回归。

## 验收与证据链

- 功能级最终验收：`product/p57-bpm-node-extension/receipts/planning-review-p57-bpm-node-extension-05-passed.md`（**PASSED**；十二项验收标准最终结论逐项锁定；Z1 按受支持认证边界核销：tenant 0 两个独立普通授权用户真实会话、能力响应字节一致且只含系统节点，非零租户登录不纳入完成声明）。
- 规划审查链：`planning-review-p57-bpm-node-extension-01/02/03.md`、`04.md`（R1—R6 收敛与 Z1—Z4 三级提示）、`planning-execution-prompt-p57-bpm-node-extension-01/02/03.md`。
- 执行回执：`execution-completion-p57-bpm-node-extension-20260902.md`、`execution-supplement-e1-e7/…/g1-g7/…/r1-r6/…`、`execution-supplement-z1-z4-p57-bpm-node-extension-20260903.md`（Z2/Z3/Z4 PASS；Z1 边界内最大证据 + 产品认证边界事实）、阶段三回执 `p57-stage3-terminal-sync-20260903.md`。
- 历史归档：主方向与阶段三方向均已归档 `product/p57-bpm-node-extension/passed/`（direction-p57-bpm-node-extension.md、direction-p57-bpm-node-extension-terminal-sync.md）。

## 规划终态裁决（验收 05 锁定）

- P57 功能级 **PASSED（2026-09-03）**，十二项标准全部通过；阶段三方向下发后由执行机械落值并经规划最终复核 02 **PASSED**，`COMPLETED（已确认，2026-09-03）`，第 **40** 个正式功能。
- P57 正式基线：后端 **1015/0/0/0**（全量 147 份 Surefire XML，BUILD SUCCESS）+ P57 聚焦 **21/0/0/0**；前端 **116 files passed + 1 skipped / 1104 tests passed + 3 skipped**（typecheck/lint/build 通过）；Flyway **H2 V47（47）/PG V47（46）**（无新增迁移）。
- P57 **已核销/完成**；P57 不对应既有 Mxx-Fxx 明细，90 项明细状态零变化；清单 **✅34/🟦23/⬜33**（34+23+33=90）；功能数 **39→40**；无活动正式功能。
- 边界（后续各轮不得改写）：生产节点能力目录只有 START/APPROVAL/END；隔离验证节点、非法 translator、证据控制器与验证 profile 仅存在于 Server 测试源集（生产 jar/class/resources 零命中）；**非零租户用户当前没有受支持登录入口是认证产品边界，不属于 P57 完成声明**，不扩写为“多租户登录已支持”。「P58（会签、通知、条件分支及具体节点界面）未启动」为 **P57 交付当时（2026-09-03）的时点事实**；P58 已于 **2026-09-04 COMPLETED（已确认，第 41 个正式功能）**，当前引用以 `knowledge/current-status.md`、`knowledge/features/p58-workflow-node-capabilities.md` 与 `knowledge/feature-reconciliation-index.md` 为准（2026-09-04 知识库全量整理对账更正）。