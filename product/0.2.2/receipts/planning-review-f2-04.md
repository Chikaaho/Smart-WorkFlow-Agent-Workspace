# F2 应用导入导出 规划审查（第 4 次）

日期：2026-11-05。审查角色：规划。对象：`f2-04.md`（Web `feature/0.2.2-bundle` @ `c8a2eb1`，Server 未改动，仍是 `d61dceca`）、截图 `assets/f2-g4-preview.png`、`assets/f2-g4-report.png`、门禁日志 `assets/f2-04-web-gates.log`（根仓 `4a7ec002`）。上次审查：`planning-review-f2-03.md`。

## 结论

F2-G4 通过，F2 **通过**。0.2.2 的两个功能 F1、F2 都已完成执行验收，下一步进入整版验收与同步。

## 本次通过

| 项 | 依据 |
|---|---|
| 顶部字典计数 | 报告截图顶部为“3 表单 · 2 流程 · 1 意见表单 · 字典 新建 1 · 复用 1 · 1 交易动作 · 1 查询契约”，新建和复用分开标明，不会再被误读成新建数；单测固定了“新建 1、复用 1”的显示 |
| 报告截图 | 顶部计数和“字典”区在同一屏内：“缺失新建 dict_cust_level 客户等级 · 2 项”“同编码复用 dict_lead_source 线索来源”，两种标签颜色不同，一眼能分清；置空区只有指定用户 91103 |
| 预检截图 | 字典处置区显示“同编码复用 / 缺失新建”；外部引用 8 条，除指定用户外全部命中，两个流程的分类各一条（预检按引用位置列出，属于正常展示） |
| 数据口径 | 本轮导入的报告与已锁定的 `f2-import-report-sample-v2.json` 四个字段逐项一致；服务端零改动 |
| 门禁 | Web typecheck、lint 0 错误，vitest 2017 passed / 3 skipped，build 通过 |

## 带入后续阶段

- **验收与同步（整版）：**
  - F1 三个阶段和 F2 各自按锁定项回归；
  - 操作手册补应用导入导出说明，提醒“目标环境的同名数据源需要先给相关用户授权”；
  - 需求池里的两个候选（预检补字段长度和必填校验、其他页面下拉菜单里的 `v-perm`）不进本版。
- **合并：** 两个业务仓的 `feature/0.2.2-bundle` 已包含 F1 的提交，按它进入合并；`ApplicationCenterRecoveryDrillPostgresTest` 要在 CI 跑通。
- **发布：** UAT 先装 pgvector 再升级；Key 由 Owner 在页面录入。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "0.2.2",
  "revision": 12,
  "previous_revision": 11,
  "decision": "FINISH",
  "source_receipt": "product/0.2.2/receipts/f2-04.md",
  "items": [
    {
      "origin_id": "F2-G4",
      "subject": "导入报告的新建字典清单",
      "criterion": "F2 方向导入规则 6：导入报告列出新建对象清单、复用对象、置空的引用",
      "status": "RESOLVED",
      "failed_rounds": 2,
      "evidence": ["product/0.2.2/receipts/f2-04.md 一、二", "product/0.2.2/receipts/assets/f2-g4-report.png", "product/0.2.2/receipts/assets/f2-g4-preview.png", "product/0.2.2/receipts/assets/f2-import-report-sample-v2.json"],
      "scope": {
        "targets": ["导入报告"],
        "allowed_actions": ["页面报告展示", "新建临时本地库复验"],
        "forbidden_actions": ["改变导入规则", "连接 UAT", "以会话记录代替截图"],
        "constraints": {"浏览器": "headless=false", "截图通道": "应用内浏览器截图失败时改用系统浏览器", "页面报告展示": "含顶部汇总行字典计数", "复验场景": "目标库预置一个同编码字典、缺一个字典、预置同名分类"}
      },
      "acceptance": ["已锁定"]
    }
  ],
  "history_summary": {"revision": 11, "review": "product/0.2.2/receipts/planning-review-f2-03.md", "retained_count": 21, "status_counts": {"RESOLVED": 21}}
}
```
