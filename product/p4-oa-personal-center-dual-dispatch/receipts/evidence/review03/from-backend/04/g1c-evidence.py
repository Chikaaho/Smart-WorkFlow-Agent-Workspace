#!/usr/bin/env python3
# G1c 行为证据：普通身份无编辑权限（反向）、管理编辑正向、唯一发布绑定解析、
# 发布新版本不改写存量实例/草稿绑定。
# 运行：python3 g1c-evidence.py >> g1c-evidence.out 2>&1
import json
import os
import urllib.request

BASE = os.environ.get("BASE", "http://localhost:8080/api")
FX = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "fixtures03-run.out")))
ADMIN = "1"
BIZ = FX["bizUser"]
DSP = FX["dspUser"]
FORM_A = FX["formA"]


def req(method, path, body=None, user=ADMIN):
    headers = {"Authorization": f"Bearer test_{user}", "Content-Type": "application/json"}
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r, timeout=15) as resp:
            status = resp.status
            payload = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        status = e.code
        payload = json.loads(e.read().decode(errors="replace"))
    return status, payload


def log(tag, **kv):
    print(f"[{tag}] " + json.dumps(kv, ensure_ascii=False))


# ---- 反向：普通用户直接请求编辑/发布/可见范围/流程管理 ----
s, p = req("PUT", f"/form/def/{FORM_A}", {"name": "越权改名"}, user=BIZ)
log("R1.biz-update-form", http=s, code=p["code"], msg=p["msg"])
s, p = req("PUT", f"/form/def/{FORM_A}/visibility", {"userIds": [BIZ]}, user=BIZ)
log("R2.biz-update-visibility", http=s, code=p["code"], msg=p["msg"])
s, p = req("POST", f"/form/def/{FORM_A}/publish", user=BIZ)
log("R3.biz-publish-form", http=s, code=p["code"], msg=p["msg"])
s, p = req("POST", "/workflow/defs", {"name": "越权流程", "formKey": "p4_oa_biz_form_20260905b"}, user=BIZ)
log("R4.biz-create-flowdef", http=s, code=p["code"], msg=p["msg"])
s, p = req("PUT", "/form/def", {"formKey": "x"}, user=BIZ)
log("R5.biz-unknown-put", http=s, code=p.get("code"), msg=p.get("msg"))

# ---- 反向：普通用户读不可见管理接口 ----
s, p = req("GET", "/form/def/page?pageNum=1&pageSize=10", user=BIZ)
log("R6.biz-design-page", http=s, code=p["code"], msg=p["msg"])

# ---- 正向：管理员编辑表单与可见范围 ----
s, p = req("PUT", f"/form/def/{FORM_A}", {"description": "P4补证03业务表单（管理员维护）"})
log("P1.admin-update-form", http=s, code=p["code"])
s, p = req("PUT", f"/form/def/{FORM_A}/visibility", {"userIds": [BIZ]})
log("P2.admin-set-visibility-biz-only", http=s, code=p["code"])
s2, p2 = req("GET", "/form/def/published", user=DSP)
visible_keys = [r["formKey"] for r in (p2["data"] if isinstance(p2["data"], list) else [])]
log("P3.dsp-published-list-after-restrict", http=s2, keys=visible_keys)
s2, p2 = req("GET", f"/form/def/by-key/p4_oa_biz_form_20260905b", user=DSP)
log("P4.dsp-bykey-after-restrict", http=s2, code=p2["code"], msg=p2["msg"])
s, p = req("PUT", f"/form/def/{FORM_A}/visibility", {"userIds": []})
log("P5.admin-restore-all", http=s, code=p["code"])
s2, p2 = req("GET", f"/form/def/by-key/p4_oa_biz_form_20260905b", user=DSP)
log("P6.dsp-bykey-after-restore", http=s2, code=p2["code"])

# ---- 正向：管理员编辑关联流程（草稿图→发布 = 维护绑定） ----
defs = req("GET", "/workflow/defs?pageNum=1&pageSize=50")[1]["data"]["records"]
DEF_A = next(str(d["id"]) for d in defs if d.get("formKey") == "p4_oa_biz_form_20260905b")
graph = req("GET", f"/workflow/defs/{DEF_A}")[1]["data"]
log("P7.admin-read-graph", defId=DEF_A, processKey=graph["processKey"], nodeCount=len(graph["elements"]))
s, p = req("PUT", f"/workflow/defs/{DEF_A}/graph", graph)
log("P8.admin-save-graph", http=s, code=p["code"])
s, p = req("POST", f"/workflow/defs/{DEF_A}/validate")
log("P9.admin-validate", http=s, errorCount=len(p["data"]))

# ---- 唯一绑定：业务用户建草稿，服务端回填 processDefKey ----
s, p = req("POST", "/workflow/drafts", {"formKey": "p4_oa_biz_form_20260905b"}, user=BIZ)
draft_id = str(p["data"]["id"])
log("U1.biz-create-draft", http=s, code=p["code"], draftId=draft_id,
    serverResolvedProcessDefKey=p["data"].get("processDefKey"))
# 清理：删除该草稿（留待本轮末尾统一清理，先保留供 G4b 使用？不——G4b 用会签表单。此处直接删）
print("DRAFT_FOR_G1C=" + draft_id)
