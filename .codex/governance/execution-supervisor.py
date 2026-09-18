#!/usr/bin/env python3
"""Durable, host-neutral execution supervisor for Agent Coding Engine.

The supervisor owns turn-end arbitration. Host adapters only identify the exact
workspace/thread, report observations, and deliver a returned reinjection.
Runtime state is intentionally stored outside Git under the configured state dir.
"""

from __future__ import annotations

import argparse
import hashlib
import hmac
import json
import os
import secrets
import shutil
import subprocess
import sys
import tempfile
import threading
from contextlib import contextmanager
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any, Dict, Iterator, Optional, Tuple
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


PROTOCOL = "agent-coding-engine.supervisor-event.v1"
DECISION_PROTOCOL = "agent-coding-engine.supervisor-decision.v1"
TERMINAL_SCHEMA = "agent-coding-engine.executor-terminal.v2"
MAX_BODY_BYTES = 2 * 1024 * 1024
TERMINAL_STATES = {
    "TASK_COMPLETED",
    "EXECUTION_SUBMITTED",
    "TERMINAL_SYNC_SUBMITTED",
    "BLOCKED",
}


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def canonical_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def sha256_text(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def require_string(value: Any, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field}: expected non-blank string")
    return value.strip()


def require_revision(value: Any) -> int:
    if isinstance(value, bool) or not isinstance(value, int) or value < 0:
        raise ValueError("contract_revision: expected non-negative integer")
    return value


def safe_task_name(task_id: str) -> str:
    return sha256_text(task_id)[:24]


class FileLock:
    """Small cross-platform lock based on atomic lock-file creation."""

    def __init__(self, path: Path):
        self.path = path
        self.fd: Optional[int] = None

    def __enter__(self) -> "FileLock":
        self.path.parent.mkdir(parents=True, exist_ok=True)
        for _ in range(200):
            try:
                self.fd = os.open(str(self.path), os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
                os.write(self.fd, f"{os.getpid()}\n".encode("ascii"))
                return self
            except FileExistsError:
                try:
                    age = datetime.now().timestamp() - self.path.stat().st_mtime
                    if age > 120:
                        self.path.unlink(missing_ok=True)
                        continue
                except OSError:
                    pass
                threading.Event().wait(0.025)
        raise TimeoutError(f"supervisor lock timeout: {self.path}")

    def __exit__(self, exc_type: Any, exc: Any, tb: Any) -> None:
        if self.fd is not None:
            os.close(self.fd)
        self.path.unlink(missing_ok=True)


class Store:
    def __init__(self, state_dir: Path):
        self.state_dir = state_dir
        self.tasks_dir = state_dir / "tasks"
        self.audit_path = state_dir / "audit.jsonl"
        self.lock_path = state_dir / ".lock"
        self.tasks_dir.mkdir(parents=True, exist_ok=True)

    @contextmanager
    def locked(self) -> Iterator[None]:
        with FileLock(self.lock_path):
            yield

    def task_path(self, task_id: str) -> Path:
        return self.tasks_dir / f"{safe_task_name(task_id)}.json"

    def load(self, task_id: str) -> Optional[Dict[str, Any]]:
        path = self.task_path(task_id)
        if not path.exists():
            return None
        return json.loads(path.read_text(encoding="utf-8"))

    def save(self, state: Dict[str, Any]) -> None:
        path = self.task_path(state["task_id"])
        path.parent.mkdir(parents=True, exist_ok=True)
        fd, temp_name = tempfile.mkstemp(prefix=path.name + ".", suffix=".tmp", dir=path.parent)
        try:
            with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as handle:
                json.dump(state, handle, ensure_ascii=False, sort_keys=True, indent=2)
                handle.write("\n")
                handle.flush()
                os.fsync(handle.fileno())
            os.replace(temp_name, path)
        finally:
            if os.path.exists(temp_name):
                os.unlink(temp_name)

    def audit(self, state: Dict[str, Any], event: Dict[str, Any], decision: Dict[str, Any]) -> None:
        # Deliberately omit prompts, terminal payloads, tool details, and observations.
        record = {
            "at": utc_now(),
            "task_id": state["task_id"],
            "host": state["host"],
            "workspace_hash": sha256_text(state["workspace"]),
            "thread_hash": sha256_text(state["thread_id"]),
            "event_type": event["event_type"],
            "event_id_hash": sha256_text(event["event_id"]),
            "contract_revision": event.get("contract_revision"),
            "decision": decision["decision"],
            "reason_code": decision["reason_code"],
            "idempotency_key": decision["idempotency_key"],
            "reinject_count": state.get("reinject_count", 0),
            "stop_reason": decision.get("stop_reason"),
        }
        with self.audit_path.open("a", encoding="utf-8", newline="\n") as handle:
            handle.write(canonical_json(record) + "\n")
            handle.flush()
            os.fsync(handle.fileno())


class TerminalValidator:
    def __init__(self, root: Path):
        self.root = root

    def validate(self, payload: Dict[str, Any]) -> Tuple[bool, str]:
        raw = canonical_json(payload)
        if os.name == "nt":
            shell = shutil.which("pwsh") or shutil.which("powershell")
            script = self.root / ".codex" / "governance" / "validate-terminal.ps1"
            if not shell:
                return False, "validator unavailable: PowerShell not found"
            command = [shell, "-NoProfile", "-NonInteractive", "-File", str(script)]
        else:
            shell = shutil.which("sh")
            script = self.root / ".codex" / "governance" / "validate-terminal.sh"
            if not shell:
                return False, "validator unavailable: sh not found"
            command = [shell, str(script)]
        completed = subprocess.run(
            command,
            input=raw,
            text=True,
            encoding="utf-8",
            capture_output=True,
            cwd=self.root,
            timeout=30,
            check=False,
        )
        detail = (completed.stderr or completed.stdout or "terminal validator rejected payload").strip()
        return completed.returncode == 0, detail


class Supervisor:
    def __init__(self, root: Path, state_dir: Path):
        self.root = root.resolve()
        self.store = Store(state_dir.resolve())
        self.validator = TerminalValidator(self.root)

    def _idempotency_key(self, event: Dict[str, Any]) -> str:
        fields = [
            event.get("host", ""),
            str(Path(event.get("workspace", ".")).resolve()),
            event.get("thread_id", ""),
            event.get("task_id", ""),
            str(event.get("contract_revision", "")),
            event.get("event_id", ""),
        ]
        return sha256_text("\x1f".join(fields))

    def _base_decision(
        self,
        event: Dict[str, Any],
        decision: str,
        reason_code: str,
        reason: str,
        *,
        next_action: Optional[str] = None,
        prompt: Optional[str] = None,
        stop_reason: Optional[str] = None,
    ) -> Dict[str, Any]:
        result: Dict[str, Any] = {
            "schema": DECISION_PROTOCOL,
            "decision": decision,
            "reason_code": reason_code,
            "reason": reason,
            "idempotency_key": self._idempotency_key(event),
            "send_required": decision in {"reinject", "replan"},
            "target": {
                "host": event.get("host"),
                "workspace": str(Path(event.get("workspace", ".")).resolve()),
                "thread_id": event.get("thread_id"),
            },
        }
        if next_action:
            result["next_action"] = next_action
        if prompt:
            result["follow_up_prompt"] = prompt
        if stop_reason:
            result["stop_reason"] = stop_reason
        return result

    def _validate_envelope(self, event: Dict[str, Any]) -> None:
        if event.get("schema") != PROTOCOL:
            raise ValueError("schema: unsupported supervisor event")
        for field in ("event_type", "event_id", "task_id", "host", "workspace", "thread_id", "active_role"):
            require_string(event.get(field), field)
        event_type = event["event_type"]
        if event_type not in {"TASK_STARTED", "TURN_ENDED", "HEARTBEAT", "USER_PAUSED", "USER_RESUMED", "USER_CANCELLED"}:
            raise ValueError("event_type: unknown value")
        if event["active_role"] != "executor":
            raise ValueError("active_role: supervisor only governs executor sessions")
        if event_type in {"TASK_STARTED", "TURN_ENDED"}:
            require_revision(event.get("contract_revision"))

    def _new_state(self, event: Dict[str, Any]) -> Dict[str, Any]:
        payload = event.get("terminal_payload") if isinstance(event.get("terminal_payload"), dict) else {}
        return {
            "task_id": event["task_id"],
            "host": event["host"],
            "workspace": str(Path(event["workspace"]).resolve()),
            "thread_id": event["thread_id"],
            "active_role": "executor",
            "status": "ACTIVE",
            "last_revision": event.get("contract_revision", 0),
            "last_next_action": payload.get("next_action", "恢复任务账本并完成第一项已授权原子动作。"),
            "last_progress_fingerprint": payload.get("progress_fingerprint", ""),
            "repeat_count": 0,
            "reinject_count": 0,
            "last_event_at": utc_now(),
            "terminal_allowed": False,
            "processed": {},
        }

    def _identity_matches(self, state: Dict[str, Any], event: Dict[str, Any]) -> bool:
        return (
            state["host"] == event["host"]
            and state["workspace"] == str(Path(event["workspace"]).resolve())
            and state["thread_id"] == event["thread_id"]
            and state["active_role"] == event["active_role"]
        )

    @staticmethod
    def _observation_conflict(payload: Dict[str, Any], observations: Any) -> Optional[str]:
        if not isinstance(observations, dict):
            if payload.get("state") == "BLOCKED":
                return "BLOCKED requires host execution_observations"
            return None
        for field in ("browser_status", "browser_evidence", "tool_results", "progress_fingerprint"):
            if field in observations and payload.get(field) != observations.get(field):
                return f"{field} differs from host observation"
        return None

    @staticmethod
    def _has_observed_progress(payload: Dict[str, Any]) -> bool:
        basis = payload.get("progress_basis")
        if not isinstance(basis, dict):
            return False
        return any(isinstance(basis.get(k), list) and len(basis[k]) > 0 for k in (
            "files_changed", "tool_actions", "new_evidence", "closed_work_items"
        ))

    def _reinjection(self, state: Dict[str, Any], event: Dict[str, Any], code: str, reason: str, next_action: str) -> Dict[str, Any]:
        fingerprint = ""
        payload = event.get("terminal_payload")
        if isinstance(payload, dict):
            fingerprint = str(payload.get("progress_fingerprint") or "")
        repeated = bool(fingerprint) and fingerprint == state.get("last_progress_fingerprint")
        progressed = isinstance(payload, dict) and self._has_observed_progress(payload)
        if repeated and not progressed:
            state["repeat_count"] = int(state.get("repeat_count", 0)) + 1
        else:
            state["repeat_count"] = 0
        if fingerprint:
            state["last_progress_fingerprint"] = fingerprint
        repeat = state["repeat_count"]
        if repeat >= 3:
            mode = "replan"
            prompt = f"监督器要求重新规划，但不得扩张授权范围。围绕现有工作项切换路径并先执行：{next_action}。诊断：{reason}"
            code = "REPEATED_PROGRESS_REPLAN"
        elif repeat == 2:
            mode = "reinject"
            prompt = f"继续当前授权任务并切换工具或实现路径。先完成：{next_action}。诊断：{reason}"
            code = "REPEATED_PROGRESS_SWITCH_PATH"
        elif repeat == 1:
            mode = "reinject"
            prompt = f"继续当前授权任务，先完成一个可验证原子动作：{next_action}。诊断：{reason}"
            code = "REPEATED_PROGRESS_ATOMIC_ACTION"
        else:
            mode = "reinject"
            prompt = f"继续执行当前授权任务，不得把本次回合结束当作任务终止。先完成：{next_action}。诊断：{reason}"
        state["reinject_count"] = int(state.get("reinject_count", 0)) + 1
        state["last_next_action"] = next_action
        return self._base_decision(event, mode, code, reason, next_action=next_action, prompt=prompt)

    def handle(self, event: Dict[str, Any]) -> Dict[str, Any]:
        self._validate_envelope(event)
        event["workspace"] = str(Path(event["workspace"]).resolve())
        key = self._idempotency_key(event)
        with self.store.locked():
            state = self.store.load(event["task_id"])
            if state and key in state.get("processed", {}):
                return state["processed"][key]

            event_type = event["event_type"]
            if event_type == "TASK_STARTED":
                if state and state.get("status") not in {"CANCELLED", "TERMINATED", "BLOCKED"}:
                    if not self._identity_matches(state, event):
                        decision = self._base_decision(event, "refuse", "IDENTITY_CONFLICT", "task identity is already bound to another host/workspace/thread")
                    elif event["contract_revision"] < state["last_revision"]:
                        decision = self._base_decision(event, "refuse", "REVISION_ROLLBACK", "contract revision moved backwards")
                    else:
                        decision = self._base_decision(event, "allow", "LEASE_ALREADY_ACTIVE", "existing task lease remains active")
                else:
                    state = self._new_state(event)
                    decision = self._base_decision(event, "allow", "LEASE_CREATED", "task lease created")
            elif state is None:
                decision = self._base_decision(event, "refuse", "TASK_NOT_BOUND", "no governed task lease exists for this task identity")
                return decision
            elif not self._identity_matches(state, event):
                decision = self._base_decision(event, "refuse", "WRONG_TARGET", "host/workspace/thread does not match the bound execution thread")
            elif event_type == "USER_PAUSED":
                state["status"] = "PAUSED"
                decision = self._base_decision(event, "paused", "USER_PAUSED", "automatic reinjection is paused")
            elif event_type == "USER_RESUMED":
                if state["status"] == "CANCELLED":
                    decision = self._base_decision(event, "refuse", "TASK_CANCELLED", "cancelled task leases cannot be resumed")
                else:
                    state["status"] = "ACTIVE"
                    decision = self._reinjection(state, event, "USER_RESUMED", "task resumed by user", state["last_next_action"])
            elif event_type == "USER_CANCELLED":
                state["status"] = "CANCELLED"
                decision = self._base_decision(event, "cancelled", "USER_CANCELLED", "task lease cancelled and automatic reinjection disabled")
            elif event_type == "HEARTBEAT":
                decision = self._base_decision(event, "allow", "HEARTBEAT_ACCEPTED", "task lease heartbeat recorded")
            elif state["status"] == "PAUSED":
                decision = self._base_decision(event, "paused", "TASK_PAUSED", "turn ended while automatic reinjection is paused")
            elif state["status"] == "CANCELLED":
                decision = self._base_decision(event, "cancelled", "TASK_CANCELLED", "turn ended after task cancellation")
            elif state.get("terminal_allowed"):
                decision = self._base_decision(event, "allow", "TERMINAL_ALREADY_ALLOWED", "terminal decision was already released once")
            elif event["contract_revision"] < state["last_revision"]:
                decision = self._reinjection(state, event, "REVISION_ROLLBACK", "contract revision moved backwards", state["last_next_action"])
            elif event["contract_revision"] == state["last_revision"]:
                decision = self._reinjection(state, event, "STALE_CONTRACT", "turn ended without a fresh contract revision", state["last_next_action"])
            else:
                payload = event.get("terminal_payload")
                state["last_revision"] = event["contract_revision"]
                if not isinstance(payload, dict):
                    decision = self._reinjection(state, event, "CONTRACT_MISSING", "turn ended without a terminal contract payload", state["last_next_action"])
                elif payload.get("schema") != TERMINAL_SCHEMA:
                    next_action = str(payload.get("next_action") or state["last_next_action"])
                    decision = self._reinjection(state, event, "CONTRACT_SCHEMA_MISMATCH", "terminal contract schema is missing or unsupported", next_action)
                else:
                    next_action = str(payload.get("next_action") or state["last_next_action"])
                    conflict = self._observation_conflict(payload, event.get("execution_observations"))
                    valid, diagnostic = self.validator.validate(payload)
                    if conflict:
                        decision = self._reinjection(state, event, "OBSERVATION_CONFLICT", conflict, next_action)
                    elif not valid:
                        decision = self._reinjection(state, event, "CONTRACT_INVALID", diagnostic, next_action)
                    elif payload.get("state") == "BLOCKED":
                        state["status"] = "BLOCKED"
                        decision = self._base_decision(
                            event,
                            "blocked",
                            "VALID_EXTERNAL_BLOCK",
                            "terminal contract and host observations establish a real blocker",
                            next_action=next_action,
                            stop_reason=payload.get("stop_reason"),
                        )
                    elif payload.get("state") in TERMINAL_STATES:
                        state["status"] = "TERMINATED"
                        state["terminal_allowed"] = True
                        decision = self._base_decision(event, "allow", "VALID_TERMINAL", "terminal contract passed the shared validator")
                    else:
                        decision = self._reinjection(state, event, "NON_TERMINAL_STATE", "contract does not declare an allowed terminal state", next_action)

            if state is not None:
                state["last_event_at"] = utc_now()
                processed = state.setdefault("processed", {})
                processed[key] = decision
                if len(processed) > 256:
                    for old_key in list(processed)[:-256]:
                        del processed[old_key]
                state["last_decision"] = {
                    "decision": decision["decision"],
                    "reason_code": decision["reason_code"],
                    "idempotency_key": decision["idempotency_key"],
                }
                self.store.save(state)
                self.store.audit(state, event, decision)
            return decision

    def public_status(self, task_id: str) -> Dict[str, Any]:
        with self.store.locked():
            state = self.store.load(task_id)
        if state is None:
            raise KeyError(task_id)
        return {
            "task_id": state["task_id"],
            "host": state["host"],
            "workspace": state["workspace"],
            "thread_id": state["thread_id"],
            "status": state["status"],
            "last_revision": state["last_revision"],
            "last_decision": state.get("last_decision"),
            "reinject_count": state.get("reinject_count", 0),
            "last_event_at": state["last_event_at"],
        }


def token_path(state_dir: Path) -> Path:
    return state_dir / "supervisor.token"


def ensure_token(state_dir: Path) -> str:
    path = token_path(state_dir)
    state_dir.mkdir(parents=True, exist_ok=True)
    if path.exists():
        return path.read_text(encoding="utf-8").strip()
    token = secrets.token_urlsafe(32)
    fd = os.open(str(path), os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    with os.fdopen(fd, "w", encoding="utf-8", newline="\n") as handle:
        handle.write(token + "\n")
    return token


def make_handler(supervisor: Supervisor, token: str):
    class Handler(BaseHTTPRequestHandler):
        server_version = "ExecutionSupervisor/1"

        def _json(self, status: int, value: Dict[str, Any]) -> None:
            body = canonical_json(value).encode("utf-8")
            self.send_response(status)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def _authorized(self) -> bool:
            supplied = self.headers.get("Authorization", "")
            return hmac.compare_digest(supplied, f"Bearer {token}")

        def do_GET(self) -> None:
            if self.path == "/health":
                self._json(200, {"ok": True, "schema": DECISION_PROTOCOL})
                return
            self._json(404, {"error": "not found"})

        def do_POST(self) -> None:
            if self.path != "/v1/events":
                self._json(404, {"error": "not found"})
                return
            if not self._authorized():
                self._json(401, {"error": "unauthorized"})
                return
            try:
                length = int(self.headers.get("Content-Length", "0"))
                if length <= 0 or length > MAX_BODY_BYTES:
                    raise ValueError("invalid request size")
                event = json.loads(self.rfile.read(length).decode("utf-8"))
                if not isinstance(event, dict):
                    raise ValueError("event must be an object")
                self._json(200, supervisor.handle(event))
            except (ValueError, json.JSONDecodeError) as exc:
                self._json(400, {"error": str(exc)})
            except Exception as exc:  # fail closed without leaking payload content
                self._json(500, {"error": type(exc).__name__})

        def log_message(self, fmt: str, *args: Any) -> None:
            return

    return Handler


def read_event(path: Optional[str]) -> Dict[str, Any]:
    raw = Path(path).read_text(encoding="utf-8") if path else sys.stdin.read()
    value = json.loads(raw)
    if not isinstance(value, dict):
        raise ValueError("event must be an object")
    return value


def post_event(url: str, token: str, event: Dict[str, Any]) -> Dict[str, Any]:
    request = Request(
        url.rstrip("/") + "/v1/events",
        data=canonical_json(event).encode("utf-8"),
        headers={"Content-Type": "application/json", "Authorization": f"Bearer {token}"},
        method="POST",
    )
    with urlopen(request, timeout=15) as response:
        return json.loads(response.read().decode("utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description="Agent Coding Engine execution supervisor")
    parser.add_argument("--root", default=str(Path(__file__).resolve().parents[2]))
    parser.add_argument("--state-dir")
    sub = parser.add_subparsers(dest="command", required=True)

    serve = sub.add_parser("serve")
    serve.add_argument("--listen", default="127.0.0.1")
    serve.add_argument("--port", type=int, default=8765)

    event_parser = sub.add_parser("event")
    event_parser.add_argument("--file")
    event_parser.add_argument("--url")

    status_parser = sub.add_parser("status")
    status_parser.add_argument("--task-id", required=True)

    args = parser.parse_args()
    root = Path(args.root).resolve()
    state_dir = Path(args.state_dir).resolve() if args.state_dir else root / ".codex" / "governance" / "runtime"
    supervisor = Supervisor(root, state_dir)

    if args.command == "serve":
        token = ensure_token(state_dir)
        server = ThreadingHTTPServer((args.listen, args.port), make_handler(supervisor, token))
        print(canonical_json({"listening": f"http://{args.listen}:{args.port}", "state_dir": str(state_dir)}), flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            server.server_close()
        return 0
    if args.command == "event":
        event = read_event(args.file)
        if args.url:
            token = ensure_token(state_dir)
            result = post_event(args.url, token, event)
        else:
            result = supervisor.handle(event)
        print(canonical_json(result))
        return 0
    if args.command == "status":
        print(canonical_json(supervisor.public_status(args.task_id)))
        return 0
    return 2


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (ValueError, KeyError, HTTPError, URLError, TimeoutError) as exc:
        print(canonical_json({"error": str(exc)}), file=sys.stderr)
        raise SystemExit(2)
