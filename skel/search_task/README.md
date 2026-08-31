# search_task/ 骨架说明

`search_task/` 是**探索任务下发通道**（规划角色写，执行角色读）。

## 用途

当 `memory/` 中的信息不足以做出规划决策时（需确认代码结构、API 签名、数据流、影响范围等），规划角色创建 `<task-name>.md` 探索任务下发，执行角色读取后执行探索，并将结果压缩写入 `search_fallback/<task-name>.md`。

## 规则

- 探索任务必须写入 `search_task/<task-name>.md` 文件，不得仅在对话中输出。
- 探索任务只产出 `search_fallback/`，不产出需求方向。
- 规划角色不得自行读取 `knowledge/` 或两端代码，探索须经此通道委派执行角色。

## 初始化

1. 实例接入后创建空目录（或本骨架文件）。
2. 由规划角色按需创建 `<task-name>.md` 探索任务。