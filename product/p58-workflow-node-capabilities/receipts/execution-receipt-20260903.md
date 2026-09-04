# P58 流程节点能力完善 · 执行回执

## 1. 执行状态

- 角色：Executor
- 任务级别：XL
- 执行状态：`EXECUTION_SUBMITTED`
- 功能状态：`VERIFYING`
- 方向文件：`/usr/local/projects/Smart-WorkFlow/product/p58-workflow-node-capabilities/ready/direction-p58-workflow-node-capabilities.md`
- 执行范围：阶段 A→F；已完成代码实现与可执行的后端回归，等待 Planner 独立验收。

## 2. 实际读取的治理与任务文件

- `/usr/local/projects/Smart-WorkFlow/system.md`
- `/usr/local/projects/Smart-WorkFlow/roles/executor.md`
- `/usr/local/projects/Smart-WorkFlow/project.md`
- `/usr/local/projects/Smart-WorkFlow/product/p58-workflow-node-capabilities/ready/direction-p58-workflow-node-capabilities.md`
- `/usr/local/projects/Smart-WorkFlow/search_fallback/p58-workflow-node-capabilities-current-seams.md`
- `/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Server/docs/governance/engineering-constitution.md`
- `/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Web/docs/governance/engineering-constitution.md`
- `/usr/local/projects/Smart-WorkFlow/.codex/governance/terminal-contract.json`

## 3. 实际修改范围

### 后端 `/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Server`

- BPM API：统一参与人策略、受限表达式、审批动作/意见契约、任务操作与错误码。
- BPM Engine：固定用户/角色/表达式/适配器解析，审批候选与快照，多候选任务，意见表单元数据，条件分支，ALL/ANY/RATIO 共识，复制节点和通知节点翻译/运行时委托，分支轨迹和动作审计。
- BPM Process：审批动作接口、批准/退回/驳回，幂等动作记录，意见校验，退回目标校验，实例结果状态和表单快照。
- 通知模块：站内信及 SMS/飞书/钉钉/企业微信/公众号/小程序的 SPI 入口，成功/失败投递审计和幂等键。
- Flyway：新增 P58 通知字段与 BPM 审计/快照表，并修正完整链路测试的迁移计数。

### 前端 `/usr/local/projects/Smart-WorkFlow/Smart-WorkFlow-Web`

- 能力清单驱动流程编辑器，支持参与人策略、共识模式/比例、通知渠道与内容、条件分支和审批意见配置。
- 任务详情支持批准、退回、驳回、意见展示和审批历史。
- API、DTO 与隔离 mock 能力清单同步更新；mock 仅作为测试夹具，运行时能力以服务端清单为准。

### 工作区根目录

- `knowledge/current-status.md` 更新为 P58 `IN_PROGRESS`，下一动作指向 Executor 阶段 A→F。
- 保留开始执行前已存在的用户修改；未提交 commit，未执行 push。

## 4. 验证证据

以下命令均在对应工程目录执行，后端 Maven 命令使用 `MAVEN_OPTS="-Xmx2g"`：

1. 后端编译：`MAVEN_OPTS="-Xmx2g" mvn -q -DskipTests compile`，退出码 `0`。
2. 通知集成测试：`MAVEN_OPTS="-Xmx2g" mvn -q -pl sw-basic/sw-basic-notify/sw-basic-notify-biz -am -Dtest=NotifyMessageIntegrationTest -Dsurefire.failIfNoSpecifiedTests=false test`，退出码 `0`。
3. BPM 过程聚焦测试：`MAVEN_OPTS="-Xmx2g" mvn -q -pl sw-biz/sw-bpm/sw-bpm-process -am -Dtest='BpmTodoControllerTest,GraphValidatorTest,ProcessStartServiceTest' -Dsurefire.failIfNoSpecifiedTests=false test`，退出码 `0`；24 tests，0 failures，0 errors。
4. BPM Engine 聚焦回归：`MAVEN_OPTS="-Xmx2g" mvn -q -pl sw-biz/sw-bpm/sw-bpm-engine -am -Dtest='GraphToBpmnTranslatorTest,NodeTypeTranslatorPlugabilityTest' -Dsurefire.failIfNoSpecifiedTests=false test`，退出码 `0`。
5. BPM 过程全模块回归：`MAVEN_OPTS="-Xmx2g" mvn -q -pl sw-biz/sw-bpm/sw-bpm-process -am test`，退出码 `0`。
6. 通知全模块回归：`MAVEN_OPTS="-Xmx2g" mvn -q -pl sw-basic/sw-basic-notify/sw-basic-notify-biz -am test`，退出码 `0`。
7. Flyway H2/PostgreSQL 完整链路：`MAVEN_OPTS="-Xmx2g" mvn -q -pl sw-bootstrap -am -Dtest='FlywayFullChainH2Test,FlywayFullChainPostgresTest' -Dsurefire.failIfNoSpecifiedTests=false test`，退出码 `0`；日志显示 H2 校验 49 个迁移、PostgreSQL 校验 48 个迁移。
8. 后端全量回归：`MAVEN_OPTS="-Xmx2g" mvn -q test`，退出码 `0`。
9. 三个仓库 `git diff --check`，均无输出、退出码 `0`。
10. 浏览器页面加载：本地 `http://127.0.0.1:5173/login?redirect=/` 可读，页面标题为 `Smart-WorkFlow`，登录表单 DOM 可见。

## 5. 未完成与验收边界

- 当前浏览器没有已认证会话，因此未伪造登录；真实组合流程的浏览器操作、HTTP 请求/响应、Flowable 实例、待办/结果状态、数据库持久化和双身份权限证据仍待 Planner 独立验收。
- 前端工程已有 Vite 进程 PID `64661` 在运行。按前端工程宪法，本轮未在其存活期间执行 `pnpm typecheck`、`pnpm lint`、`pnpm test`、`pnpm build`；前端四项门禁仍是后续环境动作。
- 共识动作已提供进程内串行和幂等键保护；多实例分布式并发场景未通过真实集群证据确认。
- 外部通知渠道只完成 SPI 边界和投递审计，未接入真实第三方账号或生产适配器。

## 6. 下一动作

由 Planner 读取本回执并独立验收；具备认证会话、可控前端进程和后端运行环境后，补齐阶段 F 的真实组合流程与前端四项门禁，再决定功能是否进入 `PASSED`。
