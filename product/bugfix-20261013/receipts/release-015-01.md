# 0.1.5 阶段Ⅳ：版本收敛与合并（回执）

2026-10-15｜Executor｜阶段Ⅳ实现完成（待规划复核）。入口：`../ready/direction-release-015.md`。阶段Ⅴ进行中，本回执不含UAT发布结果。

本轮以两仓 `codex/bugfix-20261013` 的实际修复成果为输入，完成：迁移收敛（单一种子+升级通道）、发布门禁复验与漂移修复、Git 流转（修复分支→develop→main）、候选制品构建。

## 1. 发布内容（完整差异，非“53 个 bug”一语概括）

### 1.1 提交集合与范围

| 仓 | 来源分支 | 发布目标 | 提交数 | 文件变更 | 冻结覆盖 |
|---|---|---|---|---|---|
| Smart-WorkFlow-aPaaS-Web | `codex/bugfix-20261013` @ `02807fc` | `develop`→`main` | 48（含发布补充 1） | 134 files, +10988/−2492 | BF20261013-001—053 中前端项 |
| Smart-WorkFlow-aPaaS-Server | `codex/bugfix-20261013` @ `8c25932` | `develop`→`main` | 13（修复 11 + 发布收敛 2） | 107 files, +15567/−1563 | BF20261013-001—053 中后端项 + 迁移收敛 |

冻结集合覆盖核验：台账 `bug-ledger.md` 逐项登记的提交 SHA（去重 24 个，含日期误命中）在两仓分别做祖先校验——**两仓 NOT-ANCESTOR 计数均为 0**，即台账所述修复提交全部位于本次发布 tip 的祖先链内。台账逐项“执行证据/规划结论”列已记录每项回执、点验与提交，本回执不重抄。

### 1.2 差异按域归类（业务可读）

**Web（48 提交）**：登录续期 `1f90fa3`（BF001）；表单设计器交互与样式 `749f18e`→`b183657`、`67efae4`、`806c81c`、`67c0fce`、`329f6cf`、`67f8eca`、`6e81f6f`、`fbe37ed`、`1001c99`（BF002—016）；全局弹窗/文案 `b2cd0be`、`d6d2d47`（BF017、023/024）；流程设计器与连线 `31891cc`、`315aa58`、`4fa4538`、`d37201e`、`cf349d0`、`569354b`、`33f1ca5`、`be726f7`、`590a99e`、`097683f`、`d30b4ec`、`08e4e6d`、`e824a9c`、`60af4fe`、`de70f97`、`55abe3f`、`df78fc9`、`ffb7dbc`、`84070e2`、`f01e5f7`（BF018—040）；编号规则构建器与全链路 `c51fa05`、`34d54c5`（BF041—046）；页签/图标 `573afa6`、`d4c0ab8`（BF047）；列表与分类树 `1e0c788`、`adc478f`、`47cd2af`（BF048—052）；发布补充 `02807fc`（R015-01 备案链接、R015-02 根路径构建配置、版本号 0.1.5）。

**Server（13 提交）**：选择类字段数据来源与多选 `bd2962a`（BF009）；表单类型元数据与审批意见表单菜单 `e896e2e`（BF020）；脚本常用函数与 `#` 语法糖 `96e17f6`（BF021）；流程触发事件与变量自动取值 `f5babcc`、子流程发起人与来源嵌入 `01afe84`（BF022）；审批/会签术语统一 `65a0918`（BF026）；动作映射脚本源 `e9e9196`（BF027）；编号规则 `007c468`、全链路 `eb7f87a`（BF041、044/045）；事项归属管理菜单 `0f70460`、角色关联 `2342e9d`（BF051、053）。

**发布收敛与门禁修复（本轮新增 2 提交，非业务修复）**：`9c701b0` 迁移收敛单一种子与升级通道（详见 §2）；`8c25932` 修复轮遗留契约漂移 4 项与 0.1.5 版本身份（详见 §4.2）。

**未纳入**：应用中心（按 Owner 裁决留作下轮候选）、P62 延期性能分支（不自动合入）、53 项之外的任何新需求。

### 1.3 版本与构建身份

- Server `pom.xml` revision：`0.1.3-SNAPSHOT` → `0.1.5-SNAPSHOT`（develop 默认）；正式发布构建以 `-Drevision=0.1.5` 显式覆盖（沿用 0.1.3 既有约定）。
- Web `package.json` version `0.1.5`；`.env.production`：`VITE_APP_BASE_URL=/`、`VITE_API_BASE_URL=/sw-server/api`。

## 2. 迁移收敛（每方言单一种子）

- 主链现形态：`db/migration/{h2,postgresql}/V0.1.5__baseline_seed.sql`（唯一 versioned）+ 9 个 `R__` 可重复迁移。种子由旧链 `V0.1.0`—`V0.1.10` 逐字节拼接（保留来源段头）：h2 303,296 B / checksum `1778504403`；postgresql 324,606 B / checksum `-454928747`（Flyway CRC32 独立复算与执行记录一致）。
- 旧链档案：22 个文件以 **R100 纯移动**（0 增 0 删）迁至 `db/upgrade/0.1.5/legacy-0.1.x/{h2,postgresql}/`，内容不变；`db/upgrade/**` **不在** Flyway locations（locations 仍为 10 条 `db/migration/{vendor}` 文本），不参与自动执行，避免遗漏与重复执行。
- 升级通道（恰好执行一次，重复执行在无守卫语句处显式失败）：
  - `transition-history-to-0.1.5.{postgresql,h2}.sql`：适用于已应用旧链全部版本的在役库——把 versioned 历史替换为单条 0.1.5 种子记录（`installed_rank=MAX+1`），业务数据与 `R__` 记录一律不动。
  - `upgrade-to-0.1.5-from-0.1.1.{postgresql,h2}.sql`：适用于停在上游版本（0.1.1）的库——增量 DDL + 同一历史衔接段。
  - `README.md`：入口状态表（0.1.10→transition；0.1.1→upgrade；0.1.2—0.1.9→组合；≤0.1.2 不支持）与 checksum 依据。
- 开发新增迁移约定：`V<yyyyMMddHHmmss>__<功能需求>.sql`；`P64AppendMigrationUpgradePostgresTest` 以追加时间戳迁移演示“0.1.5 种子库 + 时间戳迁移”可共存（见 §3）。
- 种子等价性（旧链终点 vs 单一种子终点，双方言实测）：采集表/列/索引/逐表数据（时间戳归一 `TS`、行按字典序、剔除 `flyway_schema_history`）——**postgresql 118 表 142,271 B sha256 `9b5afa26…d2a8aa27`、h2 118 表 155,220 B sha256 `af90ec59…0bf2f85b`，新旧两侧逐字节一致（`cmp` 退出码 0）**。
  说明：H2 侧首次探针因 `INFORMATION_SCHEMA` 大小写过滤写错而采空（36 B 空表集），该空采集不作为证据；已修正探针重采 118 表并替换证据文件。PG 侧首次采集即为有效采集，未受影响。

## 3. 升级通道与历史衔接的受控验证

- 常驻测试（均为分支内新增/重写的锚测试，随发布提交进入 main）：
  - `P62NonEmptyUpgradePgTest` 2/0：通道A＝legacy 全链 0.1.10 + 业务数据 → transition 脚本 → validate 通过、重复启动零重复执行、数据无损、目录与全新种子库一致；通道B＝legacy 0.1.1 → upgrade 脚本 → 同组断言。
  - `P64AppendMigrationUpgradePostgresTest` 1/0：0.1.5 种子非空库追加时间戳迁移后，存量 `graph_json` 逐字节保持、新表零写回、历史恰两条。
  - `P64RollbackBoundaryPostgresTest` 1/0：以旧链迁移集对在役 0.1.5 库执行 validate **失败且 `invalidMigrations` 含 0.1.5**（证明反向拼接会被门禁识别而非静默通过）；对照组旧集对旧终点库、新链对新库均通过。
  - Flyway 全链/钻取/Phase4 锚测试同步改按单一种子（10 条 locations、终点 0.1.5、appliedMigrations 期望）。
- 真实开发库衔接（受控、可恢复）：本机 `sw_apaas_bugfix`（PostgreSQL 16.15，原 0.1.10：11 条 versioned + 11 条 `R__` 历史行）
  1. 先备份历史表：`pg_dump -t flyway_schema_history --data-only --column-inserts` → 54 行备份文件（证据目录内）；
  2. 执行 `transition-history-to-0.1.5.postgresql.sql`：`BEGIN / DELETE 11 / INSERT 0 1 / COMMIT`；
  3. 回读：versioned 仅 `0.1.5 | V0.1.5__baseline_seed.sql | -454928747 | success=true`，11 条 `R__` 行保持；
  4. Flyway 11.3.4 实测：**validate 成功（12 migrations）→ migrate “Schema public is up to date. No migration necessary”，`migrationsExecuted=0` → 二次 validate 成功**，即衔接后重复启动零重复执行；
  5. 业务表 168 张、数据未改动（脚本仅作用于历史表）。
  - 9 个 `R__` 文件的现行 checksum 与库中最新历史行逐条一致（列对照；含历史遗留的重复 `R__` 行，Flyway 以最新行为准，未清理）。
- 明确的**不适用**边界：远程 3897 上的 `sw_apaas_local`（V94）、`sw_apaas_test`（V102）为 ≤0.1.2 旧链库，按 0.1.3 以来的边界不支持原地升级（不属本次授权动作）；本机 `smart_workflow`（V9 旧链）与两个冻结验收证据库（`sw_p64_phase3` 0.1.9、`sw_p62_accept` 0.1.3）均未触碰。

## 4. 门禁与真实结果

### 4.1 全量测试（Server）

`MAVEN_OPTS=-Xmx2g mvn -B -pl sw-bootstrap -am test`：**Tests run 290 / Failures 3 / Errors 0 / Skipped 27**（27:07，日志存证据目录）。

- 3 项失败为**修复轮起即存在、与本次改动无关的历史已知基线**，如实记录、不修：`P63ImmediateMqttBrokerPgTest`、`P63ReservationUnknownPgTest`（内嵌 MQTT broker 时序）、`Phase4PgStartWindowCrashTest`（启动窗口时序）。
- 修复轮首次全量同命令为 7 失败，其中 4 项属本次发布阻塞漂移，已在 `8c25932` 最小修复并复验消除（下节）。
- 未跑：Web 侧四门禁与构建（已在 Web 批次回执记录）、无人值守 E2E、性能类（P62 延期分支不在范围内）。

### 4.2 发布阻塞漂移的处置（4 项，均登记为关联项）

| 现象 | 根因 | 处置 | 复验 |
|---|---|---|---|
| `BilingualMessageContractTest` 报 `bpm.theme_rule_required 缺 zh-CN` | 修复轮新增 `BpmErrorCode.THEME_RULE_REQUIRED(2109)` 时漏配双语资源 | `messages_zh_CN/en_US.properties` 补键（zh：尚未配置流程编号规则，请先设置编号规则后再发布） | 9/0 |
| `ErrorCodeCatalogTest` 常量总数 179≠180 | 新增常量未同步目录与测试 | `docs/governance/error-code-catalog.md` §2 计 180、唯一数值码 175，补 2109 行；测试期望同步 | 8/0 |
| 同上（唯一数值码 174≠175） | 同上 | 同上 | 同上 |
| `ApiOptionalContractGateTest`：`NodeTriggerEventPort` 两方法返回 `void` | BF022 新增回调端口未遵守 `-api` Optional 契约 | 端口两方法改返回 `Optional<Long>`（本次实际评估的触发器数量；实例不可达 `empty`），装配实现与 `TriggerExecutionService` 返回计数；调用方忽略返回值不变 | 6/0 |

受影响三测试合计 23 tests / 0 failures；随后全量复跑即 §4.1 结论。

## 5. Git 流转（操作前已按方向声明范围：仓库/远程/分支/精确范围）

| 仓 | 动作 | 推送输出 | 远端回读（`git ls-remote`） |
|---|---|---|---|
| Web | `develop` ff `8c400b0`→`02807fc`；`main` ff `e3ae316`→`02807fc` | `8c400b0..02807fc develop -> develop`；`e3ae316..02807fc main -> main` | `refs/heads/{codex/bugfix-20261013,develop,main}` 均 `02807fcba14f895f037ba2dc2bfac0ed2c1051c5` |
| Server | `develop` ff `b962648`→`8c25932`；`main` ff `8e23a2d`→`8c25932` | `b962648..8c25932 develop -> develop`；`8e23a2d..8c25932 main -> main` | 三 ref 均 `8c2593254e7581c63f6a10768a44678a579b8fc3` |

- 提交链：Server `2342e9d`（修复轮 HEAD）→ `9c701b0`（迁移收敛）→ `8c25932`（漂移修复+版本身份）；Web 修复轮 HEAD `47cd2af` → `02807fc`（发布补充）。
- 均为 fast-forward，无强制覆盖、无历史改写；未新增/移动 tag 或 Release（方向 §35：缺具体授权时只保留候选制品）。
- 工作树归属：两仓 `git status --porcelain` 为空（本轮提交后）；根仓本批次提交 Planner 既有文档、本回执与 gitlink 更新（根保持规划分支，gitlink 只指向上述已推送子仓提交）。

## 6. 候选制品（与阶段Ⅴ部署制品对应）

| 制品 | 构建命令 | 大小 | 校验和 |
|---|---|---|---|
| `sw-bootstrap/target/bootstrap.jar`（Server 0.1.5） | `MAVEN_OPTS=-Xmx2g mvn -B -Drevision=0.1.5 -DskipTests package` | 217,676,892 B | sha256 `645615781a9d37ade7eb8b4f0c7be9c396b34ebf356d59801c07263085797e3e` |
| `Smart-WorkFlow-aPaaS-Web/dist`（Web 0.1.5，base `/`） | `npm run build`（02807fc 源码） | 目录（阶段Ⅴ打包计校验和） | index.html 资源引用 `/assets/…`；登录页 chunk 含备案链接文案与 `https://beian.miit.gov.cn/` |

制品身份核验：fat jar 内嵌模块 jar 名为 `sw-common-0.1.5.jar`、`sw-bpm-api-0.1.5.jar`（`-Drevision=0.1.5` 生效）；jar 内迁移资源每方言仅 `V0.1.5__baseline_seed.sql` + 9 `R__`，`db/upgrade/0.1.5/**` 31 项随包分发但不进 locations；i18n 修复已随包（`sw-common-0.1.5.jar` 内双语 `theme_rule_required` 均在）。

## 7. 证据位置与不入库说明

本机证据目录 `receipts/evidence/release015-squash/`（按根 `.gitignore` 的 `product/**/evidence/` 规则仅本机留存，不入 Git）：全量测试日志、种子 checksum、双方言等价性采集原文与 sha256、H2 采集程序副本、早期临时等价性测试报告；`receipts/evidence/release015-db/`：开发库历史表备份（`pg_dump --data-only --column-inserts`）、transition 前后回读、Flyway validate/migrate 输出。

## 8. 状态与下一步

- 阶段Ⅳ实现完成（本回执提交后按方向 §59 更新总阶段 4/1/0，Ⅴ进行中）；不自行裁决整体 COMPLETED。
- 阶段Ⅴ（依赖已满足、已授权）随即开展：读手册核实 UAT 现状 → 备份（DB/制品/配置，含原根路径站点与配置可恢复副本）→ 上传 `upgrade-to-0.1.5-from-0.1.1.postgresql.sql` 与候选制品 → nginx 根路径改造（保留 `/sw-server`、`WW_verify`，旧 `/sw` 重定向并记录）→ 启动/健康/连通验证 → 可见浏览器验收（登录与续期、设计入口、发起→待办→处理→结果、迁移触及的权限/菜单、R015-01/02）→ 回执 `uat-015-01.md`。
