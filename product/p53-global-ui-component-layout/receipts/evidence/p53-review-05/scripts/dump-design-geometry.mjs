/** 从锁定 Figma metadata XML 提取指定节点子树的帧/文本几何。用法：node dump-design-geometry.mjs <figmaNodeId> [maxChars] */
import { readFileSync } from 'node:fs'
const xml = readFileSync(
  'product/p53-global-ui-component-layout/receipts/evidence/p53-review-04/reference/figma-metadata-page-0-1.xml',
  'utf8',
)
const nodeId = process.argv[2] ?? '21:2'
const max = Number(process.argv[3] ?? 6000)
const marker = 'id="' + nodeId + '"'
const start = xml.indexOf(marker)
if (start < 0) {
  console.log('NOT FOUND ' + nodeId)
  process.exit(1)
}
const begin = xml.lastIndexOf('<', start)
console.log(xml.slice(begin, begin + max))
