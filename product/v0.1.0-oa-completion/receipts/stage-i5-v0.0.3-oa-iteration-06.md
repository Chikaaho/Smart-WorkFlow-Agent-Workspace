# P60 I5 租户安全收口与第三方 SSO —— 阶段实现回执 06

> 执行角色：执行（Executor）
> 日期：2026-09-14
> 方向：`../ready/direction-stage-i5-tenant-safe-third-party-sso.md`（XL）
> 当前执行入口：`planning-execution-prompt-stage-i5-tenant-safe-sso-04.md`
> 验收依据：`planning-review-stage-i5-v0.0.3-oa-iteration-05.md`（部分通过；三项可执行缺口 + G8）
> 回执状态：**自验提交，待规划验收**（`VERIFYING / EXECUTION_SUBMITTED`）
> Server HEAD：`4d98b6710f6d3e5ba9ad4bdef4e59afc191dc889`；iteration-06 最终工作树 `456b60f5bccc4dbc3706214a3829d32fc5fd2e96`（未提交、未推送）
> Web HEAD：`5788ead33c4347214a350d124331237e85068bdf`（零修改）

## 0. 本轮结论

按提示 04 只处理三项可执行缺口，全部闭合；G8 保持 PENDING。已锁定项未重验（除解绑实现触及绑定/会话路径后的相称回归）。证据目录 `evidence/i5-06/`，manifest 11 项 verify exit=0。

## 1. 三项缺口闭合

| 原子 | 补证 | 关键结果 |
|---|---|---|
| G3b2 | [g3b2-provider-matrix.raw](evidence/i5-06/g3b2-provider-matrix.raw) | 正向：三 Provider enabled=1+有效非秘密测试配置的同一 prod 进程启动成功（health 200），逐 Provider 回读 enabled=1（DINGTALK=1/FEISHU=1/WECOM=1，提示允许的单进程替代）。负向 6 格：WECOM/FEISHU/DINGTALK × missing/placeholder 各自独立进程 exit=1，首因均为 Provider 配置门；7 份日志配置原值零命中 |
| G6a1 | [g6a1-session-zero.raw](evidence/i5-06/g6a1-session-zero.raw) | 与并发批次同时间窗的真实 Redis 回读：before keys=0(user1=false,user9001=false) → after keys=0、addedKeys=[]——bind 成功侧/失败侧均零会话产生；并发/绑定/role/DENIED 审计底证复现成立 |
| G6b1 | [g6b1-expire-unbind.raw](evidence/i5-06/g6b1-expire-unbind.raw) | 过期租户段：新票据 401、refresh 401「所属租户不可用，会话已终止」、缓存剔除后权威装载 401 且会话行不重建；解绑段：真实 HTTP unbind 200 → 既有会话权威装载 401「未认证」、会话行清理、撤销标记写入、refresh 401「全部会话已失效」、role 零增量（iteration-05 的票据一次性/停用租户/解绑视图子链引用保留） |

## 2. 实现改动（确证缺陷所需的绑定/会话路径）

**缺陷**：iteration-05 候选解绑不触发任何会话撤销（权威装载仅查用户状态+租户有效性），不满足方向 §3.2「第三方解绑触发与风险相称的会话撤销」。

| 文件 | 摘要 |
|---|---|
| `sw-security/cache/LoginUserCacheService.java` | +`markSsoRevoked`/`isSsoRevoked`（键 `sw:security:sso-revoked:{userId}`，TTL=access 过期秒——覆盖旧 token 剩余寿命，窗口后旧 token 必然自然过期，新登录不受影响） |
| `sw-security/cache/LoginUserLoader.java` | 缓存未命中路径先查撤销标记：命中即拒绝且不回写缓存 |
| `system-biz/sso/SsoAuthService.java` | unbind 在 UNBOUND+审计后：evict 登录缓存 + 写撤销标记 + 撤全部 refresh token |
| `system-biz/service/RefreshTokenService.java` | +`revokeAllForUserPublic` 公开撤销入口 |
| `system-biz/config/SystemAutoConfiguration.java` | 装配两个新依赖（均 required=false，隔离测试构造不受影响） |
| `I5PgTenantBehaviorBootTest.java` / `I5SsoBindingSessionBootTest.java` | G6a1 session 回读；G6b1 过期+解绑收敛两段（新隔离对象 9502/90012，旧→新登记） |

## 3. 实际命令与结果

- BootTests：`I5PgTenantBehaviorBootTest` 3/3、`I5SsoBindingSessionBootTest` 2/2（原始输出见各 .raw observed）
- 相称回归：`SsoAuthServiceTest` 22/22；system-biz 模块 295/0/0/0 BUILD SUCCESS（LoginUserLoader 触及认证链）
- G3b2 矩阵：8 个独立 prod 进程（1 正向 + 6 负向；另 v1 首轮正向被空密文正确拒绝，不计入）于真实 PG 17.5（zonky initdb scram @5433，PG 链 v87），fat jar=05:43:51 构建（含解绑撤销实现）
- manifest：`evidence/i5-06/g9-manifest.sha256` 11 项 verify exit=0

## 4. 与提示 04 的偏差

- G3b2 正向按提示允许采用「全启用有效配置」单进程 + 逐 Provider enabled 回读，替代三个正向进程。
- v1 矩阵脚本因 node 路径解析失败导致 placeholder 三格退化为 empty 复测（该轮不计）；v2 值文件传递后九格成立——过程已在 .raw 中如实登记。

## 5. 禁止重验与锁定

审查 05 锁定的 G1/G2/G3b1/G4/G5 本地受控边界/G7/G9 与 G6a1/G6b1 已通过子断言未重跑；解绑实现触及绑定/会话路径后的相称回归仅上述四项。#8 永久锁定维持。

## 6. 未完成

G8 三 Provider 真实官方成功链：官方测试应用、HTTPS 回调域、可控测试身份仍未提供，保持 PENDING / dependency_satisfied=false，未以受控失败链冒充。

## 7. 自验结论

提示 04 §7 提交门禁逐项为是：G3b2 正向+六负向均有真实进程结果；G6a1 session before/after 与并发对象同窗关联且零增量；G6b1 过期租户与解绑既有会话均在权威装载拒绝并清理；新实现已过相称回归且候选指纹一致；G8 如实 PENDING；ENGINE_TERMINAL 与剩余账本一致。提交 `VERIFYING / EXECUTION_SUBMITTED`，等待规划验收 06。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/v0.1.0-oa-completion/receipts/stage-i5-v0.0.3-oa-iteration-06.md","evidence":["product/v0.1.0-oa-completion/receipts/evidence/i5-06/object-ledger.md","product/v0.1.0-oa-completion/receipts/evidence/i5-06/g3b2-provider-matrix.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-06/g6a1-session-zero.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-06/g6b1-expire-unbind.raw","product/v0.1.0-oa-completion/receipts/evidence/i5-06/g9-fingerprint.raw"],"feature_status":"VERIFYING","work_items":[{"id":"G3b2","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G6a1","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G6b1","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G8","status":"PENDING","authorized":true,"dependency_satisfied":false,"actionable":false,"next_action":"等待 Owner/环境提供三 Provider 官方测试应用、HTTPS 回调白名单域与可控测试身份后补真实成功链"},{"id":"G9","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"提交规划验收 06：Planner 复核 G3b2 九格矩阵、G6a1 session 零增量、G6b1 过期/解绑收敛与解绑会话撤销实现","next_action_type":"WAIT_PLANNER","progress_fingerprint":"456b60f5bccc4dbc3706214a3829d32fc5fd2e96","progress_basis":{"files_changed":["Smart-WorkFlow-aPaaS-server: LoginUserCacheService.java","Smart-WorkFlow-aPaaS-server: LoginUserLoader.java","Smart-WorkFlow-aPaaS-server: SsoAuthService.java","Smart-WorkFlow-aPaaS-server: RefreshTokenService.java","Smart-WorkFlow-aPaaS-server: SystemAutoConfiguration.java","Smart-WorkFlow-aPaaS-server: I5PgTenantBehaviorBootTest.java","Smart-WorkFlow-aPaaS-server: I5SsoBindingSessionBootTest.java"],"tool_actions":["G3b2 八个独立 prod 进程（真实 PG 17.5 + fat jar）","BootTest 真实 HTTP/H2/Redis 时间序列采集","相称回归：SsoAuthServiceTest 22/22 + system-biz 295/0/0/0 + 两 BootTest 5/5","git write-tree 指纹 + sha256sum manifest verify"],"new_evidence":["evidence/i5-06/ 三缺口证据包 + 8 份进程原始日志 + manifest/verify"],"closed_work_items":["G3b2","G6a1","G6b1","G9"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"bash(mvn)","outcome":"SUCCEEDED","detail":"SsoAuthServiceTest 22/22；system-biz 295/0/0/0 BUILD SUCCESS；两个 BootTest 5/5"},{"tool":"bash(g3b2-matrix)","outcome":"SUCCEEDED","detail":"正向进程 health 200 + 逐 Provider enabled=1 回读；六个负向进程各自 exit=1 首因=Provider 配置门；日志原值零命中"},{"tool":"node(BootTest http/redis)","outcome":"SUCCEEDED","detail":"G6a1 并发同窗 session 前后回读零增量；G6b1 过期租户与解绑收敛时间序列（票据/refresh/权威装载 401 + 会话清理）"},{"tool":"external-providers","outcome":"UNAVAILABLE","detail":"G8 官方测试应用/HTTPS 回调域/可控测试身份未提供，保持 PENDING"}],"browser_status":"NOT_APPLICABLE"}
