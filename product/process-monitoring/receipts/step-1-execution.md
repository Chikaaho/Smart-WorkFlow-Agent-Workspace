# 执行回执

## 1. Step 编号和名称

**Step 1：后端 Facade + Service 层 — 流程实例查询 + 活跃节点 + 流转记录**

## 2. 使用模型

`deepseek-v4-flash`（执行层后端代理，当前工作目录 `Smart-WorkFlow/`）

## 3. 实际读取的文件

| # | 文件 | 读取目的 |
|---|------|------|
| 1 | `sw-biz/sw-bpm/sw-bpm-api/.../facade/BpmRuntimeFacade.java` | 确认现有接口签名 |
| 2 | `sw-biz/sw-bpm/sw-bpm-engine/.../facade/BpmRuntimeFacadeImpl.java` | 确认现有实现模式、Flowable 服务注入方式 |
| 3 | `sw-biz/sw-bpm/sw-bpm-api/.../facade/BpmTaskFacade.java` | 参照已有 Facade 方法命名和 DTO 约定 |
| 4 | `sw-biz/sw-bpm/sw-bpm-engine/.../facade/BpmTaskFacadeImpl.java` | 参照 Flowable HistoryService/RuntimeService 调用模式 |
| 5 | `sw-biz/sw-bpm/sw-bpm-process/.../entity/BpmInstance.java` | 确认实体字段 |
| 6 | `sw-biz/sw-bpm/sw-bpm-process/.../service/BpmInstanceService.java` | 确认现有方法签名 |
| 7 | `sw-biz/sw-bpm/sw-bpm-process/.../service/impl/BpmInstanceServiceImpl.java` | 确认 lambdaQuery() 使用模式 |
| 8 | `sw-biz/sw-bpm/sw-bpm-api/.../dto/BpmTaskDTO.java` | 参照 DTO 模式（确认 Lombok @Data 可用） |
| 9 | `sw-biz/sw-bpm/sw-bpm-process/.../entity/InstanceStatusEnum.java` | 确认状态枚举值 |
| 10 | `sw-framework/sw-common/.../page/PageResult.java` | 确认分页结果类结构 |
| 11 | `sw-framework/sw-common/.../page/PageParam.java` | 确认分页参数类结构 |
| 12 | `sw-biz/sw-bpm/sw-bpm-engine/.../integration/ApprovalProcessIntegrationTest.java` | 参照测试模式 |
| 13 | `sw-biz/sw-bpm/sw-bpm-engine/.../facade/BpmDeployFacadeImplTest.java` | 参照测试模式 |

## 4. 实际修改的文件

### 新建文件（4 个）

| 文件 | 说明 |
|------|------|
| `sw-biz/sw-bpm/sw-bpm-api/.../dto/BpmActivityDTO.java` | 流程活动节点 DTO（7 字段，@Data） |
| `sw-biz/sw-bpm/sw-bpm-process/.../dto/InstanceFilterDTO.java` | 实例查询过滤参数 DTO（3 字段，@Data） |
| `sw-biz/sw-bpm/sw-bpm-engine/.../facade/BpmRuntimeFacadeImplTest.java` | Facade 层单元测试（8 @Test） |
| `sw-biz/sw-bpm/sw-bpm-process/.../impl/BpmInstanceServiceImplTest.java` | Service 层集成测试（7 @Test） |

### 修改文件（5 个）

| 文件 | 说明 |
|------|------|
| `sw-biz/sw-bpm/sw-bpm-api/.../facade/BpmRuntimeFacade.java` | +31 行：新增 2 个方法签名 |
| `sw-biz/sw-bpm/sw-bpm-engine/.../facade/BpmRuntimeFacadeImpl.java` | +81/-3 行：注入 HistoryService + 2 个方法实现 + toActivityDto |
| `sw-biz/sw-bpm/sw-bpm-process/.../service/BpmInstanceService.java` | +17 行：新增 pageInstances 方法签名 |
| `sw-biz/sw-bpm/sw-bpm-process/.../impl/BpmInstanceServiceImpl.java` | +44 行：实现 pageInstances（LambdaQueryWrapper + 分页） |
| `sw-biz/sw-bpm/sw-bpm-process/pom.xml` | +5 行：添加 H2 test 依赖 |

### 新增测试资源

- `sw-bpm-process/src/test/resources/application-test.yml` — Spring Boot 测试配置（H2 + MyBatis-Plus）
- `sw-bpm-process/src/test/resources/db/schema-h2.sql` — `sw_bpm_instance` 表 DDL

## 5. 每个文件的修改摘要

### `BpmRuntimeFacade.java`
- **改动**：在 `startProcess` 之后新增 `getActiveActivityIds(String): List<String>` 和 `queryHistoricActivities(String): List<BpmActivityDTO>` 两个方法签名
- **原因**：为流程监控页面提供活跃节点查询和历史活动查询契约

### `BpmRuntimeFacadeImpl.java`
- **改动**：
  - 新增 `HistoryService` 字段 + 构造参数注入（原有只注入 `RuntimeService`）
  - `getActiveActivityIds`：调用 `runtimeService.getActiveActivityIds()`，含 null/blank/异常兜底返回空列表
  - `queryHistoricActivities`：调用 `historyService.createHistoricActivityInstanceQuery()` 链，按结束时间升序，含异常兜底
  - `toActivityDto`：private 方法，将 Flowable `HistoricActivityInstance` 转为我方 `BpmActivityDTO`（`Date→LocalDateTime` 用 `ZoneId.systemDefault()`）

### `BpmInstanceService.java`
- **改动**：新增 `pageInstances(PageParam, InstanceFilterDTO): PageResult<BpmInstance>` 方法签名

### `BpmInstanceServiceImpl.java`
- **改动**：实现 `pageInstances` 方法
- 使用 `LambdaQueryWrapper<BpmInstance>` 构建条件链（status/processDefKey/initiatorId 可选过滤）
- `getBaseMapper().selectCount(qw)` 先统计总数（不含 ORDER BY，兼容 H2 PostgreSQL 模式）
- 再 `qw.orderByDesc(...) + qw.last("LIMIT ... OFFSET ...")` 取分页数据
- **方案偏差说明**：原方案使用 `lambdaQuery()` 链式调用，因 MyBatis-Plus `lambdaQuery().count()` 会将 `ORDER BY` 带入 COUNT 查询，H2 PostgreSQL 模式报错。改为 `LambdaQueryWrapper` + 直接使用 `getBaseMapper()` 调用——先将排序移出 COUNT 范围，等价功能

### `pom.xml`
- **改动**：添加 `com.h2database:h2` test scope 依赖（`BpmInstanceServiceImplTest` 的 `@SpringBootTest` 需要 H2 驱动）

## 6. 实际执行的命令

```bash
mvn -q compile                    # 编译验证（零错误）
mvn -q test                       # 全量测试（BUILD SUCCESS）
```

## 7. 命令输出摘要

### `mvn -q compile`
- 零错误（跨 sw-bpm-api → sw-bpm-engine → sw-bpm-process 三模块）

### `mvn -q test`
- **BUILD SUCCESS**（退出码 0）
- 新增测试全部通过：
  - `BpmRuntimeFacadeImplTest$GetActiveActivityIdsTests`: 4/4 ✅
  - `BpmRuntimeFacadeImplTest$QueryHistoricActivitiesTests`: 4/4 ✅
  - `BpmInstanceServiceImplTest$PageInstancesTests`: 7/7 ✅
- 已有测试零退化

## 8. 与原方案的偏差

| 项 | 原方案 | 实际实现 | 原因 |
|----|--------|----------|------|
| BpmActivityDTO getter/setter | 手写（sw-bpm-api 无 Lombok） | 使用 `@Data` | 实际检查发现 `BpmTaskDTO` 已使用 `@Data`，`sw-bpm-api/pom.xml` 中有 Lombok 依赖 |
| InstanceFilterDTO getter/setter | 手写 | 使用 `@Data` | 同上，sw-bpm-process 也有 Lombok |
| pageInstances MyBatis-Plus 调用 | `lambdaQuery()` 链式调用 | `LambdaQueryWrapper` + `getBaseMapper()` | `lambdaQuery().count()` 会带上 ORDER BY，H2 PostgreSQL 模式报错 `Column must be in GROUP BY list` |
| BpmRuntimeFacadeImplTest 测试策略 | `@SpringBootTest` + H2 + 真实 Flowable 引擎 | `@ExtendWith(MockitoExtension.class)` 纯 Mockito | 与项目既有测试模式一致（参照 `BpmDeployFacadeImplTest`） |
| BpmInstanceServiceImplTest 测试策略 | Mockito（`@InjectMocks` + `when(mapper.selectCount()`) | `@SpringBootTest` + H2 + `@Transactional` | Mockito 无法使 MyBatis-Plus `lambdaQuery()` 工作（需真实 Mapper 代理） |

## 9. 遇到的问题

| 问题 | 原因 | 解决 |
|------|------|------|
| Mockito `@InjectMocks` 无法注入 MyBatis-Plus `baseMapper` | Mockito 处理泛型 setter 的方式与 MyBatis-Plus 兼容性问题 | 改用 `@SpringBootTest` + H2 真实数据库 |
| H2 PostgreSQL 模式不允许 COUNT + ORDER BY | H2 在 `MODE=PostgreSQL` 下严格遵循 SQL 标准 | 将 ORDER BY 移到 COUNT 之后 |
| `@ComponentScan` 扫到其他 Service 导致 Bean 依赖缺失 | `BpmProcessDefServiceImpl` 依赖 `GraphValidator` | 改为显式 `@Bean` 声明 |
| `sw-bpm-process` 模块无 H2 依赖 | 该模块之前无需 H2 测试 | 在 pom.xml 添加 `com.h2database:h2` test scope |

## 10. 未完成内容

无。所有方案要求的内容已全部完成。

## 11. 风险和注意事项

- **H2 与 PostgreSQL 兼容性**：`pageInstances` 在 H2 PostgreSQL 模式下的 COUNT+ORDER BY 问题已修复，该修复对 PostgreSQL 无影响（PG 本身也禁止 COUNT+ORDER BY）。后续需要确保新实现的 `pageInstances` 不引入类似 SQL 方言问题
- **MyBatis-Plus `lambdaQuery()` vs `LambdaQueryWrapper`**：当前实现使用 `getBaseMapper()` + `LambdaQueryWrapper` 直接调用，与项目常用的 `lambdaQuery()` 链式风格略有差异。功能等价，且在 H2+PG 双通验证中更稳定
- **测试资源文件**：新创建的 `application-test.yml` 和 `schema-h2.sql` 是 BpmInstanceServiceImplTest 专用，不影响其他模块测试

## 12. Git diff 摘要

```
5 files modified, 175 insertions(+), 3 deletions(-)
4 new files (DTO + tests)
2 new test resource files
```

**修改文件**（5 个）：
| 文件 | +/- |
|------|:---:|
| `BpmRuntimeFacade.java` | +31 |
| `BpmRuntimeFacadeImpl.java` | +81/-3 |
| `BpmInstanceService.java` | +17 |
| `BpmInstanceServiceImpl.java` | +44 |
| `pom.xml` | +5 |

**新建文件**（4 个）：
- `BpmActivityDTO.java`
- `InstanceFilterDTO.java`
- `BpmRuntimeFacadeImplTest.java`
- `BpmInstanceServiceImplTest.java`

**新建测试资源**（2 个）：
- `application-test.yml`
- `db/schema-h2.sql`

**关键变更点**：
- `BpmRuntimeFacade` 新增 2 个方法：`getActiveActivityIds` + `queryHistoricActivities`
- `BpmRuntimeFacadeImpl` 注入 `HistoryService`，实现 2 个方法 + `toActivityDto`
- `BpmInstanceService` 新增 `pageInstances` 分页查询
- `BpmInstanceServiceImpl` 实现 `pageInstances`（可选过滤 + ORDER BY + LIMIT/OFFSET）
- 新增 15 个测试（8 Facade + 7 Service），全部通过
- 项目测试基线：241 → **256 tests** ✅

## 13. 建议执行的测试

- Step 2（BpmInstanceController）集成验证时，建议重点测试 `queryHistoricActivities` 的 endTime 排序语义（已完成节点在前、进行中节点在后）
- `pageInstances` 的分页边界场景（pageSize=0、负 pageNum 等）当前未覆盖，可在 Step 2 Controller 测试中补充
