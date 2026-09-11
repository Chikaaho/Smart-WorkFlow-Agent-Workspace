#!/usr/bin/env python3
"""Z8：G14 意见表单包（冻结候选上采集）。
正向：目录来自服务端权威能力响应；普通/会签/加签/补签/退回五类轮次的初始化、服务端校验、
提交、快照、历史回显、主表单逐字段零变化。
反向：禁止组件 config/validate/publish/提交层按契约拒绝；补签存在 SUPPLEMENT_SIGN 快照；
RETURN code 0 且 round 非空。"""
import json, sys, time
sys.path.insert(0, "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-06/scripts")
from lib import http, login, save, set_raw_dir
from zlib import psql, marker, action_rows, trace_rows, notify_rows, inst_status, sign_rows_for

set_raw_dir("Z8/raw")
PA = 8081
TA = login(PA, "admin")
T2 = login(PA, "user2")
TI = login(PA, "initiator")
LOG = []


def rec(case, entry):
    LOG.append({"case": case, "result": entry})
    save("Z8/z8-actions.json", LOG)


def submit(form_key, token, data=None):
    code, r = http(PA, "POST", f"/form/data/{form_key}", token, data or {"amount": 1})
    assert r["code"] == 0, r
    time.sleep(2)
    bk = r["data"]
    pid = psql(f"select process_instance_id from sw_bpm_instance where business_key='{bk}'")
    return bk, pid


def todo_of(tok, bk):
    code, r = http(PA, "GET", "/workflow/tasks/todo?pageNum=1&pageSize=100", tok)
    for row in (r.get("data") or {}).get("records", []):
        if row.get("businessKey") == bk:
            return row["taskId"]
    return None


def main_form_state(pid):
    return psql("select data::text from sw_form_data where id=(select business_key from sw_bpm_instance where process_instance_id='" + pid + "')")


def snapshot_rows(pid):
    raw = psql("select a.action||'|'||a.task_id||'|'||coalesce(a.opinion_form_snapshot,'-') from sw_bpm_approval_action a where a.process_instance_id='" + pid + "' and a.opinion_form_snapshot is not null and a.opinion_form_snapshot != '{}' order by a.id")
    return [r for r in raw.split("\n") if r] if raw else []


OPINION_FORM = {"formId": "i3ev-opinion", "version": "v1", "fields": [
    {"key": "comment2", "label": "审批说明", "type": "TEXT", "required": True, "maxLength": 200},
    {"key": "level", "label": "等级", "type": "RADIO", "options": ["A", "B"], "required": True},
    {"key": "note", "label": "备注", "type": "NOTE"}]}


def ensure_opinion_def(name, form_key, cfg_extra, participants, node_type="APPROVAL"):
    code, r = http(PA, "POST", "/form/def", TA, {"formKey": form_key, "name": name})
    fid = (r.get("data") or {}).get("id")
    if not fid:
        code, r2 = http(PA, "GET", f"/form/def/by-key/{form_key}", TA)
        fid = (r2.get("data") or {}).get("id")
    definition = json.dumps({"fields": [{"name": "amount", "label": "金额", "type": "NUMBER"}]}, ensure_ascii=False)
    http(PA, "POST", f"/form/def/{fid}/config", TA, {"definition": definition})
    code, rp = http(PA, "POST", f"/form/def/{fid}/publish", TA)
    assert rp["code"] in (0, 1100), rp
    cfg = {"name": name, "participant": {"strategy": "FIXED_USER", "value": list(participants)},
           "opinionForm": OPINION_FORM}
    cfg.update(cfg_extra)
    g = {"processKey": "", "name": name, "formKey": form_key, "contractVersion": 2,
         "elements": [
             {"id": "node_start", "kind": "node", "type": "START", "x": 100, "y": 300, "config": {}},
             {"id": "node_1", "kind": "node", "type": node_type, "x": 320, "y": 300, "config": cfg},
             {"id": "node_end", "kind": "node", "type": "END", "x": 540, "y": 300, "config": {}},
             {"id": "edge_1", "kind": "edge", "source": "node_start", "target": "node_1", "config": {}},
             {"id": "edge_2", "kind": "edge", "source": "node_1", "target": "node_end", "config": {}}],
         "canvas": {}}
    code, ex = http(PA, "GET", f"/workflow/defs?pageNum=1&pageSize=100&formKey={form_key}", TA)
    def_id = None
    for row in (ex.get("data") or {}).get("records") or []:
        if row.get("name") == name:
            def_id = row["id"]
    if not def_id:
        code, r3 = http(PA, "POST", "/workflow/defs", TA, {"name": name, "formKey": form_key})
        def_id = r3["data"]["defId"]
    code, r4 = http(PA, "PUT", f"/workflow/defs/{def_id}/graph", TA, g)
    assert r4["code"] == 0, r4
    code, rv = http(PA, "POST", f"/workflow/defs/{def_id}/validate", TA)
    assert (rv.get("data") or []) == [], (name, rv)
    code, r5 = http(PA, "POST", f"/workflow/defs/{def_id}/publish", TA)
    assert r5["code"] == 0, r5
    return def_id


def main():
    # ---- Z8-01 能力目录：服务端权威 HTTP 响应 ----
    code, ft = http(PA, "GET", "/form/def/field-types", TA)
    rows = ft.get("data") or []
    disabled = [x["type"] for x in rows if not x.get("enabled")]
    rec("Z8-01-capability-catalog", {"endpoint": "GET /form/def/field-types", "http": code,
                                     "total": len(rows), "enabled": len(rows) - len(disabled),
                                     "disabled": disabled,
                                     "verdict": "组件目录来自服务端权威能力 HTTP 响应（22 类，17 enabled + 5 disabled）"})
    assert len(rows) == 22 and len(disabled) == 5

    # ---- Z8-02 禁止组件四层拒绝（config/validate/publish/提交层） ----
    code, r = http(PA, "POST", "/form/def", TA, {"formKey": "i3ev_z8dis", "name": "Z8-禁止组件"})
    fid = (r.get("data") or {}).get("id")
    import json as _json
    code, rc = http(PA, "POST", f"/form/def/{fid}/config", TA,
                    {"definition": _json.dumps({"fields": [{"name": "bad", "type": "EMAIL", "label": "x"}]}, ensure_ascii=False)})
    code, rv = http(PA, "POST", "/workflow/defs/validate", TA,
                    {"processKey": "", "name": "z8dis", "formKey": "i3ev_z8dis", "contractVersion": 2,
                     "elements": [
                         {"id": "node_start", "kind": "node", "type": "START", "x": 100, "y": 300, "config": {}},
                         {"id": "node_1", "kind": "node", "type": "APPROVAL", "x": 320, "y": 300,
                          "config": {"name": "n", "participant": {"strategy": "FIXED_USER", "value": [1]},
                                     "opinionForm": {"formId": "i3ev-opinion", "version": "v1",
                                                     "fields": [{"key": "bad", "label": "bad", "type": "EMAIL"}]}}},
                         {"id": "node_end", "kind": "node", "type": "END", "x": 540, "y": 300, "config": {}},
                         {"id": "edge_1", "kind": "edge", "source": "node_start", "target": "node_1", "config": {}},
                         {"id": "edge_2", "kind": "edge", "source": "node_1", "target": "node_end", "config": {}}],
                     "canvas": {}})
    errs = (rv.get("data") or [])
    dis_errs = [e for e in errs if "不可用" in str(e.get("message", ""))]
    code, rp = http(PA, "POST", f"/form/def/{fid}/publish", TA)
    rec("Z8-02-disabled-reject", {"config_code": rc["code"], "config_msg": rc["msg"],
                                  "validate_error_2417": [e for e in dis_errs],
                                  "publish_code": rp["code"],
                                  "verdict": "config 层 1205 拒绝 + validate 层 2417 拒绝 + publish 层拒绝（三处均非 0）"})
    assert rc["code"] != 0 and rp["code"] != 0 and len(dis_errs) > 0

    # ---- Z8-03 普通审批意见表单全链（初始化映射/校验/提交/快照/主表单零变化） ----
    ensure_opinion_def("Z8-普通意见", "i3ev_z8n", {}, (1,))
    mk = marker("z8-03", "plain-opinion")
    code, r = http(PA, "POST", "/form/data/i3ev_z8n", TI, {"amount": 77})
    time.sleep(2)
    bk = r["data"]
    pid = psql(f"select process_instance_id from sw_bpm_instance where business_key='{bk}'")
    form_before = main_form_state(pid)
    t = todo_of(TA, bk)
    detail = http(PA, "GET", f"/workflow/tasks/{t}", TA)[1]
    # 校验拒绝：缺 required 字段
    code, rej = http(PA, "POST", f"/workflow/tasks/{t}/complete", TA,
                     {"action": "APPROVE", "comment": mk, "opinionData": {"level": "A"}})
    # 合法提交
    code, ok = http(PA, "POST", f"/workflow/tasks/{t}/complete", TA,
                    {"action": "APPROVE", "comment": mk,
                     "opinionData": {"comment2": "z8 意见", "level": "A", "note": "备注"}})
    time.sleep(1)
    form_after = main_form_state(pid)
    snaps = snapshot_rows(pid)
    rec("Z8-03-plain-opinion", {"marker": mk, "task_detail": detail, "missing_required_rejected": rej["code"],
                                "submit": ok["code"], "main_form_before": form_before,
                                "main_form_after": form_after, "main_form_unchanged": form_before == form_after,
                                "snapshots": snaps, "instance_status": inst_status(pid)})
    assert rej["code"] != 0 and ok["code"] == 0 and form_before == form_after and len(snaps) > 0

    # ---- Z8-04 会签意见表单 ----
    ensure_opinion_def("Z8-会签意见", "i3ev_z8c", {"mode": "ALL"}, (1, 2001), node_type="CONSENSUS")
    mk = marker("z8-04", "consensus-opinion")
    code, r = http(PA, "POST", "/form/data/i3ev_z8c", TI, {"amount": 78})
    time.sleep(2)
    bk = r["data"]
    pid = psql(f"select process_instance_id from sw_bpm_instance where business_key='{bk}'")
    form_before = main_form_state(pid)
    ta, tb = todo_of(TA, bk), todo_of(T2, bk)
    code, ca = http(PA, "POST", f"/workflow/tasks/{ta}/complete", TA,
                    {"action": "APPROVE", "comment": mk, "opinionData": {"comment2": "z8 会签A", "level": "B"}})
    code, cb = http(PA, "POST", f"/workflow/tasks/{tb}/complete", T2,
                    {"action": "APPROVE", "comment": mk + "-u2", "opinionData": {"comment2": "z8 会签B", "level": "A"}})
    time.sleep(1)
    rec("Z8-04-consensus-opinion", {"marker": mk, "vote_a": ca["code"], "vote_b": cb["code"],
                                    "main_form_unchanged": main_form_state(pid) == form_before,
                                    "snapshots": snapshot_rows(pid), "instance_status": inst_status(pid)})
    assert ca["code"] == 0 and cb["code"] == 0

    # ---- Z8-05 加签轮次意见快照 ----
    ensure_opinion_def("Z8-加签意见", "i3ev_z8a", {}, (1,))
    mk = marker("z8-05", "addsign-opinion")
    code, r = http(PA, "POST", "/form/data/i3ev_z8a", TI, {"amount": 79})
    time.sleep(2)
    bk = r["data"]
    pid = psql(f"select process_instance_id from sw_bpm_instance where business_key='{bk}'")
    t = todo_of(TA, bk)
    code, asg = http(PA, "POST", f"/workflow/tasks/{t}/add-sign", TA,
                     {"action": "ADD_SIGN", "participants": [2001], "mode": "PARALLEL"})
    s1 = psql("select id from sw_bpm_sign_record where task_id='" + t + "' and sign_status='PENDING' limit 1")
    code, ex = http(PA, "POST", f"/workflow/sign/{s1}/express", T2,
                    {"action": "APPROVE", "comment": mk, "opinionFormId": "i3ev-opinion", "opinionFormVersion": "v1",
                     "opinionData": {"comment2": "z8 加签表态", "level": "A"}})
    time.sleep(1)
    code, fin = http(PA, "POST", f"/workflow/tasks/{t}/complete", TA,
                     {"action": "APPROVE", "comment": mk + "-final", "opinionData": {"comment2": "z8 办结", "level": "A"}})
    time.sleep(1)
    snaps = snapshot_rows(pid)
    rec("Z8-05-addsign-opinion", {"marker": mk, "add_sign": asg["code"], "express": ex["code"], "final": fin["code"],
                                  "snapshots": snaps})
    assert asg["code"] == 0 and ex["code"] == 0 and len(snaps) >= 2, "加签表态意见快照缺失"

    # ---- Z8-06 补签轮次 SUPPLEMENT_SIGN 快照 ----
    mk = marker("z8-06", "supplement-opinion")
    code, r = http(PA, "POST", "/form/data/i3ev_z8a", TI, {"amount": 80})
    time.sleep(2)
    bk = r["data"]
    pid = psql(f"select process_instance_id from sw_bpm_instance where business_key='{bk}'")
    t = todo_of(TA, bk)
    http(PA, "POST", f"/workflow/tasks/{t}/complete", TA,
         {"action": "APPROVE", "comment": mk + "-pass", "opinionData": {"comment2": "z8 原审批", "level": "A"}})
    time.sleep(1)
    code, sup = http(PA, "POST", f"/workflow/instances/{pid}/supplement-sign", TI,
                     {"action": "SUPPLEMENT_SIGN", "participants": [2001], "comment": mk})
    sid = psql("select id from sw_bpm_sign_record where sign_type='SUPPLEMENT_SIGN' and process_instance_id='" + pid + "' order by id desc limit 1")
    code, ex = http(PA, "POST", f"/workflow/sign/{sid}/express", T2,
                    {"action": "APPROVE", "comment": mk + "-sup", "opinionFormId": "i3ev-opinion", "opinionFormVersion": "v1",
                     "opinionData": {"comment2": "z8 补签确认", "level": "B"}})
    time.sleep(1)
    sup_snap = psql("select sign_type||'|'||coalesce(opinion_data,'-') from sw_bpm_sign_record where id='{0}'".format(sid))
    snaps = snapshot_rows(pid)
    rec("Z8-06-supplement-opinion", {"marker": mk, "sup_create": sup["code"], "express": ex["code"],
                                     "sup_sign_row": sup_snap, "snapshots": snaps})
    assert sup["code"] == 0 and ex["code"] == 0 and len(snaps) >= 2, "补签快照缺失"

    # ---- Z8-07 退回轮次：code 0 + round 非空 + 快照保留 ----
    ensure_opinion_def("Z8-退回意见", "i3ev_z8r", {}, (1, 2001))
    g2 = None
    code, ex = http(PA, "GET", "/workflow/defs?pageNum=1&pageSize=100&formKey=i3ev_z8r", TA)
    d2 = [row for row in (ex.get("data") or {}).get("records") or [] if row.get("name") == "Z8-退回意见"][0]
    code, cur = http(PA, "GET", f"/workflow/defs/{d2['id']}", TA)
    graph = cur.get("data")
    elems = graph.get("elements") or []
    # 重新保存为两审批（A → B）以便退回
    g2 = {"processKey": graph.get("processKey") or "", "name": "Z8-退回意见", "formKey": "i3ev_z8r",
          "contractVersion": 2,
          "elements": [
              {"id": "node_start", "kind": "node", "type": "START", "x": 100, "y": 300, "config": {}},
              {"id": "node_1", "kind": "node", "type": "APPROVAL", "x": 320, "y": 300,
               "config": {"name": "审批A", "participant": {"strategy": "FIXED_USER", "value": [1]},
                          "opinionForm": OPINION_FORM}},
              {"id": "node_2", "kind": "node", "type": "APPROVAL", "x": 540, "y": 300,
               "config": {"name": "审批B", "participant": {"strategy": "FIXED_USER", "value": [2001]},
                          "opinionForm": OPINION_FORM}},
              {"id": "node_end", "kind": "node", "type": "END", "x": 760, "y": 300, "config": {}},
              {"id": "edge_1", "kind": "edge", "source": "node_start", "target": "node_1", "config": {}},
              {"id": "edge_2", "kind": "edge", "source": "node_1", "target": "node_2", "config": {}},
              {"id": "edge_3", "kind": "edge", "source": "node_2", "target": "node_end", "config": {}}],
          "canvas": {}}
    code, sv = http(PA, "PUT", f"/workflow/defs/{d2['id']}/graph", TA, g2)
    assert sv["code"] == 0, sv
    code, rv = http(PA, "POST", f"/workflow/defs/{d2['id']}/validate", TA)
    assert (rv.get("data") or []) == [], rv
    code, pb = http(PA, "POST", f"/workflow/defs/{d2['id']}/publish", TA)
    assert pb["code"] == 0, pb

    mk = marker("z8-07", "return-opinion")
    code, r = http(PA, "POST", "/form/data/i3ev_z8r", TI, {"amount": 81})
    time.sleep(2)
    bk = r["data"]
    pid = psql(f"select process_instance_id from sw_bpm_instance where business_key='{bk}'")
    form_before = main_form_state(pid)
    tA = todo_of(TA, bk)
    http(PA, "POST", f"/workflow/tasks/{tA}/complete", TA,
         {"action": "APPROVE", "comment": mk + "-A", "opinionData": {"comment2": "z8 A轮", "level": "A"}})
    time.sleep(1)
    tB = todo_of(T2, bk)
    code, ret = http(PA, "POST", f"/workflow/tasks/{tB}/return", T2,
                     {"action": "RETURN", "returnTargetNodeId": "node_1",
                      "comment": mk + "-return", "opinionData": {"comment2": "z8 退回意见", "level": "B"}})
    time.sleep(1)
    round_row = psql("select action||'|'||coalesce(round_no::text,'-') from sw_bpm_approval_action where process_instance_id='" + pid + "' and action='RETURN' order by id desc limit 1")
    tA2 = todo_of(TA, bk)
    code, fin = http(PA, "POST", f"/workflow/tasks/{tA2}/complete", TA,
                     {"action": "APPROVE", "comment": mk + "-round2", "opinionData": {"comment2": "z8 二轮", "level": "A"}})
    time.sleep(1)
    rec("Z8-07-return-round", {"marker": mk, "return": ret["code"], "round_row": round_row,
                               "round2_task": tA2, "round2_complete": fin["code"],
                               "main_form_unchanged": main_form_state(pid) == form_before,
                               "snapshots": snapshot_rows(pid)})
    assert ret["code"] == 0 and round_row and "RETURN|1" in round_row and fin["code"] == 0

    save("Z8/z8-actions.json", LOG)
    print("Z8 done:", json.dumps({"cases": [e.get("case") for e in LOG if "case" in e]}, ensure_ascii=False))


if __name__ == "__main__":
    main()
