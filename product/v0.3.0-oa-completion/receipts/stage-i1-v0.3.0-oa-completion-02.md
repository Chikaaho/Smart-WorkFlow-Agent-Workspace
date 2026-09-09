# P60 I1「组织与权限底座」阶段补证回执 02（验收 01 · G1—G7 整改）

> 角色：执行（Executor）；回执日期：2026-09-09
> 上游审查：`planning-review-stage-i1-v0.3.0-oa-completion-01.md`（VERIFYING，I1 暂不通过，缺口 G1—G7）
> 本回执只承接 G1—G7，不重复已锁定项（清单同步、V67 双方言记录值、34 个新增测试摘要计数、合法终态）。
> 证据目录：`receipts/evidence/i1-02/`（原始输出逐文件落盘，SHA256 清单 `MANIFEST-SHA256.txt`）。

## 0. 候选与指纹

- 候选 HEAD 与规划锁定一致：workspace `7712fa5`、server `3aec762`、web `8d26f61`（`identity.txt`）。
- 工作树指纹（终态复算）：workspace `b319edd5…`、server `635d963a…`、web `96e1bb41…`（`worktree-fingerprint.txt`；server 指纹较首轮变化仅因 G6/G7 修复，见 §7）。
- 存量/I1 边界分类：`change-boundary.md`（含验收 01 点名的 `notify-batch-send.evidence.spec.ts` 一行 diff 归属说明：`postIds: []` → `posts: []`，属 I1 岗位契约升级的必要适配）。
- V67 双方言 MD5 复算：`02b985d47031ff0a379502ab4d61cdae` 两侧一致（`v67-dialect-identity-md5.txt`），与规划锁定值一致。

## 1. 真实运行环境（G1—G6 全部行为证据的同一载体）

- 后端：`sw-bootstrap-1.0.0-SNAPSHOT.jar`，profile `dev`，端口 18080；H2 **file** 库（`/tmp/i1-runtime/i1db`，AUTO_SERVER，支持外部 H2 Shell 直查持久化状态）；**真实 Redis**（localhost:6379，登录挑战/登录缓存均走它）；运行期外部注入 `SW_LOGIN_RSA_PRIVATE_KEY`（openssl 生成 2048 位）与 `SW_LOGIN_DIGEST_SECRET`，未改任何安全默认。
- 登录主体全部经真实 `GET /api/auth/challenge` + `POST /api/auth/login`（RSA-OAEP-SHA256 密文密码 + 验证码）签发 JWT；验证码答案经服务端 HMAC 摘要（密钥为本次运行期注入值）本地穷举还原，属对自建运行时的合法测试手段，服务器侧校验链完整未绕过。
- 持久化回读：H2 Shell（`h2sql.sh` 方式记录于各证据文件内嵌 SQL 与结果）。

## 2. G1 真实组织管理闭环 —— 已补齐

证据：`g1-a-create-chain.txt`、`g1-b-persistence-readback.txt`、`g1-b-boundaries-cleanup.txt`、`browser/`。

- 固定对象（tenant 0）：部门 D1/I1D1、D2/I1D2；岗位 PM、DEV；用户 i1_leader/i1_init/i1_pm/i1_pm2/i1_plain/i1_revoke/i1_off。
- 创建链（HTTP 200/业务码 0）：岗位×2、部门×2、用户×7、部门负责人指派（PUT dept leaderId → GET 回读 `leaderId` 命中）、岗位任职对象契约（PUT/GET `/system/user/{id}/posts` `[{"postId","deptId"}]` 回读一致）、角色 I1_ROLE 创建 + 菜单授权（menu 13）+ 成员绑定。
- 持久化回读（H2 直查）：`sys_dept.leader_id` 落列、`sys_user_post.dept_id` 落列（i1_pm→PM@I1D1、i1_pm2→PM@I1D2、i1_init→DEV@I1D1）、`sys_role_menu`(I1_ROLE→13)、V67 按钮种子 340–345 全部在列。
- 边界（正向断言+反向排除）：重码岗位 400「岗位编码已存在」；重码部门 400；非法负责人 999999 → 400「部门负责人不存在、已停用或无效」；部门成环（root.parent=子部门）→ 400「上级部门不能是自身的子部门」；绑定不存在岗位 → 400「只能绑定启用的岗位」；岗位停用后绑定 → 400，恢复启用后可绑；删除有在职用户的部门 D2 → 400「该部门下存在在职用户，无法删除」（回读 deleted=0）；一次性用户/岗位/角色删除 → deleted=1 且 `sys_user_role` 清零回读。
- 浏览器：`browser/02–06`（用户/部门/岗位/角色四页真实登录渲染 + 角色成员对话框），README 索引见 `browser/README.md`。

## 3. G2 三类真实登录身份与负向权限矩阵 —— 已补齐

证据：`g2-identity-matrix.txt`、`browser/07–08`。

- 身份 A 授权管理员 admin（superadmin, tenant 0）：管理接口正向（用户/部门/岗位/角色全链，见 G1）。
- 身份 B 普通无权用户 i1_plain（真实 JWT）：`/auth/me` permissions=[]；`POST /system/user/page`、`GET /system/dept/tree`、`POST /system/dept`（构造写）、`POST /system/role`（构造写）、`GET /system/user/1`（深链）全部 **403「无权限」**；浏览器：菜单栏为空、无「进入后台」、深链 `/user` 路由未注册 404（`browser/07–08`）。
- 身份 C 被停用用户 i1_off：停用后登录尝试 → 业务码 401「账号已停用」拒签发；停用前签发的旧 token → 401（详见 G3 场景 1）。
- 跨租户（fixture：tenant 5 部门 8001/角色 8002(授权 user:list+dept:list)/用户 8005 i1_t5，H2 Shell 注入，回读在案）：
  - admin 视角：`GET /system/dept/8001` → data=null（不可见）；全量用户分页不含 i1_t5；对 8001 改名、DELETE 8005 均无效果（零越权写入回读：`name=租户五部门`、`deleted=0` 原样）。
  - admin 部门树 codes=[root,I1D1,I1D2] 不含 T5D。
  - **产品边界（如实报告）**：登录链路 `getByUsername` 受租户行过滤、登录态无租户上下文时按 0 处理，故 `/login` 仅承载租户 0 账号——租户 5 主体无法取得真实登录会话。因此"跨租户拒绝"以租户 0 主体对租户 5 对象的读/写双向拒绝 + 零写入回读呈现，未伪造租户 5 登录态。

## 4. G3 权限即时收敛（同一 token 前后对照）—— 已补齐

证据：`g3-convergence-and-g6-runtime-injection.txt` 场景 1–3、G4 链 G3T 段。

- 场景 1 停用：i1_off 同一 token `GET /auth/me` 变更前 200 → 管理员停用 → 变更后 **401**；`POST /system/user/page` 亦 401；DB 回读 status=1。
- 场景 2 撤菜单：i1_revoke 同一 token `GET /system/dept/tree` 变更前 200 → `PUT /system/role/{id}/menus []` → 变更后 **403**；`/auth/me` 仍 200（身份在、权限收敛）；DB 回读 role_menu=0。
- 场景 3 撤角色：roleIds 清空后同一 token `GET /system/dept/tree` **403**；DB 回读关联 0。
- 待办办理拒绝：G4 流程 n0（FIXED_USER=i1_revoke）真实任务 fa8962db 在其待办中（变更前 200）→ 停用 i1_revoke → 同一 token `GET /workflow/tasks/todo` **401**、`POST /workflow/tasks/fa8962db/complete` **401**；快照回读该待办仍 PENDING 绑定被停用主体（负向事实如实记录）。

## 5. G4 三种选人策略真实流程任务 —— 已补齐

证据：`g4-g5-process-chain.txt`（表单/流程发布 → 发起 → 四节点全推进 → 快照回读）。

- 真实入口：发布表单 `i1_leave`（config 两字段 + publish）→ 创建流程定义 → PUT graph（START→n0 FIXED_USER[U_REVOKE]→n1 DEPT_LEADER[D1]→n2 POST["PM"]→n3 DEPT_POST{D1,"PM"}→END）→ validate → publish（自动建 form binding）→ i1_init `POST /form/data/i1_leave` 发起（recordId 603501fd…）。
- 正向断言（全部真实待办接口观测）：
  - n0 FIXED_USER：i1_revoke 待办出现任务 fa8962db；
  - n1 DEPT_LEADER：i1_leader 待办出现 1aa34ff1（负向排除：i1_pm 待办为空）；
  - n2 POST："PM" 同一任务 2b661574 同时出现在 i1_pm 与 i1_pm2 待办（跨部门全量命中）；i1_pm 办理后 i1_pm2 快照置 INVALIDATED（reason「节点已由 2097514366630486018 以 APPROVE 处理」）；
  - n3 DEPT_POST：仅 i1_pm 待办出现 2cacc64d（负向排除：i1_pm2 待办为空）。
- 流程推进至 APPROVED；`sw_bpm_participant_snapshot` 5 行回读（participant_id/status/name 与上述一致）。
- 边界说明（如实报告）：流转记录接口对候选模式任务（Flowable 历史无 ASSIGNEE_）存在存量兜底——以历史流程变量 approver（发起人）补位显示（`BpmRuntimeFacadeImpl.queryHistoricActivities` 内注释为 R-04 缺口补齐）；权威参与人身份以快照表为准，本回执 G5 冻结证据即锚定快照与 FIXED_USER 直派行。

## 6. G5 历史身份冻结 —— 已补齐

证据：`g4-g5-process-chain.txt` G5/G5b 段。

- 组织变更（真实管理操作）：i1_leader 改名「张三已改名」+ 停用 + 调部；i1_pm 调往二部；D1 负责人改派 i1_pm。
- 持久化冻结：变更后快照表回读 participant_name 保持「部门负责人张三」「岗位任职王五」「待撤权用户」，无任何改写。
- API 级冻结（G5b，FIXED_USER 直派行）：新实例 nA 发起时快照名=「张三已改名」；再次改名「冻结对照张三v3」后，实例详情 `assigneeName` 仍为「张三已改名」，断言通过（v3 未出现）。
- 存量空快照回退边界：手工置空 n1 行 participant_name → 详情回退实时解析显示当前名，且快照 NULL 不被回写（回读在案）。

## 7. G6 失效路径 fail-secure —— 已修复并双路验证

**代码修复**（本轮 server 侧唯一产品代码变更，`SysUserServiceImpl` / `SysRoleServiceImpl`）：

- 删除"驱逐失败吞异常 + TTL 兜底"降级路径；改为 fail-secure：驱逐失败（缓存中间件等基础设施异常）→ 记 ERROR 审计日志 → 异常向上抛 → `@Transactional` 回滚 → 变更明确失败；不存在"变更成功但旧会话保留旧权限"窗口。
- 仅容忍 `NoSuchBeanDefinitionException`（手工构造的非生产上下文；生产由 SecurityAutoConfiguration 恒创建 LoginUserLoader，无此路径）。
- `kickOutMembers` 的成员反查失败同样不再吞异常（反查→逐个驱逐整段 fail-secure）；`RoleMenusContractAndSecurityTest` 上下文补齐真实 `sys_user_role` 表使反查真实执行。
- 行为测试 `PermissionConvergenceFailSecureTest`（新增 5 例）：注入驱逐失败 → 停用/撤权/角色菜单变更/删角色全部抛出且 DB 回滚（status=0、关联保留、menuIds 不变）；装配缺失容忍路径变更正常提交。另补用户名重复创建业务拒绝 1 例（`PermissionConvergenceTest`，见 §8 缺口修复）。

**真实运行时注入**（`g3-convergence-and-g6-runtime-injection.txt` 场景 4R）：

- `redis-cli shutdown nosave` 真实停机 → 管理员停用 i1_g6b 的 PUT → **503**「登录上下文装载失败（认证基础设施未就绪…Redis command timed out）」——变更未发生（DB 回读 status=0），未出现"成功变更"；服务端审计日志在案。
- Redis 恢复后同一变更 → 200 → 同一旧 token `GET /auth/me` → **401**。

## 8. 附带缺口修复（运行时发现，属 I1 用户管理边界范围）

- 重复用户名创建此前撞 `UK_SYS_USER_USERNAME` 漏出 500；已加业务前置校验 → 400「用户名已存在」（`SysUserServiceImpl.create`），测试 `createUser_duplicateUsername_shouldReject`。该修复改变了 server 候选，**Server 全量门禁已在其后全量重跑**（见 G7）。

## 9. G7 工程门禁与候选勾稽 —— 已补齐

- **Server 全量**（终态候选，修复后重跑，`server-mvn-test-raw.txt` 10:46:41–10:48:13 退出码 0）：`MAVEN_OPTS="-Xmx2g" mvn test` BUILD SUCCESS；12 模块逐项计数见 `server-module-gate-summary.txt`，合计 **1222 / 0 / 0 / 0**（基线 1216 + G6 新增 5 + 唯一性 1）。原始 stdout/stderr 完整落盘。
- **Flyway 全链复算**（同一原始输出）：H2 链 `FlywayFullChainH2Test` 15 用例全绿、PG 链 `FlywayFullChainPostgresTest` 全绿，日志显示 validated 66 migrations、尾部 v67（原始输出行号可查）。
- **Web 四门禁**（web 候选未变，原始输出）：`web-typecheck-raw.txt` / `web-lint-raw.txt` / `web-test-raw.txt` / `web-build-raw.txt`，退出码全 0；vitest **1176 passed + 3 skipped**。
- **边界与指纹**：`diff-name-status.txt`（三仓全量 name-status）、`change-boundary.md`（存量 38 个 server product 删除、web 三个 P4 遗留 json、uploads/ 均归类维持原状）、`worktree-fingerprint.txt`（三仓指纹 + HEAD 复核）。
- **证据完整性**：`MANIFEST-SHA256.txt` 覆盖 i1-02 全部文件。

## 10. 与验收 01 差异表的逐项对照

| 缺口 | 完成条件达成方式 | 最小可接受证据落点 |
|---|---|---|
| G1 | 授权管理员全链管理操作 + 边界 + 回读 + 清理 | g1-a/g1-b 三文件 + browser/02–06 |
| G2 | 三类真实登录主体 + 构造请求 + 403/401 + 跨租户双向拒绝 + 零越权回读 | g2-identity-matrix.txt + browser/07–08 |
| G3 | 同 token 变更前 200 → 变更后 401/403；同待办 ID 办理拒绝；持久化回读 | g3-…txt 场景 1–3 + G4 链 G3T 段 |
| G4 | 真实发布流程 + 三策略（另含 FIXED_USER）任务/办理人/轨迹/快照 + 负向样例 | g4-g5-process-chain.txt |
| G5 | 同实例组织变更前后回读 + API 冻结断言 + 空快照回退边界 | g4-g5-process-chain.txt G5/G5b 段 |
| G6 | 先修复（fail-secure）再验证：单测注入 5 例 + 真实 Redis 停机注入 503/回滚/恢复收敛 | PermissionConvergenceFailSecureTest + g3-…txt 场景 4R |
| G7 | 同一固定候选上全部门禁原始输出可复算 + 指纹 + SHA256 + 存量边界归属 | server-mvn-test-raw.txt 等五份原始输出 + diff/fingerprint/manifest |

## 11. 自验结论

G1—G7 已按"最小可接受证据"口径以真实行为链补齐；G6 先修复后验证；全程未核销 P60/P2/P4/P26/P31/P34/P35/P37/P38/P39，未写功能 PASSED/COMPLETED，未移动方向，未提交 Git。已知边界如实记录：登录链路仅承载租户 0 账号（跨租户以双向不可见+零写入呈现）；候选模式任务的流转记录 assignee 存在存量 approver 兜底（权威身份以快照为准）。I1 整体自验通过，待规划独立验收。

唯一下一动作 = Planner 对本补证回执独立验收；验收通过后按方向排期下发 I2「低代码表单收口」。

ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/v0.3.0-oa-completion/receipts/stage-i1-v0.3.0-oa-completion-02.md","evidence":["product/v0.3.0-oa-completion/receipts/evidence/i1-02/identity.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-02/worktree-fingerprint.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-02/change-boundary.md","product/v0.3.0-oa-completion/receipts/evidence/i1-02/server-mvn-test-raw.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-02/server-module-gate-summary.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-02/web-typecheck-raw.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-02/web-lint-raw.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-02/web-test-raw.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-02/web-build-raw.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-02/g1-a-create-chain.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-02/g1-b-persistence-readback.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-02/g1-b-boundaries-cleanup.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-02/g2-identity-matrix.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-02/g3-convergence-and-g6-runtime-injection.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-02/g4-g5-process-chain.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-02/MANIFEST-SHA256.txt","product/v0.3.0-oa-completion/receipts/evidence/i1-02/browser/README.md"],"feature_status":"IN_PROGRESS","work_items":[{"id":"i1-g1-org-loop","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已闭环：真实 HTTP 管理链+边界+持久化回读+浏览器四页"},{"id":"i1-g2-identity-matrix","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已闭环：三类真实主体 403/401 + 跨租户双向拒绝与零写入回读（登录租户边界如实记录）"},{"id":"i1-g3-convergence","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已闭环：同 token 停用/撤菜单/撤角色 401/403 + 同待办 ID 办理拒绝"},{"id":"i1-g4-participant-strategies","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已闭环：FIXED_USER/DEPT_LEADER/POST/DEPT_POST 真实流程任务与负向排除、快照 5 行回读"},{"id":"i1-g5-history-freeze","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已闭环：组织变更前后快照冻结 + API 断言 + 空快照回退边界"},{"id":"i1-g6-fail-secure","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已闭环：吞异常降级路径移除+5 例回滚单测+真实 Redis 停机注入 503/回滚/恢复收敛"},{"id":"i1-g7-gates-fingerprint","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"已闭环：修复后全量重跑 12 模块 1222/0/0/0 + Web 四门禁 + 指纹/清单/SHA256"},{"id":"i2-form-completion","status":"PENDING","authorized":false,"dependency_satisfied":false,"actionable":false,"next_action":"待 Planner 验收本回执后下发 I2 执行入口"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待 Planner 对 I1 补证回执 02 独立验收；通过后由规划下发 I2「低代码表单收口」","next_action_type":"WAIT_PLANNER","progress_fingerprint":"p60-i1-evidence-02-20260909-server-1222-web-1176","progress_basis":{"files_changed":["SysUserServiceImpl/SysRoleServiceImpl（G6 fail-secure）","PermissionConvergenceFailSecureTest（新增 5 例）","PermissionConvergenceTest（+1 例用户名唯一）","RoleMenusContractAndSecurityTest（补 sys_user_role）","evidence/i1-02/ 全目录"],"tool_actions":["mvn test 全量重跑：BUILD SUCCESS 12 模块 1222/0/0/0","Web 四门禁 exit=0（1176 passed + 3 skipped）","真实运行时 HTTP/浏览器/流程/持久化行为链（G1—G5）","Redis 停机注入与恢复（G6）","三仓指纹与证据 SHA256 清单"],"new_evidence":["product/v0.3.0-oa-completion/receipts/evidence/i1-02/"],"closed_work_items":["i1-g1-org-loop","i1-g2-identity-matrix","i1-g3-convergence","i1-g4-participant-strategies","i1-g5-history-freeze","i1-g6-fail-secure","i1-g7-gates-fingerprint"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"mvn test（Server 全工程重跑）","outcome":"SUCCEEDED","detail":"BUILD SUCCESS；12 模块合计 1222 tests / 0 failures / 0 errors / 0 skipped；10:46:41–10:48:13 退出码 0（server-mvn-test-raw.txt）"},{"tool":"pnpm typecheck/lint/test/build（Web）","outcome":"SUCCEEDED","detail":"四门禁退出码全 0；vitest 1176 passed + 3 skipped（web-*-raw.txt 四份原始输出）"},{"tool":"真实行为链 G1—G5","outcome":"SUCCEEDED","detail":"g1-a/g1-b/g2/g4-g5 原始 HTTP 交换 + H2 直查回读 + 浏览器 8 张截图；四策略节点全推进至 APPROVED"},{"tool":"G6 fail-secure 验证","outcome":"SUCCEEDED","detail":"PermissionConvergenceFailSecureTest 5/5（驱逐失败回滚）；运行时 Redis 停机注入 PUT→503、DB status=0、恢复后变更→200→旧 token 401"},{"tool":"指纹与完整性","outcome":"SUCCEEDED","detail":"三仓 HEAD 与规划锁定一致；worktree 指纹复算；MANIFEST-SHA256.txt 覆盖全部证据文件"}],"browser_status":"OPERABLE"}
