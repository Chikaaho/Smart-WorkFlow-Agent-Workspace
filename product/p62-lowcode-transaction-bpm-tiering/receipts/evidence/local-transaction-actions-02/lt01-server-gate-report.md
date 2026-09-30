# LT01 补证：Server 四段门禁与 Web 四门可回读报告

日期：2026-09-30；角色：执行（Executor）；用途：闭合审查记录 LT01「缺可回读报告」。

绑定身份：Server `eca1b524a7a4765cbdb37e1689ce9fa0f4c28669`（`develop`，运行日志记录 `dirty_lines=0`）；Web `19e1c472ad8b8fbfd5939811572548d69bf8d4e7`（`develop`，`dirty_lines=0`）。
生成时段：2026-09-30 16:19:12 — 16:32:04 +0800（各日志头自带时间；机器同一台 deivce 上连续前台执行）。

## 1. 材料与生成方式（为什么有新旧两份日志）

| 材料 | 内容 | 去向 |
|---|---|---|
| 原运行日志（15:36—16:07） | `bs-chunkA1-final.log`、`bs-chunkA2-final.log`、`bs-chunkB-final.log`、`mod-chunk0-final.log`；逐段计数 17 / 19 / 146 / 1465 | 保留在 `/tmp/p62-verify/`；SHA-256 见 `lt01-log-sha256.txt` |
| 本次自描述日志（16:19—16:32） | `lt01-mod.log`、`lt01-A1.log`、`lt01-A2.log`、`lt01-B.log`；在**同一冻结提交**上重跑，命令文本、环境、时间、逐类结果与**进程退出码**直接写入日志头尾 | `/tmp/p62-verify/`；摘录落盘本目录 `lt01-raw-excerpts.txt` |
| 反例日志 | `lt01-A1-wrongflag.log`：故意使用错误属性名 `-DfailIfNoSpecifiedTests=false`，退出码 1（见 §4.4） | 同上 |

原日志未记录命令文本与进程退出码，故按审查要求「报告缺失时定向补跑」重跑四段；两份日志的逐段计数、逐类结果完全一致（§6），重跑未改变任何结论。所有日志为 Maven 原始 stdout，摘录仅做白名单行筛选与主机地址脱敏（`PG_DEV_HOST:PG_DEV_PORT`），未改写任何计数与断言文本。

## 2. 环境与数据库目标

| 项 | 值 |
|---|---|
| JDK | `openjdk version "21.0.11" 2026-04-21` |
| Maven | `Apache Maven 3.8.6 (84538c9988a25aec085021c365c560670ad80f63)` |
| Maven 堆 | `MAVEN_OPTS="-Xmx2g"` |
| Node / pnpm | `v24.9.0` / `11.9.0`；`NODE_OPTIONS=--max-old-space-size=2048` |
| 专用 PG 服务器 | `PG_DEV_HOST:PG_DEV_PORT`（脱敏）；行为测试库 `sw_p4_evidence`（Phase4Pg*）、`sw_p5_evidence`（Phase5Pg*） |
| 内嵌真实 PostgreSQL | zonky `embedded-postgres` 2.1.0 + `embedded-postgres-binaries` **17.5.0**（随机本地端口）——`P62TxnActionPgBehaviourTest`、`FlywayFullChainPostgresTest`、`I4TenantIsolationPostgresTest` 等使用 |
| H2 | 内存链（`jdbc:h2:mem:*`），仅用于其声明的测试层级 |

说明：P62 的 PG 行为证据（T01/T02/T03/T04）运行在**真实 PostgreSQL 17.5 引擎**（zonky 内嵌二进制），不是 H2 模拟；H2 只承担迁移链与模块级测试层级。

## 3. 四段命令、退出码与结果

| 段 | 命令（日志头 `### cmd=` 原文） | 退出码 | 结果 | 段耗时 |
|---|---|---|---|---|
| mod（31 个非 bootstrap 模块） | `MAVEN_OPTS="-Xmx2g" mvn -B test -pl '!sw-bootstrap'` | **0** | **1465 / 0 / 0 / 0** | 01:52 |
| A1（bootstrap 重件 4 类） | `mvn -B test -pl sw-bootstrap -am -Dsurefire.failIfNoSpecifiedTests=false -Dtest='Phase4PgStartWindowCrashTest,Phase4PgMigrationBehaviourTest,Phase4PgDeliverySeamBehaviourTest,Phase4PgCommitBoundaryBehaviourTest'` | **0** | **17 / 0 / 0 / 0** | 05:11 |
| A2（bootstrap 重件 4 类） | `mvn -B test -pl sw-bootstrap -am -Dsurefire.failIfNoSpecifiedTests=false -Dtest='Phase4PgRestartRecoveryTest,Phase4PgLifecycleBehaviourTest,Phase4PgTransactionFactTest,Phase4PgFlowSeamBehaviourTest'` | **0** | **19 / 0 / 0 / 0** | 02:55 |
| B（bootstrap 其余 28 类） | `mvn -B test -pl sw-bootstrap -am -Dsurefire.failIfNoSpecifiedTests=false -Dtest='FailureCategoryContractTest,H7TenantIsolationIntegrationTest,ErrorCodeCatalogTest,ReliableEventGateTest,Phase3ReferenceConcurrencyPostgresTest,I6G7bOldBaselineUpgradePostgresTest,P61RuntimeBehaviorBootTest,Phase5IotApiOptionalSemanticsTest,Phase5BootstrapAssemblyTest,Phase5IotApiBoundaryGateTest,Phase5PgDeviceCommandBoundaryBehaviourTest,FlywayFullChainPostgresTest,P61DiagnosticBoundaryTest,ApiOptionalContractGateTest,FlywayFullChainH2Test,I4CrossTenantServiceEntryTest,I4TenantIsolationPostgresTest,I5SsoBindingSessionBootTest,I5ProdProfileSecurityBootTest,I5PgTenantBehaviorBootTest,I5SsoCipherRuntimeDiagTest,I6G7UpgradeDrillH2Test,P62TxnActionPgBehaviourTest,MyProcessedRealSourceTest,G5aSyncWaiterChainTest,CrossTenantReadIsolationTest,CommandOverlapRealEngineTest,BilingualMessageContractTest'` | **0** | **146 / 0 / 0 / 0** | 03:01 |

**合计 1647 / 0 failures / 0 errors / 0 skipped**（1465 + 17 + 19 + 146）。

## 4. 覆盖与去重口径（含 `-am` 重复模块处理）

### 4.1 模块与类覆盖

- mod 段：reactor 共 **31** 个模块（`-pl '!sw-bootstrap'` 排除 bootstrap）；其中 **13** 个模块含测试并实际执行，其余为 pom/API 聚合模块（无 surefire 执行）。13 个模块逐模块计数见 §5.1。
- bootstrap 段：`sw-bootstrap` 测试源共 **36** 个测试类（`find src/test -name '*Test.java' -o -name '*Tests.java'` 计数）；A1 覆盖 4 类、A2 覆盖 4 类、B 覆盖 28 类，**4 + 4 + 28 = 36，无遗漏、无交叉**（类名清单逐字比对，`comm -23` 差集为空）。

### 4.2 `-am` 的重复模块处理

`-pl sw-bootstrap -am` 会把全部上游模块纳入 reactor（构建依赖产物），但三段均使用 `-Dtest=<显式类清单>`；上游模块无匹配测试时不执行任何用例。三次运行中固定 **8 个上游 API 模块**输出 `No tests to run.`：

```
Basic :: Storage :: API / Basic :: Notify :: API / Basic :: Job :: API / Basic :: IoT :: API
Biz :: System :: API / Biz :: Form :: API / Biz :: BPM :: API / Biz :: OpenAPI :: API
```

即：`-am` 只影响**构建**，不产生测试计数重复；bootstrap 三段的计数（17/19/146）与 mod 段的 1465 互不重叠，`1647 = 1465 + 182` 为去重后唯一计数。

### 4.3 去重闸门属性名（本段必须精确记录）

令上游无匹配测试时构建不失败、且不重复计数的属性是 **`-Dsurefire.failIfNoSpecifiedTests=false`**。

### 4.4 反例（属性名写错即失败，说明闸门真实生效）

`lt01-A1-wrongflag.log`：命令 `mvn -B test -pl sw-bootstrap -am -DfailIfNoSpecifiedTests=false -Dtest=Phase4PgTransactionFactTest`，在第一个上游模块即失败、**EXIT=1**：

```
[ERROR] Failed to execute goal org.apache.maven.plugins:maven-surefire-plugin:3.2.5:test (default-test)
on project sw-common: No tests matching pattern "Phase4PgTransactionFactTest" were executed!
(Set -Dsurefire.failIfNoSpecifiedTests=false to ignore this error.) -> [Help 1]
```

对照：同命令改用正确属性名后 A2 段通过（19/0/0/0，EXIT=0）。

## 5. 逐类 / 逐模块结果（本次运行原始输出）

### 5.1 mod 段（31 模块中 13 个含测试；余 18 个无测试执行）

| 模块 | Tests | Failures | Errors | Skipped |
|---|---|---|---|---|
| Common | 32 | 0 | 0 | 0 |
| Security | 17 | 0 | 0 | 0 |
| Basic :: Storage :: Biz | 29 | 0 | 0 | 0 |
| Basic :: Notify :: Biz | 118 | 0 | 0 | 0 |
| Basic :: Job :: Biz | 51 | 0 | 0 | 0 |
| Basic :: IoT | 57 | 0 | 0 | 0 |
| Basic :: Knowledge | 1 | 0 | 0 | 0 |
| Basic :: Agent | 349 | 0 | 0 | 0 |
| Biz :: System :: Biz | 351 | 0 | 0 | 0 |
| Biz :: Form :: Biz | 171 | 0 | 0 | 0 |
| Biz :: BPM :: Engine | 61 | 0 | 0 | 0 |
| Biz :: BPM :: Process | 218 | 0 | 0 | 0 |
| Biz :: OpenAPI :: Biz | 10 | 0 | 0 | 0 |
| **合计** | **1465** | **0** | **0** | **0** |

### 5.2 bootstrap A1（4 类 / 17 用例）

| 类 | Tests | 秒 |
|---|---|---|
| Phase4PgStartWindowCrashTest | 3 | 134.9 |
| Phase4PgCommitBoundaryBehaviourTest | 3 | 43.1 |
| Phase4PgDeliverySeamBehaviourTest | 8 | 52.5 |
| Phase4PgMigrationBehaviourTest | 3 | 69.5 |

### 5.3 bootstrap A2（4 类 / 19 用例）

| 类 | Tests | 秒 |
|---|---|---|
| Phase4PgRestartRecoveryTest | 1 | 49.1 |
| Phase4PgLifecycleBehaviourTest | 7 | 37.0 |
| Phase4PgTransactionFactTest | 2 | 35.5 |
| Phase4PgFlowSeamBehaviourTest | 9 | 41.9 |

### 5.4 bootstrap B（28 类 / 146 用例）

| 类（包内简称） | Tests | 秒 |
|---|---|---|
| FailureCategoryContractTest | 5 | 0.08 |
| p21.H7TenantIsolationIntegrationTest | 1 | 1.79 |
| ErrorCodeCatalogTest | 8 | 0.13 |
| phase4.ReliableEventGateTest | 7 | 0.62 |
| phase3.Phase3ReferenceConcurrencyPostgresTest | 7 | 23.2 |
| i6.I6G7bOldBaselineUpgradePostgresTest | 2 | 0.81 |
| p61.P61RuntimeBehaviorBootTest | 8 | 5.28 |
| phase5.Phase5IotApiOptionalSemanticsTest | 5 | 35.2 |
| phase5.Phase5BootstrapAssemblyTest | 4 | 4.97 |
| phase5.Phase5IotApiBoundaryGateTest | 6 | 0.88 |
| phase5.Phase5PgDeviceCommandBoundaryBehaviourTest | 3 | 7.62 |
| FlywayFullChainPostgresTest | 12 | 2.13 |
| P61DiagnosticBoundaryTest | 8 | 0.35 |
| architecture.ApiOptionalContractGateTest | 6 | 0.15 |
| FlywayFullChainH2Test | 17 | 1.73 |
| i4.I4CrossTenantServiceEntryTest | 2 | 2.84 |
| i4.I4TenantIsolationPostgresTest | 2 | 1.79 |
| i5.I5SsoBindingSessionBootTest | 5 | 10.3 |
| i5.I5ProdProfileSecurityBootTest | 4 | 20.0 |
| i5.I5PgTenantBehaviorBootTest | 3 | 5.62 |
| i5.I5SsoCipherRuntimeDiagTest | 1 | 3.78 |
| I6G7UpgradeDrillH2Test | 1 | 0.46 |
| **p62.P62TxnActionPgBehaviourTest** | **5** | 6.38 |
| p4overlap.MyProcessedRealSourceTest | 4 | 1.94 |
| p4overlap.G5aSyncWaiterChainTest | 5 | 0.72 |
| p4overlap.CrossTenantReadIsolationTest | 2 | 0.33 |
| p4overlap.CommandOverlapRealEngineTest | 4 | 0.44 |
| BilingualMessageContractTest | 9 | 0.03 |

## 6. 关键断言摘录（P62 行为证据行，原始输出）

```
[P62-EV] t01.concurrent succeeded=10 rejected=10 reserved=100 oversell=false ledgerSum=100
[P62-EV] t02.c1 submit/update/delete=rejected plain=ok blank-enable=rejected cross-tenant=blocked
[P62-EV] t03.same-tx commit=both-present rollback=both-absent
[P62-EV] t04.dup-key success=1 conflict=1 reserved=3.000000
[P62-EV] t04.race confirmSettled=false sweepSettled=true status=EXPIRED settleEntries=1
[S3-production] P62 txn menu=(9100,form:action:view,form/views/TxnActionList), buttons=(9101/9102/9103 manage/publish/invoke), ordinaryRoleBound=4, queryExit=0
```

（第 1—5 行由 `P62TxnActionPgBehaviourTest` 输出；第 6 行由 `FlywayFullChainH2Test` 输出；`FlywayFullChainPostgresTest` 的对应断言见摘录文件同名行。）

## 7. Web 四门（自描述日志 `lt01-web-gates.log`）

| 门 | 命令 | 退出码 | 关键输出 |
|---|---|---|---|
| typecheck | `pnpm typecheck`（`vue-tsc -b --noEmit`） | 0 | 无输出（通过） |
| lint | `pnpm lint`（`eslint .`） | 0 | `90 problems (0 errors, 90 warnings)`（既有仓库级 warning；本批文件单独复跑 exit 0、无输出） |
| test | `pnpm test`（`vitest run`） | 0 | `Test Files 144 passed | 1 skipped (145)`；`Tests 1309 passed | 3 skipped (1312)` |
| build | `pnpm build`（`vue-tsc -b && vite build`） | 0 | `✓ built in 1.94s` |

## 8. 与回执 01 及原日志的一致性

| 项 | 回执 01 / 原日志 | 本次重跑 | 一致 |
|---|---|---|---|
| mod 段 | 1465 / 0 / 0 / 0 | 1465 / 0 / 0 / 0（13 模块逐模块一致） | ✅ |
| A1 / A2 / B | 17 / 19 / 146 | 17 / 19 / 146（逐类计数一致） | ✅ |
| 合计 | 1647 | 1647 | ✅ |
| Web vitest | 1309 passed + 3 skipped | 1309 passed + 3 skipped | ✅ |

## 9. 局限与边界

- 原始 `/tmp` 日志为易失介质；其 SHA-256 已随本报告落盘（`lt01-log-sha256.txt`），本报告与摘录为持久证据。
- 本报告只陈述门禁运行事实；1647 为执行侧门禁值，**不构成 Planner 锁定基线**（审查记录同口径）。
- 摘录文件对主机地址做了脱敏；其余行（含数据库名、类名、计数）为原文。
