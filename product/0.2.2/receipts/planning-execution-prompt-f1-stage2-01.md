# F1 阶段 2 补充执行提示（第 1 次）

日期：2026-11-04。下发角色：规划；承接角色：执行。依据：`planning-review-f1-stage2-01.md`。本提示是 F1 阶段 2 的唯一当前执行入口；方向 `product/0.2.2/ready/direction-022-f1-agent.md` 不变。

## 锁定项（不得重验）

阶段 1 全部；阶段 2 的快照、真实工具调用、超时、两级选择与挂工具、供应商停用显示，以及本轮三个缺陷修复。只有本轮改动触及这些路径时才复验受影响项，并写明依据。

## 剩余三项

| ID | 只做这些 | 完成条件 | 证据 |
|---|---|---|---|
| F1S2-G1 | 先查明执行详情 LLM 节点卡片输入、输出为空和时间 `Invalid Date` 的原因，再修复 | 一次含 LLM 节点的执行，节点卡片显示该节点真实输入和输出（LLM 节点输出为模型最终回答）；开始、结束时间显示真实值，后端无时间数据时显示占位而非 `Invalid Date`；工具调用区块保持现状 | 原因说明（前端字段映射或后端未返回，二选一写清）；可见浏览器截图：本地桩执行详情一张；数据库或接口回读该节点输入输出 |
| F1S2-G2 | 在工作台逐一点击 6 个快捷入口 | 大模型管理、图定义管理、工具管理、执行历史记录、会话历史、知识库各自打开对应页面 | 每个入口一张可见浏览器截图，或一张截图加地址栏 URL 列表 |
| F1S2-G3 | 对一个已发布 graph 做一次单步调试 | 调试记录或调试页面显示所用快照版本，且与发布版本一致 | 可见浏览器截图，加数据库或接口回读 |

## 边界

- 只改上表范围；不扩到阶段 3。
- 本轮用本地桩，不调用真实模型；沿用本地验证库 `smart_workflow_f1v4b`，Key 只以密文存在于该库。
- 回执补写 Server、Web 两个分支的远端回读 SHA。
- 通过门禁后提交推送；回执 `product/0.2.2/receipts/f1-stage2-2.md`。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "0.2.2",
  "revision": 4,
  "previous_revision": 3,
  "decision": "CONTINUE",
  "source_receipt": "product/0.2.2/receipts/f1-stage2-1.md",
  "items": [
    {
      "origin_id": "F1S2-G1",
      "subject": "执行详情 LLM 节点卡片",
      "criterion": "方向阶段 2：执行轨迹可查看；节点卡片显示真实输入、输出与时间",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/assets/f1-stage2-1-real-tool-trace.png", "product/0.2.2/receipts/assets/f1-stage2-1-tool-trace.png", "product/0.2.2/receipts/f1-stage2-1.md 七"],
      "diagnosis": {
        "location": "执行详情页 LLM 节点卡片的输入变量、输出结果、时间信息",
        "observed": "真实执行成功后输入、输出两栏为空，开始与结束时间显示 Invalid Date",
        "expected": "显示该节点真实输入和模型最终回答，时间为真实值或占位",
        "cause": "未查明：可能是前端字段映射错位或后端节点 DTO 未返回（回执仅说明时间字段缺失）",
        "next_action": "查明原因后修复，并以可见浏览器截图和回读证明"
      },
      "scope": {
        "targets": ["执行详情节点卡片"],
        "allowed_actions": ["定位原因", "修复字段映射或节点 DTO", "浏览器验证"],
        "forbidden_actions": ["改动工具调用区块的现有行为", "调用真实模型", "扩到阶段 3"],
        "constraints": {"浏览器": "headless=false", "模型": "本地桩", "无时间数据时": "显示占位而非 Invalid Date"}
      },
      "acceptance": ["节点卡片显示真实输入与模型最终回答", "开始与结束时间不显示 Invalid Date", "原因已写明"]
    },
    {
      "origin_id": "F1S2-G2",
      "subject": "Agent 工作台快捷入口",
      "criterion": "阶段 2 完成断言：首页各入口都能打开对应页面",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/f1-stage2-1.md 四.4", "product/0.2.2/receipts/assets/f1-stage2-1-home.png"],
      "diagnosis": {
        "location": "/agent 工作台快捷入口",
        "observed": "6 个入口仅回报大模型管理、图定义管理、知识库已打开",
        "expected": "6 个入口逐一打开对应页面",
        "cause": "回执未覆盖工具管理、执行历史记录、会话历史",
        "next_action": "逐一点击 6 个入口并截图"
      },
      "scope": {
        "targets": ["工作台快捷入口"],
        "allowed_actions": ["浏览器验证", "修复打不开的入口"],
        "forbidden_actions": ["改动工作台布局", "headless 结果冒充正式证据"],
        "constraints": {"浏览器": "headless=false", "入口": "大模型管理、图定义管理、工具管理、执行历史记录、会话历史、知识库"}
      },
      "acceptance": ["6 个入口均打开对应页面且有截图"]
    },
    {
      "origin_id": "F1S2-G3",
      "subject": "调试记录快照版本",
      "criterion": "方向阶段 2 第 1 步：执行和调试记录可以看到所用的快照版本",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/f1-stage2-1.md 一.1"],
      "diagnosis": {
        "location": "单步调试记录与调试页",
        "observed": "回执声称调试页显示快照版本，但只有执行详情证据",
        "expected": "单步调试后调试记录或调试页显示所用快照版本",
        "cause": "回执未提供调试路径证据",
        "next_action": "对已发布 graph 单步调试一次并截图、回读"
      },
      "scope": {
        "targets": ["单步调试"],
        "allowed_actions": ["浏览器验证", "补显示快照版本"],
        "forbidden_actions": ["调用真实模型", "改动执行路径"],
        "constraints": {"浏览器": "headless=false", "模型": "本地桩"}
      },
      "acceptance": ["调试记录或调试页显示的快照版本与发布版本一致"]
    }
  ],
  "history_summary": {"revision": 3, "review": "product/0.2.2/receipts/planning-review-f1-stage1-03.md", "retained_count": 10, "status_counts": {"RESOLVED": 10}}
}
```
