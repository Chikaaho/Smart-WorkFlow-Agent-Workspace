# P60 / 0.1.0 整体终态同步方向

> 下发角色：Planner  
> 日期：2026-09-15  
> 等级：XL  
> 状态：**COMPLETED（规划已确认，2026-09-15）**（最终复核 `receipts/planning-final-review-terminal-sync-v0.1.0-oa-completion-01-passed.md`）  
> 前置：`planning-final-review-release-v0.1.0-server-web-02-passed.md`

## 1. 任务性质

P60整体14/14已通过。本轮只做机械终态同步，不实现功能、不重验I1—I6、不重新构建、不执行外部Provider调用，也不修改、移动或重复创建任何main、tag、Actions、Release或构建资产。

Workspace不参与0.1.0代码版本身份；但其`knowledge/`、`memory/`、`todo/`与`product/`是本地规划状态载体，可按本方向同步。Workspace根`release/0.1.0/*`不是两代码仓发布权威，不得据其旧V92或旧SHA否定、覆盖或重建已发布版本。

## 2. 唯一终态值清单

1. P60=`COMPLETED（待规划确认）`；I1—I6=`COMPLETED（规划已确认）`；整体验收=14/14。
2. 正式业务功能数保持44；清单计数保持✅46/🟦22/⬜22；ADV保持64；P60作为版本统筹项不增加业务功能数，不自动核销P2/P4/P31/P34/P35/P37/P38/P39/P47等开放编号。
3. Server发布身份=`c15428f0002f6bb0ceeff05c7cbcf842bd3d3148`；Web发布身份=`963df360ed18bc1c604652a13edb2a7ed0be8963`；两仓精确annotated tag与公开Release均为`0.1.0`，Actions均成功。
4. 当前数据库迁移终点=V93。I6验收时V92及1361计数只保留为历史阶段证据；0.1.0最终Server门禁=1362/0/0/0，Web=1185通过+3跳过。
5. I5三Provider真实登录链和I6五外部通知渠道真实发送链保持`Owner延期 / 未验证`；I6五渠道继续由既有P2待办跟踪，不得改写为真实通过。
6. P61保持待启动；只有Planner最终确认P60`COMPLETED`后，才进入“全系统用户可见错误码与提示语人性化治理”的现状探索。

## 3. 同步范围

按上述固定值同步：

- `knowledge/current-status.md`、`knowledge/session-handoff.md`、`knowledge/features/v0.1.0-oa-completion.md`及必要索引；
- `memory/README.md`、`state.md`、`features.md`、`handoff.md`，并保持每文件<5KB、总量<20KB；
- `todo/v0.1.0-oa-plan.md`、`todo/requirement-pool.md`；
- Server《功能清单》当前发布摘要中的迁移终点、最终门禁、main/tag/Release身份；只改状态文档，不改业务代码或迁移；
- 已归档P60主方向和发布方向中的当前状态指针，以及本终态同步方向自身的`COMPLETED（待规划确认）`指针。

Workspace根`release/0.1.0/*`不在同步范围，不作为发布manifest；历史回执与原始测试证据不回写。

## 4. 验证与禁止事项

- 使用稳定断言脚本核对上述状态、计数、V93、两仓完整SHA、路径和入口一致性；保存原始输出。
- 回执必须以合法`ENGINE_TERMINAL`结束，状态=`TERMINAL_SYNC_SUBMITTED`，并保存公共Validator输入、stdout/stderr/exit及末行一致性证据。
- 不运行工程构建/测试/迁移，不执行浏览器验收，不调用外部Provider。
- 不执行commit、push、merge、tag、Release、rebase、checkout、stash、强推或历史改写；不改两代码仓发布提交。
- 不开始P61，不改变功能计数或开放P编号。

## 5. 回传

提交：

`product/v0.1.0-oa-completion/receipts/terminal-sync-v0.1.0-oa-completion-01.md`

Executor只写`COMPLETED（待规划确认） / TERMINAL_SYNC_SUBMITTED`。Planner复核后才确认P60`COMPLETED（规划已确认）`、归档本方向并启动P61探索。
