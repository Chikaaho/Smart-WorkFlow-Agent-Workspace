# 功能摘要

## 当前任务：0.1.7-bugfix 第41项线上返修

2026-10-18｜**核实结果（本轮）**：线上组织种子实际已入库（9001/9002 各 7 节点/14 用户，R__ 0.1.7 org demo seed 与库内数据逐一对应）；Owner 现象＝**租户隔离可见性**（admin 属 tenant 0，用户列表仅 1 行）；admin 口令线上此前未更新（admin/admin123 可登录），已一次性单行更新为 Owner 指定值并通过正反向验证（新口令登录成功、旧口令 code 2104 密码错误）。

方向：product/0.1.7-bugfix/ready/direction-reopen-041-production-seed.md；裁决：receipts/planning-reopen-041.md；探索回传：search_fallback/reopen-041-production-seed.md；修复回执：receipts/reopen-041-01.md。返修七阶段 **1/1/5**（范围确认完成；修复复测进行中；其余未开始）。**唯一下一动作：规划复核 reopen-041-01（含 admin 跨租户视图差异裁定）**。

9001/9002 数据经 demo_a_hq_1/demo_b_hq_1（租户管理员，口令＝Owner 指定值）在 /system/user、/system/dept 正常入口可见（最小截图本机留存）；admin 按隔离设计不能跨租户，若需跨租户视图须变更产品权限（未擅自放开）。正式/部署 0.1.7 既有事实保持；计数 49、46/22/22=90、ADV64/问题57、P 核销空、P62 延期/OFF、P65 待排期；清单只在本地留存并忽略，历史清理不重做。

## 上轮发布归档摘要：0.1.6-release

2026-10-16规划确认COMPLETED，5阶段5/0/0。终审：`product/0.1.6-release/receipts/planning-final-review-terminal-sync-01-completed.md`。正式/部署0.1.6，Web e5aa357、Server e115857，验证R016-VB01—04，五方向passed。历史计数49、46/22/22=90、ADV64/57；P62延期/OFF。普通用户隔离通过，UAT管理员范围保留。后续Server文档CI的2项既有预约时序失败已另列待办。该轮无剩余发布动作。


## 历史状态索引

正式功能49；清单46/22/22=90、ADV64/问题57；P62批准功能完成、有限性能延期、策略OFF。应用中心与表单分类统一已完成并随0.1.6发布；P64/P63及0.1.5修复列车已完成。历史验证与裁决见对应 `product/` 回执；持久权威为 `knowledge/current-status.md`，规划通过执行回传核实。0.1.7修复证据见bugfix-round-01及增补27；发布候选验证与提交绑定已由release-017-01/02确认，范围见规划复核02。

