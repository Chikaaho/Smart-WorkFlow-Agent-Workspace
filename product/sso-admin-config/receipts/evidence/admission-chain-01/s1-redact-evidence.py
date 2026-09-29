#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
S1 证据采集端脱敏工具（sso-admin-config 审查 02 账本 S1）。

用途：对证据 JSON/文本做就地脱敏——秘密形态键的值与已知敏感值替换为 [REDACTED]，
保留行为码与对象数据（键名、结构、事件类型、计数不变）。幂等：已脱敏值不再改动。

用法：
  python3 s1-redact-evidence.py <file...>

规则（值不回显、不复制原文备份）：
  1) JSON：键名匹配 (?i)(appsecret|secret|password|pwd|token) 的字符串值 → [REDACTED]
     （仅当值非空且不含 [REDACTED]）
  2) 11 位手机号样值（1[3-9]xxxxxxxxx，前后非数字）→ [REDACTED]
  3) 私钥块（-----BEGIN ... PRIVATE KEY-----...）→ [REDACTED]
输出：每文件替换计数（仅计数）。
"""
import json
import re
import sys

SECRET_KEY_RE = re.compile(r'(?i)(appsecret|secret|password|pwd|token)')
PHONE_RE = re.compile(r'(?<![0-9])1[3-9][0-9]{9}(?![0-9])')
PRIVATE_KEY_RE = re.compile(r'-----BEGIN [A-Z ]*PRIVATE KEY-----.*?-----END [A-Z ]*PRIVATE KEY-----', re.S)


def redact_json(obj):
    count = 0
    if isinstance(obj, dict):
        for k, v in obj.items():
            if isinstance(v, str) and SECRET_KEY_RE.search(k) and v and 'REDACTED' not in v:
                obj[k] = '[REDACTED]'
                count += 1
            else:
                count += redact_json(v)
    elif isinstance(obj, list):
        for item in obj:
            count += redact_json(item)
    return count


def redact_text(text):
    count = len(PRIVATE_KEY_RE.findall(text))
    if count:
        text = PRIVATE_KEY_RE.sub('[REDACTED]', text)
    new, n = PHONE_RE.subn('[REDACTED]', text)
    return new, count + n


def main(paths):
    total = 0
    for path in paths:
        count = 0
        with open(path, encoding='utf-8', errors='replace') as f:
            raw = f.read()
        stripped = raw.lstrip()
        if stripped.startswith('{') or stripped.startswith('['):
            try:
                data = json.loads(raw)
                count = redact_json(data)
                if count:
                    with open(path, 'w', encoding='utf-8') as f:
                        json.dump(data, f, ensure_ascii=False, indent=2)
            except json.JSONDecodeError:
                new, count = redact_text(raw)
                if count:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new)
        else:
            new, count = redact_text(raw)
            if count:
                with open(path, 'w', encoding='utf-8') as f:
                    f.write(new)
        total += count
        print('redacted=%d file=%s' % (count, path))
    print('total=%d' % total)
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
