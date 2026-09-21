// 组装补证回执 02：正文（receipt-body.md，@BT@ 占位还原为反引号）+ 机器终态末行，并做末行字节一致性比对。
import { readFileSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const WS = 'E:/code/Smart-WorkFlow-Agent-Workspace';
const EV = WS + '/product/v0.1.0-p53-p61-production-release/receipts/evidence/terminal-sync-production-release-02';
const RCPT = WS + '/product/v0.1.0-p53-p61-production-release/receipts/terminal-sync-production-release-02.md';
const BT = String.fromCharCode(96);

const body = readFileSync(EV + '/receipt-body.md', 'utf8').split('@BT@').join(BT);
const terminalLine = readFileSync(EV + '/terminal-line.txt', 'utf8').trim();
const receipt = body + terminalLine + '\n';
writeFileSync(RCPT, receipt, 'utf8');

const lastLine = receipt.split('\n').filter((l) => l.length > 0).pop();
const prefix = 'ENGINE_TERMINAL ';
const okPrefix = lastLine.indexOf(prefix) === 0;
const jsonPart = okPrefix ? lastLine.slice(prefix.length) : lastLine;
const validatorInput = readFileSync(EV + '/validator/input.json', 'utf8');
const hLast = createHash('sha256').update(jsonPart, 'utf8').digest('hex');
const hInput = createHash('sha256').update(validatorInput, 'utf8').digest('hex');
const lines = [
  'receipt=' + RCPT,
  'receipt_bytes=' + Buffer.byteLength(receipt, 'utf8'),
  'last_physical_line_has_ENGINE_TERMINAL_prefix=' + okPrefix,
  'lastline_json_sha256=' + hLast,
  'validator_input_sha256=' + hInput,
  'identical=' + (hLast === hInput && jsonPart === validatorInput)
];
writeFileSync(EV + '/lastline-compare.txt', lines.join('\n') + '\n', 'utf8');
console.log(lines.join('\n'));
process.exit(jsonPart === validatorInput && okPrefix ? 0 : 1);
