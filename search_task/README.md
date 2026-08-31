# search_task 使用说明

`search_task/` 是**探索任务下发通道**（Planner 写，Executor 读）。

## 用途

当 `memory/` 中的信息不足以做出 L/XL 规划决策时（需确认代码结构、API 签名、数据流、影响范围等），Planner 创建 `<task-name>.md` 探索任务下发；Executor 读取后执行探索，并将结果压缩写入 `search_fallback/<task-name>.md`。S/M 由 Executor 在直接执行范围内自行读取必要事实，不经过本通道。

## 规则

- 探索任务必须写入 `search_task/<task-name>.md` 文件，不得仅在对话中输出。
- 探索任务只产出 `search_fallback/`，不产出需求方向。
- Planner 不得自行读取 `knowledge/` 或 coding 仓库，探索须经此通道委派 Executor。

## 初始状态

目录为空，可承载首次探索任务。项目接入后由 Planner 按需创建。
