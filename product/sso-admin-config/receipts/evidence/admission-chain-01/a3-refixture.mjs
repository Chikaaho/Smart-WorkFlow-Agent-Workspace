// A3 夹具重建（重启清库后）：四分项角色+用户（幂等：按 code 查重）
import { execFileSync } from 'node:child_process'
const BASE = 'http://localhost:8081/sw-server/api'
const T = execFileSync('node', ['login.mjs', 't100admin', 'b1-admin.txt'], { cwd: '/tmp/sw-sso-verify', encoding: 'utf8' }).trim()
async function call(method, path, body) {
  const r = await fetch(BASE + path, { method, headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + T }, body: body === undefined ? undefined : JSON.stringify(body) })
  return JSON.parse(await r.text())
}
const out = {}
for (const [code, name, menus] of [
  ['a3flist', 'A3查看', [420]], ['a3fedit', 'A3编辑', [420, 421]],
  ['a3fenable', 'A3启停', [420, 422]], ['a3fsecret', 'A3凭据', [420, 423]]]) {
  const username = 'u_' + code
  const exist = await call('GET', '/system/user/list?pageNum=1&pageSize=50&username=' + username)
  let uid, rid
  const found = (exist.data?.rows || []).find(u => u.username === username)
  if (found) {
    uid = found.id
  } else {
    const r = await call('POST', '/system/role', { name, code: 'a3f' + code.slice(4), sort: 91, status: 1, dataScope: 0 })
    rid = r.data
    await call('PUT', `/system/role/${rid}/menus`, menus)
    const u = await call('POST', '/system/user', { username, realName: `${name}用户`, deptId: 1001, plainPassword: 'admin123', status: 0, roleIds: [rid], postIds: [] })
    uid = u.data
  }
  out[username] = { uid, rid }
}
console.log(JSON.stringify(out))
