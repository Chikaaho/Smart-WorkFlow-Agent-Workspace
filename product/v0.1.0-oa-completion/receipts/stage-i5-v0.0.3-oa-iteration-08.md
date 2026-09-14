# P60 I5 租户安全收口与第三方 SSO —— 阶段实现回执 08

> 执行角色：执行（Executor）
> 日期：2026-09-14
> 方向：`../ready/direction-stage-i5-tenant-safe-third-party-sso.md`（XL）
> 当前执行入口：`planning-execution-prompt-stage-i5-tenant-safe-sso-06.md`
> 验收依据：`planning-review-stage-i5-v0.0.3-oa-iteration-07.md`（G6c1 子断言锁定；G6c1a 未通过）
> 回执状态：**自验提交，待规划验收**（`VERIFYING / EXECUTION_SUBMITTED`）
> Server HEAD：`4d98b6710f6d3e5ba9ad4bdef4e59afc191dc889`；iteration-08 最终工作树 `30fd54b2a7ddab4addeb9e30cbe0a2fae9ee7b91`（未提交、未推送）
> Web HEAD：`5788ead33c4347214a350d124331237e85068bdf`（零修改）

## 0. 本轮结论

提示 06 唯一剩余可执行缺口 G6c1a 闭合：无人为等待地在同一签发秒内为同一 user 建立两代不同 access token（iatA==iatB=1789346459、digestA=`263c14c545df`≠digestB=`4c001b8abbb4`）；解绑撤销 A 后立即第一方登录 B，B 的 me/refresh/清缓存权威重载全部成功且不被 A 的撤销摘要误伤，A 在全部检查点持续拒绝。修复前缺陷反证已保留（同秒两 token 逐字节相同）。G8 保持 PENDING；已锁定项未重验。

## 1. 缺陷反证（修复前，[evidence/i5-08/g6c1a-defect-repro.raw](evidence/i5-08/g6c1a-defect-repro.raw)）

在 iteration-07 候选（无 jti）上先行运行同秒序列：iatA==iatB 成立（同签发秒），`digestB != digestA` 断言失败——两个摘要完全相同（`74e53782e08d9dc3…`==`74e53782e08d9dc3…`），与审查 07 的 knownEdge 事实一致。反证文件随本轮证据包归档。

## 2. 实现改动（提示 06 允许路径：token 唯一性 + 直接验证资产）

| 文件 | 摘要 |
|---|---|
| `sw-security/jwt/JwtTokenProviderImpl.java` | `generateToken` 追加随机唯一 claim `.id(UUID.randomUUID().toString())`（jti）；类注释登记「同秒签发必须唯一 jti」硬约束；issue时间/解析/校验逻辑零变化 |
| `sw-bootstrap/.../i5/I5SsoBindingSessionBootTest.java` | 新增 G6c1a 同秒序列测试（user 9504、绑定 90014）：预取双 challenge 压缩 A/B 签发间隔、无 sleep、跨秒代际即时重试（本轮 attempt 2 取得同秒）； jwtClaims 仅解 payload 读 iat 记录证据 |
| `sw-basic-agent` 9 个测试 + `sw-basic-notify-biz` 1 个测试 | iteration-07 过滤器签名变更的遗留测试装配适配：`JwtAuthenticationFilter` 构造补第 4 参 `LoginUserCacheService` mock（`-am` 链 testCompile 曾因此失败）；行为断言零变化 |

`mvn -DskipTests package` 在最终证据采集前重建 fat jar（2026-09-14 08:44）；G6c1a 最终序列、BootTest 全类与回归均采于该候选之后。

## 3. G6c1a 同秒完整序列（[evidence/i5-08/g6c1a-generation-isolation.raw](evidence/i5-08/g6c1a-generation-isolation.raw)）

1. attempt 1 跨秒（iatA=1789346458/iatB=1789346459）→ 即时重试，无等待；attempt 2 取得同秒代际。
2. A（第一方登录，challenge+RSA-OAEP）→ unbind（真实 HTTP，Bearer A）→ 200；A me 401、marker(digestA)=true。
3. B 立即第一方登录（同签发秒 iat=1789346459）→ digest 不同（jti）；B me 200、refresh 200（cookie 轮换）。
4. A 借 B 的 userId 缓存尝试 me → 401（不复活）。
5. 清 B 缓存 → B 权威装载 me 200、B refresh 200。
6. A 终局 me 401；marker(digestA)=true、marker(digestB)=false；role 表零增量。

证据仅记录 iat、digest 前缀与 marker 键存在性；完整 token 未落盘。

## 4. 相称回归与候选（[evidence/i5-08/g6c1a-regression.log](evidence/i5-08/g6c1a-regression.log)、[g6c1a-boot.log](evidence/i5-08/g6c1a-boot.log)）

- 触及 JWT 签发 → `sw-security` 17/0/0/0；`sw-biz-system-biz` 295/0/0/0 BUILD SUCCESS（含 `SsoAuthServiceTest` 22/22、`RefreshTokenServiceTest` 12/12、`AuthFlowIntegrationTest`）；`I5SsoBindingSessionBootTest` 全类 4/4。
- 指纹：`6ec847a6`（iteration-07）→ **`30fd54b2`**（本轮，临时索引含未跟踪文件）；manifest 输入去重（6 项，每文件一次），`sha256sum -c` exit=0。

## 5. 与提示 06 提交门禁逐项自检

- A/B 同 user、同一签发秒、不同 digest，无 sleep/跨秒规避（跨秒代际即时重试制造同秒，非等待）✓
- B 的 access/refresh 与缓存权威重载均成功 ✓
- A 的 access/refresh 在所有检查点始终拒绝 ✓
- A 撤销标记与 B 身份不混淆，role/权限零新增 ✓
- 受影响认证回归通过，证据采于最终候选（08:44 jar）且指纹一致 ✓
- manifest 无重复项且 verify exit 0 ✓
- G8 未满足保持 PENDING，机器终态与账本一致 ✓

## 6. 偏差与风险

- 提示允许「可控时钟固定同一秒」；本轮未改生产时钟，而以「预取 challenge 压缩间隔 + 跨秒代际即时重试」制造同秒条件，属无等待制造，不依赖时序运气通过断言（iat 相等仍是硬断言）。
- 10 个 agent/notify 测试文件的构造器适配是 iteration-07 遗留的 testCompile 断链修复，未改动其行为断言；这些模块本轮未运行测试（提示禁止重跑无关模块），仅经 `-am` testCompile 验证可编译。
- G8 外部条件仍未提供；I5 保持 `VERIFYING`，Executor 未进入阶段三。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/v0.1.0-oa-completion/receipts/stage-i5-v0.0.3-oa-iteration-08.md","evidence":["product/v0.1.0-oa-completion/receipts/evidence/i5-08/object-ledger.md","product/v0.1.0-oa-completion/receipts/evidence/i5-08/g6c1a-defect-repro.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-08/g6c1a-generation-isolation.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-08/g6c1a-boot.log","product/v0.1.0-oa-completion/receipts/evidence/i5-08/g6c1a-regression.log","product/v0.1.0-oa-completion/receipts/evidence/i5-08/g9-fingerprint.raw"],"feature_status":"VERIFYING","work_items":[{"id":"G6c1a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G8","status":"PENDING","authorized":true,"dependency_satisfied":false,"actionable":false,"next_action":"等待 Owner/环境提供三 Provider 官方测试应用、HTTPS 回调白名单域与可控测试身份后补真实成功链"},{"id":"G9","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"提交规划验收 08：Planner 复核 G6c1a 同秒代际隔离序列与 jti 唯一性实现","next_action_type":"WAIT_PLANNER","progress_fingerprint":"30fd54b2a7ddab4addeb9e30cbe0a2fae9ee7b91","progress_basis":{"files_changed":["Smart-WorkFlow-aPaaS-server: JwtTokenProviderImpl.java","Smart-WorkFlow-aPaaS-server: I5SsoBindingSessionBootTest.java","Smart-WorkFlow-aPaaS-server: 9×agent 测试 + NotifyTemplateSecurityIntegrationTest（过滤器 4 参构造器适配）"],"tool_actions":["修复前同秒缺陷反证（digest 逐字节相同，g6c1a-defect-repro.raw）","G6c1a 同秒完整序列（真实 HTTP/Redis/refresh，attempt 2 取得 iatA==iatB、digestA≠digestB，A 三检查点拒绝、B 全链有效）","相称回归：sw-security 17/0/0/0 + system-biz 295/0/0/0（含 SsoAuthServiceTest 22/22）+ BootTest 4/4","fat jar 08:44 重建 + git write-tree 指纹 30fd54b2 + 去重 manifest sha256sum -c exit=0"],"new_evidence":["evidence/i5-08/ G6c1a 证据包（反证 + 同秒序列 + boot/regression 原始流 + 账本 + 指纹/manifest/verify）"],"closed_work_items":["G6c1a","G9"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"bash(mvn)","outcome":"SUCCEEDED","detail":"sw-security 17/0/0/0；system-biz 295/0/0/0 BUILD SUCCESS；I5SsoBindingSessionBootTest 4/4；package exit 0"},{"tool":"java(BootTest http+redis)","outcome":"SUCCEEDED","detail":"G6c1a 同秒序列：iatA==iatB=1789346459、digestA≠digestB、B me/refresh/权威重载成功、A 全程拒绝、marker(digestA)=true/marker(digestB)=false、role 零增量；修复前反证 digest 相同"},{"tool":"bash(sha256sum/git)","outcome":"SUCCEEDED","detail":"manifest 6 项去重，sha256sum -c exit=0；工作树指纹 30fd54b2a7ddab4addeb9e30cbe0a2fae9ee7b91"},{"tool":"external-providers","outcome":"UNAVAILABLE","detail":"G8 官方测试应用/HTTPS 回调域/可控测试身份未提供，保持 PENDING"}],"browser_status":"NOT_APPLICABLE"}
