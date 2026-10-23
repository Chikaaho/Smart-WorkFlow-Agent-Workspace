# W020 流程入口与办理实施记录

2026-10-23｜Executor｜XL｜自验通过，待 Planner 验收

总 7 阶段：已完成 1「需求评估」；进行中 1「分支实施」；未开始 5「验收同步、合并、发布、发布后同步、结束」。本回执只覆盖 W020 首批，A14/A15 仍需真实浏览器与完整办理链验收。

## 已实施

- 流程版本历史增加挂起/激活入口与状态回读；挂起只阻止该版本新发起，已绑定实例继续办理。
- 我发起的运行中实例增加授权废弃入口，废弃必须填写原因；服务端既有 `workflow:task:discard` 权限和终态规则继续作为权威。
- 加签拆成“位置”和“多人顺序”两个独立维度：位置为前加签/后加签，顺序为并行/串行，默认前加签、并行；旧请求缺位置时保持原有前加签语义。
- 后加签在请求时携带当前审批意见、意见表单标识/版本和意见数据；追加人员完成且全部通过后，服务端以原办理人身份按原意见受控完成原任务，不改写原意见。待处理加签继续阻止普通办理提前推进节点。
- 新增当前办理人的审批意见暂存：绑定租户、任务、实例、节点、轮次、办理人和意见表单；允许未完成必填内容，不完成任务、不产生已办或通知。任务结束、非当前办理人或跨主体访问均拒绝，重启后可恢复。
- 新增“待确认的加签 / 补签”入口：显示任务、前后位置、顺序、说明和确认意见；串行前序未完成时禁止后续表态。加签与补签均通过既有受控表态接口登记，不授予新审批权。
- 新增可重复 H2/PostgreSQL 迁移 `R__0.2.0_approval_opinion_draft.sql`，建立按租户、任务和办理人唯一约束；旧定义和旧请求无需迁移。

## 修改范围

- Server：`BpmLifecycleController`、`ApprovalLifecycleServiceImpl`、`ApprovalActionRequest`，新增意见暂存 controller/entity/mapper、H2/PostgreSQL repeatable migration 与两项 controller 行为测试；同步迁移链计数。
- Web：流程 API、`ProcessDesigner`、`MyInstances`、`TaskDetail`、`TodoList`、BPM 动作契约与中英文案。

## 验证原文

目录：`C:/Users/hjxch/.codex/evidence-020/w020/`。

- BPM Process 全模块：`mvn -pl sw-biz/sw-bpm/sw-bpm-process -am test`，exit 0，**429 tests / 0 failures / 0 errors / 0 skipped**，`server-bpm-tests-final.log`。
- 意见暂存与待确认加签专项 4/4：本人恢复、他人拒绝、终态改写拒绝、串行门与前后位置回读。
- H2 迁移/衔接/升级：30/30，exit 0，`migration-h2.log`；PostgreSQL 全链：exit 0，`migration-postgres.log`。新表在两种数据库建出，19 条迁移终点保持 0.1.10。
- Web typecheck 0、lint 0 error（2 条既有 warning）、Vitest **1712 passed / 3 skipped**、build 0；`web-gates.txt`、`web-test.log`、`web-build.log`。
- 受影响 Web 组件回归 31/31：`MyInstances.spec.ts`、`TaskDetail.spec.ts`。

## 边界与下一动作

A13 的统一流程监听/触发器编辑视图与 A14/A15 的正式浏览器办理链尚未完成；本回执不能用组件测试替代可见交互验收。后加签的表态记录、串行/并行和终态推进已有受控实现与单元证据，但仍需在真实发布流程上验证前后轨迹、重复/越权及通知结果。下一动作继续 J020 的流程监听统一视图与 W020/A14/A15 真实链，再推进 U020 全局覆盖。
