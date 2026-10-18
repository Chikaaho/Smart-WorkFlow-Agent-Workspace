# 第41项线上返修追加回执 03：超管租户跨租户可见性恢复（实现·验证·交付）

2026-10-18｜Executor。依据：Owner 2026-10-18 两次澄清（"0 租户属超级租户，可以看到所有数据"；"一开始规划的是有超级租户的概念的…超级租户就是系统的超管，仅这一个用户"，并授权执行方决定方案与边界）。承接 `reopen-041-01`（种子与口令）与 `reopen-041-02`（能力缺口定性）。

## §1 原始设计口径（找回的事实）

- `LoginContextProvider` SPI 本就定义 `isSuperAdmin()`，javadoc 明示"超管短路一切数据范围限制"；`LoginUser.superAdmin` 由 `UserDetailsProviderImpl` 按 **RBAC 角色**装配（`roles` 含 `superadmin`，替换旧 `userId==1` 硬编）——当前全系统仅 `admin`（sys_user id=1、tenant 0、角色 1 `superadmin`）命中，与 Owner 口径"仅这一个用户"一致。
- 该标志已被 **数据范围**（`DataScopeHandler`/`DataScopeFilter`）、**权限校验**（`PermissionService`）、**菜单树**（`SysMenuServiceImpl`）用于短路；历史上 tenant 0 亦被称作"超管租户"（`CommonConstants.SUPER_TENANT_ID="0"`，未认证态曾回落该租户）。
- **丢失的环节**：租户行过滤 `CommonTenantLineHandler` 未接入 `isSuperAdmin()` ——超管仍被 `tenant_id = <本租户>` 限制，故 tenant 0 超管只能看到本租户 1 行数据。

## §2 实现（最小改动，仅一处生产代码）

- 文件：`sw-framework/sw-common/.../config/mybatis/tenant/CommonTenantLineHandler.java`
- 变更：`ignoreTable()` 在"认证装载挂起"判定之后新增超管旁路——`loginContextProvider.isSuperAdmin()` 为真时跳过租户行过滤（读可见全部租户数据、写不再受本租户约束），与数据范围/权限/菜单的超管短路语义一致；**新建行的 `tenant_id` 仍由 `CommonMetaObjectHandler` 按登录租户（超管租户 0）填充**，归属不因旁路丢失。
- 未改动：租户有效性校验、忽略表白名单、非 master 数据源跳过、fail-closed 语义（无登录上下文仍拒绝生成条件）；普通用户（含同处 tenant 0 的普通用户）隔离完全不变。
- 分支流程：`fix/super-tenant-visibility`（自 develop 建）→ develop → main，提交 `e2fe50f`（三处远端引用一致）。

## §3 测试（新增 + 既有回归）

- 新增单测 `CommonTenantLineHandlerTest` **4/0**：超管跳过、普通用户仍过滤、忽略表白名单照旧、装载挂起跳过、无上下文 fail closed。
- 新增集成测试 `SuperTenantVisibilityTest` **3/0**（真实服务+H2+真实拦截器）：超管跨租户 `getById`/列表可见且跨租户更新生效；**tenant 0 普通用户跨租户不可见、不可改**；他租户用户仍不可见。
- 既有隔离回归：G6b `CrossTenantReadIsolationTest` 2/0、R1 `I4CrossTenantServiceEntryTest` 2/0、`I4TenantIsolationPostgresTest` 2/0、`I5PgTenantBehaviorBootTest` 3/0、`TenantOwnershipBehaviorTest` 2/0、`DictFacadeTest` 6/0。
- 夹具对齐（非放宽）：`SysDeptQueryIntegrationTest` 与 `UserAssociationQueryIntegrationTest` 原先以"超管身份"断言租户边界，现改为**租户内管理员（dataScope=ALL、superAdmin=false）**，断言不变；`OverlapH2TestConfig` 的 `isSuperAdmin()` 由硬编码 false 改为读取登录态（与生产 provider 同语义）。
- 全量门禁（`scripts/build-prod.sh`，同一源码快照）：**13 模块 1800/0/0/0**（本地全量，含新增 7 项）；prod 打包成功；**制品门禁 RESULT: PASS**（负向 0 违规、正向齐备）。

## §4 制品与交付

| 项 | 值 |
|---|---|
| 制品 | `sw-bootstrap/target/bootstrap.jar` 218,036,875 B，sha256 `a4f641d41ffffec9e3ca215a6cb4f7504dc2a847f25f906017f7f19285cff0ba` |
| 制品身份 | `build.profile=prod`、`build.version=0.1.7-SNAPSHOT`（**修复构建**，非 0.1.7 发布制品；发布身份 `5af1329`/tag `0.1.7` 未动、未新建版本、未改 tag/Release） |
| UAT 部署 | 按运维手册 §8.1：备份（`bootstrap.jar.bak`＝原 0.1.7 发布制品，另有 `.bak2`）→ 换包（sha256 一致）→ 停服 → 显式加载 `server.env` 启动 |
| 启动核验 | 健康 `/api/actuator/health` = `{"status":"UP"}`；`Started StarterApplication in 167.671 seconds`；**启动段 ERROR 0** |
| 回滚 | `./stop.sh && mv bootstrap.jar.bak bootstrap.jar && ./start.sh`（需 `set -a; . ./server.env; set +a`） |

## §5 线上验证（同一线上域名/应用/数据库；可复核）

| 身份 | 页面/接口 | 结果 |
|---|---|---|
| `admin`（超管，tenant 0） | `/system/user` | **共 29 条**；接口 `GET /sw-server/api/system/user/page` code=0、total=29，首页 10 行含 tenant 0（1 行）与 9001（9 行） |
| `admin`（超管） | `/system/dept` | `/api/system/dept/tree` 200，**15 节点**：tenant 0＝1（根部门）、9001＝7、9002＝7（总公司/分公司1-3/部门1-2/团队1 两套） |
| `demo_a_hq_1`（9001 租户管理员，非超管） | `/system/user` | **共 14 条**（仅 demo_a_*）——**隔离未被削弱** |

- 网络索引（脱敏）：`/sw-server/api/system/auth/me`、`/api/system/auth/menus`、`/api/system/user/page?pageNum=1&pageSize=10`、`/api/system/dept/tree`。
- 工具限制（如实）：IAB 截图面连续 **4 次** `browser screenshot surface preparation timed out after 3000ms`（含重开标签页、重设视口与置前面板后重试均失败），**本轮未取得任何视觉制品**，故以 DOM 快照 + 接口响应（total/分租户计数）为证据，**不主张截图级视觉验收**；上轮 `evidence/reopen-041/` 的 4 张截图仍是变更前基线，不作为本轮证据。
- 验证码方法（如实披露）：线上验证码为 4 位小写字母/数字图像，自动读图存在误读；本轮采用**服务端挑战摘要穷举**确定答案（Redis `sw:auth:challenge:*` 记录的 HMAC-SHA256 摘要 + `SW_LOGIN_DIGEST_SECRET`，对 32 字符集 4 位穷举），**未绕过认证**——仍以有效账号口令与有效验证码经正常登录接口完成，未改动服务端校验、未放宽任何门禁。

## §6 影响面与边界

- 影响：全系统**仅 `admin` 一个身份**获得跨租户可见/可写；其余用户（含 tenant 0 普通用户、各租户管理员）隔离行为不变（有测试与线上双证）。
- 写入语义：超管的 `update/delete` 不再追加本租户条件（可跨租户维护）；`insert` 仍落登录租户（tenant 0）。若后续要求"新建行可选目标租户"或"跨租户写需二次确认"，属新需求。
- 未做：未新增版本号、未建/改 tag 与 Release、未改迁移与库结构（本次零迁移）、未改前端（列表暂不含"租户"列，跨租户行以用户名前缀区分；如需列示租户列属前端后续项）。
- CI：`e2fe50f` 的 main 构建运行 `39111840667`（回执时 in_progress）；此前文档提交运行 `591da29`/`69fbcdf` 的 failure 为既有 P63 预约时序族（已登记待办），与本次制品无关。

## §7 状态

- 第41项线上返修：**修复实现与线上验证完成**，待规划复核。返修沿原七阶段：目标与范围确认完成；定向修复与复测完成；修复验收同步进行中；必要合并（feature→develop→main，`e2fe50f`）与必要交付（UAT 就地换包，无新版本）已执行；交付后同步与结束阶段待规划确认。
- 计数保持：功能 49、46/22/22=90、ADV64/问题 57、P 核销集合空、P62 延期/OFF、P65 待排期；不新建 Bug 编号。
