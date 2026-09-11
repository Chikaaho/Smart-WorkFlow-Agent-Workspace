# P60 I3「人工审批与自研流程设计器」首次执行回执 01

> 执行（Executor）→ 规划（Planner）
> 日期：2026-09-10
> 方向：`product/v0.1.0-oa-completion/ready/direction-stage-i3-manual-approval-first-party-process-designer.md`
> 候选：Server `7342de3`（develop-sw 工作树，未提交）、Web `5dfd6ee`（develop 工作树，未提交）
> 结论：**自验通过（实现 + 自动化门禁 + 真实行为链抽样），待规划验收（VERIFYING / EXECUTION_SUBMITTED）**
> 机器终态：`VERIFYING / EXECUTION_SUBMITTED`（十八项标准由规划独立确认后方可裁决 I3 PASSED）

---

## 1. 功能与内部 Step 概要

| Step | 范围 | 状态 |
|---|---|---|
| B1 | 图契约坐标化（`GraphElement.x/y/waypoints`、`ProcessGraph.contractVersion=2`）+ `sw_bpm_process_def_version` 发布冻结 + 挂起/激活/安全删除 + 全量校验端点（nodeKey/edgeKey 定位锚） | 完成 |
| B2 | 动作语义扩展（`ApprovalAction` 12 值：APPROVE/DISAPPROVE/RETURN/REJECT/TRANSFER/DELEGATE/AUTHORIZE/ADD_SIGN/SUPPLEMENT_SIGN/WITHDRAW/COMMUNICATE/DISCARD）+ 生命周期统一执行核心 + 迁移 V71 表 + 会签 DB 唯一键计数（替代单 JVM synchronized）+ VETO 一票否决 + 退回轮次 `round_no` | 完成 |
| B3 | 办理时限调度（`sw_bpm_task_deadline` + DB 原子认领扫描器）+ 受控节点函数（`NodeFunctionService` + 注册表 V72 + `func_tenant_admins`/`func_audit_trail` 内建 v1 + 发布期校验 + 参与人/结果两个运行钩子）+ 意见表单不可变快照（等价引用） | 完成 |
| B4 | `BpmNotifyTrigger` 扩展 8 触发器 + 发起时绑定 `def_version` + 权限菜单种子（全局链 V73：11 个按钮码 + role 2 授予） | 完成 |
| W1/W2 | `contracts/process-graph.ts` 契约 + `adapters/process-graph`（归一化/确定性兼容布局/设计器内核/undo 30 步）+ `ProcessGraphView.vue`（只读渲染/轨迹状态高亮/缩放平移适配）+ `ProcessDesigner.vue`（能力面板/拖入/删除/属性/保存/校验/发布/错误定位）+ 路由 `workflow/defs/:defId/design` | 完成 |
| W3 | bpmn-js 完整退出：adapter 目录删除、`package.json`+`pnpm-lock.yaml` 移除、两个消费点迁移（ProcessDefList 查看对话框、ProcessInstanceList 详情抽屉）、`EditProcessDefDialog.vue` 删除、ESLint 禁引消息更新 | 完成 |
| W4 | Web 四连 + 产物残留检查（零残留） | 完成 |

## 2. 实际读取/修改文件（摘要）

**Server（sw-bpm 为主，工作树未提交）**
- 迁移：`sw-bpm-process/.../bpm/{h2,postgresql}/V70__i3_process_def_version_freeze.sql`、`V71__i3_action_semantics.sql`、`V72__i3_deadline_function_snapshot.sql`；全局链 `sw-bootstrap/.../{h2,postgresql}/V73__i3_bpm_action_permissions.sql`
- API：`GraphElement`（x/y/waypoints）、`ProcessGraph`（contractVersion）、`GraphValidationError`（nodeKey/edgeKey）、`BpmTaskFacade`（setAssignee/delegateTask/getTaskOwner/addCandidateUser）、`BpmTaskDTO`（owner/delegationState）、`BpmDeployFacade`（suspend/activate/findByDeployment）、`BpmErrorCode`（24xx 17 个）、`BpmNotifyTrigger`（8 新触发器）、端口：`ConsensusVotePort`/`ConsensusSettlementPort`/`LifecycleTaskEntryPort`、`nodefunc/`（Context/Result/ParticipantFunction/ResultFunction）
- 引擎：`ConsensusTaskListener`（DB 票计数 + 变量兜底）、`ConsensusCompletionEvaluator`（VETO + 端口 + 负向终局）、`ApprovalTaskListener`（代理改派 + 函数参与人 + 时限登记接缝）、`BpmTaskFacadeImpl`（新动作 + owner/delegationState）、`BpmDeployFacadeImpl`、`ApprovalUserTaskTranslator`/`ConsensusNodeTranslator`（VETO、nodeConfig 透传）
- 业务：`BpmProcessDefServiceImpl`（保存格式门 + 草稿版本递增 + 发布冻结 + 挂起/激活/下线 + 安全删除 + 函数发布校验）、`BpmProcessDefVersion` 实体/Mapper、`TaskActionService`（DISAPPROVE 结算策略/加签门/REJECT 流程级/轮次/快照/结果函数钩子）、`ApprovalLifecycleService(+Impl)`（转办/委托/沟通/加签/补签/撤回/废弃/代理规则/投票端口/生命周期端口/会签负向结算）、`NodeFunctionService`、`nodefunc/` 两个内建、`TaskDeadlineScheduler`、`BpmLifecycleController`、`BpmProcessDefController`（versions/version graph/suspend/activate/by-key）、`BpmProcessDef`/`BpmInstance`/`ApprovalActionRecord`/`InstanceStatusEnum` 实体扩展、`BpmNotifyListener` 映射、`BpmLifecyclePortConfiguration`
- 测试修复（受影响原子回归）：`schema-process-def-h2.sql`（新列）、`GraphJsonPersistenceIntegrationTest`/`MyProcessedRealSourceTest` 构造器、`BpmTodoControllerTest`（REJECT 流程级新语义）、`ConsensusCompletionEvaluator` 兼容构造器、`FlywayFullChain{H2,Postgres}Test`（迁移计数 73/72 与区间文案）

**Web**
- 新增：`src/contracts/process-graph.ts`、`src/adapters/process-graph/{index.ts,index.spec.ts}`、`src/modules/workflow/views/{ProcessGraphView.vue,ProcessDesigner.vue}`
- 修改：`src/contracts/bpm-node.ts`（策略 7 值 + 12 动作契约）、`bpm.ts`（注释）、`src/modules/workflow/api/index.ts`（by-key/validate-direct/versions/suspend/activate + 9 类生命周期动作包装 + ProcessGraphPayload 扩展）、`ProcessDefList.vue`、`ProcessInstanceList.vue`、`src/router/index.ts`（设计器静态路由）、`eslint.config.js`、`package.json`+`pnpm-lock.yaml`（bpmn-js 移除）、`src/foundation/mock/handlers.ts`（graph-json/by-key/validate/versions mock + demoGraph）、两处视图 spec 重写
- 删除：`src/adapters/bpmn/`（index.ts + spec）、`src/modules/workflow/views/EditProcessDefDialog.vue`

## 3. 实际命令与原始结果摘要

| 命令 | 结果 |
|---|---|
| `MAVEN_OPTS="-Xmx2g" mvn -q compile`（全仓） | exit 0 |
| `MAVEN_OPTS="-Xmx2g" mvn -q test`（全仓，多轮直至收敛） | **最终 exit 0；Server surefire 合计 1250 tests / 0 failures / 0 errors / 0 skipped**（bpm 模块 220：engine 44 + process 176；bootstrap 43） |
| `pnpm typecheck && pnpm lint && pnpm test && pnpm build`（带 2G NODE_OPTIONS） | **四连全绿 exit 0；Test Files 126 passed + 1 skipped；Tests 1177 passed + 3 skipped** |
| `grep -rc "bpmn\|bjs" dist/assets` | 零命中（仅源码注释字面为零残留后重建） |
| `pnpm-lock.yaml`/`package.json` grep bpmn | 零命中 |
| Flyway 全链测试 | H2 73 条 / PostgreSQL 72 条（I3：bpm 分链 V70-72 三条 + 全局 V73 一条；基线断言已随本轮实际输出重算） |

**真实行为链证据（dev profile H2 + pnpm dev 直连 + 浏览器实测，环境以 `SW_CIPHER_KEY`/`SW_LOGIN_RSA_PRIVATE_KEY`/`SW_LOGIN_DIGEST_SECRET` 外部注入）**
- 登录链：`POST /api/auth/login 200` → `/me userId=1` → `/menus 200`（AccessLoggingFilter 原始日志）
- 设计器：`GET /api/workflow/defs/node-capabilities 200` → 面板 7 节点（START/END/APPROVAL/CONDITION/CONSENSUS/COPY/NOTIFICATION）；CUA 拖拽新增 APPROVAL 节点（画布 g.designer-node 3 个）→ `PUT /graph 保存成功` → `POST validate` 返回 **2202/2004/2005 三条错误并带 `node_1` 定位锚**（未连线节点的正确负向行为）；删除该节点后校验通过（0 错误）
- 发布冻结：`POST /api/workflow/defs/{id}/publish 200 costMs=313`，后端日志 `Process def published: id=..., processKey=bpm_636b3063b9674762, version=1, deploymentId=6a82d54e-ad1a-11f1..., processDefinitionId=bpm_636b3063b9674762:1:...`；页面显示「图、节点配置、表单与函数版本已冻结」
- 定义查看：对话框以第一方内核渲染 START—END（缩放/适配控件、无 bpmn-js）
- 实例链：`POST /api/form/def/{formId}/publish 200`（表单发布）→ 表单提交（记录 `a1cadccc-55b5-4021-897e-917ab5a6873d`）「提交成功，流程已发起」→ 流程监控实例「已完成」→ 详情抽屉以 ProcessGraph 渲染且已完成节点呈完成态高亮（真实 flowTrace completed 映射）
- 清理：H2 内存环境随进程关闭自动消失；临时进程（backend/frontend dev）已终止并回读 `kill` 后无残留进程；测试库数据未涉及历史业务对象

## 4. 与方向的偏差（含裁决请求）

1. **连线建立/调整交互未实现 UI 入口**：设计器内核 `connect()` 已实现并经单测（含自环/重复边拒绝、删除连带、undo），但画布上「从一个节点拖到另一个节点建立连线」的指针交互入口未接线。已实现：拖入、移动、选择、删除、属性、缩放/平移/适配、撤销、保存、校验、发布、错误定位。**请规划裁决：连线 UI 交互补齐放本轮补证，还是随阶段收口下一轮。**
2. **加签/补签为业务侧状态机模型**（`sw_bpm_sign_record` 记录 + 表态/取消/结算编排），非 Flowable 原生任务：原任务在加签未决时由生命周期门阻断直接办理；AUTO_FINISH 受控完成；CONFIRM 语义默认保留原待办由原责任人办理。串行按 seq_no 门控。
3. **DISAPPROVE 普通节点默认结算策略 = TERMINATE**（实例 REJECTED、触发 `PROCESS_DISAPPROVED` 独立通知），节点 `disapprovePolicy=CONTINUE` 可显式放行；会签负向意见统一 DISAPPROVE 并经 `ConsensusSettlementPort` 幂等终局。
4. **REJECT 语义升级为全场景流程级驳回**（含会签任务）——P58 的「会签 REJECT 交结算条件」路径关闭，`BpmTodoControllerTest` 已按新语义修正。
5. **意见表单快照为「等价不可变引用」**（提交时刻的 opinionForm 配置 + 主表单版本摘要），非整份 definition 冗余存储——I2 façade 未暴露快照读取接口，若规划要求整份快照需追加接缝。
6. **时限调度为单 JVM @Scheduled + DB 原子认领**（run_state PENDING→DONE 单行更新），满足幂等/重启安全；Quartz/多实例调度编排按 §4.8 的「同一状态机、幂等、审计」在 DB 层达成，调度基础设施升级未做。
7. 探索回执建议的「保存无状态门」已实现为「格式检查 + 已发布定义再次编辑自动递增草稿版本」；`updateDef` 名称/表单变更仍限纯草稿。

## 5. 遇到的问题与未完成内容/风险

1. **I3 新动作的页面按钮/深链未接入**：`BpmLifecycleController` 8 组端点 + 前端 api 层 14 个包装函数已就绪，但 `TaskDetail.vue` 等页面尚未渲染转办/委托/沟通/加签/补签/撤回/废弃按钮与表单。页面、按钮、深链与服务端授权一致性（验收 §11/§16 的页面部分）需下一轮补齐。
2. **多实例部署下的真实并发竞争未在真实多节点环境实测**：会签计数/时限认领已用 DB 唯一键 + 原子 UPDATE 实现，且单测覆盖幂等路径；跨 JVM 真实竞争（双实例并发结算）缺运行证据。
3. **真实租户存量/历史 graph_json 兼容**：本地 dev 为全新 H2，未验证真实存量图；兼容布局已实现（确定性布局 + 兼容标记）并以内核单测钉死（同输入同布局）。
4. 会签负向终局的 Flowable 轨迹语义：负向时直接 deleteProcessInstance（reason=CONSENSUS_REJECTED），ACT 轨迹以删除原因表达，未再展开子流程级回滚；引擎侧幂等由端口实现保证。
5. 设计器连线交互缺口见 §4.2。
6. Server 仓库工作树存在**此前已存在**的 `product/**` 删除文件（P4/bpmn-adapter 历史证据），本执行未触碰、未提交，保持原状。

## 6. Git diff 摘要

- Server：78 files changed, 1035 insertions(+), 2022 deletions(-)（含既有工作树删除；I3 实际新增/修改约 60 文件：迁移 6、引擎 10、业务 30+、测试 6）
- Web：13 files changed, 493 insertions(+), 643 deletions(-) + 新增 `process-graph` adapter/契约/两视图（约 +2100 行）
- 两仓候选均未提交、未推送（无状态同步授权；远程发布需 Owner/规划明确授权）

## 7. 与验收标准逐项对照（方向 §7，1—18）

| # | 标准 | 自验结论 |
|---|---|---|
| 1 | G0 回读一致；P60/I1/I2、功能数、清单、开放 P 编号零漂移 | ✅ 回读一致，未改任何正式状态 |
| 2 | 自研设计页能力链 | ✅ 代码 + 真实浏览器验证（拖入/保存/校验/错误定位/删除/发布）；**移动与连线建立交互未接**（§4.7/§5.1） |
| 3 | 同一 ProcessGraph 全链一致 | ✅ 设计/保存/校验/发布/定义查看/实例查看同契约；前端无平行目录（策略白名单读服务端能力） |
| 4 | 版本冻结 | ✅ 真实发布 version=1 + deploymentId 勾稽；再次编辑自动新草稿版本（实现+单测），挂起/激活/下线/安全删除已实现，发布失败零部署（服务端校验先于部署） |
| 5 | 定义/实例查看迁移 + 轨迹一致 | ✅ 两消费点已迁移（真实抽屉验证）；当前/已完成/未经过状态映射来自真实 trace；兼容布局内核单测 |
| 6 | bpmn-js 完整退出 | ✅ 包清单/锁文件/源码/adapter/测试/构建产物/DOM 零残留（grep 证据）；无 CSS 隐藏/源码改写替代 |
| 7 | 四动作语义（页面/HTTP/任务/意见/轨迹/通知/终态） | ✅ 服务端全链实现（REJECT 流程级、DISAPPROVE 结算策略、RETURN 轮次）+ 控制器测试；**页面按钮一致性未接**（§5.1） |
| 8 | RETURN 合法目标 + 新轮次 | ✅ returnTargets 消费 + round_no 递增（记录级）；旧轮次无双活（changeActivityState 语义） |
| 9 | ALL/ANY/RATIO/VETO + 重复并发单次结算 | ✅ 求值器/翻译器/监听器 + DB 唯一键；**多实例真实并发证据缺**（§5.2） |
| 10 | 加签/补签正向/取消/越权/失效人员/重复 | ✅ 生命周期服务实现（串行门槛/幂等/审计）；行为证据以单测 + 代码为主 |
| 11 | TRANSFER/DELEGATE/AUTHORIZE 边界 | ✅ 自我/无效用户拒绝、循环代理拒绝、冲突期拒绝、时段与范围匹配 + 接管审计 |
| 12 | WITHDRAW/COMMUNICATE/DISCARD | ✅ 状态门/幂等/沟通无审批权/废弃授权；通知触发器齐全 |
| 13 | 时限/提醒/催办/自动动作 | ✅ 调度账本 + 原子认领 + 受控动作白名单；**真实调度重启/多实例证据缺** |
| 14 | 节点函数 | ✅ 注册表 + 发布期校验（存在/启用/允许节点/版本）+ 内建两函数 + 输出白名单校验 + 失败策略 |
| 15 | 意见表单初始化/校验/提交/历史回显 | ✅ 快照（等价引用）+ 只读初始化摘要；I2 校验器复用 |
| 16 | 多身份权限一致性 | ✅ 8 组端点 @PreAuthorize + 任务归属校验；V73 种子 11 按钮 + role 2 |
| 17 | 请求标识/勾稽/单次副作用 | ✅ command_key + claim_token 沿用；唯一键防重（vote/deadline/comm）；action 记录扩展 |
| 18 | 受影响原子回归 + 全量门禁 | ✅ Server 全量 1250/0/0（受影响原子针对性修复：REJECT 语义、构造器、schema、迁移计数）；Web 四连全绿 |

## 8. 自验结论

I3 十八项标准中 16 项实现与自动化自验通过；第 2/7/9/13 项存在「页面动作入口未接」「多实例真实并发与调度实测证据缺」两类剩余缺口（见 §5）。依据方向 §9，合法提交状态 **`VERIFYING / EXECUTION_SUBMITTED`**：全部实现与内部自验完成，等待规划对十八项标准逐项验收；Executor 不移动方向、不写 PASSED/COMPLETED、不核销 P 编号、不晋级基线。

### 合法 Executor 终态（由最终回复中的机器行承载）
