// R0 credential scan (wide criteria) + in-place redaction
// Usage: node r0-scan.js <scan|scrub> <roots...>
// Criteria: JWT (eyJ 3-segment), "Authorization: Bearer <v>", and any
// accessToken/access_token/refreshToken/refresh_token value (NO length floor).
// Placeholder = value containing REDACTED / placeholder marker / mask chars /
// <...> / ${...} / literal "null"/"undefined"/"false"/"true"/"xxx"/"none".
const fs = require('fs');
const path = require('path');

const mode = process.argv[2];
const roots = process.argv.slice(3);
if (!roots.length) { console.error('need mode + roots'); process.exit(2); }

const PLACEHOLDER_RE = /redacted|placeholder|\*{3,}|\u00d7{3,}|^<.*>$|\$\{|^(null|undefined|false|true|xxx+|none|n\/a)$/i;
function isPlaceholder(v) { return !v || PLACEHOLDER_RE.test(v); }

// [full, captureGroup] patterns
const PATTERNS = [
  { key: 'jwt', re: /eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{4,}\.[A-Za-z0-9_-]{4,}/g, group: 0 },
  { key: 'bearer', re: /(Authorization["']?\s*[:=]\s*["']?Bearer\s+)([^\s"'`,\\)\]}]+)/gi, group: 2 },
  { key: 'token_key', re: /((?:access|refresh)[_A-Za-z]*[Tt]oken|access_token|refresh_token)["']?\s*[:=]\s*["']?([^\s"'`,\\)\]}]+)/gi, group: 2 },
];

function listFiles(root) {
  const out = [];
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name === '__pycache__' || e.name.endsWith('.pyc')) continue;
      const p = path.join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else out.push(p);
    }
  })(root);
  return out;
}

let binarySkipped = 0;
const hits = new Map(); // relfile -> {key: count}
let totalByType = {};

for (const root of roots) {
  for (const f of listFiles(root)) {
    const buf = fs.readFileSync(f);
    let text;
    try { text = buf.toString('utf8'); } catch { binarySkipped++; continue; }
    // cheap binary detection: NUL byte
    if (buf.includes(0)) { binarySkipped++; continue; }
    let fileHits = null;
    for (const p of PATTERNS) {
      p.re.lastIndex = 0;
      let m;
      while ((m = p.re.exec(text)) !== null) {
        const v = m[p.group];
        if (isPlaceholder(v)) continue;
        const rel = f;
        if (!fileHits) fileHits = {};
        fileHits[p.key] = (fileHits[p.key] || 0) + 1;
        totalByType[p.key] = (totalByType[p.key] || 0) + 1;
        if (mode === 'scrub') {
          const redacted = `[REDACTED len=${v.length} sha256=${require('crypto').createHash('sha256').update(v).digest('hex').slice(0, 12)}]`;
          text = text.slice(0, m.index) + (p.group === 0 ? redacted : m[1] + redacted) + text.slice(m.index + m[0].length);
          p.re.lastIndex = m.index + redacted.length;
        }
      }
    }
    if (fileHits) { hits.set(f, fileHits); if (mode === 'scrub') fs.writeFileSync(f, text); }
  }
}

for (const [f, c] of hits) {
  console.log(`${path.relative(process.cwd(), f).split(path.sep).join('/')}\t` +
    Object.entries(c).map(([k, n]) => `${k}=${n}`).join(' '));
}
console.log(`---`);
console.log(`files_with_hits=${hits.size} jwt=${totalByType.jwt || 0} bearer=${totalByType.bearer || 0} token_key=${totalByType.token_key || 0} binary_skipped=${binarySkipped}`);
