# execution-100-03：阶段 3 打印返修 S1—S5

接 `planning-review-100-02.md` §3（S1—S5）。在隔离环境（Server 18093 / Web 5275 / 克隆库 `smart_workflow_100`）完成五项返修并重拍证据；按要求未重跑多库。测试账号与口令不入 Git 与回执。

## A 返修

### S1 浏览器打印历史版本（F2-5）

- 服务端新增 `GET /workflow/print/context`（`FormPrintController`）：入参 `formKey`、`recordId`、可选 `processInstanceId`，调用与 PDF 完全相同的 `FormPrintFacade.recordDetail(formKey, recordId, instance.createTime)`，返回实际用于打印的定义 JSON、版本号与 `versionPinned`；实例存在时先做实例可见性校验，记录读取仍走原权限/字段隐藏链路。
- 前端 `PrintSheet` 改为只消费该上下文：字段、明细表、`printTemplate`（抬头/页脚/是否含审批历史）都按服务端定位到的定义渲染；版本脚注与 PDF 同一文案（`表单版本 vN（提交时版本）` / `未定位到提交时版本，按当前版本 vN 打印`）。
- 根因：`PrintSheet` 首次挂载时表单详情尚未拿到流程关系，`processInstanceId` 为空，先按当前 v5 渲染；关系异步返回后实例 id 已传到组件，但 `watch` 只监听 `formKey/recordId`，没有触发重载。已将 `processInstanceId` 纳入 watch，异步补齐后重新取上下文并重绘。
- 定位结果核对（隔离环境实测）：
  - 不带实例：`formVersion=5`、`versionPinned=false`、含 `printTemplate`（抬头「华云科技 · 1.0.0 打印验收」）；
  - R1 实例 `cb6a8763-…`：`formVersion=2`、`versionPinned=true`、无 `printTemplate`（v2 未配置抬头）。
- 证据（均为 2026-11-11 16:00 生成，晚于最后一次产品代码改动）：
  - `s1_r1_form_detail_print.png`（16:00:08）：表单详情入口，标题「1.0.0 打印验收表单」、无「华云科技」抬头、字段为 v2 全集（含「内部备注」），页脚「表单版本 v2（提交时版本）」。
  - `s1_r1_task_detail_print.png`（16:00:13）、`s1_r1_my_instance_print.png`（16:00:19）：任务详情 / 我发起的两个入口缩略对照，同样为 v2 版面、无抬头、页脚同文案；合并缩略图 `s1_r1_three_entries_thumbnail.png`。
  - `s1_r1_form_detail.pdf`（16:00:09，3 页）与 `s1_r1_old_v2.pdf`（16:00:20，3 页）：同一 v2 定义，逐页内容一致；`s1_r1_form_detail_page_1..3.png`（16:01 渲染）逐页对照，合并对照图 `s1_r1_print_vs_pdf.png`。
  - R2 未定位版本：`s1_r2_unpinned_print.png`（16:00:26）与 `s1_r2_unpinned.pdf`（16:00:27）/`s1_r2_unpinned_page_1.png`，页脚「未定位到提交时版本，按当前版本 v5 打印」，抬头/页脚为当前模板。

### S2 数值显示一致（打印、PDF、Excel）

- PDF：`FormPrintPdfService.displayValue` 增加 `NUMBER`/`FORMULA` 分支：读取字段 `decimals`/`precision`，有配置按配置定小数位（`RoundingMode.HALF_UP`），未配置时 `BigDecimal.stripTrailingZeros().toPlainString()`（整数输出 `1`、`1000`），不再出现 `1.000000`。
- Web 打印：`FormSchemaField`/`TableSubField` 与 `form-designer` 防腐层透传 `decimals`/`precision`，`PrintSheet` 按字段配置格式化数值；未配置时去尾随 0。
- Excel：`FormDetailTableExportService` 读子字段 `decimals`/`precision`，数值仍写数值单元格（可求和），并设置 `number_format`：有配置按配置小数位，无配置用 `0.############`（显示为 `1`、`1000`，不出现 `1.0`）。
- 证据（同一条 R3 记录、同一行「新版本部件-01」）：
  - 页面 `s2_r3_page.png`（16:00:33）：数量 `1`、金额 `1000`；
  - 浏览器打印 `s2_r3_print.png`（16:00:33）：`1`、`1000`；
  - PDF 第 1 页 `s2_r3_page_1.png`（PDF 16:00:34，页面 16:01 渲染）：`1`、`1000`，文本中无 `1.000000`/`1000.000000`；
  - Excel 内容 `s2_r3_excel_content.png`（16:01:22，源文件 `s2_r3_itemsA.xlsx` 16:00:35）：B2/C2 为数值单元格、`number_format=0.############`，显示 `1`、`1000`。

### S3 浏览器打印纯文本版面

- `PrintSheet` 重写为纯文本版面：人员/部门写名称，字典/选项写标签，多选以顿号分隔，日期按字段 `format`（`datetime` 带时分，缺省仅日期），数值去尾随 0；明细表逐格输出显示值，不再渲染表单控件。抬头、页脚、审批历史按 `printTemplate` 生效。
- 证据：`s2_r3_print.png`（16:00:33）中无输入框、部门图标、下拉箭头、复选框；采购负责人「系统管理员」、标签「蓝色、绿色」、到货时间按字段配置显示日期。脚本同时断言打印版面内 `input/.el-select/.el-checkbox` 数量为 0。

### S4 B4 任务详情 PDF 重拍

- 用当前运行 jar 重新生成任务详情 PDF：`s4_task_detail.pdf`（16:00:38，2 页），逐页渲染 `s4_task_detail_page_1.png`、`s4_task_detail_page_2.png`（16:01:19）。
- 页面内容已是修复后显示值：采购负责人「系统管理员」、标签「蓝色、绿色」、数量 `1`、金额 `1000`；页脚「内部资料 · 请勿外传 / 表单版本 v3（提交时版本）/ 第 N/2 页」。
- 时间核对：最后一次服务端源码改动 15:09:49（`FormPrintPdfService` 数值小数位），jar 构建 15:10:56，Server 进程启动 15:13:52（15:14:11 完成启动）；本批所有 PDF 生成时间 16:00:09—16:00:38，页面截图 16:01，均晚于最后一次服务端改动与两仓提交（Server `3108a858` / Web `8f17c9a`）。

### S5 操作日志对象

- `AuditOperationFilter.PATH_ID` 从「仅数字 id」扩为「UUID 或数字 id」，对象名取不到请求体名称时写「对象类型 + id」，不再只剩类型；请求体名称优先逻辑不变。
- 实测：14:43:54、14:52:09、15:15:07、16:00:39 四次表单定义修改（`POST /form/def/{uuid}/config`）的对象均为「表单定义 27b5ab65-6bcc-442d-b433-fa7adff61bc0」；`s5_log_form_def_target.png`（16:00:44）可见 16:00:39 行。
- `AuditOperationFilterTest` 新增 UUID 回退用例（7/7），既有数字 id 用例「用户 12」继续通过，覆盖其他模块同一回退逻辑。克隆库 14:43 之后无其他模块新增的对象只剩类型的记录；11:25/12:06 的历史行是修复前数据，保留不改写。

## B 门禁

- Server：`mvn -fae test`（全模块）**2498 run / 0 failure / 0 error / 45 skipped，BUILD SUCCESS（25:44）**；其中 Bootstrap 343/0/0/45。日志 `s3_server-full-test.log`。该次全量包含 `CommandQueueIntegrationTest` 7/7（含 `p0PrioritizedWhileNormalBacklogged`），满足 `planning-review-100-02.md` §2 的合并前门禁条件。
- `CommandQueueIntegrationTest`：重写 `p0PrioritizedWhileNormalBacklogged` 的固定 key 假设。原因：领取受租户公平/准入策略影响，`claimDue` 返回的具体两条不保证固定；改为以实际 `occupied` 集合与 NORMAL 的 PENDING 计数断言（被占用 2 条、仍 PENDING 3 条；P0 轮询后不消费 NORMAL；其余 NORMAL 继续推进），保留 P0 先于滞留 NORMAL 的时间线断言。该类 7/7 通过，全量复跑无偶发。
- Web：`pnpm typecheck` 0 错；`pnpm lint` 0 错（55 条为既有取证脚本的 prettier 警告）；`pnpm test` 2056 passed / 3 skipped；`pnpm build` 通过。
- 未重跑多库（按 `planning-review-100-02.md` §1 要求）。

## C 环境与数据

- 克隆库 `smart_workflow_100`（34 行 Flyway / 1.0.0），测试数据仅存在于此；Server 18093（jar 15:10:56；PDF 取证进程 15:14:11 启动，全量测试后 15:57:37 重启供复核）、Web 5275（`VITE_PROXY_TARGET=http://localhost:18093`）。
- 未触碰用户 8080/5173 服务、`smart_workflow_f1v4b`、`smart_workflow_030`；未删除/重建演示服务器、数据库和容器，未清数据；未强推、未改历史、未移动 tag。
- 证据目录 `product/v1.0.0-release/receipts/evidence/` 不入 Git；口令与初始密码不写进回执和 Git。

## D 提交

- Server `feature/1.0.0`：`3108a858`（打印上下文版本定位 + 数值小数位 + 日志对象 UUID；已推送，origin 同 hash）。
- Web `feature/1.0.0`：`8f17c9a`（PrintSheet 纯文本/版本重载 + 打印上下文 API + 数值小数位透传 + 取证脚本；已推送，origin 同 hash）。
- 工作区 `develop-sw`：本回执 + memory/state、memory/handoff 同步 + 两仓子指针（已推送；具体提交以 Git 回读为准）。
