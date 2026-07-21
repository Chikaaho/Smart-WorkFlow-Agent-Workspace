# Step B2：后端 — 驳回端点 + 已办列表 + 审批历史

## 1. 当前状态

- **功能**：BPM 待办中心增强（bpm-task-center），Step B1 已 PASSED
- **前置 Step**：B1 — 待办分页 + 任务详情端点已就位，`BpmTaskFacade` 已有 `complete`/`queryTodoPage`/`countTodo`/`getTask`/`getVariables`
- **当前 BPM 基础设施**：`InstanceStatusEnum` 已定义 `REJECTED`；`sw_bpm_instance.status` 列已支持 `REJECTED`；骨架 BPMN 为单节点审批
- **B1 产出**：`BpmTodoController` 已注入 `BpmProcessDefService` + `BpmInstanceService` + `BpmTaskFacade` + `DomainEventPublisher`

## 2. Step 目标

新增驳回端点 `POST /workflow/tasks/{taskId}/reject`、已办分页查询 `GET /workflow/tasks/processed`、在任务详情中追加审批历史记录，使后端支持完整的"待办→通过/驳回→已办追溯"闭环。

## 3. 推荐模型

```
推荐模型：deepseek-v4-flash
选择理由：沿 BpmTodoController/BpmTaskFacade 既有模式扩展方法，Flowable HistoryService 的标准 API 调用，无架构决策、无 schema 变更
是否触发升级条件：否
```

## 4. 模型选择理由

驳回端点复用 `complete()` 的越权校验 + `complete` → `updateStatus` 模式，仅变量和状态值不同；已办查询使用 Flowable `HistoryService` 标准分页 API；审批历史同样是 `HistoricTaskInstanceQuery`。不涉及动态宽表裸 SQL、Flyway 迁移、跨模块协议变更。

## 5. 已知上下文

### 5.1 驳回语义

骨架 BPMN 为单节点审批（`startEvent → approvalTask → endEvent`），`complete()` 后流程立即结束。驳回与通过的 Flowable 操作**完全相同**（`taskService.complete(taskId, variables)`），差异仅在于：

| | 通过 | 驳回 |
|---|---|---|
| 流程变量 | `null`（或空 Map） | `outcome: "REJECTED"`（建议加上以区分） |
| 实例状态 | `APPROVED` | `REJECTED` |
| 通知事件类型 | `PROCESS_APPROVED` | 无需通知（驳回不触发通知） |

> **关键**：驳回不需要 BPMN 网关/边界事件改造——单节点审批场景下，业务流程走完就是走完，我方在 `sw_bpm_instance.status` 中标记不同终态即可。这是对当前骨架 BPMN 的最小侵入方案。

### 5.2 已办（processed）vs 待办（todo）

| | 待办 | 已办 |
|---|---|---|
| Flowable 表 | `ACT_RU_TASK`（运行时） | `ACT_HI_TASKINST`（历史） |
| Facade API | `TaskService.createTaskQuery()` | `HistoryService.createHistoricTaskInstanceQuery()` |
| 过滤条件 | `taskAssignee + taskTenantId` | `taskAssignee + taskTenantId + finished` |
| 关键字段 | createTime | createTime + **endTime**（完成时间） |

### 5.3 审批历史（approval history）

对于一个流程实例，审批历史 = 该实例下所有已完成的历史任务节点（`HistoricTaskInstance`），按完成时间倒序排列。每个历史任务节点天然就是一个"审批记录"——记录了谁在什么时间做了什么操作。

### 5.4 关键依赖

- `sw-bpm-engine` 已注入 `HistoryService`（Flowable 自动配置），查看 `BpmEngineAutoConfiguration` 或直接通过构造函数注入即可
- `BpmTaskFacadeImpl` 构造函数当前接受 `TaskService`、`RuntimeService`、`RepositoryService`，需新增 `HistoryService` 参数

## 6. 执行前必须读取的文件

1. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmTodoController.java` — 当前完整代码（B1 产物）
2. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/facade/BpmTaskFacadeImpl.java` — 当前实现（B1 产物）
3. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/facade/BpmTaskFacade.java` — 当前接口（B1 产物）
4. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/dto/BpmTaskDTO.java` — 现有 DTO 字段
5. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/TaskDetailRespDTO.java` — 详情 DTO（B1 产物）
6. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/entity/InstanceStatusEnum.java` — 状态枚举
7. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/BpmInstanceService.java` — 实例 Service
8. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/TodoTaskRespDTO.java` — 待办 DTO（参考结构）
9. `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/page/PageParam.java` — 分页参数
10. `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/page/PageResult.java` — 分页结果

## 7. 允许修改的文件范围

### 修改

| # | 文件 | 改动 |
|---|------|------|
| 1 | `sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/facade/BpmTaskFacade.java` | 新增 `queryProcessedPage`、`countProcessed`、`queryHistoryByProcessInstance` 方法签名 |
| 2 | `sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/facade/BpmTaskFacadeImpl.java` | 注入 `HistoryService`，实现 3 个新方法 |
| 3 | `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmTodoController.java` | 新增 `reject()` + `processed()` 端点；`detail()` 追加审批历史 |
| 4 | `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/TaskDetailRespDTO.java` | 新增 `approvalHistory` 字段 |
| 5 | `sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/dto/BpmTaskDTO.java` | 新增 `endTime` 字段（可为 null） |

### 新建

| # | 文件 | 说明 |
|---|------|------|
| 1 | `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/ProcessedTaskRespDTO.java` | 已办列表响应 DTO |
| 2 | `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/ApprovalHistoryItemDTO.java` | 审批历史条目 DTO |

## 8. 禁止修改的范围

- ❌ Flyway 迁移脚本（无新表、无 schema 变更）
- ❌ `sw-biz/sw-bpm/sw-bpm-engine/` 中除 `BpmTaskFacadeImpl.java` 以外的文件
- ❌ `sw-biz/sw-bpm/sw-bpm-api/` 中除 `BpmTaskFacade.java` 和 `BpmTaskDTO.java` 以外的文件
- ❌ BPMN 流程定义 XML（`skeleton_approval.bpmn20.xml`）— 不修改 BPMN 模型
- ❌ `sw_bpm_instance` 表结构 — 已支持 REJECTED 状态
- ❌ BpmProcessDefController / BpmProcessDefService — 已在 B1 完成
- ❌ 前端代码
- ❌ 测试文件（测试在 B3）

## 9. 详细执行方案

### 9.1 BpmTaskDTO 新增 endTime 字段

**文件**：`sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/dto/BpmTaskDTO.java`

在 `createTime` 字段之后新增：

```java
/** 任务完成时间（仅已办/historic 任务有值，进行中任务为 null） */
private Date endTime;
```

> 向后兼容：现有代码只设 `createTime`，`endTime` 为 null，不影响待办查询。

### 9.2 BpmTaskFacade 新增 3 个方法签名

**文件**：`sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/facade/BpmTaskFacade.java`

在 `getVariables` 方法之后新增：

```java
/**
 * 分页查询已办任务（历史任务）。
 *
 * @param tenantId 租户 ID
 * @param assignee 处理人
 * @param offset   偏移量（从 0 开始）
 * @param limit    每页条数
 * @return 已办任务列表（含 endTime）
 */
List<BpmTaskDTO> queryProcessedPage(String tenantId, String assignee, int offset, int limit);

/**
 * 统计已办任务总数。
 *
 * @param tenantId 租户 ID
 * @param assignee 处理人
 * @return 已办任务总数
 */
long countProcessed(String tenantId, String assignee);

/**
 * 查询流程实例的审批历史（所有已完成的历史任务节点）。
 *
 * @param processInstanceId 流程实例 ID
 * @return 历史任务列表（按完成时间倒序）
 */
List<BpmTaskDTO> queryHistoryByProcessInstance(String processInstanceId);
```

### 9.3 BpmTaskFacadeImpl 实现

**文件**：`sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/facade/BpmTaskFacadeImpl.java`

#### 9.3.1 构造函数新增 HistoryService 注入

```java
private final HistoryService historyService;

public BpmTaskFacadeImpl(TaskService taskService, RuntimeService runtimeService,
                         RepositoryService repositoryService, HistoryService historyService) {
    // ...
    this.historyService = historyService;
}
```

新增 import：
```java
import org.flowable.engine.HistoryService;
import org.flowable.engine.history.HistoricTaskInstance;
```

#### 9.3.2 新增 3 个方法实现

在 `getVariables` 方法之后：

```java
@Override
public List<BpmTaskDTO> queryProcessedPage(String tenantId, String assignee, int offset, int limit) {
    List<HistoricTaskInstance> tasks = historyService.createHistoricTaskInstanceQuery()
            .taskTenantId(tenantId)
            .taskAssignee(assignee)
            .finished()
            .orderByHistoricTaskInstanceEndTime().desc()
            .listPage(offset, limit);

    return tasks.stream()
            .map(this::toDtoFromHistory)
            .collect(Collectors.toList());
}

@Override
public long countProcessed(String tenantId, String assignee) {
    return historyService.createHistoricTaskInstanceQuery()
            .taskTenantId(tenantId)
            .taskAssignee(assignee)
            .finished()
            .count();
}

@Override
public List<BpmTaskDTO> queryHistoryByProcessInstance(String processInstanceId) {
    List<HistoricTaskInstance> tasks = historyService.createHistoricTaskInstanceQuery()
            .processInstanceId(processInstanceId)
            .finished()
            .orderByHistoricTaskInstanceEndTime().desc()
            .list();

    return tasks.stream()
            .map(this::toDtoFromHistory)
            .collect(Collectors.toList());
}
```

#### 9.3.3 新增 toDtoFromHistory 内部方法

在类末尾（`getProcessDefinitionKey` 方法之后）新增：

```java
/**
 * 将 Flowable HistoricTaskInstance 转为 BpmTaskDTO。
 * <p>
 * 与 {@link #toDto(Task)} 的区别：增加 endTime 字段。
 * </p>
 */
private BpmTaskDTO toDtoFromHistory(HistoricTaskInstance task) {
    BpmTaskDTO dto = new BpmTaskDTO();
    dto.setTaskId(task.getId());
    dto.setName(task.getName());
    dto.setProcessInstanceId(task.getProcessInstanceId());
    dto.setProcessDefinitionKey(getProcessDefinitionKeyFromId(task.getProcessDefinitionId()));
    dto.setAssignee(task.getAssignee());
    dto.setCreateTime(task.getCreateTime());
    dto.setEndTime(task.getEndTime());
    return dto;
}

/**
 * 从 processDefinitionId 获取 process definition key。
 * <p>
 * HistoricTaskInstance 没有 getProcessDefinitionKey() 便捷方法，
 * 需要与 {@link #getProcessDefinitionKey(Task)} 相同的方式反查。
 * </p>
 */
private String getProcessDefinitionKeyFromId(String processDefinitionId) {
    if (processDefinitionId == null) {
        return null;
    }
    ProcessDefinition pd = repositoryService.createProcessDefinitionQuery()
            .processDefinitionId(processDefinitionId)
            .singleResult();
    return pd != null ? pd.getKey() : null;
}
```

> **注意**：现有的 `getProcessDefinitionKey(Task)` 方法接受 Flowable `Task` 类型，`HistoricTaskInstance` 是不同的类型。需要新增一个接受 `String processDefinitionId` 的版本，或者内联到 `toDtoFromHistory` 中。为了最小化改动，新增 `getProcessDefinitionKeyFromId(String)` 方法；或者更好的做法是让 `getProcessDefinitionKey(Task)` 改为接受 `String processDefinitionId`，但这样会改变已有方法签名。建议**新增独立方法**，不碰已有 `getProcessDefinitionKey(Task)`。

**重构建议**：将 `getProcessDefinitionKey(Task task)` 改写为委托给新方法：

```java
private String getProcessDefinitionKey(Task task) {
    return getProcessDefinitionKeyFromId(task.getProcessDefinitionId());
}
```

> 这是合理的内部重构——不改变行为，仅提取公共逻辑。

### 9.4 新建 ProcessedTaskRespDTO

**文件**：`sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/ProcessedTaskRespDTO.java`

```java
package com.sw.ck.bpm.process.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 已办任务响应 DTO。
 * <p>
 * 与 {@link TodoTaskRespDTO} 对称，额外包含完成时间（endTime）。
 * </p>
 */
@Data
public class ProcessedTaskRespDTO {

    /** Flowable task ID */
    private String taskId;

    /** 任务名称 */
    private String taskName;

    /** Flowable 流程实例 ID */
    private String processInstanceId;

    /** 流程名称（来自 BpmProcessDef.name） */
    private String processName;

    /** 表单业务标识 */
    private String formKey;

    /** 业务键（= 表单 recordId） */
    private String businessKey;

    /** 任务创建时间 */
    private LocalDateTime createTime;

    /** 任务完成时间 */
    private LocalDateTime endTime;
}
```

### 9.5 新建 ApprovalHistoryItemDTO

**文件**：`sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/ApprovalHistoryItemDTO.java`

```java
package com.sw.ck.bpm.process.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 审批历史条目 DTO。
 * <p>
 * 代表一个已完成的审批节点，记录谁在什么时候做了审批。
 * </p>
 */
@Data
public class ApprovalHistoryItemDTO {

    /** Flowable task ID */
    private String taskId;

    /** 任务名称（如"审批"） */
    private String taskName;

    /** 处理人用户 ID */
    private String assignee;

    /** 任务创建时间 */
    private LocalDateTime createTime;

    /** 任务完成时间 */
    private LocalDateTime endTime;
}
```

### 9.6 TaskDetailRespDTO 新增 approvalHistory 字段

**文件**：`sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/TaskDetailRespDTO.java`

在 `processVariables` 字段之后新增：

```java
/** 该流程实例的审批历史（按完成时间倒序） */
private List<ApprovalHistoryItemDTO> approvalHistory;
```

需要新增 import：
```java
import java.util.List;
```

### 9.7 BpmTodoController 扩展

**文件**：`sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmTodoController.java`

#### 9.7.1 新增 import

```java
import com.sw.ck.bpm.process.dto.ProcessedTaskRespDTO;
import com.sw.ck.bpm.process.dto.ApprovalHistoryItemDTO;
```

#### 9.7.2 新增 reject() 端点

在 `complete()` 方法之后、`detail()` 方法之前新增：

```java
/**
 * 驳回审批。
 * <p>
 * 与通过（{@link #complete}）共享相同的越权校验和流程完成逻辑，
 * 差异在于实例终态为 {@link InstanceStatusEnum#REJECTED} 且不发布通知事件。
 * </p>
 *
 * @param taskId Flowable task ID
 * @return 操作成功
 * @throws BaseException 任务不存在 / 越权时抛出
 */
@Transactional
@PostMapping("/{taskId}/reject")
public R<Void> reject(@PathVariable String taskId) {
    LoginUser loginUser = LoginUserHolder.get();

    // 1. 查询 task（经 Facade）
    BpmTaskDTO task = bpmTaskFacade.getTask(taskId);
    if (task == null) {
        throw new BaseException(CommonErrorCode.NOT_FOUND.getCode(), "任务不存在");
    }

    // 2. 越权校验：审批人
    if (!String.valueOf(loginUser.getUserId()).equals(task.getAssignee())) {
        log.warn("越权拒绝（审批人不匹配）: taskId={}, taskAssignee={}, currentUserId={}",
                taskId, task.getAssignee(), loginUser.getUserId());
        throw new BaseException(CommonErrorCode.FORBIDDEN.getCode(), "无权处理该任务");
    }

    String processInstanceId = task.getProcessInstanceId();

    // 3. 驳回：携带 outcome=REJECTED 流程变量，供 BPMN 网关（未来扩展）使用
    java.util.Map<String, Object> variables = new java.util.HashMap<>();
    variables.put("outcome", "REJECTED");
    bpmTaskFacade.complete(taskId, variables);
    log.info("审批已驳回: taskId={}, processInstanceId={}, userId={}",
            taskId, processInstanceId, loginUser.getUserId());

    // 4. 检测流程是否结束（单节点必然结束）
    if (!bpmTaskFacade.isProcessActive(processInstanceId)) {
        bpmInstanceService.updateStatus(
                processInstanceId, InstanceStatusEnum.REJECTED.getCode());
        log.info("流程已结束（驳回），实例状态更新为 REJECTED: processInstanceId={}",
                processInstanceId);
    }

    return R.ok();
}
```

> **Map 类型处理**：如果 `java.util.HashMap` 已在文件上方 import 则无需重复；否则在文件顶部新增 import `java.util.HashMap` 和 `java.util.Map`（B1 已导入 Map）。

#### 9.7.3 新增 processed() 端点

在 `detail()` 方法之后、`toTodoTaskDTO()` 之前新增：

```java
/**
 * 当前用户已办列表（分页）。
 * <p>
 * 查询 Flowable 历史任务（已完成），按完成时间倒序排列。
 * </p>
 *
 * @param pageParam 分页参数
 * @return 分页已办任务列表
 */
@GetMapping("/processed")
public R<PageResult<ProcessedTaskRespDTO>> processed(PageParam pageParam) {
    LoginUser loginUser = LoginUserHolder.get();
    String tenantId = String.valueOf(loginUser.getTenantId());
    String assignee = String.valueOf(loginUser.getUserId());

    long offset = (pageParam.getPageNum() - 1) * pageParam.getPageSize();
    int limit = (int) pageParam.getPageSize();

    List<BpmTaskDTO> tasks = bpmTaskFacade.queryProcessedPage(tenantId, assignee, (int) offset, limit);
    long total = bpmTaskFacade.countProcessed(tenantId, assignee);

    List<ProcessedTaskRespDTO> dtos = tasks.stream()
            .map(this::toProcessedTaskDTO)
            .collect(Collectors.toList());

    log.debug("已办查询: tenantId={}, assignee={}, total={}, pageNum={}, pageSize={}",
            tenantId, assignee, total, pageParam.getPageNum(), pageParam.getPageSize());

    PageResult<ProcessedTaskRespDTO> pageResult = new PageResult<>();
    pageResult.setRecords(dtos);
    pageResult.setTotal(total);
    pageResult.setPageNum(pageParam.getPageNum());
    pageResult.setPageSize(pageParam.getPageSize());

    return R.ok(pageResult);
}
```

#### 9.7.4 新增 toProcessedTaskDTO() 内部方法

在 `toTodoTaskDTO()` 方法之后新增：

```java
/**
 * 将 BpmTaskDTO 富化为 ProcessedTaskRespDTO。
 * <p>
 * 除任务基本信息外，额外富化 formKey、processName、endTime。
 * </p>
 */
private ProcessedTaskRespDTO toProcessedTaskDTO(BpmTaskDTO task) {
    ProcessedTaskRespDTO dto = new ProcessedTaskRespDTO();
    dto.setTaskId(task.getTaskId());
    dto.setTaskName(task.getName());
    dto.setProcessInstanceId(task.getProcessInstanceId());

    // 时间转换：Date → LocalDateTime
    if (task.getCreateTime() != null) {
        dto.setCreateTime(LocalDateTime.ofInstant(
                task.getCreateTime().toInstant(), ZoneId.systemDefault()));
    }
    if (task.getEndTime() != null) {
        dto.setEndTime(LocalDateTime.ofInstant(
                task.getEndTime().toInstant(), ZoneId.systemDefault()));
    }

    // formKey 从流程变量获取（经 Facade）
    String formKey = bpmTaskFacade.getVariable(
            task.getProcessInstanceId(), "formKey");
    dto.setFormKey(formKey);

    // processName 富化（经 BpmProcessDefService）
    if (task.getProcessDefinitionKey() != null) {
        BpmProcessDef processDef = bpmProcessDefService.findByProcessKey(task.getProcessDefinitionKey());
        if (processDef != null) {
            dto.setProcessName(processDef.getName());
        }
    }

    return dto;
}
```

#### 9.7.5 增强 detail() 端点 — 追加审批历史

在现有 `detail()` 方法的 `return R.ok(dto);` 之前追加：

```java
// 审批历史
List<BpmTaskDTO> historyTasks = bpmTaskFacade.queryHistoryByProcessInstance(task.getProcessInstanceId());
List<ApprovalHistoryItemDTO> history = new java.util.ArrayList<>();
for (BpmTaskDTO h : historyTasks) {
    ApprovalHistoryItemDTO item = new ApprovalHistoryItemDTO();
    item.setTaskId(h.getTaskId());
    item.setTaskName(h.getName());
    item.setAssignee(h.getAssignee());
    if (h.getCreateTime() != null) {
        item.setCreateTime(LocalDateTime.ofInstant(
                h.getCreateTime().toInstant(), ZoneId.systemDefault()));
    }
    if (h.getEndTime() != null) {
        item.setEndTime(LocalDateTime.ofInstant(
                h.getEndTime().toInstant(), ZoneId.systemDefault()));
    }
    history.add(item);
}
dto.setApprovalHistory(history);
```

> **注意**：审批历史中的 `assignee` 是 Flowable 的用户 ID（String），当前不解析为显示名（与 B1 中 `initiatorId` 的决策一致）。前端可通过 `/system/user/{id}` 反查，或后续 Step 中由 `UserFacade` 富化。

### 9.8 完整变更文件清单

| # | 文件 | 操作 | 改动摘要 |
|---|------|:----:|----------|
| 1 | `BpmTaskDTO.java` | 修改 | +1 字段 `endTime`（Date，可为 null） |
| 2 | `BpmTaskFacade.java` | 修改 | +3 方法签名 |
| 3 | `BpmTaskFacadeImpl.java` | 修改 | 注入 `HistoryService`；+4 个新方法（`queryProcessedPage`、`countProcessed`、`queryHistoryByProcessInstance`、`toDtoFromHistory`）+ 重构 `getProcessDefinitionKey` |
| 4 | `BpmTodoController.java` | 修改 | +2 端点（`reject`、`processed`）；+1 内部方法（`toProcessedTaskDTO`）；现有 `detail()` 追加审批历史 |
| 5 | `TaskDetailRespDTO.java` | 修改 | +1 字段 `approvalHistory` |
| 6 | `ProcessedTaskRespDTO.java` | **新建** | 9 字段已办任务 DTO |
| 7 | `ApprovalHistoryItemDTO.java` | **新建** | 5 字段审批历史条目 DTO |

## 10. 关键实现约束

1. **驳回复用 complete() Flowable 操作**：不新增单独的 `reject()` Facade 方法。通过 `complete(taskId, {"outcome": "REJECTED"})` 传变量区分
2. **驳回不触发通知**：`reject()` 不发布 `BpmNotifyEvent`（与 `complete()` 的行为差异——`complete()` 的 `publishApprovedEvent` 仅在通过时调用）
3. **已办查询的租户过滤**：`HistoryService.createHistoricTaskInstanceQuery().taskTenantId(tenantId)` — 与待办查询的租户过滤方式一致
4. **processName 富化复用 B1 模式**：`toProcessedTaskDTO` 中的 processName 富化逻辑与 `toTodoTaskDTO` 完全一致
5. **endTime 可为 null**：进行中任务（待办）`endTime` 始终为 null；仅在已办/historic 任务中填充
6. **HistoryService 已由 Flowable 自动配置**：无需修改 `BpmEngineAutoConfiguration`，Spring 容器中已有 `HistoryService` bean
7. **`getProcessDefinitionKey` 内部重构**：提取 `getProcessDefinitionKeyFromId(String)` 公共方法，原 `getProcessDefinitionKey(Task)` 改为委托——行为不变，仅减少重复
8. **无 Flyway 变更**：不创建新表，不修改已有表结构。审批历史数据来自 Flowable `ACT_HI_TASKINST`，由引擎自动维护
9. **不修改 `BpmTaskDTO.name` 的语义**：`name` 字段同时用于待办和已办，值均为 Flowable Task/HistoricTaskInstance 的 `getName()`（即任务节点名称，如"审批"）

## 11. 边界情况

| 场景 | 预期行为 |
|------|----------|
| taskId 不存在就 reject | `getTask()` 返回 null → 抛 `BaseException(NOT_FOUND, "任务不存在")` |
| 非 assignee 的 reject | FORBIDDEN 异常 |
| 已完成的 task 再次 reject | `getTask()` 返回 null（ACT_RU_TASK 中已移除）→ NOT_FOUND |
| 已办列表为空 | `total=0`，`records=[]`，正常返回 |
| pageNum/pageSize 默认值 | PageParam 默认 pageNum=1、pageSize=10 |
| processInstanceId 无历史任务 | `queryHistoryByProcessInstance` 返回空 list，`approvalHistory=[]` |
| 流程实例被删除 | `getVariable` 查不到 formKey（RuntimeService 无活跃实例），返回 null |
| 历史任务的 processDefinitionKey 为空 | `getProcessDefinitionKeyFromId(null)` 返回 null，后续 processName 富化跳过 |

## 12. 风险和回滚方案

| 风险 | 概率 | 回滚 |
|------|:----:|------|
| `HistoryService` 不在 BpmEngineAutoConfiguration 暴露为 Bean | 低 | Flowable 自动配置默认暴露 `HistoryService`；如果缺失则在 `BpmEngineAutoConfiguration` 中添加 `@Bean` 方法 |
| `BpmTaskDTO.endTime` 新增字段影响序列化 | 低 | `endTime=null` 时 Jackson 默认不序列化（可通过 `@JsonInclude(NON_NULL)` 控制）；不影响现有消费者 |
| `queryHistoryByProcessInstance` 返回空列表（历史未记录） | 中 | 确认 Flowable 配置中 `historyLevel` 不为 `none`；开发/测试环境默认 `audit` 级别足够 |

## 13. 测试方案

### 13.1 静态检查

```bash
# 编译验证（零错误）
cd Smart-WorkFlow && mvn -q compile

# 确认 Facade 新方法存在
grep -n "queryProcessedPage\|countProcessed\|queryHistoryByProcessInstance" \
  sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/facade/BpmTaskFacade.java

# 确认 HistoryService 注入 FacadeImpl
grep -n "HistoryService" \
  sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/facade/BpmTaskFacadeImpl.java

# 确认 reject/processed 端点存在
grep -n "reject\|processed" \
  sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmTodoController.java

# 确认新建文件存在
ls sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/ProcessedTaskRespDTO.java
ls sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/ApprovalHistoryItemDTO.java

# 确认 endTime 字段存在
grep -n "endTime" \
  sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/dto/BpmTaskDTO.java

# 确认 approvalHistory 字段存在
grep -n "approvalHistory" \
  sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/TaskDetailRespDTO.java
```

### 13.2 单元测试

本 Step 不包含测试文件（测试在 B3 Step）。

### 13.3 集成测试

本 Step 不涉及跨模块新交互路径。

### 13.4 手工验证

```bash
# 编译验证
cd Smart-WorkFlow && mvn -q compile
# 预期：BUILD SUCCESS，无错误
```

### 13.5 回归检查

```bash
cd Smart-WorkFlow && mvn -q test 2>&1 | grep "Tests run:"
# 预期：无 FAILED，总数 ≥ 7（当前 BPM 测试基线）
```

## 14. 验收标准

| 编号 | 条件 | 验证方式 |
|:----:|------|----------|
| B2-1 | `BpmTaskDTO` 含 `endTime` 字段（Date 类型） | grep DTO |
| B2-2 | `BpmTaskFacade` 含 `queryProcessedPage(String, String, int, int)` 方法签名 | grep 接口 |
| B2-3 | `BpmTaskFacade` 含 `countProcessed(String, String)` 方法签名 | grep 接口 |
| B2-4 | `BpmTaskFacade` 含 `queryHistoryByProcessInstance(String)` 方法签名 | grep 接口 |
| B2-5 | `BpmTaskFacadeImpl` 注入 `HistoryService` 且使用 `createHistoricTaskInstanceQuery()` | grep 实现 |
| B2-6 | `BpmTodoController` 含 `@PostMapping("/{taskId}/reject")` 驳回端点 | grep Controller |
| B2-7 | `BpmTodoController` 含 `@GetMapping("/processed")` 已办端点 | grep Controller |
| B2-8 | `BpmTodoController.reject()` 使用 `InstanceStatusEnum.REJECTED` 更新状态 | grep Controller |
| B2-9 | `ProcessedTaskRespDTO.java` 新建含 9 字段（taskId/taskName/processInstanceId/processName/formKey/businessKey/createTime/endTime） | ls + grep DTO |
| B2-10 | `ApprovalHistoryItemDTO.java` 新建含 5 字段（taskId/taskName/assignee/createTime/endTime） | ls + grep DTO |
| B2-11 | `TaskDetailRespDTO` 含 `approvalHistory` 字段 | grep DTO |
| B2-12 | `mvn -q compile` 退出码 0 | 执行编译 |
| B2-13 | 已有 `complete()` 端点行为不变（回执确认） | grep complete 方法确认未改动 |

## 15. 执行回执格式

按 CLAUDE.md §7.1 标准 13 项结构输出执行回执，写入：

```
product/bpm-task-center/receipts/step-b2-后端驳回+已办+审批历史-execution.md
```

## 16. 测试回执格式

本 Step 不包含测试编写（测试在 B3 Step）。测试回执在 B3 执行后一并输出。

## 17. 明确禁止事项

1. ❌ **不要修改 BPMN 流程定义 XML** — 骨架 BPMN 不动，单节点驳回只是状态标记差异
2. ❌ **不要创建 `sw_bpm_approval_record` 表或 Flyway 迁移** — 审批历史复用 Flowable 自带的 `ACT_HI_TASKINST`
3. ❌ **不要在 `BpmTaskFacade` 中新增 `reject()` 方法** — 驳回复用 `complete(taskId, variables)`，仅传不同变量
4. ❌ **不要新加 Controller 类** — 全部改动在现有 `BpmTodoController` 内完成
5. ❌ **不要在 `reject()` 中发布通知事件** — 驳回不通知发起人
6. ❌ **不要引入 Spring 上下文测试** — B3 统一处理
7. ❌ **不要修改 `BpmProcessDefService`** — 已在 B1 完成
8. ❌ **不要在 Controller 中直接使用 `HistoryService`** — 必须经 `BpmTaskFacade` 防腐层
9. ❌ **不要修改前端代码** — 纯后端 Step
10. ❌ **不要新加 Maven 依赖** — Flowable HistoryService 已在 classpath
