# 最小闭环缺口修复 A-01～A-04 · R-05 收敛补证回执

> 日期：2026-08-29
> 执行依据：`planning-execution-prompt-minimal-closure-remediation-01.md`（一级收敛提示）
> 对照：`planning-rereview-remediation-a01-a04-20260829.md`（唯一剩余 R-05a/R-05b）
> 结论：R-05a 与 R-05b 均已按提示 §六格式补齐；未运行任何前端命令、未重验任何已锁定项

## 证据包 R-05a：后端根全量门

- 互斥快照路径：`evidence/R2-R05-12-mutex-snapshot-root-test.txt`（无前端编译/测试进程）
- 实际命令：`cd Smart-WorkFlow && mvn test`（后端根目录，全 reactor 33 个模块）
- `MAVEN_OPTS` 值：`-Xmx2g`
- 原始日志路径：`evidence/R2-R05-14-backend-root-full-test-raw.log`
- 退出码：0
- 总计数：**Tests run: 955, Failures: 0, Errors: 0, Skipped: 0**（12 个含测试模块：18+6+19+85+51+23+346+210+81+27+62+27）
- `BUILD SUCCESS` 原文位置：原始日志末尾 `Reactor Summary` 全部 SUCCESS 后 `[INFO] BUILD SUCCESS`（Total time: 56.489 s）

## 证据包 R-05b：V44 双迁移链

前置修改（提示 §四允许范围）：两个永久全链测试的终点/计数断言承接 V44，并新增 V44 产物断言（id=5 改目录、子菜单 20/21/22/23）。唯一修改文件：

1. `sw-bootstrap/src/test/java/com/sw/ck/bootstrap/FlywayFullChainH2Test.java`（43→44、升级链 +1、终点 V44、V44 产物断言）
2. `sw-bootstrap/src/test/java/com/sw/ck/bootstrap/FlywayFullChainPostgresTest.java`（42→43、升级链 +1、V44 产物断言）

V44 迁移文件本身未修改（H2 与 PG 两方言除方言标注注释外逐行一致，`diff` 已核）。

- 实际命令：`MAVEN_OPTS="-Xmx2g" mvn test -pl sw-bootstrap -Dtest='FlywayFullChainH2Test,FlywayFullChainPostgresTest' -Dsurefire.failIfNoSpecifiedTests=false`
- 互斥快照路径：`evidence/R2-R05-11-mutex-snapshot-migration.txt`
- 原始日志路径：`evidence/R2-R05-13-migration-dual-chain-raw.log`
- 退出码：0，`BUILD SUCCESS`

| 侧 | 测试数 | 迁移数（全链 applied） | 终点版本 | validate/升级链 |
|---|---|---|---|---|
| H2（`FlywayFullChainH2Test`） | **15，Failures 0, Errors 0, Skipped 0** | **44** | **V44** | 全链 `validate()` 通过；V32→链尾 12 条、V33→链尾 11 条、V36→链尾 8 条（终点断言 V44）；V31 冲突显式失败、V34/V8 绑定语义正反例全过 |
| PostgreSQL（`FlywayFullChainPostgresTest`，zonky 真实 PG 17.5） | **12，Failures 0, Errors 0, Skipped 0** | **43** | **V44** | `validate()` 通过；V32→链尾 11 条；既有库校验和安全测试（原 V13 checksum 不得静默通过）通过；V44 产物断言通过 |

两例试验均为真实执行且未跳过（原始日志中两个 `Tests run:` 行均含 `Skipped: 0`）。

## 提交前自检矩阵（提示 §七）

| 检查项 | 结果 |
|---|---|
| H2 全链实际执行、零失败、终点 V44、44 条 | 是 |
| PG 全链实际执行、零失败、终点 V44、43 条 | 是 |
| 后端根全量当前代码实际执行、退出码 0、BUILD SUCCESS | 是（955/0/0/0） |
| 所有 Maven 命令均带 `MAVEN_OPTS=-Xmx2g` | 是 |
| 互斥快照无前端编译/测试进程 | 是 |
| 未运行前端门、未重验页面或业务主链 | 是 |
| 回执末尾唯一 `SWF_TERMINAL`，Validator 退出码 0 | 是（下行动态校验） |

## 状态处理

- 未修改业务页面、业务主链、前端或无关历史迁移；仅按提示 §四修改两个永久迁移测试的契约承接文件。
- 正式功能状态、功能数、清单计数、P 编号与正式基线保持不变；方向继续留在 `ready/`。
- decisions.md：无新增（测试契约承接属提示授权的最小修改，非新决策）。

SWF_TERMINAL {"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","receipt":"product/minimal-closure-first-acceptance/receipts/receipt-minimal-closure-remediation-r05-20260829.md","evidence":["evidence/R2-R05-14-backend-root-full-test-raw.log：后端根全量 mvn test，MAVEN_OPTS=-Xmx2g，退出码 0，955/0/0/0，BUILD SUCCESS","evidence/R2-R05-13-migration-dual-chain-raw.log：FlywayFullChainH2Test 15/0/0/0 终点 V44 迁移 44 条；FlywayFullChainPostgresTest(zonky 真实 PG) 12/0/0/0 终点 V44 迁移 43 条；两侧 Skipped=0 未跳过","evidence/R2-R05-11/12-mutex-snapshot-*.txt：迁移测试与根全量前互斥快照均无前端进程","唯一修改文件：FlywayFullChainH2Test.java / FlywayFullChainPostgresTest.java（终点/计数承接 V44 + V44 产物断言）"],"feature_status":"VERIFYING"}
