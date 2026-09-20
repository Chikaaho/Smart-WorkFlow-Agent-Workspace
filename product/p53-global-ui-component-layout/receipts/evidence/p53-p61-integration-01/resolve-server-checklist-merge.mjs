import { writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

// Server 合并冲突消解：以 develop 侧《功能清单》当前焦点行为基准（保留其较完整的基线/发布身份表述），
// 叠加 P53 终态值（功能数 45、P53 方向归档与已集成事实），替换已被取代的 P61 现状探索入口。
const ROOT = process.argv[2];
const REV = process.argv[3];
const WEB = join(ROOT, "Smart-WorkFlow-aPaaS-server");
const BS = String.fromCharCode(92);
const safe = "safe.directory=" + WEB.split(BS).join("/");

const ours = execFileSync("git", ["-c", safe, "-C", WEB, "show", REV + ":功能清单.md"], { encoding: "utf8" });

const edits = [
  [
    "功能数 **44**（44/44 登记路径存在，不改变计数）",
    "功能数 **45**（P53 全局 UI 与组件布局优化 2026-09-21 功能级 `PASSED`、`COMPLETED（规划已确认，2026-09-21）` 后由 44→45；登记路径 45/45 存在，P53 登记 `knowledge/features/p53-global-ui-component-layout.md`）",
  ],
  [
    "当前规划入口=`search_task/v0.1.0-p61-user-facing-message-humanization-current-seams.md`（P61 用户可见错误码与提示语人性化治理现状探索）；P60 整体终态同步方向已归档",
    "P53 主方向已归档 `product/p53-global-ui-component-layout/passed/direction-p53-global-ui-component-layout.md`，阶段三终态同步方向已归档 `product/p53-global-ui-component-layout/passed/direction-p53-global-ui-component-layout-terminal-sync.md`（P53 规划最终复核 01 PASSED，2026-09-21；P53/P61 已按 Owner 授权统一合入 develop 并推送）；P60 整体终态同步方向已归档",
  ],
];

let text = ours;
for (const e of edits) {
  const n = text.split(e[0]).length - 1;
  if (n !== 1) { console.log("FAILED occurrences=" + n + " anchor=" + e[0].slice(0, 50)); process.exit(1); }
  text = text.split(e[0]).join(e[1]);
}
writeFileSync(join(WEB, "功能清单.md"), text, "utf8");
console.log("OK 功能清单合并冲突已消解（develop 基准 + P53 终态值）");
