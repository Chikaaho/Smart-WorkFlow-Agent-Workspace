# 0.1.3 配置变化

## `SW_SSO_CIPHER_KEY` 契约收紧（必须处理）

0.1.3 的 SSO 主体凭据加密（`SsoCredentialCipher`，sso-admin-config 批次引入）要求密钥为 Base64 编码的 **16/24/32 字节** AES 密钥；解码后超过 32 字节时启动期 fail-fast（`AES cipher key too long: N bytes, maximum 32`）。

- 0.1.2 及之前的部署允许 48 字节（64 字符 Base64）值；UAT 原 `server.env` 即为 48 字节，0.1.3 首次启动被拒（2026-09-30 01:42，唯一启动失败，随即处置）。
- **处置**：UAT 已在服务器本地生成新的 32 字节随机密钥写入 `server.env`（运行时回读 32 字节确认；值不落任何文档/日志）。`server.env` 备份为 `server.env.bak-pre013`。
- **兼容性影响**：密钥轮换使旧密文不可解。UAT 已随本次发版删库重建，SSO Provider 配置与 B 端绑定均为空（管理后台 Credential 显示 Not set），无存量密文，故无数据损失；钉钉/飞书凭据需通过管理后台重新录入（或既有 R1 受控通道）。**若任何 ≤0.1.2 存量库以旧 48 字节密钥存有 SSO 密文，升级 0.1.3 前必须先规划密钥迁移。**

## 其他

- 无新增环境变量；`PG_*`、`SW_CIPHER_KEY`、`JWT_SECRET`、`SW_LOGIN_RSA_PRIVATE_KEY`、`SW_LOGIN_DIGEST_SECRET`、`SPRING_PROFILES_ACTIVE`、`OPENAI_API_KEY` 契约不变。
- Flyway 配置不变（`baseline-on-migrate: true`、`validate-on-migrate: true`、locations 不变；模块迁移目录现为空，属预期）。
- 制品门禁 `scripts/check-prod-artifact.sh` 生产迁移正向清单正则扩展为兼容点分版本号（`V0.1.0`），阈值 `≥1` 不变。
