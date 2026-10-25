# 0.2.0 统一执行·批次 11（A16 版本整体：同租户发布表单/实例 配置→提交→审批→历史 全链）

2026-10-25｜Executor｜FORMAL_FLOW（PG dev 环境；配置段 API 真实链、运行段浏览器可见会话）；承接 Planner 后续办账本

## 链路与对象（同一稳定对象贯穿）

- 流程定义 `A16 全链流程`（defId `2114316486343405570`，processKey `bpm_3e373530637b4888`，绑定 formKey `a11_events_probe`）：API 建定义→PUT graph（START→APPROVAL「主管审批」participant FIXED_USER ['9001']→END）→validate **0 错误**→publish **PUBLISHED**（发布即落启用表单绑定，sw_bpm_form_binding）。
- 实例：表单提交 recordId/businessKey `6fceaa3d-5e63-4337-bfde-1414164f41e6`；FLOW_START 命令 `2114317160556802049` 受理→ProcessStartService 流程已发起 `processInstanceId=a3e98df7-d066-11f1-9ea5-00ff9e2a8dfb`，实例记录 `2114317161924145153` RUNNING。
- 任务：待办任务页真实行「20261025-001 A16 全链流程 待审 6fceaa3d… 租户100管理员」；taskId `a3f044c4-d066-11f1-9ea5-00ff9e2a8dfb`。

## 运行段（浏览器可见会话，t100admin）

1. 填写页提交（名称=A16全链提交记录；onLoad 事件在发起与节点表单均真实回填）→「已提交」＋后处理失败提示（A11 语义延续）。
2. 待办任务 → 详情弹窗（表单数据＋流转记录/流程图/审批详情页签＋审批区：备注/暂存/更多/驳回/同意）→ 同意 → 确认框「通过」→「已通过」。
3. 后端：`POST /workflow/commands/tasks/{taskId}/complete 200` → BPM task completed → 审批已完成 → **流程已结束，实例状态更新为 APPROVED**；审批命令 DONE，actionRecordId `2114317534801965058`。
4. 历史回看：我发起的列表行「A16 全链流程 20261025-001 已通过」→ 只读详情弹窗流转记录「10-25 19:24 主管审批 租户100管理员 已同意」。截图 `a16-approved-history-1920.png`。
5. PG 直读对照：`sw_bpm_instance` 该实例 status=**APPROVED**。

## 边界与剩余

- 配置段经 API 真实链完成（图形配置页面的画布交互已由既有 U020/批次证据承接，本批不重做）；A16 的**跨租户/无权负向链**与本链的同对象要求未完——下一批补（含 A13 监听运行时、A14 入口、A15 加签、A12 函数目录）。
- A12—A15 均未整体完成；本批不冒称 A16 通过。

## 服务收尾

- 后端（8080）与前端（5175）按监听进程树终止、端口回读不可达；PG/Redis 容器保持。

总 7 阶段：已完成 1 需求评估；进行中 1 分支实施；未开始 5 验收同步、合并、0.2.0 发布、发布后同步、结束。
