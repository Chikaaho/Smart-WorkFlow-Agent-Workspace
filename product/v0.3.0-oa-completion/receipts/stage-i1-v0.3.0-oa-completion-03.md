# P60 I1「组织与权限底座」补证回执 03（验收 02 剩余账本 G1b/G2b/G3b/G5b/G7b）

> 角色：执行（Executor）；日期：2026-09-09
> 唯一执行入口：`receipts/planning-execution-prompt-v0.3.0-oa-completion-i1-01.md`；权威审查：`planning-review-stage-i1-v0.3.0-oa-completion-02.md`。
> 已锁定项（G1a/G2a/G3a/G4/G5a/G6/G7a、ADV 清单）未重验；本轮代码修复触及的路径仅做聚焦回归并随全量门禁覆盖。

## 0. 候选与对象映射

- 候选 HEAD 不变：workspace `7712fa5` / server `3aec762` / web `8d26f61`（`identity.txt`）；终态工作树指纹：workspace `b4b5f624…`、server `5b1d270d…`、web `2bc244e4…`（`worktree-fingerprint.txt`）。
- 对象沿用：部门 I1D1/I1D2、角色 I1_ROLE、流程定义 `i1_participant_flow`（重新发布，恢复 i1_leave 激活绑定）；用户沿用原 ID（i1_leader/i1_pm/i1_pm2/i1_revoke/i1_init 均未销毁，仅状态/姓名按场景变更并复位）。新实例/任务映射：INSTANCE3=`2da16944…`，n0 任务=`2da1b771…`（G3b 锁定对象）。
- 清理：场景中被停用的 i1_off/i1_g6/i1_g6b/i1_leader/i1_pm 维持停用态（真实管理动作，无残留进程）；i1_leader/i1_pm 已按复位脚本恢复启用并回读。三个中途废弃的 RUNNING 实例（冻结流 2 条、四节点流 1 条）为场景推进产物，登记于此，不再使用。

## 1. G1b 负责人回显与角色成员维护 —— 已闭环

- 原始文件：`browser/01-dept-leader-column.png`、`browser/02~04-role-member-*.png`、`g1b-role-member-readback.txt`（本回执附录段）、`Smart-WorkFlow-Web/src/modules/system/views/DeptList.vue`。
- 实际结果：
  - **根因修复**：`DeptList.vue` 此前仅在打开编辑对话框时加载负责人候选，挂载时不加载 → 列恒为空；已改为 `onMounted` 同时 `loadLeaderOptions()`。页面回显 I1D1/I1D2 负责人=「岗位任职王五」（真实浏览器截图）；编辑对话框打开时负责人回显「岗位任职王五（i1_pm）」（DOM 快照在案）。
  - 角色成员 UI 闭环：成员弹窗搜索 `i1_init` → 选中「流程发起人李四（i1_init）」→ 添加（toast 成员已添加，列表出现该成员）→ 移除（确认框 → toast 成员已移除，列表回空）。
- 反向排除：DB 回读添加后 `sys_user_role` 出现 i1_init↔I1_ROLE（deleted=0），移除后 0 行——无幽灵关联。
- 覆盖边界：真实浏览器（vite dev → 18080 后端）+ HTTP + H2 回读。

## 2. G2b 非零租户主体真实认证与双向隔离 —— 已闭环（含产品缺陷修复）

- 原始文件：`g2b-tenant-isolation.txt`；修复：`SysUserMapper.selectGlobalByUsername`（新增）、`SysUserServiceImpl.getByUsername`、`UserDetailsProviderImpl.loadByUsername/loadByUserId`（挂起租户行过滤）、`sw-common/.../TenantLineSuspension`（新增，认证装载专用线程级挂起开关，`CommonTenantLineHandler.ignoreTable` 接入）。
- 实际结果：i1_t5（tenant 5）经真实 `/login`（RSA 挑战+验证码）签发 JWT；`/auth/me` tenantId=5、roles=[T5_ROLE]、permissions=[system:user:list, system:dept:list]；本租户正向：部门树仅 T5D、用户分页仅 i1_t5；跨租户读（tenant0 部门/用户）→ data=null 不可见；跨租户写（PUT 改名、DELETE）→ **403**；反向 admin 读 tenant5 部门 → null；零越权写入回读：被攻击对象与 fixture 原样。
- 反向排除：未使用伪 token/无效 token 的 401 替代；跨租户写未被伪装为成功。
- 缺陷定性：原登录链 `getByUsername`/`getById` 受租户行过滤且登录前无租户上下文（默认 0），非 0 租户账号无法认证——属 I1 身份边界产品缺陷，本轮修复。修复未放宽业务隔离：认证装载仅按主键/全局唯一用户名读取，业务请求仍按 `LoginUserHolder.tenantId` 过滤（步骤 5 的 403 与 data=null 为证）。
- 覆盖边界：真实 HTTP + H2 回读；聚焦测试含系统模块既有认证用例全量回归（见 §6）。

## 3. G3b 停用主体对已锁定 taskId 的办理拒绝 —— 已闭环

- 原始文件：`g5b-g3b-process-assertions.txt` G3b 段。
- 实际结果：新实例 INSTANCE3 的 n0（FIXED_USER=i1_revoke）任务 `2da1b771…` 先锁定并留存变更前快照（PENDING/待撤权用户）；管理员停用 i1_revoke；变更前同一 token：`GET /workflow/tasks/todo` → 401；`POST /workflow/tasks/2da1b771…/complete`（**路径携带锁定 taskId，非空**）→ **401**；紧随回读快照仍 PENDING——该请求未产生任何处理动作；任务随后仅被重新通过认证的同一主体在 G5b 推进步骤合法办理（n0 HANDLED 在案）。
- 反向排除：请求路径非空；未重新登录、未换操作者重放。
- 对象身份：token 指纹=变更前 login.sh 签发（长度记录在案），taskId/instanceId 明文登记。
- 覆盖边界：真实 HTTP + H2 回读。

## 4. G5b 候选策略历史详情与快照一致 —— 已闭环（含产品缺陷修复）

- 原始文件：`g5b-g3b-process-assertions.txt` G5b 段（含 BEFORE_ASSERT PASS / AFTER_ASSERT PASS / G5B_ALL_PASS 三段机器断言，exit=0）；修复：`ParticipantNameService.resolveNodeAssignees`（新增）、`BpmInstanceController.instanceDetail`、`BpmMyInstanceController.myInstanceDetail`（快照命中即覆盖 assignee，冻结名富化随其后）。
- 实际结果（同一实例 INSTANCE3，覆盖 DEPT_LEADER/POST/DEPT_POST 三种候选策略 + FIXED_USER）：
  - 变更前：n0=待撤权用户、n1=部门负责人张三、n2=岗位任职王五、n3=岗位任职王五——详情 assignee/assigneeName 与快照逐节点一致（HANDLED 优先取实际办理人，n2 的竞态 INVALIDATED 行未被误取）。
  - 组织变更：i1_leader/i1_pm 改名（冻结复验张三④/王五④）并停用、D1 负责人改派 i1_pm2。
  - 变更后：四节点 assignee ID 与发起时解释逐节点一致（断言包含"变更前后完全相等"与"名字仍为发起时名"），**AFTER_ASSERT PASS，G5B_ALL_PASS，无 AssertionError**。
- 反向排除：不存在发起人兜底（修复前该场景 n1/n3 显示发起人并触发 AssertionError，本轮以同对象语义修复后复验）；未以 FIXED_USER 实例替代候选策略（三候选策略均在同一实例覆盖）。
- 缺陷定性：引擎层 `queryHistoricActivities` 的 approver 兜底会把候选模式任务的展示身份误填为发起人（存量 R-04 兜底语义），展示链权威源应为参与人快照——本轮在流程展示层以快照覆盖修复（引擎层兜底保留供无快照存量数据）。
- 覆盖边界：真实流程发起/推进 + 实例详情 API + H2 快照回读 + python 逐节点机器断言。

## 5. G7b 证据清单与终态封装 —— 已闭环

- 原始文件：`MANIFEST-SHA256.txt`、`manifest-verify.txt`、`terminal-validator.txt`。
- 实际结果：manifest 由声明 cwd（`receipts/evidence/i1-03/`）以统一相对路径一次生成（排除自身，18 个文件），`shasum -a 256 -c` 一次回读 18×OK、exit=0（两遍校验记录在 `manifest-verify.txt`，最终遍历含全部文件）；Validator 仅保留唯一最终比较记录 `payload == validated input: True`、exit=0（`terminal-validator.txt`）。
- 反向排除：manifest 不含自身、不含缺失文件、无 `./` 与 workspace 相对路径混用；无残留 False 比较。
- 覆盖边界：本地封装动作，命令与 cwd 全记录。

## 6. 代码修复与工程门禁

本轮修复清单（均属补充提示允许范围）：

| 文件 | 修复 |
|---|---|
| `sw-common/.../TenantLineSuspension.java`（新增） | 认证装载期租户过滤挂起开关 |
| `sw-common/.../CommonTenantLineHandler.java` | ignoreTable 接入挂起开关 |
| `SysUserMapper.java` | selectGlobalByUsername（全局唯一用户名解析） |
| `SysUserServiceImpl.java` | getByUsername 走全局解析；updateWithAssociations 的 roleIds/posts 为 null 时保持不变（修复部分更新静默清空关联，空数组仍=清空），测试 `updateWithAssociations_nullAssociations_shouldPreserve` |
| `UserDetailsProviderImpl.java` | 身份装载全程挂起租户过滤 |
| `ParticipantNameService.java` | resolveNodeAssignees（节点权威参与人，HANDLED>PENDING>INVALIDATED） |
| `BpmInstanceController.java` / `BpmMyInstanceController.java` | 流转记录快照覆盖 assignee |
| `Smart-WorkFlow-Web/.../DeptList.vue` | 挂载加载负责人候选 |

门禁（终态候选原始输出全落盘）：

- Server：`server-mvn-test-raw.txt`（12:2x 全量重跑，退出码 0）BUILD SUCCESS；`server-module-gate-summary.txt`：12 模块合计 **1223 / 0 / 0 / 0**（上轮 1222 + 新增 1）。
- Web：`web-typecheck-raw.txt` / `web-lint-raw.txt` / `web-test-raw.txt` / `web-build-raw.txt` 四门禁退出码全 0；vitest **1176 passed + 3 skipped**。
- Flyway：V67 未触及，不重写迁移证据（全链用例随 Server 全量通过）。

## 7. 账本核对

G1b、G2b、G3b、G5b、G7b 五原子全部关闭（正向断言+反向排除+原始输出齐全）；`remaining_actionable_count=0` 与证据一致；I1 整体自验通过，待规划独立验收。未核销 P 编号、未写 PASSED/COMPLETED、未移动方向、未提交 Git、未进入 I2。

唯一下一动作 = Planner 对本回执独立验收；通过后由规划下发 I2「低代码表单收口」。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/v0.3.0-oa-completion/receipts/stage-i1-v0.3.0-oa-completion-03.md","evidence":["product/v0.3.0-oa-completion/receipts/evidence/i1-03/identity.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-03/worktree-fingerprint.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-03/g1b-role-member-readback.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-03/g2b-tenant-isolation.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-03/g5b-g3b-process-assertions.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-03/server-mvn-test-raw.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-03/server-module-gate-summary.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-03/web-typecheck-raw.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-03/web-lint-raw.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-03/web-test-raw.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-03/web-build-raw.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-03/MANIFEST-SHA256.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-03/manifest-verify.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-03/browser/README.md"],"feature_status":"IN_PROGRESS","work_items":[{"id":"i1-g1b-leader-members","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已闭环：负责人列挂载加载回显 + 角色成员 UI 添加/移除与 DB 回读一致"},{"id":"i1-g2b-tenant-session","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已闭环：认证链租户过滤缺陷修复后，tenant5 真实会话 + 本租户正向 + 双向隔离（403/null/零写入）"},{"id":"i1-g3b-task-reject","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已闭环：锁定 taskId 2da1b771 后停用，原 token 携正确路径办理 401，快照 PENDING 回读"},{"id":"i1-g5b-history-detail","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已闭环：快照覆盖 assignee 修复，同实例三候选策略变更前后逐节点断言 G5B_ALL_PASS"},{"id":"i1-g7b-manifest-terminal","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已闭环：单一路径基准 manifest 排除自身，16 项一次回读 exit=0；Validator 唯一最终比较 True"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待 Planner 对 I1 补证回执 03 独立验收；通过后由规划下发 I2「低代码表单收口」","next_action_type":"WAIT_PLANNER","progress_fingerprint":"p60-i1-evidence-03-20260909-server-1223-web-1176","progress_basis":{"files_changed":["SysUserMapper/SysUserServiceImpl/UserDetailsProviderImpl（G2b 认证租户链）","TenantLineSuspension/CommonTenantLineHandler（挂起开关）","ParticipantNameService/BpmInstanceController/BpmMyInstanceController（G5b 快照覆盖）","Smart-WorkFlow-Web DeptList.vue（G1b 负责人回显）","PermissionConvergenceTest（+1 null 语义回归）","evidence/i1-03/ 全目录"],"tool_actions":["真实浏览器/HTTP/H2 行为链（G1b/G2b/G3b/G5b）","mvn test 全量重跑 BUILD SUCCESS 12 模块 1223/0/0/0","Web 四门禁 exit=0（1176 passed + 3 skipped）","manifest 单 cwd 生成 + 一次回读 18×OK exit=0","终态 Validator exit=0"],"new_evidence":["product/v0.3.0-oa-completion/receipts/evidence/i1-03/"],"closed_work_items":["i1-g1b-leader-members","i1-g2b-tenant-session","i1-g3b-task-reject","i1-g5b-history-detail","i1-g7b-manifest-terminal"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"mvn test（Server 全工程，终态候选）","outcome":"SUCCEEDED","detail":"BUILD SUCCESS；12 模块合计 1223 tests / 0 failures / 0 errors / 0 skipped（server-mvn-test-raw.txt）"},{"tool":"pnpm typecheck/lint/test/build（Web）","outcome":"SUCCEEDED","detail":"四门禁退出码全 0；vitest 1176 passed + 3 skipped（web-*-raw.txt）"},{"tool":"G1b 浏览器闭环","outcome":"SUCCEEDED","detail":"负责人列回显截图 + 成员添加/移除 toast 与 DB 回读一致（browser/01-04、g1b-role-member-readback.txt）"},{"tool":"G2b 租户会话与隔离","outcome":"SUCCEEDED","detail":"i1_t5 真实登录 tenantId=5；本租户正向仅租户五数据；跨租户写 403、读 null；零写入回读（g2b-tenant-isolation.txt）"},{"tool":"G3b+G5b 流程断言","outcome":"SUCCEEDED","detail":"锁定 taskId 停用后原 token 办理 401、快照 PENDING；同实例三候选策略变更前后逐节点一致 G5B_ALL_PASS（g5b-g3b-process-assertions.txt）"},{"tool":"G7b 封装校验","outcome":"SUCCEEDED","detail":"MANIFEST 16 项一次回读 exit=0（manifest-verify.txt）；终态 Validator exit=0 且唯一最终比较 True（terminal-validator.txt）"}],"browser_status":"OPERABLE"}
