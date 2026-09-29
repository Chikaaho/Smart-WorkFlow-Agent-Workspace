# 当前状态摘要

> `sso-admin-config` **COMPLETED（待规划确认，2026-09-29；功能验收 PASSED 审查10）**；业务项与R1全部锁定。最终候选 Server `dff266add04a59e0859547f11b647772b20f8e6a`、Web `519a8176e33232a94ab4f1a035042fd2a86793d4`；验证集合：Server system模块351/0/0/0、bootstrap173/0/0/0；Web四连exit0（vitest 1301 passed+3 skipped）；真实钉钉轮换后LOGIN_SUCCESS 9002。R1=DONE；S1限定范围通过（保留局限，不要求Owner提供DB密码/AI Key）。功能数45/增量0、清单46/22/22、ADV64、P31开放未核销（企微延期未验证）不变。唯一下一动作=Planner复核 `receipts/terminal-sync-01.md`。唯一入口 `product/sso-admin-config/ready/direction-sso-admin-config-terminal-sync.md`。

> 总体任务 `backend-architecture-optimization`、`v0.1.1-bugfix`、`v0.1.2-bugfix` 均 `COMPLETED`（裁决与回执见 `product/*/receipts/`）。

## 0.1.2 发布（2026-09-28 上线）

- `v0.1.2-release` **COMPLETED（规划已确认，2026-09-28）**：Server/Web `origin/develop=origin/main`=fd704ff…/5368e6c…（package.json 0.1.2）；tag/Release `0.1.2` 双仓公开 Latest；**生产已部署 0.1.2/V102**（V97—V102 应用 0 failed，公网健康 200；部署回执 `product/v0.1.2-release/receipts/deployment-20260928.md`）。

## 锁定基线

- 功能数 **45**；清单 **✅46/🟦22/⬜22**（90）；**ADV64**；全仓历史基线 **1586/0/0/0** 与 Web **1301+3**（@fd704ff/5368e6c，不与本任务模块计数拼接）；Flyway 制品终点 **V102**（生产已应用；0.1.0 终点 V93 为事实边界）。
- 独立待办：V012-CODE-001 保持 READY；外部通知五渠道与腾讯 IoT 实网验证保持 Owner 延期；小程序冻结。

## 历史压缩

BAO/发布/三方SSO 的阶段细节见 `knowledge/current-status.md` 及 `product/*/`；v0.1.2 最终裁决 `product/v0.1.2-release/receipts/planning-final-review-terminal-sync-20260928-passed.md`；三方 SSO 接入 PASSED（审查07，阶段三回执 `product/dingtalk-sso/receipts/terminal-sync-20260929.md`，待 Planner 确认）。当前任务=sso-admin-config（COMPLETED 待规划确认）；下一动作=Planner复核 receipts/terminal-sync-01.md。
