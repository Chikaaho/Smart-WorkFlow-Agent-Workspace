# F2 补充执行提示（第 2 次）

日期：2026-11-05。下发角色：规划；承接角色：执行。依据：`planning-review-f2-02.md`。本提示是 F2 的唯一当前执行入口；方向 `product/0.2.2/ready/direction-022-f2-app-bundle.md` 和决策 D022-10～15 不变。

## 锁定项（不得重验）

第 1 轮断言 ①③④⑤⑥⑦⑧⑨，F2-G1、F2-G2、F2-G3。本轮只改报告组装与展示，不改变导入规则；如果改动触及确认导入的写库逻辑，复跑 `FormAppBundleServiceTest` 并写明依据。

## 剩余一项

| ID | 只做这些 | 完成条件 | 证据 |
|---|---|---|---|
| F2-G4 | 导入报告补“新建的字典类型”清单（编码、名称、字典项数）；命中的流程分类按对象去重；页面报告展示新建字典 | 在跨环境场景重新导入一次（另建临时本地库，预置同编码 `dict_lead_source`、不预置 `dict_cust_level`、预置同名分类“销售管理”）：报告里新建字典列出 `dict_cust_level`（含字典项数），复用字典列出 `dict_lead_source`，“销售管理”只出现一次；页面报告与“下载报告”文件内容一致 | 页面报告截图；下载的报告文件放入 `product/0.2.2/receipts/assets/f2-import-report-sample-v2.json`；数据库回读 `sw_form_app_import_record.report_json`；新增或修改的测试 |

## 边界

- 不连接 UAT；不改变导入规则。
- 临时目标库验证后可删除，回执写明库名和删除情况。
- 门禁：`sw-biz-form` 全量测试、Web 四项；提交推送并写远端回读 SHA。日志放入 `product/0.2.2/receipts/assets/`。
- 回执 `product/0.2.2/receipts/f2-03.md`。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "0.2.2",
  "revision": 10,
  "previous_revision": 9,
  "decision": "CONTINUE",
  "source_receipt": "product/0.2.2/receipts/f2-02.md",
  "items": [
    {
      "origin_id": "F2-G1",
      "subject": "意见表单 key 冲突拒绝提示",
      "criterion": "D022-12：审批意见表单 key 冲突时逐个提示用户，新 key 唯一才能确认导入",
      "status": "RESOLVED",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/f2-02.md 一", "product/0.2.2/receipts/assets/f2-g1-key-taken-inline-hint.png", "product/0.2.2/receipts/assets/f2-g1-unique-key-import-success.png"],
      "scope": {
        "targets": ["导入预检弹窗"],
        "allowed_actions": ["前端提示", "必要时服务端在拒绝结果里带上冲突项标识", "浏览器验证"],
        "forbidden_actions": ["放宽唯一性校验", "改动导入流程步骤"],
        "constraints": {"浏览器": "headless=false"}
      },
      "acceptance": ["已锁定"]
    },
    {
      "origin_id": "F2-G2",
      "subject": "跨环境导入主路径",
      "criterion": "D022-10、D022-13：跨环境迁移；字典同编码复用、缺失新建，数据源按名称匹配，角色按编码、流程分类按名称匹配",
      "status": "RESOLVED",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/f2-02.md 二", "product/0.2.2/receipts/assets/f2-g2-preview-crossenv.png", "product/0.2.2/receipts/assets/f2-g2-import-report.png", "product/0.2.2/receipts/assets/f2-g2-dict-dropdown.png", "product/0.2.2/receipts/assets/f2-import-report-sample.json"],
      "scope": {
        "targets": ["确认导入", "导入报告"],
        "allowed_actions": ["新建临时本地库", "预置字典、数据源、角色、流程分类", "修复导入缺陷"],
        "forbidden_actions": ["连接 UAT", "手工补配后冒充自动命中"],
        "constraints": {"目标库": "按升级流程建到当前版本的独立本地库", "补配": "导入后不做手工补配直接发布"}
      },
      "acceptance": ["已锁定"]
    },
    {
      "origin_id": "F2-G3",
      "subject": "导出包与报告样例及原始输出",
      "criterion": "F2 方向证据清单：写明导出包与导入报告样例存放位置，原始输出保存在可读位置",
      "status": "RESOLVED",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/f2-02.md 三", "product/0.2.2/receipts/assets/f2-bundle-sample.json", "product/0.2.2/receipts/assets/f2-02-sw-biz-form-test.log"],
      "scope": {
        "targets": ["receipts/assets"],
        "allowed_actions": ["复制样例与日志", "提交根仓"],
        "forbidden_actions": ["放入任何密钥或连接串"],
        "constraints": {"位置": "product/0.2.2/receipts/assets/"}
      },
      "acceptance": ["已锁定"]
    },
    {
      "origin_id": "F2-G4",
      "subject": "导入报告的新建字典清单",
      "criterion": "F2 方向导入规则 6：导入报告列出新建对象清单、复用对象、置空的引用",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/assets/f2-import-report-sample.json", "product/0.2.2/receipts/assets/f2-g2-import-report.png"],
      "diagnosis": {
        "location": "确认导入生成的 report_json 与页面导入报告",
        "observed": "dict_cust_level 已新建，但报告只有 reusedDictTypes，没有新建字典类型列表；matchedCategories 同一分类按流程重复两次",
        "expected": "报告列出新建字典类型的编码、名称、字典项数；命中分类按对象去重；页面与下载文件一致",
        "cause": "报告组装只收集了复用的字典类型，分类按引用位置逐条追加",
        "next_action": "补新建字典类型清单并对命中分类去重，在跨环境场景下重新导入核对"
      },
      "scope": {
        "targets": ["导入报告"],
        "allowed_actions": ["报告补新建字典类型", "命中分类去重", "页面报告展示", "新建临时本地库复验"],
        "forbidden_actions": ["改变导入规则", "连接 UAT"],
        "constraints": {"复验场景": "目标库预置一个同编码字典、缺一个字典、预置同名分类", "浏览器": "headless=false"}
      },
      "acceptance": ["报告列出新建字典类型的编码、名称、字典项数", "命中分类不重复", "页面报告与下载文件一致"]
    }
  ],
  "history_summary": {"revision": 9, "review": "product/0.2.2/receipts/planning-review-f2-01.md", "retained_count": 18, "status_counts": {"RESOLVED": 18}}
}
```
