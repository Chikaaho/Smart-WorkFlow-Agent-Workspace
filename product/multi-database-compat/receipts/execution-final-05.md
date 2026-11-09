# P66 收尾补做回执（execution-final-05）

| 项目 | 内容 |
|---|---|
| 功能 | P66 多数据库兼容（XL，0.4.0） |
| 依据 | `product/multi-database-compat/receipts/planning-review-final-03.md` §6/§7（Owner 裁决方案 A）；`planning-review-final-04.md` §3/§6（远程分支清理，Owner 裁决） |
| 日期 | 2026-11-09 |
| 执行角色 | Executor |
| 状态 | **第 1 项完成**（README 下掉 2 张图并回读渲染）；**分支清理完成**（§4）；**清单外本地分支清理完成**（§5）；**Z4 待时间窗**（2026-11-10 17:16 之后） |
| 结论 | README 界面预览保留 6 张，`agent-graph.png`、`approval-detail.png` 引用与图注已移除、图片文件保留在仓库；GitHub raw 与渲染 HTML 双回读通过。13 条已合入分支（Server 5、Web 8）远程与本地均已删除，Web `develop` 已普通快进到 `main`；两仓远程各剩 3 条分支，tag 前后逐行一致。§4.6 清单外 13 条已合入本地分支也已按 final-05 §3 删除（`feature/p61-msg-scope-corrected` 的 git 工作树注册已移除，残留 312 MB 物理目录 `E:/code/p61-wt-web` 交 Owner 手动删除）。两仓本地各剩 `main`、`develop` 和未完成分支（Server `feature/p62-perf-bounded-20261011`）。P66 在 Z4 补做后即可进入 Planner 终态复核 |

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

## 6. 下一步

1. 2026-11-10 17:16 后：Executor 补做 Z4，回填本回执 §3。
2. Z4 完成后：Planner 做 P66 终态复核（正式登记第 52 个功能、方向归 `passed/`、COMPLETED）。§4、§5 的分支清理均已完成，不再阻塞终态复核。
3. Web 缺陷 W-a—W-d 已登记在 `todo/web-ui-defects-20261109.md`，等下一个 Web 补丁方向（Owner 已裁决现在不开 Web 0.3.7）。补丁发布后，重拍智能体编排图和审批详情图，放回 README。
4. Owner：手动删除已脱离 git 的残留目录 `E:/code/p61-wt-web`（312 MB，内容已全部在 main 里，无唯一文件）。
5. Planner/Owner 裁决：§5.4 的两个 Server 额外 worktree（`.lc023-mock/lc023-server-wt`、`E:/code/sw030-server`）是否按长期规则处理；其中 `.lc023-mock` 有 1 个脏文件，且可能涉及 Owner 定保留的隔离环境，动前需单独确认。
