# 后端架构优化重构 · Owner 范围更新记录

> 角色：规划（Planner）  
> 日期：2026-09-24  
> 任务等级：XL  
> 性质：总任务范围与阶段关系更新

## 范围裁决

当前总体任务定义为 **后端架构优化重构**，不是单一的 API `Optional` 签名改造。

- 第一主阶段：后端 `-api` 模块统一使用 `Optional<T>` 作为内部规范结果；现有子任务 `backend-api-optional-contract` 继续保留原目录与证据链。
- 后续主阶段：依据代码质量扫描发现，对模块边界、依赖治理、构建守门、事件可靠性、动态表安全、运行时依赖、版本身份与 Dev/Prod 隔离等方向逐项复核和整理。
- Owner 提供的 10 项发现是候选输入，不是全部必须执行的实施清单；每项必须先按当前代码事实确认，再由 Planner 决定独立立项、合并、延期或不执行。

## 状态边界

`backend-api-optional-contract` 已收到执行完成回执 `completion-backend-api-optional-contract-01.md`，当前仍为 `VERIFYING`。本次总任务扩展不构成对该回执的功能级 `PASSED`，也不允许跳过独立验收。

总体方向：

`product/backend-architecture-optimization/ready/direction-backend-architecture-optimization.md`
