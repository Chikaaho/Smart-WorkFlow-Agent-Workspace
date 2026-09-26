# 后端跨模块 API `Optional` 契约 · 补充探索 01 回执（G1—G4 闭合）

> 任务：`search_task/backend-api-optional-contract-current-seams-supplement-01.md`。只读：未改代码/测试/配置，未编译；脚本仅驻 /tmp。
> 路径缩写：TSV 中 `/M/`=`/src/main/java/com/sw/ck/`，`/T/`=`/src/test/java/com/sw/ck/`，前缀 `Smart-WorkFlow-aPaaS-server/`。

## 1 纳入/排除规则（G1）

- 纳入：7 个 `-api` 模块 production 类型中 ①`public interface` 全部方法（含 default）②公开类的 `public static` 方法。共 **34 类型 / 121 方法**（33 接口 + `RestrictedExpressionEvaluator` 3 个 public static）。
- 排除（规则命中，**候选 0**，无静默排除）：DTO/record/枚举访问器与工厂（如 DeptOptionDTO get/set、`NotifyTargetResolution.of`、`BpmNodeCapabilityDTO.from`）、异常访问器（`…ResultLimitExceededException.getMaxRows`）、错误码 getCode/getMessage、常量类（`ParticipantStrategy`、`NodeApproverType`）、`Object` 覆写、`RestrictedExpressionEvaluator` 的 9 个 private static。openapi-api 仅错误码枚举：0 纳入。

## 2 最终计数（全部可由 TSV 按 ID 过滤复算，G3）

- 方法 121（default 15、static 3）；已 Optional 1（`BpmNodeRegistry.find`，AM-097）；待改造 120。
- 返回类别：VOID 24 / BOOL **14** / LONG 4 / BOXED_LONG 1 / LIST 30 / MAP 4 / BYTE_ARRAY 1 / STRING 24 / OBJECT 18 / OPTIONAL 1。
- 缺失语义（字段 missing_sem）：NULL_RETURN **21**、EMPTY_COLL 29、NON_NULL 24、PRIM_ANSWER 16、SENTINEL 3、EXC_MISSING 4、VOID_NA 23、NA 1；**异步/回调 0**（全仓无 CompletableFuture/@Async 返回）。
- 失败语义（fail_sem）：TOLERANT 81 / THROWS 36 / STATE_RESULT 4；一个方法可同时有成功结果+抛错（分字段记录，如 `value`/`freeze`/`submit`）。
- 迁移类别（migration，按规划裁决 §3）：WRAP_NULL 21、VOID_RESULT 24、WRAP_NONNULL 20、PRIM_BOXED 16、COLL_2LAYER 33、SENTINEL_TYPED 3、EXC_TO_EMPTY 3、COMPLIANT 1。
- 复算命令：`awk -F'\t' '$8=="NULL_RETURN"{print $1}' inventory-*.tsv`（列号见 TSV 首行）。
- 实现文件 **49**；生产调用点 **239**；测试引用点 **230**；IMPL 引用行 152（引用合计 621 行）。

## 3 与回执 01 的差异（G6 勾稽，不维护两套值）

1. 方法 118→**121**：+3 静态工具（G1 纳入 static）。
2. boolean 13→**14**：回执 01 解析器误滤名为 `record` 的方法，`ConsensusVotePort.record` 漏计。
3. List/Map 33→**34**：`LifecycleTaskEntryPort.resolveParticipantsByFunction` 的 FQCN `java.util.List` 回执 01 误归对象类。
4. 实现面 25→**49 个文件**：回执 01 只数 Facade 级 Impl+配置 bean，漏计多实现 SPI（5 渠道适配器、7 参与人解析器、8 具体翻译器+1 抽象基类 ServiceTaskNodeTranslator、2 nodefunc、2 NodeApprover 解析器、JobFacadeImpl 等）。
5. 哨兵 3、null 21 与回执 01 一致；"异常表缺失 5 组"为类型组口径，方法级为 4（download/getUrl/delete/getBpmnXml）；`executeQuery` 缺失走 IAE 归 NON_NULL+THROWS（缺失 vs 校验边界在实施时按方法定义，已在 note 标注）。

## 4 零生产调用方法（ZERO_CALLER，G4）

共 **13**：RESERVED_API 2（JobFacade.getById AM-001/getByJobName AM-002，javadoc 供 BPM 预留）；MODULE_INTERNAL_SPI 1（JobHandler.getName AM-004，bean 名匹配机制不经方法调用）；API_DEFAULT_DELEGATED 1（NotifyTargetResolver.resolvePhone AM-015，仅 api default L34 兜底调用，生产已覆写 resolvePhoneForTenant）；UNUSED_FACADE_METHOD 9（required AM-012、getUrl AM-021、getFormDefinitionById AM-028、getFormDefById AM-031、searchActiveDepts AM-037、resolveLabel AM-041、findProcessDefinitionIdByDeployment AM-061、getTaskOwner AM-091、addCandidateUser AM-092）。
**声明**：任务给定三分类不足以覆盖"无调用的 facade 查询方法"，增设 UNUSED_FACADE_METHOD 与 API_DEFAULT_DELEGATED 两个标记，供 Planner 裁决删除/保留；`BpmNodeDefinition.validateConfig` 非零调用（唯一调用方为 BpmNodeRegistry default AM-099→api L40 委托）。

## 5 文件索引（search_fallback/）

- 逐方法矩阵（首行 15 字段，ID 升序；合计 121 方法）：`…inventory-{job(4),notify(13),storage(5),form(14),system(15),bpm-facades(12),bpm-taskfacade(26),bpm-registry-nodedef(7),bpm-ports(14),bpm-spi(8),bpm-static-evaluator(3)}.tsv`。
- 引用（id,kind=PROD/TEST/IMPL,路径:行）：`…references-{job(3),storage(15),system-01(45)/-02(46),form(70),notify-01(58)/-02(58),bpm-facades(44),bpm-ports(37),bpm-registry-nodedef(42),bpm-spi(35),bpm-static-evaluator(11),bpm-taskfacade-01(78)/-02(79)}.tsv`，合计 621 行。
- 体量：inventory 1.0–7.1KB、references 0.3–7.6KB；`bpm-taskfacade`（单类型 26 方法）与其 references 超 5KB 目标，为保住路径+行号证据不删减，其余达标。
- 勾稽：inventory 覆盖 121 ID；references 覆盖 120 ID——唯一无引用行为 AM-004（`JobHandler.getName`：SPI 零 main 实现、零生产调用、零测试引用，矩阵行自带 `NO_MAIN_IMPL(SPI)` + `ZERO_CALLER` 标注，空引用即事实）。

## 6 方法级调用方口径（G4）

按"接收者变量声明类型=该 API 类型"匹配调用点（字段/参数/局部变量/`Map<String,T>` 注册表/静态调用），非文件级引用；已修正 4 处链式接收者（ObjectProvider 链 `NotifyInboxController:76`、`ConsensusCompletionEvaluator:76`、lambda 参数 `NotifyFacadeImpl:69`、`NotifyChannelConfigServiceImpl:38,102`）。同名方法误报已用接收者类型排除（如 Flowable `task.getVariable`、`commandQueue.complete`）。Impl 自身文件不计为调用方。

## 7 未确认项（不影响总数复算）

- `TenantValidityFacade` 实现为方法引用 bean（SystemAutoConfiguration:55→`TenantValidityService.isValid`），底层行为未逐行核（boolean 判定，语义无歧义）。
- 测试引用列覆盖 mock 桩与直接调用，未区分"断言缺失语义"与"仅装配"；实现期逐方法补。
- `executeQuery`/`startProcess` 的"上下文缺失 vs 校验失败"归类需实施期按裁决 6 逐方法定界（已在 note 标注）。
- 规划复核裁决的 8 条口径未在本回执重开；迁移类别仅表达"当前→目标"的方向分类，非实施设计。
