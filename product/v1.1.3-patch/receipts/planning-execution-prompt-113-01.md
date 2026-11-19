# 补充执行提示 113-01：1.1.3 阶段 3 补证与 B4

2026-11-19｜规划 → 执行｜依据 `planning-review-113-01.md`｜这是第一份补充提示，也是当前唯一的执行入口。方向文件 `direction-v1.1.3.md` 已按 Owner 裁决加入 B4，其余不变。E1—E3 是第 1 轮缺证据；B4 是新增项，这是第 0 轮。

## 1. 要做的四项

| ID | 失败事实 / 来源 | 完成条件 | 对象 | 证据 |
|---|---|---|---|---|
| E1 | B2 三张详情截图只截到 Token 区，没有节点轨迹 | 三次取消后的详情页，节点轨迹里的人工处理节点（子行）和子图节点（父行）都显示「已取消」，画面里没有「等待人工」 | 受理号取消：子行 `#2123370528919531521`、父行 `#2123370528898560002`；执行编号取消：子行 `#2123370735610638338` | 三张视口截图，滚动到节点轨迹。一屏放不下时，可以再截一张轨迹区，和头部那张配对 |
| E2 | B1 两张详情截图只截到 Token 区 | 子行轨迹「开始 → 人工处理 → 结束」显示成功，人工任务显示「已超时」；父行轨迹里子图节点成功，带「查看子执行」入口，点进去能打开对应的子执行 | 子行 `#2123362877942804482`、父行 `#2123362877913444354`（受理号 `#2123362877854724097`） | 两张轨迹区截图，再加一张点「查看子执行」之后打开的详情截图 |
| E3 | B3 截图看不到「发生时间」列 | 列表横向滚到「发生时间」列，显示 `yyyy-MM-dd HH:mm:ss`，没有 `T` 和微秒 | 隔离环境执行列表第一页 | 一张视口截图，「发生时间」列要在画面里 |
| B4（新增） | 回执 §5/§6.1：图定义列表「更多 → 执行历史」跳到 `/agent/executions/list?graphDefId=…`，`ExecutionList.vue` 用 `Number()` 转换雪花 ID，精度丢失，列表 0 行 | graphDefId 从路由到请求全程按字符串透传，从入口跳过去以后，列表只显示这张图的执行，而且有数据。同一个文件里如果还有别的 ID 也走 `Number()` 转换，一并检查并说明 | 隔离环境里的「113子图-人工超时」或「113父图-子图人工等待」 | 从图定义列表点「更多 → 执行历史」之后的截图（地址栏或筛选条件能看出 graphDefId，列表有行）；新增单测，用一个超过 2^53 的 ID 做断言 |

## 2. 已锁定，不用重新验证

开工三问、B1 列表与跨重启、B1 详情可打开、G1 列表与详情一致、G2、Web 门禁。证据见 `planning-review-113-01.md`「已通过」。E1—E3 只补截图，不重新造执行、不改代码。

B4 会改 `ExecutionList.vue`。改完以后 Web 四项门禁（typecheck、lint、test、build）全部重跑一遍；B3 的时间格式看 E3 新截的图就够了，不用另外补。

## 3. 范围

- 允许：修 B4 涉及的 Web 代码和测试（可以是 `feature/1.1.3` 上的新提交）；在隔离环境 iso113 补截图；追加回执 `execution-113-02.md`。
- 不允许：改 Server 代码（除非 B4 查出后端也按数字处理了这个 ID，真是这样就先在回执里说明，再改）、加迁移、碰演示环境、动已锁定项的实现，以及方向 §6 列出的其他禁止事项。
- CI：按 `planning-review-113-01.md` 的裁决，阶段 3 不要求功能分支的 CI run 号。阶段 4 合并 main 以后补记，必须是 success。
- 截图一律用浏览器视口截图，描述必须和画面一致：画面里看不到的内容，不要写成「截图可见」。

## 4. 之后的阶段（不变，供参考）

阶段 3 通过以后：合并（取 main 的 CI run 号）→ 两仓发 tag `1.1.3`，发布说明列出 B1—B4，并注明 `583f1a38` 修了启动回归 → 按运维手册部署演示环境 → 演示环境复测 B1—B4，按审查记录的口径处理旧数据行 → 同步文档（需求池核销 P72、P73，B4 记为随 1.1.3 修复）。

## 5. 进度口径

共 7 个阶段：已完成 2 个（评估、实施），进行中 1 个（验收），未开始 4 个（合并、发版、部署与同步、结束）。回执提交后保持 `VERIFYING`，等规划验收。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "v1.1.3-patch",
  "revision": 1,
  "previous_revision": 0,
  "decision": "CONTINUE",
  "source_receipt": "product/v1.1.3-patch/receipts/execution-113-01.md",
  "items": [
    {
      "origin_id": "E1-B2-trajectory-evidence",
      "subject": "取消后执行详情的节点轨迹（P73）",
      "criterion": "B2：取消后节点轨迹里未完成的节点显示已取消，与头部状态、人工任务行一致；两种编号结果相同",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": [".iso113/evidence/113-B2-cancel-by-request-child-detail.png", ".iso113/evidence/113-B2-cancel-by-request-parent-detail.png", ".iso113/evidence/113-B2-cancel-by-exec-id-child-detail.png"],
      "diagnosis": {
        "location": "三张详情截图的下半部分",
        "observed": "截图在 Token 区结束，看不到节点轨迹",
        "expected": "截图里有节点轨迹，人工处理节点和子图节点都显示已取消",
        "cause": "缺证据：截图没有滚动到轨迹区，行为本身未被反证",
        "next_action": "重新打开这三次执行的详情，滚动到节点轨迹后截图"
      },
      "scope": {
        "targets": ["#2123370528919531521", "#2123370528898560002", "#2123370735610638338"],
        "allowed_actions": ["打开详情并截图"],
        "forbidden_actions": ["重新造执行", "改代码", "碰演示环境"],
        "constraints": {"截图": "浏览器视口截图，轨迹区要在画面里"}
      },
      "acceptance": ["三张截图里，人工处理/子图节点都显示已取消，没有等待人工"]
    },
    {
      "origin_id": "E2-B1-detail-relation-evidence",
      "subject": "超时恢复后父子执行详情的轨迹与关联入口（P72）",
      "criterion": "B1：每一行都能打开详情；父执行、子执行之间的关系在详情里能看出来",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": [".iso113/evidence/113-B1-child-detail.png", ".iso113/evidence/113-B1-parent-detail.png"],
      "diagnosis": {
        "location": "两张详情截图的下半部分",
        "observed": "截图在 Token 区结束，轨迹和「查看子执行」入口都看不到",
        "expected": "子行轨迹成功、人工任务已超时；父行子图节点带查看子执行入口并且能打开",
        "cause": "缺证据：截图没有滚动到轨迹区",
        "next_action": "滚动到轨迹截图，再点一次查看子执行"
      },
      "scope": {
        "targets": ["#2123362877942804482", "#2123362877913444354"],
        "allowed_actions": ["打开详情、点击查看子执行、截图"],
        "forbidden_actions": ["重新造执行", "改代码", "碰演示环境"],
        "constraints": {"截图": "浏览器视口截图"}
      },
      "acceptance": ["子行、父行轨迹截图各一张，加上查看子执行打开后的截图一张"]
    },
    {
      "origin_id": "E3-B3-time-column-evidence",
      "subject": "Graph 执行列表「发生时间」列",
      "criterion": "B3：显示 yyyy-MM-dd HH:mm:ss",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": [".iso113/evidence/113-B3-time-column.png"],
      "diagnosis": {
        "location": "执行列表右侧",
        "observed": "表格在「失败」列截断，发生时间列在横向滚动区外",
        "expected": "截图里能看到发生时间列和它的格式",
        "cause": "缺证据：没有横向滚动",
        "next_action": "横向滚到发生时间列后截图"
      },
      "scope": {
        "targets": ["隔离环境执行列表第一页"],
        "allowed_actions": ["横向滚动并截图"],
        "forbidden_actions": ["为了截图修改列宽或布局"],
        "constraints": {}
      },
      "acceptance": ["截图里发生时间列可见，格式正确"]
    },
    {
      "origin_id": "B4-graphdefid-precision",
      "subject": "图定义列表「更多 → 执行历史」入口",
      "criterion": "B4：graphDefId 按字符串透传，从入口跳过去后列表只显示这张图的执行，并且有数据",
      "status": "OPEN",
      "failed_rounds": 0,
      "evidence": [".iso113/evidence/113-G1-designer-entry-precision-bug.png", "product/v1.1.3-patch/receipts/execution-113-01.md#5"],
      "diagnosis": {
        "location": "ExecutionList.vue 对 route.query.graphDefId 做 Number() 转换",
        "observed": "2123356778938249217 变成 …9200，列表 0 行",
        "expected": "按原始字符串过滤，列表有这张图的执行",
        "cause": "已由执行方定位：955aa6e（2026-08-21）引入的 Number() 转换",
        "next_action": "改为字符串透传，补超过 2^53 的单测，检查同文件里的其他 ID 转换"
      },
      "scope": {
        "targets": ["ExecutionList.vue 及其路由参数处理", "对应单测"],
        "allowed_actions": ["修改 Web 代码和测试", "隔离环境复测", "重跑 Web 四项门禁"],
        "forbidden_actions": ["改 Server（除非先在回执说明后端也有数字化问题）", "加迁移", "碰演示环境"],
        "constraints": {"证据": "入口跳转后的列表截图 + 单测"}
      },
      "acceptance": ["从入口跳转后列表有行，并且都属于这张图", "单测用超过 2^53 的 ID 通过", "Web 四项门禁通过"]
    },
    {
      "origin_id": "B1-recovery-row-reuse",
      "subject": "超时恢复后的执行列表与详情可打开",
      "criterion": "B1 列表无假等待行、每行都能打开详情",
      "status": "RESOLVED",
      "failed_rounds": 0,
      "evidence": [".iso113/evidence/113-B1-during-waiting.png", ".iso113/evidence/113-B1-recovered-list.png", ".iso113/evidence/113-B1-child-detail.png", "product/v1.1.3-patch/receipts/execution-113-01.md#2"],
      "scope": {"targets": ["恢复复用与回链"], "allowed_actions": [], "forbidden_actions": ["改动已通过实现"], "constraints": {}},
      "acceptance": ["截图与跨重启实测成立"]
    },
    {
      "origin_id": "G1-G2-regression",
      "subject": "取消后列表/详情一致、待办无残留",
      "criterion": "1.1.2 G1、G2 不退化",
      "status": "RESOLVED",
      "failed_rounds": 0,
      "evidence": [".iso113/evidence/113-G1G2-after-cancel-list.png"],
      "scope": {"targets": ["取消链路"], "allowed_actions": [], "forbidden_actions": ["改动已通过实现"], "constraints": {}},
      "acceptance": ["列表两行已取消，待办清空"]
    }
  ]
}
```
