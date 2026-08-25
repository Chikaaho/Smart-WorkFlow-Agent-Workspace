# Smart-WorkFlow Knowledge Base

> Smart-WorkFlow 低代码 OA + AI Agent 平台的**规划与知识管理中心**。
> 本仓库负责宪法、角色入口、需求方向、回执归档与跨项目知识管理；业务实现位于两个 executor sublayer。

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
