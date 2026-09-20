import { readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const ROOT = process.argv[2]
const file = join(ROOT, "knowledge/current-status.md")
let text = readFileSync(file, "utf8")
const log = []
function apply(label, re, repl, expected) {
  const n = (text.match(re) || []).length
  if (n !== expected) { log.push({ label, occurrences: n, expected, status: "ANCHOR_ERROR" }); return false }
  text = text.replace(re, repl)
  log.push({ label, occurrences: n, status: "REPLACED" })
  return true
}
apply("P60 header value -> 规划已确认", /COMPLETED（待规划确认，2026-09-15）/g, "COMPLETED（规划已确认，2026-09-15）", 1)
apply("P61 next-action bullet -> 已确认+集成顺序", /P61 阶段三终态同步回执已提交（`TERMINAL_SYNC_SUBMITTED`），待 Planner 全文复核（/g, "P61 已 `COMPLETED（规划已确认，2026-09-20）` 并正式核销、三份方向归档 `passed/`，独立提交先保留、待 P53 结束后统一合并（", 1)
writeFileSync(file, text)
writeFileSync(join(ROOT, "product/p61-user-facing-message-humanization/receipts/evidence/final-state-projection-p61-user-facing-message-humanization-01/fix-log.json"), JSON.stringify(log, null, 2))
console.log(JSON.stringify(log))
process.exit(log.every(l => l.status === "REPLACED") ? 0 : 1)

