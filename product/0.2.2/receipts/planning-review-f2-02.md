# F2 应用导入导出 规划审查（第 2 次）

日期：2026-11-05。审查角色：规划。对象：`f2-02.md`（Server `feature/0.2.2-bundle` @ `ba5ee84c`，Web `741f2bc`）、截图 `assets/f2-g1-*.png`、`assets/f2-g2-*.png`、样例与日志（根仓 `470a8b8a`）。上次审查：`planning-review-f2-01.md`。

## 结论

`VERIFYING`。上轮三项缺口全部补齐，锁定。新发现一项：导入报告漏列新建的字典类型（F2-G4）。报告是管理员发布前核对的依据，按方向要求须修复，修完 F2 即可通过。

## 本次通过

| ID | 依据 |
|---|---|
| F2-G1 冲突提示 | `f2-g1-key-taken-inline-hint.png`：改成已存在的 `op_form` 后，该项下方红字“该 key 在当前租户已存在，请更换后重试”，“确认导入”置灰；`f2-g1-unique-key-import-success.png`：改成 `op_form_g1fresh` 后导入成功。服务端拒绝结果带上冲突 key，前后端各补了用例 |
| F2-G2 跨环境主路径 | 目标库 `smart_workflow_f2_g2` 按升级流程建到 v0.2.6（25 个迁移）。预检截图：`dict_lead_source` 同编码复用、`dict_cust_level` 缺失新建，查询契约、数据源、角色、两个流程分类全部命中，只有指定用户 91103 置空。导入报告只剩这一条置空。不做补配直接发布三张表单；新增记录页“线索来源”下拉显示目标库自己的“广告投放 / 自然流入”，说明复用的是目标侧字典且未被包内覆盖；城市字段保留了数据源绑定。报告样例中契约 `datasource_id=980201` 指向预置数据源 |
| F2-G3 样例与日志 | 导出包样例、导入报告样例、往返对比脚本与输出、`sw-biz-form` 270/270、迁移全链 33/33、Web vitest 2017 passed / 3 skipped 的日志、网络调用索引均已提交。我对两份样例 JSON 复扫 password、jdbc、secret、cipher、token 等关键词，0 命中 |
| 往返对比重跑 | 15 处差异逐条都能对上 D022-11、D022-13 的规则，unexpected=0 |

## 缺口

**F2-G4 导入报告缺“新建的字典类型”清单。** 方向要求报告列出新建对象清单。报告样例里有 `reusedDictTypes`（复用的 `dict_lead_source`），但新建的 `dict_cust_level` 没有对应列表，只在页面汇总里计成“1 字典”。另外 `matchedCategories` 按流程逐条记录，同一个分类出现了两次。

要求：报告补上新建字典类型（编码、名称、字典项数），命中的分类按对象去重；页面报告和下载的报告文件内容一致。

## 不作缺口的观察

- **数据源授权：** 目标库第一次发布线索表单时被 1220（数据源未授权）拦住，补上数据源引用授权后通过。这是目标环境自己的配置，不属于导入缺陷；但正式跨环境使用时管理员同样会碰到，操作手册的导入说明里应提一句“同名数据源需先给相关用户授权”，在整版验收的手册同步里处理。
- **证据入库范围：** 执行在 `.gitignore` 为 `product/0.2.2/receipts/assets/f2-*` 加了例外，这是按上次提示要求提交样例和日志所需，范围只限 F2 证据，可以接受。
- 目标库已删除，回执写明了库名和删除回读。

## 带入后续阶段

- **验收与同步（整版）：** F1、F2 一起回归各自锁定项；操作手册补应用导入导出说明（含数据源授权提示）。
- **合并：** 两个业务仓按 `feature/0.2.2-agent` → `feature/0.2.2-bundle` 的线性顺序进入；`ApplicationCenterRecoveryDrillPostgresTest` 在 CI 跑通。
- **发布：** UAT 先装 pgvector 再升级（见 F1 阶段 3 审查）；Key 由 Owner 在页面录入。

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
