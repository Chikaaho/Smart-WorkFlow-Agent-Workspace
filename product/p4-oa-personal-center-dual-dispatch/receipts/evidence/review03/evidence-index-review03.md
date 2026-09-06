# P4 review03 证据索引（原子 → 原始附件 → 断言 → 边界）

2026-09-06；Executor。对应提示02 §4 索引规范：ID、原始附件路径/行号、证据层级、对象标识、正反断言、边界。
路径相对本目录（`receipts/evidence/review03/`）。层级标注：真实 / 集成 / 测试 / 文档。
哈希：`COLLECTION-MANIFEST.json`（源/副本 sha256 与过滤摘录的原件指针）。

## 归集原件（Planner 可读副本）

- `from-backend/03/`：supplement-02 引用的后端仓 evidence/03 原件（含 `live-business-20260905.md`、`current-api-browser-20260905.md`、`current-verification-20260905.md`；大日志为过滤摘录，原件留后端仓）。
- `from-backend/04/`：supplement-03 引用的 evidence/04 原件（`g1c-evidence.out`、`g2a-evidence.out`、`g4b-evidence.out`、`g6b-phase1.out`、`g6b-phase2.out`、`fixtures03-run.out`、`MANIFEST-SHA256.txt` 等）。
- `new-05/`：本轮（supplement-04）新增/变更证据与受影响源码/测试快照。

## 原子索引

### G1a 发起入口与四入口生命周期
- 层级：真实（浏览器 DOM/AX + 同对象 API/持久化读回）。
- 新入口 DOM：`new-05/browser-initiate-entry.png`（我的草稿页"可发起的已发布表单"区，业务表单行带"发起"按钮，无流程选择器）；
  入口实现 `new-05/MyDrafts.vue.txt`（initiateForms 段，publishedFormDefs → 发起 → `/form/form-render/{formKey}?mode=draft`）；测试 `new-05/MyDrafts.spec.ts.txt`（10 用例含发起导航）。
- 闭环对象：biz 用户 p4biz03=2096313991404638209；草稿 G1a新入口链=2096319281688662017（formVersion 绑定 bpm_0809d9d64ff8463b 服务端解析）；实例 3db5d007-c585-4e72-b17c-52dece5e1509。
- 正向：发起→填报→半填保存（"草稿已创建"）→ 编辑恢复（草稿回填）→ 补齐提交（"提交成功"）→ admin 待办通过（"审批通过"）→ biz 我发起的=已通过（`new-05/browser-my-instances-approved.png`，行"3db5d007 … 已通过"）。
- 反向：半填提交被受理前字段校验拒绝（`from-backend/04/g2a-evidence.out:1-2`，code=1401、草稿 EDITING、commandId=null）；保存不启动审批（B 链草稿 EDITING 无命令）；普通用户无管理菜单（登录快照仅四个人口）。
- 边界：admin 待办菜单"错路由"经干净会话复现为旧 SPA 状态残留，非产品缺陷（干净登录后 待办任务→/workflow/todo 正常，含 G1a新入口链任务行）；重登恢复复用 supplement-02/03 浏览器链（前端本就不持久化会话，刷新即回登录属设计）。

### G1b 可见范围
- 层级：真实。`from-backend/04/g1c-evidence.out:8-12`（restrict→列表/详情过滤→恢复全租户）；消费端同口径复核 `new-05/g6b3-cross.out` X2（不可见表单发起受理拒绝"表单不存在"）。
- 反向：范围外用户读定义/发起被拒且响应不泄漏；撤权保留本人草稿见 `from-backend/04/g6b-phase2.out:4`（biz 草稿 FAILED 但 payload 原样）。
- 边界：跨租户以隔离服务层验证覆盖（租户拦截器列级隔离为平台共享内核），无跨租户登录 UI，符合审查03 §3.3。

### G1c 管理编辑 / 绑定唯一 / 历史不变
- 层级：真实（DOM+API）。管理员 config 编辑入口：设计器打开草稿表单（`/form/designer/{id}`，DOM 含 表单名称/控件库/字段配置/保存）→ 保存（"草稿已保存"）→ 定义回读 title 已变为"P4补证04草稿配置表单（管理员已编辑）"（本文件 §G1c 会话记录；API `GET /form/def/{id}/definition` code=0）。
- 普通编辑拒绝：`new-05/g1c2-evidence.out:1`（biz config 保存 403）；`:2` + 会话记录 D2b（定义未变，applicant required=true）。
- 绑定篡改忽略：`new-05/g1c2-evidence.out:3`（PUT draft 携带 processDefKey=bpm_hacked → 读回不变）。
- 唯一绑定/历史不变：`new-05/g1c2-evidence.out:4-8`（D4 实例创建 processDefKey=bpm_ec6ba25597ed427e → D5 管理员发布新流程重绑 → D6 旧实例 processDefKey 不变 → D7 新草稿解析新绑定）。
- 边界：已发布表单元数据冻结（1100）为平台设计；可见范围/流程图/发布为已发布表单的实际管理面。

### G2a 草稿/提交/失效
- 层级：真实。`from-backend/04/g2a-evidence.out:1-2`（受理前必填 1401+零残留）；`:3-8`（冻结、幂等 duplicated=true 同 commandId、COMPLETED/SUBMITTED 一致）；`:9-13`（绑定失效→重试 4→FAILED→payload 保留→修正重提 COMPLETED）。
- 反向：受理中改/删被拒（B2/B3 明确消息）；改内容不复用旧结果（submitSeq 递增，C4 新 commandId）。
- 边界：表单 v3+ 平台无路径（审查03 §3.1 接受）；流程绑定失效链 + 提交端版本守卫（草稿 formVersion≠当前发布版本显式报错，代码 `DraftSubmitService` + 控制器测试）覆盖失效语义。

### G3a 会签取消
- 层级：真实（原件归集）。`from-backend/03/live-business-20260905.md` G3a 段（实例 39662b74…：两活动任务→dispatcher 完成后实例 APPROVED/progress 空→business 重放 404 任务不存在→ACTION 仅 dispatcher）。
- 对象身份：表单 p4_oa_consensus_20260905、任务 396a222a/396b33a0。
- 边界：隔离夹具，不冒称历史生产数据。

### G3b 退回与旧历史兼容
- 层级：真实 + 测试。退回：`from-backend/03/live-business-20260905.md` G3b 段（a2 RETURN→a1 重新生成，实例 RUNNING）。
- 兼容断言（新增，隔离夹具）：`BpmMyProcessedControllerTest.myProcessed_defaultSource_dedupActionOverHistoryCompat`（`new-05/backend-full-test-final.log` 内 3/0/0/0）——无 ACTION 的旧 finished 历史以 HISTORY_COMPAT 保留；已有 ACTION 的任务跨源去重；取消/未办理任务不在 finished 契约内故不冒充。
- 边界：不要求生产旧库；默认已办=ACTION 权威分页+兼容去重补齐（控制器本轮修复的合并语义），总条数=两源计数之和（重叠为上界，已披露）。

### G4a 持久恢复
- 层级：集成 + 真实。原件：`from-backend/03/live-business-20260905.md` G4a（文件 H2 两进程：停前 PENDING→重启 COMPLETED→业务完成）；本轮队列实现变化后受影响复核=全量套件 + G6b2 重启链（受理→进程重启→按状态机继续消费，`new-05/g6b2-phase2.out` R1/R2 的重试与终态）。
- 反向：不丢命令（同 id 恢复）、不重复业务（幂等键+单次实例）。

### G4b 同实例并发 / 租约交接
- 层级：集成（真实处理器+受控外部效果适配器，审查03允许）。`new-05/CommandLeaseHandoverOverlapTest.java`：
  - 场景：同任务 t9（u1/u2 可办理）；u1 NORMAL 命令被 A 领取并**业务执行中途阻塞**；stale 回收（租约交接，重叠成立）；u2 P0 命令与消费者 B 完成任务。
  - 正向：`[R] EFFECTS=["8->t9:APPROVE"]` 恰一次；cmdP COMPLETED；cmdN FAILED（确定性"任务不存在"）。
  - 反向：旧持有者迟到执行被拒（oldClaimantFailure 含"任务不存在"）；迟到写回/失败处理不改终态（complete/fail 均无效）；执行尝试身份序列 7→8→7 无串用。
- 在线同实例跨通道（真实 API）：`new-05/g4b-evidence.out:5-11`（P0 结算→取消任务消失→迟到 NORMAL FAILED"任务不存在"→processed dsp=1/biz=0）；`new-05/g4b-late-final.out`（精确捕获取消前任务 id 的最小重演）。
- 边界：外部效果以受控适配器记录（等价任务完成一次语义），未触真实引擎/设备。

### G5a P0 发起/流转/父子
- 层级：真实（原件归集 + 本轮重采）。原件：`from-backend/03/current-api-browser-20260905.md` G5a 段（P0 受理 COMPLETED、result recordId、实例 RUNNING→APPROVED、待办完成后 APPROVED）；父子命令：草稿命令 COMPLETED 后 FLOW_START 子命令落实例（本轮 G1c2 D4 链再现：命令 COMPLETED→实例 RUNNING，父命令成功≠子流程启动——实例以 recordId 为 businessKey 建立并回读）。
- 有界超时回查：G6b2 W1（P0 等待超时返回 ACCEPTED+受理标识，随后单次消费）。
- 反向：不把父命令完成冒称流程启动（父/子命令 id 可分查）；子流程不回流普通积压（P0 受理的 FLOW_START 同通道受理，本轮未变）。

### G6a 权限 seed 与授权
- 层级：文档（已锁）+ 真实回读。V51 副本内容已锁（审查03 §1）；实际授权回读 `new-05/fixtures03-run.out` bizPerms/dspPerms 与 `new-05/g6b3-cross.out` X1（仅P0 身份 permissions==[workflow:p0:dispatch]）、X7（两者）。
- 反向：一般管理员（admin 除外语义=superAdmin 平台既有）无默认 P0；V51 不向 role_id=2 发放（副本注释）。

### G6b 撤权窗口与交叉
- 层级：真实（文件 H2 双进程，最终 jar）。`from-backend/04/g6b2-phase2.out:1-8` + 阶段1 W1—W8（`from-backend/04/g6b-phase1.out` 同语义，g6b2 输出于本轮会话记录与回执 §4）：
  - 受理（消费暂停）→ 撤 P0（移除角色，permissions=[]）→ 恢复消费 → FAILED/REJECTED"消费时缺少 P0 调用专用权限"（R1）；
  - 可见范围撤权 → 重试 4 → FAILED"表单不存在"（R2，不泄漏）；草稿 FAILED+payload 保留（R3/R4）；实例/已办=0（R5—R7）；拒绝后正向提交 COMPLETED+实例 RUNNING（R8+readback，身份无残留）。
- 交叉：`new-05/g6b3-cross.out` X1—X7（仅P0/仅业务/两者矩阵；仅P0+不可见表单受理拒绝=权限不授予对象）。
- 租户受理边界：非超租户命令当前无可靠消费路径 → 受理前明确拒绝（`CommandAcceptService`/`DraftSubmitService` 本轮新增守卫；单测 `CommandAcceptServiceTest.acceptTaskAction_shouldRejectNonSuperTenantBeforeAccept`；集成测试租户夹具对齐 0）。
- 边界：移除角色为合法撤权方式（角色菜单重绑接口缺陷未采用，已披露）。

### G7a 契约映射
- 见 `g7a-contract-mapping.md`（断言→用例→行号→两实现运行结果；默认路径注入持久实现）。

### G8a 交付范围与指纹
- 工作区证据包：本目录（含 COLLECTION-MANIFEST.json 源/副本哈希；大日志为过滤摘录并记录原件指针）。
- 未提交源码/产物/运行对应：本轮修改文件清单见回执 §2.2；最终 jar=sw-bootstrap-1.0.0-SNAPSHOT.jar（01:55 打包，sha256 见 COLLECTION-MANIFEST 后续补充行）；运行实例 PID/启动时间与 trimmed 日志（backend-p4-final-05.trimmed.log 含 Started/调度器/迁移行）对应。
- 迁移/回退与中台映射：`from-backend/04`（V52/V54 迁移文件）、supplement-02 §4 映射（已锁定文档边界）+ 本回执 §契约映射。

### G8b 前端门禁
- `new-05/frontend-gates.log`（typecheck/lint/test 原始输出：exit 0×3；121 files passed+1 skipped；1152 tests passed+3 skipped——本轮 MyDrafts 用例合并导致 -1，与源码变更一致）、`new-05/frontend-build.log`（exit 0；1841 modules transformed）、源码快照 `new-05/MyDrafts.vue.txt`/`MyDrafts.spec.ts.txt`。

## 06 追加包（supplement-05，提示03 账本）

### G1a 对象映射与截图更正
- `new-06/g1a-object-map.md`：草稿 2096319281688662017 → 父命令 2096319703472066561(DRAFT_SUBMIT) → 子命令 2096319705544052738(FLOW_START) → 业务记录 3db5d007 → DB 实例 2096319707909640193 → 引擎实例 0bef429e → 任务 0befb7db（n_d1/admin）。
- `new-06/browser-3db5d007-final.png` / `browser-3db5d007-dom.txt`：**正确对象**的终态截图与 DOM（旧图 browser-my-instances-approved.png 登记为历史，不再作为 3db5d007 证据）。
- 管理员待办同序列复现：干净登录后 待办任务→/workflow/todo 正常（含 3db5d007 行）；原异常判定为重启后旧标签页残留渲染状态（g1a-object-map.md 复现说明段）。

### G1b 范围撤销后保存/提交
- `new-06/g1b-g2a-g6a-evidence.out` B1—B5：撤权→保存 404 表单不存在（不泄漏）→提交拒绝→草稿内容原样（payload 回读）→恢复后可编辑。实现修复：`new-06/BpmDraftController.java.txt`（payload 更新前 requirePublishedForm）。

### G1c 字段值回读
- `new-06/browser-designer-field-edit-dom.txt`：设计器内选中 申请人 字段→字段显示名改为 申请人姓名→保存"草稿已保存"→API 回读 `{"label":"申请人姓名","required":true}`。
- D2/D2b 读取层级解释：D2 首次以 biz 身份读 `/definition` 得 403（读取即被拒，无从比对）；改用 admin 读取 `/definition` 返回**JSON 字符串包裹**的定义文本，先前的子串匹配在外层 JSON 转义上误判 false；D2b 解析内层 JSON 后确认 required=true、字段数 3。两层读取均为真实响应，差异在解析层级。

### G2a 受理前已知失效 + 版本守卫
- `new-06/g1b-g2a-g6a-evidence.out` C1—C5：管理员重绑后提交 → 受理前 400"流程已由管理员更新，请确认更新"（C1，无命令 C2）→ 用户 refreshFormVersion 确认重绑（C3）→ 提交受理并 COMPLETED（C4/C5）。
- 版本守卫：`BpmDraftControllerTest` "表单版本不一致 → 报错且草稿状态保留"（副本 `new-06/BpmDraftControllerTest.java` :289 区段）。

### G4a 最终代码重启恢复
- `new-06/g4a-phase1.out`（18084 暂停消费受理 PENDING）→ 进程停止 → `new-06/g4a-phase2.out`（18085 同库重启：命令 COMPLETED → 实例 RUNNING → dsp/admin 两次真实审批 → APPROVED；dspProcessed=1 无重复）。
- 对象：draft 2096434531436044290 / command 2096434531910000641 / record d5d88872…。

### G4b 真实审批核心重叠
- `new-06/CommandOverlapRealEngineTest.java`（sw-bootstrap 测试域，全模块装配）+ `new-06/OverlapH2TestConfig.java`：
  真实 Flowable + 真实 BpmTaskFacadeImpl + 真实 TaskActionService + 真实调度循环；业务提交后 ack 丢失 → 回收 → B 以真实审批核心重执行 → 引擎/门禁确定性"节点已被处理" → 终态 FAILED；旧持有者迟到 ack 被终态守卫拒绝；ACTION 恰一条、通知恰一次、任务无残留、实例 APPROVED。
- 测试结果：`new-06/backend-full-test-final.log`（exit 0；CommandOverlapRealEngineTest 1/0/0/0）。

### G6a 一般管理角色
- `new-06/g1b-g2a-g6a-evidence.out` G1/G2：一般管理角色（5,20,23 无 312）→ permissions=[workflow:view,todo:view,def:view] 无 P0 → P0 提交 403"缺少 P0 调用专用权限"。

### G6b R9 关联与非零租户
- R9 替代关联（原 g6b2 文件库销毁后按提示03重采）：X3 命令 2096314287589609473 COMPLETED → recordId 42d22ada → 实例 2096314289212805122（businessKey=recordId，RUNNING，归属仅P0 用户）——同会话 X3/X4 输出与本次读回一致。
- 非零租户受理前拒绝源码：`new-06/DraftSubmitService.java.txt`（requireConsumableTenant）/`new-06/CommandAcceptService.java.txt`；单测 `new-06/CommandAcceptServiceTest.java`（非超租户拒绝、不 enqueue）。

### G8a/G8b 更正与原件
- 清单口径：COLLECTION-MANIFEST-new05.json 为 **18 份文件哈希 + 1 条 jar 指纹元数据**（非 19 份文件）；本轮 `COLLECTION-MANIFEST-new06.json` 同口径登记。
- 索引指针更正：g6b2-phase1/2 已归集本目录（原误指 new-05）；V51/V52/V54 副本在 `new-06/migrations/`（原误指 from-backend/04）。
- 后端计数原件：`new-06/surefire-summary.txt`（工具复算）+ `new-06/backend-full-test-final.log`（mvn -q test 完整输出，exit 0；静默输出无 Tests run 行为 -q 语义）。
- 时点绑定：最终源码 → `mvn -q package`（final-06 jar，运行于 8080）→ 夹具/在线证据（g1b/g2a/g6a/g4a）→ 全量 mvn -q test（exit 0）→ 归集清单。jar sha256 见 COLLECTION-MANIFEST-new06.json。
