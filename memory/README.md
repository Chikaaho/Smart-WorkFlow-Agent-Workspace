# memory 使用说明

memory 保存规划恢复所需的最小摘要，完整权威见 knowledge/current-status.md，历史证据见 product/。

- 当前：`sso-admin-config` VERIFYING（回执05复核未通过→回执06补证完成，待Planner复核）：A4旧授权生命周期已按方向§三修正实现（V104 state/票据绑定配置指纹，5维变更安全失败+新配置重发起，模块351/bootstrap173全绿），A2零增量与租户隔离具名集成断言4用例，A1同轮身份/计数导出（转录错轮次已承认更正），A3种子错值定源修正+回读20位+PC tooltip/受限身份截图（Web 9375359 tooltip局部修复），S1暴露范围核实+采集端脱敏工具+扫描0命中exit0，A6 knowledge逐字段回读。钉钉900103根因=Owner裁决本地Client ID种子手写误（18位≠20位），已修正；本地授权URL探测0命中900103；B端准入真实链待Owner扫码（外部依赖）。唯一账本 `product/sso-admin-config/receipts/planning-review-admission-and-config-02.md`，回执 `implementation-admission-and-config-06.md`。企业微信延期，P31开放。
- 恢复入口：state.md、handoff.md；功能索引 features.md；必要边界 constraints.md、decisions.md、issues.md。
- 最终裁决：product/v0.1.2-release/receipts/planning-final-review-terminal-sync-20260928-passed.md。
- 0.1.2 生产已于 2026-09-28 部署上线（V102，双端健康 200，`state.md`/`handoff.md` 发布段）；V012-CODE-001 与外部验证继续独立跟踪。
