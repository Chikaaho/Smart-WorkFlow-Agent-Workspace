# Server 0.4.1 + Web 0.3.8 · 阶段 2—3 实施与隔离环境验收证据（execution-041-01）

日期：2026-11-10｜执行（Executor）｜方向：`product/approval-record-patch/ready/direction-server-041-web-038.md`｜等级：L

## 1. 概要

阶段 1—3 完成：0.3.7 收尾（C1—C3）、Server 0.4.1 与 Web 0.3.8 分支实现、隔离环境（本机 Server 0.4.1 分支 + 克隆库 `smart_workflow_041` + Web 0.3.8 生产构建）行为验证。**按方向「先验收后合并」，当前停在阶段 3，等待 Planner 验收通过后才进入阶段 4（合并）。**

- 七阶段进度：评估、实施、验收证据已完成；**验收裁决待 Planner**；合并、发版、部署与同步、结束未开始 → **2/1/4**
- Server 分支：`fix/0.4.1-approval-history` @ `f65bdeeb`（已推送）
- Web 分支：`fix/0.3.8-approval-record` @ `fb9e706`（已推送；含 CI 源覆盖移除 `3ffb744`）

## 2. 0.3.7 收尾（C1—C3）

| ID | 结果 |
|---|---|
| C1 | Server README 合并提交 CI：develop `42760022678`（重跑后）**success**、main `42760040390` **success**。首次 develop 失败为既有 flaky `AgentModelManageServiceImplTest.listEnabled_shouldExcludeProviderDisabledModels`（H2 `SMALLINT`/`BOOLEAN`），与文档提交无关；重跑通过 |
| C2 | `memory/` 压缩：Planner 14:16 已重写 state/handoff 当前段并压缩 P66 历史细节；执行侧核对 **20,561 B → 19,854 B**（<20,000；单文件最大 `decisions.md` 4,971 B <5KB）。本轮执行侧未新增 memory 内容 |
| C3 | npmmirror 恢复验证：临时探针分支（`feature/ci-probe-041`，移除覆盖的提交 `b56b0be`）CI run `42770185677` **success**（pnpm install 未再超时），探针分支已删除；Web 分支保留覆盖移除提交 `3ffb744`，随本次合并进入 develop/main |

Z4（17:16 后）尚未到点，按需求池置顶条目在本次任务到点补做。

## 3. Server 0.4.1（W-c）

### 3.1 实现

- `ApprovalHistoryEnricher`（新）：把「我发起的」实例详情的意见字段解析抽出为共享实现（冻结快照 → 中文标签/展示值：人员姓名、日期 `yyyy-MM-dd HH:mm`、多选顿号），并新增处理人部门解析（主部门名；无部门/部门停用留空）。
- `BpmTodoController`（任务详情 `GET /workflow/tasks/{taskId}`）：历史装配后调用同一 enricher；新增可选注入 `UserQueryFacade`、`DeptQueryFacade`，旧构造签名保留（测试兼容）。
- `BpmMyInstanceController`：改为委托 enricher（口径与任务详情完全一致），并同样补部门。
- `ApprovalHistoryItemDTO`：新增 `assigneeDept`。
- Facade 扩展（默认方法，未实现方不受影响）：`UserQueryFacade.getUserDeptIds(ids)`、`DeptQueryFacade.findActiveDeptNames(ids)`；实现于 `UserFacadeImpl`/`DeptFacadeImpl`（只读、脱敏、正常状态过滤）。**未改数据库迁移。**

### 3.2 测试与 PG 证据

- 单测：`BpmTodoControllerTest` 新增「任务详情历史带意见字段与处理人部门」；`BpmTodoControllerTest` + `BpmMyInstanceControllerTest` 共 **43 tests / 0 failures / 0 errors**。
- 真实 PostgreSQL：新增 `ApprovalHistoryDeptPostgresTest`（zonky 内嵌 PG + 全链 Flyway 迁移 + 真实 `sys_user`/`sys_dept` 查询），覆盖有意见表单的会签行、无意见表单的普通行、处理人无部门三场景；本机实测 **Tests run: 1 / Failures: 0 / Errors: 0**。
- 隔离环境实测（Server 0.4.1 分支 jar + 克隆库 `smart_workflow_041`，端口 18092，profile `local`，仅本机）：
  `GET /api/workflow/tasks/c548f6a4-daa8-11f1-9895-00ff9e2a8dfb` 返回 7 行历史；「分公司技术委员会会签」3 行 http://127.0.0.1:18092/api/workflow/tasks/... 实测：
  - 冯雪 / 运维保障部 / 风险评级：低 · 影响系统清单：办公系统 · 预计停机时长：45 分钟
  - 杨帆 / 基础设施部 / 风险评级：低 · 影响系统清单：办公系统 · 预计停机时长：45 分钟
  - 刘洋 / 网络与信息安全部 / 风险评级：低 · 影响系统清单：办公系统 · 预计停机时长：60 分钟
  另 `node_hq_normal`（陈静/华南分公司）、`node_dept_head`（陈静）等行同样返回意见字段与部门；`node_bl_normal`（孙悦/赵磊）因该动作无意见数据保持字段为空、部门正常。
- 原始响应：`receipts/evidence/w-c-api-detail.json`。

## 4. Web 0.3.8

### 4.1 W-a2（画布连线与可读性）

- 适配层：所有节点 `sourcePosition=Right`、`targetPosition=Left`（连线从源节点右侧接目标节点左侧，不再从底部/顶部绕弧）；`fitViewOnInit` 保持，`maxZoom=2`；节点字号 CSS 提升至 20px（`node-theme.css`），保证 fit 缩放后渲染仍 ≥12px。
- 隔离环境实测（`/agent/graph-designer/2118727907588182017`，MES 温度偏离智能研判 v8，1440×900）：
  - 节点 7、连线 6；**source 右侧 handle 7/7、target 左侧 handle 7/7**；
  - fit 缩放 **0.6168**；节点字号 CSS 20px → **渲染 12.34px（≥12px）**；
  - 图横向宽度 **1070px / 画布 726px → 占比 0.909（≥60%）**；
  - 节点类型样式无回退：START/END `rgb(24,166,122)`、KNOWLEDGE `rgb(124,58,237)`、LLM `rgb(37,99,235)`、CONDITION `rgb(229,72,77)`，底色与边框同 0.3.7。
  - 截图：`w-a2-designer.png`；测量：`w-a2-measures.json`。

### 4.2 W-c（Web 会签弹窗）

- 隔离环境：任务详情 → 审批详情 → 「会签记录 · 分公司技术委员会会签」弹窗，3 行实测：
  - 冯雪 / 运维保障部 / `风险评级：低 · 影响系统清单：办公系统 · 预计停机时长：45 分钟`
  - 杨帆 / 基础设施部 / 同格式摘要
  - 刘洋 / 网络与信息安全部 / `…预计停机时长：60 分钟`
- 「动作/意见」与审批详情表同源同格式（每段「标签：值」），「所属部门」显示实际部门名；无误显示 `-` 的行。
- 截图：`w-c-sign-dialog.png`；行文本：`w-c-sign-dialog.json`。
- 代码无需改动（弹窗与审批详情早已消费 `opinionFields`/`assigneeDept`，缺的是服务端数据）。

### 4.3 W-b2（原场景长表单复测）

- 只读打开真实任务 `/workflow/task/6a998119-da80-11f1-9645-00ff9e2a8dfb`（跨部门灾备演练计划审批，表单实际高度 **1128px ≥1000px**）：

| 视口 | `.instance-flow-panel` | 页签内容区 | scrollWidth/clientWidth | 页签 |
|---|---|---|---|---|
| 1440×900 | **112px（>0）** | 64px | 1440/1440 | 流转记录/流程图/审批详情，可切换 |
| 1920×1080 | **144px（>0）** | 96px | 1920/1920 | 同上 |

- 面板未被压缩，页签内容可见可切换，无横向溢出；无需修代码。
- 截图：`w-b2-task-1440.png`、`w-b2-task-1920.png`；测量：`w-b2-measures.json`。

### 4.4 W-e（实例列表发起时间）

- `/workflow/instances`（流程监控）列表「发起时间」列实测前 8 行：`2026-11-07 20:57` 等，全部 `yyyy-MM-dd HH:mm`，`hasT=false`，无微秒；同页其他列未变。
- 截图：`w-e-instance-list.png`；数据：`w-e-list-times.json`。

## 5. 门禁

| 项 | 结果 |
|---|---|
| Web typecheck | 通过（`vue-tsc -b --noEmit` 无错误） |
| Web lint | 通过（eslint 0 errors；两处 prettier 警告已 `--fix`） |
| Web 单测 | **2054 passed / 3 skipped（2057）** |
| Web build | `✓ built in 4.96s`（dist 用于隔离环境证据） |
| Server 单测（受影响） | 43/0/0（见 §3.2） |
| Server 真实 PG 测试 | 1/0/0（`ApprovalHistoryDeptPostgresTest`） |
| Server 全量 `mvn test` | **2,482 / 0 failures / 0 errors / 45 skipped**（本机干净重跑，含新增 `ApprovalHistoryDeptPostgresTest`；较 0.4.0 的 2,481 多 1 条） |

## 6. 证据文件（`product/approval-record-patch/receipts/evidence/`，本地、不入 Git）

`w-a2-designer.png`、`w-a2-measures.json`、`w-c-sign-dialog.png`、`w-c-sign-dialog.json`、`w-c-api-detail.json`、`w-b2-task-1440.png`、`w-b2-task-1920.png`、`w-b2-measures.json`、`w-e-instance-list.png`、`w-e-list-times.json`、`isolated-shots.mjs`、`serve-web041.mjs`、`w-c-token.txt`（仅本机调试令牌，交付前删除）。

隔离环境：Server 0.4.1 分支 jar（worktree `E:/code/sw041-server`）+ 克隆库 `smart_workflow_041`（由本机 Docker postgres 的 `smart_workflow_030` dump 恢复，只读复制；未动用户 8080/5173 服务）+ Web 0.3.8 dist（`serve-web041.mjs` 静态服务并代理 `/sw-server/api`→`18092/api`）。

## 7. 偏差与说明

1. W-c 的「所属部门」在「我发起的」实例详情也会出现（同一 enricher）；这是为两处口径一致，未改任何既有字段语义。
2. W-a2 采用「fit 整图 + 基础字号 20px」：该图 fit 缩放 0.617，渲染字号 12.34px；其他更小的图 fit 缩放更大，字号更清晰。若规划要求特定字号区间，请指出数值后再调。
3. 隔离环境 `node_bl_normal` 两行历史因原动作未提交意见数据，弹窗仍显示「自定义审批表单」；验收对象（分公司技术委员会会签）全部有摘要，属真实数据差异，未伪造。
4. 门禁：Server 分支未触发 GitHub CI（工作流仅 main/develop/feature/**），阶段 4 合并时统一取 CI 结论。

## 8. 待补与下一步

- Server 全量 `mvn test` 已完成：**2,482 / 0 / 0 / 45 skipped**。首轮 3 条 I6 重启库测试失败系上次运行遗留文件 H2（`target/i6-restart-db`）导致，清理该测试库后 3/3 通过、干净全量重跑全绿；属已登记的 I6 重启库偶发族，非本次改动。
- 阶段 3 验收通过后按方向进入阶段 4：两仓分支 → develop → main，CI success 后删分支；阶段 5 发 Server 0.4.1 / Web 0.3.8；阶段 6 部署 UAT 并复测 + R1a/R1b/R3b 拍图与同步；阶段 7 结束。
