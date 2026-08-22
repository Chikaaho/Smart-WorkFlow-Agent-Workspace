# agent-token-usage-observability 收敛补证 Prompt（D167，历史已完成）

> 当前会话临时交付物：与 `receipts/planning-rereview-d166.md` 配套使用。本文件不修改 `system.md`、D158需求方向或全局角色定义，也不授权Git操作。

```text
你是 Smart-WorkFlow 根目录执行角色。先完整读取并遵守 system.md，再读取：

1. product/agent-token-usage-observability/ready/direction-agent-token-usage-observability.md
2. product/agent-token-usage-observability/receipts/planning-rereview-d166.md

这是D158当前任务的连续补证。收到后直接执行，不请求二次确认，不修改方向，不扩展范围。

本轮唯一目标：只闭合D166剩余的标准6、11、12。标准1—5、7—10已经规划确认通过，除必要回归外不得重复改造；标准13继续等待规划层确认1—12全部通过。

一、标准6必须补齐的证据

- 补“有权身份”的正向直达/刷新行为，不再重复无token跳登录的负向用例。
- 至少分别覆盖会话详情路径与执行详情路径：路由能够解析目标参数，守卫允许通过，并实际到达对应详情页面，而不是只验证路由表存在或手工调用守卫函数。
- 回执写明测试文件/方法、身份与权限前置、输入URL、预期目标页面、实际路由/页面结果。
- 既有执行历史Token三列、未知显示、非账单文案和无权守卫证据直接沿用D165。

二、标准11必须纠正的唯一计数源

- D165表格有24个测试类，其中三个计数为5；完整等式应包含三个“+5”。不得再出现“表格267、展示等式262却写成267”。
- 给出Agent逐类明细、Agent运行总数、后端各模块运行小计、项目运行总数，并确保所有加法可复算。
- 明确解释规划基线723→当前项目总数与Agent234→当前Agent总数之间的增量差：如果非Agent模块净减少1，必须指出具体模块、原数、现数以及减少原因；如果基线或当前数引用错误，应统一纠正，不得引入未经规划采信的中间基线。
- 运行测试数必须来自实际门禁结果或其可复算产物；源码@Test注解数只能作为交叉检查，不能替代Surefire实际运行汇总。
- 前端以规划基线79 files/775 tests、D165当前结果82 files/809 tests表述，不得再引入805。

三、标准12必须补齐的门禁证据

- 后端门禁开始前，检查并记录前端工具族pnpm/npm/node/vite相关进程为零。
- 前端门禁开始前，检查并记录后端工具族mvn/java相关进程为零。
- 两次快照必须写清实际命令、时间和结果，检查对象与结论必须一致，不能用mvn/java命令证明pnpm/vite为零。
- 如果D165没有保存上述正确的原始快照，不得事后补写或推断，须在2G上限下重新执行能够形成完整互斥证据的门禁窗口。
- 后端给出实际运行模块小计及项目合计；前端给出typecheck、lint、test、build各自命令、时间、退出码和82 files/809 tests或本轮真实新结果。
- 前后端编译测试必须串行，完整时间区间不得重叠。

严格边界：

- 不新增或修改标准1—5、7—10已经通过的功能，不进入标准13。
- 不做计费、价格、趋势、配额、SSE、RAG、助手、单步调试等非目标。
- 未提交工作区不影响本轮验收；不执行git add/commit/push，也不把缺少Git授权报告为阻塞。
- 不提前核销P8，不把M07-F04-02升✅，不把功能数升29，不移动主方向，不声称规划层PASSED或功能COMPLETED。

交付文件：

- product/agent-token-usage-observability/receipts/completion-receipt-d167.md
- product/agent-token-usage-observability/receipts/test-receipt-d167.md

两份回执逐条对照13项标准：1—5、7—10标注沿用D166；6、11、12给出本轮完整新证据；13标注等待规划层功能级PASSED。提交前自行复算所有表格和等式，并全文检查262/267、723/755、234/267、798/805/809、进程检查对象、门禁时间窗六组口径无冲突。
```

## 当前会话验收入口

- 审查记录：`product/agent-token-usage-observability/receipts/planning-rereview-d166.md`
- 下一轮验收只复核标准6、11、12；通过后再下发标准13阶段三Prompt。
