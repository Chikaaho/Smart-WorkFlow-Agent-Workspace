# 规划审查：P66 清单外本地分支清理（planning-review-final-06）

| 项目 | 内容 |
|---|---|
| 审查对象 | `receipts/execution-final-05.md` §5；工作区提交 `f1c49f50`、`4732b64c` |
| 依据 | `receipts/planning-review-final-05.md` §3；`memory/decisions.md` 的 Owner 分支规则；Owner 关于保留本机隔离环境的裁决 |
| 日期 | 2026-11-09 |
| 审查角色 | Planner |
| 结论 | **通过**。两个仓库的本地分支只剩 main、develop 和未完成分支；Server 的两个额外工作树都属于隔离环境，**保留**；残留目录 `E:/code/p61-wt-web` 交 Owner 手动删除（可选）。只差 Z4，七阶段仍为 **5/1/1** |

## 1. 本地分支：通过

Planner 用 `git branch -vv` 和 `git worktree list` 独立回读过：

- Server：`main`、`develop`（都是 `a4f6c278`）、`feature/p62-perf-bounded-20261011`。
- Web：`main`、`develop`（都是 `c3f1d6e5`）。未完成分支 `feature/ui-figma-align-20261027` 只在远程。

12 条分支都用 `-d` 删除，没有一条被拒；`feature/p61-msg-scope-corrected` 是先确认工作树干净、解除注册后再删的。删除前的 SHA 都记了，可以恢复。整轮没有推送，远程和 tag 不变。

## 2. `E:/code/p61-wt-web` 残留目录

这个目录已经和 git 脱离关系，里面是 `d110ed8b`（已在 main 里）的文件加上可以重建的 `node_modules`，没有只此一份的内容，也没有进程在用它。指令没有授权文件系统级删除，所以 Executor 没删，这样做是对的。**交给 Owner，用资源管理器手动删除即可**；不删也不影响任何东西。

## 3. Server 的两个额外工作树：保留

| 工作树 | 用途（来源） | 裁决 |
|---|---|---|
| `.lc023-mock/lc023-server-wt` | 0.2.3 隔离实例：本机打的 `bootstrap.jar`，以及指向隔离库 `smart_workflow_lc023_01` 的 `application-local.yml`（这就是那 1 个未跟踪文件），配套 `.runtime-lc023/`（`product/0.2.3/receipts/execution-release-023-08.md`） | **保留** |
| `E:/code/sw030-server` | 0.3.0 隔离实例 18091 的构建工作树，配套 `.runtime-030`、`smart_workflow_030`（`product/three-sample-process-uat/receipts/execution-final-02.md`） | **保留** |

理由：Owner 已经定过，本机隔离环境（含 `.runtime-*`、隔离库、凭据密文）保留不删。这两个工作树都是这些环境的一部分。它们是 detached HEAD，不占用任何分支，不属于“合并即删”的分支规则管辖。以后 Owner 如果决定撤掉某个隔离环境，再把工作树、`.runtime-*` 和隔离库一起清理。

## 4. 下一步

- Executor：2026-11-10 17:16 以后，在 `execution-final-05.md` §3 里只读补做 Z4。
- Planner：Z4 交回后做 P66 终态复核。
- Owner（可选）：手动删除 `E:/code/p61-wt-web`。
