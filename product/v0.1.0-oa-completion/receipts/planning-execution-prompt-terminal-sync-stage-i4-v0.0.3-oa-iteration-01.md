# I4 终态三层一致性收敛提示 01

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-13  
> 前置复核：`planning-review-terminal-sync-stage-i4-v0.0.3-oa-iteration-02.md`  
> 唯一未通过范围：TS4-R1a / TS4-R1b / TS4-R1c

## 1. 固定边界

只允许完成以下三项：补齐正式功能第15项登记；统一全部当前入口；修正并重跑当前入口残留验证器。90键矩阵、ADV64、计数、I4业务验收、三仓候选、既有远端提交和terminal已锁定，不重验、不重算、不改业务实现。I5继续未激活。

唯一目标状态继续为：P60=`IN_PROGRESS`；I1— I3=`COMPLETED（规划已确认）`；I4=`COMPLETED（待规划确认，2026-09-13）`；I5—I6未开始；正式功能数44；清单✅46/🟦22/⬜22；ADV64独立；开放P编号不核销。

## 2. TS4-R1a 完成条件

依据现有 `product/agent-model-orchestration/passed/`、主索引历史记录和已确认功能链，补齐 `knowledge/features/agent-model-orchestration.md`。登记必须只复述可追溯历史事实，包含功能身份、历史完成状态/时点、passed证据、P/M/I映射和“不新增当前功能数”的说明。

重新生成 `feature-44.tsv`，逐行检查registration路径实际存在；输出registration_missing=0、duplicate=0、feature_count=44。不得借补登记重写历史结论或变更任何功能状态。

## 3. TS4-R1b 完成条件

全量枚举并修正所有当前状态段、当前状态表格、当前待办段、当前焦点和唯一入口，至少覆盖：

- `knowledge/current-status.md` 的抬头、快照表、最近审查、正式功能状态段、唯一下一动作和新会话提示；
- `knowledge/session-handoff.md`、`knowledge/features/v0.1.0-oa-completion.md`；
- `memory/README.md`、`state.md`、`features.md`、`handoff.md`；
- `todo/v0.1.0-oa-plan.md`、`todo/requirement-pool.md` 的抬头及所有P60当前条目；
- 工程《功能清单》当前焦点和P60主方向当前段。

当前唯一入口统一为本提示，当前唯一动作统一为关闭TS4-R1a/b/c并提交回执03。历史事件行可保留真实旧路径，但必须被明确标识为历史，不得与当前陈述混排。

## 4. TS4-R1c 完成条件

修正残留扫描器，使扫描对象覆盖所有上述当前段落和表格行，并分别输出：stale_entry=0、multiple_current_entry=0、registration_missing=0、current_state_conflict=0、broken_current_path=0。

验证器必须对预置的旧 terminal-sync 指针、旧等待动作和缺失登记路径夹具分别产生非零失败，再对修正后的真实入口产生0；保存负向夹具、原始输出和exit，防止以过滤规则制造“0命中”。`post-fix-scan.txt`、`current-entry-residue-scan.txt`和机器汇总必须互相一致。

## 5. 发布与回执

只提交上述状态/登记/验证证据的task-owned变化。Workspace需要提交、推送当前分支并回读远端SHA；Server/Web无本轮变化时不得创建空提交。回执与证据使用相对路径manifest，manifest回读bad/missing=0；terminal路径全存在，末行与input逐字节一致，Validator exit0。

回执写入：

`product/v0.1.0-oa-completion/receipts/terminal-sync-stage-i4-v0.0.3-oa-iteration-03.md`

合法终态仍为I4 `COMPLETED（待规划确认）`、P60 `IN_PROGRESS`、`TERMINAL_SYNC_SUBMITTED`、remaining=0、next=`WAIT_PLANNER`。Planner复核前不得写I4“规划已确认”或启动I5。
