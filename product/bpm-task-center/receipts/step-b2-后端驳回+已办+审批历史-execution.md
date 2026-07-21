# 执行回执

## 1. Step 编号和名称

B2 — 后端：驳回端点 + 已办列表 + 审批历史

## 2. 使用模型

deepseek-v4-flash

## 3. 实际读取的文件

1. `product/bpm-task-center/ready/step-b2-后端驳回+已办+审批历史.md` — 方案
2. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmTodoController.java` — 当前完整代码（B1 产物）
3. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/facade/BpmTaskFacadeImpl.java` — 当前实现（B1 产物）
4. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/facade/BpmTaskFacade.java` — 当前接口（B1 产物）
5. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/dto/BpmTaskDTO.java` — 现有 DTO
6. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/TaskDetailRespDTO.java` — 详情 DTO（B1 产物）
7. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/entity/InstanceStatusEnum.java` — 状态枚举
8. `Smart-WorkFlow/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/BpmInstanceService.java` — 实例 Service 接口

## 4. 实际修改的文件

### 修改

| # | 文件 | 改动摘要 |
|---|------|----------|
| 1 | `sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/dto/BpmTaskDTO.java` | +1 字段 `endTime`（Date，可为 null） |
| 2 | `sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/facade/BpmTaskFacade.java` | +3 方法签名：`queryProcessedPage`、`countProcessed`、`queryHistoryByProcessInstance` |
| 3 | `sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/facade/BpmTaskFacadeImpl.java` | 注入 `HistoryService`；+3 方法实现 + `toDtoFromHistory` + `getProcessDefinitionKeyFromId`；重构 `getProcessDefinitionKey` 委托 |
| 4 | `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmTodoController.java` | +2 端点（`reject`、`processed`）；+1 内部方法（`toProcessedTaskDTO`）；`detail()` 追加审批历史 |
| 5 | `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/TaskDetailRespDTO.java` | +1 字段 `approvalHistory`（`List<ApprovalHistoryItemDTO>`） |

### 新建

| # | 文件 | 说明 |
|---|------|------|
| 1 | `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/ProcessedTaskRespDTO.java` | 8 字段已办任务 DTO |
| 2 | `sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/dto/ApprovalHistoryItemDTO.java` | 5 字段审批历史条目 DTO |

## 5. 每个文件的修改摘要

- **BpmTaskDTO.java**: +1 行 `private Date endTime`（L42），向后兼容（null）
- **BpmTaskFacade.java**: +3 Javadoc + 方法签名（L106-131）
- **BpmTaskFacadeImpl.java**: import 替换 `HistoryService` + `HistoricTaskInstance`（L5,9）；+1 字段 + 构造函数参数（L32,35）；+3 方法实现（L98-139）；`getProcessDefinitionKey` 重构为委托（L218-232）；+`toDtoFromHistory` + `getProcessDefinitionKeyFromId`（L234-252）
- **BpmTodoController.java**: +import 3 行；+`reject()` 端点 36 行（@PostMapping(L212)）；+`processed()` 端点 28 行（@GetMapping(L327)）；+`toProcessedTaskDTO()` 32 行（L389-420）；detail() 追加审批历史约 20 行
- **TaskDetailRespDTO.java**: +1 import `List`；+1 字段 `approvalHistory`

## 6. 实际执行的命令

```bash
mvn -q compile
mvn test
```

## 7. 命令输出摘要

- `mvn -q compile`: exit 0（首次失败因 `HistoricTaskInstance` import 包名错误 → 修正为 `org.flowable.task.api.history` 后通过）
- `mvn test`: Tests run: 7 engine + 1 process = **8 tests, 0 failures, exit 0**，无回归

## 8. 与原方案的偏差

**修正 1 处**：方案中 `HistoricTaskInstance` import 路径为 `org.flowable.engine.history`，实际 Flowable 版本中为 `org.flowable.task.api.history.HistoricTaskInstance`。编译时报错后修正，其余完全按方案执行。

## 9. 遇到的问题

| 问题 | 解决 |
|------|------|
| `HistoricTaskInstance` 编译错误，包名 `org.flowable.engine.history` 不存在 | 查阅验证后修正为 `org.flowable.task.api.history.HistoricTaskInstance` |

## 10. 未完成内容

无。所有方案要求均已实现。

## 11. 风险和注意事项

- `HistoricTaskInstance` 的 `getProcessDefinitionId()` 返回完整的 deploymentId 版本号格式（`key:version`），`getProcessDefinitionKeyFromId` 通过 `RepositoryService` 反查 key，行为正确
- 已办查询依赖 Flowable `historyLevel` 配置，默认 `audit` 级别满足需求；若为 `none` 则已办/审批历史均为空
- `BpmTaskDTO.endTime` 在待办任务中为 null，不影响已有逻辑

## 12. Git diff 摘要

（未提交，改动文件数：7，新建 2，修改 5）

## 13. 建议执行的测试

1. `POST /workflow/tasks/{taskId}/reject` — 正常驳回、越权驳回、已完成任务驳回
2. `GET /workflow/tasks/processed` — 分页已办查询、空列表
3. `GET /workflow/tasks/{taskId}` — 确认 detail 含 approvalHistory
4. 回归：`GET /workflow/tasks/todo` + `POST complete` 行为不变
