# 当前状态摘要

2026-11-25｜规划｜**1.2.0 阶段 3 验收通过**（`planning-review-120-06.md`，共 6 轮复核 120-01~06），进入阶段 4~7，入口 `planning-execution-prompt-120-06.md`（rev 7），回执 `execution-120-18` 起，七阶段 3/0/4。过程要点：X2 根因是 MyBatis 一级缓存；`06f1c410` 把 iso120 私钥推到公开仓库，Owner 裁定不轮换、只取消跟踪；P76/P77 由 Owner 并入为 E4；E1-3T 按 §7.1 自查改用 DB 证据；T2 截图早于修复提交被退回重拍；T4 抄送第一次用的 SQL 夹具写错了实例 ID，改用真实流程取证。登记 P78~P82。

2026-11-21｜规划｜1.2.0 阶段 3 第 1 轮部分通过（`planning-review-120-02.md`）：E2 锁定 4 项；33159e28 部署绕过不接受；iso120 用本机 5432 的 `sw_iso120`（接受，清理时只删这个库）；不要登录本机 MySQL。

2026-11-20｜规划｜**1.1.3 COMPLETED**（七阶段 7/0/0，终审 `product/v1.1.3-patch/receipts/planning-review-113-05.md`）。P72/P73 核销；登录私钥已迁为文件；apt 事故已恢复并 apt-mark 防护；iso113 已清理。

2026-11-19｜执行｜两仓代码规范与千行文件治理批次完成（非功能轨道，功能数 58 不变），口径见 `knowledge/known-issues.md` 2026-11-19 条。

2026-11-15｜规划｜**1.1.2 COMPLETED**（L，不计功能数，正式功能数仍为 58），七阶段 7/0/0。终审 `product/v1.1.2-patch/receipts/planning-review-112-06.md`，账本 rev 5 FINISH；方向文件已移到 `passed/`。其后候选：P67（L）、P68（XL）。

## 线上

Server tag `1.1.3`=`54b2657b`（Release `451609872`，Latest）；Web tag `1.1.3`=`05b9739`（Release `451512760`，Latest）。UAT 跑 Server 1.1.3 + Web 1.1.3（入口 `index-ANXgpRi9.js`），Flyway 35 行，备份 `*_pre113`。README 展示图 `161fd589…` 已三仓同步，五张卡完整。

## 1.1.2 摘要（已结束）

范围是 P70、P71，已核销；验收共 3 轮。遗留的 P72、P73 已由 1.1.3 核销。

## 边界与教训

- 未强推/未改历史/未动其他 tag 与 Release；演示环境未删未清。
- 回执须附分支 CI run 号，不能只报本机门禁；发版指令外的版本号先报告。
- 截图描述必须照画面写；展示图按画面边缘判断，不按卡片数量判断。
- 本机脚本写文件会把 LF 改成 CRLF，提交前核 `git ls-files --eol`（需求池本身是 CRLF）。
- curl `--data-binary @file` 文件缺失会发空请求体；后台任务一律用绝对路径。
- UAT 健康路径 `/api/actuator/health`；超管导入须显式 `tenantId`。
- 部署按运维手册 `docs/ops/production-ops.md`，连接用 §2 的 `ssh_personal.sh`/`scp_personal.sh`；规划写阶段 6 交接时点名手册。
