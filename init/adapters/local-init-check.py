#!/usr/bin/env python3
"""本机Harness初始化验证（管理员维护；admin.py complete 经 probe 调用）。

每个 --case 只做真实只读检查或对公共 Validator 的真实允许/拒绝调用，
stdout 恰好输出一个 JSON 结论对象；诊断与过程信息一律走 stderr。
不做安装、不改写宿主配置、不触业务构建/测试。
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GOV = ROOT / '.codex' / 'governance'
RECENT_SECONDS = 14 * 24 * 3600


def fail(case, reason):
    print(f'{case}: {reason}', file=sys.stderr)
    raise SystemExit(1)


def emit(payload):
    print(json.dumps(payload, ensure_ascii=False))


def jsonl_recent(path, pred, limit=1):
    hits = []
    if not path.is_file():
        return hits
    now = time.time()
    with path.open(encoding='utf-8', errors='replace') as stream:
        for line in stream:
            line = line.strip()
            if not line:
                continue
            try:
                record = json.loads(line)
            except ValueError:
                continue
            ts = record.get('ts')
            if not isinstance(ts, str) or len(ts) < 19:
                continue
            try:
                epoch = time.mktime(time.strptime(ts[:19], '%Y-%m-%dT%H:%M:%S')) - time.timezone
            except ValueError:
                continue
            if now - epoch <= RECENT_SECONDS and pred(record):
                hits.append(record)
                if len(hits) >= limit:
                    break
    return hits


def validator_probe(payload, expect_zero):
    proc = subprocess.run([sys.executable, '-X', 'utf8', str(GOV / 'validate-execution.py')],
                          input=json.dumps(payload), capture_output=True, text=True,
                          encoding='utf-8', timeout=10, cwd=ROOT)
    return proc.returncode == 0


def valid_tasks_payload():
    now = time.time()
    return {'execution_tasks': [{
        'id': 'init-allow-case', 'work_item_id': 'wi', 'input': 'i', 'expected_output': 'o',
        'completion_condition': 'done', 'handle': 'h', 'cancel_action': 'cancel',
        'cleanup_action': 'cleanup', 'status': 'SUCCEEDED', 'execution_mode': 'FOREGROUND',
        'validation_scope': 'MINIMAL_SUFFICIENT', 'wait_strategy': 'RESULT',
        'failure_policy': 'CANCEL_AND_SAVE', 'work_limit': 3, 'timeout_seconds': 60,
        'progress_timeout_seconds': 30, 'started_at': now - 30, 'deadline_at': now + 30,
        'last_progress_at': now - 5, 'cleanup_complete': True, 'exit_code': 0,
        'result_paths': ['r'], 'progress': {'sequence': 2, 'processed_units': 3,
        'phase': 'FINISHED', 'result_count': 1, 'error': ''}}]}


def invalid_tasks_payload():
    payload = valid_tasks_payload()
    task = dict(payload['execution_tasks'][0])
    task['status'] = 'RUNNING'
    task['cleanup_complete'] = False
    task['exit_code'] = None
    task['progress'] = {'sequence': 0, 'processed_units': 0, 'phase': 'PREPARED',
                        'result_count': 0, 'error': ''}
    return {'execution_tasks': [task]}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--harness', required=True, choices=['codex', 'zcode'])
    parser.add_argument('--case', required=True,
                        choices=['startup_gate', 'role_binding', 'allow', 'reject', 'dispatch'])
    args = parser.parse_args()
    case = args.case

    if case == 'startup_gate':
        if args.harness == 'codex':
            required = [ROOT / '.codex/hooks.json', GOV / 'codex-stop-adapter.ps1' if (GOV / 'codex-stop-adapter.ps1').is_file() else ROOT / '.codex/hooks/codex-stop-adapter.ps1',
                        ROOT / '.codex/hooks/codex-stop-adapter.sh', GOV / 'validate-execution.py',
                        GOV / 'terminal-contract.json']
            missing = [str(p.relative_to(ROOT)) for p in required if not p.is_file()]
            if missing:
                fail(case, f'missing adapters: {missing}')
            emit({'startup_gate_verified': True})
        else:
            proc = subprocess.run(['powershell', '-NoProfile', '-ExecutionPolicy', 'Bypass',
                                   '-File', str(GOV / 'hook-selfcheck.ps1')],
                                  capture_output=True, text=True, encoding='utf-8',
                                  errors='replace', timeout=14, cwd=ROOT)
            try:
                start = proc.stdout.index('{')
                report = json.loads(proc.stdout[start:])
            except (ValueError, IndexError):
                fail(case, f'hook-selfcheck produced no JSON: {proc.stderr[:200]}')
            declaration = report.get('declaration') or {}
            ok = (declaration.get('present') is True and declaration.get('hooks_enabled') is True
                  and declaration.get('command_ok') is True and declaration.get('drift') is False
                  and declaration.get('effective_scope') == 'user'
                  and set(declaration.get('events') or []) >= {'UserPromptSubmit', 'Stop'})
            if not ok:
                fail(case, f'hook-selfcheck not ready: {json.dumps(declaration, ensure_ascii=False)[:300]}')
            emit({'startup_gate_verified': True})

    elif case == 'role_binding':
        runtime = ROOT / '.codex/governance/runtime' / args.harness
        if args.harness == 'codex':
            bound = jsonl_recent(runtime / 'audit.jsonl',
                                 lambda r: r.get('event') == 'Stop' and bool(r.get('active_role')))
        else:
            bound = list((runtime / 'sessions').glob('*.role.json')) if (runtime / 'sessions').is_dir() else []
        if not bound:
            fail(case, 'no recent role binding evidence')
        emit({'actual_role_binding_verified': True})

    elif case in ('allow', 'reject'):
        payload = valid_tasks_payload() if case == 'allow' else invalid_tasks_payload()
        try:
            code = subprocess.run([sys.executable, '-X', 'utf8', str(GOV / 'validate-execution.py')],
                                  input=json.dumps(payload), capture_output=True, text=True,
                                  encoding='utf-8', timeout=10, cwd=ROOT).returncode
        except subprocess.TimeoutExpired:
            fail(case, 'validator call timed out')
        expected_zero = case == 'allow'
        if (code == 0) != expected_zero:
            fail(case, f'public validator exit {code}, expected {"0" if expected_zero else "nonzero"}')
        result_key = 'valid_result_allowed' if case == 'allow' else 'invalid_result_rejected'
        emit({result_key: True})

    elif case == 'dispatch':
        audit = ROOT / '.codex/governance/runtime' / args.harness / 'audit.jsonl'
        if args.harness == 'codex':
            hits = jsonl_recent(audit, lambda r: r.get('event') == 'Stop' and r.get('phase') == 'payload')
        else:
            hits = jsonl_recent(audit, lambda r: r.get('event') == 'Stop' and r.get('gated') == 1
                                and r.get('decision') in ('pass', 'block'))
        if not hits:
            fail(case, 'no recent real host dispatch evidence in audit ledger')
        emit({'actual_host_dispatch_verified': True})


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
