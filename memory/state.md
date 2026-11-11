# 当前状态摘要

2026-11-11｜执行｜1.0.0 第三轮返修 U1—U3 完成，交 `execution-100-04.md`。

## 当前任务

**1.0.0 阶段 3（XL）**：`planning-review-100-03.md`——S2/S4/S5 通过；返修 U1 浏览器打印时间早 8 小时（根因：`/form/data` 把 `timestamp` 序列化为 UTC ISO，PrintSheet 字面截取；修 `PrintSheet.formatDate` 走 `normalizeFormDateValue`，与页面同口径）、U2 PDF/Excel 日期按字段 `format`（datetime→`yyyy-MM-dd HH:mm`，缺省→`yyyy-MM-dd`）、U3 明细表只读多选按实际选中回显（`TableControl.cellValue` 过 `normalizeFormFieldValue`，1.0.0 前遗留）。交 `execution-100-04.md`。

## 本轮代码

- Server `feature/1.0.0` `9fe3f11c`：`FormPrintPdfService` FieldDef.format、`FormDetailTableExportService` datetimeFormat；两处测试更新/新增。
- Web `feature/1.0.0` `3c5b5ec`：`PrintSheet` 时区口径 + `PrintSheet.spec.ts`（01:30Z→09:30）、`TableControl` 单元格归一 + spec、`scripts/sw100-u1-u3.mjs` 取证脚本。
- 工作区：`execution-100-04.md` + memory 同步 + 子仓指针。

## 门禁

- Server 受影响模块：sw-biz-form-biz **280/0/0/0**、sw-bpm-process **528/0/0/0 BUILD SUCCESS**（含 U2 新用例）。
- Web：typecheck 0、lint 0 错（55 条既有取证脚本警告）、test **2060 passed/3 skipped**、build 通过。
- 未重跑多库、未重跑 Server 全量（评审明确不需要）。

## 环境与边界

- 克隆库 `smart_workflow_100` 不变；jar 19:35 重建，Server 18093 于 19:37:23 重启（同参数 + 本机 `SW_CIPHER_KEY`）；Web 5275 正常。证据 19:41—19:42。
- 本机丢失上轮 admin 口令环境变量，已把克隆库 admin 口令重置为种子迁移 R__0.1.10 口径（幂等；明文不入回执/Git）。
- 未触碰用户 8080/5173、`smart_workflow_f1v4b`、`smart_workflow_030`；未删除/重建演示环境，未清数据；未强推/改历史/移动 tag。

## 教训

- 记录 API 的 `timestamp` 序列化为 UTC ISO 是四渲染路径分歧的根源；前端任何「字符串直显」的路径都要先过 `normalizeFormDateValue`。
- 明细表单元格与主表字段必须走同一 `normalizeFormFieldValue`，控件数组契约不要在两处各自解释。
- 上轮设置的一次性环境变量（口令类）应记入本机可持久位置或当场写回受保护文件，否则跨会话即丢失。
