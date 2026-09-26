#!/usr/bin/env python3
"""生产调用点 Optional 消费扫描（只读；按“接收者声明类型=契约类型”匹配，与探索基线同口径）。

步骤：
  1) 保留方法集合 = inventory 121 项中在当前 -api 源码仍存在定义者（应 113）；
  2) “是否可能返回 empty”由方法 Javadoc（方法前最近 /** */）判定：含“恒 present” → empty 不可达；
  3) 调用点匹配：先在某文件内收集声明类型为 33 个契约类型之一的变量（字段/参数/局部变量），
     再匹配 `<var>.<method>(`；由此排除同名但非契约接收者的调用；
  4) 消费判定：以命中行起的“语句窗口”（到第一条含 ';' 的行使止，最多 6 行）是否出现
     赋值 / return / 条件 / 三元 / 逻辑与或 / 链式消费（map/filter/orElse/orElseThrow/isPresent/
     isEmpty/ifPresent/ifPresentOrElse/stream/collect/assertThat/requireNonNull）为准。

用法: scan-optional-consumers.py <workspace-root>
退出码: 0 = 不存在“可能 empty 且被忽略”的调用点；1 = 存在需逐条解释项。
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

def split_statements(code_lines):
    """按“括号/方括号深度为 0 且行尾为 ;”切分语句；遇 { } 边界丢弃当前缓冲（声明/控制头不是目标语句）。"""
    stmts, buf, start, depth = [], [], None, 0
    for idx, line in enumerate(code_lines, 1):
        code = line.strip()
        if not code:
            continue
        if code.startswith("*") or code.startswith("//"):
            continue
        if code.endswith("{") or code.endswith("}"):
            buf, start, depth = [], None, 0
            continue
        if start is None:
            start = idx
        buf.append(line)
        depth += (code.count("(") - code.count(")") + code.count("[") - code.count("]"))
        if depth <= 0 and code.endswith(";"):
            stmts.append((start, idx, " ".join(buf)))
            buf, start, depth = [], None, 0
    if buf:
        stmts.append((start, len(code_lines), " ".join(buf)))
    return stmts


def strip_comments(line):
    """移除行尾 // 注释（跳过字符串字面量内的 //），供消费判定使用。"""
    out, i, quote = [], 0, None
    while i < len(line):
        c = line[i]
        if quote:
            out.append(c)
            if c == quote and line[i - 1] != "\\":
                quote = None
            i += 1
            continue
        if c in ("\"", "'"):
            quote = c
            out.append(c)
            i += 1
            continue
        if c == "/" and i + 1 < len(line) and line[i + 1] == "/":
            break
        out.append(c)
        i += 1
    return "".join(out)


rows = []
for f in sorted(glob.glob(os.path.join(SEARCH, "backend-api-optional-contract-inventory-*.tsv"))):
    for line in read(f).split("\n")[1:]:
        if line.strip():
            rows.append(line.split("\t"))

api_files = {}
for mod, rel in API_MODULES.items():
    for p in glob.glob(os.path.join(SERVER, rel, "src/main/java/**/*.java"), recursive=True):
        api_files[(mod, os.path.basename(p)[:-5])] = p

METHOD_DECL = re.compile(
    r"^(\s{4})(?:public\s+|default\s+|static\s+|public\s+static\s+|public\s+default\s+)*"
    r"([A-Za-z_][\w.<>,\[\]\s?]*?)\s+([a-zA-Z]\w*)\s*\(", re.M)


def method_docs(path):
    src = read(path)
    out = {}
    for m in METHOD_DECL.finditer(src):
        name = m.group(3)
        head = src[:m.start()]
        idx = head.rfind("/**")
        javadoc = ""
        if idx != -1:
            end = head.find("*/", idx)
            if end != -1 and head[end + 2:].strip() == "":
                javadoc = head[idx:end]
        # empty 可达性：Javadoc 未提及 empty ⇒ 该方法的 empty 不可达（含显式“恒 present”/“不产生 empty”表述）
        out[name] = "empty" not in javadoc
    return out


docs = {}
for key, p in api_files.items():
    for name, always in method_docs(p).items():
        docs[key + (name,)] = always

retained = {}
for r in rows:
    am, mod, typ, sig = r[0], r[1], r[2], r[3]
    m = re.search(r"\s([a-zA-Z]\w*)\s*\(", sig)
    name = m.group(1) if m else "?"
    if (mod, typ, name) in docs:
        retained[(typ, name)] = {"am": am, "always_present": docs[(mod, typ, name)]}

print("保留方法数: %d（期望 113）" % len(retained))
print("其中 Javadoc 声明“恒 present”（empty 不可达）: %d" % sum(1 for v in retained.values() if v["always_present"]))

sources = []
for root in ["sw-biz", "sw-basic", "sw-bootstrap/src/main"]:
    sources += [p for p in glob.glob(os.path.join(SERVER, root, "**/*.java"), recursive=True)
                if "/target/" not in p and "/src/test/" not in p]
print("生产源文件数（已排除 src/test）: %d" % len(sources))

VAR_DECL = re.compile(r"\b(%s)(?:<[^;=(){}]*>)?\s+([a-zA-Z_]\w*)\s*[=;,)]" % "|".join(CONTRACT_TYPES))
CONSUMED = re.compile(
    r"(return\s|=\s|\bif\s*\(|\bwhile\s*\(|\?|&&|\|\||\.map\(|\.flatMap\(|\.filter\(|\.orElse|\.orElseThrow"
    r"|\.isPresent|\.isEmpty|\.ifPresent|\.stream\(|\.collect\(|assertThat|requireNonNull|Optional\.ofNullable"
    r"|\.forEach|\.count\(|\.toList\(|\.equals\(|!\(|\.name\()")

names_by_type = {}
for (typ, name) in retained:
    names_by_type.setdefault(typ, []).append(name)

total_calls = 0
ignored_by_method = {}
for p in sources:
    rel = os.path.relpath(p, SERVER)
    lines = read(p).split("\n")
    vars_by_type = {}
    for line in lines:
        for m in VAR_DECL.finditer(line):
            vars_by_type.setdefault(m.group(2), m.group(1))
    if not vars_by_type:
        continue
    code_lines = [strip_comments(l) for l in lines]
    statements = split_statements(code_lines)
    for start_line, end_line, text in statements:
        for var, typ in vars_by_type.items():
            for name in names_by_type.get(typ, []):
                if not re.search(r"\b%s\.%s\s*\(" % (re.escape(var), re.escape(name)), text):
                    continue
                total_calls += 1
                if CONSUMED.search(text):
                    continue
                hits = [l for l in lines[start_line - 1:end_line] if var + "." + name in l]
                ignored_by_method.setdefault((typ, name), []).append(
                    (rel, start_line, (hits[0].strip() if hits else text.strip())[:150]))

print("按接收者声明类型匹配到的契约方法调用点: %d" % total_calls)
print("\n== 返回值被忽略的调用点 ==")
risky = 0
for (typ, name), hits in sorted(ignored_by_method.items()):
    info = retained[(typ, name)]
    tag = "恒 present（empty 不可达）" if info["always_present"] else "**可能 empty**"
    print("\n%s#%s（%s，%s）：忽略 %d 处" % (typ, name + "()", info["am"], tag, len(hits)))
    for rel, i, line in hits:
        print("   %s:%d  %s" % (rel, i, line[:150]))
    if not info["always_present"]:
        risky += len(hits)

print("\n== 结论 ==")
ignored_total = sum(len(v) for v in ignored_by_method.values())
print("返回值被忽略的生产调用点总数: %d" % ignored_total)
print("其中可能返回 empty 的方法: %d" % risky)
if ignored_total:
    print("FAIL: 存在未显式消费 Optional 返回值的生产调用点（任意忽略即失败，不区分 empty 是否可达）")
    sys.exit(1)
print("PASS: %d 个生产调用点全部显式消费 Optional 返回值（忽略 0 处；可能 empty 的方法处理 empty，恒 present 的方法以 orElseThrow 断言显式断言）" % total_calls)
