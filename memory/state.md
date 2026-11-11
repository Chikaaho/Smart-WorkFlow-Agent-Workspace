# 当前状态摘要

2026-11-11｜执行｜1.0.0 阶段 3 返修+补证已交 `execution-100-02.md`，等第二轮验收。

## 当前任务

**1.0.0 阶段 3（返修+补证）已交**：`product/v1.0.0-release/receipts/execution-100-02.md`（R1—R6 全部完成、B1—B9 全部补证）。隔离环境（Server 18093 / Web 5275 / 克隆库 `smart_workflow_100` 34 行）已重启，供 Planner 复核。等验收 → 阶段 4 合并 → 5 发版 → 6 部署同步 → 7 终审。

## 本轮代码

- Server `feature/1.0.0` `7bde20b2`：F2-6 明细表导出（服务端 + 三入口）、审计日志口径（只记改动类/中文动作模块对象/可读失败原因/二进制响应判成功）、登录日志中文化、用户分页关键字 PG 修复、PDF 显示值与意见回退、publishNewVersion 允许未变化明细表、SQL Server 1.0.0 菜单种子移到可重复脚本、审计清理防死循环。
- Web `feature/1.0.0` `4e93037`：明细表导出按钮（TableControl 三处复用）、PrintSheet 打印专用版面（按 printTemplate 过滤，Teleport 到 body）、日志时间/动作/模块显示、R6 超管导入租户前置拦截、脚本凭据改环境变量。
- 工作区：本回执 + memory 同步。

## 门禁

- Server：全模块 + Bootstrap 合计 2497 run / 1 known flake / 0 error / 45 skipped；Bootstrap 343/0/0/45 BUILD SUCCESS。唯一失败 `CommandQueueIntegrationTest.p0PrioritizedWhileNormalBacklogged` 为既有偶发（前批次双侧对照；本批复跑仍偶发）。
- Web：typecheck 0、lint 0、test 2056 passed/3 skipped、build 通过。
- 多库：MySQL 5.7/8.0、MariaDB、Oracle 21c、SQL Server 2022、openGauss 5.0 冒烟 1/1；DM8/Kingbase 无镜像，九方言静态核对 + 既有对等测试。
- 证据 60+ 份在 `receipts/evidence/`（gitignore），含 B2 设计器、B3 三处打印预览、B4 PDF 每页 PNG、B5 字段隐藏四面对照、B6 旧版本/未定位页脚、B7 三入口导出、B8 日志/租户/清理、B9 IoT。

## 基线

功能 55（P27/P33/P40 预登记）；Server 1.0.0-SNAPSHOT、Web 1.0.0；Flyway V1.0.0（31 条 + SQL Server 32 条口径）。Owner 定版本 1.0.0；P69 已关闭。

## 教训

- 过滤器 Bean 用 ObjectProvider 惰性解析，避免 Servlet onRefresh 阶段拖入 MyBatis 初始化。
- `mvn -pl` 无 `-am` 会用本地仓旧依赖；全量门禁用根 `mvn -fae test`，Bootstrap 需先 `install -DskipTests` 再单模块跑。
- SQL Server 种子在 R__ 可重复脚本，版本化迁移中按父菜单/角色插入种子会因执行顺序被静默跳过——种子/授权放可重复脚本。
- 明细表版本发布：TABLE 结构未变化应允许（打印模板随版本化），新增/变更才拒绝。
- 审计过滤器的「成功」判定必须区分 JSON 与二进制下载响应；查询类 POST 不记。
- 并发/时序测试断言要与 TTL 语义一致（不得新增键，而非集合相等）；跨轮文件库测试需清残留。
- 浏览器打印版面用 Teleport 到 body + `#app` 整体隐藏，才能让 printTemplate 真正生效。
- `Flyway` 升级存量库前先备份；UAT dump 恢复库仅用于隔离验收。
