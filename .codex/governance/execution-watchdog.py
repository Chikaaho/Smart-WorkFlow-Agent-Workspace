#!/usr/bin/env python3
"""执行会话宿主外监督器（Watchdog）。

宪法要求"任务能否终止由宿主外监督器调用同一公共 Validator 后唯一裁决"、"禁止把
用户点击继续作为恢复链路"。本监督器独立于 ZCode 宿主进程运行（任务计划程序驱动），
不依赖任何 in-host hook 存活：

1. 检测：扫描已绑定 executor 角色的会话，取其最后一条带正文助手消息，按与 Stop Gate
   同源的物理末行规则判定是否以合法终态行收尾（复用 session-observation 的实现）；
2. 执行：对"已静默超过阈值且未处理"的无终态收尾，向对应 ZCode 窗口注入纠偏提示词
   （剪贴板粘贴 + 回车，等效用户打字，走实测 100% 可靠的 UserPromptSubmit 通道），
   强制会话续做并补交终态；
3. 台账：每次检测与注入写 supervisor.jsonl，幂等键 = 会话 + 消息 id，同一收尾不重复注入。

只读宿主数据库；除台账与注入外不写任何状态。
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import os
import sqlite3
import subprocess
import sys
import time
from pathlib import Path

GOVERNANCE_DIR = Path(__file__).resolve().parent
RUNTIME_DIR = GOVERNANCE_DIR / "runtime" / "zcode"
SESSIONS_DIR = RUNTIME_DIR / "sessions"
LEDGER_PATH = RUNTIME_DIR / "supervisor.jsonl"
LOCK_PATH = RUNTIME_DIR / "supervisor.lock"

IDLE_SECONDS = 480          # 会话静默 8 分钟才认定回合已结束（进行中的回合消息持续落库）
LOOKBACK_SECONDS = 12 * 3600  # 只看 12 小时内的收尾，不复活陈旧会话
INJECT_COOLDOWN_SECONDS = 1800  # 同会话两次注入的最小间隔


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


def last_message_time(connection: sqlite3.Connection, session_id: str) -> int | None:
    row = connection.execute(
        "select max(time_updated) from message where session_id = ?", (session_id,)
    ).fetchone()
    return int(row[0]) if row and row[0] else None


def append_ledger(record: dict) -> None:
    LEDGER_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LEDGER_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, ensure_ascii=False) + "\n")


def read_ledger_keys() -> set[str]:
    if not LEDGER_PATH.is_file():
        return set()
    keys = set()
    for line in LEDGER_PATH.read_text(encoding="utf-8").splitlines():
        try:
            record = json.loads(line)
        except ValueError:
            continue
        if record.get("action") == "inject" and record.get("key"):
            keys.add(record["key"])
    return keys


def last_inject_time(keys_times: dict, session: str) -> float:
    return keys_times.get(session, 0.0)


def scan_injection_times() -> dict:
    times: dict = {}
    if not LEDGER_PATH.is_file():
        return times
    now = time.time()
    for line in LEDGER_PATH.read_text(encoding="utf-8").splitlines():
        try:
            record = json.loads(line)
        except ValueError:
            continue
        if record.get("action") != "inject":
            continue
        session = record.get("session", "")
        ts = record.get("epoch", 0)
        if session and ts and now - float(ts) < INJECT_COOLDOWN_SECONDS * 3:
            times[session] = max(times.get(session, 0.0), float(ts))
    return times


CORRECTION_PROMPT = (
    "【宿主外监督器自动注入】检测到上一回合未按契约收尾（无合法 ENGINE_TERMINAL 终态行，"
    "宿主内 Stop 拦截缺失），宿主漏放不等于终态被接受。请立即继续执行授权内的剩余工作项，"
    "不要汇报、不要等待；完成本轮实际工作并通过验证后，在正文最后一行输出唯一合法的 "
    "ENGINE_TERMINAL 终态行（schema 以 .codex/governance/terminal-contract.json 为准）。"
)


def inject_via_window(session_title: str, prompt: str) -> tuple[bool, str]:
    """调用 PowerShell 注入脚本，把纠偏提示词送进目标 ZCode 窗口。"""
    script = GOVERNANCE_DIR / "inject-prompt.ps1"
    result = subprocess.run(
        [
            "powershell", "-NoLogo", "-NoProfile", "-NonInteractive",
            "-ExecutionPolicy", "Bypass", "-File", str(script),
            "-TitlePattern", session_title[:16],
            "-PromptText", prompt,
        ],
        capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=120,
    )
    output = (result.stdout or "").strip()
    ok = result.returncode == 0 and '"ok":true' in output.replace(" ", "")
    return ok, (output or (result.stderr or "")[-300:])


def acquire_lock() -> bool:
    LOCK_PATH.parent.mkdir(parents=True, exist_ok=True)
    if LOCK_PATH.exists():
        try:
            if time.time() - LOCK_PATH.stat().st_mtime < 300:
                return False
        except OSError:
            return False
    LOCK_PATH.write_text(str(os.getpid()), encoding="utf-8")
    return True


def release_lock() -> None:
    try:
        LOCK_PATH.unlink(missing_ok=True)
    except OSError:
        pass


def run(dry_run: bool, db_path: Path | None = None) -> int:
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
        handled = read_ledger_keys()
        inject_times = scan_injection_times()
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
                entry["status"] = "terminal-ok"
                results.append(entry)
                continue
            if key in handled:
                entry["status"] = "already-handled"
                results.append(entry)
                continue
            if age_ms > LOOKBACK_SECONDS * 1000:
                entry["status"] = "stale-beyond-lookback"
                results.append(entry)
                continue
            last_activity = last_message_time(connection, session)
            if last_activity and now_ms - last_activity < IDLE_SECONDS * 1000:
                entry["status"] = "session-active-waiting-idle"
                results.append(entry)
                continue
            if time.time() - last_inject_time(inject_times, session) < INJECT_COOLDOWN_SECONDS:
                entry["status"] = "cooldown"
                results.append(entry)
                continue
            title_row = connection.execute(
                "select title from session where id = ?", (session,)
            ).fetchone()
            title = (title_row[0] or "") if title_row else ""
            entry["status"] = "injecting"
            entry["title"] = title[:40]
            if dry_run:
                entry["status"] = "would-inject"
                entry["ok"] = None
                append_ledger({"ts": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "action": "dry-run", "key": key, "session": session})
                results.append(entry)
                continue
            ok, detail = inject_via_window(title, CORRECTION_PROMPT)
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
    parser = argparse.ArgumentParser(description="Host-external executor session watchdog")
    parser.add_argument("--dry-run", action="store_true", help="只检测与留痕，不注入")
    parser.add_argument("--db")
    args = parser.parse_args()
    try:
        raise SystemExit(run(args.dry_run, Path(args.db) if args.db else None))
    except Exception as exc:  # 监督器自身故障不得静默
        print(json.dumps({"status": "watchdog-error", "error": f"{type(exc).__name__}: {exc}"}, ensure_ascii=False))
        raise SystemExit(1)
