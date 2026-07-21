# Step 0a：后端测试基线验证

> 需求：M04-F01-01 BPM 单节点审批前后端联通
> 定位：前置验证 — 后端
> 目标：确认 17 个测试文件基线健康，不修复任何问题

---

## 1. 当前状态

功能 M04-F01-01 BPM 单节点审批前后端联通处于 PLANNING 阶段。后端 17 个测试文件当前通过状态为 REPORTED，未经新环境独立验证。此后端基线验证为第一个前置 Step，与前端基线验证（Step 0b）并行无依赖。

## 2. Step 目标

在具备 Java 21 + Maven 环境的机器上执行 `mvn -q compile && mvn -q test`，确认 17 个测试基线健康状态，报告结果。**不修复任何问题。**

## 3. 推荐模型

```text
推荐模型：deepseek-v4-flash
选择理由：纯机械执行 mvn test 命令并捕获输出，零代码修改，零推理需求
是否触发升级条件：否
```

## 4. 模型选择理由

本 Step 唯一动作是运行已有 Maven 命令，不写代码、不做决策、不需要理解业务逻辑。

## 5. 已知上下文

- Java 21 + Spring Boot 3.4.4 + MyBatis-Plus，模块化单体
- 17 个测试文件分布在 7 个模块中：
  - `sw-common`：1 个（`JacksonLongToStringConfigTest`）
  - `sw-security`：1 个（`SecurityAssemblyRegressionTest`）
  - `sw-basic-notify-biz`：2 个（`NotifyControllerIntegrationTest`、`NotifyMessageIntegrationTest`）
  - `sw-biz-form-biz`：7 个（controller + dynamic + service 测试）
  - `sw-biz-system-biz`：3 个（`AuthMeControllerTest`、`DictFacadeTest`、`LogicalDeleteTest`）
  - `sw-bpm-engine`：2 个（`ApprovalProcessIntegrationTest`、`GraphToBpmnTranslatorTest`）
  - `sw-bpm-process`：1 个（`GraphValidatorTest`）
- 测试使用 H2 内存库（`MODE=PostgreSQL`），无需外部数据库
- 测试框架：JUnit 5 + AssertJ + Mockito，手工 `@Configuration`（不用 `@SpringBootTest` 自动配置）
- 两个模块有 `application-test.yml`：`sw-biz-form-biz`、`sw-biz-system-biz`
- 排除的自动配置：Redis、Security（部分）、Flyway、DynamicDataSource
- 无 CI/CD 配置

## 6. 执行前必须读取的文件

（无强制性读取。以下为可选的参考文件）

1. `Smart-WorkFlow/pom.xml` — 确认模块列表
2. `Smart-WorkFlow/sw-biz/sw-biz-form/sw-biz-form-biz/src/test/resources/application-test.yml` — H2 配置
3. `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/test/resources/application-test.yml` — H2 配置

## 7. 允许修改的文件范围

**本 Step 不修改任何文件。** 仅执行命令并报告结果。

## 8. 禁止修改的范围

- 禁止修改 `Smart-WorkFlow/` 下的任何 `.java`、`.xml`、`.yml`、`.properties` 文件
- 禁止安装/删除/升级任何 Maven 依赖（Maven 自动下载传递依赖除外）
- 禁止执行 `mvn spring-boot:run` 或任何启动服务器的命令
- 禁止修改任何测试文件

## 9. 详细执行方案

```bash
# 0. 环境检查
java -version
mvn --version

# 1. 进入后端项目目录
cd /data/reasonix/files/Smart-WorkFlow

# 2. 增量编译 + 全量测试（-q 静默，减少无关输出）
mvn -q compile && mvn -q test
```

**预期输出**：
- `java -version` 返回 Java 21.x
- `mvn --version` 返回 3.x
- 所有模块编译通过（含 test 源）
- Surefire 输出每个测试类的结果
- 最终 `BUILD SUCCESS`，退出码 0

**如果首次运行缺少依赖**：Maven 自动下载，等待即可。

## 10. 关键实现约束

- **只读操作**：H2 内存库，不写入任何持久化存储
- **不修复**：无论结果如何，只报告不修改
- **全量运行**：不使用 `-pl` 过滤模块，不使用 `-Dtest=` 过滤测试类
- **退出码必须精确捕获**

## 11. 边界情况

- **Maven wrapper**：如果项目有 `mvnw`，优先用 `./mvnw`
- **Java 版本不匹配**：报告实际版本，不尝试切换
- **依赖下载失败**：检查网络，如需代理在回执中注明
- **H2 兼容性**：部分 SQL 在 H2 PostgreSQL 模式下可能与真实 PG 行为不同，属于已知限制

## 12. 风险和回滚方案

- **风险**：测试因环境差异失败（JDK 版本、H2 版本）
- **缓解**：先执行 `java -version` 和 `mvn --version` 建立环境基线
- **回滚**：无需回滚（不修改任何文件）

## 13. 测试方案

### 13.1 静态检查

- `java -version` 输出确认 Java 21
- `mvn --version` 输出确认 Maven 3.x

### 13.2 ~ 13.5

本 Step 本身就是测试执行，不新增测试。

## 14. 验收标准

| # | 标准 | 验证方式 |
|---|------|----------|
| S0a-1 | `java -version` 和 `mvn --version` 已报告 | 回执 §6 |
| S0a-2 | `mvn -q compile` 已执行且退出码已报告 | 回执 §7 |
| S0a-3 | `mvn -q test` 已执行 | 回执 §7 |
| S0a-4 | 包含每个模块的 Tests run / Failures / Errors / Skipped 完整计数 | 回执 §7 |
| S0a-5 | 最终 BUILD 状态（SUCCESS 或 FAILURE）已报告 | 回执 §7 |
| S0a-6 | 如存在失败，列出所有失败模块、测试类名、失败原因 | 回执 §7 |

## 15. 执行回执格式

```markdown
# 执行回执

## 1. Step 编号和名称
Step 0a：后端测试基线验证

## 2. 使用模型
（实际使用的模型名称）

## 3. 实际读取的文件
（列出执行前读取的文件，无则写"无"）

## 4. 实际修改的文件
无

## 5. 每个文件的修改摘要
无

## 6. 实际执行的命令
（逐条列出完整命令和参数）

## 7. 命令输出摘要
- Java 版本：
- Maven 版本：
- 编译结果（BUILD SUCCESS / FAILURE，耗时）：
- 测试结果（逐模块列出 Tests run / Failures / Errors / Skipped）：
- 最终 BUILD 状态：

## 8. 与原方案的偏差
（是否严格按方案执行，如有偏差说明原因）

## 9. 遇到的问题
（环境问题、依赖下载失败等）

## 10. 未完成内容
（方案要求但未执行的内容及原因）

## 11. 风险和注意事项
（发现的环境相关风险）

## 12. Git diff 摘要
无 diff（未修改任何文件）

## 13. 建议执行的测试
（如有测试失败，建议排查方向）
```

## 16. 测试回执格式

本 Step 执行与测试合一，仅需执行回执（§15），不需要单独的测试回执。

## 17. 明确禁止事项

- ❌ 禁止修改任何 Java 代码、XML 配置、YML 配置文件
- ❌ 禁止跳过任何模块的测试
- ❌ 禁止安装/删除/升级任何 Maven 依赖
- ❌ 禁止执行 `mvn spring-boot:run`
- ❌ 禁止执行 Flyway 迁移
- ❌ 禁止修改 `pom.xml`
