# S1 · 时间线（2026-09-02，全部为真实后端/真实浏览器行为）

| # | 时刻(约) | 动作 | 结果 |
|---|---|---|---|
| 1 | 10:29 | admin 登录（challenge→读图验证码→RSA-OAEP→/auth/login） | token 签发 |
| 2 | 10:29 | admin 创建表单→存 definition→发布 | `b2b2cbdc…` PUBLISHED V=2，快照 1 条 |
| 3 | 10:29 | admin 创建角色 `S1无查看权限角色`（仅菜单 23）与用户 `s1limited` 并启用 | ROLE/USER 落库 |
| 4 | 10:31 | s1limited 登录（同一真实登录链） | token 签发 |
| 5 | 10:32 | s1limited 直接 GET 身份/definition/snapshots/page | 四类全部 HTTP 200 + code 403「无权限」 |
| 6 | 10:33 | admin 同四类读取 | 全部 code 0（身份 200、definition 107 字节、snapshots 1 条 V2、列表 total=1 含目标） |
| 7 | 10:35 | 零泄露扫描（仅响应体） | containsFormId/Name/Field/SnapshotVersion 全 false |
| 8 | 10:47 | s1limited 真实浏览器登录并深链 `/form/designer/b2b2cbdc…` | 拒绝页「无权访问该表单 / 无权限 / 返回表单列表」；`.designer__workbench`、`.designer__body` 不存在，页面按钮仅「返回表单列表」 |
| 9 | 10:49 | 截图 `deeplink-403-rejected-panel.png` | 左侧菜单仅「流程引擎」（菜单 23），无任何工作台操作入口 |
| 10 | 11:22 | 取证中发现：租户 2 用户 `t2user` 登录返回 2104「密码错误」 | 实为登录链 sys_user 查询被租户拦截器过滤——租户隔离在认证上游生效（附加证据） |
| 11 | 11:35 | 经 H2 console 克隆 tenant_id=1 表单行（def/config/snapshot） | `aaaa0000…` PUBLISHED |
| 12 | 11:38 | 租户 0 已认证主体（admin）直接读取租户 1 对象 | 身份/快照 code 1000「表单不存在」、definition code 1300「表单配置未找到」、列表 total=1 且不含克隆对象；泄露扫描全 false |

证据文件：`requests.json`（#5-7 与 #11-12 原始请求/响应）、`deeplink-403-rejected-panel.png`（#8-9）、`before-after.json`（页面 DOM 前后与关键值）。
