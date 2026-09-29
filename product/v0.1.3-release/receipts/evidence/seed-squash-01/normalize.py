#!/usr/bin/env python3
"""等价性归一化：
- PG dump：时间戳归一为 TS，DATA 块内行排序（物理序不属于逻辑等价）；
- H2 dump：剔除 flyway_schema_history 表行（历史表内容差异是种子合并的预期结果），
  其余 TABLE 行排序后比对（本身已按名排序）。
输出可比对文件 + SHA256。
"""
import hashlib
import re
import sys
from pathlib import Path

TS = re.compile(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?")


def norm_pg(src: Path, dst: Path):
    lines = src.read_text().splitlines()
    out, data_buf, cur = [], [], None

    def flush():
        nonlocal data_buf
        out.extend(sorted(data_buf))
        data_buf = []

    for ln in lines:
        ln = TS.sub("TS", ln)
        if ln.startswith("DATA "):
            flush()
            out.append(ln)
        elif ln.startswith(("TABLES", "ENUMS", "COLS ", "CONS ", "IDX ", "SEQ ")):
            flush()
            out.append(ln)
        else:
            data_buf.append(ln)
    flush()
    dst.write_text("\n".join(out) + "\n")


def norm_h2(src: Path, dst: Path):
    lines = [l for l in src.read_text().splitlines()
             if not l.startswith("TABLE flyway_schema_history")
             and not l.startswith("HIST ")]
    dst.write_text("\n".join(lines) + "\n")


def sha(p: Path):
    return hashlib.sha256(p.read_bytes()).hexdigest()


if __name__ == "__main__":
    d = Path("/tmp/squash-equiv")
    norm_pg(d / "old-pg.txt", d / "cmp-old-pg.txt")
    norm_pg(d / "new-pg.txt", d / "cmp-new-pg.txt")
    norm_h2(d / "old-h2.txt", d / "cmp-old-h2.txt")
    norm_h2(d / "new-h2.txt", d / "cmp-new-h2.txt")
    for f in ("cmp-old-pg.txt", "cmp-new-pg.txt", "cmp-old-h2.txt", "cmp-new-h2.txt"):
        print(f, sha(d / f))
