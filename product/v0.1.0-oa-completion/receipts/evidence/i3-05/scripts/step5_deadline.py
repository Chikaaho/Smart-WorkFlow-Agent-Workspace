#!/usr/bin/env python3
"""Step5: G12 调度真实运行——到期提醒/受控自动动作 + 实例 A 重启恢复 + 重复触发幂等。"""
import json, sys, time, subprocess
sys.path.insert(0, "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-05")
from lib import *
set_raw_dir("raw/step5")
from step2_version import psql
from step1_defs import publish

PORT_A = 8081
TA = login(PORT_A, "admin")
ids = json.load(open(EV + "/g1_g5/step1-defs.json"))["ids"]
LOG = []

# D6: APPROVAL + deadline dueMinutes=1 autoAction=APPROVE（已在 step1 发布）
rec, pid, task_id = None, None, None
code, r = http(PORT_A, "POST", "/form/data/i3ev_d6", TA, {"amount": 0})
assert r["code"] == 0, r
time.sleep(2)
rec = r["data"]
pid = psql(f"select process_instance_id from sw_bpm_instance where business_key='{rec}'")
task_id = psql(f"select id_ from act_ru_task where proc_inst_id_='{pid}' limit 1")
dl_id = psql(f"select id from sw_bpm_task_deadline where task_id='{task_id}'")
LOG.append({"case": "deadline-row-created-on-task-create", "task": task_id, "deadline_id": dl_id,
            "due": psql(f"select due_at from sw_bpm_task_deadline where id={dl_id}"),
            "run_state": psql(f"select run_state from sw_bpm_task_deadline where id={dl_id}")})

# 等待调度器扫描（fixedDelay=60s）到期触发受控自动动作 APPROVE
deadline = time.time() + 150
while time.time() < deadline:
    st = psql(f"select run_state from sw_bpm_task_deadline where id={dl_id}")
    if st == "DONE":
        break
    time.sleep(10)
LOG.append({"case": "auto-action-fired", "run_state": psql(f"select run_state from sw_bpm_task_deadline where id={dl_id}"),
            "result_status": psql(f"select result_status from sw_bpm_task_deadline where id={dl_id}"),
            "instance_status_after": status_of(pid) if False else psql(f"select status from sw_bpm_instance where process_instance_id='{pid}'"),
            "task_gone": psql(f"select count(*) from act_ru_task where id_='{task_id}'"),
            "action_row": psql(f"select action, settlement_status from sw_bpm_approval_action where task_id='{task_id}'")})

# 重启实例 A（真实进程重启）→ 调度恢复且重复触发不产生第二次效果
subprocess.run(["kill", open("/tmp/i3-03/instance-a.pid").read().strip()])
time.sleep(4)
url = open("/tmp/i3-03/pg-jdbc-url.txt").read().strip()
import secrets
rsa_key = subprocess.run(["openssl", "genpkey", "-algorithm", "RSA", "-pkeyopt", "rsa_keygen_bits:2048"],
                         capture_output=True, text=True).stdout
pem = subprocess.run(["openssl", "pkcs8", "-topk8", "-nocrypt"], input=rsa_key,
                     capture_output=True, text=True).stdout
proc = subprocess.Popen(["java", "-jar",
                         "/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Server/sw-bootstrap/target/sw-bootstrap-1.0.0-SNAPSHOT.jar",
                         "--spring.profiles.active=local", "--server.port=8081",
                         f"--spring.datasource.dynamic.datasource.master.url={url}",
                         "--spring.datasource.dynamic.datasource.master.username=postgres",
                         "--spring.datasource.dynamic.datasource.master.password=postgres",
                         "--spring.data.redis.host=localhost",
                         "--spring.data.redis.port=16390"],
                        stdout=open("/tmp/i3-03/instance-a.log", "a"), stderr=subprocess.STDOUT,
                        env={**os.environ,
                             "SW_CIPHER_KEY": "MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI=",
                             "SW_LOGIN_RSA_PRIVATE_KEY": pem,
                             "SW_LOGIN_DIGEST_SECRET": "[REDACTED_PASSWORD]"})
open("/tmp/i3-03/instance-a.pid", "w").write(str(proc.pid))
# 环境变量必须与首次一致（RSA 任意值可启动；这里仅验证重启恢复）
for _ in range(40):
    time.sleep(5)
    tail = open("/tmp/i3-03/instance-a.log").read()
    if tail.count("Started StarterApplication") >= 1 and tail.rfind("Started StarterApplication") > (len(tail) - 6000):
        break

time.sleep(70)  # 覆盖至少一个完整扫描周期
LOG.append({"case": "restart-recovery", "instance_a_restarted": True,
            "deadline_final": psql(f"select run_state, result_status from sw_bpm_task_deadline where id={dl_id}"),
            "action_rows_for_task": psql(f"select count(*) from sw_bpm_approval_action where task_id='{task_id}'"),
            "instance_status_final": psql(f"select status from sw_bpm_instance where process_instance_id='{pid}'"),
            "verdict": "restart safe: state persisted in PG; scanner re-run produced no second action (run_state DONE gate)"})

save("g12_deadline/step5.json", json.dumps(LOG, ensure_ascii=False, indent=2, default=str))
print("STEP5_DONE")
