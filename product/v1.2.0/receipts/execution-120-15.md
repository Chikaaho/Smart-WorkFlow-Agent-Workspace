# 1.2.0 第十五批执行回执（execution-120-15）——第 3 轮返修与补证全量

日期：2026-11-24｜执行（Executor）｜依据 `planning-execution-prompt-120-03.md`
S1 已单独交 `execution-120-14`（`6bc67191`/`00d764fd`）。本批覆盖 §2 返修补证与 §3 E4 两个线上缺陷。

## 1. Git 事实

| 仓 | 提交 | 内容 |
|---|---|---|
| Server | `8b9d9a9c` | E4-1 意见字段解包；E4-2 已办过滤 ACTION#；E1-3 执行详情输入/输出回退；E1-4 调用方超时登记与请求层 TIMEOUT；条件表达式支持点号扁平变量；FLOW_START 回查端点 |
| Web | `95eec5d` | E1-1 补 `workflow.graphExecContinueHint`；E1-6 补 `common.operationSuccess`、类型不符不再叠成功提示；E4-2 已办按钮按页签显示「查看」+ ACTION# 守卫；表单发起失败回查 FLOW_START |
| Web | `6a8d32e` | E1-4 发起失败回查等待命令重试终态（最长 30s） |

**截图与提交时序说明（如实披露）**：Web 修复 `95eec5d` 在 E1-1/E1-6 截图之前；Server 修复 `8b9d9a9c` 在多数服务端截图之后才提交，但截图使用的 jar 由同一工作树在 21:39/22:44 构建（`bootstrap.jar` 内 `sw-basic-agent`/`sw-bpm-process` class 时间戳为 11-23 21:38–21:39），代码内容与提交一致。没有再回退旧构建重拍「修复前」，E4-1 的修复前基线引用 `planning-review-120-03.md` 第 54 行的 Owner 截图描述。

## 2. X3 结束节点参数持久化

- 新建图 `X3结束节点参数图`（#2124829145444352002，key `agent_a03b9244b6f94514`）→ 结束节点添加 `x3_probe`（source=`input`，说明「X3 持久化验证参数」）→ 保存草稿 → 返回列表 → 重新打开 → 参数仍在，画布显示「1 个出参」。
- 证据：`X3-endpanel-persist.png`（sha1 `62bb156…`，1600×900，URL `/agent/graph-designer/2124829145444352002`，身份 系统管理员）。未改库、未用 SQL。

## 3. E1-1 面板全貌 + CONTINUE 分流 + 状态变量

对象：`E1-4失败策略对照` #2124720482733985794 设计器（`/workflow/defs/2124720482733985794/design`，1600×900，系统管理员）。

| 证据 | sha1 | 证明 |
|---|---|---|
| `E1-1-panel-continue-top.png` | `8f8bcae…` | 面板上半：节点名称 / 绑定 Graph / 绑定版本 / 失败策略 CONTINUE 分流说明；只有一处「节点名称」，无「入参映射 []」 |
| `E1-1-panel-continue-bottom.png` | `b88dbcb…` | 面板下半：入参映射 city←field_city、超时 2s、失败策略 CONTINUE，无重复通用字段 |
| `E1-1-condition-status-vars.png` | `fc388fb…` | 条件节点面板「Graph 执行状态变量（点击复制）」：`graphExec.node_ge.status / errorCategory / errorMessage / executionId` |

修复：`workflow.graphExecContinueHint` 此前缺失，面板直接显示 i18n 键原文；`95eec5d` 在中英文包补齐，文案写明「下游条件节点按 graphExec.node_ge.status 分流（SUCCESS/FAILED/TIMEOUT/OUTPUT_MISSING）」。截图里已是中文说明。

## 4. E1-3 常量输出分流 + 执行详情输入输出

### 4.1 换图与两条实例

新图 `E1-3常量分流图` #2124830000000000101 v1（key `agent_e13_branch`）：START(city) → CONDITION（keyword `北京`/`上海` → high 工具；默认 → low 工具）→ 两个 END 各声明 `result`，值来自工具返回常量，不回传城市。

| 实例 | businessKey | field_score | 执行 | 落点 |
|---|---|---|---|---|
| 命中（北京） | 8c43e7a1-1dfd-484a-8e7a-3cf2252d9d70 | `high` | #2124881112187224066，input `{"city":"北京"}`，output `{"result":"high"}` | `高侧人工确认` 待办（RUNNING） |
| 未命中（石家庄） | 45b44627-d2a6-4e43-a65e-d06460574f75 | `low` | #2124881635808329730，input `{"city":"石家庄"}`，output `{"result":"low"}` | END（APPROVED） |

证据：`E1-3-hit-high-trace.png`（`e54d424…`，流程图高亮「高侧人工确认」）、`E1-3-miss-low-trace.png`（`9a4e669…`，状态「已完成」、流程图到 END）、`E1-3-exec-detail-io.png`（`f945af1…`，输入/输出两栏）、`E1-3-exec-detail-low.png`（`99c26df…`，输出 `low`）。均为 1600×900，URL `/workflow/instances` / `/agent/executions/detail/{id}`，系统管理员。

### 4.2 「输入内容/输出内容为空」根因与修复

根因是两处断链，不是前端：
1. 流程/表单/结构化直调把入参只写 `sw_agent_graph_execution_request.inputs_json`，执行行 `sw_agent_graph_execution.input` 固定写空串；
2. 执行行 `result_text` 只取 END `inputVar` 指向的变量，G1-4 后 END 面板只维护结构化 `outputs`，`inputVar` 为空 → `result_text` 空。

修复（`8b9d9a9c`）：
- 新建执行行时，`input` 空白且有结构化入参 → 写 `inputs_json` 的 JSON；
- 成功收尾时，`result_text` 空白且结构化出参非空 → 写 `outputs_json` 的 JSON；
- 生命周期 VO 的 `input` 空白 → 回退 `inputs_json`（流程实例页按受理号打开也能看到输入）。
未改 `resp.output` 语义，直接调用/IoT/旧文本入参不受影响。

## 5. E1-3T 三慢图与普通审批并发

三条慢请求（`e14_slow` → `/slow20`，节点超时 25s，图超时 120s）：

| request id | processInstanceId | 开始 | 结束 | latency |
|---|---|---|---|---|
| 2125074995252772865 | 700ba331-e7ba-11f1-9852-a2509ca88e6b | 11:52:15.509 | 11:52:35.675 | 20153ms |
| 2125074995252772866 | 700b7c11-e7ba-11f1-9852-a2509ca88e6b | 11:52:15.509 | 11:52:35.669 | 20144ms |
| 2125074995286327297 | 700b7c12-e7ba-11f1-9852-a2509ca88e6b | 11:52:15.518 | 11:52:35.675 | 20146ms |

普通审批：任务 `c59c271d-e749-11f1-9852-a2509ca88e6b`（`Graph 失败人工处理`）`act_hi_taskinst.end_time_=2026-11-24 11:52:15.979`——距三条慢图开始 0.46–0.47s，落在 20s 窗口内，证明审批未被慢图阻塞。

证据（1280×720，系统管理员）：
- `E1-3T-three-running-slow.png`（`e5b4160…`，拍摄 11:52:18）：列表顶部三行 `E1-4超时图v2` 状态「运行中」；
- `E1-3T-approval-completed.png`（`4e0112d…`，拍摄 11:52:19）：任务详情「流转记录」显示「已同意」，审批意见「E1-3T 并发窗口内审批」。

**列表口径披露**：三条运行中的「来源」显示为「直接调用」——列表按 `result_execution_id` 反查来源，而该关联在终态才回写；运行中为空时被归一为 DIRECT。DB 中三条 `business_source=PROCESS`（`sw_agent_graph_execution_request`），回执以 request 行为准。这是既有展示口径问题，不改变 E1-7 筛选结论。

## 6. E1-4 CONTINUE 失败侧 + BLOCK 原因可见 + 分类统一

### 6.1 CONTINUE 三条走失败侧

流程 `E1-4失败策略对照`（#2124720482733985794）带条件分支：`graphExec.node_ge.status == 'FAILED'` → 审批节点「Graph 失败人工处理」，默认 → END。逐场景发布、单次提交：

| 场景 | 实例 | 请求层 | 节点变量 | 落点 |
|---|---|---|---|---|
| 超时（node timeout=2s） | ac38091e-6d16-41cc-b76c-35870280f81c | FAILED/**TIMEOUT**，2072ms | FAILED/TIMEOUT | Graph 失败人工处理 |
| 图报错 | b34ecc3f-0a5c-4318-bf63-c24ff24f5e26 | FAILED/EXECUTION_ERROR，25ms | FAILED/EXECUTION_ERROR | Graph 失败人工处理 |
| 出参缺字段 | 615ba758-888a-4752-a749-af4f1723f3c6 | SUCCESS（图本身成功） | FAILED/OUTPUT_MISSING「缺少必需输出: score」 | Graph 失败人工处理 |

截图：`E1-4-continue-timeout.png`（`a1d44ee…`）、`E1-4-continue-error.png`（`7a96bec…`）、`E1-4-continue-output-missing.png`（`0730538…`），1600×900，流程实例详情含业务单号与流程图高亮失败侧审批。

**分类口径统一**：超时 CONTINUE 过去请求层写 `EXECUTION_ERROR`（端口 deadline 只在调用方本地返回 TIMEOUT，工作线程被中断后落入通用 catch）。`8b9d9a9c` 新增 `markCallerTimeout`：调用方登记超时意图并中断工作线程，工作线程收尾按 `FAILED/TIMEOUT` 落库，请求层与节点层同为 TIMEOUT；图自身 `GRAPH_TIMEOUT` 在端口也映射为 `TIMEOUT`。图报错仍为 EXECUTION_ERROR，出参缺失仍是「图 SUCCESS + 节点 OUTPUT_MISSING」，这两类是不同层语义，不强行合并。

### 6.2 BLOCK 失败原因在发起页可见

BLOCK 时 Flowable 启动事务回滚、实例行不存在，实例详情类入口天然不可达；`failure_reason` 只存在 `sw_bpm_command`。新增 `GET /workflow/commands/flow-start/{recordId}`（仅受理人本人），FormRender 在实例 5s 未出现时回查 FLOW_START，`FAILED` 直接把原因写入页面错误条：

`流程发起失败：Graph 执行失败[EXECUTION_ERROR]: 图执行失败，请查看节点记录`

证据：`E1-4-block-failure-visible.png`（`73e0b85…`，1600×900，`/form/form-render/form_risk`，城市=武汉）。表单填写页为独立布局，画面含页面标题/表单数据与该错误条，登录身份见回执记录。

## 7. E1-6 四处重拍（#1、#5 锁定不动）

| # | 场景 | 修复后结果 | 证据 |
|---|---|---|---|
| 2 | 提交前失败 | 错误条 `提交前 Graph 动作失败[TIMEOUT]: 等待图执行超时（超过 2 秒），已请求取消`，不再只显示「表单提交失败」 | `E1-6-before-submit-fail.png`（`d022c5d…`，1280×720） |
| 3 | 按钮成功回填 | toast「操作成功」（不再是 `common.operationSuccess` 键原文），城市变 `ok` | `E1-6-button-ok.png`（`dbcef6b…`） |
| 4 | 按钮失败 | toast `Graph 动作执行失败: Graph 动作失败[TIMEOUT]: 等待图执行超时…`；已填「成都」保留 | `E1-6-button-fail.png`（`789bba4…`） |
| 6 | 按钮类型不符 | 仅 warning「评分(field_score): 数字字段收到非数值 'ok'」，无成功提示；「南京」保留 | `E1-6-button-type-mismatch.png`（`05920dc…`） |

修复：`95eec5d` 补 `common.operationSuccess`；有 warnings 时 `return` 不再叠成功；`8b9d9a9c` 之前的 `48681c08` 已把 Graph 动作失败码改为 1405（目录无条目，保留异常明细）。表单动作配置用 SQL 写入 `graphActions` 驱动，测试结束定义已恢复无动作。

## 8. E1-7 筛选计数与残留

### 8.1 55 vs 63 与逐来源差异

页面列表统计的是**内层执行行**，120-13 的 SQL 统计的是**受理请求行**，两者不是同一维度：

- 页面合计 55 = SUCCESS 40 + FAILED 9 + INTERRUPTED 6；
- 受理表合计 63；其中 15 条请求没有产生执行行（BLOCK/受理失败），7 条执行行没有受理行（早期直调）；
- 63 − 15 + 7 = 55，完全对上。

逐来源：

| 来源 | 页面（筛选） | 受理表 | 差异原因 |
|---|---|---|---|
| 流程 | 19（截图时刻） | 53（回执查询时刻） | **不是同一时刻**：截图在 12:5x（PROCESS 执行 19 条），53 是 17:xx 再查；中间 E1-3/E1-3T/E1-4 又产生 19 条流程请求。同一时刻页面应显示 38 条流程执行（53 请求 − 15 无执行） |
| 表单 | 7 | 7 | 一致 |
| 直接调用 | 8 | 1 | 7 条无受理行的旧直调执行被 `COALESCE(...,'DIRECT')` 归一为直接调用（6 条 12:43 的 E1-4超时图v2 + 1 条 FAILED）；DB 受理行只有 1 条 DIRECT |
| IoT 触发 | 2 | 2 | 一致 |

### 8.2 6 条「运行中」残留

6 条 `E1-4超时图v2` 内层执行创建于 12:43（慢工具并发期），旧服务进程被重启时工作线程中断，终态未回写，停在 RUNNING；14:55:38 已统一改判 INTERRUPTED。本轮 BLOCK 重试又留下 3 条请求 + 2 条内层执行 RUNNING，已按 TIMEOUT/INTERRUPTED 收尾；当前 `sw_agent_graph_execution` 与 `..._request` 均无 RUNNING 行。

## 9. X1-timeline 更正

已改写 `execution-120-12.md` §2：按 `act_re_deployment` 把 18094/18093 两个环境拆开（21:38/21:39 基线成功；21:42 回退提交；21:48 回退后成功；22:02 风控流程部署成功），删除「21:48 恢复后成功」排在 22:02 之后的矛盾叙述；现存日志/部署表没有 22:02 schema null 记录。后续再出现 schema null 直接贴异常栈。

## 10. E4-1 审批意见字段可读

### 10.1 根因

`ApprovalHistoryEnricher` 把字段值包成 `DynamicData` 后（第 85 行），又把包装对象直接传给 `opinionDisplayValue`（第 105 行）。`DynamicData` 只有 `@JsonValue`，没有覆写 `toString`，`String.valueOf` 得到 `com.sw.ck.common.value.DynamicData@<hash>`，落在 `displayValue` 里，前端只是原样显示。单选/开关、数字、人员、多选等非纯文本字段都会命中。

修复（`8b9d9a9c`）：`opinionDisplayValue` 入口统一解包 `DynamicData`，再走原有人员姓名/日期/多选格式化；新增 `ApprovalHistoryEnricherTest` 6/6（RADIO 文本、CHECKBOX 列表、USER 姓名、DATE 到分钟、NUMBER、null）。同源位置：任务详情、会签弹窗、流转记录、意见详情弹窗、浏览器打印、服务端 PDF 都读同一个 `displayValue`，一处修复全覆盖；抄送详情走 `MyCc` 的另一份 `ApprovalActionRecord` 数据（无 opinionFields），不在本次主链但已记入同类清单。

### 10.2 iso120 实证

流程 `E4-1审批意见展示`（#2125080000000000001）：现场指挥确认 → 总公司科技部会签，两节点意见表单含 RADIO（演练准备就绪/风险评级）、NUMBER（预计停机时长，label 带「分钟」）、USER（现场指挥人员）、CHECKBOX（处置措施）。实例 #2125083148845531137（businessKey `c174d83c-a4c2-4b86-a2f9-69b52e178c90`），两节点均用界面完成。

结果（任务详情 → 审批详情）：
- 动作/意见列：`演练准备就绪：是 · 风险评级：中 · 预计停机时长：90 分钟 · 审批时间：11-24 12:35`；上一条为现场指挥确认 `120 分钟`；
- 意见详情弹窗：`是 / 中 / 90 / 系统管理员 / 限流`，人员与多选均可读，无 `DynamicData@` 或 `com.sw.` 串。

证据：`E4-1-opinion-column-after.png`（`7add617…`）、`E4-1-opinion-detail-after.png`（`9d7afe0…`），1280×720，URL `/workflow/task/364fea05-e7c0-11f1-9852-a2509ca88e6b`，系统管理员。

**修复前对照的限制**：本机旧构建已被修复版覆盖，没有保留可重放的 pre-fix jar；修复前状态以 `planning-review-120-03.md` 第 54 行 Owner 截图（`DynamicData@3e7820f2`）为基线，未伪造本地「修复前」截图。需要严格同对象前后图时，可回退 `8b9d9a9c` 重建后另行补拍。

## 11. E4-2 工作台已办

根因：`/workflow/my/processed` 把实例级审计动作也返回，`taskId` 是伪 ID `ACTION#<processInstanceId>`；前端固定用 `workspace.handleTask` 文案、点击拼 `/workflow/task/${taskId}`，Vue Router 在 `#` 处截断，Flowable 查不到任务 → 404（Owner 概括为「流程不存在」）。

修复：
- Server `8b9d9a9c`：`ApprovalActionServiceImpl.pageByActor/countByActor` 排除 `task_id LIKE 'ACTION#%'`，列表/计数一致；
- Web `95eec5d`：已办页签按钮显示 `common.view`（查看），待办仍 `workspace.handleTask`（办理）；`openPanelTask`/`openTask` 对 `ACTION#` 和空 ID 直接返回，不再跳伪任务。

实证（1280×720，系统管理员，`/workspace`）：
- `E4-2-processed-view-button.png`（`ac3c5cc…`）：已办 9 条，按钮全为「查看」；待办页签仍「办理」；
- `E4-2-processed-detail.png`（`0173b7c…`）：点「查看」进入 `/workflow/task/364fea05…?source=processed`，只读详情正常加载，有流转记录，无「流程不存在」；
- `E4-2-todo-tab-handle.png`（`a45ba73…`）：待办页签两条仍显示「办理」。

同类检查：个人中心「我的已办」共用同一接口，过滤后一并修复；个人中心抄送用抄送记录 ID，不受影响。工作台「抄送」页签仍用 `taskId` 打开任务详情，接收人无权时可能 403——本次未改（P77 验收范围外），列为后续同源项。

## 12. 环境与清理

- 只连本机 5432 `sw_iso120`；Redis 56379；Server 18093；Web 5275。未连 MySQL 或其他用户服务。
- 测试结束后已恢复：`form_risk` 定义无 `graphActions`；绑定回到 `风控审批流`（`bpm_016cd75c80884998`）；Graph 租户 0；无 RUNNING 受理/执行行。
- 本机 18888 常量/慢工具服务已停止；`/tmp/iso120_tools.py`、`/tmp/iso120_start.sh`、`/tmp/*token*.txt`、构建日志等临时文件已删除；回执不写口令。
- 新增夹具保留在隔离库：`E1-3常量分流图`、`E4-1审批意见展示`、E4-1 实例与任务、本轮 E1-3/E1-4 实例。

## 13. 自验结论

X3、E1-1、E1-3、E1-3T、E1-4（含分类统一与 BLOCK 原因可见）、E1-6 四图、E1-7 计数解释与残留收尾、X1-timeline、E4-1、E4-2 均完成；E4-1/E4-2 有根因、修复、单测/DB/界面实证。**本批范围自验通过，待规划验收。**

遗留需规划裁定的两点：① E4-1「修复前后同一对象」只提供了修复后截图与 Owner 基线描述，未回退旧构建重拍；② E1-3T 运行中三行的「来源」显示为直接调用（终态关联回写前的既有列表口径），DB `business_source=PROCESS`。
