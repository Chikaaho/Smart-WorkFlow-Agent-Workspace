# Smart-WorkFlow workspace · Codex instructions

This is the Codex entry point for the planning-layer workspace.  It is not a
second constitution: the referenced source documents remain authoritative and
must not be copied or silently weakened here.

## Canonical governance

- Workspace constitution: `system.md`.
- Claude memory: `.claude/memory/`.
- Backend engineering constitution: `../Smart-WorkFlow/.claude/system.md`.
- Frontend engineering constitution: `../Smart-WorkFlow-Web/.claude/system.md`.

Before doing work, identify the task scope and read the matching canonical
document.  If the task spans multiple scopes, do not treat that as permission
to cross their boundaries; follow the workspace constitution's role, handoff,
and receipt process.

## Roles and scope

The workspace constitution defines `规划` (Planner), `执行` (Executor), and
`管理员` (Admin).  Ask the user to declare one before performing work governed
by that constitution when it has not already been declared.  A role remains in
force for the task/session until the user changes it.

- This repository is the planning, knowledge, and governance layer.  Its
  `system.md` controls permitted reads, writes, and workflow.
- `../Smart-WorkFlow/` is backend-executor scope only; use its local
  `AGENTS.md` and engineering constitution for backend execution.
- `../Smart-WorkFlow-Web/` is frontend-executor scope only; use its local
  `AGENTS.md` and engineering constitution for frontend execution.

Never read, edit, build, or test the other code project from an executor task.
Split cross-project work into the constitution's separate handoffs/receipts.
Respect the information hierarchy: `knowledge/` is the full authority and
`memory/` is only its summary.

## Tooling compatibility

Claude's `.claude/settings*.json` permission modes apply only to Claude.  They
do not override Codex's own approval, sandbox, safety, or user-authority
requirements.  All substantive behavior rules in the canonical documents do
apply to Codex.
