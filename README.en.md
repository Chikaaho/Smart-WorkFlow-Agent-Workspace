# Agent Coding Engine

[简体中文](README.md) | **English**

> This page describes the generic Agent Coding Engine on the `main` branch by default. All relative paths and current-state statements refer to `main`. Only sections and links explicitly marked `develop-sw` describe the Smart-WorkFlow/OA example instance.

A semi-automated Agent Coding Engine decoupled from any particular business domain, programming language, or toolchain. The root of `main` is a runnable workspace. A project only needs to declare its identity, coding repositories, and engineering rules in `project.md`; an Agent can then take over work through the existing governance protocol.

## Branch Identity

| Branch | Single Purpose | Meaning of State Files |
| --- | --- | --- |
| `main` | Generic Agent Coding Engine and starting point for new projects | Initial values in `knowledge/` and `memory/` describe an Engine workspace before a project is connected; feature count `0` is the state of that initial instance |
| [`develop-sw`](https://github.com/Chikaaho/Smart-WorkFlow-Knowledge/tree/develop-sw) | Complete Smart-WorkFlow/OA example instance | `knowledge/`, `memory/`, `product/`, and `todo/` on this branch contain the OA architecture, product progress, and history |

Always confirm the current branch before evaluating project state:

```bash
git branch --show-current
```

The product-state entry point for Smart-WorkFlow/OA is [`develop-sw/knowledge/current-status.md`](https://github.com/Chikaaho/Smart-WorkFlow-Knowledge/blob/develop-sw/knowledge/current-status.md). `main/knowledge/current-status.md` only describes the current generic Engine instance.

## What It Solves

Agent Coding Engine organizes role permissions, task levels, requirement direction, code exploration, execution evidence, project knowledge, and terminal-state synchronization that would otherwise become scattered across a long-running coding project. The workflow is selected by risk: small local changes are executed directly, while tracked features enter the complete lifecycle.

It is designed as a **semi-automated system**. Agents read context, explore, plan, implement, verify, record evidence, and synchronize state. Humans retain control over goals and termination and may intervene at any time to:

- change requirement direction, scope, or priority;
- pause or stop the current task;
- change acceptance goals or evidence standards;
- make the final decision on feature results, stage terminal states, and remote publication.

Normal operation does not require a human to decompose every step or supervise continuously. Once the goal and project rules are declared, Agents proceed within their role boundaries until the result is ready for acceptance. A human can issue a new decision whenever the direction needs to change.

## How Work Is Routed

| Level | Typical Task | Workflow |
| --- | --- | --- |
| S | Button, copy, local CSS, or another low-risk correction | Executor changes it directly and performs focused verification |
| M | Small single-module feature, local API, or process adjustment | Executor uses a lightweight Plan → Execute → Test loop |
| L | New module, cross-repository work, important process, or formally tracked feature | Planner direction → Executor implementation and evidence → Planner acceptance and terminal synchronization |
| XL | Core architecture, multi-version evolution, or major migration | L lifecycle + Decision Records + staged acceptance |

The three Agent roles retain distinct boundaries:

| Role | Primary Responsibility |
| --- | --- |
| Planner (`规划`) | Handles L/XL: delegates exploration, defines direction and acceptance goals, and performs independent acceptance |
| Executor (`执行`) | Classifies and executes S/M/L/XL: implementation planning, implementation, verification, evidence, and authorized knowledge maintenance |
| Admin (`管理员`) | Maintains governance protocols, engineering configuration, repository governance, and related Git operations |

The single behavioral constitution is [`system.md`](system.md). Complete permissions for all three roles are defined under [`roles/`](roles/). The latest explicit human decision always has the highest priority.

### Recommended Interaction Flow (Freely Extensible)

The following is a minimal interaction skeleton for L/XL tasks. `create planning` and `create execute` mean creating sessions for the corresponding roles; `change planning` and `change execute` mean switching back to existing sessions. If your tool uses different terms, substitute its equivalent create and switch actions. S/M tasks normally follow the direct paths above and do not require the complete lifecycle.

| Step | Action | Minimum User Input | Agent Takes Over |
| --- | --- | --- | --- |
| 1 | `create planning` | `Role: Planner (规划). My requirement is xxx.` or `Role: Planner (规划). Select the best item from the requirement pool and explain why.` | Reads project state and requirement material; defines direction, scope, and acceptance goals |
| 2 | `create execute` | `Role: Executor (执行). Read the execution task and begin.` | Locates the active task; implements, verifies, and writes the receipt |
| 3 | `change planning` | `Read the receipt and perform acceptance.` | Independently reviews implementation and evidence; passes or returns the task |
| 4.1 | `change execute` | `The review returned the task. Read the review record and fix it.` | Reads the latest review, fixes the gaps, and updates the receipt; then returns to step 3, repeating as needed |
| 4.2 | `change execute` | `The review passed. Read the synchronization task and begin.` | Reads the terminal synchronization task and updates state, history, and related knowledge |
| 5 | `change planning` | `Read the receipt and perform acceptance.` | Independently reviews the terminal synchronization result; passes or returns it |
| 6.1 | `change execute` | `The review returned the task. Read the review record and fix it.` | Reads the latest review and fixes synchronization gaps; then returns to step 5, repeating as needed |
| 6.2 | `change execute` | `The review passed. Push the code.` | Before publication, reports the remote, branch, file scope, and risk, then pushes within the current authorization boundary |

```text
create planning → create execute → change planning (implementation acceptance)
                                      ├─ returned → change execute (fix) → back to implementation acceptance (loop A)
                                      └─ passed → change execute (synchronize)
                                                   ↓
                                           change planning (synchronization acceptance)
                                                   ├─ returned → change execute (fix) → back to synchronization acceptance (loop B)
                                                   └─ passed → change execute (push)
```

Users normally only need to describe the requirement in the first step and can use the single-line prompts in the table afterward. They do not need to paste the task, receipt, or review record repeatedly; each role should locate and read the current authoritative files. An Agent asks for the minimum necessary identifier only when multiple candidate tasks or records exist and cannot be resolved reliably.

This is a recommended skeleton, not a fixed orchestration. Users may freely add or remove stages, add testing or security reviews, split release batches, rename roles, or introduce project-specific loops. Extensions must still respect automatic task upgrades, role permissions, destructive-operation controls, and remote-publication boundaries.

## Connect a Project

The root of `main` already contains the complete runtime structure; no additional scaffold is required. The shortest setup has two steps:

1. Create `project.md` from [`project.example.md`](project.example.md), then fill in the project name, goals, coding repository directories, engineering rules, and verification entry points.
2. Open this workspace in a coding tool that supports repository-level Agents, declare the session role, and provide a task.

```bash
cp project.example.md project.md
```

Coding repositories may live inside the Engine root or in other locations resolvable from the project description. One Engine workspace represents one project instance. Use separate workspaces for different projects so their knowledge, memory, directions, receipts, and backlogs remain isolated.

### ZCode Trial Plan Handoff Example

The Owner has validated a lightweight onboarding path with the ZCode trial plan: open an already configured Engine workspace in ZCode, declare a role, and issue an existing task. The Agent can read `AGENTS.md`, `system.md`, `project.md`, and workspace state, then continue through the established workflow.

In this example, “zero-change handoff” means that **no Engine protocol, Harness configuration, business code, or tool-specific adapter needs to be changed for ZCode to connect and understand the task**. Normal requirement implementation after the handoff will still modify authorized project files as required by the task.

The interaction can remain short:

```text
Role: Executor (执行)
Task: Read the current active direction and existing receipts, then continue until the remaining acceptance goals are satisfied.
```

This trial shows that project context and task state are stored in the workspace rather than tied to a particular model plan, language, or IDE. Any Agent tool that can read repository files and perform authorized operations can take over from the same structure.

## Structure

| Path | Purpose | Primary Maintainer |
| --- | --- | --- |
| `project.md` | Single description entry point for the current project: identity, repository directories, engineering rules, startup, and verification | Configured during project onboarding |
| `system.md` | Single workspace behavioral constitution: role entry, collaboration protocol, state, and safety boundaries | Admin |
| `roles/` | Complete definitions for Planner, Executor, and Admin | Admin |
| `knowledge/` | Complete persistent knowledge for the current Engine project instance; `main` retains the initial state for a new project | Executor |
| `memory/` | Minimum summary that lets Planner restore context quickly; `main` retains the initial summary | Planner; synchronized at terminal state when authorized |
| `product/` | L/XL requirement directions, execution receipts, acceptance records, and archives; S/M does not enter by default | Planner / Executor within their respective areas |
| `todo/` | Deferred work and requirement-gap pool | Planner; synchronized when authorized |
| `search_task/` | Code and state exploration tasks issued by Planner | Planner |
| `search_fallback/` | Compressed exploration conclusions returned by Executor | Executor |
| `.codex/`, `.claude/` | Harness configuration, Hooks, terminal-state machine contract, and shared validators | Admin |
| `AGENTS.md`, `CLAUDE.md` | Harness-specific workspace entry points that route to `system.md` | Admin |

After onboarding, `knowledge/` stores the complete project facts, while `memory/` retains only the summary needed for planning. `product/` preserves the complete L/XL trail from direction and execution evidence through final acceptance. S/M completes its implementation plan, verification, and result report in the conversation without creating feature state. `main` retains generic initial values from which new projects establish their own state.

## Generic Boundaries

The Engine does not assume that a project has a backend, frontend, database, or compilation step, and it does not hard-code Java, Vue, or any other language or framework.

- Supports single-repository and multi-repository projects, including projects without a traditional compilation process.
- Build, test, migration, deployment, and resource limits are declared as needed by `project.md` or project engineering rules.
- Project actions that have not been declared have no Engine-level default command, port, or resource parameter.
- A terminal baseline contains only the verification items actually declared and executed for the current project.
- Replacing repositories or changing the technology stack does not change role protocols, knowledge structure, or risk-classification principles.

## Smart-WorkFlow Example (`develop-sw` Only)

The [`develop-sw` branch](https://github.com/Chikaaho/Smart-WorkFlow-Knowledge/tree/develop-sw) is a complete Smart-WorkFlow/OA instance. It retains the project’s business knowledge, memory, requirement directions, receipts, backlog, and historical traceability, and demonstrates how a long-running multi-repository project can use this Engine.

- [Example project description](https://github.com/Chikaaho/Smart-WorkFlow-Knowledge/blob/develop-sw/README.md)
- [Example system architecture](https://github.com/Chikaaho/Smart-WorkFlow-Knowledge/blob/develop-sw/knowledge/architecture.md)
- [Example current product state](https://github.com/Chikaaho/Smart-WorkFlow-Knowledge/blob/develop-sw/knowledge/current-status.md)

```bash
git switch develop-sw
```

Relative repository links point to the OA example material only after switching to `develop-sw`. `main` always remains the generic Engine and the starting point for new projects.

## Evolution History

This structure was gradually extracted from long-running Agent collaboration on a real OA project. Key commits preserve the evolution from a project instance to a generic Engine:

| Commit | Result |
| --- | --- |
| `2b2ca2d` | Reorganized the default branch as a generic Agent Coding Engine and retained the OA instance on the example branch |
| `2bd193e` | Established the repository root as the runnable workspace and `project.md` as the single project-description entry point |
| `d3e85af` | Made Harness Hooks locate the Engine root reliably from different directories within the workspace |
| `7cf6361` | Unified Admin governance and introduced generic initial knowledge plus project-declared resource constraints |
| `45f2c98` | Completed the language-independent, toolchain-independent runtime contract and project-declaration model |
| `7d59297`, `f80b02c` | Completed direction archival, terminal synchronization, and reviewable evidence closure |
| `a609783`, `f738cef` | Completed Owner confirmation, remote publication, and final Planner confirmation records |

Detailed directions, receipts, and verification evidence are stored under [`product/p51-agent-coding-engine-decoupling/`](product/p51-agent-coding-engine-decoupling/). History explains the design’s origin; current onboarding and operation remain governed by this README, `project.md`, `system.md`, and `roles/`.

## Generic Engine Navigation on `main`

All entries below belong to the current `main` branch and do not represent Smart-WorkFlow/OA product progress:

- [Project onboarding template](project.example.md)
- [Single behavioral constitution](system.md)
- [Role definitions](roles/)
- [Knowledge guide](knowledge/README.md)
- [Memory guide](memory/README.md)
- [Requirement directions and receipts guide](product/README.md)
- [Exploration task guide](search_task/README.md)
- [Exploration result guide](search_fallback/README.md)
- [Backlog and requirement pool guide](todo/README.md)
