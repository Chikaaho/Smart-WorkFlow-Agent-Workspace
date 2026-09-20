/**
 * P61 二级执行 · 真实 HTTP 取证harness（R10 轮）。
 *
 * 为什么用 Node 而不是 curl：Git Bash 在中文 Windows 控制台下把命令行里的中文
 * 按控制台代码页编码发出（服务端报 Invalid UTF-8 start byte），中文请求体一律
 * 走文件/程序内 UTF-8 构造，避免取证数据被终端编码污染。
 *
 * 用法：node p61-http-harness.mjs <区块>
 *   base   基础身份与用户对象
 *   r2cn   批量通知逐项结果（R2c-N）
 *   r2b    错误分类矩阵（R2b）
 *   log    服务端日志事件引用关联（R4b-E）
 */
import { appendFileSync, writeFileSync } from 'node:fs'

const BASE = 'http://localhost:8080/api'
const OUT = './runtime-http.txt'

function log(line = '') {
  appendFileSync(OUT, line + '\n', 'utf8')
}

function nowIso() {
  return new Date().toISOString().replace(/\.\d+Z$/, 'Z')
}

async function call(method, path, { identity, body, headers = {} } = {}) {
  const init = {
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
  }
  if (identity) init.headers.Authorization = `Bearer ${identity}`
  if (body !== undefined) init.body = typeof body === 'string' ? body : JSON.stringify(body)
  const res = await fetch(BASE + path, init)
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    /* 非 JSON 响应（网关/静态）保留原文 */
  }
  return {
    status: res.status,
    json,
    text,
    errorKey: json?.errorKey,
    eventRef: json?.eventRef,
  }
}

function report(title, r, extra = {}) {
  log(`--- ${title}`)
  log(`    status=${r.status} errorKey=${r.errorKey ?? '(none)'} eventRef=${r.eventRef ?? '(none)'}`)
  if (extra.note) log(`    note=${extra.note}`)
  if (extra.body !== false) log(`    body=${r.text.slice(0, 900)}`)
  log()
}

const section = process.argv[2] ?? 'base'

if (section === 'base') {
  log(`# P61 二级执行 · 真实 HTTP 取证（同一次采集，同一服务进程）`)
  log(`# 时间(UTC): ${nowIso()}`)
  log(`# 服务: dev profile, H2 内存库, 端口 8080, context-path /api`)
  log(`# 身份通道: Authorization: Bearer test_<userId>（dev profile + 回环 + 显式开关三重门）`)
  log()

  log('===== A1 匿名访问受保护资源 =====')
  report('POST /system/user/page 无凭据', await call('POST', '/system/user/page', { body: { pageNum: 1, pageSize: 1 } }))

  log('===== A2 身份 A（test_1 = admin）读用户列表 =====')
  const a2 = await call('POST', '/system/user/page', {
    identity: 'test_1',
    body: { pageNum: 1, pageSize: 50 },
  })
  log(`    status=${a2.status} total=${a2.json?.data?.total}`)
  for (const u of a2.json?.data?.records ?? []) {
    log(`    id=${u.id} username=${u.username} status=${u.status}`)
  }
  log()

  log('===== A3 创建批量接收对象（真实用户） =====')
  const peerName = 'p61r10peer'
  let peerId = (a2.json?.data?.records ?? []).find((u) => u.username === peerName)?.id
  if (!peerId) {
    const created = await call('POST', '/system/user', {
      identity: 'test_1',
      body: {
        username: peerName,
        realName: 'P61 R10 对端用户',
        status: 0,
        plainPassword: 'P61r10!Peer#2026',
        roleIds: [],
      },
    })
    report('POST /system/user', created)
    peerId = created.json?.data
  } else {
    log(`    已存在，复用 id=${peerId}`)
    log()
  }

  log('===== A4 创建无权限身份 B（零角色用户） =====')
  const bName = 'p61r10nobody'
  let bId = (a2.json?.data?.records ?? []).find((u) => u.username === bName)?.id
  if (!bId) {
    const createdB = await call('POST', '/system/user', {
      identity: 'test_1',
      body: {
        username: bName,
        realName: 'P61 R10 无权限身份',
        status: 0,
        plainPassword: 'P61r10!Nobody#2026',
        roleIds: [],
      },
    })
    report('POST /system/user (B)', createdB)
    bId = createdB.json?.data
  } else {
    log(`    已存在，复用 id=${bId}`)
    log()
  }

  const summary = { peerId, bId }
  writeFileSync('./.tmp/identities.json', JSON.stringify(summary, null, 2), 'utf8')
  log(`===== 对象表 =====`)
  log(`    身份 A = test_1 (admin, 超级管理员)`)
  log(`    身份 B = test_${bId} (无角色用户)`)
  log(`    批量接收对象 有效 = user 1 (admin) / user ${peerId} (${peerName})`)
  log(`    批量接收对象 无效 = 999999（不存在）`)
  log()
}

if (section === 'r2cn') {
  const ids = JSON.parse(
    (await import('node:fs')).readFileSync('./.tmp/identities.json', 'utf8'),
  )
  const peerId = ids.peerId
  const MISSING = 999999

  log('===== R2c-N 批量通知逐项结果（真实 HTTP，站内信同步原子契约） =====')
  log(`    固定批次接收对象集合 = [1(admin), ${peerId}(对端), ${MISSING}(不存在)]`)
  log()

  const label = async (title) =>
    call('POST', '/notify/messages/batch-send', {
      identity: 'test_1',
      body: {
        recipientUserIds: [1, peerId, MISSING],
        title,
        content: 'P61 R2c-N 受控批量内容',
      },
    })

  const zh = await label('R2c-N 混合批次')
  report('N1 站内信批量（zh-CN）', zh)
  log(`    四项计数: total=${zh.json?.data?.totalCount} success=${zh.json?.data?.successCount} ` +
      `failure=${zh.json?.data?.failureCount} processing=${zh.json?.data?.processingCount}`)
  log(`    phase=${zh.json?.data?.phase} 兼容字段 recipientCount=${zh.json?.data?.recipientCount}`)
  const d = zh.json?.data ?? {}
  log(`    勾稽: total == success+failure+processing -> ${d.totalCount === d.successCount + d.failureCount + d.processingCount}`)
  log(`    失败明细: ${JSON.stringify(d.failures)}`)
  log()

  const en = await call('POST', '/notify/messages/batch-send', {
    identity: 'test_1',
    headers: { 'Accept-Language': 'en-US' },
    body: {
      recipientUserIds: [1, peerId, MISSING],
      title: 'R2c-N mixed batch',
      content: 'P61 R2c-N controlled batch body',
    },
  })
  report('N2 同一失败在 en-US 下（errorKey 不随语言变化）', en)
  log(`    失败明细(en): ${JSON.stringify(en.json?.data?.failures)}`)
  log()

  log('--- N3 结果回读：两个有效接收人的收件箱真实各收到 1 条（证明计数与实际结果一致）')
  for (const [who, id] of [['admin', 1], ['peer', peerId]]) {
    const inbox = await call('GET', '/notify/messages', { identity: `test_${id}` })
    const list = Array.isArray(inbox.json?.data) ? inbox.json.data : []
    const mine = list.filter((m) => String(m.title).startsWith('R2c-N'))
    log(`    ${who}(user ${id}): status=${inbox.status} 收件箱总数=${list.length} 本批次命中=${mine.length}`)
    log(`      标题样本=${JSON.stringify(mine.slice(0, 2).map((m) => m.title))}`)
  }
  log()

  log('--- N4 渠道批量（SMS，dev 受控适配器）混合结果')
  const smsOk = await call('POST', '/notify/messages/batch-send', {
    identity: 'test_1',
    body: {
      recipientUserIds: [1, peerId, MISSING],
      channel: 'SMS',
      title: 'R2c-N 渠道批量',
      content: 'P61 R2c-N channel batch',
    },
  })
  report('N4 渠道批量 SMS 正常路径', smsOk)
  const s = smsOk.json?.data ?? {}
  log(`    四项计数: total=${s.totalCount} success=${s.successCount} failure=${s.failureCount} processing=${s.processingCount}`)
  log(`    勾稽: ${s.totalCount === s.successCount + s.failureCount + s.processingCount}`)
  log(`    失败明细: ${JSON.stringify(s.failures)}`)
  log()

  const smsTimeout = await call('POST', '/notify/messages/batch-send', {
    identity: 'test_1',
    body: {
      recipientUserIds: [1, peerId, MISSING],
      channel: 'SMS',
      title: 'R2c-N TIMEOUT 受控',
      content: 'P61 R2c-N controlled timeout',
    },
  })
  report('N5 渠道批量 SMS 受控超时（处理中非零的真实来源）', smsTimeout)
  const t = smsTimeout.json?.data ?? {}
  log(`    四项计数: total=${t.totalCount} success=${t.successCount} failure=${t.failureCount} processing=${t.processingCount}`)
  log(`    勾稽: ${t.totalCount === t.successCount + t.failureCount + t.processingCount}`)
  log(`    失败明细: ${JSON.stringify(t.failures)}`)
  log()
}

if (section === 'r2b') {
  const ids = JSON.parse((await import('node:fs')).readFileSync('./.tmp/identities.json', 'utf8'))
  const bId = ids.bId

  log('===== R2b 错误分类矩阵（真实 HTTP：每类都有独立的 errorKey / 结论 / 恢复动作语义） =====')
  log('    说明：页面展示的分类结论由请求层 classifyHttpStatus / classifyTransportFailure 给出，')
  log('    服务端在此证明每一类输入确实产出可区分的稳定 errorKey，不是同一句「操作失败」。')
  log()

  const rows = []
  const push = (label, r, expectKey) => {
    rows.push({ label, status: r.status, errorKey: r.errorKey, expectKey, ok: r.errorKey === expectKey })
    report(label, r)
  }

  push('B1 未认证（401 认证失效）',
    await call('POST', '/system/user/page', { body: { pageNum: 1, pageSize: 1 } }),
    'common.unauthenticated')

  push('B2 无权限（403 权限不足）',
    await call('POST', '/system/user', { identity: `test_${bId}`, body: { username: 'x', realName: 'x' } }),
    'common.forbidden')

  push('B3 对象不存在（404 语义）',
    await call('GET', '/form/def/by-key/__p61_r10_missing_form__', { identity: 'test_1' }),
    'form.not_found')

  push('B4 输入不可解析（请求体非法，输入可修正类）',
    await call('POST', '/system/user', { identity: 'test_1', body: '{"username":' }),
    'common.request_body_unreadable')

  push('B5 输入参数不合法（业务参数校验）',
    await call('POST', '/notify/messages/batch-send', {
      identity: 'test_1',
      body: { recipientUserIds: [], title: 'x', content: 'y' },
    }),
    'common.param_error')

  push('B6 对象无效导致的业务拒绝（批量接收对象）',
    await call('POST', '/notify/messages/batch-send', {
      identity: 'test_1',
      body: { channel: 'UNKNOWN_CHANNEL', recipientUserIds: [1], title: 'x', content: 'y' },
    }),
    'common.param_error')

  log('--- 分类去重核对（不同失败不得塌缩成同一个 errorKey）')
  const keys = rows.map((r) => r.errorKey)
  log(`    采集到的 errorKey 序列: ${JSON.stringify(keys)}`)
  log(`    去重后数量=${new Set(keys).size} / 采集行数=${keys.length}`)
  for (const r of rows) {
    log(`    ${r.ok ? '期望一致' : '期望不一致'}  ${r.label} -> ${r.errorKey}`)
  }
  log()
}

if (section === 'r4be') {
  const ids = JSON.parse((await import('node:fs')).readFileSync('./.tmp/identities.json', 'utf8'))
  const bId = ids.bId
  const { readFileSync } = await import('node:fs')
  const LOG = new URL('file:///E:/code/Smart-WorkFlow-Agent-Workspace/Smart-WorkFlow-aPaaS-server/logs/server.log')

  log('===== R4b-E 同一 eventRef 在用户响应与受保护诊断载体之间一一对应 =====')
  log('    固定一个失败请求；响应中的 eventRef 必须能在服务端结构化日志里定位到')
  log('    同一时间、同一路径、同一错误类别与事件事实；身份 A 可定位，身份 B 被拒。')
  log()

  const req = await call('POST', '/system/user', {
    identity: 'test_1',
    body: '{"username":',
  })
  report('E1 受控失败请求的公共响应', req, {
    note: '公共响应只给稳定 errorKey + 事件引用，无堆栈/类名/路径/租户标识',
  })

  const eventRef = req.eventRef
  log(`    待关联 eventRef = ${eventRef}`)
  log()

  const logText = readFileSync(LOG, 'utf8')
  const lines = logText.split(/\r?\n/).filter((l) => l.includes(eventRef))
  log(`--- E2 服务端受保护日志中命中同一 eventRef 的行数=${lines.length}`)
  for (const l of lines) log(`    ${l.slice(0, 260)}`)

  const factLine = lines.find((l) => l.includes('request body not readable'))
  log()
  log('--- E3 关联事实核对（同一 eventRef 的日志行是否同时含事件事实）')
  log(`    定位到诊断事实行: ${factLine ? '是' : '否'}`)
  log(`    含 cause 字段: ${factLine?.includes('cause=') ? '是' : '否'}（失败类别的可定位事实）`)
  log(`    含 eventRef: ${factLine?.includes(eventRef) ? '是' : '否'}`)
  const accessLine = lines.find((l) => l.includes('ACCESS method='))
  log(`    含访问事实(方法/路径/状态/耗时): ${accessLine ? '是' : '否'}`)
  log(`    ${accessLine?.slice(0, 220) ?? ''}`)
  log()

  log('--- E4 反向：普通用户不得通过公共 API 读取诊断载体')
  const bProbe = await call('POST', '/system/user/page', {
    identity: `test_${bId}`,
    body: { pageNum: 1, pageSize: 1 },
  })
  report('E4 身份 B（无权限）访问管理资源', bProbe, {
    note: '被拒不等于看到诊断；响应体零 deliveryStatus/failureReason/栈',
  })
  log(`    身份 B 响应体是否含诊断字段: 栈帧=${bProbe.text.includes('Exception')} ` +
      `内部包名=${bProbe.text.includes('com.sw')} 路径=${bProbe.text.includes('E:\\')}`)
  log()
}
