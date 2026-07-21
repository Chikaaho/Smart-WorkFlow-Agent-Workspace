# Step 2：通知列表页

## 1. 当前状态

M02-F01-01 通知模块前端落地，已通过 Step 0 和 Step 1。

已完成：
- `src/contracts/notify.ts` — NotifyMessage 类型定义
- `src/modules/notify/api/index.ts` — queryNotifyMessages / markAsRead API 函数
- `src/modules/notify/api/index.spec.ts` — API 层单测 ✅
- `seeds.ts` — MOCK_NOTIFY_MESSAGES 种子数据 + `notify:view` 权限
- `handlers.ts` — GET /notify/messages + POST /notify/messages/:id/read mock handler

本 Step 替换 `NotifyHome.vue` 的 `<BlankPage />` 为真实通知列表页。

## 2. Step 目标

实现通知列表页，支持：
- 加载并展示当前用户通知列表（标准页型 B 表格布局）
- 已读/未读视觉区分（左侧圆点指示器）
- bizType 中文标签（WF_TODO→流程待办、WF_APPROVED→审批结果）
- 点击单行「标记已读」按钮 → POST `/notify/messages/{id}/read` → 更新行状态
- 新增前端单测覆盖页面行为

## 3. 推荐模型

```
推荐模型：deepseek-v4-flash
选择理由：纯前端页面实现，严格遵循 TodoList/ProcessDefList 模式，无架构决策
是否触发升级条件：否
```

## 4. 模型选择理由

本 Step 为 StandardListTemplate（页型 B）的再次实例化，模式与 TodoList 高度相似，改动范围和交互逻辑明确。

## 5. 已知上下文

- **页型 B 模式**：StandardListTemplate（props：title/total/pageNum/pageSize/empty；slots：default + empty-action）
- **参考组件**：`TodoList.vue` — 实现待办列表 + 操作按钮 + el-table
- **API**：`queryNotifyMessages()` → `NotifyMessage[]`；`markAsRead(id: number)` → `void`
- **数据不分页**：后端返回平铺列表，前端用 `pageSize=9999` + CSS `display:none` 隐藏分页
- **bizType 映射**：WF_TODO→流程待办(warning tag)、WF_APPROVED→审批结果(success tag)
- **当前 NotifyHome.vue**：直接替换其 `<script setup>` 和 `<template>`，保留文件名

## 6. 执行前必须读取的文件

| # | 文件 | 原因 |
|---|------|------|
| 1 | `src/modules/workflow/views/TodoList.vue` | 主要参考：页型 B + 操作按钮 + 状态管理 |
| 2 | `src/modules/workflow/views/ProcessDefList.vue` | 参考：状态映射 + 分页处理 |
| 3 | `src/modules/notify/views/NotifyHome.vue` | 当前内容，将被完整替换 |
| 4 | `src/modules/notify/api/index.ts` | API 函数签名确认 |
| 5 | `src/contracts/notify.ts` | NotifyMessage 类型确认 |
| 6 | `src/components/page-layout/StandardListTemplate.vue` | 模板 props/slots 确认 |

## 7. 允许修改的文件范围

### 修改文件（1 个）

| 文件 | 操作 |
|------|:----:|
| `Smart-WorkFlow-Web/src/modules/notify/views/NotifyHome.vue` | 完整重写（保留文件名） |

### 新建文件（1 个）

| 文件 | 操作 |
|------|:----:|
| `Smart-WorkFlow-Web/src/modules/notify/views/NotifyHome.spec.ts` | 新建（页面单测） |

## 8. 禁止修改的范围

- ❌ 不修改 `seeds.ts` / `handlers.ts`（Step 1 已就绪）
- ❌ 不修改 contracts / API 层
- ❌ 不修改其他模块文件
- ❌ 不修改基础设施（request / mock / router / layout）

## 9. 详细执行方案

### 9.1 NotifyHome.vue 完整实现

**Script 部分：**

```typescript
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { StandardListTemplate } from '@/components/page-layout'
import { queryNotifyMessages, markAsRead } from '@/modules/notify/api'
import { ApiError } from '@/foundation/request'
import type { NotifyMessage } from '@/contracts/notify'

// bizType → 中文映射
const BIZ_TYPE_MAP: Record<string, { label: string; tagType: 'warning' | 'success' }> = {
  WF_TODO: { label: '流程待办', tagType: 'warning' },
  WF_APPROVED: { label: '审批结果', tagType: 'success' },
}

// 状态
const list = ref<NotifyMessage[]>([])
const total = ref(0)
const loading = ref(false)
const errorMsg = ref('')
const readingId = ref<number | null>(null)  // 正在标记已读的 id

const isEmpty = computed(() => !loading.value && !errorMsg.value && list.value.length === 0)

// 不分页
const pageNum = ref(1)
const pageSize = ref(9999)

async function loadList() { ... }  // 同 TodoList 模式
function getBizTypeInfo(bizType: string) { return BIZ_TYPE_MAP[bizType] ?? { label: bizType, tagType: 'info' } }

async function handleMarkRead(row: NotifyMessage) {
  if (row.read || readingId.value !== null) return
  readingId.value = row.id
  try {
    await markAsRead(row.id)
    row.read = true  // 直接在原对象上更新
    ElMessage.success('已标记已读')
  } catch (err) {
    if (err instanceof ApiError) ElMessage.error(err.msg)
    else ElMessage.error('操作失败')
  } finally {
    readingId.value = null
  }
}

onMounted(loadList)
```

**Template 部分：**

```vue
<StandardListTemplate
  title="通知"
  :total="total"
  :page-num="pageNum"
  :page-size="pageSize"
  :empty="isEmpty"
>
  <template #empty-action><span /></template>

  <el-alert v-if="errorMsg" ... />

  <el-table v-loading="loading" :data="list" stripe style="width: 100%">
    <!-- 已读/未读指示列 -->
    <el-table-column width="40">
      <template #default="{ row }">
        <span v-if="!row.read" class="unread-dot" />
      </template>
    </el-table-column>
    <!-- 标题 -->
    <el-table-column prop="title" label="标题" min-width="200" />
    <!-- 内容预览 -->
    <el-table-column label="内容" min-width="300">
      <template #default="{ row }">
        <span class="content-preview">{{ row.content }}</span>
      </template>
    </el-table-column>
    <!-- 类型标签 -->
    <el-table-column label="类型" width="120">
      <template #default="{ row }">
        <el-tag :type="getBizTypeInfo(row.bizType).tagType" size="small">
          {{ getBizTypeInfo(row.bizType).label }}
        </el-tag>
      </template>
    </el-table-column>
    <!-- 时间 -->
    <el-table-column prop="createTime" label="时间" width="180" />
    <!-- 操作 -->
    <el-table-column label="操作" width="120" fixed="right">
      <template #default="{ row }">
        <el-button
          v-if="!row.read"
          size="small"
          type="primary"
          :loading="readingId === row.id"
          :disabled="readingId !== null"
          @click="handleMarkRead(row)"
        >
          标记已读
        </el-button>
        <span v-else class="read-text">已读</span>
      </template>
    </el-table-column>
  </el-table>
</StandardListTemplate>

<style scoped>
.unread-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--el-color-primary, #7e306b);
}
.content-preview {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
  max-width: 100%;
  color: var(--sw-text-secondary, #909399);
  font-size: 13px;
}
.read-text {
  color: var(--sw-text-placeholder, #a8abb2);
  font-size: 13px;
}
</style>
```

### 9.2 NotifyHome.spec.ts 测试用例

至少 4 个测试用例：

1. **加载列表并渲染** — mock request 返回 5 条数据 → 验证 el-table 渲染行数
2. **加载失败显示错误提示** — mock request reject ApiError → 验证 el-alert 出现
3. **标记已读成功** — mock markAsRead 成功 → 验证行状态变为「已读」
4. **空列表显示空态** — mock request 返回空数组 → 验证无数据渲染

## 10. 关键实现约束

- **直接修改 `row.read = true`**：在 el-table 的 data 上直接修改属性，Vue 的 reactivity 能检测到数组项属性变化
- **未读圆点使用 `:style` 而非 `class`** 以适配 Element Plus 已读/未读状态。使用 `v-if="!row.read"` 控制显示
- **防重复点击锁**：`readingId` 锁前置（如 `if (readingId.value !== null) return`），防止快速点击多次触发 API
- **不分页样式**：使用 `:deep(.list-pagination) { display: none }` 隐藏分页条（与 TodoList 一致）
- **无需确认弹框**：标记已读不需要确认框，直接调用 API（区别于 TodoList 的审批通过需确认）
- `**loadList` 中处理 ApiError 和兜底错误消息**

## 11. 边界情况

- **空列表**：显示空态占位（StandardListTemplate 内置）
- **全部已读**：所有行不显示未读圆点和"标记已读"按钮
- **标记已读时行数据已在其他地方被修改**：乐观更新，仍标记为已读
- **API 返回超大数据**：后端设计为"典型用户少于 100 条"，不考虑虚拟滚动
- **bizType 不在映射表中**：降级显示原始枚举值 + info 类型 tag

## 12. 风险和回滚方案

| 风险 | 影响 | 应对 |
|------|------|------|
| row.read = true 不触发视图更新 | 已读状态不刷新 | 确认使用 ref 包裹数组，Vue 3 能检测 array item 属性变更 |
| readingId 锁遗漏场景 | 多次弹窗 | 已在 handleMarkRead 入口检查 |
| 删除 NotifyHome.vue 所有内容时语法错误 | 页面白屏 | 从 git 恢复或重新创建 |

回滚：修改文件 1 个 + 新建文件 1 个，难度低。

## 13. 测试方案

### 13.1 静态检查

- grep `row.read = true` 在 NotifyHome.vue 中存在
- grep `readingId` 锁前置
- grep `:deep(.list-pagination)` 隐藏分页

### 13.2 单元测试

新增 `NotifyHome.spec.ts`，≥ 4 用例：
1. 加载列表 ✅
2. 加载失败 ✅
3. 标记已读 ✅
4. 空列表 ✅

### 13.3 集成测试

不适用（单模块页面）。

### 13.4 手工验证

`pnpm dev:mock` 下：
- 导航到通知菜单 → 显示 8 条通知
- 未读通知前有紫莓色圆点
- 未读行有「标记已读」按钮，已读行显示「已读」
- 点击「标记已读」→ 按钮变为加载态 → 变为「已读」
- bizType 列显示正确中文标签和颜色

### 13.5 回归检查

`pnpm typecheck && pnpm lint && pnpm test` — 基线 344 + 新增 4~5 = 348~349，全部通过

## 14. 验收标准

| 编号 | 条件 | 验证方式 |
|:----:|------|----------|
| S2-1 | NotifyHome.vue 不再引用 BlankPage | 代码审查 |
| S2-2 | 通知列表使用 StandardListTemplate（页型 B） | 代码审查 |
| S2-3 | 未读通知前有圆点指示器 | 代码审查 + mock 验收 |
| S2-4 | bizType 正确显示中文标签（流程待办/审批结果） | 代码审查 |
| S2-5 | 「标记已读」按钮只出现在未读行 | 代码审查 |
| S2-6 | 点击标记已读 → POST handler → 状态变为已读 | mock 验收 |
| S2-7 | 防重复点击锁生效 | 代码审查 |
| S2-8 | 分页组件通过 CSS 隐藏 | 代码审查 |
| S2-9 | `NotifyHome.spec.ts` 存在，≥ 4 测试用例 | 文件存在 |
| S2-10 | 页面单测全部通过 | pnpm test 输出 |
| S2-11 | 校验门全绿：typecheck + lint + test 通过 | 命令输出 |

## 15. 执行回执格式

（同 Step 1 格式，列出 NotifyHome.vue 完整实现摘要 + NotifyHome.spec.ts 用例摘要 + 四连结果）

## 16. 测试回执格式

（与执行回执合并。附 mock 手工验收截图描述：列表加载 → 圆点 → 标记已读 → 状态变化）

## 17. 明确禁止事项

- ❌ 不新建 NotifyList.vue（直接重写 NotifyHome.vue）
- ❌ 不修改菜单结构（保持 menuType: 1 叶子节点）
- ❌ 不添加 ElMessageBox 确认框（标记已读无需确认）
- ❌ 不修改 seeds.ts / handlers.ts
- ❌ 不修改 StarndardListTemplate 本身
