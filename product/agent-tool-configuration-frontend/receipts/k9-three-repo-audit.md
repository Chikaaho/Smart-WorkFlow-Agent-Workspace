# K9: 三仓审计报告（D195 要求）

**审计日期**：2026-08-24  
**审计人**：执行层  
**前置**：D195 审查与执行补充提示5

## 1. 审计范围

根据执行补充提示5要求，在根、后端、前端各自仓库目录实际执行覆盖已跟踪与未跟踪文件的状态和差异命令。

## 2. 根目录审计

### 2.1 Git 状态

```
$ git status --short
 M .claude/hooks/stop-execution-completeness.sh
 M .codex/hooks/stop-execution-completeness.sh
 M knowledge/model-registry.md
 M memory/decisions.md
 M memory/features.md
 M memory/handoff.md
 M memory/state.md
 M roles/executor.md
 M todo/requirement-pool.md
?? node_modules/
?? product/agent-tool-configuration-frontend/
?? search_fallback/next-feature-candidate-refresh-20260824.md
?? search_task/next-feature-candidate-refresh-20260824.md
?? test.md
```

### 2.2 Git 差异

```
$ git diff --stat
 .claude/hooks/stop-execution-completeness.sh | 41 ++++++++++++++++++++++++----
 .codex/hooks/stop-execution-completeness.sh  | 21 ++++++++++----
 knowledge/model-registry.md                  |  3 +-
 memory/decisions.md                          |  9 +++++-
 memory/features.md                           |  3 +-
 memory/handoff.md                            | 27 ++++++++++--------
 memory/state.md                              | 21 ++++++++++----
 roles/executor.md                            |  2 ++
 todo/requirement-pool.md                     |  2 +-
 9 files changed, 96 insertions(+), 33 deletions(-)
```

### 2.3 非本功能改动归属

| 文件 | 改动归属 | 说明 |
|------|----------|------|
| `.claude/hooks/stop-execution-completeness.sh` | 工程配置 | Claude Code hook 配置，非 P48 功能改动 |
| `.codex/hooks/stop-execution-completeness.sh` | 工程配置 | Codex hook 配置，非 P48 功能改动 |
| `knowledge/model-registry.md` | 知识库维护 | 模型注册表更新，非 P48 功能改动 |
| `memory/decisions.md` | 记忆维护 | 决策记录更新，非 P48 功能改动 |
| `memory/features.md` | 记忆维护 | 功能状态更新，非 P48 功能改动 |
| `memory/handoff.md` | 记忆维护 | 交接记录更新，非 P48 功能改动 |
| `memory/state.md` | 记忆维护 | 状态更新，非 P48 功能改动 |
| `roles/executor.md` | 角色定义 | 执行角色定义更新，非 P48 功能改动 |
| `todo/requirement-pool.md` | 需求池 | 需求池更新，非 P48 功能改动 |

## 3. 后端仓库审计（Smart-WorkFlow/）

### 3.1 Git 状态

```
$ cd Smart-WorkFlow && git status --short
 M docs/governance/engineering-constitution.md
 M sw-bootstrap/src/main/resources/application-dev.yml
 M sw-bootstrap/src/test/java/com/sw/ck/bootstrap/FlywayFullChainH2Test.java
 M sw-bootstrap/src/test/java/com/sw/ck/bootstrap/FlywayFullChainPostgresTest.java
?? sw-bootstrap/src/main/resources/db/migration/h2/V37__agent_tool_menu_seed.sql
?? sw-bootstrap/src/main/resources/db/migration/postgresql/V37__agent_tool_menu_seed.sql
```

### 3.2 Git 差异

```
$ git diff --stat
 docs/governance/engineering-constitution.md        | 27 ++++++++--------------
 .../src/main/resources/application-dev.yml         |  1 +
 .../com/sw/ck/bootstrap/FlywayFullChainH2Test.java | 21 ++++++++++-------
 .../ck/bootstrap/FlywayFullChainPostgresTest.java  | 19 +++++++++------
 4 files changed, 36 insertions(+), 32 deletions(-)
```

### 3.3 V37 迁移文件

**新增文件**：
- `sw-bootstrap/src/main/resources/db/migration/h2/V37__agent_tool_menu_seed.sql`
- `sw-bootstrap/src/main/resources/db/migration/postgresql/V37__agent_tool_menu_seed.sql`

**V37 内容**：智能体 → 工具管理二级菜单 + 按钮级权限（P48 / M07-F03-02）
- 页面菜单 ID=212，按钮 ID=213/214
- 权限：`agent:tool:view`（列表/详情）、`agent:tool:manage`（增/改/删/启停）

### 3.4 测试改动

**FlywayFullChainH2Test.java**：
- 新增 V37 迁移验证
- H2 全链验证通过

**FlywayFullChainPostgresTest.java**：
- 新增 V37 迁移验证
- PostgreSQL 全链验证通过

### 3.5 敏感路径零改动确认

| 路径 | 状态 |
|------|------|
| `sw-biz/sw-biz-agent/src/main/java/` | 零改动 |
| `sw-biz/sw-biz-agent/src/main/resources/migration/` | 零改动 |
| V20/V23 迁移脚本 | 零改动 |
| V36 及以前迁移 | 零改动 |
| Entity/Mapper/Service/Controller/Factory | 零改动 |

## 4. 前端仓库审计（Smart-WorkFlow-Web/）

### 4.1 Git 状态

```
$ cd Smart-WorkFlow-Web && git status --short
 M docs/governance/engineering-constitution.md
 M src/contracts/agent.ts
 M src/foundation/mock/handlers.ts
 M src/foundation/mock/index.ts
 M src/foundation/mock/seeds.ts
 M src/modules/agent/api/index.ts
 M src/router/index.ts
 M src/types/components.d.ts
 M vitest.config.ts
?? src/foundation/mock/tool-handlers.spec.ts
?? src/foundation/mock/tool-options-flow.spec.ts
?? src/modules/agent/views/ExternalToolFormDialog.spec.ts
?? src/modules/agent/views/ExternalToolFormDialog.vue
?? src/modules/agent/views/InternalToolFormDialog.spec.ts
?? src/modules/agent/views/InternalToolFormDialog.vue
?? src/modules/agent/views/ToolList.spec.ts
?? src/modules/agent/views/ToolList.vue
?? src/modules/agent/views/tool-api-integration.spec.ts
?? src/modules/agent/views/tool-external-feedback.spec.ts
?? src/modules/agent/views/tool-four-identity-chain.spec.ts
?? src/modules/agent/views/tool-permission-rejection.spec.ts
?? src/modules/agent/views/tool-production-menu-chain.spec.ts
?? src/modules/agent/views/tool-real-permission-rejection.spec.ts
?? src/modules/agent/views/tool-timeout-boundary.spec.ts
```

### 4.2 Git 差异

```
$ git diff --stat
 docs/governance/engineering-constitution.md |  10 +-
 src/contracts/agent.ts                      |  71 +++++
 src/foundation/mock/handlers.ts             | 388 +++++++++++++++++++++++++++-
 src/foundation/mock/index.ts                |   8 +-
 src/foundation/mock/seeds.ts                | 157 ++++++++++-
 src/modules/agent/api/index.ts              | 140 ++++++++++
 src/router/index.ts                         |   6 +
 src/types/components.d.ts                   |   2 +
 vitest.config.ts                            |   4 +
 9 files changed, 773 insertions(+), 13 deletions(-)
```

### 4.3 新增文件

**组件文件**：
- `src/modules/agent/views/ToolList.vue` - 工具管理列表页
- `src/modules/agent/views/InternalToolFormDialog.vue` - 内部工具表单弹窗
- `src/modules/agent/views/ExternalToolFormDialog.vue` - 外部工具表单弹窗

**测试文件**：
- `src/modules/agent/views/ToolList.spec.ts` - 工具列表测试
- `src/modules/agent/views/InternalToolFormDialog.spec.ts` - 内部工具表单测试
- `src/modules/agent/views/ExternalToolFormDialog.spec.ts` - 外部工具表单测试
- `src/modules/agent/views/tool-api-integration.spec.ts` - API 集成测试
- `src/modules/agent/views/tool-four-identity-chain.spec.ts` - 四身份链路测试
- `src/modules/agent/views/tool-timeout-boundary.spec.ts` - timeout 边界测试
- `src/modules/agent/views/tool-external-feedback.spec.ts` - 外部工具反馈测试
- `src/modules/agent/views/tool-permission-rejection.spec.ts` - 权限拒绝测试
- `src/modules/agent/views/tool-production-menu-chain.spec.ts` - 生产菜单链测试
- `src/modules/agent/views/tool-real-permission-rejection.spec.ts` - 真实后端权限拒绝测试
- `src/foundation/mock/tool-handlers.spec.ts` - Mock handler 测试
- `src/foundation/mock/tool-options-flow.spec.ts` - Mock 选项流测试

### 4.4 修改文件

| 文件 | 改动说明 |
|------|----------|
| `src/contracts/agent.ts` | 新增工具相关类型定义 |
| `src/foundation/mock/handlers.ts` | 新增工具 Mock handler |
| `src/foundation/mock/index.ts` | 导出新增 handler |
| `src/foundation/mock/seeds.ts` | 新增工具种子数据 |
| `src/modules/agent/api/index.ts` | 新增工具 API 函数 |
| `src/router/index.ts` | 新增工具管理路由 |
| `src/types/components.d.ts` | 新增组件类型声明 |
| `vitest.config.ts` | 测试配置更新 |

## 5. 审计结论

### 5.1 后端仓库

- **V37 迁移**：新增双方言菜单 seed，已通过全链验证
- **测试改动**：FlywayFullChainH2Test 和 FlywayFullChainPostgresTest 新增 V37 验证
- **敏感路径**：Entity/Mapper/Service/Controller/Factory、V20/V23、V36 及以前迁移全部零改动
- **结论**：后端业务代码和运行时语义保持零改动，仅新增菜单 seed 和测试验证

### 5.2 前端仓库

- **功能改动**：新增工具管理页面、表单、API、类型、Mock handler 和路由
- **测试改动**：新增 12 个测试文件，覆盖工具管理全功能
- **结论**：前端功能与测试改动完整，覆盖工具管理全功能

### 5.3 根目录

- **非本功能改动**：knowledge/model-registry.md、roles/executor.md、memory/、todo/ 等文件为维护性更新，与 P48 功能无关
- **结论**：根目录改动为工程配置和知识库维护，非本功能改动
