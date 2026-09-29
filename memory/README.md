# memory 使用说明

memory 保存规划恢复所需的最小摘要，完整权威见 knowledge/current-status.md，历史证据见 product/。

- 当前：`sso-admin-config` `sso-admin-config` **COMPLETED（待规划确认，2026-09-29；功能验收 PASSED 审查10）**；业务项与R1全部锁定。最终候选 Server `dff266add04a59e0859547f11b647772b20f8e6a`、Web `519a8176e33232a94ab4f1a035042fd2a86793d4`；验证集合：Server system模块351/0/0/0、bootstrap173/0/0/0；Web四连exit0（vitest 1301 passed+3 skipped）；真实钉钉轮换后LOGIN_SUCCESS 9002。R1=DONE；S1限定范围通过（保留局限，不要求Owner提供DB密码/AI Key）。功能数45/增量0、清单46/22/22、ADV64、P31开放未核销（企微延期未验证）不变。唯一下一动作=Planner复核 `receipts/terminal-sync-01.md`。唯一入口 `product/sso-admin-config/ready/direction-sso-admin-config-terminal-sync.md`。企业微信延期，P31开放，功能数45/增量0。
- 恢复入口：state.md、handoff.md；功能索引 features.md；必要边界 constraints.md、decisions.md、issues.md。
- 最终裁决：product/v0.1.2-release/receipts/planning-final-review-terminal-sync-20260928-passed.md。
- 0.1.2 生产已于 2026-09-28 部署上线（V102，双端健康 200，`state.md`/`handoff.md` 发布段）；V012-CODE-001 与外部验证继续独立跟踪。
