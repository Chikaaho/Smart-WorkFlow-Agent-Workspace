# P51 分支解耦与 Smart-WorkFlow 示例探索

> 本会话角色：规划，委派角色：执行

## 任务目标

核对将当前根知识/治理仓调整为“通用 Agent Coding Engine”的最小可行分支模型：

- `main`：解耦后的通用 Engine 发布/默认分支；
- `develop-sw`：保留当前 Smart-WorkFlow/OA 项目成果的示例分支；
- `main` 的 README：说明 Engine 用法，并指向 `develop-sw` 作为示例。

## 需要回答的问题

1. 当前根仓实际所在分支、远端、工作区是否干净；本地/远端是否已有 `develop-sw`，若没有，创建它需要从哪个已知提交或分支起点切出。
2. 当前 `main` 中哪些目录/文件属于通用治理 Engine，哪些内容是 Smart-WorkFlow/OA 实例事实；按目录和文件列出，不扫描无关业务源码。
3. 当前根 README、AGENTS 入口、system/roles、memory/knowledge/product/todo/search_task/search_fallback、治理契约和 Hooks 中，哪些内容把 Smart-WorkFlow 当成默认项目，哪些必须保留为通用协议，哪些应下沉到 `develop-sw` 示例。
4. `develop-sw` 作为示例分支时，如何保留当前成果的可追溯性：历史回执、状态单一源、P/I 条目、三仓代码引用和当前示例说明分别应如何处理。
5. 仅依赖“README 指向示例分支”是否足以满足 P51 的初步边界；若不足，列出必须增加的最小项目说明/初始化入口/隔离机制，但不要设计具体实现代码。
6. 给出建议的迁移顺序、分支保护/发布风险、回滚点，以及每阶段应由 Planner 验收的事实性结果。

## 搜索范围

- 根仓 Git 元数据：分支、远端、提交历史、工作树状态；只读。
- 根目录 README、AGENTS.md、system.md、roles/、.codex/、.claude/ 的入口和治理文件。
- 根目录 `memory/`、`knowledge/`、`product/`、`todo/`、`search_task/`、`search_fallback/` 中与项目身份、分支、示例、初始化和路径引用有关的文档。
- 允许使用限定的文本搜索定位 `Smart-WorkFlow`、`OA`、`main`、`develop`、仓库路径和固定业务事实；不得读取后端/前端业务源码。

## 禁止范围

- 不修改任何文件，不创建分支，不提交，不推送，不删除或改写 Git 历史。
- 不运行 Maven、pnpm、Node、Java、数据库迁移或部署命令。
- 不读取 `Smart-WorkFlow-Server/`、`Smart-WorkFlow-Web/` 的业务源码和测试源码；仅可读取其仓库元数据或被根文档直接引用的非源码说明。
- 不在本次探索中生成需求方向文档，不替 Planner 做最终方案裁决。

## 预期证据

- 当前分支、远端和工作树状态的命令输出摘要。
- 按“通用 Engine / Smart-WorkFlow 示例 / 需重新设计”分类的文件清单及关键引用位置。
- `develop-sw` 起点与分支策略建议，明确区分已验证事实和推断。
- README 与最小项目说明的最小变更面，以及实例隔离/迁移/回滚风险。

## 完成标准

回答上述问题，结论优先、控制在 5KB 内；不能验证的内容明确标记为待确认，不以文件名或历史记忆代替事实。

## 失败处理

若分支或文件无法读取，仍在回执中记录已验证范围、失败原因和对方案的影响，不扩大探索范围。

## 回执位置

`search_fallback/p51-branch-decoupling-exploration.md`
