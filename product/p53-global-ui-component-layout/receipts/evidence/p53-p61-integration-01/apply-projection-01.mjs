import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// P53 规划最终确认 + P53/P61 统一集成后的状态投影（knowledge/memory/todo 机械落实，无业务代码）。
const ROOT = process.argv[2];
const LF = String.fromCharCode(10);
const LOG = [];

const CS = "knowledge/current-status.md";
const SH = "knowledge/session-handoff.md";
const IX = "knowledge/feature-reconciliation-index.md";
const FREC = "knowledge/features/p53-global-ui-component-layout.md";
const POOL = "todo/requirement-pool.md";

const GLOBAL = [
  ["COMPLETED（待规划确认，2026-09-21）", "COMPLETED（规划已确认，2026-09-21）"],
  ["已核销（待规划确认，2026-09-21）", "已核销（规划已确认，2026-09-21）"],
  ["已核销（待规划确认）", "已核销（规划已确认）"],
];

const EDITS = [
  [CS, "已提交（`TERMINAL_SYNC_SUBMITTED`，待 Planner 全文复核）：本文件按终态同步方向", "已提交（`TERMINAL_SYNC_SUBMITTED`）并经规划最终复核 01 `planning-final-review-terminal-sync-p53-global-ui-component-layout-01-passed.md` **PASSED**（2026-09-21）确认：本文件按终态同步方向"],
  [CS, "，阶段三方向仍在 `ready/` 待 Planner 归档；当前无活动正式功能。", "，主方向与阶段三终态同步方向均已归档 `passed/`；当前无活动正式功能；P53/P61 已按 Owner 授权与既定 P61→P53 顺序统一合入两仓 develop 并推送（Web develop `fc37608`、Server develop `fa96290`，验收快照见 `product/p53-global-ui-component-layout/receipts/p53-p61-integration-and-projection-01.md`）。"],
  [CS, "，阶段三终态同步回执已提交待 Planner 全文复核；", "，阶段三终态同步回执经规划最终复核 01 PASSED 确认，并已按 Owner 授权合入两仓 develop（Web `fc37608`、Server `fa96290`）；"],
  [CS, "，机器 `TERMINAL_SYNC_SUBMITTED`，待 Planner 全文复核）", "，机器 `TERMINAL_SYNC_SUBMITTED`；规划最终复核 01 PASSED，已随 P61 合入两仓 develop 并推送）"],
  [CS, "仍在 `ready/`（待 Planner 归档），回执 `receipts/terminal-sync-p53-global-ui-component-layout-01.md`（`TERMINAL_SYNC_SUBMITTED`）待 Planner 全文复核；任务登记", "已归档 `passed/direction-p53-global-ui-component-layout-terminal-sync.md`，回执 `receipts/terminal-sync-p53-global-ui-component-layout-01.md`（`TERMINAL_SYNC_SUBMITTED`）经规划最终复核 01 PASSED 确认；P53/P61 已合入两仓 develop 并推送（Web `fc37608`、Server `fa96290`）；任务登记"],
  [CS, "（主方向已归档 `passed/`，阶段三方向在 `ready/` 待 Planner 归档，回执 `receipts/terminal-sync-p53-global-ui-component-layout-01.md`）", "（主方向与阶段三方向均已归档 `passed/`，回执 `receipts/terminal-sync-p53-global-ui-component-layout-01.md`，规划最终复核 01 PASSED）"],
  [CS, "- 上轮完成：**P53 阶段三终态同步**（", "- 上轮完成：**P53 规划最终确认与 P61/P53 统一集成推送**（Web 独立提交 `29d90e8` + 合并 `fc37608`；Server `42cbc86`/`6698b8c` + 合并 `fa96290`；规划最终复核 01 `planning-final-review-terminal-sync-p53-global-ui-component-layout-01-passed.md` **PASSED**）：P53 写为 `COMPLETED（规划已确认，2026-09-21）`、已核销、第 45 个正式功能；Web 四连全绿（134 files + 1 skipped、1217 passed + 3 skipped、lint 0 error/458 warning）＋ locale 八值 8/8；Server compile exit 0 ＋ 契约/验证码聚焦测试 35/0/0/0；两仓 develop 与远端回读一致" + LF + "- 更早上轮完成：**P53 阶段三终态同步**（"],
[CS, "| 变更类型记录（历史事件，非当前值） | ", "| 变更类型记录（历史事件，非当前值） | 2026-09-21 P53 规划最终确认与 P53/P61 统一集成（Owner 授权，回执 `product/p53-global-ui-component-layout/receipts/p53-p61-integration-and-projection-01.md`）：Web 提交 `29d90e8`、Server 提交 `42cbc86`/`6698b8c` 推送后，按既定 P61→P53 顺序把 P61 Web `d110ed8`、Server `742adb8` 与 P53 一并合入两仓 develop（Web 合并 `fc37608`、Server 合并 `fa96290`）并推送；Web 合并结果与 P53 分支树逐字节一致、locale 八值 8/8、四连全绿；Server compile exit 0 ＋ 聚焦测试 35/0/0/0；功能数 45、90 明细 ✅46/🟦22/⬜22、ADV64 与开放 P 编号零变化；P53 写为 `COMPLETED（规划已确认，2026-09-21）`。"],
  [SH, "已提交（`TERMINAL_SYNC_SUBMITTED`）待 Planner 全文复核（阶段三方向 `product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md`，主方向已归档 `passed/`）", "已提交（`TERMINAL_SYNC_SUBMITTED`）并经规划最终复核 01 PASSED 确认（主方向与阶段三方向均已归档 `passed/`）；P53/P61 已按 Owner 授权合入两仓 develop 并推送（Web `fc37608`、Server `fa96290`）"],
  [SH, "，阶段三终态同步待 Planner 全文复核；", "，阶段三终态同步经规划最终复核 01 PASSED 确认，并已随 P61 合入两仓 develop 并推送；"],
  [SH, "，阶段三终态同步已提交待 Planner 全文复核**；**P61 已最终确认 ", "，阶段三终态同步经规划最终复核 01 PASSED 确认并已合入两仓 develop 并推送**；**P61 已最终确认 "],
  [SH, "（三份方向归档 `passed/`；独立提交先保留，待 P53 结束后统一合并；P61 不再列为活动功能）", "（三份方向归档 `passed/`；独立提交 Server `742adb8` / Web `d110ed8` 已随 P53 合入 develop；P61 不再列为活动功能）"],
  [SH, "- 当前唯一规划入口：P53 阶段三终态同步（方向 `product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md`；回执 `product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md` 已提交，待 Planner 全文复核）；P60/I6 已无活动入口", "- 当前无待执行方向：P53 已经规划最终复核 01 PASSED 确认，主方向与阶段三方向均已归档 `passed/`，并随 P61 合入两仓 develop 并推送（Web `fc37608`、Server `fa96290`）；P60/I6 已无活动入口"],
  [SH, "（`TERMINAL_SYNC_SUBMITTED`）待全文复核；任务登记 ", "（`TERMINAL_SYNC_SUBMITTED`）经规划最终复核 01 PASSED 确认，并已随 P61 合入两仓 develop 并推送；任务登记 "],
  [IX, "核销（待规划确认））", "核销（规划已确认，2026-09-21））"],
  [IX, "下一动作=Planner 全文复核 P53 阶段三终态同步回执（方向 `product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md`，回执 `product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md`）", "下一动作=无待执行方向：P53 已经规划最终复核 01 PASSED 确认，方向均已归档 `passed/`，并随 P61 合入两仓 develop（Web `fc37608`、Server `fa96290`）"],
  [FREC, "阶段三终态同步回执已提交，待 Planner 全文复核） |", "规划最终复核 01 PASSED；P53/P61 已合入两仓 develop 并推送） |"],
  [FREC, "| 阶段三终态同步方向（仍在 `ready/`，待 Planner 归档） | ", "| 阶段三终态同步方向（已归档 `passed/`） | "],
  [FREC, "（`TERMINAL_SYNC_SUBMITTED`，待 Planner 全文复核） |", "（`TERMINAL_SYNC_SUBMITTED`，经规划最终复核 01 PASSED 确认） |"],
  [FREC, "- 终态同步：回执 `receipts/terminal-sync-p53-global-ui-component-layout-01.md`（`TERMINAL_SYNC_SUBMITTED`）待 Planner 全文复核；复核通过前不自行写 `COMPLETED（规划已确认）`，不移动阶段三方向。", "- 终态同步：回执 `receipts/terminal-sync-p53-global-ui-component-layout-01.md`（`TERMINAL_SYNC_SUBMITTED`）经规划最终复核 01 PASSED 确认；主方向与阶段三方向均已归档 `passed/`。"],
  [FREC, "- 下一动作：Planner 全文复核 P53 终态同步回执；通过后按既定 P61→P53 集成顺序等待 Owner 授权统一合并并做受影响检查。", "- 集成（2026-09-21，Owner 授权）：P53 与 P61 已按既定 P61→P53 顺序合入两仓 develop 并推送（Web 合并 `fc37608` = P61 `d110ed8` + P53 `29d90e8`；Server 合并 `fa96290` = P61 `742adb8` + P53 `42cbc86`/`6698b8c`）；受影响检查见 `receipts/p53-p61-integration-and-projection-01.md`。" + LF + "- 下一动作：无待执行方向，等待 Owner/Planner 下发下一轮任务。"],
  ["memory/README.md", "，终态同步回执待Planner全文复核；", "，规划最终复核01 PASSED，P53/P61 已合入两仓 develop 并推送；"],
  ["memory/state.md", "当前无活动正式功能，下一动作=Planner全文复核P53终态同步回执。", "当前无活动正式功能、无待执行方向；P53/P61 已按 Owner 授权合入两仓 develop 并推送（Web `fc37608`、Server `fa96290`）。"],
  ["memory/state.md", "（回执`receipts/terminal-sync-p53-global-ui-component-layout-01.md`待Planner复核），主方向已归档`passed/`。", "（回执`receipts/terminal-sync-p53-global-ui-component-layout-01.md`经规划最终复核01 PASSED），主方向与阶段三方向均已归档`passed/`；P53/P61 已合入两仓 develop 并推送。"],
  ["memory/features.md", "、已核销（规划已确认）、正式业务功能数45；", "、已核销（规划已确认）、规划最终复核01 PASSED、正式业务功能数45（P53/P61 已合入两仓 develop 并推送）；"],
  ["memory/features.md", "（主方向已归档`passed/`，回执待Planner复核）。", "（主方向与阶段三方向均已归档`passed/`，规划最终复核01 PASSED；P53/P61 已合入 develop 并推送）。"],
  ["memory/handoff.md", "，当前等待规划最终复核。", "；规划最终复核 01 PASSED，并已随 P61 合入两仓 develop 及远端。"],
  ["memory/handoff.md", "P53与P61的功能实现和验收均已收敛，P53阶段三机械同步已提交；当前只等待规划最终复核，随后按Owner授权统一集成（冲突时同时保留P53结构/新增键与P61八值8/8）。", "P53与P61的功能实现和验收均已收敛；Owner 已授权完成统一集成：P61 独立提交与 P53 一并合入两仓 develop 并推送（Web `fc37608`、Server `fa96290`），冲突按「P53 结构/新增键 + P61 八值 8/8」消解（Web 合并后与 P53 分支树逐字节一致）。"],
  ["memory/handoff.md", "（主方向已归档`passed/`；回执`receipts/terminal-sync-p53-global-ui-component-layout-01.md`待Planner复核）。", "（主方向与阶段三方向均已归档`passed/`；回执`receipts/terminal-sync-p53-global-ui-component-layout-01.md`经规划最终复核01 PASSED；已合入两仓 develop）。"],
  ["memory/handoff.md", "先保留，暂不合并。P53终态复核通过后再按既定顺序等待Owner Git授权统一集成。", "先保留，并已随 P53 一同合入两仓 develop 及远端。"],
  [POOL, "核心（[方向](../product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md)、回执[terminal-sync-p53-global-ui-component-layout-01.md](../product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md)，`TERMINAL_SYNC_SUBMITTED`），等待Planner全文复核；正式业务功能数44→45。", "核心：P53 已经规划最终复核01 PASSED 确认，并随 P61 合入 develop（Web `fc37608`、Server `fa96290`）及远端；正式业务功能数45。"],
  [POOL, "，待Planner全文复核；正式业务功能数44→45、第45个正式功能 |", "，经规划最终复核01 PASSED 确认；P53/P61 已合入两仓 develop 并推送（Web `fc37608`、Server `fa96290`）；正式业务功能数45、第45个正式功能 |"],
];

function applyReplace(rel, from, to) {
  const p = join(ROOT, rel);
  const text = readFileSync(p, "utf8");
  const n = text.split(from).length - 1;
  if (n !== 1) { LOG.push("FAILED(" + n + ") " + rel + " :: " + from.slice(0, 70)); return; }
  writeFileSync(p, text.split(from).join(to), "utf8");
  LOG.push("OK " + rel + " :: " + from.slice(0, 50));
}

function replaceLine(rel, prefix, newLine) {
  const p = join(ROOT, rel);
  const lines = readFileSync(p, "utf8").split(LF);
  const hits = [];
  for (let i = 0; i < lines.length; i++) { if (lines[i].indexOf(prefix) === 0) { hits.push(i); } }
  if (hits.length !== 1) { LOG.push("FAILED-LINE(" + hits.length + ") " + rel + " :: " + prefix.slice(0, 60)); return; }
  lines[hits[0]] = newLine;
  writeFileSync(p, lines.join(LF), "utf8");
  LOG.push("OK-LINE " + rel + " :: " + prefix.slice(0, 50));
}

const NEXT_ACTION_CS = "**无待执行方向：P53 已经规划最终复核 01 PASSED 确认 `COMPLETED（规划已确认，2026-09-21）` 并核销（第 45 个正式功能），主方向与阶段三方向均归档 `passed/`；P53/P61 已按 Owner 授权与既定 P61→P53 顺序统一合入两仓 develop 并推送（Web develop `fc37608`、Server develop `fa96290`），受影响检查通过（Web 四连全绿＋locale 八值 8/8；Server compile exit 0＋聚焦测试 35/0/0/0）。** P61 已最终确认 `COMPLETED（规划已确认，2026-09-20）` 并核销，独立提交 Server `742adb8` / Web `d110ed8` 已随合并进入 develop。P60 整体 14/14 已通过并完成两仓 0.1.0 发布（Server main `c15428f0002f6bb0ceeff05c7cbcf842bd3d3148`、Web main `963df360ed18bc1c604652a13edb2a7ed0be8963`，tag/Release `0.1.0`），发布身份未改动、不得重复发布。R8 五外部渠道真实链保持 `Owner延期 / 未验证`（P2 待办 `todo/i6-external-notification-channels-real-verification.md`）。功能数 45、清单 ✅46/🟦22/⬜22、ADV64 与开放 P 编号零变化；等待 Owner/Planner 下发下一轮任务。";
const NEXT_ACTION_CS_SHORT = "- 当前唯一下一动作：**无待执行方向**——P53 已经规划最终复核 01 PASSED 确认并核销，P53/P61 已合入两仓 develop 及远端（Web `fc37608`、Server `fa96290`）。等待 Owner/Planner 下发下一轮任务（0.1.0 发布身份未改动，不得重复发布）";
const NEXT_ACTION_SH = "| 唯一下一动作 | **无待执行方向**：P53 已经规划最终复核 01 PASSED 确认 `COMPLETED（规划已确认，2026-09-21）` 并核销（第 45 个正式功能），P53/P61 已按 Owner 授权合入两仓 develop 并推送（Web `fc37608`、Server `fa96290`）；正式业务功能数 45 与清单 ✅46/🟦22/⬜22、ADV64、开放 P 编号不变；0.1.0 两仓发布身份未改动、不得重复发布 |";
const NEXT_ACTION_HANDOFF = "唯一下一动作：无待执行方向——P53 已经规划最终复核01 PASSED 确认并核销（第45个正式功能），P53/P61 已合入两仓 develop 并推送（Web `fc37608`、Server `fa96290`）；等待 Owner/Planner 下发下一轮任务（0.1.0 发布身份未改动，不得重复发布）。";
const POOL_SCHEDULE = "**2026-09-21 当前排期**：P53 已经规划最终复核01 PASSED 确认`COMPLETED（规划已确认，2026-09-21）`并核销（第45个正式功能）；正式业务功能数45，清单✅46/🟦22/⬜22与ADV64不变。P53/P61 已按 Owner 授权与既定 P61→P53 顺序统一合入两仓 develop 并推送（Web `fc37608`、Server `fa96290`），受影响检查：Web 四连 exit0＋locale 八值8/8、Server compile exit0＋聚焦测试35/0/0/0。下一动作=无待执行方向，等待 Owner/Planner 下发下一轮任务。";
const POOL_P53_DETAIL = "功能级`PASSED（2026-09-21）`、功能状态`COMPLETED（规划已确认，2026-09-21）`、已核销（规划已确认）；规划最终复核01 PASSED（回执`product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md`，`TERMINAL_SYNC_SUBMITTED`）；P53 与 P61 已按 Owner 授权与既定 P61→P53 顺序统一合入两仓 develop 并推送（Web `fc37608`、Server `fa96290`），受影响检查=Web 四连 exit0＋locale 八值8/8、Server compile exit0＋聚焦测试35/0/0/0；清单✅46/🟦22/⬜22与ADV64不变、Server/Flyway 不因 P53 晋级。当前无待执行方向，等待 Owner/Planner 下发下一轮任务。";

for (const rel of [CS, SH, IX, FREC, "memory/README.md", "memory/state.md", "memory/features.md", "memory/handoff.md", POOL]) {
  for (const pair of GLOBAL) { applyReplace(rel, pair[0], pair[1]); }
}
for (const e of EDITS) { applyReplace(e[0], e[1], e[2]); }
replaceLine(CS, "**等待 Planner 全文复核 P53 阶段三终态同步回执（", NEXT_ACTION_CS);
replaceLine(CS, "- 当前唯一下一动作：", NEXT_ACTION_CS_SHORT);
replaceLine(SH, "| 唯一下一动作 | ", NEXT_ACTION_SH);
replaceLine("memory/handoff.md", "唯一下一动作：", NEXT_ACTION_HANDOFF);
replaceLine(POOL, "**2026-09-21 当前排期**：", POOL_SCHEDULE);
replaceLine(POOL, "功能级`PASSED（2026-09-21）`、功能状态`COMPLETED（规划已确认，2026-09-21）`", POOL_P53_DETAIL);

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

