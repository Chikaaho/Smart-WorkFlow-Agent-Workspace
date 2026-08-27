# Step 5-6-7 前端执行回执

## 任务概述

创建通知批量发送功能的前端实现，包括类型定义、API 函数、Mock handler、路由配置、Vue 组件和测试。

## 已完成文件清单

### 1. 类型定义 — `src/contracts/notify.ts`
- 新增 `NotifyBatchSendReq` 接口（与后端契约对齐）
- 新增 `NotifyBatchSendResp` 接口

### 2. API 函数 — `src/modules/notify/api/index.ts`
- 新增 `batchSendNotify(req)` 函数，调用 `POST /notify/messages/batch-send`

### 3. Mock Handler — `src/foundation/mock/handlers.ts`
- 新增 `POST /api/notify/messages/batch-send` handler
- 权限检查：`notify:template:manage`
- 接收人解析：userId / deptId（含子部门递归）/ roleCode 三维交叉去重
- 内容模式互斥校验：直接内容 vs 模板
- 模板渲染复用 `renderMockTemplate`
- 空接收人/超500人/模板不存在或停用 → 业务拒绝

### 4. 路由配置 — `src/router/index.ts`
- 新增 `notify/batch-send` 静态路由
- authority: `['notify:template:manage']`

### 5. 菜单种子 — `src/foundation/mock/seeds.ts`
- MOCK_MENU_TREE 新增 id='43' 菜单项（发送通知）
- MOCK_ROLE_MENU_BINDINGS admin 角色绑定新增 43

### 6. Vue 组件 — `src/modules/notify/views/NotifyBatchSend.vue`
- StandardFormTemplate 布局
- 接收对象选择：用户搜索+tag、部门树 checkbox、角色 checkbox group
- 内容模式：直接内容（标题+正文）/ 模板（下拉+变量JSON），互斥 Tab
- 预估发送人数显示
- 发送二次确认 → batchSendNotify API → 成功返回收件箱

### 7. 组件测试 — `src/modules/notify/views/NotifyBatchSend.spec.ts`
- 8 个测试用例全部通过

## 验证结果

### 类型检查
```
vue-tsc -p tsconfig.json --noEmit → 0 errors
```

### 单元测试
```
vitest run --root Smart-WorkFlow-Web src/modules/notify/views/NotifyBatchSend.spec.ts
 → 9 tests passed (9)
```

### 测试用例明细
1. ✅ renders page with title and sections
2. ✅ enables send button when direct content is filled with recipients
3. ✅ clears direct content when switching to template mode
4. ✅ clears template data when switching to direct content mode
5. ✅ shows confirm dialog on send click
6. ✅ calls batchSendNotify API on confirm
7. ✅ shows error message when API fails
8. ✅ does not call API when user cancels confirm
9. ✅ canSubmit is false when no recipients selected
