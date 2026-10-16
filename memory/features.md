# 功能摘要

## 当前发布：0.1.6-release

2026-10-16｜L/VERIFYING（用户端交付验收重开）。0.1.6已发布并部署（发布事实保留）；Owner验收不通过：/workspace顶栏无应用中心。根因=用户端主导航默认派生缺项（非权限/缓存/版本）。Web `feature/application-center-user-entry`（develop新建）`c3cd686` 顶栏常驻应用中心＋`f9798cd` 原型页（列表搜索/每行数量、应用内目录树＋内联数据列表）＋`e5aa357` 去全局侧栏/白底目录栏；回读 `e5aa357…`；门禁 0／0e3w／1563+3／0。

复验：隔离库 sw_entry_fix＋临时普通用户（仅本人、无后台管理权限）四项；UAT chikaho.cn 中文顶栏四项、点击进入、目录/表单＋真实记录、刷新保持、无全局侧栏且目录栏白底；UAT 前端=修复候选（`858ffc22…`，备份 `web.bak-entryfix-20261016_1352` 可回滚），后端仍 0.1.6、库/健康未变、标签制品未动。

唯一下一动作：Owner/Planner 复核 `product/0.1.6-release/receipts/user-entry-fix-01.md` 并裁定是否需新正式版本；UAT 普通身份对照需授权。功能49、46/22/22、ADV64/57、P62延期/OFF保持。


## 已完成功能与历史基线

- **application-center-form-classification（L）**：应用中心与表单分类统一；功能验收 PASSED（2026-10-16 规划审查03）、**COMPLETED（规划已确认，2026-10-16）**、**第49个正式功能**（=旧48+本功能1，无P编号）；4阶段 4/0/0；终态回执 `receipts/terminal-sync-01.md`；正式验证集合AC-VB01—04见终态方向；已随 0.1.6 发布部署，用户端顶栏入口经修复候选补齐（见上，`user-entry-fix-01.md`）。
- `p64-mes-advanced-orchestration`（P64，XL）：**COMPLETED（规划已确认，2026-10-13）**、第48个正式功能；三阶段PASSED（3/0/0）；终审02；范围边界=受控HTTP层级/异步对账观察非性能或物理承诺。
- `p63-mes-workflow-foundations`（P63，L/P0）：**COMPLETED（规划已确认，2026-10-08）**；动态并行审批+一次性IoT预约下发；R01—R06核销、20/20、A01—A10、TS01—03通过。
- `p62-lowcode-transaction-bpm-tiering`（P62，XL）：批准功能 **COMPLETED（规划已确认，2026-10-06）**；有限性能三轮未过/VERIFYING、Owner搁置为已知延期（2026-10-12；未来方向=带权参数配置、后台可配置每租户优先级）；新资源策略默认OFF；见 `todo/p62-lowcode-transaction-bpm-tiering.md` §性能已知延期。
- `bugfix-20261013`（0.1.5列车，非业务计数）：**COMPLETED（规划已确认，2026-10-15）**；BF001—053；5阶段5/0/0；应用/部署0.1.5、开发默认0.1.5-SNAPSHOT；验证BF015-VB01—04见 `handoff.md`。
- `backend-architecture-optimization`（XL）：**COMPLETED（规划已确认，2026-09-26）**；BAO-01 DEFERRED+BAO-02 PARTIAL+8 COMPLETED。
- `v0.1.0-oa-completion`（P60，XL/P0）：**COMPLETED（规划已确认，2026-09-15）**，整体14/14。
- 更早（均COMPLETED，详见 `knowledge/features/`）：p53（第45个）、p21（第44个）、v0.0.2-oa（第43个）、p58—p45、sso-admin-config、p61、p59、minimal-closure等；I6五渠道与WECOM=Owner延期/未验证（P2待办）。

