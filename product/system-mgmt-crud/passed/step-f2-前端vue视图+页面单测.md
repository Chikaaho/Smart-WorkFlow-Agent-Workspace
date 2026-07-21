# Step F2：前端 — Vue 视图 + 页面单测（8 文件）

## 1. 当前状态

功能「系统管理核心 CRUD 做宽闭环」处于 **IN_PROGRESS** 状态。

前置 Step：
- B1/B2/B3 **PASSED** — 后端全部完成（4 Controller + 4 Service + 迁移 + 25 tests）
- F1 **PASSED** — 前端 Types + API + Specs（12 文件，42 spec files / 377 tests）

此 Step 是前端第二阶段：为 User/Role/Dept/Post 各创建 Vue 列表视图和页面单测。

## 2. Step 目标

创建 4 个 Vue 列表视图页面（UserList / RoleList / DeptList / PostList）+ 4 个页面单测文件，全部沿 `DictTypeList.vue` 模式，实现列表展示、筛选、新建/编辑弹窗、删除确认的标准 CRUD 交互。

## 3. 推荐模型

推荐模型：**deepseek-v4-flash**

## 4. 模型选择理由

选择理由：纯样板代码机械复制 — 4 个视图严格沿 `DictTypeList.vue` 模式（StandardListTemplate + el-table + el-dialog/StandardFormTemplate + ElMessageBox.confirm），替换实体名、字段名、API 函数名即可，零架构决策。

是否触发升级条件：否

## 5. 已知上下文

### 5.1 参考实现（DictTypeList.vue，389 行）

已读取完整内容。核心模式：
- **列表状态**：`list`/`total`/`pageNum`/`pageSize`/`loading`/`errorMsg` refs
- **筛选状态**：`filter` reactive（绑定输入控件）+ `currentFilter`（查询快照）
- **弹窗状态**：`dialogVisible`/`dialogTitle`/`editingId`/`submitting`/`formError`
- **表单状态**：`form` reactive，`resetForm()` 清空，`openCreate()`/`openEdit(row)` 控制
- **CRUD 流程**：`loadList()` → `handleQuery()`/`handleReset()` → `openCreate()`/`openEdit()` → `handleSubmit()`（create or update）→ `handleDelete()`
- **样式**：`.form-field` / `.form-field__label` / `.form-field--required`（scoped CSS，约 20 行）

### 5.2 StandardListTemplate 接口

```typescript
props: { title?: string; total: number; pageNum: number; pageSize: number; empty?: boolean }
emits: { 'update:pageNum': [value: number]; 'update:pageSize': [value: number] }
slots: toolbar-actions / filter / filter-actions / empty-action / default（表格内容）
```

### 5.3 StandardFormTemplate 接口（embedded 模式）

```typescript
props: { title?: string; subtitle?: string; embedded?: boolean }
slots: alert / default（FormSection > FormGrid）/ actions（取消/保存按钮）
```

### 5.4 视图解析机制

菜单的 `component` 字段（如 `system/views/UserList`）通过 `import.meta.glob` 白名单解析为 Vue 组件。只需在 `views/` 目录创建 `.vue` 文件即可，无需手动注册路由。文件命名为 `{Entity}List.vue`，与 Flyway V15 菜单中的 `component` 路径一致。

### 5.5 各实体关键差异

| 实体 | 分页 | 筛选字段 | 表单特殊字段 | 表格特殊列 | 其他 |
|------|:----:|---------|-------------|-----------|------|
| User | 是 | username, status | plainPassword（仅新建模式显示） | 状态 tag | 密码字段 `v-if="!editingId"` |
| Role | 是 | name, code, status | code 编辑时 disabled | 状态 tag, builtIn tag | code 字段 `:disabled="!!editingId"` |
| Dept | **否**（tree） | name, status（可选） | parentId（上级部门下拉） | 树形渲染 | 无分页组件；flat→tree 转换在前端 |
| Post | 是 | code, name, status | — | 状态 tag | 最标准 CRUD，最接近 DictTypeList |

### 5.6 前端测试模式（DictTypeList.spec.ts，126 行）

已读取完整内容。核心模式：
- `vi.mock('@/modules/system/api/{entity}')` + `vi.mock('vue-router')`
- `mount(Component, { global: { stubs: minimalStubs } })` — 浅 stub Element Plus 组件和模板组件
- 测试：API 调用参数、分页翻页、筛选重置、删除 API 调用
- 不测试弹窗内表单逻辑（复杂 DOM 交互留给手工验收）

## 6. 执行前必须读取的文件

按优先级排序：

| # | 文件 | 目的 |
|---|------|------|
| 1 | `Smart-WorkFlow-Web/src/modules/system/views/DictTypeList.vue` | 视图实现模式（完整 script + template + style） |
| 2 | `Smart-WorkFlow-Web/src/modules/system/views/DictTypeList.spec.ts` | 页面单测模式（stub + mount + API 断言） |
| 3 | `Smart-WorkFlow-Web/src/components/page-layout/StandardListTemplate.vue` | 列表模板 props/slots |
| 4 | `Smart-WorkFlow-Web/src/components/page-layout/StandardFormTemplate.vue` | 表单模板 props/slots（确认 embedded 模式） |
| 5 | `Smart-WorkFlow-Web/src/modules/system/api/user.ts` | User API 函数签名 |
| 6 | `Smart-WorkFlow-Web/src/modules/system/api/role.ts` | Role API 函数签名 |
| 7 | `Smart-WorkFlow-Web/src/modules/system/api/dept.ts` | Dept API 函数签名（含 listDeptTree） |
| 8 | `Smart-WorkFlow-Web/src/modules/system/api/post.ts` | Post API 函数签名 |
| 9 | `Smart-WorkFlow-Web/src/modules/system/types/user.ts` | User 类型（SysUser / UserFormRequest / UserFilter） |
| 10 | `Smart-WorkFlow-Web/src/modules/system/types/role.ts` | Role 类型 |
| 11 | `Smart-WorkFlow-Web/src/modules/system/types/dept.ts` | Dept 类型（含 children?） |
| 12 | `Smart-WorkFlow-Web/src/modules/system/types/post.ts` | Post 类型 |
| 13 | `Smart-WorkFlow-Web/src/contracts/common.ts` | PageQuery / PageResult 类型 |
| 14 | `Smart-WorkFlow-Web/src/foundation/request/index.ts` | ApiError 类 |
| 15 | `Smart-WorkFlow-Web/.claude/CLAUDE.md` | 前端工程宪法（§4 REFERENCE 红线、§5 设计系统、§6 页型规范） |

## 7. 允许修改的文件范围

### 新建（8 个）

```
Smart-WorkFlow-Web/src/modules/system/views/UserList.vue
Smart-WorkFlow-Web/src/modules/system/views/RoleList.vue
Smart-WorkFlow-Web/src/modules/system/views/DeptList.vue
Smart-WorkFlow-Web/src/modules/system/views/PostList.vue
Smart-WorkFlow-Web/src/modules/system/views/UserList.spec.ts
Smart-WorkFlow-Web/src/modules/system/views/RoleList.spec.ts
Smart-WorkFlow-Web/src/modules/system/views/DeptList.spec.ts
Smart-WorkFlow-Web/src/modules/system/views/PostList.spec.ts
```

### 不修改任何已有文件

## 8. 禁止修改的范围

- 禁止修改 `DictTypeList.vue` / `DictTypeList.spec.ts` 或任何已有文件
- 禁止修改 `StandardListTemplate.vue` / `StandardFormTemplate.vue`
- 禁止修改 `api/*.ts` / `types/*.ts`（那是 F1 的工作，已通过验收）
- 禁止修改 router 配置
- 禁止触碰 `Smart-WorkFlow/` 下任何后端文件
- 禁止创建 router 注册文件（视图通过 `import.meta.glob` 自动发现）

## 9. 详细执行方案

### 9.1 执行顺序

```
1. 创建 views/UserList.vue
2. 创建 views/RoleList.vue
3. 创建 views/DeptList.vue
4. 创建 views/PostList.vue
5. 创建 views/UserList.spec.ts
6. 创建 views/RoleList.spec.ts
7. 创建 views/DeptList.spec.ts
8. 创建 views/PostList.spec.ts
9. 运行 pnpm typecheck && pnpm lint && pnpm test
```

### 9.2 views/UserList.vue — 用户管理列表

**与 DictTypeList 的核心差异**：
1. API 导入：`pageUsers`/`getUser`/`createUser`/`updateUser`/`deleteUser`
2. 类型导入：`SysUser`/`UserFormRequest`/`UserFilter`
3. form 类型为 `UserFormRequest`（非 `SysUser`），含 `plainPassword` 字段
4. 筛选字段：`username`（input）+ `status`（select）
5. 表格列：用户名 / 姓名 / 邮箱 / 手机号 / 性别 / 状态(tag) / 所属部门 / 操作
6. 弹窗表单字段：用户名(必填) / 姓名 / 邮箱 / 手机号 / 性别(select) / 状态(select) / 所属部门(input) / **密码(input type="password"，仅 `v-if="!editingId"` 显示)**
7. 无「管理字典项」按钮（那是 DictType 特有）
8. `handleSubmit` 调用 `createUser(form)` / `updateUser(form)`（参数为 `UserFormRequest`）

**表格列定义**：
```
用户名(username) | 姓名(realName) | 邮箱(email) | 手机号(phone) | 性别(sex) | 状态(status, tag) | 操作(编辑/删除)
```

**弹窗表单字段**：
- 双列栅格：用户名*(input) / 姓名(input)
- 双列栅格：邮箱(input) / 手机号(input)
- 双列栅格：性别(select: 未知/男/女) / 状态(select: 正常/停用)
- 单列：所属部门(input)
- 单列（仅新建）：密码(input type="password", placeholder="请输入密码")

### 9.3 views/RoleList.vue — 角色管理列表

**与 DictTypeList 的核心差异**：
1. API 导入：`pageRoles`/`getRole`/`createRole`/`updateRole`/`deleteRole`
2. 类型导入：`SysRole`/`RoleFilter`
3. 筛选字段：`name`（input）+ `code`（input）+ `status`（select）
4. 表格列：角色名称 / 角色编码 / 排序 / 状态(tag) / 内置(tag) / 操作
5. 弹窗表单字段：角色名称*(input) / 角色编码*(input, `:disabled="!!editingId"`) / 排序(inputNumber) / 状态(select) / 备注(textarea)
6. `builtIn` 角色不显示删除按钮（或删除时后端拦截）

**表格列定义**：
```
角色名称(name) | 角色编码(code) | 排序(sort) | 状态(status, tag) | 内置(builtIn, tag) | 操作(编辑/删除)
```

**弹窗表单字段**：
- 双列栅格：角色名称*(input) / 角色编码*(input, editingId 时 disabled)
- 双列栅格：排序(inputNumber) / 状态(select)
- 单列：备注(textarea)

### 9.4 views/DeptList.vue — 部门管理列表

**这是最特殊的视图 — 无分页、树形渲染。**

关键差异：
1. API 导入：`listDeptTree`/`getDept`/`createDept`/`updateDept`/`deleteDept`
2. 类型导入：`SysDept`（无 filter 类型）
3. **无分页状态**：不存在 `pageNum`/`pageSize`/`total`，不使用 `StandardListTemplate` 的分页 props
4. **无筛选区**（部门树通常不过滤，或仅一个 name 搜索框）
5. 数据加载：`loadTree()` 调用 `listDeptTree()`，返回 `SysDept[]`
6. **前端 flat→tree 转换**：将 flat 列表转为嵌套 `SysDept[]`（注入 `children`）
7. 表格使用 `el-table` 的 `row-key="id"` + `tree-props="{ children: 'children', hasChildren: 'hasChildren' }"`（Element Plus 树形表格）
8. 弹窗表单字段：上级部门(tree-select 或 select) / 部门名称*(input) / 部门编码*(input) / 排序(inputNumber) / 状态(select)

**关键实现注意事项**：
- 因为 DeptList 不使用分页，需自行处理 `StandardListTemplate` 的分页 props — 传 `total=0`/`pageNum=1`/`pageSize=999` 或不使用 `StandardListTemplate` 而手写布局
- **决策：DeptList 不使用 StandardListTemplate**，手写简易布局（页标题 + 工具栏 + el-table tree + el-dialog）。因为树形表格不分页，与标准列表模板差异太大，强行适配比手写更复杂。
- `flat→tree` 转换：`function buildTree(list: SysDept[], parentId = '0'): SysDept[] { ... }` 递归构建

**表格列定义**（树形表格）：
```
部门名称(name, 树形缩进) | 部门编码(code) | 排序(sort) | 状态(status, tag) | 操作(编辑/删除)
```

**弹窗表单字段**：
- 双列栅格：上级部门(tree-select, 过滤自身及子孙) / 部门名称*(input)
- 双列栅格：部门编码*(input) / 排序(inputNumber)
- 双列栅格：状态(select)

### 9.5 views/PostList.vue — 岗位管理列表

**最接近 DictTypeList 模式，无特殊行为。**

1. API 导入：`pagePosts`/`getPost`/`createPost`/`updatePost`/`deletePost`
2. 类型导入：`SysPost`/`PostFilter`
3. 筛选字段：`code`（input）+ `name`（input）+ `status`（select）
4. 表格列：岗位编码 / 岗位名称 / 排序 / 状态(tag) / 操作
5. 弹窗表单字段：岗位编码*(input) / 岗位名称*(input) / 排序(inputNumber) / 状态(select) / 备注(textarea)

**表格列定义**：
```
岗位编码(code) | 岗位名称(name) | 排序(sort) | 状态(status, tag) | 操作(编辑/删除)
```

**弹窗表单字段**：
- 双列栅格：岗位编码*(input) / 岗位名称*(input)
- 双列栅格：排序(inputNumber) / 状态(select)
- 单列：备注(textarea)

### 9.6 页面单测设计

每个 `.spec.ts` 沿 `DictTypeList.spec.ts` 模式，使用 `minimalStubs` + `mount`。每个 spec 含 4~5 个测试：

| # | 测试 | UserList | RoleList | DeptList | PostList |
|---|------|:--------:|:--------:|:--------:|:--------:|
| 1 | API 调用参数 | pageUsers + 默认分页 | pageRoles + 默认分页 | listDeptTree 调用 | pagePosts + 默认分页 |
| 2 | 分页翻页 | handlePageNumChange(3) | handlePageNumChange(3) | N/A（无分页） | handlePageNumChange(3) |
| 3 | 筛选重置 | handleReset → pageNum=1 | handleReset → pageNum=1 | N/A | handleReset → pageNum=1 |
| 4 | 删除调用 | deleteUser('1') | deleteRole('1') | deleteDept('1') | deletePost('1') |

**DeptList 特殊处理**：不测试分页，改为测试 `listDeptTree` 调用参数。

### 9.7 flat→tree 转换函数（DeptList 专用）

```typescript
function buildTree(list: SysDept[], parentId = '0'): SysDept[] {
  return list
    .filter((item) => item.parentId === parentId)
    .map((item) => ({
      ...item,
      children: buildTree(list, item.id!),
    }))
}
```

### 9.8 验证命令

```bash
cd /data/reasonix/files/Smart-WorkFlow-Web

# 第一步：类型检查
pnpm typecheck

# 第二步：lint（含架构边界规则）
pnpm lint

# 第三步：单元测试（全量）
pnpm test

# 如果以上全部通过，再跑 build
pnpm build
```

## 10. 关键实现约束

1. **全部视图沿 DictTypeList.vue 的同一套模式** — script setup + reactive state + loadList/loadTree + handleQuery/Reset + openCreate/Edit + handleSubmit + handleDelete
2. **全部经 `foundation/request` 单一请求层** — 禁直引 axios（硬约束 §2）
3. **API 调用从 `@/modules/system/api/{entity}` 导入** — 不直接调 `request()`
4. **类型从 `@/modules/system/types/{entity}` 导入** — 不自行定义
5. **错误处理统一** — catch `ApiError`，区分业务错误和网络错误，用 `ElMessage.error()` 提示
6. **禁止 `any` 类型** — 所有类型显式声明
7. **scoped CSS 引用 CSS 变量** — `var(--sw-*)` 设计 token，禁硬编码颜色/间距
8. **删除前必须 `ElMessageBox.confirm`** — 与 DictTypeList 一致
9. **UserList 的密码字段仅在新建模式显示** — `v-if="!editingId"`，type="password"
10. **RoleList 的 code 字段编辑时 disabled** — `:disabled="!!editingId"`
11. **DeptList 不使用 StandardListTemplate** — 树形表格不分页，手写布局更合适
12. **DeptList 的 flat→tree 转换在 `loadTree()` 中完成** — 不在 template 中使用 computed
13. **所有 spec 文件使用 minimalStubs 浅 stub** — 不测试 Element Plus 内部行为

## 11. 边界情况

| # | 场景 | 处理 |
|---|------|------|
| 1 | UserList 编辑模式下密码字段不显示 | `v-if="!editingId"` |
| 2 | UserList 更新时不传 plainPassword | `plainPassword` 为 undefined，JSON.stringify 不会包含该字段 |
| 3 | DeptList 空树 | `listDeptTree()` 返回 `[]`，`buildTree([])` 返回 `[]`，表格显示空态 |
| 4 | DeptList 上级部门选择器过滤自身 | 将当前编辑节点及其子孙从候选列表排除 |
| 5 | DeptList 删除有子部门的部门 | 后端返回 RESTRICT 错误，前端 `catch ApiError` 显示错误消息 |
| 6 | RoleList builtIn 角色删除 | 后端拦截，前端 `catch ApiError` 显示错误消息 |
| 7 | 分页查询后列表为空 | `isEmpty` computed → StandardListTemplate 显示空态 |
| 8 | 网络错误非 ApiError | catch 分支兜底显示通用错误消息 |

## 12. 风险和回滚方案

| 风险 | 概率 | 影响 | 缓解 |
|------|:----:|------|------|
| DeptList 树形表格渲染异常 | 中 | 页面白屏 | `buildTree` 纯函数可独立单测，`el-table` tree-props 用 Element Plus 文档验证 |
| UserList 密码字段与更新逻辑冲突 | 低 | 更新时意外修改密码 | `updateUser` 不传 `plainPassword` 时字段为 undefined |
| TypeScript 类型与 API 函数签名不匹配 | 低 | 编译失败 | types 和 API 已在 F1 通过 typecheck |

回滚：删除 8 个新建文件即完全回滚。不影响已有功能。

## 13. 测试方案

### 13.1 静态检查

- `pnpm typecheck` 退出码 0（零类型错误）
- `pnpm lint` 退出码 0（零 lint 告警）
- `grep -r "from 'axios'"` 在 4 个新 Vue 文件中零命中

### 13.2 单元测试

- **UserList.spec.ts**：4 个测试（API 调用、分页、重置、删除）
- **RoleList.spec.ts**：4 个测试
- **DeptList.spec.ts**：3 个测试（API 调用、tree 渲染、删除）
- **PostList.spec.ts**：4 个测试
- 合计新增 **15 个测试用例**

### 13.3 集成测试

无。页面交互由 Element Plus 组件处理，在 F3 mock 模式下手工验收。

### 13.4 手工验证

F2 完成后不要求手工验证（`pnpm dev:mock` 需要 mock handler 先就位，那是 F3 的工作）。但可以通过 `pnpm test` 确认组件可挂载且 API 调用参数正确。

### 13.5 回归检查

- `pnpm test` 全量测试计数不应减少（基线 42 spec files / 377 tests）
- 预期新基线：**46 spec files / ~392 tests**（+4 spec files, +15 tests）
- DictTypeList.spec.ts 的 5 个测试必须全部通过（零回归）

## 14. 验收标准

| 编号 | 条件 |
|:----:|------|
| **F2-1** | `views/UserList.vue` 存在，含分页列表 + 新建/编辑弹窗（含密码字段） + 删除确认 |
| **F2-2** | `views/RoleList.vue` 存在，含分页列表 + 弹窗（code 编辑时 disabled） + 删除确认 |
| **F2-3** | `views/DeptList.vue` 存在，含树形表格（el-table row-key + tree-props）+ 弹窗（含上级部门选择） |
| **F2-4** | `views/PostList.vue` 存在，含分页列表 + 弹窗 + 删除确认 |
| **F2-5** | 4 个 spec 文件存在，共 ≥12 个测试用例 |
| **F2-6** | `pnpm typecheck` 退出码 0 |
| **F2-7** | `pnpm lint` 退出码 0 |
| **F2-8** | `pnpm test` 退出码 0，所有新增和已有测试全绿 |
| **F2-9** | `pnpm test` 总 spec files 数 46（42 基线 + 4 新增），tests 数 ≥ 389 |
| **F2-10** | `grep -r "from 'axios'"` 在 4 个新 Vue 文件中零命中 |
| **F2-11** | UserList.vue 的密码字段有 `v-if="!editingId"`（编辑模式不显示密码） |
| **F2-12** | RoleList.vue 的 code 字段有 `:disabled="!!editingId"`（编辑时禁用编码） |
| **F2-13** | DeptList.vue 的 `el-table` 有 `row-key="id"` 属性 |
| **F2-14** | 所有删除操作使用 `ElMessageBox.confirm` 确认 |

## 15. 执行回执格式

```markdown
# 执行回执 — Step F2

## 1. Step 编号和名称

## 2. 使用模型

## 3. 实际读取的文件
（逐文件列出）

## 4. 实际修改的文件
（逐文件列出，新建/修改区分）

## 5. 每个文件的修改摘要
（每个文件的行数、组件结构、关键设计点）

## 6. 实际执行的命令
（逐条列出命令及参数）

## 7. 命令输出摘要
（typecheck/lint/test/build 各阶段结果、退出码）

## 8. 与原方案的偏差
（哪些地方和方案不同，为什么）

## 9. 遇到的问题
（技术问题、环境问题、理解偏差等，以及如何解决的）

## 10. 未完成内容

## 11. 验收标准对照
（逐条对照 §14 的 F2-1 ~ F2-14 回答是否满足）

## 12. 测试计数
- typecheck: 通过/失败
- lint: 通过/失败
- test: X spec files / Y tests total, 全绿/有失败
- 新增: +4 spec files / +15 tests

## 13. 风险和注意事项
```

## 16. 测试回执格式

此 Step 的测试为 `pnpm test` 中的页面单测部分。如全部通过且测试计数符合预期（+4 files / +15 tests），即为测试通过。如测试未通过，请提供完整失败信息和堆栈。

## 17. 明确禁止事项

- ❌ 不要修改 `DictTypeList.vue` / `DictTypeList.spec.ts` 或任何已有文件
- ❌ 不要修改 `api/*.ts` / `types/*.ts`（F1 已验收，不可回改）
- ❌ 不要修改 router 配置（视图通过 `import.meta.glob` 自动发现）
- ❌ 不要在 DeptList.vue 中使用 `StandardListTemplate`（树形表格不分页，不兼容）
- ❌ 不要在 PostList.vue 中使用分页之外的交互模式（PostList 就是标准 CRUD）
- ❌ 不要在 UserList.vue 编辑弹窗中显示密码字段
- ❌ 不要使用 `any` 类型
- ❌ 不要使用 `import axios from 'axios'`
- ❌ 不要触碰 `Smart-WorkFlow/` 后端代码
- ❌ 不要在 Vue 文件中硬编码颜色/间距值 — 使用 `var(--sw-*)` CSS 变量
- ❌ 不要创建 router 注册文件或修改路由配置
