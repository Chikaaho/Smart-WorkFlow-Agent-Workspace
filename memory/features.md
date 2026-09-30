# 功能摘要

> 当前（2026-09-30）：P62（XL）PLANNING，Owner 已启动规划并纳入信息治理；唯一下一动作见 memory/state.md。
> 功能数45沿用；IG2a 补证后口径：45 行=45 唯一 ID=45 唯一登记路径全部存在（#1 由 bpm-single-node-approval 承载登记、#23 已按 D107 更正当前状态并落盘），状态依据完整句见回执03附件；清单46/22/22（90）与映射索引双向一致、ADV64已行级复算；本轮零核销。以下既有功能按各裁决时点引用。

- `backend-architecture-optimization`（XL）：**`COMPLETED（规划已确认，2026-09-26）`**；Phase 1—6C 与 Final 均已完成（Final 8/8：双仓 About 与根 POM canonical URL 收口）；基线 1570/0/0/0（BAO历史时点）；10 项候选去向=BAO-01 `DEFERRED` + BAO-02 `PARTIAL` + 8 项 `COMPLETED`。
- `v0.1.0-oa-completion`（P60，P0）：**COMPLETED（规划已确认，2026-09-15）**，整体 14/14；版本身份由 2026-09-21 发布重建，迁移终点 V93。
- 0.1.0 P53/P61 演示环境发布（XL，非业务功能任务）：**COMPLETED（规划已确认，2026-09-21）**；两方向归档 `product/v0.1.0-p53-p61-production-release/passed/`；不增加功能数、不核销 P 编号。
- `v0.1.1-bugfix`（XL，非业务功能计数）：**`COMPLETED（Owner 范围关闭，2026-09-24）`**；25 项缺陷收口、开放修复项 0，两仓本地 `develop` 合并已完成。不表示远程 `develop`、`main`、`0.1.1` tag/Release 或部署已完成。
- P53（P0/XL）：**`PASSED`/`COMPLETED（规划已确认，2026-09-21）`、已核销，第 45 个正式功能**；方向归档 `product/p53-global-ui-component-layout/passed/`。
- P61（P1/L）：**`COMPLETED（规划已确认，2026-09-20）`，已核销**；Server `742adb8`、Web `d110ed8` 已随 P53 合入两仓 develop；不增加功能数。
- 更早阶段（均已 `COMPLETED`，明细见 `knowledge/features/` 与 `knowledge/history/`）：p21 第 44、v0.0.2-oa 第 43、p4-个人中心双派 第 42、p59 第 41 前、knowledge-full-reconciliation；更早 p58/p57/p56/p52/p45/p51/form-import-export/minimal-closure 第 35—41。

- `v0.1.2-bugfix`（L，非业务功能计数）：**`COMPLETED（Owner 范围关闭，2026-09-28）`**（裁决 `product/v0.1.2-bugfix/receipts/planning-owner-close-20260928.md`）；23 项历史执行/回归记录保留，不补造逐项验收；方向归档 `product/v0.1.2-bugfix/passed/`；V012-CODE-001 仍 READY 独立跟踪。
- `v0.1.2-release`（L，非业务功能计数）：**`COMPLETED（规划已确认，2026-09-28）`**——规划发布复核 `PASSED`（`product/v0.1.2-release/receipts/planning-review-release-20260928-passed.md`）；两仓 develop→main 快进（Server `fd704ff…`、Web `5368e6c…`）、annotated tag `0.1.2`、正式 Release（CI 36396145288 / 36396187465）；该发布回执时未部署；后续2026-09-28部署见同目录 `deployment-20260928.md`，均为历史时点。发布执行回执 `product/v0.1.2-release/receipts/release-20260928.md`，终态同步回执 `receipts/terminal-sync-20260928.md`。
- 三方 SSO 真实接入（`dingtalk-sso`，L，既有 I5 补验、非新增功能计数/增量 0）：功能级 **`PASSED（2026-09-29，审查07）`**、接入功能状态 `COMPLETED（待规划确认）`；主方向归档 `product/dingtalk-sso/passed/`。钉钉/飞书真实授权链与企业矩阵验收通过（G3b 企业归属约束、个人模式显式、错配拒绝）；验收集合 Server 本任务模块 319/0/0/0＋Boot 4/0/0/0、Web 1301+3。企业微信 Owner 延期未验证；P31 未核销。
- `sso-admin-config` **COMPLETED（规划已确认，2026-09-29）**。钉钉/飞书准入、后台配置、PC/H5、R1轮换均完成；S1限定范围检查保留局限。Server dff266add04a59e0859547f11b647772b20f8e6a；Web519a8176e33232a94ab4f1a035042fd2a86793d4；本任务模块351/0/0/0、bootstrap173/0/0/0、Web四连及1301+3。功能数45/增量0、清单46/22/22、ADV64不变；P31开放（企业微信延期）。本功能无剩余执行动作；裁决 `product/sso-admin-config/receipts/planning-final-review-terminal-sync-01-completed.md`。

- P62：整体PLANNING；治理PASSED；首事务阶段VERIFYING（回执03待复核：LT01a—LT05a 已补证，含真实 HTTP 上层入口、单对象冻结结算、非空升级链；Server `6e73a11`、门禁 1660/0/0/0）；回执 `product/p62-lowcode-transaction-bpm-tiering/receipts/local-transaction-actions-03.md`，审查依据 `receipts/planning-review-local-transaction-actions-02.md`。
- v0.1.3-release：COMPLETED（Owner已验收，2026-09-30），Owner插单直接发版；本轮只同步状态。发布/部署身份及测试数字保留原回执时点，不新增业务功能数。
