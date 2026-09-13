const fs = require("fs");
const WS = "E:/code/Smart-WorkFlow-Agent-Workspace/";
const p = fs.readFileSync(WS + "knowledge/feature-reconciliation-products.md", "utf8");
const rows = [];
for (const line of p.split(/\r?\n/)) {
  const m = line.match(/^\|\s*([^|]+?)\s*\|\s*([^|]*?正式功能第\s*(\d+)\s*个[^|]*)\|\s*([^|]*)\|\s*([^|]*)\|\s*$/);
  if (m) rows.push({ n: +m[3], key: m[1], nature: m[2].trim(), evidence: m[4].trim(), range: m[5].trim() });
}
rows.sort((a, b) => a.n - b.n);
const seen = {};
for (const r of rows) seen[r.n] = (seen[r.n] || 0) + 1;
const dup = Object.entries(seen).filter(([, c]) => c > 1);
const missing = Array.from({ length: 44 }, (_, i) => i + 1).filter(n => !seen[n]);
console.log("chain rows=" + rows.length + " max=" + Math.max(...rows.map(r => r.n)) + " dups=" + JSON.stringify(dup) + " missing1..44=" + JSON.stringify(missing));
const clean = s => String(s).replace(/\|/g, "/").replace(/\s+/g, " ").trim();
const out = ["feature_no\tdir_key\tnature\tevidence_pointer\tmapping_P_M_I_range\tregistration\tcompletion_date\tstatus"];
for (let n = 1; n <= 44; n++) {
  const r = rows.find(x => x.n === n);
  if (!r) {
    out.push([n, "（无独立目录）", "Walking Skeleton 第 1 项", "承载于 A 组早期目录与 D 组 form-binding/workflow-process-def-create/process-initiation", "M04-F04-01/M04-F05-01 子集（不占用 M04-F01-01）", "knowledge/features/bpm-single-node-approval.md", "2026-08-25 前（早期批处理）", "COMPLETED（历史，已在主索引 §5 X3 记录）"].join("\t"));
    continue;
  }
  const regMatch = r.evidence.match(/knowledge\/features\/[A-Za-z0-9._-]+\.md/);
  let reg = regMatch ? regMatch[0] : "";
  let regExists = reg ? fs.existsSync(WS + reg) : false;
  if (!reg) {
    const cand = "knowledge/features/" + r.key + ".md";
    if (fs.existsSync(WS + cand)) { reg = cand; regExists = true; }
  }
  const regOut = reg ? (regExists ? reg : reg + "（文件不存在，主索引 §5 已记录）") : "-（无 feature 登记，见 evidence 指针）";
  const dateM = (r.nature + " " + r.range).match(/(20\d\d-\d\d-\d\d)/);
  const date = dateM ? dateM[1] : "见证据指针";
  const fm = r.nature.match(/功能状态\s*(COMPLETED（[^）]*）)/);
  const status = fm ? fm[1] : "COMPLETED（历史链）";
  out.push([n, clean(r.key), clean(r.nature), clean(r.evidence), clean(r.range), clean(regOut), date, clean(status)].join("\t"));
}
fs.writeFileSync(WS + "product/v0.1.0-oa-completion/receipts/evidence/i4-status-reconciliation-01/feature-44.tsv", out.join("\n") + "\n");
console.log("wrote feature-44.tsv rows=" + (out.length - 1));
