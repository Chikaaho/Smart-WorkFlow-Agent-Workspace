# Step 2 回执核实 — 探索任务

> 本文件按 system.md §0.4.1 的 Step 0 载体形式生成：Step 2（后端新增 BPMN XML 只读端点）的执行回执和测试回执存在若干数字矛盾/描述疑点，规划层（Anthropic 系模型）不得直接读代码核实，需由用户手动切换会话模型为 DeepSeek 系后，在本会话内自行完成以下探索，产出结构化摘要供规划层裁定 Step 2 是 PASSED 还是需要打回补充证据。

## ① 探索目标（要回答的具体问题）

**问题 1：测试计数矛盾**

执行回执声称：改动前 `sw-bpm` 模块基线测试数是 19，改动后是 26（净增 +7）。但回执自己列出的新增测试用例明细是：
- `BpmDeployFacadeImplTest.java`（新建）：2 个测试方法
- `BpmProcessDefServiceImplTest.java`（新建）：4 个测试方法
- `BpmProcessDefControllerTest.java`（新建）：3 个测试方法
- `ApprovalProcessIntegrationTest.java`（修改，新增 1 个测试方法）

四项相加是 2+4+3+1=10，不是 7。同时知识库 `current-status.md` 记录了一条独立确认过的数字（2026-07-22 kb-verification 运行期真值）：当时 `sw-bpm` 模块的测试基线是 **26**（不是回执说的 19）。也就是说回执自述的"改动前 19"这个数字本身就与知识库已确认的基线冲突。

请核实：
- 统计以下 4 个文件里实际的 `@Test` 数量：
  - `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-engine/src/test/java/.../BpmDeployFacadeImplTest.java`
  - `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/test/java/.../BpmProcessDefServiceImplTest.java`
  - `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/test/java/.../BpmProcessDefControllerTest.java`
  - `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-engine/src/test/java/.../ApprovalProcessIntegrationTest.java`（此文件是修改而非新建，统计当前总共有多少个 `@Test`）
- 统计整个 `Smart-WorkFlow/sw-biz/sw-bpm/` 目录树（api+engine+process 三个子模块合计）当前 `@Test` 注解总数。
- 报告这个总数与回执声称的"26"是否一致；若不一致，指出差值。

**问题 2：git diff 范围疑点**

执行回执原话："删除行数：~29（来自非本项目改动）"——暗示 `git diff`/`git status` 里混入了与本 Step 无关的改动。请核实：
- `git status` 和 `git diff --stat`（在仓库根目录 `/data/reasonix/files` 执行）的完整、不截断的输出。
- 哪些文件路径明显不属于本 Step 应改动的范围。本 Step **应改动**的文件仅限于：
  - `sw-bpm-api`：`BpmDeployFacade.java`、`BpmErrorCode.java`
  - `sw-bpm-engine`：`BpmDeployFacadeImpl.java`、新建 `BpmDeployFacadeImplTest.java`、修改 `ApprovalProcessIntegrationTest.java`
  - `sw-bpm-process`：`BpmProcessDefService.java`、`BpmProcessDefServiceImpl.java`、`BpmProcessDefController.java`、新建 `BpmProcessDefControllerTest.java`、新建 `BpmProcessDefServiceImplTest.java`
- 明确回答：`Smart-WorkFlow-Web/` 目录下是否有任何改动（应为零）；是否有 Flyway 迁移脚本被新增/修改（应为零）；除上述允许范围外，是否还有其他文件被改动——如有，列出具体路径和改动类型（新增/修改/删除）。

**问题 3：错误码冲突核查**

读取 `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/exception/BpmErrorCode.java` 完整内容，确认：
- 是否存在编号 `2104` 的常量，名称是否为 `PROCESS_NOT_PUBLISHED`。
- 该文件里是否存在任何两个常量使用了相同编号（编号冲突）。

**问题 4：模块边界核查**

执行 `grep -rn "org.flowable" Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/`，报告结果是否为空。

## ② 探索范围（限定读取的目录/文件/关键字）

- 仅限 `Smart-WorkFlow/sw-biz/sw-bpm/` 目录树下的生产代码和测试代码文件（api/engine/process 三个子模块）。
- 仓库根目录的 `git status`/`git diff --stat` 只读命令（不限于 sw-bpm，需完整报告全仓库范围，用于发现"非本项目改动"的具体内容）。
- **禁止**运行任何会改变项目状态的命令：`mvn compile`/`mvn test`/`mvn` 任何目标、`pnpm`/`npm`/`node`。
- **禁止**修改任何文件。
- 关键字：`@Test`、`org.flowable`、`PROCESS_NOT_PUBLISHED`、`2104`。

## ③ 当前模型确认

探索开始前，请在本会话中确认并记录：「当前模型：（用户手动切换后的实际模型标识，如 deepseek-v4-pro），可承担角色：探索模型」。

## ④ 输出要求

请按问题 1-4 编号分别给出实际核实到的事实（具体数字、完整文件列表、关键 grep/diff 原始输出片段），不需要下"回执是否可信"的结论，只需客观陈述看到的事实。产出后请将结构化摘要写入 `product/bpmn-adapter/step-2-receipt-verification-summary.md`（若本任务后续需要留痕）。

## ⑤ 完成后的分工提醒

探索完成后，必须切回规划模型身份（即切回 Anthropic 系模型会话）再消费该摘要并对 Step 2 做最终裁定（PASSED / 打回补充）。不可在同一次探索调用中直接给出"Step 2 是否通过"的结论——探索与规划是两个独立、先后发生的动作。
