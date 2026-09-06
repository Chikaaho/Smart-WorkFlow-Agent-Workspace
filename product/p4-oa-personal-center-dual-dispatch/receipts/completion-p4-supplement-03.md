# P4 个人中心双通道补证回执 03

日期：2026-09-06（Asia/Shanghai，执行跨 09-05 深夜至 09-06 凌晨）
角色：执行（Executor）
等级：XL
功能状态：VERIFYING（自验完成，待 Planner 独立复验）
承接：`receipts/planning-execution-prompt-p4-01.md`（唯一剩余原子账本）
最新范围：`receipts/planning-business-correction-p4-01.md`、`ready/flow-platform-capability-boundary.md`、`ready/direction-p4-oa-personal-center-dual-dispatch.md`
历史回执：`completion-p4-supplement-02.md`（其中自验通过项本轮复用；留缺口项本轮逐项关闭）

本回执为追加文件，不覆盖历史。执行口径保持：普通用户从已发布表单发起，服务端解析唯一合法发布绑定；本轮不建设流程中心分类/双视角页面，保留并复用流程中台能力与接口契约。

## 1. 本轮执行结论

在 supplement-02 留缺口的基础上，本轮关闭 G1a/G1c/G2a/G4b/G6b 五个缺口原子，并修复四个实现过程中确证的行为缺陷（见 §3）。全部剩余行为证据在**最终代码快照**上采集：

- G1a：普通用户（p4biz03）在真实浏览器（vite 5173 → 后端 8080，非 mock）完成"已发布表单发起 → 半填保存 → 刷新重登恢复 → 字段级拒绝 → 继续编辑 → 提交 → 删除 → 我发起的查看/进度 → 审批人通过 → 已办记录 → 我发起的已通过"全生命周期；并在最终快照上重走核心链（提交→审批→已通过，实例 20a4ada0）。
- G1c：普通身份 5 项编辑/发布/流程管理请求全部 403（反向录制）；管理员图读写/校验/可见范围维护正向；草稿由服务端回填唯一绑定 processDefKey。
- G2a：**发现并修复受理前必填校验缺口**（见 §3.3）；补齐受理冻结、同意图幂等、绑定失效→有界重试→FAILED→内容保留→修正重提全链。
- G4b：新增持久队列真并发与旧领取者竞争集成测试；在线真实路径完成同实例 NORMAL/P0 跨通道冲突（P0 结算 → 取消任务从待办消失 → 迟到 NORMAL 命令有界重试后 FAILED"任务不存在" → 无已办冒充）。
- G6b：文件 H2 双进程窗口实验在最终 jar 上完整重做——受理（消费暂停）→ 真实 API 撤 P0 权限/撤可见范围 → 进程重启恢复消费 → 消费时确定拒绝、零业务副作用、拒绝后身份无残留。

## 2. 读取、修改与证据位置

### 2.1 已读取

`system.md`、`roles/executor.md`、工程宪法（Server；Web 未改动故按门禁执行）、提示01 及其引用（业务纠正01、主方向、能力边界）、审查02（L1—L5 锁定项）、`completion-p4-supplement-02.md` 及 evidence/03 各附件、`knowledge/current-status.md`、`knowledge/shared-constraints.md` §6。

### 2.2 本轮代码修改（均在 Smart-WorkFlow-Server，前端零改动）

| 文件 | 修改摘要 | 动因 |
|---|---|---|
| `sw-bpm-process/.../queue/PersistentBpmCommandQueue.java` | `complete()` 仅允许 PROCESSING→COMPLETED；`failAndScheduleRetry()` 终态保护（COMPLETED/FAILED 不可复活或改判），PENDING/PROCESSING 允许失败处理 | G4b 旧领取者竞争窗口确证缺陷 |
| `sw-bpm-process/.../queue/CommandDispatcher.java` | `rejectBeforeHandle` 在队列拒绝后以发起人最小身份触发 `handler.onFinalFailure`（草稿转 FAILED 可修正，不再永久 SUBMITTING） | G6b 消费前拒绝连带缺陷 |
| `sw-biz-form-api/.../facade/FormDataSubmitFacade.java` | 新增 `validateSubmission(formKey, data)` 契约（default 抛 Unsupported） | D3"失败…不受理审批命令" |
| `sw-biz-form-biz/.../service/FormSubmitService.java` | 新增只读 `validateSubmission`：与 submitForm 共用发布/可见/字段校验，不落库 | 同上 |
| `sw-biz-form-biz/.../service/FormDataSubmitFacadeImpl.java` | 委托实现 validateSubmission | 同上 |
| `sw-bpm-process/.../service/DraftSubmitService.java` | 受理前调用 `formDataSubmitFacade.validateSubmission`；失败抛字段级业务异常、不产生命令、不冻结草稿 | 同上 |
| `CommandQueueIntegrationTest.java` | 新增 G4b 两用例：双消费者真并发恰一次效果；stale 回收后旧领取者迟到 complete/fail 不得复活命令 | G4b |
| `BpmDraftControllerTest.java` | 注入 Facade mock；新增 D3 受理前校验失败→不 enqueue 不更新草稿 用例 | G2a |

Git 状态：两仓均保持未提交（本轮无 Git 提交授权，与前轮一致）；上述修改叠加在 supplement-02 的未提交工作区之上。

### 2.3 运行环境与身份（本地隔离）

- 后端：`java -jar sw-bootstrap/target/sw-bootstrap-1.0.0-SNAPSHOT.jar --spring.profiles.active=dev --server.port=8080`，H2 内存库（Flyway 全链 54 条迁移），`SW_DEBUG_AUTH_ENABLED=true`，SW_CIPHER_KEY / SW_LOGIN_DIGEST_SECRET 为一次性本地生成值，SW_LOGIN_RSA_PRIVATE_KEY 为本地生成的 dev 密钥（均不入仓库、非生产秘密）。最终运行进程 PID 31852（01:55 启动，最终 jar）。
- 前端：vite dev（5173，`/api` 代理→8080，非 mock 模式）。
- 夹具（`evidence/04/fixtures03-run.out`）：p4biz03（bizUser=2096296365488033794，仅 workflow:view/todo:view/my:view）、p4dsp03（dspUser=2096296365941018625，另持 workflow:p0:dispatch）、formA=p4_oa_biz_form_20260905b（已发布，applicant/reason 必填）、formB=p4_oa_consensus_form_20260905b（ANY 会签：biz+dsp）。调试认证 `Bearer test_<userId>` 每请求回查正式身份。
- G6b 独立环境：文件 H2 `target/p4-g6b-db2`，进程 A 端口 18082（`--sw.bpm.command.poll-interval-millis=3600000 --sw.bpm.command.p0-poll-interval-millis=3600000` 形成消费暂停窗口）、进程 B 端口 18083（正常轮询）。

### 2.4 证据目录

全部在 `Smart-WorkFlow-Server/product/p4-oa-personal-center-dual-dispatch/evidence/04/`，逐文件说明见该目录 `README-evidence04.md`，哈希清单 `MANIFEST-SHA256.txt`（35 项，`shasum -a 256 -c` 全部 OK；运行中的活日志 backend-p4-final-04.log 以冻结副本 backend-p4-final-04-frozen.log 计入）。证据行号引用格式 `[tag] 文件:行号`。

## 3. 确证缺陷与修复（本轮代码变化）

1. **队列终态复活窗口（G4b）**：修复前，旧领取者迟到调用 `complete()` 会覆盖结果、`failAndScheduleRetry()` 会把其他消费者已完成的命令复活为 PENDING。修复后终态不可复活；竞争行为由新增集成测试锁定。
2. **消费前拒绝导致草稿永久 SUBMITTING（G6b 连带）**：`rejectBeforeHandle` 原只改命令状态，不触发处理器补偿。修复后草稿转 FAILED 并记录 lastError（G6b2 R3/R4 行为验证）。
3. **受理前必填校验缺口（G2a，方向 D3"失败…不受理审批命令、不启动流程"）**：修复前服务端受理缺失必填的提交（消费时才失败，重试 4 次约 31s）。修复后受理即拒绝：`[A1] g2a-evidence.out:1` code=1401"必填字段 'applicant' 缺失"、`[A2] :2` 草稿保持 EDITING、commandId=null、submitSeq=0、内容保留、零命令。
4. **首次实现的 `failAndScheduleRetry` 守卫过严**（仅允许 PROCESSING 触发，破坏了 PENDING 直接触发重试的既有契约测试）：放宽为终态保护；全量测试回归绿。

## 4. 原子账本逐项对照（正/反断言与覆盖边界）

证据强度：真实=本地服务真实 HTTP/DOM/持久化读回；集成=隔离 H2+真实迁移/调度；测试=套件断言。行号以 evidence/04 当前文件为准。

| 原子 | 结果 | 正向断言与证据 | 反向断言/排除 | 覆盖边界 |
|---|---|---|---|---|
| G1a | 真实浏览器闭环（最终快照） | 最终链：新建草稿弹窗仅表单下拉+系统解析提示（无流程选择器）→ formA 填报（申请人/事由/标题）→ 提交成功（业务单号 20a4ada0，绑定 bpm_dbe8cb55b141430c 由服务端解析）→ admin 待办通过（审批确认对话框→"审批通过"）→ admin 我的已办 1 条（通过/已通过/动作通道）→ biz 我发起的=已通过（`browser-my-instances-approved.png`）。完整生命周期（同口径，前一运行时）：半填保存"草稿已创建"→ 整页刷新回登录 → 重登后草稿恢复（标题 G1a浏览器草稿，编辑中）→ 继续编辑内容完整回填（申请人/金额300/标题+重绑最新版本复选框）→ 删除场景第二草稿"草稿已删除"且列表消失 → 提交成功 → 详情含当前进度（节点/办理人/任务号） | 半填提交被字段级拒绝（见 G2a A1）；admin 的四入口为 superAdmin 全量菜单，普通用户菜单仅四个人口（登录后快照无流程定义/监控菜单） | loopback H2+浏览器真实 DOM；重登恢复路径以"重新登录"验证（前端会话本就不持久化 token，刷新即登出属设计行为）；审批人侧此前用 dsp 完成的 P0 审批见 G4b |
| G1b | 真实 API（本轮重采，复用 supplement-02 结构） | `[P2] g1c-evidence.out:8` 管理员置 restrict(biz) → `[P3] :9` dsp published 列表仅剩 formB → `[P4] :10` dsp by-key formA=1000 表单不存在（不泄漏） → `[P5] :11` 恢复全租户 → `[P6] :12` dsp 可再取 | 范围外用户读定义被拒且响应无定义信息；空=全租户（恢复即命中） | 服务端过滤覆盖列表/详情；保存/提交同口径复用于 G6b R2（消费时可见性拒绝） |
| G1c | 真实 API | 正向：`[P7] g1c-evidence.out:13` 管理员读流程图 → `[P8] :14` 保存 → `[P9] :15` 校验 0 错误；`[U1] :16` biz 建草稿服务端回填 processDefKey=bpm_3efcea95699b47d7（唯一绑定解析）。反向：`[R1—R4,R6] :1-6` biz 改表单/改可见范围/发布/建流程/设计分页全部 403"无权限" | 普通用户任意改流程请求被拒；绑定唯一性由"发布即停用旧绑定+解析器多绑定显式失败"双重保证（结构化语义，代码 `BpmProcessDefServiceImpl.publish`/`DraftSubmitService.resolveUniqueActiveProcessDefKey`） | 边界：已发布表单元数据冻结（`[P1] :7` code=1100"已发布的表单不能修改元数据"）为平台既有设计——管理员编辑面=可见范围+流程图/发布+config 保存；表单版本演进（v3+）平台未提供路径（见 §5 偏差1） |
| G2a | 真实 API（含修复后重采） | 受理前校验：`[A1][A2] g2a-evidence.out:1-2`。冻结/幂等：`[B2][B3] :4-5` SUBMITTING 改/删被拒（明确消息）→ `[B4] :6` 重复提交 duplicated=true 同 commandId → `[B5][B6] :7-8` 命令 COMPLETED、草稿 SUBMITTED 且 recordId 一致。绑定失效链：`[C1] :9` 管理员发布新流程（重绑）→ `[C2] :10` 旧快照命令有界重试 4 次 FAILED"表单流程绑定已变化" → `[C3] :11` 草稿 FAILED、payload 原样保留、lastError 定位 → `[C4][C5] :12-13` 修正重提（新 submitSeq/新命令、新绑定）COMPLETED | 不静默丢值（payload 全程回读一致）；受理中不可改删；同意图不重建；改内容不复用旧结果（submitSeq 递增） | 表单版本失效场景在本平台无 v3+ 路径（见偏差1），以**流程绑定失效**覆盖 D3 失效语义；前端 DOM 层"必填字段 'reason' 缺失"提示与重绑复选框在浏览器链中呈现 |
| G3a | 复用 supplement-02（L5 邻接锁） | `evidence/03/live-business-20260905.md` G3a：ANY 会签首个有效动作结算、重放 404、仅办理者留 ACTION | 已办理者不被冒充为被取消者 | 本轮未改 TaskActionService/Flowable 路径，原证据不失效 |
| G3b | 复用 supplement-02 | 同上 G3b：RETURN 到指定历史节点、历史可查 | 无伪造办理、兼容场景显式隔离标注 | 同上 |
| G4a | 复用 supplement-02 + 本轮重启链佐证 | 原 G4a（文件 H2 进程重启恢复）不变；本轮 G6b 即"进程中断→同库重启→按状态机继续消费（含退避重试）"的真实重演 | 不丢命令、不重业务（R5-R7 零副作用） | 队列代码本轮有修改，受影响验证=全量套件+G6b 重启链（绿） |
| G4b | 集成+真实 | 集成（新增 2 用例，全量绿）：双调度线程真并发每命令恰一次效果；stale 回收后新消费者完成、旧领取者迟到 complete/fail 均不得复活/改判，效果恰一次。在线：`[S3] g4b-evidence.out:3` 会签实例 RUNNING → `[S5][S6] :5-6` dsp P0 有界等待内 COMPLETED（单次结果）→ `[S7] :7` biz 被取消任务从待办消失 → `[S8][S9] :8-9` 迟到 NORMAL 受理后有界重试 4 次 FAILED"任务不存在" → `[S10] :10` 实例恰一次 APPROVED → `[S11] :11` dspProcessed=1/bizProcessed=0。最终快照重演：`g4b-late-final.out` LATE_FINAL=FAILED retry=4 任务不存在、取消前任务 id 精确捕获（INSTANCE 行） | 单 JVM 锁不作为证明（领取为 DB 条件更新 CAS）；无重复副作用（processed 计数+单 ACTION）；无身份串用（迟到命令以 biz 身份失败，dsp 记录不变） | 同实例跨通道顺序以"先结算者定结果+后到者确定冲突"证明；NORMAL 积压下 P0 优先的调度层证据仍为已锁定 L4 |
| G5a | 复用 L4/原证据 + 本轮佐证 | P0 事务可见性（锁定）；本轮 `[W1] g6b2（回执 §4/G6b）` P0 有界等待超时返回 ACCEPTED+受理标识、`[S5]` 等待内返回 COMPLETED——两种有界等待结局均真实呈现 | 同步超时不等于失败、不诱导重复命令（W3 显示仍 PENDING 且后续单次消费） | 父子命令（DRAFT_SUBMIT→FLOW_START）真实关联复用 supplement-02 G5a 证据，本轮 B5/B6 同结构再现 |
| G6a | 复用 + 本轮重采 | `fixtures03-run.out:12,17` bizPerms=[workflow:view/todo:view/my:view] vs dspPerms=+workflow:p0:dispatch（真实 /auth/me）；V51—V54 迁移在最终运行日志执行（backend-p4-final-04-frozen.log，Flyway 全链 54 条） | P0 权限仅显式角色持有（biz 角色无）；superAdmin 短路是平台既有语义，未用作显式授权证明 | 权限 seed 差异快照仍以 V51 迁移文件+全链测试为准 |
| G6b | 真实（最终 jar 双进程窗口） | 窗口：`[W1]`（§4 引用，下同）P0 受理 ACCEPTED（有界等待超时）→ `[W3][W4]` 双命令保持 PENDING（消费暂停）→ `[W5][W6]` 真实 API 摘除 dsp 角色、permissions=[] 且 p0:dispatch 消失 → `[W7][W8]` 可见范围收缩后 biz by-key=1000。恢复：`[R1] g6b2-phase2.out:1` P0 命令消费拒绝 FAILED/REJECTED"消费时缺少 P0 调用专用权限" → `[R2] :2` NORMAL 命令重试 4 次 FAILED"表单不存在"（不泄漏） → `[R3][R4] :3-4` 双草稿 FAILED+lastError+payload 保留 → `[R5—R7] :5-7` 实例/已办均为 0（零副作用）→ `[R8][R9 补读回] :8+readback` 拒绝后 dsp 正常提交 COMPLETED、实例 RUNNING（线程身份无残留） | 被拒无业务副作用；消费前拒绝的补偿使草稿可修正（不冻结）；拒绝后下一命令以正确身份成功 | 撤权为"移除用户角色"（P0 随角色消失）与"可见范围收缩"两种真实 API；窗口由 `--sw.bpm.command.*-poll-interval-millis=3600000` 配置化实现，进程重启即恢复消费（非代码开关） |
| G7a | 复用 L3 + 全量回归 | 两实现契约测试与集成测试在全量套件中持续绿（169 报告 0 失败）；默认 Spring 路径注入持久队列实现不变 | 替代实现不冒称外部 Broker（边界同前） | 本轮未改 MQ 接口契约 |
| G8a | 完成待 Planner 核对 | 最终快照绑定：运行服务=最终 jar（01:55 打包，进程 31852）；证据目录 35 文件哈希清单 `MANIFEST-SHA256.txt`（shasum -c 全 OK，活日志以冻结副本计入）；本轮 8 个代码变更文件列于 §2.2；迁移依赖与回退边界：V51 幂等 seed、V52 幂等键唯一索引、V53 个人菜单、V54 可见范围列（均前向追加；存在受理中命令时不可回退到不识别 sw_bpm_command/sw_bpm_draft 的旧消费者，停止调度器需同库重启恢复，删除受理记录不构成清理） | 不把未提交 HEAD 冒称发布指纹（本轮无 Git 提交授权，保持未提交事实）；不隐藏文件（清单含历史失败日志） | 历史 L1/L2 由本轮全量重跑等效重建（169 报告/1108/0/0/0，exit 0；Flyway 双方言链在套件内绿） |
| G8b | 完成 | 前端门禁在最终内容上复跑：typecheck=0、lint=0、test=121 files passed+1 skipped / 1153 tests passed+3 skipped、build=0（1840 modules transformed）——原始输出 `frontend-gates.log`/`frontend-build.log` | 数字从输出复算；构建仅 @vueuse/core Rolldown 警告（依赖包，非源码错误） | 本轮前端零改动；门禁与 supplement-02 内容一致并绑定新时间戳 |

## 5. 与方向的偏差与披露

1. **表单版本演进（D3"新版确认"）平台无 v3+ 路径**：表单发布即冻结元数据（1100），`publish` 仅 DRAFT→PUBLISHED（v1→v2），无再发布/下架。因此"表单新版本失效草稿"无法经受支持 API 构造；本轮以**流程绑定失效**（管理员发布新流程即重绑）覆盖 D3 的失效-保留-确认-修正语义，且提交端版本一致性守卫（草稿 formVersion≠当前发布版本显式报错）在代码与测试中保持。表单版本迭代能力属平台后续范围（工程宪法 §4.5"加列/改长度接缝 v2 接通（v1 不开）"），建议作为规划问题回传。
2. **管理员编辑已发布表单元数据=1100**：平台设计（发布即冻结）。G1c 的"管理员编辑表单及关联流程"以可见范围维护、流程图读写/发布（重绑）、config 保存为实际编辑面。
3. **平台既有问题（本轮未修，不顺手扩大范围）**：(a) 用户创建接口嵌套 `roleIds` 反序列化失败（JSON parse error），经 `PUT /system/user/{id}/roles` 根级数组绕开；(b) `PUT /system/role/{id}/menus` 不可重复执行（软删残留撞含 deleted 的唯一键）；(c) superAdmin 的"待办任务"菜单项路由落在"我发起的"（观察两次；admin 经登录重定向可达待办，普通用户菜单正常）。三项建议登记为独立问题。
4. **调度线程领取的租户边界**：`CommonTenantLineHandler` 空上下文回退超租户 0，当前调度线程领取实际只覆盖 tenant=0 命令；非零租户登录本就是平台既定边界（本轮夹具亦为 tenant=0），未来启用非零租户时需将 `sw_bpm_command` 纳入领取可见性设计（已披露，未改动全局租户配置）。
5. **G6b 撤权方式**：P0 撤权=移除用户角色（角色-菜单重绑接口因披露项 (b) 不可重入，故不采用改角色菜单方式）；可见范围撤权=管理员更新 visibilityScope。两者均为真实管理 API。

## 6. 风险与回退边界

- 主服务（8080，H2 内存库）中本轮创建的夹具与业务对象随进程停止销毁；G6b 文件库 `target/p4-g6b-db2.mv.db` 已删除并读回确认。无生产/远程/真实设备触碰。
- 升级/回退：V52/V54 均为追加式变更；存在受理中命令（sw_bpm_command PENDING/PROCESSING）或受理中草稿（SUBMITTING）时，不可回退到不识别对应表结构的旧消费者；停止调度器后经同库重启可恢复消费（G6b2 实证）。
- 本轮未执行 Git commit/push、远程发布、生产部署（未被授权）；两仓工作区保持未提交变更。

## 7. 自验结论

剩余缺口原子 G1a/G1c/G2a/G4b/G6b 已按最新原子账本以最终快照上的真实行为证据关闭；G1b/G3a/G3b/G4a/G5a/G6a/G7a/G8b 复用已锁定/已采证据并在受影响范围内重验。自验结论：VERIFYING，等待 Planner 按原子逐项独立复验。Executor 不写 PASSED/COMPLETED、不核销 P4、不更新正式功能计数与阶段三终态。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/p4-oa-personal-center-dual-dispatch/receipts/completion-p4-supplement-03.md","evidence":["Smart-WorkFlow-Server/product/p4-oa-personal-center-dual-dispatch/evidence/04/g1c-evidence.out","Smart-WorkFlow-Server/product/p4-oa-personal-center-dual-dispatch/evidence/04/g2a-evidence.out","Smart-WorkFlow-Server/product/p4-oa-personal-center-dual-dispatch/evidence/04/g4b-evidence.out","Smart-WorkFlow-Server/product/p4-oa-personal-center-dual-dispatch/evidence/04/g4b-late-final.out","Smart-WorkFlow-Server/product/p4-oa-personal-center-dual-dispatch/evidence/04/g6b2-phase2.out","Smart-WorkFlow-Server/product/p4-oa-personal-center-dual-dispatch/evidence/04/fixtures03-run.out","Smart-WorkFlow-Server/product/p4-oa-personal-center-dual-dispatch/evidence/04/MANIFEST-SHA256.txt","Smart-WorkFlow-Server/product/p4-oa-personal-center-dual-dispatch/evidence/04/browser-my-instances-approved.png"],"feature_status":"VERIFYING","work_items":[{"id":"G1a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"待Planner复验四入口生命周期证据"},{"id":"G1b","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"复验可见范围重采证据"},{"id":"G1c","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"复验反向403与绑定解析"},{"id":"G2a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"复验受理前校验与失效链"},{"id":"G3a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"复用已采证据复验"},{"id":"G3b","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"复用已采证据复验"},{"id":"G4a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"复用原证据并核对重启链"},{"id":"G4b","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"复验并发测试与在线冲突"},{"id":"G5a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"复验有界等待双结局"},{"id":"G6a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"复验权限差异回读"},{"id":"G6b","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"复验窗口实验终态"},{"id":"G7a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"复验契约映射"},{"id":"G8a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"核对本回执与清单"},{"id":"G8b","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"复验前端门禁输出"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待Planner对supplement-03按原子独立复验","next_action_type":"WAIT_PLANNER","progress_fingerprint":"p4-supplement-03:evidence04-manifest-35:server-fulltest-1108-0-0-0:fe-gates-1153-3","progress_basis":{"files_changed":["sw-bpm-process/queue/PersistentBpmCommandQueue.java","sw-bpm-process/queue/CommandDispatcher.java","sw-biz-form-api/facade/FormDataSubmitFacade.java","sw-biz-form-biz/service/FormSubmitService.java","sw-biz-form-biz/service/FormDataSubmitFacadeImpl.java","sw-bpm-process/service/DraftSubmitService.java","sw-bpm-process/test/CommandQueueIntegrationTest.java","sw-bpm-process/test/BpmDraftControllerTest.java"],"tool_actions":["mvn -q test（两次：首次暴露2失败并修复后复跑 exit 0）","mvn -q package -DskipTests（最终 jar）","java -jar 启动/停止 dev 与 G6b 隔离进程（8080/18082/18083）","python3 夹具与五组行为证据脚本","浏览器真实操作（登录/发起/提交/审批/已办，含验证码查看）","shasum -a 256 -c 清单回读","文件库删除与读回"],"new_evidence":["g1c-evidence.out","g2a-evidence.out","g4b-evidence.out","g4b-late-final.out","g6b2-phase2.out","g6b2-phase2-readback.out","MANIFEST-SHA256.txt","browser-my-instances-approved.png"],"closed_work_items":["G1a","G1b","G1c","G2a","G3a","G3b","G4a","G4b","G5a","G6a","G6b","G7a","G8a","G8b"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"maven","outcome":"SUCCEEDED","detail":"最终源码 mvn -q test exit 0；169 份 Surefire 报告合计 1108/0/0/0；mvn -q package exit 0（sw-bootstrap 最终 jar）"},{"tool":"browser","outcome":"SUCCEEDED","detail":"真实浏览器完成发起→提交→审批→已办→已通过链；终态截图与 DOM 记录在案；admin 待办菜单路由异常已披露"},{"tool":"http-api","outcome":"SUCCEEDED","detail":"夹具与 G1c/G2a/G4b/G6b 全部行为断言经真实 REST 往返并回读；反向断言（403/1401/400/FAILED 原因）全部命中"},{"tool":"filesystem","outcome":"SUCCEEDED","detail":"G6b 文件库删除后读回不存在；证据清单 35 项 shasum -c 全 OK"}],"browser_status":"OPERABLE"}
