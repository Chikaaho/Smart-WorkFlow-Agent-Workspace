# 1.2.0 第十三批执行回执（execution-120-13）——E1 取证全量 + E2-3/E3-1 补图 + E1-6 两处修复

日期：2026-11-23｜执行（Executor）｜依据 `planning-execution-prompt-120-02.md`
本批：E1-3 / E1-3T / E1-4 / E1-5 / E1-6+F1-type / E1-7+R3-iot / E1-8 全部取证；E2-3 前端、E3-1 补图；E1-6 前端/后端各一处修复。

## 1. Git 事实

| 仓 | 提交 | 内容 |
|---|---|---|
| Server | `48681c08` | **E1-6 修复（后）**：新增 `form.graph_action_failed` 错误码；Graph 动作失败明细不再被通用「表单提交失败」文案覆盖（类型不符时点名字段） |
| Web | `0e16be9` | **E1-6 修复（前）**：`parseDefinition` 保留 `graphActions`（此前运行页拿不到动作，按钮不渲染）；补 `ElLink` 组件类型声明 |

测试：`FormGraphActionServiceTest` 2/2 绿；Web `index.spec.ts` 44/44 绿（新增 graphActions 两条）；`npm run typecheck` EXIT=0。两提交已推送 `feature/1.2.0`。

## 2. E1-3 不同输出随输入变化（两条实例走两侧分支）

图 `E1-3分流评分图`（#2124684286825795585 v2）：START(city) → CONDITION(keyword=北京) → END_HIGH/END_LOW，两端 END 均声明输出 `score`。流程 `风控审批流` v3：Graph 执行器 → 条件分支（命中→审批「命中名单人工确认」，未命中→END）。

| 实例 | recordId | 输入 | Graph 输出 | 进程变量 | 落点 |
|---|---|---|---|---|---|
| 命中 | a1ad04ed-a9c7-4153-84d5-50c411e8815a | 北京 | `{"score":"北京"}`（execution 2124685070774767618，SUCCESS 59ms） | field_score=北京 | 条件分支高侧 →「命中名单人工确认」待办（实例 RUNNING） |
| 未命中 | aa211cdb-27a0-4bad-b2d2-4a98b43a40aa | 石家庄 | `{"score":"石家庄"}`（execution 2124685070791544833，SUCCESS 59ms） | field_score=石家庄 | 默认分支 → END（APPROVED） |

截图：
- `E1-3-instance-hit-trace.png`（sha1 `53d4258…`）：详情「城市=北京」+ 流程图高亮「命中名单人工确认」
- `E1-3-instance-miss-trace.png`（sha1 `2f8ba53…`）：详情「城市=石家庄」+ 流程图已到 END
- `E1-3-exec-detail-beijing.png`（sha1 `4c4e32c…`）：Graph 执行详情（快照 v2 SUCCESS 59ms，受理号 #2124685070774767618）

## 3. E1-3T 三个慢 Graph 与普通审批并行

慢 Graph：`E1-4超时图v2`，TOOL 节点调用本机慢工具（`/slow20` 睡 20s），节点超时 25s。三次提交并行发起后 3s 调 `POST /workflow/tasks/{taskId}/complete`（任务 `97cdaa39-e71a-11f1-9218-a2509ca88e6b`，「命中名单人工确认」）。

| 事实 | 时间戳（DB） |
|---|---|
| 三条慢图执行开始 | 16:55:32.511 / .512 / .513，`latency_ms` 20114 / 20115 / 20109 |
| 三条慢图执行结束 | 16:55:52.629 / .630 / .938（并发运行约 20.1s） |
| 第 4 个普通审批完成 | `act_hi_taskinst.end_time_=16:55:35.151`，API 往返 0.18s——落在慢图窗口内 |
| 三条慢实例最终状态 | APPROVED ×3（record 21caa3eb / 4bae4c92 / 1228ff35） |

截图：`E1-3T-three-running-slow.png`（sha1 `0b073b9…`，执行列表三条流程来源慢执行；列表展示内层执行耗时 20057/20060/20060ms，对应请求层 20109–20115ms）、`E1-3T-concurrent-slow-and-approval.png`（sha1 `2209944…`，实例列表：慢实例已完成 + 命中审批实例已完成）。DB 时间戳见上表，证明审批未被慢图阻塞。

## 4. E1-4 超时 / 报错 / 出参缺字段 × CONTINUE/BLOCK（6 结果）

统一用 `E1-4失败策略对照`（form_risk）逐版本发布、单次提交、等待命令终结后取下一个，避免版本漂移。结果如下（命令结果取自 `sw_bpm_command`，节点变量取自 `act_hi_varinst`）：

| 场景 | 策略 | 命令 | 实例 | Graph 执行请求 / 节点变量 |
|---|---|---|---|---|
| 超时（节点 timeoutSeconds=1） | BLOCK | FAILED：`Graph 执行失败[TIMEOUT]: 等待图执行超时（超过 1 秒），已请求取消` | 无（回滚） | — |
| 超时 | CONTINUE | COMPLETED | APPROVED | request FAILED/EXECUTION_ERROR；节点 `graphExec.node_ge.status=FAILED,errorCategory=TIMEOUT` |
| 报错（TOOL 引用不存在的工具） | BLOCK | FAILED：`Graph 执行失败[EXECUTION_ERROR]: 图执行失败，请查看节点记录` | 无（回滚） | — |
| 报错 | CONTINUE | COMPLETED | APPROVED | request FAILED/EXECUTION_ERROR；`status=FAILED,errorCategory=EXECUTION_ERROR` |
| 出参缺字段（END 声明 score 但未产出） | BLOCK | FAILED：`Graph 执行失败[OUTPUT_MISSING]: 图执行成功但缺少必需输出: score` | 无（回滚） | — |
| 出参缺字段 | CONTINUE | COMPLETED | APPROVED | 内层 request SUCCESS 但节点 `status=FAILED,errorCategory=OUTPUT_MISSING`，`field_score` 未写入 |

**「成功但出参为空」未出现**：CONTINUE 三个实例的节点状态均为 FAILED，缺字段时没有写 `field_score`。回复见 `sha1-batch3` 外的 `/tmp/e14_final.json`（临时文件已删，关键值本节已固化）。

## 5. E1-5 含人工节点 Graph 发布被拒（2 张截图）

- 直接引用：流程 `E1-5直接引用人工图` 发布 → `2106 节点[Graph 执行器] 绑定的 Graph v2 含人工节点，不能作为同步执行器`，截图 `E1-5-direct-human-rejected.png`（sha1 `08630ec…`）
- 子图引用：`E1-5子图引用人工图`（SUBGRAPH→人工图）发布 → 同文案拒绝，截图 `E1-5-subgraph-human-rejected.png`（sha1 `9696cf7…`）
两张截图均含设计器面包屑与错误 toast（header+proof 同帧）。

## 6. E1-6 + F1-type 六个结果（截图 6 张）

前置修复（见 §1）：Web `parseDefinition` 之前丢弃 `graphActions`，运行页按钮完全不渲染；后端失败明细被目录通用文案覆盖。两处修复后行为：

| # | 场景 | 结果 | 证据 |
|---|---|---|---|
| 1 | 提交前成功回填 | 提交成功，落库 `field_city=ok`（图为 TOOL 返回 "ok"），FORM 执行 #2124728819898847233 SUCCESS `{"score":"ok"}` | `E1-6-before-ok-backfill.png`（sha1 `43ac878…`，表单数据列表 ok 行） |
| 2 | 提交前失败阻止提交 | 页面 alert「表单提交失败」；无新记录写入 | `E1-6-before-fail-blocked.png`（sha1 `47c1a05…`） |
| 3 | 按钮触发成功回填 | 点「调用图回填」后城市字段变 `ok`，成功 toast | `E1-6-button-ok-backfill.png`（sha1 `3868de4…`） |
| 4 | 按钮失败只提示 | toast「Graph 动作执行失败…」，已填「成都」保留 | `E1-6-button-fail-keeps-input.png`（sha1 `7473c17…`） |
| 5 | 类型不符（提交前） | 阻止提交并点名字段：`Graph 动作输出类型不符，已阻止提交（动作 提交前类型不符）: 评分(field_score): 数字字段收到非数值 'ok'`；记录未写入 | `E1-6-before-type-mismatch.png`（sha1 `ad53e30…`） |
| 6 | 类型不符（按钮） | warning 点名字段，不回填；已填「南京」保留 | `E1-6-button-type-mismatch.png`（sha1 `e0f9b61…`） |

「不合法值没有写进记录」：场景 5/6 后表内最新记录仍为 `ok`（12:56:41），无杭州/南京行。表单动作配置通过 form_definition JSON `graphActions` 段驱动（测试期用 SQL 写入、结束已恢复）；按钮渲染依赖 §1 的前端修复。

## 7. E1-7 + R3-iot

- **实例详情关联执行**：`E1-7-instance-graph-link.png`（sha1 `6f2180c…`）——流程实例详情「Graph 执行记录」表：#2124685070774767618 / E1-3分流评分图 / v2 / SUCCESS / 59ms；点击编号实际跳转 `/agent/executions/detail/2124685070774767618`（已实测 URL）。
- **来源筛选**（选项：流程/表单/直接调用/IoT 触发），DB 计数：PROCESS 53、FORM 7、DIRECT 1、IOT 2，筛选后列表无其它来源：
  - 流程：19 条全为「流程」——`E1-7-source-process.png`（sha1 `1ee7414…`）
  - 表单：7 条全为「表单」——`E1-7-source-form.png`（sha1 `193d535…`）
  - 直接调用：8 条全为「直接调用」——`E1-7-source-direct.png`（sha1 `5407107…`）
  - IoT：2 条全为「IoT 触发」——`E1-7-source-iot.png`（sha1 `958aca7…`）
- **IoT 触发写 IOT**：触发记录 #2124739500000000001（action_type=AGENT、graphKey=agent_b14897a4786f458f）经恢复调度受理 → 执行请求 **#2124739585393786882 business_source=IOT status=SUCCESS**（另一条 INPUT_MISSING 也为 IOT）。说明：本机无 MQTT broker，IoT 触发采用「PENDING 触发记录 + 生产恢复调度 `ProcessTriggerRecoveryJob`」路径受理，未直接插执行请求。

## 8. E1-8 跨租户发布与运行拒绝（2 个响应）

以租户 0 普通用户 `e18_tenant`（role_id=2，非超管，租户拦截器生效）操作，Graph 归属临时改为租户 1：

1. 发布拒绝：`2106 绑定的 Graph 不存在、跨租户不可达或版本未发布: #2124684286825795585 v2`
2. 运行拒绝：表单提交后 FLOW_START 命令 `FAILED`，`failure_reason=Graph 执行失败[REJECTED]: 图不存在或跨租户不可达`（命令 2124693306827542529，retry 4）

测试后 Graph 租户已改回 0（`sw_agent_graph_def`/`sw_agent_graph_snapshot` 均回写）。超管会话按设计旁路租户过滤，本场景不能用 admin 取证——这一点与 `CommonTenantLineHandler` 注释一致。

## 9. E2-3 前端（补拍）

用户 `iso120_logview`（角色 `999902` `e23_log_view`，仅绑菜单 1=系统管理目录 + 9115=日志查询；**角色 status 修正为 1** 后才贡献菜单）。侧栏显示「系统管理 → 日志查询」，无「日志等级」；顶栏登录用户为 E2-3日志查看用户，登录日志表当前会话行（iso120_logview 登录成功）同帧。`/system/log-level` 直达 404（未授权路由未注册）。
证据：`E2-3-sidebar-noperm.png`（sha1 `81fe8b1…`）。

## 10. E3-1 修复后对照（2 张）

- 执行列表：`E3-1-execution-list-after.png`（sha1 `d71a40d…`）——底部「共 4 条」与 4 行数据一致，分页条正常。
- 系统日志：`E3-1-system-log-after.png`（sha1 `cd231cf…`）——「共 20 条」、10 条/页、页码 1/2 正常显示。
修复前基线仍引用 `.iso113/evidence/113-B1-during-waiting.png`、`113-B4-entry-fixed.png`。

## 11. 环境与文件

- iso120 仍只连本机 5432 `sw_iso120`；Redis 56379；Server 18093；Web 5275。未连接本机 MySQL 或其它用户服务。
- 临时凭据/脚本（`/tmp/token*.txt`、`/tmp/iso120_login.sh`、`/tmp/e1*.py`、`/tmp/slow_server.py` 等）已在使用后删除；回执不写口令。
- 测试夹具（保留在隔离库）：图 `E1-3分流评分图`/`E1-5人工节点图`/`E1-5子图引用图`/`E1-4*`/`E1-6回填图`/`E1-7 IoT触发图`，流程 `E1-4失败策略对照`、`E1-5*`、`E1-8*`，用户 `iso120_logview`/`e18_tenant`，角色 `999902`。表单 `form_risk` 定义与绑定已恢复原状（无 graphActions，绑定回到 `风控审批流`）。
- 本机 18888 慢工具服务已停止。

## 12. 自验结论

E1 全量取证完成（E1-3/E1-3T/E1-4/E1-5/E1-6+F1-type/E1-7+R3-iot/E1-8），E2-3 前端与 E3-1 补齐；E1-6 两端修复有单测与 UI 实证。**本批范围自验通过，待规划验收。**
