import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// 同步修正 01：修正 apply-sync 产生的重复括号，并把 P60 段落中的历史计数标注为 P60 时点事实。
const ROOT = process.argv[2];
const CS = "knowledge/current-status.md";

const edits = [
  [CS, "，待 Planner 全文复核））；P61 阶段三终态同步已确认", "，待 Planner 全文复核）；P61 阶段三终态同步已确认"],
  [CS, "功能数 44、清单 ✅46/🟦22/⬜22、ADV64 与 P 编号全部保持现状。", "P60 时点功能数 44、清单 ✅46/🟦22/⬜22、ADV64 与 P 编号全部保持现状。"],
];

let failed = 0;
for (const e of edits) {
  const p = join(ROOT, e[0]);
  const text = readFileSync(p, "utf8");
  const n = text.split(e[1]).length - 1;
  if (n !== 1) { failed++; console.log("FAILED " + e[0] + " occurrences=" + n + " anchor=" + e[1].slice(0, 60)); continue; }
  writeFileSync(p, text.split(e[1]).join(e[2]), "utf8");
  console.log("OK " + e[0] + " anchor=" + e[1].slice(0, 60));
}
process.exit(failed === 0 ? 0 : 1);
