# Step 4：端到端验证

## 1. 当前状态

- **功能名称**：M04-F01-01 BPM 单节点审批前后端联通
- **功能状态**：IN_PROGRESS（本 Step 通过后进入阶段三收尾）
- **功能进度**：Step 0a ✅ · Step 0b ✅ · Step 1 ✅ · Step 2 ✅ · Step 3 ✅
- **Step 位置**：第 4 步 / 共 4 步 — 最终验证步骤，全部通过后进入阶段三（知识沉淀 + 交接）

## 2. Step 目标

对已完成的所有 Step 执行全量回归测试（四连校验门）和全面的 mock 模式手工验收，确保所有 7 个新建文件和 3 个修改文件正确协作，提供端到端的待办审批交互闭环验证。

## 3. 推荐模型

```
推荐模型：deepseek-v4-flash
选择理由：纯验证步骤 —— 无代码编写，执行现有命令、肉眼验收、对照验收标准逐条复核
是否触发升级条件：否
```

## 4. 模型选择理由

Step 4 不涉及任何代码编写，仅为执行命令、肉眼验收、对照验收标准复核。Flash 的推理深度完全足够判断命令输出和 UI 行为是否符合预期。

## 5. 已知上下文

### 5.1 已完成文件清单

**Step 1 — 新建 3 文件 |
**文件 | 说明 |
|------|------|
| `src/contracts/bpm.ts` | TodoTask + ProcessDef 接口 |
| `src/modules/workflow/api/index.ts` | 3 个导出函数（queryTodoTasks / completeTask / pageProcessDefs） |
| `src/modules/workflow/api/index.spec.ts` | 3 个测试用例 |

**Step 1 — 修改 3 文件**

| 文件 | 变更 |
|------|------|
| `src/foundation/mock/seeds.ts` | 菜单 DIRECTORY+2 子 MENU + MOCK_TODO_TASKS（5 条）+ MOCK_PROCESS_DEFS（5 条） |
| `src/foundation/mock/handlers.ts` | 追加 3 个 mock handler（GET todo、POST complete、GET defs page） |
| `src/modules/workflow/views/WorkflowHome.vue` | BlankPage → 空 div fallback |

**Step 2 — 新建 2 文件**

| 文件 | 说明 |
|------|------|
| `src/modules/workflow/views/TodoList.vue` | 待办任务列表页（StandardListTemplate） |
| `src/modules/workflow/views/TodoList.spec.ts` | TodoList 测试 |

**Step 3 — 新建 2 文件**

| 文件 | 说明 |
|------|------|
| `src/modules/workflow/views/ProcessDefList.vue` | 流程定义列表页（StandardListTemplate + 分页） |
| `src/modules/workflow/views/ProcessDefList.spec.ts` | ProcessDefList 测试 |

### 5.2 Mock 交互链路

```
菜单点击「流程引擎」→ DIRECTORY 自动展开
  ├─ 点击「我的待办」→ GET /api/workflow/tasks/todo → 5 条待办列表渲染
  │    └─ 点击「审批通过」→ 确认框 → POST /api/workflow/tasks/{taskId}/complete → 从列表移除
  └─ 点击「流程定义」→ GET /api/workflow/defs?pageNum=1&pageSize=10 → 5 条定义列表渲染（含 DRAFT/PUBLISHED 标签）
```

### 5.3 测试基线演变

| Step | 后基线 |
|------|--------|
| 0b | 33 files / 331 tests |
| 1 | 34 files / 334 tests（+3: api/index.spec.ts） |
| 2 | ≥ 35 files / ≥ 338 tests（+1 spec + ≥ 4 tests） |
| 3 | ≥ 36 files / ≥ 342 tests（+1 spec + ≥ 4 tests） |

## 6. 执行前必须读取的文件

| 优先级 | 文件路径 | 读取原因 |
|--------|----------|----------|
| P0 | `src/contracts/bpm.ts` | 确认接口定义 |
| P0 | `src/modules/workflow/api/index.ts` | 确认 API 函数签名 |
| P0 | `src/modules/workflow/views/TodoList.vue` | 确认待办列表页实现 |
| P0 | `src/modules/workflow/views/ProcessDefList.vue` | 确认流程定义列表页实现 |
| P0 | `src/foundation/mock/seeds.ts`（workflow 菜单部分 + MOCK 数据） | 确认种子数据和菜单结构 |
| P0 | `src/foundation/mock/handlers.ts`（workflow 相关 handler） | 确认 mock 路由 |
| P1 | `src/modules/workflow/views/TodoList.spec.ts` | 确认测试覆盖 |
| P1 | `src/modules/workflow/views/ProcessDefList.spec.ts` | 确认测试覆盖 |

## 7. 允许修改的文件范围

### 修改文件

无。Step 4 是纯验证步骤，不修改任何文件。

**例外**：如果手工验证时需要临时修改 seeds.ts 中的 MOCK_PROCESS_DEFS 条数（从 5 条改为 12 条）来验证分页多页行为，验证后可恢复。

## 8. 禁止修改的范围

- ❌ 所有文件均禁止修改，但允许临时修改 seeds.ts 分页验证数据（验证后恢复）
- ❌ 不允许引入新依赖
- ❌ 不允许修改任何配置文件
- ❌ 不允许修改测试代码
- ❌ 不允许修改组件代码即使发现代码风格偏好问题（bug 除外）

## 9. 详细执行方案

### 9.1 全量回归测试

按顺序执行以下命令，捕获每次的退出码和关键输出：

```bash
# 1. 类型检查
pnpm typecheck

# 2. ESLint
pnpm lint

# 3. 全量测试
pnpm test

# 4. 生产构建
pnpm build
```

**预期结果**：

| 命令 | 期望退出码 | 期望关键输出 |
|------|-----------|-------------|
| pnpm typecheck | 0 | 无类型错误 |
| pnpm lint | 0 | 0 errors, 0 warnings |
| pnpm test | 0 | Test Files ≥ 36 passed, Tests ≥ 342 passed |
| pnpm build | 0 | 构建成功，无错误 |

### 9.2 静态检查

```bash
# 确认 modules/workflow 不直接引用 axios
grep -r "axios" src/modules/workflow/

# 确认所有新建文件存在
ls -la src/contracts/bpm.ts
ls -la src/modules/workflow/api/index.ts
ls -la src/modules/workflow/api/index.spec.ts
ls -la src/modules/workflow/views/TodoList.vue
ls -la src/modules/workflow/views/TodoList.spec.ts
ls -la src/modules/workflow/views/ProcessDefList.vue
ls -la src/modules/workflow/views/ProcessDefList.spec.ts

# 确认无 axios 在 workflow 模块中
grep -r "axios" src/modules/workflow/

# 确认 handlers.ts 和 seeds.ts 中 workflow 相关修改正确
grep -A15 "name: 'workflow'" src/foundation/mock/seeds.ts | head -20
grep -n "MOCK_TODO_TASKS\|MOCK_PROCESS_DEFS" src/foundation/mock/seeds.ts
grep -n "workflow/tasks\|workflow/defs" src/foundation/mock/handlers.ts

# 确认 WorkflowHome.vue 正确（目录 fallback）
cat src/modules/workflow/views/WorkflowHome.vue
```

### 9.3 Mock 模式手工验收

运行 `pnpm dev:mock` 后打开浏览器（通常是 `http://localhost:5173`），验收以下场景：

**场景 A：侧边栏菜单结构**

| 验收项 | 预期 |
|--------|------|
| A1 | 侧边栏可见「流程引擎」菜单项，带 Share 图标 |
| A2 | 点击「流程引擎」→ 展开，显示「我的待办」「流程定义」两个子菜单 |
| A3 | 默认「我的待办」高亮（DIRECTORY 自动重定向到第一个子页） |
| A4 | 点击「流程定义」→ 页面切换到流程定义列表 |

**场景 B：我的待办页面**

| 验收项 | 预期 |
|--------|------|
| B1 | 页面标题显示「我的待办」|
| B2 | 表格显示 5 条待办任务数据 |
| B3 | 列展示：任务编号、表单标识、业务单号、创建时间 |
| B4 | 每行末尾有「审批通过」按钮（type=primary） |
| B5 | 点击「审批通过」→ 确认对话框弹出 |
| B6 | 点取消 → 对话框关闭，任务不变 |
| B7 | 点确定 → 提示「审批通过」，该行从列表消失 |
| B8 | 连续审批所有 5 条 → 列表变为空态 |
| B9 | 空态显示标准空态占位 |

**场景 C：流程定义页面**

| 验收项 | 预期 |
|--------|------|
| C1 | 页面标题显示「流程定义」|
| C2 | 表格显示 5 条流程定义数据 |
| C3 | 列展示：流程名称、流程标识、关联表单、版本、状态、更新时间 |
| C4 | DRAFT 状态显示灰色「草稿」标签 |
| C5 | PUBLISHED 状态显示绿色「已发布」标签 |
| C6 | 分页区域显示「共 5 条」（因 pageSize=10 > total=5，仅显示条数） |

**场景 D：分页验证（需临时修改 seeds.ts，验证后恢复）**

修改 `seeds.ts` 中 `MOCK_PROCESS_DEFS` 数组，复制已有条目使其 ≥ 12 条：

```typescript
// 临时 —— 分页多页验证。验证后恢复为 5 条。
export const MOCK_PROCESS_DEFS = [
  ...BASE_DEFS,  // 原有的 5 条
  ...BASE_DEFS,  // 重复一遍变成 10 条
  ...BASE_DEFS.slice(0, 2),  // 再加 2 条到 12 条
]
```

刷新页面后验证：

| 验收项 | 预期 |
|--------|------|
| D1 | 分页显示「共 12 条」|
| D2 | 第 1 页显示 10 条，页码 1 高亮 |
| D3 | 点击第 2 页 → 显示剩余 2 条 |
| D4 | 切换 pageSize 为 20 → 12 条都在 1 页 |

验证完成后**必须恢复** `MOCK_PROCESS_DEFS` 为原始的 5 条数据。

**所有 mock 验证通过后，停止 dev server（Ctrl+C）。**

### 9.4 后端回归检查

如果后端环境可用，执行：

```bash
cd Smart-WorkFlow
mvn -q compile && mvn -q test
```

确保后端回归测试不受前端改动影响（预期：7 模块 111 tests 全部通过）。

## 10. 关键实现约束

### 10.1 验收标准约束

- ✅ **全量回归**：必须执行完整的四连校验门（typecheck + lint + test + build），不得跳过任一项
- ✅ **基线核算**：必须报告精确的测试文件数和测试用例数，与基线演算对比
- ✅ **手工验收**：至少完成场景 A/B/C 的验收，场景 D 可选（分页验证依赖临时修改数据）
- ✅ **所有场景截图或文字记录**：逐条记录每个验收项的通过/失败状态
- ❌ **不能跳过手工验收直接声称功能完成**：S1-10、S2-14、S3-13 均依赖手工验收

### 10.2 返回约束

- ✅ 所有验收结果必须**逐条记录**，不能笼统说"都通过了"
- ✅ 失败项必须记录**失败详情**（实际行为 vs 预期行为）
- ✅ 必须附上**退出码和测试计数**，不能只说"通过了"

## 11. 边界情况

| 场景 | 预期行为 |
|------|----------|
| pnpm test 计数与基线不一致 | 计算差值（新增 - 预期新增 = 差异），判断是否合法 |
| 某个文件在之前的 Step 中被意外修改 | 重新读取该文件，与方案对比 |
| dev:mock 无法启动 | 检查 node_modules 和端口占用（5173），提供解决方案 |
| 侧边栏菜单不展开 | 检查 seeds.ts 中 menuType=0（DIRECTORY）配置，确认子菜单 parentId 正确 |
| 审批通过后任务不消失 | 检查 mock handler 中 splice 逻辑是否正确，检查 TodoList.vue 中 filter 逻辑 |
| 流程定义分页不显示 | 检查 pageProcessDefs 的 adaptPage 是否将 records → list |
| 后端测试失败（回归） | 标记 BLOCKED，分析失败原因，如果是前端 mock 数据流通问题导致的则修复 |

## 12. 风险和回滚方案

| 风险 | 概率 | 应对 |
|------|------|------|
| dev:mock 启动后菜单不按预期渲染 | 低 | 检查 seeds.ts 中 menuType、component、path、parentId |
| 测试计数精确匹配困难 | 中 | 以 pnpm test 输出为准，误差在 ±2 内可接受 |
| hander 的 URL pattern 匹配问题 | 低 | :param 语法检查，/api/workflow/ 前缀确认 |
| 前端类型错误在 build 时才发现 | 低 | typecheck 应先于 build 暴露 |

**回滚方案**：如果验收不通过，根据失败原因定位到对应 Step，回到该 Step 重新修正后再次执行 Step 4。

## 13. 测试方案

### 13.1 静态检查

- `grep -r "axios" src/modules/workflow/` → 零命中（整个 workflow 模块无 axios 直接引用）
- `grep -rn "TodoList\|ProcessDefList" src/modules/workflow/` → 确认所有组件符合预期

### 13.2 全量回归测试

| 命令 | 预期 |
|------|------|
| pnpm typecheck | 退出码 0 |
| pnpm lint | 0 errors, 0 warnings |
| pnpm test | ≥ 36 files, ≥ 342 tests, 0 failures |
| pnpm build | 退出码 0 |

### 13.3 手工验证

详见 §9.3 Mock 模式手工验收（场景 A/B/C/D）。

### 13.4 回归检查

- 后端 `mvn -q compile && mvn -q test` → BUILD SUCCESS（111 tests 全通过）
- 前端 Step 1/2/3 的所有测试仍在通过
- 已有 form 模块测试无退化

## 14. 验收标准

### 14.1 回归验收

| 编号 | 标准 | 验证方式 |
|------|------|----------|
| S4-1 | pnpm typecheck 退出码 0 | 命令执行 |
| S4-2 | pnpm lint 退出码 0 | 命令执行 |
| S4-3 | pnpm test 退出码 0，files ≥ 36，tests ≥ 342 | 命令执行 |
| S4-4 | pnpm build 退出码 0 | 命令执行 |
| S4-5 | grep "axios" src/modules/workflow/ 零命中 | grep 命令 |
| S4-6 | 7 个新建文件全部存在 | ls 命令 |
| S4-7 | 后端回归测试 111 tests 全部通过（如环境可用） | mvn 命令 |

### 14.2 手工验收

| 编号 | 标准 | 验证方式 |
|------|------|----------|
| S4-8 | 菜单 A1-A4：流程引擎 DIRECTORY 展开 + 两个子菜单 | pnpm dev:mock 肉眼验证 |
| S4-9 | 待办 B1-B9：列表渲染 → 审批通过 → 确认 → 移除 → 空态 | pnpm dev:mock 肉眼验证 |
| S4-10 | 流程定义 C1-C6：列表渲染 + 状态标签 + 分页条数 | pnpm dev:mock 肉眼验证 |
| S4-11 | 分页 D1-D4（可选）：多页验证（pageSize 切换、翻页） | pnpm dev:mock（临时改 seeds.ts） |

### 14.3 功能完整性验收

| 编号 | 标准 | 验证方式 |
|------|------|----------|
| S4-12 | 所有 Step 验收标准均已满足（S1-1~S1-10、S2-1~S2-14、S3-1~S3-13） | 逐 Step 复核 |

## 15. 执行回执格式

```markdown
# 执行回执 — Step 4 端到端验证

## 1. Step 编号和名称
Step 4：端到端验证

## 2. 当前环境
- Node 版本：
- pnpm 版本：
- 操作系统：

## 3. 全量回归结果

| 命令 | 退出码 | 关键输出 |
|------|:---:|----------|
| pnpm typecheck | | |
| pnpm lint | | |
| pnpm test | | Test Files X passed, Tests Y passed, duration |
| pnpm build | | |

## 4. 静态检查结果
- grep axios workflow/：
- 7 个文件全部存在：
- seeds.ts 菜单结构：

## 5. 手工验证记录

### 场景 A：菜单结构
- A1 流程引擎菜单可见：✅ / ❌
- A2 展开显示子菜单：✅ / ❌
- A3 默认我的待办高亮：✅ / ❌
- A4 切换流程定义正常：✅ / ❌

### 场景 B：我的待办
- B1-B9（逐条记录）

### 场景 C：流程定义
- C1-C6（逐条记录）

### 场景 D：分页（可选）
- D1-D4（逐条记录）

## 6. 后端回归结果（如果有）
- mvn compile: exit code
- mvn test: exit code, X tests passed

## 7. 验收标准逐项对照
- S4-1 ✅ / ❌
- ...（逐条列出）

## 8. 遇到的问题
（如果有）

## 9. 总结
- 功能完成度评估：
- 已知问题：
- 建议：
```

## 16. 测试回执格式

（此 Step 执行与测试合一，执行回执中已包含测试和手工验收结果）

## 17. 明确禁止事项

- ❌ 不要修改任何文件（除非临时修改 seeds.ts 做分页验证，验证后必须恢复）
- ❌ 不要添加新功能
- ❌ 不要修复代码风格问题
- ❌ 不要修改测试代码
- ❌ 不要修改配置文件
- ❌ 不要修改 router/index.ts
- ❌ 不要重启已有的 dev:mock 进程之外的任何服务
- ❌ 不要使用 pnpm dev 代替 pnpm dev:mock
- ❌ 不要手工修改 node_modules 或 lockfile
- ❌ 不要以"顺便修复"为由扩大验证范围
