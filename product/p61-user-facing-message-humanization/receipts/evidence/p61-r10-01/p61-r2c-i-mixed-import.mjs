/**
 * R2c-I 真实混合导入：2 行有效 + 1 行无效（同批）。
 *
 * 服务端契约（FormImportExportService.importData，已在代码与真实响应中确认）：
 * 整批原子——任一行失败则全部回滚，successCount=0，逐行错误保留 rowNum+安全文案。
 * 因此「同一批次至少一项成功一项失败」在当前产品契约下结构性不可达；
 * 本脚本采证真实行为并回读证明零落库，冲突事实移交规划裁决。
 *
 * 途径：下载官方模板（含模板签名）→ 解析 zip → 在「模板」sheet 追加数据行 → 重新上传。
 * 输出：r2c-i-results.json + runtime-http.txt（追加）
 */
import { appendFileSync, writeFileSync } from 'node:fs'
import { inflateRawSync, deflateRawSync } from 'node:zlib'

const BASE = 'http://localhost:8080/api'
const OUT = './runtime-http.txt'
const log = (s = '') => appendFileSync(OUT, s + '\n', 'utf8')
const FORM_KEY = 'p61r10_form2'
const HEADERS = { Authorization: 'Bearer test_1' }

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...HEADERS, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  const buf = Buffer.from(await res.arrayBuffer())
  let json = null
  try { json = JSON.parse(buf.toString('utf8')) } catch {}
  return { status: res.status, buf, json }
}

// ── 最小 zip 读取（EOCD → central dir → inflate） ──
function readZip(buf) {
  let eocd = -1
  for (let i = buf.length - 22; i >= 0 && i > buf.length - 66000; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break }
  }
  if (eocd < 0) throw new Error('EOCD not found')
  const count = buf.readUInt16LE(eocd + 10)
  let ptr = buf.readUInt32LE(eocd + 16)
  const files = []
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(ptr) !== 0x02014b50) throw new Error('bad central entry')
    const method = buf.readUInt16LE(ptr + 10)
    const compSize = buf.readUInt32LE(ptr + 20)
    const nameLen = buf.readUInt16LE(ptr + 28)
    const extraLen = buf.readUInt16LE(ptr + 30)
    const cmtLen = buf.readUInt16LE(ptr + 32)
    const localOff = buf.readUInt32LE(ptr + 42)
    const name = buf.slice(ptr + 46, ptr + 46 + nameLen).toString('utf8')
    ptr += 46 + nameLen + extraLen + cmtLen
    const lNameLen = buf.readUInt16LE(localOff + 26)
    const lExtraLen = buf.readUInt16LE(localOff + 28)
    const dataOff = localOff + 30 + lNameLen + lExtraLen
    const comp = buf.slice(dataOff, dataOff + compSize)
    files.push({ name, method, data: method === 0 ? comp : inflateRawSync(comp) })
  }
  return files
}

// ── 最小 zip 写入（deflate） ──
const CRC_TABLE = (() => {
  const t = new Int32Array(256)
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c }
  return t
})()
function crc32(buf) { let c = 0xffffffff; for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0 }
function makeZip(files) {
  const chunks = []; const central = []; let offset = 0
  for (const [name, content] of files) {
    const nb = Buffer.from(name, 'utf8'); const cb = Buffer.from(content)
    const crc = crc32(cb); const comp = deflateRawSync(cb)
    const useComp = comp.length < cb.length
    const data = useComp ? comp : cb; const m = useComp ? 8 : 0
    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(0, 6)
    local.writeUInt16LE(m, 8); local.writeUInt16LE(0, 10); local.writeUInt16LE(0, 12)
    local.writeUInt32LE(crc, 14); local.writeUInt32LE(data.length, 18); local.writeUInt32LE(cb.length, 22)
    local.writeUInt16LE(nb.length, 26); local.writeUInt16LE(0, 28)
    chunks.push(local, nb, data)
    const cen = Buffer.alloc(46)
    cen.writeUInt32LE(0x02014b50, 0); cen.writeUInt16LE(20, 4); cen.writeUInt16LE(20, 6)
    cen.writeUInt16LE(m, 8); cen.writeUInt16LE(0, 10); cen.writeUInt16LE(0, 12); cen.writeUInt16LE(0, 14)
    cen.writeUInt32LE(crc, 16); cen.writeUInt32LE(data.length, 20); cen.writeUInt32LE(cb.length, 24)
    cen.writeUInt16LE(nb.length, 28); cen.writeUInt16LE(0, 30); cen.writeUInt16LE(0, 32)
    cen.writeUInt16LE(0, 34); cen.writeUInt16LE(0, 36); cen.writeUInt32LE(0, 38); cen.writeUInt32LE(offset, 42)
    central.push(Buffer.concat([cen, nb]))
    offset += 30 + nb.length + data.length
  }
  const cd = Buffer.concat(central); const eocd = Buffer.alloc(22)
  eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(files.length, 8); eocd.writeUInt16LE(files.length, 10)
  eocd.writeUInt32LE(cd.length, 12); eocd.writeUInt32LE(offset, 16)
  return Buffer.concat([...chunks, cd, eocd])
}

function esc(s) { return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;') }
function cell(col, row, v, numeric) {
  const ref = `${String.fromCharCode(65 + col)}${row}`
  return numeric
    ? `<c r="${ref}"><v>${v}</v></c>`
    : `<c r="${ref}" t="inlineStr"><is><t>${esc(v)}</t></is></c>`
}

log('\n===== R2c-I 混合导入（2 有效 + 1 无效，同批） =====')

// 0. 回读基线：当前记录总数
const q0 = await call('POST', `/form/data/${FORM_KEY}/query`, { pageNum: 1, pageSize: 1 })
const before = q0.json?.data?.total
log(`导入前记录总数: ${before}`)

// 1. 官方模板
const tpl = await fetch(`${BASE}/form/data/${FORM_KEY}/template`, { headers: HEADERS })
const tplBuf = Buffer.from(await tpl.arrayBuffer())
if (tpl.status !== 200 || tplBuf.length < 100) {
  log(`模板下载失败 status=${tpl.status}`)
  process.exit(1)
}
const files = readZip(tplBuf)
log(`模板解包: ${files.length} 个部件`)

// 2. 定位「模板」sheet（workbook.xml: name → r:id → rels → target）
const wb = files.find((f) => f.name === 'xl/workbook.xml').data.toString('utf8')
const rels = files.find((f) => f.name === 'xl/_rels/workbook.xml.rels').data.toString('utf8')
const sheetTag = wb.match(/<sheet[^>]*name="模板"[^>]*r:id="(rId\d+)"/)
if (!sheetTag) throw new Error('模板 sheet 未找到')
const relTag = rels.match(new RegExp(`<Relationship[^>]*Id="${sheetTag[1]}"[^>]*Target="([^"]+)"`))
const sheetPath = 'xl/' + relTag[1].replace(/^\//, '').replace(/^xl\//, '')
let sheetXml = files.find((f) => f.name === sheetPath).data.toString('utf8')
log(`模板 sheet 部件: ${sheetPath}`)

// 3. 追加数据行：2 有效 + 1 无效（dept 超长）
// POI 模板用共享字符串表：先把 cell 的 t="s"<v>idx</v> 解析为文本
let shared = []
const sstFile = files.find((f) => f.name === 'xl/sharedStrings.xml')
if (sstFile) {
  const sstXml = sstFile.data.toString('utf8')
  shared = [...sstXml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((m) =>
    [...m[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)].map((x) => x[1]).join(''))
}
function cellText(cellXml) {
  const t = cellXml.match(/t="(\w+)"/)?.[1]
  const v = cellXml.match(/<v>([^<]*)<\/v>/)?.[1]
  if (t === 's' && v != null) return shared[Number(v)] ?? ''
  if (t === 'inlineStr') return cellXml.match(/<t[^>]*>([\s\S]*?)<\/t>/)?.[1] ?? ''
  return v ?? ''
}
const rowTags = [...sheetXml.matchAll(/<row r="(\d+)"[^>]*>([\s\S]*?)<\/row>/g)]
if (rowTags.length < 2) throw new Error('模板行不足（需要表头行+映射行）')
const cellOfRow = (rowXml) => [...rowXml.matchAll(/<c[\s][^>]*>(?:(?!<\/c>)[\s\S])*<\/c>/g)].map((m) => cellText(m[0]))
// 模板布局：row1=表头（label），row2=映射行（mappingKey=物理列名）
const mappingRow = rowTags[1]
const mappingCells = cellOfRow(mappingRow[2])
log(`映射行 keys: ${JSON.stringify(mappingCells)}`)
const colOf = (key) => mappingCells.indexOf(key)
const cContent = colOf('content'), cSalary = colOf('salary'), cDept = colOf('dept')
if (cContent < 0 || cSalary < 0 || cDept < 0) throw new Error('映射列缺失: ' + JSON.stringify(mappingCells))
const startRow = Number(mappingRow[1]) + 1
const rowsXml = []
rowsXml.push(`<row r="${startRow}">${cell(cContent, startRow, 'R2c-I 有效行一')}${cell(cSalary, startRow, 11, true)}${cell(cDept, startRow, '研发部')}</row>`)
// 无效行：NUMBER 字段给非数值 → SUBMIT_FIELD_TYPE_MISMATCH（与单条提交同一校验链，确定性拒绝）
rowsXml.push(`<row r="${startRow + 1}">${cell(cContent, startRow + 1, 'R2c-I 无效行')}${cell(cSalary, startRow + 1, 'abc', false)}${cell(cDept, startRow + 1, '研发部')}</row>`)
rowsXml.push(`<row r="${startRow + 2}">${cell(cContent, startRow + 2, 'R2c-I 有效行二')}${cell(cSalary, startRow + 2, 33, true)}${cell(cDept, startRow + 2, '市场部')}</row>`)
sheetXml = sheetXml.replace('</sheetData>', rowsXml.join('') + '</sheetData>')

const outFiles = files.map((f) => [f.name, f.name === sheetPath ? sheetXml : f.data])
const xlsx = makeZip(outFiles)

// 4. 上传导入
const boundary = 'P61R2CI' + Date.now()
const head = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="p61-r2c-i.xlsx"\r\nContent-Type: application/octet-stream\r\n\r\n`)
const tail = Buffer.from(`\r\n--${boundary}--\r\n`)
const imp = await fetch(`${BASE}/form/data/${FORM_KEY}/import`, {
  method: 'POST',
  headers: { ...HEADERS, 'Content-Type': `multipart/form-data; boundary=${boundary}` },
  body: Buffer.concat([head, xlsx, tail]),
})
const impText = await imp.text()
let impJson = null
try { impJson = JSON.parse(impText) } catch {}
log(`导入响应 code=${impJson?.code} msg=${JSON.stringify(impJson?.msg)} data=${JSON.stringify(impJson?.data)}`)

// 5. 回读：回滚证明
const q1 = await call('POST', `/form/data/${FORM_KEY}/query`, { pageNum: 1, pageSize: 1 })
const after = q1.json?.data?.total
log(`导入后记录总数: ${after}（回滚则等于导入前 ${before}）`)

const d = impJson?.data ?? {}
const result = {
  rawCode: impJson?.code,
  totalRows: d.totalRows, successCount: d.successCount, errorCount: d.errorCount,
  errors: d.errors,
  atomicRolledBack: d.successCount === 0 && d.errorCount > 0 && Number(after) === Number(before),
  processingExplicitInServer: 'processing' in d,
  failMessageSafe: (d.errors ?? []).every((e) => !e.message?.includes('Exception') && !e.message?.includes('at java')),
  mixedSuccessUnreachable: d.successCount === 0,
  before, after,
}
writeFileSync('./.tmp/r2c-i-results.json', JSON.stringify(result, null, 2), 'utf8')
console.log(JSON.stringify(result, null, 2))
