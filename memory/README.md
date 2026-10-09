# memory 使用说明

P64=IN_PROGRESS；阶段ⅠVERIFYING（回执05 已提交，待规划独立复审）。三级提示03 的 13 项剩余断言已收敛（证据树 `product/p64-mes-advanced-orchestration/receipts/evidence/phase1-05/`）。观察项：FLOW_START 载荷受理时固化绑定 defKey，终态失败窗口收敛需 ORCH 级重跑（retryActionRef 仅覆盖 ORCH-FAILED 形态）。唯一下一动作=Planner 独立复审回执05。两仓零新提交：Server b1f9832/Web 058e90f（远端回读一致 0/0）。功能 47、46/22/22=90、ADV64/P63/VB/P62 延期、根 gitlink 78495dc 保持。

memory 为规划最小摘要；`knowledge/current-status.md` 为持久权威（历轮 P63/P62 长条目已迁 `knowledge/history/current-status-through-2026-10-08-p63-stage3-before.md`），`product/` 保存裁决与证据。

- P62 批准功能范围 COMPLETED（规划已确认，2026-10-06）；性能 Owner 延期未验证、新资源策略默认关闭；裁决 `planning-final-review-terminal-sync-final-delivery-02-completed.md`。
- 阅读 state→handoff→features→constraints，按需 decisions/issues/architecture。
- 0.1.3 COMPLETED（Owner 已验收，2026-09-30）；产品版本/tag/Release/部署事实不变。
- 当前规划目标=P64阶段Ⅰ回执05待规划复审；无性能执行任务。实施授权保持，当前待办以阶段审查为准。

- 历史设备交接：`product/governance/device-handoff-20261008.md`；目标机分支/Git事实已有变化，按当前传播审查核实，Windows hook已安装并按Owner裁量结案；真实派发边界见Admin回执。
