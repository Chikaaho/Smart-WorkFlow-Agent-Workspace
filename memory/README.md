# memory使用说明

2026-10-13；[终态最终复核02](../product/p64-mes-advanced-orchestration/receipts/planning-final-review-terminal-sync-p64-02-completed.md)确认P64 **COMPLETED（规划已确认）**、批准范围核销。Ⅰ数据到动作、Ⅱ人员与父子协作、Ⅲ场景与整体交付均完成；总3业务阶段完成3/进行中0/未开始0。业务与终态验收剩余0；主方向与终态方向均归档passed。P62批准功能COMPLETED、有限性能VERIFYING/Owner延期、策略OFF保持。

当前任务bugfix-20261013整体IN_PROGRESS（2026-10-15）。Owner宣布修复结束，台账BF20261013-001—053共53项均已通过，阶段Ⅲ按Owner范围关闭。总5阶段：范围约定、建分支、持续修复完成；版本收敛与合并完成；UAT发布收尾进行中（4/1/0）。唯一下一动作：Executor执行阶段Ⅴ（UAT发布与收尾，入口product/bugfix-20261013/ready/direction-release-015.md）。Owner本轮发布补充2项待执行：R015-01登录页备案号“粤ICP备2026093622号-1”链接https://beian.miit.gov.cn/；R015-02前端改为目标域名根路径并替换原站点入口，保留可恢复备份。版本0.1.5，全部版本化主迁移收敛为每方言一个0.1.5种子；开发新增使用时间戳需求名。应用中心为下轮候选；存量衔接已在受控本机库sw_apaas_bugfix验证（历史表先备份→transition脚本DELETE 11/INSERT 1→Flyway validate通过、migrate零重复执行、业务数据未动）；UAT实际部署与发布结果待验证，现有授权不包含删库。Git（2026-10-15实测，普通推送后git ls-remote回读）：两仓codex/bugfix-20261013=develop=main——Web 02807fc、Server 8c25932（Server发布收敛两笔：9c701b0迁移收敛、8c25932漂移修复+版本身份）；未强推/未改历史/未建tag或Release。阶段Ⅳ回执product/bugfix-20261013/receipts/release-015-01.md（含完整差异、种子等价性sha256、升级通道验证、门禁290/3/0与候选制品bootstrap.jar sha256）。

当前已完成登记48（=47+P64整体1，同一登记ID复用不重复计数）；清单46/22/22=90、ADV64、问题57保持。正式P64验证集合及各项实际结果以终态方向为准，P63历史基线保持。

读取顺序state→handoff→features→constraints；memory为规划摘要，knowledge/current-status为持久权威。
