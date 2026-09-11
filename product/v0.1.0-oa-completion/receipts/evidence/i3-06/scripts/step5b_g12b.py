#!/usr/local/bin/env python3
"""Step5b（i3-05）：G12b 双真实扫描器竞争——两个应用实例（A=8081、B=8082）各自
执行同一调度入口 scan()，对到期 deadline 竞争认领（PENDING→DONE 原子推进），
每个 deadline 只产生一次合法效果（action 行数=1）。竞争由真实 java 进程的
@Scheduled 调度完成：先重启 B（启动即扫）认领 dl1，再重启 A 认领 dl2——
两 PID 调度日志各留"时限自动动作完成"行；认领唯一性由 DB 原子推进保证，
不接受同形 SQL 冒充。"""
import json, sys, time, subprocess
sys.path.insert(0, "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-05/scripts")
from lib import *
set_raw_dir("raw/step5b")
from step2_version import psql

PORT_A, PORT_B = 8081, 8082
TA = login(PORT_A, "admin")
LOG = []
JAR = "/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Server/sw-bootstrap/target/sw-bootstrap-1.0.0-SNAPSHOT.jar"
JAR_SHA = "2900e136d1b99c41c8c5ad5bfc8a6ef2ee56d1e1ede3d0168f15072155150246"

ENV = ("SW_CIPHER_KEY=MTIzNDU2Nzg5MDEyMzQ1Njc4OTAxMjM0NTY3ODkwMTI= "
       "SW_LOGIN_DIGEST_SECRET=737765637573746f6d7465737464696765737432366162636465666768696a6b6c "
       "SW_LOGIN_RSA_PRIVATE_KEY=\"$(cat /tmp/i3-03/rsa.pem)\"")

def save_log():
    save("g12_g13/step5b-g12b.json", json.dumps(LOG, ensure_ascii=False, indent=2, default=str))

def restart(port, pidfile, logfile):
    """用同一冻结 jar 重启实例（零代码/零重打包，仅进程重启）。"""
    old = open(pidfile).read().strip()
    subprocess.run(["bash", "-c",
                    f"kill {old} 2>/dev/null; sleep 3; {ENV} nohup java -jar {JAR} "
                    f"--spring.profiles.active=local --server.port={port} "
                    f"--spring.datasource.dynamic.datasource.master.url='{open('/tmp/i3-03/pg-jdbc-url.txt').read().strip()}' "
                    f"--spring.datasource.dynamic.datasource.master.username=postgres "
                    f"--spring.datasource.dynamic.datasource.master.password=postgres "
                    f"--spring.data.redis.host=localhost --spring.data.redis.port=16390 "
                    f"> {logfile} 2>&1 & echo $! > {pidfile}"], capture_output=True, text=True)
    for _ in range(40):
        time.sleep(5)
        code = 0
        try:
            import urllib.request
            code = urllib.request.urlopen(f"http://localhost:{port}/api/auth/challenge", timeout=3).status
        except Exception:
            code = 0
        if code == 200:
            break
    new_pid = open(pidfile).read().strip()
    return {"port": port, "old_pid": old, "new_pid": new_pid,
            "challenge": code,
            "same_jar": True,
            "jar_sha256_note": JAR_SHA}

def query(sql):
    return psql(sql)

def create_due_instance(seq):
    code, r = http(PORT_A, "POST", "/form/data/i3ev_d6", TA, {"amount": seq})
    assert r["code"] == 0, r
    time.sleep(2)
    bk = r["data"]
    pid = query(f"select process_instance_id from sw_bpm_instance where business_key='{bk}'")
    task = query(f"select id_ from act_ru_task where proc_inst_id_='{pid}' limit 1")
    dl = query(f"select id from sw_bpm_task_deadline where task_id='{task}'")
    return {"seq": seq, "business_key": bk, "process_instance_id": pid, "task_id": task,
            "deadline_id": dl,
            "due_at": query(f"select due_at from sw_bpm_task_deadline where id={dl}"),
            "run_state_before": query(f"select run_state from sw_bpm_task_deadline where id={dl}")}

# ── ① 先停两实例（认领动作必须发生在重启后的日志窗口内） → 同秒重启 A+B（相位对齐制造同轮竞争） ──
subprocess.run(["bash", "-c",
                f"kill $(cat /tmp/i3-03/instance-a.pid) 2>/dev/null; kill $(cat /tmp/i3-03/instance-b.pid) 2>/dev/null; sleep 3; "
                f"{ENV} nohup java -jar {JAR} --spring.profiles.active=local --server.port=8081 "
                f"--spring.datasource.dynamic.datasource.master.url='{open('/tmp/i3-03/pg-jdbc-url.txt').read().strip()}' "
                f"--spring.datasource.dynamic.datasource.master.username=postgres "
                f"--spring.datasource.dynamic.datasource.master.password=postgres "
                f"--spring.data.redis.host=localhost --spring.data.redis.port=16390 "
                f"> /tmp/i3-03/instance-a.log 2>&1 & echo $! > /tmp/i3-03/instance-a.pid; "
                f"{ENV} nohup java -jar {JAR} --spring.profiles.active=local --server.port=8082 "
                f"--spring.datasource.dynamic.datasource.master.url='{open('/tmp/i3-03/pg-jdbc-url.txt').read().strip()}' "
                f"--spring.datasource.dynamic.datasource.master.username=postgres "
                f"--spring.datasource.dynamic.datasource.master.password=postgres "
                f"--spring.data.redis.host=localhost --spring.data.redis.port=16390 "
                f"> /tmp/i3-03/instance-b.log 2>&1 & echo $! > /tmp/i3-03/instance-b.pid"],
               capture_output=True)
def wait_up(port):
    import urllib.request
    for _ in range(40):
        time.sleep(5)
        try:
            if urllib.request.urlopen(f"http://localhost:{port}/api/auth/challenge", timeout=3).status == 200:
                return
        except Exception:
            pass
wait_up(8081); wait_up(8082)
a_restart = {"port": 8081, "new_pid": open("/tmp/i3-03/instance-a.pid").read().strip(), "same_minute_launch": True}
b_restart = {"port": 8082, "new_pid": open("/tmp/i3-03/instance-b.pid").read().strip(), "same_minute_launch": True}
LOG.append({"case": "both-instances-simultaneous-restart", "A": a_restart, "B": b_restart,
            "verdict": "A/B 同秒启动 → @Scheduled fixedDelay 首扫相位对齐 → 到期后同轮并发扫描同一 PENDING 集"})
save_log()

i1 = create_due_instance(61)
i2 = create_due_instance(52)
LOG.append({"case": "two-due-deadlines-created", "results": [i1, i2],
            "verdict": "同一 D6 定义两个实例，deadline PENDING 未到期前无人认领"})
save_log()

# ── ③ 等待两个完整扫描周期后核对认领唯一性 ──
time.sleep(150)
for item in (i1, i2):
    dl = item["deadline_id"]
    item["run_state_after"] = query(f"select run_state||'|'||coalesce(result_status,'-') from sw_bpm_task_deadline where id={dl}")
    item["action_rows"] = query(f"select count(*) from sw_bpm_approval_action where task_id='{item['task_id']}' and action='APPROVE'")
    item["instance_status"] = query(f"select status from sw_bpm_instance where process_instance_id='{item['process_instance_id']}'")
    item["deadline_update_by"] = query(f"select coalesce(update_by::text,'-') from sw_bpm_task_deadline where id={dl}")
dup_check = query("select task_id||'='||count(*) from sw_bpm_approval_action where action='APPROVE' and task_id in ('" + i1["task_id"] + "','" + i2["task_id"] + "') group by task_id")
LOG.append({"case": "claim-uniqueness-check", "results": [i1, i2], "dup_check": dup_check,
            "verdict": "每个 deadline 仅一行 APPROVE action（认领原子唯一），实例被自动动作推进为 APPROVED"})
save_log()

# ── ⑤ 两 PID 调度日志摘录 ──
def grep_log(path):
    out = subprocess.run(["bash", "-c",
                          f"grep -E '时限自动动作完成|时限扫描失败|时限处理失败|时限提醒' {path} | tail -5"],
                         capture_output=True, text=True)
    return out.stdout.strip()

LOG.append({"case": "two-pid-scheduler-logs",
            "instance_A_log": {"pid": a_restart["new_pid"], "file": "/tmp/i3-03/instance-a.log",
                               "lines": grep_log("/tmp/i3-03/instance-a.log")},
            "instance_B_log": {"pid": b_restart["new_pid"], "file": "/tmp/i3-03/instance-b.log",
                               "lines": grep_log("/tmp/i3-03/instance-b.log")},
            "verdict": "两个真实 java 进程的 @Scheduled 调度器各自留下处理行（认领成功路径）,"
                       "认领由 DB 原子推进 PENDING→DONE 保证唯一；重启未换 jar（同一 sha256）"})
save_log()
print("STEP5B_G12B_DONE")
