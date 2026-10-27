#!/usr/bin/env python3
"""Administrator workflow: inventory, skill preparation, verify adaptation, record result."""
from __future__ import annotations

import argparse
from datetime import datetime, timezone
import json
import os
from pathlib import Path
import re
import shutil
import signal
import subprocess
import sys
import tempfile

import check


def save(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_name(path.name+'.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2)+'\n', encoding='utf-8', newline='\n')
    temporary.replace(path)


def record(root, value):
    path = check.state_file(root)
    # Publish the pointer first; READY is controlled only by the canonical
    # result, committed last. A failed pointer write cannot create success.
    save(root/'init/result.json', {'schema': 'agent-coding-engine.init-pointer.v1',
         'machine_id': value['machine_id'], 'version': value['version'],
         'initialized': value['initialized'], 'result_file': str(path)})
    save(path, value)


def discover(root):
    update = check.manifest(root)
    result = []
    for entry in check.harnesses(root, update).values():
        commands = {name: shutil.which(name) for name in entry['commands']}
        result.append({'id': entry['id'], 'commands_found': commands,
                       'detection': 'command_found' if any(commands.values()) else 'not_on_path_or_unknown',
                       'project_usage': entry['project_usage'], 'maintenance': entry['maintenance']['status'],
                       'reuse': entry['reuse'], 'specialization': entry['specialization']})
    return result


def probe(argv, root, timeout=15):
    if not isinstance(argv, list) or not argv or not all(isinstance(x, str) and x for x in argv):
        raise ValueError('check argv must be a finite argument list')
    runner = Path(argv[0]).name.lower().removesuffix('.exe')
    if runner not in ('py', 'node', 'powershell', 'pwsh', 'sh', 'bash') and not re.fullmatch(r'python(?:3(?:\.\d+)?)?', runner):
        raise ValueError('use an explicit governance script runner')
    if any(a.lower() in ('-c', '/c', '-command', '-encodedcommand') for a in argv[1:]):
        raise ValueError('inline shell/interpreter programs are not initialization checks')
    # Checks are administrator-authored governance scripts. No shell strings,
    # business build/test commands or arbitrary application actions are run.
    allowed = [root/'init', root/'.codex/governance', root/'.codex/hooks']
    scripts = [(root/p).resolve() for p in argv[1:] if Path(p).suffix in ('.py', '.ps1', '.sh', '.mjs', '.js')]
    if not scripts or not any(p.is_file() and any(p.is_relative_to(a) for a in allowed) for p in scripts):
        raise ValueError('checks must call an existing governance validation script')
    options = {'start_new_session': True} if os.name != 'nt' else {'creationflags': subprocess.CREATE_NEW_PROCESS_GROUP | subprocess.CREATE_NO_WINDOW}
    with tempfile.TemporaryFile() as output, tempfile.TemporaryFile() as errors:
        process = subprocess.Popen(argv, cwd=root, stdin=subprocess.DEVNULL, stdout=output, stderr=errors, **options)
        try:
            code = process.wait(timeout=timeout)
        except subprocess.TimeoutExpired:
            if os.name == 'nt':
                subprocess.run([str(Path(os.environ['SystemRoot'])/'System32/taskkill.exe'), '/PID', str(process.pid), '/T', '/F'],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=5)
            else:
                os.killpg(process.pid, signal.SIGKILL)
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                process.kill()
                process.wait(timeout=5)
            raise ValueError('governance check timed out; owned process tree cancelled') from None
        output.seek(0, 2)
        if output.tell() > 65536:
            raise ValueError('check output exceeds 64KiB; report a focused summary')
        output.seek(0)
        try:
            actual = json.loads(output.read().decode('utf-8-sig'))
        except ValueError:
            raise ValueError('governance check did not return JSON') from None
        return code, actual


def matches(actual, expected):
    if isinstance(expected, dict):
        return isinstance(actual, dict) and all(k in actual and matches(actual[k], v) for k, v in expected.items())
    return type(actual) is type(expected) and actual == expected


def verify_profile(root, profile, update):
    catalog = check.harnesses(root, update)
    if profile.get('version') != update['version']:
        raise ValueError('local profile version does not match update')
    selected = profile.get('harnesses')
    if not isinstance(selected, list) or not 1 <= len(selected) <= 8:
        raise ValueError('select 1..8 actual Harness adapters')
    results = {}
    for harness in selected:
        name = harness.get('id')
        if name not in catalog or name == 'custom' or name in results:
            raise ValueError('register the concrete Harness ID in harness-list before enabling it')
        if harness.get('strategy') not in ('reused_after_verification', 'adapted', 'new'):
            raise ValueError('record whether adapter was reused, adapted or newly written')
        assessment = harness.get('environment_assessment')
        if not isinstance(assessment, str) or not assessment.strip():
            raise ValueError('missing machine/environment/Harness compatibility assessment')
        adapters = [(root/p).resolve() for p in harness.get('adapters', [])]
        if not adapters or not all(p.is_file() for p in adapters):
            raise ValueError('actual installed/configured adapters are missing')
        checks = harness.get('checks', [])
        if not 1 <= len(checks) <= 12 or not set(update['required_checks']) <= {c.get('kind') for c in checks}:
            raise ValueError('missing startup/role/allow/reject/dispatch checks')
        records = []
        for case in checks:
            kind = case['kind']
            if kind not in update['required_checks'] or not case.get('expect_json'):
                raise ValueError('each check needs a known kind and observed JSON assertion')
            print(json.dumps({'phase': 'VERIFYING', 'harness': name, 'check': kind}), flush=True)
            code, actual = probe(case['argv'], root)
            if code != case.get('expect_exit', 0) or not matches(actual, case['expect_json']):
                raise ValueError('Harness check failed: '+name+'/'+kind)
            records.append({'kind': kind, 'passed': True, 'exit_code': code})
        results[name] = {'verified': True, 'strategy': harness['strategy'],
                         'demo_direct_use': harness['strategy'] == 'reused_after_verification',
                         'specialized': harness['strategy'] in ('adapted', 'new'),
                         'environment_assessment': assessment,
                         'adapters': [str(p) for p in adapters], 'checks': records}
    return results


def skills(root):
    result = subprocess.run([sys.executable, '-X', 'utf8', str(root/'governance/skills/ensure-skills.py')],
                            cwd=root, timeout=90, check=True)
    if result.returncode:
        raise ValueError('skill preparation failed')


def complete(root, profile_path):
    update = check.manifest(root)
    directory = check.state_file(root).parent
    directory.mkdir(parents=True, exist_ok=True)
    lock = directory/'initialization.lock'
    try:
        lock.mkdir()
    except FileExistsError:
        raise ValueError('another initializer or stale lock exists; verify ownership before repair') from None
    try:
        # No Hook is copied or installed here. The administrator has already
        # adapted it to the local host and supplied real validation programs.
        profile = check.load(profile_path)
        results = verify_profile(root, profile, update)
        import importlib.util
        spec = importlib.util.spec_from_file_location('ready_skills', root/'governance/skills/ensure-skills.py')
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        roots = module.skill_roots(None)
        declared = check.load(root/update['skill_manifest'])['skills']
        if not all(module.find_skill(item, roots) for item in declared):
            raise ValueError('required skills are not ready; run the skills initialization first')
        state = {'schema': 'agent-coding-engine.init-result.v1', 'machine_id': check.machine_id(),
                 'initialized': True, 'version': update['version'], 'verified_at': datetime.now(timezone.utc).isoformat(),
                 'available': discover(root), 'harnesses': results, 'skill_roots': [str(p) for p in roots]}
        old_path = check.state_file(root)
        old_state = check.load(old_path) if old_path.is_file() else None
        record(root, state)
        result = check.status(root)
        if result['status'] != 'READY':
            if old_state:
                record(root, old_state)
            else:
                state.update(initialized=False, version='0.0.0', reason='初始化末次回读未通过，需修复后重新验证。')
                record(root, state)
            raise ValueError('result failed its final readback; successful state not published')
        return result
    finally:
        lock.rmdir()


def version_change(root):
    update = check.manifest(root)
    names = subprocess.run(['git', 'diff', '--cached', '--name-only'], cwd=root,
                           capture_output=True, text=True, encoding='utf-8', errors='replace',
                           timeout=5, check=True).stdout.splitlines()
    if not any(any(n == p or n.startswith(p) for p in update['versioned_paths']) for n in names):
        return True
    staged = subprocess.run(['git', 'show', ':init/update.json'], cwd=root,
                            capture_output=True, text=True, encoding='utf-8', errors='strict',
                            timeout=5, check=True)
    staged_update = json.loads(staged.stdout)
    proposed = staged_update.get('version')
    if staged_update.get('schema') != 'agent-coding-engine.init-update.v1' or not isinstance(proposed, str) or not check.SEMVER.fullmatch(proposed):
        return False
    old = subprocess.run(['git', 'show', 'HEAD:init/update.json'], cwd=root,
                         capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=5)
    if old.returncode:
        return True  # Initial introduction, not an upgrade from a past version.
    current = json.loads(old.stdout)['version']
    return bool(check.SEMVER.fullmatch(proposed) and tuple(map(int, proposed.split('.'))) > tuple(map(int, current.split('.'))))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=check.ROOT)
    parser.add_argument('--role', choices=['admin'])
    parser.add_argument('action', choices=['discover', 'begin', 'skills', 'complete', 'bump', 'check-version'])
    parser.add_argument('--profile', type=Path)
    parser.add_argument('--part', choices=['major', 'minor', 'patch'], default='patch')
    parser.add_argument('--summary')
    args = parser.parse_args()
    root = args.root.resolve()
    try:
        if args.action not in ('discover', 'check-version') and args.role != 'admin':
            raise ValueError('initialization/update writes require the explicitly declared administrator role')
        if args.action == 'discover':
            result = {'status': 'INVENTORY', 'available': discover(root), 'local': check.status(root)}
        elif args.action == 'begin':
            old_path = check.state_file(root)
            old_state = check.load(old_path) if old_path.is_file() else {}
            if old_state.get('initialized') is True:
                raise ValueError('existing successful result retained; use complete to verify an update')
            state = {'schema': 'agent-coding-engine.init-result.v1', 'machine_id': check.machine_id(),
                     'initialized': False, 'version': old_state.get('version', '0.0.0'), 'reason': '管理员尚需完成本机Harness适配与验证。',
                     'available': discover(root), 'harnesses': {}}
            record(root, state)
            result = check.status(root)
        elif args.action == 'skills':
            skills(root)
            result = {'status': 'SKILLS_READY', 'note': 'Skill就绪不等于Harness初始化完成。'}
        elif args.action == 'complete':
            if not args.profile:
                raise ValueError('--profile is required')
            result = complete(root, (root/args.profile).resolve())
            if result['status'] != 'READY':
                raise ValueError('result failed its final readback')
        elif args.action == 'bump':
            update = check.manifest(root)
            if not args.summary:
                raise ValueError('--summary must describe the global feature change')
            numbers = list(map(int, update['version'].split('.')))
            index = ['major', 'minor', 'patch'].index(args.part)
            numbers[index] += 1
            numbers[index+1:] = [0] * (2-index)
            update.update(version='.'.join(map(str, numbers)), updated_at=datetime.now(timezone.utc).date().isoformat(), summary=args.summary)
            save(root/'init/update.json', update)
            result = {'status': 'GLOBAL_VERSION_UPDATED', 'required_version': update['version'],
                      'note': '本机result不会自动晋级；完成适配验证后再更新。'}
        else:
            if not version_change(root):
                raise ValueError('global initialization feature changed without a staged update version increment')
            result = {'status': 'VERSION_CHANGE_OK'}
        print(json.dumps(result, ensure_ascii=False))
        return 0
    except (OSError, ValueError, KeyError, TypeError, AttributeError, subprocess.SubprocessError) as exc:
        # Never publish raw subprocess output, user config or credentials.
        reason = str(exc) if isinstance(exc, ValueError) else type(exc).__name__
        print(json.dumps({'status': 'INITIALIZATION_INCOMPLETE', 'reason': reason,
                          'next_action': '管理员按 init/README.md 修复后重试，不能只改result版本。'}, ensure_ascii=False))
        return 1


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    raise SystemExit(main())
