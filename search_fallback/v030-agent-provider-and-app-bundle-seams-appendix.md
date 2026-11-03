# 附录：v030 探索详细证据

主回执：`search_fallback/v030-agent-provider-and-app-bundle-seams.md`。以下路径除特别说明外均相对 `Smart-WorkFlow-aPaaS-server/`；前端路径相对 `Smart-WorkFlow-aPaaS-Web/`。行号为本轮工作树实际读取结果。

## A1 模型配置数据模型

| 项 | 事实 | 证据 |
|---|---|---|
| 表 | `sw_agent_model_config` | `sw-bootstrap/src/main/resources/db/migration/postgresql/V0.2.0__baseline_seed.sql:1197-1230`（原 V19，已收敛） |
| 列 | name/protocol_type/base_url/model_name/api_key_cipher/temperature/max_tokens/top_p/timeout_seconds/retry_count/enabled/remark + 审计列 | 同上 :1202-1223 |
| 多 Key 列 | group_key/sort/locked_until/quota_cooldown_seconds + 索引 | 同上 :1385-1398（原 V24） |
| 唯一约束 | `uk_sw_agent_model_name (tenant_id, name)` | 同上 :1225 |
| 实体 | `AgentModelConfig`，`@TableName("sw_agent_model_config")`，继承 `BaseEntity`（id/tenantId/createBy/.../deleted/version） | `sw-basic/sw-basic-agent/src/main/java/com/sw/ck/agent/entity/AgentModelConfig.java:27-75` |
| 密钥 | `apiKeyCipher` TEXT，AES-GCM 密文 Base64，`@JsonIgnore`；对外只回 `apiKeyMasked` | 实体 :43-45；`AgentModelConfigServiceImpl.java:87-92,104-107,125-130` |
| 加密边界 | encrypt/decrypt/mask 仅在该 Service 内调用；明文只存局部变量 | `.../service/impl/AgentModelConfigServiceImpl.java:31-42,148-190` |
| 租户 | `tenant_id` 由 BaseEntity + 全局租户拦截器 | `sw-framework/sw-common/.../mybatis/tenant/CommonTenantLineHandler.java:16-60` |

## A2 AI 框架与模块

- 全仓 `rg langchain4j|dev.langchain`：0 命中（`.java`、`pom.xml`、`yml`）。
- Spring AI 版本 `1.0.4`：`sw-dependencies/pom.xml:22,121-122`。
- 引入模块：`spring-ai-starter-model-openai`、`spring-ai-starter-model-ollama`（`sw-basic/sw-basic-agent/pom.xml:73,77`）；`spring-ai-starter-vector-store-pgvector`（`sw-basic/sw-basic-knowledge/pom.xml:69`，knowledge 主代码无 EmbeddingModel/VectorStore 使用）。
- 构造：`ChatModelFactory.build` 按 protocolType 分支到 `OpenAiChatModel.builder().openAiApi(OpenAiApi.builder()...)...` 与 `OllamaChatModel.builder().ollamaApi(OllamaApi.builder()...)...`，参数 temperature/maxTokens/topP 进 defaultOptions，timeoutSeconds 通过 `SimpleClientHttpRequestFactory` 注入 RestClient，retryCount 进 `RetryTemplate.maxAttempts`（`sw-basic/sw-basic-agent/.../orchestration/ChatModelFactory.java:54-126`）。
- Ollama 无 maxTokens，改用 `numPredict`（同文件 :94-96）。
- 无 `StreamingChatModel`、无 `chatModel.stream(...)` 调用（Spring AI 无该类型，流式未使用）。

## A3 实例创建与生效

- `ChatModelFactory` 非 `@Component`，注释明确由 `AgentGraphAutoConfiguration` 手动 new 后注册 Bean（`ChatModelFactory.java:27-30`）。
- 编排：每次 `run` 查配置 → 解密 → build（`AgentOrchestrationServiceImpl.java:126-155`）；429 限流时锁定当前行并切换 groupKey 候选，回到循环顶部重建（`:242-262`）。
- 图执行：执行前校验并一次性装载 `Map<Long,AgentModelConfig>`（`AgentGraphExecutionServiceImpl.java:436-451`）；解释器每个 LLM 节点在循环内 `build`（`AgentGraphInterpreter.java:390-402`）。
- 单步调试：每个 LLM 节点 build（`AgentGraphDebugEngine.java:335-345`）。
- 无缓存/单例/事件失效：`sw-basic-agent` 主代码无 `@Cacheable/@CacheEvict/ConcurrentHashMap` 缓存（rg 0 命中）。
- 因此"动态装载"实际是"每次调用重新构造"：编排入口即时生效；图执行/调试在本次执行内不感知中途改动，下一次执行生效。

## A4 协议支持

- 工厂白名单 `Set.of("openai","ollama")`，非法协议抛 `IllegalArgumentException`（`ChatModelFactory.java:42,56-65`）。
- Service 白名单 `Set.of("openai","ollama","other")`（`AgentModelConfigServiceImpl.java:50`）；DTO/前端下拉同含 other（`ModelFormDialog.vue:47-60`）。
- 连通性测试：openai→`GET /models`，ollama→`GET /api/tags`，other→仅 GET baseUrl；4xx/5xx 计 `success=true`（"服务可达"），只有 `ResourceAccessException` 判失败（`AgentModelConfigServiceImpl.java:165-186`）。
- 无 Anthropic Messages / Gemini / OpenAI Responses 适配；OpenAI 兼容网关可通过 baseUrl 沿用 Chat Completions。

## A5 调用点与选型

| 调用点 | 选模型方式 | 证据 |
|---|---|---|
| 单智能体编排 | 请求 `agentModelConfigId` → selectById（租户拦截）；429 同 groupKey 轮换 | `AgentOrchestrationServiceImpl.java:116-268` |
| 图执行 LLM 节点 | 节点 `config.agentModelConfigId` → 预装载 Map | `AgentGraphInterpreter.java:370-402`；`AgentGraphExecutionServiceImpl.java:436-451` |
| 单步调试 | 同 LLM 节点 | `AgentGraphDebugEngine.java:335-345`；`AgentGraphDebugServiceImpl.java:120-124,177-184,281-288` |
| 会话列表 | 仅按 `agent_model_config_id` 过滤，不调模型 | `AgentConversationServiceImpl.java:41-52` |
| Token 统计 | `TokenUsageResolver` 读 ChatResponse usage，落消息与执行汇总 | `TokenUsageResolver.java`；`baseline:1768-1793` |

- 跨模块：`sw-biz/*`、`sw-basic-notify/job/iot/storage` 对 `com.sw.ck.agent`、`/agent/` 引用 0 命中 → 流程/表单模块当前不调用模型。

## A6 前端模型页

- 路由：`/agent/model` 等 4 个子路由，权限 `agent:model:view`（`src/router/index.ts:479-513`）。
- 列表：名称/协议/baseUrl/模型名/脱敏 Key/groupKey/排序/冷却/启停/操作（编辑、连通性测试、删除）；`PROTOCOL_MAP` openai/ollama/other（`src/modules/agent/views/ModelList.vue:39-49,257-330`）。
- 新建/编辑弹窗：`ModelFormDialog.vue`，字段与默认值 :72-86，回填 :137-151，表单区 :291-430；API Key 密码框、留空保留旧密文（`:125-130` 后端）。
- 按钮权限：`agent:model:manage`、`agent:model:test`（ModelList 注释与 `rowActions`，约 :150-215）。
- API 契约：`GET/POST/PUT/DELETE /agent/models`、`POST /agent/models/{id}/test-connection`（`src/modules/agent/api/index.ts:132-176`）。

## A7 硬编码与已知问题

1. `other` 可存不可跑（A4）。
2. 全局 Spring AI 自动装配仍在：`application.yml:103-115`（`spring.ai.openai.api-key=${OPENAI_API_KEY:}`、model gpt-4o；`spring.ai.ollama.base-url=http://localhost:11434`、model llama3），业务代码未注入自动装配的 ChatModel Bean（构造全部走工厂）。
3. 模型配置无缓存，每次请求解密并 new 客户端（A3）。
4. 图执行/调试校验不检查 `enabled=1`（仅工具校验 enabled，`AgentGraphExecutionServiceImpl.java:446-462`）。
5. 多 Key 轮换只在编排入口；图执行/调试无轮换。
6. 数据模型没有"供应商"独立维度：只有 protocolType + baseUrl + name/remark，无 vendor 字段、无供应商表。
7. 失败摘要 `summarizeError` 可能回传供应商错误文本，未见密钥过滤之外的额外脱敏（未见泄漏路径，仅提示注意）。

## B8 应用数据模型与下挂对象

- 迁移：`sw-bootstrap/src/main/resources/db/upgrade/0.1.6/legacy-0.1.5/postgresql/V20261015190000__application_center.sql:24-101`；现基线 `baseline:5423-5510`。
- `sw_form_app`：id VARCHAR(36)、tenant_id、name、icon、color、sort_no、visible_scope_type(ALL/SPECIFIED)、status(ENABLED/DISABLED)、source(MANUAL/LEGACY_*)、legacy_category_id、审计列。无唯一索引（仅 idx_sw_form_app_tenant）。
- `sw_form_app_dir`：id、app_id、name、sort_no；单层，只属于一个应用。
- `sw_form_app_user`：历史指定用户表，保留只读；现行多维度为 `sw_form_app_scope`（scope_type USER/DEPT/ROLE/POST/TENANT + scope_id，`baseline:5562-5585`）。
- `sw_form_def`：id、form_key、name、logical_table_name、status、physical_table_name、form_version、description、sub_table_mapping、form_type、app_id、dir_id（`baseline:574-599,5389-5394,5497-5504`）。
- 表单下挂：`sw_form_config`(definition JSONB, form_id)、`sw_form_snapshot`(form_id+form_version+definition)、`sw_form_list_config`(form_id 唯一)、`sw_form_ext_query`(datasource_id/query_key/query_version/sql_text/output_fields, 唯一 tenant+key+version)、`sw_form_lifecycle_audit`、`sw_form_trace`、交易动作 `sw_form_txn_action/_version/_invocation/_reservation/_ledger/_c1_policy`（`baseline:603-660,3259-3310,4737-4925`）。
- 应用内容契约只有 dirs + forms（`FormAppContentDTO.java:1-35`；`FormAppServiceImpl.getAppContent` :231-235）。
- 不挂应用的：流程定义 `sw_bpm_process_def`（category_id + form_key，`baseline:956-986`）、流程版本 `sw_bpm_process_def_version`（:3327-3355）、菜单 `sys_menu`、工作台卡片 `sys_workspace_card_type`/`sys_user_workspace`（:4403+,:2613+）、数据源 `sw_bpm_ext_datasource`（:343-360）、字典 `sys_dict_type/data`（:204-240）、统计卡（renderer_key=`statMetric`，`R__0.2.1_workspace_stat_metric_cards.sql`）。
- 全迁移 `app_id` 命中仅：form_def/app_dir/app_user/app_scope、openapi 表、sso provider config（与业务应用无关）。

## B9 审批意见表单

- 类型列：`form_type` BUSINESS/APPROVAL_COMMENT（`baseline:5389-5394`，原 V0.1.10）。
- 归属：APPROVAL_COMMENT 强制 appId/dirId=null（`FormDefServiceImpl.java:149-173`）。
- 维护入口：流程管理菜单 9111，权限 `workflow:approvalForm:list`（`R__p64_approval_form_menu.sql:1-20`）；前端 `ApprovalFormList.vue:1-33`，列表按 formType=APPROVAL_COMMENT。
- 节点绑定：设计器 `config.nodeForm.formKey`（`ProcessDesigner.vue:454-500`；`FormSelectDialog.vue:22-62` 默认按 APPROVAL_COMMENT 过滤，注释"流程节点的表单绑定只列审批意见表单"）。
- 发布冻结：把当前 formVersion 写入 `config.nodeForm.formVersion`（`BpmProcessDefServiceImpl.java:464-507`）。
- 运行时：读 `config.opinionForm{formId,version,fields}`；`DEFAULT_REMARK` 为内置兜底（`ApprovalOpinionValidator.java:41-70`；`ApprovalUserTaskTranslator.java:171-190`；`TaskActionService.java:622,644,710-712`）。校验只查字段类型/必填/长度/选项/用户 ID，不查表单是否存在或类型是否 APPROVAL_COMMENT。
- 共享：节点配置为 JSON 引用，无归属/唯一约束 → 同一表单可被多节点/多流程引用；已发布图的 `opinionForm` 是设计时副本，表单后续改版不自动回写。
- 未找到：写入 `opinionForm`（formId/version/fields）的前端入口；前端只写 `nodeForm.formKey`。

## B10 标识与唯一性

| 对象 | 主键 | 业务 key | 唯一约束 | 证据 |
|---|---|---|---|---|
| 应用 | VARCHAR(36) UUID（历史 `lc<categoryId>`、`uncat-t<tenantId>`） | 无 | 名称唯一仅服务层 | 迁移 :24-54；`FormAppServiceImpl.java:128-137` |
| 目录 | VARCHAR(36) UUID | 无 | 无 | 迁移 :57-74 |
| 表单 | VARCHAR(36) UUID | `form_key` | `(tenant_id, form_key, deleted)` | `baseline:4009-4020`（V83） |
| 表单配置/快照 | VARCHAR(36) UUID | 无 | 快照 (form_id, form_version) 无 DB 唯一 | `baseline:603-641` |
| 流程定义 | BIGINT 雪花 | `process_key='bpm_'+16hex` | 仅普通索引；发布后冻结 | `BpmProcessDefServiceImpl.java:93-94,333-338`；`baseline:985` |
| 流程版本 | BIGINT | graph_version | `(tenant_id, def_id, graph_version)` | `baseline:3352` |
| 字典类型 | BIGINT | `code` | `(code, deleted)`，不含 tenant_id | `baseline:904-905` |
| 菜单 | BIGINT | id 为固定种子值（9111/9130/9600 等） | 无 | R__ 菜单脚本 |

跨租户/跨环境：form_key 租户内唯一（跨租户可同名）；应用/目录/流程 key 无全局约束；字典 code 全局唯一最易冲突；菜单 id 固定值在导入时需重映射。

## B11 现有导入导出

- 表单数据 Excel：`FormImportExportController.java:49-140`（模板 GET、导入 POST、导出 POST；权限 form:data:template/import/export；5MB 上限用 1499 拒绝）；前端 `FormDataList.vue:74,580-625,780-800`。功能 P32 已完成（`knowledge/features/form-data-import-export.md:1-30`）。
- 流程：`GET /workflow/defs/{id}/bpmn-xml` 只读导出（仅 PUBLISHED，`BpmProcessDefController.java:237-247`）；无 BPMN/JSON 导入端点。
- 流程模板复制：`POST /workflow/templates/{id}/copy`（`BpmProcessTemplateController.java:92-98`）。
- 跨环境导入导出 P15 / I16：无 Controller/Service/前端，仅 known-issues 记录"未设计"（`knowledge/known-issues.md:298-305`；`knowledge/feature-reconciliation-index.md:167`）。
- 应用/表单定义/流程定义均无整包导出端点（rg `Mapping.*(export|import)` 仅表单数据一处）。

## B12 外部引用

| 引用对象 | 字段/形态 | 证据 |
|---|---|---|
| 审批人 | 节点 `config.participant`（兼容 `config.approver`）strategy+value：FIXED_USER 用户ID、ROLE 角色编码、DEPT_LEADER 部门ID、POST 岗位编码、DEPT_POST{deptId,postCode}、FORM_FIELD{objectType,scope,field}、NODE_FORM_AGGREGATE{nodeKey,formField,round}、EXPRESSION、ADAPTER | `ParticipantStrategy.java:7-31`；`bpm-engine/participant/*Resolver.java`；`ApprovalUserTaskTranslator.java:123-160,194-240` |
| 表单绑定 | `sw_bpm_process_def.form_key` → `sw_form_def.form_key`（字符串） | `baseline:969,976` |
| 节点表单 | `config.nodeForm.formKey` + 发布冻结 `formVersion` | `BpmProcessDefServiceImpl.java:464-507` |
| 审批意见表单 | `config.opinionForm.formId/version/fields` | `ApprovalOpinionValidator.java:45-57`；`ApprovalUserTaskTranslator.java:171-190` |
| 外部数据源 | `sw_form_ext_query.datasource_id`(BIGINT) → `sw_bpm_ext_datasource.id`；表单侧引用 queryKey+version | `baseline:3273-3290,343-360`；`FormExtDataController.java:38-90` |
| 字典 | 字段配置 dict code（字符串）→ `sys_dict_type.code` | `baseline:204-240` |
| 附件 | 表单数据 storageKey → `sw_storage_file` | `FormFieldEnrichmentService.java:482`；`FormDefinitionService.java:99-101` |
| IoT | 节点 `config.deviceId`(Long) / deviceKey | `IotProcessTriggerListener.java:206-209,267-272` |
| 字段权限主体 | `user:<id>` / `dept:<id>` / `role:<code>` 字符串 | `FieldPermissionService.java:19-24,52-92` |
| Agent 模型 | Agent 图节点 `agentModelConfigId`(Long)，与流程/表单无引用 | `AgentGraphInterpreter.java:390-402` |

## B13 权限与租户

- 应用后台：`/form/app/manage`，`@PreAuthorize("@ss.hasPermi('form:app:manage')")`（`FormAppManageController.java:40,58,92-190`）；菜单 id=9130（`R__application_center_menu.sql:11`）。
- 用户端：`/form/app/center/*` 按 `sw_form_app.visible_scope_type` + `sw_form_app_scope`（USER/DEPT/ROLE/POST/TENANT）过滤，只返回已发布且可见表单（`FormAppServiceImpl.java:352-367`；`FormAppContentDTO` 注释）。
- 租户隔离：MyBatis-Plus `TenantLineInnerInterceptor` + `CommonTenantLineHandler`，自动追加 `tenant_id`；超管旁路；扩展数据源（非 master）跳过；认证上下文缺失时 fail closed（`CommonTenantLineHandler.java:16-60`）。业务代码不手写 tenant 条件，`TenantLineSuspension` 仅用于登录/任务等全局场景。

## 未确认事项

1. `opinionForm` 的 formId/version/fields 由谁写入（前端未见；可能为历史种子图、外部导入或尚未实现的设计器能力）。
2. P15 是否存在设计文档残留（本轮只找到 I16 记录与索引行）。
3. `summarizeError` 对供应商错误文本的脱敏范围（未逐条核对）。
4. 动态宽表物理表命名与建表规则本轮未展开（`DynamicTableManager` 仅在 Service 引用中出现，属 B 整包导出必然涉及项）。
