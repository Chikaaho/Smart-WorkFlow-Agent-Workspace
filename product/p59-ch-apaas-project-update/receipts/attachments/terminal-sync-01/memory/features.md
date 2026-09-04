# 功能摘要

> 规划侧最新同步点：2026-09-04（P59 阶段三终态同步）；正式功能数与基线仍以 `knowledge/current-status.md` 为准。
> 2026-09-04 知识库全量整理：清单当前值为 **✅34/🟦28/⬜28**（五行 ⬜→🟦，其余 85 行不变）；功能数 41 不变；全量双向映射见 `knowledge/feature-reconciliation-index.md`。

- `p59-ch-apaas-project-update`：功能级 **PASSED（2026-09-04，审查07）**，非新增业务功能（41＋0）；**P59 已核销**；阶段三终态同步已提交 `terminal-sync-01.md`，待 Planner 复核确认 COMPLETED；说明/仓库/main 整理及真实自动发版已验收，三个示例仅记录；41 及正式业务基线不变。

- `knowledge-full-reconciliation`（非业务功能任务）：**COMPLETED（已确认，2026-09-04）**，三方向归档 `passed/`（裁决 `planning-final-review-terminal-sync-02-passed.md`）。

- `p58-workflow-node-capabilities`：**COMPLETED（已确认，2026-09-04）**，第41个正式功能（历史点）。规划验收08确认十六项标准全部通过，阶段三终态复核通过；主方向与开发调试认证方向归档`passed/`，阶段三方向已归档`passed/`。正式基线Server 1035/0/0/0（全量152份Surefire报告）、Web 117f+1sk/1110t+3sk（lint 47 warnings/0 errors）、H2 V49（49）/PG V49（48）全链退出0；附加回执08 G1—G3隔离运行退出0、生产排除扫描通过，临时探针不加入正式测试计数。P58已核销、当时不对应既有明细（当时90项明细状态零变化）；P58 已覆盖子集对应的五行清单项由 2026-09-04 对账登记为 🟦（P34/P35/P37/P38/P39 部分实现未核销）。
- `p57-bpm-node-extension`：**COMPLETED（已确认，2026-09-03）**，第40个正式功能。规划验收05确认十二项标准全部通过，阶段三最终复核02通过；主方向与阶段三方向均归档`passed/`。正式基线Server 1015/0/0/0（全量147份Surefire XML）＋P57聚焦21/0/0/0、Web 116f+1sk/1104t+3sk，H2/PG V47无迁移；P57已核销、不对应既有明细（90项明细状态零变化）；P58 不属于 P57 验收范围。
- `p56-form-grid-layout`：**COMPLETED（已确认，2026-09-02）**，第39个正式功能。P1优先级、L级；10项验收全过，主方向与阶段三方向均已归档`passed/`；M03-F01-01 🟦→✅、P46一并核销；正式基线后端1004/0/0/0（全量）＋聚焦23/0/0/0、前端115f+1sk/1097t+3sk＋聚焦3 files/23 tests、H2 V47（47）/PG V47（46）；清单✅34/🟦23/⬜33（90不变）。
- `p52-form-workbench`：**COMPLETED（已确认，2026-09-02）**，第38个正式功能。12项功能标准全部通过；主方向与阶段三方向均归档`passed/`。P52已核销；正式基线1002/0/0/0、114f/1092t/3skipped、H2 V47（47）/PG V47（46）；清单✅33/🟦24/⬜33（90不变，P52不对应既有明细）。
- `p45-login-security`：**COMPLETED（已确认，2026-09-01）**，第37个正式功能（历史语境）。正式基线后端 **979/0/0/0（agent346）**、前端 **110f/1062t/0sk**、Flyway H2/PG V44（V45/V46披露不晋级）；P45已核销、M02-F06-01为✅、清单 **✅33/🟦24/⬜33**。四份方向归档`passed/`。
- `p51-agent-coding-engine-decoupling`：`COMPLETED（已确认，2026-08-31）`。main 为通用 Agent Coding Engine，develop-sw 为 Smart-WorkFlow/OA 示例；功能级 `PASSED`、阶段三确认和 Owner 授权发布均已在 main 正式历史闭环。P51 不新增 OA 正式业务功能计数。
- `minimal-closure-first-acceptance`：`COMPLETED`（已确认，2026-08-29，验收审计，非新增正式功能）。用户/组织/角色/表单/流程管理、简单流转、数据展示和页面质量全部锁定通过；三份方向均归档 `passed/`；历史基线 955/0/0/0（agent346）、前端 110f/1060t/0skipped、Flyway H2 V44（44）/PG V44（43）。
- `form-data-import-export`：`COMPLETED`（已确认，2026-08-29，第 36 个）。P32 / M03-F04-02 表单数据导入导出；主方向和阶段三方向均归档 `passed/`；功能追踪见 `knowledge/features/form-data-import-export.md`（历史基线 947/1057/V43，已被审计基线取代）。
- `minimal-business-closure`：`COMPLETED`（已确认，2026-08-28，第 35 个）。流程主链、腾讯 IoT 与阶段三方向均归档 `product/minimal-business-closure/passed/`；功能追踪见 `knowledge/features/minimal-business-closure.md`。M08-F01-02/F02-01/F02-02/F04-01/F04-04 为🟦部分完成；现场联调边界继续开放。
