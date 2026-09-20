import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

// 正文修订后重建末行证据：规范化尾部空行，重新抽取末行 JSON 并复算哈希。
const ROOT = process.argv[2];
const EVID = process.argv[3];
const LF = String.fromCharCode(10);
const REC = "product/p53-global-ui-component-layout/receipts/terminal-sync-p53-global-ui-component-layout-01.md";
const MARKER = "ENGINE_TERMINAL ";

const p = join(ROOT, REC);
let text = readFileSync(p, "utf8");
while (text.length > 1 && text.slice(-2) === LF + LF) { text = text.slice(0, -1); }
writeFileSync(p, text, "utf8");

const lines = readFileSync(p, "utf8").split(LF).filter(function (l) { return l.length > 0; });
const last = lines[lines.length - 1];
if (last.indexOf(MARKER) !== 0) { throw new Error("last line is not a terminal line"); }
const extracted = last.slice(MARKER.length);
writeFileSync(join(EVID, "validator/input.json"), extracted, "utf8");
writeFileSync(join(EVID, "validator/lastline-extracted.json"), extracted, "utf8");
const negative = JSON.parse(extracted);
delete negative.feature_status;
writeFileSync(join(EVID, "validator/negative-input.json"), JSON.stringify(negative), "utf8");

function sha(s) { return createHash("sha256").update(Buffer.from(s, "utf8")).digest("hex"); }
const inputSha = sha(readFileSync(join(EVID, "validator/input.json"), "utf8"));
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
writeFileSync(join(EVID, "terminal-lastline-compare.txt"), compare, "utf8");
console.log(compare);

