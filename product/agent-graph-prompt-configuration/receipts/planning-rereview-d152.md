# 规划层补证复验：agent-graph-prompt-configuration（D152）

> **验收角色**：规划  
> **验收日期**：2026-08-21  
> **复验依据**：D150 方向、D151 审查、更新后的 `completion.md` 与 `test-receipt.md`  
> **最终结论**：**FAILED（10/12 通过；D151 新通过标准5、11，标准1部分闭合）**

## 1. D151 四项复验

| 标准 | 本轮裁定 | 复验结论 |
|---|:---:|---|
| 1. 发布/重载/有权访问行为 | **FAILED** | 用例31/32已闭合 create→saveDraft→publish→getGraph 与发布后编辑/重载；但用例35验证的是“草稿不可执行、发布后可执行”的业务状态门控，不是用户身份或权限授权。全部为 Service 单测，未经过 Controller/Security 请求链，不能证明有权用户成功，也不能证明无权/撤权/未认证不能绕过。标准1仅部分闭合。 |
| 5. 未定义变量真实失败落库链 | **PASSED** | 新用例33证明真实 Service 执行后 response失败、DB `FAILED + UNDEFINED_VARIABLE`、模型 never call；用例34证明列表与详情可查询，闭合解释器→Service→落库→查询全链。 |
| 11. 2G、同轮门禁与互斥 | **PASSED** | 后端 11:24:03—11:24:44、前端 11:25:18—11:26:01，间隔34秒；两侧开始前均有对方进程零快照。后端703/0/0/0、agent214，前端79f/775t四门退出0，命令均显式2G。 |
| 12. §3.3 全量同步 | **FAILED** | planning 当前入口已统一为 D151 FAILED/27/旧清单，前次上下新旧冲突已修正；但本轮“知识库触碰文件清单”仅列 `knowledge/features/agent-graph-prompt-configuration.md`，未报告或证明 `knowledge/current-status.md`、`knowledge/session-handoff.md`、`knowledge/known-issues.md` 的全文核对/同步。标准12明确要求这些权威入口与功能清单、需求池、memory 一致，不能用 memory 文件代替 knowledge 全量同步。当前也仍是 FAILED 待规划复验口径，尚非可归档终态。 |

## 2. 十二项累计裁定

- **PASSED**：2、3、4、5、6、7、8、9、10、11。
- **FAILED**：1、12。
- 累计：**10/12 通过**。

## 3. 保留证据与当前基线

- D150/D151 已通过的主体实现、前端/Mock、零 Flyway 和全部专项证据继续保留。
- 当前测试基线可晋级为后端 **703/0/0/0**（sw-basic-agent 214）、前端 **79 files / 775 tests**；标准11无需再次重跑，除非后续代码发生变化。
- M07-F02-02、清单终态和第28个完成功能仍未获得规划确认；方向继续留 `ready/`。

## 4. 仅余补充边界

执行层下一轮仅需闭合两项：

1. **标准1授权行为**：提供真实 Controller/Security 请求链证据，证明现有 Agent 图权限下，有权身份可完成至少保存/发布/重载/执行 Prompt 配置，并证明未认证或缺权身份不能绕过；不得再把“图已发布”解释为“用户已授权”。沿用既有权限码，不新增默认授权。
2. **标准12全量同步**：全文核对并报告 `knowledge/current-status.md`、`knowledge/features/agent-graph-prompt-configuration.md`、`knowledge/known-issues.md`、`knowledge/session-handoff.md`、功能清单、需求池以及 planning memory 当前入口。提交触碰/未触碰理由、清单计数与真实零命中证据。规划最终通过前保持 FAILED/待复验，不得提前归档或写 D152 PASSED/COMPLETED。

标准2—11中已过部分无需重复；若补权限测试导致代码变化，则只重跑受影响门禁并说明是否需要刷新全量基线。

## 5. 状态处理

- 功能状态：**FAILED（待第二次补证复验）**
- 方向：继续保留 `product/agent-graph-prompt-configuration/ready/direction-agent-graph-prompt-configuration.md`
- 归档：不得移动至 `passed/`
- 规划确认已完成功能数：仍为 **27**
- 规划确认清单：仍为 **✅23 / 🟦27 / ⬜40**；M07-F02-02 保持待复验
