# 统一完成回执：部门名称/状态条件查询闭环（D102 / M01-F01-04 / I31）

> **执行层产出**：读取 `product/department-query-filtering/ready/direction-department-query-filtering.md` 后自主拆分后端/前端两个 Step 完成闭环。本回执为功能级自验与知识同步的统一完成回执，供规划层 D102 最终验收。
> 完成日期：2026-08-18

---

## 1. 执行拆分与契约裁定

| Step | 会话 | 内容 | 证据 |
|------|------|------|------|
| B1 | 后端（先行） | `GET /system/dept/tree` 扩展 name/status 条件 + 祖先补全树形结果 + 专项测试 | 582/0/0，commit `3871ddf` |
| F1 | 前端（B1 全绿后） | API 显式传参、DeptList 筛选/重置/双空态、Mock 对齐 + 专项测试 | 66f/602t 四连全绿，commit `26a0d99` + `4207c00` |
| S3 | 工作区根 | §3.3 第10项知识库全量同步 + 统一完成回执 | 本文件 |

**契约裁定（§7 授权执行层自定，前后端共享）**：`name`（trim 后空白等价未填写，非空=包含匹配）、`status`（仅 0=正常/1=停用；非法值显式 400 PARAM_ERROR，不静默退化全量）、无条件调用与旧行为完全一致；结果=直接命中集合 + 授权范围内必要祖先，去重，`sort` 升序（nullsLast）同 sort 按 `id` 升序；返回结构保持 flat `R<List<SysDept>>` 不变。

## 2. 实际修改文件清单

### 后端（`Smart-WorkFlow/` 仓库，commit `3871ddf`，未 push）

| 文件 | 修改类型 | 摘要 |
|------|:---:|------|
| `sw-biz/.../controller/DeptController.java` | 修改 | `/tree` 扩展 `@RequestParam(required=false)` name/status，组装 DeptQuery 透传 |
| `sw-biz/.../service/SysDeptService.java` | 修改 | 新增 `listTree(DeptQuery)` 重载（无参 `listTree()` 保留） |
| `sw-biz/.../service/impl/SysDeptServiceImpl.java` | 修改 | 筛选 + 祖先补全实现（层级 IN 批量查询、visited 环保护、LinkedHashMap 去重、sort+id 稳定排序） |
| `sw-biz/.../service/DeptQuery.java` | 新增 | 查询 DTO（name/status） |
| `sw-biz/.../controller/DeptControllerTest.java` | 修改 | 签名同步 + 2 个透传用例（ArgumentCaptor） |
| `sw-biz/.../deptquery/SysDeptQueryIntegrationTest.java` | 新增 | 17 用例集成测试（H2） |
| `sw-biz/.../mapper/SysDeptScopedMapper.java` | 新增 | 测试专用受限范围 Mapper（SELF 档数据范围通道白盒证明） |
| `功能清单.md` | 修改 | M01-F01-04 🟦→✅（知识同步阶段） |

### 前端（`Smart-WorkFlow-Web/` 仓库，commit `26a0d99` + `4207c00`，未 push）

| 文件 | 修改类型 | 摘要 |
|------|:---:|------|
| `src/modules/system/types/dept.ts` | 修改 | 新增 `DeptQuery`（name?: string; status?: number） |
| `src/modules/system/api/dept.ts` | 修改 | `listDeptTree(params?: DeptQuery)` 显式传参（trim 空白 name 省略，无参兼容） |
| `src/modules/system/views/DeptList.vue` | 修改 | 筛选区（名称输入+状态下拉+查询/重置+Enter）、加载态、筛选空态与无筛选空态区分 |
| `src/foundation/mock/handlers.ts` | 修改 | `/api/system/dept/tree` 实现筛选+祖先+去重+sort+id 稳定排序+非法 status 400 |
| `src/foundation/mock/seeds.ts` | 修改 | 新增停用部门「财务部」(id=7, status=1) 支撑 status=1 正向测试 |
| `src/modules/system/api/dept.spec.ts` | 修改 | +6 断言（无参/name/status/组合/trim/空白） |
| `src/modules/system/views/DeptList.spec.ts` | 修改 | +10（筛选交互/空态/加载态） |
| `src/foundation/mock/index.spec.ts` | 修改 | +9（mock 筛选语义块）→ 后随 4207c00 修正 2 条排序断言 |

## 3. 筛选结果集合与树形语义（专项测试实证）

| 边界 | 测试 | 实测结果 |
|------|------|----------|
| 无条件兼容 | `noCondition_returnsFullTenantTree_sameAsLegacy` | 与无参 `listTree()` 逐位一致；仅租户 1 未删除数据，sort 升序 |
| 名称包含 | `nameFilter_containsMatch_returnsHitsWithAncestors` | "研发"→[总部,研发部]；"组"→[1,2,3,4]（命中+祖先） |
| 空结果 | `nameFilter_noMatch_returnsEmpty` | 空数组不报错 |
| 空白名称 | `nameFilter_blankName_equalsNoCondition` | "   " 与 "" 均等于全量 |
| 状态 0/1 | `statusFilter_normal/disabled` | 0→仅正常；1→停用+祖先 |
| 组合条件 | `combinedNameAndStatus_applyBoth` | AND 语义（"研发"+1 空） |
| 祖先链 | `deepHit_returnsCompleteAncestorChain` | 后端组→[1,2,3] 完整链 |
| 无关分支 | `siblingUnhitBranch_notMixedIn` | 未命中兄弟/停用分支不混入 |
| 去重 | `sharedAncestor_deduplicated` | distinct 计数==size |
| 非法状态 | `illegalStatus_rejectedWithParamError_notFullData` | 2/-1 → 400，且后续合法调用无污染 |
| 两租户 | `tenantIsolation_sameNameDeptNotVisibleAcrossTenants` | 租户1→[1,2]；租户2→[100,101] |
| 跨租户祖先 | `crossTenantAncestor_notLeaked` | 祖先指向他租户 → 链截断，只返回自身 |
| 逻辑删除 | `logicDeletedDept_notHitAndDeletedAncestorHidden` | 已删行不命中；已删祖先不出现 |
| 受限范围 | `scopedChannel_selfScope_restrictsDeptQuery` | SELF 档下他人部门/他租户/已删三层约束同通道生效 |
| CRUD 回归 | `crud_regression` | 增/改/删后树形行为正常 |

## 4. 隔离边界与兼容性

- **租户/逻辑删除/可见范围**：祖先补全与筛选全程走 MyBatis-Plus lambdaQuery 通道（SQL 日志实证 `AND deleted = 0 AND tenant_id = 1`），无裸 SQL 旁路；`SysDeptScopedMapper`（SELF 档）证明若声明受限范围，同一通道会被数据范围拦截——不扩大任何既有可见范围。
- **调用方兼容**：无参调用短路到原 `listTree()`，同一查询路径/SQL/排序；部门选择器等既有调用方零感知（DeptControllerTest 既有 6 用例全部保留通过）。
- **状态契约**：严格 `0=正常/1=停用`（SysDept.status 注释与前端 `SYS_DEPT_STATUS` 常量双向一致），未套用角色/岗位的相反语义。
- **D101 零回归**：未触碰用户/岗位/角色关联代码；项目级 563 → 582 全部通过。

## 5. 测试门证据（2G 上限、严格串行、互斥检查）

### 后端（`MAVEN_OPTS="-Xmx2g"`）
- 互斥检查：每次构建前 `ps aux | grep -E "mvn|java|pnpm|npm|vite" | grep -v grep` 均无匹配进程（共 3 次）。
- 模块级先行：`-pl sw-biz/sw-biz-system/sw-biz-system-biz -am test -Dtest=DeptControllerTest,SysDeptQueryIntegrationTest` → **8/8 + 17/17**，0 failures。
- 项目级全量：`MAVEN_OPTS="-Xmx2g" mvn test` → **BUILD SUCCESS，退出码 0，31/31 模块**，surefire 报告 **582 tests / 0 failures / 0 errors / 0 skipped**（基线 563 +19）。

### 前端（`NODE_OPTIONS=--max-old-space-size=2048`）
- 互斥检查：六次执行前均 `ps aux | grep -E "mvn|java|pnpm|npm|vite" | grep -v grep` 无匹配进程。
- 四连：`pnpm vitest run`（**66 files / 602 tests**，退出 0）→ `pnpm typecheck`（0）→ `pnpm lint`（0，0 errors/0 warnings）→ `pnpm build`（0；`@vueuse/core INVALID_ANNOTATION` 为既有第三方警告）。终态 vitest 复跑 602/602 确认。
- 前后端编译严格串行：后端全量通过后前端才启动；主会话对齐修正（`4207c00`）前亦保留互斥证据。

## 6. 偏差与披露

1. **Mock 排序对齐修正（`4207c00`）**：前端代理初始 Mock 仅按 sort 稳定排序，与后端 `sort+id` 二级排序存在平序差异；执行层核实后端实现后修正 Mock 比较器并同步 2 条 spec 断言，四连复跑全绿。非偏差，属 Mock 与真实接口一致性收口。
2. **筛选生效期间弹窗上级部门下拉**：`parentDeptOptions` 基于当前已加载结果集，筛选时仅含当前结果（选中项本身可见，功能不坏）；方向非目标未覆盖，如实披露。
3. **名称包含匹配未转义 `%`/`_`**：管理员面向场景，与契约"面向管理员的包含匹配"一致，披露不处理。
4. **测试专用 `SysDeptScopedMapper`**：生产 `SysDeptMapper` 无 `@DataScope` 标注（部门树既有可见边界=租户+逻辑删除）；该 Mapper 仅用于证明受限范围声明时同通道被拦截，不改变生产行为（类注释已说明）。
5. **current-status 历史欠账修复**（D102 同步时发现并修正，非本轮引入）：§5 表缺 admin-role-governance / user-org-association-query 两行（D96/D101 轮"顶部更新、中部残留"）、§9 后端 551 与 §9 前端 576 未同步 D101 的 563/577、§8 计数与列表不符。已按 §3.3 第10项"全文当前状态"口径补齐，改动全部体现在 git diff 中可复核。
6. **分支注记**：后端/前端仓库当前均在 develop 分支（会话快照显示 main，为工作区根仓库分支），提交均落在 develop，未 push。

## 7. 风险

| 风险 | 等级 | 说明 |
|------|:---:|------|
| PG 运行期验证 | 低 | 环境无 PG/Docker，部门查询 PG 运行期验证沿用既有环境待办（非本轮引入） |
| 同 sort 平序语义 | 低 | 后端 sort+id 二级排序已确定性；旧数据若大量同 sort，顺序按 id 而非历史插入序（与"排序稳定"契约一致） |
| 性能 | 低 | 祖先补全按层级 IN 批量查询（≤部门层级数轮），规模场景与既有 DeptScopeProviderImpl 决策一致 |

## 8. 验收标准逐项对照（方向 §6）

1. ✅ 无条件查询与现状兼容，CRUD/选择器无回归（`noCondition_returnsFullTenantTree_sameAsLegacy` + DeptControllerTest 既有 6 用例）
2. ✅ 名称/状态/组合、空白名称、正常/停用、空结果、非法状态均有明确行为；非法状态 400 不返回全量
3. ✅ 结果只含命中+必要祖先，无无关分支，层级与排序稳定，无重复（§3 逐项实证）
4. ✅ 祖先补全遵守租户/逻辑删除/可见范围：两租户、已删除部门、受限范围（SELF 档）专项证明不越界
5. ✅ 前端名称/状态/查询/重置/加载/空态完整；状态严格 0/1；Mock 与真实接口一致（含 4207c00 排序对齐）
6. ✅ 后端项目级 582/0/0/0（≥563）、前端 66f/602t 四连全绿（≥577）；专项证据覆盖名称/状态/组合/祖先/空结果/非法状态/隔离边界
7. ✅ 零 Flyway、零表结构变化；D101 人员关联/组合查询/超管保护/数据权限回归全过
8. ✅ 全部构建 2G 上限、前后端严格串行，互斥检查证据（ps 输出）与命令/退出码/计数齐备
9. ✅ 知识库全量同步完成（见 §9），无关清单行零漂移（git diff 仅 1 行清单变更）

## 9. 知识同步清单（§3.3 第10项）

| 文件 | 变更 |
|------|------|
| `Smart-WorkFlow/功能清单.md` | M01-F01-04 🟦→✅（唯一行变更，✅16/🟦33/⬜41 共 90 行） |
| `knowledge/current-status.md` | §1 概览/最近完成（D102）、§4 进行中、§5 已完成功能（补录 2 行欠账 + 新增 D102 行，22 个）、§8 优先事项（22 项 + 候选池 I31 移除）、§9 测试基线（582/66f602t + 演进补全 D101） |
| `knowledge/features/department-query-filtering.md` | 新建（功能追踪终态） |
| `knowledge/known-issues.md` | I31 表行 + 章节关闭（含修复记录）；无其他编号变更 |
| `knowledge/session-handoff.md` | §2 进行中（D102 待验收）、§3 最终状态、§10 候选池（I31 移除）、§11 风险表（I31 已关闭行） |
| `todo/requirement-pool.md` | P1 状态追加「I31 已由 department-query-filtering 关闭（2026-08-18，D102）」 |
| `memory/state.md` / `memory/handoff.md` | 摘要同步（D102：582/66f602t/✅16🟦33⬜41/22 个功能/下一动作=等待规划层验收） |

**无关行零漂移证明**：功能清单 git diff 仅 1 处变更（M01-F01-04）；known-issues 仅 I31 编号被触碰（表行 + 章节）；其余编号状态无变化。

## 10. 遗留（非阻塞）

- 规划层 D102 最终验收（本回执为输入）。
- PG 运行期验证、互斥快照等既有环境待办（沿用 user-org-association-query 口径）。
- P1 剩余项：I36 用户组绑定、M02-F02/F03 权限配置入口（待排期）。
