# 0.1.7 收尾四项执行回执 01（close-maintenance-017）

2026-10-18｜执行→规划。方向 `../ready/direction-close-maintenance-017.md`；事实回传 `../../search_fallback/close-maintenance-017-facts.md`。与 `reopen-041-04.md` 同轮交付。

## 1. P62 遗留提交处置（逐项去向，裁决建议待规划确认）

16 提交逐项分类与等价性核实见事实回传。**执行方建议去向**（规划裁决前分支保留、不删除、不合入）：

| 去向 | 提交 | 依据 |
| --- | --- | --- |
| 摘取候选（需规划定性后按现行流程重新落地） | `08ed4c4`（openapi 回调租户挂起＋显式租户列） | main 无等价实现；若规划认定后台投递存在真实租户上下文缺口则摘取重落地（剥离装置耦合＋补测试），否则定性为装置处置保留延期 |
| 保留延期（P62 性能实验范围，Owner 搁置/策略 OFF） | `6335f7f`、`f2af26b`、`1105361`、`fe549dc` 及装置类 `b13b952`、`351c93e`、`9e2b07f`、`120bdbc`、`318b8a0` | 与 main 已复核 P62 合同语义相反或服务实验观测；迁移与 main 单基线形态冲突，不可原样落入 |
| 丢弃候选（不合并；历史随分支保留） | `4338c3f`、`83d582b`、`7caafb1`、`bc0bd03`、`a32cc76`、`7c30597`（docs 焦点行） | main 功能清单已演进越过其时点状态 |

未整分支盲合；`feature/p62-perf-bounded-20261011`（tip `7c30597`）保留。

**规划裁决（复核02，2026-10-18）**：9 项继续延期（`6335f7f`、`f2af26b`、`1105361`、`fe549dc`、`b13b952`、`351c93e`、`9e2b07f`、`120bdbc`、`318b8a0`；claimDue 越过准入截止的改变不符合已通过合同，其余随性能实验保留、策略 OFF）；历史焦点文档 6 项（`4338c3f`、`83d582b`、`7caafb1`、`bc0bd03`、`a32cc76`、`7c30597`）不合入、留分支历史追溯；`08ed4c4` 行为核实完成＝**真实生产路径缺口确认**（UAT 轮转日志与制品 CI 成功 run 日志均实证同栈失败；详见 `../../search_fallback/p62-openapi-callback-product-gap.md`），是否重落地待规划决定。P62 处置本次部分闭环。

## 2. 版本声明收敛

- 文件：工作区根 `version.json`（"单一机器可读源；变更须走新回执"——本回执即该回执）。
- 消费者核实：全仓 grep 仅 Markdown 文档引用（CHANGELOG/knowledge/方向），**无构建或运行时消费者**，不参与版本选择；真实版本选择链为 Maven `<revision>`（开发 0.1.7-SNAPSHOT／正式 `-Drevision=0.1.7`）、Web package.json `0.1.7`、Flyway `V0.1.7` 终点、UAT 运行包 `build.version=0.1.7`（已回读，见 reopen-041-04 §3.5）。
- 变更：`0.1.3`（registeredAt 2026-09-30）→ **`0.1.7`**（registeredAt 2026-10-18）；projections 对齐真实身份（Server mavenVersion 含正式/开发双值、Flyway 终点 V0.1.7、Web 0.1.7、manifest=Release 资产 digest）；登记 0.1.4—0.1.6 未轮转事实。非"只修显示值"：声明与真实构建/部署身份一致。

## 3. 权威状态轮转

- `knowledge/current-status.md`：**252,299 B → 4,348 B**。轮转前全量快照原样归档 `knowledge/history/current-status-through-2026-10-18-reopen-041-followup-before.md`（252,299 B，未删改）；当前文件保留：本轮 G1—G3 当前条目＋轮转说明＋归档指针。第41项返修、同版本覆盖与本收尾四项均在当前条目/回执中，未丢失。session-handoff/memory/需求池随本轮同步。**口径更正（复核02）**：memory 上限按全部 8 件统计，执行侧当时仅统计四件不足以证明总量；规划已在复核时直接压缩，现 8 件合计 **19,681 B**（每件<5KB）达标，无需为此重跑业务测试。

## 4. 已合并分支清理（精确集合与恢复记录）

核实方式：`git fetch --prune` 后 `git branch -r --merged main`，两仓与 Owner 口径一致（Server 9、Web 10，均无独有提交）。

Server 删除 8（tip 恢复记录）：`0.1.1-bugfix`→7ff4743、`0.1.2-bugfix`→fd704ff、`bugfix/0.1.7`→2d776ef、`codex/bugfix-20261013`→d7d376f、`feature/application-center`→fd8b940、`feature/p61-user-facing-message-humanization`→6698b8c、`feature/p64-mes-advanced-orchestration`→7a32bf1、`feature/release-016-ci-fix`→e115857。

Web 删除 10（tip 恢复记录）：`0.1.1-bugfix`→281892e、`0.1.2-bugfix`→8618922、`bugfix/0.1.7`→fe1712b、`codex/bugfix-20261013`→3687d04、`feature/application-center`→74d4be3、`feature/application-center-user-entry`→e5aa357、`feature/p61-msg-scope-corrected`→d110ed8、`feature/p61-user-facing-message-humanization`→29d90e8、`feature/p64-mes-advanced-orchestration`→628b1d9、`feature/release-016-ci-fix`→f91e8bf。

保留（回读 2026-10-18）：Server `develop`/`main`=f58e3ae、`fix/super-tenant-visibility`=f58e3ae（按方向持有至第41项复核通过且发布身份/恢复记录固定）、`feature/p62-perf-bounded-20261011`=7c30597（处置未定）；Web `develop`/`main`=264cca32。本地克隆未删任何引用（恢复可随时 `git push origin <sha>:refs/heads/<name>` 复原）。数量未作为删除条件，逐支按合并状态核实。

## 5. 未解决项

1. P62 提交去向：规划已裁决（9 延期/6 不合入）；`08ed4c4` 行为核实完成＝**真实生产路径缺口**（证据见 `../../search_fallback/p62-openapi-callback-product-gap.md`），是否重落地待规划二次裁决；裁决前分支保留。
2. `fix/super-tenant-visibility` 清理待第41项规划复核通过后另轮执行。
3. f58e3ae（纯文档）main CI run `39117957733` **failure**＝`P63ReservationBoundaryPgTest.concurrentCancelVsClaimHasExactlyOneWinner:487`（时序族实例，已追加 `todo/p63-reservation-test-timing-stability.md`）；同代码基 c6a7c06 制品 run `39115050365` success。纯文档 CI 与已发布制品 CI 严格区分，制品绑定（c6a7c06·b016b5cc）不受影响。
