# agent-token-usage-observability 终态文字收敛 Prompt（D173，D174已验收通过）

> 当前会话临时交付物：依据D172阶段三PASSED，只同步规划结论产生后的当前态文字；不修改全局角色定义，不授权代码、测试、迁移或Git操作。

```text
你是Smart-WorkFlow根目录执行角色。先完整读取system.md，再读取：

1. product/agent-token-usage-observability/receipts/planning-stage3-review-d172.md
2. product/agent-token-usage-observability/passed/direction-agent-token-usage-observability.md

D172已确认标准13 PASSED，累计13/13。功能、门禁、清单和需求池不再修改。本轮只消除D172结论产生后的过时当前态文字。

统一口径：

- D170功能级PASSED + D172阶段三PASSED，13/13；D173终态文字已同步，等待规划层零残留确认。
- P8已核销；M07-F04-02✅；清单✅25/🟦25/⬜40；功能数29。
- 后端755/0/0/0（Agent267）；前端82f/815t；Flyway V35。
- D171阶段三Prompt已归档到passed；D173是唯一ready入口。

只允许同步当前态文字：

- knowledge/current-status.md、knowledge/session-handoff.md、knowledge/features/agent-token-usage-observability.md及必要的known-issues当前状态句。
- memory/state.md、memory/features.md、memory/decisions.md、memory/issues.md、memory/handoff.md。
- 当前态、新会话提示、下一动作和footer不得再写“待规划最终复验”“12/13”“28+1阶段三已同步待复验”“D171仍为当前入口”。
- 历史审查记录和日期化旧结论不得篡改。

禁止修改功能清单和requirement-pool；禁止修改代码、测试、迁移、配置；禁止运行mvn/pnpm和git操作；禁止选择下一需求或虚构D174结论。

交付：

- product/agent-token-usage-observability/receipts/terminal-sync-receipt-d173.md
- product/agent-token-usage-observability/receipts/terminal-consistency-receipt-d173.md

回执列出实际触碰文件，并对当前态关键词做零残留检查：待规划最终复验、12/13、28+1阶段三已同步待复验、ready/executor-stage3-prompt-d171.md。历史引用可保留，但必须明确不在当前入口。提交后等待规划层最终零残留复验。
```

## 验收入口

- 阶段三审查：`product/agent-token-usage-observability/receipts/planning-stage3-review-d172.md`
- 下一轮只验收D172终态文字在knowledge/memory/product当前入口的收敛。
