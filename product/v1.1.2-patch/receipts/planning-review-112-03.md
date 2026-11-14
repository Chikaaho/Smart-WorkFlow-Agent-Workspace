# planning-review-112-03：1.1.2 阶段 3 验收通过

2026-11-14｜规划｜依据 `execution-112-03.md`、`.runtime-v112/g1-row-reshoot.png`｜阶段 3 **PASSED**，进入阶段 4。

## 1. 结论

**阶段 3 通过。** B1—B5 和 G1—G3 全部通过并锁定，B6 按方向在阶段 6 处理。

G1 最后一行：`g1-row-reshoot.png` 中「他人取消图-1794643814621」16:10:16 这一行显示**已取消**。回执给出了列表接口、详情接口和数据库的原值，三处都是 CANCELLED，数据库行 `version=2`，说明纠正确实生效了。上一轮的矛盾是因为截图早于纠正，回执 02 的描述写错了，状态本身没有问题。超管跨租户取消时同步执行行，已经包含在 `04049d08` 的修复里。

同一张图后面「取消验证子图」的两行仍显示等待人工，这是 P72，不在本补丁范围内。

## 2. 锁定的证据与快照

| 项 | 证据 |
|---|---|
| B1 接口四组、入口评估、设计器按钮 | `execution-112-01.md` §0/§2；①② 在 `execution-112-02.md` §1 重跑 |
| B2—B5 | `b2-*`、`b3-monitor-discarded.png`、`b4-execution-list.png`、`b5-monitor-node-name.png` |
| G1 根因与修复、新取消 A/B | `execution-112-02.md` §1；`g1-list-after-cancel.png`、`g1-a/b-detail-*.png` |
| G1 最后一行 | `execution-112-03.md` §1；`g1-row-reshoot.png` |
| G2 / G3 | `execution-112-02.md` §2/§3；`g3-designer-cancelled.png` |
| 门禁快照 | Server `feature/1.1.2`@`04049d08`，CI `43578533350` success，全量 2,521/0/0/45；Web `feature/1.1.2`@`45a9340`，CI `43578572886` success，2,102 passed |

## 3. 阶段 4—6 交给执行方（按方向 §4，持续授权）

- **阶段 4**：两个仓的 `feature/1.1.2` → `develop` → `main`，用普通合并，每一步 CI 都要 success，完成后删除功能分支。合入 main 前，确认 pom、package.json、版本脚本和 CI 工作流里的版本断言都已改成 `1.1.2`（`memory/issues.md`：发版时这四处要同一批更新）。
- **阶段 5**：两个仓打 tag `1.1.2`，Release 设为 Latest，发布说明列出 B1—B6；修复内容一并写上：取消时同步结果执行行、已取消不显示耗时。其他 tag 和 Release 不动。
- **阶段 6**：演示环境先部署 Server，再部署 Web。部署前备份，剩余空间 ≥3G。部署后核对版本、health，Flyway 仍为 35 行。在演示环境复测：B1 用两种编号各取消一次，看列表、详情都显示「已取消」；B2；B3。B6 重拍 `agent-graph.png`，三个仓同步。回执 `execution-112-04.md`。

### 阶段 6 同步使用的唯一值

| 字段 | 值 |
|---|---|
| 1.1.2 补丁状态 | 阶段 6 完成后由规划复核，写 `COMPLETED` |
| 正式功能数 | **58**（不变，补丁不计功能数） |
| P 编号 | P70、P71 → **已核销（1.1.2）**；P72 → 未排期 |
| 线上版本 | Server `1.1.2`、Web `1.1.2`（以实际 tag/Release 为准） |
| Flyway | 35 行（不变） |
| 活动功能 | 无 |
| 当前唯一下一动作 | 规划阶段 7 复核 `execution-112-04.md` |
| 主方向目录 | 阶段 7 复核通过后，由规划移到 `passed/` |
| 同步范围 | knowledge 当前状态、`version.json`、`CHANGELOG.md`、两个仓的 README、需求池 P70/P71 行（执行方按状态同步授权写入）；memory 由规划维护 |

## 4. 进度

共 7 个阶段：已完成 3 个（评估、实施、验收）；进行中 0 个；未开始 4 个（合并、发版、部署与同步、结束）。下一步是执行方的阶段 4。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "v1.1.2-patch",
  "revision": 3,
  "previous_revision": 2,
  "decision": "FINISH",
  "source_receipt": "product/v1.1.2-patch/receipts/execution-112-03.md",
  "items": [
    {
      "origin_id": "G1-list-status-after-cancel",
      "subject": "Graph 执行列表状态列（取消后的执行）",
      "criterion": "B1：用执行编号或受理号取消后状态变为 CANCELLED；列表、详情、设计器显示一致的「已取消」",
      "status": "RESOLVED",
      "failed_rounds": 2,
      "evidence": [".runtime-v112/g1-row-reshoot.png", "product/v1.1.2-patch/receipts/execution-112-03.md#1", ".runtime-v112/g1-list-after-cancel.png"],
      "scope": {
        "targets": ["取消后的执行状态持久化", "执行列表状态列"],
        "allowed_actions": ["修复取消时的状态写入或列表读取", "补回归测试", "隔离环境复测", "纠正两条旧记录或说明不能纠正的原因"],
        "forbidden_actions": ["改取消接口地址和入参", "加迁移", "碰演示环境", "改已锁定项实现", "处理超时恢复遗留的等待人工行（P72）", "改动其他执行行"],
        "constraints": {"复测编号": "受理号、执行编号各一次", "截图": "浏览器视口截图，详情要露出人工任务行", "对象": "仅执行行 2121516047931650049；需要修复时另加一次超管跨租户新取消"}
      },
      "acceptance": ["执行行 2121516047931650049 在列表中显示已取消，并附接口/数据库状态原值", "如果修了超管跨租户路径，新的一次取消在列表和详情中都显示已取消"]
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
