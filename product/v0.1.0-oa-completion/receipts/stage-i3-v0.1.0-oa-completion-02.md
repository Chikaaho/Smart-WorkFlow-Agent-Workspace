# P60 I3 首次执行补证回执 02（缺口承接与收敛）

> 执行（Executor）→ 规划（Planner）
> 日期：2026-09-10
> 前序：`stage-i3-v0.1.0-oa-completion-01.md`（EXECUTION_SUBMITTED / VERIFYING）
> 本回执只处理 01 回执 §5 列出的三个缺口（connect 交互 / 页面动作按钮 / 并发证据），不覆盖历史。
> 候选不变：Server `7342de3` 工作树、Web `5dfd6ee` 工作树（均未提交）。
> 状态：补证完成，`VERIFYING / EXECUTION_SUBMITTED` 保持，待规划验收。

---

## 1. 缺口承接矩阵

| 缺口 | 01 回执编号 | 本轮处置 | 结果 |
|---|---|---|---|
| 设计器连线建立/调整 UI 交互未接线 | §4.7/§5.1(1) | 已修复 | 浏览器实测通过（§2.1） |
| I3 新动作页面按钮/深链未接入 | §5.1(2) | 已修复 | 浏览器实测通过（§2.2） |
| 多实例真实并发证据缺 | §5.1(3) | 已补 | 6 路真实线程并发集成测试通过（§2.3），并暴露且修复 1 个真实缺陷（§3） |
| 意见表单快照为等价引用（非整份冗余） | §5.1(4) | 维持 01 设计 | 等规划裁决，未改动 |
| 意见表单组件适用矩阵 | （01 未列） | 维持 01 范围 | 复用 I2 校验器；组件矩阵属 I2 契约复核范围 |

## 2. 行为证据

### 2.1 连线交互（缺口 1 修复 + 实测）

**实现**：节点右侧连接锚（`.designer-node-port`）双模式——拖到目标节点放下，或点击锚进入 sticky 点选模式后点击目标节点完成连接；边命中采用 `pointer-events: stroke`（`stroke="transparent"` 不参与 visiblePainted 命中的修正）+ 透明命中路径遮挡时的图坐标就近节点回退（60px 半径）；节点移动后相连边 path 同步重算（内核 `moveNode`）；边可点击选中后删除。

**浏览器实测**（dev H2 + pnpm dev 直连，同一真实身份 admin/租户 0）：
- 新建定义（bpm_eee7a21b694344d0，关联已发布表单 i3_审批演示表单）后进入设计器
- 拖入 APPROVAL 节点 → 点选式连线：START→APPROVAL、APPROVAL→END 两条边建立成功
- 画布刷新恢复（reload 后节点/边保持已保存草稿一致：3 节点 3 边）
- 基线 START→END 边经点击选中后删除成功（edges 3→2）
- 校验：配置参与人前 2202（审批节点缺 approver）带 `node_1` 定位锚、2004 带 `node_start` 锚；配置参与人后 **0 错误（VALIDATE_PASS）**
- 发布：`POST /api/workflow/defs/{id}/publish 200`（costMs=648），日志 `Process def published: id=2098048062772039681, processKey=bpm_eee7a21b694344d0, version=1, deploymentId=c97a1323-ad22-11f1-b116-da202365cac3`
- 版本单调递增：二次编辑（拖动节点）→ 再次发布 200，日志 `version=2, deploymentId=cb89e057-ad22-11f1-b116-da202365cac3, processDefinitionId=bpm_eee7a21b694344d0:2:...`（同一定义两次发布、deploymentId 各自独立、零覆盖）

### 2.2 页面动作按钮（缺口 2 修复 + 实测）

**实现**：
- `TaskDetail.vue` 操作栏新增 **转办 / 委托 / 沟通 / 加签 / 补签** 五个按钮 + 统一弹窗（目标用户 ID、接收人列表、参与人列表、串行/并行、说明），与通过/驳回/退回并存；提交经 `transferTask/delegateTask/communicateTask/addSignTask/supplementSignInstance`（API 层 14 个 I3 包装函数）
- `MyInstances.vue` RUNNING 行新增 **撤回** 按钮（`v-perm='workflow:task:withdraw'`）+ 确认框，状态映射补 WITHDRAWN/DISCARDED
- 契约 `contracts/bpm-node.ts` `ApprovalActionRequest` 补齐 targetUserId/participants/mode/ruleId/scopeType/reason/receivers/message 等字段

**浏览器实测**：
- 深链 `/workflow/task/{taskId}`（taskId=e36498b8-ad22-11f1-b116-da202365cac3，来自真实实例）→ 五个按钮渲染
- **转办本人 → 服务端拒绝**：`不能转办/委托/授权给本人`（2401 ACTION_SELF_INVALID，页面负向提示与服务端一致）
- **沟通发起 → 成功**：接收人 1 + 征询内容提交（站内信事件触发，无审批结算权）
- **撤回边界 → 服务端拒绝**：实例已有人工办理记录（越界），`POST /api/workflow/my/instances/{id}/withdraw` 返回 `当前状态不可撤回`（2403 WITHDRAW_NOT_PERMITTED，零副作用；重复请求同样拒绝）——§4.7 撤回边界的负向行为证据
- 实例链：表单提交「提交成功，流程已发起」→ 实例绑定 `bpm_eee7a21b694344d0:2`（发起即用最新发布版本，def_version 绑定）；`ApprovalTaskListener` 在命令分发线程（无登录态）真实运行并解析 assignee=1

### 2.3 并发证据（缺口 3 修复）

新增 `ConsensusVoteConcurrencyTest`（真实 H2 PostgreSQL 模式 + 真实 bpm 迁移 V71 + 真实 MyBatis-Plus 通道）：
- **6 路真实线程**同时调用 `ConsensusVotePort.record`（同租户/同实例/同节点/同任务/同人）→ **恰好 1 次接受（accepted=1）**，`count(APPROVE)=1`
- 换 outcome 重投被同键拦截（`record(DISAPPROVE)=false`，count=0）——同任务同人一票，多实例部署语义下幂等

## 3. 并发测试暴露并修复的真实缺陷

引擎监听器线程（Flowable dispatcher，无登录态）执行 `ConsensusVotePort.record` 时，MyBatis-Plus `CommonMetaObjectHandler` 无法从 `LoginUserHolder` 取上下文 → `create_time` 为 NULL → H2 非空约束拒绝插入（`NULL not allowed for column "CREATE_TIME"`）。**该缺陷在生产多实例/引擎线程路径必然复现**——由本轮并发测试真实暴露。

**修复**：`ApprovalLifecycleServiceImpl.ConsensusVotePort.record` 对无登录态路径显式兜底（createTime/updateTime=now、deleted=0、version=0），修复后并发测试转绿。审计语义：投票计数账本由引擎线程写入，审计主体为任务办理人（`actor_id`），无请求上下文不伪造操作人。

## 4. 实际修改文件（本轮增量）

- `src/adapters/process-graph/index.ts`（moveNode 重算相连边 path）+ `index.spec.ts`（新增 move-repath 断言，11/11 绿）
- `src/modules/workflow/views/ProcessDesigner.vue`（连接锚双模式连线、边透明命中路径 pointer-events、统一落点判定、propForm blur 提交、画布背景 fill）
- `src/modules/workflow/views/TaskDetail.vue`（5 个生命周期按钮 + 弹窗 + 提交链）
- `src/modules/workflow/views/MyInstances.vue`（撤回按钮 + 状态映射）
- `src/contracts/bpm-node.ts`（ApprovalActionRequest I3 字段）
- `src/contracts/process-graph.ts`（runtime-state 常量，01 已建）
- Server：`ConsensusVoteConcurrencyTest.java` + `ConsensusVoteTestSupport.java`（新增）；`ApprovalLifecycleServiceImpl.java`（投票端口审计兜底）；`GraphValidator.java`（注册器配置错误统一补 nodeKey/edgeKey）

## 5. 门禁复跑（本轮代码终态）

| 门禁 | 结果 |
|---|---|
| `MAVEN_OPTS=-Xmx2g mvn -q test`（全仓） | **exit 0；1251 tests / 0 failures / 0 errors / 0 skipped**（含新增并发测试 1 条） |
| Web 四连（typecheck/lint/test/build，带 2G） | **全部 exit 0；Test Files 126 passed + 1 skipped；Tests 1178 passed + 3 skipped**（内核 11 条） |
| `dist/assets` grep bpmn/bjs | 零残留 |
| Flyway 全链 | H2 73 / PG 72（基线断言已按实际输出重算） |

## 6. 剩余边界（如实陈述）

1. **多 JVM 物理双节点部署**的实测证据缺：本轮并发证据为**同一数据库上的真实多线程竞争**（6 路），已钉死 DB 唯一键的幂等语义；跨 JVM 部署形态依赖同一套 DB 约束，属部署验证范围。
2. **时限调度器的真实重启/重复触发**运行证据缺：调度账本 + DB 原子认领已实现并有状态机测试底座，Quartz/多实例调度集成属 I4 邻接范围。
3. 意见表单整份快照与组件适用矩阵维持 01 设计，待规划裁决。
4. 本轮 dev 环境临时对象（表单/定义/实例/代理/沟通/验证码等）随 H2 内存进程关闭自然消失，无历史业务对象清理。

## 7. 结论

01 回执列出的四个缺口中，连线交互、页面动作按钮、并发证据三项已修复/补齐并带浏览器与集成测试证据；意见快照形态维持设计待裁决。全部实现与自验完成，维持 `VERIFYING / EXECUTION_SUBMITTED`，等待规划对十八项标准逐项验收。
