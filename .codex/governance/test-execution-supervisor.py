#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import json
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MODULE_PATH = ROOT / ".codex" / "governance" / "execution-supervisor.py"
SPEC = importlib.util.spec_from_file_location("execution_supervisor", MODULE_PATH)
assert SPEC and SPEC.loader
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


def progress(fingerprint: str = "fp-1") -> dict:
    return {
        "progress_fingerprint": fingerprint,
        "progress_basis": {
            "files_changed": [],
            "tool_actions": ["governance-test"],
            "new_evidence": [],
            "closed_work_items": [],
        },
    }


def actionable_payload(fingerprint: str = "fp-actionable") -> dict:
    value = {
        "schema": module.TERMINAL_SCHEMA,
        "role": "executor",
        "state": "EXECUTION_SUBMITTED",
        "task_level": "XL",
        "receipt": "product/demo/receipts/completion.md",
        "evidence": ["pending work ledger"],
        "feature_status": "IN_PROGRESS",
        "work_items": [{
            "id": "w1",
            "status": "IN_PROGRESS",
            "authorized": True,
            "dependency_satisfied": True,
            "actionable": True,
            "next_action": "完成 w1 原子动作",
        }],
        "remaining_actionable_count": 1,
        "independent_work_exhausted": False,
        "next_action": "完成 w1 原子动作",
        "next_action_type": "CONTINUE",
        "stop_reason": "WAITING_FOR_PLANNER",
        "tool_results": [],
        "browser_status": "NOT_APPLICABLE",
    }
    value.update(progress(fingerprint))
    return value


def completed_payload() -> dict:
    return {
        "schema": module.TERMINAL_SCHEMA,
        "role": "executor",
        "state": "TASK_COMPLETED",
        "task_level": "M",
        "evidence": ["focused governance verification passed"],
    }


def blocked_payload() -> dict:
    value = {
        "schema": module.TERMINAL_SCHEMA,
        "role": "executor",
        "state": "BLOCKED",
        "task_level": "M",
        "evidence": ["adapter unavailable"],
        "block_type": "CAPABILITY_UNAVAILABLE",
        "attempted": ["probe native application control"],
        "release_condition": "stable thread identity and targeted send/readback become available",
        "work_items": [{
            "id": "zcode-live",
            "status": "BLOCKED",
            "authorized": True,
            "dependency_satisfied": False,
            "actionable": False,
            "next_action": "bind a stable ZCode thread API",
        }],
        "remaining_actionable_count": 0,
        "independent_work_exhausted": True,
        "next_action": "bind a stable ZCode thread API",
        "next_action_type": "WAIT_EXTERNAL",
        "stop_reason": "CAPABILITY_UNAVAILABLE",
        "tool_results": [{
            "tool": "computer-use.getApp",
            "outcome": "UNAVAILABLE",
            "detail": "native app control is unavailable in this session",
        }],
        "browser_status": "NOT_APPLICABLE",
    }
    value.update(progress("fp-blocked"))
    return value


class SupervisorTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temp = tempfile.TemporaryDirectory()
        self.state_dir = Path(self.temp.name)
        self.supervisor = module.Supervisor(ROOT, self.state_dir)
        self.sequence = 0

    def tearDown(self) -> None:
        self.temp.cleanup()

    def event(self, event_type: str, revision: int = 0, **extra) -> dict:
        self.sequence += 1
        value = {
            "schema": module.PROTOCOL,
            "event_type": event_type,
            "event_id": f"event-{self.sequence}",
            "task_id": "task-supervision-test",
            "host": "isolated",
            "workspace": str(ROOT),
            "thread_id": "thread-a",
            "active_role": "executor",
        }
        if event_type in {"TASK_STARTED", "TURN_ENDED"}:
            value["contract_revision"] = revision
        value.update(extra)
        return value

    def start(self) -> dict:
        return self.supervisor.handle(self.event("TASK_STARTED", 0, terminal_payload=actionable_payload("seed")))

    def test_missing_contract_reinjects_exact_persisted_action(self) -> None:
        self.assertEqual("allow", self.start()["decision"])
        result = self.supervisor.handle(self.event("TURN_ENDED", 1))
        self.assertEqual("reinject", result["decision"])
        self.assertEqual("完成 w1 原子动作", result["next_action"])

    def test_ten_items_survive_five_consecutive_turn_ends(self) -> None:
        payload = actionable_payload("seed-ten")
        payload["work_items"] = [{
            "id": f"w{i}",
            "status": "PENDING",
            "authorized": True,
            "dependency_satisfied": True,
            "actionable": True,
            "next_action": f"完成 w{i}",
        } for i in range(1, 11)]
        payload["remaining_actionable_count"] = 10
        payload["next_action"] = "完成 w1"
        started = self.supervisor.handle(self.event("TASK_STARTED", 0, terminal_payload=payload))
        self.assertEqual("allow", started["decision"])
        keys = set()
        for revision in range(1, 6):
            turn_payload = json.loads(json.dumps(payload))
            turn_payload["progress_fingerprint"] = f"turn-{revision}"
            turn_payload["next_action"] = f"完成 w{revision}"
            result = self.supervisor.handle(self.event("TURN_ENDED", revision, terminal_payload=turn_payload))
            self.assertEqual("reinject", result["decision"])
            self.assertEqual(f"完成 w{revision}", result["next_action"])
            keys.add(result["idempotency_key"])
        self.assertEqual(5, len(keys))
        self.assertEqual(5, self.supervisor.public_status("task-supervision-test")["reinject_count"])

    def test_duplicate_event_returns_same_idempotent_decision(self) -> None:
        self.start()
        event = self.event("TURN_ENDED", 1)
        first = self.supervisor.handle(event)
        second = self.supervisor.handle(json.loads(json.dumps(event)))
        self.assertEqual(first, second)
        self.assertEqual(1, self.supervisor.public_status(event["task_id"])["reinject_count"])

    def test_wrong_thread_fails_closed(self) -> None:
        self.start()
        result = self.supervisor.handle(self.event("TURN_ENDED", 1, thread_id="thread-b"))
        self.assertEqual("refuse", result["decision"])
        self.assertEqual("WRONG_TARGET", result["reason_code"])

    def test_revision_rollback_is_rejected(self) -> None:
        self.start()
        self.supervisor.handle(self.event("TURN_ENDED", 2))
        result = self.supervisor.handle(self.event("TURN_ENDED", 1))
        self.assertEqual("REVISION_ROLLBACK", result["reason_code"])

    def test_valid_completion_is_allowed_once_and_survives_restart(self) -> None:
        self.start()
        result = self.supervisor.handle(self.event("TURN_ENDED", 1, terminal_payload=completed_payload()))
        self.assertEqual("allow", result["decision"])
        restarted = module.Supervisor(ROOT, self.state_dir)
        again = restarted.handle(self.event("TURN_ENDED", 2, terminal_payload=completed_payload()))
        self.assertEqual("TERMINAL_ALREADY_ALLOWED", again["reason_code"])

    def test_natural_language_claim_cannot_override_contract(self) -> None:
        self.start()
        event = self.event("TURN_ENDED", 1, assistant_text="任务已完成", terminal_payload=actionable_payload("claim"))
        result = self.supervisor.handle(event)
        self.assertEqual("reinject", result["decision"])

    def test_cross_host_same_contract_has_same_arbitration(self) -> None:
        self.start()
        codex = self.supervisor.handle(self.event("TURN_ENDED", 1, terminal_payload=actionable_payload("codex")))
        other = module.Supervisor(ROOT, Path(self.temp.name) / "zcode")
        start = self.event("TASK_STARTED", 0, host="zcode", task_id="task-zcode", terminal_payload=actionable_payload("seed"))
        other.handle(start)
        turn = self.event("TURN_ENDED", 1, host="zcode", task_id="task-zcode", terminal_payload=actionable_payload("codex"))
        zcode = other.handle(turn)
        self.assertEqual(codex["decision"], zcode["decision"])
        self.assertEqual(codex["reason_code"], zcode["reason_code"])

    def test_observation_conflict_overrides_terminal_claim(self) -> None:
        self.start()
        payload = blocked_payload()
        observed = {
            "browser_status": payload["browser_status"],
            "progress_fingerprint": payload["progress_fingerprint"],
            "tool_results": [{"tool": "computer-use.getApp", "outcome": "SUCCEEDED", "detail": "window available"}],
        }
        result = self.supervisor.handle(self.event("TURN_ENDED", 1, terminal_payload=payload, execution_observations=observed))
        self.assertEqual("reinject", result["decision"])
        self.assertEqual("OBSERVATION_CONFLICT", result["reason_code"])

    def test_valid_block_requires_matching_observations(self) -> None:
        self.start()
        payload = blocked_payload()
        observed = {
            "browser_status": payload["browser_status"],
            "progress_fingerprint": payload["progress_fingerprint"],
            "tool_results": payload["tool_results"],
        }
        result = self.supervisor.handle(self.event("TURN_ENDED", 1, terminal_payload=payload, execution_observations=observed))
        self.assertEqual("blocked", result["decision"])

    def test_pause_resume_cancel_control_plane(self) -> None:
        self.start()
        paused = self.supervisor.handle(self.event("USER_PAUSED"))
        self.assertEqual("paused", paused["decision"])
        turn = self.supervisor.handle(self.event("TURN_ENDED", 1))
        self.assertEqual("paused", turn["decision"])
        resumed = self.supervisor.handle(self.event("USER_RESUMED"))
        self.assertEqual("reinject", resumed["decision"])
        cancelled = self.supervisor.handle(self.event("USER_CANCELLED"))
        self.assertEqual("cancelled", cancelled["decision"])
        after = self.supervisor.handle(self.event("TURN_ENDED", 2))
        self.assertEqual("cancelled", after["decision"])

    def test_repeated_fingerprint_converges_to_replan(self) -> None:
        self.start()
        decisions = []
        for revision in range(1, 5):
            payload = actionable_payload("same-fingerprint")
            payload["progress_basis"] = {"files_changed": [], "tool_actions": [], "new_evidence": [], "closed_work_items": []}
            decisions.append(self.supervisor.handle(self.event("TURN_ENDED", revision, terminal_payload=payload)))
        self.assertEqual("reinject", decisions[0]["decision"])
        self.assertEqual("REPEATED_PROGRESS_ATOMIC_ACTION", decisions[1]["reason_code"])
        self.assertEqual("REPEATED_PROGRESS_SWITCH_PATH", decisions[2]["reason_code"])
        self.assertEqual("replan", decisions[3]["decision"])

    def test_audit_does_not_persist_prompt_or_tool_detail(self) -> None:
        self.start()
        self.supervisor.handle(self.event("TURN_ENDED", 1, terminal_payload=blocked_payload()))
        audit = (self.state_dir / "audit.jsonl").read_text(encoding="utf-8")
        self.assertNotIn("native app control", audit)
        self.assertNotIn("follow_up_prompt", audit)


if __name__ == "__main__":
    unittest.main(verbosity=2)
