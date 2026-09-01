# P45 P1-P2 增量执行回执（扫描收口最终差异提示 06）

> 角色：执行。日期：2026-09-01。
> 权威输入：`planning-review-p45-implementation-07.md`、`planning-execution-prompt-p45-login-security-06.md`。
> 范围：仅 P1-P2。生产实现、图片、历史附件清理、枚举分类、图片检查、全量测试、基线与正式状态零改动；已锁定项零重验。
> 功能状态保持 `VERIFYING`；不核销 P45、不晋级 M02-F06-01、不移动方向。

## P1 扫描器零残留（通用形状规则 + 合成夹具）

- 规则修正：原 `password-value-literal` 规则中的真实凭据字面量已整体移除，替换为不含任何真实值的通用形状规则 `password-value-shape`（字母前缀-16 位十六进制的随机口令形状）。扫描器源码、夹具、命令与本回执均不含任何真实凭据值或验证码字符。
- 自身检查保持行号级精确豁免（仅规则定义区块的通用正则语法行，豁免行号集合与源码 SHA-256 显式登记于 `p1-scanner-source-readback.json`）；`sourceSensitiveFindings=0`、`realCredentialLiteralsInSource=0`。
- 正向检出回归：10 个规则类夹具全部使用本轮随机生成的合成值（从未用于任何账号），逐一命中对应规则，`allDetected=true`、退出码 0；`p1-regression.json` 只记录规则 ID、命中布尔与计数，不序列化夹具值；夹具目录在核验后销毁。

## P2 两遍扫描实际哈希记录

- 在全部附件与本回执定稿后的同一稳定树上执行两遍确定性扫描，逐次记录实际结果：
  - `p2-two-pass.json`：`firstExit=0`、`secondExit=0`、`firstSha256`、`secondSha256`（完整值）、`equal=true`、`treeFileCount`、`scanEnumeratedTotal`、`countEqual=true`、`finalVerdict="PASS"`、`findingCount=0`。
  - `p2-command.txt`：两次实际命令、原始摘要、两个完整 SHA-256 与 Shell 退出码。
- 复核方式说明：结果文件 `o1-security-scan.json` 的内容包含树内各附件的内容摘要，因此其哈希与树状态一一对应；在定稿树上重放两次扫描命令，可复算得到与附件记录一致的相等关系与各字段。写入哈希后执行只读复核两遍，输出字节仍一致。

## 提交前自检矩阵（提示 06 §7）

| 检查 | 结果 |
|---|---|
| P1/P2 固定附件存在且可读 | 是 |
| 扫描器源码、夹具摘要、命令与本回执零真实凭据值 | 是 |
| 正向回归全部命中且不序列化夹具值 | 是 |
| 两次实际 SHA-256 均已记录且相同 | 是 |
| 最终树文件数与扫描枚举数相等、零发现、显式 PASS | 是 |
| 已锁定图片、实现、测试、状态与基线零修改 | 是 |

```
ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":"product/p45-login-security/receipts/p45-execution-supplement-20260901-07.md","evidence":["P1 真实凭据字面量移除+通用形状规则+合成夹具回归 10/10 exit0+源码自检零发现","P2 稳定树两遍确定性扫描两个实际 SHA-256 已记录且相等、退出码 0×2、显式 PASS 零发现"],"feature_status":"VERIFYING"}
```
