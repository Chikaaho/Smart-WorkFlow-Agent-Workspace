# P63：MES 前置能力——动态并行审批与一次性预约 IoT 下发

2026-10-06；角色：Planner；来源：Owner 本轮需求。等级：L（跨表单、流程、组织、IoT、调度与权限边界；探索若发现核心架构演进再升级）。状态：**COMPLETED（待规划终态复核，2026-10-08 阶段三同步）**；功能级 PASSED=规划审查10（20/20、A01—A10 通过（10/10）、业务缺口0）。正式产品合同：`product/p63-mes-workflow-foundations/passed/direction-p63-mes-workflow-foundations.md`。

## 1. 目标与场景依据

为 Owner 指定的 README 第一个示例准备可配置、可追踪的公共能力，形成“表单选择参与对象及预约时间 → 动态并行审批 → 流程成功结束 → 创建一次性 IoT 预约 → 到点下发 → 结果回查”的最小业务链。

可读原始场景见 `todo/ch-apaas-project-update.md` §3.1：科技部发起多部门灾备演练，经技术负责人、各部门分管领导及总公司科技部会签后抄送；按表单预定时间通过 MQTT 关闭机房电源、触发火警告警。本轮以 Owner 明确的两项基础能力为范围；本次探索已确认首例在Server/Web README，根README无业务示例；见探索回执Q1。原始示例中的分管领导与本轮“部门默认负责人”不能暗中混为同一组织身份，具体示例映射在场景配置时说明。

## 2. Owner 已确定的需求

| ID | 产品要求 |
|---|---|
| R01 | 流程设计器提供动态并行节点；若现有同义节点已存在，应补齐其配置和可用性。根据实际表单值决定分支数量。 |
| R02 | 来源支持表单表格中的部门组件、人员组件，以及多选部门、多选人员；同时核实主表单与表格单元格中的单选/多选组合，不能只支持手写变量或固定人员数组。 |
| R03 | 选择人员则由所选人员审批；选择部门则默认解析该部门负责人。 |
| R04 | 部门/人员选择能力扩展到全部审批节点，包含普通审批、会签及动态并行分支内审批；通过探索列出全部实际节点与配置入口，不能只改一个面板。 |
| R05 | 流程结束后可创建一次性定时 IoT 事件，到预约时间下发。预约记录、实际下发及执行结果可查询并关联原流程。 |
| R06 | Owner追加：普通手工配置的并行分支场景必须保持，设计不得破坏其结构、执行与汇聚语义及存量流程兼容。 |

## 3. 探索结论与正式裁决

探索回执：`search_fallback/p63-mes-workflow-foundations-readiness-20261006.md` 及附件；规划复核：`product/p63-mes-workflow-foundations/receipts/planning-review-readiness-01.md`。本次为静态探索与历史证据核对，不代表新功能已运行通过。

- 现有动态节点为部门负责人并行多实例，前端缺专属配置；表格列与多选人员/部门未形成完整链，属于本轮实质增量。
- 普通审批/会签已有参与人注册表，动态节点仍自行解析；本轮收敛权威组织解析口径。
- 同事务IoT意图及命令/回执链可复用，未来一次性预约、到点处理和取消/迟到语义待新增。
- 普通手工并行保留其手工节点/连线/多节点路径和汇聚，与新增动态审批可以组合；不得转换存量图或要求重建。
- 新动态定义按人员ID或部门ID去重，表格重复对象保留来源行；同负责人不同部门仍独立审批。新轮次重新解析，同轮冻结；旧定义及实例继续原语义。
- 预约限成功完成，时间与时区冻结；审批晚于预约时刻记过期。已创建预约允许迟到默认60秒、可配置1—3600秒；它是业务有效期，不是SLA。待触发可取消，未知结果不自动重发。

原登记中的待裁决默认项由正式方向覆盖。完整产品合同、范围、风险及A01—A10验收见 `product/p63-mes-workflow-foundations/passed/direction-p63-mes-workflow-foundations.md`；实现步骤与测试设计由Executor制定。

## 4. 范围与下一动作

本轮交付两项公共基础能力及最小关联链，并保留普通手工并行。完整MES、温度Agent、周期预约、真实机房动作、部署及P62延期性能不在本轮范围。

功能级验收 PASSED（`product/p63-mes-workflow-foundations/receipts/planning-review-completion-10-passed.md`，20/20、A01—A10 全部通过（10/10）、业务缺口0）；阶段三终态同步已完成并提交 `product/p63-mes-workflow-foundations/receipts/terminal-sync-p63-mes-workflow-foundations-01.md`（附件 `receipts/evidence/terminal-sync-01/`）。业务补充提示 01—09 全部结清，仅历史引用。

**唯一下一动作 = Planner 复核 `terminal-sync-p63-mes-workflow-foundations-01.md` 并确认 P63 整体 COMPLETED**；终态方向 `product/p63-mes-workflow-foundations/ready/direction-p63-mes-workflow-foundations-terminal-sync.md` 经复核通过后归档 `passed/`。

计数与验证：正式功能 **47**（46+P63 整体1，P63 为第47个登记）；清单 ✅46/🟦22/⬜22=90 零行升降、ADV64、问题57（起始历史基线）、其他 P/明细状态不变。正式验证集合 VB01—VB04：Web `2b0c660` 四门 exit0（1365+3 测试/79 warning）；Server iot 63/0、engine 76/0、process 266/0；20 原子行为基线；追加迁移 V0.1.5/V0.1.6/R__p63（链终点 0.1.6）。本轮仅文档同步，不重跑业务/门禁，不进入发布部署。

P62 批准功能范围 COMPLETED（规划已确认，2026-10-06；46 为 P62 验收时点值，当前项目总数统一 47）；性能 Owner 延期未验证、新资源策略关闭；完整 MES、分管领导组织模型、厂商实网和部署边界保持。
