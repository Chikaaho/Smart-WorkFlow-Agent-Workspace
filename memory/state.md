# 当前状态摘要

2026-11-21｜规划｜**1.2.0（XL）阶段 2 已接受**（`planning-review-120-01.md`）：P67 Graph 执行器（流程服务节点 + 表单服务端动作 + 业务关联）、P41 日志等级、P74、I5 恢复。Server `329c1f89`/`f161c113`/`3411135b`/`92a04b27`/`6585a403`，Web `aa99cc8`/`6da6fd4`/`c3faf9a`/`120742c`（feature/1.2.0）。裁定：E1-5 用方案 A（发布时拒绝，子图递归），方案 B 登记为 P75；异常分支=CONTINUE+条件分流（面板要写明、变量可选）；来源新增 IOT，存量不回填；SQL Server 菜单种子放 R__1.2.0；计数 P67=59、P41=60。阶段 3 补两处：线程占用实测（3 个慢 Graph 并发时普通审批不卡，卡就加并发上限）；表单回填类型不符时拦截。入口 `planning-execution-prompt-120-01.md`，回执 `execution-120-04.md`，七阶段 2/1/4。尚未锁定任何验收项。

2026-11-20｜规划｜**1.1.3 COMPLETED**（七阶段 7/0/0，终审 `product/v1.1.3-patch/receipts/planning-review-113-05.md`）。P72/P73 核销；登录私钥已迁为文件；apt 事故已恢复并 apt-mark 防护；iso113 已清理。

2026-11-19｜执行｜两仓代码规范与千行文件治理批次完成（非功能轨道，功能数 58 不变），口径见 `knowledge/known-issues.md` 2026-11-19 条。

2026-11-15｜规划｜**1.1.2 COMPLETED**（L，不计功能数，正式功能数仍为 58），七阶段 7/0/0。终审 `product/v1.1.2-patch/receipts/planning-review-112-06.md`，账本 rev 5 FINISH；方向文件已移到 `passed/`。其后候选：P67（L）、P68（XL）。

## 线上

Server tag `1.1.3`=`54b2657b`（Release `451609872`，Latest）；Web tag `1.1.3`=`05b9739`（Release `451512760`，Latest）。UAT 跑 Server 1.1.3 + Web 1.1.3（入口 `index-ANXgpRi9.js`），Flyway 35 行，备份 `*_pre113`。README 展示图 `161fd589…` 已三仓同步，五张卡完整。

## 1.1.2 摘要（已结束）

- 范围：B1 按执行编号取消静默无效（P71）；B2—B5 显示小修（P70）；B6 展示图。返修：G1 取消时同步结果执行行，G2 待办残留，G3 已取消不显示耗时。P70、P71 已核销。
- 验收：阶段 3 共 3 轮（G1 两轮）。阶段 6 的 BLOCKED 被驳回，原因是运维手册不在必读链路里，管理员已在 `79bcc7cf` 补上。B6 第一次只拍到局部，返修后通过。
- 遗留：P72 超时恢复后旧执行行停在「等待人工」；P73 取消后节点轨迹仍显示「等待人工」。
- 隔离环境 iso112（18093/5275/5433/56379）由执行方清理，清理后在 memory 写一行确认。

## 边界与教训

- 未强推/未改历史/未动其他 tag 与 Release；演示环境未删未清。
- 回执须附分支 CI run 号，不能只报本机门禁；发版指令外的版本号先报告。
- 截图描述必须照画面写；展示图按画面边缘判断，不按卡片数量判断。
- 本机脚本写文件会把 LF 改成 CRLF，提交前核 `git ls-files --eol`（需求池本身是 CRLF）。
- curl `--data-binary @file` 文件缺失会发空请求体；后台任务一律用绝对路径。
- UAT 健康路径 `/api/actuator/health`；超管导入须显式 `tenantId`。
- 部署按运维手册 `docs/ops/production-ops.md`，连接用 §2 的 `ssh_personal.sh`/`scp_personal.sh`；规划写阶段 6 交接时点名手册。
