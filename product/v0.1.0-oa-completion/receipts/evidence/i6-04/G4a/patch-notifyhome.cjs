const fs = require('fs');
const p = 'src/modules/notify/views/NotifyHome.vue';
let s = fs.readFileSync(p, 'utf8');
s = s.replace("  markAsRead,\n  deleteMessage,\n} from '@/modules/notify/api'", "  markAsRead,\n  deleteMessage,\n  openNotifyLink,\n} from '@/modules/notify/api'");
s = s.replace("import { ApiError } from '@/foundation/request'", "import { ApiError } from '@/foundation/request'\nimport { useRouter } from 'vue-router'");
const fn = `
/** 受保护深链：服务端鉴权后按受控类型路由（不使用任意 URL），与移动端同一契约。 */
const pcRouter = useRouter()
async function openLink(row: NotifyMessage) {
  try {
    const target = await openNotifyLink(row.id)
    if (target.linkType === 'WF_TASK' || target.linkType === 'WF_PROCESS') {
      void pcRouter.push({ path: '/workflow/instances/' + target.linkId })
    } else {
      ElMessage.info('该通知暂无页面跳转')
    }
  } catch (err) {
    if (err instanceof ApiError) ElMessage.error(err.msg)
    else ElMessage.error('无权访问该业务对象')
  }
}

onMounted(loadList)`;
s = s.replace("onMounted(loadList)", fn);
s = s.replace(`          <el-button
            size="small"
            text
            type="danger"
            :loading="deletingId === row.id"`, `          <el-button
            size="small"
            text
            type="primary"
            @click="openLink(row)"
          >
            跳转
          </el-button>
          <el-button
            size="small"
            text
            type="danger"
            :loading="deletingId === row.id"`);
fs.writeFileSync(p, s);
console.log('patched:', s.includes('openNotifyLink'), s.includes('openLink(row)'));
