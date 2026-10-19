# 0.1.9 同版本覆盖回执：BF20261019-04 修复发布与 UAT 端到端复验通过

- 日期：2026-10-19 / 20（跨零点）
- 授权：Owner 2026-10-19 明确指示「0.1.9版本号覆盖」（覆盖范围＝本批次最终修复提交，与 0.1.7 两次同版本覆盖同口径）
- 承接：`receipts/release-019-01.md`（0.1.9 首次发布）、`receipts/bf20261019-script-worker-02.md`（BF20261019-04 定位与修复）
- 阶段：总 7 阶段（§3.0）＝1—5 完成、6 发布后同步完成（本文回执）、7 结束待规划确认

## 1. 代码与覆盖发布事实

| 项 | 事实 |
|---|---|
| 修复提交 | `9aaf726`（BF20261019-04 预热预算独立配置）＋`6a09773`（worker 就绪行报出生效预热预算）→ develop `8f6020e`/`6a09773` |
| main | `9c2d49b`（合并修复）→ **`a92f7f4`**（合并就绪行预算诊断） |
| CI | run `39281440899`（`9c2d49b`）attempt1 **failure**＝既有 `P63ReservationBoundaryPgTest.concurrentCancelVsClaimHasExactlyOneWinner:487`（264 中 1 失败，与 0.1.8/首次 0.1.9 同族）；attempt2 **startup_failure**——GitHub Actions 当时处于降级事件（2026-10-19T15:49Z「Degraded availability for GitHub Actions, GitHub Pages and Webhooks」，恢复中），该 run 无法重试 → 以新提交触发 run **`39286167855` success**（`a92f7f4`） |
| 制品 | `bootstrap.jar` **218,048,244 B sha256 `9e4b5629a1c6fea10fbaf708e9b4e0e7adcd4348ba7bf484135039328086da1b`**，`build.version=0.1.9` |
| tag 覆盖 | `0.1.9` 由 `96ab6d0`（tag 对象 `e7328fb8…`）**force-with-lease** 重指 `a92f7f4`（新 tag 对象 `aec94e4e…`），远端回读一致 |
| Release | `CH-aPaaS Server 0.1.9` 发布说明追加覆盖记录（保留原发布事实）；版本化资产 `bootstrap-0.1.9.jar` 上传进行中（218 MB 上传多次 408 超时，同次 CI 产物可在 `build-a92f7f4…` Release 取得） |
| Web | 未变化：`0.1.9` tag `3c43a3c`、Release 与 `sw-web-dist-0.1.9.zip` 保持不动（本轮为后端修复） |

## 2. UAT 部署（覆盖轮）

| 步骤 | 事实 |
|---|---|
| 备份 | `bootstrap.jar.bak-20261020_0054-0.1.9-first`（218,047,647 B＝首次 0.1.9 制品） |
| 换包 | 上传并核验 sha256＝`9e4b5629…`（与 CI 制品一致），218,048,244 B |
| 配置 | `server.env` 追加 `SW_BPM_SCRIPT_WORKER_STARTUP_TIMEOUT_MS=120000`、`SW_BPM_SCRIPT_WARMUP_TIMEOUT_MS=100000`（慢宿主预热预算；应用进程环境已核实生效） |
| 重启 | 00:53:37 停服替换启动 → `Started StarterApplication in 168.809 seconds`（00:56:28）；健康 `{"status":"UP"}`；启动段 ERROR **0** |
| worker 拉起 | `P64 判断 worker 启动: launch: source=fat-jar, mainClass=…PropertiesLauncher`（00:57:52）→ `P64 判断 worker 就绪: pid=2412954 maxHeapBytes=518979584 warmUpTimeoutMs=100000`（00:58:26）——**冷启动约 34 s（JVM＋GraalJS 预热），预算 100 s 生效**；`maxHeapBytes` 仍为 `_JAVA_OPTIONS` 覆盖值（既有观测，与本修复无关） |

## 3. 端到端复验（真实行为链，实例 20261020-014）

- 提交：李强 91103（`demo_a_br1_1`）于 00:57:43 提交，参与部门＝**分公司1（91002）＋部门1（91005）**；实例 `2112226729370644482`／`36636e4f-cbde-11f1-aa7c-00163e0d142f`；FLOW_START 00:58:33 COMPLETED（含 worker 冷启动）。
- **触发器**：`tg_supervisors` PROCESS_START **MATCHED**，`resultType=BOOLEAN`、`resultValue=true`、`matchedBranchId=b_ok`、`durationMs=1792`，快照 `{"var_drill_depts":["91002","91005"]}`——脚本读取表单部门→逐部门 `#获取分管领导`→写 `deptSupervisors` 全链在 UAT 执行成功（首次 0.1.9 同实例形态为 FAILED）。
- **node_1（动态并行，表单部门解析）**：两分支分别派给 **李强 91103**（分公司1 负责人）与 **赵磊 91109**（部门1 负责人），两票均 `ACCEPTED→COMPLETED`。
- **node_2（分管领导审批，脚本解析）**：受理人＝**张伟 91101** 与 **陈静 91105**——即 91002→上级总公司负责人、91005→上级分公司2 负责人，**节点配置零写死**（v4 的 `DEPT_LEADER ["91001"]` 已由 `EXPRESSION variables.deptSupervisors` 取代），两票 `ACCEPTED→COMPLETED`。
- **node_3（总公司科技部会签）**：王芳 91102 `ACCEPTED→COMPLETED`。
- **审批意见表单**（`form_mvf2qnmn` v2，5 行全部 SUBMITTED）：node_1 李强 `{"field_1":"1"}`（备注隐藏未落值）／node_1 赵磊 `{"field_1":"2","field_2":"部门侧建议：补充断电切换时长说明"}`／node_2 张伟 `{"field_1":"1"}`／node_2 陈静 `{"field_1":"2","field_2":"分管侧意见：建议补充回退演练步骤"}`／node_3 王芳 `{"field_1":"1"}`——选 2 时备注联动必填并入库的语义正确。
- **终态**：实例 **APPROVED**；`node_4` 抄送 张伟 91101 **deliveryStatus=SUCCESS**（00:59:15）。
- 登录口径：5 个演示账号均经服务端挑战（验证码人工识读）＋RSA-OAEP 登录，审批动作由各用户自己的会话发起；无旁路。

## 4. 结论与残留

- **业务达标口径已在 UAT 达成**：审批参与人完全由表单所选部门经脚本动态解析（换部门不需要新流程版本），审批意见表单按显隐语义落库，全链 APPROVED 并抄送送达。
- 残留事实记录：实例 `20261019-013`（首次 0.1.9 触发器预热失败 HALT，RUNNING）与 `20261019-009`（更早 v2 配置卡单）保留；UAT 运行包为覆盖轮制品，回滚可用 `bootstrap.jar.bak-20261020_0054-0.1.9-first`。
- 未落地项：Release 版本化资产 `bootstrap-0.1.9.jar` 上传重试中（同次 CI 产物已可由 `build-a92f7f4…` Release 取得，sha256 与 UAT 运行包一致）。
