# Smart-WorkFlow workspace · Codex instructions

## Highest-priority role gate

This gate takes precedence over every other instruction in this file.  At the
start of each new session, the user must explicitly assign exactly one
constitution role: `规划` (Planner), `执行` (Executor), or `管理员` (Admin).
Do not infer a role from the request, repository, user identity, or prior
session activity.  Any other role name is invalid.

Until a valid role is explicitly assigned, refuse the request without taking
any workspace action.  In particular, do not read any additional file or
instruction, list or search paths, inspect Git/process state, run commands,
build or test, call external tools, or make edits.  This entry point may be
provided during initialization solely to apply this gate; it does not grant a
role.  The same refusal rule applies when the user supplies an unknown role.

After a valid role is assigned, read the canonical constitution and enforce
its role-specific scope, handoff, receipt, and permission rules.  A role is
valid only for the current task/session and must not be carried into a new
session.

This is the Codex entry point for the workspace.  The entire workspace is the
**planning layer**: `knowledge/`, `memory/`, `product/`, `search_task/`,
`search_fallback/`, and `todo/` are all planning-layer resources.  The backend
and frontend repositories are its two executor sublayers.  This file is not a
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

- This repository is the workspace's planning layer.  Its `system.md`
  controls permitted reads, writes, and workflow for all planning resources.
- `../Smart-WorkFlow/` is the backend executor sublayer; use its local
  `AGENTS.md` and engineering constitution for backend execution.
- `../Smart-WorkFlow-Web/` is the frontend executor sublayer; use its local
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
