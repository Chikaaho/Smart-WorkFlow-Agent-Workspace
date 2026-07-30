# 测试回执

## 1. Step 编号和名称

**Step 3：前端 ProcessDefList 新增"查看流程图"入口**

## 2. 测试环境

| 项目 | 值 |
|------|------|
| 工作目录 | `Smart-WorkFlow-Web/` |
| Node 版本 | v22.15.0 |
| 包管理器 | pnpm 11.8.0 |
| 操作系统 | Linux 5.15.0-181-generic (x86_64) |
| 数据库 | 不适用（前端测试，零后端依赖） |
| Mock 模式 | MSW（dev:mock 模式下激活） |

## 3. 测试前置条件

- Step 1（bpmn viewer 防腐层 `mountBpmnViewer`）— PASSED ✅
- Step 2（后端 `GET /workflow/defs/{id}/bpmn-xml` 端点）— PASSED ✅
- Step 3 执行已通过（执行回执已写入 `step-3-execution.md`）
- 不启动后端服务，纯前端测试（Mock 模式或单元测试隔离）

## 4. 实际执行的测试命令

| # | 命令 | 执行阶段 |
|---|------|:---:|
| 1 | `pnpm typecheck` | §13.1 静态检查 |
| 2 | `pnpm lint` | §13.1 静态检查 |
| 3 | `pnpm lint --fix` | §13.1 静态检查（修复 prettier 格式告警） |
| 4 | `grep -rn "mountBpmn\b\|exportXml" src/modules/workflow/` | §13.1 旧命名残留 |
| 5 | `grep -rn "from '@/adapters/bpmn'" src/modules/workflow/views/ProcessDefList.vue` | §13.1 导入路径检查 |
| 6 | `pnpm test` | §13.2 单元测试 |
| 7 | `pnpm build` | §13.5 回归检查/生产构建 |
| 8 | `timeout 15 pnpm dev:mock` | §13.4 手工验证（开发服务器启动） |

## 5. 各测试项结果

### §13.1 静态检查

| 检查项 | 命令 | 预期结果 | 实际结果 | 通过 |
|------|------|------|:---:|:---:|
| TypeScript 类型检查 | `pnpm typecheck` | 零新增错误 | 零错误 | ✅ |
| ESLint（含架构边界） | `pnpm lint` | 零新增告警 | 零错误、零告警（格式修复后） | ✅ |
| 旧导出残留 | `grep -rn "mountBpmn\b\|exportXml" src/modules/workflow/` | 零命中 | 零命中（exit 1） | ✅ |
| 导入路径检查 | `grep -rn "from '@/adapters/bpmn'" src/modules/workflow/views/ProcessDefList.vue` | ≥1 处 | 2 处（import + import type） | ✅ |

### §13.2 单元测试

| # | 测试用例 | 预期 | 实际 | 通过 |
|---|----------|:---:|:---:|:---:|
| 1 | calls pageProcessDefs on mount | 调用 1 次，参数 { pageNum:1, pageSize:10 } | PASS | ✅ |
| 2 | populates list from API result | list 长度 2，name 正确 | PASS | ✅ |
| 3 | openViewer sets viewer state correctly | viewerVisible=true, loading=true, error='', name 正确 | PASS | ✅ |
| 4 | openViewer calls getProcessDefGraph with row id | 以 PUBLISHED_DEF.id 调用 | PASS | ✅ |
| 5 | calls mountBpmnViewer after API resolves | mountBpmnViewer 被调用，参数含 Element + XML | PASS | ✅ |
| 6 | calls fitViewport after mountBpmnViewer resolves | mockFitViewport 调用 1 次 | PASS | ✅ |
| 7 | sets viewerError on API failure | viewerError = '流程定义未发布' | PASS | ✅ |
| 8 | sets viewerError from Error.message fallback | viewerError = '网络错误' | PASS | ✅ |
| 9 | closeViewer calls destroy and resets state | destroy 1 次，viewerVisible=false，error=''，loading=false | PASS | ✅ |
| 10 | viewerLoading is false after openViewer completes | loading 终态 false | PASS | ✅ |

### §13.3 集成测试

本 Step 不涉及多模块/多表/多服务交互的集成场景。端到端验证留待浏览器环境手工确认（见 §13.4）。

### §13.4 手工验证（dev:mock）

| 验证场景 | 操作步骤 | 预期结果 | 状态 | 说明 |
|------|------|------|:---:|------|
| 开发服务器启动 | `timeout 15 pnpm dev:mock` | Vite 552ms ready | ✅ | 启动无错误 |
| 列表页查看流程图 | `pnpm dev:mock` → 流程定义页 → 点击 PUBLISHED 行"查看流程图" | 弹窗中渲染 BPMN 图（StartEvent → EndEvent） | ⏳ 需肉眼验 | 需用户在浏览器中手动操作 |
| DRAFT 行按钮禁用 | 确认列表中 DRAFT 行按钮灰色不可点击 | 按钮 disabled | ✅ 代码确认 | 模板中 `:disabled="row.status === 'DRAFT'"` |
| 对话框关闭/重复打开 | 打开 → 关闭 → 再次打开 | 无旧图残留、无控制台报错 | ⏳ 需肉眼验 | 需浏览器环境 |

### §13.5 回归检查

| 检查项 | 预期结果 | 实际结果 | 通过 |
|------|------|------|:---:|
| 已有测试文件数不减少 | 第 1 轮 58 文件 → 本轮 ≥58 | 59 文件（新增 1 个） | ✅ |
| 已有测试通过数不减少 | Step 1 的 bpmn adapter 测试仍通过 | 全部 517 通过 | ✅ |
| ProcessDefList 列表功能 | pageProcessDefs mock 正常返回数据 | 测试 #1/#2 验证通过 | ✅ |
| 生产构建 | `pnpm build` 成功 | 构建成功（3.60s） | ✅ |
| chunk 大小异常增长 | bpmn-js 已在 Step 1 纳入 | ProcessDefList chunk 189KB（含 bpmn-js） | ✅ |

## 6. 通过项

全部 10 个单元测试用例通过。全部静态检查项通过。生产构建通过。

## 7. 失败项

无。

## 8. 跳过项及原因

| 跳过项 | 原因 |
|------|------|
| §13.4 手工验证·浏览器操作 | 自动化测试环境无法启动图形化浏览器，需用户在本地 `pnpm dev:mock` 后肉眼验证。已确认 dev:mock 服务器启动正常 |
| 集成测试（§13.3）| 本 Step 不涉及多模块/多表/多服务交互场景，方案原文标注为 N/A |

## 9. 关键日志或错误信息

### ESLint 修复前告警（已修复）
```
src/modules/workflow/views/__tests__/ProcessDefList.spec.ts
  43:16  warning  prettier/prettier  — 模板字符串格式
  45:14  warning  prettier/prettier  — 模板字符串格式
```
修复后：`pnpm lint` 零错误、零告警。

### 生产构建警告（第三方依赖，不影响本项目）
```
[INVALID_ANNOTATION] /* #__PURE__ */ in "@vueuse/core/dist/index.js" — ignored due to position
```
来源：`@vueuse/core` 依赖的 Rolldown 纯注解位置问题。非本项目代码，不影响运行时。

### Vitest 输出摘要
```
Test Files  59 passed (59)
     Tests  517 passed (517)
  Duration  102.63s
```

## 10. 是否满足验收标准

逐条对照 §14 验收标准：

| # | 验收标准 | 验证方式 | 满足 |
|---|------|------|:---:|
| 1 | API 新增 `getProcessDefGraph(id): Promise<string>`，URL 含 `GET /workflow/defs/${id}/bpmn-xml` | grep 函数签名 + URL 字符串 | ✅ |
| 2 | ProcessDefList.vue 新增操作列（第 7 列），含"查看流程图"按钮 | grep `查看流程图` | ✅ |
| 3 | DRAFT 状态行按钮 `disabled` | `row.status === 'DRAFT'` 条件存在 | ✅ |
| 4 | 点击按钮打开 `el-dialog`，标题含流程名称，宽度 900px | 模板中 `el-dialog` + `width="900px"` + `currentDefName` | ✅ |
| 5 | 对话框中调用 `mountBpmnViewer(container, xml)` | 代码中 `mountBpmnViewer` 调用存在 | ✅ |
| 6 | 关闭对话框时 `destroy()` + `viewerInstance = null` | `closeViewer` 函数中 destroy + 置 null | ✅ |
| 7 | 组件卸载时 `onBeforeUnmount` 中防御性 destroy | `onBeforeUnmount` 含 destroy 逻辑 | ✅ |
| 8 | Mock 新增 `GET /api/workflow/defs/:id/bpmn-xml` | grep mock URL 字符串 | ✅ |
| 9 | 新建测试文件至少 7 个 it() 块 | 10 个 it() 块 | ✅ |
| 10 | 四连全绿 | typecheck ✅ lint ✅ test ✅ build ✅ | ✅ |
| 11 | 不新增依赖、不改 `package.json`/`pnpm-lock.yaml` | git diff 不含这两个文件 | ✅ |
| 12 | 不修改 `src/adapters/bpmn/` | diff 显示 `adapters/bpmn/index.ts` 有变化，但均为 Step 1 前置变更（未提交），本 Step 未修改该文件 | ✅* |
| 13 | 后端零改动 | `Smart-WorkFlow/` diff 为空 | ✅ |

> *注：#12 的 `adapters/bpmn/index.ts` diff 来自 Step 1 尚未提交的变更，非本 Step 产生。本 Step 执行过程中未写入该文件。

**验收结论：全部 13 项验收标准满足。**

## 11. 回归风险

| 风险 | 影响 | 缓解措施 |
|------|------|:---:|
| `v-loading` 指令在 jsdom 中不渲染 | 低（仅影响测试） | 不断言 loading DOM 状态，信任 Element Plus 运行时 |
| `el-dialog` 的 `destroy-on-close` + `@closed` 双重清理 | 低 | 已通过测试 #9 验证 `destroy()` 调用路径 |
| bpmn-js 在对话框中渲染尺寸 | 中（用户体验） | `fitViewport()` + `min-height: 500px` 确保渲染空间 |
| 无副作用修改其他模块 | 低 | 仅修改 `workflow/` 下 2 文件 + mock/handlers.ts + 新建测试文件 |
| `components.d.ts` 自动注册 `ElResult` | 无 | unplugin-vue-components 自动行为，不影响运行时 |

## 12. 最终结论

```
PASSED ✅
```

**Summary**：
- 静态检查：全部通过（typecheck ✅、lint ✅、旧名残留检查 ✅、导入路径检查 ✅）
- 单元测试：10/10 通过（59 文件、517 测试全量通过）
- 生产构建：✅（3.60s）
- 验收标准：13/13 满足
- 手工验证：dev:mock 服务启动正常，浏览器肉眼验证待用户在本地执行
