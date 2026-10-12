# P64 阶段Ⅲ回执01：场景与整体交付

2026-10-12；Executor 按[阶段Ⅲ执行入口](../ready/direction-p64-phase3-scenarios-delivery.md)完成 A08—A12 实施与运行，自验通过，**待规划独立验收**。P64 保持 IN_PROGRESS·Ⅰ/Ⅱ PASSED·Ⅲ执行后待验收（2/1/0→验收前口径）；功能 47、清单 46/22/22=90、ADV64、问题 57、P63/VB、P62 搁置与正式基线不变。本回执不写 P64 整体 PASSED、不核销 P、不晋级基线。

## 0. 总进度

P64 总 3 业务阶段：Ⅰ数据到动作（PASSED，验收08）、Ⅱ人员与父子协作（PASSED，验收09）、Ⅲ场景与整体交付（**本阶段执行完毕待验收**）。已完成 2/进行中 1（Ⅲ待验收）/未开始 0。回执轮次不计入阶段。

## 1. 交付概要与内部 Step

环境：本机 macOS（PG16 本机库 `sw_p64_phase3` 全新迁移至 **0.1.9**、Redis 6379、Server `-cp` 解压模式 8080、Web dev 5173）；三仓分支 `feature/p64-mes-advanced-orchestration`。场景配置资产经 API/发布链真实建立（表单 12 张、流程定义 8 个、TxnAction 4 个、岗位委托 1 条、用户/部门/岗位种子脚本）；业务链全部经真实 API/浏览器驱动，无种子 SQL 伪造业务结果。

内部 Step：①环境与基线核验 ②三项支撑改动（见 §4）③基础资产 ④S3 安信 ⑤S2 招商 ⑥S1 MES ⑦A11 浏览器 ⑧A12 核验 ⑨门禁与回执。

## 2. A08—A12 逐项结果（对象/结果/证据）

### A08 / S1 MES（六链 APPROVED+数量账+护栏）
- **工单主流程**（`bpm_7cf1df2f…`，直线图+首检/终检两组 Trigger+两个 SUBFLOW_WAIT）：领料确认(仓管 9010)→开工→首件(张三)→首件检验(质检 9011，节点表单 verdict/defect_type/disposition)→整改等待→批量→报工→完工检验→处置等待→入库确认→关闭。
- **正常链** `WO-2026-201` APPROVED：RESERVE×3（balance 1000/reserved 100）→同键异量重放 **1606 拒绝**→仓管确认→CONFIRM×3（**balance 900/reserved 0**）→开工/首件/首检 PASS（空动作分支+无批次 SUBFLOW_WAIT 直过）→批量/报工→终检 PASS→成品 ADJUST 入库→APPROVED。
- **首检 NG 三分支**：`WO-NG-PROC/MAT/EQP` 全 APPROVED——verdict=NG+type 三分支各自 MATCHED（trigger_exec MATCHED b_proc/b_mat/b_eq），START_SINGLE CHILD 派发整改复检（handler literal：工艺 9012/仓管 9010/维修 9013），整改办理→复检 PASS→回写→主链继续。
- **终检三分支**：`WO-NG-REWK/SCRAP/CONC` 全 APPROVED——NG:REWORK（返工处理）、NG:SCRAP（报废处置：scrap_qty=2+原因）、NG:CONCESSION（让步批准记录）各自处置子流程 CHILD/ALL 收敛后入库关闭。
- **数量账专项**：RELEASE（30/0 恢复）；并发 8 线程同对象各预约 5——**行锁串行化+余量约束**（reserved=30 封顶、2 笔 REJECTED 业务结果）；台账 `sw_form_txn_ledger` 可回查。
- **循环护栏**（WO-LOOP-003）：首检 NG→整改复检**连续 NG**——第 1/2/3 轮 reloop 自动派发成功（depth 1/2/3 递增），**第 4 轮派发被阻止**：trigger_exec 诊断行"**动作 act_reloop: 派发失败 父子嵌套深度 3 达到上限 3，已阻止派发**"（主方向 §3.5 默认 3 轮；REWORK_LOOP_OVER_LIMIT(2454) 为解析异常场景兜底，单测锚定 ChildOrchestrationServiceTest 28/0）。
- 证据：`evidence/phase3-01/db/instances-summary.txt`、`db/`（trigger_exec/txn 台账/批次行），工具脚本 `~/sw-p64p3/s1_*.py`。

### A09 / S2 招商（八组合 8/8+聚合会签甲乙丙丁+委托链）
- **八组合真值表**（`招商规则协同 bpm_75c5a004…`，Trigger 脚本按配置的部门稳定 ID 20/21/22 取交集）：{A}→B1、{B}→B2、{C}→**UNMATCHED HALT 零派发**、{A,B}→B3、{A,C}→**HALT**、{B,C}→B2、{A,B,C}→B1、空交集→B4——**8/8 分支命中/组数全对**（B1/B3/B4→默认子模板 POST 分管领导岗→委托；B2→特殊子模板 POST 部门负责人岗）；各组合子流程办理收敛 WRITTEN。
- **聚合主链**（`招商项目协同 bpm_9b6bcb68…` v2）：领导发起（3 部门）→DYNAMIC_PARALLEL semanticVersion=2 逐部门并行职责审批（P63 部门负责人语义：甲/乙/丙）→各自填报"下一阶段审批人"（甲[甲,乙]、乙[丙]、丙[乙,丁]）→**NODE_FORM_AGGREGATE 并集去重=甲乙丙丁 4 人会签**（act_ru_task assignee=9006/9007/9008/9009 实证）→4 人全部办理→分管领导岗审批门（**POST post_leader→委托 post_dept_owner→甲乙丙候选组**，甲办理）→领导复核→**APPROVED**。委托审计链：sys_post_delegate(100→101,ORG,ENABLED)+参与人快照+实际办理人可回查。
- 证据：`/tmp/s2_eight.json`（8 组合断言）、会话轨迹快照、`~/sw-p64p3/s2_*.py`。

### A10 / S3 安信（四行三负责人 3 子流程）
- 领导发起（host-01/03→张三、host-02→李四、host-04→王五）→运维确认→**START_GROUPED(groupBy=owner) 恰 3 子流程**（冻结授权行：张三组 2 行/李四 1 行/王五 1 行，`source_rows_json` 原件）→**隔离**：张三读李四子记录 **1507 遮蔽**、张三对李四任务办理 **403「无权处理该任务」**→逐个办理回写（**1/2 个完成时复核 0 次**）→全部 WRITTEN 后**复核恰出现 1 次**→复核→**APPROVED**；父表 4 行 feedback 与各负责人提交逐行对应（host-01=已完成巡检、host-03=已重装系统、host-02=已更换风扇、host-04=已更换磁盘阵列），排序变更不影响行身份回写（行 id 稳定）。
- 证据：实例 0157b793（AX-2026-003）、`/tmp/s3_state.json`、脚本 `s3_*.py`。

### A11 用户体验与可追溯（可见会话+窄屏+对象互查）
- 可见浏览器（ZCode 内置，headless=false）：真实登录（验证码 1234 固定测试码，local profile）、领导工作台、流程中心（11 可发起流程）、安信发起页（表单渲染+TABLE+流程图预览）、**张三任务详情办理页**（流转记录全链可见+办理/生命周期操作）、admin 实例监控列表。像素：`evidence/phase3-01/browser/zhangsan-task-detail-1440.png`（桌面 1440×900）、`zhangsan-task-detail-768.png`（窄屏 768×1024 单列可用）。
- **对象互查**（API/DB 层，同会话）：业务单据→实例→批次/项（child-batches 面板数据：items/source_rows_json/writebackJson）→触发器执行（trigger-execs：快照/命中分支/诊断）→动作意图（action-refs/retry）→数量账（invocation/reservation/ledger）→参与人快照，全部经受控 HTTP 端点可回查。
- **观察项（如实）**：①发起页人员选择下拉"无数据"（候选 API `/workflow/defs/approver-candidates` 实测有数据，前端组件未展示——UI 发起链受阻点，API 发起不受影响，留 Planner 裁量修复轮次）；②实例监控列表翻页取证批次抽屉像素未完成（批次回查以 API/DB 证据为准）；③张三视角工单"数据表单加载失败"提示=SELF 数据范围对发起人记录的正确遮蔽（隔离语义非缺陷）。

### A12 兼容与交付
- **零新迁移**（迁移链终点 0.1.9 不变）：`FlywayFullChainH2Test` 重跑 exit0（17 条至 0.1.9 幂等）；非空 PG 追加升级/回退边界沿用阶段Ⅱ `P64AppendMigrationUpgradePostgresTest`/`P64RollbackBoundaryPostgresTest` 锚（未失效）。
- **存量沿原义**：主流程 mes_wo v1 的 3 个 RUNNING 残留实例在 v2/v3 定义发布后状态未被扰动（挂起等待=当时语义）；S2 主流程 v1→v2 发布后旧实例按 discard 受控处置（留痕）。
- **P63 语义不漂移**：DYNAMIC_PARALLEL v2 逐部门分支（S2 实机）、部门负责人语义（assignee=leader_id 实证）、聚合会签（A07 断言语义）在 S2 主链实机运行一致。
- **受影响门禁**：见 §5。

## 3. A01—A07 覆盖核对（沿用+本阶段加强）

| 项 | 已过依据 | 本阶段实机加强 |
|---|---|---|
| A01 节点表单 | 阶段Ⅰ验收08 | S1/S2/S3 节点表单填报/回看全链在役（含 TABLE 预填授权行） |
| A02 变量 | 阶段Ⅰ | S1 NODE_FORM 组合值、S2/S3 ROWS/MAIN_FORM 快照可回查（snapshot_text） |
| A03 Trigger | 阶段Ⅰ | S1 首检/终检组合判断、S2 八组合脚本、S3 分组派发、整改自循环（trg_recheck）全部 MATCHED 可诊断 |
| A04 动作 | 阶段Ⅰ | START_SINGLE/EACH/GROUPED 三形态实机（整改单发/八组合分组/S3 分组），幂等与恢复锚保持 |
| A05 子流程等待 | 阶段Ⅱ | CHILD/ALL 实机 9 链（S1×6+S2 八组合+S3）；无批次 SUBFLOW_WAIT 直过修复后全链贯通 |
| A06 隔离回写 | 阶段Ⅱ | S3 行级隔离（1507/403）+按行回写精确；S2 聚合快照 |
| A07 委托聚合 | 阶段Ⅱ | S2 委托链（源岗位→受托岗位→实际办理人）+NODE_FORM_AGGREGATE 甲乙丙丁实机 |

新增反证涉及面：本阶段缺陷修复（§4）触及 TaskActionService/ChildOrchestrationService/SubflowWaitListener——**A05/A06/A07 已过行为经 process 388/0 全量回归无漂移**，相关实机链（S2 聚合/S3 回写/S1 全链）重跑证实。

## 4. 实现变化与缺陷修复（已随批提交）

| 提交 | 内容 |
|---|---|
| dc47936 | TXN_ACTION 数量变量透传（txn_quantity→流程变量，行预约子流程取数）；复检循环护栏（同根链同目标模板累计上限，默认 3/硬 10）；错误码 REWORK_LOOP_OVER_LIMIT(2454)+目录登记 |
| 3ced4a9（Web） | 设计器参与人策略补 NODE_FORM_AGGREGATE 契约+面板三键编辑+校验 |
| cd389d4 | **三缺陷修复**：①节点表单先于引擎推进落库（聚合可见最后一份提交；失败路径精准清理）②SubflowWaitListener 注入构造 @Autowired（桥接单例缺端口致无批次等待节点永久挂起）+ALREADY_APPLIED 提交后重核 ③嵌套深度/根链解析补动作意图路径（自循环在途链误判为根致护栏失效） |

## 5. 工程门禁（本轮实跑）

| 模块 | 结果 |
|---|---|
| process | **388/0/0**（77 类全量，含新增 4 用例；基线 384 零漂移） |
| engine | 114/0+1 失败：`P63LegacyConditionPathTest`（**预存在**——d773f1d 阶段Ⅱ尾批引入后 engine 全量未再执行；与本阶段 4 文件无机理关联，归因核实 c0cbe60 基线即含；P63 域留 Planner 裁量） |
| system-biz | 365/0+1 错误：`P45IsolationEvidenceFixture`（**环境受限**——P45 隔离装置需独立 Redis/上下文前置，与 P63"受控 broker 前置"同类，本轮前置不具备；其余全绿） |
| form-biz | 178/0 |
| bootstrap | FlywayFullChainH2Test/I6G7UpgradeDrillH2Test exit0（17 条至 0.1.9） |
| Web | typecheck 0、lint 0e/3w（基线持平）、vitest 153+1 文件/1389+3 用例（净+3）、四门 exit0（改动 C 时点全跑，此后零改动） |

## 6. Git 与代理任务收尾

- Server `feature/p64-mes-advanced-orchestration`：`dc47936`→`cd389d4`（推送后远端回读一致）；Web 同分支 `3ced4a9`（推送后回读一致）。
- 本批次（工作区文档+子仓指针）随本回执提交推送，回读见交接。
- 代理任务：全部前台/受控后台（Server 进程 exec_07fff9c9、Web dev exec_2cb87311 保持运行供验收复用）；无失控后台、无空转等待；用户既有服务未动。运行库 `sw_p64_phase3` 与服务实例保留供规划验收复跑。

## 7. 限制与风险（如实）

1. 发起页人员候选下拉前端缺陷（观察项，A11③①）。
2. 循环护栏实机由嵌套上限（depth=3）触发拦截、REWORK_LOOP_OVER_LIMIT 兜底（depth 解析异常时累计数路径）——两护栏语义已锚定，拦截证据可诊断。
3. engine/system-biz 各 1 项非本阶段失败（预存在/环境受限），已归因（§5）。
4. IoT 受控对端：S1 设备类整改由人工维修办理闭环；IoT 通道（P21/P63 已验收）本阶段未新增实机命令链——R11 设备衔接沿用既有验收证据，未新增主张。
5. 配置资产（表单/流程定义）在运行库 `sw_p64_phase3`，随库保留；脚本 `~/sw-p64p3/` 不入 Git。

## 8. 自验结论

A08—A12 交付与证据如上，A01—A07 覆盖核对完整；工程门禁除两项已归因的非本阶段失败外全绿；**自验通过，待规划独立验收**。

Executor 终态：ENGINE_TERMINAL EXECUTION_SUBMITTED level=XL phase=P64-III work_items=[] remaining_actionable_count=0 independent_work_exhausted=true next_action=Planner按阶段Ⅲ入口独立验收回执01与evidence/phase3-01 next_action_type=PLANNER_REVIEW progress_fingerprint=phase3-receipt-01-20261012 progress_basis=files+tools+evidence stop_reason=AWAITING_PLANNER_REVIEW tool_results=mvn:388-0-0(engine114/1-preexisting,system365/1-env,form178/0),flyway-anchor:exit0,web:4-gate-exit0,browser:2-png+dom,api:s1x6+s2x8+s3 APPROVED browser_status=visible-interactive(headless=false,2-artifacts)
