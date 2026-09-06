# P4 个人中心双通道补证回执 04（对应二级提示02）

日期：2026-09-06；角色：执行；等级：XL；功能状态：VERIFYING（自验完成，待 Planner 独立复验）
承接：`planning-execution-prompt-p4-02.md`（唯一当前入口）+ `planning-review-p4-03.md`；方向与边界未变：普通用户从**已发布表单 → 发起 → 填报**，流程由系统解析；不建设流程中心/分类/双视角页面，不新增完整版本管理，不改全局租户策略。

## 1. 执行顺序与结论（按提示02 §1）

1. **归集**：后端仓 `evidence/03`、`evidence/04` 原件已归集至工作区 `receipts/evidence/review03/from-backend/{03,04}/`（49 项：41 项原样、8 项超大日志为过滤摘录并记录原件指针与哈希；`COLLECTION-MANIFEST.json` 全部 identical）。原件未删除，仍留后端仓。
2. **索引**：`receipts/evidence/review03/evidence-index-review03.md` 为唯一原子→附件行号→断言→边界索引；G7a 映射独立成 `g7a-contract-mapping.md`。
3. **修差异**：G1a 发起入口改造（MyDrafts"新建草稿"弹窗移除，改为页内"可发起的已发布表单"列表+发起按钮）；已办默认来源合并修复（兼容分支不可达缺陷）。
4. **补证**：G1c 编辑/篡改/历史不变、G3b 隔离历史兼容、G4b 租约交接重叠窗口、G6b 仅P0 交叉与租户受理边界。
5. **收尾**：门禁（后端全量 1111/0/0/0 exit 0；前端四门禁 exit 0，1152+3）、清单回读（19/19 一致）、隔离环境收尾。

## 2. 本轮代码修改（含依赖说明）

后端（Smart-WorkFlow-Server）：
- `BpmMyProcessedController.java`：修复默认（未指定来源）已办查询的合并语义——原实现 includeAction 分支提前 return，兼容来源与去重守卫不可达（确证缺陷）。现在默认=ACTION 权威分页 + 兼容来源按 taskId 去重补齐；total=两源计数之和（双源重叠任务存在时为上界，披露）。
- `DraftSubmitService.java` / `CommandAcceptService.java`：受理前租户边界——非超租户(0)命令当前无可靠消费路径，受理前明确拒绝（不产生命令、不永久 PENDING）。审查03 §3.3。
- 测试：`BpmMyProcessedControllerTest` +1 兼容去重/排除矩阵用例；`CommandAcceptServiceTest` +1 非超租户拒绝用例（夹具租户对齐 0）；`CommandLeaseHandoverOverlapTest`（新增）租约交接重叠窗口；`BpmDraftControllerTest`/`CommandQueueIntegrationTest` 夹具对齐。

前端（Smart-WorkFlow-Web）：
- `MyDrafts.vue`：移除"新建草稿"弹窗（表单下拉选择），改为页内"可发起的已发布表单"列表（`GET /form/def/published`，服务端可见范围过滤），每行"发起"→ `/form/form-render/{formKey}?mode=draft`；无任何流程选择/流程标识输入。`MyDrafts.spec.ts` 同步（10 用例）。

未修改旧审查/源证据；无新依赖；未提交推送。

## 3. 原子对照（ID → 附件 → 结果 → 边界；行号见 `evidence-index-review03.md`）

| ID | 结果 | 正向 | 反向 | 边界 |
|---|---|---|---|---|
| G1a | 关闭（真实浏览器） | 新入口 DOM 截图 `new-05/browser-initiate-entry.png`；发起→填报→半存（草稿已创建）→编辑恢复→补齐提交→admin 待办通过→biz 我发起的=已通过（`new-05/browser-my-instances-approved.png`；实例 3db5d007）；四入口以同一用户/草稿/命令/实例对象贯通 | 半填提交受理前拒绝（g2a-evidence.out:1-2）；保存不启动（EDITING 无命令）；普通用户菜单仅四个人口 | "admin 待办错路由"复现为旧 SPA 状态残留：干净会话 admin 待办任务→/workflow/todo 正常且含新任务行；重登恢复复用既有证据（前端不持久会话，刷新即登出属设计） |
| G1b | 关闭（真实 API） | g1c-evidence.out:8-12（范围过滤+恢复）；g6b3-cross.out X2（仅P0+不可见表单受理拒绝）；g6b2-phase2.out:4（撤权草稿保留） | 范围外读写被拒且不泄漏 | 跨租户=隔离服务层验证（平台边界内） |
| G1c | 关闭（DOM+API） | 设计器打开草稿表单→保存→定义回读 title 已改（config 编辑入口确实可用）；可见范围对话框 DOM 保存→回读 visibilityScope=null；D4—D7 实例绑定不变/新草稿解析新绑定（g1c2-evidence.out:4-8） | biz config 保存 403（:1）且定义未变（D2b required=true）；绑定篡改忽略（:3） | 已发布表单元数据冻结（1100）为平台设计；管理面=可见范围+流程图/发布+草稿 config；不建版本管理 |
| G2a | 关闭（真实 API+测试） | g2a-evidence.out:1-13（受理前 1401、冻结、幂等、失效链） | 零残留/不静默丢值/同意图不重建/改内容不复用 | 绑定失效链覆盖失效语义；版本守卫测试覆盖（控制器测试） |
| G3a | 关闭（原件归集） | from-backend/03/live-business-20260905.md G3a 段 | 重放 404、已办不增 | 隔离夹具 |
| G3b | 关闭（真实+测试） | 退回原件（同上 G3b 段）；兼容矩阵新用例（HISTORY_COMPAT 保留旧历史、跨源去重、取消不冒充） | 取消/非本人办理任务不在 finished 契约内 | 隔离历史夹具，不要求生产旧库 |
| G4a | 关闭（原件+受影响复核） | 原 G4a 两进程恢复原件；队列实现变化后以全量套件+G6b2 重启链复核 | 不丢命令、不重复业务 | 拒绝链不替代恢复链：恢复链原件+重启链均在 |
| G4b | 关闭（集成+真实） | 重叠窗口集成测试（同任务 NORMAL/P0、处理中回收、迟到执行与写回被拒、EFFECTS 恰一次、身份 7→8→7）；在线 g4b-evidence.out:5-11 + g4b-late-final.out | 单 JVM 锁不作证明；迟到写回不改终态；processed biz=0 | 外部效果受控适配器记录（审查03允许）；B2 优先调度仍为锁定 L4 |
| G5a | 关闭（原件归集+重采） | 原 P0 链（current-api-browser G5a 段）；父子命令本轮 D4 链再现（命令 COMPLETED→实例以 recordId 建立并回读）；有界等待双结局（ACCEPTED/COMPLETED） | 父命令成功≠流程启动（子命令/实例可分查） | 不重跑锁定 L4 |
| G6a | 关闭（副本已锁+实际回读） | fixtures03-run.out 与 g6b3-cross.out X1/X7 的真实 /auth/me 权限差异 | 仅注册不默认授权（V51 副本注释+实际环境回读） | superAdmin 短路为平台既有语义 |
| G6b | 关闭（真实双进程+交叉） | g6b2-phase2.out:1-8（撤 P0/撤范围→消费拒绝→草稿保留→零副作用→身份无残留）；g6b3-cross.out X1—X7（仅P0/仅业务/两者+仅P0+不可见表单拒绝）；非超租户受理前拒绝（单测+实现） | 撤权消费拒绝且无副作用；身份无残留 | 移除角色为合法撤权；租户边界=受理前拒绝（不永久 PENDING） |
| G7a | 关闭（映射文档） | g7a-contract-mapping.md：4 条契约断言×两实现 + 8 条持久附加行为，逐条用例行号 | 替代实现不冒称外部 Broker；默认路径注入持久实现 | 不重复全量测试（全量门禁附带覆盖） |
| G8a | 关闭（工作区证据包+指纹） | receipts/evidence/review03/（COLLECTION-MANIFEST.json 49 项 + COLLECTION-MANIFEST-new05.json 19 项全部一致/登记）；源码/产物/运行对应：本轮修改 8 文件（回执 §2.2）、最终 jar sha256=554a7d8946432208213676094c06c4ecbcbabf7ab63adb65ea751412c711f05b（01:55 后最终源码打包，运行进程即该 jar）、trimmed 运行日志 | 不以证据哈希冒充源码指纹（jar 指纹单独给出）；证据哈希与源/副本一致分开登记 | 附件在工作区可打开；相对路径见 COLLECTION-MANIFEST |
| G8b | 关闭（原件归集） | new-05/frontend-gates.log / frontend-build.log（typecheck/lint/test/build exit 0；1152+3；1841 modules）；1152 与 03 的 1153 差异=本轮 MyDrafts 用例合并 -1，与源码变更一致 | 旧 1152 日志仅旧快照（审查03 §1 口径保留） | 静默 lint 合法 |

## 4. 与审查03裁决的逐条回应

- §2 G1a"移除流程选择器不等于从已发布表单点击发起"→ 已改造入口并补最小闭环（G1a 行）。
- §2 G1c"管理流程图 API 不证明进入表单编辑"→ 补设计器 DOM+保存回读（草稿 config 入口可用）；发布元数据冻结保留为平台设计。
- §2 G3b"新历史≠旧数据兼容"→ 补隔离兼容夹具矩阵（无 ACTION 保留、去重、取消不冒充）。
- §2 G4b"终态覆盖不证明交接重叠"→ 补处理中回收+迟到执行/写回被拒的重叠窗口测试（真实处理器）。
- §2 G6b"仅P0 缺失"→ 补仅P0 身份与矩阵；§3.3 租户受理→受理前明确拒绝+单测。
- §2 G7a"套件名代替覆盖"→ 断言级映射文档。
- §1 交付位置→ 全部归集至工作区 `receipts/evidence/review03/`，Planner 可直接打开。
- §3.3 管理员待办菜单→ 干净会话复验正常，判定为旧 SPA 状态残留（诊断记录在案）；如仍复现请给出操作序列。

## 5. 自验结论

G1a—G8b 各原子按提示02 账本以指定正反断言关闭；归集原件与新补证分开登记；受影响验证有效（后端全量 1111/0/0/0、前端四门禁）；隔离环境收尾完成（G6b 文件库删除读回、主服务内存库随进程销毁）。自验结论：VERIFYING，待 Planner 独立复验。不自行 PASSED/COMPLETED、不核销 P4、不更新正式计数。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/p4-oa-personal-center-dual-dispatch/receipts/completion-p4-supplement-04.md","evidence":["product/p4-oa-personal-center-dual-dispatch/receipts/evidence/review03/evidence-index-review03.md","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/review03/g7a-contract-mapping.md","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/review03/COLLECTION-MANIFEST.json","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/review03/COLLECTION-MANIFEST-new05.json","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/review03/new-05/browser-initiate-entry.png","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/review03/new-05/browser-my-instances-approved.png","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/review03/new-05/g1c2-evidence.out","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/review03/new-05/g6b3-cross.out","product/p4-oa-personal-center-dual-dispatch/receipts/evidence/review03/new-05/CommandLeaseHandoverOverlapTest.java"],"feature_status":"VERIFYING","work_items":[{"id":"G1a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"入口改造+闭环待复验"},{"id":"G1b","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"索引待复核"},{"id":"G1c","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"编辑DOM+绑定断言待复验"},{"id":"G2a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"版本裁决整理待复核"},{"id":"G3a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"原件归集待复核"},{"id":"G3b","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"兼容矩阵待复验"},{"id":"G4a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"恢复原件待复核"},{"id":"G4b","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"重叠窗口待复验"},{"id":"G5a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"原件索引待复核"},{"id":"G6a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"实际授权回读待复核"},{"id":"G6b","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"交叉+租户边界待复验"},{"id":"G7a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"契约映射待复核"},{"id":"G8a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"工作区证据包待复核"},{"id":"G8b","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"前端门禁原件待复核"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待Planner按提示02账本与索引复核","next_action_type":"WAIT_PLANNER","progress_fingerprint":"p4-supplement-04:review03-index:g7a-mapping:manifest-49+19:backend-1111-0-0-0:fe-1152-3:jar-554a7d89","progress_basis":{"files_changed":["Smart-WorkFlow-Web/src/modules/workflow/views/MyDrafts.vue","Smart-WorkFlow-Web/src/modules/workflow/views/MyDrafts.spec.ts","Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmMyProcessedController.java","Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/DraftSubmitService.java","Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/CommandAcceptService.java","Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/queue/CommandLeaseHandoverOverlapTest.java","Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/queue/CommandQueueIntegrationTest.java","Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/service/CommandAcceptServiceTest.java","Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/controller/BpmMyProcessedControllerTest.java","Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/controller/BpmDraftControllerTest.java"],"tool_actions":["归集49+19项证据并哈希回读","浏览器真实操作（新发起入口闭环/管理员审批/可见范围与设计器编辑）","REST行为证据脚本（g1c2/g6b3）","mvn -q test 全量 exit 0（1111/0/0/0）","前端四门禁 exit 0（1152+3）","G6b文件库删除读回"],"new_evidence":["evidence-index-review03.md","g7a-contract-mapping.md","g1c2-evidence.out","g6b3-cross.out","CommandLeaseHandoverOverlapTest.java","browser-initiate-entry.png","browser-my-instances-approved.png","backend-full-test-final.log","frontend-gates.log"],"closed_work_items":["G1a","G1b","G1c","G2a","G3a","G3b","G4a","G4b","G5a","G6a","G6b","G7a","G8a","G8b"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"filesystem","outcome":"SUCCEEDED","detail":"工作区 receipts/evidence/review03 归集 49+19 项；COLLECTION-MANIFEST 源/副本 sha256 一致（0 mismatch）；G6b 文件库已删除读回不存在"},{"tool":"browser","outcome":"SUCCEEDED","detail":"真实浏览器完成新发起入口闭环与两处管理编辑 DOM；截图与 DOM 快照归集；IAB 点击通道间歇超时已用页面内事件与坐标通道绕过并记录"},{"tool":"http-api","outcome":"SUCCEEDED","detail":"G1c2/G6b3 全部正反断言经真实 REST 往返并回读（403/404/绑定不变/仅P0矩阵/消费COMPLETED）"},{"tool":"maven","outcome":"SUCCEEDED","detail":"最终源码 mvn -q test exit 0：170 报告 1111/0/0/0；含新增重叠窗口与兼容矩阵用例"},{"tool":"vite/pnpm","outcome":"SUCCEEDED","detail":"typecheck/lint/test/build 全部 exit 0：121 files passed+1 skipped、1152 tests passed+3 skipped、1841 modules"}],"browser_status":"OPERABLE"}
