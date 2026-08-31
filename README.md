# Agent Coding Engine

> 一个与具体业务、编程语言和工具链解耦的半自动 Agent Coding Engine。`main` 是通用 Engine，根目录就是可运行工作区；项目只需在 `project.md` 声明身份、代码仓库目录和工程规则，Agent 即可沿既有治理协议接手任务。

## 它解决什么问题

Agent Coding Engine 把长期 coding 项目中容易散落的角色权限、需求方向、代码探索、执行回执、验收证据、项目知识和终态同步组织成一个可持续运行的工作区。

它被设计为**半自动系统**：Agent 负责读取上下文、探索、规划、实现、验证、记录证据和同步状态；人工保留目标与终止权，可以在任何时候介入：

- 改变需求方向、范围或优先级；
- 暂停或终止当前任务；
- 修改验收目标与证据口径；
- 对功能结果、阶段终态和远程发布作最终裁决。

日常运行不要求人工逐步拆解或持续盯守。只要目标和项目规则已经声明，Agent 会在角色边界内推进到可验收结果；需要改变方向时，人工直接给出新裁决即可。

## 工作方式

```text
人工给出目标或调整方向
          |
          v
Planner 形成需求方向与验收口径
          |
          v
Executor 探索 -> 实现 -> 验证 -> 回执
          |
          v
Planner 独立验收 -> Admin/Executor 同步终态
          |
          v
人工确认结果、继续、调整或终止
```

三类 Agent 角色各自保持清晰边界：

| 角色 | 主要职责 |
| --- | --- |
| Planner（规划） | 理解需求、派发探索、确定方向和验收目标、独立验收 |
| Executor（执行） | 探索代码、完成实现与验证、提交行为证据、维护完整项目知识 |
| Admin（管理员） | 维护治理协议、工程配置、仓库治理与相关 Git 操作 |

唯一行为宪法是 [`system.md`](system.md)，三类角色的完整权限定义位于 [`roles/`](roles/)。人工的最新明确裁决始终拥有最高优先级。

## 接入一个项目

`main` 根目录已经包含完整运行结构，不需要生成额外骨架。最短接入只需两步：

1. 从 [`project.example.md`](project.example.md) 创建 `project.md`，填写项目名称、目标、代码仓库目录、工程规则和验证入口。
2. 在支持仓库级 Agent 的 coding 工具中打开这个工作区，声明本次会话角色并给出任务。

```bash
cp project.example.md project.md
```

代码仓库可以位于 Engine 根目录内，也可以使用项目说明中可定位的其他目录。一个 Engine 工作区对应一个项目实例；不同项目使用独立工作区，从而隔离知识、记忆、方向、回执和待办。

### ZCode 体验套餐接手示例

Owner 已使用 ZCode 提供的体验套餐验证过一种最轻量的接入方式：直接在 ZCode 中打开已经配置好的 Engine 工作区，声明角色并下达现有任务，Agent 可以读取 `AGENTS.md`、`system.md`、`project.md` 以及工作区内的状态资料，随后沿既有流程继续执行。

这个示例中的“0 修改接手”是指：**为了让 ZCode 接入并理解任务，不需要修改 Engine 协议、Harness 配置或业务代码，也不需要为工具另写适配层**。Agent 接手后的正常需求实现，仍会按任务本身修改获准范围内的项目文件。

示例交互可以保持很短：

```text
角色：执行
任务：读取当前活动方向和已有回执，继续完成尚未满足的验收目标。
```

这项体验验证说明，Engine 的项目上下文和任务状态保存在工作区中，而不是绑定某个特定模型套餐、语言或 IDE。不同 Agent 工具只要能够读取仓库文件并执行获准操作，就可以从同一套结构接手工作。

## 结构说明

| 路径 | 作用 | 主要维护者 |
| --- | --- | --- |
| `project.md` | 当前项目的唯一说明入口：身份、仓库目录、工程规则、启动与验证方式 | 项目接入时配置 |
| `system.md` | 工作区唯一行为宪法：角色入口、协作协议、状态与安全边界 | Admin |
| `roles/` | Planner、Executor、Admin 的完整角色定义 | Admin |
| `knowledge/` | 项目的完整持久知识、当前状态、架构、决策、问题与历史 | Executor |
| `memory/` | 供 Planner 快速恢复上下文的最小摘要 | Planner；终态时按授权同步 |
| `product/` | 按功能保存需求方向、执行回执、验收记录和归档结果 | Planner / Executor 分区协作 |
| `todo/` | 暂不处理事项与需求缺口池 | Planner；按授权同步 |
| `search_task/` | Planner 下发的代码与现状探索任务 | Planner |
| `search_fallback/` | Executor 返回的压缩探索结论 | Executor |
| `.codex/`、`.claude/` | Harness 配置、Hook、终态机器契约与公共校验器 | Admin |
| `AGENTS.md`、`CLAUDE.md` | 不同 Agent Harness 的工作区入口，统一路由到 `system.md` | Admin |

`knowledge/` 保存完整事实，`memory/` 只保留规划所需摘要；`product/` 保留从方向、执行证据到最终验收的完整追溯。Agent 因此可以跨会话恢复，而不依赖聊天窗口中的临时上下文。

## 通用边界

Engine 不预设项目一定包含后端、前端、数据库或编译步骤，也不固化 Java、Vue 或任何特定语言与框架。

- 支持单仓、多仓，以及无传统编译过程的项目；
- 构建、测试、迁移、部署和资源限制均由 `project.md` 或项目工程规则按需声明；
- 未声明的项目动作没有 Engine 级默认命令、默认端口或默认资源参数；
- 终态基线只包含当前项目实际声明并执行的验证项；
- 仓库替换或技术栈变化不会改变角色协议、知识结构和验收流程。

## 完整示例

`develop-sw` 分支是 Smart-WorkFlow/OA 的完整实例，保留该项目的业务知识、记忆、需求方向、回执、待办及历史追溯，可用于理解一个长期、多仓项目如何落地本 Engine。

```bash
git switch develop-sw
```

`main` 保持通用起点；示例实例的业务事实不会进入新项目的初始状态。

## 演进历史

这套结构由一个真实 OA 项目的长期 Agent 协作实践逐步抽取而来。关键提交保留了从实例到通用 Engine 的演进过程：

| 提交 | 演进结果 |
| --- | --- |
| `2b2ca2d` | 将默认分支整理为通用 Agent Coding Engine，并把 OA 实例保留到示例分支 |
| `2bd193e` | 确立根目录即运行工作区，以及 `project.md` 唯一项目说明入口 |
| `d3e85af` | 让 Harness Hook 可从工作区内不同目录稳定定位 Engine 根目录 |
| `7cf6361` | 统一管理员治理，建立通用初始知识库和项目声明制资源约束 |
| `45f2c98` | 完成语言无关、工具链无关的运行时契约与项目声明制收口 |
| `7d59297`、`f80b02c` | 完成方向归档、终态同步和可复核证据收口 |
| `a609783`、`f738cef` | 完成 Owner 确认、远端发布与规划最终确认记录 |

详细方向、回执和验证证据保存在 [`product/p51-agent-coding-engine-decoupling/`](product/p51-agent-coding-engine-decoupling/)。历史用于解释设计来源；当前接入与运行仍以本 README、`project.md`、`system.md` 和 `roles/` 为准。

## 入口导航

- [项目接入模板](project.example.md)
- [唯一行为宪法](system.md)
- [角色定义](roles/)
- [知识库说明](knowledge/README.md)
- [记忆说明](memory/README.md)
- [需求方向与回执说明](product/README.md)
- [探索任务说明](search_task/README.md)
- [探索回执说明](search_fallback/README.md)
- [待办与需求池说明](todo/README.md)
