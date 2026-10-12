# 功能追踪：P64 MES高级流程编排与业务闭环（COMPLETED（待规划终态复核）·功能验收PASSED审查05·正式功能第48个）

> 工作区统一知识库 — **实施登记条目（IN_PROGRESS：阶段Ⅰ已由规划验收08 判定 PASSED（2026-10-10）；阶段Ⅱ已由[规划验收09](../../product/p64-mes-advanced-orchestration/receipts/planning-review-phase-2-09-passed.md)判定 PASSED（2026-10-11）；阶段Ⅲ已由 Executor 执行完毕：[回执01](../../product/p64-mes-advanced-orchestration/receipts/phase-3-completion-receipt-01.md) 已提交（2026-10-12，自验通过待规划独立验收；A08—A12 交付+A01—A07 覆盖核对+门禁 process 388/0/0 等），完整实施授权持续）**。
> **本条目不计入正式功能数（当前 47 不变）、不核销任何 P 编号或 90 行明细、不改变 ADV64 与其他计数**；只有 Planner 下发正式方向、Executor 完成交付并经 Planner 验收后，才可能作为新的正式功能登记与计数。
> 可信度标记：CONFIRMED / REPORTED / ASSUMED / SUPERSEDED

---

## 1. 登记信息

| 字段 | 值 |
|------|-----|
| 功能编号 | P64（需求池编号；暂不对应 Mxx-Fyy-zz 明细） |
| 功能名称 | MES高级流程编排与业务闭环 |
| 等级 / 优先级 | XL（核心架构、跨流程运行模型、组织身份、多版本兼容） |
| 创建日期 | 2026-10-08（Owner 需求与高级流程摘要 → 规划登记） |
| 当前状态 | **整体终态同步已执行（[terminal-sync-p64-01](../../product/p64-mes-advanced-orchestration/receipts/terminal-sync-p64-01.md)，2026-10-12，待规划终态复核）**：功能验收 PASSED（[审查05](../../product/p64-mes-advanced-orchestration/receipts/planning-review-phase-3-05-passed.md)，2026-10-12，R01—R12/A01—A12通过、业务缺口0）；阶段Ⅰ/Ⅱ/Ⅲ PASSED（验收08/09/05）、完成3/进行中0/未开始0；P64批准范围完成核销（同一登记ID，不重复计算阶段/场景）。P64正式验证集合={P64-VB01功能行为/P64-VB02 Server/P64-VB03 Web/P64-VB04持久化}，逐项值见终态同步回执与 `current-status`。前序：阶段Ⅲ数量差异关闭收尾完成（[回执04](../../product/p64-mes-advanced-orchestration/receipts/phase-3-completion-receipt-04.md)，2026-10-12，待规划验收；证据 evidence/phase3-04）**：代表性报废场景 WO-2026-344（主流程 v6）——差异未说明主单不关闭且补正任务自动出现，交代齐备（实际0+报废3+剩余7未生产+原因）后 APPROVED；数量与原因经实例 node-form-data 按工单查回；库存 0/0 未虚增、不强制满产。实现：`mes_close_form` v2 + 数量关闭说明子流程（触发器JS校验+递归补正）+ 主流程 v6 两分支派 act_close 等待门槛 ALL；**必要局部实现**=引擎缺口修复（子流程内带门槛异步终态父批次永不结算 → `BpmInstanceStateSyncJob` 对账结算钩子，Server `4681634` 已推送回读，聚焦单测 3/0，链344 三跳结算时间线实证）；342 历史原事实保留、343 演练受控废弃留对照。前序：关闭事实只读核实（341/342 均 APPROVED 真实关闭，[核实结果](../../search_fallback/p64-phase3-close-readback-20261012.md)）与[验收03](../../product/p64-mes-advanced-orchestration/receipts/planning-review-phase-3-03.md)/[裁决04](../../product/p64-mes-advanced-orchestration/receipts/planning-review-phase-3-04.md)裁决、修复[回执03](../../product/p64-mes-advanced-orchestration/receipts/phase-3-completion-receipt-03.md)（证据 evidence/phase3-03）。P64 整体 IN_PROGRESS·Ⅰ/Ⅱ PASSED·Ⅲ VERIFYING（2/1/0）。更早验收史：阶段Ⅱ PASSED（[验收09](../../product/p64-mes-advanced-orchestration/receipts/planning-review-phase-2-09-passed.md)，2026-10-11）；阶段Ⅰ PASSED（验收08）；Owner 已认可保留根 gitlink 并授权后续同类常规 Git 指针调整由代理自行核实决定、直接报告（[授权记录](../../product/p64-mes-advanced-orchestration/receipts/owner-gitlink-decision-20261011.md)）。原回执09 轮描述见下段历史|
| 计数归属 | **晋级：正式功能 48=旧47+P64整体1（P64 为第 48 个，同一登记 ID 复用、不重复计算阶段或场景）；清单 90 行 ✅46/🟦22/⬜22=90 本次升降集合=[]；ADV64 本次升降集合=[]（ADV-M11-F01-04/ADV-M11-F02-02 登记 P64 已验收子能力关联、保留既有行状态）；问题 57 不增删** |

## 2. 输入、方向与当前入口

| 项 | 路径 |
|---|---|
| 产品方向（已归档 passed） | `product/p64-mes-advanced-orchestration/passed/direction-p64-mes-advanced-orchestration.md`（R01—R12、A01—A12、三场景 S1—S3、XL 阶段边界；Planner 终态归档） |
| 架构方案（READY） | `product/p64-mes-advanced-orchestration/ready/solution-p64-mes-advanced-orchestration.md`（PD01—PD06、用户路径、三阶段能力交付；阶段I=A01—A04、II=A05—A07、III=A08—A12） |
| 当前规划复核 | **[验收09](../../product/p64-mes-advanced-orchestration/receipts/planning-review-phase-2-09-passed.md)（2026-10-11，阶段Ⅱ PASSED；T/S 账本清零，本行为当前值）**；更早轮次（复审08/提示07/回执09 提交时点及复审07/提示06/回执08 与之前）全部追溯化 |
| Owner 产品输入 | `product/p64-mes-advanced-orchestration/inputs/owner-bpm-advanced-summary-20261008.md`（BPM 变量/节点审批表单/Trigger 判断与配置化动作/多流程编排/两证券案例/主子流程与等待策略） |
| Owner 岗位委托补充 | `product/p64-mes-advanced-orchestration/inputs/owner-position-delegation-20261008.md`（后台「源岗位→受托岗位」通用委托，按受托岗位任职解析办理人） |
| 探索任务（已完成·历史） | `search_task/p64-mes-advanced-orchestration-readiness-20261008.md`（已标作历史） |
| 探索回执（历史输入） | `search_fallback/p64-mes-advanced-orchestration-readiness-20261008.md`＋`…-attachments.md`（逐题证据、R 矩阵、真值表、影响/资产/入口清单）＋`…-p63-propagation-readback.md`（P63 传播回读） |
| READY 传播回执与复核 | 传播回执 `receipts/ready-state-propagation-01.md`/`-02.md`；规划复核01（G1—G4）→ 规划复核02 `receipts/planning-review-ready-state-propagation-02.md` **四项差异全部核销关闭**（G3 经 Owner 认可保留 Server gitlink `78495dc`）；裁决传播回执 `receipts/ready-state-propagation-03.md` |
| 实施授权（当前入口） | `product/p64-mes-advanced-orchestration/ready/authorization-p64-implementation-20261008.md`（2026-10-08 Owner"开始实施"；覆盖完整 P64 三阶段，当前阶段Ⅱ=A05—A07及相关A11/A12；阶段Ⅱ方向 `ready/direction-p64-phase2-personnel-parent-child.md` 为唯一业务交付入口） |
| 代码分支 | 实施分支＝两仓 `feature/p64-mes-advanced-orchestration`，**本机已检出**。时点值①（2026-10-08 实测）：Server=`b7283c8`、Web=`7af86f2`（快进检出，0/0）；工作区 `develop-sw`=`39b68aa2`。时点值②（2026-10-09 回执07 提交）：Server HEAD=`d47b4e1`（含代码 `effca33`）、Web=`21074af`。时点值③（2026-10-10 回执08 提交/阶段Ⅱ启动实测）：Server HEAD=`ef72c8b`（含代码 `effca33`＋功能清单焦点行文档）、Web=`21074af`（本轮零改动）、工作区 `develop-sw`=`e6e0fb8e`；各时点均 origin 同 SHA（原输出 phase1-08/P1-08a-C/raw；启动实测见 knowledge/current-status.md 顶部条目）。HEAD 内 Server gitlink=`78495dc…` 经 Owner 认可保留（复核02 G3） |
| 规划侧路由 | `todo/p64-mes-advanced-orchestration.md`、`todo/requirement-pool.md`（2026-10-11 当前=阶段Ⅱ PASSED（验收09）/P62 新机就绪探索已完成，唯一下一动作=Planner 读取探索回执固定有限性能方向）、`memory/state.md`、`memory/handoff.md`、`knowledge/current-status.md`（顶部条目） |

## 3. 现状探索要点（2026-10-08，只读静态＋既有回执核对）

- 结论总览：R02/R03 判断与动作配置层、R05 主子流程、R08 聚合选人、R09 循环与 MES 样板、R10 缺失；R01/R06/R07/R11/R12 部分具备（意见表单/记录级权限/8 类参与人策略/IoT 与 OpenAPI 对端/版本冻结与开关）；可靠底座（`sw_bpm_command`、事务动作、幂等恢复、P63 预约）与脚本沙箱（GraalJS/子进程）已有可复用接缝。
- 聚合口径：本轮未运行任何工程验证（无编译/测试/构建/迁移/DB/服务/设备），静态否定不等于运行期不可用；证据层级与逐项缺口见回执附件。
- **Owner 授权业务实施前，不进入实现、不新增合同值**；实施获授权后以正式方向为完整目标，Executor 自主制定实施/验证/ADR 并遵守两仓 feature 分支及既有工程宪法（方案复核02§5）。

## 4. 边界

- 完整生产排程/MRP、全套 ERP/WMS、真实厂商网络/工厂部署、硬实时与物理恰一次不在目标内（沿方向§6）。
- P62 性能 Owner 延期未验证、新资源策略默认关闭；周期发起、任意即席子流程、全部复杂组织模型为独立候选。
- P63 已验收语义（部门负责人原义、动态并行、预约）继续锁定，新增能力以「显式配置＋新发布版本」生效。
