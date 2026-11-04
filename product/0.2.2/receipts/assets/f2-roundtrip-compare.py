#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""F2 断言⑨ 往返一致对比（重跑工件版）。

用法: python roundtrip_compare.py <original.json> <roundtrip.json>
方法论与第 1 轮一致：
  - deep() 递归展开嵌套 JSON 字符串（configDefinition / graphJson）；
  - list 按 key_of 优先级 ('id','name','label','code','dictValue','type','formKey') 配对
    （graph elements 必须按 id 配对：多个 APPROVAL 节点按 type 会撞车）；
  - id 类字段一律忽略（is_id）；
  - keymap 按对象 name 对齐做值级归一（表单 key 重生成映射）；
  - 集合层长度差异（dictTypes/extQueries）按设计语义归类 LEN_OK；
  - 其余差异逐条列出并标注 EXPECTED / UNEXPECTED。
"""
import json
import re
import sys

io_enc = sys.stdout

ID_PAT = re.compile(r'(^id$|Id$|IDs?$)')
KEY_FIELDS = ('name', 'label', 'code', 'dictValue', 'id', 'type', 'formKey')
# 设计内差异判定（与 D022-11/12/13、direction 68 行对齐）
NAME_SUFFIX_PAT = re.compile(r'^(.*)-导入[0-9]*$')


def is_id(k):
    return bool(ID_PAT.search(k or ''))


def deep(x):
    if isinstance(x, str):
        s = x.strip()
        if s[:1] in ('{', '['):
            try:
                return deep(json.loads(s))
            except Exception:
                return x
        return x
    if isinstance(x, list):
        return [deep(i) for i in x]
    if isinstance(x, dict):
        return {k: deep(v) for k, v in x.items()}
    return x


def key_of(obj):
    if isinstance(obj, dict):
        for f in KEY_FIELDS:
            v = obj.get(f)
            if isinstance(v, str) and v:
                return f + ':' + v
        return 'item'
    return str(obj)


def load(p):
    return deep(json.load(open(p, encoding='utf-8')))


diffs = []


def walk(a, b, path=''):
    if type(a) is not type(b):
        diffs.append((path, 'value', a, b))
        return
    if isinstance(a, dict):
        for k in sorted(set(a) | set(b)):
            if is_id(k):
                continue
            walk(a.get(k), b.get(k), path + '.' + k)
    elif isinstance(a, list):
        if len(a) != len(b):
            diffs.append((path, 'len', len(a), len(b)))
        ka = {}
        kb = {}
        for o in a:
            ka[key_of(o)] = o
        for o in b:
            kb[key_of(o)] = o
        for k in sorted(set(ka) | set(kb), key=str):
            if k not in ka:
                diffs.append((path + '[' + str(k) + ']', 'only-in-roundtrip', '-', '+'))
            elif k not in kb:
                diffs.append((path + '[' + str(k) + ']', 'only-in-original', '+', '-'))
            else:
                walk(ka[k], kb[k], path + '[' + str(k) + ']')
    else:
        if a != b:
            diffs.append((path, 'value', a, b))
        return


def main():
    orig = load(sys.argv[1])
    rt = load(sys.argv[2])
    # 顶层 keymap：按 name 对齐 forms / processes / opinionForms，再做值级对比
    pairs = []
    for coll in ('forms', 'processes', 'opinionForms', 'dirs'):
        ca = {o.get('name'): o for o in orig.get(coll) or []}
        cb = {o.get('name'): o for o in rt.get(coll) or []}
        for name in sorted(set(ca) & set(cb)):
            pairs.append((coll, name, ca[name], cb[name]))
        for name in sorted(set(ca) - set(cb)):
            diffs.append((coll + '[name=' + str(name) + ']', 'only-in-original', '+', '-'))
        for name in sorted(set(cb) - set(ca)):
            diffs.append((coll + '[name=' + str(name) + ']', 'only-in-roundtrip', '-', '+'))
    # 包级字段（排除已配对集合与 id/时间戳）
    skip_top = {'forms', 'processes', 'opinionForms', 'dirs', 'dictTypes', 'exportedAt',
                'app', 'bundleFormatVersion', 'systemVersion'}
    for k in sorted(set(orig) | set(rt)):
        if k in skip_top:
            continue
        walk(orig.get(k), rt.get(k), k)
    walk(orig.get('app'), rt.get('app'), 'app')
    for coll in ('dictTypes',):
        walk(orig.get(coll), rt.get(coll), coll)
    opinion_keymap = {}
    coa = {o.get('name'): o for o in orig.get('opinionForms') or []}
    cob = {o.get('name'): o for o in rt.get('opinionForms') or []}
    for nm in sorted(set(coa) & set(cob)):
        if coa[nm].get('formKey') and cob[nm].get('formKey'):
            opinion_keymap[coa[nm]['formKey']] = cob[nm]['formKey']
    for coll, name, oa, ob in pairs:
        keymap = dict(opinion_keymap)
        # 同 name 对齐的表单/流程：key 字段按映射归一（重生成语义）
        for kf in ('formKey', 'processKey'):
            if oa.get(kf) and ob.get(kf):
                keymap[oa[kf]] = ob[kf]

        def norm(v):
            if isinstance(v, str) and v in keymap:
                return keymap[v]
            return v

        diffs_before = len(diffs)
        walk({k: v for k, v in oa.items() if k not in ('formKey', 'processKey', 'id')},
             {k: v for k, v in ob.items() if k not in ('formKey', 'processKey', 'id')},
             coll + '[' + str(name) + ']')
        # 把已配对对象内部的 key 值差异按 keymap 归一修正
        fixed = []
        for d in diffs[diffs_before:]:
            if d[1] == 'value' and isinstance(d[2], str) and d[2] in keymap and keymap[d[2]] == d[3]:
                continue
            fixed.append(d)
        diffs[diffs_before:] = fixed

    # 预期差异分类
    expected_rules = []

    def classify(d):
        path, kind, a, b = d
        if path == 'app.name' or path == 'packageName':
            m = NAME_SUFFIX_PAT.match(str(b) if b else '')
            if m and (m.group(1) == str(a)):
                return 'EXPECTED', 'D022-11 应用重名自动后缀'
        if path == 'dictTypes' and kind == 'len':
            return 'EXPECTED', 'D022-13 编码被占用 OCCUPIED 不建（报告留痕）'
        if path.endswith('.dictType') and b is None:
            return 'EXPECTED', 'D022-13 DICT 字段级置空'
        if '.dsBinding' in path and b is None:
            return 'EXPECTED', 'D022-13 数据源未命中绑定置空'
        if '.extQueries' in path:
            return 'EXPECTED', 'D022-13 契约不落库（datasource_id NOT NULL）'
        if path.endswith('nodeForm.formVersion') and a is None:
            return 'EXPECTED', '导出侧 enrichment：B 导出补 formVersion（第 1 轮同款设计内差异）'
        if 'FIXED_USER' in path or ('participant' in path and 'value' in path and b is None):
            return 'EXPECTED', 'D022-13 指定用户置空（报告留痕）'
        if '.categoryName' in path and b is None:
            return 'EXPECTED', 'D022-13 流程分类未命中置空（目标环境无同名分类）'
        if kind == 'only-in-original' and path.startswith('dictTypes'):
            return 'EXPECTED', 'OCCUPIED 不建的字典类型'
        return None, None

    out = []
    out.append('F2 断言⑨ 往返一致对比（本机重跑工件）')
    out.append('original=' + sys.argv[1])
    out.append('roundtrip=' + sys.argv[2])
    out.append('')
    unexpected = 0
    for d in diffs:
        tag, why = classify(d)
        if tag == 'EXPECTED':
            out.append('[EXPECTED] %s %s | original=%r roundtrip=%r | %s' % (d[0], d[1], d[2], d[3], why))
        else:
            unexpected += 1
            out.append('[UNEXPECTED] %s %s | original=%r roundtrip=%r' % (d[0], d[1], d[2], d[3]))
    out.append('')
    out.append('total_diffs=%d expected=%d unexpected=%d' % (len(diffs), len(diffs) - unexpected, unexpected))
    io_enc.write('\n'.join(out) + '\n')
    with open(sys.argv[3], 'w', encoding='utf-8') as f:
        f.write('\n'.join(out) + '\n')


if __name__ == '__main__':
    main()
