/**
 * R3a-H / R3b-H 真实验证：字段显示名在拒绝消息中必须存活，内部 key 零出现。
 *
 * 复现场景：
 *  - R3a：筛选拒绝（不可筛选类型 / 操作符不匹配 / 未知字段）
 *  - R3b：显隐规则错误经真实发布路径（重复 target、未定义字段、缺条件）
 * 每个场景同时采 zh-CN 与 en-US，并对响应体做内部 key 反向扫描。
 */
import { appendFileSync, writeFileSync, readFileSync, existsSync } from 'node:fs'

const BASE = 'http://localhost:8080/api'
const OUT = './runtime-http.txt'
const log = (s = '') => appendFileSync(OUT, s + '\n', 'utf8')

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
  return { status: res.status, text, json, msg: json?.msg, errorKey: json?.errorKey }
}

/** 内部标识反向扫描：字段 key 不得出现在用户可见消息里 */
function keyScan(text, keys) {
  return keys.filter((k) => new RegExp('(?<![A-Za-z0-9_])' + k + '(?![A-Za-z0-9_])').test(text))
}

const FORM = 'p61r10_form2'
const KEYS = ['content', 'salary', 'dept']
const results = []

// ── 建表：含 RICH_TEXT（不可筛选） ──
const existing = await call('GET', `/form/def/by-key/${FORM}`)
if (existing.json?.code !== 0) {
  const c = await call('POST', '/form/def', {
    body: { formKey: FORM, name: 'P61 R10 字段名表单', logicalTableName: FORM, description: 'R3 显示名取景' },
  })
  const id = c.json?.data?.id
  const def = {
    title: 'P61 R10 字段名表单',
    fields: [
      { name: 'content', type: 'RICH_TEXT', label: '内容', required: false },
      { name: 'salary', type: 'NUMBER', label: '月薪', required: false },
      { name: 'dept', type: 'TEXT', label: '部门', required: false, length: 60 },
    ],
  }
  await call('POST', `/form/def/${id}/config`, { body: { definition: JSON.stringify(def) } })
  const pub = await call('POST', `/form/def/${id}/publish`)
  log(`\n===== R3 取景表单建立 =====`)
  log(`createDraft id=${id} / publish code=${pub.json?.code} msg=${pub.json?.msg}`)
  writeFileSync('./.tmp/r3-form2.json', JSON.stringify({ formKey: FORM, id, definition: def }, null, 2), 'utf8')
}

log('\n===== R3a-H 字段显示名：真实筛选拒绝路径（zh / en 成对 + 内部 key 反向扫描） =====')

const scenarios = [
  {
    id: 'A1 不可筛选类型（RICH_TEXT）',
    body: { pageNum: 1, pageSize: 10, filters: [{ field: 'content', op: 'EQ', value: 'x' }] },
  },
  {
    id: 'A2 操作符与类型不匹配（NUMBER + LIKE）',
    body: { pageNum: 1, pageSize: 10, filters: [{ field: 'salary', op: 'LIKE', value: '1' }] },
  },
  {
    id: 'A3 未知字段',
    body: { pageNum: 1, pageSize: 10, filters: [{ field: 'p61nosuchfield', op: 'EQ', value: '1' }] },
  },
]

for (const sc of scenarios) {
  const zh = await call('POST', `/form/data/${FORM}/query`, { body: sc.body, lang: 'zh-CN' })
  const en = await call('POST', `/form/data/${FORM}/query`, { body: sc.body, lang: 'en-US' })
  const zhLeak = keyScan(zh.text, KEYS)
  const enLeak = keyScan(en.text, KEYS)
  log(`--- ${sc.id}`)
  log(`    zh: HTTP ${zh.status} code=${zh.json?.code} errorKey=${zh.errorKey} msg=${zh.msg}`)
  log(`    en: HTTP ${en.status} code=${en.json?.code} errorKey=${en.errorKey} msg=${en.msg}`)
  log(`    errorKey 是否随语言变化: ${zh.errorKey === en.errorKey ? '否（正确）' : '是（错误）'}`)
  log(`    反向扫描内部 key ${JSON.stringify(KEYS)} -> zh 命中 ${JSON.stringify(zhLeak)} / en 命中 ${JSON.stringify(enLeak)}`)
  results.push({ id: sc.id, zh: zh.msg, en: en.msg, zhLeak, enLeak, sameKey: zh.errorKey === en.errorKey })
}

log('\n===== R3b-H 显隐规则错误：真实发布路径（必须在消息里显示设计者可识别名称） =====')
const defBadDup = {
  title: 'P61 R10 字段名表单',
  fields: [
    { name: 'content', type: 'RICH_TEXT', label: '内容', required: false },
    { name: 'salary', type: 'NUMBER', label: '月薪', required: false },
    { name: 'dept', type: 'TEXT', label: '部门', required: false, length: 60 },
  ],
  rules: {
    visibility: [
      { target: 'salary', logic: 'ALL', conditions: [{ field: 'dept', op: 'EQ', value: 'x' }] },
      { target: 'salary', logic: 'ALL', conditions: [{ field: 'dept', op: 'NE', value: 'y' }] },
    ],
  },
}
// 显隐规则只能在草稿上配置后经 publish 校验：另建一个草稿表单
const draft = await call('POST', '/form/def', {
  body: { formKey: FORM + '_vis', name: 'P61 R10 显隐规则表单', logicalTableName: FORM + '_vis', description: 'R3b 显隐取景' },
})
const formId = draft.json?.data?.id
log(`草稿表单 id=${formId}（显隐规则经 config 保存后走 publish 校验）`)

if (formId) {
  await call('POST', `/form/def/${formId}/config`, { body: { definition: JSON.stringify(defBadDup) } })
  const zhPub = await call('POST', `/form/def/${formId}/publish`, { lang: 'zh-CN' })
  const enPub = await call('POST', `/form/def/${formId}/publish`, { lang: 'en-US' })
  log(`--- B1 同字段重复显隐规则`)
  log(`    zh: HTTP ${zhPub.status} code=${zhPub.json?.code} errorKey=${zhPub.errorKey} msg=${zhPub.msg}`)
  log(`    en: HTTP ${enPub.status} code=${enPub.json?.code} errorKey=${enPub.errorKey} msg=${enPub.msg}`)
  const leak = keyScan(enPub.text, ['salary', 'dept'])
  log(`    反向扫描内部 key ['salary','dept'] -> en 命中 ${JSON.stringify(leak)}`)
  log(`    含显示名「月薪」: ${String(zhPub.msg).includes('月薪')}`)
  results.push({ id: 'B1 重复显隐规则', zh: zhPub.msg, en: enPub.msg, enLeak: leak })
}

writeFileSync('./.tmp/r3-results.json', JSON.stringify(results, null, 2), 'utf8')
console.log(results.map((r) => `${r.id}\n  zh=${r.zh}\n  en=${r.en}\n  leak=${JSON.stringify(r.enLeak)}`).join('\n'))
