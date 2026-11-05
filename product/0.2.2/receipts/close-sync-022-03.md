# 0.2.2 第 3 阶段补充回执（close-sync-022-03）· UAT 复查 / 分支发布核实 / 两测试修复 / CI 触发改造

- 依据：Owner 补充提示（2026-11-05，四项）。前序：`close-sync-022-02.md`（C022-G1 与两例范围外发现上报）。

## 一、UAT 复查（只读；需重启/扩容仅报告，未动手）

| 项 | 实况（2026-11-05 复查） |
|---|---|
| 磁盘 | `/dev/vda3` **19696M / 19787M 已用，Avail 0M（100%）**；inode 31% 正常 |
| 应用进程 | `java -jar /opt/smart-workflow/server/bootstrap.jar`，已运行 **1 天 16:19**（0.2.1 部署版） |
| health | `{"status":"DOWN"}`；**根因实际取值**：`server.log` 2026-11-05T09:53:23 `DiskSpaceHealthIndicator: Free disk space ... Available: 0 bytes (threshold: 10485760B)` —— 即磁盘 0 可用触发 |

- 已完成的清理（上轮，§9.2 范围内）：0.2.0 备份 jar 218M（公开 Release 可重取）、npm 缓存 177M、部署遗留 17M；释放后 root 预留块一度可写，但实际 Avail 仍为 0M。
- **空间构成**：`/data/reasonix/.reasonix-sessions` **7.1G**（Owner 的同机 agent 服务会话数据，本轮未动）；`/root`+`/opt` 约 1.7G/1.7G（含 nvm 876M、node 542M、claude 245M 等 Owner 工具链，未动）。
- **结论与需要（仅报告，不执行）**：health DOWN 系磁盘 0 可用所致，**重启不能修复**（重启后磁盘仍满，DiskSpaceHealthIndicator 依旧 DOWN）。需 Owner 决策其一或组合：①对 `.reasonix-sessions` 定清理/轮转策略（当前 7.1G，是唯一可腾挪的大头）；②系统盘扩容（20G→40G 级）；③接受现状并在发布窗口仅做最小清理。**扩容/清理动作均待授权**，本轮未做任何重启或扩容。

## 二、分支与发布核实（只读）

**Server（Smart-WorkFlow-aPaaS-server）**

| 分支 | SHA | 包含关系 |
|---|---|---|
| `feature/0.2.2-bundle` | **`3818d0c4`** | 含全部 0.2.2 产品代码＋C022-G1 修复＋本轮两测试修复＋CI 触发改造；已合入 develop（`ed1c2564` 把 develop 配置合入 feature） |
| `develop` | `a1f16fbe` | develop ⊂ main ✅；**不包含** feature 的 a73b551e/8060eca3/3818d0c4（两测试修复与分支触发仅 feature 有） |
| `main` | `6b045da5` | **已含 0.2.2 产品代码**（`pom revision=0.2.2-SNAPSHOT` 实读；containment：feature@8004fb17⊂develop⊂main ✅）。不含本轮两测试修复 |
| `feature/0.2.2-agent` | `897983e0` | F1 终点（已包含在 bundle 链中） |

- 语义 tag：`0.2.0`、`0.2.1` 存在；**`0.2.2` 未创建**（第 5 阶段才做）。
- Release 实况：0.2.2 只有 **6 个 `build-<sha>` 自动产物** Release（a9fe8efa/b649d9a1/127fbe51/a0a239e3/562b59a8/1679f877，各 1 资产 `bootstrap.jar` 220,778,675 B、`build.version=0.2.2` 实测；资产命名未带版本后缀，已如实记录）；历史语义 Release 0.2.1/0.2.0/0.1.x 保留。**无 `0.2.2` 语义 Release**。

**Web（Smart-WorkFlow-aPaaS-Web）**

| 分支 | SHA | 包含关系 |
|---|---|---|
| `feature/0.2.2-bundle` | `4bfb87d` | ⊂ develop ⊂ main ✅（两含） |
| `develop` | `b26cd43` | ⊂ main ✅（package version=0.2.2 实读） |
| `main` | `95d1790` | **已含 0.2.2 产品代码**（`"version": "0.2.2"`） |

- 语义 tag：`0.2.0`/`0.2.1` 存在；**`0.2.2` 未创建**。Release：0.2.2 仅 1 个 `build-95d1790` 自动产物（`dist-95d1790….zip` 6,191,084 B，入口 `assets/index-D6vkuidr.js`）；无语义 Release。

## 三、两测试修复（本轮授权范围）

| 测试 | 修复内容 |
|---|---|
| `ApplicationCenterRecoveryDrillPostgresTest` | ①补执行 `db/upgrade/0.2.0/upgrade-to-0.2.0-from-0.1.7.postgresql.sql`（0.2.0 种子压缩后，0.1.7 衔接态须先收敛为单条 V0.2.0 登记，当前主链才能续升——原「0.1.7 不可解析」即此缺环）；②终点/增量断言改「类路径实际最新版本化迁移」与动态增量数（不再写死 0.1.8/0.1.9/0.1.10），恢复后再次升级新增幂等断言（重复 migrate=0）；③菜单断言由「总行数不变」改为「无重复 id」（升级脚本按设计补入 3 个增量菜单行，非重复——原断言口径不适配压缩后的升级流）；④服务容器与 runner 的 pg_dump/pg_restore 18.x 对齐（`postgres:18`，跨版本 dump→restore 因新 GUC 失败属工具链配对问题，非业务）。断言意图（备份→升级→恢复→读写可用→可再升级）全部保留 |
| `P62UpgradeGatePgTest` | ①`@BeforeAll` 内 `CommandDispatcher.stop()`：本类显式领取并直调消费指定命令，停掉上下文后台调度器，消除其并发 claimDue 夺走受测命令的竞态（`todo/p62-upgrade-gate-test-claim-race.md` 指向的改进路径；业务规则与断言强度不变，仅测试生命周期隔离）；②`claimBy` 有界重试（≤5s、50ms 间隔），并对「命令已被后台消费者领取（状态≠PENDING）」如实区分报错 |

**CI 证据（feature/0.2.2-bundle @ `3818d0c4`，run 41960372793 success）**：
- drill **实跑 1/1 绿（Skipped: 0）**：`[G4-drill] 升级前 forms=1 menus=140 → 备份 363,779B → 就地覆盖被拒 → 恢复后读写可用且可再次升级到 0.2.6`；
- P62UpgradeGatePgTest **2/2 绿**（CI 上首次稳定通过）；
- 全工程 304 tests / 0 failures / 0 errors / 33 skipped（其余跳过为各测试自身环境条件，同前口径）；
- **Create GitHub Release step = skipped**（分支上不产 Release，符合改造）；
- 过程如实：attempt 1 因 `AgentToolConfigServiceImplTest`（mock 聊天服务集成，与本轮零关联）1 例失败，rerun attempt 2 该例通过而 drill 菜单断言失败（属本轮修复迭代）；最终 runs 全绿于 `3818d0c4`。该 agent 测试判为**既有抖动**（前 9 跑与本地全量均绿，rerun 即过），已列如实报告项。

## 四、CI 触发改造

- `build-release.yml`：`on.push.branches` 由 `[main]` 改为 **`[main, develop, 'feature/**']`**；新增 `Create GitHub Release` 的 `if: github.ref == 'refs/heads/main'` 门控——**测试验证在 feature/develop 触发，tag+Release 仍仅 main**。本轮全部验证均经 feature 分支 CI，未再推 main（main 保持 `6b045da5` 未动）。
- 注意：该改造与两测试修复当前仅在 `feature/0.2.2-bundle`；develop/main 上的 workflow 仍是旧触发（develop 推送不会跑 CI，main 上的 drill 仍旧版会红）——待第 4 阶段合并把这些带入 develop/main。

## 五、提交与远端

| 仓 | 分支 | SHA（均已推送并远端回读一致） |
|---|---|---|
| server | feature/0.2.2-bundle | `3818d0c4`（a73b551e→ed1c2564 合 develop→8060eca3→3818d0c4）；修复提交：`a73b551e`（两测试+触发）、`8060eca3`（菜单断言）、`3818d0c4`（PG18 对齐） |
| server | develop / main | `a1f16fbe` / `6b045da5`（本轮未动） |
| web | — | 本轮未动（main `95d1790`、develop `b26cd43`） |

## 六、如实报告

1. **UAT 未做任何重启/扩容/清理决策**：仅只读复查并报告（磁盘 0M、health DOWN 根因=磁盘健康指标、`/data/reasonix` 7.1G 为 Owner 数据、重启不解决问题）。
2. **一次分支操作自错自纠**：初始提交曾误落 main（checkout 被在途改动 Aborting 后提交留 main 本地），已 `git reset --hard 6b045da5` 复位 main（未推送）并 cherry-pick 至 feature；main 远端全程未动。
3. **agent 测试抖动**：`AgentToolConfigServiceImplTest.orchestration_runWithInternalTool_shouldBindAndClearToolsSymmetrically` 于 run 41955576315 attempt 1 失败（`resp.isSuccess()=false`，mock 服务路径）、attempt 2 通过；非本轮改动关联，登记为既有抖动观察项（建议排期隔离，类似 P62 时序族）。
4. **drill 修复保持断言强度**：仍完整走 备份→升级（0.1.6/0.1.7/0.2.0 脚本）→主链续升至类路径最新→就地覆盖被拒→恢复→读写→再升级→幂等；仅把随版本漂移的字面量与不适配压缩流的计数口径改为动态/无重复语义。
5. **campaign 边界**：未触碰产品代码与迁移脚本；未推 main；未做 Release/tag；UAT 无动作。

## 七、唯一下一动作

按补充提示**停在回执**。待规划复核后进入第 4 阶段（把 feature/0.2.2-bundle 带入 develop→main，CI 触发与两修复随之生效；再 tag 0.2.2→发布→UAT 升级（前置已就绪，pgvector 0.8.7 已装、DB 备份已取，仅磁盘与 health 待 Owner 决策）→发布后同步）。
