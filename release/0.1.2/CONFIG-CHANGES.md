# CH-aPaaS 0.1.2 配置变化说明

- 候选提交：Server `fd704ff12af3ccd99febaa700c523d7688e91509`、Web `5368e6c656c095acd3fe2cff1875c27ee5672307`

## 结论

**无新增/变更运行时配置项。** 0.1.2 相对 0.1.0 未引入新的环境变量、配置文件结构或 profile 要求。

## 相关身份与文案变化（非配置）

- Web `package.json` 版本 `0.1.0` → `0.1.2`（发布提交 `5368e6c`）。
- Server 开发默认 Maven 版本为 `0.1.2-SNAPSHOT`（工程版本身份）；正式生产构建经 `scripts/build-prod.sh` 以 `-Drevision=0.1.2` 产出，制品标记 `build.version=0.1.2`（CI 制品门禁校验）。
- i18n 新增菜单管理与主题规则相关文案键（zh_CN / en_US 各 2 条），无键删除。
- V95/V97 菜单迁移自动更新既有菜单记录（更名/归位/路径），无需手工配置调整。
