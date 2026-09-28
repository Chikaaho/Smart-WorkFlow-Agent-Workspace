# CH-aPaaS 0.1.2 回滚说明

- 候选提交：Server `fd704ff12af3ccd99febaa700c523d7688e91509`、Web `5368e6c656c095acd3fe2cff1875c27ee5672307`

## 应用回滚

1. 停止后端进程，恢复升级前备份的 jar 与 `server.env`（或回退到上一版本 CI 制品）。
2. 前端恢复升级前备份的 dist 目录。
3. 启动后验证 health 200 与登录可用。

## 数据库回滚（硬边界）

- Flyway 迁移（V94→V102）为**前向唯一方向**，不支持自动降级；其中 V95/V97/V98 会改写既有菜单/字典数据。
- 应用回滚后如需恢复数据库，必须使用**升级前完成的数据库备份**恢复；仅回滚应用不回滚数据库时，菜单/字典/新表结构与旧版代码并存，属已知的非对称兼容状态，须按 DB-MIGRATIONS.md 逐项评估。

## 保留与参考

- 升级前备份清单与历史回滚惯例见 `release/0.1.0/ROLLBACK.md` 与 2026-09-26 发布回执备份记录（`product/v0.1.2-production-release/receipts/production-release-01.md`）。
