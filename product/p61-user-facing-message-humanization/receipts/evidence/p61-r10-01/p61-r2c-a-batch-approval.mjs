/**
 * R2c-A 真实混合批量审批：同一批次至少一项成功、一项失败；四项计数与服务端一致；
 * 失败项可下钻（逐项 message/errorCode）；处理中由服务端同步契约显式给出。
 *
 * 链路：建表单→发布→建流程定义→保存图（首节点 DESIGNATED 用户1）→发布→提交两个实例
 *       →轮询待办取两个 taskId→batch-action（1 成功 + 1 失败）→业务回读（待办余 1）。
 * 输出：r2c-a-results.json + runtime-http.txt（追加）
 */
import { appendFileSync, writeFileSync } from 'node:fs'

const BASE = 'http://localhost:8080/api'
const OUT = './runtime-http.txt'
const log = (s = '') => appendFileSync(OUT, s + '\n', 'utf8')
const FORM_KEY = 'p61r10_batch_form'

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test_1' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch {}
  return { status: res.status, json, text }
}

log('\n===== R2c-A 混合批量审批（真实 HTTP + 业务回读） =====')
const trace = {}

// 1. 表单
let existing = await call('GET', `/form/def/by-key/${FORM_KEY}`)
let formId = existing.json?.data?.id
if (!formId) {
  // by-key 只对已发布表单可见；草稿经 page 检索
  const pg = await call('GET', `/form/def/page?pageNum=1&pageSize=50`)
  formId = (pg.json?.data?.records ?? []).find((r) => r.formKey === FORM_KEY)?.id
}
if (!formId) {
  const c = await call('POST', '/form/def',
    { formKey: FORM_KEY, name: 'P61 批量审批表单', logicalTableName: 'p61r10_batch', description: 'R2c-A 取景' })
  formId = c.json?.data?.id
  log('创建表单原始响应 code=' + c.json?.code + ' id=' + formId)
}
const def = { title: 'P61 批量审批表单', fields: [{ name: 'reason', type: 'TEXT', label: '理由', required: false, length: 120 }] }
await call('POST', `/form/def/${formId}/config`, { definition: JSON.stringify(def) })
if (existing.json?.data?.status !== 'PUBLISHED') {
  const pub = await call('POST', `/form/def/${formId}/publish`)
  log(`表单建立 id=${formId} publish code=${pub.json?.code} msg=${pub.json?.msg}`)
}
trace.formId = formId

// 2. 流程定义
let defList = await call('POST', '/workflow/defs', { name: 'P61 批量审批流程', formKey: FORM_KEY })
const defId = defList.json?.data?.defId
trace.defId = defId
log(`流程定义 defId=${defId} code=${defList.json?.code} msg=${defList.json?.msg}`)

// 3. 图：START → APPROVAL(DESIGNATED 用户1) → END
const graph = {
  processKey: 'p61r10_batch_flow', name: 'P61 批量审批流程', formKey: FORM_KEY,
  version: 1, contractVersion: 2,
  elements: [
    { id: 'start', kind: 'node', type: 'START', x: 80, y: 200 },
    { id: 'approve1', kind: 'node', type: 'APPROVAL', x: 260, y: 200,
      config: { name: '审批', approver: { type: 'DESIGNATED', value: ['1'] } } },
    { id: 'end', kind: 'node', type: 'END', x: 440, y: 200 },
    { id: 'e1', kind: 'edge', source: 'start', target: 'approve1' },
    { id: 'e2', kind: 'edge', source: 'approve1', target: 'end' },
  ],
}
const saved = await call('PUT', `/workflow/defs/${defId}/graph`, graph)
log(`保存图 code=${saved.json?.code} msg=${saved.json?.msg}`)
const validated = await call('POST', `/workflow/defs/${defId}/validate`)
log(`校验图 code=${validated.json?.code} errors=${JSON.stringify(validated.json?.data)}`)
const published = await call('POST', `/workflow/defs/${defId}/publish`)
log(`发布流程 code=${published.json?.code} status=${published.json?.data?.status} deploymentId=${published.json?.data?.deploymentId}`)

// 4. 提交两个实例（流程启动异步，之后轮询待办）
const s1 = await call('POST', `/form/data/${FORM_KEY}`, { reason: 'R2c-A 实例一' })
const s2 = await call('POST', `/form/data/${FORM_KEY}`, { reason: 'R2c-A 实例二' })
log(`提交实例一 code=${s1.json?.code} / 实例二 code=${s2.json?.code}`)

// 5. 轮询待办
let taskIds = []
for (let i = 0; i < 10; i++) {
  await new Promise((r) => setTimeout(r, 1500))
  const todo = await call('GET', '/workflow/tasks/todo?pageNum=1&pageSize=10')
  const records = todo.json?.data?.records ?? todo.json?.data?.list ?? []
  taskIds = records.map((r) => r.taskId)
  if (taskIds.length >= 2) break
}
trace.taskIds = taskIds
log(`待办 taskIds=${JSON.stringify(taskIds)}`)
if (taskIds.length < 2) {
  writeFileSync('./.tmp/r2c-a-results.json', JSON.stringify({ ok: false, error: '待办不足两个', trace }, null, 2), 'utf8')
  console.log('ABORT: 待办不足两个')
  process.exit(1)
}

// 6. 混合批量：t1 APPROVE（成功）+ t2 RETURN 无目标（失败 2306）
const [t1, t2] = taskIds
const batch = await call('POST', '/workflow/tasks/batch-action', {
  items: [
    { taskId: t1, action: 'APPROVE', comment: 'R2c-A 通过' },
    { taskId: t2, action: 'RETURN', comment: 'R2c-A 退回（无目标，应失败）' },
  ],
})
const data = batch.json?.data ?? {}
log(`批量结果 code=${batch.json?.code} total=${data.total} success=${data.success} failed=${data.failed} processing=${data.processing}`)
for (const row of data.results ?? []) {
  log(`    逐项 taskId=${row.taskId} action=${row.action} success=${row.success} errorCode=${row.errorCode ?? '-'} message=${JSON.stringify(row.message)}`)
}

// 7. 业务回读：待办应余 1（成功项消失，失败项保留）
await new Promise((r) => setTimeout(r, 1200))
const after = await call('GET', '/workflow/tasks/todo?pageNum=1&pageSize=10')
const afterRecords = after.json?.data?.records ?? after.json?.data?.list ?? []
const afterIds = afterRecords.map((r) => r.taskId)
log(`回读待办 after=${JSON.stringify(afterIds)}（成功项 ${t1} 应不在其中）`)
const leakScan = batch.text.includes('at java.') || batch.text.includes('Caused by') || batch.text.includes('org.flowable')

const result = {
  counters: { total: data.total, success: data.success, failed: data.failed, processing: data.processing },
  countersConsistent: data.total === (data.success ?? 0) + (data.failed ?? 0) + (data.processing ?? 0)
    && data.total === (data.results?.length ?? 0),
  firstSuccess: data.results?.[0]?.success === true,
  secondFailed: data.results?.[1]?.success === false && data.results?.[1]?.errorCode !== undefined,
  failMessage: data.results?.[1]?.message ?? null,
  processingExplicit: typeof data.processing === 'number',
  readBackAfter: afterIds,
  successTaskGone: !afterIds.includes(t1),
  failedTaskRemains: afterIds.includes(t2),
  serverAuthoritative: typeof data.total === 'number' && typeof data.success === 'number',
  noExceptionLeak: !leakScan,
  trace,
}
writeFileSync('./.tmp/r2c-a-results.json', JSON.stringify(result, null, 2), 'utf8')
console.log(JSON.stringify(result, null, 2))
