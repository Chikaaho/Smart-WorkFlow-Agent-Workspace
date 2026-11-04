# F2 应用导入导出 规划审查（第 1 次）

日期：2026-11-04。审查角色：规划。对象：`f2-01.md`（Server `feature/0.2.2-bundle` @ `3f2066cf`，Web `d4d320e`）、截图 `assets/f2-*.png`、网络调用索引 `assets/f2-network-index.md`。方向：`product/0.2.2/ready/direction-022-f2-app-bundle.md`，决策 D022-10～15。

## 结论

`VERIFYING`。导出、预检、确认导入、全草稿、二次导入、失败回滚、权限和往返对比这条主链路已经跑通，锁定。还剩三项要补：

1. 意见表单 key 冲突被拒绝时，页面上看不到原因；
2. 所有导入都发生在同一个库的两个租户之间，字典“新建、复用”和数据源“按名称命中”这几条跨环境主路径一次都没走到；
3. 方向要求的导出包样例、导入报告样例和测试原始输出没有落到可读位置。

## 锁定（不再重验）

| 断言 | 依据 |
|---|---|
| ① 导出→预检 | 预检截图列出 2 目录、3 表单、2 流程、1 意见表单、2 字典、1 交易动作、1 查询契约，外部引用逐条显示“置空/命中”与位置 |
| ③ 全草稿→逐个发布→可用 | 表单、流程导入后均为草稿；补配后发布，B-线索001 建记录并走完初审、复核，结果 APPROVED；交易动作调用成功 |
| ④ 无源 id 残留 | 31 个源对象 id 对 B 租户 16 张业务表全文扫描 0 命中；`opinionForm.formId` 指向 B 侧新意见表单 |
| ⑤ 置空与匹配 | 指定用户 91103 在预检和报告中都列出；角色 demo_admin 命中并实际完成复核 |
| ⑥ 二次导入 | 生成“CRM 客户管理-导入”，表单 key 重新生成，第一次导入的应用不受影响 |
| ⑦ 失败回滚 | 故意构造超长 key 让确认导入失败，回读应用、表单、导入记录数量与导入前一致，没有孤儿目录 |
| ⑧ 权限 | 无权限用户的卡片菜单里没有导出项，导出和预检接口返回 403；导出包里扫不到密码、连接串、密文字段 |
| ⑨ 往返一致 | 再导出后与原包对比，8 处差异都在设计之内（应用名后缀、置空的引用、未建的字典和契约） |
| 意见表单冲突的服务端校验 | 改成已存在的 key 时，服务端返回 `BUNDLE_OPINION_KEY_CONFLICT`，导入记录、应用、原表单都没有变化 |

执行自己发现并修好的问题（授权脚本执行顺序、DICT 字段级置空、设计器对自定义字典的校验、弹层里的按钮权限）都已在回执中说明，按本轮锁定。

## 缺口

### F2-G1 意见表单冲突被拒绝时没有提示

`f2-b-import-key-conflict-rejected.png` 和 `-disabled.png` 里，输入框还是 `op_form`，“确认导入”按钮变灰或无反应，但页面上没有任何文字说明这个 key 已被占用。D022-12 要求逐个提示，用户需要知道是哪一项、为什么不能确认。

要求：服务端拒绝后，在对应冲突项的输入框下方显示原因（这个 key 在当前租户已存在），其他冲突项不受影响；改成唯一 key 后提示消失，可以确认。

### F2-G2 跨环境主路径没有验证

D022-10 定的用途是跨环境迁移，但本轮所有导入都在同一个库的租户 A→B 之间进行。字典编码在全库唯一，所以包里的两个字典在 B 侧必然是“编码被占用”；数据源在 B 侧也没有同名的。结果是：

- 字典“目标没有就新建、目标已有就复用”两条路径没有走到，导入后所有 DICT 字段都被置空，靠手工改成自定义候选才发布成功；
- 数据源“按名称命中、保留绑定”也没有走到，城市字段是在设计器里手工重绑的。

这几条恰恰是 UAT→生产这类正式用法最常见的情况。

要求：另建一个本地库模拟目标环境（按升级流程建到当前版本，验证后可删），把 A 的导出包导入进去，并在导入前让目标库里：

- 预先存在其中一个字典类型（同编码）→ 应复用，字段保留字典；
- 不存在另一个字典类型 → 应新建类型和字典项，字段保留字典；
- 存在同名数据源 → 扩展查询契约落库、DATASOURCE 字段保留绑定；
- 存在同编码角色、同名流程分类 → 命中。

导入后不做任何手工补配，直接发布这些表单，DICT 下拉能选到字典项，DATASOURCE 字段能看到契约（数据源本身连不上可以接受，但绑定要在）。

### F2-G3 导出包、报告样例和原始输出缺位

方向“证据清单”第 3 条要求写明导出包与导入报告样例的存放位置，并要求原始输出保存在可读位置。回执只写了 `crm_bundle.json`、`bundle_b2.json`、对比脚本在本机临时目录，测试只写了通过数，没有日志文件；`f2-network-index.md` 也还没提交。

要求：把以下内容放进 `product/0.2.2/receipts/assets/` 并提交：

- 一份导出包样例（原包即可，确认无密钥）；
- 一份导入报告样例（`report_json` 或页面“下载报告”的文件）；
- 往返对比的输出；
- `sw-biz-form` 测试日志、迁移测试日志、Web vitest 日志；
- `f2-network-index.md`。

## 不作缺口的观察

- **格式错误的包：** 超长 key 的包能通过预检，确认导入时直接报 500。数据没有残留，符合回滚要求；但用户只看到一个笼统的错误。预检阶段补字段长度和必填校验更好，登记到需求池，不在本版处理。
- **商机流程的交易动作被拒绝（1611）：** 原因是 A 侧演示数据本身配错了（动作绑定的是线索的字段），导入只是如实复制，与导入功能无关。
- **`v-perm` 在弹层菜单里不生效：** 本功能已改用 `v-if`。别的页面如果也在下拉菜单里用 `v-perm`，可能有同样的问题，登记到需求池，F2 不扩大范围去排查。

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
