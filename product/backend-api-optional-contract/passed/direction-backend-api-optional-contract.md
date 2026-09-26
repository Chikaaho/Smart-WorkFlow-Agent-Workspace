# 后端跨模块 API `Optional` 返回契约优化方向

> 下发角色：规划（Planner）  
> 指定实施角色：执行（Executor）  
> 任务等级：XL  
> 方向状态：PASSED（规划功能级验收通过，2026-09-24）  
> 日期：2026-09-24  
> 总体计划关系：`backend-architecture-optimization` 的 Phase 1；本方向仍独立验收  
> 权威探索：`search_fallback/backend-api-optional-contract-current-seams-supplement-01.md` 及其 inventory/reference TSV  
> 探索裁决：`../receipts/planning-review-exploration-supplement-01-passed.md`
> Owner 语义补充：`../receipts/planning-owner-clarification-result-layering-20260924.md`

## 1. 目标

后端所有 `-api` 模块中向其他模块提供调用或实现契约的方法，必须以 `java.util.Optional<T>` 作为模块内部的统一规范结果；其定位对应 Controller 层面向 HTTP 的 `Result<T>`，但服务于内部调用边界。调用方必须显式处理“有值、无值、失败”，不再以 nullable 返回、空集合、原始类型默认值、字符串/数值哨兵或无返回值混合表达缺失与业务结果，从契约层减少 NPE。

本任务同时建立可机械执行的架构守门，使当前迁移完成后新增 API 方法无法绕过该契约。

本方向是“后端架构优化重构”总体计划的第一主阶段。后续模块边界、依赖治理、构建守门、可靠事件与动态数据安全等候选方向不属于本阶段范围，不得混入本阶段完成判定。

## 2. 当前锁定基线与闭合范围

- 已扫描 7 个 `-api` 模块；其中 6 个模块存在纳入方法，`openapi-api` 当前为 0。
- 当前纳入 34 个类型 / 121 个方法：33 个接口及 `RestrictedExpressionEvaluator` 的 3 个 public static 方法；包含 15 个 default、3 个 static。
- AM-097 已合规；其余 120 个方法待迁移或经明确裁决删除。
- 影响基线为 49 个实现文件、239 个生产调用点、230 个测试引用点；这些是迁移核对基线，不是允许漏改的抽样范围。
- 121 个 AM ID 是本方向的闭合账本。最终每个 ID 必须且只能落入“保留并合规”或“删除且所有定义/实现/调用/测试引用已闭合”之一。

纳入边界为 API 模块中承担跨模块调用、实现或扩展契约的 public interface/default/static 方法，以及公开抽象/具体类中同性质的方法。DTO/record/entity 的纯值访问器、builder、枚举/常量/注解/异常/错误码、`Object` 覆写和纯值类型工厂不因位于 API 模块而纳入。

## 3. 非目标

- 不把 Controller 的 HTTP 返回类型统一改为 `Optional`，也不把 `Optional` 直接序列化到 HTTP 响应。
- 不以 `Optional` 替代 Controller 的 `Result<T>`、全局异常映射或错误码载荷，也不形成 `Result<Optional<T>>` / `Optional<Result<T>>` 的嵌套规范。
- 不借本任务重写业务流程、权限模型、数据库结构、前端交互或公开 HTTP 协议。
- 不为追求签名一致而吞掉校验、权限、冲突、基础设施或其他真实错误。
- 不建立长期双签名、旧接口别名或“先豁免后补”的兼容层。
- 不把历史 Server 1423 测试基线当成本轮测试结果；本轮必须产生当前实现对应的新证据。

## 4. 关键契约决策

### 4.0 分层结果规范

本任务固定两层结果边界：

- `-api` 模块内部契约统一返回 `Optional<T>`，负责强制表达 present/empty，禁止 nullable 返回；
- Controller/HTTP 边界继续返回 `Result<T>`，负责对外成功、失败、错误码和消息协议；
- 调用链在 Controller/应用边界显式完成转换：present 映射为成功结果，empty 映射为既有“未找到/无结果”语义，真实异常交由既有统一异常映射转为失败 `Result<T>`。

因此 `Optional.empty()` 只是一种可预期的“无结果”，不是通用失败容器。调用方不得用 empty 吞异常，也不得各自随意把同类异常映射成不同结果。

### 4.1 无类型豁免

所有最终保留的纳入方法都返回非空 `Optional<T>`。default、static、SPI、回调端口、已弃用方法、原本恒非空的方法均不豁免；禁止 raw `Optional`、`Optional<Void>`、嵌套 `Optional` 和返回 `null` 的 `Optional`。

### 4.2 `void` 方法

24 个 `void` 方法必须先改为能表达业务结果的非空结果类型，再由 `Optional` 包装。结果类型应能区分已执行、合法幂等/无操作和必要的业务状态；合法幂等或零变更属于“有值的结果”，不得伪装成 `Optional.empty()`。

### 4.3 boolean 与数值

原始类型改为 `Optional<Boolean>`、`Optional<Long>` 等包装类型。`false`、`0` 等合法业务答案必须以 present 值保留；只有目标/上下文缺失或不适用才允许 empty。

### 4.4 集合与 Map 两层语义

`Optional.empty()` 表示查询目标、上下文或适用条件不存在；`Optional.of(empty collection/map)` 表示查询合法执行但零匹配。不得以空集合代替“目标不存在”，也不得以 empty 代替合法零结果。每个相关方法的 Javadoc 和行为测试必须固定这两层语义。

### 4.5 当前恒非空结果

对当前 `NON_NULL` 方法，正常成功路径返回 `Optional.of(result)`；若契约没有合法缺失场景，empty 不得成为新的宽泛失败出口。实施中发现真实缺失场景时，必须在该方法 Javadoc 明确定义并用行为证据覆盖。

### 4.6 null、哨兵与异常

- 当前以 `null` 表达缺失的路径改为 `Optional.empty()`；
- `"NOT_FOUND"`、`-1` 等缺失哨兵必须消失，合法非缺失状态使用类型化结果表达；
- 对象/上下文不存在可改为 empty；参数非法、权限拒绝、状态冲突、基础设施失败及其他真实错误继续抛出明确异常；
- 同类真实异常沿既有统一异常映射边界转换为 Controller `Result<T>`，不得由每个内部调用方临时 catch 后返回 empty；
- AM-035 `executeQuery` 与 AM-062 `startProcess` 必须分别明确“目标缺失”和“请求非法/执行失败”的界线，不能把现有异常一律转 empty。

### 4.7 零调用与弃用方法

13 个 `ZERO_CALLER` 和 AM-120 弃用方法必须逐项形成处置表：

- `RESERVED_API`、`MODULE_INTERNAL_SPI`、`API_DEFAULT_DELEGATED` 如保留，必须与其他方法同等合规；
- 9 个 `UNUSED_FACADE_METHOD` 无继续承担契约的必要时应删除；若保留，须给出真实用途并完成 Optional 迁移；
- AM-120 有内部调用者，只有在调用方迁至替代契约后才能删除；未删除则必须合规。

删除是一种账本闭合方式，不是对仍存在公开方法的豁免。

### 4.8 调用与 HTTP 边界

调用方必须显式处理 Optional，不得用无检查 `get()`、`orElse(null)` 或重新制造哨兵来恢复旧语义。Controller/HTTP 适配层在内部解包并转换为 `Result<T>`：present、empty、exception 三条路径均应落入统一映射；外部响应体和序列化模型不得泄露 Java `Optional`，也不得返回 `Result<Optional<T>>`。

## 5. 兼容性、回滚与演进窗口

本任务采用后端仓内原子迁移：API 定义、实现、生产调用方和测试在同一集成窗口闭合，不保留永久双签名。中间分支允许阶段性不可编译，但任何阶段回执和最终提交点都必须满足其声明的完整门禁。

默认保持现有 HTTP 与持久化契约，因此不应产生数据库迁移或前端改造。若实际实现证明 HTTP 行为必须变化，须停止扩大并返回 Planner/Owner 重新裁决，不得隐式改变外部兼容性。

回滚点为迁移前可识别的后端源码基线；回滚必须整体恢复 API、实现、调用方、测试和守门，禁止只回退一侧制造签名不一致。

## 6. XL 阶段验收边界

### 阶段 A：契约语义与处置闭合

121 个 AM ID 均确定最终签名、present/empty/exception 语义和保留/删除处置；24 个 `void` 的结果类型、34 个集合/Map 的两层语义、3 个哨兵和 4 个异常表缺失方法均有明确契约。阶段 A 只锁定契约，不可冒充完成迁移。

### 阶段 B：定义、实现与消费者原子迁移

所有保留方法、实现、239 个生产调用基线及相关测试引用完成迁移；删除项的定义、实现和引用归零。HTTP 边界保持稳定，调用方没有用 null、哨兵或无检查解包回退旧行为。

### 阶段 C：机械守门与整体回归

建立覆盖所有 `-api` 模块的自动架构守门，并以正反样例证明：合规签名通过，任一新增非 Optional 的纳入方法稳定失败。受影响行为测试与后端全量工程门禁通过后，才可提交整体完成回执。

每阶段由 Executor 自行制定实施计划、修改顺序与最小充分验证；阶段通过不替代整体功能验收。

## 7. 方向级验收标准

1. 121 个 AM ID 的最终处置账本完整、唯一、可复算；无静默遗漏或新增未登记公开契约。
2. 所有最终保留的纳入方法均返回参数化 `Optional<T>`，且 Optional 对象自身永不为 null；原 nullable 返回路径已归零，能够证明调用链不再依赖隐式空值。
3. 24 个原 `void` 方法均没有使用 `Optional<Void>`，并以有意义的类型化结果表达成功、幂等与业务状态。
4. primitive、集合/Map、null、哨兵、异常和恒非空方法分别符合第 4 节语义；每个方法 Javadoc 明确 present、empty 与 exception。
5. AM-035、AM-062 的缺失/校验边界有明确契约和正反行为测试；`TenantValidityFacade` 的方法引用实现也被实际迁移与验证。
6. 13 个零生产调用方法和 AM-120 均有最终保留/删除证据；删除项不存在定义、实现、调用或测试残留。
7. 所有实现与调用方完成编译期迁移；无 `orElse(null)`、缺少前置证明的 `get()`、重造 `NOT_FOUND`/`-1` 或把 empty 当通用错误通道的行为。
8. 集合/Map 至少覆盖“上下文缺失→empty”和“合法零匹配→present empty collection/map”的可区分行为。
9. 原始 boolean/数值至少覆盖合法 false/zero 为 present，以及真实缺失为 empty 的可区分行为。
10. `void` 改造的方法至少覆盖执行成功、目标缺失及适用时的幂等/零变更，证明结果类型没有混淆状态。
11. 内部 `Optional<T>` 与 Controller `Result<T>` 的分层清晰：HTTP 层不直接返回、嵌套或序列化 Optional；present/empty/exception 均经统一边界映射，原有对外成功、未找到与错误语义无意外漂移。
12. 自动架构守门覆盖现有及未来 `-api` 调用面，具有会失败的反例验证，不能只靠一次性文本扫描或人工清单。
13. 受影响模块测试、跨模块集成验证和当前后端全量 Maven 门禁全部通过；测试计数、失败数、跳过数、命令和退出码可复算。
14. 不产生未裁决的前端、数据库或外部 HTTP 契约变更；没有无关重构混入本任务。
15. 回滚点、实际改动范围和兼容性偏差均有记录；未获授权的远程 push、合并、发布或部署未执行。

## 8. 完成回执与证据要求

Executor 完成各阶段后，应在 `product/backend-api-optional-contract/receipts/` 提交正式回执。整体完成回执至少包含：

- 121 个 AM ID 的前后对照与最终处置；
- 实际修改文件、实现文件、生产调用点和测试引用的勾稽结果；
- 各语义类别的代表性正向与反向行为证据，及 AM-035/AM-062/AM-120/零调用项的专项结论；
- 内部 `Optional<T>` 到 Controller `Result<T>` 的 present/empty/exception 三路映射证据，以及 nullable 返回和 NPE 回退模式的零残留证明；
- 架构守门的合规通过与故意违规失败证据；
- 受影响测试、跨模块验证、后端全量门禁的原始命令、退出码和精确计数；
- HTTP/数据库/前端非目标未漂移的证据，以及实际回滚点；
- 未执行远程发布动作的边界声明；
- 符合 L/XL 终态契约的唯一物理末行。

Executor 自验通过只形成 `EXECUTION_SUBMITTED`；由 Planner 独立对照本方向验收后，方可裁决功能级 `PASSED`。在阶段三终态同步完成前，不得写为 `COMPLETED`。
