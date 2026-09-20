import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const phase = process.argv[2]
if (!['before', 'after'].includes(phase)) throw new Error('Usage: node fingerprint.mjs before|after')

const workspaceRoot = process.cwd()
const webRoot = path.join(workspaceRoot, 'Smart-WorkFlow-aPaaS-Web')
const evidenceRoot = path.join(workspaceRoot, 'product', 'p53-global-ui-component-layout', 'receipts', 'evidence', 'p53-review-07')

async function walk(relativeRoot) {
  const absoluteRoot = path.join(webRoot, relativeRoot)
  const result = []
  async function visit(absoluteDir) {
    const children = await readdir(absoluteDir, { withFileTypes: true })
    for (const child of children) {
      const absolute = path.join(absoluteDir, child.name)
      if (child.isDirectory()) await visit(absolute)
      else if (child.isFile()) result.push(path.relative(webRoot, absolute).split(path.sep).join('/'))
    }
  }
  await visit(absoluteRoot)
  return result
}

const files = [
  ...(await walk('src')),
  ...(await walk('e2e/visual')),
  'package.json',
  'pnpm-lock.yaml',
  'playwright.config.ts',
].sort((a, b) => a.localeCompare(b, 'en'))

const entries = []
for (const relativePath of files) {
  const content = await readFile(path.join(webRoot, relativePath))
  entries.push({ path: relativePath, sha256: createHash('sha256').update(content).digest('hex') })
}

const canonical = entries.map(({ path: relativePath, sha256 }) => `${relativePath}\t${sha256}\n`).join('')
const treeFingerprint = createHash('sha256').update(canonical).digest('hex')
const webHead = execFileSync('git', ['-C', webRoot, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim()
const payload = {
  generatedAt: new Date().toISOString(),
  phase,
  webHead,
  algorithm: 'SHA-256 over sorted path + per-file SHA-256 manifest for src/, e2e/visual/, package.json, pnpm-lock.yaml, playwright.config.ts',
  fileCount: entries.length,
  treeFingerprint,
  files: entries,
}
const target = path.join(evidenceRoot, `capture-source-fingerprint-${phase}.json`)
await writeFile(target, `${JSON.stringify(payload, null, 2)}\n`)
console.log(JSON.stringify({ target, webHead, fileCount: entries.length, treeFingerprint }, null, 2))
