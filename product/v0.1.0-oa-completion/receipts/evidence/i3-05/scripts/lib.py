#!/usr/bin/env python3
"""I3-03 证据脚本公共库：登录/HTTP/断言/落盘 + 原始报文捕获。"""
import json, os, urllib.request, urllib.error, time, traceback, hashlib, re

EV = "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence/i3-05"

RAW = {"dir": None, "seq": 0}

def set_raw_dir(rel):
    """开启原始报文落盘：该步骤后续所有 http()/psql 调用完整请求/响应/SQL/结果追加写入 <rel>/raw-transcript.txt。
    首次调用生效——后续被 import 的 step 模块重复调用不会覆盖主脚本的目录。"""
    if RAW["dir"]:
        return
    RAW["dir"] = rel
    os.makedirs(os.path.join(EV, rel), exist_ok=True)

def _raw_write(block):
    if not RAW["dir"]:
        return
    with open(os.path.join(EV, RAW["dir"], "raw-transcript.txt"), "a") as f:
        f.write(block)

def redact_header(k, v):
    v = str(v)
    if k.lower() == "authorization":
        if v.lower().startswith("bearer "):
            digest = hashlib.sha256(v[7:].encode()).hexdigest()[:8]
            return f"Authorization: [REDACTED_BEARER sha256:{digest}]"
        return f"{k}: [REDACTED]"
    if re.search(r"eyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{10,}", v):
        return re.sub(r"eyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}", "[REDACTED_JWT]", v)
    return v

def redact_text(text):
    text = re.sub(r"eyJ[A-Za-z0-9_-]{30,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}", "[REDACTED_JWT]", text)
    text = re.sub(r"(refreshToken\"?[:=]\"?)[A-Za-z0-9_-]{40,}", r"\1[REDACTED]", text)
    return text

def http(port, method, path, token=None, body=None, raw=False):
    url = f"http://localhost:{port}/api{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Content-Type", "application/json")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    headers = {k: v for k, v in req.header_items()}
    try:
        with urllib.request.urlopen(req, timeout=75) as r:
            payload = r.read().decode()
            code = r.status
    except urllib.error.HTTPError as e:
        payload = e.read().decode()
        code = e.code
    except Exception as e:  # 连接级失败也必须留痕
        payload = json.dumps({"transport_error": str(e)})
        code = -1
    RAW["seq"] += 1
    seq = f"{RAW['seq']:04d}"
    _raw_write(
        f"===== REQ {seq} {time.strftime('%Y-%m-%dT%H:%M:%S')} =====\n"
        f"{method} {url}\n" +
        "".join(f"{k}: {redact_header(k, v)}\n" for k, v in headers.items()) +
        (f"\n{data.decode()}\n" if data is not None else "\n") +
        f"----- RESP {seq} -----\nSTATUS: {code}\n\n{redact_text(payload)}\n\n")
    if raw:
        return code, payload
    try:
        return code, json.loads(payload)
    except Exception:
        return code, {"raw": payload}

def login(port, username, password="[REDACTED_PASSWORD]"):
    import subprocess
    argv = ["node", f"{EV}/scripts/login.mjs", str(port), username, password]
    if RAW["dir"]:
        argv.append(os.path.join(EV, RAW["dir"], "raw-transcript.txt"))
    out = subprocess.run(argv, capture_output=True, text=True)
    tok = out.stdout.strip()
    if out.returncode != 0:
        RAW["seq"] += 1
        _raw_write(f"===== LOGIN FAIL {RAW['seq']:04d} =====\nuser={username} port={port}\n"
                   f"stdout: {out.stdout}\nstderr: {out.stderr}\n\n")
        raise RuntimeError(f"login fail {username}@{port}: {out.stderr.strip()}")
    RAW["seq"] += 1
    _raw_write(f"===== LOGIN OK {RAW['seq']:04d} {time.strftime('%Y-%m-%dT%H:%M:%S')} =====\n"
               f"POST /api/auth/login (challenge->RSA-OAEP->login 链) user={username} port={port}\n"
               f"----- RESP -----\naccessToken_len={len(tok)} accessToken_sha256={hashlib.sha256(tok.encode()).hexdigest()}\n\n")
    return tok

SNAPSHOT_META = {
    "snapshotId": "i3-05-frozen-b",
    "jar_sha256": "1172aff5b19c8a514fb1218d904b2e6554327409b9cc8a22e7b0e6b0dc3e7aee",
    "instance_A": "PID 82866 @ 8081",
    "instance_B": "PID 82913 @ 8082",
    "fingerprint_file": "evidence/i3-05/final-candidate-fingerprint.txt",
    "note": "v1 frozen-a jar=2900e136…；a→b 仅 G14b 反证修复 recordLifecycle 快照",
}

def _inject_snapshot(obj):
    if isinstance(obj, dict) and "_snapshot" not in obj:
        obj = dict(obj)
        obj["_snapshot"] = SNAPSHOT_META
        return obj
    if isinstance(obj, list):
        return {"_snapshot": SNAPSHOT_META, "rows": obj}
    return obj

def save(path, content):
    full = os.path.join(EV, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    if isinstance(content, str):
        try:
            parsed = json.loads(content)
            if isinstance(parsed, (dict, list)):
                content = _inject_snapshot(parsed)
        except Exception:
            # 非 JSON 文本：头部追加快照注释行
            head = json.dumps(SNAPSHOT_META, ensure_ascii=False)
            content = "# snapshot=" + head + "\n" + content
    else:
        content = _inject_snapshot(content)
    with open(full, "w") as f:
        f.write(content if isinstance(content, str) else json.dumps(content, ensure_ascii=False, indent=2, default=str))
    return full

def record(gid, name, request_desc, resp, verdict, extra=None):
    entry = {"gid": gid, "case": name, "request": request_desc, "response": resp,
             "verdict": verdict}
    if extra:
        entry["extra"] = extra
    return entry

def expect(cond, ok, fail_desc):
    if not cond:
        raise AssertionError("FAIL: " + fail_desc)

def node(id_, type_, x, y, config=None):
    e = {"id": id_, "kind": "node", "type": type_, "x": float(x), "y": float(y), "config": config or {}}
    return e

def edge(id_, s, t):
    return {"id": id_, "kind": "edge", "source": s, "target": t}

def linear_graph(name, form_key, nodes_cfg):
    """nodes_cfg: [(type, config)] 线性 START...END"""
    elements = [node("node_start", "START", 100, 300)]
    prev = "node_start"
    for i, (t, cfg) in enumerate(nodes_cfg):
        nid = f"node_{i+1}"
        elements.append(node(nid, t, 300 + i * 220, 300, cfg))
        elements.append(edge(f"edge_{i+1}", prev, nid))
        prev = nid
    elements.append(node("node_end", "END", 300 + len(nodes_cfg) * 220, 300))
    elements.append(edge(f"edge_{len(nodes_cfg)+1}", prev, "node_end"))
    return {"processKey": "", "name": name, "formKey": form_key, "contractVersion": 2,
            "elements": elements, "canvas": {}}

def run_stage(fn):
    try:
        fn()
        print(f"[OK] {fn.__name__}")
        return True
    except Exception:
        print(f"[FAIL] {fn.__name__}")
        traceback.print_exc()
        return False
