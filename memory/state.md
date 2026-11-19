# 当前状态摘要

2026-11-19｜执行｜**两仓代码规范与千行文件治理批次完成**（非功能轨道，正式功能数 58 不变，线上 1.1.2 与 tag/Release 不动）。develop 快进：Server 8 笔（终 `b1b42627`）、Web 5 笔（终 `e75726d`）、父仓 gitlink 5 笔（终 `513c26d8`）。千行文件清零（最大 ProcessDesigner.vue 1045 行）；sw-biz-system 233 / sw-basic-iot 97 存量测试从红转绿；p3c 官方规则集真信号清零（rollbackFor 115、Pattern 2、equals 11），误报与仓约定分歧口径登记于 `knowledge/known-issues.md` 2026-11-19 条。遗留挂起：i18n views 覆盖（产品级）、NodeFunctionService 线程池有界化（负载论证后）。

2026-11-15｜规划｜**1.1.2 COMPLETED**（L，不计功能数，正式功能数仍为 58），七阶段 7/0/0。终审 `product/v1.1.2-patch/receipts/planning-review-112-06.md`，账本 rev 5 FINISH；方向文件已移到 `passed/`。**没有活动功能**，下一步等 Owner 选题。候选：P72 和 P73 合成一个补丁（建议），P67（L）、P68（XL）。

## 线上

Server tag `1.1.2`=`c3724e52`（Release `445377854`，Latest）；Web tag `1.1.2`=`abfe1339`（Release `445380514`，Latest）。UAT 跑 Server 1.1.2 + Web 1.1.2（入口 `index-DsUInUfT.js`），Flyway 35 行，备份 `*_pre112`。README 展示图 `161fd589…` 已三仓同步，五张卡完整。

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
