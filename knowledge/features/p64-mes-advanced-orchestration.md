# 功能追踪：P64 MES高级流程编排与业务闭环（PLANNING）

> 工作区统一知识库 — **规划登记条目（PLANNING，未授权实现）**。
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
| 当前状态 | **PLANNING**（方向已登记，仅授权现状探索；业务实现未授权，未创建实现 Step、无测试结果） |
| 计数归属 | 不晋级：正式功能 47、清单 90 行 ✅46/🟦22/⬜22、ADV64、问题 57 均保持；本登记不作为第 48 个功能 |

## 2. 输入、方向与当前入口

| 项 | 路径 |
|---|---|
| 产品方向（PLANNING，待收敛 READY） | `product/p64-mes-advanced-orchestration/ready/direction-p64-mes-advanced-orchestration.md`（R01—R12、A01—A12、三场景 S1—S3、XL 阶段边界） |
| Owner 产品输入 | `product/p64-mes-advanced-orchestration/inputs/owner-bpm-advanced-summary-20261008.md`（BPM 变量/节点审批表单/Trigger 判断与配置化动作/多流程编排/两证券案例/主子流程与等待策略） |
| Owner 岗位委托补充 | `product/p64-mes-advanced-orchestration/inputs/owner-position-delegation-20261008.md`（后台「源岗位→受托岗位」通用委托，按受托岗位任职解析办理人） |
| 唯一执行入口（现状探索） | `search_task/p64-mes-advanced-orchestration-readiness-20261008.md` |
| 探索回执（本次） | `search_fallback/p64-mes-advanced-orchestration-readiness-20261008.md`＋`…-attachments.md`（逐题证据、R 矩阵、真值表、影响/资产/入口清单）＋`…-p63-propagation-readback.md`（P63 传播回读） |
| 规划侧路由 | `todo/p64-mes-advanced-orchestration.md`、`todo/requirement-pool.md`（2026-10-08 当前规划）、`memory/state.md`、`memory/handoff.md` |

## 3. 现状探索要点（2026-10-08，只读静态＋既有回执核对）

- 结论总览：R02/R03 判断与动作配置层、R05 主子流程、R08 聚合选人、R09 循环与 MES 样板、R10 缺失；R01/R06/R07/R11/R12 部分具备（意见表单/记录级权限/8 类参与人策略/IoT 与 OpenAPI 对端/版本冻结与开关）；可靠底座（`sw_bpm_command`、事务动作、幂等恢复、P63 预约）与脚本沙箱（GraalJS/子进程）已有可复用接缝。
- 聚合口径：本轮未运行任何工程验证（无编译/测试/构建/迁移/DB/服务/设备），静态否定不等于运行期不可用；证据层级与逐项缺口见回执附件。
- **Planner 复核回执并收敛 READY 前，不进入实现、不新增合同值**。

## 4. 边界

- 完整生产排程/MRP、全套 ERP/WMS、真实厂商网络/工厂部署、硬实时与物理恰一次不在目标内（沿方向§6）。
- P62 性能 Owner 延期未验证、新资源策略默认关闭；周期发起、任意即席子流程、全部复杂组织模型为独立候选。
- P63 已验收语义（部门负责人原义、动态并行、预约）继续锁定，新增能力以「显式配置＋新发布版本」生效。
