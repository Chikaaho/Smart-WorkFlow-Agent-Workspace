# role-menu-permission-parity 阶段三终态同步方向（D123 后）

> **规划层产出**：本文件只定义终态同步目标、边界和验收方向；执行层自行安排同步与全文核对方式。

**状态**：READY  
**前置判定**：`product/role-menu-permission-parity/receipts/planning-final-review-d123.md`（功能级 PASSED）

## 1. 目标

将 role-menu-permission-parity 的 D123 功能级 PASSED 结论同步为全工作区唯一终态，清除验收前当前态残留，使 knowledge、memory、功能清单、需求池、交接与 product 生命周期一致。

## 2. 必须同步的终态

- 功能状态：COMPLETED，作为第 26 个已完成功能。
- `M02-F02-01`、`M02-F03-01`：✅；功能清单总计 ✅23 / 🟦27 / ⬜40。
- P1：正式核销；I31/I36/F02/F03 全部子项闭合。
- I53/I54：保留权威登记与“已修复”证据，不删除问题历史。
- 测试基线：后端 674/0/0/0、前端 73 spec / 681 tests、Flyway V34/双方言 34 条。
- 下一动作与新会话提示：本功能已完成，不再要求执行 D122 修正或规划终验；下一需求尚未选定。

## 3. 同步范围

- `Smart-WorkFlow/功能清单.md`。
- `knowledge/current-status.md`、`knowledge/features/role-menu-permission-parity.md`、`knowledge/known-issues.md`、`knowledge/session-handoff.md` 及其直接索引。
- `memory/state.md`、`memory/features.md`、`memory/issues.md`、`memory/handoff.md`；无新决策则不改 `memory/decisions.md`。
- `todo/requirement-pool.md`。
- `search_fallback/m02-role-menu-button-permission-config.md` 的消费状态仅在必要时校正，不改写历史探索内容。
- product 方向和回执的生命周期状态。

## 4. 非目标

- 不修改任何业务代码、测试、迁移、依赖或 Mock。
- 不重新运行编译、测试或构建；复用 D123 已验收的 674/73f681t 证据。
- 不改动 P2+ 候选、无关功能状态或历史回执。
- 不删除 D122 FAILED 历史；只清理将其误写为“当前状态”的表述。

## 5. 验收标准

1. 权威知识、压缩记忆、功能清单、需求池、交接和 product 生命周期对同一终态无冲突。
2. 当前状态、候选列表、下一动作、新会话提示词、测试基线、功能计数均完成全文核对。
3. “D122 FAILED”“待规划层最终验收”“修正待验收”“第 26 个待确认”等仅允许出现在明确历史语境，不得作为当前态残留。
4. P1 只核销本条，不误改 P2-P50；M02 其他功能状态不变。
5. 回执列出全部触碰文件、逐项终态值、全文检查结果和未触碰范围。

## 6. 回执位置

`product/role-menu-permission-parity/receipts/post-d123-terminal-sync.md`
