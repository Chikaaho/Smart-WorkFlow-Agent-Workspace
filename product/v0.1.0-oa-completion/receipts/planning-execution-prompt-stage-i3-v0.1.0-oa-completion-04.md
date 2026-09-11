# P60 I3 三级继续收敛执行提示 04

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-12  
> 唯一依据：`planning-review-stage-i3-v0.1.0-oa-completion-05.md`  
> 下一回执：`stage-i3-v0.1.0-oa-completion-07.md`

## 1. 唯一入口与锁定项

本提示替代提示 03，作为 I3 当前唯一补充执行入口。新证据根固定为 `product/v0.1.0-oa-completion/receipts/evidence/i3-07/`。

禁止重验或复制：G1a/G1b/G2/G3、G4a/G4b/G5、G6、G8a、G9/G10/G11 的已锁定行为、G13a、G17b、i3-04 manifest。允许以哈希指针引用锁定附件；Z5 仅从既有行为附件派生机器汇总。

## 2. 唯一剩余矩阵

| 包 | 必须完成 | 反向提交门 |
|---|---|---|
| R0 凭证清零 | 对 i3-03—i3-07 扫描 JWT、Bearer、`accessToken/access_token/refreshToken/refresh_token` 的任意非占位正文，不设会漏掉短令牌的长度下限；原地不可逆脱敏；输出仅文件名和计数。 | 任一非占位正文计数非 0，禁止提交；不得打印值、生成备份、压缩包或 `/tmp` 副本。 |
| R1 最终候选封装 | 保留已完成的 frozen-e 门禁结果；将唯一 `candidate.json` 收口到 frozen-e，并让回执、candidate、实例重启记录、行为摘要中的 JAR/Web/source hash 与 PID 演进一致；补齐 Server/Web 各门禁 command 文件。 | 不得重跑已通过门禁，除非发生代码或 package 变化；不得同时保留可被当作当前入口的 frozen-a candidate。 |
| R3 RETURN 补证 | 只补 G7 的主表单 before/after、允许修改范围、实际修改结果、二轮路径和历史回看对象链。 | before/after/scope 任一为空或旧轮次出现双活任务，失败。 |
| R5 生命周期汇总 | 从 i3-06 `Z5/z5-actions.json` 派生 `R5/assertions.json`，逐类统计空 assignee/comm/trace/audit/cancelReason、错误 code 0、PENDING 残留和第二副作用。 | 不得重跑 G9/G10/G11；任一失败计数非 0，失败。 |
| R6 调度收口 | 以唯一最终摘要作废旧失败项；补真实提醒通知行、人工催办记录与通知行；把 A/B 实际 PID、同 JAR hash、重启原因、共同 deadline、认领/跳过和唯一终态串成一条链。 | `error` 字段、空通知/催办行、PID 不可解释、共同 deadline 不成立或第二副作用非 0，失败。 |
| R7 handleResult 反向边界 | 保留合法 `audit_note` 写回；重新执行准确的注册表和生产脚本入口扫描，保存原始 command/output/exit，登记三条内建 bean 行并证明脚本引擎/上传端点命中 0。 | `registry_rows` 为空、脚本入口命中非 0、字段与 verdict 相反，失败；不得重跑 G13a。 |
| R8 意见表单 | 使用真实存在但包含禁用组件的意见表单证明 config/validate/publish/submit 四层契约拒绝；普通、会签、加签、补签、退回分别给出初始化、提交、表态行、快照、历史回显、非空主表单 before/after 及逐字段 diff；补版本变化前后 snapshot hash。 | “表单不存在”不得冒充组件禁用；空主表单、空补签表态行、空 round、缺历史回显或缺版本 hash，失败。 |
| R9 权限与总账 | 为设计/发布、办理、加签、补签、转办、委托、代理、撤回、沟通、废弃、时限管理逐项补页面或深链、API 正向及非职责负向；以 requestId 关联实际对象。基于修订后的 R3/R6/R8 重新生成完整总账。 | 只测菜单、只测少数职责、身份空、越权副作用、跨租户泄漏、空字段、重复结果或 HTTP 500 任一非 0，失败。 |
| R10 终态封装 | R0—R9 全部通过后生成 i3-07 全量 manifest、终态 payload，并对包内原 payload 实跑 Validator；回执字段与 payload hash 同源。 | 上游未全过不得生成；任何附件后改必须重建 manifest/payload/Validator。 |

## 3. 固定顺序

1. 先完成 R0；若发现正文，脱敏后重建受影响旧目录 manifest。
2. 完成 R1 封装修正；无代码变化不得重跑门禁或重打包。
3. 只补 R3、R5、R6、R7、R8、R9；已锁定行为只引用，不复制、不重采。
4. 所有实际字段与断言一致后才生成 R10。
5. 仅当 R0—R10 全部通过，提交回执 07；合法状态仍为 `VERIFYING / EXECUTION_SUBMITTED`。

## 4. 禁止事项

- 禁止把摘要 `PASS`、`unchanged=true` 或 verdict 当作空字段的替代。
- 禁止通过删除失败字段而不提供替代原始证据来收口。
- 禁止修改需求方向、正式状态、清单计数或 P 编号。
- 禁止提前写 `PASSED/COMPLETED`、移动正式方向、创建标签或发布版本。

