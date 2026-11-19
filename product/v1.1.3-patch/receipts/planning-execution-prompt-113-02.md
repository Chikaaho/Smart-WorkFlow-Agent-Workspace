# 补充执行提示 113-02：1.1.3 阶段 3 第 3 轮（E2、E3）

2026-11-19｜规划 → 执行｜依据 `planning-review-113-02.md`｜本提示替代 `planning-execution-prompt-113-01.md`，是当前唯一的执行入口。113-01 只作追溯。方向文件不变。E2、E3 已经连续两轮未过，这是第 3 轮；按 Owner 的持续授权继续，范围比上一轮收窄。

## 1. 只处理两项

| ID | 失败事实（第 2 轮） | 完成条件 | 限定方法 | 对象 | 证据 |
|---|---|---|---|---|---|
| E2 | `113-B1-parent-view-child-opened.png` 和 `113-B1-child-detail-trajectory.png` 是同一个文件（sha1 `34c80c32…`），画面是**父行**轨迹（有「子图」节点和「查看子执行」链接），看不到执行编号 | 分两种进入方式：**(a)** 浏览器直接打开子行详情地址；**(b)** 从父行详情点「查看子执行」。两种方式进去以后，画面里都要有子行编号 `#2123362877942804482` 和子行自己的轨迹（「人工处理」节点）。如果 (a) 对、(b) 还显示父行内容，就是产品缺陷（只换路由参数，详情没有重新加载），修复后重新截图 | 截图必须让**头部编号和节点轨迹在同一张图里**：可以把视口高度调到 1600 左右，或者把浏览器缩放到 67%，二选一，回执里写明用的是哪种。每张图单独保存，文件名不重复，回执附上每张图的 sha1 | 子行 `#2123362877942804482`，父行 `#2123362877913444354` | (a)、(b) 各一张。如果修了缺陷，再写明：修复提交、新增用例（父行跳子行之后内容会刷新）、Web 四项门禁结果 |
| E3 | `113-B3-time-column-viewport.png` 只有表头横向滚动了，表体没动；「发生时间」表头下面显示的是「可观测量」，看不到时间值 | 表头和表体对齐，「发生时间」列的时间值出现在画面里，格式是 `yyyy-MM-dd HH:mm:ss`，没有 `T`，没有微秒 | 横向滚动只能滚**表体**（`.el-table__body-wrapper` 设 `scrollLeft`，或者在表体上滚轮横移），不要对表头调 `scrollIntoView`；或者把视口加宽到所有列都放得下（比如 2400 宽）。二选一，回执里写明 | 隔离环境执行列表第一页（不加筛选） | 一张截图。回执里列出画面里能看到的前三个时间值 |

## 2. 已锁定，不用重新验证

开工三问、B1 列表与跨重启、B1 详情可打开、E1/B2（P73）、E2 父行轨迹与入口、B4、G1、G2、Web 门禁。证据见 `planning-review-113-01.md`、`planning-review-113-02.md` 的「已通过」。

只有 E2 查出产品缺陷、改了详情页代码时，才需要重跑 Web 四项门禁；不改代码就不用重跑。

## 3. 画面描述

回执里的每一句画面描述都要对着截图本身写，不要用 DOM 断言代替：DOM 里有某段文字，不代表它出现在画面里。交回执之前自己把每张图看一遍。

## 4. 范围

- 允许：在隔离环境 iso113 截图；只有 E2 确认是产品缺陷时，才修 Web 详情页的重新加载逻辑并补用例；追加回执 `execution-113-03.md`。
- 另外用一句话回答（只核实，不修）：执行列表「共 N 条」大约是实际行数的 10 倍（见审查记录「范围外发现」），1.1.2 基线上是否也这样。
- 不允许：改 Server、加迁移、碰演示环境、为了截图改列宽或布局、动已锁定项的实现，以及方向 §6 列出的其他禁止事项。

## 5. 进度口径

共 7 个阶段：已完成 2 个（评估、实施），进行中 1 个（验收，第 3 轮只剩 E2、E3），未开始 4 个（合并、发版、部署与同步、结束）。回执提交后保持 `VERIFYING`。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "v1.1.3-patch",
  "revision": 2,
  "previous_revision": 1,
  "decision": "CONTINUE",
  "source_receipt": "product/v1.1.3-patch/receipts/execution-113-02.md",
  "items": [
    {
      "origin_id": "E2-B1-detail-relation-evidence",
      "subject": "子执行详情（直接打开 / 从父行点查看子执行）",
      "criterion": "B1：每一行都能打开详情；父执行、子执行之间的关系在详情里能看出来",
      "status": "REWORK",
      "failed_rounds": 2,
      "evidence": [".iso113/evidence/113-B1-parent-view-child-opened.png", ".iso113/evidence/113-B1-child-detail-trajectory.png"],
      "diagnosis": {
        "location": "子行 #2123362877942804482 的详情页",
        "observed": "两张图是同一个文件，画面是父行轨迹（子图节点 + 查看子执行链接），头部不在画面里",
        "expected": "子行编号和子行轨迹（人工处理节点）出现在同一画面；直接打开和点击打开结果一致",
        "cause": "待区分：取证问题，或者详情页只换路由参数时没有重新加载",
        "next_action": "按 (a) 直接打开、(b) 点击打开各截一张，头部和轨迹同框；(b) 不对就修"
      },
      "scope": {
        "targets": ["#2123362877942804482", "#2123362877913444354", "执行详情页的路由参数变化处理"],
        "allowed_actions": ["调视口高度或缩放截图", "(b) 确认为缺陷时修复详情页重新加载并补用例"],
        "forbidden_actions": ["改 Server", "重新造执行", "碰演示环境"],
        "constraints": {"截图": "头部编号与轨迹同框，文件名唯一，附 sha1", "画面描述": "对着截图写"}
      },
      "acceptance": ["(a)(b) 两张图都能看到子行编号和人工处理节点", "如果修了：提交、用例、Web 门禁"]
    },
    {
      "origin_id": "E3-B3-time-column-evidence",
      "subject": "Graph 执行列表「发生时间」列",
      "criterion": "B3：显示 yyyy-MM-dd HH:mm:ss",
      "status": "REWORK",
      "failed_rounds": 2,
      "evidence": [".iso113/evidence/113-B3-time-column.png", ".iso113/evidence/113-B3-time-column-viewport.png"],
      "diagnosis": {
        "location": "执行列表横向滚动区",
        "observed": "只有表头滚动了，表体没动，发生时间表头下面是可观测量",
        "expected": "表头和表体对齐，时间值出现在画面里",
        "cause": "取证方法：对表头 scrollIntoView 只滚表头，el-table 的表头和表体是分开的滚动容器",
        "next_action": "滚动表体，或者把视口加宽到所有列都放得下，再截图"
      },
      "scope": {
        "targets": ["隔离环境执行列表第一页（不加筛选）"],
        "allowed_actions": ["设置表体 scrollLeft", "加宽视口"],
        "forbidden_actions": ["对表头 scrollIntoView", "修改列宽或布局"],
        "constraints": {"回执": "列出画面里前三个时间值"}
      },
      "acceptance": ["截图里表头和表体对齐，时间值格式正确"]
    },
    {
      "origin_id": "E1-B2-trajectory-evidence",
      "subject": "取消后执行详情的节点轨迹（P73）",
      "criterion": "B2",
      "status": "RESOLVED",
      "failed_rounds": 1,
      "evidence": [".iso113/evidence/113-B2-request-cancel-child-trajectory.png", ".iso113/evidence/113-B2-request-cancel-parent-trajectory.png", ".iso113/evidence/113-B2-execid-cancel-child-trajectory.png"],
      "scope": {"targets": [], "allowed_actions": [], "forbidden_actions": ["改动已通过实现"], "constraints": {}},
      "acceptance": ["三张截图里轨迹显示已取消"]
    },
    {
      "origin_id": "B4-graphdefid-precision",
      "subject": "执行历史入口 graphDefId",
      "criterion": "B4",
      "status": "RESOLVED",
      "failed_rounds": 0,
      "evidence": [".iso113/evidence/113-B4-entry-fixed.png", "product/v1.1.3-patch/receipts/execution-113-02.md#4"],
      "scope": {"targets": [], "allowed_actions": [], "forbidden_actions": ["改动已通过实现"], "constraints": {}},
      "acceptance": ["入口跳转后列表有该图的执行；单测与门禁通过"]
    },
    {
      "origin_id": "B1-recovery-row-reuse",
      "subject": "超时恢复复用与列表",
      "criterion": "B1",
      "status": "RESOLVED",
      "failed_rounds": 0,
      "evidence": ["product/v1.1.3-patch/receipts/planning-review-113-01.md"],
      "scope": {"targets": [], "allowed_actions": [], "forbidden_actions": ["改动已通过实现"], "constraints": {}},
      "acceptance": ["见第 1 轮审查"]
    },
    {
      "origin_id": "G1-G2-regression",
      "subject": "取消回归",
      "criterion": "1.1.2 G1、G2 不退化",
      "status": "RESOLVED",
      "failed_rounds": 0,
      "evidence": [".iso113/evidence/113-G1G2-after-cancel-list.png"],
      "scope": {"targets": [], "allowed_actions": [], "forbidden_actions": ["改动已通过实现"], "constraints": {}},
      "acceptance": ["见第 1 轮审查"]
    }
  ]
}
```
