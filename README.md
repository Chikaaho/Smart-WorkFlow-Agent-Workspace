# Smart-WorkFlow

> **示例分支定位**：本分支（`develop-sw`）是 **Agent Coding Engine** 的 Smart-WorkFlow/OA **示例实例**。
> 它演示一个完整 coding 项目如何使用 Engine 治理协议，并保留本项目全部历史状态、知识、记忆、方向、回执、待办及其追溯关系。
> Engine 通用默认分支为 `main`（不含本实例任何业务事实）；本分支不从属、不反向修改 Engine 的通用定位。

Smart-WorkFlow 是面向企业协作场景的低代码 OA 与 AI Agent 平台。项目以表单和流程为业务主线，将组织权限、通知、任务、文件、设备与智能编排能力组合在同一套工作流中。

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
| Smart-WorkFlow-Knowledge（本仓库） | 项目规划、需求方向、回执、架构知识与工作区治理 | [`system.md`](system.md)、[`knowledge/`](knowledge/architecture.md) |
| Smart-WorkFlow-Server | Java 后端、数据库、认证授权、业务服务与 API | [`Smart-WorkFlow-Server/README.md`](Smart-WorkFlow-Server/README.md) |
| Smart-WorkFlow-Web | Vue 前端、页面交互、前端架构与 API/Mock 开发模式 | [`Smart-WorkFlow-Web/README.md`](Smart-WorkFlow-Web/README.md) |

典型运行关系如下：

```text
Smart-WorkFlow-Web (:5173)
        |
        | HTTP /api
        v
Smart-WorkFlow-Server (:8080/api)
        |
        +-- PostgreSQL 或 H2
        +-- Redis
```

## 快速开始

先克隆知识仓库：

```bash
git clone git@github.com:Chikaaho/Smart-WorkFlow-Knowledge.git
```

```bash
cd Smart-WorkFlow-Knowledge
```

再将后端与前端仓库放入工作区根目录：

```bash
git clone git@github.com:Chikaaho/Smart-WorkFlow-Server.git
```

```bash
git clone git@github.com:Chikaaho/Smart-WorkFlow-Web.git
```

进入对应工程后，按后端或前端 README 准备环境并启动服务：

- [后端环境与启动](Smart-WorkFlow-Server/README.md#快速开始)
- [前端环境与启动](Smart-WorkFlow-Web/README.md#快速开始)

## 与 Agent Coding Engine 的关系

- **Engine 来源**：本实例的治理协议（`system.md`、`roles/`、`.codex/governance/`、Harness 入口）来自 Agent Coding Engine `main` 默认分支。
- **实例边界**：本分支的 `memory/`、`knowledge/`、`product/`、`todo/`、`search_task/`、`search_fallback/` 保存的是 **Smart-WorkFlow/OA 当前实例**的状态、历史、回执与待办，不与其他项目共享。
- **追溯**：历史回执（`product/*/receipts/`）、状态单一源（`knowledge/current-status.md`）、问题（`knowledge/known-issues.md`）与需求池（`todo/requirement-pool.md`）均在本分支完整保留，可继续追溯。
- **Engine 通用化**：`main` 分支为空白 Engine（不含本实例内容），可作为新项目基线；本项目不把自身状态复制回 Engine 默认内容。

## 文档导航

| 主题 | 文档 |
| --- | --- |
| 工作区治理入口 | [`system.md`](system.md) |
| 整体架构 | [`knowledge/architecture.md`](knowledge/architecture.md) |
| 当前项目状态 | [`knowledge/current-status.md`](knowledge/current-status.md) |
| 需求方向与交付回执 | [`product/`](product/) |
| 后端工程规范 | [`Smart-WorkFlow-Server/docs/governance/engineering-constitution.md`](Smart-WorkFlow-Server/docs/governance/engineering-constitution.md) |
| 前端工程规范 | [`Smart-WorkFlow-Web/docs/governance/engineering-constitution.md`](Smart-WorkFlow-Web/docs/governance/engineering-constitution.md) |