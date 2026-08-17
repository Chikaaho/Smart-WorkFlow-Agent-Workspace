# Knowledge-base Codex instructions

Read `system.md` in full before performing work governed by this repository.
It is the canonical workspace constitution; this file is its Codex-compatible
entry point and must not duplicate or weaken it.  Read `.claude/memory/` when
the constitution's recovery or task context rules require it.

The user must declare one of the constitution's session roles before governed
work: `规划`, `执行`, or `管理员`.  Apply the matching read/write/command
boundaries exactly, including the information hierarchy (`knowledge/` is the
full authority; `memory/` is a summary), required handoffs, and receipts.
Do not infer a role from the task or silently change it.

When executor work targets a code repository, also read that repository's
`.claude/system.md` and local `AGENTS.md`; keep backend and frontend scopes
separate.  Claude memory and settings are useful project instructions, but
Claude-specific permission modes never override Codex's own approval, sandbox,
safety, or user-authority requirements.

