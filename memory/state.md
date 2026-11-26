# 当前状态摘要

2026-11-26｜规划｜**1.2.0 已发布并部署**（tag `1.2.0`：Server `0fb94fad` Release `457783510`，Web `c978312` Release `457827301`，均 Latest；演示环境 Flyway 36 行，功能数裁定 60）。阶段 6 部分通过（`planning-review-120-07.md`）：**P83** 表单设计器把 Graph 雪花 ID 当 number 四舍五入，界面配不通 E1-6 表单动作，修复版本待 Owner 裁定；另补 X1 普通流程发布截图、knowledge/session-handoff.md 改回 CRLF。执行方违反「磁盘不足 3G 就停」的停止条件（压日志后继续），事后接受。核销 P41/P74/P76/P77，P67 待 P83。入口 `planning-execution-prompt-120-07.md`（rev 8），回执 `execution-120-20`，七阶段 5/1/1。

2026-11-25｜规划｜**1.2.0 阶段 3 验收通过**（`planning-review-120-06.md`，共 6 轮复核 120-01~06），进入阶段 4~7，入口 `planning-execution-prompt-120-06.md`（rev 7），回执 `execution-120-18` 起，七阶段 3/0/4。要点：X2 根因 MyBatis 一级缓存；iso120 私钥误推公开仓库，Owner 裁定只取消跟踪；P76/P77 并入为 E4。

2026-11-21｜规划｜1.2.0 阶段 3 第 1 轮部分通过（`planning-review-120-02.md`）：E2 锁定 4 项；33159e28 部署绕过不接受；iso120 用本机 5432 的 `sw_iso120`（接受，清理时只删这个库）；不要登录本机 MySQL。

2026-11-20｜规划｜**1.1.3 COMPLETED**（七阶段 7/0/0，终审 `product/v1.1.3-patch/receipts/planning-review-113-05.md`）。P72/P73 核销；登录私钥已迁为文件；apt 事故已恢复并 apt-mark 防护；iso113 已清理。

2026-11-19｜执行｜两仓代码规范与千行文件治理批次完成（非功能轨道，功能数 58 不变），口径见 `knowledge/known-issues.md` 2026-11-19 条。

2026-11-15｜规划｜**1.1.2 COMPLETED**（L，不计功能数，正式功能数仍为 58），七阶段 7/0/0。终审 `product/v1.1.2-patch/receipts/planning-review-112-06.md`，账本 rev 5 FINISH；方向文件已移到 `passed/`。其后候选：P67（L）、P68（XL）。

## 线上

Server tag `1.2.0`=`0fb94fad`（Release `457783510`，Latest）；Web tag `1.2.0`=`c978312`（Release `457827301`，Latest）。UAT 跑 Server 1.2.0 + Web 1.2.0（入口 `index-Cu2bpF9U.js`），Flyway 36 行，备份 `*_pre120`。上一版 1.1.3：Server `54b2657b`、Web `05b9739`。

## 边界与教训

- 未强推/未改历史/未动其他 tag 与 Release；演示环境未删未清。
- 回执须附分支 CI run 号，不能只报本机门禁；发版指令外的版本号先报告。
- SQL 夹具绕过的设计器路径，上线前必须走一次界面（1.2.0 P83）。
- 停止条件不由执行方自行判断，遇到先报告。
- 截图描述必须照画面写；展示图按画面边缘判断，不按卡片数量判断。
- 本机脚本写文件会把 LF 改成 CRLF，提交前核 `git ls-files --eol`（需求池本身是 CRLF）。
- curl `--data-binary @file` 文件缺失会发空请求体；后台任务一律用绝对路径。
- UAT 健康路径 `/api/actuator/health`；超管导入须显式 `tenantId`。
- 部署按运维手册 `docs/ops/production-ops.md`，连接用 §2 的 `ssh_personal.sh`/`scp_personal.sh`；规划写阶段 6 交接时点名手册。
