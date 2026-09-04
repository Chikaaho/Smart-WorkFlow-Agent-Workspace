# P45 登录安全三级后续零裁量执行补充提示

> 适用状态：VERIFYING
> 日期：2026-09-01
> 相对提示 03：锁定 L3 修复后行为，只补 N1-N5；固定附件不得改名、拆分或用摘要替代

## 1. 权威输入

1. `product/p45-login-security/receipts/planning-review-p45-implementation-05.md`
2. `product/p45-login-security/receipts/planning-execution-prompt-p45-login-security-03.md`
3. `product/p45-login-security/ready/direction-p45-login-security-evidence-supplement-02.md`

代码输入仍固定为：

- 后端 `develop@9b1d80f92e22bdee5786ca2727b643d62d242c45` + 当前 P45 工作树。
- 前端 `develop@103b636edd422b1784ec39f9c91470e45cb609a5` + 当前 P45 工作树。

## 2. 唯一剩余缺口矩阵

| 编号 | 失败事实 | 不可接受证据 | 唯一可接受证据 |
|---|---|---|---|
| N1 | L1 命令不可重放，低权限截图缺失 | “isolated JUnit”文字、JSON 自述、截图文件名替代截图 | 实际完整命令、独立测试入口、原始尾部、退出码 0、既有 L1 JSON 哈希读回、低权限真实页面拒绝截图 |
| N2 | L2 缺实际命令与原始输出 | 轮换流程文字和手填退出码 | 指定独立测试方法的完整命令、原始尾部、退出码 0、轮换 JSON 哈希读回 |
| N3 | 修改前截图已是登录后页面 | 无阶段标签的网络事件、修复后截图冒充修改前 | 同一公开前缀下错误 Path 的第一失败点截图；修改前/修改后的 Cookie Path 属性、refresh Cookie 携带和结果对照 |
| N4 | L4 只有摘要或无退出码日志 | 人工汇总、布尔 Git 基线、拆散且无退出码的日志 | 提示 03 指定的六个固定附件，包含实际命令、原始输出、逐命令退出码、机械计数与真实 Git 读回 |
| N5 | 52 文件扫描遗漏 `.log`，截图未检查 | 只扫扩展白名单、只登记截图文件名、固定写“零发现” | 全树枚举；全部文本含 `.log` 扫描；全部截图内容检查；枚举、检查和总数逐项相等 |

## 3. 已锁定并禁止重验

- H1、A1-A3、B1-B3。
- L3-P：正确公开前缀下的 F5、受保护深链、退出后登录页，以及修复后 refresh 携带 Cookie。
- 默认租户 `tenant=0` 与超级管理员归属。
- 不得重拍或替换 L3-P 已锁定三张修复后截图；N3 只新增修改前对照和属性映射。

## 4. 允许范围与执行顺序

### 允许读取

- 本提示三份权威输入。
- `product/p45-login-security/receipts/evidence-p45-l1-l5/` 既有附件。
- P45 测试夹具、证据网关、前后端测试配置与 Git 只读状态。

### 允许修改

- 测试专用证据夹具和安全扫描脚本。
- 新目录 `product/p45-login-security/receipts/evidence-p45-n1-n5/` 下的固定附件。
- 一份新的 N1-N5 增量执行回执。

### 禁止事项

- 不修改生产业务语义、方向、历史规划审查、需求池、memory 或正式状态。
- 不新增租户选择、跨租户账号查询或平行 Token 状态源。
- 不把描述性摘要、类名、JSON 布尔值或人工录入退出码作为唯一行为证据。
- 不删除历史回执；安全处理只清理附件中的敏感残留并登记路径与处理类型。
- 不晋级 V45/V46，不改写正式 V44 基线。

### 固定顺序

1. N1、N2 使用全新隔离 H2/Redis 和环境注入临时材料分别执行。
2. N3 在相同 `/sw/`、`/sw-server/api` 前缀下采集错误 Path 修改前对照，只记录 Cookie 属性，不记录值。
3. 停止证据服务和网关后执行 N4，后端与前端重型命令互斥。
4. N1-N4 附件和新回执全部生成后，最后执行 N5 全树枚举、检查和扫描。
5. 逐文件读回；提交前矩阵全部为“是”才提交。

## 5. N1 证据包

固定附件：

- `evidence-p45-n1-n5/n1-command.txt`
- `evidence-p45-n1-n5/n1-readback.json`
- `evidence-p45-n1-n5/n1-low-permission.png`

`n1-command.txt` 必须依次包含：工作目录、可复制的完整 Maven 命令、唯一测试类与方法、原始输出尾部、Shell 实际退出码。`n1-readback.json` 必须记录既有 `l1-concurrency.json`、`l1-db-readback.json`、`l1-users.json` 的 SHA-256，并从本次命令输出机械读回 8 路恰一成功、refresh 恰增一、两用户 `tenantId=0`、低权限拒绝、退出隔离。

截图必须是低权限用户在真实浏览器访问指定受保护页面/API 后的拒绝结果，截图名与实际编码均为 PNG；网络请求业务码只写脱敏摘要。

正向目标：命令可重放且退出码为 0，哈希与读回结果一致，低权限真实访问被拒。

零残留目标：零客户端租户覆盖、零跨用户串用、零失败 refresh 写入、零凭据值进入命令或截图。

## 6. N2 证据包

固定附件：

- `evidence-p45-n1-n5/n2-command.txt`
- `evidence-p45-n1-n5/n2-readback.json`

命令附件必须包含独立轮换测试方法的可复制完整命令、原始输出尾部和 Shell 实际退出码 0。读回附件记录 `l2-rotation-map.json` SHA-256，并将 v1 签发、重叠期旧挑战成功、新挑战绑定 v2、退役后拒绝四项与本次原始输出逐项勾稽。

正向目标：独立命令退出码为 0，四项轮换结果与哈希读回一致。

零残留目标：零密钥、零密码、零验证码答案、零 Token、零 Cookie 值；N1 结果不影响 N2 退出码。

## 7. N3 证据包

固定附件：

- `evidence-p45-n1-n5/n3-before-wrong-path.png`
- `evidence-p45-n1-n5/n3-cookie-path-comparison.json`
- `evidence-p45-n1-n5/n3-command.txt`

修改前截图必须展示错误 Path 条件下刷新后的第一失败点，文件名与编码均为 PNG。对照 JSON 必须分 `before`、`after` 两段，只记录：公开前缀、脱敏 Cookie 名、Path 属性、refresh 请求是否携带 Cookie、refresh 状态、最终路由；不得记录 Cookie 值。`after` 段引用已锁定 L3-P 附件 SHA-256，不重新采集。

正向目标：同一公开前缀下，修改前错误 Path 导致 refresh 不携带 Cookie并进入登录页；修改后最小 Path 覆盖公开 refresh/logout URL，refresh 携带 Cookie并恢复原路由。

零残留目标：零 Cookie 值、零 Token、零验证码答案；零未标阶段的网络事件；零修复后截图重拍。

## 8. N4 证据包

固定职责沿用提示 03，并写入以下唯一新附件名：

- `evidence-p45-n1-n5/n4-backend-tail.txt`
- `evidence-p45-n1-n5/n4-backend-exit.txt`
- `evidence-p45-n1-n5/n4-surefire.json`
- `evidence-p45-n1-n5/n4-frontend.txt`
- `evidence-p45-n1-n5/n4-git-baseline.json`
- `evidence-p45-n1-n5/n4-migration-reconciliation.json`

后端执行 `MAVEN_OPTS="-Xmx2g -Djava.awt.headless=true" mvn clean test`；tail 附件保留实际 Reactor/Surefire 尾部，exit 附件由同一 Shell 记录命令和实际退出码，只聚合本次 clean 后 XML。

前端汇总附件按顺序包含四个命令各自的命令行、原始尾部和实际退出码：`NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build`。

Git 附件记录前后端实际 branch、HEAD、`status --short`、`diff --stat` 输出；迁移附件记录 V44 正式基线和 V45/V46 当前工作树差异与来源，不晋级基线。

正向目标：后端 clean 全量与前端四连均退出 0；计数从本轮 XML/输出机械得到；Git 与迁移读回可复算。

零残留目标：零旧 Surefire 混入、零并行重型命令、零摘要替代原始输出、零迁移晋级、零未披露业务或迁移变化。

## 9. N5 证据包

固定附件：

- `evidence-p45-n1-n5/n5-enumeration.json`
- `evidence-p45-n1-n5/n5-cleanup-manifest.json`
- `evidence-p45-n1-n5/n5-security-scan.json`
- `evidence-p45-n1-n5/n5-command.txt`

枚举必须覆盖 `product/p45-login-security/receipts/` 下全部文件，包括扫描器自身、新回执、`.log` 和截图。扫描结果分三类勾稽：全部文本文件内容扫描、全部证据脚本源代码检查、全部截图 OCR/视觉内容检查；三类路径并集必须与枚举路径全集相等，每个路径恰出现一次。扫描器自身若含匹配规则，使用规则类型白名单处理，不得直接排除文件。

命令附件包含实际枚举命令、扫描命令、语法检查命令、各自退出码和最终路径数；清理清单只写处理路径、类型与清理后哈希，不写原值。

正向目标：枚举总数等于三类检查路径并集总数，全部命令退出码为 0，零发现。

零残留目标：全树零密码、零验证码答案、零私钥、零 access/refresh Token、零完整 Cookie；零 `.log` 或截图漏检；零扫描器自我排除。

## 10. 相对提示 03 新增或收紧

- 已锁定 L3-P，不再重复执行修复后浏览器链。
- 命令附件必须是可复制命令 + 原始输出 + Shell 实际退出码，描述性文字不再采信。
- 图片扩展名与实际编码必须一致。
- Cookie 对照必须具有 before/after 阶段标签与 Path 属性，不接受无阶段事件列表。
- 安全扫描按文件全集勾稽，`.log`、截图和扫描器自身均不得遗漏。
- 固定附件缺一、改名或拆分即视为未提交。

## 11. 提交前全部为是

| 检查 | 必须为是 |
|---|:---:|
| N1-N5 固定附件全部存在、名称准确、可读且可勾稽 | 是 |
| N1 完整命令退出 0，默认租户读回正确，低权限真实页面拒绝 | 是 |
| N2 独立轮换命令退出 0，四项结果与哈希一致 | 是 |
| N3 修改前第一失败点、Path 属性和已锁定修复后链构成同环境对照 | 是 |
| N4 后端 clean 全量、前端四连、Git 与迁移原始证据完整 | 是 |
| N5 文件全集与检查路径全集相等，文本、脚本、日志、截图零漏检 | 是 |
| 全回执树零敏感值，临时材料已销毁 | 是 |
| 已锁定项零重验，正式状态与 V44 基线零修改 | 是 |

合法终态为 `EXECUTION_SUBMITTED`；任一项不能满足时只能提交带已尝试路径和恢复条件的 `BLOCKED`。
