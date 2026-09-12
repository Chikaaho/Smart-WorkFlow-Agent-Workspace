# Stage I3 执行回执 08 — v0.1.0-oa-completion（人工审批与自研流程设计器）

- 执行角色：executor（Owner 授权，system.md 会话角色门禁）
- 执行入口：`planning-execution-prompt-stage-i3-v0.1.0-oa-completion-05.md`（三级继续收敛提示 05，唯一当前入口；依据验收 06）
- 证据根：`product/v0.1.0-oa-completion/receipts/evidence/i3-08/`
- 候选：**无代码变化，i3-07-frozen-f 继续有效**（Server develop=c18d074、运行时 jar 74926960…、不重打包）；本会话实例重启 A=PID 21936@8081、B=PID 31072@8082 同 JAR

## 1. 逐原子结果（提示 05 §3 顺序）

### R3a — 非属主有效负向（PASS，`i3-08/r08-r09-api.json` r3a 段 + `raw/raw-transcript.txt`）

- 身份：user5（id=2004，`/auth/me` 实测 superAdmin=false、无角色），属主=admin 的新建记录（唯一 formKey i3ev_r3a_*，对象身份入包）
- 请求：与属主正向**完全相同**的 `{data:{amount,reason}, version:0}` 有效契约
- 实际结果：HTTP 403「无权限」——非 1508（缺 version）、非 1507（记录不存在）、非版本冲突
- 零副作用回读：amount/reason/version 逐字段不变，记录 sha256 前后一致；对照组：属主同契约同记录 PUT code 0（version 0→1），证明请求结构本身有效
- 附带修正说明：i3-07 R3 的非属主请求因漏传 version 被 1508 拒绝，属采证脚本缺陷；本轮以有效契约重取

### R8a — 禁用组件对象固定（PASS，`r08-r09-api.json` r8a 段 + `R8a/`）

- 唯一 formKey i3ev_r8a_*，POST /form/def 返回真实 fid 并以 GET /form/def/{fid} 回读存在（form_def_readback_exists=true），**无任何 /undefined/ 路径**（原始流可复核）
- config 层：code **1205**「字段类型暂不允许发布: EMAIL」（非 1000/表单不存在）
- 图 validate 层：**2417** 组件不可用错误命中（`validate.disabled_2417` 非空）
- publish 层：code **1208** 拒绝（config 1205 阻断后 definition 不可持久化，publish 以非 0 拒绝，对象身份同一 fid）
- 提交层（规划批准的等强度替代）：`ApprovalOpinionValidatorDisabledTypeIntegrationTest` 集成运行（`R8a/validator-integration-run.{stdout,stderr,exit}`，**exit=0，2/0/0/0**）——同一 disabled 类型 EMAIL 输入提交层被拒 2307（APPROVAL_OPINION_INVALID），enabled 类型 TEXT 对照通过；测试源码入包 `R8a/ApprovalOpinionValidatorDisabledTypeIntegrationTest.java`

### R8b — 五类历史回显与表态行（PASS，`r08-r09-api.json` r8b_* 段）

- 新建五类对象（唯一 key，替代映射：i3-07 对象 id → 本轮 id 均在 raw 流与 r08-r09-api.json 中登记）
- 权威回显端点：发起人实例详情 `GET /workflow/my/instances/{id}` 的 `history[]`（服务端填充 opinionData/opinionFormId/opinionFormVersion）
- 普通/会签/加签/补签/退回的 history_echo 均为**非空对象数组**且 opinionData 非空（`r8b_echo_checks` 五项全 true）：普通与退回含完整 comment2/level；会签两票分列；退回含 RETURN 轮次前后两轮意见
- 加签表态行：`sw_bpm_sign_record` 实读非空（ADD_SIGN DONE + detail 含 opinionData）；补签表态行：SUPPLEMENT_SIGN DONE + detail 含完整 opinionData（`r8b_supplement.supplement_sign_row` 非空）
- 主表单继续零反写（plain 段 before/after amount/version 不变）
- 附带修正说明：i3-07 的空回显系采证脚本读错端点（processed 列表项不含 opinionData、已完成任务详情 404）；本轮改用 my-instance detail 历史端点逐对象回读

### R9a — 菜单入口 500 诊断（PASS，`r08-r09-api.json` r9a 段）

- 诊断：i3-07 采证脚本调用 `/api/auth/me/menus`；服务端日志实锤 `NoResourceFoundException: No static resource auth/me/menus`（GlobalExceptionHandler 兜底 500）。真实端点为 `GET /api/auth/menus`（AuthMeController `@RequestMapping({"/system/auth","/auth"})` + `@GetMapping("/menus")`）
- **定性：采证脚本路径错误（采集口径），非产品缺陷；无代码变化，frozen-f 继续有效，未重打包**（符合提示 §4）
- 修复后回读：admin/user2 → HTTP 200 code=0 menus count=9（superAdmin=true）；user5 → 200 count=0（superAdmin=false）；原始 HTTP 行入 raw 流；本轮全部采证流 HTTP/业务 500 计数=0（逐次记录于 raw-transcript.txt，非硬编码）

### R9b — 真实无权身份图保存负向（PASS，`r08-r09-api.json` r9b 段）

- 正向：admin 对含 deadline 节点的图 PUT code 0 并发布（对象：唯一 def id 入包）
- 负向：user5（superAdmin=false）以**相同请求结构** PUT 同一定义 → HTTP 403「无权限」
- 零变化回读：拒绝前后定义详情 sha256 与 version 逐项一致（`graph_before`/`graph_after_rejected`/`unchanged=true`）

### R9c — 真实页面族（PASS，`R9c/`）

- 真实浏览器（ZCode IAB，真实登录会话 + vite dev /api→8081 代理）：7 张截图 + URL + DOM 快照（`R9c/r9c-summary.json` 逐页登记，页面→职责映射覆盖 11 项职责的最小页面族）
- admin 正向：设计器深链 `/workflow/defs/{defId}/design`（真实渲染 R9b-时限图画布）、任务详情页（真实待办/表单数据/流程变量）、实例列表（流程监控 112 条）、实例详情抽屉（流程图当前节点高亮）
- user5 负向：工作台侧栏菜单为空（与 /auth/menus count=0 一致）、待办/发起/抄送全空；直接访问设计器深链与 /workflow/instances 均被路由守卫拒至 **/403**（截图 06/07）
- 页面/HTTP 500=0；静态路由字符串不再作为证据

### R10a — 终态封装（PASS，`R10/`）

- `R10/manifest.json`：i3-08 全量文件 sha256（工具生成 + 独立回读），`R10/manifest-verify.txt` 复算 bad=0；**manifest file_count 单值一致**并同步写入 payload tool_results
- `R10/terminal-payload.json`：所有字段与真实结果同源——`maven-mvn-test` outcome 按真实 exit 1 如实登记（**不写 SUCCEEDED**，detail 说明 6 例 IoT 沙箱环境性失败已按验收 06 §3.2 裁决为非回归、基线对照已锁定）；`validate-terminal` Validator 原始 command/output/exit 入包（**exit=0**）
- 清理回执 `R10/cleanup-attest.txt`：8081/8082/50886/5173 listeners=0；Redis 系统服务说明同前

## 2. 与提示 05 的偏差说明

- 无方向级偏差。R9a 诊断为采集口径错误而非产品缺陷，故未触发 §4 条件重冻结；除新增验证用测试类（R8a 提交层等强度替代资产，不改实现）外零代码变化。
- 新增测试类使 sw-bpm-process 测试目录多 1 文件；该模块门禁事实以验收 06 锁定的 186/0/0/0 继续有效，本轮追加的 2/0/0/0 为增量验证资产运行结果，入包留证。

## 3. 自验结论

提示 05 §7 提交门前清单逐项为是：R3a 有效负向+零副作用、R8a 固定真实 fid 无 /undefined/、R8b 五类回显与表态行非空、R9a 菜单与全部采证流 500=0、R9b 无权身份非 superAdmin 且图零变化、R9c 为真实页面行为、无代码变化故冻结范围不变、R10a 单值一致且如实标注 exit。合法状态 `VERIFYING / EXECUTION_SUBMITTED`；未写 PASSED/COMPLETED、未核销 P4/P34/P35/P47/P60、未移动正式方向。等待规划逐项验收。
