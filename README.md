# Agent Coding Engine

**简体中文** | [English](README.en.md)

> 本页默认对象是 `main` 分支的通用 Agent Coding Engine：所有相对路径和当前状态表述均属于 `main`。只有明确标注 `develop-sw` 的章节与链接描述 Smart-WorkFlow/OA 示例实例。

一个与具体业务、编程语言和工具链解耦的半自动 Agent Coding Engine。`main` 根目录就是可运行工作区；项目只需在 `project.md` 声明身份、代码仓库目录和工程规则，Agent 即可沿既有治理协议接手任务。

## 分支身份

| 分支 | 唯一定位 | 状态文件含义 |
| --- | --- | --- |
| `main` | 通用 Agent Coding Engine 与新项目起点 | `knowledge/`、`memory/` 的初始值描述尚未接入项目的 Engine 工作区；功能数 `0` 是该初始实例状态 |
| [`develop-sw`](https://github.com/Chikaaho/Smart-WorkFlow-Knowledge/tree/develop-sw) | Smart-WorkFlow/OA 完整示例实例 | 该分支的 `knowledge/`、`memory/`、`product/` 和 `todo/` 承载 OA 项目的架构、产品进度与历史 |

判断项目状态前必须先确认当前分支：

```bash
git branch --show-current
```

Smart-WorkFlow/OA 的产品状态入口是 [`develop-sw/knowledge/current-status.md`](https://github.com/Chikaaho/Smart-WorkFlow-Knowledge/blob/develop-sw/knowledge/current-status.md)；`main/knowledge/current-status.md` 只负责通用 Engine 当前实例的状态。

## 它解决什么问题

Agent Coding Engine 把长期 coding 项目中容易散落的角色权限、任务分级、需求方向、代码探索、执行证据、项目知识和终态同步组织成一个可持续运行的工作区。流程按风险选择：局部小改直接执行，跟踪型功能进入完整闭环。

它被设计为**半自动系统**：Agent 负责读取上下文、探索、规划、实现、验证、记录证据和同步状态；人工保留目标与终止权，可以在任何时候介入：

- 改变需求方向、范围或优先级；
- 暂停或终止当前任务；
- 修改验收目标与证据口径；
- 对功能结果、阶段终态和远程发布作最终裁决。

日常运行不要求人工逐步拆解或持续盯守。只要目标和项目规则已经声明，Agent 会在角色边界内推进到可验收结果；需要改变方向时，人工直接给出新裁决即可。

### 成本经济性：贵模型做决策，快模型跑吞吐

Planner 的输入由 `memory/` 和 `search_fallback/` 压缩，输出集中在需求方向、风险判断和验收裁决，不需要反复吞入完整代码仓或参与高频实现循环。因此 Planner 的调用次数少、输入输出边界清晰，可以把成本很高的超强模型集中用在高杠杆决策上，降低方向错误带来的整轮返工。

Executor 承担大量读码、实现、测试和修复。候选执行模型以 `deepseek-v4-flash`（简称 DS-Flash）的综合能力和非高峰价格为基准；满足以下任一条件即可进入候选池：

- 能力强于 DS-Flash，且同口径任务的综合成本与 DS-Flash 非高峰价格大致相当；
- 综合成本低于 DS-Flash 非高峰价格，且能力与 DS-Flash 大致相当。

候选模型仍需通过项目定义的执行基准，包括任务成功率、测试结果、证据合规、终态契约和返工率。达到这些门槛后，就可以用更高吞吐的 Flash 类模型扩展执行量；S/M 快路径还能进一步减少不必要的规划调用和文档开销。

> 规划用最强模型降低决策错误；执行用达标的 Flash 模型把吞吐拉满——该贵的地方贵，该跑量的地方就把显卡跑到冒烟。

## 工作方式

| 等级 | 典型任务 | 工作方式 |
|---|---|---|
| S | 按钮、文案、局部 CSS、低风险修正 | Executor 直接修改并聚焦验证 |
| M | 单模块小功能、局部接口或流程调整 | Executor 简版 Plan → Execute → Test |
| L | 新模块、跨仓、重要流程、正式跟踪功能 | Planner 方向 → Executor 实现与证据 → Planner 验收与终态同步 |
| XL | 核心架构、多版本演进、重大迁移 | L 级闭环 + Decision Records + 分阶段验收 |

三类 Agent 角色各自保持清晰边界：

| 角色 | 主要职责 |
| --- | --- |
| Planner（规划） | 处理 L/XL：派发探索、确定方向和验收目标、独立验收 |
| Executor（执行） | 判级并执行 S/M/L/XL：实施计划、实现、验证、证据和授权内知识维护 |
| Admin（管理员） | 维护治理协议、工程配置、仓库治理与相关 Git 操作 |

唯一行为宪法是 [`system.md`](system.md)，三类角色的完整权限定义位于 [`roles/`](roles/)。人工的最新明确裁决始终拥有最高优先级。

### 推荐交互流程（可自由扩展）

下面是一套适合 L/XL 任务的最小交互骨架。`create planning`、`create execute` 表示创建对应角色的会话，`change planning`、`change execute` 表示切换回已有会话；如果所用工具的名称不同，替换成对应的创建、切换操作即可。S/M 任务通常不需要走完整闭环，按上表直接执行。

| 步骤 | 操作 | 用户最小输入 | Agent 自动承接 |
| --- | --- | --- | --- |
| 1 | `create planning` | `你是规划，我的需求是 xxx。` 或 `你是规划，从需求池里取一个最佳需求，并告诉我为什么。` | 读取项目现状与需求资料，确定方向、范围和验收目标 |
| 2 | `create execute` | `你是执行，阅读执行任务并开始执行。` | 定位当前执行任务，完成实现、验证和回执 |
| 3 | `change planning` | `阅读回执验收。` | 独立审查实现与证据，给出通过或退回结论 |
| 4.1 | `change execute` | `审核退回，读取审查记录修复。` | 读取最新审查记录，修复并更新回执；随后回到步骤 3，可多轮循环 |
| 4.2 | `change execute` | `审核通过，阅读同步任务并开始执行。` | 读取终态同步任务，完成状态、历史和相关知识同步 |
| 5 | `change planning` | `阅读回执验收。` | 独立审查终态同步结果，给出通过或退回结论 |
| 6.1 | `change execute` | `审核退回，读取审查记录修复。` | 读取最新审查记录，修复同步缺口；随后回到步骤 5，可多轮循环 |
| 6.2 | `change execute` | `审核通过，推送代码。` | 在发布前回显远程、分支、文件范围和风险，并按当前授权边界完成推送 |

```text
create planning → create execute → change planning（实现验收）
                                      ├─ 退回 → change execute（修复）→ 回到实现验收（循环 A）
                                      └─ 通过 → change execute（同步）
                                                   ↓
                                           change planning（同步验收）
                                                   ├─ 退回 → change execute（修复）→ 回到同步验收（循环 B）
                                                   └─ 通过 → change execute（推送）
```

用户通常只需说明第一步的需求，后续用表中的一句话即可，不必重复粘贴任务、回执或审查记录；各角色应自行定位并读取当前有效文件。存在多个候选任务或记录且无法可靠判断时，Agent 才请求必要的最小标识。

这只是推荐骨架，不是固定编排。用户可以在此基础上自由增删阶段、增加测试或安全审查、拆分发布批次、替换角色名称，也可以为自己的项目增加新的循环；扩展时仍需遵守任务自动升级、角色权限、破坏性操作和远程发布等安全边界。

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
| `knowledge/` | 当前 Engine 项目实例的完整持久知识；`main` 保持新项目初始状态 | Executor |
| `memory/` | 当前 Engine 项目实例供 Planner 快速恢复上下文的最小摘要；`main` 保持初始摘要 | Planner；终态时按授权同步 |
| `product/` | 保存 L/XL 需求方向、执行回执、验收记录和归档结果；S/M 默认不进入 | Planner / Executor 分区协作 |
| `todo/` | 暂不处理事项与需求缺口池 | Planner；按授权同步 |
| `search_task/` | Planner 下发的代码与现状探索任务 | Planner |
| `search_fallback/` | Executor 返回的压缩探索结论 | Executor |
| `.codex/`、`.claude/` | Harness 配置、Hook、终态机器契约与公共校验器 | Admin |
| `AGENTS.md`、`CLAUDE.md` | 不同 Agent Harness 的工作区入口，统一路由到 `system.md` | Admin |

项目接入后，`knowledge/` 保存该项目的完整事实，`memory/` 只保留规划所需摘要；`product/` 保留 L/XL 从方向、执行证据到最终验收的完整追溯。S/M 在对话内完成实施计划、验证和结果报告，不制造功能状态。`main` 当前保留通用初始值，新项目从这里建立自己的状态。

## 通用边界

Engine 不预设项目一定包含后端、前端、数据库或编译步骤，也不固化 Java、Vue 或任何特定语言与框架。

- 支持单仓、多仓，以及无传统编译过程的项目；
- 构建、测试、迁移、部署和资源限制均由 `project.md` 或项目工程规则按需声明；
- 未声明的项目动作没有 Engine 级默认命令、默认端口或默认资源参数；
- 终态基线只包含当前项目实际声明并执行的验证项；
- 仓库替换或技术栈变化不会改变角色协议、知识结构和风险分级原则。

## Smart-WorkFlow 示例（仅 `develop-sw`）

[`develop-sw` 分支](https://github.com/Chikaaho/Smart-WorkFlow-Knowledge/tree/develop-sw) 是 Smart-WorkFlow/OA 的完整实例，保留该项目的业务知识、记忆、需求方向、回执、待办及历史追溯，可用于理解一个长期、多仓项目如何落地本 Engine。

- [示例项目说明](https://github.com/Chikaaho/Smart-WorkFlow-Knowledge/blob/develop-sw/README.md)
- [示例系统架构](https://github.com/Chikaaho/Smart-WorkFlow-Knowledge/blob/develop-sw/knowledge/architecture.md)
- [示例当前产品状态](https://github.com/Chikaaho/Smart-WorkFlow-Knowledge/blob/develop-sw/knowledge/current-status.md)

```bash
git switch develop-sw
```

切换到 `develop-sw` 后，仓库内相对链接才指向 OA 示例资料。`main` 始终作为通用 Engine 与新项目起点。

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

## `main` 通用 Engine 导航

以下入口全部属于当前 `main` 分支，不表示 Smart-WorkFlow/OA 的产品进度：

- [项目接入模板](project.example.md)
- [唯一行为宪法](system.md)
- [角色定义](roles/)
- [知识库说明](knowledge/README.md)
- [记忆说明](memory/README.md)
- [需求方向与回执说明](product/README.md)
- [探索任务说明](search_task/README.md)
- [探索回执说明](search_fallback/README.md)
- [待办与需求池说明](todo/README.md)
