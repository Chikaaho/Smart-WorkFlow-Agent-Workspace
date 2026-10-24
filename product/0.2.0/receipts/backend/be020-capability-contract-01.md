# be020-01 后端能力与接口契约交接

2026-10-24｜Executor（后端）｜XL｜IN_PROGRESS｜能力/契约盘点，待 Planner 验收

总 7 阶段：已完成 1「需求评估」；进行中 1「分支实施」；未开始 5「验收同步、合并、发布、发布后同步、结束」。本回执是 0.2.0 并行后端的首批交付：盘点服务端已可消费的能力契约、确认原证据仍有效的范围、列明真实剩余项；不含新代码修改，不替代任何正式验收。

## 可消费提交与代码事实

- Server 任务分支 `codex/0.2.0-tenant-form-flow`，HEAD `1b1f5f76627bf7b3ca885b39f39655a1f1a58cfa`，与 `origin` 同 SHA（已推送回读一致），工作树干净。该提交即中间 UI 验收使用的后端快照，前端按此提交消费。
- 本回执全部端点与字段从该提交源码核实，核实位置见文末路径清单；行为证据沿用各原回执及其 `C:/Users/hjxch/.codex/evidence-020/` 证据根。

## 通用契约约定

- 响应包络 `R<T>`：`{code, msg, data, errorKey?, eventRef?}`；成功 `code=0`；业务拒绝 `code≠0`，`msg` 为可展示中文；技术诊断走 `errorKey`/`eventRef` 与服务端日志，不进前端文案。
- Long 主键全局序列化为字符串（`JacksonLongToStringConfig`，Spring MVC Jackson 统一生效）；Flowable 任务/实例/记录 ID 本身即字符串，前端按字符串处理。
- 操作者身份来自登录态；目标租户按资源路径定位（如 `/system/tenant/{id}`），业务数据由服务端按登录态租户过滤，前端不传租户参数；跨租户一律 403/受控拒绝（a16-end-to-end-visible-01 已有真实拒绝证据）。
- 秘密不回显：数据源密码 AES-256-GCM 加密存储、`@JsonIgnore` 不进响应；租户初始密码仅入参。

## 已可消费的接口契约

### 租户管理（T020；权限 `system:tenant:list`）

| 方法/路径 | 语义 |
| --- | --- |
| `GET /system/tenant/page?pageNum&pageSize&name&status` | 分页列表，支持名称/状态筛选 |
| `GET /system/tenant/{id}` | 详情 |
| `POST /system/tenant` | 创建 `{name, adminUsername, adminPassword, requestId}`；`requestId` 为幂等键，重复稳定请求不生成第二套租户/根部门/管理员/授权模板 |
| `PUT /system/tenant/{id}` | 改名 `{name}` |
| `PUT /system/tenant/{id}/status` | 启停 `{status, reason}`，reason 必填 |
| `GET /system/tenant/{id}/status-audits` | 启停/过期审计 |
| `GET /system/tenant/{id}/administrators` | 管理员候选 |
| `PUT /system/tenant/{id}/administrator` | 指派既有管理员 `{adminUserId}` |
| `POST /system/tenant/{id}/administrator` | 新建管理员 `{adminUsername, adminPassword}` |

存量歧义显示未配置，由超管显式维护；密码不回显。T020 01—08 的原子创建、身份、准入与审计行为证据见原回执，仍然有效。

### 受控数据源（F020；管理 `workflow:datasource:manage`、执行 `workflow:datasource:execute`）

注意路径前缀差异：管理接口带 `/api`，表单查询契约不带。

| 方法/路径 | 语义 |
| --- | --- |
| `POST /api/workflow/external-datasource` | 创建 `{name, type, jdbcUrl, driverClass, username, password, readOnly=1, enabled=1}`；`type` ∈ postgresql/mysql/h2/oracle，驱动类必须匹配类型，JDBC URL 内嵌 `user=`/`password=` 直接拒绝 |
| `PUT /api/workflow/external-datasource/{id}` | 更新；`password` 留空保留原密文，非空即重加密（轮换入口） |
| `DELETE /api/workflow/external-datasource/{id}` | 逻辑删除 |
| `GET /api/workflow/external-datasource/{id}`、`GET …/page?name&enabled` | 详情/分页；响应无密码与密文字段 |
| `POST /api/workflow/external-datasource/execute` | `{datasourceId, sql}` 只读执行，超限返回 `EXT_RESULT_LIMIT_EXCEEDED` 语义 |
| `POST /form/ext/query-contract` | 登记/升版本查询契约 `{datasourceId, queryKey, sql, outputFields:[{name,type}]}`（权限 `form:design:save`）；`queryKey` 匹配 `[a-z][a-z0-9_]{0,63}`；内容完全相同幂等复用当前版本，变更即升版本 |
| `GET /form/ext/query/{queryKey}?version=` | 设计预览与运行读取同一入口（`form:design` 或 `form:data:query`）；契约停用/未知/版本不存在返回可判定失败；仅 SELECT、行数上限、限时、租户隔离 |

表单 definition 的 `dsBinding` 只存 `queryKey/version/valueField/displayField`，SQL、连接串、秘密不出服务端；提交期对象解析失败返回 `EXT_OBJECT_NOT_FOUND`，预览无业务写副作用。

### 表单定义、权限与默认列表（F020；`/form/def`）

- `POST /form/def` 新建、`PUT /{id}` 保存 definition（含字段/动作权限、事件、校验键）、`POST /{id}/config`、`POST /{id}/publish`、`POST /{id}/publish-version`、`POST /{id}/disable|enable`、`PUT /{id}/visibility`（均 `form:design:save`/`form:design:publish`）。
- `PUT/GET /{id}/list-config`：管理员默认列表（列选择与排序、筛选字段、默认排序列与方向、开放操作），存既有 `sw_form_list_config`；个人显示偏好不在此入口。
- 权限主体约定 `role:编码`、`user:ID`、`dept:ID`；动作集 `view/create/edit/delete/export/import/flowStart`；服务端在查询、新增、更新、删除、导入/导出入口读同一动作权限，配置不可读 fail closed。

### 表单数据（F020；`/form/data`）

`POST /form/data/{formKey}/query`（`form:data:query`）、`GET /form/data/{formKey}/{recordId}`（`form:data:query`）、`PUT /form/data/{formKey}/{recordId}`（`form:data:edit`）；子表查看投影与编辑权按 `TABLE字段.子字段` 生效（f020-form-config-01 行为证据仍有效）。

### 校验与草稿（F020 已交付部分）

文本/富文本最小长度、线性时间正则、自定义错误提示，Unicode 按码点计数；服务端在创建、更新、正式提交和导入共用的字段校验器复核（`FormFieldValidator`，TEXT 与 RICH_TEXT 同规则）；无值只由必填规则控制，草稿不提前触发正式必填。RICH_TEXT 物理存储 H2 CLOB / PG TEXT，服务端原样字符串存储，无独立 HTML 净化路径；值格式与降级解释需与前端对齐后在本系列回执补充。

### 流程定义与节点能力（设计器对接；`/workflow/defs`）

- `GET /workflow/defs/node-capabilities`（`workflow:def:view`）→ `[{type, displayName, description, category, topology, configFields, version, supports{design,validate,translate,runtime}, startNode, endNode, systemManaged, deletable}]`。前端节点库按该清单渲染；未注册类型不得宣称可用。
- 当前注册 11 类：`START`、`END`、`CONDITION`、`PARALLEL_GATEWAY`、`APPROVAL`、`CONSENSUS`、`DYNAMIC_PARALLEL`、`COPY`、`NOTIFICATION`、`SUBFLOW_WAIT`、`TXN_ACTION`。
- `POST /{id}/publish`、`POST /{id}/validate`、`GET /{id}/versions`、`POST /{id}/versions/{version}/suspend|activate`（版本挂起只阻止该版本新发起，已绑定实例继续办理）。
- `POST /{id}/iot-access/{flag}`（仅已发布定义可开启 IoT 接入）、`POST /{id}/iot-device-action`（设备动作配置：三类设备来源+失败策略）。
- `GET /workflow/defs/approver-candidates?keyword=`：审批人候选，仅 id/username/realName 脱敏字段。
- `POST /workflow/scripts/preview`（`workflow:def:design`）：脚本服务端模拟，与运行同引擎（`/workflow/scripts` 前缀）。

### 办理、意见暂存与加签（W020；`/workflow`）

- 加签：`POST /workflow/tasks/{taskId}/add-sign`（`workflow:task:add-sign`），关键字段 `{participants:[Long…], signPosition: BEFORE/AFTER, mode: SERIAL/PARALLEL, comment, opinionFormId, opinionFormVersion, opinionData}`；默认前加签+并行；旧请求缺位置字段保持前加签语义；早办/重复/越权拒绝或幂等。
- 待确认表态：`GET /workflow/sign/pending`、`POST /workflow/sign/{recordId}/express`、`POST /workflow/sign/{recordId}/cancel`；串行前序未完成时禁止后续表态。
- 终态补签：`POST /workflow/instances/{instanceId}/supplement-sign`；不改原终态/历史（w020-approval-draft-sign-09 行为证据仍有效）。
- 意见暂存：`GET/PUT/DELETE /workflow/tasks/{taskId}/opinion-draft`；绑定租户/实例/任务/节点轮次/办理人/意见表单版本；允许未完必填，不完成任务、不通知、不触发提交事件；本人恢复，他人/跨租户/终态改写拒绝。
- 授权代理：`POST /workflow/authorize-rules`（`workflow:def:design` 或 `workflow:task:authorize`）、`GET /workflow/authorize-rules`、`DELETE /authorize-rules/{ruleId}`；含人员、时间、流程范围及循环/租户/停用校验。
- 撤回/废弃：`POST /workflow/my/instances/{instanceId}/withdraw`（`workflow:task:withdraw`）、`POST /workflow/instances/{instanceId}/discard`（`workflow:task:discard`，必须原因）。
- 转移/委托/沟通：`POST /workflow/tasks/{taskId}/transfer|delegate|communicate`（各自既有权限）。

## 原证据仍有效的范围（前端直接承接，后端不重做）

T020 01—08（原子创建、管理目标隔离、会话/工作准入、持久认领、MQTT 恢复、后台审计）、F020 首批（f020-form-config-01，提交 dc7b9376 已含于当前分支）、J020 两份（事件定义闸门、快照冻结、统一监听）、W020 三份（版本挂起、意见暂存、四种加签、终态补签）、a16-end-to-end-visible-01（同表单到审批完成、跨租户拒绝）、u020-attachment-access-19（1b1f5f7 即该修复提交）、u020-readonly-controls-20 的服务端事实，在 `1b1f5f7` 全部有效。

## 真实剩余项（后端，按优先级）

1. **数据源授权主体**：direction-020 要求「设计人员仅能引用已授权的稳定数据源/查询标识」；当前只有管理/执行权限位，无授权绑定模型与 API。实现方向：授权绑定（数据源/契约 → 主体 role/user）+ 授予/撤销/清单接口 + 契约登记与预览引用校验。
2. **查询契约列表/启停**：当前无契约列表与启停端点（登记恒 `enabled=1`，无停用路径，仅 `resolveEnabled` 消费停用语义）。补列表 + 启停切换，停用后预览/运行返回既有 `EXT_QUERY_DISABLED` 语义。
3. **密钥轮换边界**：`PUT` 非空密码即重加密，「必要更新」已支持；独立的全量密文重加密（密钥版本化轮换）属新增语义，如需要报 Planner 裁量。
4. **J020 真实受控集成证据**：函数目录「受控集成」需要服务端授权与真实调用证据链（现有 `/form/ext/query` 为运行入口）。
5. **统一监听新旧配置的真实副作用覆盖**：服务端行为测试按覆盖补齐；可见浏览器验证由前端承担。
6. **节点库三项映射（需 Planner 裁量）**：
   - `起草`：系统已有「我的草稿」（`/workflow/drafts`，业务发起草稿），与流程图节点无关；图中「起草」节点的语义（发起人填写/提交）当前由表单提交+`START` 承担，无独立图节点语义。需 Planner 决定：按 START 渲染、注册新节点类型，还是维持无此节点。
   - `IoT指令`：既有受控链路是定义级 `iot-access` 开关 + `iot-device-action` 配置 + `/workflow/commands/tasks/{taskId}/{action}` 任务级命令下发，不是图节点。可复用既有设备动作语义；注册为独立节点类型（拓扑/配置/运行支持）需产品语义授权。
   - `Agent`：`sw-basic-agent` 有会话/消息/工具调用基础设施，BPM 侧无任何流程节点语义。真实差距，需 Planner 定义产品语义后另行实施。
7. **富文本值格式对齐**：服务端原样字符串存储；与前端确认既有值格式、可编辑内容与降级解释后补充契约。

## 脱敏样例

创建租户（幂等）：

```json
POST /system/tenant
{"name":"示例租户","adminUsername":"tenant1_admin","adminPassword":"<初始密码>","requestId":"req-20261024-0001"}
→ {"code":0,"msg":"success","data":"1932000000000000001"}
```

登记查询契约：

```json
POST /form/ext/query-contract
{"datasourceId":"1932000000000000009","queryKey":"asset_list","sql":"SELECT asset_id AS value, asset_name AS display FROM asset WHERE status = 1","outputFields":[{"name":"value","type":"string"},{"name":"display","type":"string"}]}
→ {"code":0,"msg":"success","data":{"queryKey":"asset_list","version":1}}
```

前加签（串行两人）：

```json
POST /workflow/tasks/6d12957d-ce86-11f1-88e6-00ff9e2a8dfb/add-sign
{"participants":["2113516345554395138","2113516345554395139"],"signPosition":"BEFORE","mode":"SERIAL","comment":"请先会审"}
→ {"code":0,"msg":"success"}
```

意见暂存：

```json
PUT /workflow/tasks/6d12957d-ce86-11f1-88e6-00ff9e2a8dfb/opinion-draft
{"opinionFormId":"form_xxxx","opinionFormVersion":"2","comment":"先存一版","opinionData":{"field_1":"2"}}
→ {"code":0,"msg":"success"}
```

## 与前端的待对齐项

1. 富文本既有值格式与降级解释（第 6 节剩余项）。
2. 「起草」等三项节点的 Planner 裁量结果；裁量前前端不得宣称三节点可用。
3. 数据源管理页对接：管理接口带 `/api` 前缀；授权主体、契约列表/启停接口待本侧实现后另行回执。

## 证据位置

端点与字段核实自 Server `1b1f5f7` 源码（工作区 `E:/code/Smart-WorkFlow-Agent-Workspace/Smart-WorkFlow-aPaaS-server/`）：`TenantController`、`TenantContextController`（`GET /system/tenant-context/current|options`）、`ExternalDatasourceController`、`FormExtDataController`、`FormDefinitionController`、`FormDataController`、`FormDataQueryController`、`BpmProcessDefController`、`BpmLifecycleController`、`BpmTaskOpinionDraftController`、`BpmCommandController`、`BpmScriptPreviewController`、`BpmNodeRegistryImpl` 与 `translator/`、`FormFieldValidator`、`VendorDialect`、`ExternalDatasourceServiceImpl`。行为证据沿用原回执及 `C:/Users/hjxch/.codex/evidence-020/`。本回执无代码修改、无新增验证运行，不引用其作为新的测试结论。

授权内常规决定：回执写入本目录 `receipts/backend/`，根仓不由后端提交（前端集成负责人统一收尾）。
