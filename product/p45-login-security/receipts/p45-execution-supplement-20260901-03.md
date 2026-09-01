# P45 登录安全二级执行补充回执（三）

> 角色：执行。日期：2026-09-01。功能状态保持 VERIFYING。
> 本回执承接 planning-review-p45-implementation-03.md 与 planning-execution-prompt-p45-login-security-02.md，只处理 K1-K6；不改写历史回执和已锁定项。

## 1. 执行结论

二级提示要求在 K1-K4 暴露真实功能缺陷时停止，不得通过修改测试数据、附加租户请求头或其他方式制造通过证据。本轮隔离 H2/Redis/真实认证控制器链已确认该条件：登录前的 SysUserService.getByUsername() 被租户拦截器追加 tenant_id=0，非零租户用户因此无法进入密码认证。

K1 已保存真实失败证据，K2 独立轮换链通过；按提示停止 K4 后续行为、K3 浏览器链和 K5 全量门，未声称 P45 通过。

## 2. 实际修改

- 新增后端测试夹具：
  Smart-WorkFlow-Server/sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/P45IsolationEvidenceTest.java
  - 仅测试作用域；使用 /tmp 文件 H2、临时 Redis 端口 6381/DB 15；
  - 两套随机 RSA 密钥、摘要密钥和用户密码只从进程环境读取；
  - K1 使用真实 AuthController、真实 RedisLoginChallengeStore、真实 H2 用户服务；
  - K2 使用真实 LoginChallengeService/RsaLoginKeyManager 完成三阶段映射；
  - 输出只保留状态、计数、版本标签和布尔断言。
- 新增 K6 扫描器与清单：
  product/p45-login-security/receipts/evidence-p45-k1-k6/k6-security-scan.mjs
  product/p45-login-security/receipts/evidence-p45-k1-k6/k6-cleanup-manifest.json
- 修正 K1/K2 命令附件，使记录与实际 Maven 退出码一致；未修改生产业务实现、前端实现、迁移文件、主方向或正式状态文件。

## 3. K1-K6 对照

| 编号 | 本轮结果 | 证据 |
|---|---|---|
| K1 并发零副作用 | FAIL，真实缺陷阻断 | k1-concurrency.json：8 路同一挑战，2101=7、2104=1、成功 0、无 access 8、无 Cookie 8；k1-db-before-after.json：refresh 行 0→0；Maven 退出码 1 为断言失败 |
| K2 密钥轮换 | PASS | k2-rotation-map.json：v1 旧挑战在 v2+v1 重叠期成功，新挑战绑定 v2，退役 v2-only 拒绝 v1；无密钥/验证码原文落附件 |
| K3 公开前缀浏览器链 | 未执行 | K1/K4 已暴露真实登录前置缺陷，依二级提示停止；未生成截图或网络摘要，不以旧登录前页面 JSON 替代 |
| K4 双用户/租户派生 | BLOCKED | 同一隔离真实认证链中非零租户用户返回 2104，尚未进入 /me/权限/退出验证；未生成推断性用户、交叉或截图附件 |
| K5 干净全量/基线 | 未执行 | 按固定顺序在 K1-K4 真实缺陷后停止；既有 979 计数不冒充本轮 mvn clean test |
| K6 全证据安全 | PASS | k6-security-scan.mjs 覆盖 4 个 evidence-* 目录及当前 P45 回执：25 文件、0 findings；脚本语法检查通过；清理处理写入 k6-cleanup-manifest.json |

## 4. K1 原始结果摘要

MAVEN_OPTS="-Xmx2g -Djava.awt.headless=true" mvn -q -pl sw-biz/sw-biz-system/sw-biz-system-biz -DforkCount=0 -Dtest=P45IsolationEvidenceTest#k1Concurrency_shouldConsumeOnceAndWriteOneRefreshRow test

observed_test_exit=1
codeHistogram={"2101":7,"2104":1}
successCount=0
refreshRowsBefore=0
refreshRowsAfter=0

正向断言：Redis DEL 原子消费确实只允许一个请求进入后续认证，7 个竞争请求无 access/Cookie。

反向断言：唯一进入密码认证的请求因租户拦截器把未登录上下文降级为 tenant_id=0，查询不到其 tenant_id=6101 用户，返回 2104，未写 refresh 行。该失败发生在现有生产认证链语义，不是通过改变夹具租户值规避的测试失败。

## 5. K2 原始结果摘要

v1ChallengeIssued=true
overlapCurrentVersion=v2
overlapOldChallengeAccepted=true
newChallengeBoundToV2=true
retiredV1Rejected=true
sensitiveValuesSerialized=false

K2 只输出版本标签和结果，不输出临时私钥、密码、验证码、密文、Token 或 Cookie。

## 6. 真实缺陷与停止边界

已读回并确认：

- CommonTenantLineHandler.getTenantId() 在无登录态时返回超级租户 0；
- SysUserServiceImpl.getByUsername() 使用 MyBatis-Plus 查询，受 TenantLineInnerInterceptor 影响；
- 登录控制器在账号查询前尚未具备用户派生的 tenantId，因此非零租户账号无法完成登录。

本轮没有修改上述生产实现，因为二级执行提示明确禁止本轮修改生产业务实现，并要求发现 K1-K4 真实缺陷即停止。K3、K4 后续和 K5 不使用结构、Mock、旧计数或人工转录替代真实行为证据。

恢复条件：由规划层确认是否把“登录前用户查询的租户边界”纳入 P45 实现修正范围并下发相应执行提示；修正后在新的隔离 H2/Redis 环境重新运行 K1-K4，再按固定顺序执行 K3、K5、K6。

未核销 P45，未晋级 V45/V46 为 P45 正式基线，未写功能 PASSED/COMPLETED，未移动方向目录。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"BLOCKED","task_level":"L","receipt":"product/p45-login-security/receipts/p45-execution-supplement-20260901-03.md","evidence":["K1 隔离真实 Redis/H2/AuthController 并发：8 路同一挑战，2101=7、2104=1、成功 0、refresh 行 0→0","K2 隔离 v1→v2+v1 重叠→v2 退役映射：旧挑战重叠期成功、新挑战绑定 v2、退役拒绝 v1","K6 全 P45 evidence-* 与当前回执扫描：25 文件、0 findings；脚本语法检查通过"],"block_type":"DIRECTION_CONFLICT","attempted":["完整读取 planning-review-p45-implementation-03.md 与 planning-execution-prompt-p45-login-security-02.md","建立 /tmp 文件 H2、独立 Redis DB 15、临时 v1/v2 RSA 密钥和随机双用户夹具","执行真实 RedisLoginChallengeStore/AuthController K1 并发并保存逐业务码脱敏计数","执行真实 LoginChallengeService/RsaLoginKeyManager K2 三阶段轮换映射","核对 CommonTenantLineHandler、SysUserServiceImpl 与登录控制器调用链定位非零租户登录失败","覆盖全部 P45 evidence-* 目录、当前回执与证据脚本执行 K6 安全扫描"],"release_condition":"规划层确认并下发登录前用户查询租户边界缺陷的实现范围后，先完成对应生产修正，再在新的隔离 H2/Redis 环境补齐 K1-K4；随后停止后端服务并串行完成 K3 浏览器四截图、K5 后端 clean 全量与前端四连、K6 全范围零发现扫描。"}
