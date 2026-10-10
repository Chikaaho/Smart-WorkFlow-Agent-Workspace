#!/usr/bin/env python3
"""宿主外执行会话检查：有限扫描与限制台账。

已知停滞只返回观察结果；不启动脱离宿主的续行进程。
自动续行需由现有 Host Adapter 对接公共 Supervisor，以稳定身份、
可观测进展与受控生命周期投递；能力不足时 fail closed 并记录限制。
不停止用户既有服务。
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import os
import sqlite3
import sys
import time
from pathlib import Path

GOVERNANCE_DIR = Path(__file__).resolve().parent
WORKSPACE_DIR = GOVERNANCE_DIR.parent.parent
RUNTIME_DIR = GOVERNANCE_DIR / "runtime" / "zcode"
SESSIONS_DIR = RUNTIME_DIR / "sessions"
LEDGER_PATH = RUNTIME_DIR / "supervisor.jsonl"
LOCK_PATH = RUNTIME_DIR / "supervisor.lock"

IDLE_SECONDS = int(os.environ.get("WATCHDOG_IDLE_SECONDS", "480"))   # 静默 8 分钟认定回合已结束
ACTION_WINDOW_SECONDS = 90 * 60        # 只自动恢复 90 分钟内的停滞：更旧的会话视为已交接/归档
LOOKBACK_SECONDS = 12 * 3600           # 台账与统计的观察窗
INJECT_COOLDOWN_SECONDS = 30 * 60      # 同会话两次纠偏的最小间隔
MAX_INJECTIONS_PER_SESSION = 6         # 行动窗口内最多纠偏次数，超限交还管理员


def load_observation_module():
    spec = importlib.util.spec_from_file_location(
        "session_observation", GOVERNANCE_DIR / "session-observation.py"
    )
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def default_db_path() -> Path:
    configured = os.environ.get("ZCODE_SESSION_DB")
    if configured:
        return Path(configured)
    storage = os.environ.get("ZCODE_STORAGE_DIR")
    base = Path(storage) if storage else Path.home() / ".zcode"
    return base / "cli" / "db" / "db.sqlite"


def read_executor_sessions() -> list[str]:
    if not SESSIONS_DIR.is_dir():
        return []
    sessions = []
    for path in sorted(SESSIONS_DIR.glob("*.role.json")):
        try:
            record = json.loads(path.read_text(encoding="utf-8-sig"))
        except (OSError, ValueError):
            continue
        if record.get("role") == "executor":
            sessions.append(path.name[: -len(".role.json")])
    return sessions


def append_ledger(record: dict) -> None:
    LEDGER_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LEDGER_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, ensure_ascii=False) + "\n")


def read_ledger() -> list[dict]:
    if not LEDGER_PATH.is_file():
        return []
    records = []
    for line in LEDGER_PATH.read_text(encoding="utf-8").splitlines():
        try:
            records.append(json.loads(line))
        except ValueError:
            continue
    return records


def spawn_headless_resume(session: str, cwd: str) -> tuple[bool, str]:
    """Compatibility entry: refuse uncontrolled launch without creating a process."""
    return False, 'execution-lifecycle-rejected: controlled Host Adapter/Supervisor delivery required; no detached resume launched'


def acquire_lock() -> bool:
    LOCK_PATH.parent.mkdir(parents=True, exist_ok=True)
    try:
        fd = os.open(LOCK_PATH, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    except FileExistsError:
        return False
    with os.fdopen(fd, 'w') as handle:
        handle.write(str(os.getpid()))
    return True


def release_lock() -> None:
    try:
        LOCK_PATH.unlink(missing_ok=True)
    except OSError:
        pass


def run(dry_run: bool, db_path: Path | None = None, idle_seconds: int | None = None) -> int:
    idle = idle_seconds if idle_seconds is not None else IDLE_SECONDS
    if not acquire_lock():
        print(json.dumps({"status": "skipped-locked"}, ensure_ascii=False))
        return 0
    try:
        observation = load_observation_module()
        marker = observation.read_marker()
        db = db_path or default_db_path()
        if not db.is_file():
            print(json.dumps({"status": "db-missing", "db": str(db)}, ensure_ascii=False))
            return 0
        connection = sqlite3.connect(f"file:{db.as_posix()}?mode=ro", uri=True, timeout=10)
        connection.execute("pragma busy_timeout = 5000")
        now_ms = int(time.time() * 1000)
        now_s = time.time()
        ledger = read_ledger()
        handled = {r["key"] for r in ledger if r.get("action") == "inject" and r.get("key")}
        inject_times: dict = {}
        inject_counts: dict = {}
        for r in ledger:
            if r.get("action") in ("inject", "inject-failed") and r.get("session"):
                ts = float(r.get("epoch") or 0)
                if now_s - ts < INJECT_COOLDOWN_SECONDS:
                    inject_times[r["session"]] = max(inject_times.get(r["session"], 0.0), ts)
                if now_s - ts < ACTION_WINDOW_SECONDS:
                    inject_counts[r["session"]] = inject_counts.get(r["session"], 0) + 1
        results = []
        for session in read_executor_sessions():
            try:
                last = observation.read_last_assistant_message(connection, session, marker)
            except sqlite3.Error as exc:
                results.append({"session": session[:24], "status": f"query-failed: {exc}"})
                continue
            if not last.get("available"):
                results.append({"session": session[:24], "status": "no-assistant-text"})
                continue
            key = f"{session}:{last['message_id']}"
            age_ms = now_ms - int(last["time_created"])
            entry = {
                "session": session[:24],
                "message_id": last["message_id"][:40],
                "has_marker": last["has_marker"],
                "age_minutes": round(age_ms / 60000, 1),
            }
            if last["has_marker"]:
                entry["status"] = "terminal-marker-unverified"
                entry["detail"] = "marker alone is not shared Validator or lifecycle acceptance"
                results.append(entry)
                continue
            if key in handled:
                entry["status"] = "already-handled"
                results.append(entry)
                continue
            if age_ms > ACTION_WINDOW_SECONDS * 1000:
                entry["status"] = "stale-beyond-action-window"
                results.append(entry)
                continue
            row = connection.execute(
                "select directory from session where id = ?", (session,)
            ).fetchone()
            session_dir = (row[0] if row and row[0] else str(WORKSPACE_DIR))
            last_activity = connection.execute(
                "select max(time_updated) from message where session_id = ?", (session,)
            ).fetchone()[0]
            if last_activity and now_ms - int(last_activity) < idle * 1000:
                entry["status"] = "session-active-waiting-idle"
                results.append(entry)
                continue
            if now_s - inject_times.get(session, 0.0) < INJECT_COOLDOWN_SECONDS:
                entry["status"] = "cooldown"
                results.append(entry)
                continue
            if inject_counts.get(session, 0) >= MAX_INJECTIONS_PER_SESSION:
                entry["status"] = "escalation-exhausted"
                results.append(entry)
                continue
            entry["status"] = "controlled-delivery-unavailable"
            if dry_run:
                entry["status"] = "would-report-delivery-limit"
                append_ledger({"ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "action": "dry-run", "key": key, "session": session})
                results.append(entry)
                continue
            ok, detail = spawn_headless_resume(session, session_dir)
            entry["ok"] = ok
            entry["detail"] = detail[:160]
            append_ledger({
                "ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "epoch": time.time(),
                "action": "inject" if ok else "inject-failed",
                "key": key,
                "session": session,
                "detail": detail[:200],
            })
            results.append(entry)
        connection.close()
        summary = {"status": "done", "checked_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "sessions": results}
        try:
            (RUNTIME_DIR / "last-scan.json").write_text(json.dumps(summary, ensure_ascii=False, indent=1), encoding="utf-8")
        except OSError:
            pass
        print(json.dumps(summary, ensure_ascii=False))
        return 0
    finally:
        release_lock()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Host-external executor session observation (bounded scan)")
    parser.add_argument("--dry-run", action="store_true", help="仅检查与留痕")
    parser.add_argument("--db")
    parser.add_argument("--idle-seconds", type=int, default=None, help="覆盖静默阈值（测试用）")
    args = parser.parse_args()
    try:
        raise SystemExit(run(args.dry_run, Path(args.db) if args.db else None, args.idle_seconds))
    except Exception as exc:  # 监督器自身故障不得静默
        print(json.dumps({"status": "watchdog-error", "error": f"{type(exc).__name__}: {exc}"}, ensure_ascii=False))
        raise SystemExit(1)
