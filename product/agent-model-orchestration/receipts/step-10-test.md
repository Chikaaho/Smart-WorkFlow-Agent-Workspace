# 测试回执

## 1. Step 编号和名称

**M07-F02 多变量执行上下文（后端地基）** — 执行层自主闭环（自拆 Step1-4，见执行回执 §5）。方向文档：`product/agent-model-orchestration/ready/step-10-multivar-context-backend.md`。

## 2. 测试环境

- 数据库：H2（`MODE=PostgreSQL`，内存库，Service 测试 @BeforeAll 建表 DDL 对齐 V25/V19/V20/V21）
- Java：21（OpenJDK 64-Bit Server VM，JDK 21）
- 构建：Maven（多模块，sw-basic-agent + 全工程）
- 测试框架：JUnit 5 + Mockito + AssertJ；Service 测试为 @SpringBootTest（TestConfig 组合装配 MyBatis-Plus + 租户拦截器 + ObjectMapper + mock 工厂），解释器测试为纯 Java 无 Spring
- 操作系统：Linux 5.15

## 3. 测试前置条件

- 基线：全工程 385 tests（Step8 after 基线，state.md 确认），本次执行前已核实
- sw-basic-agent 模块编译通过（`mvn -q compile -pl sw-basic/sw-basic-agent -am`）
- 无外部依赖服务（LLM/工具均为 mock/桩）

## 4. 实际执行的测试命令

| # | 命令 | 范围 |
|---|---|---|
| 1 | `mvn -q test -pl sw-basic/sw-basic-agent -Dtest=AgentGraphInterpreterTest` | Step2 单测（改造后首次） |
| 2 | `mvn test -pl sw-basic/sw-basic-agent -Dtest='AgentGraphInterpreterTest,AgentGraphExecutionServiceImplTest'` | Step3 两个改造测试类 |
| 3 | `mvn test` | 全工程回归（两次运行，一次 grep 汇总、一次 awk 求和，结果一致） |

## 5. 各测试项结果

### 5.1 新增用例（Step10 多变量语义）

| # | 测试项 | 预期 | 实际 | 结果 |
|---|---|---|---|---|
| 1 | Interpreter 用例8：LLM `outputVar=summary` + END `inputVar=summary`；第二 LLM 无变量键 | output="摘要输出"；第二 LLM 收到默认变量原值"初始输入"（命名变量写入不污染默认变量） | 断言全过 | ✅ |
| 2 | Interpreter 用例9：LLM `inputVar=raw, outputVar=final` 链 | output="最终结果"；第二跳收到"中间结果"（raw 变量值，非默认变量） | 断言全过 | ✅ |
| 3 | Interpreter 用例10：LLM `inputVar=notExists` | GraphExecutionException 含"引用了未定义的变量: notExists" | 断言全过 | ✅ |
| 4 | Interpreter 用例11：CONDITION `inputVar=judge`（默认变量不含关键词） | 走"成功"边输出"成功路"（若误用默认变量会走失败路） | 断言全过 | ✅ |
| 5 | Interpreter 用例12：旧图形态（全无变量键）LLM→CONDITION→LLM | 基于 LLM 覆盖后的默认变量匹配走"发货"边 | 断言全过 | ✅ |
| 6 | Service 用例13：LLM `outputVar=summary` + END `inputVar=summary`（graph_json 序列化往返全链路） | success=true + output="汇总输出" + errorMessage null | 断言全过 | ✅ |
| 7 | Service 用例14：LLM `inputVar=missing` 未定义变量 | success=false + errorMessage 含"引用了未定义的变量: missing" + latencyMs 非负 | 断言全过 | ✅ |

### 5.2 既有用例回归

| 测试类 | 用例数 | 结果 |
|---|---|---|
| `AgentGraphInterpreterTest`（既有 1-7：LLM 单跳覆盖/TOOL 单跳/条件命中/默认边/无默认边报错/环步数超限/顺序链路，全部无变量键 = 旧图形态） | 7 | 全过 |
| `AgentGraphExecutionServiceImplTest`（既有 1-12：已发布图成功/DRAFT 拒/不存在 NOT_FOUND/模型配置缺失/工具缺失/跨租户/START 不唯一/END 不可达/默认边不唯一/TOOL 执行/条件无匹配 success=false/模型异常 success=false） | 12 | 全过 |
| 其余全部模块（system/bpm/form/job/storage/notify/knowledge/iot/agent 其余测试类等） | 385-19=366 | 全过 |

## 6. 通过项

- 两个改造测试类：`AgentGraphInterpreterTest` **12/12**（7→12，+5）、`AgentGraphExecutionServiceImplTest` **14/14**（12→14，+2）
- 全工程：**392 run / 0 failures / 0 errors / 0 skipped**（`mvn test` 两次独立运行一致；各模块 `Tests run` 汇总求和 = 392）
- 关键输出：`[INFO] BUILD SUCCESS`（全工程）

## 7. 失败项

无。

## 8. 跳过项及原因

无。

## 9. 关键日志或错误信息

- Mockito inline-mock-maker 动态 agent 自附加警告（JDK 未来版本提示）——既有环境警告，非本次改动引入，不影响结果
- 无测试失败/错误日志

## 10. 是否满足验收标准

| 验收标准（规划层复核项） | 满足 | 证据 |
|---|---|---|
| 节点 config 出现"输入变量名/输出变量名"语义键，LLM/TOOL 可指定读/写变量 | ✅ | `CONFIG_KEY_INPUT_VAR="inputVar"` / `CONFIG_KEY_OUTPUT_VAR="outputVar"`（AgentGraphInterpreter 常量）；用例 8/9/13 实证读写语义 |
| 未指定变量名时行为与单一 currentText 语义兼容（旧图零迁移） | ✅ | `DEFAULT_VARIABLE_NAME="input"` 缺省锚点；用例 12 显式验证 + 既有 19 个无变量键用例全绿（零迁移回归面） |
| 条件分支匹配语义在新上下文中正确定义（基于哪个变量匹配） | ✅ | CONDITION `config.inputVar` 指定匹配变量（缺失=默认变量）；用例 11 实证（默认变量无关键词、命名变量含关键词时走命名变量分支） |
| 既有测试不回归（基线 385），新增测试覆盖新语义（含未定义变量/变量缺失边界） | ✅ | 385→392 全绿；用例 10/14 覆盖未定义变量（单测 + 全链路双路径） |
| 请求/响应 DTO 对外契约未变 | ✅ | 两 DTO 仅注释同步（§执行回执 §8），字段/结构/校验零改动；Service 接口、Controller 零改动 |

## 11. 回归风险

- 低。改动集中在 `AgentGraphInterpreter.run()` 内部（局部变量 `text` → `variables` 表），对外签名 `run(ProcessGraph, String)` 与 Service 调用点未变；旧图（无变量键）路径经 19 个既有用例 + 用例 12 验证行为一致
- 解释器实例仍无状态（变量表为 run() 局部变量），无并发/线程安全风险

## 12. 最终结论

**PASSED**

## 13. 记忆更新草稿（仅供规划层核对后落盘，不构成最终判定）

### state.md 追加行

M07-F02 Step10 多变量执行上下文后端地基（本轮执行层自主闭环）：AgentGraphInterpreter 执行上下文升级为命名变量表——config.inputVar/outputVar 契约键（LLM/TOOL 读写命名变量）、默认变量 input（旧图零迁移锚点）、CONDITION/END 经 inputVar 指定匹配/输出变量、未定义变量引用运行时错误；DTO 仅注释同步零契约变更；385→392 tests。

（判定占位：PASSED（待编号 D66））

### decisions.md 新增条目

D_TBD | 2026-08-11 | M07-F02 Step10（多变量执行上下文）核验判定：**PASSED**。385→392 tests。设计决策：①执行上下文=Map<String,String> 命名变量表（值限 String），初始仅含默认变量 input（=请求入参）；②inputVar/outputVar 独立缺省到默认变量——旧图无变量名字段即落默认变量，零迁移无 Flyway；③CONDITION/END 经 config.inputVar 指定匹配/输出变量（缺失=默认变量）；④未定义变量引用=运行时 GraphExecutionException→success=false，不做执行前数据流静态校验；⑤写入新变量名=创建变量 | Active

### issues.md 新增条目

无新增

### features.md 状态变更

无变化
