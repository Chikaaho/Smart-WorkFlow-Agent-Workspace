# P45 执行补充回执 04（L1-L5）

角色：执行。日期：2026-09-01。

本回执承接最新审查记录与执行补充提示，不覆盖历史回执。用户已明确授权本地等价环境测试账号与验证码；本轮未以授权为由跳过执行。功能正式状态保持 `VERIFYING`，未写入 `passed/`、未改写 `todo/` 或规划终态。

## 执行变更

- 测试专用 `P45IsolationEvidenceTest` 改为默认租户 `tenant=0`，并补齐双用户身份、刷新、退出、权限拒绝和交叉会话断言；输出仅保留计数、状态和布尔结论。
- 证据网关支持临时后端地址和脱敏网络元数据日志，未改变生产网关或业务接口。
- 历史 receipt 保留原结论；清理历史可恢复的验证码示例，并移除本轮原始后端日志，保留脱敏汇总。

## L1 默认租户行为

- 8 路同一挑战并发：1 次成功、7 次 `2101`，refresh 数据库由 0 增至 1，失败请求无认证材料副作用，`l1-concurrency.json` 与 `l1-db-readback.json` 均为 `PASS`。
- 双用户均落在默认租户 0；身份独立。低权限用户不是超管且受保护权限被拒；各自 refresh 可恢复；管理员退出不会清除低权限会话，管理员退出后的 refresh 被拒。`l1-users.json`、`l1-cross.json` 均为正向结论。

## L2 密钥轮换

独立临时 RSA 双版本环境执行：v1 挑战签发；v2+v1 重叠期旧挑战接受；新挑战绑定 v2；仅 v2 时旧 v1 挑战拒绝。`l2-rotation-map.json` 与 `l2-command.txt` 为 `PASS`，无敏感值序列化。

## L3 真实浏览器链路

通过真实 `/sw/` 页面和 `/sw-server/api` 反代完成：真实验证码视觉输入登录成功；F5 停留 `/sw/dict`；受保护深链 `/sw/form/form-def-list` 直达；用户菜单退出回 `/sw/login`，退出后刷新仍未认证。网络元数据确认 refresh 请求携带 Cookie，日志不含 Cookie、Authorization 或敏感值。

证据：`l3-before.png`、`l3-after-f5.png`、`l3-deeplink.png`、`l3-after-logout.png`、`l3-network.json`、`l3-command.txt`。

## L4 全量验证与勾稽

- 后端：`MAVEN_OPTS="-Xmx2g -Djava.awt.headless=true" mvn clean test` 在允许 embedded PostgreSQL 共享内存的本机等价权限下退出 0；31 个模块全成功，Surefire 138 个报告文件汇总 982 tests / 0 failures / 0 errors / 0 skipped；P45 专项 3 tests / 0 failures / 0 errors / 0 skipped。
- 前端按顺序执行 `typecheck`、`lint`、`test`、`build`，全部退出 0；测试为 109 passed / 1 skipped，1059 passed / 3 skipped。
- 固定引用：后端 `develop@9b1d80f92e22bdee5786ca2727b643d62d242c45`；前端 `develop@103b636edd422b1784ec39f9c91470e45cb609a5`。工作树已有变更保留，未将其归因或混入 P45 生产状态。
- H2 与 PostgreSQL 均存在 V44、V45、V46；V45/V46 仅作当前工作树事实披露，未晋级正式基线。

## L5 清理与反向扫描

完整扫描 `product/p45-login-security/receipts` 文本证据 52 个文件、5 个 evidence 目录；私钥标记、Bearer 材料、令牌/Cookie 值、凭据/验证码值均 0 命中，`l5-security-scan.json` 为 `PASS`。原始后端日志已清除，清单和脱敏结果见 `evidence-p45-l1-l5/l5-cleanup-manifest.json`。

## 结论

本轮 L1-L5 执行与证据已提交；P45 功能状态仍为 `VERIFYING`，等待规划角色独立复核，不宣称规划验收完成。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":"product/p45-login-security/receipts/p45-execution-supplement-20260901-04.md","evidence":["L1 默认租户并发与双用户隔离：8 路 1 成功 7 拒绝，DB 恰增 1 行","L2 v1/v2 重叠与退役轮换正向通过","L3 真实浏览器登录、F5、受保护深链、退出后不可恢复","L4 后端 982/0/0/0、前端 typecheck lint test build 全通过","L5 receipt 全树扫描 52 个文本文件 0 命中"],"feature_status":"VERIFYING"}
