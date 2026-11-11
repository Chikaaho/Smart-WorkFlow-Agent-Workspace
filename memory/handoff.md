# 交接

2026-11-11｜执行｜1.0.0 阶段 3 打印返修 S1—S5 完成（`execution-100-03.md`），待 Planner 复核与阶段 4 合并裁决。

## 当前

**1.0.0 阶段 3（XL）**：两仓 `feature/1.0.0`——Server `3108a858`、Web `8f17c9a`；工作区 `develop-sw` 回执 `execution-100-03.md`（S1—S5）。两仓已推送，origin 同 hash。

- **合并门禁已满足**：Server 根 `mvn -fae test` 全模块 **2498 run / 0 failure / 0 error / 45 skipped，BUILD SUCCESS（25:44）**，包含 `CommandQueueIntegrationTest` 7/7（p0 用例通过）。Web 四项：typecheck 0、lint 0 错（55 条既有取证脚本 prettier 警告）、test 2056/3 skipped、build 通过；提交后复跑仍全绿。
- **S1**：`GET /workflow/print/context` 由服务端返回提交时版本定义；浏览器打印与 PDF 同一版本定位，R1（v2）三入口均无 v5 抬头、页脚「表单版本 v2（提交时版本）」；R2 页脚「未定位到提交时版本，按当前版本 v5 打印」。根因是 PrintSheet watch 未含 `processInstanceId`，已修。
- **S2/S3**：PDF/Excel/Web 数值按 `decimals`/`precision`，未配置去尾 0；Excel 为数值单元格；打印版面纯文本（无输入框/下拉/复选框），人员/部门/选项/多选/日期均为显示值。
- **S4**：当前 jar 重生成任务详情 PDF 2 页（15:15:05），逐页 PNG 重拍；所有 PDF/截图晚于最后服务端改动（源码 15:09:49 / jar 15:10:56 / 启动 15:14:11）。
- **S5**：审计对象 UUID 回退，表单定义修改显示「表单定义 {uuid}」；数字 id 回退用例继续通过。
- **未重跑多库**（评审明确不需要）；DM8/Kingbase 静态接受结论不变。

## 隔离环境（供 Planner 复核）

- 克隆库 `smart_workflow_100`（34 行 Flyway / 1.0.0）；Web 5275（`VITE_PROXY_TARGET=http://localhost:18093`）；Server 18093 已用当前 jar（15:10:56）+ 本机 `SW_CIPHER_KEY` 重启，15:57:37 启动完成，供复核。
- 测试数据：表单 `v100_print_demo`、R1/R2/R3 记录与实例、租户 9001 日志菜单授权、`yangfan` 为 R3 办理人；账号口令在本机环境变量/克隆库，不入 Git。
- 证据：`product/v1.0.0-release/receipts/evidence/`（gitignore），S1—S5 关键文件见回执 A 节时间戳；全量日志 `s3_server-full-test.log`。

## 保留与保护

不变：不改写历史、不强推；不碰 Web `vite.config.ts` 未提交改动、`feature/ui-figma-align-20261027`、Server `feature/p62-perf-bounded-20261011`；不碰用户 8080/5173、`smart_workflow_f1v4b`、`smart_workflow_030`；保留 `.runtime-*`、凭据密文与 Server 隔离 worktree。隔离项（`smart_workflow_100`、18093/5275、sw100 账号、六库容器）验收后清理；UAT 仅 pg_dump 只读。

## 更早历史

0.4.1/0.3.8 PUBLISHED；0.4.0/P66 COMPLETED。
