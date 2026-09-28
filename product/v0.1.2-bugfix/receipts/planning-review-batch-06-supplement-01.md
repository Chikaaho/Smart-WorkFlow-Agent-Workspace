# 批次 6 补证 01 规划复核

日期：2026-09-27；结论：VERIFYING。依据 batch-06-evidence-supplement-01.md 及 evidence/batch-06-supplement-01/ 实际制品。

## 已核销与锁定

- G1 表单管理子项：实际查看 1440×900、1366×768 及滚动后截图，Edit/Initiation scope/Disable 完整显示；滚动后 Publish status 与 Published 可见。接受局部横向滚动口径，不要求同屏展示全部列。
- G2：已读取 api/form-def-page-xhr-capture.json，200 响应中指定 formKey 的 createByName 与 DOM 行均为“系统管理员”。结合鉴权/租户/创建人映射测试原始输出与回执对既有断言及快照适用性的说明，接受本次组合证据；拒绝及租户边界证据层级为行为测试，不宣称真实浏览器多租户验证。
- G3：工具复算后端 14 个模块汇总为 1574/0/0/0；补跑聚焦 26/0/0/0、BUILD SUCCESS；前端日志 141 passed files + 1 skipped、1298 passed + 3 skipped，lint 0 errors / 102 warnings，build 成功。git-readback.txt 记录 Server 6a43d04 与 Web fe9f6be 及对应远端相同 SHA。本次核对的是回读制品时点，不是实时远端查询。
- 批次 5 指针已在补充回执定位至台账轮 6 与已有提交，可使用该索引。

## 唯一剩余范围：G1 更多菜单场景

实际打开 notify-template-more-dropdown-open.png：More 展开及 Delete 菜单项可见，但回执声称直显的 Preview 未完整显示，截图只有 Edit/Disable/More 清晰可辨，左侧有极小文字残影。不能据此确认三直显加末位更多均完整可达。表单管理页的列宽修复不能证明通知模板页该场景通过。

此外，已附制品能证明展开菜单，未附 Delete 确认后的成功响应/行消失或清理回读，故回执“删除成功、净零清场”目前仍为声明。

G1 拆分为 G1a（通知模板四动作完整显示与可达）和 G1b（该演示对象删除后回读）。这是操作列同类缺口第二次复核未完全通过，按角色规则下发首次一级补充提示；G2/G3 与表单管理已核销部分不再作为执行待办。

当前执行入口：planning-execution-prompt-batch-06-01.md。整体任务保持开放，Owner 验收状态不变。
