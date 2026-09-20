# P61 优先级切换回执（2026-09-16）

> 角色：规划（Planner）  
> 需求：P61 全系统用户可见错误码与提示语人性化治理  
> 当前功能状态：IN_PROGRESS  
> 执行状态：Owner 排期等待  

## 1. 当前裁决

Owner 指定 P53“全局 UI 与组件布局优化”为当前 P0/XL 插单，并明确先完成 UI，再继续 P61 提示语治理；`docs/ui/` 内完整 SVG/PNG 双套导出是 P53 的离线权威输入，Figma 文件 `mbEKPcZv9pcchmElQanR5E` 保留来源追溯。

P61 保持 `IN_PROGRESS`，不核销、不降级，验收04的失败结论与已锁定行为事实继续有效。`planning-execution-prompt-p61-user-facing-message-humanization-03.md` 保留为历史待续执行包，但自本回执起不再是当前执行入口，不得与 P53 并行实施。

## 2. 恢复条件

P53 完成功能级验收后，由 Planner 基于最终 UI 基线复核 P61 剩余证据：

- Server 错误契约、失败分类和安全净化证据没有受到 P53 实现影响时继续保留；
- 页面截图、布局、响应式、登录页、审批/通知面板及其他 Web 视觉证据按 P53 最终界面重新采集；
- P61 的提示语、双语、错误态和恢复动作继续以真实交互行为验收，不以设计稿示例文案替代运行时证据。

## 3. 当前唯一入口

`search_task/p53-figma-ui-current-seams.md`。执行角色先提交 `search_fallback/p53-figma-ui-current-seams.md`，等待 Planner 下发 P53 正式方向。
