# 0.1.6 版本收敛与发布（回执 01）

2026-10-16｜Executor｜五阶段连续执行中：①合入 develop ✓、②种子压缩与版本收敛 ✓、③合入 main ✓、④0.1.6 发版（Server CI 进行中；**Web 发布通道存在真实阻塞**）、⑤信息同步进行中（本回执+knowledge/memory/todo 已落）。

依据：`product/0.1.6-release/ready/direction-release-016.md`（唯一发布入口）；Owner 已确认版本 0.1.6（`product/delivery-lifecycle/ready/direction-owner-delivery-lifecycle.md`）。
范围：两仓普通合并/提交/推送与 0.1.6 发布；未删库、未强推、未改历史、未覆盖既有标签；未对 UAT 执行任何变更。

---

## 1. R016-01 两仓 feature 成果已进入 develop，发布差异归属清楚

操作声明（执行前）：仓库 Smart-WorkFlow-aPaaS-server / Smart-WorkFlow-aPaaS-Web，远程 `origin`，分支 `develop ← feature/application-center`；Server 范围 4 提交 `d7d376f..fd8b940`、Web 范围 1 提交 `3687d04..74d4be3`；均 0 落后，快进合并无冲突风险。

| 仓 | 动作 | 推送输出 | 远端回读（`git ls-remote`） |
|---|---|---|---|
| Server | develop ff `d7d376f→fd8b940` | `d7d376f..fd8b940 develop -> develop` | `fd8b9406cdcd00146023f28da2433b22cd879b0a` |
| Web | develop ff `3687d04→74d4be3` | `3687d04..74d4be3 develop -> develop` | `74d4be352e1a2130f54289e105805e33c344c4fb` |

差异摘要（响应不回传完整 diff）：
- Server 4 提交＝应用中心与表单分类统一实现（feat form `72822bc`）、提交/查询闸门接入（fix form `ed54e10`）、G2 剩余入口定向测试（test form `68fe73f`）、功能清单焦点（docs `fd8b940`）。
- Web 1 提交＝应用中心前端（后台应用管理/表单上下文/用户端应用中心/数据列表，`74d4be3`）。
- **并发新增差异（已核实、合法、纳入发布）**：Web `341b9a5 fix(governance): 修复模块清单并恢复导入边界覆盖`（2026-10-16 10:39，Owner 身份提交并推送）——`eslint.config.js` 模块清单由 `lowcode` 修正为实际目录并补 `form/job/storage`；属 Owner 明确纳入 0.1.6 的治理项（`delivery-lifecycle` Admin 补充请求②），由 Admin 域提交。
- 未捎带任何无关未完成工作（P62 性能策略等未触碰）。

## 2. R016-02 两方言 0.1.6 种子可初始化，结构与必要数据语义正确

种子构成（`sw-bootstrap/src/main/resources/db/migration/{h2,postgresql}/V0.1.6__baseline_seed.sql`）：
- = 新增段头 6 行 + `V0.1.5__baseline_seed.sql` 原文 + 来源标记 + `V20261015190000__application_center.sql` 原文；**拼接完整性脚本复核**：去新增段头后与旧两文件按序拼接逐字节一致（双方言通过）。
- 大小：h2 311,144 B；postgresql 334,275 B。Flyway checksum：h2 `-1890939561`；postgresql `-1768731444`（独立 CRC32 复算 + 全新库实跑 `flyway_schema_history` 读回一致）。
- 原两文件移入 `db/upgrade/0.1.6/legacy-0.1.5/{h2,postgresql}/`（独立升级通道，不进主扫描）。

新库初始化验证（实际命令与结果）：
- 定向测试集（clean 后）：`FlywayFullChainH2Test` 17/0、`FlywayFullChainPostgresTest` 12/0、`I6G7UpgradeDrillH2Test` 1/0、`I6G7bOldBaselineUpgradePostgresTest` 2/0、`Phase4PgMigrationBehaviourTest` 3/0、`P62NonEmptyUpgradePgTest` 3/0（通道A/B/C）、`P64AppendMigrationUpgradePostgresTest` 1/0、`P64RollbackBoundaryPostgresTest` 1/0、`ApplicationCenterLegacyUpgradeTest` 7/0、`ApplicationCenterUpgradeContinuityTest` 4/0、`ApplicationCenterRecoveryDrillPostgresTest` 1/0 —— 全新库共执行 11 条（V0.1.6 种子 + 10 R__）、validate 通过、重复 migrate 0 执行。
- 收敛前/后终态**等价性**（一次性本机程序，双方言，结构[表/列/默认值/可空/索引]+全表数据[时间戳归一、行排序]，剔除历史表）：H2 107,708 B、PG 143,127 B，两侧**逐字节 IDENTICAL**。
- repeatable/夹具边界：10 个 `R__` 随主链；`db/migration/devseed/**` 仅 dev 装载、生产制品门禁断言不含；测试库/夹具不进正式初始化（种子仅结构与必要初始数据）。
- 不做产物哈希（身份无疑点）。

## 3. R016-03 受支持存量路径保留数据、关联、运行实例与权限；重复启动/迁移不重放

新增 0.1.6 独立升级通道 `db/upgrade/0.1.6/`（README + 双方言脚本，**不在** Flyway 扫描路径内，停服窗口恰好一次）：
- `upgrade-to-0.1.6-from-0.1.5.*.sql`：已衔接 0.1.5、未应用应用中心增量（S1）→ 增量 DDL/承接（与 `V20261015190000` 逐字节嵌入）+ 历史收敛为单条 0.1.6（checksum 见 §2）。
- `transition-history-to-0.1.6.*.sql`：已应用增量（S2，开发库形态）→ 仅历史收敛。

实测（隔离环境）：
- **S1**：P62 通道A（旧链 0.1.10 全量+业务数据 → 0.1.5 衔接 → 0.1.6 升级脚本）/通道B（legacy 0.1.1 → 0.1.5 升级 → 0.1.6 脚本）：validate 通过、重复 migrate 0 执行、数据无损（行数+摘要一致）、目录与全新种子库一致、versioned 历史恰 1 条（0.1.6 且校验和一致）；应用中心 H2 承接 6 项 + 连续性 4 项（真实引擎运行任务：升级前后同一实例/任务、停用应用后原任务可办结）+ PG 恢复演练 1 项（备份→升级→就地覆盖恢复明确拒绝→空库恢复回到 0.1.5 边界→再次升级到 0.1.6）。
- **S2**（本轮新增覆盖）：P62 通道C（PG）+ `ApplicationCenterLegacyUpgradeTest` 新方法（H2）：0.1.5+增量形态 → transition 脚本 → 主链 validate 通过、零 versioned 重放、终点 0.1.6。
- 反向边界：旧迁移集对在役 0.1.6 库 validate 必须失败并指名 0.1.6（`P64RollbackBoundaryPostgresTest` 1/0，对照组旧集对旧终点/新链对新库均通过）。
- 不支持旧链（≤0.1.2、V94 等历史终点）维持既有边界，不强行升级；恢复口径=升级前备份→空库恢复（就地覆盖 pg_restore 明确失败已实测）。

## 4. R016-04 0.1.6 候选通过适用工程检查；main 承载与候选一致

- 版本回读：pom `0.1.6-SNAPSHOT`（正式构建 `-Drevision=0.1.6` 由 CI 剥离解析）；Server CI 断言已由 0.1.3 修正为 `0.1.6-SNAPSHOT`（Owner 治理项，本轮版本收敛提交）；Web `package.json` 0.1.6；`check-version-identity.sh pom` PASS（34/34 POM）。
- Server 本地检查：sw-bootstrap 模块全量 **301/4/0/27**；4 项失败归因（单独复跑实测）＝`P63ImmediateMqttBrokerPgTest`、`P63ReservationUnknownPgTest`（内嵌 MQTT broker 环境，0.1.5 起既有）、`Phase4PgStartWindowCrashTest`（登记既有装置时序 REG-P63-Phase4CrashTest，等强度替代在案）、`P63FlowAdmissionRecoveryPgTest`（负载时序；**单独复跑 1/0 通过**）。与发布变化无关（迁移等价性已证、逻辑未触碰）；全量旧基线 2072/3/0/27 的失败不用于豁免新结果，本次按实测记录。
- Web 本地检查：`web-four.log`（治理提交前 `74d4be3`）四连全绿（typecheck 0 / lint 0错误3警告 / vitest 169 文件 1549 通过+3 跳过 / build ✓）；当前 HEAD `3faaabd` 复跑：typecheck 通过、**lint 32 errors 失败**（原因见 §5 阻塞）、test/build 未继续执行。
- main 合入与回读：Server ff `d7d376f→e1aa67d`（`e1aa67d5fab3ae666d8d486d53b12d0b7f57d398`）；Web ff `3687d04→3faaabd`（`3faaabd7490164ddc678a4f283c38262b5734b57`）；均普通推送、远端回读一致。
- Server CI：run `38842087326`（main push 触发）**失败（3m01s 内完成全量门禁，exit 1）**：失败步骤="Production build（tests + prod package + artifact gate）"，sw-bootstrap 汇总 **255/2/0/34**，两项失败=`P63ImmediateMqttBrokerPgTest`（5.3s，`受控 broker 已就绪`断言失败：需外部受控 broker 进程 18830，任务自有启动脚本，CI 无此资产）、`P63ReservationUnknownPgTest`（84.1s，真实对端 9778 noreceive 模式缺失→命令停留 SENT 断言超时）；两者即 0.1.5 起登记在案的"两外部受控资产缺失=环境依赖既有失败"（P63 审查接受等强度替代），与本轮发布变化无关（两测试在本轮任何提交前后同因失败；迁移等价性已证、相关逻辑未触碰）。后续步骤（Locate JAR/Create Release）因门禁 fail-closed 跳过——**main 未产出 0.1.6 Release 与制品**。
- Web CI：run `38841988314` **失败**（1m43s，失败步骤 "Typecheck, lint, test and build"，typecheck 通过后在 `pnpm lint` 阶段因 32 errors 退出；证据 `evidence/web-ci-lint-failure.log`）。

## 5. R016-05 正式发布与运行环境（部分完成 + 真实阻塞）

**Web 发布通道阻塞（真实，非本发布代码变化引起）**：
- 现象：`pnpm lint` 32 errors（`import/no-restricted-paths`），涉及 15 个文件（14 个既有文件 + 本轮新增 `src/modules/form/views/AppFormDetail.vue` 1 处）；本地复跑与 GitHub CI 一致。
- 成因：并发治理提交 `341b9a5` 按 Owner 要求修复 `eslint.config.js` 模块清单（`lowcode`→`form` 并补 `job/storage`），**恢复/扩大**了工程宪法 §8 "modules/A 禁止 import modules/B" 的边界覆盖，使既有多年的跨模块 import 违规由"未覆盖"变为"命中规则"而显形；规则提示亦载明 façade 机制"骨架阶段暂未提供"。
- 处置判断：`eslint.config.js` 属工程配置（Admin 域，Owner 治理补充请求②"请Admin处理工程配置缺陷"）；32 项违规整改＝跨模块边界整改（`todo/frontend-eslint-module-boundaries.md` 既有待办，"待排期、抽空修复"），非本次发布授权范围，且"不得捎带无关未完成工作"；未回滚/篡改治理提交，未以配置豁免掩盖违规。
- 影响：Web CI 不产出 `build-<sha>` tag/Release 与 `dist` 制品；`pnpm test/build` 未在最终 HEAD 上取得干净绿灯（先前 `74d4be3` 四连全绿，其应用中心代码未变）。
- 解除条件：Owner/Admin 完成边界违规整改（或对门禁口径作明确裁决）→ 重推 Web main → Web CI 产出 0.1.6 发布。

**Server 发布**：CI 全量门禁失败（§4，两项外部资产缺失的既有失败，fail-closed），**无 Release/tag/制品产出**；语义 tag `0.1.6`（仓库既有的标注版本 tag 规范）**未创建**——为避免在 Web 未发布时形成"平台级 0.1.6 已发布"的误导，且两仓均未达发布准入，待双方通道解除后成对处理；不覆盖、不移动任何既有标签。

**运行环境（UAT）**：**未交付、未变更**（准入未通过→按方向不完成该通道；不做备份/停服/换包/改配置）。只读核验（既有通道，未改状态）：运行 0.1.5（jar 内嵌模块 `sw-common-0.1.5.jar`/`sw-bpm-api-0.1.5.jar`）、健康 200、DB `flyway_schema_history` versioned 终点=单条 0.1.5（**S1 形态**，解除后应使用 `upgrade-to-0.1.6-from-0.1.5` 脚本衔接）；证据 `evidence/uat-readonly-check.log`。UAT 实际变化与 Git 发布事实分列：Git=两仓 main 已含 0.1.6 内容；环境=仍 0.1.5。
- 明确：未把 CI 触发/上传/Release 当发布完成；未把发版等同于部署；未宣称为最终发布。

## 6. R016-06 当前入口同步（进行中，覆盖实际受影响项）

| 入口 | 是否受影响 | 处理 |
|---|---|---|
| `knowledge/current-status.md`、`session-handoff.md` | 是 | 新增 0.1.6 在途条目（含阻塞与下一动作），前条转历史；全文回读 |
| `memory/README.md`、`state.md`、`handoff.md` | 是 | 保留 Planner 七步流程与发布前摘要，补齐实际在途状态/阻塞/下一动作 |
| `todo/requirement-pool.md` | 是 | 当前发布路由更新为 0.1.6 在途+阻塞解除条件 |
| 根 README | 否 | 无状态/计数入口（零命中），不改 |
| Server/Web README、Server 功能清单 | 暂不改 | 发布未完成：0.1.5 仍为最近完成发布，避免预填未发生事实；解除后随终态同步统一更新 |
| `docs/ops/production-ops.md` | 暂不改 | 同上；0.1.6 通道 README（仓内）已随种子提交 |
| `search_task/release-016-progress-readback-20261016.md` | 是 | 已回传 `search_fallback/release-016-progress-readback-20261016.md`（不暂停发布、不额外启动验证） |
| product 当前链接 | 是 | 本回执入库；`delivery-lifecycle`、app-center 终审文档随本批入库 |

## 7. 阻塞记录（真实工具结果）

- `attempted`：仓库内 `pnpm lint` 复跑（本地）、CI 日志核对（gh run view）、违规清单归因（15 文件/32 错误逐条）、治理提交内容审阅（`git show 341b9a5`）、发布代码新旧违规甄别（`git diff 3687d04 74d4be3` 未新增跨模块 import）、处置边界判定（配置属 Admin 域、整改属既有待办、方向禁止捎带未完成工作）。
- `release_condition`：Web 边界门禁恢复绿色（违规整改或门禁口径经 Owner 裁决）→ 重推 Web main → CI 产出 Web 0.1.6 发布 → 成对语义 tag 与 UAT 交付（备份→S1 脚本→双端替换→可见浏览器最小业务链）。
- 责任域：Admin（工程配置与治理）/ Owner（裁决口径或排期整改）。

## 8. 证据位置（本机留存，不入 Git）

`product/0.1.6-release/receipts/evidence/`（INDEX 见同目录）：定向测试、模块测试、失败复跑、S2 测试、Web 四连×2、Web CI 失败日志、种子等价性运行与采集原文（双方言）、等价性程序副本、UAT 只读核验。原始完整输出不截断。

## 9. 补记（提交时点后的实际结果）

- Server CI run `38842087326`：**失败**（sw-bootstrap 255/2/0/34，两项既有环境依赖失败：`P63ImmediateMqttBrokerPgTest`、`P63ReservationUnknownPgTest`；其余已跑模块无失败）。与 Web 治理阻塞并列为阶段④的两项真实阻塞；两仓均未产出 0.1.6 Release/制品，UAT 未交付。解除路径见 §7（Server 侧需 Owner/Planner 裁决：为两项按既有"外部资产缺失按环境依赖隔离"口径做条件跳过，或在记录全量真实结果的前提下按 0.1.5 先例执行记录在案的候选构建，或为 CI 提供受控资产；不得自行跳过门禁）。
