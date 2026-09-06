# P4 首轮审查 G1—G8 补证回执（自验通过，待规划复验）

日期：2026-09-05；角色：执行；承接：`planning-review-p4-01.md` 唯一剩余差异表。
本轮新增修复与证据逐 G 列示；原始输出见 `evidence/` 目录（§H）。**不覆盖首次回执。**

## 本轮新增实现修复（审查疑点证实项）

| # | 修复 | 位置 |
|---|---|---|
| F1 | G5 疑点证实并修复：P0 同步在事务内等待导致受理对消费者不可见。受理移入独立事务（`DraftSubmitService` @Transactional；命令端点去除 controller 级事务），等待在事务外发生 | `service/DraftSubmitService.java`（新增）、`BpmCommandController`、`BpmDraftController` |
| F2 | G6 疑点证实并修复：V51 原默认授予 role_id=2（管理员）违反 D2。已改为仅注册权限、不向任何角色默认发放（含注释声明）；superAdmin 短路为平台既有语义而非默认发放 | `bpm/{h2,postgresql}/V51__p4_p0_dispatch_permission.sql`（重写） |
| F3 | 真实测试暴露：命令受理未把 action 写入 payload，异步 REJECT 被消费端按默认 APPROVE 执行（首轮浏览器驳回后实例误为 APPROVED）。修复后端到端复验：REJECT 命令→实例 REJECTED→已办 REJECT/ACTION→待办清零 | `CommandAcceptService.toPayload` |
| F4 | 真实运行暴露：草稿 payload 被双重 JSON 编号（前端字符串再序列化），提交时解析失败。修复为字符串 payload 视为已序列化（readTree 校验后原样存储） | `BpmDraftController.toJson` |
| F5 | 真实运行暴露：空列表时 StandardListTemplate 不渲染默认插槽，`el-dialog` 永不挂载（新建草稿/详情弹窗在空态不可用）。弹窗移出列表模板（多根节点） | `MyDrafts.vue`、`MyInstances.vue` |
| F6 | 真实运行暴露：业务错误提示退化为"业务错误(400)"——HTTP 200 业务错误只读 `message` 未读后端 R 的 `msg`。修复后浏览器实测提示为"所选流程不可用或已停用，请重新选择流程后提交" | `foundation/request/index.ts` |
| F7 | 真实运行暴露：草稿表单/流程候选为页面常量，真实环境无选项。改为从 `/form/def/page`、`/workflow/defs` 加载 PUBLISHED 集合（失败时可手输 formKey） | `MyDrafts.vue` |
| F8 | 真实环境菜单缺失：三入口只注册在前端 mock seeds，真实后端菜单来自 sys_menu。新增 V53 迁移注册 id=24/25/26（我发起的/我的草稿/我的已办，挂流程引擎目录，不 seed role_menu） | `db/migration/{postgresql,h2}/V53__p4_personal_center_menus.sql` |

## 逐 G 编号证据

### G1（A1/A2/A4/A6/C1）真实浏览器闭环 — 已关闭
环境：本地 dev 后端（H2，`Started StarterApplication`，`命令调度器已启动: normalPoll=500ms, p0Poll=100ms`）、前端 `pnpm dev`（localhost:5173）、正式登录（admin/admin123 + 图形验证码，浏览器实际输入）。
浏览器实际操作链（关键服务端日志为原样行，全部在 `evidence/backend-dev-lastrun-full.log` 及会话记录）：
1. **我的草稿**：新建对话框（截图）→ 填标题/选择 p4_expense/流程 bpm_77a96ef97bee4d9b/payload `{"title":"G1闭环测试报销","amount":128}` → 保存。列表行：`G1闭环测试 p4_expense … 编辑中`。
2. **持久化恢复**：F5 刷新后行仍在（`持久化恢复 ✓`）；`GET /api/workflow/drafts 200`。
3. **提交**：确认框→受理 `POST /workflow/drafts/…/submit 200`；运行日志：`命令已受理: commandId=2096097916733865985, type=DRAFT_SUBMIT, channel=NORMAL, key=DRAFT_SUBMIT:2096097783908646913:1` → `命令处理完成: … 耗时 27ms`；随后自动受理 `FLOW_START:9dea054d…` → `命令处理完成: … 132ms`。行状态转**已提交**；重复提交同一草稿返回**同一 commandId、duplicated=true**（curl 原样响应在回执记录）。
4. **我发起的**：列表出现实例 `9dea054d-… p4_expense 进行中`；详情对话框显示当前进度 `主管审批 a1 办理人 1 任务编号 ee1417ca-…`、流转记录空（未到终态）——普通用户入口，无管理权限。
5. **待办/审批**：`/workflow/todo` 出现同任务；点击通过→确认框→`POST /workflow/commands/tasks/{taskId}/complete`（异步受理）→轮询 COMPLETED→**任务从待办消失**；实例转**已通过**。
6. **我的已办**：1 条记录 `动作=通过（APPROVE）办理时间 2026-09-05T12:51:51 实例状态=已通过 来源=ACTION`（截图）。
7. 失败/删除路径：删除走 confirm+幂等接口；失败路径见 G2（提交校验拒绝、消费失败重试→FAILED→修正恢复）。

### G2（A3）版本/绑定失效与恢复 — 已关闭
- 后端校验（单测+实测）：未选流程/绑定失效/版本不一致均拒绝且**草稿保留**（状态不变、不 enqueue）；重复提交返回同一受理；SUBMITTING 冻结（改/删被拒）。
- 真实浏览器链：失效绑定草稿提交→界面明确提示 **"所选流程不可用或已停用，请重新选择流程后提交"**（F6 修复后实测 alert 原文）→行保留编辑中→UI 编辑**重选真实流程**→保存→再次提交→**已提交 ✓**。
- 消费失败恢复：真实触发（表单定义列不一致导致 INSERT 失败）→有界重试日志 `命令将重试: retry=3, 退避 4000ms … retry=4, 退避 8000ms`→FAILED 终态→草稿转 FAILED（内容保留、lastError 可见）→定义修正后 UI 编辑保存（FAILED→EDITING）→提交成功。全程**未重复落表单数据**（幂等键 `DRAFT_SUBMIT:{id}:{seq}`；curl 读回 payload 单份）。
- 快照稳定：受理中（SUBMITTING）修改/删除被拒（单测 FrozenTests）。

### G3（A4/A5）办理归属与取消 — 部分关闭 + 精确披露
- 真实运行：F5 修复后异步 同意/驳回/退回（REJECT 路径经 F3 修复）→实例终态正确（APPROVED / REJECTED，原样读回：`d9b5bde5 REJECTED`、已办 `REJECT REJECTED`）、待办清零、会签/取消既有语义未改。
- 已办 D4：办理动作记录为权威（`ACTION` 来源）；本轮 H2 环境为全新库，**无 P4 之前的既有历史数据，HISTORY_COMPAT 兼容展示为空集**——兼容路径由单测覆盖（source=HISTORY_COMPAT 分支），既有历史兼容范围如实披露为"本轮环境无存量数据可验"。
- **未办理被取消的任务不伪装已办**：结构上取消（REJECT→terminateProcess）不产生本人动作记录，不入 ACTION；因当前产品无管理端终止接口、单节点流程无法构造"未办理即被取消"的运行场景，该点披露为待具备两节点/终止能力后补运行验证。

### G4（A7/B4）可靠性/并发 — 已关闭（隔离持久环境）
`CommandQueueIntegrationTest`（真实 H2+真实迁移+真实持久化队列+真实调度车道，5 条）+ `CommandDispatcherP0PriorityTest`（2 条）：
- 提交边界：事务未提交时**独立线程消费者不可见、无业务效果**；提交后才领取（时间戳断言 acceptCommitted ≤ consumed）。
- 重复投递：同 command_key 仅受理一次（DuplicateKey），重复消费效果恰 1。
- 消费中断/重启：claimed 未确认→stale 回收→重投递→幂等 handler 效果恰 1。
- 双消费者竞争领取：5 命令两消费者总效果=5（无重复无丢失）。
- 同实例 NORMAL/P0：真实积压（2 PROCESSING 占用+3 PENDING）下 P0 先处理且 NORMAL 随后推进（时间线断言）。
- 调度启动证据：运行日志 `命令调度器已启动: normalPoll=500ms, p0Poll=100ms, batch=20, p0Batch=5, maxRetries=5`。
- 上下文清理：处理后 `LoginUserHolder.get()==null` 断言（含异常路径）。

### G5（B1/B2）事务可见性与 P0 优先 — 已关闭
- **修复**（F1）+ 集成验证：受理事务提交先于等待/消费（G5-VISIBILITY 测试）。
- P0 同步真实流转（curl 原样）：`POST /workflow/commands/tasks/{taskId}/complete?channel=P0` → **135ms** 返回 `status=COMPLETED`（commandId 2096104410225295362），实例即时 APPROVED、待办清零；慢路径超时→返回 ACCEPTED+commandId 可回查（P0 控制器测试三态）。
- 真实积压下 P0 优先：集成测试记录队列状态（2 PROCESSING+3 PENDING）与受理/处理时间线；普通任务后续推进断言。分层标注：隔离持久环境，非生产流量。

### G6（B3/授权）— 已关闭
- V51 重写（F2）：不默认发放，脱敏副本即迁移文件本体（全注释+幂等 INSERT，无角色授权语句）。
- 真实双身份验证（admin=superadmin 短路；p4user 无任何角色）：
  - p4user 读 admin 草稿 → `403 无权访问该草稿`
  - p4user P0 通道 → `403 缺少 P0 调用专用权限: workflow:p0:dispatch`（且不产生命令，任务数不变=无副作用）
  - p4user 回查 admin 命令 → `403 无权查看该命令`
  - p4user 我发起的 → total 0
- 有 P0 仍不越过对象权限：消费端 assignee/状态校验（既有 TaskActionService 测试 + APPROVAL_ALREADY_HANDLED 确定冲突）。

### G7（A8）替代 MQ 契约 — 已关闭
- 契约测试套件 `BpmCommandQueueContractTest`（投递/领取/确认/有界重试退避/FAILED 终态/stale 恢复/幂等回查 4 场景）由 **PersistentBpmCommandQueue（真实 H2）** 与 **InMemoryCommandQueue（替代实现）** 共同运行，8 条全绿。
- 默认路径实际经接口：`CommandDispatcher`/`FlowStartPortImpl`/`CommandAcceptService` 全部依赖 `BpmCommandQueue` 接口注入（Spring bean=PersistentBpmCommandQueue），集成测试运行时即经接口执行。

### G8（C2）原始证据与交付材料 — 已关闭
- `evidence/backend-full-test.log`：最终后端全量 `BUILD SUCCESS`，**169 份 Surefire XML，Tests 1101 / Failures 0 / Errors 0 / Skipped 0**（首轮 1088 → +13 = G4/G5/G7 集成与契约 13 条）。
- `evidence/frontend-four-gates.log`：typecheck 过、**lint 0 error / 0 warning**、`121 files passed | 1 skipped`、`1147 passed | 3 skipped`、build EXIT=0（本轮本人复跑）。
- Flyway 双方言：H2 **53** / PG **52** 全链成功（V50 队列与草稿、V51 P0 权限、V52 表单幂等键、V53 个人中心菜单；链测试钉值同步更新，见 backend-full-test.log）。
- **lint 47→0 说明**：首轮后 lint 实为 141 warnings（非代理报告的 0），全部集中在 MyDrafts.vue(55)/MyInstances.vue(88)——系本轮移动弹窗时引入的缩进问题；已 `eslint --fix` 定点修复这两文件并复跑归零。历史 47 warnings 属于本轮已改动的既有文件（handlers.ts/seeds.ts/api），随本轮编辑消除；**未触碰任何独立 ESLint 待办或无关模块**（改动清单见 source-identity-*.txt，可复算）。
- 源码身份：`evidence/source-identity-{server,web,workspace}.txt`（HEAD SHA+变更清单）；未提交（方向未授权 Git）。
- 运行配置与运维边界：`sw.bpm.command.poll-interval-millis=500 / p0-poll-interval-millis=100 / batch-size=20 / p0-batch-size=5 / max-retries=5 / backoff-millis=1000（指数退避上限 2^10）/ stale-seconds=60 / p0-wait-timeout-millis=5000 / p0-wait-poll-millis=100`。**暂停消费**：停止调度器线程（PreDestroy）/不启用 dispatcher；**恢复**：重启后 stale 回收自动续跑；**排空**：队列以 `sw_bpm_command` 为准，PENDING/FAILED 可查可重放（FAILED 可重新受理）；**Schema 兼容**：消费端仅依赖 V50 表结构，前向迁移兼容；**回退限制**：存在受理中命令时不得回退到不识别 `sw_bpm_command`/`sw_bpm_draft` 的旧版本（会丢受理）；V51 无默认授权，回退无授权残留。旧同步 HTTP 入口（complete/reject/return）：与命令通道共享 `TaskActionService`，**同享越权校验、动作审计（sw_bpm_approval_action）、实例顺序与 2305 幂等**；差异仅在未经 `sw_bpm_command` 受理（无受理行，审计仍落库）——兼容保留，不判错，已如实披露。

## 验证门最终值（本轮原始输出见 evidence/）

- 后端：`mvn test -o` → BUILD SUCCESS，169 XML，**1101/0/0/0**（首轮 1035 → 1101）。
- 前端四连：typecheck ✓ / lint **0e0w** / 121f+1sk、**1147 passed+3 skipped** / build EXIT=0。
- Flyway：H2 53 / PG 52 全链成功。

## 剩余披露（不构成本轮可执行项）

- "未办理被取消的任务"运行场景需两节点流程/管理终止能力（当前产品无该接口）——待能力具备后补运行验证。
- p4user 浏览器级（而非 API 级）双身份切换未执行——G6 拒绝证据为真实后端 API 层。
