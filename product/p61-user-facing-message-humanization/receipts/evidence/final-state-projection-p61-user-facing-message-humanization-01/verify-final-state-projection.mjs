import { readFileSync, existsSync, statSync, readdirSync, readFileSync as rf } from "node:fs"
import { join } from "node:path"
import { execSync } from "node:child_process"

const ROOT = process.argv[2]
const checks = []
const add = (name, ok, detail) => checks.push({ name, ok: !!ok, detail: detail ?? "" })
const read = p => readFileSync(join(ROOT, p), "utf8")
const has = (t, n) => t.includes(n)
const FINAL = "COMPLETED（规划已确认，2026-09-20）"
const INTEGRATION = "product/p53-global-ui-component-layout/receipts/planning-integration-order-p61-before-p53-merge-20260920.md"

const cs = read("knowledge/current-status.md")
add("current-status 头部 P61=" + FINAL, has(cs, "P61 `p61-user-facing-message-humanization`（全系统用户可见错误码与提示语人性化治理；L，P1）" + FINAL))
add("current-status 阶段三回执经最终复核确认", has(cs, "planning-final-review-terminal-sync-p61-user-facing-message-humanization-01-passed.md` **PASSED** 确认；三份方向（原方向、范围纠偏、阶段三）均已归档"))
add("current-status P61 已核销（规划已确认，2026-09-20）", has(cs, "**P61 已核销（规划已确认，2026-09-20）**"))
add("current-status 集成顺序已登记", has(cs, "集成顺序=独立提交先保留（Server `742adb8`、Web `d110ed8`），待 P53 结束后统一合并"))
add("current-status 变更记录含集成顺序与最终复核", has(cs, "2026-09-20 P53/P61 集成顺序记录（`" + INTEGRATION + "`）") && has(cs, "2026-09-20 P61 阶段三最终复核确认"))
add("current-status 集成顺序记录含 locale 冲突完成条件", has(cs, "合并必须同时保留 P53 结构/新增键与 P61 八值 8/8"))
add("current-status 最近审查含最终复核与集成顺序", has(cs, "| 最近审查 | `product/p61-user-facing-message-humanization/receipts/planning-final-review-terminal-sync-p61-user-facing-message-humanization-01-passed.md`") && has(cs, "planning-integration-order-p61-before-p53-merge-20260920.md`（P53/P61 最终集成顺序记录"))
add("current-status 归档事实含三份方向与集成顺序", has(cs, "主方向、2026-09-20 范围纠偏方向与阶段三终态同步方向均已归档 `product/p61-user-facing-message-humanization/passed/`"))
add("current-status 未关闭项入口指向 passed 与集成顺序记录", has(cs, "P61 三份方向均已归档 `product/p61-user-facing-message-humanization/passed/`，任务登记 `knowledge/features/p61-user-facing-message-humanization.md`，集成顺序记录 `" + INTEGRATION + "`"))
add("current-status 下一动作仍=P53 提示07", has(cs, "**继续执行 P53 提示07（`product/p53-global-ui-component-layout/receipts/planning-execution-prompt-p53-global-ui-component-layout-07.md`），等待其下一份合法完成回执；不改变功能计数与开放 P 编号。**"))
add("current-status 计数零变化（44 / 46-22-22 / ADV64）", has(cs, "| 已完成功能数 | **44** |") && has(cs, "**✅46 / 🟦22 / ⬜22**（46+22+22=90）") && has(cs, "64 条（ADV-M11—ADV-M18）"))
const csLines = cs.split("\n")
const p61StaleValue = cs.split("COMPLETED（待规划确认，2026-09-20）").length - 1
const p61StaleRevert = cs.split("已核销（待规划确认）").length - 1
const p61StaleLines = csLines.filter(l => (l.includes("COMPLETED（待规划确认，2026-09-20）") || l.includes("已核销（待规划确认）")) && !l.startsWith("| 变更类型记录"))
add("current-status P61 待规划确认值仅保留于历史事件列", p61StaleLines.length === 0 && p61StaleValue >= 1 && p61StaleRevert >= 1, "currentValueLines=" + p61StaleLines.length + " historicalTokens=" + (p61StaleValue + p61StaleRevert))
const p60StaleLines = csLines.filter(l => l.includes("COMPLETED（待规划确认，2026-09-15）"))
add("current-status P60 待规划确认仅保留于历史事件列", p60StaleLines.length === 1 && p60StaleLines[0].startsWith("| 变更类型记录"), "lines=" + p60StaleLines.length)
const p61ReadyLines = csLines.filter(l => l.includes("ready/direction-p61"))
add("current-status ready 引用仅存在于历史事件列", p61ReadyLines.length === 1 && p61ReadyLines[0].startsWith("| 变更类型记录"), "lines=" + p61ReadyLines.length)
add("current-status 无待 Planner 全文复核残留", !has(cs, "待 Planner 全文复核"))
add("current-status 提示词区分已归档方向与本轮投影", has(cs, "- 上轮完成：**P61 规划确认终态投影**") && has(cs, "**P61 阶段三终态同步**（方向 `product/p61-user-facing-message-humanization/passed/direction-p61-user-facing-message-humanization-terminal-sync.md`（已归档）"))

const sh = read("knowledge/session-handoff.md")
add("session-handoff 头部 P61=" + FINAL, has(sh, "并已最终确认 `" + FINAL + "` 并核销，三份方向均归档 `passed/`"))
add("session-handoff P61 已核销（规划已确认）", has(sh, "**P61 已核销（规划已确认，2026-09-20）**"))
add("session-handoff 任务指针含集成顺序", has(sh, "- p61-user-facing-message-humanization（P61）：功能级 **`PASSED`（2026-09-20）**，功能状态 **`" + FINAL + "`**，已核销"))
add("session-handoff 无 P61 待规划确认残留", !sh.split("\n").some(l => l.includes("P61") && l.includes("待规划确认")))

const featP = "knowledge/features/p61-user-facing-message-humanization.md"
const feat = read(featP)
add("功能记录 当前状态=" + FINAL, has(feat, "| 当前状态 | **" + FINAL + "**（功能级验收 PASSED，2026-09-20；正式核销"))
add("功能记录 三份方向归档 passed", has(feat, "| 阶段三终态同步方向（已归档） | `product/p61-user-facing-message-humanization/passed/direction-p61-user-facing-message-humanization-terminal-sync.md` |"))
add("功能记录 最终复核与集成顺序行", has(feat, "| 阶段三最终复核 |") && has(feat, "| 集成顺序记录 |"))
add("功能记录 集成顺序值", has(feat, "先保留、暂不合并；P53 结束后统一合并，locale 冲突按「P53 结构与新增键全部保留 + P61 八值 8/8 保留」处理。"))
add("功能记录 无待规划确认残留", !feat.includes("待规划确认"))

const idx = read("knowledge/feature-reconciliation-index.md")
add("index P61 条目最终确认", has(idx, "最终确认 `" + FINAL + "` 并正式核销"))
add("index P61 条目含集成顺序", has(idx, "独立提交 Server `742adb8` / Web `d110ed8` 先保留，待 P53 结束后统一合并）"))
add("index 无 P61 待规划确认残留", !idx.split("\n").some(l => l.includes("P61") && l.includes("待规划确认")))

const pool = read("todo/requirement-pool.md")
add("pool P61 池行已确认核销", has(pool, "| P61 | 全系统用户可见错误码与提示语人性化治理 |") && has(pool, "✅ `" + FINAL + "`、已核销；不增加业务功能数 |"))
add("pool P53 段 P61 陈述已更新", has(pool, "P61 已 `" + FINAL + "` 并核销，独立提交先保留、待 P53 结束后统一合并。"))
add("pool 无 P61 待规划确认残留", !pool.split("\n").some(l => l.includes("P61") && l.includes("待规划确认")))

const passedDir = "product/p61-user-facing-message-humanization/passed/direction-p61-user-facing-message-humanization-terminal-sync.md"
add("阶段三方向在 passed/", existsSync(join(ROOT, passedDir)))
add("阶段三方向含最终确认指针", existsSync(join(ROOT, passedDir)) && has(read(passedDir), "> 最终确认：`" + FINAL + "`——规划最终复核 01 `receipts/planning-final-review-terminal-sync-p61-user-facing-message-humanization-01-passed.md` **PASSED**"))
add("ready/ 中已无 P61 方向", readdirSync(join(ROOT, "product/p61-user-facing-message-humanization/ready")).length === 0)

const logs = JSON.parse(read("product/p61-user-facing-message-humanization/receipts/evidence/final-state-projection-p61-user-facing-message-humanization-01/apply-log.json"))
add("本轮未写 memory/", logs.edits.every(e => !e.file.startsWith("memory/")))

const memFiles = readdirSync(join(ROOT, "memory")).filter(f => f.endsWith(".md"))
const sizes = memFiles.map(f => ({ f, size: statSync(join(ROOT, "memory", f)).size }))
const maxSize = Math.max(...sizes.map(s => s.size))
const totalSize = sizes.reduce((s, x) => s + x.size, 0)
add("memory 仍满足 <5KB/文件", maxSize < 5120, "max=" + maxSize)
add("memory 仍满足 <20KB 总量", totalSize < 20480, "total=" + totalSize)

const serverStatus = execSync("git status --porcelain", { cwd: join(ROOT, "Smart-WorkFlow-aPaaS-server") }).toString().trim()
add("Server 工作树仍干净（本轮零改动）", serverStatus === "", "status=" + JSON.stringify(serverStatus))
let wsLog = ""
try { wsLog = execSync("git log -1 --format=%H%n%ci", { cwd: ROOT }).toString().trim() } catch (e) { wsLog = "ERR" }
const wsStatus = execSync("git status --porcelain", { cwd: ROOT }).toString().split("\n").filter(Boolean)
add("Workspace 本轮未产生新提交（变更仍为未提交状态）", wsStatus.length > 0, "changed=" + wsStatus.length + " head=" + wsLog.split("\n")[0])

const failedChecks = checks.filter(c => !c.ok)
const report = { checks, total: checks.length, passed: checks.length - failedChecks.length, failed: failedChecks.length, memory: { maxFileBytes: maxSize, totalBytes: totalSize }, workspace: { head: wsLog, changedCount: wsStatus.length }, serverStatus }
import("node:fs").then(fs => fs.writeFileSync(process.argv[3], JSON.stringify(report, null, 2)))
for (const c of checks) console.log((c.ok ? "PASS " : "FAIL ") + c.name + (c.detail ? " [" + c.detail + "]" : ""))
console.log("RESULT: " + (failedChecks.length === 0 ? "ALL CHECKS PASSED" : failedChecks.length + " CHECKS FAILED"))
process.exit(failedChecks.length === 0 ? 0 : 1)
