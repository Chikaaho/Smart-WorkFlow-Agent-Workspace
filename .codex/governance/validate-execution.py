#!/usr/bin/env python3
"""Public Validator lifecycle component; rules/schema live in terminal-contract.json.

No process launches, waits, signals or parallel task contract. Host observations
must originate from the Harness, never from a model-authored terminal claim.
"""
from __future__ import annotations

import argparse
import json
import math
import sys
import time
from pathlib import Path

CONTRACT = Path(__file__).with_name('terminal-contract.json')


def schema_errors(value, schema, path):
    kinds = schema.get('type', [])
    kinds = [kinds] if isinstance(kinds, str) else kinds
    checks = {'object': isinstance(value, dict), 'array': isinstance(value, list),
              'string': isinstance(value, str), 'boolean': isinstance(value, bool),
              'integer': isinstance(value, int) and not isinstance(value, bool),
              'number': isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value),
              'null': value is None}
    if kinds and not any(checks.get(kind, False) for kind in kinds):
        return [f'{path}: expected {kinds}']
    errors = []
    if 'const' in schema and value != schema['const']:
        errors.append(f'{path}: unsupported value')
    if 'enum' in schema and value not in schema['enum']:
        errors.append(f'{path}: unsupported value')
    if isinstance(value, str) and schema.get('minLength', 0) and not value.strip():
        errors.append(f'{path}: must be non-blank')
    if checks['number']:
        if 'minimum' in schema and value < schema['minimum']:
            errors.append(f'{path}: below minimum')
        if 'exclusiveMinimum' in schema and value <= schema['exclusiveMinimum']:
            errors.append(f'{path}: must be positive')
    if isinstance(value, dict):
        properties = schema.get('properties', {})
        errors.extend(f'{path}.{key}: missing required field' for key in schema.get('required', []) if key not in value)
        for key, item in value.items():
            if key in properties:
                errors.extend(schema_errors(item, properties[key], f'{path}.{key}'))
            elif schema.get('additionalProperties') is False:
                errors.append(f'{path}.{key}: unknown field')
    if isinstance(value, list):
        for index, item in enumerate(value):
            errors.extend(schema_errors(item, schema.get('items', {}), f'{path}[{index}]'))
    return errors


def validate_tasks(tasks, contract, *, terminal, previous=None, now=None):
    schema = contract['properties']['execution_tasks']
    errors = schema_errors(tasks, schema, 'execution_tasks')
    if errors:
        return errors
    rules = contract['behavioralRules']['executionLifecycle']
    now = time.time() if now is None else now
    previous = {task['id']: task for task in (previous or [])}
    seen = set()
    for task in tasks:
        prefix = 'execution_tasks.' + task['id']
        if task['id'] in seen:
            errors.append(f'{prefix}: duplicate task identity')
        seen.add(task['id'])
        active = task['status'] in rules['activeStatuses']
        p = task['progress']
        if task['deadline_at'] != task['started_at'] + task['timeout_seconds']:
            errors.append(f'{prefix}: deadline must bind start and task-specific timeout')
        if task['progress_timeout_seconds'] > task['timeout_seconds']:
            errors.append(f'{prefix}: progress timeout exceeds task timeout')
        if task['started_at'] > now or not task['started_at'] <= task['last_progress_at'] <= now:
            errors.append(f'{prefix}: invalid observation time')
        if p['processed_units'] > task['work_limit']:
            errors.append(f'{prefix}: work limit exceeded')
        if active:
            if p['error'].strip() or p['phase'] == 'ERROR':
                errors.append(f'{prefix}: execution failed; CANCEL_AND_SAVE own task')
            if terminal:
                errors.append(f'{prefix}: active agent task prevents terminal; cancel/collect and save results')
            if now >= task['deadline_at'] or now - task['last_progress_at'] >= task['progress_timeout_seconds']:
                errors.append(f'{prefix}: timeout or lost observability; CANCEL_AND_SAVE own task')
            if task['cleanup_complete'] or task['exit_code'] is not None:
                errors.append(f'{prefix}: active task cannot claim cleanup or exit')
            if p['processed_units'] >= task['work_limit'] or p['phase'] == 'FINISHED':
                errors.append(f'{prefix}: completion reached; collect result immediately')
            if task['status'] == 'RUNNING' and not (p['processed_units'] or p['result_count'] or p['error'] or p['phase'] in ('PROCESSING', 'FINALIZING', 'ERROR')):
                errors.append(f'{prefix}: started/alive/waiting is not actual progress')
        else:
            if p['phase'] not in ('FINISHED', 'ERROR'):
                errors.append(f'{prefix}: final task cannot retain running phase')
            if not task['cleanup_complete'] or task['exit_code'] is None or not task['result_paths']:
                errors.append(f'{prefix}: final task requires saved result, exit status and cleanup')
            if task['status'] == 'SUCCEEDED' and (task['exit_code'] != 0 or p['phase'] != 'FINISHED'):
                errors.append(f'{prefix}: success requires exit zero and finished phase')
            if task['status'] in ('FAILED', 'TIMED_OUT') and (not p['error'].strip() or task['exit_code'] == 0):
                errors.append(f'{prefix}: failure/timeout requires error and nonzero exit')
        old = previous.get(task['id'])
        if old:
            if any(task[field] != old[field] for field in rules['immutableFields']):
                errors.append(f'{prefix}: task identity/plan cannot change or extend deadline')
            if old['status'] in rules['finalStatuses'] and task != old:
                errors.append(f'{prefix}: final task cannot restart or change')
            if old['status'] == 'RUNNING' and task['status'] == 'PREPARED':
                errors.append(f'{prefix}: lifecycle cannot move backwards')
            op = old['progress']
            changed = any(p[field] != op[field] for field in ('processed_units', 'phase', 'result_count', 'error'))
            if active and not changed:
                errors.append(f'{prefix}: unchanged state/sequence/elapsed time is not progress')
            if p['processed_units'] < op['processed_units'] or p['result_count'] < op['result_count'] or p['sequence'] < op['sequence']:
                errors.append(f'{prefix}: progress counters cannot decrease')
            if changed and (p['sequence'] <= op['sequence'] or task['last_progress_at'] <= old['last_progress_at']):
                errors.append(f'{prefix}: changed progress requires new sequence and observation time')
    # Shared work-item budget includes completed/cancelled predecessors. Splitting
    # into new handles must not reset processed work or increase the declared bound.
    combined = dict(previous)
    combined.update({task['id']: task for task in tasks})
    budgets = {}
    for task in combined.values():
        bucket = budgets.setdefault(task['work_item_id'], [])
        bucket.append(task)
    for work_item, members in budgets.items():
        limits = {task['work_limit'] for task in members}
        if len(limits) != 1 or sum(task['progress']['processed_units'] for task in members) > min(limits):
            errors.append(f'execution_tasks.{work_item}: split tasks cannot reset or expand work-item budget')
    for identity, old in previous.items():
        if identity not in seen and old['status'] in rules['activeStatuses']:
            errors.append(f'execution_tasks.{identity}: active task disappeared without cleanup/result')
    return errors


def validate_context(context, contract, *, terminal, previous=None, now=None):
    if not isinstance(context, dict):
        return ['execution context: expected object']
    observations = context.get('execution_observations')
    observations = observations if isinstance(observations, dict) else {}
    observed = observations.get('execution_tasks', [])
    errors = validate_tasks(observed, contract, terminal=terminal, previous=previous, now=now)
    payload = context.get('terminal_payload')
    claimed = payload.get('execution_tasks', []) if isinstance(payload, dict) else []
    if claimed and claimed != observed:
        errors.append('execution_tasks: claims require matching actual Harness observations')
    background = context.get('background_tasks', [])
    if not isinstance(background, list):
        errors.append('background_tasks: expected array')
    else:
        ids = {t.get('id') for t in observed if isinstance(t, dict)} if isinstance(observed, list) else set()
        for task in background:
            if not isinstance(task, dict):
                errors.append('background_tasks: invalid task')
            elif task.get('owner') != 'USER' and task.get('id') not in ids:
                errors.append('background_tasks: known agent task lacks lifecycle observation; refuse wait/launch')
    return errors


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--execution-context', action='store_true')
    parser.add_argument('--runtime', action='store_true')
    args = parser.parse_args()
    try:
        value = json.load(sys.stdin)
        contract = json.loads(CONTRACT.read_text(encoding='utf-8'))
        if args.execution_context:
            errors = validate_context(value, contract, terminal=not args.runtime)
        elif isinstance(value, dict):
            errors = validate_tasks(value.get('execution_tasks', []), contract, terminal=True)
        else:
            errors = ['execution_tasks: payload must be object']
    except (OSError, ValueError, KeyError, TypeError) as exc:
        print(f'execution: validator unavailable or malformed input: {type(exc).__name__}', file=sys.stderr)
        return 1
    for error in errors:
        print('execution: ' + error, file=sys.stderr)
    return int(bool(errors))


if __name__ == '__main__':
    raise SystemExit(main())
