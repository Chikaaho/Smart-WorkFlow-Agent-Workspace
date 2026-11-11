# 当前状态摘要

2026-11-11｜规划｜1.0.0 第三轮验收未通过，下发 U1—U3。

## 当前任务

**1.0.0 阶段 3（XL）**：`planning-review-100-03.md`——S1—S5 通过（S1 版本定位对）；新返修 U1 浏览器打印时间早 8 小时、U2 日期格式四处按字段类型统一、U3 页面明细表只读多选显示实际选中。交 `execution-100-04.md`；阶段 4 用 GitHub CI run 号作最终门禁证据。
S1—S5 实现细节见 `execution-100-03.md` §A。

## 本轮代码

- Server `feature/1.0.0` `3108a858`：`FormPrintController` 打印上下文、`FormPrintPdfService` 数值小数位、`FormDetailTableExportService` 数值格式、`AuditOperationFilter` UUID 对象、`CommandQueueIntegrationTest` 稳定性重写。
- Web `feature/1.0.0` `8f17c9a`：`PrintSheet` 重写为纯文本并按版本定位重载、`getPrintContext`、`resolvePartyNames`、`BusinessDetailDialog` 实例上下文、schema/adapter 小数位与日期 format 透传、S1—S5 取证脚本。
- 工作区：`execution-100-03.md` + 子仓指针 + 本 memory 同步（已推送 develop-sw）。

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
