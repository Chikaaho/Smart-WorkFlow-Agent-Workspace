# 0.2.1 发布与发布后同步回执（release-sync-021-01）

日期：2026-11-03。角色：执行（Executor）。等级：L。状态：第 5—6 阶段完成；交付状态按收口方向记 `PASSED`（发布与发布后同步完成，等待规划终态复核后为 `COMPLETED`）。

依据：`product/0.2.1-bugfix/ready/direction-close-release-021.md`、`product/0.2.1-bugfix/receipts/planning-owner-close-021.md`、`product/0.2.1-bugfix/receipts/close-sync-021-01.md`。

## 1. 阶段与结论

- 第 4 阶段（合并）：完成。两仓 `fix/0.2.1-bugfix`→`develop`→`main` 已推送并回读；修复分支已按 0.2.0 惯例删除并回读。
- 第 5 阶段（发布 0.2.1）：完成。tag、CI、制品与 UAT 部署分别核实。
- 第 6 阶段（发布后同步）：完成。knowledge 优先，随后同步 memory、根入口、两仓当前入口与发布文档。
- 总 7 阶段：已完成 6，进行中 0，未开始 1（第 7 阶段结束＝规划复核两份回执与发布事实、归档方向、确认 `COMPLETED`）。
- 唯一下一动作：规划复核本回执与 `close-sync-021-01.md`、发布/部署事实，归档方向并确认 `COMPLETED`；执行侧完成后等待 Owner 安排下一目标。

## 2. 合并事实

| 仓 | 修复分支 tip（已删除） | develop | main（当前） | 发布源（tag 指向） |
|---|---|---|---|---|
| Server | `6e83cd66` | `df725ea7` | `32b2e1aa` | `5c33eab3` |
| Web | `dbb2074` | `fd3e323` | `edbe121` | `07568b57` |

- Server 合并链：`6e83cd66`→merge `4dd3fb51`→版本收敛 `0b23c049`→迁移链断言修复 `c9e604ce`→main 合并 `654e7dda`→修复合并 `5c33eab3`→发布后文档 `32b2e1aa`。
- Web 合并链：`dbb2074`→merge `5c740ef`→版本收敛 `9785158`→main 合并 `07568b57`→发布后文档 `edbe121`。
- 两仓 `develop` 与 `main` 树一致（`git diff --stat develop main` 空）；`git ls-remote` 回读与本地 SHA 一致。
- 版本收敛：Server `<revision>0.2.1-SNAPSHOT</revision>`＋CI 断言/脚本注释同步（pom/develop/release 三模式 PASS）；Web `package.json` `0.2.1`。
- 修复分支删除：Server `fix/0.2.1-bugfix`（tip `6e83cd66`）、Web `fix/0.2.1-bugfix`（tip `dbb2074`）；删除前均验证 tip 已合入 main，远端与本地 refs 删除后回读为空。恢复指向见本节 tip。

## 3. 发布事实

| 项 | Server | Web |
|---|---|---|
| CI run | `41608817497` **success**（`5c33eab3`）；首轮 `41606793216` failure＝4 个迁移链断言未同步 `R__0.2.1`，未产出 Release/制品 | `41606814041` **success**（`07568b57`） |
| 测试计数 | 全量 **2337 tests / 0 failures / 0 errors / 34 skipped**（14 模块汇总） | 229 文件通过/1 跳过（230）；1996 通过/3 跳过（1999）；build 3.64s |
| annotated tag `0.2.1` | `90b5ce16`→`5c33eab3` | `88b3c050`→`07568b57` |
| 语义 Release | 「CH-aPaaS Server 0.2.1」资产 `bootstrap-0.2.1.jar` 218,553,737 B sha256 `188b476a1ff516a4756ae9e9e5da5944170612d68eac23807d950e50be955860`，`build.version=0.2.1` 实测 | 「CH-aPaaS Web 0.2.1」资产 `sw-web-dist-0.2.1.zip` 6,165,915 B sha256 `7558f0d73b9651efecc60f49c50dddbcf0692c8165b7a2a02641d061d24069e3`，入口 `assets/index-Bl0JsMZw.js` |
| `releases/latest` | 0.2.1 | 0.2.1 |

- 迁移：新增 `R__0.2.1_workspace_stat_metric_cards.sql`（h2/postgresql 各 26 行，四张独立指标卡种子，`WHERE NOT EXISTS` 幂等）；versioned 终点保持单条 `V0.2.0__baseline_seed.sql`；R__ 总数 18→19。
- Server 失败轮补记：`41606793216`（`654e7dda`）的 4 个失败测试类为 `FlywayFullChainH2Test`、`FlywayFullChainPostgresTest`、`I6G7UpgradeDrillH2Test`（期望 19 条=1+18）与 `ApplicationCenterLegacyUpgradeTest`（衔接新增期望 6 支）；修复提交 `c9e604ce` 同步更新上述断言为 20=1+19 / 衔接新增 7 支，并按同口径更新 `I6G7bOldBaselineUpgradePostgresTest`；受影响 5 类本地 41/0 通过后重推。
- Web 文档同步触发的 CI `41609984268` **success**（`edbe121`），自动生成 `build-edbe121…` Release；已将语义 Release `0.2.1` 恢复为 `latest`（`make_latest=true`）。

## 4. UAT 部署事实（8.166.112.85，既有通道）

- 发布前：磁盘 100%（`/api/actuator/health` 因磁盘空间健康指标返回 DOWN）；按 §9.2 清理历史 jar 备份（`.bak`/`.bak2`/pre0110）、轮转日志（`server.log-2026*` 581M→gzip 7.8M）、npm 缓存、旧 `/tmp` 制品与旧 `web.bak-*`；清理后可用 941M，health 恢复 UP。未停止或改动用户既有服务（reasonix 等）。
- 数据库备份：`/data/backup/smart_workflow_20261103_1658_pre021.dump` 646K，`pg_restore -l` 1239 TOC 项可读。
- 后端：`cp bootstrap.jar bootstrap.jar.bak`（0.2.0，sha256 `524cbf2f…`）→ 上传并校验 `bootstrap-0.2.1.jar`（server 端 sha256 `188b476a…` 与语义 Release 一致）→ 停服（PID 3025006）→ 替换 → 启动（PID 3152438）；`Started StarterApplication in 176.986 seconds`、启动段 ERROR **0**、`/api/actuator/health` `{"status":"UP"}`、`build.version=0.2.1`、Flyway 应用 `0.2.1 workspace stat metric cards`（success）、`sys_workspace_card_type` 9411—9414 四行实际存在。
- 前端：备份 `web.bak-20261103_1702`（0.2.0）→ 部署 0.2.1 构建；`index.html` 与发布 zip 逐字节一致（sha256 `4df424347a8b6ab0e7c0a094f34d531b8e98832266731645fa3e8c4771a9dc0d`），入口 `assets/index-Bl0JsMZw.js`；根路径 `/`、`/login`、`/workspace` 200；入口及引用资产 200；`/sw-server/api/actuator/health` UP。
- 部署后磁盘：669M 可用（jar 209M + 备份 209M 保留；DB dump 646K）。

## 5. 唯一终态值落位

| 字段 | 单一目标值 | 实际落位与回读 |
|---|---|---|
| 0.2.1 交付状态 | 第 3 阶段同步后 `PASSED`；发布及发布后同步完成、规划复核后 `COMPLETED` | knowledge/current-status、session-handoff、memory/state、features、handoff、version.json 记 `PASSED`（待规划复核） |
| 台账冻结 | 29 项全部通过，不通过 0、延期 0（根仓 `eb5fffb9`） | 台账未改；当前入口一致 |
| 完成功能数 | 49，不变 | 根 README、CHANGELOG、version.json、两仓入口一致 |
| 清单计数 | 46/22/22＝90，不变 | 同上 |
| ADV/问题 | 64/57，不变 | 同上 |
| P 编号 | 不新增核销 | 同上 |
| 里程碑/明细 ID | 无新增 | 同上 |
| 正式验证基线 | 新增/晋级 [] | 同上 |
| 正式/部署版本 | Server、Web 0.2.1 | tag/Release/CI/制品/UAT 四项回读一致 |
| 开发版本 | Server `0.2.1-SNAPSHOT`、Web `0.2.1` | pom/package/CI 断言回读 |
| 活动功能 | 0.2.1 至规划复核；之后无活动交付 | 当前入口记 0.2.1 待复核 |
| 唯一下一动作 | 规划复核并确认 `COMPLETED`；之后等待 Owner 安排下一目标 | 当前入口一致 |
| 主方向目录 | 两份方向由规划在终态复核后移至 `passed/` | 未移动（Executor 不移动方向） |

## 6. 覆盖矩阵

| # | 入口/路径 | 章节 | 是否受影响 | 权威来源 | 目标值/处理 | 回读结果 |
|---|---|---|---|---|---|---|
| 1 | `knowledge/current-status.md` | 顶部当前状态 | 是 | 发布/部署实测 | 0.2.1 已发布部署、7 阶段 6/0/1、tag/CI/制品/UAT、唯一下一动作 | 第 3—9 行已回读；旧 0.2.0 当前块无残留 |
| 2 | `knowledge/session-handoff.md` | 顶部当前续接 | 是 | 同上 | 0.2.1 续接与下一动作 | 第 3—9 行已回读 |
| 3 | `memory/README.md` `state.md` `handoff.md` `features.md` `issues.md` | 全文 | 是 | 同上 | 0.2.1 已发布部署、待规划复核；计数不变；运维磁盘观察 | 5 份全文回读；`wc -c` 见 §8 |
| 4 | 根 `README.md` | 当前发布段 | 是 | 发布事实 | 0.2.1 tag/Release/制品/UAT 与回执 | 第 13 行已回读 |
| 5 | `CHANGELOG.md` | 新增 0.2.1 条目 | 是 | 发布事实 | 发布、CI、制品、UAT、边界 | 第 3 行起 0.2.1 条目已回读 |
| 6 | `version.json` | 顶层/投影/规则 | 是 | 发布事实 | 0.2.1、开发版本、Flyway 终点、部署与回滚 | JSON 解析回读 `0.2.1/PASSED/V0.2.0` |
| 7 | `docs/ops/production-ops.md` | §8 发布记录 | 是 | 部署实测 | 0.2.1 制品与就地升级记录 | 第 210 行已回读 |
| 8 | Server `README.md` | 两处当前版本段 | 是 | 发布事实 | 0.2.1（含 0.2.0 补记） | 第 18/62 行已回读 |
| 9 | Server `功能清单.md` | 当前焦点行 | 是 | 发布事实 | 0.2.1 焦点行；旧 0.1.10 行转历史 | 第 52 行为 0.2.1；第 54 行为【历史焦点】 |
| 10 | Web `README.md` | 两处当前版本段 | 是 | 发布事实 | 0.2.1（含 0.2.0 补记） | 第 18/59 行已回读 |
| 11 | `product/0.2.1-bugfix/items.md` | 冻结汇总 | 否 | Owner 冻结 | 不改值 | 全文只读，29 项冻结行一致 |
| 12 | `product/0.2.1-bugfix/ready/direction-close-release-021.md` | 全文 | 否（规划） | 规划下发 | 只读，不移动 `passed/` | 全文只读 |
| 13 | `memory/constraints.md` `decisions.md` `architecture.md` | 全文 | 否 | 既有结论 | 无 0.2.1 当前值；历史 0.2.0 结论保留 | 逐文件回读 |
| 14 | `knowledge/known-issues.md` `features/` `feature-reconciliation-index.md` | 当前段 | 否 | 计数不变 | 0.2.1 不新增功能/问题登记 | 无 0.2.1 命中，计数未变 |
| 15 | 两仓发布配置（pom/CI/脚本/package） | 版本来源 | 是（第 4 阶段已改） | 用户确认 0.2.1 | 0.2.1/SNAPSHOT 与断言一致 | `check-version-identity` 三模式 PASS；`package.json=0.2.1` |

## 7. 旧现状残留检索

- 当前入口旧版本表述：`grep -rn "当前正式版本 \*\*0\.2\.0\|当前发布版本为 \*\*0\.2\.0\|当前正式发布版本为 \*\*0\.2\.0"`（knowledge/current-status、session-handoff、memory、根 README、两仓 README）→ **0 命中**。
- 旧下一动作：`grep -rn "待合并\|待发布\|待推送\|待同步"`（当前入口）→ 1 命中，为 `knowledge/current-status.md` 的 2026-10-30 历史条目（0.2.0 提示35）原文，属历史记录，不作为当前值。
- `0.2.1` 当前口径命中：current-status 10、session-handoff 4、memory/state 3、handoff 8、features 1、README 1、issues 3、CHANGELOG 6、version.json 19。
- 历史 0.1.x/0.2.0 段落保留原文并标注历史；两仓功能清单/README 的历史焦点保留。

## 8. memory 压缩

| 项 | 值 |
|---|---|
| 更新前 memory 总量 | 13,447 B（close-sync 后） |
| 更新后 memory 总量 | 13,756 B（8 文件） |
| 单文件上限 | 全部 <5,000 B（最大 `decisions.md` 4,656 B 未改） |
| 总量上限 | 13,756 B <20,000 B |

`wc -c memory/*.md`：README 888、architecture 857、constraints 2,313、decisions 4,656、features 534、handoff 2,616、issues 827、state 1,065。

## 9. Git 提交与回读

- 工作区 `develop-sw`：第 3 阶段同步 `2f540efe`（已推送回读）；本发布后同步批次随后提交并推送，`git ls-remote` 回读一致（文件不预填自身 SHA）。
- Server：`develop df725ea7`、`main 32b2e1aa`，远端同点；发布源 `5c33eab3`；tag `0.2.1`（annotated `90b5ce16`）→`5c33eab3`；修复分支已删除并回读为空；发布后文档提交触发 CI `41613030060`（`32b2e1aa`，同步时 in progress；仅文档，不影响 tag 发布源）。
- Web：`develop fd3e323`、`main edbe121`，远端同点；发布源 `07568b57`；tag `0.2.1`（`88b3c050`）→`07568b57`；修复分支已删除并回读为空；文档 CI `41609984268` success，`build-edbe121…` Release 已生成且语义 `0.2.1` 恢复 latest。
- 两仓 `main`/`develop` 树一致；`releases/latest` 两仓均为 `0.2.1`。

## 10. 如实披露

- Server 首轮 main CI `41606793216` failure：4 个失败测试类未同步新增 `R__0.2.1`（期望 19 条=1+18；衔接新增期望 6 支），失败轮未产出 Release/制品；修复 `c9e604ce` 后 `41608817497` success，无既有发布被覆盖。
- UAT 发布窗口磁盘 100%（0.2.0 发布时同样清理过）；本轮按 §9.2 清理历史备份与日志后完成升级，未停止或改动用户既有服务；部署后可用 669M，后续发布前需复核水位。
- 两仓 README 与 Server 功能清单的 0.2.0 发布后同步漏项在本轮第 6 阶段一并修正为 0.2.1。
- 发布后文档提交使两仓 `main` 前进到 `32b2e1aa`/`edbe121`，tag 与制品仍绑定发布源 `5c33eab3`/`07568b57`；Server 文档 CI 的最终结果以提交后回读为准，不影响已发布制品身份。

## 11. 自验结论

第 5—6 阶段完成：两仓合并、版本收敛、tag/Release、CI 制品与 UAT 部署均已按实际结果核实；knowledge 优先的当前入口同步、memory 压缩、残留检索与回读完成；未发现未解决的当前状态矛盾。0.2.1 交付状态按收口方向为 `PASSED`，等待规划终态复核确认 `COMPLETED` 并归档方向。
