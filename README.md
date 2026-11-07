# CH-aPaaS

> **示例分支定位**：本分支（`develop-sw`）是 **Agent Coding Engine** 的 CH-aPaaS **示例实例**。
> 它演示一个完整 coding 项目如何使用 Engine 治理协议，并保留本项目全部历史状态、知识、记忆、方向、回执、待办及其追溯关系。
> Engine 通用默认分支为 `main`（不含本实例任何业务事实）；本分支不从属、不反向修改 Engine 的通用定位。

CH-aPaaS 是面向企业协作场景的低代码 PaaS 与 AI Agent 平台。项目以表单和流程为业务主线，将组织权限、通知、任务、文件、设备与智能编排能力组合在同一套工作流中。

本仓库是项目的规划与知识中心；后端服务和前端应用分别位于独立仓库。项目使用者可从这里了解整体能力，开发者可沿仓库导航进入对应工程。

## 当前发布

当前正式版本 **0.3.1**（2026-11-08 发布并部署 UAT；审批意见/流程变量/脚本驱动流转返修——Owner 2026-11-07 退回 0.3.0 后返修，0.3.0 tag/Release 未改动）。三个示例流程关键流转由审批意见驱动：意见字段写入流程变量（`opinion`/`opinion_<字段>`/`formData` 回写），CONDITION 引用 `opinion_*`/`opinionAgg_*`/`responseOverdue`/`sensorSuspect` 分流；参与人取意见人员字段（现场处置人/指派维修人/现场总指挥）；灾备流程会签聚合（最长停机 >240 分钟或影响系统 ≥5 → 分管副总）、总公司「调整窗口」时定时 MQTT 预约改用意见新时间；校园出口误报结束/超时督办/上报学校、MES 偏差强制校准/设备维修/停机复产。UAT 8 条意见驱动路径全部 APPROVED（每流程 ≥2）。发布：Server tag `0.3.1`→main `452178d8`（CI success，`bootstrap-0.3.1.jar` 220,861,064 B sha256 `9379195e…`，`build.version=0.3.1` 实测），Web 无改动保持 0.3.0；UAT 部署 health UP、Flyway v0.2.9（无新增迁移），配置同步 17 张意见表单/三图重建发布/2 条触发器/角色修正（技术委员会 3 人、应急负责人王芳）。功能数保持 **51**（不登记新功能），交付登记 [`knowledge/features/0.3.1-approval-driven-flow.md`](knowledge/features/0.3.1-approval-driven-flow.md)，回执 [`product/three-sample-process-uat/receipts/execution-final-04.md`](product/three-sample-process-uat/receipts/execution-final-04.md)；应用包 UAT 导出覆盖 [`product/three-sample-process-uat/assets/`](product/three-sample-process-uat/assets/)（不含独立意见表单定义、触发器脚本、Agent 图与 IoT 规则，见该目录 README）。

## 历史发布

- **0.2.4**（2026-11-06）：README 示例二/三落地（IoT 规则启动 Agent 研判、失败升级、Agent 内部工具、渠道凭据密文；第 51 个正式功能）。Server tag `0.2.4`→`41511bd4`（`bootstrap-0.2.4.jar` 220,856,383 B sha256 `1c73a5ee…`）、Web `0.2.4`→`f4acc3d`（`sw-web-dist-0.2.4.zip` 6,194,537 B sha256 `b40cf483…`，入口 `assets/index-egL2MRAT.js`）；UAT 启动 176.906s、Flyway v0.2.9。见 [`product/0.2.4/receipts/execution-release-024-02.md`](product/0.2.4/receipts/execution-release-024-02.md)。
- **0.2.3**（2026-11-06）：Agent 执行生命周期（异步受理/持久回查/afterSequence 续传/取消与重启恢复/三协议流式/两 Key 轮换，现有能力增强）。Server tag `0.2.3`→`9b86ff0d`、Web `0.2.3`→`47106e8`；UAT Flyway v0.2.7。见 [`product/0.2.3/receipts/execution-release-023-08.md`](product/0.2.3/receipts/execution-release-023-08.md)。


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
