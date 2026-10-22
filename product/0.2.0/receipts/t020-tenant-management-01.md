# T020 租户管理首批实现（服务端接口与租户页面）

2026-10-22｜Executor｜XL｜IN_PROGRESS｜自验通过，待 Planner 验收

## 1. 范围与阶段

本批实现 T020 的租户列表、创建（含首任管理员与根部门）、改名、启停，以及对应的 Web 页面。七阶段：已完成 1「需求评估」；进行中 1「分支实施」；未开始 5「验收同步、合并、发布、发布后同步、结束」。

不代表 T020 完成：视觉像素对照、真实数据库与可见浏览器行为链、停用后的会话收敛、既有租户管理员关系回填均未完成。

## 2. 变更

服务端（`codex/0.2.0-tenant-form-flow`，提交 `02f3473`）：

- `TenantController`：`GET /system/tenant/page`、`GET /system/tenant/{id}`、`POST /system/tenant`、`PUT /system/tenant/{id}`、`PUT /system/tenant/{id}/status`。读写都要求 `system:tenant:list`，写操作由服务层确认调用者是租户 0 的系统超级管理员。
- `TenantAdminService`：一次事务内建立租户、根部门、首任管理员、管理员角色模板副本与角色菜单副本、用户角色绑定；任一步失败整体回滚。租户 0 拒绝改名与停用；管理员账号写入前做重复检查并返回明确业务错误。
- 首任管理员关系取自既有明确授权关系：同租户内 `code=admin` 的角色恰有一个持有者时显示其账号，零个或多个一律显示「未配置」，不猜测、不自动提升。
- 新增 versioned 迁移 `V0.1.8__tenant_username_unique.sql`（PG/H2 同文）：删除 `uk_sys_user_username`，建立 `uk_sys_user_tenant_username (tenant_id, username, deleted)`，用户名改为按租户唯一。
- 登录适配：`AuthController` 支持可选 `tenantCode` 精确定位；未带租户编码时 `getByUsername` 在跨租户重名情况下 fail closed（返回空，按密码错误处理），不随机取账号。迁移链契约测试的版本终点、迁移计数与升级执行数已同步到 0.1.8 / 16 条。
- `TenantAdminServiceTest`：5 个行为用例覆盖普通租户无权、原子初始化、重复账号拒绝、租户 0 只读、非法状态。

前端（`codex/0.2.0-ui-tenant-form-flow`，提交 `f9fa147`、`1164d6d`）：

- `src/modules/system/views/TenantList.vue`：筛选（租户名称、状态）、列表（编号/名称/管理员/状态/创建时间/操作）、新增弹窗（名称整行、管理员账号与初始密码两列）、改名弹窗、启停确认、租户 0 只读详情。
- `api/tenant.ts`、`types/tenant.ts`、`TenantList.spec.ts` 与中英文文案键。
- 静态路由 `system/tenant`（authority `system:tenant:list`）：菜单种子仍指向历史组件路径，先给出同路径落点；后续补菜单迁移时应移除该临时落点。

## 3. 验证结果

| 检查 | 实际结果 |
| --- | --- |
| `MAVEN_OPTS="-Xmx2g" mvn -q -DskipTests compile` | exit 0 |
| `TenantAdminServiceTest` | Tests run: 4, Failures: 0, Errors: 0, Skipped: 0 |
| `FlywayFullChainH2Test` | Tests run: 18, Failures: 0, Errors: 0 |
| `I6G7UpgradeDrillH2Test` | Tests run: 1, Failures: 0, Errors: 0 |
| `ApplicationCenterLegacyUpgradeTest` / `ApplicationCenterUpgradeContinuityTest` | 7/0/0、4/0/0 |
| `AuthControllerTest` | Tests run: 17, Failures: 0, Errors: 0 |
| `pnpm typecheck` | exit 0 |
| `pnpm lint` | exit 0，0 error，2 条既有 warning |
| `pnpm test` | 180 文件通过、1 跳过；1657 通过、3 跳过（1660） |
| `pnpm build` | ✓ built in 2.12s，exit 0 |
| `vitest run TenantList.spec.ts` | 4/4 通过 |

## 4. 设计承接与差距

- 结构承接设计节点 `458:12660`（列表：筛选栏在上、表格列顺序、底部「共 N 条」与分页）、`458:12871`（新增弹窗：名称整行、账号与初始密码两列、取消/保存右对齐）、`458:12943`（编辑仅名称）、`458:13000`（超管行只读查看）。
- 未达像素门槛：页面复用现有 `StandardListTemplate` 与 Element Plus 默认度量，未按 1920×1080 原图逐项量化 x/y/宽高、颜色与字号；没有 reference/runtime/diff 三件套。A03 与 A04 均不通过，本批不得计入视觉验收。
- 设计中的「超管·0」徽标、管理端浅色侧栏与顶栏渐变更属于全局 U020，不在本批范围。

## 5. 发现的产品与数据冲突（需 Planner 裁决）

**DR02 的「租户内唯一」与旧索引 `uk_sys_user_username (username, deleted)` 冲突，Owner 2026-10-22 裁决按合理业务变更直接改为 `(tenant_id, username, deleted)`。** 已实施迁移并更新受影响的迁移链契约测试；登录侧用可选租户编码区分同名账号，缺省路径在重名时拒绝而不是猜账号。

另：`sys_tenant` 既有租户（如 1、2）没有可唯一确认的管理员关系，按 DR02 显示「未配置」，未自动提升任何账号。

## 6. 未完成与下一动作

1. 停用租户后既有会话与未开始认领的收敛：当前只改 `sys_tenant.status`，`TenantValidityService` 在装载时校验，但未实现主动批量驱逐与任务认领拦截验证（A08 未通过）。
2. 真实数据库迁移与接口行为链：H2/PostgreSQL 实际启动、创建租户、首任管理员登录、跨租户越权拒绝均未执行（A06/A07 未通过）。
3. 租户页面 1920×1080 像素对照、1366×768 检查与可见浏览器交互证据（A03/A04 未通过）。
4. 既有租户管理员关系回填入口；菜单种子组件路径迁移（可替换本批的静态路由落点）。
5. 服务端全量测试：迁移链契约族已随 `V0.1.8` 更新并复跑通过；PG 侧契约类（`FlywayFullChainPostgresTest`、`P64*`、`P62NonEmptyUpgradePgTest`、`Phase4PgMigrationBehaviourTest`）只做了断言更新，尚未复跑。环境依赖类（Redis、SSO 密钥、prod 验证码）与本批无关，结果见 §7。在取得干净的全量结果前，不宣称服务端全量门禁通过。

## 7. 服务端全量门禁与环境依赖项

复跑结果（`mvn -pl sw-bootstrap -am -Dtest=...`，18 个用例，3 failures + 5 errors）：

| 测试类 | 结果 | 失败事实 | 与本批关系 |
| --- | --- | --- | --- |
| `IotNativeMqttDeferredDispatchPgTest` | 2/0/0 通过 | 首轮 `DISPATCHING` 是时序抖动 | 无关 |
| `I5PgTenantBehaviorBootTest` | 3 用例，1 error | `Unable to connect to Redis`（localhost:6379） | 环境未启动 Redis |
| `I5SsoBindingSessionBootTest` | 5 用例，1 failure + 3 errors | Redis 不可用；`InvalidKeyException: Missing key encoding` | 环境缺 SSO 密钥配置 |
| `I5ProdProfileSecurityBootTest` | 4 用例，1 error | `prodFixedCaptchaMustNotWork` 读响应字段为空 NPE | 与本批入口无关 |
| `P62UpperEntryC1PgTest` | 4 用例，2 failures | 草稿创建返回 401 `common.unauthenticated` | 依赖会话/Redis 环境 |

结论：迁移链契约族在撤回迁移后复跑通过；剩余失败集中在 Redis、SSO 密钥与 prod 验证码环境，本机没有这些服务与配置。服务端全量 `mvn test` 因此未取得全绿结果，不能宣称全量门禁通过；这些限制与本批代码路径无关，但需要环境补齐后再跑一次全量。服务端本批改动仍以编译通过、5 个服务行为用例、H2 迁移链 18/1 用例作为自验证据。

