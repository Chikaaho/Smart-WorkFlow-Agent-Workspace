const fs = require('fs');
const z = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const rows = z.rows;

function split(r) { return r.split('|'); }

let stats = {
  action_rows_total: 0, action_required_empty: 0,
  userTask_trace_total: 0, userTask_actor_empty: 0,
  notify_rows_total: 0, notify_required_empty: 0,
  duplicate_action_ids: 0, duplicate_notify_rows: 0,
  negative_expect_total: 0, negative_violations: [],
  terminal_cases: 0, pending_residue: [], second_side_effect: [],
  cases: rows.length, cases_with_chain: 0,
  instance_status: {}
};
const ERR_KEYS = ['serial_gate_violation','invalid_user','self_add','forbidden_perm','dup_same_participant','forbidden_actor','orig_complete_rejected','self_proxy','invalid_agent','bad_scope','forbidden','blocked_after_action','express_after_cancel_rejected','receiver_approve_rejected'];
const TERMINAL = ['APPROVED','REJECTED','WITHDRAWN','DISCARDED'];

for (const r of rows) {
  const c = r.result.chain;
  if (!c) continue;
  stats.cases_with_chain++;
  // action rows: id|node|task|actor|action|result|...; required id/node/task/action/result
  const seenAct = new Set(), seenNot = new Set();
  for (const ar of (c.action_rows || [])) {
    stats.action_rows_total++;
    const f = split(ar);
    if (!f[0] || !f[1] || !f[3] || !f[4] || !f[5] || f[4] === '-' || f[5] === '-') stats.action_required_empty++;
    if (seenAct.has(f[0])) stats.duplicate_action_ids++;
    seenAct.add(f[0]);
  }
  for (const tr of (c.trace_rows || [])) {
    const f = split(tr);
    if (f[0] === 'userTask') { stats.userTask_trace_total++; if (!f[2] || f[2] === '-') stats.userTask_actor_empty++; }
  }
  for (const nr of (c.notify_rows || [])) {
    stats.notify_rows_total++;
    const f = split(nr);
    if (f.length < 4 || !f[0] || !f[1] || !f[2] || !f[3] || f[2] === '-') stats.notify_required_empty++;
    if (seenNot.has(nr)) stats.duplicate_notify_rows++;
    seenNot.add(nr);
  }
  // negative codes: any *_NNN / forbidden:403 style numeric field must be non-zero structured errors
  for (const [k, v] of Object.entries(r.result)) {
    if (ERR_KEYS.includes(k)) {
      stats.negative_expect_total++;
      const n = Number(v);
      if (!Number.isFinite(n) || n === 0 || n === 500) stats.negative_violations.push(r.case + ':' + k + '=' + v);
    }
  }
  const st = c.instance_status;
  if (st) stats.instance_status[st] = (stats.instance_status[st] || 0) + 1;
  if (st && TERMINAL.includes(st)) {
    stats.terminal_cases++;
    // pending residue: any sign row/status left PENDING in terminal chains
    for (const sr of (r.result.sign_after || r.result.sign_rows || [])) {
      if (typeof sr === 'string' && sr.includes('PENDING')) stats.pending_residue.push(r.case + ':' + sr);
    }
    for (const [k, v] of Object.entries(r.result)) {
      if (typeof v === 'string' && v === 'PENDING') stats.pending_residue.push(r.case + ':' + k);
    }
    // second side effect: action rows on other instances / unexpected INSTANCE-level rows beyond expected action family
    for (const ar of (c.action_rows || [])) {
      const f = split(ar);
      if (f[1] === 'INSTANCE' && !/SUPPLEMENT#|ACTION#/.test(f[2])) stats.second_side_effect.push(r.case + ':' + ar);
    }
  }
}

const allZero = stats.action_required_empty === 0 && stats.userTask_actor_empty === 0 &&
  stats.notify_required_empty === 0 && stats.duplicate_action_ids === 0 && stats.duplicate_notify_rows === 0 &&
  stats.negative_violations.length === 0 && stats.pending_residue.length === 0 && stats.second_side_effect.length === 0;

const out = {
  _source: 'evidence/i3-06/Z5/z5-actions.json（审查 05 §2 已锁定，仅派生汇总，未重跑行为）',
  _derived_at: new Date().toISOString(),
  counts: stats,
  assertions: {
    action_required_fields_empty: stats.action_required_empty,
    userTask_trace_actor_empty: stats.userTask_actor_empty,
    notify_required_fields_empty: stats.notify_required_empty,
    duplicate_action_ids: stats.duplicate_action_ids,
    duplicate_notify_rows: stats.duplicate_notify_rows,
    negative_expectations_total: stats.negative_expect_total,
    negative_violations_total: stats.negative_violations.length,
    terminal_cases: stats.terminal_cases,
    pending_residue_total: stats.pending_residue.length,
    second_side_effect_total: stats.second_side_effect.length
  },
  pass: allZero
};
fs.writeFileSync(process.argv[3], JSON.stringify(out, null, 1));
console.log('pass=' + allZero, JSON.stringify(out.assertions));
