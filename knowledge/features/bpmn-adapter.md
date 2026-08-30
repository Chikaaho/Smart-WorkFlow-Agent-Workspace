# 功能追踪：bpmn-adapter

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
| 功能编号 | 对应 [[known-issues]] I3 剩余部分（BPMN 部分），无独立 Mxx-Fyy-zz 编号，服务于 M04-F06-01（流程监控） |
| 功能名称 | BPMN adapter 查看器实现（流程图渲染防腐层） |
| 功能目标 | 将前端 `adapters/bpmn/index.ts` 从接口壳实现为只读查看器（Viewer）防腐层，服务于未来 M04-F06-01 流程监控的流程图渲染/高亮需求 |
| 创建日期 | 2026-07-25 |
| 当前状态 | **COMPLETED** ✅（Steps 0-3 全部 PASSED，Step 4 SUPERSEDED 由 [[process-monitoring]] 承接） |
| 涉及模块 | 前端 `Smart-WorkFlow-Web/src/adapters/bpmn/`（Step 1 范围）；后端 `sw-bpm` 新增 BPMN XML 端点（Step 2，未来） |

---

## 2. 需求分析

### 2.1 功能目标

按 [[decisions]] D40 裁决：将 `adapters/bpmn/index.ts` 实现为**只读查看器（Viewer）**防腐层——挂载 bpmn-js Viewer 渲染已有 BPMN XML、销毁实例、自适应画布、节点高亮/取消高亮、转发节点点击事件。服务对象是 `功能清单.md` M04-F06-01（流程监控——流程图实时高亮、流转记录），非 M04-F01（流程设计器，其设计格式为后端 `ProcessGraph` JSON，与本 adapter 无关）。

### 2.2 非目标

- 不实现可编辑设计器（Modeler）能力——不支持拖拽新增/删除节点、连线编辑、属性面板
- 不实现 `exportXml()`（导出能力）——查看器场景无导出需求，旧接口壳中该方法直接移除
- 不新增后端 API 端点（`GET /workflow/defs/{id}/bpmn-xml` 留给独立的 Step 2，前后端协议变更需单独 Step，按 system.md §6.18）
- 不修改 `modules/workflow/ProcessDefList.vue` 或新增"查看流程图"UI 入口（留给 Step 3）
- 不实现 M04-F06 的完整流程监控页面/流转记录展示（留给 Step 4）
- 不安装 `bpmn-js-properties-panel`/`camunda-bpmn-moddle` 等设计器专用扩展包（Viewer 场景不需要）

### 2.3 影响范围

| 维度 | 详情 |
|------|------|
| 后端模块 | Step 1 不涉及；Step 2（未来）新增 `sw-bpm` 端点返回 BPMN XML |
| 前端模块 | Step 1：`adapters/bpmn/index.ts`（全量重写）+ 新建 `adapters/bpmn/index.spec.ts`；`modules/workflow/` 不在 Step 1 范围 |
| 数据库表 | 无变更 |
| API 端点 | Step 1 不涉及；Step 2（未来）新增只读端点 |
| 前端路由 | 无变更 |
| 依赖功能 | 参照已完成的 [[vue-flow-adapter]]（同类防腐层实现模式，零消费方先行）、`adapters/form-designer/`（成熟度参照） |

### 2.4 依赖和风险

| 类型 | 描述 |
|------|------|
| 前置条件 | `bpmn-js ^18.18.0` 已安装（裸包，无需新增依赖，Step 0 探索摘要 §2 确认） |
| 技术风险 | bpmn-js 底层依赖 SVG 渲染，jsdom 环境可能需要类似 [[vue-flow-adapter]] Step 1 的 `ResizeObserver` 一类 polyfill；按既有前端测试惯例（per-spec-file `vi.stubGlobal`），不修改全局 vitest 配置 |
| 阻塞项 | 无（Step 1 为零消费方独立实现，不依赖其他 Step） |

---

## 3. Step 列表

| Step | 名称 | 状态 | 推荐模型 | 执行回执 | 测试回执 | 验收结论 |
|------|------|:---:|:---:|:---:|:---:|:---:|
| 0 | BPMN adapter 现状与目标场景探索 | **PASSED** | DeepSeek 系（deepseek-v4-pro，用户手动切换） | 不适用（探索类） | 不适用 | 探索摘要已产出并被规划层消费，范围裁定为 [[decisions]] D40 |
| 1 | 实现 bpmn adapter 查看器（Viewer）— mount/destroy/highlight + 事件回调 | **PASSED** | deepseek-v4-flash | `receipts/step-1-execution.md` | `receipts/step-1-test.md` | 10 项验收标准逐条复核全部满足，方案归档至 `passed/` |
| 2 | 后端新增 BPMN XML 只读端点 | **PASSED** | deepseek-v4-pro（推荐）/ deepseek-v4-flash（实际） | `receipts/step-2-execution.md` + `step-2-correction-supplement.md` | `receipts/step-2-test.md` + `step-2-correction-supplement.md` | 修正回执后 10 项验收标准逐条复核全部满足，项目级 231→241（+10），方案归档至 `passed/` |
| 3 | 前端 ProcessDefList 新增"查看流程图"入口 | **PASSED** | deepseek-v4-flash | `receipts/step-3-execution.md` + `step-3-fix-verification.md` | `receipts/step-3-test.md` + `step-3-fix-verification.md` | 13 项验收标准逐条满足，3 轮手工验收问题修复后四连全绿 |
| 4 | M04-F06 流程监控页面（未来） | **SUPERSEDED** | — | — | — | — | M04-F06 由新功能 [[process-monitoring]] 独立承接，bpmn-adapter 防腐层目标已达成 |

> Step 0/1/2/3 均已 PASSED 并归档至 `passed/`。Step 4（M04-F06 流程监控页面）仍为 PENDING，尚未生成正式方案。

---

## 4. Step 详情

### Step 0：BPMN adapter 现状与目标场景探索

- **状态**：**PASSED**
- **目标**：确认 `adapters/bpmn/` 接口壳现状、`bpmn-js` 依赖版本、裁决"查看器 vs 设计器"范围、排查消费方与后端 XML 数据来源、与已完成 adapter（flow-graph/form-designer）的结构参照
- **实际模型**：deepseek-v4-pro（DeepSeek 系，探索模型角色）
- **方案位置**：`product/bpmn-adapter/step-0-exploration-task.md`
- **产出**：`product/bpmn-adapter/step-0-exploration-summary.md`（7 节结构化摘要）
- **验收结论**：PASSED — 摘要已产出且已被规划层消费用于生成 Step 1 方案（判据按 system.md §0.4.1 第 4 条，不套用 §5.3 执行类判据）
- **关键结论**：范围裁定为查看器（Viewer），归档为 [[decisions]] D40

### Step 1：实现 bpmn adapter 查看器（Viewer）— mount/destroy/highlight + 事件回调

- **状态**：**PASSED**
- **目标**：将 `adapters/bpmn/index.ts` 从接口壳全量重写为可用查看器防腐层，新增配套单元测试
- **实际模型**：deepseek-v4-flash（与推荐一致）
- **方案位置**：`product/bpmn-adapter/passed/step-1-bpmn-viewer-adapter.md`（已归档）
- **执行回执摘要**：`index.ts` 12→73 行全量重写（新导出 `mountBpmnViewer`/`BpmnViewerEvents`/`BpmnViewerInstance`，移除 `mountBpmn`/`exportXml`），新建 `index.spec.ts`（227 行/10 测试，覆盖 §13.2 全部 7 个必测场景 + 3 补充场景）。四连全绿：typecheck ✅ lint ✅ test（58 files/507 tests，+1 file/+10 tests）✅ build ✅。`package.json`/`pnpm-lock.yaml`/`modules/workflow/` 均零改动（REPORTED，回执含 git diff/status 依据）
- **测试回执摘要**：10 个测试项逐条对照全部通过；jsdom 环境需 6 处 SVG API polyfill（`beforeEach` 内 `vi.stubGlobal`/prototype 赋值，未改全局 vitest 配置），bpmn-js 渲染阶段的 stderr 警告（`createSVGTransform is not a function`）不影响 `importXML` Promise resolve 和 adapter 契约正确性
- **验收结论**：**PASSED** — 规划层逐条独立复核 §14 全部 10 条验收标准，证据链完整（修改文件+命令+测试结果+逐项对照），2026-07-25 判定通过
- **关键决策**：接口整体替换为 `mountBpmnViewer(container, xml, events?): Promise<BpmnViewerInstance>`（不保留 `mountBpmn`/`exportXml` 旧签名，零消费方使此为安全的破坏性变更，参照 [[vue-flow-adapter]] Step 1 同类先例）
- **遗留问题**：onElementClick 回调在 jsdom 环境下未强制断言触发（受 jsdom 事件绑定限制，留待未来浏览器环境集成测试或 Step 3 UI 接入后肉眼验收补充）；bpmn-js 图形渲染在 jsdom 下有 stderr 警告但不影响功能正确性——均为已知限制，非缺陷，无需新增 known-issues 条目（风险影响评估为"低"，已在回执 §11 记录）

### Step 2：后端新增 BPMN XML 只读端点

- **状态**：**PASSED**
- **目标**：在 `sw-bpm` 模块新增 `GET /workflow/defs/{id}/bpmn-xml` 只读端点，返回流程定义已部署到 Flowable 引擎的原始 BPMN XML 字符串，为 Step 3 前端查看入口提供数据来源
- **推荐模型**：deepseek-v4-pro（触发 §2.3「涉及跨项目联动」+ 跨三模块 Facade 边界）→ 实际执行：deepseek-v4-flash
- **方案位置**：`product/bpmn-adapter/passed/step-2-backend-bpmn-xml-endpoint.md`（已归档）
- **执行回执摘要**：6 个生产代码文件（BpmDeployFacade +12、BpmDeployFacadeImpl +22、BpmProcessDefService +12、BpmProcessDefServiceImpl +9、BpmProcessDefController +15、BpmErrorCode +1）+ 3 个新建测试文件（BpmDeployFacadeImplTest 2 @Test、BpmProcessDefControllerTest 3 @Test、BpmProcessDefServiceImplTest 4 @Test）+ ApprovalProcessIntegrationTest +1 @Test（1→2）。sw-bpm 模块基线 26→36（+10），项目级 231→241（+10），BUILD SUCCESS
- **测试回执摘要**：9 个单元测试 + 1 个集成测试 + 4 项静态检查全部通过。集成测试覆盖 deploy→getBpmnXml 往返（断言 StartEvent_1/EndEvent_1/合法 XML）
- **修正过程**：原始回执自报 PASSED 但测试计数存在三处矛盾（基线 19→26 声称 +7，实际基线 26→36 净增 +10；回执自列明细相加=10 与其结论+7 自相矛盾；git diff 删行描述混淆了预存无关改动），规划层独立核实后打回（见 `product/bpmn-adapter/step-2-receipt-verification-summary.md` + `passed/step-2-correction-request.md`）。后端执行代理产出修正补充回执（`receipts/step-2-correction-supplement.md`），逐项澄清数字口径与 Git 证据链——7 文件全部在 sw-biz/ 范围内，+121 行纯新增，零删除
- **验收结论**：**PASSED** — 修正后 10 项验收标准（§14.1-10）逐条独立复核全部满足，2026-07-25 判定通过
- **关键设计**：复用 `repositoryService.getResourceAsStream(deploymentId, resourceName)`（项目内零先例，取原始部署 XML 字节，非 `BpmnXMLConverter` 重新序列化）；Facade 桥接跨越 sw-bpm-process 不依赖 sw-bpm-engine 的模块边界；新端点作为 BpmProcessDefController 同级方法，不新建 Controller；不新增 @PreAuthorize（与 getDef/listDefs 权限暴露水平一致）

### Step 3：前端 ProcessDefList 新增"查看流程图"入口

- **状态**：**PASSED**
- **目标**：在 `ProcessDefList.vue` 新增操作列"查看流程图"按钮，点击后弹窗内调用 `GET /workflow/defs/{id}/bpmn-xml` 获取 BPMN XML，使用 `mountBpmnViewer` 渲染只读流程图
- **实际模型**：deepseek-v4-flash（与推荐一致）
- **方案位置**：`product/bpmn-adapter/passed/step-3-frontend-view-button.md`（已归档）
- **执行回执摘要**：4 文件修改（api/index.ts +12、ProcessDefList.vue +106/-2、handlers.ts +42、新建 spec.ts ~270 行/10 it()）。四连全绿：typecheck ✅ lint ✅ test ✅（59 文件/517 测试，+1/+10）build ✅。2 处合理偏差（mock 语法适配项目 `MockRegistration` 模式、未引入 `ElMessage` 因实际未使用）、5 个技术问题全部已解决。adapters/bpmn/、package.json、后端均零改动
- **手工验收修复（3 轮）**：
  - ① `c5d9e15` — SVGMatrix scale non-finite：移除 `v-show`、`fitViewport` try-catch、`@opened` 重试
  - ② `c300311` — mock XML 补充 `<sequenceFlow>` + DRAFT 按钮禁用态 CSS 增强
  - ③ `5ef2eee` — 隐藏 `.bjs-powered-by` Logo + 容器 `height:500px` 显式高度
- **验收结论**：**PASSED** — 13 项验收标准逐条满足，3 轮修复后四连全绿（typecheck ✅ lint ✅ 517 tests ✅ build ✅）。已知限制：mock BPMN XML 仅最简模板（I30/T10），已由用户确认

---

## 5. 测试和验收汇总

| Step | 测试总数 | 通过 | 失败 | 跳过 | 验收结论 |
|------|:---:|:---:|:---:|:---:|:---:|
| 1 | 10（新增，前端） | 10 | 0 | 0 | **PASSED** |
| 2 | 10（新增，后端：9 单元 + 1 集成） | 10 | 0 | 0 | **PASSED** |
| 3 | 10（新增，前端）+ 3 轮手工验收修复验证 | 10 | 0 | 0 | **PASSED** |

---

## 6. 功能完成检查清单

- [x] 所有 Step 均已 PASSED（Steps 0-3 完成闭环，Step 4 由 [[process-monitoring]] 独立功能承接）
- [x] 已更新 `knowledge/current-status.md`（2026-07-26 阶段三收尾）
- [x] 已更新 `knowledge/decisions.md`（D40 裁决 BPMN adapter 为只读查看器，2026-07-25）
- [x] 已更新 `knowledge/known-issues.md`（I3 BPMN 部分标记"查看器已实现"，2026-07-26）
- [x] 已生成交接摘要 → `knowledge/session-handoff.md`（2026-07-26）
- [x] 已标注功能清单中对应项状态（M04-F06-01 仍 ⬜，由 [[process-monitoring]] 独立功能推进）

---

## 7. 实际修改范围

| 文件路径 | 修改类型 | 摘要 |
|----------|:---:|------|
| `Smart-WorkFlow-Web/src/adapters/bpmn/index.ts` | 重写（Step 1） | 12→73 行，新导出 `mountBpmnViewer`/`BpmnViewerEvents`/`BpmnViewerInstance`，移除旧 `mountBpmn`/`exportXml` |
| `Smart-WorkFlow-Web/src/adapters/bpmn/index.spec.ts` | 新建（Step 1） | 227 行/10 测试，SVG API polyfill（jsdom），覆盖率 mount/destroy/highlight/fitViewport/click 事件 |
| `Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/facade/BpmDeployFacade.java` | 修改（Step 2） | +12 行 — 新增 `getBpmnXml(Long defId): String` 方法签名 |
| `Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/facade/BpmDeployFacadeImpl.java` | 修改（Step 2） | +22 行 — 实现 `getBpmnXml`（`repositoryService.getResourceAsStream` → `new String(bytes, UTF-8)`） |
| `Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/BpmProcessDefService.java` | 修改（Step 2） | +12 行 — 新增 `getBpmnXml(Long id): String` |
| `Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/impl/BpmProcessDefServiceImpl.java` | 修改（Step 2） | +9 行 — 校验 PUBLISHED + 调用 Facade |
| `Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmProcessDefController.java` | 修改（Step 2） | +15 行 — 新增 `GET /{id}/bpmn-xml` |
| `Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-api/src/main/java/com/sw/ck/bpm/api/exception/BpmErrorCode.java` | 修改（Step 2） | +1 — 新增 `PROCESS_NOT_PUBLISHED(2104)` |
| `Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-engine/src/test/.../BpmDeployFacadeImplTest.java` | 新建（Step 2） | 2 @Test |
| `Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/test/.../BpmProcessDefControllerTest.java` | 新建（Step 2） | 3 @Test |
| `Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/test/.../BpmProcessDefServiceImplTest.java` | 新建（Step 2） | 4 @Test |
| `Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-engine/src/test/.../ApprovalProcessIntegrationTest.java` | 修改（Step 2） | +1 @Test（1→2） |
| `Smart-WorkFlow-Web/src/modules/workflow/api/index.ts` | 修改（Step 3） | +12 行 — 新增 `getProcessDefGraph(id): Promise<string>` |
| `Smart-WorkFlow-Web/src/modules/workflow/views/ProcessDefList.vue` | 修改（Step 3） | +106/-2 + 修复（约 +23/-6）— 操作列 + el-dialog 查看器 + 3 轮手工验收修复 |
| `Smart-WorkFlow-Web/src/foundation/mock/handlers.ts` | 修改（Step 3） | +43 行 — `GET /api/workflow/defs/:id/bpmn-xml` mock（含 sequenceFlow + BPMNEdge） |
| `Smart-WorkFlow-Web/src/modules/workflow/views/__tests__/ProcessDefList.spec.ts` | 新建（Step 3） | ~270 行/10 it() 测试 |

## 8. 遗留问题

| 问题 | 严重程度 | 计划处理 |
|------|:---:|------|
| I30/T10: Mock BPMN XML 仅含 StartEvent→EndEvent 最简模板，所有流程显示相同图 | 低 | 已由用户确认当前可接受；真实 BPMN XML 数据源需等流程设计器（M04-F01）就绪后自然解决 |
| I31: M04-F06-01 流程监控的完整四能力（流程图实时高亮 + 流转记录 + 耗时分析 + 流程干预）未实现 | 中 | 由新功能 [[process-monitoring]] 承接推进，bpmn-adapter 的 Step 4 占位标记为 SUPERSEDED |
