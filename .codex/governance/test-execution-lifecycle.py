#!/usr/bin/env python3
"""Synthetic lifecycle and actual gate calls; never launches long/background work."""
from __future__ import annotations
import copy
import importlib.util
import json
import os
import subprocess
import sys
import tempfile
import time
import unittest
from pathlib import Path
from unittest.mock import patch

DIR = Path(__file__).resolve().parent
ROOT = DIR.parents[1]
sys.path.insert(0, str(DIR))

def load(name):
    spec = importlib.util.spec_from_file_location(name.replace('-', '_'), DIR / (name + '.py'))
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

validator = load('validate-execution')
supervisor = load('execution-supervisor')
watchdog = load('execution-watchdog')
contract = json.loads((DIR / 'terminal-contract.json').read_text())


def task(now=None, status='RUNNING'):
    now = time.time() if now is None else now
    final = status not in ('PREPARED', 'RUNNING')
    return dict(id='tool-task-1', work_item_id='governance-check', input='synthetic 3 records',
                expected_output='validated records', completion_condition='all 3 validated', handle='tool:sample:1',
                status=status, execution_mode='MANAGED_BACKGROUND', validation_scope='MINIMAL_SUFFICIENT',
                wait_strategy='EVENT', failure_policy='CANCEL_AND_SAVE', work_limit=3,
                timeout_seconds=20, progress_timeout_seconds=10, started_at=now-2, deadline_at=now+18,
                last_progress_at=now-1, cancel_action='cancel exact tool:sample:1', cleanup_action='collect exact tool:sample:1',
                cleanup_complete=final, exit_code=0 if final else None, result_paths=['sample-result.json'] if final else [],
                progress=dict(sequence=1, processed_units=3 if final else 1, phase='FINISHED' if final else 'PROCESSING', result_count=1, error=''))


def terminal(tasks=None):
    value = dict(schema=contract['contract'], role='executor', state='TASK_COMPLETED', task_level='S', evidence=['synthetic proof'])
    if tasks is not None:
        value['execution_tasks'] = tasks
    return value


def context(tasks):
    return {'execution_observations': {'execution_tasks': tasks}, 'background_tasks': [{'id': t['id'], 'owner': 'AGENT', 'status': t['status']} for t in tasks]}


class LifecycleTests(unittest.TestCase):
    def test_allowed_bounded_runtime_foreground_and_host_background(self):
        for mode in ('FOREGROUND', 'MANAGED_BACKGROUND'):
            t = task(); t['execution_mode'] = mode
            self.assertEqual([], validator.validate_context(context([t]), contract, terminal=False))

    def test_allowed_prepared_and_final(self):
        self.assertEqual([], validator.validate_tasks([task(status='PREPARED')], contract, terminal=False))
        self.assertEqual([], validator.validate_tasks([task(status='SUCCEEDED')], contract, terminal=True))

    def test_user_existing_service_is_excluded(self):
        c = {'background_tasks': [{'id': 'existing-user-service', 'owner': 'USER', 'status': 'running'}]}
        self.assertEqual([], validator.validate_context(c, contract, terminal=True))

    def test_rejected_modes_and_missing_control_fields(self):
        for field, value in [('execution_mode', 'DETACHED'), ('execution_mode', 'NOHUP'), ('wait_strategy', 'SLEEP'),
                             ('wait_strategy', 'START_SLEEP'), ('wait_strategy', 'TIME_SLEEP'), ('wait_strategy', 'TIMER'),
                             ('wait_strategy', 'DELAY_POLL'), ('validation_scope', 'CONTINUOUS_2H'), ('work_limit', 0)]:
            with self.subTest(field=field, value=value):
                t = task(); t[field] = value
                self.assertTrue(validator.validate_tasks([t], contract, terminal=False))
        for field in ('input', 'expected_output', 'completion_condition', 'cancel_action', 'cleanup_action', 'handle', 'work_item_id', 'timeout_seconds', 'progress_timeout_seconds'):
            with self.subTest(missing=field):
                t = task(); del t[field]
                self.assertTrue(validator.validate_tasks([t], contract, terminal=False))

    def test_handle_computation_or_short_duration_is_not_permission(self):
        c = {'background_tasks': [{'id': 'native-handle', 'handle': 'native:123', 'status': 'running', 'computing': True, 'duration_seconds': 1}]}
        self.assertTrue(validator.validate_context(c, contract, terminal=True))

    def test_no_actual_progress_timeout_and_budget(self):
        for kind in ('alive', 'deadline', 'lost_observability', 'budget', 'completion', 'error'):
            with self.subTest(kind=kind):
                now = time.time(); t = task(now)
                if kind == 'error': t['progress'].update(error='actual error', phase='ERROR')
                if kind == 'alive': t['progress'].update(processed_units=0, result_count=0, phase='PREPARED')
                if kind == 'deadline': t.update(started_at=now-30, deadline_at=now-10, last_progress_at=now-11)
                if kind == 'lost_observability': t.update(started_at=now-15, deadline_at=now+5, last_progress_at=now-11)
                if kind == 'budget': t['progress']['processed_units'] = 4
                if kind == 'completion': t['progress']['processed_units'] = 3
                self.assertTrue(validator.validate_tasks([t], contract, terminal=False, now=now))

    def test_sequence_and_elapsed_time_do_not_replace_actual_progress(self):
        old = task(); t = copy.deepcopy(old); t['progress']['sequence'] += 1; t['last_progress_at'] += 0.2
        self.assertTrue(validator.validate_tasks([t], contract, terminal=False, previous=[old]))
        t['progress']['processed_units'] += 1
        self.assertEqual([], validator.validate_tasks([t], contract, terminal=False, previous=[old]))

    def test_identity_deadline_and_disappearing_task(self):
        old = task(); t = copy.deepcopy(old); t['timeout_seconds'] += 1; t['deadline_at'] += 1
        self.assertTrue(validator.validate_tasks([t], contract, terminal=False, previous=[old]))
        self.assertTrue(validator.validate_tasks([], contract, terminal=False, previous=[old]))
        self.assertTrue(validator.validate_tasks([old, old], contract, terminal=False))

    def test_split_tasks_cannot_expand_work_item_budget(self):
        old = task(status='CANCELLED'); old['progress']['processed_units'] = 2; old['exit_code'] = 2
        t = task(); t['id'] = 'split-task-2'; t['handle'] = 'tool:sample:2'; t['progress']['processed_units'] = 2
        self.assertTrue(validator.validate_tasks([t], contract, terminal=False, previous=[old]))
        t['work_limit'] = 4
        self.assertTrue(validator.validate_tasks([t], contract, terminal=False, previous=[old]))

    def test_final_requires_result_exit_cleanup_and_no_active_task(self):
        self.assertTrue(validator.validate_tasks([task()], contract, terminal=True))
        for field, value in [('result_paths', []), ('exit_code', None), ('cleanup_complete', False)]:
            t = task(status='SUCCEEDED'); t[field] = value
            self.assertTrue(validator.validate_tasks([t], contract, terminal=True))
        for status in ('FAILED', 'TIMED_OUT', 'CANCELLED'):
            t = task(status=status); t['exit_code'] = 2; t['progress']['error'] = 'synthetic stop reason'
            self.assertEqual([], validator.validate_tasks([t], contract, terminal=True))

    def test_claim_must_match_host(self):
        t = task(status='SUCCEEDED'); c = {'terminal_payload': terminal([t])}
        self.assertTrue(validator.validate_context(c, contract, terminal=True))
        c.update(context([t])); self.assertEqual([], validator.validate_context(c, contract, terminal=True))
        c['terminal_payload']['execution_tasks'][0] = task(status='CANCELLED')
        self.assertTrue(validator.validate_context(c, contract, terminal=True))

    def call(self, script, value, *args, env=None):
        command = [sys.executable if script.endswith('.py') else 'sh', str(DIR / script), *args]
        return subprocess.run(command, input=json.dumps(value), text=True, capture_output=True, timeout=10, env=env)

    def test_public_validator_and_posix_gate_allow_reject(self):
        t = task(status='SUCCEEDED')
        self.assertEqual(0, self.call('validate-terminal.sh', terminal([t])).returncode)
        self.assertNotEqual(0, self.call('validate-terminal.sh', terminal([task()])).returncode)
        for tasks, accepted in (([t], True), ([task()], False)):
            c = context(tasks); c.update(active_role='executor', last_assistant_message='ENGINE_TERMINAL '+json.dumps(terminal(tasks)))
            result = self.call('stop-gate.sh', c)
            self.assertEqual(0, result.returncode, result.stderr)
            if accepted: self.assertEqual('', result.stdout)
            else:
                out = json.loads(result.stdout); self.assertEqual('block', out['decision']); self.assertIn('取消', out['follow_up_prompt'])

    def test_zcode_known_background_is_gated_even_without_new_tool_call(self):
        with tempfile.TemporaryDirectory() as d:
            observation = Path(d) / 'observation.json'
            observation.write_text(json.dumps({'todo': {'available': True, 'open': 0, 'open_items': []}, 'context': {'available': False}}))
            for tasks, accepted in (([task(status='SUCCEEDED')], True), ([task()], False)):
                c = context(tasks); c.update(cwd=str(ROOT), session_id='synthetic-session', toolCallCount=0, last_assistant_message='ENGINE_TERMINAL '+json.dumps(terminal(tasks)))
                result = self.call('zcode-stop-gate.py', c, '--role-override', 'executor', '--runtime-root', d, '--observation-file', str(observation), '--no-audit')
                self.assertEqual(0, result.returncode, result.stderr)
                if accepted: self.assertEqual('', result.stdout)
                else:
                    out = json.loads(result.stdout); self.assertEqual('block', out['decision']); self.assertIn('取消', out['reason'])

    def test_governed_posix_bridge_preserves_lifecycle_observation(self):
        with tempfile.TemporaryDirectory() as d:
            engine = supervisor.Supervisor(ROOT, Path(d))
            event = dict(schema=supervisor.PROTOCOL, event_type='TASK_STARTED', event_id='s', task_id='bridge', host='codex', workspace=str(ROOT), thread_id='bridge-thread', active_role='executor', contract_revision=0)
            self.assertEqual('allow', engine.handle(event)['decision'])
            env = dict(os.environ, AGENT_CODING_ENGINE_TASK_ID='bridge', AGENT_CODING_ENGINE_THREAD_ID='bridge-thread')
            c = context([task()]); c.update(active_role='executor', contract_revision=1, event_id='bridge-event', last_assistant_message='ENGINE_TERMINAL '+json.dumps(terminal()))
            # Use a bounded synthetic bridge run in an isolated copy to keep runtime off the live lease store.
            import shutil
            fake_root = Path(d) / 'root'; (fake_root / '.codex').mkdir(parents=True)
            shutil.copytree(DIR, fake_root / '.codex/governance', ignore=shutil.ignore_patterns('runtime', '__pycache__'))
            fake_engine = supervisor.Supervisor(fake_root, fake_root / '.codex/governance/runtime')
            fake_engine.handle(dict(event, workspace=str(fake_root)))
            result = subprocess.run(['sh', str(fake_root / '.codex/governance/supervisor-turn-ended.sh')], input=json.dumps(c), text=True, capture_output=True, timeout=10, env=env)
            self.assertEqual(0, result.returncode, result.stderr)
            self.assertEqual('block', json.loads(result.stdout)['decision'])
            self.assertIn('取消', json.loads(result.stdout)['reason'])

    def test_missing_component_fails_closed(self):
        env = dict(os.environ, AGENT_CODING_ENGINE_PYTHON='/nonexistent/python')
        self.assertNotEqual(0, self.call('validate-terminal.sh', terminal(), env=env).returncode)

    def test_supervisor_launch_runtime_terminal_and_repeated_cleanup(self):
        with tempfile.TemporaryDirectory() as d:
            engine = supervisor.Supervisor(ROOT, Path(d))
            base = dict(schema=supervisor.PROTOCOL, task_id='synthetic-lifecycle', host='isolated', workspace=str(ROOT), thread_id='stable-thread', active_role='executor')
            t = task(status='PREPARED')
            start = dict(base, event_type='TASK_STARTED', event_id='s', contract_revision=0, **context([t]))
            self.assertEqual('allow', engine.handle(start)['decision'])
            t = copy.deepcopy(t); t['status'] = 'RUNNING'; t['progress'].update(sequence=2, processed_units=2); t['last_progress_at'] += 0.1
            hb = dict(base, event_type='HEARTBEAT', event_id='h', **context([t]))
            self.assertEqual('allow', engine.handle(hb)['decision'])
            ended = dict(base, event_type='TURN_ENDED', event_id='e', contract_revision=1, terminal_payload=terminal(), **context([t]))
            rejected = engine.handle(ended)
            self.assertEqual('EXECUTION_LIFECYCLE_REJECTED', rejected['reason_code'])
            again = engine.handle(dict(ended, event_id='e2', contract_revision=2))
            self.assertEqual('refuse', again['decision']); self.assertFalse(again['send_required'])
            done = copy.deepcopy(t); done.update(status='SUCCEEDED', cleanup_complete=True, exit_code=0, result_paths=['synthetic.json']); done['progress'].update(sequence=3, processed_units=3, phase='FINISHED'); done['last_progress_at'] += 0.1
            out = engine.handle(dict(base, event_type='TURN_ENDED', event_id='end', contract_revision=3, terminal_payload=terminal([done]), **context([done])))
            self.assertEqual('VALID_TERMINAL', out['reason_code'])

    def test_cancelled_lease_keeps_cleanup_gap_without_auto_reinjection(self):
        with tempfile.TemporaryDirectory() as d:
            engine = supervisor.Supervisor(ROOT, Path(d))
            base = dict(schema=supervisor.PROTOCOL, task_id='cancel-check', host='isolated', workspace=str(ROOT), thread_id='stable-thread', active_role='executor')
            engine.handle(dict(base, event_type='TASK_STARTED', event_id='s', contract_revision=0, **context([task()])))
            cancelled = engine.handle(dict(base, event_type='USER_CANCELLED', event_id='cancel'))
            self.assertEqual('cancelled', cancelled['decision']); self.assertFalse(cancelled['send_required'])
            self.assertEqual(['tool-task-1'], engine.public_status('cancel-check')['cleanup_pending_task_ids'])
            ended = engine.handle(dict(base, event_type='TURN_ENDED', event_id='end', contract_revision=1))
            self.assertEqual('cancelled', ended['decision']); self.assertFalse(ended['send_required'])

    def test_foreign_identity_cannot_replace_task_observations(self):
        with tempfile.TemporaryDirectory() as d:
            engine = supervisor.Supervisor(ROOT, Path(d))
            base = dict(schema=supervisor.PROTOCOL, task_id='identity-check', host='isolated', workspace=str(ROOT), thread_id='stable-thread', active_role='executor')
            t = task(); engine.handle(dict(base, event_type='TASK_STARTED', event_id='s', contract_revision=0, **context([t])))
            forged = task(status='SUCCEEDED')
            rejected = engine.handle(dict(base, event_type='HEARTBEAT', event_id='foreign', thread_id='wrong-thread', **context([forged])))
            self.assertEqual('WRONG_TARGET', rejected['reason_code'])
            self.assertEqual([t], engine.store.load('identity-check')['execution_tasks'])

    def test_supervisor_refuses_launch_without_control(self):
        with tempfile.TemporaryDirectory() as d:
            engine = supervisor.Supervisor(ROOT, Path(d))
            event = dict(schema=supervisor.PROTOCOL, task_id='rejected-launch', host='isolated', workspace=str(ROOT), thread_id='stable-thread', active_role='executor', event_type='TASK_STARTED', event_id='start', contract_revision=0, background_tasks=[{'id': 'uncontrolled', 'status': 'running'}])
            self.assertEqual('refuse', engine.handle(event)['decision'])
            self.assertIsNone(engine.store.load('rejected-launch'))

    def test_watchdog_does_not_launch_and_lock_never_waits(self):
        with patch('subprocess.Popen', side_effect=AssertionError('must not launch')):
            ok, reason = watchdog.spawn_headless_resume('synthetic-session', str(ROOT))
            self.assertFalse(ok); self.assertIn('execution-lifecycle-rejected', reason)
        with tempfile.TemporaryDirectory() as d:
            lock = Path(d) / 'lock'; lock.write_text('existing')
            with self.assertRaises(TimeoutError):
                with supervisor.FileLock(lock): self.fail('must refuse')
            self.assertEqual('existing', lock.read_text())


if __name__ == '__main__':
    unittest.main(verbosity=2)
