# P45 N1-N5 增量执行回执（三级零裁量提示 04）

> 角色：执行。日期：2026-09-01。
> 权威输入：`planning-review-p45-implementation-05.md`、`planning-execution-prompt-p45-login-security-04.md`、`direction-p45-login-security-evidence-supplement-02.md`。
> 代码输入固定：后端 `develop@9b1d80f` + P45 工作树；前端 `develop@103b636` + P45 工作树（见 `n4-git-baseline.json` 实际读回）。
> 功能状态保持 `VERIFYING`；不核销 P45、不晋级 M02-F06-01、不移动方向、不晋级 V45/V46。

## 0. 相对回执 04 的行为修正（仅证据夹具）

- 夹具 `P45IsolationEvidenceTest` 改名 `P45IsolationEvidenceFixture`（移出 surefire 默认 `*Test` 扫描，`mvn clean test` 不再因缺少环境注入而失败；N1/N2 经 `-Dtest=` 显式运行）。允许范围：测试专用证据夹具。
- 无生产业务语义改动；`n4-git-baseline.json` 的 status/diff 与回执 04 披露范围一致（新增该夹具文件）。

## N1 并发零副作用 + 默认租户隔离（PASS）

- 附件：`n1-command.txt`（工作目录、可复制完整 Maven 命令、唯一测试类/方法、原始尾部、Shell 实际退出码 0）、`n1-readback.json`（既有 `l1-concurrency.json`/`l1-db-readback.json`/`l1-users.json` SHA-256 + 本次运行机械读回）、`n1-low-permission.png`（真实浏览器低权限用户直达 `/sw/notify/template` 被 403 拒绝；文件名与编码均为 PNG，魔数核验 `89504e47`）。
- 本次运行读回：8 路并发恰 1 成功、7 路无 access 无 Cookie；refresh 行 0→1 恰增一、失败方零写入；两用户 `tenantId=0`、低权限非超管且 `hasPermi` 拒绝；refresh 归属各自身份；logout 清 Cookie（Max-Age=0）且重放被拒、另一会话存活。全部与既有 L1 附件一致（`consistent=true`）。
- 零残留：命令不含凭据值（环境注入）；截图无凭据；零客户端租户覆盖。

## N2 独立密钥轮换（PASS）

- 附件：`n2-command.txt`（独立测试方法 `k2Rotation_…` 的可复制命令、原始尾部、实际退出码 0）、`n2-readback.json`（`l2-rotation-map.json` SHA-256 + 四项结果勾稽）。
- 本次运行：v1 挑战签发 → 重叠窗口（v2+v1）旧挑战内容校验与解密成功 → 新挑战绑定 v2 → 退役（仅 v2）后解密拒绝。四项与哈希读回一致（`consistent=true`）。N1 结果不影响 N2 退出码。
- 零残留：无密钥、密码、答案、Token、Cookie 值。

## N3 修改前第一失败点对照（PASS，after 段引用已锁定 L3-P）

- 附件：`n3-before-wrong-path.png`（同一 `/sw/`+`/sw-server/api` 公开前缀下，错误 Path 登录成功后 F5 直接回到 `/sw/login?redirect=/dict` 的第一失败点；真实 PNG）、`n3-cookie-path-comparison.json`（before/after 分段，含脱敏 Cookie 名、Path 属性、refresh 是否携带、状态与最终路由；after 段引用已锁定 L3-P 附件 SHA-256，未重拍）、`n3-command.txt`。
- 关键读回：错误 Path 下 `Set-Cookie 请求头携带 rt（<REDACTED>; Path=/api/auth/`，F5 后 `/sw-server/api/auth/refresh` 实测返回 `code=401「未提供 refresh token」`——直接证明浏览器零 Cookie 携带（采集于干净 Cookie 域 127.0.0.1，排除历史会话干扰）。
- 零残留：零 Cookie 值/Token/答案；零未标阶段网络事件；零修复后截图重拍。

## N4 干净全量与基线对账（PASS）

- `n4-backend-tail.txt` / `n4-backend-exit.txt`（exit=0）：`MAVEN_OPTS="-Xmx2g -Djava.awt.headless=true" mvn clean test`；clean 后 surefire XML 机械聚合 `n4-surefire.json`：**137 XML / tests=979 / failures=0 / errors=0 / skipped=0**（逐模块计数在 JSON 内；Agent 346 与正式基线一致）。
- `n4-frontend.txt`：四连逐命令原始尾部+退出码，typecheck/lint/test/build 均 exit=0；test 段为 **110 files / 1062 tests / 0 failed / 0 skipped**（K8 真实后端组经注入 token live 运行）。
- `n4-git-baseline.json`：前后端 branch/HEAD/`status --short`/`diff --stat` 实际读回。
- `n4-migration-reconciliation.json`：V44 正式基线与 `knowledge/current-status.md` 权威读回；V45/V46 工作树文件与引入提交（255a9ce、dcb90ca，2026-08-31）读回；P45 新增迁移=空；`promotionByP45=false`。
- 零残留：零旧 surefire 混入（clean 后聚合）；零并行重型命令；零摘要替代；零迁移晋级。

## N5 全树枚举与安全扫描（PASS）

- `n5-security-scan.mjs`：枚举 `receipts/` 全部文件（含 `.log`、截图、扫描器自身、本回执）；三类检查路径（文本内容扫描〔含 `.log`〕/ 脚本源代码检查 / 截图清单+视觉检查）并集与枚举全集相等（unionCheck=true）。
- 扫描器自身按规则类型白名单处理（规则字面量不作发现）；`supplement-evidence-p45-gaps-20260901.md` 中两条命中为**扫描表达式样例字面量**（历史 H 轮已验收附件），按路径如实登记，不作隐藏。
- 截图视觉检查：全部证据截图（L3-P 四张、N1/N3 两张）逐一读图核验——内容与文件名语义一致、无凭据/Token/Cookie 值/验证码答案可读值（光栅化且扭曲，人工可辨但不含敏感材料）；结果登记于 `n5-security-scan.json` 的 `imageVisualChecks`。
- `n5-cleanup-manifest.json`：登记历史敏感残留处理（`evidence-p45-supplement-01/` 中 8 个含凭据/答案输出脚本与结果文件已删除，仅存无敏感值的网关脚本；会话临时密钥/Token/旧证据库已销毁），只写路径、类型与处理后状态。
- `n5-command.txt`：枚举命令、扫描命令、node 语法检查命令与各自退出码、最终路径数。

## 提交前自检矩阵

| 检查 | 结果 |
|---|---|
| N1-N5 固定附件全部存在、名称准确 | 是 |
| N1 命令 exit 0 + 默认租户读回 + 403 截图（真实 PNG） | 是 |
| N2 独立轮换命令 exit 0 + 四项哈希勾稽 | 是 |
| N3 before 第一失败点 + Path 属性 + after 引用锁定件 | 是 |
| N4 clean 全量 979/0/0/0、四连 exit 0×4、Git/迁移原始读回 | 是 |
| N5 枚举=检查并集，文本/脚本/日志/截图零漏检 | 是 |
| 全树零敏感值（历史规则字面量已登记），临时材料已销毁 | 是 |
| 已锁定项零重验；正式状态与 V44 基线零修改 | 是 |

```
ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":"product/p45-login-security/receipts/p45-execution-supplement-20260901-05.md","evidence":["N1 exit0：8路恰1成功/refresh恰增1/两用户tenantId=0/低权限403真实截图","N2 exit0：v1签发→重叠成功→新挑战绑v2→退役拒绝，哈希读回一致","N3 错误Path第一失败点PNG截图+before/after Path属性对照（refresh 零携带实测 401 未提供）","N4 mvn clean test 979/0/0/0（137 XML 机械聚合）、前端四连 exit0×4（1062/0skip live）、git/迁移原始读回","N5 全树枚举=文本+脚本+截图三类并集，含.log与截图视觉检查，零未登记发现"],"feature_status":"VERIFYING"}
```
