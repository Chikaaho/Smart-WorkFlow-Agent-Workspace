# T020 缓存会话的实时租户准入

2026-10-23｜Executor｜XL｜IN_PROGRESS

七阶段：需求评估完成；分支实施进行中；验收同步、合并、发布、发布后同步、结束未开始。本回执承接 `t020-management-target-03.md` 的 A08 缓存红基线，后台认领及启停审计继续实施。

## 原因与修改

登录用户 Redis 缓存命中时，LoginUserLoader 原先直接返回旧身份，跳过 UserDetailsProviderImpl 的租户有效性检查。01 真实栈已证明：普通甲登录并预热缓存，超管停用甲，原 token 的新 /auth/me 仍返回 code 0。

现在缓存命中也调用下层 UserDetailsProvider 的准入契约；生产实现实时查询 TenantValidityService，拒绝不存在、停用、过期或缺少归属的租户。拒绝即驱逐缓存并在当前请求返回未认证，不等缓存 TTL。数据库或装配故障继续抛出基础设施异常，不按有效身份放行。未命中仍沿原权威身份装载；重新启用后按原规则恢复访问。

SPI 提供兼容默认实现，权威重载并核对用户和租户；完整生产装配覆盖为只查当前租户状态/有效期，保留完整角色权限缓存。security 不依赖 system 实现；保留租户 0 也读取权威租户行。没有更换 JWT、密码、缓存 key、TTL 或认证流程。

## 已取得验证

`tenant-session-admission`：缓存准入测试 5、装配回归 6、正常认证集成 11、身份范围 14、租户有效性 6、实际 H2/隔离 PG 新增 2，均零失败、零错误、零跳过，BUILD SUCCESS。数据库用例保持同一缓存身份，依次验证启用、停用、过期、重新有效、逻辑删除及空归属，操作者保持租户 0，既有用户数量不变。

完整 `tenant-session-system-final`：common 36、security 22、system 376，均零失败、零错误、零跳过，BUILD SUCCESS。原文及结果在 `C:/Users/hjxch/.codex/evidence-020/tenant-identity/tenant-session-*.log` 和对应 `-result.txt`。MAVEN_OPTS=-Xmx2g，前后端重任务串行。

## 真实认证与可见会话

`C:/Users/hjxch/.codex/evidence-020/tenant-target/real-browser-03/`，URL `http://127.0.0.1:59478`，实际 Java/H2、自有 Redis 与正式 Web dist。`http-cache-green-result.json` 为 passed：同一普通 accessToken 先预热，再停用自有甲租户，首个新 /auth/me 返回 401；用户写入也拒绝且人数零增量；停用期间新 RSA 登录拒绝；乙会话和超管管理保持有效。恢复甲后原 token 回到原租户，用户数量不变。完整路径、HTTP/业务码及请求标识在 `http-cache-green-trace.json`，没有保存密码或 token。首次验证脚本误把 me.user.tenantId 当作顶层字段，停用前即报错；原文留在 `before-me-user-path-*`，修正脚本字段路径后重跑，不构成产品失败。

FORMAL_BROWSER、headless=false、原生 1366×768：普通甲以编码 `t23a287bda2` 正常 RSA 登录，进入用户页显示甲 `2113303586766106625`、共 1 人；超管通过正常管理 API 停用该夹具后，点击真实页面“查询”，请求 `web-f558b3cd-7a82-46b9-941a-6b05bec2c98f` HTTP 401，自动刷新未恢复身份，页面转 `/login?redirect=/system/user`。重新启用后正常登录回原用户页，仍为甲和 1 人，查询 `web-8c51c7a9-7a70-45b0-bae8-4a1a51facdb9` HTTP 200。截图为 `cache-before-disable-1366.png`、`cache-after-disable-login-1366.png`、`cache-after-reenable-1366.png`；网络索引 `http-index.jsonl`。此处固定验证码仅来自现有 dev fixture，调试认证关闭。

验证后甲已恢复启用，自有 Java/Redis 通过控制端点清理，控制进程 exit 0。用户 Redis 服务未动。该链证明缓存身份停用收敛和恢复，不承担后台认领与整版视觉结论。

## 提交

Server `de91fe2b69bc3bf16c34585117305ddbf62ef74a`，6 文件、145 insertions / 14 deletions，已普通推送任务分支。修改 LoginUserLoader、UserDetailsProvider SPI、System 实现和有效性文档，新增缓存准入测试，并在既有数据库验证类增加 H2/PG 准入用例。Web 沿用 `dd29316`，本次未修改。

## 后续边界

缓存准入不代替异步持久认领边界的校验。BPM 命令、任务时限、IoT 预约/补偿、通知与回调的未开始工作仍须逐入口实施；已经持久认领的单次执行须有界完成并记录真实结果。停用/过期/重新启用审计、恢复不补发过期预约和不重复副作用仍待完整自验。A08、T020 及整版均未验收完成，A03 整体未通过。
