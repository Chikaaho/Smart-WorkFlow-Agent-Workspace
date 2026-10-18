# 当前状态摘要

## 当前任务：0.1.7-bugfix 第41项线上返修

2026-10-18｜返修复核补充（G1—G3）：VERIFYING，列车IN_PROGRESS。G1唯一超管边界已核实并修复（c6a7c06）：真实缺口＝角色更新可把已绑定普通角色改名为code=superadmin（角色编码查重为租户内），现update同等拒绝保留编码、身份装载叠加超级租户0约束；测试14/0+14/0；线上superadmin角色与绑定均唯一（admin@0，tenant 0仅1用户）。

G2改用已登录授权会话：demo_a_hq_1在终态构建复验用户14条/部门树仅本租户，视觉制品已取得（evidence/reopen-041/两件）；admin半边待Owner在已停留的chikaho.cn/login完成验证码登录后补验29/15；服务端摘要穷举方法已停用不留存。G3同版本覆盖已执行：原资产309e9e1e仓库外备份＋运行包a4f641d4记录、tag 0.1.7 lease重指c6a7c06（065e1b7）、Release资产换CI制品b016b5cc（说明保留原历史事实）、CI run 39115050365 success（自动发布build-c6a7c06）、UAT部署同一制品（build.version=0.1.7、UP、ERROR 0、179.196s）。e2fe50f的run 39111840667 failure＝P62UpgradeGatePgTest领取竞态（同提交本地绿，todo/p62-upgrade-gate-test-claim-race.md）。

版本身份：正式＝实际后端0.1.7（c6a7c06·b016b5cc）、前端0.1.7（4e89249）、DB0.1.7（无新迁移）。回执receipts/reopen-041-04.md。

唯一下一动作：Owner完成admin验证码登录→执行方补验admin用户/部门页→规划复核reopen-041-04。七阶段3/3/1保持（修复复测余admin半边待Owner）。

收尾四项已完成（receipts/close-maintenance-017-01.md）：version.json→0.1.7、current-status轮转252KB→4.3KB（快照归档history/）、分支清理Server8+Web10（tip记录在回执，super-tenant与P62分支保留）、P62分支16提交分类事实已回传待规划裁决。

功能49、46/22/22=90、ADV64/问题57、P核销空、P62延期/OFF保持；P65待排期。其它已过项锁定；清单仅本地留存，历史清理不重做。

## 上轮发布归档摘要：0.1.6-release

2026-10-16规划确认COMPLETED，5阶段5/0/0。终审：`product/0.1.6-release/receipts/planning-final-review-terminal-sync-01-completed.md`。正式/部署0.1.6，Web e5aa357、Server e115857，验证R016-VB01—04，五方向passed。历史计数49、46/22/22=90、ADV64/57；P62延期/OFF。普通用户隔离通过，UAT管理员范围保留。后续Server文档CI的2项既有预约时序失败已另列待办。该轮无剩余发布动作。


## 历史状态索引

正式功能49；清单46/22/22=90、ADV64/问题57；P62批准功能完成、有限性能延期、策略OFF。应用中心与表单分类统一已完成并随0.1.6发布；P64/P63及0.1.5修复列车已完成。历史验证与裁决见对应 `product/` 回执；持久权威为 `knowledge/current-status.md`，规划通过执行回传核实。0.1.7修复证据见bugfix-round-01及增补27；发布候选验证与提交绑定已由release-017-01/02确认，范围见规划复核02。

