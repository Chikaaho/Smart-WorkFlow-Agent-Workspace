# F2 应用导入导出 规划审查（第 3 次）

日期：2026-11-05。审查角色：规划。对象：`f2-03.md`（Server `feature/0.2.2-bundle` @ `d61dceca`，Web `fd8edf5`）、`assets/f2-import-report-sample-v2.json`、两份门禁日志、网络调用索引第 24～27 条（根仓 `34124906`）。上次审查：`planning-review-f2-02.md`。

## 结论

`VERIFYING`。报告数据这一侧已经改对，锁定；页面这一侧还差两处，F2-G4 再收一轮：

1. 页面报告没有截图；
2. 报告顶部的字典计数仍然只算复用的字典。

## 本次锁定

- **报告数据：** 下载的报告文件里有 `createdDictTypes=[dict_cust_level / 客户等级 / 2 项]`、`reusedDictTypes=[dict_lead_source]`，`matchedCategories` 里“销售管理”只出现一次。回执写明这个文件和数据库里的 `report_json` 逐字段对比，没有差异。我复扫了这份文件，没有密钥类内容。
- **测试：** `sw-biz-form` 271/271，新增一个用例覆盖“目标已有同编码字典 → 记为复用”和“分类去重”。Web 四项门禁通过，vitest 2017 passed / 3 skipped。
- **写库逻辑：** 本轮改动只追加报告条目，没有改动任何写库调用，271 个用例全部通过，可以佐证。

## 规划自检

第 2 次审查我只核对了报告 JSON，没有拿第 2 轮报告截图里的“1 字典”去核对顶部计数的口径，所以上轮提示只要求补字典清单，没有把顶部计数列进去。第 2 处是规划漏项，执行这一轮没有做错。本轮把计数口径写成可判定的条件，也写明了截图失败时的替代办法。数据侧已锁定，不要求重做。

## 还差的两处

1. **页面报告没有截图。** 上次提示要求提供页面报告截图，这一轮因为应用内浏览器截图失败而没有产出。回执说用会话里的 DOM 快照代替，但会话记录不在可读位置，规划无法复核。页面上“字典”区长什么样、新建和复用能不能区分，需要看到画面才能确认。
2. **顶部字典计数会误导人。** 回执第五节第 4 条确认，顶部的“N 字典”只计复用的字典。可它旁边的“3 表单、2 流程”计的都是新建数。第 2 轮跨环境导入时，新建 1 个、复用 1 个，顶部显示“1 字典”；第 1 轮两个字典都没建，显示“0 字典”。管理员会把这个数当成“新建了几个字典”，而它其实是复用数，不能再保留原来的口径。

要求：
- 顶部改为显示新建字典数，与表单、流程的口径一致；复用的数量放进下方的“字典”区展示。也可以写成“字典 新建 1 · 复用 1”。
- 截图：
  - 页面报告一张，顶部计数和“字典”区要同时可见；
  - 预检一张。
- 截图通道不可用时，可以换用系统浏览器以 headless=false 截图，并在回执中写明所用浏览器。截图只要求截到这两个画面，其他锁定项不重做。

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
