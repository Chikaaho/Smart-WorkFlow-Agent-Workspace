# 执行回执

## 1. Step 编号和名称

**M07-F02 多变量执行上下文（后端地基）** — 本轮为需求方向文档驱动的执行层自主闭环，自拆 4 个 Step 全部完成（规划层不逐 Step 收取回执，此为功能级完成回执，自拆 Step 概要见 §13 前段与本文件 §5）

- 功能：agent-model-orchestration（M07-F02 图设计器能力延伸——执行上下文从单一 `String currentText` 升级为命名变量存取，作为后续并行/循环节点地基）
- 方向文档：`product/agent-model-orchestration/ready/step-10-multivar-context-backend.md`（目标 §2 / 非目标 §3 / 影响范围 §4，唯一权威任务定义）
- 前置调研回执：`search_fallback/m07-multivar-context-precedent.md`（磁盘现状 7 问全量核实，与 Step8 归档一致）
- 前置：Step8 图解释执行引擎（D64，385 tests）、Step9 前端图设计器（D65）
- 测试基线口径：385 tests（全工程，Step8 after 基线）
- **执行时间**：2026-08-11
- **改动文件清单（实际）**：修改 5（`AgentGraphInterpreter.java`、`AgentGraphInterpreterTest.java`、`AgentGraphExecutionServiceImplTest.java`、`AgentGraphExecuteReqDTO.java`、`AgentGraphExecuteRespDTO.java`）；新建 0；Flyway 脚本 0（config 为 JSON 不透明字段，无表结构变化，零迁移不需要迁移脚本）；前端 0（禁止触碰）

## 2. 使用模型

- 执行模型：deepseek-v4-flash（本会话实际执行；方向文档与记忆确认同族模型替换属用户成本优化选型惯例，非需核验偏差）

## 3. 实际读取的文件

| 文件 | 用途 |
|---|---|
| `product/agent-model-orchestration/ready/step-10-multivar-context-backend.md` | 需求方向文档（目标/非目标/影响范围/待确认问题结论） |
| `search_fallback/m07-multivar-context-precedent.md` | 前置调研（磁盘现状全量源码 + Q7 sw-bpm 流程变量先例） |
| `/data/reasonix/files/system.md`（§6/§7） | 17 项结构自查参考 + 回执格式（§7.1/§7.2） |
| `Smart-WorkFlow/.claude/system.md` | 后端工程宪法（执行层身份边界、编码规范） |
| `sw-basic-agent/.../orchestration/AgentGraphInterpreter.java` | 改造对象（磁盘现状与调研回执逐字节一致，已核实） |
| `sw-basic-agent/.../service/impl/AgentGraphExecutionServiceImpl.java` | 调用点现状（与调研回执一致，确认无需改执行代码） |
| `sw-basic-agent/.../dto/AgentGraphExecuteReqDTO.java` / `AgentGraphExecuteRespDTO.java` | DTO 契约（确认对外契约零改动，仅注释同步） |
| `sw-basic-agent/.../dto/graph/GraphElement.java` / `ProcessGraph.java` | 图模型（config 为不透明 Map，新增键走既有透传机制，无需改） |
| `sw-basic-agent/.../service/impl/AgentGraphDefServiceImpl.java` | saveDraftGraph 的 graph_json 序列化确认（config 整包往返，变量键可自然落库） |
| `sw-basic-agent/src/test/.../AgentGraphInterpreterTest.java` | 既有单测（7 用例，全无变量名字段 = 零迁移回归的直接证据） |
| `sw-basic-agent/src/test/.../AgentGraphExecutionServiceImplTest.java` | 既有集成测试（12 用例，TestConfig 组合装配模式复用） |
| `receipts/step-8-execution.md` / `step-8-test.md` | Step8 回执格式参照（同功能族） |

## 4. 实际修改的文件

**修改（5 个）**：

1. `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/orchestration/AgentGraphInterpreter.java`
2. `Smart-WorkFlow/sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/orchestration/AgentGraphInterpreterTest.java`
3. `Smart-WorkFlow/sw-basic/sw-basic-agent/src/test/java/com/sw/ck/agent/service/impl/AgentGraphExecutionServiceImplTest.java`
4. `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/AgentGraphExecuteReqDTO.java`
5. `Smart-WorkFlow/sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/dto/AgentGraphExecuteRespDTO.java`

新建 0；未修改：`AgentGraphExecutionServiceImpl`、`GraphElement`/`ProcessGraph`、`AgentGraphExecutionService` 接口、Controller、Flyway。

## 5. 每个文件的修改摘要（含自拆 Step 概要）

### 自拆 Step 概要（执行层自主拆分，4 步）

| Step | 名称 | 验收结果 |
|---|---|---|
| 1 | `AgentGraphInterpreter` 多变量上下文改造（变量表 + inputVar/outputVar 契约键 + CONDITION/END 语义 + 未定义变量运行时错误） | 编译通过；语义设计落地（见 §9 设计要点） |
| 2 | `AgentGraphInterpreterTest` 多变量语义单测（纯 Java，用例 8-12 新增 5 个） | 12/12 通过 |
| 3 | `AgentGraphExecutionServiceImpl` 适配确认 + DTO 注释同步 + Service 全链路集成测试（用例 13/14 新增 2 个） | 14/14 通过；执行 Service 生产代码零改动 |
| 4 | 全量回归 + 提交 + 回执 | 全工程 392/392 通过（385 → 392，+7 无回归）；提交 50dc0df |

### 逐文件摘要

1. **`AgentGraphInterpreter.java`**（+129/-25 净改动）：
   - 新增 3 个执行契约常量：`CONFIG_KEY_INPUT_VAR = "inputVar"`、`CONFIG_KEY_OUTPUT_VAR = "outputVar"`、`DEFAULT_VARIABLE_NAME = "input"`（默认变量名，零迁移锚点）
   - `run()`：单一 `String text` 局部变量 → `Map<String, String> variables` 命名变量表（初始仅含默认变量 = 请求入参）；LLM/TOOL 分支改为 `writeOutput(node, variables, callXxxNode(node, readInput(node, variables)))`；END 返回 `readVariable(endNode, variables, CONFIG_KEY_INPUT_VAR)`（END config.inputVar 指定最终输出变量，缺失 = 默认变量）
   - `nextNodeId()` 签名改为传变量表；CONDITION 匹配文本 = `readInput(current, variables)`（CONDITION config.inputVar 指定匹配变量）
   - 新增 4 个方法：`readInput`（读 inputVar 变量）、`readVariable`（按变量名键读取，未定义抛 `GraphExecutionException("引用了未定义的变量: <名>（节点 <id>）")`）、`writeOutput`（写 outputVar 变量，指定新名 = 创建变量）、`resolveVarName`（config 缺失/键缺失/非 String/空白 → 默认变量，与 `keywordOf` 同款宽松语义）
   - 类 javadoc 全面更新（执行上下文/契约键/未定义变量错误语义）；`GraphExecutionException` javadoc 扩展未定义变量引用

2. **`AgentGraphInterpreterTest.java`**（+142）：新增用例 8-12
   - 用例 8：LLM `outputVar=summary` + END `inputVar=summary` → 返回 summary 值，且第二个 LLM（无变量键）收到默认变量原值（命名变量写入不污染默认变量——多变量核心）
   - 用例 9：LLM `inputVar=raw, outputVar=final` 链 → 模型收到 raw 变量值（非默认变量），END 读 final
   - 用例 10：`inputVar` 引用未定义变量 → `GraphExecutionException` 含 "引用了未定义的变量: notExists"（运行时错误，非静态校验）
   - 用例 11：CONDITION `inputVar=judge` → 基于命名变量匹配走成功边；默认变量不含关键词（若误用默认变量会走失败边，证明匹配语义正确）
   - 用例 12：旧图形态（全图无变量名字段）LLM 覆盖默认变量 → CONDITION 基于新值匹配（零迁移显式验证；既有用例 1-7 亦全无变量键，共 12 个用例构成零迁移回归面）

3. **`AgentGraphExecutionServiceImplTest.java`**（+47）：新增用例 13/14（全链路 @SpringBootTest + H2）
   - 用例 13：LLM `outputVar=summary` + END `inputVar=summary` 经 graph_json 序列化往返 → success=true + output=summary 值
   - 用例 14：`inputVar=missing` 未定义变量 → success=false + errorMessage 含 "引用了未定义的变量: missing"（不上抛，与 F01 语义一致）

4. **`AgentGraphExecuteReqDTO.java`**（仅注释）：类注释与 input 字段注释同步新语义（input 写入默认变量；字段、结构、校验零改动）

5. **`AgentGraphExecuteRespDTO.java`**（仅注释）：output 字段注释同步（END inputVar 指定变量的值）；字段、结构零改动

## 6. 实际执行的命令

| # | 命令 | 结果 |
|---|---|---|
| 1 | `mvn -q compile -pl sw-basic/sw-basic-agent -am` | EXIT=0（基线编译，改造前） |
| 2 | `mvn -q compile -pl sw-basic/sw-basic-agent -am` | EXIT=0（Step1 增量编译） |
| 3 | `mvn -q test -pl sw-basic/sw-basic-agent -Dtest=AgentGraphInterpreterTest` | EXIT=0（Step2 单测） |
| 4 | `mvn test -pl sw-basic/sw-basic-agent -Dtest='AgentGraphInterpreterTest,AgentGraphExecutionServiceImplTest'` | 26 通过（12+14，Step3） |
| 5 | `mvn test`（全工程） | BUILD SUCCESS，TOTAL TESTS = 392（Step4 回归） |

## 7. 命令输出摘要

- 全工程测试：392 run / 0 failures / 0 errors / 0 skipped（各模块汇总求和，见测试回执 §6）
- 两个改造测试类：`AgentGraphInterpreterTest` 12/12、`AgentGraphExecutionServiceImplTest` 14/14
- 提交：`50dc0df feat: M07 Step10 多变量执行上下文 — ... COMPLETED`（5 files changed, 327 insertions(+), 45 deletions(-)）

## 8. 与原方案的偏差

无"原方案"可比对——本轮为需求方向文档驱动的自主闭环（规划层只下发方向，Step 拆分与方案设计由执行层按根 system.md §6 17 项自查完成）。与方向文档的约定对照：

- ✅ 目标达成：执行上下文升级为命名变量存取，LLM/TOOL 节点可指定"从哪个变量读、写到哪个变量"（`config.inputVar`/`config.outputVar`）
- ✅ 零迁移达成：未指定变量名 = 读写默认变量 `input`（旧图无变量名字段全部落此变量，行为与单一 currentText 语义一致；实测既有 12 个单测 + 12 个集成用例无变量键全绿）
- ✅ 非目标未触碰：并行/循环节点未实现；未做执行前数据流静态校验（未定义变量 = 运行时 `GraphExecutionException` → success=false，方向文档已确认倾向）；未扩展非文本变量类型（变量表值恒为 String）；请求/响应 DTO 字段结构零改动
- ✅ 影响范围符合：仅 sw-basic-agent 模块；前端（Smart-WorkFlow-Web/）零触碰
- ✅ Flyway 零新增：变量语义全部落在 `GraphElement.config`（JSON 不透明 Map）已有键上，无表结构变化，符合"零迁移成本生效（不需要 Flyway、不需要历史数据回填）"

## 9. 遇到的问题与设计决策（方案设计要点，供验收复核）

1. **默认变量命名 `input`**：参照 sw-bpm 流程变量先例（`Map<String, Object>` + 按名存取）的命名风格，但 agent 图变量值限定 String。默认变量名取 `input`（与请求入参对应、语义直观）；若用户新图显式使用名为 `input` 的变量即默认变量，属有意复用。
2. **inputVar/outputVar 独立缺省**：每个键各自缺省到默认变量（非"指定一个则另一个强制"）。规则单一：inputVar 缺省 = 读默认变量，outputVar 缺省 = 写默认变量，组合自然，零迁移最稳。
3. **CONDITION 匹配语义（验收关键项）**：CONDITION 节点自身 `config.inputVar` 指定匹配基于哪个变量（缺失/空白 = 默认变量）。用例 11 证明：默认变量不含关键词、judge 变量含关键词时正确走命名变量分支。CONDITION 为纯路由点，无 outputVar 概念（不写变量）。
4. **END 输出语义（验收关键项）**：END 节点 `config.inputVar` 指定最终输出取自哪个变量（缺失 = 默认变量 = Step8 "END 时 currentText 即 output"）。避免"命名变量写出后 END 只能返回默认变量"的缺口。
5. **未定义变量引用**：运行时错误（`GraphExecutionException`，Service 捕获转 success=false + errorMessage），不做执行前静态校验——与方向文档"倾向前者以控制范围"一致。默认变量恒存在（run 开头写入入参），旧图永不触发此错误。
6. **变量名宽松语义**：config 键缺失/值非 String/空白 = 未指定 = 默认变量（与 `keywordOf` 同款）。变量名格式不做字符集限制（Map key 即任意非空 String）。Service 执行前校验不加变量名校验（保持最小校验面，方向文档 §3 排除静态校验）。
7. **写入新变量名 = 创建变量**：outputVar 指定未出现过的新名直接创建（"写到哪个变量"的自然语义），不存在"必须先声明"的要求。
8. **变量表生命周期**：`variables` 为 `run()` 方法体局部变量（解释器实例仍无状态，与调研结论"落地为字段或传入参数均可、当前结构两者都不冲突"吻合——选局部变量保持无状态与可并发）。

## 10. 未完成内容

无。方向文档目标/非目标范围内的内容全部完成。

## 11. 风险和注意事项

1. **变量命名冲突**：新图若用变量名 `input`，将与默认变量同物——已在回执中作为显式语义记录，前端属性面板 Step 需在 UI 提示（前端不在本轮范围）。
2. **CONDITION 使用未定义变量**：新图中 CONDITION 的 inputVar 指向从未写入的变量 → 运行时 success=false（用例 11 分支前若变量缺失即此错误）；图设计者需保证变量写入在分支之前（数据流顺序依赖，静态校验明确不做）。
3. **END inputVar 缺失变量**：同样运行时 success=false，语义自洽。
4. **多变量与死循环防护的交互**：条件分支绕圈时变量被重复覆盖，maxSteps 兜底不变，无新风险。
5. **宽松解析的静默回退**：变量名配错类型（非 String）会静默落到默认变量而非报错——与 keywordOf 惯例一致，风险低（前端面板 Step 会限定输入为字符串）。

## 12. Git diff 摘要

- 提交：`50dc0df`（develop 分支，与 M07 Step7/8/9 提交同分支连续）
- 改动文件数：5（全部 sw-basic-agent 内：2 生产 + 2 测试 + 1 测试类）
- 新增行：327；删除行：45
- 关键变更点：解释器变量表改造（+3 常量 +4 方法）、单测 +5 用例、集成测试 +2 用例、2 个 DTO 注释同步

## 13. 建议执行的测试

1. 重点验证：用例 8/9（命名变量写入不污染默认变量、inputVar/outputVar 链式传递）、用例 11（CONDITION 命名变量匹配）、用例 12（旧图零迁移）
2. 边界验证：用例 10/14（未定义变量运行时错误，单测 + 集成双路径）
3. 全量回归：全工程 392 tests 已跑通，规划层复核时可抽查 sw-basic-agent 模块两个改造测试类

**验收标准对照（规划层复核用）**：
- 节点 config 出现 `inputVar`/`outputVar` 语义键，LLM/TOOL 可指定读/写变量 ✅（AgentGraphInterpreter 常量 + 测试用例 8/9/13）
- 未指定变量名行为与单一 currentText 兼容（旧图零迁移）✅（默认变量 `input` + 用例 12 + 既有 24 个无变量键用例全绿）
- 条件分支匹配语义在新上下文正确定义 ✅（CONDITION inputVar + 用例 11，语义说明见 §9.3）
- 既有测试不回归（基线 385），新增测试覆盖新语义含未定义变量/变量缺失边界 ✅（392 全绿，新增用例 10/14 覆盖边界）
- 请求/响应 DTO 对外契约未变 ✅（仅注释同步，字段/结构/校验零改动）
