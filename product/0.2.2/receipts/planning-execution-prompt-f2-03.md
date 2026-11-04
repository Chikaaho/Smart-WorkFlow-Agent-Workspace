# F2 补充执行提示（第 3 次）

日期：2026-11-05。下发角色：规划；承接角色：执行。依据：`planning-review-f2-03.md`。本提示是 F2 的唯一当前执行入口；方向和决策 D022-10～15 不变。

## 锁定项（不得重验）

第 1 轮断言 ①③④⑤⑥⑦⑧⑨；F2-G1、G2、G3；F2-G4 的报告数据（`createdDictTypes`、分类去重、下载文件与数据库一致）和 271 个服务端用例。

## 只做这些

| 项 | 完成条件 | 证据 |
|---|---|---|
| 报告顶部字典计数 | 改为新建数，与表单、流程口径一致；或写成“字典 新建 N · 复用 M”。前端单测覆盖“新建 1、复用 1”时的显示 | 改动说明、vitest 结果 |
| 截图 | 在跨环境场景（临时库：预置同编码 `dict_lead_source`、不预置 `dict_cust_level`、预置同名分类）重新导入一次：预检截图一张；报告截图一张，顶部计数与“字典”区同时可见，新建 `dict_cust_level`（含项数）和复用 `dict_lead_source` 能区分 | `assets/f2-g4-preview.png`、`assets/f2-g4-report.png`，回执写明所用浏览器 |

截图必须是 headless=false 的可见浏览器。应用内浏览器截图失败时，改用系统浏览器（Chrome/Edge）；会话记录、DOM 快照不能代替截图。

## 边界

- 不改变导入规则、不改服务端写库逻辑；不连接 UAT。
- 临时库验证后可删除，回执写明库名和删除情况。
- 门禁：Web 四项；如果动了服务端，再跑 `sw-biz-form` 全量。提交推送并写远端回读 SHA，日志放进 `assets/`。
- 回执 `product/0.2.2/receipts/f2-04.md`。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "0.2.2",
  "revision": 11,
  "previous_revision": 10,
  "decision": "CONTINUE",
  "source_receipt": "product/0.2.2/receipts/f2-03.md",
  "items": [
    {
      "origin_id": "F2-G4",
      "subject": "导入报告的新建字典清单",
      "criterion": "F2 方向导入规则 6：导入报告列出新建对象清单、复用对象、置空的引用",
      "status": "REWORK",
      "failed_rounds": 2,
      "planner_self_audit": "第 2 次审查只看了报告 JSON，没有对照第 2 轮报告截图里的“1 字典”来核对顶部汇总行的计数口径，所以上轮提示只要求补清单，没把汇总行列进去，这是规划漏项，不算执行返工。本轮把汇总行口径写成可判定条件，并写明截图通道不可用时的替代办法；数据侧已锁定，不再要求重做。",
      "evidence": ["product/0.2.2/receipts/f2-03.md 三、五.1、五.4", "product/0.2.2/receipts/assets/f2-import-report-sample-v2.json", "product/0.2.2/receipts/assets/f2-g2-import-report.png"],
      "diagnosis": {
        "location": "导入报告页面：顶部汇总行与字典区",
        "observed": "报告数据已含新建字典且分类去重；页面无截图可复核；顶部“N 字典”只计复用数，新建 1 复用 1 时显示“1 字典”",
        "expected": "顶部字典数与表单、流程同为新建口径，或同时标明新建与复用；页面报告与预检有可复核截图",
        "cause": "汇总行沿用旧计数口径；本轮截图通道故障未换用其他浏览器",
        "next_action": "改顶部字典计数口径，在跨环境场景重新导入并截取预检与报告两张图"
      },
      "scope": {
        "targets": ["导入报告"],
        "allowed_actions": ["页面报告展示", "新建临时本地库复验"],
        "forbidden_actions": ["改变导入规则", "连接 UAT", "以会话记录代替截图"],
        "constraints": {"浏览器": "headless=false", "截图通道": "应用内浏览器截图失败时改用系统浏览器",  "页面报告展示": "含顶部汇总行字典计数", "复验场景": "目标库预置一个同编码字典、缺一个字典、预置同名分类"}
      },
      "acceptance": ["顶部字典计数为新建口径或同时标明新建与复用", "报告截图中顶部计数与字典区同时可见，新建 dict_cust_level 含项数、复用 dict_lead_source 可区分", "预检截图一张", "报告数据与 f2-import-report-sample-v2.json 口径一致"]
    }
  ],
  "history_summary": {"revision": 10, "review": "product/0.2.2/receipts/planning-review-f2-02.md", "retained_count": 21, "status_counts": {"RESOLVED": 21}}
}
```
