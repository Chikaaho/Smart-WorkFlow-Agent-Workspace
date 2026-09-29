# 功能摘要

> 2026-09-29 当前：`sso-admin-config` VERIFYING；回执07定点补证完成：A1a同轮XML导出（48/7/4+5+1全测试名清单）、A1b Web四连exit0（vitest 1301+3，候选86c5ec1）、A2/A4断言定位（ticket_rejectedPaths_issueNoSession含verify-never会话零签发）、A3延期标记列宽修复+390真实视口三段滚动证据、A6全入口回读（current-status已同步）、S1a扫描器已知值3类CHECKED+fatal0+exit0、S1b远端当前文件0残留+轮换方案供Owner决定；B1授权页已在浏览器打开（免扫码一键授权）待Owner点击「立即登录」后核验准入真实链。唯一账本 `product/sso-admin-config/receipts/planning-review-admission-and-config-02.md`；下一回执07。企业微信延期，P31开放。
> 【历史】2026-09-28 修复轮快照：v0.1.2-bugfix 曾为 IN_PROGRESS，已按 Owner 裁决收口。
> 同步点：2026-09-29 三方 SSO 审查07 PASSED；总体任务 `backend-architecture-optimization`（XL）`COMPLETED（规划已确认，2026-09-26）`。
> 清单当前值 **✅46/🟦22/⬜22**（90）；功能数 **45**（发布零变化）；全量双向映射见 `knowledge/feature-reconciliation-index.md`。

- `backend-architecture-optimization`（XL）：**`COMPLETED（规划已确认，2026-09-26）`**；Phase 1—6C 与 Final 均已完成（Final 8/8：双仓 About 与根 POM canonical URL 收口）；基线 1570/0/0/0；10 项候选去向=BAO-01 `DEFERRED` + BAO-02 `PARTIAL` + 8 项 `COMPLETED`。
- `v0.1.0-oa-completion`（P60，P0）：**COMPLETED（规划已确认，2026-09-15）**，整体 14/14；版本身份由 2026-09-21 发布重建，迁移终点 V93。
- 0.1.0 P53/P61 演示环境发布（XL，非业务功能任务）：**COMPLETED（规划已确认，2026-09-21）**；两方向归档 `product/v0.1.0-p53-p61-production-release/passed/`；不增加功能数、不核销 P 编号。
- `v0.1.1-bugfix`（XL，非业务功能计数）：**`COMPLETED（Owner 范围关闭，2026-09-24）`**；25 项缺陷收口、开放修复项 0，两仓本地 `develop` 合并已完成。不表示远程 `develop`、`main`、`0.1.1` tag/Release 或部署已完成。
- P53（P0/XL）：**`PASSED`/`COMPLETED（规划已确认，2026-09-21）`、已核销，第 45 个正式功能**；方向归档 `product/p53-global-ui-component-layout/passed/`。
- P61（P1/L）：**`COMPLETED（规划已确认，2026-09-20）`，已核销**；Server `742adb8`、Web `d110ed8` 已随 P53 合入两仓 develop；不增加功能数。
- 更早阶段（均已 `COMPLETED`，详情见 `knowledge/features/` 与 `knowledge/history/`）：`p21-iot-device-access` 第 44（2026-09-08；P21 已核销、I14 关闭）；`v0.0.2-oa` 第 43（2026-09-07；A1—A8 锁定，P3/P54/P55 已核销，P2/P4 开放）；`p4-oa-personal-center-dual-dispatch` 第 42（2026-09-07；P4 总项开放）；`p59-ch-apaas-project-update`（2026-09-05；P59 已核销）；`knowledge-full-reconciliation`（非业务功能，2026-09-04）。更早：p58 第 41、p57 第 40、p56 第 39、p52 第 38、p45 第 37、p51 引擎解耦、form-data-import-export 第 36、minimal-business-closure 第 35。

- `v0.1.2-bugfix`（L，非业务功能计数）：**`COMPLETED（Owner 范围关闭，2026-09-28）`**（裁决 `product/v0.1.2-bugfix/receipts/planning-owner-close-20260928.md`）；23 项历史执行/回归记录保留，不补造逐项验收；方向归档 `product/v0.1.2-bugfix/passed/`；V012-CODE-001 仍 READY 独立跟踪。
- `v0.1.2-release`（L，非业务功能计数）：**`COMPLETED（规划已确认，2026-09-28）`**——规划发布复核 `PASSED`（`product/v0.1.2-release/receipts/planning-review-release-20260928-passed.md`）；两仓 develop→main 快进（Server `fd704ff…`、Web `5368e6c…`）、annotated tag `0.1.2`、正式 Release（CI 36396145288 / 36396187465）；本次未部署。发布执行回执 `product/v0.1.2-release/receipts/release-20260928.md`，终态同步回执 `receipts/terminal-sync-20260928.md`。
- 三方 SSO 真实接入（`dingtalk-sso`，L，既有 I5 补验、非新增功能计数/增量 0）：功能级 **`PASSED（2026-09-29，审查07）`**、接入功能状态 `COMPLETED（待规划确认）`；主方向归档 `product/dingtalk-sso/passed/`。钉钉/飞书真实授权链与企业矩阵验收通过（G3b 企业归属约束、个人模式显式、错配拒绝）；验收集合 Server 本任务模块 319/0/0/0＋Boot 4/0/0/0、Web 1301+3。企业微信 Owner 延期未验证；P31 未核销。
- `sso-admin-config` VERIFYING；回执07定点补证完成：A1a同轮XML导出（48/7/4+5+1全测试名清单）、A1b Web四连exit0（vitest 1301+3，候选86c5ec1）、A2/A4断言定位（ticket_rejectedPaths_issueNoSession含verify-never会话零签发）、A3延期标记列宽修复+390真实视口三段滚动证据、A6全入口回读（current-status已同步）、S1a扫描器已知值3类CHECKED+fatal0+exit0、S1b远端当前文件0残留+轮换方案供Owner决定；B1授权页已在浏览器打开（免扫码一键授权）待Owner点击「立即登录」后核验准入真实链。唯一账本 `product/sso-admin-config/receipts/planning-review-admission-and-config-02.md`；下一回执07。企业微信延期，P31开放。
