# 0.1.10 基线对齐与终审传播回执（01）

2026-10-21｜Executor｜L｜EXECUTION_SUBMITTED（待规划复核）
入口：`product/0.1.10-bugfix/ready/direction-baseline-sync-0110.md`；依据：`search_fallback/bugfix-0110-baseline-and-sync-audit.md`。

## 1. 执行结果

- **三仓对齐（仅快进，无强推、无历史改写）**：根 `de2140e1`→`f2beb3be`（`origin/develop-sw`，27 提交）；Server `823190e`→`2d6b8f1`（main/develop，24 提交）；Web `264cca3`→`2ac1a71`（main/develop，21 提交）。三仓工作树在同步后无业务改动。
- **保留本轮与既有改动**：`product/0.1.10-bugfix/`（主方向、基线同步方向、items）、`search_task/` 与 `search_fallback/` 本任务文件全部保留并纳入提交；规划侧旧 memory 文本作为历史保留，不删除既有事实。
- **0.1.9 终审传播**：`knowledge/current-status.md`、`knowledge/session-handoff.md` 顶部由“4/2/1 待规划复核”改为 **0.1.9 COMPLETED 7/0/0 + 0.1.10-bugfix PLANNING 0/1/6**；原 09:01 段落降为带日期的历史引用。
- **memory 同步**：README/state/handoff/features/issues/decisions/constraints 七件改写为当前口径；architecture 无变化。每件 <5KB，目录总 **12,643 B**（<20KB）。
- **todo/requirement-pool.md**：顶部改为 0.1.10 活动交付 + 0.1.9 完成；`items.md` 的 SYNC-01 改为“执行完成，待规划复核”；本方向追加执行进度行。
- **无改动项（核实已一致）**：根 README/CHANGELOG/version.json、gitlink；Server README/功能清单/`pom.xml`/CI 工作流；Web README/`package.json`。`version.json` 保持 0.1.9，0.1.10 版本收敛留待发布阶段。
- 未新增业务测试、哈希或部署动作。

## 2. knowledge 传播前后

| 入口 | 传播前 | 传播后 |
|---|---|---|
| `knowledge/current-status.md` 顶部 | README 首例 PASSED，交付 4/2/1，下一动作 Planner 复核终态同步 | 0.1.9 COMPLETED 7/0/0 + 0.1.10 PLANNING 0/1/6；下一动作 Planner 复核本回执并关闭 SYNC-01 |
| `knowledge/session-handoff.md` 顶部 | 同上（4/2/1 表述） | 同上（0.1.10 当前口径） |
| `memory/README.md`、`state.md` | 0.1.9 COMPLETED、无活动交付 | 0.1.9 COMPLETED + 0.1.10 PLANNING |
| `todo/requirement-pool.md` 顶部 | 当前活动任务无 | 0.1.10-bugfix PLANNING 为当前活动交付 |

## 3. 当前入口覆盖矩阵

| 入口 | 核验前 | 处理 | 同步后/依据 |
|---|---|---|---|
| `knowledge/current-status.md` | 4/2/1 待复核 | 改写顶部并保留历史段 | 0.1.9 COMPLETED 7/0/0 + 0.1.10 0/1/6 |
| `knowledge/session-handoff.md` | 4/2/1 待复核 | 同上 | 同口径 |
| `memory/` 七件 | 0.1.9 完成、无活动交付 | 改写 | 0.1.10 PLANNING + 0.1.9 完成 |
| `todo/requirement-pool.md` | 无当前活动 | 改写顶部 | 0.1.10 活动 |
| 根 `README.md`/`CHANGELOG.md`/`version.json` | 0.1.9 | 核实，不改 | 已与 0.1.9 发布事实一致 |
| 根 gitlink | 旧 `823190e`/`264cca3` | 随快进对齐 | Server `2d6b8f1`、Web `2ac1a71` |
| Server README/功能清单/`pom.xml`/CI | 0.1.9 | 核实，不改 | 开发默认 `0.1.9-SNAPSHOT` |
| Web README/`package.json` | 0.1.9 | 核实，不改 | 包版本 `0.1.9` |
| `project.md` | 无版本事实 | 不适用 | 无需变更 |
| `product/0.1.10-bugfix/`、`search_task/`、`search_fallback/` | 本轮新增 | 保留并提交 | 方向、事项、探索与回执 |

## 4. 基线与版本事实（沿用已锁定证据）

- 正式发布 0.1.9：Server `74716dd`、资产 `bootstrap-0.1.9.jar` 218,061,187 B sha256 `d416a979…`；Web `e967e24`、资产 `sw-web-dist-0.1.9.zip` 1,351,539 B sha256 `55978768…`。
- UAT 为回执时点 0.1.9（Web `index-DDQRXD9F.js`），本次未登录实时复验。
- 开发版本 Server `0.1.9-SNAPSHOT`、Web `0.1.9`；DB 版本化终点 V0.1.7，`R__bf20261020_form_data_admin_grants.sql` 已应用。
- 计数：功能 49、清单 46/22/22=90、ADV64/问题57、P 核销空、P62 延期/OFF。
- 0.1.9 终审：`product/readme-first-example-acceptance/receipts/planning-final-review-terminal-sync-019-completed.md`；发布后同步：同任务 `terminal-sync-019-02.md`；发布：`product/bugfix-20261019/receipts/release-019-01.md`。

## 5. memory 字节数

| 文件 | 字节 |
|---|---|
| README.md | 813 |
| architecture.md | 857（未改） |
| constraints.md | 4,915 |
| decisions.md | 1,877 |
| features.md | 975 |
| handoff.md | 1,087 |
| issues.md | 1,379 |
| state.md | 740 |
| **合计** | **12,643** |

## 6. 剩余动作与边界

- 待 Planner 复核本回执、关闭 SYNC-01 并将本方向归档 `passed/`。
- 0.1.10 继续接收 Owner 事项；执行建分支、验收、合并、发布及发布后同步按主方向推进；版本来源收敛在发布阶段办理。
- 未重跑 0.1.9 已锁定业务/UAT 验证；未发布、未部署、未改业务数据。
- 本回执所在提交的 SHA 以推送后远端回读为准，不在文件内预填自身提交。
