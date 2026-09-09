# P60 I1 终态同步执行补充提示 04

> 日期：2026-09-09  
> 功能：P60 `v0.3.0-oa-completion` / I1 组织与权限底座  
> 依据：`planning-review-terminal-sync-stage-i1-v0.3.0-oa-completion-05.md`

## 1. 唯一入口与替代关系

本提示替代提示 03，成为唯一执行入口；提示 01—03、复核 01—05、回执 01—05只作追溯。输入只读取最新复核 05、提示 03、回执 05及 `evidence/i1-terminal-sync-05/`。

TS-G1c 拆分为已经锁定的发布原始流与唯一剩余原子 **TS-G1d（冻结证据自洽）**。本提示不改变主方向、角色权限或终态值。

## 2. 唯一剩余缺口矩阵

| 原子 | 失败事实 | 完成条件 | 反向断言 | 对象 | 合法停止 |
|---|---|---|---|---|---|
| TS-G1d | 05 的 manifest 独立复算时 `publish-set.txt` FAILED；终端往返文件记录 missing=2，却声明 missing=0 | 新建非自引用的 06 证据包；manifest 实际回读 exit=0；终端 evidence 当前检查 missing=0；回执、原始文件和终态载荷完全一致；修正文档提交推送 Workspace 执行时当前分支并按实际提交文件逐项远端回读 | 不修改 05；不以文字 PASS、手抄哈希或自引用清单替代；不重验 TS-G1c/I1 业务；不操作 Server/Web/main/标签/Release | Workspace 本次修正文档提交及 `evidence/i1-terminal-sync-06/` | 全部门禁为是，或真实远端失败且原始流/exit 在案 |

## 3. 锁定项与禁止重验

- I1 业务验收、Server/Web 基线、知识同步、Validator 既有通过项全部锁定。
- TS-G1c 的 22 个原始文件、commit/push/fetch/ls-remote 成功、SHA 相等、16/16 远端对象一致全部锁定。
- 禁止修改 `evidence/i1-terminal-sync-05/` 和回执 05；禁止业务代码、工程测试、浏览器、迁移、knowledge、Server、Web。

## 4. 改变方法：无环冻结

新证据目录固定为：

- `evidence/i1-terminal-sync-06/pre-push/`
- `evidence/i1-terminal-sync-06/post-push/`（本地验收证据，不进入被证明的提交）

执行顺序固定如下：

1. 先完成回执 06正文与末行终态载荷；终态 `evidence` 只引用在校验前已经稳定存在的方向/复核/回执/静态附件，**不得引用由本次终端校验或存在性检查生成的输出文件本身**。
2. 从回执末行生成 `terminal-input.txt`，做字节往返比较、JSON 解析、evidence 路径存在性检查和 Validator；分别保存真实输出与 exit。存在性文件必须明确列出每个路径并以 `missing_count=0` 收尾。
3. `publish-set.txt` 只列本次准备提交的路径，不在自身写入自身哈希；定稿后不得再改。
4. 最后生成 `MANIFEST-SHA256.txt`，排除其自身和随后生成的 `manifest-verify.txt`；立刻实际运行 `shasum -a 256 -c`，把完整 OK 输出与 exit 分别保存。manifest 生成后，其中列入的文件不得再改。
5. 对明确集合执行正常 commit/push 当前分支，保存 commit/push/fetch/ls-remote 的 stdout、stderr、exit；禁止强推。
6. 远端比较集合不得再由自引用 publish-set 哈希推导；改为从**本次实际 commit 的文件列表**生成，每个提交文件输出 `path<TAB>expected_sha256<TAB>actual_remote_sha256<TAB>cmp_exit`，末行 `total=<N> failed=0`。commit SHA 必须等于远端分支 SHA。
7. 保存最终 status 原始流；只允许既有登记的本地审查附件、06/post-push 及 Planner 后续裁决成为相关残留。

## 5. 相对提示 03 的变化

- 删除：不再要求复做已经通过的 05 原始发布流和 16 个对象比较。
- 原子化：TS-G1c 拆成已锁定发布结论与 TS-G1d 单一冻结一致性问题。
- 替代路径：从自引用的“清单包含自己的校验结果”改成先稳定输入、校验输出不反向进入终态 evidence、manifest 排除自身及其验证输出；远端集合直接取实际 commit 文件列表。
- 可判定提交条件：manifest 回读 exit=0 且全为 OK；终端 evidence missing_count=0；终态往返/JSON/Validator exit=0；实际 commit 文件逐项远端一致且 failed=0。

## 6. 提交自检与合法终态

- [ ] 回执 06末行与 terminal input 字节一致，JSON 与 Validator exit=0；
- [ ] 终态 evidence 不自引用校验输出，逐路径当前存在，`missing_count=0`；
- [ ] manifest 排除自身和 manifest-verify，实际回读全部 OK、exit=0；
- [ ] publish-set 定稿后未改，实际 commit 文件列表覆盖全部本次提交文件；
- [ ] commit/push/fetch/ls-remote exit=0，commit SHA=远端 SHA；
- [ ] 实际提交的每个文件 expected=actual、cmp_exit=0、末行 failed=0；
- [ ] 无 05/knowledge/Server/Web/业务/测试/迁移/main/标签/Release 修改；
- [ ] `remaining_actionable_count=0`、`next_action_type=WAIT_PLANNER`。

输出固定为 `terminal-sync-stage-i1-v0.3.0-oa-completion-06.md`。合法状态仍为 I1 `COMPLETED（待规划确认）`、P60 `IN_PROGRESS`、`TERMINAL_SYNC_SUBMITTED`；不得自行确认完成或开始 I2。
