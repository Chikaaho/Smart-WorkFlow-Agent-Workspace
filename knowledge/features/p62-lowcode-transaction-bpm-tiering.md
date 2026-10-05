# 功能追踪：P62 低代码事务能力与 BPM 分级执行架构

> 工作区统一知识库 — 正式业务功能登记（第 46 个正式功能，XL，P0）。
> 可信度标记：CONFIRMED / REPORTED / ASSUMED / SUPERSEDED

---

## 1. 功能信息

| 字段 | 值 |
|------|-----|
| 功能编号 | P62（需求池编号；不对应 Mxx-Fyy-zz 既有明细，不改变 90 明细与 I 集合） |
| 功能名称 | 低代码事务能力与 BPM 分级执行架构（OA / MES / WMS / IoT） |
| 功能目标 | 在单应用/单 PostgreSQL、数据库持久命令队列及既有设备接缝上，使低代码用户能配置、发布并运行实时事务动作、生产轻流程、标准人工审批和后台批量；业务从表单发起到受控数据变化、流程处理、设备命令及结果回查保持正确身份、数据约束、租户权限、冻结版本和可恢复语义；运维能够定位积压、失败、台账差异和外部未知结果。分级语义：OA 可靠异步、MES 及时执行、WMS 数据一致性与 IoT 命令回执统一但可分级 |
| 创建日期 | 2026-09-30（Owner 纳入规划并要求一次下发最终目标）；2026-10-05 功能级验收 `PASSED`（规划最终复核04） |
| 当前状态 | **COMPLETED（待规划终态复核）**（终态同步回执01经复核01后 TS01/TS02 已补齐并提交 `terminal-sync-final-delivery-02.md`（TS01 登记 §3/§4 完整字段与授权值一致、TS02 三源 90 行逐 ID 对照全一致）；功能级 `PASSED` 依据 `planning-review-final-delivery-04-passed.md`；"规划已确认 COMPLETED"由后续 Planner 复核终态同步回执作出） |
| 等级 / 优先级 | XL / P0 |
| 涉及模块 | Server `sw-biz-form`（事务动作：sw_form_txn_action/invocation/reservation/ledger）、`sw-biz-bpm`（持久命令队列 sw_bpm_command/effect、分级执行、轻流程与标准审批、资源保障）、`sw-basic-iot`（设备命令与受控回执）；Web 表单设计器/事务动作台/流程设计器/待办审批/资源运维台 |

---

## 2. 方向与归档

| 项 | 路径 |
|---|---|
| 主方向（已归档 `passed/`） | `product/p62-lowcode-transaction-bpm-tiering/passed/direction-p62-lowcode-transaction-bpm-tiering.md` |
| 最终交付方向（已归档 `passed/`） | `product/p62-lowcode-transaction-bpm-tiering/passed/direction-p62-final-delivery.md` |
| 终态同步方向（留 `ready/`，Planner 终审通过后归档） | `product/p62-lowcode-transaction-bpm-tiering/ready/direction-p62-final-delivery-terminal-sync.md` |
| 功能级验收 | `product/p62-lowcode-transaction-bpm-tiering/receipts/planning-review-final-delivery-04-passed.md`（**PASSED**，2026-10-05） |
| 终态同步回执 | `product/p62-lowcode-transaction-bpm-tiering/receipts/terminal-sync-final-delivery-02.md`（01 经复核01 后补 TS01/TS02，作历史输入） |
| 子阶段归档 | 首事务 `passed/direction-p62-local-transaction-actions.md`（COMPLETED）；分级执行 `passed/direction-p62-tiered-execution-unified-command.md`（COMPLETED）；资源功能闭环 `passed/direction-p62-resource-functional-closure.md`（COMPLETED）；信息治理 `passed/direction-p62-information-governance.md`（G01—G06 PASSED） |
| 完整资源性能合同 | `ready/direction-p62-resource-assurance.md`（仅保留 Owner 延期性能合同，非当前执行任务） |

---

## 3. 正式验证集合（本功能实际涉及；三集合不互加）

| 集合 | 值 | 依据 |
|------|-----|------|
| Server 全仓 | **1757/0/0/27**（run/failure/error/skip；27 为参数手动测量门跳过，不写通过） | `receipts/evidence/final-delivery-02/server-full-gate-raw.log`（最终复核02 独立复算） |
| 定向复验（单列附加集合） | **61/0/0/0**（form 8 + process 25 + bootstrap 28；28 含守门 12 + PG 16） | `receipts/evidence/final-delivery-02/server-fd02-directed-verify-raw.log` |
| Web 四门 | **147 文件通过 + 1 跳过；1323 测试通过 + 3 跳过** | `receipts/evidence/final-delivery-02/web-four-gate-raw.log` |
| 浏览器整链（功能验收证据单列引用，不换算测试数） | 同对象两链：成功 `25ffff00…`（提交→预占→审批通过→受控确认→回查）、拒绝 `7f6dc5d8…`（提交→预占→驳回→受控释放→回查） | `receipts/evidence/final-delivery-03/`（最终复核03 核销） |

历史基线（首轮 1758/0/0/27、0.1.0 时点 1423 等）只作时点，不作为当前值、不与本集合相加。

---

## 4. 边界与留账

- **性能（A06/A07）**：Owner 2026-10-05 裁决"性能后续再说"，完整容量/时效保障未验证、Owner 延期转 P62 性能待办（`todo/p62-lowcode-transaction-bpm-tiering.md` §性能后续待办）；有限样本事实（6例独立可见 max81ms、25批项含排队 max1014ms 等）沿复核09/11 锁定，不判 8GB 资源限制为代码缺陷，不标已完成。
- **新资源策略**：默认关闭；未授权发布/部署/起停既有服务。
- **范围**：厂商实网（腾讯云、企业微信、通知五渠道）、新增部署拓扑、完整 MES/WMS 不在本功能验收内；迁移链终点 0.1.4（本轮无新增迁移），迁移版本不冒充产品发布版本（产品版本 0.1.3）。
- **计数**：正式功能数 46（45+1）；清单 90 行终态 ✅46/🟦22/⬜22 零行状态升降（与 `receipts/ig2-90-rows-mapping.md` 一致）；ADV 64、问题总记录 57；延期性能不计为确诊缺陷。功能完成数与清单完成行数为不同统计口径。

---

## 5. 交付要点（验收链摘要）

- 低代码配置→发布→运行：表单/流程设计器纯 UI 修复后全程成功（点击插入命中连线串接、边 ID 唯一、发布冻结），四视口覆盖。
- 受控事务动作：RESERVE/CONFIRM/RELEASE/ADJUST 受控调用、凭据/调用/台账全关联；成功链余额扣减预占归零 CONFIRMED，拒绝链余额不变 RELEASED、凭据可定位；结算触发主体=授权用户手工调用（生产审批命令处理器不自动结算）。
- 持久命令队列：FLOW_START/TASK_APPROVE/TASK_REJECT 命令受理/消费 COMPLETED，审批动作 command_id 关联；幂等/异载荷拒绝/恢复语义沿分级阶段锁定。
- 资源保障：准入额度/速率桶/公平领取/批量切片功能交付，默认关闭；运维画像/积压/拒绝审计可用（菜单 9106/9107）。
