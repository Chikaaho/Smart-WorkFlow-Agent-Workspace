// I4-r3 受控真实 HTTP 回调对端：控制端口 19999（POST /up 启动 9999 回调端口），逐笔落盘。
import { createServer } from 'node:http'
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'node:fs'

const FILE = 'E:/code/Smart-WorkFlow-Agent-Workspace/product/v0.1.0-oa-completion/receipts/evidence/i4-03/receiver/received.json'
mkdirSync('E:/code/Smart-WorkFlow-Agent-Workspace/product/v0.1.0-oa-completion/receipts/evidence/i4-03/receiver', { recursive: true })
const load = () => { try { return JSON.parse(readFileSync(FILE, 'utf8')) } catch { return [] } }
const save = (rows) => writeFileSync(FILE, JSON.stringify(rows, null, 2))

let callbackServer = null
const control = createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/up') {
    if (callbackServer) { res.writeHead(200); res.end('already-up'); return }
    callbackServer = createServer((creq, cres) => {
      let body = ''
      creq.on('data', (c) => (body += c))
      creq.on('end', () => {
        const rows = load()
        rows.push({ at: new Date().toISOString(), headers: creq.headers, body })
        save(rows)
        cres.writeHead(200)
        cres.end('ok')
      })
    })
    callbackServer.listen(9999, () => console.log('CALLBACK_RECEIVER_UP_9999'))
    res.writeHead(200)
    res.end('up')
    return
  }
  res.writeHead(404)
  res.end('unknown')
})
control.listen(19999, () => console.log('RECEIVER_CONTROL_UP_19999'))
