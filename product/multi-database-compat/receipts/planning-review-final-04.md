# 规划审查：P66 收尾补做第 1 项与远程分支清理（planning-review-final-04）

| 项目 | 内容 |
|---|---|
| 审查对象 | `receipts/execution-final-05.md`；工作区提交 `6c8b53ac`（README）、`3b09b669`（回执、memory、需求池、knowledge） |
| 依据 | `receipts/planning-review-final-03.md` §7（Owner 裁决方案 A） |
| 日期 | 2026-11-09 |
| 审查角色 | Planner |
| 结论 | **README 下两图通过**；Z4 仍等时间窗。Owner 要求清理无用远程分支：已合入 main 的分支列入本轮清理（§3），2 条未合入分支待 Owner 裁决。七阶段仍为 **5/1/1** |

## 1. README 下两图：通过

- `6c8b53ac` 只改 `README.md`：删掉含 `approval-detail.png`、`agent-graph.png` 的整张表，原位置改为一行文字说明智能体能力。符合方案 A 的要求：智能体能力只用文字说明。
- 8 张图片文件都还在仓库里，raw 回读均为 200；渲染后的 HTML 正好 6 个 `<img>`，没有破图。
- 全仓只有 `todo/web-ui-defects-20261109.md` 还引用这两张图，这是缺陷登记的证据，保留。

## 2. Z4：待时间窗

2026-11-10 17:16 以后，只读补记 `execution-final-05.md` §3。

## 3. 远程分支清理（Owner 2026-11-09 要求）

Planner 已用 `git branch -r --merged origin/main` 核对过（2026-11-09，fetch 之后）。下列分支**已全部合入 main**，删掉不会丢任何提交：

| 仓库 | 删除的远程分支 |
|---|---|
| Server | `feature/0.3.2-opinion-display`、`feature/0.4.0-multi-database`、`feature/023-agent-execution-lifecycle`、`feature/024-readme-examples-2-3`、`fix/030-rework-g1-g6` |
| Web | `feature/0.3.2-opinion-display`、`feature/0.3.3-opinion-summary`、`feature/0.3.4-opinion-label-fallback`、`feature/0.3.5-flow-table-fit`、`feature/0.3.6-command-params-cn`、`feature/023-agent-execution-lifecycle`、`feature/024-readme-examples-2-3`、`fix/030-rework-g1-g6` |

执行要求：
1. 删除前对每条分支重跑 `git merge-base --is-ancestor <branch> origin/main`，确认结果为真才删；不是真的就停下并报告。
2. 用 `git push origin --delete <branch>` 逐条删除，不强推，不碰 tag。本机同名的本地分支也一并删掉（只删已合入的）。
3. **保留** `main`、`develop`，以及 §4 的 2 条分支。
4. Web `develop` 比 `main` 落后 3 个合并提交（0.3.4—0.3.6 的 develop→main 合并）。按 Server 的做法，用普通推送把 develop 快进到 `main`（`c3f1d6e5`），并回读 main=develop。
5. 不动 Web 子模块里的在途改动（`vite.config.ts`）。
6. 回执写入 `execution-final-05.md` 的新一节，附删除前后的 `git ls-remote --heads origin` 清单。

工作区仓库只有 `main`、`develop-sw`，不用清理。

## 4. 未合入分支（待 Owner 裁决）

| 仓库 | 分支 | 领先 main | 内容 | Planner 建议 |
|---|---|---:|---|---|
| Server | `feature/p62-perf-bounded-20261011` | 16 | P62 有限性能三轮装置和修复，其中有真实的代码修复（`claimDue` 续跑领取、过期判定、openapi 回调租户列）。P62 性能项已由 Owner 定为已知延期问题 | **保留**。以后恢复 P62 性能时从这里接着做，删掉就丢了这些修复 |
| Web | `feature/ui-figma-align-20261027` | 1 | 工作台系统卡片样式对齐 Figma（2026-10-27），没有方向收口 | 先保留，下一个 Web 补丁时一并评估合入还是放弃 |

## 5. 下一步

- Executor：按 §3 清理分支、同步 Web develop；2026-11-10 17:16 以后补 Z4。都写在 `execution-final-05.md` 里。
- Planner：Z4 和 §3 都完成后，做 P66 终态复核。
- Owner：裁决 §4 这两条分支。

## 6. Owner 裁决（2026-11-09）

“合并过就删除了，没必要全部保留，保留一个 main、一个 develop 和未完成分支就行了。”

1. §3 的 13 条已合入分支照清单删除，**其中包括 P66 自己的 `feature/0.4.0-multi-database`**。之前回执里写的“feature 分支保留”不再适用。
2. §4 的两条未合入分支属于未完成分支，**保留**：Server `feature/p62-perf-bounded-20261011`、Web `feature/ui-figma-align-20261027`。
3. 这条规则以后长期适用，已写入 `memory/decisions.md`：开发分支合并进 develop/main 后，远程和本地都删掉；各仓库只保留 `main`、`develop`（工作区仓库是 `develop-sw`）和未完成分支。Executor 在合并阶段收尾时执行。

清理完成后的验收标准：Server 远程只剩 `main`、`develop`、`feature/p62-perf-bounded-20261011`；Web 远程只剩 `main`、`develop`、`feature/ui-figma-align-20261027`，并且 Web 的 `develop` 等于 `main`。
