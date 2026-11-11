# execution-100-04：阶段 3 打印返修 U1—U3

接 `planning-review-100-03.md` §3（U1—U3）。在隔离环境（Server 18093 / Web 5275 / 克隆库 `smart_workflow_100`）完成三项返修并重拍证据；按要求只跑受影响模块测试与 Web 四项检查，未重跑多库、未重跑 Server 全量。测试账号与口令不入 Git 与回执。

## A 返修

### U1 浏览器打印时间早 8 小时

- **根因（回执写明）**：不在 `/workflow/print/context`（该接口只返回定义 JSON，与时间无关），也不在服务端存储——克隆库 `timestamp without time zone` 存的是本地钟面值（R1 `due=2026-11-10 09:30:00`）。问题出在记录读取接口 `GET /form/data/{formKey}/{recordId}` 的 JSON 序列化：Jackson 默认把 `java.sql.Timestamp` 按 UTC 输出为带偏移的 ISO 串（实测 R1 `due="2026-11-10T01:30:00.000+00:00"`）。页面 `DateControl` 走 `normalizeFormDateValue` 先还原浏览器本地时间所以正确，PDF/Excel 在服务端拿到的是 Timestamp 本地值所以正确；`PrintSheet.formatDate` 对字符串分支直接 `slice(0,16)` 字面截取，把 UTC 钟面值当本地值输出了 `01:30`。
- **修复**：`PrintSheet.formatDate` 字符串分支改走页面同一口径 `@/contracts/form-date` 的 `normalizeFormDateValue`（带时区还原本地时间，无时区历史值保持原义），datetime 字段截到 `yyyy-MM-dd HH:mm`（与 PDF `TIME_FMT` 一致），日期字段只到日；跨日 UTC 值按本地日期（如 `17:00Z` → 次日）。
- **单测（按要求）**：新增 `PrintSheet.spec.ts`（TZ=Asia/Shanghai）3 条：给定记录 API 形态的 `2026-11-10T01:30:00.000+00:00`（即本地 `09:30`），打印输出 `2026-11-10 09:30`；`2026-11-11T02:00:00.000+00:00` 输出 `2026-11-11 10:00`；无时区历史值 `2026-11-10 09:30:00` 保持原义不偏移；日期字段跨日 UTC 值只到日。3/3 通过。
- **证据（2026-11-11 19:41，晚于最终代码与 jar 构建 19:35、Server 重启 19:37:23）**：
  - R1 三入口浏览器打印：`u1_r1_form_detail_print.png`（19:41:14，表单详情）、`u1_r1_task_detail_print.png`（19:41:19，任务详情）、`u1_r1_my_instance_print.png`（19:41:25，我发起的）。三张均为 v2 版面、页脚「表单版本 v2（提交时版本）」，申请日期 `2026-11-11 10:00`、到货时间 `2026-11-10 09:30`、验收时间 `2026-11-11 10:00`，与页面/PDF 完全一致，无 `01:30`/`02:00`。
  - PDF 对照：`u1_r1_form_detail.pdf`（19:41:15，3 页，第 1 页渲染 `u1_r1_form_detail_page_1.png`）、`u1_r1_old_v2.pdf`（19:41:26，我发起的入口，第 1 页渲染 `u1_r1_old_v2_page_1.png`）。PDF 文本抽取确认申请日期 `2026-11-11 10:00`、到货时间 `2026-11-10 09:30`（抽取换行把 `09` 与 `:30` 拆行，单元格实际为同一值）、验收时间 `2026-11-11 10:00`，打印与 PDF 逐字段一致。

### U2 日期显示格式四处统一

- **两个字段配置（回执写明，定义 JSON 实测）**：`applyDate`（申请日期，主表字段）v2—v5 均为 `format="datetime"`；`itemsA.due`（到货时间）与 `itemsB.reviewDate`（验收时间，明细表子字段）v2 为 `format="datetime"`，v3 起无 `format` 键（= 纯日期）。
- **统一规则**：字段配置为日期 → 四处只显示 `yyyy-MM-dd`；配置为日期时间 → 四处显示 `yyyy-MM-dd HH:mm`。页面（`DateControl`/`normalizeFormDateValue`）与浏览器打印（U1 修复后同口径）本就按 format 区分；本次改服务端两处：
  - PDF `FormPrintPdfService`：`FieldDef` 增加 `format`，`displayValue` 的 DATE 分支改为 `formatDate(raw, field.format())`——datetime 输出 `yyyy-MM-dd HH:mm`，其余（含未配置）输出 `yyyy-MM-dd`（新增 `DATE_FMT`）。
  - Excel `FormDetailTableExportService`：`SubField` 增加 `datetimeFormat`（读子字段 `format`），`dateText` 按同一规则分流。
- **R3 同一行四处结果**（到货时间，配置=纯日期）：页面 `u2_r3_page.png`（19:41:33）显示 `2026-11-12`；浏览器打印 `u2_r3_print.png`（19:41:33，v3 页脚）显示 `2026-11-12`，全文无 `09:30`；PDF `u2_r3.pdf`（19:41:34，第 1 页渲染 `u2_r3_page_1.png`）显示 `2026-11-12`、无 `09:30`；Excel `u2_r3_itemsA.xlsx`（19:41:35）「到货时间」列值为字符串 `2026-11-12`。验收时间同规则（同四处的表/打印/PDF 内均为 `2026-11-12`）。主表申请日期（配置=日期时间）页面/打印均为 `2026-11-12 10:00`（v3 打印模板 fields 未选申请日期，打印按模板输出，PDF 同模板一致）。
- **字段配置截图**：`u2_field_config_applydate.png`（19:41:40，设计器主表「申请日期」配置面板，日期格式开关=开即日期时间）；`u2_field_config_subfields.png`（19:41:41，当前定义 JSON 摘录：`main.applyDate=datetime | itemsA.due=<none> | itemsB.reviewDate=<none>`）。说明：明细表子字段的 format 配置在设计器面板无开关（子字段契约在 P63 未落该键），v2 的 datetime 由种子/接口写入，故子字段配置以定义 JSON 截图为证。

### U3 页面明细表只读多选显示实际选中

- **根因**：`TableControl` 把单元格原始值（JSON 列返回的 `"[\"b\",\"c\"]"` 字符串）直接传给控件；`MultiSelectControl` 只读回显按数组契约取选中项，字符串一律视为未选 → 每行三个未勾选复选框。主表单正确是因为 `BusinessFormReadonly` 先过 `normalizeFormFieldValue`，明细表单元格没有走这一步。**该问题 1.0.0 之前即存在**（明细表只读回显为 0.2.x BF20261013 引入，归一口径一直未覆盖子表单元格），按评审要求在本版修掉。
- **修复**：`TableControl` 新增 `cellValue()`，单元格值按子字段类型先过 `normalizeFormFieldValue`（多选/多选字典/多人员/部门/附件的 JSON 与逗号串归一为数组；日期/文本不受影响）。三处只读视图（表单详情/任务详情/我发起的）共用该组件，一处修复全覆盖。单选与下拉一并核查：`DictControl` 只读下拉用字符串 code 直接回显标签、radio 用 `String(raw)`，均正常，无需改动；多选 DICT（`multiple`）与多选多选同样受益于本次归一。
- **证据（三处页面明细表「标签」列）**：`u3_form_detail_table.png`（19:41:47）、`u3_task_detail_table.png`（19:41:52）、`u3_my_instance_table.png`（19:41:58）。三处一致：每行显示红色（未勾选）、蓝色（勾选）、绿色（勾选），即实际值「蓝色、绿色」按勾选状态回显；脚本另断言选中/未选集合为 `selected=[✓ 蓝色,✓ 绿色] unchecked=[红色]`。
- **单测**：`TableControl.spec.ts` 新增用例：只读多选单元格传 JSON 字符串时按实际选中项回显（选中 `✓ 蓝色/✓ 绿色`、未选白色），1/1 通过。

## B 门禁

- Server 受影响模块：`sw-biz-form-biz` **280 run / 0 failure / 0 error / 0 skipped**；`sw-bpm-process` **528 run / 0 failure / 0 error / 0 skipped，BUILD SUCCESS**。其中 `FormPrintPdfServiceTest` 新增 U2 日期格式用例（datetime 到分、缺省只到日）3/3，`FormDetailTableExportServiceTest` 更新断言（缺省日期 `2026-11-11`、datetime `2026-11-11 03:04`）2/2。
- Web 四项：`pnpm typecheck` **0 错**；`pnpm lint` **0 错**（55 条为既有取证脚本 prettier 警告）；`pnpm test` **2060 passed / 3 skipped**（新增 PrintSheet 3 条、TableControl 1 条）；`pnpm build` 通过（4.80s）。
- 未重跑多库、未重跑 Server 全量（按 `planning-review-100-03.md` §1 要求）。

## C 环境与数据

- 克隆库 `smart_workflow_100`（34 行 Flyway / 1.0.0）不变；本次用当前源码重建 jar（19:35）并重启 Server 18093（19:37:23 就绪，启动参数与上轮一致，带本机 `SW_CIPHER_KEY`）；Web 5275 为 Vite dev 直接服务最新源码。证据全部生成于 19:41—19:42，晚于重启与两仓提交内容。
- 说明：本机会话丢失了上轮设置的 admin 口令环境变量，已把克隆库 `smart_workflow_100` 的 admin 口令单行重置为仓库种子迁移 `R__0.1.10_admin_password.sql` 的既定口径（该迁移幂等可重复；明文见仓库种子注释，不写入本回执）。R1/R2/R3 记录、实例与日志数据未动。
- 未触碰用户 8080/5173 服务、`smart_workflow_f1v4b`、`smart_workflow_030`；未删除/重建演示服务器、数据库和容器，未清数据；未强推、未改历史、未移动 tag。证据目录不入 Git；`u1_api_probe.mjs`/`server-18093-restart.log` 为过程产物，留在 gitignore 目录。

## D 提交

- Server `feature/1.0.0`：`9fe3f11c`（PDF/Excel 日期按字段 format + 两处测试；已推送，origin 同 hash）。
- Web `feature/1.0.0`：`3c5b5ec`（PrintSheet 时区口径 + 单测、TableControl 单元格归一 + 单测、U1—U3 取证脚本；已推送，origin 同 hash）。
- 工作区 `develop-sw`：本回执 + memory 同步 + 两仓子指针（已推送；具体提交以 Git 回读为准）。
