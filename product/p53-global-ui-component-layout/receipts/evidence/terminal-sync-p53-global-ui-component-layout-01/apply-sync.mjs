import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

// P53 阶段三终态同步：唯一终态值清单机械落实（无业务代码、无构建、无 Git 动作）。
// 说明：本脚本刻意不使用反斜杠转义，换行符与分隔符由字符码构造，避免补丁传输层转义歧义。

const ROOT = process.argv[2];
const EVID = process.argv[3];
const LF = String.fromCharCode(10);
const CR = String.fromCharCode(13);
const BSL = String.fromCharCode(92);

const CS = "knowledge/current-status.md";
const SH = "knowledge/session-handoff.md";
const IX = "knowledge/feature-reconciliation-index.md";
const POOL = "todo/requirement-pool.md";
const FLIST = "Smart-WorkFlow-aPaaS-server/功能清单.md";
const DIR = "product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md";
const FREC = "knowledge/features/p53-global-ui-component-layout.md";

const P53_HEAD = "**P53 `p53-global-ui-component-layout`（P53 全局 UI 与组件布局优化；XL，P0）功能级验收 `product/p53-global-ui-component-layout/receipts/planning-review-p53-completion-12-passed.md` **PASSED（2026-09-21）**，阶段三终态同步回执 `product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md` 已提交（`TERMINAL_SYNC_SUBMITTED`，待 Planner 全文复核）：本文件按终态同步方向 `product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md` 的唯一终态值清单机械写为 `COMPLETED（待规划确认，2026-09-21）`、P53 已核销（待规划确认）、正式业务功能数 44→**45**；P53 主方向已归档 `product/p53-global-ui-component-layout/passed/direction-p53-global-ui-component-layout.md`，阶段三方向仍在 `ready/` 待 Planner 归档；当前无活动正式功能。";

const P53_BASE = "P53 视觉/Web 验证基线集合（2026-09-21，只证明 P53，不构成 Server/Flyway 晋级）：Web typecheck/Vitest/build/lint 四门 exit 0（Vitest **134 files passed + 1 skipped、1217 tests passed + 3 skipped**；lint 0 error / 458 个既有 warning）；Playwright 视觉 **71 passed + 17 skipped、0 failed、exit 0**；可见 headed FORMAL_FLOW 5 个可回读制品与 20 条真实 `/api/*` 请求；31 个适用设计节点中 **30 个阈值通过 + 节点06 规划确认的安全偏差**（不得写成 31/31）；Server/Flyway 不为 P53 晋级（沿用 0.1.0 终值 Server 1362/0/0/0、V93）；";

const P53_REVIEW = "`product/p53-global-ui-component-layout/receipts/planning-review-p53-completion-12-passed.md`（P53 功能级验收审查 12 **PASSED**：34 个视觉失败实例逐项收敛为 71 passed / 0 failed / 17 skipped、exit 0，31 个适用节点 30 通过 + 节点06 记录性安全偏差，2026-09-21）";

const NEXT53 = "**等待 Planner 全文复核 P53 阶段三终态同步回执（`product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md`，`TERMINAL_SYNC_SUBMITTED`）；通过后按既定 P61→P53 集成顺序等待 Owner 授权统一合并并做受影响检查；不改变 90 明细、ADV64 与开放 P 编号。** P53 功能级 `PASSED（2026-09-21）`、功能状态 `COMPLETED（待规划确认，2026-09-21）`、已核销（待规划确认），正式业务功能数 44→45，当前无活动正式功能。P61 已功能级 `PASSED`（2026-09-20）、最终确认 `COMPLETED（规划已确认，2026-09-20）` 并核销，三份方向均已归档 `passed/`（最终复核 01 PASSED）；独立提交先保留、通过后统一合并。P60 整体 14/14 已通过并完成两仓 0.1.0 发布（Server `c15428f0002f6bb0ceeff05c7cbcf842bd3d3148`、Web `963df360ed18bc1c604652a13edb2a7ed0be8963`，tag/Release `0.1.0`，Actions 均成功）；P60 整体终态同步方向已归档 `passed/direction-v0.1.0-oa-completion-terminal-sync.md`（最终复核 01 PASSED）。R8 五外部渠道（短信/飞书/钉钉/企业微信/邮件真实成功/失败/恢复）固定记录为 `Owner延期 / 未验证`，P2 待办 `todo/i6-external-notification-channels-real-verification.md` 等待 Owner 重新排期并提供外部条件，不阻塞 I6 本轮通过、不改写为真实通过。R7 三仓 DIRTY 内容指纹与 I6 本地候选（Server `e941d74`、Web `0a746e3`）作为历史阶段证据保留；0.1.0 发布身份以两仓 main、annotated tag 与公开 Release `0.1.0` 为准（Workspace 根 `release/0.1.0/*` 不是发布权威）。P53 视觉/Web 基线只证明 P53；I5 三 Provider 例外不外推 I6。";

const NEW_EVENT = "2026-09-21 P53 阶段三终态同步（本回执 `product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md`）：按 `ready/direction-p53-global-ui-component-layout-terminal-sync.md` 的唯一终态值清单，把 P53 机械写为 `COMPLETED（待规划确认，2026-09-21）`、功能级验收锁定为 `PASSED（2026-09-21）`、P53 已核销（待规划确认）、正式业务功能数 44→45，并把 P53 视觉/Web 验证基线集合登记为只证明 P53 的证据（Server/Flyway 不为 P53 晋级）；90 明细 ✅46/🟦22/⬜22、ADV64 与其余开放 P 编号零变化；P53 主方向保持 `passed/`，阶段三方向仍在 `ready/` 待 Planner 归档；未运行工程构建/测试/迁移、未执行浏览器验收、未改业务代码、未 commit/push/合并/tag/Release。";

const NEW_BULLET53 = "- 上轮完成：**P53 阶段三终态同步**（方向 `product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md`；回执 `product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md`，`TERMINAL_SYNC_SUBMITTED`）：按唯一终态值清单把 P53 机械写为 `COMPLETED（待规划确认，2026-09-21）`、功能级 `PASSED（2026-09-21）`、P53 已核销（待规划确认）、正式业务功能数 44→45，并登记只证明 P53 的视觉/Web 验证基线集合（视觉 71 passed / 0 failed / 17 skipped、Vitest 1217+3、可见 FORMAL_FLOW 5 制品与 20 条真实 `/api/*`、节点06 安全偏差）；90 明细 ✅46/🟦22/⬜22、ADV64 与其余开放 P 编号零变化；P53 主方向保持 `passed/`，阶段三方向仍在 `ready/` 待 Planner 归档；未运行工程构建/测试/迁移、未改业务代码、未执行 Git 写动作";

const P53_BASE_SH = "；P53 视觉/Web 验证基线集合（2026-09-21，只证明 P53，不构成 Server/Flyway 晋级）：四门 exit 0（Vitest **134 files passed + 1 skipped、1217 passed + 3 skipped**）、lint 0 error / 458 个既有 warning、Playwright 视觉 **71 passed + 17 skipped、0 failed、exit 0**、可见 FORMAL_FLOW 5 个可回读制品与 20 条真实 `/api/*`、31 个适用设计节点 30 个阈值通过 + 节点06 规划确认的安全偏差（不写成 31/31）";

const NEXT_ACTION_SH = "| 唯一下一动作 | **等待 Planner 全文复核 P53 阶段三终态同步回执（`product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md`，`TERMINAL_SYNC_SUBMITTED`）；通过后按既定 P61→P53 集成顺序等待 Owner 授权统一合并并做受影响检查**（P53 功能级 `PASSED（2026-09-21）`、状态 `COMPLETED（待规划确认，2026-09-21）`；P61 已最终确认 `COMPLETED（规划已确认，2026-09-20）`；P60 已确认并发布）；正式业务功能数 45 与清单 ✅46/🟦22/⬜22、ADV64、开放 P 编号不变；0.1.0 两仓已发布并锁定，不得重复发布 |";

const RECORD_LINES = [
  "# 功能追踪：P53 全局 UI 与组件布局优化",
  "",
  "> 工作区统一知识库 — 正式业务功能登记（第 45 个正式功能，XL，P0）。",
  "> 可信度标记：CONFIRMED / REPORTED / ASSUMED / SUPERSEDED",
  "",
  "---",
  "",
  "## 1. 功能信息",
  "",
  "| 字段 | 值 |",
  "|------|-----|",
  "| 功能编号 | P53（需求池编号；不对应 Mxx-Fyy-zz 既有明细，不改变 90 明细与 I 集合） |",
  "| 功能名称 | 全局 UI 与组件布局优化 |",
  "| 功能目标 | 以 Owner 导出的 `docs/ui/`（上游 Figma `mbEKPcZv9pcchmElQanR5E`、page `0:1`，32 节点清单见 `search_task/p53-figma-ui-current-seams.md`）为离线视觉权威，统一重构用户端、管理端、登录、数据页、表单/流程设计器、审批与会签、流程中心及个人菜单的设计令牌、全局壳、导航与组件布局；真实业务行为、接口、权限、租户、数据与流程语义仍以现有产品契约为准 |",
  "| 创建日期 | 2026-08-30（Owner 补充需求定义）；2026-09-16 Figma 基线与插单；2026-09-21 功能级验收通过 |",
  "| 当前状态 | **COMPLETED（待规划确认，2026-09-21）**（功能级验收 `PASSED（2026-09-21）`；P53 已核销（待规划确认）；阶段三终态同步回执已提交，待 Planner 全文复核） |",
  "| 等级 / 优先级 | XL / P0 |",
  "| 涉及模块 | Web `src/styles/tokens.css`、`src/layouts/**`、`src/components/**`、`src/views/**`、`src/modules/**`、`src/assets/brand/**`、`e2e/visual/**`（视觉基线与正式浏览器证据）；Server 未因 P53 晋级任何基线 |",
  "",
  "---",
  "",
  "## 2. 方向与归档",
  "",
  "| 项 | 路径 |",
  "|---|---|",
  "| 主方向（已归档） | `product/p53-global-ui-component-layout/passed/direction-p53-global-ui-component-layout.md` |",
  "| 阶段三终态同步方向（仍在 `ready/`，待 Planner 归档） | `product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md` |",
  "| 功能级验收 | `product/p53-global-ui-component-layout/receipts/planning-review-p53-completion-12-passed.md`（**PASSED**，2026-09-21） |",
  "| 阶段三终态同步回执 | `product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md`（`TERMINAL_SYNC_SUBMITTED`，待 Planner 全文复核） |",
  "| 集成顺序记录 | `product/p53-global-ui-component-layout/receipts/planning-integration-order-p61-before-p53-merge-20260920.md`（P61 独立提交 Server `742adb8` / Web `d110ed8` 先保留；P53 结束后统一合并；locale 冲突须同时保留 P53 结构/新增键与 P61 八值 8/8） |",
  "",
  "---",
  "",
  "## 3. 交付事实（2026-09-21 功能级验收后锁定）",
  "",
  "| 维度 | 事实 |",
  "|---|---|",
  "| 设计对象 | 31 个适用设计节点均绑定正式生产组件树；节点06 按主方向 §2.3 接受「安全与真实能力优先」的记录性视觉偏差，不恢复未授权登录能力 |",
  "| 视觉颜色 | 1096/1096 适用声明色完成映射，`unmapped=0`、`fail=0`，最大 RGB 通道差 3 |",
  "| 桌面与响应式 | 1440/1920/1280 页面族完成设计核对；375 登录页及三个 H5 页面无碰撞、无横向滚动、主要操作可达 |",
  "| 真实行为 | 可见 headed FORMAL_FLOW 使用真实后端、真实验证码/RSA 会话、真实 T0 身份与真实表单对象；20 条 `/api/*` 请求可回读；11 类路由与补充 01/03 锁定真实链完成绑定 |",
  "| 能力边界 | 账号登录不出现未授权租户、记住登录或忘记密码能力；fixture 只承担 DESIGN_FIDELITY，不冒充正式业务证据 |",
  "| 工程门禁 | typecheck、Vitest、build、lint 均 exit 0；Vitest 134 files passed + 1 skipped、1217 tests passed + 3 skipped；lint 0 error / 458 个既有 warning |",
  "| 视觉回归 | Playwright 单 worker 视觉套件 **71 passed + 17 skipped、0 failed、exit 0**；34 个失败实例逐项分类收敛（G1—G12 账本），46 张快照清单前后一一对应（42 张精确更新、4 张不变） |",
  "| 验证基线集合 | 只证明 P53：Web 四门 exit 0、Vitest 1217+3、视觉 71/0/17、可见 FORMAL_FLOW 5 制品与 20 条真实 `/api/*`；Server/Flyway 不为 P53 晋级（沿用 0.1.0 终值 1362/0/0/0、V93） |",
  "| 边界 | 不改变业务逻辑、接口、权限、租户与数据语义；P61 机器错误语义与安全边界不得回退；不核销 P61、不改动 P60 发布身份与迁移终点 |",
  "",
  "---",
  "",
  "## 4. 状态与终态值",
  "",
  "- 功能级验收：**PASSED（2026-09-21）**（审查 12；主方向 §9 十八项标准逐项通过）。",
  "- 功能状态：**COMPLETED（待规划确认，2026-09-21）**；需求编号 **P53 已核销（待规划确认）**。",
  "- 计数：正式业务功能数 **44→45**（P53 为第 45 个正式功能）；清单 **✅46 / 🟦22 / ⬜22**（90）、**ADV64** 与 M/I/P 其余状态零变化。",
  "- 终态同步：回执 `receipts/terminal-sync-p53-global-ui-component-layout-01.md`（`TERMINAL_SYNC_SUBMITTED`）待 Planner 全文复核；复核通过前不自行写 `COMPLETED（规划已确认）`，不移动阶段三方向。",
  "- 下一动作：Planner 全文复核 P53 终态同步回执；通过后按既定 P61→P53 集成顺序等待 Owner 授权统一合并并做受影响检查。",
  "",
  "---",
  "> 登记说明：本文件由执行角色在 P53 阶段三终态同步轮按唯一终态值清单登记；不含业务代码与迁移。",
  ""
].join(LF) + LF;

const log = { task: "terminal-sync-p53-global-ui-component-layout-01", startedAt: new Date().toISOString(), replacements: [], created: [], failed: [] };

function read(rel) { return readFileSync(join(ROOT, rel), "utf8"); }

function write(rel, text) {
  if (text.indexOf(CR) >= 0) { throw new Error("CR detected in " + rel); }
  writeFileSync(join(ROOT, rel), text, "utf8");
}

function countOcc(text, from) { return text.split(from).length - 1; }

function applyReplace(rel, from, to) {
  const text = read(rel);
  const n = countOcc(text, from);
  if (n !== 1) { log.failed.push({ file: rel, kind: "replace", occurrences: n, anchor: from.slice(0, 90) }); return false; }
  write(rel, text.split(from).join(to));
  log.replacements.push({ file: rel, kind: "replace", anchor: from.slice(0, 90) });
  return true;
}

function replaceLine(rel, prefix, newLine) {
  const text = read(rel);
  const lines = text.split(LF);
  const hits = [];
  for (let i = 0; i < lines.length; i++) { if (lines[i].indexOf(prefix) === 0) { hits.push(i); } }
  if (hits.length !== 1) { log.failed.push({ file: rel, kind: "line", hits: hits.length, anchor: prefix.slice(0, 90) }); return false; }
  lines[hits[0]] = newLine;
  write(rel, lines.join(LF));
  log.replacements.push({ file: rel, kind: "line", anchor: prefix.slice(0, 90) });
  return true;
}

function transformLine(rel, prefix, fn) {
  const text = read(rel);
  const lines = text.split(LF);
  const hits = [];
  for (let i = 0; i < lines.length; i++) { if (lines[i].indexOf(prefix) === 0) { hits.push(i); } }
  if (hits.length !== 1) { log.failed.push({ file: rel, kind: "lineTransform", hits: hits.length, anchor: prefix.slice(0, 90) }); return false; }
  lines[hits[0]] = fn(lines[hits[0]]);
  write(rel, lines.join(LF));
  log.replacements.push({ file: rel, kind: "lineTransform", anchor: prefix.slice(0, 90) });
  return true;
}

function sliceReplace(rel, startAnchor, endAnchor, replacement) {
  const text = read(rel);
  const i = text.indexOf(startAnchor);
  if (i < 0 || countOcc(text, startAnchor) !== 1) { log.failed.push({ file: rel, kind: "slice", occurrences: countOcc(text, startAnchor), anchor: startAnchor.slice(0, 90) }); return false; }
  const j = text.indexOf(endAnchor, i);
  if (j < 0 || text.slice(i, j).indexOf(LF) >= 0) { log.failed.push({ file: rel, kind: "sliceEnd", anchor: endAnchor.slice(0, 90) }); return false; }
  write(rel, text.slice(0, i) + replacement + text.slice(j));
  log.replacements.push({ file: rel, kind: "slice", anchor: startAnchor.slice(0, 90) });
  return true;
}

function appendAtEnd(rel, addition) {
  const text = read(rel);
  write(rel, text + addition);
  log.replacements.push({ file: rel, kind: "append" });
  return true;
}

function createFile(rel, content) {
  write(rel, content);
  log.created.push({ file: rel, bytes: Buffer.byteLength(content, "utf8") });
  return true;
}

function memoryStats() {
  const dir = join(ROOT, "memory");
  const names = readdirSync(dir).filter(function (n) { return n.slice(-3) === ".md"; }).sort();
  const sizes = {};
  let total = 0;
  for (const n of names) { const s = statSync(join(dir, n)).size; sizes[n] = s; total += s; }
  return { total: total, sizes: sizes };
}

const memoryBefore = memoryStats();

// ---- knowledge/current-status.md
applyReplace(CS, "> 唯一当前快照；截至/同步点：2026-09-20。", "> 唯一当前快照；截至/同步点：2026-09-21。" + P53_HEAD);
sliceReplace(CS, "待 P53 结束后统一合并；当前活动功能=P53 ", "。P60 ", "待 P53 结束后统一合并；P53 终态同步待 Planner 全文复核，通过后按既定 P61→P53 集成顺序等待 Owner 授权统一合并并做受影响检查");
replaceLine(CS, "| 上一完成功能 | ", "| 上一完成功能 | `p53-global-ui-component-layout`（P53 全局 UI 与组件布局优化）：**功能级 `PASSED（2026-09-21）`、功能状态 `COMPLETED（待规划确认，2026-09-21）`**（功能级验收 `product/p53-global-ui-component-layout/receipts/planning-review-p53-completion-12-passed.md` **PASSED**），第 45 个正式功能；其前第 44 个为 `p21-iot-device-access`（P21，COMPLETED（规划已确认，2026-09-08）） |");
replaceLine(CS, "| 已完成功能数 | ", "| 已完成功能数 | **45** |");
applyReplace(CS, "（`allMatch=true`）；", "（`allMatch=true`）；" + P53_BASE);
applyReplace(CS, "**P61 已核销（规划已确认，2026-09-20）**；", "**P61 已核销（规划已确认，2026-09-20）**；**P53 已核销（待规划确认，2026-09-21）**；");
applyReplace(CS, "| 变更类型记录（历史事件，非当前值） | ", "| 变更类型记录（历史事件，非当前值） | " + NEW_EVENT);
sliceReplace(CS, "| 当前活动正式功能 | ", "；`v0.1.0-oa-completion`（P60，XL）：", "| 当前活动正式功能 | **无活动正式功能**：P53 `p53-global-ui-component-layout`（XL，P0）功能级 `PASSED（2026-09-21）`、功能状态 `COMPLETED（待规划确认，2026-09-21）`、已核销（待规划确认），阶段三终态同步回执已提交待 Planner 全文复核");
sliceReplace(CS, "| 当前活动交付任务 | P53 提示07 执行（", "）；P61 阶段三终态同步已确认", "| 当前活动交付任务 | P53 阶段三终态同步（方向 `product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md`；回执 `product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md`，机器 `TERMINAL_SYNC_SUBMITTED`，待 Planner 全文复核）");
applyReplace(CS, "| 最近审查 | ", "| 最近审查 | " + P53_REVIEW + " " + BSL + "| ");
replaceLine(CS, "- `p53-global-ui-component-layout`（P53 全局 UI 与组件布局优化，XL）：", "- `p53-global-ui-component-layout`（P53 全局 UI 与组件布局优化，XL）：功能级验收 **PASSED（2026-09-21）**（审查 12），功能状态 **`COMPLETED（待规划确认，2026-09-21）`**，P53 已核销（待规划确认），第 45 个正式功能；主方向已归档 `product/p53-global-ui-component-layout/passed/direction-p53-global-ui-component-layout.md`；阶段三终态同步方向 `product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md` 仍在 `ready/`（待 Planner 归档），回执 `receipts/terminal-sync-p53-global-ui-component-layout-01.md`（`TERMINAL_SYNC_SUBMITTED`）待 Planner 全文复核；任务登记 `knowledge/features/p53-global-ui-component-layout.md`。");
replaceLine(CS, "**继续执行 P53 提示07（", NEXT53);
applyReplace(CS, "- 历史状态与审计链：`knowledge/history/README.md`", "- P53 交付追踪：`knowledge/features/p53-global-ui-component-layout.md`；方向与回执：`product/p53-global-ui-component-layout/`（主方向已归档 `passed/`，阶段三方向在 `ready/` 待 Planner 归档，回执 `receipts/terminal-sync-p53-global-ui-component-layout-01.md`）" + LF + "- 历史状态与审计链：`knowledge/history/README.md`");
applyReplace(CS, "- 上轮完成：**P61 规划确认终态投影**（", NEW_BULLET53 + LF + "- 更早上轮完成：**P61 规划确认终态投影**（");
applyReplace(CS, "正式功能数 **44**（44/44 登记路径存在）", "正式功能数 **45**（45/45 登记路径存在：P53 为第 45 个正式功能，登记 `knowledge/features/p53-global-ui-component-layout.md`）");
replaceLine(CS, "- 当前唯一下一动作：", "- 当前唯一下一动作：**等待 Planner 全文复核 P53 阶段三终态同步回执并确认 P53 `COMPLETED（规划已确认）`**（方向 `product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md`）；通过后按既定 P61→P53 集成顺序等待 Owner 授权统一合并并做受影响检查（P60 整体终态同步方向已归档 `passed/direction-v0.1.0-oa-completion-terminal-sync.md`，最终复核 01 PASSED）");
applyReplace(CS, "（P61）；映射索引", "（P61）、`knowledge/features/p53-global-ui-component-layout.md`（P53）；映射索引");
applyReplace(CS, "；当前主任务 P53 `VERIFYING`；64 条 ADV", "；当前无活动正式功能（P53 已功能级 `PASSED（2026-09-21）`、终态同步待 Planner 复核，不属于未完成边界）；64 条 ADV");
applyReplace(CS, "P53 当前入口 `product/p53-global-ui-component-layout/receipts/planning-execution-prompt-p53-global-ui-component-layout-07.md`；I1 历史证据", "P53 阶段三入口 `product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md`（主方向已归档 `product/p53-global-ui-component-layout/passed/direction-p53-global-ui-component-layout.md`，任务登记 `knowledge/features/p53-global-ui-component-layout.md`）；I1 历史证据");

// ---- knowledge/session-handoff.md
sliceReplace(SH, "> 同步点：2026-09-20。**当前活动功能=", "；P61 全系统用户可见错误码", "> 同步点：2026-09-21。**当前无活动正式功能：P53 全局 UI 与组件布局优化（XL，P0）功能级 `PASSED（2026-09-21）`、功能状态 `COMPLETED（待规划确认，2026-09-21）`、已核销（待规划确认），阶段三终态同步回执 `product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md` 已提交（`TERMINAL_SYNC_SUBMITTED`）待 Planner 全文复核（阶段三方向 `product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md`，主方向已归档 `passed/`）");
sliceReplace(SH, "| 当前活动正式功能 | ", "；`v0.1.0-oa-completion`（P60 0.1.0 OA 全功能收口）", "| 当前活动正式功能 | **无活动正式功能**：P53 全局 UI 与组件布局优化（XL，P0）功能级 `PASSED（2026-09-21）`、功能状态 `COMPLETED（待规划确认，2026-09-21）`、已核销（待规划确认），阶段三终态同步待 Planner 全文复核");
applyReplace(SH, "**44**（p21-iot-device-access 为第 44 个正式功能，COMPLETED（规划已确认，2026-09-08））", "**45**（P53 全局 UI 与组件布局优化为第 45 个正式功能，功能级 `PASSED（2026-09-21）`、`COMPLETED（待规划确认，2026-09-21）`；其前第 44 个为 p21-iot-device-access，COMPLETED（规划已确认，2026-09-08））");
applyReplace(SH, "；**P61 已核销（规划已确认，2026-09-20）**；", "；**P61 已核销（规划已确认，2026-09-20）**；**P53 已核销（待规划确认，2026-09-21）**；");
applyReplace(SH, "**P53 全局 UI 与组件布局优化（XL，P0，`VERIFYING`，唯一入口提示07）**；", "**P53 全局 UI 与组件布局优化（XL，P0）功能级 `PASSED（2026-09-21）`、功能状态 `COMPLETED（待规划确认，2026-09-21）`、已核销（待规划确认），阶段三终态同步已提交待 Planner 全文复核**；");
replaceLine(SH, "| 唯一下一动作 | ", NEXT_ACTION_SH);
applyReplace(SH, "当前唯一规划入口：继续执行 P53 提示07（`product/p53-global-ui-component-layout/receipts/planning-execution-prompt-p53-global-ui-component-layout-07.md`）；", "当前唯一规划入口：P53 阶段三终态同步（方向 `product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md`；回执 `product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md` 已提交，待 Planner 全文复核）；");
replaceLine(SH, "- p53-global-ui-component-layout（P53，当前活动，XL/P0）：", "- p53-global-ui-component-layout（P53，XL/P0）：功能级 **`PASSED（2026-09-21）`**（审查 12，主方向 §9 十八项标准通过），功能状态 **`COMPLETED（待规划确认，2026-09-21）`**，已核销（待规划确认），第 45 个正式功能；主方向已归档 `product/p53-global-ui-component-layout/passed/direction-p53-global-ui-component-layout.md`，阶段三方向 `product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md` 待 Planner 归档；回执 `receipts/terminal-sync-p53-global-ui-component-layout-01.md`（`TERMINAL_SYNC_SUBMITTED`）待全文复核；任务登记 `knowledge/features/p53-global-ui-component-layout.md`。");
transformLine(SH, "| Web 基线 | ", function (l) { return l.slice(0, -2) + P53_BASE_SH + " |"; });

// ---- knowledge/feature-reconciliation-index.md
transformLine(IX, "- **已核销/完成（23）**：", function (l) {
  let s = l.split("（23）").join("（24）");
  s = s.split("、P54、").join("、P53、P54、");
  return s.slice(0, -1) + "；P53 于 2026-09-21 随 p53-global-ui-component-layout 核销（待规划确认））";
});
replaceLine(IX, "- **待 Owner 确认（1）**：", "- **待 Owner 确认（0）**：P53 已核销（待规划确认，2026-09-21），无待 Owner 确认编号");
applyReplace(IX, "（P61 全系统用户可见错误码与提示语人性化治理，`COMPLETED（规划已确认，2026-09-20）`，已核销）", "（P61 全系统用户可见错误码与提示语人性化治理，`COMPLETED（规划已确认，2026-09-20）`，已核销）；`knowledge/features/p53-global-ui-component-layout.md`（P53 全局 UI 与组件布局优化，第 45 个正式功能，功能级 `PASSED（2026-09-21）`、`COMPLETED（待规划确认，2026-09-21）`、已核销（待规划确认））");
applyReplace(IX, "下一动作=继续执行 P53 提示07（入口 `product/p53-global-ui-component-layout/receipts/planning-execution-prompt-p53-global-ui-component-layout-07.md`）", "下一动作=Planner 全文复核 P53 阶段三终态同步回执（方向 `product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md`，回执 `product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md`）");

// ---- memory/（四份摘要，保持每文件 <5KB、总量 <20KB）
applyReplace("memory/README.md", "- 当前摘要：`state.md`、`handoff.md`（截至2026-09-21；P53功能级`PASSED`、等待阶段三终态同步；P61已`COMPLETED（规划已确认）`并核销，独立提交先保留，P53终态后按Owner授权统一合并。P60/0.1.0已发布）", "- 当前摘要：`state.md`、`handoff.md`（截至2026-09-21；P53功能级`PASSED（2026-09-21）`、状态`COMPLETED（待规划确认，2026-09-21）`、已核销（待规划确认），正式功能数44→45，终态同步回执待Planner全文复核；P61已`COMPLETED（规划已确认）`并核销，独立提交先保留，通过后按Owner授权统一合并。P60/0.1.0已发布且锁定）");
applyReplace("memory/state.md", "> 当前规划（2026-09-21）：P53已功能级`PASSED`，唯一入口为阶段三终态同步方向；当前权威功能数仍44，完成同步并经规划复核后目标45。P61已`COMPLETED（规划已确认，2026-09-20）`并核销；独立提交先保留，P53终态后按Owner授权统一合并。P60/0.1.0与V93锁定。", "> 当前规划（2026-09-21）：P53阶段三终态同步已提交（功能级`PASSED（2026-09-21）`、状态`COMPLETED（待规划确认，2026-09-21）`、已核销（待规划确认）），正式业务功能数**45**；当前无活动正式功能，下一动作=Planner全文复核P53终态同步回执。P61已`COMPLETED（规划已确认，2026-09-20）`并核销；独立提交先保留，通过后按Owner授权统一合并。P60/0.1.0与V93锁定。");
applyReplace("memory/state.md", "> 最近完成基线：P21 **COMPLETED（规划已确认，2026-09-08）**，第44个正式功能；功能44、清单✅46/🟦22/⬜22、P21核销、I14关闭均锁定。正式计数以 `knowledge/current-status.md` 为准。", "> 上一位次基线：P21 **COMPLETED（规划已确认，2026-09-08）**，第44个正式功能；功能45（P53为第45个）、清单✅46/🟦22/⬜22、I14关闭均锁定。正式计数以 `knowledge/current-status.md` 为准。");
applyReplace("memory/state.md", "- 终态值：功能数 **44**；", "- 终态值：功能数 **45**（P53 第45个，待规划确认）；");
applyReplace("memory/state.md", "- P53：**功能级PASSED（2026-09-21），等待阶段三**。验收12确认主方向18项标准通过；视觉套件71通过/17跳过/0失败，四移动页、真实FORMAL_FLOW、颜色/节点及节点06安全偏差全部锁定。唯一入口=`product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md`。", "- P53：**功能级`PASSED（2026-09-21）`、状态`COMPLETED（待规划确认，2026-09-21）`、已核销（待规划确认），第45个正式功能**。验收12确认18项标准通过；视觉套件71通过/17跳过/0失败、Web四门exit0（Vitest 1217+3）、可见FORMAL_FLOW 5制品/20条真实`/api/*`、节点06安全偏差锁定；阶段三方向=`product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md`（回执`receipts/terminal-sync-p53-global-ui-component-layout-01.md`待Planner复核），主方向已归档`passed/`。");
applyReplace("memory/features.md", "> 规划侧最新同步点：2026-09-21（P53功能级`PASSED`、等待阶段三；P61=`COMPLETED（规划已确认，2026-09-20）`并已核销；P60=`COMPLETED（规划已确认）`且Server/Web `0.1.0`已发布；当前权威正式业务功能数仍为44、阶段三目标45、ADV64）。", "> 规划侧最新同步点：2026-09-21（P53功能级`PASSED（2026-09-21）`、`COMPLETED（待规划确认，2026-09-21）`、已核销（待规划确认）、正式业务功能数45；P61=`COMPLETED（规划已确认，2026-09-20）`并已核销；P60=`COMPLETED（规划已确认）`且Server/Web `0.1.0`已发布并锁定；清单✅46/🟦22/⬜22、ADV64）。");
applyReplace("memory/features.md", "；功能数 44；全量双向映射见", "；功能数 **45**（P53 为第 45 个正式功能）；全量双向映射见");
applyReplace("memory/features.md", "- P53（P0/XL）：**功能级PASSED（2026-09-21），等待阶段三终态同步**。视觉套件71 passed/17 skipped/0 failed，真实FORMAL_FLOW及节点06安全偏差均锁定；唯一入口=`product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md`。", "- P53（P0/XL）：**功能级`PASSED（2026-09-21）`、`COMPLETED（待规划确认，2026-09-21）`、已核销（待规划确认），第45个正式功能**。视觉套件71 passed/17 skipped/0 failed、Web四门exit0、真实FORMAL_FLOW与节点06安全偏差锁定；阶段三方向=`product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md`（主方向已归档`passed/`，回执待Planner复核）。");
applyReplace("memory/handoff.md", "P53 全局 UI 与组件布局优化已于2026-09-21功能级`PASSED`，当前等待阶段三机械终态同步与规划最终复核。P61用户提示语治理已`COMPLETED（规划已确认，2026-09-20）`并核销。", "P53 全局 UI 与组件布局优化的阶段三终态同步已提交（功能级`PASSED（2026-09-21）`、状态`COMPLETED（待规划确认，2026-09-21）`、已核销（待规划确认）、正式业务功能数44→45），当前等待规划最终复核。P61用户提示语治理已`COMPLETED（规划已确认，2026-09-20）`并核销。");
applyReplace("memory/handoff.md", "P53与P61的功能实现和验收均已收敛；当前只执行P53阶段三机械同步。两项独立提交继续保留，终态复核后再按Owner授权统一集成，冲突时同时保留P53结构/新增键与P61八值8/8。", "P53与P61的功能实现和验收均已收敛，P53阶段三机械同步已提交；当前只等待规划最终复核，随后按Owner授权统一集成（冲突时同时保留P53结构/新增键与P61八值8/8）。");
applyReplace("memory/handoff.md", "- P53：`product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md`。", "- P53：`product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md`（主方向已归档`passed/`；回执`receipts/terminal-sync-p53-global-ui-component-layout-01.md`待Planner复核）。");
applyReplace("memory/handoff.md", "当前权威功能数44，P53阶段三目标45；清单✅46/🟦22/⬜22、ADV64不变。", "当前权威功能数45（P53第45个，待规划确认）；清单✅46/🟦22/⬜22、ADV64不变。");
applyReplace("memory/handoff.md", "唯一下一动作：执行P53阶段三机械同步并提交`terminal-sync-p53-global-ui-component-layout-01.md`，由Planner最终复核；通过后再按既定P61→P53集成顺序等待Owner Git授权统一合并。", "唯一下一动作：Planner全文复核P53阶段三终态同步回执`product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md`；通过后再按既定P61→P53集成顺序等待Owner Git授权统一合并并做受影响检查。");

// ---- todo/requirement-pool.md
replaceLine(POOL, "**2026-09-21 当前排期**：", "**2026-09-21 当前排期**：P53阶段三终态同步已提交（回执`product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md`，`TERMINAL_SYNC_SUBMITTED`）：功能级`PASSED（2026-09-21）`、状态`COMPLETED（待规划确认，2026-09-21）`、已核销（待规划确认）；正式业务功能数44→45，清单✅46/🟦22/⬜22与ADV64不变。下一动作=Planner全文复核P53终态同步回执；通过后按既定P61→P53集成顺序等待Owner授权统一合并并做受影响检查。P61已`COMPLETED（规划已确认）`并核销，独立提交先保留。");
applyReplace(POOL, "当前执行[P53阶段三终态同步](../product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md)。", "P53阶段三终态同步已提交（[方向](../product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md)、回执[terminal-sync-p53-global-ui-component-layout-01.md](../product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md)，`TERMINAL_SYNC_SUBMITTED`），等待Planner全文复核；正式业务功能数44→45。");
replaceLine(POOL, "| P53 | 全局 UI 与组件布局优化 |", "| P53 | 全局 UI 与组件布局优化 | Owner 2026-08-30、2026-09-13、2026-09-16、2026-09-17、2026-09-18、2026-09-19、2026-09-21；优先级P0；XL；[阶段三方向](../product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md) | 功能级`PASSED（2026-09-21）`、状态`COMPLETED（待规划确认，2026-09-21）`、已核销（待规划确认）；[终态同步回执](../product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md)`TERMINAL_SYNC_SUBMITTED`，待Planner全文复核；正式业务功能数44→45、第45个正式功能 |");
replaceLine(POOL, "功能级`PASSED（2026-09-21）`，等待阶段三终态同步与规划最终复核；当前唯一入口为", "功能级`PASSED（2026-09-21）`、功能状态`COMPLETED（待规划确认，2026-09-21）`、已核销（待规划确认）；阶段三终态同步回执`product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md`（`TERMINAL_SYNC_SUBMITTED`）待Planner全文复核，当前唯一入口为 `product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md`。终态目标已落实：正式业务功能数44→45、清单✅46/🟦22/⬜22与ADV64不变、只晋级P53实际涉及的Web/视觉/正式浏览器基线（Server/Flyway不变）。P61 保持 `COMPLETED（规划已确认，2026-09-20）` 并已核销，独立提交先保留；P53终态复核后按Owner授权统一合并。");

// ---- 项目功能清单（仅同步正式功能总数与当前说明，不改动任何 Mxx-Fxx 行）
applyReplace(FLIST, "；功能数 **44**（44/44 登记路径存在，不改变计数）。", "；功能数 **45**（P53 全局 UI 与组件布局优化 2026-09-21 功能级 `PASSED`、`COMPLETED（待规划确认）` 后由 44→45；登记路径 45/45 存在，P53 登记 `knowledge/features/p53-global-ui-component-layout.md`）。");
applyReplace(FLIST, "当前主任务入口=`product/p53-global-ui-component-layout/receipts/planning-execution-prompt-p53-global-ui-component-layout-07.md`（P53 全局 UI 与组件布局优化，提示07），当前唯一下一动作见 `knowledge/current-status.md`。", "P53 主方向已归档 `product/p53-global-ui-component-layout/passed/direction-p53-global-ui-component-layout.md`，阶段三终态同步方向 `product/p53-global-ui-component-layout/ready/direction-p53-global-ui-component-layout-terminal-sync.md` 待 Planner 归档；当前唯一下一动作见 `knowledge/current-status.md`。");
applyReplace(FLIST, "不并入已完成功能数 44。", "不并入已完成功能数 45。");

// ---- 阶段三方向自身状态指针（方向仍留在 ready/）
appendAtEnd(DIR, LF + "---" + LF + LF + "> 执行侧状态指针（2026-09-21）：终态同步已提交，回执 `product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md`（`TERMINAL_SYNC_SUBMITTED`）；本方向按契约保留在 `ready/`，待 Planner 全文复核后归档 `passed/`；执行侧不自行写 `COMPLETED（规划已确认）`、不移动本方向。" + LF);

// ---- P53 功能记录（新增）
createFile(FREC, RECORD_LINES);

const memoryAfter = memoryStats();
log.memory = { before: memoryBefore, after: memoryAfter, maxFileAfter: Math.max.apply(null, Object.keys(memoryAfter.sizes).map(function (k) { return memoryAfter.sizes[k]; })) };
writeFileSync(join(EVID, "apply-log.json"), JSON.stringify(log, null, 2), "utf8");
console.log("replacements=" + log.replacements.length + " created=" + log.created.length + " failed=" + log.failed.length);
console.log("memory before=" + memoryBefore.total + " after=" + memoryAfter.total + " maxFileAfter=" + log.memory.maxFileAfter);
if (log.failed.length > 0) { console.log(JSON.stringify(log.failed, null, 2)); }
process.exit(log.failed.length === 0 ? 0 : 1);
