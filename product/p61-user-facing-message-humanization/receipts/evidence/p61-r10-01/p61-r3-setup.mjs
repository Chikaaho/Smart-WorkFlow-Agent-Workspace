/**
 * R3 取景对象建立：创建并发布一个带可识别显示名的表单。
 * 字段：title（TEXT，标签「标题」）/ salary（NUMBER，标签「月薪」）/ dept（TEXT，标签「部门」）
 * 目的：字段权限拒绝与显隐规则错误必须使用这些「显示名」，不得回显内部 key
 * （title/salary/dept）。
 */
import { appendFileSync, writeFileSync } from 'node:fs'

const BASE = 'http://localhost:8080/api'
const OUT = './runtime-http.txt'
const log = (s = '') => appendFileSync(OUT, s + '\n', 'utf8')
const nowIso = () => new Date().toISOString().replace(/\.\d+Z$/, 'Z')

async function call(method, path, { identity = 'test_1', body, lang } = {}) {
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${identity}` }
  if (lang) headers['Accept-Language'] = lang
  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch {}
  return { status: res.status, text, json, errorKey: json?.errorKey, eventRef: json?.eventRef }
}

const formKey = 'p61r10_form'
const definition = {
  title: 'P61 R10 取景表单',
  fields: [
    { name: 'title', type: 'TEXT', label: '标题', required: true, length: 100 },
    { name: 'salary', type: 'NUMBER', label: '月薪', required: false },
    { name: 'dept', type: 'TEXT', label: '部门', required: false, length: 60 },
  ],
}

log()
log('===== R3 取景对象：创建并发布表单 =====')
log(`时间(UTC): ${nowIso()}`)

const created = await call('POST', '/form/def', {
  body: { formKey, name: 'P61 R10 取景表单', logicalTableName: 'p61r10_form', description: 'P61 R10 R3 取景' },
})
log(`createDraft -> HTTP ${created.status} ${created.text.slice(0, 300)}`)
const id = created.json?.data?.id ?? created.json?.data?.formId
log(`formId = ${id}`)

if (id) {
  const cfg = await call('POST', `/form/def/${id}/config`, { body: { definition } })
  log(`saveConfig -> HTTP ${cfg.status} ${cfg.text.slice(0, 200)}`)

  const pub = await call('POST', `/form/def/${id}/publish`)
  log(`publish -> HTTP ${pub.status} ${pub.text.slice(0, 400)}`)

  const byKey = await call('GET', `/form/def/by-key/${formKey}`)
  log(`by-key -> HTTP ${byKey.status} ${byKey.text.slice(0, 300)}`)
}

writeFileSync('./.tmp/r3-form.json', JSON.stringify({ formKey, id, definition }, null, 2), 'utf8')
log()
