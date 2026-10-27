#!/usr/bin/env python3
"""Read-only initialization/version gate shared by every role and Harness."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import platform
import re
import subprocess
import sys

ROOT = Path(__file__).resolve().parent.parent
SEMVER = re.compile(r'^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$')


def load(path):
    with Path(path).open(encoding='utf-8-sig') as stream:
        return json.load(stream)


def machine_id():
    # This digest binds a local result to a machine/user; it is not an artifact
    # checksum. Do not publish the raw OS identifier or user profile path.
    identity = platform.node()
    if os.name == 'nt':
        try:
            import winreg
            with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r'SOFTWARE\Microsoft\Cryptography',
                                0, winreg.KEY_READ | winreg.KEY_WOW64_64KEY) as key:
                identity = winreg.QueryValueEx(key, 'MachineGuid')[0]
        except OSError:
            pass
    else:
        for name in ('/etc/machine-id', '/var/lib/dbus/machine-id'):
            try:
                identity = Path(name).read_text().strip()
                break
            except OSError:
                continue
    return hashlib.sha256((platform.system()+'|'+identity+'|'+str(Path.home().resolve())).encode()).hexdigest()


def common_dir(root):
    env = {k: v for k, v in os.environ.items() if not k.startswith('GIT_')}
    result = subprocess.run(['git', '--no-optional-locks', '-C', str(root), 'rev-parse',
                             '--path-format=absolute', '--git-common-dir'], env=env,
                            capture_output=True, text=True, encoding='utf-8', errors='replace',
                            timeout=5, check=True)
    return Path(result.stdout.strip()).resolve()


def manifest(root):
    value = load(root/'init/update.json')
    if value.get('schema') != 'agent-coding-engine.init-update.v1' or not SEMVER.fullmatch(value.get('version', '')):
        raise ValueError('invalid update manifest')
    if not isinstance(value.get('required_checks'), list) or not value['required_checks']:
        raise ValueError('missing required checks')
    for key in ('harness_list', 'skill_manifest'):
        path = (root/value[key]).resolve()
        if not path.is_relative_to(root):
            raise ValueError('manifest path escapes workspace')
    return value


def harnesses(root, update):
    catalog = load(root/update['harness_list'])
    if catalog.get('schema') != 'agent-coding-engine.harness-list.v1':
        raise ValueError('invalid harness list')
    entries = catalog['harnesses']
    ids = [h['id'] for h in entries]
    if len(ids) != len(set(ids)) or not all(re.fullmatch(r'[a-z0-9][a-z0-9-]*', x) for x in ids):
        raise ValueError('invalid harness ids')
    return {h['id']: h for h in entries}


def state_file(root, identity=None):
    return common_dir(root)/'engine-init'/('result-'+(identity or machine_id())+'.json')


def status(root=ROOT, harness=None, identity=None):
    root = Path(root).resolve()
    report = {'status': 'NOT_INITIALIZED', 'initialized': False, 'version': None,
              'required_version': None, 'next_action': '切换管理员，按 init/README.md 初始化并更新 result。'}
    try:
        update = manifest(root)
        report['required_version'] = update['version']
        catalog = harnesses(root, update)
        identity = identity or machine_id()
        canonical = state_file(root, identity)
        pointer = root/'init/result.json'
        # A pointer is never authority to read an arbitrary supplied path.
        if pointer.exists():
            recorded = load(pointer)
            if recorded.get('machine_id') == identity and recorded.get('schema') == 'agent-coding-engine.init-pointer.v1':
                if Path(recorded.get('result_file', '')).resolve() != canonical:
                    raise ValueError('result pointer mismatch')
        if not canonical.is_file():
            report['reason'] = '本机没有初始化结果；其他机器的result不能复用。'
            return report
        result = load(canonical)
        if result.get('schema') != 'agent-coding-engine.init-result.v1' or result.get('machine_id') != identity:
            raise ValueError('invalid local result identity')
        report['version'] = result.get('version')
        if result.get('initialized') is not True:
            report['reason'] = result.get('reason', '初始化或适配尚未完成。')
            return report
        if result.get('version') != update['version']:
            report.update(status='UPDATE_REQUIRED', reason='本机版本与update要求不一致。',
                          next_action='切换管理员，按 init/README.md 更新本机适配、验证后更新 result；不能只改版本号。')
            return report
        enabled = result.get('harnesses')
        if not isinstance(enabled, dict) or not enabled:
            raise ValueError('no verified harness')
        if harness and harness not in enabled:
            report.update(status='HARNESS_NOT_INITIALIZED', reason='当前Harness未适配验证；不能复用另一Harness的完成状态。')
            return report
        for name, record in enabled.items():
            if name not in catalog or record.get('verified') is not True:
                raise ValueError('unregistered/unverified harness')
            if not set(update['required_checks']) <= {c['kind'] for c in record.get('checks', []) if c.get('passed') is True}:
                raise ValueError('required harness checks missing')
            if not record.get('adapters') or not all(Path(p).is_file() for p in record['adapters']):
                raise ValueError('installed adapter missing')
        # Readiness is checked without installing/updating any skill.
        import importlib.util
        spec = importlib.util.spec_from_file_location('init_skills', root/'governance/skills/ensure-skills.py')
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)
        declared = load(root/update['skill_manifest'])['skills']
        skill_roots = [Path(p) for p in result.get('skill_roots', [])]
        found = {s['name']: module.find_skill(s, skill_roots) for s in declared}
        if not skill_roots or not all(found.values()):
            raise ValueError('required skill missing or unreadable')
        report.update(status='READY', initialized=True, harnesses=sorted(enabled),
                      skills={name: str(path/'SKILL.md') for name, path in found.items()},
                      next_action='继续原角色门禁和授权任务。')
        return report
    except (OSError, ValueError, KeyError, TypeError, AttributeError, subprocess.SubprocessError):
        report.update(status='INVALID_RESULT', reason='初始化指针、环境或结果不可核验，需管理员修复。')
        return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=ROOT)
    parser.add_argument('--harness', required=True, help='Actual registered Harness ID; never infer from another ready adapter')
    args = parser.parse_args()
    result = status(args.root, args.harness)
    print(json.dumps(result, ensure_ascii=False))
    return 0 if result['status'] == 'READY' else 2


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    raise SystemExit(main())
