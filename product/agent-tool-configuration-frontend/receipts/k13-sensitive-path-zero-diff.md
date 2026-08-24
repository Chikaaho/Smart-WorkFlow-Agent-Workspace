# K13: 标准9 敏感路径原始零差异输出（D197 审查 L9）

**执行日期**：2026-08-24  
**前置**：执行补充提示6 / D197 审查 L9

## 1. 后端敏感路径 git diff 原始零输出（tracked）

以下命令在后端仓 `/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow` 逐项执行，
`git diff --quiet` 对**已跟踪文件**无差异时退出码为 0（无输出 = 零差异）：

```
$ git diff --quiet -- sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/entity          → exit=0
$ git diff --quiet -- sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/mapper          → exit=0
$ git diff --quiet -- sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/service         → exit=0
$ git diff --quiet -- sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/controller      → exit=0
$ git diff --quiet -- sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration   → exit=0
$ git diff --quiet -- sw-bootstrap/src/main/resources/db/migration/h2/V20__init_agent_tool_config.sql        → exit=0
$ git diff --quiet -- sw-bootstrap/src/main/resources/db/migration/postgresql/V20__init_agent_tool_config.sql → exit=0
$ git diff --quiet -- sw-bootstrap/src/main/resources/db/migration/h2/V23__init_agent_tool_call_log.sql        → exit=0
$ git diff --quiet -- sw-bootstrap/src/main/resources/db/migration/postgresql/V23__init_agent_tool_call_log.sql → exit=0
$ git diff --quiet -- sw-bootstrap/src/main/resources/db/migration/h2/V36__init_agent_graph_debug_session.sql        → exit=0
$ git diff --quiet -- sw-bootstrap/src/main/resources/db/migration/postgresql/V36__init_agent_graph_debug_session.sql → exit=0
```

**零差异确认**：Entity/Mapper/Service/Controller/Factory（orchestration 含 AgentToolCallbackFactory）、
V20/V23/V36 及以前迁移全部零改动（tracked 无 diff）。

## 2. 未跟踪（untracked）新增检查

```
$ git status --short | grep -E "V20|V23|V36|entity|mapper|service|controller|orchestration"
?? sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/controller/AgentToolConfigSecurityIntegrationTest.java

$ git status --short | grep "??" | grep -i migration
?? sw-bootstrap/src/main/resources/db/migration/h2/V37__agent_tool_menu_seed.sql
?? sw-bootstrap/src/main/resources/db/migration/postgresql/V37__agent_tool_menu_seed.sql
```

- 敏感业务路径**无任何未跟踪新增**（唯一新增在测试目录：标准8/5 集成测试类）。
- 迁移新增仅 V37 双方言 seed（本功能唯一新增迁移），V36 及以前无新文件。

## 3. 根仓逐项归属（P48 状态同步 vs 真正无关）

根仓 `/usr/local/projects/Smart-WorkFlow`（`git status --short` 全文见 k9-three-repo-audit.md）：

| 文件 | 归属 | 说明 |
|------|------|------|
| `memory/state.md` / `handoff.md` / `features.md` / `decisions.md` / `todo/requirement-pool.md` | **P48 状态同步** | 本轮 L12 将全文同步，属 P48 当前状态维护 |
| `product/agent-tool-configuration-frontend/`（??） | **P48 方向/回执** | 本功能方向文档与回执目录（含 k8/k9/k10/k11/k12/k13） |
| `.claude/hooks/stop-execution-completeness.sh` / `.codex/hooks/...` | 工程配置（非 P48） | hook 脚本维护 |
| `roles/executor.md` | 角色定义（非 P48） | 管理员维护 |
| `knowledge/model-registry.md` | 知识库维护（非 P48） | 模型注册表 |
| `search_fallback/next-feature-candidate-refresh-20260824.md` / `search_task/...` | 探索通道（非 P48） | 下一功能候选刷新 |
| `node_modules/` / `test.md` | 环境/临时（非 P48） | 未跟踪环境目录/临时文件 |

**结论**：根仓 P48 相关 = memory 5 个状态文件 + product 目录；其余为治理/工程/探索/环境改动，均非 P48。
