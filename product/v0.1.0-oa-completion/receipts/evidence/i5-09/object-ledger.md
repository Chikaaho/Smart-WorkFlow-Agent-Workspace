# i5-09 对象账本（G9c1）

> 执行轮：iteration-09；执行入口：`planning-execution-prompt-stage-i5-tenant-safe-sso-07.md`
> 本轮零代码修改：当前工作树指纹 `30fd54b2a7ddab4addeb9e30cbe0a2fae9ee7b91` 与 iteration-08 最终候选一致（本轮实测 `git write-tree` 回读相同）。

## G9c1：修改测试文件 → 测试类 → 实际运行结果

由 `git diff --name-only HEAD` 工具枚举（非手抄），恰为 iteration-08 修改的 10 个测试文件：

| # | 修改测试文件 | 测试类 | 运行命令结果 | 计数（原始流逐字） |
|---|---|---|---|---|
| 1 | sw-basic-agent/.../AgentConversationControllerTest.java | AgentConversationControllerTest | exit=0 | Tests run: 7, Failures: 0, Errors: 0, Skipped: 0 |
| 2 | sw-basic-agent/.../AgentGraphDebugSecurityIntegrationTest.java | AgentGraphDebugSecurityIntegrationTest | exit=0 | Tests run: 28, Failures: 0, Errors: 0, Skipped: 0 |
| 3 | sw-basic-agent/.../AgentGraphDefControllerTest.java | AgentGraphDefControllerTest | exit=0 | Tests run: 17, Failures: 0, Errors: 0, Skipped: 0 |
| 4 | sw-basic-agent/.../AgentGraphDefSecurityIntegrationTest.java | AgentGraphDefSecurityIntegrationTest | exit=0 | Tests run: 20, Failures: 0, Errors: 0, Skipped: 0 |
| 5 | sw-basic-agent/.../AgentGraphExecutionSecurityIntegrationTest.java | AgentGraphExecutionSecurityIntegrationTest | exit=0 | Tests run: 12, Failures: 0, Errors: 0, Skipped: 0 |
| 6 | sw-basic-agent/.../AgentModelControllerTest.java | AgentModelControllerTest | exit=0 | Tests run: 5, Failures: 0, Errors: 0, Skipped: 0 |
| 7 | sw-basic-agent/.../AgentOrchestrationControllerTest.java | AgentOrchestrationControllerTest | exit=0 | Tests run: 3, Failures: 0, Errors: 0, Skipped: 0 |
| 8 | sw-basic-agent/.../AgentToolConfigControllerTest.java | AgentToolConfigControllerTest | exit=0 | Tests run: 4, Failures: 0, Errors: 0, Skipped: 0 |
| 9 | sw-basic-agent/.../AgentToolConfigSecurityIntegrationTest.java | AgentToolConfigSecurityIntegrationTest | exit=0 | Tests run: 8, Failures: 0, Errors: 0, Skipped: 0 |
| 10 | sw-basic-notify-biz/.../NotifyTemplateSecurityIntegrationTest.java | NotifyTemplateSecurityIntegrationTest | exit=0 | Tests run: 12, Failures: 0, Errors: 0, Skipped: 0 |

- agent 9 类合并一次 surefire 运行（`g9c1-agent-tests.log`，模块汇总 Tests run: 104, Failures: 0, Errors: 0, Skipped: 0，AGENT_EXIT=0）。
- notify 1 类独立运行（`g9c1-notify-test.log`，模块汇总 Tests run: 12, Failures: 0, Errors: 0, Skipped: 0，NOTIFY_EXIT=0）。
- 10/10 类逐一勾稽，无漏项、无以 testCompile 替代、未运行同模块其他测试。

## 边界

- 未重验 G6c1a/G6c1/G3b2/G6a1/G6b1 及审查 05 锁定项；未做模块全量；零代码修改。
- G8（三 Provider 官方应用 / HTTPS 回调白名单域 / 可控测试身份）仍未提供，保持 PENDING，`dependency_satisfied=false`。
