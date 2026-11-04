# F2 补充执行提示（第 1 次）

日期：2026-11-04。下发角色：规划；承接角色：执行。依据：`planning-review-f2-01.md`。本提示是 F2 的唯一当前执行入口；方向 `product/0.2.2/ready/direction-022-f2-app-bundle.md` 和决策 D022-10～15 不变。

## 锁定项（不得重验）

断言 ①③④⑤⑥⑦⑧⑨，意见表单冲突的服务端校验，以及回执“如实报告”1～4 项的修复。只有本轮改动触及这些路径时才复验受影响项，并写明依据。

## 剩余三项

| ID | 只做这些 | 完成条件 | 证据 |
|---|---|---|---|
| F2-G1 | 意见表单 key 冲突被服务端拒绝时，在对应冲突项下显示原因 | 改成当前租户已存在的 key：该项下方显示“已存在”类说明，不能确认；改成唯一 key：提示消失，导入成功 | 截图两张（有提示、改正后导入成功） |
| F2-G2 | 另建一个本地库模拟目标环境，按升级流程建到当前版本；导入前预置：同编码字典类型一个、同名数据源一个、同编码角色、同名流程分类；另一个字典类型不预置。把 A 的原导出包导入 | 一个字典复用、一个字典新建（含字典项），两处 DICT 字段都保留字典；数据源命中，扩展查询契约落库，DATASOURCE 字段保留绑定；角色、流程分类命中。导入后不做手工补配，直接发布这些表单，DICT 下拉能选到字典项 | 预检截图、导入报告截图、发布后表单新建页截图（DICT 下拉展开）；数据库回读字典类型与字典项、扩展查询契约、字段 definition 中的 dictType 与 dsBinding |
| F2-G3 | 把样例与原始输出放进 `product/0.2.2/receipts/assets/` 并提交 | 导出包样例、导入报告样例、往返对比输出、`sw-biz-form` 测试日志、迁移测试日志、Web vitest 日志、`f2-network-index.md` 都已提交 | 回执列出文件名；导出包密钥扫描结果 |

## 边界

- 不连接 UAT；不放宽唯一性校验；G2 不允许手工补配后当作自动命中。
- 新建的目标库只用于本轮验证，可以在回执写完后删除，回执里写明库名和删除情况。
- 门禁：受影响模块测试、迁移（若改迁移）、Web 四项；提交推送并写远端回读 SHA。
- 回执 `product/0.2.2/receipts/f2-02.md`。

```planner-convergence
{
  "schema": "agent-coding-engine.planner-handoff.v1",
  "feature": "0.2.2",
  "revision": 9,
  "previous_revision": 8,
  "decision": "CONTINUE",
  "source_receipt": "product/0.2.2/receipts/f2-01.md",
  "items": [
    {
      "origin_id": "F2-G1",
      "subject": "意见表单 key 冲突拒绝提示",
      "criterion": "D022-12：审批意见表单 key 冲突时逐个提示用户，新 key 唯一才能确认导入",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/assets/f2-b-import-key-conflict-rejected.png", "product/0.2.2/receipts/assets/f2-b-import-key-conflict-disabled.png"],
      "diagnosis": {
        "location": "导入预检弹窗的意见表单冲突项",
        "observed": "改成已存在的 key 后按钮不可用或无反应，页面上没有任何原因说明",
        "expected": "在对应冲突项下显示该 key 已在当前租户存在，改为唯一 key 后提示消失",
        "cause": "服务端结构化拒绝没有映射到冲突项的界面提示",
        "next_action": "把 BUNDLE_OPINION_KEY_CONFLICT 映射到对应输入项的提示并截图"
      },
      "scope": {
        "targets": ["导入预检弹窗"],
        "allowed_actions": ["前端提示", "必要时服务端在拒绝结果里带上冲突项标识", "浏览器验证"],
        "forbidden_actions": ["放宽唯一性校验", "改动导入流程步骤"],
        "constraints": {"浏览器": "headless=false"}
      },
      "acceptance": ["已存在 key 时对应项显示原因且不能确认", "改为唯一 key 后提示消失并导入成功"]
    },
    {
      "origin_id": "F2-G2",
      "subject": "跨环境导入主路径",
      "criterion": "D022-10、D022-13：跨环境迁移；字典同编码复用、缺失新建，数据源按名称匹配，角色按编码、流程分类按名称匹配",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/f2-01.md 四①③", "product/0.2.2/receipts/assets/f2-b-import-preview.png", "product/0.2.2/receipts/assets/f2-b-import-report-v2.png"],
      "diagnosis": {
        "location": "确认导入的字典与数据源处理",
        "observed": "仅在同库租户间导入，字典全部为编码被占用、数据源全部未命中，复用、新建、命中路径未执行",
        "expected": "导入到另一环境时，字典复用或新建后字段保留字典，同名数据源命中后契约落库、字段保留绑定，无需手工补配即可发布",
        "cause": "验证环境只有一个库，字典编码全库唯一",
        "next_action": "另建本地库模拟目标环境，按要求预置对象后导入并直接发布"
      },
      "scope": {
        "targets": ["确认导入", "导入报告"],
        "allowed_actions": ["新建临时本地库", "预置字典、数据源、角色、流程分类", "修复导入缺陷"],
        "forbidden_actions": ["连接 UAT", "手工补配后冒充自动命中"],
        "constraints": {"目标库": "按升级流程建到当前版本的独立本地库", "补配": "导入后不做手工补配直接发布"}
      },
      "acceptance": ["字典复用一项、新建一项，字段保留字典且下拉可选", "同名数据源命中，契约落库，字段保留绑定", "角色与流程分类命中", "报告与数据库回读一致"]
    },
    {
      "origin_id": "F2-G3",
      "subject": "导出包与报告样例及原始输出",
      "criterion": "F2 方向证据清单：写明导出包与导入报告样例存放位置，原始输出保存在可读位置",
      "status": "REWORK",
      "failed_rounds": 1,
      "evidence": ["product/0.2.2/receipts/f2-01.md 二、三", "product/0.2.2/receipts/assets/f2-network-index.md"],
      "diagnosis": {
        "location": "回执证据",
        "observed": "导出包、对比脚本只在本机临时目录；测试只有通过数无日志；网络索引未提交",
        "expected": "样例与日志放入 receipts/assets 并提交",
        "cause": "证据留在临时目录",
        "next_action": "补放导出包、报告、对比输出、三份测试日志与网络索引"
      },
      "scope": {
        "targets": ["receipts/assets"],
        "allowed_actions": ["复制样例与日志", "提交根仓"],
        "forbidden_actions": ["放入任何密钥或连接串"],
        "constraints": {"位置": "product/0.2.2/receipts/assets/"}
      },
      "acceptance": ["五类文件已提交且可读", "导出包扫描无密钥"]
    }
  ],
  "history_summary": {"revision": 8, "review": "product/0.2.2/receipts/planning-review-f1-stage3-02.md", "retained_count": 18, "status_counts": {"RESOLVED": 18}}
}
```
