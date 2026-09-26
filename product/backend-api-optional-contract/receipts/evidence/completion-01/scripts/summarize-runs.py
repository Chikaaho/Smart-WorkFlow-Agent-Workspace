#!/usr/bin/env python3
"""把 run-logged.sh 生成的日志按“命令块”汇总为 command-results.tsv（只读日志，不执行命令）。

run-logged.sh 的日志由若干命令块组成，每块形如：
  ================ （分隔线）
  # command / # cwd / # start
  ---- 原始输出 ----
  # end / # exit_code
  ================
本脚本按分隔线切块，逐块统计模块级总计行：
  tests/failures/errors/skipped = 该块内所有形如 `[INFO] Tests run: N, Failures: F, Errors: E, Skipped: S`
  （不含 `-- in `）的行求和；模块级运行=1 行，仓库根全量=13 行（含测试的模块数）。

用法: summarize-runs.py <日志1> [日志2 ...]
输出: TSV 到 stdout（每个“产生测试计数的命令块”一行）
"""
import io
import re
import sys

SEP = re.compile(r"^=+\s*$")
HEAD = re.compile(r"^# (command|cwd|start|end|exit_code):\s*(.*)$")
TOTAL = re.compile(r"^\[INFO\] Tests run: (\d+), Failures: (\d+), Errors: (\d+), Skipped: (\d+)\s*$")

print("\t".join(["log", "command", "cwd", "start", "end", "exit_code",
                 "module_total_lines", "tests", "failures", "errors", "skipped", "build"]))
for path in sys.argv[1:]:
    block = None
    for raw in io.open(path, encoding="utf-8", errors="replace"):
        line = raw.rstrip("\n")
        if SEP.match(line):
            if block and (block["module_lines"] or block["build"] != "UNKNOWN"):
                print("\t".join([path.split("/")[-1], block["command"], block["cwd"], block["start"],
                                 block["end"], block["exit_code"], str(block["module_lines"]),
                                 str(block["tests"]), str(block["fails"]), str(block["errors"]),
                                 str(block["skipped"]), block["build"]]))
            block = {"command": "?", "cwd": "?", "start": "?", "end": "?", "exit_code": "?",
                     "module_lines": 0, "tests": 0, "fails": 0, "errors": 0, "skipped": 0,
                     "build": "UNKNOWN"}
            continue
        if block is None:
            continue
        m = HEAD.match(line)
        if m:
            block[m.group(1)] = m.group(2)
            continue
        m = TOTAL.match(line)
        if m:
            block["module_lines"] += 1
            block["tests"] += int(m.group(1))
            block["fails"] += int(m.group(2))
            block["errors"] += int(m.group(3))
            block["skipped"] += int(m.group(4))
            continue
        if line.startswith("[INFO] BUILD SUCCESS"):
            block["build"] = "BUILD SUCCESS"
        elif line.startswith("[INFO] BUILD FAILURE"):
            block["build"] = "BUILD FAILURE"
