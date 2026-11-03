# 0.2.1 规划终态复核

日期：2026-11-03。复核角色：规划。对象：`close-sync-021-01.md`（根仓 `2f540efe`）、`release-sync-021-01.md`（含后续更正 `8d8cd396`、`ae8db3e3`、`82189739`）。

## 裁决

0.2.1 缺陷修复列车 **`COMPLETED`**。第 1—6 阶段的结果都有可读证据，第 7 阶段由本记录完成。两份方向文档已归档到 `product/0.2.1-bugfix/passed/`。

## 逐项复核

| 项 | 方向要求 | 证据 | 结论 |
|---|---|---|---|
| 台账冻结 | 29 项全部通过，不改值 | 两份回执均只读核对，台账未改 | 通过 |
| 计数与编号 | 功能 49、46/22/22＝90、ADV64/问题57、P 编号、明细 ID、验证基线 [] 均不变 | close-sync §4、release-sync §5，knowledge/memory/README/CHANGELOG/version.json 落位 | 通过 |
| 合并 | 两仓 fix→develop→main，推送回读，保护 `vite.config.ts` | release-sync §2：develop 与 main 树一致，ls-remote 回读一致；修复分支删除前确认已合入 main；Web 工作树仍只剩该在途改动 | 通过 |
| 版本收敛 | 生效发布配置与 0.2.1 一致 | Server revision `0.2.1-SNAPSHOT`、CI 断言与脚本三模式 PASS；Web `package.json` 0.2.1 | 通过 |
| 发布 | tag、CI、制品、部署分别核实 | Server tag `0.2.1`→`5c33eab3`，CI `41608817497` success（2337/0/0/34），jar 实测 `build.version=0.2.1`；Web tag→`07568b57`，CI `41606814041` success，zip 入口 `index-Bl0JsMZw` | 通过 |
| 部署 | 实际部署版本 0.2.1 | UAT health UP、启动 ERROR 0、`build.version=0.2.1`、Flyway 应用 R__0.2.1 且 versioned checksum 不变、9411—9414 种子存在；Web index 与发布 zip 一致，路由 200；部署前 DB 备份可读 | 通过 |
| 首轮 CI 失败 | 如实处理，不覆盖既有发布 | 4 个迁移链断言未计入新增 R__，失败轮无制品；修 `c9e604ce` 后重跑成功 | 通过 |
| 发布后同步 | knowledge 优先，覆盖受影响入口，无残留矛盾 | release-sync §6 覆盖 15 个入口，§7 旧值检索 0 命中（唯一命中为历史条目）；两仓 README 遗留的 0.1.x 版本表述一并修正 | 通过 |
| memory | 单份 <5KB、总量 <20KB | 13,756 B，最大 4,656 B | 通过 |

## 不阻塞的遗留观察

- Server 发布后文档提交的 CI `41613030060`：attempt 1 失败于已登记的 P62 领取竞态测试（`todo/p62-upgrade-gate-test-claim-race.md`，同代码发布轮通过），attempt 2 在同步时仍在运行。这一轮只含文档，不影响 0.2.1 tag 与制品。成功后可能生成 `build-32b2e1aa…` Release 并抢走 `latest` 标记；收尾传播时回读结果，必要时把语义 Release `0.2.1` 恢复为 latest（与 Web 侧做法相同）。
- UAT 系统盘两次发布都打满，现约 0.7G 可用，已记入 `memory/issues.md` 运维观察，留给后续目标。

## 后续

当前入口仍写 `PASSED（待规划复核）`。Executor 按 `product/0.2.1-bugfix/ready/direction-final-propagation-021.md` 把 `COMPLETED` 传播到 knowledge 及受影响入口，并回读上面的 CI 与 latest 结果。传播完成后无活动交付，等待 Owner 安排下一目标。
