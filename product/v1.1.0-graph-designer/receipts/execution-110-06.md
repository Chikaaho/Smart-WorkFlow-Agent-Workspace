# execution-110-06：1.1.0 阶段 7 收尾（Z1—Z3 + 隔离环境清理）

方向 `product/v1.1.0-graph-designer/ready/direction-v1.1.0.md`（XL）｜执行｜2026-11-13｜依据 `planning-review-110-06.md` §3，完成 Z1—Z3 与隔离环境清理；另按 Owner 指示记录 Web 1.1.1 追认。

## 1. Z1 展示图重拍（三仓同步，CI 全绿）

- UAT 打开 G1 图（`UAT110-G1b-1794564806961`），以同元素（10 个：5 节点 + 5 边）新建干净命名图「智能巡检编排示例」（产品无改图名端点，故复制而非改名；原图保留）。
- 取景：缩放 **83%**（80%—100% 区间内）；画布平移到 **条件分支 / 知识检索 / 结束** 三个节点完整居中可见，节点文字清晰；采用「节点面板 + 画布」取景（835×671），不含半截工具栏按钮、不含属性面板；图名脱敏为「智能巡检编排示例」。
- 三仓 `docs/assets/readme/agent-graph.png` 同步：
  - Server：`8481fc55`（develop）→ `665aab76`（main），CI `43427622079` / `43427745463`；
  - Web：`a98d720`（develop）→ `b28bf83`（main），CI `43427648630` / `43427714331`；
  - Workspace：本批提交（`docs/assets/readme/agent-graph.png`）。
- 证据：`uat110-readme-canvas.png`（入选图）、`uat110-readme-full.png`（83% 全屏上下文）。

## 2. Z2 换行符归一（普通提交，不改写历史）

- `c30ea1dc` 因本机脚本以 CRLF 写入，把 `README.md`、`CHANGELOG.md`、`version.json`、`knowledge/feature-reconciliation-index.md` 从 LF 改为 CRLF（另含同批 `execution-110-05.md`）。已用 `fc604840` 以普通提交把这 5 个文件换行符统一回 LF，内容不变。
- 佐证（本机实测）：
  - `git diff fc604840^ fc604840 -w --stat` → **无输出（0 行）**，即忽略空白后零改动；`git show --stat fc604840` 显示 812/812（纯 EOL 翻转）；
  - `git ls-files --eol` → 5 个文件均为 `i/lf w/lf`（CHANGELOG.md / README.md / knowledge/feature-reconciliation-index.md / product/v1.1.0-graph-designer/receipts/execution-110-05.md / version.json）。

## 3. Z3 取消等待中的测试执行（产品功能）

- 目标：`2121178715751251970`（UAT110-G3 父图，WAITING_HUMAN）。
- 按产品契约用**受理号** `2121178715000471554` 调 `POST /agent/graph-execution-lifecycle/executions/{受理号}/cancel` → `200`，状态 **CANCELLED**；随后 GET 复核 `status=CANCELLED`，人工任务行随之关闭（PENDING→CANCELLED 由取消逻辑处理）。
- 证据：`uat110-z3-cancelled.png`（执行详情：执行编号 `#2121178715751251970`、受理号 `#2121178715000471554`、状态 CANCELLED、更新时间 `2026/11/13 20:37:51`）。
- **复测中发现的新缺陷**：用**执行编号**调 cancel 时接口 200 但静默无效（首次尝试即如此）——`cancel(executionId)` 仅用 `requireOwned` 查找受理行，后续 `cancelWaiting/cancelQueued/任务关闭` 仍用原始入参，结果执行 id 命中 0 行。已登记 **P71**（未排期，不在本轮发布），回执如实记录；本轮按契约以受理号完成 Z3。
- 其余测试数据照旧保留（未删除）。

## 4. P70 观察补充（不阻塞）

- 实例监控状态 `DISCARDED` 无中文映射（planner 已记）；执行详情状态标签 **`CANCELLED` 亦为英文原值**（ExecutionDetail 状态映射缺该键，Z3 截图可见），已补入 P70。
- `uat110-g1-midrun.png` 的「执行失败 耗时 0ms」**不是上一轮结果残留**：本次运行处于 RUNNING 时 `refreshExecution` 写入 `executeResult.success=false`，结果区按失败渲染（真实缺陷：运行中误显示失败/0ms），已并入 P70。该图（UAT110-G1b）当场只跑过一次；此前 18:07 的失败来自首张 G1 图（`UAT110-G1-1794564385010`）——END 未指定 `inputVar` 读取默认变量 `input` 而 `UNDEFINED_VARIABLE`，将 END 配置为 `inputVar=kb_out` 后该图后续运行成功（matching `uat110-g1-run.png`）。

## 5. 隔离环境清理清单

| 对象 | 处理 |
|---|---|
| `iso-pg5433`（PostgreSQL 17，隔离库） | 已删除（`docker rm -f`） |
| `v110-mysql8/mysql57/mariadb/oracle/sqlserver/opengauss` 六个方言容器 | 本机已不存在（在 V6 迁移证据轮结束后已清理，本轮 `docker ps -a` 复核 0 个） |
| 隔离 Server `127.0.0.1:18093` | 已停止（`netstat` 复核无监听） |
| 隔离 Vite `127.0.0.1:5275` | 已停止（`netstat` 复核无监听） |
| 用户环境 | 8080/5173、`smart_workflow`（5432）、`smart_workflow_f1v4b`、`smart_workflow_030`、用户容器（postgres/redis/mosquitto）全程未触碰 |
| 演示环境 UAT | 不删除、不清数据；仅 Z3 按产品功能取消一条测试执行 |

## 6. Web 1.1.1 追认（Owner 指示记录）

Owner 2026-11-13 明确「写进报告就行」——**追认 Web 1.1.1**（设计器事件序号字符串比较修复，实为真缺陷；合并链与 CI 完整、Release 为 Latest）。教训：今后发版指令以外的版本号，先停下报告再执行。

## 7. 状态与下一步

- Z1—Z3 完成，隔离环境清理完成；回执提交后等待 Planner 阶段 7 复核（1.1.0 是否结束）。
- 已知限制不变（子图超时不按父剩余时间、人工超时扫描单实例、DM8/KingbaseES 仅静态核对、处理人角色保存编码）。
