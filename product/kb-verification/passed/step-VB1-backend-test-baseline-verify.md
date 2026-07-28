# Step VB1：后端测试基线运行期复验（纯后端）

## 1. 当前状态

知识库对账（2026-07-22）发现：后端测试基线记为「406 tests / 26 files」并曾标 CONFIRMED，但规划层静态取证得 `@Test` 注解仅 203 处，且 `@ParameterizedTest`=0 / `@RepeatedTest`=0，无法解释 406≈2×203 的差值。规划层无权运行 `mvn test`，已将 current-status §1/§9 计数降级为 REPORTED（见 [[known-issues]] I24）。本 Step 交后端执行代理运行真值回填。此为 kb-verification 功能的独立后端任务，与前端 VF1 无依赖。

## 2. Step 目标

运行后端校验门，取得运行期真实测试用例数与编译/测试结论，回填知识库并解释静态 203 与运行数的差异来源。

## 3. 推荐模型

```
推荐模型：deepseek-v4-flash
选择理由：仅运行既有校验命令并如实记录输出，无代码设计与架构决策
是否触发升级条件：否
```

## 4. 模型选择理由

纯运行 + 取证记录，不改任何源码，属最简机械任务，Flash 足够。

## 5. 已知上下文

- 后端为 Java 21 + Spring Boot 3.4.4 模块化单体，四层架构（sw-framework/sw-basic/sw-biz/sw-bootstrap）
- 校验门定义见 `knowledge/development-workflow.md` §2.1：`mvn -q compile && mvn -q test`，全工程计数
- 规划层静态取证结果（供你比对）：测试类文件 26 个，`@Test` 注解 203 处，`@ParameterizedTest`=0，`@RepeatedTest`=0
- 疑点：知识库「406 tests」来源为 2026-07-21 job-scheduler B4 验收回执

## 6. 执行前必须读取的文件

1. `knowledge/development-workflow.md` §2.1（后端校验门定义）
2. `knowledge/known-issues.md` I24（问题背景）

## 7. 允许修改的文件范围

- 仅允许**新建**回执文件：
  - `product/kb-verification/receipts/step-VB1-backend-test-baseline-verify-execution.md`
  - `product/kb-verification/receipts/step-VB1-backend-test-baseline-verify-test.md`
- **不得修改任何源码、配置、测试文件、pom、Flyway 脚本**

## 8. 禁止修改的范围

- `Smart-WorkFlow/` 下**全部**业务代码、测试代码、配置、pom、SQL — 一律禁止改动
- 本任务是「只读运行 + 记录」，任何源码 diff 都视为越界

## 9. 详细执行方案

在 `Smart-WorkFlow/` 目录下按序执行：

1. `mvn -q compile` — 记录退出码
2. `mvn -q test` — 记录退出码，并从输出中提取 Surefire 汇总行 `Tests run: N, Failures: F, Errors: E, Skipped: S`（可能每模块一行，需汇总各模块的 `Tests run` 求总和，给出总数与逐模块分解）
3. 若测试框架输出未直接给总数，运行 `mvn test` 后读取各模块 `target/surefire-reports/*.txt` 汇总
4. 针对 203↔运行数差异排查其来源，任选可解释项据实说明：是否存在 `@Nested`、JUnit4 `@org.junit.Test`（区别于 JUnit5）、`@TestFactory` 动态测试、继承自基类的测试方法、或某测试类被多模块重复执行；若无法解释，如实记「差异来源不明」

## 10. 关键实现约束

- 只运行命令、只读产物，不改任何文件（回执除外）
- 报告运行期真实数字，不得沿用知识库旧数字「406」充数
- `Tests run` 必须是本次运行实测值

## 11. 边界情况

- 若 `mvn test` 因环境（缺依赖/H2/网络）失败：如实记录失败命令、完整错误、退出码，结论标 BLOCKED，不得伪造通过
- 若实际总数既非 406 也非 203：如实报告实测值，这正是本任务价值所在

## 12. 风险和回滚方案

- 本任务不改源码，无回滚需求
- 唯一副作用为 `target/` 构建产物，属正常编译输出

## 13. 测试方案

### 13.1 静态检查
- 确认执行前后 `git status` 中 `Smart-WorkFlow/` 无源码改动（仅 `target/` 变化）

### 13.2 单元测试
- 本任务即运行全量单元测试；无需新增用例

### 13.3 集成测试
- 无（不新增）

### 13.4 手工验证
- 人工核对 Surefire 汇总行与逐模块分解求和一致

### 13.5 回归检查
- 全量 `mvn -q test` 本身即回归；记录是否全绿

## 14. 验收标准

1. 回执含 `mvn -q compile` 退出码
2. 回执含 `mvn -q test` 退出码 + 运行期 `Tests run` 总数（附逐模块分解）
3. 回执明确回答：运行期总数是多少？与静态 203 的差异来源是否找到、是什么？
4. 回执确认 `Smart-WorkFlow/` 无源码 diff（仅 target/）
5. 结论为 PASSED（全绿且数字取得）/ FAILED（有测试红）/ BLOCKED（环境不可运行）之一

## 15. 执行回执格式

按 `knowledge/shared-constraints.md` §2.4 + 根 `system.md` §7.1 的 13 项，写入 `product/kb-verification/receipts/step-VB1-backend-test-baseline-verify-execution.md`。

## 16. 测试回执格式

按根 `system.md` §7.2 的 12 项，写入 `product/kb-verification/receipts/step-VB1-backend-test-baseline-verify-test.md`；§5 各测试项须给出运行期真实计数。

## 17. 明确禁止事项

- ❌ 不改任何源码/配置/测试/pom/SQL
- ❌ 不「顺手」修任何测试或告警
- ❌ 不沿用知识库旧数字，必须报实测
- ❌ 不做前端相关任何操作（前端复验是独立的 VF1）
