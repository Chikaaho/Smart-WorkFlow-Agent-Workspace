# G3b/A5 索引：同办理时间分页的确定性排序

日期：2026-09-06；Executor。依据提示07 §2 G3b A5 / 审查07 §2。

## 实现修复（唯一次键）

- `BpmTaskFacadeImpl.queryProcessedPage`：`orderByHistoricTaskInstanceEndTime().desc()` 后追加 `.orderByTaskId().desc()`（映射引擎历史表唯一 ID_ 列；同 endTime 记录按唯一 taskId 全序）。
- `ApprovalActionServiceImpl.pageByActor`：`orderByDesc(createTime)` 后追加 `orderByDesc(taskId)`。
- `BpmMyProcessedController` 默认合并排序：`handleTime` 比较器追加 `thenComparing(taskId)` 后整体 reversed——同办理时间条目按唯一 taskId 全序。

已锁的 deleteReason 过滤 / 正反对象场景（L23）未重做。

## 同时间跨页测试（真实引擎历史 + 真实 ACTION 记录）

`MyProcessedRealSourceTest.sameHandleTime_deterministicOrderAcrossPages`（src/MyProcessedRealSourceTest.java）：

- 兼容来源：新用户 u3 经真实引擎直接完成两个任务（真实 finished 历史），经引擎自身数据源将两条 `END_TIME_` 归一为同一值（真实数据源内的时间归一，非 mock、非先删再查）；`queryProcessedPage` 以 pageSize=1 强制跨页：
  - 两页集合恰为两条对象（不漏不重）、total=2 精确；
  - 页序与唯一 taskId 次键 desc 全序一致；
  - 连续两轮完整读取顺序逐一相同（稳定）。
- 默认合并：新用户 u4 经真实审批核心完成两个任务（真实 ACTION 记录 + 引擎历史），将两条记录 `create_time`（=handleTime）归一为同一值；控制器默认合并分页 pageSize=1 跨页：
  - total 精确=2（ACTION 权威去重后）、跨页不重不漏；
  - 同 handleTime 按唯一 taskId 次键全序；
  - 两轮读取顺序稳定。

原始报告 `surefire/com.sw.ck.bootstrap.p4overlap.MyProcessedRealSourceTest.txt`（Tests run: 4, Failures: 0, Errors: 0——原三用例 + 新用例，已锁过滤断言未回退）。

## 边界

- 不截断数据、不以数据增长换取稳定（时间归一只作用于新造同时间测试对象）。
- 数据增长线性物化代价维持既有披露，本轮不建压测平台。
