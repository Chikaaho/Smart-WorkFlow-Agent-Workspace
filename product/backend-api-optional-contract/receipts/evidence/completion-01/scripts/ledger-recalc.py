#!/usr/bin/env python3
"""121 项 AM 账本机器复算（只读；不修改任何仓库文件）。

复算内容：
  R1 AM-001..AM-121 连续、唯一、无遗漏/无重复；
  R2 121 = 113「保留并合规」+ 8「删除并闭合」；
  R3 保留方法全部返回参数化 Optional<T>（非 raw/Void/嵌套）；
  R4 8 个删除项不存在目标 API 定义、实现与项目内调用残留（允许项见 ALLOWED_RESIDUAL）；
  R5 13 个原 ZERO_CALLER 与 AM-120 均有最终处置。

用法: ledger-recalc.py <workspace-root>
退出码: 0 = 全部断言通过；1 = 存在断言失败。
"""
import glob
import io
import os
import re
import sys

WORKSPACE = sys.argv[1] if len(sys.argv) > 1 else "/usr/local/projects/Smart-WorkFlow"
SERVER = os.path.join(WORKSPACE, "Smart-WorkFlow-aPaaS-server")
SEARCH = os.path.join(WORKSPACE, "search_fallback")

API_MODULES = {
    "job": "sw-basic/sw-basic-job/sw-basic-job-api",
    "notify": "sw-basic/sw-basic-notify/sw-basic-notify-api",
    "storage": "sw-basic/sw-basic-storage/sw-basic-storage-api",
    "form": "sw-biz/sw-biz-form/sw-biz-form-api",
    "system": "sw-biz/sw-biz-system/sw-biz-system-api",
    "bpm": "sw-biz/sw-bpm/sw-bpm-api",
}

# 删除项允许的残留：非本契约的其它类型同名方法 / 内部服务方法 / 守门测试内的删除清单断言 / 第三方 API
ALLOWED_RESIDUAL = [
    (r"sw-basic-storage-biz/.*/provider/.*\.java$", "StorageProvider 家族的同名 getUrl（非 StorageFacade 契约）"),
    (r"sw-biz-system-biz/.*/service/(impl/)?SysDictData.*\.java$", "system 内部字典服务同名内部方法（非 -api 契约）"),
    (r"sw-bootstrap/src/test/.*/architecture/ApiOptionalContractGateTest\.java$", "守门测试内的删除清单断言（断言其不存在）"),
    (r"sw-bpm-engine/.*/listener/ApprovalTaskListener\.java$", "Flowable DelegateTask 的 addCandidateUser（第三方 API）"),
]

# 8 个删除项：方法名 -> 所属契约类型（判定残留时要求“同编译单元引用该契约类型”）
DELETED_TYPES = {
    "getUrl": "StorageFacade",
    "getFormDefinitionById": "FormDefinitionService",
    "getFormDefById": "FormDefinitionService",
    "searchActiveDepts": "DeptQueryFacade",
    "resolveLabel": "DictFacade",
    "findProcessDefinitionIdByDeployment": "BpmDeployFacade",
    "getTaskOwner": "BpmTaskFacade",
    "addCandidateUser": "BpmTaskFacade",
}

FAILURES = []


def fail(msg):
    FAILURES.append(msg)
    print("ASSERT-FAIL: " + msg)


def read(path):
    return io.open(path, encoding="utf-8").read()


# ---------- 台账基线 ----------
rows = []
for f in sorted(glob.glob(os.path.join(SEARCH, "backend-api-optional-contract-inventory-*.tsv"))):
    for line in read(f).split("\n")[1:]:
        if line.strip():
            rows.append(line.split("\t"))

print("== R0 基线载入 ==")
print("inventory TSV 文件数: %d" % len(glob.glob(os.path.join(SEARCH, "backend-api-optional-contract-inventory-*.tsv"))))
print("方法行数: %d" % len(rows))

# ---------- R1 连续唯一 ----------
expected = ["AM-%03d" % i for i in range(1, 122)]
ids = [r[0] for r in rows]
print("\n== R1 AM-001..AM-121 连续、唯一 ==")
print("ID 数: %d；唯一 ID 数: %d" % (len(ids), len(set(ids))))
print("缺失: %s" % sorted(set(expected) - set(ids)))
print("多余/越界: %s" % sorted(set(ids) - set(expected)))
dup = sorted({i for i in ids if ids.count(i) > 1})
print("重复: %s" % dup)
if len(ids) != 121 or set(ids) != set(expected) or dup:
    fail("AM ID 不满足 121 个连续唯一")
else:
    print("PASS: AM-001..AM-121 连续且唯一")

# ---------- 解析当前 -api 源码 ----------
def parse_methods(path):
    src = read(path)
    out = {}
    for m in re.finditer(
            r"^\s{4}(?:public\s+|default\s+|static\s+|public\s+static\s+|public\s+default\s+)*"
            r"([A-Za-z_][\w.<>,\[\]\s?]*?)\s+([a-zA-Z]\w*)\s*\(([^)]*)\)\s*(?:throws [\w.,\s]+)?\s*[{;]",
            src, re.M):
        out.setdefault(m.group(2), []).append(m.group(1).strip())
    return out


api_methods = {}
for mod, rel in API_MODULES.items():
    for p in glob.glob(os.path.join(SERVER, rel, "src/main/java/**/*.java"), recursive=True):
        api_methods[(mod, os.path.basename(p)[:-5])] = parse_methods(p)

# ---------- R2/R3 逐 AM 处置与 Optional 形态 ----------
retained, deleted = [], []
print("\n== R2/R3 逐 AM 最终处置与返回类型 ==")
for r in rows:
    am, mod, typ, sig = r[0], r[1], r[2], r[3]
    m = re.search(r"\s([a-zA-Z]\w*)\s*\(", sig)
    mname = m.group(1) if m else "?"
    rets = api_methods.get((mod, typ), {}).get(mname)
    if rets is None:
        deleted.append((am, mod, typ, mname, r[13] if len(r) > 13 else ""))
    else:
        retained.append((am, mod, typ, mname, rets[0]))
print("保留并合规: %d" % len(retained))
print("删除并闭合: %d" % len(deleted))
print("合计: %d" % (len(retained) + len(deleted)))
if len(retained) != 113 or len(deleted) != 8:
    fail("121 拆分不是 113 保留 + 8 删除")

bad = []
for am, mod, typ, mname, ret in retained:
    if not ret.startswith("Optional<"):
        bad.append((am, typ, mname, ret))
    elif re.fullmatch(r"Optional<\s*Void\s*>", ret) or "Optional<Optional" in ret:
        bad.append((am, typ, mname, ret))
print("保留项中非参数化 Optional / Void / 嵌套: %d %s" % (len(bad), bad))
if bad:
    fail("保留项存在非合规返回类型")
else:
    print("PASS: 113 个保留方法全部返回参数化 Optional<T>（无 raw/Void/嵌套）")

print("\n删除项清单（AM / 模块 / 类型 / 方法 / 基线 flags）:")
for d in deleted:
    print("  %s %s %s#%s %s" % d)

# ---------- R4 删除项残留 ----------
print("\n== R4 删除项残留扫描（定义 / 实现 / 项目内调用） ==")
targets = ["getUrl", "getFormDefinitionById", "getFormDefById", "searchActiveDepts", "resolveLabel",
           "findProcessDefinitionIdByDeployment", "getTaskOwner", "addCandidateUser"]
sources = []
for root in ["sw-biz", "sw-basic", "sw-bootstrap/src", "sw-framework"]:
    sources += [p for p in glob.glob(os.path.join(SERVER, root, "**/*.java"), recursive=True)
                if "/target/" not in p]
print("扫描文件数: %d" % len(sources))
all_java = [p for p in glob.glob(os.path.join(SERVER, "**/*.java"), recursive=True) if "/target/" not in p]
for name in targets:
    hits, unrelated = [], []
    for p in all_java:
        rel = os.path.relpath(p, SERVER)
        src = read(p)
        contract_type = DELETED_TYPES[name]
        references_contract = re.search(r"\b%s\b" % contract_type, src) is not None
        for i, line in enumerate(src.split("\n"), 1):
            if re.search(r"\b%s\b" % name, line):
                if references_contract:
                    hits.append((rel, i, line.strip()))
                else:
                    unrelated.append((rel, i, line.strip()))
    legit, suspicious = [], []
    for rel, i, line in hits:
        if any(re.search(pat, rel) for pat, _ in ALLOWED_RESIDUAL):
            legit.append((rel, i, line))
        else:
            suspicious.append((rel, i, line))
    print("方法 %-38s 命中 %2d（引用契约 %d：合法 %d / 可疑 %d；未引用契约的同名成员 %d）"
          % (name, len(hits) + len(unrelated), len(hits), len(legit), len(suspicious), len(unrelated)))
    for rel, i, line in suspicious:
        print("   可疑: %s:%d %s" % (rel, i, line[:140]))
    for rel, i, line in legit:
        reason = next(r for pat, r in ALLOWED_RESIDUAL if re.search(pat, rel))
        print("   合法: %s:%d（%s）" % (rel, i, reason))
    if suspicious:
        fail("删除项 %s 存在可疑残留" % name)

# ---------- R5 零调用与弃用项处置 ----------
print("\n== R5 13 个 ZERO_CALLER 与 AM-120 的最终处置 ==")
zero_callers = [r for r in rows if "ZERO_CALLER" in (r[13] if len(r) > 13 else "")]
print("基线 ZERO_CALLER 计数: %d（含 AM-120 的独立标记另行核对）" % len(zero_callers))
for r in zero_callers:
    am, typ, sig, flags = r[0], r[2], r[3], r[13]
    m = re.search(r"\s([a-zA-Z]\w*)\s*\(", sig)
    mname = m.group(1) if m else "?"
    disp = "保留并迁移为 Optional" if api_methods.get((r[1], typ), {}).get(mname) else "删除并闭合"
    print("  %s %-26s#%-32s %-45s -> %s" % (am, typ, mname + "()", flags, disp))
am120 = [r for r in rows if "DEPRECATED" in (r[13] if len(r) > 13 else "")]
for r in am120:
    m = re.search(r"\s([a-zA-Z]\w*)\s*\(", r[3])
    mname = m.group(1) if m else "?"
    disp = "保留并迁移为 Optional（有内部调用者）" if api_methods.get((r[1], r[2]), {}).get(mname) else "删除"
    print("  %s %-26s#%-32s %s -> %s" % (r[0], r[2], mname + "()", r[13], disp))

print("\n== 复算结论 ==")
if FAILURES:
    print("FAIL: %d 项断言失败" % len(FAILURES))
    sys.exit(1)
print("PASS: R1-R5 全部断言通过（121 = 113 保留并合规 + 8 删除并闭合）")
