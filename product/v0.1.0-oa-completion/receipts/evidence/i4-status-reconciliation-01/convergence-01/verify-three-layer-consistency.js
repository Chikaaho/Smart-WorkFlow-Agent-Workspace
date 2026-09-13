#!/usr/bin/env node
/*
 * I4 终态三层一致性验证器（TS4-R1c 修正版 v2）
 *
 * 覆盖范围：所有「当前状态段／当前状态表格行／当前待办段／当前焦点／唯一入口」。
 * 历史豁免：一行只有落在**显式历史容器**内才豁免（HTML 注释块、有日期的事件条目、
 *           数据化历史记录行、以「历史/已执行动作/变更类型记录」命名的章节、含明确历史措辞的行）。
 *           落在当前容器内的旧指针一律判失败，即复核 02 所指「不得与当前陈述混排」。
 *
 * 输出五个计数器：stale_entry / multiple_current_entry / registration_missing /
 *                current_state_conflict / broken_current_path
 *
 * 用法：
 *   node verify-three-layer-consistency.js --real [--features f.tsv] [--json out.json]
 *   node verify-three-layer-consistency.js --fixture <file> [--features f.tsv] [--json out.json]
 * 退出码：全部计数器为 0 → 0；否则 1（负向夹具必须非 0）
 */
const fs = require("fs");
const path = require("path");

const WS = "E:/code/Smart-WorkFlow-Agent-Workspace/";
const EXPECTED_ENTRY = "product/v0.1.0-oa-completion/receipts/planning-execution-prompt-terminal-sync-stage-i4-v0.0.3-oa-iteration-01.md";
const EXPECTED_ACTION_HINT = "关闭 TS4-R1a/b/c 并提交回执 03";

const TARGETS = [
  "knowledge/current-status.md",
  "knowledge/session-handoff.md",
  "knowledge/features/v0.1.0-oa-completion.md",
  "memory/README.md",
  "memory/state.md",
  "memory/features.md",
  "memory/handoff.md",
  "todo/v0.1.0-oa-plan.md",
  "todo/requirement-pool.md",
  "Smart-WorkFlow-aPaaS-server/功能清单.md",
  "product/v0.1.0-oa-completion/ready/direction-v0.1.0-oa-completion.md"
];

// ---------- 历史容器识别 ----------
const HIST_SECTION_KEYWORDS = ["已执行动作", "对账记录", "对账轮", "同步轮", "变更记录", "变更类型记录", "审计账本", "历史记录", "历史快照", "附录", "证据链"];
// 章节标题含关键字，或标题本身带日期（形如「（2026-09-02）」）＝ 时点化历史章节
const isHistHeading = line => {
  if (!/^#{1,6}\s/.test(line)) return false;
  if (/（20\d\d-\d\d-\d\d/.test(line)) return true;
  return HIST_SECTION_KEYWORDS.some(k => line.includes(k));
};
const DATED_BULLET_RE = /^\s*[-*]\s*\*\*20\d\d-\d\d-\d\d/;
const DATED_RECORD_RE = /^(?:\*\*)?20\d\d-\d\d-\d\d/;
const HIST_MARKER_RE = /（历史|历史点|历史记录|历史口径|历史文件|历史事件|（历史事件|已归档|不再适用|已被[^）]{0,24}取代|当时版本口径|只作历史|历史快照|作为历史|退化为历史/;

function buildHistoricalMask(lines) {
  const hist = new Array(lines.length).fill(false);
  let inComment = false, histSectionLevel = 0;
  lines.forEach((line, i) => {
    const t = line.trim();
    if (inComment) { hist[i] = true; if (t.includes("-->")) inComment = false; return; }
    const openIdx = line.indexOf("<!--");
    if (openIdx >= 0) { hist[i] = true; if (line.indexOf("-->", openIdx) < 0) inComment = true; return; }
    const h = line.match(/^(#+)\s/);
    if (h) { if (histSectionLevel && h[1].length <= histSectionLevel) histSectionLevel = 0; if (isHistHeading(line)) histSectionLevel = h[1].length; if (histSectionLevel) hist[i] = true; return; }
    if (histSectionLevel) { hist[i] = true; return; }
    if (DATED_BULLET_RE.test(line) || DATED_RECORD_RE.test(t)) { hist[i] = true; return; }
    if (HIST_MARKER_RE.test(line)) { hist[i] = true; return; }
  });
  return hist;
}

// ---------- 路径解析（含跨功能 receipts/ready/passed 同名解析） ----------
let BASENAME_INDEX = null;
function buildBasenameIndex() {
  if (BASENAME_INDEX) return BASENAME_INDEX;
  BASENAME_INDEX = new Set();
  const walk = d => {
    let ents = [];
    try { ents = fs.readdirSync(d, { withFileTypes: true }); } catch (e) { return; }
    for (const e of ents) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p); else BASENAME_INDEX.add(e.name);
    }
  };
  walk(WS + "product");
  return BASENAME_INDEX;
}
function pathExists(tok) {
  if (/^(knowledge|product|memory|todo|search_task|search_fallback)\//.test(tok)) return fs.existsSync(WS + tok);
  if (/^Smart-WorkFlow-aPaaS-(server|Web)\//.test(tok)) return fs.existsSync(WS + tok);
  if (/^(receipts|ready|passed|evidence)\//.test(tok)) {
    if (fs.existsSync(WS + "product/v0.1.0-oa-completion/" + tok)) return true;
    return buildBasenameIndex().has(path.basename(tok));   // 跨功能同名证据
  }
  return null; // 不判定的写法
}

const STALE_ENTRY_RE = /(唯一执行入口|当前唯一入口|当前唯一执行入口|当前执行入口)[^。；|\n]{0,40}`([^`]+)`/g;
// 入口身份归一：把 product/<feature>/receipts/x.md 与 receipts/x.md 视为同一文件
function canonicalEntry(tok) {
  const t = tok.replace(/^\.\//, "");
  if (/^product\//.test(t)) return t;
  if (/^receipts\//.test(t)) return "product/v0.1.0-oa-completion/" + t;
  return t;
}
const STALE_ACTION_RES = [
  /等待\s*Planner\s*终态复核/, /待\s*Planner\s*终态复核/, /等待Planner终态复核/, /等待终态复核/,
  /终态同步合法状态/,
  /确认\s*I4\s*`?COMPLETED`?\s*后再形成\s*I5/,
  /对账通过后确认\s*I4\s*`?COMPLETED`?\s*再形成\s*I5/
];
const PATH_TOKEN_RE = /`([A-Za-z0-9._\-\/]+\.(?:md|tsv|json|txt|js))`/g;
const FUTURE_ARTIFACT_RE = /完成后提交|待提交|计划提交|尚未生成|未来产出|并提交|将提交|本轮提交|提交回执|提交[^`\n]{0,14}回执|待本轮提交/;

function scanFile(absPath, displayName, checks) {
  const lines = fs.readFileSync(absPath, "utf8").split(/\r?\n/);
  const hist = buildHistoricalMask(lines);
  const hits = { stale_entry: [], stale_action: [], broken_current_path: [], current_state_conflict: [] };
  const declared = new Set();

  lines.forEach((line, idx) => {
    const isHist = hist[idx];                 // 该行是否落在显式历史容器内
    if (isHist) return;                       // 显式历史容器：豁免
    const loc = displayName + ":" + (idx + 1);
    const brief = line.trim().replace(/\s+/g, " ").slice(0, 110);
    let m;

    STALE_ENTRY_RE.lastIndex = 0;
    while ((m = STALE_ENTRY_RE.exec(line)) !== null) {
      // 入口身份按解析后的绝对路径归一，避免同一文件的全路径/相对路径写法被误判为多个入口
      const raw = m[2];
      const norm = canonicalEntry(raw);
      declared.add(norm);
      if (norm !== EXPECTED_ENTRY) hits.stale_entry.push(loc + " → 入口 `" + raw + "`（期望收敛提示）");
    }
    for (const re of STALE_ACTION_RES) {
      if (re.test(line)) { hits.stale_action.push(loc + " → " + brief); break; }
    }
    let prevText = "";
    for (let k = idx - 1; k >= 0; k--) { if (lines[k].trim()) { prevText = lines[k]; break; } }
    const isFutureRef = FUTURE_ARTIFACT_RE.test(line) || FUTURE_ARTIFACT_RE.test(prevText);
    if (!isFutureRef) {
      PATH_TOKEN_RE.lastIndex = 0;
      while ((m = PATH_TOKEN_RE.exec(line)) !== null) {
        const ok = pathExists(m[1]);
        if (ok === false) hits.broken_current_path.push(loc + " → `" + m[1] + "`");
      }
    }
    // 当前状态值的冲突检查
    // 规则①：P 编号池中的逐条历史说明行（首列为 Pxx）不计入「当前值」声明，避免把单条历史快照当当前值；
    //        其所属池的当前汇总由池抬头与 P60 行承担。
    // 规则②：行内明示「不写/不得写 P60 PASSED/COMPLETED」的禁止性表述不算冲突。
    const isPNumberRow = /^\|\s*P\d+\s*\|/.test(line);
    const tally = line.match(/✅\s*(\d+)\s*\/\s*🟦\s*(\d+)\s*\/\s*⬜\s*(\d+)/);
    if (!isPNumberRow && tally && !(tally[1] === "46" && tally[2] === "22" && tally[3] === "22"))
      hits.current_state_conflict.push(loc + " → 计数 " + tally[1] + "/" + tally[2] + "/" + tally[3] + " ≠ 46/22/22");
    const fn = line.match(/(?:正式)?功能数\s*(?:为|＝|=)?\s*\**(\d+)\**/);
    if (!isPNumberRow && fn && fn[1] !== "44") hits.current_state_conflict.push(loc + " → 功能数 " + fn[1] + " ≠ 44");
    if (/I3[^|。；\n]{0,16}待规划确认/.test(line)) hits.current_state_conflict.push(loc + " → I3 应为 COMPLETED（规划已确认，2026-09-12）");
    if (/I4[^|。；\n]{0,16}IN_PROGRESS/.test(line)) hits.current_state_conflict.push(loc + " → I4 应为 COMPLETED（待规划确认，2026-09-13）");
    if (/I4[^|。；\n]{0,16}待规划确认，2026-09-12/.test(line)) hits.current_state_conflict.push(loc + " → I4 日期应为 2026-09-13");
    const negP60 = /不[写得][^|。；\n]{0,10}P60|P60[^|。；\n]{0,10}不[写得]/.test(line);
    if (!negP60 && /P60[^|。；\n]{0,12}(COMPLETED|已完成)/.test(line)) hits.current_state_conflict.push(loc + " → P60 应为 IN_PROGRESS");
    return;
  });

  return { hits, declared };
}

function registrationCheck(featuresTsv) {
  const out = [];
  if (!featuresTsv || !fs.existsSync(featuresTsv)) return out;
  for (const l of fs.readFileSync(featuresTsv, "utf8").split("\n").filter(Boolean).slice(1)) {
    const f = l.split("\t");
    const reg = f[5];
    if (!/^knowledge\/features\//.test(reg || "") || !fs.existsSync(WS + reg)) out.push("feature_no " + f[0] + " (" + f[1] + ") → 登记 `" + reg + "` 不存在");
  }
  return out;
}

// ---------- args ----------
const args = process.argv.slice(2);
const isFixture = args.includes("--fixture");
const fixtureFile = isFixture ? args[args.indexOf("--fixture") + 1] : null;
const featIdx = args.indexOf("--features");
const featuresTsv = featIdx >= 0 ? args[featIdx + 1] : null;
const jsonIdx = args.indexOf("--json");
const jsonOut = jsonIdx >= 0 ? args[jsonIdx + 1] : null;

const all = { stale_entry: [], stale_action: [], broken_current_path: [], current_state_conflict: [] };
const declared = new Set();

if (isFixture) {
  const r = scanFile(fixtureFile, path.basename(fixtureFile));
  for (const k of Object.keys(all)) all[k].push(...r.hits[k]);
  for (const p of r.declared) declared.add(p);
} else {
  for (const t of TARGETS) {
    const abs = WS + t;
    if (!fs.existsSync(abs)) { all.broken_current_path.push(t + " → 目标文件不存在"); continue; }
    const r = scanFile(abs, t);
    for (const k of Object.keys(all)) all[k].push(...r.hits[k]);
    for (const p of r.declared) declared.add(p);
  }
}

const multiple = [...declared].filter(p => p !== EXPECTED_ENTRY)
  .map(p => "当前入口集合含非期望项 `" + p + "`");
const regMissing = registrationCheck(featuresTsv);

const result = {
  mode: isFixture ? "fixture:" + path.basename(fixtureFile) : "real",
  expected_entry: EXPECTED_ENTRY,
  expected_action_hint: EXPECTED_ACTION_HINT,
  declared_current_entries: [...declared],  stale_entry: all.stale_entry,
  stale_action: all.stale_action,
  broken_current_path: all.broken_current_path,
  current_state_conflict: all.current_state_conflict,
  multiple_current_entry: multiple,
  registration_missing: regMissing,
  counters: {
    stale_entry: all.stale_entry.length,
    stale_action: all.stale_action.length,
    multiple_current_entry: multiple.length,
    registration_missing: regMissing.length,
    current_state_conflict: all.current_state_conflict.length,
    broken_current_path: all.broken_current_path.length
  }
};
result.total_failures = Object.values(result.counters).reduce((a, b) => a + b, 0);
const outText = JSON.stringify(result, null, 2);
if (jsonOut) fs.writeFileSync(jsonOut, outText + "\n");
process.stdout.write(outText + "\n");
process.exit(result.total_failures === 0 ? 0 : 1);
