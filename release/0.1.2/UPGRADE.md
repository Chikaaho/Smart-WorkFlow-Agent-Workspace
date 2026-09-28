# CH-aPaaS 0.1.2 升级说明

- 适用起点：0.1.0 及之后任意工作版本（含 0.1.1 修复轮、2026-09-26 生产快照）
- 目标版本：0.1.2
- 候选提交：Server `fd704ff12af3ccd99febaa700c523d7688e91509`、Web `5368e6c656c095acd3fe2cff1875c27ee5672307`

## 升级步骤

1. **备份**：升级前完成数据库备份与应用目录备份（jar / dist 各留一份）。
2. **后端**：以 Release 资产 `bootstrap-0.1.2.jar`（sha256 见 MANIFEST.json）替换现有 jar，按既有 `server.env` / profile 启动；Flyway 自动前向迁移至 **V102**（详见 DB-MIGRATIONS.md）。
3. **前端**：以 Release 资产 `sw-web-dist-0.1.2.zip` 解压替换 dist 目录。
4. **验证**：`/sw/` 与 `/sw-server/api/actuator/health` 返回 200；登录后抽查工作台、流程中心（收藏/主题规则）、表单管理（创建人列）、菜单管理页面。
5. **菜单数据**：V95/V97 迁移自动完成更名/归位，无需手工处理；如自定义过菜单数据，升级后核对受影响条目。

## 注意事项

- 迁移为前向唯一方向；升级后回滚应用需连同数据库恢复到升级前备份（见 ROLLBACK.md）。
- **生产环境已于 2026-09-28 完成本 0.1.2 部署**（V96→V102，0 failed，备份与回滚记录见 `product/v0.1.2-release/receipts/deployment-20260928.md`）；本说明继续适用于从 0.1.0/0.1.1 或其他环境升级。
- 外部通知渠道（SMS/EMAIL/FEISHU/DINGTALK/WECHAT_WORK）与腾讯 IoT 实网凭据沿用既有配置，本版本不涉及。
