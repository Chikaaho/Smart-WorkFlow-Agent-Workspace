# F1 阶段 2 补充执行提示（第 2 次）

日期：2026-11-04。下发角色：规划；承接角色：执行。依据：`planning-review-f1-stage2-02.md`。本提示替代 `planning-execution-prompt-f1-stage2-01.md`，作为 F1 阶段 2 的唯一当前执行入口。

## 锁定项（不得重验）

阶段 1 全部；阶段 2 第 1 轮通过项；本次通过的 G1 节点卡片、G2 工作台入口、G3 调试快照版本。只有本轮改动触及这些路径时才复验受影响项，并写明依据。

## 剩余一项

| ID | 只做这些 | 完成条件 | 证据 |
|---|---|---|---|
| F1S2-G4 | 查明总 Token 被拼接成字符串的位置并修复；检查同类 Token 合计的其他显示位置（执行历史列表、执行详情、工作台、会话相关页面中有 Token 合计的地方） | 总 Token 等于输入与输出之和；输入或输出未知时，总 Token 显示未知而不是拼接或 0；补单测覆盖“数值以字符串到达”的情况 | 原因说明（前端或后端，写清位置）；可见浏览器截图：执行历史列表与执行详情各一张，至少包含一行原先错误的记录（如 728/104 → 832）；单测名与结果 |

## 边界

- 只改 Token 合计的计算与显示；不改 Token 采集，不扩到阶段 3。
- 不调用真实模型；沿用本地验证库 `smart_workflow_f1v4b` 已有执行记录作复验对象。
- Web 门禁（typecheck、lint、单测、build）跑一遍；如果改了后端，补跑受影响模块测试。
- 提交推送并写远端回读 SHA；回执 `product/0.2.2/receipts/f1-stage2-3.md`。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "0.2.2",
  "revision": 5,
  "previous_revision": 4,
  "decision": "CONTINUE",
  "source_receipt": "product/0.2.2/receipts/f1-stage2-2.md",
  "items": [
    {
      "origin_id": "F1S2-G1",
      "subject": "执行详情 LLM 节点卡片",
      "criterion": "方向阶段 2：执行轨迹可查看；节点卡片显示真实输入、输出与时间",
      "status": "RESOLVED",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/f1-stage2-2.md 一", "product/0.2.2/receipts/assets/f1-stage2-2-g1-llm-node-time.png", "product/0.2.2/receipts/assets/f1-stage2-2-db-evidence.txt"],
      "scope": {
        "targets": ["执行详情节点卡片"],
        "allowed_actions": ["定位原因", "修复字段映射或节点 DTO", "浏览器验证"],
        "forbidden_actions": ["改动工具调用区块的现有行为", "调用真实模型", "扩到阶段 3"],
        "constraints": {"浏览器": "headless=false", "模型": "本地桩", "无时间数据时": "显示占位而非 Invalid Date"}
      },
      "acceptance": ["已锁定"]
    },
    {
      "origin_id": "F1S2-G2",
      "subject": "Agent 工作台快捷入口",
      "criterion": "阶段 2 完成断言：首页各入口都能打开对应页面",
      "status": "RESOLVED",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/f1-stage2-2.md 二", "product/0.2.2/receipts/assets/f1-stage2-2-g2-tool.png"],
      "scope": {
        "targets": ["工作台快捷入口"],
        "allowed_actions": ["浏览器验证", "修复打不开的入口"],
        "forbidden_actions": ["改动工作台布局", "headless 结果冒充正式证据"],
        "constraints": {"浏览器": "headless=false", "入口": "大模型管理、图定义管理、工具管理、执行历史记录、会话历史、知识库"}
      },
      "acceptance": ["已锁定"]
    },
    {
      "origin_id": "F1S2-G3",
      "subject": "调试记录快照版本",
      "criterion": "方向阶段 2 第 1 步：执行和调试记录可以看到所用的快照版本",
      "status": "RESOLVED",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/f1-stage2-2.md 三", "product/0.2.2/receipts/assets/f1-stage2-2-g3-debug-step.png"],
      "scope": {
        "targets": ["单步调试"],
        "allowed_actions": ["浏览器验证", "补显示快照版本"],
        "forbidden_actions": ["调用真实模型", "改动执行路径"],
        "constraints": {"浏览器": "headless=false", "模型": "本地桩"}
      },
      "acceptance": ["已锁定"]
    },
    {
      "origin_id": "F1S2-G4",
      "subject": "执行页总 Token 显示",
      "criterion": "执行历史与执行详情的总 Token 等于输入与输出之和",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/assets/f1-stage2-2-g2-executions.png", "product/0.2.2/receipts/assets/f1-stage2-2-g1-llm-node.png"],
      "diagnosis": {
        "location": "执行历史列表总 Token 列、执行详情 Token 使用统计",
        "observed": "728 与 104 显示总计 728104；1 与 1 显示 11；12 与 8 显示 128",
        "expected": "总计分别为 832、2、20",
        "cause": "推断数值以字符串到达后用 + 拼接，具体位置待执行核实",
        "next_action": "查明位置并改为数值相加，检查其他 Token 合计显示位置，补单测"
      },
      "scope": {
        "targets": ["Token 合计显示"],
        "allowed_actions": ["定位原因", "修复合计计算", "补单测", "浏览器验证"],
        "forbidden_actions": ["改动 Token 采集", "调用真实模型", "扩到阶段 3"],
        "constraints": {"浏览器": "headless=false", "复验记录": "含原先错误的 728/104 一行", "未知值": "输入或输出未知时总计显示未知"}
      },
      "acceptance": ["总 Token 等于输入与输出之和", "未知值不拼接不补 0", "单测覆盖字符串数值"]
    }
  ],
  "history_summary": {"revision": 4, "review": "product/0.2.2/receipts/planning-review-f1-stage2-01.md", "retained_count": 10, "status_counts": {"RESOLVED": 10}}
}
```
