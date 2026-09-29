# 当前状态摘要

> **0.1.3 发布完成并部署 UAT（2026-09-30，执行自验通过待规划验收）**：flyway 种子合并为 `V0.1.0__baseline_seed`（原 V1—V104，等价 sha256 PG `ec5b532e…`/H2 `c5c6bf63…`；0.1.3 起仅支持全新建库）；两仓 main/tag/Release `0.1.3` 均 Latest（Server `8e23a2d`、Web `e3ae316`，CI 36603608187/36602576798 success）；UAT 删库重建上线：Flyway 2 条→v0.1.0、health UP、公网 200、浏览器验收通过；`SW_SSO_CIPHER_KEY` 契约收紧 32 字节（UAT 已轮换）。本地全量 1629/0/0/0。材料 `release/0.1.3/`；回执 `product/v0.1.3-release/receipts/{release,deployment}-20260930.md`。

> `sso-admin-config` **COMPLETED（规划已确认，2026-09-29）**。钉钉/飞书准入、后台配置、PC/H5、R1轮换均完成；S1限定范围检查保留局限。Server dff266add04a59e0859547f11b647772b20f8e6a；Web519a8176e33232a94ab4f1a035042fd2a86793d4；本任务模块351/0/0/0、bootstrap173/0/0/0、Web四连及1301+3。功能数45/增量0、清单46/22/22、ADV64不变；P31开放（企业微信延期）。本功能无剩余执行动作；裁决 `product/sso-admin-config/receipts/planning-final-review-terminal-sync-01-completed.md`。

> 总体任务 `backend-architecture-optimization`、`v0.1.1-bugfix`、`v0.1.2-bugfix` 均 `COMPLETED`（裁决与回执见 `product/*/receipts/`）。

## 0.1.2 发布（2026-09-28 上线；已被 0.1.3 取代）

- `v0.1.2-release` **COMPLETED（规划已确认，2026-09-28）**：Server/Web `origin/develop=origin/main`=fd704ff…/5368e6c…（package.json 0.1.2）；tag/Release `0.1.2` 双仓公开 Latest；**生产已部署 0.1.2/V102**（V97—V102 应用 0 failed，公网健康 200；部署回执 `product/v0.1.2-release/receipts/deployment-20260928.md`）。

## 锁定基线

- 功能数 **45**；清单 **✅46/🟦22/⬜22**（90）；**ADV64**；全仓历史基线 **1586/0/0/0** 与 Web **1301+3**（@fd704ff/5368e6c，不与本任务模块计数拼接）；Flyway 制品终点 **V0.1.0 基线**（0.1.3 全新建库形态；历史 V102/V93 只作 0.1.2/0.1.0 时点事实）。
- 独立待办：V012-CODE-001 保持 READY；外部通知五渠道与腾讯 IoT 实网验证保持 Owner 延期；小程序冻结。

## 历史压缩

BAO/发布/三方SSO 的阶段细节见 `knowledge/current-status.md` 及 `product/*/`；v0.1.2 最终裁决 `product/v0.1.2-release/receipts/planning-final-review-terminal-sync-20260928-passed.md`；三方 SSO 接入 PASSED（审查07，阶段三回执 `product/dingtalk-sso/receipts/terminal-sync-20260929.md`，待 Planner 确认）。sso-admin-config已COMPLETED（规划确认），本功能无剩余执行动作。
