# form-data-import-export（P32 / M03-F04-02 表单数据导入导出）

> 正式功能；阶段三终态同步完成（2026-08-29）。
> 状态：功能级 **PASSED**（2026-08-29，规划最终验收）→ 阶段三终态落值 **COMPLETED（已确认，2026-08-29）**（规划终态复核 `planning-terminal-final-review-20260829.md` PASSED）。

## 功能目标

实现表单数据的 Excel 导入与导出能力，支持用户将动态宽表数据导出为 Excel 文件，以及从 Excel 文件导入数据到动态宽表中。

## 交付范围（已锁定，证据见下）

- 后端：表单数据导出端点（按表单定义动态查询宽表数据，生成 Excel 文件流式返回）；表单数据导入端点（解析 Excel 文件，按表单定义动态写入宽表，支持批量插入）；导入校验（字段类型匹配、必填校验、数据格式校验）；错误行标记与导入结果报告。
- 前端：导入导出按钮（表单数据列表页）、文件选择与上传交互、导入进度与结果展示、导出文件下载触发。
- 迁移：Flyway V42/V43 双方言迁移（H2/PG）。

## 验收与证据链

- 最终验收：`receipts/planning-final-review-form-data-import-export-20260829.md`（PASSED）。
- 执行回执：`receipts/completion-receipt-form-data-import-export.md`。
- 测试回执：`receipts/test-receipt-form-data-import-export.md`。

## 阶段三终态（2026-08-29 落值）

- 已完成功能数 35→**36**；清单 **✅32 / 🟦25 / ⬜33**（M03-F04-02 升 ✅ 完成）。
- 基线：后端 **947/0/0/0**（agent 346，本轮新增）；前端 **110 files / 1057 tests / 3 skipped**；Flyway **H2 V43（全链 43）/ PostgreSQL V43（全链 42，V41 为 H2 专用，链数不同属预期）**。
- P32 **已核销/完成**。

## 测试基线

- 后端：947 tests / Failures 0 / Errors 0 / Skipped 0（agent 346）
- 前端：110 spec files / 1057 tests / 3 skipped；typecheck、lint、test、build 全绿
- Flyway：H2 全链 43 migrations、PG 全链 42 migrations
- **后续基线演进（2026-08-29，minimal-closure-first-acceptance 验收审计锁定，当前正式口径）**：后端 **955/0/0/0**（agent 346）、前端 **110 files / 1060 tests / 0 skipped**、Flyway **H2 V44（44）/ PG V44（43）**——本功能实现时的 947/1057/V43 为历史终态值，当前正式基线见 `knowledge/current-status.md`。

## 已知限制

- 无本轮新登记已知问题。

## 证据路径

| 类型 | 路径 |
|------|------|
| 功能级验收 | `product/form-data-import-export/receipts/planning-final-review-form-data-import-export-20260829.md` |
| 执行回执 | `product/form-data-import-export/receipts/completion-receipt-form-data-import-export.md` |
| 测试回执 | `product/form-data-import-export/receipts/test-receipt-form-data-import-export.md` |
| 主方向 | `product/form-data-import-export/passed/direction-form-data-import-export.md` |
| 终态同步方向 | `product/form-data-import-export/ready/direction-form-data-import-export-stage3.md` |
