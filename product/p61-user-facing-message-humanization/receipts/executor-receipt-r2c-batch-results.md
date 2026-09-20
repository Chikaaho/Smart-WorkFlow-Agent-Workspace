# P61 执行回执：R2c 批量结果汇总与安全下钻

> 执行角色：执行（Executor）
> 日期：2026-09-16
> 对应原子项：R2c（一级执行提示 01 §2）
> 证据目录：receipts/evidence/p61-r2c-01/

## 1. 三类批量操作的实际结果

### 批量导入（表单数据，`FormData.vue`）

- **原始缺陷**：`ImportResult`（totalRows/successCount/errorCount/errors[rowNum,message]）被存入 `importResult` 却**从未渲染**，用户只能看到一条 toast，看不到总量、也看不到哪些行失败。
- **修复**：新增导入结果弹窗，展示 总量 / 成功 / 失败 三项汇总，以及逐行「行号 + 原因」明细表；成功与部分失败都打开面板。失败原因取服务端 `errors[].message`（P61 Server 侧已按受众分层脱敏），不直出原始异常。

### 批量审批（`BatchApproval.vue`）

- **原始缺陷**：结果弹窗只列逐项 taskId/结果/原因，没有汇总计数；后端返回的 `{total, success, failed}` 被丢弃。
- **修复**：结果弹窗顶部新增 总量 / 成功 / 失败 汇总，取服务端返回值（不由前端按行数推算，避免与服务端真实结果不一致）。
- **处理中说明**：批量审批为同步逐项执行，契约中不存在「处理中」状态；回执如实说明，不虚构该状态。

### 批量通知（`NotifyBatchSend.vue`）

- **契约事实**：`NotifyBatchSendResp` 只有 `recipientCount`，服务端是整体成功/失败（无逐项结果）。
- **现状**：发送前通过 resolve-count + 确认框展示总量；成功后展示成功送达人数；失败走 `errorMsg` 错误态。不虚构逐项成功/失败。
- **边界**：若产品要求逐项结果，需要后端扩展契约，超出本轮授权（补充提示明确禁止扩大到真实 Provider 成功链）。

## 2. 过程中发现的真实缺陷（门禁盲区）

**跨行文本节点逃过硬编码门禁**：按钮文字换行书写（`>\n  批量通过\n</el-button>`）时，按行扫描永远匹配不到。这使 R1 曾报告的「未治理 0 行」被高估——实际还有 **66 行 / 62 个唯一文案** 未治理。

处置：

1. `p61-lib.mjs` 新增 `multilineTextNodes()`（整文件匹配、允许换行、排除插值），门禁改为按行扫描 + 整文件补扫双通道。
2. codemod 文本节点查找改为**空白归一后匹配**（与门禁同口径），否则门禁说未治理而 codemod 匹配不上。
3. 新增批次19（62 条文案）补齐键化，`TaskDetail` 的「确认」按钮收敛到 `common.confirm`。
4. 修复后门禁在**更严格口径**下重新归零（66 → 0）。

其余发现：`转办`/`委托` 两个按钮词与既有 `转办任务`/`委托任务` 键冲突，按 R2a 同义收敛原则各自独立键（按钮为动作词、弹窗标题为对象词），不共用键名。

## 3. 门禁原始流

`evidence/p61-r2c-01/raw-gates.txt`：typecheck / lint / test / build / failure-audit / term-audit / key-coverage / dictionary-validate / locale-single-source / hardcode-gate 共 10 项退出码均 0；测试 1207 passed / 3 skipped / 0 failed。

## 4. 状态与边界

R2c 的三类批量操作在 Web 侧已闭环。**边界**：「计数与实际结果一致」的运行时证明需要真实批次数据（构造混合成功/失败的导入文件与批量审批），归 R6b/R7 的真实运行链验证；本回执只声称结构与文案层完成。
