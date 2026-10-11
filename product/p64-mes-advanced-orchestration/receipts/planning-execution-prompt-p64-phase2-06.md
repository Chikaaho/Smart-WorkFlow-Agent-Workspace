# P64阶段Ⅱ补充提示06：原证边界与当前交接收口

2026-10-11；Planner委派Executor。依据[复审07](planning-review-phase-2-07.md)和[唯一模板](../../governance/supplemental-execution-prompt-template.md)。**替代[提示05](planning-execution-prompt-p64-phase2-05.md)作为唯一当前剩余账本**；05及更早只作追溯。完整实施、knowledge-first和精确普通Git授权持续；追加回执08。主合同及角色边界不变。

## 1. 精确输入和诊断

必读复审07、本提示、[回执07](phase-2-completion-receipt-07.md)、[阶段Ⅱ合同](../ready/direction-p64-phase2-personnel-parent-child.md)与现有实施授权。只按目标引用phase2-07原件：
- raw/source/07-06aC-rootchain-source-excerpts.txt；raw/unit/process-final/TEST-com.sw.ck.bpm.process.service.ChildOrchestrationServiceTest.xml及RootChainRaceTest.xml。
- P2-07b.md、raw/git/07-three-repos-cutoff.txt；本轮Planner已修memory/todo/ready路由；Owner[P62恢复安排](../../p62-lowcode-transaction-bpm-tiering/ready/direction-p62-performance-resume-20261011.md)。

源摘录/报告恢复已实质成功，不能继续重复整个05。剩余分类：生产事务/副作用主张超出摘录、COUNT三case缺原文；当前字段缺实际原行且路由过期；gitlink事实冲突可能源于Owner先前提交，须先核来源。纠正规划证据口径：不要求无item/intent写入的freezeBatch隔离用例造空计数，不强制重跑全部门禁，不要求未经核实回退指针。

## 2. 唯一原子矩阵

| 原子ID（父ID映射） | 最新差异/完成正向 | 必要反向/对象身份 | 最小证据与允许替代 | 下一动作/合法停止 |
|---|---|---|---|---|
| P2-06a-C-T（06a-C→T） | 原文没有生产事务注解/入口及mapper锁SQL；竞争有sum1000/batchCount2但无item/intent直接计数。证明锁覆盖生产检查-插入至提交，以及超限拒绝没有后续item/intent | 当前业务3341de5（07实测7fffef9只加docs）；同根不同batch竞争已过，不用另环境替换。异常不得被吞后继续派发 | 工具提取注解/生产调用事务/锁SQL/拒绝至登记边界最小片段，带源SHA、行号、命令、时点；引用现有竞争1/0及四case26/0。允许源异常先于登记且传播中止的组合证明；或既有零副作用原断言/运行记录。缺陷才最小修复及相关门禁 | 先提取可恢复片段并精确区分直接断言/组合证明，收口原标准；真实工具限制有原结果和替代穷尽才按契约停止 |
| P2-07b-G-C（07b-G→C） | waitingBatch已过，但三个COUNT方法未导出；须能复读实际K/settled/expectedCount和推进/迟到/失败断言 | 同ChildOrchestrationServiceTest源af054384…、07 XML26/0；禁止方法说明替原文 | 导出countPolicy_belowKDoesNotSettleOrSignal、countPolicy_reachesKSettlesOnceAndLateNeverRetouchesUsedResults、countPolicy_failureDoesNotCountTowardK及必要helper；waitingBatch直接引用07。原文↔case↔同快照报告，**无需运行** | 一次工具提取+原文完整性核对；完成或真实限制按契约 |
| P2-07b-S（07b→S） | 包内字段表不是更新后权威原行，许可入口仍追加07；要当前路由一致且可回读 | ⅠPASSED/ⅡVERIFYING/Ⅲ未验收/整体IN_PROGRESS；47/90/ADV64/57；P62功能COMPLETED，性能待阶段Ⅱ通过后恢复且当前未启动、策略OFF | 复用本轮Planner许可修订，先更新knowledge受影响当前字段和实际Server清单，再同步原授权摘要；在product附路径:行号/实际原行/工具时间和覆盖表，不全量复制知识库。包括Owner性能恢复安排、验证定义v5当前事实及gitlink核实结论 | 最后事实齐全后knowledge-first并回读；文档精确普通提交推送，原条款授权持续；真实失败独立工作穷尽才停 |
| P2-07b-L（07b→L） | 旧固定78495dc/7af86f24与07索引7fffef9/4333145冲突；查清首次变化来源，保留真实层级 | 根develop-sw档案最终75cff8d8；Server683116d/Web4333145。HEAD树、index、子仓worktree分别记录；不自行切换 | 有界只读Git原输出：三层指针、相关首次变化commit精确diff/时点/出处，与Owner已有“提交了”及授权范围对照。Owner已提交的新事实按来源纠偏摘要；不可证明授权时如实回传，不能把当前查询结果包装成许可 | 先核事实，独立原文/同步工作继续。不盲目恢复旧值、不扩大普通文档Git范围；确有需要Owner裁量的具体动作，保留审查材料后按契约报告 |

子ID跨后续版本保持。每项一份独立包，共享原附件；完成条件均有限，不以“等Planner读代码”为阻塞。

## 3. 锁定及禁止重验

复审07§1关闭P2-04a、P2-05b-A、process384/77/exit0、锚56/Nested27、旧父及本轮自身进程结束和SQL0/0/0；根计数四case、竞争1允1拒/sum1000/batchCount2最新快照已过。复审06关闭诊断展示与在役收敛。阶段Ⅰ、此前明确读取/权限/布局/Web四门/engine114/system365/form178继续锁定。

本轮默认仅原文与文档收尾，不启动服务、不重建甲乙对象、不重跑process/竞争/COUNT/委托或完整MES；确有新增反证或实现变化才写明失效范围并做必需受影响验证。v4验证原证与v5使能事实分时点，禁止重开已过关闭场景。

## 4. 允许范围、顺序与生命周期

允许读取精确输入、system/Executor/目标工程宪法、原授权当前实现/测试源、权威当前入口、相关Git历史。允许修改原授权受影响当前文档、追加回执08/证据；只有T发现确证实现缺陷才允许原授权接缝修正。不写整体PASSED/COMPLETED、不核销P、不晋级正式基线、不改历史原件/治理/Hook；两指针仅查事实，不自行切换。

顺序：建立四子项账本→T/C原提取与L事实核实→只在必要时最小目标修复验证→S权威及许可覆盖→精确普通文档批次Git、远端读回→回执08。允许源摘录/哈希/计数/实际原行回读、相关只读Git及授权内普通提交推送。禁止sleep、不可控后台或空转轮询；若确需非即时验证，遵守system稳定身份/有界工作/实际进展/超时/取消清理/退出，不影响Owner服务。

## 5. 相对05改变的方法

删除乙本人整项、委托原摘录整项、最终process及锚/Nested/生命周期全部已过要求。原子化为T生产事务/异常传播证据、C三个COUNT原文、S更新后原行、L指针来源。替代路径从“再证明所有零计数”改为已有运行结果与生产原边界的充分组合；Git先查Owner先前提交，而非预设恢复老值。提交条件由下列四项实际附件判定；不复制05五包主体，不追旧386/78历史根因。

## 6. 证据与提交门禁

每项：子ID→product原文件:行号→实际结果→证据层级/适用快照/边界。工具生成MANIFEST排除自身，工作目录明确并实际回读；原文附件生成后检查确含目标注解/SQL/三方法，不只检查文件存在。当前原行与覆盖表分栏，事实/许可/历史值分栏。

正常提交全部为是：
- T生产事务/实际锁SQL/拒绝传播边界可回读，与已过最新运行关联，未夸称没有的断言？
- C三方法原文及helper与锁定XML关联完整，未重复运行？
- L实际三层指针与首次变化来源齐全，摘要按事实纠偏或具体许可冲突如实登记？
- S当前入口到复审07/提示06→回执08一致、Owner条件恢复安排准确、权威更新后原行可读、新Git截止准确？

若L确需新增Owner裁量，不妨碍先完成其余授权项并提交真实剩余；不把已通过业务项重开。按现有terminal-contract记录work_items、remaining_actionable_count、tool_results、next_action及合法停止；有可执行项继续，不另造schema。

P64整体IN_PROGRESS/ⅡVERIFYING，Planner验收后才激活P62性能就绪探索。提示06是提示05原剩余的收尾，不改变Owner触发条件；Codex无Admin续办。
