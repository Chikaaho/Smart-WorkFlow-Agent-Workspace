#!/usr/bin/env node
/**
 * I4 真实 HTTP 登录（P45 挑战链）。
 * 阶段1: node i4-login.mjs <user> <pass>            → 保存 challenge.png/challenge.json 后退出
 * 阶段2: node i4-login.mjs <user> <pass> <captcha>  → RSA-OAEP 加密 + 登录，输出 accessToken
 * (c) 证据脚本，走真实服务端挑战消费。
 */
import { request as httpRequest } from 'node:http'
import { writeFileSync, readFileSync } from 'node:fs'
import { createPublicKey, publicEncrypt, constants } from 'node:crypto'

const [, , username = 'admin', password = 'admin123', captchaArg] = process.argv
const BASE = 'http://localhost:8080/api'
const DIR = new URL('.', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')

function request(path, method = 'GET', body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const req = httpRequest(
      BASE + path,
      { method, headers: { 'Content-Type': 'application/json', ...headers } },
      (res) => {
        let data = ''
        res.on('data', (chunk) => (data += chunk))
        res.on('end', () => resolve({ status: res.statusCode, body: data }))
      },
    )
    req.on('error', reject)
    if (body) req.write(body)
    req.end()
  })
}

if (!captchaArg) {
  const challenge = JSON.parse((await request('/auth/challenge')).body).data
  const png = challenge.captchaImage.split(',')[1]
  writeFileSync(DIR + 'challenge.png', Buffer.from(png, 'base64'))
  writeFileSync(DIR + 'challenge.json', JSON.stringify(challenge))
  console.log('CHALLENGE_SAVED captchaId=' + challenge.captchaId)
} else {
  const challenge = JSON.parse(readFileSync(DIR + 'challenge.json', 'utf8'))
  const key = createPublicKey({ key: Buffer.from(challenge.publicKey, 'base64'), format: 'der', type: 'spki' })
  const encrypted = publicEncrypt(
    { key, padding: constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' },
    Buffer.from(password, 'utf8'),
  )
  const payload = {
    username,
    password: encrypted.toString('base64'),
    captcha: captchaArg,
    captchaId: challenge.captchaId,
    timestamp: Date.now(),
  }
  const resp = JSON.parse(
    (await request('/auth/login', 'POST', JSON.stringify(payload), { 'Content-Type': 'application/json' })).body,
  )
  if (resp.code !== 0) {
    console.error('LOGIN_FAILED', JSON.stringify(resp))
    process.exit(1)
  }
  writeFileSync(DIR + `token-${username}.json`, JSON.stringify({ username, accessToken: resp.data.accessToken }, null, 2))
  console.log('LOGIN_OK username=' + username)
}
