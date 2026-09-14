# i5-08 对象账本（G6c1a）

> 执行轮：iteration-08；执行入口：`planning-execution-prompt-stage-i5-tenant-safe-sso-06.md`
> 原则：只记录不可逆摘要与可判定事实；完整 token/refresh/秘密不落盘。

| 原子 ID | 对象 | 身份/位置 | 本轮状态 |
|---|---|---|---|
| G6c1a | 用户 | sys_user id=9504，username=i5g6c1auser，tenant 100 | 新建（9501—9503 属历史轮，旧→新登记） |
| G6c1a | 绑定 | sys_sso_user_binding id=90014，WECOM，external_digest=`8f7e…`（首字符 '8' 与 90012 区分） | ACTIVE → unbind → UNBOUND（重试轮内曾 ACTIVE→UNBOUND 循环再武装） |
| G6c1a | 会话 A | 第一方登录 access token（digestA 前缀 `263c14c545df`，iat=1789346459） | unbind 撤销；marker(digestA)=true；me/refresh 全程拒绝 |
| G6c1a | 会话 B | 第一方登录 access token（digestB 前缀 `4c001b8abbb4`，iat=1789346459，与 A 同秒） | me 200、refresh 200（cookie 轮换）、清缓存权威装载 200；marker(digestB)=false |
| G6c1a | JWT claim | jti（UUID v4，随机） | 本轮新增；证据仅记录存在性/差异性/摘要，不落明文 |
| G9 | 候选 | sw-bootstrap fat jar（2026-09-14 08:44 构建）；工作树指纹 `30fd54b2a7ddab4addeb9e30cbe0a2fae9ee7b91` | G6c1a 序列与回归采于 jar 重建之后 |
| G9 | manifest | g9-manifest.sha256（输入去重，6 项） | sha256sum -c exit=0 |
| G8 | 外部依赖 | 三 Provider 官方测试应用 / HTTPS 回调白名单域 / 可控测试身份 | 未提供，保持 PENDING |

## 证据文件

- `g6c1a-defect-repro.raw` — 修复前反证：同秒两次登录 iat 相同、digest 逐字节相同（`74e53782…`==`74e53782…`），jti 唯一性断言失败。
- `g6c1a-generation-isolation.raw` — 修复后同秒完整序列原始流（attempt 2 取得同秒代际）。
- `g6c1a-boot.log` — `I5SsoBindingSessionBootTest` 全类 4/4 原始控制台流（最终候选后重取）。
- `g6c1a-regression.log` — sw-security 17/0/0/0 + system-biz 295/0/0/0（含 SsoAuthServiceTest 22/22）原始输出。
- `package.log` — fat jar 重建输出（-q 无正文，exit 0）。
- `g9-fingerprint.raw` / `g9-manifest.sha256` / `g9-verify.*` — 候选指纹与清单校验。

## 路径转录差异说明

无。本轮账本文件名与实际附件一一对应。
