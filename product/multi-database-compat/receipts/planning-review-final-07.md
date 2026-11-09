# 规划审查：P66 发布后同步遗漏两个代码仓 README（planning-review-final-07）

| 项目 | 内容 |
|---|---|
| 来源 | Owner 2026-11-09 指出：“main 的 README 怎么还是 0.2.4” |
| 依据 | `system.md` 七阶段第 6 步“发布后同步”；`ready/direction-multi-database-compat.md` §4 阶段 D |
| 日期 | 2026-11-09 |
| 审查角色 | Planner |
| 结论 | **属实，发布后同步不完整**。新增 **Z6**：Server、Web 两个仓库的 README 要同步到当前版本。**Z6 阻塞 P66 终态复核**。七阶段仍为 **5/1/1** |

## 1. 事实（Planner 2026-11-09 读取 GitHub `origin/main`）

| 仓库 | README 现状 | 应为 |
|---|---|---|
| Server `main` | “当前可体验”一节写 **0.2.3**；“当前版本”一节写 **0.2.4**（tag `41511bd4`，Flyway V0.2.9） | **0.4.0**（tag `0.4.0`→`a4f6c278`，Release `438918154`，Flyway V0.4.0，多数据库） |
| Web `main` | “当前可体验”一节写 **0.2.3**；“当前版本”一节写 **0.2.4**（tag `f4acc3d`） | **0.3.6**（tag `c3f1d6e`，Release `438126185`），后端搭配 Server 0.4.0 |
| 工作区 `main`（GitHub 默认分支） | 停在 2026-10-27 的治理提交 `19c94125`，没有 P66 重排后的 README 和截图 | 新 README 目前只在 `develop-sw` 上，见 §4 |

0.3.0—0.3.6 和 0.4.0 这几次发布，都没有更新两个代码仓的 README。

## 2. 原因

- 方向文件只要求重排工作区根 README，没有写明代码仓 README 也要同步；0.3.x 各补丁的发布后同步也一直没有把代码仓 README 列进去。
- Planner 在 final-02 审查 README 时只看了工作区根 README，没有回读两个代码仓 `main` 上的 README，所以漏了。这是 Planner 审查范围的缺口，已在 §5 改成以后的固定检查项。

## 3. Z6 要求（Executor）

1. **Server README**（在 `develop` 改，再合入 `main`）：
   - 把“当前可体验”和“当前版本”两节都改成 **0.4.0**：tag、Release、`bootstrap-0.4.0.jar` 的大小和 sha256、Flyway V0.4.0，以及从旧版本升级的说明。还要写明**回退到 0.3.2 必须先恢复 pre040 dump**，链接到 `docs/ops/production-ops.md`。
   - 加多数据库支持矩阵：九种库，DM8 和 KingbaseES 标“Owner 实库验证”；链接到 `docs/deployment/multi-database.md`。
   - 0.2.3、0.2.4 的长段落压缩进“版本历史”，补上 0.3.x 的条目：按 tag 和 knowledge 的实际事实逐条核对，0.3.0 被 Owner 退回这件事要如实写。不需要的就写一行，不要把每个版本都展开。
   - 三个示例场景改成“已完成”，和工作区根 README 一致。
2. **Web README**：同上，当前版本改为 **0.3.6**，写清和 Server 0.4.0 的搭配关系，补 0.2.5（如有）到 0.3.6 的历史。**只提交 README**；`vite.config.ts` 的在途改动不能暂存、不能提交。
3. **其他过期入口**：用 grep 查两个仓库 `main` 上的版本表述（`README*`、`功能清单.md`、`docs/` 下的索引页），凡是把 0.2.x 写成“当前版本”的地方一起改掉，在回执里列出清单。
4. **提交和合入**：普通提交，用 `docs(...)` 类型；按 0.2.3 的先例，先进 `develop` 再合入 `main`，最后让 `develop` 和 `main` 对齐。等 main 的 CI 跑完并回读结果。**不建 tag、不移动 tag、不改 Release**，README 改动不需要另外发版。
5. **回读**：在 GitHub 网页上看两个仓库 `main` 的 README 渲染结果，确认版本号、链接和表格都正常。
6. 回执写入 `receipts/execution-final-05.md` 的新一节（Z6），可以和 Z4 一起交。

## 4. 工作区 GitHub 默认分支（需要 Owner 决定）

工作区仓库在 GitHub 上的默认分支是 `main`，但它停在 2026-10-27（Admin 治理提交），和 `develop-sw` 已经分叉：`develop-sw` 领先 1,089 个提交，`main` 上也有 72 个提交不在 `develop-sw` 里。所以 P66 重排的根 README 和截图，别人打开仓库首页时看不到。

可选方案：
- **A（推荐）**：由 Admin 把 `develop-sw` 合入工作区 `main`（普通合并，不强推），之后定期同步。`main` 上那 72 个治理提交要由 Admin 核对，确认已有等价内容在 `develop-sw` 里，或者在合并中保留下来。
- **B**：把 GitHub 默认分支改为 `develop-sw`。
- **C**：维持现状，首页只放治理说明。

这件事属于工作区仓库治理，不在 Executor 的范围里，**不阻塞 P66**。

## 5. 以后的固定检查项（Planner 自己执行）

以后每次发版做发布后同步审查，Planner 都要回读**三个仓库 `main` 上的 README**，看版本号和 tag、Release 是否一致；不一致就不过审。这一条也写进 `memory/decisions.md`。

## 6. 下一步

- Executor：做 Z6（§3）；2026-11-10 17:16 以后补做 Z4。都写在 `execution-final-05.md` 里。
- Owner：决定 §4。
- Planner：Z4 和 Z6 都完成后，做 P66 终态复核。

## 7. Owner 裁决（2026-11-09）

“两个代码的 main，工作区不需要合并 main，工作区的 main 是通用。”

1. Z6 的范围就是 **Server、Web 两个代码仓的 `main` README**，按 §3 执行，不变。
2. **工作区 `main` 是通用的治理底座，不合并 `develop-sw`，也不改默认分支**。§4 的 A、B、C 三个方案都不采用，工作区首页本来就不展示项目 README，这一项关闭。
3. §5 的固定检查项改为：每次发布后同步，回读**两个代码仓 `main` 的 README**；工作区只看 `develop-sw`。`memory/decisions.md` 已按这个口径记录。
