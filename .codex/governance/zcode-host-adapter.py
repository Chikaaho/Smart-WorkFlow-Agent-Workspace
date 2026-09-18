#!/usr/bin/env python3
"""Fail-closed ZCode 0.16.x app-server adapter.

Uses stable session IDs and NDJSON RPC. It never targets the focused window and
never reads or writes model credentials itself. Unknown reverse requests are
declined instead of hanging the protocol reader.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import queue
import subprocess
import sys
import threading
import time
from pathlib import Path
from typing import Any, Dict, List, Optional


def canonical(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def digest(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def normalize_workspace(value: str) -> str:
    return os.path.normcase(os.path.normpath(os.path.abspath(value)))


class ZCodeProtocolError(RuntimeError):
    pass


class AppServer:
    def __init__(self, node: Path, cli: Path, timeout: int = 60):
        self.timeout = timeout
        self.messages: "queue.Queue[Dict[str, Any]]" = queue.Queue()
        self.stderr_lines: "queue.Queue[str]" = queue.Queue()
        self.process = subprocess.Popen(
            [str(node), str(cli), "app-server", "--stdio", "--surface", "desktop"],
            stdin=subprocess.PIPE,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            encoding="utf-8",
            errors="replace",
            bufsize=1,
        )
        assert self.process.stdin and self.process.stdout and self.process.stderr
        self.stdout_thread = threading.Thread(target=self._read_stdout, daemon=True)
        self.stderr_thread = threading.Thread(target=self._read_stderr, daemon=True)
        self.stdout_thread.start()
        self.stderr_thread.start()
        self.next_id = 1

    def _read_stdout(self) -> None:
        assert self.process.stdout
        for line in self.process.stdout:
            line = line.strip()
            if not line:
                continue
            try:
                message = json.loads(line)
                if isinstance(message, dict):
                    self.messages.put(message)
            except json.JSONDecodeError:
                self.stderr_lines.put("non-json stdout: " + line[:200])

    def _read_stderr(self) -> None:
        assert self.process.stderr
        for line in self.process.stderr:
            if line.strip():
                self.stderr_lines.put(line.strip()[:500])

    def send(self, value: Dict[str, Any]) -> None:
        if self.process.poll() is not None:
            raise ZCodeProtocolError(f"app-server exited with {self.process.returncode}")
        assert self.process.stdin
        self.process.stdin.write(canonical(value) + "\n")
        self.process.stdin.flush()

    def _reply_reverse(self, message: Dict[str, Any]) -> bool:
        method = message.get("method")
        request_id = message.get("id")
        if request_id is None or not isinstance(method, str):
            return False
        if method == "session/requestRuntimePreferences":
            result = {
                "nativeSearchEnhancementsEnabled": False,
                "memoryEnabled": False,
                "askUserQuestionAutoResolutionEnabled": False,
            }
            self.send({"id": request_id, "result": result})
        elif method == "interaction/browserList":
            self.send({"id": request_id, "result": {"browsers": []}})
        elif method in {"interaction/requestPermission", "interaction/requestUserInput", "interaction/browserExecute"}:
            self.send({"id": request_id, "error": {"code": -32601, "message": "host capability unavailable; fail closed"}})
        else:
            self.send({"id": request_id, "error": {"code": -32601, "message": "unsupported host request"}})
        return True

    def rpc(self, method: str, params: Dict[str, Any], notifications: Optional[List[Dict[str, Any]]] = None) -> Any:
        request_id = self.next_id
        self.next_id += 1
        self.send({"id": request_id, "method": method, "params": params})
        deadline = time.monotonic() + self.timeout
        while time.monotonic() < deadline:
            try:
                message = self.messages.get(timeout=min(0.5, max(0.01, deadline - time.monotonic())))
            except queue.Empty:
                if self.process.poll() is not None:
                    raise ZCodeProtocolError(f"app-server exited with {self.process.returncode}: {self.stderr_summary()}")
                continue
            if self._reply_reverse(message):
                continue
            if message.get("id") == request_id and "method" not in message:
                if "error" in message:
                    error = message["error"]
                    raise ZCodeProtocolError(f"{method}: {error.get('code')} {error.get('message')}")
                return message.get("result")
            if notifications is not None and isinstance(message.get("method"), str):
                notifications.append(message)
        raise TimeoutError(f"ZCode RPC timeout: {method}; stderr={self.stderr_summary()}")

    def next_message(self, timeout: float) -> Dict[str, Any]:
        deadline = time.monotonic() + timeout
        while time.monotonic() < deadline:
            message = self.messages.get(timeout=min(0.5, max(0.01, deadline - time.monotonic())))
            if self._reply_reverse(message):
                continue
            return message
        raise TimeoutError("ZCode event timeout")

    def stderr_summary(self) -> str:
        values: List[str] = []
        while len(values) < 5:
            try:
                values.append(self.stderr_lines.get_nowait())
            except queue.Empty:
                break
        return " | ".join(values)

    def close(self) -> None:
        if self.process.poll() is None:
            if self.process.stdin:
                self.process.stdin.close()
            try:
                self.process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                self.process.terminate()
                try:
                    self.process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    self.process.kill()
                    self.process.wait(timeout=5)

    def __enter__(self) -> "AppServer":
        return self

    def __exit__(self, exc_type: Any, exc: Any, tb: Any) -> None:
        self.close()


class ZCodeAdapter:
    def __init__(self, node: Path, cli: Path, timeout: int = 60):
        self.node = node
        self.cli = cli
        self.timeout = timeout

    @staticmethod
    def workspace(value: str) -> Dict[str, str]:
        absolute = os.path.abspath(value)
        return {"workspacePath": absolute, "workspaceKey": absolute}

    @staticmethod
    def sessions_from(result: Any) -> List[Dict[str, Any]]:
        if not isinstance(result, dict) or not isinstance(result.get("sessions"), list):
            raise ZCodeProtocolError("session/list returned an unexpected shape")
        return [s for s in result["sessions"] if isinstance(s, dict) and not str(s.get("sessionId", "")).startswith("sess_subagent_")]

    def list_sessions(self, workspace: str) -> List[Dict[str, Any]]:
        with AppServer(self.node, self.cli, self.timeout) as server:
            result = server.rpc("session/list", {"workspace": self.workspace(workspace)})
        return self.sessions_from(result)

    def require_target(self, sessions: List[Dict[str, Any]], workspace: str, session_id: str) -> Dict[str, Any]:
        matches = [s for s in sessions if s.get("sessionId") == session_id]
        if len(matches) != 1:
            raise ZCodeProtocolError(f"expected exactly one matching session_id; found {len(matches)}")
        actual = matches[0].get("workspace", {}).get("workspacePath")
        if not isinstance(actual, str) or normalize_workspace(actual) != normalize_workspace(workspace):
            raise ZCodeProtocolError("session workspace does not match the governed workspace")
        return matches[0]

    def probe(self, workspace: str) -> Dict[str, Any]:
        sessions = self.list_sessions(workspace)
        return {
            "schema": "agent-coding-engine.zcode-probe.v1",
            "workspace": os.path.abspath(workspace),
            "session_count": len(sessions),
            "sessions": [{
                "session_id": s.get("sessionId"),
                "status": s.get("status"),
                "updated_at": s.get("updatedAt"),
                "mode": s.get("mode"),
            } for s in sessions],
            "capabilities": {
                "structured_session_identity": True,
                "workspace_binding": True,
                "turn_events": True,
                "targeted_send": True,
                "send_readback": "VERIFIED_ONLY_AFTER_SEND_EVENT_ROUNDTRIP",
                "gui_focus_required": False,
            },
        }

    def read(self, workspace: str, session_id: str) -> Dict[str, Any]:
        with AppServer(self.node, self.cli, self.timeout) as server:
            sessions = self.sessions_from(server.rpc("session/list", {"workspace": self.workspace(workspace)}))
            target = self.require_target(sessions, workspace, session_id)
            server.rpc("session/resume", {"sessionId": session_id, "workspace": self.workspace(workspace)})
            snapshot = server.rpc("session/read", {"sessionId": session_id})
        return {
            "schema": "agent-coding-engine.zcode-readback.v1",
            "session_id": session_id,
            "workspace": os.path.abspath(workspace),
            "listed_status": target.get("status"),
            "snapshot_hash": digest(canonical(snapshot)),
            "readback": True,
        }

    def send_prompt(self, workspace: str, session_id: str, prompt: str) -> Dict[str, Any]:
        if not prompt.strip():
            raise ValueError("prompt must be non-blank")
        with AppServer(self.node, self.cli, self.timeout) as server:
            sessions = self.sessions_from(server.rpc("session/list", {"workspace": self.workspace(workspace)}))
            self.require_target(sessions, workspace, session_id)
            server.rpc("session/resume", {"sessionId": session_id, "workspace": self.workspace(workspace)})
            server.rpc("session/subscribe", {"sessionId": session_id, "deliveryKind": "desktop-continuous"})
            accepted = server.rpc("session/send", {"sessionId": session_id, "content": prompt})
            event_count = 0
            started = False
            terminal: Optional[Dict[str, Any]] = None
            deadline = time.monotonic() + self.timeout
            while time.monotonic() < deadline:
                message = server.next_message(deadline - time.monotonic())
                if message.get("method") != "session/event":
                    continue
                params = message.get("params")
                if not isinstance(params, dict):
                    continue
                if params.get("sessionId") != session_id:
                    raise ZCodeProtocolError("received an event for a different session; refusing readback")
                event_count += 1
                event_type = params.get("type")
                if event_type == "turn.started":
                    started = True
                if started and event_type in {"turn.terminal", "turn.completed", "turn.failed"}:
                    terminal = {
                        "type": event_type,
                        "seq": params.get("seq"),
                        "event_id_hash": digest(str(params.get("eventId", ""))),
                        "payload_hash": digest(canonical(params.get("payload"))),
                    }
                    break
            if not started or terminal is None:
                raise TimeoutError("ZCode send was not followed by a matching turn start and terminal event")
            snapshot = server.rpc("session/read", {"sessionId": session_id})
        return {
            "schema": "agent-coding-engine.zcode-send-readback.v1",
            "session_id": session_id,
            "workspace": os.path.abspath(workspace),
            "prompt_hash": digest(prompt),
            "accepted": bool(accepted.get("accepted")) if isinstance(accepted, dict) else bool(accepted),
            "event_count": event_count,
            "terminal": terminal,
            "post_send_snapshot_hash": digest(canonical(snapshot)),
            "target_verified": True,
        }


def resolve_node(explicit: Optional[str]) -> Path:
    candidates = [
        explicit,
        os.environ.get("ZCODE_NODE"),
        str(Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe"),
    ]
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return Path(candidate)
    raise FileNotFoundError("Node.js runtime not found; pass --node or set ZCODE_NODE")


def resolve_cli(explicit: Optional[str]) -> Path:
    candidates = [explicit, os.environ.get("ZCODE_CLI"), r"F:\soft\zcode\resources\glm\zcode.cjs"]
    for candidate in candidates:
        if candidate and Path(candidate).is_file():
            return Path(candidate)
    raise FileNotFoundError("ZCode CLI runtime not found; pass --cli or set ZCODE_CLI")


def main() -> int:
    parser = argparse.ArgumentParser(description="ZCode structured host adapter")
    parser.add_argument("--node")
    parser.add_argument("--cli")
    parser.add_argument("--timeout", type=int, default=60)
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ("probe", "read", "send"):
        child = sub.add_parser(name)
        child.add_argument("--workspace", required=True)
        if name in {"read", "send"}:
            child.add_argument("--session-id", required=True)
        if name == "send":
            child.add_argument("--prompt")
            child.add_argument("--prompt-file")
    args = parser.parse_args()
    adapter = ZCodeAdapter(resolve_node(args.node), resolve_cli(args.cli), args.timeout)
    if args.command == "probe":
        result = adapter.probe(args.workspace)
    elif args.command == "read":
        result = adapter.read(args.workspace, args.session_id)
    else:
        if bool(args.prompt) == bool(args.prompt_file):
            raise ValueError("send requires exactly one of --prompt or --prompt-file")
        prompt = args.prompt if args.prompt is not None else Path(args.prompt_file).read_text(encoding="utf-8")
        result = adapter.send_prompt(args.workspace, args.session_id, prompt)
    print(json.dumps(result, ensure_ascii=False, sort_keys=True, indent=2))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(json.dumps({"error": type(exc).__name__, "detail": str(exc)}, ensure_ascii=False), file=sys.stderr)
        raise SystemExit(2)
