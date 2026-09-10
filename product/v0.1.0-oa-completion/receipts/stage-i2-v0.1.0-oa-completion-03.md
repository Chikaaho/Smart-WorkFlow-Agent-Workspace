# P60 I2「低代码表单收口」补证回执 03（一级补充提示 01：E0b/E2b—E8b）

> 角色：执行（Executor）
> 日期：2026-09-10
> 唯一补证入口：`planning-execution-prompt-stage-i2-v0.1.0-oa-completion-01.md`（权威输入：验收 02 → 提示 01 → 回执 02 与 evidence/i2-02/ → 阶段方向）
> 状态：**自验通过，待规划独立验收**——提交 `VERIFYING / EXECUTION_SUBMITTED`
> P60 保持 `IN_PROGRESS`；I2 保持 `VERIFYING`；功能数 44、清单 ✅46/🟦22/⬜22、P 编号零变化；不提交推送 Git、不移动方向、不写 PASSED/COMPLETED。
> 锁定项未重验：S-DEV-CAPTCHA-01、E0a/E0c/E1、E2a/E7a、E3a、E4a、E5a、E6a、E8a（验收 02 §2）。

## 1. 对象与生命周期登记（提示 §4）

旧运行实例（回执 02 轮 H2 内存实例）随进程退出销毁，新旧 ID 映射登记于 `evidence/i2-03/object-map-destroyed-run1..4.txt`（四个实例轮次）与现行 `object-map.txt`。本轮回执 02 已锁定的移动管理员主链证据（E2a/E7a）文件保留于 `evidence/i2-02/`，未重采。

## 2. 逐原子证据（均在 `evidence/i2-03/`，格式：原始文件 → 实际结果）

### E2b PC 同表单设计/保存/发布/填报/草稿/提交/只读 + 真实审批入口（`e2b/`）

- PC 设计器真实 UI 链（1280 视口）：`pc01-draft-create.json`（草稿 i2p3_pc_designed）→ 控件库添加 数字×2/多选/公式 + 配置面板编辑标签/列名/必填/选项（标签A/标签B/标签C）/公式表达式 → `pc03-designer-saved.png`（"草稿已保存"）→ 发布确认弹窗（"发布后表名/字段名冻结"）→ `pc04-designer-published.png`（"发布成功"，已发布 V2）。发布即冻结为产品正确语义（设计器对已发布表单明确提示不可编辑）。
- PC 渲染页填报：`pc09-render-filled.png`（标题/数量 6/单价 2.5/多选勾选 标签A+标签C，合计只读"服务端计算"）→ 提交：`pc10-submit-success.png`（记录 **1e9c452d-3d2a-4ca5-a6dc-50faa2c4b407**）。
- PC 草稿：`pc13-draft-created.json`（draftId 2097874818392780802）→ 关页重开恢复 `pc14-draft-restored.png`（恢复=true）。
- PC 只读回看：`pc15-readonly-view.png`（（查看）模式、同一记录）。
- **真实审批查看入口**：流程定义 p1—p4（创建/图 FIXED_USER=admin/校验[]/发布）绑定 i2p3_pc_designed；PC 提交自动发起流程 → `pc11-admin-todo.json`（taskId 1cf38bda，businessKey=1e9c452d）→ 审批任务详情页 `pc12-approval-view.png`：表单标识/业务单号/发起人一致，表单数据回显 标题=PC 链路提交-E2b、数量=6、单价=2.5、标签=["标签A","标签C"]、**合计=15（服务端按冻结版本重算）**。
- 多选/人员/部门/引用/表格/日期/外部数据控件在本表单与主表单均实际交互（E2a 移动主链 + 本节 PC 链）。

### E2c 复杂对象正向与失效/伪造/越权/跨租户负向 + 零副作用（`e2c/`）

- 真实上传：`03-attach-upload.json`/`04-image-upload.json`（真实文件经 `/storage/files/upload` multipart 上传，返回 storageKey）；MULTISELECT 真实选项（设计器配置）+ 提交回显：`01-pc-record-readback.json`（tags=["标签A","标签C"]）。
- 正向（全部真实对象）：`05-positive-real-objects.json` → 记录创建，回读 `12-positive-record-readback.json`（attachments/photo 为真实 storageKey、ref_reference_record_id=目标记录）。
- 负向（修复前发现缺陷 → 修复 → 修复后复跑）：`final/01-ref-missing.json` **1217**（失效引用）、`final/02-ref-forged.json` **1402**（伪造结构）、`final/03-attach-fake.json` **1218**（伪造 storageKey）、`final/04-positive.json` code=0（正向不回归）。
- 零副作用：`02-baseline-count.json`（基线 total）与每轮负向后计数对照，拒绝请求零落库；目标记录删除被 1505 拒绝后仍可读（`e5b/04—05`）。
- 跨租户：产品无非零租户数据创建入口（用户创建以调用方租户为准，API 无租户参数）；引用/USER/DEPT 校验按当前租户过滤（id + tenant_id 条件），跨租户对象与"不存在"同路径拒绝（1217/1402 实测即该路径）。按提示 E6b"等强度服务端租户上下文替代"如实登记，不引用旧通用结论。

### E3b 公式行为矩阵与历史不漂移（`e3b/`）

- 多字段+日期：`14-multi-positive.json`/`15-multi-readback.json` → **total2=14.0**（ROUND(6×2.5−1,2)）、**span_days=9.0**（DAYS(09-10,09-01)）。
- 空值传播：显式 null → `17-null-readback.json` total2=None、span_days=None；字段缺失 → `16-null-submit.json` 1211 可判定拒绝。
- 客户端篡改：`18-tamper-submit.json`（total2=999、span_days=888）→ `19-tamper-readback.json` 落库 **5.0/1.0**（服务端重算，伪值不落库）。
- 未知字段 → `22-unknown-publish-reject.json` **1211**；非法表达式 `1 +* 2(` → `24-illegal-publish-reject.json` **1209**（修复前被接受，见 §3 缺陷 D3）。
- 定义变化不漂移：`25—26`（表达式改为 ×2）→ 旧记录 A 仍 **14.0**（`27-record-A-after-change.json`）、新提交 **30.0**（`29-new-def-readback.json`）。

### E4b 数据源五类失败与敏感零泄漏（`e4b/`）

- 无权：`01-nobody-403.json`（403）。输出不匹配：`03-mismatch-preview.json`（**1214**）。超限：`05-overlimit-preview.json`（30 万行 → **rowCount=1000**，maxRows 确定截断）。超时：`09-slow2-timeout.json`（聚合笛卡尔积 → **JdbcSQLTimeoutException**，`14-timeout-serverlog-excerpt.txt` 执行器失败日志）。停用：`11-disabled-preview.json`（**400 "External datasource is disabled"**），恢复 `13-re-enabled-preview.json` code=0。
- 敏感零泄漏扫描：e2b/e2c/e3b/e4b 证据与主表单 definition、ext 查询响应 grep password/secret/jdbc 全部 0 命中（数据源管理 API 属既有锁定 BPM 能力，密码字段加密不回显）。

### E5b 生命周期与引用/停用语义（`e5b/`）

- 无引用草稿软删：`01—02`（code=0）。已发布硬删拒绝：`03`（**1100**）。引用 RESTRICT：`04`（**1505** "记录被表单引用，不能删除"）+ 零破坏回读 `05`（目标记录仍完整可读）。
- 停用后新填报拒绝：`07`（**1102**）；停用后既有详情可读：`10`（code=0）、查询可读 `12`、快照可读 `11`；恢复启用 `13`。停用后草稿提交（流程路径）拒绝见 `08—09`。

### E6b 五身份 × 页面/深链/请求/持久化（`e6b/`）

- 身份：admin、filler1（有权填报：350-353、SELF）、viewer1（受限查看者：仅 353、SELF）、nobody1（无权）、跨租户（见 E2c 跨租户替代登记）。
- 请求/持久化：viewer1 查询 `20`（code=0、仅本人、无权字段剥离）、管理员记录详情 `21`（**1507** fail-closed）、提交/编辑/删除/导出 `22—25`（全 **403**）；导入 filler1/nobody1 `26—27`（**403**）；nobody1 提交/查询 `28—29`（**403**）。
- 流程发起：filler1 提交成功但 **0 实例**（`30—31`，actionPermissions.flowStart=role:admin 服务端强制）；admin 提交 → 实例+待办产生（`32—34`）→ 对照成立。
- 页面/深链（375 视口真实浏览器）：viewer1 深链管理员记录 → 拒绝横幅（1507→"记录已被删除"，零数据泄漏）`35-viewer-deeplink-admin-record-denied.png`；viewer1 填报页正常渲染 `36-viewer-mobile-page.png`。
- 导入正向（授权身份）：模板下载为真实 xlsx（`32-import-template.xlsx`，11 entries）；完整导入回读受 P32 锁定覆盖（未受本轮实现影响）。

### E7b 同对象撤权/停用/定义变化时间线（`e7b/`）

- 变更前固定：filler1 草稿 `01`、filler1 记录 `02`（b918fb35）。
- 撤权（清空角色）：`03`（code=0）→ 旧 token 新请求 **403**（`04`）；重登后查询/提交/读旧记录全 **403**（`05—06、09`）；admin 读该记录 code=0 值不变（`07`，历史对象稳定）。
- 停用：新提交拒绝（E5b `07`）；停用中记录可读 `11`、快照可读 `12`（冻结解释）。
- 定义变化：E3b `25—29`（旧记录 14.0 不漂移、新定义提交 30.0、快照/审批查看走冻结版本）。

### E8b 真实运行对象清理（`e8b/`）

- 清理前清单：`01-pre-cleanup-inventory.txt`（主表 4 记录、公式矩阵 4 记录、4 表单定义、server PID）。
- 内存实例：进程退出（`04-process-exit-port-check.txt`："java server 进程: 无"）+ **8080 无监听**；动态宽表/记录/草稿/实例全部随 JVM 存活期结束销毁（JDBC URL 为 jdbc:h2:mem:smart_workflow，DB 存活=进程存活）。
- 外部 H2 文件库（独立处理）：清理前 `02`（DEPT=3、BIG=300000）→ DELETE 全部本轮数据 → 回读 `03`（**DEPT_LEFT=0、BIG_LEFT=0**）；文件保留于 /tmp/sw-i2-ext-mobile（本轮表结构壳，数据已清零，保留理由：宿主临时目录，无业务数据残留）。

## 3. 本轮代码修改（行为证明确认的产品缺陷；均已纳入定稿门禁）

| 缺陷 | 修复 | 文件 |
|---|---|---|
| D1 引用失效/伪造不拒绝（失效 code=0 落库；伪造 500） | 富化服务 REFERENCE 校验：非 ID 结构 1402；目标表单/记录不存在或跨租户 1217（新错误码） | `FormFieldEnrichmentService.java`、`FormErrorCode.java`（+1217/1218） |
| D2 附件伪造 storageKey 接受（code=0 落库） | ATTACHMENT/IMAGE 校验：storageKey 必须真实存在（1218 新错误码）；`StorageFacade.exists()` 新增（api+biz） | 同上 + `StorageFacade.java`、`StorageFacadeImpl.java`、form-biz `pom.xml`（storage-api 依赖） |
| D3 非法公式表达式发布成功（`1 +* 2(` code=0） | `FormulaEngine.validateSyntax`（空值穿透纯语法解析）挂入发布依赖校验，非法表达式 1209 | `FormulaEngine.java` |
| D4（承接回执 02 轮，本轮纳入门禁） | id EQ 过滤、Map.of→HashMap、四控制器 @PreAuthorize | 上轮已修，本轮全量门禁复证 |

受影响回归：`FormI2ClosureIntegrationTest` 6/6（含新增 2 用例）、`FormulaEngineTest` 9/9；定稿全量门禁 **1244 tests / 0 failures / 0 errors / 0 skipped，BUILD SUCCESS，exit=0**（`e0b/server-full-gate-raw.txt`）。Web 本轮零代码变化，E8a 锁定的 Web 四连继续有效。

## 4. E0b 最终候选指纹与账本

- `e0b/final-fingerprint.txt`：三仓 HEAD/branch + task-owned diff --stat，生成时间晚于最后代码/证据变化；无关删除噪声未纳入。
- `e0b/final-change-list-server.txt`（22 文件）/`final-change-list-web.txt`（11 文件）：task-owned 机器清单。
- 本终态 `work_items` 与本回执 §2 九原子一一对应，全部 COMPLETED（i2-planner-review-03 为 PENDING 但 actionable=false：执行侧无剩余授权内动作）。

## 5. 结论

九个剩余原子 E0b、E2b、E2c、E3b、E4b、E5b、E6b、E7b、E8b 均以同对象、同身份、真实运行链的原始输出关闭；过程中发现并修复 D1（引用校验缺失/伪造 500）、D2（附件伪造接受）、D3（非法表达式可发布）三项产品缺陷并以 1217/1218/1209/1211/1402 确定拒绝复证。功能状态保持 `IN_PROGRESS`、阶段自验 `VERIFYING`，提交 `VERIFYING / EXECUTION_SUBMITTED`，待规划独立验收。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/v0.1.0-oa-completion/receipts/stage-i2-v0.1.0-oa-completion-03.md","evidence":["product/v0.1.0-oa-completion/receipts/evidence/i2-03/manifest.sha256","product/v0.1.0-oa-completion/receipts/evidence/i2-03/e0b/server-full-gate-raw.txt","product/v0.1.0-oa-completion/receipts/evidence/i2-03/e0b/final-fingerprint.txt","product/v0.1.0-oa-completion/receipts/evidence/i2-03/e2b/pc12-approval-view.png","product/v0.1.0-oa-completion/receipts/evidence/i2-03/identity-matrix-verdicts.txt"],"feature_status":"VERIFYING","work_items":[{"id":"i2-e0b-final-fingerprint","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"E0b 最终指纹/task-owned 清单（晚于最后变化）已生成：e0b/final-fingerprint.txt、final-change-list-server/web.txt"},{"id":"i2-e2b-pc-approval","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"E2b PC 设计→保存→发布→填报→草稿→提交→只读+审批查看入口同一记录冻结版本（e2b/pc01—pc15）"},{"id":"i2-e2c-object-negatives","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"E2c 多选选项/真实上传/引用人员部门附件失效伪造越权 1217/1402/1218 + 零副作用（e2c/）"},{"id":"i2-e3b-formula-matrix","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"E3b 多字段14.0/日期9.0/空值None/篡改不落库/未知1211/非法1209/定义变化不漂移（e3b/）"},{"id":"i2-e4b-datasource-negatives","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"E4b 无权403/不匹配1214/超限1000截断/超时JdbcSQLTimeout/停用400+泄漏扫描零命中（e4b/）"},{"id":"i2-e5b-lifecycle","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"E5b 草稿软删/硬删1100/引用1505/停用1102/既有可读/恢复（e5b/）"},{"id":"i2-e6b-five-identities","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"E6b 五身份页面/深链/请求/持久化 + viewer1 403 矩阵 + 流程发起对照 + 导入（e6b/）"},{"id":"i2-e7b-same-object-timeline","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"E7b 撤权/停用/定义变化时间线：新请求收敛、旧对象冻结可读（e7b/）"},{"id":"i2-e8b-real-cleanup","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"E8b 清理前清单/进程退出/8080无监听/外部库 DEPT=0 BIG=0（e8b/）"},{"id":"i2-planner-review-03","status":"PENDING","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"Planner 按补充提示 §8 自检清单独立验收回执 03；执行侧无剩余授权内可执行项"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"Planner 按一级补充提示 01 §8 逐项独立验收 product/v0.1.0-oa-completion/receipts/stage-i2-v0.1.0-oa-completion-03.md（证据 evidence/i2-03/，manifest 177 项回读全 OK）","next_action_type":"WAIT_PLANNER","progress_fingerprint":"9e203f5a62630d58a32325bdf39eaf2adc75d27f2923ddd19f7d4e5e0257fc50","progress_basis":{"files_changed":["Smart-WorkFlow-Server/sw-biz/sw-biz-form/sw-biz-form-api/src/main/java/com/sw/ck/form/api/exception/FormErrorCode.java","Smart-WorkFlow-Server/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormFieldEnrichmentService.java","Smart-WorkFlow-Server/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormulaEngine.java","Smart-WorkFlow-Server/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormDataQueryService.java","Smart-WorkFlow-Server/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormDataUpdateService.java","Smart-WorkFlow-Server/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/controller/FormSubmitController.java","Smart-WorkFlow-Server/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/controller/FormDataQueryController.java","Smart-WorkFlow-Server/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/controller/FormDataController.java","Smart-WorkFlow-Server/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/controller/FormDataDeleteController.java","Smart-WorkFlow-Server/sw-basic/sw-basic-storage/sw-basic-storage-api/src/main/java/com/sw/ck/storage/api/StorageFacade.java","Smart-WorkFlow-Server/sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/impl/StorageFacadeImpl.java","Smart-WorkFlow-Server/sw-biz/sw-biz-form/sw-biz-form-biz/pom.xml","product/v0.1.0-oa-completion/receipts/stage-i2-v0.1.0-oa-completion-03.md"],"tool_actions":["mvn clean test 定稿 1244/0/0/0 BUILD SUCCESS exit=0","FormI2ClosureIntegrationTest 6/6、FormulaEngineTest 9/9 受影响回归","IAB PC 1280 设计器真实 UI 链 + 375 移动视口身份页面/深链","五身份 HTTP 矩阵（真实 RSA 登录）+ 数据源五类失败注入 + 敏感扫描","外部 H2 文件库清理回读 DEPT=0/BIG=0 + 进程退出/端口无监听","manifest.sha256 177 项生成与回读 exit=0"],"new_evidence":["receipts/evidence/i2-03/e2b/pc01—pc15 全链文件","receipts/evidence/i2-03/e2c/final/01—04 修复后负向","receipts/evidence/i2-03/e3b/14—29 公式矩阵与不漂移","receipts/evidence/i2-03/e4b/01—14 数据源负向与扫描","receipts/evidence/i2-03/e5b/01—13、e6b/20—36、e7b/01—12、e8b/01—04"],"closed_work_items":["E0b 最终指纹与真实账本","E2b PC与审批实际入口","E2c 复杂对象负向与真实交互","E3b 公式行为矩阵","E4b 数据源五类失败与泄漏扫描","E5b 删除/引用/停用语义","E6b 五身份全维度矩阵","E7b 同对象撤权/停用/新定义时间线","E8b 真实清理"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"mvn","outcome":"SUCCEEDED","detail":"定稿全量 clean test：12 模块 1244 tests / 0 failures / 0 errors / 0 skipped，BUILD SUCCESS exit=0"},{"tool":"browser","outcome":"SUCCEEDED","detail":"PC 1280 设计器 UI（添加字段/配置选项公式/保存/发布确认）与渲染/草稿/提交/审批查看全链；375 视口 viewer1 深链拒绝与页面渲染截图"},{"tool":"curl+node","outcome":"SUCCEEDED","detail":"五身份 RSA 登录矩阵、数据源五类失败、生命周期全链；全部原始响应落盘 evidence/i2-03/"},{"tool":"h2-shell","outcome":"SUCCEEDED","detail":"外部文件库清理：DELETE 本轮数据后回读 DEPT_LEFT=0/BIG_LEFT=0"},{"tool":"shasum","outcome":"SUCCEEDED","detail":"manifest.sha256 177 项，回读校验全 OK exit=0"}],"browser_status":"OPERABLE"}
