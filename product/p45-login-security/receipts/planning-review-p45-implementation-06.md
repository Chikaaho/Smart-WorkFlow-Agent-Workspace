# P45 登录安全实现第六次规划验收

> 角色：规划
> 日期：2026-09-01
> 审查对象：`product/p45-login-security/receipts/p45-execution-supplement-20260901-05.md` 与 `evidence-p45-n1-n5/`
> 最新约束：`product/p45-login-security/receipts/planning-execution-prompt-p45-login-security-04.md`

## 1. 结论

`FAILED`，P45 继续保持 `VERIFYING`。N1、N2、N4 及 N3 的 Cookie Path 前后行为已经具备可复核证据并锁定；当前唯一剩余项为 O1：清除证据树中的敏感残留，并以能够实际发现这些残留的规则完成全树复扫。

唯一后续提示：

`product/p45-login-security/receipts/planning-execution-prompt-p45-login-security-05.md`

## 2. N1-N5 核销

| 项目 | 裁决 | 独立复核结果 |
|---|---|---|
| N1 | `PASSED`，锁定 | 完整 Maven 命令指定两个独立方法，原始输出为 2/0/0/0、BUILD SUCCESS、Shell 退出码 0；既有三份 L1 JSON 的 SHA-256 读回一致；真实 PNG 显示低权限访问返回 403。 |
| N2 | `PASSED`，锁定 | 完整 Maven 命令指定独立轮换方法，原始输出为 1/0/0/0、BUILD SUCCESS、Shell 退出码 0；轮换 JSON 哈希与四阶段读回一致。 |
| N3 行为 | `PASSED`，锁定 | 修改前同一公开前缀使用 `/api/auth/` Path，refresh 不携带 Cookie并回到登录页；修改后 `/sw-server/api/auth/` 覆盖公开 URL，引用的已锁定 L3-P 哈希一致。 |
| N3 零残留 | 未通过，并入 O1 | 修改前截图仍能直接辨识验证码字符，不满足证据中零验证码答案要求；执行回执和图片检查却声明无敏感值，结论冲突。 |
| N4 | `PASSED`，锁定 | 后端 clean 全量 BUILD SUCCESS、退出码 0，137 XML 机械合计 979/0/0/0 且逐模块之和为 979；前端四连各退出 0，110 files/1062 tests 全通过；Git 实际读回和 V44/V45/V46 归属对账完整，未晋级正式基线。 |
| N5 | 未通过 | 全树枚举 83 个文件与 66 文本、11 脚本、6 图片的并集勾稽成立，但清理清单自身仍序列化了一项历史明文凭据，修改前截图仍包含可辨识验证码。扫描规则只覆盖少数固定格式，不能识别这两类实际残留；扫描器还通过整文件分支直接跳过自身内容，而非仅豁免规则字面量。`n5-security-scan.json` 没有显式 `verdict` 字段，图片检查结论也不是扫描器生成结果。 |

## 3. 最新锁定集合

- H1、A1-A3、B1-B3。
- L3-P 修复后 F5、深链、退出及 refresh 携带 Cookie。
- N1 默认租户并发、双用户身份与权限隔离。
- N2 RSA v1/v2 重叠与退役轮换。
- N3 Cookie Path 修改前第一失败点与修改后恢复行为。
- N4 后端 979/0/0/0、前端 110 files/1062 tests 全通过、Git/迁移对账；这些是功能验收候选基线，正式基线仍保持原值直到阶段三同步。

上述项目禁止重跑、重拍或重新解释。默认租户继续固定为 `tenant=0`，非零租户登录协议不在 P45 范围。

## 4. 唯一剩余范围

O1 只处理证据卫生：对可辨识验证码截图和含历史明文凭据的清理清单进行安全化处理；收紧扫描规则以覆盖凭据叙述、验证码文本/图像、脚本自身和全部文件；提交枚举、扫描、图片检查、命令退出码与零残留勾稽。

当前不得写 `PASSED/COMPLETED`、核销 P45、移动方向到 `passed/`、晋级正式基线或改动生产实现。

