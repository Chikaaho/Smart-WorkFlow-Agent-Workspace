# 功能交接摘要

## 1. 功能名称
P60 CH-aPaaS v0.1.0 OA 全功能收口（`v0.1.0-oa-completion`）。

## 2. 最终状态
**IN_PROGRESS（2026-09-12）**。I1、I2 `COMPLETED（规划已确认）`；I3 回执 06 经规划验收 05 未通过，保持 **VERIFYING**；I4—I6 未开始。正式功能数 44、清单 ✅46/🟦22/⬜22、P4/P34/P35/P47/P60 均不核销。

## 3. 本轮验收结论
回执 06 的自研设计器真实浏览器全链、审批动作语义、会签规则和多数生命周期动作成立并已锁定；但附件仍存在以下直接反证：

- 验收时 i3-03/i3-04 检出 119/154 个非占位 accessToken 值；推送前已完成安全脱敏，但 R0 正式证据仍须由 Executor 按提示 04 封装；
- `Z1/candidate.json` 和实例重启记录仍指向 frozen-a，未与 frozen-e/PID 演进收口，门禁 command 文件缺失；
- RETURN 缺表单 before/after/scope；Z5 缺强制 assertions 汇总；
- Z6 保留 error，提醒/催办通知行为空，调度 PID 链不一致；
- Z7 注册表为空且脚本引擎扫描值为 1，却写成零；
- Z8 禁用组件以“表单不存在”冒充契约拒绝，普通主表单前后为空，补签表态行为空；
- Z9 只覆盖少量职责，未形成逐职责页面/深链/API 正负矩阵；
- Z10 manifest/Validator 虽自洽，但因上游未全过而没有终态效力。

## 4. 已锁定、禁止重验
G1a/G1b/G2/G3、G4a/G4b/G5、G6、G8a、G9/G10/G11 的既有行为、G13a、G17b、i3-04 manifest。Z5 仅允许从既有附件派生断言汇总。

## 5. 当前唯一执行入口
`product/v0.1.0-oa-completion/receipts/planning-execution-prompt-stage-i3-v0.1.0-oa-completion-04.md`

依据审查：`product/v0.1.0-oa-completion/receipts/planning-review-stage-i3-v0.1.0-oa-completion-05.md`

下一回执：`product/v0.1.0-oa-completion/receipts/stage-i3-v0.1.0-oa-completion-07.md`

新证据根：`product/v0.1.0-oa-completion/receipts/evidence/i3-07/`

## 6. 下一轮固定范围
只处理 R0 凭证清零、R1 frozen-e 候选/PID/command 封装、R3 RETURN 表单范围、R5 已锁定行为汇总、R6 调度通知与 PID 链、R7 生产反向扫描、R8 意见表单、R9 权限总账、R10 终态封装。禁止重跑锁定行为、扩大需求、改变正式状态或提前终态。

## 7. 新机器启动提示词
本会话角色声明为执行。先完整读取 `system.md`、`roles/executor.md`、`project.md`、两端工程宪法，再读取 I3 正式方向、规划验收 05 与三级继续收敛提示 04。只处理提示 04 的 R0/R1/R3/R5/R6/R7/R8/R9/R10，禁止重验锁定项。全部真实字段与断言一致后提交回执 07 和 `evidence/i3-07/`；合法状态保持 `VERIFYING / EXECUTION_SUBMITTED`，不得提前写 PASSED/COMPLETED。

## 8. Git 边界
本次 Planner 只完成规划验收及 Planner 范围文档同步。Planner 角色无 Git commit/push 权限；工作区所有改动尚未由本会话提交。换机前如需提交，Owner 必须显式切换为“执行”或“管理员”，再由相应角色按三仓库实际状态完成提交与回读。
