# 后端跨模块 API `Optional` 契约补充探索 01

> 本会话角色：规划（Planner）  
> 委派角色：执行（Executor）  
> 权威输入：`product/backend-api-optional-contract/receipts/planning-review-exploration-01-verifying.md`  
> 本文替代原探索任务作为当前唯一探索入口；原任务与回执 01 只作追溯。

## 任务目标

只补齐 G1—G4：闭合 API 模块公开调用面，生成可复算的逐方法矩阵。不重复讨论 Owner 规则，不制定实施方案，不修改代码。

## 必须完成

1. 全量扫描 7 个 `-api` 模块的 production Java 类型，不再只限 `public interface`。纳入：向其他模块提供调用/实现面的 public interface 方法、default 方法、public static 方法、公开抽象/具体类的跨模块可调用方法。排除：DTO/record/entity 访问器、builder、枚举/常量/注解/异常/错误码、`Object` 覆写和纯值类型方法。任何边界不确定的类型单列为候选，不静默排除。
2. 对 `RestrictedExpressionEvaluator` 3 个 static 方法及所有其他公开类方法做纳入/排除裁定，重算模块数、类型数、方法总数、已合规/待改造数和返回类别数。
3. 为每个纳入方法分配稳定 ID，矩阵每行必须包含：模块、所属类型、完整签名、定义路径+行号、实现路径+行号、方法级生产调用路径+行号、测试路径+行号、当前返回类别、缺失语义、失败语义、是否已为 `Optional`、迁移类别。
4. 调用方必须精确到方法调用，不得以“文件中引用了该接口类型”代替。无生产调用时标明 `ZERO_CALLER`，并区分 `RESERVED_API` / `MODULE_INTERNAL_SPI` / `DEPRECATION_CANDIDATE`。
5. 所有统计必须通过稳定 ID 从矩阵过滤复算；特别给出 null、空集合/Map、boolean/数值、哨兵、异常表缺失、恒非空结果、`void`、异步/回调的 ID 集合与计数。一个方法可同时属于“有成功结果 + 失败抛异常”，必须分开字段记录，不用模糊方法名归类。
6. 对实现 25 处、相关测试模块和既有工程守门做计数勾稽；若回执 01 数字有误，直接给出新数字与差异原因，不维护两套当前值。

## 产物组织

- 总结回执：`search_fallback/backend-api-optional-contract-current-seams-supplement-01.md`，目标 <5KB，只放最终数字、纳入/排除规则、差异与证据索引。
- 逐方法矩阵按模块/类型拆分为 `search_fallback/backend-api-optional-contract-inventory-*.tsv`；每份目标 <5KB，首行固定字段，按稳定 ID 升序，文件数不限。
- 若方法级调用方/测试列过长，可以另建同 ID 的 `*-references-*.tsv`，但总结回执必须提供文件索引和每文件行数/方法数勾稽。

## 约束

- 必须先完整读取后端工程宪法；仅读后端仓。
- 禁止修改任何代码、测试、配置、依赖或状态文件；禁止编译、测试、构建、启动、迁移和部署。
- 只读统计脚本不写入仓库；回执只写上述 `search_fallback/` 文件。
- 不重复提出“是否豁免”问题；Planner 复核记录 §3 已给出唯一口径。

## 完成标准

G1—G4 全部关闭；每个总数可从矩阵独立复算；纳入方法、实现、生产调用方和测试均有路径/行号；未确认项单列且不影响总数重算。完成前不得开始代码改造。
