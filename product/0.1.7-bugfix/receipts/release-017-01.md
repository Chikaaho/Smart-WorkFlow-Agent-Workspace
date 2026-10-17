# 0.1.7 同步与发布执行回执 01（合并、收敛与发布事实）

2026-10-18｜角色：执行（Executor）。依据：`product/0.1.7-bugfix/ready/direction-release-handoff-017.md`（承接方向）、`search_task/release-017-close-readiness.md`（核实任务）。事实回传：`search_fallback/release-017-close-readiness.md`（+ `-details.md` 明细附表）。

> 本回执为**执行侧证据**：只报事实、结果与位置，不写功能 `PASSED/COMPLETED`、不核销 P 编号、不新增功能计数。同步唯一值待规划下发。

## 1. 范围与内部 Step

| Step | 内容 | 状态 |
|---|---|---|
| S1 | 三仓 Git/清单历史/权威状态/版本来源核实（探索任务 Q1—Q4） | 完成 |
| S2 | 修复分支→develop 快进合入（Server/Web） | 完成 |
| S3 | 版本收敛（Server `pom`/CI/脚本、Web `package.json`）→ 0.1.7 | 完成 |
| S4 | 种子收敛与 0.1.7 升级通道（Server，双方言） | 完成 |
| S5 | develop→main 合入推送与 CI 发布 | 进行中（Server 首轮 CI 红→修复→重跑） |
| S6 | 0.1.7 语义 tag/Release | 未开始（通道待定，见 §5） |
| S7 | UAT 部署（0.1.6→0.1.7）与发布后同步 | 未开始 |

总阶段 7（流程版本确认、修复复测、信息同步与发版确认、合并、发布、发布后同步、结束）：已完成 2（版本确认、修复复测）＋本轮 3 个执行批次（合并、版本收敛、种子收敛）；进行中 1（发布）；未开始 3（语义 tag/Release、UAT 部署、发布后同步）。

## 2. 实际修改与提交（按仓）

### Server（`Chikaaho/Smart-WorkFlow-aPaaS-server`）

| 提交 | 内容 | 验证 |
|---|---|---|
| `2d776ef`（快进，无新提交） | `bugfix/0.1.7` 8 提交合入 develop | 与 develop 无分叉 |
| `700559e` | 版本收敛：`pom.xml` `<revision>`→`0.1.7-SNAPSHOT`（34 POM 唯一来源）＋注释；`build-release.yml` 断言→`0.1.7-SNAPSHOT`（`push:main` 触发）；`build-prod.sh`／`check-version-identity.sh` 注释与断言同步 | `check-version-identity.sh pom`／`workflow`／`develop` 三模式 PASS（develop 模式 Maven 求值 32/32 项目＝`0.1.7-SNAPSHOT`） |
| `7bb2564` | 种子收敛＋0.1.7 升级通道：双方言 `V0.1.7__baseline_seed.sql`（＝V0.1.6 基线＋V0.1.7 增量逐字节拼接，h2 313,901 B／pg 337,040 B，checksum `-1195786777`／`2016046975`）；原文件归档 `db/upgrade/0.1.7/legacy-0.1.6/`；新增 `transition-history-to-0.1.7.*`、`upgrade-to-0.1.7-from-0.1.6.*`、`README.md`；11 个受影响测试按 0.1.7 口径更新 | 受影响测试 50 run／0 failures／0 errors／4 skipped（清单见 §3） |
| `ab5a372` | 修复轮遗留门禁红：新增 `com.sw.ck.form.dynamic.FixedTableSql`（固定系统表只读 SQL 唯一出口，未放宽 G1）；`FormAppScopeMatcher`／`FormAppManageController` 改经受控入口；3 个测试补 `FormAppScopeMatcher` bean、2 个测试 H2 夹具迁至 `sw_form_app_scope` | 4 个受影响类 31/0/0/0 |
| `a34d19d` | 修复轮演示种子与既有测试夹具 id 撞号：`P62NodeLevelGuaranteePgTest` 夹具操作员 `92101` 与 `R__0.1.7_org_demo_seed.sql` 的 `demo_b_hq_1`（租户 9002）同号，插入带 `ON CONFLICT (id) DO NOTHING` 致夹具行被跳过 → 命令消费身份回查租户不匹配 → 批次项不收敛；改用种子未占用 id `97101`（`sys_user` 与 `sys_user_role` 行 id 同步） | 该类复跑 4/0/0/0（95.9 s）；全量门禁本地复跑见 §3 |

### Web（`Chikaaho/Smart-WorkFlow-aPaaS-Web`）

| 提交 | 内容 | 验证 |
|---|---|---|
| `fe1712b`（快进） | `bugfix/0.1.7` 31 提交合入 develop | 与 develop 无分叉 |
| `4e89249` | `package.json` version→`0.1.7`（CI Release 标题/资产名来源） | `node -p` 回读 `0.1.7`；CI run `39067698896` **success**（四门禁＋Release） |

### 根仓（`Chikaaho/Smart-WorkFlow-Agent-Workspace`）

`2e3fe9e6`：探索回传（`search_fallback/release-017-close-readiness*.md`）＋两子仓 gitlink 同步（Server `7bb2564`、Web `4e89249`）＋既有方向/回执/记忆/待办批次。

## 3. 验证证据（实跑，原文位置）

- 种子收敛批次（Server `7bb2564`）：`FlywayFullChainH2Test` 17/0/0/0、`FlywayFullChainPostgresTest` 12/0/0/0、`ApplicationCenterLegacyUpgradeTest` 7/0/0/0、`ApplicationCenterUpgradeContinuityTest` 4/0/0/0、`P62NonEmptyUpgradePgTest` 3/0/0/0、`P64AppendMigrationUpgradePostgresTest` 1/0/0/0、`P64RollbackBoundaryPostgresTest` 1/0/0/0、`I6G7UpgradeDrillH2Test` 1/0/0/0；跳过 4（`ApplicationCenterRecoveryDrillPostgresTest` 1＋`Phase4PgMigrationBehaviourTest` 3，均需本机 PG 装置）。命令：`mvn -B -o -pl sw-bootstrap -am clean test -Dtest=…`。
- 门禁修复批次（Server `ab5a372`）：`DynamicTableSqlGateTest` 7/0/0/0、`FormAppAccessGuardTest` 7/0/0/0、`FormAppServiceTest` 10/0/0/0、`FormG2EntryConsistencyTest` 7/0/0/0。
- 版本身份：`scripts/check-version-identity.sh` 三模式（pom/workflow/develop）。
- **全量门禁（本地复跑 CI 步骤 6 的同一命令 `mvn -B -o clean test`）**：**BUILD SUCCESS**——全仓 32 模块零红，`sw-bootstrap` **259/0/0/32**；其中 `P63ReservationBoundaryPgTest` 11/0/0/0（102.8 s）、`P62NodeLevelGuaranteePgTest` 4/0/0/0（95.9 s，id 修复后）、`P62NonEmptyUpgradePgTest` 3/0/0/0、`FlywayFullChainH2Test` 17/0/0/0、`FlywayFullChainPostgresTest` 12/0/0/0。
- **CI 步骤 6 后半段本地复核**：`mvn -B -Pprod package -DskipTests -Drevision=0.1.7` **BUILD SUCCESS**（`sw-bootstrap/target/bootstrap.jar` 218,035,968 B）；`EXPECTED_VERSION=0.1.7 bash scripts/check-prod-artifact.sh` → **RESULT: PASS**（负向 0 违规、正向齐备，`build.version=0.1.7` 与期望发布版本一致）。即 CI 步骤 6 的三段（全量测试／prod 打包／制品门禁）在本机均已独立跑通。
- CI：Web run `39067698896` success；Release `build-4e892497…`（标题 `CH-aPaaS-Web 0.1.7 build 4e892497…`，资产 `dist-4e892497….zip` 1,347,131 B，公开下载 URL 200；解包 437 文件、入口 `assets/index--8dPEzSu.js`、`index.html` sha256 `25791112…`）；Server run 20（`7bb2564`）162 s 早失败→修复；run 21（`a34d19d`）886 s、run 22（`2f696f2`）821 s 均在同一区段失败（同仓历史成功运行 950—964 s；本机同命令全量门禁与步骤 6 三段均 BUILD SUCCESS/PASS）→ 因无 Actions 日志下载权限（`HTTP 403`）且连续两次同签名失败，按「连续失败两次须换路径」为发布工作流增加失败诊断步骤（`5af1329`：surefire 失败摘要以 `::error::` 注解输出，只读不改判定），据此重跑 run 23。
- 部署现状（远程只读回读）：后端 `build.version`＝0.1.6、健康 UP、8080 监听；DB versioned 终点＝单条 `0.1.6`（checksum `-1768731444`、success=t，＝S1 形态）；前端入口 `assets/index-BMLiWa_O.js`、assets 419 项；`bootstrap.jar` 217,870,418 B（＝0.1.6 正式制品）＋`.bak`／`.bak2`；磁盘可用 4.9 G、nginx/redis/postgresql 均 active、备份目录已有 0.1.5／0.1.6 窗口前 dump。

## 4. 偏差与已处置问题

1. **修复轮遗留红（已处置）**：0.1.7 修复轮新增 `V0.1.7__bugfix017`＋2 支 `R__` 后，链/升级演练测试断言仍绑定旧链（`I6G7*` 断言 11 条、`P64*`／`Phase4*`／`P62*` 断言终点 0.1.6、三个 `ApplicationCenter*` 演练）——本次收敛批次按 0.1.7 口径一并更新，更新后实跑全绿。
2. **Server 首轮 CI 红（已定位并修复）**：run `39067678981`（`7bb2564`）在 `mvn clean test` 120 s 处退出 1（同仓成功运行约 950—964 s）；本机无 `gh`、日志接口需管理员权限，改用公开 API 读运行/步骤时间戳＋本地复现定位到 `sw-biz-form-biz` 4 个测试类：①测试上下文缺 `FormAppScopeMatcher` bean；②`DynamicTableSqlGateTest.g1` 报 `FormAppManageController`／`FormAppScopeMatcher` 直接调用 `JdbcTemplate`（违反模块 G1）；③两个测试夹具仍为 `sw_form_app_user` 而生产口径已迁 `sw_form_app_scope`。修复轮收尾用 `-DskipTests` 打包，未覆盖这些用例。处置见 §2（`ab5a372`）。
3. **本机工具缺口（如实记录）**：无 `gh` CLI，GitHub Actions 日志与语义 Release 资产上传需令牌通道；制品下载可走公开 Release URL（已验证 200）。
4. **全量门禁暴露的第二项修复轮遗留红（已处置）**：`P62NodeLevelGuaranteePgTest` 3/4 失败（"批次项未在窗口内收敛"）→ 根因＝0.1.7 #41 演示种子（`R__0.1.7_org_demo_seed.sql`）与测试夹具 id 撞号（详见 §2 `a34d19d`）。**同时记录命名空间风险**：种子占用 9001/9002、9501—9504、9601—9634、91001—91007、91101—91114、92001—92007、92101—92114；`P62LightProcessE2ePgTest`（91001）、`I5PgTenantBehaviorBootTest`／`P62ResourceOpsAuthPgTest`／`P64AppendMigrationUpgradePostgresTest`／`Phase3ReferenceConcurrencyPostgresTest`／`PermissionConvergenceTest`（9001/9002）、`I5SsoBindingSessionBootTest`／`PermissionConvergenceFailSecureTest`（9501/9504）仍落在同号段但本次实跑未红——如后续重做演示种子，建议改用不与测试夹具重叠的独立号段。

## 5. 未完成内容与风险

- Server CI 需在修复后重跑（`ab5a372` → main），制品 `bootstrap-0.1.7.jar` 与 `build-<sha>` Release 待产出。
- 0.1.7 语义 tag/Release（对齐 0.1.6 的「成对语义 tag/Release」惯例）通道待定：本机无 `gh`；如需与 0.1.6 同形态的语义 Release 资产，请给出通道或授权（自动化通道已产出 `build-<sha>` Release 与版本化资产名）。
- UAT 部署未执行（属高风险动作，按手册 §8 在取得发布授权后窗口内执行；现网仍 0.1.6）。
- 历史清理（清单退出跟踪＋历史改写＋强推）未执行：需 Owner 对精确范围授权（范围与恢复方案见 `search_fallback/release-017-close-readiness.md` §Q2）。
- 演示种子 `R__0.1.7_org_demo_seed.sql`（租户 9001/9002、28 用户）随产品迁移自动装载，是否随 0.1.7 正式发布请规划/Owner 确认。
- 边界如实保留：含 TABLE 字段表单「发布新版本」被拒、节点字段三态运行期未消费等 9 项（清单见明细附表 §4）；第 25 项原表 N、增补 15 与 Owner 整体收口分别记录，不重开。

## 6. Git 与远端回读

| 仓 | develop | main | 说明 |
|---|---|---|---|
| Server | `ab5a372` | `7bb2564`（待重推 `ab5a372`） | main＝develop 曾同点 `7bb2564`，修复提交在 develop |
| Web | `4e89249` | `4e89249` | main＝develop，CI 绿，Release 已产出 |
| 根 | `2e3fe9e6` | —（`develop-sw`） | 含探索回传与 gitlink 同步 |

所有推送均以 `git ls-remote` 回读一致；未强推、未改写历史、未创建/移动任何 tag。

## 7. 自验结论

S1—S4 执行侧自验通过（证据见 §3）；S5 发布进行中（Server 修复已推送 develop，待合入 main 并重跑 CI）；S6/S7 未开始。功能状态、计数、P 编号与终态同步唯一值待规划下发后机械落实。
