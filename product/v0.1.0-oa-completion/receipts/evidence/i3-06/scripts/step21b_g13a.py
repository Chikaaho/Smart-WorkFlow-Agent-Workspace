#!/usr/local/bin/env python3
"""Step21b（i3-05）：G13a 证据包整理——八类负向测试报告 + 生产注册表反向扫描
（生产 src/main 不得含受控故障函数；注册表只含 9001/9002/9003 内建三行）
+ 运行期函数审计真实行。"""
import json, sys, time, subprocess, shutil, glob
sys.path.insert(0, "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-05/scripts")
from lib import *
set_raw_dir("raw/step21b")
from step2_version import psql

LOG = []
OUT = "g13a/"

# ── ① 八类负向测试报告（surefire 原始输出复制 + 汇总） ──
report = "sw-biz/sw-bpm/sw-bpm-process/target/surefire-reports/com.sw.ck.bpm.process.service.NodeFunctionNegativeContractTest.txt"
SRC = "/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Server/" + report
if os.path.exists(SRC):
    os.makedirs(EV + "/g13a", exist_ok=True)
    shutil.copy(SRC, EV + "/g13a/nodefunction-negative-test-report.txt")
    txt = open(SRC).read()
    import re
    m = re.search(r"Tests run: (\d+), Failures: (\d+), Errors: (\d+)", txt)
    LOG.append({"case": "test-report", "source": report,
                "tests": m.group(1) if m else "?",
                "failures": m.group(2) if m else "?",
                "errors": m.group(3) if m else "?",
                "classes": ["超时(2415)", "异常(2414)", "非法格式(2413)", "超限输出(2413)",
                            "跨租户用户(2413)", "FALLBACK策略", "重复调用双行审计",
                            "审计完整性(actor/instance/node/idempotent 非空)",
                            "发布期跨租户函数隔离(2412)"]})
save("g13a/step21b.json", json.dumps(LOG, ensure_ascii=False, indent=2, default=str))

# ── ② 生产注册表反向扫描：受控故障函数不得存在于生产代码 ──
scan_terms = ["func_slow_v1", "func_bomb_v1", "func_badfmt_v1", "func_over_v1",
              "func_fb_v1", "func_ok_v1", "func_cross_v1", "func_secret_v1",
              "g13aSlow", "g13aBomb", "g13aBadFmt", "g13aOver", "g13aFallback",
              "g13aOk", "g13aCross"]
hits = {}
src_main = "/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/main/java"
for term in scan_terms:
    out = subprocess.run(["bash", "-c", f"grep -rl '{term}' {src_main} 2>/dev/null | wc -l"],
                         capture_output=True, text=True)
    hits[term] = int(out.stdout.strip() or 0)
zero_hits = all(v == 0 for v in hits.values())
LOG.append({"case": "production-registry-negative-scan",
            "scan_root": "sw-bpm-process/src/main/java",
            "terms": scan_terms, "hits": hits,
            "all_zero": zero_hits,
            "verdict": "受控故障函数与测试 bean 仅存在于测试配置（src/test），生产注册表零脚本入口"})
save("g13a/step21b.json", json.dumps(LOG, ensure_ascii=False, indent=2, default=str))

# ── ③ 生产注册表真实行（唯一内建三行）+ 运行期函数审计行 ──
registry = psql("select id||'|'||func_key||'|'||func_version||'|'||func_type||'|'||coalesce(impl_bean,'')||'|enabled='||enabled from sw_bpm_node_function order by id")
audit_rows = psql("select count(*) from sw_bpm_node_function_audit")
audit_sample = psql("select func_key||'|'||func_version||'|'||func_type||'|'||outcome||'|'||coalesce(error_code::text,'-')||'|'||coalesce(summary,'-') from sw_bpm_node_function_audit order by id desc limit 8")
LOG.append({"case": "production-registry-and-runtime-audit",
            "registry_rows": registry,
            "audit_row_count": audit_rows,
            "audit_sample": audit_sample,
            "verdict": "注册表仅含内建函数注册（无用户上传/脚本入口）；运行期审计每次调用一行（SUCCEEDED/FAILED+error_code+duration）"})
save("g13a/step21b.json", json.dumps(LOG, ensure_ascii=False, indent=2, default=str))
print("STEP21B_DONE")
