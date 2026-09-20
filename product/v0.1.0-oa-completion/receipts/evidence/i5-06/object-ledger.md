# I5 iteration-06 对象账本（提示 04 剩余账本）

> atomic_id=ALL
> captured_at=2026-09-14T02:30:00+08:00
> server_sha=4d98b6710f6d3e5ba9ad4bdef4e59afc191dc889（HEAD；工作树在 iteration-05 最终 db8b2555 之上追加本轮改动，终态以本轮回读为准）
> web_sha=5788ead33c4347214a350d124331237e85068bdf（零修改）
> 环境=与 iteration-05 同构：Windows 11、真实 PostgreSQL（zonky 二进制 initdb scram @5433 + BootTest 内嵌实例）、真实 Redis 6379、fat jar 独立 prod 进程、dev 固定验证码 1234（Owner 指令）；哨兵映射仍仅存 temp

## 固定对象

| 领域 | 固定身份 | 原子项 |
|---|---|---|
| G3b2 矩阵 | WECOM/FEISHU/DINGTALK × (enabled+有效测试配置 正向；missing=空密文；placeholder=占位密文)；同一 prod profile、真实 PG、最终 jar；每负向进程只改目标 Provider 一个失败条件 | G3b2 |
| G6a1 session | tenant 0/user 1、tenant 100/user 9001、同 (WECOM, subject digest)；真实 Redis 键 `sw:security:login-user:{1,9001}` 与全局会话键计数，与并发批次同时间窗 | G6a1 |
| G6b1 生命周期 | tenant 100、user 9502（新隔离对象，旧 9501 已随 iteration-05 测试 JVM 销毁；旧→新登记）、WECOM 绑定、受控票据、真实 Redis 会话行 | G6b1 |
| G8 | 官方测试应用/HTTPS 回调域/可控身份（未提供，PENDING） | G8 |

## 独立证据文件

- `g3b2-provider-matrix.raw`（1 全启用正向 + 6 负向进程：命令摘要/exit/首因/health/逐 Provider enabled 回读/原值零命中）
- `g6a1-session-zero.raw`（并发批次同窗 session/cache before/after 零增量）
- `g6b1-expire-unbind.raw`（过期租户段 + 解绑既有会话权威装载收敛段；引用 iteration-05 已锁定子链）
- `g9-fingerprint.raw`（候选指纹、受影响回归、manifest/verify）

## 实现改动（提示 04 允许的"绑定/会话路径"确证缺陷修复）

解绑后原会话权威装载拒绝在 iteration-05 候选中不存在（权威装载仅查用户状态+租户有效性）→ 按方向 §3.2「第三方解绑触发与风险相称的会话撤销」实现：

1. `sw-security/LoginUserCacheService`：+`markSsoRevoked`/`isSsoRevoked`（键 `sw:security:sso-revoked:{userId}`，TTL=access 过期秒——覆盖旧 access token 剩余寿命）
2. `sw-security/LoginUserLoader`：缓存未命中路径先查撤销标记，命中即拒绝且不回写缓存
3. `system-biz/SsoAuthService.unbind`：UNBOUND+审计后 `evict + markSsoRevoked + refreshTokenService.revokeAllForUser`（方法转公开）
4. 语义：解绑即撤销该用户当前会话（本设计每用户单会话键）；撤销窗口=access 剩余寿命，窗口后旧 token 必然已过期，新登录不受影响

## 禁止重验

审查 05 已锁定 G1/G2/G3b1/G4/G5 本地受控边界/G7/G9 及 G6a1/G6b1 已通过子断言；本轮仅补三缺口 + 相称回归（SsoAuthServiceTest、system-biz 模块、两个 BootTest 自身）。
