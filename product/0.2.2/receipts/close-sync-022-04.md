# 0.2.2 补充执行回执（第 4 次）：菜单断言返工与第 4 阶段合并

日期：2026-11-05。角色：Executor。依据：`planning-review-close-022-03.md`、`planning-execution-prompt-close-022-03.md`（revision 16，CONTINUE）、方向 `ready/direction-022-close-release.md`。

本回执覆盖执行提示第 1、2 步：C022-G2 菜单断言返工（§1）与第 4 阶段合并（§2）。

## 一、C022-G2 返工：恢复演练菜单断言

### 1. 改动

只改 `sw-bootstrap/src/test/java/com/sw/ck/bootstrap/ApplicationCenterRecoveryDrillPostgresTest.java` 的菜单断言，改为**三条同时校验**：

- 升级前的每个菜单 id 都还在：`assertTrue(menuIdsAfter.containsAll(menuIdsBefore), "升级后升级前的每个菜单 id 都应保留")`；
- 没有重复 id：`assertEquals(menuIdsAfter.size(), new HashSet<>(menuIdsAfter).size(), "升级后菜单 id 不得重复")`；
- 总数 = 升级前 + 升级脚本新增数：新增数取 `menuIdsAfter` 与 `menuIdsBefore` 的集合差（`menuIdsAdded`），断言 `menusBefore + menuIdsAdded == menuIdsAfter.size()`，**不写死 3**。

其余已修内容未动：0.2.0 收敛脚本（`db/upgrade/0.2.0/upgrade-to-0.2.0-from-0.1.7.postgresql.sql`）、类路径动态终点/增量断言、恢复后幂等再升级、PG18 工具链对齐；未改产品代码、未改/新增迁移脚本、未跳过或禁用任何测试。

提交 `d3138a03`（同提交另含第 4 阶段要求的 CI 制品版本化命名落盘，属发布配置，不涉及断言与产品行为）。

### 2. CI 实跑（feature/0.2.2-bundle）

- run **`41963780445` attempt 2 success**（提交 `d3138a03`）。
- `ApplicationCenterRecoveryDrillPostgresTest`：**Tests run 1, Failures 0, Errors 0, Skipped 0**；日志含 `[G4-drill] 升级前：forms=1, menus=140, record=1`，升级/恢复/再升级链路通过。
- `P62UpgradeGatePgTest`：**Tests run 2, Failures 0, Errors 0, Skipped 0**。
- 全工程：**BUILD SUCCESS，2351 tests / 0 failures / 0 errors / 33 skipped**。
- attempt 1 失败为 `P62CompatRollbackPgTest` 1 例「命令未被领取」（已登记 `todo/p62-upgrade-gate-test-claim-race.md`，与本轮改动零关联，同提交 rerun 通过）。

## 二、第 4 阶段：合并

### 1. 合并前核实（均为 0.2.2）

| 项 | 结果 |
|---|---|
| Server CI 版本断言 | `DEV_VERSION == '0.2.2-SNAPSHOT'`（workflow 实读） |
| Server pom revision | `0.2.2-SNAPSHOT`（Maven effective 求值路径） |
| Web package version | `0.2.2` |
| 制品命名 | `bootstrap-0.2.2.jar` / `sw-web-dist-0.2.2.zip`（物理文件名落盘；Release 标题同版本） |
| 种子压缩判断 | 无需再做：0.2.0 已收敛为 `V0.2.0__baseline_seed.sql` 单条基线，0.2.2 追加 `V0.2.2`～`V0.2.6` + `R__`；drill/P62 动态终点断言在合并前 CI 已实际通过 |

### 2. 合并序列与回读

两仓均为普通合并（feature → develop → main），无冲突、无回退、无强推。

| 仓 | feature | develop（合并后） | main（合并后） | 回读 |
|---|---|---|---|---|
| Server | `feature/0.2.2-bundle` `d3138a03` | `2b9482e1` | `0bf4c938` | `origin/develop`=`origin/main`=`0bf4c938`；develop ⊂ main（区间 10 提交） |
| Web | `feature/0.2.2-bundle` `a2f8859` | `c9f09f4` | `3bcd7c2` | `origin/develop`=`origin/main`=`3bcd7c2`；develop ⊂ main（区间 5 提交） |

- `vite.config.ts` 在途改动（`allowedHosts: ['.chikaho.cn']`）未进入任何提交，工作树保持 M。
- feature 分支去留按 0.2.1 惯例：双仓远端+本地已删除（Server tips `d3138a03`、`897983e0`；Web tips `a2f8859`、`c83a4790`），远端仅余 develop/main 与两个非本轮 feature 分支。

### 3. 合并后 CI 实跑

| 仓/分支 | run | 结果 | drill | P62 gate | 全工程 |
|---|---|---|---|---|---|
| Server develop | `41967210334` | success | 1/1，Skipped 0 | 2/2 | 2351/0/0/33，BUILD SUCCESS |
| Server main | `41967257752` a2 | success | 1/1，Skipped 0 | 2/2 | 2351/0/0/33，BUILD SUCCESS |
| Server feature | `41963780445` a2 | success | 1/1，Skipped 0 | 2/2 | 2351/0/0/33，BUILD SUCCESS |
| Web develop | `41967320400` | success | — | — | typecheck/lint/test/build 通过 |
| Web main | `41967357375` | success | — | — | typecheck/lint/test/build 通过 |

Server main attempt 1 的 3 例失败（`I6G1aNotifyFailureBootTest`、`I6G1bRecoveryBootTest`、`I6G1cRecoveryExhaustedBootTest`，通知 Boot 竞态族）与本次提交零关联，同提交 rerun（attempt 2）全绿；feature attempt 1 的 `P62CompatRollbackPgTest` 同上。均如实记录，未改测试、未放宽断言。

## 三、停止条件与边界

- 未触发停止条件：无合并冲突/强推、无产品行为失败、无阻塞发布缺陷。
- 未改迁移历史；未清理本地库 `smart_workflow_f1v4b`；未操作非本轮进程；任何 Key 未进入文件/提交/回执/日志。
- 发布与 UAT 事实见 `release-sync-022-01.md`。
