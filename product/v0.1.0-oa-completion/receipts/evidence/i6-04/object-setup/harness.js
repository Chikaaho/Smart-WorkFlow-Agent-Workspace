// i6-04 公共取证 harness：固定验证码登录 + JSON 请求流封装
// 用法：node harness.js <user> [command 模块路径]
const crypto = require('crypto');
const BASE = 'http://127.0.0.1:8080/api';
const DEV_PASSWORD = process.env.I6_DEV_PASSWORD || 'admin123';

async function challengeLogin(username, password = DEV_PASSWORD, captcha = '1234') {
  const ch = await (await fetch(`${BASE}/auth/challenge`)).json();
  const { captchaId, publicKey } = ch.data;
  const keyObj = crypto.createPublicKey({ key: Buffer.from(publicKey, 'base64'), format: 'der', type: 'spki' });
  const enc = crypto.publicEncrypt({
    key: keyObj, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256',
  }, Buffer.from(password, 'utf8'));
  const resp = await fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password: enc.toString('base64'), captcha, captchaId, timestamp: String(Date.now()) }),
  });
  const json = await resp.json();
  if (json.code !== 0 || !json.data || !json.data.accessToken) {
    throw new Error(`login ${username} failed: ${resp.status} ${JSON.stringify(json)}`);
  }
  return { token: json.data.accessToken, userId: json.data.userId, tenantId: json.data.tenantId,
    raw: JSON.stringify(json.data).slice(0, 200) };
}

async function req(token, method, path, body) {
  const resp = await fetch(`${BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await resp.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text.slice(0, 300); }
  return { status: resp.status, body: json };
}

async function sql(q) {
  return null; // placeholder: SQL 通过 Bash docker exec 采集
}

module.exports = { challengeLogin, req, BASE, sql };
