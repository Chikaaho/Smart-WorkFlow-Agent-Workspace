# memory 使用说明

## 当前任务：0.1.7-bugfix

2026-10-18｜0.1.7 已发布并部署（Owner 已确认版本；修复列车 43 项经 Owner 整体收口），成对语义 Release 0.1.7 已发布（Server bootstrap-0.1.7.jar／Web sw-web-dist-0.1.7.zip，sha256 见回执；下载回读 200）。执行链：开发分支→develop→main 合入 → 版本/种子收敛（双方言单一 V0.1.7__baseline_seed.sql + db/upgrade/0.1.7 通道）→ 两仓 CI 发布（Web run 39067698896 success、Server run 23 success）→ UAT 由 0.1.6 就地升级（S1 脚本；DB versioned 终点单条 0.1.7、R__ 应用 2 支、启动 ERROR 0、健康 200）。回执：release-017-01/-02、terminal-sync-017-01。

列车 **COMPLETED（规划已确认，2026-10-18）**；总7阶段 7/0/0（结束阶段＝终态裁决传播与规划回读，落盘/回读前按 6/1/0）；收尾复核02 PASSED，终态方向回读后归档 passed。

正式/部署/DB 0.1.7；开发默认 Server 0.1.7-SNAPSHOT、Web 0.1.7；发布来源 Server 5af1329、Web 4e89249；验证集合 R017-VB01—04。计数 49（=49+0）、46/22/22=90、ADV64/问题57；P 核销集合空、P65 待排期、P62 延期/OFF；活动功能/交付无。清单仅本地留存并忽略；重写分支与新克隆路径历史已清除（恢复备份/refs/original/其他克隆/托管缓存保留边界）。**最终下一动作：等待 Owner 选择下一任务（P65 为待排期候选）**。

## 上轮发布归档摘要：0.1.6-release

2026-10-16规划确认COMPLETED，5阶段5/0/0。终审：`product/0.1.6-release/receipts/planning-final-review-terminal-sync-01-completed.md`。正式/部署0.1.6，Web e5aa357、Server e115857，验证R016-VB01—04，五方向passed。历史计数49、46/22/22=90、ADV64/57；P62延期/OFF。普通用户隔离通过，UAT管理员范围保留。后续Server文档CI的2项既有预约时序失败已另列待办。该轮无剩余发布动作。

