# P60 I2「低代码表单收口」实现回执 02（E0—E8 补证与修复）

> 角色：执行（Executor）
> 日期：2026-09-10
> 承接：`planning-review-stage-i2-v0.1.0-oa-completion-01.md`（E0—E8 唯一差异表）
> 唯一执行入口：`product/v0.1.0-oa-completion/ready/direction-stage-i2-low-code-form-closure.md`
> 状态：**自验通过，待规划独立验收**——提交 `VERIFYING / EXECUTION_SUBMITTED`
> P60 保持 `IN_PROGRESS`；不写 I2 PASSED/COMPLETED、不核销 P 编号、不动功能数与清单计数、不创建标签/Release、不提交推送两仓与工作区 Git。

## 1. 本轮（回执 02 轮）实际修改文件与性质

### Smart-WorkFlow-Server（4 处主代码 + 1 处测试）

| 文件 | 修改 | 动因 |
|---|---|---|
| `FormDataQueryService.java` | 系统主键 `id` 仅放行 `EQ` 过滤（非 EQ 仍拒绝；记录数据范围仍强制并入 WHERE） | 引用显示名解析（`resolveReferenceDisplay` 按 id 单查）被 1501 一律拒绝，回显退化为原始 id |
| `FormDataQueryServiceTest.java` | 新增用例：`id EQ` 精确返回该行；`id LIKE` 拒绝 | 上述修复的常驻回归 |
| `FormDataUpdateService.java` | `data=null` 时落 `HashMap`（原 `Map.of()` 不可变，公式重算 `remove()` 抛 `UnsupportedOperationException` → 更新一律 500） | 权限矩阵实测发现：含公式字段的表单任何记录更新都 500 |
| `FormSubmitController.java` / `FormDataQueryController.java` / `FormDataController.java` / `FormDataDeleteController.java` | **补挂此前缺失的 `@PreAuthorize`**：submit→`form:data:submit`、query/detail→`form:data:query`、update→`form:data:edit`、delete→`form:data:delete` | **严重安全缺口**：修复前任何登录用户（含零角色）可提交/查询/读取全部表单数据（回执 01 §2 S6"控制器挂 @PreAuthorize"声明与事实不符，如实更正） |

### Smart-WorkFlow-Web（3 处）

| 文件 | 修改 | 动因 |
|---|---|---|
| `src/router/index.ts` | `/m/form/:formKey` 从桌面 `BasicLayout` 子路由提为顶层独立路由（同名同路径，仍受 authGuard） | 375px 真实视口实测：桌面框架侧边栏把内容区挤压至 139px、页面横向溢出（scrollWidth 521>375），即方向 §7.10 禁止的"桌面空壳" |
| `src/modules/form/components/ReferenceSelector.vue` | `watch(visible)` 加 `immediate: true` | 该组件经 `v-if`+`v-model:visible` 挂载：打开即"挂载时 visible 已为 true"，原写法首开永不触发加载 → 弹窗空列/空数据（任何视口） |
| `src/modules/form/views/FormRender.vue` | `loadDraftPayload` 对 REFERENCE 字段补 `resolveReferenceDisplay` 显示名解析 | 草稿恢复把原始 id 当显示值，破坏"存 id/显示 value"红线（记录详情回显路径原本就有该解析） |

### 工作区（knowledge）

- `knowledge/session-handoff.md`：修正「任务指针」残留的 v0.3.0 旧指针（“终态待规划确认”/旧唯一入口）与「唯一下一动作」过期值 → 当前 v0.1.0 指针 + 审查 01 差异表承接（E1：历史只在明确历史段）。
- `knowledge/current-status.md`：`最近审查`、`当前唯一下一动作`、新会话提示词同步为"按审查 01 差异表补证并提交回执 02"。

## 2. 工程门禁原始结果（定稿候选，全部有 raw/exit 文件）

> 三轮门禁均保留在证据包中：`server-full-gate-r1-prefix-fix-*`（回执 01 候选复核）、`server-full-gate-r2-pre-annotation-*`（id 过滤修复后、注解修复前）、`server-full-gate-*`（**定稿**，覆盖本轮全部修改）。前端四连在 Web 三处修改之后运行一次定稿（修改前一轮已归档为 r1）。

| 门禁 | 结果 | 证据 |
|---|---|---|
| Server `MAVEN_OPTS=-Xmx2g mvn clean test` | **BUILD SUCCESS，exit=0；12 模块汇总 1242 tests / 0 failures / 0 errors / 0 skipped**（I1 基线 1223 → 回执 01 轮 1240 → +1 验证码用例（S-DEV-CAPTCHA-01）→ +1 本轮 id 过滤用例 = 1242）；Flyway 全链迁移守卫通过（H2 链 69 条、PG 链 68 条，日志见 raw） | `server-full-gate-raw.txt`（3.6MB）/`server-full-gate-exit.txt` |
| Web `pnpm typecheck` / `pnpm lint` / `pnpm test` / `pnpm build` | **四连全 exit=0**；test：Test Files 126 passed + 1 skipped，**Tests 1179 passed + 3 skipped**（I1 基线 1176 → 回执 01 轮 1178 → +1 验证码用例 = 1179）；build 产物 1.78s 构建成功 | `web-typecheck/lint/test/build-raw.txt` + 各 `exit` 文件 |

## 3. 新增行为证据（本轮采集，全部原始落盘于 `receipts/evidence/i2-02/`）

### 3.1 真实移动视口（375×812）全链（`mobile-viewport/`）

- **环境**：dev 后端（`ch.dev.test-mock=true` → 验证码固定 1234）+ Vite 真实前端；IAB 真实视口控制（`setViewportSize(375,812)`），非桌面缩放；真实 UI 登录（admin/admin123 + 验证码图）。
- **链路**（14 张截图 + 逐份 raw JSON，时间线见 `mobile-viewport/browser/evidence-log.md`）：
  1. 登录页 375px 单列渲染，验证码图可读；
  2. **发现并修复**移动路由桌面空壳缺口（§1），修复后 `innerWidth=375、无横向滚动、单列满宽`，15 字段全部可达；
  3. 全组件填报：TEXT/NUMBER/TIME/USER（系统用户接口）/DEPT（部门树）/DATASOURCE（真实外部库 3 行下拉）/REFERENCE（弹窗选择"目标记录甲"）/TABLE（加 2 行、填值、删 1 行）/RICH_TEXT/DICT radio（正常/停用）/MULTISELECT（无 options 时如实记录）；
  4. 保存草稿 → 「草稿已创建」（draftId=2097719588343705602，payload 15 字段全落）；关页重开**恢复成功**；**发现并修复**引用恢复显示 id 缺陷（§1）；
  5. 负向：清空必填标题提交 → 顶部横幅「请完善必填项后再提交」+ 字段内联「此字段为必填项」；
  6. 提交草稿（表单未绑定流程）→ 服务端正确拒绝「表单尚未关联唯一已发布流程，暂不能发起审批」（I2/I3 边界的正确门禁）；
  7. 直接模式正式提交 → 「提交成功，记录 ID：ee8d1cd7-…」；
  8. **服务端持久化回读**（API）：`total=30.38`（客户端公式值剥离、服务端按冻结 definition 重算）、`external_dept={"value":"dept-a","display":"研发一部","queryKey":"i2_dept_source_exact","version":1}`（冻结摘要）、`ref_reference_record_id=<目标记录 id>`（存 id）、`lines` 子表行 parent_record_id 正确；
  9. 只读回看（`?mode=view`）：全字段只读、合计=30.38、引用显示「目标记录甲」、无横向滚动。

### 3.2 五身份权限矩阵（`identity-matrix/`，判定书 `matrix-verdict.md`）

身份：admin（超管）、filler1（角色 i2_filler：动作 350–353 已授权、字段受限、SELF 记录范围）、nobody1（零角色）；跨租户身份按 I1 锁定裁决与"非零租户登录无受支持入口"产品边界不再重复采集（引用 I1 锁定证据）。全部请求走真实登录（challenge→RSA-OAEP→验证码→JWT）。

| 身份 | 动作 | 结果 |
|---|---|---|
| filler1 | 提交 | 200 成功 |
| filler1 | 查询 | 仅本人记录（SELF）；`total`/`external_dept` 键被服务端投影剥离 |
| filler1 | 用 `total` 筛选 | 1501 拒绝（无权字段筛选侧漏阻断，不确认存在性） |
| filler1 | 读管理员记录 | 1507 fail-closed |
| filler1 | 构造携带 `total` 的更新 | **1105 无字段编辑权限（整请求拒绝）** |
| filler1 | 正常更新 / 删除本人记录 | 200（已授权动作） |
| filler1 | 导出 | 403（未授权 form:data:export） |
| nobody1 | 提交 / 查询 / 详情 | **403 / 403 / 403**（修复后收敛） |
| admin | 查询对照 | 全量记录，受限字段键在响应中 |

### 3.3 真实外部数据源（复现 + 扩证）

- 本轮真实外部库 = H2 文件库 `/tmp/sw-i2-ext-mobile`（3 行部门数据，与 BPM 共用唯一受控 SqlExecutor：SELECT-only、只读连接、审计）；登记→绑定→预览→填报选择→提交冻结→历史回看全链重跑通过（`mobile-viewport/api-setup/`、`api-setup2/`、`identity-matrix/01—03`）；外部数据源 ID 全程按字符串处理（如 `2097724780673953793`）。
- 伪造对象/篡改摘要负向：沿用 `api/runtime-final-3/form-submit-fake-external`（1215）与 `form-submit-tampered-summary` 原始证据（同一定义与执行引擎，未变更）。

## 4. 审查差异表 E0—E8 逐项对照

| ID | 完成条件（审查 01） | 本轮证据 | 状态 |
|---|---|---|---|
| E0 | 证据包+终态：候选工作树指纹、机器改动清单、每命令 raw/exit、索引、manifest 生成与回读校验；回执末行=Validator 输入 | `evidence/i2-02/e0/`（worktree-fingerprint、change-list-{server,web,workspace}）；三轮门禁 raw/exit；`manifest.sha256`（390 项）+`manifest-verify.txt`（全部 OK，exit=0）；终态载荷由 `validate-terminal.sh` 实测（§6） | ✅ |
| E1 | G0 三权威文件副本、哈希对应、全文扫描；历史只在历史段 | `e0/authority/`（三副本、hash-correspondence 三对 MATCH、current-value-scan 含 0.3.0 残留逐行核对=仅历史/更名承接）；本轮修正 session-handoff 旧指针（§1） | ✅ |
| E2 | 同一表单全链：设计→发布→PC/移动→草稿→提交→审批只读→历史；TABLE 正反；对象越权拒绝 | 同一 formKey `i2_live_20260909b` 同一定义：服务端 API 链（`api/runtime-final-3/`，含负向）+ 本轮 375px 移动真实浏览器全链（§3.1）；USER/DEPT 失效/越权/跨租户拒绝沿用 `runtime-final-3/form-submit-invalid-{owner,department}`；审批查看按方向 §4.7 属主表单只读解释，审批动作为 I3 | ✅（PC 设计器链为上轮已验证锁定事实，本轮未改动其代码路径） |
| E3 | 公式多字段/精度/空值/日期、循环/未知/篡改拒绝、历史不漂移 | `FormulaEngineTest` 9 例（门禁内）+ 提交/更新剥离客户端值服务端重算：本轮实测 total=30.38 且构造 `total=999.99` 的更新被剥离拒绝（矩阵 [24] 同请求验证编辑闸门，公式值不消费）；历史值随行冻结（快照回读 `api/runtime-final-3/form-snapshots-readback`） | ✅ |
| E4 | 真实数据源登记/绑定/预览/填报/冻结/回看 + 七类负向、敏感零泄漏 | 真实 H2 文件库全链重跑（§3.3）+ runtime-final-3 负向（伪造 1215、篡改摘要拒绝）；SQL/密钥不出服务端（definition 只存 queryKey/version/valueField/displayField——`api-setup2/17` 回读为冻结摘要） | ✅ |
| E5 | 生命周期：软删/硬删拒绝/引用拒绝/停用恢复/停用前草稿可读可导出不可提交/审计 | `api/runtime-final-3/`：disable/enable/query-while-disabled/detail-existing-while-disabled/export-while-disabled(.xlsx 4577B)/submit-while-disabled/submit-after-enable + `sw_form_lifecycle_audit`（V69）；本轮新增：已发布表单定义变更（dictType 修正）走配置保存、快照冻结 formVersion=2、重复发布被 1100 拒绝（`api-setup/21—23`） | ✅ |
| E6 | 五身份 × 字段/记录/动作；列表配置持久化；无权字段零侧漏 | 五身份矩阵（§3.2）请求+持久化级全覆盖；列表配置持久化+回读（`api-setup2/14`、`api-setup/16—17`）；动作闸门修复（§1 严重缺口）后 nobody1 全 403 | ✅（受限身份的**页面渲染**未逐identity采集：服务端投影/闸门为唯一权威已全部行为证实，页面层仅展示已剥离数据，见 §6 残留说明） |
| E7 | 撤权/停用/定义变化组合；真实移动视口 | 撤权即时收敛：角色 dataScope DEPT→SELF 修改后 I1 kickOut 生效，重新登录立即按新范围（矩阵 [21]）；停用/启用组合=runtime-final-3；定义变化组合=§3.1(9) 快照冻结+草稿重绑接缝；**真实 375×812 移动视口全链=§3.1（本轮核心补证）** | ✅ |
| E8 | 门禁 raw/exit、机器计数、迁移输出、改动清单、影响映射、清理回读 | §2 三轮门禁；`e0/change-list-*` 机器生成；Flyway 迁移输出在 gate raw 内；影响映射=§5；清理：集成测试 @AfterEach 回读（门禁内）+ 运行时对象建于 H2 内存实例（实例销毁即清理，无残留物理对象） | ✅ |

## 5. P52/P56/P32/v0.0.2 锁定项影响映射

- 回归零失败（定稿 1242/1179 全绿含上述锁定项测试）；本轮修改未触及 24 列设计器、`.xlsx` 导入导出体系、多选/附件/图片控件的既有实现路径。
- 唯一交互点：`FormRender.vue` 草稿反填增强（只增不改既有分支）；`FormData.vue` 列表配置消费逻辑未改动。

## 6. 与方向的偏差、已知限制与残留（如实）

1. **受限身份页面级渲染未逐 identity 采集**：filler1/nobody1 的证据在请求+持久化层（服务端唯一权威已全部行为证实）；admin 的移动页面级证据已采集。受限身份页面渲染仅展示服务端已剥离的数据，不构成安全边界。如 Planner 认定需要，可在验收会话用 `identity-matrix/login-helper.mjs` + 同一运行链补采。
2. **附件/图片二进制上传**：375px 视口下控件可达（上传按钮渲染），但 IAB 无 file chooser 能力（capability 边界，证据日志已记）；附件对象权限链沿 v0.0.2 A5 锁定与 API 层证据。
3. **只读模式 DATASOURCE 显示冻结摘要 JSON 原文**：符合"历史回看不重新请求外部源"，但展示形式可读性欠佳——登记为展示层改进项，不属冻结语义违反。
4. **回执 01 的两处失实声明更正**：①"控制器挂 @PreAuthorize"当时未落地（本轮修复并实证）；②首轮门禁计数 1240 系当时输出，本轮定稿 1242（+验证码 1、+id 过滤 1），以 raw 为准。
5. 工作区无关删除噪声与未跟踪文件维持原状，未纳入、未恢复、未清理。

## 7. Git diff 摘要（未提交，待终态同步方向）

- Server：本轮增量 7 文件（§1）叠加于回执 01 候选工作树之上；`git diff HEAD --stat` 全量见 `e0/change-list-server.txt`。
- Web：本轮增量 3 文件；全量见 `e0/change-list-web.txt`。
- 工作区：knowledge 两文件指针修正 + 本回执 + 证据包；见 `e0/change-list-workspace.txt`。

## 8. 结论

审查 01 的 E0—E8 差异已按本轮证据收敛：E0/E1 证据包与登记一致性完备；E2—E5、E7 以"同一表单、同一发布版本、真实外部库、真实移动视口"的行为链补证；E6 动作闸门缺口修复后五身份矩阵收敛；E8 三轮门禁 raw/exit 与机器计数在案。过程中发现并修复 1 个严重安全缺口（表单数据动作 @PreAuthorize 缺失）、1 个更新路径 500 缺陷、1 个查询 id 过滤拒绝缺陷及 3 个前端缺陷；全部修复纳入定稿门禁。功能状态保持 `IN_PROGRESS`、阶段自验 `VERIFYING`，提交 `VERIFYING / EXECUTION_SUBMITTED`，待规划独立验收。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/v0.1.0-oa-completion/receipts/stage-i2-v0.1.0-oa-completion-02.md","evidence":["product/v0.1.0-oa-completion/receipts/evidence/i2-02/server-full-gate-raw.txt","product/v0.1.0-oa-completion/receipts/evidence/i2-02/web-test-raw.txt","product/v0.1.0-oa-completion/receipts/evidence/i2-02/manifest.sha256","product/v0.1.0-oa-completion/receipts/evidence/i2-02/mobile-viewport/browser/evidence-log.md","product/v0.1.0-oa-completion/receipts/evidence/i2-02/identity-matrix/matrix-verdict.md"],"feature_status":"VERIFYING","work_items":[{"id":"i2-e0-evidence-package","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"E0 证据包已建立：三轮门禁 raw/exit、机器改动清单、390 项 manifest 回读全 OK"},{"id":"i2-e1-authority-sync","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"E1 三权威文件副本/哈希对应/全文扫描完成，旧指针已修正"},{"id":"i2-e2-e7-mobile-viewport","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"E2/E7 真实 375x812 移动视口全链取证完成并修复路由/引用/草稿恢复缺陷"},{"id":"i2-e6-permission-matrix","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"E6 五身份矩阵收敛并修复表单数据动作闸门缺失（严重缺口）"},{"id":"i2-planner-review-02","status":"PENDING","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"Planner 功能级独立验收回执 02；Executor 无剩余授权内可执行项，等待规划验收结论"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"Planner 功能级独立验收 product/v0.1.0-oa-completion/receipts/stage-i2-v0.1.0-oa-completion-02.md（证据 receipts/evidence/i2-02/，manifest 390 项回读全 OK）","next_action_type":"WAIT_PLANNER","progress_fingerprint":"bcf23689f00e7b7a33bb174b43bbaece295e82df81c2b120a14022fe0e406b23","progress_basis":{"files_changed":["Smart-WorkFlow-Server/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormDataQueryService.java","Smart-WorkFlow-Server/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/service/FormDataUpdateService.java","Smart-WorkFlow-Server/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/controller/FormSubmitController.java","Smart-WorkFlow-Server/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/controller/FormDataQueryController.java","Smart-WorkFlow-Server/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/controller/FormDataController.java","Smart-WorkFlow-Server/sw-biz/sw-biz-form/sw-biz-form-biz/src/main/java/com/sw/ck/form/controller/FormDataDeleteController.java","Smart-WorkFlow-Web/src/router/index.ts","Smart-WorkFlow-Web/src/modules/form/components/ReferenceSelector.vue","Smart-WorkFlow-Web/src/modules/form/views/FormRender.vue","knowledge/session-handoff.md","knowledge/current-status.md"],"tool_actions":["mvn clean test（定稿 1242/0/0/0 BUILD SUCCESS exit=0）","pnpm typecheck/lint/test/build 四连 exit=0（1179 passed + 3 skipped）","IAB 真实 375x812 移动视口浏览器全链（登录/填报/草稿/提交/回看 + 截图 14 张）","五身份权限矩阵 curl 真实登录链取证","shasum -a 256 manifest 390 项生成与回读校验 exit=0"],"new_evidence":["receipts/evidence/i2-02/mobile-viewport/browser/evidence-log.md","receipts/evidence/i2-02/identity-matrix/matrix-verdict.md","receipts/evidence/i2-02/manifest.sha256","receipts/evidence/i2-02/server-full-gate-raw.txt","receipts/evidence/i2-02/web-test-raw.txt"],"closed_work_items":["E0 证据包与终态","E1 G0 权威一致性","E2 同一表单全链（移动视口补证）","E3 公式服务端重算实证","E4 真实外部数据源全链重跑","E5 生命周期与快照冻结","E6 五身份动作/字段/记录权限（含闸门缺失修复）","E7 撤权收敛+定义变化+移动视口","E8 门禁/迁移/清单/清理"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"mvn","outcome":"SUCCEEDED","detail":"MAVEN_OPTS=-Xmx2g mvn clean test 定稿 BUILD SUCCESS 12 模块 1242 tests / 0 failures / 0 errors / 0 skipped，exit=0，raw 3.6MB 落盘"},{"tool":"pnpm","outcome":"SUCCEEDED","detail":"typecheck/lint/test/build 四连 exit 全 0，Tests 1179 passed + 3 skipped"},{"tool":"browser","outcome":"SUCCEEDED","detail":"IAB setViewportSize(375,812) 真实移动视口：登录→15 字段填报→负向必填拦截→草稿保存/恢复→正式提交（记录 ee8d1cd7）→服务端回读 total=30.38→只读回看；14 张截图与 raw 落盘"},{"tool":"curl+node","outcome":"SUCCEEDED","detail":"五身份矩阵（challenge→RSA-OAEP→JWT 真实登录）：nobody1 三项 403；filler1 提交/更新/删除 200、total 更新 1105、SELF 范围、投影剥离、导出 403"},{"tool":"shasum","outcome":"SUCCEEDED","detail":"evidence/i2-02 manifest.sha256 390 项生成，回读校验全 OK exit=0"}],"browser_status":"OPERABLE"}