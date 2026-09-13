#!/usr/bin/env node
/**
 * I4 真实行为链驱动（G1—G3/G5）。
 * 前置：各身份 token 已由 i4-login.mjs 真实挑战登录取得（token-<user>.json）。
 * 全部调用走真实后端 HTTP（localhost:8080/api），每步原始响应落盘 evidence 目录。
 * 用法: node i4-e2e.mjs <phase>   phase ∈ setup | dynamic
 */
import { request as httpRequest } from 'node:http'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'

const DIR = 'E:/code/Smart-WorkFlow-Agent-Workspace/product/v0.1.0-oa-completion/receipts/evidence/i4-02/http'
const BASE = 'http://localhost:8080/api'
const phase = process.argv[2] || 'setup'

function token(user) {
  return JSON.parse(readFileSync(`${DIR}/token-${user}.json`, 'utf8')).accessToken
}

function call(user, method, path, body, tag) {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? null : JSON.stringify(body)
    const req = httpRequest(
      BASE + path,
      { method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token(user)}` } },
      (res) => {
        let buf = ''
        res.on('data', (chunk) => (buf += chunk))
        res.on('end', () => {
          if (tag) {
            writeFileSync(`${DIR}/${tag}.json`, JSON.stringify({ user, method, path, status: res.statusCode, body: safe(buf) }, null, 2))
          }
          resolve({ status: res.statusCode, body: safe(buf) })
        })
      },
    )
    req.on('error', reject)
    if (data) req.write(data)
    req.end()
  })
}
function safe(text) {
  try { return JSON.parse(text) } catch { return text }
}
const out = (name, obj) => writeFileSync(`${DIR}/${name}.json`, JSON.stringify(obj, null, 2))

async function setup() {
  mkdirSync(DIR, { recursive: true })
  const steps = []
  const step = async (name, user, method, path, body, { tolerate = false } = {}) => {
    const r = await call(user, method, path, body, name)
    steps.push({ name, code: r.body?.code ?? r.status, path })
    if ((r.body?.code ?? 0) !== 0) {
      if (tolerate) {
        console.warn('STEP_TOLERATED', name, JSON.stringify(r.body).slice(0, 200))
        return null
      }
      console.error('STEP_FAIL', name, JSON.stringify(r.body).slice(0, 300))
      process.exit(1)
    }
    return r.body?.data
  }

  for (const [username, realName] of [
    ['leader1', '部门负责人一'],
    ['leader2', '部门负责人二'],
    ['initiator', '发起人小王'],
    ['outsider', '无关用户'],
  ]) {
    await step(`create-user-${username}`, 'admin', 'POST', '/system/user', {
      username, realName, plainPassword: 'User@123', deptId: 1, status: 0, roleIds: [],
    }, { tolerate: true })
  }

  await step('create-dept-a', 'admin', 'POST', '/system/dept',
    { name: '研发一部', code: 'i4-dept-a', parentId: 1, sort: 1, status: 0 }, { tolerate: true })
  await step('create-dept-b', 'admin', 'POST', '/system/dept',
    { name: '研发二部', code: 'i4-dept-b', parentId: 1, sort: 2, status: 0 }, { tolerate: true })
  await step('create-dept-c', 'admin', 'POST', '/system/dept',
    { name: '研发三部', code: 'i4-dept-c', parentId: 1, sort: 3, status: 0 }, { tolerate: true })
  const usersPage = await step('page-users', 'admin', 'POST', '/system/user/page', { pageNum: 1, pageSize: 50 })
  const byName = {}
  for (const u of usersPage.records ?? []) byName[u.username] = u.id
  const tree = await step('dept-tree', 'admin', 'GET', '/system/dept/tree')
  const deptByCode = {}
  const walk = (nodes) => {
    for (const n of nodes ?? []) {
      deptByCode[n.code] = n.id
      walk(n.children)
    }
  }
  walk(tree)
  const deptA = deptByCode['i4-dept-a']
  const deptB = deptByCode['i4-dept-b']
  const deptC = deptByCode['i4-dept-c']
  out('user-ids', byName)
  await step('update-dept-a', 'admin', 'PUT', '/system/dept', { id: deptA, name: '研发一部', code: 'i4-dept-a', parentId: 1, sort: 1, status: 0, leaderId: byName.leader1 })
  await step('update-dept-b', 'admin', 'PUT', '/system/dept', { id: deptB, name: '研发二部', code: 'i4-dept-b', parentId: 1, sort: 2, status: 0, leaderId: byName.leader2 })
  await step('update-dept-c', 'admin', 'PUT', '/system/dept', { id: deptC, name: '研发三部', code: 'i4-dept-c', parentId: 1, sort: 3, status: 0, leaderId: byName.leader2 })
  out('dept-ids', { deptA, deptB, deptC })

  await step('create-form', 'admin', 'POST', '/form/def', {
    formKey: 'i4_leave_form', name: 'I4 部门协作单', logicalTableName: 'i4_leave_form', description: 'I4 动态并行验证表单',
  }, { tolerate: true })
  const formPage = await step('page-forms', 'admin', 'GET', '/form/def/page?pageNum=1&pageSize=50')
  const form = (formPage.records ?? []).find((f) => f.formKey === 'i4_leave_form')
  await step('save-form-config', 'admin', 'POST', `/form/def/${form.id}/config`, {
    definition: JSON.stringify({
      schemaVersion: 1,
      title: 'I4 部门协作单',
      fields: [
        { name: 'days', type: 'NUMBER', label: '天数', required: true },
        { name: 'reason', type: 'TEXT', label: '事由', required: false, length: 200 },
        { name: 'deptList', type: 'TEXT', label: '协作部门', required: false, length: 100 },
      ],
    }),
  })
  await step('publish-form', 'admin', 'POST', `/form/def/${form.id}/publish`, '')

  const defPage = await step('page-defs', 'admin', 'GET', '/workflow/defs?pageNum=1&pageSize=50')
  const existingDef = (defPage.records ?? []).find((d) => d.name === 'I4 动态并行协作审批')
  const def = existingDef ?? (await step('create-def', 'admin', 'POST', '/workflow/defs', {
    name: 'I4 动态并行协作审批', formKey: 'i4_leave_form',
  }))
  const defId = def.defId ?? def.id
  const graph = {
    processKey: existingDef?.processKey ?? 'i4_dynamic_parallel_def',
    name: 'I4 动态并行协作审批',
    formKey: 'i4_leave_form',
    version: 1,
    contractVersion: 2,
    elements: [
      { id: 'start', kind: 'node', type: 'START', x: 80, y: 200 },
      {
        id: 'dyn', kind: 'node', type: 'DYNAMIC_PARALLEL', x: 300, y: 200,
        config: {
          name: '部门负责人并行审批',
          mode: 'ALL',
          maxBranches: 50,
          emptyStrategy: 'BLOCK',
          invalidStrategy: 'SKIP',
          source: { type: 'VARIABLE', value: 'deptList' },
        },
      },
      { id: 'end', kind: 'node', type: 'END', x: 560, y: 200 },
      { id: 'e1', kind: 'edge', source: 'start', target: 'dyn' },
      { id: 'e2', kind: 'edge', source: 'dyn', target: 'end' },
    ],
  }
  await step('save-graph', 'admin', 'PUT', `/workflow/defs/${defId}/graph`, graph)
  const validation = await step('validate-graph', 'admin', 'POST', `/workflow/defs/${defId}/validate`, {})
  out('graph-validation', validation)
  await step('publish-def', 'admin', 'POST', `/workflow/defs/${defId}/publish`, {})
  out('setup-summary', { steps, formId: form.id, defId, users: byName, depts: { deptA, deptB, deptC } })
  console.log('SETUP_OK', JSON.stringify({ defId, deptA, deptB, deptC, users: byName }))
}

async function roles() {
  const ids = JSON.parse(readFileSync(`${DIR}/setup-summary.json`, 'utf8'))
  // 员工角色：表单提交(350) + 我的流程(24/25/26) + 事项目录(320)
  const rolePage = await call('admin', 'POST', '/system/role/page', { pageNum: 1, pageSize: 50 }, 'role-page')
  let roleId = (rolePage.body?.data?.records ?? []).find((r) => r.code === 'i4_employee')?.id
  if (!roleId) {
    const created = await call('admin', 'POST', '/system/role', {
      name: 'I4 员工', code: 'i4_employee', sort: 9, status: 1, dataScope: 1,
    }, 'role-create')
    roleId = created.body?.data
  }
  await call('admin', 'PUT', '/system/role', { id: roleId, name: 'I4 员工', code: 'i4_employee', sort: 9, status: 1 }, 'role-enable')
  await call('admin', 'PUT', `/system/role/${roleId}/menus`, [24, 25, 26, 320, 350, 365, 366], 'role-menus')
  for (const username of ['leader1', 'leader2', 'initiator', 'outsider']) {
    await call('admin', 'PUT', '/system/user', {
      id: ids.users[username], username, realName: username, deptId: 1, status: 0,
      roleIds: [roleId],
    }, `assign-role-${username}`)
  }
  console.log('ROLES_OK roleId=' + roleId)
}

async function dynamic() {
  const ids = JSON.parse(readFileSync(`${DIR}/setup-summary.json`, 'utf8'))
  const { deptA, deptB, deptC } = ids.depts
  const submit = await call('initiator', 'POST', '/form/data/i4_leave_form',
    { days: 2, reason: 'I4 动态并行正向链', deptList: `${deptA},${deptB},${deptC}` }, 'dyn-submit')
  console.log('SUBMIT', JSON.stringify(submit.body).slice(0, 300))
}

await ({ setup, roles, dynamic, verify, complete, negatives, pull }[phase] || (async () => console.error('unknown phase', phase)))()

async function verify() {
  await sleep(2000) // 命令/事件链异步落库
  const l1 = await call('leader1', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=10', undefined, 'dyn-todo-leader1')
  const l2 = await call('leader2', 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=10', undefined, 'dyn-todo-leader2')
  const mine = await call('initiator', 'GET', '/workflow/my/instances?pageNum=1&pageSize=5', undefined, 'dyn-my-instances')
  const inst = (mine.body?.data?.records ?? [])[0]
  if (!inst) { console.error('NO_INSTANCE', JSON.stringify(mine.body).slice(0,300)); process.exit(1) }
  const pi = inst.processInstanceId
  const branches = await call('admin', 'GET', `/workflow/monitor/instances/${pi}/branches`, undefined, 'dyn-branches')
  const detail = await call('admin', 'GET', `/workflow/instances/${pi}`, undefined, 'dyn-instance-detail')
  out('dyn-current', { processInstanceId: pi, instance: inst, todoLeader1: (l1.body?.data?.records??[]).map(t=>({taskId:t.taskId,name:t.name,assignee:t.assignee})), todoLeader2: (l2.body?.data?.records??[]).map(t=>({taskId:t.taskId,name:t.name,assignee:t.assignee})) })
  console.log('VERIFY_OK pi=' + pi)
  console.log('leader1 todo:', JSON.stringify((l1.body?.data?.records??[]).map(t=>t.taskId)))
  console.log('leader2 todo:', JSON.stringify((l2.body?.data?.records??[]).map(t=>t.taskId)))
  console.log('branches:', JSON.stringify(branches.body?.data))
}
function sleep(ms){return new Promise(r=>setTimeout(r,ms))}

async function complete() {
  const cur = JSON.parse(readFileSync(DIR + '/dyn-current.json', 'utf8'))
  const t1 = cur.todoLeader1[0].taskId
  const t2 = cur.todoLeader2[0].taskId
  const r1 = await call('leader1', 'POST', `/workflow/commands/tasks/${t1}/complete`, { comment: '部门一审批通过' }, 'dyn-complete-leader1')
  const r2 = await call('leader2', 'POST', `/workflow/commands/tasks/${t2}/complete`, { comment: '部门二三合并分支审批通过' }, 'dyn-complete-leader2')
  await sleep(2500)
  const mine = await call('initiator', 'GET', '/workflow/my/instances?pageNum=1&pageSize=5', undefined, 'dyn-my-instances-after')
  const inst = (mine.body?.data?.records ?? []).find((x) => x.processInstanceId === cur.processInstanceId)
  const branches = await call('admin', 'GET', `/workflow/monitor/instances/${cur.processInstanceId}/branches`, undefined, 'dyn-branches-after')
  const detail = await call('admin', 'GET', `/workflow/instances/${cur.processInstanceId}`, undefined, 'dyn-instance-detail-after')
  console.log('COMPLETE', JSON.stringify({ r1: r1.body?.code, r2: r2.body?.code, status: inst?.status }))
  console.log('branches:', JSON.stringify((branches.body?.data ?? []).map((b) => ({ idx: b.branchIndex, leader: b.leaderId, status: b.status, task: b.taskId }))))
}
async function pull() {
  const cur = JSON.parse(readFileSync(DIR + '/dyn-current.json', 'utf8'))
  const branches = await call('admin', 'GET', `/workflow/monitor/instances/${cur.processInstanceId}/branches`, undefined, 'dyn-branches-after')
  const detail = await call('admin', 'GET', `/workflow/instances/${cur.processInstanceId}`, undefined, 'dyn-instance-detail-after')
  console.log('BRANCHES', JSON.stringify((branches.body?.data ?? []).map((b) => ({ idx: b.branchIndex, depts: b.deptIds, leader: b.leaderId, status: b.status, task: b.taskId }))))
  console.log('DETAIL', JSON.stringify(detail.body?.data && { status: detail.body.data.instance?.status ?? detail.body.data.status }))
}

async function negatives() {
  // 1) 空集合 + BLOCK → 确定拒绝
  const empty = await call('initiator', 'POST', '/form/data/i4_leave_form',
    { days: 1, reason: 'I4 空集合负向', deptList: '' }, 'neg-empty-submit')
  await sleep(2500)
  const mine = await call('initiator', 'GET', '/workflow/my/instances?pageNum=1&pageSize=10', undefined, 'neg-my-instances')
  const emptyInst = (mine.body?.data?.records ?? []).find((x) => x.status === 'FAILED')
  console.log('NEG_EMPTY submit=', empty.body?.code, 'failedInstance=', JSON.stringify(emptyInst && { pi: emptyInst.processInstanceId, status: emptyInst.status }))
}
