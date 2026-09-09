# P60 v0.3.0-oa-completion I1「组织与权限底座」阶段回执 01

> 会话角色：执行（Executor）
> 功能：v0.3.0-oa-completion / P60 0.3.0 OA 全功能收口 · 等级 XL（P0）
> 执行入口：`product/v0.3.0-oa-completion/ready/direction-v0.3.0-oa-completion.md`（§3.1、§4 迭代 1、§9）
> 日期：2026-09-08
> 阶段范围：I1 用户/角色/部门/岗位/部门负责人/权限收敛（六阶段中的第一阶段）

## 一、结论

I1「组织与权限底座」实现与自验完成：三类真实身份（用户/角色/部门）管理闭环、部门负责人与岗位维度补齐并接入流程权威解析、变更后权限即时收敛、历史流程参与人身份冻结。后端全量门禁 `mvn clean test` **BUILD SUCCESS（12 模块汇总 1216 tests / 0 failures / 0 errors / 0 skipped，EXIT=0）**；前端四门禁 **typecheck/lint exit=0、test 1176 passed + 3 skipped、build exit=0**。迁移链前向推进至 **V67**（H2 67 条 / PG 66 条，双方言逐字节一致）。本回执只声明「自验通过，待规划验收」；不核销 P60 或任何既有 P 编号，不写功能 PASSED/COMPLETED，不移动方向到 `passed/`，不发布 0.3.0。

## 二、内部 Step 与实际改动

### Step S1 迁移（Server）
- `sw-bootstrap/.../db/migration/h2/V67__i1_org_permission_foundation.sql` 与 `postgresql/V67__...sql`（**新增，双方言 md5=02b985d47031ff0a379502ab4d61cdae 逐字节一致**）：
  1. `sys_user_post` 增加 `dept_id bigint NOT NULL DEFAULT 0` 并按用户主部门回填 + 索引 `idx_sys_user_post_dept`（岗位在部门内承担）；
  2. `sw_bpm_participant_snapshot` 增加 `participant_name varchar(100)`（参与人展示名冻结）；
  3. 部门/岗位按钮权限种子（menu_type=2，id 340–345：`system:dept:create/update/delete`、`system:post:create/update/delete`，父菜单按 permission 定位）并授予角色 2（V45「3000+菜单 id」手法，幂等 NOT EXISTS）。
- 版本号说明：方向执行前置事实核对发现 **V66 已被 P21 的 `sw-basic-iot` 模块迁移占用**（`V66__p21_iot_audit_and_correlation.sql`），故 I1 迁移使用 **V67**；全链 Flyway 测试断言同步更新（H2 66→67、PG 65→66）。
- `sw-biz-system-biz/src/test/resources/db/schema-datascope-h2.sql`：sys_user_post 同步增加 `dept_id`（测试 schema 与生产对齐）。

### Step S2 部门与岗位治理（Server · system）
- `entity/SysDept.java`：补映射 `leader_id`（原为死列）。
- `service/impl/SysDeptServiceImpl.java`：负责人校验（本租户存在、未删除、status=0 正常；跨租户经租户拦截器自然拒绝）；父部门校验（存在、非自引用、移动不进自身子树——沿 parent 链上溯成环检测）；状态合法值校验（0/1），创建缺省正常。
- `service/impl/SysPostServiceImpl.java`：创建缺省 `status=1 启用`（修复 DDL 默认 0 导致新岗位不可绑定的语义缺陷）；编码非空 + 本租户唯一（create/update）；删除解除 `sys_user_post` 任职（逻辑删保留轨迹）。
- `controller/DeptController.java`（5 端点）、`controller/PostController.java`（5 端点）：补 `@PreAuthorize("@ss.hasPermi('system:dept|post:*')")`（此前**登录即可增删改**，V66/V67 种子使非超管管理员可满足）。

### Step S3 权限即时收敛与关联治理（Server · system）
- `service/impl/SysUserServiceImpl.java`：启停/编辑/改密/撤授权/删号后立即 `LoginUserLoader.kickOut`（下一次请求回查最新状态：停用即 401、撤权即 403；不等缓存 TTL）；`delete` 先解除角色/岗位关联再逻辑删并踢人；踢人失败（缓存 Bean 缺位/中间件不可用）降级不阻断授权变更（DB 为权威，TTL 兜底）。
- `service/impl/SysRoleServiceImpl.java`：角色更新/菜单授权变更/删除后按 `sys_user_role` 反查成员批量踢人（反查失败降级）；`delete` 清理 `sys_role_menu`/`sys_role_dept`/`sys_user_role`；状态（1/0）与数据范围（0–4）合法值校验。
- `LoginUserLoader` 注入采用 `@Lazy` 构造参数（惰性代理，兼容既有测试上下文装配，生产语义不变）。
- **存量缺陷修复**：`SysRoleServiceImpl.update` 对 `sys_role_dept`「逻辑删后重插」必然违反 `uk_sys_role_dept(role_id,dept_id)`（该唯一索引不含 deleted，既有测试用 mock 未暴露）→ 新增 `SysRoleDeptMapper.hardDeleteByRole` 物理删除后重插。
- `service/impl/SysPostServiceImpl`/`SysUserService` 新增岗位任职校验（仅启用岗位、部门存在）。

### Step S4 岗位任职契约升级（Server · system + api）
- `service/UserPostAssociation.java`（新增）：`{postId, deptId?}`，deptId 缺省回落用户主部门，按 (postId, deptId) 去重。
- `service/SysUserService.java` + `impl`：`listPostIds/updatePostIds(List<Long>)` 升级为 `listPosts/updatePosts(List<UserPostAssociation>)`；`createWithAssociations/updateWithAssociations` 签名同步。
- `controller/UserController.java`：`GET/PUT /system/user/{id}/posts`、`UserFormRequest.posts` 契约升级为 `PostAssignment{postId, deptId?}`；0.3.0 未发布、无外部消费者（openapi 模块不涉及该端点），不构成对外兼容性破坏。
- `mapper/SysUserMapper.java`：新增 `selectUsersByRole` 分页（角色成员反向视图）。

### Step S5 角色成员维护（Server · system）
- `service/SysRoleService.java` + `impl`：`pageMembers(roleId, pageParam)`；`controller/RoleController.java`：`GET /system/role/{id}/users`（`system:role:list`）。

### Step S6 流程权威解析（Server · system-api + bpm）
- `sw-biz-system-api .../UserQueryFacade.java`：新增 `findActiveUserIdsByDeptLeaders(deptIds, tenantId)`、`findActiveUserIdsByPostCodes(postCodes, tenantId)`、`findActiveUserIdsByDeptAndPost(deptId, postCode, tenantId)`；`UserFacadeImpl` + `SysUserMapper` 三条解析 SQL（部门负责人：正常部门×启用用户×同租户；岗位：启用岗位×有效任职行×启用用户；组合：任职部门精确匹配）。**bpm 不直接读 `sys_` 表，全部经 Facade**（依赖铁律合规）。
- `sw-bpm-api .../ParticipantStrategy.java`：新增 `DEPT_LEADER`/`POST`/`DEPT_POST` 常量与 `ALL` 白名单（单一权威）；`engine/participant/` 新增 `DeptLeaderParticipantResolver`/`PostParticipantResolver`/`DeptPostParticipantResolver`（registry 自动收编；空值短路不触发组织查询）。
- 三个翻译器（`ApprovalUserTaskTranslator`/`ConsensusNodeTranslator`/`ServiceTaskNodeTranslator`）：设计校验白名单统一改用 `ParticipantStrategy.ALL`，新增三类策略的 value 校验（正整数部门 ID/非空岗位编码/{deptId, postCode} 结构），`ServiceTaskNodeTranslator` 补显式策略白名单（此前缺省放行未知策略）。

### Step S7 历史流程身份不被改写（Server · bpm）
- `sw-bpm-api .../ParticipantSnapshotRecorder.java`：新增带展示名的 `record(...)` 重载（默认方法兼容既有实现）；`ParticipantSnapshot` 实体补 `participantName`。
- `ParticipantSnapshotRecorderImpl`：冻结参与人展示名；`ApprovalTaskListener`/`ConsensusTaskListener` 在快照记录时经 `UserQueryFacade.getUserDisplayNames` 取名冻结（取名失败仅记 ID，不阻断任务创建）。
- `process/service/ParticipantNameService.java`（新增）：展示链解析「快照冻结名优先、缺失回落实时、异常降级」；接入 4 处历史展示：`BpmInstanceController.instanceDetail`（flowTrace）、`BpmMyInstanceController`（流转记录）、`BpmTodoController` 任务详情审批历史（列表页保持实时口径，见 §六）。
- `ProcessStartService.start()`：新增发起人有效性前置校验（停用/跨租户/已删除 → `BpmErrorCode.INSTANCE_INITIATOR_INVALID(2314)`，不触达引擎）；`DesignatedApproverResolver`（legacy）透传前经 Facade 过滤停用/跨租户用户，全无效抛 2200。

### Step S8 前端配套（Web）
- `types/dept.ts`：`leaderId`（+回显 `leaderName`）；`types/user.ts`：`PostAssociation`、`SysUser/UserFormRequest.posts`。
- `api/user.ts`：posts 读写 `{postId, deptId}` number↔string 防腐；`api/role.ts`：`getRoleMembers` 分页。
- `views/DeptList.vue`：负责人选择器（正常状态用户候选、filterable/清空）+ 负责人列；`views/UserList.vue`：岗位任职勾选 + 每岗位任职部门下拉（缺省主部门）；`views/RoleList.vue`：成员维护弹窗（成员分页、搜索添加、移除，均读写既有角色契约）；`views/PostList.vue`：无结构变化（表单本就缺省启用）。
- 按钮级权限接线：User/Role/Dept/Post 四页新建/编辑/删除按钮接 `v-perm`/`hasPerm`（权限码对齐后端 V45/V67 种子 create/update/delete）。
- Mock：`handlers.ts` posts 对象契约、`role/:id/users` 分页 handler、dept `leaderId` 透传；`seeds.ts` 权限码 add/edit/remove → create/update/delete 对齐后端、补 dept/post 按钮节点、用户种子改 posts 对象。
- 新增测试：`api/i1-org.spec.ts`（3）、`foundation/mock/i1-org-handlers.spec.ts`（4）；更新 `api/user.spec.ts` posts 契约用例。

### Step S9 测试（Server，全部新增 34 个用例）
- `orgfoundation/DeptGovernanceIntegrationTest`（6）：负责人合法性（不存在/停用/跨租户拒绝、合法持久化）、parent 成环/不存在拒绝、合法移动、状态校验与缺省。
- `orgfoundation/PostGovernanceIntegrationTest`（3）：缺省启用可绑定+任职部门维度、编码唯一、删除解除任职保留轨迹。
- `orgfoundation/OrgAuthorityFacadeIntegrationTest`（3）：三类解析 SQL 的部门状态/岗位状态/用户状态/租户过滤与去重。
- `orgfoundation/PermissionConvergenceTest`（8）：用户启停/撤权/删号、角色更新/菜单变更/删除全部立即 kickOut 成员、关联清理断言、成员分页、superadmin 护栏。
- `orgfoundation/SystemMgmtEndpointSecurityContractTest`（3）：dept/post/role-members 端点 `@PreAuthorize` 权限串契约。
- `engine/participant/OrgParticipantResolverContractTest`（5）：三类策略标识/值转换/去重/非法值短路/白名单一致。
- `process/service/ParticipantNameSnapshotTest`（3）：姓名冻结落库、快照优先+实时回退、快照异常降级。
- `process/service/ProcessStartInitiatorValidationTest`（3）：停用发起人拒绝（2314）、有效放行、无绑定 no-op 不校验。
- 既有测试修复性更新：`BpmInstanceControllerTest`/`BpmMyInstanceControllerTest`（新构造参数）、`RoleMenusContractAndSecurityTest` 等既有行为零变化；`FlywayFullChainH2Test`/`FlywayFullChainPostgresTest` 计数断言随 V67 更新（66→67 / 65→66，升级链 V33-V67/V34-V67/V37-V67）。

## 三、实际命令与原始结果

| 命令 | 结果 |
|---|---|
| `MAVEN_OPTS="-Xmx2g" mvn clean test`（Server 全工程） | **BUILD SUCCESS，EXIT=0；12 模块汇总 1216 tests / 0 failures / 0 errors / 0 skipped**（基线 1182 → 1216，+34 为本轮新增用例） |
| `pnpm typecheck && pnpm lint && pnpm test && pnpm build`（Web，均带 NODE_OPTIONS 2G） | **typecheck exit=0；lint exit=0（0 errors）；test 1176 passed + 3 skipped（1179）；build exit=0** |
| `md5 -q` V67 双方言 | `02b985d47031ff0a379502ab4d61cdae` 两侧一致 |
| `FlywayFullChainH2Test`（15）/`FlywayFullChainPostgresTest`（12） | 全绿（含 V32→链尾、V33/V34→链尾、V36→链尾升级链，终点版本 V67） |

证据目录：`product/v0.3.0-oa-completion/receipts/evidence/i1-01/`（identity、change-manifests、v67-dialect-identity-md5、server-gate-summary、web-gate-summary）。

## 四、与方向的偏差

1. **迁移版本 V67（非 V66）**：V66 已被 P21 iot 迁移占用（方向 §9 要求进入前核对现状——已核对并如实采用下一空闲版本）。
2. **posts 契约对象化**：方向 §3.1「用户可以在部门内承担一个或多个有效岗位」要求任职带部门维度；原 `List<Long> postIds` 无法表达，升级为 `{postId, deptId}`（版本未发布，前后端同仓同源，openapi 无涉）。
3. **存量缺陷修复两处**（实现受影响，属 I1 验收路径内）：`sys_role_dept` 逻辑删后重插撞唯一索引；新岗位缺省停用不可绑定。
4. **`BpmInstanceMapper` 内嵌 `sys_user` 子查询（bpm 自行拼组织 SQL）未在本阶段整改**：其属于数据范围查询链（依赖 DataScope 组件下沉），非选人链；记录为已知债务，留待 I4 流程对接/监控阶段统一收敛。

## 五、问题、未完成内容与风险

- 流程设计器（Web EditProcessDefDialog）暂未提供 DEPT_LEADER/POST/DEPT_POST 配置项：I1 验收面是「岗位/部门负责人可被流程权威解析」（解析能力已有测试证据）；配置入口随 I3 人工审批能力的设计器工作一并开放，避免半成品 UI。
- 列表页（我的流程/待办列表）办理人/发起人显示保持实时口径，仅历史详情与流转记录走快照冻结名（历史身份不可变语义所在）；如 Planner 要求列表也走快照，需批量快照查询改造，另立补证。
- 兼容边界：V67 对存量数据仅为加列/回填/种子，无破坏性 DDL；`participant_name` 为可空列，存量快照展示自动回落实时查询（无重写）。
- 无阻塞项。

## 六、I1 完成条件逐项对照（方向 §4 迭代 1）

| 完成条件 | 证据 |
|---|---|
| 三类真实身份完成管理 | 用户/角色/部门/岗位 CRUD + 部门负责人 + 角色成员视图 + 前端管理页（S2–S5、S8）；Controller/Service 集成与契约测试 23 例全绿 |
| 负向权限验证 | dept/post 端点 `@PreAuthorize` 契约 + 权限种子；停用用户登录拒绝（既有）+ 已发 token 立即 401（kickOut，PermissionConvergenceTest）；撤权/停用角色立即收敛；跨租户负责人/岗位/发起人拒绝；superadmin 护栏 |
| 岗位/部门负责人可被流程权威解析 | `UserQueryFacade` 三条解析 SQL（OrgAuthorityFacadeIntegrationTest 真实 H2 过滤验证）+ 三个 resolver（契约测试）+ 发布校验白名单；动态选人只消费 Facade 服务端数据（legacy DESIGNATED 补过滤） |
| 历史流程身份不被改写 | `participant_name` 冻结（ParticipantNameSnapshotTest）+ 展示链快照优先（4 处接入）；存量快照可空回退不重写 |

## 七、自验结论与终态

自验通过，待规划验收。合法 Executor 终态：`EXECUTION_SUBMITTED`（feature_status=IN_PROGRESS）；唯一下一动作 = Planner 对 I1 阶段回执独立验收，验收通过后按方向排期下发 I2「低代码表单收口」。未执行 Git 提交（提交/推送按授权门禁另行处理）；未核销 P60/P2/P4/P26/P31/P34/P35/P37/P38/P39；未晋级基线（全链迁移计数断言的更新属于随新迁移的机械同步，正式基线记载仍以验收快照为准）。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/v0.3.0-oa-completion/receipts/stage-i1-v0.3.0-oa-completion-01.md","evidence":["product/v0.3.0-oa-completion/receipts/evidence/i1-01/identity.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-01/change-manifests.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-01/v67-dialect-identity-md5.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-01/server-gate-summary.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-01/web-gate-summary.txt","Smart-WorkFlow-Server/sw-bootstrap/src/main/resources/db/migration/h2/V67__i1_org_permission_foundation.sql","Smart-WorkFlow-Server/sw-bootstrap/src/main/resources/db/migration/postgresql/V67__i1_org_permission_foundation.sql","Smart-WorkFlow-Server/sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/orgfoundation/PermissionConvergenceTest.java","Smart-WorkFlow-Server/sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/orgfoundation/OrgAuthorityFacadeIntegrationTest.java","Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-engine/src/test/java/com/sw/ck/bpm/engine/participant/OrgParticipantResolverContractTest.java","Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/service/ParticipantNameSnapshotTest.java","Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/service/ProcessStartInitiatorValidationTest.java"],"feature_status":"IN_PROGRESS","work_items":[{"id":"i1-migration-v67","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已锁定：V67 双方言逐字节一致（md5 02b985d47031ff0a379502ab4d61cdae），全链 Flyway H2/PG 测试全绿（含升级链）"},{"id":"i1-org-governance","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已锁定：部门负责人/parent 校验、岗位缺省启用/唯一/任职部门维度、dept/post 端点 @PreAuthorize 契约"},{"id":"i1-permission-convergence","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已锁定：用户/角色变更后 kickOut 即时收敛（PermissionConvergenceTest 8 例）、关联清理、sys_role_dept 存量唯一索引缺陷修复"},{"id":"i1-process-authority","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已锁定：DEPT_LEADER/POST/DEPT_POST 策略+解析器+翻译白名单、发起人 2314 校验、legacy 过滤、参与人展示名冻结与快照优先展示"},{"id":"i1-frontend","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已锁定：负责人选择/岗位任职部门/角色成员弹窗/v-perm 接线/mock 一致性；typecheck+lint+test(1176)+build 全绿"},{"id":"i2-form-completion","status":"PENDING","authorized":false,"dependency_satisfied":false,"actionable":false,"next_action":"I2 为方向 §4 排期的下一迭代：待 Planner 完成 I1 阶段验收后下发执行入口，本账本不含其内部工作项"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待 Planner 对 I1 阶段回执独立验收；验收通过后由规划下发 I2「低代码表单收口」独立执行入口","next_action_type":"WAIT_PLANNER","progress_fingerprint":"p60-i1-org-permission-foundation-20260908-gates-green","progress_basis":{"files_changed":["Smart-WorkFlow-Server：V67 迁移（h2+postgresql）、system 模块 16 文件、bpm 模块 15 文件、测试 schema、Flyway 全链测试断言、新增测试 8 类","Smart-WorkFlow-Web：system 模块 types/api/views 15 文件、mock handlers/seeds、新增测试 2 文件"],"tool_actions":["后端全量门禁 mvn clean test：BUILD SUCCESS，1216 tests / 0 failures / 0 errors / 0 skipped","前端四门禁：typecheck exit=0、lint exit=0、test 1176 passed + 3 skipped、build exit=0","V67 双方言 md5 一致性校验","Flyway 全链 H2（15 用例）/PG（12 用例）含升级链验证","新增测试 34 用例全部通过（system 23 + bpm 11）"],"new_evidence":["product/v0.3.0-oa-completion/receipts/evidence/i1-01/"],"closed_work_items":["i1-migration-v67","i1-org-governance","i1-permission-convergence","i1-process-authority","i1-frontend"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"mvn clean test（Server 全工程）","outcome":"SUCCEEDED","detail":"BUILD SUCCESS；12 模块汇总 1216 tests / 0 failures / 0 errors / 0 skipped；EXIT=0（/tmp/i1-server-final2.log，摘要落 evidence/server-gate-summary.txt）"},{"tool":"pnpm typecheck/lint/test/build（Web）","outcome":"SUCCEEDED","detail":"typecheck exit=0；lint exit=0；test 1176 passed + 3 skipped（1179）；build exit=0（evidence/web-gate-summary.txt）"},{"tool":"Flyway 全链迁移验证（H2/PG）","outcome":"SUCCEEDED","detail":"V67 双方言 md5=02b985d47031ff0a379502ab4d61cdae；全链 67/66 条、升级链（V33/V34/V36→V67）全绿"},{"tool":"权限收敛与负向验证（真实 H2 集成）","outcome":"SUCCEEDED","detail":"PermissionConvergenceTest 8 例：启停/撤权/删号/角色变更均立即 kickOut；关联清理与成员分页断言通过；OrgAuthorityFacadeIntegrationTest 3 例：负责人/岗位/组合解析的部门-岗位-用户-租户四重过滤"},{"tool":"流程权威解析与身份冻结","outcome":"SUCCEEDED","detail":"OrgParticipantResolverContractTest 5 例；ParticipantNameSnapshotTest 3 例（冻结/快照优先/降级）；ProcessStartInitiatorValidationTest 3 例（2314 拒绝/放行/no-op）"}],"browser_status":"NOT_APPLICABLE"}
