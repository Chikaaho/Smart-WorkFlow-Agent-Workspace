# 探索任务回执：功能清单（PRD）全量对照审计

- **任务来源**：`search_task/feature-checklist-full-audit.md`
- **执行日期**：2026-08-12
- **执行方式**：按模块拆分 4 个并行 Sub Agent 核实（M01-M03 / M04-M06 / M07 / M08-M10），本文件为统一汇总；关键高影响结论已由汇总层现场复核（见文末注）
- **核对声明**：**已核对 89/89 条**（M01 13 + M02 7 + M03 8 + M04 9 + M05 4 + M06 4 + M07 14 + M08 13 + M09 8 + M10 9）
- **判定标准**：后端 = Controller/Service/Mapper + 覆盖该功能的单测；前端 = 组件/页面 + 路由可达；任一端明确未实现不标 ✅，部分实现按 🟦 并注明"仅后端"/"仅前端"
- **无法判定条目**：0 条（89 条全部与代码一一对应）
- **模块无代码情况**：无目录缺失；`sw-basic-iot` / `sw-biz-openapi` / `sw-basic-knowledge` 为骨架（详见文末附注），与清单 ⬜ 一致

---

## 问题 1：逐模块状态核实差异表（34 条不一致）

### M01 组织架构（5 条）

| ID | 清单当前标记 | 代码真实状态 | 证据（文件路径/端点/组件名） |
|----|:---:|:---:|---|
| M01-F01-04 部门查询 | ✅ | 🟦 仅全量树查询，无条件筛选 | `DeptController.java` 仅 `GET /system/dept/tree`；`SysDeptServiceImpl.listTree()` 无任何筛选参数 |
| M01-F02-01 人员新增 | ✅ | 🟦 仅关联部门，岗位/角色关联未实现 | `UserController.UserFormRequest` 仅 deptId/username/realName/email/phone/sex/status/plainPassword；全仓无 sys_user_post 关联表与接口 |
| M01-F02-02 人员修改 | ✅ | 🟦 "账号启用/停用"不生效 | `AuthController.login()` → `UserDetailsProviderImpl.loadByUsername/toLoginUser()`（L55-123）不校验 `SysUser.status`，停用用户仍可登录签发 token（**汇总层已现场复核**） |
| M01-F02-04 人员查询 | ✅ | 🟦 条件查询未实现，仅分页 | `SysUserServiceImpl.page()` 返回 selectPage 忽略查询条件；前端 `UserList.vue` username/status 筛选发出但不生效 |
| M01-F03-01 岗位管理 | ✅ | 🟦 CRUD 完整，但"人员与岗位关联"未实现 | `PostController` + `PostControllerTest`(6)；无用户-岗位关联表/接口，`UserList.vue` 表单无岗位字段 |

### M02 权限控制（2 条）

| ID | 清单当前标记 | 代码真实状态 | 证据（文件路径/端点/组件名） |
|----|:---:|:---:|---|
| M02-F01-01 角色管理 | ✅ | 🟦 CRUD 完整，但"角色与人员/用户组绑定"未实现 | `RoleController` + `RoleControllerTest`(6)；`RoleList.vue` 仅 CRUD 弹窗无绑定入口；sys_user_role 无写入端点（仅 `UserDetailsProviderImpl`/`SysMenuServiceImpl` 读取） |
| M02-F04-01 数据权限 | 🟦 | ⬜ 实质未实现，仅枚举/字段占位 | `DataScope` 枚举 + `LoginUser.dataScope` 字段存在，但 `UserDetailsProviderImpl` L111 **硬编码 `setDataScope(DataScope.ALL)`**（**汇总层已现场复核**）；`SysRole.dataScope` 注释"S7 预留，当前不生效"；全仓无数据范围过滤逻辑，前端无配置页 |

### M03 低代码表单（3 条）

| ID | 清单当前标记 | 代码真实状态 | 证据（文件路径/端点/组件名） |
|----|:---:|:---:|---|
| M03-F01-02 控件库 | ✅ | 🟦 8/16 类可用，多选/附件/图片/说明文字未实现 | `FieldType.java` 仅 TEXT/RICH_TEXT/NUMBER/DATE/BOOL/DICT/REFERENCE/TABLE enabled=true；MULTISELECT/ATTACHMENT/IMAGE/LABEL/EMAIL/PHONE/URL/RATE/SLIDER 均 enabled=false（"本刀不实现"）；前端 palette `field-types.ts` 仅 8 项 |
| M03-F02-01 表单管理 | ✅ | 🟦 新增/修改/查询/发布完整，"删除"未实现、版本仅存快照 | `FormDefinitionController.java` 9 个端点无 `@DeleteMapping`；`form-def.ts` 无删除 API，`FormDefList.vue` 无删除；版本=发布时写 `FormSnapshotEntity` 快照，无历史列表/回滚端点 |
| M03-F04-01 数据管理 | ✅ | 🟦 增删改查闭环完整，但"列表配置、查询条件配置"仅自动派生 | `/api/form/data/{formKey}` submit/query/GET/PUT/DELETE 齐全 + `FormData.vue`；列与筛选条件由 `derive-list-config.ts` 从 schema 自动派生，无持久化/手动配置 UI |

### M04 流程引擎（4 条）

| ID | 清单当前标记 | 代码真实状态 | 证据（文件路径/端点/组件名） |
|----|:---:|:---:|---|
| M04-F01-01 流程设计器 | ⬜ | 🟦 仅后端（前端无拖拽设计页） | 后端图模型链路完整：`BpmProcessDefController`（`/workflow/defs` CRUD + `POST /{id}/publish` + `/{id}/validate`）、`GraphToBpmnTranslator`、`GraphValidator` + 单测；前端 bpmn-js 仅只读 Viewer（`adapters/bpmn/index.ts`），`ProcessDefList.vue` 注释明示"不提供创建/编辑/删除/发布操作（非本功能范围）"，无设计器路由；节点类型仅 START/END/APPROVAL（`NodeTypeRegistry.java`），无并行网关/子流程 |
| M04-F01-02 节点配置 | ⬜ | 🟦 仅后端，且仅 1/7 种审批人类型 | `NodeApproverType`（DESIGNATED + SCRIPT 桩）、`DesignatedApproverResolver`、`ApprovalTaskListener`（取首个 userId 设单人 assignee）；角色/岗位/部门主管/上级/表单字段/发起人自选均无代码，前端无节点配置 UI |
| M04-F03-01 流程发起 | 🟦 | ✅ 完整实现 | `ProcessStartService`（查绑定→解析审批人→startProcess→实例落库）+ `FormSubmittedEventListener`（监听表单提交 AFTER_COMMIT 触发）+ `ApprovalProcessIntegrationTest`/`BpmInstanceServiceImplTest` |
| M04-F06-01 流程监控 | ⬜ | 🟦 前后端均部分实现 | 流程图高亮+流转记录已实现：`BpmInstanceController` `GET /workflow/instances/{id}`（activeNodeIds + flowTrace）、`BpmRuntimeFacadeImpl`、前端 `ProcessInstanceList.vue`（bpmn-js 高亮 + 流转时间线，静态路由可达）；耗时分析仅 time 展示无统计端点；**流程干预完全无**（Facade 无 terminate/改派等写操作） |

### M05 站内信（3 条）

| ID | 清单当前标记 | 代码真实状态 | 证据（文件路径/端点/组件名） |
|----|:---:|:---:|---|
| M05-F01-01 消息发送 | ⬜ | 🟦 仅后端，发送已实现但仅单用户 | `NotifyFacadeImpl.send()` 落库 sw_notify_message + `BpmNotifyListener` 消费 TODO_CREATED/PROCESS_APPROVED 触发；`SendNotifyCommand` 仅 recipientId 单用户，**无部门/角色定向**；`NotifyController` 无手动发送端点，前端 `NotifyHome.vue` 无发送入口 |
| M05-F01-02 消息接收 | ✅ | 🟦 缺"删除" | `NotifyController` `GET /notify/messages` + `POST /notify/messages/{id}/read`（越权校验）+ `NotifyHome.vue`（已读/未读）；**无删除端点与删除按钮** |
| M05-F01-03 消息查询 | ✅ | 🟦 无状态/关键字过滤 | `NotifyMessageServiceImpl.findByRecipient()` 仅按 recipientId 全量倒序；前端 `queryNotifyMessages()` 无过滤参数，页面无查询条件 UI |

### M06 系统通知（1 条）

| ID | 清单当前标记 | 代码真实状态 | 证据（文件路径/端点/组件名） |
|----|:---:|:---:|---|
| M06-F04-01 发送记录 | ⬜ | 🟦 仅消息落库雏形 | `NotifyMessage`（sw_notify_message 表含 read）+ `NotifyControllerIntegrationTest`(4)；**无发送状态字段、无失败重发**，非多渠道发送日志体系 |

### M07 AI智能助手（11 条）

| ID | 清单当前标记 | 代码真实状态 | 证据（文件路径/端点/组件名） |
|----|:---:|:---:|---|
| M07-F01-01 模型接入 | ⬜ | 🟦 仅后端 | `AgentModelController`（`/agent/models` GET 分页/GET {id}/POST/PUT/DELETE 全 CRUD）+ `AgentModelConfigServiceImpl`；测试 ControllerTest(4)+ServiceImplTest(12)；前端无模型管理页面/菜单（仅 `listModelOptions()` 供设计器下拉） |
| M07-F01-02 动态装载 | ⬜ | 🟦 仅后端（隐式实现） | 全模块无缓存，每次请求 `mapper.selectById` 读库（`AgentOrchestrationServiceImpl.run` L124）→ 配置变更即时生效无需重启；但**无显式"加载/卸载"API**，`AgentModelConfigServiceImpl` javadoc 遗留 Step1 注释"本 Step 明确不做" |
| M07-F01-03 参数配置 | ⬜ | 🟦 仅后端 | `AgentModelConfig`（temperature/maxTokens/topP/timeoutSeconds/retryCount）+ `ChatModelFactory`（openai/ollama 参数生效、`buildRetryTemplate` 重试）；前端无配置表单 |
| M07-F01-04 密钥管理 | ⬜ | 🟦 仅后端 | `AesGcmCipher`（AES-GCM）加密落库、DTO 返回 apiKeyMasked；V24 多 Key 迁移（group_key/sort/locked_until/quota_cooldown_seconds）+ `AgentOrchestrationServiceImpl` 候选切换循环（`findNextCandidate` L361、L429 锁定持久化）；测试用例 9-14 |
| M07-F01-05 连通性测试 | ⬜ | 🟦 仅后端 | `AgentModelController` `POST /agent/models/{id}/test-connection` + `testConnection`（openai `/models`/ollama `/api/tags` 探测、5s 超时）；测试 4 用例；前端无入口 |
| M07-F02-01 图设计器 | ⬜ | ✅ 前后端已实现 | `GraphDesigner.vue`（vue-flow 经防腐层 `adapters/flow-graph/index.ts` 拖拽，节点 LLM/TOOL/CONDITION/LOOP/FORK/JOIN）+ 静态路由 `agent/graph-designer/:id`（`router/index.ts:58`）+ `GraphDesigner.spec.ts`(17)；后端 `AgentGraphInterpreter` 支持 5 类业务节点 |
| M07-F02-02 节点配置 | ⬜ | 🟦 部分实现 | 变量映射/上下文传递有（`AgentGraphInterpreter` CONFIG_KEY_INPUT_VAR/OUTPUT_VAR + 设计器属性面板）；**"节点 Prompt 配置"无**——前后端均无 prompt 键（graphAdapter 键清单、属性面板均无 Prompt 输入） |
| M07-F02-03 图管理 | ⬜ | ✅ 前后端已实现 | `AgentGraphDefController`（POST/PUT 草稿/publish/DELETE/分页）+ `AgentGraphDef.defVersion` 版本递增；测试 ControllerTest(17)+ServiceImplTest(13)；`GraphDefList.vue` + `GraphDefList.spec.ts`(8)；菜单 seed `h2/V26__agent_graph_menu_seed.sql` id=15「图定义管理」挂「智能体」id=7 目录下（**汇总层已现场复核**） |
| M07-F02-04 调试运行 | ⬜ | 🟦 部分实现（仅后端历史 + 设计器单次执行） | `POST /agent/graph-defs/{id}/execute` + `AgentGraphExecutionController`（`GET /agent/graph-executions` 分页/`/{id}`/`/{id}/nodes`）+ V27/V28 双表 + 测试(30)；**前端确认无"运行日志查看"页面**（前端零处消费 `/agent/graph-executions`，`GraphDesigner.vue` L326-341 仅"执行"按钮单次返回最终结果）；**单步调试确认未做**（前后端均无 debug/单步代码） |
| M07-F03-02 工具/函数调用 | ⬜ | 🟦 仅后端 | `AgentToolConfigController` `/agent/tool/internal|external` 全 CRUD+toggle；`AgentToolCallbackFactory`（Spring bean 方法 + 外部 HTTP 回调、超时 30s、`recordToolCall` 落 `AgentToolCallLog`）；测试 ControllerTest(4)+ServiceImplTest(7)+CallbackFactoryTest；前端仅设计器 TOOL 节点只读下拉 |
| M07-F04-02 会话管理 | ⬜ | 🟦 部分实现（仅后端基础） | `AgentSession`/`AgentMessage`（V21/V22）+ GET 列表/消息端点 + orchestration run 自动建会话存消息 + MapperTest；`AgentToolCallLog`（V23）调用审计；**无 Token 统计**（Session/Message/DTO 均无 token 计数字段）；前端无会话管理页面 |

### M09 开放接口（1 条）

| ID | 清单当前标记 | 代码真实状态 | 证据（文件路径/端点/组件名） |
|----|:---:|:---:|---|
| M09-F06-01 在线文档 | ⬜ | 🟦 仅后端 | springdoc-openapi-starter-webmvc-ui（`sw-bootstrap/pom.xml` L156-157）+ `/swagger-ui.html` 放行（`application.yml` L158-159、L209-212 springdoc.swagger-ui.path）；无前端页面、无 M09 应用管理/鉴权上下文 |

### M10 系统运维（4 条）

| ID | 清单当前标记 | 代码真实状态 | 证据（文件路径/端点/组件名） |
|----|:---:|:---:|---|
| M10-F01-01 系统监控 | ⬜ | 🟦 仅后端基础端点 | spring-boot-starter-actuator（`sw-bootstrap/pom.xml` L114）+ `SecurityProperties.java` L22 放行 `/actuator/**`；**无任何服务器/JVM/Redis/在线用户监控代码与页面**（全仓无 monitor/online/jvm 类） |
| M10-F03-01 定时任务 | ✅ | 🟦 功能完整但生产菜单不可达 | 后端 `JobInfoController`（/job/info page/get/post/put/delete/pause/resume/trigger）+ `JobLogController` + `QuartzSchedulerService` + 3 个测试 + V17 建表；前端 `JobList.vue`/`JobLog.vue`+spec；**菜单仅 seeds.ts mock 注册，后端菜单 SQL（V6/V10/V15/V26）无 job 菜单行**（**汇总层已现场复核**）→ 生产环境前端菜单不可达 |
| M10-F06-01 文件存储 | ✅ | 🟦 功能完整但生产菜单不可达 | 后端 `StorageController`（/storage/files 上传/下载/列表/删除）+ MinIO/Local/COS/七牛 4 个真实 provider + 测试 + V16 建表；前端 `StorageList.vue`+spec；**后端菜单 SQL 无 storage 菜单行**（**汇总层已现场复核**）→ 生产环境前端菜单不可达 |
| M10-F08-01 接口管理 | ⬜ | 🟦 部分落地 | springdoc 接口文档已集成（同 M09-F06-01 证据）；**无接口调用监控**（全仓库无 API 统计拦截器/记录代码），无任何页面 |

---

## 问题 2：`todo/README.md` 与 `knowledge/known-issues.md` 覆盖度检查

### 差异中被 known-issues.md 覆盖的条目（2 条，均属"已知但决定暂不处理/待后续"性质）

| ID | 覆盖条目 | 记录内容 |
|----|---------|---------|
| M04-F01-01 流程设计器 | I3 | BPMN 设计器/Modeler 能力明确不在范围内（2026-07-25 bpmn-adapter 范围裁定）；本次核实确认前端仍无拖拽设计页，与 I3 记录一致 |
| M04-F06-01 流程监控 | I3 | "M04-F06 流程监控（Step 4）仍待后续"；本次核实确认部分实现（高亮+流转记录有，耗时分析/干预无），与 I3 的"仍待后续"表述一致 |

### 全新缺口（32 条：known-issues.md 与 todo/README.md 均完全未提及，此前规划层未记录）

**A. 清单标高需降级（13 条 ✅→🟦）——清单实际高于代码完成度：**
- M01-F01-04 部门查询、M01-F02-01 人员新增、M01-F02-02 人员修改、M01-F02-04 人员查询、M01-F03-01 岗位管理、M02-F01-01 角色管理（M01/M02 六条的共性：CRUD 骨架完整，但清单描述的"关联/筛选/启停"要素缺失）
- M03-F01-02 控件库（8/16）、M03-F02-01 表单管理（无删除/版本仅快照）、M03-F04-01 数据管理（配置仅自动派生）
- M05-F01-02 消息接收（缺删除）、M05-F01-03 消息查询（缺过滤）
- M10-F03-01 定时任务、M10-F06-01 文件存储（功能完整但生产菜单树未 seed，仅 mock 可达）

**B. 清单标高需降级（1 条 🟦→⬜）：**
- M02-F04-01 数据权限——实际仅枚举+字段占位，`UserDetailsProviderImpl` 硬编码 `DataScope.ALL`，全仓无过滤逻辑

**C. 清单标低需升级（3 条 →✅，正向差异）：**
- M04-F03-01 流程发起、M07-F02-01 图设计器、M07-F02-03 图管理——前后端全链完成且路由/菜单可达

**D. 清单标低需升级（15 条 ⬜→🟦，其中含功能要素缺失，需规划层关注）：**
- M04-F01-02 节点配置（仅 1/7 审批人类型）、M05-F01-01 消息发送（仅单用户，无部门/角色定向）、M06-F04-01 发送记录（雏形，无状态/重发）
- M07-F01-01~05 大模型管理全 5 条（仅后端，前端无管理页）、M07-F02-02 节点配置（**无 Prompt 配置字段**）、M07-F02-04 调试运行（**前端无运行日志页面；单步调试未做**）、M07-F03-02 工具/函数调用（仅后端）、M07-F04-02 会话管理（无 Token 统计）
- M09-F06-01 在线文档（springdoc 已集成）、M10-F01-01 系统监控（仅 actuator 放行）、M10-F08-01 接口管理（仅文档无监控）

### todo/README.md（暂不修复清单）检查结论

- T1-T10 现有条目均与本次差异无直接对应（均为其他模块的已知限制），**本次 34 条差异无一在暂不修复清单中**
- 差异中"已知延后"性质的条目（M04-F01-01、M04-F06-01）已由 known-issues I3 覆盖，不产生新的 todo 条目需求；是否将本次其他缺口纳入暂不修复清单，由规划层决策

### 特别提示：I1 复发

- known-issues **I1（功能清单状态与代码实际进度脱节）**标记"✅ 已修复（2026-07-24：feature-checklist-sync）"，但本次审计证明清单**再次过期**（89 条中 34 条不一致，距上次同步仅约 3 周、M07 全部 14 条仍标 ⬜）。规划层更新清单后，建议在 I1 或新条目记录本次审计与更新结果。

---

## 问题 3：清单本身格式/口径问题

1. **版本号/最后更新日期字段**：`功能清单.md` 全文 208 行，**无版本号、无最后更新日期字段**。头部仅注明"本文件由 `功能清单.xlsx` 转换生成，供 Claude Code / 实现模型读取与引用"；文件 mtime = **2026-07-24 21:41:22 +0800**（与 feature-checklist-sync 功能完成日期一致）。历次状态更新（2026-07-24 一次 + 本次审计发现的待更新）均无版本追溯锚点。
2. **`功能清单.xlsx` 存在性**：`find /data/reasonix/files -iname "*.xlsx"`（排除 `.git`/`.claude`/worktree）**零命中**——xlsx 不存在于仓库，`功能清单.md` 为唯一权威源，不存在"xlsx 比 md 更新"的权威源竞争问题。

---

## 附注

### 一致条目中的部分实现要点（非差异，供规划层参考）

- **M02-F02-01 菜单权限（🟦 一致）**：只读过滤链路完整（`GET /system/auth/menus`，sys_user_role→sys_role_menu→sys_menu），但无按角色配置菜单的写入 API 与菜单管理页
- **M02-F03-01 按钮权限（🟦 一致）**：权限标识加载 + `hasPermi` + 前端 v-perm 均在，但无配置 UI，且 sw-biz-system 全部 Controller 未加 `@PreAuthorize`
- **M02-F06-01 登录认证（🟦 一致）**：账密登录+双 token 完整；验证码/密码策略/登录失败锁定均为 SPI 空接口（注释明言"不内置任何实现、不在任何地方调用"）
- **M03-F01-01 拖拽设计（🟦 一致）**：拖拽闭环完整可用（VueDraggable），但栅格布局未实现（画布单列流式）
- **M03-F03-01 联动校验（🟦 一致）**：仅必填/类型/字典值域校验；显隐联动/默认值/计算公式均无
- **M04-F02-01 流程定义（🟦 一致）**：部署+版本字段+发布冻结检查；无版本列表/回滚、无挂起/激活
- **M04-F04-01 审批操作（🟦 一致）**：仅同意 + 驳回（驳回仅置 outcome 走完流程，非"驳回到指定节点"）；转办/委托/加签/抢办/撤回/终止全部无
- **M04-F05-01 待办中心（🟦 一致）**：待办/已办全链 ✅；"我发起的"部分（有接口+页面但不在菜单）；抄送我的/催办提醒无
- **M07-F03-01 助手配置（⬜ 一致）**：**零代码**——无 Assistant 实体/Controller/Service/Mapper；`AgentOrchestrationController` 单跳 agentic 调用 ≠ 助手配置
- **M07-F03-03 知识库（⬜ 一致）**：`sw-basic-knowledge` 仅 2 个配置类共 29 行，默认关闭（`sw.knowledge.enabled`），无上传/向量化/RAG 代码；kb-verification 仅为清单同步验证非 RAG 功能
- **M07-F04-01 对话窗口（⬜ 一致）**：`AgentConversationController` 仅 2 个 GET 查询端点，**无 POST 发送、无 SSE**（全模块 SseEmitter/Flux 零命中）；前端无对话页
- **M08 全 13 条（⬜ 一致）**：`sw-basic-iot` 为骨架——仅 `IotAutoConfiguration`（空 @AutoConfiguration 无 @Bean）+ `MqttProperties`（4 字段，无 QoS/SSL/TLS/心跳），pom 虽引入 spring-integration-mqtt/paho 依赖但全模块无 MQTT 收发代码；前端 `IotHome.vue` 为 BlankPage 占位
- **M09 其余 7 条（⬜ 一致）**：`sw-biz-openapi` 为纯空壳（api/biz 各仅 package-info.java）；前端 `OpenapiHome.vue` 为 BlankPage 占位
- **M10-F04-01 数据字典（✅ 成立）**：DictController 全量 CRUD + 测试 + 前端两页 + V10 菜单 seed 生产可达——本次唯一实打实 ✅ 且全链可达的条目
- **M10-F02-01/02、F05-01、F07-01（⬜ 一致）**：全仓无操作/登录/异常日志（sw_job_log 是任务执行日志，不属此类）、无 logger-manager.html、无系统参数、无备份恢复代码

### 判定口径说明

- M10-F03-01/M10-F06-01 的 ✅→🟦 依据任务判定标准中"前端路由可达（非仅代码存在但菜单不可达）"条款（生产菜单树 V6/V10/V15/V26 无 job/storage 菜单行，仅 dev:mock 的 seeds.ts 注册）。功能代码本身完整；若规划层对"菜单可达性"验收口径另有裁定，可再议。
- M07-F02-04 的"单步调试"在 `memory/handoff.md` 待办池有记录，但不属于 known-issues.md / todo/README.md 范畴，本回执按"全新缺口"上报。

### 汇总层现场复核（非 subagent 单方断言）

1. `h2/V26__agent_graph_menu_seed.sql` 确认 seed id=15「图定义管理」菜单（挂 id=7「智能体」目录）→ M07-F02-03 ✅ 成立
2. V6/V10/V15/V26 菜单 SQL 无 job/storage 菜单行 → M10-F03-01/M10-F06-01 降级 🟦 成立
3. `UserDetailsProviderImpl` L55-123 登录加载链路无 `SysUser.status` 校验 + L111 硬编码 `DataScope.ALL` → M01-F02-02、M02-F04-01 两条声明成立
