# 0.2.1 第 3 阶段验收与信息同步回执（close-sync-021-01）

日期：2026-11-03。角色：执行（Executor）。等级：L。状态：第 3 阶段同步完成，交付状态按收口方向唯一值记 `PASSED`（发布及发布后同步完成、规划复核通过后为 `COMPLETED`）。

依据：`product/0.2.1-bugfix/ready/direction-close-release-021.md`、`product/0.2.1-bugfix/receipts/planning-owner-close-021.md`、冻结台账 `product/0.2.1-bugfix/items.md`（根仓 `eb5fffb9`）。

## 1. 阶段与结论

- 第 3 阶段（验收与信息同步）完成：0.2.1 不重做业务/UI 验收，Owner 通过项 29 项全部锁定；本轮只做状态落位与覆盖核对。
- 总 7 阶段：已完成 3（需求评估；执行与逐项修复；验收与信息同步），进行中 0，未开始 4（合入 develop/main、发布 0.2.1、发布后同步、结束）。
- 唯一下一动作：Executor 执行第 4 阶段——两仓 `fix/0.2.1-bugfix` 合入 `develop`，收敛 0.2.1 版本与发布配置，完成发布要求的种子核对与受影响验证，再合入 `main`；随后连续发布 0.2.1 并做发布后同步。

## 2. 只读核实的当前事实（2026-11-03）

| 事实 | Server | Web |
|---|---|---|
| 修复分支 `fix/0.2.1-bugfix` | `6e83cd66`＝origin | `dbb2074`＝origin |
| develop | `c25f5ea5`＝origin | `3c1cfe2`＝origin |
| main | `39dcedb7`＝origin（0.2.0 发布） | `f5ec5a1`＝origin（0.2.0 发布） |
| 修复分支领先 develop | 3 提交，develop 是其祖先 | 43 提交，develop 是其祖先 |
| 工作树 | 干净 | 仅 `vite.config.ts` 在途改动（`allowedHosts: ['.chikaho.cn']`，+1 行，保护不提交） |
| 开发默认版本（当前实际） | `pom.xml` `<revision>0.2.0-SNAPSHOT</revision>` | `package.json` `"version": "0.2.0"` |
| 待收敛目标（第 4 阶段） | `0.2.1-SNAPSHOT`（CI 断言/脚本同步） | `0.2.1` |

已发布基线：Server tag `0.2.0`→`39dcedb7`（CI run 41097671140 success，`bootstrap-0.2.0.jar` 218,547,155 B sha256 `524cbf2f…`）；Web tag `0.2.0`→`f5ec5a1`（CI run 41092067995 success，`sw-web-dist-0.2.0.zip` 6,153,509 B）。0.2.1 尚未合并、发布或部署。

0.2.1 服务端改动含新增可重复迁移 `R__0.2.1_workspace_stat_metric_cards.sql`（h2/postgresql 各 26 行，B021-007 批次 5 独立指标卡种子）；无 versioned 基线改写。

## 3. 覆盖矩阵

| # | 入口/路径 | 章节/范围 | 是否受影响 | 权威来源 | 目标值/处理 | 回读证据 |
|---|---|---|---|---|---|---|
| 1 | `knowledge/current-status.md` | 顶部当前状态 | 是 | 收口方向唯一终态值＋冻结台账 | 写入 0.2.1 活动交付、29 项冻结、7 阶段 3/0/4、唯一下一动作、当前发布 0.2.0 与两仓 SHA | 文件第 3—9 行回读一致 |
| 2 | `knowledge/history/current-status-0.2.0-inflight-20261022-20261031.md` | 新增历史归档 | 是（旧当前块迁移） | 迁出前原文 | 0.2.0 在途快照 54,161 B 原样归档，主文件保留指针 | `wc -c` 54,161；归档首尾可读 |
| 3 | `knowledge/session-handoff.md` | 顶部当前续接 | 是 | 收口方向＋台账 | 0.2.1 续接、7 阶段 3/0/4、下一动作、保护项 | 文件第 3—9 行回读一致 |
| 4 | `knowledge/history/session-handoff-0.2.0-inflight-through-2026-10-31.md` | 新增历史归档 | 是（旧当前块迁移） | 迁出前原文 | 0.2.0 在途交接 1,857 B 原样归档 | `wc -c` 1,857 |
| 5 | `memory/README.md` | 全文 | 是 | 同上 | 活动交付、回执路径、下一动作、进度 3/0/4 | 951 B；回读一致 |
| 6 | `memory/state.md` | 全文 | 是 | 同上 | 两仓 SHA、冻结台账、下一动作、0.2.0 已完成基线 | 1,266 B；回读一致 |
| 7 | `memory/handoff.md` | 全文 | 是 | 同上 | 当前状态/已完成/未完成/风险/下一动作/完成标准 | 2,300 B；回读一致 |
| 8 | `memory/features.md` | 全文 | 是 | 同上 | 0.2.1 `IN_PROGRESS`，29 项冻结全部通过，第 3 阶段完成 | 499 B；回读一致 |
| 9 | `memory/issues.md` | 全文 | 是 | 冻结台账 | 无未关闭 B021 项；冻结后新问题另立序列；保护项保留 | 605 B；回读一致 |
| 10 | `memory/constraints.md` / `decisions.md` / `architecture.md` | 全文 | 否 | 既有约束/决策 | 无 0.2.1 当前值需要改写；其中“本版已全部 PASSED…终态已 COMPLETED”指 0.2.0，属历史结论 | 逐文件回读，无当前状态声明 |
| 11 | `product/0.2.1-bugfix/items.md` | 冻结汇总 | 否（只读核对） | Owner 冻结裁决 | 29 项全部通过、不通过 0、延期 0；不改值 | 全文回读，冻结行一致 |
| 12 | `product/0.2.1-bugfix/ready/direction-close-release-021.md` | 全文 | 否（规划文件） | 规划下发 | 只读；Executor 不移动 `passed/`、不改方向 | 全文回读 |
| 13 | `product/0.2.1-bugfix/receipts/planning-owner-close-021.md` | 全文 | 否（规划记录） | 规划记录 | 只读；作为冻结依据 | 全文回读 |
| 14 | 根 `README.md` | 当前发布段 | 否（当前正确） | 0.2.0 发布事实 | 记 0.2.0，与当前发布一致；0.2.1 发布后第 6 阶段更新 | `grep` 回读 |
| 15 | `version.json` | 顶层版本 | 否（当前正确） | 0.2.0 发布事实 | 记 0.2.0；第 6 阶段按 0.2.1 发布事实更新 | `cat` 回读 |
| 16 | `CHANGELOG.md` | 0.2.1 条目 | 否（发布后追加） | 发布事实 | 第 6 阶段按实际制品/CI/部署追加 | 未写入，计划在第 6 阶段 |
| 17 | 两仓 `README.md` | 「当前版本/当前发布」段 | 是（承接第 4 阶段） | 0.2.1 版本收敛 | 现状仍记 0.1.10（Server 另有一处 0.1.9），属 0.2.0 发布后同步漏项；按第 4 阶段版本收敛目标统一更新为 0.2.1 并回读 | 两仓 `grep -n "当前发布版本\|当前正式发布版本"` 已定位 |
| 18 | 两仓发布配置（pom revision、CI 断言、`check-version-identity.sh`、Web `package.json`） | 版本来源 | 是（承接第 4 阶段） | 用户已确认版本 0.2.1 | 当前仍 0.2.0/SNAPSHOT；第 4 阶段收敛并在合并前验证实际版本选择 | 逐项 `grep` 已定位，未在本阶段改值 |

## 4. 唯一终态值逐字段落位

| 字段 | 单一目标值 | 实际落位 |
|---|---|---|
| 0.2.1 交付状态 | 第 3 阶段同步完成后 `PASSED`；发布及发布后同步完成、规划复核后 `COMPLETED` | `knowledge/current-status.md` 顶部；本回执状态行 |
| 台账冻结结论 | 29 项（B021-001～029）全部通过，不通过 0、延期 0（根仓 `eb5fffb9`） | 未改台账；knowledge/memory 均记 29 项冻结 |
| 完成功能数 | 49，不变 | knowledge current-status、memory/state、memory/features |
| 清单计数 | 46/22/22＝90，不变 | 同上 |
| ADV/问题数 | 64/57，不变 | 同上 |
| P 编号 | 不新增核销，既有值不变 | 同上 |
| 里程碑/明细 ID | 无新增；B021 仅本版台账内使用 | 同上 |
| 正式验证基线 | 新增/晋级集合 []，保留既有基线 | 同上 |
| 正式/部署版本 | 目标 Server/Web 均 0.2.1（实际以第 5 阶段回读为准） | current-status 记目标值，当前实际仍 0.2.0 |
| 开发版本 | 按既有惯例收敛：Server `0.2.1-SNAPSHOT`、Web `0.2.1` | memory/state 记目标；第 4 阶段写入真实版本来源 |
| 活动功能 | 0.2.1 至发布后同步复核通过；之后无活动交付 | current-status、memory/state |
| 全部完成后的唯一下一动作 | 等待 Owner 安排下一目标 | current-status、memory/state |
| 主方向目录 | 两份方向在规划终态复核后由规划移至 `product/0.2.1-bugfix/passed/` | 方向文件保持在 `ready/`，Executor 未移动 |

## 5. 旧现状残留检索与分类

检索命令与结果（当前入口：`knowledge/current-status.md`、`knowledge/session-handoff.md`、`memory/*.md`、根 `README.md`）：

- `grep -n "当前软件发布为 0.1.10\|当前活动任务（2026-10-22）\|0.2.0 尚未验收"` → 0 命中（旧 0.2.0 在途当前块已迁入 history 归档）。
- `grep -c "0.2.1"`：current-status 10、session-handoff 4、memory/state 4、memory/handoff 10、memory/README 2、memory/issues 2、memory/features 1；命中均为本次 0.2.1 当前口径。
- 历史记录中的 0.1.9/0.1.10/0.2.0 在途条目保留原文，位于 `knowledge/history/` 或文件内明确的历史段落，不作为当前值。
- 两仓 `README.md` 的 0.1.10/0.1.9 当前版本表述为真实旧现状，已列入覆盖矩阵第 17 项，承接第 4 阶段版本收敛批次修正（不声明第 3 阶段已解决）。

## 6. memory 压缩结果

| 项 | 值 |
|---|---|
| 压缩前 memory 总量 | 12,922 B（8 文件） |
| 压缩后 memory 总量 | 13,447 B（8 文件） |
| 单文件上限 | 全部 <5,000 B（最大 `decisions.md` 4,656 B 未改；本轮最大 `handoff.md` 2,300 B） |
| 总量上限 | 13,447 B <20,000 B |

`wc -c memory/*.md` 实测：README 951、architecture 857、constraints 2,313、decisions 4,656、features 499、handoff 2,300、issues 605、state 1,266。

## 7. 验证与回读

- 本机初始化：`py -3 init/check.py --harness zcode` → `READY 1.3.3`。
- 两仓 `git fetch origin --prune` 后核对：修复分支与远端同点（Server `6e83cd66`、Web `dbb2074`）；develop/main 与远端同点。
- 修复分支领先 develop：`git rev-list --count develop..fix/0.2.1-bugfix` → Server 3、Web 43；`git merge-base --is-ancestor develop fix/0.2.1-bugfix` → YES（两仓）。
- 0.2.1 新增迁移：`git show --stat e8167d69` → `R__0.2.1_workspace_stat_metric_cards.sql` h2/postgresql 各 26 行。
- 版本来源定位：Server `pom.xml:40` `0.2.0-SNAPSHOT`；CI `.github/workflows/build-release.yml:46` 断言 `0.2.0-SNAPSHOT`；`scripts/check-version-identity.sh:158` 同断言。Web `package.json:4` `0.2.0`。
- 回读：`knowledge/current-status.md` 第 3—9 行、`knowledge/session-handoff.md` 第 3—9 行、memory 五份全文与 `wc -c` 结果一致。
- 本阶段零业务代码、零迁移、零服务启动、零数据写入。

## 8. Git 提交与回读

本回执与 knowledge/memory 同步、两份规划文件一并作为工作区 `develop-sw` 的独立文档批次提交；提交后回读远端 SHA，结果以提交后的 `git ls-remote` 回读为准（文件不预填自身 SHA）。两仓在本阶段无新提交；修复分支等待第 4 阶段合并。

## 9. 自验结论

第 3 阶段的状态落位、覆盖矩阵、残留检索与 memory 压缩均完成；0.2.1 交付状态按收口方向记 `PASSED`，等待第 4—6 阶段连续推进。两仓 README 旧版本表述已显式登记为第 4 阶段承接项，未在第 3 阶段谎称同步完成。
