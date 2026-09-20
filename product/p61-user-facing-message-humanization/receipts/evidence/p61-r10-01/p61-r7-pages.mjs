/**
 * R7-C/R7-P 页面族成对采集：同一最终构建 / 服务 / 浏览器会话下，逐页族采 zh-CN 与 en-US。
 *
 * 每页记录：URL、视口、htmlLang、localStorage locale、DOM 关键文本、CJK 扫描、
 * locale 键名外显扫描、横向溢出、截图路径、采集时间。截图写入 ./shots/。
 */
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'

const OUT_JSON = './r7-capture.json'

/** R7-C 要求的页面族 → 实际路由（路由取自运行期 router.getRoutes()，不猜路径） */
export const PAGE_FAMILIES = [
  { family: '登录', route: '/login', auth: false, note: '未认证入口' },
  { family: 'SSO 绑定', route: '/account/bindings', auth: true, note: 'SSO 审计/绑定入口' },
  { family: '系统列表-用户', route: '/user', auth: true },
  { family: '系统列表-角色', route: '/role', auth: true },
  { family: '系统列表-部门', route: '/dept', auth: true },
  { family: '系统列表-字典', route: '/dict', auth: true },
  { family: '表单设计列表', route: '/form/form-def-list', auth: true, note: '表单设计与填写族' },
  { family: '表单设计器', route: '/form/designer', auth: true, note: '表单设计与填写族' },
  { family: '流程任务（审批）', route: '/workflow/todo', auth: true, note: '流程设计与审批族' },
  { family: '批量审批', route: '/workflow/batch-approval', auth: true, note: '批量操作族' },
  { family: '流程模板中心', route: '/workflow/templates', auth: true, note: '流程设计族' },
  { family: '流程实例监控', route: '/workflow/instances', auth: true },
  { family: '通知收件箱', route: '/inbox', auth: true, note: '通知记录族' },
  { family: '通知发送记录', route: '/notify/record', auth: true, note: '通知记录族' },
  { family: '批量发送通知', route: '/notify/batch-send', auth: true, note: 'R2c-N 结果面板所在页' },
  { family: '通知渠道配置', route: '/notify/channel', auth: true },
  { family: '任务列表', route: '/job/list', auth: true, note: '任务日志族' },
  { family: '任务执行日志', route: '/job/log', auth: true, note: '任务日志族' },
  { family: 'IoT 连接', route: '/iot/connections', auth: true, note: 'IoT 脚本与连接族' },
  { family: 'IoT 脚本', route: '/iot/scripts', auth: true, note: 'IoT 脚本与连接族' },
  { family: 'IoT 设备', route: '/iot/devices-manage', auth: true, note: 'R8c-D 设备命令所在页' },
  { family: 'Agent 模型', route: '/model', auth: true, note: 'Agent 模型族' },
  { family: 'Agent 工具', route: '/tool', auth: true },
  { family: '存储', route: '/storage', auth: true, note: '存储上传族' },
  { family: '开放接口', route: '/openapi', auth: true },
  { family: '错误页 403', route: '/403', auth: true },
  { family: '错误页 404', route: '/404', auth: true },
  { family: '错误页 500', route: '/500', auth: true },
  { family: '移动 H5 工作台', route: '/m/workflow', auth: true, mobile: true },
  { family: '移动 H5 通知', route: '/m/notify', auth: true, mobile: true },
  { family: '移动 H5 表单填写', route: '/m/form/:formKey', auth: true, mobile: true, skipIfNoParam: true },
]

const DESKTOP = { width: 1280, height: 720 }
const MOBILE = { width: 390, height: 844 }

export function loadResults() {
  return existsSync(OUT_JSON) ? JSON.parse(readFileSync(OUT_JSON, 'utf8')) : []
}

export function saveResults(rows) {
  writeFileSync(OUT_JSON, JSON.stringify(rows, null, 2), 'utf8')
}

export function ensureShots() {
  if (!existsSync('./shots')) mkdirSync('./shots', { recursive: true })
}

/** 页面侧度量：语言、键名外显、CJK、溢出。userName 是数据库里的真实姓名，单列说明。 */
export const MEASURE = () => {
  const body = document.body.innerText
  const cjkChars = body.match(/[\u4e00-\u9fff]/g) ?? []
  const keyLike = [
    ...new Set(
      (body.match(/\b[a-z][a-zA-Z0-9]*\.[a-z][a-zA-Z0-9_]+[A-Z][a-zA-Z0-9_]*\b/g) ?? []).filter(
        // 排除形如 example.com / e.g 的普通文本
        (s) => !/\.(com|cn|org|net)$/.test(s),
      ),
    ),
  ]
  const cjkNodes = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let n
  while ((n = walker.nextNode())) {
    const s = (n.nodeValue ?? '').trim()
    if (!s || !/[\u4e00-\u9fff]/.test(s)) continue
    const owner = n.parentElement?.closest('[class*="user-name"],[class*="user__"]')
    cjkNodes.push({ text: s.slice(0, 60), dynamicUserName: !!owner })
  }
  const de = document.documentElement
  return {
    url: location.pathname + location.search,
    htmlLang: de.lang,
    localStorageLocale: localStorage.getItem('sw.locale'),
    cjkCharCount: cjkChars.length,
    cjkNodes: cjkNodes.slice(0, 25),
    dynamicUserNameNodes: cjkNodes.filter((c) => c.dynamicUserName).map((c) => c.text),
    nonDynamicCjkNodes: cjkNodes.filter((c) => !c.dynamicUserName).map((c) => c.text),
    keyLike,
    overflowX: de.scrollWidth > de.clientWidth + 1,
    scrollWidth: de.scrollWidth,
    clientWidth: de.clientWidth,
    textSample: body.replace(/\s+/g, ' ').slice(0, 700),
  }
}

export { DESKTOP, MOBILE }
