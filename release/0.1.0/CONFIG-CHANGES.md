# 0.1.0 配置变化清单

## 启动期必需（fail-fast，0.1.0 起）

| 环境变量 | 说明 |
|---|---|
| `JWT_SECRET` | JWT 签名密钥；生产缺失或含 `CHANGE-ME` 占位值时启动即失败（`SecurityAutoConfiguration.jwtSecretPresenceCheck`） |
| `SW_SSO_CIPHER_KEY` | SSO 主体凭据加密密钥；生产缺失时启动即失败（`SystemAutoConfiguration.ssoCipher`），明文凭据不允许落库 |

两者一律经环境变量/秘密管理注入（如 `server.env`，mode 600），不落配置文件。

## 新增配置（全部可选；不配置时对应渠道保持禁用，默认禁用不算已交付）

### 系统级渠道（`sw.notify.channels.*`，秘密一律经环境变量注入）

| 键 | 说明 |
|---|---|
| `sw.notify.channels.<CHANNEL>.enabled` | 渠道系统级开关；启用后启动期 fail-fast 校验必需键 |
| `EMAIL.host/port/starttls/from/username/password` | SMTP；password 须 `${EMAIL_PASSWORD}` 等环境变量 |
| `FEISHU.app-id/feishu-app-secret/api-base` | 飞书自建应用（I5 SSO 凭据语义不用于通知） |
| `DINGTALK.app-key/app-secret/agent-id` | 钉钉应用 |
| `WECHAT_WORK.corp-id/corp-secret/agent-id` | 企业微信自建应用 |
| `SMS.provider/endpoint/sign-name/template-code/access-key/access-secret` | 通用短信契约；Provider 选型 Owner 裁决 |

### 数据库

- 无新增数据源配置；I6 表由 Flyway V89/V90/V91/V92/V93（`db/migration/notify/{h2,postgresql}` 与 `db/migration/{h2,postgresql}`）管理。
- V91 新增通知 Provider 主体绑定的租户隔离存储；主体密文只经运行时密钥加密，响应仅返回摘要。
- V92/V93 将通知启用标志统一为数据库布尔语义（V92 覆盖模板列，V93 收口规则/订阅/渠道配置列并兜底模板列），保留旧库既有值。

### 日志

- `application-prod.yml`：`mybatis-plus.configuration.log-impl` 覆盖为 `NoLoggingImpl`（生产不再输出全量 SQL 与参数）；`org.apache.ibatis: info`、`com.baomidou.mybatisplus: info`。

### 权限种子（自动随 V90）

- 新增权限：`notify:rule:view`、`notify:rule:manage`、`notify:channel:view`、`notify:channel:manage`、`notify:record:detail`、`notify:preference`；管理员角色需授予后页面按菜单动态可达。

## 不变项

- `sw.notify.enabled=true` 语义不变（模块装配开关）。
- 既有 `sw_notify_*` 表结构增量兼容（V48 渠道列/幂等列不变）。
