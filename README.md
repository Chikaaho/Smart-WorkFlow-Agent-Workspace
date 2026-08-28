# Smart-WorkFlow Knowledge Base

> Smart-WorkFlow 低代码 OA + AI Agent 平台的**规划与知识管理中心**。
> 本仓库负责宪法、角色入口、需求方向、回执归档与跨项目知识管理；业务实现位于两个 executor sublayer。
> 项目用户是 **Owner**，对项目目标、优先级、范围、治理规则、角色授权、验收与发布拥有最终自由裁量权；规范定义见 `system.md` §0.0。

---

## 工作区演变轨迹

1. **Web 规划 + 双仓执行**：最初使用 Claude Web 负责方案，后端与前端两个代码仓库分别使用 Claude Code 执行。
2. **引入 `knowledge/`**：Claude 账号被封后，在两个代码仓库的同级新建知识工作区，用 `knowledge/` 持续维护跨仓文档。
3. **引入 `product/`**：为解决方案和执行结果在会话间反复复制粘贴的问题，增加 `product/` 承接需求方向、执行回执与验收归档。
4. **上提统一执行根目录**：为避免在三个 Claude Code 会话间来回切换，将执行入口上提一层，使根工作区可统一协调知识层、后端与前端。
5. **区分 `planning` / `execute`**：上下文快速膨胀后，将需求方向与实现执行分离，形成一个规划角色和一个执行角色。
6. **压缩规划上下文**：规划需要高级模型，但直接读取代码和完整 `knowledge/` 的输入仍过大，因此新增 `memory/`、`search_task/` + `search_fallback/` 与 `todo/`，用压缩记忆、委派探索和待办索引缩小规划可读范围。
7. **新增 `admin`**：增加仅负责宪法、架构文档、工程配置与仓库治理的管理员角色，防止规划和执行角色越权。
8. **解耦 Harness**：将唯一行为宪法从 `CLAUDE.md` 迁移为 `system.md`，Claude Code、Codex 及其他 Harness 的入口文件只负责指向 `system.md`。
9. **固化每轮收尾**：优化规划步骤，要求每轮任务收尾时同步完整 `knowledge/` 并压缩 `memory/`，使权威信息与下轮最小上下文保持一致。
10. **拆分角色规范**：随着 `system.md` 日渐膨胀，新增 `roles/`；`system.md` 收缩为公共规范门禁和角色规范索引，各角色认领后再读取对应定义。

---

## 快速开始（换机即用）

```bash
# 1. 克隆知识库
git clone git@github.com:Chikaaho/Smart-WorkFlow-Knowledge.git
cd Smart-WorkFlow-Knowledge

# 2. 按需拉取代码仓库
git clone git@github.com:Chikaaho/Smart-WorkFlow.git
git clone git@github.com:Chikaaho/Smart-WorkFlow-Web.git
```

三个仓库的关系：

```
Smart-WorkFlow-Knowledge/   ← 你在这里（规划层：方案/回执/知识库）
├── Smart-WorkFlow/         ← 后端代码（Java 21 + Spring Boot 3.4）
└── Smart-WorkFlow-Web/     ← 前端代码（Vue 3 + TypeScript + Vite）
```

---

## 仓库链接

| 仓库 | 用途 | Git URL |
|------|------|---------|
| **Smart-WorkFlow-Knowledge** | 规划与知识管理（本仓库） | `git@github.com:Chikaaho/Smart-WorkFlow-Knowledge.git` |
| **Smart-WorkFlow** | 后端 API 服务 | `git@github.com:Chikaaho/Smart-WorkFlow.git` |
| **Smart-WorkFlow-Web** | 前端 SPA | `git@github.com:Chikaaho/Smart-WorkFlow-Web.git` |

---

## 目录结构

```
Smart-WorkFlow-Knowledge/
├── system.md                  — 工作区唯一行为宪法（角色/权限/工作流入口）
├── roles/                     — 规划 / 执行 / 管理员角色定义
├── memory/                    — 压缩记忆（规划角色读/写，每次会话关键节点更新）
│   ├── README.md              — 索引 + 阅读顺序
│   ├── state.md               — 当前状态（功能/Step/测试基线）
│   ├── handoff.md             — 最新会话交接
│   ├── features.md            — 功能索引表
│   ├── decisions.md           — 最近 10 条活跃设计决策
│   ├── issues.md              — 未关闭问题
│   ├── constraints.md         — 硬约束速查
│   └── architecture.md        — 架构高层视图
├── knowledge/                 — 完整知识库（执行角色探索用）
│   ├── current-status.md      — 项目整体状态（唯一可信来源）
│   ├── decisions.md           — 决策档案（D1-D46 历史详情；D47+ 活跃决策见 memory/decisions.md）
│   ├── architecture.md        — 完整架构描述
│   ├── shared-constraints.md  — 跨项目共享约束
│   ├── known-issues.md        — 已知问题完整记录
│   ├── session-handoff.md     — 跨会话交接详情
│   ├── model-registry.md      — 角色注册表
│   └── features/              — 功能追踪文件（每功能一个）
├── product/                   — 执行方案仓库（原始记忆）
│   └── <feature-name>/
│       ├── ready/             — 待执行方案
│       ├── passed/            — 已通过归档
│       └── receipts/          — 执行/测试回执
├── search_task/               — 探索任务委派
├── search_fallback/           — 探索结果回传
├── todo/                      — 暂不修复清单
├── Smart-WorkFlow/            — 后端代码（git submodule 或独立 clone）
└── Smart-WorkFlow-Web/        — 前端代码（git submodule 或独立 clone）
```

---

## 架构总览

```
Smart-WorkFlow-Web (Vue 3 + TS, :5173)
       │ HTTP /api
       ▼
Smart-WorkFlow (Java 21 + Spring Boot, :8080)
       │
       ▼
PostgreSQL (生产) / H2 (开发)
```

**后端**：4 层模块化单体 — `sw-framework` → `sw-basic` → `sw-biz` → `sw-bootstrap`，依赖自上而下不可反向。

**前端**：严格分层 SPA — `contracts/` → `foundation/` → `security/` → `adapters/` → `modules/`，ESLint 强制架构边界。

---

## 项目状态

| 维度 | 状态 |
|------|------|
| 已完成功能 | **32** COMPLETED ✅ |
| 后端测试 | 827 tests（0 failures） |
| 前端测试 | 100 spec files / 988 tests（0 failures、0 skipped） |
| Walking Skeleton | 登录→表单→审批→通知 四环闭合 ✅ |

---

## 工作流

本工作区采用 **规划 / 执行 / 管理员** 三角色治理：

1. **规划角色**：读取压缩记忆、委派探索、制定需求方向、验收回执。
2. **执行角色**：按需求方向自主拆分 Step、实现、验证并提交 `EXECUTION_SUBMITTED`；规划通过后执行授权的终态同步。
3. **管理员角色**：维护宪法、角色定义、架构文档和工程治理配置，不参与业务规划或实现。
4. **阶段三**：规划角色裁决 `PASSED`，执行角色按唯一终态值清单落值，规划角色全文复核后确认 `COMPLETED`。

本 README 只作项目说明；角色、授权、当前状态和执行终态以 `system.md`、`roles/`、知识库当前状态和对应工程宪法为准。

详见 [`system.md`](system.md)。

---

## 校验命令

### 后端

```bash
cd Smart-WorkFlow
MAVEN_OPTS="-Xmx2g" mvn -q compile && MAVEN_OPTS="-Xmx2g" mvn -q test     # 校验门
```

### 前端

```bash
cd Smart-WorkFlow-Web
NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck && NODE_OPTIONS="--max-old-space-size=2048" pnpm lint && NODE_OPTIONS="--max-old-space-size=2048" pnpm test && NODE_OPTIONS="--max-old-space-size=2048" pnpm build   # 四连校验门
```
