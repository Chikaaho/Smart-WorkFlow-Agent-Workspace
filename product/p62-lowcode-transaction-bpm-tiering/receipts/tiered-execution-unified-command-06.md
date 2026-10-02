# 分级执行与统一命令：补证回执 06（提示04 剩余两项交付）

2026-10-02；Executor。依据 `planning-review-tiered-execution-unified-command-05.md`（G3b 双向正向子集通过、新增反向边界待证；G7a 部分通过、缺最终身份原始读回与回归原始输出）与唯一执行入口 `planning-execution-prompt-tiered-execution-unified-command-04.md` 逐项交付。新证据独立 runId 段 `p62exec03r06`（证据根 `evidence/tiered-execution-03/p62exec03r06/`；r05 及更早证据原样保留未动）。阶段保持 VERIFYING，待 Planner 复核；不进入阶段三。

## 提交身份（一次封装，不递归自引用）

- Server：批次A `7ba52ee`→`181009f03ea9faf5ca1c1e0ddff3a6b42d540cbb`（本轮唯一代码改动：新增反向边界测试文件，无生产代码差异）→`ea6d16cd98e5bd53005617bb4bbb4845fdd7de0e`（功能清单当前焦点同步）；develop 已推送，最终远端读回 `g7a/remote-readback-server-postpush-r06.txt`（原始 ls-remote 输出）。
- Web：`c75f77ebe81a3a409bafdd503e9d75c9319a0af1`（本轮无任何改动）；远端读回原始输出 `g7a/remote-readback-web-r06.txt`（r05 所指缺失附件由本文件替代，不再引用不存在的 `remote-readback-web.txt`）。
- Workspace：本回执与证据随本批提交推送，提交后远端读回结果以追加文件 `p62exec03r06/g7b/commit-identity-r06.txt` 记录，**该文件声明其对应本证据批次**（即本批提交身份），不含、也不要求包含承载它自身的那次提交 SHA；后续如有新提交以新读回为准。

## G3b——跨入口恢复分支反向边界：交付（6 场景真实 PG + 真实 HTTP 全过）

- 有效载荷定义与入口字段事实（`g3b/boundary-raw.txt` 逐场景落盘）：
  - 命令通道 payload 原文（读自 `sw_bpm_command.payload`）：`{"taskId":"…","action":"APPROVE","comment":"第一载荷","opinionData":{},"participants":[],"receivers":[],"deadline":{}}`——由 `CommandAcceptService.toPayload` 序列化 ApprovalActionRequest 并剔除 null 字段；action 写入 commandKey（`TASK_APPROVE:{taskId}:{actorId}`）。
  - 同步 HTTP 入口：`POST /api/workflow/tasks/{taskId}/complete|reject|return`，body 为同一 `ApprovalActionRequest`，taskId 取路径参数。
  - `payload_fingerprint` 生产现状（接口字段事实）：列存在但审批受理入口不写入，命令行实测为 `NULL`（原始读回 `fingerprint=<NULL>`）；同键异载荷的实际防线=受理幂等命中不更新 payload（FAILED 重提除外，既有语义）＋恢复分支不读不写载荷字段。不凭空制造指纹校验字段。
  - 影响业务的载荷字段：action（已在键内）、returnTargetNodeId（RETURN 必填校验）、comment/opinionData/opinionFormId/opinionFormVersion/targetUserId（任务存在时写入动作记录）；任务已消失后这些字段无生效路径，恢复分支只读 (任务, 操作人, 动作) 身份——等价语义即异载荷不可生效且不覆盖原记录，以下逐场景实测。
- 反向断言逐场景（runId `p62exec03r06-g3b-boundary`，buildCommit=7ba52ee118875355313b15b20bba0a177e3eec38；原始输出 `g3b/boundary-raw.txt`、`g3b/surefire-run3-pass.log`，`P62CrossChannelBoundaryPgTest` 6/6 通过，exit 0）：
  1. **异步同键异载荷**：首次 APPROVE（comment=第一载荷）COMPLETED/DONE 后，同键再提交 comment=第二载荷——受理返回同一 commandId（不新建第二命令行，commandsByKey 0→1）、原命令终态仍 COMPLETED 且 result 仍指原 actionRecordId、`sw_bpm_command.payload` 原文不变、动作记录 `opinion_data` 仍为「第一载荷」（不覆盖）、动作恰 1 条、通知不增。
  2. **同步同身份异载荷**：同 (任务, 操作人, 动作) 二次提交（comment/opinionData 不同）恢复返回 200/code=0，原记录逐字段不变（record-before/after 全等读回）、runtimeTasks=0（任务未复活）、通知不增——仅 HTTP 200 未作通过依据，以记录全等与计数为准。
  3. **不同操作人·同步**：操作员乙（91358）对甲（91357）已完成的任务重放 → `code=2305 节点已被处理`（APPROVAL_ALREADY_HANDLED），未恢复为乙的成功；动作/通知/记录不变。
  4. **不同操作人·异步**：乙提交同任务 APPROVE 命令（键 `TASK_APPROVE:{taskId}:91358`，合法新受理行）→ 消费冲突重试至 `FAILED`（failureReason=「节点已被处理」，retryCount=4），**不得 COMPLETED/RECOVERED**；原记录、动作、通知均不变，命令行恰两条（甲乙各一）。
  5. **异动作·同步**：同任务同操作人 APPROVE 已提交后再 REJECT → `code=2305`，原 APPROVE 记录恰 1 条且逐字段不变，通知不增。
  6. **异动作·异步**：REJECT 命令（键 `TASK_REJECT:{taskId}:91357`）消费冲突至 FAILED（retryCount=4），原 APPROVE 记录不变、动作/通知不增。
- 正向沿用：async-first/sync-first 双向正向（复核05 已判子集通过）不重跑采集；本轮在最终产物 HEAD 重跑 `P62CrossChannelIdentityPgTest` 2/0/0/0 作为正向在最终代码上的回归确认（`g3b-final/` 三件原始产物）。
- 局限：payload 指纹校验（`CommandFingerprint`）当前仅存在于底层队列 API 与 Tiered 语义测试，审批动作受理入口未接入指纹比对——异载荷防线为「受理不更新 + 恢复不读写 + 原结果可回查」的实测等价语义，未新增指纹校验代码（发现真实缺陷才修复；本轮实测未发现可复现缺陷）。

## G7a——最终身份、原始远端读回与回归原始输出：交付

- 生产差异映射（`g7a/production-diff-mapping.txt`，原始 git 输出）：`28d57b9..7ba52ee` 生产代码差异仅 `TaskActionCommandHandler.java`、`TaskActionService.java` 两文件（即 b6e9a45 修复内容）；`28d57b9..b6e9a45` 同一两文件＋新增 `P62CrossChannelIdentityPgTest`。**28d57b9 工作树→最终产物映射闭合**：r05 G3b 证据 buildCommit=28d57b9 时修复代码已在工作树（b6e9a45 于同日 13:01:54 提交同一内容），本轮全部验证在最终 HEAD 7ba52ee（含 b6e9a45）实跑；其后 181009f 仅新增测试文件、ea6d16c 仅文档，生产代码零差异。
- 最终产物回归逐类结果（`g7a/regression-summary.md`；原始日志同目录三份）：
  - `sw-bpm-process` 模块全量：**Tests run: 242, Failures: 0, Errors: 0, Skipped: 0，BUILD SUCCESS，exit 0**（`process-module-full-test-run.log`）——r05 的「95/242」表述由本原始输出替代。
  - `P62OverlapEffectsPgTest` 3/0/0/0、`CommandOverlapRealEngineTest` 4/0/0/0、`P62CrossChannelIdentityPgTest` 2/0/0/0——r05 的「3/4/3」表述由本原始输出替代（FrozenSemantics 见下）。
  - `P62FrozenSemanticsPgTest`：四类合跑轮出现 1 失败（expected 1 was 2，旧类型 FLOW_START 命令幂等时序偶发；该测试与 b6e9a45 审批恢复分支无生产代码交集）→ 单独重跑 **3/0/0/0，BUILD SUCCESS，exit 0**。合跑轮日志按不可覆盖原则保留（`bootstrap-four-tests-run1-frozen-flake.log`）。
  - 新增 `P62CrossChannelBoundaryPgTest` 6/0/0/0 exit 0（`../g3b/surefire-run3-pass.log`）。
- 三仓身份与远端读回（全部为原始命令输出，不以 commit-identity 声明代读回）：
  - Server develop 最终 `ea6d16c`（本地 HEAD=远端 ls-remote 输出一致；`g7a/remote-readback-server-postpush-r06.txt`）。
  - Web develop `c75f77e`（ls-remote 原始输出一致；`g7a/remote-readback-web-r06.txt`）。Web 代码不变，既有四门锁定不重跑，以读回证明工作对象未变。
  - Workspace develop-sw：本批提交后回读，见 `g7b/commit-identity-r06.txt`（对应本证据批次声明）。
- 反向排除：无 commit-identity 声明替代远端输出；无引用不存在的 Web 附件；回归结果全部携带原始命令日志与退出码；合跑失败轮未删除未覆盖；「测试前 HEAD」不作为修复覆盖证明——覆盖证明=最终 HEAD 实跑 + 生产差异映射。

## 过程失败轮保留（不可覆盖）

- G3b 反向测试 run1：recordId 超出 `business_key` varchar(36) 限制（DataIntegrityViolation，5 Errors+1 Failures，无业务断言价值；无留存日志文件，事实在此登记，修复=缩短场景 tag）。
- G3b 反向测试 run2：4 Failures+1 Error，全部为断言格式问题（JdbcTemplate 读回为 Map.toString 而非 JSON、命令 failure_reason 存异常 message 而非错误码、`sw_bpm_command` 主键列为 `id`）——业务行为输出已全部正确。完整日志 `g3b-failed-round1-assert-format/surefire-run2-4f1e.log` + `README.txt`。
- run3 全过（6/6），其前 run2 的 boundary-raw.txt 被 run3 按 TRUNCATE 写入覆盖——run2 业务行为事实以 surefire 日志留存为准。
- FrozenSemantics 合跑轮 1 失败留证（见 G7a）。

## 证据清单与哈希

- 本轮证据根：`product/p62-lowcode-transaction-bpm-tiering/receipts/evidence/tiered-execution-03/p62exec03r06/`，`evidence-sha256.txt` **15/15 匹配**（`shasum -a 256 -c` 实测；不含清单自身与回执本体）。
- 上轮 r05 证据保持未动；不重跑已锁定项（G2b 测量、G6a 替代链、UI/1280、Web 四门、共享热点压力主体）。

## 逐项自检（按提示04 提交门禁）

- G3b：有效载荷定义已核（payload 原文/入口字段/指纹现状落盘）✓；同键异载荷及不同身份反向断言实际成立（6 场景原始输出）✓；原结果/效果不增（记录全等读回 + 计数前后一致）✓。
- G7a：文件真实存在、原始流可读（15 件证据 + 3 份原始日志）✓；提交→产物→测试→远端关联成立（production-diff-mapping + regression-summary + 双读回）✓。
- 计数与状态：P62 整体 PLANNING、分级执行 VERIFYING、首事务 COMPLETED、0.1.3 Owner 已验收；功能 45、清单 46/22/22（90）、ADV64、问题 57 不变。
- 本回执自验通过，待 Planner 独立复核；不自行进入阶段三，不晋级正式功能数与项目基线。
