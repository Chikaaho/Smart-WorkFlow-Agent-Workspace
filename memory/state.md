# 当前状态摘要

2026-11-11｜执行｜1.0.0 阶段 3 打印返修 S1—S5 完成，待 Planner 复核。

## 当前任务

**1.0.0 阶段 3（XL）**：按 `planning-review-100-02.md` §3 完成 S1—S5，回执 `execution-100-03.md`。合并门禁条件已满足：包含 `CommandQueueIntegrationTest` 的 Server 全量一次全绿。

- S1 浏览器打印历史版本：新增 `GET /workflow/print/context`，与 PDF 共用 `FormPrintFacade.recordDetail(..., instance.createTime)` 版本定位；`PrintSheet` 按服务端定义渲染字段/明细表/`printTemplate`，并把 `processInstanceId` 纳入 watch（修复异步补齐后不重载的根因）。
- S2 数值：PDF `numberText` 支持字段 `decimals`/`precision`，未配置去尾随 0；Excel 写数值单元格并设 `0.############` 或配置小数位；Web 契约/防腐层透传小数位。页面/打印/PDF/Excel 同一行 `1`、`1000` 一致。
- S3 浏览器打印纯文本：人员/部门名称、选项标签、多选顿号、日期按字段格式；版面内 input/select/checkbox 数量 0。
- S4 任务详情 PDF 用当前 jar 重生成（2 页，15:15:05），逐页 PNG 重拍；所有 PDF/截图晚于最后服务端改动。
- S5 审计对象：`PATH_ID` 支持 UUID/数字 id，表单定义修改对象为「表单定义 {uuid}」；新增测试覆盖 UUID 与数字 id 回退。

## 本轮代码

- Server `feature/1.0.0` `3108a858`：`FormPrintController` 打印上下文、`FormPrintPdfService` 数值小数位、`FormDetailTableExportService` 数值格式、`AuditOperationFilter` UUID 对象、`CommandQueueIntegrationTest` 稳定性重写。
- Web `feature/1.0.0` `8f17c9a`：`PrintSheet` 重写为纯文本并按版本定位重载、`getPrintContext`、`resolvePartyNames`、`BusinessDetailDialog` 实例上下文、schema/adapter 小数位与日期 format 透传、S1—S5 取证脚本。
- 工作区：`execution-100-03.md` + 子仓指针（本条提交后回填）。

## 门禁

- Server：根 `mvn -fae test` **2498 run / 0 failure / 0 error / 45 skipped，BUILD SUCCESS（25:44）**；Bootstrap 343/0/0/45；`CommandQueueIntegrationTest` 7/7（含 p0）。
- Web：`pnpm typecheck` 0、`pnpm lint` 0 错（55 条既有取证脚本 prettier 警告）、`pnpm test` 2056 passed/3 skipped、`pnpm build` 通过。提交后复跑全部通过。
- 未重跑多库（评审明确不需要）。

## 环境与边界

- 克隆库 `smart_workflow_100`（34 行 Flyway/1.0.0）；Server 18093（jar 15:10:56，带本机 `SW_CIPHER_KEY` 启动）、Web 5275；测试数据/账号仅隔离环境，口令不入 Git。
- 未触碰用户 8080/5173、`smart_workflow_f1v4b`、`smart_workflow_030`；未删除/重建演示服务/库/容器，未清数据；未强推/改历史/移动 tag。
- 证据目录 gitignore；`execution-100-03.md` 记录 S1—S5 截图/PDF 的时间戳与对照。

## 教训

- 打印版本定位必须由服务端统一返回；前端 props 异步补齐时 watch 要覆盖该 prop。
- 数值显示要同时处理 `decimals`/`precision`，Excel 数值单元格 + number_format，PDF/Web 去尾随 0。
- 领取/调度测试不要假设固定 key 顺序，用实际 occupied 集合与状态计数断言。
- 全量测试前确认没有残留 Maven/surefire 进程；TaskStop 只杀包装 shell，需按命令行清理 java 测试进程。
