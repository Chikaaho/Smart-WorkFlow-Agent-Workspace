# 0.1.10 开轮基线与 0.1.9 同步缺口核查（执行回执）

2026-10-21｜执行｜只读。三仓 `ls-remote`/`fetch`（未改工作树）＋远端 tip 回读＋既有回执。未改业务/配置/knowledge/memory，未建分支、发布或重跑测试。

## 结论

1. **0.1.9 发布、发布后同步、验收均已完成**，非"未同步/未验收"：终审 `product/readme-first-example-acceptance/receipts/planning-final-review-terminal-sync-019-completed.md` 判 **COMPLETED 7/0/0**。

2. **memory 停在 0.1.7 的直接原因是本机检出落后**：根仓本地 `develop-sw`=`de2140e1`（10-19 07:44），落后 `origin/develop-sw` **27 提交**；今天 10:06 规划会话在旧快照改写 memory（未提交）。远端 memory 09:35 已是 0.1.9 COMPLETED。
3. **唯一仓库级残留**：终审授权的 knowledge 机械传播未做——`current-status.md`（最后提交 09:01）、`session-handoff.md`（00:42）仍写 **4/2/1 待规划复核**，早于 09:35 终审；memory/todo/product 已 7/0/0。属**有证据未做**，非缺记录。
4. 本地根/Server/Web 分别落后 **27/24/21** 提交；0.1.10 须先同步、从核实后 develop 承接，**禁止直接提交或强推现有本地改动**。

## 1. knowledge 权威值 vs memory

| 项 | knowledge（远端 tip） | memory（远端 tip） |
|---|---|---|
| 活动任务 | README 首例灾备演练，功能 COMPLETED | 无活动业务/交付任务 |
| 交付阶段 | 4 完成／2 进行中／1 未开始 | 7／0／0 |
| 下一动作 | Planner 复核 `terminal-sync-019-01.md` | 等待 Owner 启动下一任务；UI 文案治理 READY |
| 计数/P | 49、46/22/22=90、ADV64/问题57、P 核销空、P62 延期/OFF | 同左 |

差异仅终审未传播；计数无冲突。以 knowledge 为准，应补传播而非重开验收。

## 2. 0.1.9 已核实事实

- **发布**：Server tag `0.1.9`（`ae69a12`）→`74716dd`，资产 `bootstrap-0.1.9.jar` 218,061,187 B sha256 `d416a979…`；Web tag（`eaf967e`）→`e967e24`，资产 `sw-web-dist-0.1.9.zip` 1,351,539 B sha256 `55978768…`。Release 页面存在；Latest 为 CI build。
- **部署（回执时点，未登录 UAT）**：健康 200、Web `index-DDQRXD9F.js`、Server `build.version=0.1.9`。
- **分支**：Server main=develop=`2d6b8f1`；Web=`2ac1a71`；根 `develop-sw`=`f2beb3be`，`main`=`f3fbda97`（治理线）。远端无 0.1.9 任务分支；Server 保留 P62 分支（延期）。
- **版本/DB**：Server `0.1.9-SNAPSHOT`、Web `0.1.9`；Flyway 终点 **V0.1.7**，`R__bf20261020_form_data_admin_grants.sql` 已应用。
- **本地未提交**：7 个 memory 已改（0.1.10 文本）＋`product/0.1.10-bugfix/`、`search_task/` 未跟踪；Server/Web 干净；gitlink 仍旧 `823190e`／`264cca3`。0.1.10 起点＝同步后 `f2beb3be`／`2d6b8f1`／`2ac1a71`。

## 3. 发布→同步→验收链

| 环节 | 证据/提交 | 时点 | 判定 |
|---|---|---|---|
| 发布 | `release-019-01.md`；tag/Release/UAT | 10-19 | 完成 |
| 同版本覆盖 | `republish-019-01.md`；`bf20261020-01..07.md` | 10-19～20 | 完成（Server 4／Web 5） |
| 业务验收 | `planning-review-20261021-passed.md` | 10-21 | PASSED |
| 同步 1 | `terminal-sync-019-01.md`；`ecdecb38` | 00:42 | 已交回 |
| 复核 1 | `planning-review-terminal-sync-019-01.md`（G1—G4） | 10-21 | VERIFYING |
| 同步 2 | `terminal-sync-019-02.md`；`976d11c2` | 09:01 | 缺口关闭 |
| 终审 | `planning-final-review-terminal-sync-019-completed.md`；`f2beb3be` | 09:35 | **COMPLETED 7/0/0** |
| 终审→knowledge | 已授权；tip 无对应提交 | — | **未做（唯一残留）** |

`f2beb3be` 只改 memory/product/todo，未触 `knowledge/`。

## 4. 落后入口与修正范围

**远端真实残留**：`knowledge/current-status.md`、`session-handoff.md` 需按终审传播。其余已一致：memory、`todo/requirement-pool.md`、根 README/CHANGELOG/version.json、product、gitlink；Server/Web 各当前入口均 0.1.9。

**本机检出**：根仓落后 27（仍 0.1.7，缺 0.1.8/0.1.9 product）；Server 24、Web 21。

**可沿用验证**：AC01—05、Web 1621 passed/3 skipped＋聚焦 26/26、Server 2141/0/0/27 skipped、边界 81/81、UAT 第七次覆盖可见验收。

**0.1.10 版本来源**：Server `pom.xml <revision>`；`build-release.yml` L46 硬编码 `0.1.9-SNAPSHOT`；`check-version-identity.sh` L12/158/159；`build-prod.sh` 注释；Web `package.json`；根 `version.json`。

## 5. 事实分级

- **已证**：Git 引用/包含关系、tip 内容、本地落后数、终审存在及时点、终审未触 knowledge。
- **回执记录（未独立复验）**：CI run、资产 sha/字节、UAT 现场、测试计数；Release 页面已抽查，sha 未复算。
- **未确认**：UAT 实时状态；资产摘要；本地 0.1.10 文件能否无冲突重放到 `f2beb3be`。
- **推测**：规划未 fetch 导致旧快照写入，未发现其他遗漏。
- **冲突**：knowledge 4/2/1 vs memory/todo 7/0/0，已定位为终审传播缺失。
- **需继续探索**：否。
