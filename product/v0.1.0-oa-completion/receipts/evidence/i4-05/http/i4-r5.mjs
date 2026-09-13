#!/usr/bin/env node
/**
 * I4 iteration-05 采集脚本（三级提示 03：R2/R3/R5 服务端链；R1 已独立 PG 测试，R4 已锁定）。
 * 独立证据包：evidence/i4-05/{R2,R3,R5}/ 分包落盘。
 * 用法: node i4-r5.mjs <phase>  phase ∈ login | setup | r2 | r3 | r5 | index
 */
import { request as httpRequest } from 'node:http'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { createHash, publicEncrypt, createPublicKey, constants } from 'node:crypto'

const ROOT = 'E:/code/Smart-WorkFlow-Agent-Workspace/product/v0.1.0-oa-completion/receipts/evidence/i4-05'
const DIR = ROOT + '/http'
const TOKEN_DIR = '/tmp/i4-tokens'
const BASE = 'http://localhost:8080/api'
const phase = process.argv[2] || 'login'

mkdirSync(DIR, { recursive: true })
mkdirSync(TOKEN_DIR, { recursive: true })

const safe = (t) => { try { return JSON.parse(t) } catch { return t } }
const out = (n, o) => writeFileSync(`${DIR}/${n}.json`, JSON.stringify(o, null, 2))
const outTo = (sub, n, o) => { mkdirSync(`${ROOT}/${sub}`, { recursive: true }); writeFileSync(`${ROOT}/${sub}/${n}.json`, JSON.stringify(o, null, 2)) }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const ASSERTS = []
const PKG_ASSERTS = {}
function assert(pkg, name, cond, detail) {
  const row = { name, pass: !!cond, detail: detail ?? '' }
  ASSERTS.push(row)
  ;(PKG_ASSERTS[pkg] = PKG_ASSERTS[pkg] || []).push(row)
  console.log((cond ? 'PASS ' : 'FAIL ') + pkg + '/' + name + (cond ? '' : ' :: ' + JSON.stringify(detail)))
}
function flushAsserts() {
  for (const [pkg, rows] of Object.entries(PKG_ASSERTS)) {
    mkdirSync(`${ROOT}/${pkg}`, { recursive: true })
    writeFileSync(`${ROOT}/${pkg}/asserts.json`, JSON.stringify({
      total: rows.length, failed: rows.filter((r) => !r.pass).length, rows,
    }, null, 2))
  }
}

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
  for (const [code, name, sort] of [['i4-dept-a', '研发一部', 1], ['i4-dept-b', '研发二部', 2], ['i4-dept-d', '研发四部', 4]]) {
    await step(`create-dept-${code}`, 'admin', 'POST', '/system/dept', { name, code, parentId: 1, sort, status: 0 }, { tolerate: true })
  }
  const tree = await step('dept-tree', 'admin', 'GET', '/system/dept/tree')
  const deptByCode = {}
  const walk = (n) => { for (const x of n ?? []) { deptByCode[x.code] = x.id; walk(x.children) } }
  walk(tree)
  const depts = { A: deptByCode['i4-dept-a'], B: deptByCode['i4-dept-b'], D: deptByCode['i4-dept-d'] }
  await step('update-dept-a', 'admin', 'PUT', '/system/dept', { id: depts.A, name: '研发一部', code: 'i4-dept-a', parentId: 1, sort: 1, status: 0, leaderId: users.leader1 })
  await step('update-dept-b', 'admin', 'PUT', '/system/dept', { id: depts.B, name: '研发二部', code: 'i4-dept-b', parentId: 1, sort: 2, status: 0, leaderId: users.leader2 })
  await step('update-dept-d', 'admin', 'PUT', '/system/dept', { id: depts.D, name: '研发四部', code: 'i4-dept-d', parentId: 1, sort: 4, status: 0, leaderId: users.w })

  let empRole = ((await step('role-page', 'admin', 'POST', '/system/role/page', { pageNum: 1, pageSize: 50 })).records ?? []).find((r) => r.code === 'i4_employee')?.id
  if (!empRole) empRole = await step('role-create', 'admin', 'POST', '/system/role', { name: 'I4 员工', code: 'i4_employee', sort: 9, status: 1, dataScope: 1 })
  await step('role-menus', 'admin', 'PUT', `/system/role/${empRole}/menus`, [24, 25, 26, 320, 350, 353, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375])
  for (const u of ['leader1', 'leader2', 'initiator', 'w']) {
    await step(`assign-role-${u}`, 'admin', 'PUT', '/system/user', { id: users[u], username: u, realName: u, deptId: 1, status: 0, roleIds: [empRole] })
  }
  await step('assign-role-outsider', 'admin', 'PUT', '/system/user', { id: users.outsider, username: 'outsider', realName: 'outsider', deptId: 1, status: 0, roleIds: [] })

  // 表单：协作单 + 移动详情单（REFERENCE + attachment TEXT 存 storageKey）
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

  await step('create-form-r5', 'admin', 'POST', '/form/def', { formKey: 'i4_r5_detail', name: 'I4 移动详情单', logicalTableName: 'i4_r5_detail', description: 'R5 移动端详情与意见表单样本' }, { tolerate: true })
  const r5form = ((await step('page-forms-2', 'admin', 'GET', '/form/def/page?pageNum=1&pageSize=50')).records ?? []).find((f) => f.formKey === 'i4_r5_detail')
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

  // 定义：R（动态并行）、TWO（两节点退回样本）、RJ（驳回样本）、TD（超时样本：deadline dueMinutes=1）
  const defR = await ensureDynDef(step, 'I4 动态并行协作审批', 'i4_dynamic_parallel_def')
  const defTwo = await ensureTwoStepDef(step, 'I4 两节点退回审批', 'i4_two_step_def', users)
  const defRJ = await ensureSingleDef(step, 'I4 驳回单节点', 'i4_reject_def', users.leader1)
  const defTD = await ensureTimeoutDef(step, 'I4 超时单节点', 'i4_timeout_def', users.leader1)
  const defOPW = await ensureOpwDef(step, 'I4 移动意见审批', 'i4_r5_opinion_def', users.w, r5form.formKey)
  Object.assign(idx, {
    generatedAt: new Date().toISOString(), tenant: 0, users, depts,
    forms: { leave: 'i4_leave_form', r5: 'i4_r5_detail' },
    defs: { R: defR, TWO: defTwo, RJ: defRJ, TD: defTD, OPW: defOPW },
  })
  saveIndex(idx)
  console.log('SETUP_OK', JSON.stringify({ users, depts }))
}

async function ensureDynDef(step, name, processKey) {
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

async function ensureTwoStepDef(step, name, processKey, users) {
  const defPage = await step('page-defs', 'admin', 'GET', '/workflow/defs?pageNum=1&pageSize=100')
  let def = (defPage.records ?? []).find((d) => d.name === name)
  if (!def) def = await step('create-def-two', 'admin', 'POST', '/workflow/defs', { name, formKey: 'i4_leave_form' })
  const defId = def.defId ?? def.id
  if (def.status !== 'PUBLISHED') {
    await step('save-graph-two', 'admin', 'PUT', `/workflow/defs/${defId}/graph`, {
      processKey, name, formKey: 'i4_leave_form', version: 1, contractVersion: 2,
      elements: [
        { id: 'start', kind: 'node', type: 'START', x: 80, y: 200 },
        { id: 'a1', kind: 'node', type: 'APPROVAL', x: 260, y: 200, config: { name: '一审', participant: { strategy: 'FIXED_USER', value: [String(users.leader1)] } } },
        { id: 'a2', kind: 'node', type: 'APPROVAL', x: 440, y: 200, config: { name: '二审', participant: { strategy: 'FIXED_USER', value: [String(users.leader2)] } } },
        { id: 'end', kind: 'node', type: 'END', x: 600, y: 200 },
        { id: 'e1', kind: 'edge', source: 'start', target: 'a1' },
        { id: 'e2', kind: 'edge', source: 'a1', target: 'a2' },
        { id: 'e3', kind: 'edge', source: 'a2', target: 'end' },
      ],
    })
    await step('validate-two', 'admin', 'POST', `/workflow/defs/${defId}/validate`, {})
  }
  await step('publish-def-two', 'admin', 'POST', `/workflow/defs/${defId}/publish`, {})
  const detail = await step('def-detail-two', 'admin', 'GET', `/workflow/defs/${defId}`)
  return { defId, processKey: detail?.processKey ?? processKey, name }
}

async function ensureSingleDef(step, name, processKey, approverId, timeoutMinutes = null) {
  const defPage = await step('page-defs', 'admin', 'GET', '/workflow/defs?pageNum=1&pageSize=100')
  let def = (defPage.records ?? []).find((d) => d.name === name)
  if (!def) def = await step('create-def-single', 'admin', 'POST', '/workflow/defs', { name, formKey: 'i4_leave_form' })
  const defId = def.defId ?? def.id
  if (def.status !== 'PUBLISHED') {
    const config = { name: '主管审批', participant: { strategy: 'FIXED_USER', value: [String(approverId)] } }
    if (timeoutMinutes) config.deadline = { dueMinutes: timeoutMinutes }
    await step('save-graph-single', 'admin', 'PUT', `/workflow/defs/${defId}/graph`, {
      processKey, name, formKey: 'i4_leave_form', version: 1, contractVersion: 2,
      elements: [
        { id: 'start', kind: 'node', type: 'START', x: 80, y: 200 },
        { id: 'appr', kind: 'node', type: 'APPROVAL', x: 320, y: 200, config },
        { id: 'end', kind: 'node', type: 'END', x: 560, y: 200 },
        { id: 'e1', kind: 'edge', source: 'start', target: 'appr' },
        { id: 'e2', kind: 'edge', source: 'appr', target: 'end' },
      ],
    })
    await step('validate-single', 'admin', 'POST', `/workflow/defs/${defId}/validate`, {})
  }
  await step('publish-def-single', 'admin', 'POST', `/workflow/defs/${defId}/publish`, {})
  const detail = await step('def-detail-single', 'admin', 'GET', `/workflow/defs/${defId}`)
  return { defId, processKey: detail?.processKey ?? processKey, name }
}

async function ensureTimeoutDef(step, name, processKey, approverId) {
  return ensureSingleDef(step, name, processKey, approverId, 1)
}

async function bindDef(defLabel) {
  const idx = loadIndex()
  const def = idx.defs[defLabel]
  const r = await call('admin', 'POST', `/workflow/defs/${def.defId}/publish`, {}, `bind-${defLabel}`)
  if (r.body?.code !== 0) { console.error('BIND_FAIL', defLabel, JSON.stringify(r.body)); process.exit(1) }
  ;(idx.bindingLog = idx.bindingLog || []).push({ def: defLabel, at: new Date().toISOString() })
  saveIndex(idx)
  await sleep(800)
  console.log('BOUND', defLabel)
}

async function submitFormAndGetPi(user, formKey, formData, tag) {
  const before = await call(user, 'GET', '/workflow/my/instances?pageNum=1&pageSize=1')
  const submit = await call(user, 'POST', `/form/data/${formKey}`, formData, tag)
  if (submit.body?.code !== 0) return { submit, pi: null }
  await sleep(2200)
  const after = await call(user, 'GET', '/workflow/my/instances?pageNum=1&pageSize=30', undefined, tag + '-instances')
  const known = new Set((before.body?.data?.records ?? []).map((x) => x.processInstanceId))
  const inst = (after.body?.data?.records ?? []).find((x) => !known.has(x.processInstanceId))
  return { submit, pi: inst?.processInstanceId ?? null }
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

// ───────────── R2：O3 三任务选择性迁移 + outsider TERMINATE ─────────────
async function r2() {
  const idx = loadIndex()
  await bindDef('R')
  const o3 = await submitFormAndGetPi('initiator', 'i4_leave_form',
    { days: 2, reason: 'I4-r5 选择性迁移 O3', deptList: `${idx.depts.A},${idx.depts.B},${idx.depts.D}` }, 'r2-o3-submit')
  assert('R2', 'o3.threeBranches', !!o3.pi, o3)
  idx.instances = idx.instances || {}
  idx.instances.O3 = o3.pi
  saveIndex(idx)
  await sleep(2000)
  const o3Br = (await call('admin', 'GET', `/workflow/monitor/instances/${o3.pi}/branches`, undefined, 'r2-o3-branches')).body?.data ?? []
  assert('R2', 'o3.branchCount3', o3Br.length === 3, o3Br.map((b) => ({ idx: b.branchIndex, leader: b.leaderId })))
  const tL1 = (o3Br.find((b) => String(b.leaderId) === String(idx.users.leader1)) ?? {}).taskId
  const tW = (o3Br.find((b) => String(b.leaderId) === String(idx.users.w)) ?? {}).taskId
  assert('R2', 'o3.tasksReady', !!tL1 && !!tW, { tL1, tW })
  idx.tasks = { O3_T_L1: tL1, O3_T_W: tW }
  saveIndex(idx)
  // 选择性迁移：只迁 leader1 的任务，未选任务（w）保持原办理人
  const l2Before = ((await call('w', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=30')).body?.data?.records ?? []).map((t) => t.taskId)
  await call('admin', 'POST', `/workflow/monitor/instances/${o3.pi}/intervene`,
    { action: 'TRANSFER', reason: 'I4-r5 选择性迁移', toAssignee: idx.users.leader2, taskIds: [tL1] }, 'r2-o3-selective-transfer')
  await sleep(1500)
  const wAfter = ((await call('w', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=30')).body?.data?.records ?? []).map((t) => t.taskId)
  const l2After = ((await call('leader2', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=30')).body?.data?.records ?? []).map((t) => t.taskId)
  assert('R2', 'o3.unselectedUntouched', l2Before.includes(tW) && wAfter.includes(tW), tW)
  const audits = (await call('admin', 'GET', `/workflow/monitor/instances/${o3.pi}/interventions`, undefined, 'r2-o3-interventions')).body?.data ?? []
  const transferRows = audits.filter((a) => a.action === 'TRANSFER')
  assert('R2', 'o3.auditMatchesSelected',
    transferRows.length === 1 && String(transferRows[0].fromAssignee) === String(idx.users.leader1)
    && transferRows[0].affectedTasks === 1 && l2After.includes(tL1) && !l2After.includes(tW),
    transferRows.map((a) => ({ from: a.fromAssignee, to: a.toAssignee, n: a.affectedTasks })))
  // outsider TERMINATE 被拒 + 零写入
  const auditsBeforeOut = (await call('admin', 'GET', `/workflow/monitor/instances/${o3.pi}/interventions`)).body?.data ?? []
  await loginOne('outsider', 'User@123')
  const oTerm = await call('outsider', 'POST', `/workflow/monitor/instances/${o3.pi}/intervene`, { action: 'TERMINATE', reason: '越权终止' }, 'r2-outsider-terminate')
  assert('R2', 'outsider.terminateDenied', oTerm.status === 403 || oTerm.body?.code !== 0, { status: oTerm.status, code: oTerm.body?.code })
  await loginOne('admin', 'admin123')
  const auditsAfterOut = (await call('admin', 'GET', `/workflow/monitor/instances/${o3.pi}/interventions`, undefined, 'r2-o3-interventions-after-outsider')).body?.data ?? []
  assert('R2', 'outsider.zeroIncrement', auditsAfterOut.length === auditsBeforeOut.length, { before: auditsBeforeOut.length, after: auditsAfterOut.length })
  const o3Status = await waitInstanceStatus('initiator', o3.pi, ['RUNNING'], 2)
  assert('R2', 'o3.stillRunning', !!o3Status, o3.pi)
  await loginOne('w', 'User@123')
  console.log('R2_DONE')
}

// ───────────── R3：REJECTED/超时/退回样本 + 全集重采 + ATT 链 ─────────────
async function r3() {
  const idx = loadIndex()
  // ① 驳回样本（REJECTED）
  await bindDef('RJ')
  const rj = await submitFormAndGetPi('initiator', 'i4_leave_form', { days: 1, reason: 'I4-r5 驳回样本' }, 'r3-rj-submit')
  assert('R3', 'rj.submitted', !!rj.pi, rj)
  await sleep(1500)
  const rjTask = ((await call('leader1', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=30')).body?.data?.records ?? []).find((t) => t.processInstanceId === rj.pi)
  const rjC = await call('leader1', 'POST', `/workflow/commands/tasks/${rjTask.taskId}/reject`, { comment: 'I4-r5 驳回意见' }, 'r3-rj-reject')
  const rjCmd = await pollCommand('leader1', rjC.body?.data?.commandId, 'r3-rj-reject-cmdstatus')
  assert('R3', 'rj.rejected', !!rjCmd && rjCmd.status === 'COMPLETED', rjCmd)
  const rjInst = await waitInstanceStatus('initiator', rj.pi, ['REJECTED'])
  assert('R3', 'rj.instanceRejected', !!rjInst, rj.pi)
  ;(idx.instances = idx.instances || {}).REJ = rj.pi
  saveIndex(idx)

  // 退回样本（两节点：a1 通过 → a2 RETURN 回 a1）
  await bindDef('TWO')
  const rt = await submitFormAndGetPi('initiator', 'i4_leave_form', { days: 1, reason: 'I4-r5 退回样本' }, 'r3-rt-submit')
  assert('R3', 'rt.submitted', !!rt.pi, rt)
  await sleep(1500)
  const t1 = ((await call('leader1', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=30')).body?.data?.records ?? []).find((t) => t.processInstanceId === rt.pi)
  await call('leader1', 'POST', `/workflow/commands/tasks/${t1.taskId}/complete`, { comment: '一审通过' }, 'r3-rt-complete-a1')
  await sleep(2200)
  const t2 = ((await call('leader2', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=30')).body?.data?.records ?? []).find((t) => t.processInstanceId === rt.pi)
  const rtC = await call('leader2', 'POST', `/workflow/commands/tasks/${t2.taskId}/return`, { comment: 'I4-r5 退回一审', returnTargetNodeId: 'a1' }, 'r3-rt-return')
  const rtCmd = await pollCommand('leader2', rtC.body?.data?.commandId, 'r3-rt-return-cmdstatus')
  assert('R3', 'rt.returned', !!rtCmd && rtCmd.status === 'COMPLETED', rtCmd)
  const rtBack = ((await call('leader1', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=30')).body?.data?.records ?? []).some((t) => t.processInstanceId === rt.pi)
  assert('R3', 'rt.backToA1', rtBack, rt.pi)
  ;(idx.instances = idx.instances || {}).RET = rt.pi
  saveIndex(idx)

  // 超时样本（节点 deadline dueMinutes=1，不办理等 70s）
  await bindDef('TD')
  const td = await submitFormAndGetPi('initiator', 'i4_leave_form', { days: 1, reason: 'I4-r5 超时样本' }, 'r3-td-submit')
  assert('R3', 'td.submitted', !!td.pi, td)
  ;(idx.instances = idx.instances || {}).OVERDUE = td.pi
  saveIndex(idx)
  console.log('等待超时窗口 70s...')
  await sleep(70000)
  const dl = (await call('admin', 'GET', `/workflow/monitor/instances/${td.pi}/deadlines`, undefined, 'r3-td-deadlines')).body?.data ?? []
  assert('R3', 'td.overdueRow', dl.some((d) => d.overdue === true && d.handled === false), dl)

  // 附件授权链：initiator 上传 → storageKey → 表单数据（R5 场景共用）→ 有权下载 200 / outsider 403
  const upload = await uploadAttachment('initiator', 'R5 附件样本.txt', 'R5 附件样本内容', 'r3-att-upload')
  assert('R3', 'att.uploaded', upload.body?.code === 0 && upload.body?.data?.storageKey, upload.body?.data)
  idx.attachment = { recordKey: null, storageKey: upload.body?.data?.storageKey, storageName: upload.body?.data?.storageName, fileSize: upload.body?.data?.fileSize }
  saveIndex(idx)

  // 全集 A2 重采（含 REJECTED/OVERDUE/退回中/TERMINATED/RUNNING/APPROVED）
  await bindDef('R')
  const full = (await call('admin', 'GET', '/workflow/monitor/instances?pageNum=1&pageSize=200', undefined, 'r3-fullset')).body?.data ?? {}
  const fullRows = full.records ?? []
  const ids = fullRows.map((r) => (r.instance ?? r).processInstanceId)
  const statuses = {}
  const raws = []
  for (const pi of ids) {
    const d = (await call('admin', 'GET', `/workflow/instances/${pi}`)).body?.data
    raws.push({ pi, status: d?.status, createTime: d?.createTime, initiatorId: d?.initiatorId, flowTrace: d?.flowTrace ?? [] })
    statuses[d?.status] = (statuses[d?.status] ?? 0) + 1
  }
  outTo('R3', 'a2-fullset-raw', { total: full.total, ids, statuses, raws })
  assert('R3', 'a2.matrix', statuses.APPROVED > 0 && statuses.RUNNING > 0 && statuses.REJECTED > 0 && statuses.TERMINATED > 0, statuses)
  // 复算（同 R3 上一轮口径 + returned/overdue）
  function parseTs(s) {
    if (!s) return null
    const [date, time] = String(s).split('T')
    const [h, m, rest] = time.split(':')
    const sec = Number.parseInt(rest, 10)
    const frac = Number.parseFloat('0.' + String(rest).split('.')[1] || '0')
    return Date.parse(date + 'T' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':00Z') + sec * 1000 + frac * 1000
  }
  const pct = (arr, p) => { if (!arr.length) return 0; const s2 = [...arr].sort((a, b) => a - b); const i = ((s2.length - 1) * p) / 100; const lo = Math.floor(i), hi = Math.ceil(i); return s2[lo] + (s2[hi] - s2[lo]) * (i - lo) }
  const durations = []
  const nodeDurations = {}
  const idToUser = Object.fromEntries(Object.entries(idx.users).map(([u, id]) => [String(id), u]))
  const workload = {}
  let returnedCount = 0
  let rejectedActionCount = 0
  let overdueCount = 0
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
    // 办理动作（发起人视角 history 行带 action）
    const owner = idToUser[String(r.initiatorId)]
    if (!owner) continue
    const rows2 = ((await call(owner, 'GET', '/workflow/my/instances?pageNum=1&pageSize=30')).body?.data?.records ?? [])
    const entityId = (rows2.find((x) => x.processInstanceId === r.pi) ?? {}).id
    if (!entityId) continue
    const hist = ((await call(owner, 'GET', `/workflow/my/instances/${entityId}`)).body?.data?.history ?? [])
    for (const h of hist) {
      if (h.taskId && h.action) {
        if (h.assignee) workload[h.assignee] = (workload[h.assignee] ?? 0) + 1
        if (h.action === 'RETURN') returnedCount++
        if (h.action === 'REJECT' || h.action === 'DISAPPROVE') rejectedActionCount++
      }
    }
    // 超期（该实例 deadlines 端 + 未办行）
    try {
      const dl = (await call('admin', 'GET', `/workflow/monitor/instances/${r.pi}/deadlines`)).body?.data ?? []
      overdueCount += dl.filter((d) => d.overdue === true).length
    } catch { /* 读取失败不阻断 */ }
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
    returnedCount,
    rejectedActionCount,
    overdueCount,
    nodeStats,
  }
  outTo('R3', 'recompute', recompute)
  const apiResp = await call('admin', 'GET', '/workflow/monitor/analytics/summary', undefined, 'r3-summary-api')
  const api = apiResp.body?.data ?? {}
  outTo('R3', 'summary-api', api)
  const num = (v) => Number(v ?? 0)
  assert('R3', 'exact.launched', num(api.launched) === recompute.launched, { api: api.launched, rc: recompute.launched })
  assert('R3', 'exact.completed', num(api.completed) === recompute.completed, { api: api.completed, rc: recompute.completed })
  assert('R3', 'exact.running', num(api.running) === recompute.running, { api: api.running, rc: recompute.running })
  assert('R3', 'exact.rejected', num(api.rejected) === recompute.rejected, { api: api.rejected, rc: recompute.rejected })
  assert('R3', 'exact.durationSample', num(api.durationSample) === recompute.durationSample, { api: api.durationSample, rc: recompute.durationSample })
  assert('R3', 'exact.avgDurationMs', num(api.avgDurationMs) === recompute.avgDurationMs, { api: api.avgDurationMs, rc: recompute.avgDurationMs })
  assert('R3', 'exact.p50DurationMs', num(api.p50DurationMs) === recompute.p50DurationMs, { api: api.p50DurationMs, rc: recompute.p50DurationMs })
  assert('R3', 'exact.p90DurationMs', num(api.p90DurationMs) === recompute.p90DurationMs, { api: api.p90DurationMs, rc: recompute.p90DurationMs })
  assert('R3', 'nonzero.duration', recompute.durationSample > 0 && recompute.avgDurationMs > 0, { n: recompute.durationSample })
  assert('R3', 'nonzero.rejected', recompute.rejected > 0, recompute.rejected)
  assert('R3', 'nonzero.returned', recompute.returnedCount > 0, recompute.returnedCount)
  assert('R3', 'nonzero.overdue', recompute.overdueCount > 0, recompute.overdueCount)
  const normW = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [k, Number(v)])).sort ? Object.fromEntries(Object.entries(o).map(([k, v]) => [String(k), Number(v)]).sort(([a], [b]) => String(a).localeCompare(String(b)))) : {}
  assert('R3', 'exact.handlerWorkload', JSON.stringify(normW(api.handlerWorkload ?? {})) === JSON.stringify(normW(recompute.handlerWorkload)), { api: api.handlerWorkload, rc: recompute.handlerWorkload })
  assert('R3', 'exact.returnedCount', num(api.returnedCount) === recompute.returnedCount, { api: api.returnedCount, rc: recompute.returnedCount })
  assert('R3', 'exact.rejectedActionCount', num(api.rejectedActionCount) === recompute.rejectedActionCount, { api: api.rejectedActionCount, rc: recompute.rejectedActionCount })
  assert('R3', 'exact.overdueCount', num(api.overdueCount) === recompute.overdueCount, { api: api.overdueCount, rc: recompute.overdueCount })
  const apiNode = {}
  for (const [k, v] of Object.entries(api.nodeStats ?? {})) {
    apiNode[k] = { count: Number(v.count), avgStayMs: Number(v.avgStayMs), p90StayMs: Number(v.p90StayMs) }
  }
  assert('R3', 'exact.nodeStats', JSON.stringify(apiNode) === JSON.stringify(recompute.nodeStats), { api: apiNode, rc: recompute.nodeStats })
  await loginOne('outsider', 'User@123')
  const oSummary = await call('outsider', 'GET', '/workflow/monitor/analytics/summary', undefined, 'r3-outsider-summary')
  assert('R3', 'outsider.summaryDenied', oSummary.status === 403 || oSummary.body?.code !== 0, oSummary.body?.code)
  await loginOne('admin', 'admin123')
  console.log('R3_DONE')
}

async function ensureOpwDef(step, name, processKey, approverUserId, formKey) {
  const defPage = await step('page-defs-opw', 'admin', 'GET', '/workflow/defs?pageNum=1&pageSize=100')
  let def = (defPage.records ?? []).find((d) => d.name === name)
  if (!def) def = await step('create-def-opw', 'admin', 'POST', '/workflow/defs', { name, formKey })
  const defId = def.defId ?? def.id
  if (def.status !== 'PUBLISHED') {
    const cf = {
      name: '移动审批',
      participant: { strategy: 'FIXED_USER', value: [String(approverUserId)] },
      opinionForm: {
        formId: 'I4_R5_OPINION_FORM', version: '1',
        fields: [
          { key: 'comment', type: 'TEXTAREA', required: true, label: '审批意见', maxLength: 200 },
          { key: 'rating', type: 'RADIO', required: true, label: '协作评价', options: ['满意', '不满意'] },
          { key: 'note', type: 'NOTE', label: '请依据协作单信息如实评价' },
        ],
      },
    }
    await step('save-graph-opw', 'admin', 'PUT', `/workflow/defs/${defId}/graph`, {
      processKey, name, formKey, version: 1, contractVersion: 2,
      elements: [
        { id: 'start', kind: 'node', type: 'START', x: 80, y: 200 },
        { id: 'appr', kind: 'node', type: 'APPROVAL', x: 320, y: 200, config: cf },
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

async function uploadAttachment(user, name, content, tag) {
  // multipart 最小实现（Node http 手工拼 boundary）
  return new Promise((resolve, reject) => {
    const boundary = '----i4att' + Date.now()
    const body = Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="r5-sample.txt"\r\nContent-Type: text/plain\r\n\r\n`),
      Buffer.from(content, 'utf8'),
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ])
    const req = httpRequest(BASE + '/workflow/attachments/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        Authorization: `Bearer ${token(user)}`,
        'Content-Length': body.length,
      },
    }, (res) => {
      let buf = ''
      res.on('data', (c) => (buf += c))
      res.on('end', () => {
        const parsed = safe(buf)
        if (tag) writeFileSync(`${DIR}/${tag}.json`, JSON.stringify({ user, method: 'POST', path: '/workflow/attachments/upload', status: res.statusCode, body: parsed }, null, 2))
        resolve({ status: res.statusCode, body: parsed })
      })
    })
    req.on('error', reject)
    req.write(body)
    req.end()
  })
}

// ───────────── R5 服务端部分：FK/ATT 授权正反向 HTTP（浏览器部分另跑） ─────────────
async function r5() {
  const idx = loadIndex()
  await bindDef('OPW')
  // R5X 移动样本（携带外键 + 附件 storageKey）
  const sub = await submitFormAndGetPi('w', 'i4_r5_detail',
    { days: 1, reason: 'I4-r5 移动详情样本', dept_ref: (idx.r5RefRecordId || 'b62b9d20-6f0a-4bd4-9641-ad0ab4a06d48') }, 'r5-w-submit')
  assert('R5', 'wTask.submitted', !!sub.pi, sub)
  idx.instances = idx.instances || {}
  idx.instances.R5X = sub.pi
  saveIndex(idx)
  await sleep(1500)
  const wTask = ((await call('w', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=30')).body?.data?.records ?? []).find((t) => t.processInstanceId === sub.pi)
  idx.taskIdR5 = wTask?.taskId
  saveIndex(idx)
  assert('R5', 'wTask.onW', !!wTask, wTask?.taskId)
  // 附件授权正反向：w（发起人）下载 200；outsider 403
  const dlOk = await call('w', 'GET', `/workflow/attachments/${idx.attachment.storageKey /* recordId=businessKey 采集器下补 */}`)
  // 这里 recordId 用 R5X 的 businessKey；直接从实例行读
  const rows = ((await call('w', 'GET', '/workflow/my/instances?pageNum=1&pageSize=30')).body?.data?.records ?? [])
  const row = rows.find((x) => x.processInstanceId === sub.pi)
  const bk = row?.businessKey
  const dlOk2 = await new Promise((resolve) => {
    const r = httpRequest(BASE + `/workflow/attachments/${bk}/download?storageKey=${idx.attachment.storageKey}`, { headers: { Authorization: `Bearer ${token('w')}` } }, (res) => {
      res.on('data', () => {})
      res.on('end', () => resolve({ status: res.statusCode, code: 'stream' }))
    })
    r.end()
  })
  assert('R5', 'att.ownerDownload200', dlOk2.status === 200, dlOk2)
  await loginOne('outsider', 'User@123')
  const dlOut = await new Promise((resolve) => {
    const r = httpRequest(BASE + `/workflow/attachments/${bk}/download?storageKey=${idx.attachment.storageKey}`, { headers: { Authorization: `Bearer ${token('outsider')}` } }, (res) => {
      let buf = ''
      res.on('data', (c) => (buf += c))
      res.on('end', () => resolve({ status: res.statusCode, body: safe(buf) }))
    })
    r.end()
  })
  assert('R5', 'att.outsiderDenied', dlOut.status === 403 || (dlOut.body?.code ?? 0) !== 0, { status: dlOut.status, code: dlOut.body?.code })
  idx.r5BusinessKey = bk
  saveIndex(idx)
  await loginOne('w', 'User@123')
  console.log('R5_SVC_DONE')
}

async function r3b() {
  const idx = loadIndex()
  await bindDef('RJ')
  // APPROVED 样本：提交后 leader1 通过
  const ap = await submitFormAndGetPi('initiator', 'i4_leave_form', { days: 1, reason: 'I4-r5 APPROVED 样本' }, 'r3b-ap-submit')
  assert('R3', 'ap.submitted', !!ap.pi, ap)
  await sleep(1500)
  const apTask = ((await call('leader1', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=30')).body?.data?.records ?? []).find((t) => t.processInstanceId === ap.pi)
  const apC = await call('leader1', 'POST', `/workflow/commands/tasks/${apTask.taskId}/complete`, { comment: 'I4-r5 通过办结' }, 'r3b-ap-complete')
  const apCmd = await pollCommand('leader1', apC.body?.data?.commandId, 'r3b-ap-cmdstatus')
  assert('R3', 'ap.completed', !!apCmd && apCmd.status === 'COMPLETED', apCmd)
  const apInst = await waitInstanceStatus('initiator', ap.pi, ['APPROVED'])
  assert('R3', 'ap.approved', !!apInst, ap.pi)
  ;(idx.instances = idx.instances || {}).APPROVED_S = ap.pi
  saveIndex(idx)

  // TERMINATED 样本（独立实例，不影响已锁定的 O3 RUNNING）
  await bindDef('TD')
  const tm = await submitFormAndGetPi('initiator', 'i4_leave_form', { days: 1, reason: 'I4-r5 TERMINATED 样本' }, 'r3b-tm-submit')
  assert('R3', 'tm.submitted', !!tm.pi, tm)
  await sleep(1500)
  await call('admin', 'POST', `/workflow/monitor/instances/${tm.pi}/intervene`, { action: 'TERMINATE', reason: 'I4-r5 终止样本' }, 'r3b-tm-terminate')
  const tmInst = await waitInstanceStatus('initiator', tm.pi, ['TERMINATED'])
  assert('R3', 'tm.terminated', !!tmInst, tm.pi)
  ;(idx.instances = idx.instances || {}).TERM_S = tm.pi
  saveIndex(idx)

  // 全集 A2 重采 + exact-equality 断言（同 r3 逻辑，抽出复用）
  await fullSetCheck()
  console.log('R3B_DONE')
}

async function fullSetCheck() {
  const idx = loadIndex()
  const full = (await call('admin', 'GET', '/workflow/monitor/instances?pageNum=1&pageSize=200', undefined, 'r3b-fullset')).body?.data ?? {}
  const fullRows = full.records ?? []
  const ids = fullRows.map((r) => (r.instance ?? r).processInstanceId)
  const statuses = {}
  const raws = []
  for (const pi of ids) {
    const d = (await call('admin', 'GET', `/workflow/instances/${pi}`)).body?.data
    raws.push({ pi, status: d?.status, createTime: d?.createTime, initiatorId: d?.initiatorId, flowTrace: d?.flowTrace ?? [] })
    statuses[d?.status] = (statuses[d?.status] ?? 0) + 1
  }
  outTo('R3', 'a2-fullset-raw', { total: full.total, ids, statuses, raws })
  assert('R3', 'a2.matrix', (statuses.APPROVED ?? 0) > 0 && (statuses.RUNNING ?? 0) > 0 && (statuses.REJECTED ?? 0) > 0 && (statuses.TERMINATED ?? 0) > 0, statuses)
  function parseTs(s) {
    if (!s) return null
    const [date, time] = String(s).split('T')
    const [h, m, rest] = time.split(':')
    const sec = Number.parseInt(rest, 10)
    const frac = Number.parseFloat('0.' + String(rest).split('.')[1] || '0')
    return Date.parse(date + 'T' + String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0') + ':00Z') + sec * 1000 + frac * 1000
  }
  const pct = (arr, p) => { if (!arr.length) return 0; const s2 = [...arr].sort((a, b) => a - b); const i = ((s2.length - 1) * p) / 100; const lo = Math.floor(i), hi = Math.ceil(i); return s2[lo] + (s2[hi] - s2[lo]) * (i - lo) }
  const durations = []
  const nodeDurations = {}
  const idToUser = Object.fromEntries(Object.entries(idx.users).map(([u, id]) => [String(id), u]))
  const workload = {}
  let returnedCount = 0
  let rejectedActionCount = 0
  let overdueCount = 0
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
    const owner = idToUser[String(r.initiatorId)]
    if (!owner) continue
    const rows2 = ((await call(owner, 'GET', '/workflow/my/instances?pageNum=1&pageSize=30')).body?.data?.records ?? [])
    const entityId = (rows2.find((x) => x.processInstanceId === r.pi) ?? {}).id
    if (!entityId) continue
    const hist = ((await call(owner, 'GET', `/workflow/my/instances/${entityId}`)).body?.data?.history ?? [])
    for (const h of hist) {
      if (h.taskId && h.action) {
        if (h.assignee) workload[h.assignee] = (workload[h.assignee] ?? 0) + 1
        if (h.action === 'RETURN') returnedCount++
        if (h.action === 'REJECT' || h.action === 'DISAPPROVE') rejectedActionCount++
      }
    }
    const dl = (await call('admin', 'GET', `/workflow/monitor/instances/${r.pi}/deadlines`)).body?.data ?? []
    overdueCount += dl.filter((d) => d.overdue === true).length
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
    returnedCount,
    rejectedActionCount,
    overdueCount,
    nodeStats,
  }
  outTo('R3', 'recompute', recompute)
  const apiResp = await call('admin', 'GET', '/workflow/monitor/analytics/summary', undefined, 'r3-summary-api-final')
  const api = apiResp.body?.data ?? {}
  outTo('R3', 'summary-api', api)
  const num = (v) => Number(v ?? 0)
  assert('R3', 'final.launched', num(api.launched) === recompute.launched, { api: api.launched, rc: recompute.launched })
  assert('R3', 'final.completed', num(api.completed) === recompute.completed, { api: api.completed, rc: recompute.completed })
  assert('R3', 'final.running', num(api.running) === recompute.running, { api: api.running, rc: recompute.running })
  assert('R3', 'final.rejected', num(api.rejected) === recompute.rejected, { api: api.rejected, rc: recompute.rejected })
  assert('R3', 'final.durationSample', num(api.durationSample) === recompute.durationSample, { api: api.durationSample, rc: recompute.durationSample })
  assert('R3', 'final.avgDurationMs', num(api.avgDurationMs) === recompute.avgDurationMs, { api: api.avgDurationMs, rc: recompute.avgDurationMs })
  assert('R3', 'final.p50DurationMs', num(api.p50DurationMs) === recompute.p50DurationMs, { api: api.p50DurationMs, rc: recompute.p50DurationMs })
  assert('R3', 'final.p90DurationMs', num(api.p90DurationMs) === recompute.p90DurationMs, { api: api.p90DurationMs, rc: recompute.p90DurationMs })
  const normW = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [String(k), Number(v)]).sort(([a], [b]) => String(a).localeCompare(String(b))))
  assert('R3', 'final.handlerWorkload', JSON.stringify(normW(api.handlerWorkload ?? {})) === JSON.stringify(normW(recompute.handlerWorkload)), { api: api.handlerWorkload, rc: recompute.handlerWorkload })
  assert('R3', 'final.returnedCount', num(api.returnedCount) === recompute.returnedCount, { api: api.returnedCount, rc: recompute.returnedCount })
  assert('R3', 'final.rejectedActionCount', num(api.rejectedActionCount) === recompute.rejectedActionCount, { api: api.rejectedActionCount, rc: recompute.rejectedActionCount })
  assert('R3', 'final.overdueCount', num(api.overdueCount) === recompute.overdueCount, { api: api.overdueCount, rc: recompute.overdueCount })
  const apiNode = {}
  for (const [k, v] of Object.entries(api.nodeStats ?? {})) {
    apiNode[k] = { count: Number(v.count), avgStayMs: Number(v.avgStayMs), p90StayMs: Number(v.p90StayMs) }
  }
  const normN = (o) => Object.fromEntries(Object.entries(o).sort(([a], [b]) => String(a).localeCompare(String(b))))
  assert('R3', 'final.nodeStats', JSON.stringify(normN(apiNode)) === JSON.stringify(normN(recompute.nodeStats)), { api: apiNode, rc: recompute.nodeStats })
}

async function index() {
  out('object-index', loadIndex())
  flushAsserts()
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

await ({ login, setup, r2, r3, r3b, r5, index }[phase] || (async () => console.error('unknown phase', phase)))()
const failed = ASSERTS.filter((a) => !a.pass)
out('asserts-' + phase, { total: ASSERTS.length, failed: failed.length, rows: ASSERTS })
console.log(`PHASE ${phase}: ${ASSERTS.length - failed.length}/${ASSERTS.length} asserts passed`)
if (failed.length) process.exit(2)
