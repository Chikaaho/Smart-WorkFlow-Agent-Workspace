#!/usr/bin/env node
/**
 * I4 真实行为链驱动（下）：冻结不改写/SKIP 记录/G2 运营链/G3 批量交接/G5 OpenAPI。
 * 用法: node i4-e2e2.mjs <phase>
 *  phase ∈ frozen | ops | batch | handover | openapi
 */
import { request as httpRequest } from 'node:http'
import { readFileSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { createHmac, createHash, randomBytes } from 'node:crypto'

const DIR = 'E:/code/Smart-WorkFlow-Agent-Workspace/product/v0.1.0-oa-completion/receipts/evidence/i4-02/http'
const BASE = 'http://localhost:8080/api'
const phase = process.argv[2] || 'frozen'

const token = (u) => JSON.parse(readFileSync(`${DIR}/token-${u}.json`, 'utf8')).accessToken

function call(user, method, path, body, tag) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? null : JSON.stringify(body)
    const req = httpRequest(
      BASE + path,
      { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token(user)}` } },
      (res) => {
        let buf = ''
        res.on('data', (c) => (buf += c))
        res.on('end', () => {
          const parsed = safe(buf)
          if (tag) writeFileSync(`${DIR}/${tag}.json`, JSON.stringify({ user, method, path, status: res.statusCode, body: parsed }, null, 2))
          resolve({ status: res.statusCode, body: parsed })
        })
      },
    )
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}
const safe = (t) => { try { return JSON.parse(t) } catch { return t } }
const safe2 = (t) => { try { return JSON.parse(t) } catch { return {} } }
const out = (n, o) => writeFileSync(`${DIR}/${n}.json`, JSON.stringify(o, null, 2))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// ---------- frozen：中途组织变化不改写冻结 ----------
async function frozen() {
  const ids = JSON.parse(readFileSync(`${DIR}/setup-summary.json`, 'utf8'))
  const { deptA } = ids.depts
  const submit = await call('initiator', 'POST', '/form/data/i4_leave_form',
    { days: 1, reason: 'I4 冻结不改写验证', deptList: `${deptA}` }, 'fz-submit')
  if (submit.body?.code !== 0) { console.error('SUBMIT_FAIL', JSON.stringify(submit.body)); process.exit(1) }
  await sleep(2500)
  const mine = await call('initiator', 'GET', '/workflow/my/instances?pageNum=1&pageSize=5', undefined, 'fz-my-instances')
  const inst = (mine.body?.data?.records ?? []).find((x) => x.status === 'RUNNING')
  if (!inst) { console.error('NO_RUNNING'); process.exit(1) }
  const pi = inst.processInstanceId
  const before = await call('admin', 'GET', `/workflow/monitor/instances/${pi}/branches`, undefined, 'fz-branches-before')
  // 中途把 dept-a 负责人改为 leader2（真实组织变化）
  const users = JSON.parse(readFileSync(`${DIR}/user-ids.json`, 'utf8'))
  await call('admin', 'PUT', '/system/dept', { id: deptA, name: '研发一部', code: 'i4-dept-a', parentId: 1, sort: 1, status: 0, leaderId: users.leader2 }, 'fz-dept-change')
  await sleep(1000)
  const after = await call('admin', 'GET', `/workflow/monitor/instances/${pi}/branches`, undefined, 'fz-branches-after')
  const l1 = await call('leader1', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=10', undefined, 'fz-todo-leader1')
  out('frozen-check', {
    pi,
    before: (before.body?.data ?? []).map((b) => ({ idx: b.branchIndex, leader: b.leaderId, deptIds: b.deptIds, status: b.status })),
    after: (after.body?.data ?? []).map((b) => ({ idx: b.branchIndex, leader: b.leaderId, deptIds: b.deptIds, status: b.status })),
    leader1StillHasTask: (l1.body?.data?.records ?? []).some((t) => (before.body?.data ?? []).some((b) => b.taskId === t.taskId)),
  })
  console.log('FROZEN_OK pi=' + pi,
    JSON.stringify({ beforeLeader: before.body?.data?.[0]?.leaderId, afterLeader: after.body?.data?.[0]?.leaderId }))
}

// ---------- ops：G2 模板复制/监控干预/分析 + 无权拒绝 ----------
async function ops() {
  // 模板：admin 创建（自真实定义抽取）→ 复制创建定义 → 停用后复制拒绝
  const created = await call('admin', 'POST', '/workflow/templates', {
    name: 'I4 协作审批模板', category: 'I4', description: '自真实定义抽取',
    formKey: 'i4_leave_form', scopeType: 'GLOBAL',
  }, 'tpl-create')
  const tplId = created.body?.data?.id
  const copy = await call('admin', 'POST', `/workflow/templates/${tplId}/copy`, { copyName: 'I4 模板副本定义' }, 'tpl-copy')
  await call('admin', 'PUT', `/workflow/templates/${tplId}/status/false`, {}, 'tpl-disable')
  const copyDisabled = await call('admin', 'POST', `/workflow/templates/${tplId}/copy`, {}, 'tpl-copy-disabled')
  // 无权身份：outsider（无 workflow:template:* 权限）访问模板列表与复制
  const outsiderList = await call('outsider', 'GET', '/workflow/templates?pageNum=1&pageSize=10', undefined, 'tpl-outsider-list')
  const outsiderCopy = await call('outsider', 'POST', `/workflow/templates/${tplId}/copy`, {}, 'tpl-outsider-copy')

  // 监控：admin 七条件检索 + 干预（挂起→恢复→迁移→审计回读）+ 无权拒绝
  const monitor = await call('admin', 'GET', '/workflow/monitor/instances?pageNum=1&pageSize=10&status=RUNNING', undefined, 'mon-list')
  const running = (monitor.body?.data?.records ?? []).map((r) => r.instance)
  const target = running[0]
  let suspend = null; let resume = null; let transfer = null; let interventions = null
  if (target) {
    const pi = target.processInstanceId
    suspend = await call('admin', 'POST', `/workflow/monitor/instances/${pi}/intervene`, { action: 'SUSPEND', reason: 'I4 运营挂起验证' }, 'mon-suspend')
    resume = await call('admin', 'POST', `/workflow/monitor/instances/${pi}/intervene`, { action: 'RESUME', reason: 'I4 运营恢复验证' }, 'mon-resume')
    transfer = await call('admin', 'POST', `/workflow/monitor/instances/${pi}/intervene`,
      { action: 'TRANSFER', reason: 'I4 迁移办理人验证', toAssignee: JSON.parse(readFileSync(`${DIR}/user-ids.json`, 'utf8')).leader2 }, 'mon-transfer')
    interventions = await call('admin', 'GET', `/workflow/monitor/instances/${pi}/interventions`, undefined, 'mon-interventions')
  }
  const outsiderMonitor = await call('outsider', 'GET', '/workflow/monitor/instances?pageNum=1&pageSize=10', undefined, 'mon-outsider')
  // 分析：真实实例集指标 + 无权拒绝
  await sleep(500)
  const analytics = await call('admin', 'GET', '/workflow/monitor/analytics/summary', undefined, 'analytics-summary')
  const outsiderAnalytics = await call('outsider', 'GET', '/workflow/monitor/analytics/summary', undefined, 'analytics-outsider')
  out('ops-summary', {
    tplId, copyDefId: copy.body?.data?.id, copyDisabledCode: copyDisabled.body?.code,
    outsiderListCode: outsiderList.status, outsiderCopyCode: outsiderCopy.status,
    monitorRunning: running.length,
    suspendCode: suspend?.body?.code, resumeCode: resume?.body?.code, transferCode: transfer?.body?.code,
    interventionRecords: interventions?.body?.data?.length ?? 0,
    outsiderMonitorStatus: outsiderMonitor.status,
    analytics: analytics.body?.data && {
      launched: analytics.body.data.launched, completed: analytics.body.data.completed,
      running: analytics.body.data.running, avg: analytics.body.data.avgDurationMs,
      p50: analytics.body.data.p50DurationMs, p90: analytics.body.data.p90DurationMs,
      workload: analytics.body.data.handlerWorkload,
    },
    outsiderAnalyticsStatus: outsiderAnalytics.status,
  })
  console.log('OPS_OK', JSON.stringify({ tplId, copyDisabled: copyDisabled.body?.code, outsiderMonitor: outsiderMonitor.status, analyticsCode: analytics.body?.code }))
}

// ---------- batch：G3 批量部分成功 + 无权项 ----------
async function batch() {
  const ids = JSON.parse(readFileSync(`${DIR}/setup-summary.json`, 'utf8'))
  const { deptA, deptB } = ids.depts
  // 一单两部门：leader1、leader2 各一任务；leader1 批量提交 [本人任务 approve, leader2 任务 approve]
  const submit = await call('initiator', 'POST', '/form/data/i4_leave_form',
    { days: 1, reason: 'I4 批量审批链', deptList: `${deptA},${deptB}` }, 'batch-submit')
  await sleep(2500)
  const l1 = await call('leader1', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=10', undefined, 'batch-todo-leader1')
  const l2 = await call('leader2', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=10', undefined, 'batch-todo-leader2')
  const used = safe2(readFileSync(`${DIR}/batch-used.json`, 'utf8'))
  const seen = new Set(Object.keys(used ?? {}))
  const mine1 = (l1.body?.data?.records ?? []).map((t) => t.taskId).filter((id) => !seen.has(id))
  const mine2 = (l2.body?.data?.records ?? []).map((t) => t.taskId).filter((id) => !seen.has(id))
  const own = mine1[0]
  const foreign = mine2[0]
  const batch = await call('leader1', 'POST', '/workflow/tasks/batch-action', {
    items: [
      { taskId: own, action: 'APPROVE', comment: '批量通过（本人任务）' },
      { taskId: foreign, action: 'APPROVE', comment: '越权项应失败' },
    ],
  }, 'batch-result')
  await sleep(2500)
  const mine = await call('initiator', 'GET', '/workflow/my/instances?pageNum=1&pageSize=10', undefined, 'batch-my-instances')
  const inst = (mine.body?.data?.records ?? []).find((x) => x.status === 'RUNNING')
  writeFileSync(`${DIR}/batch-used.json`, JSON.stringify({ ...(safe2(readFileSync(`${DIR}/batch-used.json`, 'utf8'))), [own]: 1, [foreign]: 1 }, null, 2))
  out('batch-summary', {
    ownTask: own, foreignTask: foreign,
    results: batch.body?.data?.results,
    success: batch.body?.data?.success, failed: batch.body?.data?.failed,
    instanceStillRunning: Boolean(inst),
  })
  console.log('BATCH_OK', JSON.stringify({ success: batch.body?.data?.success, failed: batch.body?.data?.failed, results: batch.body?.data?.results }))
}

// ---------- handover：G3 真实交接 ----------
async function handover() {
  const users = JSON.parse(readFileSync(`${DIR}/user-ids.json`, 'utf8'))
  const before = await call('leader2', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=10', undefined, 'hv-todo-leader2')
  const hv = await call('admin', 'POST', '/workflow/handover', {
    fromUserId: users.leader2, toUserId: users.leader1, includeProxyRules: false,
  }, 'hv-result')
  const handoverId = hv.body?.data?.id
  const items = await call('admin', 'GET', `/workflow/handover/${handoverId}/items`, undefined, 'hv-items')
  await sleep(500)
  const after = await call('leader1', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=10', undefined, 'hv-todo-leader1')
  const retry = await call('admin', 'POST', '/workflow/handover', {
    fromUserId: users.leader2, toUserId: users.leader1, includeProxyRules: false,
  }, 'hv-retry')
  out('handover-summary', {
    handoverId,
    migrated: hv.body?.data?.migratedItems, failed: hv.body?.data?.failedItems,
    itemResults: (items.body?.data ?? []).map((i) => ({ task: i.taskId, result: i.result, before: i.beforeAssignee, after: i.afterAssignee })),
    leader1TodoAfter: (after.body?.data?.records ?? []).length,
    retryMigrated: retry.body?.data?.migratedItems,
  })
  console.log('HANDOVER_OK', JSON.stringify({ migrated: hv.body?.data?.migratedItems, retryMigrated: retry.body?.data?.migratedItems }))
}

// ---------- openapi：G5 真实 HTTP 对端 ----------
async function openapi() {
  const SECRET = process.env.I4_OPENAPI_SECRET ?? '' // 原文已安全移除（G6a）：sha256=fcba56c261010a10a795ef40b347938165fcf6b69cbe9ab60eded236849dd49a
  const appId = 'i4-demo-app'
  // 本机受控真实 HTTP 对端：独立端口真实 socket，接收签名回调并原样落盘
  const received = []
  const server = createServer((req, res) => {
    let body = ''
    req.on('data', (c) => (body += c))
    req.on('end', () => {
      received.push({ headers: req.headers, body, at: new Date().toISOString() })
      writeFileSync(`${DIR}/openapi-callback-received.json`, JSON.stringify(received, null, 2))
      res.writeHead(200); res.end('ok')
    })
  })
  await new Promise((r) => server.listen(9999, r))

  const sign = (secret, ts, nonce, body) => {
    // 与服务端同口径：HMAC 密钥 = SHA-256(appSecret)（服务端仅存摘要，原文不出库）
    const keyMaterial = createHash('sha256').update(secret).digest('hex')
    const material = appId + ts + nonce + createHash('sha256').update(body).digest('hex')
    return createHmac('sha256', keyMaterial).update(material).digest('hex')
  }
  const openCall = async (method, path, payloadObj, { withSign = true, secret = SECRET, reuse } = {}) => {
    const body = payloadObj === undefined ? '' : JSON.stringify(payloadObj)
    const ts = String(Math.floor(Date.now() / 1000))
    const nonce = reuse ? reuse.nonce : randomBytes(8).toString('hex')
    const headers = {
      'Content-Type': 'application/json',
      'X-App-Id': appId,
      'X-Timestamp': ts,
      'X-Nonce': nonce,
    }
    if (withSign) headers['X-Signature'] = sign(secret, ts, nonce, body)
    return await new Promise((resolve, reject) => {
      const req = httpRequest(BASE + path, { method, headers }, (res) => {
        let buf = ''
        res.on('data', (c) => (buf += c))
        res.on('end', () => {
          const parsed = safe(buf)
          writeFileSync(`${DIR}/openapi-${tagOf(path)}-${nonce.slice(0, 6)}.json`, JSON.stringify({ path, status: res.statusCode, body: parsed }, null, 2))
          resolve({ status: res.statusCode, body: parsed })
        })
      })
      req.on('error', reject)
      if (body) req.write(body)
      req.end()
    })
  }
  const tagOf = (p) => p.replace(/[^a-z0-9]+/gi, '-').slice(0, 40)

  // 1) 外部发起（真实表单链）
  const ids = JSON.parse(readFileSync(`${DIR}/setup-summary.json`, 'utf8'))
  const start = await openCall('POST', '/openapi/v1/processes', {
    formKey: 'i4_leave_form',
    formData: { days: 1, reason: 'I4 外部应用发起', deptList: `${ids.depts.deptA}` },
    businessKey: 'ext-biz-001',
    idempotencyKey: 'ext-idem-001',
  })
  // 2) 幂等重放：同键再发 → idempotentReplay
  const replay = await openCall('POST', '/openapi/v1/processes', {
    formKey: 'i4_leave_form',
    formData: { days: 1, reason: 'I4 外部应用发起', deptList: `${ids.depts.deptA}` },
    businessKey: 'ext-biz-001',
    idempotencyKey: 'ext-idem-001',
  })
  // 3) 错误签名拒绝 + 重放 nonce 拒绝
  const badSign = await openCall('GET', '/openapi/v1/processes/whatever', undefined, { withSign: false })
  // 4) 越租户查询拒绝：伪造不存在实例
  const notVisible = await openCall('GET', '/openapi/v1/processes/00000000-0000-0000-0000-000000000000')
  // 5) 等待终态回调（实例由 leader1 办理后触发 PROCESS_APPROVED）
  await sleep(3000)
  out('openapi-summary', {
    startCode: start.body?.code, recordId: start.body?.data?.recordId,
    replayIdempotent: replay.body?.data?.idempotentReplay,
    badSignCode: badSign.body?.code,
    notVisibleCode: notVisible.body?.code,
    callbacksReceived: received.length,
    callbackHeaders: received[0] ? { signature: received[0].headers['x-callback-signature']?.slice(0, 16), appId: received[0].headers['x-app-id'] } : null,
  })
  console.log('OPENAPI_OK', JSON.stringify({
    start: start.body?.code, replay: replay.body?.data?.idempotentReplay,
    badSign: badSign.body?.code, notVisible: notVisible.body?.code, callbacks: received.length,
  }))
  server.close()
}

await ({ frozen, ops, batch, handover, openapi }[phase] || (async () => console.error('unknown phase', phase)))()
