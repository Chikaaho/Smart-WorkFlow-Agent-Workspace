# P60 I5 租户安全收口与第三方 SSO —— 阶段实现回执 04

> 执行角色：执行（Executor）
> 日期：2026-09-13
> 方向：`../ready/direction-stage-i5-tenant-safe-third-party-sso.md`（XL）
> 当前执行入口：`planning-execution-prompt-stage-i5-tenant-safe-sso-02.md`
> 回执状态：**自验提交，待规划验收**（`VERIFYING / EXECUTION_SUBMITTED`）
> Server HEAD：`4d98b6710f6d3e5ba9ad4bdef4e59afc191dc889`（本轮为未提交工作树变更，未推送）
> Web HEAD：`5788ead33c4347214a350d124331237e85068bdf`（本轮未修改）

## 0. 本轮结论

本轮针对 iteration-03 暴露的可直接修复缺陷完成了 Server 代码修复与定向回归；验证码按 Owner 指令在 dev/test 测试中直接使用 `1234`，没有等待用户或另寻绕过方式。没有修改历史回执、没有推送、没有写入真实凭据。

本回执不把未重跑的真实 HTTP、PostgreSQL、IoT、异步、浏览器和外部 Provider 成功链写成完成。G8 继续保持外部依赖待定；G9b 另如实登记既有 P45 Redis 隔离夹具的环境错误。

## 1. 实际修复

| 原子 | 修复 | 代码位置 |
|---|---|---|
| G2a1 | OpenAPI 签名通过后，先校验应用所属租户有效性，再写 nonce；失效租户返回 `TENANT_INVALID=3009`，nonce 不落库、不建立代理上下文。 | [OpenApiAuthService.java](../../../Smart-WorkFlow-aPaaS-server/sw-biz/sw-biz-openapi/sw-biz-openapi-biz/src/main/java/com/sw/ck/openapi/biz/service/OpenApiAuthService.java:85) |
| G3b2 | WECOM/FEISHU/DINGTALK 在 `enabled=true` 时拒绝缺失、空白和常见占位 appId/secret；`enabled=false` 不强制凭据；已有有效密文可在不改 secret 时保留。 | [SsoAuthService.java](../../../Smart-WorkFlow-aPaaS-server/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/sso/SsoAuthService.java:469) |
| G6a1 | 绑定并发命中数据库唯一键时转为明确业务拒绝并写 DENIED 冲突审计，避免竞争失败冒泡为 500，且不产生成功侧角色/会话副作用。 | [SsoAuthService.java](../../../Smart-WorkFlow-aPaaS-server/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/sso/SsoAuthService.java:404) |
| G6b1 | SSO 授权发起、回调、绑定、解绑，以及会话/候选票据兑换均增加租户有效性边界；票据兑换额外校验用户 tenantId 与票据 tenantId 一致。 | [SsoAuthService.java](../../../Smart-WorkFlow-aPaaS-server/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/sso/SsoAuthService.java:315)、[SsoAuthController.java](../../../Smart-WorkFlow-aPaaS-server/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/SsoAuthController.java:141) |

## 2. 本轮证据

| 证据 | 实际覆盖 |
|---|---|
| [object-ledger.md](evidence/i5-04/object-ledger.md) | iteration-04 对象、租户、环境、无秘密约束与初始 SHA |
| [g2a1-openapi-auth.raw.log](evidence/i5-04/g2a1-openapi-auth.raw.log) | 合法签名到业务 scope 边界；失效租户 3009 在 nonce 写入前拒绝；坏签名、过期时间戳、nonce 重放、scope 拒绝 |
| [g3b2-sso-credential-matrix.raw.log](evidence/i5-04/g3b2-sso-credential-matrix.raw.log) | 三 Provider 缺失/占位凭据 fail-fast；停用配置不强制 secret；不回显秘密 |
| [g6a-g6b-sso-tenant-safety.raw.log](evidence/i5-04/g6a-g6b-sso-tenant-safety.raw.log) | 失效租户在 state CAS/Provider 外呼前拒绝；唯一键竞争转业务拒绝、失败侧无成功副作用 |
| [g9a1-final-candidate-diff.md](evidence/i5-04/g9a1-final-candidate-diff.md) | 五个 Server 文件的最终工作树清单、逐文件 SHA-256、旧候选到本轮行为变化说明 |
| [g9a1-manifest-verify.stdout](evidence/i5-04/g9a1-manifest-verify.stdout) | 独立逐文件校验五项均 `OK`，exit `0` |
| [g9b-final-gates.raw.log](evidence/i5-04/g9b-final-gates.raw.log) | 定向与受影响模块门禁结果、P45 既有环境错误和未闭合边界 |

## 3. 验证结果

- 定向 Maven：`SsoAuthServiceTest` 22/22、`OpenApiServiceTest` 4/4、`LoginChallengeServiceTest` 4/4，failures/errors/skipped 均为 0，Maven exit `0`。
- 受影响两个 Server 模块完整 Maven：Maven 进程 exit `0`；聚合 Surefire 为 303 tests、0 failures、1 error、0 skipped。唯一 error 是既有 `P45IsolationEvidenceFixture` 无法在当前 Redis 隔离环境加载 ApplicationContext，不在本轮五个改动文件内；因此不声明 G9b 全门禁闭合。
- `git diff --check` exit `0`。
- manifest 独立校验五个源码文件全部 `OK`，stdout/stderr/exit 分离落盘。
- Web 工作树无改动；本轮无 Web 门禁需求。

## 4. 未闭合与合法边界

- G8 三 Provider 真实成功链继续 `PENDING`，依赖官方应用凭据、HTTPS 回调白名单域与可控测试身份。
- G2a2 IoT、G2a3 异步生产者、G1/G4 的真实 PG/HTTP/浏览器矩阵，本轮未用匿名、未知路径或停用账号冒充正向证据；不改写历史失败输出。
- G6a1 当前新增的是唯一键竞争的受控单测；真实两租户 PostgreSQL barrier 并发仍需独立证据。
- G6b1 当前新增失效租户回调和服务边界；真实 Provider 换票、票据 HTTP 与 session 清理时间序列仍未在本轮重跑。
- G9b 受 P45 Redis 隔离夹具错误影响，保留为部分结果，等待规划验收决定是否复用既有环境豁免口径。

## 5. 停止条件

当前仍处 `VERIFYING / EXECUTION_SUBMITTED`，提交本轮实现增量与证据，等待 Planner 按二级提示复核。没有核销 P60/P31，没有进入阶段三或 I6，没有推送。
