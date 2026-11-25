# 执行提示 120-07：1.2.0 阶段 6 补齐

2026-11-26｜规划 → 执行｜依据 `planning-review-120-07.md`｜本提示替代 `planning-execution-prompt-120-06.md`，是当前唯一的执行入口。方向 `direction-v1.2.0.md` 和 120-06 的约束、停止条件仍然有效。

## 1. 现在就做（不依赖 Owner 裁定）

| ID | 内容 | 完成条件 |
|---|---|---|
| S6-x1 | 演示环境「1.2.0演示普通流程」补一张能看出发布成功的截图：发布成功提示，或者列表里状态列可见。回执说明 `s6-x1-def-list.png` 里两个流程都显示 v1，和回执写的 v3 为什么不一样 | 截图里流程名和已发布状态同时可见 |
| S6-id | 说明 `#2125544147878699009`（实例详情里的执行编号）和 `2125544148260380673`（120-19 §2.1）分别是什么 | 回执一段 |
| S6-crlf | `knowledge/session-handoff.md` 改回 CRLF，新提交，不改写历史 | `git ls-files --eol` 显示 `i/crlf`；`git diff -w` 和改动前的内容一致 |
| P83-rca | 查清 P83：①表单设计器里哪些 ID 字段按 JS number 建模（`graphActions.graphDefId` 和版本选择之外，还有没有别的雪花 ID）；②流程设计器的 Graph 执行器节点为什么不受影响；③给出修法（前端按字符串建模，或者服务端 Long 序列化成字符串），说明改动范围和对存量表单定义的影响。**只查和写方案，先不改代码、不发版** | 回执列出字段清单、根因和推荐修法 |

## 2. 等 Owner 裁定（规划另行下发）

P83 的修复走哪个版本，由 Owner 决定。修好之后再做：从表单设计器配置 Graph 动作并发布，在演示环境重拍点按钮前后两张（S6-e1-6）。

## 3. 暂缓

阶段 7 清理 iso120 先不做。

## 4. 回执与进度

回执 `execution-120-20.md`。

共 7 个阶段：已完成 5 个，进行中 1 个（部署与同步），未开始 1 个。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "v1.2.0",
  "revision": 8,
  "previous_revision": 7,
  "decision": "CONTINUE",
  "source_receipt": "product/v1.2.0/receipts/execution-120-19.md",
  "items": [
    {"origin_id": "S4-merge", "status": "LOCKED", "failed_rounds": 0, "evidence": ["run 45565374283", "run 45565538125"], "scope": {"targets": [], "allowed_actions": [], "forbidden_actions": [], "constraints": {}}, "acceptance": []},
    {"origin_id": "S5-release", "status": "LOCKED", "failed_rounds": 0, "evidence": ["Release 457783510", "Release 457827301"], "scope": {"targets": [], "allowed_actions": [], "forbidden_actions": [], "constraints": {}}, "acceptance": []},
    {"origin_id": "S6-x1", "status": "OPEN", "failed_rounds": 1, "evidence": ["s6-x1-def-list.png"], "scope": {"targets": ["演示环境普通流程发布证据"], "allowed_actions": ["截图"], "forbidden_actions": ["改存量数据"], "constraints": {}}, "acceptance": ["流程名与已发布状态同屏"]},
    {"origin_id": "S6-id", "status": "OPEN", "failed_rounds": 0, "evidence": ["execution-120-19.md#2.1"], "scope": {"targets": ["回执说明"], "allowed_actions": ["说明"], "forbidden_actions": [], "constraints": {}}, "acceptance": ["两个编号的含义"]},
    {"origin_id": "S6-crlf", "status": "OPEN", "failed_rounds": 0, "evidence": ["6ad3dae6"], "scope": {"targets": ["knowledge/session-handoff.md"], "allowed_actions": ["新提交改回 CRLF"], "forbidden_actions": ["改写历史"], "constraints": {}}, "acceptance": ["i/crlf", "diff -w 无内容变化"]},
    {"origin_id": "P83-rca", "status": "OPEN", "failed_rounds": 0, "evidence": ["execution-120-19.md#2.2"], "scope": {"targets": ["表单设计器雪花 ID 字段"], "allowed_actions": ["查根因", "写方案"], "forbidden_actions": ["改代码", "发版"], "constraints": {"版本": "待 Owner 裁定"}}, "acceptance": ["字段清单", "根因", "推荐修法与影响"]},
    {"origin_id": "S6-e1-6", "status": "BLOCKED", "failed_rounds": 1, "evidence": ["s6-e1-6-form-action.png"], "scope": {"targets": ["设计器配置表单动作并在演示环境重拍"], "allowed_actions": ["截图"], "forbidden_actions": ["接口绕过"], "constraints": {"前置": "P83 修复"}}, "acceptance": ["点按钮前后两张，有导航和提示"]},
    {"origin_id": "S7-close", "status": "BLOCKED", "failed_rounds": 0, "evidence": [], "scope": {"targets": ["iso120 清理"], "allowed_actions": [], "forbidden_actions": [], "constraints": {"前置": "阶段 6 通过"}}, "acceptance": ["库列表与端口回读"]}
  ]
}
```
