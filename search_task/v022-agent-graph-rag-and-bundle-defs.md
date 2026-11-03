# 探索：Agent graph / RAG 现状与应用定义细节

本会话角色：规划，委派角色：执行。日期：2026-11-03。

承接 `search_fallback/v030-agent-provider-and-app-bundle-seams.md`（已读，A1—A7、B8—B13 不重复）。Owner 已明确：Agent 是完整的 graph+RAG 功能，供应商、模型、graph 统一管理，框架改用 LangChain4j。本轮补齐写方向所需的事实。

## 任务目标

1. 弄清现有 Agent graph 的能力边界，以及 RAG/知识库的实现程度。
2. 核实 LangChain4j 当前版本对三种格式的支持情况。
3. 补齐应用整包导出需要的三项定义细节。

只回答事实，不出方案。

## 需要回答的问题

### C. Agent graph

1. graph 的数据模型：表名、graph_json 结构、版本/发布机制；智能体（agent）与 graph 是什么关系。
2. 节点类型全清单（LLM、工具、条件、循环、人工、子图、知识检索等），每类的配置字段和引用的外部对象（模型配置 id、工具 id、知识库 id 等）。
3. 执行引擎能力：同步/异步、状态与记忆、会话、工具调用（function calling）是否已实现、流式输出、错误与重试、超时、取消。
4. 工具（tool）管理：表、类型（HTTP、内置等）、启停。
5. 前端 Agent 菜单与页面全清单（路由、权限），图编辑器的实现方式。
6. 已知缺陷、TODO、只做了一半的能力。

### D. RAG / 知识库

7. `sw-basic-knowledge` 模块现状：表、实体、接口、前端页面；文档上传、切分、向量化、检索各做到哪一步。
8. pgvector：扩展是否在迁移里启用，向量表是否存在、维度多少；H2 下怎么处理。
9. Embedding 模型目前怎样配置，是否复用 `sw_agent_model_config`。
10. graph 里有没有知识检索节点，或者编排时能否挂知识库。

### E. LangChain4j 能力核对（查官方资料，不改依赖）

11. 当前稳定版本号；与 Java 21、Spring Boot 3.4 的兼容性；Spring Boot starter 情况。
12. 三种格式的支持情况：OpenAI Chat Completions（含自定义 baseUrl）、OpenAI Responses、Anthropic Messages（含自定义 baseUrl）。分别给出所在模块和类名，没有就写"无"。
13. 同步、流式、工具调用、Embedding、pgvector EmbeddingStore 各自对应的模块。
14. 和现有 Spring AI 1.0.4 并存或替换时的依赖冲突风险（如 Jackson、HTTP 客户端）。

### F. 应用导入导出补充（承接上轮"是否需继续"）

15. 动态宽表：物理表命名与建表规则、何时建表、字段到列的映射，导入到新租户/新 key 时需要做什么。
16. 表单 definition JSON 的字段类型清单，以及哪些字段属性引用外部对象（字典、数据源查询、子表、关联表单等）。
17. 流程 graph_json 节点配置的全清单，以及每类节点引用的外部对象（补全上轮 B12）。

## 搜索范围

Server/Web 当前 `develop` 代码与迁移、`knowledge/`、`search_fallback/m07-*.md`；E 部分可查 LangChain4j 官方文档、GitHub 仓库和 Maven Central。

## 禁止范围

不修改任何文件（回执除外），不运行构建、测试、迁移或服务，不访问 UAT，不调用外部模型接口，不读取或回传密钥原值。

## 预期证据

结论附文件路径与类名/表名/行号；E 部分附官方链接与版本号。不贴代码正文。

## 完成标准

C1—F17 每题有结论，或写"未找到"并注明查过的位置。

## 失败处理

查不到时如实标注，不猜测，照常提交。

## 回执位置

`search_fallback/v022-agent-graph-rag-and-bundle-defs.md`（<5KB），细节放同名 `-appendix.md`。
