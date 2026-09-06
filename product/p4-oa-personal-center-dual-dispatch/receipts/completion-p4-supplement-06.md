# P4 个人中心双通道补证回执 06（对应提示05，七包提交契约）

日期：2026-09-06；角色：执行；等级：XL；功能状态：VERIFYING（自验完成，待 Planner 独立复验）
承接：`planning-execution-prompt-p4-05.md`（唯一当前入口）+ `planning-review-p4-05.md` + `planning-execution-retrospective-p4-01.md`。证据根：`evidence/final-gap-round/`（七包同 ID 索引 + 原件 + 清单），旧证据只按审查锁定指针引用，不重复归集。

## 1. 实际改动（本轮代码变化，均直接相关）

| 文件 | 改动 | 动因包 |
|---|---|---|
| `queue/PersistentBpmCommandQueue.java`、`BpmCommandQueue.java`、`CommandEnvelope.java`、`entity/BpmCommand.java` | 领取签发一次性**租约令牌**；complete/reject/failAndScheduleRetry 须匹配令牌+PROCESSING 方可写回；reclaimStale 清令牌 | G4b-2 |
| `service/TaskActionService.java` | execute 三参重载（commandId）；任务消失且动作记录 command_id=当前命令 → **恢复自身已提交结果**（R.ok，无二次效果）；不同命令/意图仍确定性拒绝；recordAction 落 command_id | G4b-3 |
| `queue/TaskActionCommandHandler.java` | 传 commandId；结果 JSON 恒携带 actionRecordId；重放返回 `RECOVERED` | G4b-3 |
| `entity/ApprovalActionRecord.java` + 迁移 `bpm/{h2,postgresql}/V55__p4_command_claim_token_and_action_command_linkage.sql` | `sw_bpm_approval_action.command_id`、`sw_bpm_command.claim_token` | G4b |
| `engine/facade/BpmTaskFacadeImpl.java` | 已办兼容查询增加 `.taskWithoutDeleteReason()`（取消/删除任务带 deleteReason，原会混入 finished 历史） | G3b |
| `controller/BpmMyInstanceController.java` | 详情流转记录按 taskId 合并 ACTION 记录（action/approvalResult/opinionData）；无动作节点不伪造 | G1a |
| 前端 `MyInstances.vue` | 动作标签映射（对齐 MyProcessed ACTION_TAG）+ RETURNED 结果映射 | G1a |
| 前端 `MyDrafts.vue` | 发起入口卡片移出 StandardListTemplate 默认插槽——修复 **0 草稿空态下发起入口不可见**（A2 真实缺陷，本轮浏览器验证中发现并按正反断言修复）；`MyDrafts.spec.ts` +1 空态用例 | A2/G1a 链路 |
| 测试适配 | 队列契约/调度器/租约交接/InMemory 替代实现适配令牌签名；`FlywayFullChain{H2,Postgres}Test` 迁移计数 54→55 / 53→54（V55） | 全量门禁 |

## 2. 门禁（最终源码实际运行）

- 后端：`mvn test` 全量 **MVN_EXIT=0**，逐报告工具计数 **173 份报告 / 1121 tests / 0 failures / 0 errors / 0 skipped**（`g8b-surefire-per-report.txt`，逐报告行+哈希可复算；173/1121 与上轮 172/1114 的差异=本轮新增用例，可解释）。
- 前端：vitest **121 files passed / 1153 passed + 3 skipped**（含新增空态用例）；eslint（两改动文件，--max-warnings=0）通过；vue-tsc 0 错；`npm run build` ✓ 1.29s。

## 3. 七行核对表（提示05 §7）

| ID | 场景输入成立的原件 | 真实路径/替身边界 | 正向结果 | 反向结果 | 同对象/最终快照 | 结论与剩余动作 |
|---|---|---|---|---|---|---|
| G1a | 对象链草稿→命令→实例 2096510901902077954→任务 2e3b92f8（G1a-index §2） | 真实控制器/服务/引擎，无替身 | API 读回与页面 DOM：动作"通过"/结果"通过"/意见/办理时间齐备（browser-g1a-detail-dom.txt、-1680.png） | 无动作节点 action/approvalResult/opinionData 均 null 不伪造（单测断言） | ea4f7f7e 全链同对象，详情=已通过/流程已结束 | 关闭；旧对象 3db5d007 销毁已按提示登记替代 |
| G3b | 正反对象真实入源：finished+本人计数=4（含取消/删除） | 真实引擎+真实 H2+真实查询链，无 mock 预排除 | 默认来源跨页 union={I1,I2}、total=2 精确、顺序稳定；ACTION=1；HISTORY_COMPAT=2 | 取消（deleteReason=会签结算取消）/删除/非本人不入任何页 | 同一隔离库同批对象逐页核对 | 关闭（引擎查询按真实结果修复 taskWithoutDeleteReason） |
| G4b | 断言1 NORMAL+P0 双命令；断言2 两代令牌+双消费者中途阻塞；断言3 ack 丢失同命令重投 | 真实引擎/审批核心/队列；栅栏仅计时同步（记录型适配） | 断言1 窗口相交+提交顺序 t1→t2+单次效果+通知1；断言2 B 恢复 COMPLETED(RECOVERED)；断言3 窗口相交+提交顺序 t1→t2+单次效果+通知1 | 断言2 旧令牌迟到完成/失败被拒（仍 PROCESSING、result null）；迟到业务执行被拒无二次效果 | 同命令/同实例事件毫秒窗口与终态读回（G4b-index） | 关闭（三断言分别成立；同命令恢复自身成功已实现） |
| G5a | bizP0 持 P0 权限（/auth/me 读回）、草稿必填齐全 | 真实 REST→受理→P0 车道→子命令继承通道 | 父/子 channel=P0 可读回；145ms 有界返回 COMPLETED；实例 APPROVED 发起人本人 | 父完成不冒充子启动（独立 id/时点）；子不回 NORMAL 积压 | 2096476051870543873→2096476052197699585→fe458ad4→实例（g5a-p0-channel.out） | 关闭；P0 优先调度复用 L4 锁定 |
| G6b | 双租户草稿/实例对象；phase1 停用 X 前两命令 PENDING（A3/A4/A5） | 真实服务+租户拦截器；双进程文件库真实运行 | 租户2 读/改全部不可达；Y 命令同车道恢复 COMPLETED，实例归属=Y 本人→APPROVED | X 命令消费前拒绝（日志原件）、草稿终态失败补偿；跨租户 updateById=false | g4a-g6b-phase1/2.out+服务器日志（同车道时序 16:15:16.358→.412→.460） | 关闭（读隔离+拒绝后同车道身份归属均有原件） |
| G8a | 28 个本轮变更源文件+V55 迁移在清单中逐个哈希 | 源码→jar(3ee63fa7…)→在线运行（PID/起止时间）→证据 | 清单 40 条 exists=True 哈希回读一致；三进程生命周期完整记录；文件库删除读回不存在 | 活服务零残留（8080/phase1/phase2 全停）；jar 元数据单列不冒充文件 | g8a-lifecycle-and-cleanup.txt+清单 | 关闭；PID 转录错误（31852→39302）已登记更正 |
| G8b | run5 全量日志（后端最终源码）+ 前端四门禁日志 | 工具扫描，非手抄汇总 | 173 报告/1121/0/0/0 逐报告行+哈希；MVN_EXIT=0；前端 121/1153+3、eslint/tsc/build 过 | 不从静默推断；差异（172→173、1114→1121）逐项可解释 | 同一后端源码快照（run5 后后端零改动） | 关闭 |

## 4. 包索引（`evidence/final-gap-round/`）

`G1a-index.md`、`G3b-index.md`、`G4b-index.md`、`G5a-index.md`、`G6b-index.md`、`G8a-index.md`、`G8b-index.md`；清单 `COLLECTION-MANIFEST-final-gap-round.json`（40 条，全部存在、sha256 回读）。

## 5. 真实剩余与披露

- 授权内可执行项为零；无 BLOCKED。
- 平台既有缺陷再次遇到并绕过（登记不改）：`PUT /system/role/{id}/menus` 重复执行 500（软删残留，本镜头轮以新角色一次性绑定绕过）；用户创建嵌套 roleIds 反序列化失败（创建后 PUT 根数组绕过）。
- 已发布表单保存 config 直接更新服务定义（publish 返回 1100"已发布"）——本轮夹具依赖此行为修正定义 title；是否需要版本化发布契约属后续规划裁量，不属本轮七包。
- 未 Git 提交推送、未生产/真设备操作、未读认证存储；秘密为会话现场生成不入库。

## 6. 自验结论

提示05 七包正反断言均有真实原件支撑：G1a/G3b/G4b 的产品与实现缺陷已按真实结果修复并经真实链路验证；G5a/G6b 补齐正向原件；G8a/G8b 时点绑定与可复算计数交付。自验结论：VERIFYING，待 Planner 独立复验。不自行 PASSED/COMPLETED、不核销 P4、不晋级基线。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/p4-oa-personal-center-dual-dispatch/receipts/completion-p4-supplement-06.md","evidence":["product/p4-oa-personal-center-dual-dispatch/receipts/evidence/final-gap-round/G1a-index.md","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/final-gap-round/G3b-index.md","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/final-gap-round/G4b-index.md","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/final-gap-round/G5a-index.md","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/final-gap-round/G6b-index.md","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/final-gap-round/G8a-index.md","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/final-gap-round/G8b-index.md","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/final-gap-round/COLLECTION-MANIFEST-final-gap-round.json","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/final-gap-round/g8b-surefire-per-report.txt"],"feature_status":"VERIFYING","work_items":[{"id":"G1a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"详情映射修复与同对象读回待复验"},{"id":"G3b","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"真实对象分页与deleteReason修复待复验"},{"id":"G4b","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"三断言真实引擎测试与租约/恢复实现待复验"},{"id":"G5a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"P0父子通道原件待复验"},{"id":"G6b","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"读隔离与同车道归属待复验"},{"id":"G8a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"时点绑定与生命周期收尾待复验"},{"id":"G8b","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"逐报告可复算计数待复验"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待Planner按提示05七包逐项复验","next_action_type":"WAIT_PLANNER","progress_fingerprint":"p4-supplement-06:seven-gap-round:overlap3-0-0:processed-real-3-0-0:cross-tenant-2-0-0:backend-173r-1121-0-0-0:frontend-121f-1153-3:jar-3ee63fa7","progress_basis":{"files_changed":["PersistentBpmCommandQueue/BpmCommandQueue/CommandEnvelope/BpmCommand（租约令牌）","TaskActionService/TaskActionCommandHandler/ApprovalActionRecord（同命令恢复+command_id）","BpmTaskFacadeImpl（已办排除deleteReason）","BpmMyInstanceController（详情合并动作）","bpm V55迁移 h2+pg","MyInstances.vue/MyDrafts.vue/MyDrafts.spec.ts（展示映射+空态入口修复）","队列/调度器/契约测试适配+FlywayFullChain计数","新增 MyProcessedRealSourceTest/CrossTenantReadIsolationTest"],"tool_actions":["真实引擎三断言测试（跨通道/租约交接/同命令恢复）","真实数据源已办分页测试（取消/删除/非本人正反对象）","跨租户读隔离测试","双进程文件库撤权窗口+同车道恢复在线运行","G1a浏览器全链与截图/DOM取证","G5a P0父子通道在线采集","mvn test全量exit0与逐报告计数工具","前端四门禁重跑"],"new_evidence":["final-gap-round 七包索引","COLLECTION-MANIFEST-final-gap-round.json","browser-g1a-detail-fixed(-1680).png+dom","g4a-g6b-phase1/2.out+两phase服务器日志","g5a-p0-channel.out","g8a-lifecycle-and-cleanup.txt","g8b-surefire-per-report.txt"],"closed_work_items":["G1a","G3b","G4b","G5a","G6b","G8a","G8b"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"maven","outcome":"SUCCEEDED","detail":"mvn test 全量 MVN_EXIT=0：173 份报告 1121/0/0/0（含三断言真实引擎测试、真实数据源已办测试、跨租户读隔离）；mvn -q package exit 0（jar sha256=3ee63fa7…）"},{"tool":"browser","outcome":"SUCCEEDED","detail":"finalbizg 从已发布表单发起→填报→保存→提交→admin审批→我发起的详情：终审节点动作/结果/意见/办理时间一致（截图+DOM）；截图通道两次间歇失败已等待恢复重试成功"},{"tool":"http-api","outcome":"SUCCEEDED","detail":"P0 父子通道 145ms 有界返回、命令/实例读回、admin审批闭环；双进程文件库撤权窗口与恢复全链 REST 断言"},{"tool":"filesystem","outcome":"SUCCEEDED","detail":"final-gap-round 证据 18 项归集+清单 40 条哈希回读；文件库删除后读回不存在；全部服务停止记录"}],"browser_status":"OPERABLE"}
