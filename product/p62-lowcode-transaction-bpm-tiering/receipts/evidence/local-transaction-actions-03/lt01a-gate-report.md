# LT01a 补证：最终树四段门禁自描述报告（命令/退出码/逐类结果/断言）

日期：2026-09-30；角色：执行（Executor）。用途：闭合审查02 LT01a「新树原始输出未归档；1654 目前是执行报告值；新增断言缺原始输出身份」。
方法：在**已提交且工作区干净**的最终树上重跑既有四段门禁（与 LT01 相同命令），自描述头写入日志（命令、git 身份、dirty 行数、退出码）；机械摘录白名单行并复算计数；不重跑 Web 四门（LT06 已锁定，Web 提交 `19e1c47` 未变）。

## 1. 运行身份（与提交绑定）

| 项 | 值 |
|---|---|
| 运行树 | Server 提交 `6e73a1147a0233676d3fdc33f5aec0a6b10ffa9f`（父 `9efe451`），分支 `develop`，`git status --porcelain` 行数 = **0**（日志内 `dirty_lines=0`） |
| 环境 | OpenJDK 21.0.11；Apache Maven 3.8.6；`MAVEN_OPTS=-Xmx2g` |
| 运行窗口 | 2026-09-30 17:53:55 → 18:07:35 +0800（四段顺序执行） |
| 日志 | `/tmp/p62-verify/lt03-{mod,A1,A2,B}.log`（sha256 见 `lt01a-log-sha256.txt`；脚本 `lt03-run.sh` 同表） |
| 摘录 | `lt01a-raw-excerpts.txt`（626 行白名单行；主机地址脱敏为 `PG_DEV_HOST:PG_DEV_PORT`） |
| 逐类明细 | `lt01a-per-class-counts.txt`（工具复算，非手抄） |

内容指纹（提交前后包含性证明，逐字节一致）：

| 文件 | 磁盘 SHA-256 = `git show 6e73a11:<path>` SHA-256 |
|---|---|
| `P62TxnActionPgBehaviourTest.java` | `0f524420db17f599ccee2912a05f8f05e73e0de2cd47813756771fdf6ff7b8f5` |
| `P62UpperEntryC1PgTest.java` | `44ddefa5fa85aaa62742c81c400e751c23588f3379cd77f75f6f6d19cf3b930f` |
| `P62NonEmptyUpgradePgTest.java` | `422bcede127fa5ac995c3c4576eb4323f20985acf9dca395b9ac1cd12af31c94` |

## 2. 命令与退出码

| 段 | 命令 | 退出码 | 耗时 |
|---|---|---|---|
| mod | `MAVEN_OPTS="-Xmx2g" mvn -B test -pl '!sw-bootstrap'` | **0** | 1:28 |
| A1 | `mvn -B test -pl sw-bootstrap -am -Dsurefire.failIfNoSpecifiedTests=false -Dtest='Phase4PgStartWindowCrashTest,Phase4PgMigrationBehaviourTest,Phase4PgDeliverySeamBehaviourTest,Phase4PgCommitBoundaryBehaviourTest'` | **0** | 6:08 |
| A2 | `mvn -B test -pl sw-bootstrap -am -Dsurefire.failIfNoSpecifiedTests=false -Dtest='Phase4PgRestartRecoveryTest,Phase4PgLifecycleBehaviourTest,Phase4PgTransactionFactTest,Phase4PgFlowSeamBehaviourTest'` | **0** | 3:02 |
| B | `mvn -B test -pl sw-bootstrap -am -Dsurefire.failIfNoSpecifiedTests=false -Dtest='<30 个类，见摘录 ### cmd 行>'` | **0** | 2:37 |

## 3. 逐类结果复算

| 段 | 类数 | 测试数 | Failures | Errors | Skipped |
|---|---|---|---|---|---|
| mod（13 个含测试模块，逐类 239 行含 15 行 `Tests run: 0` 的父类行） | 239 | **1466** | 0 | 0 | 0 |
| A1（sw-bootstrap 4 类） | 4 | **17** | 0 | 0 | 0 |
| A2（sw-bootstrap 4 类） | 4 | **19** | 0 | 0 | 0 |
| B（sw-bootstrap 30 类） | 30 | **158** | 0 | 0 | 0 |
| 合计 | — | **1660** | 0 | 0 | 0 |

- `mod` 逐类合计与模块小结合计均为 1466（两条独立口径互证）；模块小结 13 行、`No tests to run.` 8 行（无测试的聚合/API 模块）。
- A1/A2/B 的 `-am` 去重：上游 8 个模块输出 `No tests to run.`（`-Dtest` 未匹配即跳过，`-Dsurefire.failIfNoSpecifiedTests=false` 防"无匹配即失败"），实际执行集中在 sw-bootstrap 一段，无重复计数。
- sw-bootstrap 覆盖闭合：仓库测试类 38 个 = A1 4 + A2 4 + B 30，集合唯一、无缺口、无越界（脚本比对，见 §6）。
- 相对上一棵树（`5f9e066`/1654）：B 段 152 → 158（`P62TxnActionPgBehaviourTest` 11→12；新增 `P62UpperEntryC1PgTest` 4、`P62NonEmptyUpgradePgTest` 1）；mod 段 1466 不变（无模块测试新增）。

## 4. 新增断言原始输出（本轮四缺口）

摘自 `lt01a-raw-excerpts.txt`（原文，仅主机地址脱敏）：

- LT02a 草稿提交（受保护）：`[P62-EV] lt02a.draft protected entry=accepted command=… status=FAILED reason=C1 draft=…/FAILED rows=0 flowStart=0 instances=0`；对照：`lt02a.draft-plain entry=written row=… draft=SUBMITTED rowsDelta=1 flowStartDelta=1 (同一入口同一身份)`
- LT02a OpenAPI（受保护）：`lt02a.openapi protected code=1612 errorKey=form.c1_write_protected rows=0 idem=0 flowStart=0 instances=0`；对照：`lt02a.openapi-plain entry=written record=… replay=same-recordId rowsDelta=1 idemDelta=1`
- LT04a 单对象：`lt04a.single-object form=… record=… reservation=… reserveAction=…(v1->v2) confirmAction=… policyChange=allowed(applyAt=…) illegalChange=rejected(policy-unchanged) settle=frozen-v1(balance95/reserved0/reserved2-7) ordinary-write=blocked-before-and-after no-double-settle=true`
- LT05a 非空升级：`lt05a.baseline migrated=2 target=0.1.0 set=V0.1.0+R__i6 …`、`lt05a.legacy-seeded rows=2 digest=… inserted_before_increment=true`、`lt05a.increment migrated=2 applied=0.1.0>i6 notify menu reconciliation>0.1.1>p62 form txn action menu history_0_1_1=0.1.1|form local transaction actions|257617857|…|true|14ms`、`lt05a.readback rows=2 digest=… digest_equal=true p62_tables=6 …`、`lt05a.file-identity migration_file=V0.1.1__form_local_transaction_actions.sql sha256=0534ce41…`
- 既有 P62 断言全部重现（同段 B 原始输出）：`t01.concurrent`、`t02.c1`、`t03.same-tx`、`t04.dup-key`、`t04.race`、`lt02.keys`、`lt02.precision`、`lt02.import`、`lt04.lost-response`、`lt04.frozen-v2-published`、`lt04.unsupported-declaration`。

## 5. 边界与不重验

- 本报告只对应运行树 `6e73a11`；旧树 `eca1b52` 的 1647 逐类报告（`…-02/lt01-server-gate-report.md`）作为历史保留，两者不混用。
- Web 四门（typecheck/lint/test/build）与窄视口浏览器证据已在审查02锁定，本轮未重跑，Web 提交仍为 `19e1c47`。
- 段 B 的 `P62NonEmptyUpgradePgTest` 使用 zonky 内嵌 PostgreSQL（临时集群随进程销毁）；`I6G7bOldBaselineUpgradePostgresTest`、`Phase4Pg*` 等沿用既有本机 PG 演练库口径（主机地址在摘录中已脱敏）。
- 新增断言的**用途**证据（对象身份、before/after 值、边界）见同目录 `lt02a-upper-entry-c1.md`、`lt04a-single-object-frozen.md`、`lt05a-nonempty-upgrade.md`；本报告只承担"原始输出与计数可复算"的取证职责。

## 6. 复算命令（可机械重放）

```bash
# 计数复算（逐类/模块两条口径）
grep -E '^\[INFO\] Tests run: [0-9]+, Failures: [0-9]+, Errors: [0-9]+, Skipped: [0-9]+ -- in ' lt03-mod.log | wc -l      # 239
grep -E '^\[INFO\] Tests run: ' lt03-mod.log | grep -v -- ' -- in ' | awk -F'[:,]' '{s+=$2} END{print s}'                     # 1466
grep -E '^\[INFO\] Tests run: ' lt03-B.log   | grep -- ' -- in '  | awk -F'[:,]' '{s+=$2} END{print s}'                      # 158
# 覆盖闭合
comm -3 <(find sw-bootstrap/src/test/java -name '*Test.java' -o -name '*Tests.java' | sed 's#.*/##;s#\.java$##' | sort) \
        <(printf '%s\n' <A1+A2+B 类名> | sort)   # 输出为空 = 无缺口无越界
# 内容指纹
shasum -a 256 sw-bootstrap/src/test/java/com/sw/ck/bootstrap/p62/*.java
git show 6e73a11:sw-bootstrap/src/test/java/com/sw/ck/bootstrap/p62/P62UpperEntryC1PgTest.java | shasum -a 256
```
