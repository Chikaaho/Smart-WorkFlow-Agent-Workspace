# P64 阶段Ⅰ 完成回执03

2026-10-09；Executor。输入：[一级执行补充提示01](planning-execution-prompt-p64-phase1-01.md)、[规划复审02](planning-review-phase-1-02.md)、[主方向](../ready/direction-p64-mes-advanced-orchestration.md)、[实施授权](../ready/authorization-p64-implementation-20261008.md)、[回执02](phase-1-completion-receipt-02.md)、[证据索引 phase1-03](evidence/phase1-03/index.md)。本回执按一级提示的 15 个原子子项逐项给出“制品位置→实际结果→边界”，并显式列出未闭合项与下一动作。

**状态声明：P64 保持 IN_PROGRESS、阶段Ⅰ VERIFYING。** 本回执不写功能 PASSED/COMPLETED；实现自验不等于规划裁决。

## 1. 本轮新增实现（附最小编译/测试证据）

| 编号 | 实现与位置 | 运行结果 |
|---|---|---|
| P1-02a | 判断脚本隔离执行改为**专职 worker JVM 进程池**：`sw-biz/sw-bpm/sw-bpm-engine/.../script/ScriptWorkerPool.java`（`-Xmx128m` 真实堆上限、启动握手核对 `Runtime.maxMemory()`、wall-clock 到期 `destroyForcibly` 并等待退出、`readProtocolLine` 容忍非协议输出）与 `ScriptWorkerMain.java`（stdout 协议专用 UTF-8、进程内日志改道 stderr） | engine 92/0；`ScriptWorkerPoolTest` 4/0：worker 自报 `maxHeapBytes=134217728`；持留式分配使 worker 内出现 `Java heap space` → RESOURCE_LIMIT 且池恢复；超时判 TIMEOUT（脚本 500ms 实际值）且无遗留；全局/租户满额判“繁忙（可恢复）” |
| P1-02b | 同一池统一承载 HTTP 办理/命令消费/预览（三处均经 `BpmScriptEvaluatePort#run`）；`sw-bootstrap/src/main/resources/application.yml` 新增 `sw.bpm.script.workers/tenant-workers/queue-wait-ms`（2/1/50ms，可环境变量覆盖）——满额可恢复、无无界等待 | 同上并发用例：租户 A 占许可 → 同租户探测 RESOURCE_LIMIT“繁忙”；异租户正常；许可释放后同租户恢复，`heldTenantPermits` 归零 |
| P1-04b | 任务级绑定版本冻结：`FormDefinitionService#getFormDefinitionSnapshot`（表单版本快照 SPI，默认 empty 回退）+ `NodeFormDataServiceImpl`/`NodeFormDataService`（任务行一经建立即冻结 `form_version`；校验与渲染按绑定版本快照，缺失回退当前定义）+ `BpmNodeFormController` 读取按绑定版本 | form-biz 176/0；process 325/0：`shouldValidateAgainstBoundVersionSnapshotAfterRepublish`（草稿绑定 v3 → 表单再发布 v5 → 最终提交仍按 v3 快照校验、版本不漂移；快照缺失回退）、`shouldLeaveDraftUntouchedWhenFinalSubmitRejected`（校验失败零半提交）、`shouldRejectDraftAfterSubmitted`（已提交不可改写） |
| P1-06b | 状态语义与原子边界：`OrchActionStartCommandHandler` 成功路径落 `STARTING`（受理≠已启动）、`TriggerExecutionService` 入队失败删除意图行零残留、`BpmTriggerController` 回查按目标实例持久事实解析展示、重试门槛按持久事实 | process 325/0：`shouldCreateRecordAndMarkStarted`、`shouldSkipReplayWhileTargetStarting`、`shouldDeleteIntentWhenEnqueueFails`（捕获 `deleteById(777L)` + exec 留痕“派发失败”）、`shouldResolveStartingDisplayByInstanceFact`、`shouldRejectRetryWhenInstanceAlreadyExists`、`shouldAllowRetryWhileInstanceNotYetCreated` |
| P1-03a/03b | 设计器业务名与可达性：变量来源节点、触发器源节点/列表按“业务名(nodeKey)”展示；节点表单字段按“标签(field_name)”选择；P64 弹窗加 `max-height:88vh` + 内容区滚动（全局规则，`append-to-body` 传送后不带 scoped 属性） | web 四门禁全绿：typecheck 0、lint 0 error/3 warning、vitest 1370+3、build ✓3.60s |

## 2. 原子子项逐项对照

| 原子ID | 本轮结果 | 制品/实际结果 | 边界与剩余 |
|---|---|---|---|
| P1-01a | 部分闭合（计数更正 + 逐类结果封存） | 上轮“新增26”更正为**22（17+5：302→319、83→88）**；本轮再新增 **10**（engine +4、process +6），三处模块计数与逐类报告见 `evidence/phase1-03/server/*`（engine 92、process 325、form-biz 176） | 未把“模块总计”当作逐条语义通过的替代；`ui07` 等历史画面不重标 |
| P1-01b | 部分闭合（正常认证已取，网络索引未归档） | `browser/ui01-login-workspace.png`：验证码经人工识图输入（放大+按字形判读，未反推秘密），登录成功 URL=`http://127.0.0.1:5174/workspace`、视口 1920×1080、身份=系统管理员、headless=false | 逐请求结果/网络关联索引尚未单独归档（下一动作：用 `performance` 资源条目 + 已授权请求回放生成索引，令牌不入证据） |
| P1-02a | **闭合** | 见 §1；worker 自报堆上限 134217728、OOM→RESOURCE_LIMIT、超时→TIMEOUT 且无遗留、池恢复 | 隔离技术选择=专职 worker 进程（授权内自选），未删除 128MiB/并发/队列标准；未开 P62 延期策略 |
| P1-02b | **闭合** | 见 §1；三入口共用同池 + yml 三键落实；满额判繁忙可恢复、有限排队 50ms | 未做长压测；默认值与契约一致 |
| P1-03a | 闭合（配置行为），一处边界 | 三张表单发布 → 三类节点经**业务名选择器**绑定节点表单 → 五变量按三来源（主表/节点表单/系统白名单）配置（来源节点与字段均业务名）→ 触发器（源节点业务名、授权变量业务名、分支/脚本）→ 动作（目标流程/表单**按名称选择**、START_EACH、派发上限、两条映射）→ 保存 → 校验 0 错 → 发布成功 → **DB 回读冻结图与草稿图逐字节一致** | 映射“目标字段”为手输字段名（曾尝试改为字段选择器，因下拉未加载已回退，未留半成品）；`变量来源节点/触发器源节点` 显示“业务名(nodeKey)”形式 |
| P1-03b | 实现闭合；768 取证未做 | 本轮实测发现触发器弹窗高 1130px > 1080 视口导致下部控件不可达 → 全局加 `max-height:88vh` + 内容区滚动（滚动后可配置映射=本回执 §3 配置链实证） | 768×1024 配置/详情/回查截图与“横向滚动可达”证据待补 |
| P1-03c | 未闭合 | 本体已就绪：handler1/handler2（无角色）已入隔离库；主流程 CONSENSUS 节点参与人=[1,2]、DYNAMIC_PARALLEL 来源=var_handlers | 需以 handler1 身份登录完成其有权任务 + 普通用户直达设计器的准确路由/请求结果 |
| P1-04a | 部分闭合 | 三类节点（APPROVAL/CONSENSUS ALL/DYNAMIC_PARALLEL）**新表单绑定与发布对象**已就绪（冻结图回读）；节点业务表单三节点均绑定 `p64_node_form` | 三类节点的**实际办理链**（含同轮并行任务、合法新轮次排除旧结果）未跑：发起页的 `USER(multiple)`/`DEPT` 字段在表单渲染层退化为占位文本（`component.selectUsers`），需先修该渲染缺口或改用受支持字段类型 |
| P1-04b | 闭合（版本冻结+零半提交；动作事务=单测层） | 见 §1；绑定版本快照、失败零改写、已提交拒绝改写 | 任务动作与表单提交的**整链事务回滚**目前为单测语义（`submitFinal` 抛错使办理回滚），未做 H2 集成级故障注入 |
| P1-05a | 未新增（沿用既有单测集合） | 上一轮已锁定 STRING 双向运行与 NUMBER/BOOLEAN 精确匹配；本轮未改这些语义 | 三来源运行取值/ROWS 完整来源/事件边界的**运行对象级**结果仍待随 P1-04a 办理链补齐 |
| P1-06a | 未闭合 | 目标流程 `bpm_fb4f174bba624352`（整改处理）与 START_EACH 动作已发布；`START_GROUPED` 单测沿用 | 三种发起类型（SINGLE/多项 EACH/GROUPED）真实实例与映射、重复/并发/异载荷/恢复的最小结果未跑（受 P1-04a 同一渲染缺口阻塞） |
| P1-06b | 闭合（单元层），运行二段窗口待补 | 见 §1 六个用例 | “FLOW_START 未完成/失败窗口”的真实运行结果（含启动中展示与重试回读）待随办理链补 |
| P1-07a | 未闭合 | 主流程与本轮对象均为 0.1.7 新库；隔离库 Fact：Flyway 实跑 14 条至 v0.1.7 | “0.1.6 真实运行实例升级后原义办理完成”需专用升级库演练（计划：`p64_upgrade_run` 以 `spring.flyway.target=0.1.6` 建真实在役实例 → 去 target 升级 → 继续办理） |
| P1-07b | 未闭合 | 回退契约文字沿用 ADR §6；`rollback_shouldConvergeOrchActionStartWithoutHandler` 既有单测 | ADR 核查 SQL 未在收敛后的库上实跑，结果未记录 |
| P1-08a | 部分完成 | 本轮同步 `knowledge/current-status.md`、`memory/*`、`todo/*`（见 §5）；三仓 SHA 见 §5 | 逐入口覆盖矩阵（实际值/时点/回读）待本轮提交回读后据实补齐；根 gitlink 保持 `78495dc` |

## 3. 提交前核对（对一级提示 §6 的自查）

- 对象/快照匹配：P1-02 的证据绑定 worker 进程与 `-Xmx128m` 自报值；P1-03a 的证据绑定 `bpm_6938b3a7dcda49b8` v1 冻结图与 `p64_node_form`；P1-04b 绑定任务行绑定版本与表单版本快照。
- 断言结果可回读：模块计数、冻结图、表单/流程对象均给可回读制品（`evidence/phase1-03/`）。
- 反向零增量：P1-06b 以“删除意图行 + exec 留痕 + 不冒称成功”断言；P1-02 以“满额繁忙、无遗留活判断、池恢复”断言。
- 计数勾稽：engine 88→92（+4）、process 319→325（+6）、form-biz 176 不变；web 152 文件/1370 用例与上轮同基线。
- 受影响门禁：本轮改动仅 engine/process/form-api/form-biz/web 设计器 → 已跑对应模块与 web 四连；bootstrap 迁移与 PG 演练代码未改。
- 剩余可执行项：见 §2 未闭合行（均为可执行的下一步，外部阻塞仅“表单渲染层 USER/DEPT 占位”一项需先修）。

## 4. 本轮未做（不得读作已收敛）

1. 三类节点实际办理与 SINGLE/GROUPED/多项真实启动（受 P1-04a 渲染缺口阻塞）。
2. 768 视口配置/详情/回查证据；handler1 实办与直达设计器拒绝证据。
3. 0.1.6 升级续办演练与 ADR 回退核查 SQL 实跑。
4. 请求级网络索引归档与 P1-08a 覆盖矩阵。

## 5. 提交与回读

- 三仓提交与推送 SHA、`knowledge/current-status.md`/`memory`/`todo` 同步结果随本回执一并提交后回读（见 §5 追加行与本目录 `../evidence/phase1-03/index.md`）。
- 治理侧缺陷（Windows 门禁 9009/诊断）仍由管理员处置，本回执不改治理实现。
