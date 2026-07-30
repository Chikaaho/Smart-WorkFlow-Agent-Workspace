# Step 2：后端 BpmInstanceController — REST 端点 + DTO

## 1. 当前状态

- **功能**：process-monitoring（M04-F06-01 流程监控首批能力）
- **整体进度**：Step 0 探索 PASSED，Step 1 后端 Facade + Service PASSED（2026-07-28 执行回执审查通过）
- **前置依赖**：
  - `BpmRuntimeFacade.getActiveActivityIds(String): List<String>` — 已就绪（Step 1）
  - `BpmRuntimeFacade.queryHistoricActivities(String): List<BpmActivityDTO>` — 已就绪（Step 1）
  - `BpmInstanceService.pageInstances(PageParam, InstanceFilterDTO): PageResult<BpmInstance>` — 已就绪（Step 1）
  - `BpmInstanceService.findByProcessInstanceId(String): Optional<BpmInstance>` — 已就绪（既有方法）
  - `BpmProcessDefService.findByProcessKey(String): BpmProcessDef` — 已就绪（既有方法，用于 processName 富化）
  - `BpmActivityDTO`（7 字段，@Data）— 已就绪（Step 1，`sw-bpm-api` 层，经 Facade 返回）
  - `InstanceFilterDTO`（3 可选过滤字段，@Data）— 已就绪（Step 1，`sw-bpm-process` 层）
- **本 Step 定位**：在 Step 1 的 Facade/Service 层之上封装 REST 端点，交付可直接被前端调用的 HTTP API。不碰 Flowable、不改 Facade 实现、不改 Service 实现。

## 2. Step 目标

新建 `BpmInstanceController`（`@RestController`），提供两个 REST 端点：**分页实例列表**（`GET /workflow/instances`）和**实例详情含流程图高亮数据 + 流转记录**（`GET /workflow/instances/{processInstanceId}`）。新建 2 个响应 DTO 用于裁剪返回字段。Controller 只做参数转发 + DTO 富化，不包含业务逻辑。

## 3. 推荐模型

推荐模型：deepseek-v4-flash
选择理由：单模块 Controller + DTO 开发，纯参数转发 + 字段富化（processName 补充），无跨模块接口设计、无 Facade 边界变更、无 SQL/事务逻辑。所有底层方法（Facade/Service）已在 Step 1 实现并验证通过。
是否触发升级条件：否

## 4. 模型选择理由

Step 2 的工作是「在已有 Service/Facade 上套一层 REST 壳」：接收 HTTP 参数 → 转发给 Service/Facade → 将返回的实体/DTO 裁剪为响应 DTO。无新增业务逻辑、无 SQL、无跨模块契约变更。Flaw 选择 Flash 足够覆盖。

## 5. 已知上下文

- **BPM 模块三层结构**：`sw-bpm-api`（契约/DTO/Facade 接口）→ `sw-bpm-engine`（Facade 实现，Flowable 封装）→ `sw-bpm-process`（业务 Service/Controller/Entity，本 Step 操作层）
- **Step 1 已交付的 Facade 方法**：
  - `BpmRuntimeFacade.getActiveActivityIds(processInstanceId)` → `List<String>`（活跃节点 activity ID，空列表 = 实例已结束或不存在）
  - `BpmRuntimeFacade.queryHistoricActivities(processInstanceId)` → `List<BpmActivityDTO>`（按 endTime 升序，进行中节点 endTime=null 排末尾）
- **Step 1 已交付的 Service 方法**：
  - `BpmInstanceService.pageInstances(pageParam, filter)` → `PageResult<BpmInstance>`（LambdaQueryWrapper + LIMIT/OFFSET，H2+PG 双通）
- **既有方法**：
  - `BpmInstanceService.findByProcessInstanceId(processInstanceId)` → `Optional<BpmInstance>`
  - `BpmProcessDefService.findByProcessKey(processKey)` → `BpmProcessDef`（含 `getName()` 用于 processName 富化）
- **BpmInstance 实体字段**（`sw_bpm_instance` 表）：id(Long) / processInstanceId / processDefKey / businessKey / formKey / initiatorId(Long) / status(RUNNING/APPROVED/REJECTED)。继承 `BaseEntity`（含 createTime: LocalDateTime、tenantId 等）
- **`InstanceFilterDTO`**：3 个可选字段（status/processDefKey/initiatorId），均为 null 或空字符串时不过滤
- **防腐层约束**：Controller 层**禁止**直接 import `org.flowable.*` 任何类型。所有 Flowable 操作经 Facade 接口（定义在 `sw-bpm-api`，实现在 `sw-bpm-engine`）。本 Step 不新增 Facade 调用——直接使用 Step 1 已交付的方法
- **Controller 模式**：构造器注入（无 `@Autowired` 字段注入），`R<T>` 统一响应包装，`PageResult<T>` 分页结果。参照 `BpmTodoController` / `BpmProcessDefController`
- **Controller 测试模式**：纯 Mockito，hand-rolled mock（`mock(Service.class)` + 构造器注入 controller），不装载 Spring 上下文。参照 `BpmProcessDefControllerTest`（`@Nested` + `@DisplayName` + AssertJ）
- **时间字段**：`BpmInstance.createTime` 已是 `LocalDateTime`（MyBatis-Plus 自动填充），不需要像 Facade 层那样做 `Date → LocalDateTime` 转换
- **项目测试基线**：后端 `mvn test` BUILD SUCCESS，**256 tests / 0 failures**（REPORTED 2026-07-28，process-monitoring Step 1 执行回执）。前端 59 files / 517 tests
- **路由前缀**：BPM 模块统一使用 `/workflow/` 前缀。已有路由：`/workflow/tasks/*`（BpmTodoController）、`/workflow/defs/*`（BpmProcessDefController）。本 Step 使用 `/workflow/instances`

## 6. 执行前必须读取的文件

| # | 文件路径（相对于 `Smart-WorkFlow/`） | 读取目的 |
|---|------|------|
| 1 | `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmTodoController.java` | 参照 Controller 模式：构造器注入、R 包装、PageResult 组装、DTO 富化模式（`toXxxDTO` private 方法）、`LoginUserHolder` 使用 |
| 2 | `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmProcessDefController.java` | 参照 Controller 模式、`@RequestMapping` 路径风格 |
| 3 | `sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/facade/BpmRuntimeFacade.java` | 确认 Facade 方法签名（`getActiveActivityIds` / `queryHistoricActivities`） |
| 4 | `sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/dto/BpmActivityDTO.java` | 确认 DTO 字段（用于 detail 端点返回） |
| 5 | `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/BpmInstanceService.java` | 确认 Service 方法签名（`pageInstances` / `findByProcessInstanceId`） |
| 6 | `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/InstanceFilterDTO.java` | 确认过滤字段 |
| 7 | `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/entity/BpmInstance.java` | 确认实体字段（用于 DTO 裁剪） |
| 8 | `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/BpmProcessDefService.java` | 确认 `findByProcessKey` 方法签名（用于 processName 富化） |
| 9 | `sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/controller/BpmProcessDefControllerTest.java` | 参照测试模式（纯 Mockito + `@Nested` + `@DisplayName` + AssertJ） |
| 10 | `sw-framework/sw-common/src/main/java/com/sw/ck/common/response/R.java` | 确认 R 包装方法（`R.ok()` / `R.ok(data)`） |
| 11 | `sw-framework/sw-common/src/main/java/com/sw/ck/common/page/PageResult.java` | 确认分页结果字段（records / total / pageNum / pageSize） |
| 12 | `sw-framework/sw-common/src/main/java/com/sw/ck/common/exception/CommonErrorCode.java` | 确认 NOT_FOUND 错误码（实例不存在时使用） |

## 7. 允许修改的文件范围

| 文件路径（相对于 `Smart-WorkFlow/`） | 修改类型 | 说明 |
|------|:---:|------|
| `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmInstanceController.java` | **新建** | 流程实例监控 REST 控制器（2 个端点 + DTO 富化方法） |
| `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/InstanceListItemDTO.java` | **新建** | 实例列表项响应 DTO（9 字段：id/processInstanceId/processDefKey/processName/businessKey/formKey/initiatorId/status/createTime，@Data，手写或 Lombok 皆可——sw-bpm-process 有 Lombok） |
| `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/InstanceDetailDTO.java` | **新建** | 实例详情响应 DTO（extends InstanceListItemDTO 字段 + activeNodeIds: List\<String\> + flowTrace: List\<BpmActivityDTO\>，@Data） |
| `sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/controller/BpmInstanceControllerTest.java` | **新建** | Controller 单元测试（纯 Mockito，≥3 @Test：分页列表 / 详情含活跃节点 / 详情不存在抛异常） |

## 8. 禁止修改的范围

- ❌ **禁止**修改 `BpmRuntimeFacade` / `BpmRuntimeFacadeImpl`（Step 1 已交付，不动）
- ❌ **禁止**修改 `BpmInstanceService` / `BpmInstanceServiceImpl`（Step 1 已交付，不动）
- ❌ **禁止**修改 `BpmActivityDTO` / `InstanceFilterDTO`（Step 1 已交付，不动）
- ❌ **禁止**修改 `BpmProcessDefService` / `BpmProcessDefServiceImpl` 及其既有方法
- ❌ **禁止**修改 `BpmTodoController` / `BpmProcessDefController` 及已有端点
- ❌ **禁止**修改数据库表结构 / Flyway 脚本
- ❌ **禁止**修改 `BpmInstance` 实体类
- ❌ **禁止**修改前端 `Smart-WorkFlow-Web/` 任何文件
- ❌ **禁止**在 Controller 中直接 import Flowable 类型（`org.flowable.*`）— 违反防腐层约束
- ❌ **禁止**新增 Maven 依赖
- ❌ **禁止**修改 `pom.xml`
- ❌ **禁止**在 Controller 中写业务逻辑 — 所有逻辑委托给 Facade/Service

## 9. 详细执行方案

### 9.1 新建响应 DTO: `InstanceListItemDTO`

**文件**：`sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/InstanceListItemDTO.java`（新建）

```java
package com.sw.ck.bpm.process.dto;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 流程实例列表项响应 DTO。
 * <p>
 * 从 {@link com.sw.ck.bpm.process.entity.BpmInstance} 裁剪，
 * 仅保留列表展示需要的字段，不返回 tenantId/deleted/version 等内部列。
 * processName 由 Controller 通过 {@code BpmProcessDefService.findByProcessKey()} 富化。
 * </p>
 */
@Data
public class InstanceListItemDTO {

    /** BpmInstance 主键 ID */
    private Long id;

    /** Flowable 流程实例 ID */
    private String processInstanceId;

    /** BPMN 流程定义 key */
    private String processDefKey;

    /** 流程名称（经 BpmProcessDefService 富化，非实体直接字段） */
    private String processName;

    /** 业务键（= 表单 recordId） */
    private String businessKey;

    /** 表单业务标识 */
    private String formKey;

    /** 发起人用户 ID */
    private Long initiatorId;

    /** 实例状态：RUNNING / APPROVED / REJECTED */
    private String status;

    /** 创建时间（发起时间） */
    private LocalDateTime createTime;
}
```

**注意**：
- `sw-bpm-process` 模块有 Lombok 依赖（`BpmInstance` / `InstanceFilterDTO` / `BpmProcessDef` 均使用 `@Data`），用 `@Data` 即可
- `processName` 不是 `BpmInstance` 的直接字段，由 Controller 通过 `BpmProcessDefService.findByProcessKey()` 查 `BpmProcessDef.name` 填入
- `createTime` 是 `LocalDateTime`（继承自 `BaseEntityNoTenant`），无需时区转换

### 9.2 新建响应 DTO: `InstanceDetailDTO`

**文件**：`sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/InstanceDetailDTO.java`（新建）

```java
package com.sw.ck.bpm.process.dto;

import com.sw.ck.bpm.api.dto.BpmActivityDTO;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.util.List;

/**
 * 流程实例详情响应 DTO。
 * <p>
 * 在 {@link InstanceListItemDTO} 字段基础上追加：
 * <ul>
 *   <li>{@code activeNodeIds} — 当前活跃节点 activity ID 列表（用于 bpmn-js 绿色高亮）</li>
 *   <li>{@code flowTrace} — 全部历史活动节点（用于流转时间线展示）</li>
 * </ul>
 * 两个列表均可能为空（已结束的实例 activeNodeIds 为空；刚启动的实例 flowTrace 可能仅含开始事件）。
 * </p>
 */
@Data
@EqualsAndHashCode(callSuper = true)
public class InstanceDetailDTO extends InstanceListItemDTO {

    /** 当前活跃节点 activity ID 列表（用于流程图绿色高亮）。实例已结束时为空列表 */
    private List<String> activeNodeIds;

    /** 全部历史活动节点（含已完成 + 进行中），按结束时间升序。进行中节点 endTime=null 排末尾 */
    private List<BpmActivityDTO> flowTrace;
}
```

**注意**：
- 继承 `InstanceListItemDTO` 复用 9 个字段，避免重复定义
- `flowTrace` 直接复用 Step 1 的 `BpmActivityDTO`（`sw-bpm-api` 层）。Controller 中 import `com.sw.ck.bpm.api.dto.BpmActivityDTO` 是合法的（`sw-bpm-api` 是公开契约层，非 Flowable 内部类型）
- 需要新增 import `com.sw.ck.bpm.api.dto.BpmActivityDTO`

### 9.3 新建 Controller: `BpmInstanceController`

**文件**：`sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmInstanceController.java`（新建）

```java
package com.sw.ck.bpm.process.controller;

import com.sw.ck.bpm.api.dto.BpmActivityDTO;
import com.sw.ck.bpm.api.facade.BpmRuntimeFacade;
import com.sw.ck.bpm.process.dto.InstanceDetailDTO;
import com.sw.ck.bpm.process.dto.InstanceFilterDTO;
import com.sw.ck.bpm.process.dto.InstanceListItemDTO;
import com.sw.ck.bpm.process.entity.BpmInstance;
import com.sw.ck.bpm.process.entity.BpmProcessDef;
import com.sw.ck.bpm.process.service.BpmInstanceService;
import com.sw.ck.bpm.process.service.BpmProcessDefService;
import com.sw.ck.common.exception.BaseException;
import com.sw.ck.common.exception.CommonErrorCode;
import com.sw.ck.common.page.PageParam;
import com.sw.ck.common.page.PageResult;
import com.sw.ck.common.response.R;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

/**
 * 流程实例监控控制器。
 * <p>
 * 提供流程实例的分页列表查询和详情（含流程图高亮数据 + 流转记录）。
 * 所有 Flowable 引擎操作经 {@link BpmRuntimeFacade} 完成，本 Controller 不直接依赖 Flowable 类型。
 * </p>
 *
 * <h3>端点</h3>
 * <ul>
 *   <li>{@code GET /workflow/instances} — 分页实例列表（支持状态/流程定义/发起人过滤）</li>
 *   <li>{@code GET /workflow/instances/{processInstanceId}} — 实例详情（含活跃节点 + 流转记录）</li>
 * </ul>
 *
 * <h3>防腐</h3>
 * 本 Controller 不 import 任何 Flowable 类型；所有引擎操作经 {@link BpmRuntimeFacade} 完成。
 */
@RestController
@RequestMapping("/workflow/instances")
public class BpmInstanceController {

    private static final Logger log = LoggerFactory.getLogger(BpmInstanceController.class);

    private final BpmInstanceService bpmInstanceService;
    private final BpmRuntimeFacade bpmRuntimeFacade;
    private final BpmProcessDefService bpmProcessDefService;

    public BpmInstanceController(BpmInstanceService bpmInstanceService,
                                  BpmRuntimeFacade bpmRuntimeFacade,
                                  BpmProcessDefService bpmProcessDefService) {
        this.bpmInstanceService = bpmInstanceService;
        this.bpmRuntimeFacade = bpmRuntimeFacade;
        this.bpmProcessDefService = bpmProcessDefService;
    }

    /**
     * 分页查询流程实例列表。
     * <p>
     * 支持可选过滤条件：状态（status）、流程定义 key（processDefKey）、发起人 ID（initiatorId）。
     * 所有过滤字段均为可选——不传或传空字符串表示不过滤。
     * 返回列表按创建时间倒序（最新实例在前），每条记录含 processName 富化。
     * 只查当前租户（MyBatis-Plus 拦截器自动注入 tenant_id，Service 层已处理）。
     * </p>
     *
     * @param pageParam 分页参数（pageNum 默认 1，pageSize 默认 10）
     * @param filter    过滤条件（所有字段可选）
     * @return 分页实例列表
     */
    @GetMapping
    public R<PageResult<InstanceListItemDTO>> listInstances(PageParam pageParam,
                                                             InstanceFilterDTO filter) {
        PageResult<BpmInstance> page = bpmInstanceService.pageInstances(pageParam, filter);

        List<InstanceListItemDTO> dtos = page.getRecords().stream()
                .map(this::toListItemDTO)
                .collect(Collectors.toList());

        PageResult<InstanceListItemDTO> result = new PageResult<>();
        result.setRecords(dtos);
        result.setTotal(page.getTotal());
        result.setPageNum(page.getPageNum());
        result.setPageSize(page.getPageSize());

        log.debug("实例列表查询: total={}, pageNum={}, pageSize={}",
                page.getTotal(), pageParam.getPageNum(), pageParam.getPageSize());
        return R.ok(result);
    }

    /**
     * 查询流程实例详情。
     * <p>
     * 返回实例基本信息 + 当前活跃节点列表（流程图绿色高亮用）+
     * 全部历史活动节点（流转时间线用）。
     * 活跃节点和流转记录均可能为空列表（已结束 / 刚启动）。
     * </p>
     *
     * @param processInstanceId Flowable 流程实例 ID
     * @return 实例详情（含活跃节点 + 流转记录）
     * @throws BaseException 实例不存在时抛出（code=404）
     */
    @GetMapping("/{processInstanceId}")
    public R<InstanceDetailDTO> instanceDetail(@PathVariable String processInstanceId) {
        BpmInstance instance = bpmInstanceService.findByProcessInstanceId(processInstanceId)
                .orElseThrow(() -> new BaseException(
                        CommonErrorCode.NOT_FOUND.getCode(), "流程实例不存在"));

        List<String> activeNodeIds = bpmRuntimeFacade.getActiveActivityIds(processInstanceId);
        List<BpmActivityDTO> flowTrace = bpmRuntimeFacade.queryHistoricActivities(processInstanceId);

        InstanceDetailDTO dto = toDetailDTO(instance, activeNodeIds, flowTrace);

        log.debug("实例详情查询: processInstanceId={}, activeNodes={}, flowTraceSize={}",
                processInstanceId, activeNodeIds.size(), flowTrace.size());
        return R.ok(dto);
    }

    // ==================== 内部方法 ====================

    /**
     * 将 BpmInstance 实体裁剪为列表项 DTO，并富化 processName。
     * <p>
     * processName 通过 processDefKey 查 BpmProcessDefService 获取。
     * 若流程定义已删除导致查不到，processName 置为 null（不阻断列表查询）。
     * </p>
     */
    private InstanceListItemDTO toListItemDTO(BpmInstance entity) {
        InstanceListItemDTO dto = new InstanceListItemDTO();
        dto.setId(entity.getId());
        dto.setProcessInstanceId(entity.getProcessInstanceId());
        dto.setProcessDefKey(entity.getProcessDefKey());
        dto.setBusinessKey(entity.getBusinessKey());
        dto.setFormKey(entity.getFormKey());
        dto.setInitiatorId(entity.getInitiatorId());
        dto.setStatus(entity.getStatus());
        dto.setCreateTime(entity.getCreateTime());

        // processName 富化
        if (entity.getProcessDefKey() != null) {
            BpmProcessDef processDef = bpmProcessDefService.findByProcessKey(entity.getProcessDefKey());
            if (processDef != null) {
                dto.setProcessName(processDef.getName());
            }
        }

        return dto;
    }

    /**
     * 构建实例详情 DTO。
     * <p>
     * 继承 {@link #toListItemDTO(BpmInstance)} 的字段裁剪 + processName 富化，
     * 再追加 activeNodeIds 和 flowTrace。
     * </p>
     */
    private InstanceDetailDTO toDetailDTO(BpmInstance instance,
                                           List<String> activeNodeIds,
                                           List<BpmActivityDTO> flowTrace) {
        InstanceDetailDTO dto = new InstanceDetailDTO();
        // 继承 InstanceListItemDTO 的字段
        dto.setId(instance.getId());
        dto.setProcessInstanceId(instance.getProcessInstanceId());
        dto.setProcessDefKey(instance.getProcessDefKey());
        dto.setBusinessKey(instance.getBusinessKey());
        dto.setFormKey(instance.getFormKey());
        dto.setInitiatorId(instance.getInitiatorId());
        dto.setStatus(instance.getStatus());
        dto.setCreateTime(instance.getCreateTime());

        // processName 富化
        if (instance.getProcessDefKey() != null) {
            BpmProcessDef processDef = bpmProcessDefService.findByProcessKey(instance.getProcessDefKey());
            if (processDef != null) {
                dto.setProcessName(processDef.getName());
            }
        }

        // 监控特有字段
        dto.setActiveNodeIds(activeNodeIds);
        dto.setFlowTrace(flowTrace);

        return dto;
    }
}
```

**注意**：
- 构造器注入（三个依赖：`BpmInstanceService` + `BpmRuntimeFacade` + `BpmProcessDefService`），不使用 `@Autowired` 字段注入。与 `BpmTodoController` / `BpmProcessDefController` 风格一致
- **防腐层合规**：Controller 中 import 的 Flowable 无关类型：`BpmActivityDTO` 来自 `sw-bpm-api`（公开契约层），`BpmRuntimeFacade` 来自 `sw-bpm-api`（Facade 接口），均非 `org.flowable.*`。Service 实现层（`BpmRuntimeFacadeImpl`）才在 `sw-bpm-engine` 内部使用 Flowable 类型——Controller 不知道、也不应该知道
- **`listInstances` 的 filter 参数**：Spring MVC 自动将 query string 绑定到 `InstanceFilterDTO`（`?status=RUNNING&processDefKey=leave&initiatorId=1`）。所有字段可选，不传不过滤。因 `InstanceFilterDTO` 使用 `@Data`，Spring 通过 setter 绑定
- **`instanceDetail` 异常处理**：实例不存在时抛 `BaseException(404, "流程实例不存在")`。使用 `CommonErrorCode.NOT_FOUND`（code=404），与 `BpmTodoController.detail()` 模式一致。不使用 BpmErrorCode（BpmErrorCode 枚举无"实例不存在"错误码，也不需要新增——404 语义已够用）
- **`activeNodeIds` / `flowTrace` 空列表**：Facade 层保证返回空列表而非 null（Step 1 §10 约束），Controller 不判空
- **`processName` 可能为 null**：若流程定义已被删除，`findByProcessKey` 返回 null → processName 为 null。列表和详情端点不因此阻断
- **两个 DTO 的字段重复**：`toDetailDTO` 没有复用 `toListItemDTO` 方法调用（而是直接 set 8 个字段），原因是需要返回 `InstanceDetailDTO` 类型而非 `InstanceListItemDTO`。这是有意为之的简单重复——避免 `BeanUtils.copyProperties` 引入反射，也避免创建中间对象
- **不需要 `LoginUserHolder`**：本 Step 的两个端点不按当前用户过滤（实例列表显示当前租户所有实例——列表端点）/ 详情按 processInstanceId 精确匹配（详情端点）。租户隔离由 MyBatis-Plus 拦截器在 Service 层自动处理

### 9.4 新建 Controller 测试: `BpmInstanceControllerTest`

**文件**：`sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/controller/BpmInstanceControllerTest.java`（新建）

测试策略：纯 Mockito（与 `BpmProcessDefControllerTest` 一致），hand-rolled mock，不装载 Spring 上下文。使用 `@Nested` + `@DisplayName` + AssertJ。

```java
package com.sw.ck.bpm.process.controller;

import com.sw.ck.bpm.api.facade.BpmRuntimeFacade;
import com.sw.ck.bpm.process.dto.InstanceFilterDTO;
import com.sw.ck.bpm.process.dto.InstanceDetailDTO;
import com.sw.ck.bpm.process.dto.InstanceListItemDTO;
import com.sw.ck.bpm.process.entity.BpmInstance;
import com.sw.ck.bpm.process.entity.BpmProcessDef;
import com.sw.ck.bpm.process.service.BpmInstanceService;
import com.sw.ck.bpm.process.service.BpmProcessDefService;
import com.sw.ck.common.exception.BaseException;
import com.sw.ck.common.page.PageParam;
import com.sw.ck.common.page.PageResult;
import com.sw.ck.common.response.R;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@DisplayName("BpmInstanceController 单元测试")
class BpmInstanceControllerTest {

    private final BpmInstanceService bpmInstanceService = mock(BpmInstanceService.class);
    private final BpmRuntimeFacade bpmRuntimeFacade = mock(BpmRuntimeFacade.class);
    private final BpmProcessDefService bpmProcessDefService = mock(BpmProcessDefService.class);

    private final BpmInstanceController controller = new BpmInstanceController(
            bpmInstanceService, bpmRuntimeFacade, bpmProcessDefService);

    // 测试夹具
    private BpmInstance sampleInstance;
    private BpmProcessDef sampleProcessDef;

    @BeforeEach
    void setUp() {
        sampleInstance = new BpmInstance();
        sampleInstance.setId(1L);
        sampleInstance.setProcessInstanceId("proc-001");
        sampleInstance.setProcessDefKey("leave");
        sampleInstance.setBusinessKey("rec-123");
        sampleInstance.setFormKey("leave_form");
        sampleInstance.setInitiatorId(100L);
        sampleInstance.setStatus("RUNNING");
        sampleInstance.setCreateTime(LocalDateTime.of(2026, 7, 1, 10, 0));

        sampleProcessDef = new BpmProcessDef();
        sampleProcessDef.setProcessKey("leave");
        sampleProcessDef.setName("请假流程");
    }

    // ==================== GET /workflow/instances ====================

    @Nested
    @DisplayName("GET /workflow/instances — 分页实例列表")
    class ListInstancesTests {

        @Test
        @DisplayName("无过滤 → 返回全量分页结果，含 processName 富化")
        void listInstances_noFilter_shouldReturnAll() {
            PageResult<BpmInstance> page = new PageResult<>();
            page.setRecords(List.of(sampleInstance));
            page.setTotal(1);
            page.setPageNum(1);
            page.setPageSize(10);

            when(bpmInstanceService.pageInstances(any(PageParam.class), isNull()))
                    .thenReturn(page);
            when(bpmProcessDefService.findByProcessKey("leave"))
                    .thenReturn(sampleProcessDef);

            R<PageResult<InstanceListItemDTO>> result = controller.listInstances(
                    new PageParam(), null);

            assertThat(result.getCode()).isZero();
            assertThat(result.getData()).isNotNull();
            assertThat(result.getData().getTotal()).isEqualTo(1);
            assertThat(result.getData().getRecords()).hasSize(1);

            InstanceListItemDTO dto = result.getData().getRecords().get(0);
            assertThat(dto.getId()).isEqualTo(1L);
            assertThat(dto.getProcessInstanceId()).isEqualTo("proc-001");
            assertThat(dto.getProcessName()).isEqualTo("请假流程");
            assertThat(dto.getStatus()).isEqualTo("RUNNING");
            assertThat(dto.getCreateTime()).isNotNull();
        }

        @Test
        @DisplayName("按 status 过滤 → 传递给 Service，返回过滤后结果")
        void listInstances_filterByStatus_shouldPassFilter() {
            InstanceFilterDTO filter = new InstanceFilterDTO();
            filter.setStatus("RUNNING");

            PageResult<BpmInstance> page = new PageResult<>();
            page.setRecords(List.of(sampleInstance));
            page.setTotal(1);
            page.setPageNum(1);
            page.setPageSize(10);

            when(bpmInstanceService.pageInstances(any(PageParam.class), eq(filter)))
                    .thenReturn(page);
            when(bpmProcessDefService.findByProcessKey("leave"))
                    .thenReturn(sampleProcessDef);

            R<PageResult<InstanceListItemDTO>> result = controller.listInstances(
                    new PageParam(), filter);

            assertThat(result.getCode()).isZero();
            assertThat(result.getData().getTotal()).isEqualTo(1);
            verify(bpmInstanceService).pageInstances(any(PageParam.class), eq(filter));
        }

        @Test
        @DisplayName("流程定义已删除 → processName 为 null，不阻断列表")
        void listInstances_processDefDeleted_shouldReturnNullProcessName() {
            PageResult<BpmInstance> page = new PageResult<>();
            page.setRecords(List.of(sampleInstance));
            page.setTotal(1);
            page.setPageNum(1);
            page.setPageSize(10);

            when(bpmInstanceService.pageInstances(any(PageParam.class), isNull()))
                    .thenReturn(page);
            when(bpmProcessDefService.findByProcessKey("leave"))
                    .thenReturn(null);  // 流程定义已删除

            R<PageResult<InstanceListItemDTO>> result = controller.listInstances(
                    new PageParam(), null);

            assertThat(result.getCode()).isZero();
            InstanceListItemDTO dto = result.getData().getRecords().get(0);
            assertThat(dto.getProcessName()).isNull();  // 不阻断
        }
    }

    // ==================== GET /workflow/instances/{processInstanceId} ====================

    @Nested
    @DisplayName("GET /workflow/instances/{processInstanceId} — 实例详情")
    class InstanceDetailTests {

        @Test
        @DisplayName("实例存在且运行中 → 返回活跃节点 + 流转记录")
        void instanceDetail_running_shouldReturnActiveNodesAndFlowTrace() {
            when(bpmInstanceService.findByProcessInstanceId("proc-001"))
                    .thenReturn(Optional.of(sampleInstance));
            when(bpmRuntimeFacade.getActiveActivityIds("proc-001"))
                    .thenReturn(List.of("Activity_001"));
            when(bpmRuntimeFacade.queryHistoricActivities("proc-001"))
                    .thenReturn(List.of());
            when(bpmProcessDefService.findByProcessKey("leave"))
                    .thenReturn(sampleProcessDef);

            R<InstanceDetailDTO> result = controller.instanceDetail("proc-001");

            assertThat(result.getCode()).isZero();
            InstanceDetailDTO dto = result.getData();
            assertThat(dto.getProcessInstanceId()).isEqualTo("proc-001");
            assertThat(dto.getProcessName()).isEqualTo("请假流程");
            assertThat(dto.getActiveNodeIds()).containsExactly("Activity_001");
            assertThat(dto.getFlowTrace()).isEmpty();
        }

        @Test
        @DisplayName("实例不存在 → 抛 BaseException code=404")
        void instanceDetail_notFound_shouldThrow404() {
            when(bpmInstanceService.findByProcessInstanceId("nonexistent"))
                    .thenReturn(Optional.empty());

            assertThatThrownBy(() -> controller.instanceDetail("nonexistent"))
                    .isInstanceOf(BaseException.class)
                    .satisfies(e -> {
                        BaseException be = (BaseException) e;
                        assertThat(be.getCode()).isEqualTo(404);
                        assertThat(be.getMessage()).contains("不存在");
                    });

            // 验证未调用 Facade（短路在 Service 层）
            verify(bpmRuntimeFacade, never()).getActiveActivityIds(any());
            verify(bpmRuntimeFacade, never()).queryHistoricActivities(any());
        }

        @Test
        @DisplayName("已结束实例 → activeNodeIds 空列表，flowTrace 含完整历史")
        void instanceDetail_completed_shouldReturnEmptyActiveNodes() {
            sampleInstance.setStatus("APPROVED");
            when(bpmInstanceService.findByProcessInstanceId("proc-002"))
                    .thenReturn(Optional.of(sampleInstance));
            when(bpmRuntimeFacade.getActiveActivityIds("proc-002"))
                    .thenReturn(List.of());  // 已结束，无活跃节点
            when(bpmRuntimeFacade.queryHistoricActivities("proc-002"))
                    .thenReturn(List.of(new com.sw.ck.bpm.api.dto.BpmActivityDTO()));  // 简化表示
            when(bpmProcessDefService.findByProcessKey("leave"))
                    .thenReturn(sampleProcessDef);

            R<InstanceDetailDTO> result = controller.instanceDetail("proc-002");

            assertThat(result.getCode()).isZero();
            assertThat(result.getData().getActiveNodeIds()).isEmpty();
            assertThat(result.getData().getFlowTrace()).hasSize(1);
        }
    }
}
```

**注意**：
- `BpmActivityDTO` 在测试中使用 `new BpmActivityDTO()` 空对象（或用 mock），不建议真设 7 个字段——只测 Controller 转发行为，不测 Facade 返回内容
- 用 `mock(BpmInstanceService.class)` 而非 `mock(BaseServiceImpl.class)` — Controller 依赖的是接口
- `verify(bpmRuntimeFacade, never()).getActiveActivityIds(any())` 确认实例不存在时短路在 Service 层，不会误调 Facade
- 断言使用 AssertJ（`assertThat(...)`），与 `BpmProcessDefControllerTest` 一致

### 9.5 校验门

```bash
mvn -q compile          # 编译验证（确认 Controller + DTO 编译通过）
mvn -q test             # 运行全量测试（含新增 Controller 测试）
```

**预期结果**：
- `mvn -q compile` 零错误（仅新增 4 个文件：Controller + 2 DTOs + 测试）
- `mvn -q test` BUILD SUCCESS，新增 ≥3 @Test（`BpmInstanceControllerTest`），已有 256 tests 不退化
- 项目测试基线：256 → 259+ tests

## 10. 关键实现约束

1. **防腐层红线**：Controller 不 import `org.flowable.*` 任何类。所有 Flowable 交互经 `BpmRuntimeFacade` 接口
2. **构造器注入**：不使用 `@Autowired` 字段注入。与 `BpmTodoController` / `BpmProcessDefController` 风格一致
3. **DTO 使用 Lombok @Data**：`sw-bpm-process` 模块有 Lombok（`BpmInstance`、`InstanceFilterDTO` 均用 `@Data`）。不手写 getter/setter
4. **`InstanceDetailDTO` 继承 `InstanceListItemDTO`**：复用 9 个基础字段，仅追加 `activeNodeIds` + `flowTrace`
5. **端点路径**：`/workflow/instances`（列表）+ `/workflow/instances/{processInstanceId}`（详情）。`processInstanceId` 是 Flowable 的 String 类型 ID（如 `"a1b2c3d4-..."`），不是 `BpmInstance.id`（Long）
6. **分页列表不按当前用户过滤**：实例列表显示当前租户的全部实例（租户隔离由 MyBatis-Plus 拦截器在 Service 层自动注入）。若后续需要"我发起的"过滤，前端传 `initiatorId` 参数即可
7. **详情端点不返回 `BpmInstance.id`**（Long 主键，内部使用，无前端价值），但保留用于后续可能的操作（如"跳转表单详情"需要 `businessKey`）。实际上 `id` 仍在 `InstanceListItemDTO` 中（列表展示可能需要），但如果觉得不应暴露，可在 DTO 中去掉——当前方案保留，与 `BpmTodoController` 不屏蔽内部 id 的口径一致
8. **processName 为 null 不阻断**：流程定义被删除后，列表/详情仍正常返回，仅 `processName` 字段为 null
9. **不改已有方法签名**：所有 Step 1 的 Facade/Service 方法保持不变
10. **零新增 Maven 依赖**：所有需要的类（`R`、`PageResult`、`BaseException`、`CommonErrorCode`）已在现有依赖中

## 11. 边界情况

| 场景 | 处理方式 |
|------|------|
| **filter 所有字段为 null** | 等价于全量分页（Service 层 `pageInstances` 中 filter=null 不过滤） |
| **filter 字段为空字符串** | Service 层 `isBlank()` 检查，空字符串 = 不过滤（Step 1 已实现） |
| **processInstanceId 对应的实例不存在** | 抛 `BaseException(404, "流程实例不存在")` |
| **已结束的实例** | `activeNodeIds` 返回空列表，`flowTrace` 返回完整历史 |
| **刚启动的实例（无历史活动）** | `activeNodeIds` 返回活跃节点，`flowTrace` 返回空列表或仅含 startEvent |
| **processDefKey 对应的流程定义已删除** | `processName` 置为 null，列表/详情不阻断 |
| **分页参数越界（pageNum 超过最大页数）** | Service 层返回空 `records`，`total` 仍为实际总数 |
| **Spring 自动绑定 filter** | `InstanceFilterDTO` 的字段通过 query string setter 绑定。Spring 对不传的 query param 不调用 setter（字段保持 null） |
| **并发** | 无特殊并发要求（只读查询，Service 层无锁） |

## 12. 风险和回滚方案

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|:---:|------|------|
| Controller 编译失败（import 路径错误） | 低 | 低 | `mvn -q compile` 立即暴露，修正 FQCN 即可 |
| `InstanceDetailDTO` 序列化循环引用 | 极低 | 中 | DTO 字段均为简单类型 + `List<BpmActivityDTO>`（单向引用），无反向引用。Jackson 默认不处理循环引用，但此场景不存在 |
| `BpmActivityDTO` 的 `@Data` 导致 Jackson 序列化问题 | 极低 | 低 | `BpmActivityDTO` 已在 Step 1 编译通过（`sw-bpm-api` 模块），Jackson 序列化 `@Data` POJO 是标准行为 |

**回滚方案**：`git checkout --` 还原所有新建文件。Controller 和 DTO 均独立新增，不耦合已有代码。

**回滚验证**：`mvn -q compile && mvn -q test` BUILD SUCCESS，已有测试计数 256 不减少。

## 13. 测试方案

### 13.1 静态检查

| 检查项 | 命令 | 预期结果 |
|------|------|------|
| 编译验证 | `mvn -q compile` | 零错误（仅新增 4 个文件） |
| Controller 中无 Flowable import | `grep "org\.flowable" sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmInstanceController.java` | 零命中 |
| DTO 文件存在 | `ls sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/InstanceListItemDTO.java sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/InstanceDetailDTO.java` | 两个文件均存在 |
| Controller 使用构造器注入 | `grep "public BpmInstanceController" sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmInstanceController.java` | 匹配构造器签名（非 `@Autowired` 字段） |
| 全量测试 | `mvn -q test` | BUILD SUCCESS，无失败/错误 |

### 13.2 单元测试

#### BpmInstanceControllerTest（新建）

| # | 测试用例 | 覆盖场景 |
|---|------|------|
| 1 | `listInstances` 无过滤返回全量 | 全量分页 + processName 富化 + DTO 字段验证 |
| 2 | `listInstances` 按 status 过滤 | filter 非 null 传递给 Service |
| 3 | `listInstances` 流程定义已删除 | processName=null 不阻断列表 |
| 4 | `instanceDetail` 实例运行中 | 返回活跃节点 + 流转记录 + processName |
| 5 | `instanceDetail` 实例不存在 | 抛 BaseException(404)，Facade 未被调用 |
| 6 | `instanceDetail` 已结束实例 | activeNodeIds 空 + flowTrace 有数据 |

**测试策略**：
- 纯 Mockito + hand-rolled mock（`mock(Service.class)` + 构造器注入 controller）
- 不装载 Spring 上下文（与 `BpmProcessDefControllerTest` 一致）
- Mock `BpmInstanceService` / `BpmRuntimeFacade` / `BpmProcessDefService`
- 使用 `@Nested` + `@DisplayName` 组织测试（与 `BpmProcessDefControllerTest` 一致）
- 断言使用 AssertJ（`assertThat(...)`）
- 测试数据使用简单的 POJO 构造（`new BpmInstance()` + setter），不建 Builder

### 13.3 集成测试

本 Step 不涉及数据库 schema 变更或复杂跨模块交互。如有需要，可在 Step 3（前端）开发时通过前端 → 后端联调进行端到端验证。后端侧的集成验证依赖真实 Flowable 引擎 + BPMN 部署，放入 Step 3 整体联调阶段更合适。

### 13.4 手工验证

无需手工验证——纯 REST 端点，自动化单元测试 + 编译验证全覆盖。端点实际返回的 JSON 形状验证在 Step 3（前端对接）时通过浏览器 Network 面板或 curl 进行。

### 13.5 回归检查

| 检查项 | 预期结果 |
|------|------|
| 已有测试通过数不减少 | `mvn test` 全部已有 256 tests 仍通过 |
| `BpmTodoController` 不受影响 | 已有端点路径不冲突（`/workflow/tasks` vs `/workflow/instances`） |
| `BpmProcessDefController` 不受影响 | 已有端点不变 |
| 模块编译通过 | `mvn -q compile` 跨模块零错误 |

## 14. 验收标准

| # | 验收标准 | 验证方式 |
|---|------|------|
| 1 | `BpmInstanceController` 存在，`@RestController` + `@RequestMapping("/workflow/instances")` | grep 类定义 |
| 2 | `GET /workflow/instances` 端点存在，接受 `PageParam` + `InstanceFilterDTO` 参数 | grep `listInstances` 方法签名 |
| 3 | `GET /workflow/instances/{processInstanceId}` 端点存在 | grep `instanceDetail` 方法签名 |
| 4 | `InstanceListItemDTO` 包含 9 个字段（id/processInstanceId/processDefKey/processName/businessKey/formKey/initiatorId/status/createTime） | grep 类定义 + 字段 |
| 5 | `InstanceDetailDTO` 继承 `InstanceListItemDTO`，追加 `activeNodeIds` + `flowTrace` | grep 类定义 + 字段 |
| 6 | Controller 构造器注入 `BpmInstanceService` + `BpmRuntimeFacade` + `BpmProcessDefService` | grep 构造器签名 |
| 7 | Controller 中无 `org.flowable` import | `grep "org\.flowable" BpmInstanceController.java` 零命中 |
| 8 | 实例不存在时抛 `BaseException`（code=404） | 测试用例验证 |
| 9 | `mvn -q compile` 零错误 | 命令输出 |
| 10 | `mvn -q test` BUILD SUCCESS，新增 ≥3 @Test，已有 256 tests 不退化 | 命令输出 + 测试计数 |
| 11 | `processName` 为 null 时不阻断列表/详情（流程定义已删除场景） | 测试用例验证 |
| 12 | 路由 `/workflow/instances` 不与已有 `/workflow/tasks` / `/workflow/defs` 冲突 | Spring 启动无路由冲突错误（或 grep 确认路径前缀不重叠） |
| 13 | 不修改 `pom.xml` / Flyway / 数据库 schema | `git diff --stat` 不含对应文件 |
| 14 | DTO 文件位于 `sw-bpm-process/dto/` 包，不放在 `sw-bpm-api` | `ls` 确认路径 |

## 15. 执行回执格式

按 system.md §7.1 标准 13 项结构产出执行回执，写入 `Smart-WorkFlow/product/process-monitoring/receipts/step-2-execution.md`。

特别注意回执中需包含：
- 新建文件清单（Controller + 2 DTOs + 测试）
- `mvn -q test` 的完整测试计数（增加数 + 总计数，标明基线 256→?）
- `grep "org.flowable" BpmInstanceController.java` 零命中确认
- 构造器注入 grep 命中确认
- 路由不冲突的确认

## 16. 测试回执格式

按 system.md §7.2 标准 12 项结构产出测试回执，写入 `Smart-WorkFlow/product/process-monitoring/receipts/step-2-test.md`。

特别注意回执中需包含：
- 逐条对照 §14 验收标准
- `BpmInstanceControllerTest` 各 @Test 的输出摘要（每个测试方法的通过/失败状态）
- 全量 `mvn test` 测试计数确认（256 + 新增测试数）

## 17. 明确禁止事项

- ❌ **禁止**修改 `BpmRuntimeFacade` / `BpmRuntimeFacadeImpl`（Step 1 产物，不动）
- ❌ **禁止**修改 `BpmInstanceService` / `BpmInstanceServiceImpl`（Step 1 产物，不动）
- ❌ **禁止**修改 `BpmActivityDTO` / `InstanceFilterDTO`（Step 1 产物，不动）
- ❌ **禁止**在 Controller 中 import Flowable 类型（`org.flowable.*`）— 违反防腐层约束
- ❌ **禁止**在 Controller 中写业务逻辑 — 只做参数转发 + DTO 裁剪 + processName 富化
- ❌ **禁止**使用 `@Autowired` 字段注入 — 必须用构造器注入
- ❌ **禁止**新增 Maven 依赖或修改 `pom.xml`
- ❌ **禁止**修改数据库表结构（Flyway / DDL / entity 字段）
- ❌ **禁止**修改前端任何文件
- ❌ **禁止**新增超过 2 个 DTO 文件（`InstanceListItemDTO` + `InstanceDetailDTO` 已足够）
- ❌ **禁止**在测试中装载 Spring 上下文（纯 Mockito，与 `BpmProcessDefControllerTest` 一致）
