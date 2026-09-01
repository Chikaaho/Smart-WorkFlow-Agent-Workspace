# P45 登录安全扫描收口最终差异提示

> 适用状态：VERIFYING
> 日期：2026-09-01
> 唯一范围：P1-P2；其余全部锁定

## 1. 权威输入

1. `product/p45-login-security/receipts/planning-review-p45-implementation-07.md`
2. `product/p45-login-security/receipts/planning-execution-prompt-p45-login-security-05.md`
3. `product/p45-login-security/receipts/p45-execution-supplement-20260901-06.md`

## 2. 唯一差异矩阵

| 编号 | 当前差异 | 唯一目标 |
|---|---|---|
| P1 | 扫描器规则源码含真实凭据字面量，并豁免该规则行 | 规则改为通用形状、熵/上下文或不可逆摘要比较；源码、夹具、回执和结果均不含任何真实凭据值 |
| P2 | 两遍扫描只声明相同，没有两个实际哈希 | 固定附件记录第一遍 SHA-256、第二遍 SHA-256、两次退出码和 `equal=true`，值可由文件实际复算 |

## 3. 允许与禁止范围

只允许修改：

- `evidence-p45-o1/o1-security-scan.mjs`
- `evidence-p45-o1/o1-security-scan.json`
- `evidence-p45-o1/o1-command.txt`
- 必要的 O1 枚举/清理哈希读回附件
- 一份 P1-P2 增量执行回执

禁止：

- 不修改图片、生产实现、测试、方向、历史规划审查、需求池、memory、正式状态或基线。
- 不运行后端、前端或浏览器行为测试。
- 不在规则、注释、夹具、命令或回执中写入任何已知真实凭据或验证码字符。
- 不用规则行豁免隐藏具体敏感字面量；豁免行必须只含通用正则语法。

## 4. P1 固定证据

在 `evidence-p45-o1/` 追加：

- `p1-scanner-source-readback.json`
- `p1-regression.json`

扫描器使用与真实值无关的通用规则；正向检出夹具只使用本轮随机生成、从未用于任何账号的合成值。`p1-scanner-source-readback.json` 记录扫描器 SHA-256、自身检查行、豁免规则 ID、源码敏感发现数 0。`p1-regression.json` 只记录规则 ID、命中布尔值和计数，不记录夹具值。

正向目标：所有规则正向夹具均被检出，扫描器源码被检查且零敏感发现。

零残留目标：扫描器、夹具摘要、命令、回执和整个 receipts 树均不含真实凭据值；无整文件或含敏感值行豁免。

## 5. P2 固定证据

在 `evidence-p45-o1/` 追加：

- `p2-two-pass.json`
- `p2-command.txt`

在所有附件与增量回执定稿后，对同一稳定树执行两遍确定性扫描。`p2-two-pass.json` 必须包含：

- `firstExit=0`
- `secondExit=0`
- `firstSha256`
- `secondSha256`
- `equal=true`
- `treeFileCount`
- `scanEnumeratedTotal`
- `countEqual=true`
- `finalVerdict="PASS"`
- `findingCount=0`

`p2-command.txt` 记录两次实际命令、原始摘要、两个完整哈希和 Shell 退出码。第二遍结束后不得再修改回执树；如需写入哈希附件，先准备固定附件，再执行最终只读复核，确保附件中的哈希与最终结果文件可复算一致。

正向目标：同一稳定树两遍输出字节一致，两个实际 SHA-256 相同，最终枚举数与树文件数相同且显式 PASS。

零残留目标：零敏感值、零未检查路径、零扫描结果后修改、零锁定项重验。

## 6. 相对提示 05 收紧

- 不再处理图片或历史附件，只修扫描器源码与两遍哈希证据。
- 真实凭据不得作为规则样例；只使用通用规则或随机合成夹具。
- “相同”“通过”等文字不构成 P2 证据，必须提供两个完整可复算哈希。

## 7. 提交前全部为是

| 检查 | 必须为是 |
|---|:---:|
| P1/P2 四个固定附件存在且可读 | 是 |
| 扫描器源码、夹具摘要和新回执零真实凭据值 | 是 |
| 正向回归全部命中且不序列化夹具值 | 是 |
| 两次实际 SHA-256 均已记录且相同 | 是 |
| 最终树文件数与扫描枚举数相等、零发现、显式 PASS | 是 |
| 已锁定图片、实现、测试、状态与基线零修改 | 是 |

合法终态为 `EXECUTION_SUBMITTED`；任一项不能满足时只能提交 `BLOCKED`。

