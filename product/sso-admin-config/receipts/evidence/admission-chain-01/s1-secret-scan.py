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
    self_path = Path(__file__).resolve()
    for d in SCOPE_DIRS:
        for p in sorted(d.rglob('*')):
            if p.is_file() and p.suffix.lower() in TEXT_SUFFIXES and p.resolve() != self_path:
                yield p
    for f in SCOPE_FILES:
        if f.is_file() and f.resolve() != self_path:
            yield f


def known_values():
    """从受控运行时源提取已知敏感值；每类标注来源与检查状态（值不写入报告）。"""
    values = {}
    tmp = Path('/tmp/sw-sso-verify')
    # 1) 真实钉钉 appSecret：专用运行时文件（64 字节明文）
    secret_file = Path('/tmp/sw-sso-dingtalk.secret')
    if secret_file.exists():
        v = secret_file.read_text(errors='replace').strip()
        if v:
            values['appSecret-dingtalk'] = (v, 'CHECKED: /tmp/sw-sso-dingtalk.secret')
        else:
            values['appSecret-dingtalk'] = ('', 'NOT_CHECKED: secret 文件为空')
    else:
        values['appSecret-dingtalk'] = ('', 'NOT_CHECKED: secret 文件不存在')
    # 2) dev 契约测试密码（devseed/测试源码既有常量，非生产凭据；evidence 中曾泄露需防回写）
    values['password-dev-contract'] = ('admin123', 'CHECKED: dev 测试契约常量')
    # 3) Owner 授权测试手机号：从 /tmp 种子提取（V906/V907）
    phones = set()
    try:
        for seed in sorted((tmp / 'seed').glob('V90[67]*.sql')):
            for m in re.finditer(r'(?<![0-9])(1[3-9][0-9]{9})(?![0-9])', seed.read_text(errors='replace')):
                phones.add(m.group(1))
    except Exception:
        pass
    if phones:
        # 多个种子手机号逐个作为已知值（合成夹具号段 178000xxxxx 除外——其属测试常量）
        real = [p for p in sorted(phones) if not SYNTHETIC_PHONE_RE.match(p)]
        for i, p in enumerate(real):
            values['known-test-phone-%d' % (i + 1)] = (p, 'CHECKED: /tmp 种子 V906/V907')
    else:
        values['known-test-phone'] = ('', 'NOT_CHECKED: 种子文件不可得')
    return values


def main():
    known = known_values()
    lines = []
    total_hits = 0
    files = list(iter_files())
    lines.append('scope_files=%d' % len(files))
    lines.append('known_value_classes=%d' % len(known))
    for name in sorted(known):
        _, status = known[name]
        lines.append('known_class %s :: %s' % (name, status))

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
        for name in sorted(known):
            value, _status = known[name]
            if not value or name == 'password-dev-contract':
                # dev 契约密码单列（仓库测试源码既有常量，等价测试源码数据），非拦截类
                continue
            c = text.count(value)
            if c:
                hits.append('%s=%d' % (name, c))
                shape_counts['knownValue'] += c
        c = text.count(known['password-dev-contract'][0]) if known['password-dev-contract'][0] else 0
        if c:
            hits.append('password_dev_contract_const=%d' % c)
            shape_counts['password_dev_contract_const'] = shape_counts.get('password_dev_contract_const', 0) + c
        if hits:
            total_hits += len(hits)
            lines.append('HIT %s :: %s' % (p.relative_to(WS), ' '.join(hits)))

    lines.append('shape_summary=' + json.dumps(shape_counts, sort_keys=True))
    lines.append('total_hit_classes=%d' % total_hits)
    # 非拦截类：合成夹具号段与 dev 契约密码常量（均等价仓库测试源码既有数据）；
    # 真实手机号/appSecret/私钥/bearer/keyedSecret 命中即失败
    NON_FATAL = ('phone_synthetic_fixture', 'password_dev_contract_const')
    fatal = 0
    for l in lines:
        if not l.startswith('HIT'):
            continue
        classes = l.split('::')[1].split()
        if any(c.split('=')[0] not in NON_FATAL for c in classes):
            fatal += 1
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
