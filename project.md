# 项目说明（project.md）

> 本文件是 CH-aPaaS 示例实例接入 Agent Coding Engine 的**项目说明入口**。
> 本实例通过本文件声明身份、目标、仓储关系、工程规则与实例生命周期；治理协议以 `system.md` 与 `roles/` 为准。

## 1. 项目身份

- **项目名称**：CH-aPaaS
- **一句话目标**：面向企业协作场景的低代码 PaaS 与 AI Agent 平台，以表单和流程为业务主线，组合组织权限、通知、任务、文件、设备与智能编排能力。
- **非目标**：不面向非企业协作场景；不引入与本平台无关的通用业务；不将当前 PaaS 实例的事实复制回 Engine 通用默认内容。

## 2. 仓储关系

- **单仓 / 多仓**：multi
- **代码仓列表**：
  | 仓库 | 职责 | 开发入口 |
  |------|------|----------|
  | Smart-WorkFlow-Agent-Workspace（本仓库） | 项目规划、需求方向、回执、架构知识与工作区治理 | `system.md`、`knowledge/` |
  | Smart-WorkFlow-sPaaS-server | Java 后端、数据库、认证授权、业务服务与 API | `Smart-WorkFlow-Server/README.md` |
  | Smart-WorkFlow-aPaaS-Web | Vue 前端、页面交互、前端架构与 API/Mock 开发模式 | `Smart-WorkFlow-Web/README.md` |

## 3. 工程规则

- **必要工程约束**：后端 `mvn` 命令一律带 `MAVEN_OPTS="-Xmx2g"`；前端 `pnpm`/`npm` 命令一律带 `NODE_OPTIONS="--max-old-space-size=2048"`；前后端编译互斥（`knowledge/shared-constraints.md` §9）；动态宽表裸 SQL 红线等共享约束见 `knowledge/shared-constraints.md`。
- **启动方式**：后端 `sw-bootstrap` 按 `dev`（H2 内存）/`local`（PostgreSQL）profile 启动；前端 `pnpm dev`（直连后端）或 `pnpm dev:mock`（MSW 拦截）。
- **验证入口**：后端 `mvn test` 与 `mvn install`；前端 `pnpm typecheck && pnpm lint && pnpm test && pnpm build`；终态由 `.codex/governance/validate-terminal.*` 校验。

## 4. 实例数据与生命周期

- **实例数据初始化位置**：`memory/`（压缩记忆）、`knowledge/`（完整知识库，含 `current-status.md`/`features/`/`known-issues.md`/`evidence/`）、`product/`（需求方向与回执）、`todo/`（暂不修复清单 + 需求池）、`search_task/`、`search_fallback/`（探索通道）。
- **实例生命周期边界**：本分支为 CH-aPaaS 示例实例，`develop-sw` 承载当前实例全部状态与历史；制定是否长期维护或作为迁移快照的决策权归 Owner。

## 5. 关联 Engine

- **Engine 来源**：Agent Coding Engine `main` 默认分支（不含本实例业务事实）。
- **同步策略**：实例通过跟踪 Engine `main` 的通用协议变更（如 `system.md`、`roles/`、`.codex/governance/` 的更新）保持与 Engine 一致；本实例不回写业务状态到 Engine。