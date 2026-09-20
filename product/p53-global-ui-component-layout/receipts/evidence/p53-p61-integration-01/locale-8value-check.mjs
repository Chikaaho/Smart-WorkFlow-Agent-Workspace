import { readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

// 合并受影响检查：合并后 develop 的两个 locale 文件 4 目标键 × 2 语言与 P61 锁定提交 d110ed8 逐字比较。
const ROOT = process.argv[2];
const OUT = process.argv[3];
const WEB = join(ROOT, "Smart-WorkFlow-aPaaS-Web");
const COMMIT = "d110ed8";
const KEYS = ["errDynamicTableExists", "errFieldTypeUnknown", "errOperatorTypeMismatch", "errOperatorUnsupported"];
const Q = String.fromCharCode(39);
const BS = String.fromCharCode(92);

function gitShow(spec) {
  return execFileSync("git", ["-c", "safe.directory=" + WEB.split(BS).join("/"), "-C", WEB, "show", spec], { encoding: "utf8" });
}

function buildKeyPattern(key) {
  const wb = BS + "b";
  return new RegExp(wb + key + wb + BS + "s*:" + BS + "s*" + Q + "((?:[^" + Q + BS + BS + "]|" + BS + BS + ".)*)" + Q, "gs");
}

function extractValues(source, key) {
  const re = buildKeyPattern(key);
  return [...source.matchAll(re)].map(function (m) { return m[1]; });
}

const results = [];
let missingCount = 0;
let duplicateCount = 0;
for (const pair of [["zh-CN", "src/locales/zh-CN.ts"], ["en-US", "src/locales/en-US.ts"]]) {
  const lang = pair[0];
  const file = pair[1];
  const actualSrc = readFileSync(join(WEB, file), "utf8");
  const expectedSrc = gitShow(COMMIT + ":" + file);
  for (const key of KEYS) {
    const expected = extractValues(expectedSrc, key);
    const actual = extractValues(actualSrc, key);
    const missing = expected.length === 0 || actual.length === 0;
    const duplicate = expected.length > 1 || actual.length > 1;
    if (missing) { missingCount++; }
    if (duplicate) { duplicateCount++; }
    results.push({ key: key, lang: lang, expected: expected.length === 1 ? expected[0] : null, actual: actual.length === 1 ? actual[0] : null, match: expected.length === 1 && actual.length === 1 && expected[0] === actual[0], expectedOccurrences: expected.length, actualOccurrences: actual.length, missing: missing, duplicate: duplicate });
  }
}

const allMatch = results.every(function (r) { return r.match && !r.missing && !r.duplicate; });
const head = execFileSync("git", ["-c", "safe.directory=" + WEB.split(BS).join("/"), "-C", WEB, "rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const out = { check: "C2-V 合并后 develop locale 八值逐字比较", date: new Date().toISOString(), mergedTree: { path: WEB, head: head }, expectedCommit: COMMIT, comparisons: results, missingCount: missingCount, duplicateCount: duplicateCount, allMatch: allMatch };
if (OUT) { writeFileSync(OUT, JSON.stringify(out, null, 2), "utf8"); }
console.log(JSON.stringify({ allMatch: allMatch, missingCount: missingCount, duplicateCount: duplicateCount, matches: results.map(function (r) { return r.match; }) }));
process.exit(allMatch ? 0 : 1);
