// I4 受控真实 HTTP 回调对端：真实 socket 监听 9999，逐笔落盘（含重试笔）
import { createServer } from 'node:http'
import { writeFileSync, readFileSync } from 'node:fs'
const FILE = 'E:/code/Smart-WorkFlow-Agent-Workspace/product/v0.1.0-oa-completion/receipts/evidence/i4-02/http/openapi-callback-received.json'
const received = (() => { try { return JSON.parse(readFileSync(FILE, 'utf8')) } catch { return [] } })()
createServer((req, res) => {
  let body = ''
  req.on('data', (c) => (body += c))
  req.on('end', () => {
    received.push({ at: new Date().toISOString(), headers: req.headers, body })
    writeFileSync(FILE, JSON.stringify(received, null, 2))
    res.writeHead(200); res.end('ok')
  })
}).listen(9999, () => console.log('RECEIVER_UP'))
