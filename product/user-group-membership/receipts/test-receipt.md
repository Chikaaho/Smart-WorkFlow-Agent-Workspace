# user-group-membership 测试回执（执行层）

> 全部命令在仓库根 `/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow`（后端）与 `/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Web`（前端）执行；2G 上限、前后端严格串行。

## 一、命令与退出码

| 阶段 | 命令 | 退出码 | 结果 |
|------|------|:---:|------|
| 后端模块编译 | `MAVEN_OPTS="-Xmx2g" mvn -pl sw-biz/sw-biz-system/sw-biz-system-biz -am compile -DskipTests` | 0 | ✅ |
| 后端专项测试 | `MAVEN_OPTS="-Xmx2g" mvn -pl sw-biz/sw-biz-system/sw-biz-system-biz test -Dtest='UserGroupControllerTest,SysUserGroupServiceTest,UserGroupDataScopeIntegrationTest'` | 0 | ✅ 34/0/0/0 |
| Flyway H2 全链 | `MAVEN_OPTS="-Xmx2g" mvn -pl sw-bootstrap test -Dtest='FlywayFullChainH2Test'` | 0 | ✅ 13/0/0/0 |
| Flyway PG 全链 | `MAVEN_OPTS="-Xmx2g" mvn -pl sw-bootstrap test -Dtest='FlywayFullChainPostgresTest,FlywayFullChainH2Test,PgV33VerificationTest'` | 0 | ✅ 22/0/0/0（PG 9 + H2 13） |
| 后端项目级全量 | `MAVEN_OPTS="-Xmx2g" mvn test` | 0 | ✅ **1270/0/0/0** BUILD SUCCESS |
| 前端 typecheck | `NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck` | 0 | ✅ |
| 前端 lint | `NODE_OPTIONS="--max-old-space-size=2048" pnpm lint`（含 lint:fix 先行） | 0 | ✅ 0 问题 |
| 前端专项测试 | `NODE_OPTIONS="--max-old-space-size=2048" pnpm vitest run src/modules/system/views/UserGroupList.spec.ts src/modules/system/api/userGroup.spec.ts` | 0 | ✅ 16/0/0 |
| 前端全量测试 | `NODE_OPTIONS="--max-old-space-size=2048" pnpm test` | 0 | ✅ **71 files / 644 tests / 0 failures** |
| 前端 build | `NODE_OPTIONS="--max-old-space-size=2048" pnpm build` | 0 | ✅（`✓ built in 986ms`；仅 node_modules 既有 @vueuse PURE 注释警告，非错误） |

### 补证轮（D113 六项未过标准，2026-08-19）

| 阶段 | 命令 | 退出码 | 结果 |
|------|------|:---:|------|
| 标准4 集成补证 | `MAVEN_OPTS="-Xmx2g" mvn -pl sw-biz/sw-biz-system/sw-biz-system-biz test -Dtest='UserGroupDataScopeIntegrationTest'` | 0 | ✅ 12/0/0/0（7→12，+5 边界） |
| 标准6 授权测试 | `MAVEN_OPTS="-Xmx2g" mvn -pl sw-biz/sw-biz-system/sw-biz-system-biz test -Dtest='UserGroupAuthorizationTest'` | 0 | ✅ 6/0/0/0（真实请求链 401/403/成功） |
| 标准9 后端全量复算 | `MAVEN_OPTS="-Xmx2g" mvn test`（输出 `/tmp/regression-d113-supplement.log`） | 0 | ✅ 类级行 646 / 模块行 646 / **surefire XML 聚合 647**（109 文件），0/0/0 |
| 标准8 前端全量 | `NODE_OPTIONS="--max-old-space-size=2048" pnpm test` | 0 | ✅ **71 files / 646 tests / 0 failures** |
| 标准8/10 前端四连 | `pnpm typecheck` / `pnpm lint`（lint:fix 先行）/ `pnpm build` | 0 | ✅ 全绿（2G 上限，前后端串行） |
| 标准10 互斥快照 | `pgrep -fl "mvn\|vite\|vitest\|eslint\|vue-tsc\|tsc"` + `pgrep -fl "node" \| grep -iE "vite\|vitest\|eslint\|vue-tsc\|pnpm\|npm-cli"` | - | ✅ 后端前 0 → 后端运行中仅 mvn（无前端工具）→ 后端后 0 → 才启动前端；全工具族覆盖，pgrep 排除自身与无关应用 node |

**互斥检查（D114 补证后全工具族口径）**：快照命令覆盖 `mvn|vite|vitest|eslint|vue-tsc|tsc|node`（pnpm/npm 触发的 node 编译进程含内）；`pgrep -fl` 排除匹配自身的 grep/pgrep；系统无关 node（ChatGPT 等应用）按「编译/测试类」关键字精确区分。后端全量回归完成后才开始前端 typecheck/lint/test/build；任一时刻仅一个编译工具运行（本机 1.6G 物理内存约束）。

### 二轮补证（D114 标准 9/10/11，2026-08-19）

- **标准9 权威计数**：`mvn test` 输出类级行（108 行，含 `-- in`）求和 = **646**；模块汇总行（11 行）求和 = **646**；surefire XML 聚合（109 个 XML）**= 647**；模块小计 sw-framework 22 + sw-basic 262 + sw-biz 340 + sw-bootstrap 23 = **647**。**项目级总数 = 647/0/0/0**（1292 系类级+模块级重复累计，已弃用）。
- **标准10 快照**：`pgrep -fl` 全工具族 0 编译进程（前后端串行时间线见上）。

## 二、测试计数明细

### 后端新增专项（39，补证后）
- `SysUserGroupServiceTest`：15（标识唯一/不可变/默认状态/成员校验原子性/替换/追加去重/移除/清空/删除连动/事务注解/零隐式授权构造器契约/分页与候选委托）
- `UserGroupControllerTest`：12（分页/详情/创建/更新/启停/删除/成员读写/候选/权限注解契约）
- `UserGroupDataScopeIntegrationTest`：**12**（首轮 7 + 补证 5：锁定/逻辑删除/不存在/跨租户 ID 绑定拒绝+原子性、停用组保留成员+重启用）
- `UserGroupAuthorizationTest`：**6**（补证：未认证 401、缺权 403、查看成功/管理 403、双权限成功、仅管理/查看 403、成员端点权限分离）

### Flyway（H2 13 + PG 9 = 22，均含 V34）
- H2：全链 34 迁移计数、applied 34、validate、V31 冲突哨兵、V33 产物、**V33→V34 升级链**、**V34 逻辑删除唯一语义（同 code 双 deleted=0 冲突 23505、deleted=1 历史共存、跨租户共存、成员唯一）**、BPM 绑定语义回归
- PG：全链 34 迁移计数、applied 34、V32→V34 升级链、V13 checksum 守卫、逻辑删除唯一语义正反例

### 测试计数轨迹（D114 统一口径）
- 后端：600（旧基线）→ 补证后权威计数 **647/0/0/0**（surefire XML 聚合，109 个 XML；类级行求和 646 与模块小计 647 一致，差 1 为嵌套类合并计法；1292 系类级+模块级重复累计，已弃用）
- 前端：69f/628t（基线）→ **71f/646t**（+2 spec / +18 用例：userGroup API 10 + UserGroupList 8，含失效成员展示与权限行为覆盖；专项 18 与总量增量 18 自洽）

## 三、未运行项（环境边界，与 I52/D101 同口径）

- **PG 真实库（127.0.0.1）运行期验证**：未运行（环境待办保留；本次以 zonky embedded-postgres 17.5 真实二进制全链 34 条 migrate+validate 覆盖）
- **进程快照/2G 峰值实测**：未截图（既有环境待办，与 D101 相同表述）
- 前端 dev 服务/manual E2E：未启动（以 vitest 组件测试 + typecheck/lint/build 覆盖）

## 四、产物清单

- 迁移：`sw-bootstrap/src/main/resources/db/migration/{h2,postgresql}/V34__sys_user_group.sql`（逐字一致）
- 后端：`sw-biz-system-biz/.../entity/{SysUserGroup,SysUserGroupMember}.java`、`mapper/{SysUserGroupMapper,SysUserGroupMemberMapper}.java`、`service/{SysUserGroupService,SysUserGroupServiceImpl}.java`、`controller/UserGroupController.java`
- 前端：`src/modules/system/views/UserGroupList.vue`（+spec）、`src/modules/system/api/userGroup.ts`（+spec）、`src/modules/system/types/userGroup.ts`、`src/foundation/mock/{seeds,handlers}.ts`（用户组种子+9 端点+菜单/权限）
- 测试 schema：`sw-biz-system-biz/src/test/resources/db/schema-datascope-h2.sql`（追加用户组表）
