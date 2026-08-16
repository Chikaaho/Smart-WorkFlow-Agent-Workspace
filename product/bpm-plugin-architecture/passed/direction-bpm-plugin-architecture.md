# 需求方向：bpm-plugin-architecture —— M04-F08-01 BPM 可插拔机制

> 规划层需求方向文档（D80，2026-08-15）。执行层自行拆 Step、设计执行/测试方案、自主闭环，完成后提交功能级完成回执，规划层最终验收。
> 方向裁定依据：D78（2026-08-14 登记，`memory/decisions.md`）；现状基线来自 D78 探索直读结论，完整功能说明在 `knowledge/features/bpm-plugin-architecture.md`（执行层可直接读取）。

## 背景

当前 BPM 节点类型与表单控件均硬编码在消费方代码中，新增任何类型都需改消费方：

- **后端**：`NodeTypeRegistry` 仅 START/END/APPROVAL 三类；`GraphToBpmnTranslator` 按节点类型 switch 硬编码，无节点处理器 SPI。
- **前端**：`DynamicField.vue` 8 类表单控件 v-if 链硬编码；M07 `GraphDesigner.vue` 节点属性面板按节点类型 v-if 硬编码，无节点组件注册表。

项目内已有成熟先例可循：前端 `modules/form/designer/field-types.ts` 的 `FIELD_TYPE_REGISTRY` + `<component :is>` 动态挂载；后端 `NodeApproverResolver` 的 Spring `Map<String, Resolver>` 分发。本轮将这些局部先例推广为 BPM 域的通用可插拔骨架。

## 目标

1. **前端节点组件注册表**：仿 `FIELD_TYPE_REGISTRY` + `<component :is>` 动态挂载——`GraphDesigner.vue` 属性面板按节点类型查表渲染，替换 v-if 链。
2. **DynamicField.vue 渲染链 registry 化**：8 类控件 v-if 链改为注册表查表渲染。
3. **后端 translator 注册化**：`GraphToBpmnTranslator` switch → 按类型注册翻译器（仿 `NodeApproverResolver` 的 Spring `Map<String, ...>` 分发）。
4. **NodeTypeRegistry 扩充**：完整注册骨架（含 CONDITION、并行网关等预留位）。
5. **后端 BPM adapter 抽象为可插拔 SPI**：节点处理/adapter 逻辑注册表化，新增类型仅注册即可。
6. **可插拔性证明**：新增节点类型/表单控件时消费方零改动即生效（用测试型注册证明，不新增生产节点类型/控件）。
7. **知识库全量同步**（§3.3 第10项）：功能清单 M04-F08-01 状态按交付实际回升（预期 ⬜→✅）；`knowledge/features/bpm-plugin-architecture.md` 更新；known-issues **正式登记 I47 与 I48 两条**（清理悬空引用——I47=bpm/h2 V8 partial index、I48=flow-graph adapter 限制，均已存于 `memory/issues.md`，knowledge 注册表尚无实体条目）；回执报告清单变更明细+知识库触碰文件清单。

## 非目标

- **不做** M04-F01 BPM 设计器本体。
- **不新增**具体生产节点类型/表单控件（仅测试型注册作证明）。
- **不做**运行时热插拔（OSGi/热部署/DB 驱动注册）——注册表为代码内静态注册（编译期可见）。
- **不扩展** `flow-graph` adapter 契约（I48 绕行方案维持现状）。
- **不做行为变更**：本轮为纯重构，业务流程语义、对外接口、数据模型零变化。

## 影响范围（预期，最终以执行层探索为准）

- **后端**：sw-bpm（`NodeTypeRegistry` / `GraphToBpmnTranslator` / 节点处理器与 adapter SPI 落点）。注意架构红线：4 层依赖自上而下、业务模块只依赖 `-api`——SPI 接口落点须合规，跨模块引用时接口放 `-api` 或经既有分发先例处理。
- **前端**：`modules/form`（`DynamicField.vue` 及其控件注册，`field-types.ts` 为既有先例）、`modules/agent`（`GraphDesigner.vue` 属性面板）；可能触碰 `contracts/` 类型定义。
- **测试基线**：后端 521 tests（源码口径，CONFIRMED 2026-08-15）/ 前端 63f/552t（四连全绿，CONFIRMED 2026-08-14）。
- **Flyway**：预期零迁移（纯代码重构）。若执行层认为注册信息需要持久化，超出本方向——须在回执报告，规划层另行裁定。

## 关键方向性判断

- **先例即模板，不发明新范式**：前端学 `FIELD_TYPE_REGISTRY`，后端学 `NodeApproverResolver` Map 分发。
- **纯重构轮**：验收重心 = 行为零回归（既有测试全绿）+ 可插拔性证明。
- **静态注册**：注册表在代码内静态完成，与"不做运行时热插拔"的非目标一致。
- **前后端严格分离**：执行层自行拆 Step，一个 Step 不跨前后端（shared-constraints §9）。

## 验收标准（规划层最终验收依据）

1. 五项目标（1-5）全部落地，回执列明每项的落点文件与注册/分发机制。
2. 可插拔性有测试证据：注册新类型/控件后消费方零改动即生效。
3. 行为零回归：后端全量 BUILD SUCCESS 0 failures（基线 521 + 新增）；前端四连（test/typecheck/lint/build）全绿（63f/552t + 新增）。编译限内存约束不变（`MAVEN_OPTS="-Xmx512m"` / `NODE_OPTIONS="--max-old-space-size=512"`）。
4. Flyway 零迁移（若有例外须披露并说明理由）。
5. 知识库全量同步完成：清单 M04-F08-01 状态回升、features 追踪文件更新、I47/I48 正式登记（悬空引用清理）、回执含清单变更明细+触碰文件清单。

## 待确认问题

无（方向已在 D78 裁定）。执行层若发现方向性歧义或不可行（如 `DynamicField` registry 化与 form-create 组件机制存在冲突、SPI 落点无法满足依赖方向红线），按 §3.2 在回执中报告，由规划层调整方向。

---

**证据来源**：`memory/decisions.md` D78 方向裁定全文；`memory/handoff.md` 进行中条目；`memory/issues.md` I47/I48 登记悬空说明；`knowledge/features/bpm-plugin-architecture.md`（执行层可读的功能说明原文）。
