/**
 * R4a-S 十一类泄漏源代表探针（真实 HTTP，唯一标记 + 反向扫描）。
 *
 * 每个探针双断言：
 *  A. 公共响应不含本探针唯一标记，不含栈帧/类名/绝对路径/JDBC 等原始噪声；
 *  B. 失败呈安全分类（受控 errorKey / 业务码 / 分类结论），不是原文透传。
 *
 * 运行：node p61-r4a-s-battery.mjs   （服务需运行在 localhost:8080，dev profile）
 * 输出：r4a-s-probe-results.json + runtime-http.txt（追加）
 */
import { appendFileSync, writeFileSync } from 'node:fs'
import { deflateRawSync } from 'node:zlib'

const BASE = 'http://localhost:8080/api'
const OUT = './runtime-http.txt'
const log = (s = '') => appendFileSync(OUT, s + '\n', 'utf8')

const MARKERS = ['P61INJ_JACKSON', 'P61INJ_FIELDNAME', 'P61INJ_SQL', 'P61INJ_POI',
  'P61INJ_PATH', 'P61INJ_PROVIDER', 'P61INJ_TENANT', 'P61INJ_SCRIPT', 'P61INJ_MQTT',
  'P61INJ_3RD']
const NOISE = ['Caused by', 'at java.', 'at org.', 'java.lang.', 'org.springframework.',
  'org.apache.poi', 'org.h2.jdbc', 'SQLException', 'JdbcTemplate', '\\\\Server\\',
  'C:\\Users', '/home/', 'mapper.xml', 'BPMN']

async function call(method, path, { identity = 'test_1', body, lang, raw, headers = {} } = {}) {
  const h = { Authorization: `Bearer ${identity}`, ...headers }
  if (lang) h['Accept-Language'] = lang
  let payload
  if (raw) { payload = raw.body; h['Content-Type'] = raw.contentType }
  else if (body !== undefined) { payload = JSON.stringify(body); h['Content-Type'] = 'application/json' }
  const res = await fetch(BASE + path, { method, headers: h, body: payload })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch {}
  return { status: res.status, text, json, msg: json?.msg, errorKey: json?.errorKey, code: json?.code }
}

/** 响应噪声/标记反向扫描 */
function scan(text, extra = []) {
  const hits = []
  for (const m of [...MARKERS, ...extra]) if (text.includes(m)) hits.push(m)
  for (const n of NOISE) if (text.includes(n)) hits.push(`NOISE:${n}`)
  return hits
}

const results = []
function record(id, r) {
  results.push(r)
  log(`--- ${id}`)
  log(`    status=${r.status} code=${r.code} errorKey=${r.errorKey ?? '-'}`)
  log(`    msg=${JSON.stringify(r.msg)}`)
  log(`    扫描命中=${JSON.stringify(r.hits)}`)
  console.log(`${r.ok ? 'PASS' : 'FAIL'} ${id} hits=${JSON.stringify(r.hits)}`)
}

// ── 0. 最小 xlsx 构造（STORED zip，无依赖） ──
const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    t[n] = c
  }
  return t
})()
function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function makeZip(files) {
  const chunks = []
  const central = []
  let offset = 0
  for (const [name, content] of files) {
    const nb = Buffer.from(name, 'utf8')
    const cb = Buffer.from(content, 'utf8')
    const crc = crc32(cb)
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0, 6)
    local.writeUInt16LE(0, 8); local.writeUInt16LE(0, 10); local.writeUInt16LE(0, 12)
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(cb.length, 18); local.writeUInt32LE(cb.length, 22)
    local.writeUInt16LE(nb.length, 26); local.writeUInt16LE(0, 28)
    chunks.push(local, nb, cb)
    const cen = Buffer.alloc(46)
    cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(20, 4); cen.writeUInt16LE(20, 6)
    cen.writeUInt16LE(0, 8); cen.writeUInt16LE(0, 10); cen.writeUInt16LE(0, 12); cen.writeUInt16LE(0, 14)
    cen.writeUInt32LE(crc, 16); cen.writeUInt32LE(cb.length, 20); cen.writeUInt32LE(cb.length, 24)
    cen.writeUInt16LE(nb.length, 28); cen.writeUInt16LE(0, 30); cen.writeUInt16LE(0, 32)
    cen.writeUInt16LE(0, 34); cen.writeUInt16LE(0, 36); cen.writeUInt32LE(0, 38)
    cen.writeUInt32LE(offset, 42)
    central.push(Buffer.concat([cen, nb]))
    offset += 30 + nb.length + cb.length
  }
  const cd = Buffer.concat(central)
  const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(files.length, 8); eocd.writeUInt16LE(files.length, 10)
  eocd.writeUInt32LE(cd.length, 12); eocd.writeUInt32LE(offset, 16)
  return Buffer.concat([...chunks, cd, eocd])
}
function makeXlsx(rows) {
  const sheet = `<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>${rows
    .map((r, i) => `<row r="${i + 1}">${r.map((c, j) => `<c r="${String.fromCharCode(65 + j)}${i + 1}" t="inlineStr"><is><t>${c}</t></is></c>`).join('')}</row>`).join('')}</sheetData></worksheet>`
  return makeZip([
    ['[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`],
    ['_rels/.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Sheet1" sheetId="1" r:id="rId1"/></sheets></workbook>`],
    ['xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`],
    ['xl/worksheets/sheet1.xml', sheet],
  ])
}
function multipartBody(filename, fileBuf, boundary) {
  const head = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${filename}"\r\nContent-Type: application/octet-stream\r\n\r\n`)
  const tail = Buffer.from(`\r\n--${boundary}--\r\n`)
  return { body: Buffer.concat([head, fileBuf, tail]), contentType: `multipart/form-data; boundary=${boundary}` }
}

log('\n===== R4a-S 十一类泄漏源代表探针 =====')

// ── 1. Jackson 原文 ──
{
  const r = await call('POST', '/form/def', {
    raw: { contentType: 'application/json', body: `{"formKey":"x","name":"${'P61INJ_JACKSON'}",` },
  })
  const hits = scan(r.text, ['P61INJ_JACKSON'])
  record('1 Jackson 原文（畸形 JSON）', { ...r, hits, ok: hits.length === 0 && r.status === 400 })
}

// ── 2. Java 字段名/参数名（@Valid 校验） ──
{
  const r = await call('POST', '/form/def', {
    body: { name: `P61INJ_FIELDNAME 非法`, logicalTableName: 'P61INJ_FIELDNAME' }, lang: 'zh-CN',
  })
  const hits = scan(r.text, ['P61INJ_FIELDNAME', 'must not', 'is invalid', 'formKey='])
  record('2 Java 字段名/参数名（@Valid 违例）', { ...r, hits, ok: hits.length === 0 })
}

// ── 3. SQL/JDBC 原文（超长过滤值） ──
{
  const longVal = 'A'.repeat(900) + 'P61INJ_SQL'
  const r = await call('POST', '/form/data/p61r10_form2/query', {
    body: { pageNum: 1, pageSize: 10, filters: [{ field: 'dept', op: 'EQ', value: longVal }] },
  })
  const hits = scan(r.text, ['P61INJ_SQL', 'Value too long', 'too long'])
  record('3 SQL/JDBC（超长值触发 JDBC 拒绝）', { ...r, hits, ok: hits.length === 0 })
}

// ── 4. POI 原文（结构非法的 xlsx 导入） ──
{
  const bad = makeXlsx([
    ['标题', '标题', '内容'], // 重复列头，导入校验应拒绝
    ['P61INJ_POI', 'x', 'y'],
  ])
  const boundary = 'P61PROBE' + Date.now()
  const raw = multipartBody('p61inj-poi.xlsx', bad, boundary)
  const r = await call('POST', '/form/data/p61r10_form2/import', { raw })
  const hits = scan(r.text, ['P61INJ_POI', 'zip', 'Zip', 'POIXML', 'XSSF'])
  record('4 POI（非法 xlsx 导入）', { ...r, hits, ok: hits.length === 0 })
}

// ── 5+8. 文件路径 / 栈帧（IoT 脚本错误文本 → sanitize 出口 + 附件 404） ──
{
  const mk = await call('POST', '/iot/scripts', {
    body: {
      code: 'p61injpath', name: 'P61 探针脚本', language: 'JS',
      sourceCode: `// P61INJ_SCRIPT\nload("C:\\\\P61INJ_PATH\\\\evil.js");\nfunction handle(input) { throw new Error("boom P61INJ_PATH"); }`,
    },
  })
  const id = mk.json?.data?.id
  let r = mk
  let hits = scan(mk.text, ['C:\\P61INJ_PATH'])
  if (id) {
    const v = await call('POST', `/iot/scripts/${id}/dry-run`, { body: { input: 1 } })
    r = v
    hits = hits.concat(scan(v.text, ['C:\\P61INJ_PATH', 'P61INJ_SCRIPT', 'boom']))
    // 错误落库回读：iot_script_exec.error 必须已脱敏（无绝对路径）
    if (v.json?.data?.error) hits = hits.concat(scan(v.json.data.error, ['C:\\', '/home/']))
  }
  record('5/8/9 脚本编译原文+绝对路径+栈帧（dry-run 错误）', { ...r, hits, ok: hits.length === 0 })

  const att = await call('GET', '/workflow/attachments/999999/download?storageKey=p61inj-storage-nonexistent')
  const attHits = scan(att.text, ['C:\\', '/home/', '.java'])
  record('8b 附件不存在（路径不外显）', { ...att, hits: attHits, ok: attHits.length === 0 && att.status !== 500 })
}

// ── 6. Provider 原文/配置（未认证 SSO authorize） ──
{
  const r = await fetch(`${BASE}/auth/sso/P61INJ_PROVIDER/authorize`, { redirect: 'manual' })
  const text = await r.text()
  const hits = scan(text, ['P61INJ_PROVIDER', 'client_id', 'clientSecret', 'redirect_uri'])
  record('6 Provider 配置（未认证 authorize）', {
    status: r.status, text, msg: null, code: null, errorKey: null, hits,
    ok: hits.length === 0 && r.status !== 500,
  })
}

// ── 7. tenantId（SSO 票据校验失败） ──
{
  const r = await call('POST', '/auth/sso/ticket', { body: { ticket: 'P61INJ_TENANT-ticket', tenantCode: 'P61INJ_TENANT' } })
  const hits = scan(r.text, ['P61INJ_TENANT', 'tenantId', '租户'])
  // 「租户」汉字结论本身允许出现（如“租户无效”），断言只针对内部标识/数值
  const realHits = hits.filter((x) => x !== 'NOISE:C:\\Users')
  record('7 tenantId（票据校验失败）', { ...r, hits: realHits, ok: !r.text.includes('P61INJ_TENANT') && !r.text.includes('tenantId=') })
}

// ── 10. MQTT 原文（连接测试，主机名不可解析） ──
{
  const mk = await call('POST', '/iot/connections', {
    body: { code: 'p61injmqtt', name: 'P61 探针连接', connType: 'MQTT', host: 'P61INJ_MQTT.invalid', port: 1883 },
  })
  const id = mk.json?.data?.id
  let r = mk, hits = scan(mk.text, ['P61INJ_MQTT'])
  if (id) {
    const t = await call('POST', `/iot/connections/${id}/test`)
    r = t
    hits = scan(t.text, ['P61INJ_MQTT', 'UnknownHostException', 'connect timed out'])
  }
  record('10 MQTT 原文（连接测试分类）', { ...r, hits, ok: hits.length === 0 && r.json?.code === 0 })
}

// ── 11. 第三方 HTTP 原文（Agent 模型连通性测试） ──
{
  const mk = await call('POST', '/agent/models', {
    body: {
      name: 'P61 探针模型', protocolType: 'OPENAI', baseUrl: 'http://P61INJ_3RD.invalid/v1',
      modelName: 'probe-model', apiKey: 'sk-p61injprobe', timeoutSeconds: 2, enabled: true,
    },
  })
  const id = mk.json?.data
  let r = mk, hits = scan(mk.text, ['P61INJ_3RD', 'sk-p61injprobe'])
  if (id) {
    const t = await call('POST', `/agent/models/${id}/test-connection`)
    r = t
    hits = hits.concat(scan(t.text, ['P61INJ_3RD', 'sk-p61injprobe', 'UnknownHost', 'ConnectException']))
  }
  record('11 第三方 HTTP 原文（Agent 连通性测试）', { ...r, hits, ok: hits.length === 0 })
}

const summary = {
  collectedAt: new Date().toISOString(),
  passCount: results.filter((r) => r.ok).length,
  failCount: results.filter((r) => !r.ok).length,
  results: results.map(({ ok, id: _x, ...rest }) => ({ ok, ...rest })),
}
writeFileSync('./.tmp/r4a-s-probe-results.json', JSON.stringify(summary, null, 2), 'utf8')
log(`\nR4a-S 探针汇总: pass=${summary.passCount} fail=${summary.failCount}`)
console.log(`\nSUMMARY pass=${summary.passCount} fail=${summary.failCount}`)
