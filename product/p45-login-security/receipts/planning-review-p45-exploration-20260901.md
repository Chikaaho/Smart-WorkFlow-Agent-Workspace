# P45 登录安全探索回执规划验收

> 角色：规划
> 日期：2026-09-01
> 审查对象：`search_fallback/p45-login-security-current-seams.md`、`search_fallback/p45-login-state-direct-cause-supplement.md`

## 结论

`PASSED`。首轮探索中关于 RSA、验证码、Token/Cookie 与认证接缝的文件事实可信；补充探索已消除“access token 仅内存”与“冷启动 refresh 恢复”之间的逻辑矛盾，并如实说明静态证据不能脱离真实部署行为唯一判定生产断点。现有信息足以形成正式需求方向。

本结论只表示探索回执通过，不表示 P45 已实现或功能验收通过。

## 已锁定事实

1. 当前已有 access/refresh 双 Token 底座：access token 返回前端并仅存内存，refresh token 使用 HttpOnly `rt` Cookie，具备轮换与重放撤销。
2. 前端已有冷启动 `refresh()`、access 回填、session/menu 装配和动态路由恢复入口；因此 access token 不落 Cookie 本身不是缺陷。
3. Cookie 当前固定 `Path=/api/auth/`；生产公开 API 前缀为 `/sw-server/api` 时存在 Path 不匹配候选。跨源部署还缺少 credentials/CORS 支持，但当前仓库无法证明实际网关是否保留前缀。
4. 页面刷新回登录页的真实断点必须在执行阶段通过 `Set-Cookie → 浏览器存储 → refresh 请求携带 → refresh 响应 → access 回填 → session/menu → 路由放行` 行为链确认，不能以静态推测替代。
5. 后端 RSA、验证码、客户端时间、登录限流/自动锁定均无可运行实现；验证码与锁定 SPI 只是空壳。
6. Redis 是现有跨实例共享接缝；本地内存不适合作为一次性登录挑战的权威存储。

## 规划裁决

- 保留双 Token 职责：access token 继续只存内存并通过 Bearer 使用；refresh token 继续由 HttpOnly Cookie 承载。禁止把 access token 持久化到 Cookie、`localStorage` 或 `sessionStorage`。
- Owner 最新要求覆盖历史“刷新即重新登录”措辞：有效 refresh 凭证存在时，刷新页面必须恢复会话和原路由。
- 本轮修复 Cookie 对当前受支持部署路径的可达性、冷启动恢复和失败清理；不凭空开放跨源认证。
- 执行层必须先采集真实登录/刷新链行为证据，再根据第一个失败点实施修复；不得预设一定是 Cookie Path。

## 后续

正式方向：`product/p45-login-security/ready/direction-p45-login-security.md`。

