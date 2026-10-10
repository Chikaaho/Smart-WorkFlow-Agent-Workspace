# P64阶段Ⅰ规划验收08：PASSED

2026-10-10；Planner。依据[回执08](phase-1-completion-receipt-08.md)、[提示06](planning-execution-prompt-p64-phase1-06.md)、[复审07](planning-review-phase-1-07.md)及主方向阶段Ⅰ合同，独立核查两包、关键方法断言原文、共享XML、Git固定截止及哈希。未读取coding/knowledge，未运行工程、数据库或Git。

**阶段Ⅰ“数据到动作”PASSED；P64整体保持IN_PROGRESS。** 两个最后原证项关闭；阶段Ⅱ/Ⅲ尚未验收，主方向继续留ready。唯一业务下一动作=Executor按[阶段Ⅱ方向](../ready/direction-p64-phase2-personnel-parent-child.md)在原完整授权内继续人员与父子协作，同时knowledge-first同步本次阶段口径。提示06及更早不再是当前待办。

## 两项最终核销

- **P1-05a关闭**：五新增case完整安排/断言原提取现已可读，未知来源及NODE_FORM缺键可诊断且零读取，MAIN_FORM恰一次按调用租户9/实例main_form_bound与rec-bound-42读取，NODE_FORM限定pi-1/node_qc/round2并拒他实例/他租户读取，SYSTEM白名单外null+missingRequired及双读取器零交互；旧名单case实际doesNotContainKey断言齐全。逐case与已保存XML12/0相符，文件最后提交effca338abb0fc8c91417697ab48be6eafa7f6d4未变。提取头是较早d47b4e1，索引写后继ef72c8b；后继只更新焦点文档，已核代码关联不因此失效。UNIT层证据如实，不冒充新真实HTTP验证；347门禁继续锁定，不重跑。
- **P1-08a-C关闭**：原Git记录证实Server ef72c8be5542bc6b7d560bc95436acdb58a00ac0、Web21074afd94b07dfe09d1b2312869b2d5af4803d9各与远端一致、两工作树CLEAN；根截止8da874bd含并行治理提交，提交后08:07:20原回读d57d2633ba1f2267ec9b76576bb057436b9434cc与origin同值。真实gitlink mode160000，Server78495dccf9a19c973eaeb2c29b84ff58b8faec69保留。接受固定截止，不外推实时HEAD或回填本审查自SHA。

## 哈希差异的独立复算

四个清单条目中三个当前SHA256匹配，Git txt在生成清单后追加§[5]而改变整体哈希。Planner按原文件字节独立计算：**前4686字节SHA256=76e171a22be3c53e1d82e7d7b5e2fd4fe92cd3e8ef227a88d96a93c7db4a3b5d，恰等原清单**；差异仅为尾部追加回读段。当前整文件SHA256=6149a6ece5bcb7f66e88e292d9a916831ddabead22f9325ab40ad6def1560d91。原清单/附件保留，不称“四条当前哈希全部通过”，不因可解释的追加封装差异再开业务补证。

## 阶段合同验收

| 合同 | 已独立通过的对应行为 |
|---|---|
| A01节点业务表单 | 绑定发布版本、首草稿前后重发不漂移，任务/轮次数据隔离、真实合法提交/回看、失败零半提交及权限边界；04b/04a与原03c/768写链锁定。 |
| A02类型变量 | 三来源真实快照、有效轮次/类型/集合与ROWS追踪/缺值及来源权限；05a关键断言本轮闭合，原三来源/新轮隔离锁定。 |
| A03只读判断 | 三入口共享受控worker池，134217728堆上限、500ms超时、OOM/拒绝/排队/释放/恢复/shutdown逐case，精确匹配/事件/异常无成功动作；02a/02b/05a锁定。 |
| A04可靠动作 | SINGLE/EACH/GROUPED实际目标与映射、幂等/并发冲突/空超限、原X5二段失败受控恢复且旧行保留、成功目标不重复；06a/06b及恢复组件回归锁定。 |
| 本阶段A11 | 用户可见正式配置、768填值/保存/提交/动作回查、身份/请求索引已过；新增恢复行为按允许的安全组件替代+真实X5链组合，不冒充全新正式浏览器验收。 |
| 本阶段A12 | 正确0.1.6非空在役升级、已启用v6在役与关闭v7新实例边界、回退前收敛、并发竞态修复/单激活及零在途清理、受影响门禁与覆盖/Git原证已过。 |

验收指针沿复审07/06及其锁定原件，只核新剩余项。engine100/0沿用，process347/0/0/0、Web153文件通过+1跳过/1376测试通过+3跳过及四门exit0（lint0e3w）为阶段验证快照，不晋级整体正式基线。原05a/08a-C最后缺口账本清零，原失败/历史查询/观察边界保留。

## 状态与收尾授权

P64=IN_PROGRESS；阶段ⅠPASSED（2026-10-10），阶段ⅡREADY、阶段Ⅲ未验收。47、46/22/22=90、ADV64、问题57、其他P/明细、P63COMPLETED/VB、P62性能延期/新策略OFF、gitlink78495dc不变。不核销P64或转整体COMPLETED，不移主方向到passed、不合并/tag/部署。

Executor按既有明确同步授权，先更新knowledge/current-status/session-handoff/P64登记/实际受影响architecture及reconciliation/Server清单，再核全部当前摘要、todo/product路由，提供逐字段实际值/时点覆盖；本轮Planner已同步可写当前入口。状态同步伴随已授权阶段Ⅱ，不另开传播循环，不重复索要阶段实施授权，精确文档Git普通收尾持续授权。

Owner最新“codex的hook先挂起”另记[治理复核02](../../workspace-governance-consistency-audit/receipts/planning-review-zcode-codex-hook-followup-02-20261010.md)，独立于本阶段验收。

## Planner当前入口复核

本轮已更新memory五入口、todo/P64及需求池P64行、三份ready当前路由与两份Hook待办；阶段ⅠPASSED/阶段ⅡREADY/整体IN_PROGRESS和HK-C挂起一致。工具回读10份方向/审查/待办的84条本地Markdown链接，断链0；memory八文件总18732字节，各文件小于5000字节、总量小于20000字节。knowledge与本轮Git未由Planner读取或操作，其实际同步和精确提交仍由已授权Executor收尾，不把摘要更新当作完整持久状态同步完成。
