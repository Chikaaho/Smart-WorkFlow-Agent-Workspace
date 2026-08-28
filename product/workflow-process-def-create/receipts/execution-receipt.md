# 执行回执

## 1. Step 编号和名称
流程定义创建功能 - 前端实现

## 2. 实际读取的文件
- `/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Web/src/modules/workflow/views/ProcessDefList.vue`
- `/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Web/src/modules/workflow/api/index.ts`
- `/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Web/src/contracts/bpm.ts`
- `/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Web/src/modules/notify/views/NotifyTemplateFormDialog.vue` (参考实现)
- `/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Web/src/components/page-layout/StandardListTemplate.vue`
- `/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Web/src/components/page-layout/ListToolbar.vue`
- `/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/dto/CreateProcessDefRequest.java`
- `/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmProcessDefController.java`

## 3. 实际修改的文件
1. `/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Web/src/contracts/bpm.ts`
2. `/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Web/src/modules/workflow/views/CreateProcessDefDialog.vue` (新建)
3. `/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Web/src/modules/workflow/views/ProcessDefList.vue`

## 4. 每个文件的修改摘要

### 4.1 contracts/bpm.ts
- 新增 `CreateProcessDefReq` 接口：包含 `name` 和 `formKey` 两个必填字段
- 新增 `CreateProcessDefResp` 接口：包含 `defId` 和 `graph` 字段

### 4.2 CreateProcessDefDialog.vue (新建)
- 创建流程定义弹窗组件
- 包含表单字段：流程名称、表单标识
- 本地校验：name 和 formKey 均不能为空
- 调用 `createProcessDef` API 创建流程定义
- 创建成功后触发 `saved` 事件通知父组件刷新列表
- 使用 `StandardFormTemplate` 和 `FormSection` 组件保持 UI 一致性

### 4.3 ProcessDefList.vue
- 导入 `CreateProcessDefDialog` 组件和 `Plus` 图标
- 新增 `createDialogVisible` 状态控制创建弹窗显隐
- 在工具栏添加"创建流程定义"按钮（`#toolbar-actions` 插槽）
- 在空态添加"创建流程定义"按钮（`#empty-action` 插槽）
- 添加 `CreateProcessDefDialog` 组件，监听 `saved` 事件调用 `loadList` 刷新列表

## 5. 实际执行的命令
```bash
cd /usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Web
NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck
NODE_OPTIONS="--max-old-space-size=2048" pnpm lint
NODE_OPTIONS="--max-old-space-size=2048" pnpm lint --fix
NODE_OPTIONS="--max-old-space-size=2048" pnpm test
NODE_OPTIONS="--max-old-space-size=2048" pnpm build
```

## 6. 命令输出摘要

### TypeScript 类型检查
- 修改的文件无类型错误
- 存在一个预存的类型错误在 `TaskDetail.spec.ts`（与本次修改无关）

### ESLint 检查
- 初始检查有 prettier 格式化警告
- 执行 `pnpm lint --fix` 后格式化问题已修复
- 修改的文件无 lint 错误

### 单元测试
- 所有 108 个测试文件通过
- 1039 个测试用例通过
- 无新增失败

### 生产构建
- 构建成功，耗时 9.66s
- 无构建错误

## 7. 与原方案的偏差
无偏差，完全按照需求方向实现。

## 8. 遇到的问题
无。

## 9. 未完成内容
无。

## 10. 风险和注意事项
1. 后端 API 已实现并可用（POST /workflow/defs）
2. 前端 API 函数 `createProcessDef` 已存在
3. 表单标识（formKey）需要用户输入已存在的表单定义的 formKey，否则后端会返回错误

## 11. Git diff 摘要
```diff
diff --git a/Smart-WorkFlow-Web/src/contracts/bpm.ts b/Smart-WorkFlow-Web/src/contracts/bpm.ts
index xxxxxxx..xxxxxxx 100644
--- a/Smart-WorkFlow-Web/src/contracts/bpm.ts
+++ b/Smart-WorkFlow-Web/src/contracts/bpm.ts
@@ -58,3 +58,13 @@ export interface ProcessDef {
   createTime: string
   updateTime: string
 }
+
+// ─── 创建流程定义请求 DTO（对齐后端 CreateProcessDefRequest） ───
+export interface CreateProcessDefReq {
+  name: string
+  formKey: string
+}
+
+// ─── 创建流程定义响应 DTO（对齐后端 CreateProcessDefResponse） ───
+export interface CreateProcessDefResp {
+  defId: number
+  graph: unknown // ProcessGraph，设计器回显用
+}

diff --git a/Smart-WorkFlow-Web/src/modules/workflow/views/CreateProcessDefDialog.vue b/Smart-WorkFlow-Web/src/modules/workflow/views/CreateProcessDefDialog.vue
new file mode 100644
index 0000000..xxxxxxx
--- /dev/null
+++ b/Smart-WorkFlow-Web/src/modules/workflow/views/CreateProcessDefDialog.vue
@@ -0,0 +1,148 @@
+<script setup lang="ts">
+/**
+ * CreateProcessDefDialog — 创建流程定义弹窗。
+ *
+ * 覆盖 CreateProcessDefReq 全量字段：流程名称 + 表单标识。
+ * 校验与后端一致：name 和 formKey 均不能为空。
+ */
+import { ref, reactive, computed, watch } from 'vue'
+import { ElMessage } from 'element-plus'
+import { ApiError } from '@/foundation/request'
+import { createProcessDef } from '@/modules/workflow/api'
+import { StandardFormTemplate, FormSection, FormGrid } from '@/components/page-layout'
+
+const props = defineProps<{
+  visible: boolean
+}>()
+
+const emit = defineEmits<{
+  'update:visible': [value: boolean]
+  saved: []
+}>()
+
+// ─── 表单状态 ───
+const form = reactive({
+  name: '',
+  formKey: '',
+})
+
+const submitting = ref(false)
+const formError = ref('')
+
+// ─── 弹窗显隐桥接 ───
+const dialogModel = computed({
+  get: () => props.visible,
+  set: (v: boolean) => emit('update:visible', v),
+})
+
+// ─── 表单生命周期 ───
+function resetForm() {
+  form.name = ''
+  form.formKey = ''
+  formError.value = ''
+}
+
+watch(
+  () => props.visible,
+  (visible) => {
+    if (visible) resetForm()
+  },
+  { immediate: true },
+)
+
+// ─── 本地校验 ───
+function validate(): string | null {
+  if (!form.name.trim()) return '流程名称不能为空'
+  if (!form.formKey.trim()) return '表单标识不能为空'
+  return null
+}
+
+// ─── 提交 ───
+async function handleSubmit() {
+  const msg = validate()
+  if (msg) {
+    formError.value = msg
+    return
+  }
+  submitting.value = true
+  formError.value = ''
+  try {
+    await createProcessDef({
+      name: form.name.trim(),
+      formKey: form.formKey.trim(),
+    })
+    ElMessage.success('创建成功')
+    emit('saved')
+    emit('update:visible', false)
+  } catch (err) {
+    formError.value = err instanceof ApiError ? err.msg : '创建失败'
+  } finally {
+    submitting.value = false
+  }
+}
+</script>
+
+<template>
+  <el-dialog
+    v-model="dialogModel"
+    title="创建流程定义"
+    :close-on-click-modal="false"
+    destroy-on-close
+    width="560px"
+    @closed="resetForm"
+  >
+    <StandardFormTemplate embedded>
+      <template #alert>
+        <el-alert v-if="formError" :title="formError" type="error" :closable="false" show-icon />
+      </template>
+
+      <FormSection title="基本信息">
+        <FormGrid :columns="1">
+          <div class="form-field form-field--required">
+            <label class="form-field__label">流程名称</label>
+            <el-input v-model="form.name" placeholder="请输入流程名称" maxlength="100" />
+          </div>
+          <div class="form-field form-field--required">
+            <label class="form-field__label">表单标识</label>
+            <el-input v-model="form.formKey" placeholder="请输入关联表单的 formKey" maxlength="100" />
+            <div class="form-field__hint">
+              关联已发布的表单定义的 formKey，用于流程启动时加载表单
+            </div>
+          </div>
+        </FormGrid>
+      </FormSection>
+
+      <template #actions>
+        <el-button :disabled="submitting" @click="emit('update:visible', false)">取消</el-button>
+        <el-button type="primary" :loading="submitting" @click="handleSubmit">创建</el-button>
+      </template>
+    </StandardFormTemplate>
+  </el-dialog>
+</template>
+
+<style scoped>
+.form-field {
+  display: flex;
+  flex-direction: column;
+  gap: var(--sw-space-8);
+}
+
+.form-field__label {
+  font-size: var(--sw-font-body);
+  font-weight: var(--sw-font-weight-emphasis);
+  color: var(--sw-text-primary);
+}
+
+.form-field--required .form-field__label::before {
+  content: '* ';
+  color: var(--sw-danger);
+}
+
+.form-field__hint {
+  font-size: var(--sw-font-caption);
+  color: var(--sw-text-secondary);
+}
+</style>

diff --git a/Smart-WorkFlow-Web/src/modules/workflow/views/ProcessDefList.vue b/Smart-WorkFlow-Web/src/modules/workflow/views/ProcessDefList.vue
index xxxxxxx..xxxxxxx 100644
--- a/Smart-WorkFlow-Web/src/modules/workflow/views/ProcessDefList.vue
+++ b/Smart-WorkFlow-Web/src/modules/workflow/views/ProcessDefList.vue
@@ -17,6 +17,8 @@ import { mountBpmnViewer } from '@/adapters/bpmn'
 import type { BpmnViewerInstance } from '@/adapters/bpmn'
 import { ElMessageBox, ElMessage } from 'element-plus'
+import { Plus } from '@element-plus/icons-vue'
+import CreateProcessDefDialog from './CreateProcessDefDialog.vue'

 // ─── 状态映射（与 FormDefStatus 完全对称） ───

@@ -60,6 +62,9 @@ const publishingId = ref<number | null>(null)
 // ─── 删除流程定义 ───
 const deletingId = ref<number | null>(null)

+// ─── 创建流程定义 ───
+const createDialogVisible = ref(false)
+
 async function loadList() {
   loading.value = true
   errorMsg.value = ''
@@ -247,6 +252,18 @@ onMounted(loadList)
     @update:page-size="handlePageSizeChange"
   >
+    <!-- 工具栏操作按钮 -->
+    <template #toolbar-actions>
+      <el-button type="primary" @click="createDialogVisible = true">
+        <el-icon><Plus /></el-icon>
+        创建流程定义
+      </el-button>
+    </template>
+
+    <!-- 空态操作 -->
+    <template #empty-action>
+      <el-button type="primary" @click="createDialogVisible = true">
+        <el-icon><Plus /></el-icon>
+        创建流程定义
+      </el-button>
+    </template>
+
     <!-- 错误提示 -->
     <el-alert
@@ -330,6 +347,10 @@ onMounted(loadList)
       </div>
     </el-dialog>
+
+    <!-- 创建流程定义对话框 -->
+    <CreateProcessDefDialog v-model:visible="createDialogVisible" @saved="loadList" />
   </StandardListTemplate>
 </template>
```

## 12. 建议执行的测试
1. 手动测试：点击"创建流程定义"按钮，验证弹窗显示
2. 手动测试：输入流程名称和表单标识，点击创建，验证创建成功
3. 手动测试：创建成功后验证列表自动刷新
4. 手动测试：验证表单校验（空名称、空表单标识）
5. 手动测试：验证取消按钮功能

---

**执行状态**：自验通过·待规划验收

**SWF_TERMINAL** {"status":"COMPLETED","feature":"workflow-process-def-create","step":"frontend-implementation","evidence":["TypeScript type check passed for modified files","ESLint check passed after formatting fix","All 1039 unit tests passed","Production build succeeded"],"nextAction":"等待规划验收"}
