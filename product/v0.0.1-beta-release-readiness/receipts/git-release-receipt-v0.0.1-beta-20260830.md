# Git 发布执行回执：v0.0.1-beta tag 创建与推送

> 日期：2026-08-30。授权：规划最终裁决 `planning-review-v0.0.1-beta-final-ready-20260830.md`（READY）+ Owner 本轮明确授权"三仓在精确提交创建并推送 annotated tag v0.0.1-beta"。

## 执行事实

| 仓库 | 本地 tag 创建 | 推送 | 远端 tag 对象 | 远端 peeled（解引用 commit） | 候选 SHA |
|---|---|---|---|---|---|
| 根知识仓 | 退出码 0 | `* [new tag]` 退出码 0 | `cc2b46a…` | **a86cbbda34f307db3a3bcad2b4b267175b905dbb** | 一致 |
| 后端 | 退出码 0 | `* [new tag]` 退出码 0 | `29c273a…` | **ba5953977ef8b8684e0d551216283727b7540ad4** | 一致 |
| 前端 | 退出码 0 | `* [new tag]` 退出码 0 | `6585ca4…` | **f3a89888e022d8b1c9de658e5a6cb5f97a8a9a2b** | 一致 |

- 推送前只读复确认：三仓目标 SHA 均可解析；本地 `git tag -l` 与 `ls-remote --tags origin v0.0.1-beta` 均为空（同名 tag 本地/远端不存在）。
- 全部为 annotated tag（非轻量 tag），仅推送单一 `v0.0.1-beta` 引用。
- 根仓 annotation 为组合发布索引，记录三仓完整 SHA 与裁决记录路径（`git cat-file tag v0.0.1-beta` 回读核实）；后端/前端 annotation 回指根仓索引 tag。
- tagger 身份为仓库所有者 Git 配置（Chikaaho），无任何 AI/Harness 署名。
- 未改动任何分支、未产生新提交、未使用 --force。

## 发布物还原方式

以根知识仓 tag `v0.0.1-beta` 的 annotation 三元组为索引，在三个仓库分别 checkout 对应完整 SHA 即可唯一还原 v0.0.1-beta 发布物。

## 修正（同日追加，Owner 裁定）

Owner 裁定 knowledge 仓不设 tag，仅代码仓库需要。已执行：

- 删除根知识仓本地 tag（`Deleted tag 'v0.0.1-beta' (was cc2b46a)`，退出码 0）与远程 tag（`- [deleted] v0.0.1-beta`，退出码 0）；
- 回读确认：根仓本地 `tag -l` 与 `ls-remote --tags origin 'v0.0.1*'` 均为空；
- 后端/前端远程 tag 不受影响，peeled 回读仍精确指向 `ba5953977ef8…` / `f3a89888e022…`。

最终发布形态：**仅后端、前端两仓存在 `v0.0.1-beta` annotated tag**；三仓候选组合索引以根仓候选提交 `a86cbbda34f307db3a3bcad2b4b267175b905dbb` 及裁决记录为准。后端/前端 tag annotation 中「组合索引见根知识仓 v0.0.1-beta」的引用以其中记录的根仓完整 SHA 为准（该 commit 长期有效，tag 名已按裁定移除）；如需改写两仓 annotation 须另行授权（涉及已推送 tag 的 force 更新，本轮未执行）。
