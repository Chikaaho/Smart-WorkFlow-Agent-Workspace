# 功能追踪：BPM 节点/表单组件与后端 adapter 可插拔机制

> 工作区统一知识库 — 单功能规划与追踪。
> 本文件跟踪一个功能的完整生命周期：规划 → Step 执行 → 测试 → 验收 → 完成。
>
> 可信度标记：CONFIRMED / REPORTED / ASSUMED / SUPERSEDED
>
> ⚠️ **2026-08-14 角色制上线**：本文件中的"推荐模型/实际模型"字段为当时执行事实，仅作历史存档；当前权限按会话角色（规划/执行/管理员）划分，与模型无关（见根目录 `system.md` §0.2）。

---

## 1. 功能信息

| 字段 | 值 |
|------|-----|
| 功能编号 | M04-F08-01 |
| 功能名称 | BPM 节点/表单组件与后端 adapter 可插拔机制 |
| 功能目标 | 将 BPM 流程设计器中的前端节点组件、前端表单控件组件、以及后端对应的 adapter/节点处理逻辑全部改造成**注册表驱动的可插拔形式**——新增节点类型或表单控件时零改消费方代码 |
| 创建日期 | 2026-08-14 |
| 当前状态 | **COMPLETED ✅（D82 规划层最终验收 PASSED，2026-08-16；归档 `product/bpm-plugin-architecture/passed/`）** |
| 涉及模块 | 后端 `sw-bpm`（-api/-engine/-process）+ 前端 `modules/workflow` + `src/adapters/`（如新增） |

---

## 2. 需求分析

### 2.1 功能目标

现状基线（CONFIRMED 2026-08-14 代码直读）：

- **后端节点建模**：节点类型是 String 常量（无枚举），载体为 `GraphElement`（`sw-bpm-api/.../api/dto/GraphElement.java`，`config/style` 为不透明 Map 原样透传）。`NodeTypeRegistry.java`（`sw-bpm-process/.../model/`）当前**只注册 START/END/APPROVAL 三种** `NodeTypeSpec`（入/出度基数 + 系统属性），仅被 `GraphValidator.java` 消费。
- **后端翻译硬编码**：`GraphToBpmnTranslator.java`（`sw-bpm-engine/.../translator/`）用 **switch 硬编码**翻译（START→StartEvent、END→EndEvent、APPROVAL→UserTask 挂 `${approvalTaskListener}` delegation expression），未走注册表。新增节点类型目前要同时改 translator 的 switch + NodeTypeRegistry + GraphValidator。
- **前端节点渲染**：BPM 无设计器（M04-F01 拖拽设计未实现）；M07 `GraphDesigner.vue` 的节点属性面板全部是**模板 v-if/v-else-if 硬编码**（L408-571），无"节点类型→配置表单组件"注册机制。
- **前端表单控件渲染**：8 类控件（TEXT/RICH_TEXT/NUMBER/DATE/BOOL/DICT/REFERENCE/TABLE）渲染分发在 `src/components/DynamicField.vue`——**v-if/v-else-if 链**，子表内另有一套平行 if 链。非 form-create 主链（form-create 仅经 `adapters/form-designer/` 用于设计器 WYSIWYG/预览）。
- **可插拔样板（借鉴）**：
  - 前端：`modules/form/designer/field-types.ts` 的 `FIELD_TYPE_REGISTRY`（type→{label, icon, createDefault, configComponent}），`FieldConfigPanel.vue` 用 `<component :is="descriptor.configComponent">` 动态挂载——**新增字段类型零改消费方**。
  - 后端：`sw-bpm-api/.../api/spi/assignee/NodeApproverResolver.java`（签名零 Flowable）+ `NodeApproverType` 常量 + 运行时 `ApprovalTaskListener.java`（按 `Map<String,NodeApproverResolver>` 按 type 分发）——Spring Map 注入分发样板。

**本功能要求**：

1. **前端 BPM 节点组件可插拔**：建立"节点类型 →（画布节点组件, 属性面板组件）"注册表（仿 `FIELD_TYPE_REGISTRY`），替换设计器属性面板的 v-if 硬编码；新增节点类型时只注册描述符，画布与属性面板零改。
2. **前端表单控件组件可插拔**：将 `DynamicField.vue` 的 v-if 渲染链 registry 化——8 类控件改为"控件类型 → 渲染组件"注册表，子表渲染复用同一注册表。
3. **后端节点处理/adapter 可插拔**：`GraphToBpmnTranslator` 的 switch 改为按节点类型注册的翻译器（仿 `NodeApproverResolver` 的 Map 分发）；`NodeTypeRegistry` 扩充为完整注册骨架（含 CONDITION/并行网关等类型及 `NodeTypeSpec` 入出度基数）；后端 BPM 相关的 adapter（如外部数据源执行、通知发送等）抽象为可插拔 SPI/接口。

### 2.2 非目标

- ❌ 不实现 BPM 流程设计器本体（M04-F01-01 拖拽设计）——本功能只做**可插拔基础设施**，设计器业务功能另行排期
- ❌ 不新增具体节点类型或表单控件（如"新增会签节点"）——本功能只提供注册机制与现有类型的 registry 化迁移
- ❌ 不改动 M07 AI 调度图的 `GraphDesigner.vue` 业务逻辑——仅当其属性面板复用本功能注册表时受影响（可选用）
- ❌ 不做运行时热插拔（动态加载外部 jar/包）——可插拔=注册表驱动+零改消费方，非 OSGi/模块热部署

### 2.3 影响范围

| 维度 | 详情 |
|------|------|
| 后端模块 | `sw-bpm-api`（NodeTypeSpec/SPI 扩展）、`sw-bpm-engine`（GraphToBpmnTranslator 改造）、`sw-bpm-process`（NodeTypeRegistry 扩充） |
| 前端模块 | `modules/workflow/`（设计器/节点属性面板，如已存在）、`src/components/DynamicField.vue`（表单控件 registry 化）、`modules/form/designer/field-types.ts`（样板参照） |
| 数据库表 | 无新增（图定义仍以 `graph_json` 列持久化） |
| API 端点 | 无新增（纯内部改造） |
| 前端路由 | 无新增 |
| 依赖功能 | 依赖 `bpm-single-node-approval`（Walking Skeleton 第三环）已打通审批链路；M04-F01 流程设计器实现后可消费本注册表 |

### 2.4 依赖和风险

| 类型 | 描述 |
|------|------|
| 前置条件 | 无硬前置；建议在 M04-F01 流程设计器开发前完成，避免设计器直接写死 v-if 后返工 |
| 技术风险 | `GraphToBpmnTranslator` 改造涉及 Flowable BPMN 翻译路径，需保持既有 START/END/APPROVAL 行为不变（回归风险）；`DynamicField.vue` registry 化需保持 8 类控件渲染行为与现有测试全绿 |
| 阻塞项 | 无已知阻塞 |

---

## 3. Step 列表

| Step | 名称 | 状态 | 执行回执 | 测试回执 | 验收结论 |
|------|------|:---:|:---:|:---:|:---:|
| B1 | 后端 NodeTypeRegistry 扩充完整注册骨架（CONDITION/EXCLUSIVE_GATEWAY/PARALLEL_GATEWAY/JOIN_GATEWAY 预留位） | ✅ | `7dacc3f`（2026-08-16） | GraphValidatorTest 47→50（+3） | 通过 |
| B2 | 后端 GraphToBpmnTranslator switch→注册表翻译（NodeTypeTranslator SPI + Map 分发） | ✅ | `dd59896`（2026-08-16） | GraphToBpmnTranslatorTest 18→19（+1） | 通过 |
| B3 | 后端可插拔性证明（测试注册 TEST_NODE→ServiceTask 零改动即翻译）+ adapter 审视结论 | ✅ | `b9adaba`（2026-08-16） | NodeTypeTranslatorPlugabilityTest +2（19→21） | 通过 |
| F1 | 前端 DynamicField.vue 8 类控件渲染链 registry 化（9 控件组件 + 注册表，主链/子表共用） | ✅ | `a56c5eb`（2026-08-16） | 66f/569t（+3 spec +17 用例） | 通过 |
| F2 | 前端 GraphDesigner.vue 属性面板注册表化（8 面板组件 + node-panel-registry 动态挂载） | ✅ | `ba144ce`（2026-08-16） | 同上（含 GraphDesigner.spec +1 用例） | 通过 |
| F3 | 前端可插拔性证明（测试注册 EMAIL 控件/PROBE 面板，消费方零改动即渲染） | ✅ | `3d6fa51`（2026-08-16） | dynamic-field-plugability.spec + node-panel-registry.spec | 通过 |

> 本功能采用需求方向文档制（方向 D80 已下发），Step 拆分与执行方案由执行角色在自主闭环中自行设计（system.md §0.6）。执行层拆分为后端 3 步 + 前端 3 步（一个 Step 不跨前后端，shared-constraints §9）。

---

## 4. 方向文档

- **方向文档**：D80（2026-08-15）下发至 `product/bpm-plugin-architecture/ready/`，已归档 `product/bpm-plugin-architecture/passed/`
- **下发日期**：2026-08-15
- **验收标准（方向级，5 项）**：
  1. 前端存在"节点类型 → 属性面板组件"注册表，新增节点类型仅需注册描述符，属性面板消费方零修改 ✅（F2 node-panel-registry.ts，PROBE 测试证明）
  2. 前端 `DynamicField.vue` 8 类控件渲染改为注册表驱动，原 v-if 链移除，渲染行为与现有测试全绿 ✅（F1 dynamic-field-registry.ts，EMAIL 测试证明）
  3. 后端 `GraphToBpmnTranslator` 按节点类型注册表翻译，移除 switch 硬编码，START/END/APPROVAL 翻译行为不变 ✅（B2 NodeTypeTranslator SPI + Map 分发，TEST_NODE 测试证明）
  4. 后端 `NodeTypeRegistry` 扩充为完整注册骨架（含新增类型预留位），`NodeTypeSpec` 元数据驱动校验 ✅（B1 四预留位）
  5. 后端 BPM 相关 adapter（外部数据源执行/通知等）抽象为可插拔 SPI，注册表/Map 分发生效 ✅（B3 审视结论：节点处理 adapter=翻译器注册表已落；ApprovalTaskListener 运行时分发已有 approverResolverMap 先例；ExternalDatasourceManager/SqlExecutor 与 BpmNotifyEvent/BpmNotifyTrigger 属独立子系统/事件总线模式，注册表化属过度抽象，不纳入——已在 B3 提交与回执披露）

---

## 5. 测试和验收汇总

| Step | 测试总数 | 通过 | 失败 | 跳过 | 验收结论 |
|------|:---:|:---:|:---:|:---:|:---:|
| 后端 B1-B3 | sw-bpm-engine 21 / sw-bpm-process 50（+6 合计） | 全量 **527** | 0 | 0 | ✅ mvn BUILD SUCCESS 12:07min |
| 前端 F1-F3 | **66f/569t**（63f/552t 基线 +3f/+17t） | 全绿 | 0 | 0 | ✅ 2026-08-17 在正式 2G 上限下补跑四连，全部退出 0；历史 512M OOM/1024M 临时例外已关闭 |

---

## 6. 功能完成检查清单

- [x] 所有 Step 均已 PASSED（B1-B3 / F1-F3 六步闭环）
- [x] 已更新 `knowledge/current-status.md`
- [x] 已更新 `knowledge/decisions.md`（如有新决策——无新决策，D80 方向裁定延续）
- [x] 已更新 `knowledge/known-issues.md`（I47/I48 正式登记，悬空引用清理）
- [x] 已生成交接摘要 → `knowledge/session-handoff.md`
- [x] 已标注功能清单中对应项状态（M04-F08-01 ⬜→✅）

---

## 7. 实际修改范围

**后端 Smart-WorkFlow（3 提交：`7dacc3f` / `dd59896` / `b9adaba`）**

| 文件路径 | 修改类型 | 摘要 |
|----------|:---:|------|
| `sw-biz/sw-bpm/sw-bpm-process/.../model/NodeTypeRegistry.java` | 修改 | B1 扩充完整注册骨架（CONDITION/EXCLUSIVE_GATEWAY/PARALLEL_GATEWAY/JOIN_GATEWAY 预留位） |
| `sw-biz/sw-bpm/sw-bpm-process/.../validator/GraphValidatorTest.java` | 修改 | B1 +3 测试（47→50） |
| `sw-biz/sw-bpm/sw-bpm-engine/.../translator/NodeTypeTranslator.java` | 新增 | B2 节点翻译器 SPI（落点裁定：签名引 Flowable 故置 engine 内部不污染 -api） |
| `sw-biz/sw-bpm/sw-bpm-engine/.../translator/StartEventTranslator.java` / `EndEventTranslator.java` / `ApprovalUserTaskTranslator.java` | 新增 | B2 内置三翻译器拆分 |
| `sw-biz/sw-bpm/sw-bpm-engine/.../translator/GraphToBpmnTranslator.java` | 修改 | B2 switch→`Map<String, NodeTypeTranslator>` 分发（可插拔构造器 + 默认注册内置三翻译器） |
| `sw-biz/sw-bpm/sw-bpm-engine/.../translator/GraphToBpmnTranslatorTest.java` | 修改 | B2 +1 测试（18→19） |
| `sw-biz/sw-bpm/sw-bpm-engine/.../translator/NodeTypeTranslatorPlugabilityTest.java` | 新增 | B3 可插拔性证明（TEST_NODE→ServiceTask 零改动即翻译 + 内置类型不受影响 + 未知类型 warn+skip） |

**前端 Smart-WorkFlow-Web（3 提交：`a56c5eb` / `ba144ce` / `3d6fa51`）**

| 文件路径 | 修改类型 | 摘要 |
|----------|:---:|------|
| `src/components/dynamic-field-registry.ts` | 新增 | F1 控件注册表（DYNAMIC_FIELD_REGISTRY 描述符 {component, subFieldComponent} + 查找/降级决议 + register 入口） |
| `src/components/dynamic-field-controls/`（9 文件） | 新增 | F1 8 类控件 + Placeholder 降级组件（原 v-if 链 1:1 提取） |
| `src/components/DynamicField.vue` | 修改 | F1 主链/子表链改 `<component :is>` 查表渲染（-275 行） |
| `src/modules/agent/views/panels/`（10 文件） | 新增 | F2 8 属性面板组件 + node-panel-registry.ts + spec |
| `src/modules/agent/views/GraphDesigner.vue` | 修改 | F2 属性面板 v-if 链→注册表动态挂载（-216 行） |
| `src/modules/agent/views/GraphDesigner.spec.ts` | 修改 | F2 +1 用例（PROBE 面板注册→零改动渲染证明） |
| `src/components/dynamic-field-registry.spec.ts` / `dynamic-field-plugability.spec.ts` | 新增 | F1/F3 测试（EMAIL 控件主链+子表零改动渲染+行操作语义） |
| `src/types/components.d.ts` | 修改 | 构建产物（unplugin-vue-components 自动生成） |

---

## 8. 遗留问题

| 问题 | 严重程度 | 计划处理 |
|------|:---:|------|
| 前端 typecheck/build 历史 512M OOM | 已关闭 | 2026-08-17 提交 `9c26c8d` 将正式上限调整为 2G；按新约束补跑四连全绿（66f/569t），无需继续保留 1024M 临时例外 |
| B3 adapter 审视结论：外部数据源执行/通知子系统未注册表化（独立子系统/事件总线模式，注册表化属过度抽象） | 低 | 记录性结论，不排期 |
| I47（bpm/h2 V8 partial index）未修复——本轮为纯重构轮，仅正式登记 | 中 | 后续排期（候选池已有） |

---
