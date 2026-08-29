# Smart-WorkFlow · 工作区根

> Smart-WorkFlow 低代码 OA + AI Agent 平台的**规划与知识管理中心**。
> 本仓库承载三类会话角色（规划 / 执行 / 管理员）的统一入口、需求方向与回执归档、压缩记忆与完整知识库；业务实现位于两个 executor sublayer。
> 项目用户是 **Owner**，对项目目标、优先级、范围、治理规则、角色授权、验收与发布拥有最终自由裁量权；规范定义见 [`system.md`](system.md) §0.0。

---

## 项目定位

Smart-WorkFlow 是一个**低代码 OA + AI Agent 平台**：

- **低代码表单引擎**：表单设计器拖拽建模，提交数据落动态宽表（每表单一张物理表），支持引用与子表关系。
- **流程自动化（BPM）**：BPMN 流程定义、表单绑定、发起/待办/审批/实例监控，端到端审批流转。
- **AI Agent 与 IoT**：Agent 图编排、模型与工具管理已立项；IoT 已交付最小腾讯云接入（详见后端 README 的模块边界）。
- **统一治理**：三仓以工作区根为唯一宪法入口，规划/执行/管理员三角色分权协作。

当前已通过 **第一轮最小闭环验收审计**：能在真实页面上完成用户与组织配置、角色授权、表单及流程管理、表单提交、流程实例创建、待办审批和结果回看（详见下方「当前状态快照」）。

---

## 三仓关系

| 仓库 | 定位 | Git URL |
|------|------|---------|
| **Smart-WorkFlow-Knowledge**（本仓） | 规划与知识管理：宪法、角色、需求方向、回执、压缩记忆、完整知识库 | `git@github.com:Chikaaho/Smart-WorkFlow-Knowledge.git` |
| **Smart-WorkFlow** | 后端 API 服务（Java 21 模块化单体），见其 [`README`](Smart-WorkFlow/README.md) | `git@github.com:Chikaaho/Smart-WorkFlow.git` |
| **Smart-WorkFlow-Web** | 前端 SPA（Vue 3 + TypeScript），见其 [`README`](Smart-WorkFlow-Web/README.md) | `git@github.com:Chikaaho/Smart-WorkFlow-Web.git` |

```
Smart-WorkFlow-Knowledge/   ← 规划层（宪法 / 方向 / 回执 / 知识库 / 记忆）
├── Smart-WorkFlow/         ← 后端代码（Java 21 + Spring Boot 3.4，:8080/api）
└── Smart-WorkFlow-Web/     ← 前端代码（Vue 3 + TS + Vite，:5173）
```

- 从工作区根目录可跨三层执行；进入子仓则受该仓边界约束（见 `system.md` §0.3）。
- 本仓内嵌的 `Smart-WorkFlow/`、`Smart-WorkFlow-Web/` 是各自独立的 Git 仓库（各自有 `.git`），按需单独克隆或复用本地路径。

---

## 快速开始

```bash
# 1. 克隆知识仓
git clone git@github.com:Chikaaho/Smart-WorkFlow-Knowledge.git
cd Smart-WorkFlow-Knowledge

# 2. 按需克隆代码仓（通常放置于本仓同级的 Smart-WorkFlow/ 与 Smart-WorkFlow-Web/ 目录）
git clone git@github.com:Chikaaho/Smart-WorkFlow.git
git clone git@github.com:Chikaaho/Smart-WorkFlow-Web.git
```

新参与者的**推荐入口顺序**：

1. 读本仓 [`system.md`](system.md) 了解三种会话角色与治理入口（只读导航，规则正文在 `system.md` 与 `roles/`）。
2. 读 [`memory/`](memory/README.md) 了解当前状态摘要，[`knowledge/current-status.md`](knowledge/current-status.md) 为当前状态唯一权威。
3. 读后端 [`Smart-WorkFlow/README.md`](Smart-WorkFlow/README.md) 或前端 [`Smart-WorkFlow-Web/README.md`](Smart-WorkFlow-Web/README.md) 进入对应开发仓。

---

## 目录结构

```
knowledge-root/
├── system.md               — 工作区唯一行为宪法（角色 / 权限 / 工作流 / Git 治理入口）
├── roles/                  — 规划 / 执行 / 管理员角色定义（管理员角色维护，其他角色只读）
├── memory/                 — 压缩记忆（规划角色读/写，从 knowledge 压缩而来）
│   ├── README.md           — 索引 + 阅读顺序
│   ├── state.md            — 当前状态摘要
│   ├── handoff.md          — 会话交接摘要
│   ├── features.md         — 功能摘要
│   ├── decisions.md        — 近期有效决策摘要
│   ├── issues.md           — 未关闭项摘要
│   ├── constraints.md      — 必要硬约束摘要
│   └── architecture.md     — 架构摘要
├── knowledge/              — 完整知识库（执行角色读写；规划角色只读摘要层）
│   ├── current-status.md   — 项目当前状态（唯一权威，最新快照）
│   ├── session-handoff.md  — 跨会话交接详情
│   ├── known-issues.md     — 已知问题注册表（I 编号）
│   ├── decisions.md        — 决策档案（D 编号）
│   ├── architecture.md     — 完整架构描述
│   ├── shared-constraints.md — 跨项目共享约束
│   ├── features/           — 功能追踪文件（每功能一个）
│   └── history/            — 历史快照归档（只追加，不回写为当前入口）
├── product/                — 需求方向与回执仓库（按功能组织）
│   └── <feature-name>/
│       ├── ready/          — 待执行或待复核的方向文档
│       ├── receipts/       — 执行 / 测试 / 审查 / 终态同步回执（追加保留）
│       └── passed/         — 已由规划角色确认通过并归档的方向文档
├── search_task/            — 探索任务委派（规划 → 执行）
├── search_fallback/        — 探索结果回传（执行 → 规划）
├── todo/                   — 暂不修复清单（决策依据 + 问题编号索引）
├── Smart-WorkFlow/         — 后端代码（独立 Git 仓库）
└── Smart-WorkFlow-Web/     — 前端代码（独立 Git 仓库）
```

---

## 核心架构

```
Smart-WorkFlow-Web (Vue 3 + TS, :5173)
       │ HTTP /api（Vite 代理 → :8080）
       ▼
Smart-WorkFlow (Java 21 + Spring Boot 3.4, :8080, context /api)
       │
       ▼
PostgreSQL（生产 / local）/ H2（开发内存）
```

- **后端**：四层模块化单体——`sw-framework`（common/security）→ `sw-basic`（storage/notify/job/iot/knowledge/agent）→ `sw-biz`（system/form/bpm/openapi）→ `sw-bootstrap`（唯一启动入口），依赖自上而下不可反向。
- **前端**：严格分层 SPA——`contracts/` → `foundation/` → `security/` → `adapters/` → `modules/`（含 `components/`/`layouts/` → `router/` → `stores/`），ESLint 强制架构边界。
- 详细架构：后端见 `Smart-WorkFlow/docs/governance/engineering-constitution.md` 与 [`knowledge/architecture.md`](knowledge/architecture.md)；前端见 `Smart-WorkFlow-Web/docs/governance/engineering-constitution.md`。

---

## 会话角色导航

本工作区采用 **规划 / 执行 / 管理员** 三角色治理（完整规则见 [`system.md`](system.md) 与 `roles/`，此处仅导航，不复制条款）：

- **规划（Planner）**：读 `memory/` + `search_fallback/` + `product/`；写 `memory/`、`search_task/`、`product/`、`todo/`；不读代码与 `knowledge/`，不做实现。
- **执行（Executor）**：读全部目录 + 两端代码；写 `knowledge/`、`search_fallback/`、`product/` 回执、两端代码；编译/测试命令须带 2G 内存上限且前后端互斥。
- **管理员（Admin）**：维护 `system.md`、`roles/`、架构文档与工程配置；执行管理员相关 Git 操作；不参与业务规划/实现。

会话开始必须先由用户声明角色；未声明角色不执行任何任务。当前角色由每次会话开始时声明，会话内不自动变更。

---

## 当前状态快照

> 权威细节以 [`knowledge/current-status.md`](knowledge/current-status.md) 为准，本快照只作入口导航，不复制完整清单。

- **已完成正式功能**：36
- **功能清单**：✅32 / 🟦25 / ⬜33（10 模块、55 功能、90 明细）
- **第一轮最小闭环验收审计**：`COMPLETED（已确认）`（现有能力验收审计，不新增正式功能）
- **后端测试基线**：955 / Failures 0 / Errors 0 / Skipped 0（agent 346）
- **前端测试基线**：110 spec files / 1060 tests / 0 skipped（typecheck / lint / test / build 全绿）
- **迁移基线**：Flyway H2 V44（44 migrations）/ PostgreSQL V44（43 migrations）

---

## 通用校验命令

### 后端

```bash
cd Smart-WorkFlow
MAVEN_OPTS="-Xmx2g" mvn -q compile && MAVEN_OPTS="-Xmx2g" mvn -q test   # 校验门
```

### 前端

```bash
cd Smart-WorkFlow-Web
NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck && \
NODE_OPTIONS="--max-old-space-size=2048" pnpm lint && \
NODE_OPTIONS="--max-old-space-size=2048" pnpm test && \
NODE_OPTIONS="--max-old-space-size=2048" pnpm build                     # 四连校验门
```

> ⚠️ 后端 `mvn` 一律带 `MAVEN_OPTS="-Xmx2g"`，前端 `pnpm`/`npm` 一律带 `NODE_OPTIONS="--max-old-space-size=2048"`；**前后端编译互斥**（编译前需检测对方是否在编译，见 `knowledge/shared-constraints.md` §9）。

---

## 权威文档导航

| 需求 | 入口 |
|------|------|
| 角色 / 授权 / 工作流 / Git 治理 | [`system.md`](system.md) |
| 规划 / 执行 / 管理员角色定义 | [`roles/`](roles/planner.md)（planner / executor / admin） |
| 当前功能状态（唯一权威） | [`knowledge/current-status.md`](knowledge/current-status.md) |
| 完整知识库与历史 | [`knowledge/`](knowledge/architecture.md) |
| 需求方向与回执 | [`product/`](product/) |
| 后端工程宪法 / 前端工程宪法 | `Smart-WorkFlow/docs/governance/engineering-constitution.md` / `Smart-WorkFlow-Web/docs/governance/engineering-constitution.md` |
| 跨项目共享约束 | [`knowledge/shared-constraints.md`](knowledge/shared-constraints.md) |