# Agent Coding Engine

> 通用治理与知识仓库。本分支（`main`）是 Agent Coding Engine 的通用默认分支，根目录即标准工作区；
> 不预置任何具体 coding 项目的业务状态、记忆或方向；项目通过**唯一项目说明入口**（`project.md`）
> 声明 coding 仓库与工程规则后，即可在本工作区内按统一协议运行。

## 定位

Agent Coding Engine 提供一套**与具体业务解耦的工作区治理协议**，供 coding 项目复用：

- **角色与工作流协议**：规划 / 执行 / 管理员三角色的会话门禁、权限边界与三阶段工作流（`system.md`、`roles/`）
- **终态机器契约**：执行行为验证与终态判定（`.codex/governance/`）
- **通用 Harness 入口**：Claude / Codex 的入口、Hook 与模板
- **标准工作区目录骨架**：`memory/`、`knowledge/`、`product/`、`todo/`、`search_task/`、`search_fallback/` 的用途、初始化与项目接入说明

本分支默认内容**不预置**任何具体项目的业务事实：

- 不包含具体产品名称、业务模块、P/I 编号或功能状态
- 不硬编码后端 / 前端仓库名、端口、迁移版本、测试计数、构建基线或本机资源条件
- 不携带只对某个实例成立的知识、记忆、方向、回执、问题和待办

## 接入一个新的 coding 项目（最短配置）

`main` 根目录本身就是可直接运行的标准工作区，**不需要复制目录或运行生成器**。接入一个项目只需完成两个步骤：

1. 复制 `project.example.md` 为 `project.md`，填写：
   - 项目名称、目标与非目标；
   - coding 仓库目录列表及每个仓库的职责（单仓/多仓）——**只在这里声明代码仓**，Engine 不内置固定仓名、端口、技术栈或测试基线；
   - 必要工程规则入口、启动方式和验证入口。
2. 依据 `system.md` 与 `roles/` 进入会话角色门禁，按三阶段工作流推进需求。

项目接入后，标准 `knowledge/`、`memory/`、`product/`、`todo/`、`search_task/`、`search_fallback/` 由 Engine 统一管理；其中产生的状态、历史、回执和待办属于当前项目实例，不同项目通过**独立 Engine 工作区**隔离，不交叉读取或复用。删除或替换某个 coding 仓库不破坏 Engine 协议、治理契约或历史状态文件。

> 完整示例见 `develop-sw`（Smart-WorkFlow/OA 示例分支）。

## 示例分支

`develop-sw` 是 **Smart-WorkFlow / OA 示例分支**，展示一个完整实例如何使用本 Engine 的治理协议：

- 它是 Smart-WorkFlow / OA 项目的完整实例，保留实例知识、记忆、方向、回执、待办及历史追溯关系。
- 它反向说明示例实例如何接入 Engine，且不反向改变 `main` 的通用定位。

```bash
# 查看 OA 示例完整用法
git checkout develop-sw
```

## Harness 入口

- 根入口：`AGENTS.md`（Codex）、`CLAUDE.md`（Claude），均路由到唯一行为宪法 `system.md`
- 终态契约与公共 Validator：`.codex/governance/`
- 本 Engine 的所有路径解析均采用相对定位，不依赖特定本机绝对路径

## 目录骨架

```
system.md            工作区宪法入口（角色入口 + 公共协作协议；管理员维护）
roles/               角色定义文件（planner / executor / admin；管理员维护，其他角色只读）
memory/              压缩记忆（规划角色快读入口，实例接入后由 Engine 统一管理）
knowledge/           完整知识库（执行角色维护）
product/             需求方向与回执仓库（按功能组织）
todo/                暂不修复清单 + 需求缺口池
search_task/         探索任务（规划角色下发）
search_fallback/     探索结果（执行角色写入）
.codex/ .claude/     通用 Harness 入口、配置与 Hook
project.md           项目说明入口（由项目实例填写）
```

> 具体目录用途、初始化与项目接入说明见 `system.md`。