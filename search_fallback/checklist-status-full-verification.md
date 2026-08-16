# 探索任务回执：功能清单 90 行全量状态复核（I1 第三次复发检测）

- **任务来源**：`search_task/checklist-status-full-verification.md`（规划层派发，2026-08-16）
- **执行日期**：2026-08-16
- **执行方式**：按模块拆分 4 个并行 Sub Agent 核实（M01-M03 / M04-M06 / M07 / M08-M10），本文件为统一汇总；纯静态读码（find/grep/read），未执行任何编译/测试命令，未修改任何文件
- **核对声明**：**已核对 90/90 条**（M01 13 + M02 7 + M03 8 + M04 10 + M05 4 + M06 4 + M07 14 + M08 13 + M09 8 + M10 9）
- **判定标准**：后端 = Controller/Service/Mapper + 覆盖该功能的单测；前端 = 组件/页面 + 路由可达；任一端明确未实现不标 ✅，部分实现按 🟦 并注明"仅后端"/"仅前端"
- **无法判定条目**：0 条（90 条全部与代码一一对应）
- **状态一致率**：90/90 与清单状态列一致（**0 行不一致**）；2 条保留意见见 §3；新发现 1 项见 §4

---

## §1 逐模块复核总表（90 行）

### M01 组织架构（13 行）

| 功能编号 | 清单状态 | 实际状态 | 缺口/证据一句话 |
|----|:---:|:---:|---|
| M01-F01-01 部门新增 | ✅ | ✅ | 多级树构建全链成立（`DeptController.java:43-46` POST + `SysDept.parentId` + `DeptList.vue:279-288` 上级 tree-select） |
| M01-F01-02 部门修改 | 🟦 | 🟦 | 已有编辑（含 parentId/sort 输入框），缺**拖拽调整层级与排序**（无 draggable，`DeptList.vue:148/310`） |
| M01-F01-03 部门删除 | ✅ | ✅ | 子部门/在职用户双校验 + @TableLogic 逻辑删除（`SysDeptServiceImpl.java:45-60`） |
| M01-F01-04 部门查询 | 🟦 | 🟦 | **仅全量树查询无条件筛选**（`SysDeptServiceImpl.java:63-67` listTree 无条件；`DeptList.vue:6`「无筛选区」注释）——I31 仍成立 |
| M01-F01-05 负责人设置 | ⬜ | ⬜ | 零部分实现：SysDept 无 leader 列，全仓 grep 零命中 |
| M01-F02-01 人员新增 | 🟦 | 🟦 | **仅关联部门（且前端为手输 ID），缺岗位/角色关联**（`UserController.java:28-40` 无 post/role；全仓无 sys_user_post）——I32 仍成立 |
| M01-F02-02 人员修改 | ✅ | ✅ | 后端链路成立（update + 调岗=改 deptId；停用/锁定拒绝登录已修 I33）；**附新发现**见 §4（前端状态映射反转） |
| M01-F02-03 人员删除 | ✅ | ✅ | removeById 逻辑删除保留历史（`UserController.java:86-90`） |
| M01-F02-04 人员查询 | 🟦 | 🟦 | **仅分页，部门/岗位/关键字条件不生效**（`SysUserServiceImpl.java:61-65` page 忽略 query；`user.ts:33-35` 注释「后端接受但不使用」）——I34 仍成立 |
| M01-F02-05 批量导入导出 | ⬜ | ⬜ | 零部分实现（全仓无 easyexcel/POI/Workbook 引用、无导入导出按钮） |
| M01-F03-01 岗位管理 | 🟦 | 🟦 | 岗位自身 CRUD+筛选完整，**缺"人员与岗位关联"**（无 sys_user_post 表/接口）——I35 仍成立 |
| M01-F04-01 用户组管理 | ⬜ | ⬜ | 零部分实现（grep UserGroup/user_group 零命中） |
| M01-F05-01 租户/公司管理 | ⬜ | ⬜ | 有部分机制（sys_tenant 表+seed+TenantLineHandler 列级隔离），但**无 SysTenant 实体/Controller/管理页**——"维护"未实现，维持 ⬜（虚低边缘） |

### M02 权限控制（7 行）

| 功能编号 | 清单状态 | 实际状态 | 缺口/证据一句话 |
|----|:---:|:---:|---|
| M02-F01-01 角色管理 | 🟦 | 🟦 | 角色 CRUD+dataScope 完整，**缺"角色与人员/用户组绑定"写入入口**（sys_user_role 仅读无写）——I36 仍成立 |
| M02-F02-01 菜单权限 | 🟦 | 🟦 | 读路径已有（按角色过滤菜单树 `SysMenuServiceImpl.java:87`），**缺"按角色配置菜单可见范围"的绑定配置入口/页面**（sys_role_menu 无 insert；`AuthMeController.java:76`「未 seed sys_role_menu」） |
| M02-F03-01 按钮权限 | 🟦 | 🟦 | 读取+前端 v-perm/hasPerm+后端 @PreAuthorize 链路均有（`UserDetailsProviderImpl.java:244-256`），**缺按角色勾选按钮权限的配置入口** |
| M02-F04-01 数据权限 | ✅ | ✅ | 端到端成立（五档最宽+并集 `UserDetailsProviderImpl.java:51-56/131-134`、@DataScope 7 表、V30、`RoleList.vue:99-107` 五档下拉+部门树）——I37 修复闭环确认，遗留 I46 手写 SQL 不纳管为已知限制 |
| M02-F05-01 资源管理 | ⬜ | ⬜ | 鉴权执行机制已有（PermissionService/permit-urls/@PreAuthorize），但 **API 资源注册表+鉴权策略配置无实体/端点/页面**，维持 ⬜ |
| M02-F06-01 登录认证 | 🟦 | 🟦 | 账密登录闭环（双 token+状态校验 `AuthController.java:76-110`）；**验证码、密码策略、失败锁定仅 SPI 预留零实现**（CaptchaValidator 等注释「不在任何地方调用」） |
| M02-F06-02 单点登录 | ⬜ | ⬜ | 仅 SocialAuthenticationProvider SPI 预留位（注释「不内置任何实现」），无 OAuth2/企微钉钉代码——预留位不足以升 🟦 |

### M03 低代码表单（8 行）

| 功能编号 | 清单状态 | 实际状态 | 缺口/证据一句话 |
|----|:---:|:---:|---|
| M03-F01-01 表单设计器拖拽 | 🟦 | 🟦 | 拖拽设计已实现（`DesignerCanvas.vue:15` VueDraggable）；**栅格布局仅渲染端硬编码 2 列**（`FormRender.vue:397-398`），设计器无栅格配置 |
| M03-F01-02 控件库 | 🟦 | 🟦 | 清单列 12 类中 8 类可用（`FieldType.java:43-61` 8 enabled/9 disabled；`field-types.ts:48-110` 注册表 8 项）；**缺多选/附件/图片/说明文字**（子表单=TABLE、关联查询=REFERENCE 已实现）——I38 仍成立（数字应 8/17 见 known-issues 回执） |
| M03-F02-01 表单管理 | 🟦 | 🟦 | 新增/修改/发布/查询完整（9 端点无 @DeleteMapping）；**缺删除、版本仅快照无历史列表/回滚**——I39 仍成立 |
| M03-F03-01 表单规则 | 🟦 | 🟦 | 已有必填/类型/字典域校验（`FormFieldValidator.java`）；**缺显隐联动、默认值、计算公式**（schema 无 visibleIf/defaultValue 键） |
| M03-F04-01 数据管理 | 🟦 | 🟦 | 增删改查闭环完整（4 Controller 五端点）；**列表/查询条件配置仅自动派生**（`derive-list-config.ts`），无持久化/手动配置 UI——I40 仍成立 |
| M03-F04-02 导入导出 | ⬜ | ⬜ | 零部分实现（全仓库无 excel/导入导出端点/按钮） |
| M03-F05-01 数据源 | 🟦 | 🟦 | 已有数据字典（`DictConfig.vue:7-25` 真接）+表单引用两源；**缺外部数据源供下拉/级联**（bpm ExternalDatasourceController 为流程外部数据源，非表单侧） |
| M03-F06-01 打印模板 | ⬜ | ⬜ | 零部分实现（无 print/PDF/套打模板代码） |

### M04 流程引擎（10 行）

| 功能编号 | 清单状态 | 实际状态 | 缺口/证据一句话 |
|----|:---:|:---:|---|
| M04-F01-01 流程设计器拖拽 | 🟦 | 🟦（**偏宽松**，见 §3） | 后端图设计管线齐全（`BpmProcessDefController.java:55-179` create/saveDraft/validate/publish）；**前端无设计器路由**（workflow 仅 5 页），实际=查看器+后端图存储/校验/发布；缺设计器 UI 与条件/并行网关翻译（I3/D40 口径） |
| M04-F01-02 节点配置 | 🟦 | 🟦 | 已有什么：NodeApproverResolver SPI+Map 分发（指定人/发起人两档可用）；**缺角色/岗位/部门主管/上级/表单字段/发起人自选 6 种取值器**（`NodeApproverType.java:12-15` 仅 DESIGNATED+SCRIPT 桩） |
| M04-F01-03 会签规则 | ⬜ | ⬜ | 零部分实现（全 bpm 模块 grep 会签/multiInstance 零命中） |
| M04-F02-01 流程定义 | 🟦 | 🟦 | CRUD+发布部署+XML 查看齐全（`BpmProcessDefController.java:53-179`）；**缺版本管理**（def_version「本刀不递增」）**与挂起/激活** |
| M04-F03-01 流程发起 | ✅ | ✅ | 绑定表单发起闭环成立（`ProcessStartService.java:88-147` + `FormSubmittedEventListener.java:47-60` AFTER_COMMIT 触发）——无虚高 |
| M04-F04-01 审批操作 | 🟦 | 🟦 | 已有什么：同意+驳回（整流程结束型）；**缺驳回到指定节点/转办/委托/加签/抢办/撤回/终止**（全仓无 transfer/delegate/claim/withdraw） |
| M04-F05-01 待办中心 | 🟦 | 🟦 | 已有什么：待办/已办+任务详情+审批历史；**缺抄送我的、催办提醒、我发起的独立入口**（前端仅 status 过滤） |
| M04-F06-01 流程监控 | 🟦 | 🟦 | 已有什么：流程图实时高亮+流转记录（`BpmInstanceController.java:106-120` activeNodeIds+flowTrace、`ProcessInstanceList.vue:154-198` 高亮+时间线）；**缺耗时分析、流程干预**（与 process-monitoring 方向文档非目标一致） |
| M04-F07-01 流程规则 | ⬜ | ⬜ | 条件表达式/超时/自动审批均未实现（网关仅预留位无翻译器、SequenceFlow 无条件表达式） |
| M04-F08-01 可插拔机制 | ✅ | ✅ | D82 刚 PASSED 证据齐全：后端 translatorMap 注册表+NodeTypeTranslator SPI+4 预留位；前端 node-panel-registry/dynamic-field-registry/FIELD_TYPE_REGISTRY 三注册表全被消费——无虚高 |

### M05 站内信（4 行）

| 功能编号 | 清单状态 | 实际状态 | 缺口/证据一句话 |
|----|:---:|:---:|---|
| M05-F01-01 消息发送 | 🟦 | 🟦 | 已有什么：单收件人站内信发送（事件触发 `BpmNotifyListener.java:59-84`）+落库；**缺指定部门/角色批量发送、发送入口 UI**（SendNotifyCommand 仅单 recipientId）——I45 记录一致 |
| M05-F01-02 消息接收 | 🟦 | 🟦 | 已有什么：列表+已读/未读标记（越权校验）；**缺删除端点+删除按钮**（`NotifyController.java:59-105` 无 DELETE）——I41 仍成立 |
| M05-F01-03 消息查询 | 🟦 | 🟦 | **无状态/关键字过滤**（`NotifyMessageServiceImpl.java:19-25` 仅按收件人全量倒序）——I42 仍成立 |
| M05-F02-01 消息模板 | ⬜ | ⬜ | 零部分实现（notify 模块 grep template 零命中） |

### M06 系统通知（4 行）

| 功能编号 | 清单状态 | 实际状态 | 缺口/证据一句话 |
|----|:---:|:---:|---|
| M06-F01-01 通知渠道 | ⬜ | ⬜ | 仅休眠 SPI（NotifyTargetResolver 无任何消费方），邮件/短信/微信/企微/钉钉均未接入——休眠 SPI 不构成部分实现，⬜ 维持 |
| M06-F02-01 通知模板 | ⬜ | ⬜ | 零部分实现（无通知模板代码/表） |
| M06-F03-01 通知规则 | ⬜ | ⬜ | 触发规则为代码硬编码（BpmNotifyListener switch 映射）非用户可配置，⬜ 属实 |
| M06-F04-01 发送记录 | 🟦 | 🟦 | 已有什么：发送记录落库+按用户查询+已读状态；**缺发送状态字段（无 success/fail 列）、失败重发、管理侧全局发送日志**——I45 记录一致 |

### M07 AI智能助手（14 行）

| 功能编号 | 清单状态 | 实际状态 | 缺口/证据一句话 |
|----|:---:|:---:|---|
| M07-F01-01 模型接入 | 🟦 | 🟦 | **后端 CRUD 全量**（`AgentModelController.java:39-75`）；缺前端模型管理页（`AgentHome.vue` 为 BlankPage 占位，路由仅 graph-designer 一条） |
| M07-F01-02 动态装载 | 🟦 | 🟦 | 后端已实现（`ChatModelFactory.java:57` 每次运行按 DB 配置实时构造，变更即生效无需重启）；缺前端管理页 |
| M07-F01-03 参数配置 | 🟦 | 🟦 | 后端已生效（`AgentModelConfig.java:56-64` + `ChatModelFactory.java:82-90` 真实传入）；缺前端管理页（参数只能 API 配置） |
| M07-F01-04 密钥管理 | 🟦 | 🟦 | 密钥 AES-GCM 加密+多 Key 轮询+额度限流后端齐全（`AgentModelConfig.java:47-50/67-79`、`AgentOrchestrationServiceImpl.java:235-253`）；缺前端管理页 |
| M07-F01-05 连通性测试 | 🟦 | 🟦 | 后端已完成（`AgentModelController.java:73-75` POST /{id}/test-connection）；缺前端管理页（无测试按钮 UI） |
| M07-F02-01 图设计器 | ✅ | ✅ | 前后端齐全：8 类节点+6 面板注册表化（`GraphDesigner.vue:119-126`）+路由+V26 菜单 seed——抽查通过无虚高 |
| M07-F02-02 节点配置 | 🟦 | 🟦 | 已有输入/输出变量映射+上下文传递（`LlmPanel.vue:41-55`、`AgentGraphInterpreter.java:49-60`）；**缺 LLM 节点 Prompt 配置字段**（前后端均无 prompt 键）——I45 记录一致 |
| M07-F02-03 图管理 | ✅ | ✅ | 前后端齐全（`GraphDefList.vue` + `AgentGraphDefController.java:48-86` + defVersion 递增发布）；版本管理=递增+发布状态无回滚，属清单粒度内完成——抽查通过无虚高 |
| M07-F02-04 调试运行 | 🟦 | 🟦 | 已有后端执行历史持久化+查询端点（`AgentGraphExecutionController.java:37-54`、V27/V28）；**缺前端运行日志页**（graph-executions 三端点前端零消费）+ **单步调试**（无 step 接口）——I45 记录一致 |
| M07-F03-01 助手配置 | ⬜ | ⬜ | 零代码（全仓 grep assistant 无业务代码、无表/实体/Controller/前端页）——无虚低 |
| M07-F03-02 工具/函数调用 | 🟦 | 🟦 | 已有后端工具 CRUD+启停+Function Calling 回调工厂+调用日志（`AgentToolConfigController.java:43-129`、`AgentToolCallbackFactory`、V23）；缺前端工具配置管理页（ToolPanel 仅消费只读下拉） |
| M07-F03-03 知识库 | ⬜ | ⬜ | 零代码（`sw-basic-knowledge` 仅 2 个配置类骨架，无 RAG/vector/embedding）——无虚低 |
| M07-F04-01 对话窗口 | ⬜ | ⬜ | 零代码（无 SSE/Flux/SseEmitter，唯一入口为一次性请求响应 `AgentOrchestrationController.java:33-35`；前端无对话页）——无虚低（上下文记忆后端一半在 F04-02 侧，属会话管理范畴） |
| M07-F04-02 会话管理 | 🟦 | 🟦 | 已有历史会话持久化+查询接口+调用日志审计（V21-V23、`AgentOrchestrationServiceImpl.java:216-219`）；**缺 Token 统计**（Session/Message/ToolCallLog 及全部 DTO 均无 token 字段）+ **缺前端会话页**（查询端点前端零消费）——I45 记录一致 |

### M08 IoT（13 行）

| 功能编号 | 清单状态 | 实际状态 | 缺口/证据一句话 |
|----|:---:|:---:|---|
| M08-F01-01 原生MQTT配置 | ⬜ | ⬜ | 仅 MQTT 依赖+属性骨架（`IotAutoConfiguration.java:12-15` 空壳、`MqttProperties.java:7-13` 4 字段），无设备级配置/QoS/SSL/TLS/心跳 |
| M08-F01-02 腾讯IoT配置 | ⬜ | ⬜ | 零代码（清单 L160 自注「腾讯 IoT 接入路径待补全」I14） |
| M08-F01-03 连接管理 | ⬜ | ⬜ | 零代码（无 MqttClient/MqttConnectOptions 使用） |
| M08-F02-01 设备维护 | ⬜ | ⬜ | 零代码（iot 模块无 entity/controller，迁移目录仅 .gitkeep） |
| M08-F02-02 状态监控 | ⬜ | ⬜ | 零代码（同上） |
| M08-F03-01 Topic订阅 | ⬜ | ⬜ | 零代码 |
| M08-F03-02 发布配置 | ⬜ | ⬜ | 零代码 |
| M08-F04-01 按钮发送 | ⬜ | ⬜ | 零代码（无下发通道） |
| M08-F04-02 定时发送 | ⬜ | ⬜ | 零代码 |
| M08-F04-03 数据上报 | ⬜ | ⬜ | 零代码 |
| M08-F04-04 消息日志 | ⬜ | ⬜ | 零代码 |
| M08-F05-01 规则编排 | ⬜ | ⬜ | 零代码（无场景联动规则） |
| M08-F05-02 指令模板 | ⬜ | ⬜ | 零代码 |

### M09 开放接口（8 行）

| 功能编号 | 清单状态 | 实际状态 | 缺口/证据一句话 |
|----|:---:|:---:|---|
| M09-F01-01 应用维护 | ⬜ | ⬜ | 零代码（sw-biz-openapi 仅 2 个 package-info.java） |
| M09-F02-01 权限范围 | ⬜ | ⬜ | 零代码 |
| M09-F03-01 签名鉴权 | ⬜ | ⬜ | 零代码（AccessToken/防重放均无） |
| M09-F03-02 访问控制 | ⬜ | ⬜ | 零代码（IP 白名单无） |
| M09-F04-01 限流配额 | ⬜ | ⬜ | 零代码（QPS/配额/熔断无） |
| M09-F05-01 Webhook | ⬜ | ⬜ | 零代码 |
| M09-F06-01 在线文档 | 🟦 | 🟦 | 已有：框架级 springdoc 自动装配可出文档+调试页（`sw-bootstrap/pom.xml:156-157` + `application.yml:210-214` + 放行）；缺口：openapi 模块零业务接口、无分组/调试鉴权等专属配置——I45 已核实，🟦 成立 |
| M09-F07-01 调用日志 | ⬜ | ⬜ | 零代码 |

### M10 系统运维（9 行）

| 功能编号 | 清单状态 | 实际状态 | 缺口/证据一句话 |
|----|:---:|:---:|---|
| M10-F01-01 运行监控 | 🟦 | 🟦 | 已有：仅 actuator health/health,info,metrics,prometheus 端点（`sw-bootstrap/pom.xml:113-114` + `application.yml:197-204`）；**缺服务器/JVM/Redis/在线用户监控后端+前端页（全仓零代码）**——实为最薄 🟦（I45 口径） |
| M10-F02-01 日志查询 | ⬜ | ⬜ | 零代码（全仓无 oper_log/login_log 表与实体/控制器） |
| M10-F02-02 动态日志级别 | ⬜ | ⬜ | 零代码（logger-manager.html 不存在、无 loglevel 端点） |
| M10-F03-01 任务调度 | ✅ | ✅ | 证据完整成立：9 端点+Quartz+V17 双表+V29 生产菜单（id17-19）+JobList/JobLog——I43 闭环确认 |
| M10-F04-01 字典维护 | ✅ | ✅ | 证据完整成立（DictController 全 CRUD+V10 菜单+DictTypeList/DictDataList） |
| M10-F05-01 系统参数 | ⬜ | ⬜ | 零代码（无 SysConfig/sys_config 表） |
| M10-F06-01 文件存储 | ✅ | ✅ | 证据完整成立：5 端点+Local/MinIO/COS/Qiniu 4 provider+V16+V29（id16 菜单）+StorageList——I44 闭环确认 |
| M10-F07-01 备份恢复 | ⬜ | ⬜ | 零代码 |
| M10-F08-01 API管理 | 🟦 | 🟦 | 同 M09-F06-01：已有 springdoc 接口文档；**缺接口调用监控、管理页/菜单**——I45 口径 🟦 成立 |

## §2 I31-I45 对照结论

- **I31/I32/I34/I35/I36/I38/I39/I40/I41/I42**（M01-M03/M04-M06 组逐条复核）：全部仍与代码现状一致，无漂移。
- **I33/I37/I43/I44**（已修复）：修复证据均成立无回退（AuthController 双入口状态校验 / @DataScope 7 表+V30 / V29 菜单 4 行），但 I33 存在 UI 路径反转新发现（§4）。
- **I45**（虚低 15 条汇总）：M07 组确认其中 M07 各条（F01 前端管理页缺失、F02-02 无 Prompt、F02-04 单步调试未做）仍成立；M08-M10 组确认 M09-F06-01/M10-F08-01（springdoc）与 M10-F01-01（actuator）两条 🟦 依据与清单现状一致。
- **无新出入**：审计条目与代码现状本轮未发现 I31-I45 之外的清单标记失准。

## §3 保留意见（2 条）

1. **M04-F01-01 🟦 偏宽松**：「拖拽设计」本体（前端画布）不存在，🟦 完全依赖后端图存储/校验管线+BPMN 查看器（I3/D40 已记录设计器不在范围）。若按清单描述字面判定应更接近 ⬜；维持 🟦 系遵循既有口径。
2. **M06-F01-01**：存在休眠 SPI（NotifyTargetResolver 无任何消费方），不构成"部分实现"，⬜ 判定正确。

## §4 新发现（I31-I45 未覆盖，建议规划层登记）

**前端 status 语义与后端相反（高价值，建议登记）**：
- 前端 `UserList.vue:337-341`、`DeptList.vue:314-317`（及默认值 L104/L72）映射「正常=1/停用=0」；后端 `SysUser.java:41` 为「0=正常 1=停用 2=锁定」、`AuthController.java:189-194` 仅 status=0 放行、`SysDept.java:33` 为「0=正常 1=停用」。
- 后果：①UI 新建用户默认 status=1 → 后端判为停用，**UI 创建用户无法登录**；②UI 选「停用」(0) → 后端视为正常，**停用不阻断登录**——I33 的后端修复在 UI 路径被反转抵消；③部门新建默认 1 亦被后端视为停用。
- 对照：SysRole/SysPost 后端注释恰为「1=启用 0=停用」，前端映射与角色/岗位一致、与用户/部门相反——**属前端值映射错误而非注释漂移**。
- 不改变 M01-F02-02 清单 ✅ 判定（后端 API 链路正确），但 UI 路径存在实害，建议按后端口径（0=正常 1=停用 2=锁定）修正前端映射。

## §5 未确认事项

1. M09-F06-01 在线调试"可用"系静态推断（依赖+yml+security 放行三要素齐全），未实际启动验证运行时可用性；判定 🟦 不受影响。
2. 前端 569 计数为运行口径（静态 561，差值来自 tokens.spec.ts 循环展开）——详见 `baseline-static-recount.md` 回执，与本回执无冲突。
3. 全程未执行任何编译/测试命令，运行期行为（登录、渲染等）均为代码静态推断。
