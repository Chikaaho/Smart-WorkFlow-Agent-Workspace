# P45 登录安全实现第四次规划验收

> 角色：规划
> 日期：2026-09-01
> 审查对象：`product/p45-login-security/receipts/p45-execution-supplement-20260901-03.md` 与 `evidence-p45-k1-k6/`
> 上轮提示：`product/p45-login-security/receipts/planning-execution-prompt-p45-login-security-02.md`
> Owner 补充：默认租户可用，超级管理员归属 `tenant=0`

## 1. 结论

`FAILED`，P45 继续保持 `VERIFYING`。本轮回执没有满足 K1-K6 的固定证据契约，且命令退出码、K6 扫描范围与附件声明存在不可勾稽项。

Owner 已明确当前产品口径：未显式选择租户的登录使用默认租户 `tenant=0`，超级管理员属于默认租户。执行夹具使用非零租户账号造成的认证失败，不构成 P45 方向冲突，也不要求本轮新增非零租户登录协议。该口径已追加到：

`product/p45-login-security/ready/direction-p45-login-security-evidence-supplement-02.md`

连续两级执行提示仍未收敛，现下发三级零裁量提示：

`product/p45-login-security/receipts/planning-execution-prompt-p45-login-security-03.md`

## 2. 原子裁决

| 项目 | 裁决 | 证据与原因 |
|---|---|---|
| K1 并发与零副作用 | 未通过 | `k1-concurrency.json` 为 8 路零成功，业务码为 7 次 2101 与 1 次 2104；`k1-db-before-after.json` 为 refresh 行增量 0，未达到恰一成功、恰增一。`k1-command.txt` 记录退出码 0，而回执正文记录测试退出码 1，二者矛盾。 |
| K2 密钥轮换 | 未锁定 | `k2-rotation-map.json` 的三阶段布尔结果与目标一致，但 `k2-command.txt` 记录整套测试退出码 1，没有独立、退出码为 0 的 K2 命令证据。 |
| K3 公开前缀浏览器链 | 未提交 | 四张固定截图、网络摘要和命令附件均不存在。 |
| K4 身份与权限隔离 | 未提交 | 未提供双用户登录/恢复、低权限拒绝、交叉挑战、数据库租户读回和退出隔离附件。非零租户夹具不符合现已明确的默认租户验收输入。 |
| K5 干净全量与基线 | 未提交 | 后端 `clean test`、前端四连、全新 Surefire 聚合、Git 与迁移对账附件均不存在。 |
| K6 全证据安全 | 未通过 | 缺少 `k6-security-scan.json` 与 `k6-command.txt`；清理清单只覆盖部分旧脚本，未证明整个 P45 回执树及证据脚本零发现。 |

## 3. 锁定边界

- 继续锁定 H1、A1-A3、B1-B3，不得重验或改写。
- K2 的行为映射可复用为输入，但只有独立命令退出码为 0 且附件自洽后才能锁定。
- P45 当前不新增租户选择器、跨租户账号查询或非零租户登录流程。
- 正式功能数 36、清单 ✅32/🟦25/⬜33、后端 955/0/0/0（agent346）、前端 110f/1060t、Flyway H2/PG V44 均不变。

## 4. 唯一剩余范围

只剩 L1-L5：默认租户并发与双用户身份隔离、独立密钥轮换、公开前缀浏览器链、干净全量与基线对账、全回执树安全清理与扫描。固定输入、命令、附件和提交矩阵以三级提示为准。

当前不得写 `PASSED/COMPLETED`、核销 P45、移动方向到 `passed/` 或晋级 M02-F06-01。

