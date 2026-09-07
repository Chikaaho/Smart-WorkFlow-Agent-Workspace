# v0.0.2 OA 完善 — 执行回执 03（一级补充提示执行轮，自验通过，待规划验收）

2026-09-07；执行角色。唯一缺口入口：`planning-execution-prompt-v0.0.2-oa-01.md`（R1—R9）；验收权威：`../ready/direction-v0.0.2-oa.md` §3.1/A1—A7；事实依据：`planning-review-v0.0.2-oa-02.md`。**不自判 PASSED/COMPLETED；A8/阶段三/发布保持后置。**

## 0. 候选与对象（提示 §4.1）

本地 `develop`：Server `ef0fb12 + 69ad744 + 4cba211`、Web `a427621 + 0875d8a + ef1fdc7`。最终证据快照对象（gap-round3）：MGR=2096817410661822466、EMP=2096817411181916161、APP=2096817411655872514、STR=2096817730850795522（stranger001，无角色、与实例无关）；实例 A/BK=5599df8b…、双节点实例 INST3=2096818034610679809、NID=2096818165842063361。生效证据包：`evidence/gap-round3/`（`api-r3-final.txt` 唯一生效 API 流 + 5 张截图 + 5 份门禁日志 + `EVIDENCE-INDEX.md` 脱敏索引 + `SHA256SUMS.txt`）；`api-r3b/api-r3c` 为同轮中间采集，仅作追溯。验收02 §2 锁定项未重验（R1/R5/R7 修复未触及 A2 分类、催办并发、显隐代表链的实现路径）。

## 1. 原子账本逐项（原子ID → 原件路径:行号 → 实际结果 → 边界）

### R1 后台入口（原 /404 缺陷）— 修复 + 收敛
- 根因：`Web/src/foundation/area.ts` firstAdminLeafPath 用目录组合路径（/system/dict），而动态路由按菜单原始 path 扁平注册（实际 /dict）→ 404。修复：返回叶子原始 path（Web `ef1fdc7`）。
- 正向：`gap-round3/api-r3-final.txt` 无（浏览器流）；`ui-r3-mgr-enter-admin.png`（工作台点击进入后台 → `/dict` 字典管理页，零 /404）；`ui-r3-mgr-admin-refresh.png`（后台深链刷新保持）；`ui-r3-mgr-portal-refresh.png`（返回前台 → /workspace 且刷新保持）。
- 反向：`api-r3-final.txt:280` 撤权（roles=[]）→ `:283-286` 管理请求 403、`/system/auth/menus` 返回 `[]`；`ui-r3-mgr-revoked-no-entry.png` 撤权后工作台无「进入后台」按钮。

### R2 抄送矩阵 — 补齐
- 不同实例筛选：`api-r3-final.txt:181` filter-pi（实例A）total=1、`:184` filter-pi-miss total=0（keyword 覆盖 process_instance_id 为本轮 Server `4cba211` 修复——原契约无实例检索，属实现缺口）。同时间稳定分页：`:193-199` pageSize=1 翻页 page1→page2 无重漏、page3 空且 total=2。时间窗：`:187` total=2 / `:190` total=0。
- 反向：`:178/:268` 陌生人查抄送详情 → 403 仅接收人可查看；`:109` 发起人越权审批 APP 任务 → 命令通道受理后异步核对 **FAILED「无权处理该任务」**（`:109-171` 轮询段）。
- 同事件去重：**DB 级集成测试** `NotifyFacadeIdempotencyIntegrationTest`（2 用例，H2 含 uk_sw_notify_msg_idempotency）：同幂等键三次投递仅 1 行、不同键各自落行。边界：引擎不会对已执行 COPY 节点自发展开二次投递，行为级重复场景不存在可触发入口（与回执02 同口径，本期以 DB 集成测试加强）。

### R3 催办目标变化 — 补齐
- `api-r3-final.txt:100` 双节点实例（a1=超管 → a2=APP）一级审批通过后首催 → **ACCEPTED 已通知待办人: [2096817411655872514]（=APP）**；`:103` APP 收件箱含催办通知。目标随活动任务变化匹配。
- 边界：同一实例 10 分钟冷却内无法二催（方向冻结语义），故以「任务移动后的首催」证明目标跟踪；「运行中无活动审批任务拒绝」分支由 `BpmUrgeServiceTest` 锁定（H2 运行时无法在不违反冻结语义下构造 RUNNING 无任务状态）。

### R4 重登恢复与收敛 — 补齐
- 重登恢复：`ui-r3-emp-relogin-layout.png` EMP 全新会话恢复保存布局（待办整行、抄送隐藏、常用事项入口渲染）；服务端回读 `api-r3-final.txt` `S0-emp/mgr-layout-read`（两用户配置独立）。
- 反向：无权组件不请求数据、失效收藏不可执行——等强度前端测试 `Web/src/modules/workflow/views/WorkspaceHome.spec.ts`（4 用例全绿，计入门禁）：隐藏组件零查询调用；不在可见目录的收藏不渲染入口、点击不存在；span 渲染。撤权收敛已在 R1（按钮消失 + 菜单空 + 管理请求 403）。

### R5 附件对象级授权 — 反证消除 + 图片链
- 上轮 200 反证成因：所用 APP 恰为该实例**抄送接收人**（hasRecordAccess 接收人分支放行），属测试对象错误；本轮以真正无关用户 STR 复验。
- 正向：`api-r3-final.txt` 发起人/审批人/接收人下载附件均 200（`R5-initiator/approver/recipient-download`）；真实图片上传（IKEY，`R5-image-upload`）关联进年假实例 photo 字段、审批人 task-detail 贯通（`R5-approver-task-detail`）。
- 反向：`:58`（STR 附件）403、STR 图片 403、STR 他记录 403、伪造键（../etc/passwd）404 文件不存在——`R5-stranger-*`/`R5-forge-key` 段。零越权内容返回。

### R6 规则测试原件 — 随 R8 归集
`backend-mvn-test.log`（原始全量日志）含 `FormVisibilityRulesTest`（EQ/NE/EMPTY/NOT_EMPTY×ALL/ANY、无环拒绝）、`BpmCatalogServiceTest`、`NotifyRecordServiceTest`、`NotifyFacadeIdempotencyIntegrationTest` 段；候选身份=本回执 §0 提交。前端 `frontend-vitest.log` 含 WorkspaceHome.spec 4 用例与全量 1168。

### R7 通知重发/批量 — 修复 + 完整链
- 修复1：节流不再把原始发送流水（attemptNo=1）计入窗口——首次合法重发放行（`NotifyRecordServiceImpl`，`NotifyRecordServiceTest` 新增 2 用例：attemptNo=1 不节流、attemptNo=2 窗口内拒绝）。
- 修复2：批量发送支持可选渠道（`NotifyController` + `NotifyBatchSendReq.channel` + `NotifyMessageService.resolveRecipientUserIds`）：非 IN_APP 渠道逐接收人经统一 Facade 投递，每接收人独立结果与尝试流水；缺省 IN_APP 走原入口，幂等边界不变。
- 证据链（`api-r3-final.txt`）：`:208` detail-pre attempt=1 → `:211` **合法重发受理** → `:277` **detail-final attempts=[(1,FAILED),(2,FAILED)]** → `R7-concurrent-resend-x5` 5 路全 400「重发过于频繁」**零新增 attempt** → `:229` 有效批量成功 → `:232` 无效接收人「无有效接收人」拒绝 → `:235` FEISHU 渠道批量 2 接收人 → 2 条 FAILED 子记录（`R7-failed-subs`）→ `R7-sub-resend` 子记录可重发、attempt 累积（`R7-sub-detail-after`）→ `R7-inst-status` 审批状态不被通知失败改写。
- 反向：`R7-emp-resend-403`/`R7-emp-detail-403` 低权限拒绝。

### R8 工程门禁原件 — 归集
- `backend-mvn-test.log`：`MAVEN_OPTS=-Xmx2g mvn test` **退出码 0，BUILD SUCCESS**，**180 份 Surefire 报告 / 1154 tests / 0 failures / 0 errors / 0 skipped**（含 H2 全链 Flyway 迁移执行记录，`Migrating schema` 548 处、V1—V58；PG 方言由全量内双方言迁移测试承担，本轮未起本地 PG，如实注明）。
- `frontend-typecheck.log`/`frontend-lint.log`/`frontend-vitest.log`/`frontend-build.log`：**退出码均 0**；124 files passed+1 skipped / 1168 tests passed+3 skipped。
- `SHA256SUMS.txt`：13 个证据文件指纹，`shasum -c` 回读 13/13 OK（清单排除自身）。
- 断言调整说明：3 个通知控制器集成测试补 NotifyFacade mock Bean（控制器新增依赖所致，非弱化）；`NotifyRecordServiceTest` 6 用例（新增节流正反 2 例）。

### R9 证据卫生 — 收敛
- 密码脱敏：`SysUser.password` JSON WRITE_ONLY（DTO 层，Server `4cba211`）+ 采集层正则（api 脚本）；`api-r3-final.txt:253/:271` user detail/page 响应无 password 字段。
- 扫描：生效原件（api-r3-final/api-r3b/api-r3c）password|token|cookie|BCrypt 散列 正则扫描 **零命中**。
- 生效索引：`EVIDENCE-INDEX.md`（原子ID → 原件 → 结论 → 对象登记）；混合历史段（api-r2*、api-r3b/c、partial）明确标注不作为完成证据、保留不覆盖。

## 2. 提交门禁自答（提示 §6）

对象一致（final 时间线单一对象集）✅；正向成立（R1—R9 逐项，见 §1）✅；反向成立（403/404/无权 FAILED/并发零新增/零密码回传）✅；原件可读（行号索引 + SHA256 清单回读通过）✅；最后候选一致（全部证据产生于 4cba211/ef1fdc7 及其前置 69ad744/0875d8a）✅；清单回读通过 ✅；剩余可执行项 0 ✅。

## 3. 偏差与边界

- 同事件去重、无活动任务拒绝两条以集成测试/单测锁定（行为链无触发入口或违反冻结语义），如实标注。
- R8 的 PG 方言沿全量内双方言迁移测试承担，未起本地 PG。
- 通知渠道批量为本轮新增能力（direction §3.1「不能默认批量已具备同等保证」的实现补齐），IN_APP 默认路径未改动。
- 历史 api-r2* 附件保留不覆盖、不再引用；api-r3b/c 为同轮中间件（部分对象被 final 替代）。
- Git：本地 develop（Server 4cba211、Web ef1fdc7），未推送、未触 Release。

## 4. 自验结论

R1—R9 按一级补充提示逐项完成，可判定提交条件全部满足；自验通过，**提交 VERIFYING / EXECUTION_SUBMITTED，待规划独立验收**。
