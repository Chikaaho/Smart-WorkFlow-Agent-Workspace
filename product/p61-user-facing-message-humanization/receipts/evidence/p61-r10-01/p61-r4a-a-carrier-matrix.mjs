/**
 * R4a-A 五类受众载体 × 身份 A/B 行为矩阵（真实 HTTP）。
 *
 * 断言：
 *  A 身份（superadmin test_1，或开放 API 应用凭据）能读到**脱敏/分类**的失败摘要（授权运维可定位）；
 *  B 身份（无角色普通用户 test_9101 / 无凭据调用方）被拒（403/401）或只见自己的安全摘要；
 *  各载体持久化的失败文本经 DiagnosticText/分类摘要出口，无栈帧/绝对路径/三方原文。
 *
 * 载体：1 任务日志(IoT 命令) 2 IoT 脚本/解析诊断 3 通知失败 4 SSO 审计 5 开放 API 回调
 * 输出：r4a-a-results.json + runtime-http.txt（追加）
 */
import { appendFileSync, writeFileSync } from 'node:fs'
import { createHmac, createHash, randomBytes } from 'node:crypto'

const BASE = 'http://localhost:8080/api'
const OUT = './runtime-http.txt'
const log = (s = '') => appendFileSync(OUT, s + '\n', 'utf8')

const NOISE = ['Caused by', 'at java.', 'at org.', 'java.lang.', 'C:\\Users', '/home/',
  'org.apache', 'UnknownHost', 'SQLException']

async function call(method, path, { identity = 'test_1', body, headers = {}, raw } = {}) {
  const h = { ...headers }
  if (identity) h.Authorization = `Bearer ${identity}`
  let payload
  if (raw) { payload = raw; h['Content-Type'] = 'application/json' }
  else if (body !== undefined) { payload = JSON.stringify(body); h['Content-Type'] = 'application/json' }
  const res = await fetch(BASE + path, { method, headers: h, body: payload })
  const text = await res.text()
  let json = null
  try { json = JSON.parse(text) } catch {}
  return { status: res.status, text, json }
}

const results = []
function record(id, r) {
  results.push(r)
  log(`--- ${id}`)
  log(`    ok=${r.ok} detail=${JSON.stringify(r.detail)}`)
  console.log(`${r.ok ? 'PASS' : 'FAIL'} ${id} ${JSON.stringify(r.detail)}`)
}
function scanNoise(text) { return NOISE.filter((n) => text.includes(n)) }

log('\n===== R4a-A 五类受众载体 A/B 矩阵 =====')

// ── 0. 身份确认 ──
const meA = await call('GET', '/auth/me', { identity: 'test_1' })
const meB = await call('GET', '/auth/me', { identity: 'test_9101' })
log(`A test_1: superAdmin=${meA.json?.data?.superAdmin} tenant=${meA.json?.data?.user?.tenantId}`)
log(`B test_9101: superAdmin=${meB.json?.data?.superAdmin} tenant=${meB.json?.data?.user?.tenantId} perms=${JSON.stringify(meB.json?.data?.permissions)}`)

// ── 载体 1：任务日志（IoT 设备命令，受控失败结果） ──
{
  await call('POST', '/iot/devices', { body: { productId: 'p61a', deviceName: 'd61a', deviceKey: 'p61a-d61a-key', name: 'R4a-A 诊断设备', deviceType: 'GATEWAY' } })
  const mk = await call('POST', '/iot/devices/p61a/d61a/commands', { body: { commandKey: 'reboot' } })
  const cmdId = mk.json?.data?.id ?? mk.json?.data?.commandId
  // 设备不在线，结果写回含栈/路径噪声 → 落库前必须被 DiagnosticText 脱敏
  const res = await call('POST', `/iot/devices/commands/${cmdId}/result`, {
    body: { status: 'FAILED', result: 'java.lang.RuntimeException: connect failed\n\tat java.base/java.net.Socket.connect\n\tat C:\\secret\\x.log line 9' },
  })
  const read = await call('GET', '/iot/devices/p61a/d61a/commands')
  const row = (read.json?.data ?? []).find?.((c) => String(c.id) === String(cmdId)) ?? {}
  const stored = JSON.stringify(row)
  const bRead = await call('GET', '/iot/devices/p61a/d61a/commands', { identity: 'test_9101' })
  record('C1 任务日志：A 读到脱敏失败结果 / B 被拒', {
    ok: res.status === 200 && !scanNoise(stored).length && bRead.status === 403
      && (stored.includes('connect failed') || stored.includes('FAILED')),
    detail: { resultStatus: res.status, noise: scanNoise(stored), bStatus: bRead.status, bCode: bRead.json?.code },
  })
}

// ── 载体 2：IoT 脚本/解析诊断 ──
{
  const mk = await call('POST', '/iot/scripts', {
    body: {
      code: 'p61a_diag_' + Date.now().toString(36), name: 'R4a-A 诊断脚本', language: 'JS',
      sourceCode: 'function handle(input) { throw new Error("diag boom at C:\\\\secret\\\\diag.js"); }',
    },
  })
  const id = mk.json?.data?.id
  await call('POST', `/iot/scripts/${id}/dry-run`, { body: {} })
  const read = await call('GET', `/iot/scripts/${id}/execs`)
  const stored = JSON.stringify(read.json?.data)
  const bRead = await call('GET', `/iot/scripts/${id}/execs`, { identity: 'test_9101' })
  record('C2 脚本诊断：A 读到脱敏 error / B 被拒', {
    ok: !scanNoise(stored).length && bRead.status === 403 && stored.includes('status'),
    detail: { noise: scanNoise(stored), bStatus: bRead.status, hasError: stored.includes('error') },
  })
}

// ── 载体 3：通知失败（EMAIL 渠道受控失败 + 记录回读） ──
{
  // 创建 tenant-0 无角色用户（既是通知受控对象，也是同租户 B 身份的补充证据）
  const mkUser = await call('POST', '/system/user', { body: { username: 'p61buser', realName: 'P61 B', plainPassword: 'Admin123!', status: 0 } })
  let bUserId = mkUser.json?.data
  if (!bUserId) {
    const pg = await call('POST', '/system/user/page', { body: { pageNum: 1, pageSize: 50 } })
    bUserId = (pg.json?.data?.records ?? []).find((u) => u.username === 'p61buser')?.id
  }
  log('B 用户(p61buser) id=' + bUserId)
  const mk = await call('POST', '/notify/messages/batch-send', {
    body: { channel: 'SMS', title: 'R4a-A 通知诊断', content: 'x', recipientUserIds: [bUserId, 99999] },
  })
  const failures = mk.json?.data?.failures ?? []
  const failScan = scanNoise(JSON.stringify(failures))
  const records = await call('GET', '/notify/records?deliveryStatus=FAILED&pageNum=1&pageSize=5')
  const bRecords = await call('GET', '/notify/records?pageNum=1&pageSize=5', { identity: 'test_9101' })
  const ownInbox = await call('GET', '/notify/messages', { identity: 'test_9101' })
  record('C3 通知失败：A 看安全逐项失败+记录 / B 记录视图被拒、收件箱仅自己', {
    ok: mk.status === 200 && !failScan.length && bRecords.status === 403 && ownInbox.status === 200,
    detail: {
      bUserId, failures: failures.map((f) => f.category ?? f.errorKey), noise: failScan,
      bRecordsStatus: bRecords.status, inboxStatus: ownInbox.status,
    },
  })
}

// ── 载体 4：SSO 审计（未认证回调 → REPLAY_REJECTED 受控审计行） ──
{
  await fetch(`${BASE}/auth/sso/WECOM/callback?code=x&state=p61a-bogus-state-${Date.now()}`, { redirect: 'manual' })
  const read = await call('GET', '/auth/sso/audit?page=0&size=5&eventType=REPLAY_REJECTED')
  const stored = JSON.stringify(read.json?.data)
  const bRead = await call('GET', '/auth/sso/audit', { identity: 'test_9101' })
  record('C4 SSO 审计：A 读到受控拒绝审计 / B 被拒（权限+租户双隔离）', {
    ok: read.status === 200 && !scanNoise(stored).length && bRead.status === 403 && stored.includes('REPLAY_REJECTED'),
    detail: { hasRow: stored.includes('REPLAY_REJECTED'), noise: scanNoise(stored), bStatus: bRead.status },
  })
}

// ── 载体 5：开放 API 回调（HMAC 应用凭据；无凭据调用方 fail-closed） ──
{
  const APP_ID = 'i5-openapi-t100'
  const SECRET_HASH = '804f665030d380832588ee486b27f601ddfb70e47db575ccc6215b8a2c928cc5'
  const signHeaders = (rawBody) => {
    const ts = String(Math.floor(Date.now() / 1000))
    const nonce = randomBytes(8).toString('hex')
    const bodyHash = createHash('sha256').update(rawBody).digest('hex')
    const sig = createHmac('sha256', SECRET_HASH).update(APP_ID + ts + nonce + bodyHash).digest('hex')
    return { 'X-App-Id': APP_ID, 'X-Timestamp': ts, 'X-Nonce': nonce, 'X-Signature': sig }
  }
  const body = JSON.stringify({ event: 'PROCESS_APPROVED', processInstanceId: 'p61a-diag-1' })
  const resend = await fetch(`${BASE}/openapi/v1/callbacks/resend`, {
    method: 'POST', headers: { ...signHeaders(body), 'Content-Type': 'application/json' }, body,
  })
  await new Promise((r) => setTimeout(r, 2500)) // 3 次尝试（异步投递）
  const q = await fetch(`${BASE}/openapi/v1/callbacks?status=FAILED`, { headers: signHeaders('') })
  const qText = await q.text()
  const noSig = await call('GET', '/openapi/v1/callbacks', { identity: 'test_9101' })
  const adminNoSig = await call('GET', '/openapi/v1/callbacks', { identity: 'test_1' })
  const noise = scanNoise(qText)
  record('C5 开放 API 回调：应用凭据读分类摘要 / 会话身份（含 A）与无凭据都被拒', {
    ok: q.status === 200 && qText.includes('FAILED') && !noise.length
      && noSig.json?.code !== 0 && adminNoSig.json?.code !== 0,
    detail: {
      resendStatus: resend.status, noSigCode: noSig.json?.code, adminNoSigCode: adminNoSig.json?.code,
      hasFailedRow: qText.includes('FAILED'), noise,
      summarySafe: qText.includes('category=') || qText.includes('回调'),
    },
  })
}

// ── B 身份/不存在身份兜底 ──
{
  const ghost = await call('GET', '/auth/me', { identity: 'test_99999' })
  record('B 补充：不存在用户 test_99999 → 401（fail-closed）', {
    ok: ghost.status === 401, detail: { status: ghost.status },
  })
}

const summary = {
  collectedAt: new Date().toISOString(),
  passCount: results.filter((r) => r.ok).length,
  failCount: results.filter((r) => !r.ok).length,
  results,
}
writeFileSync('./.tmp/r4a-a-results.json', JSON.stringify(summary, null, 2), 'utf8')
log(`\nR4a-A 矩阵汇总: pass=${summary.passCount} fail=${summary.failCount}`)
console.log(`\nSUMMARY pass=${summary.passCount} fail=${summary.failCount}`)
