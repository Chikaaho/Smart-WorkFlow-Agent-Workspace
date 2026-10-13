# memory使用说明

2026-10-13；[终态最终复核02](../product/p64-mes-advanced-orchestration/receipts/planning-final-review-terminal-sync-p64-02-completed.md)确认P64 **COMPLETED（规划已确认）**、批准范围核销。Ⅰ数据到动作、Ⅱ人员与父子协作、Ⅲ场景与整体交付均完成；总3业务阶段完成3/进行中0/未开始0。业务与终态验收剩余0；主方向与终态方向均归档passed。P62批准功能COMPLETED、有限性能VERIFYING/Owner延期、策略OFF保持。

当前任务bugfix-20261013整体IN_PROGRESS。应用及发布版本0.1.5，develop全部版本化主迁移在进入main前收敛为每方言一个0.1.5种子，开发新增V<yyyymmddhhmmss>__<功能需求>.sql。两仓codex/bugfix-20261013已建立推送，Server b962648/Web 8c400b0，建分支项Planner已通过。总5阶段：范围与发布约定、建分支完成；修复验收、版本收敛合并、UAT收尾未开始（2/0/3）。执行收尾唯一入口：product/bugfix-20261013/receipts/planning-review-branch-init-01.md，核实根批次Git结果并机械传播裁决；Owner可持续发送问题，台账0项。UAT兼容待发布前验证。

当前已完成登记48（=47+P64整体1，同一登记ID复用不重复计数）；清单46/22/22=90、ADV64、问题57保持。正式P64验证集合及各项实际结果以终态方向为准，P63历史基线保持。

读取顺序state→handoff→features→constraints；memory为规划摘要，knowledge/current-status为持久权威。
