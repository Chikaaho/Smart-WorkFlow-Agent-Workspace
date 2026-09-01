# P52 表单设计器工作台与关联流程管理 · 执行完成回执

> 角色：执行（Executor）
> 依据方向：`product/p52-form-workbench/ready/direction-p52-form-workbench.md`（L 级，READY）
> 日期：2026-09-01
> 结论：**自验通过，待规划验收**。本回执不写功能 `PASSED/COMPLETED`，不核销 P52，不改变正式功能数与清单状态。

---

## 1. 功能与内部 Step 概要

| Step | 内容 | 状态 |
|---|---|---|
| S1 | 后端 form：历史版本快照只读查询契约（列表 + 指定版本详情）+ H2 集成测试 | 完成 |
| S2 | 后端 bpm：流程定义列表按 `formKey` 精确过滤（复用 `sw_bpm_process_def.form_key` 持久化关联）+ 单测 | 完成 |
| S3 | 后端完整校验门 compile + test，基线核对 | 完成（990/0/0/0） |
| S4 | 前端 API/类型/Mock：身份 DTO、快照列表/详情、流程列表 formKey 过滤 + Mock handler + API 单测 | 完成 |
| S5 | 前端工作台：顶部工作台、保存状态五态、脏状态统一离开保护、历史版本只读预览、关联流程区、路由/深链恢复、迟到响应与串位防护 | 完成 |
| S6 | 前端单测 + 四连门 | 完成（1088 passed / 0 failed） |
| S7 | 真实行为链证据（真实后端登录 + curl 全链路 + 持久化回查）+ dev:mock 肉眼验收 + 本回执 | 完成 |

## 2. 实际读取与修改文件

### 后端 Smart-WorkFlow-Server（修改 8 + 新增 3）

| 文件 | 摘要 |
|---|---|
| `sw-biz-form-api/.../dto/FormSnapshotDTO.java`（新增） | 快照列表行 DTO（formVersion + createTime，不含 definition） |
| `sw-biz-form-api/.../dto/FormSnapshotDetailDTO.java`（新增） | 快照详情 DTO（含 definition，只读契约零回写） |
| `sw-biz-form-api/.../exception/FormErrorCode.java` | 新增 `SNAPSHOT_NOT_FOUND(1301)`（渲染区间顺延） |
| `sw-biz-form-biz/.../service/FormDefService.java` | 新增 `listSnapshots` / `getSnapshot` 接口 |
| `sw-biz-form-biz/.../service/impl/FormDefServiceImpl.java` | 实现：按 formId 查快照（版本倒序）、按版本读取详情；表单不存在 1000、版本不存在 1301；租户/逻辑删除走 MP 拦截器 |
| `sw-biz-form-biz/.../controller/FormDefinitionController.java` | 新增 `GET /form/def/{id}/snapshots`、`GET /form/def/{id}/snapshots/{formVersion}` |
| `sw-biz-form-biz/.../test/.../FormSnapshotQueryTest.java`（新增） | H2（PG 模式）集成测试 8 例：倒序/空列表/1000/1301/逻辑删除排除/详情 definition 一致 |
| `sw-bpm-process/.../service/BpmProcessDefService.java` | `listDefs(PageParam, String formKey)` |
| `sw-bpm-process/.../impl/BpmProcessDefServiceImpl.java` | formKey 非空时追加 `eq(form_key)` 条件；空白串视为不过滤 |
| `sw-bpm-process/.../controller/BpmProcessDefController.java` | `GET /workflow/defs` 增加 `formKey` 可选查询参数 |
| `sw-bpm-process/.../test/.../BpmProcessDefServiceImplTest.java` | 新增 3 例：formKey 过滤断言（sql 段含 form_key + 参数值）、不过滤、空白串不过滤 |

### 前端 Smart-WorkFlow-Web（修改 12 + 新增 7）

| 文件 | 摘要 |
|---|---|
| `src/modules/form/api/form-def.ts` | 新增 `getFormDefById`（身份权威来源，含 formVersion）、`listFormSnapshots`、`getFormSnapshotDefinition`；`FormDefDTO` 增加可选 `formVersion` |
| `src/modules/workflow/api/index.ts` | `pageProcessDefs(page, formKey?)`，formKey 由后端持久化列过滤 |
| `src/modules/form/designer/workbench.ts`（新增） | 纯函数：保存状态五态机、脏判定、工作区 query 解析、离开保护文案（单测 10 例） |
| `src/modules/form/designer/HistoryVersionsDialog.vue`（新增） | 历史版本列表 + 只读预览；零回写路径；历史标识经 PreviewModal badge 呈现 |
| `src/modules/form/designer/RelatedProcessesPanel.vue`（新增） | 关联流程列表（后端 formKey 过滤）、创建关联流程（带入表单身份、服务端持久化）、进入管理/编辑入口；迟到响应序号防护；无 formKey 引导态 |
| `src/modules/form/designer/PreviewModal.vue` | 新增可选 `badge` 标识（历史版本只读标识） |
| `src/modules/form/views/FormDesigner.vue` | 重构为工作台：身份区（formKey/状态/版本）+ 保存五态 + 设计↔关联流程切换 + 保存/发布/历史版本；`guardUnsavedChanges` 统一保护（切工作区/路由离开/beforeunload/发布前置）；`loadForm` 迟到响应防护；拒绝态（不存在/无权不回退）；发布后服务端权威回读 |
| `src/modules/form/views/FormDefList.vue` | 跳转改为 path 直达 `/form/designer`、`/form/designer/{id}` |
| `src/router/index.ts` | 静态路由改为 `form/designer/:id?`，独立命名 `form-designer-workbench`（修复与菜单动态路由同名被 addRoute 顶掉导致 `:id` 深链失效的结构缺口） |
| `src/modules/workflow/views/ProcessDefList.vue` | 从工作台进入（`?from=form-workbench&formId=`）时显示「返回表单工作台」，返回恢复原表单 + `?tab=processes` |
| `src/foundation/mock/seeds.ts` | `MOCK_FORM_DEF_STORE` 增加 formVersion；新增 `MOCK_FORM_SNAPSHOTS` 种子 |
| `src/foundation/mock/handlers.ts` | 新增 `GET /form/def/:id`（404→1000）、`/:id/snapshots`、`/:id/snapshots/:version`（1301）；publish handler 冻结快照；workflow defs 列表 formKey 过滤（`:id` handler 刻意注册在字面量路由之后防首中吞并） |
| 测试（改 3 + 新增 4） | `form-def.spec.ts` +3、`workflow api/index.spec.ts` +2、`ProcessDefList.spec.ts` route mock 补 `query:{}`；新增 `workbench.spec.ts`（10）、`RelatedProcessesPanel.spec.ts`（4）、`HistoryVersionsDialog.spec.ts`（4）、`FormDesigner.spec.ts`（6） |
| `src/types/components.d.ts` | unplugin 自动生成产物（新组件登记） |

## 3. 实际命令与原始结果摘要

**后端完整校验门**（`MAVEN_OPTS=-Xmx2g`）：

- `mvn -q compile` → 退出码 0
- `mvn test` → `BUILD SUCCESS`，退出码 0；全工程汇总 **Tests run: 990, Failures: 0, Errors: 0, Skipped: 0**（各模块 18+19+23+234+27+27+346+51+6+65+85+89 = 990）
- 基线对照：P45 正式基线 979 → 990，**+11 = FormSnapshotQueryTest 8 例 + BpmProcessDefServiceImplTest 3 例**，精确对应本次改动，无漂移。

**前端完整四连**（`NODE_OPTIONS=--max-old-space-size=2048`，改动后终验复跑）：

- `pnpm typecheck` → 退出码 0
- `pnpm lint` → 退出码 0
- `pnpm test` → 退出码 0，**Test Files 113 passed | 1 skipped (114)；Tests 1088 passed | 3 skipped (1091)**
- `pnpm build` → 退出码 0（`✓ built`）
- 基线对照：1062 → 1088 passed（+3 skipped 不变），**+29 = workbench 10 + RelatedProcessesPanel 4 + HistoryVersionsDialog 4 + FormDesigner 6 + form-def api 3 + workflow api 2**，精确对应，无漂移。

**真实行为链**（本地起 `sw-bootstrap` dev/H2 + Redis，真实 `GET /auth/challenge` → 人工读图验证码 → RSA-OAEP 加密 `POST /auth/login`，后续以 accessToken 走真实 HTTP；脚本 `/tmp/p52-chain.mjs`，原始输出全录）：

| 步骤 | 请求 | 实际结果 |
|---|---|---|
| 登录 | challenge + login（P45 全链） | OK，accessToken 下发 |
| 建草稿 | POST /api/form/def | `p52_e2e_form_1788274332682`，formVersion=1 |
| 存 config | POST /api/form/def/{id}/config | code 0 |
| 发布 | POST /api/form/def/{id}/publish | code 0，物理表 `sw_form_kokavnz1gw` 建立 |
| 身份回查 | GET /api/form/def/{id} | status=PUBLISHED，formVersion=2（持久化回查一致） |
| 快照列表 | GET /api/form/def/{id}/snapshots | `[{"formVersion":2,...}]`，行内不含 definition |
| 快照详情 | GET .../snapshots/2 | definition 与保存内容逐字符一致 |
| 版本不存在 | GET .../snapshots/99 | `{"code":1301,"msg":"表单版本快照不存在: version=99"}` |
| 过滤前列表 | GET /api/workflow/defs?formKey=<key> | 0 条 |
| 创建关联流程 ×2 | POST /api/workflow/defs（name+formKey） | 服务端生成 processKey 并落库，graph 内嵌 formKey |
| 过滤后列表 | GET /api/workflow/defs?formKey=<key> | 恰 2 条（一个表单多流程），均绑定该 formKey |
| 零串入 | GET /api/workflow/defs?formKey=<其他> | 0 条；该其他表单流程创建请求本身因表单不存在被 2009 拒绝（对象级校验） |
| 伪关联拒绝 | POST /api/workflow/defs（formKey 不存在） | `{"code":2009,"msg":"绑定表单不存在"}` |

**肉眼验收**（`pnpm dev:mock` + 真实浏览器，截图为证）：

1. `/form/designer/seed-def-001`：工作台显示 请假申请单 / `leave-request` / 已发布 / V2，保存状态「未修改」，已发布全灰化 + 底部提示条；画布回显种子字段。
2. 历史版本：V2/V1 倒序、发布状态、发布时间；只读预览全屏带「历史版本 V2 · 只读」标识。
3. 关联流程：仅显示 leave-request 的流程（请假审批流程/已发布/V1）；创建入口存在。
4. 进入管理/编辑 → 流程定义列表页顶部出现「返回表单工作台」→ 点击返回 `/form/designer/seed-def-001?tab=processes`，原表单 + 关联流程工作区完整恢复。

## 4. 与方向的偏差

1. **路由结构修复（超出方向文字、属必要契约补齐）**：静态路由 `form/form-designer/:id?` 与菜单动态路由同名 `form-designer`，登录后 `addRoute` 按名替换使 `:id` 深链整体失效（浏览器实测命中 `/form/designer` 且 params 为空）。P52 验收标准 8（F5/深链恢复）以此为前置，故将工作台路由改为 `form/designer/:id?` + 独立命名 `form-designer-workbench`，列表/返回跳转同步改 path 直达。未改变任何产品语义。
2. **验证码无旁路**：P45 设计上不存在验证码旁路，真实链登录采用「人工读取验证码图片」与真实用户同路径，未绕过任何校验。
3. 方向 §3.4 提及的「挂起/激活」现有能力后端不存在，按方向要求**未提供**对应按钮，未伪装支持。
4. 后端 `publish` 返回 `R<Void>`（既有契约），前端发布成功后改为显式置状态 + 服务端身份回读，保证刷新前后状态/版本一致（验收标准 4）。

## 5. 遇到的问题、未完成内容和风险

- 启动本地后端需外部注入 `SW_CIPHER_KEY` / `SW_LOGIN_RSA_PRIVATE_KEY` / `SW_LOGIN_DIGEST_SECRET`（P45/加密基线的既定要求），已按环境变量注入，未改代码。
- 真实链中「其他表单」因并非真实存在的表单，其绑定请求被 2009 拒绝，故「其他表单流程零串入」由「过滤结果恰为当前表单流程集合 + 不存在表单无法建立关联」共同证明。
- 后端 `GET /workflow/defs` 既有响应为 BPM 实体直出（含 tenantId/version 等字段），本轮未改其形状（超出 P52 范围）。
- 历史版本回滚/差异比较/删除为方向明确非目标，未实现。

## 6. Git diff 摘要

- Smart-WorkFlow-Server：修改 8 文件、新增 3 文件（2 DTO + 1 测试类）；净增约 +560 行（含测试约 380 行）。
- Smart-WorkFlow-Web：修改 12 文件、新增 7 文件（3 组件/模块 + 4 测试）；净增约 +1500 行（含测试约 600 行）。
- 提交：三仓分别以 `feat(p52)` 前缀提交于 `develop-sw`，未推送。

## 7. 与规划验收边界逐项对照（方向 §7，1–12）

| # | 验收标准 | 证据 |
|---|---|---|
| 1 | 打开有权表单显示身份/保存/发布状态与版本；打开另一表单不串位 | 肉眼验收 1（身份区 + V2）；RelatedProcessesPanel.spec 切 formKey 重置请求；FormDesigner `loadForm` 序号防护 |
| 2 | 编辑→未保存；保存成功/失败/重试/迟到响应正确反馈；失败保留内容与未保存标记 | workbench.spec 五态机；FormDesigner.spec「保存失败→保存失败且不显示成功」「保存中防重复提交」；迟到响应 seq 防护 |
| 3 | 未保存时发布/切工作区/离开页面统一保护；取消不丢稿；保存失败不继续 | `guardUnsavedChanges` 单一实现被发布/切 tab/`onBeforeRouteLeave`/`beforeunload` 共用；FormDesigner.spec 发布守卫两例 |
| 4 | 发布只针对最近成功保存草稿；校验失败不发布；成功后刷新一致 | publishDef 硬时序（先 saveConfig）未变；发布后置 PUBLISHED + 服务端回读（STEP15 持久化回查一致）；预校验 + 后端 1204/1206/1207/1208 拦截 |
| 5 | 历史列表与持久化一致；预览只读有标识；退出不覆盖草稿 | 真实链 STEP6/7（列表与持久化快照一致、definition 逐字符一致）；肉眼验收 2（标识）；组件零回写断言 + 结构断言 |
| 6 | 关联流程只返回当前表单；多流程完整；零串入 | 真实链 STEP9/12/13（0→2 条、其他 formKey 0 条） |
| 7 | 创建关联流程服务端持久化；回查一致；返回可恢复上下文 | 真实链 STEP10-12 + STEP15；肉眼验收 4（返回恢复 `?tab=processes`） |
| 8 | F5/重载/深链/多标签维持正确表单与工作区；非法/无权/已删除明确拒绝 | 路由 `form/designer/:id?` + `?tab=` query 恢复（肉眼验收 4 URL）；拒绝态组件 + FormDesigner.spec 拒绝态用例；`parseWorkbenchTab` 非法值回退 |
| 9 | 不同权限账号页面能力/请求/后端结果一致；越权无副作用 | 后端沿用既有认证链；对象级校验实测（2009 拒绝、1301/1000 拒绝）；前端按钮灰化不替代后端（无权走真实拒绝态）。**注**：form/bpm 既有端点本无方法级权限注解（勘察事实），本轮沿用既有权限基线未扩权；如需对象级方法授权属独立治理事项，请规划裁决 |
| 10 | 无假按钮/错误成功/空白关键页/纯前端伪关联 | 关联由 `sw_bpm_process_def.form_key` 服务端持久化；无 formKey 引导态而非假列表；无挂起/激活假按钮 |
| 11 | 既有表单编辑/保存/发布、流程创建/管理、表单→流程主链无回归 | 后端 990/0/0/0（基线 +11 精确对应）；前端 1088/0（含全部既有回归）；四连全绿 |
| 12 | 只提交执行回执，不提前写 PASSED/COMPLETED、不核销、不改清单 | 即本回执口径 |

## 8. 自验结论

P52 方向 §2/§3 全部目标与契约已在前后端落地并经真实行为链 + 持久化回查 + 浏览器肉眼验收证明；两仓完整校验门全绿且计数精确对应；验收边界 12 项均有行为证据（第 9 项含如实披露的既有权限基线事实）。**自验通过，待规划独立验收。**

```
ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"L","receipt":"product/p52-form-workbench/receipts/completion-p52-form-workbench-20260901.md","evidence":["Smart-WorkFlow-Server: MAVEN_OPTS=-Xmx2g mvn -q compile 退出码 0","Smart-WorkFlow-Server: mvn test BUILD SUCCESS，Tests run: 990, Failures: 0, Errors: 0, Skipped: 0（基线 979+新增 11，无漂移）","Smart-WorkFlow-Web: pnpm typecheck/lint/test/build 四连退出码 0/0/0/0，Test Files 113 passed|1 skipped，Tests 1088 passed|3 skipped（基线 1062+新增 29，无漂移）","真实行为链：dev/H2 真实登录（challenge+人工读图验证码+RSA-OAEP）→ 建草稿/存 config/发布（物理表 sw_form_kokavnz1gw、formVersion 1→2）→ 快照列表/详情（definition 逐字符一致）/1301 反例 → workflow defs formKey 过滤 0→2→零串入、伪关联 2009 → 持久化回查一致","肉眼验收（dev:mock 真实浏览器）：工作台身份/保存五态/已发布灰化、历史版本倒序与只读标识、关联流程区单表单过滤、进入流程管理并返回恢复 /form/designer/seed-def-001?tab=processes"],"feature_status":"VERIFYING"}
```
