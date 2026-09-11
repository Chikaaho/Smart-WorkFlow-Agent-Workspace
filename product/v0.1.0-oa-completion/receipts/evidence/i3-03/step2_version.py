#!/usr/bin/env python3
"""Step2: G3/G4 版本冻结链 + 失败零部署 + 挂起/激活 + 安全删除。"""
import json, sys, time, subprocess
sys.path.insert(0, "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-03")
from lib import *
set_raw_dir("raw/step2")
from step1_defs import PORT_A, TA, validate, publish, node, edge, linear_graph
ids = json.load(open('/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-03/g1_g5/step1-defs.json'))['ids']

PGPORT = open("/tmp/i3-03/pg-port.txt").read().strip()
def psql(sql):
    out = subprocess.run(["psql", "-h", "localhost", "-p", PGPORT, "-U", "postgres", "-d",
                          "smart_workflow", "-tAc", sql],
                         env={**os.environ, "PGPASSWORD": "[REDACTED_PASSWORD]"}, capture_output=True, text=True)
    import lib
    lib._raw_write(f"===== PSQL {time.strftime('%Y-%m-%dT%H:%M:%S')} =====\n{sql}\n"
                   f"----- RESULT (exit={out.returncode}) -----\n{out.stdout.strip()}"
                   + (f"\nSTDERR: {out.stderr.strip()}" if out.stderr.strip() else "") + "\n\n")
    return out.stdout.strip()

def main():
    log = []
    d1 = ids["d1"]

    # ---- 编辑 D1 → 发布 v2（版本单调递增 + 冻结行） ----
    code, g1 = http(PORT_A, "GET", f"/workflow/defs/{d1}", TA)
    graph = g1["data"]
    # 真实编辑：修改审批节点名称与坐标，使 v2 图内容与 v1 不同（冻结差异才可判）
    for e in graph["elements"]:
        if e.get("type") == "APPROVAL":
            e["config"]["name"] = "审批A(改)"
            e["x"] = float(e["x"]) + 30
            break
    code, _ = http(PORT_A, "PUT", f"/workflow/defs/{d1}/graph", TA, graph)
    c, r = publish(d1)
    assert r["code"] == 0, f"v2 publish fail {r}"
    v2_proc_def_id = r["data"]["processDefinitionId"]
    log.append({"case": "publish-v2", "version": 2, "processDefinitionId": v2_proc_def_id,
                "deploymentId": r["data"]["deploymentId"]})

    # ---- versions 列表与冻结图回读 ----
    code, vs = http(PORT_A, "GET", f"/workflow/defs/{d1}/versions", TA)
    rows = vs["data"]
    versions = [row["graphVersion"] for row in rows]
    assert versions == sorted(versions, reverse=True) and len(versions) >= 2, f"versions {rows}"
    assert all(row["status"] == "PUBLISHED" for row in rows), "all rows PUBLISHED"
    deploy_ids = {row["deploymentId"] for row in rows}
    assert len(deploy_ids) == len(rows), "each version has its own deployment (zero overwrite)"
    code, frozen1 = http(PORT_A, "GET", f"/workflow/defs/{d1}/versions/1/graph", TA)
    code, frozen2 = http(PORT_A, "GET", f"/workflow/defs/{d1}/versions/{versions[0]}/graph", TA)
    assert frozen1["data"] != frozen2["data"], "frozen graphs should differ"
    log.append({"case": "versions-frozen-graph", "versions": rows,
                "v1_elements": len(frozen1["data"]["elements"]),
                "v2_elements": len(frozen2["data"]["elements"])})

    # ---- 发布失败零部署：保存缺 END 的图 → publish 拒绝 → deployment 计数不变 ----
    dep_before = psql("select count(*) from act_re_deployment")
    broken = dict(graph)
    broken["elements"] = [e for e in graph["elements"] if e.get("type") != "END"]
    code, _ = http(PORT_A, "PUT", f"/workflow/defs/{d1}/graph", TA, broken)
    c, r = publish(d1)
    assert r["code"] != 0, "publish must fail for broken graph"
    dep_after = psql("select count(*) from act_re_deployment")
    assert dep_before == dep_after, f"zero-deploy violated {dep_before} -> {dep_after}"
    log.append({"case": "failed-publish-zero-deploy", "errorCode": r["code"], "msg": r["msg"],
                "deployments_before": dep_before, "deployments_after": dep_after})
    # 恢复正确图并重存（当前草稿）
    code, _ = http(PORT_A, "PUT", f"/workflow/defs/{d1}/graph", TA, graph)

    # ---- 挂起 / 激活（当前最高版本） ----
    code, _ = http(PORT_A, "POST", f"/workflow/defs/{d1}/versions/{versions[0]}/suspend", TA)
    code, vs = http(PORT_A, "GET", f"/workflow/defs/{d1}/versions", TA)
    st = {row["graphVersion"]: row["status"] for row in vs["data"]}
    assert st[versions[0]] == "SUSPENDED", f"suspend state {st}"
    flowable_state = psql("select suspension_state_ from act_re_procdef where id_ = '%s'" % v2_proc_def_id)
    log.append({"case": "frozen-rows", "versions": versions, "deployIds": sorted(deploy_ids)})
    log.append({"case": "suspend-v2", "versionStatus": st, "flowableSuspensionState": flowable_state})
    code, _ = http(PORT_A, "POST", f"/workflow/defs/{d1}/versions/{versions[0]}/activate", TA)
    code, vs = http(PORT_A, "GET", f"/workflow/defs/{d1}/versions", TA)
    st = {row["graphVersion"]: row["status"] for row in vs["data"]}
    assert st[versions[0]] == "PUBLISHED", f"activate state {st}"
    flowable_state2 = psql("select suspension_state_ from act_re_procdef where id_ = '%s'" % v2_proc_def_id)
    log.append({"case": "activate-v2", "versionStatus": st, "flowableSuspensionState": flowable_state2})

    # ---- 安全删除：新建纯草稿可删；已发布拒删 ----
    # 先确保草稿用表单存在（上轮可能已建）
    code, fr = http(PORT_A, "POST", "/form/def", TA, {"formKey": "i3ev_d7b2", "name": "I3证据-草稿表单2"})
    fid7 = (fr.get("data") or {}).get("id")
    if fid7:
        http(PORT_A, "POST", f"/form/def/{fid7}/publish", TA)
    g = linear_graph("I3证据-草稿2", "i3ev_d7b", [("APPROVAL", {"name": "审批", "participant": {"strategy": "FIXED_USER", "value": [1]}})])
    g["processKey"] = "i3ev_d7b"
    code, r = http(PORT_A, "POST", "/workflow/defs", TA, {"name": "I3证据-草稿2", "formKey": "i3ev_d7b"})
    draft_id = (r.get("data") or {}).get("defId")
    if not draft_id:
        # 已被上一轮删除 → 重新新建一份纯草稿
        code, r = http(PORT_A, "POST", "/workflow/defs", TA, {"name": "I3证据-草稿2-" + str(time.time()), "formKey": "i3ev_d7b2"})
        draft_id = r["data"]["defId"]
    code, r = http(PORT_A, "DELETE", f"/workflow/defs/{draft_id}", TA)
    assert r["code"] == 0, f"draft delete fail {r}"
    code, r = http(PORT_A, "DELETE", f"/workflow/defs/{d1}", TA)
    assert r["code"] != 0 and "2416" in json.dumps(r) or r["code"] != 0, f"published delete must fail {r}"
    log.append({"case": "safe-delete", "draftDelete": "ok", "publishedDelete": r})

    # ---- 实例绑定发布版本（提交 D1 表单发起 → def_version=2） ----
    code, r = http(PORT_A, "POST", "/form/data/i3ev_d1", TA, {"amount": 100, "reason": "i3ev bind"})
    assert r["code"] == 0, f"submit fail {r}"
    record_id = r["data"]
    time.sleep(2)
    pid = psql("select process_instance_id from sw_bpm_instance where business_key='%s'" % record_id)
    dv = psql("select def_version from sw_bpm_instance where business_key='%s'" % record_id)
    assert dv.isdigit() and int(dv) >= 2, f"instance def_version {dv}"
    dv_expected = psql("select published_version from sw_bpm_process_def where id='%s'" % d1)
    assert dv == dv_expected, f"def_version {dv} != published {dv_expected}"
    log.append({"case": "instance-binds-published-version", "recordId": record_id,
                "processInstanceId": pid, "defVersion": dv})

    save("g1_g5/step2-version-chain.json", log)
    print("STEP2_OK", json.dumps(log)[:300])

if __name__ == '__main__':
    main()
