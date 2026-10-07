# P63 完成回执04：提示03 剩余14项独立证据包（自验通过，待规划复核）

2026-10-07；Executor。唯一执行入口=planning-execution-prompt-p63-03.md；裁决依据=planning-review-completion-03.md。P63 保持 **VERIFYING**；功能46、清单46/22/22、ADV64 不变，不自写 PASSED/COMPLETED。环境：旧库已删，本轮全部证据在**新库 sw_p63_accept2**（新旧映射在各包登记）；活体验证后端/vite/对端 9777/9778 为任务自有受控进程，收尾已终止。

## §1 14项逐项关闭表（包=evidence/acceptance-04/<ID>.md）

| 原子 | 结果 | 核心原件 |
|---|---|---|
| G01a | 18未证格逐格明细 **18/18 PASS**（输入/HTTP+业务码/任务/候选人/expected-actual 全字段）+6格引用已证原件=24/24覆盖 | g01a-matrix-detail-result.txt、tools/g01a-matrix-detail.py |
| G01b | 重开/实例读取画面：姓名/部门全名+多值 tag（矩阵办理人二+三、矩阵一部、二部）无ID裸显；已知轻微列头问题不阻断 | browser/g01b-reopen-*.png |
| G03a | 真实对象负向矩阵全绿；**确证缺陷修复**：到点一律按 deviceKey+租户权威重解析（修复前 FIXED 冻结目标跨租户/软删仍 DISPATCHED+跨租户命令行——初跑实证泄漏保留在 run 文件） | g03a-negative-matrix-run.txt、G03a.md |
| G04a | 引擎轮次2例真实报告+活体旧taskId三分支（异载荷2426/同载荷幂等原结果/非办理人 FAILED“节点已被处理”）+新轮零变化回读 | g04a-oldtask-reject-run.txt、g04-*-test-run.log |
| G04b | v2 4例真实报告+ListenerPortOutcome 3例+ALL/ANY/RATIO 6例+真实并发投票恰一次 1例+快照1例，共15/0 | g04-engine/g04-process-test-run.log |
| G05b | **契约修正**（EXPIRED 终态永不改写→`:R<n>` 恢复链新行；领取路径守准入截止两顺序；requeueFailed 收回 FAILED-only）：单测9/0+PG端到端2/0+process回归266/0+活体 UI 链（UI真实受理→停机窗口→EXPIRED→同页重试→:R1 COMPLETED→APPROVED，原行全字段未动） | g05b-pg-test-run.log、g05b-regression-process.log、browser/g05b-*.png |
| G06a | 窗外创建即 EXPIRED 零外发/窗内 catch-up 恰一次+重放不增/错窗受控时钟收敛 EXPIRED 零外发/歧义+不存在本地时刻拒绝零意图 | g06a-g06b-pg-test-run.log（Boundary 7/0） |
| G06b | 真实 PG CAS 竞争：取消先手（原因/操作者落库+零外发）、认领先手（NOT_CANCELLABLE+1命令）、并发3轮每轮恰一方获胜 | 同上 |
| G07b | 预约 SENT 无回执（noreceipt 对端真实 HTTP）→受控超时→UNKNOWN 可查→有限触发不重发→人工核实负3正1（权限/依据/404/终态拒绝；SUCCESS+审计含依据） | g07b-test-run.log（1/0）、tools/p63-peer-noreceipt.mjs |
| G08a | headed 会话（1440×900 与 375×812）逐动作 URL/视口/身份/对象+ACCESS 日志 requestId 索引；**D 映射更正**：D 失败链=实例 e7d5fb0d/命令 2107523779530510337（旧文件不改，勘误在包内） | browser/*.png、G08a.md |
| G08b | 375×812 实际点击全程：主题/表单/弹窗/办理→已通过+审批历史完整可读；同 task 请求/结果（ACCESS+DB） | browser/g08b-375x812-*.png |
| G09a | legacy approver 键+未知合法属性：v1/v2 快照逐字节（v1 发布后不改写）、v2 保留 legacyNote/approvalHint、旧路径跨发布在途办理到 APPROVED | g09a-legacy-compat-run.txt |
| G10a | flyway 真实行 0.1.4/0.1.5/0.1.6+R__p63 菜单行+菜单 9104/9109；立即动作入口真实运行（事件→发起→A6 全授权链→命令+发布尝试+审计，零预约）；详情 24 字段全量响应+列表条件消歧 | g10a-immediate-and-detail-run.txt、g10a-imm-test-run.log（1/0） |
| G10b | 候选绑定 Server 88f82a8（远端回读一致）/Web b73ebc4；Server 门禁 process 266/0、engine 76/0、iot 63/0（首轮契约 stub 失败已修复保留原报告）、bootstrap 首轮 3 失败保留+定向复跑 8/0；Web typecheck/lint(0e)/vitest 1364/build 全 exit 0 | G10b.md、/tmp/p63ev/gate-*、web-* |

## §2 代码改动清单（Server 88f82a8，9 files +1711/−96）
1. `CommandAcceptService`：EXPIRED 恢复链（审查03§4 契约）。
2. `PersistentBpmCommandQueue`：claimDue 准入截止双校验；requeueFailed FAILED-only。
3. `IotReservationDispatchJob`：到点设备权威重解析（G03a 确证缺陷）。
4. 测试：CommandAcceptServiceTest（9例新契约）、P63ExpiredRecoveryPgTest 重写（2例）、新增 P63ReservationBoundaryPgTest（7例）/P63ReservationUnknownPgTest（1例）/P63ImmediateTriggerPgTest（1例）、P63IotReservationTest 契约 stub。
Web：无改动（b73ebc4 维持）。

## §3 方法与边界（如实）
- EXPIRED UI 反馈为提交后 5s 轮询窗内 toast（transient）；活体调度 <500ms 领取，toast 态以停机窗口构造（与 PG 测试同口径的测试装置），重载不显示历史命令过期态——已记录，不隐瞒。
- bootstrap 首轮 3 失败（崩溃致对端缺失×1、竞速断言×2）原样保留，修复后定向复跑 8/0（非全量重跑，符合"原失败/复跑保留"）。
- fixture 命令行（G05b UI 链，1 行）与测试装置 deadline 置过去均已如实标注。
- 对端 9777/9778、后端、vite 均为任务自有进程，收尾终止；`.env.development.local` 删除；无 sleep 空转、无不可控后台。

## §4 验收对照（提示03§6 提交前矩阵）
每包正向/反向：14/14 有实际结果与原始指针，未填 DONE 的近似替代均列"不可接受替代"；封装：逐格明细/SQL/请求可读、转录单列、命令/版本/时区消歧；候选：88f82a8/b73ebc4 绑定计数与 exit、失败保留、推送回读一致；生命周期：代理任务全部结束清理；状态：P63 VERIFYING、knowledge 已同步（§6）。**自验通过，待规划复核。**

## §5 提交回填
- Server `88f82a8` → origin/develop（回读 88f82a85e80e…一致）。
- Web `b73ebc4`（无新提交，HEAD=远端）。
- workspace：回执04+acceptance-04+knowledge → 见提交记录（提交后回读）。

## §6 knowledge 同步
`knowledge/current-status.md`：P63=VERIFYING；最新复核=复核03、唯一入口=提示03；本回执04 后唯一下一动作=「Planner 复核 receipts/completion-p63-mes-workflow-foundations-04.md 与 evidence/acceptance-04/ 的 14 项证据包」。
