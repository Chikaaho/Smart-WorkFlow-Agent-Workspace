# 0.1.2 发布终态同步回执

- 日期：2026-09-28；角色：执行（Executor）；任务：`v0.1.2-release`（L）
- 依据：`product/v0.1.2-release/ready/direction-terminal-sync-20260928.md`（唯一终态值清单）与规划复核 `receipts/planning-review-release-20260928-passed.md`（发布交付 `PASSED`）。本回执为机械终态写入，未重复发布、构建、业务测试或部署；不自行归档本同步方向。

## 1. 唯一终态值逐文件对照

### knowledge/current-status.md（权威，先写）

| 唯一值 | 实际写入位置 | 实际值 |
|---|---|---|
| 发布任务终态 | 顶部发布条目标题与正文 | `v0.1.2-release` 终态 `COMPLETED（规划发布验收通过，终态同步待复核）`；规划复核 `PASSED` 及回执路径已登记 |
| 公开发布版本 / SHA | 顶部发布条目 | 0.1.2；Server `fd704ff12af3ccd99febaa700c523d7688e91509`、Web `5368e6c656c095acd3fe2cff1875c27ee5672307` |
| 正式 tag / Release / CI / 资产 | 顶部发布条目 | 两仓 annotated `0.1.2`；Release 非 draft/prerelease、Latest；run `36396145288`/`36396187465` success；资产 sha256 两值逐字保留 |
| 发布数据库版本 | 顶部发布条目部署句 | 终点 **V102**；**生产当前 V96，待部署应用 V97—V102**（原「V97→V102 随下次授权部署增量生效」表述已按规划澄清统一）；未部署 |
| 功能数 / 清单 / P | 顶部发布条目边界句 | 45（增量 0）、✅46/🟦22/⬜22（90）、ADV64、P 编号零变化 |
| 独立待办 | 顶部发布条目 | V012-CODE-001 仍 READY；外部渠道/IoT 实网保持既有延期边界 |
| 当前唯一下一动作 | 顶部发布条目末句 | Planner 复核终态同步回执；通过后等待 Owner 下一任务 |

### memory（四份当前入口：README / state / handoff / features）

| 唯一值 | README | state | handoff | features |
|---|---|---|---|---|
| 发布终态 `COMPLETED（规划发布验收通过，终态同步待复核）` | ✅ 当前行 | ✅ 发布段标题行 | ✅ 首条 | ✅ 当前行 + `v0.1.2-release` 条目 |
| 发布 SHA / tag / Release / CI / 资产 | ✅ 摘要行 | ✅ 发布身份段 | ✅ 第 3—5 条 | ✅ 条目 |
| 生产当前 V96，待部署应用 V97—V102，终点 V102；未部署 | ✅ | ✅ 部署边界段 | ✅ 部署条 | —（不涉及） |
| 修复阶段 COMPLETED（Owner 范围关闭，2026-09-28） | ✅ 历史行 | ✅ 头部 | ✅ 第 6 条 | ✅ `v0.1.2-bugfix` 条目 |
| 当前唯一下一动作 | ✅ | ✅ 末段 | ✅ 末条 + 终态同步段 | ✅ 当前行 |
| 清除旧「当前」矛盾 | 旧 IN_PROGRESS 行已标【历史】 | 旧 1570/V96/公开 0.1.0 现值已更新或标注历史 | 旧「下一动作=规划核对发布终态」已被替换 | 旧 `v0.1.2-bugfix` IN_PROGRESS 条目已改写为终态；2026-09-27 入口行已删（内容见归档与回执） |

- 字节数：四份合计 **16285 → 11697**（README 1365、state 3758、handoff 3029、features 3545；每份 <5KB、总量 <20KB 达标）。压缩范围：`state.md` 7746→3758，BAO Phase 1—6C/Final 阶段细节移出（权威历史在 `knowledge/current-status.md` 与 `product/backend-architecture-optimization/`），保留发布身份、锁定基线、接受边界与下一动作；其余三份为措辞更新。规划直接追加的「发布规划复核」段保留并标注历史。
- 规划对 `memory/handoff.md`、`memory/state.md` 的直接追加（发布复核段）原样保留，本同步在其基础上进行。

### 发布回执措辞澄清（规划复核 §文档澄清）

- `receipts/release-20260928.md` §9：改为「服务器部署与生产库迁移——生产当前 V96（2026-09-26 快照），待部署应用 V97—V102，终点 V102」，与其余段落统一；仅转录澄清。

### 版本与发布材料身份一致性

- `version.json`：`0.1.2`、Server mavenVersion 0.1.2 / Flyway V102、Web packageVersion 0.1.2、release/0.1.2/ 投影路径——与 `release/0.1.2/MANIFEST.json`（两仓 SHA、tag 对象、CI、资产 sha256）及 GitHub 公开 Release 一致；无「已部署」表述。

## 2. 计数与目录核对

- 计数勾稽：46+22+22=90 ✅；45+0=45 ✅；ADV64 不变 ✅；P 编号变更集合为空 ✅。未发现权威文件存在与唯一值冲突的后续 Owner 决策。
- 目录核对：`product/v0.1.2-release/passed/direction-v0.1.2-release.md`（规划已归档）✅；`ready/direction-terminal-sync-20260928.md` 留待规划复核后归档 ✅；`receipts/`：release-20260928.md、planning-review-release-20260928-passed.md、本回执 ✅；两仓 `0.1.2-bugfix` 主方向与修复方向已在 `product/v0.1.2-bugfix/passed/` ✅。

## 3. 同步文件快照与校验索引（规划只读边界外的实际文件）

- 快照位置：`product/v0.1.2-release/receipts/evidence/terminal-sync-20260928/`（`current-status.md`、`README.md`、`state.md`、`handoff.md`、`features.md`）。
- 校验索引 `SHA256SUMS.txt` 由 `shasum -a 256` 生成，生成后立即 `shasum -a 256 -c` 回读 **5/5 OK**（快照为写入完成后的最终内容）。

## 4. Git 提交与远端回读

- 本批仅暂存终态同步范围：`knowledge/current-status.md`、`memory/` 四文件、`receipts/release-20260928.md`（澄清）、`receipts/terminal-sync-20260928.md`（本回执）、`receipts/evidence/terminal-sync-20260928/`，以及规划先行落盘的方向归档移动（`passed/`、`ready/` 同步方向）。
- 分支：工作区既有跟踪分支 `develop-sw`；前一发布材料提交 `53467bc82a7f4b99dffa89e9fdfd4d876fa40da1`。本同步提交普通推送后回读 `origin/develop-sw` 与本地一致（0/0），提交 SHA 见机器终态 `progress_fingerprint` 与对话记录（文档不预填自身提交 SHA，按 §4.5.5 以提交后回读关联）。

## 5. 自验结论

唯一终态值已按清单机械写入 knowledge 与 memory 当前入口，旧当前矛盾清除且历史留存；版本与发布材料身份一致；计数与目录核对通过；快照与校验索引可回读。本回执以 `TERMINAL_SYNC_SUBMITTED` 提交，待规划全文复核；不自行归档本同步方向，不声明复核已完成。
