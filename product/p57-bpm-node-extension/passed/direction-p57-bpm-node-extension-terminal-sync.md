# P57 BPM Engine 统一流程节点扩展能力阶段三终态同步方向

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 任务等级：XL阶段三机械同步  
> 日期：2026-09-03  
> 前置结论：功能级`PASSED`  
> 合法执行终态：`TERMINAL_SYNC_SUBMITTED`
> 规划终态复核：`PASSED`；P57 `COMPLETED（已确认，2026-09-03）`

## 1. 任务目标

只将P57已经锁定的功能级验收结果机械同步到当前状态单一源、功能清单、需求池、压缩记忆与交接入口；不得修改业务代码、重新运行已锁定测试、扩大P58或重新解释终态值。

## 2. 唯一终态值清单

| 字段 | 唯一值 |
|---|---|
| 功能状态 | `COMPLETED（待规划终态复核确认）`；执行回执提交`TERMINAL_SYNC_SUBMITTED`，Planner复核后才改为`COMPLETED（已确认，2026-09-03）` |
| 已完成功能数 | **40**（39 + P57一项） |
| 功能清单计数 | **✅34 / 🟦23 / ⬜33**，总数90不变 |
| P编号状态 | **P57已完成、已核销**；其他P编号保持当前值 |
| 里程碑/明细ID状态 | **无对应既有明细ID变化**；90项清单状态行全部保持原值 |
| 验证基线集合 | Server根**147份Surefire XML、1015/0/0/0**；P57聚焦**21/0/0/0**；Web **116 files passed + 1 skipped / 1104 tests passed + 3 skipped**，typecheck/lint/build退出0；Flyway **H2 V47（47）/PG V47（46）**，无新增迁移 |
| 活动功能 | **无** |
| 当前唯一下一动作 | **Planner进入P58范围澄清：确定首批具体节点及各节点业务语义；Owner确认前不下发P58正式实现方向** |
| 主方向目录 | `product/p57-bpm-node-extension/passed/direction-p57-bpm-node-extension.md` |
| 阶段三方向目录 | 同步执行期间为`product/p57-bpm-node-extension/ready/direction-p57-bpm-node-extension-terminal-sync.md`；Planner复核通过后移至`passed/` |

内部勾稽：40=39+1；34+23+33=90；P57为新增补充需求，不对应90项既有明细，因此清单状态不变；验证基线只采用规划验收05锁定的最终文件状态输出。

## 3. 必须同步的当前入口

1. `knowledge/current-status.md`：先落P57终态快照，旧快照迁入`knowledge/history/`并更新索引。
2. `knowledge/session-handoff.md`、P57功能跟踪、已知问题当前入口：同步40、P57核销、无活动功能、唯一下一动作和本轮边界。
3. `Smart-WorkFlow-Server/功能清单.md`：90项状态行零变化，只在终态/当前焦点位置记录P57不对应既有明细及新基线。
4. `todo/requirement-pool.md`：P57改为完成核销；P58仍为待范围澄清，不得写为READY或IN_PROGRESS。
5. `memory/README.md`、`state.md`、`features.md`、`handoff.md`、`issues.md`：压缩为P57终态与P58范围澄清下一动作。
6. `product/p57-bpm-node-extension/receipts/`：追加阶段三同步回执；不得覆盖任何失败审查、提示、历史回执或附件。

## 4. 必须保留的边界

- P57只完成统一节点扩展能力；P58具体会签、通知、条件分支和界面优化未启动。
- 不把tenant 0双普通用户证据写成“非零租户登录已支持”；非零租户认证不属于P57完成声明。
- 不把隔离验证节点、非法translator、证据控制器或验证profile写入生产能力；最终生产能力目录只有START、APPROVAL、END。
- 不新增Flyway版本，不改变P2、P21、P54、P55、P58或其他P编号状态。
- 不重新运行测试、不修改代码、不提交或推送Git。

## 5. 回执与全文复核要求

阶段三回执必须逐项给出“清单授权值→实际写入文件→文件实际值”，并包含：

- knowledge-first顺序及旧快照归档路径；
- 40、34/23/33、P57核销、无明细变化、无活动功能和唯一下一动作的所有当前入口全文核对；
- 授权验证基线集合与实际写入集合完全一致；
- P58未误启、非零租户登录未误宣称、生产验证fixture未误写为正式能力的零残留检查；
- 主方向已在passed、阶段三方向仍在ready等待Planner复核；
- `memory/`每个短文件小于5KB、总量小于20KB，并记录各文件同步前后字节数、保留摘要和移除范围；
- 公共Validator真实命令、原始诊断和退出码。

执行层提交后保持`COMPLETED（待规划终态复核确认） / TERMINAL_SYNC_SUBMITTED`。不得自行移动阶段三方向到`passed/`或声称Planner已确认。
