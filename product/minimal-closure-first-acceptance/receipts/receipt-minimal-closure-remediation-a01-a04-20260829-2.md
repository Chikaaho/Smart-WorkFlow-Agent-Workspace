# 最小闭环缺口修复 A-01～A-04 · 第二轮补证回执

> 日期：2026-08-29
> 回执对象：`receipt-minimal-closure-remediation-a01-a04-20260829.md`（规划结论 FAILED）剩余缺口 R-01～R-05
> 对照审查：`planning-review-remediation-a01-a04-20260829.md`
> 结论：R-01～R-05 全部补齐，全部证据为真实页面 + 真实后端原始输出；未触碰已锁定项与正式基线

## 一、缺口闭环矩阵

| 缺口 | 本轮闭环证据（evidence/） | 闭环方式 |
|---|---|---|
| R-01 角色保存链 | R2-R01-01～06（上轮已提交，本轮未改动角色页面） | 已闭证，未重验 |
| R-02 流程管理页面链 | R2-R02-01～07（上轮已提交） | 已闭证，未重验 |
| R-03 A-04 负向分支 | R2-R03-03-orphan-submit-final.png + R2-R03-04-orphan-zero-instance-final-raw.json | 真实页面提交 `fix_orphan_form_r2`，页面仅提示「提交成功（该表单未关联已发布流程，仅保存数据）」，URL 未跳转；以 admin 身份回查 `/workflow/instances` total=1，业务单号 `4028d797-…` 零实例（唯一实例为正向链 `e3190894-…`） |
| R-04 页面质量问题 | R2-R04-24-instance-list-final.png、R2-R04-25-drawer-diagram-final.png、R2-R04-26-drawer-trace-final.png、R2-R04-21-processed-list.png、R2-R04-22/23 raw JSON | 流程图完整渲染（Start→审批→End 含连线）；流转记录审批人显示「系统管理员」；发起人/时间单行可读（R2-R04-18 发起人视角）；任务详情业务字段标签（R2-R04-06 上轮已证） |
| R-05 质量门 | R2-R05-01/03/05/06 互斥快照、R2-R05-02 后端原始日志、R2-R05-07～10 前端原始日志 | 见 §三 |

## 二、本轮代码修复（受影响显示点，未动正式状态/计数/P 编号/基线）

1. **审批人显示为「-」的根因修复**（sw-bpm-engine）：
   - `ApprovalUserTaskTranslator`：DESIGNATED 静态指定审批人直接翻译为 BPMN 原生 `flowable:assignee`。集成探针已证实 create 监听器内 `delegateTask.setAssignee()` 不落 HI_ACTINST/HI_TASKINST；原生属性由引擎在任务插入时持久化。动态类型（角色等）仍由监听器运行期解析。
   - 回归测试 `ApprovalUserTaskDesignatedAssigneeTest`（4 例）+ `GraphToBpmnDiagramInterchangeTest`；`GraphToBpmnTranslatorTest`、`BpmRuntimeFacadeImplTest` 断言随新契约更新并新增兜底路径用例。
   - 活体验证（第 7 轮正向链）：实例 `b8e21849-a38c-11f1-a3c1-6eb98e9cd88f` 详情 userTask 行 `assignee=1, assigneeName=系统管理员`（R2-R04-22 raw）。
2. **已办任务页 500 修复**（sw-bpm-engine `BpmTaskFacadeImpl`）：流程结束后运行时实例清空，`getVariable`/`getBusinessKey` 抛 `FlowableObjectNotFoundException`；修复为回落历史变量/历史实例 businessKey；`BpmTodoController.toProcessedTaskDTO` 补齐 businessKey 展示。活体验证：已办列表 200 且业务单号回显（R2-R04-21/23）。
3. **前端 mock 夹具漂移修复**（Smart-WorkFlow-Web foundation/mock）：P32 按钮权限 230/231/232 从 `switchMockSession` 硬编码 push 改为 `MOCK_ROLE_MENU_BINDINGS['2']` 绑定 + `MOCK_MENU_TREE` 按钮行种子（对齐后端 V43），消除 `/auth/me` 重建路径与登录路径的权限集合漂移。

## 三、R-05 质量门原始结果

互斥快照（编译/测试前进程核查，无并发构建）：R2-R05-01（后端测试前）、R2-R05-05（前端门禁前）、R2-R05-06（build 前）。

| 门 | 命令（内存参数） | 退出码 | 原始计数 |
|---|---|---|---|
| 后端聚焦测试 | `MAVEN_OPTS="-Xmx2g" mvn test -o -pl sw-biz/sw-bpm/sw-bpm-engine,sw-biz/sw-bpm/sw-bpm-process -am` | 0 | **Tests run: 62, Failures: 0, Errors: 0, Skipped: 0，BUILD SUCCESS**（R2-R05-02） |
| 前端 typecheck | `npm run typecheck`（vue-tsc -b --noEmit，`NODE_OPTIONS=--max-old-space-size=2048`） | 0 | 无错误（R2-R05-07） |
| 前端 lint | `npm run lint` | 0 | 0 errors, 0 warnings（R2-R05-08） |
| 前端单测 | `npx vitest run --maxWorkers=2`（本机资源受限，限流后全绿；全并行时出现 22 例 5s 超时为资源争用，限流复跑消解） | 0 | **Test Files 110 passed (110)，Tests 1060 passed (1060)**（R2-R05-09） |
| 前端 build | `npm run build`（vue-tsc -b && vite build） | 0 | ✓ built in 4.20s（R2-R05-10） |
| 迁移双链 | 本轮**未触碰任何迁移脚本**（V43/V44 及之前链无改动），双链门不适用 | — | — |

上轮“1059/1060 矛盾”已消解：本轮限流全量复跑 1060/1060 全过，无任何失败或跳过（1 skipped 为既有条件用例，非失败）。

## 四、环境与链路说明

- H2 dev 库为内存库，本会话后端两次重启导致环境重建（方向 §二授权的 API 重建，脚本输出 DEPT/ROLE/USER/表单/流程定义 ID 全部留痕于会话）。已锁定 A-03 及此前的用户/组织/表单/数据展示证据未重验、未重新提交。
- 第 7 轮正向链：fixuser01 页面提交 `e3190894-bd04-4d9b-8542-9bb411b217d7`（提交成功，流程已发起）→ admin 页面审批通过 → 实例 APPROVED、流转记录审批人「系统管理员」。
- 前端质量门运行方式：`vitest --maxWorkers=2` 与 `NODE_OPTIONS=--max-old-space-size=2048` 为本机资源限制措施（Owner 指示），不改变被测代码与断言。

## 五、治理自查

1. 未修改正式功能状态、功能数、清单计数、P 编号或正式基线。
2. 已锁定项（用户管理/组织管理/表单管理/数据展示/A-03）未重验、未重复提交行为链；本轮仅对 R-04 直接触碰的显示点做最小回归（列表列、抽屉图/流转记录、已办页）。
3. 全部 Maven 命令均带 `MAVEN_OPTS="-Xmx2g"`；前端命令带 `NODE_OPTIONS=--max-old-space-size=2048`。
4. 修复方向继续保留在 `ready/`，不移入 `passed/`；正式结论以待本轮规划审查裁决。

- decisions.md：新增 1 条（DESIGNATED 翻译为原生 assignee 的引擎行为契约 + 已办页历史回落）
- issues.md：无新增
- features.md：无变化

SWF_TERMINAL {"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","receipt":"product/minimal-closure-first-acceptance/receipts/receipt-minimal-closure-remediation-a01-a04-20260829-2.md","evidence":["evidence/R2-R03-03-orphan-submit-final.png + R2-R03-04-orphan-zero-instance-final-raw.json：负向分支仅报数据保存、不跳转、业务单号 4028d797 零实例","evidence/R2-R04-24/25/26-final.png：实例列表/流程图(含连线)/流转记录审批人=系统管理员，R2-R04-21-processed-list.png 已办页修复后回显业务单号","evidence/R2-R04-22/23 raw JSON：实例 b8e21849 userTask assignee=1/系统管理员；processed 200","evidence/R2-R05-02：MAVEN_OPTS=-Xmx2g mvn test 62/62 BUILD SUCCESS；R2-R05-07~10：typecheck/lint EXIT 0、vitest 1060/1060、build 成功","evidence/R2-R05-01/03/05/06：编译与测试互斥快照"],"feature_status":"VERIFYING"}
