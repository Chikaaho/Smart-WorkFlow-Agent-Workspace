# memory 使用说明

P64=IN_PROGRESS；阶段ⅠPASSED锁定，阶段ⅡVERIFYING（审查01 差异账本已按回执02 逐项处置，2026-10-10 提交待规划独立验收）、阶段Ⅲ未验收。回执02 交付：设计器 CHILD 可视化配置经可见会话发布 v2（含 mainFields，图/DB/API 三层回读一致）；实机全链（N=2 分组派发/ALL 结算一次/等待推进/父 APPROVED）与行级回写（张三2行/李四1行逐行版本守卫、集合外拒绝）；冲突→有权恢复→BLOCKED 重结算；委托启停实机（源岗位↔受托岗位待办切换）；修复⑤⑥⑦（分组多行回写/恢复版本清理/BLOCKED 结算）＋缺陷③提交。限制（如实）：登录后页面视觉原件受宿主截图面能力限制（错误已归档，替代证据=结构化页面状态+逐请求日志+API/DB 回读）；聚合会签为单测原断言（完整链属阶段Ⅲ A09）。门禁：engine109/0、process360/0、链19/0、Web四门 exit0（1382+3）。唯一动作=Planner 按审查01 账本独立验收回执02。47、46/22/22=90、ADV64、问题57、P63/VB、P62延期/策略OFF、gitlink78495dc 保持。HK-Z 前次核查通过且间歇派发根因未定；HK-C 按 Owner 要求继续挂起。

memory 为规划最小摘要；`knowledge/current-status.md` 为持久权威（历轮 P63/P62 长条目已迁 `knowledge/history/current-status-through-2026-10-08-p63-stage3-before.md`），`product/` 保存裁决与证据。

- P62 批准功能范围 COMPLETED（规划已确认，2026-10-06）；性能 Owner 延期未验证、新资源策略默认关闭；裁决 `planning-final-review-terminal-sync-final-delivery-02-completed.md`。
- 阅读 state→handoff→features→constraints，按需 decisions/issues/architecture。
- 0.1.3 COMPLETED（Owner 已验收，2026-09-30）；产品版本/tag/Release/部署事实不变。
- 当前规划目标=P64阶段ⅡVERIFYING；唯一当前差异账本=product/p64-mes-advanced-orchestration/receipts/planning-review-phase-2-01.md；Executor继续实施/补证并追加回执02，无性能执行任务。

- 历史设备交接：`product/governance/device-handoff-20261008.md`；目标机分支/Git事实已有变化，按当前传播审查核实，Windows hook已安装并按Owner裁量结案；真实派发边界见Admin回执。
