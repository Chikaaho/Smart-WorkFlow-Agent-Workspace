# 0.1.3 升级指南

## 全新建库升级（唯一支持路径，UAT 已按此执行）

适用于 `smart_workflow` 可整体重建的环境（数据不保留）。

1. 备份：DB `pg_dump -Fc`、`bootstrap.jar`（.bak 轮换）、`web/`、`server.env`。
2. 停服：`STOP_TIMEOUT=30 ./stop.sh`，确认 8080 关闭。
3. 删库重建（Owner 授权后执行）：
   ```bash
   sudo -u postgres psql -p 5433 -c "DROP DATABASE IF EXISTS smart_workflow WITH (FORCE);"
   sudo -u postgres psql -p 5433 -c "CREATE DATABASE smart_workflow OWNER root;"
   ```
4. 配置核对：`SW_SSO_CIPHER_KEY` 必须 Base64 解码后 ≤32 字节（见 CONFIG-CHANGES.md；48 字节旧值会被 0.1.3 拒绝启动）。
5. 替换 `bootstrap.jar`（sha256 见 MANIFEST.json）与前端 dist（zip 内有 `dist/` 一层，需提升）。
6. `source server.env && ./start.sh`；预期日志：`Successfully applied 2 migrations to schema "public", now at version v0.1.0`，`flyway_schema_history` 恰 2 条成功记录。
7. 验证：`/api/actuator/health` 200 UP；启动段 0 ERROR；公网 `/sw/` 与 `/sw-server/api/actuator/health` 200；admin（V4 种子，测试契约口令 admin123）登录直达工作台。
8. 重建后重录 SSO Provider 凭据（管理后台 → SSO 配置管理）。

## ≤0.1.2 存量库（不重建不可升级）

历史链（V1—V104）已从 0.1.3 移除，原地升级会被 validate-on-migrate 显式拒绝。若必须保留数据：停留在 0.1.2，或将库标记基线（`flyway -baseline-version=0.1.0 baseline`，需自行评估 schema 与基线等价性——0.1.2 库终点 V102，与 V0.1.0 基线相差 V103/V104 两段，需人工核对）后按新链前向；该路径未经验证，生产使用前须单独评审。
