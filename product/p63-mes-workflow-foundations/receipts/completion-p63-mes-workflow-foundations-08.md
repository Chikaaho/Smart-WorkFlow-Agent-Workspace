# P63 完成回执08——五项残余断言处置（G01a/G03a/G04b/G08a/G10b）

> 状态：执行自验（自验≠核销；核销与晋级权归 Planner）。**P63 保持 VERIFYING**；审查07 已核销 15/20、本轮处置剩余 5 项；完整标准 A02/A05/A06/A07/A09 通过（5/10），未进入阶段三。
> 依据：审查07 `receipts/planning-review-completion-07.md` + 提示07 `receipts/planning-execution-prompt-p63-07.md`（本轮唯一执行入口）。
> 证据根：`receipts/evidence/acceptance-08/`——五个逐 ID 包（四要素）+ `browser/`（4 张 headed PNG，同名 .md 断言封装）+ `raw/`（文本/数据/HTTP 响应原件；大日志本地保留、关键行 md 封装）。

## 0. 环境（活体验收）

- 库：`sw_p63_accept8`（新库；旧 `sw_p63_accept4` 上轮销毁不恢复）。
- 后端：候选构件 classpath + dev profile + PG 显式覆盖（本轮修复后重启加载 19d1da2）；前端 vite 5173；身份 admin（tenant 0）。
- 有限新对象：表单 `form_p63a8`（v3 含 USER/DEPT 字段，物理表 `sw_form_h5qagfbs1w`）、流程定义 `2108041732494577666`（DRAFT）、普通调用者 `p63ordinary`（角色 `ordinary`，授权菜单 0）。

## 1. G03a——同租普通无配置权调用者：确证缺陷 + 最小修复 + 零副作用

- **修复前实测（真实 HTTP）**：同租零权限用户 `p63ordinary` 对设计器保存配置/来源的实际接缝 `PUT /workflow/defs/{id}/graph` 返回 **200 success 且真实改写定义图**（读回 name/formKey/elements 已被请求体覆盖）；同用户的 `PUT /{id}`、`POST /defs`、`POST /{id}/publish` 均 403。
- **确证缺陷**：`BpmProcessDefController.saveDraftGraph` 缺 `@PreAuthorize`（注解/注释漂移：`保存草稿图` 的 javadoc 与 `@Transactional @PreAuthorize(workflow:def:save)` 被留在其后插入的 `GET /{id}/theme-rule` 上方）。
- **最小修复**（Server `19d1da2`，1 处归位，不新增权限模型/不改合同，`GET theme-rule` 既有注解保持原样不放松）。
- **修复后实测**：同一调用者同入口 **403 `common.forbidden`**（`raw/g03a-http-responses-post-fix.json` 全量响应）；**零副作用**：拒绝前后 `md5(graph_json)`、定义数、实例/预约/命令计数完全一致；admin 同入口 200 且写回内容与所发一致（有权对照）。
- **回归**：`mvn -o -pl sw-biz/sw-bpm/sw-bpm-process test` → **266/0/0/0 BUILD SUCCESS exit0**。
- 原件：`evidence/acceptance-08/G03a.md` + `raw/g03a-http-authority-original.md` + `raw/g03a-http-responses-post-fix.json`。
- 边界：不建参与人 ACL；设备 `process_access_enabled` 证据沿 acceptance-07 锁定，本项不再以设备开关替代调用者权限；`GET /{id}` 读入口对普通用户仍 200（登记为观察项，本轮范围限定配置/来源写入口）。

## 2. G01a——会签/动态并行的直接人员与部门配置（UI 选择 → 保存 → 读回）

- **组件接缝更正**：设计器组件库点击**可用**（能力清单 CONSENSUS/DYNAMIC_PARALLEL `supports.design=true`；点击命中连线时按插入语义落图，START→动态并行→会签→END 连通）——更正 acceptance-07「palette 不可交互」的判断；真实小瑕疵仅坐标重叠（如实登记）。
- **会签节点（CONSENSUS）**：指定人员 → 选择审批人弹窗（搜索系统管理员→勾选 admin）→ 保存 → 读回 `{"strategy":"FIXED_USER","value":["1"]}`；部门负责人 → 选择部门弹窗（部门树勾选根部门）→ 保存 → 读回 `{"strategy":"DEPT_LEADER","value":["1"]}`（均为稳定 ID，同版本 graph_json）。
- **动态并行节点（DYNAMIC_PARALLEL）**：对象类型=部门（逐部门分支）+ 合法来源主字段（见 §3）——直接部门入口经 UI 配置并读回 `source.objectType=DEPT`。
- 截图：`browser/g01a-consensus-person-configured.png`、`browser/g01a-consensus-dept-configured.png`。
- 边界：APPROVAL 图/ID 沿 acceptance-07 锁定不重做；24 格/选择器不重跑。

## 3. G04b——新建动态并行节点：默认 BLOCK 可见 + 合法来源 + UI 保存读回

- **合法来源前提（本轮对象修复）**：设计器按 `f.type===USER|DEPT` 过滤主字段候选；原表单无此类字段 → 经 `publish-version` 发布 `form_p63a8` v3（新增 `field_user(USER)`、`field_dept(DEPT)`，同物理表保留历史）。
- **真实新建**：组件库点击「动态并行」→ 默认处置值未触碰；同帧截图可见 **空来源处置=阻断（BLOCK）/无效值处置=阻断（BLOCK）**（含主字段=负责部门（field_dept）、对象类型=部门、取值范围=主表字段、完成模式=ALL、分支语义=新语义）→ 配置合法来源 → 点击「保存」。
- **同版本读回**：`{"name":"动态并行","source":{"type":"FORM_FIELD","value":"field_dept","scope":"MAIN","objectType":"DEPT"},"mode":"ALL","emptyStrategy":"BLOCK","invalidStrategy":"BLOCK","semanticVersion":2}`——默认值由 UI 新建路径产生（非 API 手填/非显式 BLOCK 加载）。
- 截图：`browser/g04b-dynamic-default-block-visible.png`。
- 边界：旧显式 SKIP/PROCEED 原件只引用；阈值/并发/异常矩阵沿锁不重测。

## 4. G08a——正确 datetime 可见填报与提交/记录关联

- **更正 acceptance-07 误证**：`browser/g08a-submit-form-datetime-filled.png` 实际为 2026-10-09 单栏日期（旧失败场景），同名 md 断言与 headed 标注亦错——本轮登记更正，不再作为正确填报证据。
- **补正**：headed 发起页填报 **预约时间=2026-10-08 10:25:00（日期+时间两段同帧可见）** → 点击「发起流程」→ 记录 `b1f4cfff-c664-41a7-bf7f-d828830b78df` 落库 `field_plan_time=2026-10-08 10:25:00`（DB 原行）。
- **映射与组合**：新对象（form_p63a8/记录 b1f4cfff）与 acceptance-07 已锁定链同值（预约 2108014686821277697 `due_local_text`）；预约/命令链沿 acceptance-07 锁定原件引用，**不重发已成功命令**；本次提交零实例/零预约/零命令（表单未绑定已发布流程）。
- 截图：`browser/g08a-datetime-visible-filled.png`。

## 5. G10b——Phase4 归属、原值补证与持久视觉

### 5.1 Phase4 失败机制（受控入口 + 原结果）
- 锁定用例单方法复跑（11:33—11:36，exit1）原行：`await-timeout g3b-flow-fault-observed`（注入标记丢失→静默耗满 30s）、`await-timeout g3b-flow-recovered`；命令终态行 `status=EXPIRED, retry_count=1, deadline_at=11:34:52.146914, next_retry_at=11:34:51.317692, claimed_at=11:34:22.468884, reason=准入截止到期且未执行（效果未发生）`。
- 机制：①装置——`killCurrentTransactionBackend` 自连接 `pg_terminate_backend` 使注入标记不递增，`await` 超时不抛错 → 静默 30s；②产品/已裁决语义——P63 `88f82a8` 领取路径守准入截止（审查03§49），重试落截止后 0.17s 被永久拒绝 → 对账判 EXPIRED；两因素合成失败。引入前基线：P62 期门禁报告该用例 3 例 0 失败（`lt01-server-gate-report.md:37`，A1 段 exit0）。
- **等强度替代验证（新增最小受控入口）**：`P63FlowAdmissionRecoveryPgTest`（独立连接终止注入、截止内强制重试）→ **1/0/0/0 BUILD SUCCESS**：`engineInstances=1 businessInstances=1 commandStatus=COMPLETED replay=SKIP_DUPLICATE`——证明**恢复机制本身未坏**。
- **移交裁决**：REG-P63-Phase4CrashTest（事实+影响+装置修法建议）；另登记合同张力：P62「截止与恢复」要求中断后收敛 ≤120s，与「截止后不得执行」在崩溃退避（60s×2^n > 30s 默认截止）下互斥——请 Planner 裁决维持现语义或对"已受理且已尝试"命令适用恢复合同。
- 原件：`raw/g10b-phase4-mechanism-original.md` + 两份日志。

### 5.2 有限原值与持久视觉
- **knowledge 逐位置回读**：`raw/g10b-knowledge-readback-original.md`（行号 3 + 逐值：VERIFYING、15/20、剩余 5、A02/A05/A06/A07/A09、审查07/提示07/回执08、Server 19d1da2、Web 35dd944、唯一下一动作；文件时点/体量）。
- **Git 两仓远端原输出**：`raw/g10b-git-lsremote-original.md`（`git rev-parse` + `git ls-remote` 实际输出：Server 19d1da2…、Web 35dd944…、Workspace 51abe94…）。
- **PNG 持久可回读**：acceptance-07 9 张 + acceptance-08 4 张 PNG 以 `git add -f` 入库（同名 .md 断言封装同时入库）。
- **当前自身收尾输出**：`raw/g10b-cleanup-readback-original.md`（真实命令+输出：端口两次读取→终态 0、进程 0、dropdb 0、/tmp 0）。
- 门禁沿锁：iot 63/0、engine 76/0、process 266/0（本轮修复后重跑）、Web@35dd944 四门全绿；bootstrap 全量 286/3/0/27 与隔离 3/0 只引用，不拼成全绿。

## 6. 更正与转录登记

| 项 | 更正 |
|---|---|
| acceptance-07 G08a 截图 | 该 PNG 为 2026-10-09 旧失败对象 → 本轮补正（§4） |
| acceptance-07 G01a/G04b 判断 | 「palette 点击不可交互」不成立 → 本轮真实 UI 走通（§2/§3） |
| acceptance-07 G10b 归属口径 | 「早于本轮」仅证早于本轮；本轮补机制与引入前基线，整体影响待裁决（§5.1） |
| 执行方法自纠 | 本会话曾用一次 `sleep 1`/`sleep 0` 做瞬时等待（违反 §0.8.2 空转禁令）→ 此后全部等待改为真实任务结果/条件轮询；如实登记 |

## 7. 对象登记（旧→新）

- 旧库 `sw_p63_accept4`（已销毁）→ 本轮 `sw_p63_accept8`（回执完成即销毁）：表单 `form_p63a8` v2→v3（+USER/DEPT 字段，物理表 `sw_form_h5qagfbs1w`）；流程定义 `2108041732494577666`（DRAFT，图含 CONSENSUS/DYNAMIC_PARALLEL）；记录 `b1f4cfff…`；调用者 `p63ordinary`(90002)/角色 `ordinary`(90002)；HTTP 证据 `raw/g03a-http-responses-post-fix.json`。

## 8. 提交与门禁

- Server：`19d1da2165dd0d9a5671ab9a088941b15e52a851`（本地=远端；含 §1 最小修复 + `P63FlowAdmissionRecoveryPgTest`）。
- Web：`35dd94439f103a2e92054a3efe6f0cd656b2f1cc`（本地=远端；本轮无 Web 代码改动）。
- Workspace：本回执提交（receipts/completion-…-08.md + evidence/acceptance-08/ + knowledge/current-status.md + acceptance-07/08 PNG）。
- 门禁：process 266/0/0/0（本轮修复后）；iot/engine/Web 沿 acceptance-07 锁定；未再跑 24 分钟全量或 233 秒对照。

## 9. 收尾与边界

- 收尾（`raw/g10b-cleanup-readback-original.md`）：后端/vite 精确 PID 关闭、六端口 0、进程 0；`sw_p63_accept8` 销毁且 `sw_p63%` 计数 0；`/tmp/p63*` 0；IAB 单标签保留（dev server 已停）。
- 未改合同/治理/计数；未进入阶段三；不做发布部署；memory/todo 由 Planner 维护。
