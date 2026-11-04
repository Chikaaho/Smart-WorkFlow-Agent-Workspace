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
