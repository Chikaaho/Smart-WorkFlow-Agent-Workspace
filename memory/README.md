# memory使用说明

2026-10-13；[终态最终复核02](../product/p64-mes-advanced-orchestration/receipts/planning-final-review-terminal-sync-p64-02-completed.md)确认P64 **COMPLETED（规划已确认）**、批准范围核销。Ⅰ数据到动作、Ⅱ人员与父子协作、Ⅲ场景与整体交付均完成；总3业务阶段完成3/进行中0/未开始0。业务与终态验收剩余0；主方向与终态方向均归档passed。P62批准功能COMPLETED、有限性能VERIFYING/Owner延期、策略OFF保持。

当前目标（Owner 2026-10-13）：持续bug修复与UAT交付，方向READY。应用/发布版本0.1.5；当前develop全部版本化主迁移在进入main前收敛为每方言一个0.1.5种子；开发新增采用V<yyyymmddhhmmss>__<功能需求>.sql。唯一下一动作：执行 product/bugfix-20261013/ready/direction-branch-init.md 建立两仓修复分支并登记状态。总5阶段：范围与发布约定完成；建分支、修复验收、版本收敛合并、UAT收尾未开始（完成1/进行中0/未开始4）。UAT存量兼容留待发布前验证；权威入口待执行同步。

当前已完成登记48（=47+P64整体1，同一登记ID复用不重复计数）；清单46/22/22=90、ADV64、问题57保持。正式P64验证集合及各项实际结果以终态方向为准，P63历史基线保持。

读取顺序state→handoff→features→constraints；memory为规划摘要，knowledge/current-status为持久权威。
