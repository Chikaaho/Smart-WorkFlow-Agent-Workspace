# 功能摘要

## 当前发布：0.1.6-release

2026-10-16｜L/IN_PROGRESS；用户端修复Owner验收PASSED保持。Owner明确本次验收异常仍用0.1.6，授权覆盖该版本标签/Release及受影响制品，无需新版本确认。方向：product/0.1.6-release/ready/direction-release-016-acceptance-republish.md。

唯一下一动作：Executor保留旧0.1.6发布恢复点，将已验收Web e5aa357修复经develop→main集成，CI通过后更新0.1.6正式标签/Release/制品及既有部署，knowledge-first同步后提交release-016-03.md。仅覆盖本次0.1.6所需对象，不强推develop/main；无变化Server保持0.1.6。最近已知运行=后端0.1.6＋前端修复候选，正式覆盖尚待执行回执。总5阶段：前三项历史完成；④同版本修复覆盖发布进行中；⑤最终同步终审未完成。功能49、46/22/22=90、ADV64/57、P62延期/OFF保持。


## 已完成功能与历史基线

- **application-center-form-classification（L）**：应用中心与表单分类统一；功能验收 PASSED（2026-10-16 规划审查03）、**COMPLETED（规划已确认，2026-10-16）**、**第49个正式功能**（=旧48+本功能1，无P编号）；4阶段 4/0/0；终态回执 `receipts/terminal-sync-01.md`；正式验证集合AC-VB01—04见终态方向；已随 0.1.6 发布部署，用户端顶栏入口经修复候选补齐（见上，`user-entry-fix-01.md`）。
- `p64-mes-advanced-orchestration`（P64，XL）：**COMPLETED（规划已确认，2026-10-13）**、第48个正式功能；三阶段PASSED（3/0/0）；终审02；范围边界=受控HTTP层级/异步对账观察非性能或物理承诺。
- `p63-mes-workflow-foundations`（P63，L/P0）：**COMPLETED（规划已确认，2026-10-08）**；动态并行审批+一次性IoT预约下发；R01—R06核销、20/20、A01—A10、TS01—03通过。
- `p62-lowcode-transaction-bpm-tiering`（P62，XL）：批准功能 **COMPLETED（规划已确认，2026-10-06）**；有限性能三轮未过/VERIFYING、Owner搁置为已知延期（2026-10-12；未来方向=带权参数配置、后台可配置每租户优先级）；新资源策略默认OFF；见 `todo/p62-lowcode-transaction-bpm-tiering.md` §性能已知延期。
- `bugfix-20261013`（0.1.5列车，非业务计数）：**COMPLETED（规划已确认，2026-10-15）**；BF001—053；5阶段5/0/0；应用/部署0.1.5、开发默认0.1.5-SNAPSHOT；验证BF015-VB01—04见 `handoff.md`。
- `backend-architecture-optimization`（XL）：**COMPLETED（规划已确认，2026-09-26）**；BAO-01 DEFERRED+BAO-02 PARTIAL+8 COMPLETED。
- `v0.1.0-oa-completion`（P60，XL/P0）：**COMPLETED（规划已确认，2026-09-15）**，整体14/14。
- 更早（均COMPLETED，详见 `knowledge/features/`）：p53（第45个）、p21（第44个）、v0.0.2-oa（第43个）、p58—p45、sso-admin-config、p61、p59、minimal-closure等；I6五渠道与WECOM=Owner延期/未验证（P2待办）。

