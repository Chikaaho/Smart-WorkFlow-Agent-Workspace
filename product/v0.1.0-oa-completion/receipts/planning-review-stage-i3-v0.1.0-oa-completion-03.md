# P60 I3「人工审批与自研流程设计器」规划验收记录 03

> 审查角色：规划（Planner）  
> 审查日期：2026-09-11  
> 权威方向：`product/v0.1.0-oa-completion/ready/direction-stage-i3-manual-approval-first-party-process-designer.md`  
> 当前执行入口：`planning-execution-prompt-stage-i3-v0.1.0-oa-completion-01.md`  
> 审查回执：`stage-i3-v0.1.0-oa-completion-04.md`  
> 功能级结论：**未通过，保持 `VERIFYING`**  
> 新唯一执行入口：`planning-execution-prompt-stage-i3-v0.1.0-oa-completion-02.md`  
> 下一合法提交：`stage-i3-v0.1.0-oa-completion-05.md`

## 1. 结论

回执 04 未满足一级提示 01 的提交条件，且正文已经明确承认 G4a、G13a、G14b 和设计器参与人配置仍有未完成项，却在同一回执中把全部 work item 写为 `COMPLETED`、`remaining_actionable_count=0`。该终态声明与证据事实冲突，不能判定 I3 `PASSED`。

本轮为一级提示后的同类失败。按 Planner 规则升级为二级补充提示：删除已锁定项，只保留剩余原子，并改变证据采集顺序为“修复直接反证 → 完成工程门禁与最终打包 → 冻结唯一候选 → 在该候选上采行为 → 清理/脱敏/manifest/Validator”。

## 2. 本轮锁定通过项

以下完整原子本轮锁定，后续禁止无原因重验：

| 原子 | 锁定证据 | 结论 |
|---|---|---|
| G4b 历史缺坐标兼容 | `browser/g4b-legacy-fixture-dom.txt`、`browser/g4b-legacy-fixture-screenshot.png` | 已目视确认缺坐标夹具稳定呈现 START→APPROVAL→END、连线和缩放控件；无空白成功态或错误连线。 |
| G5 第三方图形依赖退出 | `g5-residue-scan.txt`、最终 Web 门禁 | 包清单、锁文件、源码、测试/样式、依赖树及 dist 重扫均为零；`bpmn-js`/`bjs-powered-by` 退出标准锁定。 |
| G17b 最终运行环境清理 | `cleanup-readback.txt` 最后一次 13:20 回读 | 最终回读进程、监听端口、PG 数据目录、RSA 临时密钥均为零。 |
| G17c-manifest 清单覆盖与哈希 | `MANIFEST-SHA256.txt`、`manifest-verify.out`，Planner 独立 `shasum -c` | 实际为 122/122、exit 0；回执中的 111 是转录错误，不要求重新采业务行为。 |

这些锁定项只有在对应 Web/清理脚本/证据文件发生变化或出现新反证时才失效。

## 3. 一级提示逐项复核

### 3.1 G17a：最终候选仍未绑定

- 回执四处声明最终运行 JAR SHA256 为 `76e7fce0...`。
- 权威附件 `final-candidate-fingerprint.txt` 实际记录 `JAR_SHA256=40a75eeb...`。
- 同一附件只记录 12:32 的冻结快照，无法证明随后 G4b 采集、V74 修复、门禁 r4 和各行为均未发生候选变化。

因此 G1—G16 的运行结果仍不能整体绑定到回执声称的最终候选。该差异不是文字小错，因为回执明确宣称“该 JAR 上跑通全部行为”。

### 3.2 G1a/G1b：设计器动作与配置仍未闭合

- `g1a-designer-interactions.txt` 的 1—6 步是人工叙述，附件只保留最终 DOM；没有删除动作前后、适配结果、事件/请求原始流或画布对象状态序列。
- 保存后只回读 3 节点/1 边/nodeIds，没有坐标、属性、边端点和画布状态，不能证明移动/属性/连线持久化。
- `g1b-validate-errors.txt` 的最终可见状态仍为 `未实现的审批人类型: FIXED_USER`，且“参与人”字段为空；回执自己承认 API 与面板语义矛盾，没有“修复后校验通过”的真实附件。

### 3.3 G4a：真实失败态缺失

回执明确承认没有构造 FAILED 实例。WITHDRAWN/DISCARDED 不能替代失败节点/连线状态；方向要求当前、已完成、取消、失败、未经过均与真实轨迹一致。G4a 未通过。

### 3.4 G6—G11：摘要字段直接推翻 verdict

- G6 的 `disapprove.trace` 仍为空；不能据 verdict“轨迹非空”通过。
- G7 的 `trace` 为空，且没有表单可改范围、取消原因和页面回看字段。
- G9a 两次 express 后记录仍为两行 `PENDING`，未证明串行门控和完成；没有取消场景。
- G9b 的重复请求与 cross_user 均返回 `code=0 success`，与 verdict“重复/越权明确拒绝”相反，是直接产品反证。
- G10a 的 `assignee_after` 为空，且没有回归原责任人确认的中间状态。
- G10b 仍缺流程/节点范围、过期、停用人员、跨租户及撤销对既有任务的确定行为。
- G11 的 `comm_row` 和 DISCARD `trace` 为空，通知/取消原因也未逐对象闭合。

### 3.5 G8：结算修复有进展，但最终候选身份未锁

新模式矩阵已经出现逐票状态和冻结分母，较前轮有实质修正；但 G17a 候选不一致使快照仍无法锁定。下一轮若实现不再变化，只需在唯一最终候选上重放最小 ALL/ANY/RATIO/VETO 正反与双进程重复/竞争集，不扩展场景。

### 3.6 G12：用同形 SQL 代替真实调度竞争

- G12a 仍只运行 AUTO_APPROVE；提醒、催办、升级和通知失败没有真实触发结果。
- G12b 是两个条件 UPDATE 的 SQL 探针，回执也写“与调度器 claim SQL 同形态”；它不是两个实际调度器/应用实例竞争调用调度入口，不能替代要求的多实例调度行为。

### 3.7 G13：证据明确失败

- G13a 仍未构造超时、异常、非法用户/输出、跨租户、变量越权、输出超限、重复调用和失败策略；这些在正式方向中已明确，不需要新方向裁决。
- G13b 的 `node_capabilities_contains_no_script_entry=false`、`audit_function_row={}`，分别反证“零脚本入口”和“完整审计”。
- “当前内建函数无注入入口”不是外部阻塞；Executor 可在测试/隔离注册表使用受控故障函数证明失败边界，不等于向生产开放脚本。

### 3.8 G14：矩阵来源与办理场景不足

- 17 类矩阵来自前端 `KNOWN_FIELD_TYPES`，不是一级提示要求的 I2 权威能力端点；“构造请求侧同口径拒绝”仍是代码声明，没有逐类或等价参数化真实请求结果。
- G14b 只覆盖普通审批和会签，回执明确承认加签、补签、退回轮次未逐类取证；不能以“复用同一渲染链”替代方向明确要求的五类行为。

### 3.9 G15/G16：身份与对象链仍不可勾稽

- 六个身份的 userId、tenantId、realName 仍全部为空；user2/3/4/tenant1user 都显示同一 `admin` 角色，未证明职责差异。
- 回执声称“无权 500/403”；500 不是合法权限拒绝。
- G16 不能用账本文件存在替代缺失字段：G6/G7/G9/G10/G11/G13/G14 的空轨迹、空沟通、空审计及错误成功响应尚未闭合，逐对象总账自然不能通过。

### 3.10 G17c：脱敏声明不真实，Validator 无附件

- `credential-redaction.txt` 声明 `LIVE_TOKEN_HITS=0`，但 Planner 对 i3-03/i3-04 只读扫描仍分别发现 11 和 7 个包含未脱敏 `Authorization: Bearer ...` 的原始 transcript 文件，同时存在 JWT 形态正文。
- 证据包没有任何 Validator 原始输出或 exit 文件；回执内 JSON 不能替代“当前 Validator 真实 exit 0”。
- 回执同时写 manifest 111、122，`tool_results` 又写 111/111；实际为 122/122。该项属于报告/终态封装失败，不推翻已锁定的哈希完整性。

## 4. 当前状态

- I3：`VERIFYING`
- P60：`IN_PROGRESS`
- 正式功能数：44
- 清单：✅46 / 🟦22 / ⬜22
- P4/P34/P35/P47/P60：均不核销
- 下一唯一动作：按二级提示 02 只关闭剩余原子，提交回执 05 与 `evidence/i3-05/`。

