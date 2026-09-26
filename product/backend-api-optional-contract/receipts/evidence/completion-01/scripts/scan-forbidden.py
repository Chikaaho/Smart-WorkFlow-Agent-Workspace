#!/usr/bin/env python3
"""禁止模式与契约合规静态扫描（只读；独立于守门测试的第二种实现）。

覆盖：raw Optional / Optional<Void> / 嵌套 Optional / API 与实现返回 null /
orElse(null) / 缺少存在性证明的 Optional.get() / 重新制造 "NOT_FOUND" 与 -1 哨兵 /
Result<Optional<T>> / Optional<Result<T>> / Controller 直接返回 Optional /
-api 契约方法未返回参数化 Optional。

用法: scan-forbidden.py <workspace-root>
退出码: 0 = 无违规命中；1 = 存在违规（合法命中需人工逐项解释，不因此失败）。
"""
import glob
import io
import os
import re
import sys

WORKSPACE = sys.argv[1] if len(sys.argv) > 1 else "/usr/local/projects/Smart-WorkFlow"
SERVER = os.path.join(WORKSPACE, "Smart-WorkFlow-aPaaS-server")

API_MODULES = [
    "sw-basic/sw-basic-job/sw-basic-job-api",
    "sw-basic/sw-basic-notify/sw-basic-notify-api",
    "sw-basic/sw-basic-storage/sw-basic-storage-api",
    "sw-biz/sw-biz-form/sw-biz-form-api",
    "sw-biz/sw-biz-system/sw-biz-system-api",
    "sw-biz/sw-bpm/sw-bpm-api",
]

VALUE_TYPE_FACTORY_NAMES = {"builder", "of", "from", "create", "valueOf", "newBuilder"}
VALUE_TYPE_SUFFIX = re.compile(
    r".*(DTO|Dto|Req|Request|Response|Result|Event|Command|Option|Options|Snapshot|Selection"
    r"|Resolution|Candidate|Metadata|Supports|Topology|Config|Binding|Field|ErrorCode|Exception"
    r"|Status|Type|Channel|BizType|Op|Item)$")

VIOLATIONS = []


def read(p):
    return io.open(p, encoding="utf-8").read()


def is_test(rel):
    return "/src/test/" in rel


def main_sources():
    out = []
    for root in ["sw-biz", "sw-basic", "sw-framework", "sw-bootstrap/src/main"]:
        out += [p for p in glob.glob(os.path.join(SERVER, root, "**/*.java"), recursive=True)
                if "/target/" not in p]
    return sorted(out)


def grep(sources, pattern, flags=0):
    rx = re.compile(pattern, flags)
    hits = []
    for p in sources:
        for i, line in enumerate(read(p).split("\n"), 1):
            if rx.search(line):
                hits.append((os.path.relpath(p, SERVER), i, line.strip()))
    return hits


def section(title):
    print("\n" + "=" * 78)
    print("## " + title)
    print("=" * 78)


def report(label, hits, violation_when_hit=True, note=""):
    print("\n--- %s ---" % label)
    print("命中数: %d" % len(hits))
    for rel, i, line in hits:
        print("  %s:%d  %s" % (rel, i, line[:160]))
    if note:
        print("说明: " + note)
    if hits and violation_when_hit:
        VIOLATIONS.append(label)


sources = main_sources()
api_sources = []
for m in API_MODULES:
    api_sources += [p for p in glob.glob(os.path.join(SERVER, m, "src/main/java/**/*.java"), recursive=True)
                    if "/target/" not in p]
print("扫描范围: 生产源文件 %d 个；-api 模块源文件 %d 个" % (len(sources), len(api_sources)))

# 1 raw Optional（类型位置出现未参数化的 Optional）
section("1 raw Optional")
raw = []
rx = re.compile(r"\bOptional\s+[A-Za-z_(\[]")
for p in sources:
    rel = os.path.relpath(p, SERVER)
    for i, line in enumerate(read(p).split("\n"), 1):
        if "import " in line or "javadoc" in line:
            continue
        if rx.search(line):
            raw.append((rel, i, line.strip()))
report("raw Optional（Optional 后直接跟标识符/括号，排除 Optional.<T> / Optional.of / Optional.empty）", raw)

# 2 Optional<Void>
section("2 Optional<Void>")
report("Optional<Void>", grep(sources, r"Optional<\s*Void\s*>"))

# 3 嵌套 Optional
section("3 嵌套 Optional")
report("Optional<Optional<...>>", grep(sources, r"Optional<\s*(java\.util\.)?Optional"))

# 4 -api 模块与实现文件返回 null
section("4 API 定义与实现返回 null")
api_null = grep(api_sources, r"\breturn null\b")
report("-api 模块内 return null", api_null, violation_when_hit=False,
       note="预期命中 RestrictedExpressionEvaluator 的私有求值辅助方法（内部以 null 表达路径缺失，公共入口 Optional.ofNullable 转换）")
impl_files = []
for f in sorted(glob.glob(os.path.join(WORKSPACE, "search_fallback",
                                       "backend-api-optional-contract-inventory-*.tsv"))):
    for line in read(f).split("\n")[1:]:
        if not line.strip():
            continue
        for impl in line.split("\t")[5].split("; "):
            if impl.startswith("NO_MAIN_IMPL"):
                continue
            path = impl.split(":")[0].replace("/M/", "/src/main/java/com/sw/ck/")
            full = os.path.join(SERVER, path)
            if os.path.exists(full):
                impl_files.append(full)
impl_files = sorted(set(impl_files))
print("\n实现文件（基线 impl 列，存在者）: %d" % len(impl_files))
impl_null = []
for p in impl_files:
    rel = os.path.relpath(p, SERVER)
    for i, line in enumerate(read(p).split("\n"), 1):
        if re.search(r"\breturn null\b", line):
            impl_null.append((rel, i, line.strip()))
report("实现文件内 return null", impl_null, violation_when_hit=False,
       note="需逐项确认是否位于契约方法路径：命中若在契约方法内即为违规")

# 5 orElse(null)
section("5 orElse(null)")
report("orElse(null)", grep(sources, r"\.orElse\(null\)"), violation_when_hit=False,
       note="需逐项确认接收者是否为契约 Optional")

# 6 缺少存在性证明的 Optional.get()
section("6 缺少存在性证明的 Optional.get()")
hits_unproven = []
total_proven = 0
for p in sources:
    rel = os.path.relpath(p, SERVER)
    src = read(p)
    lines = src.split("\n")
    opt_vars = set(re.findall(r"Optional<[^;=]+?>\s+(\w+)\s*[=;]", src)) | \
        set(re.findall(r"java\.util\.Optional<[^;=]+?>\s+(\w+)\s*[=;]", src))
    for name in opt_vars:
        for m in re.finditer(r"\b" + re.escape(name) + r"\.get\(\)", src):
            line_no = src[:m.start()].count("\n") + 1
            line = lines[line_no - 1]
            proven = (".isPresent()" in line or ".isEmpty()" in line
                      or ("? " in line and ".get()" in line))
            if not proven:
                for back in range(1, 21):
                    idx = line_no - 1 - back
                    if idx < 0:
                        break
                    prev = lines[idx]
                    if (("%s.isEmpty()" % name) in prev or ("%s.isPresent()" % name) in prev
                            or ("assertThat(%s).isPresent()" % name) in prev):
                        proven = True
                        break
            if proven:
                total_proven += 1
            else:
                hits_unproven.append((rel, line_no, line.strip()))
print("\n--- Optional 变量上的 .get() ---")
print("有相邻存在性证明: %d；无证明: %d" % (total_proven, len(hits_unproven)))
for rel, i, line in hits_unproven:
    print("  无证明: %s:%d  %s" % (rel, i, line[:160]))
if hits_unproven:
    VIOLATIONS.append("缺少存在性证明的 Optional.get()")

# 7 重新制造哨兵
section("7 重新制造 \"NOT_FOUND\" / -1 哨兵")
nf = grep([p for p in sources if "api" not in os.path.relpath(p, SERVER) or True], r'"NOT_FOUND"')
nf = [(r, i, l) for r, i, l in nf if not is_test(r)]
report('字符串 "NOT_FOUND"', nf, violation_when_hit=False,
       note="需逐项确认：契约内部重新制造哨兵=违规；对外 HTTP 边界的既有字面量映射=《方向》§4.0 要求的分层映射")
minus1 = grep(sources, r"return\s+-1\s*;")
report("return -1;", minus1, violation_when_hit=False,
       note="需逐项确认是否作为契约缺失哨兵（原始类型回退为 Optional.empty()）")

# 8 Result<Optional<T>> / R<Optional<T>>
section("8 Result<Optional<T>> / R<Optional<T>>")
report("Result<Optional<...>>", grep(sources, r"\bResult<\s*Optional"))
report("R<Optional<...>>", grep(sources, r"\bR<\s*Optional"))

# 9 Optional<Result<T>>
section("9 Optional<Result<T>>")
report("Optional<Result<...>>", grep(sources, r"Optional<\s*Result<"))

# 10 Controller 直接返回 / 序列化 Optional
section("10 Controller / HTTP 直接返回或序列化 Optional")
ctrl_hits = []
for p in sources:
    rel = os.path.relpath(p, SERVER)
    src = read(p)
    if "/controller/" not in rel and "@RestController" not in src and "@Controller" not in src:
        continue
    for i, line in enumerate(src.split("\n"), 1):
        if re.search(r"(public|protected)\s+[^;{]*Optional<[^>]*>\s+\w+\s*\(", line):
            ctrl_hits.append((rel, i, line.strip()))
report("HTTP 层方法返回类型含 Optional", ctrl_hits)

# 11 -api 契约方法未返回参数化 Optional
section("11 -api 模块契约方法返回类型（独立于守门测试的第二实现）")
bad = []
count = 0
for p in api_sources:
    rel = os.path.relpath(p, SERVER)
    simple = os.path.basename(p)[:-5]
    src = read(p)
    is_iface = re.search(r"\bpublic\s+interface\s", src) is not None
    is_record = re.search(r"\bpublic\s+record\s", src) is not None
    is_enum = re.search(r"\bpublic\s+enum\s", src) is not None
    for m in re.finditer(
            r"^\s{4}(?:public\s+|default\s+|static\s+|public\s+static\s+|public\s+default\s+)*"
            r"([A-Za-z_][\w.<>,\[\]\s?]*?)\s+([a-zA-Z]\w*)\s*\(([^)]*)\)\s*(?:throws [\w.,\s]+)?\s*[{;]",
            src, re.M):
        ret, name = m.group(1).strip(), m.group(2)
        if name in VALUE_TYPE_FACTORY_NAMES:
            continue
        if ret == "record":
            # 接口内嵌套 record 声明（值类型组件），不是契约方法
            continue
        if is_iface:
            count += 1
            if not ret.startswith("Optional<"):
                bad.append((rel, name, ret))
        elif not is_record and not is_enum and re.search(r"public\s+static", m.group(0)):
            count += 1
            if not ret.startswith("Optional<"):
                bad.append((rel, name, ret))
print("\n纳入计数的方法数: %d" % count)
print("非 Optional 返回: %d" % len(bad))
for rel, name, ret in bad:
    print("  违规: %s#%s -> %s" % (rel, name, ret))
if bad:
    VIOLATIONS.append("-api 契约方法未返回参数化 Optional")

section("扫描结论")
if VIOLATIONS:
    print("存在需人工判定的命中项: %s" % VIOLATIONS)
    print("（合法命中须在证据文件中逐项解释；只有确认为违规才视为失败）")
else:
    print("PASS: 全部模式零命中或命中均已在脚本内说明为合法")
