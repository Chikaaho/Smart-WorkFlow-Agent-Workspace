const fs = require("fs");
const WS = "E:/code/Smart-WorkFlow-Agent-Workspace/";
const EV = "product/v0.1.0-oa-completion/receipts/evidence/i4-status-reconciliation-01/";
const current = [
  "knowledge/current-status.md", "knowledge/session-handoff.md", "knowledge/features/v0.1.0-oa-completion.md",
  "knowledge/feature-reconciliation-index.md", "knowledge/feature-reconciliation-products.md",
  "memory/README.md", "memory/state.md", "memory/features.md", "memory/handoff.md", "memory/decisions.md",
  "todo/v0.1.0-oa-plan.md", "todo/requirement-pool.md", "Smart-WorkFlow-aPaaS-server/功能清单.md"
];
const patterns = {
  "断链仓名": /Smart-WorkFlow-Server\/|Smart-WorkFlow-Web\//,
  "过期动作": /待 Planner 终态复核|终态同步合法状态|唯一执行入口 `ready\/direction-stage-i4-terminal-sync\.md`/,
  "过期版本作为当前口径": /v0\.3\.0-oa-completion（P60|0\.3\.0 OA 全功能收口|0\.3\.0 验收|0\.3\.0 P0 验收|0\.3\.0 关系/,
  "过期阶段": /I2—I6 未开始|I2— I6 未开始/,
  "过期基线": /1223 tests|1176 tests|126 files|V67（67/,
  "过期P59状态": /待阶段三终态复核|P59 终态复核/,
  "过期I4机器态(当前指针位)": /机器状态 `TERMINAL_SYNC_SUBMITTED` 待 Planner 终态复核/
};
const tokens = ["TERMINAL_SYNC_SUBMITTED", "v0.3.0-oa-completion", "product/v0.3.0-oa-completion", "P59 终态复核", "1223 tests"];
const isHistEvent = l => /^\s*-\s*\*\*20\d\d-\d\d-\d\d/.test(l) || /^\s*20\d\d-\d\d-\d\d.*阶段三/.test(l);
const out = [];
out.push("== I4 三层对账：当前入口残留扫描（修正后，2026-09-13）==");
out.push("");
out.push("-- A. 过期当前指针模式扫描 --");
let cur = 0, hist = 0;
for (const f of current) {
  let lines;
  try { lines = fs.readFileSync(WS + f, "utf8").split("\n"); }
  catch (e) { out.push("[MISSING] " + f); continue; }
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    for (const [name, pat] of Object.entries(patterns)) {
      if (pat.test(l)) {
        const h = isHistEvent(l);
        if (h) hist++; else cur++;
        out.push((h ? "历史事件行(允许)" : "当前指针(违规)") + "\t" + name + "\t" + f + ":" + (i + 1) + "\t" + l.trim().replace(/\s+/g, " ").slice(0, 120));
      }
    }
  }
}
if (cur === 0 && hist === 0) out.push("(无命中)");
out.push("");
out.push("当前指针违规命中数 = " + cur);
out.push("历史事件行命中数(按“历史回执原文保留”允许) = " + hist);
out.push("");
out.push("-- B. 关键令牌普查（区分历史事件行 / 其他，透明登记，不改写历史）--");
for (const tok of tokens) {
  out.push("--- " + tok + " ---");
  let n = 0;
  for (const f of current) {
    let lines;
    try { lines = fs.readFileSync(WS + f, "utf8").split("\n"); } catch (e) { continue; }
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes(tok)) {
        n++;
        out.push("  " + (isHistEvent(lines[i]) ? "[历史事件行]" : "[其他]") + " " + f + ":" + (i + 1) + " " + lines[i].trim().replace(/\s+/g, " ").slice(0, 120));
      }
    }
  }
  if (n === 0) out.push("  (无)");
}
const txt = out.join("\n");
fs.writeFileSync(WS + EV + "current-entry-residue-scan.txt", txt + "\n");
console.log(txt);
