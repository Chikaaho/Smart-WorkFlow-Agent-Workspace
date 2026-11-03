# 探索回执：AI 供应商管理 / 应用导入导出接缝

日期 2026-11-03　角色执行　基线 develop（0.2.1 后）　详细证据（文件+行号）：同目录 `v030-agent-provider-and-app-bundle-seams-appendix.md`

## 范围

server/web 工作树、postgresql 迁移（V0.2.0 baseline + R__）、0.1.6 legacy 升级脚本、knowledge/、m07 探索（已压缩为指针）。未构建/测试/启动，未读密钥原值。

## A. AI API 管理

1 表 `sw_agent_model_config`（`V0.2.0__baseline_seed.sql:1197-1230`；V24 列 `:1385-1398`）：name、protocol_type、base_url、model_name、api_key_cipher、采样参数、超时/重试、启停、备注、group_key/sort/locked_until/quota_cooldown_seconds；tenant_id 由 BaseEntity+拦截器。Key 为 AES-GCM 密文，加解密仅在 `AgentModelConfigServiceImpl`。
2 无 LangChain4j；实际 Spring AI 1.0.4（`sw-dependencies/pom.xml:22,121`），只引 openai、ollama starter（`sw-basic-agent/pom.xml:73,77`），用 `OpenAiChatModel/OllamaChatModel.builder` 构造（`ChatModelFactory.java:67-103`），无流式。
3 每次调用新建，无缓存/单例/失效事件；工厂在编排、图解释器、调试引擎按次 build（`AgentOrchestrationServiceImpl:153`、`AgentGraphInterpreter:402`、`AgentGraphDebugEngine:345`）。图执行开始时一次性装载配置（`AgentGraphExecutionServiceImpl:436-451`），运行中改动不生效；编排每请求查库，立即生效。
4 实际协议：OpenAI Chat Completions 兼容（baseUrl 可换任意网关）+ Ollama；无 Responses/Anthropic/Gemini。`other` 可存不可跑：Service 允许（`:50`），工厂白名单仅 openai/ollama（`ChatModelFactory:42,56-65`）。连通性测试只 GET `/models` 或 `/api/tags`，4xx 也算可达。
5 调用点全在 `sw-basic-agent`，他模块 0 引用：编排 run（groupKey 轮询+429 锁定）、图执行 LLM 节点、单步调试、会话列表（只过滤不调用）、Token 统计；流程/表单不调模型。
6 前端 `/agent/model`：ModelList + ModelFormDialog，字段含协议(openai/ollama/other)、baseUrl、模型名、Key(脱敏、留空保留)、采样参数、超时/重试、启停、分组/排序/冷却、备注；测试按钮按 `agent:model:test` 显隐。
7 接缝：`application.yml:103-115` 全局 spring.ai gpt-4o/llama3 默认配置未使用；工厂与 Service 协议集合不一致；图执行不查模型 enabled（`:446-451`）；多 Key 轮换只在编排；无独立供应商维度。

## B. 应用导入导出

8 应用=表单分组：`sw_form_app`+`sw_form_app_dir`+`sw_form_app_scope`，层级 app→dir→form（form_def.app_id/dir_id）。表单下挂 config、按版本 snapshot、list_config、ext_query、lifecycle_audit、trace、txn_action 系列。流程定义、菜单、工作台卡片、数据源、字典、统计卡都没有 app_id。
9 审批意见表单=`form_def.form_type=APPROVAL_COMMENT`，不参与应用归属，流程管理菜单单独维护；节点绑 `config.nodeForm.formKey`，发布冻结 formVersion；运行时读 `config.opinionForm{formId,version,fields}`（未找到写 opinionForm 的前端入口）；可多节点/多流程共享，表单改版不回写已发布图。
10 标识：app/dir/form 主键 UUID(VARCHAR36，含历史 lc<id>/uncat-t<tenant>)，无稳定 code；应用名唯一仅服务层。form_key 唯一=(tenant_id,form_key,deleted)。流程 id BIGINT，process_key 随机、无唯一索引、发布后冻结。字典 code 唯一索引不含 tenant_id。菜单 id 为固定种子值。
11 已有：表单数据 Excel 模板/导入/导出（P32 完成）；流程仅 BPMN XML 只读导出（PUBLISHED），无导入；模板可复制。P15/I16 跨环境无代码，仍"未设计"。
12 外部引用：审批人（用户ID/角色编码/部门ID/岗位编码/表单字段）、form_key、意见表单 formId+version、datasource_id(long)、字典 code、附件 storageKey、IoT deviceId/deviceKey、字段权限 user:/dept:/role: 主体串；Agent 模型与应用无引用。
13 权限：应用后台 `form:app:manage`，用户端按 visible_scope_type+scope 表（USER/DEPT/ROLE/POST/TENANT）过滤；租户隔离由全局 TenantLine 拦截器（超管旁路、扩展源跳过），业务不手写 tenant 条件。

## 冲突/未确认

other 可存不可跑；opinionForm 无写入入口；字典 code 跨租户唯一；图引用模型 id 无外键（逻辑删除后运行期报错）。未确认 P15 是否有设计残留、错误文本脱敏范围。

## 是否需继续

A 可进方向设计；B 整包前建议再探：动态宽表建表规则、definition 字段类型与引用、graph_json 节点配置全清单。
