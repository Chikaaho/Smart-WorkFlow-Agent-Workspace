# P24 / I49 执行完成回执：不可变超管与可配置管理员角色

## 结论

执行层修正完成，提交规划层复审；P24/I49 仍保持未核销，方向继续留在 `ready/`。

已落地 `built_in=true + code=superadmin` 的后端不可变保护、普通 `admin` seed、角色菜单/按钮权限读写、用户角色绑定读写、job/storage 方法级权限，以及前端角色保护/权限树/用户角色入口。未创建默认用户、未改绑现有用户、未扩大到 P1 其他组织关系缺口。

## Step 与修改范围

1. 后端角色治理：`SysRoleService/Impl`、`RoleController` 增加超管保护和菜单读写；`SysUserService/Impl`、`UserController` 增加角色读写；新增角色菜单、用户角色绑定的读写/清空回填测试。
2. 后端接口鉴权：JobInfo、JobLog、Storage 控制器增加 `@PreAuthorize`；storage biz 补 `sw-security` 依赖。
3. 数据迁移：新增 `sw-bootstrap` H2/PostgreSQL `V31__admin_role_governance.sql`。seed `admin`（名称“管理员”、code=`admin`、启用、非内置、data_scope=ALL），显式关联 V31 前已有菜单及 200–208 job/storage 按钮 permission；不 seed 用户。发现活动 `code=admin` 或 `id=2` 冲突时由数据库主键/唯一约束显式失败，不再静默跳过。
4. 前端：RoleList 超管行只读、菜单/按钮树回填与保存；UserList 角色绑定与回填；role/user API 增加关系端点；mock 角色改为 `superadmin` + 普通 `admin`；生成组件类型补 checkbox。

## 验证证据

- 前端：`NODE_OPTIONS='--max-old-space-size=2048' pnpm typecheck && pnpm lint && pnpm test && pnpm build` 全部通过；66 spec、576 tests。lint 0 errors，5 个 Prettier warnings；build 有既有 `@vueuse/core` Rolldown annotation warning，退出码为 0。
- 后端受影响模块：`MAVEN_OPTS='-Xmx2g' mvn ... -pl sw-biz-system-biz,sw-basic-job-biz,sw-basic-storage-biz -am test` 通过；新增权限行为测试通过。
- 后端项目级全量：`MAVEN_OPTS='-Xmx2g' mvn -q -DargLine='-javaagent:.../byte-buddy-agent-1.15.11.jar' test` 汇总 551 tests、0 failures、0 errors、0 skipped；超过方向基线 543。首次沙箱运行因 HTTP mock 绑定端口被拒绝，获准后同命令全绿。
- 迁移：`FlywayFullChainH2Test` 10 tests 通过，31 migrations migrate、validate 通过；admin 字段/9 项 job-storage permission/superadmin 保持/冲突显式失败均有断言；H2/PG V31 `cmp` 逐字一致。
- Security：`PermissionServiceTest` 覆盖普通 admin 显式授权、撤权拒绝和 superadmin 无 permission 旁路；新增 `JobInfoControllerAuthorizationTest`、`StorageControllerAuthorizationTest`，通过真实 Spring Method Security + MockMvc 请求链逐项证明：带 `job:list` / `storage:list` 请求返回 200；同一请求用户撤权后返回 403；无认证请求返回 401。Job 六项和 Storage 四项方法注解/seed permission 字符串仍由对应控制器测试与 Flyway seed 断言逐项覆盖。尚未启动真实部署服务做 HTTP token allow/deny，因此真实环境联调仍是部署前风险。
- 互斥检查：在后端 compile 前、前端 typecheck 前分别以提权 `ps -axo pid=,comm=` 快照检查 `mvn/java/javac/pnpm/npm/node/vite/tsc/gradle`，两次均输出 `no competing compile/test process`；随后后端 `mvn -q -DskipTests compile` 与前端 `pnpm typecheck` 严格串行，均退出 0。沙箱内 `ps` 的 `operation not permitted` 仅作为失败尝试保留，不作为验收证据。

## 功能清单同步明细（D95）

本次对 `Smart-WorkFlow/功能清单.md` 做全量核对，结论为**零变化**：工作树无该文件 diff，未改动任何功能行或模块总览。

- 相关行逐项核对：`M02-F01-01` 角色管理仍为 🟦；`M02-F02-01` 菜单权限仍为 🟦；`M02-F03-01` 按钮权限仍为 🟦；`M10-F03-01` 定时任务仍为 ✅；`M10-F06-01` 文件管理仍为 ✅。
- 零变化原因：本次修正补足执行证据与请求级保护测试，不对功能清单状态作规划层终态裁决；角色治理的整体清单状态继续保持原值。
- 同步后全量计数：90 条明细，`✅ 12 / 🟦 37 / ⬜ 41`。文件顶部模块总览为 `55 功能 / 90 明细`，与明细总数一致。

## 偏差与风险

- 真实 PostgreSQL migrate/validate 未在本地执行，已用同语义 H2 全链和 H2/PG V31 逐字比较覆盖静态证据。
- 未启动真实部署服务执行 HTTP token allow/deny；当前证据为权限服务普通角色允许/撤权拒绝、superadmin 旁路和控制器方法权限自动化测试。
- 迁移冲突采用数据库约束显式失败，部署前应将冲突诊断信息纳入运维流程；不会覆盖或静默改写历史角色。

## 知识同步

- 已新增 `knowledge/features/admin-role-governance.md`。
- 已在 `knowledge/current-status.md`、`knowledge/features/admin-role-governance.md`、`knowledge/known-issues.md`、`todo/requirement-pool.md` 记录 P24/I49/I36 子集状态；需求池保持 FAILED/待规划复审，未提前核销。
- P1 其余部门筛选、人员查询、岗位关联等缺口保持未关闭。

## 完整触碰文件清单

后端：`sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/{controller/RoleController.java,controller/UserController.java,service/SysRoleService.java,service/SysUserService.java,service/impl/SysRoleServiceImpl.java,service/impl/SysUserServiceImpl.java}`；对应 `RoleControllerTest.java`、`UserControllerTest.java`；`sw-basic/sw-basic-job/sw-basic-job-biz/src/main/java/com/sw/ck/job/controller/{JobInfoController.java,JobLogController.java}` 与 `JobInfoControllerTest.java`、`JobInfoControllerAuthorizationTest.java`；`sw-basic/sw-basic-storage/sw-basic-storage-biz/src/main/java/com/sw/ck/storage/controller/StorageController.java`、`pom.xml` 与 `StorageControllerTest.java`、`StorageControllerAuthorizationTest.java`；`sw-bootstrap/src/main/resources/db/migration/{h2,postgresql}/V31__admin_role_governance.sql`、`FlywayFullChainH2Test.java`；`sw-framework/sw-security/src/test/java/com/sw/ck/security/support/PermissionServiceTest.java`。

前端：`src/foundation/mock/seeds.ts`、`src/modules/system/api/{role.ts,user.ts}`、`src/modules/system/types/user.ts`、`src/modules/system/views/{RoleList.vue,UserList.vue}`、`src/types/components.d.ts`。

规划知识：`knowledge/features/admin-role-governance.md`、`knowledge/current-status.md`、`knowledge/known-issues.md`、`todo/requirement-pool.md` 及本回执。功能清单：`Smart-WorkFlow/功能清单.md`，本轮零变化，仅完成全量核对与计数记录。
