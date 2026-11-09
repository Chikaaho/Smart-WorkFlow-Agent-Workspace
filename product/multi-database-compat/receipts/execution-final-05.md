# P66 收尾补做回执（execution-final-05）

| 项目 | 内容 |
|---|---|
| 功能 | P66 多数据库兼容（XL，0.4.0） |
| 依据 | `product/multi-database-compat/receipts/planning-review-final-03.md` §6/§7（Owner 裁决方案 A）；`planning-review-final-04.md` §3/§6（远程分支清理，Owner 裁决）；`planning-review-final-05.md` §3（清单外本地分支）；`planning-review-final-06.md` §2/§3；`planning-review-final-07.md` §3/§7（Z6 两个代码仓 `main` README 同步）；`planning-review-final-08.md` §2/§3（Z7 两仓 README 重排与 Latest 修复，Owner 授权） |
| 日期 | 2026-11-09 |
| 执行角色 | Executor |
| 状态 | **第 1 项完成**（README 下掉 2 张图并回读渲染）；**分支清理完成**（§4）；**清单外本地分支清理完成**（§5）；**Z6 完成**（§6）；**Z7 完成**（§7）；**Z4 待时间窗**（2026-11-10 17:16 之后） |
| 结论 | README 界面预览保留 6 张，`agent-graph.png`、`approval-detail.png` 引用与图注已移除、图片文件保留在仓库；GitHub raw 与渲染 HTML 双回读通过。13 条已合入分支（Server 5、Web 8）远程与本地均已删除，Web `develop` 已普通快进到 `main`；两仓远程各剩 3 条分支，tag 前后逐行一致。§4.6 清单外 13 条已合入本地分支也已按 final-05 §3 删除（`feature/p61-msg-scope-corrected` 的 git 工作树注册已移除，残留 312 MB 物理目录 `E:/code/p61-wt-web` 交 Owner 手动删除）。两仓本地各剩 `main`、`develop` 和未完成分支（Server `feature/p62-perf-bounded-20261011`）。Z6：Server、Web 的 README 已同步到 0.4.0 / 0.3.6，按 develop → main → develop 普通合入（Server main = develop = `7d009021`，Web main = develop = `e181e25`），两仓 main CI 均 success，GitHub 首页渲染与 20 个链接回读通过；没有建 tag、移 tag 或改 Release，但 CI 自动建的 `build-<sha>` Release 成了两仓 Latest，交 Owner 裁决（§6.5）。Z7：两仓 README 重排为开源结构（徽章、截图、架构图、快速开始并实测启动与代理链路），工作流固定 `--latest=false`（Owner 授权），Server `0.4.0`、Web `0.3.6` 已用本机 git 凭据设回 Latest（Owner 授权），两仓 main = develop = Server `7d0f2a2e`、Web `bed840d`（§7）。P66 在 Z4 补做后即可进入 Planner 终态复核 |

## 1. README 下掉 `agent-graph.png` 与 `approval-detail.png`

按 final-03 §7 Owner 裁决执行，只去引用和图注，**图片文件不删**：

- 删除「界面预览」第二张表（`会签与审批记录 | 智能体图编排与节点属性` 整块，含两图引用）。
- 原位置补一行文字说明：「智能体能力（模型管理、Prompt、图编排、工具调用、知识库与 RAG）见上表『核心能力』，界面截图待 Web 界面补丁后补充」，满足方案 A"智能体能力只用文字说明"。
- 提交：`6c8b53ac`（`docs(p66): README 下掉 agent-graph 与 approval-detail 引用，预览保留 6 张（final-03 方案 A）`），普通推送 `3a5ed098..6c8b53ac -> develop-sw`。
- 修改面核对：全仓 `*.md` 中引用这两张图路径的只有 `README.md`（本次移除）与
  `todo/web-ui-defects-20261109.md`（缺陷登记证据，按裁决保留）。
- `git ls-files docs/assets/readme/` 仍为 8 个文件；仓库内未删除任何图片。
- Web 子模块的 `vite.config.ts` 在途改动未触碰、未提交。

## 2. GitHub 回读（2026-11-09，提交 `6c8b53ac`）

### 2.1 raw README（`develop-sw` 分支）

- `agent-graph.png` / `approval-detail.png` 引用数：**0**。
- 剩余图片引用恰为 6：`workspace`、`form-designer`、`workflow-designer`、
  `sample-a`、`sample-b`、`sample-c`。
- 文字说明行已在线上（README 第 37 行）。

### 2.2 raw 图片状态（8 个全部保留）

| 文件 | HTTP | 大小 |
|---|---:|---:|
| workspace.png | 200 | 222,563 B |
| form-designer.png | 200 | 251,232 B |
| workflow-designer.png | 200 | 249,220 B |
| sample-a.png | 200 | 360,822 B |
| sample-b.png | 200 | 223,009 B |
| sample-c.png | 200 | 254,903 B |
| agent-graph.png（不再被 README 引用） | 200 | 295,933 B |
| approval-detail.png（不再被 README 引用） | 200 | 316,475 B |

### 2.3 渲染 HTML（`api.github.com/repos/.../readme?ref=develop-sw`，`Accept: application/vnd.github.html+json`，35,831 B）

- `<img>` 标签恰为 6 张（src+srcset 各计一次）。
- `agent-graph` / `approval-detail` 字样：**0**，无破图残留。
- 「界面预览」「三示例流程（已完成）」「多数据库支持（0.4.0）」小节与新增文字说明均正常渲染。

## 3. Z4 部署后 24 小时日志量（待时间窗）

时间窗 **2026-11-10 17:16 之后**才满足；本回执先占位，届时以只读方式补记并追加本节：

1. 当天 `server.log` 大小（及轮转产物）；
2. `df -h /`（UAT 磁盘用量）；
3. logrotate 是否已按 `maxsize 100M` 或 `daily` 实际轮转（`/var/lib/logrotate/status` 或状态文件佐证）。

本节记录前不做任何日志/磁盘写操作。

## 4. 远程分支清理（`planning-review-final-04.md` §3/§6）

Owner 2026-11-09 裁决：已合入分支远程、本地都删，包括 P66 自己的 `feature/0.4.0-multi-database`，因此 `execution-final-04.md` §3 里写的“feature 分支保留”**不再适用**。每个仓库只保留 `main`、`develop` 和未完成分支。证据都留在本机目录
`E:/code/Smart-WorkFlow-Agent-Evidence/p66-040/branch-cleanup/`，没有提交进 Git。

### 4.1 删除前远程清单（`git fetch --prune` 之后，`git ls-remote --heads origin`）

Server（8 条）：

```text
a4f6c27815548e6fd63be0d40e24796139f3f1fa  refs/heads/develop
293432cee2fe23743e3471bad29c2a9aa7be1f63  refs/heads/feature/0.3.2-opinion-display
19ae82f3f5028b2bc2765c374dc28490f0d52ed3  refs/heads/feature/0.4.0-multi-database
30370877af8bd07d5f4309246c39f0539e069323  refs/heads/feature/023-agent-execution-lifecycle
f0906a219afde455afe5b735b731f864f8cbdee2  refs/heads/feature/024-readme-examples-2-3
7c305978be1b82cb25c4474ab674cab8803470c0  refs/heads/feature/p62-perf-bounded-20261011
a05fb7f49957973936bae34e854b7394029354ce  refs/heads/fix/030-rework-g1-g6
a4f6c27815548e6fd63be0d40e24796139f3f1fa  refs/heads/main
```

Web（11 条）：

```text
0d71982b60e25a69f2fa868463076f8a02bc70da  refs/heads/develop
09062a8f93c35d3f6cb772953ab6fd9c31f2b36d  refs/heads/feature/0.3.2-opinion-display
a8f8416e3f39d20e5d9659f4d9bec428568e05cc  refs/heads/feature/0.3.3-opinion-summary
b884bccc3ebe5fdd1cd272fcb3986f0d72efec53  refs/heads/feature/0.3.4-opinion-label-fallback
2b18fdc107ca76c19416827b9a285c85cc317509  refs/heads/feature/0.3.5-flow-table-fit
8dd02203d1c73a6d78ca8702d540853c70e192c5  refs/heads/feature/0.3.6-command-params-cn
3ae42cb4fed56a71df5839df831ccf90e74284fe  refs/heads/feature/023-agent-execution-lifecycle
924ae7c65d8466531b93692ee115a7acfca056af  refs/heads/feature/024-readme-examples-2-3
163340933a93d804fc6f038815972c3ba8cd6b81  refs/heads/feature/ui-figma-align-20261027
c5eac9b679ed8609926dc79bba3011d422a03ab9  refs/heads/fix/030-rework-g1-g6
c3f1d6e562bb706b0070e8e78eef52948f0e1c3f  refs/heads/main
```

核对结果：除去 `main`、`develop` 和 §4 的保留分支，两仓剩下的远程分支和 Planner 清单逐条一致，没有清单外的分支。

### 4.2 删除前门禁：`git merge-base --is-ancestor <branch> origin/main`

远程分支检查的是 fetch 后的跟踪引用，并先确认它的 SHA 与 ls-remote 读到的一致。同名本地分支单独检查。

| 仓库 | 分支 | 远程 SHA | 远程祖先 | 本地 SHA | 本地祖先 |
|---|---|---|:-:|---|:-:|
| Server | `feature/0.3.2-opinion-display` | `293432ce` | TRUE | `1aa677d7` | TRUE |
| Server | `feature/0.4.0-multi-database` | `19ae82f3` | TRUE | `19ae82f3` | TRUE |
| Server | `feature/023-agent-execution-lifecycle` | `30370877` | TRUE | `30370877` | TRUE |
| Server | `feature/024-readme-examples-2-3` | `f0906a21` | TRUE | `8b65ae53` | TRUE |
| Server | `fix/030-rework-g1-g6` | `a05fb7f4` | TRUE | `a05fb7f4` | TRUE |
| Web | `feature/0.3.2-opinion-display` | `09062a8f` | TRUE | `09062a8f` | TRUE |
| Web | `feature/0.3.3-opinion-summary` | `a8f8416e` | TRUE | `a8f8416e` | TRUE |
| Web | `feature/0.3.4-opinion-label-fallback` | `b884bccc` | TRUE | `b884bccc` | TRUE |
| Web | `feature/0.3.5-flow-table-fit` | `2b18fdc1` | TRUE | `2b18fdc1` | TRUE |
| Web | `feature/0.3.6-command-params-cn` | `8dd02203` | TRUE | `8dd02203` | TRUE |
| Web | `feature/023-agent-execution-lifecycle` | `3ae42cb4` | TRUE | `3ae42cb4` | TRUE |
| Web | `feature/024-readme-examples-2-3` | `924ae7c6` | TRUE | `5d531ce7` | TRUE |
| Web | `fix/030-rework-g1-g6` | `c5eac9b6` | TRUE | `c5eac9b6` | TRUE |

26 项全部 TRUE。两条本地 `feature/024-readme-examples-2-3` 原来分别领先远程 4 个、1 个提交，但这些提交也都是 `origin/main` 的祖先，说明已经通过别的路径合进了 main，删掉不会丢提交。保留分支：Server `feature/p62-perf-bounded-20261011` 领先 main 16 个提交，Web `feature/ui-figma-align-20261027` 领先 1 个，与 final-04 §4 一致。

### 4.3 删除执行

- **远程**：用 `git push origin --delete <branch>` 逐条删除，共 13 条（Server 5、Web 8），全部 `[deleted]`。没有强推，没碰 tag。删 Server 第 2 条时代理链路抖动，连续 4 次在 TLS 握手阶段失败（`SSL_connect: SSL_ERROR_SYSCALL`，请求没有到达 GitHub）；探测连通恢复后从这一条接着删，之后没有再失败。
- **本地**：两仓都检出在 `main`（工作区未动），用 `git branch -d` 删掉 13 条同名本地分支，`-d` 会拒绝未合入的分支。下面是删除前的完整 SHA，需要时可以按 SHA 恢复：

| 仓库 | 本地分支 | 删除前 SHA |
|---|---|---|
| Server | `feature/0.3.2-opinion-display` | `1aa677d70a02634058d80dd7f793b08f6a3e76c4` |
| Server | `feature/0.4.0-multi-database` | `19ae82f3f5028b2bc2765c374dc28490f0d52ed3` |
| Server | `feature/023-agent-execution-lifecycle` | `30370877af8bd07d5f4309246c39f0539e069323` |
| Server | `feature/024-readme-examples-2-3` | `8b65ae53dda5e3e35d036a4c4fb6bb78b8f530f5` |
| Server | `fix/030-rework-g1-g6` | `a05fb7f49957973936bae34e854b7394029354ce` |
| Web | `feature/0.3.2-opinion-display` | `09062a8f93c35d3f6cb772953ab6fd9c31f2b36d` |
| Web | `feature/0.3.3-opinion-summary` | `a8f8416e3f39d20e5d9659f4d9bec428568e05cc` |
| Web | `feature/0.3.4-opinion-label-fallback` | `b884bccc3ebe5fdd1cd272fcb3986f0d72efec53` |
| Web | `feature/0.3.5-flow-table-fit` | `2b18fdc107ca76c19416827b9a285c85cc317509` |
| Web | `feature/0.3.6-command-params-cn` | `8dd02203d1c73a6d78ca8702d540853c70e192c5` |
| Web | `feature/023-agent-execution-lifecycle` | `3ae42cb4fed56a71df5839df831ccf90e74284fe` |
| Web | `feature/024-readme-examples-2-3` | `5d531ce7cf1c256be354e53603b49394df2781b0` |
| Web | `fix/030-rework-g1-g6` | `c5eac9b679ed8609926dc79bba3011d422a03ab9` |

- Web 子模块的 `vite.config.ts` 在途改动全程保持 ` M`，没有切换分支，也没有暂存。

### 4.4 Web `develop` 快进到 `main`

- 门禁：`origin/develop` 是 `origin/main` 的祖先（TRUE）。`develop..main` 有 3 个提交，正是 0.3.4、0.3.5、0.3.6 的 develop→main 合并；`main..develop` 为 0。
- 普通推送：`git push origin c3f1d6e5…:refs/heads/develop`，结果 `0d71982..c3f1d6e`（快进，没有强推）。
- 回读：`refs/heads/develop = refs/heads/main = c3f1d6e562bb706b0070e8e78eef52948f0e1c3f`。
- 本机 `develop` 引用也已对齐：Web 为 `c3f1d6e5`；Server 原来落后 2 个提交，现为 `a4f6c278`。两边都检出在 `main`，工作区没有改动。

### 4.5 删除后远程清单与 tag

Server（3 条）：

```text
a4f6c27815548e6fd63be0d40e24796139f3f1fa  refs/heads/develop
7c305978be1b82cb25c4474ab674cab8803470c0  refs/heads/feature/p62-perf-bounded-20261011
a4f6c27815548e6fd63be0d40e24796139f3f1fa  refs/heads/main
```

Web（3 条）：

```text
c3f1d6e562bb706b0070e8e78eef52948f0e1c3f  refs/heads/develop
163340933a93d804fc6f038815972c3ba8cd6b81  refs/heads/feature/ui-figma-align-20261027
c3f1d6e562bb706b0070e8e78eef52948f0e1c3f  refs/heads/main
```

tag：`git ls-remote --tags origin` 删除前后逐行 `diff` 为空（Server 84 行，Web 90 行）。`0.4.0` 仍是 annotated tag 对象 `6093c4cc…`，指向 `a4f6c278`；Web `0.3.6` 仍为 `c3f1d6e5`。

**对照 final-04 §6 验收标准：通过。** Server 远程只剩 `main`、`develop`、`feature/p62-perf-bounded-20261011`；Web 远程只剩 `main`、`develop`、`feature/ui-figma-align-20261027`，且 Web `develop` = `main`。

### 4.6 清单外的本地分支（只读核对，未删）

§3 授权删除的本地分支只包括 13 条同名分支。下面这些本地分支不在清单里，本轮**没有删除**，只做了只读核对，交 Planner 按长期规则裁决：

| 仓库 | 本地分支 | 上游 | 已合入 `origin/main` | 领先 main |
|---|---|---|:-:|---:|
| Server | `0.1.1-bugfix` | 仅本地 | TRUE | 0 |
| Server | `bugfix/0.1.7` | 远程已删 | TRUE | 0 |
| Server | `feature/0.3.0-sample-processes` | 仅本地 | TRUE | 0 |
| Server | `feature/0.3.1-approval-driven-flow` | 仅本地 | TRUE | 0 |
| Server | `feature/p61-user-facing-message-humanization` | 远程已删 | TRUE | 0 |
| Server | `feature/p64-mes-advanced-orchestration` | 远程已删 | TRUE | 0 |
| Server | `fix/openapi-callback-tenant-017` | 远程已删 | TRUE | 0 |
| Server | `fix/super-tenant-visibility` | 远程已删 | TRUE | 0 |
| Web | `0.1.1-bugfix` | 仅本地 | TRUE | 0 |
| Web | `bugfix/0.1.7` | 远程已删 | TRUE | 0 |
| Web | `feature/p61-msg-scope-corrected` | 仅本地，**被工作树 `E:/code/p61-wt-web` 检出** | TRUE | 0 |
| Web | `feature/p61-user-facing-message-humanization` | 远程已删 | TRUE | 0 |
| Web | `feature/p64-mes-advanced-orchestration` | 远程已删 | TRUE | 0 |

这 13 条都已合入 main，没有领先提交，用 `git branch -d` 删掉也不会丢提交。只有 `feature/p61-msg-scope-corrected` 不同：要删它，得先移除工作树 `E:/code/p61-wt-web`，而那个目录里可能还有没提交的文件，需要工作树的使用者确认。Server 本地还有 `feature/p62-perf-bounded-20261011`，属于未完成分支，按裁决保留。

## 5. 清单外本地分支清理（`planning-review-final-05.md` §3）

final-05 §3 裁决：§4.6 的 13 条清单外本地分支按 Owner 长期规则删除，不再单独问 Owner。执行于 2026-11-09，证据留在本机 `E:/code/Smart-WorkFlow-Agent-Evidence/p66-040/branch-cleanup/`（`delete-local-2.log`、`local-branches-final.txt`）。

### 5.1 12 条直接删除：全部成功

删除前逐条重验：分支存在、`merge-base --is-ancestor origin/main` 为 TRUE、领先 `origin/main` 0 个提交；只用 `git branch -d`，**没有 `-D`，没有一条被拒绝**。删除前 SHA：

| 仓库 | 本地分支 | 删除前 SHA |
|---|---|---|
| Server | `0.1.1-bugfix` | `7ff4743b3aff714f9058ede783d0b1af8eb8fd9f` |
| Server | `bugfix/0.1.7` | `2d776effb1a58fac3c6c9bfac7f0ba20eedf4f2b` |
| Server | `feature/0.3.0-sample-processes` | `79f00d3c45254f272766533da1109877c3507ee4` |
| Server | `feature/0.3.1-approval-driven-flow` | `6a1134318512ccd75c0b28bdc3acc2f676ba5346` |
| Server | `feature/p61-user-facing-message-humanization` | `6698b8cafd67c04708ad83224d5ee0339741576d` |
| Server | `feature/p64-mes-advanced-orchestration` | `c0cbe60d9fae6e7a68819c5e5775efcee6201fa7` |
| Server | `fix/openapi-callback-tenant-017` | `00e0a7390a9653777bc58144acef864b39a57f10` |
| Server | `fix/super-tenant-visibility` | `f58e3aea2822879f70a49393d74759ec88b57c1b` |
| Web | `0.1.1-bugfix` | `281892e43b67b466326b25fb83f2e471a5ca48fe` |
| Web | `bugfix/0.1.7` | `fe1712bc8c53eb0d49d510b1336d9d998902fd6f` |
| Web | `feature/p61-user-facing-message-humanization` | `29d90e8c8c911ffb668884eb700a0818fcf8fe93` |
| Web | `feature/p64-mes-advanced-orchestration` | `4333145a76e1ec4926e559802d6e7295af72a403` |

### 5.2 `feature/p61-msg-scope-corrected`：分支已删，工作树注册已移除，残留物理目录交 Owner

- 只读检查：`git -C E:/code/p61-wt-web status --porcelain` 输出为**空**（无未提交、无未跟踪文件），HEAD `d110ed8b`，符合 §3.2 的"干净"分支，按第一条路径执行。
- `git worktree remove E:/code/p61-wt-web`（未加 `--force`）：**git 侧已成功**——注册解除，`worktree list` 只剩主仓，主仓 `.git/worktrees/` 已清空；但物理目录没能删空，报 `error: failed to delete 'E:/code/p61-wt-web': Directory not empty`（rc=255）。残留 32,180 个文件，其中 31,717 个在被 gitignore 的 `node_modules` 下；最长路径 226 字符，没超过 Windows 260 限制，具体受阻原因未进一步定位。
- 随后按流程 `git branch -d feature/p61-msg-scope-corrected`：成功（删除前 SHA `d110ed8b17161c8cfcd0036c69309d0ddb5e4dd7`，已合入 main、领先 0）；`git worktree prune` 已执行。
- **残留**：`E:/code/p61-wt-web`（312 MB）已脱离 git（`.git` 文件已删，`status` 报 not a git repository），内容是来自 `d110ed8b` 的跟踪文件，加上可以重建的 `node_modules`；该提交已在 `origin/main` 中，目录里没有只此一份的内容。指令未授权文件系统级 `rm`，**本轮未删除该目录，交 Owner 手动删除**（直接资源管理器删除即可）。
- 保护项核实：Owner 要求保护的 8080/5173 服务与该目录无关——8080 是 `java -jar sw-bootstrap/target/bootstrap.jar`（连 `smart_workflow_f1v4b`），5173 的 node 进程实际运行的是主仓 Web 的 vite（命令行端口 `--port 15174`）；全系统没有进程以 `p61-wt-web` 为工作目录。

### 5.3 终态回读（`git branch -vv`）

Server（3 条，符合 §3.3）：

```text
  develop                           a4f6c278 [origin/develop]
  feature/p62-perf-bounded-20261011 7c305978 [origin/feature/p62-perf-bounded-20261011]
* main                              a4f6c278 [origin/main]
```

Web（2 条；其未完成分支 `feature/ui-figma-align-20261027` 本来就只在远程）：

```text
  develop c3f1d6e [origin/develop]
* main    c3f1d6e [origin/main]
```

两仓均检出 `main`、工作区无新改动（Web 仅原有 `vite.config.ts` 在途）；本轮只动本地引用，未做任何推送，远程与 tag 无变化。

### 5.4 附带发现：Server 另有 2 个额外 worktree（只读核对，未动）

`git worktree list` 显示 Server 还有两个额外工作树，均**不在本轮指令范围**，未做任何改动，交 Planner/Owner 按长期规则裁决：

| 工作树 | HEAD（detached） | 对应已删分支 tip | 已合入 main | 脏文件 | 大小 |
|---|---|---|:-:|---:|---:|
| `.lc023-mock/lc023-server-wt` | `30370877` | `feature/023-agent-execution-lifecycle` | TRUE | 1 | 474 MB |
| `E:/code/sw030-server` | `6a113431` | `feature/0.3.1-approval-driven-flow` | TRUE | 0 | 310 MB |

两者内容都已合入 main；`.lc023-mock` 下的工作树有 1 个脏文件（其中可能含 Owner 要求保留的隔离环境内容），删除前需单独确认。

## 6. Z6：两个代码仓 `main` 的 README 同步到当前版本（`planning-review-final-07.md` §3）

Owner 发现 Server、Web 在 GitHub `main` 上的 README 还写着 0.2.4。本节把两仓 README 同步到当前版本（Server 0.4.0、Web 0.3.6），按 0.2.3 的先例走 develop → main → develop 对齐。没有建 tag、没有移动 tag、没有手动改 Release。改前的 README、GitHub 页面快照等证据留在本机 `E:/code/Smart-WorkFlow-Agent-Evidence/p66-040/z6/`，不进 Git。

### 6.1 过期表述盘点（两仓 `main`，改前）

搜索范围：两仓的 `README*`、Server 的 `功能清单.md`、两仓 `docs/` 下的说明文档。两仓都没有文档索引页。把 0.2.x 写成“当前”的地方集中在 3 个文件：

| 仓库 | 文件与行 | 原表述 | 处理 |
|---|---|---|---|
| Server | `README.md` L16—18 | 「当前可体验」一节开头是一整段“当前发布版本为 **0.2.3**……” | 整篇替换 |
| Server | `README.md` L60—64 | 「当前版本」一节写“当前正式发布版本为 **0.2.4**……此前 **0.2.3**……” | 整篇替换 |
| Server | `README.md` L36—58 | 三个示例场景还写着“作为平台应用愿景呈现”“不属于 0.1.0 已交付范围” | 整篇替换，标“已完成” |
| Server | `功能清单.md` L56 | 当前焦点写“0.2.2 整版交付合并发布中” | 前面插入 0.4.0 当前焦点行，原行加“历史焦点”前缀保留 |
| Web | `README.md` L16—18 | 同 Server，“当前发布版本为 **0.2.3**……” | 整篇替换 |
| Web | `README.md` L57—61 | “当前正式发布版本为 **0.2.4**……此前 **0.2.3**……” | 整篇替换 |
| Web | `README.md` L33—55 | 三个示例场景同 Server | 整篇替换，标“已完成” |

顺带修正：两仓「项目入口」里的 `../README.md`、`../Smart-WorkFlow-aPaaS-*/README.md`（Server L72、L75，Web L69、L72）是按工作区目录写的相对路径，在单独的代码仓里是死链，已改成 GitHub 绝对链接。

排除项（不是“当前版本”的表述，未改）：

- Server `docs/governance/error-code-catalog.md:217` 的“来源行当前版本冲突”：指数据行的版本号，与发布版本无关。
- Server `功能清单.md` 里带日期的历史说明（L28—45、L197、L252—255、L377）：属于时点记录，原样保留。
- 各数据库迁移目录、资产目录下的 README：没有“当前版本”表述。

### 6.2 改动内容

**Server**（`README.md` 整篇替换；`功能清单.md` 插入 1 行，并给原行加前缀）：

- 页首写明当前正式版本 0.4.0、配套前端 Web 0.3.6，以及九种数据库。
- 「当前版本：0.4.0」：tag `0.4.0`→`a4f6c278`（annotated）、Release「CH-aPaaS Server 0.4.0」`438918154`、`bootstrap-0.4.0.jar` 236,245,457 B 和完整 sha256、CI main run `42588179160`、Flyway V0.4.0 的两条新迁移、UAT `build.version=0.4.0`。
- 升级 4 步：备份；换 jar 后自动迁移；`DatabaseCompatibilityGuard` 在迁移前检查库级前提；默认 INFO 日志。
- 「回退到 0.3.2」：写明只换 jar 会因 Flyway 校验失败（`Detected applied migration not resolved locally`）无法启动，必须先停服、恢复 `smart_workflow_20261109_pre040.dump`，再换回 0.3.2 的 jar。`production-ops.md` 只在工作区仓库里，所以用绝对链接指向工作区 `develop-sw` 分支，引用 §8.1（后端升级）和 §9.1（数据备份）。
- 「多数据库支持」：九库矩阵与工作区 README 逐行一致，DM8、KingbaseES 标“Owner 实库验证”，链接 `docs/deployment/multi-database.md`。
- 「当前可体验」：注明适用于 0.4.0，补“审批意见驱动流转”“Agent 与知识”两条；渠道与 SSO 的真实凭据状态如实写明（邮件已用真实凭据发送成功，其余尚未验证）。
- 三个示例场景标“已完成”，A/B/C 的链路与工作区 README 一致；B 写明告警目前走站内信和邮件，短信、电话渠道尚未接入。
- 「版本历史」：0.4.0、0.3.2、0.3.1、0.3.0、0.2.4—0.2.0 各一行，原来 0.2.3、0.2.4 的两段长文压缩进表里。0.3.0 一行写明“Owner 2026-11-07 审核后退回”、退回原因，以及由 0.3.1—0.3.6 返修；0.3.0 的 tag、Release 和部署记录保持原样。
- `功能清单.md`：新的当前焦点行写 0.4.0 的发布与部署事实（tag、Release、jar 大小、UAT、九库范围、三示例已完成、开发默认版本）；原来的 0.2.2 焦点行保留，加“历史焦点（2026-11-09 被上条覆盖）”前缀，便于按时点追溯。

**Web**（`README.md` 整篇替换）：

- 页首写明当前正式版本 0.3.6、搭配后端 Server 0.4.0（UAT 当前组合）。
- 「当前版本：0.3.6」：tag `0.3.6`→`c3f1d6e`、Release「CH-aPaaS-Web 0.3.6」`438126185`（标题照 Release 页原样写，带连字符）、`sw-web-dist-0.3.6.zip` 6,197,059 B 和完整 sha256、CI main run `42463025237`、UAT 入口 `assets/index-CKdiXkhU.js`。
- 「与后端的搭配」：Server 0.4.0 只改数据库适配，业务功能与 0.3.2 相同，所以 Web 不需要随版升级。
- 「当前可体验」：注明适用于 0.3.6，补“审批意见展示”“Agent 与 IoT 配置”两条，“流程设计与运营”补上应用整包导出导入。写之前在 Web 源码里确认过对应页面都在：`src/modules/agent/views` 下有模型、供应商、图设计器、执行详情、工具、知识库页面，`AppManageList.vue` 有整包导入导出。
- 三个示例场景标“已完成”，删掉“不属于 0.1.0 已交付范围”的旧说明。
- 「版本历史」：0.3.6—0.2.0 各一行。两仓都没有 0.2.5；0.3.1 只发了后端，Web 没有打 tag；0.3.2 注明由 `8339a08` 前移；0.3.0 和 Server 一样写明被 Owner 退回。

**事实来源**：tag→提交用 `git ls-remote --tags origin` 回读（annotated tag 取 `^{}` 解引用）；两个制品的 sha256 与 GitHub Release 资产页（`releases/expanded_assets/<tag>`）显示的摘要逐字一致；各版本内容按工作区 `CHANGELOG.md` 0.2.0—0.4.0 各节核对。

### 6.3 提交前校验

- Server 仓没有 git 钩子，CI 也不检查 Markdown。
- Web 仓用 simple-git-hooks：pre-commit 跑 `lint-staged`（`*.md` 走 `prettier --write`，eslint 只管 ts/tsx/vue），commit-msg 跑 `commitlint`。用户的 Web 主检出有 `vite.config.ts` 在途改动，在那里提交时 lint-staged 会暂存、还原工作区，可能波及这处改动。所以提交改在临时工作树里做，带 `SKIP_SIMPLE_GIT_HOOKS=1`，钩子里的检查逐项手工执行：
  - prettier 3.8.4（用主检出的 `node_modules/.bin/prettier`，读临时工作树的 `.prettierrc.json`、`.prettierignore`）：`--write` 之后 `--check` 通过；
  - commitlint：在主检出目录运行，配置文件与临时工作树逐字节相同。第一版提交说明以 `README` 开头，被 `subject-case` 规则拦下（这条规则只检查以英文字母开头的 subject）；改成中文开头后，develop 和 main 两条说明都通过。
- 改动范围：Server develop 提交只含 `README.md`、`功能清单.md`，Web 只含 `README.md`；两个合并提交相对 `main` 也只有这些文件。
- Web 主检出全程只有 ` M vite.config.ts`：没有暂存、没有提交、没有切换分支。

### 6.4 提交与合入

用户的主检出占着 `main`，所以在临时工作树 `E:/code/_z6-wt/{server,Web}` 里操作：先在 develop 提交并推送；再 detach 到 `origin/main` 做 `--no-ff` 合并，普通推送到 `main`；最后把 `develop` 快进到合并提交并推送。全程普通推送，没有强推。

| 仓库 | develop 提交 | main 合并提交（父提交） | 推送 | 远端回读 |
|---|---|---|---|---|
| Server | `3b4f1c92`「docs(readme): README 与功能清单同步到 0.4.0（多数据库矩阵、回退须先恢复 pre040 备份、版本历史）」 | `7d009021`（`a4f6c278` + `3b4f1c92`）「docs(readme): merge develop into main（README 与功能清单同步到 0.4.0）」 | develop `a4f6c278..3b4f1c92`；main `a4f6c278..7d009021`；develop `3b4f1c92..7d009021` | main = develop = `7d0090215d6ee7c5a0d9a70037e9576804e2eede` |
| Web | `9e6ba33`「docs(readme): 同步 README 到 0.3.6（搭配 Server 0.4.0、版本历史）」 | `e181e25`（`c3f1d6e` + `9e6ba33`）「docs(readme): merge develop into main（同步 README 到 0.3.6）」 | develop `c3f1d6e..9e6ba33`；main `c3f1d6e..e181e25`；develop `9e6ba33..e181e25` | main = develop = `e181e25fce3b785a0e2aa8c205e4a9eed6de3201` |

develop 提交的完整 SHA：Server `3b4f1c92138774fac6037bbb13aa24aec61f9e83`，Web `9e6ba3327c9daa4ce6ab1652543f39483e2e526c`。

Server 推送 develop 对齐时，首次推送和紧接着的 2 次重试都在 TLS 握手阶段失败（`SSL_ERROR_SYSCALL`，请求没有到达 GitHub），第 3 次重试成功。

**做法纠正**：本回执涉及的几轮执行中，早先有网络重试循环用了 `sleep` 间隔，违反 `system.md` §0.8.2（严禁 `sleep` 和延时轮询空转等待）。之后全部改成有次数上限的立即重试。等 CI 期间也没有空转：先做不依赖 CI 的工作（Web README、渲染回读、回执），做完再查结果。

### 6.5 main CI、自动产物与 Latest

| 仓库 | main run | 结果 | CI 自动建的产物 |
|---|---|---|---|
| Server | `42631428381`（Build & Release 第 130 次） | completed successfully | tag `build-7d0090215d6ee7c5a0d9a70037e9576804e2eede`；Release「CH-aPaaS-Server 0.4.0 build 7d009021…」，`bootstrap-0.4.0.jar` sha256 `c2c2ec3d9f135d3d1717b1125123339c34956ec85af4cec8eb5a7c8153df8d00` |
| Web | `42633872862`（第 82 次） | completed successfully | tag `build-e181e25fce3b785a0e2aa8c205e4a9eed6de3201`；Release「CH-aPaaS-Web 0.3.6 build e181e25…」，`sw-web-dist-0.3.6.zip` sha256 `5ed2421df82c62e5c058b886bcd5424c1f274c3acd1f78fe90d9b73638358212` |

回读方式：GitHub API 的匿名配额已经用完，本轮也没有用凭据管理器里的令牌。run 状态取自公开的 Actions 页面（`aria-label` 为 “completed successfully: Run 130/82 …”，页面上 run id 与运行序号相邻）。工作流最后一步才建 `build-<sha>` Release，所以这个 tag 出现，也说明整条流水线已经跑完。

tag 和语义 Release 没有被动过：

- 两仓 `git ls-remote --tags origin` 与 §4.5 清理后的基线逐行比对，只多出上表的 `build-<sha>` 一行（Server 84→85 行，Web 90→91 行）。`0.4.0` 仍是 annotated 对象 `6093c4cc`，指向 `a4f6c278`；`0.3.6` 仍是 `c3f1d6e`。
- 语义 Release 的资产没变：`0.4.0` 的 `bootstrap-0.4.0.jar` 仍是 `188be963…`，`0.3.6` 的 `sw-web-dist-0.3.6.zip` 仍是 `9470f0c1…`。

**需要 Owner 裁决：两仓的 Latest 被自动产物顶替了。** 工作流在 main 上执行 `gh release create "build-${GITHUB_SHA}"` 时没有带 `--latest=false`，新建的自动产物 Release 就成了 Latest：

| 仓库 | 合入前的 Latest | 现在的 Latest |
|---|---|---|
| Server | `0.4.0`（语义版） | `build-7d0090215d6ee7c5a0d9a70037e9576804e2eede` |
| Web | `0.3.6`（语义版） | `build-e181e25fce3b785a0e2aa8c205e4a9eed6de3201` |

影响：从 Latest 下载，会拿到与正式版**同名但字节不同**的制品（自动产物是从 README 合并提交重新构建的，所以 sha256 不同）。UAT 部署的仍是正式版制品，不受影响；README 里写的也是正式版的 Release 链接和 sha256。final-07 不允许改 Release，所以本轮没有处理。可选做法：

1. 在 GitHub 上把 `0.4.0`、`0.3.6` 重新设为 Latest（属于改 Release，需要授权）；
2. 以后给工作流中建自动产物的 `gh release create` 加上 `--latest=false`，从根上避免（两仓 CI 改动，需要单独立项）；
3. 维持现状。

建议 1 和 2 一起做。

### 6.6 GitHub 渲染与链接回读

取两仓 GitHub 首页 HTML（本机留存 `render-server-home.html`、`render-web-home.html`）：

| 检查项 | Server | Web |
|---|---|---|
| 默认分支 | `main` | `main` |
| 首页对应的提交（`currentOid`） | `7d009021…` | `e181e25…` |
| 通用新内容（“当前正式版本”“版本历史”“审核后退回”“三个示例场景（已完成）”） | 都在 | 都在 |
| 各自的新内容 | “多数据库支持”“Owner 实库验证”、`pre040`、`production-ops.md`、`multi-database.md` 都在 | 0.3.6 当前版本、搭配 Server 0.4.0 都在 |
| 旧的“当前发布版本为 0.2.3”长段 | 0 处 | 0 处 |
| README 表格 | 4 个（当前版本、多数据库、版本历史、项目入口） | 3 个（当前版本、版本历史、项目入口） |

页面里另有 1 个 `<table>` 是 GitHub 自己的文件列表，不计入。

链接：从两仓 `origin/main` 的 README 中提取全部链接和图片（Server 11 个、Web 9 个，相对路径按 `blob/main` 解析）逐个请求，**全部 HTTP 200**，包括 logo、`docs/deployment/multi-database.md`、工程宪法，以及指向工作区 `develop-sw` 的 `production-ops.md`、`CHANGELOG.md`、`knowledge/features/0.3.2-opinion-display.md`。

### 6.7 收尾

- 临时工作树 `E:/code/_z6-wt/server`、`E:/code/_z6-wt/Web` 都是干净的，已用 `git worktree remove`（不带 `--force`）移除，空目录 `E:/code/_z6-wt` 已删。两仓 `worktree list` 只剩主检出，以及 Owner 保留的 2 个 Server 隔离环境工作树（§5.4）。
- 用户的主检出没有动：两仓仍检出 `main`，本地 `main` 落后 `origin/main` 2 个提交（就是本节的 develop 提交和合并提交，只涉及 README 和 `功能清单.md`）；本地 `develop` 已在临时工作树里指到合并提交。Server 主检出有 8080 进程在用，Web 主检出有 `vite.config.ts` 在途改动，所以本轮不替使用者拉取，需要时在主检出执行 `git pull --ff-only` 即可。
- 留给 Planner 的发现：工作区 README「快速开始」第 3 步写着“按 server README 配置数据源与 Redis 后启动”“按 web README 安装依赖并启动开发服务器”，但两仓 README 改前改后都没有启动步骤（开发者资料在各自的工程宪法里）。本轮按 final-07 只同步版本内容，没有扩写；是改工作区 README 的指引，还是给两仓 README 补启动小节，由 Planner 决定。

## 7. Z7：两仓 README 重排为开源结构、快速开始实测、Latest 修复（`planning-review-final-08.md` §2/§3）

Owner 指出两代码仓的 README 也要按开源结构重排并配截图（根因是方向把范围收窄到了工作区 README，Planner 已更正方向，Executor 无过错）。本节按 final-08 §2 的 Server 10 项、Web 7 项执行，并按 Owner 对 §3 的授权做了两件事：两仓 CI 的 `build-<sha>` 自动产物固定 `--latest=false`；把 Server `0.4.0`、Web `0.3.6` 重新设为 Latest。证据留本机 `E:/code/Smart-WorkFlow-Agent-Evidence/p66-040/z7/`（含 `run/` 的实测配置与日志），不进 Git。

### 7.1 两仓 README 新结构

- **Server**（整篇替换，10 项齐全）：徽章（版本 0.4.0、internal demo、Java 21、Spring Boot 3.4、九库）；首图 `workflow-designer.png`（注明配合 Web 0.3.6 界面）；核心特性 9 行表；三示例流程 A/B/C 配图各 2—3 句（后端链路侧重：A 定时任务下发 MQTT 指令、B Agent 研判与 P1/P0 分级告警、C 阈值研判与工单流转）；Mermaid 架构图（`sw-biz`/`sw-basic`/`sw-framework` 分层与 DB、Redis、模型供应商、MQTT、通知渠道，模块名取自工程宪法 §1）；多数据库矩阵沿用 Z6；快速开始（见 7.3）；仓库结构与文档导航；当前版本 0.4.0 表 + 升级/回退要点（保留 Z6 内容），版本历史压成 3 行（0.4.0 / 0.3.x / 0.2.x）链接 tags 与 CHANGELOG；许可证与致谢（未附带开源许可证口径与工作区一致）。
- **Web**（整篇替换，7 项齐全）：徽章（版本 0.3.6、Vue 3、Vite 8、TypeScript、Element Plus——按 `package.json` 实际依赖）；首图 `workspace.png`；界面预览（表单/流程设计器两图）；核心特性 6 行表；Mermaid 架构图（views → modules → adapters 防腐层 → foundation，模块与 adapters 清单按 `src/` 实际目录核对）；快速开始（见 7.3）；与后端的搭配（保留 Z6）、仓库结构、版本与历史、许可证。

### 7.2 截图

- 用 P66 Z1 已通过的 6 张图**复制**进两仓 `docs/assets/readme/`（不跨仓引用）：Server 4 张（`workflow-designer` + `sample-a/b/c`），Web 6 张（`workspace`、`form-designer`、`workflow-designer` + `sample-a/b/c`）。两仓 `.gitignore` 都不拦 png，无需加例外。
- 文件大小：222,563—360,822 B，全部 ≤500KB。
- `agent-graph.png`、`approval-detail.png` 继续不放（final-03 §7 方案 A），Web 补丁修好后三份 README 一起补。

### 7.3 快速开始：逐项照实际核对并本机实测

实测环境：JDK 21.0.5、Maven 3.9.1、Node 22.14、pnpm 11.9、Docker 24；隔离资源（不碰用户的 8080/5173/5432/6379/1883 服务与 `smart_workflow_f1v4b`）：临时工作树 `E:/code/_z7-wt/{server,Web}`、容器 `z7-qs-pg`（`pgvector/pgvector:pg17`，127.0.0.1:55432）、`z7-qs-redis`（127.0.0.1:56379）、应用端口 18080、vite 端口 51873。

**Server**（`MAVEN_OPTS=-Xmx2g mvn -DskipTests package` → `bootstrap.jar` 236,245,672 B，构建约 4 分钟）：

- 前两次启动失败，暴露两处 README 必须写清的实际前提（都已写进文档）：
  1. `sw.form.enabled` / `sw.bpm.enabled` 在 `application-prod.yml` 里显式开启，业务层自动装配依赖它们（工程宪法 §1：`sw.form.enabled` 非 true 时 fail-fast）；local profile 必须显式带上，否则 `BpmNodeRegistry` 缺 bean 启动失败。
  2. `application-prod.yml` 排除了 Spring AI 的 `PgVectorStoreAutoConfiguration`（应用自管向量存储，Embedding 由 LangChain4j 按模型配置运行时装配），并给 `spring.ai.openai.api-key` 非空占位；local profile 同样需要这两条，否则 `PgVectorStoreAutoConfiguration` 找不到 `EmbeddingModel` 启动失败。
- 第三次启动成功：Flyway 全链迁移（V0.2.0→V0.4.0 + 19 支 R__）→ Tomcat 18080 → `health` 返回 `{"status":"UP"}`，启动约 2.5 分钟；`GET /api/auth/challenge` 返回验证码挑战；隔离库 `sys_user` 有种子超管（tenant 0 / admin）。
- 五个环境变量按 UAT 口径注入（`SW_LOGIN_RSA_PRIVATE_KEY`（本机生成的开发 RSA 密钥）、`SW_LOGIN_DIGEST_SECRET`、`SW_CIPHER_KEY`、`SW_SSO_CIPHER_KEY`、`JWT_SECRET`）；开发密钥本机生成，不写真实凭据、不入 Git、不进回执。README 给出 `openssl` 生成命令。
- `sw.iot` 保持关闭，全程无对 1883 的 MQTT 连接。

**Web**（`NODE_OPTIONS=--max-old-space-size=2048`）：`pnpm install` 9.9 秒（pnpm 缓存命中）；`pnpm build`（vue-tsc + vite）4.7 秒通过；dev 服务器以 `VITE_PROXY_TARGET=http://127.0.0.1:18080` 起在隔离端口 51873，页面 200，`/api/actuator/health` 经代理返回 UP，`/api/auth/challenge` 经代理返回验证码。实测纠正了 README 初稿的端口写法：`pnpm dev -- --port` 会把 `--` 当字面参数传给 vite，正确写法是 `pnpm dev --port 51873`。已提交的 `vite.config.ts`（origin/main 版本）确认代理键为 `VITE_PROXY_TARGET`；用户的在途改动未读取、未引用。

**资源互斥口径**：`shared-constraints.md` §6 的前后端编译互斥按“重型编译/构建命令不同时跑”执行——我的 Maven 与 pnpm 全程串行且带 2G 上限；用户的 8080 java 与 5173 vite 是 Owner 常驻服务而非编译进程，未等待也未触碰。

### 7.4 工作流 `--latest=false`（Owner 已授权）

两仓 `.github/workflows/build-release.yml` 建自动产物的 `gh release create` 各加一行 `--latest=false`（改动在 `run: |` shell 块内，一行参数；`gh release delete/create` 其余逻辑未动）。

### 7.5 提交与合入

方式与 Z6 相同：临时工作树内 develop 提交 → detach 到 `origin/main` `--no-ff` 合并 → 普通推送 → develop 快进对齐。Web 提交带 `SKIP_SIMPLE_GIT_HOOKS=1`，等效检查（主检出 prettier 3.8.4 `--check`、commitlint）通过；首版提交说明以英文 `README` 开头再次被 `subject-case` 拦下，改为中文开头后通过。每仓 3 个 develop 提交 + 2 个 main 合并提交：

| 仓库 | develop 提交（依序） | main 合并（依序） | 远端终态 |
|---|---|---|---|
| Server | `80c91bb1` README+截图、`c17723f1` CI 参数、`0d6224c1` 功能清单链接修复 | `88a0252b`（`7d009021`+`c17723f1`）、`7d0f2a2e`（`88a0252b`+`0d6224c1`） | main = develop = `7d0f2a2ec90ed3af1eef519a6ff59236898feb50` |
| Web | `20ec998` README+截图、`aa1cffb` CI 参数、`00533e4` 功能清单链接修复 | `49305d0`（`e181e25`+`aa1cffb`）、`bed840d`（`49305d0`+`00533e4`） | main = develop = `bed840d0e834d89476cf6e9c87e64edf780a313a` |

链接修复的原因：链接回读发现中文路径 `功能清单.md` 不带百分号编码会 404，改用 `%E5%8A%9F%E8%83%BD%E6%B8%85%E5%8D%95.md` 后 200；Web 原先指向工作区仓库 `Smart-WorkFlow-aPaaS-server/功能清单.md` 的路径不存在（工作区不跟踪嵌套仓库），改为指向 Server 仓库。两次合入各触发一轮 main CI，共两轮 `build-<sha>` 产物（均 `--latest=false`）。

### 7.6 Latest 修复（Owner 已授权，本机 git 凭据）

- 方式：`git credential fill` 取本机已存 GitHub 凭据（40 字符令牌，仅在内存变量中使用，未显示、未落盘、未写回执），对两个语义 Release 调 `PATCH /releases/{id}` `{"make_latest":"true"}`（Server `438918154`、Web `438126185`，均 HTTP 200）；未改资产、说明与 tag。
- 回读：`releases/latest` 重定向 Server → `0.4.0`、Web → `0.3.6`。
- CI 产物是否遵守 `--latest=false`、Latest 是否被再次顶替，见 §7.7。

### 7.7 main CI、渲染与链接回读

- **渲染**：两仓 GitHub 首页 `currentOid` 分别等于两个仓的最终合并提交；徽章（shields.io 引用 Server 10、Web 12）、Mermaid、README 图片引用、快速开始各小节锚点（`#1-克隆与构建` 等）与「快速开始」标题 id（`user-content-快速开始`）都在渲染 HTML 中确认。
- **链接**：两仓 `origin/main` README 全部链接与图片逐个请求——Server 19 项、Web 19 项，除上述已修复的 2 处外全部 200（首次失败的 `workspace.png` 为偶发，重试 200）。
- **CI 与 Latest**：四个合并提交各触发一轮 main CI。首轮中 Web 两轮失败在 `pnpm/action-setup@v4` 自装（`Something went wrong, self-installer exits with code 1`，发生在 checkout 之后的依赖安装前，与本次改动无关的基础设施抖动）；Server 第二轮失败在 `AgentModelManageServiceImplTest` 1 Error（已知 CI 抖动族，见 `todo/iot-subprocess-output-race.md` 与 0.2.3 同提交 rerun 先例）；Server 第一轮同代码 success。按 0.2.3 先例对三个失败 run 做 rerun-failed-jobs（API，HTTP 201），四个 run 终态全部 success：

| 仓库 | run | 提交 | 终态 |
|---|---|---|---|
| Server | `42644899994` | `88a0252b` | success |
| Server | `42645938797` | `7d0f2a2e`（rerun） | success |
| Web | `42644984282` | `49305d0`（rerun） | success |
| Web | `42645875693` | `bed840d`（rerun） | success |

- 四个 `build-<sha>` tag/Release 全部建成（两仓各 2 个，均 `--latest=false`）；tag 总数 Server 84→87 行、Web 90→93 行（基线 + Z6 的 1 个 + Z7 的 2 个），语义 tag 与 Release 资产未动。
- **Latest 在两轮新 build Release 建成后仍为 `0.4.0` / `0.3.6`**——`--latest=false` 在真实 CI 生效，§6.5 的问题从根上关闭。

### 7.8 收尾

- 隔离资源全部清理：两个容器已 `docker rm -f`；应用进程由 `timeout` 兜底自行退出，端口 18080/51873 已释放；临时工作树移除（Web 工作树含 node_modules，用 `--force` 移除，内容全部可由 pnpm 重建）；用户主检出未动（`vite.config.ts` 在途改动保持 ` M`）。
- 工作区 README「快速开始」第 3 步已改为指向两仓 README 的 `#快速开始` 锚点（§8 第 1 条的渲染验证见工作区提交记录）。

## 8. 下一步

1. 2026-11-10 17:16 后：Executor 补做 Z4，回填本回执 §3。
2. Z4 完成后：Planner 做 P66 终态复核（正式登记第 52 个功能、方向归 `passed/`、COMPLETED）。§4、§5 的分支清理、§6 的 Z6、§7 的 Z7 都已完成，不再阻塞终态复核。
3. 已完成（Owner 2026-11-09 授权，§7.4/§7.6）：两仓工作流已加 `--latest=false`，Server `0.4.0`、Web `0.3.6` 已重新设为 Latest。Planner 终态复核时回读 Latest 与两轮 `build-<sha>` 产物确认未被顶替。
4. 已完成（§7.1/§7.3）：两仓 README 已重排并新写快速开始；工作区 README「快速开始」第 3 步已指向两仓 `#快速开始` 锚点。
5. Web 缺陷 W-a—W-d 已登记在 `todo/web-ui-defects-20261109.md`，等下一个 Web 补丁方向（Owner 已裁决现在不开 Web 0.3.7）。补丁发布后，重拍智能体编排图和审批详情图，三份 README 一起补图。
6. Owner（可选）：手动删除已脱离 git 的残留目录 `E:/code/p61-wt-web`（312 MB，内容已全部在 main 里，无唯一文件）；不删也不影响任何东西（`planning-review-final-06.md` §2）。
7. §5.4 的两个 Server 额外 worktree 已裁决（`planning-review-final-06.md` §3）：两者属于 0.2.3/0.3.0 的隔离环境，按 Owner 既有裁决**保留**；detached HEAD 不占用分支，不受“合并即删”规则管辖；以后 Owner 撤掉隔离环境时，再连同 `.runtime-*` 和隔离库一起清理。
