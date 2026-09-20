import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// 投影 02：把规划已确认值与「P53/P61 已合入 develop 并推送」事实补齐（含规划侧先前写入摘要的措辞收敛）。
const ROOT = process.argv[2];
const LF = String.fromCharCode(10);
const LOG = [];

const CS = "knowledge/current-status.md";
const SH = "knowledge/session-handoff.md";
const IX = "knowledge/feature-reconciliation-index.md";
const FREC = "knowledge/features/p53-global-ui-component-layout.md";
const POOL = "todo/requirement-pool.md";
const ST = "memory/state.md";
const FT = "memory/features.md";
const HD = "memory/handoff.md";
const RD = "memory/README.md";

function replaceAll(rel, from, to) {
  const p = join(ROOT, rel);
  const text = readFileSync(p, "utf8");
  const n = text.split(from).length - 1;
  if (n < 1) { LOG.push("FAILED(0) " + rel + " :: " + from.slice(0, 60)); return; }
  writeFileSync(p, text.split(from).join(to), "utf8");
  LOG.push("OK-ALL(" + n + ") " + rel + " :: " + from.slice(0, 40));
}

function replaceOne(rel, from, to) {
  const p = join(ROOT, rel);
  const text = readFileSync(p, "utf8");
  const n = text.split(from).length - 1;
  if (n !== 1) { LOG.push("FAILED(" + n + ") " + rel + " :: " + from.slice(0, 60)); return; }
  writeFileSync(p, text.split(from).join(to), "utf8");
  LOG.push("OK " + rel + " :: " + from.slice(0, 40));
}

function replaceLine(rel, prefix, newLine) {
  const p = join(ROOT, rel);
  const lines = readFileSync(p, "utf8").split(LF);
  const hits = [];
  for (let i = 0; i < lines.length; i++) { if (lines[i].indexOf(prefix) === 0) { hits.push(i); } }
  if (hits.length !== 1) { LOG.push("FAILED-LINE(" + hits.length + ") " + rel + " :: " + prefix.slice(0, 50)); return; }
  lines[hits[0]] = newLine;
  writeFileSync(p, lines.join(LF), "utf8");
  LOG.push("OK-LINE " + rel + " :: " + prefix.slice(0, 40));
}

const VALUE_SWAPS = [
  ["COMPLETED（待规划确认，2026-09-21）", "COMPLETED（规划已确认，2026-09-21）"],
  ["已核销（待规划确认，2026-09-21）", "已核销（规划已确认，2026-09-21）"],
  ["已核销（待规划确认）", "已核销（规划已确认）"],
];
for (const rel of [CS, SH, FREC]) { for (const pair of VALUE_SWAPS) { replaceAll(rel, pair[0], pair[1]); } }

replaceOne(CS, "集成顺序=独立提交先保留（Server `742adb8`、Web `d110ed8`），待 P53 结束后统一合并；P53 终态同步待 Planner 全文复核，通过后按既定 P61→P53 集成顺序等待 Owner 授权统一合并并做受影响检查。", "集成顺序=独立提交 Server `742adb8`、Web `d110ed8`；P53 终态同步经规划最终复核 01 PASSED 确认后，已按既定 P61→P53 集成顺序合入两仓 develop 并推送（Web `fc37608`、Server `fa96290`）。");
replaceOne(CS, "（P53/P61 最终集成顺序记录：P61 独立提交先保留、P53 结束后统一合并，2026-09-20）", "（P53/P61 最终集成顺序记录：P61 独立提交先保留、P53 结束后统一合并，2026-09-20；2026-09-21 已按该顺序合入两仓 develop 并推送）");
replaceOne(CS, "（独立提交待 P53 结束后统一合并）", "（独立提交已随 P53 合入 develop 并推送）");
replaceOne(CS, "（P53 已功能级 `PASSED（2026-09-21）`、终态同步待 Planner 复核，不属于未完成边界）", "（P53 已经规划最终复核确认并核销，不属于未完成边界）");
replaceOne(CS, "集成顺序=独立提交先保留（Server `742adb8`、Web `d110ed8`），待 P53 结束后统一合并（记录 ", "集成顺序=独立提交 Server `742adb8`、Web `d110ed8`，已随 P53 于 2026-09-21 合入两仓 develop 并推送（记录 ");
replaceOne(SH, "独立提交 Server `742adb8` / Web `d110ed8` 先保留，待 P53 结束后统一合并**。", "独立提交 Server `742adb8` / Web `d110ed8` 已随 P53 合入 develop 并推送**。");
replaceOne(IX, "记录 `product/p53-global-ui-component-layout/receipts/planning-integration-order-p61-before-p53-merge-20260920.md`）", "记录 `product/p53-global-ui-component-layout/receipts/planning-integration-order-p61-before-p53-merge-20260920.md`；P53/P61 已于 2026-09-21 按该顺序合入两仓 develop 并推送）");
replaceOne(FREC, "（P61 独立提交 Server `742adb8` / Web `d110ed8` 先保留；P53 结束后统一合并；locale 冲突须同时保留 P53 结构/新增键与 P61 八值 8/8）", "（P61 独立提交 Server `742adb8` / Web `d110ed8`；已随 P53 于 2026-09-21 合入两仓 develop 并推送；locale 冲突按「P53 结构/新增键 + P61 八值 8/8」消解）");
replaceOne(ST, "；两项独立提交先保留，唯一下一动作=等待Owner授权后按P61→P53顺序统一集成并做受影响检查。", "；P53/P61 已按 Owner 授权与既定 P61→P53 顺序统一合入两仓 develop 并推送（Web `fc37608`、Server `fa96290`），受影响检查通过（Web 四连 exit0＋locale 八值8/8；Server compile exit0＋聚焦测试35/0/0/0）；唯一下一动作=无待执行方向，等待 Owner/Planner 下发下一轮任务。");
replaceOne(ST, "；独立提交先保留，P53结束后统一合并；不增加业务功能数。", "；独立提交已随 P53 合入两仓 develop 并推送（Web `fc37608`、Server `fa96290`）；不增加业务功能数。");
replaceOne(FT, "。独立提交Server `742adb8`、Web `d110ed8`先保留，待P53结束后统一合并；三份方向归档", "。独立提交Server `742adb8`、Web `d110ed8`已随P53合入两仓develop并推送（Web `fc37608`、Server `fa96290`）；三份方向归档");
replaceOne(HD, "两项独立提交继续保留，等待Owner授权后按P61→P53顺序统一集成（冲突时同时保留P53结构/新增键与P61八值8/8）。", "Owner 已授权完成统一集成：P61 独立提交与 P53 一并合入两仓 develop 并推送（Web `fc37608`、Server `fa96290`），冲突按「P53 结构/新增键 + P61 八值 8/8」消解（Web 合并后与 P53 分支树逐字节一致）。");
replaceOne(HD, "独立提交Server `742adb8`、Web `d110ed8`先保留，暂不合并。P53也已终态确认，现按既定顺序等待Owner Git授权统一集成。", "独立提交Server `742adb8`、Web `d110ed8`已随P53一同合入两仓develop及远端。");
replaceOne(RD, "。两项独立提交先保留，等待Owner授权后按P61→P53顺序统一集成。P60/0.1.0已发布且锁定）", "。两项独立提交已按Owner授权与P61→P53顺序合入两仓develop并推送（Web `fc37608`、Server `fa96290`）。P60/0.1.0已发布且锁定）");
replaceLine(POOL, "功能级`PASSED（2026-09-21）`，最终状态`COMPLETED（规划已确认，2026-09-21）`", "功能级`PASSED（2026-09-21）`、最终状态`COMPLETED（规划已确认，2026-09-21）`并已核销；主方向与阶段三终态同步方向均归档`product/p53-global-ui-component-layout/passed/`；规划最终复核01 PASSED；P53 与 P61 已按 Owner 授权与既定 P61→P53 顺序统一合入两仓 develop 并推送（Web `fc37608`、Server `fa96290`），受影响检查：Web 四连 exit0＋locale 八值8/8、Server compile exit0＋聚焦测试35/0/0/0。正式业务功能数45、清单✅46/🟦22/⬜22与ADV64不变，Server/Flyway 不因 P53 晋级；当前无待执行方向，等待 Owner/Planner 下发下一轮任务。");

const failed = LOG.filter(function (x) { return x.indexOf("FAILED") === 0; });
const memoryDir = join(ROOT, "memory");
const names = readdirSync(memoryDir).filter(function (n) { return n.slice(-3) === ".md"; }).sort();
let total = 0;
let max = 0;
for (const n of names) { const s = statSync(join(memoryDir, n)).size; total += s; if (s > max) { max = s; } }
console.log(LOG.join(LF));
console.log("total-edits=" + LOG.length + " failed=" + failed.length);
console.log("memory total=" + total + " max=" + max);
process.exit(failed.length === 0 ? 0 : 1);

