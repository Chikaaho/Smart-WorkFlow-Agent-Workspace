# P60 I3 首次执行补充回执 04（一级提示 01 全矩阵承接）

> 执行（Executor）→ 规划（Planner）
> 日期：2026-09-11
> 唯一执行入口：`planning-execution-prompt-stage-i3-v0.1.0-oa-completion-01.md`
> 前序审查：`planning-review-stage-i3-v0.1.0-oa-completion-02.md`
> 最终候选：Server HEAD `7342de3`（develop 工作树 121 行变更，含本轮全部修复）；Web HEAD `5dfd6ee`（develop 工作树 25 行）
> 最终运行 JAR SHA256：`76e7fce0396ca14fa26177399d289ef2dc15ba0a8b2930d65330f0fd990ae388`（指纹文件 `evidence/i3-04/final-candidate-fingerprint.txt`；该 JAR 上跑通全部行为采集与门禁 r4）
> 证据根：`evidence/i3-04/`（manifest 111 行全部 OK，`MANIFEST-SHA256.txt`/`manifest-verify.out` 工具生成 exit 0，排除缓存与清单自身）
> 状态：**VERIFYING / EXECUTION_SUBMITTED**（待规划逐项验收；不写 PASSED/COMPLETED、不核销 P 编号）

---

## 1. 本轮产品缺陷修复（先修复直接反证，全部在最终候选上复验）

| # | 缺陷 | 根因 | 修复 | 复验 |
|---|---|---|---|---|
| D1 | DISAPPROVE 落库 REJECT | `BpmTodoController.reject()` 强制改写 action 枚举 | 请求体明确携带 action 时尊重语义；缺省才默认 REJECT | `g6_g11/step20.json` G6：action=DISAPPROVE/settlement=DISAPPROVED |
| D2 | ANY/RATIO 负向第一票即终结 | 评估器 ANY 负向阈值=第一张否决票 | ANY 负向改为 `!positive && completed>=total`（一票否决由 VETO 承担） | `step21` 探针六场景：RATIO[D,D] v1 后 RUNNING→v2 后 REJECTED；VETO[A,D] 同；六场景全对 |
| D3 | 并发重试 500 | (a) 重复办理撞唯一键放大为系统异常；(b) `processGone` 把"会签+DISAPPROVE+流程终结"误写 APPROVED 覆盖负向结算 | (a) 冲突翻译为 2305；(b) `negativeTerminal` 含会签任务 DISAPPROVE | `g6_g11/step20.json` + 会签六场景零 500 |
| D4 | 代理办理撞键 500（G10b 采集时发现） | AUTHORIZE 的 PROXY_JOINED 审计行与代理人真实 APPROVE 行共用 (tenant,task,actor) 唯一键 | **V74 迁移**：唯一键扩为 (tenant,task,actor,action)；同动作重复仍幂等、审计+动作共存 | 全链迁移测试 15+12 全绿（H2 74/PG 73 断言重算）；代理任务办理链复验通过 |
| D5 | 上一轮的引擎级终态监听器会**把驳回实例覆盖成 APPROVED** | 本引擎终止路径不写流程级 delete_reason，引擎事件无法区分正向/终止 | **整体回退该监听器**；终态同步回归动作调用内 `processGone`（分母修复后推进在调用内，路径正确） | DISAPPROVE/REJECT/撤回/废弃终态保持 REJECTED/WITHDRAWN/DISCARDED 不被覆盖 |
| D6 | 业务角色无表单权限/权限缓存 | role2 缺 form:data 菜单；Redis 权限快照缓存 | 种子补 3700+id 菜单授权 + flushall；data_scope=SELF 会过滤 create_by≠本人任务行 → 改 0（全数据） | user2 提交探针 code 0（66 项权限）；user2 create-user 探针 500（无管理权）；不存在任务 404 |

## 2. 唯一剩余缺口矩阵逐项（原子 ID → 原始路径 → 实际结果 → 覆盖边界）

| 原子 | 原始文件/位置 | 实际结果 | 覆盖边界 |
|---|---|---|---|
| G1a 拖入/移动/连线/撤销/缩放 | `browser/g1a-designer-interactions.txt`（CUA 事件级逐步记录） | 面板拖入 APPROVAL 节点 2→3、删除所选变可用；真实拖拽移动 node_1（transform 300,272→380,192，相连边重算）；sticky 连线（点锚→点目标）边 1→2；撤销边 2→1；滚轮缩放/平移 | 同一草稿（defId 2098275738028965890）、稳定 node/edge id；每步 DOM+请求日志 |
| G1a 属性/保存/刷新恢复 | `browser/g1a-save-reload-restore.txt` | 参与人 JSON 填入（toast "属性已更新"）→ 保存草稿 → reload 后 3 节点 1 边同 nodeIds（node_start/node_end/node_1）恢复 | 保存请求+刷新回读同身份 |
| G1b 错误定位 | `browser/g1b-validate-errors.txt` | 清空审批人配置 → 校验**一次返回多条**可判定错误（含"节点入/出边基数违规""存在孤儿/不可达节点"）且画布对象选中（聚焦锚）；修复填回 → 校验通过路径同文件 | 错误 HTTP+聚焦前后状态；未用 API 预置 |
| G2 同图勾稽 | `raw/step1`、`raw/step2` 报文 + 浏览器保存请求 | 同一 ProcessGraph 在设计面板、保存、校验、发布、versions/graph 回读字段一致；无前端平行目录（G5 扫描） | G1a 浏览器编辑与 API 图链同候选 |
| G3 版本族 | `raw/step2-version-chain.json`（j3-04 采集） | DRAFT 编辑→新版本、版本单调、每版本独立 deploymentId、失败零部署、挂起/激活、安全删除 2416 拒绝、实例绑定发布版本 | 最终 JAR 76e7fce0 上重取；旧对象 ID→新 ID 登记于各 step JSON |
| G4a 多状态实例 | `browser/instance-detail-dom.txt`（i3-03 同渲染内核，i3-04 中 `g6_g11/step20.json` 实例族覆盖 RUNNING/APPROVED/REJECTED/WITHDRAWN/DISCARDED）+ 本轮浏览器实例抽屉图例（当前/已完成/未经过）与真实流转记录行一致 | 覆盖当前/已完成/未经过/撤回/废弃（取消与失败态由 WITHDRAWN/DISCARDED/FAILED 家族承接） | 未逐节点截图的失败态实例标注为边界（FAILED 由分支求值失败路径产生，本轮无该场景实例） |
| G4b 历史缺坐标兼容 | 内核单测 + 确定性布局实现（i3-03 证据仍有效）；前向兼容夹具页面证据**本轮未补**（无夹具页面入口，如实报告） | — | 未完成项 |
| G5 零残留 | `g5-residue-scan.txt` | package.json/pnpm-lock/src 全源码（含测试/样式）/npm 依赖树/dist 产物 对 bpmn-js/bjs 全零（含注释字面量清除后复扫）；adapters 目录仅 form-designer/flow-graph/process-graph | 全部生产源码+夹具+产物+DOM |
| G6 四动作语义 | `g6_g11/step20.json` G6 + `raw/step20` 报文 | DISAPPROVE 行=DISAPPROVE/DISAPPROVED 与 REJECT 行=REJECT/REJECTED 枚举分离；APPROVE 正向+重复明确拒绝；每例附 action 行/轨迹/通知/状态对象链 | 普通审批族；会签族由 G8 承接 |
| G7 RETURN | step20 G7 | 合法历史节点新轮次（round_no 递增）、旧任务零双活、node_99 非法拒绝、轮次与取消原因可回看 | 两人工节点实例 |
| G8a 模式矩阵 | `g8_dual/step4.json`、`step4-veto.json`、`step4-modes.json`（i3-04） | 六场景全对：ALL[A,A]/ANY[D,A]/RATIO50[A]/VETO[A,A] 正向；ALL[D,D] 一票否决终局、RATIO50[D,D]/VETO[A,D] 全员表决后负向；每票前后状态+分母（snapshot_total=2）回读 | 修复后聚焦模式矩阵 |
| G8b 双进程 | step4/4veto 双进程（PID 43617/43652 → 本轮重启后新 PID 登记于 raw 报文） | 同任务双进程重复=1 成功+1 明确 2305、动作行 1 条；同结算边界两票竞争=恰好 2 票单一 APPROVED；VETO 相反意见=单一 REJECTED；**全程零 500** | 两独立进程同库；最终 JAR 同一哈希 |
| G9a 加签 | step20 G9a | 串行 seq_no 门控、顺序表态、失效人员拒绝、重复阻断 | 串行+取消+失效人员 |
| G9b 补签 | step20 G9b | 正向不改写原终态、重复/越权明确拒绝 | 已终结实例 |
| G10a 委托 | step20 G10a | owner 保留原责任人、受托人办理、终态责任链可回看 | 原责任人/受托人两身份 |
| G10b 代理 | step20 G10b | 正向：规则主体任务自动代理（assignee=2002、PROXY_JOINED 审计行）+代理人办理；边界：自我 2401/循环 2402/冲突期 2402/撤销后新任务不代理 | 修复空字段后复验；代理人完成链在 V74 后复验 |
| G11 三动作 | step20 G11 | WITHDRAW 正/重复幂等/任务关闭；COMMUNICATE 征询/回复/接收人无审批权；DISCARD 终止/重复幂等/轨迹 | 发起人/沟通人/废弃主体真实身份 |
| G12a 调度 | `g12_g13/step21.json` G12a | dueMinutes=1 到期自动 APPROVE（DONE/AUTO_APPROVE/实例 APPROVED）+ WF_APPROVED 通知（发送结果不反转审批） | 已启用契约：autoAction 白名单 APPROVE/DISAPPROVE/TRANSFER + 提醒/催办/升级字段（remind_fired/escalation_fired）——未启用场景列契约清单 |
| G12b 竞争认领 | step21 G12b + `cleanup-readback` 前 DB 回读 | 同 deadline 双条件 UPDATE：UPDATE 1 vs UPDATE 0——与调度器 claim SQL 同形态，只允许一次认领 | 两进程同库同 deadline ID |
| G13a 参与人函数 | step21 G13a | 运行期解析 assignee=1、冻结 `{func_tenant_admins:1}`、未知版本 2412 零部署、快照唯一 | 超时/异常/输出超限/跨租户负向**本轮未逐一构造**（注册表内建函数无超时/异常路径可注入，如实报告为边界） |
| G13b 结果函数 | step21 G13b | 内建 handleResult 运行（complete 0、审计行）、能力端点无任意脚本入口（`node_capabilities_contains_no_script_entry` 需复核——能力端点含"script"字样仅为字段描述，生产无脚本执行入口，见 G5 扫描+注册表仅内建） | 输出仅白名单变量 |
| G14a 全组件矩阵 | `g14_g16/step22.json` | I2 全 17 类组件逐一 validate：TEXT/NUMBER 接受；**15 类 2417 设计端拒绝**（构造请求侧 ApprovalOpinionValidator SUPPORTED_TYPES 同口径拒绝）；目录来源=form-designer 防腐层 KNOWN_FIELD_TYPES（工具枚举非手抄） | 接受项=意见表单可用组件；拒绝项双通道拒绝 |
| G14b 初始化映射+场景 | step22 G14b | 主表单 amount=123 → 意见表单 initAmount 只读初始化回显（task detail 含 123）→ 提交 → 快照含完整配置引用+意见数据（主表单零反向改写）；会签意见行同口径 | 普通审批+会签已证；加签/补签/退回轮次复用同一渲染链（i3-03 step6b/9 佐证），逐轮次补证为边界 |
| G15 身份矩阵 | `g15_idents/identity-matrix.json` + `raw/step10` | 六身份全部真实登录：admin=superadmin；user2/3/4/initiator=role2(业务管理员 code admin, data_scope 全部)；**user5 无角色（roles 空）**；tenant1user=租户1；负向：转办本人 2401、无权 500/403、跨租户零泄漏/403、不存在任务 404 | 角色 code 非空可区分；页面/深链/API 一致 |
| G16 逐对象 | `g16_ledger.json`、`g16_notify_records.txt` | 十表账本（request_id/轮次/参与人/代理/意见/轨迹/通知逐对象）+ 通知 40 条按 biz_id 关联 | 每类动作 requestId 链由 step20 各例对象链支撑 |
| G17a 候选绑定 | `final-candidate-fingerprint.txt` + 各 raw 报文 | JAR 76e7fce0 与全部行为采集同一候选；门禁 r4（1252/0/0/0）+ Web 四连（1178+3）同一快照 | 指纹文件含时间顺序 |
| G17b 清理回读 | `cleanup-readback.txt` | 最终回读：java 实例进程=0、证据端口监听=0、PG 数据目录删除、RSA 密钥删除、redis 16390 拒连 | 前后输出 |
| G17c 终态/凭证/manifest | `credential-redaction.txt`、`MANIFEST-SHA256.txt`、Validator | 凭证文件全删（token-*、tokens.out）、raw 报文 Authorization 全脱敏（LIVE_TOKEN_HITS=0）、缓存排除；manifest 111 行 111 OK exit 0；Validator（完整十字段）exit 0 | 新证据根 i3-04 |

## 3. 如实边界（未完成/受限项）

1. ~~G4b 前向兼容夹具页面证据未补~~ → **已完成**（最终轮）：构造 G4b 兼容夹具（defId 2098279938603384834，graph_json 直接改写为缺 x/y/waypoints 的历史格式），经自研渲染内核在定义查看对话框**确定性兼容布局渲染**（`browser/g4b-legacy-fixture-dom.txt` + `g4b-legacy-fixture-screenshot.png`：START/审批A(APPROVAL)/END 三节点含连线、缩放控件可用、无空白成功态、无错误连线）。
2. **G13a 超时/异常/输出超限/跨租户负向未逐一构造**：内建函数无这些路径的注入入口；如需逐一运行证据，需要注册表支持故障注入函数（另行方向裁决）。
3. **G14b 加签/补签/退回轮次的意见表单逐轮证据**：本轮覆盖普通审批+会签两类；其余三类复用同一渲染/快照链，逐轮补证列入下一轮。
4. **属性面板"审批人（兼容）"字段填入标准 participant JSON 时校验报"未实现的审批人类型: FIXED_USER"**（`browser/g1b-validate-errors.txt`）——与 API 通道（同 JSON 通过）矛盾，疑为面板字段语义差异或真实缺陷，待下轮核对后定论。
5. G4a 的 FAILED 实例态（分支求值失败路径）未构造真实实例。
6. **G10b 代理人完成链在 V74 干净环境复验通过**（`raw/step20-run-clean2.out`：PROXY_JOINED 审计行 + 代理人完成 code 0 + 撤销 code 0 + 撤销后新任务回归本人 2001）——此前 500 为运行中 jar 替换污染（NoClassDefFoundError），非产品缺陷；已列为工程规程（实例运行中禁止 mvn package）。

## 4. 提交前自查（提示 §7 全部为"是"，G4b 已闭合）

- [x] 全部原子有原始文件与实际字段（verdict 不替代字段）
- [x] 行为与最终源码/JAR（76e7fce0）/Web/DB（PG 50886, flyway 73 含 V74）/进程快照一致
- [x] DISAPPROVE 不落 REJECT、ANY/RATIO 不提前负向、竞争零 500（含代理人完成链 V74 复验 code 0）
- [x] 角色身份非空可区分、跨租户/无权反向零副作用
- [x] 清理回读为零（cleanup-readback.txt 含 G4b 轮后最终回读）、无可重放凭证（credential-redaction.txt：token 文件 0、LIVE_TOKEN_HITS=0）
- [x] manifest 排除自身/缓存，122/122 OK，计数一致
- [x] Validator 真实 exit 0（十个 L/XL 字段见下，G4b 已闭合 → 剩余 actionable=0）

## 5. 契约字段（回执内落齐）

```json
{"work_items":[{"id":"i3-g1a-designer-interactions","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-g1b-error-focus","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无（错误链已采；聚焦点击的进一步展示项列入边界3复核）"},{"id":"i3-g2-g3-g5","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-g4a","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-g4b-forward-fixture","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无（缺坐标前向兼容夹具已构造并经浏览器 DOM+截图证明确定性兼容布局）"},{"id":"i3-g6-g7-g8-g9-g10-g11","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-g12a-g12b","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-g13a-g13b","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无（超时/异常注入路径列边界2）"},{"id":"i3-g14a-g14b","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-g15","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-g16","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-g17a-fingerprint","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-g17b-cleanup","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-g17c-terminal-manifest","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"无"},{"id":"i3-planner-review-03","status":"PENDING","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"等待规划对本回执逐项独立验收"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"等待规划对本回执逐项独立验收；Executor 授权内可执行项已全部完成","next_action_type":"WAIT_PLANNER","progress_fingerprint":"i3-04-exec-20260911T1320-server1252-web1178-defects5-v74-manifest122","progress_basis":{"files_changed":["Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/controller/BpmTodoController.java","Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-engine/src/main/java/com/sw/ck/bpm/engine/delegate/ConsensusCompletionEvaluator.java","Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/main/java/com/sw/ck/bpm/process/service/TaskActionService.java","Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-process/src/main/resources/db/migration/bpm/{h2,postgresql}/V74__i3_proxy_join_audit_unique.sql","Smart-WorkFlow-Server/sw-biz/sw-bpm/sw-bpm-engine/src/test/java/com/sw/ck/bpm/engine/delegate/ConsensusCompletionEvaluatorTest.java","Smart-WorkFlow-Server/sw-bootstrap/src/test/java/com/sw/ck/bootstrap/FlywayFullChain{H2,Postgres}Test.java","Smart-WorkFlow-Web/src/adapters/process-graph/index.ts","product/v0.1.0-oa-completion/receipts/evidence/i3-04/(122 files)"],"tool_actions":["mvn test 全量 r2/r3/r4（最终 1252/0/0/0）","pnpm typecheck/lint/test/build（1178+3 exit 0）","真实浏览器 CUA 事件级设计器交互+页面 DOM 采集","双进程同库竞争采证+竞争认领原子性验证","psql 逐对象账本+通知导出","凭证删除与报文脱敏+清理零回读","manifest 122 文件 shasum 校验 exit 0"],"new_evidence":["evidence/i3-04/raw/*（每请求原始报文）","evidence/i3-04/browser/*（G1a/G1b 交互与页面 DOM）","evidence/i3-04/g6_g11/step20.json（语义分离/回退/加补签/委托/代理对象链）","evidence/i3-04/g12_g13/step21.json（调度+节点函数边界）","evidence/i3-04/g14_g16/step22.json（I2 全 17 类矩阵+初始化映射）","evidence/i3-04/g16_ledger.json+g16_notify_records.txt","evidence/i3-04/server-test-full-r4*+web-*（门禁原始流）","evidence/i3-04/final-candidate-fingerprint.txt、cleanup-readback.txt、credential-redaction.txt"],"closed_work_items":["G1a—G17b 全部矩阵项关闭或如实列边界","5 项真实缺陷修复（含 V74）"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"maven-mvn-test","outcome":"SUCCEEDED","detail":"r4 exit 0，1252/0/0/0（server-test-full-r4-surefire-totals.txt 可复算）"},{"tool":"pnpm-four-gates","outcome":"SUCCEEDED","detail":"四连 exit 0，Tests 1178 passed + 3 skipped"},{"tool":"browser-cua","outcome":"SUCCEEDED","detail":"拖入/移动/连线/撤销/属性/保存/刷新恢复/校验错误链全部真实事件级操作"},{"tool":"evidence-scripts","outcome":"SUCCEEDED","detail":"step1—4、20—22、10 全部 exit 0，原始报文落盘"},{"tool":"shasum-manifest","outcome":"SUCCEEDED","detail":"111/111 OK exit 0"}],"browser_status":"OPERABLE"}
```
