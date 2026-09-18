#!/usr/bin/env python3
from __future__ import annotations

import json
import socket
import subprocess
import tempfile
import time
import unittest
from pathlib import Path
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[2]
SCRIPT = ROOT / ".codex" / "governance" / "execution-supervisor.py"


def free_port() -> int:
    sock = socket.socket()
    sock.bind(("127.0.0.1", 0))
    port = sock.getsockname()[1]
    sock.close()
    return port


class SupervisorProcessRecoveryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory(prefix="ace-supervisor-recovery-")
        self.state_dir = Path(self.temp.name)
        self.port = free_port()
        self.process: subprocess.Popen | None = None

    def tearDown(self) -> None:
        self.stop_service()
        self.temp.cleanup()

    def start_service(self) -> int:
        self.process = subprocess.Popen(
            [
                str(Path(__import__("sys").executable)),
                str(SCRIPT),
                "--root", str(ROOT),
                "--state-dir", str(self.state_dir),
                "serve", "--port", str(self.port),
            ],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        for _ in range(50):
            try:
                with urlopen(f"http://127.0.0.1:{self.port}/health", timeout=0.25) as response:
                    if response.status == 200:
                        return self.process.pid
            except OSError:
                time.sleep(0.05)
        self.fail("supervisor service did not become healthy")

    def stop_service(self) -> None:
        if self.process and self.process.poll() is None:
            self.process.terminate()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.kill()
                self.process.wait(timeout=5)

    def post(self, event: dict) -> dict:
        token = (self.state_dir / "supervisor.token").read_text(encoding="utf-8").strip()
        request = Request(
            f"http://127.0.0.1:{self.port}/v1/events",
            data=json.dumps(event).encode("utf-8"),
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
            method="POST",
        )
        with urlopen(request, timeout=5) as response:
            return json.loads(response.read().decode("utf-8"))

    def test_process_restart_recovers_lease_and_next_action(self) -> None:
        first_pid = self.start_service()
        common = {
            "schema": "agent-coding-engine.supervisor-event.v1",
            "task_id": "process-recovery-test",
            "host": "isolated",
            "workspace": str(ROOT),
            "thread_id": "thread-process-recovery",
            "active_role": "executor",
        }
        started = self.post({
            **common,
            "event_type": "TASK_STARTED",
            "event_id": "process-start",
            "contract_revision": 0,
            "terminal_payload": {
                "next_action": "恢复后执行精确原子动作",
                "progress_fingerprint": "process-seed",
            },
        })
        self.assertEqual("LEASE_CREATED", started["reason_code"])
        self.stop_service()
        second_pid = self.start_service()
        self.assertNotEqual(first_pid, second_pid)
        recovered = self.post({
            **common,
            "event_type": "TURN_ENDED",
            "event_id": "process-turn",
            "contract_revision": 1,
        })
        self.assertEqual("reinject", recovered["decision"])
        self.assertEqual("恢复后执行精确原子动作", recovered["next_action"])
        self.assertEqual(64, len(recovered["idempotency_key"]))


if __name__ == "__main__":
    unittest.main(verbosity=2)
