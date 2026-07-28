# Step B1：后端 — 待办分页 + 任务详情端点

## 1. 当前状态

- **功能**：BPM 待办中心增强（bpm-task-center），Step B1/B2/B3 后端 → F1/F2/F3 前端
- **前置 Step**：无。B1 是第一个 Step，依赖的 `BpmTodoController`、`BpmTaskFacade`、`BpmInstanceService` 均已就位
- **当前 BPM 后端基线**：58 Java 文件，7 tests，`GET /workflow/tasks/todo`（平铺数组）+ `POST /{taskId}/complete`（同意）

## 2. Step 目标

将 `GET /workflow/tasks/todo` 从平铺数组改造为分页响应，新增 `GET /workflow/tasks/{taskId}` 任务详情端点，丰富 DTO 字段（processName），使前端可展示有意义的待办列表和详情页。

## 3. 推荐模型

```
推荐模型：deepseek-v4-flash
选择理由：纯 CRUD 机械扩展，沿 BpmTodoController/BpmTaskFacade 既有模式加方法和字段，无架构决策
是否触发升级条件：否
```

## 4. 模型选择理由

无复杂并发/跨模块协议变更/安全边界敏感逻辑——仅 Flowable TaskQuery 已有 API 的 listPage 用法、DTO 字段追加、MyBatis-Plus lambdaQuery 按 processKey 查单条记录。

## 5. 已知上下文

### 5.1 相关代码模式

- `BpmTodoController.todo()` 当前调用 `bpmTaskFacade.queryTodo(tenantId, assignee)` 返回 `List<BpmTaskDTO>`，经 `toTodoTaskDTO()` 富化为 `List<TodoTaskRespDTO>`
- `BpmTodoController.complete()` 的越权校验模式：`getTask → 比对 assignee → facade操作 → 检测流程是否结束 → 更新 instance 状态`
- `UserControllerTest` 使用纯 Mockito（`mock()` + `when()`），零 Spring 上下文，断言用 AssertJ `assertThat()`
- `BpmTaskFacadeImpl.queryTodo()` 使用 `taskService.createTaskQuery().taskTenantId(tenantId).taskAssignee(assignee).list()` — 需改为 `listPage(offset, limit)` + `count()`
- `PageResult<T>` 字段：`records`(List)、`total`(long)、`pageNum`(long)、`pageSize`(long)；构造函数 `PageResult()` + setter 手动设值
- `PageParam` 字段：`pageNum`(long, default 1)、`pageSize`(long, default 10)
- `BpmProcessDef` 有 `processKey` 和 `name` 字段；`BpmProcessDefServiceImpl` 可通过 `lambdaQuery().eq(BpmProcessDef::getProcessKey, key).one()` 查询

### 5.2 模块依赖

- `sw-bpm-process` → `sw-bpm-api`（Facade 接口）
- `sw-bpm-process` → `sw-bpm-engine`（Facade 实现，Spring 注入）
- `sw-bpm-process` → `sw-biz-system-api`（可访问 system-api 的 DTO 和 Facade 接口，**不可**访问 system-biz 实现）
- `sw-bpm-process` → `sw-biz-form-api`
- `sw-bpm-process` → `sw-common`（`BaseService`、`PageParam`、`PageResult`、`R`）

### 5.3 关键术语

| 术语 | 含义 | 来源 |
|------|------|------|
| `taskId` | Flowable Task ID（如 `mock-task-001`） | `ACT_RU_TASK.ID_` |
| `processInstanceId` | Flowable 流程实例 ID | `ACT_RU_EXECUTION.PROC_INST_ID_` |
| `processDefinitionKey` | BPMN 流程定义 key（= `BpmProcessDef.processKey`） | `ACT_RE_PROCDEF.KEY_` |
| `businessKey` | 表单提交记录 ID（= 动态宽表 recordId） | `ACT_RU_EXECUTION.BUSINESS_KEY_` |
| `formKey` | 表单业务标识（如 `leave-request`） | 流程变量 `formKey` |
| `initiatorId` | 流程发起人用户 ID（= `sys_user.id`） | `sw_bpm_instance.initiator_id` |

## 6. 执行前必须读取的文件

按优先级排序：

1. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmTodoController.java` — 端点现状
2. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/facade/BpmTaskFacade.java` — Facade 接口
3. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/facade/BpmTaskFacadeImpl.java` — Facade 实现
4. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/dto/BpmTaskDTO.java` — 任务 DTO 字段
5. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/TodoTaskRespDTO.java` — 待办响应 DTO
6. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/entity/BpmInstance.java` — 实例实体
7. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/entity/BpmProcessDef.java` — 流程定义实体
8. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/BpmProcessDefService.java` — 需新增 `findByProcessKey`
9. `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/page/PageParam.java` — 分页参数
10. `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/page/PageResult.java` — 分页结果
11. `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/UserControllerTest.java` — 测试模式参考（Mockito + AssertJ）

## 7. 允许修改的文件范围

### 修改

| # | 文件 | 改动 |
|---|------|------|
| 1 | `sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/facade/BpmTaskFacade.java` | 新增 `queryTodoPage`、`countTodo` 方法签名 |
| 2 | `sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/facade/BpmTaskFacadeImpl.java` | 实现分页查询方法 |
| 3 | `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmTodoController.java` | 改造 `todo()` 分页 + 新增 `detail()` 端点 |
| 4 | `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/TodoTaskRespDTO.java` | 新增 `processName` 字段 |
| 5 | `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/BpmProcessDefService.java` | 新增 `findByProcessKey` 方法签名 |
| 6 | `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/BpmProcessDefServiceImpl.java` | 实现 `findByProcessKey` |

### 新建

| # | 文件 | 说明 |
|---|------|------|
| 1 | `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/TaskDetailRespDTO.java` | 任务详情响应 DTO |

## 8. 禁止修改的范围

- ❌ `sw-biz/sw-bpm/sw-bpm-engine/` 中除 `BpmTaskFacadeImpl.java` 以外的任何文件
- ❌ `sw-biz/sw-bpm/sw-bpm-api/` 中除 `BpmTaskFacade.java` 以外的任何文件
- ❌ `sw-biz/sw-bpm/sw-bpm-process/` 中 `BpmProcessDefController.java`（流程定义 CRUD 不在此 Step 范围）
- ❌ Flyway 迁移脚本（无新表，无需迁移）
- ❌ `sw-biz-system/` 任何文件（跨模块改动不在本 Step 范围）
- ❌ `sw-biz-form/` 任何文件
- ❌ `sw-framework/` 任何文件（PageParam/PageResult 不可改）
- ❌ 任何测试文件（测试在 B3 Step）

## 9. 详细执行方案

### 9.1 BpmProcessDefService 新增 `findByProcessKey` 方法

**文件**：`sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/BpmProcessDefService.java`

在接口中新增方法签名（位置：`listDefs` 方法之后）：

```java
/**
 * 按流程定义 key 查找流程定义。
 *
 * @param processKey 流程定义 key（对应 Flowable ProcessDefinition.key）
 * @return 流程定义实体（可能为 null）
 */
BpmProcessDef findByProcessKey(String processKey);
```

**文件**：`sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/BpmProcessDefServiceImpl.java`

实现方法（位置：类末尾，在 `publish` 方法之后）：

```java
@Override
public BpmProcessDef findByProcessKey(String processKey) {
    return lambdaQuery()
            .eq(BpmProcessDef::getProcessKey, processKey)
            .one();
}
```

> `lambdaQuery()` 来自 MyBatis-Plus 的 `ServiceImpl`（`BaseServiceImpl` 继承链），`@TableLogic` + 租户拦截器自动生效，无需手写 `deleted`/`tenant_id`。

### 9.2 BpmTaskFacade 新增分页方法

**文件**：`sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/facade/BpmTaskFacade.java`

在 `queryTodo` 方法之后新增两个方法签名：

```java
/**
 * 分页查询待办任务。
 *
 * @param tenantId 租户 ID
 * @param assignee 处理人
 * @param offset   偏移量（从 0 开始）
 * @param limit    每页条数
 * @return 待办任务列表
 */
List<BpmTaskDTO> queryTodoPage(String tenantId, String assignee, int offset, int limit);

/**
 * 统计待办任务总数。
 *
 * @param tenantId 租户 ID
 * @param assignee 处理人
 * @return 待办任务总数
 */
long countTodo(String tenantId, String assignee);
```

**文件**：`sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/facade/BpmTaskFacadeImpl.java`

在 `queryTodo` 方法之后实现（共享同一个 `toDto` 内部方法）：

```java
@Override
public List<BpmTaskDTO> queryTodoPage(String tenantId, String assignee, int offset, int limit) {
    List<Task> tasks = taskService.createTaskQuery()
            .taskTenantId(tenantId)
            .taskAssignee(assignee)
            .orderByTaskCreateTime().desc()
            .listPage(offset, limit);

    return tasks.stream()
            .map(this::toDto)
            .collect(Collectors.toList());
}

@Override
public long countTodo(String tenantId, String assignee) {
    return taskService.createTaskQuery()
            .taskTenantId(tenantId)
            .taskAssignee(assignee)
            .count();
}
```

> 关键：使用 Flowable `TaskQuery.listPage(int firstResult, int maxResults)` 和 `count()`，无原生 SQL，不涉及动态宽表裸 SQL 红线。

### 9.3 TodoTaskRespDTO 新增字段

**文件**：`sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/TodoTaskRespDTO.java`

在已有字段后新增（`createTime` 之后）：

```java
/** 流程名称（来自 BpmProcessDef.name，通过 processDefinitionKey 反查） */
private String processName;
```

> 不新增 `initiatorId`/`initiatorName`——列表页无需发起人信息，保留在详情页 DTO 中。

### 9.4 新建 TaskDetailRespDTO

**文件**：`sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/TaskDetailRespDTO.java`

```java
package com.sw.ck.bpm.process.dto;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 任务详情响应 DTO。
 * <p>
 * 返回单个任务的完整信息，包含流程变量、发起人等，
 * 供前端任务详情页和审批操作使用。
 * </p>
 */
@Data
public class TaskDetailRespDTO {

    /** Flowable task ID */
    private String taskId;

    /** 任务名称 */
    private String taskName;

    /** Flowable 流程实例 ID */
    private String processInstanceId;

    /** 流程定义 key */
    private String processDefinitionKey;

    /** 流程名称（来自 BpmProcessDef.name） */
    private String processName;

    /** 表单业务标识 */
    private String formKey;

    /** 业务键（= 表单 recordId） */
    private String businessKey;

    /** 当前处理人用户 ID */
    private String assignee;

    /** 流程发起人用户 ID（来自 BpmInstance.initiatorId） */
    private Long initiatorId;

    /** 任务创建时间 */
    private LocalDateTime createTime;

    /** 流程变量（key = 变量名，value = 变量值字符串形式） */
    private Map<String, String> processVariables;
}
```

> `initiatorId` 暂不解析为 `initiatorName`——当前 `sw-biz-system-api` 中无 `UserFacade`，后续 Step 添加或由前端通过 `/system/user/{id}` 反查显示名。

### 9.5 BpmTodoController 改造

**文件**：`sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmTodoController.java`

#### 9.5.1 新增注入依赖

在已有构造函数参数中新增：

```java
private final BpmProcessDefService bpmProcessDefService;
```

构造函数签名改为：

```java
public BpmTodoController(BpmTaskFacade bpmTaskFacade,
                         BpmInstanceService bpmInstanceService,
                         DomainEventPublisher domainEventPublisher,
                         BpmProcessDefService bpmProcessDefService) {
    this.bpmTaskFacade = bpmTaskFacade;
    this.bpmInstanceService = bpmInstanceService;
    this.domainEventPublisher = domainEventPublisher;
    this.bpmProcessDefService = bpmProcessDefService;
}
```

新增 import：

```java
import com.sw.ck.bpm.process.dto.TaskDetailRespDTO;
import com.sw.ck.bpm.process.service.BpmProcessDefService;
import com.sw.ck.common.page.PageParam;
import com.sw.ck.common.page.PageResult;
import java.util.HashMap;
import java.util.Map;
```

#### 9.5.2 改造 `todo()` 端点 — 分页

将原方法替换为分页版本：

```java
/**
 * 当前用户待办列表（分页）。
 * <p>
 * 按 {@code taskTenantId + taskAssignee} 双条件查询，
 * 将 BpmTaskDTO 富化为 TodoTaskRespDTO（Date→LocalDateTime 转换 + formKey 富化 + processName 富化）。
 * </p>
 *
 * @param pageParam 分页参数（pageNum 从 1 开始）
 * @return 分页结果
 */
@GetMapping("/todo")
public R<PageResult<TodoTaskRespDTO>> todo(PageParam pageParam) {
    LoginUser loginUser = LoginUserHolder.get();
    String tenantId = String.valueOf(loginUser.getTenantId());
    String assignee = String.valueOf(loginUser.getUserId());

    long pageNum = pageParam.getPageNum();
    long pageSize = pageParam.getPageSize();
    int offset = (int) ((pageNum - 1) * pageSize);
    int limit = (int) pageSize;

    List<BpmTaskDTO> tasks = bpmTaskFacade.queryTodoPage(tenantId, assignee, offset, limit);
    long total = bpmTaskFacade.countTodo(tenantId, assignee);

    List<TodoTaskRespDTO> dtos = tasks.stream()
            .map(this::toTodoTaskDTO)
            .collect(Collectors.toList());

    log.debug("待办分页查询: tenantId={}, assignee={}, pageNum={}, pageSize={}, total={}",
            tenantId, assignee, pageNum, pageSize, total);

    PageResult<TodoTaskRespDTO> pageResult = new PageResult<>();
    pageResult.setRecords(dtos);
    pageResult.setTotal(total);
    pageResult.setPageNum(pageNum);
    pageResult.setPageSize(pageSize);
    return R.ok(pageResult);
}
```

#### 9.5.3 改造 `toTodoTaskDTO()` 内部方法

在现有转换逻辑末尾（`dto.setFormKey(formKey)` 之后）新增 processName 富化：

```java
// processName 从 BpmProcessDef 查询（通过 processDefinitionKey 匹配 processKey）
String processDefKey = task.getProcessDefinitionKey();
if (processDefKey != null) {
    BpmProcessDef processDef = bpmProcessDefService.findByProcessKey(processDefKey);
    if (processDef != null) {
        dto.setProcessName(processDef.getName());
    }
}
```

完整 `toTodoTaskDTO` 方法（替换原方法）：

```java
private TodoTaskRespDTO toTodoTaskDTO(BpmTaskDTO task) {
    TodoTaskRespDTO dto = new TodoTaskRespDTO();
    dto.setTaskId(task.getTaskId());
    dto.setProcessInstanceId(task.getProcessInstanceId());

    if (task.getCreateTime() != null) {
        dto.setCreateTime(LocalDateTime.ofInstant(
                task.getCreateTime().toInstant(), ZoneId.systemDefault()));
    }

    dto.setBusinessKey(task.getBusinessKey());

    String formKey = bpmTaskFacade.getVariable(
            task.getProcessInstanceId(), "formKey");
    dto.setFormKey(formKey);

    // 富化流程名称
    String processDefKey = task.getProcessDefinitionKey();
    if (processDefKey != null) {
        BpmProcessDef processDef = bpmProcessDefService.findByProcessKey(processDefKey);
        if (processDef != null) {
            dto.setProcessName(processDef.getName());
        }
    }

    return dto;
}
```

> 注意：需 import `BpmProcessDef`（`com.sw.ck.bpm.process.entity.BpmProcessDef`）。

#### 9.5.4 新增 `detail()` 端点

在 `complete()` 方法之后、`publishApprovedEvent()` 之前新增：

```java
/**
 * 任务详情。
 * <p>
 * 返回单个任务的完整信息，包含流程变量、发起人、流程名称等，
 * 供前端任务详情页使用。
 * </p>
 *
 * @param taskId Flowable task ID
 * @return 任务详情
 * @throws BaseException 任务不存在时抛出
 */
@GetMapping("/{taskId}")
public R<TaskDetailRespDTO> detail(@PathVariable String taskId) {
    LoginUser loginUser = LoginUserHolder.get();

    // 1. 查询 task（经 Facade）
    BpmTaskDTO task = bpmTaskFacade.getTask(taskId);
    if (task == null) {
        throw new BaseException(CommonErrorCode.NOT_FOUND.getCode(), "任务不存在");
    }

    TaskDetailRespDTO dto = new TaskDetailRespDTO();
    dto.setTaskId(task.getTaskId());
    dto.setTaskName(task.getName());
    dto.setProcessInstanceId(task.getProcessInstanceId());
    dto.setProcessDefinitionKey(task.getProcessDefinitionKey());
    dto.setAssignee(task.getAssignee());

    // 时间转换
    if (task.getCreateTime() != null) {
        dto.setCreateTime(LocalDateTime.ofInstant(
                task.getCreateTime().toInstant(), ZoneId.systemDefault()));
    }

    // 流程名称
    String processDefKey = task.getProcessDefinitionKey();
    if (processDefKey != null) {
        BpmProcessDef processDef = bpmProcessDefService.findByProcessKey(processDefKey);
        if (processDef != null) {
            dto.setProcessName(processDef.getName());
        }
    }

    // formKey + businessKey
    dto.setFormKey(bpmTaskFacade.getVariable(task.getProcessInstanceId(), "formKey"));
    dto.setBusinessKey(task.getBusinessKey());

    // 发起人
    BpmInstance instance = bpmInstanceService
            .findByProcessInstanceId(task.getProcessInstanceId())
            .orElse(null);
    if (instance != null) {
        dto.setInitiatorId(instance.getInitiatorId());
    }

    // 流程变量（收集当前流程实例所有变量）
    Map<String, String> variables = new HashMap<>();
    // 收集已知变量：formKey（已在上方获取，此处备用）
    // 收集所有流程变量时需注意：Flowable RuntimeService 提供 getVariables() 返回 Map<String, Object>
    // 将其转为 Map<String, String>
    // BpmTaskFacade 当前无 getVariables 方法，新增一个
    // TODO: 在 BpmTaskFacade 中添加 getVariables(processInstanceId) 方法
    dto.setProcessVariables(variables);

    return R.ok(dto);
}
```

> ⚠️ 流程变量收集需要在 `BpmTaskFacade` 中新增 `getVariables(String processInstanceId): Map<String, Object>` 方法。在 `BpmTaskFacadeImpl` 中通过 `runtimeService.getVariables(processInstanceId)` 实现。然后在 Controller 中将 `Map<String, Object>` 转为 `Map<String, String>`（`Object.toString()`）。

#### 9.5.5 BpmTaskFacade 新增 `getVariables` 方法

**文件**：`sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/facade/BpmTaskFacade.java`

在 `getBusinessKey` 方法之后新增：

```java
/**
 * 获取流程实例的所有流程变量。
 *
 * @param processInstanceId 流程实例 ID
 * @return 流程变量 Map（key = 变量名，value = 变量值）
 */
Map<String, Object> getVariables(String processInstanceId);
```

**文件**：`sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/facade/BpmTaskFacadeImpl.java`

在 `getBusinessKey` 方法之后实现：

```java
@Override
public Map<String, Object> getVariables(String processInstanceId) {
    return runtimeService.getVariables(processInstanceId);
}
```

### 9.6 完整变更文件清单

| # | 文件 | 操作 | 改动摘要 |
|---|------|:----:|----------|
| 1 | `BpmTaskFacade.java` | 修改 | +3 方法签名（`queryTodoPage`、`countTodo`、`getVariables`） |
| 2 | `BpmTaskFacadeImpl.java` | 修改 | +3 方法实现（listPage+count、getVariables） |
| 3 | `BpmTodoController.java` | 修改 | 构造函数注入 BpmProcessDefService; 改造 todo 分页; 新增 detail 端点; 改造 toTodoTaskDTO 富化 processName |
| 4 | `TodoTaskRespDTO.java` | 修改 | +1 字段 `processName` |
| 5 | `TaskDetailRespDTO.java` | **新建** | 完整 DTO（taskId/name/processName/formKey/businessKey/assignee/initiatorId/createTime/variables） |
| 6 | `BpmProcessDefService.java` | 修改 | +1 方法签名 `findByProcessKey` |
| 7 | `BpmProcessDefServiceImpl.java` | 修改 | +1 方法实现（lambdaQuery + eq processKey） |

## 10. 关键实现约束

1. **分页 offset 计算**：`offset = (pageNum - 1) * pageSize`，pageNum 从 1 开始，offset 从 0 开始。offset 和 limit 需要从 `long` 转 `int`（`(int)` cast），因为 listPage 第一页通常 ≤ 200 条不会溢出
2. **待办查询安全**：按 `taskTenantId` + `taskAssignee` 双条件过滤，不依赖 ORM 拦截器（Flowable 原生 API 不受 MyBatis-Plus 管理）
3. **detail 端点不要鉴权**：任务详情仅返回该 taskId 对应的任务信息，不校验当前用户是否为 assignee（供管理员查看用——后续可加权限注解）
4. **processName 可为 null**：如果 `findByProcessKey` 返回 null（流程定义被删除），`processName` 保持 null，前端展示 `-` 占位符
5. **`@Data` 注解**：新增 DTO 使用 Lombok `@Data`（生成 getter/setter/toString/equals/hashCode），与现有 DTO 风格一致
6. **`BpmProcessDefService.findByProcessKey` 无需 `@Transactional`**：只读查询，MyBatis-Plus 自动处理
7. **不修改 `BpmTaskDTO`**：它来自 `sw-bpm-api`，是 Facade 的出参；本 Step 在 process 层做富化，不碰 api 层 DTO
8. **`@PathVariable` 冲突处理**：`BpmTodoController` 已有 `@PathVariable String taskId`（在 `complete` 方法上），新 `detail` 方法也使用 `@PathVariable String taskId`，Spring MVC 通过 HTTP 方法区分——`GET /{taskId}` → `detail()`，`POST /{taskId}/complete` → `complete()`，无冲突

## 11. 边界情况

| 场景 | 预期行为 |
|------|----------|
| pageNum=0 或负数 | Flowable `listPage(negative, limit)` 行为不确定——Controller 不做校验，由前端保证 pageNum ≥ 1 |
| pageSize=9999（不分页） | offset 和 limit 计算正确，listPage 返回全部任务 |
| 待办为空 | `total=0`，`records=[]`，返回 `R.ok(emptyPageResult)` |
| taskId 不存在 | `detail()` 抛出 `BaseException(NOT_FOUND, "任务不存在")` |
| 任务已被完成（taskId 不在 ACT_RU_TASK） | `getTask()` 返回 null → 抛 NOT_FOUND |
| processDefinitionKey 为 null | `toTodoTaskDTO()` 中的 if 判断跳过 processName 赋值，dto.processName 保持 null |
| processDefinitionKey 对应 BpmProcessDef 不存在 | `findByProcessKey()` 返回 null，processName 保持 null |
| formKey 流程变量不存在 | `getVariable()` 返回 null，dto.formKey 为 null |
| businessKey 为空 | `task.getBusinessKey()` 可能为 null（流程未绑定表单），DTO 字段为 null |

## 12. 风险和回滚方案

| 风险 | 概率 | 回滚 |
|------|:----:|------|
| `queryTodoPage` 在无任务的租户/用户下性能退化 | 低 | Flowable `listPage` 在空结果集下仅执行轻量 SQL，无性能风险；如有问题回退到 `list()` + 手动分页 |
| `BpmProcessDefService.findByProcessKey` 查不到匹配（`processKey` 与 `processDefinitionKey` 不一致） | 中 | processName 为 null 不影响列表展示，仅前端列空白；核对 V15 Flyway 插入的 processKey 与骨架 BPMN 的 process id 是否一致 |
| 构造函数新增参数导致编译失败 | 中 | Spring 自动装配 Controller 构造函数，新增参数后需确保 `BpmProcessDefService` Bean 已注册（已确认：`@Service` 注解 + `BpmProcessAutoConfiguration` 组件扫描覆盖） |

## 13. 测试方案

### 13.1 静态检查

```bash
# 编译验证（零错误）
cd Smart-WorkFlow && mvn -q compile

# 确认旧方法名零残留（grep queryTodo 在 Controller 中不应再返回 List）
grep -n "queryTodo(" sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmTodoController.java

# 确认 findByProcessKey 在 Service/Impl 中均已声明
grep -n "findByProcessKey" sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/BpmProcessDefService.java
grep -n "findByProcessKey" sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/BpmProcessDefServiceImpl.java
```

### 13.2 单元测试

本 Step 不包含测试文件（测试在 B3 Step）。但仍需确认 `mvn -q compile` 零错误。

### 13.3 集成测试

不适用——无新增跨模块交互路径。

### 13.4 手工验证

```bash
# 1. 编译通过
cd Smart-WorkFlow && mvn -q compile

# 2. 确认新增 Facade 方法在接口和实现中一致
grep -c "queryTodoPage" sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/facade/BpmTaskFacade.java
grep -c "queryTodoPage" sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/facade/BpmTaskFacadeImpl.java
# 预期: 各 ≥1

# 3. 确认 TaskDetailRespDTO 存在
ls sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/TaskDetailRespDTO.java
```

### 13.5 回归检查

```bash
# 已有测试不应减少（当前基线：7 BPM tests）
cd Smart-WorkFlow && mvn -q test 2>&1 | grep "Tests run:"
# 预期: 无 FAILED，总数 ≥ 7
```

## 14. 验收标准

| 编号 | 条件 | 验证方式 |
|:----:|------|----------|
| B1-1 | `BpmTaskFacade` 含 `queryTodoPage(String, String, int, int)` 方法签名 | grep 接口文件 |
| B1-2 | `BpmTaskFacade` 含 `countTodo(String, String)` 方法签名 | grep 接口文件 |
| B1-3 | `BpmTaskFacade` 含 `getVariables(String)` 方法签名 | grep 接口文件 |
| B1-4 | `BpmTaskFacadeImpl` 中 `queryTodoPage` 使用 `TaskQuery.listPage(offset, limit)` | grep 实现文件 |
| B1-5 | `BpmTodoController.todo()` 接受 `PageParam` 参数，返回 `R<PageResult<TodoTaskRespDTO>>` | grep Controller |
| B1-6 | `BpmTodoController` 含 `@GetMapping("/{taskId}")` detail 端点 | grep Controller |
| B1-7 | `TodoTaskRespDTO` 含 `processName` 字段 | grep DTO |
| B1-8 | `TaskDetailRespDTO.java` 新建，含 11 个字段（taskId/taskName/processInstanceId/processDefinitionKey/processName/formKey/businessKey/assignee/initiatorId/createTime/processVariables） | ls + grep DTO |
| B1-9 | `BpmProcessDefService` 含 `findByProcessKey(String)` 方法 | grep Service 接口 |
| B1-10 | `mvn -q compile` 退出码 0（全工程编译通过） | 执行 mvn -q compile |

## 15. 执行回执格式

按 system.md §7.1 标准 13 项结构输出执行回执，写入以下路径：

```
product/bpm-task-center/receipts/step-b1-后端待办分页+任务详情-execution.md
```

## 16. 测试回执格式

本 Step 不包含测试编写（测试在 B3 Step）。测试回执在 B3 执行后一并输出。

## 17. 明确禁止事项

1. ❌ **不要新建 Controller 类** — 全部改动在现有 `BpmTodoController` 内完成
2. ❌ **不要引入 Spring 上下文测试** — 测试留给 B3，B1 仅编译验证
3. ❌ **不要修改 `BpmTaskDTO`** — 来自 sw-bpm-api，出参 DTO 不可改（会改 Facade 契约）
4. ❌ **不要修改 Flyway 迁移脚本** — 本 Step 不涉及 schema 变更
5. ❌ **不要触碰 `BpmProcessDefController`** — 本 Step 的 ProcessDef 查询仅在 Service 层加一个只读方法
6. ❌ **不要引入新依赖** — 不新增 pom.xml 的 Maven 依赖
7. ❌ **不要在 Controller 中直接使用 Flowable API** — 必须经 `BpmTaskFacade` 防腐层
8. ❌ **不要实现 initiatorName 解析** — `sw-biz-system-api` 当前无 `UserFacade`，`initiatorId` 传给前端即可
9. ❌ **不要修改前端代码** — 纯后端 Step
