# P60 I1 二级执行补充提示 02

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-09  
> 功能：P60 `v0.3.0-oa-completion` / I1 组织与权限底座  
> 权威审查：`planning-review-stage-i1-v0.3.0-oa-completion-03.md`

## 1. 当前唯一入口与替代关系

本提示替代 `planning-execution-prompt-v0.3.0-oa-completion-i1-01.md`，作为 I1 当前唯一补证执行入口；提示 01 及回执 01—03 只作追溯和锁定证据指针，不再同时作为执行待办。

精确输入仅为：

1. `planning-review-stage-i1-v0.3.0-oa-completion-03.md`；
2. `stage-i1-v0.3.0-oa-completion-03.md` 的最后一行和 G7b 段；
3. `evidence/i1-03/MANIFEST-SHA256.txt`、`manifest-verify.txt`、`terminal-validator.txt`；
4. 治理定义的终态 Validator/terminal contract，仅用于按正式接口运行校验。

主方向与授权边界不变。本轮是纯报告封装修正，不得进入实现仓或知识库扩展工作。

## 2. 唯一剩余缺口矩阵

父原子 G7b 已拆分为 G7b1/G7b2；G7b1 已通过并锁定，本轮唯一 actionable 原子如下：

| 原子 ID | 分类与最新失败事实 | 完成条件 | 必要反向断言 | 对象身份 | 最小充分证据 | 允许沿用 | 下一动作 | 合法停止条件 |
|---|---|---|---|---|---|---|---|---|
| G7b2 | 纯报告转录/缺证据：回执 03 正文与实际 manifest 为 18 项，但终态 JSON 两处仍写 16；`terminal-validator.txt` 无实际 input/stdout/stderr | 回执 04 最后一行与实际 Validator 输入逐字节相同；正式 Validator exit=0；实际 input、stdout、stderr、exit 均原样落盘；终态载荷不含与当前证据冲突的固定计数，账本只剩本原子且完成后为 0 | 不得只写 `True`/PASS 摘要；不得手改 Validator 输出；不得在终态中继续出现 16/18 冲突；不得把历史回执 03 原地改写 | 回执 04 的最后一行、同一次 Validator 调用、`evidence/i1-04/` 四类原始输出 | `terminal-input.txt`、`terminal-stdout.txt`、`terminal-stderr.txt`、`terminal-exit.txt`、保存命令与 `cmp` 实际退出码的 `terminal-roundtrip-verify.txt` | G7b1 的 i1-03 18 项 manifest；全部业务、候选指纹、工程门禁 | 用程序生成一次最终 terminal JSON，写入回执 04 最后一行并作为 Validator 实际输入；捕获原始四项后执行字节级比较 | 无合法停止例外；这是本地可执行报告封装动作 |

## 3. 锁定项与禁止重验

审查 03 已锁定：ADV、G1a/G1b、G2a/G2b、G3a/G3b、G4、G5a/G5b、G6、G7a、G7b1、Server/Web 最终门禁和候选指纹。

本轮必须遵守：

- 不修改 Server/Web 代码、配置、数据库或运行场景；
- 不重跑浏览器、HTTP、SQL、流程和工程门禁；
- 不修改回执 01—03、历史审查、`evidence/i1-03/`；
- 仅新增回执 04 与 `evidence/i1-04/` 的终态往返证据。

如发现锁定文件已经外部变化，只报告指纹变化及其真实结果，不自行扩范围修复。

## 4. 相对一级提示 01 的新增与收紧约束

- 删除：G1b、G2b、G3b、G5b 和 G7b1 已通过内容，全部从待办移除。
- 原子化：G7b 拆为已锁定 G7b1 与唯一剩余 G7b2，终态协议不再与 SHA 清单混合重做。
- 替代路径：不接受“比较为 True”的二次摘要，改为保存同一次正式 Validator 调用的实际输入、stdout、stderr、exit，并用 `cmp` 做字节级复核。
- 可判定提交条件：§7 矩阵全部为“是”，且回执 04 最后一行不存在固定文件数误报，才允许提交。

## 5. 允许范围与执行顺序

| 维度 | 内容 |
|---|---|
| 允许读取 | §1 的精确输入、正式 terminal contract/Validator 调用入口 |
| 允许修改 | 仅新增 `stage-i1-v0.3.0-oa-completion-04.md` 与 `evidence/i1-04/` 原始终态文件 |
| 允许命令 | 生成 JSON、正式 Validator 调用、stdout/stderr 重定向、记录 exit、`tail`/`cmp`/JSON 解析等只读核对 |
| 执行顺序 | 冻结回执 04 正文 → 程序生成唯一 terminal JSON → 同一内容写为回执最后一行与 Validator 输入 → 运行正式 Validator并原样捕获 stdout/stderr/exit → `cmp` 与 JSON/事实核对 → 提交回执 |
| 禁止事项 | 业务或工程重验、实现变更、改写历史、手写 PASS 替代原始输出、把错误固定计数带入新终态、提前进入 I2 |

## 6. 原始输出字段与证据格式

`evidence/i1-04/` 至少保存：

1. `terminal-input.txt`：正式 Validator 实际收到的完整输入，保持原始字节；
2. `terminal-stdout.txt`：正式 Validator 原始 stdout，空输出也保留 0 字节文件；
3. `terminal-stderr.txt`：正式 Validator 原始 stderr，空输出也保留 0 字节文件；
4. `terminal-exit.txt`：同一次调用的十进制退出码；
5. `terminal-roundtrip-verify.txt`：声明 cwd、实际调用命令、从回执抽取最后一行的命令、`cmp` 退出码、JSON 解析退出码和事实核对结果。

回执证据项按四要素写：`G7b2 → 原始文件 → 实际结果 → 覆盖边界`。不得将命令预期、手写结论或聊天文本冒充原始流。

终态 JSON 必须：

- `state=EXECUTION_SUBMITTED`、`feature_status=IN_PROGRESS`；
- 仅登记 G7b2 为本轮工作项，关闭后 `remaining_actionable_count=0`；
- `next_action_type=WAIT_PLANNER`，下一动作是等待 Planner 验收 I1；
- 通过证据路径引用既有锁定结果，不宣称修改或重跑它们；
- 对 i1-03 manifest 使用“Planner 已锁定的 18 项清单”或不写固定数，禁止再写错误的 16；
- 回执最后一行与 `terminal-input.txt` 逐字节相同。

## 7. 提交前核对矩阵

| 核对项 | 允许提交值 |
|---|---|
| 回执 04 最后一行与 `terminal-input.txt` 字节级比较 | `cmp` exit=0 |
| Validator 输入 | 与上述同一 `terminal-input.txt`，非事后重写 |
| Validator stdout/stderr | 同一次调用原样落盘，含 0 字节情形 |
| Validator exit | 真实 exit=0 |
| JSON 语法与 terminal contract | 实际解析/正式 Validator 通过 |
| 证据事实 | 无 16/18 冲突，无业务重跑/实现变更虚假声明 |
| 账本 | 仅 G7b2，关闭后 remaining=0 |
| 阶段边界 | I1 仍等待 Planner，未进入 I2 |

任一项为否，继续执行或如实保留 G7b2 actionable；不得提交零剩余动作。

## 8. 合法终态

Executor 不得自行写 I1 `PASSED/COMPLETED`。回执 04 合法状态仍为 `EXECUTION_SUBMITTED / VERIFYING`，提交后等待 Planner 独立验收。只有 Planner 明确判定 I1 PASSED 后，才可按 P60 主方向进入 I2。

