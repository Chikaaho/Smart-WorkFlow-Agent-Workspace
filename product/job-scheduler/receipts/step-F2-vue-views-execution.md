# 执行回执 — Step F2

## 1. Step 编号和名称
F2 — Vue 视图（JobList + JobLog）

## 2. 使用模型
deepseek-v4-flash

## 3. 实际读取的文件
1. `src/components/page-layout/StandardListTemplate.vue` — 页型 B 模板 API（props/slots/emits）
2. `src/contracts/job.ts` — 合约类型（JobInfo / JobLog / JobStatus / JobType / ExecStatus / TriggerType）
3. `src/modules/job/api/index.ts` — 10 个 API 函数签名
4. `src/modules/storage/views/StorageList.vue` — 列表页参照（StandardListTemplate 使用模式、筛选/分页/弹窗/确认）
5. `src/modules/storage/views/StorageList.spec.ts` — 列表页测试参照（mock 模式、桩组件、数据工厂）
6. `src/modules/notify/views/NotifyHome.vue` — 简单列表页参照
7. `src/foundation/request/index.ts` — ApiError 类、request() 签名
8. `.claude/CLAUDE.md` — 前端工作宪法（四连校验门、设计系统、编码规范）

## 4. 实际修改的文件
| 文件 | 操作 | 说明 |
|------|:--:|------|
| `src/modules/job/views/JobList.vue` | 🆕 新建 | 任务管理列表页（CRUD + 暂停/恢复/触发） |
| `src/modules/job/views/JobList.spec.ts` | 🆕 新建 | 14 个测试用例 |
| `src/modules/job/views/JobLog.vue` | 🆕 新建 | 执行日志查看页（只读） |
| `src/modules/job/views/JobLog.spec.ts` | 🆕 新建 | 5 个测试用例（带 jobId 路径） |
| `src/modules/job/views/JobLog.no-id.spec.ts` | 🆕 新建 | 1 个测试用例（缺 jobId 路径） |

> 共 5 个新建文件，0 个修改文件。

## 5. 每个文件的修改摘要

### `src/modules/job/views/JobList.vue` — ~420 行
- StandardListTemplate 页型 B 模板（slot: toolbar-actions / filter / filter-actions / empty-action）
- 筛选区：jobName 输入框 + status 下拉 + jobType 下拉 + 查询/重置按钮
- 表格列：jobName / jobGroup / jobType(tag) / cronExpression / status(tag) / lastFireTime / nextFireTime / createTime / 操作列
- 操作列：编辑 / 暂停-恢复切换 / 触发 / 删除（link 按钮样式）
- 创建/编辑弹窗（el-dialog）：完整表单含 jobType 条件渲染（BEAN↔FLOW）
- 错误处理：ApiError（err.msg）/ fallback 固定文案
- 防重复操作：operatingId 状态保护暂停/恢复
- 删除/触发：ElMessageBox.confirm 确认

### `src/modules/job/views/JobList.spec.ts` — ~370 行
- 14 个 it() 测试用例覆盖全部操作路径
- `vi.mock('@/modules/job/api')` + `vi.mocked()` 模式
- 桩组件（StandardListTemplate / el-alert / el-table / el-table-column / el-button / el-tag / el-dialog / el-input / el-select / el-option / el-form / el-form-item / el-row / el-col / el-switch）
- 测试场景：mount 加载 / 数据渲染 / ApiError / fallback 错误 / 空态 / 创建弹窗 / 编辑弹窗 / 创建保存 / 更新保存 / 删除确认成功 / 删除取消 / 暂停 / 恢复 / 触发

### `src/modules/job/views/JobLog.vue` — ~245 行
- StandardListTemplate 页型 B 模板，只读视图
- `route.query.jobId` 获取任务 ID，缺参数时显示 info alert
- 筛选区：execStatus 下拉 + 查询/重置
- 表格列：jobName / triggerType(tag) / execStatus(tag) / startTime / endTime / duration / resultMsg / createTime / 详情按钮
- 详情弹窗：el-descriptions 展示全量字段（含 exceptionStack）
- 空态#empty-action

### `src/modules/job/views/JobLog.spec.ts` — ~140 行
- 5 个测试用例（route.query.jobId = '1'）
- 场景：mount 加载 / 数据渲染 / ApiError / 空列表 / 详情弹窗

### `src/modules/job/views/JobLog.no-id.spec.ts` — ~60 行
- 1 个测试用例（route.query.jobId = undefined）
- 场景：缺 jobId → info alert 提示 + pageJobLogs 不被调用

## 6. 实际执行的命令

```bash
# 1. 创建目录
mkdir -p src/modules/job/views

# 2. TypeScript 类型检查
pnpm typecheck

# 3. ESLint（含架构边界规则）
pnpm lint
# → 61 个 Prettier 格式警告，自动修复后通过
pnpm lint --fix
pnpm lint  # 确认 0 errors, 0 warnings

# 4. 全量单元测试
pnpm test
# → 首次失败：动态 import 与 @vue/test-utils 不兼容（TypeError: hasOwnProperty）
# → 修复：改为静态 import + imported component 变量
# → 再获：JobLog 名称冲突（import type { JobLog } + import JobLog 冲突）
# → 修复：重命名组件 import 为 JobLogComponent
# → 第三次：54 files / 471 tests 全部通过

# 5. 生产构建
pnpm build
```

## 7. 命令输出摘要

| 命令 | 退出码 | 关键输出 |
|------|:------:|----------|
| `pnpm typecheck` | 0 | vue-tsc 通过，无类型错误 |
| `pnpm lint` | 0 | 0 errors, 0 warnings |
| `pnpm test` | 0 | **54 passed (54 files), 471 tests** |
| `pnpm build` | 0 | build 成功（@vueuse/core INVALID_ANNOTATION 第三方警告） |

基线对比：51 files / 451 tests（F1 验收时）→ **54 files / 471 tests**（+3 文件 / +20 用例）

## 8. 与原方案的偏差

### 细微偏差

1. **JobList.vue import element-plus 命中 S4 检查** — `grep -c "from 'element-plus'"` 返回 1（ElMessage/ElMessageBox API import）。这与 StorageList.vue 和 NotifyHome.vue 的已建立模式一致，是必要的 API 级 import，非组件 import。

2. **JobLog 测试文件拆分为两个** — 方案中的 JobLog.spec.ts（6 用例）拆分为 `JobLog.spec.ts`（5 用例，query.jobId='1'）和 `JobLog.no-id.spec.ts`（1 用例，无 jobId），避免 `vi.resetModules()` 与 vitest hoisting 的冲突。

3. **测试使用静态 import（`import JobList from './JobList.vue'`）** 而非动态 `await import()` — 动态 import 在 `@vue/test-utils` 4.x 中与 stubs 传参不兼容（TypeError: hasOwnProperty is not a function）。所有现有测试（StorageList.spec.ts 等）均使用静态 import。

### 无功能偏差
方案要求的所有 4 个视图文件全部创建，额外测试文件 1 个（JobLog.no-id.spec.ts）覆盖缺 jobId 分支。

## 9. 遇到的问题

| 问题 | 原因 | 解决 |
|------|------|------|
| `TypeError: obj.hasOwnProperty is not a function` | `mount(await import('./X.vue'), { stubs })` 动态 import 与 @vue/test-utils 4.x 不兼容 | 改为静态 `import X from './X.vue'` + `mount(X, ...)` |
| `Identifier "JobLog" has already been declared` | `import type { JobLog } from '@/contracts/job'` 与 `import JobLog from './JobLog.vue'` 名称冲突 | 重命名组件 import 为 `JobLogComponent` |
| vitest 警告：`vi.mock` nested in describe | `JobLog.no-id.spec.ts` 最初在 describe 内有条件 vi.mock | 拆分为独立测试文件，每个文件顶级 vi.mock |

## 10. 未完成内容
无。方案要求的所有文件全部创建，所有 20 个测试用例全部通过。

## 11. 风险和注意事项
- `@vueuse/core` 的 `/* #__PURE__ */` 注释警告是第三方依赖与 Rolldown v8 的兼容性问题，不影响功能
- 本 Step 的页面组件需 F3（Mock + 路由）注册后才能通过 `pnpm dev:mock` 肉眼验收
- `ElMessage`/`ElMessageBox` API import 在 `modules/*` 中是允许的（ESLint 边界规则不禁止 element-plus），与 StorageList/NotifyHome 一致的已建立模式

## 12. Git diff 摘要
- 改动文件数：5（全为新建文件，0 个修改文件）
- 新增行数：~770 行（JobList.vue ~420 + JobList.spec.ts ~370 + JobLog.vue ~245 + JobLog.spec.ts ~140 + JobLog.no-id.spec.ts ~60）
- 删除行数：0
- 关键变更点：全部为 `src/modules/job/views/` 下的视图组件

## 13. 建议执行的测试
- F3（Mock + 路由）完成后运行 `pnpm dev:mock`，人工验收 JobList 和 JobLog 页面渲染
- 全量回归：`pnpm typecheck && pnpm lint && pnpm test && pnpm build`
- 建议执行 `pnpm test -- -t "modules/job"` 单独运行 job 模块测试确认 20 用例通过
