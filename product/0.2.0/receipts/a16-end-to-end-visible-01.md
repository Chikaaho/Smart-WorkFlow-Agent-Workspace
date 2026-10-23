# A16 发布表单与流程可见端到端记录

2026-10-23｜Executor｜XL｜自验通过，待 Planner 验收

总 7 阶段：已完成 1「需求评估」；进行中 1「分支实施」；未开始 5「验收同步、合并、发布、发布后同步、结束」。

## 业务对象

- 租户：0；发起/审批人：用户 1「系统管理员」；表单：`it_application`，表单 ID `9248e291-61f3-4eac-ac27-717c7924f13e`。
- 流程：`bpm_6fe7bf7b0b0147cd`「表单事件验收流程」，定义 ID `2113451778379911169`，单审批节点「管理员审批」。
- 表单记录：`a77363f2-4054-4925-9540-7b082024b48b`；流程实例：`6d0527f0-ce86-11f1-88e6-00ff9e2a8dfb`；待办任务：`6d12957d-ce86-11f1-88e6-00ff9e2a8dfb`。

## 实测链

1. 发布表单将 `onLoad`、`beforeSubmitHandler`、`afterSubmitHandler` 及字段/动作权限写入版本；发布流程绑定同一表单。
2. 可见浏览器打开发起页，加载事件把本地「事件结果」置为“加载完成”；填写标题、预算 520 与说明。
3. 提交前事件读取真实预算并执行通过；业务提交返回稳定记录 ID，随后触发提交后事件，页面显示“提交后完成”，业务记录不接收该 UI 后处理值。
4. 流程实例建立，当前节点“管理员审批”；待办以同一业务记录展示。
5. 审批区暂存意见“A16 审批意见已暂存”，重新读取后恢复为本人草稿，未完成任务、未生成已办。
6. 正式审批通过；待办归零，我发起的同一实例显示“已通过”，详情审批轨迹为“已同意 · A16 审批意见已暂存”。
7. 终态后再次改写该任务意见暂存被服务端拒绝；同一表单版本显式包含 `user:91102` 权限，但租户 9001 用户读取租户 0 记录仍返回 403，未跨租户泄露业务数据。

## 证据

根目录：`C:/Users/hjxch/.codex/evidence-020/e2e/`，浏览器 `headless=false`，视口 `1920×1080`。

- 表单提交成功及提交后结果：`screens/a16-form-events-submit-1920.png`。
- 意见暂存恢复：`screens/a16-opinion-draft-1920.png`。
- 我发起的终态列表：`screens/a16-instance-approved-1920.png`。
- 实例详情与审批轨迹：`screens/a16-instance-detail-1920.png`。
- 流程状态原文：`a16-instance-api.json`；表单记录原文：`a16-form-data-api.json`；暂存行：`a16-opinion-draft-db.txt`；终态改写拒绝：`ended-task-draft-reject.json`；跨租户拒绝：`cross-tenant-explicit-grant.json`。
- 服务端运行原文：`backend.log`；打包门禁：`backend-package.log`、`backend-package-status.txt`。
- 最终代码：Server `0e0d16d`、Web `cf6ae4f`；均以普通推送进入 0.2.0 任务分支。

## 结果与边界

实测结果为实例 `APPROVED`；表单持久值 `title=A16 表单事件完整链`、`amount=520`、`memo=加载、提交前、提交后与审批`、`eventTrace=加载完成`，证明提交后 UI 动作没有回写已提交业务记录。暂存行保留在终态任务用于追溯，后续写入被拒绝。

这是本执行会话的 A16 自验，不替代 Planner 正式验收。A03 像素、A04 全局交互、U020 其余画框、发布/部署和正式发布后同步仍未完成。
