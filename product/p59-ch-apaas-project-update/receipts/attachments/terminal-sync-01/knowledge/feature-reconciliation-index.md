# 功能映射索引（feature-reconciliation-index）

> 知识库全量整理（knowledge-full-reconciliation）产物；对账任务已 **COMPLETED（已确认，2026-09-04）**（`product/knowledge-full-reconciliation/receipts/planning-final-review-terminal-sync-02-passed.md`）。2026-09-04 P59（非业务功能统一交付）已核销；90 明细/56 审计唯一编号/54 I 集合不变。
> 本索引固化全量双向映射与独立范围说明：**90 项清单明细**、**56 个唯一 P 编号**、**54 条 I 编号**、**55 个审计 product 目录**；每个稳定 ID 均可定位。
> 41 是历史正式功能计数（P52—P58 等正式功能序列），**不是** product 目录数或 feature 文件数；本审计不增加业务功能。

## 0. 权威值（与 current-status/功能清单一致）

- 清单：10 模块、55 功能、90 明细；**✅34/🟦28/⬜28**（本轮五行 ⬜→🟦，其余 85 行不变）
- P：物理 57 行、唯一 56 编号（P48 总表/明细双入口同值；P13 已核销移除、P23 零引用备案）
- I：索引 54 条、区间 I1—I55 缺 I27（I27 缺行证据待定位，见 §5）
- product 审计目录：55（总 57 − governance − knowledge-full-reconciliation）
- 正式功能数：41（P58 为第 41 个，2026-09-04 已确认；本审计增量 0）
- P59：Owner 2026-09-04 新增统一交付编号（不在审计 56 唯一编号集合内），非新增业务功能、不映射清单明细，**已核销**（功能级 PASSED，见 `knowledge/features/p59-ch-apaas-project-update.md`）；上列审计计数保持原值

## 1. 90 项清单明细 ↔ 交付/P 编号 双向映射

### M01 组织架构（13 行）

| ID | 状态 | 映射交付 / P / I | 范围说明 |
|---|---|---|---|
| M01-F01-01 部门新增 | ✅ | system-mgmt-crud（第 2 个） | 已交付 |
| M01-F01-02 部门修改 | 🟦 | P44 | 拖拽层级/排序缺口 |
| M01-F01-03 部门删除 | ✅ | system-mgmt-crud | 已交付 |
| M01-F01-04 部门查询 | ✅ | department-query-filtering（第 22 个）/ I31 | 已交付 |
| M01-F01-05 负责人设置 | ⬜ | P26 | 未排期 |
| M01-F02-01 人员新增 | ✅ | user-org-association-query（第 21 个）/ I32 | 已交付 |
| M01-F02-02 人员修改 | ✅ | checklist-gap-hardening（第 12 个）/ I33 | 已交付 |
| M01-F02-03 人员删除 | ✅ | system-mgmt-crud | 已交付 |
| M01-F02-04 人员查询 | ✅ | user-org-association-query / I34 | 已交付 |
| M01-F02-05 批量导入导出 | ⬜ | P27 | 未排期 |
| M01-F03-01 岗位管理 | ✅ | user-org-association-query / I35 | 已交付 |
| M01-F04-01 用户组管理 | 🟦 | user-group-membership（第 25 个）/ P28 / I36 | 维护+成员绑定已闭环；流程/权限消费端未接 |
| M01-F05-01 租户/公司管理 | ⬜ | P29 | 未排期 |

### M02 权限控制（7 行）

| ID | 状态 | 映射交付 / P / I | 范围说明 |
|---|---|---|---|
| M02-F01-01 角色管理 | 🟦 | P1 已核销（2026-08-20）；其余范围独立待核 | 菜单/按钮已覆盖（P1 全部子项 I31/I36/F02/F03 已闭合核销）；该明细剩余缺口（角色管理完整维护范围）未完成，保持 🟦 |
| M02-F02-01 菜单权限 | ✅ | role-menu-permission-parity（第 26 个）/ P1 | 已交付核销 |
| M02-F03-01 按钮权限 | ✅ | role-menu-permission-parity / P1 | 已交付核销 |
| M02-F04-01 数据权限 | ✅ | data-scope-enforcement（第 13 个）/ I37 | 已交付；I46 手写 SQL 不纳管为已知限制 |
| M02-F05-01 资源管理 | ⬜ | P30 | 未排期 |
| M02-F06-01 登录认证 | ✅ | p45-login-security（第 37 个）/ P45 | 已交付核销 |
| M02-F06-02 单点登录 | ⬜ | P31 | 仅 SPI 预留 |

### M03 低代码表单（8 行）

| ID | 状态 | 映射交付 / P / I | 范围说明 |
|---|---|---|---|
| M03-F01-01 拖拽设计 | ✅ | p56-form-grid-layout（第 39 个）/ P56/P46 | P46 同一交付一并核销、单一计数 |
| M03-F01-02 控件库 | 🟦 | P2 / I38（8/17 控件） | 待修复 |
| M03-F02-01 表单管理 | 🟦 | P2 / I39（删除/版本） | 待修复 |
| M03-F03-01 联动校验 | 🟦 | P2 | 缺显隐联动/默认值/公式 |
| M03-F04-01 数据管理 | 🟦 | P2 / I40 | 列表/查询条件仅派生 |
| M03-F04-02 导入导出 | ✅ | form-data-import-export（第 36 个）/ P32 | 已交付核销 |
| M03-F05-01 数据源 | 🟦 | P2 | 外部数据源缺口 |
| M03-F06-01 打印模板 | ⬜ | P33 | 未排期 |

### M04 流程引擎（10 行）

| ID | 状态 | 映射交付 / P | 范围说明 |
|---|---|---|---|
| M04-F01-01 流程设计器拖拽 | 🟦 | P47 | 「前端无设计器路由（I3 按设计排除）」为 **P47 登记的旧实现结论（历史快照，未经本轮对账验证）**，不宣称当前已验证；M04-F01-01 ID 不被其他交付占用；当前事实以代码与后续规划为准 |
| M04-F01-02 节点审批人配置 | 🟦 | P58 已覆盖子集 | 通用选人（固定用户/角色/表达式/适配器）已实；岗位/部门主管/上级/表单字段待核 |
| M04-F01-03 会签规则 | 🟦（本轮 ⬜→🟦） | P34（开放未核销） | 已交付子集：ALL/ANY/RATIO 会签结算、独立意见、取消语义（P58）；剩余：原明细完整规则（含一票否决）覆盖待确认 |
| M04-F02-01 流程定义维护 | 🟦 | workflow-process-def-create + form-binding（X3 登记） | 创建/表单绑定子集已交付；部署/版本/挂起/激活未做 |
| M04-F03-01 流程发起 | ✅ | process-initiation（X3 登记） | 前端发起子集已交付 |
| M04-F04-01 流程审批 | 🟦 | P58 已覆盖子集 | 同意/驳回/退回+意见校验已实；转办/委托/加签/抢办/撤回/终止待核 |
| M04-F05-01 待办中心 | 🟦 | bpm-task-center + P4（开放） | 三类查询分列：我的待办（API/页面+可处理者过滤已存在，Owner 确认尚未完成）；我的已办（API/页面+历史处理人查询已存在，指定审批人 ASSIGNEE 缺失疑点待运行核实）；我发起的（可复用流程监控数据不能替代个人入口，专用入口缺失）；抄送我的查询/催办入口缺（抄送产生已有 P58 交付） |
| M04-F06-01 流程监控 | 🟦 | process-monitoring（第 11 个）+ bpmn-adapter | 首批 2/4；耗时分析/干预未做 |
| M04-F07-01 流程规则 | 🟦（本轮 ⬜→🟦） | P35（开放未核销） | 已交付子集：受控条件表达式、条件分支（P58）；剩余：超时处理、自动审批/自动通过规则 |
| M04-F08-01 可插拔机制 | ✅ | bpm-plugin-architecture（第 16 个） | 已交付 |

### M05 站内信（4 行，已落地 sw-basic-notify）

| ID | 状态 | 映射交付 / P / I | 范围说明 |
|---|---|---|---|
| M05-F01-01 消息发送 | ✅ | notify-batch-send（第 34 个）/ P3 子集 | 指定人/部门/角色、去重、上限、事务落库 |
| M05-F01-02 消息接收 | ✅ | notify-management-closure（第 32 个）/ I41 | 已读/未读/删除+越权校验 |
| M05-F01-03 消息查询 | ✅ | notify-management-closure / I42 | 状态+关键字过滤 |
| M05-F02-01 消息模板 | ✅ | notify-template-management（第 33 个）/ P36 | 变量渲染+落库前拒绝+租户隔离 |

### M06 系统通知（4 行）

| ID | 状态 | 映射交付 / P | 范围说明 |
|---|---|---|---|
| M06-F01-01 通知渠道 | 🟦（本轮 ⬜→🟦） | P37（开放未核销） | 已交付子集：站内信、统一渠道 SPI 及已验收扩展接缝（P58）；剩余：真实厂商渠道、配置开关及账号联调 |
| M06-F02-01 通知模板 | 🟦（本轮 ⬜→🟦） | P38（开放未核销，不新编号） | 已交付子集：可复用通用消息模板与变量渲染（与 M05 同实现）；剩余：按渠道配置内容与变量 |
| M06-F03-01 通知规则 | 🟦（本轮 ⬜→🟦） | P39（开放未核销） | 已交付子集：内置审批事件、通知节点触发（P58）；剩余：用户可配置规则、订阅设置 |
| M06-F04-01 发送记录 | 🟦 | P3（部分关闭未核销） | 已交付子集：投递状态持久化、幂等；剩余：状态查询/管理入口、失败重发、全局日志（不把状态落库写成完全缺失） |

### M07 AI 智能助手（14 行）

| ID | 状态 | 映射交付 / P | 范围说明 |
|---|---|---|---|
| M07-F01-01 模型接入 | ✅ | agent-model-management-frontend（第 23 个）/ P5 | 已交付核销 |
| M07-F01-02 动态装载 | ✅ | 同上 | 已交付核销 |
| M07-F01-03 参数配置 | ✅ | 同上 | 已交付核销 |
| M07-F01-04 密钥管理 | ✅ | 同上 | 已交付核销 |
| M07-F01-05 连通性测试 | ✅ | 同上 | 已交付核销 |
| M07-F02-01 图设计器 | ✅ | agent-model-orchestration（第 15 个） | 已交付 |
| M07-F02-02 节点 Prompt 配置 | ✅ | agent-graph-prompt-configuration（第 28 个）/ P6 | 已交付核销（D157 复验） |
| M07-F02-03 图管理 | ✅ | agent-model-orchestration | 已交付 |
| M07-F02-04 调试运行 | ✅ | agent-graph-execution-observability（第 27 个）+ agent-graph-step-debugging（第 30 个）/ P7 | 运行日志+单步调试双契，P7 已核销 |
| M07-F03-01 助手配置 | ⬜ | P18 | 未开发候选 |
| M07-F03-02 工具/函数调用 | ✅ | agent-tool-configuration-frontend（第 31 个）/ P48 | 已交付核销 |
| M07-F03-03 知识库 RAG | ⬜ | P19 | 未开发候选 |
| M07-F04-01 对话窗口 | ⬜ | P20 | 零代码 |
| M07-F04-02 会话管理 | ✅ | agent-token-usage-observability（第 29 个）/ P8 | 已交付核销 |

### M08 IoT（13 行）

| ID | 状态 | 映射交付 / P | 范围说明 |
|---|---|---|---|
| M08-F01-01 原生 MQTT 配置 | ⬜ | P21（部分关闭未核销） | 未开发 |
| M08-F01-02 腾讯 IoT 配置 | 🟦 | minimal-business-closure（第 35 个）/ P21 | 全局 Provider 配置已交付；每设备 DeviceSecret 未做 |
| M08-F01-03 连接管理 | ⬜ | P21 | 未开发 |
| M08-F02-01 设备维护 | 🟦 | minimal-business-closure / P21 | 注册+查询已交付；修改/删除/分组未做 |
| M08-F02-02 状态监控 | 🟦 | minimal-business-closure / P21 | 在线状态已交付；心跳/最后上报未做 |
| M08-F03-01 Topic 订阅 | ⬜ | P21 | 未开发 |
| M08-F03-02 Topic 发布配置 | ⬜ | P21 | 未开发 |
| M08-F04-01 按钮发送 | 🟦 | minimal-business-closure / P21 | 后端下发+命令 key 已贯通；前端按钮未做 |
| M08-F04-02 定时发送 | ⬜ | P21 | 未开发 |
| M08-F04-03 数据上报 | ⬜ | P21 | 未开发 |
| M08-F04-04 消息日志 | 🟦 | minimal-business-closure / P21 | 下行命令列表已交付；上行记录未做 |
| M08-F05-01 硬件编排规则 | ⬜ | P21 | 未开发 |
| M08-F05-02 指令模板 | ⬜ | P21 | 未开发 |

### M09 开放接口（8 行，P22 仅骨架）

| ID | 状态 | 范围说明 |
|---|---|---|
| M09-F01-01 应用维护 | ⬜ | 仅骨架 |
| M09-F02-01 接口授权 | ⬜ | 未开发 |
| M09-F03-01 签名鉴权 | ⬜ | 未开发 |
| M09-F03-02 访问控制 | ⬜ | 未开发 |
| M09-F04-01 限流配额 | ⬜ | 未开发 |
| M09-F05-01 Webhook | ⬜ | 未开发 |
| M09-F06-01 在线文档 | 🟦 | 部分（接口文档基建） |
| M09-F07-01 调用日志 | ⬜ | 未开发 |

### M10 系统运维（9 行）

| ID | 状态 | 映射交付 / P / I | 范围说明 |
|---|---|---|---|
| M10-F01-01 系统监控 | 🟦 | P49 | 部分（V29 菜单可达性与运行监控基建） |
| M10-F02-01 日志查询 | ⬜ | P40 | 无 oper_log/login_log |
| M10-F02-02 动态日志级别 | ⬜ | P41 | 无 loglevel 端点 |
| M10-F03-01 定时任务 | ✅ | job-scheduler（第 5 个）/ I43 | 已交付 |
| M10-F04-01 数据字典 | ✅ | system-mgmt-crud | 已交付 |
| M10-F05-01 系统参数 | ⬜ | P42 | 无 SysConfig |
| M10-F06-01 文件存储 | ✅ | storage-multi-provider（第 4 个）/ I44 | 已交付 |
| M10-F07-01 备份恢复 | ⬜ | P43 | 未排期 |
| M10-F08-01 API 管理 | 🟦 | P50 | 部分（接口文档基建） |

## 2. P 编号全集（56 唯一编号；物理 57 行，P48 总表/明细双入口同值）

- **已核销/完成（19）**：P1、P5、P6、P7、P8、P10、P12、P24、P28、P32、P36、P45、P46、P48、P51、P52、P56、P57、P58
- **部分关闭、未核销（2）**：P3（M05 剩余：发送记录查询/失败重发/全局日志；落库+幂等已实）、P21（M08 剩余：真实腾讯账号/物理设备/原生 MQTT/完整设备管理）
- **待对账、未核销（5+1）**：P34（M04-F01-03 会签）、P35（M04-F07-01 流程规则）、P37（M06-F01-01 通知渠道）、P38（M06-F02-01 通知模板）、P39（M06-F03-01 通知规则），及 P4（M04-F05-01 个人流程查询，开放待核实）
- **待排期（4）**：P2、P9、P14、P25
- **未排期（14）**：P26、P27、P29、P30、P31、P33、P40、P41、P42、P43、P44、P47、P49、P50
- **未开发候选（3）**：P18、P19、P20
- **待设计（2）**：P15、P16
- **待规划（2）**：P54、P55
- **待开发（1）**：P17
- **待决策（1）**：P11
- **待 Owner 确认（1）**：P53
- **仅骨架（1）**：P22
- **无池行备案**：P13（已核销闭环，经 knowledge/features/sysrole-v5-column-alignment.md，合规移除）；P23（全工作区零引用）
- **审计外新增编号（1）**：P59（CH-aPaaS 项目说明、仓库与 main 分支整理及自动发版；Owner 2026-09-04；非新增业务功能统一交付，不映射 90 明细；2026-09-04 功能级 PASSED 并核销，待阶段三终态复核，见 `knowledge/features/p59-ch-apaas-project-update.md`）

## 3. I 编号全集（54 条，I1—I55 区间缺 I27）

权威注册：`knowledge/known-issues.md`。索引行 54 条；已修复/关闭/满足/绕过 39 条、待修复/开放/部分收敛 15 条（含 I4、I6、I8、I11、I12、I13、I14、I15、I16、I17、I19、I20、I21、I38、I39、I40、I46、I48、I50 等现状以 known-issues 为准——分类计数无统一可靠口径，逐行状态以已修复/已关闭/已满足/待修复/已知限制/部分收敛等实际文字为准）。I27 无索引行（证据待定位，见 §5）。本轮不增删 I 编号。

**逐项完整映射（54 个稳定键，每项含当前状态、源锚点、对应 P/明细/交付或独立范围）见持久子表：`knowledge/feature-reconciliation-issues.md`**（集合双向差集与基准 exit=0、重复 0，原始输出见 `receipts/evidence-sync-b-correction-02/check-i-*.txt`）。

## 4. product 审计目录（55）与正式功能对账

41 个正式功能序号链与 product 目录对账见持久子表；**逐项完整映射（55 个稳定目录键，每项含性质、已有证据指针、对应明细/P 或独立范围）见持久子表：`knowledge/feature-reconciliation-products.md`**（集合双向差集与基准 exit=0、重复 0，原始输出见 `receipts/evidence-sync-b-correction-02/check-products-*.txt`）。

说明：41 为历史正式功能计数；允许同一业务交付多目录（P58 系列多份方向），第 1 项 Walking Skeleton 无独立目录（承载于 bpm-single-node-approval/process-initiation/form-binding/workflow-process-def-create 等早期交付，已在 X3 记录），不称 41 功能与目录严格一一对应。非功能目录（minimal-closure-first-acceptance、workspace-governance-consistency-audit）、ready 未归档（p51、readme-project-entry-correction）、receipts-only（bpm-test-verification、form-binding、workflow-process-def-create、process-initiation、local-development-config、repository-history-sanitization、next-feature-candidate-comparison-20260825）、特例（governance-contract-consolidation、feature-tracking-terminal-state-cleanup、v0.0.1-beta-release-readiness）逐项在子表 B—E 组定位。

## 5. 证据待定位 / 独立任务 / 历史缺口记录（不新增 P/I、不伪造验收）

| 项 | 记录 |
|---|---|
| X1 P51 | 采用 `product/p51-agent-coding-engine-decoupling/receipts/planning-final-reconciliation-p51-main-terminal-authority-03.md`：COMPLETED（已确认，2026-08-31，Owner 授权发布，终态权威 main@e0711fb）；OA 旧 ready 路线是被后续 Owner 路线取代的历史，非独立活动功能；Engine main 保留零业务初始态，本轮不改分支不搬运历史；本地实例按 main 终态理解 |
| X2 README 入口修正 | 独立 2026-08-30 文档任务（`product/readme-project-entry-correction/`），仅有 Admin 回执 `receipt-admin-readme-project-entry-correction-20260830.md`；**规划复核证据待定位**；不自动并入 08-29 三仓 README 任务、不补写通过 |
| X3 三前端交付 | form-binding/workflow-process-def-create → M04-F02-01 创建/表单绑定子集执行交付证据；process-initiation → M04-F03-01 前端发起子集执行交付证据；不另加正式功能数、不将执行自述升级为新验收 |
| X4 | bpm-single-node-approval feature ID 已改「Walking Skeleton 审批联通子集」；notify-frontend ID 已改「无独立清单 ID，服务 M05」（见 §6） |
| X5 历史状态清理 | feature-tracking-terminal-state-cleanup 已归档但缺规划裁决回执：保留既有历史结论，标明实际可用证据（completion.md）与缺失指针；缺独立文档不等于未曾验收 |
| X6 历史清理 | repository-history-sanitization：只记录历史脱敏回执指针 `preflight-2026-08-30.md`/`service-purge-pending-2026-08-30.md` 与证据边界；不新执行 Git 操作、不复制敏感值 |
| X7 beta 发布 | v0.0.1-beta-release-readiness 已 RELEASED（2026-08-30 规划复验 PASSED），passed/ 仅 blockers 方向 1 份：保留既有历史结论，标明方向集合缺失指针 |
| X8 | GOV-AUDIT-13 方向已在 passed/，current-status 文字已更新 |
| X9 早期验收 | 早期批处理 16 目录 + PASSED 归档 3 目录规划证据在 feature 追踪/历史快照（D79/D82/D86/D87/D88/D91 等）：保留历史结论，统一补证据指针即可，不重跑验收 |
| I27 缺行 | known-issues 索引 54 条、I1—I55 区间无 I27 行；实际枚举事实=无行；可用历史指针=无；不凭审计手工行恢复、不解释为「不存在过」 |
| P23 | 全工作区零引用（todo/knowledge/memory 均无）；记录枚举事实，不重建 |
| agent-model-orchestration feature 链接 | `session-handoff` 旧必读清单中的该链接指向不存在文件；已改指本索引（§6）；不重建已缺失正文 |
| search 局部通知任务 | `search_task/notification-personal-workflow-reconciliation-20260904.md` 已被主方向吸收（方向 §1「不再单独推进/提交局部结项」）；三类查询与通知结论见 audit-ledger-d、audit-ledger-e 及本索引 M04-F05-01/M06 行 |
| 其余 search 资料 | 7 份活动目录中的探索文件已回传且为历史资料；4 份已归档（.archive/）；11 份无任务历史回传保留链接；knowledge-full-reconciliation 任务已完成（COMPLETED 已确认），阶段三方向已归档 `passed/direction-knowledge-full-reconciliation-terminal-sync.md`，历史文件不删除；当前执行入口见 `knowledge/current-status.md`「当前唯一下一动作」（P59 终态复核） |

## 6. 链接与追踪

- 当前状态权威：`knowledge/current-status.md`；清单：`Smart-WorkFlow-Server/功能清单.md`；问题注册：`knowledge/known-issues.md`；需求池：`todo/requirement-pool.md`
- 任务登记：`knowledge/features/p59-ch-apaas-project-update.md`（P59 统一交付任务，终态待 Planner 复核）；`knowledge/features/knowledge-full-reconciliation.md`（非业务功能，COMPLETED 已确认，历史）
- 会议交接：`knowledge/session-handoff.md`（已压缩，原 P57 时点全文见 `knowledge/history/session-handoff-before-knowledge-full-reconciliation-20260904.md`）
- 本索引建立于审计账本 A—E（`product/knowledge-full-reconciliation/receipts/`），原件仅供追溯