# 补充执行提示 112-01：1.1.2 阶段 3 修复（G1—G3）

2026-11-14｜规划 → 执行｜依据 `planning-review-112-01.md`｜这是第一份补充提示，也是当前唯一的执行入口。不改变方向文件 `direction-v1.1.2.md`。各项都是第 1 轮失败。

## 1. 要修的三项

| ID | 失败事实 | 完成条件 | 对象 | 证据 |
|---|---|---|---|---|
| G1 | 取消后执行列表仍显示「等待人工」，详情页显示「已取消」（设计器取消图 15:57:26 那一行；取消验证父图 15:55:51 那一行） | 先查清原因：列表读取的是哪一行，状态为什么没更新，修复前用受理号取消是否也有同样问题，写进回执。修好后，分别用**受理号**和**执行编号**各取消一次新执行，列表、详情、设计器三处都显示「已取消」。上面两条旧记录也要显示「已取消」，如果旧数据不能自动纠正，在回执说明原因和处理方式 | 隔离环境（iso112-pg、18093、5275）；新建的两次执行要记下编号 | 两次取消各一张列表截图和一张详情截图，详情要滚动到人工任务行，能看到「已关闭」；再附列表接口里这两行的状态 |
| G2 | 「待我处理」里还有 3 条父执行人工任务：`#2121512507116990465`、`#2121512256402468865`、`#2121512078710779905` | 逐条说明这次执行有没有被取消。已取消的，它的任务不能再出现在「待我处理」里，否则按缺陷修复；没取消的，在回执写明可以保留 | 这 3 次执行 | 一张表：执行编号 → 是否取消 → 任务状态 → 是否还在待办里；再附修复后「待我处理」的截图 |
| G3 | 取消后设计器结果区和详情头部显示「耗时 0ms」，实际用时约 1 秒 | 已取消的执行显示真实耗时，或者不显示耗时，二者选一，设计器和详情页口径一致。不能出现与实际不符的 0ms | G1 中新建的那两次执行 | 用 G1 的截图即可，不需要另外截 |

## 2. 已锁定，不用重新验证

B1 接口四组、B1 设计器按钮、B1 入口评估、B2 运行中/结束显示、B3、B4、B5、门禁结论，证据见审查记录。如果 G1 的修复改动了取消接口（`cancel()`），要重跑①受理号取消和②执行编号取消两组接口测试，并在回执写明原因；③④不用重跑。

## 3. 范围

- 允许：修复 G1—G3 涉及的 Server/Web 代码和测试，追加回执 `execution-112-02.md`，在隔离环境复测。
- 不允许：改取消接口的地址和入参、加迁移、动已锁定项的实现、处理「发生时间」的 ISO 显示、碰演示环境，以及方向 §6 列出的其他禁止事项。
- 门禁：代码改了的仓要过受影响的门禁（Server 全量 `mvn test`；Web 的 typecheck、lint、test、build），回执附**最新提交的功能分支 CI run 号，且为 success**。
- 截图一律用浏览器视口截图，描述必须和画面一致：画面里看不到的内容，不要写成「截图可见」。

## 4. 进度口径

共 7 个阶段：已完成 2 个（评估、实施），进行中 1 个（验收），未开始 4 个（合并、发版、部署与同步、结束）。回执提交后保持 `VERIFYING`，等规划验收。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "v1.1.2-patch",
  "revision": 1,
  "previous_revision": 0,
  "decision": "CONTINUE",
  "source_receipt": "product/v1.1.2-patch/receipts/execution-112-01.md",
  "items": [
    {
      "origin_id": "G1-list-status-after-cancel",
      "subject": "Graph 执行列表状态列（取消后的执行）",
      "criterion": "B1：用执行编号或受理号取消后状态变为 CANCELLED；列表、详情、设计器显示一致的「已取消」",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": [".runtime-v112/b4-execution-list.png", ".runtime-v112/b1-detail-cancelled.png", "product/v1.1.2-patch/receipts/execution-112-01.md#2"],
      "diagnosis": {
        "location": "执行列表：设计器取消图-1794643042140 15:57:26.418 行；取消验证父图-1794642948720 15:55:51.161 行",
        "observed": "列表显示等待人工；同一执行的详情页（#2121512818611711329 / 受理号 #2121512818485342210）显示已取消",
        "expected": "列表与详情、设计器都显示已取消",
        "cause": "假设：列表读取的执行行和取消时更新的受理行不是同一行，执行行状态没有同步；由执行方核实",
        "next_action": "查清列表的数据来源，修复取消后执行行状态不同步的问题，并用两种编号各复测一次"
      },
      "scope": {
        "targets": ["取消后的执行状态持久化", "执行列表状态列"],
        "allowed_actions": ["修复取消时的状态写入或列表读取", "补回归测试", "隔离环境复测", "纠正两条旧记录或说明不能纠正的原因"],
        "forbidden_actions": ["改取消接口地址和入参", "加迁移", "碰演示环境", "改已锁定项实现"],
        "constraints": {"复测编号": "受理号、执行编号各一次", "截图": "浏览器视口截图，详情要露出人工任务行"}
      },
      "acceptance": ["两次新取消后，列表、详情、设计器都显示已取消，接口返回 CANCELLED", "两条旧记录显示已取消，或回执说明原因和处理方式"]
    },
    {
      "origin_id": "G2-pending-todo-after-cancel",
      "subject": "执行列表「待我处理」区的 3 条父执行人工任务",
      "criterion": "B1：取消后等待中的人工任务一起关闭",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": [".runtime-v112/b4-execution-list.png"],
      "diagnosis": {
        "location": "待我处理：#2121512507116990465、#2121512256402468865、#2121512078710779905",
        "observed": "取消测试之后仍显示待处理，回执没有说明这几次执行是否取消过",
        "expected": "已取消执行的任务不再出现在待我处理中；没取消的写明可以保留",
        "cause": "不确定：可能是没有取消的测试执行，也可能是取消后待办没刷新或任务没关闭；由执行方核实",
        "next_action": "逐条核实这 3 次执行的取消状态和任务状态；凡是已取消却仍显示的，修复"
      },
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
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": [".runtime-v112/b1-r3-designer-cancelled.png", ".runtime-v112/b1-detail-cancelled.png"],
      "diagnosis": {
        "location": "设计器结果区「执行已取消 耗时 0ms」；详情头部「已取消 0ms」",
        "observed": "显示 0ms，但执行 15:57:26 创建、15:57:27 更新，实际约 1 秒",
        "expected": "显示真实耗时，或已取消时不显示耗时，两处口径一致",
        "cause": "假设：取消路径没有写耗时，前端把空值显示成 0ms；由执行方核实",
        "next_action": "让已取消执行的耗时显示真实值或隐藏，设计器和详情一致"
      },
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
      "evidence": ["product/v1.1.2-patch/receipts/execution-112-01.md#2"],
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
