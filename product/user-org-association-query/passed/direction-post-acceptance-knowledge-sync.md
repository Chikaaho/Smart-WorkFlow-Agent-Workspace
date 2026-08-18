# user-org-association-query 阶段三终态同步方向（D101）

> 本方向仅用于 D101 `PASSED` 后的知识终态同步，不修改业务代码、不重做已通过测试、不规划新功能。

**状态**：READY（2026-08-18）  
**前置验收**：`product/user-org-association-query/receipts/planning-final-review-d101.md`

## 目标

将完整知识层、功能清单、需求池和交接入口统一为 D101 `PASSED`，关闭 I32/I34/I35 及 I36 本轮剩余子集，并把用户裁定的两项环境验证记录为非阻塞待办。

## 必须同步的终态

- user-org-association-query：`PASSED`，阶段三同步完成后标记 `COMPLETED`。
- I32 / I34 / I35：关闭，引用 D101 与对应回执证据。
- I36：只关闭用户与普通角色绑定管理入口子集，不得误关其他无关语义。
- 测试基线：后端 563/0/0/0；前端 66 files / 577 tests；Flyway H2 全链 10 tests，最高 V32。
- 功能清单仅按实际满足的描述调整，并报告逐行变更及最终 ✅/🟦/⬜ 计数；无关行零漂移。

## 环境待办

按现有 todo/known-issues 编号和收录规则登记，不虚构已执行结果：

1. 在具备 PostgreSQL 环境时补做 V32 新库及 V31→V32 migrate + validate；当前只有 H2 运行证据和双方言脚本静态对齐。
2. 在系统恢复进程列表能力后补做前后端编译测试互斥快照验证；当前保留 2G 与严格串行命令记录。

两项均为用户裁定的非阻塞环境待办，不影响 D101 `PASSED`，但不得从知识中遗漏。

## 范围与禁止事项

- 仅更新 knowledge、功能清单、todo/需求池、memory 终态和本功能回执索引。
- 禁止修改后端/前端业务代码、测试、迁移脚本和工程配置。
- 禁止运行 Maven、pnpm、node、数据库或部署命令。
- 必须全文核对 current-status、features、known-issues、session-handoff，禁止只改文件顶部。

## 回执

写入 `product/user-org-association-query/receipts/post-acceptance-knowledge-sync.md`，包含：修改文件清单、状态与编号变更、功能清单逐行变更及总计、环境待办落点、全文残留检查。完成后停止，等待规划层阶段三最终验收。
