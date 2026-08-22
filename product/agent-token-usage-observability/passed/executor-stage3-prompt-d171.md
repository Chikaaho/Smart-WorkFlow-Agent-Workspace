# agent-token-usage-observability 阶段三执行 Prompt（D171，D172已验收通过）

> 当前会话临时交付物：依据D170功能级PASSED进入标准13。本文件不修改全局角色定义，也不授权业务代码、测试代码、迁移或Git操作。

```text
你是Smart-WorkFlow根目录执行角色。先完整读取并遵守system.md，再读取：

1. product/agent-token-usage-observability/passed/direction-agent-token-usage-observability.md
2. product/agent-token-usage-observability/receipts/planning-functional-review-d170.md

D170已确认标准1—12全部PASSED。本轮只执行标准13与system.md §3.3阶段三全文同步；不得修改业务代码、测试代码、迁移或重新实现已通过功能。

阶段三目标候选口径：

- 功能状态：D170功能级PASSED，阶段三同步完成后等待规划层最终复验；不得自行声称规划层COMPLETED或虚构后续规划决策号。
- 测试基线：后端755/0/0/0、sw-basic-agent267；前端82 files/815 tests四门全绿；Flyway V35双方言链通过。
- M07-F04-02：🟦→✅。
- P8：Token统计与最小会话查看入口已闭环，需求池核销。
- 功能清单：✅24/🟦26/⬜40→✅25/🟦25/⬜40，共90行；除M07-F04-02外其他行状态零漂移。
- 已完成功能：候选28→29，必须统一表述为“阶段三已同步，待规划最终复验确认”，不能提前冒充规划确认终态。

必须全文检查和同步：

- Smart-WorkFlow/功能清单.md：只改变M07-F04-02状态及其必要说明，复算90行计数，其他89行零漂移。
- todo/requirement-pool.md：核销P8；其他P项状态零漂移。
- knowledge/current-status.md：当前功能、测试/Flyway基线、清单计数、完成数、下一动作与历史段落口径一致。
- knowledge/features/agent-token-usage-observability.md：写入功能范围、13项证据、实际修改范围、测试结果、限制、风险与D170功能级结论。
- knowledge/known-issues.md：全文核对；无真实新增问题则明确零新增，不得为了凑同步虚构I编号。
- knowledge/session-handoff.md：当前状态、基线、下一动作和新会话提示统一为“阶段三已提交，待规划最终复验”。
- memory/state.md、memory/features.md、memory/decisions.md、memory/issues.md、memory/handoff.md：压缩同步D170事实与阶段三待复验状态；不得写成规划已COMPLETED。
- product目录：确认主方向已在passed、D171阶段三Prompt仍在ready等待规划复验；旧收敛Prompt不得继续作为当前入口。

全文一致性门禁：

- 当前态入口不得残留D168 FAILED、9/13、继续补标准6/11/12、723/234、79f/775t、82f/812t、V34作为“当前基线”。历史审查记录中的日期化旧结论保留，不做篡改。
- 当前态不得同时出现P8开放/已核销、M07-F04-02🟦/✅、功能数28/29、清单24/26/40与25/25/40两套口径。
- 明确区分“D170功能级PASSED”“阶段三执行层同步已提交”“规划层最终COMPLETED尚待复验”。
- 报告功能清单变更明细、需求池变更明细、knowledge触碰文件清单、memory触碰文件清单，以及针对旧当前态关键词的全文检索结果。

本轮为文档/状态同步，不要求重跑mvn/pnpm；不得把未重跑写成测试失败。不得执行git add/commit/push，未提交工作区不是阶段三阻塞。

交付：

- product/agent-token-usage-observability/receipts/stage3-completion-receipt-d171.md
- product/agent-token-usage-observability/receipts/stage3-consistency-receipt-d171.md

两份回执必须逐项对照标准13及§3.3十二项，给出实际文件清单、计数变化、零漂移证明和当前态旧词检索结果。提交后等待规划层最终复验，不自行移动D171 Prompt或宣告COMPLETED。
```

## 当前会话验收入口

- 功能级审查：`product/agent-token-usage-observability/receipts/planning-functional-review-d170.md`
- 下一轮只验收标准13与阶段三全文一致性。
