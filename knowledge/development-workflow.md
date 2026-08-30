# 开发工作流参考

> 本文件只记录跨项目的日常工程流程。角色、授权、任务终态、回执生命周期和停止条件不在此定义：分别以 `system.md`、`roles/` 与 `.codex/governance/terminal-contract.json` 为准。

## 1. 工程流程

```text
方向与契约明确 → 实现 → 增量验证 → 全量校验 → 行为验收 → 证据归档
```

- 目标、非目标和范围来自已授权方向；本参考文档不建立二次授权门。
- 后端专属实现规则见 `Smart-WorkFlow-Server/docs/governance/engineering-constitution.md`。
- 前端专属实现规则见 `Smart-WorkFlow-Web/docs/governance/engineering-constitution.md`。
- 跨端安全、接缝、资源互斥与设计系统见 `knowledge/shared-constraints.md`。

## 2. 校验门

执行重型命令前先按 `knowledge/shared-constraints.md` §9 检查另一端编译/测试进程；前后端不得并行运行重型命令。

### 2.1 后端

```bash
MAVEN_OPTS="-Xmx2g" mvn -q compile
MAVEN_OPTS="-Xmx2g" mvn -q test
```

- 使用全工程计数，非模块 scoped。
- `spring-boot:run` 不作为阻塞式完成判据。

### 2.2 前端

```bash
NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck
NODE_OPTIONS="--max-old-space-size=2048" pnpm lint
NODE_OPTIONS="--max-old-space-size=2048" pnpm test
NODE_OPTIONS="--max-old-space-size=2048" pnpm build
```

- 四项必须全绿；测试计数增减须能对应实际变更。
- `pnpm dev` / `pnpm dev:mock` 只用于人工验收，不作为阻塞式校验门。

## 3. 通用编码原则

- 优先成熟开源库，避免维护自造基础轮子。
- 重构采用 move-not-copy，旧入口应有零残留证据。
- 横切基础设施先于依赖它的业务实现。
- 配置和密钥不提交仓库；示例使用占位值。

## 4. 后端要点

- 日常编码使用 import + 短类名；同名冲突时才使用 FQCN。
- 同一序列化场景不混用 JSON 库。
- 动态宽表 SQL 必须同时满足租户、逻辑删除、列名白名单和参数化绑定约束。

## 5. 前端要点

- 依赖方向、接缝层、设计 token 与安全出口以本仓工程宪法为准。
- 业务模块不得直接绕过 adapters/foundation 访问第三方实现。
- 可见 UI 在自动化校验后按需进行人工验收。

## 6. 文档与提交

- 当前状态、计数、基线和唯一下一动作只维护在 `knowledge/current-status.md`；历史进入 `knowledge/history/`。
- 工程专属细节只维护在对应工程宪法，不在本文件复制。
- 前端使用 commitlint 与 lint-staged；提交遵循 Conventional Commits。
- 功能级 completion receipt 与追加补证格式只见 `roles/executor.md` §8；`receipts/` 历史追加保留，只有方向文档进入 `passed/`。
