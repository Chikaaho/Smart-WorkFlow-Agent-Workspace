#!/usr/bin/env python3
"""ZCode POSIX 宿主入口（zcode-role-bind.py / zcode-stop-gate.py）治理契约测试。

与 test-stop-gate.ps1（Windows 入口）同源同责：只验证宿主接入行为——角色绑定、
终态行提取、公共 Validator 调用、观察降级、fail-closed 与审计投影。
终态 schema 的权威校验属于 validate-terminal.sh 自己的回归（test-terminal-contract.sh）。
"""

from __future__ import annotations

import json
import os
import importlib.util
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
GOV = ROOT / ".codex" / "governance"
ROLE_BIND = GOV / "zcode-role-bind.py"
STOP_GATE = GOV / "zcode-stop-gate.py"

sys.path.insert(0, str(GOV))
import zcode_gate_common as common  # noqa: E402

_role_bind_spec = importlib.util.spec_from_file_location("zcode_role_bind_module", GOV / "zcode-role-bind.py")
assert _role_bind_spec and _role_bind_spec.loader
role_bind_module = importlib.util.module_from_spec(_role_bind_spec)
_role_bind_spec.loader.exec_module(role_bind_module)

MARKER = "ENGINE_TERMINAL"


def run_entry(script: Path, arguments: list[str], payload: str | None, home: Path | None = None):
    env = dict(os.environ)
    env.pop("ZCODE_PROJECT_DIR", None)
    env.pop("CLAUDE_PROJECT_DIR", None)
    env.pop("AGENT_CODING_ENGINE_ACTIVE_ROLE", None)
    if home is not None:
        env["HOME"] = str(home)
    completed = subprocess.run(
        [sys.executable, str(script), *arguments],
        input=(payload.encode("utf-8") if payload is not None else b""),
        capture_output=True,
        timeout=60,
        env=env,
        cwd=str(ROOT),
    )
    stdout = completed.stdout.decode("utf-8", "replace")
    return completed.returncode, stdout, completed.stderr.decode("utf-8", "replace")


def observation_file(directory: Path, *, open_items=None, available=True, tokens=492873, limit=1000000, error=""):
    payload = {
        "todo": (
            {"available": True, "total": len(open_items or []), "open": len(open_items or []), "open_items": open_items or []}
            if available
            else {"available": False, "error": error or "session-db-not-found"}
        ),
        "context": (
            {"available": True, "tokens": tokens, "limit": limit, "percent": round(tokens / limit * 100, 1), "model": "GLM-5.3-Flash", "context_exceeded": False}
            if limit > 0
            else {"available": False, "error": "context-limit-not-found"}
        ),
    }
    path = directory / f"observation-{abs(hash((available, tokens, limit, error, json.dumps(open_items or []))))}.json"
    path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    return str(path)


def bind_role(runtime: Path, session: str, role: str = "executor") -> None:
    common.write_state(
        runtime / "sessions" / f"{common.session_key(session)}.role.json",
        {"schema": "agent-coding-engine.zcode-session-role.v1", "session_id_digest": common.session_id_digest(session), "role": role, "source": "user_prompt_submit", "declared_at": common.utc_now()},
    )


def stop_payload(*, session="sess_gatecase", tool_calls=10, message="正文", cwd=str(ROOT)) -> str:
    return json.dumps(
        {"session_id": session, "toolCallCount": tool_calls, "stop_hook_active": False, "last_assistant_message": message, "cwd": cwd},
        ensure_ascii=False,
    )


class RoleDeclarationPatternTests(unittest.TestCase):
    def test_anchored_declarations_normalize(self) -> None:
        for prompt in (
            "角色是执行",
            "身份：管理员",
            "你是执行，领取任务",
            "本会话现在是规划",
            "作为管理员检查",
            "以执行的身份开始",
            "授权执行以下批次",
            "执行，领取任务",
            "管理员，看一下这个会话",
            "规划：复核回执",
            "执行",
        ):
            self.assertEqual("declared", role_bind_module.get_declared_role(prompt)["reason"], prompt)

    def test_aliases_map_to_canonical_roles(self) -> None:
        self.assertEqual("executor", role_bind_module.get_declared_role("角色是执行")["role"])
        self.assertEqual("planner", role_bind_module.get_declared_role("角色为规划")["role"])
        self.assertEqual("admin", role_bind_module.get_declared_role("身份=管理员")["role"])

    def test_task_text_with_role_noun_is_not_a_declaration(self) -> None:
        result = role_bind_module.get_declared_role("执行 p62 低代码事务BPM分层任务")
        self.assertEqual({"role": "", "reason": "none"}, result)

    def test_conflicting_declarations_are_ambiguous(self) -> None:
        self.assertEqual("ambiguous", role_bind_module.get_declared_role("角色是执行，身份为管理员")["reason"])


class RoleBindEntryTests(unittest.TestCase):
    def setUp(self) -> None:
        self._temporary = tempfile.TemporaryDirectory()
        self.runtime = Path(self._temporary.name) / "runtime"
        self.home = Path(self._temporary.name) / "home"
        self.home.mkdir(parents=True, exist_ok=True)

    def tearDown(self) -> None:
        self._temporary.cleanup()

    def test_prompt_declaration_binds_role_and_injects_status_line(self) -> None:
        payload = json.dumps({"prompt": "你是执行，领取任务", "session_id": "sess_bind01", "cwd": str(ROOT)}, ensure_ascii=False)
        code, stdout, _ = run_entry(ROLE_BIND, ["--runtime-root", str(self.runtime)], payload, home=self.home)
        self.assertEqual(0, code)
        record = common.read_state(self.runtime / "sessions" / "sess_bind01.role.json")
        self.assertIsNotNone(record)
        self.assertEqual("executor", record["role"])
        self.assertEqual("user_prompt_submit", record["source"])
        output = json.loads(stdout)
        self.assertEqual("UserPromptSubmit", output["hookSpecificOutput"]["hookEventName"])
        self.assertIn("会话角色=executor", output["hookSpecificOutput"]["additionalContext"])
        self.assertIn("【执行门禁】", output["hookSpecificOutput"]["additionalContext"])
        audit = (self.runtime / "audit.jsonl").read_text(encoding="utf-8").strip().splitlines()
        self.assertEqual("bound", json.loads(audit[-1])["action"])

    def test_missing_declaration_backfills_from_first_prompt(self) -> None:
        payload = json.dumps({"prompt": "继续核对剩余项", "session_id": "sess_bind02", "cwd": str(ROOT)}, ensure_ascii=False)
        arguments = ["--runtime-root", str(self.runtime), "--first-prompt-text", "角色是执行，负责本方向"]
        code, stdout, _ = run_entry(ROLE_BIND, arguments, payload, home=self.home)
        self.assertEqual(0, code)
        record = common.read_state(self.runtime / "sessions" / "sess_bind02.role.json")
        self.assertEqual("executor", record["role"])
        self.assertEqual("host_first_prompt", record["source"])
        # 与 session-role.ps1 同语义：回填来源标记在后续提示词从存储读回时展示。
        _, stdout, _ = run_entry(ROLE_BIND, ["--runtime-root", str(self.runtime)], payload, home=self.home)
        self.assertIn("会话角色=executor（首个提示词回填）", json.loads(stdout)["hookSpecificOutput"]["additionalContext"])

    def test_undeclared_session_gets_no_role_and_reports_ungated(self) -> None:
        payload = json.dumps({"prompt": "随便看看", "session_id": "sess_bind03", "cwd": str(ROOT)}, ensure_ascii=False)
        code, stdout, _ = run_entry(ROLE_BIND, ["--runtime-root", str(self.runtime)], payload, home=self.home)
        self.assertEqual(0, code)
        self.assertIsNone(common.read_state(self.runtime / "sessions" / "sess_bind03.role.json"))
        self.assertIn("会话角色=未声明（执行门禁不启用）", json.loads(stdout)["hookSpecificOutput"]["additionalContext"])

    def test_armed_note_detects_missing_machine_declaration(self) -> None:
        payload = json.dumps({"prompt": "角色是执行", "session_id": "sess_bind04", "cwd": str(ROOT)}, ensure_ascii=False)
        code, stdout, _ = run_entry(ROLE_BIND, ["--runtime-root", str(self.runtime)], payload, home=self.home)
        self.assertEqual(0, code)
        self.assertIn("门禁=未上膛（机器级声明缺失", json.loads(stdout)["hookSpecificOutput"]["additionalContext"])

    def test_armed_note_detects_drift(self) -> None:
        declaration = json.loads((GOV / "zcode-hooks-declaration.json").read_text(encoding="utf-8-sig"))
        posix_hooks = declaration["platforms"]["posix"]["hooks"]
        drifted = json.loads(json.dumps(posix_hooks))
        drifted["events"]["Stop"][0]["hooks"][0]["enabled"] = False
        (self.home / ".zcode" / "cli").mkdir(parents=True, exist_ok=True)
        (self.home / ".zcode" / "cli" / "config.json").write_text(json.dumps({"hooks": drifted}), encoding="utf-8")
        payload = json.dumps({"prompt": "角色是执行", "session_id": "sess_bind05", "cwd": str(ROOT)}, ensure_ascii=False)
        code, stdout, _ = run_entry(ROLE_BIND, ["--runtime-root", str(self.runtime)], payload, home=self.home)
        self.assertEqual(0, code)
        self.assertIn("门禁=未上膛（声明漂移", json.loads(stdout)["hookSpecificOutput"]["additionalContext"])

    def test_armed_note_accepts_installed_declaration(self) -> None:
        declaration = json.loads((GOV / "zcode-hooks-declaration.json").read_text(encoding="utf-8-sig"))
        (self.home / ".zcode" / "cli").mkdir(parents=True, exist_ok=True)
        (self.home / ".zcode" / "cli" / "config.json").write_text(json.dumps({"mcp": {}, "hooks": declaration["platforms"]["posix"]["hooks"]}), encoding="utf-8")
        payload = json.dumps({"prompt": "角色是执行", "session_id": "sess_bind06", "cwd": str(ROOT)}, ensure_ascii=False)
        code, stdout, _ = run_entry(ROLE_BIND, ["--runtime-root", str(self.runtime)], payload, home=self.home)
        self.assertEqual(0, code)
        self.assertIn("门禁=已上膛", json.loads(stdout)["hookSpecificOutput"]["additionalContext"])


class StopGateEntryTests(unittest.TestCase):
    def setUp(self) -> None:
        self._temporary = tempfile.TemporaryDirectory()
        self.runtime = Path(self._temporary.name) / "runtime"

    def tearDown(self) -> None:
        self._temporary.cleanup()

    def run_gate(self, payload: str, observation: str | None = None, session: str | None = None):
        arguments = ["--runtime-root", str(self.runtime), "--engine-root", str(ROOT)]
        if observation:
            arguments += ["--observation-file", observation]
        if session:
            arguments += ["--session-id", session]
        return run_entry(STOP_GATE, arguments, payload)

    def test_unbound_role_is_not_gated(self) -> None:
        code, stdout, _ = self.run_gate(stop_payload())
        self.assertEqual(0, code)
        self.assertEqual("", stdout.strip())

    def test_non_executor_role_is_not_gated(self) -> None:
        bind_role(self.runtime, "sess_gatecase", role="admin")
        code, stdout, _ = self.run_gate(stop_payload())
        self.assertEqual(0, code)
        self.assertEqual("", stdout.strip())

    def test_missing_marker_is_blocked(self) -> None:
        bind_role(self.runtime, "sess_gatecase")
        observation = observation_file(Path(self._temporary.name), open_items=[])
        code, stdout, _ = self.run_gate(stop_payload(message="本轮完成了部分工作。"), observation=observation)
        self.assertEqual(0, code)
        decision = json.loads(stdout)
        self.assertEqual("block", decision["decision"])
        self.assertIn("执行会话不能结束", decision["reason"])
        self.assertIn("在正文最后一行输出唯一一条以 ENGINE_TERMINAL 开头的终态行", decision["reason"])

    def test_marker_must_be_unique_and_last(self) -> None:
        bind_role(self.runtime, "sess_gatecase")
        observation = observation_file(Path(self._temporary.name), open_items=[])
        duplicated = f"前文\n{MARKER} " + json.dumps({"state": "TASK_COMPLETED"}, ensure_ascii=False) + f"\n{MARKER} " + json.dumps({"state": "TASK_COMPLETED"}, ensure_ascii=False)
        not_last = f"{MARKER} " + json.dumps({"state": "TASK_COMPLETED"}, ensure_ascii=False) + "\n后记"
        for message, expected_text in ((duplicated, "终态行出现多次"), (not_last, "终态行不是正文物理末行")):
            _, stdout, _ = self.run_gate(stop_payload(message=message), observation=observation)
            decision = json.loads(stdout)
            self.assertEqual("block", decision["decision"], message)
            self.assertIn(expected_text, decision["reason"], message)

    def test_invalid_marker_json_is_blocked(self) -> None:
        bind_role(self.runtime, "sess_gatecase")
        observation = observation_file(Path(self._temporary.name), open_items=[])
        _, stdout, _ = self.run_gate(stop_payload(message=f"正文\n{MARKER} {{broken"), observation=observation)
        decision = json.loads(stdout)
        self.assertEqual("block", decision["decision"])
        self.assertIn("终态行不是合法 JSON", decision["reason"])

    def test_contract_rejection_is_reported_with_validator_diagnostics(self) -> None:
        bind_role(self.runtime, "sess_gatecase")
        observation = observation_file(Path(self._temporary.name), open_items=[])
        terminal = json.dumps({"schema": "agent-coding-engine.executor-terminal.v2", "role": "executor", "state": "DONE", "task_level": "S", "evidence": ["x"]}, ensure_ascii=False)
        _, stdout, _ = self.run_gate(stop_payload(message=f"正文\n{MARKER} {terminal}"), observation=observation)
        decision = json.loads(stdout)
        self.assertEqual("block", decision["decision"])
        self.assertIn("终态契约未通过公共 Validator", decision["reason"])
        self.assertIn("state", decision["reason"])

    def test_valid_s_task_terminal_passes_when_list_converged(self) -> None:
        bind_role(self.runtime, "sess_gatecase")
        observation = observation_file(Path(self._temporary.name), open_items=[])
        terminal = json.dumps({"schema": "agent-coding-engine.executor-terminal.v2", "role": "executor", "state": "TASK_COMPLETED", "task_level": "S", "evidence": ["聚焦检查通过：按钮文案已更新"]}, ensure_ascii=False)
        code, stdout, _ = self.run_gate(stop_payload(message=f"正文\n{MARKER} {terminal}"), observation=observation)
        self.assertEqual(0, code)
        self.assertEqual("", stdout.strip())
        audit = (self.runtime / "audit.jsonl").read_text(encoding="utf-8").strip().splitlines()
        record = json.loads(audit[-1])
        self.assertEqual("pass", record["decision"])
        self.assertEqual("TERMINAL_ACCEPTED", record["reason_code"])

    def test_open_todo_list_blocks_terminal(self) -> None:
        bind_role(self.runtime, "sess_gatecase")
        observation = observation_file(Path(self._temporary.name), open_items=[{"position": 0, "status": "in_progress", "content": "尾延迟治理"}])
        terminal = json.dumps({"schema": "agent-coding-engine.executor-terminal.v2", "role": "executor", "state": "TASK_COMPLETED", "task_level": "S", "evidence": ["x"]}, ensure_ascii=False)
        _, stdout, _ = self.run_gate(stop_payload(message=f"正文\n{MARKER} {terminal}"), observation=observation)
        decision = json.loads(stdout)
        self.assertEqual("block", decision["decision"])
        self.assertIn("仍有 1 项未完成", decision["reason"])
        self.assertIn("in_progress：尾延迟治理", decision["reason"])

    def test_context_exhaustion_claim_is_rejected_with_measured_values(self) -> None:
        bind_role(self.runtime, "sess_gatecase")
        observation = observation_file(Path(self._temporary.name), open_items=[], tokens=492873, limit=1000000)
        _, stdout, _ = self.run_gate(stop_payload(message="上下文窗口已满，先收尾。"), observation=observation)
        decision = json.loads(stdout)
        self.assertEqual("block", decision["decision"])
        self.assertIn("不构成停止依据", decision["reason"])
        self.assertIn("492873 / 上限 1000000 tokens（49.3%）", decision["reason"])

    def test_no_execution_activity_passes_ungated(self) -> None:
        bind_role(self.runtime, "sess_gatecase")
        observation = observation_file(Path(self._temporary.name), open_items=[])
        code, stdout, _ = self.run_gate(stop_payload(tool_calls=0, message="纯问答回合。"), observation=observation)
        self.assertEqual(0, code)
        self.assertEqual("", stdout.strip())
        audit = (self.runtime / "audit.jsonl").read_text(encoding="utf-8").strip().splitlines()
        record = json.loads(audit[-1])
        self.assertEqual("NO_EXECUTION_ACTIVITY", record["reason_code"])
        self.assertEqual(0, record["gated"])

    def test_open_list_gates_even_zero_tool_turn(self) -> None:
        bind_role(self.runtime, "sess_gatecase")
        observation = observation_file(Path(self._temporary.name), open_items=[{"position": 0, "status": "pending", "content": "A"}])
        _, stdout, _ = self.run_gate(stop_payload(tool_calls=0, message="还没开始。"), observation=observation)
        self.assertEqual("block", json.loads(stdout)["decision"])

    def test_repeated_no_progress_state_escalates(self) -> None:
        bind_role(self.runtime, "sess_gatecase")
        observation = observation_file(Path(self._temporary.name), open_items=[])
        payload = stop_payload(tool_calls=5, message="无终态行。")
        self.run_gate(payload, observation=observation)
        _, stdout, _ = self.run_gate(payload, observation=observation)
        decision = json.loads(stdout)
        self.assertIn("同一无进展状态重复出现", decision["reason"])
        state = common.read_state(self.runtime / "sessions" / "sess_gatecase.state.json")
        self.assertEqual(2, state["consecutive_blocks"])
        self.assertEqual("MARKER_MISSING", state["last_reason_code"])

    def test_unavailable_observation_degrades_but_still_gates(self) -> None:
        bind_role(self.runtime, "sess_gatecase")
        observation = observation_file(Path(self._temporary.name), available=False, error="session-db-not-found")
        _, stdout, _ = self.run_gate(stop_payload(message="无终态行。"), observation=observation)
        decision = json.loads(stdout)
        self.assertEqual("block", decision["decision"])
        audit = (self.runtime / "audit.jsonl").read_text(encoding="utf-8").strip().splitlines()
        record = json.loads(audit[-1])
        self.assertEqual("session-db-not-found", record["observation"])

    def test_invalid_payload_fails_closed(self) -> None:
        bind_role(self.runtime, "sess_gatecase")
        code, stdout, stderr = self.run_gate("{broken json")
        self.assertEqual(2, code)
        self.assertEqual("", stdout.strip())
        self.assertIn("载荷不是合法 JSON", stderr)

    def test_empty_payload_passes_without_output(self) -> None:
        code, stdout, _ = self.run_gate("")
        self.assertEqual(0, code)
        self.assertEqual("", stdout.strip())

    def test_invocation_receipts_are_written(self) -> None:
        bind_role(self.runtime, "sess_gatecase")
        observation = observation_file(Path(self._temporary.name), open_items=[])
        self.run_gate(stop_payload(), observation=observation)
        receipts = [json.loads(line) for line in (self.runtime / "invocations.log").read_text(encoding="utf-8").strip().splitlines()]
        self.assertEqual("invoked", receipts[0]["dispatch"])
        self.assertEqual("payload-read", receipts[1]["dispatch"])
        self.assertEqual("sess_gatecase", receipts[1]["session"])

    def test_real_host_db_observation_path(self) -> None:
        """集成：观察读取器走真实宿主库的降级路径（不存在会话 → available=false，不阻断裁决）。"""
        bind_role(self.runtime, "sess_nonexistent_integration")
        _, stdout, _ = self.run_gate(stop_payload(session="sess_nonexistent_integration", message="无终态行。"))
        decision = json.loads(stdout)
        self.assertEqual("block", decision["decision"])
        self.assertIn("执行会话不能结束", decision["reason"])


class InstallerDriftTests(unittest.TestCase):
    def setUp(self) -> None:
        self._temporary = tempfile.TemporaryDirectory()
        self.home = Path(self._temporary.name) / "home"
        (self.home / ".zcode" / "cli").mkdir(parents=True)

    def tearDown(self) -> None:
        self._temporary.cleanup()

    def run_installer(self, *extra: str) -> tuple[int, str]:
        env = dict(os.environ)
        env["HOME"] = str(self.home)
        env["AGENT_CODING_ENGINE_USER_CONFIG"] = str(self.home / ".zcode" / "cli" / "config.json")
        completed = subprocess.run(
            ["sh", str(GOV / "install-zcode-hooks.sh"), *extra],
            capture_output=True,
            timeout=60,
            env=env,
            cwd=str(ROOT),
        )
        return completed.returncode, completed.stdout.decode("utf-8", "replace")

    def test_install_reports_drift_then_syncs_and_backs_up(self) -> None:
        config_path = self.home / ".zcode" / "cli" / "config.json"
        config_path.write_text(json.dumps({"mcp": {"servers": {}}}), encoding="utf-8")
        code, output = self.run_installer("-Check")
        self.assertEqual(3, code)
        self.assertTrue(json.loads(output)["drift"])
        code, output = self.run_installer()
        result = json.loads(output)
        self.assertEqual("installed", result["status"])
        self.assertTrue(result["applied"])
        self.assertTrue(result["backup"])
        merged = json.loads(config_path.read_text(encoding="utf-8"))
        declaration = json.loads((GOV / "zcode-hooks-declaration.json").read_text(encoding="utf-8-sig"))
        self.assertEqual(declaration["platforms"]["posix"]["hooks"], merged["hooks"])
        self.assertEqual({}, merged["mcp"]["servers"])
        code, output = self.run_installer("-Check")
        self.assertEqual(0, code)
        self.assertEqual("in-sync", json.loads(output)["status"])

    def test_declared_hooks_enable_the_runner(self) -> None:
        declaration = json.loads((GOV / "zcode-hooks-declaration.json").read_text(encoding="utf-8-sig"))
        hooks = declaration["platforms"]["posix"]["hooks"]
        self.assertTrue(hooks["enabled"])
        for event, entry_name in (("UserPromptSubmit", "zcode-role-bind.py"), ("Stop", "zcode-stop-gate.py")):
            hook = hooks["events"][event][0]["hooks"][0]
            self.assertTrue(hook["enabled"], event)
            self.assertEqual("/bin/sh", hook["command"], event)
            self.assertEqual("-c", hook["args"][0], event)
            self.assertIn(entry_name, hook["args"][1], event)
            self.assertIn("exec python3", hook["args"][1], event)

    def posix_guard_script(self, event: str) -> str:
        declaration = json.loads((GOV / "zcode-hooks-declaration.json").read_text(encoding="utf-8-sig"))
        return declaration["platforms"]["posix"]["hooks"]["events"][event][0]["hooks"][0]["args"][1]

    def run_guard(self, script: str, project_dir: str, payload: bytes = b"{}"):
        env = dict(os.environ)
        env["ZCODE_PROJECT_DIR"] = project_dir
        return subprocess.run(["sh", "-c", script], input=payload, capture_output=True, timeout=30, env=env)

    def test_guard_noops_outside_governed_workspace(self) -> None:
        with tempfile.TemporaryDirectory() as outside:
            for event in ("UserPromptSubmit", "Stop"):
                completed = self.run_guard(self.posix_guard_script(event), outside)
                self.assertEqual(0, completed.returncode, event)
                self.assertEqual(b"", completed.stdout.strip(), event)
                self.assertEqual(b"", completed.stderr.strip(), event)

    def test_guard_walks_up_and_execs_repo_entry(self) -> None:
        with tempfile.TemporaryDirectory() as base:
            root = Path(base)
            governance = root / ".codex" / "governance"
            governance.mkdir(parents=True)
            stub = governance / "zcode-role-bind.py"
            stub.write_text("import sys; sys.stdout.write('STUB-OK')\n", encoding="utf-8")
            nested = root / "nested" / "deep"
            nested.mkdir(parents=True)
            completed = self.run_guard(self.posix_guard_script("UserPromptSubmit"), str(nested))
            self.assertEqual(0, completed.returncode)
            self.assertEqual(b"STUB-OK", completed.stdout.strip())


if __name__ == "__main__":
    unittest.main(verbosity=2)
