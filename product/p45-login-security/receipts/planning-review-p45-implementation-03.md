# P45 登录安全实现第三次规划验收

> 角色：规划
> 日期：2026-09-01
> 审查对象：`product/p45-login-security/receipts/p45-execution-supplement-20260901-02.md` 及 `evidence-p45-h1-h7/`、`evidence-p45-supplement-02/`
> 上轮提示：`product/p45-login-security/receipts/planning-execution-prompt-p45-login-security-01.md`

## 1. 结论

`FAILED`，功能继续保持 `VERIFYING`。一级提示后仍未完成行为证据，现升级为二级提示：

`product/p45-login-security/receipts/planning-execution-prompt-p45-login-security-02.md`

执行回执声明的外部 `BLOCKED` 不成立：H2-H5 所需账号和 RSA 版本可以在隔离 H2/Redis 证据环境中临时生成；验证码可通过隔离测试输入通道或真实浏览器视觉交互完成，不需要生产凭据。安全的同范围替代尚未穷尽。

## 2. 核销结果

| H 编号 | 裁决 | 依据 |
|---|---|---|
| H1 | `PASSED`，锁定 | 真实 Redis 记录只有 HMAC 摘要和必要元数据；无服务端密钥的完整四位候选检查零命中；缺少摘要密钥时装配拒绝测试退出码为 0 |
| H2 | 未通过 | 仅提供安全脚本，没有真实并发结果、数据库前后计数或失败零副作用附件 |
| H3 | 未通过 | 没有当前/重叠/退役三阶段运行映射；现有旧附件仍不构成连续链 |
| H4 | 未通过 | 只有登录前页面 JSON，没有登录、Cookie、F5、深链、退出截图和网络附件 |
| H5 | 未通过 | 没有双用户真实行为、权限拒绝、tenantId 派生和会话恢复附件 |
| H6 | 未通过 | 979 来自定向测试命令后聚合整个未清理 Surefire 目录，不能证明本轮全量；前端四连未运行。V45/V46 仍只证明存在，未证明持久状态已接受 |
| H7 | 未通过 | 扫描范围仅 `evidence-p45-supplement-02/`，未覆盖实际使用的 `evidence-p45-h1-h7/`、旧证据目录和新回执；旧附件的安全清理没有清单或扫描结果 |

## 3. 新锁定项

- C1：H1 答案摘要保护通过，不再重验 HMAC 算法、候选枚举或缺密钥拒绝。
- 继续锁定 A1-A3、B1-B3。

后续不得重新展开 H1、G2、双 Token、验证码载荷、租户登录契约或终态纪律。

## 4. 唯一剩余范围

只剩 K1-K6：并发零副作用、密钥轮换连续链、公开前缀浏览器链、双用户/租户派生隔离、干净全量与基线对账、全证据面安全扫描。具体输入和输出以二级提示为准。

