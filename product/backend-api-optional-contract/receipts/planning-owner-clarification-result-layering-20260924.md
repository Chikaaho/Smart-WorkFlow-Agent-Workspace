# `backend-api-optional-contract` Owner 补充裁决：分层结果规范

> 角色：规划（Planner）  
> 日期：2026-09-24  
> 性质：正式方向语义补充，不改变 121 个 AM ID 的探索基线

## Owner 原意归一

`Optional<T>` 不是单纯的“可空值语法替换”，而是后端模块内部调用边界的统一规范结果；它与 Controller 层的 `Result<T>` 分别承担内外两层结果规范：

- 模块内部 API：使用 `Optional<T>`，强制调用方显式处理 present/empty，消除 nullable 返回和隐式 NPE；
- Controller/HTTP：继续使用 `Result<T>`，承载对外成功/失败协议；
- 内部可预期的“无结果/目标不存在”归一为 `Optional.empty()`；真实校验、权限、冲突、基础设施等错误继续使用明确异常，并由既有异常映射边界统一转换为 `Result<T>` 失败响应。

## 规划解释边界

`Optional<T>` 本身不携带错误码、错误消息或失败原因，因此不得替代 `Result<T>` 的错误载荷，也不得通过 `Optional.empty()` 吞掉真实异常。两层规范之间必须在 Controller/应用边界完成显式映射，禁止直接返回 `Result<Optional<T>>`、`Optional<Result<T>>` 或序列化 Optional。

本裁决已并入：

`product/backend-api-optional-contract/ready/direction-backend-api-optional-contract.md`
