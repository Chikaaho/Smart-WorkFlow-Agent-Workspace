# P45 登录安全三级执行补充提示

> 适用状态：VERIFYING
> 日期：2026-09-01
> 目标：只完成 L1-L5；每项一个独立证据包；提交前矩阵必须全部为“是”

## 1. 权威输入

1. `product/p45-login-security/ready/direction-p45-login-security.md`
2. `product/p45-login-security/ready/direction-p45-login-security-evidence-supplement-01.md`
3. `product/p45-login-security/ready/direction-p45-login-security-evidence-supplement-02.md`
4. `product/p45-login-security/receipts/planning-review-p45-implementation-04.md`

固定代码输入：

- 后端：`develop@9b1d80f92e22bdee5786ca2727b643d62d242c45` + 当前 P45 工作树。
- 前端：`develop@103b636edd422b1784ec39f9c91470e45cb609a5` + 当前 P45 工作树。

## 2. 固定环境与实现边界

- 新建隔离 H2、独立 Redis DB/前缀、临时 RSA `v1`/`v2` 和随机进程内凭据；不得读取或改写生产数据。
- 在隔离库创建默认租户 `tenant=0`，并创建一名超级管理员和一名低权限用户，两名用户记录的 `tenantId` 均为 `0`。
- 登录请求不附加租户请求头、租户查询参数或测试专用租户覆盖；认证后的租户值从用户记录读回。
- 优先只修正测试夹具与证据。现有生产链已按默认租户工作时不得增加平行实现；若读回发现默认租户或超管绑定本身缺失，只允许在 P45 范围内补齐最小默认租户契约、对应测试和披露，不得扩展租户选择或跨租户登录。
- 不修改 V45/V46 内容，不把它们晋级为 P45 正式迁移基线；不修改已锁定 H1、A/B 项。
- 所有附件只输出固定标签、业务码、计数、布尔断言和脱敏摘要。

## 3. L1 默认租户并发与身份隔离

必须使用独立测试入口和独立退出码为 0 的命令完成：

1. 超级管理员的同一有效挑战 8 路并发，恰 1 次成功、恰 7 次已消费/拒绝；access 与 Set-Cookie 只出现 1 次；refresh 行前后恰增 1。
2. 两名 `tenant=0` 用户分别挑战、登录、refresh 恢复和退出；低权限用户访问受保护资源被拒绝。
3. 交叉挑战不改变最终用户归属；认证后两名用户的 tenantId 均与各自数据库记录的 `0` 一致；退出后不恢复旧会话。

固定附件：

- `evidence-p45-l1-l5/l1-concurrency.json`
- `evidence-p45-l1-l5/l1-db-readback.json`
- `evidence-p45-l1-l5/l1-users.json`
- `evidence-p45-l1-l5/l1-low-permission.png`
- `evidence-p45-l1-l5/l1-command.txt`

正向目标：并发恰一成功、数据库恰增一，两名默认租户用户身份与权限均符合用户记录。

零残留目标：失败请求零 access、零 Cookie、零额外 refresh 行；零客户端租户覆盖；零跨用户会话串用；退出后零旧会话恢复。

## 4. L2 独立密钥轮换

使用独立测试方法或独立测试类执行，命令自身退出码必须为 0：v1 签发旧挑战；v2+v1 重叠期旧挑战成功且新挑战绑定 v2；仅 v2 时旧挑战稳定拒绝。

固定附件：

- `evidence-p45-l1-l5/l2-rotation-map.json`
- `evidence-p45-l1-l5/l2-command.txt`

正向目标：三阶段映射连续、自洽，独立命令退出码为 0。

零残留目标：附件零私钥、零密码、零验证码答案、零 Token、零完整 Cookie；K1/L1 失败不得污染 L2 退出码。

## 5. L3 公开前缀浏览器链

在同一等价环境使用 `/sw/` 与 `/sw-server/api`，以真实浏览器完成错误 Cookie Path 对照和正确 Path 行为；覆盖 Set-Cookie、refresh 实际携带、access 回填、session/menu 装配、F5、受保护深链及退出后刷新。

固定附件：

- `evidence-p45-l1-l5/l3-before.png`
- `evidence-p45-l1-l5/l3-after-f5.png`
- `evidence-p45-l1-l5/l3-deeplink.png`
- `evidence-p45-l1-l5/l3-after-logout.png`
- `evidence-p45-l1-l5/l3-network.json`
- `evidence-p45-l1-l5/l3-command.txt`

正向目标：正确 Path 下登录、F5、深链均保持同一用户，网络摘要与四张截图一致。

零残留目标：截图和网络摘要零凭据值；退出后 refresh 不再成功、Cookie 不再恢复、受保护路由回到登录页。

## 6. L4 干净全量与基线对账

固定顺序：

1. 停止隔离服务和浏览器网关，确认重型命令互斥。
2. 后端执行 `MAVEN_OPTS="-Xmx2g -Djava.awt.headless=true" mvn clean test`，只聚合本次 clean 后的 Surefire XML。
3. 后端结束后，前端依次执行 `NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build`。
4. 只读记录前后端 branch、HEAD、工作树状态与 diff；对照正式基线后端 955/0/0/0（agent346）、前端 110f/1060t、Flyway H2/PG V44。
5. 披露当前分支 V45/V46 与正式 V44 的差异，不由 P45 晋级迁移基线。

固定附件：

- `evidence-p45-l1-l5/l4-backend-tail.txt`
- `evidence-p45-l1-l5/l4-backend-exit.txt`
- `evidence-p45-l1-l5/l4-surefire.json`
- `evidence-p45-l1-l5/l4-frontend.txt`
- `evidence-p45-l1-l5/l4-git-baseline.json`
- `evidence-p45-l1-l5/l4-migration-reconciliation.json`

正向目标：后端 clean 全量与前端四连全部退出码为 0，计数由本轮 XML 机械勾稽，版本对账完整。

零残留目标：零遗留 Surefire 报告混入、零并行重型命令、零迁移基线晋级、零未披露业务或迁移修改。

## 7. L5 全回执树安全清理与扫描

扫描整个 `product/p45-login-security/receipts/` 子树，包括全部历史 `evidence-*`、脚本、新增附件和本轮增量回执。先清理历史证据脚本中会输出凭据、验证码答案、Token 或完整 Cookie 的路径，再执行扫描；清单只记文件路径和处理类型，不记录原值。

固定附件：

- `evidence-p45-l1-l5/l5-cleanup-manifest.json`
- `evidence-p45-l1-l5/l5-security-scan.json`
- `evidence-p45-l1-l5/l5-command.txt`

正向目标：清理清单覆盖全部实际处理路径，扫描命令退出码为 0，扫描文件数与枚举结果一致。

零残留目标：整个回执树零密码、零验证码答案、零私钥、零 access/refresh Token、零完整 Cookie，证据脚本零敏感输出路径。

## 8. 提交顺序与停止条件

1. 按 L1、L2、L3、L4、L5 顺序执行；每项附件齐全并读回后再进入下一项。
2. 只新建一份 L1-L5 增量执行回执，不改写历史规划审查或方向。
3. 生产链出现与当前默认租户、P45 安全或恢复契约直接相关的新真实缺陷时，保存最小脱敏证据并停止，不通过改变输入制造通过。
4. 合法提交终态为 `EXECUTION_SUBMITTED`；只有隔离环境无法建立且安全同范围替代已穷尽时才可 `BLOCKED`。

## 9. 提交前全是矩阵

以下每项必须全部为“是”后方可提交：

| 检查 | 必须为是 |
|---|:---:|
| L1-L5 固定附件全部存在、可读且相互勾稽 | 是 |
| L1 使用默认租户 `tenant=0`，超级管理员和低权限用户均从用户记录读回租户 | 是 |
| L1 并发恰一成功、refresh 行恰增一、身份权限与退出隔离通过 | 是 |
| L2 独立命令退出码为 0，三阶段轮换连续 | 是 |
| L3 四张截图、网络摘要和公开前缀一致 | 是 |
| L4 后端 clean 全量与前端四连串行全绿 | 是 |
| L4 正式 V44 基线未被当前分支迁移替代 | 是 |
| L5 覆盖整个 P45 回执树并零发现 | 是 |
| 临时凭据、验证码答案与密钥已销毁且未进入附件 | 是 |
| 已锁定项零改动，P45 状态仍为 VERIFYING | 是 |

