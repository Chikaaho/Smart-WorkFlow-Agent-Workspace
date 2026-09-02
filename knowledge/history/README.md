# 状态历史索引

本目录保存从当前状态入口迁出的追加式历史，不构成当前状态或下一动作。

| 原位置 | 新位置 | 截止时间 | 说明 |
|---|---|---|---|
| `knowledge/current-status.md`（2026-08-26 notify-template-management 阶段三终态同步前全文，原同步点 2026-08-25） | `knowledge/history/current-status-through-2026-08-26.md` | 2026-08-26 | 原文件完整保留（已完成功能 32、清单 ✅29/🟦21/⬜40、基线后端 827/agent338、前端 100f/988t、Flyway V37）；当前值只以新的 `knowledge/current-status.md` 为准 |
| `knowledge/current-status.md`（2026-08-25 收敛前全文） | `knowledge/history/current-status-through-2026-08-25.md` | 2026-08-25 | 原文件完整保留，含历次功能、基线、候选与过程状态；当前值只以新的 `knowledge/current-status.md` 为准 |
| `knowledge/current-status.md`（2026-08-29，form-data-import-export COMPLETED 已确认、后端 947/前端 1057/3sk、Flyway H2 V43/PG V43 快照） | `knowledge/history/current-status-through-2026-08-29-form-data.md` | 2026-08-29 | 原快照由 `minimal-closure-first-acceptance` 验收审计终态同步迁入历史；当前值只以新的 `knowledge/current-status.md` 为准（验收审计后基线后端 955/前端 1060/0sk、Flyway H2 V44(44)/PG V44(43)，功能数 36、清单 ✅32/🟦25/⬜33 不变） |
| `knowledge/current-status.md`（2026-08-29，minimal-closure-first-acceptance COMPLETED（待规划终态复核）旧下一动作快照） | `knowledge/history/current-status-through-2026-08-29-gov-audit-13.md` | 2026-08-29 | 原快照由 `GOV-AUDIT-13` 当前状态单值机械同步迁入历史；当前值只以新的 `knowledge/current-status.md` 为准（minimal-closure-first-acceptance、README 同步、Admin 审计/修复、GOV-AUDIT-13 均 COMPLETED（已确认），下一动作复位为规划选择下一正式功能） |
| `knowledge/current-status.md`（2026-08-29，P45 功能级 PASSED 后阶段三前快照） | `knowledge/history/current-status-through-2026-09-01-p45-stage3-before.md` | 2026-09-01 | 原快照由 P45 阶段三终态同步迁入历史；当前值只以新的 `knowledge/current-status.md` 为准（P45 功能数 36→37、清单 ✅33/🟦24/⬜33、基线后端 979/0/0/0（agent 346）、前端 110 files/1062 tests/0 skipped、Flyway H2 V44(44)/PG V44(43)，P45 核销、M02-F06-01 升✅） |
| `knowledge/current-status.md`（2026-09-01，P52 功能级 PASSED 后阶段三前快照） | `knowledge/history/current-status-through-2026-09-02-p52-stage3-before.md` | 2026-09-02 | 原快照由 P52 阶段三终态同步迁入历史；当前值只以新的 `knowledge/current-status.md` 为准（P52 功能数 37→38、清单 ✅33/🟦24/⬜33（90 不变，P52 不对应既有明细）、正式基线后端 1002/0/0/0、前端 114 files/1092 tests/3 skipped、Flyway H2 V47(47)/PG V47(46)，P52 核销，所有明细状态不变） |
| `knowledge/current-status.md`（2026-09-02，P56 功能级 PASSED 后阶段三前快照） | `knowledge/history/current-status-through-2026-09-02-p56-stage3-before.md` | 2026-09-02 | 原快照由 P56 阶段三终态同步迁入历史；当前值只以新的 `knowledge/current-status.md` 为准（P56 功能数 38→39、清单 ✅34/🟦23/⬜33（34+23+33=90，M03-F01-01 🟦→✅）、正式基线后端 1004/0/0/0（全量 143 Surefire XML，BUILD SUCCESS）+ 聚焦 23/0/0/0、前端 115 files passed + 1 skipped/1097 tests passed + 3 skipped + 聚焦 3 files/23 tests、Flyway H2 V47(47)/PG V47(46) 无新增迁移，P56 核销、P46 一并完成核销） |

迁移规则：历史文件只追加或新增，不回写为当前入口；引用历史事实时必须同时标注日期或决策号。
