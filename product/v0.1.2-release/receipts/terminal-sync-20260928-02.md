# 0.1.2 发布终态同步回执 02（修正批）

- 日期：2026-09-28；角色：执行（Executor）；任务：`v0.1.2-release`（L）
- 依据：规划复核 01 `receipts/planning-review-terminal-sync-20260928-verifying.md`（结论 `VERIFYING`，仅终态文档差异；发布交付 `PASSED` 保持锁定，本轮不重新构建、测试、发布或部署）。本回执按 TS1—TS3 精确修正，承接（不覆盖）`terminal-sync-20260928.md` 01 号回执。

## TS1：memory 全量口径统计与压缩

- **口径修正**：01 号回执把四份当前入口合计 11697 字节表述为 memory 总量，属统计范围错误。本轮按全部 `memory/*.md` 工具统计（`wc -c` + `cat|wc -c`），并采用复核要求的保守口径：**每份 <5000 字节、总量 <20000 字节**。
- 修正前（8 份）：architecture 857、state 3758、constraints 1363、README 1365、issues 1682、features 3545、handoff 3029、decisions 5064，合计 **20663**。
- 修正后（8 份，实测）：README 1365、architecture 857、constraints 1363、decisions 2186、features 3545、handoff 3029、issues 1789、state 3758，合计 **17892**。每份最大 3758 < 5000 ✅；总量 17892 < 20000 ✅。
- 改动范围：`decisions.md` 5064→2186（Phase 1—6C/Final 逐阶段裁决细节移出，压缩为「BAO 整体 COMPLETED + 仍有效关键边界」一段，权威历史在 `knowledge/decisions.md`、`knowledge/current-status.md` 历史区与 `product/backend-architecture-optimization/`）；`issues.md` 1682→1789（修正陈旧「当前正式基线 Server 1570/V96」为 0.1.2 发布实跑基线 1586/1301+3 与 V102 终点、生产 V96 边界，字节数含新增内容略增）；其余六份未改动。历史事实保留于权威文件，未删除审计。

## TS2：knowledge/current-status.md 当前/历史分层

- 在顶部唯一当前条目（2026-09-28 0.1.2 发布完成）之后插入明确的**「整体历史区（以下全部为历史快照，不作当前状态引用）」**分隔与分层边界声明：分隔线以下所有段落（含「当前唯一主任务 `backend-architecture-optimization`（`IN_PROGRESS`）」「唯一当前覆盖值（2026-09-24）」等被点名的未标注行）均显式标注为写入时点历史快照，仅保留审计事实；该任务已于 2026-09-26 `COMPLETED`，当前值唯一见顶部发布条目。顶部现在只承载本轮唯一当前任务与唯一下一动作（指向本修正批）。历史事实零删除；原「失效声明」「历史快照」等既有小节保留在历史区内。更早历史见 `knowledge/history/`。

## TS3：证据快照补全与稳定锚点

- 快照集由 5 份补至 **11 份**（`receipts/evidence/terminal-sync-20260928/`）：原 5 份（current-status / README / state / handoff / features，其中 current-status 为 TS2 修正后刷新）+ 新增 `decisions.md`、`issues.md`（TS1 改动文件）、`version.json`、`MANIFEST.json`、`DB-MIGRATIONS.md`、`UPGRADE.md`（身份对照与迁移口径实际用于核对的发布材料）。
- 校验索引 `SHA256SUMS.md` 覆盖全部 11 份快照，由 `shasum -a 256` 生成并当场 `shasum -a 256 -c` 回读 **11/11 OK**（.txt 命中 `.gitignore` 34 行 receipts 排除规则，沿用 .md 承载）。
- 稳定锚点：本修正批随根仓 `develop-sw` 普通提交推送；提交后回读的最终提交 SHA 与真实远端回读写入 `evidence/terminal-sync-20260928/FINAL-ANCHOR.md`（锚点文件记录其前一提交——即携带回执与本批快照的提交——的完整 SHA 与 `git ls-remote` 原始输出，不预填锚点自身提交 SHA，按 roles/executor.md §4.5.5 以提交后回读关联）。01 号回执「只指向机器终态/对话」的缺稳定附件指针问题由此消除。

## 与复核 01 完成条件逐项对照

| ID | 完成条件 | 实际 |
|---|---|---|
| TS1 | 全部 memory/*.md 工具统计与压缩；每份 <5000、总量 <20000；报告全部文件及前后总数；新改文件提供快照与校验 | ✅ 8 份前后 20663→17892 逐文件列出；decisions/issues 快照入索引且 -c 回读通过 |
| TS2 | 已完成阶段内容移入整体历史区或 knowledge/history；顶部只留本轮单一当前任务/下一动作；历史事实保留；提供更新后完整快照 | ✅ 采用「明确的整体历史区」方案：显式分隔 + 逐行失效标注（不物理搬移，避免破坏既有引用路径）；顶部仅 2026-09-28 发布条目；current-status 快照为修正后全文 |
| TS3 | 补版本文件与身份对照发布材料快照（至少 version.json、MANIFEST.json 及迁移口径文档）；索引附最终根仓提交 SHA 与真实远端回读；同批证据可定位 | ✅ 补 version.json/MANIFEST.json/DB-MIGRATIONS.md/UPGRADE.md；11/11 索引入库；FINAL-ANCHOR.md 记录本批提交完整 SHA 与 ls-remote 真实回读 |

## 自验结论

TS1—TS3 修正全部完成并以上述快照/索引可回读；发布业务零触碰（无重新构建/测试/发布/部署，无 Release/资产改动）。本回执以 `TERMINAL_SYNC_SUBMITTED` 提交，待规划复核后归档同步方向并确认最终 `COMPLETED`。
