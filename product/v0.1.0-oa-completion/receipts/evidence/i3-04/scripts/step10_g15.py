#!/usr/bin/env python3
"""Step10: G15 身份矩阵固化——每个测试身份的 /me 权威状态 + 关键动作正负结果索引。
动作级正负证据由 step3/step6/step6b/step9 的原始报文承载，本脚本固化身份事实。"""
import json, sys
sys.path.insert(0, "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-04")
from lib import *
set_raw_dir("raw/step10")
from step2_version import psql

PORT_A = 8081
out = {"identities": []}

for username, expect_note in [
    ("admin", "管理员/发起人/审批人A"),
    ("user2", "审批人B/转办受让人/受托人/会签参与人"),
    ("user3", "沟通发起方/代理人（AUTHORIZE 被拒侧）"),
    ("user4", "沟通接收人（无审批权验证）"),
    ("user5", "无角色身份（无权验证）"),
    ("tenant1user", "跨租户身份（租户1）"),
]:
    try:
        tok = login(PORT_A, username)
        code, me = http(PORT_A, "GET", "/system/auth/me", tok)
        d = me.get("data") or {}
        u = d.get("user") or {}
        roles = ",".join(str(r) for r in (d.get("roles") or [])) if isinstance(d.get("roles"), list) else str(d.get("roles"))
        assert u.get("id") is not None and u.get("tenantId") is not None, \
            f"身份字段非空断言失败: id={u.get('id')} tenant={u.get('tenantId')}"
        out["identities"].append({
            "username": username, "login": "OK",
            "userId": u.get("id"), "tenantId": u.get("tenantId"),
            "roles": roles, "realName": u.get("displayName"),
            "superAdmin": d.get("superAdmin"),
            "permissionCount": len(d.get("permissions") or []),
        })
    except Exception as e:
        out["identities"].append({"username": username, "login": "FAIL " + str(e)[:60]})

# 关键负向动作索引（原始报文见各步骤 raw-transcript.txt）
out["negative_action_index"] = {
    "转办本人拒绝": "raw/step3 (2401 ACTION_SELF_INVALID)",
    "无权处理任务(user4 complete)": "raw/step3 g11_communicate receiver_complete_rejected",
    "跨租户 complete 拒绝": "raw/step6 g15 cross_tenant_complete",
    "跨租户实例读取拒绝": "raw/step6 g15 cross_tenant_instance_read",
    "无角色 user5": "本脚本 /me + raw/step6 v-perm 种子覆盖",
    "越界撤回拒绝": "raw/step3 g11_withdraw boundary_reject",
    "重复废弃幂等": "raw/step3 g11_discard repeat",
}
save("g15_idents/identity-matrix.json", out)
print(json.dumps(out["identities"], ensure_ascii=False, indent=1)[:900])
print("STEP10_DONE")
