#!/usr/bin/env python3
"""ZCode UserPromptSubmit 入口：会话角色绑定（POSIX/ZCode 宿主）。

与 `session-role.ps1`（Windows/ZCode）同源同责：system.md §0.2 要求会话角色只能由
用户显式声明，不得从任务内容、目录或历史猜测。本入口只做一件事：把用户提示词里的
显式角色声明归一化为会话角色记录，供 Stop Gate 判定该会话是否属于受治理的
Executor 执行会话。

本文件不包含任何终态规则；输出只注入一行门禁状态（角色、是否上膛、上次拦截、
清单与上下文实测），供 Owner 与模型确认门禁是否在运行。角色写入失败不阻断提示词，
但会写审计。
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import zcode_gate_common as common  # noqa: E402

# 角色声明的锚定模式：必须出现显式声明结构，避免把任务描述里的角色名词当作声明。
ROLE_PATTERNS = [
    ("declarative_role_field", r"(?:角色|身份)\s*(?:是|为|＝|=|：|:)\s*(?P<role>规划|执行|管理员)"),
    ("declarative_subject", r"(?:你|本会话|当前会话|本任务|本次|这次)\s*(?:现在)?\s*(?:是|为|＝|=)\s*(?P<role>规划|执行|管理员)"),
    ("declarative_as", r"作为\s*(?P<role>规划|执行|管理员)"),
    ("declarative_in_role", r"以\s*(?P<role>规划|执行|管理员)\s*(?:的)?\s*(?:身份|角色)"),
]

ROLE_ALIASES = {"规划": "planner", "执行": "executor", "管理员": "admin"}


def get_declared_role(prompt: str):
    found = []
    for _, pattern in ROLE_PATTERNS:
        for match in re.finditer(pattern, prompt):
            role = match.group("role")
            if role and role not in found:
                found.append(role)
    roles = {ROLE_ALIASES[role] for role in found}
    if "授权执行" in prompt:
        roles.add("executor")
    if not roles:
        return {"role": "", "reason": "none"}
    if len(roles) > 1:
        return {"role": "", "reason": "ambiguous"}
    return {"role": next(iter(roles)), "reason": "declared"}


def declared_platform_hooks(document):
    if sys.platform == "win32":
        return document.get("hooks")
    platforms = document.get("platforms")
    if isinstance(platforms, dict):
        posix = platforms.get("posix")
        if isinstance(posix, dict):
            return posix.get("hooks")
    return document.get("hooks")


def armed_note(engine_root: Path) -> str:
    declaration_path = engine_root / ".codex" / "governance" / "zcode-hooks-declaration.json"
    user_config_path = Path.home() / ".zcode" / "cli" / "config.json"
    if not declaration_path.is_file():
        return "未上膛（仓库声明缺失）"
    if not user_config_path.is_file():
        return "未上膛（机器级声明缺失，运行 install-zcode-hooks.sh）"
    declaration = common.parse_json(declaration_path.read_text(encoding="utf-8-sig"))
    installed = common.parse_json(user_config_path.read_text(encoding="utf-8"))
    declared_hooks = declared_platform_hooks(declaration) if isinstance(declaration, dict) else None
    installed_hooks = installed.get("hooks") if isinstance(installed, dict) else None
    if declared_hooks is None or installed_hooks is None:
        return "未上膛（机器级声明缺失，运行 install-zcode-hooks.sh）"
    if common.canonical_json(declared_hooks) != common.canonical_json(installed_hooks):
        return "未上膛（声明漂移，运行 install-zcode-hooks.sh 修复）"
    return "已上膛"


def main() -> int:
    parser = argparse.ArgumentParser(description="ZCode session role bind (POSIX host entry)")
    parser.add_argument("--input-json", default="")
    parser.add_argument("--input-file", default="")
    parser.add_argument("--engine-root", default="")
    parser.add_argument("--runtime-root", default="")
    parser.add_argument("--first-prompt-text", default="")
    parser.add_argument("--no-audit", action="store_true")
    args = parser.parse_args()

    script_root = Path(__file__).resolve().parent
    # 角色绑定是提示词时点的尽力而为：stdin 管道异常不得阻断用户提示词，直接降级退出。
    try:
        payload_text = common.read_payload_text(args.input_json, args.input_file)
    except (OSError, ValueError):
        return 0
    payload = common.parse_json(payload_text)
    if not isinstance(payload, dict):
        return 0

    prompt = payload.get("prompt") if isinstance(payload.get("prompt"), str) else ""
    session_id = payload.get("session_id") if isinstance(payload.get("session_id"), str) else ""
    if not prompt or not session_id:
        return 0

    cwd = payload.get("cwd") if isinstance(payload.get("cwd"), str) else ""
    root = common.resolve_engine_root(args.engine_root, cwd, str(script_root))
    if not root:
        return 0
    root_path = Path(root)

    runtime = common.runtime_root(root, args.runtime_root)
    sessions_dir = runtime / "sessions"
    role_path = sessions_dir / f"{common.session_key(session_id)}.role.json"
    audit_path = runtime / "audit.jsonl"

    try:
        existing = common.read_state(role_path)
        declaration = get_declared_role(prompt)
        action = "unchanged"
        role = ""
        role_source = "user_prompt_submit"
        if declaration["reason"] == "declared":
            role = declaration["role"]
        elif existing is None:
            # 回填：hook 尚未生效（或首次派发失败）的历史会话，其角色声明只存在于宿主保存的首个提示词里。
            # 只读宿主记录、只在角色未绑定时执行，且仍然要求显式声明结构。
            first_prompt = args.first_prompt_text
            if not first_prompt:
                reader_path = script_root / "session-observation.py"
                python = common.resolve_observation_reader(runtime)
                if python and reader_path.is_file():
                    observation = common.run_observation_reader(python, reader_path, session_id)
                    if isinstance(observation, dict) and isinstance(observation.get("first_prompt"), str):
                        first_prompt = observation["first_prompt"]
            if first_prompt:
                backfill = get_declared_role(first_prompt)
                if backfill["reason"] == "declared":
                    role = backfill["role"]
                    role_source = "host_first_prompt"
                    action = "backfilled"
                elif backfill["reason"] == "ambiguous":
                    action = "ambiguous"
        elif declaration["reason"] == "ambiguous":
            action = "ambiguous"

        if role:
            common.write_state(
                role_path,
                {
                    "schema": "agent-coding-engine.zcode-session-role.v1",
                    "session_id_digest": common.session_id_digest(session_id),
                    "role": role,
                    "source": role_source,
                    "declared_at": common.utc_now(),
                },
            )
            if action == "unchanged":
                action = "confirmed" if isinstance(existing, dict) and existing.get("role") == role else "bound"

        if not args.no_audit:
            common.write_audit(
                audit_path,
                {
                    "ts": common.utc_now(),
                    "event": "UserPromptSubmit",
                    "session": common.session_key(session_id),
                    "role": role,
                    "action": action,
                    "engine_root": root,
                },
            )
    except Exception as exc:  # 绑定失败不得阻断用户提示词，但必须留下可见记录。
        if not args.no_audit:
            common.write_audit(
                audit_path,
                {
                    "ts": common.utc_now(),
                    "event": "UserPromptSubmit",
                    "session": common.session_key(session_id),
                    "action": "error",
                    "reason_code": "ROLE_BIND_INTERNAL_ERROR",
                    "detail": f"{type(exc).__name__}: {exc}"[:300],
                },
            )
        return 0

    # 把门禁状态注入对话：Owner 与模型都能看到门禁是否上膛、清单还剩多少、上次拦截原因，
    # 不必靠猜或事后翻日志。状态行只报事实，不做裁决。
    effective_role = role
    role_origin = ""
    if not effective_role:
        stored = common.read_state(role_path) or {}
        effective_role = stored.get("role") if isinstance(stored.get("role"), str) else ""
        if isinstance(stored, dict) and stored.get("source") == "host_first_prompt":
            role_origin = "（首个提示词回填）"

    status_parts = []
    if not effective_role:
        status_parts.append("会话角色=未声明（执行门禁不启用）")
    else:
        status_parts.append(f"会话角色={effective_role}{role_origin}")

    status_parts.append(f"门禁={armed_note(root_path)}")

    session_state = common.read_state(sessions_dir / f"{common.session_key(session_id)}.state.json") or {}
    last_reason = session_state.get("last_reason_code") if isinstance(session_state.get("last_reason_code"), str) else ""
    last_blocks = session_state.get("consecutive_blocks") if isinstance(session_state.get("consecutive_blocks"), int) else 0
    if last_reason:
        status_parts.append(f"上次拦截={last_reason}（连续 {last_blocks} 次）")
    else:
        status_parts.append("上次拦截=无")

    previous_turn_ungated = False
    reader_path = root_path / ".codex" / "governance" / "session-observation.py"
    python = common.resolve_observation_reader(runtime)
    if python and reader_path.is_file():
        observation = common.run_observation_reader(python, reader_path, session_id)
        if isinstance(observation, dict):
            todo = observation.get("todo")
            if isinstance(todo, dict) and todo.get("available") is True:
                status_parts.append(f"自定清单未完成={todo.get('open', 0)} 项")
            context = observation.get("context")
            if isinstance(context, dict) and context.get("available") is True:
                status_parts.append(
                    f"上下文={context.get('tokens', 0)}/{context.get('limit', 0)}（{context.get('percent')}%）"
                )
            # 上回合收尾检测：宿主对 Stop hook 的派发实测可能静默缺失（门禁零裁决也不留失败日志），
            # 因此在提示词时点独立核查“上一回合是否以合法终态行结束”。上一回合带正文且无终态行时，
            # 状态行直接标注未过门禁，并向模型注入纠偏要求；同时写审计以度量宿主派发缺失频率。
            if effective_role == "executor":
                last_assistant = observation.get("last_assistant")
                if isinstance(last_assistant, dict) and last_assistant.get("available") is True:
                    if last_assistant.get("text_chars", 0) > 0:
                        if last_assistant.get("has_marker") is True:
                            status_parts.append("上回合=已带终态")
                        else:
                            previous_turn_ungated = True
                            status_parts.append("上回合=未过门禁（无终态契约收尾）")

    if (runtime / "entry-failures.log").is_file():
        status_parts.append("入口失败台账=有记录")

    if previous_turn_ungated:
        if not args.no_audit:
            common.write_audit(
                audit_path,
                {
                    "ts": common.utc_now(),
                    "event": "UserPromptSubmit",
                    "session": common.session_key(session_id),
                    "role": effective_role,
                    "action": "previous_turn_ungated",
                    "reason_code": "STOP_DISPATCH_MISSED",
                    "engine_root": root,
                },
            )
        correction = (
            "纠偏要求：上回合以无契约收尾且未被 Stop 门禁拦截（宿主派发缺失），宿主漏放不等于终态被接受；"
            "本回合不得默认接受上回合的中途汇报，先核对其声明的剩余工作项并继续执行，"
            "完成本轮实际工作后再按 .codex/governance/terminal-contract.json 输出唯一合法终态行。"
        )
        additional = "【执行门禁】" + " | ".join(status_parts) + "。" + correction
    else:
        additional = (
            "【执行门禁】" + " | ".join(status_parts) + "。"
            "门禁只拒绝无终态契约的收尾与无证据的上下文收尾理由；上下文压缩由宿主自动完成。"
        )

    output = {
        "hookSpecificOutput": {
            "hookEventName": "UserPromptSubmit",
            "additionalContext": additional,
        }
    }
    sys.stdout.write(json.dumps(output, ensure_ascii=False, separators=(",", ":")) + "\n")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except SystemExit:
        raise
    except Exception:  # 入口自身的任何意外都不得阻断用户提示词。
        raise SystemExit(0)
