# P45 O1 证据卫生增量执行回执（最终零裁量提示 05）

> 角色：执行。日期：2026-09-01。
> 权威输入：`planning-review-p45-implementation-06.md`、`planning-execution-prompt-p45-login-security-05.md`、`p45-execution-supplement-20260901-05.md`。
> 范围：仅 O1 证据卫生。生产实现、测试、基线、正式状态零改动；已锁定项零重验。
> 功能状态保持 `VERIFYING`；不核销 P45、不晋级 M02-F06-01、不移动方向。

## O1-1 修改前截图像素级遮挡

`evidence-p45-n1-n5/n3-before-wrong-path.png` 验证码区域（矩形 x=620,y=440,w=160,h=58）以固定种子随机噪点不可逆覆盖；处理前 SHA-256 `206e99d7…`、处理后 SHA-256 见 `o1-cleanup-manifest.json`。遮挡后逐张读图复核：验证码区域 `captchaReadable=false`（不可恢复、不可辨识），登录页表单与 F5 路由失败语义完整保留，文件仍为真实 PNG（1280x720，魔数 `89504e47`）。

## O1-2 历史明文凭据与文本脱敏

- `evidence-p45-n1-n5/n5-cleanup-manifest.json`：历史凭据叙述以 `<REDACTED>` 占位替换（处理前后 SHA-256 见清单）。
- `supplement-evidence-p45-gaps-20260901.md`：扫描表达式样例中的凭据字面量以 `<REDACTED>` 替换。
- `evidence-p45-h1-h7/`、`evidence-p45-supplement-02/` 共 4 个脚本：输出键与字段名措辞清理（`pwdCipherField`、`answerFieldsRedacted`、`authFieldsRedacted`、`keyMaterialRedacted`、`serverKeyEnforced`），序列化输出不含凭据/答案/Token 值。
- 清理清单只含占位符、路径、类型、处理前后 SHA-256 与状态：`o1-cleanup-manifest.json`。

## O1-3 收紧后的全树扫描

新扫描器 `o1-security-scan.mjs`：

- 自身源码纳入检查（非整文件跳过）；仅对规则定义区块按行号精确豁免，豁免行号集合与源码 SHA-256 显式登记于结果 `scannerSelfInspection`。
- 规则覆盖 10 类：私钥材料、密码赋值、凭据值字面量（含本轮会话凭据格式与仓库 dev seed 值）、验证码答案型 JSON 输出、验证码文本叙述、JWT、refresh Cookie 值、Bearer、BCrypt 哈希、敏感输出调用。
- 正向检出回归：10 个受限夹具（置于会话临时目录，验证后销毁）逐一命中对应规则，`allDetected=true`、退出码 0；夹具不进入回执树。

## O1-4 全树勾稽与确定性两遍扫描

- `o1-enumeration.json`：回执树全路径枚举，与文本/脚本/图片/其他四类检查路径并集相等，每路径恰一次。
- `o1-security-scan.json` 显式含 `enumeratedTotal`、分类计数、`unionCheck=true`、`duplicatePathCount=0`、`uninspectedPaths=[]`、`findingCount=0`、`verdict="PASS"`、`scannerSelfInspection`。
- 两遍确定性扫描：全部附件与本回执定稿后运行两遍，结果 SHA-256 一致（数值记录于 `o1-command.txt`），第二遍退出码 0；其后回执树零修改。

## O1-5 图片检查

`o1-image-checks.json`：回执树全部 6 张图片逐张记录路径、SHA-256、实际编码（4 张 L3-P 历史附件实际编码为 JPEG，声明扩展名 PNG 的不一致如实登记，未重拍）、尺寸、检查方法、敏感发现数；`captchaReadable=false` 全部成立。

## 提交前自检矩阵（提示 05 §6）

| 检查 | 结果 |
|---|---|
| 六个固定附件全部存在且可读 | 是 |
| 敏感截图已像素级遮挡，路由失败语义可见 | 是 |
| 清理清单只含占位符和哈希 | 是 |
| 规则正向检出回归 10/10、退出 0 | 是 |
| 扫描器自身被检查且仅精确豁免规则定义行 | 是 |
| 全树枚举=检查并集、无重复无漏检 | 是 |
| 两遍扫描 SHA-256 相同、显式 PASS | 是 |
| 锁定项/生产实现/测试结果/正式状态/基线零修改 | 是 |

```
ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":"product/p45-login-security/receipts/p45-execution-supplement-20260901-06.md","evidence":["O1-1 n3 截图验证码区域像素级噪点遮挡且路由失败语义保留","O1-2 历史明文凭据与规则样例字面量以 <REDACTED> 替换并登记前后哈希","O1-3 新扫描器 10 类规则+正向检出回归 10/10 exit0+自身仅行号级豁免","O1-4 全树枚举与四类检查并集相等、两遍确定性扫描 SHA-256 一致、verdict PASS findingCount 0","O1-5 六张图片实际编码/尺寸/视觉检查登记 captchaReadable 全 false"],"feature_status":"VERIFYING"}
```
