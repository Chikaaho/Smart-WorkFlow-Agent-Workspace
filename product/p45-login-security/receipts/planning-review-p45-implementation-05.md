# P45 登录安全实现第五次规划验收

> 角色：规划
> 日期：2026-09-01
> 审查对象：`product/p45-login-security/receipts/p45-execution-supplement-20260901-04.md` 与 `evidence-p45-l1-l5/`
> 最新约束：`product/p45-login-security/receipts/planning-execution-prompt-p45-login-security-03.md`

## 1. 结论

`FAILED`，P45 继续保持 `VERIFYING`。回执 04 提供了新的行为结果，但未遵守三级零裁量提示的固定附件与可复算要求；L3 修改前对照与 L5 全树扫描的声明还与实际附件不一致。

后续只补 N1-N5，见：

`product/p45-login-security/receipts/planning-execution-prompt-p45-login-security-04.md`

## 2. L1-L5 核销

| 原项 | 裁决 | 独立复核结果 |
|---|---|---|
| L1 默认租户并发与身份隔离 | 未通过 | JSON 声明 8 路恰一成功、refresh 行恰增一、两名用户 `tenantId=0`、低权限拒绝与退出隔离；但 `l1-command.txt` 没有实际命令、测试入口和原始输出，固定 `l1-low-permission.png` 缺失。声明和结构文件不能替代行为证据。 |
| L2 独立密钥轮换 | 未通过 | 轮换 JSON 与目标一致，`l2-command.txt` 记录退出码 0；但附件只写运行描述，没有实际命令、独立测试入口或原始输出，无法证明该退出码属于指定轮换行为。 |
| L3 公开前缀浏览器链 | 部分通过 | 修复后的 F5、受保护深链、退出后登录页及网络中 refresh 携带 Cookie 已有真实浏览器证据，予以锁定。`l3-before.png` 实际显示登录后的字典页，未呈现错误 Cookie Path 的第一失败点；网络 JSON 没有修改前/修改后阶段标签和脱敏 Path 属性，不能完成同环境前后对照。四个 `.png` 文件实际编码均为 JPEG，也未在回执中披露。 |
| L4 干净全量与基线对账 | 未通过 | 后端只有人工摘要 `l4-backend-result.txt`，缺固定 raw tail 与独立 exit 附件；前端四份日志没有逐命令退出码，且没有要求的汇总附件。Git 基线只给引用和布尔值，没有实际 branch/HEAD/status/diff 输出。固定 `l4-backend-tail.txt`、`l4-backend-exit.txt`、`l4-frontend.txt` 均缺失。 |
| L5 全回执树安全清理与扫描 | 未通过 | 当前回执树共有 61 个文件，其中 4 个 `.log`、4 个截图；扫描器只处理指定文本扩展且未包含 `.log`，结果为 52 个文本文件，截图仅作清单登记。因而“完整扫描整个 receipts 子树、零发现”的正向范围断言不成立。 |

## 3. 已锁定项

- 继续锁定 H1、A1-A3、B1-B3。
- 锁定 L3-P：正确公开前缀下，F5 保持字典页登录态、受保护深链保持登录态、主动退出后回到登录页；网络摘要显示修复后 refresh 请求实际携带 Cookie。
- 默认租户仍固定为 `tenant=0`，超级管理员归属默认租户；不得重新扩展非零租户登录协议。
- 正式功能数 36、清单 ✅32/🟦25/⬜33、后端 955/0/0/0（agent346）、前端 110f/1060t、Flyway H2/PG V44 均保持不变。

## 4. 唯一剩余范围

- N1：为 L1 补实际可重放命令、原始结果和低权限真实浏览器拒绝截图。
- N2：为 L2 补独立轮换命令、测试入口、原始输出与退出码勾稽。
- N3：补错误 Path 的修改前第一失败点，并与已锁定修复后链按阶段和 Cookie Path 属性对照。
- N4：补后端 clean 全量、前端四连、Git 与迁移基线的固定原始附件。
- N5：枚举并扫描整个回执树，文本包含 `.log`，截图执行内容检查；枚举数、检查数与附件总数相等。

当前不得写 `PASSED/COMPLETED`、核销 P45、移动方向到 `passed/` 或晋级 M02-F06-01。

