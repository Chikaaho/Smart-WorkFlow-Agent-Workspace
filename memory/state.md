# 当前状态摘要

2026-11-24 晚｜规划｜120-16 部分通过（`planning-review-120-05.md`）：T1、T3、T4① 锁定；T2 截图早于修复提交 `34c43e98`，要重拍；T4② 抄送详情对有数据的实例显示「无表单数据 / 暂无审批历史」，用的又是 SQL 夹具，没过。入口 `planning-execution-prompt-120-05.md`（rev 6），回执 `execution-120-17`。

2026-11-24｜规划｜**1.2.0 阶段 3 第 3 轮基本通过**（`planning-review-120-04.md`）。锁定 S1、X4、X1-timeline、X3、E1-1、E1-3、E1-3T（按 §7.1 自查改用 DB 时间戳）、E1-4、E1-6、E1-7 计数、E4-2；E4-1 除 T3 外锁定。剩 4 个 S 级尾巴：T1 CONTINUE 说明把 TIMEOUT/OUTPUT_MISSING 写成 status 取值、条件节点变量文字截断；T2 运行中执行来源显示「直接调用」；T3 意见详情弹窗 ISO 时间、服务端 PDF 未实测；T4 ACTION# 动作类型清单、抄送页签实测。T1~T4 加最终提交门禁后进阶段 4。登记 P79（流转记录时间列是到达时间）。入口 `planning-execution-prompt-120-04.md`（rev 5），回执 `execution-120-16`，七阶段 2/1/4。

2026-11-23｜规划｜第 2 轮部分通过（`planning-review-120-03.md`）。`06f1c410` 把 iso120 私钥和 dev 配置推到公开仓库，Owner 裁定本机文件无价值，不轮换、不改写历史，只取消跟踪（S1）。Owner 登记 P76/P77 并入为 E4；规划登记 P78。

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
