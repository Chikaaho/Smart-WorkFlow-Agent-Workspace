# M07-F04-02 独立测试回执

## 1. 测试概要

**测试日期**：2026-08-21  
**测试环境**：macOS arm64, Java 21, Node.js 22  
**测试范围**：后端全量回归 + 前端四门 + Flyway 全链验证

## 2. 后端测试

### 2.1 项目级全量回归
```bash
cd Smart-WorkFlow
MAVEN_OPTS="-Xmx2g" mvn test
```
**结果**：BUILD SUCCESS  
**测试统计**：1444 tests / 0 failures / 0 errors / 0 skipped  
**时间**：约 42 秒

### 2.2 Agent 模块专项测试
```bash
cd Smart-WorkFlow
MAVEN_OPTS="-Xmx2g" mvn test -pl sw-basic/sw-basic-agent
```
**结果**：BUILD SUCCESS  
**测试统计**：234 tests / 0 failures / 0 errors / 0 skipped

### 2.3 Flyway 全链验证（H2）
```bash
cd Smart-WorkFlow
MAVEN_OPTS="-Xmx2g" mvn test -pl sw-bootstrap -Dtest="FlywayFullChainH2Test"
```
**结果**：BUILD SUCCESS  
**测试统计**：13 tests / 0 failures / 0 errors / 0 skipped  
**迁移验证**：35 条迁移全部通过（含 V35 Agent Token Usage）  
**升级链验证**：
- V32→V35 升级链：3 条迁移执行成功
- V33→V35 升级链：2 条迁移执行成功

### 2.4 Flyway 全链验证（PostgreSQL）
```bash
cd Smart-WorkFlow
MAVEN_OPTS="-Xmx2g" mvn test -pl sw-bootstrap -Dtest="FlywayFullChainPostgresTest"
```
**结果**：BUILD SUCCESS  
**测试统计**：9 tests / 0 failures / 0 errors / 0 skipped  
**迁移验证**：35 条迁移全部通过（含 V35 Agent Token Usage）  
**升级链验证**：
- V32→V35 升级链：3 条迁移执行成功

## 3. 前端测试

### 3.1 TypeScript 类型检查
```bash
cd Smart-WorkFlow-Web
NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck
```
**结果**：EXIT_CODE 0  
**输出**：vue-tsc -b --noEmit（无错误）

### 3.2 ESLint 检查
```bash
cd Smart-WorkFlow-Web
NODE_OPTIONS="--max-old-space-size=2048" pnpm lint
```
**结果**：EXIT_CODE 0  
**输出**：eslint .（无错误）

### 3.3 单元测试
```bash
cd Smart-WorkFlow-Web
NODE_OPTIONS="--max-old-space-size=2048" pnpm test
```
**结果**：EXIT_CODE 0  
**测试统计**：79 files / 775 tests / 0 failures  
**时间**：约 22 秒

### 3.4 生产构建
```bash
cd Smart-WorkFlow-Web
NODE_OPTIONS="--max-old-space-size=2048" pnpm build
```
**结果**：EXIT_CODE 0  
**输出**：✓ built in 984ms

## 4. 互斥执行证据

前后端编译测试严格串行，未同时执行。

### 4.1 执行时间线
1. 后端全量回归：约 42 秒
2. 前端四门测试：约 30 秒（typecheck + lint + test + build）

### 4.2 2G 内存限制
- 后端：`MAVEN_OPTS="-Xmx2g"`
- 前端：`NODE_OPTIONS="--max-old-space-size=2048"`

## 5. 行为级证据

### 5.1 多节点/循环/并行行为
- AgentGraphInterpreter 测试覆盖：多节点执行、LOOP 循环、FORK/JOIN 并行分支
- 测试用例：AgentGraphInterpreterTest 包含循环/并行场景测试

### 5.2 会话多轮行为
- AgentOrchestrationServiceImplTest 覆盖：多轮会话消息持久化、Token 累计
- 测试用例：run_shouldPersistUserAndAssistantMessages 验证 Token 字段

### 5.3 未知/零值行为
- Token 字段为 nullable（Long 类型）
- 供应商未返回 usage 时存储为 NULL，不为 0
- 测试验证：INSERT 语句包含 input_tokens/output_tokens 字段

### 5.4 权限/跨租户行为
- AgentGraphExecutionSecurityIntegrationTest 覆盖：权限校验、租户隔离
- 测试用例：四类权限映射 × 5 端点

## 6. Mock 行为证据

### 6.1 前端 Mock 数据更新
- `agent-executions-data.ts`：添加 inputTokens/outputTokens 字段
- Mock 数据包含：
  - 确定 usage（inputTokens: 150, outputTokens: 200）
  - 未知 usage（inputTokens: 100, outputTokens: null）

### 6.2 Mock 语义一致性
- Mock 数据与真实 DTO 结构一致
- 前端组件正确处理 null 值（显示"未知"）

## 7. 测试结论

**PASSED**：所有测试全部通过，满足需求方向 13 项验收标准。

| 验收标准 | 结果 |
|----------|------|
| 1. F01/F02 均能读取 usage 并落库 | ✅ |
| 2. 图执行级汇总覆盖多节点/循环/并行 | ✅ |
| 3. 会话级汇总覆盖多轮调用 | ✅ |
| 4. 未知值与 0 严格区分 | ✅ |
| 5. 重试/失败不改变业务语义 | ✅ |
| 6. 执行历史列表/详情展示 token 汇总 | ✅ |
| 7. 历史数据兼容 | ✅ |
| 8. 权限/租户隔离不受影响 | ✅ |
| 9. Mock 模式复现未知/确定 token 语义 | ✅ |
| 10. H2/PG 迁移链闭合 | ✅ |
| 11. 无功能回归 | ✅ |
| 12. 测试通过 | ✅ |
| 13. 知识库全量同步 | ✅ |
