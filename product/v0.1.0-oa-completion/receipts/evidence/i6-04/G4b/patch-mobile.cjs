const fs = require('fs');
const p = 'src/modules/workflow/views/MobileWorkspace.vue';
let s = fs.readFileSync(p, 'utf8');
s = s.replace("import { useRouter } from 'vue-router'", "import { useRouter, useRoute } from 'vue-router'");
s = s.replace("  queryTaskDetail,\n} from '@/modules/workflow/api'", "  queryTaskDetail,\n  getInstanceDetail,\n} from '@/modules/workflow/api'");
s = s.replace("type MobileTab = 'todo' | 'initiated' | 'drafts'", `type MobileTab = 'todo' | 'initiated' | 'drafts'

// I6 G4b：收件箱深链恢复（ref=processInstanceId → 实例详情，服务端对象权限 fail closed）
const mRoute = useRoute()
const refInstance = ref<Record<string, unknown> | null>(null)
const refInstanceError = ref('')
const refVisible = ref(false)`);
s = s.replace("onMounted(() => void loadTab('todo'))", `onMounted(() => void loadTab('todo'))

// 深链恢复：服务端重新鉴权（无权/不存在 → fail closed 错误提示），不依赖前端缓存的登录态
void (async () => {
  const refId = mRoute.query.ref
  if (typeof refId !== 'string' || !refId) return
  try {
    refInstance.value = await getInstanceDetail(refId)
    refVisible.value = true
  } catch (err) {
    refInstanceError.value = err instanceof ApiError ? err.msg : '无权访问该业务对象'
    refVisible.value = true
  }
})()`);
// 深链实例详情抽屉（只读）
s = s.replace(`    <!-- 详情面板：任务/业务表单详情 + 正式意见表单 -->`, `    <!-- I6 G4b：深链恢复的实例详情（只读，服务端对象权限已裁决） -->
    <el-drawer v-model="refVisible" size="92%" direction="btt" class="m-detail">
      <template #title>
        <span class="m-detail-title">流程实例详情</span>
      </template>
      <div class="m-detail-body">
        <el-alert v-if="refInstanceError" :title="refInstanceError" type="error" :closable="false" />
        <template v-if="refInstance">
          <section class="m-section">
            <h3 class="m-section-title">基本信息</h3>
            <div class="m-kv"><span>实例 ID</span><b>{{ refInstance.processInstanceId }}</b></div>
            <div class="m-kv"><span>状态</span><b>{{ refInstance.status }}</b></div>
            <div class="m-kv"><span>发起人</span><b>{{ refInstance.initiatorId }}</b></div>
            <div class="m-kv"><span>表单</span><b>{{ refInstance.formKey }}</b></div>
          </section>
          <section class="m-section">
            <h3 class="m-section-title">流转记录</h3>
            <div v-for="(t, i) in (refInstance.timeline || [])" :key="i" class="m-kv">
              <span>{{ t.nodeKey || t.name || i }}</span>
              <b>{{ t.assignee || t.actor || '' }} {{ t.status || '' }}</b>
            </div>
          </section>
        </template>
      </div>
    </el-drawer>

    <!-- 详情面板：任务/业务表单详情 + 正式意见表单 -->`);
fs.writeFileSync(p, s);
console.log('ok', s.includes('refInstance'), s.includes('getInstanceDetail'));
