// H3：验证外部采集的密钥轮换阶段清单只含脱敏关联字段与状态。
// 用法：node h3-rotation-map.mjs rotation-map.json
import { readFileSync } from 'node:fs'

const input = JSON.parse(readFileSync(process.argv[2], 'utf8'))
if (!Array.isArray(input.runs) || input.runs.length < 3) throw new Error('at least three rotation runs are required')
const required = ['run', 'activeVersion', 'configuredVersions', 'challengeKeyVersion', 'resultCode', 'exitCode']
const safe = input.runs.map((run) => {
  for (const key of required) if (!(key in run)) throw new Error(`missing field: ${key}`)
  if (JSON.stringify(run).match(/BEGIN|Bearer\s+\S+|accessToken|refreshToken|captchaImage|password/i)) throw new Error('sensitive field in rotation map')
  return { run: String(run.run), activeVersion: String(run.activeVersion), configuredVersions: run.configuredVersions.map(String), challengeKeyVersion: String(run.challengeKeyVersion), resultCode: Number(run.resultCode), exitCode: Number(run.exitCode) }
})
const byRun = new Map(safe.map((run) => [run.run, run]))
if (!byRun.has('overlap') || !byRun.has('retired') || !byRun.has('current')) throw new Error('required stages: current, overlap, retired')
const overlap = byRun.get('overlap')
const retired = byRun.get('retired')
const current = byRun.get('current')
if (overlap.resultCode !== 0 || overlap.exitCode !== 0) throw new Error('overlap stage did not accept the old challenge')
if (current.challengeKeyVersion !== current.activeVersion || current.exitCode !== 0) throw new Error('new challenge is not bound to current version')
if (retired.resultCode === 0 || retired.exitCode !== 0) throw new Error('retired version was accepted')
console.log(JSON.stringify({ runs: safe, verdict: 'PASS', keyMaterialRedacted: true }))
