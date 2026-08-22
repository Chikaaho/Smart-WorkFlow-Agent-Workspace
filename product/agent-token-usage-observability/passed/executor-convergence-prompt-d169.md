# agent-token-usage-observability 收敛补证 Prompt（D169，历史已完成）

> 当前会话临时交付物：与`receipts/planning-rereview-d168.md`配套。本文件不修改全局角色定义、D158方向或Git授权。

```text
你是Smart-WorkFlow根目录执行角色。先完整读取system.md，再读取：

1. product/agent-token-usage-observability/ready/direction-agent-token-usage-observability.md
2. product/agent-token-usage-observability/receipts/planning-rereview-d168.md

这是D158任务连续补证。直接执行，不请求二次确认，不修改方向，不扩大范围。

本轮只闭合标准6、11、12。标准1—5、7—10沿用D168 PASSED；标准13等待规划层确认1—12全部通过。

标准6验收边界：

- 必须通过真实router导航生命周期验证有权身份直达/刷新会话详情与执行详情。
- 证据必须包含目标详情组件实际挂载后的结果，例如目标页稳定DOM标识、页面标题/字段、目标页数据请求或等价的可观察结果。
- `router.resolve`、手工调用`authGuard`、断言`next()`、只检查route name/params均不能单独作为“实际到页”证据。
- 回执逐用例写身份/权限前置、输入URL、导航动作、预期页面、实际挂载或页面结果。

标准11验收边界：

- 保留D167已经自洽的当前运行数：Agent逐类表267、模块小计24+344+365+22=755；如测试集变化则以新鲜真实结果重算。
- 必须以规划确认基线723/Agent234为比较入口。该基线隐含非Agent489，当前模块小计为488；定位差1对应的具体模块和具体测试。
- 明确说明该项是被删除、移动到Agent、改名/合并、未被当前运行发现，还是D154历史计数口径错误，并给出能够复核的旧回执/当前运行/差异证据。
- `git HEAD=722`不能单独解释规划基线723；不得用未经规划采信的新快照替换规划基线。
- 最终让规划723→当前项目数、Agent234→当前Agent数、非Agent模块变化三者完全对账，并说明不存在非目标回归。

标准12验收边界：

- 后端开始前检查pnpm/npm/node/vite前端工具族；前端开始前检查mvn/java后端工具族。
- 进程检查命令必须排除检查命令自身，能够真正得到零行、零计数或明确的无匹配退出码；不得再提交未排除自身的`ps aux | grep -E ...`并声称零命中。
- 回执记录实际命令、执行时间、原始零结果口径和退出码/计数。若D167未保存满足条件的原始证据，不得事后推断，须重新形成合规门禁窗口。
- 前后端门禁保持2G、严格串行；后端提供项目与模块运行小计，前端提供typecheck/lint/test/build各门时间、退出码与真实files/tests结果。

严格边界：

- 不修改标准1—5、7—10已经通过的功能，不进入标准13。
- 不做任何D158非目标，不执行git add/commit/push。
- 不提前核销P8、升级M07-F04-02、增加功能数、归档方向或声称规划PASSED/功能COMPLETED。

交付：

- product/agent-token-usage-observability/receipts/completion-receipt-d169.md
- product/agent-token-usage-observability/receipts/test-receipt-d169.md

两份回执逐条对照13项标准：1—5、7—10沿用D168；6、11、12提交本轮可复核证据；13等待规划功能级PASSED。提交前检查“真实页面挂载、723差1来源、进程检查不自匹配”三项均有直接结果，而不是文字推断。
```

## 当前会话验收入口

- 审查记录：`product/agent-token-usage-observability/receipts/planning-rereview-d168.md`
- 下一轮仅复核标准6、11、12；全部通过后再生成标准13阶段三Prompt。
