// i6-04 固定验证码实测：challenge → RSA-OAEP-SHA256 加密密码 → login(固定验证码 1234)
const crypto = require('crypto');
const BASE = 'http://127.0.0.1:8080/api';
const USERNAME = process.argv[2] || 'u1_100';
const PASSWORD = process.argv[3] || '123456';
const CAPTCHA = process.argv[4] || '1234';

async function main() {
  const ch = await (await fetch(`${BASE}/auth/challenge`)).json();
  const { captchaId, publicKey } = ch.data;
  // publicKey: Base64 DER SubjectPublicKeyInfo？ 先按 PEM/DER 两种可能处理
  let keyObj;
  try {
    keyObj = crypto.createPublicKey({ key: Buffer.from(publicKey, 'base64'), format: 'der', type: 'spki' });
  } catch (e) {
    keyObj = crypto.createPublicKey(publicKey);
  }
  const enc = crypto.publicEncrypt({
    key: keyObj, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256',
  }, Buffer.from(PASSWORD, 'utf8'));
  const body = {
    username: USERNAME,
    password: enc.toString('base64'),
    captcha: CAPTCHA,
    captchaId: captchaId,
    timestamp: String(Date.now()),
  };
  const resp = await fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await resp.json();
  console.log('status=' + resp.status, 'code=' + json.code, 'msg=' + json.msg);
  if (json.data && json.data.accessToken) {
    console.log('accessToken.len=' + json.data.accessToken.length);
  } else {
    console.log('data=' + JSON.stringify(json.data));
  }
}
main().catch(e => { console.error('ERR', e.message); process.exit(1); });
