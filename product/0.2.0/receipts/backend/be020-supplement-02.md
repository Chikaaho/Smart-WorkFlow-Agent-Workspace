# be020-05 续办执行：授权写真实拒绝与部分失败有界恢复

2026-10-24｜Executor（后端）｜XL｜IN_PROGRESS｜补充自验通过，待规划复核

总 7 阶段：已完成 1「需求评估」；进行中 1「分支实施」；未开始 5「验收同步、合并、发布、发布后同步、结束」。本回执只处理 `planning-execution-prompt-backend-020-02-owner-authorized.md` 的两处余项（Owner 2026-10-24 裁决「授权继续，仅补齐这两处原要求」）；既有准入、事务、迁移与受控执行链结果沿第二轮复核锁定的范围承接。

Server 消费快照：`6995f88351c8adad19906433d820ecd2451fc4a8`（普通推送，`origin/codex/0.2.0-tenant-form-flow` 回读同 SHA；前置 `b3aadbe`）。开工核实：HEAD 为 `b3aadbe`、工作树干净、无在途修改。

## BE020-G1 余项：grants 替换写请求的实际拒绝

新增 `ExternalDatasourceGrantsWriteAdmissionTest`（bpm-engine）：真实 HTTP（MockMvc）→ **真实 springSecurityFilterChain**（401/403 处理器、STATELESS）→ **真实方法级鉴权代理**（`@EnableMethodSecurity` + `@ss.hasPermi` 实际求值，非注解存在性检查）→ 真实 `ExternalDatasourceController` → 真实授权服务与 mapper → **真实 H2 持久表 + 真实租户拦截器**（`CommonTenantLineHandler` 按请求身份注入租户条件）。固定对象：租户 1 数据源 `id=9`（授权集合 `USER:77`）、租户 2 数据源 `id=20`（授权集合 `USER:88`）。

| 主体与目标 | 实际结果 |
| --- | --- |
| 本租户已认证、无 `workflow:datasource:manage`（租户 1 用户 78，权限仅 `form:design:save`）→ 直接构造 `PUT /api/workflow/external-datasource/9/grants` | **HTTP 403**（方法级鉴权实际拒绝）；持久回读：数据源 9 授权集合仍 `USER:77`、数据源 20 仍 `USER:88`，零变化 |
| 另一租户主体持本租户合法管理权限（租户 2 用户 88，权限 `workflow:datasource:manage`）→ 对租户 1 数据源 9 构造同请求 | 通过权限位后进入服务层，`requireExisting` 经真实租户过滤按不可见拒绝（`外部数据源不存在: id=9`，BaseException 业务拒绝，随实际包络记录，未伪造 HTTP 403）；持久回读：租户 1 与租户 2 授权集合均零变化 |

合法管理员正向替换基线沿既有证据承接（`ExternalDatasourceControllerTest.grantsEndpointsDelegateAndRequireExistingDatasource` 的委派与数据源不存在拒绝、`FormExtQueryAdmissionTest` 的授权端口持久读取），本批未新建正向夹具。未发现真实缺陷，无需产品代码修改——既有 `@PreAuthorize` 网关与租户过滤在该写路径上行为正确，此前只是缺该强度的直接证据。

## BE020-G2 余项：同一监听部分失败后的有界恢复

新增 `TriggerPartialFailureRecoveryTest`（bpm-process，复用既有 `QueueH2TestConfig`：真实 H2 + 真实 bpm 迁移 + 真实 `PersistentBpmCommandQueue`/租户/乐观锁拦截器 + 真实审计填充）。场景：同一合法监听（`trg-1`，PROCESS_COMPLETED，APPROVED 终态、同事务阶段）一次评估派发两个动作（稳定标识 `act-1`/`act-2`，各自进入 `P64ACT:{execKey}:{actionId}:{itemKey}` 命令键与 `sw_bpm_action_ref` 引用行）。受控接收端为测试内效果计数器；失败用既有队列 `reject` 语义（消费前安全门禁：零副作用、落终态 FAILED 与原因）；恢复用既有合法入口 `ActionRefRecoveryService.retry`（复审05 P1-06b），物理租约/状态/同键复用沿现有 `sw_bpm_command` 机制，未发明新表或重试体系。

| 阶段 | 实际持久结果 |
| --- | --- |
| 首次执行 | 一个事务内受理 2 条命令（act-1/act-2 各一）+ 2 条动作引用；接收端效果 0/0（尚未消费） |
| act-1 完成 | `claimDue` 领取 → `complete` → 终态 `COMPLETED`，结果 `{"status":"OK","action":"act-1"}` 持久；效果计数 **1** |
| act-2 受控失败 | `reject` → 终态 `FAILED`，`failure_reason` 精确保留「受控失败：act-2 接收端安全门禁拒绝（明确无未知副作用）」、`result={"status":"REJECTED"}`、retry_count=0；接收端效果 **0**（零副作用） |
| 恢复（既有入口） | `ActionRefRecoveryService.retry(ref-act-2)` → `INTENT_SUBMITTED`：**复用同一命令行**（同键不新插）重置 PENDING、清失败现场、引用行标记 INTENT_SUBMITTED；命令 ID 与失败前一致 |
| 恢复后完成 | 重新领取同一命令 → `complete`（结果含 `recovered:true`）；效果计数：act-1 保持 **1**（不重复执行）、act-2 恰好 **1**（首次失败零效果 + 恢复后一次成功） |
| 最终去向解释 | act-1：一次成功（COMPLETED + 结果在库）；act-2：同一命令行 FAILED（原因在库，阶段中回读留证）→ 恢复 → COMPLETED（结果含 recovered 标记）；全库仅 2 条命令行、2 条引用——无恢复代新行、无第二实例、无整业务重发 |

「仅将 FAILED 行可诊断等同于恢复已发生」被排除：恢复以接收端效果计数（act-2 由 0 → 1）与同一命令行终态 COMPLETED 证明实际发生。已取得的整事件重复投递去重、回滚零外发、旧阶段等结果沿上一轮锁定，未作为本余项替代。

## 工程验证

- `MAVEN_OPTS="-Xmx2g" mvn test -pl sw-biz/sw-bpm/sw-bpm-engine,sw-biz/sw-bpm/sw-bpm-process -am`，exit 0：**bpm-engine 177 / 0 / 0 / 0**（175 + 2）、**bpm-process 467 / 0 / 0 / 0**（466 + 1）。原文 `/tmp/g1-write-test.log`、`/tmp/g2-recovery-test.log`、`/tmp/g1g2-supplement2-full.log`（本机 Temp 留存）。
- 本批仅新增测试资产（2 文件 +617），无产品代码修改、无迁移变化；form/engine 既有基线不重跑（实现未变）。

## 边界与下一动作

- 两处余项均已取得真实行为结果，提交规划复核（同项既有两轮记录延续 Owner 授权口径）；自验不裁决整版 PASSED/COMPLETED。
- 前端对接解释（运行读取 formKey+fieldKey 等）沿 be020-supplement-01 承接；密钥版本化、三节点语义、富文本交接仍为规划/协作待办。
- 授权内常规决定：G2 恢复场景使用同事务阶段触发（部分失败恢复与监听提交阶段正交，后者已由上轮锁定）；G1 跨租户拒绝记录为业务包络（BaseException）而非伪造 HTTP 403。
