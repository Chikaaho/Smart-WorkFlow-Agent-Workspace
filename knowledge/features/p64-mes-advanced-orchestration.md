# 功能追踪：P64 MES高级流程编排与业务闭环（IN_PROGRESS·阶段Ⅱ）

> 工作区统一知识库 — **实施登记条目（IN_PROGRESS：阶段Ⅰ已由规划验收08 判定 PASSED（2026-10-10）；Executor 已按阶段Ⅱ方向实际启动阶段Ⅱ人员与父子协作）**。
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
| 当前状态 | **VERIFYING（阶段Ⅱ回执06 提交待规划独立验收，2026-10-11）**——[复审05](../../product/p64-mes-advanced-orchestration/receipts/planning-review-phase-2-05.md)七项精确剩余账本已按[提示04](../../product/p64-mes-advanced-orchestration/receipts/planning-execution-prompt-p64-phase2-04.md)逐项处置并提交[回执06](../../product/p64-mes-advanced-orchestration/receipts/phase-2-completion-receipt-06.md)（证据树 phase2-06）：**P2-04a** 确证缺陷→最小修复——系统派发子记录 create_by=父发起人使 SELF 被分配办理人读不到自己的派发对象；`FormDataSubmitFacade#submitOnBehalfOf`（归属人落库，校验/可见性/审计按调用方上下文）+OrchActionStartCommandHandler 按目标定义首节点 FORM_FIELD/USER/MAIN 参与人字段解析；实机 jia/yi 受控分配对象 create_by=owner_id=各自办理人、详情/列表/任务详情/节点表单正向 200、互看 **1507/403**、越权写 403（功能权限口径）、jia 办理命令 200+子实例 APPROVED；像素乙待办恰1行+任务详情逐行可读（内置浏览器+固定验证码1234零OCR）。**P2-02b-V-C** 确证缺陷→最小修复——WRITTEN 项 error_text 与 SETTLED 批次 block_reason 残留挂起文案；applyWriteback/settleBatch 清诊断+**实机暴露 MP updateById 忽略 null 字段次生缺陷**→retryWriteback 显式 wrapper 清 error_text；Web 面板按状态区分当前/历史（未决=当前警告、已恢复/结算=灰色历史诊断）；实链三像素（真实未恢复冲突准确显示待处置→恢复后干净面板→r04 锁定面板遗留降级灰字），回写次数不增加、零数据迁移。**P2-05b-A** 5 目标方法+3 配置方法原断言 ↔ XML testcase ↔ 运行树 SHA 三方关联（不重跑）。**P2-06a-C** 确证缺陷→最小修复——真实 H2 竞争验证同根两不同 batch 并发冻结双双放行总额=1001>1000（修复前原证留存）；修复=根实例行 FOR UPDATE 互斥；修复后恰1放行+1拒绝（2447 可诊断）、总额=1000、零新增副作用；四 case 原断言与 26/0 XML 关联保持。**P2-06b** 在役收敛实链——v3 在役父实例（WAITING 批次2项）→发布 v4 关闭新入口（去触发器+移除等待节点重连边，v3 冻结行不动）→新实例 def_version=4 走完运维节点 trigger_exec=0/child-batches=0（零新意图）→在役父继续收敛：子办理→WRITTEN+设计内版本冲突→受控恢复→SETTLED 2/2→唤醒→复核→**父 APPROVED（原版原义）**+收敛像素。**P2-07b** knowledge 四入口逐字段更新+Server 功能清单焦点 `功能清单.md` 焦点行滚动更新+reconciliation P64 零命中原件+memory/todo/product 复用 Planner 修订回读+三仓 Git。**P2-07b-G** 报告清单逐类复算（engine 114/0 重跑、process 386/0、system-biz 365/0、form-biz 178/0 净+2、Web 四门 0e/3w+1386+3）、锚 56/0 与 Nested 27/0 来源引用、COUNT helper 原行、李四身份 SQL/网络/像素三方锁定（纠正回执05 错误 JSON）、探针 12:02/03 与 PID 43556(12:14) 分时点登记、终止/清理实际原观察（taskkill 实际输出+零监听+30 实例 0/0/0）。门禁：engine 114/0（重跑）、process 386/0（净+5）、system-biz 365/0、form-biz 178/0（净+2）、Web 四门 exit0；Git Server `d594663`+`3341de5`、Web `4333145` 推送读回一致。原回执05 轮描述见下段历史 |
| 计数归属 | 不晋级：正式功能 47、清单 90 行 ✅46/🟦22/⬜22、ADV64、问题 57 均保持；本登记不作为第 48 个功能 |

## 2. 输入、方向与当前入口

| 项 | 路径 |
|---|---|
| 产品方向（READY） | `product/p64-mes-advanced-orchestration/ready/direction-p64-mes-advanced-orchestration.md`（R01—R12、A01—A12、三场景 S1—S3、XL 阶段边界） |
| 架构方案（READY） | `product/p64-mes-advanced-orchestration/ready/solution-p64-mes-advanced-orchestration.md`（PD01—PD06、用户路径、三阶段能力交付；阶段I=A01—A04、II=A05—A07、III=A08—A12） |
| 当前规划复核 | [复审05](../../product/p64-mes-advanced-orchestration/receipts/planning-review-phase-2-05.md)（2026-10-11，7项精确剩余账本）→ [提示04](../../product/p64-mes-advanced-orchestration/receipts/planning-execution-prompt-p64-phase2-04.md)（唯一执行入口，已执行完毕）→ [回执06](../../product/p64-mes-advanced-orchestration/receipts/phase-2-completion-receipt-06.md)（已提交待独立验收）；更早轮次（复审03/提示03/回执05、复审04 之前）全部追溯化 |
| Owner 产品输入 | `product/p64-mes-advanced-orchestration/inputs/owner-bpm-advanced-summary-20261008.md`（BPM 变量/节点审批表单/Trigger 判断与配置化动作/多流程编排/两证券案例/主子流程与等待策略） |
| Owner 岗位委托补充 | `product/p64-mes-advanced-orchestration/inputs/owner-position-delegation-20261008.md`（后台「源岗位→受托岗位」通用委托，按受托岗位任职解析办理人） |
| 探索任务（已完成·历史） | `search_task/p64-mes-advanced-orchestration-readiness-20261008.md`（已标作历史） |
| 探索回执（历史输入） | `search_fallback/p64-mes-advanced-orchestration-readiness-20261008.md`＋`…-attachments.md`（逐题证据、R 矩阵、真值表、影响/资产/入口清单）＋`…-p63-propagation-readback.md`（P63 传播回读） |
| READY 传播回执与复核 | 传播回执 `receipts/ready-state-propagation-01.md`/`-02.md`；规划复核01（G1—G4）→ 规划复核02 `receipts/planning-review-ready-state-propagation-02.md` **四项差异全部核销关闭**（G3 经 Owner 认可保留 Server gitlink `78495dc`）；裁决传播回执 `receipts/ready-state-propagation-03.md` |
| 实施授权（当前入口） | `product/p64-mes-advanced-orchestration/ready/authorization-p64-implementation-20261008.md`（2026-10-08 Owner"开始实施"；覆盖完整 P64 三阶段，当前阶段Ⅱ=A05—A07及相关A11/A12；阶段Ⅱ方向 `ready/direction-p64-phase2-personnel-parent-child.md` 为唯一业务交付入口） |
| 代码分支 | 实施分支＝两仓 `feature/p64-mes-advanced-orchestration`，**本机已检出**。时点值①（2026-10-08 实测）：Server=`b7283c8`、Web=`7af86f2`（快进检出，0/0）；工作区 `develop-sw`=`39b68aa2`。时点值②（2026-10-09 回执07 提交）：Server HEAD=`d47b4e1`（含代码 `effca33`）、Web=`21074af`。时点值③（2026-10-10 回执08 提交/阶段Ⅱ启动实测）：Server HEAD=`ef72c8b`（含代码 `effca33`＋功能清单焦点行文档）、Web=`21074af`（本轮零改动）、工作区 `develop-sw`=`e6e0fb8e`；各时点均 origin 同 SHA（原输出 phase1-08/P1-08a-C/raw；启动实测见 knowledge/current-status.md 顶部条目）。HEAD 内 Server gitlink=`78495dc…` 经 Owner 认可保留（复核02 G3） |
| 规划侧路由 | `todo/p64-mes-advanced-orchestration.md`、`todo/requirement-pool.md`（2026-10-10 当前=阶段Ⅱ审查01 VERIFYING/Executor 按差异账本补证中）、`memory/state.md`、`memory/handoff.md`、`knowledge/current-status.md`（顶部条目） |

## 3. 现状探索要点（2026-10-08，只读静态＋既有回执核对）

- 结论总览：R02/R03 判断与动作配置层、R05 主子流程、R08 聚合选人、R09 循环与 MES 样板、R10 缺失；R01/R06/R07/R11/R12 部分具备（意见表单/记录级权限/8 类参与人策略/IoT 与 OpenAPI 对端/版本冻结与开关）；可靠底座（`sw_bpm_command`、事务动作、幂等恢复、P63 预约）与脚本沙箱（GraalJS/子进程）已有可复用接缝。
- 聚合口径：本轮未运行任何工程验证（无编译/测试/构建/迁移/DB/服务/设备），静态否定不等于运行期不可用；证据层级与逐项缺口见回执附件。
- **Owner 授权业务实施前，不进入实现、不新增合同值**；实施获授权后以正式方向为完整目标，Executor 自主制定实施/验证/ADR 并遵守两仓 feature 分支及既有工程宪法（方案复核02§5）。

## 4. 边界

- 完整生产排程/MRP、全套 ERP/WMS、真实厂商网络/工厂部署、硬实时与物理恰一次不在目标内（沿方向§6）。
- P62 性能 Owner 延期未验证、新资源策略默认关闭；周期发起、任意即席子流程、全部复杂组织模型为独立候选。
- P63 已验收语义（部门负责人原义、动态并行、预约）继续锁定，新增能力以「显式配置＋新发布版本」生效。
