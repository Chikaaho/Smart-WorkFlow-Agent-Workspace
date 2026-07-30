# Step 1：后端 Facade + Service 层 — 流程实例查询 + 活跃节点 + 流转记录

## 1. 当前状态

- **功能**：process-monitoring（M04-F06-01 流程监控首批能力）
- **整体进度**：Step 0 探索 PASSED，Step 1 方案 READY
- **前置依赖**：
  - [[bpmn-adapter]] Steps 0-3 全部 COMPLETED（查看器防腐层 + BPMN XML 端点 + ProcessDefList 查看入口）
  - Flowable `RuntimeService` / `HistoryService` / `TaskService` / `RepositoryService` 已在 `BpmTaskFacadeImpl` 中注入使用
  - `BpmInstance` 实体 + `BpmInstanceService` 已就绪（仅单条查询，无分页列表）
- **本 Step 定位**：为 Step 2（BpmInstanceController）提供可调用的 Facade 方法和 Service 方法。不写 REST 端点，不创建 Controller。

## 2. Step 目标

扩展 `BpmRuntimeFacade` 接口（新增活跃节点查询 + 历史活动查询）、增强 `BpmInstanceService`（新增分页查询），准备所有 DTO 类。Step 1 交付的是**纯 Java 接口 + 实现 + DTO**，可在 Step 2 直接注入使用。

## 3. 推荐模型

推荐模型：deepseek-v4-pro
选择理由：涉及跨模块 Facade 接口设计（sw-bpm-api → sw-bpm-engine）、模块边界跨越（sw-bpm-api/engine/process 三模块协同）、API 契约形状设计。触发 system.md §2.3 升级条件「涉及前后端协议设计」+「跨三模块 Facade 边界」
是否触发升级条件：是 — 跨三模块 Facade 接口设计 + 前后端协议 DTO 形状

## 4. 模型选择理由

Work 涉及 BpmRuntimeFacade 接口扩展（api 层）、BpmRuntimeFacadeImpl 实现（engine 层，直接调用 Flowable API）、BpmInstanceService 增强（process 层，MyBatis-Plus 查询）。三个模块之间通过 Facade → Spring 注入 → Service 调用链协作，接口契约必须在 api 层定义清楚。Flaw 选择单文件 CRUD 无法覆盖跨模块接口设计。

## 5. 已知上下文

- **BPM 模块三层结构**：`sw-bpm-api`（契约/DTO/SPI/Facade 接口）→ `sw-bpm-engine`（Facade 实现，Flowable 封装，闭源防腐层）→ `sw-bpm-process`（业务 Service/Controller/Entity，经 Facade 间接使用 Flowable）
- **现有 `BpmRuntimeFacade`**：仅有 `startProcess(processDefKey, businessKey, variables, tenantId): String`。无查询方法
- **现有 `BpmTaskFacade`**：已有 `isProcessActive()` / `queryHistoryByProcessInstance()` / `getVariables()` / `getBusinessKey()`。`BpmTaskFacadeImpl` 已注入全部 4 个 Flowable 服务（`TaskService` / `RuntimeService` / `RepositoryService` / `HistoryService`）
- **现有 `BpmInstanceService`**：仅有 `findByProcessInstanceId()` / `findByBusinessKey()` / `updateStatus()`。无分页查询方法
- **`BpmInstance` 实体**（`sw_bpm_instance` 表）：id / processInstanceId / processDefKey / businessKey / formKey / initiatorId / status（RUNNING/APPROVED/REJECTED）。继承 `BaseEntity`（含 tenant_id + 审计列 + deleted）
- **Flowable API 访问路径**：`RuntimeService.getActiveActivityIds(processInstanceId)` → `List<String>`（当前活跃节点 activity ID）/ `HistoryService.createHistoricActivityInstanceQuery().processInstanceId(id).finished().orderByEndTime().asc().list()` → `List<HistoricActivityInstance>`（含 activityId/activityName/activityType/startTime/endTime/assignee/taskId）
- **`HistoricActivityInstance` 关键字段**：`getActivityId()`（BPMN element id，与 bpmn-js 的 `bpmnElement` 对齐） / `getActivityName()` / `getActivityType()`（如 `userTask` / `startEvent` / `endEvent` / `exclusiveGateway`） / `getStartTime()` / `getEndTime()` / `getAssignee()` / `getTaskId()` / `getCalledProcessInstanceId()`（子流程）
- **防腐层约束**：`sw-bpm-process` 模块**禁止**直接 import Flowable 类型（如 `HistoricActivityInstance`、`RuntimeService`）。所有 Flowable 操作必须经 Facade 接口（定义在 `sw-bpm-api`，实现在 `sw-bpm-engine`）
- **MyBatis-Plus 拦截器**：`BpmInstance` 继承 `BaseEntity`，`lambdaQuery()` 自动注入 `tenant_id` 和 `deleted=0` 过滤（主库拦截器生效，不同于动态宽表裸 SQL 需手写）
- **项目测试基线**：后端 `mvn test` 全量 BUILD SUCCESS，26 test files / 203 tests（CONFIRMED 2026-07-22 复验；bpmn-adapter Step 2 后项目级 241 tests）
- **错误码区间**：BpmErrorCode 已占 `2104 (PROCESS_NOT_PUBLISHED)`。本 Step 可能新增的实例不存在错误码顺延使用项目通用 `CommonErrorCode.NOT_FOUND`，不新增 BpmErrorCode

## 6. 执行前必须读取的文件

按优先级排序：

| # | 文件路径（相对于 `Smart-WorkFlow/`） | 读取目的 |
|---|------|------|
| 1 | `sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/facade/BpmRuntimeFacade.java` | 确认现有接口签名，确定新增方法位置 |
| 2 | `sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/facade/BpmRuntimeFacadeImpl.java` | 确认现有实现模式、Flowable 服务注入方式、`toDto` 模式 |
| 3 | `sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/facade/BpmTaskFacade.java` | 参照已有 Facade 方法命名和 DTO 约定（`BpmTaskDTO` 模式） |
| 4 | `sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/facade/BpmTaskFacadeImpl.java` | 参照 Flowable `HistoryService`/`RuntimeService` 调用的既有模式 |
| 5 | `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/entity/BpmInstance.java` | 确认实体字段、租户/删除列、用于设计分页查询 |
| 6 | `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/BpmInstanceService.java` | 确认现有方法签名，确定新增方法的位置 |
| 7 | `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/BpmInstanceServiceImpl.java` | 确认 `lambdaQuery()` 使用模式 |
| 8 | `sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/dto/BpmTaskDTO.java` | 参照 DTO 字段命名和结构模式 |
| 9 | `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/entity/InstanceStatusEnum.java` | 确认状态枚举值（RUNNING/APPROVED/REJECTED） |
| 10 | `sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/exception/BpmErrorCode.java` | 确认已有错误码，本 Step 是否新增 |
| 11 | `sw-common/src/main/java/com/sw/ck/common/exception/CommonErrorCode.java` | 确认通用 NOT_FOUND 错误码定义 |

## 7. 允许修改的文件范围

| 文件路径（相对于 `Smart-WorkFlow/`） | 修改类型 | 说明 |
|------|:---:|------|
| `sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/facade/BpmRuntimeFacade.java` | 修改 | 新增 2 个方法签名：`getActiveActivityIds` + `queryHistoricActivities` |
| `sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/dto/BpmActivityDTO.java` | **新建** | 历史活动节点 DTO（经 Facade 返回，避免泄漏 Flowable 类型） |
| `sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/facade/BpmRuntimeFacadeImpl.java` | 修改 | 实现新增的 2 个 Facade 方法（调用 Flowable RuntimeService/HistoryService） |
| `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/BpmInstanceService.java` | 修改 | 新增 `pageInstances` 方法签名 |
| `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/BpmInstanceServiceImpl.java` | 修改 | 实现 `pageInstances`（MyBatis-Plus `lambdaQuery()` + 可选过滤 + 分页） |
| `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/InstanceFilterDTO.java` | **新建** | 实例查询过滤参数 DTO（status/processDefKey/initiatorId 均为可选） |
| `sw-biz/sw-bpm/sw-bpm-engine/src/test/java/com/sw/ck/bpm/engine/facade/BpmRuntimeFacadeImplTest.java` | **新建** | Facade 实现层单元测试（至少 3 @Test：`getActiveActivityIds` + `queryHistoricActivities` 含数据 + 空列表） |
| `sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/service/impl/BpmInstanceServiceImplTest.java` | **新建** | Service 层单元测试（至少 2 @Test：全量分页 + 按状态过滤） |

## 8. 禁止修改的范围

- ❌ **禁止**创建任何 Controller 类（`BpmInstanceController` 留给 Step 2）
- ❌ **禁止**修改 `BpmTaskFacade` / `BpmTaskFacadeImpl`（已有方法不改动）
- ❌ **禁止**修改 `BpmDeployFacade` / `BpmDeployFacadeImpl`
- ❌ **禁止**修改 `BpmProcessDefController` / `BpmTodoController` 及已有端点
- ❌ **禁止**修改数据库表结构 / Flyway 脚本（不新增或修改 `sw_bpm_*` 表）
- ❌ **禁止**修改 `BpmInstance` 实体类（字段不变）
- ❌ **禁止**修改前端 `Smart-WorkFlow-Web/` 任何文件
- ❌ **禁止**引入新 Maven 依赖（Flowable 已就位）
- ❌ **禁止**在 `sw-bpm-process` 层直接 import Flowable 类型（`org.flowable.engine.*` / `org.flowable.*`）— 违反防腐层约束
- ❌ **禁止**修改 `pom.xml` 任何文件

## 9. 详细执行方案

### 9.1 新建 DTO: `BpmActivityDTO`

**文件**：`sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/dto/BpmActivityDTO.java`（新建）

```java
package com.sw.ck.bpm.api.dto;

import java.time.LocalDateTime;

/**
 * BPMN 流程活动节点 DTO（经 Facade 返回，不泄漏 Flowable 类型）。
 * <p>
 * 用于流程监控页面的流转记录展示（时间线 + 流程图高亮）。
 * activityId 与 BPMN XML 中的 bpmnElement id 对齐，前端可直接用于 bpmn-js highlight()。
 * </p>
 */
public class BpmActivityDTO {

    /** BPMN 元素 ID（如 "Activity_0kx10is"，与 BPMN XML bpmnElement 对齐） */
    private String activityId;

    /** 节点名称（如 "经理审批"、"开始"） */
    private String activityName;

    /** 节点类型：userTask / startEvent / endEvent / exclusiveGateway / parallelGateway */
    private String activityType;

    /** 开始时间（可能为 null，对应未开始节点） */
    private LocalDateTime startTime;

    /** 结束时间（可能为 null，对应进行中节点） */
    private LocalDateTime endTime;

    /** 处理人（仅 userTask 类型有值，其他为 null） */
    private String assignee;

    /** 关联 Flowable task ID（仅 userTask 类型有值，用于跳转任务详情） */
    private String taskId;

    // getters + setters（Lombok 不可用：sw-bpm-api 未依赖 Lombok —— 请手工写全。
    // 参考同目录 BpmTaskDTO.java 的风格——它是手写 getter/setter，与本文件一致）
}
```

**注意**：
- `sw-bpm-api` 模块**未依赖 Lombok**（检查同目录 `BpmTaskDTO.java` 是手写 getter/setter，本文件同样手写）
- `activityType` 存 Flowable `HistoricActivityInstance.getActivityType()` 的原始字符串，保持与 Flowable 契约一致，不在 DTO 层做枚举转换
- `startTime` / `endTime` 使用 `LocalDateTime`（不是 `java.util.Date`）——与 `TodoTaskRespDTO` 等 process 层 DTO 一致；Facade 内部做 `Date → LocalDateTime` 转换（使用系统默认时区 `ZoneId.systemDefault()`，与 `BpmTodoController.toTodoTaskDTO` 模式一致）

### 9.2 扩展 Facade: `BpmRuntimeFacade`

**文件**：`sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/facade/BpmRuntimeFacade.java`（修改）

在现有 `startProcess` 方法之后新增以下 2 个方法：

```java
/**
 * 获取流程实例当前活跃节点 ID 列表。
 * <p>
 * 活跃节点 = Flowable Runtime 中尚未完成的 Activity 实例。
 * 前端直接用返回的 activityId 调用 bpmn-js highlight() 高亮对应 BPMN 元素。
 * 返回顺序无保证，按 Flowable 内部执行顺序。
 * </p>
 *
 * @param processInstanceId Flowable 流程实例 ID
 * @return 活跃节点 activity ID 列表（实例不存在或已结束时返回空列表，不抛异常）
 */
List<String> getActiveActivityIds(String processInstanceId);

/**
 * 查询流程实例的全部历史活动节点（含已完成 + 进行中）。
 * <p>
 * 按结束时间升序排列（配流转时间线从上到下展示）。
 * 同时返回已完成节点（有 endTime）和进行中节点（endTime=null），
 * 前端据此区分：已完成节点 灰色、进行中节点 绿色。
 * </p>
 *
 * @param processInstanceId Flowable 流程实例 ID
 * @return 活动节点列表（按结束时间升序，进行中节点排在末尾），实例不存在时返回空列表
 */
List<BpmActivityDTO> queryHistoricActivities(String processInstanceId);
```

**注意**：
- `import java.util.List` 已在文件顶部
- 新增 `import com.sw.ck.bpm.api.dto.BpmActivityDTO` **放在文件顶部既有 import 块内**（与既有 `com.sw.ck.bpm.api.dto.BpmTaskDTO` 同行风格一致）
- JavaDoc 中 `@return` 必须标注空列表语义——调用方不应做 null 检查，统一用空列表表示"无数据"

### 9.3 实现 Facade: `BpmRuntimeFacadeImpl`

**文件**：`sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/facade/BpmRuntimeFacadeImpl.java`（修改）

在现有 `startProcess` 方法之后新增以下 2 个实现方法：

```java
@Override
public List<String> getActiveActivityIds(String processInstanceId) {
    if (processInstanceId == null || processInstanceId.isBlank()) {
        return List.of();
    }
    try {
        List<String> ids = runtimeService.getActiveActivityIds(processInstanceId);
        return ids != null ? ids : List.of();
    } catch (Exception e) {
        log.warn("Failed to get active activity ids: processInstanceId={}, error={}",
                processInstanceId, e.getMessage());
        return List.of();
    }
}

@Override
public List<BpmActivityDTO> queryHistoricActivities(String processInstanceId) {
    if (processInstanceId == null || processInstanceId.isBlank()) {
        return List.of();
    }
    try {
        List<org.flowable.engine.history.HistoricActivityInstance> activities =
                historyService.createHistoricActivityInstanceQuery()
                        .processInstanceId(processInstanceId)
                        .orderByHistoricActivityInstanceEndTime().asc()
                        .list();

        if (activities == null || activities.isEmpty()) {
            return List.of();
        }

        return activities.stream()
                .map(this::toActivityDto)
                .collect(Collectors.toList());
    } catch (Exception e) {
        log.warn("Failed to query historic activities: processInstanceId={}, error={}",
                processInstanceId, e.getMessage());
        return List.of();
    }
}

// ==================== 内部方法 ====================

/**
 * 将 Flowable {@code HistoricActivityInstance} 转为我方 {@link BpmActivityDTO}。
 * <p>
 * 时间转换：使用系统默认时区 {@code LocalDateTime.ofInstant(date.toInstant(), ZoneId.systemDefault())}，
 * 与 {@code BpmTodoController.toTodoTaskDTO} 模式一致。
 * </p>
 */
private BpmActivityDTO toActivityDto(
        org.flowable.engine.history.HistoricActivityInstance ha) {
    BpmActivityDTO dto = new BpmActivityDTO();
    dto.setActivityId(ha.getActivityId());
    dto.setActivityName(ha.getActivityName());
    dto.setActivityType(ha.getActivityType());
    if (ha.getStartTime() != null) {
        dto.setStartTime(LocalDateTime.ofInstant(
                ha.getStartTime().toInstant(), ZoneId.systemDefault()));
    }
    if (ha.getEndTime() != null) {
        dto.setEndTime(LocalDateTime.ofInstant(
                ha.getEndTime().toInstant(), ZoneId.systemDefault()));
    }
    dto.setAssignee(ha.getAssignee());
    dto.setTaskId(ha.getTaskId());
    return dto;
}
```

**注意**：
- 需要新增 import：
  - `com.sw.ck.bpm.api.dto.BpmActivityDTO`
  - `java.time.LocalDateTime`
  - `java.time.ZoneId`
  - `java.util.List`
  - `java.util.stream.Collectors`（如果尚未导入）
- `HistoricActivityInstance` 使用 FQCN（`org.flowable.engine.history.HistoricActivityInstance`）——`sw-bpm-engine` 层允许直接使用 Flowable 类型，这是防腐层的实现侧（对照 `BpmTaskFacadeImpl` 同样直接使用 `Task` / `HistoricTaskInstance` 等 Flowable 类型）
- **`getActiveActivityIds` 异常处理**：Flowable `runtimeService.getActiveActivityIds()` 对不存在的实例可能抛异常（视 Flowable 版本而定），必须 try-catch 兜底返回空列表。不向上抛异常——流程实例不存在对监控页面是正常场景（如已结束的实例）
- **`queryHistoricActivities` 排序**：`orderByHistoricActivityInstanceEndTime().asc()` + 未结束节点（endTime=null）自然排在末尾——Flowable 的 ascending 排序将 null 值放最后
- **`toActivityDto` 为 private 方法**，不修改任何已有方法签名

### 9.4 新建过滤 DTO: `InstanceFilterDTO`

**文件**：`sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/InstanceFilterDTO.java`（新建）

```java
package com.sw.ck.bpm.process.dto;

/**
 * 流程实例查询过滤参数。
 * <p>
 * 所有字段均为可选——null 或空字符串表示不施加该过滤条件。
 * </p>
 */
public class InstanceFilterDTO {

    /** 按实例状态过滤：RUNNING / APPROVED / REJECTED（null = 不过滤） */
    private String status;

    /** 按流程定义 key 过滤（null = 不过滤） */
    private String processDefKey;

    /** 按发起人用户 ID 过滤（null = 不过滤） */
    private Long initiatorId;

    // getters + setters（手写）
}
```

### 9.5 增强 Service: `BpmInstanceService`

**文件**：`sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/BpmInstanceService.java`（修改）

在现有方法之后新增：

```java
/**
 * 分页查询流程实例列表。
 * <p>
 * 支持可选过滤条件：状态、流程定义 key、发起人。
 * 按创建时间倒序排列（最新的实例在最前）。
 * 只查当前租户（MyBatis-Plus 拦截器自动注入 tenant_id）。
 * </p>
 *
 * @param pageParam 分页参数（pageNum 从 1 开始，pageSize 为每页条数）
 * @param filter    过滤条件（所有字段可选，null = 不过滤对应字段）
 * @return 分页结果（records 为 BpmInstance 列表，不含 graph_json 等大字段）
 */
PageResult<BpmInstance> pageInstances(PageParam pageParam, InstanceFilterDTO filter);
```

**注意**：
- 需要新增 import：`com.sw.ck.common.page.PageResult` / `com.sw.ck.common.page.PageParam` / `com.sw.ck.bpm.process.dto.InstanceFilterDTO`
- `filter` 允许为 null——表示无过滤条件，等价于全量分页

### 9.6 实现 Service: `BpmInstanceServiceImpl`

**文件**：`sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/BpmInstanceServiceImpl.java`（修改）

在现有方法之后新增：

```java
@Override
public PageResult<BpmInstance> pageInstances(PageParam pageParam, InstanceFilterDTO filter) {
    // 构建 lambda 查询条件链
    var query = lambdaQuery();

    if (filter != null) {
        // 状态过滤
        if (filter.getStatus() != null && !filter.getStatus().isBlank()) {
            query.eq(BpmInstance::getStatus, filter.getStatus());
        }
        // 流程定义 key 过滤
        if (filter.getProcessDefKey() != null && !filter.getProcessDefKey().isBlank()) {
            query.eq(BpmInstance::getProcessDefKey, filter.getProcessDefKey());
        }
        // 发起人过滤
        if (filter.getInitiatorId() != null) {
            query.eq(BpmInstance::getInitiatorId, filter.getInitiatorId());
        }
    }

    // 按创建时间倒序
    query.orderByDesc(BpmInstance::getCreateTime);

    // 查询总数
    long total = query.count();

    // 分页查询
    long offset = (pageParam.getPageNum() - 1) * pageParam.getPageSize();
    int limit = (int) pageParam.getPageSize();
    List<BpmInstance> records = query.last("LIMIT " + limit + " OFFSET " + offset).list();

    // 组装 PageResult（使用与 BpmProcessDefController.listDefs 一致的模式）
    PageResult<BpmInstance> result = new PageResult<>();
    result.setRecords(records);
    result.setTotal(total);
    result.setPageNum(pageParam.getPageNum());
    result.setPageSize(pageParam.getPageSize());
    return result;
}
```

**注意**：
- 需要新增 import：`com.sw.ck.common.page.PageResult` / `com.sw.ck.common.page.PageParam` / `com.sw.ck.bpm.process.dto.InstanceFilterDTO`
- **MyBatis-Plus `lambdaQuery()` 自动注入 `tenant_id` + `deleted=0`**（BpmInstance 继承 BaseEntity，主库拦截器生效）。不需要手写 tenant_id 和 deleted 条件（与动态宽表裸 SQL 完全不同！）
- `query.last("LIMIT ... OFFSET ...")` 使用 MyBatis-Plus 的 `.last()` 拼接分页 SQL。MyBatis-Plus 的 `IPage` 分页插件在此场景不适用（我们在 Service 层手动控制），用 `.last()` 是最直接的方式
- `count()` 和 `list()` 分两步执行——先统计总数，再取当前页。等价于两条 SQL
- **H2 + PostgreSQL 双通**：`LIMIT ... OFFSET ...` 两者都支持
- `filter` 可能为 null（等价于不加任何过滤条件），需要判空
- 不需要过滤 `tenant_id` 和 `deleted`——MyBatis-Plus 拦截器自动处理

### 9.7 校验门

```bash
mvn -q compile          # 确认编译通过（跨三模块依赖正确）
mvn -q test             # 运行全量测试（含新增）
```

**预期结果**：
- `mvn -q compile` 零错误（sw-bpm-api → sw-bpm-engine → sw-bpm-process 依赖链正确）
- `mvn -q test` BUILD SUCCESS，测试计数较基线增加（至少 +5 @Test：BpmRuntimeFacadeImplTest 3 + BpmInstanceServiceImplTest 2）
- 已有测试不退化（零失败）

## 10. 关键实现约束

1. **防腐层红线**：`sw-bpm-process` 模块**绝不**直接 import `org.flowable.*` 任何类。所有 Flowable 交互通过 Facade 接口
2. **Facade 接口在 `-api` 层**：`getActiveActivityIds` / `queryHistoricActivities` 定义在 `BpmRuntimeFacade`（`sw-bpm-api`），实现在 `BpmRuntimeFacadeImpl`（`sw-bpm-engine`）。Controller（Step 2）只能注入 Facade 接口
3. **DTO 不依赖 Lombok**：`sw-bpm-api` 和 `sw-bpm-process` 的 DTO 均手写 getter/setter（与同目录既有文件保持一致）
4. **时间转换**：`Date → LocalDateTime` 使用系统默认时区 `ZoneId.systemDefault()`。与 `BpmTodoController.toTodoTaskDTO()` 模式一致，不在 Facade 层做时区参数化
5. **空值语义统一**：查询方法返回**空列表**而非 null（`List.of()` / `Collections.emptyList()`）。调用方不需要做 null 检查
6. **异常静默处理**：Facade 层的查询方法出现异常时（如 processInstanceId 不存在），log.warn + 返回空列表。不向上抛异常——流程实例不存在对监控页面是正常场景
7. **LIMIT/OFFSET 分页**：`BpmInstanceServiceImpl.pageInstances` 手写 `LIMIT ? OFFSET ?`，确保 H2 + PG 双通
8. **不改已有 Facade 方法签名**：`BpmRuntimeFacade.startProcess` 不变（签名/参数/返回值全部保留）
9. **MyBatis-Plus 拦截器自动处理租户 + 逻辑删除**：`BpmInstance` 继承 `BaseEntity`，`lambdaQuery()` 在主库上自动注入 `tenant_id` + `deleted=0`。不手写这两个条件（与动态宽表裸 SQL 完全不同）

## 11. 边界情况

| 场景 | 处理方式 |
|------|------|
| **processInstanceId 为空字符串或 null** | `getActiveActivityIds` / `queryHistoricActivities` 返回空列表，不打日志 |
| **processInstanceId 对应的实例不存在** | Flowable 查询返回空列表 → 我们返回 `List.of()`。不抛异常 |
| **已结束的流程实例** | `getActiveActivityIds` 返回空列表（Flowable Runtime 中无活跃节点）。`queryHistoricActivities` 返回完整活动记录（全部有 endTime） |
| **运行中的流程实例** | `getActiveActivityIds` 返回当前活跃节点列表。`queryHistoricActivities` 返回已完成节点（有 endTime）+ 进行中节点（endTime=null） |
| **filter 为 null** | `pageInstances` 不过滤任何字段，全量分页 |
| **filter 字段为空字符串** | `isBlank()` 检查，空字符串等价于"不过滤该字段" |
| **分页参数越界（pageNum 超过最大页数）** | `records` 为空列表，`total` 仍为实际总数（MyBatis-Plus `.list()` 对空结果返回空 List） |
| **并发** | 无特殊并发要求（只读查询，无状态变更）。Facade 查询不持有锁 |

## 12. 风险和回滚方案

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|:---:|------|------|
| `runtimeService.getActiveActivityIds()` 对不存在实例抛异常 | 中 | 低（已 try-catch 兜底） | catch 后返回空列表 + warn 日志 |
| `LIMIT/OFFSET` 语法 H2 vs PG 兼容性 | 低 | 中（编译通过但测试 SQL 报错） | 两方言都支持 `LIMIT ? OFFSET ?` 语法；`mvn test` 同时跑 H2 验证 |
| DTO 字段命名与前端预期不一致 | 低 | 中（前端 Step 3 需调整） | `activityId` 字段名与 Flowable `ACT_HI_ACTINST.ACT_ID_` / bpmn-js `bpmnElement` 对齐，命名已在 Step 0 探索中确认 |
| `lambdaQuery().last()` SQL 注入风险 | 极低 | 高 | `LIMIT` + `OFFSET` 的值来自 `PageParam`（long → int），非用户输入拼接；`.last()` 的参数是固定字符串 + 数字，不含外部输入 |

**回滚方案**：`git checkout --` 还原所有修改文件（新增文件 `git rm`）。Facade 接口扩展属于纯新增、不改变已有方法签名，还原后已有代码完全不受影响。

**回滚验证**：`mvn -q compile && mvn -q test` BUILD SUCCESS，已有测试计数不减少。

## 13. 测试方案

### 13.1 静态检查

| 检查项 | 命令 | 预期结果 |
|------|------|------|
| 编译验证 | `mvn -q compile` | 零错误（跨三模块） |
| Facade 接口定义在 `-api` 层 | `grep "getActiveActivityIds\|queryHistoricActivities" sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/facade/BpmRuntimeFacade.java` | 匹配 2 处 |
| `sw-bpm-process` 层无 Flowable 泄漏 | `grep -rn "org\.flowable" sw-biz/sw-bpm/sw-bpm-process/src/main/java/` | 零命中（已有文件可能在注释中出现，检查实际 import 语句——`grep "import org.flowable"` 零命中） |
| `sw-bpm-process` 的 Service 接口含 `pageInstances` | `grep "pageInstances" sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/BpmInstanceService.java` | 匹配 1 处 |
| 旧方法未变 | `grep "startProcess" sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/facade/BpmRuntimeFacade.java` | 仍有 1 处（startProcess 签名未变） |
| 全量测试 | `mvn -q test` | BUILD SUCCESS，无失败/错误 |

### 13.2 单元测试

#### BpmRuntimeFacadeImplTest（新建）

**文件**：`sw-biz/sw-bpm/sw-bpm-engine/src/test/java/com/sw/ck/bpm/engine/facade/BpmRuntimeFacadeImplTest.java`

| # | 测试用例 | 覆盖场景 |
|---|------|------|
| 1 | `getActiveActivityIds` 返回活动节点列表 | 模拟 running 实例有活跃节点 |
| 2 | `queryHistoricActivities` 返回完整活动记录 | 模拟已完成实例的活动历史 |
| 3 | `queryHistoricActivities` 空实例返回空列表 | processInstanceId 不存在或 null/blank |

**测试策略**：
- 使用 `@SpringBootTest` + H2 + `@Transactional`（回滚）。**不要 mock Flowable**——测试使用真实的 Flowable 引擎（与 `BpmDeployFacadeImplTest` 和 `ApprovalProcessIntegrationTest` 一致）
- 测试前部署一个测试流程定义（deploy → startProcess → 获取 processInstanceId → 调用 getActiveActivityIds / queryHistoricActivities）
- 参照 `ApprovalProcessIntegrationTest`：部署最简 BPMN（StartEvent → UserTask → EndEvent）→ 启动实例 → 查询 activeNodeIds / historicActivities
- 注意：`getActiveActivityIds` 测试需要确保流程实例正在运行（不能提前 complete task，否则活跃节点为空）
- 空列表断言：对不存在的 processInstanceId，`getActiveActivityIds` / `queryHistoricActivities` 均返回 `isEmpty() == true`

#### BpmInstanceServiceImplTest（新建）

**文件**：`sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/service/impl/BpmInstanceServiceImplTest.java`

| # | 测试用例 | 覆盖场景 |
|---|------|------|
| 1 | `pageInstances` 全量分页（无过滤） | 至少 2 条数据，验证 total + records 数量 + pageNum/pageSize |
| 2 | `pageInstances` 按 status 过滤 | filter.status = RUNNING，验证返回均为 RUNNING 状态 |

**测试策略**：
- 使用 `@SpringBootTest` + H2 + `@Transactional` + `@Rollback`
- 测试前插入 2-3 条 `BpmInstance` 记录（不同 status + 不同 processDefKey），调用 `pageInstances` 验证分页计数
- filter 为 null 的场景（断言返回全量）
- 分页边界场景：pageSize 大于总数（断言 total 正确，records 不超过 total）

### 13.3 集成测试

本 Step 不涉及 HTTP 端点或数据库 schema 变更。跨模块集成验证在 Step 2（Controller + 端点）中进行。

### 13.4 手工验证

无需手工验证——纯接口/Service 层，自动化测试全覆盖。

### 13.5 回归检查

| 检查项 | 预期结果 |
|------|------|
| 已有测试通过数不减少 | `mvn test` 全部已有测试仍通过 |
| `startProcess` 行为不变 | 已有 Facade 方法的测试（如有）不退化 |
| BpmTaskFacade 不受影响 | `BpmTaskFacadeImplTest`（如有）不退化 |

## 14. 验收标准

| # | 验收标准 | 验证方式 |
|---|------|------|
| 1 | `BpmRuntimeFacade` 新增 `getActiveActivityIds(String): List<String>` 方法签名 | grep 接口定义文件 |
| 2 | `BpmRuntimeFacade` 新增 `queryHistoricActivities(String): List<BpmActivityDTO>` 方法签名 | grep 接口定义文件 |
| 3 | `BpmActivityDTO` 包含 7 个字段（activityId/activityName/activityType/startTime/endTime/assignee/taskId），手写 getter/setter | grep 类定义 + 字段 |
| 4 | `BpmRuntimeFacadeImpl.getActiveActivityIds` 调用 `runtimeService.getActiveActivityIds()` | grep 实现文件 |
| 5 | `BpmRuntimeFacadeImpl.queryHistoricActivities` 调用 `historyService.createHistoricActivityInstanceQuery()` | grep 实现文件 |
| 6 | `BpmInstanceService` 新增 `pageInstances(PageParam, InstanceFilterDTO): PageResult<BpmInstance>` | grep 接口定义文件 |
| 7 | `BpmInstanceServiceImpl.pageInstances` 支持按 status/processDefKey/initiatorId 可选过滤 | 代码审查 lambda 条件链 |
| 8 | `sw-bpm-process` 层不 import `org.flowable` 任何类型 | `grep -rn "import org.flowable" sw-biz/sw-bpm/sw-bpm-process/src/main/java/` 零命中 |
| 9 | `mvn -q compile` 零错误 | 命令输出 |
| 10 | `mvn -q test` BUILD SUCCESS，新增测试 ≥ 5 @Test（Facade 3 + Service 2），已有测试不退化 | 命令输出 + 测试计数 |
| 11 | `getActiveActivityIds` 对不存在实例返回空列表（不抛异常） | 测试用例验证 |
| 12 | `pageInstances` 分页参数 LIMIT/OFFSET H2+PG 双通 | 测试用例验证（H2 环境通过即达标） |
| 13 | 不改 `BpmRuntimeFacade.startProcess` 签名 | `git diff` 确认 startProcess 行无变更 |
| 14 | 不修改 Flyway / 数据库 schema / `pom.xml` | `git diff --stat` 不含对应文件 |

## 15. 执行回执格式

按 system.md §7.1 标准 13 项结构产出执行回执，写入 `Smart-WorkFlow/product/process-monitoring/receipts/step-1-execution.md`。

特别注意回执中需包含：
- `/workflow/instances`（或本 Step 涉及的文件）的修改文件和行数统计
- `mvn -q test` 的完整测试计数（增加数 + 总计数，标明测试基线变更）
- `grep` 静态检查项的命中/零命中截图
- `sw-bpm-process` 层 Flowable import 零命中确认

## 16. 测试回执格式

按 system.md §7.2 标准 12 项结构产出测试回执，写入 `Smart-WorkFlow/product/process-monitoring/receipts/step-1-test.md`。

特别注意回执中需包含：
- 逐条对照 §14 验收标准
- BpmRuntimeFacadeImplTest 3 个 @Test 的输出摘要
- BpmInstanceServiceImplTest 2 个 @Test 的输出摘要
- 全量 `mvn test` 测试计数确认

## 17. 明确禁止事项

- ❌ **禁止**创建 Controller 或任何 `@RestController` 类（留给 Step 2）
- ❌ **禁止**修改 `BpmTaskFacade` / `BpmTaskFacadeImpl`（已有方法不改）
- ❌ **禁止**在 `sw-bpm-process` 层 import Flowable 类型——违反防腐层约束
- ❌ **禁止**修改 `BpmRuntimeFacade.startProcess` 已有方法签名
- ❌ **禁止**修改数据库表结构（Flyway / DDL / entity 字段）
- ❌ **禁止**新增 Maven 依赖或修改 `pom.xml`
- ❌ **禁止**在 `sw-bpm-api` 的 DTO 中使用 Lombok（该模块无 Lombok 依赖）
- ❌ **禁止**给 `getActiveActivityIds` / `queryHistoricActivities` 返回 null（必须用空列表）
- ❌ **禁止**修改前端任何文件
- ❌ **禁止**创建 `BpmInstanceController`（留给 Step 2，Step 1 仅负责底层 Facade + Service）
