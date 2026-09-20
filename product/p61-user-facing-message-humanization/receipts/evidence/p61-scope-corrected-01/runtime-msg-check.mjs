/**
 * P61 范围纠偏（2026-09-20）运行时取证：本轮修订键的真实 HTTP 行为。
 *
 * 全部走真实 HTTP：dev profile + H2 内存库 + 调试身份通道
 * （Authorization: Bearer test_1，仅 dev/test + loopback + SW_DEBUG_AUTH_ENABLED=true，
 * 属既有测试契约；见 DebugAuthenticationFilter）。身份 A = test_1（admin，超级管理员）。
 *
 * 证明四件事（对应当前验收标准 2/3/4）：
 *   1. 修订键在真实服务链上返回新文案（zh/en 双语成对），文案自然且含下一步指引；
 *   2. errorKey 与数值码不随语言/文案变化（机器契约兼容）；
 *   3. 响应体零泄漏：无 SQL/JDBC、堆栈帧、内部类名、tenantId、Jackson 原文；
 *   4. 认证类与统一异常类复用门禁内 P61RuntimeBehaviorBootTest 的当轮重采结果（见回执）。
 */
const BASE = process.env.P61_BASE ?? 'http://127.0.0.1:18080/api'
const A = { Authorization: 'Bearer test_1' }
const stamp = Date.now().toString(36).slice(-5)

const out = []
const log = (s) => {
  out.push(s)
  console.log(s)
}

async function call(label, { method = 'GET', path, body, lang = 'zh-CN' }) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept-Language': lang,
      ...(A),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    /* 非 JSON 原样保留 */
  }
  log(`[${label}] (${lang}) ${method} ${path} → HTTP ${res.status} code=${json?.code} errorKey=${json?.errorKey ?? '-'}`)
  log(`  msg: ${json?.msg ?? json?.message ?? '(无)'} `)
  return { status: res.status, json, text }
}

const results = []
const expect = (label, actual, expected) => {
  const ok = actual === expected
  results.push({ label, ok })
  log(`  assert ${label}: ${ok ? 'PASS' : `FAIL (actual=${actual}, expected=${expected})`}`)
}
const expectContains = (label, body, sub) => {
  const ok = typeof body === 'string' && body.includes(sub)
  results.push({ label, ok })
  log(`  assert ${label}: ${ok ? 'PASS' : `FAIL (missing: ${sub})`}`)
}
const LEAK = /\bat [a-z][a-zA-Z0-9_]*\.[a-zA-Z]|com\.sw\.ck|java\.sql|JDBC|SQLException|JsonMapping|tenantId|tenant_id|"stackTrace"/
const expectNoLeak = (label, text) => {
  const hit = typeof text === 'string' ? text.match(LEAK) : null
  const ok = !hit
  results.push({ label, ok })
  log(`  assert ${label}: ${ok ? 'PASS' : `FAIL (leak: ${hit?.[0]})`}`)
}

// ── 0. 匿名基线（统一异常类当轮在位证明） ──
log('===== 0. 匿名 401（统一异常出口在位） =====')
{
  const res = await fetch(`${BASE}/auth/me`, { headers: { 'Accept-Language': 'zh-CN' } })
  const text = await res.text()
  expect('匿名 401 状态', res.status, 401)
  expectContains('errorKey=common.unauthenticated', text, '"errorKey":"common.unauthenticated"')
  expectContains('zh 文案', text, '登录状态已失效，请重新登录')
  expectNoLeak('匿名 401 零泄漏', text)
}

// ── 1. 表单类：建单 → 配置 → 发布 → 查询 op=IN → 1504 新文案 ──
log('===== 1. 表单类（发布 + 查询过滤 op=IN → 1504） =====')
const formKey = `p61msg${stamp}`
let formId = null
{
  const created = await call('1a', { method: 'POST', path: '/form/def', body: { formKey, name: `P61提示核对${stamp}`, logicalTableName: `p61msg${stamp}` } })
  formId = created.json?.data?.id
  log(`  formId=${formId}`)
}
{
  const definition = { fields: [{ name: 'applicant_name', type: 'TEXT' }] }
  await call('1b', { method: 'POST', path: `/form/def/${formId}/config`, body: { definition: JSON.stringify(definition) } })
  await call('1c', { method: 'POST', path: `/form/def/${formId}/publish`, body: {} })
}
{
  const zh = await call('1d', { method: 'POST', path: `/form/data/${formKey}/query`, body: { pageNum: 1, pageSize: 10, filters: [{ field: 'applicant_name', op: 'IN', value: ['x'] }] }, lang: 'zh-CN' })
  expect('1504 数值码', zh.json?.code, 1504)
  expect('1504 errorKey', zh.json?.errorKey, 'form.query_filter_op_not_supported')
  expectContains('1504 zh 新文案', zh.text, '暂不支持该筛选方式，请调整筛选条件后重试')
  expectNoLeak('1504 zh 零泄漏', zh.text)
  const en = await call('1d', { method: 'POST', path: `/form/data/${formKey}/query`, body: { pageNum: 1, pageSize: 10, filters: [{ field: 'applicant_name', op: 'IN', value: ['x'] }] }, lang: 'en-US' })
  expect('1504 errorKey 不随语言', en.json?.errorKey, 'form.query_filter_op_not_supported')
  expectContains('1504 en 文案', en.text, 'That filter is not supported yet')
  expectNoLeak('1504 en 零泄漏', en.text)
}
{
  const zh = await call('1e', { method: 'POST', path: `/form/data/${formKey}`, body: { not_defined_field: 'x' }, lang: 'zh-CN' })
  expect('1400 数值码', zh.json?.code, 1400)
  expect('1400 errorKey', zh.json?.errorKey, 'form.submit_field_unknown')
  expectContains('1400 zh 新文案', zh.text, '提交包含表单未定义的字段，请刷新页面后重试')
  expectNoLeak('1400 zh 零泄漏', zh.text)
}

// ── 2. 流程类：建流程定义 → 存空图 → 发布 → 2000 新文案 ──
log('===== 2. 流程类（发布空图 → 2000） =====')
{
  const created = await call('2a', { method: 'POST', path: '/workflow/defs', body: { name: `P61提示核对流程${stamp}`, formKey } })
  const defId = created.json?.data?.defId
  log(`  defId=${defId}`)
  await call('2b', { method: 'PUT', path: `/workflow/defs/${defId}/graph`, body: { processKey: `p61msg_flow_${stamp}`, name: `P61提示核对流程${stamp}`, formKey, version: 1, elements: [] } })
  const zh = await call('2c', { method: 'POST', path: `/workflow/defs/${defId}/publish`, lang: 'zh-CN' })
  expect('2000 数值码', zh.json?.code, 2000)
  expect('2000 errorKey', zh.json?.errorKey, 'bpm.graph_missing_start')
  expectContains('2000 zh 新文案', zh.text, '流程图缺少开始节点，请检查流程设计')
  expectNoLeak('2000 zh 零泄漏', zh.text)
  const en = await call('2c', { method: 'POST', path: `/workflow/defs/${defId}/publish`, lang: 'en-US' })
  expect('2000 errorKey 不随语言', en.json?.errorKey, 'bpm.graph_missing_start')
  expectContains('2000 en 文案', en.text, 'missing a start node')
  expectNoLeak('2000 en 零泄漏', en.text)
}

log('===== 汇总 =====')
const failed = results.filter((r) => !r.ok)
log(`断言总数=${results.length}，通过=${results.length - failed.length}，失败=${failed.length}`)
if (failed.length > 0) {
  log('失败项：' + failed.map((f) => f.label).join('；'))
  process.exitCode = 1
}
const fs = await import('node:fs')
fs.writeFileSync(new URL('./runtime-msg-check-output.txt', `file://${import.meta.dirname}/`), out.join('\n'))
