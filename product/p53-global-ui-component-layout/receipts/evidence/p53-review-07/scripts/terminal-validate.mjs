import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const workspace = process.cwd()
const evidence = path.resolve(workspace, 'product/p53-global-ui-component-layout/receipts/evidence/p53-review-07')
const receipt = path.resolve(workspace, 'product/p53-global-ui-component-layout/receipts/receipt-p53-supplement-07.md')

const readJson = async (relativePath) => JSON.parse(await readFile(path.join(evidence, relativePath), 'utf8'))
const readExit = async (relativePath) => Number((await readFile(path.join(evidence, relativePath), 'utf8')).trim())
const checks = []
const check = (name, passed, details) => {
  checks.push({ name, passed: Boolean(passed), details })
  if (!passed) throw new Error(`${name}: ${details}`)
}

try {
  const input = await readJson('terminal-input.json')
  check('input-state', input.expectedFeatureStatus === 'VERIFYING', input.expectedFeatureStatus)
  check('final-receipt', (await readFile(receipt, 'utf8')).includes('P53 保持 `VERIFYING`'), receipt)

  const capture = await readJson('capture-manifest.json')
  check('formal-capture', capture.entryCount === 16 && capture.formalPngCount === 16, `${capture.entryCount}/${capture.formalPngCount}`)
  check('formal-source-fingerprint', capture.sourceFingerprint === (await readJson('capture-source-fingerprint-before.json')).treeFingerprint, capture.sourceFingerprint)
  check('source-fingerprint-stable', capture.sourceFingerprint === (await readJson('capture-source-fingerprint-after.json')).treeFingerprint, capture.sourceFingerprint)

  const render = await readJson('render-object-manifest.json')
  check('render-objects', render.nodes.length === 31 && render.nodes.every((node) => node.usesAlternateRenderPath === false), `${render.nodes.length} nodes`)

  const color = await readJson('color/color-comparison.json')
  const colorSummary = color.summary
  check('color-mapping', colorSummary.mapped === 1096 && colorSummary.applicable === 1096 && colorSummary.unmapped === 0 && colorSummary.unresolved.length === 0 && colorSummary.fail === 0, JSON.stringify(colorSummary))

  for (const family of ['family-a', 'family-b', 'family-c', 'family-d']) {
    const comparison = await readJson(`${family}/family-comparison.json`)
    check(family, comparison.allPassed === true && comparison.nodes.every((node) => node.passed === true), `${comparison.nodes.length} nodes`)
  }

  const gates = ['final-gates/typecheck.exit', 'final-gates/vitest.exit', 'final-gates/build.exit', 'final-gates/lint.exit', 'final-gates/formal-flow-validate.exit', 'render-object-validate.exit', 'color/color-inventory.exit', 'color/color-map.exit', 'color/color-validate.exit']
  for (const gate of gates) check(gate, await readExit(gate) === 0, await readFile(path.join(evidence, gate), 'utf8'))
  for (const family of ['family-a', 'family-b', 'family-c', 'family-d']) check(`${family}/compare-family.exit`, await readExit(`${family}/compare-family.exit`) === 0, await readFile(path.join(evidence, family, 'compare-family.exit'), 'utf8'))

  const result = {
    schema: 'p53-terminal-roundtrip.v1',
    feature: input.feature,
    reviewRound: input.reviewRound,
    featureStatus: input.expectedFeatureStatus,
    receipt,
    checks,
    passed: true,
    validatorExit: 0,
  }
  await writeFile(path.join(evidence, 'terminal-roundtrip.json'), `${JSON.stringify(result, null, 2)}\n`)
  console.log(JSON.stringify(result, null, 2))
} catch (error) {
  const result = { schema: 'p53-terminal-roundtrip.v1', passed: false, checks, error: error instanceof Error ? error.message : String(error), validatorExit: 1 }
  await writeFile(path.join(evidence, 'terminal-roundtrip.json'), `${JSON.stringify(result, null, 2)}\n`)
  console.error(JSON.stringify(result, null, 2))
  process.exitCode = 1
}
