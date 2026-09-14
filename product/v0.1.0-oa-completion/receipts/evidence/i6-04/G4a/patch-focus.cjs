const fs = require('fs');
// 1) NotifyHome：WF_PROCESS → 监控列表 focus 参数；WF_TASK → 任务详情
let p = 'src/modules/notify/views/NotifyHome.vue';
let s = fs.readFileSync(p, 'utf8');
s = s.replace("      void pcRouter.push({ path: '/workflow/instances/' + target.linkId })",
    "      void pcRouter.push({ path: '/workflow/instances', query: { focus: target.linkId } })");
fs.writeFileSync(p, s);

// 2) ProcessInstanceList：focus 参数自动打开详情抽屉
p = 'src/modules/workflow/views/ProcessInstanceList.vue';
s = fs.readFileSync(p, 'utf8');
if (!s.includes('focusInstanceId')) {
  s = s.replace("import { ref, computed, onMounted } from 'vue'",
      "import { ref, computed, onMounted } from 'vue'\nimport { useRoute, useRouter } from 'vue-router'");
  s = s.replace("onMounted(", `const pcRoute = useRoute()
const pcRouter2 = useRouter()
// I6 G4a：收件箱深链（focus=processInstanceId）自动打开对应实例详情抽屉
const focusInstanceId = computed(() => {
  const v = pcRoute.query.focus
  return typeof v === 'string' && v ? v : null
})

onMounted(`);
  // 在 onMounted 加载完成后尝试打开 focus
  s = s.replace(/onMounted\(([^)]*)\)\n/, (m, inner) => m + `
void (async () => {
  if (!focusInstanceId.value) return
  try {
    const target = { processInstanceId: focusInstanceId.value }
    await openDrawer(target)
  } catch { /* 无权或不存在：抽屉内错误提示兜底 */ }
  finally {
    pcRouter2.replace({ query: { ...pcRoute.query, focus: undefined } })
  }
})()
`);
}
fs.writeFileSync(p, s);
console.log('ok', s.includes('focusInstanceId'));
