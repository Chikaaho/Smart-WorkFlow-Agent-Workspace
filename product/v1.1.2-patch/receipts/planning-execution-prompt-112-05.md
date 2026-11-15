# 补充执行提示 112-05：1.1.2 阶段 6 返修（B6 展示图 + B2 终态说明）

2026-11-15｜规划 → 执行｜依据 `planning-review-112-05.md`｜本提示是阶段 6 当前唯一的执行入口，不改变方向文件。B6 是第 1 轮返修。

## 1. 要处理的两项

| ID | 失败事实 | 完成条件 | 证据 |
|---|---|---|---|
| B6 | `agent-graph.png` 只拍到 3 张卡；「开始」「LLM 调用」不在画面内；「结束」卡被右边缘切掉 | 「智能巡检编排示例」的**全部节点卡**都在画布内完整显示，卡上文字可读，四周留白，不贴边、不被属性面板挡住。可以先点「适应画布」，再按需微调缩放，也可以加大视口。缩放比例不作要求。新图替换 Server、Web 和工作区根三处 `docs/assets/readme/agent-graph.png`；Server、Web 走 develop → main 普通合并，CI success | 新图路径；三处 sha256 一致；两仓合并提交和 CI run 号；回执里写清画面中有哪几张卡 |
| B2 终态 | `uat112-b2-terminal.png` 显示执行失败，其中结束节点失败，回执没说原因 | 查这次执行（「UAT112-B2运行中」那次）的详情接口：状态、失败分类、失败摘要，原值写进回执。说明为什么结束节点失败（比如图的配置导致），以及界面显示的「执行失败」和实际状态是否一致。**只查不修。**如果判断是产品缺陷，在回执里写清楚，由规划决定是否登记 | 详情接口原值；需要时附该次执行的详情截图 |

## 2. 已通过，不用重做

部署（备份、Server/Web、各项核对）、B1、B2 运行中、B3，以及阶段 4—5，全部锁定。version.json、CHANGELOG、knowledge、需求池保持现状；只有 README 引用了新图，或者描述需要随图修改时才改。

## 3. 范围

- 允许：在演示环境设计器里重拍（不保存图、不改图的内容）；替换三处图片并走合并链；查询 B2 那次执行的详情；追加回执 `execution-112-06.md`。
- 不允许：改「智能巡检编排示例」的节点或连线并保存；删除或清理演示环境数据；处理 P72、P73；改代码；动 tag 和 Release（1.1.2 的 Release 不用为换图重发）。
- 连接演示环境按运维手册 §2 的脚本。浏览器登录凭据不写进回执。
- 截图描述必须照画面写。

## 4. 进度口径

共 7 个阶段：已完成 5 个（评估、实施、验收、合并、发版），进行中 1 个（部署与同步），未开始 1 个（结束）。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "v1.1.2-patch",
  "revision": 4,
  "previous_revision": 3,
  "decision": "CONTINUE",
  "source_receipt": "product/v1.1.2-patch/receipts/execution-112-05.md",
  "items": [
    {
      "origin_id": "B6-readme-agent-graph",
      "subject": "三仓 README 展示图 agent-graph.png",
      "criterion": "B6：agent-graph.png 里所有节点卡片都完整显示，文字清晰，三仓同步",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": [
        ".runtime-v112/agent-graph-new.png",
        "product/v1.1.2-patch/receipts/execution-112-05.md#5"
      ],
      "diagnosis": {
        "location": "agent-graph-new.png，与工作区 docs/assets/readme/agent-graph.png 相同",
        "observed": "只有条件分支、知识检索、结束三张卡；开始、LLM 调用不在画面内；结束卡被画布右边缘切掉",
        "expected": "示例图的全部节点卡都在画布内完整显示，文字可读",
        "cause": "取景只对准了局部，没有让整张图适应画布；回执按卡片数量自述完整，没有对照画面边缘",
        "next_action": "适应画布后重拍，三处替换并走合并链"
      },
      "scope": {
        "targets": [
          "三处 docs/assets/readme/agent-graph.png",
          "引用该图的 README（仅在需要时）"
        ],
        "allowed_actions": [
          "演示环境设计器重拍（不保存）",
          "替换三处图片",
          "Server/Web develop→main 普通合并",
          "追加回执"
        ],
        "forbidden_actions": [
          "修改并保存示例图",
          "删除或清理演示环境数据",
          "改代码",
          "改 tag 或 Release",
          "处理 P72/P73"
        ],
        "constraints": {
          "画面": "全部节点卡完整、不贴边、不被面板遮挡",
          "证据": "三处 sha256 一致 + 合并提交与 CI run 号 + 画面内卡片清单"
        }
      },
      "acceptance": [
        "新图中示例图全部节点卡完整可读",
        "三处文件一致，两仓合并 CI success"
      ],
      "planner_self_audit": "口径就是方向 B6 原文：所有节点卡片完整显示。判断方法是看图，不是文字核对。1.1.0 已经留下过两端卡片被切的问题，这次按画面边缘判，不按卡片数量判"
    },
    {
      "origin_id": "B2-uat-terminal-reason",
      "subject": "演示环境 B2 复测那次执行的终态",
      "criterion": "B2：结束后显示的成功或失败要和实际状态一致",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": [
        ".runtime-v112/uat112-b2-terminal.png",
        ".runtime-v112/uat112-b2only-result.json"
      ],
      "diagnosis": {
        "location": "设计器结果区：UAT112-B2运行中-1794679975827",
        "observed": "显示执行失败，LLM 节点成功、结束节点失败；回执没说失败原因",
        "expected": "回执给出这次执行的状态、失败分类和失败摘要原值，并说明显示和实际一致",
        "cause": "回执只证明了运行中阶段，没有核对终态的来由",
        "next_action": "查详情接口原值并说明；只查不修"
      },
      "scope": {
        "targets": [
          "该次执行的详情接口"
        ],
        "allowed_actions": [
          "查询执行详情",
          "需要时补截图",
          "追加回执说明"
        ],
        "forbidden_actions": [
          "改代码",
          "修改并保存图",
          "删除演示环境数据"
        ],
        "constraints": {
          "证据": "详情接口状态/失败分类/失败摘要原值"
        }
      },
      "acceptance": [
        "回执写出失败原因，并说明显示与实际一致；属于产品缺陷的写明"
      ],
      "planner_self_audit": "运行中阶段已经通过并锁定，这里只补终态的来由，不扩大到修复"
    },
    {
      "origin_id": "stage-6-deploy-retest",
      "subject": "演示环境部署与 B1/B2 运行中/B3 复测",
      "criterion": "审查 03 §3 阶段 6 部署与复测要求",
      "status": "RESOLVED",
      "failed_rounds": 0,
      "evidence": [
        "product/v1.1.2-patch/receipts/execution-112-05.md#3",
        ".runtime-v112/uat112-b1-list.png",
        ".runtime-v112/uat112-b1-a-detail-top.png",
        ".runtime-v112/uat112-b1-b-detail-tasks.png",
        ".runtime-v112/uat112-b2-running.png",
        ".runtime-v112/uat112-b3-monitor.png"
      ],
      "scope": {
        "targets": [
          "演示环境部署",
          "B1/B2 运行中/B3 复测"
        ],
        "allowed_actions": [],
        "forbidden_actions": [
          "重新部署",
          "删除或清理演示环境数据"
        ],
        "constraints": {}
      },
      "acceptance": [
        "部署核对全部通过",
        "复测截图成立"
      ]
    },
    {
      "origin_id": "G1-list-status-after-cancel",
      "subject": "Graph 执行列表状态列（取消后的执行）",
      "criterion": "B1：用执行编号或受理号取消后状态变为 CANCELLED；列表、详情、设计器显示一致的「已取消」",
      "status": "RESOLVED",
      "failed_rounds": 2,
      "evidence": [
        ".runtime-v112/g1-row-reshoot.png",
        "product/v1.1.2-patch/receipts/execution-112-03.md#1",
        ".runtime-v112/g1-list-after-cancel.png"
      ],
      "scope": {
        "targets": [
          "取消后的执行状态持久化",
          "执行列表状态列"
        ],
        "allowed_actions": [
          "修复取消时的状态写入或列表读取",
          "补回归测试",
          "隔离环境复测",
          "纠正两条旧记录或说明不能纠正的原因"
        ],
        "forbidden_actions": [
          "改取消接口地址和入参",
          "加迁移",
          "碰演示环境",
          "改已锁定项实现",
          "处理超时恢复遗留的等待人工行（P72）",
          "改动其他执行行"
        ],
        "constraints": {
          "复测编号": "受理号、执行编号各一次",
          "截图": "浏览器视口截图，详情要露出人工任务行",
          "对象": "仅执行行 2121516047931650049；需要修复时另加一次超管跨租户新取消"
        }
      },
      "acceptance": [
        "执行行 2121516047931650049 在列表中显示已取消，并附接口/数据库状态原值",
        "如果修了超管跨租户路径，新的一次取消在列表和详情中都显示已取消"
      ]
    },
    {
      "origin_id": "G2-pending-todo-after-cancel",
      "subject": "执行列表「待我处理」区的 3 条父执行人工任务",
      "criterion": "B1：取消后等待中的人工任务一起关闭",
      "status": "RESOLVED",
      "failed_rounds": 1,
      "evidence": [
        "product/v1.1.2-patch/receipts/execution-112-02.md#2",
        ".runtime-v112/g1-list-after-cancel.png"
      ],
      "scope": {
        "targets": [
          "上述 3 次执行的人工任务",
          "待我处理列表"
        ],
        "allowed_actions": [
          "查询执行和任务状态",
          "修复已取消执行的任务仍在待办里的缺陷",
          "隔离环境复测"
        ],
        "forbidden_actions": [
          "删除测试数据",
          "改取消接口地址和入参",
          "加迁移",
          "碰演示环境"
        ],
        "constraints": {
          "证据": "执行编号→是否取消→任务状态→是否在待办 对照表 + 待我处理截图"
        }
      },
      "acceptance": [
        "对照表覆盖 3 条，已取消的执行在待我处理中零残留"
      ]
    },
    {
      "origin_id": "G3-cancelled-duration",
      "subject": "已取消执行的耗时显示（设计器结果区、执行详情头部）",
      "criterion": "B2 同类：结果区显示的运行结果要可信，不显示与实际不符的耗时",
      "status": "RESOLVED",
      "failed_rounds": 1,
      "evidence": [
        ".runtime-v112/g3-designer-cancelled.png",
        ".runtime-v112/g1-a-detail-top.png",
        ".runtime-v112/g1-b-detail-top.png"
      ],
      "scope": {
        "targets": [
          "设计器结果区耗时",
          "执行详情头部耗时"
        ],
        "allowed_actions": [
          "写入真实耗时或隐藏已取消时的耗时",
          "补用例"
        ],
        "forbidden_actions": [
          "改成功/失败执行的耗时显示",
          "加迁移",
          "碰演示环境"
        ],
        "constraints": {
          "证据": "复用 G1 的截图"
        }
      },
      "acceptance": [
        "G1 的两次取消在设计器和详情中都不出现与实际不符的 0ms"
      ]
    },
    {
      "origin_id": "B1-cancel-api",
      "subject": "取消接口四组响应",
      "criterion": "双编号取消结果相同；不存在/他人编号返回明确错误",
      "status": "RESOLVED",
      "failed_rounds": 0,
      "evidence": [
        "product/v1.1.2-patch/receipts/execution-112-01.md#2",
        "product/v1.1.2-patch/receipts/execution-112-02.md#1"
      ],
      "scope": {
        "targets": [
          "取消接口"
        ],
        "allowed_actions": [
          "G1 改动 cancel() 时重跑①②"
        ],
        "forbidden_actions": [
          "改接口地址和入参"
        ],
        "constraints": {}
      },
      "acceptance": [
        "①—④ 按回执结果"
      ]
    },
    {
      "origin_id": "B2-running-display",
      "subject": "设计器运行中/结束后的结果区",
      "criterion": "运行中显示运行中，结束后才显示成功或失败",
      "status": "RESOLVED",
      "failed_rounds": 0,
      "evidence": [
        ".runtime-v112/b2-designer-running.png",
        ".runtime-v112/b2-designer-failed.png"
      ],
      "scope": {
        "targets": [
          "设计器结果区"
        ],
        "allowed_actions": [],
        "forbidden_actions": [
          "改动已通过实现"
        ],
        "constraints": {}
      },
      "acceptance": [
        "两张截图成立"
      ]
    },
    {
      "origin_id": "B3-B5-display",
      "subject": "状态中文、失败分类列、当前节点名称",
      "criterion": "B3/B4/B5 方向验收标准",
      "status": "RESOLVED",
      "failed_rounds": 0,
      "evidence": [
        ".runtime-v112/b3-monitor-discarded.png",
        ".runtime-v112/b4-execution-list.png",
        ".runtime-v112/b5-monitor-node-name.png"
      ],
      "scope": {
        "targets": [
          "执行详情/列表状态",
          "失败分类列",
          "实例监控当前节点"
        ],
        "allowed_actions": [],
        "forbidden_actions": [
          "改动已通过实现"
        ],
        "constraints": {}
      },
      "acceptance": [
        "截图成立"
      ]
    }
  ]
}
```
