# P60 / 0.1.0 发布回执一级原子补充提示 01

> 日期：2026-09-15  
> 来源：`planning-review-release-v0.1.0-server-web-01.md`  
> 范围：仅回执机器契约和证据脱敏；发布行为已经锁定

## 1. 必做原子项

1. 对`evidence/release-v0.1.0-server-web-01/`内所有日志做凭据形态复扫，将完整`accessToken`、`refreshToken`、Bearer值及同类可复用令牌替换为稳定脱敏占位符；保留测试名称、HTTP状态、业务码、身份勾稽、测试计数、失败原因和最终退出结果。复扫必须证明普通证据中不再存在完整令牌。
2. 在`release-v0.1.0-server-web-01.md`补记脱敏范围与复扫结果，并把符合`.codex/governance/terminal-contract.json`的`ENGINE_TERMINAL`对象作为文件最后一行。状态使用`EXECUTION_SUBMITTED`，不得写P60已完成。
3. 终态必须完整携带L级要求的`work_items`、`remaining_actionable_count`、`independent_work_exhausted`、`next_action`、`next_action_type`、`progress_fingerprint`、`progress_basis`、`stop_reason`、`tool_results`和`browser_status`。发布项与本轮脱敏/契约项均应为完成，下一动作只能是等待Planner复核。
4. 将同一终态JSON写入本轮`validator/input.json`，运行公共Validator，保存stdout、stderr、exit；另以字节级或稳定文本比对证明回执末行中的JSON与input完全一致。

## 2. 禁止事项

- 不执行任何仓库的commit、push、merge、tag、Release、rebase、checkout、stash或历史改写。
- 不重跑Server/Web工程门禁，不重新发布已锁定版本。
- 不修改业务代码、迁移、工作流、Server《功能清单》、Workspace版本材料、knowledge、memory、todo或方向文件。
- 不删除失败日志以伪造全绿历史；只对其中的凭据值做脱敏，失败与修复过程必须保留。

## 3. 回传

在原回执追加修正说明与合法机器终态，不另建第二份发布回执。完成后等待Planner复核。

