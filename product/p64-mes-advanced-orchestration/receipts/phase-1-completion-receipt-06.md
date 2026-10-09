# P64 阶段Ⅰ回执06：九项稳定项修复/补证完成（收敛提示04）

2026-10-09；Executor；XL 阶段Ⅰ（A01—A04 及相关 A11/A12/R12）。依据[收敛提示04](planning-execution-prompt-p64-phase1-04.md)（唯一当前执行入口）、[规划复审05](planning-review-phase-1-05.md)、[回执05](phase-1-completion-receipt-05.md)与主方向 §3.1/§3.2/R12/A01—A04/A11—A12。证据树 `receipts/evidence/phase1-06/`（九包 + `MANIFEST.txt` 98 件原始件，sha256 可复算；原始附件本地留存不入 Git）。**本文自验通过，待 Planner 独立复审06**；阶段Ⅰ保持 VERIFYING，P64 保持 IN_PROGRESS。

## 1. 九项结果总表（正向 + 必要反向）

| ID | 正向实际结果 | 必要反向 | 证据包 |
|---|---|---|---|
| P1-02a | worker 8 用例逐用例原件（本轮 engine 门禁 21:27，与最终修复树同提交）：8 个 testcase 全通过，system-out 内嵌 worker 握手（pid=22348/33700/3156/39632/44840，maxHeapBytes=134217728）与断言定位 | OOM/超时/等候/拒绝均断言零许可零等候；shutdown 自身 PID 实测退出（无孤儿）；不引入 RSS 标准 | `P1-02a/`（XML+engine 门禁 log 全文） |
| P1-02b | 工具原提取：三入口（预览 `BpmTriggerController`；办理完成链 `TaskActionService:406/454`→`TriggerExecutionService:193`；命令通道 `TaskActionCommandHandler:93`→同链）→ **唯一实现** `BpmScriptEvaluatePortImpl:19`→`ScriptWorkerPool.evaluate` | 不越运行/队列硬上限、无无界等待（共享 02a 逐用例） | `P1-02b/`（grep 原输出） |
| P1-04a | X7 原始行定性=真实并发竞态（同库仅 X7 `e_23=2/node_3=2/node_end=3`；node_2 双命令事务窗口重叠 46.739→47.268 / 46.859→47.684）；动态分支 2 行（一为 SUPERSEDED_BY_ROUND 记账）；两条 node_3 任务均 completed（应办未被跳过、被重复）。修复=`completeWithOptimisticRetry` 冲突时若任务仍在→抛原始异常**整事务回滚**由命令层新事务受控重试；任务消失→2305 | 不跳过应办分支；汇聚不提前/重复（I6/I7 并发复验 `e_23=1/node_3=1`，命令 retry_count=1 证明冲突真实发生且无重复延续）；不因“自愈”掩盖取消 | `P1-04a/`（X7 历史/分支/任务/动作/命令原件、同库对照、修复后计数、引擎逐用例 2/0） |
| P1-04b | 发布冻结：v6 冻结图 `node_1→p64_r5n2@4`、`node_2/3→p64_node_form@2`；表单再发 v5/v6（追加必填 field_r6_only）后——首草稿前任务读回仍是 4、首草稿行 `form_version=4`；反向提交按 v4 语义拒绝（`未知字段: field_r6_only`）且任务/草稿零改写；转办换键 `:2` 恢复 SUBMITTED v4（同对象同一行）。X2/X3 原对象行/命令/动作为原行精确登记 | 不从 v4 漂移到首草稿 v6；不按最新校验已有绑定；不半提交；旧无绑定兼容回退当前发布；缺快照可诊断拒绝 | `P1-04b/`（发布/读回/草稿/负反/恢复原件，X2/X3 身份行，逐用例 15/0+7/0） |
| P1-05a | 10 组语义断言逐用例实名（NUMBER/BOOLEAN/稳定引用/来源权限/缺值/可空/ROWS trace/三事件/系统白名单），XML 原件落 product；I6 真实快照新增旁证（NODE_FORM+MAIN_FORM+SYSTEM 同链） | 零越权/零混轮次/null/异常/取消零成功动作；不凭集合名推断 | `P1-05a/`（3 份 XML） |
| P1-06a | 五目标映射原查询重跑（EACH owner=2/3+reason=REWORK；SINGLE 仅 reason；GROUPED 仅 owner，reason 未配置为空）；可靠性逐用例原件（幂等/并发冲突/空集/超限/受理语义） | 同键不重复、不丢意图、不静默截断；成功目标不重跑；GROUPED reason 不冒称 | `P1-06a/`（映射查询+5 份 XML） |
| P1-06b | X5 修复后真实收敛：retry **200 RECOVERY_ENQUEUED**→新代 `…:R2` COMPLETED→目标实例 `a65a0702…` 创建（目标记录仍 1、无重复）→回查 `STARTED`；原 EXPIRED/`:R1` FAILED 行保留；权限 handler1=403/匿名=401；新失败路径标记（onFinalFailure/零目标处置）逐用例 5/0+6/0 | 不以消费前修绑替代消费后恢复；不 500、不永久 STARTING、不篡改冻结载荷、不重复目标；恢复不重复成功目标/不丢意图 | `P1-06b/`（前后 DB 原件、retry 响应、权限拒绝、逐用例 XML） |
| P1-07a | v7=`triggers=[]` 发布冻结；在役 I6（v6 冻结触发）node_1 完成→exec **MATCHED**+意图+目标实例，且 v7 之后仍办至 **APPROVED**；I7（v7）node_1→**0 exec/0 意图**并正常收敛 APPROVED | 不以“从未启用 P64 旧图”替关闭；不删历史意图/不损存量；新版本零新触发 | `P1-07a/`（发布/冻结图/触发与零触发原件、逐用例） |
| P1-08a | knowledge-first 全部受影响入口逐字段回读（见 §3）；自身服务精确退出（PID/进程树/端口原件）；根 Git 提交后定位（见 §6） | 不宣称九项未过已收敛；不漏 session-handoff/登记；不留活验证任务；不停用户设施；不改 gitlink | `P1-08a/`（覆盖矩阵+退出原件+Git 原输出） |

## 2. 本轮实现修复（产品范围必要修复，ADR-P64-001 修订04 同步记录）

1. **P1-04b**：`BpmProcessDefServiceImpl#freezeNodeFormVersions`（发布冻结节点表单版本）+ `NodeFormDataService`/`BpmNodeFormController`/`TaskActionService` 按绑定版本（冻结图 `formVersion`）校验与落行。
2. **P1-06b**：`ActionRefRecoveryService`（受控恢复状态机）+ `FlowStartPortImpl.recoverFlowStart`（`FLOW_START:{recordId}:R{n}` 只增不改）+ `FlowStartCommandHandler`（终态失败/零目标标记意图 FAILED+原因）+ `BpmTriggerController`（诊断返回，权限 `workflow:instance:view`）+ Web 恢复入口（STARTING 窗口可点、显示后端诊断消息）。
3. **P1-04a**：`BpmTaskFacadeImpl.completeWithOptimisticRetry` 语义修正（禁止同事务重放；任务消失仍 2305）。

## 3. 门禁与覆盖（V）

- **engine 100/0**（`P1-02a/raw/engine-gate-r6.log`；含新增 `BpmTaskFacadeImplCompleteConflictTest` 2/0）；**process 342/0**（`P1-06a/raw/process-gate-r6.log`；330→342 净增 +12＝NodeFormDataServiceTest +3、FlowStartCommandHandlerTest +2、BpmTriggerControllerTest +1、ActionRefRecoveryServiceTest +6）；**Web 四门 exit0**（typecheck 静默；lint 0e/3w；vitest **1371 passed+3 skipped**；build ✓3.58s）。
- knowledge-first 逐入口（实际核验，`P1-08a/index.md` 矩阵）：`knowledge/session-handoff.md`（顶部覆盖值更新为回执06 待复审）、`knowledge/architecture.md` §7.3（P64 行＝IN_PROGRESS·阶段Ⅰ VERIFYING）、`knowledge/current-status.md`（顶部回执06 条目，回执05 条目标记历史）、`memory` 五入口、`todo` 两入口、`Smart-WorkFlow-aPaaS-server/功能清单.md`（当前焦点行更新）、ADR-P64-001（修订04）。
- 主库终态：0 RUNNING（30 实例=TERMINATED×2/APPROVED×18/REJECTED×10）；无 PENDING/PROCESSING 命令；无活验证任务。

## 4. 与方向的偏差

无产品目标/范围/验收偏差。实现层新增两点观察（不改判为已恢复/已收敛，交规划裁量）：①同用户同任务 FAILED 后同键异载荷不可改（2426）——恢复须换键（转办）或经 EXPIRED 恢复代（本轮实测路径；属既有契约边界）；②动态分支 `cancel_reason=SUPERSEDED_BY_ROUND` 记账仅出现在双冻结路径（竞态修复后不再触发；正常轮次语义不变）。

## 5. 问题、未完成与风险

- 九项均已提交；残余=Planner 独立复审06。
- 风险边界：X7 竞态的驱动窗口=同实例审批命令并发消费（同库唯一重叠实例）；修复以引擎逐用例语义钉死+真实并发复验，不主张 100% 复现率。
- 冻结载荷边界保持：二段恢复**不重读历史载荷**，新代命令载荷=原受理输入+当前绑定指针（原行/原载荷可审计）。

## 6. Git 与收尾

- **Server**：代码修复提交 `578ef6b`＋功能清单当前焦点更新提交 `87afbe9`（HEAD）；均 `feature/p64-mes-advanced-orchestration`，推送后远端 ls-remote 回读一致。**Web**：`53eec1e`，同名分支，远端回读一致。
- 工作区（develop-sw）：本回执＋证据索引/回执＋ADR 修订04＋knowledge/session-handoff/architecture/memory 五入口/todo 两入口同步；本批次 SHA 见交接摘要，不回填自 SHA。
- 根 Server gitlink `78495dc` 保持（未晋级）；无 force/合并/tag/部署；PG/Redis 用户容器未动。

## 7. 全部为是自检（提示04 §4）

- 九项均有独立包及可回读真实结果，正向和必要反向都成立？**是**（§1 + 各包 raw 原件）。
- 任务首次草稿前版本不漂移，二段失败窗口已有合法可恢复/可收敛结果，X7 原因和应办语义解释充分？**是**（I6 v4 全序列；X5 收敛；X7 双激活定性+修复+单激活复验）。
- testcases 实际原结果与断言关联可读，未把测试名/源码路径/叙述当原输出？**是**（XML/日志/grep 原件落 product，sha256 清单）。
- 对象同一，旧失败保留，新对象/新请求有时点，零重复/零半提交与权限正确？**是**（X2/X3 原行；X5 旧行保留+R2 新代；04b 同任务行；权限 403/401 原件）。
- 零授权内可继续项被转称范围外观察，无无限重试和活验证残留，工具退出清理可读？**是**（0 RUNNING/0 在途命令；退出原件）。
- 最后实现与受影响门禁一致；knowledge/全部摘要/当前 product 路由/ADR 一致，Git 原回读和固定截止可核，计数/P/基线/gitlink 未晋级？**是**（§3/§6）。

## 8. 自验结论

九项稳定项完成（3 处产品反证按原范围修复并复验，其余为已有原证落盘/覆盖补齐）；自验通过。**阶段通过仍由 Planner 独立裁决**；Executor 不写功能 PASSED/COMPLETED、不核销 P、不晋级基线。
