# 功能摘要

## 当前任务：0.1.7-bugfix

2026-10-16｜L级方向READY：`product/0.1.7-bugfix/ready/direction-bugfix-017.md`。发布版本0.1.7已确认；唯一清单 `product/0.1.7-bugfix/1.0.7bug.md`（相对工作区根目录）。Owner与Executor直接修复/复测往返：Executor自验后填“是”，Owner填回归通过或不通过及原因，持续至Owner宣布修复结束。修复验收由Owner完成，规划参与信息同步与发版确认。当前尚无执行结果回传。

总7阶段1/1/5：流程/输入/版本确认完成；Executor修复与Owner复测进行中；结束后同步与发版确认、合并、发布、发布后同步、结束未开始。规划下一参与节点：收到修复结束后的同步交接，办理同步及发版确认；执行侧读取该文件与Owner继续修复。Bug列车本身不新增功能计数或核销P。

## 上轮发布归档摘要：0.1.6-release

2026-10-16规划确认COMPLETED，5阶段5/0/0。终审：`product/0.1.6-release/receipts/planning-final-review-terminal-sync-01-completed.md`。正式/部署0.1.6，Web e5aa357、Server e115857，验证R016-VB01—04，五方向passed。历史计数49、46/22/22=90、ADV64/57；P62延期/OFF。普通用户隔离通过，UAT管理员范围保留。后续Server文档CI38865882855有2项已知时序失败，稳定性另列待办。该轮无剩余发布动作。


## 已完成功能与历史基线

- **application-center-form-classification（L）**：应用中心与表单分类统一；功能验收 PASSED（2026-10-16 规划审查03）、**COMPLETED（规划已确认，2026-10-16）**、**第49个正式功能**（=旧48+本功能1，无P编号）；4阶段 4/0/0；终态回执 `receipts/terminal-sync-01.md`；正式验证集合AC-VB01—04见终态方向；已随 0.1.6 发布部署，用户端顶栏入口修复已纳入正式0.1.6（见上，`user-entry-fix-01.md`）。
- `p64-mes-advanced-orchestration`（P64，XL）：**COMPLETED（规划已确认，2026-10-13）**、第48个正式功能；三阶段PASSED（3/0/0）；终审02；范围边界=受控HTTP层级/异步对账观察非性能或物理承诺。
- `p63-mes-workflow-foundations`（P63，L/P0）：**COMPLETED（规划已确认，2026-10-08）**；动态并行审批+一次性IoT预约下发；R01—R06核销、20/20、A01—A10、TS01—03通过。
- `p62-lowcode-transaction-bpm-tiering`（P62，XL）：批准功能 **COMPLETED（规划已确认，2026-10-06）**；有限性能三轮未过/VERIFYING、Owner搁置为已知延期（2026-10-12；未来方向=带权参数配置、后台可配置每租户优先级）；新资源策略默认OFF；见 `todo/p62-lowcode-transaction-bpm-tiering.md` §性能已知延期。
- `bugfix-20261013`（0.1.5列车，非业务计数）：**COMPLETED（规划已确认，2026-10-15）**；BF001—053；5阶段5/0/0；应用/部署0.1.5、开发默认0.1.5-SNAPSHOT；验证BF015-VB01—04见 `handoff.md`。
- `backend-architecture-optimization`（XL）：**COMPLETED（规划已确认，2026-09-26）**；BAO-01 DEFERRED+BAO-02 PARTIAL+8 COMPLETED。
- `v0.1.0-oa-completion`（P60，XL/P0）：**COMPLETED（规划已确认，2026-09-15）**，整体14/14。
- 更早（均COMPLETED，详见 `knowledge/features/`）：p53（第45个）、p21（第44个）、v0.0.2-oa（第43个）、p58—p45、sso-admin-config、p61、p59、minimal-closure等；I6五渠道与WECOM=Owner延期/未验证（P2待办）。

