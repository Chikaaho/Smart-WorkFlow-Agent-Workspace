# P57 BPM 节点扩展执行提交回执

- 任务：P57 BPM 节点扩展与统一能力契约
- 级别：XL
- 执行角色：Executor
- 执行日期：2026-09-02
- 当前状态：`VERIFYING`
- 终态提交：`EXECUTION_SUBMITTED`

## 1. 基线与范围

- Server：`develop`，基线 `04963259f589b1985495662e3f29ab00bfb92607`
- Web：`develop`，基线 `6384f86a3f2f2410b2db7e4d24c09334f7a4505f`
- 两个工程工作树均包含本任务未提交改动；本轮未执行 commit、push，也未处理其他既有脏改动。
- 本回执只覆盖 P57 方向中允许进入实现的统一节点契约、注册/发现、图校验、能力查询、前端消费与 fail-closed 接缝。

## 2. 已实现内容

### Server

1. 在 BPM API 增加不依赖 Flowable 的节点语义契约：节点类型、拓扑、配置字段、支持能力、元数据、定义及对外 DTO。
2. 增加统一 `BpmNodeRegistry` 及生产 `BpmNodeRegistryImpl`，通过 Spring `List<NodeTypeTranslator>` 自动发现节点；对类型格式、重复类型、元数据、拓扑、配置字段、四类能力和保留节点标记执行启动期 fail-fast 校验。
3. `GraphToBpmnTranslator` 生产路径改为消费统一注册表；未知节点不再跳过，发布转换返回 `NODE_CAPABILITY_MISSING`（2107）；重复注册不覆盖。
4. `GraphValidator` 改为从统一注册表读取 START/END、拓扑和配置约束，APPROVAL 的 `DESIGNATED` 配置校验返回 `NODE_CONFIG_INVALID`（2106）。
5. 增加 `GET /workflow/defs/node-capabilities`，复用现有 `workflow:def:view` 权限；生产自动配置、部署门面、控制器和测试构造路径已接入统一注册表。
6. 当前生产注册节点为 `START`、`APPROVAL`、`END`。未把 CONDITION、EXCLUSIVE_GATEWAY、PARALLEL_GATEWAY、JOIN_GATEWAY 伪装成可用节点；未知/保留节点在发布校验阶段拒绝。

### Web

1. 增加与后端语义一致的 `BpmNodeCapability` 类型、严格解析器、拓扑/配置/边关系校验和必需节点校验。
2. 流程设计器通过 `/workflow/defs/node-capabilities` 获取能力，节点标签来自响应；能力请求失败、响应畸形、缺少必需能力时阻止编辑器保存，保持 fail-closed。
3. Mock handler 增加同一能力接口及 401/403 权限门禁；Mock 只暴露 START、APPROVAL、END，保留节点不出现在可设计目录。
4. 保留现有 `graph_json`、`DESIGNATED` 和 START→APPROVAL→END 骨架；没有引入 P58 网关、通知或会签实现。

## 3. 节点能力矩阵

| 节点 | DESIGN | TRANSLATE | RUNTIME | CONFIG_VALIDATE | 当前结论 |
|---|---:|---:|---:|---:|---|
| START | 是 | 是 | 是 | 是 | 可设计、保存、发布、运行 |
| APPROVAL | 是 | 是 | 是 | 是 | 可设计、保存、发布、运行；配置类型为 DESIGNATED |
| END | 是 | 是 | 是 | 是 | 可设计、保存、发布、运行 |
| CONDITION / 网关族 | 否 | 否 | 否 | 否 | 未注册；发布时按未知/缺失能力拒绝 |

## 4. 验证证据

以下命令均在本轮执行，均以退出码 0 完成：

1. Server 受影响模块及依赖全量回归：

   `MAVEN_OPTS="-Xmx2g" mvn -pl sw-biz/sw-bpm/sw-bpm-engine,sw-biz/sw-bpm/sw-bpm-process -am test`

   Reactor `BUILD SUCCESS`；BPM Engine 31 项通过，BPM Process 71 项通过，Common 18 项、安全 6 项、Basic IoT 23 项通过。

2. Server 节点注册、转换、图校验、控制器授权定向回归：

   `MAVEN_OPTS="-Xmx2g" mvn -pl sw-biz/sw-bpm/sw-bpm-engine,sw-biz/sw-bpm/sw-bpm-process -am -Dtest='BpmNodeRegistryImplTest,NodeTypeTranslatorPlugabilityTest,GraphToBpmnTranslatorTest,GraphValidatorTest,BpmProcessDefControllerTest,BpmProcessDefControllerAuthorizationTest' -Dsurefire.failIfNoSpecifiedTests=false test`

   Engine 13 项、Process 13 项通过。

3. Web 全量测试：

   `NODE_OPTIONS="--max-old-space-size=2048" pnpm test`

   116 个测试文件通过、1 个跳过；1103 个测试通过、3 个跳过。

4. Web 类型检查：`NODE_OPTIONS="--max-old-space-size=2048" pnpm typecheck`，退出码 0。
5. Web lint：`NODE_OPTIONS="--max-old-space-size=2048" pnpm lint`，退出码 0。
6. Web 生产构建：`NODE_OPTIONS="--max-old-space-size=2048" pnpm build`，1832 个模块转换完成，`built in 1.32s`，退出码 0。输出仅包含 `@vueuse/core` 依赖中的两条 `INVALID_ANNOTATION` 非阻断告警。
7. Server/Web `git diff --check` 均通过。
8. Server BPM API 的 `^import .*org.flowable` 扫描无结果，输出 `API_FLOWABLE_IMPORT_SCAN=0`。

## 5. 负向与权限证据

- 注册表测试覆盖稳定排序、重复类型、非法类型、元数据和实际 START/END/APPROVAL 序列化契约。
- 转换器和插件可插拔测试覆盖未知节点拒绝（2107），不再静默跳过未知节点。
- 图校验测试覆盖拓扑、保留节点、APPROVAL 缺失/非法配置和 `DESIGNATED` 约束。
- 控制器授权测试覆盖能力查询接口的权限要求；Mock 门禁覆盖无 token 的 401、无权限身份的 403 和超级管理员放行。
- 前端能力测试覆盖合法响应、畸形响应、重复节点、未知节点、缺失 APPROVAL 配置和图结构拒绝。

## 6. 尚未声称完成的边界

本回执不把静态/单元/受影响模块回归等同于正式产品验收。当前仍缺少方向 Stage D 要求的独立真实证据：

- 一个不进入正式节点目录的隔离验证节点，在真实应用重启后被发现并完成前端识别、保存、发布、运行；
- 真实浏览器页面、后端请求/响应、数据库持久化及可观察运行结果的逐步绑定证据；
- Planner 对上述行为证据及全部验收标准的独立复核。

因此本任务保持 `VERIFYING`，仅提交 `EXECUTION_SUBMITTED`；本回执不写 `PASSED` 或 `COMPLETED`，也不移动方向文件到 `passed/`。

