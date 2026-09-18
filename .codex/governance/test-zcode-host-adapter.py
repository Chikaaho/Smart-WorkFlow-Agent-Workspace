#!/usr/bin/env python3
from __future__ import annotations

import importlib.util
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
MODULE_PATH = ROOT / ".codex" / "governance" / "zcode-host-adapter.py"
SPEC = importlib.util.spec_from_file_location("zcode_host_adapter", MODULE_PATH)
assert SPEC and SPEC.loader
module = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(module)


class ZCodeAdapterTests(unittest.TestCase):
    def setUp(self) -> None:
        self.adapter = module.ZCodeAdapter(Path("node"), Path("zcode.cjs"))
        self.workspace = str(ROOT)
        self.session = {
            "sessionId": "sess_target",
            "workspace": {"workspacePath": self.workspace},
            "status": "idle",
        }

    def test_exact_session_and_workspace_are_required(self) -> None:
        self.assertEqual(self.session, self.adapter.require_target([self.session], self.workspace, "sess_target"))
        with self.assertRaises(module.ZCodeProtocolError):
            self.adapter.require_target([self.session], self.workspace, "sess_other")
        wrong = dict(self.session)
        wrong["workspace"] = {"workspacePath": str(ROOT.parent)}
        with self.assertRaises(module.ZCodeProtocolError):
            self.adapter.require_target([wrong], self.workspace, "sess_target")

    def test_duplicate_session_identity_fails_closed(self) -> None:
        with self.assertRaises(module.ZCodeProtocolError):
            self.adapter.require_target([self.session, dict(self.session)], self.workspace, "sess_target")

    def test_subagent_sessions_are_not_target_candidates(self) -> None:
        result = self.adapter.sessions_from({"sessions": [
            self.session,
            {"sessionId": "sess_subagent_agent_x", "workspace": {"workspacePath": self.workspace}},
        ]})
        self.assertEqual([self.session], result)

    def test_reverse_requests_use_safe_defaults(self) -> None:
        server = object.__new__(module.AppServer)
        sent = []
        server.send = sent.append
        self.assertTrue(server._reply_reverse({"id": "server-1", "method": "session/requestRuntimePreferences"}))
        self.assertFalse(sent[0]["result"]["memoryEnabled"])
        self.assertTrue(server._reply_reverse({"id": "server-2", "method": "interaction/requestPermission"}))
        self.assertEqual(-32601, sent[1]["error"]["code"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
