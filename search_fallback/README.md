# search_fallback 使用说明

`search_fallback/` 是**探索结果回执通道**（Executor 写，Planner 读）。

## 用途

Executor 完成探索后，将探索结果压缩写入 `search_fallback/<task-name>.md`（目标 <5KB），使用结论优先的格式，确保 Planner 能在 <1 次阅读中理解全部发现。

## 回执格式

> 至少包含：探索结论、检查范围、关键证据、已确定事实、分析推测、未确认事项、冲突信息、是否需要继续探索、建议返回规划层的最小结论。

## 规则

- 探索结果必须压缩写入本目录，不得在同一次调用中同时完成探索和方向生成。
- Planner 读取 `search_fallback/` 获取探索结果，结合 `memory/` 生成需求方向。

## 初始状态

目录为空，可承载首次探索回执。项目接入后由 Executor 按探索任务写入。