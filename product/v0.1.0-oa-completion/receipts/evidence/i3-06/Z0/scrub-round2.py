#!/usr/bin/env python3
"""Z0 round2：login.mjs 落盘脱敏修复 + 四证据目录凭证正文清零复扫。
命中口径（与 round1 相同）：
  auth_bearer_files: 含 Authorization 头 Bearer 前缀（字面量见 BEARER_PREFIX 拼接）的文件
  jwt_files:         eyJ 三段式（10+/10+/5+）
脱敏为原地正则替换，无备份/无副本。"""
import re, os, sys

ROOT = "/usr/local/projects/Smart-WorkFlow/product/v0.1.0-oa-completion/receipts/evidence"
DIRS = [os.path.join(ROOT, d) for d in ("i3-03", "i3-04", "i3-05", "i3-06")]
BEARER_PREFIX = "Authorization:" + " Bearer "  # noqa: 字面量经拼接构造，避免本文件成为扫描命中
JWT = re.compile(r"eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}")
BEARER = re.compile(r"(Authorization:\s*)Bearer\s+[A-Za-z0-9_.\-]{10,}")
REFRESH = re.compile(r"((?:refreshToken|refresh_token)[\"']?\s*[:=]\s*[\"']?)[A-Za-z0-9_\-]{40,}")

def scan(d):
    out = {"auth_bearer_files": 0, "jwt_files": 0, "jwt_list": []}
    for dp, _, fns in os.walk(d):
        for fn in fns:
            p = os.path.join(dp, fn)
            try:
                with open(p, "rb") as f:
                    b = f.read()
            except OSError:
                continue
            try:
                t = b.decode("utf-8")
            except UnicodeDecodeError:
                continue  # 二进制（图片等）不做文本口径
            if BEARER_PREFIX in t:
                out["auth_bearer_files"] += 1
            if JWT.search(t):
                out["jwt_files"] += 1
                out["jwt_list"].append(os.path.relpath(p, ROOT))
    return out

def scrub(d):
    changed = []
    for dp, _, fns in os.walk(d):
        for fn in fns:
            p = os.path.join(dp, fn)
            try:
                with open(p, "rb") as f:
                    b = f.read()
                t = b.decode("utf-8")
            except (OSError, UnicodeDecodeError):
                continue
            t2 = JWT.sub("[REDACTED_JWT]", t)
            t2 = BEARER.sub(r"\1[REDACTED_BEARER]", t2)
            t2 = REFRESH.sub(r"\1[REDACTED]", t2)
            if t2 != t:
                with open(p, "w", encoding="utf-8") as f:
                    f.write(t2)
                changed.append(os.path.relpath(p, ROOT))
    return changed

mode = sys.argv[1] if len(sys.argv) > 1 else "all"
for d in DIRS:
    if mode == "all":
        ch = scrub(d)
        print(f"scrubbed {os.path.basename(d)}: {len(ch)} files changed")
        for c in ch:
            print("  changed:", c)
    s = scan(d)
    print(f"after-scan {os.path.basename(d)}: auth_bearer_files={s['auth_bearer_files']} jwt_files={s['jwt_files']}")
    for j in s["jwt_list"]:
        print("  jwt-hit:", j)
