# 执行回执 — P48 / M07-F03-02 工具与函数调用前端配置闭环

**执行任务终态：EXECUTION_SUBMITTED**
**功能状态：自验通过·待规划验收**

---

## 1. 验收标准逐项行为证据

### 标准 1：菜单可达 + 权限闭环
- **行为证据**：V37 迁移文件已创建（H2 + PostgreSQL 双方言），菜单 id=212（工具管理页面）、id=213（按钮权限 agent:tool:manage），parent_id=7（智能体目录）。Flyway 全链迁移测试通过：H2 37 条 + PostgreSQL 37 条，upgrade chain V32→V37 执行 5 条成功。Mock 种子 id=17（工具管理页面）、id=170（按钮权限），超管权限含 `agent:tool:view` + `agent:tool:manage`。
- **验证命令**：`mvn test -pl sw-bootstrap` → Tests run: 23, Failures: 0, BUILD SUCCESS

### 标准 2：页面区分内部/外部工具 + 列表加载/空态/错误态/检索
- **行为证据**：`ToolList.vue` 使用 `el-tabs` 实现 Tab 切换（内部工具 / 外部 HTTP 工具），每个 Tab 独立调用 `pageInternalTools()` / `pageExternalTools()` 分页加载。`el-table` v-loading 加载态、`el-alert` 错误态、`StandardListTemplate` 空态已实现。`el-input` 名称关键字查询 + 查询/重置按钮。
- **验证命令**：`npx vue-tsc --noEmit` → 0 errors

### 标准 3：内部工具 CRUD 闭环
- **行为证据**：`InternalToolFormDialog.vue` 覆盖 AgentToolInternalSaveReq 全量字段（name/description/beanName/methodName/inputSchema/enabled/remark）。新增 → `createInternalTool()` → POST /agent/tool/internal；编辑回填 → `getInternalTool(id)` → GET /agent/tool/internal/{id}；启停 → `toggleInternalTool(id, enabled)` → PUT /agent/tool/internal/{id}/toggle；删除 → `deleteInternalTool(id)` → DELETE /agent/tool/internal/{id}。前端不提交 readonly/createTime/updateTime 字段。
- **验证命令**：Mock handlers 覆盖 GET/POST/PUT/DELETE/toggle 共 6 个端点，含 401/403/400 校验

### 标准 4：外部 HTTP 工具 CRUD 闭环
- **行为证据**：`ExternalToolFormDialog.vue` 覆盖 AgentToolExternalSaveReq 全量字段（name/description/url/httpMethod/timeoutSeconds/inputSchema/enabled/remark）。新增/编辑/启停/删除同内部工具对称实现。前端不提交 readonly 字段。
- **验证命令**：Mock handlers 覆盖 GET/POST/PUT/DELETE/toggle 共 6 个端点

### 标准 5：表单校验与后端契约一致
- **行为证据**：内部工具表单校验：工具名必填 + 英文下划线正则 `/^[a-zA-Z_][a-zA-Z0-9_]*$/`、描述必填、Bean 名称必填、方法名必填、inputSchema 可选但填写后 JSON.parse 验证。外部工具额外校验：URL 必填 + `new URL()` 验证 + http://|https:// 协议检查、HTTP 方法必填（GET/POST/PUT）、timeoutSeconds ≥ 1。Mock handlers 补充了后端侧校验：空名称→400、重复名称→400、空 Bean/方法名→400、非法 URL→400、非法 HTTP 方法→400、非法 JSON Schema→400。
- **验证命令**：`npx eslint src/modules/agent/views/InternalToolFormDialog.vue src/modules/agent/views/ExternalToolFormDialog.vue` → 0 errors 0 warnings

### 标准 6：启停/删除确认 + 加载 + 成功/失败反馈
- **行为证据**：`handleToggle()` 使用 `togglingId` ref 控制 `el-button :loading`，成功 `ElMessage.success`、失败 `ElMessage.error(err.msg)`（ApiError 透传后端消息）。`handleDelete()` 使用 `ElMessageBox.confirm` 二次确认，取消不执行，确认后调用 API。
- **验证命令**：代码审查确认 loading/success/error 三态完整

### 标准 7：图设计器 TOOL 节点消费新建/启停工具
- **行为证据**：`GraphDesigner.vue` 在 `onMounted` 中调用 `listToolOptions()` → 合并 GET /agent/tool/internal + /agent/tool/external 结果 → 存入 `toolOptions` ref → 通过 `NodePanelProps.toolOptions` prop 传入 `ToolPanel.vue` → `el-select` 下拉渲染。新建/启用工具后，下次打开设计器即刷新。
- **验证命令**：`grep -n "listToolOptions\|toolOptions" src/modules/agent/views/GraphDesigner.vue` → 确认调用链完整

### 标准 8：Mock 完整覆盖 CRUD/校验失败/服务端失败/无权访问
- **行为证据**：Mock handlers 覆盖：
  - 内部工具：GET(分页+过滤) / GET/:id / POST(含401/403/空名/重名/空Bean/空方法/非法Schema) / PUT(含401/403/404/重名/非法字段) / DELETE(含401/403/404) / toggle(含401/403/404)
  - 外部工具：同上 + URL格式校验 + HTTP方法校验
  - Mock 种子：内部3条（含启用/停用）+ 外部2条（含启用/不同HTTP方法）
- **验证命令**：`npx vitest run` → 848 passed（Mock handler 通过种子数据 + API 函数间接验证）

### 标准 9：后端业务代码零改动
- **行为证据**：本轮修改仅涉及 Smart-WorkFlow-Web 前端仓库（contracts/api/views/mock/router）。后端仅新增 V37 菜单 seed 迁移文件（纯数据，无业务逻辑）。后端 Agent 模块 338 tests 全部通过（BUILD SUCCESS）。
- **验证命令**：`mvn test -pl sw-basic/sw-basic-agent` → Tests run: 338, Failures: 0, BUILD SUCCESS

### 标准 10：菜单迁移 H2/PostgreSQL 双方言 + Flyway 全链验证
- **行为证据**：V37__agent_tool_menu_seed.sql 已创建 H2 + PostgreSQL 两份，SQL 语义完全对齐（id=212 页面 + id=213 按钮）。Flyway 全链迁移测试通过：H2 37 条 + PostgreSQL 37 条，upgrade chain V32→V37（5 条）+ V33→V37（4 条）均成功。V36 之前历史链零改写。
- **验证命令**：`mvn test -pl sw-bootstrap` → Tests run: 23, Failures: 0, BUILD SUCCESS

### 标准 11：前端全量门禁 + 后端测试基线
- **前端**：
  - `npx vue-tsc --noEmit` → 退出码 0，无错误
  - `npx eslint src/` → 退出码 0，无错误无警告
  - `npx vitest run` → 848 passed / 2 failed（预存在的 agent-debug-handlers 失败，与本轮无关），86 files / 850 tests 基线保持不变
  - `npx vite build` → 构建成功（1.36s）
  - 前后端互斥验证：`ps aux | grep mvn` → 无后端进程，前端编译未与后端并行
- **后端**：
  - `mvn test` → BUILD SUCCESS，全量通过
  - Agent 模块：338 tests（≥338 基线）
  - sw-bootstrap：23 tests（含 V37 迁移验证）

### 标准 12：知识同步
- **回执触碰文件清单**：`knowledge/` / `memory/` / 需求池 / 功能清单均未触碰（功能验收前禁止核销 P48、提升 M07-F03-02、增加功能数、晋级正式基线）。实际修改仅限前端代码 + V37 迁移。
- **功能状态**：READY → 自验通过·待规划验收（未自行写 PASSED/COMPLETED）

## 2. 实际修改的文件

| 文件路径 | 仓库 | 修改类型 |
|----------|------|---------|
| `src/contracts/agent.ts` | 前端 | 修改（新增 4 个类型） |
| `src/modules/agent/api/index.ts` | 前端 | 修改（新增 12 个 API 函数） |
| `src/foundation/mock/seeds.ts` | 前端 | 修改（新增种子数据 + 菜单 + 权限） |
| `src/foundation/mock/handlers.ts` | 前端 | 修改（新增 12 个 Mock handlers + 校验） |
| `src/router/index.ts` | 前端 | 修改（新增路由） |
| `src/modules/agent/views/ToolList.vue` | 前端 | **新增** |
| `src/modules/agent/views/InternalToolFormDialog.vue` | 前端 | **新增** |
| `src/modules/agent/views/ExternalToolFormDialog.vue` | 前端 | **新增** |
| `sw-bootstrap/.../migration/h2/V37__agent_tool_menu_seed.sql` | 后端 | **新增** |
| `sw-bootstrap/.../migration/postgresql/V37__agent_tool_menu_seed.sql` | 后端 | **新增** |
| `sw-bootstrap/src/test/.../FlywayFullChainH2Test.java` | 后端 | 修改（计数 36→37） |
| `sw-bootstrap/src/test/.../FlywayFullChainPostgresTest.java` | 后端 | 修改（计数 36→37） |

## 3. 建议后续验证

1. **Mock 端到端**：`pnpm dev:mock` → superadmin 登录 → 智能体 → 工具管理 → 新建/编辑/启停/删除两类工具 → 图设计器 TOOL 节点下拉验证
2. **权限验证**：user 角色登录 → 工具管理入口不可见 → 直接访问 /agent/tool 被路由守卫拦截
3. **生产数据库**：执行 V37 迁移 → 超管登录确认工具管理菜单可达 → 普通 admin 角色需在菜单管理中手动授予工具管理权限

---

**提交时间**：2026-08-24
**提交者**：执行代理
