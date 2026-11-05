# 0.2.2 终态传播回执（final-propagation-022-01）

日期：2026-11-05。角色：Executor。依据：`product/0.2.2/ready/direction-final-propagation-022.md`、`product/0.2.2/receipts/planning-final-review-022-completed.md`（revision 18 FINISH）。

本批只传播裁决，不派实现、不操作 UAT、不动 tag/Release。

## 一、覆盖矩阵（入口 → 写入值 → 回读结果）

| 入口 | 写入值 | 回读结果 |
|---|---|---|
| `knowledge/current-status.md` | 头部状态：0.2.2 **`COMPLETED`**（规划 2026-11-05 终态复核），七阶段 **7/0/0**；正式/部署 0.2.2（tag `0bf4c938`/`3bcd7c2`），UAT Flyway v0.2.6/pgvector 0.8.7/health UP；分支头 Server `3c4942f0`、Web `9dd7e7b`；无活动功能，下一动作＝等待 Owner 安排下一目标；新增第 7 阶段终态段，第 3、4—6 阶段标题改为「已复核」 | 与终态值表、审查记录一致 |
| `knowledge/session-handoff.md` | 当前续接改为「无活动交付（0.2.2 已 COMPLETED）」；保留发布/部署/分支头事实；下一动作＝等待 Owner 安排下一目标，并列出 Owner 待核对的供应商格式事项 | 一致 |
| `knowledge/features/0.2.2-integrated-release.md` | 状态行改为 **`COMPLETED`**（终态复核 revision 18 FINISH），七阶段 7/0/0，无活动功能；登记终态传播回执 | 一致 |
| `version.json` | `version`=0.2.2；development `targetVersion`=0.2.2、`status`=COMPLETED、statusNote 7/0/0；分支头 Server `3c4942f0`、Web `9dd7e7b`；迁移终点 h2/postgresql 均 **V0.2.6**；releaseNotes/manifest/deployment 写入 tag、资产、UAT 与 pgvector | JSON 解析通过；字段与发布/UAT 回读一致 |
| 根 `README.md` | 「当前发布」改为 **0.2.2**：tag→`0bf4c938`/`3bcd7c2`、资产大小与 sha256、发布后分支头、迁移终点 V0.2.6、UAT 启动/health/Flyway/pgvector | 一致 |
| `CHANGELOG.md` | 顶部新增 0.2.2 条目：发布事实（合并/CI run/制品/tag/Release/latest/分支同步）、版本与迁移、F1+F2 内容与计数（功能 50 等）、UAT 交付、终态 COMPLETED 与回执链 | 一致 |
| `todo/requirement-pool.md` | 0.2.2 段标题改为「已完成（2026-11-05 COMPLETED）」；补第 7 阶段终态、终态传播回执与「无活动交付，等 Owner」 | 一致 |
| `memory/` | 规划已先行改写；Executor 仅核对：state/handoff/features/README/issues 均为 `COMPLETED`、七阶段 7/0/0、无活动交付、下一动作链正确，**未发现需修正的偏差**（本批未改 memory） | 一致 |

## 二、`releases/latest` 回读

| 仓 | `releases/latest` | 资产 |
|---|---|---|
| Server | **`0.2.2`**「CH-aPaaS Server 0.2.2」 | `bootstrap-0.2.2.jar` 220,778,675 B |
| Web | **`0.2.2`**「CH-aPaaS Web 0.2.2」 | `sw-web-dist-0.2.2.zip` 6,191,084 B |

两仓 latest 均为语义 Release `0.2.2`，本轮无需恢复动作；`build-<sha>` 自动产物未删除、未覆盖。

## 三、提交与远端回读

- 终态传播批次：**`78fbe78865814af90974a63d25d4cd4ec91bcd41`**（`docs(0.2.2): 终态传播——COMPLETED 写入 knowledge/版本入口（第 7 阶段结束）`），已推送 `develop-sw`，`git rev-parse origin/develop-sw` 回读一致。
- 本回执单独提交；其提交 SHA 由推送后回读给出。
- 规划记录（`planning-final-review-022-completed.md`）、归档移动与本方向已在之前的 `349c2846` 中，本批推送范围包含其后的传播修改。

## 四、memory 字节数

| 文件 | 字节 |
|---|---|
| `memory/state.md` | 1,759 |
| `memory/handoff.md` | 1,533 |
| `memory/features.md` | 791 |
| `memory/README.md` | 713 |
| `memory/issues.md` | 1,073 |
| **当前入口五件合计** | **5,869（5.7 KB）** |
| `memory/*.md` 全部合计 | 13,695（13.4 KB） |

单份均 <5KB，总量 <20KB（本批未改 memory，before=after）。

## 五、边界

- Web `vite.config.ts` 在途改动保持未提交（工作树 M）。
- 未操作 UAT、未改两仓代码/分支/tag/Release。
- 未读取或传播任何 Key；未代 Owner 修改 UAT 供应商配置。
