/**
 * P45 G5 等价公开前缀网关：/sw/ 静态（SPA）+ /sw-server/api/* → localhost:8080/api/* 反向代理。
 * 仅用于行为证据采集，不属于产品代码。
 */
import http from 'node:http'
import { createReadStream, existsSync, statSync, writeFileSync } from 'node:fs'
import { join, extname } from 'node:path'

const DIST = process.env.P45_DIST_DIR
const BACKEND = process.env.P45_BACKEND_URL || 'http://localhost:8080'
const PORT = Number(process.env.P45_GATEWAY_PORT || 5273)
const NETWORK_LOG = process.env.P45_NETWORK_LOG
const networkEvents = []

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json',
  '.woff': 'font/woff', '.woff2': 'font/woff2',
}

http.createServer((req, res) => {
  const url = req.url
  if (url.startsWith('/sw-server/api/')) {
    const proxied = http.request(BACKEND + url.replace('/sw-server/api', '/api'), {
      method: req.method,
      headers: { ...req.headers, host: 'localhost:8080' },
    }, (up) => {
      if (NETWORK_LOG) {
        networkEvents.push({
          method: req.method,
          path: new URL(url, 'http://localhost').pathname,
          status: up.statusCode,
          requestCookiePresent: Boolean(req.headers.cookie),
          requestAuthorizationPresent: Boolean(req.headers.authorization),
          responseSetCookiePresent: Boolean(up.headers['set-cookie']),
        })
        writeFileSync(NETWORK_LOG, JSON.stringify({ events: networkEvents, sensitiveValuesSerialized: false }, null, 2) + '\n')
      }
      res.writeHead(up.statusCode, up.headers)
      up.pipe(res)
    })
    proxied.on('error', (e) => { res.writeHead(502); res.end('proxy error: ' + e.message) })
    req.pipe(proxied)
    return
  }
  if (url.startsWith('/sw/')) {
    let rel = url.slice('/sw/'.length).split('?')[0]
    let file = join(DIST, rel)
    if (!rel || !existsSync(file) || statSync(file).isDirectory()) file = join(DIST, 'index.html')
    res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' })
    createReadStream(file).pipe(res)
    return
  }
  res.writeHead(404)
  res.end('not found')
}).listen(PORT, () => console.log('gateway on http://localhost:' + PORT + '/sw/'))
