# P63功能复核04交接

2026-10-07；Planner；P63（L）VERIFYING；7/20核销、剩余13，A02通过、完整验收1/10；整体未PASSED，不进入阶段三。

新增核销G01b：保存后重开两记录主表/子表八组合，姓名/部门及多值可读。原G02a/G03b/G05a/G06c/G07a/G10c与L01—L05锁定，边界见审查03；G03a实现修正触及意图/下发，最终候选适用性在G10b补当前原件，历史通过不撤销。

部分锁定：18新格expected/actual一致+原6格=24格引擎来源；普通旧task异载荷2426/同载荷原结果/他者FAILED且新task无变化；N1跨租目标拒绝/N2目标迁租FAILED零发；legacy跨发布审批APPROVED及合法属性值；预约24字段详情；375窄屏主题/确认/通过徽标可读。不重做这些断言。

核心差异：G06a报告批准时due=now-5s仍补发，违反主方向审批已到点必过期零发；窗口仅适用此前未来合法预约。G03a N2/N3都指91522却删91521，N3不能证明软删。G05b的:R链/准入、round/并发/UNKNOWN等关键原件仅引用/tmp，不在product；恢复图无EXPIRED反馈、retry仍加载。UI链f0168904/cd007d86不对应，窄屏时间跨图不同；审批通过徽标不代替设备结果。门禁汇编仅关键计数/exit，缺候选/失败/knowledge实值/新清理；采集脚本有sleep、旧兼容增加hash，必须纠偏。

唯一入口：product/p63-mes-workflow-foundations/receipts/planning-execution-prompt-p63-04.md；裁决planning-review-completion-04.md；下一回执completion-p63-mes-workflow-foundations-05.md。提示04替代03，13项独立包；先完整移交现存原件，再修合同和错对象、补未证UI/行为，仅按实际改动跑适用门禁；不无条件全仓重跑、不长等、不hash、不重建旧库。

授权Executor仅更新knowledge相关VERIFYING、7/13、审查04/提示04/下一动作并附原值覆盖回读。Planner已同步当前摘要/方向/待办，未读knowledge/业务代码或运行工程验证；无真实外部BLOCKED证明。功能46、清单46/22/22、ADV64保持；问题57为历史基线，新缺陷如实登记。P62批准范围COMPLETED（2026-10-06）、性能Owner延期、新资源策略默认关闭；发布/部署不在本轮。轻微表单列头可后续优化。
