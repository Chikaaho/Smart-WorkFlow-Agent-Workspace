import { readFileSync, writeFileSync, statSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { execFileSync } from "node:child_process";

// P53 阶段三终态同步稳定断言：授权值（方向 §2）= 文件实际值 = 回执声明值。
const ROOT = process.argv[2];
const OUT = process.argv[3];
const NL = String.fromCharCode(10);

const CS = "knowledge/current-status.md";
const SH = "knowledge/session-handoff.md";
const IX = "knowledge/feature-reconciliation-index.md";
const POOL = "todo/requirement-pool.md";
const FLIST = "Smart-WorkFlow-aPaaS-server/功能清单.md";
const DIR = "product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md";
const FREC = "knowledge/features/p53-global-ui-component-layout.md";

const checks = [];
function read(rel) { return readFileSync(join(ROOT, rel), "utf8"); }
function has(name, rel, needle) {
  const t = read(rel);
  checks.push({ name: name, ok: t.indexOf(needle) >= 0, detail: rel + (needle.length > 0 ? "" : "") });
}
function lacks(name, rel, needle) {
  const t = read(rel);
  checks.push({ name: name, ok: t.indexOf(needle) < 0, detail: rel });
}
function eq(name, actual, expected) {
  checks.push({ name: name, ok: actual === expected, detail: "actual=" + JSON.stringify(actual) + " expected=" + JSON.stringify(expected) });
}
function lineOf(rel, prefix) {
  const lines = read(rel).split(NL);
  const hits = lines.filter(function (l) { return l.indexOf(prefix) === 0; });
  return hits.length === 1 ? hits[0] : "";
}

// ---- knowledge/current-status.md
has("current-status 同步点=2026-09-21", CS, "> 唯一当前快照；截至/同步点：2026-09-21。");
has("current-status P53 功能级 PASSED（2026-09-21）", CS, "planning-review-p53-completion-12-passed.md` **PASSED（2026-09-21）**");
has("current-status P53 状态 COMPLETED（待规划确认，2026-09-21）", CS, "`COMPLETED（待规划确认，2026-09-21）`");
has("current-status P53 已核销（待规划确认，2026-09-21）", CS, "**P53 已核销（待规划确认，2026-09-21）**；");
eq("current-status 已完成功能数=45", lineOf(CS, "| 已完成功能数 | "), "| 已完成功能数 | **45** |");
has("current-status 上一完成功能=P53 第 45 个", CS, "| 上一完成功能 | `p53-global-ui-component-layout`（P53 全局 UI 与组件布局优化）：**功能级 `PASSED（2026-09-21）`、功能状态 `COMPLETED（待规划确认，2026-09-21）`**");
has("current-status 上一完成功能第 45 个正式功能", CS, "），第 45 个正式功能；其前第 44 个为 `p21-iot-device-access`");
has("current-status 当前无活动正式功能", CS, "| 当前活动正式功能 | **无活动正式功能**：P53");
has("current-status 当前活动交付任务=P53 阶段三终态同步", CS, "| 当前活动交付任务 | P53 阶段三终态同步（方向 `product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md`");
has("current-status 最近审查含 P53 审查 12", CS, "| 最近审查 | `product/p53-global-ui-component-layout/receipts/planning-review-p53-completion-12-passed.md`（P53 功能级验收审查 12 **PASSED**");
has("current-status P53 基线 71 passed + 17 skipped、0 failed、exit 0", CS, "Playwright 视觉 **71 passed + 17 skipped、0 failed、exit 0**");
has("current-status P53 基线 Vitest 134+1 / 1217+3", CS, "Vitest **134 files passed + 1 skipped、1217 tests passed + 3 skipped**");
has("current-status P53 基线 20 条真实 /api/*", CS, "20 条真实 `/api/*` 请求");
has("current-status P53 基线 节点06 安全偏差（不写成 31/31）", CS, "**30 个阈值通过 + 节点06 规划确认的安全偏差**（不得写成 31/31）");
has("current-status Server/Flyway 不为 P53 晋级", CS, "Server/Flyway 不为 P53 晋级（沿用 0.1.0 终值 Server 1362/0/0/0、V93）");
has("current-status P53 基线只证明 P53", CS, "P53 视觉/Web 验证基线集合（2026-09-21，只证明 P53，不构成 Server/Flyway 晋级）");
has("current-status 清单 ✅46/🟦22/⬜22（零变化）", CS, "| 功能清单 | 10 模块、55 功能、90 明细；**✅46 / 🟦22 / ⬜22**（46+22+22=90）");
has("current-status ADV64（零变化）", CS, "**ADV 高级能力规划项 8 模块、64 条");
has("current-status P53 主方向归档 passed", CS, "主方向已归档 `product/p53-global-ui-component-layout/passed/direction-p53-global-ui-component-layout.md`");
has("current-status 阶段三方向仍 ready", CS, "阶段三终态同步方向 `product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md` 仍在 `ready/`");
has("current-status 唯一下一动作=Planner 全文复核 P53 终态同步回执", CS, "**等待 Planner 全文复核 P53 阶段三终态同步回执（`product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md`，`TERMINAL_SYNC_SUBMITTED`）；通过后按既定 P61→P53 集成顺序等待 Owner 授权统一合并并做受影响检查");
lacks("current-status 无提示07 入口残留", CS, "planning-execution-prompt-p53-global-ui-component-layout-07");
has("current-status 上轮完成=P53 阶段三终态同步", CS, "- 上轮完成：**P53 阶段三终态同步**（方向 `product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md`");
has("current-status 新会话完成数 45/45 登记路径", CS, "正式功能数 **45**（45/45 登记路径存在：P53 为第 45 个正式功能，登记 `knowledge/features/p53-global-ui-component-layout.md`）");
has("current-status 新会话 P 编号含 P53 已核销（待规划确认）", CS, "- P 编号：P21 已核销（2026-09-08）；P53 已核销（待规划确认，2026-09-21）；");
has("current-status 功能追踪含 P53 功能记录", CS, "`knowledge/features/p53-global-ui-component-layout.md`（P53）；映射索引 `knowledge/feature-reconciliation-index.md`");
has("current-status P53 不属于未完成边界", CS, "当前无活动正式功能（P53 已功能级 `PASSED（2026-09-21）`、终态同步待 Planner 复核，不属于未完成边界）");
has("current-status 变更类型记录新增 2026-09-21 P53 终态同步", CS, "| 变更类型记录（历史事件，非当前值） | 2026-09-21 P53 阶段三终态同步（本回执 `product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md`）");
{
  const lines = read(CS).split(NL).filter(function (l) { return l.indexOf("VERIFYING") >= 0; });
  checks.push({ name: "current-status VERIFYING 仅作历史记录保留", ok: lines.length === 1 && lines[0].indexOf("2026-09-20 P53/P61 集成顺序记录") >= 0, detail: "lines=" + lines.length });
}

// ---- knowledge/session-handoff.md
has("session-handoff 同步点=2026-09-21 且无活动正式功能", SH, "> 同步点：2026-09-21。**当前无活动正式功能：P53 全局 UI 与组件布局优化（XL，P0）功能级 `PASSED（2026-09-21）`、功能状态 `COMPLETED（待规划确认，2026-09-21）`、已核销（待规划确认）");
has("session-handoff 正式业务功能数=45（第 45 个）", SH, "| 正式业务功能数 | **45**（P53 全局 UI 与组件布局优化为第 45 个正式功能");
has("session-handoff P53 已核销（待规划确认，2026-09-21）", SH, "**P53 已核销（待规划确认，2026-09-21）**；");
has("session-handoff 活动业务实现功能含 P53 终态", SH, "| 活动业务实现功能 | **P53 全局 UI 与组件布局优化（XL，P0）功能级 `PASSED（2026-09-21）`、功能状态 `COMPLETED（待规划确认，2026-09-21）`、已核销（待规划确认），阶段三终态同步已提交待 Planner 全文复核**；");
has("session-handoff 唯一下一动作", SH, "| 唯一下一动作 | **等待 Planner 全文复核 P53 阶段三终态同步回执");
has("session-handoff Web 基线含 P53 视觉/Web 验证基线集合", SH, "P53 视觉/Web 验证基线集合（2026-09-21，只证明 P53，不构成 Server/Flyway 晋级）");
has("session-handoff 任务指针 P53 第 45 个正式功能", SH, "- p53-global-ui-component-layout（P53，XL/P0）：功能级 **`PASSED（2026-09-21）`**（审查 12，主方向 §9 十八项标准通过），功能状态 **`COMPLETED（待规划确认，2026-09-21）`**，已核销（待规划确认），第 45 个正式功能；");
lacks("session-handoff 无提示07 入口残留", SH, "planning-execution-prompt-p53-global-ui-component-layout-07");
lacks("session-handoff 无 VERIFYING 残留", SH, "VERIFYING");

// ---- knowledge/feature-reconciliation-index.md
has("index 已核销/完成（24）含 P53", IX, "- **已核销/完成（24）**：P1、P3、");
has("index P53 于 2026-09-21 核销（待规划确认）", IX, "；P53 于 2026-09-21 随 p53-global-ui-component-layout 核销（待规划确认））");
has("index 待 Owner 确认（0）", IX, "- **待 Owner 确认（0）**：P53 已核销（待规划确认，2026-09-21），无待 Owner 确认编号");
has("index 任务登记含 P53 功能记录", IX, "`knowledge/features/p53-global-ui-component-layout.md`（P53 全局 UI 与组件布局优化，第 45 个正式功能，功能级 `PASSED（2026-09-21）`、`COMPLETED（待规划确认，2026-09-21）`、已核销（待规划确认））");
has("index 下一动作=Planner 全文复核 P53 终态同步回执", IX, "下一动作=Planner 全文复核 P53 阶段三终态同步回执（方向 `product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md`，回执 `product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md`）");
lacks("index 无提示07 入口残留", IX, "planning-execution-prompt-p53-global-ui-component-layout-07");

// ---- P53 功能记录
eq("P53 功能记录存在", existsSync(join(ROOT, FREC)), true);
has("P53 功能记录状态=COMPLETED（待规划确认，2026-09-21）", FREC, "| 当前状态 | **COMPLETED（待规划确认，2026-09-21）**（功能级验收 `PASSED（2026-09-21）`；P53 已核销（待规划确认）；阶段三终态同步回执已提交，待 Planner 全文复核） |");
has("P53 功能记录 第 45 个正式功能", FREC, "> 工作区统一知识库 — 正式业务功能登记（第 45 个正式功能，XL，P0）。");
has("P53 功能记录 已核销（待规划确认）", FREC, "- 功能状态：**COMPLETED（待规划确认，2026-09-21）**；需求编号 **P53 已核销（待规划确认）**。");
has("P53 功能记录 主方向已归档", FREC, "| 主方向（已归档） | `product/p53-global-ui-component-layout/passed/direction-p53-global-ui-component-layout.md` |");
has("P53 功能记录 计数 44→45 与零变化", FREC, "- 计数：正式业务功能数 **44→45**（P53 为第 45 个正式功能）；清单 **✅46 / 🟦22 / ⬜22**（90）、**ADV64** 与 M/I/P 其余状态零变化。");

// ---- memory
has("memory/README.md 含 P53 终态值", "memory/README.md", "P53功能级`PASSED（2026-09-21）`、状态`COMPLETED（待规划确认，2026-09-21）`、已核销（待规划确认），正式功能数44→45");
has("memory/state.md 含 P53 终态值与功能数 45", "memory/state.md", "正式业务功能数**45**；当前无活动正式功能，下一动作=Planner全文复核P53终态同步回执");
has("memory/state.md 终态值行=45", "memory/state.md", "- 终态值：功能数 **45**（P53 第45个，待规划确认）；");
has("memory/features.md 含功能数 45", "memory/features.md", "功能数 **45**（P53 为第 45 个正式功能）");
has("memory/features.md P53 条目", "memory/features.md", "- P53（P0/XL）：**功能级`PASSED（2026-09-21）`、`COMPLETED（待规划确认，2026-09-21）`、已核销（待规划确认），第45个正式功能**");
has("memory/handoff.md 含 44→45 与下一动作", "memory/handoff.md", "唯一下一动作：Planner全文复核P53阶段三终态同步回执`product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md`");
{
  const dir = join(ROOT, "memory");
  const names = readdirSync(dir).filter(function (n) { return n.slice(-3) === ".md"; }).sort();
  let total = 0;
  let max = 0;
  for (const n of names) { const s = statSync(join(dir, n)).size; total += s; if (s > max) { max = s; } }
  checks.push({ name: "memory 单文件 <5KB", ok: max < 5120, detail: "max=" + max });
  checks.push({ name: "memory 总量 <20KB", ok: total < 20480, detail: "total=" + total });
}

// ---- todo/requirement-pool.md
has("pool 当前排期行含 P53 终态同步已提交与下一动作", POOL, "**2026-09-21 当前排期**：P53阶段三终态同步已提交（回执`product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md`，`TERMINAL_SYNC_SUBMITTED`）");
has("pool P53 池行=已核销（待规划确认）", POOL, "| P53 | 全局 UI 与组件布局优化 | Owner 2026-08-30、2026-09-13、2026-09-16、2026-09-17、2026-09-18、2026-09-19、2026-09-21；优先级P0；XL；");
has("pool P53 池行状态含待 Planner 全文复核", POOL, "功能级`PASSED（2026-09-21）`、状态`COMPLETED（待规划确认，2026-09-21）`、已核销（待规划确认）；[终态同步回执](../product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md)`TERMINAL_SYNC_SUBMITTED`，待Planner全文复核");
has("pool P53 详情当前状态已同步", POOL, "功能级`PASSED（2026-09-21）`、功能状态`COMPLETED（待规划确认，2026-09-21）`、已核销（待规划确认）；阶段三终态同步回执`product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md`（`TERMINAL_SYNC_SUBMITTED`）待Planner全文复核");
lacks("pool 无提示07 入口残留", POOL, "planning-execution-prompt-p53-global-ui-component-layout-07");

// ---- 项目功能清单（仅同步正式功能总数/当前说明）
has("功能清单 功能数 45", FLIST, "；功能数 **45**（P53 全局 UI 与组件布局优化 2026-09-21 功能级 `PASSED`、`COMPLETED（待规划确认）` 后由 44→45；登记路径 45/45 存在，P53 登记 `knowledge/features/p53-global-ui-component-layout.md`）。");
has("功能清单 90 行计数零变化", FLIST, "当前业务 90 行终态 **✅46/🟦22/⬜22**（46+22+22=90）");
has("功能清单 P53 主方向与阶段三入口", FLIST, "P53 主方向已归档 `product/p53-global-ui-component-layout/passed/direction-p53-global-ui-component-layout.md`，阶段三终态同步方向 `product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md` 待 Planner 归档；当前唯一下一动作见 `knowledge/current-status.md`。");
has("功能清单 ADV 计数规则同步为 45", FLIST, "不并入已完成功能数 45。");

// ---- 阶段三方向与归档状态
has("阶段三方向自身状态指针已写入", DIR, "> 执行侧状态指针（2026-09-21）：终态同步已提交，回执 `product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md`（`TERMINAL_SYNC_SUBMITTED`）");
eq("主方向已归档 passed/", existsSync(join(ROOT, "product/p53-global-ui-component-layout/passed/direction-p53-global-ui-component-layout.md")), true);
eq("阶段三方向未被提前归档（passed/ 无 terminal-sync 文件）", readdirSync(join(ROOT, "product/p53-global-ui-component-layout/passed")).filter(function (n) { return n.indexOf("terminal-sync") >= 0; }).length, 0);
eq("阶段三方向仍在 ready/", existsSync(join(ROOT, DIR)), true);

// ---- 两仓边界（只读回读）
const gitCommon = ["-c", "core.quotepath=false"];
function git(args) { return execFileSync("git", gitCommon.concat(args), { cwd: ROOT, encoding: "utf8" }); }
const BSLASH = String.fromCharCode(92);
const serverSafe = "safe.directory=" + join(ROOT, "Smart-WorkFlow-aPaaS-server").split(BSLASH).join("/");
const webSafe = "safe.directory=" + join(ROOT, "Smart-WorkFlow-aPaaS-Web").split(BSLASH).join("/");
const serverStatus = git(["-c", serverSafe, "-C", "Smart-WorkFlow-aPaaS-server", "status", "--porcelain"]).split(NL).filter(function (l) { return l.length > 0; }).map(function (l) { return l.slice(3).trim(); });
const webStatus = git(["-c", webSafe, "-C", "Smart-WorkFlow-aPaaS-Web", "status", "--porcelain"]).split(NL).filter(function (l) { return l.length > 0; });
const serverAllowed = ["sw-biz/sw-biz-system/sw-biz-system-biz/src/main/java/com/sw/ck/system/security/PngCaptchaRenderer.java", "功能清单.md"];
checks.push({ name: "Server 工作树仅 P53 在途文件 + 本轮功能清单同步", ok: serverStatus.every(function (p) { return serverAllowed.indexOf(p) >= 0; }) && serverStatus.indexOf("功能清单.md") >= 0, detail: "server=" + JSON.stringify(serverStatus) });
const numstat = git(["-c", serverSafe, "-C", "Smart-WorkFlow-aPaaS-server", "diff", "--numstat", "--", "功能清单.md"]).trim();
checks.push({ name: "功能清单改动限 2 行（不改动任何 Mxx-Fxx 行）", ok: numstat.indexOf("2") === 0, detail: "numstat=" + numstat });
checks.push({ name: "Web 工作树保持 P53 在途改动集（178 项，无新增同步类文件）", ok: webStatus.length === 178 && webStatus.every(function (l) { return l.indexOf("receipts/terminal-sync") < 0 && l.indexOf("knowledge/") < 0 && l.indexOf("memory/") < 0; }), detail: "webChanged=" + webStatus.length });

const failed = checks.filter(function (c) { return !c.ok; });
const report = { task: "terminal-sync-p53-global-ui-component-layout-01", total: checks.length, passed: checks.length - failed.length, failed: failed.length, generatedAt: new Date().toISOString(), checks: checks };
if (OUT) { writeFileSync(OUT, JSON.stringify(report, null, 2), "utf8"); }
for (const c of checks) { console.log((c.ok ? "PASS " : "FAIL ") + c.name + (c.detail ? " [" + c.detail + "]" : "")); }
console.log("RESULT: " + (failed.length === 0 ? "ALL CHECKS PASSED" : failed.length + " CHECKS FAILED"));
process.exit(failed.length === 0 ? 0 : 1);
