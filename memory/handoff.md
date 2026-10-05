# P63 MES前置能力交接

2026-10-06；Planner；P63（L）READY，尚未实现或功能验收。

## 本轮结论

已读 `search_fallback/p63-mes-workflow-foundations-readiness-20261006.md` 及附件，七组问题足以形成方向。现有部门动态多实例和IoT命令链可复用；表格人员/部门、多选组件、设计器来源配置及一次性预约仍待补。首例位于Server/Web README，内容为多部门灾备演练；根README无业务示例。静态发现不冒称本轮运行通过。

Owner补充普通手工并行不能破坏。正式方向已把手工多节点路径、汇聚、与动态节点组合及旧实例继续办理列为A09/A10；未以现有动态样本代替普通并行证据。

## 关键裁决

新动态定义按人员ID/部门ID生成审批分支，同负责人不同部门独立；重复对象保留全部来源行。新轮次重新冻结，同轮幂等；旧定义/实例继续旧规则，显式发布新版本才切换。普通审批/会签原结算语义保持。部门负责人保持单值，分管领导可显式选人。

预约只在成功完成时可靠记录意图，提交后消费；审批完成时已到期则记过期。已创建预约允许迟到默认60秒、可配置1—3600秒，显示并冻结时区及窗口；它是业务有效期而非SLA。待触发可授权取消；UNKNOWN保持不自动重发。

## 唯一下一动作

Executor按 `product/p63-mes-workflow-foundations/ready/direction-p63-mes-workflow-foundations.md` 自主实现、验证并提交 `product/p63-mes-workflow-foundations/receipts/completion-p63-mes-workflow-foundations-01.md`，覆盖A01—A10。探索已结清，不再按只读任务进入；正式方向已落盘，未代发其他聊天。

Planner审查记录：`product/p63-mes-workflow-foundations/receipts/planning-review-readiness-01.md`。普通并行现状在实现影响分析中先识别；若与Owner预期不符，报告事实，不替换图语义或降低验收。

## 基线与边界

P62批准范围COMPLETED（规划已确认，2026-10-06），本次探索确认knowledge登记已传播；不外推全入口实时状态或发布事实，不重开其业务验收。最终裁决在P62 receipts/planning-final-review-terminal-sync-final-delivery-02-completed.md。

正式功能46、清单46/22/22=90、ADV64、问题57为起始基线。Server1757/0/0/27、定向61/0/0/0单列、Web1323通过+3跳过均属P62历史锁定集合。性能Owner延期、新资源策略默认关闭；真实机房动作、完整MES及部署不纳入本轮。
