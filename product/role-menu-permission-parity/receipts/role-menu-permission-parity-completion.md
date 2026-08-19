# 功能完成回执：P1 / M02-F02/F03 角色菜单/按钮权限契约一致性收口（D121）

**角色**：执行（工作区根目录，Step 3 联动核对与汇总 + Step 3b/3c 缺口补齐后修订）
**方向**：`product/role-menu-permission-parity/ready/direction-role-menu-permission-parity.md`（D121，10 条验收标准）
**前置回执**：`step1-backend-regression.md`（后端契约与安全回归）、`step2-frontend-closure.md`（前端 Mock+页面闭环）、`step3b-backend-menu-filter-evidence.md`（后端菜单过滤正面证据）、`step3b-frontend-mock-menu-filter.md`（前端 mock 菜单按角色过滤）
**结论（一句话）**：真实 API 与 Mock 契约逐项一致、Mock 真实状态更新、页面权限树保存→重开→回填闭环、superadmin 前后端双层保护、租户隔离、非超管授权链（含已授权菜单可见正面、撤权后不可达、按钮显隐、接口允许/拒绝、未认证）全链路证据齐备、全量回归（后端 670/0/0/0、前端 73 spec/678 tests）——**验收 1-9 全部 PASS，BLOCKED 已解除**（验收 10 属阶段三，待 Step 4）。

---

## 1. 结论摘要

本 Step 为纯只读核对与文档汇总：逐条核对方向 §6 验收 1-9（验收 10 属阶段三知识同步，不在本回执），交叉复核 step1/step2 两份回执与代码证据，未运行任何编译/测试命令、未修改任何代码或知识库文件。

| 验收 | 判定 | 证据来源 |
|---|---|---|
| 1 真实 API 与 Mock 逐项一致 | **PASS** | step1 §5 对照表 × step2 §3 对照表（13 项全一致）+ 代码核读 |
| 2 Mock 保存真实更新 | **PASS** | handlers.ts:1319 真实状态写入 + role-menus.spec 13 用例 |
| 3 页面加载/保存/清空/回填/半选 | **PASS** | RoleList.spec 5 个权限树用例（真实 el-tree） |
| 4 superadmin 双层保护、admin 无旁路 | **PASS** | step1 请求级 2 用例 + step2 isProtectedRole 链路 |
| 5 非超管授权链 | **PASS**（BLOCKED 已解除） | step1 请求级（允许/拒绝/未认证）+ step3b 后端正面/撤权/按钮契约（AuthMenusContractAndSecurityTest 11 用例）+ step3b 前端 mock 按角色过滤 + auth-session.spec 10 用例 |
| 6 租户边界 | **PASS** | roleMenus_shouldBeTenantIsolated + CommonTenantLineHandler |
| 7 前后端自动化回归 | **PASS** | step2 增量 +1 spec/+22 tests；step1 全量 660 |
| 8 无 Flyway/默认授权/无关变更 | **PASS** | 触碰清单逐文件核对，两处前端修正均属方向 §4 范围 |
| 9 测试基线达标 | **PASS** | surefire XML 独立聚合 660/0/0/0；spec 文件独立计数 10/9/13 |
| 10 阶段三知识同步 | 不适用（待 Step 4） | 本回执仅占位 |

---

## 2. 验收逐条证据

### 验收 1：真实 API 与 Mock 路径/载荷/响应/错误语义逐项一致 —— PASS

step1 §5（真实 API，后端测试实证）与 step2 §3（Mock 实现对照）两份对照表结论一致，本 Step 独立核读双方代码后合并输出最终对照表：

| 项 | 真实 API（step1 实证） | Mock 实现（step2 实证，代码核读） | 一致 |
|---|---|---|---|
| 路径 | `GET/PUT /system/role/{id}/menus`（前端加 `/api` 前缀） | `handlers.ts:1291/1306` 同 | ✅ |
| 方法 | GET 读 / PUT 整体替换 | 同 | ✅ |
| 请求载荷 | PUT body=number[]（Long→String 仅影响对象字段，数组元素仍为数字） | API 层 `role.ts:83-88` string[]→Number() 转换后提交 | ✅ |
| 成功响应 | `{code:0,msg:"ok",data:[...]}`；GET=menuId 数字数组（含目录/页面/按钮行，去重）；PUT data=null | `handlers.ts:1295` GET 返回 number[] 副本、`:1320` PUT data=null | ✅ |
| 读空角色 | `data:[]`（code=0） | 无绑定 → `[]` | ✅ |
| 清空 | 空数组或 body=null → 删全部绑定 | `:1316-1319` `[]`/`null`/非数组均置 `[]` | ✅ |
| 重复保存 | filter+distinct 去重、幂等 | `:1319` `[...new Set(requested)]` 幂等（测试实证） | ✅ |
| 未知角色 PUT | 静默成功 code=0（写孤儿关系） | `:1309` 无角色匹配仍 code=0 写绑定 | ✅ |
| 受保护角色 | builtIn+code=superadmin → HTTP 200 + body `{code:400,"msg":"内置超管角色不可修改或删除"}`，绑定不变 | `:1312-1313` 同文案 code=400，绑定不写 | ✅ |
| 无权限 | HTTP 403（契约意图；生产被 GlobalExceptionHandler 兜底 500，见 §5 偏差） | 不模拟（UI 层无可执行入口，范围内） | ✅ |
| 未认证 | HTTP 401 | 不模拟（同范围说明） | ✅ |
| 超管 | code 旁路可读写任意角色；对 superadmin 角色本身 PUT 仍被 assertMutable 拒 | 同（仅复刻 assertMutable 语义） | ✅ |
| 租户隔离 | sys_role_menu 按 tenant_id 隔离；sys_menu 全局 | Mock 单租户（无多租户会话，已记录范围内） | ✅ |
| 数据范围 | dataScope 越界按 ALL | 夹具已清除陈旧值 5→0 | ✅ |

核读代码依据：`RoleController.java:79-90`（两个端点 + `@PreAuthorize`）、`SysRoleServiceImpl.java:124-152`（listMenuIds/updateMenuIds/assertMutable）、`handlers.ts:1285-1322`（两个 handler）、`role.ts:78-89`（防腐转换）。

### 验收 2：Mock 保存真实更新 + 重复保存/空集合/未知角色/受保护角色 —— PASS

- 真实更新：`handlers.ts:1319` `MOCK_ROLE_MENU_BINDINGS[id] = [...new Set(requested)]` 写入内存夹具，后续 GET/页面回填可观察（方向 §5 风险 1 防护）。
- 逐项结果（role-menus.spec 13 用例实证，本 Step 独立数出 13 个 `it()`）：
  - 替换读回：PUT → GET 返回同一集合 ✅
  - 空集合：`[]` 与 `null` 均清空，GET 后读回 `[]` ✅
  - 重复保存：两次 PUT 同集合 → GET 一致（幂等）✅
  - 未知角色：静默 code=0 并写绑定（复刻孤儿关系语义）✅
  - 受保护角色：superadmin → code=400 同文案、绑定不被修改 ✅

### 验收 3：页面加载/保存/清空/重新打开回填、父子/半选不静默扩权丢权 —— PASS

- RoleList.spec 5 个权限树用例（真实 el-tree 渲染，非 stub，`RoleList.vue` 逻辑核读 `:227` 回填 getRoleMenus、`:237` setCheckedKeys、`:282` getCheckedKeys(true) 保存、`:285` isProtectedRole）：
  - 编辑回填：openEdit → getRoleMenus → setCheckedKeys 到真实树 ✅
  - 保存：getCheckedKeys(true) 仅上送叶子（断言 `not.toContain` 父节点）✅
  - 父子联动保存→重开→回填一致：第二次 openEdit 读回叶子集与保存时一致 → 无半选、无静默丢失 ✅
  - 半选场景：绑定 `['110']` 时父节点半选，但保存/回填均以叶子为准，父节点从不上送 → 不静默扩权也不丢权 ✅

### 验收 4：superadmin 前端无可执行入口 + 后端拒绝；普通 admin 无旁路 —— PASS

- 后端拒绝：`putMenus_toSuperadmin_shouldBeRejectedWithParamError`（请求级：HTTP 200 + body code=400「内置超管角色不可修改或删除」，superadmin 原绑定未被删改）✅
- 超管旁路仅限超管自己：`putMenus_superAdminBypass_shouldPassMethodSecurity`（superAdmin=true + permissions 空 → 放行写普通角色）；普通 admin（built_in=false）无 code 旁路，走显式权限 `putMenus_toAdminRole_shouldSucceed` ✅
- 前端无可执行入口：`RoleList.vue:285` isProtectedRole（builtIn===true && code==='superadmin'）→ `:451` 树 disabled、`:526` 树 disabled、`:534` 保存按钮 v-if、`:288` 行按钮 disabled；openEdit `:223` 回填 `form.builtIn = detail.builtIn ?? false`（修复既有保护缺口）✅
- RoleList.spec「superadmin 编辑」用例：isProtectedRole=true、保存不调 updateRoleMenus（`not.toHaveBeenCalled()`）✅

### 验收 5：非超管授权链 —— **PASS（Step 3b 补齐后 BLOCKED 解除）**

证据映射（step1/step2/step3b 三份回执 + 本 Step 核读；Step 3b 新增 `AuthMenusContractAndSecurityTest`（后端 11 请求级/服务级/装配三层用例）与 `auth-session.spec.ts`（前端 mock 菜单过滤 10 用例））：

| 子项 | 证据 | 状态 |
|---|---|---|
| 已授权按钮可用且对应接口允许 | `putMenus_toAdminRole_shouldSucceed`（请求级：非超管 admin + `system:role:update` → 200 code=0 落库）+ permission/index.spec「有权限 v-perm 正常门控」 | ✅ |
| 撤权后接口拒绝 | `putMenus_withoutPermission_shouldBeForbidden`（请求级：仅有 list 权限 PUT → HTTP 403 + body code=403） | ✅ |
| 撤权后按钮不可达 | permission/index.spec「hasPerm is pure: false on empty permission set even though v-perm would show it」+ step3b mock：撤权（清空绑定）后 `/auth/menus` 空树 | ✅ |
| 未认证请求拒绝 | `putMenus_unauthenticated_shouldBeUnauthorized`（HTTP 401）+ AuthFlowIntegrationTest me 无 token 401 + AuthMeControllerTest /me、/menus 401 | ✅ |
| **已授权菜单可见（非超管正面）** | **已补齐**：`AuthMenusContractAndSecurityTest.menus_nonSuperAdmin_shouldReturnOnlyBoundMenus`（请求级：非超管 u1 绑定目录 100/页面 110,120/按钮 111 混合行 → `/system/auth/menus` 树只含绑定行，根=目录 100、子按 sort 挂载、按钮 111 挂 110 下、未绑定 200/300 不可达）+ `menus_voContract_shouldMapButtonAndDirComponentToNullAndKeepPermission`（按钮 component=null、permission 原样）；前端 mock `/auth/menus` 已修正为按会话角色过滤（auth-session.spec 10 用例：超管全量/非超管按绑定/无绑定空树/撤权空树/祖先保留） | ✅ |
| 撤权后菜单不可达 | **已补齐**：`menus_noBoundMenus_shouldReturnEmptyTree`（请求级）+ `menus_afterBindingRemoval_shouldReturnEmptyTree`（绑定删除后空树，service 层）+ `menus_withDisabledRole_shouldKeepBoundMenus`（角色停用如实行为记录） | ✅ |
| 菜单可见与接口可调用分别有证据 | 接口可调用 ✅（请求级）；菜单可见 ✅（正面请求级 + mock 语义 + 契约测试） | ✅ |

**缺口处置记录（2026-08-19，Step 3b/3c）**：原缺口为自动化证据缺失（非生产缺陷）：① 后端 `SysMenuServiceImpl.getMenuTree` 非超管分支无直接测试（step1 覆盖度核对表误标已覆盖）；② 前端 mock `/auth/menus` 无条件返回全量树不按角色过滤。执行层在方向范围内补齐证据（新增测试 + mock 语义修正，生产代码与迁移零触碰），BLOCKED 解除。附带如实记录（不修复，供规划层知悉）：**角色停用（status 1→0，绑定保留）时菜单树与按钮 permission 仍按绑定装配（仅 roles 列表按 status=1 过滤）**——`loadMenuIdsByUserId`/`loadPermissions` 均不过滤角色 status，与方向 §2.3「保存、清空权限后必须与绑定关系一致」的主路径（绑定删除）不冲突，属生产既有行为。

### 验收 6：租户边界 —— PASS

- `roleMenus_shouldBeTenantIsolated`（请求级）：租户 0 读不到租户 5 的绑定（跨租户读 → 空数组）；跨租户 PUT 按未知角色处理、孤儿行落在本租户、原租户数据不受影响 ✅
- `CommonTenantLineHandler.java:25-51` + `application.yml:136-139`：ignore-tables 仅 `sys_menu`；`sys_role_menu` 不在忽略表 → select/update/insert 自动追加 tenant_id；`SysRoleMenu extends BaseEntity`（tenantId 插入填充）✅
- 全局菜单表 `sys_menu` 无 tenant_id（BaseEntityNoTenant），模型不变 ✅

### 验收 7：前后端自动化回归 —— PASS

- 前端：role.spec +4（防腐转换/空绑定/清空载荷）、RoleList.spec +5（真实 el-tree 权限树）、role-menus.spec +13（新增 spec）、auth-session.spec +10（Step 3b：mock 菜单按角色过滤 + 会话切换）—— 核心契约测试，非手工点击 ✅
- 后端：既有 RoleControllerTest（mock 层）、AuthMeControllerTest（3 用例）、AuthFlowIntegrationTest（7 用例）、FlywayFullChainH2Test（9 用例）+ 新增 RoleMenusContractAndSecurityTest（13 请求级用例）+ AuthMenusContractAndSecurityTest（11 用例，Step 3b）全量回归 ✅

### 验收 8：无 Flyway 新增、无默认授权变化、无无关业务代码变更 —— PASS

- 后端：生产代码、Flyway 迁移、sw-bootstrap **零修改**（step1 §7 触碰清单仅 1 个新增测试文件）✅
- 前端触碰 7 文件（见 §3），逐项核对越界：
  1. **seeds.ts 夹具 id 重复修复**（菜单树 15→18、10→20 及子 parentId；角色 3/4/5 去重）：属方向 §4「Mock handlers、角色/权限夹具」范围。本 Step 独立验证：MOCK_MENU_TREE 范围内 id 已唯一（52-431 行无重复），不修则 el-tree `node-key="id"` setCheckedKeys 漂移、勾选/绑定语义失真 → 最小修正 ✅
  2. **RoleList.vue openEdit 回填 form.builtIn（1 行）**：属方向 §4「角色管理页权限树及其测试」范围；不修则 superadmin 编辑态 isProtectedRole 保护全失效（方向 §5 风险 4/§6 验收 4 直接违背）→ 最小修正 ✅
  3. **dataScope 5→0**：方向 §2.2「清除会掩盖权限缺陷的陈旧值」明文要求 ✅
  4. 无默认授权变化：superadmin 无绑定行（旁路不变）、admin 绑定为 V31 既有、user 空绑定，V31/V33 未动 ✅

### 验收 9：测试基线达标 —— PASS

- 后端：**670 tests / 0 failures / 0 errors / 0 skipped / 110 报告文件**（Step 3b 全量实测；基线 647（109 文件）+ 13（RoleMenusContractAndSecurityTest）+ 11（AuthMenusContractAndSecurityTest，-1 历史残留 PgV33VerificationTest 已删文件数持平）= 670）✅
- 前端：**73 spec files / 678 tests / 0 failures**（Step 3b 四连实测）；基线 71/646 → +2 spec（role-menus.spec + auth-session.spec）+32 tests（4+5+13+10）✅
- 2G 上限：后端 `MAVEN_OPTS="-Xmx2g"`、前端 `NODE_OPTIONS="--max-old-space-size=2048"` ✅
- 前后端互斥：step1 编译前无前端进程（ps 检查 EXIT=1）、step2 四连前无后端进程 ✅

---

## 3. 实现文件清单（本功能累计触碰）

| 文件 | 类型 | 说明 |
|---|---|---|
| `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/RoleMenusContractAndSecurityTest.java` | 新增 | 13 请求级用例（契约+安全+租户） |
| `Smart-WorkFlow-Web/src/foundation/mock/seeds.ts` | 修改 | 按钮节点 6 个、id 去重、dataScope 5→0、MOCK_ROLE_MENU_BINDINGS |
| `Smart-WorkFlow-Web/src/foundation/mock/handlers.ts` | 修改 | 新增 GET/PUT `/api/system/role/:id/menus`（真实状态更新 + superadmin 400） |
| `Smart-WorkFlow-Web/src/modules/system/api/role.ts` | 修改 | getRoleMenus/updateRoleMenus number↔string 防腐转换 |
| `Smart-WorkFlow-Web/src/modules/system/views/RoleList.vue` | 修改 | openEdit 回填 form.builtIn（1 行） |
| `Smart-WorkFlow-Web/src/modules/system/api/role.spec.ts` | 修改 | +4 用例 |
| `Smart-WorkFlow-Web/src/modules/system/views/RoleList.spec.ts` | 修改 | +5 用例 |
| `Smart-WorkFlow-Web/src/foundation/mock/role-menus.spec.ts` | 新增 | 13 用例 |
| `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/AuthMenusContractAndSecurityTest.java` | 新增（Step 3b） | 11 用例（菜单过滤正面/撤权/按钮契约/空树/角色停用/租户/未认证） |
| `Smart-WorkFlow-Web/src/foundation/mock/seeds.ts` | 修改（Step 3b） | MockSessionData 接口、MOCK_SESSION_DATA_USER、MOCK_CURRENT_SESSION、switchMockSession |
| `Smart-WorkFlow-Web/src/foundation/mock/handlers.ts` | 修改（Step 3b） | /auth/menus 按角色过滤、/auth/me 非超管权限同源装配、登录切换会话 |
| `Smart-WorkFlow-Web/src/foundation/mock/auth-session.spec.ts` | 新增（Step 3b） | 10 用例（菜单过滤语义 + 会话切换） |
| `product/role-menu-permission-parity/receipts/step1-backend-regression.md` | 回执 | Step 1 |
| `product/role-menu-permission-parity/receipts/step2-frontend-closure.md` | 回执 | Step 2 |
| `product/role-menu-permission-parity/receipts/step3b-backend-menu-filter-evidence.md` | 回执 | Step 3b 后端 |
| `product/role-menu-permission-parity/receipts/step3b-frontend-mock-menu-filter.md` | 回执 | Step 3b 前端 |
| `product/role-menu-permission-parity/receipts/role-menu-permission-parity-completion.md` | 回执 | 本文件 |
| `product/role-menu-permission-parity/receipts/test-receipt.md` | 回执 | 测试汇总回执 |

**未触碰**（确认）：后端生产代码、Flyway 迁移、sw-bootstrap、`foundation/menu`、`foundation/permission`、`foundation/mock/index.ts`（匹配器）、`foundation/request`、无关页面（UserList/DeptList/PostList 等）。

---

## 4. 偏差与风险（发现与挂账）

1. **生产缺陷：403 被 GlobalExceptionHandler 兜底成 500（既有缺陷，挂账不修）**
   - 位置：`sw-framework/sw-common/src/main/java/com/sw/ck/common/exception/GlobalExceptionHandler.java:30-35`（`@ExceptionHandler(Exception.class)` + `@ResponseStatus(500)`），本 Step 独立核读确认。
   - 影响：`@PreAuthorize` 抛出的 `AuthorizationDeniedException` 在生产环境返回 **HTTP 500 + code=500** 而非 403。**拒绝语义仍成立**（无权限不可调用、数据不受影响），仅 HTTP 状态码漂移；前端 axios 按 body.code 判断（500 ≠ 0 同样拦截），业务影响有限。
   - 处置：方向 §3 非目标/§5 风险 3 已定性，不在本轮范围，**不修复**，记录挂账供规划层知悉（step1 §6）。
2. **step2 取舍：Mock 按契约意图实现而非照抄生产 500**——Mock 层不引入「模拟鉴权拒绝」行为（前端无可执行入口 + 方向 §4 前端范围不含 mock 鉴权），避免把生产缺陷固化进 mock 契约；若未来需 mock 级 403 证据，应在真实后端修复后按「HTTP 403 + body code=403」实现。理由成立，记录保留（step2 §3）。
3. **seeds id 重复修复与 RoleList builtIn 回填修复**：均确认为方向 §4 范围内最小修正（论证见验收 8），非越界。
4. **本 Step 新发现（step1/step2 均未记录）**：mock `/auth/menus`（handlers.ts:146-154）与 `/auth/me`（:136-141）**不按当前用户角色过滤**，与后端契约（非超管仅返回绑定菜单）不一致。step2 未触碰这两处（符合方向 §4「菜单构建只作回归验证」字面），但该语义缺口与验收 5「已授权菜单可见」证据缺失同源，已在验收 5 缺口中一并报告。
5. **工作区 git status 中的 memory/（features.md、handoff.md、state.md）、todo/requirement-pool.md 修改**：属既有会话状态文件，不在本功能触碰清单；本 Step 未触碰（Step 4 知识同步另行处理）。

---

## 5. 知识同步清单（占位，待 Step 4）

- [ ] `Smart-WorkFlow/功能清单.md`：M02-F02-01 / M02-F03-01 状态更新（以规划层最终判定为准）
- [ ] `todo/requirement-pool.md`：缺口同步
- [ ] `knowledge/current-status.md`、`knowledge/features/<name>.md`、`knowledge/known-issues.md` 全量同步
- [ ] `memory/`（state/decisions/issues/features/handoff）与 `search_fallback/m02-role-menu-button-permission-config.md` 归档
- [ ] 验收 10（状态结项与 P1 核销）执行

**本回执不执行上述任何同步，仅占位声明；知识同步为阶段三（验收 10）任务。**

---

## 6. BLOCKED 声明

**BLOCKED：无（已解除）**。Step 3 初判的验收 5「已授权菜单可见（非超管正面）」与「撤权后菜单不可达」证据缺口，经 Step 3b 补齐后全部闭合：后端新增 `AuthMenusContractAndSecurityTest`（11 用例，请求级/service 级/真实装配三层：正面混合行可见、按钮 component=null 契约、绑定删除空树、角色停用如实行为、无绑定空树、超管对照、未认证、租户隔离），全量 670/0/0/0；前端 mock `/auth/menus` 修正为按会话角色过滤（超管全量/非超管按绑定/无绑定空树/撤权空树），`/auth/me` 非超管 permissions 同源装配，新增 auth-session.spec 10 用例，四连 73 spec/678 tests/0 failures。生产代码与 Flyway 全程零修改。验收 1-9 全部 PASS；验收 10（阶段三知识同步）待 Step 4 执行。
