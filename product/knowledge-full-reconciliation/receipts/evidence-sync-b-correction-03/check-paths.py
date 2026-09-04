import os, re, sys

p = 'knowledge/feature-reconciliation-products.md'
out = []
rows = {}
for line in open(p):
    m = re.match(r'^\| ([a-z0-9.\-]+) \|', line)
    if not m: continue
    key = m.group(1)
    parts = line.split('|')
    ev = parts[3].strip()
    rows[key] = ev

# 提取证据列中的根相对路径 token（product/...、knowledge/...）
path_re = re.compile(r'(?:product/[A-Za-z0-9._\-]+/(?:receipts|passed|ready)/[A-Za-z0-9._\-]+\.md|knowledge/features/[A-Za-z0-9._\-]+\.md)')

all_ok = True
for key in sorted(rows):
    ev = rows[key]
    paths = path_re.findall(ev)
    if not paths:
        out.append(f"{key}\tNO-PATH\t{ev}")
        all_ok = False
        continue
    for pth in paths:
        ok = os.path.exists(pth)
        if not ok:
            all_ok = False
            out.append(f"{key}\tMISSING\t{pth}\t{ev}")
        else:
            out.append(f"{key}\tOK\t{pth}")

if all_ok:
    print(f"ALL {len(rows)} ROWS HAVE AT LEAST ONE EXISTING PATH")
else:
    print(f"SOME MISSING ({len(rows)} rows checked)")
for l in out:
    print(l)
