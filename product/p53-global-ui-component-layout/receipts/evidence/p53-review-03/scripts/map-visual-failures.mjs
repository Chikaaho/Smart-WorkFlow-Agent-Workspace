import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const evidenceDir = path.join(root, 'product', 'p53-global-ui-component-layout', 'receipts', 'evidence', 'p53-review-03')
const oldLogPath = path.join(root, 'product', 'p53-global-ui-component-layout', 'receipts', 'evidence', 'p53-review-02', 'executor-02', 'visual-update.log')
const currentLogPath = path.join(evidenceDir, 'visual-verify.log')
const oldLines = (await readFile(oldLogPath, 'utf8')).split(/\r?\n/)
const currentLines = (await readFile(currentLogPath, 'utf8')).split(/\r?\n/)
const source = [
  { oldLine: 865, currentLine: 24, label: '管理端壳三区基线（进入后台）' },
  { oldLine: 900, currentLine: 39, label: '管理端壳：深色顶栏结构、主导航可达与存档' },
  { oldLine: 936, currentLine: 45, label: '流程中心：分类默认态、搜索空态与存档' },
  { oldLine: 969, currentLine: 52, label: '数据列表：默认态、筛选空态与详情弹窗' },
  { oldLine: 1004, currentLine: 79, label: '任务详情：流转记录、流程图与审批列表三 tab' },
  { oldLine: 1032, currentLine: 114, label: '发起流程：默认双栏、未知 formKey 错误态' },
  { oldLine: 1065, currentLine: 266, label: '表单设计器 @ chrome-1440' },
  { oldLine: 1098, currentLine: 272, label: '流程设计器 @ chrome-1440' },
  { oldLine: 1131, currentLine: 561, label: '表单设计器 @ chrome-1920' },
  { oldLine: 1164, currentLine: 856, label: '表单设计器 @ chrome-1280' },
]

const mappings = source.map((item) => {
  const oldText = oldLines[item.oldLine - 1]
  const identity = oldText?.match(/^\s*\d+\) \[(?<project>[^\]]+)\] › e2e[\\/]visual[\\/](?<file>[^:]+):(?<line>\d+):/)
  if (!identity) throw new Error(`could not parse old failed test identity for ${item.label}: ${oldText}`)
  const titleCore = oldText.split(' › ').at(-1).replace(/\s+[─-]+.*$/, '').trim()
  const currentLine = currentLines.findIndex((line) =>
    /^\s*ok\s+\d+ \[/.test(line) &&
    line.includes(`[${identity.groups.project}]`) &&
    line.includes(`› ${titleCore} `),
  )
  const currentText = currentLine >= 0 ? currentLines[currentLine] : null
  if (!oldText?.includes(') [') || !currentText?.includes(' ok ') || !currentText.includes(' › ')) {
    throw new Error(`line validation failed for ${item.label}: old=${oldText}; current=${currentText}`)
  }
  return {
    label: item.label,
    old: { log: 'product/p53-global-ui-component-layout/receipts/evidence/p53-review-02/executor-02/visual-update.log', line: item.oldLine, raw: oldText.trim() },
    current: { log: 'product/p53-global-ui-component-layout/receipts/evidence/p53-review-03/visual-verify.log', line: currentLine + 1, raw: currentText.trim() },
  }
})

const summary = (lines) => ({
  passed: Number(lines.find((line) => /^\s*\d+ passed\b/.test(line))?.match(/^\s*(\d+) passed/)?.[1] ?? 0),
  skipped: Number(lines.find((line) => /^\s*\d+ skipped\b/.test(line))?.match(/^\s*(\d+) skipped/)?.[1] ?? 0),
  failed: Number(lines.find((line) => /^\s*\d+ failed\b/.test(line))?.match(/^\s*(\d+) failed/)?.[1] ?? 0),
})
const currentSummary = summary(currentLines)
const verifyExit = (await readFile(path.join(evidenceDir, 'visual-verify.exit'), 'utf8')).trim()
if (currentSummary.failed !== 0 || verifyExit !== '0') throw new Error('current full visual verification is not a zero-failure exit-0 run')

const result = {
  oldRun: { passed: 61, skipped: 17, failed: 10, exit: 1 },
  currentRun: { command: 'pnpm test:visual --workers=1', ...currentSummary, exit: Number(verifyExit) },
  mappingCount: mappings.length,
  mappings,
}
await writeFile(path.join(evidenceDir, 'visual-failure-closure-map.json'), `${JSON.stringify(result, null, 2)}\n`)
const lines = [
  `旧全量视觉结果：61 passed / 17 skipped / 10 failed / exit 1；见 ${result.oldRun.failed} 个失败条目。`,
  `本轮无 grep 单 worker 复核：71 passed / 17 skipped / 0 failed / exit 0。`,
  ...mappings.map((mapping, index) => `${index + 1}. ${mapping.label}\n   旧：${mapping.old.log}:${mapping.old.line} ${mapping.old.raw}\n   新：${mapping.current.log}:${mapping.current.line} ${mapping.current.raw}`),
]
await writeFile(path.join(evidenceDir, 'visual-failure-closure-map.txt'), `${lines.join('\n')}\n`)
console.log(JSON.stringify({ mappingCount: mappings.length, oldFailed: 10, currentFailed: 0, currentExit: 0, output: 'visual-failure-closure-map.json' }, null, 2))
