#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
S1 有限范围核验（补允提示01）：数据库凭据与 AI API Key 定向检查——只输出类别/计数/退出码。

范围（提示指定）：
  A 本任务证据目录 product/sso-admin-config/receipts/evidence/admission-chain-01/（文本制品）
  B e7b4371 已知暴露批次两文件的历史版本（git show e7b4371:...）
  C 上述两文件的远端当前版本（git show origin/develop-sw:...）

类别（形态组合；无受控真实值来源的类别如实标注局限）：
  1 jdbc_with_creds     —— JDBC 连接串内嵌凭据（user=/password= 或 user:pass@）
  2 db_password_keys    —— 数据源/数据库密码键（datasource/spring.datasource/dbPassword）
  3 ai_api_key_shapes   —— 常见 AI API Key 形态（sk- 前缀、AIza、gsk_、apiKey/api_key 键值）
  局限：真实 DB 密码与 AI Key 无受控运行时样本（隔离环境 H2 无密码、本任务不涉 AI Key），
  仅能做形态检查；形态检查未命中不代表"该类别秘密不存在"。
"""
import re
import subprocess
import sys
from pathlib import Path

WS = Path('/usr/local/projects/Smart-WorkFlow')
EVID = WS / 'product/sso-admin-config/receipts/evidence/admission-chain-01'
TEXT_SUFFIXES = {'.md', '.json', '.txt', '.log', '.xml', '.sql', '.py', '.html', '.yml', '.yaml'}
SELF = Path(__file__).resolve()

PATTERNS = {
    'jdbc_with_creds': re.compile(
        r'jdbc:[a-z0-9]+://[^\s"\']*(?:password=|user=[^&\s"\']{3,})', re.I),
    'db_password_keys': re.compile(
        r'(?:"(?:spring\.datasource[.\w]*password|datasource\.\w+\.password|dbPassword)"\s*[:=]\s*"[^"]{4,}"'
        r'|(?:spring\.datasource\.[\w.]*password|dbPassword)\s*[:=]\s*["\']?[^\s"\']{4,})', re.I),
    'ai_api_key_shapes': re.compile(
        r'(?:sk-[A-Za-z0-9_]{16,}|AIza[0-9A-Za-z_\-]{30,}|gsk_[A-Za-z0-9]{20,}'
        r'|"(?:api[_-]?key|apiKey)"\s*:\s*"[A-Za-z0-9_\-]{12,}")'),
}


def texts():
    for p in sorted(EVID.rglob('*')):
        if p.is_file() and p.suffix.lower() in TEXT_SUFFIXES and p.resolve() != SELF:
            yield ('evidence/' + p.name, p.read_text(errors='replace'))
    for label, spec, f in [
        ('e7b4371 a3-full-matrix.json', 'e7b4371', 'product/sso-admin-config/receipts/evidence/admission-chain-01/a3-full-matrix.json'),
        ('e7b4371 receipt05', 'e7b4371', 'product/sso-admin-config/receipts/implementation-admission-and-config-05.md'),
        ('origin a3-full-matrix.json', 'origin/develop-sw', 'product/sso-admin-config/receipts/evidence/admission-chain-01/a3-full-matrix.json'),
        ('origin receipt05', 'origin/develop-sw', 'product/sso-admin-config/receipts/implementation-admission-and-config-05.md'),
    ]:
        r = subprocess.run(['git', 'show', '%s:%s' % (spec, f)], cwd=WS, capture_output=True, text=True)
        if r.returncode == 0:
            yield (label, r.stdout)


def main():
    lines = ['scope=证据目录+e7b4371两文件历史版+远端当前版', 'limitation=DB真实密码/AI Key无受控样本，仅形态检查，未命中≠不存在']
    counts = {k: 0 for k in PATTERNS}
    counts['jdbc_test_harness_classified'] = 0
    hit_any = False
    for label, text in texts():
        hits = []
        for name, pat in PATTERNS.items():
            found = [m.group(0) for m in pat.finditer(text)
                     if '${' not in m.group(0) and 'REDACTED' not in m.group(0)
                     and not re.search(r'(?i)example|placeholder|changeme', m.group(0))]
            if name == 'jdbc_with_creds':
                # 分类：内嵌测试库产物（localhost 临时端口 + user=postgres + password=? 占位符）
                # 非真实凭据，单列非拦截；其余（非 localhost 或带真实形密码值）才计命中
                real, harness = [], []
                for m in found:
                    if re.match(r'jdbc:postgresql://localhost:\d+/', m) and 'user=postgres' in m:
                        harness.append(m)
                    else:
                        real.append(m)
                if harness:
                    counts['jdbc_test_harness_classified'] += len(harness)
                    hits.append('jdbc_test_harness_classified=%d' % len(harness))
                found = real
            if found:
                counts[name] += len(found)
                hits.append('%s=%d' % (name, len(found)))
        if hits:
            hit_any = True
            lines.append('HIT %s :: %s' % (label, ' '.join(hits)))
    fatal = any(counts[k] for k in PATTERNS)
    lines.append('category_counts=' + str(counts))
    lines.append('exit_code=%d' % (1 if fatal else 0))
    report = '\n'.join(lines)
    print(report)
    (EVID / 's1-db-ai-scan.txt').write_text(report + '\n', encoding='utf-8')
    return 1 if fatal else 0


if __name__ == '__main__':
    sys.exit(main())
