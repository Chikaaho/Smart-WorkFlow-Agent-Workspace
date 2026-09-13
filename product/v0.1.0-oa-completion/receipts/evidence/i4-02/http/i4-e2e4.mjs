// I4 回调闭环：openapi 发起第二单 → leader1 办理 → 终态回调（接收器已常驻）
import { readFileSync, writeFileSync } from 'node:fs'
import { request as httpRequest } from 'node:http'
import { createHmac, createHash, randomBytes } from 'node:crypto'

const DIR = 'E:/code/Smart-WorkFlow-Agent-Workspace/product/v0.1.0-oa-completion/receipts/evidence/i4-02/http'
const BASE = 'http://localhost:8080/api'
const APP_ID = 'i4-demo-app'
const SECRET = process.env.I4_OPENAPI_SECRET ?? '' // 原文已安全移除（G6a）：sha256=fcba56c261010a10a795ef40b347938165fcf6b69cbe9ab60eded236849dd49a
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const token = (u) => JSON.parse(readFileSync(`${DIR}/token-${u}.json`, 'utf8')).accessToken
const safe = (t) => { try { return JSON.parse(t) } catch { return t } }

function call(user, method, path, body, tag) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? null : JSON.stringify(body)
    const req = httpRequest(BASE + path, { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token(user)}` } }, (res) => {
      let buf = ''
      res.on('data', (c) => (buf += c))
      res.on('end', () => {
        const parsed = safe(buf)
        if (tag) writeFileSync(`${DIR}/${tag}.json`, JSON.stringify({ user, method, path, status: res.statusCode, body: parsed }, null, 2))
        resolve({ status: res.statusCode, body: parsed })
      })
    })
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}
const sign = (ts, nonce, body) => {
  const keyMaterial = createHash('sha256').update(SECRET).digest('hex')
  const material = APP_ID + ts + nonce + createHash('sha256').update(body).digest('hex')
  return createHmac('sha256', keyMaterial).update(material).digest('hex')
}
function openCall(method, path, payloadObj) {
  const body = payloadObj === undefined ? '' : JSON.stringify(payloadObj)
  const ts = String(Math.floor(Date.now() / 1000))
  const nonce = randomBytes(8).toString('hex')
  const headers = { 'Content-Type': 'application/json', 'X-App-Id': APP_ID, 'X-Timestamp': ts, 'X-Nonce': nonce, 'X-Signature': sign(ts, nonce, body) }
  return new Promise((resolve, reject) => {
    const req = httpRequest(BASE + path, { method, headers }, (res) => {
      let buf = ''
      res.on('data', (c) => (buf += c))
      res.on('end', () => resolve({ status: res.statusCode, body: safe(buf) }))
    })
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

const ids = JSON.parse(readFileSync(`${DIR}/setup-summary.json`, 'utf8'))
const start = await openCall('POST', '/openapi/v1/processes', {
  formKey: 'i4_leave_form',
  formData: { days: 3, reason: 'I4 外部发起回调闭环', deptList: `${ids.depts.deptB}` },
  businessKey: 'ext-biz-002',
  idempotencyKey: 'ext-idem-002',
})
console.log('START', JSON.stringify(start.body))
await sleep(2500)
const mon = await call('admin', 'GET', '/workflow/monitor/instances?pageNum=1&pageSize=50', undefined, 'oa2-monitor')
const running = (mon.body?.data?.records ?? []).map((r) => r.instance).filter((i) => i.status === 'RUNNING')
const target = running[running.length - 1]
const todo = await call('leader2', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=10', undefined, 'oa2-todo-leader2')
const task = (todo.body?.data?.records ?? []).find((t) => t.processInstanceId === target.processInstanceId)
const completed = await call('leader2', 'POST', `/workflow/commands/tasks/${task.taskId}/complete`, { comment: '外部发起回调闭环办理' }, 'oa2-complete')
await sleep(4000)
out('openapi-callback-closedloop', { pi: target.processInstanceId, startCode: start.body?.code, completed: completed.body?.code })
console.log('CLOSED', JSON.stringify({ pi: target.processInstanceId, completed: completed.body?.code }))
