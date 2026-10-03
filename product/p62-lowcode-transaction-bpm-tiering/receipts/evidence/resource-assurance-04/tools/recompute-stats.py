#!/usr/bin/env python3
"""P62 资源保障延迟分位数独立复算（RA02a2）。

口径（与 stat-definition.txt 单源一致）：
- 主口径=发起入组：ts_start ∈ [formalBegin, formalEnd)，完成可落在窗口外（慢样本不丢弃）
- 次口径=完成入组：ts_end ∈ [formalBegin, formalEnd)
- 分位数=nearest-rank（升序第 ceil(q*n) 个），不插值
- 结果分桶：合法（SUCCEEDED/ACCEPTED/OK）、业务拒绝（REJECTED:*）、服务器异常/超时
  （ERROR:*/TIMEOUT，HTTP 500 归 ERROR:HTTP500，不与业务拒绝混计）
- CSV 按 RFC4180 解析（outcome 含逗号时带引号）

用法：
  python3 recompute-stats.py <samples-dir> <formalBeginEpochMs> <formalSeconds> [warmupSeconds]

参数必须取自该 run 的 report（windowFormalBegin/windowFormalEnd），不得手填推断值。
"""
import csv
import glob
import gzip
import io
import math
import os
import sys
from datetime import datetime, timezone


def parse_ts(value):
    # ts_end/ts_start 形如 2026-10-03 21:07:32.755（本地 +08:00）
    dt = datetime.strptime(value.strip()[:23], "%Y-%m-%d %H:%M:%S.%f")
    return int(dt.replace(tzinfo=timezone.utc).timestamp() * 1000) - 8 * 3600 * 1000


def open_rows(path):
    if path.endswith(".gz"):
        with gzip.open(path, "rt", encoding="utf-8", newline="") as f:
            yield from csv.DictReader(f)
    else:
        with open(path, "r", encoding="utf-8", newline="") as f:
            yield from csv.DictReader(f)


def percentile(sorted_values, q):
    if not sorted_values:
        return None
    rank = max(1, math.ceil(q * len(sorted_values)))
    return sorted_values[rank - 1]


def bucket(outcome):
    if outcome in ("SUCCEEDED", "ACCEPTED", "OK"):
        return "legal"
    if outcome.startswith("REJECTED"):
        return "business_rejected"
    if outcome.startswith("ERROR") or outcome == "TIMEOUT":
        return "server_error_or_timeout"
    return "other:" + outcome[:40]


def summarize(rows, begin, end):
    start_cohort = [r for r in rows if begin <= parse_ts(r["ts_start"]) < end]
    end_cohort = [r for r in rows if begin <= parse_ts(r["ts_end"]) < end]
    finish_after = [r for r in rows if begin <= parse_ts(r["ts_start"]) < end
                    and parse_ts(r["ts_end"]) >= end]
    start_before_inside = [r for r in rows if parse_ts(r["ts_start"]) < begin
                           and begin <= parse_ts(r["ts_end"]) < end]

    def stat(cohort, kinds):
        picked = sorted(float(r["latency_ms"]) for r in cohort if bucket(r["outcome"]) in kinds)
        return (len(picked), percentile(picked, 0.50), percentile(picked, 0.90),
                percentile(picked, 0.95), percentile(picked, 0.99),
                picked[-1] if picked else None)

    print(f"  cohort_start_in_window n={len(start_cohort)}"
          f" cohort_end_in_window n={len(end_cohort)}"
          f" start_in_window_finish_after n={len(finish_after)}"
          f" start_before_window_finish_inside n={len(start_before_inside)}")
    for label, kinds in (("all", {"legal", "business_rejected", "server_error_or_timeout"}),
                         ("legal", {"legal"}),
                         ("business_rejected", {"business_rejected"}),
                         ("server_error_or_timeout", {"server_error_or_timeout"})):
        n, p50, p90, p95, p99, mx = stat(start_cohort, kinds)
        fmt = lambda v: "-" if v is None else f"{v:.1f}"
        print(f"  start_cohort {label:26s} n={n:6d}"
              f" p50={fmt(p50)} p90={fmt(p90)} p95={fmt(p95)} p99={fmt(p99)} max={fmt(mx)}")
    from collections import Counter
    print("  start_cohort outcomes:",
          dict(Counter(bucket(r["outcome"]) for r in start_cohort)))


def main():
    if len(sys.argv) < 4:
        print(__doc__)
        sys.exit(2)
    samples_dir, begin, formal_seconds = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
    warmup_seconds = int(sys.argv[4]) if len(sys.argv) > 4 else None
    end = begin + formal_seconds * 1000
    print(f"formalBegin={begin} formalEnd={end} windowSeconds={formal_seconds}"
          + (f" warmupSeconds={warmup_seconds}" if warmup_seconds is not None else ""))
    files = sorted(glob.glob(os.path.join(samples_dir, "*-samples.csv*")))
    if not files:
        print("no *-samples.csv* under", samples_dir)
        sys.exit(1)
    for path in files:
        name = os.path.basename(path).replace("-samples.csv.gz", "").replace("-samples.csv", "")
        print(f"collector={name} file={os.path.basename(path)}")
        summarize(list(open_rows(path)), begin, end)


if __name__ == "__main__":
    main()
