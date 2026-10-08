# P63 完成回执07——六项残余断言处置（G01a/G03a/G04b/G08a/G08b/G10b）

> 状态：执行自验（自验≠核销；核销与晋级权归 Planner）。**P63 保持 VERIFYING**；审查06 已核销 14/20、本轮处置剩余 6 项；完整标准 A02/A05/A07/A09 通过（4/10），未进入阶段三。
> 依据：审查06 `receipts/planning-review-completion-06.md` + 提示06 `receipts/planning-execution-prompt-p63-06.md`（本轮唯一执行入口）。
> 证据根：`receipts/evidence/acceptance-07/`——六个逐 ID 包（`G01a.md`/`G03a.md`/`G04b.md`/`G08a.md`/`G08b.md`/`G10b.md`，四要素）+ `browser/`（9 PNG 原件，同名 .md 封装断言）+ `raw/`（文本/数据原件；大日志本地保留、关键行 md 封装）。

## 0. 环境（活体验收）

- 库：`sw_p63_accept4`（新库；旧 `sw_p63_accept3` 上轮销毁，不恢复不重建——提示06 §1）。
- 后端：当前候选构件 classpath 启动，dev profile + PG 显式覆盖，`SW_DEBUG_AUTH_ENABLED=true`（启动关键行 `raw/live-env-original.md`）。
- 受控对端：`/tmp/p63-peer4.mjs` @127.0.0.1:9777（受理→原件 jsonl→HMAC-SHA256 回执）。
- 前端：vite dev @5173（代理 :8080）；浏览器 IAB headed 1280×720（窄屏段 375×812）；身份 admin。

## 1. G03a——同租配置授权 + 功能类型权威（PG 实证）

- 新增 `P63ConfigAuthorityTypePgTest`（3 测试，facade 直调 + MANDATORY 事务模板，无轮询等待；**服务端零产品代码改动**）：①无流程接入配置授权（`process_access_enabled=0`，同租同产品同功能）→ 冻结前 404「设备目标已失效」、零意图零外发；合法对照（=1）→ 冻结 PENDING（intent `2108006452945350658`）；②已发布物模型 + 未知 commandType（SCRIPT）→ 400「未知功能类型」、零意图零外发；③类型不匹配双向：ACTION 键按 PROPERTY → 404 `properties.factory_reset`；PROPERTY 键按 ACTION → 404 `actions.power_off`；零意图零外发。
- 原件：`evidence/acceptance-07/G03a.md` + `raw/g03a-config-authority-type-original.md` + surefire XML（**tests=3 failures=0**；MVN_EXIT=0，命令/cwd/时点见包）。
- 边界：接缝在候选中已存在（`resolveDeviceTargetByKey` 强制 PUBLISHED+processAccessEnabled=1；`validatePublishedFunction` 未知 400/键不在对应数组 404），本轮补实际运行证据；不另建参与人 ACL；latest/跨租指定用户/模型缺/撤销/N1—N5 沿审查06 已证不重做。
- 转录更正：acceptance-06 包内 latest 本人命中 ID 更正为 `2107856876663025666`（沿审查06 原行）。

## 2. G01a——直接人员/直接部门配置入口 + 同版本读回

- headed：APPROVAL 参与人策略 FIXED_USER → 选择审批人弹窗（人员页签搜索「系统管理员」→ 勾选 admin → 已选审批人(1)）→ `browser/g01a-approver-dialog-admin-selected.png`；DEPT_LEADER → 选择部门弹窗（部门树勾选「根部门」→ 已勾选）→ `browser/g01a-dept-dialog-root-checked.png`。
- 同版本读回（`raw/g08a-g01a-g04b-db-readback.md` §5/§6）：流程A n_appr `{"strategy":"FIXED_USER","value":["1"]}`（已发布冻结行）；流程B n_appr `{"strategy":"DEPT_LEADER","value":["1"]}`（草稿图，经设计器保存接缝写入后读回）——均为稳定 ID。
- 边界：TABLE 合同只要求表格/列（审查06 更正采纳，**不新增主字段双重必填**）；24 格/字段选择器/已发布全链不重跑。

## 3. G04b——新建动态并行节点默认 BLOCK

- headed：新建 DYNAMIC_PARALLEL 节点面板可见「空来源处置=阻断（BLOCK）/无效值处置=阻断（BLOCK）」→ `browser/g04b-dynamic-panel-default-block.png`。
- 持久化读回（流程B 草稿 n_dyn）：`{"source":{"type":"FORM_FIELD","value":"","scope":"MAIN"},"mode":"ALL","emptyStrategy":"BLOCK","invalidStrategy":"BLOCK"}`（`raw/…db-readback.md` §6）——新默认落盘值。
- 层级（诚实）：面板默认值为 headed 截图；持久化值经设计器同款保存接缝（PUT `/workflow/defs/{id}/graph`）写入并读回（业务组件 palette 点击在本构建不可交互：click 触发但无节点落入、无 JS 错误，合成拖拽亦不落），来源字段留空故未走 UI 保存路径；默认形状与 `buildDynamicParallelFormDraft` 缺省一致。
- 旧显式 `invalidStrategy=SKIP` 回显沿 acceptance-06 锁定原行不重测；并发/异常矩阵沿审查06 已证。

## 4. G08a——真实发布日期绑定→可见填报→记录/冻结预约时刻对应→任务→节点/办理人映射

- 真实发布绑定：表单 `form_muyvfpcw` v3 已发布 schema `field_plan_time type DATE format:"datetime"`（设计器日期格式开关真实拨动落盘）；流程A v2 冻结图 + IoT 绑定 `dueField=field_plan_time / Asia/Shanghai / device 91702 / power_off / RESERVATION / window 60s` + `iot_access_enabled=t`。
- 可见填报：发起页日期+时间两栏填 `2026-10-08 10:25:00` → `browser/g08a-submit-form-datetime-filled.png`；记录 `d087a7e1…` 值一致。
- 冻结对应：预约 `2108014686821277697` `due_at_utc=2026-10-08 02:25:00`（=表单值 +08 精确换算）、`due_local_text` 同值、record_id/实例勾稽（§4）。
- 任务→节点/办理人映射：实例 `02030ae0-…` 流转记录「人工审批/系统管理员/已完成 10:00:16.869→10:00:40.754」（`browser/g08a-instance-history-approver.png`），对应审批命令 `2108014684380192769` COMPLETED。
- 到点下发全链（真实调度，无空转）：10:25:07 入队 → 对端 200 受理（`requestId=peer-ccca07e1-555`）→ SENT → HMAC 回执 → 审计 `RECEIPT_APPLIED` → 命令 `2108020838149775362` **SUCCESS**；券/命令/审计/对端 jsonl/日志五方同 ID（`raw/g08a-dispatch-chain-db-readback.md`、`raw/g08a-peer4-received.jsonl`）。
- 成功链 requestId 引用更正（审查06 §3 指正）：引用=acceptance-06 `raw/g08a-backend-access-relevant-lines.md:14—17`（web-db1adca8/web-a5d21cae/web-5b1272cf/web-277c870d）；0b2a1d1b 链引用废弃。
- 层级（诚实）：对端 HTTP 200 受理 + HMAC 回执原文；命令终态以 DB 行/审计为准，**不称对端自动 APPLIED**。
- fail-closed 正路事实（同库）：首轮记录 `f5a20b98`（date-only 值）→ 登记 fail-closed「预约时间格式非法」→ 命令 FAILED + 实例 REJECTED。

## 5. G08b——375×812 完整信息真实触达

- `browser/g08b-narrow-history-approver-status.png`：横滚后流转记录——审批节点=人工审批、**审批人=系统管理员**、**审批状态=已完成** 两列同图完整可读（与上一轮 p63 用户 92… **可区分**）。
- `browser/g08b-narrow-command-status-success.png`：375 全宽命令抽屉——`power_off`/PROPERTY/**成功** 完整可读。
- `browser/g08b-narrow-command-result-readable.png`：结果列**换行完整可读** `{"source":"RECEIPT","requestId":"peer-ccca07e1-555","output":"P63 peer applied"}`，状态=成功同图可见，**无悬停依赖**；修正=`IotDeviceList.vue` 结果列去 `show-overflow-tooltip`（提交 35dd944，已推送读回）。
- 边界：未新增命令、未复跑成功链（取自 G08a 同一真实 SUCCESS 链）；不以窄屏 EXPIRED 实例冒称成功；用滚动/点击/最小展示修正，未用 hover 或后台 JSON 充数。

## 6. G10b——门禁原值与失败归属

### 6.1 真实失败与基点对照（区分既有/环境）
- 全量实值（本轮最终候选 dfa2580，`mvn -pl sw-bootstrap test`，Total 24:35）：**286 tests / 3 failures / 0 errors / 27 skipped / BUILD FAILURE**——不填 exit0、不称全绿。原件 `raw/bootstrap-full-run-original.md`。
- 三失败归属：①`Phase4PgStartWindowCrashTest.scheduledFlowWindowCrashRecoversToExactlyOnce:149`=**既有失败**（92238ad 基点同数同断言同失败 `expected: 1L / but was: 0L`，`raw/g10b-phase4-92238ad-comparison.md`；FLOW 恢复路径零引用本轮共享接缝）→ 移交 Planner 裁决（REG-P63-Phase4CrashTest）；②`P63ImmediateMqttBrokerPgTest.setUp:93`=**环境依赖**（外部受控 broker 18830 缺失；重建后隔离 2/0）；③`P63ReservationUnknownPgTest…:220`=**环境依赖**（noreceipt 对端 9778 缺失；重建后隔离 1/0）；隔离合计 **3/0 BUILD SUCCESS**。
- Clock/DeferredControlUtil 影响事实：本轮三处共享接缝（IotClockConfig 全局 Clock bean、DeferredControlUtil 过期守卫、ApprovalUserTaskTranslator 租户校验）均不在 FLOW 崩溃恢复路径；若坏在部署翻译期会挂 setUp/部署而非恢复计数。P62Compat 隔离 2/0 沿审查06 接受。

### 6.2 模块门禁与 Web 四门（最终候选实跑）
- Server dfa2580：iot **63/0/0/0**、engine **76/0/0/0**、process **266/0/0/0**、G03a 新类 **3/0**（MVN_EXIT=0；`raw/server-module-gates-original.md`）。
- Web 35dd944：typecheck exit=0、lint **0 errors/76 warnings** exit=0、vitest **1364 passed + 3 skipped**（151 文件 +1 skipped）、build ✓ **exit=0（3.22s）**（`raw/web-gates-final-original.md`）。

### 6.3 远端读回 / knowledge / 自身收尾
- 远端读回（2026-10-08 11:11:28）：Server develop = `dfa25801d8888870fe11039ff3e5046044b1f8be`（本地=远端）；Web develop = `35dd94439f103a2e92054a3efe6f0cd656b2f1cc`（本地=远端）；Workspace=回执07 提交（§7）。
- knowledge 逐入口原值：`knowledge/current-status.md` 顶部段=VERIFYING、14/20、剩余 6、A02/A05/A07/A09 通过、唯一入口=审查06/提示06、下一动作=Planner 复核回执07。
- 自身收尾原结果（`raw/cleanup-readback-original.md`）：后端 8080/对端 9777、9778/Vite 5173/broker 18830 全部按精确 PID 关闭、六端口 listeners=0、残留进程 0；`sw_p63_accept4` dropdb EXIT=0 且 `psql -lqt` sw_p63 计数 0；`/tmp/p63*` 无匹配；92238ad worktree 已移除（`worktree list` 仅主树）；**~/.m2 先被基点安装污染、已重装当前候选恢复（REINSTALL_EXIT=0，11:09:11）**；IAB 单标签保留（dev server 已停）。

## 7. 转录更正登记

| 项 | 更正 |
|---|---|
| 回执06 G03a | acceptance-06 包内 latest 本人命中旧 ID → 实际 `2107856876663025666` |
| 回执06 G04b | `disapproveRetryPresent=true/value=false` 为实际输出（present=false 系转录错误），据原行更正，不重测 |
| 回执06 G08a | 成功链 requestId 索引错配 → 更正为 acceptance-06 access 封装:14—17（web-db1adca8/web-a5d21cae/web-5b1272cf/web-277c870d） |
| 回执06 G10b | bootstrap 284/2/0/27 BUILD FAILURE 不得称 exit0/全绿 → 本轮最终候选全量 286/3/0/27，三失败逐项归因（§6.1） |

## 8. 对象登记（旧→新）

- 旧库 `sw_p63_accept3`（上轮销毁）→ 本轮 `sw_p63_accept4`（回执完成即销毁，关键行已固化 raw/）：form_muyvfpcw（v1—v3；物理表 sw_form_kg0xpwwby4）；流程A `2108011355566628865`（v1/v2 PUBLISHED+IoT 绑定+access）；流程B `2108014791905370113`（DRAFT：DEPT_LEADER["1"]+DYNAMIC_PARALLEL 默认 BLOCK）；记录 d087a7e1（f5a20b98=旧值 fail-closed 对照）；实例 `02030ae0-…`（APPROVED）、`2e925194-…`（REJECTED）；预约 `2108014686821277697`（DISPATCHED）；命令 `2108020838149775362`（**SUCCESS**）、`2108013376705257474`（FAILED=fail-closed 对照）。
- 设备/产品：P63A7PROD/p63-a7-device(91702)；G03a 种子 91680/91681/91682/91683。

## 9. 层级与边界总表

- 浏览器：headed IAB（formal=真实登录链 admin；窄屏 375×812 全宽抽屉+横滚）；PNG 原件+同名 .md 断言封装。
- 测试层级：PG 隔离测试（G03a 3/0、bootstrap 全量/隔离复跑）；活体链 headed（G08a）；不做产品代码扩展、不改合同/治理、不晋级计数、不重建旧库、不擅停用户服务。
- 未豁免：全量 BUILD FAILURE 如实保留并逐项归因；既有失败（Phase4）不自行豁免，登记 REG-P63-Phase4CrashTest 移交裁决。
- 不空转：本轮全部验证为受控时钟/真实有限触发/原生有界结果（UI 到点=自然时钟真实到达；一次易用等待均为有界等待接口），无 sleep/延迟轮询。

## 10. 沉淀登记（供后续轮引用）

- 业务组件（人员/部门选择）在本构建 palette 点击不可交互（click 触发无节点落入）→ 设计器保存以同款 API 接缝补足并如实分层。
- 设备动作端点 body 需 `{"action":{…}}` 包裹（采集更正，沿 acceptance-06）。
- 视口相关 ref（`viewportWidth`）仅 onMounted 取值 → 窄屏需整页重载再开抽屉。
- el-table 横滚在内部 `.el-scrollbar__wrap`；抽屉截图须避开展开动画。
