# 后端架构优化候选事实审计 01 · 规划复核

> 复核角色：规划（Planner）  
> 日期：2026-09-24  
> 对象：`search_fallback/backend-architecture-optimization-candidate-audit-01.md` 及同前缀 5 份 TSV  
> 结论：**Phase 2 审计通过并完成；10/10 候选均已有事实裁决与去向**

## 1. 复核结论

执行回执满足只读审计边界，10 项总数可复算为：

- `CONFIRMED` 8 项：BAO-02/03/04/05/06/07/08/09；
- `PARTIAL` 2 项：BAO-01/10；
- `NOT_CONFIRMED` / `STALE` 0 项；
- 未实施源码、POM、测试、数据库、版本、分支或发布变更。

主回执与 `candidate-matrix`、`dependency-chains`、`build-artifact`、`events`、`raw-sql` 五份明细能够相互勾稽。POM/effective POM、依赖树、现有制品内容、Git 身份与精确代码位置足以支持本阶段的结构事实裁决。

本结论仅表示“候选事实审计完成”，不表示任何候选改造已经实现或通过功能验收。

## 2. 十项规划去向

| ID | 规划采纳结论 | 去向 |
|---|---|---|
| BAO-01 | `PARTIAL`：传递依赖污染成立，API 类型层污染不成立 | 延期；未来模块拓扑阶段再评估，当前不优先拆 `sw-common` |
| BAO-02 | `CONFIRMED` | 独立模块边界阶段；IoT 边界优先，Agent/Knowledge 不机械套用同一拆法 |
| BAO-03 | `CONFIRMED` | 并入后续“构建与制品治理”阶段 |
| BAO-04 | `CONFIRMED` | 并入后续“构建与制品治理”阶段，并作为该阶段前置守门 |
| BAO-05 | `CONFIRMED` | 独立可靠业务事件阶段；先锁定 must-deliver 清单，不与动态表阶段混改 |
| BAO-06 | `CONFIRMED` | **进入下一唯一主阶段** |
| BAO-07 | `CONFIRMED`（静态并发窗口成立，尚未行为复现） | **与 BAO-06 合并进入下一唯一主阶段** |
| BAO-08 | `CONFIRMED` | 并入后续“构建与制品治理”阶段 |
| BAO-09 | `CONFIRMED` | 并入后续“构建与制品治理”阶段 |
| BAO-10 | `PARTIAL`：命名排除存在，但当前仓内生产构建未激活且制品仍含调试类 | 并入后续“构建与制品治理”阶段 |

## 3. 尚未被本审计证明的边界

以下内容在回执中已如实声明，不阻塞 Phase 2 完成，但必须由对应实施阶段补齐：

1. BAO-07 尚无双连接并发行为复现；不能把静态窗口判断写成并发测试已通过。
2. BAO-06 尚未读取活库 `information_schema`；不能把源码字段假设外推为所有现存动态表均已具备一致 schema。
3. BAO-05 的 Flowable 回调事务上下文及异步执行器行为尚未用运行时断言确认。
4. BAO-08/10 只证明仓内构建入口与既有制品；仓外是否额外激活 `-Pprod` 未被证明。

## 4. 下一唯一阶段裁决

下一阶段固定为 **“动态宽表数据安全与引用完整性收口”**，合并 BAO-06 与 BAO-07。理由：二者共享动态宽表访问与 `FormDataDeleteService` 回滚边界，且同时涉及租户隔离、逻辑删除、失败放行和并发引用完整性；这些风险高于整洁性与构建治理问题。

方向入口：

`product/backend-architecture-optimization/ready/direction-phase3-dynamic-table-data-safety-reference-integrity.md`

BAO-01—05、08—10 均未获得本轮实施授权；特别是 BAO-05 暴露的 `ScheduledFlowTriggerEvent` 无监听者和非事务发布路径应保留为后续高优先级事实，但不得顺手并入当前动态表阶段。
