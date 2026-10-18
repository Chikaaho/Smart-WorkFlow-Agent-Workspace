# 0.1.7 发布收尾回执 02（语义 Release、清单历史清理与信息同步）

2026-10-18｜Executor。依据：`product/0.1.7-bugfix/ready/direction-release-sync-017.md`（规划复核 `receipts/planning-review-release-017-01.md`、Owner 精确历史改写授权 `receipts/owner-history-cleanup-authorization-017.md`）。本回执覆盖该方向"本轮全部剩余项"三项：①语义 0.1.7 Release 及资产；②清单取消跟踪与历史清理；③同步遗漏补齐。整体交付维持 IN_PROGRESS（结束阶段未开始，不预填列车 COMPLETED）。

## §1 唯一同步值执行结果

| 字段 | 执行后值 | 处理 |
|---|---|---|
| 当前活动交付 | 0.1.7-bugfix | 保持 |
| 交付状态 | IN_PROGRESS（发布收尾执行侧完成，待规划最终终态复核） | 已同步各入口 |
| 已完成功能数 | 49，本列车新增 0 | 保持（未重算） |
| 清单计数 | 46/22/22=90 | 保持 |
| ADV/问题记录 | 64/57 | 保持 |
| P 编号 | 本次核销集合为空；P62 有限性能延期/策略 OFF；P65 待排期 | 保持（未猜测核销） |
| 本次里程碑明细 | Bug 修复阶段关闭；不新增业务明细 ID | 保持 |
| 正式制品版本 | 0.1.7 | 已核（Server jar `build.version=0.1.7`） |
| 开发版本 | Server `0.1.7-SNAPSHOT`；Web `0.1.7` | 已核实配置一致（无需修改） |
| 部署版本/DB 终点 | UAT 0.1.7/0.1.7 | 沿 01 回执 §7 |
| 发布源提交 | Server `5af1329`；Web `4e89249` | 已核（tag 目标） |
| Release 状态 | build Release 已产出；**语义 0.1.7 Release 已发布（本轮完成）** | 已同步各入口 |
| 整体进度 | 7 阶段：执行侧 6 项完成（流程版本确认、修复复测、合并、发布完善、信息同步、发布后同步），结束未开始 | 已同步各入口 |
| 唯一下一动作 | 规划复核本回执并确认最终终态（执行侧无待办） | 已同步各入口 |

## §2 语义 Release（两仓，本轮完成）

- 通道：既有 git 凭据（`git credential fill` 取用，全程未回显凭据值、未索要明文 token）；`gh` 不可用不构成阻塞。
- Server：[`CH-aPaaS Server 0.1.7`](https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-server/releases/tag/0.1.7)（Release id `416233017`，tag `0.1.7` → 提交 `5af1329`，非 draft/prerelease，`make_latest=true`，published `2026-10-18T04:34:51Z`）；资产 `bootstrap-0.1.7.jar` 218,033,508 B，GitHub digest `sha256:309e9e1ea33665aaa5cf020f7c9af71b7090d73bc63952f446b107303c325826`，state=uploaded，下载 URL 回读 HTTP 200。制品身份：`scripts/check-prod-artifact.sh` PASS（负向 0 违规；`build.profile=prod`、`build.version=0.1.7`）。
- Web：[`CH-aPaaS Web 0.1.7`](https://github.com/Chikaaho/Smart-WorkFlow-aPaaS-Web/releases/tag/0.1.7)（Release id `416235312`，tag `0.1.7` → 提交 `4e89249`，published `2026-10-18T04:41:18Z`）；资产 `sw-web-dist-0.1.7.zip` 1,347,131 B，digest `sha256:493dbaacd593c82e362fd1a3c2aecebc40ff455b388c09a24d618a67b6a214ad`，下载 URL 回读 HTTP 200。
- 资产来源与等价性：两资产即对应 `build-<sha>` Release 的同一次 CI 构建产物（下载后本地 sha256 与 GitHub digest 逐位一致），语义 Release 仅做版本化命名（对齐 0.1.6 形态）；未覆盖/移动任何既有 tag 或既有 Release 资产。
- `latest` 指向：核验时两仓 `releases/latest` 均为 `0.1.7`。后续文档提交若再触发 CI 自动 Release，`latest` 可能后移（与 0.1.6 轮同现象，属既有通道行为）。

## §3 清单历史清理（Owner 2026-10-18 精确授权，本轮完成）

- 范围刷新（不沿用旧 35 提交快照）：操作前核实受影响 refs 仅 `refs/heads/develop-sw` 与 `refs/remotes/origin/develop-sw`（各 25 个含目标路径的提交）；`main`、`refs/heads/codex/governance-evidence-rules`、两个 codex snapshot 与三个 codex turn-diff checkpoint 均 0 命中（不受影响、SHA 未变，"无关 checkpoint 保持"）。
- 备份（仓库外，`E:/code/backups-017-history-rewrite/20261018/`）：`workspace-mirror-before-rewrite.git`（mirror 全引用克隆，11 refs 与源一致、tip 一致、含清单 blob）；`refs-before.txt`、`ls-remote-origin-before.txt`、`log-develop-sw-before.txt`/`-detail-before.txt`、`checklist-objects-before.txt`、`tips-before.txt`、`status-before-rewrite.txt`、`filter-branch-output.txt`、`rewrite-tips.txt`；清单本地副本 `0.1.7bug.md.local-copy`（30,005 B，sha256 `491bec8148313252c31fe129a12b86d246ebebd9d34c0ecec5d49b10d6c412d7`）。
- 重写：`git filter-branch --index-filter 'git rm --cached --ignore-unmatch -q product/0.1.7-bugfix/0.1.7bug.md product/0.1.7-bugfix/1.0.7bug.md' -- 2cddb580..develop-sw`（范围 39 提交）。引用变化：`develop-sw` `168419819742c566ffb59569bff09074ce5687ed` → `efdbc1622f3fab16b7750723f73b90862ebf496b`；`git diff --stat` 旧 tip↔新 tip 仅清单 47 行删除；提交总数 686 不变（未使用 `--prune-empty`，结构保留）。本地恢复引用 `refs/original/refs/heads/develop-sw` = 旧 tip（保留，含被清理内容，如实披露）。
- 取消跟踪与忽略：清单退出跟踪（tip 树 `product/0.1.7-bugfix/` 仅剩 `ready/`、`receipts/`），`.gitignore` 新增两条（`0.1.7bug.md`、`1.0.7bug.md`），`git check-ignore -v` 命中 `.gitignore:41`；本地文件保留且 sha256 与备份一致。未新建任何受跟踪的清单副本。
- 推送（精确 lease，禁止无保护强推）：`git push --force-with-lease=refs/heads/develop-sw:168419819742c566ffb59569bff09074ce5687ed origin develop-sw` 成功；远端回读 `86a8b58e59e03aabe65b0818041bdfa1a05335cf`（含忽略提交），`main` 保持 `51732b1ec411da4053a30116ac5fe8c6b014d492` 未变。远端提示"Bypassed rule violations… Cannot force-push / Changes must be made through a pull request"——当前凭据具备该分支的绕过权限，属既有授权通道行为，如实记录。
- 全新克隆复核（仓库外 `fresh-clone-check/ws-check`）：HEAD = `86a8b58e`，`git rev-list --all --count -- <两路径>` = 0、路径日志为空、tip 树无清单、提交数 687、`ls-remote` 两分支一致。
- 保留边界（如实）：①托管侧缓存/旧对象在 GitHub 可能短期可达（旧 SHA 未删除、未申请 GC）；②其他克隆仍含旧历史，需按新 SHA 重新对齐（Owner 已知悉）；③本地备份与 `refs/original` 仍含被清理内容（仓库外 mirror 与副本为恢复入口，按 Owner 指示保留）。

## §4 信息同步逐入口处理结果

已更新（受影响）：

| 入口 | 处理 |
|---|---|
| `knowledge/current-status.md` | 顶部 0.1.7 条目改为"发布收尾：执行侧完成（语义 Release、历史清理、信息同步），待规划最终终态复核"；补语义 Release（链接/资产/digest/回读）、历史清理（范围/lease/克隆复核/保留边界）与唯一下一动作 |
| `knowledge/session-handoff.md` | 同口径更新顶部 0.1.7 条目（原 0.1.6 条目继续标记为历史） |
| 受影响边界记录 `memory/constraints.md` | 0.1.7 段新增边界：清单仅本地留存（已退出跟踪并忽略、历史已重写、其他克隆需重新对齐、禁止 `git add -f` 或新建受跟踪副本带回正文）；语义 Release 经既有凭据通道、不索要明文 token、不回显凭据值 |
| 根 `README.md` | 新增"## 当前发布"段（0.1.7 + 两仓公开 Release 链接与资产、发布源提交、开发默认版本、材料入口）与文档导航行 |
| `CHANGELOG.md` | 0.1.7 标题行与发布事实行更新：语义 Release 已发布（链接/资产/sha256/回读/latest） |
| `docs/ops/production-ops.md` | §8 0.1.7 段新增"正式制品获取"（两仓公开 Release 资产与 `build-<sha>` 等价说明） |
| `memory/README.md`、`state.md`、`handoff.md`、`features.md` | 当前任务块更新（语义 Release 已发布、历史清理已执行、7 阶段执行侧 6 项完成、唯一下一动作）；四文件 1,999/2,467/2,512/2,461 B，memory 目录合计 19,869 B（<20 KB） |
| `todo/requirement-pool.md` | 顶部改为"当前发布：0.1.7-bugfix IN_PROGRESS"（发布收尾执行侧完成、待规划最终终态复核），0.1.6 降为上一轮终态记录行 |
| Server `README.md`、`功能清单.md` | 补 0.1.7 公开 Release（资产/sha256）与收尾后的唯一下一动作；提交 `bcc87c3`（develop=main，已推送回读） |
| Web `README.md` | 补 0.1.7 公开 Release（资产/sha256）；提交 `264cca3`（develop=main，已推送回读） |

核实为一致、无需修改：两子仓实际版本配置（Server `pom.xml` `<revision>0.1.7-SNAPSHOT`、workflow develop 断言 `0.1.7-SNAPSHOT`；Web `package.json` `0.1.7`）。

未改动入口及事实理由：`knowledge/known-issues.md`（本次不新增/不关闭问题，计数 57 保持）；`knowledge/architecture.md`（无架构变更）；`todo/README.md`（无"暂不修复"决策变化）；`product/0.1.7-bugfix/ready/direction-bugfix-017.md`（修复方向已完成，无当前值变更）；`search_task/release-017-close-readiness.md` 与 `search_fallback/*`（探索任务已完成，按时点保留）。

## §5 三仓最新引用与 gitlink

- 工作区（本仓）：`develop-sw` = 本批提交（§6 推送后回读）；`main` = `51732b1e`（未变）；gitlink：Server = `bcc87c3`、Web = `264cca3`（本批同步更新）。
- Server：`develop` = `main` = `bcc87c3fffe625025ea63b2bea63b23890017d59`；tag `0.1.7` = `b6a69bd3`（annotated）→ `5af1329`。
- Web：`develop` = `main` = `264cca32ab95fc8fc5f18d9a1c0668a93250bfb8`；tag `0.1.7` = `c9e5cda1`（annotated）→ `4e89249`。

## §6 已完成与待办

已完成（本轮）：语义 Release 两仓发布与回读；清单历史清理（备份→重写→lease 推送→远端/克隆复核）与忽略；信息同步（§4 全入口）；收尾回执本文件；子仓文档提交推送与 gitlink 更新。

待办（非执行侧）：规划复核本回执并确认 0.1.7 列车最终终态（结束阶段）。可选观察：Server/Web 文档提交触发的 CI 运行结果（见 §7），以及后续文档提交可能再次移动 `latest` 指向。

## §7 偏差与如实披露

1. `filter-branch` 在脏工作树前拒绝执行（`require_clean_work_tree`，先于选项解析）：先 `git stash -u` 暂存规划侧未提交内容（memory 四件、方向文件、新回执），重写后恢复；`stash pop` 因"我方已删除该文件"将本地清单从工作树移除，已用仓库外备份副本恢复并核对 sha256 一致（内容零损失）。
2. 资产上传首次以 `--data-binary` 传输 218 MB 时 GitHub 侧"Upload body timed out due to inactivity"（资产停留在 starter 态）；改用 `--http1.1`＋`-H "Expect:"`＋`-T` 重传成功，最终 digest 与源制品一致（一次重试，非制品问题）。
3. Server 文档提交 CI：`8996692` 的 run `39078620834` **failure**——失败类为既有 **P63 预约窗口时序族**（`P63ReservationBoundaryPgTest` 11/1/0/0，84.64 s），与正式制品无关（发布制品来自 run `39075822129`/`5af1329` success），稳定性已登记 `todo/p63-reservation-test-timing-stability.md`；本轮新增的"失败摘要注解"诊断步骤按预期输出 `::error::` 注解（失败类可远程判读，无需日志下载）。本批 `bcc87c3` 触发 run `39098217671`，Web `264cca3` 触发 run `39098367264`，回执时均 in_progress，结果以 CI 页面为准。
4. Web 仓 commit-msg 门禁（commitlint `subject-case`）拒绝含大写拉丁词的主题（含历史提交在用的 "README …" 形态）；本次改用合规中文主题 `docs(release): 前端 readme 补 0.1.7 发布资产与摘要` 提交，未使用 `--no-verify`、未改动门禁配置。Server 仓无此限制，主题保持既有形态。
5. 发布验证沿用 01 回执 §3/§7 的集合（Web CI `39067698896` 四门禁、Server run `23`、种子收敛批次 50/0/0/4、UAT 实际升级与健康/版本回读），未重跑 Owner 已验收业务项，未将缺截图的 DOM 结果升级为正式视觉验收。

## §8 覆盖矩阵

| # | 方向要求项 | 结果 | 证据位置 |
|---|---|---|---|
| 1 | 语义 Release 及资产（两仓、可下载回读） | 完成 | §2；GitHub Release id `416233017`/`416235312` |
| 2 | 清单保留本地、退出跟踪、忽略 | 完成 | §3；`.gitignore:41`、`check-ignore` |
| 3 | 精确范围历史重写＋lease 推送 | 完成 | §3；`filter-branch-output.txt`、`ls-remote` |
| 4 | 远端回读与全新克隆复核 | 完成 | §3；`fresh-clone-check/ws-check` |
| 5 | knowledge/session-handoff/边界记录 | 完成 | §4 |
| 6 | 根 README/CHANGELOG/运维说明/memory 四件＋约束/需求池 | 完成 | §4 |
| 7 | 两子仓 README/功能清单/版本配置 | 完成（配置核实一致） | §4；`bcc87c3`、`264cca3` |
| 8 | 三仓引用/gitlink 回传 | 完成 | §5 |
| 9 | 保留边界披露（托管缓存/其他克隆/本地备份） | 完成 | §3 |

## §9 自检结论

三项剩余项均按方向与授权执行完毕，证据可复核：语义 Release 可下载且制品身份与发布源绑定；清单在本地留存、仓库与全部受影响 refs 的历史已不含其内容（全新克隆复核）；各入口当前值唯一一致（IN_PROGRESS、7 阶段执行侧 6 项完成、待规划最终终态复核）。未越界：`main`、两业务子仓、tag/Release 均未在历史重写范围内；未执行猜测计数、P 核销或功能终态。
