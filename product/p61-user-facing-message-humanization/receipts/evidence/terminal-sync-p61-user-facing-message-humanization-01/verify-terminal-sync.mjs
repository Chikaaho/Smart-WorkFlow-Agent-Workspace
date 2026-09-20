import { readFileSync, existsSync, statSync, readdirSync } from "node:fs"
import { join } from "node:path"
import { execSync } from "node:child_process"

const ROOT = process.argv[2]
const checks = []
const add = (name, ok, detail) => checks.push({ name, ok: !!ok, detail: detail ?? "" })
const read = p => readFileSync(join(ROOT, p), "utf8")
const has = (text, needle) => text.includes(needle)

const cs = read("knowledge/current-status.md")
add("current-status 同步点=2026-09-20", has(cs, "唯一当前快照；截至/同步点：2026-09-20。"))
add("current-status P61 COMPLETED（待规划确认，2026-09-20）", has(cs, "P61 `p61-user-facing-message-humanization`（全系统用户可见错误码与提示语人性化治理；L，P1）COMPLETED（待规划确认，2026-09-20）"))
add("current-status P61 功能级 PASSED（2026-09-20）", has(cs, "planning-review-p61-scope-corrected-completion-03-passed.md` **PASSED**（2026-09-20"))
add("current-status P61 已核销（待规划确认）", has(cs, "**P61 已核销（待规划确认，2026-09-20）**"))
add("current-status 活动功能=P53 VERIFYING/P0/XL", has(cs, "| 当前活动正式功能 | `p53-global-ui-component-layout`（P53 全局 UI 与组件布局优化，XL，P0）：**`VERIFYING`**"))
add("current-status P61 不再列为活动功能", has(cs, "P61 `p61-user-facing-message-humanization`：`COMPLETED（待规划确认，2026-09-20）`，已核销（待规划确认），不再列为活动功能"))
add("current-status 唯一下一动作=P53 提示07", has(cs, "**继续执行 P53 提示07（`product/p53-global-ui-component-layout/receipts/planning-execution-prompt-p53-global-ui-component-layout-07.md`），等待其下一份合法完成回执；不改变功能计数与开放 P 编号。**"))
add("current-status 无 P61 探索入口残留", !has(cs, "当前规划入口切换为 P61 用户可见错误码与提示语人性化治理现状探索"))
add("current-status P61 基线 Server 1423/0/0/0", has(cs, "Server **1423 tests / 0 failures / 0 errors / 0 skipped**"))
add("current-status P61 基线 Web 1217+3", has(cs, "Web typecheck/lint/test/build 四门 exit 0（**1217 passed + 3 skipped**）"))
add("current-status P61 验证基线只证明 P61", has(cs, "只证明 P61，不构成 P53 视觉或功能通过"))
add("current-status 功能数=44（零变化）", has(cs, "| 已完成功能数 | **44** |"))
add("current-status 清单 ✅46/🟦22/⬜22（零变化）", has(cs, "**✅46 / 🟦22 / ⬜22**（46+22+22=90）"))
add("current-status ADV64（零变化）", has(cs, "64 条（ADV-M11—ADV-M18）"))
add("current-status P61 主方向归档 passed", has(cs, "`p61-user-facing-message-humanization`（P61 全系统用户可见错误码与提示语人性化治理，L）：功能级验收 **PASSED（2026-09-20）**"))
add("current-status 阶段三方向仍 ready（待归档）", has(cs, "阶段三终态同步方向仍在 `product/p61-user-facing-message-humanization/ready/direction-p61-user-facing-message-humanization-terminal-sync.md`"))

const sh = read("knowledge/session-handoff.md")
add("session-handoff 同步点=2026-09-20 且活动功能=P53", has(sh, "> 同步点：2026-09-20。**当前活动功能=P53 全局 UI 与组件布局优化（XL，P0，`VERIFYING`"))
add("session-handoff P61 COMPLETED（待规划确认）", has(sh, "P61 全系统用户可见错误码与提示语人性化治理（L，P1）功能级 `PASSED`（2026-09-20）并写为 `COMPLETED（待规划确认，2026-09-20）`、已核销（待规划确认）"))
add("session-handoff P61 已核销（待规划确认，2026-09-20）", has(sh, "**P61 已核销（待规划确认，2026-09-20）**"))
add("session-handoff 唯一下一动作=P53 提示07", has(sh, "| 唯一下一动作 | **继续执行 P53 提示07"))

const idx = read("knowledge/feature-reconciliation-index.md")
add("index 审计外新增编号（2）含 P61", has(idx, "**审计外新增编号（2）**：P61（全系统用户可见错误码与提示语人性化治理"))
add("index 任务登记含 P61 features", has(idx, "`knowledge/features/p61-user-facing-message-humanization.md`（P61 全系统用户可见错误码与提示语人性化治理，`COMPLETED（待规划确认，2026-09-20）`，已核销（待规划确认））"))

const featPath = "knowledge/features/p61-user-facing-message-humanization.md"
add("P61 功能记录存在", existsSync(join(ROOT, featPath)))
const feat = existsSync(join(ROOT, featPath)) ? read(featPath) : ""
add("P61 功能记录状态=COMPLETED（待规划确认，2026-09-20）", has(feat, "**COMPLETED（待规划确认，2026-09-20）**（功能级验收 PASSED，2026-09-20；已核销（待规划确认）"))
add("P61 功能记录已核销（待规划确认）", has(feat, "**P61 已核销（待规划确认）**"))

for (const f of ["README.md", "state.md", "features.md", "handoff.md"]) {
  const t = read(join("memory", f))
  add("memory/" + f + " 含 P61 终态值", has(t, "COMPLETED（待规划确认，2026-09-20）"))
}
const memFiles = readdirSync(join(ROOT, "memory")).filter(f => f.endsWith(".md"))
const sizes = memFiles.map(f => ({ f, size: statSync(join(ROOT, "memory", f)).size }))
const maxSize = Math.max(...sizes.map(s => s.size))
const totalSize = sizes.reduce((s, x) => s + x.size, 0)
add("memory 单文件 <5KB", maxSize < 5120, "max=" + maxSize)
add("memory 总量 <20KB", totalSize < 20480, "total=" + totalSize)
add("memory/handoff 下一动作=P53 提示07 继续", has(read("memory/handoff.md"), "P53执行会话：继续提示07并提交其下一份合法完成回执；P61不再是活动功能。"))

const pool = read("todo/requirement-pool.md")
add("pool P61 行=COMPLETED（待规划确认，2026-09-20）", has(pool, "| `COMPLETED（待规划确认，2026-09-20）`（功能级`PASSED`，2026-09-20）；已核销（待规划确认）；不增加业务功能数；阶段三终态同步回执已提交待Planner复核 |"))
add("pool 优先级块 P61 已完成", has(pool, "P61按范围纠偏后的L级提示语治理已并行完成：功能级`PASSED`（2026-09-20）、状态`COMPLETED（待规划确认，2026-09-20）`、已核销（待规划确认）"))
add("pool P61 定义段同步", has(pool, "- P60 `0.1.0` 前置已满足；Owner 2026-09-20 覆盖此前等待排期，P61 与 P53 并行恢复并按范围纠偏完成"))
add("pool P53 段 P61 已完成口径", has(pool, "P61 已按 2026-09-20 范围纠偏与 P53 并行完成（功能级 `PASSED`（2026-09-20）"))

const dir = "product/p61-user-facing-message-humanization"
const readyTerminal = dir + "/ready/direction-p61-user-facing-message-humanization-terminal-sync.md"
add("阶段三方向仍在 ready/", existsSync(join(ROOT, readyTerminal)))
add("阶段三方向自身状态指针=COMPLETED（待规划确认，2026-09-20）", has(read(readyTerminal), "> 阶段三状态指针：`COMPLETED（待规划确认，2026-09-20）`（Executor 已按本方向完成机械同步并提交回执；待 Planner 全文复核后归档 `passed/`）"))
add("主方向已归档 passed/", existsSync(join(ROOT, dir + "/passed/direction-p61-user-facing-message-humanization.md")))
add("范围纠偏方向已归档 passed/", existsSync(join(ROOT, dir + "/passed/direction-p61-user-facing-message-humanization-scope-correction-20260920.md")))
add("阶段三方向未被提前归档", !existsSync(join(ROOT, dir + "/passed/direction-p61-user-facing-message-humanization-terminal-sync.md")))

const serverStatus = execSync("git status --porcelain", { cwd: join(ROOT, "Smart-WorkFlow-aPaaS-server") }).toString().trim()
add("本轮未改 Server 业务代码（工作树干净）", serverStatus === "", "status=" + JSON.stringify(serverStatus))
const webStatus = execSync("git status --porcelain", { cwd: join(ROOT, "Smart-WorkFlow-aPaaS-Web") }).toString().split("\n").filter(Boolean).map(l => l.slice(3).trim())
add("本轮未新增 Web 同步类文件（工作树仅 P53 在途 + P61 已声明集成文件）", webStatus.every(p => p.startsWith("src/") || p.startsWith("e2e/") || p === "eslint.config.js"))

const failedChecks = checks.filter(c => !c.ok)
const report = { checks, total: checks.length, passed: checks.length - failedChecks.length, failed: failedChecks.length, memory: { maxFileBytes: maxSize, totalBytes: totalSize }, repos: { serverStatus, webChangedCount: webStatus.length } }
import("node:fs").then(fs => fs.writeFileSync(process.argv[3], JSON.stringify(report, null, 2)))
for (const c of checks) console.log((c.ok ? "PASS " : "FAIL ") + c.name + (c.detail ? " [" + c.detail + "]" : ""))
console.log("RESULT: " + (failedChecks.length === 0 ? "ALL CHECKS PASSED" : failedChecks.length + " CHECKS FAILED"))
process.exit(failedChecks.length === 0 ? 0 : 1)

