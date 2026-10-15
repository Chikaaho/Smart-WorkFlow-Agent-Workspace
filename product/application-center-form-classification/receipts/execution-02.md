# 应用中心补充执行回执 02

2026-10-15｜Executor｜L｜补充提示01（`planning-execution-prompt-application-center-01.md`）｜状态：待规划复验

本回执按补充提示01 §5 的“G 编号 → 原始文件位置 → 实际结果 → 适用边界”组织；既有原件交接见 §1，缺口矩阵见 §2，
本轮的实现变更（确证缺陷修复）见 §3，回归与限制见 §4—§5。未新增产品需求，未新增 P 编号，未写 PASSED/COMPLETED。

---

## 1. 既有原件交接（提示 §2；不触发重复验证）

execution-01 与本轮相关的原件已保存到功能目录内可直接读取位置（本机留存，`product/**/evidence/` 规则不入 Git）：

| 目录 | 内容 | 说明 |
|---|---|---|
| `receipts/evidence/execution-01/` | 截图 5 张（应用管理、应用中心、数据列表、跨租户空态、未授权 403）+ `fulltest-summary.txt`（模块级计数、3 项失败明细与原因、P64/P62 参与情况）+ `INDEX.md` | 原件来自 2026-10-15 21:2x 可见会话与 21:5x—22:31 全量运行；原始日志保留在 `/tmp/app-center-server-fulltest2.log`（未改动、未重新封装） |
| `receipts/evidence/execution-02/` | 本轮截图 9 张 + `g1-chain-result.json` + `g2-rejection-matrix.txt` + `targeted-tests-summary.txt` + `INDEX.md` | 本轮新产生原件；原始日志 `/tmp/ac02-server.log`、`/tmp/ac02-web.log` |

定位说明（提示 §2 的“原件定位事项”）：全量测试最终有效原文为 `fulltest2.log`（**2072/3/0/27 BUILD FAILURE**，模块级计数见摘要文件）；
`fulltest.log` 为同轮前一次运行（口径与最终值不同，不作为结论）；两者为包含关系，不相加形成新总数。3 项失败的原始原因
（受控 MQTT broker 未就绪、预订命令 60s 内未达 SENT、PG 启动窗口崩溃用例 expected 1L）已摘录，本轮未为其重跑全仓。
AC01/AC02 的配置与双设计器原件沿用 execution-01（未重跑，理由见 §4）。

---

## 2. 唯一剩余缺口矩阵结果（G1—G4）

### G1 / AC03 — 审批结果闭环与分页隔离

| 项 | 原始文件位置 | 实际结果 | 适用边界 |
|---|---|---|---|
| 发起人填写并发起 | `evidence/execution-02/ac02-evidence-g1-initiated.png` | ac_sub 在可见会话提交「G1 可见会话-报销申请 / 2580」，页面回「我发起的」显示 **20261015-003 In progress**（实例已建） | 本地 dev（H2）可见会话；表单 `ac_reimburse` 绑定「报销审批流」 |
| 待办对应同一记录 | `evidence/execution-02/ac02-evidence-g1-approver-todo.png` | ac_appr 待办出现 **20261015-003 报销审批流 / Pending review / 业务号 84731bbe-14a6-4947-91cb-817144707a71**（= 上述记录 ID） | 指派审批人=ac_appr（流程设计指定用户） |
| 任务详情即该记录数据 | `evidence/execution-02/ac02-evidence-g1-task-detail-form.png` | 任务详情「表单数据：费用说明=G1 可见会话-报销申请、金额=2580」——任务与记录一一对应 | 详情经真实接口读取（服务端 200） |
| 有权审批人完成 | `evidence/execution-02/ac02-evidence-g1-approver-processed.png` | 审批同意后已办出现该条：部门审批 / 报销审批流 / `ac_reimburse` / 84731bbe-… / **完成 23:40:31**；服务端日志 `审批已完成` → `流程已结束，实例状态更新为 APPROVED` | 审批动作经命令通道（TASK_APPROVE）受理并执行 |
| 发起人看到最终结果 | `evidence/execution-02/ac02-evidence-g1-initiator-result.png` | 发起人「我发起的」：**20261015-003 Approved**（与已办同一实例） | 结果对发起人可见 |
| 列表记录对应 | `evidence/execution-02/ac02-evidence-g1-data-list.png` | 应用内报销单数据列表 **Total 3**，含该记录（费用说明/金额/时间） | 用户端数据列表 |
| 真实翻页与跨表单隔离 | `evidence/execution-02/g1-chain-result.json` | 报销单 `pageNum=1&size=1` 与 `pageNum=2&size=1` 各返回不同记录、`total=3`；差旅单（另一表单）3 条记录与报销单记录 **交集为空** | 真实接口结果（补足分页/隔离断言） |
| 空数据/失败态 | execution-01 原件（`ac03-form-data-list.png`、跨租户空态） | 空列表与失败态沿用首轮可见结果，本轮未重跑 | 同上一轮环境 |

### G2 / AC04、AC06 — 直连接口与授权（含“旧入口绕过”）

矩阵原件 `evidence/execution-02/g2-rejection-matrix.txt`（27 项，逐项含方法/路径/HTTP/code/msg），全部 PASS：

| 组 | 结论要点 | 关键实际结果 |
|---|---|---|
| A 正向可用 | 范围内用户列表/详情正常 | 200 / code=0 |
| B 范围外（SPECIFIED 未命中，且持有 query+submit 权限） | 列表、**直链详情**、提交/发起全部被拒；拒绝不产生记录 | 均 `code=1700`（按不存在）；回读 total 不变（3→3） |
| C 指定空集合 | 空集=无人可见（不误作全员） | 普通用户与 **超管均** `code=1700` |
| D 无查询权限 | 数据接口不可调用 | HTTP **403**（服务端权限拒绝，非前端隐藏） |
| E 跨租户 | 列表/提交/指定应用对象直读均被拒 | `1500` / `1000` / `1700` |
| F 非超管行范围 | SELF 用户仅见本人记录（titles=['SELF 记录 2','SELF 记录 1']），ALL 用户见全部（total>SELF 可见数） | 既有 ALL/SELF/DEPT… 行范围继续生效 |
| G 停用/恢复 | 停用后新列表/新发起被拒（`1702`，且未新增记录）；**本人提交记录详情保留**、**原办理人（流程参与关系）可读记录**、**原任务仍可办理并结束为 APPROVED**；恢复启用后列表按当前权限恢复（total 3→4，停用期间零新增） | 停用不等于取消运行实例 |
| H 管理权与数据访问分离 | 持有应用管理权的 admin 不在该应用 SPECIFIED 集合内时，数据列表同样 `1700`；应用管理接口不受影响（list→200，3 个应用） | 列表/详情/直链/真实接口一致（§5 列为需规划确认的语义） |

可见态原件：范围外用户应用中心只见「全员应用」（`ac02-evidence-g2-out-of-scope-appcenter.png`）；
SPECIFIED 命中用户的中心可见「报销应用」「全员应用」、空范围应用不出现（`ac02-evidence-g2-appcenter-scope.png`）；
管理端数据页对不可见应用给出明确失败态并带事件引用（`ac02-evidence-g2-admin-out-of-scope-denied.png`）。

### G3 / AC05、AC06 — 升级前后连续性（含停用后旧待办）

测试：`ApplicationCenterUpgradeContinuityTest`（H2 全链 + **真实 Flowable 引擎**，4 例全通过；输出见 `targeted-tests-summary.txt`）。
场景：先迁移到 0.1.5 基线 → 写入存量夹具（分类 201/202、事项、表单 `lc_expense`/`lc_shared`、已发布快照 v1、物理表与记录 `rec-continuity-1`、实例台账）
→ 用真实引擎发起流程并留下运行待办 → 应用增量迁移 `V20261015190000` → 断言：

| 断言 | 实际结果 |
|---|---|
| 存量记录可读且字段未变、未被逻辑删除；迁移零新增记录/实例 | 通过（title 保持、deleted=0、物理行数与实例台账不变） |
| 冻结版本未被改写、未生成新版本 | `form_version=1` 保持；快照内容逐字未变；`sw_form_snapshot` 计数不变 |
| 事项→表单绑定与分类关联未被静默改写 | 通过（form_key / category_id 保持） |
| 唯一分类表单承接、跨分类共用表单歧义保留 | `form-expense`→`lc201`；`form-shared` **app_id 仍为 NULL** |
| 运行任务升级后可定位 | 升级后查到**同一 taskId=11 / 同一实例=4**、assignee 不变 |
| **停用承接应用后原办理人仍可办理原任务** | 停用后待办仍在 → 办理完成 → 运行实例归零、历史实例保留、记录未丢 |

### G4 / AC07 — 恢复边界

测试：`ApplicationCenterRecoveryDrillPostgresTest`（真实 PostgreSQL 16.15，隔离库 `ac_g4_recovery_drill`，1 例通过；输出同上）。实际路径与结果：

1. 隔离库迁移至 0.1.5 基线并写入存量对象（表单/冻结快照/业务记录/实例台账），读回 forms=1、menus=137、record=1；
2. 升级前 **`pg_dump -Fc` 全库备份**（349,118 bytes，备份文件成功后用于恢复）；
3. 应用增量迁移 → 版本 `20261015190000`、增量表就位、承接应用 `lc201` 存在、菜单无重复插入；
4. 恢复：**就地覆盖恢复到已升级库被明确拒绝**（`pg_restore` exit=1，447 errors ignored）——符合“恢复需空库”的前置条件；
   按声明路径删库重建后 `pg_restore` **exit=0**；
5. 恢复到已声明边界：增量表消失、版本回到 **0.1.5**、表单/菜单/记录数一致、记录字段值保持、快照保留；
6. **恢复后读写链可用**：更新值成功、插入新记录成功（2 条有效），并可**再次升级**到 `20261015190000`（增量表重新就位）；
7. 演练库与备份文件在本轮内清理（仅清理本轮精确对象，未触碰 V94 旧库与 UAT）。

---

## 3. 确证缺陷与修复（本轮唯一实现变更）

**缺陷（G2 实测确证，含修复前对照）**：应用范围与停用状态此前只在用户端应用中心的内容接口生效；对**表单数据列表/详情/提交（即发起）接口无服务端约束**——
范围外用户只要持有 `form:data:query`/`submit` 即可用直连接口读写，停用应用亦可继续新发起；即“前端不请求”不构成服务端保护，“旧入口绕过”真实存在。

**修复前对照（实际运行，非推断）**：在修复前提交 `72822bc` 的独立构建上（独立工作树 + 独立实例 8081，dev H2，同一 G2 场景夹具），
范围外用户直连同一接口得到：`POST /form/data/prefix_form/query` → **HTTP 200 / code=0**（无约束）；
`POST /form/data/prefix_form` 提交 → **HTTP 200 / code=0** 并返回 `recordId=e4aa3c3b-…`，回读 `total=1`（越权记录已落库）。
原件：`evidence/execution-02/prefix-bypass-reproduction.txt`。修复后同一场景在本轮回执 §2 G2 矩阵中为 `1700` 且零副作用（B 组）。
对照实例与工作树已在本轮内停止并清理，未驻留后台进程。

**修复**（Server，`feature/application-center`）：

| 变更 | 位置 | 语义 |
|---|---|---|
| 新增应用范围访问闸门 | `sw-biz-form-biz` `service/FormAppAccessGuard.java` | 判定 `UNRESTRICTED`（未绑定应用）/`VISIBLE_ENABLED`/`NOT_VISIBLE`（按不存在）/`DISABLED`；无登录态 fail-closed；判定失败按不可访问处理 |
| 列表/查询接入 | `FormDataQueryService.doQueryFormData` | 新访问（批量浏览）要求应用可见且启用；拒绝发生在查询前 |
| 记录级读取接入 | `FormDataQueryService.getRecordDetail`、`FormDataUpdateService.updateRecord` | 应用不可见/停用时保留**合法历史访问**：本人提交（`create_by`=当前用户）或流程参与关系（复用既有 `FormRecordAccessPort` 的发起人/办理人/参与人快照判定），两者都不满足才拒绝 |
| 提交（含发起）接入 | `FormSubmitService.submitForm` | 拒绝发生在**任何写入之前**——不产生记录、不产生实例；系统/派发归属提交（`recordOwnerUserId` 非空）走独立受控通道，不由本闸门判定 |
| 判定失败关闭 | 上述全部 | 查询异常一律按不可访问（fail-closed），不放大任何数据范围 |

定向测试：`FormAppAccessGuardTest`（H2 + 真实租户拦截器，7 例全通过）覆盖：未绑定应用不回归、范围外拒绝且零副作用、空集合无人可见、
停用后本人历史与更新保留、收窄后原办理人/参与关系保留且非参与人按不存在拒绝、跨租户（含跨租户 appId 判定）、ALL 语义。

**未纳入本轮守卫面的入口（如实列出）**：`/form/data/{formKey}/template|import|export`、`/form/ext/query/{queryKey}`、
以及不产生表单记录的纯系统发起通道（定时/命令批处理，属受控系统动作）。这些入口的权限口径未变，本轮未实测其应用范围一致性；
如需覆盖，请规划裁决后再实施。

---

## 4. 回归与门禁

| 项 | 结果 | 说明 |
|---|---|---|
| `sw-biz-form-biz` 全量 | **202 / 0 / 0 / 0**（BUILD SUCCESS） | 上轮 195→本轮 202（+7 = 新增守卫测试），零回归 |
| `sw-bootstrap` 定向回归 | 30 例：**29 通过 + 1 例 flaky 复跑通过** | 覆盖 P62 事务动作/冻结语义、P64 迁移锚、应用中心迁移三类；失败项 `P62UpgradeGatePgTest.upgradeConsumesLegacyTypesKeepsHistory`（命令未被领取）单独复跑 **2/0/0 PASS**，属命令领取时序竞争（与上轮同类 flaky），且同一用例在上一次全量中原为通过 |
| 既有后台数据管理页（受影响路径复验） | 通过 | 全部用户可见范围的应用表单：admin 在后台数据页正常列表（原件见 §2 G2 可见态）；SPECIFIED 不含本人时给出明确失败态（同文件） |
| 双设计器/应用目录 CRUD/引用保护/全链迁移/Web 四连 | **未重跑** | 本轮未改动这些路径的实现；受影响面仅为表单数据读写接口，已用上述定向与可见会话复验覆盖。若规划认为需要，可另行安排 |
| 未变更 | 错误码目录（复用 1700/1702）、i18n、迁移脚本、菜单授权、Web 代码 | 本轮零 Web 变更、零迁移变更 |

---

## 5. 限制、边界与待规划确认

1. **管理员与应用范围的口径（请规划确认）**：本轮按“列表、详情、直链和真实接口必须一致”实现为**不含管理权豁免**——持有 `form:app:manage` 的管理员若不在该应用范围内，其数据页/数据接口同样按不存在拒绝（应用管理接口不受影响，可自行把本人加入范围或改为全部用户）。若规划要求管理权在数据面保留旁路，请裁决后调整。
2. **可见范围不放大数据范围**：应用可见性只作为附加约束，不改变既有 `form:data:query` 与 ALL/SELF/DEPT/DEPT_AND_CHILD/CUSTOM 行范围；
   本次两处语义已分别验证（G2 F 组）。
3. **环境代表性**：G1/G2 在本地 dev（H2）可见会话与真实登录身份下取得；G3 在 H2 全链 + 真实引擎；G4 在本地 PostgreSQL 16.15 隔离库。
   三者均为**代表性场景**，不冒称 UAT 或生产；UAT 存量分布仍为未知（提示 §4 已明确不阻塞）。
4. **迁移与代码的部署边界**：本轮迁移为“加表加列 + 确定性承接”，新代码读取新列，因此**代码与迁移需同时上线**（不支持“新代码 + 旧结构”或“旧代码 + 新结构”的滚动窗口）。
   旧代码切回路径由既有 P64 回退边界观察覆盖（旧迁移集对在役库 validate 必须失败，本轮复跑通过）；恢复路径为升级前备份 + 全库恢复（G4 实测）。
5. **超管在用户端不短路应用范围**（沿用首轮语义，已在 G2 C2/H 实测体现）。
6. 未执行：发布分支合并、tag/Release、部署、UAT 变更；未改 V94 旧库；未输出凭据；未做产物哈希。
7. 环境清理（本轮精确对象）：修复前对照实例（8081）与其工作树已停止/移除；本轮自建的 dev 实例（8080，H2 内存库）与 vite（5173）已停止；g4 演练库与备份文件在演练内删除；未停止或改动用户既有服务。

---

## 6. 本次 Git 摘要

| 仓 | 分支 | 提交 | 说明 |
|---|---|---|---|
| Smart-WorkFlow-aPaaS-server | `feature/application-center` | `ed54e10` | 应用范围闸门实现 + 三处接入 + 守卫测试 + G3/G4 验证（不含 Web 变更） |
| Smart-WorkFlow | `develop-sw` | `8981922c` | 本回执、本轮原件索引、knowledge 三入口 VERIFYING 同步、两仓 gitlink |
| Smart-WorkFlow-aPaaS-Web | — | 无变更 | 本轮零 Web 变更 |

推送后回读：Server `ed54e10` = `origin/feature/application-center`，根 `8981922c` = `origin/develop-sw`（均一致）；Web 仓无变更。

---

## 7. 自验结论与唯一下一动作

- G1—G4 的**完成条件与必要反向断言**均已取得原始结果：审批链闭环与真实翻页/隔离（G1）、直连接口正反向与无副作用回读（G2）、
  升级前后记录/版本/运行任务连续性及停用后旧待办续办（G3）、真实恢复边界与恢复后读写可用（G4）；AC01/02 原件已按要求交接。
- 本轮同时修复了 G2 实测确证的产品缺陷（数据/发起接口缺少应用范围服务端约束），并给出定向测试与可见会话复验。
- 状态：功能 **VERIFYING**、阶段 **2/1/1**；未新增 P 编号、未增加功能数、未写 PASSED/COMPLETED。
- **唯一下一动作：Planner 复验 execution-02（含 §5 待确认口径）**。
