# 批次 1 回执 — V012-BUG-001 已办任务详情（前后端）

- 日期：2026-09-26
- 任务：`v0.1.2-bugfix`（L）；方向 `product/v0.1.2-bugfix/ready/direction-v0.1.2-bugfix.md`
- 批次范围：V012-BUG-001（已办真实任务进入详情不再错误落入待办并提示不存在；按流程状态、审批状态和实际权限决定访问与字段可编辑性）
- 结论：**执行自验通过（含 headed 浏览器行为证据），待 Owner 单项验收**

## 根因

已办列表（`ProcessedList`）、统一工作台（`WorkflowCenter` 已办页签、`WorkspaceBoard` 已办页签）点击任务只携带 taskId 进入 `TaskDetail`，详情页只调 `GET /workflow/tasks/{taskId}`；该接口的存在性查询只查 Flowable **运行期**任务表（`taskService.createTaskQuery()`），任务完成即被引擎移出运行期 → 必然 404「任务不存在」。权限判定也只比对运行期 assignee。

## 实际修改文件与摘要

### Smart-WorkFlow-aPaaS-server（`0.1.2-bugfix@72b8d01`，已推送回读一致）

| 文件 | 摘要 |
| --- | --- |
| `sw-bpm-api/.../facade/BpmTaskFacade.java` | 新增 `getHistoricTask(taskId)`：只查已完成历史（endTime 非空），与 `getTask` 运行期语义隔离，办理动作/生命周期路径不受历史回落影响 |
| `sw-bpm-engine/.../BpmTaskFacadeImpl.java` | 实现 `getHistoricTask`（`historyService.createHistoricTaskInstanceQuery().taskId().finished()`） |
| `sw-bpm-process/.../dto/TaskDetailRespDTO.java` | 新增 `taskStatus`（RUNNING/FINISHED）、`instanceStatus`（业务实例状态）、`canHandle`（服务端办理权限判定，历史任务恒 false） |
| `sw-bpm-process/.../controller/BpmTodoController.java` | `detail()`：运行期查不到回落已完成历史；填充三个新字段；流程变量与业务键走历史回落；历史任务不生成意见表单；**权限口径不变**（本人〔含历史办理人〕/超管/`workflow:monitor:view`），不放宽 |
| `sw-bpm-process/.../controller/BpmTodoControllerTest.java` | 新增 3 例：已办详情 FINISHED 只读断言、已办越权拒绝（403）、待办 canHandle=true 暴露 |

### Smart-WorkFlow-aPaaS-Web（`0.1.2-bugfix@7e7c74a`，已推送回读一致；修正随批次 2 提交）

| 文件 | 摘要 |
| --- | --- |
| `src/contracts/bpm.ts` | `TaskDetail` 契约新增可选 `taskStatus` / `instanceStatus` / `canHandle` |
| `src/modules/workflow/views/TaskDetail.vue` | `canAct = taskStatus !== 'FINISHED' && canHandle === true` 门控快捷审批与底部办理卡（无权限身份/已办不再出现通过/驳回按钮）；`quickActionsVisible` 排除已办；页头状态标签改由 `instanceStatus` 驱动（已通过/已驳回/进行中/已终止）；`goBack` 按 `route.query.source === 'processed'` 回已办列表；返回按钮文案 `backToProcessed` |
| `src/modules/workflow/views/ProcessedList.vue` | 新增操作列（Details 按钮，等同行点击跳转）+ 跳转携带 `query: { source: 'processed' }` |
| `src/modules/workflow/views/WorkflowCenter.vue` | 已办页签 openRow 携带 `source=processed`；每 tab 表格加详情操作列与客户端分页 |
| `src/modules/workflow/components/WorkspaceBoard.vue` | 工作台待办面板已办页签深链携带 `source=processed`（新增 `openPanelTask`） |
| `src/modules/workflow/views/MyProcessed.vue` | 新增操作列（详情，source=processed） |
| `src/modules/workflow/views/MobileWorkspace.vue` | 移动端详情抽屉审批动作按 `canHandle === true` 门控 |
| `src/foundation/mock/handlers.ts` | mock 任务详情接口回落 `MOCK_PROCESSED_TASKS` 返回只读已办详情（taskStatus=FINISHED、canHandle=false、instanceStatus 取自 MOCK_INSTANCES） |
| `src/locales/zh-CN.ts` / `en-US.ts` | 新增 `workflow.backToProcessed` |
| `src/modules/workflow/views/TaskDetail.spec.ts` | 新增 4 例：source=processed 回跳、FINISHED 只读+实例状态标签、RUNNING 无权限隐藏办理卡、RUNNING 有权限渲染办理卡 |
| `src/modules/workflow/views/ProcessedList.spec.ts` | 行点击断言同步 `query: { source: 'processed' }` |

### 批次 2 内的关联修正（`0.1.2-bugfix@a6ea769` 及修正提交）

- 页头状态标签待办分支同步改为 `instanceStatus` 优先：真实后端 `TaskDetailRespDTO` 无 `nodeKey` 字段，旧 nodeKey 推断恒走"已通过"分支、**运行中待办误显示"已通过"**；现为 RUNNING→进行中（浏览器复验确认），nodeKey 仅作旧 mock 契约后备。

## 实际命令与原始结果

- 后端：`MAVEN_OPTS="-Xmx2g" mvn -q compile` → exit 0；聚焦测试（engine+process 模块）→ exit 0；**全仓 `mvn test` → BUILD SUCCESS exit 0，surefire 汇总 265 文件 `tests=1573 failures=0 errors=0 skipped=0`**（前基线 1570 + 本批新增 3，精确对应）。
- 前端四连（`NODE_OPTIONS="--max-old-space-size=2048"`）：typecheck exit 0；lint 0 error（273 warning 均既有）；vitest `141 passed + 1 skipped 文件 / 1293 passed + 3 skipped 用例`；build exit 0（批次 2 复跑同为全绿，计数见批次 2 回执）。

## 与验收标准逐项对照

| 验收边界 | 结果 |
| --- | --- |
| 已办真实任务进入详情不再错误落入待办并提示不存在 | ✅ 浏览器实测（真实库数据）：已办列表 Details → `/workflow/task/6134a1d5-…?source=processed`，详情正常渲染，无"任务不存在" |
| 按流程状态决定可编辑性 | ✅ `taskStatus=FINISHED` → 快捷审批/底部办理卡/意见表单全部不渲染（浏览器实测无 Approve/Reject/转办等任何办理按钮） |
| 按审批状态展示 | ✅ 页头标签展示真实 `instanceStatus`（实例 APPROVED → "Approved"）；待办 RUNNING → "In progress"（批次 2 修正后复验） |
| 按实际权限决定访问与可编辑性 | ✅ 服务端权限判定不变（本人〔含历史办理人〕/超管/监控查看）；`canHandle`（candidateOrAssigned）决定审批动作显隐；浏览器实测待办（可办理）Approve/Reject/办理卡齐全、已办（FINISHED）全部隐藏；禁止放宽权限——历史回落只影响读取路径，办理动作链（TaskActionService）未接入历史回落 |
| 允许与拒绝路径均有行为证据 | ✅ 允许路径浏览器实测（见下）；拒绝路径：单测真实行为链 `detail_historicTask_outsider_shouldDeny`/`detail_outsider_shouldDeny`（非办理人 403「无权查看该任务」），前端无权限身份审批按钮不渲染由 canHandle 门控实测佐证 |

## 浏览器行为证据（headed，headless=false）

- 环境：本地后端 `bootstrap-dev.jar`（`SPRING_PROFILES_ACTIVE=local`，PostgreSQL `sw_apaas_test`，health 200 UP）+ 前端 dev（`http://localhost:5174`，/api 代理 8080）；身份 admin（V4 种子）；视口 1440×900；界面语言 English（跟随浏览器设置，对象可识别）。
- 允许路径（制品 `evidence/batch-01/processed-task-detail-readonly-approved.png`）：已办列表（1 条真实已办"测试1"，业务单号 ad5cdfc9-…）→ Details → 详情页：标题"测试1"+ 绿色 "Approved" 实例状态标签、Form data（单行文本 123321）、Flow status（审批 · 系统管理员 · Agreed）、Flow variable（历史变量回落：approver/recordId/submitter/outcome=APPROVED 等）、流转记录；**页面无任何审批操作区**；返回按钮 "← Back to processed"，点击回 `/workflow/processed` ✅。
- 待办回归（同日 URL `/workflow/task/c08500d9-…`）：待办详情 Approve/Reject 按钮、底部办理卡（转办等）齐全（canHandle=true），状态标签 "In progress"；无"任务不存在"。
- 拒绝路径：以服务端单测真实行为链覆盖（403），浏览器层以 canHandle 门控的显隐差异佐证（无权限身份不渲染审批按钮）。
- 修复前对照：Owner 登记截图（任务详情红色"任务不存在"、左侧"待办任务"高亮）。

## 偏差与边界

- 偏差：页头标签待办分支顺手修正为实例状态驱动（原 nodeKey 推断为既有误显示，真实接口下恒显示"已通过"）；属 BUG-001"按审批状态展示"边界内。
- 边界：被取消/删除的任务（deleteReason 非空）不回落（与已办列表 D4 口径一致，仍 404）；`opinionForm` 仅待办返回（历史任务意见看板走 approvalHistory）。
- Git：两仓均从核实同步后的 develop（Web `1871725`、Server `2d4278b`）创建 `0.1.2-bugfix`，普通推送建立跟踪，远端 SHA 回读一致；未合并 main、未创建 tag/Release、未部署。
