# 0.1.3 UAT 删库重建部署回执（deployment-20260930）

- 环境：UAT（`docs/ops/production-ops.md` 所述单机：chikaho.cn，PostgreSQL 14/16 @5433，库 `smart_workflow`，`/opt/smart-workflow`；Owner 2026-09-29 指令「对现在 uat 环境执行删库重建发版」）
- 授权：Owner 直接指令（删库重建为明确授权的破坏性动作；执行全程备份先行）
- 结果：**0.1.3 上线成功**——Flyway 全新迁移 2 条至 V0.1.0、健康 200 UP、启动段 0 ERROR、公网双 200、可见浏览器验收通过

## 1. 执行序列（含证据）

| 步骤 | 动作 | 结果 |
|---|---|---|
| 1 | 制品上传（Release 资产原件） | `bootstrap-0.1.3.jar` sha256 `483d1a98…`、`sw-web-dist-0.1.3.zip` sha256 `0346a3e9…`，**远端 sha256sum 回读逐一一致** |
| 2 | 只读盘点 | 应用 PID 1531211 @8080；DB owner=root、147 表、flyway 终点 V102（0.1.2 状态确认） |
| 3 | 停服 | `STOP_TIMEOUT=30 ./stop.sh`；8080 关闭、旧 PID 退出（显式复核） |
| 4 | 备份 | DB `/data/backup/smart_workflow_20260930_0139_pre013.dump`（418K，0.1.2/V102 全量）；`bootstrap.jar.bak` 轮换；`web.bak-pre013`；`server.env.bak-pre013` |
| 5 | 删库重建 | `DROP DATABASE IF EXISTS … WITH (FORCE)` + `CREATE DATABASE … OWNER root`；空库 0 表回读 |
| 6 | 替换 | jar 安装（216,837,921 bytes）；web 解压（zip 内含 `dist/` 一层，已提升；359 文件，index.html 就位）；`nginx -t` 通过 |
| 7 | 启动（第一次） | **失败**：`SsoAuthService … AES cipher key too long: 48 bytes, maximum 32`（见 §2）；Flyway 主迁移此时已成功（2 条 → v0.1.0） |
| 8 | 配置修正 | `SW_SSO_CIPHER_KEY` 于服务器本地换为 32 字节随机密钥（值不落输出；`server.env.bak-pre013` 留存旧值） |
| 9 | 启动（第二次） | 成功：PID 1576953；**`Successfully applied 2 migrations to schema "public", now at version v0.1.0 (execution time 00:04.210s)`，0 failed**；prod-update 独立历史表 baseline 成功 |
| 10 | 验证 | 运行时 `SW_SSO_CIPHER_KEY` 解码 32 字节；health `{"status":"UP"}`；表 101（99 业务 + 双 flyway 历史）；**启动段 ERROR 0**（全日志唯一 ERROR 为步骤 7 旧崩溃，时间戳 01:42 PID 1575875） |
| 11 | 公网 | `https://chikaho.cn/sw/` 200；`/sw-server/api/actuator/health` 200 UP |

## 2. 配置契约修正（`SW_SSO_CIPHER_KEY`）

0.1.3 的 `SsoCredentialCipher` 要求 Base64 解码后 ≤32 字节；UAT 原 48 字节值（0.1.2 契约允许）被 fail-fast 拒绝。处置：服务器本地 `openssl rand -base64 32` 替换（新值运行时回读 32 字节确认）。**无数据兼容损失**：库为全新重建，SSO Provider 配置与绑定均为空（管理后台 Credential=Not set）。完整契约说明与存量库警示：`release/0.1.3/CONFIG-CHANGES.md`。

## 3. 正式浏览器验收（可见会话，headless=false）

身份：admin（基线 V4 种子，测试契约口令 admin123）；视口 1920×1080；制品 `evidence/uat-browser-01/`：

- `r0-login-page.png`（截图存档于浏览器会话产物）：登录页完整渲染，含 0.1.3 SSO 三厂商区块（WeCom/Feishu/DingTalk）。
- `r1-workspace-after-login.png`：**admin 登录成功直达 `/sw/workspace`**（"Good morning，系统管理员"、待办/草稿/Quick launch 卡完整）。
- `r2-sso-config-page.png`：**0.1.3 新页面「SSO 配置管理」完整渲染**（三 Provider 行、Credential=Not set、回调 server-derived 只读、Audit 入口、菜单高亮——V103 菜单段生效）。

验证码说明：图形验证码第一次识别错误（kEmw）被系统拒绝（"验证码错误"），刷新后正确识别（ac5p）通过——负向拒绝行为顺带得到真实验证。

## 4. 回滚路径

见 `release/0.1.3/ROLLBACK.md`（jar.bak / web.bak-pre013 / DB dump / server.env.bak 四件齐备；注意新库数据与新密钥密文不随 0.1.2 备份回退）。

## 5. 边界与后续

- 删库重建按指令清空全部业务数据：SSO 凭据需重录、B 端绑定需重建、企业微信保持 Owner 延期（P31 开放）。
- 服务器遗留 `/tmp` 清理已完成（zip/jar 已 mv 就位，无残留制品）。
- `server.log` 为累积日志（含步骤 7 旧崩溃 1 条 ERROR），新进程 0 ERROR；logrotate 为既有运维建议项，不在本批次范围。
