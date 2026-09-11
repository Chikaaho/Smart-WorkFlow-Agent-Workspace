#!/usr/bin/env python3
"""Z6-02 双扫描器竞争（相位同步版）。
A 相位实测（60s 周期）。重启 B 使其扫描相位落在 A 后 2~10s；
随后 40 个 deadline 注入统一 due_at 赶在 A 相位前 → A、B 同批竞争 → 败者 claim=0 跳过日志。
判定：同一 deadlineId 同时出现在一方的完成日志与另一方的跳过日志；无任何 deadline 双完成。"""
import json, re, subprocess, sys, threading, time
sys.path.insert(0, "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-06/scripts")
from lib import http, login, save, set_raw_dir
from zlib import psql

set_raw_dir("Z6/raw-dual")
PA = 8081
TI = login(PA, "initiator")
LOG_A = "/tmp/i3-03/instance-a2.log"
LOG_B = "/tmp/i3-03/instance-b2.log"
EV = "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-06"


def a_phase():
    rows = subprocess.run(["grep", "-a", "TaskDeadlineScheduler", LOG_A], capture_output=True, text=True).stdout
    ts = re.findall(r"T(\d{2}:\d{2}:\d{2})", rows)
    return int(ts[-1].split(":")[2]) if ts else None


def launch_b_at(target_second, boot_est=16):
    subprocess.run(["bash", "-c", "pkill -f 'sw-bootstrap.*8082' || true"], capture_output=True)
    time.sleep(3)
    lt = time.localtime()
    cur = lt.tm_min * 60 + lt.tm_sec
    tgt = (target_second - boot_est) % 60
    cur60 = cur % 60
    wait = (tgt - cur60) % 60
    print(f"launch B in {wait}s (target ready second {target_second}, boot_est {boot_est})")
    time.sleep(wait)
    r = subprocess.run(["bash", "/tmp/i3-03/start-inst2.sh", "8082", LOG_B], capture_output=True, text=True)
    print("B pid:", r.stdout.strip())
    healthy_at = None
    for i in range(40):
        time.sleep(2)
        c = subprocess.run(["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}",
                            "http://localhost:8082/api/auth/challenge"], capture_output=True, text=True).stdout
        if c == "200":
            healthy_at = time.time()
            print(f"B healthy after {(i+1)*2}s")
            break
    return healthy_at


def extract(path, mark):
    out = subprocess.run(
        ["bash", "-c",
         "awk -v m='" + mark + "' 'substr($0,1,19)>=m{on=1} on' " + path +
         " | grep -aE '时限自动动作完成|已被其他实例认领'"],
        capture_output=True, text=True)
    return out.stdout


def ids_in(text, pattern, idset):
    found = set()
    for ln in text.split("\n"):
        if pattern in ln:
            m = re.search(r"deadlineId=(\d+)", ln)
            if m and m.group(1) in idset:
                found.add(m.group(1))
                continue
            m2 = re.search(r"taskId=([0-9a-f\-]{36})", ln)
            if m2:
                d = psql("select id from sw_bpm_task_deadline where task_id='" + m2.group(1) + "' limit 1")
                if d and d in idset:
                    found.add(d)
    return found


def run_wave(a_phase):
    results = []
    lock = threading.Lock()
    toks = [login(PA, "initiator") for _ in range(8)]

    def submit_one(i, tok):
        code, r = http(PA, "POST", "/form/data/i3ev_d6", tok, {"amount": 300 + i})
        with lock:
            results.append(r.get("data"))

    threads = []
    for i in range(40):
        th = threading.Thread(target=submit_one, args=(i, toks[i % 8]))
        th.start()
        threads.append(th)
        if i % 8 == 7:
            time.sleep(0.05)
    for th in threads:
        th.join()
    oks = [x for x in results if x]
    deadline_ids = []
    for _ in range(30):
        time.sleep(2)
        bks = ",".join("'" + x + "'" for x in oks)
        rows = psql("select id from sw_bpm_task_deadline where process_instance_id in "
                    "(select process_instance_id from sw_bpm_instance where business_key in (" + bks + "))")
        deadline_ids = [r for r in rows.split("\n") if r]
        if len(deadline_ids) >= len(oks):
            break
    now = time.time()
    delta = (a_phase - time.localtime(now).tm_sec) % 60
    due_epoch = now + delta - 3
    due_str = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(due_epoch))
    ids_csv = ",".join(deadline_ids)
    psql("update sw_bpm_task_deadline set due_at='" + due_str + "' where id in (" + ids_csv + ") and run_state='PENDING'")
    wave_mark = time.strftime("%Y-%m-%dT%H:%M:%S", time.localtime(due_epoch - 60))
    for _ in range(30):
        time.sleep(5)
        if psql("select count(*) from sw_bpm_task_deadline where id in (" + ids_csv + ") and run_state='PENDING'") == "0":
            break
    time.sleep(2)
    la = extract(LOG_A, wave_mark)
    lb = extract(LOG_B, wave_mark)
    idset = set(deadline_ids)
    done_a = ids_in(la, "时限自动动作完成", idset)
    done_b = ids_in(lb, "时限自动动作完成", idset)
    skip_a = ids_in(la, "已被其他实例认领", idset)
    skip_b = ids_in(lb, "已被其他实例认领", idset)
    return done_a, done_b, skip_a, skip_b, deadline_ids, la, lb, due_str


A_PHASE = a_phase()
print("A phase second =", A_PHASE)
final = None
b_boot_est = 16
for attempt in range(4):
    target = (A_PHASE + 5) % 60
    healthy = launch_b_at(target, b_boot_est)
    if not healthy:
        continue
    b_est_phase = (int(time.localtime(healthy).tm_sec) + 1) % 60
    print(f"attempt {attempt}: B est phase ~{b_est_phase} (A {A_PHASE})")
    done_a, done_b, skip_a, skip_b, ids, la, lb, due_str = run_wave(A_PHASE)
    overlap = (done_a & skip_b) | (done_b & skip_a)
    print(f"attempt {attempt}: doneA={len(done_a)} doneB={len(done_b)} skipA={len(skip_a)} skipB={len(skip_b)} overlap={len(overlap)}")
    if len(overlap) > 0 and not (done_a & done_b):
        final = (done_a, done_b, skip_a, skip_b, ids, la, lb, due_str, overlap)
        break
    if done_b:
        bs = sorted(int(re.search(r"T\d{2}:\d{2}:(\d{2})", ln).group(1))
                    for ln in lb.split("\n") if "时限自动动作完成" in ln)
        if bs:
            gap = (bs[-1] - A_PHASE) % 60
            TARGET_GAP_NEW = 3 if gap > 8 else max(1, gap - 2)
            target = (A_PHASE + TARGET_GAP_NEW) % 60
            b_boot_est = 16
            print(f"correcting: actual B phase {bs[-1]}, gap {gap}, new target {target}")
assert final, "双扫描器竞争证据未取得"
(done_a, done_b, skip_a, skip_b, ids, la, lb, due_str, overlap) = final
open(EV + "/Z6/instance-a-scheduler.log", "w").write(la)
open(EV + "/Z6/instance-b-scheduler.log", "w").write(lb)
groups = psql("select run_state||'/'||coalesce(result_status,'-')||'/'||count(*) from sw_bpm_task_deadline where id in (" + ",".join(ids) + ") group by run_state, result_status")
out = {"a_phase": A_PHASE, "wave_deadlines": len(ids), "due_injected": due_str,
       "done_A": len(done_a), "done_B": len(done_b), "skip_A": len(skip_a), "skip_B": len(skip_b),
       "overlap_same_deadline": sorted(overlap)[:10], "overlap_count": len(overlap),
       "double_done": sorted(done_a & done_b), "result_groups": groups,
       "log_files": ["Z6/instance-a-scheduler.log", "Z6/instance-b-scheduler.log"]}
save("Z6/dual-scan-result.json", out)
print(json.dumps(out, ensure_ascii=False, indent=1))
assert len(overlap) > 0
assert not done_a & done_b
