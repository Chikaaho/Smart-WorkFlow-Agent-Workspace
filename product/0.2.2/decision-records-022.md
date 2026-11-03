# 0.2.2 决策记录

日期：2026-11-03。记录角色：规划。适用：F1 Agent 完善（XL）。依据：Owner 当日指令，探索回执 `search_fallback/v030-agent-provider-and-app-bundle-seams.md`、`search_fallback/v022-agent-graph-rag-and-bundle-defs.md`。

| 编号 | 决策 | 适用范围 | 理由与约束 |
|---|---|---|---|
| D022-01 | Agent 模块的模型接入改用 LangChain4j（目标 1.23.x 稳定线），Spring AI 的 OpenAI/Ollama 组件在迁移完成后移除 | Agent 模块 | Owner 指定；LangChain4j 自带 Chat Completions、Responses、Anthropic 三种实现。Jackson 冲突必须在阶段 1 开头验证并解决，不得降级或升级 Spring Boot 主版本来规避；解决不了就报告规划 |
| D022-02 | 两级数据模型：供应商（名称、API 格式、地址、密钥、启停）下挂模型（模型名、能力 CHAT/EMBEDDING、默认参数、启停） | 新表，替代 `sw_agent_model_config` 的职责 | 参考 ZCode。API 格式枚举固定三种：`OPENAI_CHAT`、`OPENAI_RESPONSES`、`ANTHROPIC`。供应商不设白名单 |
| D022-03 | 旧配置一次性迁移且不中断引用：每行旧配置迁为"供应商+模型"，graph_json、会话、执行记录中已有的 `agentModelConfigId` 继续能解析到迁移后的模型 | 数据迁移 | 不改写历史执行记录。旧 `ollama` 行迁为 `OPENAI_CHAT` 格式（Ollama 提供 OpenAI 兼容口），地址按兼容口修正；旧 `other` 行迁移后置为停用，等待重新配置 |
| D022-04 | 模型实例按"模型 id + 配置修订号"单例复用，各格式由各自的装配模板构造；供应商或模型被修改、停用、删除后立即失效，下一次调用重建 | 运行时 | Owner 指定"后台单例+模板装配"。明文密钥只在装配时解密，不进入日志、响应或异常文本 |
| D022-05 | 已有的分组多密钥轮换（groupKey、429 锁定与冷却）保留，并覆盖图执行与调试路径 | 运行时 | 现只在编排入口生效；不得因迁移丢失该能力 |
| D022-06 | graph 发布生成不可变版本快照，执行与调试绑定快照版本 | graph | 现发布覆盖同一行，历史执行无法回放 |
| D022-07 | RAG 向量存储使用 PostgreSQL pgvector，按租户隔离；H2 环境用可替换的内存实现，只用于测试 | RAG | UAT 数据库能否安装 pgvector 扩展，需在发布前核实；装不了时交 Owner 决定，不得静默降级 |
| D022-08 | 本版不做：graph 异步执行、流式输出、执行取消、人工节点、子图节点、Gemini 等其他格式、多模态 | 范围 | 控制 XL 体量；登记到需求池 |

修改上述决策需 Owner 同意或规划基于新事实另立记录，不在执行中自行改变。
