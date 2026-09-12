# Stage I3 执行回执 07 — v0.1.0-oa-completion（人工审批与自研流程设计器）

- 执行角色：executor（Owner 授权，system.md 会话角色门禁）
- 执行入口：`planning-execution-prompt-stage-i3-v0.1.0-oa-completion-04.md`（三级继续收敛提示 04，唯一当前入口；依据审查 05）
- 本回执为第 7 轮：按提示 04 §3 固定顺序执行（R0 → R1 → R5/R7 → 环境重建与 R3/R6/R8/R9 补证 → R10）
- 证据根：`product/v0.1.0-oa-completion/receipts/evidence/i3-07/`（R0/R1/R3/R5/R6/R7/R8/R9/R10 独立目录 + scripts）
- 唯一候选：**snapshotId=i3-07-frozen-f**，运行时 jar sha256=74926960ff615681f3064e4061e3622480e8e56fdcfce94caf2d0f12738c73ad，实例 A=PID 34124@8081、B=PID 31072@8082 同 JAR（`evidence/i3-07/R1/candidate.json`）
- 采证主机说明：本轮在换机后 Windows 主机执行（`memory/handoff.md` §8 交接基线）；frozen-e 冻结工件（jar 90d8bb89…）本机不可复原，源码以 Server `develop=c18d074` / Web `develop=192e0647` 提交版为终树

## 0. 本轮采证暴露并修复的真实缺陷（候选修复链第 5 项，commit c18d074）

| # | 缺陷（R6 采证发现） | 修复 |
|---|---|---|
| 5 | 升级提醒通知在 `markClaimed` 认领事务提交后、无活动事务时发布 `BpmNotifyEvent`，`@TransactionalEventListener(AFTER_COMMIT)`（默认 fallbackExecution=false）静默丢弃事件 → 办理时限提醒通知从未落库。这正是审查 05 §3.5「Z6-03 回读 notify=[]」的直接根因，而非采证口径问题 | `TaskDeadlineScheduler`：升级催办与候选任务提醒两处将 `notifyDeadline+结算` 包进 `TransactionTemplate` 事务内发布；先原子认领后通知的恰一次语义不变（1 file changed, 22+/4-） |

修复后按回执 06 先例完成门禁复跑与重冻结（frozen-e→f），be0585e0 首采的 R3/R6 已全部作废重采（`R1/runtime-rebuild.txt` 两次重建留痕）。

## 1. R0 — 凭证清零包（PASS，`R0/`）

- 口径：宽于审查 05——JWT（eyJ 三段式，无长度上限假设）、Bearer 前缀、`accessToken/access_token/refreshToken/refresh_token` 键后直接值（**无长度下限**）；占位语法 `\[REDACTED[^\]]*\]` 全变体识别（`R0/scan-command.txt`）
- 复核审查 05 §3.1 所称 i3-03=119 / i3-04=154：按 accessToken 键取值全部出现形式去重仅两类且均为占位符——`[REDACTED]` 273 处、`[REDACTED_JWT]` 123 处（i3-03/04/05 合计，`R0/placeholder-census.txt` 86 文件）；`eyJ` 命中 3 处均在密文 base64 块内部非 JWT 结构
- 终态：i3-03—i3-07 五目录 `files_with_hits=0 jwt=0 bearer=0 token_key=0`（`R0/hit-count-after.txt`，脚本 `R0/r0-scan.js`）；无正文 → 无需脱敏、无需重建旧目录 manifest；反向断言：无备份/无压缩包/无 /tmp 副本

## 2. R1 — 最终候选封装（PASS，`R1/`）

- 唯一 `candidate.json` 收口 **i3-07-frozen-f**；frozen-a/b/c/d/e 全部列为被取代历史，frozen-a 陈旧别名（i3-06/Z1/candidate.json）作废，不存在可被当作当前入口的旧候选
- PID 演进链完整收口（`R1/instance-restart-log.md`）：旧机 96764/96797 → 5767/5807（ENOSPC 同 JAR 重启）→ 采证期 23722/23764 → frozen-e 冻结 26398/26448 → Z6 相位对齐重启 B=28816（终值，同 JAR，`Z6/instance-b-scheduler.log` 全程为证）；换机后 3784/33092（be0585e0，重建首采）→ **34124/31072（74926960，终值）**。`dual-scan-result.json` _snapshot 中 B=26448 为陈旧值，已在本包显式作废
- 门禁 command 文件齐备：`R1/server-full-test.command.txt`、`R1/server-package.command.txt`、`R1/web-{typecheck,lint,test,build}.command.txt`
- 门禁结果（`R1/gates/`）：Web 四门 exit=0；Server 1261 口径中恰 6 例失败，全部为 `JavaSubprocessSandboxTest`（IoT Java 沙箱子进程，Windows/JDK21 环境差异）——**不含修复的基线 f7101c8 同机复跑同 6/7 失败**（`gates/sandbox-env-failure-without-fix-proof.stdout`），与本次修复及 I3 范围无关；sw-bpm-process 186/0/0/0（含 G13a 契约）、sw-bootstrap 43/0/0/0（含 FlywayFullChain H2 终点 V75）、sw-bpm-engine/sw-biz-form/sw-biz-system 全过

## 3. R3 — RETURN 补证（PASS，`R3/r3-actions.json`，绑定 74926960）

- G7 主表单：提交后 GET 主表单 **before**（amount=100, reason=r3-return-*-initial, version=0, sha256 记录）→ 发起人 PUT（`data` 整量 + 乐观锁 version）→ **after**（amount=200, reason=r3-return-*-revised, version=1），`field_diff` 逐字段 before/after/unchanged
- 允许修改范围：属主（发起人 admin）对自有记录的定义字段内修改 code 0；非属主（user2）修改同记录被拒（code 1507）——范围=自有记录 × 定义字段
- 实际修改结果：PUT 0 + after 回读 diff 一致
- 二轮路径：RETURN code 0、round_no=1、旧任务 act_ru_task=0 关闭、node_1 二轮重走（trace 中 node_1 两次出现）、二轮办结 APPROVED
- 历史回看对象链：实例详情（/workflow/instances/{pid}）+ 已办列表（processed）+ 二轮任务详情（/workflow/tasks/{taskId}）逐项入包
- 负向：非法目标/缺失目标语义沿用锁定引用（审查 05 §2 G6 链），本包零第二副作用（退回后负向动作行数不变）

## 4. R5 — 生命周期汇总（PASS，`R5/assertions.json`）

- 仅从已锁定 `i3-06/Z5/z5-actions.json` 机器派生（`R5/derive.js`），未重跑任何行为：13 组案例、action 必需字段空 0、userTask 轨迹 actor 空 0、notify 必需字段空 0、重复动作 id 0、重复通知行 0、负向期望 9 项全部非 0 非 500、终态 10 例、PENDING 残留 0、第二副作用 0 → `pass=true`

## 5. R6 — 调度收口（PASS，`R6/r6-actions.json`，绑定 74926960）

- 旧失败项作废：`final_summary.supersedes` 明确作废 `z6_dual_scanner.error`（早期相位未对齐尝试产物）；唯一终态以本摘要 + 锁定 `i3-06/Z6/dual-scan-result.json`（40/40 恰一完成、14 个 deadline 双 PID 同窗、零双完成）为准
- **真实提醒通知行**：无自动策略 deadline 到期 → DONE/ESCALATED，`sw_notify_message` 实读「办理时限提醒｜您的一条审批任务临近/已超时限」recipient=2001（修复-5 后首次真实落库）；实例保持 RUNNING、零审批动作行
- **人工催办**：`sw_bpm_urge_record` 2 行（ACCEPTED + 10 分钟冷却 COOLDOWN record），催办通知行「催办提醒」recipient=2001 真实落库
- PID 链：frozen-e candidate（26398/26448）→ 双扫描终态（26398/28816，B 重启原因=相位对齐，同 JAR 90d8bb89）→ 换机终态（34124/31072，同 JAR 74926960，重启原因=换机恢复+已授权修复）逐段串接，每段有日志/提交为证

## 6. R7 — handleResult 反向边界（PASS，`R7/`，扫描在 c18d074 上重跑）

- 注册表实读（运行库 JDBC）：`registry_rows` 恰 3 条内建行——9001 func_tenant_admins（RESOLVE_PARTICIPANTS）、9002 func_audit_trail、9003 func_result_echo（HANDLE_RESULT），enabled=1/deleted=0（`R7/registry-rows.txt`）
- 脚本引擎扫描：bpm 主源码 Groovy/ScriptEngineManager/Nashorn/javax.script **命中 0**（原始 command/output/exit 存档，exit=1 为 grep 无命中）
- 上传端点扫描：bpm 模块 `MultipartFile|upload` 5 行命中全部位于 `WorkflowAttachmentController`（附件上传），函数源码上传端点 **0**
- 合法 `audit_note` 写回保留：源码级（ResultEchoFunction/AuditTrailResultFunction 均写 `audit_note`）+ 行为级锁定引用（i3-06/Z7，不重跑）
- G13a 已锁定不重跑：以哈希指针引用 `i3-06/Z7/g13a-contract-test-rerun.txt`（同口径计入本轮 bpm-process 186 例中的 NodeFunctionNegativeContractTest）

## 7. R8 — 意见表单（PASS 全部断言，`R8/r8-actions.json`，绑定 74926960）

- 能力目录：`GET /form/def/field-types` 服务端权威响应 22 类 = 17 enabled + 5 disabled（EMAIL/PHONE/URL/RATE/SLIDER）
- 禁用组件四层契约拒绝（**真实存在的含禁用组件表单**，非“表单不存在”冒充）：config 层拒绝（def 存在且 config_code≠0）、图 validate 层 2417「意见表单组件不可用」、publish 层拒绝、提交层 ApprovalOpinionValidator 同目录口径（missing_required 拒绝同路径）
- 五类轮次全部齐备：普通（初始化 task detail + 缺 required 拒绝 + 合法提交 + **主表单 before/after 非空且逐字段 diff 零变化** + 快照 + processed 历史回显）、会签（双票各自快照 + 历史回显双行）、加签（表态快照 ≥2）、**补签（SUPPLEMENT_SIGN 表态行非空：sign_record.detail 含完整 opinionData + action 行 opinion_data）**、退回（code 0 + RETURN|1 + 二轮办结 + 快照保留）
- 版本变化前后 snapshot hash：五类快照 sha256 在发布新版本前后逐项一致（`version_hash_stability.unchanged=true`）

## 8. R9 — 权限与总账（PASS，`R9/r9-actions.json`，绑定 74926960）

- 身份：admin（superAdmin, userId/tenantId 非空）、user2、user5（无角色）、tenant1user（租户 1）菜单通道计数入表
- 职责矩阵 11 项（超出提示要求的 11 个方向）：设计与发布（def create/graph/publish 正向 0；user5 负向 403）、办理（0/403）、加签（0/403）、补签（0/403）、转办（0/403）、委托（0/403）、代理（0，同 Z5-08 口径 agent=2002；403）、撤回（发起人 0；非发起人 403）、沟通（0/403）、废弃（0/403）、时限管理（节点 deadline 图保存 + 催办正向 0；非职责负向 403/2400）——每项含**页面/深链**（web 路由，如 /workflow/defs/{defId}/design、/workflow/task/{taskId}）+ API 正向 + 非职责负向 + request_marker 关联实际对象（task/instance/sign_record/urge_record/action rows）
- 跨租户：tenant1user 实例/待办对租户 0 零泄漏；HTTP 500=0；重复结果 0（ledger 汇总 `R9.LOG.ledger`）

## 9. R10 — 终态封装（PASS，`R10/`）

- `R10/manifest.json`：i3-07 全量 70 文件 sha256（排除 manifest 自身/`__pycache__`/`*.pyc`），`R10/manifest-verify.txt` 复算 bad=0
- `R10/terminal-payload.json` + `sh .codex/governance/validate-terminal.sh` 实跑（Windows 经 `validate-terminal.ps1` 同契约实现）：exit=0（`R10/validator-*`）；payload sha256 与本回执字段同源
- 环境清理：换机会话结束前停实例/PG/redis/vite，回执提交后由清理步骤执行（`R10/cleanup-attest.txt`）

## 10. 与三级提示 04 的偏差说明

- 方向级偏差：无。执行过程说明：R6 补证暴露第 5 项真实产品缺陷（升级提醒通知静默丢弃），按提示 §4 与回执 06 §12 先例修复（commit c18d074）并复跑门禁重冻结（frozen-e→f）；重冻结导致换机重建 jar（be0585e0）上的 R3/R6 首采作废重采，R5 派生与锁定行为不受影响。R7 源码扫描在修复提交后重跑。IoT 沙箱 6 例环境性失败按 R1 提交门口径留证申报（非 I3 范围、与修复无关、已用基线复跑证明）。
- 换机影响：frozen-e 冻结工件不可复原，按交接基线以源码提交版重建并全程留痕（R1/runtime-rebuild.txt）；R0 宽口径扫描覆盖旧目录正文标准为 0。

## 11. 自验结论

提示 04 §2 剩余矩阵 R0—R9 全部 PASS 后生成 R10；正向/反向断言与实际字段逐项一致；合法功能状态 `VERIFYING`，本回执提交状态 `EXECUTION_SUBMITTED`。未写 PASSED/COMPLETED、未核销 P 编号、未晋级基线、未移动方向。等待规划按十八项标准与提示 04 逐包独立验收。
