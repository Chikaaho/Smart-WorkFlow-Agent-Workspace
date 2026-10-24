#!/usr/bin/env python3
"""ZCode 宿主门禁公共入口辅助（无终态规则，POSIX/ZCode 宿主入口）。

与 `zcode-gate-common.ps1`（Windows/ZCode）同构：只承载宿主接入所需的纯机械操作——
读取 hook 载荷、定位 engine root、生成会话文件键、审计与状态读写、观察读取器解析。
任何终态判定规则都不得写在这里；终态 schema 只来自
`.codex/governance/terminal-contract.json`，裁决只来自公共 Validator。
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import select
import subprocess
import sys
import time
from pathlib import Path

PAYLOAD_READ_TIMEOUT_SECONDS = 15.0


def utc_now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def read_payload_text(inline_json: str = "", from_file: str = "") -> str:
    """读取宿主 hook 载荷。

    宿主以 argv 模式启动 hook 并把载荷写入 stdin；读取设上限，避免手工运行或
    上游不关闭管道时把回合卡到宿主超时（超时会被宿主判为 hook 失败）。
    """

    if from_file:
        return Path(from_file).read_text(encoding="utf-8")
    if inline_json:
        return inline_json
    try:
        if sys.stdin is None or sys.stdin.isatty():
            return ""
        ready, _, _ = select.select([sys.stdin], [], [], PAYLOAD_READ_TIMEOUT_SECONDS)
        if not ready:
            return ""
        data = sys.stdin.buffer.read()
    except (OSError, ValueError):
        raise
    return data.decode("utf-8", "replace")


def parse_json(text: str):
    if not text or not text.strip():
        return None
    try:
        return json.loads(text)
    except (TypeError, ValueError):
        return None


def canonical_json(value) -> str:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"))


def resolve_engine_root(explicit: str = "", payload_cwd: str = "", script_root: str = "") -> str:
    candidates = [
        explicit,
        os.environ.get("ZCODE_PROJECT_DIR", ""),
        os.environ.get("CLAUDE_PROJECT_DIR", ""),
        payload_cwd,
        os.getcwd(),
        script_root,
    ]
    for candidate in candidates:
        if not candidate:
            continue
        current = Path(candidate)
        try:
            current = current.resolve()
        except OSError:
            continue
        for _ in range(16):
            if (current / ".codex" / "governance" / "terminal-contract.json").is_file():
                return str(current)
            parent = current.parent
            if parent == current:
                break
            current = parent
    return ""


def runtime_root(engine_root: str, override: str = "") -> Path:
    if override:
        return Path(override)
    return Path(engine_root) / ".codex" / "governance" / "runtime" / "zcode"


def session_key(session_id: str) -> str:
    if not session_id:
        return "unknown-session"
    return re.sub(r'[\\/:*?"<>|]', "_", session_id)


def write_state(path: Path, state: dict) -> None:
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        temporary = path.with_name(path.name + ".tmp")
        temporary.write_text(json.dumps(state, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
        temporary.replace(path)
    except OSError:
        # 状态写入失败不得改变门禁裁决。
        pass


def read_state(path: Path):
    try:
        return json.loads(Path(path).read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None


def write_audit(path, record: dict) -> None:
    if not path:
        return
    try:
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        with path.open("a", encoding="utf-8") as handle:
            handle.write(json.dumps(record, ensure_ascii=False, separators=(",", ":")) + "\n")
    except OSError:
        # 审计写入失败不得改变门禁裁决。
        pass


def session_id_digest(session_id: str) -> str:
    return hashlib.sha256(session_id.encode("utf-8")).hexdigest()[:16]


def resolve_observation_reader(runtime: Path) -> str:
    """观察读取器只用于宿主观察；缓存命中即跳过探测，失败返回空串由调用方降级。"""

    cached = read_state(runtime / "reader.json")
    if isinstance(cached, dict):
        candidate = cached.get("python", "")
        if isinstance(candidate, str) and candidate and Path(candidate).is_file():
            return candidate
    candidates = []
    env_python = os.environ.get("AGENT_CODING_ENGINE_PYTHON", "")
    if env_python:
        candidates.append(env_python)
    if sys.executable:
        candidates.append(sys.executable)
    candidates.extend(["/opt/homebrew/bin/python3", "/usr/local/bin/python3", "/usr/bin/python3"])
    for candidate in candidates:
        if not candidate or not Path(candidate).is_file():
            continue
        try:
            completed = subprocess.run(
                [candidate, "-c", "import sqlite3"], capture_output=True, timeout=20
            )
        except (OSError, subprocess.SubprocessError):
            continue
        if completed.returncode == 0:
            write_state(
                runtime / "reader.json",
                {
                    "schema": "agent-coding-engine.zcode-observer-reader.v1",
                    "python": candidate,
                    "verified_at": utc_now(),
                },
            )
            return candidate
    return ""


def run_observation_reader(
    python: str,
    reader_path: Path,
    session_id: str,
    db_path: str = "",
    config_path: str = "",
    timeout: float = 30.0,
):
    arguments = [python, str(reader_path), "--session-id", session_id]
    if db_path:
        arguments += ["--db", db_path]
    if config_path:
        arguments += ["--config", config_path]
    try:
        completed = subprocess.run(arguments, capture_output=True, timeout=timeout)
    except (OSError, subprocess.SubprocessError):
        return None
    return parse_json(completed.stdout.decode("utf-8", "replace"))
