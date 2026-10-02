# 分级执行与统一命令：修正回执 07（提示05 两项实质差异交付）

2026-10-02；Executor。依据 `planning-review-tiered-execution-unified-command-06.md`（G3b1 同键异载荷错误成功语义、G3b2 旧 handler 唯一性反证重开）与唯一执行入口 `planning-execution-prompt-tiered-execution-unified-command-05.md` 逐项交付。新证据独立 runId 段 `p62exec03r07`（证据根 `evidence/tiered-execution-03/p62exec03r07/`；r06 及更早证据原样保留未动）。阶段保持 VERIFYING，待 Planner 复核；不进入阶段三。

## 提交身份（一次封装，不递归自引用）

- Server：`ea6d16c`→`2f246ec`（G3b1 生产修复＋受影响测试）→`3988af5`（G3b2 夹具修正）→`ae3f6b0`（功能清单当前焦点同步）；develop 已推送，最终远端读回 `regression/remote-readback-server-postpush-r07.txt`（原始 ls-remote 输出）。生产代码改动集中于 2f246ec。
- Web：`c75f77e`（本轮无任何改动，未触碰 Web 四门）。
- Workspace：本回执与证据随本批提交推送，提交后远端读回以追加文件 `p62exec03r07/g7b/commit-identity-r07.txt` 记录，**该文件声明其对应本证据批次**；批次自身 SHA 不在文件内声称，不造身份循环。

## G3b1——同键异载荷明确拒绝：交付（生产修复）

- 缺口确认（r06 boundary-raw.txt 实测）：同键（同 commandKey / 同 (任务, 操作人, 动作)）异载荷在异步受理与同步恢复两条路径均返回 code=0——按 U02「同键异载荷拒绝」判定为错误成功语义。
- 生产修复（Server `2f246ec`，5 文件）：
  1. **受理层**（`CommandAcceptService`）：受理时计算载荷指纹（`CommandFingerprint.of(payload)`，SHA-256 of 规范化 payload 原文）写入 `sw_bpm_command.payload_fingerprint`；同键幂等命中时比对指纹——一致＝同一操作重放（返回原受理，原结果可查），不一致＝明确拒绝，抛新错误码 **2426 `bpm.command_payload_mismatch`**。比对覆盖**受理尚未完成/任务运行期**的首次并发冲突（命中判定发生在受理事务内，与任务状态无关）。
  2. **恢复分支**（`TaskActionService.execute` 同步入口 + `TaskActionCommandHandler` 异步前置）：同身份（任务, 操作人, 动作）重放增加载荷一致性判定（`auditPayloadConsistent`）——一致才恢复原结果；异载荷明确拒绝 2426（同步入口直接抛出；异步命令经调度器重试至 FAILED，failureReason=2426 文案），不吞成成功、不进入执行核心、不产生任何效果。
  3. **载荷一致性口径**（字段规范化按现有契约）：只比对审批动作实际消费、会写入业务或审计的字段——comment/opinionData（与 `recordAction`＋`ApprovalOpinionValidator.ensureDefaultRemark` 合并语义一致：comment 非空 putIfAbsent 原值、空意见契约补空串）、opinionFormId/opinionFormVersion（请求缺省时执行核心按契约填充，记录侧即填充后值——缺省视为与记录一致，显式携带时严格比对）、targetUserId；taskId/action 已在幂等身份内；participants/receivers/deadline 等审批动作不消费的传输字段排除。JSON 按 readTree 语义比较（键序无关）。
  4. **旧行兼容**（可解释，不默认异载荷成功）：存量命令行 `payload_fingerprint` 为 NULL 时以存储 payload 原文回推指纹（`CommandFingerprint.of(existing.getPayload())`）参与比对；`requeueFailed` 重提同步更新 payload 与指纹（FAILED 重提既有语义不变）。
- 真实验证（真实 PG＋真实 HTTP，runId `p62exec03r07-recheck`；`g3b/boundary-raw.txt`、`g3b/surefire-three-tests-pass.log`，`P62CrossChannelBoundaryPgTest` 6/6 通过，exit 0）：
  1. **异步同键异载荷·运行期**：首次受理在途时同键异载荷提交 → `code=2426`，不返回原命令受理标识。
  2. **异步同键异载荷·终态后**：首次 COMPLETED 后同键异载荷提交 → `code=2426`；原命令 payload/指纹/结果、原动作记录逐字段不变；动作恰 1、通知不增、命令行不增。
  3. **异步同键同载荷**：幂等命中原命令（正向保留），原结果可查；本轮受理写入指纹实测非 NULL。
  4. **同步同身份异载荷**：任务已消失后异载荷重放 → `code=2426`，原记录全等不变。
  5. **同步同身份同载荷**：恢复返回 200（正向保留，U02 同键同载荷跨重放一致），原记录全等不变、任务未复活。
  6. 异身份/异动作四场景（2305 冲突/异步命令 FAILED）维持既有正确行为，重跑通过。
  7. 单元级：`CommandAcceptServiceTest` 新增「同键异载荷拒绝（含运行期在途）」用例；原「幂等命中」用例按新语义改造为同载荷命中。
  8. 同载荷跨通道正向（`P62CrossChannelIdentityPgTest` 2/0/0/0）：两入口载荷统一为同值后，异步先行→同步跟进 200 去重、同步先行→异步跟进 RECOVERED+原 actionRecordId 均保持（`g3b-final/` 三件原始产物）。
- 正向完成条件对照：同身份同有效载荷跨同步/异步保持原结果 ✓（场景3/5/8）；同身份更改会写入业务或审计的载荷明确拒绝 ✓（场景1/2/4/6）；原 record/结果可查、不新增效果、不覆盖原意见 ✓。

## G3b2——FLOW_START 实例唯一性反证归因与夹具修正：交付

- 归因（对象证据，基于保留日志 `p62exec03r06/g7a/bootstrap-four-tests-run1-frozen-flake.log` 行 1772/1783/1805/1811）：
  - 失败时同一 recordId `0bff30cb…` 存在**两条 FLOW_START 命令**：`FLOW_START:{recordId}`（commandId=2105993558486745089，20:09:26.470 [main] 受理）与 `FLOW_START:g3b-{recordId}`（commandId=2105993558499328001，.473 [main] 受理，测试手动入队）。
  - .497 [mand-dispatcher] 后台调度消费前者、.504 [main] 测试 `dispatchOneForTest` 消费后者——两消费者并发进入 `FlowStartCommandHandler.handle` 的 check-then-act 幂等窗口（`findByBusinessKey` 均未见实例）→ 各启动一个实例 → `instanceCount=2`。
  - **两条命令来源**：前者是 `seedRecord→FormSubmitService.submitForm` 在表单事务内经 `FlowStartPort` 自动受理的**生产语义命令**（FORM_KEY 绑定启用流程）；后者是测试为验证重放防护手动入队的**跨键命令**。生产受理路径中 FLOW_START 键恒为标准键 `FLOW_START:{recordId}`（`FlowStartPortImpl` 唯一入队点），同键由 (tenant_id, command_key) 唯一约束拦截——**生产不存在跨键同 recordId 双命令受理路径**；两实例由夹具制造生产不可能状态并叠加真实并发窗口产生。
- 归因结论：**夹具污染为主**（测试未预期自动受理命令、假设队列仅有一条）；生产 handler 的 check-then-act 窗口仅在跨键双命令并发时可达，而该状态生产不可达。按提示05「夹具污染→对象证据解释两条来源，修正隔离/查询并保留生产竞争验证」路径处理，不改 FlowStartCommandHandler 生产代码。
- 夹具修正（Server `3988af5`，`P62FrozenSemanticsPgTest`）：
  1. `seedRecord` 后先等待**自动受理命令**由真实后台调度消费至终态（`waitCommandTerminalByKey`），断言唯一实例（1 行）——真实生产链（表单提交→自动受理→调度消费→实例唯一）验证，取代原「测试直接 dispatch 手动命令」的失真结构。
  2. 保留跨键重放命令（g3b- 键）经真实队列入队＋真实 handler 消费 → `SKIP_DUPLICATE` 幂等跳过、仍 1 实例——重复启动防护的确定性验证。
  3. 删除已无调用者的 `requeueForDuplicate` 辅助（其注释假设已被修正结构取代）。
- 验证：`P62FrozenSemanticsPgTest` **3/0/0/0**（含本用例），exit 0。
- 生产竞争验证保留：并发重叠下的效果恰一由锁定项 G3a（`P62OverlapEffectsPgTest` 3/0/0/0 重跑通过）与 `CommandOverlapRealEngineTest` 4/0/0/0 承载；本用例的自动命令消费即真实调度条件（与失败轮同一调度路径）。
- 反向排除：未把 expected 改 2、未关闭真实竞争（自动命令走真实后台调度）、未删失败日志（合跑失败轮日志原样保留于 r06 证据）、未以单跑绿代诊断（归因先行）。

## 过程失败轮保留（不可覆盖）

- round1（`failed-round1-stale-jar/`）：`-pl sw-bootstrap` 未带 `-am`，bootstrap 解析到本地仓库旧版 sw-bpm-process jar，修复未生效 → 2F（异载荷仍 code=0）。处置＝先 `mvn install` 生产模块再跑。完整日志留证。
- round2（`failed-round2-default-opinion-form/`）：修复生效但同载荷重放被误判 2426——`ensureDefaultRemark` 在执行核心填充 opinion_form_id=DEFAULT_REMARK/version=1/空 comment 补串，重放请求未经填充导致比对不一致；1F+1E。经字段级诊断日志定位（`debug-field-diagnosis-run.log`），将缺省填充语义纳入比对口径后修复。
- 另：OverlapEffects 首轮 NoSuchFileException 为执行侧未创建证据目录（环境操作失误，非代码），建目录后通过。

## 机器门禁与回归

| 套件 | 结果 | 退出码 | 原始输出 |
|---|---|---|---|
| sw-bpm-process 模块全量 | Tests run: 243, Failures: 0, Errors: 0, Skipped: 0（含新增同键异载荷拒绝单测） | 0 | regression/process-module-full-test-run.log |
| P62CrossChannelBoundaryPgTest | 6/0/0/0 | 0 | g3b/surefire-three-tests-pass.log |
| P62CrossChannelIdentityPgTest | 2/0/0/0 | 0 | g3b/surefire-three-tests-pass.log＋g3b-final/ |
| P62FrozenSemanticsPgTest | 3/0/0/0 | 0 | 同上 |
| P62OverlapEffectsPgTest | 3/0/0/0 | 0 | regression/bootstrap-overlap-regression.log |
| CommandOverlapRealEngineTest | 4/0/0/0 | 0 | 同上 |

锁定项不重跑：性能/OA 业务读/四视口/UI 布局/Web 四门（本轮零 Web 改动）；已锁定恢复子集未触碰。

## 证据清单与哈希

- 本轮证据根：`product/p62-lowcode-transaction-bpm-tiering/receipts/evidence/tiered-execution-03/p62exec03r07/`，`evidence-sha256.txt` **13/13 匹配**（`shasum -a 256 -c` 实测；不含清单自身与回执本体）。
- r06 及更早证据保持未动；失败轮日志（round1/round2/诊断轮）全部保留未覆盖。

## 逐项自检（按提示05 提交前判定）

- G3b1：有效载荷定义前后一致（判定口径与 recordAction/ensureDefaultRemark 契约逐字段对齐）✓；同载荷成功 ✓（场景3/5/8 原始输出）；异载荷确实拒绝 ✓（运行期+终态后+同步+异步 2426/FAILED 实测）；原结果/效果不变 ✓（记录全等读回＋计数前后一致）；旧记录兼容清楚 ✓（NULL 指纹按 payload 原文回推，FAILED 重提语义不变）。
- G3b2：两实例来源已解释（保留日志行级对象证据：两条命令的 key/受理时点/消费线程）✓；修复层与原因匹配（夹具修正，生产受理路径无跨键可能）✓；原失败调度条件（真实后台调度消费）下受影响用例通过 ✓；未以单次重跑绿代诊断 ✓。
- 本轮代码与验证、提交身份一致（验证在 ea6d16c 工作树执行、生产修复内容=2f246ec 已于验证前 install 生效，提交后读回一致）；失败/通过轮区分留证；文件真实可读；哈希由工具生成并回读。
- 状态单值：P62 整体 PLANNING、分级执行 VERIFYING、首事务 COMPLETED、0.1.3 Owner 已验收；功能 45、清单 46/22/22（90）、ADV64、问题 57 不变。
- 本回执自验通过，待 Planner 独立复核；不自行进入阶段三，不晋级正式功能数与项目基线。
