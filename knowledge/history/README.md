# 状态历史索引

本目录保存从当前状态入口迁出的追加式历史，不构成当前状态或下一动作。

| 原位置 | 新位置 | 截止时间 | 说明 |
|---|---|---|---|
| `knowledge/current-status.md`（2026-08-26 notify-template-management 阶段三终态同步前全文，原同步点 2026-08-25） | `knowledge/history/current-status-through-2026-08-26.md` | 2026-08-26 | 原文件完整保留（已完成功能 32、清单 ✅29/🟦21/⬜40、基线后端 827/agent338、前端 100f/988t、Flyway V37）；当前值只以新的 `knowledge/current-status.md` 为准 |
| `knowledge/current-status.md`（2026-08-25 收敛前全文） | `knowledge/history/current-status-through-2026-08-25.md` | 2026-08-25 | 原文件完整保留，含历次功能、基线、候选与过程状态；当前值只以新的 `knowledge/current-status.md` 为准 |
| `knowledge/current-status.md`（2026-08-29，form-data-import-export COMPLETED 已确认、后端 947/前端 1057/3sk、Flyway H2 V43/PG V43 快照） | `knowledge/history/current-status-through-2026-08-29-form-data.md` | 2026-08-29 | 原快照由 `minimal-closure-first-acceptance` 验收审计终态同步迁入历史；当前值只以新的 `knowledge/current-status.md` 为准（验收审计后基线后端 955/前端 1060/0sk、Flyway H2 V44(44)/PG V44(43)，功能数 36、清单 ✅32/🟦25/⬜33 不变） |

迁移规则：历史文件只追加或新增，不回写为当前入口；引用历史事实时必须同时标注日期或决策号。
