/**
 * R9-I 最终快照综合盘点（工具生成，不手抄总数）。
 * 基线：stage A—E 收口的 5 枚举/127 常量、9 统一异常出口、4 安全出口、
 *       354 消息调用点、229 CJK 文件（见 stage-a..e 机器扫描记录）。
 * 输出：r9-i-inventory.json（原始清单 + 聚合 + 与基线对照）
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = 'E:/code/Smart-WorkFlow-Agent-Workspace/Smart-WorkFlow-aPaaS-server'
const walk = (dir, acc = []) => {
  for (const name of readdirSync(dir)) {
    if (name === 'target' || name === '.git' || name === 'node_modules') continue
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, acc)
    else acc.push(p)
  }
  return acc
}
const files = walk(ROOT).map((f) => f.replaceAll('\\', '/')).filter((f) => f.endsWith('.java') || f.endsWith('.properties') || f.endsWith('.yml'))
const norm = (f) => f.replaceAll('\\', '/')
const rel = (f) => relative(ROOT, f).replaceAll('\\', '/')
const read = (f) => { try { return readFileSync(f, 'utf8') } catch { return '' } }

// 1) 错误码枚举与常量
const enumFiles = files.filter((f) => /ErrorCode\.java$/.test(f) && /\/main\//.test(f))
const enums = enumFiles.map((f) => {
  const s = read(f)
  const consts = [...s.matchAll(/^\s{4}([A-Z][A-Z0-9_]+)\((\d+),\s*"([^"]+)"/gm)].map((m) => ({
    constName: m[1], code: Number(m[2]), errorKey: m[3],
  }))
  return { file: rel(f), count: consts.length, constants: consts }
})
const totalConstants = enums.reduce((a, e) => a + e.count, 0)

// 2) 统一异常出口（@ExceptionHandler）
const geh = read(join(ROOT, 'sw-framework/sw-common/src/main/java/com/sw/ck/common/exception/GlobalExceptionHandler.java'))
const exits = [...geh.matchAll(/@ExceptionHandler\(([^)]+)\)/g)].map((m) => m[1].trim())
const securityExits = ['RestAuthenticationEntryPoint.java', 'RestAccessDeniedHandler.java', 'JwtAuthenticationFilter.java', 'DebugAuthenticationFilter.java']
  .map((n) => {
    const f = files.find((x) => x.endsWith(n))
    return f ? { file: rel(f), failSites: (read(f).match(/R\.fail/g) || []).length } : { file: n, missing: true }
  })

// 3) 消息调用点（BaseException throw + R.fail + LocalizedMessages text/textArgs 调用）
const javaMain = files.filter((f) => f.endsWith('.java') && /\/main\//.test(f) && !/\/src\/test\//.test(f))
let throwSites = 0, failSites = 0, textCallSites = 0
const perModule = {}
for (const f of javaMain) {
  const s = read(f)
  const t = (s.match(/throw new BaseException/g) || []).length
  const r = (s.match(/R\.fail/g) || []).length
  const l = (s.match(/LocalizedMessages\.text/g) || []).length
  throwSites += t; failSites += r; textCallSites += l
  if (t + r + l > 0) {
    const mod = rel(f).split('/').slice(0, 2).join('/')
    perModule[mod] = (perModule[mod] || 0) + t + r + l
  }
}
const messageCallSites = throwSites + failSites + textCallSites

// 4) CJK 文件（main 源内含 CJK 字符的 .java/.properties/.yml）
const EXCLUDES = [
  { pattern: /db\/migration\//, reason: '种子/迁移用户文本：探索边界豁免（stage A 记录）' },
  { pattern: /application.*\.yml$/, reason: '配置注释与运维文本：非用户可见消息' },
  { pattern: /JobStartupRunner|BpmDeployRunner/, reason: '运行器 log.* 运维诊断层（R8b 已核查）' },
]
const cjkFiles = []
for (const f of javaMain.concat(files.filter((x) => x.endsWith('.properties')))) {
  const s = read(f)
  if (/[\u4e00-\u9fff]/.test(s)) {
    const r = rel(f)
    const ex = EXCLUDES.find((e) => e.pattern.test(r))
    cjkFiles.push({ file: r, excluded: !!ex, reason: ex?.reason })
  }
}

// 5) i18n 目录条目数（zh/en 对齐）
const zhProps = read(join(ROOT, 'sw-framework/sw-common/src/main/resources/i18n/messages_zh_CN.properties'))
const enProps = read(join(ROOT, 'sw-framework/sw-common/src/main/resources/i18n/messages_en_US.properties'))
const keys = (s) => s.split('\n').filter((l) => /^error\./.test(l.trim())).map((l) => l.split('=')[0].trim())
const zhKeys = keys(zhProps), enKeys = keys(enProps)
const zhOnly = zhKeys.filter((k) => !enKeys.includes(k))
const enOnly = enKeys.filter((k) => !zhKeys.includes(k))
const parameterized = zhKeys.filter((k) => {
  const line = zhProps.split('\n').find((l) => l.startsWith(k + '='))
  return line && /\{\d/.test(line)
})

const out = {
  generatedAt: new Date().toISOString(),
  manifest: 'r7-f-snapshot-manifest.json',
  enums: { files: enums, totalConstants, baseline: 127, baselineEnums: 5, delta: totalConstants - 127 },
  unifiedExceptionExits: { count: exits.length, baseline: 9, exits },
  securityExits: { count: securityExits.length, baseline: 4, detail: securityExits },
  messageCallSites: { throwSites, rFailSites: failSites, localizedCallSites: textCallSites, total: messageCallSites, baseline: 354 },
  cjkFiles: {
    total: cjkFiles.length, baseline: 229,
    excluded: cjkFiles.filter((c) => c.excluded),
    active: cjkFiles.filter((c) => !c.excluded).length,
  },
  catalog: { zhKeys: zhKeys.length, enKeys: enKeys.length, zhOnly, enOnly, parameterizedKeys: parameterized },
  perModule,
}
writeFileSync('r9-i-inventory.json', JSON.stringify(out, null, 2))
console.log(JSON.stringify({
  enums: enums.length, totalConstants, delta: out.enums.delta,
  exits: exits.length, securityExits: securityExits.length,
  messageCallSites, cjkFiles: out.cjkFiles.total, active: out.cjkFiles.active,
  zhKeys: zhKeys.length, enKeys: enKeys.length, zhOnly: zhOnly.length, enOnly: enOnly.length,
  parameterized: parameterized.length,
}, null, 2))