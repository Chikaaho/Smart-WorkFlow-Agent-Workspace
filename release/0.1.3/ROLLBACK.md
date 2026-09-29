# 0.1.3 回滚

UAT（chikaho.cn）当前唯一部署环境，已删库重建上线 0.1.3。回滚 = 回到 0.1.2：

1. 停服：`STOP_TIMEOUT=30 ./stop.sh`。
2. 还原 jar：`mv bootstrap.jar.bak bootstrap.jar`（0.1.2 包，2026-09-28 上线版）。
3. 还原前端：`rm -rf /opt/smart-workflow/web && mv /opt/smart-workflow/web.bak-pre013 /opt/smart-workflow/web`。
4. **数据库为全新空库+种子，无业务数据可回**：如需 0.1.2 时点数据，恢复备份 `sudo -u postgres pg_restore -p 5433 -d smart_workflow --clean --if-exists /data/backup/smart_workflow_20260930_0139_pre013.dump`（0.1.2 全量 V102 状态）。
5. 还原配置：`server.env` 中 `SW_SSO_CIPHER_KEY` 需换回备份 `server.env.bak-pre013` 中的 48 字节旧值（0.1.2 接受；0.1.3 不接受）。
6. `source server.env && ./start.sh`，健康与 Flyway 历史（V102）复核。

注意：0.1.3 上线后新产生的数据（含重录的 SSO 凭据密文，以 32 字节新密钥加密）不在 0.1.2 备份内，回滚后不可见且旧密钥无法解密新密文——需在管理后台重新录入。
