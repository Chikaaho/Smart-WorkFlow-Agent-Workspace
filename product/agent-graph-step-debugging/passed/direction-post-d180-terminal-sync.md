# D180 后终态同步方向：agent-graph-step-debugging

> 纯文档/状态同步，不修改业务代码，不新增迁移，不重跑任何已锁定测试。

**状态**：PASSED（D183，终态同步8/8，功能COMPLETED）  
**前置结论**：D180 功能级与阶段三验收 PASSED（15/15）  
**目标**：把 D180 规划结论同步为唯一当前终态，使 P7、M07-F02-04、清单统计、基线、功能数、knowledge、memory 与 product 入口全文一致。

## 非目标

- 不修改后端、前端业务代码或测试代码。
- 不重跑标准1—15、Maven、前端四门或迁移链。
- 不引入新功能、新I/P编号或扩大D175范围。
- 不改写D176—D180历史审查记录。

## 验收标准

1. `Smart-WorkFlow/功能清单.md` 的 M07-F02-04 由 🟦 正式升为 ✅，描述不再含“拟晋级/待规划复验”；统计由 **✅25/🟦25/⬜40** 更新为 **✅26/🟦24/⬜40**，总数仍90。
2. `todo/requirement-pool.md` 正式核销P7，不再保留“拟核销/整体暂不核销”等当前态文字；历史核销依据指向D180。
3. 当前正式基线统一为后端 **827/0/0/0（agent338）**、前端 **86f/850t**、Flyway **V36**；不得继续把755/267、82f815t、V35写作当前正式基线，历史段落可保留日期语境。
4. `knowledge/current-status.md`、`knowledge/features/agent-graph-step-debugging.md`、`knowledge/known-issues.md`、`knowledge/session-handoff.md` 全文同步D180 PASSED及终态；I45只关闭M07-F02-04单步调试子集，不误关其他缺口。
5. `memory/state.md` 当前进行功能清空或转入最近完成；`memory/features.md` 将本功能改为COMPLETED；`memory/handoff.md` 顶部、下一动作和新会话提示统一终态；`memory/decisions.md` 保留规划层D180结论，不由执行层代写新规划裁定。
6. 已完成功能数由29更新为 **30**；P7核销、M07-F02-04✅、清单26/24/40、827/338、86f850t、V36在所有当前入口一致。
7. 主方向保持`passed/direction-agent-graph-step-debugging.md`；本终态同步方向在执行回执提交时仍留`ready/`，由规划层复验后归档。
8. 回执列出实际触碰文件、逐项变更、旧当前态全文零命中结果、无关清单/其他P/I编号零漂移；不得运行测试或修改代码。

## 交付要求

- 执行层只完成上述终态同步并提交独立回执。
- 不得代写新的规划PASSED/FAILED判定；只引用D180既有结论。
- 规划层复验通过后再确认COMPLETED并归档本方向。
