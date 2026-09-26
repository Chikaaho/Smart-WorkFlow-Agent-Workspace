#!/usr/bin/env python3
"""逐项命中解释器：对三类别扫描命中给出客观分类数据（只读）。

类别 A：实现文件内 `return null` → 定位所属方法名，判定是否为契约方法（113 项之一）。
类别 B：`orElse(null)` → 提取接收者表达式，判定接收者是否涉及契约方法/契约类型。
类别 C：无同行/相邻证明的 `Optional.get()` → 在更大窗口（15 行）内搜索存在性证明并回显该守卫行。

用法: explain-hits.py <workspace-root>
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
CONTRACT_TYPES = ["JobFacade", "JobHandler", "NotifyChannelAdapter", "NotifyFacade", "NotifyLinkAuthorizer",
                  "NotifyRoutingService", "NotifyTargetResolver", "StorageFacade", "FormDataSubmitFacade",
                  "FormDefinitionService", "ExtDatasourceQueryPort", "FlowStartPort", "DeptQueryFacade",
                  "DictFacade", "TenantValidityFacade", "UserQueryFacade", "BpmDeployFacade",
                  "BpmRuntimeFacade", "BpmTaskFacade", "BpmNodeDefinition", "BpmNodeRegistry",
                  "ParticipantFunction", "ResultFunction", "ConsensusSettlementPort", "ConsensusVotePort",
                  "DynamicBranchPort", "LifecycleTaskEntryPort", "NodeActionAuditPort",
                  "NodeParticipantAdapter", "NodeParticipantResolver", "ParticipantSnapshotRecorder",
                  "ApproverResolver", "NodeApproverResolver"]

read = lambda p: io.open(p, encoding="utf-8").read()

def _api_source_of(type_name):
    for (mod, t), src in api_src.items():
        if t == type_name:
            return src
    return ""


# 契约方法名集合（只取仍保留的方法）
rows = []
for f in sorted(glob.glob(os.path.join(SEARCH, "backend-api-optional-contract-inventory-*.tsv"))):
    for line in read(f).split("\n")[1:]:
        if line.strip():
            rows.append(line.split("\t"))
api_src = {}
for mod, rel in API_MODULES.items():
    for p in glob.glob(os.path.join(SERVER, rel, "src/main/java/**/*.java"), recursive=True):
        api_src[(mod, os.path.basename(p)[:-5])] = read(p)

contract_methods = set()
for r in rows:
    am, mod, typ, sig = r[0], r[1], r[2], r[3]
    m = re.search(r"\s([a-zA-Z]\w*)\s*\(", sig)
    name = m.group(1) if m else "?"
    src = api_src.get((mod, typ), "")
    if re.search(r"\b%s\s*\(" % name, src):
        contract_methods.add(name)
print("契约方法名集合大小: %d" % len(contract_methods))

sources = []
for root in ["sw-biz", "sw-basic", "sw-framework", "sw-bootstrap/src"]:
    sources += [p for p in glob.glob(os.path.join(SERVER, root, "**/*.java"), recursive=True)
                if "/target/" not in p]

# ---------- 类别 A ----------
print("\n== 类别 A：实现文件内 return null 的所属方法 ==")
impl_files = []
for f in sorted(glob.glob(os.path.join(SEARCH, "backend-api-optional-contract-inventory-*.tsv"))):
    for line in read(f).split("\n")[1:]:
        if not line.strip():
            continue
        for impl in line.split("\t")[5].split("; "):
            if impl.startswith("NO_MAIN_IMPL"):
                continue
            full = os.path.join(SERVER, impl.split(":")[0].replace("/M/", "/src/main/java/com/sw/ck/"))
            if os.path.exists(full):
                impl_files.append(full)
for p in sorted(set(impl_files)):
    rel = os.path.relpath(p, SERVER)
    lines = read(p).split("\n")
    for i, line in enumerate(lines, 1):
        if not re.search(r"\breturn null\b", line):
            continue
        enclosing = "<未定位>"
        CONTROL = {"if", "for", "while", "switch", "catch", "synchronized", "return", "new", "else"}
        DECL = re.compile(r"^\s+(?:(?:public|protected|private|static|final|synchronized|abstract)\s+)*"
                          r"[\w<>,\[\]\.\?\s]+\s+(\w+)\s*\([^;]*\)\s*(?:throws [\w.,\s]+)?\{")
        for back in range(i - 1, max(0, i - 120), -1):
            m = DECL.match(lines[back - 1])
            if m and m.group(1) not in CONTROL:
                enclosing = m.group(1)
                break
        # 类型感知：仅当所属类 implements 了声明该方法的 -api 契约类型时，才算契约方法
        cls_src = read(p)
        implements = re.findall(r"implements\s+([\w.,\s<>]+?)\{", cls_src)
        impl_types = [t.strip().split("<")[0] for group in implements for t in group.split(",")]
        is_contract = any(
            t in CONTRACT_TYPES and name in contract_methods
            and re.search(r"\b%s\s*\(" % name, _api_source_of(t))
            for t in impl_types for name in [enclosing])
        print("  %s:%d 所属方法=%s 所属类实现的契约类型=%s 契约方法=%s"
              % (rel, i, enclosing, impl_types or "无", "是" if is_contract else "否（私有辅助/内部方法）"))

# ---------- 类别 B ----------
print("\n== 类别 B：orElse(null) 的接收者 ==")
for p in sources:
    rel = os.path.relpath(p, SERVER)
    for i, line in enumerate(read(p).split("\n"), 1):
        if ".orElse(null)" not in line:
            continue
        recv = line[:line.index(".orElse(null)")][-90:].strip()
        involves = "涉及契约方法" if any(re.search(r"\b%s\s*\(" % m, recv) for m in contract_methods) else "非契约接收者"
        involves_type = "提及契约类型" if any(t in line for t in CONTRACT_TYPES) else "未提及契约类型"
        print("  %s:%d | 接收者: ...%s | %s | %s" % (rel, i, recv, involves, involves_type))

# ---------- 类别 C ----------
print("\n== 类别 C：无同行证明的 Optional.get()（15 行窗口内回显守卫） ==")
for p in sources:
    rel = os.path.relpath(p, SERVER)
    src = read(p)
    lines = src.split("\n")
    opt_vars = set(re.findall(r"Optional<[^;=]+?>\s+(\w+)\s*[=;]", src)) | \
        set(re.findall(r"java\.util\.Optional<[^;=]+?>\s+(\w+)\s*[=;]", src))
    for name in sorted(opt_vars):
        for m in re.finditer(r"\b" + re.escape(name) + r"\.get\(\)", src):
            line_no = src[:m.start()].count("\n") + 1
            line = lines[line_no - 1]
            if ".isPresent()" in line or ".isEmpty()" in line or ("? " in line and ".get()" in line):
                continue
            guard = None
            for back in range(1, 7):
                idx = line_no - 1 - back
                if idx < 0:
                    break
                prev = lines[idx]
                if ("%s.isEmpty()" % name) in prev or ("%s.isPresent()" % name) in prev:
                    guard = "第 %d 行: %s" % (line_no - back, prev.strip()[:110])
                    break
            if guard is None:
                for back in range(7, 16):
                    idx = line_no - 1 - back
                    if idx < 0:
                        break
                    prev = lines[idx]
                    if ("%s.isEmpty()" % name) in prev or ("%s.isPresent()" % name) in prev:
                        guard = "更远第 %d 行: %s" % (line_no - back, prev.strip()[:110])
                        break
            print("  %s:%d 变量=%s | 守卫: %s" % (rel, line_no, name, guard or "15 行内未发现守卫（需人工确认）"))
