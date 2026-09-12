// i3-07 evidence lib: in-memory login tokens, authed API, JDBC SQL, transcript with redaction
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';

const PG_URL = 'jdbc:postgresql://localhost:50886/smart_workflow';
const CP = '.;C:/Users/hjxch/.m2/repository/org/postgresql/postgresql/42.7.5/postgresql-42.7.5.jar';
export const SNAPSHOT = {
  source: 'Smart-WorkFlow-aPaaS-server develop=c18d074 (fix deadline notify tx; parent f7101c873aff09cbaf50da00f634c4a5f4cd58c8)',
  runtime_jar_sha256: '74926960ff615681f3064e4061e3622480e8e56fdcfce94caf2d0f12738c73ad',
  frozen_e_jar_sha256: '90d8bb895a129d523c67e327807840192c606d2fbee44ed7e049d0cc298a16ba',
  runtime_rebuild_note: '换机恢复性重打包（非代码修改），见 R1/runtime-rebuild.txt',
  instance_A: 'PID 34124 @ 8081',
  instance_B: 'PID 31072 @ 8082'
};

const tokens = new Map(); // user -> {port->token}
export async function login(port, user, pass = 'admin123') {
  const k = user + '@' + port;
  if (tokens.has(k)) return tokens.get(k);
  const base = `http://localhost:${port}/api`;
  const ch = await (await fetch(`${base}/auth/challenge`)).json();
  const pubPem = `-----BEGIN PUBLIC KEY-----\n${(ch.data.publicKey.match(/.{1,64}/g) || []).join('\n')}\n-----END PUBLIC KEY-----`;
  const enc = crypto.publicEncrypt({ key: pubPem, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, Buffer.from(pass));
  const resp = await (await fetch(`${base}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user, password: enc.toString('base64'), captcha: '1234', captchaId: ch.data.captchaId, timestamp: String(Date.now()) }) })).json();
  const tok = resp?.data?.accessToken;
  if (!tok) throw new Error('LOGIN_FAIL ' + user + ' ' + JSON.stringify(resp).slice(0, 200));
  tokens.set(k, tok);
  return tok;
}

let rawDir = null;
export function setRawDir(d) { rawDir = d; fs.mkdirSync(d, { recursive: true }); }
let rawSeq = 0;
function rawLog(entry) {
  if (!rawDir) return;
  fs.appendFileSync(rawDir + '/raw-transcript.txt', JSON.stringify(entry) + '\n');
}
export async function api(port, token, method, path, body) {
  const opt = { method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token } };
  if (body !== undefined) opt.body = JSON.stringify(body);
  const resp = await fetch(`http://localhost:${port}/api${path}`, opt);
  const text = await resp.text();
  let r; try { r = JSON.parse(text); } catch { r = { raw: text.slice(0, 300) }; }
  rawSeq++;
  rawLog({ seq: rawSeq, ts: new Date().toISOString(), method, path: path.replace(/access[Tt]oken=[^&]+/g, 'access_token=[REDACTED]'), httpStatus: resp.status, reqBody: body === undefined ? null : JSON.parse(JSON.stringify(body)), respCode: r.code, respMsg: r.msg, respSnippet: JSON.stringify(r).slice(0, 1500) });
  return [resp.status, r];
}

export function q(sql) {
  try {
    const out = execFileSync('java', ['-cp', CP, 'Query', PG_URL, 'postgres', 'postgres', sql], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return out.split('\n').map(l => l.replace(/\r$/, '')).filter(l => l.length > 0);
  } catch (e) {
    return [];
  }
}

export function sha256(text) { return crypto.createHash('sha256').update(text).digest('hex'); }
export function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
export function save(rel, obj) { fs.mkdirSync(rel.split('/').slice(0, -1).join('/'), { recursive: true }); fs.writeFileSync(rel, JSON.stringify(obj, null, 1)); }
export function uuid8() { return crypto.randomBytes(4).toString('hex'); }
export { tokens };
