import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

// 生成本轮（集成 + 投影）机器终态：替换回执末行占位符并产出 Validator 输入与一致性证据。
const ROOT = process.argv[2];
const EVID = process.argv[3];
const LF = String.fromCharCode(10);
const REC = "product/p53-global-ui-component-layout/receipts/p53-p61-integration-and-projection-01.md";
const MARKER = "ENGINE_TERMINAL ";
const PLACEHOLDER = "__TERMINAL_JSON__";
const EV = "product/p53-global-ui-component-layout/receipts/evidence/p53-p61-integration-01";

const terminal = {
  schema: "agent-coding-engine.executor-terminal.v2",
  role: "executor",
  state: "TERMINAL_SYNC_SUBMITTED",
  task_level: "XL",
  receipt: REC,
  feature_status: "COMPLETED",
  evidence: [
    REC,
    "product/p53-global-ui-component-layout/receipts/planning-final-review-terminal-sync-p53-global-ui-component-layout-01-passed.md",
    "product/p53-global-ui-component-layout/receipts/planning-integration-order-p61-before-p53-merge-20260920.md",
    EV + "/web-push-feature.log",
    EV + "/server-push-feature.log",
    EV + "/web-merge-p53.log",
    EV + "/server-merge.log",
    EV + "/web-tree-equality.txt",
    EV + "/locale-8value-check.json",
    EV + "/web-gate-typecheck.log",
    EV + "/web-gate-lint.log",
    EV + "/web-gate-test.log",
    EV + "/web-gate-build.log",
    EV + "/server-targeted-surefire-summary.txt",
    EV + "/web-push-develop.log",
    EV + "/server-push-develop.log",
    EV + "/projection-02.log",
    "knowledge/current-status.md + session-handoff.md + feature-reconciliation-index.md + features/p53-global-ui-component-layout.md（P53 规划已确认、双方向 passed、已集成、下一动作=无）",
    "memory/README.md + state.md + features.md + handoff.md（终态摘要，总 19410 bytes）",
    "todo/requirement-pool.md + Smart-WorkFlow-aPaaS-server/功能清单.md（需求池与正式功能总数 45）",
  ],
  memory_compression: { before_bytes: 19046, after_bytes: 19410 },
  work_items: [
    { id: "IN1-commit-push", status: "COMPLETED", authorized: true, dependency_satisfied: true, actionable: false, next_action: "两仓改动已提交并推送（Web 29d90e8；Server 42cbc86/6698b8c），远端回读一致" },
    { id: "IN2-merge-web", status: "COMPLETED", authorized: true, dependency_satisfied: true, actionable: false, next_action: "Web develop 已按 P61→P53 合并（fc37608）并推送；合并树与 P53 分支逐字节一致" },
    { id: "IN3-merge-server", status: "COMPLETED", authorized: true, dependency_satisfied: true, actionable: false, next_action: "Server develop 已合并（fa96290）并推送；《功能清单》冲突按 develop 基准 + P53 终态值消解" },
    { id: "IN4-affected-checks", status: "COMPLETED", authorized: true, dependency_satisfied: true, actionable: false, next_action: "Web 四连 exit 0 ＋ locale 八值 8/8；Server compile exit 0 ＋ 聚焦测试 35/0/0/0" },
    { id: "IN5-state-projection", status: "COMPLETED", authorized: true, dependency_satisfied: true, actionable: false, next_action: "knowledge/memory/todo/工程《功能清单》已投影为规划已确认 + 已集成；memory 19410 bytes" },
    { id: "IN6-receipt-terminal", status: "COMPLETED", authorized: true, dependency_satisfied: true, actionable: false, next_action: "本回执与 Validator 证据已归档，机器终态 TERMINAL_SYNC_SUBMITTED" },
  ],
  remaining_actionable_count: 0,
  independent_work_exhausted: true,
  next_action: "等待 Owner/Planner 下发下一轮任务；当前无活动正式功能、无待执行方向；0.1.0 发布身份未改动、不得重复发布",
  next_action_type: "WAIT_PLANNER",
  progress_fingerprint: "p53-p61-integration:commits-web-29d90e8-server-42cbc86-6698b8c|merges-fc37608-fa96290|pushed-develop-readback-ok|web-gates-4-green|locale-8-8|server-compile-0-plus-35-tests|projection-done",
  progress_basis: {
    files_changed: [
      "Smart-WorkFlow-aPaaS-Web：29d90e8（178 files）＋ 合并 fc37608（P61 d110ed8 + P53 29d90e8）",
      "Smart-WorkFlow-aPaaS-server：42cbc86、6698b8c ＋ 合并 fa96290（P61 742adb8 + P53 改动）",
      "knowledge/current-status.md、session-handoff.md、feature-reconciliation-index.md、features/p53-global-ui-component-layout.md",
      "memory/README.md、state.md、features.md、handoff.md",
      "todo/requirement-pool.md、Smart-WorkFlow-aPaaS-server/功能清单.md",
      "product/p53-global-ui-component-layout/receipts/p53-p61-integration-and-projection-01.md 与 evidence/p53-p61-integration-01/",
    ],
    tool_actions: [
      "两仓提交与推送（feature 分支），按 P61→P53 顺序合并入 develop 并推送（Web 快进+合并、Server 合并+冲突消解）",
      "Web 四连门禁（NODE_OPTIONS=2G）与合并后 locale 八值复算",
      "Server compile 门与 5 个聚焦测试类（35 tests）",
      "状态投影脚本 apply-projection-01/02 与远端回读（git rev-parse、status --porcelain）",
    ],
    new_evidence: [
      "web-gate-typecheck/lint/test/build.log（四连 exit 0；134 files + 1 skipped、1217 + 3 skipped、0 error/458 warning）",
      "locale-8value-check.json（allMatch=true，missing=0，duplicate=0）",
      "web-tree-equality.txt（合并结果与 P53 分支树 0 行差异）",
      "server-targeted-surefire-summary.txt（35/0/0/0）与 server-gate-targeted-tests.log",
      "web-push-feature.log、server-push-feature.log、web-push-develop.log、server-push-develop.log（推送与远端回读）",
      "projection-01.log、projection-02.log（投影命中记录）",
    ],
    closed_work_items: ["IN1-commit-push", "IN2-merge-web", "IN3-merge-server", "IN4-affected-checks", "IN5-state-projection", "IN6-receipt-terminal"],
  },
  stop_reason: "WAITING_FOR_PLANNER",
  tool_results: [
    { tool: "git commit / git push（两仓 feature 分支）", outcome: "SUCCEEDED", detail: "Web 674bad9..29d90e8；Server c29f4ba..6698b8c；远端回读一致" },
    { tool: "git merge（Web：P61 快进 + P53 合并）", outcome: "SUCCEEDED", detail: "develop 50060cf→d110ed8→fc37608；合并树与 P53 分支 0 行差异" },
    { tool: "git merge（Server：P61 + P53）", outcome: "SUCCEEDED", detail: "develop 0514c1f→fa96290；《功能清单》冲突按 develop 基准 + P53 终态值消解，无标记残留" },
    { tool: "git push（两仓 develop）", outcome: "SUCCEEDED", detail: "Web 50060cf..fc37608；Server 0514c1f..fa96290；origin 回读一致" },
    { tool: "pnpm typecheck/lint/test/build（合并后 develop）", outcome: "SUCCEEDED", detail: "四门 exit 0；测试 134 files passed + 1 skipped / 1217 passed + 3 skipped；lint 0 error / 458 warning" },
    { tool: "locale-8value-check.mjs", outcome: "SUCCEEDED", detail: "P61 八值 8/8 逐字一致，missing=0、duplicate=0，exit 0" },
    { tool: "mvn compile + 聚焦测试", outcome: "SUCCEEDED", detail: "compile exit 0；5 类 35 tests / 0 failures / 0 errors / 0 skipped" },
    { tool: "mvn 聚焦测试（首次调用）", outcome: "FAILED", detail: "surefire 参数名写成 failIfNoTests 导致无匹配即失败（sw-common 模块）；改用 -Dsurefire.failIfNoSpecifiedTests=false 后通过，属命令参数修正、非测试失败" },
  ],
  browser_status: "NOT_APPLICABLE",
};

const json = JSON.stringify(terminal);
const p = join(ROOT, REC);
let text = readFileSync(p, "utf8");
if (text.split(PLACEHOLDER).length - 1 !== 1) { throw new Error("placeholder not unique"); }
text = text.split(PLACEHOLDER).join(json);
while (text.length > 1 && text.slice(-2) === LF + LF) { text = text.slice(0, -1); }
writeFileSync(p, text, "utf8");

const lines = readFileSync(p, "utf8").split(LF).filter(function (l) { return l.length > 0; });
const last = lines[lines.length - 1];
if (last.indexOf(MARKER) !== 0) { throw new Error("last line is not a terminal line"); }
const extracted = last.slice(MARKER.length);
writeFileSync(join(EVID, "validator-integration/input.json"), extracted, "utf8");
writeFileSync(join(EVID, "validator-integration/lastline-extracted.json"), extracted, "utf8");
const negative = JSON.parse(extracted);
delete negative.feature_status;
writeFileSync(join(EVID, "validator-integration/negative-input.json"), JSON.stringify(negative), "utf8");
function sha(s) { return createHash("sha256").update(Buffer.from(s, "utf8")).digest("hex"); }
const inputSha = sha(readFileSync(join(EVID, "validator-integration/input.json"), "utf8"));
const receiptText = readFileSync(p, "utf8");
const compare = [
  "receipt_last_line_json_sha256=" + sha(extracted),
  "validator_input_sha256=" + inputSha,
  "json_match=" + (sha(extracted) === inputSha),
  "receipt_sha256=" + sha(receiptText),
  "last_line_prefix=" + MARKER,
  "receipt_bytes=" + Buffer.byteLength(receiptText, "utf8"),
  "receipt_ends_with_single_newline=" + (receiptText.slice(-1) === LF && receiptText.slice(-2) !== LF + LF),
].join(LF) + LF;
writeFileSync(join(EVID, "terminal-lastline-compare-integration.txt"), compare, "utf8");
console.log(compare);

