# memory 使用说明

默认交付遵循Owner七步流程；仅明确不发版时在第三步结束。版本需用户确认，本轮0.1.6已确认。见 `product/delivery-lifecycle/ready/direction-owner-delivery-lifecycle.md`，新会话按constraints恢复。

## 当前发布：0.1.6-release

2026-10-16｜L/IN_PROGRESS（发布任务，新增业务功能0；执行侧在途，**两仓发版真实阻塞**）。Owner指定顺序：两仓feature/application-center→develop→压缩0.1.6种子→main→发版。方向：`product/0.1.6-release/ready/direction-release-016.md`。

实际进度（本次已核实）：①合入develop②种子/版本收敛③合入main 完成（两仓 develop→main 推送回读：Server `e1aa67d`、Web `3faaabd`；双方言 V0.1.6 单一种子+0.1.6 升级通道，checksum h2 `-1890939561`/pg `-1768731444`；版本收敛 0.1.6/0.1.6-SNAPSHOT；定向迁移测试全绿、模块 301/4/0/27、等价性双方言 IDENTICAL）。④**发版真实阻塞**：Server CI `38842087326` 失败（两项外部受控资产缺失既有失败→无 Release/制品）；Web CI `38841988314` 失败（lint 32 errors＝治理配置恢复边界覆盖暴露既有跨模块违规）；语义 tag `0.1.6` 未创建；UAT 未交付未变更（只读核验 0.1.5、DB 终点单条 0.1.5=S1）。⑤同步已落。唯一下一动作：Planner/Owner 裁决解除路径（Server：条件跳过两项／按 0.1.5 先例记录在案构建／提供 CI 资产；Web：Admin/Owner 整改边界违规或裁决口径）→重推 main、两仓 CI 发布、成对语义 tag、UAT 交付（S1 脚本）。回执 `product/0.1.6-release/receipts/release-016-01.md`；正式功能49、46/22/22=90、ADV64/57、P62延期/OFF保持；0.1.6 未发布未部署。

应用中心COMPLETED（规划已确认），49功能，4/0/0；两个方向均在passed。读取state→handoff→features→constraints；knowledge/current-status.md为持久权威。

2026-10-16恢复核对：治理七步规则已纳入system.md§3.0；0.1.6保留原五阶段和已确认版本。执行回执 `product/0.1.6-release/receipts/release-016-01.md` 已提交、进度已回传 `search_fallback/release-016-progress-readback-20261016.md`（只读回传未阻断发布）；既有唯一实施入口仍为direction-release-016.md。以上"实际进度"即执行侧本次核实值。
