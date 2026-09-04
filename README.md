# CH-aPaaS

> **示例分支定位**：本分支（`develop-sw`）是 **Agent Coding Engine** 的 CH-aPaaS **示例实例**。
> 它演示一个完整 coding 项目如何使用 Engine 治理协议，并保留本项目全部历史状态、知识、记忆、方向、回执、待办及其追溯关系。
> Engine 通用默认分支为 `main`（不含本实例任何业务事实）；本分支不从属、不反向修改 Engine 的通用定位。

CH-aPaaS 是面向企业协作场景的低代码 PaaS 与 AI Agent 平台。项目以表单和流程为业务主线，将组织权限、通知、任务、文件、设备与智能编排能力组合在同一套工作流中。

本仓库是项目的规划与知识中心；后端服务和前端应用分别位于独立仓库。项目使用者可从这里了解整体能力，开发者可沿仓库导航进入对应工程。

## 项目能力

- 低代码表单：设计、发布、填写和查询业务表单，支持子表与表单引用。
- 流程自动化：定义 BPMN 流程，发起申请，处理待办并查看流程实例。
- 组织与权限：管理用户、部门、角色、菜单、字典和数据访问范围。
- 通用业务服务：提供通知、文件存储和定时任务等平台能力。
- AI Agent 与知识能力：支持会话、工具调用、图编排、Prompt 配置和知识库扩展。
- IoT 接入：连接设备能力与审批流程，承载业务驱动的设备控制场景。

## 三个仓库

| 仓库 | 职责 | 开发入口 |
| --- | --- | --- |
| Smart-WorkFlow-Agent-Workspace（本仓库） | 项目规划、需求方向、回执、架构知识与工作区治理 | [`system.md`](system.md)、[`knowledge/`](knowledge/architecture.md) |
| Smart-WorkFlow-aPaaS-server | Java 后端、数据库、认证授权、业务服务与 API | [`Smart-WorkFlow-Server/README.md`](Smart-WorkFlow-Server/README.md) |
| Smart-WorkFlow-aPaaS-Web | Vue 前端、页面交互、前端架构与 API/Mock 开发模式 | [`Smart-WorkFlow-Web/README.md`](Smart-WorkFlow-Web/README.md) |

典型运行关系如下：

```text
Smart-WorkFlow-aPaaS-Web (:5173)
        |
        | HTTP /api
        v
Smart-WorkFlow-aPaaS-server (:8080/api)
        |
        +-- PostgreSQL 或 H2
        +-- Redis
```

## 快速开始

先克隆工作区仓库并检出实例分支（本示例实例在 `develop-sw`，远端默认 `main` 为通用 Engine，不含本项目内容）：

```bash
git clone --branch develop-sw git@github.com:Chikaaho/Smart-WorkFlow-Agent-Workspace.git
```

```bash
cd Smart-WorkFlow-Agent-Workspace
```

再将后端与前端仓库克隆到工作区根目录，并指定本地目录名以便 README 配套入口可解析：

```bash
git clone git@github.com:Chikaaho/Smart-WorkFlow-aPaaS-server.git Smart-WorkFlow-Server
```

```bash
git clone git@github.com:Chikaaho/Smart-WorkFlow-aPaaS-Web.git Smart-WorkFlow-Web
```

进入对应工程后，按后端或前端 README 准备环境并启动服务：

- [后端环境与启动](Smart-WorkFlow-Server/README.md#快速开始)
- [前端环境与启动](Smart-WorkFlow-Web/README.md#快速开始)

## 与 Agent Coding Engine 的关系

- **Engine 来源**：本实例的治理协议（`system.md`、`roles/`、`.codex/governance/`、Harness 入口）来自 Agent Coding Engine `main` 默认分支。
- **实例边界**：本分支的 `memory/`、`knowledge/`、`product/`、`todo/`、`search_task/`、`search_fallback/` 保存的是 **CH-aPaaS 当前实例**的状态、历史、回执与待办，不与其他项目共享。
- **追溯**：历史回执（`product/*/receipts/`）、状态单一源（`knowledge/current-status.md`）、问题（`knowledge/known-issues.md`）与需求池（`todo/requirement-pool.md`）均在本分支完整保留，可继续追溯。
- **Engine 通用化**：`main` 分支为空白 Engine（不含本实例内容），可作为新项目基线；本项目不把自身状态复制回 Engine 默认内容。

## 分级工作方式

本实例按任务风险选择流程，不再要求所有修改进入完整功能闭环：

| 等级 | 典型任务 | 工作方式 |
| --- | --- | --- |
| S | 按钮、文案、局部 CSS、低风险修正 | Executor 直接修改并聚焦验证 |
| M | 单模块小功能、局部接口或流程调整 | Executor 简版 Plan → Execute → Test |
| L | 新模块、跨仓、重要流程、正式跟踪功能 | Planner 方向 → Executor 实现与证据 → Planner 验收与终态同步 |
| XL | 核心架构、多版本演进、重大迁移 | L 级闭环 + Decision Records + 分阶段验收 |

### 推荐交互流程（可自由扩展）

下面是 L/XL 任务的最小交互骨架。`create` 表示创建对应角色会话，`change` 表示切换到已有会话；不同工具可替换为等价操作。S/M 任务按上表直接执行，不需要套用完整流程。

| 步骤 | 操作 | 用户最小输入 | Agent 自动承接 |
| --- | --- | --- | --- |
| 1 | `create planning` | `你是规划，我的需求是 xxx。` 或 `你是规划，从需求池里取一个最佳需求，并告诉我为什么。` | 读取实例状态与需求资料，确定方向、范围和验收目标 |
| 2 | `create execute` | `你是执行，阅读执行任务并开始执行。` | 定位当前方向，完成实现、验证和回执 |
| 3 | `change planning` | `阅读回执验收。` | 独立审查实现与证据，给出通过或退回结论 |
| 4.1 | `change execute` | `审核退回，读取审查记录修复。` | 修复并更新回执，随后回到步骤 3；允许多轮循环 |
| 4.2 | `change execute` | `审核通过，阅读同步任务并开始执行。` | 读取终态同步任务，完成状态、历史和知识同步 |
| 5 | `change planning` | `阅读回执验收。` | 独立审查终态同步结果 |
| 6.1 | `change execute` | `审核退回，读取审查记录修复。` | 修复同步缺口，随后回到步骤 5；允许多轮循环 |
| 6.2 | `change execute` | `审核通过，推送代码。` | 发布前回显远程、分支、范围和风险，并按授权边界推送 |

用户通常只需在第一步说明需求，后续使用表中的一句话即可；各角色自行读取当前有效的方向、回执、审查记录和同步任务。只有存在多个候选且无法可靠判断时，才请求必要的最小标识。

这是一套参考骨架，用户可以自由增删阶段、增加测试或安全审查、拆分发布批次、替换角色名称并添加新循环；扩展仍需遵守任务自动升级、角色权限、破坏性操作和远程发布边界。

## 文档导航

| 主题 | 文档 |
| --- | --- |
| 工作区治理入口 | [`system.md`](system.md) |
| 整体架构 | [`knowledge/architecture.md`](knowledge/architecture.md) |
| 当前项目状态 | [`knowledge/current-status.md`](knowledge/current-status.md) |
| 需求方向与交付回执 | [`product/`](product/) |
| 后端工程规范 | [`Smart-WorkFlow-Server/docs/governance/engineering-constitution.md`](Smart-WorkFlow-Server/docs/governance/engineering-constitution.md) |
| 前端工程规范 | [`Smart-WorkFlow-Web/docs/governance/engineering-constitution.md`](Smart-WorkFlow-Web/docs/governance/engineering-constitution.md) |
