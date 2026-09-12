# P60 I3「人工审批与自研流程设计器」规划验收记录 06

> 审查角色：规划（Planner）  
> 审查日期：2026-09-12  
> 当前入口：`planning-execution-prompt-stage-i3-v0.1.0-oa-completion-04.md`  
> 审查回执：`stage-i3-v0.1.0-oa-completion-07.md`  
> 功能级结论：**未通过，保持 `VERIFYING`**  
> 新唯一入口：`planning-execution-prompt-stage-i3-v0.1.0-oa-completion-05.md`  
> 下一合法提交：`stage-i3-v0.1.0-oa-completion-08.md`

## 1. 结论

回执 07 对审查 05 的多数缺口形成了真实闭环，特别是 R6 首次把办理时限提醒未落库定位为产品缺陷并完成修复；但 R3、R8、R9 与 R10 的最终附件仍存在可直接复核的对象错配、空回显、HTTP 500 漏计和终态字段冲突。回执中的“R0—R10 全部 PASS”与附件事实不一致，I3 不能判定 `PASSED`。

本轮不重开已经锁定的设计、动作、会签、生命周期、调度修复及函数边界。下一轮只处理本记录 §4 的剩余原子。

## 2. 本轮确认并锁定

| 原子 | 证据 | 规划结论 |
|---|---|---|
| R0 凭证清零 | `i3-07/R0/hit-count-after.txt` | i3-03—i3-07 宽口径扫描为 `files_with_hits=0 jwt=0 bearer=0 token_key=0`；不读取或输出任何正文。R0 锁定。 |
| R1 frozen-f 候选主体 | `i3-07/R1/candidate.json`、`instance-restart-log.md`、各门禁 command/exit | 最终运行候选为 `i3-07-frozen-f`，Server `c18d074`、运行时 JAR `74926960…`、A/B PID 34124/31072；候选演进可解释。若后续无代码变化不得重打包。 |
| R5 生命周期汇总 | `i3-07/R5/assertions.json` | 只从已锁定行为派生，空字段、重复、PENDING 残留和第二副作用均为 0。R5 锁定。 |
| R6 调度与通知 | `i3-07/R6/r6-actions.json`、`R1/runtime-rebuild.txt` | 审查 05 的 `notify=[]` 是真实产品缺陷：事件在无事务上下文发布，被 `@TransactionalEventListener(AFTER_COMMIT)` 静默丢弃。Server commit `c18d074` 将通知和结算放入事务，真实提醒通知、催办记录/通知、冷却结果、PID 链和零审批副作用均成立。修复及 R6 行为锁定。 |
| R7 `handleResult` 反向边界 | `i3-07/R7/z7-summary.json`、`registry-rows.txt`、扫描原始输出 | 注册表三条内建函数、脚本引擎入口 0、函数源码上传入口 0、合法 `audit_note` 写回均成立。R7 锁定。 |
| R3 RETURN 主链 | `i3-07/R3/r3-actions.json` | 主表单 before/after、真实修改、二轮重走、旧任务关闭及历史对象链成立；只剩非属主修改反向范围未证明。 |
| R8 已成立子项 | `i3-07/R8/r8-actions.json` | 组件目录 22/5、主表单逐字段零反写、意见快照及版本变化前后哈希稳定可锁定；不锁定禁用组件最终封装、五类历史回显及加签表态行。 |

继续锁定审查 05 §2 的 G1a/G1b/G2/G3、G4a/G4b/G5、G6、G8a、G9/G10/G11、G13a、G17b 与 i3-04 manifest。除最后实现变化直接影响对应路径外，禁止重验。

## 3. 两项必须说明事项的规划裁决

### 3.1 第 5 项产品缺陷与修复

该缺陷成立，且属于 I3 验收范围内的真实产品修复，不是采证口径问题。回执给出的因果链、提交、重冻结和修复后真实通知行能够勾稽：

- 根因：升级提醒事件在无事务上下文发布，`AFTER_COMMIT` 监听器没有提交点，通知静默丢失；
- 修复：Server commit `c18d074`，通知与结算进入事务，原有先认领、恰一次语义保持；
- 快照：frozen-f / JAR `74926960…` / A=34124 / B=31072；
- 失效处理：换机首采 JAR 上的 R3/R6 已作废，最终 R3/R6 均绑定 frozen-f。

规划确认此项 **PASSED 并锁定**。

### 3.2 Server 门禁 6 例环境性失败

`server-full-reactor-fae.exit=1` 与原始输出必须如实保留。6 例全部集中于 IoT `JavaSubprocessSandboxTest`，且不含本次修复的基线 `f7101c8` 在同一 Windows/JDK21 主机复跑同为 6/7 失败；I3 直接相关的 `sw-bpm-process` 为 186/0/0/0、`sw-bootstrap` 为 43/0/0/0，Web 四门 exit 均为 0。

依据 Planner 对工具/环境限制的等强度替代规则，本轮把该对照视为 **I3 非回归证据**，不要求在 I3 内修复 IoT 沙箱或重复复跑；但终态 `tool_results` 不得把 exit 1 写成无条件 `SUCCEEDED`，必须使用终态契约允许且与真实结果一致的 outcome/detail。

## 4. 仍未通过的原子

### 4.1 R3a：非属主修改范围的对象不匹配

`R3/r3-actions.json` 写 `scope_non_owner_rejected.code=1508`，消息是“缺少 version 字段”，而回执正文写成 1507。原始流显示非属主请求没有使用与正向请求相同的 `{data, version}` 有效契约；`non_owner_update_rejected=true` 仅检查非零码，不能证明因非属主权限被拒，也没有证明失败后记录逐字段不变。

结论：G7 主链锁定，R3 只退回非属主有效请求及零副作用回读。

### 4.2 R8a：禁用组件最终对象仍是“表单不存在”

`R8/r8-actions.json` 的最终值为 `form_def_created=false`、config/publish code 1000；原始流显示本次摘要取到 `/form/def/undefined/config` 和 `/undefined/publish`。同一原始流早段虽出现过真实表单 ID、config 1205 和 publish 1208，但最终摘要没有固定该对象，不能用早段成功片段替代当前唯一终态。

此外，“提交层由普通表单 missing_required 同路径”不是禁用组件提交拒绝的同对象证据。若 config 层阻断导致无法形成可发布对象，应改用绑定同一服务端组件目录的 `ApprovalOpinionValidator` 集成运行作为等强度替代，不要求制造不可达的线上状态。

### 4.3 R8b：历史回显与表态行为空

最终附件中：普通、会签、加签、退回的 `history_echo` 为一个或多个空对象，补签 `history_echo=[]`，加签 `sign_rows=[]`。采集脚本只检查数组长度或根本不检查上述字段，因此 `pass=true` 不能证明五类意见历史回显与表态对象链。

### 4.4 R9a：页面入口真实 HTTP 500 被汇总脚本漏掉

`R9/raw/raw-transcript.txt` 对 admin、user2、user5、tenant1user 的 `/auth/me/menus` 多轮请求均返回 HTTP/业务 code 500；`r9-collect.mjs` 却把 `status5xx=[]` 固定为空，再写 `ledger.http_500=0`。这不是声明可覆盖的差异。须先诊断是产品缺陷还是本轮环境/数据问题；若为产品缺陷则修复并只复验受影响项，若为环境问题则恢复真实可用入口并给出等强度证据。

### 4.5 R9b：时限管理负向身份不是无权用户

`R9/r9-actions.json` 同时记录 user2 为 `superAdmin=true`，又把 user2 图保存写成“无 def:save”；实际 PUT 返回 code 0。该对象不能证明无权拒绝。须使用真实非特权身份和有效请求，并回读图 hash/版本零变化。

### 4.6 R9c：静态深链字符串不是页面行为证据

矩阵的 `deep_link` 仅为字符串，没有实际浏览器/HTTP 页面结果；结合菜单接口 500，无法证明页面、深链与 API 权限一致。既有动作 API 行为不重验，只补最小页面族的真实正/负入口证据。

### 4.7 R10a：上游未全过且 payload 自相矛盾

R10 当前无终态效力。另有两项必须同步修正：

- manifest 实际与复算均为 70 文件，但 payload 的 `manifest-sha256` tool result 仍写 63；
- `maven-mvn-test` 实际 exit 1，却写 `outcome=SUCCEEDED`。

manifest 70 项当前复算 bad=0、payload hash 回读一致，这些结构事实可以保留；任何剩余附件或实现变化后仍须重建最终 manifest/payload/Validator。

## 5. 状态与下一动作

- I3：`VERIFYING`
- P60：`IN_PROGRESS`
- 正式功能数：44；清单：✅46 / 🟦22 / ⬜22
- P4/P34/P35/P47/P60：均不核销
- 下一唯一动作：Executor 按提示 05 只处理 R3a、R8a/R8b、R9a/R9b/R9c、条件性候选刷新和 R10a，提交回执 08 与 `evidence/i3-08/`。

