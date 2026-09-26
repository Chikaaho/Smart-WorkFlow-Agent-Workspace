# `backend-api-optional-contract` 探索回执 01 规划复核

> Planner · 2026-09-24  
> 审查对象：`search_fallback/backend-api-optional-contract-current-seams.md`  
> 结论：**`VERIFYING`（探索清单未闭合，不进入实施）**

## 1. 已锁定事实

- 已识别 7 个 `-api` 模块；其中 `openapi-api` 当前只有错误码枚举，回执按 0 调用面记录。
- 按“`public interface` 声明方法（含 default）”的暂定口径，共 33 接口 / 118 方法；已符合 `Optional` 返回的暂计 1，未包装暂计 117。
- 暂定返回分类为 `void` 24、boolean 13、long 4、Long 1、List/Map 33、byte[] 1、String 24、对象 17、Optional 1，合计 118。
- 当前无现成 ArchUnit/Checkstyle/ErrorProne/NullAway 规则覆盖该契约，必须建立可机械防回归的新守门。
- HTTP Controller 不在 `-api` Java 跨模块返回籽名范围内，但其调用链必须在边界内解包，不得将 `Optional` 直接序列化为 HTTP 契约。

上述只是探索基线，最终数量待补充探索关闭后锁定。

## 2. 未通过项

| 缺口 | 当前事实 | 完成条件 |
|---|---|---|
| G1 调用面边界不完整 | 统计规则只纳入 `public interface`；已发现 `RestrictedExpressionEvaluator` 3 个跨模块 static 方法却未计入 118 | 全量检查公开接口、抽象/具体类、default/static 方法，形成唯一纳入/排除规则并重算总数 |
| G2 缺少逐方法清单 | 只有接口级数量和文件级调用方概述；回执明确承认 118 方法清单未落盘 | 每个纳入方法有稳定 ID、完整签名、文件/行号、实现、方法级生产调用方、测试、当前缺失/失败语义和迁移类别 |
| G3 语义计数不可复算 | null 21、异常 5 组、哨兵 3 处只有叙述，未与方法 ID 勾稽；同名 `upload` 等不能唯一定位 | 每个分类都能从方法矩阵过滤复算，所有数值与总数闭合 |
| G4 调用方粒度不足 | 当前是文件级 grep，未区分具体方法调用与只引用类型 | 每个方法列出实际生产调用位置；零调用时明确是预留 API、模块内自用还是待退休 |

## 3. Planner 已裁决口径

以下不再作为 Owner 待确认问题：

1. **无豁免**：所有纳入范围的方法都必须返回 `java.util.Optional<T>`；SPI/default/static/弃用方法均不因类型或状态豁免。
2. **`void` 不豁免**：不创造 `Optional<Void>`；改为能表达业务结果的非空类型后再以 `Optional` 包装。
3. **原始类型不豁免**：使用 `Optional<Boolean>` / `Optional<Long>` 等包装类型，不用原始类型继续表达缺失。
4. **集合/Map 不豁免**：`Optional.empty()` 表示查询上下文/目标缺失或不适用；`Optional.of(empty collection/map)` 表示查询已合法执行但零匹配。每个方法必须在 Javadoc 固定两层语义。
5. **哨兵与 null 缺失值必须消除**：缺失转 `Optional.empty()`；非缺失的合法状态改为类型化结果，不依赖 `"NOT_FOUND"` / `-1` 等字面哨兵。
6. **异常边界**：“对象/上下文不存在”改为 `Optional.empty()`；校验失败、权限拒绝、冲突、基础设施和其他真实错误仍保持明确异常，不得伪装为 empty。
7. **弃用契约**：无调用的弃用方法应删除；如必须保留则同样合规，不允许“先豁免再退休”。
8. **HTTP 边界**：Controller 的 HTTP 响应不强制改成 `Optional`；必须在内部调用边界解包并映射为既有或明确更新的 HTTP 语义，禁止直接序列化 `Optional`。

## 4. 复核结论

回执 01 可用于锁定暂定规模、风险类别与 Owner 规则，但不满足原探索的“全量公开调用面 + 逐方法可复算清单”完成标准。当前保持 `PLANNING / EXPLORING`，执行 `search_task/backend-api-optional-contract-current-seams-supplement-01.md` 后再下发正式方向。
