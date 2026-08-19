# Step 3b 前端回执：Mock `/auth/menus` 角色过滤语义 + 会话扩展 + 自动化测试（P1/M02-F02/F03）

**角色**：执行（前端）
**方向**：`product/role-menu-permission-parity/ready/direction-role-menu-permission-parity.md`（§2.2 Mock 等价、§6 验收 1/5/7）
**前置回执**：`step2-frontend-closure.md`（Mock 角色菜单 handler 与 `MOCK_ROLE_MENU_BINDINGS` 夹具）、`step3b-backend-menu-filter-evidence.md`（后端请求级实证 A1-A11，本 Step 的语义基准）
**缺口来源**：`role-menu-permission-parity-completion.md` §验收 5（第 89 行附近）与 §B 项发现 4

---

## 1. 一句话结论

Mock `GET /api/system/auth/menus` 由「无条件返回全量树」修正为「按当前会话用户角色过滤」：超管 → 全量树；非超管 → 按角色绑定（`MOCK_ROLE_MENU_BINDINGS`）过滤、父不在绑定集合则子树不挂载（孤儿丢弃，与真实后端 `buildTree` 语义一致）、同层 sort 升序；无绑定 → 空数组；`/auth/me` 非超管 permissions 与绑定按钮行同源装配。按既有机制最小扩展出可切换会话（登录 username `user` → 普通用户、`admin` → 超管），新增专项 spec **10 用例**，四连全绿 **73 spec / 678 tests / 0 failures**（基线 72/668，精确增量 +1 spec / +10 tests），**无 BLOCKED**。

---

## 2. 会话机制核对结果与扩展（任务要求 1）

**核对（读代码确认）**：
- `seeds.ts`：`MOCK_USERS`（:11-14，admin/user 两个固定用户）、`MOCK_SESSION_DATA`（:17 起，固定 **admin 超管**会话：`user.id='1'`、`superAdmin:true`、固定全量 permissions、`roles:['admin']`）。
- `handlers.ts`：`POST /api/auth/login`（:163-180 原）**不校验密码、固定返回 token，从不切换会话**；`GET /api/system/auth/me`（原 :134-142）无条件返回 `MOCK_SESSION_DATA`；`GET /api/system/auth/menus`（原 :145-154）无条件返回全量 `MOCK_MENU_TREE`。
- **结论：mock 仅固定一个超管会话，无任何会话切换逻辑，无法表达非超管过滤语义。** `MOCK_USERS` 中 `user`（普通用户）早已存在但未被任何会话逻辑消费。

**最小扩展（不重写 mock 架构，沿用「seeds 声明 + handler 原地 mutate」既有模式）**：
- `seeds.ts`：新增 `MockSessionData` 接口（对齐后端 SessionDTO 形状，:17-24）、`MOCK_SESSION_DATA_USER`（:77 起，普通用户 `user`：`superAdmin:false`、`roles:['user']`、`permissions:[]`、`user.id='2'`）、可变引用 `MOCK_CURRENT_SESSION`（:97，初始 = 超管会话）、`switchMockSession(username)`（:100-102，`user` → 普通用户，其余 → 超管，与登录 handler 的「不校验密码」既有行为一致）。
- `handlers.ts`：登录 handler（:166-180）登录时按 username 调 `switchMockSession`。
- **取舍记录**：① mock 无 token 校验，会话切换是「按登录用户名选择会话」的演示语义（dev:mock 登录页用 `user`/`user123` 即进普通用户会话），方向范围内无需登录页外的新入口；② `refresh`/`logout` 不切会话（幂等，与既有行为一致）；③ admin 超管会话的 `/auth/me` 返回既有 `MOCK_SESSION_DATA` 常量不变（向后兼容，`toEqual` 可继续断言）。

---

## 3. 过滤实现说明（任务要求 2/3）

全部在 `src/foundation/mock/`（seeds.ts 类型与夹具、handlers.ts 逻辑）。

### 3.1 辅助函数（handlers.ts）

| 函数 | 位置 | 职责 |
|---|---|---|
| `currentRoleIds()` | :85-88 | 当前会话 `roles`（角色 code 列表）→ `MOCK_ROLES_LIST` 按 code 匹配 → 角色 id（number） |
| `currentMenuIds()` | :91-98 | 跨角色绑定取**并集**（数字归一；无绑定角色跳过），返回 `Set<number>` |
| `buildMockMenuTree()` | :106-126 | 菜单树过滤核心（见下） |
| `buildMockPermissions()` | :134-148 | 非超管按钮行（`menuType===2 && permission 非空 && id∈allowed`）的 permission 装配 |

### 3.2 过滤算法（buildMockMenuTree，handlers.ts:106-126）

```
超管         → 直接返回 MOCK_MENU_TREE 原引用（全量旁路，与后端 superAdmin 分支一致）
非超管       → allowed = currentMenuIds()；allowed.size === 0 → 返回 []
            → 递归 pick：
                for node in nodes: node.id ∉ allowed → 跳过（不保留）
                                  node.id ∈ allowed → 浅拷贝 clone + 递归 pick(children) 后入列
                同层 sort((a,b) => a.sort - b.sort) 升序
```

- **祖先保留**：父节点 id ∈ 绑定集合时正常挂载子节点（绑定 [1,11,12,110] → 根 1 → 11/12 → 110 链完整可导航）。
- **孤儿处理（与真实后端行为对照，以真实语义为准）**：任务明示——真实 `SysMenuServiceImpl.buildTree` 只对 `in(menuIds)` 的行按 `parent_id` 挂载，**父节点不在集合时孤儿子节点不会被挂载**。本实现与之逐字对齐：绑定 [110]（父 11 不在集合）→ 过滤树为 **空数组**（子树整体丢弃），不尝试补挂父链。方向 §2.2「Mock 语义与真实 API 一致」以该真实语义为准。
- **夹具零污染**：过滤产出浅拷贝节点（clone），**不改动共享 `MOCK_MENU_TREE`**——超管全量树永远来自原始夹具，跨会话交替请求不剪树（测试「撤权后切回超管」未显式写，但 clone 保证该不变量；超管用例断言与原始全量相等覆盖）。
- **排序**：同层 sort 升序（后端 Comparator 一致），测试以乱序绑定实证（[1,13,11,12] → children 输出 11,12,13）。

### 3.3 `/auth/me` 权限对齐（handlers.ts:214-227）

- 超管 → 返回 `MOCK_SESSION_DATA`（既有固定全量 permissions）。
- 非超管 → 会话快照 + `permissions: buildMockPermissions()`（绑定按钮行 permission，与真实 `UserDetailsProviderImpl.loadByUserId` 装配语义同源——菜单可见性与按钮显隐同源）。
- **超管 permissions 取舍记录**：后端超管旁路下 `hasPerm` 恒 true（permissions 内容不影响判定，step3b A11「permissions 空仍放行」实证）；mock 保留既有全量列表（历史演示行为），不因本次改动清空——不影响任何过滤语义，与方向 §2.2「清除陈旧值」不冲突（该条针对角色夹具陈旧 dataScope，非会话 permissions）。
- **角色停用不对称（如实记录，与后端一致）**：后端实测（step3b A4/A11）菜单/权限侧**不过滤**角色 status（仅 roles 列表过滤）；mock `currentRoleIds` 按 code 匹配 `MOCK_ROLES_LIST` 同样不看 status → 停用角色仍贡献绑定，与真实后端对称。mock 夹具角色全部 status=1，无差异面。

### 3.4 不修改确认

`foundation/menu`、`foundation/permission`、`foundation/session`、`foundation/mock/index.ts`（匹配器）、`foundation/request` 生产逻辑**零改动**；后端/Flyway 未触碰；无关页面零改动。

---

## 4. 测试增量明细与四连结果（任务要求 4）

### 4.1 新增 spec：`src/foundation/mock/auth-session.spec.ts`（+1 spec，10 用例）

| # | 用例 | 覆盖 |
|---|---|---|
| 1 | 登录 admin → /auth/me 超管会话（superAdmin=true，`toEqual(MOCK_SESSION_DATA)` 原值） | 超管会话 |
| 2 | 登录 user → /auth/me 普通会话（superAdmin=false，空绑定 → 空 permissions） | 会话切换 + /auth/me |
| 3 | 超管 /auth/menus 全量树（含未绑定行，id 集合与原始夹具全等） | 超管旁路 |
| 4 | 非超管正面：绑定 [1,11,12,110] → 祖先链保留（1→11→110），未绑定 13/14/18 不可达，同层 sort 升序 | **正面 + 祖先保留** |
| 5 | 仅绑目录 1 → 目录可见、未绑定页面不混入（children 空） | 子集过滤 |
| 6 | 孤儿子节点不挂载：仅绑按钮 110 → 树空，但按钮权限仍装配（菜单不可见与按钮权限分离，各自有证据） | **孤儿语义** |
| 7 | 过滤后同层按 sort 升序（乱序绑定 [1,13,11,12] → 11,12,13） | 排序 |
| 8 | 无绑定 → 空树（code=0） | **空树** |
| 9 | 撤权（清空绑定）→ 空树且按钮权限同步清空 | **撤权空树** |
| 10 | 过滤树与按钮行保留：绑定 [1,11,110] → 菜单可见且 /auth/me 权限含 `system:user:add` | **树与按钮同源** |

既有 `role-menus.spec.ts` **未因夹具变更而红**（其断言不依赖 `/auth/menus` 全量行为）；仅因 `MOCK_MENU_TREE` 增加 `MockMenuNode` 接口标注（命名接口无隐式索引签名）导致两处 `as Array<Record<string,unknown>>` 报 TS2352 → 改为 `as unknown as`，**断言零改动**（同文件 :56/:74，各 1 行）。`agent-models.spec.ts` 同因 1 处（:301，lint --fix 后格式化）。两处均为类型兼容修正，非语义弱化。

### 4.2 四连结果（跑前互斥：`ps aux | grep -iE "mvn|java|surefire"` 无后端进程，EXIT=1 ✓）

| 命令（均带 `NODE_OPTIONS="--max-old-space-size=2048"`） | 退出码 | 结果 |
|---|---|---|
| `pnpm typecheck` | 0 | vue-tsc -b --noEmit 0 errors |
| `pnpm lint` | 0 | eslint . 0 errors / 0 warnings（--fix 处理 1 处 prettier 格式） |
| `pnpm test` | 0 | **73 spec files / 678 tests / 0 failures** |
| `pnpm build` | 0 | vite build 成功（rolldown pure 注解警告为既有无害输出） |

**基线对比（基线 72 spec / 668 tests / 0 failures，方向 §6 验收 9）**：
- spec：72 → **73**（+1：新增 `auth-session.spec.ts`）
- tests：668 → **678**（+10 = auth-session.spec 10 用例）
- 失败/跳过：0/0；其余文件零语义变更（两处类型兼容强转已注明）

---

## 5. 与后端契约的逐项一致性（任务要求 5，基准 = step3b 后端请求级实证）

| 项 | 真实后端（step3b 实证） | Mock 实现 | 一致 |
|---|---|---|---|
| 超管全量 | 超管 → 全量根节点含未绑定行，sort 升序（A8） | `buildMockMenuTree` 超管返回原树引用 | ✅ |
| 非超管按绑定过滤（正面） | 只含绑定行、根=绑定目录、sort 升序（A1/A7） | `allowed` 集合过滤 + 同层 sort 升序 | ✅ |
| 祖先保留 / 孤儿处理 | `buildTree` 仅父在集合才挂载子（任务明示以真实语义为准） | 同：父不在集合 → 子树整体丢弃 | ✅ |
| 按钮行保留 | 按钮行出现在树中，component=null、permission 保留（A2） | menuType=2 节点随过滤保留 | ✅ |
| 无绑定空树 | 空列表 code=0（A5/A6） | allowed.size===0 → `[]` | ✅ |
| 撤权（清空绑定） | 删绑定后同一用户空树（A3） | 清空绑定 → 空树（测试实证） | ✅ |
| /auth/me 非超管 permissions | 按钮行装配（A11） | `buildMockPermissions` 同源装配 | ✅ |
| /auth/me 超管 permissions | 旁路（内容不影响判定） | 保留既有全量列表（取舍已记录 §3.3） | ✅（范围内） |
| 角色停用 | 菜单/权限侧不过滤角色 status（A4/A11） | mock 不过滤 status（夹具全启用，无差异面） | ✅ |

---

## 6. 触碰文件清单与 BLOCKED

**触碰（本任务）**：

| 文件 | 类型 | 说明 |
|---|---|---|
| `Smart-WorkFlow-Web/src/foundation/mock/seeds.ts` | 修改 | `MockSessionData`/`MockMenuNode` 类型、`MOCK_SESSION_DATA_USER`、`MOCK_CURRENT_SESSION`、`switchMockSession`（:17-120） |
| `Smart-WorkFlow-Web/src/foundation/mock/handlers.ts` | 修改 | 登录切会话（:166-180）、`/auth/me`（:214-227）、`/auth/menus`（:235-242）、辅助函数（:84-148） |
| `Smart-WorkFlow-Web/src/foundation/mock/auth-session.spec.ts` | **新增** | 10 用例（会话/过滤/空树/撤权/排序/孤儿） |
| `Smart-WorkFlow-Web/src/foundation/mock/role-menus.spec.ts` | 修改 | 2 处类型兼容强转（`as unknown as`），断言零改动 |
| `Smart-WorkFlow-Web/src/foundation/mock/agent-models.spec.ts` | 修改 | 1 处类型兼容强转（lint --fix 格式化），断言零改动 |
| `product/role-menu-permission-parity/receipts/step3b-frontend-mock-menu-filter.md` | 回执 | 本文件 |

**未触碰（确认）**：`foundation/menu`、`foundation/permission`、`foundation/session`、`foundation/mock/index.ts`、`foundation/request` 生产逻辑；后端仓库（`Smart-WorkFlow/`）任何文件；Flyway；`modules/system` 页面/API（`role.ts`/`RoleList.vue`/`RoleList.spec.ts`/`role.spec.ts` 与 `userGroup*` 为 step2/P28 既有会话工作区产物，本任务零改动）。

**BLOCKED 事项：无。** 附带记录（非阻塞）：① 超管会话 permissions 保留既有全量列表的取舍（§3.3）；② 角色停用撤权不对称为后端既有实现，mock 与之一致（§3.3）；③ 工作区存在 step2（role-menus 等）与 P28/I36（userGroup*）未提交产物，四连基于工作区全量状态跑绿，本任务在其上增量完成。
