# 规划审查：P66 远程分支清理（planning-review-final-05）

| 项目 | 内容 |
|---|---|
| 审查对象 | `receipts/execution-final-05.md` §4；工作区提交 `2b320788` |
| 依据 | `receipts/planning-review-final-04.md` §3、§6；`memory/decisions.md` 的 Owner 分支规则（2026-11-09） |
| 日期 | 2026-11-09 |
| 审查角色 | Planner |
| 结论 | **分支清理通过**。§4.6 列出的清单外本地分支，按长期规则一并删除（§3）；Z4 仍等时间窗。七阶段仍为 **5/1/1** |

## 1. 远程清理：通过

Planner 用 `git ls-remote` 独立回读过（2026-11-09）：

| 仓库 | 远程分支 | 结论 |
|---|---|---|
| Server | `main`=`develop`=`a4f6c278`、`feature/p62-perf-bounded-20261011` | 符合 final-04 §6 |
| Web | `main`=`develop`=`c3f1d6e5`、`feature/ui-figma-align-20261027` | 符合 final-04 §6，Web `develop` 已追平 `main` |
| tag | `0.4.0` 仍是 annotated tag 对象 `6093c4cc`；前后 diff 为空 | 没动 |

删除前每条都过了 `merge-base --is-ancestor` 检查，26 项全部为 TRUE。有两条本地 `feature/024-readme-examples-2-3` 领先远程，但领先的提交也都在 main 里。回执对这一点说明清楚了，删除前的完整 SHA 也都记了下来。中途 TLS 握手失败 4 次，属于网络问题，请求没有到达 GitHub，可以接受。

## 2. 规则执行：通过

只用普通推送和 `git branch -d`，没有强推，没碰 tag，Web 的在途改动 `vite.config.ts` 原样未动。清单外的本地分支没有自行删除，而是交给 Planner 裁决，这样做是对的。

## 3. §4.6 清单外本地分支：按长期规则删除

Owner 的规则是“合并过就删”，§4.6 这 13 条都已合入 main、没有领先提交，属于这条规则的范围，**不用再问 Owner**。

1. 其中 12 条直接 `git branch -d` 删除：Server `0.1.1-bugfix`、`bugfix/0.1.7`、`feature/0.3.0-sample-processes`、`feature/0.3.1-approval-driven-flow`、`feature/p61-user-facing-message-humanization`、`feature/p64-mes-advanced-orchestration`、`fix/openapi-callback-tenant-017`、`fix/super-tenant-visibility`；Web `0.1.1-bugfix`、`bugfix/0.1.7`、`feature/p61-user-facing-message-humanization`、`feature/p64-mes-advanced-orchestration`。只用 `-d`，不用 `-D`；遇到被拒绝的就停下来并报告。
2. `feature/p61-msg-scope-corrected`：先只读查看工作树 `E:/code/p61-wt-web`，运行 `git -C E:/code/p61-wt-web status --porcelain` 和 `git worktree list`：
   - **没有任何未提交和未跟踪的文件**：执行 `git worktree remove E:/code/p61-wt-web`（不加 `--force`），再 `git branch -d feature/p61-msg-scope-corrected`，最后 `git worktree prune`；
   - **有未提交或未跟踪的文件**：不删，在回执里列出文件清单，交 Owner 决定。
3. 两个仓库最后只剩本地 `main`、`develop` 和未完成分支（Server `feature/p62-perf-bounded-20261011`）。附上 `git branch` 的回读结果。
4. 结果写进 `execution-final-05.md` 的新一节。这一项不阻塞 P66 终态复核，可以和 Z4 一起交。

## 4. memory 超限

`2b320788` 之后 memory 总量是 20,751 B，超过了 20KB。Planner 本轮已把它压回限额以内。Executor 以后同步时，先确认总量不超限再提交。

## 5. 下一步

- Executor：按 §3 清理本地分支；2026-11-10 17:16 以后补 Z4。都写在 `execution-final-05.md` 里。
- Planner：Z4 交回后，做 P66 终态复核。
