# D170 规划层功能级验收：agent-token-usage-observability

> 日期：2026-08-22  
> 当前角色：规划  
> 本轮材料：`completion-receipt-d169.md`、`test-receipt-d169.md`  
> 上轮审查：`planning-rereview-d168.md`

## 1. 验收结论

**PASSED（功能级，标准1—12全部通过；标准13进入阶段三）**。

D169以真实router导航和组件挂载闭合标准6，以D150历史回执、提交快照与当前逐文件/运行小计交叉解释规划723中的幽灵1项并闭合标准11，以不自匹配的`pgrep`零快照和新鲜串行门禁闭合标准12。D166已确认的标准1—5、7—10继续有效。因此D158功能目标已达到，允许进入§3.3全量同步。

本结论不是`COMPLETED`：标准13尚未执行和复验。当前P8仍开放、M07-F04-02仍为🟦、功能数仍28、清单仍24/26/40，待阶段三同步回执通过后再确认终态。

## 2. 十三项复核

| # | 结论 | 规划层复核 |
|---|:---:|---|
| 1—5 | PASSED | 沿用D166/D168已确认的双路径持久化、聚合、隔离、未知语义、TOOL边界及非账单口径。 |
| 6 | PASSED | 三项有权用例通过真实`router.push`进入导航生命周期；ExecutionDetail/ConversationDetail实际挂载，DOM字段、Token区块及`getExecutionDetail(99)`/`listConversationMessages(42)`调用形成直接到页证据；冷启动router覆盖刷新。 |
| 7—10 | PASSED | 沿用D166的历史FAILED、逻辑删除/权限、Mock 401/403/404及V35双迁移链证据。 |
| 11 | PASSED | 当前运行小计24+344+365+22=755，Agent逐类267自洽。D150回执把685→698写为+13，但修改清单只有AgentGraphInterpreterTest新增12；D146→D154提交与当前非Agent均为488且逐文件零差异，证明规划723隐含的489是历史计数幽灵，不是当前删除或非目标回归。当前真实对账为HEAD722→755=Agent234→267的+33、非Agent488→488。 |
| 12 | PASSED | 后端08:57:33—08:58:18、前端08:58:31—08:59:52严格串行；双方2G。开始前分别以`pgrep -f`字符类排除自身，exit=1且复核计数0。后端755/0/0/0 BUILD SUCCESS；前端typecheck/lint/test/build最终全绿，82f/815t。首轮lint失败已修复后重跑通过并如实披露。 |
| 13 | PENDING | 已具备进入阶段三条件，等待§3.3全文同步及规划复验。 |

## 3. 功能级基线

- 后端：**755/0/0/0**，sw-basic-agent **267**。
- 前端：**82 spec files / 815 tests**，typecheck/lint/test/build全绿。
- Flyway：**V35**，H2/PostgreSQL新库与升级链通过。
- 门禁：Maven/Node均为2G，前后端严格串行。

以上基线自D170起作为功能级已确认事实；功能终态、清单、需求池和完成数仍须等待标准13。

## 4. 阶段三边界

- 全文同步P8、M07-F04-02、功能清单、需求池、current-status、feature追踪、known-issues、session-handoff及memory入口。
- 目标候选口径：M07-F04-02升✅、P8核销、清单24/26/40→25/25/40、完成功能数28→29；由阶段三回执证明后再由规划层最终确认。
- 当前状态只能写“D170功能级PASSED / 阶段三待规划复验”，不得提前声称D172或规划终态COMPLETED。
- 代码和已通过门禁不要求重跑；阶段三只做状态、知识、交接和归档一致性。

## 5. 状态裁定

- 功能：**PASSED（功能级，12/13）**
- 标准13：进入阶段三
- P8/M07-F04-02/清单/功能数：终态前暂不变
- 功能方向：可归档`passed/`
- 阶段三入口：`ready/executor-stage3-prompt-d171.md`

