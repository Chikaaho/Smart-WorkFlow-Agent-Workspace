# department-query-filtering：部门名称/状态条件查询闭环（M01-F01-04 / I31）

## 当前状态

**COMPLETED ✅（2026-08-18）**：D102 方向内实现（执行层自主拆分后端/前端两个 Step，严格串行、2G 内存上限、互斥证据齐全）→ D103 首轮验收仅终态同步 FAILED（memory/handoff.md 中下部旧口径），执行层全文修正（`receipts/post-d103-sync-correction.md`）→ D103 复验 + D104 最终验收 **PASSED**。M01-F01-04 🟦→✅，I31 关闭。方向归档 `product/department-query-filtering/passed/direction-department-query-filtering.md`，最终复验 `receipts/planning-final-review-d104.md`。

## 契约（执行层裁定，前后端一致）

- `GET /system/dept/tree` 扩展可选参数：`name`（trim 后空白等价未填写，非空=包含匹配 LIKE %name%）、`status`（仅 `0=正常`/`1=停用`，非法值显式 PARAM_ERROR 400，**不静默退化全量**）。无参数调用与旧行为完全一致（部门选择器等既有调用方零感知）。
- 结果语义：直接命中集合 + 定位所需的祖先路径；祖先经同一 MyBatis-Plus lambdaQuery 通道上溯（租户/逻辑删除/可见范围拦截器自然生效，不绕权）；去重；按 `sort` 升序（nullsLast）、同 sort 按 `id` 升序稳定排序；无匹配返回空数组。返回结构保持 flat `R<List<SysDept>>` 不变。
- 前端：DeptList 名称输入 + 状态下拉（全部/正常/停用）+ 查询/重置 + Enter 查询 + 加载态；**筛选空态**（无匹配 + 重置按钮）与**无筛选空态**（新建部门入口）区分；状态值严格复用 `SYS_DEPT_STATUS`（0/1）。Mock `/api/system/dept/tree` 与真实接口语义对齐（筛选/祖先/去重/排序一致，非法 status 模拟 400）。

## 实现闭环

- 后端：`DeptQuery`（查询 DTO）、`SysDeptService.listTree(DeptQuery)` 重载（无参 `listTree()` 保留）、`DeptController` `@RequestParam(required=false)` 透传、`SysDeptServiceImpl` 祖先补全（层级 IN 批量查询 + visited 环保护 + LinkedHashMap 去重）。
- 前端：`dept.ts` `listDeptTree(params?: DeptQuery)`、`types/dept.ts` `DeptQuery`、`DeptList.vue` 筛选区与双空态、`handlers.ts` Mock 对齐、`seeds.ts` 补停用部门种子（财务部 id=7）。

## 验证证据

- 后端：`MAVEN_OPTS="-Xmx2g" mvn test` BUILD SUCCESS 31/31 模块，**582 tests / 0 failures / 0 errors / 0 skipped**（基线 563 +19：DeptControllerTest +2、SysDeptQueryIntegrationTest +17）。专项覆盖：无条件兼容、名称/状态/组合、空白名称、空结果、非法状态显式报错、深层祖先链、根节点、兄弟分支不混入、共享祖先去重、两租户隔离、跨租户祖先不越权、已删除部门不命中/已删祖先隐藏、受限可见范围通道（SELF 档 + 测试专用 `SysDeptScopedMapper` 白盒证明）。
- 前端：`NODE_OPTIONS=--max-old-space-size=2048` 下 typecheck / lint / test / build 四连退出码全 0，**66 files / 602 tests**（基线 577 +25：api/dept +6、DeptList +10、mock index +9）。
- 全部执行前保留互斥检查证据（ps 无并行构建进程），前后端编译严格串行。
- **Flyway 零迁移、零表结构变化**（sys_dept V1 定义已含所需全部列）。

## 未闭合验证与遗留

- PostgreSQL 运行期迁移验证仍受环境无 PG/Docker 阻塞（非本轮引入，沿用既有环境待办）。
- 筛选生效期间新建/编辑弹窗的上级部门下拉选项仅含当前已加载结果集（选中项本身可见，功能不坏；方向非目标未覆盖，如实披露）。
- 名称包含匹配未转义 `%`/`_`（管理员面向场景，与方向契约一致）。

## 相关链接

- 方向（已归档）：`product/department-query-filtering/passed/direction-department-query-filtering.md`
- 回执：`product/department-query-filtering/receipts/`（completion + planning-review-d103 + post-d103-sync-correction + planning-final-review-d104）
- 前置：[[user-org-association-query]]（D101 零回归，563/0/0 与 66f/577t 基线保持并在其上净增）
