import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const evidenceDir = path.join(root, 'product', 'p53-global-ui-component-layout', 'receipts', 'evidence', 'p53-review-03')
const manifest = JSON.parse(await readFile(path.join(evidenceDir, 'capture-manifest.json'), 'utf8'))
const rows = []
for (const entry of manifest.entries) {
  const facts = JSON.parse(await readFile(path.join(evidenceDir, entry.factsPath), 'utf8'))
  const url = facts.capture?.url ?? facts.page?.url ?? entry.url
  const identity = facts.identity.authenticationState
    ? `anonymous (${facts.identity.authenticationState})`
    : `${facts.identity.username} / ${facts.identity.displayName} / ${facts.identity.tenantContext}`
  const objectIds = JSON.stringify(entry.objectIds).replaceAll('|', '\\|')
  rows.push(`| ${entry.atom} | ${entry.id} | [${entry.relativePath}](${entry.relativePath}) · ${entry.width}×${entry.height} · \`${entry.sha256}\` | ${url} | ${entry.viewport.width}×${entry.viewport.height} | ${identity} | \`${objectIds}\` | [${entry.factsPath}](${entry.factsPath}) | [capture-network-index.json](capture-network-index.json) |`)
}
const content = [
  '# P53 review 03 evidence index',
  '',
  `Captured in visible headed Chromium with \`headless=false\`; manifest has ${manifest.entries.length} PNG entries. All entries use source tree fingerprint \`${manifest.sourceFingerprint}\`. Screenshot files and fact files are independently SHA-256 checked by \`sha256-check.json\`; alpha samples are recorded in \`alpha-verify.json\`.`,
  '',
  '| Atom | Capture | PNG · size · SHA-256 | URL | Viewport | Identity | Object IDs | Facts | Network index |',
  '|---|---|---|---|---|---|---|---|---|',
  ...rows,
  '',
  'The shared network index records the actual browser requests and HTTP statuses. It includes the approver candidate GET, graph PUT save, validation POST and real task detail GET.',
  '',
].join('\n')
await writeFile(path.join(evidenceDir, 'evidence-index.md'), content)
console.log(JSON.stringify({ output: 'evidence-index.md', entryCount: rows.length, sourceFingerprint: manifest.sourceFingerprint }, null, 2))
