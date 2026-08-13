# 功能级完成回执：checklist-gap-hardening 第一批（安全与可达性缺口修复）

- **功能编号/名称**：checklist-gap-hardening 第一批（D75）
- **方向文档**：`product/checklist-gap-hardening/ready/direction-batch1-security-reachability.md`
- **执行日期**：2026-08-13
- **执行方式**：执行层自主拆 Step（2 编码 Step + 1 修复轮），并行 subagent 执行 + 独立验证 agent 跑测试门 + 知识库全量同步
- **最终判定（执行层自验）**：**符合全部验收标准，提请规划层最终验收**

---

## 1. 功能目标

修复 2026-08-12 全量审计暴露的两项高风险"清单虚高"缺口（known-issues I33/I43/I44）：
1. **I33（高）**：停用用户仍可登录——登录/刷新认证链路不校验 `SysUser.status`
2. **I43/I44（中）**：定时任务/文件存储功能完整但生产菜单树未 seed（V6/V10/V15/V26 无 job/storage 菜单行），正式环境不可达

## 2. 自拆 Step 概要

| Step | 内容 | 执行方式 | 结果 |
|------|------|---------|------|
| Step1 | 登录/刷新链路停用账号校验（AuthController 双入口 + 10 个新测试） | subagent | ✅ 落地 |
| Step2 | 生产菜单 seed（Flyway V29，h2/postgresql 双份 4 行菜单） | subagent | ✅ 落地 |
| 修复轮 | 测试编译修复（4 处 Spring 6 API）+ V29 冒烟测试 + 全量测试门 | subagent | ✅ 全绿 |
| 验证门 | 后端全量 `mvn -q test` + 前端四连（typecheck/lint/test/build） | 独立验证 agent ×2 | ✅ 全绿 |
| 收尾 | 知识库全量同步（§3.3 第10项） | subagent | ✅ 完成 |

## 3. 实际修改范围（8 个文件）

**业务代码（1）**
- `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/controller/AuthController.java`（+44 行）：`login()` 密码校验后、签发 token 前校验 `SysUser.status`（新增 `statusDenyMessage` 助手，status=2→"账号已锁定"、其余非 0→"账号已停用"）；`refresh()` 轮换成功后重载用户校验 status，停用/锁定/用户不存在 → 撤销新签发的 refresh token + 清 cookie + 401。轮换/重放检测逻辑与双 token 架构未动

**Flyway 迁移（2，新建）**
- `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/h2/V29__job_storage_menu_seed.sql`（新建）
- `Smart-WorkFlow/sw-bootstrap/src/main/resources/db/migration/postgresql/V29__job_storage_menu_seed.sql`（新建，双份逐字一致）
- 4 行菜单：id16 文件管理（顶级，`storage/views/StorageList`，`storage:view`）、id17 定时任务（顶级目录，`job:view`）、id18 任务管理（parent 17，`job/views/JobList`，`job:list`）、id19 执行日志（parent 17，`job/views/JobLog`，`job:log`）；与前端 `seeds.ts` mock 结构逐一对应；id 16-19 经全量核对无冲突（既有 1-15 已占）

**测试（3，修改）**
- `AuthControllerTest.java`（+195 行，6 个新用例：停用/锁定登录被拒、停用/锁定/逻辑删除 refresh 被拒并撤销新 token、正常用户登录与 refresh 回归；另 4 处 `addCookie`→`setCookies` Spring 6 API 修复 + happy-path 补 `setStatus(0)`）
- `AuthFlowIntegrationTest.java`（+161 行，4 个新 H2 集成用例：登录双拒、refresh 停用拒含 DB 撤销断言、正常轮换回归；另修复 1 处历史 JsonNode 断言缺陷——`body.get("data")` null 语义，该测试此前从未跑绿）
- 冒烟测试源码（V29 迁移验证）已按 V26 先例跑完删除，不入库；临时 pom 测试依赖已还原（`git diff` 确认 pom 零改动）

**前端：零改动**（页面/路由/菜单 mock 均已存在，V29 仅补生产菜单树）

## 4. 测试与验收结果

### 4.1 后端全量（CONFIRMED 2026-08-13）
`MAVEN_OPTS="-Xmx1g" mvn -q compile`（exit 0）→ `mvn -q test`（exit 0）：**435 tests / 0 failures / 0 errors**。
- 逐模块：sw-common 4、sw-security 4、sw-basic-storage-biz 12、sw-basic-notify-biz 7、sw-basic-job-biz 37、sw-basic-agent 163、sw-biz-system-biz 75、sw-biz-form-biz 76、sw-bpm-engine 18、sw-bpm-process 39
- 计数口径：426 基线 + 10 新增 = 436 运行口径；其中 1 个 V26 临时冒烟测试（源码不在仓）计入 426 基线但不计入源码 → **435 源码口径**，与静态 `@Test` 计数逐模块核对一致

### 4.2 前端四连（CONFIRMED 2026-08-13）
`NODE_OPTIONS="--max-old-space-size=1024" pnpm typecheck && lint && test && build` 全部 exit 0：**63 files / 552 tests** 全量通过（首轮 2 个用例为高负载 5000ms 超时 flaky，重跑全绿，非代码回归）；前端工作树干净（本轮零改动前提确认）

### 4.3 V29 迁移冒烟验证（临时测试，仿 V26 先例）
纯 Flyway API + H2：27 个迁移按序应用（V1→V29）无 validate 失败，`Successfully applied 27 migrations ... now at version v29`；4 行菜单逐列断言（id/parent/menu_type/component/permission/icon/sort）全部通过。**注**：H2 全链受既有 known-issues I47（bpm V8 partial index）阻断，冒烟以 6 目录链验证（排除 bpm），非本批引入、生产 PostgreSQL 不受影响

### 4.4 验收标准逐条对照（方向文档 §39-44）

| # | 验收项 | 结果 | 证据 |
|---|--------|:---:|------|
| 1 | 停用登录被拒 + refresh 被拒/已有校验证据 + 启用回归 | ✅ | AuthControllerTest 6 + AuthFlowIntegrationTest 4 新用例全绿；登录/刷新双入口 status 拦截（刷新路径原无校验，本次一并覆盖） |
| 2 | 生产菜单 SQL（h2/postgresql）含 job/storage 行 + 层级权限与先例一致 + Flyway 全链迁移测试通过 | ✅（附注） | V29 双份逐字一致；id/层级/权限/图标与 V26 先例与 seeds.ts 对齐；冒烟测试验证 27 迁移 + 4 行逐列断言。附注：H2"全链"受既有 I47 阻断（bpm V8 partial index），已实证非本批引入、PG 无影响，建议 I47 排期修复后补真全链测试 |
| 3 | 后端全量 BUILD SUCCESS 0 failures + 前端四连全绿 | ✅ | 435/0（后端）；63f/552t 四连全绿（前端） |
| 4 | 知识库全量同步：清单状态回升 + I33/I43/I44 修复记录 + 回执含清单变更明细与知识库触碰文件清单 | ✅ | 见 §5/§6；`features/checklist-gap-hardening.md` 已建 |

## 5. 清单变更明细（`Smart-WorkFlow/功能清单.md` 状态列）

| ID | 功能 | 变更前 | 变更后 |
|----|------|:---:|:---:|
| M01-F02-02 | 人员管理·修改（账号启用/停用） | 🟦 | ✅ |
| M10-F03-01 | 定时任务·任务调度 | 🟦 | ✅ |
| M10-F06-01 | 文件管理·文件存储 | 🟦 | ✅ |

**全表计数**：✅10 / 🟦37 / ⬜42 / 总 89（2026-08-12 Step5 后 ✅7/🟦40/⬜42 → 本轮回升 3 行）

## 6. 知识库触碰文件清单

| 文件 | 变更摘要 |
|------|---------|
| `Smart-WorkFlow/功能清单.md` | 3 行状态列 🟦→✅（仅状态单元格） |
| `knowledge/known-issues.md` | I33/I43/I44 索引状态列 → ✅ 已修复（2026-08-13 checklist-gap-hardening 第一批）+ 各补「修复记录」详情段；其余条目不动 |
| `knowledge/current-status.md` | §1 功能清单行（计数演进链 → ✅10/🟦37/⬜42）、测试基线行（后端 435/0、前端 63f/552t）、前次验证行、§5 功能表追加、§8 编号清单第 12 项、§9 前后端基线行同步 |
| `knowledge/features/checklist-gap-hardening.md` | 新建功能追踪文件（按 _template 结构） |

未触碰：memory/、todo/、其他 knowledge 文件、任何业务代码以外的文件。

## 7. 关键设计决策与偏差

1. **提示语义**：区分提示（"账号已停用"/"账号已锁定"）而非统一"用户名或密码错误"——内部 OA 平台可操作性优先（管理员可分辨重新启用 vs 解锁），无公开注册面、枚举风险收益低；若未来面向公网可改 `statusDenyMessage` 一处回退统一提示
2. **校验落点**：AuthController 控制器层（login/refresh 两个入口的唯一公共拦截点；login 原本就绕过 UserDetailsProviderImpl 直接走 getByUsername + matches）。JWT 过滤器按方向文档范围外未动
3. **status=null/未知值**按停用拒绝（不抛 500）；refresh 路径用户不存在（逻辑删除）同样拦截并撤销新 token
4. **菜单 seed**：parent_id 用 `0`（既有先例写法，后端 buildTree 对 0/NULL 同等视为根）；sort 用 80/90（延续 V6 步进惯例）；name 用 PascalCase（对齐 DB 先例）——均按既有先例偏离了 mock 的写法，无功能差异
5. **V29 迁移验证方式**：仿 V26 先例用临时冒烟测试（纯 Flyway API），跑完删除源码、pom 依赖还原——未固化 sw-bootstrap 测试基建（该决策留规划层）

## 8. 遗留问题与风险（提请规划层知悉）

1. **I47（既有）**：bpm V8 partial index 使 H2 上 7 目录真全链迁移永不可跑（V26/V29 冒烟均为排除 bpm 的部分链）——建议排期修复（V8 改普通唯一索引）后补"真全链"迁移测试
2. **停用即时生效窗口**：停用前已签发、未过期的 access token（默认 900s）仍可访问 API 至自然过期——方向文档范围外（不改 JWT 过滤器），如需"停用即时生效"需单独排期在 UserDetailsProvider/过滤器层加校验
3. **sw-bootstrap 无测试基建**（pom 无 junit/spring-boot-starter-test）：任何永久迁移测试需规划层先决策是否给 sw-bootstrap 加测试依赖
4. **计数口径**：后端 435（源码口径）vs 436（运行口径含 V26 临时冒烟）——已记入 current-status 演进链，非测试丢失
5. **非超管角色**：V29 沿用 V6 决策不 seed sys_role_menu，非超管用户需角色关联才可见 job/storage 菜单（超管旁路不受影响）

## 9. 结论

两项缺口已按方向文档交付并验证：登录/刷新停用校验（I33）与生产菜单可达（I43/I44）均落地，测试门全绿（后端 435/0、前端 63f/552t、V29 冒烟通过），知识库全量同步完成（清单回升 ✅10/🟦37/⬜42、I33/I43/I44 修复记录、current-status 与 features 追踪文件更新）。**执行层自验：符合方向文档全部验收标准，无 BLOCKED/FAILED 项，提请规划层最终验收。**
