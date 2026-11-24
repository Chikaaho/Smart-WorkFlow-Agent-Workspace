# 1.2.0 第十六批执行回执（execution-120-16）——T1~T4 小尾巴与阶段 3 出口门禁

日期：2026-11-24｜执行（Executor）｜依据 `planning-execution-prompt-120-04.md`

## 1. Git 事实

| 仓 | 提交 | 内容 |
|---|---|---|
| Web | `ed25ddb` | T1 分流文案/变量折行；T3 意见详情时间格式；T4 工作台抄送按 copyId 打开详情、MyCc 自动打开 |
| Web | `328aa3f` | T1 条件变量说明整行折行（最终样式） |
| Server | `34c43e98` | T2 执行创建即回写受理关联（预分配执行 id + 独立事务回写），运行中来源可见 |

门禁结果见 §6，运行提交为 Web `328aa3f`、Server `34c43e98`。未提交两个子仓 gitlink。

## 2. T1 CONTINUE 分流说明与折行

- 文案：`status` 只有 `SUCCESS / FAILED`；失败原因看 `errorCategory`（`TIMEOUT / EXECUTION_ERROR / OUTPUT_MISSING` 等，按实际取值），不再让人误写 `status == 'TIMEOUT'`。
- 条件节点变量说明：`errorCategory` 描述同步改成实际取值；变量行改为上下结构，说明整行铺满面板宽度并 `overflow-wrap` 折行，不再被右边界截断。
- 证据（1600 宽，系统管理员，URL `/workflow/defs/2124720482733985794/design`）：
  - `T1-continue-hint.png`（sha1 `2e8ed8d…`，1600×1120）：失败策略 `CONTINUE` + 完整分流说明；
  - `T1-condition-vars-wrap.png`（sha1 `ce4bfdd…`，1600×900）：`graphExec.node_ge.status/errorCategory/errorMessage/executionId` 四条说明完整折行显示。

## 3. T2 执行列表来源在创建时即正确

根因：列表按 `sw_agent_graph_execution_request.result_execution_id` 反查来源，而该关联原先只在执行终态回写；RUNNING 期间为空被 `COALESCE(...,'DIRECT')` 归一成直接调用。

修复（`34c43e98`）：
1. 生命周期 worker 在调用执行服务前预分配执行 id，先把 `result_execution_id` 写入受理行（该线程无外层事务，立即提交），并通过 `AgentExecutionEventContext` 传给执行服务；
2. 执行服务创建顶层执行行时复用该 id；
3. 执行行插入后另用 `REQUIRES_NEW` 事务再回填一次关联，避免外层 `runLifecycle` 事务未提交时列表看不到。

实证（1280×720，系统管理员，`/agent/executions/list`，慢图 20s）：
- `T2-source-process-running.png`（sha1 `93ddfeb…`）：按「流程」筛选，共 96 条，顶部三行 `E1-4超时图v2` 状态「运行中」；对应受理/执行 `2125194391149293571/…570 → 2125194391329648642/643/644`，均 `business_source=PROCESS`，latency 20156ms。
- `T2-source-direct-no-process.png`（sha1 `492bd69…`）：按「直接调用」筛选，共 17 条，全部为「已中断」旧行，无运行中的流程执行。
运行结束后三条同样显示「流程」，来源与 DB 一致。

## 4. T3 意见详情时间与服务端 PDF

### 4.1 弹窗时间

`InstanceFlowPanel` 意见详情头部新增 `formatOpinionTime`，ISO 原值改为 `yyyy-MM-dd HH:mm:ss`。证据 `T3-opinion-time-formatted.png`（sha1 `3ff1c83…`，1280×720）：`已同意 · 2026-11-24 12:35:46 · 表单版本 v1`，无 `T`/毫秒。

### 4.2 服务端 PDF 抽文本

从任务详情点「下载 PDF」取得 `print-c174d83c-a4c2-4b86-a2f9-69b52e178c90.pdf`（20,224 bytes），执行：

```
pdftotext -layout print-c174d83c-a4c2-4b86-a2f9-69b52e178c90.pdf out.txt
grep -c "DynamicData@\|com\.sw\." out.txt      → 0
```

文本摘录（两节点均完整）：

```
总公司科技部会签  … APPROVED  2026-11-24 12:35  演练准备就绪：是；风险评级：中；预计停机时长（分钟）：90；现场指挥人员：系统管理员；处置措施：限流
现场指挥确认      … APPROVED  2026-11-24 12:33  演练准备就绪：是；风险评级：高；预计停机时长（分钟）：120；现场指挥人员：系统管理员；处置措施：增派安保
```

PDF 中无对象串，含「90」「分钟」及人员/多选可读值，浏览器打印与服务端 PDF 同源结论成立。

## 5. T4 ACTION# 类型与抄送

### 5.1 会产生 ACTION# 的动作（全量）

写入点唯一：`ApprovalLifecycleSupport.recordInstance`（`taskId="ACTION#"+processInstanceId`）。调用方三个：

| 动作 | 来源代码 | 语义 | 是否应在已办出现 |
|---|---|---|---|
| `WITHDRAW` | `ApprovalInstanceActionExecutor.java:102` | 发起人撤回整条实例 | 否——实例生命周期动作，属「我发起的」 |
| `DISCARD` | `ApprovalInstanceActionExecutor.java:127` | 发起人废弃整条实例 | 否——同上 |
| `DISAPPROVE`（结算 `CONSENSUS_SETTLED`） | `ApprovalInstanceActionExecutor.java:162` | 会签负向结算，系统代 `syntheticLogin` 记录 | 否——不是该用户办理的任务 |

结论：三类都是实例级审计，不对应任何真实 Flowable 任务，`ACTION#` 行从已办排除是正确的，不会丢掉用户期望的「办理」记录；页面仍可由实例流转记录/我发起的查看。

### 5.2 抄送页签实测

夹具：用户 `e4cc_user`（id 999910，口令哈希复制管理员，仅本机测试）+ 抄送记录 `2125090000000000001`（接收人 999910，实例 `c174d83c…`）。

- 工作台「抄送 1」页签：`T4-cc-tab.png`（sha1 `ac116d2…`，1280×720，登录身份 E4-2抄送用户），按钮为「查看」。
- 点击后跳 `/workflow/my-cc?copyId=2125090000000000001`，自动打开「抄送详情」：`T4-cc-detail.png`（sha1 `196cc78…`）。页面正常渲染，有「无表单数据」「暂无审批历史」明确空态，没有 404、空白页或「流程不存在」。
- 说明：该抄送记录是手工 SQL 夹具，没有任务/表单快照上下文，因此详情只展示空态；真实抄送节点投递的记录会带任务上下文。未改服务端抄送逻辑。

## 6. GATE-final（最终提交）

### Web（commit `328aa3f`）

| 项 | 命令 | 结果 |
|---|---|---|
| typecheck | `npm run typecheck` | EXIT 0 |
| lint | `npm run lint` | EXIT 0 |
| test | `npm run test` | 245 files passed / 1 skipped；2130 tests passed / 3 skipped |
| build | `npm run build` | EXIT 0，built in 3.97s |

### Server（commit `34c43e98`，受影响四模块）

`mvn -pl sw-basic/sw-basic-agent,sw-biz/sw-bpm/sw-bpm-process,sw-biz/sw-bpm/sw-bpm-engine,sw-biz/sw-biz-form/sw-biz-form-biz test` → BUILD SUCCESS

| 模块 | Tests | Failures/Errors |
|---|---|---|
| sw-basic-agent | 93 | 0 / 0 |
| sw-biz-form-biz | 59 | 0 / 0 |
| sw-bpm-engine | 74 | 0 / 0 |
| sw-bpm-process | 62 | 0 / 0 |
| 合计 | **288** | **0 / 0** |

无环境类失败；全量以 main CI 为准。

## 7. SQL 直接写的夹具（补充说明）

| 夹具 | 写入方式 | 用途 |
|---|---|---|
| `E1-3常量分流图` #2124830000000000101 | SQL 直接 insert graph_def + snapshot | 证明常量 high/low 输出与执行详情 IO；**不**用于证明设计器/发布路径 |
| `E4-1审批意见展示` #2125080000000000001 | SQL 建定义，**设计器发布** | 证明意见字段（单选/数字带单位/人员/多选）显示；发布路径为真实设计器 |
| `e4cc_user` 999910 + 抄送记录 #2125090000000000001 | SQL 建用户/记录 | T4 抄送页签实测；口令哈希复制，仅本机 |
| E1-6 表单 `graphActions` | SQL 写入并恢复 | 驱动按钮/提交前动作；结束后已恢复无动作 |
| `X3结束节点参数图` | 设计器 UI 新建并保存 | X3 持久化验证，非 SQL |

## 8. 环境与清理

- 只连本机 5432 `sw_iso120`；Redis 56379；Server 18093；Web 5275。未连 MySQL 或其他用户服务。
- 测试结束：绑定恢复 `风控审批流`；`form_risk` 定义无 `graphActions`；`sw_agent_graph_execution(_request)` 无 RUNNING 行；18888 工具服务已停止。
- 临时脚本/日志/PDF（`/tmp/t_*`、`/tmp/a.jar`、`/tmp/e41.*`、下载 PDF）已删除；回执不写口令。
- 保留夹具：E1-3 常量图、E4-1 流程与实例、e4cc_user/抄送记录、本轮 E1-4 慢图实例。

## 9. 自验结论

T1/T2/T3/T4 全部完成并提交；Web 四门禁与 Server 四模块 288 测试全绿（最终提交口径）。阶段 3 出口条件满足，**待规划验收后进入阶段 4 合并**。
