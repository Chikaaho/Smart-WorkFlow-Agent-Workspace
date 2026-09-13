# P60 I4 三级执行补充提示 03

> 日期：2026-09-13  
> 功能：P60 I4 / 当前交付迭代 `0.0.3`  
> 依据：`planning-review-stage-i4-v0.0.3-oa-iteration-04.md`  
> 级别：二级提示提交后仍未闭合的三级提示

## 0. 生成前诊断

| 原子项 | 分类 | 最新事实 |
|---|---|---|
| R1 | 证据环境不匹配 | 正式服务入口双租户测试实际为 H2，不是指定 PostgreSQL。 |
| R2 | 缺反向行为证据 | 没有未选任务；outsider 测的是 SUSPEND 而非 TERMINATE。 |
| R3 | 缺样本 + 报告转录错误 | exact-equality 已成立，但驳回/超时/退回样本为零；正文时长与附件不同。 |
| R5 | 实际产品缺陷 + 缺证据 | 375px 结果查询和拒绝页布局不可用；外键只有原始 ID；附件未覆盖。 |
| R6 | 报告转录错误 + 终态错误 | manifest 实际 209 项而非 206；未闭合仍 remaining=0。 |

## 1. 元信息与替代关系

本提示替代二级提示 02，作为 I4 唯一当前执行入口；更早提示/回执仅作证据指针。本轮输入仅为 I4 正式方向、验收 04、本提示，以及下列各独立包指定的 iteration-04 附件。提示不改变产品方向、实现权限或发布边界。

## 2. 唯一剩余原子账本

| 原子ID | 正向目标断言 | 反向零残留断言 | 对象身份 | 唯一可接受证据 | 不可接受证据 | 下一动作 | 合法停止 |
|---|---|---|---|---|---|---|---|
| R1-cross-tenant-runtime | 在真实 PostgreSQL 数据库建立两个租户及真实部门/用户；租户 B 同租户正向命中，租户 A 经正式动态解析与交接 service entry 引用 B 对象时确定拒绝。 | A/B 两侧分支、任务、交接主从表、历史均无越界增量。 | PG 数据库指纹、租户 A/B、DB/UB、请求键。 | PostgreSQL JDBC/版本原始输出、正式 service entry 2 条正反向结果、两侧 SQL 前后差、测试 exit/count。 | H2/PG-mode、mapper-only、只引用旧表级 PG 测试、不存在 ID。 | 将 iteration-04 R1 测试原样迁至真实 PG 运行并采集。 | 内嵌/本机 PG 均真实启动失败且替代穷尽，保留原始错误后按契约停止。 |
| R2-monitor-intervention | 新建 O3，至少 3 条任务中只选择一部分迁移；审计与所选任务逐项一致，未选任务保持原办理人。outsider 对同一实例执行 TERMINATE 被拒绝。 | outsider 前后实例/任务/审计计数不变；未选任务不迁移、不新增审计。 | O3、T1/T2/T3、所选集合 S、outsider。 | 一份同对象 HTTP/SQL 包：选择请求、逐任务前后、审计前后、outsider TERMINATE 请求及零差。 | O1 仅两任务全迁、SUSPEND 替代 TERMINATE、ServiceTest 声明。 | 只补未选任务与无权终止两个反向场景。 | 真实 HTTP 服务无法恢复且替代工具穷尽时停止。 |
| R3-analytics-exact | 固定有权全集 A2 至少含 APPROVED、RUNNING、REJECTED、TERMINATED，并产生可判定超时与退回/驳回样本；API 的全指标逐字段等于独立复算，驳回、超时/超期、退回/驳回相关值非零。 | outsider 汇总/穿透拒绝；全集 ID 无遗漏；所有 delta=0。 | 同一 admin、查询时点、A2、统一时区/舍入口径。 | 全集清单、每实例原始历史/时限/动作、复算输出、API、逐字段 delta 表、outsider 响应。 | rejected=0、无超时字段、以 TERMINATED 替代 REJECTED、只证明时长/节点/工作量。 | 新增最小 REJECTED 与超时/退回样本后重采全集。 | 时限调度工具真实不可运行且安全替代穷尽时停止。 |
| R5-h5-detail-opinion-form | 375px 下可用地完成已办结果查询与无权拒绝反馈，无页面主体横向溢出；外键显示授权后的可读关联对象信息；真实附件完成有权回显。 | 无权外键/附件不可见且无数据泄漏；同一任务/实例/动作保持一致。 | W、outsider、T/X、外键对象 FK、附件 ATT。 | 375px 全页截图+DOM 尺寸断言（scrollWidth<=clientWidth 或明确局部横滚边界）、网络响应、FK 可读字段、ATT 元数据/下载授权正反向。 | 缩放桌面页、全页横向滚动、原始 UUID 当作外键回显、无附件对象。 | 修复移动已办/拒绝页响应式并补 FK/ATT 授权链。 | 浏览器工具恢复与替代浏览器均失败且已穷尽时停止。 |
| R6-final-candidate-ledger | R1/R2/R3/R5 全部通过后冻结 C3；受影响门禁通过；重建 manifest 并以工具实际项数回读；terminal 路径全存在且 remaining=0。 | manifest 排除自身、bad/missing=0；正文/附件/terminal 计数逐字一致。 | C3、evidence i4-05、回执 05。 | 候选指纹、受影响原始门禁、manifest 工具统计、路径/账本 Validator、terminal JSON。 | 手抄 206、沿用改码前候选、缺口未闭合却全部 COMPLETED。 | 最后机械收尾。 | 前四项真实 BLOCKED 时按契约保留非零剩余，不伪造完成。 |

## 3. 每缺口独立证据包

三级提示要求每个缺口单独封装，互不以另一包的摘要代替：

- `evidence/i4-05/R1/`：`object-index.json`、`pg-runtime.txt`、service-entry 原始输出、两租户 before/after、`asserts.json`。
- `evidence/i4-05/R2/`：O3/T1—T3 索引、选择迁移 HTTP、任务/审计前后、outsider TERMINATE、`asserts.json`。
- `evidence/i4-05/R3/`：A2 全集、raw history/deadline/action、API、recompute、delta、权限负向、`asserts.json`。
- `evidence/i4-05/R5/`：截图/DOM 尺寸、FK/ATT 正反向 HTTP、任务/实例/动作回读、`asserts.json`。
- `evidence/i4-05/R6/`：candidate、gates、manifest/verify、path-validator、terminal-validator。

每包 README 只写：`原子ID → 原始位置 → 实际结果 → 边界`。原始 stdout/stderr 单独保存；不得复制为声明性长文。

## 4. 锁定项与禁止重验

- R4 完整锁定；R2 分组审计和管理员终止正向、R3 非零时长/节点/工作量等值、R5 H5 详情/正式意见表单/必填拒绝锁定。
- 验收 03/04 所列其余通过项继续锁定。仅当本轮修改直接触及其依赖路径时，才跑对应受影响回归。
- 禁止重验 P58、I1—I3、I3 IoT 6 例环境性非回归，禁止扩展 I5/I6。

## 5. 对象与生命周期

场景前固定 PG/A/B/DB/UB、O3/T1—T3/S、A2、W/outsider/FK/ATT、C3；先建采集点后执行，最后只清理固定 ID 并回读。浏览器证据记录 viewport/clientWidth/scrollWidth。证据中不保存凭据。替换对象必须登记旧→新。

## 6. 读取 / 修改 / 命令范围与顺序

| 维度 | 内容 |
|---|---|
| 允许读取 | 正式方向、验收 04、本提示；iteration-04 的 R1 log、asserts-r2/r3/r5、R3 fullset/recompute/API、R5 五图与相关 HTTP；对应实现/配置。 |
| 允许修改 | 仅 R1/R2/R3/R5 涉及代码、测试/采集资产、i4-05 证据和回执 05；不得修改历史审查/附件、正式状态。 |
| 允许命令 | 真实 PG、HTTP/SQL、浏览器、DOM 尺寸检查、受影响门禁、秘密扫描、SHA-256、terminal Validator。 |
| 顺序 | 建四包对象 → R1 → R2 → R3 → R5 → 各包自检 → 冻结 C3 → 门禁 → R6 → 回执。独立环境可并行，不共写对象。 |
| 禁止 | H2 替 PG、近似动作/对象、零样本、不可用缩放页、原始 ID 替可读回显、删失败输出、改方向/终态。 |

## 7. 相对二级提示的变化

- 删除已通过 R4，并锁定 R2/R3/R5 的已通过子行为。
- 将每个剩余缺口拆成独立证据包，明确正向目标与反向零残留。
- 对本轮出现的四类替代逐一禁止：H2、全迁任务、零驳回样本、缩放桌面页。
- 全部包自检为“是”后才允许执行 R6；否则继续或按真实阻塞终态提交。

## 8. 全部为“是”才允许提交

- [ ] R1 原始 JDBC 明确为 PostgreSQL，真实跨租户对象经两个正式入口拒绝且双侧零增量？
- [ ] R2 至少一项未选任务保持不变，outsider 实际调用 TERMINATE 且零写入？
- [ ] R3 REJECTED、超时、退回/驳回样本非零，全指标 API=recompute 且 delta=0？
- [ ] R5 375px 已办与拒绝页可用无主体横溢，FK 可读回显、ATT 正反向授权成立？
- [ ] 五个独立包路径/对象/断言一致，秘密扫描无可用凭据？
- [ ] C3 属于最后代码快照，受影响门禁通过，manifest 实际计数/校验与正文一致？
- [ ] terminal evidence 全存在，work_items 与剩余事实一致？

## 9. 合法终态

下一回执固定为：

`product/v0.1.0-oa-completion/receipts/stage-i4-v0.0.3-oa-iteration-05.md`

状态保持 `VERIFYING / EXECUTION_SUBMITTED`。存在可执行项必须继续；工具真实限制和替代路径均穷尽时才可按 terminal contract 报告 BLOCKED。Executor 不得写功能级 `PASSED/COMPLETED`、不得进入阶段三。
