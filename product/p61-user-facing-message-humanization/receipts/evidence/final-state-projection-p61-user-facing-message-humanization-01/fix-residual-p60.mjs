import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const ROOT = process.argv[2]
const file = join(ROOT, "knowledge/current-status.md")
const original = readFileSync(file, "utf8")
const TOKEN = "COMPLETED（待规划确认，2026-09-15）"
const REPLACED = "COMPLETED（规划已确认，2026-09-15）"
const lines = original.split("\n")
const log = []
const updated = lines.map((line, i) => {
  if (line.startsWith("| 变更类型记录")) { if (line.includes(TOKEN)) log.push({ line: i + 1, status: "HISTORICAL_KEPT" }); return line }
  if (!line.includes(TOKEN)) return line
  const count = line.split(TOKEN).length - 1
  log.push({ line: i + 1, status: "REPLACED", occurrences: count })
  return line.split(TOKEN).join(REPLACED)
})
writeFileSync(file, updated.join("\n"))
const remaining = updated.join("\n").split(TOKEN).length - 1
writeFileSync(join(ROOT, "product/p61-user-facing-message-humanization/receipts/evidence/final-state-projection-p61-user-facing-message-humanization-01/fix-log-line-scope.json"), JSON.stringify({ log, remainingInCurrentValues: remaining }, null, 2))
console.log(JSON.stringify({ log, remainingInCurrentValues: remaining }))
process.exit(remaining === 1 ? 0 : 1)

