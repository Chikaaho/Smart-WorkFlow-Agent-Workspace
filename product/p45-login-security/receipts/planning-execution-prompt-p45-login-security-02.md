# P45 登录安全二级执行补充提示

> 适用状态：VERIFYING
> 日期：2026-09-01
> 相对一级提示：删除已通过 H1，只保留 K1-K6；使用隔离临时输入完成行为证据，不再等待生产或用户凭据

## 1. 权威输入

1. `product/p45-login-security/ready/direction-p45-login-security.md`
2. `product/p45-login-security/ready/direction-p45-login-security-evidence-supplement-01.md`
3. `product/p45-login-security/receipts/planning-review-p45-implementation-03.md`

## 2. 固定输入与隔离环境

- 后端输入：`develop@9b1d80f92e22bdee5786ca2727b643d62d242c45` + 当前 P45 工作树。
- 前端输入：`develop@103b636edd422b1784ec39f9c91470e45cb609a5` + 当前 P45 工作树。
- 使用 `/tmp` 下新的隔离 H2 数据库、独立 Redis DB/前缀和临时证据配置；不得读取或改写生产数据。
- 在隔离库创建两个临时测试用户，随机密码仅驻留进程环境或受限临时文件；测试结束即销毁。用户分别具有管理员与低权限角色，tenantId 均由用户记录派生。
- 生成临时 RSA `v1`/`v2` 密钥对，私钥仅驻留受限临时文件或环境，证据只记录版本标签和结果。
- 验证码答案通过测试专用内存输入通道或浏览器视觉交互取得；禁止新增生产答案接口、从 HMAC 摘要恢复答案或把答案写入证据。

## 3. 唯一剩余缺口与原子证据包

| 编号 | 必须完成的行为 | 固定附件 |
|---|---|---|
| K1 并发零副作用 | 同一挑战 8 路并发，恰一成功；失败请求无 access、无 Set-Cookie；refresh/登录态行前后恰增一 | `evidence-p45-k1-k6/k1-concurrency.json`、`k1-db-before-after.json`、`k1-command.txt` |
| K2 密钥轮换 | v1 签发旧挑战；v2+v1 重叠时旧挑战成功且新挑战绑定 v2；仅 v2 时尚在保留期的旧挑战稳定拒绝 | `k2-rotation-map.json`、`k2-command.txt`、三阶段脱敏服务配置摘要 |
| K3 公开前缀浏览器链 | 同一 `/sw/` + `/sw-server/api` 环境分别复现错误 Path 和正确 Path；覆盖 Set-Cookie、refresh 携带、F5、深链、退出后刷新 | `k3-before.png`、`k3-after-f5.png`、`k3-deeplink.png`、`k3-after-logout.png`、`k3-network.json`、`k3-command.txt` |
| K4 双用户与租户派生 | 两用户分别登录/恢复；低权限用户访问受保护路由被拒；交叉挑战不改变最终用户归属；认证后 tenantId 与用户记录一致；退出不串会话 | `k4-users.json`、`k4-cross.json`、`k4-db-readback.json`、`k4-low-permission.png`、`k4-command.txt` |
| K5 干净全量与基线 | 清理旧测试报告后运行后端全量；停止后端后串行运行前端四连；机械聚合测试计数；读回 git、迁移与持久状态 | `k5-backend-tail.txt`、`k5-backend-exit.txt`、`k5-surefire.json`、`k5-frontend.txt`、`k5-git-baseline.json`、`k5-migration-reconciliation.json` |
| K6 全证据安全 | 扫描所有 `product/p45-login-security/receipts/evidence-*`、本轮回执和所有证据脚本；无凭据、答案、私钥、Token、完整 Cookie；旧不安全附件完成清理并留清单 | `k6-cleanup-manifest.json`、`k6-security-scan.json`、`k6-command.txt` |

## 4. 精确允许范围

### 允许修改

- 不再修改生产业务实现；若 K1-K4 暴露真实功能缺陷，停止并在回执中报告，不为制造证据临时改变生产语义。
- 允许新增隔离测试夹具、证据脚本和上述固定附件。
- 允许安全清理 `product/p45-login-security/receipts/evidence-p45-supplement-01/`、`evidence-p45-h1-h7/` 中的敏感值、危险输出和缺失依赖引用；`k6-cleanup-manifest.json` 必须记录路径与处理类型，不记录原值。
- 允许新建一份 K1-K6 增量回执。

### 禁止修改

- 主方向、两份补充方向、既有规划审查、需求池正式状态和 memory。
- 双 Token、300/600 秒过期语义、HMAC 摘要、光栅验证码、租户登录契约。
- V45/V46 迁移内容和任何与 P45 无关的业务代码。

## 5. 固定命令顺序

1. 启动隔离 Redis/H2，创建临时用户和 v1/v2 密钥；记录不含敏感值的环境摘要。
2. 在同一后端输入上依次生成 K1、K2、K4；每个命令将脱敏输出和退出码写入固定附件。
3. 构建生产前端并启动等价公开前缀网关；通过真实浏览器生成 K3 四张截图和网络摘要。
4. 停止所有后端/网关进程，确认前后端重型命令互斥。
5. 后端执行 `MAVEN_OPTS="-Xmx2g -Djava.awt.headless=true" mvn clean test`；只聚合本次 clean 后生成的 Surefire XML。
6. 后端结束后，前端依次执行 `NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build`，记录各自退出码和原始尾部。
7. 只读执行 `git branch --show-current`、`git rev-parse HEAD`、`git status --short`、`git diff --stat`，并对照 `knowledge/current-status.md` 记录 V44 正式基线与当前分支 V45/V46 的差异；不得由 P45 晋级迁移基线。
8. 清理证据附件后执行 K6 全范围扫描。扫描非零不得提交。
9. 新建增量回执，只报告 K1-K6 和合法终态。

## 6. 相对一级提示新增或收紧约束

- 不再等待外部账号、生产密钥或用户输入；全部使用隔离临时材料。
- 后端计数必须来自 `mvn clean test` 后的新 XML，禁止聚合遗留报告。
- 安全扫描扩大到所有 P45 证据目录、脚本和本轮回执，不得只扫新目录。
- 浏览器结论必须有四张可读截图和一份脱敏网络摘要。
- K1-K6 每项使用固定附件名，缺一即未提交，不接受回执内人工转录替代。

## 7. 提交前自检矩阵

| 检查 | 必须为是 |
|---|:---:|
| K1-K6 固定附件全部存在且可读 | 是 |
| 临时凭据和密钥已销毁且未进入证据 | 是 |
| K1 恰一成功且数据库恰增一 | 是 |
| K2 三阶段结果连续无矛盾 | 是 |
| K3 四张截图与网络摘要一致 | 是 |
| K4 身份、权限、tenantId、退出恢复不串用 | 是 |
| K5 后端 clean 全量与前端四连串行全绿 | 是 |
| K5 不把 V45/V46 晋级为 P45 正式基线 | 是 |
| K6 全范围扫描零发现 | 是 |
| 已锁定项零改动 | 是 |
| 未核销 P45、晋级清单或写功能终态 | 是 |

合法终态为 `EXECUTION_SUBMITTED`；隔离环境本身无法启动且同范围替代已穷尽时，才可提交 `BLOCKED`。

