#!/usr/bin/env python3
"""8 个删除项零残留扫描（只读）。

检查三个层次：
  L1 目标 API 定义：6 个 -api 模块内不得存在删除方法的定义；
  L2 实现：基线 impl 列文件内不得存在删除方法的实现；
  L3 项目内调用：全仓生产与测试源码内不得存在调用残留（允许项逐条列出理由）。

用法: scan-deleted-residuals.py <workspace-root>
退出码: 0 = 无可疑残留；1 = 存在可疑残留。
"""
import glob
import io
import os
import re
import sys

WORKSPACE = sys.argv[1] if len(sys.argv) > 1 else "/usr/local/projects/Smart-WorkFlow"
SERVER = os.path.join(WORKSPACE, "Smart-WorkFlow-aPaaS-server")
SEARCH = os.path.join(WORKSPACE, "search_fallback")

API_MODULES = [
    "sw-basic/sw-basic-job/sw-basic-job-api",
    "sw-basic/sw-basic-notify/sw-basic-notify-api",
    "sw-basic/sw-basic-storage/sw-basic-storage-api",
    "sw-biz/sw-biz-form/sw-biz-form-api",
    "sw-biz/sw-biz-system/sw-biz-system-api",
    "sw-biz/sw-bpm/sw-bpm-api",
]

# AM ID -> (契约类型, 方法名, 基线实现文件相对路径片段)
DELETED = {
    "AM-021": ("StorageFacade", "getUrl", "storage/impl/StorageFacadeImpl.java"),
    "AM-028": ("FormDefinitionService", "getFormDefinitionById", "form/service/impl/FormDefinitionServiceImpl.java"),
    "AM-031": ("FormDefinitionService", "getFormDefById", "form/service/impl/FormDefinitionServiceImpl.java"),
    "AM-037": ("DeptQueryFacade", "searchActiveDepts", "system/service/impl/DeptFacadeImpl.java"),
    "AM-041": ("DictFacade", "resolveLabel", "system/service/impl/DictFacadeImpl.java"),
    "AM-061": ("BpmDeployFacade", "findProcessDefinitionIdByDeployment",
               "bpm/engine/facade/BpmDeployFacadeImpl.java"),
    "AM-091": ("BpmTaskFacade", "getTaskOwner", "bpm/engine/facade/BpmTaskFacadeImpl.java"),
    "AM-092": ("BpmTaskFacade", "addCandidateUser", "bpm/engine/facade/BpmTaskFacadeImpl.java"),
}

ALLOWED = [
    (r"sw-basic-storage-biz/.*/provider/.*\.java$",
     "StorageProvider 家族自有 getUrl(String)（存储提供商接口，非 StorageFacade 契约）"),
    (r"sw-biz-system-biz/.*/service/(impl/)?SysDictData.*\.java$",
     "sw-biz-system 内部 SysDictDataService#resolveLabel（内部服务方法，非 -api 契约；删除后会话已记录为遗留观察项）"),
    (r"sw-bootstrap/src/test/.*/architecture/ApiOptionalContractGateTest\.java$",
     "守门测试的删除清单断言（断言这些方法不存在）"),
    (r"sw-bpm-engine/.*/listener/ApprovalTaskListener\.java$",
     "Flowable DelegateTask#addCandidateUser（第三方引擎 API，非 BpmTaskFacade 契约）"),
]

read = lambda p: io.open(p, encoding="utf-8").read()
suspicious_total = 0

print("删除项基线（来自 inventory TSV 的 ZERO_CALLER:UNUSED_FACADE_METHOD 分类）:")
for am, (typ, name, impl) in sorted(DELETED.items()):
    print("  %s  %-24s#%-32s 基线实现: %s" % (am, typ, name + "()", impl))

print("\n== L1 目标 API 定义（6 个 -api 模块） ==")
api_files = []
for m in API_MODULES:
    api_files += [p for p in glob.glob(os.path.join(SERVER, m, "src/main/java/**/*.java"), recursive=True)]
for am, (typ, name, _) in sorted(DELETED.items()):
    hits = []
    for p in api_files:
        for i, line in enumerate(read(p).split("\n"), 1):
            if re.search(r"\b%s\s*\(" % name, line) and not line.strip().startswith("*"):
                hits.append((os.path.relpath(p, SERVER), i, line.strip()))
    print("  %s %s#%s -> 定义命中 %d" % (am, typ, name + "()", len(hits)))
    for rel, i, line in hits:
        print("      %s:%d %s" % (rel, i, line[:120]))
    if hits:
        suspicious_total += len(hits)

print("\n== L2 实现（基线 impl 文件） ==")
for am, (typ, name, impl) in sorted(DELETED.items()):
    matches = [p for p in glob.glob(os.path.join(SERVER, "**/*.java"), recursive=True)
               if impl in p.replace("\\", "/") and "/target/" not in p]
    for p in matches:
        hits = [(i, line.strip()) for i, line in enumerate(read(p).split("\n"), 1)
                if re.search(r"\b%s\s*\(" % name, line) and not line.strip().startswith("*")]
        print("  %s %s -> 实现命中 %d（文件 %s）" % (am, name + "()", len(hits), os.path.relpath(p, SERVER)))
        for i, line in hits:
            print("      :%d %s" % (i, line[:120]))
        if hits:
            suspicious_total += len(hits)

print("\n== L3 项目内全量引用（生产 + 测试） ==")
print("判定规则（第二轮收紧后）：命中只有在“同一编译单元同时引用该契约类型”时才算该删除项的调用残留；")
print("否则归类为“同类同名成员（编译单元未引用该契约，与本删除项无关）”。")
all_sources = [p for p in glob.glob(os.path.join(SERVER, "**/*.java"), recursive=True)
               if "/target/" not in p]
print("扫描文件数: %d" % len(all_sources))
for am, (typ, name, _) in sorted(DELETED.items()):
    legit, unrelated, susp = [], [], []
    for p in all_sources:
        rel = os.path.relpath(p, SERVER)
        src = read(p)
        references_contract = re.search(r"\b%s\b" % typ, src) is not None
        for i, line in enumerate(src.split("\n"), 1):
            if re.search(r"\b%s\b" % name, line):
                if not references_contract:
                    unrelated.append((rel, i, line.strip()))
                    continue
                allowed = next((reason for pat, reason in ALLOWED if re.search(pat, rel)), None)
                (legit if allowed else susp).append((rel, i, line.strip(), allowed))
    print("\n  %s %-32s 命中 %2d（引用契约且合法 %d / 未引用契约的同名成员 %d / 可疑 %d）"
          % (am, name + "()", len(legit) + len(unrelated) + len(susp), len(legit), len(unrelated), len(susp)))
    for rel, i, line, reason in legit:
        print("     合法 %s:%d — %s" % (rel, i, reason))
    for rel, i, line in unrelated:
        print("     无关 %s:%d %s" % (rel, i, line[:130]))
    for rel, i, line, _ in susp:
        print("     可疑 %s:%d %s" % (rel, i, line[:140]))
    suspicious_total += len(susp)

print("\n== 结论 ==")
if suspicious_total:
    print("FAIL: 存在 %d 条可疑残留" % suspicious_total)
    sys.exit(1)
print("PASS: 8 个删除项在 -api 定义、实现与项目内引用上均已闭合（仅剩已说明的合法同名/第三方命中）")
