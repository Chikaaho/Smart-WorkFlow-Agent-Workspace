# Smart-WorkFlow workspace · Codex instructions

## Highest-priority role gate

This gate takes precedence over every other instruction in this file.  At the
start of each new session, the user must explicitly assign exactly one
constitution role: `规划` (Planner), `执行` (Executor), or `管理员` (Admin).
Recognize the role by semantic normalization, not by exact string matching.
An explicit assignment may wrap one canonical role concept in natural language
such as “层”, “权限”, “身份”, “模式”, “角色”, “代理”, or equivalent wording.
For example, “你在执行层处理”, “授予你执行权限”, and “以执行身份工作” all
normalize to `执行`. Apply the same rule to `规划` and `管理员`.

Fuzzy matching may extend a canonical role concept, but it must not invent a
mapping for a different title. Terms such as `超管`, `主任`, `负责人`,
`开发者`, or any other non-canonical title are invalid unless the user also
explicitly identifies one canonical role. Do not infer a role from the task,
repository, user identity, job title, or prior session activity. If the
assignment resolves to zero or more than one canonical role, ask the user to
clarify instead of guessing.

Until a valid role is explicitly assigned, refuse the request without taking
any workspace action.  In particular, do not read any additional file or
instruction, list or search paths, inspect Git/process state, run commands,
build or test, call external tools, or make edits.  This entry point may be
provided during initialization solely to apply this gate; it does not grant a
role. The same refusal rule applies when the user's wording cannot be
semantically normalized to exactly one canonical role.

After a valid role is assigned, read the canonical constitution and enforce
its role-specific scope, handoff, receipt, and permission rules.  A role is
valid only for the current task/session and must not be carried into a new
session.

## Workspace root and executor-scope clarification

This file is located at the workspace root, `/usr/local/projects/Smart-WorkFlow`.
The workspace root is the control and execution entry point for the entire
workspace.  It is not itself the backend repository, even though its name
matches the nested backend repository.  The two code repositories are:

- Backend: `/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow`
- Frontend: `/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Web`

Declaring the `执行` (Executor) role at this workspace root grants execution
capabilities across the complete workspace: planning-layer execution artifacts,
the backend repository, and the frontend repository, including implementation,
compilation, testing, receipts, knowledge updates, and memory compression.
The role is not implicitly narrowed to the backend merely because the root and
backend directories share the `Smart-WorkFlow` name.  When a task is explicitly
entered from a child repository, that child repository's local constitution
adds its repository-specific rules; this does not change the meaning of an
`执行` role declared at the workspace root.

This is the Codex entry point for the workspace.  The entire workspace is the
**planning layer**: `knowledge/`, `memory/`, `product/`, `search_task/`,
`search_fallback/`, and `todo/` are all planning-layer resources.  The backend
and frontend repositories are its two executor sublayers.  This file is not a
second constitution: the referenced source documents remain authoritative and
must not be copied or silently weakened here.

## Canonical governance

- Workspace constitution: `system.md`.
- Backend engineering constitution: `Smart-WorkFlow/docs/governance/engineering-constitution.md`.
- Frontend engineering constitution: `Smart-WorkFlow-Web/docs/governance/engineering-constitution.md`.

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
- `Smart-WorkFlow/` is the backend repository; use its local `AGENTS.md` and
  engineering constitution for backend-specific rules.
- `Smart-WorkFlow-Web/` is the frontend repository; use its local `AGENTS.md`
  and engineering constitution for frontend-specific rules.

An executor task authorized from this workspace root may read, edit, build, and
test either code project, and may handle cross-project work when the task scope
requires it.  Apply each repository's local engineering constitution to the
files and commands in that repository, and preserve the shared constraints
(including frontend/backend build mutual exclusion and memory limits).
The child-repository prohibition on crossing into the other project applies
only when the session is entered from that child repository, not when execution
is authorized at this workspace root.  Respect the information hierarchy:
`knowledge/` is the full authority and `memory/` is only its summary.

An administrator task may maintain constitutions, architecture documents, and
engineering configuration across the workspace, and may perform Git operations
related to that administrator task.  This does not authorize business planning,
business implementation, builds, tests, migrations, or deployments.  Remote
publication, published-history rewrites, force-pushes, and other destructive or
high-risk Git operations still require explicit user authorization after the
remote, branch, scope, and risk are stated.

## Tooling compatibility

Claude's `.claude/settings*.json` permission modes apply only to Claude.  They
do not override Codex's own approval, sandbox, safety, or user-authority
requirements.  All substantive behavior rules in the canonical documents do
apply to Codex.

## Git commit language

Codex must write Git commit subjects and bodies in Chinese by default.  Keep
necessary technical identifiers such as module names, class names, commands,
issue IDs, and conventional prefixes (`feat:`, `fix:`, `docs:`) unchanged when
useful, but the descriptive commit message itself must not be purely English.
Commit messages must not contain Claude attribution, including
`Co-Authored-By: Claude <noreply@anthropic.com>` or any other Claude signature
line; use only the identity configured by the repository owner.
Do not rewrite published history solely to enforce this rule unless the user
explicitly authorizes the history rewrite and required force-push.
