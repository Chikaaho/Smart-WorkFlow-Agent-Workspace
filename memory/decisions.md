# 近期有效决策摘要

P64=IN_PROGRESS；阶段ⅠPASSED（2026-10-10规划验收08），阶段ⅡIN_PROGRESS（2026-10-10 Executor实际启动）、阶段Ⅲ未验收。阶段Ⅰ语义/测试/768/升级/动作恢复锁定；启动实测两仓feature分支工作树CLEAN=origin（Server ef72c8b含代码effca33/Web 21074af）、工作区develop-sw=e6e0fb8e=origin。唯一业务下一动作=Executor连续实施阶段Ⅱ（A05—A07及相关A11/A12）并追加phase-2-completion-receipt-01.md，原完整实施及knowledge-first同步授权持续。47、46/22/22=90、ADV64、问题57、P63/VB、P62延期/策略OFF、gitlink78495dc保持。HK-Z本次核查/诊断增强通过，间歇派发根因未定；HK-C按Owner要求挂起，已通知Admin停止续办，不改配置或信任状态。裁决见product下阶段Ⅰ验收08及Hook复核02。

> 同步点：2026-10-10（Planner阶段Ⅰ验收08/阶段Ⅱ方向；Executor阶段Ⅱ启动同步；HK-C Owner挂起）；权威详情knowledge/current-status.md及对应回执。

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
