# CH-aPaaS

> **示例分支定位**：本分支（`develop-sw`）是 **Agent Coding Engine** 的 CH-aPaaS **示例实例**。
> 它演示一个完整 coding 项目如何使用 Engine 治理协议，并保留本项目全部历史状态、知识、记忆、方向、回执、待办及其追溯关系。
> Engine 通用默认分支为 `main`（不含本实例任何业务事实）；本分支不从属、不反向修改 Engine 的通用定位。

CH-aPaaS 是面向企业协作场景的低代码 PaaS 与 AI Agent 平台。项目以表单和流程为业务主线，将组织权限、通知、任务、文件、设备与智能编排能力组合在同一套工作流中。

本仓库是项目的规划与知识中心；后端服务和前端应用分别位于独立仓库。项目使用者可从这里了解整体能力，开发者可沿仓库导航进入对应工程。

## 当前发布

当前正式版本 **0.2.0**（2026-10-31 发布并交付 UAT）。两仓 tag 与发布 main：Server `0.2.0`→`39dcedb7`（CI run 41097671140 success，`bootstrap-0.2.0.jar` 218,547,155 B sha256 `524cbf2f…`，`build.version=0.2.0`）、Web `0.2.0`→`f5ec5a1`（CI run 41092067995 success，`sw-web-dist-0.2.0.zip` 6,153,509 B，入口 `assets/index-DMDsHDv8.js`）。DB versioned 终点收敛为单一条 `V0.2.0__baseline_seed.sql`（0.1.7 基线 + 0.1.8/0.1.9/0.1.10 增量逐字节收敛）+ 18 支 R__；存量库衔接见 `db/upgrade/0.2.0/README.md`。UAT 由 0.1.10 就地升级：启动 172.021s、ERROR 0、health UP、web 指纹与 CI 制品一致。交付范围与门禁明细见 [`CHANGELOG.md`](CHANGELOG.md) 0.2.0 条目与 [`product/0.2.0/receipts/u020-36-release-delivery.md`](product/0.2.0/receipts/u020-36-release-delivery.md)。


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
| Smart-WorkFlow-aPaaS-server | Java 后端、数据库、认证授权、业务服务与 API | [`Smart-WorkFlow-aPaaS-server/README.md`](Smart-WorkFlow-aPaaS-server/README.md) |
| Smart-WorkFlow-aPaaS-Web | Vue 前端、页面交互、前端架构与 API/Mock 开发模式 | [`Smart-WorkFlow-aPaaS-Web/README.md`](Smart-WorkFlow-aPaaS-Web/README.md) |

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

再将后端与前端仓库克隆到工作区根目录；本地目录名与远端仓库同名，工作区各文档中的相对路径按该目录名解析：

```bash
git clone git@github.com:Chikaaho/Smart-WorkFlow-aPaaS-server.git Smart-WorkFlow-aPaaS-server
```

```bash
git clone git@github.com:Chikaaho/Smart-WorkFlow-aPaaS-Web.git Smart-WorkFlow-aPaaS-Web
```

进入对应工程后，先读仓库 README 了解产品定位，再按各仓工程宪法与工作区开发流程准备环境、启动服务并执行验证（命令导航见 [`knowledge/development-workflow.md`](knowledge/development-workflow.md)）：

- 后端：[仓库 README](Smart-WorkFlow-aPaaS-server/README.md) · [工程宪法](Smart-WorkFlow-aPaaS-server/docs/governance/engineering-constitution.md)
- 前端：[仓库 README](Smart-WorkFlow-aPaaS-Web/README.md) · [工程宪法](Smart-WorkFlow-aPaaS-Web/docs/governance/engineering-constitution.md)

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

### 需求交付入口

默认交付流程、持续授权、版本确认和结束条件统一见 [`system.md` §3.0](system.md#30-默认需求交付生命周期owner-2026-10-16-确认)。上表描述分级实施与验证；L/XL 功能验收和终态同步只是整体交付中的子任务。

用户在需求入口声明唯一会话角色，各角色读取当前有效方向、回执和同步任务后按授权连续推进。角色职责与切换遵循 [`system.md` §0](system.md#0-角色定位与入口)，补证与复核遵循 [`system.md` §3.6](system.md#36-验收与证据硬约束2026-10-11-owner-定)。

## 文档导航

| 主题 | 文档 |
| --- | --- |
| 工作区治理入口 | [`system.md`](system.md) |
| 整体架构 | [`knowledge/architecture.md`](knowledge/architecture.md) |
| 当前项目状态 | [`knowledge/current-status.md`](knowledge/current-status.md) |
| 发布说明与历史版本 | [`CHANGELOG.md`](CHANGELOG.md) |
| 需求方向与交付回执 | [`product/`](product/) |
| 后端工程规范 | [`Smart-WorkFlow-aPaaS-server/docs/governance/engineering-constitution.md`](Smart-WorkFlow-aPaaS-server/docs/governance/engineering-constitution.md) |
| 前端工程规范 | [`Smart-WorkFlow-aPaaS-Web/docs/governance/engineering-constitution.md`](Smart-WorkFlow-aPaaS-Web/docs/governance/engineering-constitution.md) |
