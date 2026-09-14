# P60 I5 终态发布收尾提示 01

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-14  
> 权威审查：`planning-review-terminal-sync-stage-i5-v0.0.3-oa-iteration-01.md`  
> 下一回执：`terminal-sync-stage-i5-v0.0.3-oa-iteration-02.md`

## 1. 唯一缺口与替代关系

本提示是I5终态同步的唯一当前入口。I5业务验收、终态值同步、本地提交、候选、测试、manifest和Validator全部锁定；旧的I5实现/补证提示不再构成待办。

| 原子ID | 失败事实 | 完成条件 | 必要反向断言 | 固定对象 | 最小充分证据 | 合法停止条件 |
|---|---|---|---|---|---|---|
| TS5-PUBLISH | 三仓I5提交尚未推送；Workspace本地/远端各领先1条历史链 | 普通merge保留远端P53登记与本地I5内容；三仓精确分支非强制推送成功；远端SHA回读包含所有授权提交 | 不rebase/强推/改写历史；不删除P53或I5内容；不夹带嵌套仓和无关残留；不创建标签/Release | Workspace `origin/develop-sw`；Server/Web `origin/develop`；审查01列明的本地提交链 | merge前后图、合并文件回读、push原始结果、`ls-remote`、逐仓`merge-base --is-ancestor`、ahead/behind=0/0、提交文件清单 | 远端再次变化、出现不能机械双保留的文本/语义冲突、权限或网络真实失败 |

## 2. 固定执行顺序

1. 只读回读三仓当前分支、HEAD、upstream、工作树和远端SHA；确认Server/Web提交链仍与审查01一致。
2. Workspace执行普通fetch后，以merge方式整合`origin/develop-sw`；禁止rebase。对`todo/requirement-pool.md`同时保留远端P53 Figma登记和本地I5终态条目，并回读两组内容均存在。
3. 先完成Workspace合并后候选/当前入口/嵌套仓排除检查；将本提示、审查01及必要回执证据纳入task-owned治理提交。
4. 分别非强制推送Server `develop`、Web `develop`、Workspace `develop-sw`到各自`origin`。
5. 用`git ls-remote`回读三条远端分支；逐一证明远端HEAD包含审查01固定的Server 6提交、Web 2提交、Workspace I5同步链、远端P53提交和本轮收尾提交。
6. 回读三仓ahead/behind、工作树残留归属、memory限额、当前唯一入口和terminal Validator，提交iteration-02。

## 3. 锁定项与禁止事项

不得修改业务代码、测试、迁移、SSO文档内容或既有回执证据；不得重跑测试或Provider调用；不得重新计算I5状态、计数和P编号；不得开始I6。允许修改仅限机械merge产生的`todo/requirement-pool.md`双保留结果、当前发布状态指针、本轮审查/提示/回执与直接证据。

## 4. 相对上一入口的变化

- **删除**：删除终态值同步、本地提交和候选核对，均已通过。
- **原子化**：只保留TS5-PUBLISH一项。
- **替代路径**：Owner明确选择普通merge保留新增P53登记，不使用rebase或覆盖远端。
- **提交条件**：三仓远端包含关系、Workspace双保留、ahead/behind及非强制推送全部可回读后才提交iteration-02。

## 5. 合法终态

完成后仍提交I5 `COMPLETED（待规划确认，2026-09-14）`、P60 `IN_PROGRESS`、机器`TERMINAL_SYNC_SUBMITTED`、remaining=0、next=`WAIT_PLANNER`。Planner最终复核前不得写“规划已确认”、归档终态同步方向或开始I6。
