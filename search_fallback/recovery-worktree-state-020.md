# 0.2.0 恢复入口与工作树传播事实

2026-10-26 21:41 +08:00｜Executor｜只读探索回执

## 结论

0.2.0 的根仓文档与回执在 C 盘 `020-continuation` 工作树（`codex/0.2.0-delivery`）；代码在 E 盘的两个子仓工作树（Web/Server 的 0.2.0 分支）。E 盘根仓在 `develop-sw`（0.1.10 线），没有 `product/0.2.0`；回执不可见是分支隔离，不是漏推或回退。

## 两处工作树

| 项 | E:/code/Smart-WorkFlow-Agent-Workspace | C:/Users/hjxch/.codex/worktrees/020-continuation/Smart-WorkFlow-Agent-Workspace |
|---|---|---|
| 分支/HEAD | `develop-sw` / `05613119` | `codex/0.2.0-delivery` / `fb70893b` |
| 跟踪 | `origin/develop-sw`，+0 -0 | `origin/codex/0.2.0-delivery`，+0 -0 |
| Git 公共目录 | 共享 `E:/.../.git` | 自身 git-dir 为 `.git/worktrees/Smart-WorkFlow-Agent-Workspace` |
| 工作树 | 脏：memory/todo/0.1.10 文档、2 个子模块 gitlink、2 个未跟踪文档＋任务文件 | 18 个未跟踪 product/search 文件；两个子模块目录为空 |
| memory 入口最后提交 | `221830a9`（10-21 23:50），今日 21:34 有未提交修改 | `fb70893b`（21:21） |
| knowledge 入口最后提交 | `221830a9`；`0.2.0` 零出现 | `current-status.md` 最后提交 `cb9b863f`（20:50） |

同一公共目录另有 `codex/hook-worktree-role-binding`@`e6d72786`，不在范围。

## 提交与传播

- 根 `cb9b863f`（20:50:30）：含 `product/0.2.0/receipts/workspace-config-diff-fix-02.md`；本地与 `origin/codex/0.2.0-delivery`（均 `fb70893b`）包含，`develop-sw` 不包含。
- Web `34a5541`（20:49:18）：`codex/0.2.0-ui-tenant-form-flow` 的 HEAD，origin 同 SHA；E 盘 Web 子仓正检出此提交。
- Server `f530d33e`（18:52:21）：`codex/0.2.0-tenant-form-flow` 的 HEAD，origin 同 SHA；E 盘 Server 子仓正检出此提交。
- C 根 `fb70893b` 记录的 gitlink 是 Web `8b564c5b`、Server `6995f883`（2026-10-25 01:44 更新），两者均为上述 tip 的祖先；根分支尚未记录最新子仓 tip。E 根记录 0.1.10 基线 `2df670b/85e1ab78`，故 E 子模块显示已修改。
- 远端时点：根 `origin/codex/0.2.0-delivery` 于 21:21:42 由 push 更新；Web 20:49:33、Server 18:52:26。本次未 fetch，21:41 核验只能证明到这些 push 时点。

## knowledge 与 memory/任务03

- C 盘 `knowledge/current-status.md` 第 3 行：0.2.0 IN_PROGRESS，7 阶段 1/1/5，与 `memory/README.md`、`state.md`、`handoff.md` 及任务03首段一致；第 108/110 行已记录任务03、Web `475814c..34a5541`、Server `f530d33e`，并保持“未核销 P、未晋级基线”。
- 同一文件第 61 行“唯一下一动作”仍指 `planning-execution-prompt-unified-020-02`；第 59 行“最新已推送”仍是 Server `83f58d0`/Web `32d1651`。两处落后于 memory/任务03及第 108/110 行，属 knowledge 顶部摘要未同步。
- E 盘 knowledge（`current-status.md`、`session-handoff.md`）仍是 0.1.10 COMPLETED、无活动交付、等待 Owner 选题，`0.2.0` 零出现；今日未提交的 memory/todo 把当前任务指向 C 盘现场。按 `system.md` §0.4，E 的 knowledge 对自己检出仍权威，但不能作为 0.2.0 状态源；0.2.0 权威状态只在 C 盘 knowledge。
- 计数：C 盘当前条目只写“未核销 P、未晋级基线”；memory/state 与 E knowledge 的 49、46/22/22=90、ADV64/问题57 一致。

## 侧栏依赖

`planning-figma-sidebar-sync-020-01.md` 已提交在 `fb70893b`，记录 Figma 写回与 `C:/Users/hjxch/.codex/evidence-020/design-sidebar-20261026/` 的 11 图＋索引，文件实际存在。任务03第 9/19 行明确参考已交付、不能再列“等待侧栏参考”。C knowledge 第 108/110 行仍把“新侧栏参考”列为未通过/待规划；可核销的是“等待参考”这一依赖，正式运行像素验证仍是真实剩余项。

## E 盘未提交范围

- 今日 21:34—21:37：7 个 `memory/*` 与 `todo/requirement-pool.md`，内容是恢复路由与 0.1.10 历史标注；不涉及业务源码或 knowledge。
- 2026-10-22 00:01：`product/0.1.10-bugfix/` 的 2 个修改、1 个删除、2 个未跟踪归档/回执；属更早的 0.1.10 收尾批次，应与路由分开。
- 子模块：Web `vite.config.ts` 有在途修改（C knowledge 已记为按方向保护不纳入）；Server 干净。gitlink 差异来自 0.2.0 分支检出，不是业务文件改动。

## 不能确定与建议

- 未访问远端：远端最新状态只到上述 push 时点；如需证明，需一次只读 fetch 或 ls-remote。
- 根分支是否应记录子仓最新 tip，取决于根仓 gitlink 口径；当前事实是未记录。若要补，应在 `codex/0.2.0-delivery` 工作树另行授权提交，不能在 `develop-sw` 提交 0.2.0 gitlink。
- 最小后续：E 盘将 0.1.10 归档批次与路由标注分两次提交，路由只含 memory/todo。0.2.0 执行继续在 C 根工作树与 E 子仓 tip 上进行，不切 E 根分支、不合并、不复制旧摘要。
- 继续探索：不需要；Git 关系、提交包含、知识/内存状态、侧栏依赖均已核实。
