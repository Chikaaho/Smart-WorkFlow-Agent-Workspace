# P64 阶段Ⅰ 完成回执04

2026-10-09；Executor。依据[二级执行提示02](planning-execution-prompt-p64-phase1-02.md)（替代一级提示01 作唯一当前执行入口）、[复审03](planning-review-phase-1-03.md)与[证据索引04](evidence/phase1-04/index.md)。主方向/完整实施授权不变；**本回执自验通过、待 Planner 独立复审；P64 保持 IN_PROGRESS、阶段Ⅰ=VERIFYING；Executor 不写功能 PASSED/COMPLETED、不核销 P、不晋级基线。**

## 1. 按剩余账本逐项（ID → 原文件:位置 → 实际结果 → 边界）

**P1-01a 转录/缺封装** → `receipts/evidence/phase1-04/index.md` §1、`server/*.log` 原件 → 计数按真实日志纠正：engine **98/0/0/0**（`Tests run: 98, Failures: 0`）、process **330/0/0/0**（`Tests run: 330`）、Web vitest **1371+3**（152 文件+1 跳过）；form-biz 沿用回执03 176/0 原输出并显式标注"本轮未改动、不同加"。索引不再声称整命令 exit0 以外的事实，退出码逐条取自日志尾部 `*_EXIT=`。→ 边界：form-biz 未重跑（模块未改动）；旧失败制品（回执03 的 form 构建失败段）保留在 phase1-03 原文件，不删除、不改写。

**P1-01b 缺正式关联** → `browser/network-index-768.json`、`evidence/phase1-04/index.md` §3 → 真实会话逐请求索引（method/url/status/dur，本次 21 条）与运行指纹（UA/视口 768×1024/dpr/locale/href/UTC 时点）随证据落盘；采集器于登录页安装、贯穿 SPA 会话；令牌仅内存（`localStorage` 键集为空实测）。→ 边界：索引为本次采集时点快照，不冒充历史请求；不记录请求体与令牌（秘密不入证据）。

**P1-02a 缺具体退出证据** → `server/engine-tests.log`（`ScriptWorkerPoolTest`）+ `adr-p64-001-phase1-04` 修订02 §3 → 逐结果：①OOM 用例断言 `RESOURCE_LIMIT` + `contains("Java heap space")` + 握手自报 `maxHeapBytes=134217728`（=128MiB）+ 失败判断零许可/零等候残留 + **同一 worker 复用（pid 不变）**；②500ms 超时用例（实际值标注 500ms）断言 `TIMEOUT` + `contains("超时")` + elapsed 400–6000ms + 复用复用（pid 不变）；③新增 `shouldReclaimOwnWorkerProcessesOnShutdown`：`shutdown` 后以 `ProcessHandle.of(pid)` 实测池内进程已退出（自身进程已回收，无孤儿）。→ 边界：worker 存活期间其堆上限 128MiB 由自报值证明，**不冒称常驻 RSS=128MiB**；不新增整进程 RSS 指标。

**P1-02b 实际约束缺口** → `sw-bpm-engine/.../ScriptWorkerPool.java:54-100`（`queue-capacity`/`tenant-queue-capacity` + 等候计数 CAS 准入）、`sw-bootstrap/src/main/resources/application.yml:165-170`、`ScriptWorkerPoolTest` 4 例 → 全局/租户**等候数量硬上限**（默认 8/4，0=不允许等候即满额立即繁忙）替代"以等待时限代替队列"；全局限额与租户限额同时生效于 HTTP 办理/命令消费/预览三入口（共用同一池）。实测：①`tenant-queue-capacity=0` 满额立即拒绝且 elapsed <1000ms（不等待 5s 时限）；②`=1` 时 1 个等候者准入并最终成功（value=42）、第 2 个立即繁忙（`等候队列已满（上限 1`）、释放后计数归零；③`queue-capacity=0` 全局许可耗尽时异租户立即繁忙；④并发上限用例保持。→ 边界：等候计数为进程内原子计数（单实例语义）；多实例部署下的全局配额不跨进程聚合（沿 P63 既有边界，不在本轮扩张）。

**P1-03a 实际配置缺陷** → `Smart-WorkFlow-aPaaS-Web/src/modules/workflow/views/ProcessDesigner.vue`（映射"目标字段"改为业务字段选择器：`el-select + allow-create + @visible-change 自愈加载`；变量表来源列改业务名 `mainFormFieldLabel/nodeFormFieldLabel`）、`runtime/graph-v2.json` / `graph-v3.json` → 设计器可见字段选择器实测展开"责任人(field_owner)/整改事由(field_reason)"（768 与 1920 双视口）；发布回读 v2 触发授权 `["var_handlers","var_verdict"]`（**修正"脚本读 var_verdict 而授权仅 var_handlers"**）；v3 另含 node_3 语义配置修正。旧 v1 保留为失败对象（其 node_1 触发行 `status=FAILED 必填变量缺失: var_handlers`）。→ 边界：v1 失败对象不追溯改写；不静态分析任意动态脚本（授权仍由运行期可诊断失败暴露）。

**P1-03b 缺 768 操作** → `browser/vp768-trigger-mapping.png`、`browser/vp768-rework-task-detail.png`、`index.md` §3 → 768×1024 实测：配置弹窗 `max-height:88vh`（901px）+ body 滚动（829/2017），滚动到底后映射区完整可达并实际展开字段选项；办理详情页渲染数据表单映射结果（责任人=办理员二号）与节点表单绑定，无横向溢出。→ 边界：可达横向滚动允许；375 未新增验证（沿规划边界）。

**P1-03c 缺角色链** → `api-probe.py` 实测（handler1 正常登录会话）、`db/instance3-chain.txt`（node_2 handler1 行 `submitted_by=2`、node_3 handler1 分支行）→ ①普通用户**实办有权任务**：handler1 在 v3 实例完成 node_2 会签与其 node_3 分支任务（真实身份/真实命令，INSTANCE 收敛 APPROVED）；②**服务端拒绝**：handler1 调设计器 `GET /workflow/defs/node-capabilities` 与 `POST /workflow/defs/{id}/publish` 均 **403**（`您没有执行该操作的权限`），自有待办 200；③失败事实保留：handler1 在 v1/v2 的 UI 实办尝试因 node_3 配置缺陷落入 FAILED/EXPIRED 命令行。→ 边界：`GET /workflow/defs/{id}` 对普通用户返回 200（实例详情需渲染已发布流程图，属既有只读面，配置/发布能力仍 403）；不新增其他角色矩阵。

**P1-04a 实际缺陷/缺办理** → 三处真实缺陷修复 + `db/instance3-chain.txt`：①**发起页 USER(multiple) 占位**：`zh-CN.ts`/`en-US.ts` 的 `component.selectUsers` 键缺失（`common` 段有、`component` 段无）→ 补键；实测发起表单"处理人"占位恢复为"选择人员（可多选）"并成功提交（`field_handlers_main=["3","2"]`）。②**节点表单 definition 契约形状**：`BpmNodeFormController#getTaskNodeForm` 返回 JSON 字符串而前端契约要求对象（fields 不渲染）→ 改结构化对象（解析失败可诊断），实测节点表单 5 字段渲染。③**nodeFormData 丢失**：`TaskDetail.vue#actionPayload` 在"无意见表单且无备注"时 base=undefined → 节点表单数据不随同意提交 → 改为无条件随 APPROVE 附加（契约同事务），请求体实测含 `nodeFormData`。链结果：v3 实例走完 APPROVAL(REWORK)→CONSENSUS(admin+handler1 ALL)→DYNAMIC_PARALLEL(var_handlers 2 分支) 至 **APPROVED**；同轮不同任务隔离（node_2 两任务各自数据行）与逐分支数据行（node_3 两分支）见 `instance3-chain.txt`。→ 边界：**修正记录**：node_3 的"动态并行分支没有可用来源"根因是**冻结图配置缺 `semanticVersion=2`/`objectType=USER`**（旧语义只认部门来源），已按产品配置路径修正并发布 v3（配置修订经 def API + DB 回读；v2 触发/授权修正经设计器可见 UI）；v1/v2 实例按其冻结图无法推进，经授权实例干预 TERMINATE 收敛（`rollback-convergence-check.txt`）；不在本回执篡改旧实例事实。

**P1-04b 快照风险/事务缺证** → `NodeFormDataService.java:284-330`（`loadBoundDefinition` 语义收紧）、`BpmNodeFormController.java:86-104`、`NodeFormDataServiceTest` 12 例 / `BpmNodeFormControllerTest` 6 例 → **绑定版本快照缺失不再静默回退最新定义**：`formVersion` 非空时只读该版本快照，缺失→校验错误"表单绑定版本快照缺失: {key}@v{n}（不按最新定义静默校验）"与控制器可诊断拒绝；`formVersion` 为空（无绑定历史行）才明确回退当前定义（分支已分别单测）。事务：快照缺失拒绝后零持久改写（状态/数据/版本保持 DRAFT，`shouldRejectDiagnosablyWhenBoundSnapshotMissing`）。→ 边界：默认意见/权限兼容路径未改动；不强制 UI 层复验（同语义单测+控制器测）。

**P1-05a 缺取值/来源事件** → `db/instance3-snapshot.txt`、`db/instance3-trigger-branch.txt`（source_refs）、`BpmVariableSnapshotService`/`ScriptWorkerPoolTest` → 运行取值实证：触发快照 `{"var_handlers":["2","3"],"var_verdict":"REWORK"}`（NODE_FORM 来源、CURRENT 轮次=1、UNION 聚合）；node_3 动态并行以 **VARIABLE var_handlers** 解析为逐人分支并保留 `source_refs` 追溯；类型/缺值/轮次/权限的分支语义沿用既有单测集合（`TriggerExecutionServiceTest` 19、`ProcessVariableValidatorTest` 8、`NodeFormDataServiceTest` 轮次用例）。→ 边界：**新轮排除旧数据**本轮以轮次过滤分支（`listSubmitted(..., round)`）+ 既有轮次单测为证，未在真实实例上执行 RETURN 造新轮（该路径无 UI 入口暴露）；ROWS 完整来源不在本轮真实实例断言范围（沿用单测）。

**P1-06a 缺真实目标链** → `db/instance3-trigger-branch.txt`、`db/instance3-action-refs-api.json`、`db/instance3-chain.txt` → 三种动作类型**真实启动**：START_EACH 2 项（`field_owner←id`、`field_reason←var_verdict`）、START_SINGLE 1 项（`field_reason←var_verdict`）、START_GROUPED 2 项（groupBy=id，`field_owner←id`），共 5 个目标实例（`sw_bpm_instance` 5 行 RUNNING→REJECTED，目标表单记录逐项落映射：`sw_form_oh3ozq0axd` 实测 owner=2/3、reason=REWORK）；幂等/并发/冲突/恢复/空超限按既有标准以单测+集成（`TriggerExecutionServiceTest` 19 例含 maxDispatch/空集合/同键异载荷冲突留痕）。→ 边界：不要求每项 UI/SQL/全测试重复；"空超限"未新增真实实例反例（沿用单测）。

**P1-06b 缺二段/事务** → `db/instance3-action-refs-api.json`（5 项 **STARTED** + `targetInstanceId`）、`db/instance3-trigger-branch.txt`（持久行 STATUS=STARTING + target_record_id）、`rollback-convergence-check.txt`（命令终态分布） → 二段语义实测：意图事务只保证"目标记录 + FLOW_START 受理"（持久 status=STARTING，`target_instance_id` 留空），目标实例由 FLOW_START 异步创建后，**回读接口按持久事实解析为 STARTED 并动态解析关联实例**；失败窗口实测：v1 触发行 FAILED、`TASK_APPROVE` EXPIRED（`准入截止到期且未执行（效果未发生）`）与 FAILED（有界重试终态）均零部分效果；命令同键异载荷实测 **2426 拒绝**（`同一操作身份携带了不同的请求载荷`）。→ 边界：不以"受理=成功"、不以删除调用推断回滚；`target_instance_id` 不内联回填（设计如此）。

**P1-07a 缺升级续办** → `db/upgrade-016-baseline.txt`、`db/upgrade-017-after.txt` → 隔离库 `p64_upgrade_run`：`SPRING_FLYWAY_TARGET=0.1.6` 建 **13 迁移**基线（P64 三新表不存在）→ 经 API 建真实在役对象（表单 `p64_upgrade_form` + 流程定义 `bpm_8e6ae669e7204fb3` v1 + 实例 + 待办）→ 去 target 重启 → Flyway **追加 1 迁移至 v0.1.7**（三新表建立）→ **同一实例按 `def_version=1` 继续办理并收敛 APPROVED**，P64 新表对该实例零写入、P63 既有表保持。→ 边界：演练库为隔离环境、非生产升级；"关闭后既有处理/回查/恢复收敛"以既有冻结版本语义单测（`shouldKeepFrozenTriggerForOldVersionAndSilenceNewVersion`、`shouldRetryFailedRefWithoutGraphDependency`）为证，未重开 P63 历史验收。

**P1-07b 缺回退核查** → `db/rollback-convergence-check.txt`、ADR-P64-001 §6 → ADR §6 限定 SQL 实跑：`ORCH_ACTION_START` 非终态命令 = **0**；全部命令终态（FLOW_START 13 COMPLETED / ORCH_ACTION_START 10 COMPLETED / TASK_APPROVE 9C+1E+11F / TASK_REJECT 10C+2F）；P64 实例全部收敛（TERMINATED×2、APPROVED×1、REJECTED×10）、运行期任务 0。→ 边界：不破坏既有事实（收敛经业务动作+授权干预，非破坏性 DDL）；旧代码回退行为沿用既有单测实证，不在本回执重跑旧版本进程。

**P1-08a 文档矛盾/缺覆盖** → ADR-P64-001 修订02（§3 重写为 worker 进程池+等候数量硬上限+BPM 变量回退端口；§1/§4/§6 同步 STARTING/STARTED 与结构化 definition 语义；§6 补升级/回退实跑结果）、`evidence/phase1-04/index.md`（ID→文件→结果→边界 + 完整命令/退出码/计数）、knowledge-first 当前状态入口同步（本轮）、精确 Git 回读（见 §2）。→ 边界：不改历史、不晋级状态/计数/P63/VB，根 Server gitlink `78495dc` 保持。

## 2. Git 与收尾

- Smart-WorkFlow-aPaaS-server（feature/p64-mes-advanced-orchestration）：`b1f9832742af7326d59d8855c34bd3ccd9a7c7ae`（engine/process/api 修复 + 新增端口与配置类 + 测试；`e1dfa42 → b1f9832`），推送后远端回读一致（local==remote，0/0）。
- Smart-WorkFlow-aPaaS-Web（feature/p64-mes-advanced-orchestration）：`058e90fb7790f8ed99408ac09c87d92c02b936ad`（locale 键补全、ProcessDesigner 字段选择器与业务名、TaskDetail actionPayload 修复 + 测试；`83844e4 → 058e90f`），推送后远端回读一致（local==remote，0/0）。
- 工作区（develop-sw）：本回执 + 证据树 `receipts/evidence/phase1-04/` + ADR 修订02 + knowledge/memory/todo 同步（本批次 SHA 见交接摘要；不复制本文件自身 SHA）。
- 根 Server gitlink `78495dc` 保持；不推送 force、不改治理脚本。

## 3. 自检矩阵（二级提示02 §4）

| 自检项 | 结果 |
|---|---|
| 断言/剩余账本 | 15 项按剩余内容逐项给出实际结果与边界；未闭合者如实标注（见各项"边界"，其中 P1-05a 新轮反例、P1-06a 空超限 真实例为该两项的剩余最小面） |
| 正确对象 | 触发授权/节点语义的当前发布对象已修正并回读；真实任务/目标/升级对象与版本关系可回读 |
| 失败诚实保留 | v1/v2 失败对象、EXPIRED/FAILED 命令、form 构建失败段均保留原文件不改写；测试计数按真实输出 |
| 反向与生命周期 | 零残留（运行期任务 0、worker 自身进程 shutdown 实测退出）、无重复派发（意图幂等键）、不混轮次（round 过滤）；自身验证服务有观测与退出清理 |
| 适用门禁 | engine 98/0、process 330/0、Web 四门 exit0，均在最终实现后执行 |
| 当前状态与 Git | ADR/knowledge/memory/todo 一致；功能仍 IN_PROGRESS、阶段Ⅰ VERIFYING |
| 停止合法 | 本回执为自验通过提交，最终裁决由 Planner 独立执行；无未申报的 actionable 项（P1-05a/P1-06a 的剩余最小面已列为边界，供复审判定是否需补） |
