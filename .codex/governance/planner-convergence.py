#!/usr/bin/env python3
"""Validate Planner handoff deltas. This is not an Executor terminal validator.

The current prompt contains one planner-convergence JSON fence. History is
shared through Git's common directory, so renumbering prompts or changing a
worktree/session does not reset an acceptance item. No business code is read.
"""
from __future__ import annotations

import argparse
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time

SCHEMA = 'agent-coding-engine.planner-handoff.v1'
FENCE = re.compile(r'^```planner-convergence\s*\n(.*?)^```\s*$', re.M | re.S)
PROMPT = re.compile(r'planning-execution-prompt[^/\\]*\.md$')
GENERIC = re.compile(r'^(?:不通过|未通过|继续(?:处理|修复|优化|完善|执行)?|自行(?:处理|修复)|按(?:原)?要求(?:处理|修复)?|其余(?:状态|问题)继续|由(?:规划|Planner)(?:自己)?(?:处理|裁决|核对|确认))[。！!\s]*$')
OPEN_TAIL = re.compile(r'(?:其他|其余|剩余|后续|未覆盖|未裁决|未确认|待定)')
EXACT_BROAD_TARGET = re.compile(r'^(?:1366(?:桌面)?|目录|字体|帮助|手册|联合链|业务覆盖|控件状态)$')
STATUSES = {'REWORK', 'RESOLVED', 'MINOR', 'PLANNER_ACTION'}


class Rejected(ValueError):
    pass


def require(ok, message):
    if not ok:
        raise Rejected(message)


def text(value, label):
    require(isinstance(value, str) and bool(value.strip()) and not GENERIC.fullmatch(value.strip()), label)
    return value.strip()


def bounded_text(value, label):
    value = text(value, label)
    require(not OPEN_TAIL.search(value), label + ': 不得用“其他状态/其余范围/未覆盖”等笼统尾项代替具体对象')
    for token in re.split(r'[、，,；;/\\]+', value):
        require(not EXACT_BROAD_TARGET.fullmatch(token), label + ': 不得只写“1366/目录/字体/帮助/联合链”等范围标签')
    return value


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(',', ':'))


def strings(value, label, allow_empty=False):
    require(isinstance(value, list) and (allow_empty or bool(value)), label)
    for item in value:
        text(item, label)
    require(len(set(value)) == len(value), label + ': duplicate')
    return set(value)


def relative_file(root, name):
    text(name, '缺少证据/提示路径')
    path = (root / name).resolve()
    require(path.is_relative_to(root), '文件必须位于当前工作区内')
    require(path.suffix == '.md' and path.is_file(), '引用的规划/执行回执不存在')
    require(path.relative_to(root).parts[0] in ('product', 'search_fallback'), '回执路径超出证据通道')
    return path


def read_document(path):
    require(path.stat().st_size <= 1024 * 1024, '提示超过1MiB，需收敛当前入口')
    content = path.read_text(encoding='utf-8-sig')
    blocks = FENCE.findall(content)
    require(len(blocks) == 1, '规划提示需有且只有一个 planner-convergence 账本，写明实际差异与收紧范围')
    try:
        document = json.loads(blocks[0])
    except ValueError:
        raise Rejected('planner-convergence 账本不是有效JSON') from None
    require(isinstance(document, dict) and document.get('schema') == SCHEMA, '规划交接账本版本错误')
    return document


def is_dispatch(path):
    if path.suffix != '.md':
        return False
    if PROMPT.search(path.name):
        return True
    # Do not turn unrelated large evidence/receipts into a formatting gate.
    with path.open(encoding='utf-8-sig') as stream:
        content = stream.read(1024 * 1024)
    heading = next((line for line in content.splitlines() if line.startswith('# ')), '')
    return bool('```planner-convergence' in content or
                re.search(r'执行(?:提示|任务)|补充提示|续办(?:任务|提示)|派发', heading))


def validate(document, previous, root, feature):
    require(document.get('feature') == feature, 'feature必须与product目录一致，不能换任务名重置历史')
    revision = document.get('revision')
    require(type(revision) is int and revision > 0, 'revision必须为正整数')
    old_revision = previous.get('revision', 0) if previous else 0
    require(document.get('previous_revision') == old_revision and revision == old_revision + 1,
            '必须继承已接纳的上一revision，不能跳号、回退或覆盖历史')
    require(document.get('decision') in ('CONTINUE', 'FINISH'), 'decision只能为CONTINUE或FINISH')
    receipt = relative_file(root, document.get('source_receipt'))
    require(receipt.relative_to(root).parts[:2] == ('product', feature), '执行回执必须属于同一feature')
    items = document.get('items')
    require(isinstance(items, list) and 0 < len(items) <= 500 and all(isinstance(i, dict) for i in items), 'items须为有限缺口集合')
    old_items = {i['origin_id']: i for i in previous['items']} if previous else {}
    old_keys = {(i['subject'], i['criterion']): i['origin_id'] for i in old_items.values()}
    seen = set()
    seen_keys = set()
    for item in items:
        origin = text(item.get('origin_id'), '缺少稳定origin_id')
        require(origin not in seen, '重复origin_id')
        seen.add(origin)
        key = (text(item.get('subject'), origin + ': 缺具体对象'),
               text(item.get('criterion'), origin + ': 缺原验收断言'))
        require(key not in seen_keys, origin + ': 同对象同断言重复建项')
        seen_keys.add(key)
        require(key not in old_keys or old_keys[key] == origin, origin + ': 换编号不能重置同对象同断言')
        old = old_items.get(origin)
        if old:
            require((old['subject'], old['criterion']) == key, origin + ': 原对象/验收断言不可随轮次改写')
        status = item.get('status')
        require(status in STATUSES, origin + ': status错误')
        if old and old.get('scope') and status != 'REWORK':
            require(item.get('scope') == old['scope'], origin + ': 状态转换须保留最后收口范围，不能绕道重置')
        rounds = item.get('failed_rounds')
        require(type(rounds) is int and rounds >= 0 and (not old or rounds >= old['failed_rounds']), origin + ': 失败历史不能重置')
        evidence = strings(item.get('evidence'), origin + ': 缺已有实际证据指针')
        for pointer in evidence:
            # References are opaque evidence locations; never read business code
            # or external secrets merely because a Planner supplied a pointer.
            require(not re.search(r'(?:password|token|secret)\s*[=:]', pointer, re.I), origin + ': 证据指针含秘密')
        if old and old['status'] == 'RESOLVED' and status != 'RESOLVED':
            invalidation = item.get('invalidation', {})
            require(isinstance(invalidation, dict), origin + ': 已过项重开需反证/实际影响')
            require(invalidation.get('kind') in ('COUNTEREVIDENCE', 'IMPLEMENTATION_CHANGED', 'SNAPSHOT_INVALID'), origin + ': 不得重开无影响已过项')
            text(invalidation.get('reason'), origin + ': 缺具体失效原因')
            strings(invalidation.get('evidence'), origin + ': 缺失效依据')
        if status == 'REWORK':
            require(rounds > 0, origin + ': 打回须保留真实失败次数')
            diagnosis = item.get('diagnosis')
            require(isinstance(diagnosis, dict), origin + ': 不能只写不通过')
            for field in ('location', 'observed', 'expected', 'cause', 'next_action'):
                text(diagnosis.get(field), origin + ': 缺具体' + field)
            require(diagnosis['observed'] != diagnosis['expected'], origin + ': 实际/预期相同，不能作为打回事实')
            strings(item.get('acceptance'), origin + ': 缺修好后的可判定行为')
            if rounds >= 2:
                text(item.get('planner_self_audit'), origin + ': 连续失败须先写规划口径/方法自检')
            scope = item.get('scope')
            require(isinstance(scope, dict), origin + ': 缺执行范围')
            for field in ('targets', 'allowed_actions'):
                values = strings(scope.get(field), origin + ': 缺有限' + field)
                require(not any(v.strip() in ('*', '**', '全部', '全站', '自行决定') for v in values), origin + ': 仍是开放委派')
            strings(scope.get('forbidden_actions'), origin + ': 禁止范围需为数组', allow_empty=True)
            constraints = scope.get('constraints')
            require(isinstance(constraints, dict) and constraints, origin + ': 缺具体约束参数')
            for prop, value in constraints.items():
                text(prop, origin + ': 约束名为空')
                require(value is not None and value != '', origin + ': 约束值为空')
                if isinstance(value, str):
                    text(value, origin + ': 参数值不能是继续优化等空泛动作')
            if old and old.get('scope'):
                old_scope = old['scope']
                tighter = False
                for field in ('targets', 'allowed_actions'):
                    current, prior = set(scope[field]), set(old_scope[field])
                    require(current <= prior, origin + ': 重复打回不得扩大' + field)
                    tighter |= current < prior
                current, prior = set(scope['forbidden_actions']), set(old_scope['forbidden_actions'])
                require(prior <= current, origin + ': 不能撤回已有禁止范围')
                tighter |= prior < current
                for prop, value in old_scope['constraints'].items():
                    require(prop in constraints and constraints[prop] == value, origin + ': 不能删除/放松原约束')
                tighter |= old_scope['constraints'].keys() < constraints.keys()
                require(tighter, origin + ': 再次派发未实际收紧对象/允许动作/禁止范围/参数，不能只改措辞')
        elif status == 'MINOR':
            impact = item.get('impact')
            require(isinstance(impact, dict) and all(impact.get(k) is False for k in ('business', 'usability', 'ui_fidelity')),
                    origin + ': 影响业务、使用或UI还原度的项不能按小异常提前结束')
            text(item.get('reason'), origin + ': 小异常需有实际判断依据')
            if old:
                require(not any(old.get('impact', {}).get(k) is True for k in ('business', 'usability', 'ui_fidelity')),
                        origin + ': 旧证据仍有实际影响，不能仅改标小异常')
        elif status == 'PLANNER_ACTION':
            bounded_text(item.get('subject'), origin + ': 规划待处理对象必须具体')
            bounded_text(item.get('next_action'), origin + ': 规划待处理必须写具体动作')
            scope = item.get('scope')
            require(isinstance(scope, dict), origin + ': 规划待处理同样必须有明确范围')
            for field in ('targets', 'allowed_actions'):
                values = strings(scope.get(field), origin + ': 缺有限' + field)
                for value in values:
                    bounded_text(value, origin + ': ' + field + '不能是概括性尾项')
            strings(scope.get('forbidden_actions'), origin + ': 禁止范围需为数组', allow_empty=True)
            constraints = scope.get('constraints')
            if constraints is not None:
                require(isinstance(constraints, dict), origin + ': constraints须为对象')
                for prop, value in constraints.items():
                    text(prop, origin + ': 约束名为空')
                    require(value is not None and value != '', origin + ': 约束值为空')
                    if isinstance(value, str):
                        text(value, origin + ': 参数值不能是空泛动作')
            for value in item.get('acceptance') or []:
                bounded_text(value, origin + ': 规划待处理必须写可判定完成条件')
            strings(item.get('acceptance'), origin + ': 规划待处理必须写具体完成条件')
        if document['decision'] == 'FINISH':
            require(status in ('RESOLVED', 'MINOR'), origin + ': 仍有实质缺口，规划不能提前结束')
    require(set(old_items) <= seen, '不得从账本删除未过或已过项；用原origin_id记录实际结论')


def common_directory(root):
    environment = {k: v for k, v in os.environ.items() if not k.startswith('GIT_')}
    result = subprocess.run(['git', '--no-optional-locks', 'rev-parse', '--path-format=absolute', '--git-common-dir'], cwd=root,
                            env=environment, capture_output=True, text=True, timeout=5, check=True)
    return (root / result.stdout.strip()).resolve()


def accept(root, path):
    path = path.resolve()
    require(path.is_relative_to(root), '提示路径越出工作区')
    parts = path.relative_to(root).parts
    require(len(parts) >= 4 and parts[0] == 'product' and parts[2] in ('receipts', 'ready'), '提示须属于product单一feature')
    feature = parts[1]
    require(re.fullmatch(r'[\w.-]+', feature) is not None, 'feature目录名无效')
    document = read_document(path)
    directory = common_directory(root) / 'planner-convergence'
    directory.mkdir(exist_ok=True)
    # mkdir is an atomic, non-waiting cross-worktree lock. A stale lock is an
    # explicit admin repair condition, never grounds for silently resetting.
    lock = directory / (feature + '.lock')
    try:
        lock.mkdir()
    except FileExistsError:
        raise Rejected('规划账本并发/上次写入未结束，核实锁身份后重试；不得清零历史') from None
    try:
        state_path = directory / (feature + '.json')
        state = json.loads(state_path.read_text(encoding='utf-8')) if state_path.exists() else {'history': []}
        history = state['history']
        previous = history[-1]['document'] if history else None
        if previous and document == previous:
            return  # Same accepted Stop event is idempotent, not another round.
        validate(document, previous, root, feature)
        require(len(history) < 500, '历史达到上限，管理员归档后接续，禁止清零重建')
        history.append({'path': path.relative_to(root).as_posix(), 'document': document})
        temporary = state_path.with_suffix('.tmp')
        temporary.write_text(canonical(state), encoding='utf-8')
        temporary.replace(state_path)
    finally:
        lock.rmdir()


def observe(payload, root):
    spec = importlib.util.spec_from_file_location('session_role', Path(__file__).with_name('codex-session-role.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    binding = module.resolve_role(payload, str(root))
    if binding['active_role'] != 'planner':
        return [], binding['active_role']
    candidates = set()
    message = payload.get('last_assistant_message', '')
    if isinstance(message, str):
        candidates.update(re.findall(r'product[/\\][^\s"\'<>`\[\](){};]+\.md', message))
    transcript = payload.get('transcript_path')
    started = None
    tool_text = []
    if transcript:
        # Identity was verified by the shared observer. Read only the finite
        # current turn's tool arguments, never another session's transcript.
        with Path(transcript).open(encoding='utf-8') as stream:
            limit = os.fstat(stream.fileno()).st_size
            for line in stream:
                limit -= len(line.encode('utf-8'))
                if limit < 0:
                    break
                record = json.loads(line)
                data = record.get('payload') or {}
                if record.get('type') == 'response_item' and data.get('role') == 'user':
                    tool_text = []
                    started = record.get('timestamp')
                elif record.get('type') == 'response_item' and data.get('type') in ('function_call', 'custom_tool_call'):
                    tool_text.append(str(data.get('arguments') or data.get('input') or ''))
    for value in tool_text:
        candidates.update(re.findall(r'product[/\\][^\s"\'<>`\[\](){};]+\.md', value))
    # Also discover changed prompts not named in the final answer or indirect
    # shell writes. Old unrelated dirty files pre-dating this turn are skipped.
    if started:
        from datetime import datetime
        since = datetime.fromisoformat(started.replace('Z', '+00:00')).timestamp()
        result = subprocess.run(['git', 'status', '--porcelain=v1', '-z', '--untracked-files=all', '--', 'product'],
                                cwd=root, capture_output=True, timeout=5, check=True)
        for record in result.stdout.decode('utf-8').split('\0'):
            name = record[3:]
            path = root / name
            if path.is_file() and path.suffix == '.md' and path.stat().st_mtime >= since and is_dispatch(path):
                candidates.add(name)
    paths = []
    for name in sorted(candidates):
        path = (root / name.replace('\\', '/')).resolve()
        require(path.is_relative_to(root), '提示引用越出当前工作区')
        if path.is_file():
            if started and path.stat().st_mtime < since:
                continue  # Reading/reference to an unchanged prompt is not a dispatch.
            if is_dispatch(path):
                paths.append(path)
    claims_finish = isinstance(message, str) and re.search(
        r'(?:^|[。！!\n；;])\s*(?:(?:整版|本次任务|本次验收|该功能)(?:已|已经)?(?:完成|结束|通过)|(?:可以|提前)结束(?:任务|验收)|验收通过)(?=$|[，,。！!\s])',
        message)
    if claims_finish:
        require(paths and all(read_document(p).get('decision') == 'FINISH' for p in paths),
                '规划宣告结束/通过须引用本轮FINISH账本，明确关闭项或三项均无影响的小异常依据')
    if not paths and isinstance(message, str):
        require(not (re.search(r'不通过|未通过|打回', message) and
                     re.search(r'请执行|让执行|派发|交给执行|继续修复', message)),
                '不能只在对话打回并开放续办；需写入有具体差异与收紧边界的当前执行提示')
    return paths, binding['active_role']


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--workspace', required=True)
    parser.add_argument('--document')
    args = parser.parse_args()
    root = Path(args.workspace).resolve()
    count = 0
    role = 'manual'
    try:
        if args.document:
            paths = [root / args.document]
        else:
            payload = json.load(sys.stdin)
            require(isinstance(payload, dict), '宿主载荷必须为对象')
            paths, role = observe(payload, root)
        for path in paths:
            accept(root, path)
            count += 1
        result = {'ok': True, 'role': role, 'checked': count}
    except (Rejected, OSError, ValueError, KeyError, TypeError, AttributeError, subprocess.SubprocessError) as exc:
        result = {'ok': False, 'reason': '规划收口校验未通过：' + (str(exc) if isinstance(exc, Rejected) else type(exc).__name__) +
                  '。下一动作：规划直接读取已有证据，补具体位置/实际/预期/修复边界与判定条件，继承已过锁定并实际收紧本轮提示；明显不通过继续处理，小异常须证明不影响业务、使用及UI还原度。'}
    # Audit contains categories/counts only, not business text or credentials.
    try:
        runtime = root / '.codex/governance/runtime/planner'
        runtime.mkdir(parents=True, exist_ok=True)
        with (runtime / 'audit.jsonl').open('a', encoding='utf-8') as stream:
            stream.write(canonical({'time': time.time(), 'ok': result['ok'], 'role': role, 'checked': count}) + '\n')
    except OSError:
        result = {'ok': False, 'reason': '规划门禁审计不可写，修复后再交接；不清零既有账本。'}
    print(json.dumps(result, ensure_ascii=False))
    return 0 if result['ok'] else 1


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    raise SystemExit(main())
