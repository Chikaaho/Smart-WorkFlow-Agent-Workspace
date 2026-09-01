# P45 登录安全第二次验收缺口执行补充回执

> 角色：执行。日期：2026-09-01。功能状态保持 `VERIFYING`。
> 本回执承接 `planning-review-p45-implementation-02.md` 与 `planning-execution-prompt-p45-login-security-01.md`，只处理 H1-H7；历史回执与已锁定验收项未覆盖、未改写。

## 1. 本轮实际修改

### 后端

- `Smart-WorkFlow-Server/sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/security/LoginChallengeServiceTest.java`
  - 新增 H1 回归：正确答案由服务端 HMAC 摘要验证；Redis 记录摘要不等于无密钥 SHA-256；摘要密钥缺失时构造期拒绝装配。

### 证据资产

- 重建 `product/p45-login-security/receipts/evidence-p45-h1-h7/h1-enumerate.mjs`、`h2-concurrent.mjs`、`h5-cross.mjs`：凭据只从环境读取，输出仅保留状态、字段和计数。
- 新建 `product/p45-login-security/receipts/evidence-p45-supplement-02/`，加入 H3、H6、H7 工具和脱敏输入/输出说明。
- 清理路径：上述三份旧证据脚本已替换为安全版本；既有失败回执保留以满足审计历史，不作为本轮证据输入。

## 2. H1-H7 缺口矩阵

| 缺口 | 本轮结果 | 实际证据 |
|---|---|---|
| H1 答案摘要保护 | `PASS` | 真实 Redis 记录字段为 `captchaDigest/createdAtEpochMs/keyVersion`；`h1-record-only-output.json`：HMAC、无服务端密钥、923521 个无密钥候选检查、普通 SHA-256 命中 0；新增 `LoginChallengeServiceTest` 通过。 |
| H2 并发零副作用 | `BLOCKED` | `h2-concurrent.mjs` 已改为环境注入并只输出逐请求状态；当前环境没有外部测试凭据，未声称真实认证链通过。 |
| H3 密钥轮换连续链 | `BLOCKED` | `h3-rotation-map.mjs` 已提供单清单校验；当前没有可复核的当前/重叠/退役三阶段服务运行映射，未声称通过。 |
| H4 公开前缀浏览器链 | `BLOCKED` | 等价前缀 `http://localhost:5273/sw/login` 页面已打开；PNG 验证码 130×44、浏览器可见 Cookie 为空、两类 Web Storage 均为空；登录凭据输入与验证码处理需即时确认，未继续提交。 |
| H5 当前支持范围隔离 | `BLOCKED` | `h5-cross.mjs` 已改为双账号、四挑战、正常/交叉提交且不回显敏感值；当前没有两组外部测试账号凭据，未声称身份/租户隔离通过。 |
| H6 原始测试与基线 | `PASS`（前端四连受互斥限制） | Surefire XML 137 文件：979 tests / 0 failures / 0 errors / 0 skipped；后端定向命令退出码 0；后端 `develop@9b1d80f`、前端 `develop@103b636`；迁移实体 V1-V46，V45/V46 为既有提交，P45 未新增迁移。 |
| H7 安全证据包 | `PASS` | 新证据目录 12 文件通用敏感形态扫描：0 findings；脚本语法检查全部通过；凭据、答案、私钥、Token、完整 Cookie 不进入新证据目录。 |

## 3. 实际命令与结果

### H1

```text
redis-cli --raw --scan --pattern 'sw:auth:challenge:*' | ... | node evidence-p45-h1-h7/h1-enumerate.mjs -
exitCode=0
{"recordFields":["captchaDigest","createdAtEpochMs","keyVersion"],"algorithm":"HMAC-SHA256","serverSecretUsed":false,"combinationsChecked":923521,"unkeyedSha256Matches":0,"answerOutput":false,"verdict":"NOT-RECOVERABLE-WITH-RECORD-ONLY"}
```

```text
MAVEN_OPTS="-Xmx2g -Djava.awt.headless=true" mvn -q -pl sw-biz/sw-biz-system/sw-biz-system-biz -DforkCount=0 -Dtest='AuthControllerTest,AuthFlowIntegrationTest,CookieUtilsTest,RedisLoginChallengeStoreTest,RsaLoginKeyManagerTest,LoginChallengeServiceTest' test
exitCode=0
```

默认 headless 未显式启用时，包含 Java2D PNG 渲染的测试进程以 134 退出；显式 headless 后同一批定向测试退出码为 0。该环境条件已固定在证据命令中。

### H6/H7

```text
node evidence-p45-supplement-02/h6-surefire.mjs Smart-WorkFlow-Server
{"xmlFiles":137,"tests":979,"failures":0,"errors":0,"skipped":0}

node evidence-p45-supplement-02/h7-security-scan.mjs evidence-p45-supplement-02
{"filesScanned":12,"findings":[],"verdict":"PASS"}
```

前端四连未在本轮启动：后端服务仍在运行，工程宪法要求前后端重型命令互斥；既有前端结果仅作为历史事实，不冒充本轮原始输出。

## 4. 反向断言与限制

- 新证据脚本不含硬编码凭据，不打印验证码答案、密钥、Token 或完整 Cookie；H7 扫描未发现通用敏感形态。
- 新增测试只验证 H1，不改变登录请求、双 Token、业务有效期/记录保留期或租户派生契约。
- H2-H5、H3 的真实轮换证据仍缺少外部凭据/密钥运行条件；H4 尚未完成登录、F5、深链、退出和退出后刷新链。当前不能提交“全部 H1-H7 通过”的结论。
- 未写 `PASSED`/`COMPLETED`，未核销 P45，未晋级 M02-F06-01，未移动方向目录。

## 5. 执行结论

H1、H6、H7 已完成并形成可复核附件；H2-H5 及 H3 的真实行为附件受外部凭据/轮换配置和浏览器验证码确认门阻塞。按本轮实际事实提交，功能继续保持 `VERIFYING`，等待补齐外部条件后再由规划层复验。

```text
ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"BLOCKED","task_level":"L","receipt":"product/p45-login-security/receipts/p45-execution-supplement-20260901-02.md","evidence":["H1 真实 Redis 记录脱敏复跑：HMAC、923521 个无密钥候选、0 个普通 SHA-256 命中","H1 后端定向测试含 LoginChallengeServiceTest 退出码 0（显式 headless）","H6 Surefire XML 137 文件：979/0/0/0；后端与前端 branch/HEAD/迁移清单已读回","H7 新证据目录 12 文件扫描 0 findings、脚本语法检查通过"],"block_type":"EXTERNAL","attempted":["重建 H1/H2/H5 环境注入证据脚本并完成语法检查","使用真实 Redis 记录完成 H1 record-only 复跑","启动等价 /sw/ 与 /sw-server/api 网关并打开浏览器登录页","执行后端 P45 定向测试并固定 headless 条件","执行 Surefire、git、迁移和敏感形态机械扫描"],"release_condition":"提供可注入且不写入回执的测试账号/密码与验证码处理确认，并提供当前/上一版本 RSA 密钥的轮换运行配置；随后在同一证据环境补齐 H2-H5 与 H3，且前端四连可在互斥窗口执行。"}
```
