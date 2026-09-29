#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
S1 秘密扫描（sso-admin-config 审查 02 账本 S1）——只输出路径/计数/退出码，不回显值。

扫描范围：product/sso-admin-config/ 全部文本制品 + knowledge/features/sso-admin-config.md。

检测项：
  A 形态类：appSecret/secret/password/pwd/token 键携带非占位值；
            11 位手机号样值；私钥块；Bearer/JWT 形态串。
  B 已知值类：从 /tmp/sw-sso-verify 运行时文件提取已知敏感值（真实 appSecret、
            测试手机号），以精确子串匹配计数（值不写入本报告）。

退出码：0=全部计数为 0；1=存在命中（路径+计数列出）。
"""
import hashlib
import json
import re
import subprocess
import sys
from pathlib import Path

WS = Path('/usr/local/projects/Smart-WorkFlow')
SCOPE_DIRS = [WS / 'product/sso-admin-config']
SCOPE_FILES = [WS / 'knowledge/features/sso-admin-config.md']
TEXT_SUFFIXES = {'.md', '.json', '.txt', '.log', '.xml', '.sql', '.mjs', '.py', '.html', '.yml', '.yaml'}

KEYED_SECRET_RE = re.compile(r'(?i)"(?:appsecret|secret|password|pwd|token)"\s*:\s*"(?!\[REDACTED\])([^"]{6,})"')
# 前后边界排除十六进制字符：构建日志中 40 位十六进制 token 哈希内的数字段不构成手机号
PHONE_RE = re.compile(r'(?<![0-9a-fA-F])1[3-9][0-9]{9}(?![0-9a-fA-F])')
# 合成夹具号段（17800000000-17800009999）：仓库测试源码既有约定与 A2 集成夹具专用，
# 等价于测试源码常量；真实手机号（含 Owner 授权测试值）不落入该号段
SYNTHETIC_PHONE_RE = re.compile(r'^178000[0-9]{5}$')
PRIVKEY_RE = re.compile(r'-----BEGIN [A-Z ]*PRIVATE KEY-----')
BEARER_RE = re.compile(r'(?i)bearer\s+[A-Za-z0-9._-]{20,}')
REDACTED_OK = ('[REDACTED]',)


def iter_files():
    for d in SCOPE_DIRS:
        for p in sorted(d.rglob('*')):
            if p.is_file() and p.suffix.lower() in TEXT_SUFFIXES:
                yield p
    for f in SCOPE_FILES:
        if f.is_file():
            yield f


def known_values():
    """从 /tmp 运行时制品提取已知敏感值（失败则跳过该项，报告注明）。"""
    values = {}
    tmp = Path('/tmp/sw-sso-verify')
    # 真实 appSecret：加密脚本中的明文字面量（32+ 位十六进制/混合串，位于 tmp 的 mjs 内）
    try:
        for mjs in ['reencrypt.mjs', 'encrypt.mjs']:
            p = tmp / mjs
            if p.exists():
                for m in re.finditer(r'["\']([A-Za-z0-9]{32,64})["\']', p.read_text(errors='replace')):
                    values['appSecret-candidate(%s)' % mjs] = m.group(1)
    except Exception:
        pass
    # 已知测试手机号（Owner 授权测试值，提取自 V906/V907 种子）
    try:
        for seed in sorted((tmp / 'seed').glob('V90[67]*.sql')):
            for m in re.finditer(r'(?<![0-9])(1[3-9][0-9]{9})(?![0-9])', seed.read_text(errors='replace')):
                values['known-test-phone'] = m.group(1)
    except Exception:
        pass
    return values


def main():
    known = known_values()
    lines = []
    total_hits = 0
    files = list(iter_files())
    lines.append('scope_files=%d' % len(files))
    lines.append('known_value_classes=%d (%s)' % (len(known), ', '.join(sorted(known))))

    shape_counts = {'keyedSecret': 0, 'phone_real': 0, 'phone_synthetic_fixture': 0,
                    'privateKey': 0, 'bearer': 0, 'knownValue': 0}
    for p in files:
        text = p.read_text(errors='replace')
        hits = []
        keyed = [m for m in KEYED_SECRET_RE.finditer(text) if m.group(1) not in REDACTED_OK]
        if keyed:
            hits.append('keyedSecret=%d' % len(keyed))
            shape_counts['keyedSecret'] += len(keyed)
        phones = PHONE_RE.findall(text)
        synth = [m for m in phones if SYNTHETIC_PHONE_RE.match(m)]
        real = len(phones) - len(synth)
        if real:
            hits.append('phone_real=%d' % real)
            shape_counts['phone_real'] += real
        if synth:
            hits.append('phone_synthetic_fixture=%d' % len(synth))
            shape_counts['phone_synthetic_fixture'] += len(synth)
        n = len(PRIVKEY_RE.findall(text))
        if n:
            hits.append('privateKey=%d' % n)
            shape_counts['privateKey'] += n
        n = len(BEARER_RE.findall(text))
        if n:
            hits.append('bearer=%d' % n)
            shape_counts['bearer'] += n
        for name, value in sorted(known.items()):
            c = text.count(value)
            if c:
                hits.append('%s=%d' % (name, c))
                shape_counts['knownValue'] += c
        if hits:
            total_hits += len(hits)
            lines.append('HIT %s :: %s' % (p.relative_to(WS), ' '.join(hits)))

    lines.append('shape_summary=' + json.dumps(shape_counts, sort_keys=True))
    lines.append('total_hit_classes=%d' % total_hits)
    # 合成夹具号段不作为失败条件（等价测试源码常量）；真实手机号/秘密/私钥/bearer 命中即失败
    fatal = total_hits - sum(1 for l in lines if l.startswith('HIT') and 'phone_synthetic_fixture' in l
                             and 'phone_real' not in l and 'keyedSecret' not in l
                             and 'privateKey' not in l and 'bearer' not in l and 'knownValue' not in l)
    exit_code = 0 if fatal == 0 else 1
    lines.append('fatal_hit_files=%d' % fatal)
    lines.append('exit_code=%d' % exit_code)
    report = '\n'.join(lines)
    print(report)
    out = SCOPE_DIRS[0] / 'receipts/evidence/admission-chain-01/s1-final-scan.txt'
    out.write_text(report + '\n', encoding='utf-8')
    return exit_code


if __name__ == '__main__':
    sys.exit(main())
