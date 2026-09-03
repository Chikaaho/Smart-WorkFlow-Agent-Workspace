# P57 BPM 节点扩展执行补充回执

- 对应审查记录：`product/p57-bpm-node-extension/receipts/planning-review-p57-bpm-node-extension-01.md`
- 对应历史执行回执：`product/p57-bpm-node-extension/receipts/execution-completion-p57-bpm-node-extension-20260902.md`
- 任务：P57 BPM 节点扩展与统一能力契约
- 级别：XL
- 执行角色：Executor
- 执行日期：2026-09-02
- 当前状态：`VERIFYING`
- 终态提交：`EXECUTION_SUBMITTED`

## 1. 基线、工作树与执行边界

- Server：`develop`，基线 `04963259f589b1985495662e3f29ab00bfb92607`。
- Web：`develop`，基线 `6384f86a3f2f2410b2db7e4d24c09334f7a4505f`。
- 本轮未执行 commit、push，也未覆盖工作树中的其他既有改动。
- 原审查记录和历史执行回执保持不变；本文件只追加本轮执行证据与剩余缺口。

## 2. 按 G1-G7 执行结果

### G1：隔离节点发现、转换、运行链路

已补充真实 Flowable/H2 集成测试：

`Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-engine/src/test/java/com/sw/ck/bpm/engine/integration/P57IsolatedVerificationFlowableTest.java`

测试以独立 `P57_VERIFY` 测试扩展扫描生产 translator 包和测试 fixture 包，重建两次 `BpmNodeRegistry` 并校验顺序稳定；随后执行 START→P57_VERIFY→END 的真实 BPMN 部署、启动和结束，校验验证 delegate 被观察到，部署数和定义数各增加 1；未知节点和 null translator 结果均拒绝且不增加部署/定义。全量 Engine 回归中该测试 `2` 项通过。

边界：`P57_VERIFY` 是测试隔离 fixture，不是正式生产节点目录成员；当前生产应用重启日志确认只加载 `3` 个正式 translator，正式能力 API 仍只返回 START、APPROVAL、END。因此 G1 的“生产应用中的外部扩展重启发现并由真实前端完成配置、保存、发布、运行”仍未闭合，不能记为通过。

### G2：能力 API 与权限

在重建 jar 启动的真实 dev H2 应用上，对
`GET /api/workflow/defs/node-capabilities` 取得：

- 无 token：HTTP `401`，响应 `未认证`。
- 超级管理员：HTTP `200`，返回能力列表仅含 APPROVAL、END、START，响应字段为统一契约字段，无业务数据。
- 通过真实用户管理 API 创建的无角色普通用户：HTTP `403`，响应 `无权限`。

本轮完成的是同一 dev 上下文的未认证/授权/无权限对照和无业务数据泄漏检查；审查要求的至少两个真实租户/上下文同能力列表对照仍未完成。

### G3：失败纪律与零写入

`BpmNodeRegistryImpl` 的非法类型、重复类型、缺失能力和保留节点校验，以及转换器未知节点拒绝，均纳入回归。G1 集成测试进一步证明未知节点和 null translator 结果使用错误码 `2107` 拒绝，部署和流程定义计数保持不变；Engine 全量回归中相关测试通过。

现有 `GraphValidator` 和 APPROVAL translator 回归覆盖未知/保留节点、拓扑错误、缺失/非法 APPROVAL 配置和 `DESIGNATED` 约束。真实应用层面的每一种非法 publish 请求及数据库写入前后原始计数对照，仍需 Planner 按正式验收入口独立复核。

### G4：前端真实消费与 fail-closed

前端能力 API、严格解析器、拓扑/配置/必需节点校验和保存前阻断均已实现；Web 全量测试通过，包含畸形响应、能力缺失和图结构拒绝场景。

真实浏览器访问 `http://localhost:5173/workflow` 时被现有冷启动认证守卫重定向到 `/login?redirect=/workflow`，页面 DOM 显示用户名、密码、验证码和登录按钮。当前登录入口需要验证码，未绕过或代解验证码；因此本轮没有伪造“登录后真实设计器从能力 API 加载、成功保存”的证据。G4 的真实认证页面、成功保存和 API 失败页面阻断仍未闭合。

### G5：既有 START→APPROVAL→END 与 DESIGNATED

当前正式注册表和前端能力目录仍只允许 START、APPROVAL、END；既有 DESIGNATED 配置、`graph_json` 和流程审批相关回归均保持通过。Engine 全量包含审批集成测试，Process 全量包含定义、待办、实例和审批控制器回归。

但本轮没有在真实浏览器登录态下重新绑定完整的设计→保存→发布→启动→待办→审批→结果→轨迹证据，G5 的产品级行为闭环仍由 Planner 独立验收。

### G6：graph_json 原始持久化与回读

新增：

`Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/test/java/com/sw/ck/bpm/process/service/impl/GraphJsonPersistenceIntegrationTest.java`

该测试使用 Spring Boot、H2 和真实 MyBatis mapper 保存包含 opaque config/style 的图 JSON，然后直接执行：

`SELECT graph_json FROM sw_bpm_process_def WHERE id = ? AND tenant_id = 0 AND deleted = 0`

并与服务实体回读结果逐字节等价比较。Process 全量回归中该测试 `1` 项通过，原始库查询结果和回读结果一致。

### G7：可复核原始验证输出

本轮在上述两个明确 checkout/ref 上重新执行并取得退出码 `0`：

1. `MAVEN_OPTS="-Xmx2g" mvn -pl sw-biz/sw-bpm/sw-bpm-engine,sw-biz/sw-bpm/sw-bpm-process -am test`：Engine `33`、Process `72`、Common `18`、Security `6`、Basic IoT `23` 均通过，`BUILD SUCCESS`。
2. `NODE_OPTIONS="--max-old-space-size=2048" pnpm test`：`116` 个文件通过、`1` 个跳过；`1103` 个测试通过、`3` 个跳过。
3. `NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck`：退出码 `0`。
4. `NODE_OPTIONS="--max-old-space-size=2048" pnpm lint`：退出码 `0`；6 条 Prettier warning，无 error。
5. `NODE_OPTIONS="--max-old-space-size=2048" pnpm build`：1832 个模块转换完成，退出码 `0`；仅有依赖侧非阻断 `@vueuse/core` annotation warning。
6. Server/Web `git diff --check`：均为 `0`。
7. Server BPM API 的 Flowable import 扫描：`API_FLOWABLE_IMPORT_SCAN=0`。
8. 重建 jar 启动后的 `/api/actuator/health`：HTTP `200`；正式 registry 启动日志为 `3 translators`。

## 3. 当前结论与剩余核销项

本轮已执行审查记录要求的可落地修复和补证：统一节点注册/转换不再静默跳过未知结果，增加隔离 Flowable 链路和原始 `graph_json` 数据库证据，并复核真实后端鉴权与前端路由门禁。

仍不能宣称 `PASSED` 或 `COMPLETED`。剩余核销项是：

- 正式生产环境中真实外部隔离节点的重启发现、前端能力识别、保存、发布和运行；
- 至少两个真实租户/上下文的能力列表隔离对照；
- 真实浏览器认证后的设计器 API 消费、成功保存以及 API 失败/畸形响应阻断；
- 真实页面绑定的完整 START→APPROVAL→END 产品链路及 Planner 独立验收。

因此当前终态仍为 `EXECUTION_SUBMITTED`，方向状态仍为 `VERIFYING`，未移动到 `passed/`。
