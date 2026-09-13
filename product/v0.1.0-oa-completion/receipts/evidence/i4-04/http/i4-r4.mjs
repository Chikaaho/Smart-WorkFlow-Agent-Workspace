#!/usr/bin/env node
/**
 * I4 iteration-04 采集脚本（二级提示 02：R2/R3/R4/R5 服务端链路；R1 为独立集成测试）。
 * 复用 i4-03 的对象口径（同一固定索引结构），全部走真实后端 HTTP。
 * 用法: node i4-r4.mjs <phase>  phase ∈ login | setup | r2 | r3 | r4 | r5 | index
 */
import { request as httpRequest } from 'node:http'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { createHash, publicEncrypt, createPublicKey, constants } from 'node:crypto'

// G6a 工具判定：脚本内 admin123/User@123 为仓库公知 dev 夹具默认口令（与既有测试种子一致），
// 对应账号仅存在于一次性 H2 内存库，进程终止即失效，不构成可用凭据。
const DIR = 'E:/code/Smart-WorkFlow-Agent-Workspace/product/v0.1.0-oa-completion/receipts/evidence/i4-04/http'
const TOKEN_DIR = '/tmp/i4-tokens'
const BASE = 'http://localhost:8080/api'
const phase = process.argv[2] || 'login'

mkdirSync(DIR, { recursive: true })
mkdirSync(TOKEN_DIR, { recursive: true })

const safe = (t) => { try { return JSON.parse(t) } catch { return t } }
const out = (n, o) => writeFileSync(`${DIR}/${n}.json`, JSON.stringify(o, null, 2))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function request(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = httpRequest(BASE + path, { method, headers: { 'Content-Type': 'application/json', ...headers } }, (res) => {
      let buf = ''
      res.on('data', (c) => (buf += c))
      res.on('end', () => resolve({ status: res.statusCode, body: safe(buf) }))
    })
    req.on('error', reject)
    if (body !== null && body !== undefined) req.write(typeof body === 'string' ? body : JSON.stringify(body))
    req.end()
  })
}
function token(user) {
  return JSON.parse(readFileSync(`${TOKEN_DIR}/token-${user}.json`, 'utf8')).accessToken
}
function call(user, method, path, body, tag) {
  return request(path, method, body, { Authorization: `Bearer ${token(user)}` }).then((r) => {
    if (tag) writeFileSync(`${DIR}/${tag}.json`, JSON.stringify({ user, method, path, status: r.status, body: r.body }, null, 2))
    return r
  })
}

const ASSERTS = []
function assert(name, cond, detail) {
  ASSERTS.push({ name, pass: !!cond, detail: detail ?? '' })
  console.log((cond ? 'PASS ' : 'FAIL ') + name + (cond ? '' : ' :: ' + JSON.stringify(detail)))
}

async function loginOne(username, password) {
  const ch = (await request('/auth/challenge')).body.data
  const key = createPublicKey({ key: Buffer.from(ch.publicKey, 'base64'), format: 'der', type: 'spki' })
  const enc = publicEncrypt({ key, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, Buffer.from(password, 'utf8'))
  const resp = await request('/auth/login', 'POST', { username, password: enc.toString('base64'), captcha: '1234', captchaId: ch.captchaId, timestamp: Date.now() })
  if (resp.body.code !== 0) throw new Error('LOGIN_FAIL ' + username)
  writeFileSync(`${TOKEN_DIR}/token-${username}.json`, JSON.stringify({ username, accessToken: resp.body.data.accessToken }))
}

async function login() {
  const roster = process.argv[3] === 'admin-only'
    ? [['admin', 'admin123']]
    : [['admin', 'admin123'], ['leader1', 'User@123'], ['leader2', 'User@123'], ['initiator', 'User@123'], ['w', 'User@123'], ['outsider', 'User@123']]
  for (const [username, password] of roster) await loginOne(username, password)
  console.log('LOGIN_OK', roster.map((r) => r[0]).join(','))
}

// ───────────── setup（幂等：双表单 + 定义 + 角色） ─────────────
async function setup() {
  const idx = loadIndex()
  const step = async (tag, user, method, path, body, { tolerate = false } = {}) => {
    const r = await call(user, method, path, body, tag)
    if ((r.body?.code ?? 0) !== 0 && !tolerate) { console.error('STEP_FAIL', tag, JSON.stringify(r.body).slice(0, 250)); process.exit(1) }
    return r.body?.data
  }
  for (const [username, realName] of [['leader1', '部门负责人一'], ['leader2', '部门负责人二'], ['initiator', '发起人小王'], ['w', '工作台用户'], ['outsider', '无关用户']]) {
    await step(`create-user-${username}`, 'admin', 'POST', '/system/user', { username, realName, plainPassword: 'User@123', deptId: 1, status: 0, roleIds: [] }, { tolerate: true })
  }
  const usersPage = await step('page-users', 'admin', 'POST', '/system/user/page', { pageNum: 1, pageSize: 50 })
  const users = {}
  for (const u of usersPage.records ?? []) users[u.username] = u.id
  for (const [code, name, sort] of [['i4-dept-a', '研发一部', 1], ['i4-dept-b', '研发二部', 2]]) {
    await step(`create-dept-${code}`, 'admin', 'POST', '/system/dept', { name, code, parentId: 1, sort, status: 0 }, { tolerate: true })
  }
  const tree = await step('dept-tree', 'admin', 'GET', '/system/dept/tree')
  const deptByCode = {}
  const walk = (n) => { for (const x of n ?? []) { deptByCode[x.code] = x.id; walk(x.children) } }
  walk(tree)
  const depts = { A: deptByCode['i4-dept-a'], B: deptByCode['i4-dept-b'] }
  await step('update-dept-a', 'admin', 'PUT', '/system/dept', { id: depts.A, name: '研发一部', code: 'i4-dept-a', parentId: 1, sort: 1, status: 0, leaderId: users.leader1 })
  await step('update-dept-b', 'admin', 'PUT', '/system/dept', { id: depts.B, name: '研发二部', code: 'i4-dept-b', parentId: 1, sort: 2, status: 0, leaderId: users.leader2 })

  const rolePage = await step('role-page', 'admin', 'POST', '/system/role/page', { pageNum: 1, pageSize: 50 })
  let empRole = (rolePage.records ?? []).find((r) => r.code === 'i4_employee')?.id
  if (!empRole) empRole = await step('role-create', 'admin', 'POST', '/system/role', { name: 'I4 员工', code: 'i4_employee', sort: 9, status: 1, dataScope: 1 })
  await step('role-menus', 'admin', 'PUT', `/system/role/${empRole}/menus`, [24, 25, 26, 320, 350, 353, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375])
  for (const u of ['leader1', 'leader2', 'initiator', 'w']) {
    await step(`assign-role-${u}`, 'admin', 'PUT', '/system/user', { id: users[u], username: u, realName: u, deptId: 1, status: 0, roleIds: [empRole] })
  }
  await step('assign-role-outsider', 'admin', 'PUT', '/system/user', { id: users.outsider, username: 'outsider', realName: 'outsider', deptId: 1, status: 0, roleIds: [] })

  // 表单 1：i4_leave_form（动态并行/交接样本）
  await step('create-form', 'admin', 'POST', '/form/def', { formKey: 'i4_leave_form', name: 'I4 部门协作单', logicalTableName: 'i4_leave_form', description: 'I4 动态并行验证表单' }, { tolerate: true })
  const formPage = await step('page-forms', 'admin', 'GET', '/form/def/page?pageNum=1&pageSize=50')
  const form = (formPage.records ?? []).find((f) => f.formKey === 'i4_leave_form')
  const leavePublished = (await call('admin', 'GET', `/form/def/${form.id}`)).body?.data?.status === 'PUBLISHED'
  if (!leavePublished) {
    await step('save-form-config', 'admin', 'POST', `/form/def/${form.id}/config`, {
      definition: JSON.stringify({
        schemaVersion: 1, title: 'I4 部门协作单',
        fields: [
          { name: 'days', type: 'NUMBER', label: '天数', required: true },
          { name: 'reason', type: 'TEXT', label: '事由', required: false, length: 200 },
          { name: 'deptList', type: 'TEXT', label: '协作部门', required: false, length: 500 },
        ],
      }),
    })
  }
  const pub = await call('admin', 'POST', `/form/def/${form.id}/publish`, '', 'publish-form')
  if (!(pub.body?.code === 0 || String(pub.body?.msg ?? '').includes('重复发布'))) { console.error('publish-form fail', JSON.stringify(pub.body)); process.exit(1) }

  // 表单 2：i4_r5_detail（含 REFERENCE 外键字段，R5 外键授权回显对象）
  await step('create-form-r5', 'admin', 'POST', '/form/def', { formKey: 'i4_r5_detail', name: 'I4 移动详情单', logicalTableName: 'i4_r5_detail', description: 'R5 移动端详情与意见表单样本' }, { tolerate: true })
  const r5form = (formPage.records ?? []).find((f) => f.formKey === 'i4_r5_detail')
    ?? (await step('page-forms-2', 'admin', 'GET', '/form/def/page?pageNum=1&pageSize=50')).records.find((f) => f.formKey === 'i4_r5_detail')
  const r5Published = (await call('admin', 'GET', `/form/def/${r5form.id}`)).body?.data?.status === 'PUBLISHED'
  if (!r5Published) {
    await step('save-form-config-r5', 'admin', 'POST', `/form/def/${r5form.id}/config`, {
      definition: JSON.stringify({
        schemaVersion: 1, title: 'I4 移动详情单',
        fields: [
          { name: 'days', type: 'NUMBER', label: '天数', required: true },
          { name: 'reason', type: 'TEXT', label: '事由', required: false, length: 200 },
          { name: 'dept_ref', type: 'REFERENCE', label: '关联协作单', required: false, targetFormId: 'i4_leave_form' },
        ],
      }),
    })
    await step('publish-form-r5', 'admin', 'POST', `/form/def/${r5form.id}/publish`, '')
  }

  // 定义 R（动态并行）与 OPW（指定 W + 正式意见表单，绑定 i4_r5_detail）
  const defR = await ensureDynDef(step, 'I4 动态并行协作审批', 'i4_dynamic_parallel_def', depts)
  const defOPW = await ensureOpwDef(step, 'I4 移动意见审批', 'i4_r5_opinion_def', users.w, r5form.formKey)

  Object.assign(idx, {
    generatedAt: new Date().toISOString(), tenant: 0, users, depts,
    forms: { leave: { formKey: 'i4_leave_form', formId: form.id }, r5: { formKey: 'i4_r5_detail', formId: r5form.id } },
    defs: { R: defR, OPW: defOPW },
  })
  saveIndex(idx)
  console.log('SETUP_OK', JSON.stringify({ users, depts }))
}

async function ensureDynDef(step, name, processKey, depts) {
  const defPage = await step('page-defs', 'admin', 'GET', '/workflow/defs?pageNum=1&pageSize=100')
  let def = (defPage.records ?? []).find((d) => d.name === name)
  if (!def) def = await step('create-def', 'admin', 'POST', '/workflow/defs', { name, formKey: 'i4_leave_form' })
  const defId = def.defId ?? def.id
  if (def.status !== 'PUBLISHED') {
    await step('save-graph', 'admin', 'PUT', `/workflow/defs/${defId}/graph`, {
      processKey, name, formKey: 'i4_leave_form', version: 1, contractVersion: 2,
      elements: [
        { id: 'start', kind: 'node', type: 'START', x: 80, y: 200 },
        { id: 'dyn', kind: 'node', type: 'DYNAMIC_PARALLEL', x: 300, y: 200, config: { name: '部门负责人并行审批', mode: 'ALL', maxBranches: 50, emptyStrategy: 'BLOCK', invalidStrategy: 'SKIP', source: { type: 'VARIABLE', value: 'deptList' } } },
        { id: 'end', kind: 'node', type: 'END', x: 560, y: 200 },
        { id: 'e1', kind: 'edge', source: 'start', target: 'dyn' },
        { id: 'e2', kind: 'edge', source: 'dyn', target: 'end' },
      ],
    })
    await step('validate', 'admin', 'POST', `/workflow/defs/${defId}/validate`, {})
  }
  await step('publish-def', 'admin', 'POST', `/workflow/defs/${defId}/publish`, {})
  const detail = await step('def-detail', 'admin', 'GET', `/workflow/defs/${defId}`)
  return { defId, processKey: detail?.processKey ?? processKey, name }
}

async function ensureOpwDef(step, name, processKey, approverUserId, formKey) {
  const defPage = await step('page-defs', 'admin', 'GET', '/workflow/defs?pageNum=1&pageSize=100')
  let def = (defPage.records ?? []).find((d) => d.name === name)
  if (!def) def = await step('create-def-opw', 'admin', 'POST', '/workflow/defs', { name, formKey })
  const defId = def.defId ?? def.id
  if (def.status !== 'PUBLISHED') {
    await step('save-graph-opw', 'admin', 'PUT', `/workflow/defs/${defId}/graph`, {
      processKey, name, formKey, version: 1, contractVersion: 2,
      elements: [
        { id: 'start', kind: 'node', type: 'START', x: 80, y: 200 },
        {
          id: 'appr', kind: 'node', type: 'APPROVAL', x: 320, y: 200,
          config: {
            name: '移动审批', participant: { strategy: 'FIXED_USER', value: [String(approverUserId)] },
            opinionForm: {
              formId: 'I4_R5_OPINION_FORM', version: '1',
              fields: [
                { key: 'comment', type: 'TEXTAREA', required: true, label: '审批意见', maxLength: 200 },
                { key: 'rating', type: 'RADIO', required: true, label: '协作评价', options: ['满意', '不满意'] },
                { key: 'note', type: 'NOTE', label: '请依据协作单信息如实评价' },
              ],
            },
          },
        },
        { id: 'end', kind: 'node', type: 'END', x: 560, y: 200 },
        { id: 'e1', kind: 'edge', source: 'start', target: 'appr' },
        { id: 'e2', kind: 'edge', source: 'appr', target: 'end' },
      ],
    })
    await step('validate-opw', 'admin', 'POST', `/workflow/defs/${defId}/validate`, {})
  }
  await step('publish-def-opw', 'admin', 'POST', `/workflow/defs/${defId}/publish`, {})
  const detail = await step('def-detail-opw', 'admin', 'GET', `/workflow/defs/${defId}`)
  return { defId, processKey: detail?.processKey ?? processKey, name }
}

async function bindDef(defLabel) {
  const idx = loadIndex()
  const def = idx.defs[defLabel]
  const r = await call('admin', 'POST', `/workflow/defs/${def.defId}/publish`, {}, `bind-${defLabel}`)
  if (r.body?.code !== 0) { console.error('BIND_FAIL', defLabel, JSON.stringify(r.body)); process.exit(1) }
  ;(idx.bindingLog = idx.bindingLog || []).push({ def: defLabel, at: new Date().toISOString() })
  saveIndex(idx)
  await sleep(800)
}

async function submitAndGetPi(user, formKey, formData, tag) {
  const before = await call(user, 'GET', '/workflow/my/instances?pageNum=1&pageSize=1')
  const submit = await call(user, 'POST', `/form/data/${formKey}`, formData, tag)
  if (submit.body?.code !== 0) return { submit, pi: null }
  await sleep(2200)
  const after = await call(user, 'GET', '/workflow/my/instances?pageNum=1&pageSize=30', undefined, tag + '-instances')
  const known = new Set((before.body?.data?.records ?? []).map((x) => x.processInstanceId))
  const inst = (after.body?.data?.records ?? []).find((x) => !known.has(x.processInstanceId))
  return { submit, pi: inst?.processInstanceId ?? null, entity: inst?.id }
}

async function myEntityId(user, pi) {
  const rows = (await call(user, 'GET', '/workflow/my/instances?pageNum=1&pageSize=30')).body?.data?.records ?? []
  return (rows.find((r) => r.processInstanceId === pi) ?? {}).id
}

async function pollCommand(user, commandId, tag, tries = 15) {
  if (!commandId) return null
  for (let i = 0; i < tries; i++) {
    const r = await call(user, 'GET', `/workflow/commands/${commandId}`, undefined, tag + '-' + (i + 1))
    const st = r.body?.data?.status
    if (st === 'COMPLETED' || st === 'FAILED') return r.body?.data
    await sleep(1200)
  }
  return null
}

async function waitInstanceStatus(user, pi, statuses, tries = 10) {
  for (let i = 0; i < tries; i++) {
    const mine = await call(user, 'GET', '/workflow/my/instances?pageNum=1&pageSize=30')
    const inst = (mine.body?.data?.records ?? []).find((x) => x.processInstanceId === pi)
    if (inst && statuses.includes(inst.status)) return inst
    await sleep(1200)
  }
  return null
}

// ───────────── R2：迁移分组审计 + 终止真实链 ─────────────
async function r2() {
  const idx = loadIndex()
  await bindDef('R')
  // O1：双分支，TRANSFER 后审计按原办理人分组
  const o1 = await submitAndGetPi('initiator', 'i4_leave_form', { days: 2, reason: 'I4-r4 迁移审计 O1', deptList: `${idx.depts.A},${idx.depts.B}` }, 'r2-o1-submit')
  assert('R2.o1.running', !!o1.pi, o1)
  idx.instances = idx.instances || {}
  idx.instances.O1 = o1.pi
  saveIndex(idx)
  await sleep(1500)
  const o1Br = (await call('admin', 'GET', `/workflow/monitor/instances/${o1.pi}/branches`, undefined, 'r2-o1-branches')).body?.data ?? []
  const taskOf = (leader) => (o1Br.find((b) => String(b.leaderId) === String(leader)) ?? {}).taskId
  const tL1 = taskOf(idx.users.leader1)
  const tL2 = taskOf(idx.users.leader2)
  assert('R2.o1.tasks', !!tL1 && !!tL2, { tL1, tL2 })
  const l2Before = ((await call('leader2', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=30')).body?.data?.records ?? []).map((t) => t.taskId)
  await call('admin', 'POST', `/workflow/monitor/instances/${o1.pi}/intervene`, { action: 'TRANSFER', reason: 'I4-r4 迁移审计验证', toAssignee: idx.users.leader1 }, 'r2-o1-transfer')
  await sleep(1500)
  const l1After = ((await call('leader1', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=30')).body?.data?.records ?? []).map((t) => t.taskId)
  const l2After = ((await call('leader2', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=30')).body?.data?.records ?? []).map((t) => t.taskId)
  assert('R2.o1.transferEffect', l2Before.includes(tL2) && !l2After.includes(tL2) && l1After.includes(tL1) && l1After.includes(tL2), { l1After: l1After.length })
  const audits1 = (await call('admin', 'GET', `/workflow/monitor/instances/${o1.pi}/interventions`, undefined, 'r2-o1-interventions')).body?.data ?? []
  const transferRows = audits1.filter((a) => a.action === 'TRANSFER')
  const groupL1 = transferRows.find((a) => String(a.fromAssignee) === String(idx.users.leader1))
  const groupL2 = transferRows.find((a) => String(a.fromAssignee) === String(idx.users.leader2))
  assert('R2.o1.auditGrouped',
    transferRows.length === 2 && groupL1 && groupL2
    && groupL1.affectedTasks === 1 && groupL2.affectedTasks === 1
    && String(groupL1.toAssignee) === String(idx.users.leader1)
    && String(groupL2.toAssignee) === String(idx.users.leader1)
    && groupL1.operatorId != null && !!groupL1.reason,
    transferRows.map((a) => ({ from: a.fromAssignee, to: a.toAssignee, n: a.affectedTasks })))

  // O2：终止真实链
  const o2 = await submitAndGetPi('initiator', 'i4_leave_form', { days: 1, reason: 'I4-r4 终止 O2', deptList: `${idx.depts.A}` }, 'r2-o2-submit')
  assert('R2.o2.running', !!o2.pi, o2)
  idx.instances.O2 = o2.pi
  saveIndex(idx)
  await sleep(1500)
  const o2Task = ((await call('leader1', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=30')).body?.data?.records ?? []).find((t) => t.processInstanceId === o2.pi)
  const auditsBefore = (await call('admin', 'GET', `/workflow/monitor/instances/${o2.pi}/interventions`)).body?.data ?? []
  await call('admin', 'POST', `/workflow/monitor/instances/${o2.pi}/intervene`, { action: 'TERMINATE', reason: 'I4-r4 终止验证' }, 'r2-o2-terminate')
  await sleep(1500)
  const o2After = await waitInstanceStatus('initiator', o2.pi, ['TERMINATED'])
  assert('R2.o2.terminated', !!o2After, o2.pi)
  const o2Try = await call('leader1', 'POST', `/workflow/commands/tasks/${o2Task.taskId}/complete`, { comment: '终止后尝试' }, 'r2-o2-try-complete')
  const o2TryCmd = await pollCommand('leader1', o2Try.body?.data?.commandId, 'r2-o2-try-cmdstatus')
  assert('R2.o2.handleDeniedAfterTerminate', !!o2TryCmd && o2TryCmd.status === 'FAILED', o2TryCmd)
  const audits2 = (await call('admin', 'GET', `/workflow/monitor/instances/${o2.pi}/interventions`, undefined, 'r2-o2-interventions')).body?.data ?? []
  const termRow = audits2.find((a) => a.action === 'TERMINATE')
  assert('R2.o2.audit', !!termRow && termRow.beforeState === 'RUNNING' && termRow.afterState === 'TERMINATED' && termRow.operatorId != null, termRow)
  // outsider 反向：迁移与挂起拒绝 + 审计零增量
  await loginOne('outsider', 'User@123')
  const oOutT = await call('outsider', 'POST', `/workflow/monitor/instances/${o1.pi}/intervene`, { action: 'TRANSFER', reason: '越权', toAssignee: idx.users.w }, 'r2-outsider-transfer')
  const oOutS = await call('outsider', 'POST', `/workflow/monitor/instances/${o1.pi}/intervene`, { action: 'SUSPEND', reason: '越权' }, 'r2-outsider-suspend')
  assert('R2.outsider.denied', (oOutT.status === 403 || oOutT.body?.code !== 0) && (oOutS.status === 403 || oOutS.body?.code !== 0), { t: oOutT.body?.code, s: oOutS.body?.code })
  const auditsAfterOut = (await call('admin', 'GET', `/workflow/monitor/instances/${o1.pi}/interventions`, undefined, 'r2-o1-interventions-after-outsider')).body?.data ?? []
  assert('R2.outsider.auditZeroIncrement', auditsAfterOut.filter((a) => a.action === 'TRANSFER').length === 2, auditsAfterOut.length)
  console.log('R2_DONE')
}

// ───────────── R3：分析全量 exact-equality ─────────────
// 时间解析带亚毫秒精度（实现 Duration 纳秒差 toMillis 截断，复算 floor 对齐）
function parseTs(s) {
  if (!s) return null
  const [date, time] = String(s).split('T')
  const [h, m, rest] = time.split(':')
  const sec = Number.parseInt(rest, 10)
  const frac = Number.parseFloat('0.' + String(rest).split('.')[1] || '0')
  return Date.parse(date + 'T' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':00Z') + sec * 1000 + frac * 1000
}
async function r3() {
  const idx = loadIndex()
  // 固定查询时点：无时间窗全集（同一权限主体 admin、同一时点）
  const full = (await call('admin', 'GET', '/workflow/monitor/instances?pageNum=1&pageSize=200', undefined, 'r3-fullset')).body?.data ?? {}
  const fullRows = full.records ?? []
  const ids = fullRows.map((r) => (r.instance ?? r).processInstanceId)
  const raws = []
  for (const pi of ids) {
    const d = (await call('admin', 'GET', `/workflow/instances/${pi}`, undefined, undefined)).body?.data
    raws.push({ pi, status: d?.status, createTime: d?.createTime, initiatorId: d?.initiatorId, flowTrace: d?.flowTrace ?? [] })
  }
  out('r3-fullset-raw', { total: full.total, ids, raws })
  // 复算（与实现同口径：线性插值分位；终态时长=create→最大活动结束时间；工作量=办理动作计数）
  const durations = []
  const nodeDurations = {}
  for (const r of raws) {
    let maxEnd = null
    for (const a of r.flowTrace) {
      if (!a.endTime) continue
      const t = parseTs(a.endTime)
      maxEnd = maxEnd == null ? t : Math.max(maxEnd, t)
      if (a.activityType === 'userTask' && a.startTime) {
        ;(nodeDurations[a.activityId] = nodeDurations[a.activityId] ?? []).push(Math.floor(parseTs(a.endTime) - parseTs(a.startTime)))
      }
    }
    if ((r.status === 'APPROVED' || r.status === 'REJECTED') && r.createTime && maxEnd != null) {
      durations.push(Math.floor(maxEnd - parseTs(r.createTime)))
    }
  }
const pct = (arr, p) => { if (!arr.length) return 0; const s2 = [...arr].sort((a, b) => a - b); const i = ((s2.length - 1) * p) / 100; const lo = Math.floor(i), hi = Math.ceil(i); return s2[lo] + (s2[hi] - s2[lo]) * (i - lo) }
  const workload = {}
  const idToUser = Object.fromEntries(Object.entries(idx.users).map(([u, id]) => [String(id), u]))
  for (const r of raws) {
    const owner = idToUser[String(r.initiatorId)]
    if (!owner) continue
    const entityId = await myEntityId(owner, r.pi)
    if (!entityId) continue
    const detailResp = await call(owner, 'GET', `/workflow/my/instances/${entityId}`)
    const hist = detailResp.body?.data?.history ?? []
    for (const h of hist) {
      if (h.taskId && h.action) {
        workload[h.assignee] = (workload[h.assignee] ?? 0) + 1
      }
    }
  }
  const nodeStats = {}
  for (const [k, v] of Object.entries(nodeDurations)) {
    nodeStats[k] = { count: v.length, avgStayMs: v.reduce((a, b) => a + b, 0) / v.length, p90StayMs: Math.round(pct(v, 90)) }
  }
  const recompute = {
    launched: raws.length,
    completed: raws.filter((r) => r.status === 'APPROVED' || r.status === 'REJECTED').length,
    running: raws.filter((r) => r.status === 'RUNNING').length,
    rejected: raws.filter((r) => r.status === 'REJECTED').length,
    avgDurationMs: durations.length ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
    p50DurationMs: Math.round(pct(durations, 50)),
    p90DurationMs: Math.round(pct(durations, 90)),
    durationSample: durations.length,
    handlerWorkload: workload,
    nodeStats,
  }
  out('r3-recompute', recompute)
  const apiResp = await call('admin', 'GET', '/workflow/monitor/analytics/summary', undefined, 'r3-summary-api')
  const api = apiResp.body?.data ?? {}
  out('r3-summary-api', api)
  const num = (v) => Number(v ?? 0)
  assert('R3.exact.launched', num(api.launched) === recompute.launched, { api: api.launched, rc: recompute.launched })
  assert('R3.exact.completed', num(api.completed) === recompute.completed, { api: api.completed, rc: recompute.completed })
  assert('R3.exact.running', num(api.running) === recompute.running, { api: api.running, rc: recompute.running })
  assert('R3.exact.rejected', num(api.rejected) === recompute.rejected, { api: api.rejected, rc: recompute.rejected })
  assert('R3.exact.durationSample', num(api.durationSample) === recompute.durationSample, { api: api.durationSample, rc: recompute.durationSample })
  assert('R3.exact.avgDurationMs', num(api.avgDurationMs) === recompute.avgDurationMs, { api: api.avgDurationMs, rc: recompute.avgDurationMs })
  assert('R3.exact.p50DurationMs', num(api.p50DurationMs) === recompute.p50DurationMs, { api: api.p50DurationMs, rc: recompute.p50DurationMs })
  assert('R3.exact.p90DurationMs', num(api.p90DurationMs) === recompute.p90DurationMs, { api: api.p90DurationMs, rc: recompute.p90DurationMs })
  assert('R3.nonzero.duration', recompute.durationSample > 0 && recompute.avgDurationMs > 0, { n: recompute.durationSample, avg: recompute.avgDurationMs })
  const apiWorkload = Object.fromEntries(Object.entries(api.handlerWorkload ?? {}).map(([k, v]) => [k, Number(v)]))
  const sortKeys = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => a.localeCompare(b)))
  assert('R3.exact.handlerWorkload', JSON.stringify(sortKeys(apiWorkload)) === JSON.stringify(sortKeys(recompute.handlerWorkload)), { api: apiWorkload, rc: recompute.handlerWorkload })
  const apiNode = {}
  for (const [k, v] of Object.entries(api.nodeStats ?? {})) {
    apiNode[k] = { count: Number(v.count), avgStayMs: Number(v.avgStayMs), p90StayMs: Number(v.p90StayMs) }
  }
  assert('R3.exact.nodeStats', JSON.stringify(apiNode) === JSON.stringify(recompute.nodeStats), { api: apiNode, rc: recompute.nodeStats })
  // outsider 拒绝
  await loginOne('outsider', 'User@123')
  const oSummary = await call('outsider', 'GET', '/workflow/monitor/analytics/summary', undefined, 'r3-outsider-summary')
  assert('R3.outsider.summaryDenied', oSummary.status === 403 || oSummary.body?.code !== 0, oSummary.body?.code)
  await loginOne('admin', 'admin123')
  console.log('R3_DONE')
}

// ───────────── R4：交接前后历史 200 成功读取 + diff=0 ─────────────
async function r4() {
  const idx = loadIndex()
  const x = await submitAndGetPi('initiator', 'i4_leave_form', { days: 2, reason: 'I4-r4 历史样本 X', deptList: `${idx.depts.A},${idx.depts.B}` }, 'r4-x-submit')
  assert('R4.x.submitted', !!x.pi, x)
  idx.instances = idx.instances || {}
  idx.instances.X = x.pi
  saveIndex(idx)
  // leader1/leader2 办理 X → 产生既有办理人与意见
  await sleep(1200)
  const t1 = ((await call('leader1', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=30')).body?.data?.records ?? []).find((t) => t.processInstanceId === x.pi)
  const t2 = ((await call('leader2', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=30')).body?.data?.records ?? []).find((t) => t.processInstanceId === x.pi)
  await call('leader1', 'POST', `/workflow/commands/tasks/${t1.taskId}/complete`, { comment: 'I4-r4 历史意见一' }, 'r4-x-complete-leader1')
  await call('leader2', 'POST', `/workflow/commands/tasks/${t2.taskId}/complete`, { comment: 'I4-r4 历史意见二' }, 'r4-x-complete-leader2')
  await waitInstanceStatus('initiator', x.pi, ['APPROVED'])
  const readHistory = async (tag) => {
    const entityId = await myEntityId('initiator', x.pi)
    const r = await call('initiator', 'GET', `/workflow/my/instances/${entityId}`, undefined, tag)
    assert(`${tag}.status200`, r.status === 200 && r.body?.code === 0, { status: r.status, code: r.body?.code })
    const rows = (r.body?.data?.history ?? [])
      .filter((h) => h.taskId)
      .map((h) => ({ taskId: h.taskId, nodeKey: h.nodeKey, assignee: h.assignee, action: h.action ?? null, opinion: JSON.stringify(h.opinionData ?? h.opinion ?? null), end: h.endTime ?? null }))
      .sort((a, b) => a.taskId.localeCompare(b.taskId))
    return { status: r.status, rows }
  }
  const before = await readHistory('r4-x-history-before')
  // 交接：leader2 → w（scope R）
  const hv = await call('admin', 'POST', '/workflow/handover', { fromUserId: idx.users.leader2, toUserId: idx.users.w, scopeDefKeys: [idx.defs.R.processKey], includeProxyRules: false }, 'r4-handover')
  assert('R4.handover.accepted', hv.body?.code === 0, hv.body)
  const after = await readHistory('r4-x-history-after')
  assert('R4.history.diffZero', JSON.stringify(before.rows) === JSON.stringify(after.rows), { before: before.rows.length, after: after.rows.length })
  console.log('R4_DONE')
}

// ───────────── R5 服务端部分：W 的 OPW 任务 + 缺必填后端拒绝 + REF 值 ─────────────
async function r5() {
  const idx = loadIndex()
  await bindDef('OPW')
  // 外键回显对象：X 的业务记录 id（businessKey）
  const xEntity = await myEntityId('initiator', idx.instances.X)
  const xRow = ((await call('initiator', 'GET', '/workflow/my/instances?pageNum=1&pageSize=30')).body?.data?.records ?? []).find((r) => r.processInstanceId === idx.instances.X)
  const recordId = xRow?.businessKey
  const sub = await submitAndGetPi('w', 'i4_r5_detail', { days: 1, reason: 'I4-r4 移动详情样本', dept_ref: recordId }, 'r5-w-submit')
  assert('R5.wTask.submitted', !!sub.pi, sub)
  idx.instances.R5X = sub.pi
  saveIndex(idx)
  await sleep(1500)
  const wTask = ((await call('w', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=30')).body?.data?.records ?? []).find((t) => t.processInstanceId === sub.pi)
  assert('R5.wTask.onW', !!wTask, wTask?.taskId)
  idx.taskIdR5 = wTask?.taskId
  // 任务详情含 opinionForm 配置（W 视角）
  const detail = await call('w', 'GET', `/workflow/tasks/${wTask.taskId}`, undefined, 'r5-w-task-detail')
  assert('R5.detail.hasOpinionForm', detail.body?.code === 0 && (detail.body?.data?.opinionForm?.fields ?? []).length >= 3, detail.body?.data?.opinionForm)
  idx.r5OpinionForm = detail.body?.data?.opinionForm ?? null
  // 后端反向：缺必填意见数据 → 拒绝
  const missing = await call('w', 'POST', `/workflow/commands/tasks/${wTask.taskId}/complete`, { comment: '' }, 'r5-w-missing-required')
  const missingCmd = await pollCommand('w', missing.body?.data?.commandId, 'r5-w-missing-cmdstatus')
  assert('R5.missingRequired.denied', !!missingCmd && missingCmd.status === 'FAILED', missingCmd)
  // outsider 深链零数据（API）
  await loginOne('outsider', 'User@123')
  const denied = await call('outsider', 'GET', `/workflow/tasks/${wTask.taskId}`, undefined, 'r5-outsider-task-detail')
  assert('R5.outsider.detailDenied', denied.status === 403 || denied.body?.code !== 0, { status: denied.status, code: denied.body?.code })
  await loginOne('w', 'User@123')
  console.log('R5_SVC_DONE')
}

async function index() {
  out('object-index', loadIndex())
  console.log('INDEX_OK')
}

function loadIndex() {
  const p = `${DIR}/object-index.json`
  if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8'))
  return {}
}
function saveIndex(idx) {
  writeFileSync(`${DIR}/object-index.json`, JSON.stringify(idx, null, 2))
}

await ({ login, setup, r2, r3, r4, r5, index }[phase] || (async () => console.error('unknown phase', phase)))()
const failed = ASSERTS.filter((a) => !a.pass)
out('asserts-' + phase, { total: ASSERTS.length, failed: failed.length, rows: ASSERTS })
console.log(`PHASE ${phase}: ${ASSERTS.length - failed.length}/${ASSERTS.length} asserts passed`)
if (failed.length) process.exit(2)
