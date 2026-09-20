import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// P53 规划最终确认后，把《功能清单》当前焦点段的状态值由审计快照（待规划确认）机械落实为规划已确认值。
const ROOT = process.argv[2];
const rel = "Smart-WorkFlow-aPaaS-Server/功能清单.md";
const BT = String.fromCharCode(96);
const from = "COMPLETED（待规划确认）" + BT + " 后由 44→45";
const to = "COMPLETED（规划已确认，2026-09-21）" + BT + " 后由 44→45";

const p = join(ROOT, rel);
const text = readFileSync(p, "utf8");
const n = text.split(from).length - 1;
if (n !== 1) { console.log("FAILED occurrences=" + n); process.exit(1); }
writeFileSync(p, text.split(from).join(to), "utf8");
console.log("OK " + rel + " 当前焦点状态值已落实为规划已确认值");

