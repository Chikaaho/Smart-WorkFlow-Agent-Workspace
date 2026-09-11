// 用法: node login.mjs <port> <username> [password] [rawOutFile]
import { appendFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
const [port, username, password = '[REDACTED_PASSWORD]', rawOut] = process.argv.slice(2);
const base = `http://localhost:${port}/api`;
const ch = await (await fetch(`${base}/auth/challenge`)).json();
const { captchaId, publicKey } = ch.data;
const spki = Buffer.from(publicKey, 'base64');
const key = await crypto.subtle.importKey('spki', spki, { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['encrypt']);
const ct = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, new TextEncoder().encode(password));
const enc = Buffer.from(new Uint8Array(ct)).toString('base64');
const resp = await (await fetch(`${base}/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username, password: enc, captcha: '1234', captchaId, timestamp: String(Date.now()) }),
})).json();
// rawOut 中凭证一律脱敏：token 正文不落盘，仅记录长度与 sha256 前 16 位。
const maskToken = (v) => {
  if (typeof v !== 'string' || !/^[A-Za-z0-9_\-]{20,}(\.[A-Za-z0-9_\-]+)*$/.test(v)) return '[REDACTED]';
  return `[REDACTED len=${v.length} sha256=${createHash('sha256').update(v).digest('hex').slice(0, 16)}]`;
};
const maskResp = (r) => {
  const d = r && r.data ? r.data : {};
  const masked = {};
  for (const [k, v] of Object.entries(d)) masked[k] = /(token|Token)/.test(k) ? maskToken(v) : v;
  return JSON.stringify({ ...r, data: masked });
};
if (rawOut) {
  appendFileSync(rawOut,
    `===== LOGIN CHAIN ${new Date().toISOString()} =====\nGET /api/auth/challenge (用户名=${username} 端口=${port})\n----- RESP -----\n${JSON.stringify(ch)}\n` +
    `----- REQ POST /api/auth/login -----\n${JSON.stringify({ username, password: `RSA-OAEP(base64 ${enc.length} chars)`, captcha: '1234', captchaId, timestamp: 'masked' })}\n----- RESP -----\n${maskResp(resp)}\n\n`);
}
if (resp.code !== 0) { console.error('LOGIN_FAIL ' + JSON.stringify(resp)); process.exit(1); }
console.log(resp.data.accessToken);
