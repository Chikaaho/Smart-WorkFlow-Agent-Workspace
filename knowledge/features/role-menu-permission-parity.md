# P1 / M02-F02-01 / M02-F03-01：角色菜单/按钮权限契约一致性收口

| 字段 | 值 |
|------|-----|
| 状态 | **COMPLETED**（D123 规划层最终验收 PASSED + 阶段三终态同步，2026-08-20）；第 26 个已完成功能 |
| 方向 | `product/role-menu-permission-parity/passed/direction-role-menu-permission-parity.md`（已归档 passed/） |
| 前置探索 | `search_fallback/m02-role-menu-button-permission-config.md`（已被 D121 消费） |
| 历史基线 | `product/admin-role-governance/passed/direction-admin-role-governance.md`（I49 关闭） |
| 规划回执 | `product/role-menu-permission-parity/receipts/planning-final-review-d123.md`（D123 最终验收 PASSED） |
| 历史回执 | `receipts/planning-review-d122.md`（D122 终验 FAILED，历史保留）、`receipts/d122-fix-receipt.md`（退回修正）、`receipts/post-d123-terminal-sync.md`（终态同步） |
| 历史回执 | `product/role-menu-permission-parity/receipts/`：step1-backend-regression、step2-frontend-closure、step3b-backend-menu-filter-evidence、step3b-frontend-mock-menu-filter、role-menu-permission-parity-completion、test-receipt、stage3-knowledge-sync |

## 目标

在不重复实现既有 RBAC、也不改变生产权限模型的前提下，补齐普通角色菜单/按钮权限配置在真实 API、前端 Mock、页面交互与自动化证据之间的一致性，使 `M02-F02-01` 与 `M02-F03-01` 达到可验证、可回归的完整闭环。

## 范围与边界

- 同一棵权限树（菜单+按钮，按钮为 `menu_type=2` 节点）、同一组端点（`GET/PUT /system/role/{id}/menus`）、同一前端树控件（RoleList 权限树），不建立第二套按钮授权模型。
- 真实 API 与 Mock 等价：路径/载荷/响应/清空/未知角色/受保护角色/重复保存逐项一致；Mock 保存真实更新内存夹具状态，可被后续读取与回填观察。
- superadmin 以角色 code 判定保持不可修改（前端禁用 + 后端 assertMutable 双层保护）；普通 `admin` 无 code 旁路。
- 非超管授权链完整证据：已授权菜单可见（正面）、撤权后菜单不可达、按钮显隐、接口允许/拒绝、未认证 401，菜单可见与接口可调用分别有证据。
- 租户隔离保持：`sys_role_menu` 按 tenant_id 隔离，`sys_menu` 全局表，唯一约束不变。
- 非目标：不新增 Flyway 迁移、不为既有/未来角色追加默认授权、不改变 V31/V33 授权决策、不扩展 RBAC/用户组消费/数据权限/资源管理；不处理无失败证据的数据卫生与跨请求事务合并问题。
- ~~挂账~~：403 被 `GlobalExceptionHandler` 兜底成 500 → **已修复（I53，2026-08-20）**；角色停用（status=0）时菜单/权限仍按绑定装配 → **已修复（I54，2026-08-20）**。

## 现状证据（2026-08-19，D121）

- 真实 API：`RoleController.java:79-90`（两个端点 + `@PreAuthorize`）、`SysRoleServiceImpl.java:124-152`（listMenuIds/updateMenuIds/assertMutable）——由 admin-role-governance（D96）落地。
- 前端页面：`RoleList.vue` 权限树加载/保存/清空/回填（`getRoleMenus`/`updateRoleMenus`/`getCheckedKeys(true)` 叶子语义/isProtectedRole 禁用）。
- 前端 Mock 修正：`handlers.ts` 新增 `GET/PUT /api/system/role/:id/menus`（真实状态写入 + superadmin 400）；`seeds.ts` id 去重、`dataScope 5→0`、`MOCK_ROLE_MENU_BINDINGS`；Step 3b `/auth/menus` 按会话角色过滤、`/auth/me` 非超管 permissions 同源装配。
- 生产代码与 Flyway 全程零修改（仅新增测试类 + 前端 mock/夹具/页面最小修正，均属方向 §4 范围）。

## D122 退回修正（2026-08-20，见 `receipts/d122-fix-receipt.md`）

- **生产 403 契约**：`GlobalExceptionHandler` 新增 `AuthorizationDeniedException` 分支 → HTTP 403 + body 403（真实生产链路；移除测试专用处理器覆盖；sw-common +spring-security-core 编译期依赖；新增 `GlobalExceptionHandlerTest` 2 用例）。
- **停用角色有效撤权**：`SysMenuServiceImpl.loadMenuIdsByUserId` 与 `UserDetailsProviderImpl.loadPermissions` 对称按 `sys_role.status=1` 过滤（AuthMenus A4/A9 改为撤权生效断言）。
- **Mock 双角色身份**：超管会话 username=superadmin/roles=['superadmin']；新增普通 `MOCK_SESSION_DATA_ADMIN`（admin 非超管、权限按 admin 绑定装配）；登录按 username 三会话映射（auth-session.spec +3 用例）。
- **权威问题注册**：I53（403→500 契约失真）、I54（停用角色仍装配权限）登记 knowledge/known-issues.md + memory/issues.md。
- 生产代码改动 4 文件（均在方向 §4 影响范围），零 Flyway。

## 测试结果

- 后端：项目级全量 **674 / 0 / 0 / 0**（112 surefire 报告文件；D121 670 +4：GlobalExceptionHandlerTest 2 + AuthMenus A4 撤权 2）；`MAVEN_OPTS="-Xmx2g"`。
- 前端：**73 spec files / 681 tests / 0 failures** 四连全绿（typecheck/lint/test/build，`NODE_OPTIONS="--max-old-space-size=2048"`；D121 73f/678t +3：auth-session.spec 双角色身份）。
- 新增后端测试：RoleMenusContractAndSecurityTest（13 请求级：契约/安全/租户，**403 走真实生产链路**）、AuthMenusContractAndSecurityTest（12：非超管正面菜单树/VO 契约/绑定删除空树/**角色停用撤权生效**/无绑定空树/超管对照/未认证/租户隔离）、GlobalExceptionHandlerTest（2：403 分支 + 500 兜底）。
- 前后端编译互斥：两 Step 各先行 ps 检查无对侧进程。
- 既有回归：RoleControllerTest、AuthMeControllerTest、AuthFlowIntegrationTest、FlywayFullChainH2Test（9 用例）等全部通过。

## 终态（D123 规划层最终验收 PASSED + 阶段三终态同步 COMPLETED）

- 清单 `M02-F02-01` / `M02-F03-01` 🟦→✅（正式确认），终态 **✅23 / 🟦27 / ⬜40** 共 90 行；无关行零漂移（M02-F01-01 角色管理保持 🟦——角色-用户/用户组绑定已完成但流程消费端未接；M02-F04-01 保持 ✅；M01-F04-01 保持 🟦）。
- **P1 正式核销**（2026-08-20，D123 规划层最终验收 PASSED + 终态同步）：全部子项 I31（department-query-filtering）/I36（user-group-membership）/M02-F02/F03（本方向）已闭合。
- 测试基线：后端 674/0/0/0、前端 73f/681t；已完成功能 **26**（本方向为第 26 个，COMPLETED）。
- 交叉引用：I49（V29 未 seed sys_role_menu）已由 admin-role-governance D96 关闭；本方向在其基础上完成角色菜单/按钮权限契约一致性收口；I53/I54 本方向修复并登记；V31/V33 授权决策未变。
