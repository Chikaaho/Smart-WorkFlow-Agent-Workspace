# P60 I4 二级执行补充提示 02

> 日期：2026-09-13  
> 功能：P60 I4 / 当前交付迭代 `0.0.3`  
> 依据：`planning-review-stage-i4-v0.0.3-oa-iteration-03.md`  
> 级别：一级提示提交后仍未闭合的二级提示

## 0. 生成前诊断

| 原子项 | 分类 | 最新失败事实与原标准 |
|---|---|---|
| R1 | 证据对象不匹配 | G1c/G3b 用本租户不存在 ID 替代真实跨租户对象；不满足方向验收 1、7。 |
| R2 | 实际产品缺陷 + 缺证据 | 迁移审计实际 leader1→leader1/2 项，与任务及回执不符；终止只有声明；不满足方向 §3.3/验收 4。 |
| R3 | 实际产品缺陷 + 验收断言错误 | API 5/4、时长 0 与有权样本 4/2、非零时长不等，自验错误使用 `>=`；不满足一级提示 G2c 与方向验收 5。 |
| R4 | 缺证据 | 历史前后均为 400 参数非法，未读到历史；不满足方向 §3.5/验收 7。 |
| R5 | 实际产品缺陷 + 缺证据 | H5 无任务/表单详情，复杂意见表单转 PC；不满足方向 §3.7/验收 10。 |
| R6 | 纯报告转录错误 + 快照依赖 | terminal 有一条路径错误；若 R1—R5 改代码，当前 C/门禁/manifest 随之过期。路径错误本身不计产品失败。 |

Planner 已先纠正自身首次 SHA-256 工作目录错误：清单应从 workspace root 校验，独立复算 381/381 通过；不把该错误计入执行失败。

## 1. 元信息与替代关系

本提示替代一级提示 01，成为 I4 唯一当前执行入口；提示 01、回执 01—03 只作追溯，不同时作为执行待办。本轮精确输入为：

- `ready/direction-stage-i4-orchestration-process-operations-workbench.md`
- `receipts/planning-review-stage-i4-v0.0.3-oa-iteration-03.md`
- `receipts/planning-execution-prompt-stage-i4-v0.0.3-oa-iteration-01.md`
- 回执 03 中仅限 §2 指定的失败附件。

本提示不改变需求方向、不代写实现代码、不扩大 Git/发布授权。

## 2. 唯一剩余缺口矩阵

| 原子ID | 失败事实 | 完成条件（正向） | 必要反向断言 | 对象身份 | 最小充分证据 | 允许替代 | 下一动作 | 合法停止条件 |
|---|---|---|---|---|---|---|---|---|
| R1-cross-tenant-runtime | G1c/G3b 均以不存在 ID 替代跨租户对象。 | 隔离 PG 中建立租户 A/B 及各自真实有效部门/用户；A 经动态解析引用 B 部门、经交接引用 B 用户，均确定拒绝。 | A/B 两侧分支、任务、交接主从表、历史零增量。 | A/B、B 的真实部门 DB、真实用户 UB、两次请求键。 | 正式 service/controller 请求、响应、两侧 SQL 前后差、PG 原始输出。 | 无非零租户登录入口时可由真实服务入口测试夹具设置租户上下文；不可用 mapper-only 或不存在 ID。 | 先建双租户对象索引，再执行两条跨租户链。 | 仅隔离 PG 工具真实不可用且替代路径与独立工作穷尽，按 terminal 契约如实停止。 |
| R2-monitor-intervention | 迁移附件实际 leader1→leader1/2 项；终止未走真实链。 | O1 迁移的审计 from/to/affected 与逐任务前后完全相等；O2 TERMINATE 后实例、任务与审计一致。 | 未选任务不变；终止后办理拒绝；outsider 两动作拒绝且审计零增量。 | O1/O2、来源 U1、目标 U2、明确任务集合。 | 原始请求响应、任务/实例前后、审计行、逐字段等值断言。 | 可新建 O1/O2，不要求破坏已锁定 O；须登记替换。 | 修复迁移作用域/审计后分别实跑迁移和终止。 | 仅真实运行工具阻塞且已穷尽替代时停止。 |
| R3-analytics-exact | API 5/4 与样本 4/2 不等，API avg/P50/P90=0。 | 固定有权明细全集 A；API 发起/完成/运行/驳回、平均/P50/P90、节点停留、超时、退回驳回、工作量逐字段等于独立复算；时长、停留、驳回、工作量均有非零样本。 | outsider 汇总/穿透拒绝；不得遗漏导致“API 包含样本”假通过。 | 同一权限主体、查询时点、全集 A、统一时区/舍入口径。 | 全集响应/ID 清单、原始时间值、复算输出、API JSON、exact-equality 断言。 | 无；禁止 `>=`、覆盖关系或 0 占位。 | 先固定查询时点与全集，再修复统计并复算。 | 仅底层时钟/库真实不可控且安全等强替代穷尽时停止。 |
| R4-handover-history | before/after 均为 400，未读取历史。 | 有权入口 200 读取至少一条既有办理人与意见，交接后再次 200；规范化业务字段逐字节相等。 | 不得新增、删除、改写历史记录或意见。 | 有历史的实例 X、历史记录 HX、交接 H。 | 成功 before/after 响应、规范化 diff=0、ID 对照。 | 可换用仍可读的历史实例并登记 X→Y；400/403/空历史不可替代。 | 修正详情入口/ID 后重采成功历史。 | 仅历史对象已销毁且所有可读替代实例均不存在时，登记真实回读后停止。 |
| R5-h5-detail-opinion-form | H5 仅简单意见弹窗，任务名为“-”；复杂意见表单转 PC。 | 同一普通用户在 375px H5 查看真实任务/业务表单详情；对绑定正式意见表单的任务完成必填字段、提交终态，并在 PC/H5 回看同一任务/实例/动作；附件/外键授权回显符合方向 §3.7。 | 缺必填拒绝；无权深链零数据；不得跳桌面完成。 | 普通用户 W、任务 T、实例 X、意见表单 OF、附件/外键对象。 | 每状态截图/DOM、网络响应、表单数据、任务/实例/动作回读及 outsider 负向。 | 响应式同页可替代独立移动路由；简单 textarea、PC 跳转、静态提示不可替代。 | 补齐移动详情与动态意见表单渲染后实跑同对象链。 | 浏览器真实不可操作且修复/重启/替代浏览器均穷尽时按契约停止。 |
| R6-final-candidate-ledger | terminal 首条 evidence 不存在；R1—R5 修改会使 C 过期。 | R1—R5 关闭后固定 C2，运行实际受影响门禁；重建 workspace-root-relative SHA-256 manifest 并回读 bad=0；terminal evidence 全存在、账本一致、remaining=0。 | 任一缺口未闭合时不得写全部 COMPLETED/remaining=0；manifest 排除自身。 | C2 Server/Web HEAD、工作树内容、回执 04、evidence i4-04。 | HEAD/status/diff 清单、原始命令/cwd/exit/count、manifest 校验、路径 Validator、terminal JSON。 | 无代码变化时可引用验收 03 已锁定门禁，但必须证明 C2 内容哈希未变；否则只跑受影响集合。 | 最后执行，机械校验所有路径与账本。 | R1—R5 有真实阻塞时，R6 按 blocked terminal 如实收尾，不伪造 remaining=0。 |

## 3. 锁定项与禁止重验

- G1a/G1b、G2a、G3a、G4a、G5a/G5b、G6a 已锁定；证据指针见验收 03 §3 与 `evidence/i4-03/http/asserts-g1.json`、`asserts-g2.json`、`asserts-g3.json`、`asserts-g5.json`。
- G1c 的空/缺负责人/失效/重复/超上限、G2b 的七条件/挂起/恢复/无权、G3b 的两任务/代理/重试、G4b 的简单提交/PC 已办/深链拒绝继续锁定。
- 只有 R1—R5 的代码变化触及上述路径时，才复验对应受影响断言；不得重跑无关完整业务包。
- P58、I1—I3 和 I3 已锁定 IoT 6 例环境性非回归禁止重验。

## 4. 对象与生命周期

执行前建立 `object-index`：A/B 两租户与 DB/UB、O1/O2、全集 A、历史实例/记录、W/T/X/OF、C2。场景开始前建立只读采集点，完成后再清理；持久库只清本轮固定 ID 并回读，纯内存环境记录 JDBC/进程身份与端口关闭。替换销毁对象须登记旧→新映射。证据包不得保存可用凭据。

## 5. 读取 / 修改 / 命令范围及顺序

| 维度 | 内容 |
|---|---|
| 允许读取 | I4 方向、验收 03、本提示、一级提示；失败附件 `g2c-*`、`g2b-intervene-transfer.json`、`g2b-o-interventions.json`、`g3b-x-history-*`、G4b 六图和 terminal；对应实现/工程配置。 |
| 允许修改 | 仅 R1—R5 确证缺陷涉及的 Server/Web 代码、测试/采集资产、新 evidence 包和回执 04；可修正新回执 terminal 路径；不得改历史审查/附件和正式状态。 |
| 允许命令 | 隔离 PG/H2、真实 HTTP/浏览器、精确 SQL 前后差、受影响测试/Web 四门、秘密复扫、SHA-256 生成校验、terminal 路径/账本 Validator。 |
| 执行顺序 | 建索引 → R1 → R2 → R3 → R4 → R5 → 秘密复扫 → 冻结 C2 → 受影响门禁 → manifest → terminal 自检 → 回执 04。互不写同一对象的采集可并行。 |
| 禁止事项 | 不存在 ID、400 响应、`>=`、简单意见或桌面跳转等近似证据；改方向/终态；扩大 I5/I6；删除失败输出；伪造全通过。 |

## 6. 相对上一版变化

- **删除**：移除一级提示中已经通过的全部原子项和重复实现摘要。
- **原子化**：剩余收敛为真实跨租户、干预审计、分析等值、交接历史、H5 正式意见表单、最终候选账本六项。
- **替代路径**：真实双租户对象替代占位 ID；成功历史详情替代 400；全集 exact-equality 替代包含关系；响应式完整交互替代桌面引导。
- **提交判定**：R1—R5 正反向附件逐项成立后才执行 R6；路径存在性、账本、哈希和门禁均由工具回读。

## 7. 原始输出字段与证据包格式

每项回执只写：`原子ID → 原始文件/位置 → 实际结果 → 边界`。原始流单独存 `receipts/evidence/i4-04/`，并标注证据层级。

- R1：tenantId、真实 dept/user ID、请求租户、响应码、四类表 before/after count/hash。
- R2：instance/task ID、from/to、affectedTasks、before/after status、audit count、outsider delta。
- R3：查询时点、全集 ID 数、每个指标 API/recompute/delta、舍入规则、权限响应。
- R4：HTTP status、history ID、handler/opinion 规范化 hash、diff exit。
- R5：viewport、URL、user/task/instance/form ID、命令终态、动作数、附件/外键权限结果。
- R6：cwd、HEAD/status、命令文本、exit、精确测试计数、manifest entries/bad、自身排除、missing evidence count、terminal remaining。

## 8. 提交前核对矩阵

- [ ] R1 使用真实存在的另一租户对象，且两侧零增量？
- [ ] R2 审计逐字段等于实际迁移，终止链与 outsider 反向成立？
- [ ] R3 全集与 API 逐字段 exact-equality，非零样本未被 0 代替？
- [ ] R4 前后都是成功历史响应且业务字段 diff=0？
- [ ] R5 H5 内完成详情、正式意见表单、附件/外键回显和结果回看？
- [ ] C2 门禁属于最后快照，manifest 工具回读 bad=0？
- [ ] terminal 全部 evidence 路径存在，账本与附件一致，无描述性 DONE？
- [ ] 剩余可执行项为 0，或真实阻塞已按契约登记？

## 9. 合法终态与下一回执

下一回执固定为：

`product/v0.1.0-oa-completion/receipts/stage-i4-v0.0.3-oa-iteration-04.md`

账本沿用 terminal contract，不另造 schema。有授权内可执行项须继续；只有工具真实限制且替代路径与独立工作穷尽才可按契约停止。Executor 不得写 `PASSED/COMPLETED` 或进入阶段三；提交状态保持 `VERIFYING / EXECUTION_SUBMITTED`。
