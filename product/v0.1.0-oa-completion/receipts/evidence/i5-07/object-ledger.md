# I5 iteration-07 对象账本（提示 05 剩余账本：G6c1 + G8）

> atomic_id=ALL
> captured_at=2026-09-14T08:15:00+08:00
> server_sha=4d98b6710f6d3e5ba9ad4bdef4e59afc191dc889（HEAD；最终工作树 6ec847a6f6505d0fa271cf45f3d77a26816d0a4f）
> web_sha=5788ead33c4347214a350d124331237e85068bdf（零修改）
> 环境=Windows 11；I5SsoBindingSessionBootTest（RANDOM_PORT 真实 HTTP + 独立 H2 + 真实 Redis 6379）；dev profile + ch.dev.test-mock=true（第一方登录固定验证码 1234，Owner 指令）；哨兵映射仍仅存 temp

## 固定对象（G6c1 A/B 代际）

| 维度 | 固定身份 |
|---|---|
| 用户/租户 | user 9503（新隔离对象；9501→iteration-05、9502→iteration-06，均随其测试 JVM 销毁）、tenant 100 |
| 绑定 | id=90013 (WECOM, tenant 100, user 9503, ACTIVE)；解绑后 UNBOUND |
| A | 同 user 第一方登录建立（/login challenge+RSA-OAEP-SHA256+captcha 1234）；token 摘要 digestA（仅前 12 hex 入证据） |
| B | 解绑后同 user 第一方登录建立（跨秒等待 1.1s——JWT 无 jti、iat 秒级，同秒会产出逐字节相同 token，作为已知边界登记）；token 摘要 digestB |
| 撤销标记 | `sw:security:token-revoked:{sha256(token)}`（TTL=access 过期秒） |
| 顺序 | 建立 A → 解绑 → A 拒绝 → 第一方登录 B → B 成功 → A 再拒绝 → 清 B 缓存 → B 权威装载成功 → A 终局拒绝（无替换、无倒置） |

## 独立证据文件

- `g6c1-generation-isolation.raw`（A/B 全序列 + 每步 HTTP/Redis 回读）
- `g6c1-boot.raw.log`（BootTest 完整原始控制台流，含三个测试）
- `g9-fingerprint.raw` + `g9-manifest.sha256` / `g9-verify.stdout|stderr|exit`

## 实现改动（提示 05 允许：session/token/cache/refresh/解绑路径）

验收 06 指出的 userId 级撤销标记缺陷成立：标记仅缓存未命中时检查 → 旧 token 可借新会话缓存复活、新登录可被同一标记误伤。修复为 **token 摘要维度**：

1. `LoginUserCacheService`：`markSsoRevoked/isSsoRevoked`（userId 级）→ `markTokenRevoked/isTokenRevoked`（`sw:security:token-revoked:{sha256(token)}`）
2. `LoginUserLoader`：回退 userId 级未命中检查（撤销检查移至过滤器 token 维度）
3. `JwtAuthenticationFilter`：JWT 校验后、装载前检查 `isTokenRevoked(token)`——被撤销 token 即使与其他会话共享 userId 缓存也不得复活
4. `SsoAuthService.unbind`：新增 `unbind(provider, userId, currentToken)` 重载，撤销绑定行后 evict + 按当前 token 摘要标记 + 撤全部既有 refresh token（旧两参签名保留委托）
5. `SsoAuthController.unbind`：经 `@RequestHeader Authorization` 取当前 token 传入服务
6. `AuthFlowIntegrationTest`：过滤器 Bean 装配适配新参数
