#!/usr/bin/env python3
"""Bind native Codex Stop to explicit user declarations in its own transcript.

Only role/identity normalization lives here. Terminal decisions stay in the
public Validator. No assistant text, repository instructions or terminal role
claims can establish the session role.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path


class RoleObservationError(ValueError):
    pass


def declared_role(text):
    # The desktop's question UI serializes human answers as a user message.
    # Only answer fields carry user intent; the echoed question never does.
    reply = re.fullmatch(r'\s*<send_user_message_question_reply>\s*(.*?)\s*</send_user_message_question_reply>\s*', text, re.S)
    if reply:
        try:
            answers = json.loads(reply[1])
        except ValueError as exc:
            raise RoleObservationError('ROLE_DECLARATION_INVALID') from exc
        if (not isinstance(answers, list) or not answers
                or any(not isinstance(item, dict) or not isinstance(item.get('answer'), str)
                       for item in answers)):
            raise RoleObservationError('ROLE_DECLARATION_INVALID')
        text = '\n'.join(item['answer'] for item in answers)
    # Native transcripts also contain harness-supplied user messages. A role
    # declaration must start a prose clause; quoted material is never a binding.
    if text.lstrip().startswith(('# AGENTS.md instructions', '<')):
        return None
    roles = set()
    fence = False
    for line in text.splitlines():
        line = line.strip()
        if line.startswith(('```', '~~~')):
            fence = not fence
            continue
        if fence or line.startswith(('>', '"', "'", '“', '「')):
            continue
        line = re.sub(r'“[^”]*”|「[^」]*」|"[^"\n]*"|`[^`]*`', '', line)
        for clause in re.split(r'[，,。；;！!？?]', line):
            role = declared_clause(clause.strip())
            if role:
                roles.add(role)
    if len(roles) > 1:
        raise RoleObservationError('ROLE_DECLARATION_AMBIGUOUS')
    return next(iter(roles), None)


def declared_clause(line):
    match = re.match(
        r'^(?:(?:你|本会话|当前会话|本任务|本次|这次)\s*(?:现在)?\s*(?:是|为|＝|=)\s*'
        r'|(?:角色|身份)\s*(?:是|为|＝|=|：|:)\s*|(?:切换|改为|转为)(?:到|为)?\s*|作为\s*|以\s*)'
        r'(规划|执行|管理员)(?=$|[\s,，、:：。！!；;]|身份|角色|的身份|的角色)', line)
    if not match:
        # A bare role or role heading is explicit; a list of role duties such
        # as "规划、执行、管理执行完任务" is not a session declaration.
        match = re.match(r'^(规划|执行|管理员)(?=$|[：:])', line)
    if match:
        return {'规划': 'planner', '执行': 'executor', '管理员': 'admin'}[match[1]]
    if re.match(r'^授权执行(?=$|[\s、：:])', line):
        return 'executor'
    match = re.match(
        r'^(?:授权\s*(?:(?:本次|这次|本会话|当前会话)\s*)?(?:以\s*)?'
        r'|(?:顺便\s*)?(?:(?:本次|这次|本会话|当前会话)\s*)?授予\s*)'
        r'(规划|执行|管理员)(?=$|[\s、：:]|身份|角色|权限)', line)
    if match:
        return {'规划': 'planner', '执行': 'executor', '管理员': 'admin'}[match[1]]
    return None


def same_workspace(cwd, workspace):
    if not isinstance(cwd, str) or not cwd:
        return False
    root = os.path.normcase(os.path.realpath(workspace))
    current = os.path.normcase(os.path.realpath(cwd))
    try:
        return os.path.commonpath([root, current]) == root
    except ValueError:
        return False


def git_common_directory(cwd):
    # Read Git identity only. A bounded probe cannot run aliases or hooks and
    # does not trust GIT_DIR/GIT_WORK_TREE inherited from another checkout.
    env = {key: value for key, value in os.environ.items() if not key.startswith('GIT_')}
    try:
        result = subprocess.run(
            ['git', '--no-optional-locks', '-C', cwd, 'rev-parse', '--path-format=absolute', '--git-common-dir'],
            capture_output=True, text=True, encoding='utf-8', errors='strict',
            env=env, timeout=2, **({'creationflags': subprocess.CREATE_NO_WINDOW} if os.name == 'nt' else {}))
        if result.returncode or not result.stdout.strip():
            return None
        return os.path.normcase(os.path.realpath(result.stdout.strip()))
    except (OSError, ValueError, subprocess.TimeoutExpired):
        return None


def verify_workspace(initial_cwd, latest_cwd, workspace):
    if latest_cwd is not None and not same_workspace(latest_cwd, workspace):
        raise RoleObservationError('ROLE_WORKSPACE_MISMATCH')
    if same_workspace(initial_cwd, workspace):
        return
    # A transcript retains its creation directory when the app attaches a
    # worktree. Accept that transition only with current host turn metadata
    # and independently verified common Git storage, never user/assistant text.
    if (latest_cwd is None or not isinstance(initial_cwd, str) or not initial_cwd
            or not same_workspace(latest_cwd, workspace)):
        raise RoleObservationError('ROLE_WORKSPACE_MISMATCH')
    initial_git = git_common_directory(initial_cwd)
    current_git = git_common_directory(workspace)
    if not initial_git or initial_git != current_git:
        raise RoleObservationError('ROLE_WORKSPACE_MISMATCH')


def resolve_role(payload, workspace):
    role = payload.get('active_role') or os.environ.get('AGENT_CODING_ENGINE_ACTIVE_ROLE', '')
    if role:
        if role not in ('executor', 'planner', 'admin'):
            raise RoleObservationError('ROLE_BINDING_INVALID')
        return {'active_role': role, 'source': 'explicit_binding'}
    transcript = payload.get('transcript_path')
    if not transcript:
        return {'active_role': '', 'source': 'unbound'}
    session = payload.get('session_id')
    if not isinstance(session, str) or not session:
        raise RoleObservationError('ROLE_SESSION_MISSING')
    if not same_workspace(payload.get('cwd'), workspace):
        raise RoleObservationError('ROLE_WORKSPACE_MISMATCH')
    role = ''
    identity_verified = False
    initial_cwd = None
    latest_cwd = None
    # Stream a finite host-provided file; never search another chat by content.
    with Path(transcript).open(encoding='utf-8') as stream:
        limit = os.fstat(stream.fileno()).st_size
        consumed = 0
        for line in stream:
            consumed += len(line.encode('utf-8'))
            if consumed > limit:
                break
            record = json.loads(line)
            data = record.get('payload') or {}
            if record.get('type') == 'session_meta':
                if identity_verified or data.get('id') != session:
                    raise RoleObservationError('ROLE_SESSION_MISMATCH')
                initial_cwd = data.get('cwd')
                identity_verified = True
            elif record.get('type') == 'turn_context':
                if not identity_verified:
                    raise RoleObservationError('ROLE_SESSION_MISSING')
                latest_cwd = data.get('cwd', '')
            elif (record.get('type') == 'response_item' and data.get('type') == 'message'
                  and data.get('role') == 'user'):
                if not identity_verified:
                    raise RoleObservationError('ROLE_SESSION_MISSING')
                text = '\n'.join(c.get('text', '') for c in data.get('content', [])
                                 if c.get('type') in ('input_text', 'text'))
                declaration = declared_role(text)
                if declaration:
                    role = declaration
    if not identity_verified:
        raise RoleObservationError('ROLE_SESSION_MISSING')
    verify_workspace(initial_cwd, latest_cwd, workspace)
    return {'active_role': role, 'source': 'host_user_prompt' if role else 'unbound'}


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--workspace', required=True)
    args = parser.parse_args()
    try:
        result = resolve_role(json.load(sys.stdin), args.workspace)
    except RoleObservationError as exc:
        result = {'error': str(exc)}
    except (OSError, ValueError, TypeError, AttributeError):
        result = {'error': 'ROLE_OBSERVATION_UNAVAILABLE'}
    print(json.dumps(result, ensure_ascii=False))
    return int('error' in result)


if __name__ == '__main__':
    raise SystemExit(main())
