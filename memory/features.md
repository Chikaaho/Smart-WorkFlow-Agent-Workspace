# 功能摘要

## 当前任务：0.1.7-bugfix 第41项线上返修

2026-10-18规划复核02：第41项VERIFYING，列车IN_PROGRESS。G1唯一超管保护通过（角色保留编码更新限制＋非0租户约束，14/0+14/0）；G3正式覆盖发布通过。正式＝实际后端0.1.7（c6a7c06，CI39115050365成功），前端0.1.7（4e89249）、DB0.1.7。G2普通租户14用户/7部门截图通过；admin半边待Owner人工验证码登录后补验29用户/15部门，不重跑已过项。

收尾部分完成：version.json=0.1.7；knowledge当前状态252299→4348B并完整归档；远程分支Server8/Web10已清理，super-tenant等第41项通过再删。P62：9项实验/迁移/装置延期，6项历史文档不合入（规划裁决）；08ed4c4回调缺口核实为真实生产/CI路径缺陷（UAT与制品CI实证），重落地待规划裁决，分支保留。收尾四项部分完成。

下一动作：P62核实已回传（search_fallback/p62-openapi-callback-product-gap.md）待规划裁决；Owner登录后补admin用户/部门页29/15。裁决product/0.1.7-bugfix/receipts/planning-review-reopen-041-02.md；证据reopen-041-04、close-maintenance-017-01及search_fallback/close-maintenance-017-facts.md。

返修7阶段：完成3（范围确认、必要合并、正式修复发布）；进行中3（修复复测、验收信息同步、发布后同步与收尾）；未开始1（结束）。功能49、46/22/22=90、ADV64/问题57、P核销空、P62性能延期/OFF、P65待排期保持。Bug清单仅本地留存，历史清理不重做。

## 上轮发布归档摘要：0.1.6-release

2026-10-16规划确认COMPLETED，5阶段5/0/0。终审：`product/0.1.6-release/receipts/planning-final-review-terminal-sync-01-completed.md`。正式/部署0.1.6，Web e5aa357、Server e115857，验证R016-VB01—04，五方向passed。历史计数49、46/22/22=90、ADV64/57；P62延期/OFF。普通用户隔离通过，UAT管理员范围保留。该轮已结束。


## 历史状态索引

正式功能49；清单46/22/22=90、ADV64/问题57；P62批准功能完成、有限性能延期、策略OFF。应用中心与表单分类统一已完成并随0.1.6发布；P64/P63及0.1.5修复列车已完成。历史验证与裁决见对应 `product/` 回执；持久权威为 `knowledge/current-status.md`，规划通过执行回传核实。0.1.7修复证据见bugfix-round-01及增补27；发布候选验证与提交绑定已由release-017-01/02确认，范围见规划复核02。

