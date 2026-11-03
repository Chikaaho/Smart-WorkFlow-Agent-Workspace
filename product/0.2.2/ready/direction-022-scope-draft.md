# 0.2.2 范围草稿

日期：2026-11-03。角色：规划。状态：`PLANNING`。F1 正式方向已下发：`direction-022-f1-agent.md`；F2 方向待 F1 验收后写。

## Owner 已定事项（2026-11-03）

- 版本号：**0.2.2**。按七阶段交付，默认发布。
- 本版两个功能，先后推进：
  1. **F1 Agent 完善**（先做，**XL**）
  2. **F2 应用导入导出**（F1 功能验收通过后开始，L）
- F1：
  - Agent 是完整的 graph+RAG 功能；供应商、模型、graph 统一管理。
  - 模型构造框架改用 **LangChain4j**，替换现有 Spring AI 1.0.4。
  - 兼容三种 API 格式：OpenAI Chat Completions、OpenAI Responses、Anthropic Messages。供应商不设白名单，兼容任一格式即可接入，参考 ZCode 的供应商管理方式。
  - 后台按配置复用单例模型实例，用模板装配构造。
- F2：导出整个应用的表单、流程、流程引用的审批意见表单等全部定义；导入目标缺审批意见表单时新建并关联。遇到同 key 的应用或表单时，作为新应用导入并重新生成 key，不覆盖现有数据。

## 真实供应商验证

Owner 指定 Command Code 作为三种格式的真实验证对象：

| 格式 | 模型 |
|---|---|
| OpenAI Chat Completions | `deepseek/deepseek-v4.1-flash` |
| Anthropic Messages | `claude-haiku-5-5` |
| OpenAI Responses | `openai/gpt-6-luna` |

接口地址：`https://api.commandcode.ai/provider`（各格式的实际路径由执行方核实）。API Key 由 Owner 在规划会话中口头提供，**不写入任何文件、台账、回执、提交或日志**；执行时由 Owner 直接交给执行会话，或通过本机环境变量注入，验证后不留存。

## 已核实现状（`search_fallback/v030-agent-provider-and-app-bundle-seams.md`）

- 框架是 Spring AI 1.0.4，只有 OpenAI、Ollama 组件；Responses 和 Anthropic 未实现。
- `sw_agent_model_config` 一行是一个模型配置（密钥 AES-GCM 加密），没有供应商维度。每次调用都新建客户端，没有单例或缓存。
- 编排、图执行、单步调试按配置 id 引用该表。"other"协议能存不能跑；连通性测试遇 4xx 也判为可达；图执行不检查模型是否启用。
- 应用 = `sw_form_app` → 目录 → 表单。流程、审批意见表单（`form_type=APPROVAL_COMMENT`，不属于应用）、字典、数据源都不挂应用。外部引用有审批人、字典 code、数据源 id、附件、IoT 设备等。

## XL 分阶段设想（待第二轮探索后定稿）

F1 计划分阶段，每阶段独立验收：供应商与模型管理及 LangChain4j 装配 → graph 完善 → RAG。阶段划分、回滚点和决策记录在正式方向中确定。

## 待探索

`search_task/v022-agent-graph-rag-and-bundle-defs.md`：graph 与工具现状、知识库/pgvector 现状、LangChain4j 对三种格式的支持，以及 F2 的动态宽表、表单字段引用、流程节点引用。回执到达后，规划写 F1 正式方向和决策记录。
