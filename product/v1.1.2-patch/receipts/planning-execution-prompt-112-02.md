# 补充执行提示 112-02：1.1.2 阶段 3 修复（G1 剩余一行）

2026-11-14｜规划 → 执行｜依据 `planning-review-112-02.md`｜本提示替代 `planning-execution-prompt-112-01.md`，作为当前唯一的执行入口；01 只作追溯。不改变方向文件。G1 这是第 2 轮。

## 1. 唯一要处理的一项

| ID | 失败事实 | 完成条件 | 对象 | 证据 |
|---|---|---|---|---|
| G1 | `g1-list-after-cancel.png` 第 7 行「他人取消图-1794643814621」（16:10:16）显示**等待人工**；回执 02 说这一行（`2121516047931650049`）已纠正为 CANCELLED | ① 先查列表接口和数据库，这一行**现在**是什么状态，写进回执。② 如果已经是 CANCELLED（截图早于纠正），重截列表，看到这一行显示「已取消」就结束。③ 如果仍不是 CANCELLED，查清原因。重点看超管跨租户取消时，结果执行行有没有同步、纠正有没有生效。修好后，用超管跨租户再取消一次新执行，列表、详情都显示「已取消」 | 只针对执行行 `2121516047931650049`；情况③再加一次新的超管跨租户取消 | 这一行的接口/数据库状态原值；列表截图，要能看到这一行（可以用图名筛选，或翻到它所在的那一页）；情况③另附新执行的列表和详情截图 |

## 2. 已锁定，不用重新验证

G1 新取消 A/B、G1 根因、G2、G3、门禁，加上上一轮锁定的 B1 接口四组、设计器按钮、B2—B5。只有情况③改了 cancel() 时，才重跑①受理号取消、②执行编号取消两组接口测试，并写明原因。

## 3. 范围

- 允许：核实并按需修复上面这一行涉及的取消状态写入，以及对应的回归测试和隔离环境复测；追加回执 `execution-112-03.md`。
- 不允许：处理「取消验证子图」等超时恢复后留下的「等待人工」行（已登记为 P72，不进本补丁）；改取消接口的地址和入参；加迁移；动已锁定项的实现；碰演示环境。
- 门禁：只有改了代码才要过受影响的门禁，并附最新提交的功能分支 CI run 号（success）。只是重截图的话，不需要新跑 CI。
- 截图描述必须和画面一致。

## 4. 进度口径

共 7 个阶段：已完成 2 个（评估、实施），进行中 1 个（验收），未开始 4 个（合并、发版、部署与同步、结束）。回执提交后保持 `VERIFYING`。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "v1.1.2-patch",
  "revision": 2,
  "previous_revision": 1,
  "decision": "CONTINUE",
  "source_receipt": "product/v1.1.2-patch/receipts/execution-112-02.md",
  "items": [
    {
      "origin_id": "G1-list-status-after-cancel",
      "subject": "Graph 执行列表状态列（取消后的执行）",
      "criterion": "B1：用执行编号或受理号取消后状态变为 CANCELLED；列表、详情、设计器显示一致的「已取消」",
      "status": "REWORK",
      "failed_rounds": 2,
      "evidence": [".runtime-v112/g1-list-after-cancel.png", "product/v1.1.2-patch/receipts/execution-112-02.md#1"],
      "diagnosis": {
        "location": "执行列表第 7 行：他人取消图-1794643814621，16:10:16，执行行 2121516047931650049",
        "observed": "截图显示等待人工；回执说已经纠正为 CANCELLED",
        "expected": "这一行在列表中显示已取消",
        "cause": "两种可能：截图早于纠正；或者超管跨租户取消时结果执行行的同步/纠正没有生效。由执行方核实",
        "next_action": "查这一行的当前状态；已是 CANCELLED 就重截图，不是就修复超管跨租户路径并复测一次"
      },
      "scope": {
        "targets": ["取消后的执行状态持久化", "执行列表状态列"],
        "allowed_actions": ["修复取消时的状态写入或列表读取", "补回归测试", "隔离环境复测", "纠正两条旧记录或说明不能纠正的原因"],
        "forbidden_actions": ["改取消接口地址和入参", "加迁移", "碰演示环境", "改已锁定项实现", "处理超时恢复遗留的等待人工行（P72）", "改动其他执行行"],
        "constraints": {"复测编号": "受理号、执行编号各一次", "截图": "浏览器视口截图，详情要露出人工任务行", "对象": "仅执行行 2121516047931650049；需要修复时另加一次超管跨租户新取消"}
      },
      "acceptance": ["执行行 2121516047931650049 在列表中显示已取消，并附接口/数据库状态原值", "如果修了超管跨租户路径，新的一次取消在列表和详情中都显示已取消"],
      "planner_self_audit": "口径没变：取消过的执行在列表里显示已取消。读取方法是直接看回执点名的截图行，不是文字核对。第 1 轮的根因和新取消 A/B 已经锁定，这一轮只收窄到这一行和超管跨租户路径"
    },
    {
      "origin_id": "G2-pending-todo-after-cancel",
      "subject": "执行列表「待我处理」区的 3 条父执行人工任务",
      "criterion": "B1：取消后等待中的人工任务一起关闭",
      "status": "RESOLVED",
      "failed_rounds": 1,
      "evidence": ["product/v1.1.2-patch/receipts/execution-112-02.md#2", ".runtime-v112/g1-list-after-cancel.png"],
      "scope": {
        "targets": ["上述 3 次执行的人工任务", "待我处理列表"],
        "allowed_actions": ["查询执行和任务状态", "修复已取消执行的任务仍在待办里的缺陷", "隔离环境复测"],
        "forbidden_actions": ["删除测试数据", "改取消接口地址和入参", "加迁移", "碰演示环境"],
        "constraints": {"证据": "执行编号→是否取消→任务状态→是否在待办 对照表 + 待我处理截图"}
      },
      "acceptance": ["对照表覆盖 3 条，已取消的执行在待我处理中零残留"]
    },
    {
      "origin_id": "G3-cancelled-duration",
      "subject": "已取消执行的耗时显示（设计器结果区、执行详情头部）",
      "criterion": "B2 同类：结果区显示的运行结果要可信，不显示与实际不符的耗时",
      "status": "RESOLVED",
      "failed_rounds": 1,
      "evidence": [".runtime-v112/g3-designer-cancelled.png", ".runtime-v112/g1-a-detail-top.png", ".runtime-v112/g1-b-detail-top.png"],
      "scope": {
        "targets": ["设计器结果区耗时", "执行详情头部耗时"],
        "allowed_actions": ["写入真实耗时或隐藏已取消时的耗时", "补用例"],
        "forbidden_actions": ["改成功/失败执行的耗时显示", "加迁移", "碰演示环境"],
        "constraints": {"证据": "复用 G1 的截图"}
      },
      "acceptance": ["G1 的两次取消在设计器和详情中都不出现与实际不符的 0ms"]
    },
    {
      "origin_id": "B1-cancel-api",
      "subject": "取消接口四组响应",
      "criterion": "双编号取消结果相同；不存在/他人编号返回明确错误",
      "status": "RESOLVED",
      "failed_rounds": 0,
      "evidence": ["product/v1.1.2-patch/receipts/execution-112-01.md#2", "product/v1.1.2-patch/receipts/execution-112-02.md#1"],
      "scope": {"targets": ["取消接口"], "allowed_actions": ["G1 改动 cancel() 时重跑①②"], "forbidden_actions": ["改接口地址和入参"], "constraints": {}},
      "acceptance": ["①—④ 按回执结果"]
    },
    {
      "origin_id": "B2-running-display",
      "subject": "设计器运行中/结束后的结果区",
      "criterion": "运行中显示运行中，结束后才显示成功或失败",
      "status": "RESOLVED",
      "failed_rounds": 0,
      "evidence": [".runtime-v112/b2-designer-running.png", ".runtime-v112/b2-designer-failed.png"],
      "scope": {"targets": ["设计器结果区"], "allowed_actions": [], "forbidden_actions": ["改动已通过实现"], "constraints": {}},
      "acceptance": ["两张截图成立"]
    },
    {
      "origin_id": "B3-B5-display",
      "subject": "状态中文、失败分类列、当前节点名称",
      "criterion": "B3/B4/B5 方向验收标准",
      "status": "RESOLVED",
      "failed_rounds": 0,
      "evidence": [".runtime-v112/b3-monitor-discarded.png", ".runtime-v112/b4-execution-list.png", ".runtime-v112/b5-monitor-node-name.png"],
      "scope": {"targets": ["执行详情/列表状态", "失败分类列", "实例监控当前节点"], "allowed_actions": [], "forbidden_actions": ["改动已通过实现"], "constraints": {}},
      "acceptance": ["截图成立"]
    }
  ]
}
```
