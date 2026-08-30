# main 分支发布回执与协作者排查（2026-08-30）

> 授权：Owner 指令"两代码仓库可以发布到 main 分支了，注意协作者中要去掉 anthropic"。

## 一、main 分支发布（完成）

两仓远程 main 原为 GitHub 建仓 Initial commit（后端 `7cfadad` 仅 `.gitignore`、前端 `bda3bec` 仅 `README.md`），与 develop 无共同历史。采用**非破坏合并**方式（无 force）：

| 仓库 | 远程 main 推进 | 合并提交 | 树一致性核验 |
|---|---|---|---|
| 后端 Smart-WorkFlow | `7cfadad..c33116b`（fast-forward） | `c33116b` = merge(7cfadad, **ba59539**)，`.gitignore` 冲突取候选版本 | `git diff ba59539 HEAD` 为空（main 树 ≡ 候选树） |
| 前端 Smart-WorkFlow-Web | `bda3bec..3382dae`（fast-forward） | `3382dae` = merge(bda3bec, **f3a8988**)，`README.md` 冲突取候选版本 | `git diff f3a8988 HEAD` 为空（main 树 ≡ 候选树） |

- 全程在 /private/tmp 临时 worktree 操作（已全部移除），主仓工作区零改动、零提交；
- 提交消息符合前端仓 commitlint 规则（首次 `merge:` type 被拒，改为 `chore(release):` 合规消息，内容不变）；
- v0.0.1-beta tag（`ba59539` / `f3a8988`）均为 main 新 HEAD 的祖先，tag 继续有效且可直接从 main 到达。

## 二、协作者 anthropic 排查（未发现该实体）

对两仓以下授权入口逐一只读核查，**均未发现 anthropic**：

| 入口 | API/命令 | 结果 |
|---|---|---|
| 直接协作者 | `GET /repos/{repo}/collaborators` | 仅 `Chikaaho` |
| 外部协作者 | `collaborators?affiliation=outside` | 空 |
| 待接受邀请 | `GET /repos/{repo}/invitations` | 空 |
| 提交作者/committer（全历史 --all） | git log | 仅 Chikaaho 各邮箱变体 + GitHub web 提交（Initial commit） |
| 贡献者 | `GET /repos/{repo}/contributors` | 仅 `Chikaaho` |
| GitHub App 安装 | `GET /repos/{repo}/installation` | 无法以用户 token 查询（HTTP 401，需 App JWT） |

**结论**：以现有凭据可核的全部"协作者"入口中不存在 anthropic，无可删除对象；未执行任何猜测性删除。剩余唯一可能载体是 **GitHub App 授权**（如 Anthropic 系 App 的仓库安装），该层只能由 Owner 在 GitHub 网页端核实：仓库 Settings → GitHub Apps / Integrations，若见 Anthropic 系 App（如 Claude）installed，点 Uninstall 即完成移除；或提供该入口的可见信息后另行处置。

## 三、状态

- 后端：develop @ ba59539（工作区 clean）、main @ c33116b（已推送）、tag v0.0.1-beta 已推送；
- 前端：develop @ f3a8988（工作区 clean）、main @ 3382dae（已推送）、tag v0.0.1-beta 已推送；
- 根知识仓：按裁定不设 tag；本轮新增本回执（未提交，归规划侧候选管理）。
