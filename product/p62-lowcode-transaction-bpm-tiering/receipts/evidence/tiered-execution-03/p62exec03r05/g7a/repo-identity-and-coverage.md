# G7a 精确身份与生产改动→验证覆盖映射（复核04 剩余项）

执行时点：2026-10-02（本轮 r05；采集时点为 12:14—12:40 区间，逐项标注）
本文件记录本轮实际远端读回与三仓精确 HEAD；原始输出见同目录 `remote-readback-*.txt`。

## 1. 三仓精确 HEAD 与远端读回

| 仓库 | 分支 | 本地 HEAD（full SHA） | 跟踪远端 | 远端读回 SHA | 读回时点 | 一致性 |
|---|---|---|---|---|---|---|
| Smart-WorkFlow-aPaaS-server | develop | `7ba52ee118875355313b15b20bba0a177e3eec38`（本轮批次前为 28d57b9a7ccb664960015d5a446f4c498bf29ca9） | origin/develop | 批次前读回 `28d57b9a7ccb664960015d5a446f4c498bf29ca9`（见 remote-readback-server.txt）；批次后读回 `7ba52ee118875355313b15b20bba0a177e3eec38`（见 remote-readback-server-postpush.txt） | 2026-10-02 | 一致（推送前后均 0/0） |
| Smart-WorkFlow-aPaaS-Web | develop | `c75f77ebe81a3a409bafdd503e9d75c9319a0af1` | origin/develop | `c75f77ebe81a3a409bafdd503e9d75c9319a0af1` | 2026-10-02（见 remote-readback-web.txt） | 一致（0/0 ahead/behind） |
| Smart-WorkFlow-Agent-Workspace | develop-sw | `be315fff450f2f112e4278e82d19308a9c4cb048` | origin/develop-sw | `be315fff450f2f112e4278e82d19308a9c4cb048` | 2026-10-02（见 remote-readback-workspace.txt） | 一致（读回时为本轮提交前；本轮提交后另行回读） |

- 复核04 指出的"Server 声称 28d57b9、附件仍 4531cb9/8f5d470"身份错位：本地仓库 `git cat-file -t`
  对 8f5d470/4531cb9/1eb2510/9c7460c/f6547b8/28d57b9 全部存在，且 `origin/develop` 跟踪引用
  与本地 HEAD 同为 `28d57b9`（0/0），本轮远端 `git ls-remote` 实测同 SHA——历史附件中的
  4531cb9/8f5d470 是采集时点工作树，不是最终身份；本轮以最终 HEAD 重新读回为准。
- 工作树未提交差异：Server 工作树有 1 处未提交改动（`功能清单.md`，由本轮 Planner 规划同步写入，
  见 §3）；Web 工作树干净；Workspace 工作树含本轮规划文档与证据（§3）。

## 2. 本轮生产改动 → 已有原始验证映射

口径：只列**生产代码**（非测试）改动；每项必须已有可回读的原始验证产物。测试资产修正不重复跑验证。

| 生产差异 | 文件与行 | 生效提交 | 对应原始验证 | 覆盖判定 |
|---|---|---|---|---|
| 流程启动透传 `target_record_id/targetRecordId` 为流程变量（TXN_ACTION variable 源解析实际动作目标） | `sw-biz/sw-bpm/sw-bpm-process/.../ProcessStartService.java`（putFirstNotBlank 第三组，8f5d470） | 8f5d470（其后 f6547b8/9c7460c/1eb2510/28d57b9 不再改生产文件） | ① G1a 正式轻流程 62,100 样本，样本 object_id=真实目标（`../p62exec03r04/g1b/*report.txt` 分布复算，本轮 r05 复跑同断言）；② G1b 配对 22,666 对同轮受理→目标提交（同上）；③ 真实 HTTP 入口 P99 112.6/147.9ms（r05 复跑） | 已覆盖，无需重跑 |
| 跨入口统一幂等身份：`TaskActionService.execute` 任务已消失且动作记录同身份（任务/操作人/动作）时恢复自身已提交结果；`TaskActionCommandHandler` 运行期任务不存在且同身份既有记录时直接以 RECOVERED+原 actionRecordId 回写（不进入执行核心） | `sw-biz/sw-bpm/sw-bpm-process/.../service/TaskActionService.java`（isTaskInRuntime + 恢复判定）、`.../queue/TaskActionCommandHandler.java`（sameOperation 前置恢复） | 本轮 `b6e9a45`（develop，已推送） | ① 新增真实 PG+真实 HTTP `P62CrossChannelIdentityPgTest`：异步先行→同步跟进 200 去重（动作 0→1、通知不增、命令台账 1）；同步先行→异步跟进 command status COMPLETED result=RECOVERED+原 actionRecordId（`../g3b/cross-channel-raw.txt`、`cross-channel-*.json`）；② 回归：process 模块 95/0/0/0、`P62OverlapEffectsPgTest` 3/0/0/0、`CommandOverlapRealEngineTest` 4/0/0/0、`P62FrozenSemanticsPgTest` 3/0/0/0 | 已覆盖（新改动自带同轮原始证据 + 受影响既有测试回归） |

- 该提交同时含 4 个测试资产文件（P62BudgetMeasurementPgTest/P62FrozenSemanticsPgTest/
  P62ProgressWindowPgTest/P62RecoveryDrillWorker）；其后 4 个提交（f6547b8/9c7460c/1eb2510/28d57b9）
  的 `--stat` 全为测试文件（`sw-bootstrap/src/test/**`），无生产代码。
- Web 本轮无生产改动（c75f77e 为上一轮已验收身份，工作树干净）。
- 结论：本轮除上述 ProcessStartService 一处外无新增生产差异；该处已有 ①②③ 原始验证覆盖，
  不因身份文字问题要求全量重跑（与复核04 口径一致）。

## 3. 工作树未提交项（如实登记，非生产差异）

| 仓库 | 未提交路径 | 性质 | 处理 |
|---|---|---|---|
| Server | `功能清单.md`（1 行差异） | 规划同步文本（P62 当前焦点段落） | 不属生产代码，不影响已采集证据语义；本轮不一并提交（Server 提交范围由本轮实际修改文件界定） |
| Workspace | 规划文档与证据（memory/todo/product 方向、prompt03、review04、evidence/r05） | 规划与执行产物 | 本轮批次提交 |
| Web | 无 | — | — |

## 4. 批次提交后回读（追加）

| 仓库 | 批次提交 | 远端读回 SHA | 回读文件 |
|---|---|---|---|
| Server | 28d57b9→`b6e9a45`（G3b 修复+证据）→`369601a`（G2b/G6a 资产）→`7ba52ee`（功能清单同步） | `7ba52ee118875355313b15b20bba0a177e3eec38`（0/0） | `remote-readback-server-postpush.txt` |
| Workspace | `9e9567f`（回执05 与全入口同步） | `9e9567f18f97fcc66a68daef2805a181bc8fb5d8`（0/0） | `remote-readback-workspace-postpush.txt` |
| Web | 无本轮改动 | `c75f77ebe81a3a409bafdd503e9d75c9319a0af1`（0/0） | `remote-readback-web.txt` |
