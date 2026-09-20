// P53 补证 EV-02 夹具铺设：真实后端 8080 + dev 固定验证码契约（对齐 i6-04 object-setup 同源链）。
// 只通过既有产品 API 铺设取证对象，不改代码/迁移/配置。口令与秘密不进入证据目录。
const crypto = require('crypto')
const fs = require('fs')
const path = require('path')

const BASE = 'http://127.0.0.1:8080/api'
const DEV_PASSWORD = process.env.P53_DEV_PASSWORD || 'admin123'
const CAPTCHA = '1234'
const SUFFIX = 'p53ev'

async function challengeLogin(username, password = DEV_PASSWORD) {
  const ch = await (await fetch(`${BASE}/auth/challenge`)).json()
  const { captchaId, publicKey } = ch.data
  const keyObj = crypto.createPublicKey({ key: Buffer.from(publicKey, 'base64'), format: 'der', type: 'spki' })
  const enc = crypto.publicEncrypt(
    { key: keyObj, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    Buffer.from(password, 'utf8'),
  )
  const resp = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: enc.toString('base64'), captcha: CAPTCHA, captchaId, timestamp: String(Date.now()) }),
  })
  const json = await resp.json()
  if (json.code !== 0 || !json.data || !json.data.accessToken) {
    throw new Error(`login ${username} failed: ${resp.status} ${JSON.stringify(json)}`)
  }
  return { token: json.data.accessToken, userId: json.data.userId, tenantId: json.data.tenantId }
}

async function req(token, method, path, body) {
  const resp = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await resp.text()
  let json
  try { json = JSON.parse(text) } catch { json = text.slice(0, 300) }
  return { status: resp.status, body: json }
}

const records = (r) => (r.body && r.body.data && r.body.data.records) || []

async function waitCommand(token, commandId) {
  for (let i = 0; i < 40; i += 1) {
    await new Promise((r) => setTimeout(r, 500))
    const res = await req(token, 'GET', `/workflow/commands/${commandId}`)
    const st = res.body && res.body.data
    if (st && ['COMPLETED', 'FAILED', 'REJECTED', 'CANCELLED'].includes(st.status)) return st
  }
  throw new Error(`command timeout: ${commandId}`)
}

;(async () => {
  const out = { steps: [] }
  const log = (step, detail) => { out.steps.push({ step, ...detail }); console.log(`[fixture] ${step}:`, JSON.stringify(detail)) }

  const admin = await challengeLogin('admin')
  log('login-admin', { userId: admin.userId, tenantId: admin.tenantId })

  // 1) 真实分类 ×2（经管理 API；名字带取证后缀避免与历史数据混淆）
  const catNames = [`行政办公-${SUFFIX}`, `人事财务-${SUFFIX}`]
  const catIds = {}
  for (const name of catNames) {
    const created = await req(admin.token, 'POST', '/workflow/categories', { name, sortNo: 9 })
    const id = created.body && created.body.data && created.body.data.id
    catIds[name] = id
    log('create-category', { name, httpStatus: created.status, code: created.body.code, id })
  }

  // 2) 既有 P61 事项划入第一分类（真实绑定调整 API）
  const assigned = await req(admin.token, 'PUT', '/workflow/catalog/admin/items/bpm_3dca3da18cba4ac6/category', {
    categoryId: catIds[catNames[0]],
  })
  log('assign-category-existing-def', { httpStatus: assigned.status, code: assigned.body.code })

  // 3) 新建一个流程定义并发布（绑定既有已发布表单），划入第二分类
  const createdDef = await req(admin.token, 'POST', '/workflow/defs', {
    name: `P53 取证事项-${SUFFIX}`,
    formKey: 'p61r10_batch_form',
  })
  log('create-def', { httpStatus: createdDef.status, code: createdDef.body.code, data: createdDef.body.data })
  const defId = createdDef.body && createdDef.body.data && (createdDef.body.data.defId ?? createdDef.body.data)
  const graph = createdDef.body && createdDef.body.data && createdDef.body.data.graph
  // 发布前写入图（默认图直发；失败则如实记录继续）
  if (graph) {
    const saved = await req(admin.token, 'PUT', `/workflow/defs/${defId}`, { name: `P53 取证事项-${SUFFIX}`, formKey: 'p61r10_batch_form', graphJson: graph })
    log('save-def-graph', { httpStatus: saved.status, code: saved.body.code })
  }
  const published = await req(admin.token, 'POST', `/workflow/defs/${defId}/publish`)
  log('publish-def', { defId, httpStatus: published.status, code: published.body.code, msg: published.body.msg })
  const assigned2 = await req(admin.token, 'PUT', `/workflow/catalog/admin/items/p53_${SUFFIX}_def/category`, {
    categoryId: catIds[catNames[1]],
  })
  // processKey 可能非确定，回读列表找到新事项再划分类
  if (assigned2.status === 404 || (assigned2.body && assigned2.body.code === 404)) {
    const adminItems = await req(admin.token, 'GET', '/workflow/catalog/admin/items?pageNum=1&pageSize=50')
    const item = records(adminItems).find((it) => it.name === `P53 取证事项-${SUFFIX}`)
    if (item) {
      const a2 = await req(admin.token, 'PUT', `/workflow/catalog/admin/items/${item.itemKey}/category`, {
        categoryId: catIds[catNames[1]],
      })
      log('assign-category-new-def', { itemKey: item.itemKey, httpStatus: a2.status, code: a2.body.code })
    } else {
      log('assign-category-new-def', { error: 'item not found in admin catalog' })
    }
  } else {
    log('assign-category-new-def-direct', { httpStatus: assigned2.status, code: assigned2.body.code })
  }

  // 4) 发起一个真实实例（表单提交 → 绑定解析启动流程），随后管理员审批通过
  const defResp = await req(admin.token, 'GET', '/form/def/by-key/p61r10_batch_form/definition')
  const definition = defResp.body && defResp.body.data
  const fields = (definition && definition.fields) || []
  const submitData = {}
  for (const f of fields) {
    if (f.required || f.options?.required) {
      if (f.type === 'INPUT' || f.type === 'TEXTAREA' || !f.type) submitData[f.name] = 'P53 取证内容'
      else if (f.type === 'NUMBER') submitData[f.name] = 1
      else submitData[f.name] = 'P53 取证内容'
    }
  }
  log('form-fields', { formKey: 'p61r10_batch_form', fieldCount: fields.length, submitKeys: Object.keys(submitData) })
  const submit = await req(admin.token, 'POST', '/form/data/p61r10_batch_form', submitData)
  const businessKey = submit.body && submit.body.data
  log('submit-form', { httpStatus: submit.status, code: submit.body.code, businessKey })

  let approved = null
  for (let i = 0; i < 30; i += 1) {
    await new Promise((r) => setTimeout(r, 500))
    const todo = await req(admin.token, 'GET', '/workflow/tasks/todo?pageNum=1&pageSize=50')
    const task = records(todo).find((t) => t.businessKey === businessKey)
    if (task) {
      const accepted = await req(admin.token, 'POST', `/workflow/commands/tasks/${task.taskId}/complete`, {
        opinion: { comment: 'P53 取证审批意见：同意' },
      })
      log('approve-task', { taskId: task.taskId, httpStatus: accepted.status, code: accepted.body.code, data: accepted.body.data })
      const commandId = accepted.body && accepted.body.data && (accepted.body.data.commandId ?? accepted.body.data)
      if (commandId) {
        const st = await waitCommand(admin.token, commandId)
        log('approve-command-status', { status: st && st.status })
      }
      approved = true
      break
    }
  }
  if (!approved) log('approve-task', { note: 'no todo task appeared for businessKey (binding may not start process)' })

  // 5) 权限链用户：有权用户 + 无角色用户（口令与 admin 相同 dev 契约）
  const users = {}
  for (const [uname, roleIds] of [[`${SUFFIX}_u1`, [1]], [`${SUFFIX}_u0`, []]]) {
    const created = await req(admin.token, 'POST', '/system/user', {
      username: uname,
      realName: `P53EV ${uname}`,
      status: 0,
      sex: 0,
      roleIds,
      plainPassword: DEV_PASSWORD,
    })
    users[uname] = { httpStatus: created.status, code: created.body.code }
    if (created.body.code === 0 || (created.body.data)) {
      const l = await challengeLogin(uname).catch((e) => ({ error: e.message }))
      users[uname].login = l.token ? 'ok' : l.error
      if (l.token) {
        const menus = await req(l.token, 'GET', '/system/auth/menus')
        users[uname].menuTopKeys = menus.body && menus.body.data ? Object.keys(menus.body.data).length : null
      }
    }
    log('create-user', { uname, roleIds, ...users[uname] })
  }

  // 6) 回读目录（分类与计数，作为浏览器取证的前置事实）
  const cats = await req(admin.token, 'GET', '/workflow/catalog/categories')
  const items = await req(admin.token, 'GET', '/workflow/catalog/items?pageNum=1&pageSize=20')
  log('portal-catalog', {
    categories: (cats.body.data || []).map((c) => ({ id: c.id, name: c.name })),
    itemCount: items.body.data ? items.body.data.total : null,
    itemNames: records(items).map((it) => it.name),
  })

  const evDir = __dirname
  fs.writeFileSync(path.join(evDir, 'fixture-result.json'), JSON.stringify(out, null, 1))
  console.log('[fixture] DONE ->', path.join(evDir, 'fixture-result.json'))
})().catch((e) => {
  console.error('[fixture] FATAL', e)
  process.exit(1)
})
