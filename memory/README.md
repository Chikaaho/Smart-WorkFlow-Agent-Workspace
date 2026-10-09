# memory 使用说明

P64=IN_PROGRESS；阶段ⅠVERIFYING（回执06 已提交，待规划复审06）。唯一下一动作=Planner 独立复审回执06 与 phase1-06 九项证据包；原实施授权有效。本轮修复=04b 任务绑定版本发布冻结（首草稿前后再发布不漂移）、06b 二段失败可诊断+受控恢复（X5 收敛，不再 500）、04a 乐观锁冲突禁止同事务重放（X7 双激活根因）、07a 已启用 P64 关闭后收敛；02a/02b/05a/06a 原证已落 product；08a 覆盖/退出/Git 收尾完成。Server 578ef6b/Web 53eec1e 远端回读一致；主库 0 RUNNING 全终态。功能47、46/22/22=90、ADV64、问题57、P63/VB锁定、P62延期、gitlink78495dc保持；Admin已结案。

memory 为规划最小摘要；`knowledge/current-status.md` 为持久权威（历轮 P63/P62 长条目已迁 `knowledge/history/current-status-through-2026-10-08-p63-stage3-before.md`），`product/` 保存裁决与证据。

- P62 批准功能范围 COMPLETED（规划已确认，2026-10-06）；性能 Owner 延期未验证、新资源策略默认关闭；裁决 `planning-final-review-terminal-sync-final-delivery-02-completed.md`。
- 阅读 state→handoff→features→constraints，按需 decisions/issues/architecture。
- 0.1.3 COMPLETED（Owner 已验收，2026-09-30）；产品版本/tag/Release/部署事实不变。
- 当前规划目标=P64阶段Ⅰ回执06 待规划复审（九项修复/补证已提交）；无性能执行任务。实施授权保持，当前待办以阶段审查为准。

- 历史设备交接：`product/governance/device-handoff-20261008.md`；目标机分支/Git事实已有变化，按当前传播审查核实，Windows hook已安装并按Owner裁量结案；真实派发边界见Admin回执。
