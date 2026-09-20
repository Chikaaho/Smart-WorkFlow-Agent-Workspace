// C1 重新生成服务端中文目录键级清单（与 p61-scope-corrected-01 同一口径）：
// 总键数 = messages_zh_CN.properties 中 ^error. 键数；修订键 = 22 键固定清单。
import { readFileSync, writeFileSync } from 'node:fs'

const propsPath = 'Smart-WorkFlow-aPaaS-server/sw-framework/sw-common/src/main/resources/i18n/messages_zh_CN.properties'
const props = readFileSync(propsPath, 'utf8')
const keys = [...props.matchAll(/^error\.([^=\n]+)=(.*)$/gm)].map(m => [m[1].trim(), m[2].trim()])
const revised = [
  'form.table_already_exists','form.field_type_unknown','form.field_type_disabled',
  'form.field_attr_missing','form.definition_invalid','form.submit_field_unknown',
  'form.submit_definition_invalid','form.query_filter_op_type_mismatch',
  'form.query_filter_op_not_supported','bpm.graph_missing_start','bpm.graph_multiple_start',
  'bpm.graph_missing_end','bpm.graph_multiple_end','bpm.graph_orphan_node',
  'bpm.graph_edge_target_not_found','bpm.graph_illegal_edge','bpm.approver_resolve_empty',
  'bpm.participant_resolve_empty','bpm.instance_initiator_invalid','bpm.authorization_invalid',
  'bpm.dynamic_branch_empty','bpm.dynamic_branch_leader_missing',
]
const map = new Map(keys)
let out = 'P61 范围纠偏 · 服务端中文目录键级清单（工具重新生成 2026-09-20，C1 核销）\n'
out += `总键数: ${keys.length}\n本轮修订键数: ${revised.length}\n\n[本轮修订键]\n`
out += revised.map(k => 'error.' + k).join('\n') + '\n\n[修订键 当前文案]\n'
for (const k of revised) out += `+error.${k}=${map.get(k)}\n`
writeFileSync(new URL('./server-catalog-inventory.txt', import.meta.url), out)
console.log(`TOTAL_KEYS=${keys.length} REVISED=${revised.length}`)
