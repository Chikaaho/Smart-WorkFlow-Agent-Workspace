#!/usr/bin/env python3
"""执行会话宿主外监督器（Watchdog）v2——CLI 恢复式纠偏。

宪法要求"任务能否终止由宿主外监督器调用同一公共 Validator 后唯一裁决"、"禁止把
用户点击继续作为恢复链路"。本监督器独立于 ZCode GUI 进程运行（任务计划程序驱动），
不依赖任何 in-host hook 存活（实测宿主 Stop hook 在长时高负载窗口存在 spawn 早期
崩溃，in-host 通道不可作为唯一防线）：

1. 检测：扫描已绑定 executor 角色的会话，取其最后一条带正文助手消息，按与 Stop Gate
   同源的物理末行规则判定是否以合法终态行收尾（复用 session-observation 的实现）；
2. 执行：对"静默超过阈值、发生在行动窗口内、未被处理"的无终态收尾，通过 ZCode 引擎
   CLI 无头恢复目标会话（--resume <sess> --prompt <纠偏> --mode yolo）——会话级精准、
   不触碰 GUI、全新进程使 in-host 门禁恢复可靠；纠偏提示词随后经 UserPromptSubmit
   通道（实测 100% 可靠）进入会话，执行会话自主续做并补交终态；
3. 台账：每次检测与注入写 supervisor.jsonl，幂等键 = 会话 + 消息 id；单会话在行动
   窗口内最多纠偏 MAX_INJECTIONS 次，超限记 escalation-exhausted 交还管理员。

只读宿主数据库；除台账、状态文件与受控的无头恢复进程外不写任何状态。
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
WORKSPACE_DIR = GOVERNANCE_DIR.parent.parent
RUNTIME_DIR = GOVERNANCE_DIR / "runtime" / "zcode"
SESSIONS_DIR = RUNTIME_DIR / "sessions"
LEDGER_PATH = RUNTIME_DIR / "supervisor.jsonl"
LOCK_PATH = RUNTIME_DIR / "supervisor.lock"
HEADLESS_LOG_DIR = RUNTIME_DIR / "headless"

ENGINE_CLI = Path(os.environ.get(
    "ZCODE_ENGINE_CLI",
    r"F:\soft\zcode\resources\glm\zcode.cjs",
))
ENGINE_NODE = os.environ.get("ZCODE_NODE", r"C:\Program Files\nodejs\node.exe")

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


CORRECTION_PROMPT = (
    "【宿主外监督器自动注入】检测到上一回合未按契约收尾（无合法 ENGINE_TERMINAL 终态行，"
    "宿主内 Stop 拦截缺失），宿主漏放不等于终态被接受。请立即继续执行授权内的剩余工作项，"
    "不要汇报、不要等待；完成本轮实际工作并通过验证后，在正文最后一行输出唯一合法的 "
    "ENGINE_TERMINAL 终态行（schema 以 .codex/governance/terminal-contract.json 为准）。"
)


def spawn_headless_resume(session: str, cwd: str) -> tuple[bool, str]:
    """以分离进程无头恢复目标会话并投递纠偏提示词。"""
    if not ENGINE_CLI.is_file():
        return False, f"engine-cli-missing: {ENGINE_CLI}"
    HEADLESS_LOG_DIR.mkdir(parents=True, exist_ok=True)
    log_path = HEADLESS_LOG_DIR / f"{session[:40]}.log"
    log_handle = open(log_path, "a", encoding="utf-8")
    log_handle.write(f"\n===== watchdog resume {time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())} =====\n")
    log_handle.flush()
    creationflags = 0
    if sys.platform == "win32":
        creationflags = subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP
    try:
        subprocess.Popen(
            [
                ENGINE_NODE, str(ENGINE_CLI),
                "--resume", session,
                "--prompt", CORRECTION_PROMPT,
                "--cwd", cwd,
                "--mode", "yolo",
            ],
            stdout=log_handle,
            stderr=subprocess.STDOUT,
            stdin=subprocess.DEVNULL,
            cwd=str(WORKSPACE_DIR),
            creationflags=creationflags,
            close_fds=True,
        )
        return True, f"headless-resume-spawned log={log_path.name}"
    except OSError as exc:
        return False, f"spawn-failed: {exc}"
    finally:
        log_handle.close()


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
                entry["status"] = "terminal-ok"
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
            entry["status"] = "injecting"
            if dry_run:
                entry["status"] = "would-inject"
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
    parser = argparse.ArgumentParser(description="Host-external executor session watchdog (v2, CLI resume)")
    parser.add_argument("--dry-run", action="store_true", help="只检测与留痕，不注入")
    parser.add_argument("--db")
    parser.add_argument("--idle-seconds", type=int, default=None, help="覆盖静默阈值（测试用）")
    args = parser.parse_args()
    try:
        raise SystemExit(run(args.dry_run, Path(args.db) if args.db else None, args.idle_seconds))
    except Exception as exc:  # 监督器自身故障不得静默
        print(json.dumps({"status": "watchdog-error", "error": f"{type(exc).__name__}: {exc}"}, ensure_ascii=False))
        raise SystemExit(1)
