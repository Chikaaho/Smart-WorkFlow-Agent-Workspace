# P60 I5 二级执行补充提示 02：剩余原子项

> 下发角色：规划（Planner）  
> 指定角色：执行（Executor）  
> 日期：2026-09-13  
> 等级：二级提示（一级提示后同类失败）  
> 当前状态：P60=IN_PROGRESS，I5=VERIFYING

## 1. 唯一入口与替代关系

本提示替代 planning-execution-prompt-stage-i5-tenant-safe-sso-01.md，作为唯一当前执行入口。一级提示、iteration-01—03 及其 evidence 只作追溯和本提示明确允许的锁定证据，不同时作为执行待办。

精确输入：

1. ../ready/direction-stage-i5-tenant-safe-third-party-sso.md
2. planning-review-stage-i5-v0.0.3-oa-iteration-03.md
3. planning-execution-prompt-stage-i5-tenant-safe-sso-02.md
4. iteration-03 的 README-object-ledger、matrix、session、g3、g5a、g7b、g9 和四张现有截图

## 2. 已删除并禁止重验

- 验收标准 #8。
- H2 同键双租户及不同物理表子断言。
- tenant 100 的绑定、命令、实例、Flowable task、通知 tenantId 子链。
- prod CAPTCHA、RSA、JWT、通用 AES 缺失门禁。
- WECOM 失败换票后的 state 重放本地拒绝与外呼增量 0。
- 顺序跨租户外部主体拒绝；同一账号撤权后权限清空、停用后 access 401。
- Server 821、Web 1183+3 只作为历史门禁计数，不要求原样重跑；最终代码变化触及对应模块时只跑工程宪法要求的受影响门禁。
- 三 Provider nonce 官方不支持映射。

## 3. 二级唯一剩余矩阵

父子映射：G1a→G1a1/G1a2；G1b→G1b1；G1c→G1c1；G2a→G2a1/G2a2/G2a3；G2b→G2b1；G3b→G3b1/G3b2；G4a→G4a1；G4b→G4b1；G5a→G5a1；G5b→G5b1；G5c→G5c1；G6a→G6a1；G6b→G6b1；G7a→G7a1；G7b→G7b1；G9a/G9b→G9a1/G9b1。G8 保持原 ID。

| 原子 ID | 最新失败事实 | 完成条件与反向断言 | 对象身份 | 最小证据/原始字段 | 下一动作与合法停止 |
|---|---|---|---|---|---|
| G1a1 | list-config 返回 data:null，无配置/快照内容 | 两租户同键的定义、配置、发布快照、列表配置分别回读本租户 marker；跨租户逐对象为空/拒绝 | iteration-04 两租户同一 formKey、四类对象 ID | 每类 save/read/cross-read 的 method/path/status/code/tenant/marker；SQL tenant_id/外键/行数 | 固定同一批对象重取 |
| G1a2 | 只在 H2 跑同键行为 | PostgreSQL 同样允许两租户同键、物理表不同；同租户重复拒绝且行数不增 | 单个 PG 隔离库、同一 formKey | PG API 或集成运行 + before/after SELECT；schema version=87 或后续最终值 | PG 工具真实不可用且替代穷尽才可停 |
| G1b1 | 缺完成后实例和轨迹 | 审批完成后同一实例为 APPROVED，轨迹包含对应 task/节点/处理人，tenantId 与已锁链一致 | 沿用实例或登记替代完整链 | instanceId/processInstanceId/taskId；完成后实例、历史活动/轨迹、通知回读 | 不重跑已锁层，补缺层即可 |
| G1c1 | 跨租户动作不完整，布局 SQL 为 500 | 定义、绑定、实例、task、布局的读/改/发起/办理均拒绝；动作前后关键行数不变；两个 tenant-user 对使用相同布局业务键，各自 marker 回读，SQL 不得 500 | 两租户明确 tenant-user 对与双方对象 | 正反 API 矩阵、before/after SQL、布局 SQL 行 | 同数值 userId 要求已撤回，不再尝试 |
| G2a1 | valid T100 实际 3002，孤立 1401 无身份 | 合法签名 T100 达业务校验层；同应用的缺头、坏签名、租户冲突明确拒绝；过期应用租户 3009；全部零业务副作用 | 固定 appId、tenantId、timestamp、nonce、请求体摘要 | 每次 app/tenant/bodyHash/signatureHash/status/code；业务表 before/after；秘密不落证据 | 用同一签名生成器重取，禁止孤立响应 |
| G2a2 | IoT 有效请求为不存在资源 404 | 已登记有效设备/身份可进入真实 IoT 发起入口；缺失/冲突/停用/过期租户均稳定拒绝且零事件/命令 | 固定设备、身份、四租户状态、真实存在路径 | method/path/deviceDigest/tenant/status/code；命令/事件 before/after | 不能用匿名 401 或未知路径 404 |
| G2a3 | 异步只测无 token 401 | 有效生产者/信封正向可消费；缺失/冲突/停用/过期 tenant 均拒绝且零实例/命令副作用 | 固定 envelope/correlation/actor 与四状态 | 入队/消费结果、信封 tenant、权威 tenant、before/after | 无 Provider 依赖 |
| G2b1 | 等待/过期日志无时间戳和租户状态行 | 同一租户/用户/session 在有效→过期的时间序列可复算；权威状态变化后新登录、refresh、access 装载拒绝并显示会话清理结果 | 同一 tenant/user/access/refresh | 每步 timestamp、tenant status/expire_at、token digest、HTTP、缓存/会话回读 | 不得仅写“等价驱逐” |
| G3b1 | Druid/PG 认证只有声明 | 错误数据库账号或密码在其他配置有效时由 PG 认证拒绝；正确凭据可启动；日志不含密码 | 同一 prod 启动配置，只改变 DB 凭据 | 两进程 exit、首因、数据库目标摘要、秘密扫描 | Druid 无独立凭据的规划口径接受，不另造开关 |
| G3b2 | 三 Provider 启用凭据未验证 | WECOM/FEISHU/DINGTALK 各自在 enabled=true 时，对缺失 secret 与定义的 placeholder fail-fast；enabled=false 不强制 | 每 Provider 两负一正配置格 | provider/enabled/变更字段/exit/首因；正向仅要求启动，不要求真实授权 | 可用非秘密测试值；无需 G8 条件 |
| G4a1 | GET 数据接口仍参数 400，无 DataScope 反向 | 空角色会话用合法参数访问用户/部门/角色/表单/流程管理接口均权限拒绝或契约空集，且权威数据范围不是 ALL | 同一未停用空角色用户/session | me 权限/角色/dataScope；合法 method/path/body/status/code；不得混用停用账号 | 参数 400 不可接受 |
| G4b1 | 缺 PC 深链，移动页仍显示配置 | PC 与移动同一空权限会话：受限菜单和配置入口不可见；直接深链/刷新落 403/404 安全页；网络 API 同步拒绝 | 同一未停用用户、PC 1280×720、移动 375×812 | 每 viewport 当前 URL、可见文本、截图、关键网络 status；至少覆盖 workspace 配置与 system/user | 若“配置”是用户自有布局，需以功能说明和网络权限证明非管理入口 |
| G5a1 | 只测 WECOM 白名单 | 三 Provider 分别白名单内生成准确 redirect_uri；白名单外在任何 Provider 外呼前拒绝，外呼增量 0 | 三 Provider、同一 allowlist 策略、受控对端 | provider/redirectUri/allowlistMatch/HTTP/outbound before-after | 无真实秘密 |
| G5b1 | 只测 WECOM，缺完整负向 | FEISHU/DINGTALK 及 WECOM 均覆盖过期、篡改、Provider错配、租户错配；同 code 重放无二次绑定/会话；所有拒绝路径外呼/绑定/session 增量 0 | 每 Provider 独立 state/code/object counters | state digest/provider/tenant/consumed/expireAt；outbound/binding/session before-after | WECOM 已锁的失败重放不重复 |
| G5c1 | 无 DingTalk、绑定/解绑页和存储回读 | 三 Provider 登录前入口均可见；受控失败回跳一致；本地绑定/解绑页面状态可用；最终 URL、session/local storage 无 code/state/token | PC/移动同一构建、三 Provider | 截图、URL、storage keys、network response；真实成功部分归 G8 | 只补非 G8 页面链 |
| G6a1 | 无并发冲突与失败侧零副作用 | 两租户对同一稳定主体并发绑定仅一个成功；失败侧绑定/角色/session 计数不增 | 固定 provider/app/subjectDigest、两用户、并发 barrier | 两响应、唯一行、before/after 三类计数 | 顺序拒绝证据可沿用 |
| G6b1 | 缺租户禁用/过期、解绑后登录 | 同一绑定/session 在租户禁用、过期、解绑后均不能第三方登录或继续权限会话；恢复边界明确；角色表零写入 | 同一 binding/user/tenant/session 时间序列 | 状态切换、login/ticket/session、binding/role rows before-after | 受控对端可替代换票，G8 成功不在本项 |
| G7a1 | DENIED 为空，无权为停用后 401，无 digest 筛选 | 先制造真实 DENIED 审计，再按 result 命中；按 external digest 命中；未停用无权用户返回 403；跨租户空集 | 两租户、有权/无权用户、固定事件 IDs | query filters、status/code、record IDs/result/digestPrefix | 不用空结果证明筛选 |
| G7b1 | 扫描报告 evidence 面每项为 1，却声明 0 | 新证据与回执不出现原始哨兵；用仅 Executor 私有的安全映射或哈希标签扫描 URL/前端/日志/SQL/审计/回执，逐表面真实值命中 0；报告自身不自命中 | 最后候选、完整扫描根、安全映射 ID | surface/path/hashLabel/hitCount/exit；排除项逐条说明 | 不修改历史回执；新包不得复制原文 |
| G8 | 外部条件仍缺 | 三 Provider 真实成功链保持原标准 | 官方应用/域/身份 | 真实 Provider 双侧结果 | 条件不足继续 PENDING，不阻塞其他项 |
| G9a1 | 对象账本是 ee9c，最终候选 4d98；校验退出仅文案 | 所有 iteration-04 行为证据绑定最终 SHA；列出前一证据 SHA→最终 SHA 的实现 diff 及受影响判断；manifest 与证据哈希工具校验真实 exit 0 | 最终 Server/Web SHA、证据包 | git SHA、diff file list、manifest、独立 verify stdout/stderr/exit 文件 | quiet 校验也必须单独记录 shell exit |
| G9b1 | 引用的 iot-final/PC 文件不存在，terminal 浏览器状态冲突 | 所有回执引用文件存在；实际触及模块门禁通过且计数可复算；IoT 变更有真实日志；terminal 的 browser_status 与 browser tool result一致 | G9a1 同一候选 | 文件清单、模块总计、迁移终点、IoT结果、Web结果、terminal字段 | 不得引用未落盘附件或自造豁免 |

## 4. 允许修改文件与命令

允许修改仅限：

- Server：OpenAPI 认证、IoT 租户入口、异步租户恢复、SSO state/白名单/绑定/审计、租户有效性、表单租户唯一性、生产安全配置及其直接测试/迁移/devseed。
- Web：LoginPage、SSO API/回跳/绑定页、工作台或路由权限守卫中被 G4b/G5c 证实需要修复的文件及直接测试。
- product：只新增 stage-i5-v0.0.3-oa-iteration-04.md 与 evidence/i5-04/；不得修改历史回执/审查/证据。

若需修改不属于上述功能面的业务文件，先在回执登记原因并保持 PENDING，不得顺手扩张。

允许命令和固定顺序：

1. 生成 evidence/i5-04/object-ledger.md，先记录对象与当前 Server/Web SHA。
2. 逐原子执行真实 HTTP/API/SQL/浏览器/受控对端；每项独立原始文件，不合并成无标签总流。
3. 修复后只重取受影响证据；锁定项不重验。
4. 最后候选确定后，生成 oldSHA..finalSHA 文件清单并判断旧证据是否失效。
5. 按两仓工程宪法运行受影响门禁；IoT 若变更必须有真实 IoT 模块日志，不得引用不存在文件。
6. 工具生成 manifest，另存 verify stdout、stderr、exit；回读附件清单。
7. 最后才写 iteration-04 与 terminal。

禁止推送、破坏性数据库操作、读取或写出真实秘密、覆盖历史失败输出、用未知路径/匿名/停用账号替代指定对象、改方向或状态。

## 5. 每个证据包必备字段

每个原子项单独文件，首部必须包含：

- atomic_id、captured_at、server_sha、web_sha、environment、database；
- tenant_id、actor/user、object IDs 或 digest；
- request method/path/bodyHash 与 response transportStatus/businessCode；
- SQL/query 及 before/after 行数；
- 正向断言、反向断言、实际布尔结果；
- cleanup 或进程退出/端口关闭结果；
- 未覆盖边界。

浏览器文件另加 viewport、currentUrl、visible/hidden selectors、network statuses、storage key/value-digest。受控对端文件另加 outbound host 与 before/after count。

## 6. 相对一级提示的新增/收紧

- **删除**：删除已成立的 H2 同键、部分流程链、prod CAPTCHA/RSA/JWT/AES、WECOM 重放、顺序跨租户绑定、撤权/停用、历史门禁重复工作。
- **原子化**：把 G2a 按 OpenAPI/IoT/异步拆开；把凭据、三 Provider 协议、浏览器、审计、候选封装分别缩为单一可判定项。
- **替代路径**：孤立摘要改为逐文件带身份字段；未知路径改为真实存在入口；停用无权用户改为未停用无权用户；声明式哈希校验改为独立退出附件。
- **提交条件**：除 G8 外所有行的正向与反向布尔值均为 true，引用附件全部存在，证据 SHA 与最终候选一致或有不失效 diff 证明，才允许 remaining_actionable_count=0。

## 7. 提交前矩阵

- [ ] G1a1—G7b1、G9a1—G9b1 每项都有独立附件和完整字段？
- [ ] OpenAPI 合法签名不再是 3002，IoT/异步使用真实有效入口？
- [ ] 三 Provider 都完成非真实秘密所能覆盖的白名单/state/code/UI 矩阵？
- [ ] 无权用户未停用且返回权限 403，PC/移动证据文件均存在？
- [ ] DENIED/digest 筛选真正命中记录，零残留扫描没有自命中？
- [ ] 对象账本 SHA、行为证据 SHA、最终 SHA 已勾稽？
- [ ] 所有引用附件存在，manifest verify 与浏览器状态无自相矛盾？
- [ ] G8 若仍缺条件保持 PENDING/dependency_satisfied=false，其余项真实关闭？

下一回执：

product/v0.1.0-oa-completion/receipts/stage-i5-v0.0.3-oa-iteration-04.md

证据目录：product/v0.1.0-oa-completion/receipts/evidence/i5-04/

合法终态仍为 VERIFYING / EXECUTION_SUBMITTED。不得写 PASSED/COMPLETED、核销 P60/P31、推送、进入阶段三或开始 I6。
