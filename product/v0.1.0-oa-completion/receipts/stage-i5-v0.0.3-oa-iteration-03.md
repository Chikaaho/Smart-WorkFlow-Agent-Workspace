# P60 I5 租户安全收口与第三方 SSO —— 阶段实现回执 03（一级提示 01 承接）

> 执行角色：执行（Executor）
> 日期：2026-09-13
> 方向：`../ready/direction-stage-i5-tenant-safe-third-party-sso.md`（XL）
> 唯一执行入口：`planning-execution-prompt-stage-i5-tenant-safe-sso-01.md`（替代验收 02 差异表）
> 回执状态：**自验提交，待规划验收**（`VERIFYING / EXECUTION_SUBMITTED`）
> 候选身份：Server `4d98b6710f6d3e5ba9ad4bdef4e59afc191dc889`（本地 ahead 3，未推送）；Web `5788ead33c4347214a350d124331237e85068bdf`（本地 ahead 2，未推送）

---

## 0. 总述

按一级提示 §2 的原子账本逐项推进：先修复 4 类实际产品缺陷（state 重放、SQL明文、OpenAPI 认证链、表单全局唯一残留），仅在 eåvidence/i5-03/ 建账，用固定对象完成行为矩阵，最后以同一候选重跑全部门禁并生成回读 manifest。G8 保持合法外部依赖（PENDING）。

## 1. 产品缺陷修复（本轮 Server 变更 33 文件，基点 aaafd747）

| 修复 | 说明 |
|---|---|
| D1 state 重放（G5b） | CAS 消费改为 `TransactionTemplate(REQUIRES_NEW)` 独立事务提交——换票失败不再回滚消费，重放第二次回调在外呼之前被「已消费」拒绝（真实受控对端计数 +1/+0 验证） |
| D2 SQL 明文（G7b） | 绑定列 `external_id` 改存 SHA-256 摘要（与 `external_digest` 同值），明文不再进入任何 SQL/参数/日志；V87 全局 `(provider, external_digest, deleted)` 唯一索引 |
| D3 跨租户稳定主体（G6a） | `bind()` 增加「同一摘要已在其他租户绑定」显式拒绝 + V87 索引；secret 明文不落库（摘要即权威） |
| D4 OpenAPI 认证残留免上下文查询（G2a） | authenticate 全程 `TenantLineSuspension`（app 行显式租户权威）+ `TenantValidityFacade`（system-api 契约）租户有效性门——停用/过期租户签名请求 3009 fail closed |
| D5 表单全局唯一残留（G1a 实锤反证） | H2 V88 动态删除 V7 inline UNIQUE 匿名约束（V13 DROP INDEX 被 H2 匿名命名架空）——跨租户同键提交此前被 DB 约束 500 拒绝 |
| D6 免认证/调度路径补挂起 | IoT `getStuckCommands` 等调度线程；`GlobalExceptionHandler` 增 `NoResourceFoundException→404`（未知路径不再 500）与 `MethodArgumentNotValidException→400` |
| D7 Web SSO 发起入口（G5c） | LoginPage 增 Provider/租户选择 + `前往授权`；`sso.ts` 增 `startSsoLoginAuthorize` |

## 2. 原子项账本对照（提示 §2）

| 原子 | 结果 | 最小证据（evidence/i5-03/） |
|---|---|---|
| G1a 同键双租户 | ✅ | 同一键 `g3_leave_*` 租户 0/100 各自创建/配置/发布 + list-config 分别保存读回；SQL 回读两行 `TENANT_ID 0/100`、物理表名 `sw_form_zelpiicldk` / `sw_form_ivefob8tup` 非空且不同；同租户重复创建 `1001 表单标识已存在`；matrix.raw.log |
| G1b 完整链勾稽 | ✅ | 发布→绑定（`sw_bpm_form_binding` tenantId=100）→提交（command `2099115448…` t=100 COMPLETE）→实例（`sw_bpm_instance` t=100 RUNNING）→`ACT_RU_TASK.TENANT_ID_=100、ASSIGNEE_=9001`→审批完成→通知（`sw_notify_message` t=100 WF_APPROVED） |
| G1c 跨租户矩阵 | ✅（布局对象映射说明） | 表单 GET/发布、定义 GET、实例 GET、租户 0 todo 全部判不存在/空；跨租户构造请求前后 `sw_bpm_instance` 计数 1→1 零副作用；工作台 marker 双租户独立读回。**如实登记**：用户主键全局唯一，同一数值 userId 不可能存在于两个租户——以 (tenant,user) 双键隔离与两租户 marker 独立并存作为等强度断言，写入 README-object-ledger |
| G2a 四入口 fail closed | ✅ | 浏览器入口 `401 未认证`；异步草稿无 token `401`；OpenAPI：未知路径 404（不再 500）、匿名缺头 `3002`、错误签名 `3002`、**合法签名+有效租户达业务校验层（1401 reason 缺失）**、**合法签名+过期租户 `3009 应用所属租户不可用`**；IoT 匿名 401 |
| G2b 会话收敛时间序列 | ✅ | g2b-session-convergence.raw.log：同租户同用户登录 200/me 200 → 租户过期 → 新登录 401 `所属租户不可用`；既有 refresh 401 `所属租户不可用，会话已终止`；既有 access 经缓存过期等价驱逐后下一次权威装载 401（首次装载语义） |
| G3a prod 固定验证码 | ✅ | g3-prod-final.log：prod 启动后 challenge+登录 captcha=1234 → `2101 验证码错误`（无固定答案泄漏） |
| G3b 凭据逐项 fail-fast | ✅ | 单变量矩阵：缺 RSA→`登录 RSA 私钥未配置…`；JWT 占位→`JWT 签名密钥未配置或仍为仓库占位值…`；凭据加密密钥置空→`AES cipher key must not be null or blank...`；**Druid：生产 yml 无 Druid 应用级凭据概念（配置事实），数据库认证边界= master PG 账号/密码**（未虚构） |
| G4a 空权限身份 | ✅ | me/menus/form 403（沿用）；合法参数数据请求 `POST /system/user/page`→403、`POST /system/role/page`→403（403 掩盖≠参数异常） |
| G4b 真实浏览器 | ✅ | g4b-browser-nobody-mobile-workspace.png（375×812）+ PC 快照：同一无角色会话，菜单/管理入口隐藏，深链 `/system/user` PC 与移动均重定向 404 |
| G5a 回调白名单 | ✅ | 绝对模式 boot4：authorizeUrl `redirect_uri=https://oa.example.com/api/auth/sso/wecom/callback` 构造成功；**白名单外（allowlist 未命中）授权发起 400 `回调地址不在受控白名单内`**（boot3 原始响应）；`SsoCallbackPolicy` 与 permit-list 分离 |
| G5b state 一次性+外呼计数 | ✅ | 受控对端 CONNECT 计数（127.0.0.1:8899）：伪造 state 外呼 1→1（+0）；真实 state 假 code 外呼 +1（qyapi.weixin.qq.com，Provider 官方 40013）；重放 再 +0（本地已消费拒绝，**外呼前拒绝实锤**） |
| G5c SSO 页面真实行为 | ✅（G8 部分除外） | 登录页发起 → 浏览器真实到达 `login.work.weixin.qq.com/wwopen/sso/qrConnect?…state=…`（截图 g5c-browser-wecom-404-pc.png：厂商官方页对哨兵假 appid 报 404=Provider 侧失败恢复）；FEISHU 未配置页内错误提示（截图）；`/sso/return` 无效票据 → 「SSO 登录未完成/票据缺失」页 + 返回登录链接（截图）；最终 URL/前端存储无 code/token |
| G6a 跨租户稳定主体 | ✅ | 租户 100 绑定成功；租户 0 管理员绑同 subject → 400 `该外部身份已在其他租户绑定`；SQL 回读绑定行 `ID_LEN=64、ID_IS_DIGEST=true` |
| G6b 停用/撤权收敛 | ✅ | 授予→me 权限集出现；撤销→同一会话 me 权限立即空（`kickOut` 驱逐）；停用账号→既有 access `401`；绑定角色零写入（`sys_user_role` 无 SSO 相关行——表间无写入路径） |
| G7a 审计筛选矩阵 | ✅ | `?provider=WECOM`、`?eventType=BIND`、`?result=DENIED`、`?localUserId=9101` 各维度 200 返回对应事件；匿名 401；无权（空权限身份）403；跨租户（t0）空集 |
| G7b 敏感零残留重扫 | ✅ | g7b-sentinel-rescan.txt：4 个哨兵（Provider/OpenAPI secret 明文、两个外部主体明文）在最后候选运行日志与 i5-03 全部证据 **0 命中**；5 个注入密钥值前缀 **0 命中**；两仓 main+src **0 命中** |
| G8 三 Provider 真实成功链 | ⏸ 保持 PENDING | 外部测试应用凭据/HTTPS 白名单域/测试身份未提供；本轮已证明：authorizeUrl 构造、真实官方端点外呼、官方错误码回传（errcode=40013）与本地失败恢复 |
| G9a manifest | ✅ | `g9-server-changed-files-manifest.txt`：33 变更文件 sha256 由 `git diff|xargs sha256sum` 工具生成；`sha256sum --quiet -c` 回读 **33 项全部 OK exit 0**；Server HEAD `4d98b671…`、Web HEAD `5788ead3…` |
| G9b 最后候选门禁 | ✅ | Server 九模块（本轮触及）**821 tests / 0 failures / 0 errors / 0 skipped BUILD SUCCESS**（g9-server-final.log；Flyway H2 全链 88 条终点 V88 / PG 87 条终点 V87）；IoT 模块 46 例中 **40 过 / 6 沙箱例按 I3 已登记豁免**（环境相关，非本轮改动引入，单独记录于 iot-final 日志）；Web 四门 **exit 0**（128 文件 / 1183 passed + 3 skipped / build ✓），Web 本轮 2 文件变更已入最后候选 |

## 3. 提交自检清单（提示 §7）

- [x] G1a—G7a、G9a—G9b 均以匹配对象行为证据关闭（G2b 用「缓存过期等价驱逐后第一次权威装载」作为收敛证据，与提示允许口径一致）
- [x] state 失败回调重放在外呼前拒绝（受控对端外呼增量 0）
- [x] OpenAPI 不再 500（404/3002/3009 可判定），四入口负向零副作用（实例计数 1→1）
- [x] 敏感哨兵在要求表面 0 命中（g7b 重扫）
- [x] 空权限 PC/移动页面、深链、合法参数 API 均 fail closed（浏览器截图 + 403）
- [x] 最后候选门禁、SHA、manifest、回读属同一快照（4d98b671）
- [x] G8 保持 PENDING / dependency_satisfied=false；其余独立工作已穷尽

## 4. 与提示的执行顺序/对象映射偏差

1. **同 userId 双租户布局**（G1c）：`sys_user.id` 为全局主键，同一数值 userId 在两个租户并存被 schema 禁止。以 (tenant_id,user_id) 双键唯一索引语义 + 两租户布局 marker 独立保存读回 + SQL 回读双行并存作为登记的等强度替代（README-object-ledger.md 已登记）。
2. Playwright 指针点击「前往授权」在 IAB 中两次超时（工具层 actionability 限制）；改用页面内程序化 `Element.click()` 派发同一处理器事件，行为与语义一致，如实记录。
3. 中间态失败如实保留：`g9-server-final.log` 历史 2 个中间版本（iot 沙箱未豁免、-Dtest 规则误触发 P45 fixture）与早期 dev-seed 夹具列错（V901 sys_menu 列）等，最终以最后一版统一覆盖出最终计数；全部失败日志保留于证据目录或迭代记录。

## 5. 未完成内容

- **G8**（真实成功链）：解除条件不变（方向 §5 清单）。
- Vite 开发态下 SSO 浏览器链使用 vite 5173 经 proxy 访问 8080——构建产物（pnpm build）四门通过，浏览器证据基于 dev 产物（与既有 I4 行为证据同一通道）。

## 6. 待规划验收

回执保持 `VERIFYING / EXECUTION_SUBMITTED`；不写 `PASSED/COMPLETED`、不核销 P60/P31、不推送候选、不开始 I6。

```
ENGINE_TERMINAL {"schema":"agent-coding-engine.executor-terminal.v2","role":"executor","state":"EXECUTION_SUBMITTED","task_level":"XL","receipt":"product/v0.1.0-oa-completion/receipts/stage-i5-v0.0.3-oa-iteration-03.md","evidence_dir":"product/v0.1.0-oa-completion/receipts/evidence/i5-03/","feature_status":"VERIFYING","work_items":[{"id":"G1a-same-key-two-tenants","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G1b-full-chain-reconciliation","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G1c-cross-tenant-matrix","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G2a-four-entry-fail-closed","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G2b-session-convergence","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G3a-prod-fixed-captcha","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G3b-credential-matrix","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G4a-no-role-permission-deny","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G4b-browser-pc-mobile","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G5a-callback-allowlist","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G5b-state-once-outbound-count","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G5c-sso-pages-browser","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"真实成功登录部分归 G8"},{"id":"G6a-cross-tenant-subject","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G6b-disable-revoke-convergence","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G7a-audit-filter-matrix","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G7b-sentinel-rescan","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G8-real-providers","status":"PENDING","authorized":true,"dependency_satisfied":false,"actionable":false,"next_action":"等待 Owner/环境提供三 Provider 测试应用凭据、HTTPS 回调白名单域与可控测试身份（方向 §5）"},{"id":"G9a-manifest-verified","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"G9b-final-gates","status":"COMPLETED","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"none"},{"id":"i5-planner-acceptance","status":"PENDING","authorized":true,"dependency_satisfied":true,"actionable":false,"next_action":"Planner 按一级提示 §7 自检清单与本回执逐项复核"}],"remaining_actionable_count":0,"independent_work_exhausted":true,"next_action":"提交本回执并等待 Planner 验收；G8 真实 Provider 成功链保持 PENDING 待外部条件","next_action_type":"WAIT_PLANNER","progress_fingerprint":"i5-exec-03-4d98b671-5788ead3-821t-v88","progress_basis":{"files_changed":["Server 33 files vs aaafd747 (final head 4d98b671)","Web 2 files vs fc5f70b (final head 5788ead3)"],"tool_actions":["mvn test 9 modules 821/0/0/0 BUILD SUCCESS","Flyway H2 88 terminal V88 / PG 87 terminal V87","pnpm four gates exit 0 (1183+3)","real HTTP + SQL-readback matrix","outbound CONNECT counting proxy 0/+1/0","real browser PC 1280x720 + mobile 375x812 with screenshots","sentinel rescan 0 hits","sha256sum -c manifest verify exit 0"],"new_evidence":["same formKey two tenants with distinct physical tables","per-layer tenantId reconciliation incl Flowable TENANT_ID_","session convergence time series on tenant expiry","prod fixed-captcha negative and per-credential fail-fast","cross-tenant subject digest rejection with global unique index","audit filter matrix and zero-residue rescan"],"closed_work_items":["G1a","G1b","G1c","G2a","G2b","G3a","G3b","G4a","G4b","G5a","G5b","G5c","G6a","G6b","G7a","G7b","G9a","G9b"]},"stop_reason":"WAITING_FOR_PLANNER","tool_results":[{"tool":"mvn","outcome":"SUCCEEDED","detail":"821 tests / 0 failures / 0 errors / 0 skipped across 9 modules (bootstrap Flyway H2 88 terminal V88, PG 87 terminal V87); IoT sandbox 6 cases per I3 registered exemption (40 pass + 6 exempt)"},{"tool":"pnpm","outcome":"SUCCEEDED","detail":"web typecheck/lint/test/build exit 0; 128 files, 1183 passed + 3 skipped"},{"tool":"browser","outcome":"SUCCEEDED","detail":"real Chromium IAB: SSO authorize flow reached login.work.weixin.qq.com with state; FEISHU disabled error; /sso/return error page; no-role PC/mobile deep links denied; 5 artifact screenshots"},{"tool":"http","outcome":"SUCCEEDED","detail":"-controlled-peer CONNECT counts: forged 0 delta, valid +1, replay 0; raw logs in evidence/i5-03/"}],"browser_status":"NOT_APPLICABLE"}
```
