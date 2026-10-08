# P63 回执09：动态并行直接人员/部门真实选择 + knowledge 当前值完整回读

2026-10-08；Executor。唯一执行入口=提示08 `planning-execution-prompt-p63-08.md`（审查08 `planning-review-completion-08.md`）。P63 保持 VERIFYING，18/20 已核销、剩余 2（G01a/G10b）本轮全部处置；完整标准 A02/A03/A04/A05/A06/A07/A08/A09 通过（8/10）不变。证据根 `receipts/evidence/acceptance-09/`。功能46、清单46/22/22、ADV64 不变；未进入阶段三。

## 1. G01a / A01：动态并行直接人员、直接部门（真实 UI 选择 → 保存 → 同定义读回）

**对象**：admin（tenant 0，真实 HTTP 登录链）；隔离库 `sw_p63_accept9`；流程定义 `2108058719690006529`（processKey `bpm_4b3cd6547136432a`，v1 DRAFT，formKey `form_p63a9`——API 创建/发布仅作 def.formKey 合法绑定前提）；节点 `node_1` DYNAMIC_PARALLEL；headed IAB 1440×900。

**缺口与最小修复（主方向§3.1）**：审查08§4 指认动态并行「固定值」仅自由文本（FORM_FIELD=field_dept 是字段绑定非直接选择）。本轮按ObjectType 分流最小修复（Web，`ProcessDesigner.vue`）：新语义下 objectType=USER→「选择人员」（ApproverCandidatesDialog 人员页签多选）、objectType=DEPT→「选择部门」（同组件部门树多选），确认后回写稳定对象 ID 并触发面板提交；对象类型切换清空旧取值；旧语义文本形状保留（config.source 契约不变）。

**验证中发现并修复第二确证缺陷**：多值 FIXED 以内联逗号串落库被节点校验器拒绝——headed「校验流程」实测提示原文 `校验结果：1 条可判定错误 2310 动态并行 FIXED 来源只能配置正整数对象 ID 定位 node_1`（13:04:22，`raw/p63-backend9.log:307`），并以无状态 `POST /workflow/defs/validate` 对同形状请求确定性复现（`raw/g01a-validate-string-vs-array-original.md` §A）。修复：`node-capabilities.ts buildFixedSourceValue` 将 FIXED 取值落稳定对象 ID 数组（单值同样成组，与 CONSENSUS participant 取值形状及服务端校验一致）+新增 spec 用例。中间态（12:57—13:04 单值字符串/多值逗号串）如实登记于 `raw/g01a-designer-ui-chain-original.md` §3。

**正向证据**：
- 人员：真实弹窗搜索勾选 admin(1)+p63user9(90002) →「已选 2 人（点击修改）」→ UI 保存（PUT graph 200，13:06:45/13:06:54，`raw/p63-backend9.log:341/344`，userId=1）→ 同定义读回 `{"type":"FIXED","value":["1","90002"],"scope":"MAIN","objectType":"USER","semanticVersion":2}`；截图 `browser/g01a-dynamic-direct-user-configured.png`。
- 部门：同节点切换（旧取值清空）→ 部门树勾选 P63验收部门B(90001)（父根部门(1) 联动全选）→「已选 2 个部门（点击修改）·草稿已保存 14:06」→ 读回 `{"type":"FIXED","value":["1","90001"],"scope":"MAIN","objectType":"DEPT","semanticVersion":2}`；截图 `browser/g01a-dynamic-direct-dept-configured.png`；保存请求 `raw/p63-backend9.log:365/368`。
- 稳定身份真实存在：sys_user `1|admin`、`90002|p63user9`；sys_dept `1|根部门`、`90001|P63验收部门B(leader_id=1)`（隔离库内 SQL 种子场景前置对象，非配置产物；选择动作全部经真实 UI 弹窗完成）。
- 服务端校验：两种数组形态 `POST /workflow/defs/2108058719690006529/validate` 均返回 `data:[]`（headed 触发 13:11:45 `raw/p63-backend9.log:350` 与装置复验）。
- 门禁（最终提交树 2b0c660）：typecheck exit0 / lint 0 error-76 warning exit0 / vitest 1364 passed+3 skipped exit0（含新增用例）/ build exit0。环境插曲如实登记：dev server 运行中重生成 `src/types/auto-imports.d.ts`（删 ElMessageBox 声明）致一次 typecheck 失败（TS2304），还原 tracked 版本后 exit0；该文件非本轮意图变更、未随提交。

**边界**：def 未发布，零实例/零预约/零命令；24 格、APPROVAL/CONSENSUS 直配、字段来源链、默认 BLOCK、窄屏等沿审查03—08 锁定事实只引用；Server 零代码变更。

## 2. G10b / A10：knowledge 当前值完整回读 + Phase4 裁决落 REG

- **knowledge 同步与回读**：顶部新增本轮条目（`knowledge/current-status.md:3`）含 VERIFYING、18/20、剩余 2、A02—A09（8/10）、审查08/提示08/回执09、候选身份与唯一下一动作；逐字段完整回读见 `raw/g10b-knowledge-full-readback-original.md`（数据取自提交后 `git show HEAD:knowledge/current-status.md` 第 3 行全文 + 字段抽取，含文件:行号/完整值/时点/命令 exit；不使用截断）。
- **Git 两仓远端原输出**：`raw/g10b-git-lsremote-original.md`（Server develop-sw、Web develop 的 ls-remote 原始输出与本地 HEAD 对照）。
- **自身收尾真实输出**：`raw/g10b-cleanup-readback-original.md`——端口 8080/5173 关闭瞬间 2→终态 0、进程 0、IAB 标签 2→0、`sw_p63_accept9` dropdb exit0、`sw_p63%` 计数 0、`/tmp/p63*` 0。
- **上轮收尾差异如实登记**：acceptance-08 收尾记录 sw_p63% 计数 0（12:10:21），本轮 12:36 实测上轮 `sw_p63_accept8` 空库残留（0 表、PG_VERSION 创建 11:40:41，非本轮创建）；本轮一并销毁（dropdb exit0）并回读 0；差异原因以现存原件无法判定，不做推测性补写。该库无任何 P63 对象。

## 3. REG-P63-Phase4CrashTest：审查08§3 合同裁决落既有登记（不新增执行权例外）

依审查08§3，对回执08 移交裁决事项终局登记如下（同步 knowledge 条目②）：

1. **合同解释**：P62 归档方向 U04 及「已固定边界」——待执行且无效果可过期；执行中超过截止只记超期、待权威结果；部分提交不得伪报无效果；时效表「全部收敛」**不等于全部成功**。回执08 所提「恢复与守截止天然互斥」「凡已受理且曾尝试即自动越过截止」的二选一**依裁决不成立**，予以更正。
2. **失败分类**：`Phase4PgStartWindowCrashTest.scheduledFlowWindowCrashRecoversToExactlyOnce` 原自然等待失败 = **装置时序与准入截止**（自连接终止致注入标记丢失→静默等待把强制重试推过准入截止→P63 领取守卫拒绝→已确认无效果命令对账 EXPIRED，属可解释无效果终态）；非产品恢复缺陷。G10b 兼容归属子项**核销**。
3. **等强度替代**：截止内恢复由 `P63FlowAdmissionRecoveryPgTest` 1/0（独立连接注入、恰一次恢复、重放幂等，acceptance-08 `raw/g10b-phase4-mechanism-original.md`）承担；原 1/1 失败与全量 286/3/0/27 exit1 原件保留，不拼成全绿。
4. **约束**：不再重跑旧自然等待用例/24 分钟全量；不改准入截止、共享重排或恢复合同；`:R<n>` 仍为审查03—04 已锁定的独立关联恢复尝试，不把「30 秒之后」当通用效果安全判据；本裁决不宣称 P62 延期性能预算已实测（P62 性能仍 Owner 延期未验证）。

## 4. 提交与读回

- Web：`2b0c660`（develop，fix(p63): 动态并行固定值接入人员/部门直接选择并以稳定ID数组落库），本地=远端；Server：无新提交（候选保持 `19d1da2`）；workspace：回执09 提交及其补记（回执自引用以稳定表述为准）。
- 证据清单：`G01a.md`、`G10b.md`、`browser/`×2 PNG+同名 md、`raw/g01a-designer-ui-chain-original.md`、`raw/g01a-validate-string-vs-array-original.md`、`raw/p63-backend9.log`、`raw/g10b-knowledge-full-readback-original.md`（补记）、`raw/g10b-git-lsremote-original.md`（补记）、`raw/g10b-cleanup-readback-original.md`。

## 5. 自身收尾

见 `raw/g10b-cleanup-readback-original.md`：自有后端/vite 精确 PID 关闭、IAB 标签关闭、隔离库销毁、tmp 清理，全部真实命令与终态读取，无重建库、无停用户服务（用户 PG 5432/Redis 6379 保持运行）。

## 6. 剩余与唯一下一动作

G01a/G10b 本轮处置完毕，待 Planner 复核核销（20/20 候选）。当前唯一下一动作 = Planner 复核 `completion-p63-mes-workflow-foundations-09.md` 与 `evidence/acceptance-09/`。P63 保持 VERIFYING，不进入阶段三。
