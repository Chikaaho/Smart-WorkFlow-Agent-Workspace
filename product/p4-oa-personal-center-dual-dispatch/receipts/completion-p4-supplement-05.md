# P4 个人中心双通道补证回执 05（对应三级提示03）

日期：2026-09-06；角色：执行；等级：XL；功能状态：VERIFYING（自验完成，待 Planner 独立复验）
承接：`planning-execution-prompt-p4-03.md`（唯一当前入口）+ `planning-review-p4-04.md`。锁定项 L6—L12 直接复用，不重做；本轮只补各证据包缺失断言，并按包格式登记（ID → 原始文件/行号 → 时间/对象 → 正向 → 反向 → 边界）。完整索引：`evidence/review03/evidence-index-review03.md` §06 追加包；清单 `COLLECTION-MANIFEST-new06.json`（32 项，源/副本 0 mismatch，jar 指纹单列）。

## 1. 实现修复（本轮代码变化，均直接相关）

| 文件 | 修复 | 动因包 |
|---|---|---|
| `BpmMyProcessedController.java` | 默认已办改为**全局合并分页**：ACTION 全量 + 引擎 finished 历史全量按 taskId 去重，办理时间倒序全局排序后内存切片；total=合并去重后条数（精确，非上界）。原"两源各自计数求和"上界语义删除 | G3b |
| `DraftSubmitService.java` | 受理前已知绑定失效拒绝：草稿快照绑定≠当前唯一有效绑定 → 400"流程已由管理员更新，请确认更新"，不静默改绑、不受理已知无效命令 | G2a |
| `BpmDraftController.java` | 范围撤销后已有草稿**保存拒绝**（payload 更新前 requirePublishedForm）；refreshFormVersion 确认时重解析版本+绑定 | G1b/G2a |
| `CommandAcceptService.java` / `DraftSubmitService.java` | 非超租户受理前明确拒绝（当轮早前已入，本轮补源码副本与测试副本归集） | G6b |
| 测试 | `CommandOverlapRealEngineTest`（新增，迁至 sw-bootstrap）、`BpmMyProcessedControllerTest` +跨页矩阵、`BpmDraftControllerTest` +3 用例、`CommandAcceptServiceTest` +租户拒绝 | 各包 |

pom：sw-bpm-process 曾临时加 sw-bpm-engine 测试依赖引发其他测试上下文污染，已撤销；真实引擎重叠测试改置于 sw-bootstrap（全模块装配，Flyway 链测试为纯 JUnit 不受影响）。

## 2. 证据包逐项

### G1a
- 原始：`new-06/browser-3db5d007-final.png`、`browser-3db5d007-dom.txt`、`new-06/g1a-object-map.md`。
- 对象链（时间 2026-09-06 03:27—03:31）：草稿 2096319281688662017 → 父命令 2096319703472066561（DRAFT_SUBMIT/NORMAL/COMPLETED）→ 子命令 2096319705544052738（FLOW_START）→ 业务记录 3db5d007-c585-4e72-b17c-52dece5e1509 → DB 实例 2096319707909640193 → 引擎实例 0bef429e-a960-11f1-91c6-66ff24301f3c → 任务 0befb7db（n_d1，admin 办理）。
- 正向：新入口截图（browser-initiate-entry.png，L7 已锁）+ **正确对象**终态截图（详情弹窗：业务单号 3db5d007、已通过、流转记录"重绑04终审/系统管理员"）。
- 反向：业务记录 ID 不冒充引擎 ID（映射表分列）；旧同名图 browser-my-instances-approved.png 登记为历史对象（20a4ada0），不再作为 3db5d007 证据。
- 管理员待办同序列复现：干净登录 admin → /dict → 展开流程引擎 → 待办任务 → **/workflow/todo 正常**（含 3db5d007 行）→ 我的已办正常。原异常序列为进程重启后旧标签页残留渲染（g1a-object-map.md 复现说明段）。

### G1b
- `new-06/g1b-g2a-g6a-evidence.out` B1—B5（2026-09-06，最终 jar）：撤权 → **保存 404"表单不存在"**（B2）→ 提交拒绝（B3）→ 草稿内容原样保留（B4 payload 回读）→ 恢复后可保存（B5）。
- 反向：拒绝不产生命令（B3 受理链未触发）；响应不泄漏定义。
- 边界：跨租户=隔离服务层（租户拦截器+受理前租户拒绝，见 G6b）。

### G1c
- `new-06/browser-designer-field-edit-dom.txt` + 回读 `{"label":"申请人姓名","required":true}`：设计器内选中字段→改字段显示名→保存→**字段值**读回一致。
- D2/D2b 读取层级解释：D2 以 biz 读 /definition 得 403（读取即拒）；改 admin 读取后，/definition 返回 JSON **字符串包裹**的定义，先前的子串断言落在外层转义上误判 false；D2b 解析内层 JSON 确认 required=true、字段数 3。两层均为真实响应，差异是解析层级，非数据变化。

### G2a
- 受理前已知失效：`g1b-g2a-g6a-evidence.out` C1（400"表单关联的审批流程已由管理员更新，请在填报页确认更新后提交"）、C2（草稿 EDITING、commandId=null、绑定未变）。
- 用户确认更新：C3（refreshFormVersion → 重解析新绑定 bpm_db50e19f531e44b1）→ C4/C5（提交受理 COMPLETED）。
- 版本守卫：`BpmDraftControllerTest` :289 区段"表单已发布新版本"报错且草稿保留（副本 `new-06/BpmDraftControllerTest.java`）。
- 入队后失效链（L9 已锁）与本轮受理前拒绝构成时序两侧，均真实。

### G3a
- 原件归集：`from-backend/03/live-business-20260905.md` G3a 段 + 过滤日志 `from-backend/03/backend-p4-dev-08.log`（含审批命令处理行）；对象/断言见索引 §G3a（取消成员重放 404、已办不增、办理者记录保留）。

### G3b
- 修复：默认已办全局合并（精确 total、跨页不漏不重）。测试副本 `new-06/BpmMyProcessedControllerTest.java`：
  - `myProcessed_defaultSource_dedupActionOverHistoryCompat`：无 ACTION 旧历史保留（HISTORY_COMPAT）、跨源去重、total=2 精确；
  - `myProcessed_defaultSource_crossPageNoLeakNoDup`：pageSize=1 两页合计=total、无重复 taskId。
- 引擎侧过滤引证：`sw-bpm-engine/.../BpmTaskFacadeImpl.java:254-276` queryProcessedPage/countProcessed = HistoricTaskInstanceQuery taskTenantId+taskAssignee+**finished**（取消/删除不在 finished）；该引擎查询为平台闭源核心内的查询契约，隔离夹具经 facade 真实实现分页拉取（非 mock 预排除）。
- 边界：默认合并为全量物化（个人自有记录，有界），已在代码注释与本回执披露。

### G4a
- 最终代码重启恢复：`new-06/g4a-phase1.out`（18084 暂停受理：命令 2096434531910000641 PENDING、草稿 SUBMITTING）→ 进程停止（文件库保留）→ `new-06/g4a-phase2.out`（18085 同库重启：命令 COMPLETED→record d5d88872→实例 RUNNING→dsp/admin 两次真实审批→APPROVED；dspProcessed=1）。
- 反向：不丢（同 id 恢复）、不重（processed=1、单实例）。
- 原件（早前轮次）`from-backend/03/live-business-20260905.md` G4a 段保留；本轮为最终实现重采。

### G4b
- `new-06/CommandOverlapRealEngineTest.java`（sw-bootstrap）：真实 Flowable + 真实 BpmTaskFacadeImpl + 真实 TaskActionService + 真实调度循环（无替身；仅通知发布器记录型适配）。
- 正向：业务提交后 ack 丢失 → 租约回收 → B 新租约 PROCESSING 期间以真实审批核心重执行 → 确定性拒绝（failureReason 含"已被处理"）→ 终态 FAILED；审批记录恰一条（u1:APPROVE）、流程通知恰一次、任务无残留、实例 APPROVED。
- 反向：旧持有者迟到 ack 写回被终态守卫拒绝（写回后仍 FAILED 且原因不变）；执行尝试身份不串。
- 运行：`new-06/backend-full-test-final.log` 内 CommandOverlapRealEngineTest 1/0/0/0（exit 0）。
- 在线真实 API 重叠：g4b-evidence.out:5-11 + g4b-late-final.out（终态 FAILED 原因"任务不存在"，审查04 §2.3 指认的 PENDING 中间态已以本轮 LATE_FINAL 重采更正）。

### G5a
- 索引归集：`from-backend/03/current-api-browser-20260905.md` G5a 段（P0 受理 COMPLETED→recordId→实例 RUNNING→待办完成→命令 2096158564008202241 COMPLETED→实例 APPROVED）；本轮重采：G6b2 W1（有界等待 ACCEPTED）、g4b-evidence S5/S6（等待内 COMPLETED）、G1c2 D4 链（父命令 COMPLETED→子 FLOW_START 落实例，recordId 对照）。
- 反向：父完成≠子启动（父/子命令 id 可分查）；子流程不回 NORMAL 积压（L4 + P0 受理通道记录）。

### G6a
- `new-06/g1b-g2a-g6a-evidence.out` G1/G2：一般管理角色（menus 5,20,23 无 312）→ /auth/me permissions=[workflow:view,todo:view,def:view] 无 P0 → P0 提交 403"缺少 P0 调用专用权限"。不用 superAdmin 或业务身份替代。

### G6b
- 撤权窗口/草稿保留/身份无残留：L10 已锁（g6b2-phase1/2 同命令关联）。
- R9 关联重采：X3 命令 2096314287589609473 COMPLETED → recordId 42d22ada → 实例 2096314289212805122（businessKey=recordId，RUNNING，归属仅P0 用户；原 g6b2 文件库销毁后按提示03登记替代重采）。
- 非零租户受理前拒绝源码副本：`new-06/DraftSubmitService.java.txt`（requireConsumableTenant）、`new-06/CommandAcceptService.java.txt`；单测 `new-06/CommandAcceptServiceTest.java` 非超租户拒绝用例（不 enqueue）。
- 跨租户隔离：租户拦截器列级隔离（平台共享内核）+ 受理前租户拒绝，隔离服务集成口径（审查03 §3.3）。

### G7a
- `g7a-contract-mapping.md` §4 分层更正 + 源码副本 `contract-sources/`（基类 4 用例 :56/:75/:105/:118、两实现、集成测试）。findByKeyRoundtrip 标注为查询契约；持久去重=duplicateDelivery 用例；crash=同进程回收（真重启归 G4a）。

### G8a
- 清单口径更正：`COLLECTION-MANIFEST-new05.json` 实为 18 文件哈希+1 jar 指纹元数据（回执已述）；本轮 `COLLECTION-MANIFEST-new06.json` 32 项（29 源/副本一致 + 3 独立生成 + jar 指纹单列），0 mismatch。
- 指针更正：g6b2 输出于 `new-06/`；V51/V52/V54 副本于 `new-06/migrations/`。
- 时点绑定：最终源码（G1b/G2a/G3b 修复+测试）→ `mvn -q package`（final-06 jar，sha256=220b3ef24561ecdc599c8d05cd636a6b7edac5bc99799183f8632dcf3c59d6c3，运行于 8080）→ 在线证据（g1b/g2a/g6a、g4a、G1c DOM、G1a 映射）→ 全量 `mvn -q test` exit 0 → 归集回读（0 mismatch）。源码快照副本：`new-06/*.java.txt`。
- 收尾：g4a/g6b 文件库删除读回不存在（本轮+前轮记录）；8080 为运行中开发服务（内存库，随进程销毁）；未 Git 提交推送。

### G8b
- 后端计数可复算原件：`new-06/surefire-summary.txt`（工具逐份扫描 Tests run 行：REPORT_FILES=172 TOTAL=1114 FAILURES=0 ERRORS=0 SKIPPED=0）+ `new-06/backend-full-test-final.log`（mvn -q test 完整输出，-q 语义下无 Tests run 行属正常）+ 退出码 MVN_EXIT=0。
- 前端门禁：L12 已锁（121 files/1152+3、build 1841/1.05s）；本轮前端零改动，原件复用 `new-05/frontend-gates.log`/`frontend-build.log`。

## 6. 自验结论

提示03 账本各包缺失断言已补齐：G4b 以真实审批核心+真实引擎完成重叠与租约交接证明；G3b 以真实跨页混合数据修复并断言精确分页；G1a 完成正确对象截图/映射/路由复现；G1b/G2a 完成受理前拒绝两侧；G6a/G6b/G7a/G8a/G8b 完成回读、映射与原件更正。自验结论：VERIFYING，待 Planner 独立复验。不自行 PASSED/COMPLETED、不核销 P4、不晋级基线。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/p4-oa-personal-center-dual-dispatch/receipts/completion-p4-supplement-05.md","evidence":["product/p4-oa-personal-center-dual-dispatch/receipts/evidence/review03/evidence-index-review03.md","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/review03/COLLECTION-MANIFEST-new06.json","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/review03/g7a-contract-mapping.md","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/review03/new-06/g1a-object-map.md","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/review03/new-06/browser-3db5d007-final.png","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/review03/new-06/g1b-g2a-g6a-evidence.out","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/review03/new-06/CommandOverlapRealEngineTest.java","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/review03/new-06/g4a-phase2.out","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/review03/new-06/surefire-summary.txt"],"feature_status":"VERIFYING","work_items":[{"id":"G1a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"对象映射与正确截图待复验"},{"id":"G1b","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"撤权保存拒绝待复验"},{"id":"G1c","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"字段值回读与层级解释待复验"},{"id":"G2a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"受理前失效拒绝与确认重绑待复验"},{"id":"G3a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"原件行号索引待复核"},{"id":"G3b","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"全局合并与跨页断言待复验"},{"id":"G4a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"最终实现重启恢复待复验"},{"id":"G4b","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"真实核心重叠测试待复验"},{"id":"G5a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"父子通道索引待复核"},{"id":"G6a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"一般管理员回读待复核"},{"id":"G6b","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"租户拒绝与R9关联待复验"},{"id":"G7a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"分层映射待复核"},{"id":"G8a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"清单与时点绑定待复核"},{"id":"G8b","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"可复算计数待复核"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待Planner按提示03账本逐包复核","next_action_type":"WAIT_PLANNER","progress_fingerprint":"p4-supplement-05:manifest-new06-32:overlap-real-engine-1-0-0-0:backend-1114-0-0-0:jar-220b3ef2","progress_basis":{"files_changed":["BpmMyProcessedController.java（默认已办全局合并）","DraftSubmitService.java（受理前已知绑定失效拒绝/租户拒绝）","BpmDraftController.java（范围撤销保存拒绝/refreshFormVersion重解析）","CommandAcceptService.java（租户拒绝）","sw-bootstrap/p4overlap/CommandOverlapRealEngineTest.java（新增）","sw-bootstrap/p4overlap/OverlapH2TestConfig.java（新增）","BpmMyProcessedControllerTest/BpmDraftControllerTest/CommandAcceptServiceTest（新增用例）","sw-bpm-process/pom.xml（撤销临时engine测试依赖）"],"tool_actions":["真实引擎重叠测试（Flowable+TaskActionService+调度循环）","文件H2双进程G4a重启恢复重采","在线REST断言（G1b/G2a/G6a）","设计器字段值DOM编辑+回读","mvn -q test 全量 exit 0（172/1114/0/0/0）","清单32项生成与源/副本哈希回读","g4a/g6b文件库删除读回"],"new_evidence":["evidence-index-review03.md追加包","COLLECTION-MANIFEST-new06.json","g1a-object-map.md","browser-3db5d007-final.png","browser-designer-field-edit-dom.txt","g1b-g2a-g6a-evidence.out","g4a-phase1.out","g4a-phase2.out","CommandOverlapRealEngineTest.java","surefire-summary.txt"],"closed_work_items":["G1a","G1b","G1c","G2a","G3a","G3b","G4a","G4b","G5a","G6a","G6b","G7a","G8a","G8b"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"maven","outcome":"SUCCEEDED","detail":"最终源码 mvn -q test exit 0：172 份报告 1114/0/0/0（含真实引擎重叠测试与兼容矩阵用例）；mvn -q package exit 0（final-06 jar=运行实例）"},{"tool":"browser","outcome":"SUCCEEDED","detail":"biz 我发起的 3db5d007 已通过详情/列表截图与 DOM；admin 设计器字段显示名编辑→保存→回读；截图通道两次间歇失败已重试成功并记录"},{"tool":"http-api","outcome":"SUCCEEDED","detail":"G1b 撤权保存/提交拒绝、G2a 受理前失效拒绝+确认重绑、G6a 仅P0矩阵、G4a 两阶段恢复断言全部经真实 REST 往返并回读"},{"tool":"filesystem","outcome":"SUCCEEDED","detail":"review03/new-06 归集 26 项+contract-sources 4 项；COLLECTION-MANIFEST-new06.json 32 项源/副本一致；g4a/g6b 文件库删除后读回不存在"}],"browser_status":"OPERABLE"}
