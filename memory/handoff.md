# 交接

2026-11-12｜规划｜1.0.0 COMPLETED（`planning-review-100-05.md`）。执行方按其 §3-2 清理本机隔离环境（含克隆库与六库容器），确认后写入 memory。

## 当前

**1.0.0 已发布并部署演示环境**：Server main `aa7c86e5`（Release `441827517`，jar 242,697,784 B sha256 `a8dc16b6…`）；Web main `a85aa8e2`（Release `441848348`，zip 6,221,796 B sha256 `cc94fa30…`）；两仓 Latest=1.0.0。CI run：Server develop `43035313977`/main `43035353166`（attempt 2）、Web feature `43036986258`/develop `43037004490`/main `43037042393` 全 success。

- UAT：Server `build.version=1.0.0`、health UP、Flyway 34 行/max 1.0.0；Web `index-BCCrQSgQ.js` 四路 200。F1—F4 各复测一组（明细见 state.md 与回执）。
- 知识/需求池已同步：version.json PUBLISHED、CHANGELOG 1.0.0、索引三行核销（P27/P33/P40，第 53—55 个）、需求池标记。

## 待办（下一回合确认）

- **清理确认（2026-11-12）**：本机隔离环境已清理——18093/5275 端口无监听（进程上回合已按精确 PID 停止）；克隆库 `smart_workflow_100` 已在主 `postgres` 容器内 DROP（`smart_workflow`/`f1v4b`/`030` 等其余库回读完好）；6 个测试库容器 `swmdb-mysql57/mysql80/mariadb/oracle21/sqlserver/opengauss` 已 `docker rm`（含退出的 mariadb），仅存 `postgres`/`redis`/`mosquitto-024`（用户与演示资产，未触碰）。

## 保留与保护

不变：不改写历史、不强推；既有 tag/Release 未动（新增 1.0.0 均为新对象）；不碰 Web `vite.config.ts` 未提交改动、`feature/ui-figma-align-20261027`、Server `feature/p62-perf-bounded-20261011`；不碰用户 8080/5173、`smart_workflow_f1v4b`、`smart_workflow_030`；保留 `.runtime-*`、凭据密文与 Server 隔离 worktree。演示环境测试账号 uat100_a/b/c 与 uat100_role/uat100_post 已停用不删；`.runtime-030/uat-conn-secret.txt` 等凭据文件未动。

## 更早历史

0.4.1/0.3.8 PUBLISHED；0.4.0/P66 COMPLETED；1.0.0 阶段 3 四轮验收通过（U1—U3 返修）。
