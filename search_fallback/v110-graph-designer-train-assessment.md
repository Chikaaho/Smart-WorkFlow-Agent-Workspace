# v110 评估回执：Graph 设计器重做、P67 执行器、人工/子图节点与小尾巴

> 任务：`search_task/v110-graph-designer-train-assessment.md`｜2026-11-12｜执行只读评估
> 逐条证据：`search_fallback/v110-graph-designer-train-assessment-appendix.md`（下称「附录」）。两仓均为 1.0.0 发布源 main。

## Q1 设计器现状与差距

1. 现有设计器是 **vue-flow default 节点 + CSS 着色**，无自定义节点组件；色板为按钮点击添加（非拖拽），**新节点固定落点、连点即重叠**；START/END 面板纯空态（附录 §1.1）。
2. 流程设计器是**自研 SVG 内核**，与 Vue Flow **不共用适配层**；G1 可复用的是交互模式与视觉规范（卡片、节点库分组、属性页签、自动布局、缩放），非代码级复用（附录 §1.2）。
3. **G1 前置决策点 I48**：adapter 契约无边点击、无命令式更新、无自定义渲染——卡片重构、"+"插入、状态高亮三项全部超契约，须规划层修订 D80 裁定（附录 §1.3）。
4. Dify 对照（附录 §1.4 表）：整图试运行已有；节点卡片摘要、"+"插入、`{{节点.字段}}` 变量选择器、单节点运行、节点级运行状态五项全缺。变量选择器是**结构性缺口**：现「单全局累积变量」模型 + START/END 无入参出参声明。
5. graph_json 的 config/style 后端不解释、加键即落库——**改设计器零 DB 迁移**，旧图兼容靠前端缺省处理（附录 §1.5）。
6. 拆分：必须=卡片重构/插入与落位/变量选择器（含 START/END 参数声明）/面板统一；可后放=单节点运行、节点级高亮（依赖后端逐节点事件，0.2.3 锁定无）、小地图。截图三张在 `.runtime-v110/`（附录 §1.6）。

## Q2 P67 Graph 执行器

1. 流程侧：P57 的 `NodeTypeTranslator` Bean **Spring 自动发现即注册**；**推荐做成服务节点的一种执行器**（1 个 Translator 子类 + delegate + Validator 校验项），新节点类型改动更大且语义重叠（附录 §2.1）。
2. 表单侧：P65 宿主函数是前端平铺 Map，但解释器**仅支持同步函数**，长任务 `api.graph.run(...)` 不适配 → 推荐服务端动作形态；form→agent 依赖方向不允许，跨模块走 ObjectProvider+白名单先例（附录 §2.2）。
3. 入参/出参**无结构声明**（受理仅单 `input` 文本，输出=END 变量文本）→ **G2 依赖 G1 的开始/结束节点参数声明**（附录 §2.3）。
4. request/event 表**无业务关联列**、受理 API 无业务上下文字段；先例为 IoT 桥回写 execution_id → G2 需迁移加关联列或复用回写模式（附录 §2.4）。

## Q3 人工节点与子图节点

1. 0.2.3 恢复语义只收敛 QUEUED/中断标记，**无 WAITING/PAUSED、无外部恢复执行点**；人工节点需加状态转换+「外部提交→重新 dispatch」端点+可持久化挂起变量。待办**推荐只在 Graph 运行页处理**（与 BPM 待办体系零关联；Dify Human Input 同样不进审批中心）（附录 §3.1）。
2. 子图：发布快照机制已有（执行绑定 defVersion）可复用；**取消传递/嵌套深度/循环引用全无**（无 parent_execution_id，防环仅步数预算），需迁移+发布校验+取消传播三项新增（附录 §3.2）。风险：子图事件 sequence 隔离、父子超时叠加、重启收敛语义（附录 §3.3）。

## Q4 小尾巴

1. 任务详情遮挡：吸底 sticky 卡 + 容器底部仅 24px padding、未预留 ≈150px 操作卡高度 → 加动态 bottom padding 或改文档流。
2. 发起人筛选：`el-input-number :min="1"`（0 输不进、无姓名选择）；可复用 UserRemoteSelect，需为 IoT 发起人（initiatorId=0）补固定选项。
3. 实例监控干预页：时间无格式化（复用 formatDrawerTime）、状态英文（复用 enum-label WORKFLOW_INSTANCE）、显示内部 key（前后端均无名称字段，需后端补 defName 或前端关联映射）。
4. 沙箱 NPE：**根因在被测代码**——主线程 `exitValue()==0` 后直接 `success(outcome[0])`，RPC 线程可能尚未读到 RESULT 行 → SUCCESS+null；修法=有界 join 后仍 null 则明确 FAILED（附录 §4.4）。

## Q5 版本与等级

- 升 1.1.0：Server 改 pom revision + CI 硬编码断言（无 x.0.0 格式限制，其余断言动态）；Web 改 package.json；工作区根 version.json 发布时同步（附录 §5）。
- 迁移：G2/G3 需 1 份 `V1.1.0__*.sql` 复制 **9 个方言目录**（SQL Server 按终态基线惯例）+ checksum 门禁；CI 实跑 H2+PG，六库冒烟为脚本验证。
- 等级：G1=L、G2=L（跨仓三处接入）、G3=M、G4=S → **XL 成立**；若收窄，G2 可拆出（P67 事项 3/4/5 语义未定）。

## 需要 Owner 决定的事项（附推荐）

1. G1 技术路线：推荐 vue-flow + 扩展 adapter；备选迁自研 SVG 内核。
2. G2 接入方式：推荐服务节点执行器；同步/异步推荐同步+超时+异常分支。
3. 绑定版本推荐固定 defVersion；运行身份推荐系统身份+租户隔离。
4. 人工待办去向：推荐只在 Graph 运行页。
5. 版本号 1.1.0 与范围：G1—G4 全做，或 G2 拆出。
6. 表单侧 api.graph.run 形态：推荐服务端动作，非同步 JS 函数。

## 未确认与过程

1. lifecycle 异步执行的节点轨迹是否落 `sw_agent_graph_execution_node`（前端确定未接，后端未核实）；2. Dify 节点卡片摘要与"+"插入的官方文档页未找到（按产品公开行为写，附录 §1.4 已标）。无方向冲突。过程审计事实（Flyway validate 中止、误占 5173 已按 PID 清理）见附录 §8；隔离实例密钥/日志/截图在 `.runtime-v110/`（不入 Git）。

## 是否需继续探索

不需要：Q1—Q5 全部有结论，两项未确认不影响方向成立；规划可据此写正式方向，Owner 决定项随方向一并下发确认。
