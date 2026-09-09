# P60 I1 终态同步执行补充提示 05

> 日期：2026-09-09  
> 功能：P60 `v0.3.0-oa-completion` / I1 组织与权限底座  
> 依据：`planning-review-terminal-sync-stage-i1-v0.3.0-oa-completion-06.md`

## 1. 唯一入口与替代关系

本提示替代提示 04，成为唯一执行入口；提示 01—04、复核 01—06、回执 01—06只作追溯。输入只读取复核 06、提示 04、回执 05/06及 i1-terminal-sync-06/post-push 原始文件。

TS-G1d 已通过。唯一剩余原子为 **TS-G1e（既有远端发布范围身份）**。本轮是只读取证，不产生新的发布闭环。

## 2. 唯一剩余缺口

| 原子 | 失败事实 | 完成条件 | 反向断言 | 对象 | 合法停止 |
|---|---|---|---|---|---|
| TS-G1e | 当前 commit 原始流为 5 files changed，但所谓“实际提交文件列表”有 32 项并混入回执 05历史；push 起点为 304ea09，缺少从锁定 SHA 到最终 SHA 的精确提交链 | 只读列出 `ae95062636ebce8494b30ab9e53365974fc54067..86a5baf6712c05cae922242ba887190b11c52c24` 全部提交、父链和每提交文件；聚合范围与最终远端对象逐项一致；明确 06 的 32 项旧比较不作为“单提交文件列表” | 不 commit/push/add；不修改 05/06；不把宽范围 32 项再次冒充单提交；不操作 Server/Web/main/标签/Release | Workspace 当前分支既有远端提交链 | 只读证据全部一致，或真实远端对象不可读且原始错误/exit 在案 |

## 3. 已锁定项

- I1 业务、知识同步、Server/Web 基线全部锁定。
- 回执 05 的 TS-G1c 原始发布流与远端终点 `ae950626...` 锁定。
- 回执 06 的终端无环、evidence missing=0、Validator exit=0、manifest 7/7、远端终点 `86a5baf...` 锁定。
- 禁止重新生成或修改 `evidence/i1-terminal-sync-05/`、`evidence/i1-terminal-sync-06/`。

## 4. 只读取证方法

新增本地目录 `evidence/i1-terminal-sync-07/readback/`，保存以下命令的真实 stdout、stderr、exit；回执正文只作索引，不复制大段原始流：

1. Workspace 身份、当前分支、HEAD、上游与 status；
2. `ae950626...` 是否为 `86a5baf...` 祖先；
3. 上述闭区间后的提交序列（完整 SHA、父 SHA、subject），不得省略中间提交；
4. 每个提交分别输出完整 SHA及其实际文件状态/路径；同时输出去重聚合文件集合和计数；
5. `ls-remote` 回读当前分支，必须等于 `86a5baf...`；
6. 对聚合文件集合，从最终远端 SHA逐项读取对象，输出 `path<TAB>expected_sha256<TAB>actual_remote_sha256<TAB>cmp_exit`，末行 `total=<N> failed=0`；删除项如实以状态单列，不伪造文件哈希；
7. 明确核对：逐提交文件集合的聚合值 = 远端比较集合；06 的 32 项比较只证明较宽历史范围，**不再作为单提交或本轮精确范围证据**。

本轮禁止 `git add`、commit、push、强推或修改既有文件。新增复核 06、提示 05、回执 07及 readback 包均明确为 Planner 验收本地附件，等待裁决，不冒称已推送。

## 5. 相对提示 04 的变化

- 删除：不再生成 manifest、publish-set或新的发布原始流；TS-G1d 全部锁定。
- 原子化：只剩“5 文件提交、304ea09 中间点、32 项宽范围比较”三者的身份对账。
- 替代路径：不再通过新增提交修复旧提交证据；改为从锁定起点到远端终点的只读提交链和逐提交文件事实取证。
- 可判定条件：祖先关系为真；提交无遗漏；逐提交聚合集合与远端比较集合完全相同；最终远端 SHA固定；所有只读命令 exit=0、逐文件 failed=0。

## 6. 回执与合法终态

提交 `terminal-sync-stage-i1-v0.3.0-oa-completion-07.md`，正文必须明确：

- 实际提交数量、每个完整 SHA及文件数；
- 304ea09 的完整身份及其与 86a5baf 的父链关系；
- 聚合文件数、远端比较总数和 failed 数；
- 06 的 32 项证据为何被剔除为精确范围证据；
- 本轮零 commit、零 push，新增材料仅为本地验收附件。

回执仍使用合法 `TERMINAL_SYNC_SUBMITTED` 载荷，`remaining_actionable_count=0`、`next_action_type=WAIT_PLANNER`；终态 evidence 只引用稳定存在的复核 06、提示 05、回执 07，不自引用校验输出。不得自行确认 I1 完成或开始 I2。
