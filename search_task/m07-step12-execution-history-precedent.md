**当前模型**：anthropic/claude-sonnet-5，可承担角色：规划模型（首席规划 Agent）

## 任务目标

M07-F02 图执行引擎（Step1-11，含并行/循环节点）已完结。候选下一功能是 todo 池中的「执行历史持久化」——当前执行历史完全不落库（D64 既有决策：图解释执行引擎第一版有意不做持久化）。需要探明当前执行调用链、已有的相邻持久化先例（F04 会话持久化）、以及执行结果/中间状态的数据结构现状，为规划层撰写需求方向文档（目标/非目标/影响范围/风险）提供依据。

## 需要回答的问题

1. `AgentGraphExecutionServiceImpl`（或同职责类）当前执行一次图的完整调用链是什么？执行请求/响应的 DTO 结构包含哪些字段（是否已有 success/output/error 等结果字段，是否已有执行耗时、节点访问轨迹等中间信息，即使目前未持久化）？
2. Step11 引入的多活跃执行点模型（LOOP/FORK/JOIN）执行过程中，是否已经在内存里维护了"访问过的节点序列"或类似轨迹信息（哪怕只是日志打印，不落库）？如果有，现有粒度是什么？
3. F04（多轮会话持久化，V21-V23 三表）作为最相邻的持久化先例，其表结构/写入时机/查询端点的设计模式是什么？（会话记录表、消息表、工具调用日志表分别存了什么，是否有可直接类比到"执行历史"的模式）
4. 图执行的触发入口有哪些（HTTP 端点/Controller 方法），当前是否有已知的高频调用场景（如测试执行 vs 正式流程执行），会否影响持久化的数据量级？
5. 当前 Flyway 迁移版本号占用到哪（V26 之后是否已被占用），agent 模块专属的 migration 路径规则是什么（Step11 是否新增了迁移，还是零迁移）？
6. 执行失败（如变量未定义、步数超限、循环迭代超限）时，当前异常信息的结构/丰富度如何？如果要持久化失败原因，现有异常类型和消息文本是否已经足够结构化，还是需要额外设计错误分类字段？

## 搜索范围

- `Smart-WorkFlow/sw-basic/sw-basic-agent/` 下与图执行相关的类（`AgentGraphExecutionServiceImpl`、`AgentGraphInterpreter`、相关 DTO/Controller）
- `Smart-WorkFlow/sw-basic/sw-basic-agent/` 中 F04 会话持久化相关表/实体（V21-V23 迁移脚本、`AgentConversation*` 相关类）
- Flyway 迁移目录（`db/migration/agent/`、根 `db/migration/`），确认版本号占用情况
- `product/agent-model-orchestration/passed/step-4-f04-conversation.md`、`step-8-graph-interpreter-engine.md`、`step-11-parallel-loop-nodes.md`（已有方向文档/回执，可直接读取辅助理解，无需重新验证其中已确认的结论）

## 禁止范围

- 不得修改任何代码或配置文件
- 不得运行 `mvn`/`pnpm` 等命令
- 不涉及 IoT/OpenAPI/知识库(RAG) 等其他模块
- 不涉及前端（本轮探索仅为后端持久化方向调研，前端展示面待方向文档确定后再评估）

## 预期证据

- 涉及问题的类名、方法名、文件路径
- 关键代码片段（仅摘录必要的判断逻辑，不粘贴整段大方法）
- 明确标注"已确认"vs"推测"

## 完成标准

6 个问题均有明确回答（或明确标注"当前实现未涉及，需要新设计"），且给出的证据可支撑规划层判断"执行历史持久化"功能的大致影响范围和主要架构风险点。

## 执行模型

deepseek/deepseek-v4-pro（涉及跨文件、执行引擎架构理解，属于复杂代码探索，触发 §2.5.4 升级条件）

## 失败处理

若某问题在限定范围内无法确定，明确写入"未确认事项"，不得猜测代替探索结论。

## 回执位置

`search_fallback/m07-step12-execution-history-precedent.md`
