# 功能摘要

## 当前发布：0.1.6-release

2026-10-16｜L/IN_PROGRESS（发布任务，新增业务功能0；执行侧在途，**两仓发版真实阻塞**）。Owner指定顺序：两仓feature/application-center→develop→压缩0.1.6种子→main→发版。方向：`product/0.1.6-release/ready/direction-release-016.md`。

实际进度（本次已核实）：①合入develop②种子/版本收敛③合入main 完成（两仓 develop→main 推送回读：Server `e1aa67d`、Web `3faaabd`；双方言 V0.1.6 单一种子+0.1.6 升级通道，checksum h2 `-1890939561`/pg `-1768731444`；版本收敛 0.1.6/0.1.6-SNAPSHOT；定向迁移测试全绿、模块 301/4/0/27、等价性双方言 IDENTICAL）。④**发版真实阻塞**：Server CI `38842087326` 失败（两项外部受控资产缺失既有失败→无 Release/制品）；Web CI `38841988314` 失败（lint 32 errors＝治理配置恢复边界覆盖暴露既有跨模块违规）；语义 tag `0.1.6` 未创建；UAT 未交付未变更（只读核验 0.1.5、DB 终点单条 0.1.5=S1）。⑤同步已落。唯一下一动作：Planner/Owner 裁决解除路径（Server：条件跳过两项／按 0.1.5 先例记录在案构建／提供 CI 资产；Web：Admin/Owner 整改边界违规或裁决口径）→重推 main、两仓 CI 发布、成对语义 tag、UAT 交付（S1 脚本）。回执 `product/0.1.6-release/receipts/release-016-01.md`；正式功能49、46/22/22=90、ADV64/57、P62延期/OFF保持；0.1.6 未发布未部署。

## 已完成功能与历史基线

- **application-center-form-classification（L）**：应用中心与表单分类统一；功能验收 PASSED（2026-10-16 规划审查03）、**COMPLETED（规划已确认，2026-10-16）**、**第49个正式功能**（=旧48+本功能1，无P编号）；4阶段 4/0/0；终态回执 `receipts/terminal-sync-01.md`；正式验证集合AC-VB01—04见终态方向；未发布部署。
- `p64-mes-advanced-orchestration`（P64，XL）：**COMPLETED（规划已确认，2026-10-13）**、第48个正式功能；三阶段PASSED（3/0/0）；终审02；范围边界=受控HTTP层级/异步对账观察非性能或物理承诺。
- `p63-mes-workflow-foundations`（P63，L/P0）：**COMPLETED（规划已确认，2026-10-08）**；动态并行审批+一次性IoT预约下发；R01—R06核销、20/20、A01—A10、TS01—03通过。
- `p62-lowcode-transaction-bpm-tiering`（P62，XL）：批准功能 **COMPLETED（规划已确认，2026-10-06）**；有限性能三轮未过/VERIFYING、Owner搁置为已知延期（2026-10-12；未来方向=带权参数配置、后台可配置每租户优先级）；新资源策略默认OFF；见 `todo/p62-lowcode-transaction-bpm-tiering.md` §性能已知延期。
- `bugfix-20261013`（0.1.5列车，非业务计数）：**COMPLETED（规划已确认，2026-10-15）**；BF001—053；5阶段5/0/0；应用/部署0.1.5、开发默认0.1.5-SNAPSHOT；验证BF015-VB01—04见 `handoff.md`。
- `backend-architecture-optimization`（XL）：**COMPLETED（规划已确认，2026-09-26）**；BAO-01 DEFERRED+BAO-02 PARTIAL+8 COMPLETED。
- `v0.1.0-oa-completion`（P60，XL/P0）：**COMPLETED（规划已确认，2026-09-15）**，整体14/14。
- 更早（均COMPLETED，详见 `knowledge/features/`）：p53（第45个）、p21（第44个）、v0.0.2-oa（第43个）、p58—p45、sso-admin-config、p61、p59、minimal-closure等；I6五渠道与WECOM=Owner延期/未验证（P2待办）。

2026-10-16恢复核对：治理七步规则已纳入system.md§3.0；0.1.6保留原五阶段和已确认版本。发布目录本次尚无执行回执，以上0/0/5为发布前摘要，实际在途进度待执行侧回传；只读请求 `search_task/release-016-progress-readback-20261016.md` 不阻断原发布流程。既有唯一实施入口仍为direction-release-016.md。
