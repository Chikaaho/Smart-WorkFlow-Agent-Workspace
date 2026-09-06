# 功能摘要

> 规划侧最新同步点：2026-09-07（P4 OA 本轮子集功能状态 COMPLETED，第 42 个正式功能；终态同步待规划复核）；正式功能数与基线仍以 `knowledge/current-status.md` 为准。
> 清单当前值 **✅34/🟦28/⬜28**（90，P4 子集零行升降级，M04-F05-01 仍🟦）；功能数 42；全量双向映射见 `knowledge/feature-reconciliation-index.md`。

- `p4-oa-personal-center-dual-dispatch`：**功能状态 COMPLETED（2026-09-07）**（验收事件：功能级 PASSED，规划复验09），第 42 个正式功能（41＋子集 1）；终态同步修正待 Planner 复核。P4 总项开放、部分实现未核销（流程中心双视角/抄送查询/催办缺）。个人中心四入口=我发起的、我的草稿、我的待办、我的已办。交付与边界详见 `knowledge/features/p4-oa-personal-center-dual-dispatch.md`；主方向与能力边界归档 `product/p4-oa-personal-center-dual-dispatch/passed/`。基线：后端 174 报告/1128/0/0/0、前端 121f+1sk/1153t+3sk、H2 V55（55）/PG V55（54）。

- `p59-ch-apaas-project-update`：**COMPLETED（规划已确认，2026-09-05）**，非新增业务功能；**P59 已核销**；两个方向归档 passed（历史点，其时功能数 41、基线为 P58 快照）。

- `knowledge-full-reconciliation`（非业务功能任务）：**COMPLETED（已确认，2026-09-04）**，三方向归档 `passed/`（裁决 `planning-final-review-terminal-sync-02-passed.md`）。

- `p58-workflow-node-capabilities`：**COMPLETED（已确认，2026-09-04）**，第41个正式功能（历史点，其时基线 Server 1035/0/0/0、Web 117f/1110t、H2/PG V49，已被 P4 子集基线取代）。P58已核销、当时不对应既有明细（当时90项明细状态零变化）；其覆盖子集对应五行清单项由 2026-09-04 对账登记为 🟦（P34/P35/P37/P38/P39 部分实现未核销）。
- `p57-bpm-node-extension`：**COMPLETED（已确认，2026-09-03）**，第40个正式功能。规划验收05确认十二项标准全部通过，阶段三最终复核02通过；主方向与阶段三方向均归档`passed/`。正式基线Server 1015/0/0/0（全量147份Surefire XML）＋P57聚焦21/0/0/0、Web 116f+1sk/1104t+3sk，H2/PG V47无迁移；P57已核销、不对应既有明细（90项明细状态零变化）；P58 不属于 P57 验收范围。
- `p56-form-grid-layout`：**COMPLETED（已确认，2026-09-02）**，第39个正式功能。P1优先级、L级；10项验收全过，主方向与阶段三方向均已归档`passed/`；M03-F01-01 🟦→✅、P46一并核销；正式基线后端1004/0/0/0（全量）＋聚焦23/0/0/0、前端115f+1sk/1097t+3sk＋聚焦3 files/23 tests、H2 V47（47）/PG V47（46）；清单✅34/🟦23/⬜33（90不变）。
- `p52-form-workbench`：**COMPLETED（已确认，2026-09-02）**，第38个正式功能。12项功能标准全部通过；主方向与阶段三方向均归档`passed/`。P52已核销；正式基线1002/0/0/0、114f/1092t/3skipped、H2 V47（47）/PG V47（46）；清单✅33/🟦24/⬜33（90不变，P52不对应既有明细）。
- `p45-login-security`：**COMPLETED（已确认，2026-09-01）**，第37个正式功能（历史语境）。正式基线后端 **979/0/0/0（agent346）**、前端 **110f/1062t/0sk**、Flyway H2/PG V44（V45/V46披露不晋级）；P45已核销、M02-F06-01为✅、清单 **✅33/🟦24/⬜33**。四份方向归档`passed/`。
- `p51-agent-coding-engine-decoupling`：`COMPLETED（已确认，2026-08-31）`。main 为通用 Agent Coding Engine，develop-sw 为 Smart-WorkFlow/OA 示例；功能级 `PASSED`、阶段三确认和 Owner 授权发布均已在 main 正式历史闭环。P51 不新增 OA 正式业务功能计数。
- `minimal-closure-first-acceptance`：`COMPLETED`（已确认，2026-08-29，验收审计，非新增正式功能）。用户/组织/角色/表单/流程管理、简单流转、数据展示和页面质量全部锁定通过；三份方向均归档 `passed/`；历史基线 955/0/0/0（agent346）、前端 110f/1060t/0skipped、Flyway H2 V44（44）/PG V44（43）。
- `form-data-import-export`：`COMPLETED`（已确认，2026-08-29，第 36 个）。P32 / M03-F04-02 表单数据导入导出；主方向和阶段三方向均归档 `passed/`；功能追踪见 `knowledge/features/form-data-import-export.md`（历史基线 947/1057/V43，已被审计基线取代）。
- `minimal-business-closure`：`COMPLETED`（已确认，2026-08-28，第 35 个）。流程主链、腾讯 IoT 与阶段三方向均归档 `product/minimal-business-closure/passed/`；功能追踪见 `knowledge/features/minimal-business-closure.md`。M08-F01-02/F02-01/F02-02/F04-01/F04-04 为🟦部分完成；现场联调边界继续开放。
