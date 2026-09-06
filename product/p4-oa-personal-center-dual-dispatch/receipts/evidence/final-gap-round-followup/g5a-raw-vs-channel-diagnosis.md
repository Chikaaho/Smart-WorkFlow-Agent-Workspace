# G5a raw.out 与 channel.out 差异诊断（提示06 §2 G5a：先诊断原响应解析差异）

日期：2026-09-06；Executor。失败原件 `../final-gap-round/g5a-p0-channel-raw.out` 保留不修改；修正采集 `../final-gap-round/g5a-p0-channel.out` 为有效正向原件。

## 1. 根因：采集身份用错（回查越权），非解析缺陷、非业务缺陷

raw.out 采集脚本（副本 `g5a-collection-script-orig.py`）P3 起所有回查（GET /workflow/commands/{id}、commands/page、my/instances、todo/page）默认使用 `user=ADMIN`（test_1）。而命令详情接口限发起人读回，服务器原始日志（`g5a-server-8080-orig-extract.log`，行号为原件 server-8080.log 实际行号）：

- 行 202674：`13:50:16.188 WARN BpmCommandController : 命令回查越权拒绝: commandId=2096476051870543873, initiator=2096474378888507394, currentUser=1`（HTTP 仍 200，data 为空）
- 行 204236 / 227832：13:50:17.800、13:51:30.531 以 test_1 再查两次同样越权拒绝。

因此 raw.out P3 全字段 null（data 为空），P4 因 recordId=None 找不到子命令，P5—P8 连锁 NOT_FOUND/null。这是采集端身份参数问题。

## 2. 修正采集与服务器读回证据吻合

- 修正采集（channel.out）改用发起人 bizP0（test_2096474378888507394）回查：服务器日志行 236703/241715/243192/253368 显示 `userId=2096474378888507394` 的 GET /api/workflow/commands/2096476051870543873 与 2096476052197699585 均 status=200 且**无越权拒绝**，与 channel.out P3/P4 完整 JSON 响应一致。
- 父命令落库行（server log 行 202582 参数）：`COMPLETED, {"status":"SUBMITTED","recordId":"fe458ad4-f908-4833-b19b-05637b573ba7"}, finishedAt=13:50:16.145525`；子命令 `COMPLETED, {"status":"STARTED"}, finishedAt=13:50:16.372694`（行 203548）。

## 3. 响应返回绝对时点与子启动绝对时点（审查06 §3 关联）

- 客户端有界返回：采集脚本 t0 在 POST 前取本机时钟，P2 实测 elapsedMs=145、http=200、status=COMPLETED（raw.out P2 与 channel.out P2 一致）；服务端受理绝对时点 13:50:16.065029（行 202223 SQL 参数），即客户端返回绝对时点 ≈ 13:50:16.21（受理后约 145ms，含网络与调度抖动）。
- 父命令真实完成：13:50:16.145525（早于客户端返回），返回体携带真实业务结果 recordId。
- 子命令（实际启动）绝对时点：受理 13:50:16.142787（行 202542）、开始处理 13:50:16.261（行 203238）、完成 13:50:16.372694/日志 .374（行 203548/203559）——即子命令引擎处理完成发生在客户端有界返回（≈.21）之后。

## 4. 结论（对照提示06 G5a 正向条件）

P0 同步发起返回的是本次业务发起的真实结果：返回时业务记录 fe458ad4 已创建（父命令 DRAFT_SUBMIT 已提交业务记录，recordId 可回查、实例 businessKey=recordId、发起人=bizP0 本人，channel.out P3/P5/P7），子命令流程启动有独立命令 id/通道/时点可分查、最终 STARTED/APPROVED。不存在"未启动即报业务完成"的假完成：返回体的 COMPLETED/SUBMITTED+recordId 对应父命令真实完成的业务发起结果，子启动状态由独立子命令可回查。原 raw.out 差异已定位为采集身份问题，无需修改实现。
