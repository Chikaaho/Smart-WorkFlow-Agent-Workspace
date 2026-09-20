import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// 同步修正 02：把 P53 已核销（待规划确认）补入新会话启动提示词的 P 编号行。
const ROOT = process.argv[2];
const CS = "knowledge/current-status.md";

const edits = [
  [CS, "- P 编号：P21 已核销（2026-09-08）；", "- P 编号：P21 已核销（2026-09-08）；P53 已核销（待规划确认，2026-09-21）；"],
];

let failed = 0;
for (const e of edits) {
  const p = join(ROOT, e[0]);
  const text = readFileSync(p, "utf8");
  const n = text.split(e[1]).length - 1;
  if (n !== 1) { failed++; console.log("FAILED " + e[0] + " occurrences=" + n); continue; }
  writeFileSync(p, text.split(e[1]).join(e[2]), "utf8");
  console.log("OK " + e[0] + " anchor=" + e[1].slice(0, 60));
}
process.exit(failed === 0 ? 0 : 1);
