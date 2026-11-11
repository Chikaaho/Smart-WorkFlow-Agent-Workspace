# 交接

2026-11-11｜规划｜1.0.0 第二轮验收大部分通过（`planning-review-100-02.md`），执行方修 S1—S5 后交 `execution-100-03.md`。

## 当前

**1.0.0 阶段 3（XL）**：两仓 `feature/1.0.0`——Server `7bde20b2`、Web `4e93037`；工作区 `develop-sw` 回执 `execution-100-02.md`（R1—R6 + B1—B9）。

- **隔离环境在跑（供 Planner 复核）**：Server 18093（local profile + 固定验证码，最新 jar）、Web 5275、PG 库 `smart_workflow_100`（34 行 V1.0.0）。测试账号口令在本机环境变量/克隆库，不入 Git。
- **返修**：F2-6 明细表导出（三入口、显示值、字段隐藏、公式注入、文件名）、日志时间格式、操作日志只记改动类+中文动作/模块/对象+可读失败原因、登录日志中文化、两条失败记录根因（PG 参数推断 500 / 二进制导出误判）修复、超管导入租户前置拦截。
- **补证**：B1 六库实跑（MySQL 5.7/8.0、MariaDB、Oracle、SQL Server、openGauss；DM8/Kingbase 静态）；B2 设计器打印模板；B3 三处打印预览；B4 PDF 每页 PNG + 跨页表头；B5 字段隐藏页面/打印/PDF/Excel 四面对照；B6 旧版本 v2 与未定位版本页脚；B7 三入口 6 份导出一致；B8 三页签+租户隔离+清理有界+异常字段；B9 IoT 发起人系统（IoT）。
- **测试中修复的产品缺陷**：SQL Server 首装菜单/授权种子顺序、带明细表表单无法发布新版本、浏览器打印不消费 printTemplate、PDF 原始 id/JSON、PDF 普通意见丢失、审计二进制误判、PG 关键字 500、清理零删除死循环。
- **门禁**：Server 2497 run / 1 known flake（CommandQueue p0，既有偶发）/ 45 skipped；Bootstrap 343/0/0/45；Web typecheck/lint/test 2056/3/build 全绿。
- **多库容器**：`swmdb-mysql57/80`、`swmdb-mariadb`、`swmdb-oracle21`、`swmdb-sqlserver`、`swmdb-opengauss` 在跑；仅本机验收用。

## 保留与保护

不变：不改写历史、不强推；不碰 Web `vite.config.ts` 未提交改动、`feature/ui-figma-align-20261027`、Server `feature/p62-perf-bounded-20261011`；不碰用户 8080/5173、`smart_workflow_f1v4b`、`smart_workflow_030`；保留 `.runtime-*`、凭据密文与 Server 隔离 worktree。新增隔离项（`smart_workflow_100`、18093/5275、sw100 账号、六库容器）在验收后清理；UAT 仅 pg_dump 只读。

## 更早历史

0.4.1/0.3.8 PUBLISHED；0.4.0/P66 COMPLETED。
