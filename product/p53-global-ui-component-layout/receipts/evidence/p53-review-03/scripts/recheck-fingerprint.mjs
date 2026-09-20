import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const evidenceDir = path.join(process.cwd(), 'product', 'p53-global-ui-component-layout', 'receipts', 'evidence', 'p53-review-03')
const before = JSON.parse(await readFile(path.join(evidenceDir, 'capture-source-fingerprint-before.json'), 'utf8'))
const after = JSON.parse(await readFile(path.join(evidenceDir, 'capture-source-fingerprint-after.json'), 'utf8'))
const filesEqual = JSON.stringify(before.files) === JSON.stringify(after.files)
const same = before.fileCount === after.fileCount && before.treeFingerprint === after.treeFingerprint && filesEqual
const report = [
  'P53 source fingerprint post-capture recheck',
  `before files: ${before.fileCount}`,
  `after files: ${after.fileCount}`,
  `before tree: ${before.treeFingerprint}`,
  `after tree: ${after.treeFingerprint}`,
  `sorted path and per-file SHA-256 inventory equal: ${filesEqual}`,
  `exit: ${same ? 0 : 1}`,
].join('\n') + '\n'
await writeFile(path.join(evidenceDir, 'zero-source-change-recheck.txt'), report)
console.log(report)
if (!same) process.exitCode = 1
