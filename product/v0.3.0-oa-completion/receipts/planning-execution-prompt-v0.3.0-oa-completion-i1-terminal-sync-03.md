# P60 I1 终态同步三级执行补充提示 03

> 日期：2026-09-09  
> 功能：P60 `v0.3.0-oa-completion` / I1 组织与权限底座  
> 依据：`planning-review-terminal-sync-stage-i1-v0.3.0-oa-completion-04.md`  
> 等级：三级零裁量提示

## 1. 唯一入口与剩余原子

本提示替代一级提示 01、二级提示 02，成为唯一执行入口；旧提示、复核 01—04、回执 01—04只作追溯。

唯一剩余原子 **TS-G1c**：回执 04 声称 commit/push/fetch/ls-remote 的 stdout、stderr、exit 已原样保存，但证据目录中没有这些文件。其余内容全部锁定。

| 原子 | 正向目标 | 反向目标 | 对象 | 合法停止 |
|---|---|---|---|---|
| TS-G1c | Workspace 本次文档集合在执行时当前分支提交推送成功；本地提交 SHA=远端分支 SHA；发布集合逐文件远端哈希一致；每个命令的真实 stdout/stderr/exit 分文件存在 | 不用汇总 PASS 替代原始流；不声称 post-push 包已推送；不修改锁定文件；不操作 Server/Web/main/标签/Release | Workspace 当前分支及本次新增文档集合 | 全部门禁为是，或真实远端失败且原始命令/错误/exit 已完整在案 |

## 2. 允许范围

- 允许修改：`memory/{state,features,handoff,README}.md`、`todo/requirement-pool.md` 当前指针；新增本提示对应回执 05与 `evidence/i1-terminal-sync-05/`。
- 允许命令：Workspace 当前分支的只读身份/status、显式文件 `git add`、一次正常 commit、一次正常 push、fetch、ls-remote、show、SHA256、终态 Validator。
- 禁止修改或运行：knowledge、Server、Web、业务代码、工程测试、浏览器、迁移、旧回执、旧证据、main、标签、Release、强推、既有无关残留。

## 3. 固定证据文件

推送前证据目录：`evidence/i1-terminal-sync-05/pre-push/`。推送后本地证据目录：`evidence/i1-terminal-sync-05/post-push/`，后者明确不进入被证明的提交。

`post-push/` 必须存在且只能按实际结果写入以下文件：

1. `identity.stdout.txt`、`identity.stderr.txt`、`identity.exit.txt`；
2. `commit.stdout.txt`、`commit.stderr.txt`、`commit.exit.txt`、`commit-sha.txt`；
3. `push.stdout.txt`、`push.stderr.txt`、`push.exit.txt`；
4. `fetch.stdout.txt`、`fetch.stderr.txt`、`fetch.exit.txt`；
5. `ls-remote.stdout.txt`、`ls-remote.stderr.txt`、`ls-remote.exit.txt`；
6. `remote-file-compare.stdout.txt`、`remote-file-compare.stderr.txt`、`remote-file-compare.exit.txt`；
7. `status.stdout.txt`、`status.stderr.txt`、`status.exit.txt`。

`remote-file-compare.stdout.txt` 每行固定输出：

`path<TAB>expected_sha256<TAB>actual_remote_sha256<TAB>cmp_exit`

末尾固定输出 `total=<N> failed=0`。任一文件缺失、任一 exit 非 0、任一 expected/actual 不同，均不得提交零剩余动作。

## 4. 执行顺序

1. 建立只含 TS-G1c 的账本。
2. 写完回执 05最终正文与终态载荷，生成 `pre-push/publish-set.txt` 和预发布 manifest；终态 evidence 使用实际存在路径并先完成 missing_count=0、Validator exit=0。
3. 对明确发布集合执行显式 add 与 commit；从此次命令开始，把每条命令 stdout、stderr、exit 写入 §3 对应的 post-push 文件，不拼接、不摘要覆盖。
4. push Workspace 执行时当前分支，再 fetch/ls-remote；保存完整原始流。
5. 以远端完整 SHA 对 publish-set 每个路径执行远端对象读取和 SHA256，对照结果逐行写入固定文件。
6. 保存最终 status 原始流；只允许 `post-push/`、上一轮已登记本地审查附件及 Planner 后续裁决成为本轮相关残留。
7. 逐项回读固定文件、exit、远端 SHA、哈希比较和证据路径，全部满足后才提交 Planner。

## 5. 相对二级提示的变化

- 删除 TS-K1a、TS-R1、Validator/manifest 和全部 Server/Web 要求；它们已通过。
- TS-G1b 收敛为 TS-G1c 单原子、单仓库、固定文件名证据包。
- 不再接受 `post-push-local-package.txt` 式汇总；改为每条真实命令三件套及逐文件真实哈希行。
- 完成条件由“文字说明已保存”改为固定文件逐个存在、exit=0、远端 SHA一致、failed=0。

## 6. 全部为是才允许提交

- [ ] §3 的 22 个固定文件全部存在且内容来自本次真实命令；
- [ ] commit/push/fetch/ls-remote/remote-file-compare/status exit 全为0；
- [ ] commit-sha 与 ls-remote 返回的远端完整 SHA相同；
- [ ] remote-file-compare 每个路径 expected=actual、cmp_exit=0，末行 failed=0；
- [ ] 发布集合只含授权文档，无 Server/Web/业务/旧证据修改；
- [ ] 回执 05末行与 input 一致、evidence missing_count=0、Validator exit=0；
- [ ] post-push 明确为本地验收证据，不冒称已推送；
- [ ] `remaining_actionable_count=0`、`next_action_type=WAIT_PLANNER`。

输出固定为 `terminal-sync-stage-i1-v0.3.0-oa-completion-05.md`。合法状态仍为 I1 `COMPLETED（待规划确认）`、P60 `IN_PROGRESS`、`TERMINAL_SYNC_SUBMITTED`；不得自行确认完成或开始 I2。
