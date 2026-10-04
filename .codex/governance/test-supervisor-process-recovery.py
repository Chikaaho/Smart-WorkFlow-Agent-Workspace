#!/usr/bin/env python3
"""Finite process restart proof using one-shot events; no daemon or delay loop."""
from __future__ import annotations

import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / '.codex/governance/execution-supervisor.py'


class SupervisorProcessRecoveryTests(unittest.TestCase):
    def test_process_restart_recovers_lease_and_next_action(self):
        with tempfile.TemporaryDirectory(prefix='ace-supervisor-recovery-') as directory:
            common = {'schema': 'agent-coding-engine.supervisor-event.v1',
                      'task_id': 'process-recovery-test', 'host': 'isolated',
                      'workspace': str(ROOT), 'thread_id': 'thread-process-recovery', 'active_role': 'executor'}
            def invoke(event):
                result = subprocess.run([sys.executable, str(SCRIPT), '--root', str(ROOT), '--state-dir', directory, 'event'],
                                        input=json.dumps({**common, **event}), text=True, capture_output=True, timeout=10)
                self.assertEqual(0, result.returncode, result.stderr)
                return json.loads(result.stdout)
            started = invoke({'event_type': 'TASK_STARTED', 'event_id': 'process-start', 'contract_revision': 0,
                              'terminal_payload': {'next_action': '恢复后执行精确原子动作', 'progress_fingerprint': 'process-seed'}})
            self.assertEqual('LEASE_CREATED', started['reason_code'])
            recovered = invoke({'event_type': 'TURN_ENDED', 'event_id': 'process-turn', 'contract_revision': 1})
            self.assertEqual('reinject', recovered['decision'])
            self.assertEqual('恢复后执行精确原子动作', recovered['next_action'])
            self.assertEqual(64, len(recovered['idempotency_key']))


if __name__ == '__main__':
    unittest.main(verbosity=2)
