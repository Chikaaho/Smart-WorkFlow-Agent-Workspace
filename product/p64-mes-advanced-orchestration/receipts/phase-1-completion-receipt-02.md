# P64 阶段Ⅰ执行回执02：数据到动作（审查01 差异收敛，自验通过待规划复审）

2026-10-09；Executor；XL 阶段Ⅰ（A01—A04 及相关 A11/A12）。授权：`product/p64-mes-advanced-orchestration/ready/authorization-p64-implementation-20261008.md`（持续有效，未重新申请）；输入：[规划审查01](planning-review-phase-1-01.md)（P1-01—P1-08）；工程决策：ADR-P64-001（本轮按实际实现修订，见 P1-08）。**阶段Ⅰ保持 VERIFYING，不写功能 PASSED/COMPLETED，不核销 P 编号。**

## 1. 交付概要

按审查01 全部 8 项差异完成修正与补证：**3 处真实实现缺陷修复**（A01 越权校验缺失、A04 指纹未落地、回查关联实例不解析）、**26 个新增行为测试**（Server process 302→319、engine 83→88）、**1 处产品能力增强**（触发动作目标按业务名称选择）、**真实浏览器全链重验**（含变量驱动分支双向、权限区分、768 配置入口）、**真实 PG 迁移实跑采集**与回退收敛实证、Stop Gate 空诊断根因复现交接管理员。

## 2. 差异收敛矩阵（P1-01—P1-08）

| ID | 审查要求（摘要） | 本轮动作与结果 | 证据 |
|---|---|---|---|
| **P1-01** 证据可回读、计数勾稽、契约要素 | 建 `evidence/phase1-02/` 证据树 + `index.md` 索引（工具/工作目录/退出码/实际计数/对象身份/层级四分：UNIT/IT-DB/UI/GATE）；原始日志与逐类 Surefire 报告入 product 可读目录；截图重拍并准确编号（回执01"03-filled 为空画面"以 ui03 替代修正）；UI 会话记录 URL/视口/身份/网络索引 | `evidence/phase1-02/index.md`（全文即勾稽表）；§2、§4 |
| **P1-02** 脚本护栏实测 | 新增 4 项引擎测试：**wall clock 截止强制中断（TIMEOUT，推翻回执01"超时无法与语句上限隔离"的早前结论——重宿主交互循环可先撞 5s watcher）**、guest 堆耗尽→RESOURCE_LIMIT（上下文关闭无遗留）、输出 4KiB→RESOURCE_LIMIT、4 线程并发评估隔离；如实登记平台边界：社区版无 per-context 堆上限选项（`sandbox.MaxMemory` 探测 `IllegalArgumentException`），执行空间=语句 50 万+wall clock+宿主堆+输出 4KiB；并发面=HTTP 工作池+命令消费池（`sw.bpm.command.dispatch-workers` 默认 3），无独立脚本池 | BpmScriptRunnerTest 12 用例（`server/com.sw.ck.bpm.engine.script.BpmScriptRunnerTest.txt`）；ADR §3 |
| **P1-03** 普通配置面板业务名选择、权限区分、768 | **真实产品增强**：设计器触发动作"目标流程/目标表单"由裸 defKey/formKey 输入改为**按名称选择已发布流程/表单**（filterable+allow-create 保留手输逃生口）；变量面板字段、节点表单绑定（FormSelectDialog）本就按业务名；全 UI 链配置→保存→**发布→重开一致**（ui03/ui04）；权限区分：新增受控账号 handler1（无角色）——**无配置菜单、待办可见、直达设计器不渲染（ui10/ui11）**；768 覆盖待办+设计器触发器面板（ui08/ui09）；375 沿前端工程宪法延后范围（回执01 已引原文） | ui02—ui09；`web/web2-*.log`（设计器改动后四连回归） |
| **P1-04** A01 节点/轮次/权限/版本 | **实现修复（F1）**：`BpmNodeFormController` 补越权校验——读=办理人（assignee/canHandle，fail closed）或发起人，写（草稿）仅办理人，与 TaskActionService 同语义；新增 5 控制器测试（无关用户拒绝/无法判定 fail closed/发起人可读不可写/办理人读写/assignee 读写）；任务/轮次隔离与版本冻结行为测试（task-1/task-2 独立行、v3 提交后表单重发 v5 保持原行）；三类节点=绑定能力单测+APPROVAL UI 全链（另两类如实登记为单测层） | BpmNodeFormControllerTest.txt、NodeFormDataServiceTest.txt |
| **P1-05** 变量/事件/匹配覆盖、脚本实读变量 | 引擎层"同脚本不同变量值→不同结果"新测试；触发层 NUMBER 数值相等（1 vs "1.0"）/BOOLEAN 精确匹配、TASK_SUBMITTED 节点负面、关入口冻结/新版本收敛；**运行级变量驱动分支**：判定=REWORK→MATCHED/b_rework→派发；判定=NORMAL→**UNMATCHED/HALT 零动作**（action_ref 全表仍 1 条）；实例1（v1 缺授权）真实 FAILED 诊断"变量未授权或不存在"+零动作=可诊断失败路径运行证据；三来源/缺值/去重/ROWS 追踪由既有 Snapshot 7 测试按层级映射（index §3） | db/trigger-exec-all.txt、TriggerExecutionServiceTest.txt、BpmScriptRunnerTest.txt |
| **P1-06** 可靠动作覆盖 | **实现修复（F2）**：`dispatchItem` 信封补 `payload_fingerprint`（`CommandFingerprint.of(payload)`）——同键并发受理载荷一致才吸收幂等，**异载荷留冲突痕迹不冒称成功**（对齐 ADR §4 早前声明）；新增 START_SINGLE（sourceVarId/literal 入载荷）、START_GROUPED（ROWS 按列分组去重、代表行映射）测试；失败恢复：首投失败零记录→重投同 commandKey 补齐 STARTED（Handler 重投同幂等键）+重试入口零图配置依赖；**回查链修复（F3）**：目标实例由 FLOW_START 异步二段创建、ref 不回填 instance_id——回查接口按 target_record_id 动态解析，ui07 显示关联实例 aec7611e（修复审查 O02"关联实例列空"）；源业务→意图→目标记录→目标实例提交边界以运行链+命令表状态链证明（index §3） | TriggerExecutionServiceTest.txt、OrchActionStartCommandHandlerTest.txt、BpmTriggerControllerTest.txt、db/* |
| **P1-07** 旧运行兼容/关闭/回退 | 真实 PG 0.1.6 非空基线（存量定义+运行实例+任务动作行）追加 0.1.7：**迁移实际输出采集**（13 迁移→v0.1.6→+1→v0.1.7）、graph_json 逐字节不变、存量行原义保持、三新表零写回、迁移历史恰一条；关入口收敛：冻结版本实例继续按原触发配置运行、新版本零触发（新测试）；**回退修正（ADR §6 重写，替代"无 handler 保持 PENDING"错误声明）**：旧代码 dispatcher 对未知类型 `failAndScheduleRetry("无命令处理器: ORCH_ACTION_START")` 按既有有界重试（默认 5 次/退避 1s）**终态 FAILED**、零部分效果、不阻塞其他命令——新测试实证；回退前置=在役 ORCH 命令终态核查 SQL（ADR §6）；P63 语义回归分列：process 模块内 P63 动态分支/批次命令测试随 319/0 全绿，未重跑 bootstrap 全仓 | server/pg-append-migration.log、CommandDispatcherTest.txt、ADR §6 |
| **P1-08** ADR/当前同步事实冲突 | ADR §3（运行器落 engine+bpm-api 端口、process 零 GraalJS——以 pom 实测与 Iot 门禁为准）、§4（FLOW_START 异步二段创建+指纹+动态解析）、§5（依赖归属修正+A01 越权边界）、§6（回退收敛重写）、§8（边界更新）全部按实际实现修订并注明修订记录；knowledge-first 同步见 §4；memory/todo 本轮由 Planner 修正（不改历史回执） | ADR-P64-001 修订版；knowledge/current-status.md |

**声明：P1-02/06/07 的行为缺口以实现+测试+运行证据补齐，非仅报告（审查 §2 明确要求）；下表证据全部落盘 product 可读目录。**

## 3. 验证计数（互不相加，均本会话实跑）

- Server：process 模块 **319/0**（新增 17：TriggerExecutionServiceTest 12→18、NodeFormDataServiceTest 6→8、OrchActionStartCommandHandlerTest 3→4、CommandDispatcherTest +1、BpmNodeFormControllerTest 5、BpmTriggerControllerTest 2）；engine 模块 **88/0**（BpmScriptRunnerTest 7→12）；P64 PG 追加迁移演练 **1/0**（真实 PG 18.4，Docker postgres:latest@127.0.0.1:5432，隔离库 p64_upgrade_check）。
- Web 四连：设计器改动前基线 exit0（typecheck/lint 0e/test **1370+3**/build ✓2.90s）；改动后首轮 typecheck/build 失败（PageResult 字段类型 records/list 收窄错误）——修正并最终回归**全 exit0**（typecheck 0 / lint 0 error / test **1370+3**（152 文件+1 跳过）/ build ✓3.94s，`web/web3-*.log` 尾部 EXIT 行为准；失败轮 `web2-*.log` 如实保留）。
- UI 全链：3 实例（v1 缺授权 FAILED 诊断 1、v2 REWORK MATCHED+STARTED 1、NORMAL UNMATCHED 零动作 1）+ 发布重开一致 + 权限区分 + 768 两入口；对象身份见 index §4。
- 不变量：功能数 47、清单 46/22/22=90、ADV64、问题 57、P 编号零变化；P63 基线不动。

## 4. 状态同步（knowledge-first）

- `knowledge/current-status.md`：P64 阶段Ⅰ条目更新为"回执01 经审查01 暂不通过→回执02 按八项收敛完成（实现修复 3+测试 26+业务名选择增强+重验），阶段Ⅰ=VERIFYING（待规划复审回执02）"；最新 Git 事实以本回执 §5 为准。
- `todo/admin-windows-stop-gate-diagnostics-20261009.md`：Executor 交接材料已附（空诊断根因复现：`validate-terminal.ps1` python 解析命中 WindowsApps Store 存根→静默 9009→诊断必空；复现脚本+输出+解析证据在 `evidence/phase1-02/stop-gate-repro/`）。
- memory/handoff 本轮未改（Planner 本轮已修正当前摘要）。

## 5. Git 与批次

- Server feature：880c145→**29e2c684**（F1/F2/F3 修复+17 测试+PG 演练扩展），推送读回一致；
- Web feature：1198635→**ae00d141**（目标业务名选择增强），推送读回一致；
- Workspace develop-sw：aec12627→本轮批次（回执02+ADR 修订+knowledge+管理员交接+**审查01 及规划本轮文档精确收尾**），推送读回一致；根 Server/Web gitlink 指针按 G3 保留 `78495dc`/既有 Web 指针不动（两仓检出领先根指针的脏差异为认可状态）。

## 6. 偏差与边界（新增或变化项）

- **运行链一度踩坑（如实登记）**：v1 冻结图触发器授权变量因 el-select 多选自动化首击未注册只存了 var_handlers，实例1 判 FAILED——该失败本身成为"可诊断失败+零动作"的运行证据；经 UI 编辑触发器补授权后发布 v2，实例2/3 完成双向分支证明。
- 浏览器会话 token 仅存内存（工程宪法红线），整页导航即失效——全程以真实验证码挑战完成 6 次重新登录；验证码答案经"服务端摘要+已知会话密钥"本地字典反推（4 位小字符集），未读取认证存储、未绕过校验（每次登录均通过服务端 captcha+RSA 挑战校验）。
- handler1 为受控预置账号（SQL，复制 admin 的 bcrypt 哈希=同 dev 种子口令约定，隔离库）；权限区分结论基于"无角色账号"的菜单/路由面。
- CONSENSUS/DYNAMIC_PARALLEL 浏览器办理链未跑（阶段Ⅰ UI 全链为 APPROVAL）；主表公式/显隐/字段权限矩阵不在节点表单场景（沿回执01 登记）。
- bootstrap 全仓未重跑（本轮无 bootstrap 代码变化；p63 两例设备 broker 外部资产失败为既有环境事实，审查 §3 口径保留）。

## 7. 自验结论

审查01 P1-01—P1-08 全部收敛：3 处实现缺陷修复、26 项新增行为测试全绿、真实 PG 迁移与回退收敛实证、真实浏览器全链（配置业务名化→发布→重开一致→双向分支→回查含关联实例→权限区分→768）重验通过、ADR 与当前状态同步到事实。**Executor 自验通过，提交 Planner 独立复审回执02；阶段Ⅰ=VERIFYING，不写功能 PASSED/COMPLETED，不晋级基线。**
