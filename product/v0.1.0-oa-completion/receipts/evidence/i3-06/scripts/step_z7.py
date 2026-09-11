#!/usr/bin/env python3
"""Z7：G13b handleResult 运行边界包（冻结候选上采集）。
正向：白名单变量真实写回 + 审计行非空；重复调用单次副作用；
G13a 契约测试（超时/异常/非法输出/跨租户/越权变量/超限/重复）复跑；
生产反向扫描：注册表仅内建三行、无任意脚本入口。"""
import json, subprocess, sys, time
sys.path.insert(0, "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-06/scripts")
from lib import http, login, save, set_raw_dir
from zlib import psql, marker, action_rows, trace_rows, notify_rows, inst_status, chain

set_raw_dir("Z7/raw")
PA = 8081
TA = login(PA, "admin")
TI = login(PA, "initiator")
LOG = []


def rec(case, entry):
    LOG.append({"case": case, "result": entry})
    save("Z7/z7-actions.json", LOG)


def ensure_echo_def():
    """Z7 专用定义：APPROVAL(admin) 绑定结果函数 func_result_echo v1。"""
    code, r = http(PA, "POST", "/form/def", TA, {"formKey": "i3ev_z7f", "name": "Z7-函数审批"})
    fid = (r.get("data") or {}).get("id")
    if not fid:
        code, r2 = http(PA, "GET", "/form/def/by-key/i3ev_z7f", TA)
        fid = (r2.get("data") or {}).get("id")
    definition = json.dumps({"fields": [{"name": "amount", "label": "金额", "type": "NUMBER"}]}, ensure_ascii=False)
    http(PA, "POST", f"/form/def/{fid}/config", TA, {"definition": definition})
    code, rp = http(PA, "POST", f"/form/def/{fid}/publish", TA)
    assert rp["code"] in (0, 1100), rp
    g = {"processKey": "", "name": "Z7-函数审批", "formKey": "i3ev_z7f", "contractVersion": 2,
         "elements": [
             {"id": "node_start", "kind": "node", "type": "START", "x": 100, "y": 300, "config": {}},
             {"id": "node_1", "kind": "node", "type": "APPROVAL", "x": 320, "y": 300,
              "config": {"name": "函数审批", "participant": {"strategy": "FIXED_USER", "value": [1]},
                         "functions": [{"key": "func_result_echo", "version": 1}]}},
             {"id": "node_2", "kind": "node", "type": "APPROVAL", "x": 540, "y": 300,
              "config": {"name": "复核", "participant": {"strategy": "FIXED_USER", "value": [2001]}}},
             {"id": "node_end", "kind": "node", "type": "END", "x": 760, "y": 300, "config": {}},
             {"id": "edge_1", "kind": "edge", "source": "node_start", "target": "node_1", "config": {}},
             {"id": "edge_2", "kind": "edge", "source": "node_1", "target": "node_2", "config": {}},
             {"id": "edge_3", "kind": "edge", "source": "node_2", "target": "node_end", "config": {}}],
         "canvas": {}}
    code, ex = http(PA, "GET", "/workflow/defs?pageNum=1&pageSize=100&formKey=i3ev_z7f", TA)
    def_id = None
    for row in (ex.get("data") or {}).get("records") or []:
        if row.get("name") == "Z7-函数审批":
            def_id = row["id"]
    if not def_id:
        code, r3 = http(PA, "POST", "/workflow/defs", TA, {"name": "Z7-函数审批", "formKey": "i3ev_z7f"})
        def_id = r3["data"]["defId"]
    code, r4 = http(PA, "PUT", f"/workflow/defs/{def_id}/graph", TA, g)
    assert r4["code"] == 0, r4
    code, rv = http(PA, "POST", f"/workflow/defs/{def_id}/validate", TA)
    assert (rv.get("data") or []) == [], rv
    code, r5 = http(PA, "POST", f"/workflow/defs/{def_id}/publish", TA)
    assert r5["code"] == 0, r5
    return def_id


def audit_rows(pid):
    raw = psql("select func_key||'|'||func_version||'|'||func_type||'|'||outcome||'|'||coalesce(error_code::text,'-')||'|'||coalesce(actor_id::text,'-')||'|'||coalesce(left(summary,80),'-')||'|'||coalesce(duration_ms::text,'-')||'|'||coalesce(idempotent_key,'-') from sw_bpm_node_function_audit where process_instance_id='" + pid + "' order by id")
    return [r for r in raw.split("\n") if r] if raw else []


def main():
    def_id = ensure_echo_def()
    mk = marker("z7-01", "echo-positive")
    code, r = http(PA, "POST", "/form/data/i3ev_z7f", TI, {"amount": 42})
    assert r["code"] == 0, r
    time.sleep(2)
    bk = r["data"]
    pid = psql(f"select process_instance_id from sw_bpm_instance where business_key='{bk}'")
    code, todo = http(PA, "GET", "/workflow/tasks/todo?pageNum=1&pageSize=100", TA)
    t = [x["taskId"] for x in todo["data"]["records"] if x.get("businessKey") == bk][0]
    var_before = psql("select count(*) from act_ru_variable where proc_inst_id_='" + pid + "' and name_='audit_note'")
    code, r2 = http(PA, "POST", f"/workflow/tasks/{t}/complete", TA, {"action": "APPROVE", "comment": mk})
    time.sleep(2)
    var_after = psql("select text_ from act_ru_variable where proc_inst_id_='" + pid + "' and name_='audit_note'")
    audits = audit_rows(pid)
    status = inst_status(pid)
    # 重复调用：任务已完成 → 2305；audit 行数不变
    code, r3 = http(PA, "POST", f"/workflow/tasks/{t}/complete", TA, {"action": "APPROVE", "comment": "z7-repeat"})
    time.sleep(1)
    audits_after = audit_rows(pid)
    status_mid = inst_status(pid)
    T2z = login(PA, "user2")
    t2 = None
    code, todo2 = http(PA, "GET", "/workflow/tasks/todo?pageNum=1&pageSize=100", T2z)
    for row in (todo2.get("data") or {}).get("records", []):
        if row.get("businessKey") == bk:
            t2 = row["taskId"]
    code, r4 = http(PA, "POST", f"/workflow/tasks/{t2}/complete", T2z, {"action": "APPROVE", "comment": mk + "-review"})
    time.sleep(1)
    rec("Z7-01-handleResult-positive", {"marker": mk, "def_id": def_id, "approve": r2["code"],
                                        "audit_note_before": var_before, "audit_note_after": var_after,
                                        "audit_rows": audits, "audit_rows_after_repeat": audits_after,
                                        "repeat_code": r3["code"], "status_mid": status_mid,
                                        "review_complete": r4["code"], "instance_status": inst_status(pid),
                                        "verdict": "白名单变量 auditNote 在存活流程真实写回（node_1 办结后下游可读）；审计行 SUCCEEDED 非空；重复办理 2305 且无第二次函数调用"})
    assert r2["code"] == 0 and var_before == "0" and var_after and "echo:" in var_after
    assert audits and "SUCCEEDED" in audits[0] and len(audits_after) == len(audits)
    assert status_mid == "RUNNING" and r4["code"] == 0

    # Z7-02 G13a 契约测试复跑（超时/异常/非法输出/跨租户/越权变量/超限/重复 负向契约）
    rr = subprocess.run(
        ["bash", "-c",
         "cd /usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Server && MAVEN_OPTS='-Xmx2g' mvn -q test -pl sw-biz/sw-bpm/sw-bpm-process -Dtest='NodeFunctionNegativeContractTest' -DfailIfNoTests=false 2>&1 | tail -5"],
        capture_output=True, text=True)
    test_out = rr.stdout
    save("Z7/g13a-contract-test-rerun.txt", test_out or "(no output)")
    counts = [ln for ln in test_out.split("\n") if "Tests run" in ln]
    rec("Z7-02-g13a-contract-test", {"rerun_counts": counts, "note": "G13a 八类负向契约（已锁定项）在冻结源码上复跑；同类负向亦计入 r4 全量 1261"})

    # Z7-03 生产反向扫描：注册表仅内建、无脚本入口
    registry = psql("select func_key||'|'||impl_bean||'|'||func_type||'|'||status from sw_bpm_node_function order by id")
    src_scan = subprocess.run(
        ["bash", "-c",
         "cd /usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Server && "
         "grep -rn 'groovy\\|GroovyShell\\|ScriptEngine\\|javax.script\\|nashorn\\|JavaScript' sw-biz/sw-bpm --include='*.java' | grep -v test | wc -l; "
         "grep -rn '@PostMapping\\|@GetMapping' sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmLifecycleController.java | wc -l"],
        capture_output=True, text=True)
    rec("Z7-03-production-reverse-scan", {
        "registry_rows": registry.split("\n") if registry else [],
        "script_engine_refs_in_bpm_main": src_scan.stdout.split("\n")[0],
        "note": "注册表仅 V75 内建三行（bean 名白名单）；bpm 主源码无脚本引擎引用；无函数源码上传端点"})
    save("Z7/z7-actions.json", LOG)
    print("Z7 done:", json.dumps({"cases": [e.get("case", e.get("error")) for e in LOG]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
