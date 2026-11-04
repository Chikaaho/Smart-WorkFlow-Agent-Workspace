# 0.2.2 第 3 阶段补充回执（close-sync-022-02）· C022-G1 修复

- 依据：`planning-review-close-022-01.md`（裁定本版修）＋ `planning-execution-prompt-close-022-01.md`。Server `feature/0.2.2-bundle` 提交 **`8004fb17`**（`d61dceca..8004fb17`，4 文件 +174/-27，已推送）。

## 一、改动摘要（只动 4 个测试类，未触产品代码/迁移脚本）

| 测试类 | 改动 |
|---|---|
| `P62NonEmptyUpgradePgTest` | 3 例终点断言 `isEqualTo("0.2.0")` → `isEqualTo(latestClasspathVersion())`（「类路径最新版本化迁移」）；`assertHistorySeedAndTenantMigrations` 由写死「versioned 单条/聚合=0.2.0」改为「0.2.0 基线登记（原校验和 `1897854550` 断言保留）＋ 类路径上其后的版本化迁移按 installed_rank 逐条衔接、条数=1+新版本数」；相关 DisplayName/注释/证据打印同步改为动态口径。新增包内私有 helper：`classpathVersions()`（扫 10 个主链位置 `V<version>__*.sql`）、`compareVersions()`（'.' 分段数值序，兼容 0.2.6 与时间戳版本）、`latestClasspathVersion()`——终点随链自动更新，第 4 阶段若做种子压缩无需再改 |
| `P64AppendMigrationUpgradePostgresTest` | 基线终点断言同上改为 `latestClasspathVersion()`；历史集合断言由写死 `Set.of("0.2.0", ts)`/条数 2 改为 `expectedHistoryVersions(ts)`＝{0.2.0}∪{类路径其后的版本化迁移}∪{ts}；helper 以**包内可见** static 方法承载（同包 P64RollbackBoundary 复用） |
| `P64RollbackBoundaryPostgresTest` | 在役基线终点断言改为 `latestClasspathVersion()`；「0.2.0 库」措辞改「最新库」；`unresolvedVersions.contains("0.2.0")` 断言不变（0.2.0 仍是旧迁移集不可解析的在役收敛基线，意图不变） |
| `F1ProviderModelMigrationPostgresTest` | `enabled`/`model_enabled`（PG boolean 列）由 `rs.getInt` 改为 `rs.getBoolean` 断言：openai 行启用、模型行启用、other 行停用——断言意图不变；顺带删除重复的 `java.io.IOException` import |

未修改产品代码、未修改/新增迁移脚本、未跳过/禁用/删除任何测试、未把终点改成另一个写死版本号、未降低断言意图（`git show 8004fb17` 可核，改动仅上述 4 文件）。

## 二、全工程重跑（MAVEN_OPTS=-Xmx2g mvn -q test）

- **exit=0**；日志全量存 `assets/close-022-gates-server-r2.log`（约 30MB，-q 模式）。
- 日志内 `[ERROR]` 行 **0** 条、无任何 `Failures: [1-9]|Errors: [1-9]` 汇总行。
- 各模块 surefire-reports 聚合（14 个含测试模块全部实际运行；`mvn -q test` exit=0 即全 reactor 通过）：

| 模块 | Tests | Failures | Errors | Skipped |
|---|---:|---:|---:|---:|
| sw-basic/sw-basic-agent | 337 | 0 | 0 | 0 |
| sw-basic/sw-basic-iot | 76 | 0 | 0 | 0 |
| sw-basic/sw-basic-job/sw-basic-job-biz | 51 | 0 | 0 | 0 |
| sw-basic/sw-basic-knowledge | 14 | 0 | 0 | 0 |
| sw-basic/sw-basic-notify/sw-basic-notify-biz | 123 | 0 | 0 | 0 |
| sw-basic/sw-basic-storage/sw-basic-storage-biz | 29 | 0 | 0 | 0 |
| sw-biz/sw-biz-form/sw-biz-form-biz | 271 | 0 | 0 | 0 |
| sw-biz/sw-biz-openapi/sw-biz-openapi-biz | 16 | 0 | 0 | 0 |
| sw-biz/sw-biz-system/sw-biz-system-biz | 392 | 0 | 0 | 0 |
| sw-biz/sw-bpm/sw-bpm-engine | 177 | 0 | 0 | 0 |
| sw-biz/sw-bpm/sw-bpm-process | 501 | 0 | 0 | 0 |
| **sw-bootstrap** | **307** | **0** | **0** | **32** |
| sw-framework/sw-common | 36 | 0 | 0 | 0 |
| sw-framework/sw-security | 23 | 0 | 0 | 0 |
| **合计** | **2353** | **0** | **0** | **32** |

- 定点先行验证：4 类 9/9 绿（F1 4/4——**该测试在 PG 上首次通过**；P62 3/3——升级链续迁 0.2.2～0.2.6 干净、0.2.0 基线校验和保留断言通过；P64 2/2）。
- 全量失败复核：规划指出的「sw-bootstrap 之后的模块可能没跑」已消除——exit=0 证明全 reactor 通过，上表 14 模块报告时间戳均为本轮（03:1x～03:4x）。

## 三、完成条件对照（提示 4 条）

1. 全工程 mvn test exit=0，Failures 0 Errors 0 ✅（二）
2. 5 例终点断言取类路径实际最新版本化迁移、不含写死版本号 ✅（一；类内已无 "0.2.0" 终点字面量，仅保留 0.2.0 基线**校验和**断言与基线登记意图——该意图属种子压缩语义，非终点断言）
3. F1ProviderModelMigrationPostgresTest 在 PG 上 4/4 通过 ✅（二）
4. 改动只在 4 个测试类内 ✅（提交 8004fb17 diff）

## 四、下一步

按执行提示直接推进第 4—6 阶段（合并→发布 0.2.2→发布后同步），第 4 阶段 CI 结果写入本回执续段或 `release-sync-022-01.md`。

## 五、续段：CI 实跑验证与两例新增发现（2026-11-05 补）

执行提示要求「ApplicationCenterRecoveryDrillPostgresTest 在 CI 实际跑通」。为满足它对 CI 发布配置做了三步收敛（均在方向第 4 阶段「CI 工作流」授权范围内）：①workflow 增加 PostgreSQL 14 服务容器（`AC_G4_PG_URL` 指引 drill 的既有探测通道）；②端口置 55432——首测发现占 5432 会让 `H7TenantIsolationIntegrationTest` 的裸 socket 在役库探测误判（H7 语义=5432 上的全量在役库，实跑即错）；③`AC_G4_PG_URL` 须为**完整 JDBC URL**（测试侧不拼接前缀，裸 host:port 会因无驱动而失配）。

**结果：drill 已实跑（Skipped: 0），但暴露两例本授权范围外的既有测试缺陷（CI run 41931095709 @ main `6b045da5`，其余 304 测试全绿、4 个已修类全绿）：**

| 测试 | 现象 | 定性（均与本轮改动无关） |
|---|---|---|
| `ApplicationCenterRecoveryDrillPostgresTest` | Flyway validate 失败：`Detected applied migration not resolved locally: 0.1.7`；其断言写死「升级后只应执行 V0.1.8/0.1.9/0.1.10 三支、终点=0.1.10」 | 与 P62/P64 同病的**陈旧字面量**：该测试自 0.1.7 期（`d43ad35b`）从未随 0.2.0 种子压缩迁移，且因本地缺 pg_dump/CI 缺 PG 而始终跳过、从未暴露。修复需按 P62 同款把链口径改动态（超出本提示「只改 4 个测试类」授权，**未修，上报**） |
| `P62UpgradeGatePgTest.upgradeConsumesLegacyTypesKeepsHistory` | 「命令未被领取」领取断言失败 | **已登记时序族竞态**（`todo/p62-upgrade-gate-test-claim-race.md`，0.1.7 期 CI failure e2fe50f 同源，同提交本地绿）；PG 服务使能后 CI 首次真实触发 |

**配置现状**：PG 服务容器与诊断步保留在 main `1679f877`（诊断步=always 只读取证，含 XML 跳过消息/裸 JDBC 探针/步内复跑，全程无密钥）。该配置下 CI 无法回到全绿（drill 必跑必失败），故**第 4 阶段合并仍未启动**，等待规划对上述两例的处置（同口径修测试/列入时序族豁免/其他）。

**已核事实**：4 个已修类在 CI run 41931095709 全绿（P62NonEmpty 3/0/0、F1 4/0/0、P64×2 各 1/0/0/1——P64 在 CI 因自身 5432 探测跳过，本地 2353 全量已实跑通过）；run #1（`a9fe8efa`，无 PG 服务）全绿且已产出 Release `bootstrap.jar`（220,778,675 B，`build.version=0.2.2` 实测）——本授权内的修复已被 CI 完整验证。

**UAT 前置已就绪项（第 5 阶段事实，本轮完成）**：D022-07 pgvector 已装——UAT（8.166.112.85，PG 14.24，jammy 无 pgvector 包、apt lists 损坏）按 PGDG pool 直下 `postgresql-14-pgvector_0.8.7` + `dpkg -i --force-breaks`（PGDG 打包与 Ubuntu `postgresql-14-jit-llvm` Provides 的声明工件冲突，扩展 .so 与 JIT 无实质关系；`pg_available_extensions` 回读 vector|0.8.7）；磁盘按 §9.2 清理（0.2.0 备份 jar 218M——可从公开 Release 重取、npm 缓存 177M、部署遗留 17M——frp/ngrok 等为 Owner 工具未动；/data/reasonix 会话 7G 为 Owner agent 数据未动，已列回执上报）；DB 备份已取（流式绕开 postgres 用户不可写：本地 `smart_workflow_20261105_pre022.dump` 1,340,515 B/178 表 + 回传 UAT `/data/backup/`）；health 当前 DOWN 的最可疑因子=磁盘 0 可用（Spring 磁盘健康指标），清理后待发布窗口复验。

## 六、唯一下一动作（更新）

等待规划对两例新发现的处置裁决；裁决修完后：CI 全绿 → 第 4 阶段合并（develop→main）→ tag 0.2.2 → 发布 → UAT（pgvector 已装，见 release-sync）→ 发布后同步。
