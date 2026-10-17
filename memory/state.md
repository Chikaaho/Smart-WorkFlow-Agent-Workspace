# 当前状态摘要

## 当前任务：0.1.7-bugfix

2026-10-18｜0.1.7 已发布并部署（Owner 已确认版本；修复列车 43 项经 Owner 整体收口）。执行链：开发分支→develop→main 合入 → 版本/种子收敛（双方言单一 V0.1.7__baseline_seed.sql + db/upgrade/0.1.7 通道）→ 两仓 CI 发布（Web run 39067698896 success、Server run 23 success）→ 0.1.7 语义 tag → UAT 由 0.1.6 就地升级（S1 脚本；DB versioned 终点单条 0.1.7、R__ 应用 2 支、启动 ERROR 0、健康 200）。回执：product/0.1.7-bugfix/receipts/release-017-01.md。

总7阶段4/2/1：流程版本确认、修复复测、合并、发布完成；信息同步与发版确认（待规划唯一同步值清单）、发布后同步进行中；结束未开始。计数保持：正式功能 49、清单 46/22/22=90、ADV64/问题57、P62 延期/OFF；本列车不新增功能数、不核销 P；P65 独立待排期。

未决三项：①规划唯一同步值清单与复核；②Bug 清单退出跟踪与历史改写需 Owner 对精确范围授权（范围/恢复方案见 search_fallback/release-017-close-readiness.md）；③0.1.7 语义 Release 资产需 gh/令牌通道（本机无 gh；自动化通道已产出 build-<sha> Release 与 bootstrap-0.1.7.jar 资产）。

## 上轮发布归档摘要：0.1.6-release

2026-10-16规划确认COMPLETED，5阶段5/0/0。终审：`product/0.1.6-release/receipts/planning-final-review-terminal-sync-01-completed.md`。正式/部署0.1.6，Web e5aa357、Server e115857，验证R016-VB01—04，五方向passed。历史计数49、46/22/22=90、ADV64/57；P62延期/OFF。普通用户隔离通过，UAT管理员范围保留。后续Server文档CI38865882855有2项已知时序失败，稳定性另列待办。该轮无剩余发布动作。


## 历史状态索引

正式功能49；清单46/22/22=90、ADV64/问题57；P62批准功能完成、有限性能延期、策略OFF。应用中心与表单分类统一已完成并随0.1.6发布；P64/P63及0.1.5修复列车已完成。历史验证与裁决见对应 `product/` 回执；持久权威为 `knowledge/current-status.md`，规划通过执行回传核实。0.1.7修复证据见bugfix-round-01及增补27；发布候选验证与提交绑定待核实。

