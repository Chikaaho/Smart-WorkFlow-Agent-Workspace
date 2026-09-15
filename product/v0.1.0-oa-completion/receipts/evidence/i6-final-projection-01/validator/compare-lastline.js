// Byte comparison: projection receipt physical last line (minus prefix) vs validator/input.json.
'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = 'E:/code/Smart-WorkFlow-Agent-Workspace';
const receipt = fs.readFileSync(
  path.join(ROOT, 'product/v0.1.0-oa-completion/receipts/final-state-projection-stage-i6-v0.0.3-oa-iteration-01.md'),
  'utf8',
);
const input = fs.readFileSync(
  path.join(ROOT, 'product/v0.1.0-oa-completion/receipts/evidence/i6-final-projection-01/validator/input.json'),
  'utf8',
);

const trimmed = receipt.replace(/\n+$/, '');
const lines = trimmed.split('\n');
const lastLine = lines[lines.length - 1];
const PREFIX = 'ENGINE_TERMINAL ';
const payload = lastLine.startsWith(PREFIX) ? lastLine.slice(PREFIX.length) : null;
const expected = input.replace(/\n+$/, '');
const sha = (value) => crypto.createHash('sha256').update(value, 'utf8').digest('hex');
const equal = payload === expected;

const report = [
  '# Last-line byte comparison (projection receipt vs validator/input.json)',
  'receipt: product/v0.1.0-oa-completion/receipts/final-state-projection-stage-i6-v0.0.3-oa-iteration-01.md',
  'input:   product/v0.1.0-oa-completion/receipts/evidence/i6-final-projection-01/validator/input.json',
  `last line count of receipt: ${lines.length}`,
  `last line starts with prefix: ${lastLine.startsWith(PREFIX)}`,
  `sha256(payload): ${payload ? sha(payload) : 'n/a'}`,
  `sha256(input):   ${sha(expected)}`,
  `cmp (byte equal): ${equal ? 0 : 1}`,
  equal ? 'RESULT: cmp=0 (identical)' : 'RESULT: cmp!=0 (mismatch)',
  '',
].join('\n');

fs.writeFileSync(
  path.join(ROOT, 'product/v0.1.0-oa-completion/receipts/evidence/i6-final-projection-01/readback/lastline-compare.txt'),
  report,
  'utf8',
);
console.log(report);
process.exit(equal ? 0 : 1);
