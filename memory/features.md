# 功能摘要

> 2026-09-29 当前：`sso-admin-config` **COMPLETED（待规划确认，2026-09-29；功能验收 PASSED 审查10）**；业务项与R1全部锁定。最终候选 Server `dff266add04a59e0859547f11b647772b20f8e6a`、Web `519a8176e33232a94ab4f1a035042fd2a86793d4`；验证集合：Server system模块351/0/0/0、bootstrap173/0/0/0；Web四连exit0（vitest 1301 passed+3 skipped）；真实钉钉轮换后LOGIN_SUCCESS 9002。R1=DONE；S1限定范围通过（保留局限，不要求Owner提供DB密码/AI Key）。功能数45/增量0、清单46/22/22、ADV64、P31开放未核销（企微延期未验证）不变。唯一下一动作=Planner复核 `receipts/terminal-sync-01.md`。唯一入口 `product/sso-admin-config/ready/direction-sso-admin-config-terminal-sync.md`。
> 【历史】2026-09-28 修复轮快照：v0.1.2-bugfix 曾为 IN_PROGRESS，已按 Owner 裁决收口。
> 同步点：2026-09-29 三方 SSO 审查07 PASSED；总体任务 `backend-architecture-optimization`（XL）`COMPLETED（规划已确认，2026-09-26）`。
> 清单当前值 **✅46/🟦22/⬜22**（90）；功能数 **45**（发布零变化）；全量双向映射见 `knowledge/feature-reconciliation-index.md`。

- `backend-architecture-optimization`（XL）：**`COMPLETED（规划已确认，2026-09-26）`**；Phase 1—6C 与 Final 均已完成（Final 8/8：双仓 About 与根 POM canonical URL 收口）；基线 1570/0/0/0；10 项候选去向=BAO-01 `DEFERRED` + BAO-02 `PARTIAL` + 8 项 `COMPLETED`。
- `v0.1.0-oa-completion`（P60，P0）：**COMPLETED（规划已确认，2026-09-15）**，整体 14/14；版本身份由 2026-09-21 发布重建，迁移终点 V93。
- 0.1.0 P53/P61 演示环境发布（XL，非业务功能任务）：**COMPLETED（规划已确认，2026-09-21）**；两方向归档 `product/v0.1.0-p53-p61-production-release/passed/`；不增加功能数、不核销 P 编号。
- `v0.1.1-bugfix`（XL，非业务功能计数）：**`COMPLETED（Owner 范围关闭，2026-09-24）`**；25 项缺陷收口、开放修复项 0，两仓本地 `develop` 合并已完成。不表示远程 `develop`、`main`、`0.1.1` tag/Release 或部署已完成。
- P53（P0/XL）：**`PASSED`/`COMPLETED（规划已确认，2026-09-21）`、已核销，第 45 个正式功能**；方向归档 `product/p53-global-ui-component-layout/passed/`。
- P61（P1/L）：**`COMPLETED（规划已确认，2026-09-20）`，已核销**；Server `742adb8`、Web `d110ed8` 已随 P53 合入两仓 develop；不增加功能数。
- 更早阶段（均已 `COMPLETED`，明细见 `knowledge/features/` 与 `knowledge/history/`）：p21 第 44、v0.0.2-oa 第 43、p4-个人中心双派 第 42、p59 第 41 前、knowledge-full-reconciliation；更早 p58/p57/p56/p52/p45/p51/form-import-export/minimal-closure 第 35—41。

- `v0.1.2-bugfix`（L，非业务功能计数）：**`COMPLETED（Owner 范围关闭，2026-09-28）`**（裁决 `product/v0.1.2-bugfix/receipts/planning-owner-close-20260928.md`）；23 项历史执行/回归记录保留，不补造逐项验收；方向归档 `product/v0.1.2-bugfix/passed/`；V012-CODE-001 仍 READY 独立跟踪。
- `v0.1.2-release`（L，非业务功能计数）：**`COMPLETED（规划已确认，2026-09-28）`**——规划发布复核 `PASSED`（`product/v0.1.2-release/receipts/planning-review-release-20260928-passed.md`）；两仓 develop→main 快进（Server `fd704ff…`、Web `5368e6c…`）、annotated tag `0.1.2`、正式 Release（CI 36396145288 / 36396187465）；本次未部署。发布执行回执 `product/v0.1.2-release/receipts/release-20260928.md`，终态同步回执 `receipts/terminal-sync-20260928.md`。
- 三方 SSO 真实接入（`dingtalk-sso`，L，既有 I5 补验、非新增功能计数/增量 0）：功能级 **`PASSED（2026-09-29，审查07）`**、接入功能状态 `COMPLETED（待规划确认）`；主方向归档 `product/dingtalk-sso/passed/`。钉钉/飞书真实授权链与企业矩阵验收通过（G3b 企业归属约束、个人模式显式、错配拒绝）；验收集合 Server 本任务模块 319/0/0/0＋Boot 4/0/0/0、Web 1301+3。企业微信 Owner 延期未验证；P31 未核销。
- `sso-admin-config` **COMPLETED（待规划确认，2026-09-29；功能验收 PASSED 审查10）**；业务项与R1全部锁定。最终候选 Server `dff266add04a59e0859547f11b647772b20f8e6a`、Web `519a8176e33232a94ab4f1a035042fd2a86793d4`；验证集合：Server system模块351/0/0/0、bootstrap173/0/0/0；Web四连exit0（vitest 1301 passed+3 skipped）；真实钉钉轮换后LOGIN_SUCCESS 9002。R1=DONE；S1限定范围通过（保留局限，不要求Owner提供DB密码/AI Key）。功能数45/增量0、清单46/22/22、ADV64、P31开放未核销（企微延期未验证）不变。唯一下一动作=Planner复核 `receipts/terminal-sync-01.md`。唯一入口 `product/sso-admin-config/ready/direction-sso-admin-config-terminal-sync.md`。
