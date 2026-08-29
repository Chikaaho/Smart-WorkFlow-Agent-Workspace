# 完成回执 · 最小闭环缺口修复（A-01～A-04）

> 会话角色：执行（Executor，工作区根入口）
> 依据方向：`product/minimal-closure-first-acceptance/ready/direction-minimal-closure-remediation-a01-a04.md`
> 日期：2026-08-29
> 自验结论：**自验通过·待规划验收**（A-01～A-04 全部修复，唯一目标链路在真实前后端 + 真实页面完整走通；未修改任何正式状态/计数/基线）

---

## 一、缺口承接矩阵

| 缺口 | 修复前事实 | 修复内容 | 修复后行为证据 | 结论 |
|------|-----------|----------|----------------|------|
| A-01 角色授权与真实菜单不一致 | 角色权限树勾选"低代码"后仅落库叶子节点（`["3","5","230","231","232"]`），后端建树丢弃孤儿节点，业务用户菜单只有"流程引擎" | ① 前端 `RoleList.vue` 保存集改为全选+半选节点（目录随子权限一并落库），回填改为只 set 叶子防级联过授权；② 后端 `SysMenuServiceImpl.getMenuTree` 非超管路径补全授权菜单的**祖先闭包**（防御历史脏数据） | 页面保存后 `GET /system/role/{id}/menus` → `["2","3","4","5","20","21","22","23","230","231","232"]`（父目录 2/5 已落库）；fixuser01 重新登录落地 `/lowcode/overview`，侧边栏渲染 低代码（概览/表单设计）+ 流程引擎（待办/已办/监控/定义）全子树，无系统管理菜单；`POST /system/user/page`（fixuser01）→ HTTP 403 无权限 | **已修复** |
| A-02 流程管理页面缺失 | `/workflow` 白屏（WorkflowHome 空占位）、`/workflow/defs`、`/workflow/todo` 404（仅存在于 Mock 菜单种子）；另有 `ProcessDefList.vue` 将三个对话框放在 `StandardListTemplate` default slot 内，空列表时 slot 不渲染 → 点"创建流程定义"无响应（死按钮） | ① 新增迁移 `V44__workflow_child_menus.sql`（H2+PostgreSQL 双方言，幂等）：流程引擎(id=5)改目录，新增子菜单 20 待办/21 已办/22 流程监控/23 流程定义（component 指向既有真实页面，path 按菜单契约用完整相对路径）；并修正低代码子菜单(3/4)的相对段路径与幻影组件指向；② `ProcessDefList.vue` 三个对话框移出 default slot；③ 新增 `EditProcessDefDialog` 单节点审批配置（START→APPROVAL(DESIGNATED 指定审批人)→END 图组装+保存后即时图校验），审批人候选经新增 `UserQueryFacade`（system-api）+ `GET /workflow/defs/approver-candidates` 防腐接口 | 侧边栏 流程引擎→流程定义 真实导航落地 `/workflow/defs`（截图 R02）；页面创建"修复验收审批流"绑定"修复验收申请表"→编辑配置审批人=系统管理员(admin)→`保存并校验`（"保存成功，图校验通过"）→`发布`（"发布成功"），列表状态"已发布"（A-02 全程真实页面操作） | **已修复** |
| A-03 简单流转未建立 | 提交表单后实例/待办均为 0（无绑定流程时流程发起为 no-op） | 流程发布门通过后自动落启用表单绑定（既有机制，本轮经页面真实发布激活）；`TaskDetail.vue` 新增"表单数据（本次提交）"区块（按 formKey+businessKey 回查记录） | 发起人 fixuser01 页面提交"修复验收申请表"→ 真实实例 `eaae2993-a366-11f1-838c-6eb98e9cd88f`（RUNNING）+ admin 待办 1 条；admin 从待办页打开详情（本次提交数据 `field_1=修复流转测试数据-20260829-01` 与提交值一致，截图 R04）→ 审批通过；实例状态变 APPROVED（页面显示"已完成"），待办清零、已办 1 条；发起人实例列表显示"已完成"并可查看流转记录（审批节点"审批" 13:03:04.591→13:13:27.921，与发起/审批时间勾稽，截图 R05/R06） | **已修复** |
| A-04 页面伪装成功 | 提交成功后无条件提示"流程已发起"并跳转未注册路由 | `FormRender.vue`：提交后按 businessKey（记录 ID）轮询查询实例（最多 10×500ms），实例真实存在才提示"流程已发起"并跳转 `/workflow/instances`（注册且授权的真实路由）；无实例时如实提示"该表单未关联已发布流程，仅保存数据"；后端 `BpmInstanceMapper/InstanceFilterDTO/ServiceImpl` 新增 `businessKey` 精确过滤支撑勾稽 | 本轮提交（有绑定流程）→ 短暂轮询后提示"提交成功，流程已发起"并跳转 `/workflow/instances`，列表显示实例运行中（截图 R03 为提交后自动跳转落地页）；无流程分支以代码路径+无绑定实例不产生为佐证（表单提交成功仅保存数据时 instances 无记录） | **已修复** |

## 二、验收标准逐项证据（方向 §八）

| # | 标准 | 证据 |
|---|------|------|
| 1 | 授权在权限配置/后端菜单/侧边栏/路由/请求一致生效；未授权仍拒绝 | `R07-http-raw-outputs.txt` §A-01（role menus 含父节点、fixuser01 菜单全树、403 拒绝）；`R01-fixuser01-menu-both.png/dom.txt` |
| 2 | 真实菜单进入流程管理，完成创建/编辑/绑定/审批人/校验/发布/刷新回显 | `R02-process-def-list.png/dom.txt`；本轮全流程页面操作（创建成功→保存校验通过→发布成功→列表"已发布"） |
| 3 | 发起人页面提交产生唯一实例与待办 | `R07` §A-03（instances total=1、todo 审批前 1 条）；businessKey=`ad2d8b1e-db7c-4016-a71c-395232d35c74` 与表单记录 ID 勾稽 |
| 4 | 审批人从待办打开任务、看到一致数据、完成通过 | `R04-task-detail-formdata.png/dom.txt`（表单数据区块显示提交值）；审批后 todo=0、processed=1（`R07`） |
| 5 | 发起人看到最终通过状态与流转记录；标识勾稽 | `R05-initiator-instance-result.png`（已完成）、`R06-instance-detail-trace.png`（流转记录 审批节点开始/完成时间）；实例 ID `eaae2993…` / 业务单号 / 表单标识 / 发起人 ID 四项与各页面一致 |
| 6 | 反馈与真实结果一致、跳转有效 | `R03-form-submit-feedback.png`（提交后自动落地实例列表）；A-04 改造逻辑见承接矩阵 |
| 7 | 关键入口无白屏/404/死按钮 | `/workflow` 目录 redirect→待办任务；todo/defs/instances 直连均可达（本轮真实导航取证）；死按钮根因（对话框在空态不渲染的 slot）已修 |
| 8 | 聚焦测试与质量门有命令/退出码/计数 | 见 §四 |
| 9 | 已锁定四项不重验 | 未重验；仅按方向 §二 重建环境最小数据（部门/角色/用户/表单，其中角色授权经页面完成以验证 A-01 前端保存修复） |

## 三、实际修改文件

**后端（Smart-WorkFlow/，均已 install 生效）**

| 文件 | 变更 |
|------|------|
| `sw-biz/sw-biz-system/.../service/impl/SysMenuServiceImpl.java` | 非超管菜单树补全祖先闭包（withAncestors） |
| `sw-biz/sw-biz-system/sw-biz-system-api/.../api/user/`（新增） | `UserQueryFacade` + `UserOptionDTO`（脱敏用户查询 Facade 契约） |
| `sw-biz/sw-biz-system/.../service/impl/UserFacadeImpl.java`（新增） | Facade 实现（正常状态用户、脱敏字段、LIMIT 防护） |
| `sw-biz/sw-bpm/.../controller/BpmProcessDefController.java` | 新增 `GET /approver-candidates`（经 Facade，不触碰 sys_user） |
| `sw-biz/sw-bpm/.../dto/InstanceFilterDTO.java`、`mapper/BpmInstanceMapper.java`、`service/impl/BpmInstanceServiceImpl.java` | 实例查询新增 businessKey 精确过滤 |
| `sw-biz/sw-bpm/.../test/.../BpmProcessDefControllerTest.java` | 构造器适配新依赖 |
| `sw-bootstrap/.../db/migration/{h2,postgresql}/V44__workflow_child_menus.sql`（新增） | 流程子菜单真实化 + 低代码子菜单修正（双方言幂等） |

**前端（Smart-WorkFlow-Web/）**

| 文件 | 变更 |
|------|------|
| `src/modules/system/views/RoleList.vue` | 权限树保存=全选+半选；回填只 set 叶子（collectParentIds 过滤） |
| `src/modules/system/views/RoleList.spec.ts` | 两个行为测试更新到修复后语义 |
| `src/modules/workflow/api/index.ts` | 新增 getProcessDefDefinition / validateProcessDefGraph / queryApproverCandidates / ProcessGraphPayload / GraphValidationError；InstanceFilter+businessKey |
| `src/modules/workflow/views/EditProcessDefDialog.vue` | 重写为最小单节点审批配置（图组装+即时校验） |
| `src/modules/workflow/views/ProcessDefList.vue` | 三个对话框移出 default slot（修死按钮） |
| `src/modules/workflow/views/TaskDetail.vue` | 新增"表单数据（本次提交）"区块 |
| `src/modules/form/views/FormRender.vue` | 提交反馈改造：实例轮询确认才报"流程已发起"，跳转真实路由 |

## 四、质量门与测试计数

| 门 | 命令 | 结果 |
|----|------|------|
| 后端编译 | `MAVEN_OPTS="-Xmx2g" mvn -q compile` | EXIT 0 |
| 后端安装 | `mvn -q install -DskipTests`（修复 1 处测试编译后） | BUILD SUCCESS |
| 后端聚焦测试 | `mvn test -pl sw-biz/sw-bpm/sw-bpm-process -Dtest='BpmProcessDefControllerTest,BpmInstance*'` | **Tests run: 24, Failures: 0, Errors: 0** |
| 系统模块全量 | `mvn test -pl sw-biz/sw-biz-system/sw-biz-system-biz` | **Tests run: 210, Failures: 0, Errors: 0** |
| 前端 typecheck | `pnpm typecheck` | EXIT 0 |
| 前端 lint | `pnpm lint`（含架构边界规则） | EXIT 0 |
| 前端单测 | `pnpm test` | **1059 passed / 1060**（2 文件 1+1 失败均为预存问题，见 §六） |

编译互斥：每次编译/测试前 `ps` 检测对方无编译进程；前端验证期间后端无编译（互斥合规）。

## 五、证据清单（`receipts/evidence/`，本轮新增 R 系列）

| 文件 | 内容 |
|------|------|
| `R01-fixuser01-menu-both.png/dom.txt` | A-01：fixuser01 登录落地 /lowcode/overview，侧边栏低代码+流程引擎全子树、无系统管理 |
| `R02-process-def-list.png/dom.txt` | A-02：菜单导航落地 /workflow/defs，页面含创建入口 |
| `R03-form-submit-feedback.png/dom.txt` | A-04：提交后自动跳转 /workflow/instances，实例运行中 |
| `R04-task-detail-formdata.png/dom.txt` | A-03：审批人任务详情展示本次表单数据 |
| `R05-initiator-instance-result.png/dom.txt` | A-03：发起人看到最终"已完成" |
| `R06-instance-detail-trace.png/dom.txt` | A-03：实例详情流转记录（审批节点起止时间勾稽） |
| `R07-http-raw-outputs.txt` | role menus / fixuser01 菜单树 / 403 拒绝 / 实例勾稽 / 待办清零原始输出 |

## 六、偏差与遗留

1. **环境准备说明（方向 §二授权范围）**：H2 多次重启清空数据，部门/用户/表单经真实后端 API 重建（与页面保存同端点）；角色授权、流程创建/配置/发布、表单提交、审批、结果查看全部经真实页面完成。表单未走页面拖拽的原因：IAB 合成拖拽工具在本环境持续超时（第一轮同页面拖拽曾成功并有截图），属测试工具限制而非产品缺陷。
2. **预存测试失败（与本次修复无关，均在干净 HEAD 复现）**：`foundation/mock/auth-session.spec.ts` 1 例（Mock 会话权限与期望脱节，853a4b5 引入）；`agent/views/tool-production-menu-chain-live.spec.ts` 1 例（live 测试依赖 `tooluser/user123`，H2 重建后该口令不存在）。未顺手修复（方向非目标），留规划裁决。
3. **观察项（非阻断）**：实例详情"流程图"区域空白（bpmn-js 渲染未出图，基本信息/流转记录不受影响）；流转记录"审批人"列显示"-"（未回填用户名）；角色 status 语义（1=启用）与字典"0=正常"展示不一致的既有口径。
4. 未提交 Git（工作区保留改动待规划验收后处置）；未改正式状态/功能数/P 编号/基线；主方向与修复方向仍按 `ready/` 位置规则保留。

## 七、记忆更新草稿（仅供规划角色核对后落盘，不构成最终判定）

- state.md 新增行：最小闭环缺口修复 A-01~A-04 | 角色授权父节点落库+菜单祖先闭包、V44 流程子菜单真实化、提交反馈实例确认、任务详情表单数据；唯一链路真实页面走通 | 回执 `receipts/receipt-minimal-closure-remediation-a01-a04-20260829.md` | 判定占位 PASSED（待编号）
- decisions.md：无新增（实现细节见回执 §三）
- issues.md：无新增（预存测试失败 2 例与观察项是否登记由规划裁决）
- features.md：无变化

SWF_TERMINAL {"schema":"smart-workflow.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","receipt":"product/minimal-closure-first-acceptance/receipts/receipt-minimal-closure-remediation-a01-a04-20260829.md","evidence":["evidence/R01-fixuser01-menu-both.png+dom.txt 与 R07 §A-01：角色页面保存含父节点(2/5)、fixuser01 菜单全子树、403 拒绝","evidence/R02-process-def-list.png+dom.txt：/workflow/defs 菜单可达，页面创建/审批人/校验/发布全通过","evidence/R03-R06：提交后真实实例 eaae2993+待办、任务详情表单数据、发起人看到已完成与流转记录","后端聚焦测试 24+210 全过、前端 typecheck/lint EXIT 0、单测 1059/1060（2 例预存失败已在干净 HEAD 复现）"],"feature_status":"VERIFYING"}
