// 用法: node login.mjs <port> <username> [password] [rawOutFile]
import { appendFileSync } from 'node:fs';
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
if (rawOut) {
  appendFileSync(rawOut,
    `===== LOGIN CHAIN ${new Date().toISOString()} =====\nGET /api/auth/challenge (用户名=${username} 端口=${port})\n----- RESP -----\n${JSON.stringify(ch)}\n` +
    `----- REQ POST /api/auth/login -----\n${JSON.stringify({ username, password: `RSA-OAEP(base64 ${enc.length} chars)`, captcha: '1234', captchaId, timestamp: 'masked' })}\n----- RESP -----\n${JSON.stringify(resp)}\n\n`);
}
if (resp.code !== 0) { console.error('LOGIN_FAIL ' + JSON.stringify(resp)); process.exit(1); }
console.log(resp.data.accessToken);
