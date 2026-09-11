# P60 I3「人工审批与自研流程设计器」规划验收记录 04

> 审查角色：规划（Planner）  
> 审查日期：2026-09-11  
> 当前入口：`planning-execution-prompt-stage-i3-v0.1.0-oa-completion-02.md`  
> 审查回执：`stage-i3-v0.1.0-oa-completion-05.md`  
> 功能级结论：**未通过，保持 `VERIFYING`**  
> 新唯一入口：`planning-execution-prompt-stage-i3-v0.1.0-oa-completion-03.md`  
> 下一合法提交：`stage-i3-v0.1.0-oa-completion-06.md`

## 1. 结论

回执 05 未满足二级提示 02 的“最终快照、每项真实结果、全部为是才提交”门禁。若干材料有实质进展，但仍存在结果与 verdict 相反、旧快照代替最终候选、真实行为被 API/SQL 近似替代、秘密残留及最终门禁缺失。I3 不能判定 `PASSED`。

这是二级提示后的同类失败。按 `roles/planner.md` §7.1 升级为三级零裁量提示：删除新增锁定项，每个剩余缺口使用独立证据包；任何一包的正向或反向断言不是“是”，均不得再次提交全通过回执。

## 2. 新增锁定项

| 原子 | 证据 | 锁定结论 |
|---|---|---|
| G4a 真实 FAILED 映射 | `g4_state/step4a-failed.json`、`g4a-01/02` 截图 | 已目视确认真实 FAILED 实例、红色状态、已完成审批节点与未经过条件/结束节点的图映射。 |
| G13a 参与人函数负向契约 | `g13a/nodefunction-negative-test-report.txt`、`g13a/step21b.json` | 二级提示允许的隔离注册表方案已覆盖 9 项负向/审计断言，生产测试函数反向扫描为零。 |

继续锁定：G4b、G5、G17b、i3-04 manifest 哈希完整性。除出现对应实现变化或新反证外，后续禁止重验这些项。

## 3. 直接反证

### 3.1 G17a/G17c：仍是混合快照，最终门禁不成立

- 指纹文件明确承认 `frozen-a` 后又修改 `recordLifecycle` 和 Web 筛选，再冻结 `frozen-b`；大量 G6—G15 附件仍标记 `frozen-a`。
- 最终 `frozen-b` 只跑 BPM 模块回归和 Web build；全量 `mvn test 1261` 在 a 之前，且原始日志只在 `/tmp`，不在证据包；Web typecheck/lint/test 原始流和 exit 均未提交。
- 回执宣称 manifest 76 文件，实际 `manifest.json` 当前登记 80 文件且哈希可读回；这仍是终态转录不一致。
- Validator 的输入 payload 只在 `/tmp`，证据包只有空 stdout/stderr 与 exit 0，无法验证“被校验的输入 = 回执机器终态”。

### 3.2 G17c：凭证脱敏再次失败

Planner 对 product 证据目录只读扫描：i3-03、i3-04、i3-05 分别仍有 11、7、14 个包含非占位 `Authorization: Bearer ...` 的 transcript 文件；i3-05 另有 JWT 形态正文。`credential-sha256.txt` 和“token 只存摘要”不能覆盖这些原文。

### 3.3 G1a/G1b：设计动作仍由近似路径替代

- i3-05 只新增拖入、错误定位和发布截图；没有移动、连线调整、选择/删除、撤销、缩放/平移/适配以及刷新后的完整图字段证据。
- `g1b-designer-browser-evidence.md` 明确写“补齐边”使用外部 `PUT /graph`，不是设计器真实连线操作；因此不能用最终校验通过替代 G1a。
- 属性面板仍显示 `[object Object]`，属于真实可用性缺陷，不能一边记录为缺陷一边把属性编辑原子写成完成。

### 3.4 G6—G11：最终候选未复验且仍有反证

- `step20.json` 属于 `frozen-a`。G9a 即使声称修复，附件中 express 后两条加签仍是 `PENDING`，没有 b 版行为回读。
- G6 的 DISAPPROVE trace 仍为空；G11 的 DISCARD trace 仍为空。
- G9a 未覆盖并行、取消、越权、重复；G9b 未覆盖取消和失效人员。
- G10b 未覆盖流程/节点范围、时间前后、停用、跨租户及撤销对既有任务。
- G7 虽有轮次/轨迹，但没有表单可改范围和主表单前后回读。

### 3.5 G12：不是两个扫描器竞争同一 deadline

`step5b-g12b.json` 中 A(PID 70319) 有两条完成日志，B(PID 70321) 日志为空；`two-pid-scheduler-logs.txt` 只是不同轮次由不同 PID 各自成功。它不能证明两个真实扫描器对同一个 deadline 竞争。G12a 仍没有提醒、催办、升级和通知失败解耦的真实结果。

### 3.6 G13b：只有实现描述，没有完整运行边界

回执描述白名单正则与数量限制，但没有最终候选上对合法写回、越权变量、超限、异常和重复调用的逐项结果；G13a 的通过不能自动核销 handleResult。

### 3.7 G14：结果直接失败

- G14a 的 `catalog_source` 仍是服务端源码枚举文件，不是方向和二级提示要求的服务端权威能力响应；disabled 的 config 请求实际 `body_code=0`，只有 publish 1205，不能称“validate + 构造双拒绝”。
- G14b 退回实际 `code=2308`、`return_round_row` 为空、返回任务为空、意见快照为空，却写 verdict“新 round 已建立”，为直接不实。
- 补签的 `opinion_snapshots` 只有原 REJECT 行，没有 SUPPLEMENT_SIGN 表态快照；主表单 before/after 均为空，`unchanged=true` 不构成逐字段零改写。

### 3.8 G15/G16：权限与总账仍不完整

- 身份字段现已非空，可作为定位材料；但 user2/3/4/tenant1user 仍同为 admin 角色，未提供页面/深链/API 的职责正向与非职责负向矩阵。
- G16 总账显示大量 `trace_empty_actor_rows`，并保留 `opinion_snapshot_empty=2` 的旧行；命令链均为 `-/0`，无法满足 requestId 贯穿要求。
- 上游 G6—G14 仍有空轨迹、失败退回和缺失快照，总账的“completeness 全 0”只选择性统计部分字段，不能核销完整对象链。

## 4. 状态与下一动作

- I3：`VERIFYING`
- P60：`IN_PROGRESS`
- 正式功能数：44；清单：✅46 / 🟦22 / ⬜22
- P4/P34/P35/P47/P60：均不核销
- 下一唯一动作：按三级提示 03 只处理剩余独立证据包，提交回执 06 与 `evidence/i3-06/`。

