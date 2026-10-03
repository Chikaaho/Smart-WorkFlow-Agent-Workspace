#!/usr/bin/env python3
"""ZCode Stop Gate：受治理执行会话的回合结束门禁（POSIX/ZCode 宿主入口）。

与 `stop-gate.ps1`（Windows/ZCode 宿主入口）、`stop-gate.sh`（POSIX/Codex 宿主入口）
同源：终态 schema 只来自 `terminal-contract.json`，裁决只由公共 Validator
（本宿主为 `validate-terminal.sh`）给出；本文件只负责 ZCode 宿主接入、宿主观察核对
和宿主支持的 block 输出投影，不定义任何终态字段或状态。

拒绝提前结束时输出 ZCode Stop hook 支持的 `{decision:"block", reason:...}`，
由宿主把 reason 作为 additional context 自动回注原线程（每回合最多 3 次续行）。

诊断/测试参数（宿主 hook 声明不使用）：--input-json/--input-file/--session-id/
--role-override/--observation-file/--session-db/--config/--runtime-root/--no-audit。
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import zcode_gate_common as common  # noqa: E402

# 低于该占用率时，“上下文已满”只能是无工具证据的自我估计，必须拒绝并回注宿主实测值。
CONTEXT_CLAIM_THRESHOLD_PERCENT = 85.0

CONTEXT_CLAIM_PATTERNS = [
    r"(上下文|context|窗口|window|token)[^。\n]{0,16}(满|极限|上限|耗尽|用完|接近|不足)",
    r"(即将|快要|马上|就要|接近)[^。\n]{0,8}(压缩|截断|compact|compaction)",
    r"context\s*(window\s*)?(is\s*)?(full|exhausted|at\s+the\s+limit)",
    r"running\s+out\s+of\s+context",
]


def write_invocation_receipt(runtime: Path, outcome: str, session: str = "", byte_count: int = 0, detail: str = "") -> None:
    """派发回执（必须是脚本最前期的可执行语句）。

    宿主长时高负载窗口实测存在 Stop hook 进程启动最初期即崩溃的形态（170-309ms、
    无任何脚本痕迹）。回执越靠前，越能区分“spawn/启动早期失败”（无 invoked 回执）
    与“脚本内失败”（有 invoked、后续 outcome 缺失）。写失败不得影响裁决。
    """

    try:
        receipt_path = runtime / "invocations.log"
        receipt_path.parent.mkdir(parents=True, exist_ok=True)
        receipt = {
            "ts": common.utc_now(),
            "event": "Stop",
            "dispatch": outcome,
            "session": session,
            "bytes": byte_count,
        }
        if detail:
            receipt["detail"] = detail[:240]
        with receipt_path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(receipt, ensure_ascii=False, separators=(",", ":")) + "\n")
    except OSError:
        pass


def get_terminal_extraction(message: str, marker_prefix: str):
    # 与 stop-gate.sh / stop-gate.ps1 同义：marker 必须恰好出现一次，且位于正文物理末行。
    lines = [line.rstrip("\r") for line in (message or "").split("\n")]
    if lines and lines[-1] == "":
        lines.pop()
    count = 0
    marker_index = -1
    payload_text = ""
    for index, line in enumerate(lines):
        if line.startswith(marker_prefix):
            count += 1
            marker_index = index
            payload_text = line[len(marker_prefix):]
    if count == 0:
        return {"ok": False, "code": "MARKER_MISSING", "payload": "", "message": "最后回复没有契约终态行"}
    if count > 1:
        return {"ok": False, "code": "MARKER_DUPLICATED", "payload": "", "message": "终态行出现多次；每次结束只允许一条终态行"}
    if marker_index != len(lines) - 1:
        return {"ok": False, "code": "MARKER_NOT_LAST", "payload": "", "message": "终态行不是正文物理末行"}
    return {"ok": True, "code": "", "payload": payload_text.strip(), "message": ""}


def invoke_terminal_validator(validator_path: Path, terminal_json: str):
    try:
        completed = subprocess.run(
            ["sh", str(validator_path)],
            input=terminal_json.encode("utf-8"),
            capture_output=True,
            timeout=30,
        )
        exit_code = completed.returncode
        stderr_text = completed.stderr.decode("utf-8", "replace")
    except (OSError, subprocess.SubprocessError) as exc:
        return {"exit_code": 1, "diagnostics": [f"validator-unavailable: {type(exc).__name__}: {exc}"]}
    diagnostics = [line for line in stderr_text.splitlines() if line.strip()]
    return {"exit_code": exit_code, "diagnostics": diagnostics}


def test_context_exhaustion_claim(text: str) -> bool:
    # 只匹配“自称上下文/窗口已满、即将压缩而收尾”这类无工具证据的说法。
    if not text:
        return False
    for pattern in CONTEXT_CLAIM_PATTERNS:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    return False


def default_context():
    return {"available": False, "error": "context-observation-missing", "tokens": 0, "limit": 0, "percent": -1.0, "model": "", "exceeded": False}


def extract_observation(observation):
    """把读取器输出归一为 {available, error, open, items, context}。"""

    def read_context(raw_observation):
        context = default_context()
        raw = raw_observation.get("context") if isinstance(raw_observation, dict) else None
        if not isinstance(raw, dict):
            return context
        if raw.get("available") is not True:
            context["error"] = raw.get("error") if isinstance(raw.get("error"), str) else ""
            return context
        limit = raw.get("limit") if isinstance(raw.get("limit"), int) else 0
        tokens = raw.get("tokens") if isinstance(raw.get("tokens"), int) else 0
        percent = -1.0
        if limit > 0:
            percent = round(tokens / limit * 100, 1)
        return {
            "available": True,
            "error": "",
            "tokens": tokens,
            "limit": limit,
            "percent": percent,
            "model": raw.get("model") if isinstance(raw.get("model"), str) else "",
            "exceeded": raw.get("context_exceeded") is True,
        }

    todo = observation.get("todo") if isinstance(observation, dict) else None
    if not isinstance(todo, dict):
        return {"available": False, "error": "observation-shape-invalid", "open": -1, "items": [], "context": default_context()}
    if todo.get("available") is not True:
        error = todo.get("error") if isinstance(todo.get("error"), str) else ""
        return {"available": False, "error": error, "open": -1, "items": [], "context": read_context(observation)}
    items = []
    raw_items = todo.get("open_items")
    if isinstance(raw_items, list):
        for item in raw_items:
            if not isinstance(item, dict):
                continue
            items.append(
                {
                    "position": item.get("position") if isinstance(item.get("position"), int) else 0,
                    "status": item.get("status") if isinstance(item.get("status"), str) else "",
                    "content": item.get("content") if isinstance(item.get("content"), str) else "",
                }
            )
    open_count = todo.get("open") if isinstance(todo.get("open"), int) else 0
    return {"available": True, "error": "", "open": open_count, "items": items, "context": read_context(observation)}


def invoke_session_observation(observation_path, session, root: Path, database_path, config_path, runtime: Path):
    if observation_path:
        injected = common.read_state(Path(observation_path))
        if injected is None:
            return {"available": False, "error": "injected-observation-invalid", "open": -1, "items": [], "context": default_context()}
        return extract_observation(injected)
    if not session:
        return {"available": False, "error": "session-id-missing", "open": -1, "items": [], "context": default_context()}

    python = common.resolve_observation_reader(runtime)
    if not python:
        return {"available": False, "error": "observation-reader-unavailable", "open": -1, "items": [], "context": default_context()}

    reader = root / ".codex" / "governance" / "session-observation.py"
    if not reader.is_file():
        return {"available": False, "error": "observation-reader-missing", "open": -1, "items": [], "context": default_context()}

    parsed = common.run_observation_reader(python, reader, session, db_path=database_path, config_path=config_path)
    if parsed is None:
        return {"available": False, "error": "observation-reader-failed", "open": -1, "items": [], "context": default_context()}
    return extract_observation(parsed)


def new_reason_text(diagnostic: str, next_action: str, escalation: int = 0) -> str:
    escalation_text = ""
    if escalation == 1:
        escalation_text = " 同一无进展状态重复出现：本轮只做一个最小原子动作，完成后重新核对剩余项。"
    elif escalation == 2:
        escalation_text = " 同一无进展状态再次重复：切换到另一条可行路径，不要重复上一次动作。"
    elif escalation >= 3:
        escalation_text = " 同一无进展状态已多次重复：停止重复动作，重新规划剩余路径并说明新路径。"
    return f"执行会话不能结束：{diagnostic}。下一步动作：{next_action}{escalation_text}"


def main() -> int:
    parser = argparse.ArgumentParser(description="ZCode stop gate (POSIX host entry)")
    parser.add_argument("--input-json", default="")
    parser.add_argument("--input-file", default="")
    parser.add_argument("--engine-root", default="")
    parser.add_argument("--runtime-root", default="")
    parser.add_argument("--session-id", default="")
    parser.add_argument("--role-override", default="")
    parser.add_argument("--observation-file", default="")
    parser.add_argument("--session-db", default="")
    parser.add_argument("--config", default="")
    parser.add_argument("--no-audit", action="store_true")
    args = parser.parse_args()

    script_root = Path(__file__).resolve().parent
    default_runtime = script_root / "runtime" / "zcode"
    runtime = Path(args.runtime_root) if args.runtime_root else default_runtime

    # —— 派发回执：任何其他逻辑之前 ——
    write_invocation_receipt(runtime, "invoked")

    audit_path = runtime / "audit.jsonl"
    session_key_value = "unknown-session"
    session_id = args.session_id
    tool_call_count = 0
    continuation = False

    def fail_closed_stderr(text: str) -> None:
        sys.stderr.write(text + "\n")

    # 载荷读取必须在受保护主体之外自行兜底：stdin 管道异常（宿主写入中断/管道损坏）会
    # 从这里抛出。按宪法“入口缺少裁决所需能力时必须 fail closed”，读取失败时以可裁决
    # 的 block 收场并留痕。
    try:
        payload_text = common.read_payload_text(args.input_json, args.input_file)
    except (OSError, ValueError) as exc:
        detail = f"{type(exc).__name__}: {exc}"
        write_invocation_receipt(runtime, "payload-read-error", detail=detail)
        fail_closed_stderr(
            f"执行会话不能结束：停止门禁无法读取宿主载荷（{detail}），按 fail-closed 拦截。"
            "下一步动作：继续执行授权内工作项并按 .codex/governance/terminal-contract.json 输出终态行；把该记录交给管理员。"
        )
        sys.stdout.write(
            json.dumps(
                {
                    "decision": "block",
                    "reason": "执行会话不能结束：停止门禁无法读取宿主载荷（"
                    + detail
                    + "），fail-closed 拦截。下一步动作：继续执行授权内工作项，并在正文最后一行输出唯一合法终态行。",
                },
                ensure_ascii=False,
                separators=(",", ":"),
            )
            + "\n"
        )
        return 0

    receipt_payload = common.parse_json(payload_text)
    receipt_session = receipt_payload.get("session_id") if isinstance(receipt_payload, dict) and isinstance(receipt_payload.get("session_id"), str) else ""
    write_invocation_receipt(runtime, "payload-read", session=receipt_session, byte_count=len(payload_text.encode("utf-8")))
    if not payload_text.strip():
        return 0
    payload = common.parse_json(payload_text)
    if not isinstance(payload, dict):
        fail_closed_stderr("执行会话不能结束：Stop hook 载荷不是合法 JSON，门禁无法裁决。")
        return 2

    message = payload.get("last_assistant_message") if isinstance(payload.get("last_assistant_message"), str) else ""
    hook_session_id = payload.get("session_id") if isinstance(payload.get("session_id"), str) else ""
    if not session_id:
        session_id = hook_session_id
    tool_call_count = payload.get("toolCallCount") if isinstance(payload.get("toolCallCount"), int) else 0
    stop_hook_active = payload.get("stop_hook_active")
    continuation = isinstance(stop_hook_active, bool) and stop_hook_active

    cwd = payload.get("cwd") if isinstance(payload.get("cwd"), str) else ""
    root = common.resolve_engine_root(args.engine_root, cwd, str(script_root))
    if not root:
        return 0
    root_path = Path(root)
    runtime = common.runtime_root(root, args.runtime_root)
    audit_path = runtime / "audit.jsonl"
    sessions_dir = runtime / "sessions"
    session_key_value = common.session_key(session_id)

    def write_audit(record: dict) -> None:
        if not args.no_audit:
            common.write_audit(audit_path, record)

    try:
        # 角色绑定：未声明执行角色的会话不启用执行门禁（system.md §0.2）。
        role = args.role_override
        if not role:
            role = os.environ.get("AGENT_CODING_ENGINE_ACTIVE_ROLE", "")
        if not role:
            role_file = sessions_dir / f"{session_key_value}.role.json"
            role_state = common.read_state(role_file)
            if isinstance(role_state, dict) and isinstance(role_state.get("role"), str):
                role = role_state["role"]
        if role != "executor":
            return 0

        observation = invoke_session_observation(
            args.observation_file, session_id, root_path, args.session_db, args.config, runtime
        )
        observation_error = ""
        todo_open = -1
        if observation["available"]:
            todo_open = observation["open"]
        else:
            observation_error = str(observation["error"])
        context = observation["context"]
        context_percent = -1.0
        context_exceeded = False
        if context["available"]:
            context_percent = float(context["percent"])
            context_exceeded = bool(context["exceeded"])

        # 门禁适用范围：本回合有真实工具动作、自定清单仍有未完成项，或模型以上下文为由收尾
        # （第三条即便没有任何工具动作也必须裁决——压缩是宿主职责，不是停止理由）。
        context_claim = test_context_exhaustion_claim(message)
        gated = tool_call_count >= 1 or (observation["available"] and observation["open"] > 0) or context_claim

        def write_gate_decision(
            decision,
            reason_code,
            terminal_state="",
            diagnostic="",
            next_action="",
            escalation=0,
            gated_flag=1,
        ):
            write_audit(
                {
                    "ts": common.utc_now(),
                    "event": "Stop",
                    "session": session_key_value,
                    "role": "executor",
                    "gated": gated_flag,
                    "decision": decision,
                    "reason_code": reason_code,
                    "terminal_state": terminal_state,
                    "tool_call_count": tool_call_count,
                    "continuation": continuation,
                    "todo_open": todo_open,
                    "observation": observation_error,
                    "context_percent": context_percent,
                    "context_exceeded": context_exceeded,
                    "escalation": escalation,
                }
            )
            if decision == "block":
                output = {"decision": "block", "reason": new_reason_text(diagnostic, next_action, escalation)}
                sys.stdout.write(json.dumps(output, ensure_ascii=False, separators=(",", ":")) + "\n")

        if not gated:
            write_gate_decision("pass", "NO_EXECUTION_ACTIVITY", gated_flag=0)
            return 0

        contract_path = root_path / ".codex" / "governance" / "terminal-contract.json"
        contract = common.parse_json(contract_path.read_text(encoding="utf-8-sig"))
        marker = contract.get("marker") if isinstance(contract, dict) and isinstance(contract.get("marker"), str) else ""
        if not marker:
            marker = "ENGINE_TERMINAL"
        marker_prefix = f"{marker} "

        extraction = get_terminal_extraction(message, marker_prefix)
        terminal_state = ""
        reason_code = ""

        # 一次回注里给全所有证据：模型在同一轮就能看到缺失的契约、未收敛的清单和
        # 宿主实测的上下文占用，不必靠多次续行逐条试错。
        findings = []
        actions = []
        contract_accepted = False

        if not extraction["ok"]:
            if not reason_code:
                reason_code = extraction["code"]
            findings.append(extraction["message"])
            actions.append(
                f"在正文最后一行输出唯一一条以 {marker_prefix}开头的终态行；"
                "schema、状态与字段组合以 .codex/governance/terminal-contract.json 为准。"
            )
        else:
            terminal_payload = common.parse_json(extraction["payload"])
            if terminal_payload is None:
                if not reason_code:
                    reason_code = "MARKER_INVALID_JSON"
                findings.append("终态行不是合法 JSON")
                actions.append("只修正终态行的 JSON 语法后重新提交，不重跑已完成的工作。")
            else:
                terminal_state = terminal_payload.get("state") if isinstance(terminal_payload.get("state"), str) else ""
                validator_path = root_path / ".codex" / "governance" / "validate-terminal.sh"
                validation = invoke_terminal_validator(validator_path, extraction["payload"])
                if validation["exit_code"] != 0:
                    if not reason_code:
                        reason_code = "CONTRACT_REJECTED"
                    findings.append("终态契约未通过公共 Validator：" + "；".join(validation["diagnostics"]))
                    actions.append("按诊断逐项修正终态字段后重新提交；仍有授权内可执行项时先完成动作，不得提前结束。")
                else:
                    contract_accepted = True

        # 上下文声明放在契约之后判定：只有被 Validator 接受、且携带真实工具证据的 BLOCKED
        # 才是合法终止，此时不再追加“上下文不是停止依据”。其余情况下把该声明作为首要证据前置。
        if context_claim and not (contract_accepted and terminal_state == "BLOCKED"):
            if context["available"]:
                if context_percent < CONTEXT_CLAIM_THRESHOLD_PERCENT:
                    measured = (
                        f"宿主实测最近一次模型请求输入 {context['tokens']} / 上限 {context['limit']} tokens"
                        f"（{context_percent}%），未接近上限"
                    )
                else:
                    measured = (
                        f"宿主实测最近一次模型请求输入 {context['tokens']} / 上限 {context['limit']} tokens"
                        f"（{context_percent}%）"
                    )
                    if context_exceeded:
                        measured = f"{measured}；宿主的超限处理是按自动压缩并重试请求完成的"
            else:
                measured = "宿主未提供上下文实测值"
            findings.insert(
                0,
                f"本回合以「上下文/窗口已满」为由收尾，但 {measured}，上下文压缩由宿主自动完成，该理由不构成停止依据",
            )
            actions.insert(0, "继续执行清单中的原子项；接近上限时宿主会自动压缩，不需要主动收尾，直到全部完成或出现真实外部阻塞。")
            if not reason_code:
                reason_code = "CONTEXT_CLAIM_UNSUPPORTED"

        if observation["available"] and observation["open"] > 0:
            first_open = observation["items"][0] if observation["items"] else None
            first_open_text = ""
            if first_open:
                first_open_text = f"（{first_open['status']}：{first_open['content']}）"
            if not reason_code:
                reason_code = "TODO_OPEN_ON_TERMINATION"
            findings.append(f"会话自定任务清单仍有 {observation['open']} 项未完成{first_open_text}")
            actions.append("先完成清单项并执行验证；不再属于本次授权的项要按授权重写清单移出。清单收敛到无未完成项后再提交终态。")

        diagnostic = "；".join(findings)
        next_action = " ".join(actions)
        state_path = sessions_dir / f"{session_key_value}.state.json"

        if reason_code:
            previous_state = common.read_state(state_path) or {}
            previous_code = previous_state.get("last_reason_code") if isinstance(previous_state.get("last_reason_code"), str) else ""
            previous_tool_calls = previous_state.get("last_tool_call_count") if isinstance(previous_state.get("last_tool_call_count"), int) else 0
            previous_blocks = previous_state.get("consecutive_blocks") if isinstance(previous_state.get("consecutive_blocks"), int) else 0
            # 重复同一无进展状态：依次要求最小原子动作、切换路径、重新规划。
            escalation = 0
            if reason_code == previous_code and tool_call_count <= previous_tool_calls:
                escalation = min(previous_blocks, 3)
            write_gate_decision(
                "block",
                reason_code,
                terminal_state=terminal_state,
                diagnostic=diagnostic,
                next_action=next_action,
                escalation=escalation,
            )
            common.write_state(
                state_path,
                {
                    "schema": "agent-coding-engine.zcode-stop-state.v1",
                    "updated_at": common.utc_now(),
                    "consecutive_blocks": previous_blocks + 1,
                    "last_reason_code": reason_code,
                    "last_tool_call_count": tool_call_count,
                    "last_terminal_state": terminal_state,
                },
            )
            return 0

        write_gate_decision("pass", "TERMINAL_ACCEPTED", terminal_state=terminal_state)
        common.write_state(
            state_path,
            {
                "schema": "agent-coding-engine.zcode-stop-state.v1",
                "updated_at": common.utc_now(),
                "consecutive_blocks": 0,
                "last_reason_code": "",
                "last_tool_call_count": tool_call_count,
                "last_terminal_state": terminal_state,
            },
        )
        return 0
    except Exception as exc:
        # 门禁自身故障不得静默放行：任何未捕获异常都以宿主可识别的 block 形式暴露，
        # 并写入审计（decision=error），而不是让宿主按“hook 失败”直接结束回合。
        detail = f"{type(exc).__name__}: {exc}"
        write_audit(
            {
                "ts": common.utc_now(),
                "event": "Stop",
                "session": session_key_value,
                "role": "executor",
                "decision": "error",
                "reason_code": "GATE_INTERNAL_ERROR",
                "tool_call_count": tool_call_count,
                "detail": detail[:300],
            }
        )
        fail_closed_stderr(
            f"执行会话不能结束：停止门禁执行异常，无法裁决（{detail}）。"
            "下一步动作：继续执行授权内工作项；若该异常重复出现，运行 .codex/governance/hook-selfcheck.sh（POSIX）"
            "或 hook-selfcheck.ps1（Windows）并把诊断交给管理员。"
        )
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
