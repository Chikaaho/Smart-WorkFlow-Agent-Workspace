#!/usr/bin/env python3
"""受治理 ZCode 会话的宿主观察读取器（只读）。

Stop Gate 需要两条不来自模型自述的独立证据：

1. 模型自己用 TodoWrite 写下的任务清单是否仍有未完成项（`todo` 表）；
2. 模型最近一次请求的真实上下文占用与宿主是否报告过超限
   （`message.tokens` + provider 配置的 `limit.context` + `turn_usage.context_exceeded`），
   用于拒绝“上下文已满”这类无工具证据的自我估计。

约束：
- 只读打开，不写宿主数据；不使用 immutable 模式，避免漏读 WAL 中已提交的最新状态；
- 库路径与桌面配置路径可由 `--db` / `--config` 覆盖，用于契约测试；
- 任何读取失败都以 `available: false` 结束并返回 0，由 Stop Gate 决定降级策略。
"""

from __future__ import annotations

import argparse
import json
import os
import sqlite3
import sys
from pathlib import Path

SCHEMA = "agent-coding-engine.zcode-session-observation.v1"
OPEN_STATUSES = ("in_progress", "pending")
MAX_ITEMS = 10
MAX_ITEM_CHARS = 240


def default_db_path() -> Path:
    configured = os.environ.get("ZCODE_SESSION_DB")
    if configured:
        return Path(configured)
    storage = os.environ.get("ZCODE_STORAGE_DIR")
    base = Path(storage) if storage else Path.home() / ".zcode"
    return base / "cli" / "db" / "db.sqlite"


def default_config_path() -> Path:
    configured = os.environ.get("ZCODE_DESKTOP_CONFIG")
    if configured:
        return Path(configured)
    storage = os.environ.get("ZCODE_STORAGE_DIR")
    base = Path(storage) if storage else Path.home() / ".zcode"
    return base / "v2" / "config.json"


def summarize_todos(rows: list[tuple]) -> dict:
    counts = {"completed": 0, "in_progress": 0, "pending": 0, "other": 0}
    open_items = []
    for position, status, content in rows:
        key = status if status in counts else "other"
        counts[key] += 1
        if status in OPEN_STATUSES and len(open_items) < MAX_ITEMS:
            text = (content or "").strip()
            if len(text) > MAX_ITEM_CHARS:
                text = text[:MAX_ITEM_CHARS] + "..."
            open_items.append({"position": position, "status": status, "content": text})
    return {
        "available": True,
        "total": len(rows),
        "completed": counts["completed"],
        "in_progress": counts["in_progress"],
        "pending": counts["pending"],
        "other": counts["other"],
        "open": counts["in_progress"] + counts["pending"],
        "open_items": open_items,
    }


def read_latest_assistant_tokens(connection: sqlite3.Connection, session_id: str) -> dict | None:
    rows = connection.execute(
        "select data from message where session_id = ? order by time_created desc limit 40",
        (session_id,),
    ).fetchall()
    for raw in rows:
        text = raw[0] if isinstance(raw[0], str) else bytes(raw[0]).decode("utf-8", "replace")
        try:
            record = json.loads(text)
        except (TypeError, ValueError):
            continue
        if not isinstance(record, dict) or record.get("role") != "assistant":
            continue
        tokens = record.get("tokens")
        if not isinstance(tokens, dict):
            continue
        total = tokens.get("total")
        if not isinstance(total, (int, float)):
            input_tokens = tokens.get("input") if isinstance(tokens.get("input"), (int, float)) else 0
            output_tokens = tokens.get("output") if isinstance(tokens.get("output"), (int, float)) else 0
            total = input_tokens + output_tokens
        total = int(total)
        # 占位/空回合的 assistant 消息可能带 0 token；回退到最近一次真实请求的用量，
        # 避免把 0% 当成实测值回注。
        if total <= 0:
            continue
        return {
            "tokens": total,
            "model_id": record.get("modelId") if isinstance(record.get("modelId"), str) else "",
            "provider_id": record.get("providerId") if isinstance(record.get("providerId"), str) else "",
        }
    return None


def read_context_limit(config_path: Path, provider_id: str, model_id: str) -> tuple[int | None, str]:
    try:
        config = json.loads(config_path.read_text(encoding="utf-8"))
    except (OSError, ValueError):
        return None, ""
    providers = config.get("provider")
    if not isinstance(providers, dict):
        return None, ""
    if provider_id and isinstance(providers.get(provider_id), dict):
        model = (providers[provider_id].get("models") or {}).get(model_id)
        limit = ((model or {}).get("limit") or {}).get("context")
        if isinstance(limit, (int, float)) and limit > 0:
            return int(limit), model_id
    for provider in providers.values():
        if not isinstance(provider, dict):
            continue
        model = (provider.get("models") or {}).get(model_id)
        limit = ((model or {}).get("limit") or {}).get("context")
        if isinstance(limit, (int, float)) and limit > 0:
            return int(limit), model_id
    return None, ""


def read_context_exceeded(connection: sqlite3.Connection, session_id: str) -> bool:
    rows = connection.execute(
        "select context_exceeded from turn_usage where session_id = ? order by completed_at desc limit 5",
        (session_id,),
    ).fetchall()
    return any(bool(row[0]) for row in rows)


def read_context(connection: sqlite3.Connection, session_id: str, config_path: Path) -> dict:
    latest = read_latest_assistant_tokens(connection, session_id)
    if latest is None:
        return {"available": False, "error": "assistant-tokens-not-found"}
    limit, model_id = read_context_limit(config_path, latest["provider_id"], latest["model_id"])
    if limit is None:
        return {"available": False, "error": "context-limit-not-found", "tokens": latest["tokens"]}
    percent = round(latest["tokens"] / limit * 100, 1)
    return {
        "available": True,
        "tokens": latest["tokens"],
        "limit": limit,
        "percent": percent,
        "model": model_id or latest["model_id"],
        "context_exceeded": read_context_exceeded(connection, session_id),
    }


def read_marker(default: str = "ENGINE_TERMINAL") -> str:
    """终态行 marker 只来自 terminal-contract.json（与 Stop Gate 同源）。"""
    contract = Path(__file__).resolve().parent / "terminal-contract.json"
    try:
        value = json.loads(contract.read_text(encoding="utf-8-sig")).get("marker")
    except (OSError, ValueError):
        return default
    return value if isinstance(value, str) and value.strip() else default


def read_last_assistant_message(connection: sqlite3.Connection, session_id: str, marker: str, max_scan: int = 10) -> dict:
    """会话最近一条带正文的 assistant 消息是否以合法终态行结尾。

    宿主对 Stop hook 的派发实测可能静默缺失（不上门禁也不留失败日志），因此
    UserPromptSubmit 入口需要独立回答"上一回合是否无契约收尾"。判定与 Gate 的
    物理末行规则一致：最后一行必须以 `marker ` 开头。
    """
    rows = connection.execute(
        "select id, time_created from message where session_id = ? order by time_created desc limit ?",
        (session_id, max_scan),
    ).fetchall()
    prefix = f"{marker} "
    for message_id, time_created in rows:
        parts = connection.execute(
            "select data from part where message_id = ? order by sequence",
            (message_id,),
        ).fetchall()
        texts = []
        for (raw,) in parts:
            text = raw if isinstance(raw, str) else bytes(raw).decode("utf-8", "replace")
            try:
                piece = json.loads(text)
            except (TypeError, ValueError):
                continue
            if isinstance(piece, dict) and piece.get("type") == "text" and isinstance(piece.get("text"), str):
                texts.append(piece["text"])
        body = "\n".join(texts).strip()
        if not body:
            continue
        lines = [line.rstrip() for line in body.splitlines()]
        while lines and lines[-1] == "":
            lines.pop()
        return {
            "available": True,
            "message_id": message_id,
            "time_created": int(time_created),
            "text_chars": len(body),
            "has_marker": bool(lines) and lines[-1].startswith(prefix),
        }
    return {"available": False, "error": "assistant-text-not-found"}


def read_first_prompt(connection: sqlite3.Connection, session_id: str, max_chars: int = 4000) -> str:
    """会话最早的 sendText 提示词原文：用于回填"hook 尚未生效时发出的角色声明"。

    只读取文本，不落盘、不写审计；调用方只在角色未绑定时使用它。
    """
    rows = connection.execute(
        "select payload from session_input where session_id = ? order by time_created limit 5",
        (session_id,),
    ).fetchall()
    for raw in rows:
        text = raw[0] if isinstance(raw[0], str) else bytes(raw[0]).decode("utf-8", "replace")
        try:
            payload = json.loads(text)
        except (TypeError, ValueError):
            continue
        if not isinstance(payload, dict):
            continue
        candidate = payload.get("text")
        if isinstance(candidate, str) and candidate.strip():
            return candidate[:max_chars]
    return ""


def read_observation(session_id: str, db_path: Path, config_path: Path, timeout: float) -> dict:
    if not db_path.is_file():
        return {"todo": {"available": False, "error": "session-db-not-found"}, "context": {"available": False, "error": "session-db-not-found"}}
    uri = f"file:{db_path.as_posix()}?mode=ro"
    try:
        connection = sqlite3.connect(uri, uri=True, timeout=timeout)
    except sqlite3.Error as exc:
        unavailable = {"available": False, "error": f"connect-failed: {exc}"}
        return {"todo": dict(unavailable), "context": dict(unavailable)}
    try:
        connection.execute("pragma busy_timeout = 5000")
        todos = connection.execute(
            "select position, status, content from todo where session_id = ? order by position, time_created",
            (session_id,),
        ).fetchall()
        todo = summarize_todos(todos)
    except sqlite3.Error as exc:
        todo = {"available": False, "error": f"query-failed: {exc}"}
    try:
        first_prompt = read_first_prompt(connection, session_id)
    except sqlite3.Error:
        first_prompt = ""
    try:
        context = read_context(connection, session_id, config_path)
    except (sqlite3.Error, OSError, ValueError) as exc:
        context = {"available": False, "error": f"context-query-failed: {exc}"}
    try:
        last_assistant = read_last_assistant_message(connection, session_id, read_marker())
    except sqlite3.Error as exc:
        last_assistant = {"available": False, "error": f"last-assistant-query-failed: {exc}"}
    finally:
        connection.close()
    return {"todo": todo, "context": context, "first_prompt": first_prompt, "last_assistant": last_assistant}


def main() -> int:
    parser = argparse.ArgumentParser(description="ZCode session host observation reader")
    parser.add_argument("--session-id", required=True)
    parser.add_argument("--db")
    parser.add_argument("--config")
    parser.add_argument("--timeout", type=float, default=5.0)
    args = parser.parse_args()

    observation = read_observation(
        args.session_id,
        Path(args.db) if args.db else default_db_path(),
        Path(args.config) if args.config else default_config_path(),
        args.timeout,
    )
    payload = {"schema": SCHEMA, "session_id": args.session_id, **observation}
    print(json.dumps(payload, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:  # 观察器永不阻断门禁，失败一律降级为 available=false
        print(json.dumps({"schema": SCHEMA, "todo": {"available": False, "error": type(exc).__name__}, "context": {"available": False, "error": type(exc).__name__}}, ensure_ascii=False))
        raise SystemExit(0)
