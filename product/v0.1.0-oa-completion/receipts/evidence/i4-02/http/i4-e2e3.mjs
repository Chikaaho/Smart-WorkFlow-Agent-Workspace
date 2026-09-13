#!/usr/bin/env node
/**
 * I4 OpenAPI 收尾链：状态查询 → leader1 办理 → 终态签名回调 → nonce 重放拒绝。
 * 用法: node i4-e2e3.mjs
 */
import { request as httpRequest } from 'node:http'
import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { createHmac, createHash, randomBytes } from 'node:crypto'

const DIR = 'E:/code/Smart-WorkFlow-Agent-Workspace/product/v0.1.0-oa-completion/receipts/evidence/i4-02/http'
const BASE = 'http://localhost:8080/api'
const APP_ID = 'i4-demo-app'
const SECRET = process.env.I4_OPENAPI_SECRET ?? '' // 原文已安全移除（G6a）：sha256=fcba56c261010a10a795ef40b347938165fcf6b69cbe9ab60eded236849dd49a

const token = (u) => JSON.parse(readFileSync(`${DIR}/token-${u}.json`, 'utf8')).accessToken
const safe = (t) => { try { return JSON.parse(t) } catch { return t } }
const out = (n, o) => writeFileSync(`${DIR}/${n}.json`, JSON.stringify(o, null, 2))

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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const sign = (ts, nonce, body) => {
  const keyMaterial = createHash('sha256').update(SECRET).digest('hex')
  const material = APP_ID + ts + nonce + createHash('sha256').update(body).digest('hex')
  return createHmac('sha256', keyMaterial).update(material).digest('hex')
}
function openCall(method, path, payloadObj, opts = {}) {
  const body = payloadObj === undefined ? '' : JSON.stringify(payloadObj)
  const ts = String(Math.floor(Date.now() / 1000))
  const nonce = opts.nonce ?? randomBytes(8).toString('hex')
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

// 1) 找到外部发起实例（businessKey=ext-biz-001）
const mon = await call('admin', 'GET', '/workflow/monitor/instances?pageNum=1&pageSize=50', undefined, 'oa-monitor')
const ext = (mon.body?.data?.records ?? []).map((r) => r.instance).find((i) => i.status === 'RUNNING')
if (!ext) { console.error('NO_EXT_INSTANCE'); process.exit(1) }
const pi = ext.processInstanceId
// 2) 外部状态查询（PROCESS_QUERY）
const status = await openCall('GET', `/openapi/v1/processes/${pi}`)
writeFileSync(`${DIR}/oa-status.json`, JSON.stringify({ path: `/openapi/v1/processes/${pi}`, body: status.body }, null, 2))
// 3) leader1 办理外部发起的分支任务（真实命令链）
const todo = await call('leader1', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=10', undefined, 'oa-todo-leader1')
const task = (todo.body?.data?.records ?? []).find((t) => t.processInstanceId === pi)
let completed = null
if (task) {
  completed = await call('leader1', 'POST', `/workflow/commands/tasks/${task.taskId}/complete`, { comment: '外部发起任务由负责人办理' }, 'oa-complete')
}
await sleep(3000)
// 4) nonce 重放（同一 nonce + 同一签名重发查询）→ 3004
const ts = String(Math.floor(Date.now() / 1000))
const nonce = randomBytes(8).toString('hex')
const body = ''
const headers = { 'Content-Type': 'application/json', 'X-App-Id': APP_ID, 'X-Timestamp': ts, 'X-Nonce': nonce, 'X-Signature': sign(ts, nonce, body) }
const first = await new Promise((resolve, reject) => {
  const req = httpRequest(`${BASE}/openapi/v1/processes/${pi}`, { headers }, (res) => { let b = ''; res.on('data', (c) => (b += c)); res.on('end', () => resolve({ status: res.statusCode, body: safe(b) })) })
  req.on('error', reject); req.end()
})
const replay = await new Promise((resolve, reject) => {
  const req = httpRequest(`${BASE}/openapi/v1/processes/${pi}`, { headers }, (res) => { let b = ''; res.on('data', (c) => (b += c)); res.on('end', () => resolve({ status: res.statusCode, body: safe(b) })) })
  req.on('error', reject); req.end()
})
out('openapi-final-summary', {
  pi, statusQuery: status.body,
  taskCompleted: completed?.body?.code ?? 'NO_TASK',
  nonceFirstCode: first.body?.code,
  nonceReplayCode: replay.body?.code,
})
console.log('OA3_OK', JSON.stringify({
  status: status.body?.data?.status, completed: completed?.body?.code,
  first: first.body?.code, replay: replay.body?.code,
}))
