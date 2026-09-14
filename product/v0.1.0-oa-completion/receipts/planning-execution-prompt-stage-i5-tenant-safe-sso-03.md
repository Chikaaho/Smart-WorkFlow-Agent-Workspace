# P60 I5 三级零裁量执行提示 03

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-13  
> 当前状态：P60=IN_PROGRESS，I5=VERIFYING  
> 下一回执：stage-i5-v0.0.3-oa-iteration-05.md

## 1. 唯一入口

本提示替代 planning-execution-prompt-stage-i5-tenant-safe-sso-02.md。旧提示、iteration-01—04 和旧 evidence 仅供本提示明确允许的证据指针追溯，不同时构成待办。

权威输入仅为：

- ../ready/direction-stage-i5-tenant-safe-third-party-sso.md
- planning-review-stage-i5-v0.0.3-oa-iteration-04.md
- 本提示
- 规划验收 03 已列出的锁定子证据

除 G8 外，下列每个原子项必须各有一份独立证据包；正向、反向、对象身份、原始结果全部为是才能标记 COMPLETED。不能满足时继续执行；只有真实工具/外部阻塞符合终态契约时才能报告 BLOCKED。

## 2. 禁止重验

- 验收标准 #8 的生产匿名暴露矩阵。
- H2 双租户同键/不同物理表。
- tenant 100 已有绑定—命令—实例—Flowable task—通知 tenantId 子链。
- prod CAPTCHA、RSA、JWT、通用 AES 门禁。
- WECOM 失败换票后的 state 重放拒绝。
- 顺序跨租户外部主体拒绝、账号撤权与停用子链。
- 三 Provider nonce 官方映射。

只有最终代码改动触及对应路径并写明失效依据时才复验受影响项。

## 3. 零裁量证据包矩阵

| 原子 ID / 唯一文件 | 正向目标断言 | 必要反向断言 | 固定对象与必须出现的原始字段 |
|---|---|---|---|
| G1a1-form-objects.raw | 两租户同 formKey 的定义、配置、快照、列表配置分别读回 marker | 四对象跨租户均拒绝/空且行数不变 | server/web SHA、H2、tenant 0/100、formKey、四对象 ID、method/path/status/code、tenant/marker、before/after SQL |
| G1a2-form-pg.raw | PG 两租户同键成功且物理表不同 | 同租户重复拒绝、行数不增 | PG JDBC 摘要/schema version、同 formKey、两 tenant/table_name、重复前后 SELECT |
| G1b1-trace.raw | 已锁链的完成实例为 APPROVED，轨迹含同 task/node/actor | 不出现异租户 activity/task | instance/process/task IDs、完成后实例、历史 activity/轨迹、tenant |
| G1c1-cross-tenant.raw | 两 tenant-user 对的同布局业务键各自读回 marker | 定义/绑定/实例/task/布局的跨租户读改发起办理全拒绝且零副作用；无 SQL 500 | 双方对象 ID、每个动作 before/after、布局 SQL 行 |
| G2a1-openapi-http-pg.raw | 登记 app 的合法签名 HTTP 达业务 scope/handler 边界 | 缺头、坏签名、租户冲突、过期租户拒绝；nonce/业务表增量 0 | app digest、tenant、timestamp、nonce digest、body/signature hash、HTTP status/code、PG nonce/business rows |
| G2a2-iot.raw | 登记设备与真实存在入口的有效租户正向进入业务边界 | 缺失/冲突/停用/过期 tenant 拒绝，命令/事件增量 0 | device/app digest、真实 path、四状态、before/after |
| G2a3-async.raw | 有效生产者/信封可入队消费 | 缺失/冲突/停用/过期 tenant 拒绝，命令/实例增量 0 | envelope/correlation/actor digest、权威 tenant、消费结果、SQL |
| G2b1-session.raw | 同 user/session 在有效租户登录、refresh、me 成功 | 权威 expire/status 改变后新登录、refresh、access 装载拒绝且会话清理 | 每步 timestamp、tenant row、token digest、HTTP、session/cache row |
| G3b1-db-auth.raw | 正确 PG 凭据 prod 启动成功 | 仅改错误账号/密码时首因是 PG 认证失败且日志无密码 | 两进程命令摘要、exit、首因、target digest、secret scan |
| G3b2-provider-boot.raw | 三 Provider enabled=false 可启动；enabled=true+有效非秘密测试配置通过配置门 | 每 Provider enabled=true 的缺失与 placeholder 各自进程 fail-fast | Provider、enabled、单变量名、process exit、首因；不得使用 Mockito/service |
| G4a1-permission.raw | 空角色未停用用户 me 显示 roles/permissions 空且 dataScope 非 ALL | 合法参数用户/部门/角色/表单/流程管理请求均 403 或契约空集，无参数 400 | 同一 session、method/path/body/status/code、dataScope 权威回读 |
| G4b1-browser.raw + 两张截图 | PC/移动同 session 的普通工作台可用 | 管理菜单/配置不可见；system/user 深链和刷新进入安全页，网络请求拒绝 | 两 viewport、currentUrl、visible/hidden selectors、network statuses、截图文件存在 |
| G5a1-allowlist.raw | WECOM/FEISHU/DINGTALK 白名单内各生成准确 redirect_uri | 三者白名单外均在外呼前拒绝，outbound delta=0 | 每 Provider redirectUri/allowlist match、HTTP、host count before/after |
| G5b1-state-code.raw | 三 Provider 各自首次 state/code 进入受控换票边界 | 过期、篡改、Provider/tenant 错配、code 重放均无第二外呼/绑定/session | state/code digest、provider/tenant/consumed/expireAt、三个计数 before/after |
| G5c1-browser.raw + 必要截图 | 三 Provider 登录前入口可见，本地绑定/解绑页状态可用 | 失败回跳一致；最终 URL/storage 无 code/state/token | PC/移动、三 Provider、URL、storage keys/value digest、network response |
| G6a1-pg-concurrency.raw | 两租户同主体 PG barrier 并发仅一方成功 | 失败方 binding/role/session 增量 0，返回业务冲突而非 500 | provider/app/subject digest、两 tenant/user、barrier 时间、两响应、三表 before/after |
| G6b1-binding-session.raw | 同一绑定/session 在有效租户可兑换受控票据 | 租户禁用/过期、解绑后均不能登录或继续权限会话；role 表增量 0 | binding/user/tenant/session digest、状态时间序列、HTTP、binding/role/session rows |
| G7a1-audit.raw | 真实 DENIED 事件按 result 命中，external digest 筛选命中 | 未停用无权用户 403、匿名 401、跨租户空集 | event IDs、filters、status/code、result/digestPrefix/tenant |
| G7b1-residue.raw | 安全映射中的每个真实测试值在所有要求表面命中 0 | 报告自身、回执、对象账本不得复制原值或产生自命中 | hashLabel、surface/path/hitCount/exit、排除项；映射不写入 product |
| G8-real-provider | 三 Provider 各自真实成功链 | 解绑后拒绝与 Provider 失败恢复 | 官方应用/HTTPS 域/测试身份；条件缺失保持 PENDING |
| G9a1-candidate.raw | 所有行为包绑定最终 Server/Web SHA，manifest 校验 0 | 任何行为包 SHA 不得早于最后受影响代码修改 | old..final diff、每包 SHA、manifest、verify stdout/stderr/exit |
| G9b1-gates.raw | 最终受影响模块、迁移、Web/IoT 门禁均 0 failure/error | 不存在缺失附件、静默豁免或 terminal 矛盾 | 原始命令、模块 tests/failures/errors/skipped/exit、附件清单、browser_status |

## 4. 唯一允许的对象与替代

- 可以新建 iteration-05 对象，但每个包内部不得换租户、用户、数据库、session、Provider 或候选。
- H2 不能替代明确要求 PG 的 G1a2/G6a1。
- Mockito、MockMvc、service fixture、测试类名不能替代明确要求的 HTTP/PG/浏览器/进程。
- 受控 Provider 对端可以用于 G5/G6，不可替代 G8 真实成功链。
- G4b 中“配置”如仅为用户自己的布局配置，可保留，但证据必须显示它不调用管理 API、不授予管理能力；否则隐藏。
- P45 Redis 错误只有引用既有正式豁免回执且证明与当前候选无关时才可排除；否则必须把受影响门禁跑到 errors=0。

## 5. 允许修改与固定执行顺序

允许修改：二级提示已授权的 I5 表单租户、OpenAPI、IoT、异步、租户会话、SSO、审计、权限守卫、相关 Web 页面/路由及直接验证资产；product 仅新增 iteration-05 和 evidence/i5-05/。禁止修改历史回执、审查和 evidence。

执行顺序不得改变：

1. 在 evidence/i5-05/object-ledger.md 写最终计划对象、初始 SHA 和每个原子包文件名。
2. 完成所有不依赖 G8 的实现与行为包；每包当场核对正向/反向。
3. 任何断言为否，立即修复并重取该包；不得先写回执。
4. 确定最后候选，逐包核对 captured SHA；受影响旧包失效就重取。
5. 运行最终受影响门禁，确保 failures=0、errors=0；生成附件存在性清单。
6. 生成并真实回读 manifest，保存 stdout/stderr/exit。
7. 自检矩阵全部为是后才写 iteration-05 和完整 ENGINE_TERMINAL。

远程推送、破坏性数据库操作、真实秘密写盘、开始 I6、核销 P60/P31、修改方向或写 PASSED/COMPLETED 均禁止。

## 6. 每包统一头与“全部为是”门禁

每个 raw 包首部必须逐行包含：

atomic_id、captured_at、server_sha、web_sha、environment、database、tenant_id、actor、object_ids、positive_assertion、negative_assertion、positive_pass、negative_pass、cleanup、uncovered。

提交前逐项回答：

- [ ] 除 G8 外，矩阵每行独立文件存在？
- [ ] 每包 positive_pass=true 且 negative_pass=true？
- [ ] 每包对象与该行固定对象完全一致，无 Mockito/未知路径/停用身份近似替代？
- [ ] PG、HTTP、浏览器、进程证据均来自要求的真实层级？
- [ ] 每包 SHA 与最终候选一致，或有逐文件不失效证明？
- [ ] 所有门禁 failures=0、errors=0，所有引用附件存在？
- [ ] 零残留报告没有自命中，product 中不新增原始秘密/主体哨兵？
- [ ] ENGINE_TERMINAL 的 work_items、remaining_actionable_count、tool_results、browser_status 与附件一致？
- [ ] G8 缺外部条件时保持 PENDING/dependency_satisfied=false，其余项全部关闭？

任何一项为否：不得提交 EXECUTION_SUBMITTED。真实阻塞满足机器契约时如实 BLOCKED；否则继续执行。

## 7. 相对二级提示的收紧

- **删除**：删除 iteration-04 的 service/mock 修复摘要作为验收证据；保留其代码定位作用。
- **原子化**：每个剩余 ID 固定为一个独立文件，浏览器只额外附截图，不再使用合并总矩阵。
- **替代路径**：无；本提示已为每项给出唯一允许的证据层级。只有 G4b 配置入口和 P45 正式豁免存在文中限定替代。
- **提交条件**：除 G8 外逐包正反断言全部为 true、最终门禁 errors=0、机器终态完整一致；否则禁止提交。

下一回执固定：

product/v0.1.0-oa-completion/receipts/stage-i5-v0.0.3-oa-iteration-05.md

证据目录固定：

product/v0.1.0-oa-completion/receipts/evidence/i5-05/
