# 0.2.3 执行提示 04：验收同步→合并→发布→发布后同步

2026-11-06｜Planner。依据 planning-review-lifecycle-023-04-passed.md。实施验收已通过（A01—A08 全部 PASSED）；本提示替代提示 03。不新增功能，不新增 search，不重开已锁定的验收项。

## ③ 验收同步

- Executor 按宪法更新 `knowledge`，内容包括：生命周期接口、状态机、事件续传、取消和恢复语义、三种协议流式、两 Key 轮换，以及已接受的限制（无逐节点进度事件；采用 JSON 轮询续传）。
- 固定值不变：功能 50；M 59/18/13；ADV 1/7/56；实际 P63；问题 57；P20 不核销。
- 外线恢复后，先推送 Workspace 本地 `develop-sw` 上尚未推送的回执提交，并回读远端。

## ④ feature→develop→main

- 合并前先处理 Server 全量门禁中 `sw-basic-notify-biz` 的三项失败（I6G1a/b/c）。
  - 在 develop 当前 HEAD 上，只对该模块运行一次同样的测试。
  - 如果 develop 上同样失败，说明这三项与本分支无关，如实记录后继续合并。
  - 如果只在 feature 分支失败，说明本分支引入了回归，必须修复后才能合并。
- 两个仓库按 system.md 的 Git 授权，依次完成 feature→develop→main。每一步都要回读远端 commit。

## ⑤ 发布 0.2.3

- 按 system.md 授权的发布链执行，确保正式版本、部署版本和 Flyway 迁移一致（含 V0.2.7）。
- 发布后的 health 检查以实际结果为准。
- EXT-023-01 处理：
  - 外线已恢复：在原隔离环境补跑 1 次真实执行，并补查 afterSequence；结果写进回执。
  - 外线仍未恢复：发布说明写明“真实供应商流式未经实测，协议层已由可控对端验证”。
- 两种情况都不阻塞发布。

## ⑥ 发布后同步

更新 `knowledge` 中的当前版本事实，并更新 tag、来源 commit 和部署结果。

## ⑦ 结束（Owner 2026-11-06 口径：本机环境保留）

- 隔离库 `smart_workflow_lc023_01`（含复制的凭据密文）、`.lc023-mock`、`.runtime-lc023`、隔离 worktree 及任务自有服务**保留，不删除**，留待 Owner 后续使用。
- 底线是不泄露：凭据明文、密文、Authorization 头不得进入 Git、回执、日志存档或聊天。核对 Workspace 和两个工程仓都没有暂存或提交 `.lc023-mock`、`.runtime-lc023`、`.tmp-a03-schema.json`；如果会误入提交，只加忽略规则或保持未跟踪，不删除。
- 回执只列出保留环境清单，包括路径、端口和 PID，以及上面的不泄露核对结果。
- 不动用户 8080 服务、`smart_workflow_f1v4b`、5173 服务和 Web `vite.config.ts` 的在途改动。

## 回执

- 回执写入 execution-release-023-08.md，按阶段 ③ 至 ⑦ 分节记录实际结果，包括提交号、tag、health、保留环境清单和不泄露核对。
- 每节标明七阶段计数。
- 遇到需要 Owner 决定的事项时，只就该项停下，其余阶段继续推进。

```planner-convergence
{
 "schema":"agent-coding-engine.planner-handoff.v1",
 "feature":"0.2.3",
 "revision":4,
 "previous_revision":3,
 "decision":"PASSED_TO_DELIVERY",
 "source_receipt":"product/0.2.3/receipts/execution-lifecycle-023-07.md",
 "items":[
  {"origin_id":"LC023-01","status":"PASSED","failed_rounds":2,"acceptance":["locked"]},
  {"origin_id":"LC023-02","status":"PASSED","failed_rounds":2,"external_dependency":"EXT-023-01 外线恢复后补1次真实执行；未闭合则发布说明注明","acceptance":["locked"]},
  {"origin_id":"LC023-03","status":"PASSED","failed_rounds":3,"evidence":["assets/lc023-03-headed/07-designer-cancelled-fixed.png","execution-lifecycle-023-07.md:13-48"],"acceptance":["locked"]},
  {"origin_id":"LC023-04","status":"PASSED","failed_rounds":2,"acceptance":["locked"]}
 ]
}
```
