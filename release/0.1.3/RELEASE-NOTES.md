# CH-aPaaS 0.1.3 Release Notes（2026-09-30）

发布身份：Server tag/Release `0.1.3` → main `8e23a2d373bc42bc3abdc86c584f011660edb896`；Web tag/Release `0.1.3` → main `e3ae316bd60bb61bc1aae28df134534ece8eeea4`。两仓 develop 普通快进合并至 main 并推送；CI：Server run `36603608187` success、Web run `36602576798` success。

## 内容

- **三方 SSO 真实接入（钉钉/飞书）**：共用回调、企业归属约束、个人/组织模式、真实授权链已验收（`product/dingtalk-sso/`，规划审查 07 PASSED）。
- **后台 SSO 配置管理与 B 端手机号准入**：`SsoConfig` 管理页（Provider 凭据、启停、回调只读、审计）、准入链与租户隔离（`product/sso-admin-config/`，规划已确认 2026-09-29）。
- **Flyway 种子合并（本版最大变更）**：versioned 迁移 V1—V104（208 文件）按版本序逐字节合并为单一基线 `V0.1.0__baseline_seed.sql`（PG/H2 各一份），加 `R__i6_notify_menu_reconciliation` 可重复对账。全新建库终态与原链逐字段等价（归一化 sha256 双向一致：PG `ec5b532e…`、H2 `c5c6bf63…`；证据 `product/v0.1.3-release/receipts/evidence/seed-squash-01/`）。
- **版本身份**：两仓投影 0.1.3（Server `<revision>0.1.3-SNAPSHOT</revision>` 开发默认 + `-Drevision=0.1.3` 正式构建；Web package.json 0.1.3）。

## 边界

- **0.1.3 起仅支持全新建库**：不支持从 ≤0.1.2 库原地升级（历史链已移除，validate-on-migrate 将因缺失已应用迁移显式失败）。升级路径见 `UPGRADE.md`。
- 企业微信接入保持 Owner 延期（P31 开放）；外部通知五渠道与腾讯 IoT 实网验证保持既有延期边界。
- UAT（chikaho.cn 单机）已按 Owner 指令删库重建上线 0.1.3（部署回执 `product/v0.1.3-release/receipts/deployment-20260930.md`）。
