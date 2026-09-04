# P57 探索回执：BPM 统一流程节点扩展能力现状边界

> 角色：执行（根入口跨仓只读）｜2026-09-02｜只回传已验证事实

## 1. 节点清单矩阵

| 类型 | 设计 | 保存 | 校验 | 运行 | 位置 |
|---|---|---|---|---|---|
| START | ✅ | ✅ | ✅ | ✅ | NodeTypeRegistry.java:40 / StartEventTranslator.java |
| END | ✅ | ✅ | ✅ | ✅ | NodeTypeRegistry.java:43 / EndEventTranslator.java |
| APPROVAL | ✅ | ✅ | ✅ | ✅ | NodeTypeRegistry.java:46 / ApprovalUserTaskTranslator.java |
| CONDITION/EXCLUSIVE_GATEWAY/PARALLEL_GATEWAY/JOIN_GATEWAY | ❌ | ✅ | ✅（仅注册） | ❌ | NodeTypeRegistry.java:51-60（**无翻译器**） |

**清单不一致**：校验注册表认 7 类，翻译器表仅 3 类。预留位可保存、过发布校验，发布翻译 warn+skip（GraphToBpmnTranslator.java:216-223）→ BPMN 缺节点、边悬空 → 带缺漏部署或失败。

## 2. 最小调用链

1. **保存**：PUT /workflow/defs/{id}/graph → saveDraftGraph 原样存 graph_json（不校验）。
2. **发布**：POST /workflow/defs/{id}/publish → GraphValidator.validate → translateToBpmn → GraphToBpmnTranslator.translate → Flowable deployModel。
3. **运行**：表单提交 → ProcessStartService（${approver}）→ startProcessInstanceByKeyAndTenantId；UserTask create → ApprovalTaskListener → approverResolverMap 分发。

## 3. 硬编码矩阵（新增节点须改位置）

| 层 | 位置 | 现状 |
|---|---|---|
| 设计 | EditProcessDefDialog.vue buildGraph() | 硬编码 START→APPROVAL→END + DESIGNATED |
| 传输/持久化 | GraphElement.type / graph_json | type 自由 String 无枚举；config/style 不透明 Map 透传 |
| 校验 | NodeTypeRegistry.registerDefaults() | 硬编码 7 条 |
| 翻译 | GraphToBpmnTranslator 构造器 | 硬编码 3 内置；生产 BpmDeployFacadeImpl `new GraphToBpmnTranslator()` **未注入插件**（可插拔仅测试证明） |
| 审批人 | BpmEngineAutoConfiguration.approverResolverMap | instanceof 装配（Designated/Unsupported→桩）；NodeApproverType 常量类 |

新增可运行节点必改：NodeTypeRegistry + GraphToBpmnTranslator 构造器或 BpmDeployFacadeImpl；新审批人类型还需 NodeApproverType + approverResolverMap。

## 4. 现有扩展接缝

- **NodeTypeTranslator SPI**（engine，Flowable 签名未落 api）：仅覆盖翻译；无启动发现（重复仅 warn、顺序不定）
- **NodeApproverResolver SPI**（api）+ Map 装配：仅覆盖运行期审批人；SCRIPT 为桩（2201）
- **旧 ApproverResolver（@Deprecated）** 仍被 skeleton 路径使用——新旧并存（兼容保留）
- 缺失：启动发现、前端节点入口、config schema、发布校验无翻译器存在性检查

## 5. 元数据/配置契约

NodeTypeSpec 仅拓扑约束；无显示名、可配置项、配置校验。NodeTypeTranslator.type() 为唯一稳定标识。ApprovalUserTaskTranslator 直接读 config.approver/name——**config 字段名为翻译器私有约定**，无统一表达。

## 6. 前端数据来源与一致性风险

前端**静态硬编码获得节点能力**，无「节点清单」API；仅 defs/tasks/bpmn-xml/approver-candidates 端点。ProcessGraphPayload 手写对齐子集（graph 字段 unknown）；mock 独立种子；无节点面板/注册表（node-panel-registry.ts 属 agent M07）。风险：设计硬编码与后端注册表无共享来源；新增节点需手改组件+mock 双处。最小接缝影响面：新增「节点能力清单」端点+前端契约。

## 7. 存量与兼容

sw_bpm_process_def（V14 H2/PG）含 graph_json；skeleton_approval.bpmn20.xml 手写不走图模型。**仓库内无已保存流程定义种子与版本迁移链证据**（未验证、未证实）；def_version 仅记录，发布门只冻结 process_key 与表单。

## 8. P57 边界与验证节点结论（供 Planner 裁决）

- 统一注册表覆盖：校验+翻译+前端消费（能力清单端点）；审批人类型可独立或并入。保留兼容：START/END/APPROVAL、graph_json、DESIGNATED、skeleton 路径。主要风险：预留位「校验过/运行缺」；双命名空间；config 私有。分阶段：① 统一注册+发现+fail-fast ② 翻译器+配置校验 ③ 前端接缝 ④ 验证节点全链。**P58 会签/通知/条件分支+前端改版不并入 P57**。
- **验证节点不能仅新增实现覆盖全链**：① 翻译器无启动发现 ② 校验与翻译注册表分离 ③ 前端无通用消费接缝 ④ config 校验无钩子（错误仅运行期暴露）。
- **需 Planner 裁决**：NodeTypeTranslator 落点（api 纯净 vs Flowable 签名）；能力清单内容；前端接缝范围。

## 检查范围与限制

已读：sw-bpm 全生产源码、GraphValidator、translator、AutoConfiguration、Controller、migration V14、前端 workflow/adapters/mock；knowledge/architecture、known-issues、requirement-pool P57/P58。未运行构建/测试；存量未验证。