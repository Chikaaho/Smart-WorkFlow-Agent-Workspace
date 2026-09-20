const fs = require('fs')
const crypto = require('crypto')
const ref = JSON.parse(fs.readFileSync('E:/code/Smart-WorkFlow-Agent-Workspace/product/p53-global-ui-component-layout/receipts/evidence/p53-review-08/capture-source-fingerprint-after.json', 'utf8'))
const refMap = {}
for (const f of ref.files) if (f.path.startsWith('src/')) refMap[f.path] = f.sha256
let changed = 0, missing = 0, checked = 0
for (const [p, sha] of Object.entries(refMap)) {
  checked++
  const full = 'E:/code/Smart-WorkFlow-Agent-Workspace/Smart-WorkFlow-aPaaS-Web/' + p
  if (!fs.existsSync(full)) { missing++; console.log('MISSING ' + p); continue }
  const h = crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex')
  if (h !== sha) { changed++; console.log('CHANGED ' + p) }
}
console.log('src files checked=' + checked + ' changed=' + changed + ' missing=' + missing)
