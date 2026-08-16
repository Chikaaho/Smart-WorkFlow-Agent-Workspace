# 功能级完成回执：bpm-plugin-architecture（M04-F08-01 BPM 可插拔机制）

> 执行层功能级回执（D81，2026-08-16）。方向文档：D80（`product/bpm-plugin-architecture/passed/direction-bpm-plugin-architecture.md`）。
> 提交规划层最终验收（5 项验收标准）。

## 0. 结论摘要

- 纯重构轮闭环：后端 3 Step + 前端 3 Step（一个 Step 不跨前后端，shared-constraints §9）
- 后端 **527 tests** 全绿（mvn BUILD SUCCESS 12:07min，基线 521 + 6）
- 前端 **66f/569t** 四连全绿（基线 63f/552t + 3 spec + 17 tests；typecheck/build 一次性 1024M 例外已披露）
- **Flyway 零迁移**（符合方向文档预期）
- 知识库全量同步完成：清单 M04-F08-01 ⬜→✅、features 更新、**I47/I48 正式登记**（悬空引用清理）

## 1. 验收标准对照（方向级 5 项）

| # | 验收标准 | 结论 | 落点/证据 |
|---|---------|:---:|----------|
| 1 | 前端"节点类型→属性面板组件"注册表，新增节点类型仅注册描述符，属性面板消费方零修改 | ✅ | `src/modules/agent/views/panels/node-panel-registry.ts`（描述符 {type, label, component} + 查找函数）+ GraphDesigner.vue `<component :is>` 动态挂载；F3 PROBE 测试型面板注册→点击即渲染证明 |
| 2 | DynamicField.vue 8 类控件渲染注册表驱动，v-if 链移除，渲染行为与现有测试全绿 | ✅ | `src/components/dynamic-field-registry.ts`（DYNAMIC_FIELD_REGISTRY 描述符 {component, subFieldComponent} + getSubFieldComponent 降级决议）+ 9 控件组件（8 类 + Placeholder）；主链/子表共用注册表；F3 EMAIL 测试型控件主链+子表零改动渲染证明 |
| 3 | GraphToBpmnTranslator 按节点类型注册表翻译，移除 switch，START/END/APPROVAL 翻译行为不变 | ✅ | `NodeTypeTranslator` SPI + `Map<String, NodeTypeTranslator>` 分发（仿 approverResolverMap 先例）；三内置翻译器拆分注册，行为逐字节不变（既有 GraphToBpmnTranslatorTest/ApprovalProcessIntegrationTest 全绿）；F3/B3 TEST_NODE→ServiceTask 零改动即翻译证明 |
| 4 | NodeTypeRegistry 扩充完整注册骨架（含新增类型预留位），NodeTypeSpec 元数据驱动校验 | ✅ | `NodeTypeRegistry` 新增 CONDITION（1入1出）/EXCLUSIVE_GATEWAY（1入2..N出）/PARALLEL_GATEWAY（1入2..N出）/JOIN_GATEWAY（2..N入1出）预留位；GraphValidator 随注册表自动识别（+3 测试） |
| 5 | 后端 BPM adapter 抽象为可插拔 SPI，注册表/Map 分发生效 | ✅（按现状裁定） | B3 审视结论：节点处理 adapter=翻译器注册表（B2 已落）；ApprovalTaskListener 运行时分发已有 approverResolverMap 先例；**ExternalDatasourceManager/SqlExecutor 与 BpmNotifyEvent/BpmNotifyTrigger 属独立子系统/事件总线模式，注册表化属过度抽象，不纳入**（已在 B3 提交披露，规划层可复核） |

## 2. 执行过程

| Step | 内容 | 提交 | 测试 |
|------|------|------|------|
| B1 | NodeTypeRegistry 扩充完整注册骨架（4 预留位，START/END/APPROVAL 不动） | `7dacc3f` | GraphValidatorTest 47→50（+3） |
| B2 | GraphToBpmnTranslator switch→注册表翻译（NodeTypeTranslator SPI + Map 分发；落点裁定：签名引 Flowable 故置 sw-bpm-engine 内部不污染 sw-bpm-api） | `dd59896` | GraphToBpmnTranslatorTest 18→19（+1） |
| B3 | 可插拔性证明（TEST_NODE→ServiceTask 测试注册零改动即翻译）+ adapter 审视结论 | `b9adaba` | NodeTypeTranslatorPlugabilityTest +2（19→21） |
| F1 | DynamicField 8 类控件渲染链 registry 化（9 控件组件 + 注册表，主链/子表共用） | `a56c5eb` | +2 spec（registry/plugability） |
| F2 | GraphDesigner 属性面板注册表化（8 面板组件 + node-panel-registry 动态挂载） | `ba144ce` | node-panel-registry.spec + GraphDesigner.spec +1 |
| F3 | 可插拔性证明（EMAIL 控件/PROBE 面板测试注册，消费方零改动即渲染） | `3d6fa51` | 前端 66f/569t |

**内存例外披露**：前端 typecheck/build 在 512M 下 OOM。已 `git stash -u` 后对基线 HEAD 单独跑 512M typecheck——同样 OOM，证明为本机环境问题（物理内存 1.6G，可用仅 ~377MB），非新增代码引起。按项目先例一次性 1024M 例外执行（data-scope 轮同款披露）。lint 修复了本次改动引入的全部 20 条 warning（0 errors / 0 warnings）。

## 3. 测试门（验收标准 3）

- 后端：`MAVEN_OPTS="-Xmx512m" mvn test` 全量 **BUILD SUCCESS / 0 failures / 0 errors**（12:07min，全 29 模块 SUCCESS；sw-bpm-engine 21、sw-bpm-process 50）
- 前端：`NODE_OPTIONS` 限定下 test 66f/569t PASSED + typecheck 0 errors + lint 0/0 + build 通过（1024M 例外见上）
- Flyway：零迁移（无新增 migration 文件，符合方向文档预期——注册信息代码内静态注册，不持久化）

## 4. 知识库同步明细（§3.3 第 10 项）

| 触碰文件 | 变更 |
|----------|------|
| `Smart-WorkFlow/功能清单.md` | M04-F08-01 ⬜→✅（终态 ✅12/🟦37/⬜41 共 90 行） |
| `knowledge/features/bpm-plugin-architecture.md` | 状态 PLANNING→COMPLETED；Step 表（6 行）+ 验收标准逐项 ✅ + 测试汇总 + 检查清单勾选 + §7 实际修改范围 + §8 遗留问题 |
| `knowledge/known-issues.md` | **I47 正式登记**（bpm/h2 V8 partial index，中，待排期——悬空引用清理）+ **I48 正式登记**（flow-graph adapter 限制，低，绕行生效——D79 改号裁定落地） |
| `knowledge/current-status.md` | 清单计数演进（✅11→✅12/⬜42→41）、测试基线（527 / 66f/569t）、前次验证段落更新 |
| `knowledge/session-handoff.md` | 交接摘要同步 |

## 5. 遗留与观察

1. 前端 typecheck/build 512M OOM 属环境问题（1.6G 物理内存），环境升级后应回归 512M 硬约束；与本轮代码无关
2. B3 adapter 审视结论（外部数据源/通知子系统不注册表化）为记录性结论，若规划层异议可复议
3. I47（bpm/h2 V8 partial index）未修复（本轮纯重构轮），已正式登记入候选池
4. 流程说明：本轮执行受本机内存限制，mvn 与 pnpm 编译严格串行（先后端后前端），无并行编译
