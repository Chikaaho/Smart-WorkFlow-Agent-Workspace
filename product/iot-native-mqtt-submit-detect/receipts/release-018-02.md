# 0.1.8 发布后同步回执（Executor）

> 触发：Owner 2026-10-19「通过，同步信息，更新状态，发版」＋版本号确认「0.1.8」。
> 依据：`system.md` §0.4.2 当前信息同步责任、§3.0 七步交付第 6—7 步、`roles/executor.md` §4.5（覆盖矩阵）。发布事实见 `release-018-01.md`（本回执不重复声明发布动作）。

## §1 唯一同步值（本轮）

| 字段 | 值 |
|---|---|
| 当前发布（正式） | **0.1.8**（Server `50a42c8`；Web `d94232b`） |
| 实际部署（UAT） | 后端 0.1.8（`build.version=0.1.8`，健康 UP、启动 175.771s、ERROR 0）；前端 0.1.8（新资产 `index-B0xXAIpx.js` 在役） |
| DB 终点 | V0.1.7（0.1.8 无新增迁移/无衔接脚本） |
| 开发默认版本 | Server `0.1.8-SNAPSHOT`；Web `0.1.8` |
| tag/Release | 两仓 annotated tag `0.1.8`；公开 Release（`bootstrap-0.1.8.jar` sha256 `5c0e66bd…`、`sw-web-dist-0.1.8.zip` sha256 `f62f1a8f…`）；**latest 回置 0.1.8**（文档提交 CI 生成的 `build-<sha>` Release 会短暂顶置，已回置并在 §4 记录） |
| 功能/交付状态 | 0.1.8 修复批次经 Owner **验收通过**；七步交付执行侧 COMPLETED（第 7 步结束条件满足：发布与再次同步完成、无本次授权内剩余动作） |
| 计数 | 功能 49、清单 46/22/22=90、ADV64/问题 57、P 核销空、P62 延迟/延期/OFF 保持（未重算、未核销） |
| 唯一下一动作 | 等待 Owner 选择下一任务（P65/P29 待排期候选） |
| 持续观察项 | 预约 `2112002084486819842`（due 2026-10-20 20:00 CST）将在 0.1.8 构建下到点 |

## §2 覆盖矩阵（逐入口）

| # | 入口 | 是否受影响 | 目标值 | 处理结果 |
|---|---|---|---|---|
| 1 | `knowledge/current-status.md` | 是 | 顶部 0.1.8 条目（发布/部署/DB/复验/披露/下一动作） | 已更新（新条目置于 10-18 条目之上，旧条目保留时点事实） |
| 2 | `knowledge/session-handoff.md` | 是 | 顶部 0.1.8 条目（同口径压缩） | 已更新 |
| 3 | `memory/README.md`/`state.md`/`handoff.md`/`features.md` | 是 | 当前块→0.1.8；上轮 0.1.7 转归档摘要 | 已重写（1,637/2,021/1,502/1,989 B） |
| 4 | `memory/constraints.md` | 是 | 新增 0.1.8 段（启动加载 server.env、设备腿口径、预约口径、CI 时序族、登录链、UI 选择器限制） | 已更新（4,311 B） |
| 5 | `memory/architecture.md`/`decisions.md`/`issues.md` | 否 | 无架构变更、无新问题计数/决策 | 未改（保持原值） |
| 6 | `version.json` | 是 | 0.1.8（含 flyway 终点 V0.1.7、资产 digest、运维注意） | 已更新 |
| 7 | `CHANGELOG.md` | 是 | 新增 0.1.8 段（发布事实/收敛/内容/UAT/复验/披露/边界） | 已更新 |
| 8 | 根 `README.md` | 是 | 「当前发布」段→0.1.8（Release 链接/资产/DB/运维注意） | 已更新 |
| 9 | `docs/ops/production-ops.md` | 是 | §6.4/§8.1 启动须加载 `server.env`；§8 增 0.1.8 制品获取与"无 DB 变更"说明 | 已更新 |
| 10 | `todo/requirement-pool.md` | 是 | 顶部→0.1.8 完成；0.1.7 降为上一完成 | 已更新 |
| 11 | Server `README.md`、`功能清单.md` | 是 | 发布段/焦点行→0.1.8 身份＋运维注意 | 已更新并推送（提交 `790fe88`，develop=main，回读一致） |
| 12 | Web `README.md` | 是 | 发布段→0.1.8 身份 | 已更新并推送（提交 `2e55cf1`，develop=main，回读一致） |
| 13 | 工作区 gitlinks | 是 | Server `790fe88`、Web `2e55cf1` | 已暂存并随本批提交 |
| 14 | 发布/构建真实版本来源 | 是 | `pom.xml` `<revision>`、Release workflow 断言、`check-version-identity.sh`、`scripts/build-prod.sh` 注释、Web `package.json` | 已收敛并经三模式门禁 PASS（见 `release-018-01.md` §1） |
| 15 | `product/iot-native-mqtt-submit-detect/receipts/` | 是 | 实现回执 §9（UAT 旧制品重走复验）、发布回执、本同步回执 | `implementation-01.md`（§9 已推送 `c19294cd`）、`release-018-01.md`、`release-018-02.md` |
| 16 | 远程分支清理 | 是 | 两仓任务分支删除并回读 | Server 仅余 `develop`/`main`/`feature/p62-perf-bounded-20261011`（按既有决定保留）；Web 仅余 `develop`/`main` |

## §3 三仓当前引用与远端回读

| 仓/分支 | SHA | 说明 |
|---|---|---|
| Server `main`=`develop` | `790fe88` | 发布提交 `50a42c8`（tag 目标）＋文档提交 `790fe88` |
| Server tag `0.1.8` | annotated 对象 `9523abd…` → `50a42c8` | 未移动/覆盖任何既有 tag |
| Web `main`=`develop` | `2e55cf1` | 发布提交 `d94232b`（tag 目标）＋文档提交 `2e55cf1` |
| Web tag `0.1.8` | annotated 对象 `59d6b53…` → `d94232b` | 同上 |
| 工作区 `develop-sw` | 本回执批次提交（提交后回读登记于 §4） | gitlinks→`790fe88`/`2e55cf1` |

## §4 操作后再次回读与残留检索

- 子仓文档提交（`790fe88`/`2e55cf1`）按既有通道再次触发 main CI 并生成新的 `build-<sha>` Release；`releases/latest` 一度后移（Web 实测为 `build-2e55cf1…`），**已用 `gh release edit 0.1.8 --latest` 回置**，回读两仓 latest=0.1.8。**补充事实**：Web 文档 CI（run `39216306086`）success；Server 文档 CI（run `39216284660`）**failure**＝`P62CompatRollbackPgTest` 2/1/0（5.2 s）——该提交仅改 `README.md`/`功能清单.md`（`git diff --stat 50a42c8..790fe88` 仅这两文件），与 CI 已成功通过的发布提交 `50a42c8` 代码逐字一致，故判定为 CI 环境/抖动；未生成 `build-790fe88` Release，server `latest` 保持 0.1.8。该失败类（P62 兼容回滚 PG 用例）建议纳入 CI 稳定性跟踪（与既有 `todo/p63-reservation-test-timing-stability.md`、`todo/p62-upgrade-gate-test-claim-race.md` 同类，未新建待办文件）。
- 旧现状表述检索（`0.1.7`／"当前发布"）：`knowledge/current-status.md`、`session-handoff.md`、`CHANGELOG.md`、根/子仓 README、`todo/requirement-pool.md` 中的 0.1.7 命中均为**历史条目/归档摘要**（带日期与时点事实），不作为当前值；当前发布口径唯一为 0.1.8。
- memory 体积：目录合计 **18,089 B**（<20 KB）；五件 1,637/2,021/1,502/1,989/4,311 B（均 <5 KB）。

## §5 未完成/边界（如实）

1. 持续观察项：预约 `2112002084486819842`（due 2026-10-20 20:00 CST）到点行为将于次日体现（本次不复验）。
2. `start.sh` 未加载 `server.env` 的加固建议已记录，**未修改脚本**（运维资产变更，待 Owner 决定）。
3. UI 日期选择器无法设定未来时间的问题已记录，未修（未在本轮范围）。
4. `P63ReservationBoundaryPgTest` CI 抖动沿既有待办跟踪（`todo/p63-reservation-test-timing-stability.md`）。
5. 首轮复验单（`20261019-007`）因设备连接缺口 fail closed、其预约 EXPIRED（登记时已过点），两处事实均已在发布回执披露。

## §6 自检结论

受影响入口全部同步且当前值唯一一致（发布 0.1.8＝部署 0.1.8＝制品 `build.version=0.1.8`；DB 0.1.7 为"无迁移"的有据结论）；发布动作（合并/CI/tag/Release/部署）与信息同步分别核实、分别记录；旧时点事实保留于历史条目；未越界（未核销 P、未改计数、未动运维脚本、未覆盖 tag/Release 资产）。**本轮交付按七步走完，结束条件满足**：无本次授权内剩余动作，等待 Owner 下一任务。
