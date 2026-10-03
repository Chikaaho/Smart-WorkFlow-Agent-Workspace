#!/usr/bin/env python3
"""独立复算资源保障短验证轮统计（原始样本 → 报告口径；nearest-rank，不剔慢样本）。
用法: python3 recompute-stats.py <windowBeginEpochMs> <formalSeconds>
统计口径见 stat-definition.txt：完成入组=ts_end∈[begin, begin+formal)；
legal=SUCCEEDED/ACCEPTED/OK；rejected=REJECTED*/TIMEOUT/ERROR*（全结果=两者并集）。"""
import gzip, csv, sys, datetime, math, collections
BEGIN = int(sys.argv[1]); FORMAL = int(sys.argv[2]) * 1000
END = BEGIN + FORMAL
def ts_ms(s):
    return int(datetime.datetime.fromisoformat(s).timestamp() * 1000)
def load(name):
    with gzip.open(name, 'rt') as f:
        return list(csv.DictReader(f))
def pct(vals, q):
    if not vals: return None
    vals = sorted(vals); i = min(len(vals) - 1, max(0, math.ceil(q * len(vals)) - 1))
    return vals[i]
def classify(outcome):
    if outcome in ('SUCCEEDED', 'ACCEPTED', 'OK'): return 'legal'
    if outcome.startswith('REJECTED') or outcome == 'TIMEOUT' or outcome.startswith('ERROR'): return 'rejected'
    return 'other'
files = ['protected-realtime-samples.csv.gz','protected-light-samples.csv.gz','oa-read-samples.csv.gz',
         'oa-approval-samples.csv.gz','burst-load-samples.csv.gz','burst-batch-samples.csv.gz']
print(f"# window=[{BEGIN},{END}) formal={FORMAL//1000}s  (nearest-rank)")
for f in files:
    rows = load(f)
    hist = collections.Counter(r['outcome'].split(':')[0] if r['outcome'].startswith('REJECTED') else r['outcome'] for r in rows)
    cohort = [r for r in rows if BEGIN <= ts_ms(r['ts_end']) < END]
    started = [r for r in rows if BEGIN <= ts_ms(r['ts_start']) < END]
    outside = [r for r in started if not (BEGIN <= ts_ms(r['ts_end']) < END)]
    cls = collections.defaultdict(list)
    for r in cohort: cls[classify(r['outcome'])].append(float(r['latency_ms']))
    def line(label, vals):
        if not vals: print(f"    {label}: n=0"); return
        print(f"    {label}: n={len(vals)} p50={pct(vals,.5):.1f} p90={pct(vals,.9):.1f} p95={pct(vals,.95):.1f} p99={pct(vals,.99):.1f} max={max(vals):.1f}")
    print(f"  {f}: total={len(rows)} cohort_end={len(cohort)} cohort_start={len(started)} start_in_finish_after={len(outside)}")
    print(f"    outcomes_all={dict(hist)}")
    line('all_results', cls['legal'] + cls['rejected'] + cls['other'])
    line('legal_results', cls['legal'])
    line('rejected_results', cls['rejected'])
    if cls['other']: print(f"    other_outcomes={len(cls['other'])}")
print("# failureCount(protected): 非 legal 的样本数（合同要求 0）")
for f, legal in [('protected-realtime-samples.csv.gz','SUCCEEDED'), ('protected-light-samples.csv.gz','ACCEPTED'),
                 ('oa-approval-samples.csv.gz','ACCEPTED'), ('oa-read-samples.csv.gz','OK')]:
    rows = [r for r in load(f) if BEGIN <= ts_ms(r['ts_end']) < END]
    bad = [r for r in rows if r['outcome'] != legal]
    print(f"  {f}: n={len(rows)} non_{legal}={len(bad)} examples={[r['outcome'][:60] for r in bad[:3]]}")
