# P63 完成回执03：20 原子项关闭（二级收敛）

2026-10-07；Executor。唯一执行入口：`planning-execution-prompt-p63-02.md`；裁决依据：`planning-review-completion-02.md`。证据根：`receipts/evidence/acceptance-03/`（原始运行日志 raw/、门禁 gates/、专项原件文件、工具 tools/）。历史回执01/02与 acceptance-02 不改写；对回执02 的转录更正以本回执及更正附表为准。自验结论=VERIFYING，等待 Planner 复核。

## 0. 对象与安全反证先行结论

- **G03b 关闭（无跨租户泄漏）**：命令 2107529730992050178 来源=租户1 预约 91401（foreign-req-91401）到点后由服务端调度按**同租户**（预约租户1→设备租户1）合法下发，回执 APPLIED SUCCESS。回执02"零外发"句为到点前采集+错误转录，已在 `evidence/acceptance-03/g03b-foreign-dispatch-disambiguation.txt` 消歧；负例语义保持：租户0 对该预约 GET/取消 404 零副作用（g03a 原件），无任何用户可无权触发他租户外发。
- **G07a 关闭（干净成功场景替代补投）**：原补投 APPLIED 响应未落盘（原件缺失，如实登记不追造）；按提示以新干净场景（实例F）产生完整原件链：对端以**正确十进制 ID** 收令（peer-46570896-92a）→ HMAC 回执 → `APPLIED: SENT→SUCCESS` → 命令行 SUCCESS(result source=RECEIPT)。未重发任何已成功设备动作。对端精度缺陷（JS Number 舍入）已在对端工具修复并留原记录。

## 1. 20 项原子账本逐项关闭

| 原子 | 结果 | 原始路径 → 实际结果 → 边界 |
|---|---|---|
| G01a | ✅ | `g01a-matrix-result.txt`+`g01a-matrix-correction.txt`：三类节点×八来源 24 格全矩阵——UI 已证 5 格 + 集成矩阵 19 格（每格真实创建定义/保存图/发布/提交记录/引擎任务断言）；初跑 16/19，3 个非 PASS 为断言脚本缺陷（identitylink 列名 user_id_ 误用+漏键），按同对象重断言更正后 **24/24**。参与人集合逐格与期望一致（含 USER 候选 {2,3}/{2,3,4}、DEPT 去重合并、DYNAMIC v2 逐对象分支）；直接人员/部门入口沿矩阵与 A 链可用；无类型漂移。边界：剩余格为服务/引擎集成证据（提示02 明确允许），非全 UI。 |
| G01b | ✅ | `g01b-readback-original.txt`：A 记录 GET 原响应——八组合字段值完整、表格行含稳定行 id（与 G02a source_refs 的 rowId 一致）、保存后未被改写；可读显示由 L03 锁定的图13 与 user-dept-display 承担。 |
| G02a | ✅ | `g02a-instanceA-original-queries.txt`：A 同对象分支行（11/12 独立+source_refs 三行 rowId）、全部任务历史（两条张三动态独立时间线）、计票行（node_2 两票/node_5 两票独立时间）、审批动作行（意见/轮次/结算字段在案）、单终态 APPROVED；§6 人员动态三场景（USERS/MAIN→2 分支、USERS/TABLE→3 分支重复合并、DEPTS/MAIN→同负责人 2 独立分支）。 |
| G03a | ✅ | `g03a-negative-matrix.txt`：无权（王五）GET/取消 403×2（errorKey=common.forbidden+eventRef）、跨租户 404×2、前后对象零变化回读（PENDING/cancel_by 空）；到点重核失效=实例D/实例C 真实 FAILED 链（产品行为）+单测 dispatchJobMarksFailedWhenDeviceInvalid；正向佐证=admin 对张三任务审批被"无权处理该任务"拒绝（实例F1 时间线）。边界：设备删除的到点重核以单测+FAILED 链组合证明，未单独构造删设备流程链。 |
| G03b | ✅ | `g03b-foreign-dispatch-disambiguation.txt`：同租户合法下发消歧（见 §0），负例零副作用保持。 |
| G04a | ✅ | `gates/com.sw.ck.bpm.engine.integration.P63DynamicRoundBindingTest.txt`+`raw/p63-round-binding-test-run.log`：真实引擎输出 2/0/0/0（首入单轮、子实例重放复用同轮、合法重入新轮旧轮 SUPERSEDED 收口）；运行佐证=实例A/E round_no=0。边界：旧任务拒办以轮次收口语义+轮次校验路径覆盖，未单独构造退回后旧 taskId 办理场景。 |
| G04b | ✅ | `g04b-edge-semantics-evidence.txt`：P63DynamicParallelV2Test 4 例（缺负责人 BLOCK/SKIP 记因、超上限拒绝、空集合 BLOCK/PROCEED、v2 形状校验拒旧语义不受影响）4/0/0/0；TieredCommandSemanticsH2Test 6/0/0/0（EXPIRED 判定语义未被本轮改动破坏）；汇聚恰一次=A 链计票+唯一终态。边界：并发竞态不要求浏览器制造（提示允许）。 |
| G05a | ✅ | `gates/com.sw.ck.bootstrap.p63.P63ReservationIntentTxPgTest.txt`+`raw/p63-intent-tx-pg-test-run.log`：4/0/0/0（重放唯一意图+冻结时刻精确一致、意图失败审批整体回滚零意图、REJECT 零意图、提交后调度失败预约可查审批保持）；断言映射即 4 例 DisplayName，**不按 5 条主张虚增**（回执02 的 5 点主张中①⑤同属 replay 例）。修复：测试硬编码日期跨天缺陷（plan_time=10-07 08:00 于 10-07 上午已过→正确 EXPIRED）改动态未来时刻。 |
| G05b | ✅ | 修复：`CommandAcceptService`（EXPIRED 同键同载荷复用 FAILED 恢复路径）+`PersistentBpmCommandQueue.requeueFailed`（守卫放宽接受 EXPIRED、过期事实保留 failure_reason 追加"已由原用户重新提交恢复"）+前端（pollCommandStatus 认 EXPIRED 终态+runAction 明确呈现原因与"可直接重试"下一动作）。真实持久集成 `P63ExpiredRecoveryPgTest` **1/0/0/0**（`gates/`+`raw/p63-expired-recovery-pg-test-run.log`）：PENDING→EXPIRED（真实对账 expireDue）→原用户同键重受理→requeue→**真实 dispatcher 消费 COMPLETED**，恢复等待期旧过期事实可查；process 模块新增单测（EXPIRED 恢复+PROCESSING 幂等命中不变）264/0/0/0。边界：管理员 TRANSFER 不核销本项；未改 P62 全局锁定语义（FAILED/EXPIRED 同为效果未发生终态，重置路径既有，仅守卫扩展，影响面=同键任务审批命令）。 |
| G06a | ✅ | `instanceF-g05b-g06c-g07a-timeline.md` §4：F 批准冻结 due=表单时刻精确一致（Asia/Shanghai→UTC）、到点前零外发（对端 jsonl 无记录）、到点窗内（+7s）合法下发；实例K（`raw/instanceK-timeline.txt`）批准时已过窗口→EXPIRED 零命令零外发（正常链）。边界：受控手段=短 due+实际持久调度入口，无受控时钟注入、无回写造结果。 |
| G06b | ✅ | `g06b-ui-cancel-chain.md`+`g-reservation-cancel.png`：实例G PENDING 预约在 UI 预约卡真实取消（原因落库 cancel_by/cancel_reason/cancel_time、toast+卡片"已取消"）、复活探针=NOT_CANCELLABLE、CANCELED 零命令行+到点后对端零收令（§7 终读）；竞争单结果=cancelRacesResolveToSingleOutcome（CAS PENDING-only）原件。 |
| G06c | ✅ | `instanceF-...timeline.md` §2：F 预约 PENDING（due 09:38:06）于 09:32:47 kill -9 后端→09:33:00 恢复 READY→同库同对象回读不变→到点后调度恢复执行**恰一次**下发（DISPATCHED+唯一命令）。边界：重启为本任务自有服务；B 链早前主张的时序错误已在回执02 基础上以本场景更正。 |
| G07a | ✅ | 见 §0 与 `instanceF-...timeline.md` §3；jsonl 倒数两行=正确 ID 收令+APPLIED 回执原件；命令行 SUCCESS result={"source":"RECEIPT","requestId":"peer-46570896-92a"}。 |
| G07b | ✅ | `g07b-cardinality-unknown.txt`：实际配置单动作槽（原始 JSON）→F 链 1 意图↔1 命令↔1 回执原始行；单基数下部分失败/整批重发 N/A（审查02§4 口径），不新增多设备能力；UNKNOWN=P62 S4 既有合同（未触碰语义，改动清单见 §3）+预约来源命令接入同一查询/核实入口（acceptance-02 图18 同屏多状态+sys_menu 9104 种子）；本轮无 UNKNOWN 样本（如实登记）。 |
| G08a | ✅ | `g08a-network-index-and-correction.txt`：F/G 链与回执的 AccessLoggingFilter 原文行（method/path/status/userId/requestId）+**A—K 全对象映射总表**（含 D=修复前失败链、E=补投成功链的 D/E 混用更正）；完整脱敏日志 `raw/backend-access-20261006-07.log`（16147 行）。边界：视口事实更正——图10 为 1920×1080、其余 8 张 1280×720（回执02"全为1280×720"转录更正）。 |
| G08b | ✅ | `g08b-narrow-viewport.md`+`g08b-narrow-375-todo.png`/`g08b-narrow-375-taskdetail-cancel.png`：375×812 视口内待办列表可读、真实点击"通过"完成审批（toast 已通过）、任务详情预约卡（已取消+取消原因全文）单列完整无裁切。复用既有业务对象（提示允许），未重建业务链。 |
| G09a | ✅ | `g09a-old-compat.txt`：v1 旧语义动态并行定义（无 semanticVersion 键）真实运行——dept_list=[11,12] 同负责人**合并为 1 任务**（与 v2 独立 2 分支对照，语义不漂移）；版本行逐次发布**追加不重写**（0:PUBLISHED×2，Flowable 定义 id 各自独立——版本命名空间消歧：sw_bpm_process_def_version.version=记录版本、publishedVersion=定义发布轮次、Flowable def id=引擎版本，三者并行在案）；H2 在途实例跨发布继续办理→APPROVED。边界：旧网关不存在不伪造（提示允许）。 |
| G10a | ✅ | `g10a-migration-and-config-off.txt`：迁移链终点 0.1.6+git 零新增迁移文件；关闭预约配置（UI 同形状 `{action}` 包裹、IMMEDIATE 缺省语义）→实例J4 APPROVED **零预约行**；存量预约 GET 详情/取消原件。初测 J/J2"1 行"为请求形状错误（裸 JSON 被 `{action}` 包裹契约忽略，响应体读回即证）+时序竞争，更正在案。立即下发=IoT 触发路径（IotProcessTriggerListener.runDeviceAction，本轮未触碰），普通表单发起不适用。 |
| G10b | ✅ | `gates/`（关键类 surefire 报告+module-totals+Web 四门/lint/P62UpgradeGate 隔离复跑日志）+`raw/`（intent-tx、round-binding、dyn-v2、expired-recovery 测试运行日志+脱敏后端全量日志 16147 行）；保留全仓首轮 1 例 P62UpgradeGatePgTest 失败与隔离复跑 2/0/0/0+bootstrap 模块复跑 257/0/0/27 原件，**不宣称已证负载根因/首轮全绿**（审查02§4 口径）。本轮新增改动后适用门禁=process 264/0/0/0、bootstrap 定向（ExpiredRecovery 1/0+IntentTx 4/0）、engine/iot 未再触碰故沿用 76/0、63/0 原件。 |
| G10c | ✅ | 见 §4 清理清单：任务自有进程（后端/vite/受控对端）提交前终止并回读退出；调试身份文件恢复任务前状态（删除本会话创建的 .env.development.local，回读不存在）；隔离 PG sw_p63_accept2 drop 并回读不存在（证据已全部落盘 product）；/tmp 任务敏感文件清理。 |

## 2. A01—A10 现状（20 原子关闭后）

A01（G01a/b）、A02（G02a）、A03（G03a/b）、A04（G04a/b）、A05（G05a/b）、A06（G06a/b/c）、A07（G07a/b）、A08（G08a/b）、A09（G09a）、A10（G10a/b/c）逐项证据齐备；L01—L05 视觉锁定未重录。仍为自验通过，P63=VERIFYING 等待 Planner 复核。

## 3. 本轮代码改动清单（适用门禁）

- Server：`CommandAcceptService`（EXPIRED 恢复分支）、`PersistentBpmCommandQueue.requeueFailed`（守卫+过期事实保留）；测试 `CommandAcceptServiceTest` +2 例、`P63ExpiredRecoveryPgTest` 新增 1 例、`P63ReservationIntentTxPgTest` 日期修复。
- Web：`api/index.ts`（pollCommandStatus 认 EXPIRED）、`TaskDetail.vue`（EXPIRED 呈现原因+下一动作）。
- 对端工具（product 内，非产品代码）：peer-received 大数精度修复（上轮已修，本轮记录）。
- 适用门禁：process 模块 264/0/0/0、bootstrap P63ExpiredRecoveryPgTest 1/0/0/0 + P63ReservationIntentTxPgTest 4/0/0/0；engine/iot 本轮零改动（沿用 76/0、63/0 原件）；Web typecheck/lint/vitest/build 四门（提交前实跑回填见 §5）。

## 4. 清理清单（G10c，提交前执行并回读）

1. 任务自有进程：后端（p63-backend-relaunch.sh 启动的 StarterApplication）、vite dev、受控对端 node p63-peer.mjs——采集退出状态并回读端口 8080/5173/9777 无监听。
2. 调试身份：`.env.development.local` 为本会话创建 → 删除并回读不存在（任务前状态）。
3. 隔离 PG：`sw_p63_accept2` 为本任务一次性验收库（上会话创建，全部内容为 P63 验收对象）→ dropdb 并回读不存在。
4. /tmp 敏感遗留：p63-rsa.pem、p63-cipher.txt、p63-token-*.txt 等删除；证据类（p63-backend-env.sh、日志）在封装后一并清理。

## 5. 提交与推送（2026-10-07 回填）

- Web 四门实跑（G05b 前端修复+EXPIRED 契约类型后最终候选）：typecheck exit 0 / lint exit 0（0 error）/ vitest **1364 passed + 3 skipped**（152 文件）/ build exit 0。
- Server 适用门禁：sw-bpm-process **264/0/0/0**（+EXPIRED 恢复例）、sw-bootstrap 定向 P63ExpiredRecoveryPgTest **1/0/0/0** + P63ReservationIntentTxPgTest **4/0/0/0**；engine/iot 本轮零改动沿用原件（76/0、63/0）。
- G06b 到点后零外发最终回读：CANCELED 预约命令行 0、对端 jsonl 到点窗口无收令、后端调度日志无认领（g06b-ui-cancel-chain.md §8）。
- G10c 清理回读：backend/vite/peer 进程 0、端口 8080/5173/9777 无监听、.env.development.local 已删除（回读不存在）、sw_p63_accept2 已 drop（回读 0）、/tmp 敏感遗留已清（g10c-cleanup-readback.txt）。
