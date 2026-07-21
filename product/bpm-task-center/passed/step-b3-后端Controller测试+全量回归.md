# Step B3：后端 — Controller 单元测试 + 全量回归验证

## 1. 当前状态

- **功能**：BPM 待办中心增强（bpm-task-center），Step B1、B2 均已 PASSED
- **前置 Step**：
  - B1 — 待办分页 + 任务详情端点：7 文件，10/10 验收通过
  - B2 — 驳回端点 + 已办列表 + 审批历史：7 文件，13/13 验收通过
- **BpmTodoController 当前端点**（5 个）：
  - `GET /workflow/tasks/todo` — 待办分页
  - `POST /workflow/tasks/{taskId}/complete` — 审批通过（B1）
  - `POST /workflow/tasks/{taskId}/reject` — 驳回（B2 新增）
  - `GET /workflow/tasks/{taskId}` — 任务详情（含审批历史，B1+B2）
  - `GET /workflow/tasks/processed` — 已办分页（B2 新增）
- **Controller 依赖**：`BpmTaskFacade` · `BpmInstanceService` · `BpmProcessDefService` · `DomainEventPublisher`
- **测试基线**：全工程 136 tests / 7 模块（CONFIRMED 2026-07-16），BPM 引擎 7 tests + BPM process 1 test = 8 tests

## 2. Step 目标

为 `BpmTodoController` 编写纯 Mockito 单元测试，覆盖全部 5 个端点的 happy path + 边界/异常路径，确保 B1+B2 新增代码有测试兜底；运行全量回归验证无退化。

## 3. 推荐模型

```
推荐模型：deepseek-v4-flash
选择理由：纯单元测试编写，沿 UserControllerTest / AuthMeControllerTest 既有的 Mockito + AssertJ 模式，无架构决策、无 schema 变更、无跨模块协议变更
是否触发升级条件：否
```

## 4. 模型选择理由

B3 是标准测试编写工作：Mock 四个依赖、用 LoginUserHolder.set() 装配认证上下文、AssertJ 断言。所有测试模式均有先例（`UserControllerTest`、`AuthMeControllerTest`），不需推理复杂组合爆炸或安全边界。

## 5. 已知上下文

### 5.1 测试框架和模式

项目使用 **JUnit 5 + Mockito + AssertJ**，纯单元测试（不装载 Spring 上下文）：

```java
// 标准模式（来自 UserControllerTest / AuthMeControllerTest）
class XxxControllerTest {
    private final XxxService service = mock(XxxService.class);
    private final XxxController controller = new XxxController(service);

    @AfterEach
    void tearDown() { LoginUserHolder.clear(); }

    @Test
    void testMethod() {
        LoginUser loginUser = new LoginUser();
        loginUser.setUserId(1L);
        loginUser.setTenantId(0L);
        LoginUserHolder.set(loginUser);

        when(service.method(any())).thenReturn(...);

        R<...> result = controller.endpoint(...);

        assertThat(result.getCode()).isZero();
        verify(service).method(any());
    }
}
```

### 5.2 LoginUserHolder 用法

`LoginUserHolder` 是 `ThreadLocal` 静态工具类：
- `LoginUserHolder.set(loginUser)` — 装配当前用户
- `LoginUserHolder.get()` — Controller 内部调用获取当前用户
- `LoginUserHolder.clear()` — 每个测试后清理，防止线程池复用污染

**不需要 MockStatic**：`LoginUserHolder` 就是为这种测试场景设计的——直接 set 真实 LoginUser 对象即可。

### 5.3 BpmTodoController 构造函数签名

```java
public BpmTodoController(BpmTaskFacade bpmTaskFacade,
                         BpmInstanceService bpmInstanceService,
                         BpmProcessDefService bpmProcessDefService,
                         DomainEventPublisher domainEventPublisher)
```

4 个依赖全部 Mock，手动传入构造函数。

### 5.4 BpmTaskFacade 方法清单（测试中会用到的）

| 方法 | 用途 | 所在 Step |
|------|------|:---:|
| `getTask(String)` | 查询单个 task（complete/reject/detail） | B1 |
| `queryTodoPage(String, String, int, int)` | 待办分页 | B1 |
| `countTodo(String, String)` | 待办计数 | B1 |
| `complete(String, Map<String, Object>)` | 完成审批 | B1 |
| `isProcessActive(String)` | 判断流程是否活跃 | B1 |
| `getVariable(String, String)` | 获取单个流程变量（formKey） | B1 |
| `getVariables(String)` | 获取全部流程变量 | B1 |
| `queryProcessedPage(String, String, int, int)` | 已办分页 | B2 |
| `countProcessed(String, String)` | 已办计数 | B2 |
| `queryHistoryByProcessInstance(String)` | 审批历史 | B2 |

### 5.5 关键类型和构造

```java
// BpmTaskDTO（Facade 层返回，Date 类型时间字段）
BpmTaskDTO task = new BpmTaskDTO();
task.setTaskId("task-001");
task.setName("审批");
task.setProcessInstanceId("pi-001");
task.setProcessDefinitionKey("skeleton_approval:1:xxx");
task.setAssignee("2");          // String 类型，用户 ID
task.setCreateTime(new Date());
task.setEndTime(new Date());    // B2 新增，已办任务有值

// BpmInstance
BpmInstance instance = new BpmInstance();
instance.setInitiatorId("1");

// BpmProcessDef
BpmProcessDef processDef = new BpmProcessDef();
processDef.setName("单节点审批");
processDef.setProcessKey("skeleton_approval");
```

### 5.6 分页参数

`PageParam` 默认 `pageNum=1, pageSize=10`（Long 类型）。Controller 中 offset = `(pageNum - 1) * pageSize`，转换为 `(int)`。

## 6. 执行前必须读取的文件

1. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmTodoController.java` — 被测类完整代码
2. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/TodoTaskRespDTO.java` — 待办 DTO
3. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/TaskDetailRespDTO.java` — 详情 DTO
4. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/ProcessedTaskRespDTO.java` — 已办 DTO（B2 新建）
5. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/ApprovalHistoryItemDTO.java` — 审批历史条目 DTO（B2 新建）
6. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/entity/InstanceStatusEnum.java` — 状态枚举
7. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/dto/BpmTaskDTO.java` — Facade DTO
8. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/facade/BpmTaskFacade.java` — Facade 接口（确认方法签名）
9. `Smart-WorkFlow/sw-framework/sw-security/src/main/java/com/sw/ck/security/holder/LoginUser.java` — LoginUser 字段
10. `Smart-WorkFlow/sw-framework/sw-security/src/main/java/com/sw/ck/security/holder/LoginUserHolder.java` — ThreadLocal API
11. `Smart-WorkFlow/sw-biz/sw-biz-system/sw-biz-system-biz/src/test/java/com/sw/ck/system/controller/AuthMeControllerTest.java` — 测试模式参考（LoginUserHolder.set/clear + Mockito）
12. `Smart-WorkFlow/sw-framework/sw-common/src/main/java/com/sw/ck/common/page/PageParam.java` — 分页参数默认值

## 7. 允许修改的文件范围

### 新建

| # | 文件 | 说明 |
|---|------|------|
| 1 | `sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/controller/BpmTodoControllerTest.java` | Controller 单元测试 |

### 不修改任何已有文件

本 Step 仅新建测试文件，不修改任何已有源代码或测试文件。

## 8. 禁止修改的范围

- ❌ `BpmTodoController.java` — 被测类，不修改
- ❌ `BpmTaskFacade.java` / `BpmTaskFacadeImpl.java` — 不修改
- ❌ 任何 DTO / Entity / Service / Mapper 文件
- ❌ 任何已有测试文件
- ❌ Flyway 迁移脚本
- ❌ BPMN 流程定义 XML
- ❌ pom.xml（不新增依赖，spring-boot-starter-test 已含 Mockito + AssertJ + JUnit 5）
- ❌ 前端代码

## 9. 详细执行方案

### 9.1 新建测试文件

**文件**：`sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/controller/BpmTodoControllerTest.java`

#### 9.1.1 类结构和测试数据准备

```java
package com.sw.ck.bpm.process.controller;

import com.sw.ck.bpm.api.dto.BpmTaskDTO;
import com.sw.ck.bpm.api.event.BpmNotifyEvent;
import com.sw.ck.bpm.api.facade.BpmTaskFacade;
import com.sw.ck.bpm.process.dto.ApprovalHistoryItemDTO;
import com.sw.ck.bpm.process.dto.ProcessedTaskRespDTO;
import com.sw.ck.bpm.process.dto.TaskDetailRespDTO;
import com.sw.ck.bpm.process.dto.TodoTaskRespDTO;
import com.sw.ck.bpm.process.entity.BpmInstance;
import com.sw.ck.bpm.process.entity.BpmProcessDef;
import com.sw.ck.bpm.process.service.BpmInstanceService;
import com.sw.ck.bpm.process.service.BpmProcessDefService;
import com.sw.ck.common.event.DomainEventPublisher;
import com.sw.ck.common.exception.BaseException;
import com.sw.ck.common.page.PageParam;
import com.sw.ck.common.page.PageResult;
import com.sw.ck.common.response.R;
import com.sw.ck.security.holder.LoginUser;
import com.sw.ck.security.holder.LoginUserHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@DisplayName("BPM 待办中心控制器测试")
class BpmTodoControllerTest {

    private final BpmTaskFacade bpmTaskFacade = mock(BpmTaskFacade.class);
    private final BpmInstanceService bpmInstanceService = mock(BpmInstanceService.class);
    private final BpmProcessDefService bpmProcessDefService = mock(BpmProcessDefService.class);
    private final DomainEventPublisher domainEventPublisher = mock(DomainEventPublisher.class);

    private final BpmTodoController controller = new BpmTodoController(
            bpmTaskFacade, bpmInstanceService, bpmProcessDefService, domainEventPublisher);

    @AfterEach
    void tearDown() {
        LoginUserHolder.clear();
    }

    // ========== 测试数据工厂方法 ==========

    /** 装配标准登录用户（userId=2, tenantId=1, assignee="2"） */
    private void setLoginUser() {
        LoginUser loginUser = new LoginUser();
        loginUser.setUserId(2L);
        loginUser.setTenantId(1L);
        loginUser.setUsername("approver1");
        loginUser.setRoles(List.of("user"));
        loginUser.setPermissions(Collections.emptyList());
        loginUser.setSuperAdmin(false);
        LoginUserHolder.set(loginUser);
    }

    /** 创建标准 BpmTaskDTO（待办，endTime=null） */
    private BpmTaskDTO createTask(String taskId) {
        BpmTaskDTO task = new BpmTaskDTO();
        task.setTaskId(taskId);
        task.setName("审批");
        task.setProcessInstanceId("pi-" + taskId);
        task.setProcessDefinitionKey("skeleton_approval:1:abc123");
        task.setAssignee("2");  // 与 LoginUser.userId 一致
        task.setBusinessKey("rec-001");
        task.setCreateTime(new Date());
        return task;
    }

    /** 创建标准 ProcessDef */
    private BpmProcessDef createProcessDef() {
        BpmProcessDef def = new BpmProcessDef();
        def.setName("单节点审批");
        def.setProcessKey("skeleton_approval");
        return def;
    }

    /** 创建标准 BpmInstance */
    private BpmInstance createInstance() {
        BpmInstance instance = new BpmInstance();
        instance.setInitiatorId("1");
        return instance;
    }

    // ... 测试用例见 9.2~9.6
}
```

#### 9.1.2 使用 @Nested 分组

按端点分 5 个 `@Nested` 内部类，结构如下：

```
BpmTodoControllerTest
├── @Nested TodoTests          — GET /todo
├── @Nested CompleteTests      — POST /{taskId}/complete
├── @Nested RejectTests        — POST /{taskId}/reject
├── @Nested DetailTests        — GET /{taskId} (含 approvalHistory)
└── @Nested ProcessedTests     — GET /processed
```

### 9.2 TodoTests — GET /workflow/tasks/todo（3 个用例）

| # | 用例 | Arrange | Assert |
|---|------|---------|--------|
| 1 | **正常分页查询** — 返回 PageResult 含 records/total/pageNum/pageSize | `queryTodoPage` 返回 2 个 task；`countTodo` 返回 2；`getVariable` 返回 `"test_form"`；`findByProcessKey` 返回 processDef | `result.getCode() == 0`；`data.records.size() == 2`；`data.total == 2`；第一条 `formKey == "test_form"`；`processName == "单节点审批"`；verify facade 各调用 1 次 |
| 2 | **空待办列表** — total=0, records=[] | `queryTodoPage` 返回 `Collections.emptyList()`；`countTodo` 返回 0 | `result.getCode() == 0`；`data.records` 为空；`data.total == 0` |
| 3 | **processName 为 null 时不抛 NPE** — findByProcessKey 返回 null | `findByProcessKey` 返回 null | `result.getCode() == 0`；对应条目的 `processName` 为 null |

**实现要点**：

```java
@Test
@DisplayName("正常分页查询 → PageResult 含 records/total/pageNum/pageSize")
void todo_shouldReturnPageResult() {
    setLoginUser();
    BpmTaskDTO t1 = createTask("task-001");
    BpmTaskDTO t2 = createTask("task-002");

    when(bpmTaskFacade.queryTodoPage(eq("1"), eq("2"), anyInt(), anyInt()))
            .thenReturn(List.of(t1, t2));
    when(bpmTaskFacade.countTodo("1", "2")).thenReturn(2L);
    when(bpmTaskFacade.getVariable("pi-task-001", "formKey")).thenReturn("test_form");
    when(bpmTaskFacade.getVariable("pi-task-002", "formKey")).thenReturn("leave_form");
    when(bpmProcessDefService.findByProcessKey("skeleton_approval")).thenReturn(createProcessDef());

    R<PageResult<TodoTaskRespDTO>> result = controller.todo(new PageParam());

    assertThat(result.getCode()).isZero();
    assertThat(result.getData().getRecords()).hasSize(2);
    assertThat(result.getData().getTotal()).isEqualTo(2L);
    assertThat(result.getData().getPageNum()).isEqualTo(1L);
    assertThat(result.getData().getRecords().get(0).getFormKey()).isEqualTo("test_form");
    assertThat(result.getData().getRecords().get(0).getProcessName()).isEqualTo("单节点审批");
    verify(bpmTaskFacade).queryTodoPage(eq("1"), eq("2"), eq(0), eq(10));
    verify(bpmTaskFacade).countTodo("1", "2");
}
```

### 9.3 CompleteTests — POST /{taskId}/complete（4 个用例）

| # | 用例 | Arrange | Assert |
|---|------|---------|--------|
| 1 | **正常审批通过** — 流程结束 → 更新状态为 APPROVED → 发布通知事件 | `getTask` 返回 task；`complete` 成功；`isProcessActive` 返回 false；`findByProcessInstanceId` 返回 instance | `result.getCode() == 0`；verify `updateStatus("pi-xxx", "APPROVED")` 调用 1 次；verify `domainEventPublisher.publish(any(BpmNotifyEvent.class))` 调用 1 次 |
| 2 | **审批通过但流程未结束** — 不更新状态、不发通知 | `isProcessActive` 返回 true | `result.getCode() == 0`；verify `updateStatus` 调用 0 次；verify `publish` 调用 0 次 |
| 3 | **任务不存在** — taskId 无对应 task | `getTask` 返回 null | 抛 `BaseException`，message 含 "任务不存在" |
| 4 | **越权 — 非 assignee 操作** | assignee 为 "3"，loginUser 为 "2" | 抛 `BaseException`，message 含 "无权处理" |

**关键断言**：

```java
@Test
@DisplayName("正常审批通过 → 流程结束 → APPROVED + 通知事件")
void complete_shouldApproveAndPublishEvent() {
    setLoginUser();
    BpmTaskDTO task = createTask("task-001");
    when(bpmTaskFacade.getTask("task-001")).thenReturn(task);
    doNothing().when(bpmTaskFacade).complete(eq("task-001"), isNull());
    when(bpmTaskFacade.isProcessActive("pi-task-001")).thenReturn(false);
    when(bpmInstanceService.findByProcessInstanceId("pi-task-001"))
            .thenReturn(Optional.of(createInstance()));

    R<Void> result = controller.complete("task-001");

    assertThat(result.getCode()).isZero();
    verify(bpmInstanceService).updateStatus("pi-task-001", "APPROVED");
    verify(domainEventPublisher).publish(any(BpmNotifyEvent.class));
}

@Test
@DisplayName("任务不存在 → 抛 NOT_FOUND")
void complete_taskNotFound_shouldThrow() {
    setLoginUser();
    when(bpmTaskFacade.getTask("task-999")).thenReturn(null);

    assertThatThrownBy(() -> controller.complete("task-999"))
            .isInstanceOf(BaseException.class)
            .hasMessageContaining("任务不存在");
}
```

### 9.4 RejectTests — POST /{taskId}/reject（4 个用例）

| # | 用例 | Arrange | Assert |
|---|------|---------|--------|
| 1 | **正常驳回** — 流程结束 → 更新状态为 REJECTED，不发布通知 | `getTask` 返回 task；`complete` 接受 `Map.of("outcome", "REJECTED")`；`isProcessActive` 返回 false | `result.getCode() == 0`；verify `updateStatus("pi-xxx", "REJECTED")` 调用 1 次；verify `domainEventPublisher.publish` 调用 **0 次**（驳回不发通知） |
| 2 | **驳回但流程未结束** — 不更新状态 | `isProcessActive` 返回 true | `result.getCode() == 0`；verify `updateStatus` 调用 0 次 |
| 3 | **任务不存在** | `getTask` 返回 null | 抛 `BaseException`，message 含 "任务不存在" |
| 4 | **越权** | assignee 不匹配 | 抛 `BaseException`，message 含 "无权处理" |

**reject 独有关键断言**（与 complete 的 4 点差异）：

```java
@Test
@DisplayName("正常驳回 → 流程结束 → REJECTED + 不发通知")
void reject_shouldRejectAndNotPublishEvent() {
    setLoginUser();
    BpmTaskDTO task = createTask("task-001");
    when(bpmTaskFacade.getTask("task-001")).thenReturn(task);
    when(bpmTaskFacade.isProcessActive("pi-task-001")).thenReturn(false);

    R<Void> result = controller.reject("task-001");

    assertThat(result.getCode()).isZero();
    // 验证调用 complete 时传了 outcome=REJECTED
    verify(bpmTaskFacade).complete(eq("task-001"), argThat(vars ->
            vars != null && "REJECTED".equals(vars.get("outcome"))));
    verify(bpmInstanceService).updateStatus("pi-task-001", "REJECTED");
    // 驳回不触发通知
    verifyNoInteractions(domainEventPublisher);
}
```

### 9.5 DetailTests — GET /{taskId}（4 个用例）

| # | 用例 | Arrange | Assert |
|---|------|---------|--------|
| 1 | **完整详情** — 含 processName + initiatorId + variables + approvalHistory | `getTask` 返回 task；`findByProcessKey` 返回 processDef；`findByProcessInstanceId` 返回 instance；`getVariables` 返回 `Map.of("formKey", "leave_form")`；`queryHistoryByProcessInstance` 返回 2 条历史 | `result.getCode() == 0`；`taskName == "审批"`；`processName == "单节点审批"`；`initiatorId == "1"`；`processVariables` 含 `formKey=leave_form`；`approvalHistory.size() == 2`；每条含 taskId/taskName/assignee/createTime/endTime |
| 2 | **审批历史为空** — 无历史记录 | `queryHistoryByProcessInstance` 返回空列表 | `result.getCode() == 0`；`approvalHistory` 为空列表（非 null） |
| 3 | **任务不存在** | `getTask` 返回 null | 抛 `BaseException`，message 含 "任务不存在" |
| 4 | **processDef 被删除** — processName 为 null | `findByProcessKey` 返回 null | `result.getCode() == 0`；`processName` 为 null（不抛 NPE） |

**指定需要额外验证的字段（B2 新增 approvalHistory）**：

```java
@Test
@DisplayName("完整详情 → 含 processName + initiatorId + variables + approvalHistory")
void detail_shouldReturnFullInfo() {
    setLoginUser();
    BpmTaskDTO task = createTask("task-001");
    when(bpmTaskFacade.getTask("task-001")).thenReturn(task);
    when(bpmProcessDefService.findByProcessKey("skeleton_approval")).thenReturn(createProcessDef());
    BpmInstance instance = createInstance();
    when(bpmInstanceService.findByProcessInstanceId("pi-task-001")).thenReturn(Optional.of(instance));
    when(bpmTaskFacade.getVariables("pi-task-001")).thenReturn(Map.of("formKey", "leave_form", "amount", 5000));

    // 审批历史：2 条已完成记录
    BpmTaskDTO h1 = new BpmTaskDTO();
    h1.setTaskId("hist-001");
    h1.setName("审批");
    h1.setAssignee("2");
    h1.setCreateTime(new Date(System.currentTimeMillis() - 3600_000));
    h1.setEndTime(new Date());
    BpmTaskDTO h2 = new BpmTaskDTO();
    h2.setTaskId("hist-002");
    h2.setName("提交");
    h2.setAssignee("1");
    h2.setCreateTime(new Date(System.currentTimeMillis() - 7200_000));
    h2.setEndTime(new Date(System.currentTimeMillis() - 3600_000));
    when(bpmTaskFacade.queryHistoryByProcessInstance("pi-task-001")).thenReturn(List.of(h1, h2));

    R<TaskDetailRespDTO> result = controller.detail("task-001");

    assertThat(result.getCode()).isZero();
    TaskDetailRespDTO dto = result.getData();
    assertThat(dto.getTaskName()).isEqualTo("审批");
    assertThat(dto.getProcessName()).isEqualTo("单节点审批");
    assertThat(dto.getInitiatorId()).isEqualTo("1");
    assertThat(dto.getProcessVariables()).containsEntry("formKey", "leave_form");
    assertThat(dto.getApprovalHistory()).hasSize(2);
    assertThat(dto.getApprovalHistory().get(0).getTaskName()).isEqualTo("审批");
    assertThat(dto.getApprovalHistory().get(0).getAssignee()).isEqualTo("2");
    assertThat(dto.getApprovalHistory().get(0).getEndTime()).isNotNull();
    assertThat(dto.getApprovalHistory().get(1).getTaskName()).isEqualTo("提交");
}
```

### 9.6 ProcessedTests — GET /workflow/tasks/processed（3 个用例）

| # | 用例 | Arrange | Assert |
|---|------|---------|--------|
| 1 | **正常已办分页** — 返回 ProcessedTaskRespDTO 含 endTime | `queryProcessedPage` 返回 2 个 task（均含 endTime）；`countProcessed` 返回 2；`getVariable` 返回 formKey；`findByProcessKey` 返回 processDef | `result.getCode() == 0`；`records.size() == 2`；`total == 2`；每条含 `taskName/formKey/processName/createTime/endTime`；`endTime` 不为 null |
| 2 | **空已办列表** | `queryProcessedPage` 返回空列表；`countProcessed` 返回 0 | `result.getCode() == 0`；`records` 为空；`total == 0` |
| 3 | **endTime 可为 null** — 历史记录缺失 endTime（保守兼容） | 返回的 task 中 `endTime=null` | `result.getCode() == 0`；对应条目的 `endTime` 为 null（不抛 NPE） |

### 9.7 测试用例汇总

| 端点 | 用例数 | 覆盖场景 |
|------|:---:|------|
| `GET /todo` | 3 | 正常分页 / 空列表 / processName 空安全 |
| `POST /{taskId}/complete` | 4 | 通过+结束+通知 / 通过+未结束 / 任务不存在 / 越权 |
| `POST /{taskId}/reject` | 4 | 驳回+结束+不发通知 / 驳回+未结束 / 任务不存在 / 越权 |
| `GET /{taskId}` | 4 | 完整详情+审批历史 / 空审批历史 / 任务不存在 / processDef 空安全 |
| `GET /processed` | 3 | 正常分页含 endTime / 空列表 / endTime 空安全 |
| **合计** | **18** | |

### 9.8 全量编译和测试

```bash
# 1. 编译验证
cd Smart-WorkFlow
mvn -q compile
# 预期：BUILD SUCCESS，新增测试文件编译通过，0 错误

# 2. 运行全量测试
mvn -q test 2>&1 | tail -30
# 预期：BUILD SUCCESS，全工程无 FAILED 或 ERROR
# 全量测试计数应 ≥ 154（基线 136 + 新增 18）
```

## 10. 关键实现约束

1. **纯 Mockito 测试**：不装载 Spring 上下文（不用 `@SpringBootTest`、`@AutoConfigureMockMvc`），手动构造 Controller + Mock 依赖。理由：Controller 本质是 POJO 方法调用，Mock 依赖即可完整覆盖逻辑，装载 Spring 上下文会显著拖慢测试
2. **LoginUserHolder.set() 不 Mock Static**：直接 `set(new LoginUser())` 填充 ThreadLocal，`clear()` 清理。这是项目既有模式（`AuthMeControllerTest`），不使用 `MockedStatic`
3. **每次测试后清理 LoginUserHolder**：`@AfterEach tearDown()` 中调用 `LoginUserHolder.clear()`，防止线程池复用导致测试间数据串扰
4. **verifyNoInteractions**：大部分测试不需要 DomainEventPublisher，用 `verify(domainEventPublisher, never()).publish(any())` 或按需使用 `verifyNoInteractions`（仅在 reject 测试中用于确认"驳回不发通知"）
5. **断言使用 AssertJ**：`assertThat(x).isEqualTo(y)` 风格，不使用 JUnit 原生断言或 Hamcrest
6. **测试命名**：方法名用 `snake_case` 描述场景（如 `todo_shouldReturnPageResult`），与既有测试风格一致
7. **文件编码**：UTF-8
8. **无需新建测试配置或 properties**：纯 Mockito 不需要任何 Spring 配置

## 11. 边界情况

| 场景 | 预期行为 |
|------|----------|
| PageParam 使用默认值（pageNum=1, pageSize=10） | offset=0, limit=10 |
| pageNum=2, pageSize=5 | offset=5, limit=5 |
| `getVariable` 返回 null（formKey 未设） | DTO.formKey == null |
| `findByProcessKey` 返回 null | DTO.processName == null |
| `findByProcessInstanceId` 返回 Optional.empty() | initiatorId == null |
| `complete()` 参数为 null（审批通过无变量） | Facade.complete(taskId, null) 被调用 |
| `reject()` 参数含 Map("outcome"→"REJECTED") | Facade.complete(taskId, {outcome: REJECTED}) 被调用 |
| 审批历史为 null | 按方案不会发生（Facade 返回空 list），但如有则 controller NPE（属于 Facade 契约违反，无需防御式编程） |

## 12. 风险和回滚方案

| 风险 | 概率 | 回滚 |
|------|:----:|------|
| 新增测试因环境问题（H2方言/Flowable bean 缺失）导致全量测试失败 | 低 | 本 Step 的测试是纯 Mockito 测试，不涉及数据库或 Flowable 引擎，不会因环境问题失败。若因 import 缺失编译失败，检查 pom.xml 中 `spring-boot-starter-test` 是否在 test scope |
| 测试覆盖了错误路径，但遗漏了 `isProcessActive=true` 的分支 | 中 | 用 `@Nested` 分组后在 IDE 中查看每组的覆盖情况，确保 complete/reject 都有"流程未结束"用例 |
| 全量回归发现其他模块测试退化 | 低 | 若出现退化，应停止 B3、分析退化原因。如果是环境/依赖版本问题，标记 BLOCKED；如果是 B1/B2 改动引起的回归，回溯对应 Step 修复 |

## 13. 测试方案

### 13.1 静态检查

```bash
# 确认测试文件存在且行数合理（预期 300~400 行含注释）
wc -l sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/controller/BpmTodoControllerTest.java

# 确认测试方法数（@Test 注解计数 ≥ 18）
grep -c "@Test" sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/controller/BpmTodoControllerTest.java

# 确认 @Nested 分组数（5 个端点）
grep -c "@Nested" sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/controller/BpmTodoControllerTest.java

# 确认未 import Spring 测试注解（纯 Mockito 测试，不应用 @SpringBootTest）
! grep -q "@SpringBootTest\|@AutoConfigureMockMvc\|@DataJpaTest" \
  sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/controller/BpmTodoControllerTest.java \
  && echo "OK: 纯 Mockito 测试" || echo "FAIL: 不应装载 Spring 上下文"

# 编译验证
cd Smart-WorkFlow && mvn -q compile
```

### 13.2 单元测试

```bash
# 仅运行 BPM process 模块测试
cd Smart-WorkFlow
mvn -q test -pl sw-biz/sw-bpm/sw-bpm-process -am 2>&1 | grep -E "Tests run:|BUILD"
# 预期：Tests run: 19 (18 new + 1 existing GraphValidatorTest), Failures: 0, Errors: 0
```

### 13.3 集成测试

```bash
# 运行全部 BPM 测试（引擎 + 流程）
mvn -q test -pl sw-biz/sw-bpm/sw-bpm-engine,sw-biz/sw-bpm/sw-bpm-process -am 2>&1 | grep -E "Tests run:|BUILD"
# 预期：引擎 7 tests + 流程 19 tests = 26 tests, 0 failures
```

### 13.4 手工验证

无需手工验证（纯单元测试，无 UI 交互路径）。

### 13.5 回归检查

```bash
# 全量测试（全工程）
cd Smart-WorkFlow
mvn -q test 2>&1 | grep -E "Tests run:|BUILD|FAIL"
# 预期：
#   - BUILD SUCCESS
#   - 全工程测试计数 ≥ 154（基线 136 + 新增 18）
#   - 无 FAILED 或 ERROR
#   - 所有 7 模块测试均通过
```

## 14. 验收标准

| 编号 | 条件 | 验证方式 |
|:----:|------|----------|
| B3-1 | `BpmTodoControllerTest.java` 新建，测试方法数 ≥ 18 | `grep -c "@Test"` |
| B3-2 | `@Nested` 分组含 5 个端点（Todo/Complete/Reject/Detail/Processed） | `grep "@Nested"` 计数 ≥ 5 |
| B3-3 | 测试为纯 Mockito（不 import `@SpringBootTest`/`@AutoConfigureMockMvc`/`MockMvc`） | grep 零命中 |
| B3-4 | `GET /todo` 覆盖正常分页 + 空列表 + processName 空安全 | 人工检查代码 ≥ 2 用例 |
| B3-5 | `POST /complete` 覆盖通过+结束+通知 / 通过+未结束(不发通知) / 任务不存在 / 越权 | ≥ 4 用例 |
| B3-6 | `POST /reject` 覆盖驳回+结束+不发通知 / 驳回+未结束 / 任务不存在 / 越权 | ≥ 4 用例 |
| B3-7 | `GET /{taskId}` 覆盖完整详情+审批历史 / 空审批历史 / 任务不存在 / processDef 空安全 | ≥ 4 用例 |
| B3-8 | `GET /processed` 覆盖正常分页含 endTime / 空列表 / endTime 空安全 | ≥ 3 用例 |
| B3-9 | `reject` 测试验证 `complete(taskId, {outcome: REJECTED})` 被调用且 `publish` 未被调用 | 人工检查 reject 用例 |
| B3-10 | `@AfterEach` 中调用 `LoginUserHolder.clear()` | grep 确认 |
| B3-11 | `mvn -q compile` 退出码 0（全工程） | 编译输出 |
| B3-12 | `mvn -q test` 全工程 BUILD SUCCESS，无 FAILED/ERROR | 测试输出 |
| B3-13 | 全量测试计数 ≥ 154（基线 136 + ≥18 新增），即无已有测试被删除 | `grep "Tests run:"` 汇总 |
| B3-14 | 原有 8 个 BPM 测试（引擎 7 + 流程 1）全部通过 | 测试输出中对应行无 FAILED |

## 15. 执行回执格式

按 CLAUDE.md §7.1 标准 13 项结构输出执行回执，写入：

```
product/bpm-task-center/receipts/step-b3-后端Controller测试+全量回归-execution.md
```

## 16. 测试回执格式

本 Step 本身就是测试编写 + 回归运行，执行回执中必须包含完整的测试输出。

## 17. 明确禁止事项

1. ❌ **不要使用 `@SpringBootTest` / `@AutoConfigureMockMvc` / `MockMvc`** — 纯 Mockito 测试，不需要 Spring 上下文
2. ❌ **不要使用 `MockedStatic<LoginUserHolder>`** — 直接用 `LoginUserHolder.set()` / `clear()`（项目既有模式）
3. ❌ **不要修改 `BpmTodoController.java`** — 仅测试，不改源码
4. ❌ **不要创建测试配置类 / application-test.properties** — 不需要
5. ❌ **不要跳过 `isProcessActive=true` 的分支** — complete 和 reject 都必须有"流程未结束"用例
6. ❌ **不要在 complete 测试中 Mock `getVariable`** — complete 不调用 `getVariable`，无需 Mock
7. ❌ **不要在 reject 测试中 verify `domainEventPublisher.publish()`** — 驳回明确不发通知，应确认 publish 未被调用
8. ❌ **不要删除或修改已有 8 个 BPM 测试**（引擎 7 + 流程 1 GraphValidatorTest）
9. ❌ **不要新增 Maven 依赖** — 当前依赖已满足
10. ❌ **不要修改前端代码** — 纯后端 Step
