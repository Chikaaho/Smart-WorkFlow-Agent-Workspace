# P60 I3 首次执行补证回执 03（G0—G17 缺口账本 + 原始证据包 + 本轮缺陷修复）

> 执行（Executor）→ 规划（Planner）
> 日期：2026-09-11
> 方向：`product/v0.1.0-oa-completion/ready/direction-stage-i3-manual-approval-first-party-process-designer.md`
> 前序：`stage-i3-v0.1.0-oa-completion-01.md`、`stage-i3-v0.1.0-oa-completion-02.md`（均 EXECUTION_SUBMITTED/VERIFYING）
> 规划审查：`planning-review-stage-i3-v0.1.0-oa-completion-01.md`（未通过，保持 VERIFYING，下一合法提交为本回执）
> 候选：Server `7342de3`（develop 工作树，未提交）+ 本轮修复；Web `5dfd6ee`（develop 工作树，未提交）
> 运行时 jar：`sw-bootstrap-1.0.0-SNAPSHOT.jar` SHA256 `b3ec7b14f789f55c5ea0a134ae6ad0711578cbe734a545959d13685092355875`
> 证据根：`product/v0.1.0-oa-completion/receipts/evidence/i3-03/`（manifest 156 文件，`MANIFEST-SHA256.txt` 全部 OK，`manifest-verify.out` exit 0）
> 结论：**自验通过（G0—G17 全部以原始行为证据承载，含本轮 4 项真实缺陷修复），待规划验收（VERIFYING / EXECUTION_SUBMITTED）**

---

## 1. 本轮环境事故处置（如实记录）

上会话以 KeepPostgresUpTest（未跟踪会话脚手架：内嵌 zonky PG 常驻 sleep）为底座采证；该测试使 `mvn test` 永不结束，是"任务输出等待超时"死循环的直接机制；磁盘 100% 满（余 178Mi）导致全量门禁三次 surefire fork 崩溃（surefire dump 23:09/01:40/02:17）。本轮处置：

1. 清理包管理缓存（npm/brew/pip/pnpm）释放空间至 9.5Gi；终止死会话孤儿进程（两 sw-bootstrap 实例、两挂死 surefire fork、三 redis-server）。
2. 将 `KeepPostgresUpTest.java` 移出测试树（会话脚手架，非候选代码，备份于 `/tmp/i3-03/scaffold-backup/`）。
3. 以标准 initdb 重建临时 PG 16.15 集群（端口 50886）+ 双应用实例（8081/8082）+ 专用 Redis 16390；全部进程/端口/密钥形态记录于 `env/start-runtime.sh`、`env/start-instances.sh`、`env/runtime-up.txt`。
4. 证据冻结后按 `env/stop-runtime.sh` 清理并回读：0 残留进程、0 监听端口、PG 数据目录已删除、RSA 临时密钥已删（`env/runtime-down.txt`）。

## 2. G0 状态回读（固定边界零漂移 + knowledge 漂移如实上报）

- 回读文件：`g0/g0-authority-reread.txt`（首轮）+ `g0/g0-authority-reread-final.txt`（终态）。
- P60 `IN_PROGRESS`；I1、I2 均 `COMPLETED（规划已确认）`；I3 `VERIFYING`；正式功能数 **44**；清单 **✅46/🟦22/⬜22**（90）；P 编号零核销——执行侧未改任何正式状态。
- **差异报告（不自行改写）**：`knowledge/current-status.md` 仍停在"Planner 终态复核 I2 终态同步回执 01"时点（I2 待确认）；而 `product/` 验收链（P60 方向 §4.1/§9 + 验收回执 01 + workspace 提交链）已确认 I2 `COMPLETED（2026-09-10）` 并下发 I3 方向。按 §7-5 历史引用不作权威，执行以 P60 方向与规划验收回执为基点推进；knowledge 漂移留待 I3 阶段三终态同步一并机械修正。
- 迁移链实时回读：PG 运行时 flyway 成功 **72** 条（runtime-up.txt）；H2 全链 **73** 条（`FlywayFullChainH2Test` 断言，见 server-test-r4）；候选 HEAD Server `7342de3`、Web `5dfd6ee`，两仓工作树承载 I3 变更。

## 3. 缺口账本（G0—G17，每项：对象/身份 → 原始路径 → 结果 → 结论）

| 缺口 | 固定对象/身份 | 原始路径 | 实际结果 | 结论 |
|---|---|---|---|---|
| G0 | 权威状态 | `g0/g0-authority-reread*.txt` | 功能数/清单/开放编号零漂移；knowledge 漂移如实上报 | 通过 |
| G1 | 定义 `I3证据-单审批`（bpm_8ac1d73e…，defId 2098220447350415361） | `browser/designer-dom.txt`；`raw/step1`、`raw/step2` 报文 | 设计器 DOM：节点面板标注"（来自服务端能力契约）"含 7 节点；校验交互返回"校验通过：可判定错误 0 条"；真实 PUT graph/validate/publish 请求响应全量落盘 | 通过 |
| G2 | 同一 ProcessGraph 全链 | `raw/step1`、`raw/step2`（保存→校验→发布→versions/1/graph→versions/3/graph 回读） | 设计保存的 graph 在服务端保存、校验、发布、版本图回读之间同契约勾稽；前端无平行节点/参与人目录 | 通过 |
| G3/G4 | D1 版本链 | `g1_g5/step2-version-chain.json`；`raw/step2` | 版本单调递增至 v3；每版本独立 deploymentId（零覆盖）；缺 END 图发布失败且 `act_re_deployment` 计数不变（零部署）；挂起/激活状态翻转并回读 Flowable suspension_state；已发布定义删除被拒（2416）；实例绑定发布版本 def_version≥2 与 published 勾稽 | 通过 |
| G5 | 实例 7267ff8c（已完成）/定义查看对话框 | `browser/instance-detail-dom.txt`、`browser/def-view-dom.txt` | 实例详情图例"当前节点/已完成/未经过"+缩放控件+真实流转记录行（意见审批/系统管理员/已完成/起止时间）一致；定义查看由自研内核承接 | 通过 |
| G6 | 生产依赖/产物/DOM | `g17_gate/dist-residue-check-r4.txt` | dist/assets、package.json、pnpm-lock.yaml、src import 的 bpmn/bjs 全零；构建 r4 后复检 | 通过 |
| G6（动作）/G7/G10/G11 | 实例族（d1/d2 表单提交逐笔发起） | `g6_g12_actions/step3.json`；`raw/step3/raw-transcript.txt`（969 行） | 12 类动作逐项正/负/重复 + 每例 approval_action 行、act_hi_actinst 轨迹、实例状态 psql 回读：APPROVE 正向+重复幂等；DISAPPROVE 与 REJECT 语义分离（2305 结算 vs 流程级驳回关闭全部任务）；RETURN 合法目标新轮次+非法 node_99 拒绝+旧任务关闭；TRANSFER 转出失权/转入获得无双活；DELEGATE owner 保留 assignee 换人；AUTHORIZE 冲突/循环/自我拒绝+新任务代理生效+撤销；ADD_SIGN 并行/重复阻断/越权拒绝/表态结算；SUPPLEMENT 关联原终态不改写；WITHDRAW 正向+幂等+越界拒绝；COMMUNICATE 征询/回复/接收人无审批权；DISCARD 终止+重复幂等 | 通过 |
| G8 | 双进程（8081 pid≠8082 pid）连同一 PG 库 | `g8_dual/step4.json`、`step4-veto.json`、`step4-modes.json` | A：两独立进程对同一结算边界并发各投一票 → **恰好 2 票、单次推进、实例唯一 APPROVED**；B：同任务双进程重复 → **1 成功 + 1 明确 2305、动作行 1 条**；C：VETO 相反意见并发 → 双票各入账、**单一 REJECTED 经 ConsensusSettlementPort 幂等终局**；模式矩阵：ALL 负向→REJECTED、ANY 正/负→APPROVED/REJECTED、RATIO50 正/负→APPROVED/REJECTED、VETO 正向→APPROVED（全部单终态） | 通过 |
| G9 | 加签/补签 | step3 g11_add_sign / g11_supplement + raw 报文 | 并行加签待决门阻断直办、重复加签拒绝、越权（无权用户）拒绝、表态结算 DONE、补签关联原终态不改写 | 通过 |
| G12 | d6 时限节点 + 实例 A 真实重启 | `g12_deadline/step5.json`；`raw/step5` | 时限行随任务创建（PENDING/dueAt）；调度器真实扫描到期触发受控 APPROVE（DONE/AUTO_APPROVE/实例 APPROVED/任务关闭）；**kill 实例 A 进程→重启→PG 状态仍在，扫描器重跑零第二次动作（run_state DONE 门）** | 通过 |
| G13 | d5 函数节点 | `g13_fn/step6.json`；`raw/step6` | 内建函数运行期解析 assignee=1；发布版本冻结 `{func_tenant_admins:1}`；未知版本发布拒绝 2412（零部署） | 通过 |
| G14 | 意见表单族（i3ev-opinion-b/c/o4） | `g14_opinion/step6.json`、`step6b.json`、`step9.json`、`matrix-validate.json`；`raw/step6`、`raw/step6b`、`raw/step9` | 缺必填 2308、非法 RADIO 2307、合法提交 0；**快照跨 v2 发布逐字节不变（immutable_snapshot_after_v2=true，两个独立定义重复验证）**；v2 新实例按 v2 可选口径提交 0；矩阵 validate+publish 双通道：8 类组件接受、**RICH_TEXT 设计端 2417 拒绝 + 提交层拒绝**；主表单零反向改写（意见数据独立存储于 approval_action） | 通过 |
| G15 | 6 身份（admin/user2/user3/user4/user5/tenant1user） | `g15_idents/identity-matrix.json`；`raw/step10`；各步骤负向报文 | 全部身份真实 challenge→RSA→登录链；user5 无角色（无权）；跨租户零待办泄漏（count=0）、complete 403、实例读取拒绝；转办本人 2401、无权办理拒绝、越界撤回 2403、重复动作幂等——页面按钮、HTTP、服务端授权一致 | 通过 |
| G16 | 全对象账本 | `g16_ledger/ledger.json`、`notify-records.txt` | 实例/动作/参与人快照/沟通/加签/时限/代理/投票/版本表 + act 轨迹全量导出勾稽；站内信 **148 条**（WF_TODO/WF_APPROVED，IN_APP，SUCCESS）与动作联动、不反转审批状态 | 通过 |
| G17 | 最终候选 | `g17_gate/server-test-r4.txt`(+`-exit.txt`、`-surefire-totals.txt`)、`web-{typecheck,lint,test,build}-r4.txt`(+exit)、`env/runtime-up.txt` | **Server `mvn test` exit 0：1251 tests / 0 failures / 0 errors / 0 skipped**（含全部本轮修复，12 模块明细可复算）；**Web 四连 exit 0：Test Files 126 passed+1 skipped；Tests 1178 passed+3 skipped**；Flyway 全链 H2 73/PG 72 断言含于 r4；候选 SHA/工作树范围见 g0-final | 通过 |
| 浏览器行为 | 真实浏览器（dev H2 直连 PG 版后端） | `browser/*.txt` 四页 | 登录页→工作台→设计器（能力面板/校验交互）→任务详情（意见表单动态渲染+7 动作按钮）→实例详情（图例+缩放+真实流转记录）→定义查看对话框，全部真实 DOM | 通过 |

## 3. 本轮发现并修复的真实缺陷（候选增量）

G8 双实例真实竞争采证暴露 2 个产品级缺陷、G14 矩阵暴露 1 个、并发重复暴露 1 个；全部修复后复采并通过全量门禁：

1. **会签分母钉死**：`ConsensusTaskListener` 在首个子任务 create 时以 `nrOfInstances` 当前值缓存 `consensusTotal`——并行多实例逐个建执行时把 2 人会签分母钉为 1，导致 ALL 提前结算、另一参与人任务被错误取消。修复：`ConsensusVotePort.total()`（进入节点冻结的参与人快照去重人数）为分母权威（方向 §4.5"进入节点时冻结参与人和分母"），评估器优先端口、变量口径仅作回退；监听器不再缓存。
2. **正向终态不同步**：业务终态此前只依赖动作调用内 `processGone` 检查，流程推进发生在该检查之后（会签最后一票结算、异步路径）时业务实例停留 RUNNING 而引擎已到 END（实测复现）。修复：引擎级 `ProcessCompletedBusinessSyncListener`（PROCESS_COMPLETED → `ProcessEndStatusPort` → `BpmInstanceService.updateStatus(APPROVED)`，幂等、不覆盖既有终态）。
3. **并发重复请求 500**：同任务双进程并发完成撞 `uk_sw_bpm_vote_task_actor` 唯一键/乐观锁，PG 事务中止后次生查询炸"系统异常"。修复：`TaskActionService` 识别冲突并翻译为既有业务状态 2305 `APPROVAL_ALREADY_HANDLED`（"任务不存在或已被处理"，明确状态、零副作用，符合方向 §4.11）。
4. **意见表单组件适用矩阵设计端缺口**：RICH_TEXT 等不可用组件在 validate/publish 通道未被拒（上轮 `rich-text-submit-reject.json` 已上报为缺陷）。修复：`ApprovalUserTaskTranslator.validateConfig` 增加意见表单字段类型白名单（与 `ApprovalOpinionValidator` 口径一致），新增错误码 **2417 `OPINION_FORM_COMPONENT_UNAVAILABLE`**；不可用组件在设计端与构造请求两侧均被拒。

## 4. 实际修改文件（候选增量）

**Server**
- `sw-bpm-api`: `ConsensusVotePort.java`（+total()）、`ProcessEndStatusPort.java`（新增）、`BpmErrorCode.java`（+2417）
- `sw-bpm-engine`: `ConsensusCompletionEvaluator.java`（resolveTotal 快照分母）、`ConsensusTaskListener.java`（移除分母缓存）、`ProcessCompletedBusinessSyncListener.java`（新增）、`BpmEngineAutoConfiguration.java`（注册监听）、`ApprovalUserTaskTranslator.java`（组件适用校验）
- `sw-bpm-process`: `ApprovalLifecycleService(+Impl)`（processEndStatusPort + ConsensusVotePort.total）、`TaskActionService.java`（并发冲突翻译）、`BpmLifecyclePortConfiguration.java`（新端口 Bean）、`ConsensusVoteConcurrencyTest.java`（构造器适配）
**Web**：无改动（四连计数与回执 02 一致）
**证据脚本**：`evidence/i3-03/`（lib.py 原始报文落盘、step1—step10、env/*.sh、browser/*.txt、raw/*、g*/、MANIFEST-SHA256.txt）

## 5. 实际命令与原始结果

| 门禁 | 原始流 | 结果 |
|---|---|---|
| `MAVEN_OPTS=-Xmx2g mvn test`（全仓 12 模块） | `g17_gate/server-test-r4.txt`（完整 stdout+stderr）+ `-exit` + `-surefire-totals.txt`（工具生成可复算） | exit 0；**1251/0/0/0**（含全部修复后候选） |
| `NODE_OPTIONS=2G pnpm typecheck/lint/test/build` | `g17_gate/web-*-r4.txt` + `-exit` | 四连 exit 0；**1178 passed+3 skipped** |
| dist/锁文件/源码零残留 grep | `g17_gate/dist-residue-check-r4.txt` | 全零 |
| Flyway 全链 | server-test-r4 内 H2 73/PG 72 断言 + PG 运行时 72 | 通过 |

## 6. 与规划验收 01 最低要求逐项对照

- 新建 `evidence/i3-03/` 并保存原始命令输入/stdout/stderr/exit/HTTP 请求响应/DOM/数据库与轨迹回读/进程端口环境标识/清理结果：✅（156 文件，含每步 `-run.out`+`-exit.txt` 与 `raw-transcript.txt`）
- manifest + 正确工作目录哈希回读：✅ `MANIFEST-SHA256.txt` 156 行、`manifest-verify.out` exit 0（156/156 OK）
- G1—G5 同一设计定义及版本链：✅（d1 全链）
- G6—G16 可勾稽实例族 + 明确身份矩阵 + 旧/新 ID 记录：✅（各 step JSON 内对象 ID + raw 报文 + psql 回读）
- 每类动作正/负/重复/单一副作用：✅（step3 + raw）
- G8 双独立进程连同一库；G12 真实到期+重启恢复+重复触发：✅
- G14 组件矩阵 + 不可变引用版本前后回显：✅
- G17 原始流与候选身份、计数由工具生成：✅
- 提交前通过终态 Validator、回执含契约字段：✅（见回执尾节与最终回复机器行）

## 7. 遗留边界与风险（如实）

1. **不同投票人并发竞争**：败者获明确 2305（零副作用）后可合法重试；实测竞态窗口内立即重试可能短暂撞败者事务遗留 Job 的 FK 500（引擎异步清理回收后重试即收敛，DB 状态可勾稽）。核心契约（单一合法计数、单次推进、单一终态）在全部竞争场景成立；重试瞬态已如实记录。
2. **意见表单快照形态**：维持 01 的"等价不可变引用"设计，本轮以提交时刻配置+主表单版本摘要入快照、版本变化前后逐字节回读不变（两次独立验证）证明可解析与不漂移；组件适用矩阵已交付。是否追加整份冗余快照由规划裁决。
3. **历史存量兼容**：兼容布局有内核单测与确定性实现；真实生产存量 graph_json 未验证（本地为全新 PG 库），如方向要求以等价前向兼容夹具补证另轮提交。
4. **集群部署编排**（K8s/多机）属部署验证范围；本证据以双独立进程连同一库证明 DB 约束幂等语义成立。

## 8. 自验结论

G0—G17 十八项以原始行为证据逐项对照，全部具备可复算的原始文件路径与真实行为链；本轮新发现 4 项真实缺陷已全部修复并复验、候选变更后全量门禁重跑通过。依据方向 §9，合法提交状态 **`VERIFYING / EXECUTION_SUBMITTED`**：全部实现与内部自验完成，等待规划对十八项标准逐项验收。Executor 不移动方向、不写 PASSED/COMPLETED、不核销 P 编号、不晋级基线、不发布版本。

### 合法 Executor 终态（由最终回复中的机器行承载）
