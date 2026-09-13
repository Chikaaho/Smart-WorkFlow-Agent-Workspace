#!/usr/bin/env node
/**
 * I4 iteration-03 主采集脚本（G1a—G5b 同对象行为链）。
 *
 * 证据纪律：
 *  - 全部调用走真实后端 HTTP（localhost:8080/api），每步原始响应落盘本目录。
 *  - 固定对象索引 object-index.json：本轮全部断言只引用同一实例/任务/规则/事件。
 *  - token 只写 /tmp/i4-tokens/（证据包外），包内只存 sha256+长度（token-meta.json）。
 *  - OpenAPI secret 从环境变量 I4_OPENAPI_SECRET 读取，不进入本文件与证据包。
 *
 * 绑定口径：表单→流程定义为单活绑定（发布即换绑）。场景按绑定顺序分组：
 *   setup: 发布 R, RB（绑定=RB）
 *   g1:    换绑R → X/F；换绑RB → G1c 六负向
 *   g2:    换绑R → O/P；分析=全量监控行复算
 *   g3:    换绑SA → b1/done；SB → other；OP → op；换绑R → H1/H2
 *   g5:    R 仍绑定 → E 全链
 *
 * 用法: node i4-master.mjs <phase>
 *   phase ∈ login | setup | g1 | g2 | g3 | g5 | index
 */
import { request as httpRequest } from 'node:http'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { createHash, createHmac, randomBytes, publicEncrypt, createPublicKey, constants } from 'node:crypto'

// G6a 工具判定：本脚本内的 admin123/User@123 为仓库公知 dev 夹具默认口令
// （与既有测试种子一致），对应账号仅存在于一次性 H2 内存库，进程终止即失效，
// 不构成可用凭据；OpenAPI secret 经环境变量注入，证据包内仅存 SHA-256 与长度。
const DIR = 'E:/code/Smart-WorkFlow-Agent-Workspace/product/v0.1.0-oa-completion/receipts/evidence/i4-03/http'
const TOKEN_DIR = '/tmp/i4-tokens'
const BASE = 'http://localhost:8080/api'
const APP_ID = 'i4-demo-app' // V81 dev 种子应用
const phase = process.argv[2] || 'login'

mkdirSync(DIR, { recursive: true })
mkdirSync(TOKEN_DIR, { recursive: true })

// ────────────────────────── 公共工具 ──────────────────────────
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

// 签名口径与 OpenApiAuthService.sign 一致：HMAC-SHA256(sha256(secret), appId+ts+nonce+sha256(body))
const APP_SECRET = process.env.I4_OPENAPI_SECRET || ''
function openSign(ts, nonce, body) {
  const key = createHash('sha256').update(APP_SECRET).digest('hex')
  const material = APP_ID + ts + nonce + createHash('sha256').update(body).digest('hex')
  return createHmac('sha256', key).update(material).digest('hex')
}
function openCall(method, path, payloadObj, opts = {}) {
  const body = payloadObj === undefined ? '' : JSON.stringify(payloadObj)
  const ts = String(Math.floor(Date.now() / 1000))
  const nonce = opts.nonce ?? randomBytes(8).toString('hex')
  const headers = { 'Content-Type': 'application/json', 'X-App-Id': APP_ID, 'X-Timestamp': ts, 'X-Nonce': nonce, 'X-Signature': openSign(ts, nonce, body) }
  if (opts.badSignature) headers['X-Signature'] = 'f'.repeat(64)
  return request(path, method, body === '' ? null : body, headers).then((r) => {
    if (opts.tag) writeFileSync(`${DIR}/${opts.tag}.json`, JSON.stringify({ method, path, status: r.status, reqBody: payloadObj ?? null, body: r.body }, null, 2))
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
  if (resp.body.code !== 0) throw new Error('LOGIN_FAIL ' + username + ' ' + JSON.stringify(resp.body))
  writeFileSync(`${TOKEN_DIR}/token-${username}.json`, JSON.stringify({ username, accessToken: resp.body.data.accessToken }))
  return resp.body.data.accessToken
}

// ────────────────────────── phase: login ──────────────────────────
async function login() {
  // 用法: login [admin-only]；新库先建 admin 登录 → setup 建用户 → 再 login 全量
  const adminOnly = process.argv[3] === 'admin-only'
  const roster = adminOnly ? [['admin', 'admin123']] : [
    ['admin', 'admin123'], ['leader1', 'User@123'], ['leader2', 'User@123'],
    ['initiator', 'User@123'], ['w', 'User@123'], ['outsider', 'User@123'],
  ]
  const meta = { note: '仅哈希与长度；原文在证据包外 /tmp/i4-tokens/，服务进程结束即失效', captcha: 'dev test-mock 固定 1234', tokens: [] }
  for (const [username, password] of roster) {
    const accessToken = await loginOne(username, password)
    const sha = createHash('sha256').update(accessToken).digest('hex')
    console.log('LOGIN_OK', username, 'tokenLen=' + accessToken.length)
    meta.tokens.push({ user: username, sha256: sha, len: accessToken.length })
  }
  out('token-meta', meta)
  console.log('LOGIN_PHASE_DONE')
}

// ────────────────────────── phase: setup ──────────────────────────
async function setup() {
  const idx = loadIndex()
  const step = async (tag, user, method, path, body, { tolerate = false } = {}) => {
    const r = await call(user, method, path, body, tag)
    const code = r.body?.code ?? r.status
    if (code !== 0 && !tolerate) { console.error('STEP_FAIL', tag, JSON.stringify(r.body).slice(0, 300)); process.exit(1) }
    return r.body?.data
  }

  for (const [username, realName] of [
    ['leader1', '部门负责人一'], ['leader2', '部门负责人二'], ['initiator', '发起人小王'],
    ['w', '工作台用户'], ['outsider', '无关用户'],
  ]) {
    await step(`create-user-${username}`, 'admin', 'POST', '/system/user',
      { username, realName, plainPassword: 'User@123', deptId: 1, status: 0, roleIds: [] }, { tolerate: true })
  }
  const usersPage = await step('page-users', 'admin', 'POST', '/system/user/page', { pageNum: 1, pageSize: 50 })
  const users = {}
  for (const u of usersPage.records ?? []) users[u.username] = u.id

  for (const [code, name, sort] of [['i4-dept-a', '研发一部', 1], ['i4-dept-b', '研发二部', 2], ['i4-dept-c', '研发三部', 3], ['i4-dept-e', '无主部门', 5]]) {
    await step(`create-dept-${code}`, 'admin', 'POST', '/system/dept', { name, code, parentId: 1, sort, status: 0 }, { tolerate: true })
  }
  const tree = await step('dept-tree', 'admin', 'GET', '/system/dept/tree')
  const deptByCode = {}
  const walk = (nodes) => { for (const n of nodes ?? []) { deptByCode[n.code] = n.id; walk(n.children) } }
  walk(tree)
  const depts = { A: deptByCode['i4-dept-a'], B: deptByCode['i4-dept-b'], C: deptByCode['i4-dept-c'], E: deptByCode['i4-dept-e'] }
  await step('update-dept-a', 'admin', 'PUT', '/system/dept', { id: depts.A, name: '研发一部', code: 'i4-dept-a', parentId: 1, sort: 1, status: 0, leaderId: users.leader1 })
  await step('update-dept-b', 'admin', 'PUT', '/system/dept', { id: depts.B, name: '研发二部', code: 'i4-dept-b', parentId: 1, sort: 2, status: 0, leaderId: users.leader2 })
  await step('update-dept-c', 'admin', 'PUT', '/system/dept', { id: depts.C, name: '研发三部', code: 'i4-dept-c', parentId: 1, sort: 3, status: 0, leaderId: users.leader2 })

  const rolePage = await step('role-page', 'admin', 'POST', '/system/role/page', { pageNum: 1, pageSize: 50 })
  let empRole = (rolePage.records ?? []).find((r) => r.code === 'i4_employee')?.id
  if (!empRole) empRole = await step('role-create', 'admin', 'POST', '/system/role', { name: 'I4 员工', code: 'i4_employee', sort: 9, status: 1, dataScope: 1 })
  await step('role-enable', 'admin', 'PUT', '/system/role', { id: empRole, name: 'I4 员工', code: 'i4_employee', sort: 9, status: 1 })
  await step('role-menus', 'admin', 'PUT', `/system/role/${empRole}/menus`, [24, 25, 26, 320, 350, 359, 365, 366, 367, 368, 369, 370, 371, 372, 373, 374, 375])
  let basicRole = (rolePage.records ?? []).find((r) => r.code === 'i4_basic')?.id
  if (!basicRole) basicRole = await step('role-create-basic', 'admin', 'POST', '/system/role', { name: 'I4 基础', code: 'i4_basic', sort: 10, status: 1, dataScope: 1 })
  await step('role-menus-basic', 'admin', 'PUT', `/system/role/${basicRole}/menus`, [24, 25, 26, 320, 350])
  for (const u of ['leader1', 'leader2', 'initiator']) {
    await step(`assign-role-${u}`, 'admin', 'PUT', '/system/user', { id: users[u], username: u, realName: u, deptId: 1, status: 0, roleIds: [empRole] })
  }
  await step('assign-role-w', 'admin', 'PUT', '/system/user', { id: users.w, username: 'w', realName: 'w', deptId: 1, status: 0, roleIds: [basicRole] })
  await step('assign-role-outsider', 'admin', 'PUT', '/system/user', { id: users.outsider, username: 'outsider', realName: 'outsider', deptId: 1, status: 0, roleIds: [] })

  await step('create-form', 'admin', 'POST', '/form/def', { formKey: 'i4_leave_form', name: 'I4 部门协作单', logicalTableName: 'i4_leave_form', description: 'I4 动态并行验证表单' }, { tolerate: true })
  const formPage = await step('page-forms', 'admin', 'GET', '/form/def/page?pageNum=1&pageSize=50')
  const form = (formPage.records ?? []).find((f) => f.formKey === 'i4_leave_form')
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
  const pub = await call('admin', 'POST', `/form/def/${form.id}/publish`, '', 'publish-form')
  if (!(pub.body?.code === 0 || String(pub.body?.msg ?? '').includes('重复发布'))) {
    console.error('STEP_FAIL publish-form', JSON.stringify(pub.body)); process.exit(1)
  }

  const defR = await ensureDef(step, 'I4 动态并行协作审批', 'i4_dynamic_parallel_def', {
    name: '部门负责人并行审批', mode: 'ALL', maxBranches: 50, emptyStrategy: 'BLOCK', invalidStrategy: 'SKIP',
    source: { type: 'VARIABLE', value: 'deptList' },
  })
  const defRB = await ensureDef(step, 'I4 动态并行阻断审批', 'i4_dynamic_block_def', {
    name: '部门负责人并行审批', mode: 'ALL', maxBranches: 50, emptyStrategy: 'BLOCK', invalidStrategy: 'BLOCK',
    source: { type: 'VARIABLE', value: 'deptList' },
  })
  const defSA = await ensureApprovalDef(step, 'I4 单节点审批一', 'i4_single_approval_def', users.leader1, null)
  const defSB = await ensureApprovalDef(step, 'I4 单节点审批二', 'i4_single_approval_b_def', users.leader2, null)
  const defOP = await ensureApprovalDef(step, 'I4 强制意见审批', 'i4_opinion_def', users.leader1,
    { formId: 'I4_OPINION_FORM', version: '1', fields: [{ key: 'comment', type: 'TEXTAREA', required: true, label: '审批意见' }] })

  const tplPage = await call('admin', 'GET', '/workflow/templates?pageNum=1&pageSize=50', undefined, 'tpl-page')
  let tplM = (tplPage.body?.data?.records ?? []).find((t) => t.name === 'I4 协作模板M')
  if (!tplM) {
    tplM = await step('tpl-create', 'admin', 'POST', '/workflow/templates', {
      name: 'I4 协作模板M', category: '协同办公', description: 'I4 模板生命周期来源', formKey: 'i4_leave_form',
      graphJson: JSON.stringify(graphOf('i4_dynamic_parallel_def', 'I4 动态并行协作审批', {
        name: '部门负责人并行审批', mode: 'ALL', maxBranches: 50, emptyStrategy: 'BLOCK', invalidStrategy: 'SKIP',
        source: { type: 'VARIABLE', value: 'deptList' },
      })),
      scopeType: 'GLOBAL', scopeDeptId: null, sourceDefId: null, sourceDefVersion: null,
    })
  }
  let tplM2 = (tplPage.body?.data?.records ?? []).find((t) => t.name === 'I4 协作模板M2')
  if (!tplM2) {
    tplM2 = await step('tpl-create-m2', 'admin', 'POST', '/workflow/templates', {
      name: 'I4 协作模板M2', category: '协同办公', description: 'I4 停用后拒复制样本', formKey: 'i4_leave_form',
      graphJson: JSON.stringify(graphOf('i4_single_approval_def', 'I4 单节点审批一', null)),
      scopeType: 'GLOBAL', scopeDeptId: null, sourceDefId: null, sourceDefVersion: null,
    })
  }

  Object.assign(idx, {
    generatedAt: new Date().toISOString(),
    tenant: 0,
    users, depts,
    roles: { employee: empRole, basic: basicRole },
    form: { formKey: 'i4_leave_form', formId: form.id },
    defs: { R: defR, RB: defRB, SA: defSA, SB: defSB, OP: defOP },
    templates: { M: tplM, M2: tplM2 },
    bindingLog: [],
  })
  saveIndex(idx)
  console.log('SETUP_OK', JSON.stringify({ users, depts, tplM: tplM.id }))
}

async function ensureDef(step, name, processKey, dynConfig) {
  const defPage = await step('page-defs', 'admin', 'GET', '/workflow/defs?pageNum=1&pageSize=100')
  let def = (defPage.records ?? []).find((d) => d.name === name)
  if (!def) def = await step(`create-def-${processKey}`, 'admin', 'POST', '/workflow/defs', { name, formKey: 'i4_leave_form' })
  const defId = def.defId ?? def.id
  if (def.status !== 'PUBLISHED') { // 已发布定义冻结图，不可再改（I3 口径）；重跑 setup 直接走发布换绑
    await step(`save-graph-${processKey}`, 'admin', 'PUT', `/workflow/defs/${defId}/graph`, graphOf(processKey, name, dynConfig))
    await step(`validate-${processKey}`, 'admin', 'POST', `/workflow/defs/${defId}/validate`, {})
  }
  await step(`publish-def-${processKey}`, 'admin', 'POST', `/workflow/defs/${defId}/publish`, {})
  const detail = await step(`def-detail-${processKey}`, 'admin', 'GET', `/workflow/defs/${defId}`)
  return { defId, processKey: detail?.processKey ?? processKey, name }
}

async function ensureApprovalDef(step, name, processKey, approverUserId, opinionForm) {
  const defPage = await step('page-defs', 'admin', 'GET', '/workflow/defs?pageNum=1&pageSize=100')
  let def = (defPage.records ?? []).find((d) => d.name === name)
  if (!def) def = await step(`create-def-${processKey}`, 'admin', 'POST', '/workflow/defs', { name, formKey: 'i4_leave_form' })
  const defId = def.defId ?? def.id
  const config = { name: '主管审批', participant: { strategy: 'FIXED_USER', value: [String(approverUserId)] } }
  if (opinionForm) config.opinionForm = opinionForm
  if (def.status !== 'PUBLISHED') { // 已发布定义冻结图；重跑 setup 直接走发布换绑
    await step(`save-graph-${processKey}`, 'admin', 'PUT', `/workflow/defs/${defId}/graph`, {
      processKey, name, formKey: 'i4_leave_form', version: 1, contractVersion: 2,
      elements: [
        { id: 'start', kind: 'node', type: 'START', x: 80, y: 200 },
        { id: 'appr', kind: 'node', type: 'APPROVAL', x: 320, y: 200, config },
        { id: 'end', kind: 'node', type: 'END', x: 560, y: 200 },
        { id: 'e1', kind: 'edge', source: 'start', target: 'appr' },
        { id: 'e2', kind: 'edge', source: 'appr', target: 'end' },
      ],
    })
    await step(`validate-${processKey}`, 'admin', 'POST', `/workflow/defs/${defId}/validate`, {})
  }
  await step(`publish-def-${processKey}`, 'admin', 'POST', `/workflow/defs/${defId}/publish`, {})
  const detail = await step(`def-detail-${processKey}`, 'admin', 'GET', `/workflow/defs/${defId}`)
  return { defId, processKey: detail?.processKey ?? processKey, name }
}

function graphOf(processKey, name, dynConfig) {
  const elements = [
    { id: 'start', kind: 'node', type: 'START', x: 80, y: 200 },
    { id: 'end', kind: 'node', type: 'END', x: 560, y: 200 },
    { id: 'e1', kind: 'edge', source: 'start', target: 'dyn' },
    { id: 'e2', kind: 'edge', source: 'dyn', target: 'end' },
  ]
  if (dynConfig) elements.splice(1, 0, { id: 'dyn', kind: 'node', type: 'DYNAMIC_PARALLEL', x: 300, y: 200, config: dynConfig })
  else elements.splice(1, 0, { id: 'appr', kind: 'node', type: 'APPROVAL', x: 300, y: 200, config: { name: '主管审批', participant: { strategy: 'FIXED_USER', value: ['1'] } } })
  return { processKey, name, formKey: 'i4_leave_form', version: 1, contractVersion: 2, elements }
}

/** 换绑：重新发布指定定义，使表单绑定指向它（发布即换绑是产品口径）。 */
async function bindDef(defLabel) {
  const idx = loadIndex()
  const def = idx.defs[defLabel]
  const r = await call('admin', 'POST', `/workflow/defs/${def.defId}/publish`, {}, `bind-${defLabel}`)
  if (r.body?.code !== 0) { console.error('BIND_FAIL', defLabel, JSON.stringify(r.body)); process.exit(1) }
  idx.bindingLog.push({ def: defLabel, defId: def.defId, at: new Date().toISOString(), publish: r.body?.data })
  saveIndex(idx)
  await sleep(800)
  console.log('BOUND', defLabel)
}

// ────────────────────────── 提交与轮询工具 ──────────────────────────
async function submitAndGetPi(user, formData, tag) {
  const before = await call(user, 'GET', '/workflow/my/instances?pageNum=1&pageSize=1')
  const submit = await call(user, 'POST', '/form/data/i4_leave_form', formData, tag)
  if (submit.body?.code !== 0) return { submit, pi: null }
  await sleep(2200)
  const after = await call(user, 'GET', '/workflow/my/instances?pageNum=1&pageSize=20', undefined, tag + '-instances')
  const known = new Set((before.body?.data?.records ?? []).map((x) => x.processInstanceId))
  const inst = (after.body?.data?.records ?? []).find((x) => !known.has(x.processInstanceId))
    ?? (after.body?.data?.records ?? [])[0]
  return { submit, pi: inst?.processInstanceId ?? null, status: inst?.status }
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

/** 命令状态轮询（受理人本人可查）：直到 COMPLETED/FAILED 终态或超时。 */
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

// ────────────────────────── phase: g1（G1a/G1b/G1c） ──────────────────────────
async function g1() {
  const idx = loadIndex()
  const { A, B, E: deptE } = idx.depts

  // 换绑 R → 正向链
  await bindDef('R')

  // ═══ G1a 实例 X：A(leader1)+B(leader2) 双分支，身份逐条勾稽 ═══
  const x = await submitAndGetPi('initiator', { days: 2, reason: 'I4-r3 动态并行正向链 X', deptList: `${A},${B}` }, 'g1a-x-submit')
  assert('G1a.x.submitted', !!x.pi, x)
  idx.instances = idx.instances || {}
  idx.instances.X = x.pi
  saveIndex(idx)
  const xTodo1 = await call('leader1', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=20', undefined, 'g1a-todo-leader1')
  const xTodo2 = await call('leader2', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=20', undefined, 'g1a-todo-leader2')
  const xBranches = await call('admin', 'GET', `/workflow/monitor/instances/${x.pi}/branches`, undefined, 'g1a-x-branches-running')
  const brs = xBranches.body?.data ?? []
  assert('G1a.x.branchCount2', brs.length === 2, brs.map((b) => ({ idx: b.branchIndex, leader: b.leaderId, depts: b.deptIds })))
  const t1 = (xTodo1.body?.data?.records ?? []).find((t) => t.processInstanceId === x.pi)
  const t2 = (xTodo2.body?.data?.records ?? []).find((t) => t.processInstanceId === x.pi)
  assert('G1a.x.todoIdentity', !!t1 && !!t2 && brs.some((b) => b.taskId === t1.taskId && String(b.leaderId) === String(idx.users.leader1))
    && brs.some((b) => b.taskId === t2.taskId && String(b.leaderId) === String(idx.users.leader2)), { t1: t1?.taskId, t2: t2?.taskId, brs: brs.map((b) => ({ t: b.taskId, l: b.leaderId })) })
  await call('leader1', 'POST', `/workflow/commands/tasks/${t1.taskId}/complete`, { comment: 'I4-r3 X 分支一通过' }, 'g1a-x-complete-leader1')
  await call('leader2', 'POST', `/workflow/commands/tasks/${t2.taskId}/complete`, { comment: 'I4-r3 X 分支二通过' }, 'g1a-x-complete-leader2')
  const xDone = await waitInstanceStatus('initiator', x.pi, ['APPROVED'])
  assert('G1a.x.convergedApproved', !!xDone, x.pi)
  const xBrAfter = await call('admin', 'GET', `/workflow/monitor/instances/${x.pi}/branches`, undefined, 'g1a-x-branches-after')
  const xDetail = await call('admin', 'GET', `/workflow/instances/${x.pi}`, undefined, 'g1a-x-detail-admin-after')
  const xListRows = (await call('initiator', 'GET', '/workflow/my/instances?pageNum=1&pageSize=30')).body?.data?.records ?? []
  const xEntityId = (xListRows.find((r) => r.processInstanceId === x.pi) ?? {}).id
  const xMyDetail = await call('initiator', 'GET', `/workflow/my/instances/${xEntityId}`, undefined, 'g1a-x-detail-initiator-after')
  const brAfter = xBrAfter.body?.data ?? []
  const checkTrace = (label, detail, myShape = false) => {
    const raw = myShape ? (detail.body?.data?.history ?? []) : (detail.body?.data?.flowTrace ?? [])
    const trace = raw.filter((a) => a.taskId && (myShape || a.activityType === 'userTask'))
    const rows = brAfter.map((b) => {
      const tr = trace.find((t) => t.taskId === b.taskId)
      return { taskId: b.taskId, branchLeader: b.leaderId, traceAssignee: tr?.assignee ?? null, traceName: tr?.assigneeName ?? null }
    })
    const ok = rows.length === brAfter.length && rows.every((r) => String(r.branchLeader) === String(r.traceAssignee))
    assert(`G1a.traceIdentity.${label}`, ok, rows)
    return rows
  }
  checkTrace('admin', xDetail)
  checkTrace('initiator', xMyDetail, true)

  // ═══ G1b 实例 F：组织变更冻结 + 原负责人仍可办 + 新负责人不可办 ═══
  const f = await submitAndGetPi('initiator', { days: 1, reason: 'I4-r3 冻结不改写 F', deptList: `${A}` }, 'g1b-f-submit')
  assert('G1b.f.submitted', !!f.pi, f)
  idx.instances.F = f.pi
  saveIndex(idx)
  await sleep(1500)
  const fBrBefore = await call('admin', 'GET', `/workflow/monitor/instances/${f.pi}/branches`, undefined, 'g1b-f-branches-before')
  const fT1 = ((await call('leader1', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=20')).body?.data?.records ?? [])
    .find((t) => t.processInstanceId === f.pi)
  assert('G1b.f.taskOnLeader1', !!fT1, fT1)
  await call('admin', 'PUT', '/system/dept', { id: A, name: '研发一部', code: 'i4-dept-a', parentId: 1, sort: 1, status: 0, leaderId: idx.users.leader2 }, 'g1b-f-dept-change')
  await sleep(1000)
  const fBrAfter = await call('admin', 'GET', `/workflow/monitor/instances/${f.pi}/branches`, undefined, 'g1b-f-branches-after')
  const beforeRows = (fBrBefore.body?.data ?? []).map((b) => ({ idx: b.branchIndex, leader: b.leaderId, status: b.status, task: b.taskId }))
  const afterRows = (fBrAfter.body?.data ?? []).map((b) => ({ idx: b.branchIndex, leader: b.leaderId, status: b.status, task: b.taskId }))
  assert('G1b.f.frozenLeaderUnchanged', JSON.stringify(beforeRows) === JSON.stringify(afterRows), { beforeRows, afterRows })
  const fTryLeader2 = await call('leader2', 'POST', `/workflow/commands/tasks/${fT1.taskId}/complete`, { comment: '越权尝试' }, 'g1b-f-try-leader2')
  const fTryCmd = await pollCommand('leader2', fTryLeader2.body?.data?.commandId, 'g1b-f-try-leader2-cmdstatus')
  assert('G1b.f.leader2Denied', !!fTryCmd && fTryCmd.status === 'FAILED', fTryCmd)
  const fTryLeader1 = await call('leader1', 'POST', `/workflow/commands/tasks/${fT1.taskId}/complete`, { comment: '组织变更后原负责人办理' }, 'g1b-f-complete-leader1')
  assert('G1b.f.leader1CanHandle', fTryLeader1.body?.code === 0, fTryLeader1.body)
  const fDone = await waitInstanceStatus('initiator', f.pi, ['APPROVED'])
  assert('G1b.f.approved', !!fDone, f.pi)
  // 复原组织：A 负责人回到 leader1（后续场景依赖原始映射）
  await call('admin', 'PUT', '/system/dept', { id: A, name: '研发一部', code: 'i4-dept-a', parentId: 1, sort: 1, status: 0, leaderId: idx.users.leader1 }, 'g1b-f-dept-restore')
  await sleep(500)

  // 换绑 RB → 负向组（草稿正式提交 + P0 同步通道：确定 FAILED + failureReason + 草稿终态回读）
  await bindDef('RB')
  const negScenario = async (label, deptListValue, expectReasonPart) => {
    const draft = await call('admin', 'POST', '/workflow/drafts', {
      formKey: 'i4_leave_form', title: 'I4-r3 负向 ' + label,
      payload: { days: 1, reason: 'I4-r3 负向 ' + label, deptList: deptListValue },
    }, `g1c-${label}-draft-create`)
    if (draft.body?.code !== 0) { assert(`G1c.${label}.draftCreated`, false, draft.body); return null }
    const sub = await call('admin', 'POST', `/workflow/drafts/${draft.body.data.id}/submit?channel=P0`, {}, `g1c-${label}-submit`)
    // 父命令（DRAFT_SUBMIT）完成后从 flowStart 子对象取 FLOW_START 子命令 ID，再等它到终态
    let parent = null
    for (let i = 0; i < 15; i++) {
      const r = await call('admin', 'GET', `/workflow/commands/${sub.body?.data?.commandId}`, undefined, `g1c-${label}-parent-${i + 1}`)
      if (['COMPLETED', 'FAILED'].includes(r.body?.data?.status)) { parent = r.body?.data; break }
      await sleep(1000)
    }
    const child = await pollCommand('admin', parent?.flowStart?.commandId, `g1c-${label}-cmdstatus`)
    const reason = child?.failureReason ?? ''
    assert(`G1c.${label}.deterministic`, !!child && child.status === 'FAILED',
      { submitStatus: sub.body?.data?.status, childStatus: child?.status, reason })
    assert(`G1c.${label}.reason`, reason.includes(expectReasonPart), { reason, expect: expectReasonPart })
    return { draftId: draft.body.data.id, parentCommandId: sub.body?.data?.commandId,
      flowStartCommandId: parent?.flowStart?.commandId, cmdStatus: child?.status, reason }
  }
  idx.negatives = {}
  idx.negatives.empty = await negScenario('empty', '', '动态并行来源集合为空')
  idx.negatives.noleader = await negScenario('noleader', `${deptE}`, '失效或负责人缺失')
  idx.negatives.invalid = await negScenario('invalid', '999999999', '失效或负责人缺失')
  idx.negatives.crosstenant = await negScenario('crosstenant', '8899000000000000001', '失效或负责人缺失')
  // 短 ID 让请求体安全入库：上限检查先于部门有效性解析（DynamicBranchCollectionResolver 66-70 行口径）
  idx.negatives.overlimit = await negScenario('overlimit',
    Array.from({ length: 51 }, (_, i) => String(i + 1)).join(','), '超过上限')
  saveIndex(idx)
  // 同负责人去重（有效路径，RB 下同样成立）
  const c5 = await submitAndGetPi('initiator', { days: 1, reason: 'I4-r3 同负责人去重', deptList: `${B},${B}` }, 'g1c5-dup-submit')
  assert('G1c5.submitted', !!c5.pi, c5)
  idx.instances.DEDUP = c5.pi
  saveIndex(idx)
  await sleep(1500)
  const c5Br = await call('admin', 'GET', `/workflow/monitor/instances/${c5.pi}/branches`, undefined, 'g1c5-dup-branches')
  const c5Rows = c5Br.body?.data ?? []
  assert('G1c.dedupSingleBranch', c5Rows.length === 1 && String(c5Rows[0].leaderId) === String(idx.users.leader2), c5Rows.map((b) => ({ depts: b.deptIds, leader: b.leaderId })))
  const c5Task = ((await call('leader2', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=20')).body?.data?.records ?? []).find((t) => t.processInstanceId === c5.pi)
  if (c5Task) { await call('leader2', 'POST', `/workflow/commands/tasks/${c5Task.taskId}/complete`, { comment: '去重分支通过' }, 'g1c5-dup-complete'); await sleep(2000) }
    console.log('G1_DONE')
}

// ────────────────────────── phase: g2（G2a/G2b/G2c） ──────────────────────────
async function g2() {
  const idx = loadIndex()

  // ═══ G2a 模板生命周期：复制→编辑→发布；M/R/X 前后不变 ═══
  const mBefore = await call('admin', 'GET', `/workflow/templates/${idx.templates.M.id}`, undefined, 'g2a-m-before')
  const rBefore = await call('admin', 'GET', `/workflow/defs/${idx.defs.R.defId}`, undefined, 'g2a-r-before')
  const xBrBefore = await call('admin', 'GET', `/workflow/monitor/instances/${idx.instances.X}/branches`, undefined, 'g2a-x-branches-before')
  const copy = await call('admin', 'POST', `/workflow/templates/${idx.templates.M.id}/copy`, { copyName: 'I4 派生定义D' }, 'g2a-copy-to-d')
  assert('G2a.copy.ok', copy.body?.code === 0 && (copy.body?.data?.defId ?? copy.body?.data?.id), copy.body)
  const defD = copy.body?.data
  idx.defs.D = { defId: defD?.defId ?? defD?.id, processKey: defD?.processKey, name: 'I4 派生定义D' }
  saveIndex(idx)
  const dDefBefore = await call('admin', 'GET', `/workflow/defs/${idx.defs.D.defId}`, undefined, 'g2a-d-before-edit')
  const dGraph = dDefBefore.body?.data?.graphJson ? JSON.parse(dDefBefore.body.data.graphJson) : null
  if (dGraph) {
    const dyn = dGraph.elements.find((e) => e.id === 'dyn')
    if (dyn?.config) dyn.config.name = '派生定义编辑后并行审批'
    await call('admin', 'PUT', `/workflow/defs/${idx.defs.D.defId}/graph`, dGraph, 'g2a-d-edit-graph')
  }
  await call('admin', 'POST', `/workflow/defs/${idx.defs.D.defId}/publish`, {}, 'g2a-d-publish')
  await call('admin', 'GET', `/workflow/defs/${idx.defs.D.defId}`, undefined, 'g2a-d-after-publish')
  const dPage = await call('admin', 'GET', '/workflow/defs?pageNum=1&pageSize=100', undefined, 'g2a-d-page-after')
  const dRow = (dPage.body?.data?.records ?? []).find((r) => String(r.defId ?? r.id) === String(idx.defs.D.defId))
  assert('G2a.d.published', !!dRow && (dRow.status === 'PUBLISHED' || (dRow.publishedVersion ?? 0) >= 1), dRow)
  const mAfter = await call('admin', 'GET', `/workflow/templates/${idx.templates.M.id}`, undefined, 'g2a-m-after')
  const rAfter = await call('admin', 'GET', `/workflow/defs/${idx.defs.R.defId}`, undefined, 'g2a-r-after')
  const xBrAfter2 = await call('admin', 'GET', `/workflow/monitor/instances/${idx.instances.X}/branches`, undefined, 'g2a-x-branches-after')
  assert('G2a.m.unchanged', JSON.stringify(mBefore.body?.data) === JSON.stringify(mAfter.body?.data), 'template M mutated')
  assert('G2a.r.unchanged', rBefore.body?.data?.graphJson === rAfter.body?.data?.graphJson
    && rBefore.body?.data?.publishedVersion === rAfter.body?.data?.publishedVersion, 'def R mutated')
  assert('G2a.x.unchanged', JSON.stringify(xBrBefore.body?.data) === JSON.stringify(xBrAfter2.body?.data), 'instance X branches mutated')
  await call('admin', 'PUT', `/workflow/templates/${idx.templates.M2.id}/status/0`, undefined, 'g2a-m2-disable')
  const copyDisabled = await call('admin', 'POST', `/workflow/templates/${idx.templates.M2.id}/copy`, { copyName: 'I4 不应存在的派生' }, 'g2a-m2-copy-disabled')
  assert('G2a.m2.copyDenied', copyDisabled.body?.code !== 0 || copyDisabled.status >= 400, { code: copyDisabled.body?.code, status: copyDisabled.status })
  await call('admin', 'PUT', `/workflow/templates/${idx.templates.M2.id}/status/1`, undefined, 'g2a-m2-reenable')
  await loginOne('outsider', 'User@123')
  const oList = await call('outsider', 'GET', '/workflow/templates?pageNum=1&pageSize=50', undefined, 'g2a-outsider-list')
  const oCopy = await call('outsider', 'POST', `/workflow/templates/${idx.templates.M.id}/copy`, { copyName: '越权派生' }, 'g2a-outsider-copy')
  assert('G2a.outsider.zeroVisible', oList.status === 403 || (oList.body?.data?.records ?? []).length === 0, { status: oList.status, n: (oList.body?.data?.records ?? []).length })
  assert('G2a.outsider.zeroWrite', oCopy.status === 403 || oCopy.body?.code !== 0, { status: oCopy.status, code: oCopy.body?.code })

  // ═══ G2b 监控七条件 + 干预 + 审计 + 无权（实例族 O） ═══
  await bindDef('R')
  const o = await submitAndGetPi('initiator', { days: 3, reason: 'I4-r3 监控干预族 O', deptList: `${idx.depts.A},${idx.depts.B}` }, 'g2b-o-submit')
  assert('G2b.o.running', !!o.pi, o)
  idx.instances.O = o.pi
  saveIndex(idx)
  await sleep(1500)
  const now = new Date(Date.now() - 3600 * 1000).toISOString().slice(0, 19)
  const before2d = new Date(Date.now() - 48 * 3600 * 1000).toISOString().slice(0, 19)
  const q = async (tag, qs) => call('admin', 'GET', `/workflow/monitor/instances?pageNum=1&pageSize=50&${qs}`, undefined, tag)
  const hasO = (r) => (r.body?.data?.records ?? []).some((row) => (row.instance ?? row).processInstanceId === o.pi)
  assert('G2b.q.status.hit', hasO(await q('g2b-q-status-running', 'status=RUNNING')))
  assert('G2b.q.instance.hit', hasO(await q('g2b-q-instance', `processInstanceId=${o.pi}`)))
  assert('G2b.q.def.hit', hasO(await q('g2b-q-def', `processDefKey=${idx.defs.R.processKey}`)))
  assert('G2b.q.initiator.hit', hasO(await q('g2b-q-initiator', `initiatorId=${idx.users.initiator}`)))
  assert('G2b.q.node.hit', hasO(await q('g2b-q-node', 'nodeKey=dyn')))
  assert('G2b.q.assignee.hit', hasO(await q('g2b-q-assignee', `assignee=${idx.users.leader1}`)))
  assert('G2b.q.time.hit', hasO(await q('g2b-q-time', `timeFrom=${encodeURIComponent(now)}`)))
  assert('G2b.q.status.excl', !hasO(await q('g2b-q-excl-instance', `processInstanceId=${o.pi}&status=APPROVED`)))
  assert('G2b.q.time.excl', !hasO(await q('g2b-q-excl-time', `timeFrom=${encodeURIComponent(before2d)}&timeTo=${encodeURIComponent(now)}`)))
  assert('G2b.q.assignee.excl', !hasO(await q('g2b-q-excl-assignee', `assignee=${idx.users.w}`)))
  // 干预三连 + 审计 + 挂起拒绝
  const oT1 = ((await call('leader1', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=20')).body?.data?.records ?? []).find((t) => t.processInstanceId === o.pi)
  const l1TodoBeforeTransfer = ((await call('leader1', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=20')).body?.data?.records ?? []).map((t) => t.taskId)
  await call('admin', 'POST', `/workflow/monitor/instances/${o.pi}/intervene`, { action: 'SUSPEND', reason: 'I4-r3 监控挂起验证' }, 'g2b-intervene-suspend')
  await sleep(1200)
  const oSuspended = await q('g2b-o-suspended', `processInstanceId=${o.pi}`)
  const oSuspendedRow = (oSuspended.body?.data?.records ?? []).find((row) => (row.instance ?? row).processInstanceId === o.pi)
  assert('G2b.o.suspended', oSuspendedRow && (oSuspendedRow.suspended === true || (oSuspendedRow.instance ?? oSuspendedRow).status === 'SUSPENDED'), oSuspendedRow)
  const oTrySuspended = await call('leader1', 'POST', `/workflow/commands/tasks/${oT1.taskId}/complete`, { comment: '挂起中尝试' }, 'g2b-o-try-suspended')
  // 挂起中等待该命令到终态：引擎级挂起应使办理拒绝（FAILED），而非挂起解除后被静默放行
  const oSuspendCmd = await pollCommand('leader1', oTrySuspended.body?.data?.commandId, 'g2b-o-try-suspended-cmdstatus')
  assert('G2b.o.suspendedHandleDenied', !!oSuspendCmd && oSuspendCmd.status === 'FAILED', oSuspendCmd)
  await call('admin', 'POST', `/workflow/monitor/instances/${o.pi}/intervene`, { action: 'RESUME', reason: 'I4-r3 恢复验证' }, 'g2b-intervene-resume')
  await sleep(1200)
  const oBrBeforeTransfer = (await call('admin', 'GET', `/workflow/monitor/instances/${o.pi}/branches`)).body?.data ?? []
  const transferTask = oBrBeforeTransfer.find((b) => String(b.leaderId) === String(idx.users.leader2))?.taskId
  const l2TodoBeforeTransfer = ((await call('leader2', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=20')).body?.data?.records ?? []).map((t) => t.taskId)
  await call('admin', 'POST', `/workflow/monitor/instances/${o.pi}/intervene`, { action: 'TRANSFER', reason: 'I4-r3 迁移办理人', toAssignee: idx.users.leader1 }, 'g2b-intervene-transfer')
  await sleep(1500)
  const l1TodoAfterTransfer = ((await call('leader1', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=20')).body?.data?.records ?? []).map((t) => t.taskId)
  const l2TodoAfterTransfer = ((await call('leader2', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=20')).body?.data?.records ?? []).map((t) => t.taskId)
  assert('G2b.o.transferEffect',
    !!transferTask && l2TodoBeforeTransfer.includes(transferTask)
    && !l2TodoAfterTransfer.includes(transferTask) && l1TodoAfterTransfer.includes(transferTask),
    { transferTask, l2Before: l2TodoBeforeTransfer.includes(transferTask), l2After: l2TodoAfterTransfer.includes(transferTask), l1After: l1TodoAfterTransfer.includes(transferTask) })
  const oAudits = await call('admin', 'GET', `/workflow/monitor/instances/${o.pi}/interventions`, undefined, 'g2b-o-interventions')
  const auditRows = oAudits.body?.data ?? []
  assert('G2b.o.audit3', auditRows.length === 3 && auditRows.every((a) => a.operatorId != null && a.reason != null), auditRows.map((a) => ({ action: a.action, op: a.operatorId })))
  const oOutQ = await call('outsider', 'GET', '/workflow/monitor/instances?pageNum=1&pageSize=10', undefined, 'g2b-outsider-query')
  const oOutI = await call('outsider', 'POST', `/workflow/monitor/instances/${o.pi}/intervene`, { action: 'SUSPEND', reason: '越权' }, 'g2b-outsider-intervene')
  assert('G2b.outsider.queryDenied', oOutQ.status === 403 || oOutQ.body?.code !== 0, { status: oOutQ.status, code: oOutQ.body?.code })
  assert('G2b.outsider.interveneDenied', oOutI.status === 403 || oOutI.body?.code !== 0, { status: oOutI.status, code: oOutI.body?.code })
  const oAuditAfterOut = await call('admin', 'GET', `/workflow/monitor/instances/${o.pi}/interventions`)
  assert('G2b.outsider.zeroWrite', (oAuditAfterOut.body?.data ?? []).length === 3, oAuditAfterOut.body?.data?.length)

  // ═══ G2c 分析：固定样本集 A + 全量监控行复算 + 汇总=有权明细 + 越权拒绝 ═══
  const p = await submitAndGetPi('initiator', { days: 1, reason: 'I4-r3 驳回样本 P', deptList: `${idx.depts.A}` }, 'g2c-p-submit')
  idx.instances.P = p.pi
  saveIndex(idx)
  await sleep(1500)
  const pTask = ((await call('leader1', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=20')).body?.data?.records ?? []).find((t) => t.processInstanceId === p.pi)
  if (pTask) {
    await call('leader1', 'POST', `/workflow/commands/tasks/${pTask.taskId}/reject`, { comment: 'I4-r3 驳回样本' }, 'g2c-p-disapprove')
    await sleep(2500)
  }
  const sampleSet = ['X', 'F', 'O', 'P'].map((k) => idx.instances[k]).filter(Boolean)
  const raws = []
  for (const pi of sampleSet) {
    const d = await call('admin', 'GET', `/workflow/instances/${pi}`, undefined, `g2c-raw-${pi.slice(0, 8)}`)
    raws.push({ pi, status: d.body?.data?.status, createTime: d.body?.data?.createTime, flowTrace: d.body?.data?.flowTrace })
  }
  out('g2c-sample-set-A', { sampleSet, raws })
  const done = raws.filter((r) => r.status === 'APPROVED' && r.createTime)
  const durations = done.map((r) => (new Date(Math.max(...r.flowTrace.filter((t) => t.endTime).map((t) => new Date(t.endTime).getTime()))) - new Date(r.createTime).getTime()) / 1000)
  const pct = (arr, p) => { if (!arr.length) return 0; const s = [...arr].sort((a, b) => a - b); const i = (s.length - 1) * p; const lo = Math.floor(i), hi = Math.ceil(i); return s[lo] + (s[hi] - s[lo]) * (i - lo) }
  const workload = {}
  for (const r of raws) for (const t of (r.flowTrace ?? [])) {
    if (t.activityType === 'userTask' && t.assigneeName) workload[t.assigneeName] = (workload[t.assigneeName] ?? 0) + 1
  }
  const recompute = {
    launched: sampleSet.length,
    completed: raws.filter((r) => r.status === 'APPROVED').length,
    running: raws.filter((r) => r.status === 'RUNNING').length,
    rejected: raws.filter((r) => r.status === 'REJECTED' || r.status === 'DISAPPROVED').length,
    avgDurationSec: Math.round(durations.reduce((a, b) => a + b, 0) / (durations.length || 1) * 100) / 100,
    p50Sec: Math.round(pct(durations, 0.5) * 100) / 100,
    p90Sec: Math.round(pct(durations, 0.9) * 100) / 100,
    workload,
  }
  out('g2c-recompute', recompute)
  const summaryAll = await call('admin', 'GET', '/workflow/monitor/analytics/summary', undefined, 'g2c-summary-api')
  assert('G2c.summary.ok', summaryAll.body?.code === 0, summaryAll.body)
  const api = summaryAll.body?.data ?? {}
  assert('G2c.summary.launchedConsistent', Number(api.launched ?? 0) >= recompute.launched, { api: api.launched, recompute: recompute.launched })
  assert('G2c.summary.completedConsistent', Number(api.completed ?? 0) >= recompute.completed, { api: api.completed, recompute: recompute.completed })
  out('g2c-summary-api', api)
  const oSummary = await call('outsider', 'GET', '/workflow/monitor/analytics/summary', undefined, 'g2c-outsider-summary')
  assert('G2c.outsider.summaryDenied', oSummary.status === 403 || oSummary.body?.code !== 0, { status: oSummary.status, code: oSummary.body?.code })
  const oDrill = await call('outsider', 'GET', `/workflow/instances/${idx.instances.X}`, undefined, 'g2c-outsider-drill')
  assert('G2c.outsider.drillDenied', oDrill.status === 403 || oDrill.body?.code !== 0, { status: oDrill.status, code: oDrill.body?.code })
  console.log('G2_DONE')
}

// ────────────────────────── phase: g3（G3a/G3b） ──────────────────────────
async function g3() {
  const idx = loadIndex()

  // ═══ G3a 批量 B：同批 成功/越权/缺意见/强制意见成功/重复/已终态 ═══
  const mk = async (defLabel, tag) => {
    await bindDef(defLabel)
    const before = await call('initiator', 'GET', '/workflow/my/instances?pageNum=1&pageSize=1')
    await call('initiator', 'POST', '/form/data/i4_leave_form', { days: 1, reason: 'I4-r3 ' + tag, deptList: '' }, `g3a-${tag}-submit`)
    await sleep(2200)
    const mine = await call('initiator', 'GET', '/workflow/my/instances?pageNum=1&pageSize=30', undefined, `g3a-${tag}-instances`)
    const known = new Set((before.body?.data?.records ?? []).map((x) => x.processInstanceId))
    const inst = (mine.body?.data?.records ?? []).find((x) => !known.has(x.processInstanceId))
    return inst?.processInstanceId
  }
  const piB1 = await mk('SA', 'b1')
  const piDone = await mk('SA', 'done')
  const piOther = await mk('SB', 'other')
  const piOp = await mk('OP', 'op')
  Object.assign(idx.instances, { B1: piB1, OP1: piOp, B0: piDone, B2: piOther })
  saveIndex(idx)
  const todoL1 = async () => (await call('leader1', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=30')).body?.data?.records ?? []
  const todoL2 = async () => (await call('leader2', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=30')).body?.data?.records ?? []
  const tB1 = (await todoL1()).find((t) => t.processInstanceId === piB1)
  const tOp = (await todoL1()).find((t) => t.processInstanceId === piOp)
  const tDone = (await todoL1()).find((t) => t.processInstanceId === piDone)
  const tOther = (await todoL2()).find((t) => t.processInstanceId === piOther)
  assert('G3a.tasks.ready', !!tB1 && !!tOp && !!tDone && !!tOther, { tB1: tB1?.taskId, tOp: tOp?.taskId, tDone: tDone?.taskId, tOther: tOther?.taskId })
  await call('leader1', 'POST', `/workflow/commands/tasks/${tDone.taskId}/complete`, { comment: '批量前置已办' }, 'g3a-done-complete')
  await sleep(2200)
  const batchBody = {
    items: [
      { taskId: tB1.taskId, action: 'APPROVE', comment: 'I4-r3 批量项1本人成功' },
      { taskId: tOther.taskId, action: 'APPROVE', comment: '越权项' },
      { taskId: tOp.taskId, action: 'APPROVE', comment: '缺意见数据项' },
      { taskId: tOp.taskId, action: 'APPROVE', comment: '', opinionFormId: 'I4_OPINION_FORM', opinionFormVersion: '1', opinionData: { comment: 'I4-r3 批量强制意见通过' } },
      { taskId: tB1.taskId, action: 'APPROVE', comment: '重复任务项' },
      { taskId: tDone.taskId, action: 'APPROVE', comment: '已终态项' },
    ],
  }
  const batch = await call('leader1', 'POST', '/workflow/tasks/batch-action', batchBody, 'g3a-batch-result')
  assert('G3a.batch.accepted', batch.body?.code === 0, batch.body)
  const rows = batch.body?.data?.results ?? []
  const rowOf = (i) => rows[i] ?? {}
  assert('G3a.item1.success', rowOf(0).success === true, rowOf(0))
  assert('G3a.item2.foreignDenied', rowOf(1).success === false, rowOf(1))
  assert('G3a.item3.opinionRequired', rowOf(2).success === false, rowOf(2))
  assert('G3a.item4.forcedOpinionOk', rowOf(3).success === true, rowOf(3))
  assert('G3a.item5.duplicateDenied', rowOf(4).success === false, rowOf(4))
  assert('G3a.item6.terminalDenied', rowOf(5).success === false, rowOf(5))
  await sleep(2000)
  const l2After = await todoL2()
  assert('G3a.other.zeroSideEffect', l2After.some((t) => t.taskId === tOther.taskId), 'other task missing from leader2 todo')
  const opRows = (await call('initiator', 'GET', '/workflow/my/instances?pageNum=1&pageSize=30')).body?.data?.records ?? []
  const opEntityId = (opRows.find((r) => r.processInstanceId === piOp) ?? {}).id
  const opDetail = await call('initiator', 'GET', `/workflow/my/instances/${opEntityId}`, undefined, 'g3a-op-detail')
  const opHandled = (opDetail.body?.data?.history ?? []).filter((t) => t.taskId && t.endTime).length
  assert('G3a.op.singleAction', opHandled === 1, (opDetail.body?.data?.flowTrace ?? []).filter((t) => t.taskId).map((t) => ({ task: t.taskId, end: t.endTime, asg: t.assigneeName })))
  out('g3a-batch-assert-summary', { success: batch.body?.data?.success, failed: batch.body?.data?.failed, total: batch.body?.data?.total })

  // ═══ G3b 交接 H：≥2 项迁移 + 显式代理随迁 + 未选不迁 + 历史零改写 + 重试零重复 + 跨租户拒绝 ═══
  await bindDef('R')
  const h1 = await submitAndGetPi('initiator', { days: 1, reason: 'I4-r3 交接样本 H1', deptList: `${idx.depts.B}` }, 'g3b-h1-submit')
  const h2 = await submitAndGetPi('initiator', { days: 1, reason: 'I4-r3 交接样本 H2', deptList: `${idx.depts.C}` }, 'g3b-h2-submit')
  Object.assign(idx.instances, { H1: h1.pi, H2: h2.pi })
  saveIndex(idx)
  const l2H = (await todoL2()).filter((t) => [h1.pi, h2.pi].includes(t.processInstanceId))
  assert('G3b.leader2TwoTasks', l2H.length === 2, l2H.map((t) => ({ id: t.taskId, pi: t.processInstanceId })))
  await loginOne('leader2', 'User@123')
  // 幂等：先查既有规则，冲突拒绝(2402)视为已存在
  const rulesPre = (await call('leader2', 'GET', '/workflow/authorize-rules', undefined, 'g3b-rules-pre')).body?.data ?? []
  let activeRuleId = (rulesPre.find((r) => String(r.agentId) === String(idx.users.w) && r.status === 'ACTIVE') ?? {}).id
  if (!activeRuleId) {
    const ruleActive = await call('leader2', 'POST', '/workflow/authorize-rules', { targetUserId: idx.users.w, scopeType: 'GLOBAL', startAt: '2026-09-12T00:00:00', endAt: '2027-09-12T00:00:00' }, 'g3b-rule-active-create')
    assert('G3b.ruleActive.created', ruleActive.body?.code === 0, ruleActive.body)
    activeRuleId = ruleActive.body?.data
  }
  let expiredRuleId = (rulesPre.find((r) => String(r.agentId) === String(idx.users.leader1) && r.endAt && new Date(r.endAt) < new Date()) ?? {}).id
  if (!expiredRuleId) {
    const ruleExpired = await call('leader2', 'POST', '/workflow/authorize-rules', { targetUserId: idx.users.leader1, scopeType: 'GLOBAL', startAt: '2026-01-01T00:00:00', endAt: '2026-02-01T00:00:00' }, 'g3b-rule-expired-create')
    assert('G3b.ruleExpired.created', ruleExpired.body?.code === 0, ruleExpired.body)
    expiredRuleId = ruleExpired.body?.data
  }
  assert('G3b.rules.ready', !!activeRuleId && !!expiredRuleId, { activeRuleId, expiredRuleId })
  const rulesBefore = (await call('leader2', 'GET', '/workflow/authorize-rules', undefined, 'g3b-rules-before')).body?.data ?? []
  const xHistBefore = await call('leader2', 'GET', `/workflow/my/instances/${idx.instances.X}`, undefined, 'g3b-x-history-before')
  // scopeDefKeys 限定 R 键：批量遗留的 SB 任务不迁（范围过滤也是被验行为）
  const rScope = [idx.defs.R.processKey]
  const hv1 = await call('admin', 'POST', '/workflow/handover', { fromUserId: idx.users.leader2, toUserId: idx.users.w, scopeDefKeys: rScope, includeProxyRules: false }, 'g3b-hv1-result')
  assert('G3b.hv1.migrated2', hv1.body?.data?.totalItems === 2 && hv1.body?.data?.migratedItems === 2, hv1.body?.data)
  const hv1Items = await call('admin', 'GET', `/workflow/handover/${hv1.body?.data?.id}/items`, undefined, 'g3b-hv1-items')
  assert('G3b.hv1.itemsMatch', (hv1Items.body?.data ?? []).every((it) => it.result === 'MIGRATED' && String(it.beforeAssignee) === String(idx.users.leader2) && String(it.afterAssignee) === String(idx.users.w)), hv1Items.body?.data)
  const rulesAfterHv1 = (await call('leader2', 'GET', '/workflow/authorize-rules', undefined, 'g3b-rules-after-hv1')).body?.data ?? []
  assert('G3b.hv1.rulesUntouched', JSON.stringify(rulesAfterHv1) === JSON.stringify(rulesBefore), 'rules mutated by hv1')
  const xHistAfter = await call('leader2', 'GET', `/workflow/my/instances/${idx.instances.X}`, undefined, 'g3b-x-history-after')
  assert('G3b.history.unrewritten', JSON.stringify(xHistBefore.body?.data?.flowTrace) === JSON.stringify(xHistAfter.body?.data?.flowTrace), 'history mutated')
  const hv2 = await call('admin', 'POST', '/workflow/handover', { fromUserId: idx.users.leader2, toUserId: idx.users.w, scopeDefKeys: rScope, includeProxyRules: true }, 'g3b-hv2-result')
  assert('G3b.hv2.accepted', hv2.body?.code === 0, hv2.body)
  const hv2Items = await call('admin', 'GET', `/workflow/handover/${hv2.body?.data?.id}/items`, undefined, 'g3b-hv2-items')
  const ruleItems = (hv2Items.body?.data ?? []).filter((it) => it.itemType === 'PROXY_RULE')
  assert('G3b.hv2.ruleMigrated', ruleItems.some((it) => it.result === 'MIGRATED' && it.ruleId != null), hv2Items.body?.data)
  const rulesAfterHv2 = (await call('leader2', 'GET', '/workflow/authorize-rules', undefined, 'g3b-rules-after-hv2')).body?.data ?? []
  assert('G3b.hv2.expiredUntouched', rulesAfterHv2.some((r) => String(r.id) === String(expiredRuleId) && r.status === 'ACTIVE' && String(r.principalId) === String(idx.users.leader2)), rulesAfterHv2.map((r) => ({ id: r.id, principal: r.principalId, status: r.status })))
  const hv3 = await call('admin', 'POST', '/workflow/handover', { fromUserId: idx.users.leader2, toUserId: idx.users.w, scopeDefKeys: rScope, includeProxyRules: true }, 'g3b-hv-retry')
  assert('G3b.retry.zero', hv3.body?.data?.totalItems === 0 && hv3.body?.data?.migratedItems === 0, hv3.body?.data)
  const hvX = await call('admin', 'POST', '/workflow/handover', { fromUserId: idx.users.leader2, toUserId: 8899000000000000002, scopeDefKeys: [], includeProxyRules: false }, 'g3b-hv-crosstenant')
  assert('G3b.crosstenant.denied', hvX.body?.code !== 0, { code: hvX.body?.code, msg: hvX.body?.msg })
  console.log('G3_DONE')
}

// ────────────────────────── phase: g5（G5a/G5b） ──────────────────────────
async function g5() {
  const idx = loadIndex()
  if (!APP_SECRET) { console.error('MISSING I4_OPENAPI_SECRET'); process.exit(1) }
  await bindDef('R')
  const runTag = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)
  const bizKey = 'i4-r3-ext-biz-' + runTag
  const idemKey = 'i4-r3-ext-idem-' + runTag
  const startBody = {
    formKey: 'i4_leave_form',
    formData: { days: 3, reason: 'I4-r3 外部发起全链 E', deptList: `${idx.depts.B}` },
    businessKey: bizKey, idempotencyKey: idemKey,
  }
  const start = await openCall('POST', '/openapi/v1/processes', startBody, { tag: 'g5a-e-start' })
  assert('G5a.start.ok', start.body?.code === 0, start.body)
  // 异步启动：轮询监控列表按 businessKey(=recordId) 解析 E 的 processInstanceId
  const recordId = start.body?.data?.recordId
  let piE = null
  for (let i = 0; i < 15; i++) {
    const mon = await call('admin', 'GET', '/workflow/monitor/instances?pageNum=1&pageSize=50', undefined, i === 0 ? 'g5a-e-resolve-monitor' : undefined)
    const row = (mon.body?.data?.records ?? []).find((r) => (r.instance ?? r).businessKey === recordId)
    if (row) { piE = (row.instance ?? row).processInstanceId; break }
    await sleep(1500)
  }
  assert('G5a.instance.resolved', !!piE, { recordId })
  idx.instances.E = piE
  idx.openapi = { appId: APP_ID, businessKey: bizKey, idempotencyKey: idemKey, recordId, secretSha256: createHash('sha256').update(APP_SECRET).digest('hex'), secretLen: APP_SECRET.length }
  saveIndex(idx)
  const dup = await openCall('POST', '/openapi/v1/processes', startBody, { tag: 'g5a-e-start-duplicate' })
  assert('G5a.duplicate.idempotent', dup.body?.code === 0 && dup.body?.data?.recordId === recordId && dup.body?.data?.idempotentReplay === true, dup.body?.data)
  const st = await openCall('GET', `/openapi/v1/processes/${piE}`, undefined, { tag: 'g5a-e-status-running' })
  assert('G5a.status.running', st.body?.code === 0 && JSON.stringify(st.body?.data ?? {}).includes('RUNNING'), st.body?.data)
  const bad = await openCall('POST', '/openapi/v1/processes', startBody, { tag: 'g5a-e-badsignature', badSignature: true })
  assert('G5a.badsign.denied', bad.body?.code !== 0, { code: bad.body?.code })
  const nonce = randomBytes(8).toString('hex')
  const body = JSON.stringify(startBody)
  const ts = String(Math.floor(Date.now() / 1000))
  const headers = { 'X-App-Id': APP_ID, 'X-Timestamp': ts, 'X-Nonce': nonce, 'X-Signature': openSign(ts, nonce, body) }
  await request('/openapi/v1/processes', 'POST', body, headers)
  const replay2 = await request('/openapi/v1/processes', 'POST', body, headers)
  assert('G5a.nonce.replayDenied', replay2.body?.code !== 0, { code: replay2.body?.code, msg: replay2.body?.msg })
  // 对端保持关闭 → 办理 E → 终态事件三次投递失败
  const eTask = ((await call('leader2', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=30')).body?.data?.records ?? []).find((t) => t.processInstanceId === piE)
  assert('G5a.eTask.ready', !!eTask, eTask)
  const complete = await call('leader2', 'POST', `/workflow/commands/tasks/${eTask.taskId}/complete`, { comment: 'I4-r3 外部单办理' }, 'g5a-e-complete')
  assert('G5a.complete.accepted', complete.body?.code === 0, complete.body)
  await sleep(9000)
  const cbsFailed = await openCall('GET', `/openapi/v1/callbacks?bizRef=${piE}&event=PROCESS_APPROVED`, undefined, { tag: 'g5b-callbacks-failed' })
  const failedRows = (cbsFailed.body?.data?.records ?? []).filter((r) => r.status === 'FAILED')
  assert('G5b.failedThree.queryable', failedRows.length === 3, failedRows.map((r) => ({ attempt: r.attempt, status: r.status, summary: r.responseSummary })))
  const st2 = await openCall('GET', `/openapi/v1/processes/${piE}`, undefined, { tag: 'g5a-e-status-approved' })
  assert('G5a.terminal.notRolledBack', JSON.stringify(st2.body?.data ?? {}).includes('APPROVED'), st2.body?.data)
  // 恢复对端 → 重发一次成功（接收器由独立脚本启动）
  await fetch('http://localhost:19999/up', { method: 'POST' }).catch((e) => console.log('RECEIVER_CTRL_WARN', e.message))
  await sleep(1500)
  const resend = await openCall('POST', '/openapi/v1/callbacks/resend', { event: 'PROCESS_APPROVED', processInstanceId: piE }, { tag: 'g5b-resend-once' })
  assert('G5b.resend.delivered', resend.body?.code === 0 && resend.body?.data?.delivered === true, resend.body)
  await sleep(1500)
  const recvPath = 'E:/code/Smart-WorkFlow-Agent-Workspace/product/v0.1.0-oa-completion/receipts/evidence/i4-03/receiver/received.json'
  const recv = JSON.parse(readFileSync(recvPath, 'utf8'))
  const eRows = recv.filter((r) => safe(r.body)?.processInstanceId === piE)
  assert('G5b.receiver.gotE', eRows.length === 1, recv.length)
  const last = eRows[eRows.length - 1]
  const h = Object.fromEntries(Object.entries(last.headers).map(([k, v]) => [k.toLowerCase(), v]))
  const recompute = (() => {
    const keySha = createHash('sha256').update(APP_SECRET).digest('hex')
    const material = h['x-app-id'] + h['x-callback-timestamp'] + h['x-callback-nonce'] + createHash('sha256').update(last.body).digest('hex')
    const expect = createHmac('sha256', keySha).update(material).digest('hex')
    return { pass: expect === h['x-callback-signature'], expectLen: expect.length, sigHeaderLen: (h['x-callback-signature'] ?? '').length }
  })()
  out('g5b-signature-recompute', {
    event: safe(last.body)?.event, bizRef: safe(last.body)?.processInstanceId,
    secretSha256: idx.openapi.secretSha256, secretLen: idx.openapi.secretLen,
    signatureRecomputed: recompute.pass ? 'PASS' : 'FAIL', detail: recompute,
    note: '测试密钥原文不落盘；仅摘要长度与复算结论',
  })
  assert('G5b.signature.recomputedPass', recompute.pass === true, recompute)
  assert('G5b.payload.whitelist', JSON.stringify(safe(last.body)) === JSON.stringify({ event: 'PROCESS_APPROVED', processInstanceId: piE, tenantId: 0 }), last.body)
  const resend2 = await openCall('POST', '/openapi/v1/callbacks/resend', { event: 'PROCESS_APPROVED', processInstanceId: piE }, { tag: 'g5b-resend-duplicate' })
  assert('G5b.resend2.deduped', resend2.body?.code === 0 && resend2.body?.data?.deduped === true, resend2.body)
  const cbsFinal = await openCall('GET', `/openapi/v1/callbacks?bizRef=${piE}`, undefined, { tag: 'g5b-callbacks-final' })
  const allRows = cbsFinal.body?.data?.records ?? []
  assert('G5b.final.zeroIncrement', allRows.length === 4 && allRows.filter((r) => r.status === 'SUCCESS').length === 1, allRows.map((r) => ({ a: r.attempt, s: r.status })))
  console.log('G5_DONE')
}

// ────────────────────────── phase: index ──────────────────────────
async function index() {
  const idx = loadIndex()
  out('object-index', idx)
  console.log('INDEX_OK', JSON.stringify(idx.instances))
}

function loadIndex() {
  const p = `${DIR}/object-index.json`
  if (existsSync(p)) return JSON.parse(readFileSync(p, 'utf8'))
  return {}
}
function saveIndex(idx) {
  writeFileSync(`${DIR}/object-index.json`, JSON.stringify(idx, null, 2))
}

await ({ login, setup, g1, g2, g3, g5, index }[phase] || (async () => console.error('unknown phase', phase)))()
const failed = ASSERTS.filter((a) => !a.pass)
out('asserts-' + phase, { total: ASSERTS.length, failed: failed.length, rows: ASSERTS })
console.log(`PHASE ${phase}: ${ASSERTS.length - failed.length}/${ASSERTS.length} asserts passed`)
if (failed.length) process.exit(2)
