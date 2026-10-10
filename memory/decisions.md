# 近期有效决策摘要

P64=IN_PROGRESS；阶段ⅠPASSED锁定，阶段ⅡVERIFYING（审查01 差异账本已按回执02 逐项处置，2026-10-10 提交待规划独立验收）、阶段Ⅲ未验收。回执02 交付：设计器 CHILD 可视化配置经可见会话发布 v2（含 mainFields，图/DB/API 三层回读一致）；实机全链（N=2 分组派发/ALL 结算一次/等待推进/父 APPROVED）与行级回写（张三2行/李四1行逐行版本守卫、集合外拒绝）；冲突→有权恢复→BLOCKED 重结算；委托启停实机（源岗位↔受托岗位待办切换）；修复⑤⑥⑦（分组多行回写/恢复版本清理/BLOCKED 结算）＋缺陷③提交。限制（如实）：登录后页面视觉原件受宿主截图面能力限制（错误已归档，替代证据=结构化页面状态+逐请求日志+API/DB 回读）；聚合会签为单测原断言（完整链属阶段Ⅲ A09）。门禁：engine109/0、process360/0、链19/0、Web四门 exit0（1382+3）。唯一动作=Planner 按审查01 账本独立验收回执02。47、46/22/22=90、ADV64、问题57、P63/VB、P62延期/策略OFF、gitlink78495dc 保持。HK-Z 前次核查通过且间歇派发根因未定；HK-C 按 Owner 要求继续挂起。

> 同步点：2026-10-10（Planner阶段Ⅱ审查01；HK-C Owner挂起）；完整持久状态由Executor按knowledge-first同步，Planner未读取knowledge。

- P64：业务主链以多流程编排；主表/节点表/变量各司其职，JS只判断、动作受控执行；后台源岗位→受托岗位委托映射，经组织任职解析实际办理人、同轮冻结；分组子流程隔离回写、四等待策略及迟到结果冻结。变量有效轮次/缺值、S2八组合、数量账业务结果、规模护栏与存量兼容已收敛，详见方向。
- 当前状态与历史物理分离；当前值只见 `knowledge/current-status.md`（历轮 P63/P62 长条目已迁 `knowledge/history/current-status-through-2026-10-08-p63-stage3-before.md`）；终态机器契约单一源 `.codex/governance/terminal-contract.json`。
- Planner 以 `memory/` 最小摘要恢复；冲突时按 knowledge 权威修正，不反向裁决。
- P62 批准功能范围 COMPLETED（规划已确认，2026-10-06）；性能 Owner 延期未验证、新资源策略默认关闭；46 为 P62 验收时点值，当前项目总数47。
- P63 关键边界：普通手工并行兼容=Owner 硬边界（分支/汇聚语义由原图决定、旧图保存不丢合法未知配置、不自动转换）；预约=成功完成后一次性、显式时区（歧义/不存在拒绝）、到期/过期不补发、窗口 1—3600s 默认 60、取消与认领竞争单结果生效；v1 动态语义不迁移；UNKNOWN 禁自动重发+受控人工核实；**全部收敛≠全部成功**（无效果且执行权终止可 EXPIRED、进行中/部分效果依权威结果）。
- P60 I3—I6 关键裁决保持：I3 沿用 P57 节点能力与 `ProcessGraph` 契约、`bpmn-js` 移出生产依赖；I4 外部联调用受控真实 HTTP 对端；I5 三 Provider 真实链钉钉/飞书 PASSED（审查07）、企业微信 Owner 延期；I6 通知投递以持久化为权威、失败不回滚已合法审批，五渠道 Owner 延期/未验证（P37/P38/P39 不核销）。
- P61：旧数值 `code` 保持兼容，以可选且全局唯一 `errorKey` 消歧；公共 `msg` 不承载原始诊断；启用 `zh-CN/en-US` 且防枚举。
- BAO 已整体 COMPLETED（规划已确认，2026-09-26）；关键边界：动态宽表 SQL 唯一受控入口 `DynamicTableSql`（fail closed）；引擎与业务写入共享同一提交边界、流程发起与业务实例同事务；生产 IoT provider 缺省时设备控制按既有异常体系 503 fail closed、缺凭据启动失败；`${revision}` 双版本机制与 `scripts/build-prod.sh` 制品门禁继续生效；PG 为生产权威，不证明腾讯真实云送达。
- 资源功能闭环子阶段 COMPLETED（规划已确认，2026-10-05）；终审 `planning-final-review-terminal-sync-resource-functional-closure-01-completed.md`。
- 0.1.3 COMPLETED（Owner 已验收，2026-09-30）；UAT 运行 0.1.3 种子基线 v0.1.0；发布/部署身份保留原时点。
